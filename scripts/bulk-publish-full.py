#!/usr/bin/env python3
"""
Bulk-publish a full vault: notes (.md) + canvases (.canvas) + image assets.

Usage: bulk-publish-full.py <vault-path> <publisher-url> <token>

Output:
  one line per item — STAMP/----/CANVAS/ASSET + key + HTTP code + relpath
  then summary lines:
    NOTE_ULIDS:    [...]
    CANVAS_ULIDS:  [...]
    ASSETS:        {filename: key, ...}

The wrapper PUT body should set ulids = NOTE_ULIDS, canvases = CANVAS_ULIDS,
assets = ASSETS, so the worker's renderNote can resolve image embeds and
the wrapper landing can list canvases.
"""
import hashlib
import json
import mimetypes
import re
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
IMG_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".bmp"}


def ulid() -> str:
    t = int(time.time() * 1000)
    time_part = ""
    for _ in range(10):
        time_part = ENC[t % 32] + time_part
        t //= 32
    rand_part = "".join(ENC[secrets.randbelow(32)] for _ in range(16))
    return time_part + rand_part


def stamp_id(text: str) -> tuple[str, str, bool]:
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if m:
        fm = m.group(1)
        existing = re.search(r"^id\s*:\s*([0-9A-HJKMNP-TV-Z]{26})\s*$", fm, re.MULTILINE)
        if existing:
            return text, existing.group(1), False
        new_id = ulid()
        new_fm = fm + f"\nid: {new_id}"
        new_text = f"---\n{new_fm}\n---\n" + text[m.end():]
        return new_text, new_id, True
    new_id = ulid()
    return f"---\nid: {new_id}\n---\n\n" + text, new_id, True


def http_put(url: str, token: str, body: bytes, content_type: str, extra_headers: dict, timeout: int = 30, retries: int = 3) -> tuple[int, str]:
    headers = {
        "authorization": f"Bearer {token}",
        "content-type": content_type,
        "user-agent": "BrainShare-bulk-publish/0.2",
        **extra_headers,
    }
    last_err = None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, method="PUT", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, r.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(5 + attempt * 5)
                continue
            return e.code, e.read().decode("utf-8", errors="replace")
        except Exception as e:
            last_err = e
            time.sleep(2)
    return -1, f"exhausted retries: {last_err}"


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__)
        return 2
    vault = Path(sys.argv[1]).expanduser().resolve()
    base = sys.argv[2].rstrip("/")
    token = sys.argv[3]
    if not vault.is_dir():
        print(f"vault not a directory: {vault}", file=sys.stderr)
        return 2

    note_ulids: list[str] = []
    canvas_ulids: list[str] = []
    assets: dict[str, str] = {}
    failed: list[tuple[str, int]] = []

    for f in sorted(vault.rglob("*")):
        if not f.is_file():
            continue
        if ".obsidian" in f.parts or ".trash" in f.parts or ".git" in f.parts:
            continue
        rel = str(f.relative_to(vault))
        ext = f.suffix.lower()

        # Markdown notes — stamp + publish, but skip files that are body-empty
        # (frontmatter only, or zero bytes). Publishing them creates ULID-only
        # entries in KV that render as "empty note" placeholders for recipients.
        if ext == ".md":
            text = f.read_text(encoding="utf-8")
            # Strip frontmatter to inspect actual body content
            body_only = re.sub(r"^---\n.*?\n---\n?", "", text, count=1, flags=re.DOTALL)
            if not body_only.strip():
                print(f"SKIP   (empty body)        {rel}", flush=True)
                continue
            new_text, ulid_, stamped = stamp_id(text)
            if stamped:
                f.write_text(new_text, encoding="utf-8")
            code, _ = http_put(
                f"{base}/api/notes/{ulid_}",
                token,
                new_text.encode("utf-8"),
                "text/markdown",
                {"x-note-path": urllib.parse.quote(rel, safe="/")},
            )
            flag = "STAMP" if stamped else "----"
            print(f"{flag} {ulid_}  HTTP {code}  {rel}", flush=True)
            if 200 <= code < 300:
                note_ulids.append(ulid_)
            else:
                failed.append((rel, code))
            time.sleep(0.5)

        # Canvases — generate a ULID per canvas, publish JSON
        elif ext == ".canvas":
            canvas_ulid = ulid()
            body = f.read_bytes()
            code, _ = http_put(
                f"{base}/api/canvases/{canvas_ulid}",
                token,
                body,
                "application/json",
                {"x-note-path": urllib.parse.quote(rel, safe="/")},
            )
            print(f"CANVAS {canvas_ulid}  HTTP {code}  {rel}", flush=True)
            if 200 <= code < 300:
                canvas_ulids.append(canvas_ulid)
            else:
                failed.append((rel, code))
            time.sleep(0.5)

        # Image assets — sha256 keyed for dedup, content-type from extension
        elif ext in IMG_EXTS:
            data = f.read_bytes()
            key = hashlib.sha256(data).hexdigest()
            ct = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
            code, _ = http_put(
                f"{base}/api/assets/{key}",
                token,
                data,
                ct,
                {},
            )
            print(f"ASSET  {key[:16]}…  HTTP {code}  {rel}", flush=True)
            if 200 <= code < 300:
                # Both full path and basename — renderNote tries both
                assets[rel] = key
                assets[f.name] = key
            else:
                failed.append((rel, code))
            time.sleep(0.4)

    print()
    print(f"=== {len(note_ulids)} notes, {len(canvas_ulids)} canvases, {len(assets) // 2} assets, {len(failed)} failed ===")
    if failed:
        for rel, code in failed:
            print(f"  FAIL {code}  {rel}")
    print()
    print("NOTE_ULIDS:", json.dumps(note_ulids))
    print("CANVAS_ULIDS:", json.dumps(canvas_ulids))
    print("ASSETS:", json.dumps(assets))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
