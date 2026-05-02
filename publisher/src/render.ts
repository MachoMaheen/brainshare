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
.wikilink-canvas { font-size: .95em; }
.empty-note-placeholder {
  padding: 2em 1.5em;
  margin: 1em 0;
  background: var(--bg-secondary);
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  text-align: center;
}
.empty-note-placeholder p { margin: 0.4em 0; }
.empty-note-placeholder em { font-size: 1.1em; }
.embedded-image {
  display: block; max-width: 100%; height: auto;
  border-radius: 6px; margin: 1em auto;
  background: var(--bg-secondary);
}
.embed-missing {
  display: inline-block;
  padding: .15em .5em; border-radius: 4px;
  background: var(--bg-secondary); color: var(--text-faint);
  font-size: .85em; font-style: italic;
}
.mermaid {
  display: block; margin: 1.2em auto; text-align: center;
  background: var(--bg-secondary); padding: 1em; border-radius: 6px;
  overflow-x: auto;
}
.canvas-title { margin-top: .25em; }
.canvas-help {
  font-size: .85em; color: var(--text-faint);
  margin: .25em 0 .8em;
}
.canvas-host {
  position: relative;
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  background: var(--bg-secondary);
  overflow: hidden;
  height: 70vh; min-height: 500px;
  margin: 0 0 2em;
}
#canvas-svg {
  width: 100%; height: 100%;
  cursor: grab;
  background:
    radial-gradient(circle at 1px 1px, var(--border-faint) 1px, transparent 1px) 0 0 / 24px 24px;
}
.canvas-text, .canvas-file, .canvas-link {
  width: 100%; height: 100%;
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 2px solid;
  border-radius: 8px;
  color: var(--text-normal);
  overflow: auto;
  font-size: 14px;
  line-height: 1.45;
  box-sizing: border-box;
}
.canvas-text > :first-child { margin-top: 0; }
.canvas-text > :last-child { margin-bottom: 0; }
.canvas-text h1, .canvas-text h2 { margin-top: .3em; margin-bottom: .25em; font-size: 1.1em; }
.canvas-file {
  display: flex; flex-direction: column; justify-content: center;
  text-decoration: none !important;
}
.canvas-file:hover { background: var(--bg-chip); }
.canvas-file-name { font-weight: 500; }
.canvas-file-private { opacity: .6; }
.canvas-file-private-note { font-size: .75em; color: var(--text-faint); margin-top: 4px; }
.canvas-link {
  display: flex; align-items: center; gap: .4em;
  font-size: .85em;
  color: var(--text-link);
  text-decoration: none !important;
  word-break: break-all;
}
.canvas-list {
  display: grid; gap: .5em;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  list-style: none; padding: 0;
}
.canvas-list li { margin: 0; }
.canvas-list a {
  display: flex; align-items: center; gap: .6em;
  padding: .65em .85em;
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-normal);
  text-decoration: none !important;
}
.canvas-list a:hover { border-color: var(--text-accent); background: var(--bg-chip); }
.canvas-list .canvas-icon { font-size: 1.2em; }
.canvas-list .title { flex: 1; font-weight: 500; }
.canvas-list .ulid {
  font-size: .7em; color: var(--text-faint);
  font-family: "SF Mono", Menlo, monospace;
}
.canvas-edge-label {
  font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  paint-order: stroke; stroke: var(--bg-secondary); stroke-width: 4;
}
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
/* Wrapper landing layout: persistent left sidebar + flexible main pane */
.wrap-shell {
  display: flex;
  min-height: 100vh;
  align-items: stretch;
}
.wrap-sidebar {
  flex: 0 0 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-faint);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  transition: flex-basis .2s ease, transform .2s ease;
  z-index: 10;
}
.wrap-sidebar.collapsed { flex: 0 0 48px; }
.wrap-sidebar.collapsed .sidebar-inner { display: none; }
.sidebar-toggle {
  position: absolute;
  top: 10px; right: 10px;
  width: 28px; height: 28px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  color: var(--text-muted);
  z-index: 1;
}
.sidebar-toggle:hover { color: var(--text-accent); border-color: var(--text-accent); }
.sidebar-inner { padding: 1.4em 1.1em; }
.sidebar-header { margin-bottom: 1em; padding-right: 32px; }
.sidebar-title { font-size: 1.15em; line-height: 1.25; margin: 0 0 .25em; color: var(--text-normal); }
.sidebar-badge { margin: .2em 0 .4em; }
.sidebar-desc { font-size: .82em; color: var(--text-muted); line-height: 1.4; margin: .4em 0 0;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.sidebar-cta {
  display: inline-flex; align-items: center; gap: .35em;
  font-size: .8em; color: var(--text-accent) !important;
  text-decoration: none !important;
  padding: .25em 0; margin: .2em 0 1em;
}
.sidebar-cta:hover { text-decoration: underline !important; }
.sidebar-section { margin-bottom: 1em; }
.sidebar-section-title {
  font-size: .68em;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-faint);
  font-weight: 600;
  margin: 0 0 .35em;
  padding: 0 .2em;
}
/* Obsidian-style file tree */
.tree { display: flex; flex-direction: column; gap: 0; font-size: .85em; }
.tree-folder { display: block; }
.tree-folder > summary {
  display: flex; align-items: center; gap: .35em;
  padding: .25em .35em;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-normal);
  list-style: none;
  user-select: none;
}
.tree-folder > summary::-webkit-details-marker { display: none; }
.tree-folder > summary::marker { display: none; }
.tree-folder > summary:hover { background: var(--bg-chip); color: var(--text-accent); }
.tree-chevron {
  display: inline-block; width: 12px; flex: 0 0 12px;
  font-size: .7em; color: var(--text-faint);
  transition: transform .15s ease;
  transform: rotate(90deg);
}
.tree-folder:not([open]) > summary .tree-chevron { transform: rotate(0deg); }
.tree-folder-name {
  flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-weight: 500;
}
.tree-folder-count {
  font-size: .75em; color: var(--text-faint);
  padding: 0 .35em;
}
.tree-children { display: flex; flex-direction: column; gap: 0; }
.tree-file {
  display: flex; align-items: center; gap: .4em;
  padding: .22em .35em .22em 1.55em;
  border-radius: 4px;
  color: var(--text-normal) !important;
  text-decoration: none !important;
  border: 1px solid transparent !important;
}
.tree-file:hover { background: var(--bg-chip); color: var(--text-accent) !important; border-color: transparent !important; }
.tree-file.active {
  background: var(--bg-chip);
  color: var(--text-accent) !important;
  font-weight: 600;
}
.tree-file.active .tree-file-name { color: var(--text-accent); }
.tree-file-name {
  flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: .92em;
}
.tree-file-tag {
  font-size: .62em;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--text-faint);
  background: var(--bg-callout);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--border-faint);
  flex: 0 0 auto;
}
/* nested folder/file children get extra indent */
.tree-children .tree-folder > summary { padding-left: 1.55em; }
.tree-children .tree-children .tree-folder > summary { padding-left: 2.75em; }
.tree-children .tree-children .tree-children .tree-folder > summary { padding-left: 3.95em; }
.tree-children .tree-file { padding-left: 2.75em; }
.tree-children .tree-children .tree-file { padding-left: 3.95em; }
.tree-children .tree-children .tree-children .tree-file { padding-left: 5.15em; }
.sidebar-meta {
  font-size: .72em;
  color: var(--text-faint);
  margin-top: 1em;
  padding-top: .7em;
  border-top: 1px solid var(--border-faint);
}
.wrap-main {
  flex: 1; min-width: 0;
  padding: 2em 2em 4em;
  max-width: none;
}
/* On note pages inside the wrapper shell, constrain the prose to a
   readable line-length and centre it in the available main pane. The
   sidebar already eats 280px on the left, so the prose floats nicely. */
.wrap-main .prose {
  max-width: 760px;
  margin: 0 auto;
}
.wrap-main-canvas { padding: 1.2em 1.2em 3em; }
.sidebar-title-link {
  color: inherit !important;
  text-decoration: none !important;
  border-bottom: none !important;
}
.sidebar-title-link:hover { color: var(--text-accent) !important; }
@media (max-width: 760px) {
  .wrap-shell { flex-direction: column; }
  .wrap-sidebar {
    flex: 0 0 auto; width: 100%;
    height: auto; max-height: 50vh;
    position: static; border-right: none;
    border-bottom: 1px solid var(--border-faint);
  }
  .wrap-sidebar.collapsed { max-height: 48px; }
  .wrap-main { padding: 1em 1em 3em; }
}
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
  canvases?: string[];                // canvas ULIDs in this share
  assets?: Record<string, string>;    // image filename → opaque asset key
  created_at?: string;
  gated?: boolean;
}

export interface CanvasNode {
  id: string;
  type: "text" | "file" | "link" | "group";
  x: number; y: number; width: number; height: number;
  color?: string;
  text?: string;
  file?: string;
  url?: string;
  label?: string;
  subpath?: string;
}
export interface CanvasEdge {
  id: string;
  fromNode: string; toNode: string;
  fromSide?: "top" | "right" | "bottom" | "left";
  toSide?: "top" | "right" | "bottom" | "left";
  color?: string;
  label?: string;
  toEnd?: "arrow" | "none";
  fromEnd?: "arrow" | "none";
}
export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
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

// Lightweight version of loadNotes — only fetches `meta:` keys, never the
// markdown bodies. Used by note/canvas pages that need to render the sidebar
// tree but don't care about contents of the OTHER notes in the wrapper.
export interface NoteLite { ulid: string; basename: string; path: string; title: string }
export async function loadNotesMeta(notes: KVNamespace, ulids: string[]): Promise<NoteLite[]> {
  return Promise.all(
    ulids.map(async (u): Promise<NoteLite> => {
      const metaRaw = await notes.get(`meta:${u}`);
      let basename = u, path = u;
      if (metaRaw) {
        try {
          const m = JSON.parse(metaRaw) as NoteMeta;
          if (m.basename) basename = m.basename;
          if (m.path) path = m.path;
        } catch { /* fall through */ }
      }
      return { ulid: u, basename, path, title: basename };
    })
  );
}

export interface CanvasLite { ulid: string; path: string; basename: string }
export async function loadCanvasMeta(notes: KVNamespace, ulids: string[]): Promise<CanvasLite[]> {
  return Promise.all(ulids.map(async (u): Promise<CanvasLite> => {
    const raw = await notes.get(`canvasmeta:${u}`);
    let path = u, basename = u;
    if (raw) {
      try {
        const m = JSON.parse(raw) as NoteMeta;
        path = m.path; basename = m.basename;
      } catch { /* keep defaults */ }
    }
    return { ulid: u, path, basename };
  }));
}

// Build the Obsidian-style nested file tree shared by the wrapper landing AND
// the note/canvas pages. activeUlid (note OR canvas) gets the .active class
// and its ancestor folders are emitted with `open` so the user lands on the
// right spot in the tree.
export function renderTreeSidebar(opts: {
  title: string;
  description?: string;
  gated?: boolean;
  shareBase: string;
  tokenQuery: string;
  notes: { ulid: string; path: string; title: string; basename: string; md?: string | null }[];
  canvases: CanvasLite[];
  assetCount: number;
  activeUlid?: string;
  showDownload?: boolean;
}): string {
  const tq = opts.tokenQuery;
  type TreeFile = { kind: "note" | "canvas"; ulid: string; label: string; isActive: boolean };
  type TreeFolder = { name: string; folders: Map<string, TreeFolder>; files: TreeFile[]; hasActive: boolean };
  const root: TreeFolder = { name: "", folders: new Map(), files: [], hasActive: false };
  function ensureFolder(parts: string[]): TreeFolder[] {
    const chain: TreeFolder[] = [];
    let cur = root;
    for (const seg of parts) {
      let next = cur.folders.get(seg);
      if (!next) {
        next = { name: seg, folders: new Map(), files: [], hasActive: false };
        cur.folders.set(seg, next);
      }
      chain.push(next);
      cur = next;
    }
    return chain;
  }
  for (const n of opts.notes) {
    if (n.md === null) continue;
    const parts = n.path.split("/");
    const fileName = parts.pop()!.replace(/\.md$/i, "");
    const chain = ensureFolder(parts);
    const isActive = opts.activeUlid === n.ulid;
    (chain.length ? chain[chain.length - 1] : root).files.push({
      kind: "note", ulid: n.ulid, label: n.title || fileName, isActive,
    });
    if (isActive) for (const f of chain) f.hasActive = true;
  }
  for (const c of opts.canvases) {
    const parts = c.path.split("/");
    const fileName = parts.pop()!.replace(/\.canvas$/i, "");
    const chain = ensureFolder(parts);
    const isActive = opts.activeUlid === c.ulid;
    (chain.length ? chain[chain.length - 1] : root).files.push({
      kind: "canvas", ulid: c.ulid, label: fileName || c.basename, isActive,
    });
    if (isActive) for (const f of chain) f.hasActive = true;
  }
  function countDescendants(node: TreeFolder): number {
    let n = node.files.length;
    for (const sub of node.folders.values()) n += countDescendants(sub);
    return n;
  }
  function renderTreeFolder(node: TreeFolder, isRoot: boolean): string {
    const subs = [...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name));
    const files = [...node.files].sort((a, b) => a.label.localeCompare(b.label));
    const childHtml = subs.map((s) => renderTreeFolder(s, false)).join("") +
      files.map((f) => {
        const href = f.kind === "canvas"
          ? `${opts.shareBase}/c/${f.ulid}${tq}`
          : `${opts.shareBase}/${f.ulid}${tq}`;
        const tag = f.kind === "canvas"
          ? `<span class="tree-file-tag">canvas</span>` : "";
        const cls = f.isActive ? "tree-file active" : "tree-file";
        return `<a class="${cls}" href="${href}"><span class="tree-file-name">${escapeHtml(f.label)}</span>${tag}</a>`;
      }).join("");
    if (isRoot) return childHtml;
    const total = countDescendants(node);
    // open if it contains the active file OR if there's no active file at all
    // (so the wrapper landing shows everything expanded by default).
    const open = node.hasActive || !opts.activeUlid ? " open" : "";
    return `<details class="tree-folder"${open}><summary><span class="tree-chevron">▶</span><span class="tree-folder-name">${escapeHtml(node.name)}</span><span class="tree-folder-count">${total}</span></summary><div class="tree-children">${childHtml}</div></details>`;
  }
  const treeHtml = renderTreeFolder(root, true);
  const noteCount = opts.notes.filter(n => n.md !== null).length;
  const meta = `${noteCount} note${noteCount === 1 ? "" : "s"}` +
    (opts.canvases.length ? ` · ${opts.canvases.length} canvas${opts.canvases.length === 1 ? "" : "es"}` : "") +
    (opts.assetCount ? ` · ${opts.assetCount} asset${opts.assetCount === 1 ? "" : "s"}` : "");
  const gatedBadge = opts.gated ? `<div class="sidebar-badge"><span class="gated-pill" title="this share requires a token">🔒 gated</span></div>` : "";
  const desc = opts.description ? `<p class="sidebar-desc">${escapeHtml(opts.description)}</p>` : "";
  const downloadLink = opts.showDownload
    ? `<a class="sidebar-cta" href="${opts.shareBase}/download${tq}" download>⬇ Download as .zip</a>`
    : `<a class="sidebar-cta" href="${opts.shareBase}${tq}">← back to overview</a>`;
  return `<aside class="wrap-sidebar" id="wrap-sidebar">
  <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle navigation">☰</button>
  <div class="sidebar-inner">
    <div class="sidebar-header">
      <h1 class="sidebar-title"><a href="${opts.shareBase}${tq}" class="sidebar-title-link">${escapeHtml(opts.title)}</a></h1>
      ${gatedBadge}
      ${desc}
    </div>
    ${downloadLink}
    <div class="sidebar-section">
      <div class="sidebar-section-title">Files</div>
      <div class="tree">${treeHtml}</div>
    </div>
    <div class="sidebar-meta">${meta}</div>
  </div>
</aside>`;
}

const SIDEBAR_TOGGLE_JS = `<script>
(function(){
  var btn = document.getElementById("sidebar-toggle");
  var sb = document.getElementById("wrap-sidebar");
  if (btn && sb) btn.addEventListener("click", function(){ sb.classList.toggle("collapsed"); });
  // On narrow viewports, collapse the sidebar after a tree-link click so the
  // user can read the note. Mirrors Obsidian mobile's behaviour.
  if (sb && matchMedia("(max-width: 760px)").matches) {
    sb.querySelectorAll(".tree-file").forEach(function(a){
      a.addEventListener("click", function(){ sb.classList.add("collapsed"); });
    });
  }
  // Scroll the active item into view inside the sidebar
  var active = sb && sb.querySelector(".tree-file.active");
  if (active) active.scrollIntoView({ block: "center" });
})();
</script>`;

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
  shareSet?: Map<string, string>; // basename → ulid (for .md wikilink resolution)
  canvasSet?: Map<string, string>;// canvas basename (no ext) → canvas ulid
  assets?: Record<string, string>;// image filename → asset key (for image embed rewriting)
  path?: string;                  // vault-relative path (for breadcrumb)
  tokenQuery?: string;            // "?t=<jwt>" appended to internal links when gated
  gated?: boolean;
  // Optional wrapper-tree data: when present, note/canvas pages render the
  // same Obsidian-style sidebar as the wrapper landing, so navigation between
  // notes never loses the file explorer.
  wrapTree?: {
    wrapTitle: string;
    wrapDesc?: string;
    notes: NoteLite[];
    canvases: CanvasLite[];
    assetCount: number;
  };
}

export function renderNote(md: string, ulid: string, ctx?: RenderCtx): string {
  const { fm, body: rawBody } = parseFrontmatter(md);
  // Title falls back through: frontmatter title → filename basename (from ctx.path) → ULID.
  // The filename is what the user actually recognises; ULID is only the last resort
  // for orphan notes published without path metadata.
  const fileTitle = ctx?.path?.split("/").pop()?.replace(/\.md$/i, "");
  const title = (fm?.byKey.get("title") as string) || fileTitle || ulid;

  const tq = ctx?.tokenQuery ?? "";
  // Strip a leading H1 that duplicates the title — otherwise the page renders
  // its title twice (once from <h1> below, once from the markdown's own # heading).
  const dedupedBody = rawBody.replace(
    /^\s*#\s+(.+?)\s*$/m,
    (match, heading: string) =>
      heading.trim().toLowerCase() === title.trim().toLowerCase() ? "" : match
  );
  // Image extensions Obsidian recognises in embeds — used for both ![[…]] and ![](…) forms
  const IMG_EXT = /\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i;
  const assetUrl = (filename: string): string | null => {
    if (!ctx?.assets) return null;
    // Match either by full path or by basename — bulk-publish stores both forms
    const direct = ctx.assets[filename] || ctx.assets[filename.split("/").pop() ?? filename];
    return direct ? `/asset/${direct}` : null;
  };

  // ![[image.jpg]] and ![[image.jpg|alt]] — Obsidian-style image embeds (must run before
  // the wikilink rewrite or they'd be converted to bare wikilinks).
  let preBody = dedupedBody.replace(
    /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_m, target: string, alias?: string) => {
      const t = target.trim();
      const url = assetUrl(t);
      if (url) return `<img src="${escapeAttr(url)}" alt="${escapeAttr((alias ?? t).trim())}" class="embedded-image" loading="lazy">`;
      return `<span class="embed-missing" title="asset not in this share">📎 ${escapeHtml(t)}</span>`;
    }
  );

  // ![alt](image.jpg) — standard markdown image syntax, only rewrite if the path is a vault-relative
  // image (no protocol). We let marked handle remote images normally.
  preBody = preBody.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (m, alt: string, src: string) => {
      const s = src.trim();
      if (/^https?:\/\//i.test(s) || s.startsWith("/asset/")) return m;
      if (!IMG_EXT.test(s)) return m;
      const url = assetUrl(s);
      return url ? `![${alt}](${url})` : m;
    }
  );

  // [[Wikilink]] — resolve against share-set (.md) and canvasSet (.canvas) so canvases linked
  // from notes become navigable too.
  const body = preBody.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_m, target: string, alias?: string) => {
      const targetTrim = target.trim();
      const label = (alias ?? target).trim();
      if (ctx?.shareBase) {
        const noteUlid = ctx.shareSet?.get(targetTrim);
        if (noteUlid) {
          return `<a class="wikilink-internal" href="${ctx.shareBase}/${noteUlid}${tq}">${escapeHtml(label)}</a>`;
        }
        // Try canvas: target may end with .canvas or just be the basename
        const canvasKey = targetTrim.replace(/\.canvas$/i, "");
        const canvasUlid = ctx.canvasSet?.get(canvasKey);
        if (canvasUlid) {
          return `<a class="wikilink-internal wikilink-canvas" href="${ctx.shareBase}/c/${canvasUlid}${tq}" title="canvas">🗺 ${escapeHtml(label)}</a>`;
        }
      }
      return `<span class="wikilink-private" title="not in this published slice">${escapeHtml(label)}</span>`;
    }
  );

  const rawHtml = marked.parse(body, { async: false }) as string;
  // Notes that are just frontmatter (or were stamped on an empty file) render to an
  // empty body. Without a placeholder, the page is just a title + properties panel
  // and looks broken. Surface that this is a real-but-empty note instead.
  const trimmedHtml = rawHtml.trim();
  const html = trimmedHtml.length > 0
    ? rawHtml
    : `<div class="empty-note-placeholder">
        <p><em>This note has no content in the source vault.</em></p>
        <p class="setting-item-description">Only frontmatter (e.g. ULID, tags) is published — no body text was written. Open the source file in Obsidian to add content, then re-publish.</p>
      </div>`;
  const breadcrumb = renderBreadcrumb(ctx, title);
  const props = renderProperties(fm, ulid);

  // Detect mermaid blocks so we only ship the (heavy) mermaid runtime when there's
  // something to render. marked emits ```mermaid as <pre><code class="language-mermaid">.
  const hasMermaid = /<code class="language-mermaid">/.test(html);
  const tail = hasMermaid ? MERMAID_BOOTSTRAP : "";

  if (ctx?.wrapTree && ctx?.shareBase) {
    const sidebar = renderTreeSidebar({
      title: ctx.wrapTree.wrapTitle,
      description: ctx.wrapTree.wrapDesc,
      gated: ctx.gated,
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes.map(n => ({ ...n, md: "" })),
      canvases: ctx.wrapTree.canvases,
      assetCount: ctx.wrapTree.assetCount,
      activeUlid: ulid,
      showDownload: false,
    });
    return shell({ title, sidebarLayout: true, body: `
${sidebar}
<main class="wrap-main">
  <article class="prose">
    ${breadcrumb}
    ${props}
    <h1>${escapeHtml(title)}</h1>
    ${html}
  </article>
  ${tail}
</main>
${SIDEBAR_TOGGLE_JS}
` });
  }

  return shell({ title, body: `
${breadcrumb}
${props}
<h1>${escapeHtml(title)}</h1>
${html}
${tail}
` });
}

// Loaded only on pages that contain ```mermaid``` blocks. Converts <pre><code class="language-mermaid">
// to mermaid divs and runs the renderer. Theme follows the page's color scheme.
const MERMAID_BOOTSTRAP = `<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs";
const dark = matchMedia("(prefers-color-scheme: dark)").matches;
mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "default", securityLevel: "loose" });
document.querySelectorAll("pre > code.language-mermaid").forEach((el) => {
  const code = el.textContent;
  const div = document.createElement("div");
  div.className = "mermaid";
  div.textContent = code;
  el.parentElement.replaceWith(div);
});
mermaid.run().catch(e => console.warn("mermaid:", e));
</script>`;

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

  // Load canvas metadata so the landing can list them
  const canvasMetas = await Promise.all((wrap.canvases ?? []).map(async (u) => {
    const raw = await notes.get(`canvasmeta:${u}`);
    let path = u, basename = u;
    if (raw) {
      try {
        const m = JSON.parse(raw) as NoteMeta;
        path = m.path; basename = m.basename;
      } catch { /* keep defaults */ }
    }
    return { ulid: u, path, basename };
  }));

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

  const assetCount = wrap.assets ? Object.keys(wrap.assets).length : 0;

  const sidebar = renderTreeSidebar({
    title: wrap.title ?? "Shared slice",
    description: wrap.description,
    gated: wrap.gated,
    shareBase,
    tokenQuery: tq,
    notes: records,
    canvases: canvasMetas,
    assetCount,
    showDownload: true,
  });

  return shell({
    title: wrap.title ?? "Shared slice",
    wide: true,
    sidebarLayout: true,
    body: `
${sidebar}

<main class="wrap-main">
  <div id="graph-host">
    <span class="graph-help">drag · scroll to zoom · click a node to open · hover to focus · double-click empty space to reset</span>
    <button id="graph-reset" class="graph-reset-btn" type="button" title="Reset view (or double-click empty space)">⌖ Reset view</button>
    <div id="graph" style="width:100%;height:100%"></div>
  </div>

  <h2 style="margin-top:1em">Notes in this slice</h2>
  ${folderSections.join("")}

  <div class="wrap-meta">${records.length} note(s)${canvasMetas.length ? ` · ${canvasMetas.length} canvas${canvasMetas.length === 1 ? "" : "es"}` : ""}${assetCount ? ` · ${assetCount} asset(s)` : ""} · created ${escapeHtml(wrap.created_at ?? "")}${wrap.gated ? " · gated" : ""}</div>
</main>

${SIDEBAR_TOGGLE_JS}

<script src="https://cdn.jsdelivr.net/npm/graphology@0.25.4/dist/graphology.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-quadtree@3/dist/d3-quadtree.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-dispatch@3/dist/d3-dispatch.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-timer@3/dist/d3-timer.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-force@3/dist/d3-force.min.js"></script>
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
  // Dim must be a flat colour (sigma's WebGL renderer ignores rgba alpha for
  // node fills). Pick something close to the background so non-neighbours
  // genuinely fade instead of staying half-visible.
  var bgIsDark   = matchMedia("(prefers-color-scheme: dark)").matches;
  var dimColor   = bgIsDark ? "#2a2a2a" : "#dee2e6";

  // Degree → node size (Obsidian's "more links → bigger node")
  var degree = {};
  DATA.edges.forEach(function(e){
    if (e.from === e.to) return;
    degree[e.from] = (degree[e.from] || 0) + 1;
    degree[e.to]   = (degree[e.to]   || 0) + 1;
  });

  // Build d3-force node/link arrays. d3-force is what Obsidian's graph view uses —
  // produces clean centered layouts with disconnected components naturally drifting
  // at the periphery instead of clumping into rings (which is what FA2 was doing here).
  var sized = DATA.nodes.map(function(n, i){
    var theta = (i / DATA.nodes.length) * 2 * Math.PI;
    var d = degree[n.id] || 0;
    return {
      id: n.id,
      label: n.label,
      folder: n.folder,
      // Match Obsidian: small base node + small degree-bonus. Range 3 → 8 across the
      // graph. Hub nodes are still distinguishable but never become 17px blobs that
      // crowd their neighbours.
      size: 3 + Math.min(d, 10) * 0.5,
      x: Math.cos(theta) * 80,
      y: Math.sin(theta) * 80,
    };
  });
  var links = DATA.edges
    .filter(function(e){ return e.from !== e.to; })
    .map(function(e){ return { source: e.from, target: e.to }; });

  if (typeof d3 !== "undefined" && d3.forceSimulation) {
    // Tuned to match Obsidian's defaults reasonably well:
    //   - charge (repulsion): -180  → enough to push isolated nodes apart
    //   - link distance: 50         → comfortable spacing between connected pairs
    //   - center pull: weak (0.05)  → keeps centroid at origin without crushing layout
    //   - collide: by node size + label gutter so labels rarely overlap
    // Tuned for Obsidian-like spread: longer links, stronger repulsion, generous
    // collision radius so labels have room to render without overlapping.
    var sim = d3.forceSimulation(sized)
      .force("link", d3.forceLink(links).id(function(d){ return d.id; }).distance(80).strength(0.2))
      .force("charge", d3.forceManyBody().strength(-260).distanceMax(700))
      .force("center", d3.forceCenter(0, 0).strength(0.12))
      .force("x", d3.forceX(0).strength(0.04))
      .force("y", d3.forceY(0).strength(0.04))
      .force("collide", d3.forceCollide().radius(function(d){ return d.size + 18; }).strength(0.95))
      .stop();
    var ticks = Math.max(250, Math.min(600, Math.round(140 * Math.log2(sized.length + 2))));
    for (var t = 0; t < ticks; t++) sim.tick();
  }

  // Recenter, scale, and CLAMP outliers so the main cluster always frames in the
  // viewport regardless of where d3-force settled disconnected components.
  var positions = sized.filter(function(d){ return isFinite(d.x) && isFinite(d.y); });
  if (positions.length > 0) {
    // 1) shift centroid to origin (mean of x,y) — beats percentile midpoint for skewed layouts
    var meanX = 0, meanY = 0;
    positions.forEach(function(d){ meanX += d.x; meanY += d.y; });
    meanX /= positions.length; meanY /= positions.length;
    sized.forEach(function(d){ d.x -= meanX; d.y -= meanY; });

    // 2) scale so 90th-percentile distance from origin = TARGET (so most nodes fit in [-TARGET, TARGET])
    var TARGET = 50;
    var distances = positions.map(function(d){ return Math.sqrt(d.x*d.x + d.y*d.y); }).sort(function(a,b){return a-b;});
    var p90 = distances[Math.floor(distances.length * 0.9)] || 1;
    var scale = TARGET / Math.max(1, p90);
    sized.forEach(function(d){ d.x *= scale; d.y *= scale; });

    // 3) hard-clamp extreme outliers — disconnected components may have flown 5x further
    //    than the main cluster; without this, sigma's auto-fit shrinks the main cluster
    //    to a corner of the viewport while wasted whitespace dominates.
    var MAX_R = TARGET * 1.6;
    sized.forEach(function(d){
      var r = Math.sqrt(d.x*d.x + d.y*d.y);
      if (r > MAX_R) {
        d.x = d.x / r * MAX_R;
        d.y = d.y / r * MAX_R;
      }
    });
  }

  // Add nodes + edges to graphology now that positions are final
  sized.forEach(function(d){
    g.addNode(d.id, {
      label: d.label, x: d.x, y: d.y, size: d.size, color: nodeColor,
    });
  });
  DATA.edges.forEach(function(e){
    if (g.hasNode(e.from) && g.hasNode(e.to) && !g.hasEdge(e.from, e.to) && e.from !== e.to) {
      g.addEdge(e.from, e.to, { size: 1, color: edgeColor });
    }
  });

  // Background colour for the label pill — uses the page bg so labels look
  // like they're cut out of the canvas rather than floating over a noisy
  // background. Reads at any zoom + with neighbour clusters that overlap.
  var labelBg = (styles.getPropertyValue("--bg-primary").trim() || (bgIsDark ? "#1e1e1e" : "#ffffff"));
  // Custom label renderer with a filled background pill behind every label.
  // This is the missing ingredient — sigma's default renderer just draws
  // text, so neighbour labels and dim-node ghosts fight each other for
  // legibility on hover. The pill gives each label its own readable surface.
  function drawLabelWithBg(context, data, settings) {
    if (!data.label) return;
    var size = settings.labelSize;
    var font = settings.labelFont;
    var weight = settings.labelWeight;
    context.font = (weight || "400") + " " + size + "px " + font;
    var metrics = context.measureText(data.label);
    var PADX = 5, PADY = 3, RADIUS = 4;
    var textX = data.x + data.size + 4;
    var textY = data.y + size / 3;
    // Pill background
    context.fillStyle = labelBg;
    context.beginPath();
    var rx = textX - PADX;
    var ry = data.y - size / 2 - PADY + 1;
    var rw = metrics.width + PADX * 2;
    var rh = size + PADY * 2;
    if (typeof context.roundRect === "function") {
      context.roundRect(rx, ry, rw, rh, RADIUS);
    } else {
      context.rect(rx, ry, rw, rh);
    }
    context.fill();
    // Text
    var col = settings.labelColor && settings.labelColor.color;
    context.fillStyle = col || labelColor;
    context.fillText(data.label, textX, textY);
  }

  var renderer = new Sigma(g, document.getElementById("graph"), {
    labelColor: { color: labelColor },
    labelSize: 12,
    labelWeight: "500",
    labelRenderer: drawLabelWithBg,
    hoverRenderer: drawLabelWithBg,
    // Match Obsidian: only show labels for nodes that are big enough AND don't
    // collide with each other in the label grid. At default zoom only hubs show
    // labels; zoom in to reveal more.
    labelDensity: DATA.nodes.length > 50 ? 0.1 : 0.4,
    labelGridCellSize: DATA.nodes.length > 50 ? 180 : 100,
    labelRenderedSizeThreshold: DATA.nodes.length > 50 ? 4.5 : 1,
    renderEdgeLabels: false,
    defaultEdgeColor: edgeColor,
    minCameraRatio: 0.05,
    maxCameraRatio: 8,
    // zIndex lets us render the focused node + its edges on TOP of the dim ones
    zIndex: true,
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

  // Hover-focus implemented via sigma reducers — the only way to selectively
  // FORCE labels on (for hovered + neighbours) and OFF (for the rest) without
  // mutating graph data. The previous direct-mutation version made every other
  // label still render at default opacity, producing the unreadable overlap the
  // user reported. Now: hovered node grows + turns accent, its neighbours stay
  // visible with labels, and everyone else fades to a non-distracting dim.
  var hoveredNode = null;
  var hoveredNeighbors = null;

  renderer.setSetting("nodeReducer", function(node, data){
    var res = Object.assign({}, data);
    if (hoveredNode) {
      if (node === hoveredNode) {
        res.color = accent;
        res.size = data.size * 2;
        res.forceLabel = true;
        res.zIndex = 2;
      } else if (hoveredNeighbors[node]) {
        res.color = accent;       // neighbour nodes also adopt accent so the focused cluster reads as one shape
        res.forceLabel = true;
        res.zIndex = 1;
      } else {
        res.color = dimColor;
        res.label = "";    // hide label entirely so it can't overlap the focused cluster
        res.zIndex = 0;
      }
    }
    return res;
  });

  renderer.setSetting("edgeReducer", function(edge, data){
    var res = Object.assign({}, data);
    if (hoveredNode) {
      var src = g.source(edge), tgt = g.target(edge);
      if (src === hoveredNode || tgt === hoveredNode) {
        res.color = accent;
        res.size = (data.size || 1) * 2.5;
        res.zIndex = 1;
      } else {
        res.color = dimColor;
        res.zIndex = 0;
      }
    }
    return res;
  });

  renderer.on("enterNode", function(p){
    hoveredNode = p.node;
    hoveredNeighbors = {};
    hoveredNeighbors[p.node] = true;
    g.forEachNeighbor(p.node, function(nb){ hoveredNeighbors[nb] = true; });
    renderer.refresh();
    document.body.style.cursor = "pointer";
  });
  renderer.on("leaveNode", function(){
    hoveredNode = null;
    hoveredNeighbors = null;
    renderer.refresh();
    document.body.style.cursor = "";
  });
  renderer.on("clickNode", function(p){ window.location = "/share/" + DATA.wrapId + "/" + p.node + DATA.tokenQuery; });
})();
</script>
`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas rendering
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_COLORS: Record<string, string> = {
  "1": "#fb464c", // red
  "2": "#e9973f", // orange
  "3": "#e0de71", // yellow
  "4": "#44cf6e", // green
  "5": "#53dfdd", // cyan
  "6": "#a882ff", // purple
};

function canvasColor(c: string | undefined): string {
  if (!c) return "#888";
  if (c.startsWith("#")) return c;
  return CANVAS_COLORS[c] ?? "#888";
}

function nodeAnchor(n: CanvasNode, side: "top" | "right" | "bottom" | "left" | undefined): { x: number; y: number } {
  const cx = n.x + n.width / 2;
  const cy = n.y + n.height / 2;
  switch (side) {
    case "top": return { x: cx, y: n.y };
    case "right": return { x: n.x + n.width, y: cy };
    case "bottom": return { x: cx, y: n.y + n.height };
    case "left": return { x: n.x, y: cy };
    default: return { x: cx, y: cy };
  }
}

export function renderCanvas(json: string, ulid: string, ctx?: RenderCtx): string {
  let canvas: CanvasData;
  try {
    canvas = JSON.parse(json) as CanvasData;
  } catch {
    return shell({ title: "Canvas (parse error)", body: `<div class="gate-error"><h1>Could not parse canvas</h1></div>` });
  }
  if (!canvas.nodes?.length) {
    return shell({ title: "Empty canvas", body: `<div class="gate-error"><h1>This canvas is empty</h1></div>` });
  }

  const tq = ctx?.tokenQuery ?? "";
  const title = ctx?.path
    ? (ctx.path.split("/").pop() ?? ulid).replace(/\.canvas$/i, "")
    : ulid;

  // Bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of canvas.nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  const pad = 80;
  const vbX = minX - pad, vbY = minY - pad;
  const vbW = (maxX - minX) + pad * 2;
  const vbH = (maxY - minY) + pad * 2;

  const nodeIndex: Record<string, CanvasNode> = {};
  for (const n of canvas.nodes) nodeIndex[n.id] = n;

  // Render groups first so they sit behind everything
  const groups = canvas.nodes.filter((n) => n.type === "group");
  const others = canvas.nodes.filter((n) => n.type !== "group");

  const renderTextNode = (n: CanvasNode) => {
    const md = n.text ?? "";
    const html = marked.parse(md, { async: false }) as string;
    const color = canvasColor(n.color);
    return `<foreignObject x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="canvas-text" style="border-color:${color}">${html}</div>
    </foreignObject>`;
  };

  const renderFileNode = (n: CanvasNode) => {
    const file = (n.file ?? "").trim();
    const basename = file.split("/").pop()?.replace(/\.md$/i, "") ?? file;
    const color = canvasColor(n.color);
    let inner = `<div class="canvas-file-name">📄 ${escapeHtml(basename)}</div>`;
    let href: string | null = null;
    if (ctx?.shareBase) {
      const u = ctx.shareSet?.get(basename);
      if (u) href = `${ctx.shareBase}/${u}${tq}`;
      else {
        const cu = ctx.canvasSet?.get(basename.replace(/\.canvas$/i, ""));
        if (cu) href = `${ctx.shareBase}/c/${cu}${tq}`;
      }
    }
    const link = href
      ? `<a xmlns="http://www.w3.org/1999/xhtml" href="${escapeAttr(href)}" class="canvas-file" style="border-color:${color}">${inner}</a>`
      : `<div xmlns="http://www.w3.org/1999/xhtml" class="canvas-file canvas-file-private" style="border-color:${color}">${inner}<div class="canvas-file-private-note">not in this share</div></div>`;
    return `<foreignObject x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}">${link}</foreignObject>`;
  };

  const renderLinkNode = (n: CanvasNode) => {
    const url = n.url ?? "";
    const color = canvasColor(n.color);
    return `<foreignObject x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}">
      <a xmlns="http://www.w3.org/1999/xhtml" href="${escapeAttr(url)}" class="canvas-link" style="border-color:${color}" target="_blank" rel="noopener">🔗 ${escapeHtml(url)}</a>
    </foreignObject>`;
  };

  const renderGroupNode = (n: CanvasNode) => {
    const color = canvasColor(n.color);
    const label = n.label ?? "";
    return `<g class="canvas-group">
      <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="12" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="6 4"/>
      ${label ? `<text x="${n.x + 12}" y="${n.y + 22}" font-size="16" font-weight="600" fill="${color}">${escapeHtml(label)}</text>` : ""}
    </g>`;
  };

  const groupSvg = groups.map(renderGroupNode).join("\n");
  const otherSvg = others.map((n) => {
    if (n.type === "text") return renderTextNode(n);
    if (n.type === "file") return renderFileNode(n);
    if (n.type === "link") return renderLinkNode(n);
    return "";
  }).join("\n");

  const edgeSvg = canvas.edges?.map((e) => {
    const from = nodeIndex[e.fromNode];
    const to = nodeIndex[e.toNode];
    if (!from || !to) return "";
    const a = nodeAnchor(from, e.fromSide);
    const b = nodeAnchor(to, e.toSide);
    // Cubic bezier; control points pull along the side direction so curves leave the node naturally
    const offset = Math.max(40, Math.abs(b.x - a.x) / 3);
    const c1 = (() => {
      switch (e.fromSide) {
        case "right": return { x: a.x + offset, y: a.y };
        case "left": return { x: a.x - offset, y: a.y };
        case "top": return { x: a.x, y: a.y - offset };
        case "bottom": return { x: a.x, y: a.y + offset };
        default: return { x: (a.x + b.x) / 2, y: a.y };
      }
    })();
    const c2 = (() => {
      switch (e.toSide) {
        case "right": return { x: b.x + offset, y: b.y };
        case "left": return { x: b.x - offset, y: b.y };
        case "top": return { x: b.x, y: b.y - offset };
        case "bottom": return { x: b.x, y: b.y + offset };
        default: return { x: (a.x + b.x) / 2, y: b.y };
      }
    })();
    const stroke = canvasColor(e.color) ?? "#888";
    const path = `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
    const arrow = e.toEnd !== "none" ? `marker-end="url(#arrow)"` : "";
    const label = e.label
      ? `<text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 6}" font-size="13" fill="var(--text-normal)" text-anchor="middle" class="canvas-edge-label">${escapeHtml(e.label)}</text>`
      : "";
    return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-opacity="0.7" ${arrow}/>${label}`;
  }).join("\n") ?? "";

  const breadcrumb = renderBreadcrumb(ctx, title);
  const canvasBody = `<h1 class="canvas-title">🗺 ${escapeHtml(title)}</h1>
<p class="canvas-help">${canvas.nodes.length} node(s) · ${canvas.edges?.length ?? 0} edge(s) · scroll/pinch to zoom · drag to pan</p>
<div class="canvas-host" id="canvas-host">
  <svg id="canvas-svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#888" />
      </marker>
    </defs>
    <g id="canvas-edges">${edgeSvg}</g>
    <g id="canvas-groups">${groupSvg}</g>
    <g id="canvas-nodes">${otherSvg}</g>
  </svg>
  <button id="canvas-reset" class="graph-reset-btn" type="button" title="Reset view">⌖ Reset view</button>
</div>
${CANVAS_PAN_ZOOM}`;

  if (ctx?.wrapTree && ctx?.shareBase) {
    const sidebar = renderTreeSidebar({
      title: ctx.wrapTree.wrapTitle,
      description: ctx.wrapTree.wrapDesc,
      gated: ctx.gated,
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes.map(n => ({ ...n, md: "" })),
      canvases: ctx.wrapTree.canvases,
      assetCount: ctx.wrapTree.assetCount,
      activeUlid: ulid,
      showDownload: false,
    });
    return shell({ title, sidebarLayout: true, body: `
${sidebar}
<main class="wrap-main wrap-main-canvas">
  ${breadcrumb}
  ${canvasBody}
</main>
${SIDEBAR_TOGGLE_JS}
` });
  }

  return shell({
    title,
    wide: true,
    body: `
${breadcrumb}
${canvasBody}
`,
  });
}

const CANVAS_PAN_ZOOM = `<script>
(function(){
  const svg = document.getElementById("canvas-svg");
  const host = document.getElementById("canvas-host");
  if (!svg || !host) return;
  const initial = svg.getAttribute("viewBox").split(/\\s+/).map(Number);
  let [vx, vy, vw, vh] = initial;
  const apply = () => svg.setAttribute("viewBox", vx + " " + vy + " " + vw + " " + vh);
  const reset = () => { [vx, vy, vw, vh] = initial; apply(); };

  // Safari workaround — without explicit pixel width/height attributes on
  // the SVG, Safari fails to apply the viewBox transform to <foreignObject>
  // children, so canvas cards render at native size and overflow the host.
  // Setting concrete attributes (and refreshing on resize) makes Safari
  // honour preserveAspectRatio + viewBox the same way Chrome/Firefox do.
  const fitSvg = () => {
    const rect = host.getBoundingClientRect();
    svg.setAttribute("width", Math.max(1, Math.floor(rect.width)));
    svg.setAttribute("height", Math.max(1, Math.floor(rect.height)));
  };
  fitSvg();
  window.addEventListener("resize", fitSvg);

  // Wheel zoom (anchored at cursor)
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mx = vx + (e.clientX - rect.left) / rect.width * vw;
    const my = vy + (e.clientY - rect.top) / rect.height * vh;
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    vw *= factor; vh *= factor;
    vx = mx - (e.clientX - rect.left) / rect.width * vw;
    vy = my - (e.clientY - rect.top) / rect.height * vh;
    apply();
  }, { passive: false });

  // Drag to pan
  let dragging = false, lastX = 0, lastY = 0;
  svg.addEventListener("mousedown", (e) => {
    if (e.target.closest("a, foreignObject a")) return; // don't pan on link drag
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    svg.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - lastX) / rect.width * vw;
    const dy = (e.clientY - lastY) / rect.height * vh;
    vx -= dx; vy -= dy;
    lastX = e.clientX; lastY = e.clientY;
    apply();
  });
  window.addEventListener("mouseup", () => { dragging = false; svg.style.cursor = ""; });

  document.getElementById("canvas-reset")?.addEventListener("click", reset);
  svg.addEventListener("dblclick", reset);
})();
</script>`;

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

function shell(opts: { title: string; body: string; wide?: boolean; sidebarLayout?: boolean }): string {
  // sidebarLayout puts the body directly into a flex container so the wrapper
  // landing's <aside> + <main> children lay out side-by-side. Other pages
  // (notes, canvases, gate errors) keep the centered .container layout.
  const inner = opts.sidebarLayout
    ? `<div class="wrap-shell">${opts.body}</div>`
    : `<main class="container ${opts.wide ? "wide" : ""}">${opts.body}</main>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<style>${css}</style>
</head>
<body>
${inner}
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
