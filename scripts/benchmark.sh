#!/bin/sh
# benchmark.sh — BrainShare worker latency + cache benchmarker
#
# Usage:
#   ./scripts/benchmark.sh <wrap-id> <note-ulid> [--token <jwt>] [--warm] [--diff]
#
# Flags:
#   --token <jwt>   Append ?t=<jwt> to every request (gated wraps)
#   --warm          5 throwaway hits per route before measuring
#   --diff          Run benchmark, pause for a publish, run again, show comparison
#
# Requires: curl, awk, sort, wc (all POSIX)
# User-Agent note: Cloudflare bot-fight on *.workers.dev blocks default curl UA
# with HTTP 403 "error code: 1010". We set a custom UA to avoid this.

set -e

BASE_URL="https://brainshare-publisher.machomaheen.workers.dev"
REPS=50
UA="BrainShare-benchmark/0.1"

# ── argument parsing ──────────────────────────────────────────────────────────
WRAP_ID=""
NOTE_ULID=""
TOKEN=""
WARM=0
DIFF=0

while [ $# -gt 0 ]; do
  case "$1" in
    --token)  TOKEN="$2"; shift 2 ;;
    --warm)   WARM=1; shift ;;
    --diff)   DIFF=1; shift ;;
    -*)       printf "Unknown flag: %s\n" "$1" >&2; exit 1 ;;
    *)
      if [ -z "$WRAP_ID" ]; then
        WRAP_ID="$1"
      elif [ -z "$NOTE_ULID" ]; then
        NOTE_ULID="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$WRAP_ID" ] || [ -z "$NOTE_ULID" ]; then
  printf "Usage: %s <wrap-id> <note-ulid> [--token <jwt>] [--warm] [--diff]\n" "$0" >&2
  exit 1
fi

# ── helpers ───────────────────────────────────────────────────────────────────

build_url() {
  local path="$1"
  if [ -n "$TOKEN" ]; then
    printf "%s%s?t=%s" "$BASE_URL" "$path" "$TOKEN"
  else
    printf "%s%s" "$BASE_URL" "$path"
  fi
}

# Fetch one URL; print three lines: time_ms  http_code  cf_cache_status
# On curl failure prints: ERROR  000  -
fetch_one() {
  local url="$1"
  local tmpheaders
  tmpheaders="$(mktemp)"

  # -D - dumps headers to stdout; we redirect header block to tmpheaders
  # -o /dev/null discards body; -w appends timing/code after body
  result="$(curl -sS --max-time 15 \
    -A "$UA" \
    -D "$tmpheaders" \
    -o /dev/null \
    -w '%{time_total} %{http_code}' \
    "$url" 2>/dev/null)" || {
      printf "ERROR 000 -\n"
      rm -f "$tmpheaders"
      return
    }

  time_s="$(printf "%s" "$result" | awk '{print $1}')"
  code="$(printf "%s" "$result"   | awk '{print $2}')"

  # Convert seconds to ms (awk, POSIX)
  time_ms="$(printf "%s" "$time_s" | awk '{printf "%.0f", $1 * 1000}')"

  # Extract cf-cache-status from saved headers (case-insensitive grep-like awk)
  cf_status="$(awk 'tolower($0) ~ /^cf-cache-status:/ {
    sub(/^[^:]*: */, ""); gsub(/\r/, ""); print; exit
  }' "$tmpheaders")"
  cf_status="${cf_status:--}"   # default to "-" if header absent

  rm -f "$tmpheaders"
  printf "%s %s %s\n" "$time_ms" "$code" "$cf_status"
}

# Warm up: N throwaway hits, discard results
warmup() {
  local url="$1"
  local n="$2"
  local i=0
  printf "  warming up (%s hits)..." "$n"
  while [ $i -lt "$n" ]; do
    curl -sS --max-time 15 -A "$UA" -o /dev/null "$url" 2>/dev/null || true
    i=$((i + 1))
  done
  printf " done\n"
}

# Run REPS hits against a URL; collect raw data into a temp file
# Prints path to temp file (caller must rm)
collect() {
  local url="$1"
  local tmpfile
  tmpfile="$(mktemp)"
  local i=0
  local errors=0

  while [ $i -lt "$REPS" ]; do
    line="$(fetch_one "$url")"
    if printf "%s" "$line" | grep -q "^ERROR"; then
      errors=$((errors + 1))
      printf "  WARNING: curl failed on rep %d, skipping\n" "$((i+1))" >&2
    else
      printf "%s\n" "$line" >> "$tmpfile"
    fi
    i=$((i + 1))
  done

  if [ $errors -gt 0 ]; then
    printf "  WARNING: %d/%d requests failed and were skipped\n" "$errors" "$REPS" >&2
  fi

  printf "%s" "$tmpfile"
}

# Compute p50/p95/p99 + cold (first) latency from a data file
# Also report cf-cache-status distribution and one sample size
stats() {
  local datafile="$1"

  # latencies only (col 1), sorted numerically
  latencies="$(awk '{print $1}' "$datafile" | sort -n)"
  count="$(printf "%s" "$latencies" | wc -l | tr -d ' ')"

  if [ "$count" -eq 0 ]; then
    printf "  No successful data points\n"
    return
  fi

  cold="$(printf "%s" "$latencies" | awk 'NR==1{print}')"
  p50_idx=$(( (count * 50  + 99) / 100 ))
  p95_idx=$(( (count * 95  + 99) / 100 ))
  p99_idx=$(( (count * 99  + 99) / 100 ))

  p50="$(printf "%s" "$latencies" | awk -v n="$p50_idx" 'NR==n{print}')"
  p95="$(printf "%s" "$latencies" | awk -v n="$p95_idx" 'NR==n{print}')"
  p99="$(printf "%s" "$latencies" | awk -v n="$p99_idx" 'NR==n{print}')"

  # HTTP status distribution
  http_dist="$(awk '{print $2}' "$datafile" | sort | uniq -c | sort -rn | \
    awk '{printf "%s:%s ", $2, $1}')"

  # cf-cache-status distribution
  cache_dist="$(awk '{print $3}' "$datafile" | sort | uniq -c | sort -rn | \
    awk '{printf "%s:%s ", $2, $1}')"

  printf "  Cold (1st req) : %s ms\n"  "$cold"
  printf "  p50            : %s ms\n"  "$p50"
  printf "  p95            : %s ms\n"  "$p95"
  printf "  p99            : %s ms\n"  "$p99"
  printf "  HTTP status    : %s\n"     "$http_dist"
  printf "  cf-cache-status: %s\n"     "$cache_dist"
  printf "  Samples        : %s/%s\n"  "$count" "$REPS"
}

# Benchmark a single URL: print header, optionally warm, collect raw data.
# Stats printing is the CALLER's responsibility.
# Returns temp datafile path in LAST_DATAFILE (caller must rm).
benchmark_route() {
  local label="$1"
  local url="$2"

  printf "\n[%s]\n" "$label"
  printf "  URL: %s\n" "$url"

  if [ "$WARM" -eq 1 ]; then
    warmup "$url" 5
  fi

  printf "  Running %s requests...\n" "$REPS"
  LAST_DATAFILE="$(collect "$url")"
}

# ── diff comparison helper ────────────────────────────────────────────────────

extract_stat() {
  # extract a named stat value from stats output stored in a file
  local statsfile="$1"
  local label="$2"
  grep "$label" "$statsfile" | awk -F: '{gsub(/ /,"",$2); print $2}' | tr -d ' ms'
}

side_by_side() {
  local before_file="$1"
  local after_file="$2"
  local route_label="$3"

  printf "\n%-22s  %-14s  %-14s  %s\n" "  $route_label" "BEFORE" "AFTER" "DELTA"
  printf "  %s\n" "$(printf '%.0s-' $(seq 1 60))"

  for metric in "Cold" "p50" "p95" "p99"; do
    bval="$(grep "$metric" "$before_file" | awk '{print $NF}' | tr -d 'ms')"
    aval="$(grep "$metric" "$after_file"  | awk '{print $NF}' | tr -d 'ms')"
    if [ -n "$bval" ] && [ -n "$aval" ]; then
      delta="$(awk -v b="$bval" -v a="$aval" 'BEGIN{printf "%+.0f ms", a-b}')"
    else
      delta="n/a"
    fi
    printf "  %-20s  %-14s  %-14s  %s\n" "$metric (ms)" "${bval} ms" "${aval} ms" "$delta"
  done

  printf "  %-20s  " "cf-cache-status"
  grep "cf-cache-status" "$before_file" | awk '{$1=$1; print}' | sed 's/cf-cache-status: *//' | tr -d '\n'
  printf "  "
  grep "cf-cache-status" "$after_file"  | awk '{$1=$1; print}' | sed 's/cf-cache-status: *//'
}

# ── main run ──────────────────────────────────────────────────────────────────

URL_WRAP="$(build_url "/share/${WRAP_ID}")"
URL_NOTE="$(build_url "/share/${WRAP_ID}/${NOTE_ULID}")"

run_full_benchmark() {
  local suffix="${1:-}"
  local wrap_stats_file note_stats_file

  benchmark_route "GET /share/${WRAP_ID}${suffix}" "$URL_WRAP"
  wrap_data="$LAST_DATAFILE"
  wrap_stats_file="$(mktemp)"
  stats "$wrap_data" > "$wrap_stats_file"
  rm -f "$wrap_data"

  benchmark_route "GET /share/${WRAP_ID}/${NOTE_ULID}${suffix}" "$URL_NOTE"
  note_data="$LAST_DATAFILE"
  note_stats_file="$(mktemp)"
  stats "$note_data" > "$note_stats_file"
  rm -f "$note_data"

  printf "\n%s\n" "$wrap_stats_file $note_stats_file"
}

printf "==========================================================\n"
printf "  BrainShare Worker Benchmark\n"
printf "  Worker  : %s\n" "$BASE_URL"
printf "  Wrap-ID : %s\n" "$WRAP_ID"
printf "  Note    : %s\n" "$NOTE_ULID"
printf "  Reps    : %s\n" "$REPS"
printf "  Warm    : %s\n" "$([ $WARM -eq 1 ] && echo yes || echo no)"
printf "  Token   : %s\n" "$([ -n "$TOKEN" ] && echo yes || echo no)"
printf "==========================================================\n"

if [ "$DIFF" -eq 1 ]; then
  printf "\n--- BEFORE ---\n"

  # before: benchmark both routes, save stats to temp files
  benchmark_route "GET /share/${WRAP_ID}" "$URL_WRAP"
  wrap_before_stats="$(mktemp)"
  stats "$LAST_DATAFILE" | tee "$wrap_before_stats"
  rm -f "$LAST_DATAFILE"

  benchmark_route "GET /share/${WRAP_ID}/${NOTE_ULID}" "$URL_NOTE"
  note_before_stats="$(mktemp)"
  stats "$LAST_DATAFILE" | tee "$note_before_stats"
  rm -f "$LAST_DATAFILE"

  printf "\n----------------------------------------------------------\n"
  printf "  Publish something now, then press Enter to continue...\n"
  printf "----------------------------------------------------------\n"
  read -r _dummy

  printf "\n--- AFTER ---\n"

  benchmark_route "GET /share/${WRAP_ID}" "$URL_WRAP"
  wrap_after_stats="$(mktemp)"
  stats "$LAST_DATAFILE" | tee "$wrap_after_stats"
  rm -f "$LAST_DATAFILE"

  benchmark_route "GET /share/${WRAP_ID}/${NOTE_ULID}" "$URL_NOTE"
  note_after_stats="$(mktemp)"
  stats "$LAST_DATAFILE" | tee "$note_after_stats"
  rm -f "$LAST_DATAFILE"

  printf "\n========== DIFF COMPARISON ===============================\n"
  side_by_side "$wrap_before_stats" "$wrap_after_stats" "wrapper landing"
  side_by_side "$note_before_stats" "$note_after_stats" "scoped note"
  printf "==========================================================\n"

  rm -f "$wrap_before_stats" "$note_before_stats" "$wrap_after_stats" "$note_after_stats"

else
  benchmark_route "GET /share/${WRAP_ID}" "$URL_WRAP"
  stats "$LAST_DATAFILE"
  rm -f "$LAST_DATAFILE"

  benchmark_route "GET /share/${WRAP_ID}/${NOTE_ULID}" "$URL_NOTE"
  stats "$LAST_DATAFILE"
  rm -f "$LAST_DATAFILE"
fi

printf "\n==========================================================\n"
printf "  Done.\n"
printf "==========================================================\n"
