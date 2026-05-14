#!/usr/bin/env node
// One-off: build wrapindex:{wrapId} for every existing wrap that doesn't
// have one yet. After deploying the perf optimization that introduced the
// precomputed wrap index, legacy wraps still hit the slow fallback path on
// every cache miss until a write event triggers a rebuild. This script
// rebuilds them in one pass.
//
// Usage:
//   CLOUDFLARE_API_TOKEN=<token> \
//     node publisher/scripts/backfill-wrapindex.mjs [flags]
//
//   Flags:
//     --dry-run         Build indexes in memory; don't PUT them
//     --filter <substr> Only process wrap IDs containing <substr>
//     --skip-existing   Skip wraps that already have a wrapindex:* key
//     --concurrency=N   Parallel KV reads per wrap (default 16)
//
// Auth: create a Cloudflare API token at
//   https://dash.cloudflare.com/profile/api-tokens
//   → "Create Token" → "Edit Cloudflare Workers" (or custom: Workers KV
//   Storage: Edit, account-scoped).
//
// Account ID is auto-detected via `wrangler whoami`. To override:
//   CLOUDFLARE_ACCOUNT_ID=<id> ...
//
// This script ONLY writes new wrapindex:{id} keys. It does not mutate any
// existing data, and never touches the live worker.

import { execSync } from "node:child_process";

// ── config ────────────────────────────────────────────────────────────────────

const NAMESPACE_ID = "d1742c152ca44f1da9a0370b54477b95"; // NOTES, from wrangler.toml
const API_BASE = "https://api.cloudflare.com/client/v4";

// ── parseFrontmatter — KEEP IN SYNC with publisher/src/render.ts:2200 ─────────
// Verbatim port. If render.ts changes, mirror it here.

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: null, body: md };
  const raw = m[1];
  const byKey = new Map();
  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) { i++; continue; }
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      const items = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      byKey.set(key, items);
      i++; continue;
    }
    if (val === "" && lines[i + 1]?.match(/^\s+-\s/)) {
      const items = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-\s/)) {
        items.push(lines[i].replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
        i++;
      }
      byKey.set(key, items);
      continue;
    }
    val = val.replace(/^["']|["']$/g, "");
    byKey.set(key, val);
    i++;
  }
  return { fm: { byKey }, body: md.slice(m[0].length) };
}

// ── buildBacklinks — KEEP IN SYNC with publisher/src/render.ts:3005 ───────────

function buildBacklinks(records) {
  const setByBasename = new Map();
  for (const r of records) {
    if (!setByBasename.has(r.basename)) setByBasename.set(r.basename, r.ulid);
  }
  const byTarget = new Map();
  const seen = new Set();
  for (const source of records) {
    if (!source.md) continue;
    const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match;
    while ((match = re.exec(source.md))) {
      const target = match[1].trim();
      const targetUlid = setByBasename.get(target);
      if (!targetUlid || targetUlid === source.ulid) continue;
      const k = `${targetUlid}|${source.ulid}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const list = byTarget.get(targetUlid) ?? [];
      list.push({ ulid: source.ulid, basename: source.basename, path: source.path, title: source.title });
      byTarget.set(targetUlid, list);
    }
  }
  return byTarget;
}

// ── REST API client ──────────────────────────────────────────────────────────

class KvClient {
  constructor(token, accountId, namespaceId) {
    this.token = token;
    this.base = `${API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`;
  }

  async listKeys(prefix) {
    const keys = [];
    let cursor;
    do {
      const url = new URL(`${this.base}/keys`);
      url.searchParams.set("prefix", prefix);
      url.searchParams.set("limit", "1000");
      if (cursor) url.searchParams.set("cursor", cursor);
      const r = await fetch(url, { headers: { authorization: `Bearer ${this.token}` } });
      const data = await r.json();
      if (!data.success) throw new Error(`list ${prefix}: ${JSON.stringify(data.errors)}`);
      for (const k of data.result) keys.push(k.name);
      const info = data.result_info ?? {};
      cursor = info.list_complete ? undefined : info.cursor;
    } while (cursor);
    return keys;
  }

  async get(key) {
    const r = await fetch(`${this.base}/values/${encodeURIComponent(key)}`, {
      headers: { authorization: `Bearer ${this.token}` },
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`get ${key}: ${r.status} ${await r.text()}`);
    return r.text();
  }

  async put(key, value) {
    const r = await fetch(`${this.base}/values/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "text/plain" },
      body: value,
    });
    if (!r.ok) throw new Error(`put ${key}: ${r.status} ${await r.text()}`);
  }
}

// ── concurrency limiter ──────────────────────────────────────────────────────

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

// ── auth helpers ─────────────────────────────────────────────────────────────

function detectAccountId() {
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return process.env.CLOUDFLARE_ACCOUNT_ID;
  try {
    const out = execSync("./node_modules/.bin/wrangler whoami", { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
    const match = out.match(/\b[a-f0-9]{32}\b/);
    if (match) return match[0];
  } catch {
    // fall through
  }
  return null;
}

function requireAuth() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.error("error: CLOUDFLARE_API_TOKEN is not set.");
    console.error("       Create one at https://dash.cloudflare.com/profile/api-tokens");
    console.error("       (template: 'Edit Cloudflare Workers', or custom: KV Storage Edit).");
    process.exit(2);
  }
  const accountId = detectAccountId();
  if (!accountId) {
    console.error("error: could not detect CLOUDFLARE_ACCOUNT_ID.");
    console.error("       Set it explicitly, or ensure `wrangler whoami` works in this directory.");
    process.exit(2);
  }
  return { token, accountId };
}

// ── core: build one wrapindex (mirrors buildWrapIndex in src/index.ts) ───────

async function buildOneIndex(kv, wrapId, wrap, opts) {
  const concurrency = opts.concurrency ?? 16;

  // Read version stamp (default 1 if absent — matches getWrapVersion in worker).
  const verRaw = await kv.get(`ver:${wrapId}`);
  const ver = verRaw ? parseInt(verRaw, 10) : 1;

  // Fan-out: read note: + meta: for every ULID in parallel.
  const records = await mapLimit(wrap.ulids ?? [], concurrency, async (u) => {
    const [md, metaRaw] = await Promise.all([
      kv.get(`note:${u}`),
      kv.get(`meta:${u}`),
    ]);
    const meta = metaRaw ? safeJson(metaRaw, { path: "", basename: u }) : { path: "", basename: u };

    // Title: body H1 → frontmatter title → basename (matches buildWrapIndex).
    let title = meta.basename || u;
    if (md) {
      const { fm, body } = parseFrontmatter(md);
      const h1Match = body.match(/^\s*#\s+(.+?)\s*$/m);
      const bodyH1 = h1Match ? h1Match[1].trim() : "";
      const fmTitle = fm?.byKey.get("title");
      title = bodyH1 || (typeof fmTitle === "string" ? fmTitle : "") || meta.basename || u;
    }

    return {
      ulid: u,
      basename: meta.basename || u,
      path: meta.path || "",
      title,
      md, // kept on this temporary record so buildBacklinks can scan it
    };
  });

  // Canvas metadata (path + basename only — no body needed).
  const canvases = await mapLimit(wrap.canvases ?? [], concurrency, async (u) => {
    const raw = await kv.get(`canvasmeta:${u}`);
    if (!raw) return { ulid: u, path: "", basename: u };
    const m = safeJson(raw, null);
    return m ? { ulid: u, path: m.path || "", basename: m.basename || u } : { ulid: u, path: "", basename: u };
  });

  // Backlinks: scan every note body for [[wikilinks]], invert to target→sources.
  const backlinksMap = buildBacklinks(records);
  const backlinks = {};
  for (const [targetUlid, sources] of backlinksMap) {
    backlinks[targetUlid] = sources.map(({ ulid, title, path }) => ({ ulid, title, path }));
  }

  const idx = {
    notes: records.map(({ ulid, basename, path, title }) => ({ ulid, basename, path, title })),
    canvases,
    backlinks,
    builtAt: new Date().toISOString(),
    builtForVersion: ver,
  };

  const json = JSON.stringify(idx);
  if (!opts.dryRun) await kv.put(`wrapindex:${wrapId}`, json);

  return {
    notes: records.length,
    canvases: canvases.length,
    backlinkPairs: Object.values(backlinks).reduce((a, b) => a + b.length, 0),
    sizeKb: Math.round(json.length / 1024),
  };
}

function safeJson(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const skipExisting = argv.includes("--skip-existing");
  const filterIdx = argv.indexOf("--filter");
  const filter = filterIdx >= 0 ? argv[filterIdx + 1] : "";
  const concArg = argv.find((a) => a.startsWith("--concurrency="));
  const concurrency = concArg ? parseInt(concArg.split("=")[1], 10) : 16;

  const { token, accountId } = requireAuth();
  const kv = new KvClient(token, accountId, NAMESPACE_ID);

  console.log(`backfill-wrapindex`);
  console.log(`  account:    ${accountId}`);
  console.log(`  namespace:  ${NAMESPACE_ID}`);
  console.log(`  dry-run:    ${dryRun}`);
  console.log(`  filter:     ${filter || "(none)"}`);
  console.log(`  concurrency:${concurrency}`);
  console.log("");

  console.log("Listing wrap:* keys…");
  const wrapKeys = await kv.listKeys("wrap:");
  const wrapIds = wrapKeys.map((k) => k.slice("wrap:".length));
  console.log(`  found ${wrapIds.length} wraps`);

  let targets = filter ? wrapIds.filter((id) => id.includes(filter)) : wrapIds;
  if (filter) console.log(`  filtered to ${targets.length} matching "${filter}"`);

  if (skipExisting) {
    const existing = await kv.listKeys("wrapindex:");
    const have = new Set(existing.map((k) => k.slice("wrapindex:".length)));
    const before = targets.length;
    targets = targets.filter((id) => !have.has(id));
    console.log(`  skipped ${before - targets.length} wraps already indexed; ${targets.length} to build`);
  }

  console.log("");

  let ok = 0, fail = 0;
  const t0 = Date.now();

  for (let i = 0; i < targets.length; i++) {
    const wrapId = targets[i];
    const prefix = `[${i + 1}/${targets.length}] ${wrapId}`;
    try {
      const raw = await kv.get(`wrap:${wrapId}`);
      if (!raw) { console.log(`${prefix}  SKIP (wrap: key missing)`); continue; }
      const wrap = safeJson(raw, null);
      if (!wrap) { console.log(`${prefix}  SKIP (wrap json invalid)`); continue; }
      const start = Date.now();
      const stats = await buildOneIndex(kv, wrapId, wrap, { dryRun, concurrency });
      const ms = Date.now() - start;
      console.log(`${prefix}  ${dryRun ? "[dry] " : ""}notes=${stats.notes} canvases=${stats.canvases} backlinks=${stats.backlinkPairs} size=${stats.sizeKb}KB ${ms}ms`);
      ok++;
    } catch (err) {
      console.log(`${prefix}  FAIL: ${err.message}`);
      fail++;
    }
  }

  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  console.log(`=== ${ok} built, ${fail} failed in ${totalSec}s ===`);
  if (dryRun) console.log("(dry-run — nothing was written)");
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
