"""Fail-closed, offline publication preflight for the legacy bulk publisher.

No network or file writes. Only location/code summaries; never echo matched secrets.
"""
from __future__ import annotations

import hashlib
import os
import posixpath
import re
import unicodedata
import urllib.parse
from pathlib import Path

EXCLUDED_DIRS = {".git", ".obsidian", ".trash", ".brainshare", "node_modules"}
ASSET_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".svg"}
SUPPORTED = {".md", ".canvas"} | ASSET_EXTS
MAX_ASSET_BYTES = 5_000_000
MAX_TOTAL_BYTES = 150_000_000

SECRETS = [
    ("private_key", re.compile(r"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----", re.I)),
    ("cloud_access_key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("github_token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("api_token", re.compile(r"\b(?:sk-[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,})\b")),
    ("credential_assignment", re.compile(
        r"\b(?:api[_-]?key|client[_-]?secret|password|auth[_-]?token)\s*[:=]\s*[\"']?"
        r"(?!example\b|placeholder\b|redacted\b|your[_-])[A-Za-z0-9_+/=-]{16,}", re.I)),
]
ACTIVE_HTML = re.compile(r"<(?:script|iframe|object|embed|form|meta|link)\b", re.I)
SENSITIVE_NAME = re.compile(r"(?:^|/)(?:\.env(?:\.|$)|\.ssh(?:/|$)|\.aws(?:/|$)|[^/]*(?:secret|credentials|private[_-]key)[^/]*)", re.I)
MARKDOWN_IMAGE = re.compile(r"!\[[^\]]*\]\(([^)]+)\)|!\[\[([^\]]+)\]\]")
EXTERNAL_IMAGE = re.compile(r"^(?:https?:|data:|//)", re.I)
# Genuine binary image headers, not file extension or caller-provided MIME.
def detect_image(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"): return "image/png"
    if data.startswith(b"\xff\xd8\xff"): return "image/jpeg"
    if data.startswith((b"GIF87a", b"GIF89a")): return "image/gif"
    if data.startswith(b"RIFF") and len(data)>=12 and data[8:12]==b"WEBP": return "image/webp"
    if len(data)>=12 and data[4:8]==b"ftyp" and data[8:12] in (b"avif",b"avis"): return "image/avif"
    if data.startswith(b"BM"): return "image/bmp"
    return None

MIME_BY_EXT = {
    ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg",
    ".gif":"image/gif", ".webp":"image/webp", ".avif":"image/avif", ".bmp":"image/bmp"
}

def scan_vault(root: Path) -> dict:
    root = root.resolve(strict=True)
    errors: list[dict] = []
    inventory: list[dict] = []
    images: dict[str,str] = {}
    basenames: dict[str,str] = {}
    folded: dict[str,str] = {}
    texts: dict[str,str] = {}
    total_size = 0

    def fail(code: str, rel: str, line: int | None = None):
        errors.append({"code":code, "path":rel, "line":line})

    for parent, dirs, filenames in os.walk(root, followlinks=False):
        p = Path(parent)
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED_DIRS)
        for directory in list(dirs):
            if (p / directory).is_symlink():
                fail("symlink_directory", (p / directory).relative_to(root).as_posix())
                dirs.remove(directory)
        for filename in sorted(filenames):
            f = p / filename
            rel = f.relative_to(root).as_posix()
            ext = f.suffix.lower()
            if f.is_symlink():
                fail("symlink_file",rel)
                continue
            if ext not in SUPPORTED: continue
            try:
                if not f.is_file() or not f.resolve(strict=True).is_relative_to(root):
                    fail("outside_project",rel)
                    continue
            except (OSError, ValueError):
                fail("unreadable_path",rel)
                continue
            normalized = unicodedata.normalize("NFKC",rel).casefold()
            if normalized in folded and folded[normalized]!=rel: fail("path_collision",rel)
            folded[normalized]=rel
            if SENSITIVE_NAME.search(rel): fail("sensitive_path",rel)
            size = f.stat().st_size
            if ext in ASSET_EXTS and size > MAX_ASSET_BYTES: fail("asset_too_large",rel)
            total_size += size
            if total_size > MAX_TOTAL_BYTES:
                fail("publication_too_large",rel)
                break
            try: data = f.read_bytes()
            except OSError:
                fail("unreadable_file",rel)
                continue
            digest = hashlib.sha256(data).hexdigest()
            mime = None
            if ext in ASSET_EXTS:
                actual=detect_image(data)
                mime = MIME_BY_EXT.get(ext)
                if actual is None or actual != mime:
                    fail("unsupported_or_spoofed_image",rel)
                basename=unicodedata.normalize("NFKC",f.name).casefold()
                if basename in basenames and basenames[basename]!=rel:
                    fail("ambiguous_asset_basename",rel)
                basenames[basename]=rel
                images[rel]=digest
            elif ext in (".md",".canvas"):
                try: text=data.decode("utf-8")
                except UnicodeDecodeError:
                    fail("invalid_utf8",rel)
                    continue
                texts[rel]=text
                for i,row in enumerate(text.splitlines(),1):
                    for code,regex in SECRETS:
                        if regex.search(row): fail(code,rel,i)
                    if ACTIVE_HTML.search(row): fail("active_html",rel,i)
            inventory.append({"path":rel,"kind":"asset" if ext in ASSET_EXTS else ext.lstrip("."),
                              "size":len(data),"mime":mime,"sha256":digest})

    lower_paths={unicodedata.normalize("NFKC",p).casefold():p for p in images}
    for rel,text in texts.items():
        if not rel.endswith(".md"): continue
        for i,row in enumerate(text.splitlines(),1):
            for m in MARKDOWN_IMAGE.finditer(row):
                raw=(m.group(1) or m.group(2) or "").split("|")[0].split("#")[0].strip()
                if EXTERNAL_IMAGE.match(raw):
                    fail("external_embedded_resource",rel,i)
                    continue
                raw=urllib.parse.unquote(raw)
                if not raw or raw.startswith(("/","\\")) or "\\" in raw or "\0" in raw:
                    fail("unsafe_image_reference",rel,i)
                    continue
                if re.match(r"^[a-zA-Z]:",raw):
                    fail("unsafe_image_reference",rel,i)
                    continue
                if Path(raw).suffix.lower() not in ASSET_EXTS:
                    fail("unsupported_embedded_resource",rel,i)
                    continue
                candidate=posixpath.normpath(posixpath.join(posixpath.dirname(rel),raw))
                if candidate==".." or candidate.startswith("../"):
                    fail("unsafe_image_reference",rel,i)
                    continue
                # Obsidian-style embeds are often vault-root or basename relative.
                options=[candidate,posixpath.normpath(raw)]
                options += [p for p in images if Path(p).name.casefold()==Path(raw).name.casefold()]
                matches={lower_paths[unicodedata.normalize("NFKC",p).casefold()]
                         for p in options if unicodedata.normalize("NFKC",p).casefold() in lower_paths}
                if len(matches)!=1: fail("missing_or_ambiguous_image",rel,i)
    return {"version":1,"root":str(root),"entries":inventory,
            "asset_count":len(images),"errors":errors,"ok":not errors,
            "note":"Offline best-effort preflight; binary EXIF/metadata is not fully inspected."}
