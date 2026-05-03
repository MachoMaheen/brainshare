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
  height: 78vh; min-height: 560px;
  margin: 0 0 2em;
}
.canvas-host:fullscreen { height: 100vh; border-radius: 0; border: 0; margin: 0; }
.canvas-host:fullscreen #canvas-svg { background-size: 30px 30px; }
/* Obsidian-style floating control rail along the right edge */
.canvas-rail {
  position: absolute;
  top: 12px; right: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  z-index: 5;
}
.canvas-rail button {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  border: 0;
  border-radius: 5px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  padding: 0;
  font-family: inherit;
}
.canvas-rail button:hover {
  background: var(--bg-chip);
  color: var(--text-accent);
}
.canvas-rail button:active { transform: scale(0.95); }
.canvas-rail .rail-divider {
  height: 1px;
  background: var(--border-faint);
  margin: 2px 4px;
}
@media (pointer: coarse) {
  /* Bump touch targets to ≥40px and add space so fingers don't hit two
     buttons at once. Triggered for any device whose primary pointer is
     touch (phones, tablets), not by viewport width. */
  .canvas-rail { gap: 8px; padding: 8px; }
  .canvas-rail button { width: 40px; height: 40px; font-size: 17px; }
  .canvas-rail .rail-divider { margin: 4px 6px; }
}
.canvas-rail .rail-help {
  position: relative;
}
.canvas-rail-tip {
  position: absolute;
  top: 0; right: 100%;
  margin-right: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  display: none;
}
.canvas-rail-tip.visible { display: block; }
.canvas-rail-tip kbd {
  background: var(--kbd-bg);
  border: 1px solid var(--border-faint);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-normal);
}
.canvas-backlinks {
  position: absolute;
  bottom: 10px; right: 12px;
  font-size: 11px;
  color: var(--text-faint);
  background: var(--bg-primary);
  padding: 3px 9px;
  border-radius: 12px;
  border: 1px solid var(--border-faint);
  z-index: 4;
}
/* Stage = the inner pannable/zoomable layer. We use HTML positioning + a
   single CSS transform here instead of SVG foreignObject because Safari
   refuses to apply SVG viewBox transforms to foreignObject children, which
   meant cards rendered at native size and overflowed the host. Pure HTML
   sidesteps the bug entirely and is also what Obsidian does internally. */
.canvas-stage {
  position: absolute;
  top: 0; left: 0;
  width: 0; height: 0;             /* size doesn't matter — we use overflow:visible */
  transform-origin: 0 0;
  cursor: grab;
}
.canvas-stage.grabbing { cursor: grabbing; }
#canvas-host {
  background:
    radial-gradient(circle at 1px 1px, var(--border-faint) 1px, transparent 1px) 0 0 / 24px 24px;
}
.canvas-edges-layer {
  position: absolute;
  top: 0; left: 0;
  width: 1px; height: 1px;
  overflow: visible;
  pointer-events: none;
}
.canvas-card {
  position: absolute;
  background: var(--bg-primary);
  border: 2px solid;
  border-radius: 8px;
  color: var(--text-normal);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.45;
  box-sizing: border-box;
  padding: 10px 14px;
}
.canvas-card.canvas-text { overflow: auto; }
.canvas-card > :first-child { margin-top: 0; }
.canvas-card > :last-child { margin-bottom: 0; }
.canvas-card h1, .canvas-card h2 { margin-top: .3em; margin-bottom: .25em; font-size: 1.1em; }
.canvas-card.canvas-file {
  display: flex; flex-direction: column; justify-content: center;
  text-decoration: none !important;
}
.canvas-card.canvas-file:hover { background: var(--bg-chip); }
.canvas-card.canvas-link {
  display: flex; align-items: center; gap: .4em;
  font-size: .85em;
  color: var(--text-link);
  text-decoration: none !important;
  word-break: break-all;
}
.canvas-group {
  position: absolute;
  border: 2px dashed;
  border-radius: 12px;
  box-sizing: border-box;
  background: rgba(168, 130, 255, 0.04);
  pointer-events: none;
}
.canvas-group-label {
  position: absolute;
  top: 6px; left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: inherit;
}
/* Legacy classes kept for any non-canvas users */
.canvas-text, .canvas-file, .canvas-link {
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
/* sidebar filter input — visible search bar above the tree */
.sidebar-search { margin: .2em 0 .9em; position: relative; }
.sidebar-filter-input {
  width: 100%; box-sizing: border-box;
  padding: 7px 10px 7px 28px;
  font-size: .85em;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  color: var(--text-normal);
  font-family: inherit;
  outline: none;
  transition: border-color .12s, box-shadow .12s;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238a8a8a' stroke-width='1.5'><circle cx='7' cy='7' r='4.5'/><line x1='10.5' y1='10.5' x2='14' y2='14' stroke-linecap='round'/></svg>");
  background-repeat: no-repeat;
  background-position: 8px center;
  background-size: 14px 14px;
}
.sidebar-filter-input:focus {
  border-color: var(--text-accent);
  box-shadow: 0 0 0 2px var(--bg-chip);
}
.sidebar-filter-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  height: 14px; width: 14px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' stroke='%238a8a8a' stroke-width='1.6' stroke-linecap='round'><line x1='4' y1='4' x2='12' y2='12'/><line x1='12' y1='4' x2='4' y2='12'/></svg>");
  background-repeat: no-repeat; background-position: center;
  cursor: pointer;
}
.sidebar-filter-hint {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  display: inline-flex; align-items: center; gap: 4px;
  font-size: .65em; color: var(--text-faint);
  background: var(--bg-secondary); padding: 2px 6px;
  border: 1px solid var(--border-faint); border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}
.sidebar-filter-hint:hover { color: var(--text-accent); border-color: var(--text-accent); }
.sidebar-filter-input:not(:placeholder-shown) ~ .sidebar-filter-hint { display: none; }
.sidebar-filter-hint-icon { display: none; font-size: 1.4em; line-height: 1; }
@media (pointer: coarse) {
  /* On touch devices the ⌘K text is meaningless — show just the magnifier
     icon and make the whole pill a comfortable tap target. */
  .sidebar-filter-hint { padding: 6px 10px; font-size: .8em; }
  .sidebar-filter-hint-text { display: none; }
  .sidebar-filter-hint-icon { display: inline; }
}
/* hide tree nodes filtered out — JS adds .filter-hidden during typing */
.tree-folder.filter-hidden, .tree-file.filter-hidden { display: none !important; }
/* highlight match within visible labels */
.tree-folder-name mark, .tree-file-name mark {
  background: var(--bg-chip);
  color: var(--text-accent);
  padding: 0 2px;
  border-radius: 2px;
}
.sidebar-filter-empty {
  font-size: .9em;
  color: var(--text-faint);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}
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

/* Command palette (⌘K) */
.cmd-palette, .cmd-help {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 14vh;
}
.cmd-palette[hidden], .cmd-help[hidden] { display: none; }
.cmd-palette-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
}
.cmd-palette-modal, .cmd-help-card {
  position: relative;
  width: min(560px, 92vw);
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  overflow: hidden;
}
.cmd-input {
  width: 100%; box-sizing: border-box;
  padding: 14px 18px;
  font-size: 15px;
  background: transparent;
  color: var(--text-normal);
  border: 0;
  border-bottom: 1px solid var(--border-faint);
  outline: none;
  font-family: inherit;
}
.cmd-list {
  max-height: 50vh;
  overflow-y: auto;
  padding: 6px 0;
}
.cmd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-normal);
}
.cmd-item.selected { background: var(--bg-chip); color: var(--text-accent); }
.cmd-icon { font-size: 14px; opacity: .8; flex: 0 0 auto; width: 18px; }
.cmd-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-hint {
  font-size: 12px; color: var(--text-faint);
  flex: 0 0 auto; max-width: 40%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cmd-empty { padding: 24px; text-align: center; color: var(--text-faint); font-size: 13px; }
.cmd-loading { padding: 10px 16px; color: var(--text-faint); font-size: 12px; font-style: italic; }
.cmd-section {
  padding: 8px 16px 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .05em;
  font-weight: 600;
  color: var(--text-faint);
  border-top: 1px solid var(--border-faint);
  margin-top: 4px;
}
.cmd-row-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cmd-row-main > .cmd-icon  { width: 18px; flex: 0 0 auto; opacity: .8; }
.cmd-row-main > .cmd-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-row-main > .cmd-hint  { flex: 0 0 auto; max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-snippet {
  margin-top: 3px;
  padding-left: 28px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cmd-snippet mark, .cmd-label mark {
  background: var(--bg-chip);
  color: var(--text-accent);
  padding: 0 2px;
  border-radius: 2px;
}
.cmd-item { display: block; }    /* override the flex from earlier — content rows have a sub-grid now */
.cmd-footer {
  display: flex; gap: 16px; justify-content: flex-end;
  padding: 8px 14px;
  font-size: 11px; color: var(--text-faint);
  border-top: 1px solid var(--border-faint);
  background: var(--bg-secondary);
}
.cmd-footer kbd, .cmd-help kbd {
  background: var(--kbd-bg);
  border: 1px solid var(--border-faint);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-normal);
}
.cmd-help-card { padding: 18px 22px 16px; }
.cmd-help-card h3 { margin: 0 0 12px; font-size: 14px; color: var(--text-normal); }
.cmd-help-card table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cmd-help-card td { padding: 5px 8px; vertical-align: top; }
.cmd-help-card td:first-child { width: 40%; color: var(--text-muted); white-space: nowrap; }
.cmd-help-card td:last-child  { color: var(--text-normal); }
.cmd-help-foot { margin: 12px 0 0; font-size: 12px; color: var(--text-faint); border-top: 1px solid var(--border-faint); padding-top: 10px; }
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
    <div class="sidebar-search">
      <input type="search" id="sidebar-filter" class="sidebar-filter-input" placeholder="Filter files…" autocomplete="off" spellcheck="false" aria-label="Filter files in sidebar">
      <button type="button" class="sidebar-filter-hint" id="sidebar-filter-hint" aria-label="Open command palette for full content search">
        <span class="sidebar-filter-hint-text">⌘K for full search</span>
        <span class="sidebar-filter-hint-icon" aria-hidden="true">🔎</span>
      </button>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-title">Files <span class="sidebar-filter-empty" id="sidebar-filter-empty" hidden>· no matches</span></div>
      <div class="tree" id="sidebar-tree">${treeHtml}</div>
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

  // ── Sidebar filter (visible search bar above the tree) ─────────────────
  // Filters tree nodes as the user types. A folder stays visible if its name
  // matches OR any of its descendants match (and auto-expands when matches are
  // inside it). Matched substring gets <mark>-wrapped in the label.
  var input = document.getElementById("sidebar-filter");
  var tree  = document.getElementById("sidebar-tree");
  var empty = document.getElementById("sidebar-filter-empty");
  if (input && tree) {
    var fileRows = Array.prototype.slice.call(tree.querySelectorAll(".tree-file"));
    var folderRows = Array.prototype.slice.call(tree.querySelectorAll(".tree-folder"));
    // Cache the original folder open-state so we can restore it when the
    // filter is cleared — typing temporarily expands ancestors of matches.
    var originalOpen = new Map();
    folderRows.forEach(function(f){ originalOpen.set(f, f.hasAttribute("open")); });
    var labelCache = new Map();   // element → original textContent (so we can restore after un-marking)
    function cacheLabel(el) {
      if (!el) return "";
      if (labelCache.has(el)) return labelCache.get(el);
      var t = el.textContent || "";
      labelCache.set(el, t);
      return t;
    }
    function escHtml(s) { return s.replace(/[&<>"']/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); }
    function renderLabel(el, original, q) {
      if (!q) { el.textContent = original; return; }
      var i = original.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) { el.textContent = original; return; }
      el.innerHTML = escHtml(original.slice(0,i)) + "<mark>" + escHtml(original.slice(i, i+q.length)) + "</mark>" + escHtml(original.slice(i+q.length));
    }
    function applyFilter(q) {
      q = (q || "").trim().toLowerCase();
      if (!q) {
        // restore everything
        fileRows.forEach(function(f){
          f.classList.remove("filter-hidden");
          var ln = f.querySelector(".tree-file-name");
          if (ln) renderLabel(ln, cacheLabel(ln), "");
        });
        folderRows.forEach(function(f){
          f.classList.remove("filter-hidden");
          var fn = f.querySelector(":scope > summary .tree-folder-name");
          if (fn) renderLabel(fn, cacheLabel(fn), "");
          if (originalOpen.get(f)) f.setAttribute("open", ""); else f.removeAttribute("open");
        });
        if (empty) empty.hidden = true;
        return;
      }
      // 1) mark each file as match / no-match
      var matchCount = 0;
      fileRows.forEach(function(row){
        var ln = row.querySelector(".tree-file-name");
        var label = cacheLabel(ln);
        var hit = label.toLowerCase().indexOf(q) !== -1;
        row.classList.toggle("filter-hidden", !hit);
        if (hit) { renderLabel(ln, label, q); matchCount++; }
        else if (ln) renderLabel(ln, label, "");
      });
      // 2) walk folders bottom-up: visible if any visible file/folder descendant
      //    OR own name matches. Auto-open visible folders so matches are seen.
      function folderHasVisibleDescendant(folder) {
        var descFiles = folder.querySelectorAll(":scope .tree-file");
        for (var i = 0; i < descFiles.length; i++) {
          if (!descFiles[i].classList.contains("filter-hidden")) return true;
        }
        return false;
      }
      folderRows.forEach(function(folder){
        var fn = folder.querySelector(":scope > summary .tree-folder-name");
        var name = cacheLabel(fn);
        var nameHit = name.toLowerCase().indexOf(q) !== -1;
        var anyVisible = nameHit || folderHasVisibleDescendant(folder);
        folder.classList.toggle("filter-hidden", !anyVisible);
        if (fn) renderLabel(fn, name, nameHit ? q : "");
        if (anyVisible) folder.setAttribute("open", "");
      });
      if (empty) empty.hidden = matchCount > 0;
    }
    var t = null;
    input.addEventListener("input", function(){
      clearTimeout(t);
      t = setTimeout(function(){ applyFilter(input.value); }, 60);
    });
    input.addEventListener("keydown", function(e){
      if (e.key === "Escape") { e.preventDefault(); input.value = ""; applyFilter(""); input.blur(); }
    });
  }

  // Scroll the active item into view inside the sidebar
  var active = sb && sb.querySelector(".tree-file.active");
  if (active) active.scrollIntoView({ block: "center" });
})();
</script>`;

// ─────────────────────────────────────────────────────────────────────────────
// Command palette (⌘K) — shared modal that fuzzy-searches every note + canvas
// in the current wrapper plus a few app-level actions. Lives on the wrapper
// landing AND on every note/canvas page so navigation never requires a click.
// ─────────────────────────────────────────────────────────────────────────────

interface PaletteItem {
  kind: "note" | "canvas" | "action";
  id: string;       // ulid for files; action-id for actions
  label: string;
  hint?: string;    // folder path or action description
  href?: string;    // navigation target for files
  action?: "toggle-sidebar" | "copy-link" | "fullscreen";
}

export function renderCommandPalette(opts: {
  shareBase: string;
  tokenQuery: string;
  notes: NoteLite[];
  canvases: CanvasLite[];
  hasSidebar: boolean;
}): string {
  const tq = opts.tokenQuery;
  const items: PaletteItem[] = [];

  for (const n of opts.notes) {
    const folder = n.path.includes("/") ? n.path.split("/").slice(0, -1).join("/") : "";
    const fileName = n.path.split("/").pop()?.replace(/\.md$/i, "") ?? n.basename;
    items.push({
      kind: "note",
      id: n.ulid,
      label: n.title || fileName,
      hint: folder,
      href: `${opts.shareBase}/${n.ulid}${tq}`,
    });
  }
  for (const c of opts.canvases) {
    const folder = c.path.includes("/") ? c.path.split("/").slice(0, -1).join("/") : "";
    const fileName = c.path.split("/").pop()?.replace(/\.canvas$/i, "") ?? c.basename;
    items.push({
      kind: "canvas",
      id: c.ulid,
      label: fileName,
      hint: folder,
      href: `${opts.shareBase}/c/${c.ulid}${tq}`,
    });
  }
  // App-level actions appear at the top of the unfiltered list
  items.unshift(
    { kind: "action", id: "back", label: "Back to overview", hint: "wrapper landing", href: `${opts.shareBase}${tq}` },
    { kind: "action", id: "download", label: "Download as .zip", hint: "full slice + assets", href: `${opts.shareBase}/download${tq}` },
    { kind: "action", id: "copy-link", label: "Copy share link", hint: "current page URL", action: "copy-link" },
  );
  if (opts.hasSidebar) {
    items.splice(2, 0, { kind: "action", id: "toggle-sidebar", label: "Toggle sidebar", hint: "show / hide files", action: "toggle-sidebar" });
  }

  return `<div class="cmd-palette" id="cmd-palette" hidden>
  <div class="cmd-palette-backdrop" id="cmd-backdrop"></div>
  <div class="cmd-palette-modal" role="dialog" aria-label="Command palette">
    <input type="text" id="cmd-input" class="cmd-input" placeholder="Search notes, canvases, actions… (⌘K)" autocomplete="off" spellcheck="false">
    <div class="cmd-list" id="cmd-list"></div>
    <div class="cmd-footer">
      <span><kbd>↑↓</kbd> navigate</span>
      <span><kbd>↵</kbd> open</span>
      <span><kbd>esc</kbd> close</span>
    </div>
  </div>
</div>
<div class="cmd-help" id="cmd-help" hidden>
  <div class="cmd-palette-backdrop" id="cmd-help-backdrop"></div>
  <div class="cmd-help-card">
    <h3>Keyboard shortcuts</h3>
    <table>
      <tr><td><kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> / <kbd>/</kbd></td><td>Open command palette</td></tr>
      <tr><td><kbd>?</kbd></td><td>Show this sheet</td></tr>
      ${opts.hasSidebar ? '<tr><td><kbd>[</kbd></td><td>Toggle sidebar</td></tr>' : ""}
      <tr><td><kbd>g</kbd> <kbd>h</kbd></td><td>Back to wrapper overview</td></tr>
      <tr><td><kbd>esc</kbd></td><td>Close any overlay</td></tr>
    </table>
    <p class="cmd-help-foot">On canvas pages: <kbd>=</kbd>/<kbd>-</kbd> zoom, <kbd>F</kbd> fit, <kbd>R</kbd> reset, <kbd>⇧F</kbd> fullscreen.</p>
  </div>
</div>
<script>
(function(){
  var ITEMS = ${JSON.stringify(items)};
  var SHARE_BASE = ${JSON.stringify(opts.shareBase + tq)};
  var palette = document.getElementById("cmd-palette");
  var input   = document.getElementById("cmd-input");
  var list    = document.getElementById("cmd-list");
  var help    = document.getElementById("cmd-help");
  if (!palette || !input || !list) return;

  var sel = 0;
  var filtered = ITEMS.slice();

  function open() {
    palette.hidden = false;
    input.value = "";
    sel = 0;
    filtered = ITEMS.slice();
    render();
    setTimeout(function(){ input.focus(); }, 0);
  }
  function close() { palette.hidden = true; }

  // Expose open() so non-keyboard callers (the sidebar's tap-to-search button
  // on touch devices, future toolbar items, etc.) can trigger the palette.
  window.__brainshareOpenPalette = open;
  document.getElementById("sidebar-filter-hint")?.addEventListener("click", function(e){
    e.preventDefault();
    open();
  });
  function openHelp() { if (help) help.hidden = false; }
  function closeHelp() { if (help) help.hidden = true; }

  function score(item, q) {
    if (!q) return 0;
    var hay = (item.label + " " + (item.hint || "")).toLowerCase();
    var parts = q.toLowerCase().split(/\\s+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++) if (hay.indexOf(parts[i]) === -1) return -1;
    // tiny ranking: prefer matches in label over hint, prefer prefix matches
    var label = item.label.toLowerCase();
    var s = 0;
    for (var j = 0; j < parts.length; j++) {
      if (label.indexOf(parts[j]) === 0) s += 3;
      else if (label.indexOf(parts[j]) !== -1) s += 1;
    }
    return s;
  }

  // Content-search results — populated by an async fetch to /api/search when
  // the query is 3+ chars. Held separately so the file/action match list stays
  // instant and the content section can show a "searching…" affordance.
  var contentResults = [];
  var contentQuery = "";
  var contentLoading = false;
  var contentSeq = 0;     // monotonic so out-of-order responses get dropped
  var contentDebounce = null;

  function maybeFetchContent(q) {
    clearTimeout(contentDebounce);
    if (!q || q.length < 3) {
      contentResults = []; contentQuery = ""; contentLoading = false;
      return;
    }
    contentLoading = true;
    contentDebounce = setTimeout(function(){
      var seq = ++contentSeq;
      var url = SHARE_BASE.split("?")[0] + "/api/search" +
        (SHARE_BASE.indexOf("?") >= 0 ? SHARE_BASE.substring(SHARE_BASE.indexOf("?")) + "&" : "?") +
        "q=" + encodeURIComponent(q);
      fetch(url, { credentials: "same-origin" })
        .then(function(r){ return r.ok ? r.json() : { matches: [] }; })
        .then(function(data){
          if (seq !== contentSeq) return;     // stale response
          contentResults = (data && data.matches) || [];
          contentQuery = q;
          contentLoading = false;
          render();
        })
        .catch(function(){
          if (seq !== contentSeq) return;
          contentResults = []; contentLoading = false; render();
        });
    }, 250);
  }

  function render() {
    list.innerHTML = "";
    var q = input.value.trim();
    if (!q) {
      filtered = ITEMS.slice();
    } else {
      filtered = ITEMS
        .map(function(it){ return { it: it, s: score(it, q) }; })
        .filter(function(x){ return x.s >= 0; })
        .sort(function(a,b){ return b.s - a.s; })
        .map(function(x){ return x.it; });
    }
    // Content matches: anything from /api/search that isn't already a name-hit
    var nameHitIds = {};
    filtered.forEach(function(it){ if (it.id) nameHitIds[it.id] = true; });
    var contentItems = [];
    if (q && q.length >= 3 && contentQuery === q) {
      contentResults.forEach(function(m){
        if (nameHitIds[m.ulid]) return;   // don't repeat a name-hit
        contentItems.push({
          kind: "content",
          id: m.ulid,
          label: m.title,
          hint: m.path,
          snippet: m.snippet,
          href: SHARE_BASE.split("?")[0] + "/" + m.ulid +
            (SHARE_BASE.indexOf("?") >= 0 ? SHARE_BASE.substring(SHARE_BASE.indexOf("?")) : ""),
        });
      });
    }
    var combined = filtered.slice(0, 60).concat(contentItems);
    filtered = combined;
    if (sel >= filtered.length) sel = Math.max(0, filtered.length - 1);

    if (filtered.length === 0 && !contentLoading) {
      list.innerHTML = '<div class="cmd-empty">No matches.</div>';
      return;
    }

    var splitIndex = combined.length - contentItems.length;   // first content row index
    combined.forEach(function(it, i){
      // Section header before first content match
      if (i === splitIndex && contentItems.length > 0) {
        var hdr = document.createElement("div");
        hdr.className = "cmd-section";
        hdr.textContent = "Content matches · " + contentItems.length;
        list.appendChild(hdr);
      }
      var icon = it.kind === "canvas" ? "🗺" : it.kind === "action" ? "⚡" : it.kind === "content" ? "🔎" : "📄";
      var hint = it.hint ? '<span class="cmd-hint">' + escape(it.hint) + '</span>' : "";
      var snippetHtml = it.snippet
        ? '<div class="cmd-snippet">' + highlight(it.snippet, q) + '</div>'
        : "";
      var row = document.createElement("div");
      row.className = "cmd-item" + (i === sel ? " selected" : "");
      row.dataset.idx = i;
      row.innerHTML = '<div class="cmd-row-main">' +
          '<span class="cmd-icon">' + icon + '</span>' +
          '<span class="cmd-label">' + escape(it.label) + '</span>' +
          hint +
        '</div>' + snippetHtml;
      row.addEventListener("mouseenter", function(){ sel = i; updateSel(); });
      row.addEventListener("click", function(){ go(it); });
      list.appendChild(row);
    });
    if (contentLoading && contentQuery !== q) {
      var l = document.createElement("div");
      l.className = "cmd-loading";
      l.textContent = "Searching note bodies…";
      list.appendChild(l);
    }
  }
  function highlight(text, q) {
    if (!q) return escape(text);
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return escape(text);
    return escape(text.slice(0,i)) + "<mark>" + escape(text.slice(i, i+q.length)) + "</mark>" + escape(text.slice(i+q.length));
  }
  function updateSel() {
    [].forEach.call(list.children, function(c, i){
      if (c.classList) c.classList.toggle("selected", i === sel);
    });
    var cur = list.children[sel];
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }
  function go(it) {
    if (it.action === "toggle-sidebar") {
      var sb = document.getElementById("wrap-sidebar");
      if (sb) sb.classList.toggle("collapsed");
      close();
      return;
    }
    if (it.action === "copy-link") {
      navigator.clipboard?.writeText(location.href);
      close();
      return;
    }
    if (it.href) { window.location = it.href; close(); }
  }

  input.addEventListener("input", function(){
    sel = 0;
    maybeFetchContent(input.value.trim());
    render();
  });
  input.addEventListener("keydown", function(e){
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(filtered.length - 1, sel + 1); updateSel(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); updateSel(); }
    else if (e.key === "Enter")   { e.preventDefault(); var it = filtered[sel]; if (it) go(it); }
    else if (e.key === "Escape")  { e.preventDefault(); close(); }
  });
  document.getElementById("cmd-backdrop")?.addEventListener("click", close);
  document.getElementById("cmd-help-backdrop")?.addEventListener("click", closeHelp);

  // Global key bindings — guard against firing while typing in inputs/textareas.
  var lastG = 0;
  document.addEventListener("keydown", function(e){
    var t = e.target;
    var inField = t && /input|textarea|select/i.test(t.tagName);
    var isOpen = !palette.hidden;
    // ⌘K / Ctrl+K / "/" — open palette
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); isOpen ? close() : open();
      return;
    }
    if (e.key === "/" && !inField && !isOpen) { e.preventDefault(); open(); return; }
    if (inField || isOpen) return;
    if (e.key === "?") { e.preventDefault(); help && help.hidden ? openHelp() : closeHelp(); return; }
    if (e.key === "Escape") { closeHelp(); return; }
    if (e.key === "[") {
      var sb = document.getElementById("wrap-sidebar");
      if (sb) { e.preventDefault(); sb.classList.toggle("collapsed"); }
      return;
    }
    if (e.key === "g" || e.key === "G") { lastG = Date.now(); return; }
    if ((e.key === "h" || e.key === "H") && Date.now() - lastG < 800) {
      e.preventDefault(); window.location = SHARE_BASE;
    }
  });
})();
</script>`;
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
    const palette = renderCommandPalette({
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes,
      canvases: ctx.wrapTree.canvases,
      hasSidebar: true,
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
${palette}
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

  const palette = renderCommandPalette({
    shareBase,
    tokenQuery: tq,
    notes: records.map(r => ({ ulid: r.ulid, basename: r.basename, path: r.path, title: r.title })),
    canvases: canvasMetas,
    hasSidebar: true,
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
${palette}

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
  // Touch devices have no hover, so the focus-cluster state never activates
  // from enterNode/leaveNode. Make tap-to-focus / second-tap-to-navigate the
  // touch behaviour, and tapping empty stage clears focus. Mouse-primary
  // devices keep the original "click navigates immediately" flow.
  var isTouch = (matchMedia && matchMedia("(hover: none)").matches);
  var navigateTo = function(node){
    window.location = "/share/" + DATA.wrapId + "/" + node + DATA.tokenQuery;
  };
  renderer.on("clickNode", function(p){
    if (!isTouch) { navigateTo(p.node); return; }
    if (hoveredNode === p.node) {
      // second tap on the focused node → navigate
      navigateTo(p.node);
      return;
    }
    // first tap → focus this node + neighbours, just like enterNode does
    hoveredNode = p.node;
    hoveredNeighbors = {};
    hoveredNeighbors[p.node] = true;
    g.forEachNeighbor(p.node, function(nb){ hoveredNeighbors[nb] = true; });
    renderer.refresh();
  });
  // On touch, tapping empty graph space clears the focus.
  renderer.on("clickStage", function(){
    if (!isTouch || !hoveredNode) return;
    hoveredNode = null;
    hoveredNeighbors = null;
    renderer.refresh();
  });
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

  // HTML-positioned cards. Each card uses absolute positioning in the SAME
  // coordinate space as the canvas-edges SVG overlay, so a single CSS
  // transform on .canvas-stage pans/zooms both. Sidesteps Safari's
  // foreignObject + viewBox bug.
  const posStyle = (n: CanvasNode) =>
    `left:${n.x}px;top:${n.y}px;width:${n.width}px;height:${n.height}px`;

  const renderTextCard = (n: CanvasNode) => {
    const md = n.text ?? "";
    const html = marked.parse(md, { async: false }) as string;
    const color = canvasColor(n.color);
    return `<div class="canvas-card canvas-text" style="${posStyle(n)};border-color:${color}">${html}</div>`;
  };

  const renderFileCard = (n: CanvasNode) => {
    const file = (n.file ?? "").trim();
    const basename = file.split("/").pop()?.replace(/\.md$/i, "") ?? file;
    const color = canvasColor(n.color);
    const inner = `<div class="canvas-file-name">📄 ${escapeHtml(basename)}</div>`;
    let href: string | null = null;
    if (ctx?.shareBase) {
      const u = ctx.shareSet?.get(basename);
      if (u) href = `${ctx.shareBase}/${u}${tq}`;
      else {
        const cu = ctx.canvasSet?.get(basename.replace(/\.canvas$/i, ""));
        if (cu) href = `${ctx.shareBase}/c/${cu}${tq}`;
      }
    }
    return href
      ? `<a class="canvas-card canvas-file" href="${escapeAttr(href)}" style="${posStyle(n)};border-color:${color}">${inner}</a>`
      : `<div class="canvas-card canvas-file canvas-file-private" style="${posStyle(n)};border-color:${color}">${inner}<div class="canvas-file-private-note">not in this share</div></div>`;
  };

  const renderLinkCard = (n: CanvasNode) => {
    const url = n.url ?? "";
    const color = canvasColor(n.color);
    return `<a class="canvas-card canvas-link" href="${escapeAttr(url)}" target="_blank" rel="noopener" style="${posStyle(n)};border-color:${color}">🔗 ${escapeHtml(url)}</a>`;
  };

  const renderGroupBox = (n: CanvasNode) => {
    const color = canvasColor(n.color);
    const label = n.label ?? "";
    return `<div class="canvas-group" style="${posStyle(n)};color:${color};border-color:${color};background:${color}1a">${label ? `<div class="canvas-group-label">${escapeHtml(label)}</div>` : ""}</div>`;
  };

  const groupHtml = groups.map(renderGroupBox).join("\n");
  const cardHtml = others.map((n) => {
    if (n.type === "text") return renderTextCard(n);
    if (n.type === "file") return renderFileCard(n);
    if (n.type === "link") return renderLinkCard(n);
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
  // The .canvas-stage contains everything that needs to pan/zoom together —
  // group boxes, an absolutely-positioned SVG layer for edges (overflow:visible
  // so paths can extend in any direction from origin 0,0), then the cards on
  // top. A single CSS transform on the stage drives both pan and zoom; this
  // is what Obsidian does internally and avoids every Safari foreignObject bug.
  const canvasBody = `<h1 class="canvas-title">🗺 ${escapeHtml(title)}</h1>
<p class="canvas-help">${canvas.nodes.length} node(s) · ${canvas.edges?.length ?? 0} edge(s)</p>
<div class="canvas-host" id="canvas-host">
  <div class="canvas-stage" id="canvas-stage" data-vbx="${vbX}" data-vby="${vbY}" data-vbw="${vbW}" data-vbh="${vbH}">
    ${groupHtml}
    <svg class="canvas-edges-layer" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#888" />
        </marker>
      </defs>
      ${edgeSvg}
    </svg>
    ${cardHtml}
  </div>
  <div class="canvas-rail" id="canvas-rail">
    <button id="canvas-zoom-in"  type="button" title="Zoom in (=)">+</button>
    <button id="canvas-zoom-out" type="button" title="Zoom out (-)">−</button>
    <div class="rail-divider"></div>
    <button id="canvas-fit"      type="button" title="Fit to screen (F)">⛶</button>
    <button id="canvas-reset"    type="button" title="Reset view (R or double-click)">⌖</button>
    <div class="rail-divider"></div>
    <button id="canvas-fullscreen" type="button" title="Toggle fullscreen (Shift+F)">⛶</button>
    <div class="rail-divider"></div>
    <div class="rail-help">
      <button id="canvas-help" type="button" title="Keyboard shortcuts">?</button>
      <div class="canvas-rail-tip" id="canvas-tip">
        <div><kbd>scroll</kbd> · zoom at cursor</div>
        <div><kbd>drag</kbd> · pan</div>
        <div><kbd>=</kbd> / <kbd>-</kbd> · zoom in / out</div>
        <div><kbd>F</kbd> · fit to screen</div>
        <div><kbd>R</kbd> · reset view</div>
        <div><kbd>⇧F</kbd> · fullscreen</div>
        <div><kbd>dbl-click</kbd> · reset</div>
      </div>
    </div>
  </div>
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
    const palette = renderCommandPalette({
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes,
      canvases: ctx.wrapTree.canvases,
      hasSidebar: true,
    });
    return shell({ title, sidebarLayout: true, body: `
${sidebar}
<main class="wrap-main wrap-main-canvas">
  ${breadcrumb}
  ${canvasBody}
</main>
${SIDEBAR_TOGGLE_JS}
${palette}
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
  const host = document.getElementById("canvas-host");
  const stage = document.getElementById("canvas-stage");
  if (!host || !stage) return;
  const vbX = +stage.dataset.vbx, vbY = +stage.dataset.vby;
  const vbW = +stage.dataset.vbw, vbH = +stage.dataset.vbh;

  // Stage coords use raw canvas-space pixels. We translate so vbX/vbY map to
  // the host's top-left, then scale so the whole content fits the host.
  let scale = 1, tx = 0, ty = 0;

  function apply() {
    stage.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
  }

  function fit() {
    const r = host.getBoundingClientRect();
    const margin = 24;
    const sx = (r.width  - margin * 2) / vbW;
    const sy = (r.height - margin * 2) / vbH;
    scale = Math.min(sx, sy);
    tx = (r.width  - vbW * scale) / 2 - vbX * scale;
    ty = (r.height - vbH * scale) / 2 - vbY * scale;
    apply();
  }

  fit();
  window.addEventListener("resize", fit);

  // Wheel zoom anchored at cursor (works in Safari, Chrome, Firefox).
  host.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = host.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.max(0.05, Math.min(8, scale * factor));
    // keep the point under cursor stationary in screen space
    tx = mx - (mx - tx) * (newScale / scale);
    ty = my - (my - ty) * (newScale / scale);
    scale = newScale;
    apply();
  }, { passive: false });

  // Drag to pan — but don't hijack clicks on cards/links. Mousedown on a card
  // starts a "click candidate"; we only treat it as a pan if the user actually
  // moves the cursor more than 4px before releasing.
  let dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0, decided = false;
  host.addEventListener("mousedown", (e) => {
    dragging = true; decided = false;
    lastX = downX = e.clientX; lastY = downY = e.clientY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    if (!decided) {
      if (Math.abs(e.clientX - downX) < 4 && Math.abs(e.clientY - downY) < 4) return;
      decided = true;
      stage.classList.add("grabbing");
    }
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    apply();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    stage.classList.remove("grabbing");
  });
  // If the user starts on a link, swallow the click that would otherwise navigate
  // when they were really panning.
  host.addEventListener("click", (e) => {
    if (decided) e.preventDefault();
  }, true);

  // Programmatic zoom from buttons / keys — anchored at the host's centre.
  function zoomAt(factor) {
    const r = host.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const newScale = Math.max(0.05, Math.min(8, scale * factor));
    tx = cx - (cx - tx) * (newScale / scale);
    ty = cy - (cy - ty) * (newScale / scale);
    scale = newScale;
    apply();
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else host.requestFullscreen?.();
  }
  // Re-fit after entering/leaving fullscreen so the content fills the new size
  document.addEventListener("fullscreenchange", () => setTimeout(fit, 50));

  document.getElementById("canvas-reset")?.addEventListener("click", fit);
  document.getElementById("canvas-fit")?.addEventListener("click", fit);
  document.getElementById("canvas-zoom-in")?.addEventListener("click", () => zoomAt(1.2));
  document.getElementById("canvas-zoom-out")?.addEventListener("click", () => zoomAt(1 / 1.2));
  document.getElementById("canvas-fullscreen")?.addEventListener("click", toggleFullscreen);
  const tip = document.getElementById("canvas-tip");
  document.getElementById("canvas-help")?.addEventListener("click", (e) => {
    e.stopPropagation();
    tip?.classList.toggle("visible");
  });
  document.addEventListener("click", () => tip?.classList.remove("visible"));
  host.addEventListener("dblclick", fit);

  // Keyboard shortcuts — only fire when the canvas is hovered, so they don't
  // hijack typing elsewhere on the page.
  let hostHover = false;
  host.addEventListener("mouseenter", () => { hostHover = true; });
  host.addEventListener("mouseleave", () => { hostHover = false; });
  document.addEventListener("keydown", (e) => {
    if (!hostHover) return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    switch (e.key) {
      case "=": case "+": e.preventDefault(); zoomAt(1.2); break;
      case "-": case "_": e.preventDefault(); zoomAt(1 / 1.2); break;
      case "f": case "F":
        if (e.shiftKey) { e.preventDefault(); toggleFullscreen(); }
        else { e.preventDefault(); fit(); }
        break;
      case "r": case "R": e.preventDefault(); fit(); break;
    }
  });
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
