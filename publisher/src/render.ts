import { marked } from "marked";

// ─────────────────────────────────────────────────────────────────────────────
// Obsidian-style stylesheet — palette pulled from Obsidian's default dark theme,
// callouts/properties/wikilinks shaped to match what users see inside the app.
// ─────────────────────────────────────────────────────────────────────────────

const css = `
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f6f8;
  --bg-callout: #f5f6f8;
  --bg-chip: rgba(127, 109, 242, 0.12);
  --text-normal: #1f2328;
  --text-muted: #57606a;
  --text-faint: #8b949e;
  --text-accent: #7f6df2;
  --text-link: #7f6df2;
  --border: #d0d7de;
  --border-faint: #eaeef2;
  --code-bg: #f6f8fa;
  --kbd-bg: #f6f8fa;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1e1e1e;
    --bg-secondary: #262626;
    --bg-callout: #2a2a2a;
    --bg-chip: rgba(168, 130, 255, 0.16);
    --text-normal: #dcddde;
    --text-muted: #8a8a8a;
    --text-faint: #6a6a6a;
    --text-accent: #a882ff;
    --text-link: #a882ff;
    --border: #363636;
    --border-faint: #2c2c2c;
    --code-bg: #2c2c2c;
    --kbd-bg: #333;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg-primary);
  color: var(--text-normal);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
.container { max-width: 760px; margin: 0 auto; padding: 2.5em 1.25em 6em; }
.wide      { max-width: 1100px; }

/* breadcrumb */
.breadcrumb {
  font-size: .85em;
  color: var(--text-muted);
  margin-bottom: .25em;
  display: flex;
  gap: .5em;
  align-items: center;
  flex-wrap: wrap;
}
.breadcrumb a { color: var(--text-muted); text-decoration: none; }
.breadcrumb a:hover { color: var(--text-accent); }
.breadcrumb .sep { opacity: .5; }
.breadcrumb .scope-badge {
  margin-left: auto;
  font-size: .75em;
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--text-faint);
  border: 1px solid var(--border-faint);
}

/* properties panel — mimics Obsidian's collapsed property table */
.properties {
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  padding: .6em .9em;
  margin: 1.2em 0 1.6em;
  font-size: .92em;
}
.properties h2 {
  font-size: .8em;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0 0 .4em;
  border: 0;
  font-weight: 600;
}
.prop-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: .8em;
  padding: 4px 0;
  align-items: baseline;
}
.prop-key { color: var(--text-muted); font-size: .9em; display: flex; gap: .4em; align-items: center; }
.prop-key .icon { width: 14px; opacity: .7; }
.prop-val { color: var(--text-normal); word-break: break-word; }
.prop-val code { font-size: .85em; padding: 1px 6px; }
.chip {
  display: inline-block;
  background: var(--bg-chip);
  color: var(--text-accent);
  padding: 1px 9px;
  border-radius: 999px;
  font-size: .85em;
  margin-right: 4px;
  margin-bottom: 2px;
}

/* headings, body */
h1, h2, h3 { color: var(--text-normal); margin-top: 1.6em; margin-bottom: .5em; line-height: 1.25; }
h1 { font-size: 1.95em; border-bottom: 1px solid var(--border-faint); padding-bottom: .25em; margin-top: 0; }
h2 { font-size: 1.45em; }
h3 { font-size: 1.15em; }
p, ul, ol, blockquote { margin: .8em 0; }
ul, ol { padding-left: 1.4em; }
li { margin: .25em 0; }
a { color: var(--text-link); text-decoration: none; border-bottom: 1px solid transparent; }
a:hover { border-bottom-color: var(--text-link); }
hr { border: none; border-top: 1px solid var(--border-faint); margin: 2em 0; }

/* code */
code {
  background: var(--code-bg);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: .9em;
  font-family: "SF Mono", Menlo, Consolas, monospace;
}
pre {
  background: var(--code-bg);
  padding: .9em 1em;
  border-radius: 6px;
  overflow: auto;
  font-size: .88em;
  line-height: 1.5;
}
pre code { background: none; padding: 0; }

/* tables */
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .94em; }
th, td { border: 1px solid var(--border-faint); padding: .4em .6em; text-align: left; }
th { background: var(--bg-secondary); }

/* plain blockquotes (non-callout) */
blockquote {
  border-left: 3px solid var(--border);
  padding: 0 1em;
  color: var(--text-muted);
  margin-left: 0;
}

/* WIKILINKS */
.wikilink-internal {
  color: var(--text-accent);
  border-bottom: 1px solid var(--text-accent);
  text-decoration: none;
  cursor: pointer;
}
.wikilink-internal:hover { background: var(--bg-chip); }
.wikilink-private {
  color: var(--text-accent);
  border-bottom: 1px dotted var(--text-accent);
  cursor: help;
  opacity: .65;
}

/* CALLOUTS — match Obsidian exact look (icon + colored title bar + body) */
.callout {
  background: var(--bg-callout);
  border-left: 3px solid var(--callout-color, #a882ff);
  border-radius: 6px;
  padding: .7em 1em .8em;
  margin: 1em 0;
}
.callout-title {
  display: flex;
  align-items: center;
  gap: .5em;
  font-weight: 600;
  color: var(--callout-color, #a882ff);
  margin-bottom: .35em;
}
.callout-title .callout-icon { display: inline-flex; }
.callout-title svg { width: 18px; height: 18px; }
.callout-content > :first-child { margin-top: 0; }
.callout-content > :last-child  { margin-bottom: 0; }
.callout-content { color: var(--text-normal); font-size: .95em; }

.callout[data-callout="abstract"], .callout[data-callout="summary"], .callout[data-callout="tldr"] { --callout-color: #00b8b8; }
.callout[data-callout="info"]                                                                     { --callout-color: #086ddd; }
.callout[data-callout="todo"]                                                                     { --callout-color: #086ddd; }
.callout[data-callout="tip"], .callout[data-callout="hint"], .callout[data-callout="important"]   { --callout-color: #00b8b8; }
.callout[data-callout="success"], .callout[data-callout="check"], .callout[data-callout="done"]   { --callout-color: #08b94e; }
.callout[data-callout="question"], .callout[data-callout="help"], .callout[data-callout="faq"]    { --callout-color: #e0ac00; }
.callout[data-callout="warning"], .callout[data-callout="caution"], .callout[data-callout="attention"] { --callout-color: #e0ac00; }
.callout[data-callout="failure"], .callout[data-callout="fail"], .callout[data-callout="missing"] { --callout-color: #e93147; }
.callout[data-callout="danger"], .callout[data-callout="error"]                                   { --callout-color: #e93147; }
.callout[data-callout="bug"]                                                                       { --callout-color: #e93147; }
.callout[data-callout="example"]                                                                   { --callout-color: #a882ff; }
.callout[data-callout="quote"], .callout[data-callout="cite"]                                      { --callout-color: #8b8b8b; }
.callout[data-callout="note"]                                                                      { --callout-color: #086ddd; }

/* wrapper landing page */
.wrap-header h1 { font-size: 2em; margin-bottom: .15em; }
.wrap-header .desc { color: var(--text-muted); margin-bottom: 1.5em; }
.wrap-meta { font-size: .85em; color: var(--text-faint); margin-top: 2em; padding-top: 1em; border-top: 1px solid var(--border-faint); }

#graph-host {
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  height: 540px;
  margin: 1em 0 2em;
  position: relative;
  overflow: hidden;
}
.graph-help {
  position: absolute;
  top: 8px; left: 12px;
  font-size: .75em;
  color: var(--text-faint);
  pointer-events: none;
  z-index: 2;
}
.graph-reset-btn {
  position: absolute;
  top: 8px; right: 12px;
  z-index: 2;
  padding: .35em .7em;
  font-size: .8em;
  background: var(--bg-primary);
  color: var(--text-muted);
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  cursor: pointer;
  transition: opacity .15s, color .15s, border-color .15s;
  opacity: .85;
}
.graph-reset-btn:hover {
  opacity: 1;
  color: var(--text-accent);
  border-color: var(--text-accent);
}

.note-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: .5em;
  list-style: none;
  padding: 0;
}
.note-list li { margin: 0; }
.note-list a {
  display: block;
  padding: .55em .8em;
  border-radius: 6px;
  border: 1px solid var(--border-faint);
  background: var(--bg-secondary);
  color: var(--text-normal);
}
.note-list a:hover { border-color: var(--text-accent); background: var(--bg-chip); }
.note-list .folder { font-size: .75em; color: var(--text-faint); display: block; margin-bottom: 2px; }
.wrap-actions {
  display: flex; gap: .5em; flex-wrap: wrap;
  margin: .8em 0 .4em;
}
.action-btn {
  display: inline-flex; align-items: center; gap: .4em;
  padding: .45em .9em;
  font-size: .9em;
  border-radius: 6px;
  background: var(--text-accent);
  color: var(--bg-primary) !important;
  border: 1px solid transparent !important;
  text-decoration: none !important;
  transition: opacity .15s;
}
.action-btn:hover { opacity: .85; border-color: transparent !important; }
.action-icon { font-size: 1.05em; }
.folder-chips {
  display: flex; flex-wrap: wrap; gap: .4em;
  margin: .5em 0 1em;
}
.folder-chip {
  display: inline-flex; align-items: center; gap: .35em;
  padding: .25em .7em;
  font-size: .8em;
  border-radius: 999px;
  background: var(--bg-chip);
  color: var(--text-accent) !important;
  border: 1px solid transparent;
  text-decoration: none !important;
}
.folder-chip:hover { border-color: var(--text-accent); border-bottom-color: var(--text-accent); }
.folder-chip-count {
  font-size: .85em; opacity: .7; padding: 0 .35em;
  background: rgba(127,109,242,0.15); border-radius: 6px;
}
.folder-heading {
  display: flex; align-items: center; gap: .5em;
  font-size: .95em; font-weight: 500;
  color: var(--text-muted);
  margin: 1.4em 0 .4em;
  padding-bottom: .25em;
  border-bottom: 1px solid var(--border-faint);
  scroll-margin-top: 1em;
}
.folder-heading .folder-icon { color: var(--text-faint); }
.folder-heading .folder-count {
  margin-left: auto; font-size: .8em; color: var(--text-faint); font-weight: normal;
}
.note-list .title  { font-weight: 500; }
.note-list .ulid   { font-size: .7em; color: var(--text-faint); display: block; margin-top: 2px; font-family: "SF Mono", Menlo, monospace; }
.note-list .missing a { opacity: .5; text-decoration: line-through; }

/* gated badges + error page */
.gated-badge { background: rgba(168, 130, 255, 0.18); color: var(--text-accent); border-color: var(--text-accent); }
.gated-pill {
  display: inline-block;
  font-size: .6em;
  background: rgba(168, 130, 255, 0.18);
  color: var(--text-accent);
  padding: 2px 10px;
  border-radius: 999px;
  margin-left: .5em;
  vertical-align: middle;
  letter-spacing: .03em;
}
.gate-error { text-align: center; padding: 6em 0; }
.gate-error .gate-icon { font-size: 3em; opacity: .5; margin-bottom: .3em; }
.gate-error h1 { border: 0; }
.gate-error .gate-msg { color: var(--text-muted); font-size: 1.05em; margin: .8em 0 1.5em; }
.gate-error .gate-hint { font-size: .9em; color: var(--text-faint); max-width: 480px; margin: 0 auto; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Callout icons (compact inline SVGs — no external dependency)
// ─────────────────────────────────────────────────────────────────────────────

const ICON: Record<string, string> = {
  abstract: svg("M5 6h14M5 12h14M5 18h10"),
  summary:  svg("M5 6h14M5 12h14M5 18h10"),
  tldr:     svg("M5 6h14M5 12h14M5 18h10"),
  info:     svg("M12 8v.01M12 12v4M12 22a10 10 0 110-20 10 10 0 010 20z"),
  todo:     svg("M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"),
  tip:      svg("M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"),
  hint:     svg("M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"),
  important:svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  success:  svg("M5 13l4 4L19 7"),
  check:    svg("M5 13l4 4L19 7"),
  done:     svg("M5 13l4 4L19 7"),
  question: svg("M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"),
  help:     svg("M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"),
  faq:      svg("M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"),
  warning:  svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  caution:  svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  failure:  svg("M18 6L6 18M6 6l12 12"),
  fail:     svg("M18 6L6 18M6 6l12 12"),
  missing:  svg("M18 6L6 18M6 6l12 12"),
  danger:   svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  error:    svg("M18 6L6 18M6 6l12 12"),
  bug:      svg("M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3.003 3.003 0 116 0v1M12 20v-9M6 13H4M20 13h-2M6.53 9C5 11.5 4 13.5 4 16a8 8 0 0016 0c0-2.5-1-4.5-2.53-7"),
  example:  svg("M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"),
  quote:    svg("M3 21l3-9-3-9M21 21l-3-9 3-9"),
  cite:     svg("M3 21l3-9-3-9M21 21l-3-9 3-9"),
  note:     svg("M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"),
};
function svg(d: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

const PROP_ICON: Record<string, string> = {
  title:   svg("M4 6h16M4 12h16M4 18h7"),
  tags:    svg("M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.83zM7 7h.01"),
  created: svg("M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"),
  updated: svg("M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"),
  date:    svg("M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"),
  id:      svg("M4 6h16M4 12h16M4 18h7"),
  status:  svg("M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"),
  link:    svg("M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"),
  default: svg("M4 6h16M4 12h16M4 18h7"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Callout extension for marked (block-level)
// ─────────────────────────────────────────────────────────────────────────────

interface CalloutToken {
  type: "callout";
  raw: string;
  calloutType: string;
  calloutTitle: string;
  text: string;
}

marked.use({
  extensions: [
    {
      name: "callout",
      level: "block" as const,
      start(src: string) {
        const idx = src.search(/^>\s*\[!/m);
        return idx === -1 ? undefined : idx;
      },
      tokenizer(src: string): CalloutToken | undefined {
        const m = /^>\s*\[!([A-Za-z]+)\][\+\-]?\s*([^\n]*)\n((?:>.*\n?)*)/.exec(src);
        if (!m) return undefined;
        const text = m[3].replace(/^>\s?/gm, "").trimEnd();
        return {
          type: "callout",
          raw: m[0],
          calloutType: m[1].toLowerCase(),
          calloutTitle: m[2].trim() || cap(m[1]),
          text,
        };
      },
      renderer(token) {
        const t = token as unknown as CalloutToken;
        const inner = marked.parse(t.text, { async: false }) as string;
        const icon = ICON[t.calloutType] || ICON.note;
        return `<div class="callout" data-callout="${escapeAttr(t.calloutType)}">
<div class="callout-title"><span class="callout-icon">${icon}</span><span>${escapeHtml(t.calloutTitle)}</span></div>
<div class="callout-content">${inner}</div>
</div>`;
      },
    },
  ],
});

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter parsing (lightweight YAML — handles the dialects we actually use)
// ─────────────────────────────────────────────────────────────────────────────

export interface Frontmatter {
  raw: string;
  fields: Array<{ key: string; value: FmValue }>;
  byKey: Map<string, FmValue>;
}
export type FmValue = string | string[];

export function parseFrontmatter(md: string): { fm: Frontmatter | null; body: string } {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: null, body: md };
  const raw = m[1];
  const fields: Array<{ key: string; value: FmValue }> = [];
  const byKey = new Map<string, FmValue>();

  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) { i++; continue; }
    const key = kv[1];
    let val = kv[2].trim();

    // Inline list: tags: [a, b, c]
    if (val.startsWith("[") && val.endsWith("]")) {
      const items = val.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      fields.push({ key, value: items });
      byKey.set(key, items);
      i++; continue;
    }

    // Block list:
    //   tags:
    //     - a
    //     - b
    if (val === "" && lines[i + 1]?.match(/^\s+-\s/)) {
      const items: string[] = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-\s/)) {
        items.push(lines[i].replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
        i++;
      }
      fields.push({ key, value: items });
      byKey.set(key, items);
      continue;
    }

    // Scalar
    val = val.replace(/^["']|["']$/g, "");
    fields.push({ key, value: val });
    byKey.set(key, val);
    i++;
  }
  return { fm: { raw, fields, byKey }, body: md.slice(m[0].length) };
}

export function extractTitle(md: string): string | null {
  const { fm } = parseFrontmatter(md);
  if (!fm) return null;
  const t = fm.byKey.get("title");
  return typeof t === "string" ? t : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Share-set builder (basename → ulid)
// ─────────────────────────────────────────────────────────────────────────────

export interface NoteMeta { path: string; basename: string; }
export interface WrapData {
  title?: string;
  description?: string;
  ulids: string[];
  created_at?: string;
  gated?: boolean;
}

export interface NoteRecord {
  ulid: string;
  basename: string;
  path: string;
  title: string;
  md: string | null;
}

export async function loadNotes(notes: KVNamespace, ulids: string[]): Promise<NoteRecord[]> {
  return Promise.all(
    ulids.map(async (u): Promise<NoteRecord> => {
      const [md, metaRaw] = await Promise.all([
        notes.get(`note:${u}`),
        notes.get(`meta:${u}`),
      ]);
      let basename = u;
      let path = u;
      if (metaRaw) {
        try {
          const m = JSON.parse(metaRaw) as NoteMeta;
          if (m.basename) basename = m.basename;
          if (m.path) path = m.path;
        } catch { /* fall through */ }
      }
      const title = (md ? extractTitle(md) : null) ?? basename;
      return { ulid: u, basename, path, title, md };
    })
  );
}

export function shareSetFromNotes(notes: NoteRecord[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const n of notes) {
    if (n.md) m.set(n.basename, n.ulid);
  }
  return m;
}

export async function buildShareSet(notes: KVNamespace, ulids: string[]): Promise<Map<string, string>> {
  return shareSetFromNotes(await loadNotes(notes, ulids));
}

// Edges: for sigma graph, find wikilinks within share-set.
export function buildEdges(records: NoteRecord[]): Array<{ from: string; to: string }> {
  const setByBasename = shareSetFromNotes(records);
  const edges: Array<{ from: string; to: string }> = [];
  const seen = new Set<string>();
  for (const r of records) {
    if (!r.md) continue;
    const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(r.md))) {
      const target = m[1].trim();
      const targetUlid = setByBasename.get(target);
      if (targetUlid && targetUlid !== r.ulid) {
        const k = `${r.ulid}|${targetUlid}`;
        if (!seen.has(k)) {
          edges.push({ from: r.ulid, to: targetUlid });
          seen.add(k);
        }
      }
    }
  }
  return edges;
}

// ─────────────────────────────────────────────────────────────────────────────
// Note rendering (with breadcrumb + properties + Obsidian chrome)
// ─────────────────────────────────────────────────────────────────────────────

export interface RenderCtx {
  shareBase?: string;             // e.g. https://.../share/<wrap-id>
  shareSet?: Map<string, string>; // basename → ulid
  path?: string;                  // vault-relative path (for breadcrumb)
  tokenQuery?: string;            // "?t=<jwt>" appended to internal links when gated
  gated?: boolean;
}

export function renderNote(md: string, ulid: string, ctx?: RenderCtx): string {
  const { fm, body: rawBody } = parseFrontmatter(md);
  const title = (fm?.byKey.get("title") as string) ?? ulid;

  const tq = ctx?.tokenQuery ?? "";
  // Strip a leading H1 that duplicates the title — otherwise the page renders
  // its title twice (once from <h1> below, once from the markdown's own # heading).
  const dedupedBody = rawBody.replace(
    /^\s*#\s+(.+?)\s*$/m,
    (match, heading: string) =>
      heading.trim().toLowerCase() === title.trim().toLowerCase() ? "" : match
  );
  // Resolve wikilinks (in markdown, before marked sees them, so internal ones survive as raw HTML)
  const body = dedupedBody.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_m, target: string, alias?: string) => {
      const targetTrim = target.trim();
      const label = (alias ?? target).trim();
      if (ctx?.shareBase && ctx.shareSet) {
        const targetUlid = ctx.shareSet.get(targetTrim);
        if (targetUlid) {
          return `<a class="wikilink-internal" href="${ctx.shareBase}/${targetUlid}${tq}">${escapeHtml(label)}</a>`;
        }
      }
      return `<span class="wikilink-private" title="not in this published slice">${escapeHtml(label)}</span>`;
    }
  );

  const html = marked.parse(body, { async: false }) as string;
  const breadcrumb = renderBreadcrumb(ctx, title);
  const props = renderProperties(fm, ulid);

  return shell({ title, body: `
${breadcrumb}
${props}
<h1>${escapeHtml(title)}</h1>
${html}
` });
}

function renderBreadcrumb(ctx: RenderCtx | undefined, title: string): string {
  const scoped = !!ctx?.shareBase;
  const tq = ctx?.tokenQuery ?? "";
  const back = scoped
    ? `<a href="${ctx!.shareBase}${tq}">← share</a><span class="sep">/</span>`
    : "";
  // Each folder segment becomes a clickable anchor back to the wrapper landing's
  // folder section. Slug must match the section id generated in renderWrapper.
  const folderSegments: string[] = [];
  if (ctx?.path) {
    const parts = ctx.path.split("/").slice(0, -1);
    for (let i = 0; i < parts.length; i++) {
      const folderPath = parts.slice(0, i + 1).join("/");
      const slug = folderPath.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const text = escapeHtml(parts[i]);
      const seg = scoped
        ? `<a href="${ctx!.shareBase}${tq}#folder-${slug}">${text}</a>`
        : text;
      folderSegments.push(seg);
    }
  }
  const folderPart = folderSegments.length
    ? `${folderSegments.join('<span class="sep">/</span>')}<span class="sep">/</span>`
    : "";
  const badge = !scoped
    ? `<span class="scope-badge">standalone</span>`
    : ctx?.gated
      ? `<span class="scope-badge gated-badge">🔒 gated</span>`
      : `<span class="scope-badge">scoped to share</span>`;
  return `<div class="breadcrumb">${back}${folderPart}<span>${escapeHtml(title)}</span>${badge}</div>`;
}

function renderProperties(fm: Frontmatter | null, ulid: string): string {
  if (!fm) {
    return `<div class="properties"><h2>Properties</h2><div class="prop-row"><span class="prop-key">${PROP_ICON.id}id</span><span class="prop-val"><code>${ulid}</code></span></div></div>`;
  }
  const rows = fm.fields.map(({ key, value }) => {
    const icon = PROP_ICON[key] ?? PROP_ICON.default;
    const valHtml = renderFmValue(key, value);
    return `<div class="prop-row"><span class="prop-key">${icon}${escapeHtml(key)}</span><span class="prop-val">${valHtml}</span></div>`;
  });
  // ensure id is always in the panel (even if absent from frontmatter)
  if (!fm.byKey.has("id")) {
    rows.push(`<div class="prop-row"><span class="prop-key">${PROP_ICON.id}id</span><span class="prop-val"><code>${ulid}</code></span></div>`);
  }
  return `<div class="properties"><h2>Properties</h2>${rows.join("")}</div>`;
}

function renderFmValue(key: string, value: FmValue): string {
  if (Array.isArray(value)) {
    return value.map(v => `<span class="chip">${escapeHtml(v)}</span>`).join("");
  }
  // URL detection
  if (/^https?:\/\//.test(value)) {
    return `<a href="${escapeAttr(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
  }
  if (key === "id") {
    return `<code>${escapeHtml(value)}</code>`;
  }
  return escapeHtml(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper landing page (sigma.js graph + sortable note list)
// ─────────────────────────────────────────────────────────────────────────────

export async function renderWrapper(
  notes: KVNamespace,
  origin: string,
  wrapId: string,
  wrap: WrapData,
  tokenQuery: string = ""
): Promise<string> {
  const records = await loadNotes(notes, wrap.ulids);
  const edges = buildEdges(records);
  const shareBase = `${origin}/share/${wrapId}`;
  const tq = tokenQuery;

  // Group notes by folder so the landing page mirrors Obsidian's file explorer
  // instead of being a flat dump.
  const groups = new Map<string, typeof records>();
  for (const r of records) {
    const folder = r.path.includes("/") ? r.path.split("/").slice(0, -1).join("/") : "";
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder)!.push(r);
  }
  const folderOrder = [...groups.keys()].sort((a, b) => {
    if (a === "" && b !== "") return 1;
    if (b === "" && a !== "") return -1;
    return a.localeCompare(b);
  });
  const folderSections = folderOrder.map((folder) => {
    const slug = folder ? folder.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "root";
    const heading = folder
      ? `<h3 class="folder-heading" id="folder-${slug}"><span class="folder-icon">📁</span>${escapeHtml(folder)} <span class="folder-count">${groups.get(folder)!.length}</span></h3>`
      : `<h3 class="folder-heading" id="folder-root"><span class="folder-icon">·</span>vault root <span class="folder-count">${groups.get(folder)!.length}</span></h3>`;
    const lis = groups.get(folder)!.map((r) => {
      const cls = r.md ? "" : "missing";
      return `<li class="${cls}"><a href="${shareBase}/${r.ulid}${tq}"><span class="title">${escapeHtml(r.title)}</span><span class="ulid">${r.ulid}</span></a></li>`;
    });
    return `${heading}<ul class="note-list">${lis.join("")}</ul>`;
  });

  // Folder breadcrumb chips at the top of the wrapper for quick navigation
  const folderChips = folderOrder
    .filter((f) => f !== "")
    .map((folder) => {
      const slug = folder.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<a class="folder-chip" href="#folder-${slug}">${escapeHtml(folder)}<span class="folder-chip-count">${groups.get(folder)!.length}</span></a>`;
    })
    .join("");

  const graphData = {
    wrapId,
    tokenQuery: tq,
    nodes: records.filter(r => r.md).map(r => ({
      id: r.ulid,
      label: r.title,
      folder: r.path.includes("/") ? r.path.split("/")[0] : "",
    })),
    edges,
  };

  const gatedBadge = wrap.gated
    ? `<span class="gated-pill" title="this share requires a token">🔒 gated</span>`
    : "";

  return shell({
    title: wrap.title ?? "Shared slice",
    wide: true,
    body: `
<div class="wrap-header">
  <h1>${escapeHtml(wrap.title ?? "Shared slice")} ${gatedBadge}</h1>
  ${wrap.description ? `<p class="desc">${escapeHtml(wrap.description)}</p>` : ""}
  <div class="wrap-actions">
    <a class="action-btn" href="${shareBase}/download${tq}" download>
      <span class="action-icon">⬇</span> Download as Obsidian vault (.zip)
    </a>
  </div>
  ${folderChips ? `<div class="folder-chips">${folderChips}</div>` : ""}
</div>

<div id="graph-host">
  <span class="graph-help">drag · scroll to zoom · click a node to open · hover to focus · double-click empty space to reset</span>
  <button id="graph-reset" class="graph-reset-btn" type="button" title="Reset view (or double-click empty space)">⌖ Reset view</button>
  <div id="graph" style="width:100%;height:100%"></div>
</div>

<h2 style="margin-top:1em">Notes in this slice</h2>
${folderSections.join("")}

<div class="wrap-meta">${records.length} note(s) · created ${escapeHtml(wrap.created_at ?? "")}${wrap.gated ? " · gated" : ""}</div>

<script src="https://cdn.jsdelivr.net/npm/graphology@0.25.4/dist/graphology.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sigma@2.4.0/build/sigma.min.js"></script>
<script>
(function(){
  var DATA = ${JSON.stringify(graphData)};
  if (!DATA.nodes.length || typeof graphology === "undefined" || typeof Sigma === "undefined") {
    document.getElementById("graph-host").style.display = "none";
    return;
  }
  var g = new graphology.Graph();
  var styles = getComputedStyle(document.body);
  var accent     = (styles.getPropertyValue("--text-accent").trim() || "#a882ff");
  var nodeColor  = (styles.getPropertyValue("--text-muted").trim()  || "#8a8a8a");
  var edgeColor  = (styles.getPropertyValue("--border").trim()      || "#363636");
  var labelColor = (styles.getPropertyValue("--text-normal").trim() || "#dcddde");
  var dimColor   = "rgba(140,140,140,0.18)";

  // Degree → node size (Obsidian's "more links → bigger node")
  var degree = {};
  DATA.edges.forEach(function(e){
    if (e.from === e.to) return;
    degree[e.from] = (degree[e.from] || 0) + 1;
    degree[e.to]   = (degree[e.to]   || 0) + 1;
  });

  DATA.nodes.forEach(function(n,i){
    var theta = (i / DATA.nodes.length) * 2 * Math.PI;
    var d = degree[n.id] || 0;
    g.addNode(n.id, {
      label: n.label,
      x: Math.cos(theta), y: Math.sin(theta),
      size: 5 + Math.min(d, 10) * 1.1,
      color: nodeColor,
    });
  });
  DATA.edges.forEach(function(e){
    if (g.hasNode(e.from) && g.hasNode(e.to) && !g.hasEdge(e.from, e.to) && e.from !== e.to) {
      g.addEdge(e.from, e.to, { size: 1, color: edgeColor });
    }
  });

  // Force-directed settle. Repulsion (inverse-square) + spring (along edges)
  // with cooling to prevent oscillation. Tuned so nodes spread to readable spacing.
  var ITERATIONS = 180;
  var REST_LEN = 1.5;
  var REPULSION = 0.15;
  for (var iter = 0; iter < ITERATIONS; iter++) {
    var alpha = 1 - iter / ITERATIONS; // cooling: forces shrink over time
    var pos = {};
    g.forEachNode(function(n, a){ pos[n] = { x: a.x, y: a.y, fx: 0, fy: 0 }; });
    g.forEachNode(function(n1){
      g.forEachNode(function(n2){
        if (n1 === n2) return;
        var dx = pos[n1].x - pos[n2].x;
        var dy = pos[n1].y - pos[n2].y;
        var d2 = dx*dx + dy*dy + 0.01;
        var f = REPULSION / d2;
        pos[n1].fx += dx * f;
        pos[n1].fy += dy * f;
      });
    });
    g.forEachEdge(function(_e, _a, src, tgt){
      var dx = pos[tgt].x - pos[src].x;
      var dy = pos[tgt].y - pos[src].y;
      var d  = Math.sqrt(dx*dx + dy*dy) + 0.01;
      var f  = (d - REST_LEN) * 0.08;
      pos[src].fx += dx/d * f;
      pos[src].fy += dy/d * f;
      pos[tgt].fx -= dx/d * f;
      pos[tgt].fy -= dy/d * f;
    });
    g.forEachNode(function(n){
      // clamp per-step displacement so a single bad iteration can't fling a node off-canvas
      var fx = Math.max(-0.5, Math.min(0.5, pos[n].fx * alpha));
      var fy = Math.max(-0.5, Math.min(0.5, pos[n].fy * alpha));
      g.setNodeAttribute(n, "x", pos[n].x + fx);
      g.setNodeAttribute(n, "y", pos[n].y + fy);
    });
  }

  var renderer = new Sigma(g, document.getElementById("graph"), {
    labelColor: { color: labelColor },
    labelSize: 12,
    labelDensity: 0.7,
    labelGridCellSize: 80,
    renderEdgeLabels: false,
    defaultEdgeColor: edgeColor,
    minCameraRatio: 0.05,
    maxCameraRatio: 8,
  });

  // Reset/fit handler — bring the camera back to the default state that frames
  // every node. Used by the explicit Reset button + double-click on empty space.
  function resetView() {
    var camera = renderer.getCamera();
    if (typeof camera.animatedReset === "function") {
      camera.animatedReset({ duration: 400 });
    } else {
      camera.setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
    }
  }

  var resetBtn = document.getElementById("graph-reset");
  if (resetBtn) resetBtn.addEventListener("click", resetView);
  // Sigma fires "doubleClickStage" when you double-click empty graph space (not a node).
  renderer.on("doubleClickStage", function(e){
    if (e && e.preventSigmaDefault) e.preventSigmaDefault(); // suppress sigma's own double-click zoom
    resetView();
  });

  // Hover-dim implemented via direct attribute mutation — simpler and more reliable
  // than reducers in sigma 2.4. Cache originals so we can restore on leave.
  var origNodeColor = {}, origNodeSize = {}, origEdgeColor = {};
  g.forEachNode(function(n, a){ origNodeColor[n] = a.color; origNodeSize[n] = a.size; });
  g.forEachEdge(function(e, a){ origEdgeColor[e] = a.color; });

  renderer.on("enterNode", function(p){
    var hovered = p.node;
    var neighbors = {}; neighbors[hovered] = true;
    g.forEachNeighbor(hovered, function(nb){ neighbors[nb] = true; });
    g.forEachNode(function(n){
      if (neighbors[n]) {
        g.setNodeAttribute(n, "color", n === hovered ? accent : origNodeColor[n]);
      } else {
        g.setNodeAttribute(n, "color", dimColor);
      }
    });
    g.forEachEdge(function(e, _a, src, tgt){
      g.setEdgeAttribute(e, "color", (neighbors[src] && neighbors[tgt]) ? accent : dimColor);
    });
    document.body.style.cursor = "pointer";
  });
  renderer.on("leaveNode", function(){
    g.forEachNode(function(n){ g.setNodeAttribute(n, "color", origNodeColor[n]); });
    g.forEachEdge(function(e){ g.setEdgeAttribute(e, "color", origEdgeColor[e]); });
    document.body.style.cursor = "";
  });
  renderer.on("clickNode", function(p){ window.location = "/share/" + DATA.wrapId + "/" + p.node + DATA.tokenQuery; });
})();
</script>
`,
  });
}

export function renderGateError(message: string): string {
  return shell({
    title: "Access required",
    body: `
<div class="gate-error">
  <div class="gate-icon">🔒</div>
  <h1>Access required</h1>
  <p class="gate-msg">${escapeHtml(message)}</p>
  <p class="gate-hint">If you were given a link, make sure you used the full URL including the access token (<code>?t=…</code>). Tokens can expire, be revoked, or have a view limit.</p>
</div>
`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────────────────────

function shell(opts: { title: string; body: string; wide?: boolean }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<style>${css}</style>
</head>
<body>
<main class="container ${opts.wide ? "wide" : ""}">
${opts.body}
</main>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"} as Record<string,string>)[c]);
}
function escapeAttr(s: string): string { return escapeHtml(s); }
