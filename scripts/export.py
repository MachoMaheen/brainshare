#!/usr/bin/env python3
"""
Pull a full backup of the publisher's KV namespace as NDJSON.

Each line is a JSON object: {"key": "...", "value": "..."}
Keys are namespaced like:
  - note:<ulid>      raw markdown
  - meta:<ulid>      filename metadata
  - wrap:<id>        wrapper bundle JSON
  - revoked:<jti>    revoked token marker
  - views:<jti>      view counter
  - ratelimit:...    transient rate-limit counters (will be stale; ignore on restore)

Usage:
  ./export.py <publisher-url> <publisher-token> [out.ndjson]

The output file defaults to brainshare-backup-YYYYMMDD-HHMMSS.ndjson in cwd.
"""
import datetime
import os
import sys
import urllib.error
import urllib.request


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        return 2
    url = sys.argv[1].rstrip("/")
    token = sys.argv[2]
    out = (
        sys.argv[3]
        if len(sys.argv) > 3
        else f"brainshare-backup-{datetime.datetime.now():%Y%m%d-%H%M%S}.ndjson"
    )

    req = urllib.request.Request(
        f"{url}/api/export",
        method="GET",
        headers={
            "authorization": f"Bearer {token}",
            "user-agent": "brainshare-export/0.1",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r, open(out, "wb") as f:
            total = 0
            while True:
                chunk = r.read(64 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                total += len(chunk)
        keys = sum(1 for _ in open(out, "rb"))
        print(f"saved {total:,} bytes / {keys} keys → {out}")
        return 0
    except urllib.error.HTTPError as e:
        print(f"failed: {e.code} {e.read().decode(errors='replace')}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
