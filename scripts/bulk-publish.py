#!/usr/bin/env python3
"""
Bulk-stamp + bulk-publish a vault. Mirrors the BrainShare plugin's per-note
behavior, but runs over every .md in the vault in a single pass.

Usage:  bulk-publish.py <vault-path> <publisher-url> <token>

Output: prints one line per note (stamp/skip + HTTP code + relative path),
        then a JSON array of all successfully-published ULIDs.
"""
import json
import os
import re
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"  # Crockford base32


def ulid() -> str:
    """Generate a 26-char Crockford-base32 ULID (10 time + 16 random)."""
    t = int(time.time() * 1000)
    time_part = ""
    for _ in range(10):
        time_part = ENC[t % 32] + time_part
        t //= 32
    rand_part = "".join(ENC[secrets.randbelow(32)] for _ in range(16))
    return time_part + rand_part


def stamp(text: str) -> tuple[str, str, bool]:
    """
    Add `id: <ulid>` to frontmatter if missing.
    Returns (new_text, ulid, was_stamped).
    """
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if m:
        fm = m.group(1)
        existing = re.search(r"^id\s*:\s*([0-9A-HJKMNP-TV-Z]{26})\s*$", fm, re.MULTILINE)
        if existing:
            return text, existing.group(1), False
        new_id = ulid()
        new_fm = fm + f"\nid: {new_id}"
        new_text = f"---\n{new_fm}\n---\n" + text[m.end() :]
        return new_text, new_id, True
    new_id = ulid()
    return f"---\nid: {new_id}\n---\n\n" + text, new_id, True


def publish(
    url: str, token: str, ulid_: str, content: str, note_path: str
) -> tuple[int, str]:
    req = urllib.request.Request(
        f"{url}/api/notes/{ulid_}",
        data=content.encode("utf-8"),
        method="PUT",
        headers={
            "authorization": f"Bearer {token}",
            "content-type": "text/markdown",
            "user-agent": "BrainShare-bulk-publish/0.1",
            # HTTP headers are latin-1; percent-encode so paths with em-dashes,
            # arrows, etc don't blow up. Worker decodes on read.
            "x-note-path": urllib.parse.quote(note_path, safe="/"),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__, file=sys.stderr)
        return 2
    vault = Path(os.path.expanduser(sys.argv[1])).resolve()
    base = sys.argv[2].rstrip("/")
    token = sys.argv[3]

    if not vault.is_dir():
        print(f"vault not found: {vault}", file=sys.stderr)
        return 1

    published: list[str] = []
    failed: list[tuple[str, int]] = []

    for md in sorted(vault.rglob("*.md")):
        if ".obsidian" in md.parts:
            continue
        text = md.read_text(encoding="utf-8")
        new_text, ulid_, stamped = stamp(text)
        if stamped:
            md.write_text(new_text, encoding="utf-8")
        rel = md.relative_to(vault)
        code, body = publish(base, token, ulid_, new_text, str(rel))
        flag = "STAMP" if stamped else "----"
        print(f"{flag} {ulid_}  HTTP {code}  {rel}")
        if code == 200:
            published.append(ulid_)
        else:
            failed.append((str(rel), code))

    print()
    print(f"=== {len(published)} published, {len(failed)} failed ===")
    if failed:
        for f in failed:
            print(f"  FAIL {f[1]}  {f[0]}")
    print()
    print("ULIDS_JSON:", json.dumps(published))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
