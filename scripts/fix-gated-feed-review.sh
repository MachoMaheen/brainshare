#!/usr/bin/env bash
set -euo pipefail
python - <<'PY'
from pathlib import Path

p=Path('publisher/src/index.ts')
s=p.read_text()
old='''      const records = await loadNotes(env.NOTES, wrap.ulids);\n      const shareBase = `${origin}/share/${wrapId}`;\n      const tq = "";\n'''
new='''      const records = await loadNotes(env.NOTES, wrap.ulids);\n      const shareBase = `${origin}/share/${wrapId}`;\n      // Query-token feed subscriptions need self-contained entry links because\n      // feed readers do not share the browser's HttpOnly Slice session cookie.\n      // Credential-bearing feed XML must never enter a shared/public cache.\n      const feedQueryToken = url.searchParams.get("t");\n      const tq = wrap.gated && feedQueryToken ? `?t=${encodeURIComponent(feedQueryToken)}` : "";\n'''
if old not in s: raise SystemExit('feed token pattern missing')
s=s.replace(old,new,1)
old='''          "content-type": "application/atom+xml; charset=utf-8",\n          "cache-control": "public, max-age=600, s-maxage=600",\n'''
new='''          "content-type": "application/atom+xml; charset=utf-8",\n          "cache-control": wrap.gated ? "private, no-store" : "public, max-age=600, s-maxage=600",\n'''
if old not in s: raise SystemExit('feed cache-control pattern missing')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('publisher/test/gated-cache.test.ts')
s=p.read_text()
needle='''  it("keeps machine access available without putting credentials in cached HTML", () => {\n    expect(source).toContain('authorization.startsWith("Bearer ")');\n    expect(source).toContain('const rawRequest = url.searchParams.get("raw") === "1"');\n    expect(source).toContain('req, !rawRequest');\n  });\n'''
addition=needle+'''\n  it("keeps tokenized gated Atom feeds usable without public caching", () => {\n    expect(source).toContain('const feedQueryToken = url.searchParams.get("t")');\n    expect(source).toContain('wrap.gated && feedQueryToken ? `?t=${encodeURIComponent(feedQueryToken)}` : ""');\n    expect(source).toContain('wrap.gated ? "private, no-store" : "public, max-age=600, s-maxage=600"');\n  });\n'''
if needle not in s: raise SystemExit('gated cache test insertion point missing')
p.write_text(s.replace(needle,addition,1))
PY
