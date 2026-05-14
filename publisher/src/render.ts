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
/* Dark theme — applied when the OS prefers dark AND the user hasn't picked
   "light" explicitly, OR when they've picked "dark" via the theme toggle. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #1e1e1e;
    --bg-secondary: #262626;
    --bg-callout: #2a2a2a;
    --bg-chip: rgba(168, 130, 255, 0.16);
    --text-normal: #dcddde;
    --text-muted: #959595;
    --text-faint: #6a6a6a;
    --text-accent: #a882ff;
    --text-link: #a882ff;
    --border: #363636;
    --border-faint: #2c2c2c;
    --code-bg: #2c2c2c;
    --kbd-bg: #333;
  }
}
:root[data-theme="dark"] {
  --bg-primary: #1e1e1e;
  --bg-secondary: #262626;
  --bg-callout: #2a2a2a;
  --bg-chip: rgba(168, 130, 255, 0.16);
  --text-normal: #dcddde;
  --text-muted: #959595;
  --text-faint: #6a6a6a;
  --text-accent: #a882ff;
  --text-link: #a882ff;
  --border: #363636;
  --border-faint: #2c2c2c;
  --code-bg: #2c2c2c;
  --kbd-bg: #333;
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
/* Skip-to-main-content link — off-screen until focused */
.skip-link {
  position: absolute;
  top: -100%;
  left: 1em;
  padding: .5em 1em;
  background: var(--text-accent);
  color: #fff;
  font-size: .9em;
  font-weight: 600;
  border-radius: 0 0 6px 6px;
  text-decoration: none;
  z-index: 9999;
  transition: top .1s;
}
.skip-link:focus { top: 0; }
.container { max-width: 760px; margin: 0 auto; padding: 2.5em 1.25em 6em; }
.wide      { max-width: 1100px; }

/* breadcrumb */
.breadcrumb {
  font-size: .82em;
  letter-spacing: .04em;
  color: var(--text-faint);
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
.prop-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: .8em;
  padding: 3px 0;
  align-items: center;
  min-height: 26px;
}
.prop-key {
  font-size: .82em;
  letter-spacing: .04em;
  color: var(--text-faint);
  display: flex;
  gap: .45em;
  align-items: center;
  line-height: 1.3;
}
.prop-key svg.prop-icon {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  opacity: .65;
}
.prop-val {
  font-size: .88em;
  color: var(--text-muted);
  word-break: break-word;
  line-height: 1.4;
}
.prop-val code {
  font-size: .8em;
  padding: 1px 5px;
  background: var(--code-bg);
  border-radius: 3px;
}
.prop-val a { color: var(--text-link); text-decoration: none; }
.prop-val a:hover { text-decoration: underline; }
/* The chips inside prop-val (rendered by renderFmValue for array values like
   tags:[foo,bar]) inherited a too-large pill style. Tighten them to match
   the Notion-density we want here. */
.prop-val .chip {
  font-size: .78em;
  padding: 0 8px;
  line-height: 1.7;
  margin: 0 4px 2px 0;
}

/* ─── Note meta chips (inline, above the article) ──────────────────────
   Replaces the old behaviour of dumping the entire properties table at
   the top of every note. These show only tags + status — the highest-
   signal fields — so the article shows above the fold. */
.note-meta-chips {
  display: flex; flex-wrap: wrap; gap: .35em;
  margin: -.4em 0 1.4em;
}
.meta-chip {
  display: inline-flex; align-items: center;
  font-size: .8em;
  padding: .15em .7em;
  border-radius: 999px;
  line-height: 1.5;
}
.meta-chip-tag {
  background: var(--bg-chip);
  color: var(--text-accent);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  letter-spacing: .01em;
}
.meta-chip-status {
  background: var(--bg-secondary);
  color: var(--text-muted);
  border: 1px solid var(--border-faint);
  text-transform: uppercase;
  letter-spacing: .04em;
  font-size: .72em;
  font-weight: 600;
}

/* ─── Floating theme toggle — top-right of every page ─────────────────────
   Cycles auto / light / dark. Icon swaps to match the active mode. Sits
   above all content with z-index, but stays inert (pointer-events) on
   touch-text-selection. */
.theme-toggle {
  position: fixed;
  top: 14px;
  right: 14px;
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-muted);
  border: 1px solid var(--border-faint);
  border-radius: 999px;
  cursor: pointer;
  padding: 0;
  z-index: 1000;
  transition: color .15s, border-color .15s, transform .15s;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.theme-toggle:hover {
  color: var(--text-accent);
  border-color: var(--text-accent);
}
.theme-toggle[data-flash="1"] {
  transform: scale(1.08) rotate(15deg);
}
.theme-toggle .theme-icon {
  width: 18px; height: 18px;
}
@media (max-width: 760px) {
  .theme-toggle {
    width: 44px; height: 44px;
    top: auto;
    bottom: 18px; right: 18px;
  }
  .theme-toggle .theme-icon { width: 20px; height: 20px; }
}

/* ─── Properties panel — Notion-style: dense, open by default ──────────────
   Lives near the top of every note (after H1, before article body). Open by
   default so it mimics Notion's properties-at-top default. Reader can
   collapse it with one click if they want a totally clean view. */
details.properties {
  margin: 0 0 1.4em;
  background: transparent;
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  padding: 0;
  overflow: hidden;
}
.properties-summary {
  display: flex; align-items: center; gap: .45em;
  padding: .4em .8em;
  cursor: pointer;
  font-size: .72em;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-faint);
  user-select: none;
  list-style: none;
  font-weight: 600;
}
.properties-summary::-webkit-details-marker { display: none; }
.properties-summary::marker { content: ""; }
.properties-summary::before {
  content: "▸";
  display: inline-block;
  color: var(--text-faint);
  font-size: .85em;
  transition: transform .15s ease;
  width: 9px;
}
details.properties[open] .properties-summary::before { transform: rotate(90deg); }
details.properties[open] .properties-summary {
  border-bottom: 1px solid var(--border-faint);
}
.properties-summary:hover { color: var(--text-muted); }
.properties-summary-icon { display: none; }  /* the chevron + label are enough */
.properties-summary-label { font-weight: 600; }
.properties-summary-count {
  font-size: .92em;
  color: var(--text-faint);
  background: transparent;
  padding: 0;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  text-transform: none;
}
.properties-summary-count::before { content: "· "; opacity: .6; }
.properties-body {
  padding: .35em .8em .55em;
}
@media (max-width: 760px) {
  .properties-summary { padding: .7em .9em; min-height: 38px; font-size: .78em; }
  .prop-row { grid-template-columns: 100px 1fr; gap: .55em; }
  .prop-key { font-size: 12px; }
  .prop-val { font-size: 13px; }
}
.chip {
  display: inline-block;
  background: var(--bg-chip);
  color: var(--text-accent);
  padding: 0 7px;
  border-radius: 999px;
  font-size: .82em;
  letter-spacing: .04em;
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
a { color: var(--text-link); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
a:hover { border-bottom-color: currentColor; }
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
hr { border: none; border-top: 1px solid var(--border-faint); margin: 2em 0; }

/* Reading metadata — small label under note title */
.note-reading-meta {
  display: flex;
  align-items: center;
  gap: .55em;
  font-size: .8em;
  color: var(--text-faint);
  margin: -.35em 0 1.4em;
  font-variant-numeric: tabular-nums;
}
.note-reading-meta .rmeta-sep { opacity: .5; }

/* code */
code {
  background: var(--code-bg);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: .9em;
  font-family: "SF Mono", Menlo, Consolas, monospace;
  /* Inline code with long unbroken tokens (ULIDs, file paths, URLs) would
     otherwise blow the article wider than the viewport on mobile and force
     a body-level horizontal scrollbar. Break-word lets it wrap. */
  word-break: break-word;
  overflow-wrap: anywhere;
}
pre {
  background: var(--code-bg);
  padding: 1em 1.2em;
  border-radius: 4px;
  overflow-x: auto;
  max-width: 100%;
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: .9em;
  line-height: 1.6;
}
pre code { background: none; padding: 0; word-break: normal; overflow-wrap: normal; }

/* tables — scrollable container prevents page-level overflow; min-width on
   cells prevents the browser from crushing columns below readable size. */
.prose table {
  display: block;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}
table { border-collapse: collapse; width: max-content; min-width: 100%; margin: 1em 0; font-size: .94em; }
th, td {
  border: 1px solid var(--border-faint);
  padding: .45em .7em;
  text-align: left;
  min-width: 90px;
  white-space: normal;
  word-break: normal;
  overflow-wrap: break-word;
}
th { background: var(--bg-secondary); white-space: nowrap; font-weight: 600; }

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
/* Mermaid always renders with the "default" (light) theme so the SVG colours
   never go stale when the user toggles their OS color scheme after page load.
   The container is locked to white in both light and dark mode — diagrams are
   always readable regardless of the surrounding page chrome. */
.mermaid-host {
  position: relative;
  margin: 1.2em 0;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid var(--border-faint);
  overflow: hidden;
  color-scheme: light;
}
.mermaid-host .mermaid {
  display: block;
  padding: 1em;
  overflow: auto;
  max-height: 70vh;
  cursor: zoom-in;
  background: #ffffff;
  color: #1f2328;
}
.mermaid-host .mermaid svg {
  max-width: none !important;
  height: auto !important;
}
.mermaid-host .mermaid-actions {
  position: absolute;
  top: 8px; right: 8px;
  display: flex; gap: 4px;
  opacity: 0;
  transition: opacity .15s;
  z-index: 2;
}
.mermaid-host:hover .mermaid-actions { opacity: 1; }
.mermaid-host .mermaid-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  background: var(--bg-secondary); color: var(--text-normal);
  border: 1px solid var(--border-faint); border-radius: 6px;
  cursor: pointer; font-size: 14px; line-height: 1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08);
}
.mermaid-host .mermaid-btn:hover { border-color: var(--text-accent); color: var(--text-accent); }
@media (pointer: coarse) {
  .mermaid-host .mermaid-actions { opacity: 1; }
  .mermaid-host .mermaid-btn { width: 36px; height: 36px; font-size: 16px; }
}
/* Modal background matches the page so the rendered SVG (drawn in the page's
   color theme) sits on the same surface it was designed for — otherwise a dark
   backdrop swallows light-theme diagrams and a light backdrop washes out dark
   ones. */
.mermaid-modal {
  position: fixed; inset: 0;
  background: var(--bg-primary);
  color: var(--text-normal);
  display: none; z-index: 9999;
}
.mermaid-modal.open { display: flex; flex-direction: column; }
.mermaid-modal-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-secondary);
  color: var(--text-normal);
  font-size: 13px; gap: 12px;
  border-bottom: 1px solid var(--border-faint);
}
.mermaid-modal-bar .mermaid-modal-title {
  font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1; min-width: 0;
}
.mermaid-modal-bar .mermaid-controls { display: flex; gap: 6px; flex-shrink: 0; }
.mermaid-modal-bar button {
  background: var(--bg-primary);
  color: var(--text-normal);
  border: 1px solid var(--border-faint); border-radius: 6px;
  padding: 4px 10px; font-size: 13px; cursor: pointer; min-width: 32px;
}
.mermaid-modal-bar button:hover { border-color: var(--text-accent); color: var(--text-accent); }
/* The stage holds the (light-themed) SVG, so it's locked to white in both
   light and dark mode. The chrome around it (modal bg, toolbar) stays themed. */
.mermaid-modal-stage {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;
  background: #ffffff;
  color-scheme: light;
}
.mermaid-modal-stage.dragging { cursor: grabbing; }
.mermaid-modal-stage svg {
  position: absolute; top: 0; left: 0;
  transform-origin: 0 0;
  user-select: none;
  max-width: none !important; max-height: none !important;
}
.mermaid-modal-hint {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  background: rgba(0, 0, 0, .72);
  color: #ffffff;
  font-size: 12px; padding: 6px 12px; border-radius: 999px;
  pointer-events: none;
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
  border-left: 3px solid var(--callout-color, var(--text-accent));
  border-radius: 6px;
  padding: .7em 1em .8em;
  margin: 1em 0;
}
.callout-title {
  display: flex;
  align-items: center;
  gap: .5em;
  font-weight: 600;
  color: var(--callout-color, var(--text-accent));
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
/* Landing hero — gives the page a proper H1 + orientation row instead of
   dropping the reader straight onto the graph viewer. */
.wrap-hero {
  padding: 3em 3em 2em;
  border-bottom: 1px solid var(--border-faint);
  margin: 0 0 1.5em;
}
.wrap-hero h1 {
  font-size: 2.6em;
  font-weight: 700;
  letter-spacing: -.02em;
  line-height: 1.1;
  margin: 0 0 .4em;
}
.wrap-hero-desc {
  font-size: 1.05em;
  color: var(--text-muted);
  margin: 0 0 .8em;
  line-height: 1.5;
  max-width: 60em;
}
.wrap-hero-meta {
  display: flex; flex-wrap: wrap; gap: .4em;
  align-items: center;
  font-size: .9em;
  color: var(--text-faint);
  margin: 0;
}
.wrap-hero-meta kbd {
  background: var(--kbd-bg);
  border: 1px solid var(--border-faint);
  border-radius: 3px;
  padding: 0 .35em;
  font-size: .85em;
  font-family: ui-monospace, monospace;
}
.wrap-hero-search {
  display: inline-flex; align-items: center; gap: .35em;
  padding: .25em .7em;
  background: var(--bg-secondary);
  color: var(--text-normal);
  border: 1px solid var(--border-faint);
  border-radius: 999px;
  cursor: pointer;
  font-size: .9em;
  margin-left: .2em;
  transition: color .15s, border-color .15s;
}
.wrap-hero-search:hover {
  color: var(--text-accent);
  border-color: var(--text-accent);
}
.wrap-meta { font-size: .85em; color: var(--text-faint); margin-top: 2em; padding-top: 1em; border-top: 1px solid var(--border-faint); }

/* Graph full-space layout ------------------------------------------------- */
.graph-wrapper {
  display: flex;
  height: calc(100vh - 220px);
  min-height: 520px;
  margin: 1.5em 0;
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
#graph-host {
  flex: 1;
  min-width: 0;
  position: relative;
  background: var(--bg-secondary);
}
.graph-hint-bar {
  position: absolute;
  bottom: 10px; left: 12px;
  font-size: .72em;
  color: var(--text-faint);
  pointer-events: none;
  z-index: 2;
  letter-spacing: .02em;
}
/* Controls open/close ---------------------------------------------------- */
.graph-wrapper[data-controls="open"] .graph-open-btn { display: none; }
.graph-wrapper[data-controls="closed"] .graph-controls-panel { display: none; }
.graph-wrapper[data-controls="closed"] .graph-open-btn { display: flex; }
.graph-open-btn {
  position: absolute;
  top: 10px; right: 10px;
  z-index: 4;
  padding: .3em .65em;
  font-size: .78em;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  align-items: center; gap: .3em;
  transition: color .15s, border-color .15s;
}
.graph-open-btn:hover { color: var(--text-accent); border-color: var(--text-accent); }
/* Controls panel ---------------------------------------------------------- */
.graph-controls-panel {
  width: 230px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-faint);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-size: .82em;
}
.gcp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .8em 1em .6em;
  font-weight: 600;
  font-size: .95em;
  border-bottom: 1px solid var(--border-faint);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}
.gcp-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-faint);
  font-size: 1em;
  line-height: 1;
  padding: .2em .3em;
  border-radius: 4px;
  transition: color .12s;
}
.gcp-close-btn:hover { color: var(--text-normal); }
.gcp-section {
  padding: .75em 1em .8em;
  border-bottom: 1px solid var(--border-faint);
}
.gcp-section-title {
  font-size: .68em;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: .7em;
}
.gcp-row { margin-bottom: .65em; }
.gcp-row:last-child { margin-bottom: 0; }
.gcp-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .3em;
}
.gcp-label { color: var(--text-muted); }
.gcp-val { color: var(--text-faint); font-variant-numeric: tabular-nums; min-width: 2.5em; text-align: right; }
input[type="range"].gcp-slider {
  width: 100%;
  height: 4px;
  accent-color: var(--text-accent);
  cursor: pointer;
  margin: 0;
}
.gcp-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .55em;
}
.gcp-toggle-row:last-child { margin-bottom: 0; }
.gcp-toggle {
  width: 34px; height: 20px;
  border-radius: 10px;
  border: none;
  background: var(--border);
  position: relative;
  cursor: pointer;
  transition: background .15s;
  flex-shrink: 0;
}
.gcp-toggle::after {
  content: "";
  position: absolute;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #fff;
  top: 3px; left: 3px;
  transition: left .15s, box-shadow .15s;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
.gcp-toggle.active { background: var(--text-accent); }
.gcp-toggle.active::after { left: 17px; }
.gcp-apply-btn {
  width: 100%;
  padding: .45em;
  background: var(--text-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: .88em;
  margin-top: .55em;
  transition: opacity .12s;
}
.gcp-apply-btn:hover { opacity: .88; }
.gcp-reset-btn {
  width: 100%;
  padding: .5em;
  background: transparent;
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: .88em;
  transition: color .12s, border-color .12s;
}
.gcp-reset-btn:hover { color: var(--text-accent); border-color: var(--text-accent); }

.note-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: .65em;
  list-style: none;
  padding: 0;
}
.note-list li { margin: 0; }
.note-list a {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 62px;
  padding: .85em 1em .8em;
  border-radius: 8px;
  border: 1px solid var(--border-faint);
  border-left: 3px solid var(--border-faint);
  background: var(--bg-secondary);
  color: var(--text-normal);
  transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease, background .14s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.note-list a:hover {
  border-color: var(--text-accent);
  border-left-color: var(--text-accent);
  background: var(--bg-primary);
  box-shadow: 0 3px 10px rgba(0,0,0,.08);
  transform: translateY(-2px);
}
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
.sidebar-title { font-size: 1.15em; line-height: 1.25; margin: 0 0 .25em; color: var(--text-muted); }
.sidebar-badge { margin: .2em 0 .4em; color: var(--text-muted); }
.sidebar-desc { font-size: .82em; color: var(--text-muted); line-height: 1.4; margin: .4em 0 0;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.sidebar-cta {
  display: inline-flex; align-items: center; gap: .35em;
  font-size: .8em;
  text-decoration: none !important;
  padding: .25em .6em; margin: .2em 0 1em;
  background: var(--bg-chip);
  color: var(--text-accent) !important;
  border-radius: 3px;
}
.sidebar-cta:hover { opacity: .8; text-decoration: none !important; }
.sidebar-section { margin-bottom: 1em; }
.sidebar-section-title {
  color: var(--text-faint);
  font-size: .72em;
  letter-spacing: .12em;
  text-transform: uppercase;
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
  color: var(--text-muted);
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
  border-radius: 4px;
  color: var(--text-normal);
  font-family: inherit;
  outline: none;
  transition: border-color .12s, box-shadow .12s;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238a8a8a' stroke-width='1.5'><circle cx='7' cy='7' r='4.5'/><line x1='10.5' y1='10.5' x2='14' y2='14' stroke-linecap='round'/></svg>");
  background-repeat: no-repeat;
  background-position: 8px center;
  background-size: 14px 14px;
}
.sidebar-filter-input::placeholder { color: var(--text-faint); }
.sidebar-filter-input:focus {
  box-shadow: 0 0 0 2px rgba(127,109,242,0.2);
  border-color: var(--text-accent);
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
  font-size: .875em;
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
  background: var(--bg-primary);
}
/* On note pages inside the wrapper shell, constrain the prose to a
   readable line-length and centre it in the available main pane. The
   sidebar already eats 280px on the left, so the prose floats nicely. */
.wrap-main .prose {
  max-width: 760px;
  margin: 0 auto;
  /* Belt-and-suspenders: never let a child overflow the prose column. Any
     individual element that needs to be wider than the column (code blocks,
     tables, mermaid, canvas) already provides its own internal scrollbar via
     overflow-x:auto, so this just stops accidents from forcing the whole
     page to scroll horizontally on mobile. */
  min-width: 0;
}
/* Same min-width:0 protection on the main column itself — flex items default
   to min-width:auto, which means a long unbroken line inside a child can
   inflate the flex item past the viewport. Setting min-width:0 lets the
   column shrink so inner-scroll children (pre, table, mermaid) take over. */
.wrap-main { min-width: 0; }
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

  /* Sticky topbar strip — injected into DOM by JS on mobile */
  .mobile-topbar {
    display: flex; align-items: center; gap: .6em;
    position: sticky; top: 0; z-index: 50;
    height: 56px; padding: 0 1em;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-faint);
    flex-shrink: 0;
  }
  .mobile-topbar-title {
    font-size: .92em; font-weight: 600; color: var(--text-normal);
    flex: 1; min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  /* ☰ open button in the topbar (separate from the ✕ close button in the drawer) */
  .mobile-menu-btn {
    display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px;
    background: var(--bg-chip);
    border: 1px solid var(--border-faint);
    border-radius: 6px;
    font-size: 1.25em; cursor: pointer;
    color: var(--text-normal);
    flex-shrink: 0;
  }

  /* Sidebar: fixed overlay drawer, initially off-screen to the left */
  .wrap-sidebar {
    position: fixed !important; left: 0; top: 0;
    width: min(320px, 85vw); height: 100vh;
    flex: none !important;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform .25s cubic-bezier(.25,.46,.45,.94);
    overflow-y: auto;
    border-right: 1px solid var(--border-faint);
    border-bottom: none;
    box-shadow: none;
  }
  .wrap-sidebar.open {
    transform: translateX(0);
    box-shadow: 8px 0 40px rgba(0,0,0,.35);
  }
  /* Semi-transparent backdrop behind open drawer */
  .sidebar-backdrop {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,.45); z-index: 199;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .sidebar-backdrop.active { display: block; }
  /* ✕ close button inside the drawer — bigger touch target on mobile */
  .sidebar-toggle {
    width: 40px; height: 40px;
    top: 8px; right: 10px;
    font-size: 1.2em;
  }

  .wrap-main { padding: 1em 1em 3em; }
  /* Touch targets — Apple HIG / Material both say ≥44px. The desktop sizes
     are 22–29px which is fine with a mouse and unusable on a phone. Bump
     every interactive element in the sidebar + hero on mobile. */
  .tree-file {
    padding-top: .7em; padding-bottom: .7em;
    font-size: 1em;
    min-height: 44px;
    box-sizing: border-box;
  }
  .tree-children .tree-file { padding-left: 2.2em; }
  .tree-folder > summary {
    padding-top: .7em; padding-bottom: .7em;
    min-height: 44px;
    box-sizing: border-box;
  }
  .sidebar-cta {
    padding-top: .7em; padding-bottom: .7em;
    min-height: 44px;
    align-items: center;
  }
  .sidebar-filter-input {
    min-height: 44px;
    font-size: 1em;
  }
  .sidebar-filter-hint {
    padding: .7em 1em;
    min-height: 44px;
    font-size: .92em;
  }
  .wrap-hero-search {
    padding: .55em 1em;
    min-height: 40px;
    font-size: .95em;
  }
  .wrap-hero-meta {
    gap: .55em;
    font-size: .92em;
  }
  /* Graph: on phones collapse the controls panel and give the canvas more height */
  .graph-wrapper {
    height: 72vh;
    min-height: 360px;
    flex-direction: column;
  }
  .graph-controls-panel {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    border-left: none;
    border-top: 1px solid var(--border-faint);
  }
  .graph-wrapper[data-controls="open"] .graph-controls-panel {
    max-height: 260px;
  }
}
.wrap-actions {
  display: flex; gap: .5em; flex-wrap: wrap;
  margin: .8em 0 .4em;
}
/* Secondary action row above each note — search, copy, theme. Subtle ghost
   buttons so they don't compete with the article. */
.note-actions {
  display: flex; gap: .35em; flex-wrap: wrap;
  margin: .25em 0 1em;
  font-size: .85em;
}
.note-action-btn {
  display: inline-flex; align-items: center; gap: .35em;
  padding: .3em .7em;
  font-size: .85em;
  letter-spacing: .04em;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  text-decoration: none !important;
  transition: color .15s, border-color .15s, background .15s;
}
.note-action-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-normal);
  border-color: var(--border);
}
.note-action-btn .action-emoji {
  font-size: 1em; line-height: 1;
}
.note-action-btn[data-flash="ok"] {
  color: var(--text-accent); border-color: var(--text-accent); background: var(--bg-chip);
}
@media (pointer: coarse) {
  .note-action-btn { padding: .45em .9em; font-size: .92em; min-height: 44px; }
}

/* "Notes that link here" panel — Obsidian-style backlinks below the body. */
.note-backlinks {
  margin: 3em 0 1em;
  padding: 1.2em 1.4em 1.4em;
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
}
.note-backlinks-heading {
  font-size: 1em;
  font-weight: 600;
  margin: 0 0 .8em;
  color: var(--text-muted);
  display: flex; align-items: center; gap: .4em;
}
.note-backlinks-heading .emoji { font-size: 1.1em; }
.backlinks-count {
  background: var(--bg-chip);
  color: var(--text-accent);
  font-size: .75em;
  padding: .1em .55em;
  border-radius: 999px;
  margin-left: .2em;
}
.note-backlinks-list {
  list-style: none;
  padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: .3em;
}
.note-backlinks-list a {
  display: flex; flex-direction: column; gap: .15em;
  padding: .55em .7em;
  border-radius: 6px;
  text-decoration: none !important;
  color: var(--text-normal) !important;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  transition: border-color .15s, color .15s;
}
.note-backlinks-list a:hover {
  border-color: var(--text-accent);
  color: var(--text-accent) !important;
}
.backlink-title { font-size: .95em; line-height: 1.3; }
.backlink-folder {
  font-size: .78em;
  letter-spacing: .04em;
  color: var(--text-faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Previous / Next within folder — two-button nav at the foot of each note. */
.folder-nav {
  margin: 2em 0 1em;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .8em;
}
.folder-nav-link {
  display: flex; flex-direction: column; gap: .2em;
  padding: .9em 1.1em;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  text-decoration: none !important;
  color: var(--text-normal) !important;
  transition: border-color .15s, color .15s;
  min-width: 0;
}
.folder-nav-link:hover { border-color: var(--text-accent); color: var(--text-accent) !important; }
.folder-nav-next { text-align: right; }
.folder-nav-dir {
  font-size: .72em;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.folder-nav-title {
  font-size: 1em;
  line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis;
}
.folder-nav-placeholder {} /* keep the grid 2-column layout when one side is missing */
@media (max-width: 600px) {
  .folder-nav { grid-template-columns: 1fr; }
  .folder-nav-next { text-align: left; }
}

/* Auto-TOC — sticky right-rail of section anchors. Hidden under 1100px since
   the main column already shrinks; mobile readers don't lose anything because
   ⌘K search covers the same need. */
.note-toc {
  position: fixed;
  top: 90px;
  right: 1.6em;
  max-width: 220px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  font-size: .82em;
  line-height: 1.4;
  padding: 0.4em .6em;
  border-left: 2px solid var(--border-faint);
  color: var(--text-muted);
}
.note-toc-title {
  font-size: .72em;
  text-transform: uppercase;
  letter-spacing: .06em;
  font-weight: 600;
  color: var(--text-faint);
  margin: 0 0 .35em;
}
.note-toc-list {
  list-style: none;
  padding: 0; margin: 0;
}
.note-toc-item { margin: 0; font-size: .88em; }
.note-toc-item a {
  display: block;
  padding: .15em .2em;
  border-radius: 3px;
  color: var(--text-muted) !important;
  text-decoration: none !important;
  transition: color .15s;
}
.note-toc-item a:hover { color: var(--text-accent) !important; }
.note-toc-item a.active { color: var(--text-accent) !important; font-weight: 500; }
.note-toc-l3 a { padding-left: 1em; font-size: .94em; }
@media (max-width: 1099px) {
  .note-toc { display: none; }
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
  display: flex; align-items: center; gap: .55em;
  font-size: .82em; font-weight: 600;
  color: var(--text-muted);
  letter-spacing: .04em;
  text-transform: uppercase;
  margin: 1.8em 0 .55em;
  padding-bottom: .35em;
  border-bottom: 1px solid var(--border-faint);
  scroll-margin-top: 1em;
}
.folder-heading .folder-icon { display: none; }
.folder-heading .folder-count {
  margin-left: auto;
  font-size: .9em;
  color: var(--text-faint);
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  background: var(--bg-secondary);
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--border-faint);
}
.note-list .title  { font-weight: 500; font-size: .96em; line-height: 1.35; display: block; }
.note-list .ulid   { font-size: .7em; color: var(--text-faint); display: block; margin-top: 2px; font-family: "SF Mono", Menlo, monospace; }
.note-list .missing a { opacity: .5; text-decoration: line-through; }
/* Subtle arrow hint on hover */
.note-list a::after {
  content: "→";
  font-size: .75em;
  color: var(--text-faint);
  align-self: flex-end;
  margin-top: .4em;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity .14s ease, transform .14s ease;
}
.note-list a:hover::after {
  opacity: 1;
  transform: translateX(0);
  color: var(--text-accent);
}

/* gated badges + error page */
.gated-badge {
  font-size: .75em;
  letter-spacing: .08em;
  text-transform: uppercase;
  background: var(--bg-chip);
  color: var(--text-accent);
  border-radius: 2px;
  border-color: var(--text-accent);
}
.gated-pill {
  display: inline-block;
  background: var(--bg-chip);
  color: var(--text-accent);
  border: 1px solid transparent;
  font-size: .78em;
  letter-spacing: .06em;
  padding: 2px 10px;
  border-radius: 2px;
  margin-left: .5em;
  vertical-align: middle;
}
.gate-error { text-align: center; padding: 6em 0; }
.gate-error .gate-icon { font-size: 3em; opacity: .5; margin-bottom: .3em; }
.gate-error h1 { border: 0; }
.gate-error .gate-msg { color: var(--text-muted); font-size: 1.05em; margin: .8em 0 1.5em; }
.gate-error .gate-hint { font-size: .9em; color: var(--text-faint); max-width: 480px; margin: 0 auto; }

/* Wikilink hover-preview popover */
.wikilink-preview {
  position: absolute;
  z-index: 9999;
  max-width: 340px;
  min-width: 220px;
  background: var(--bg-primary);
  color: var(--text-normal);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06);
  padding: .85em 1em;
  font-size: .88em;
  line-height: 1.5;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity .15s ease, transform .15s ease;
}
.wikilink-preview.visible {
  opacity: 1;
  transform: translateY(0);
}
.wikilink-preview-title {
  font-weight: 600;
  margin: 0 0 .35em;
  color: var(--text-normal);
  font-size: .95em;
  line-height: 1.3;
}
.wikilink-preview-body {
  color: var(--text-muted);
  font-size: .85em;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wikilink-preview-folder {
  font-size: .7em;
  color: var(--text-faint);
  margin-top: .4em;
  padding-top: .4em;
  border-top: 1px solid var(--border-faint);
  letter-spacing: .04em;
}
@media (pointer: coarse) {
  /* Touch devices: disable hover preview to avoid sticky popovers */
  .wikilink-preview { display: none !important; }
}

/* Reading progress — thin fixed bar at top of viewport */
.read-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 0;
  background: var(--text-accent);
  z-index: 10000;
  transition: width .08s linear;
  pointer-events: none;
}

/* Read-state marker — dim notes the user has already opened */
.note-list a.is-read .title {
  color: var(--text-muted);
  opacity: .75;
}
.note-list a.is-read::before {
  content: "✓";
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: .72em;
  color: var(--text-faint);
  opacity: .55;
}
.note-list a { position: relative; }

/* "NEW since last visit" badge */
.note-list a.is-new::after {
  content: "NEW";
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: .58em;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--text-accent);
  background: var(--bg-chip);
  padding: 1px 5px;
  border-radius: 3px;
  opacity: 1 !important;
  transform: none !important;
}
.note-list a.is-new.is-read::before { display: none; }
.note-list a.is-new::after { opacity: 1; }

/* Recently updated section */
.recently-updated {
  margin: 1.2em 0 1.5em;
  padding: .9em 1em .75em;
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
}
.recently-updated-heading {
  display: flex;
  align-items: center;
  gap: .5em;
  margin: 0 0 .8em;
  font-size: .78em;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.recently-updated-heading::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-accent);
  box-shadow: 0 0 0 3px var(--bg-chip);
}
.recently-updated-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: .55em;
  list-style: none;
  padding: 0;
  margin: 0;
}
.recently-updated-list a {
  display: block;
  padding: .55em .75em;
  border-radius: 6px;
  font-size: .92em;
  color: var(--text-normal);
  border: 1px solid transparent;
  transition: background .12s ease, border-color .12s ease;
}
.recently-updated-list a:hover {
  background: var(--bg-primary);
  border-color: var(--border-faint);
}
.recently-updated-list .ru-date {
  display: block;
  font-size: .72em;
  color: var(--text-faint);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

/* ─── New hero (launch-ready) ───────────────────────────────────────────── */
.wrap-hero { padding: 2.5em 1.5em 2em; border-bottom: 1px solid var(--border-faint); }
.wrap-hero-byline {
  font-size: .82em;
  color: var(--text-faint);
  letter-spacing: .04em;
  margin-bottom: .5em;
  text-transform: uppercase;
}
.wrap-hero-author { color: var(--text-accent); font-weight: 600; letter-spacing: 0; text-transform: none; }
.wrap-hero-title {
  font-size: 2.4em;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -.02em;
  margin: 0 0 .35em;
  color: var(--text-normal);
}
.wrap-hero-desc {
  font-size: 1.05em;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0 0 1.3em;
  max-width: 70ch;
}
.wrap-hero-actions {
  display: flex; gap: .6em; flex-wrap: wrap;
  margin: 0 0 1.2em;
}
.wrap-hero-cta {
  display: inline-flex; align-items: center; gap: .45em;
  padding: .6em 1.2em;
  border-radius: 8px;
  font-size: .92em;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
}
.wrap-hero-cta-primary {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #7c3aed 100%);
  background-size: 200% 200%;
  background-position: 0% 50%;
  color: #fff;
  border-color: transparent !important;
  box-shadow: 0 1px 3px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.1);
  font-weight: 600;
}
.wrap-hero-cta-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.15) 50%, transparent 65%);
  transform: translateX(-120%);
  transition: transform .55s ease;
}
.wrap-hero-cta-primary:hover {
  background-position: 100% 50%;
  box-shadow: 0 4px 16px rgba(109,40,217,.35), inset 0 1px 0 rgba(255,255,255,.15);
  transform: translateY(-1px);
}
.wrap-hero-cta-primary:hover::after {
  transform: translateX(120%);
}
.wrap-hero-cta-primary kbd {
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.9);
}
.wrap-hero-cta-secondary {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border);
}
.wrap-hero-cta-secondary:hover {
  background: var(--bg-secondary);
  color: var(--text-normal);
  border-color: var(--text-accent);
}
.wrap-hero-cta kbd {
  background: rgba(255,255,255,.18);
  border: none;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: .85em;
  margin-left: .15em;
}
.wrap-hero-cta-secondary kbd { background: var(--kbd-bg); color: var(--text-muted); }
.wrap-hero-stats {
  display: flex; align-items: center; flex-wrap: wrap; gap: .5em;
  font-size: .85em;
  color: var(--text-faint);
}
.wrap-hero-stats .wrap-stat strong { color: var(--text-muted); font-weight: 600; font-variant-numeric: tabular-nums; }
.wrap-hero-stats .wrap-stat-sep { opacity: .5; }

/* ─── New "Recently updated" card design ────────────────────────────────── */
.recently-updated-list-v2 {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.recently-updated-list-v2 li { border-bottom: 1px solid var(--border-faint); }
.recently-updated-list-v2 li:last-child { border-bottom: none; }
.recently-updated-list-v2 a {
  display: flex;
  align-items: baseline;
  gap: .9em;
  padding: .65em .1em;
  color: var(--text-normal);
  text-decoration: none;
  transition: color .12s;
}
.recently-updated-list-v2 a:hover { color: var(--text-accent); }
.ru-card-title {
  font-size: .9em;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ru-card-folder {
  font-size: .72em;
  color: var(--text-faint);
  white-space: nowrap;
  flex-shrink: 0;
}
.ru-card-meta {
  display: flex; align-items: center; gap: .3em;
  font-size: .72em;
  color: var(--text-faint);
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.ru-card-meta .ru-card-dot { opacity: .4; }

@media (max-width: 760px) {
  .wrap-hero-title { font-size: 1.85em; }
  .wrap-hero { padding: 1.8em 1.1em 1.5em; }
  .wrap-hero-cta { padding: .7em 1em; font-size: .95em; min-height: 44px; }
  .recently-updated-list-v2 a { flex-wrap: wrap; gap: .4em; }
  .ru-card-folder { display: none; }
}
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
  // Explicit width/height + class so the icon renders at the intended 14×14
  // size instead of the SVG default (which scales to fill its parent — that's
  // what caused the huge calendar/tag/checkmark icons in the property panel).
  return `<svg class="prop-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
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
  author?: string;       // optional byline shown in the hero
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
        return `<a class="${cls}" href="${href}" data-ulid="${f.ulid}"><span class="tree-file-name">${escapeHtml(f.label)}</span>${tag}</a>`;
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
  const gatedBadge = opts.gated ? `<div class="sidebar-badge"><span class="gated-pill" title="this share requires a token">gated</span></div>` : "";
  const desc = "";
  const downloadLink = opts.showDownload
    ? `<a class="sidebar-cta" href="${opts.shareBase}/download${tq}" download>Download Notes <sub>.zip</sub></a>`
    : `<a class="sidebar-cta" href="${opts.shareBase}${tq}">← back to overview</a>`;
  return `<aside class="wrap-sidebar" id="wrap-sidebar">
  <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle navigation">☰</button>
  <div class="sidebar-inner">
    <div class="sidebar-header">
      <div class="sidebar-title" role="heading" aria-level="2"><a href="${opts.shareBase}${tq}" class="sidebar-title-link">${escapeHtml(opts.title)}</a></div>
      ${gatedBadge}
      ${desc}
    </div>
    ${downloadLink}
    <div class="sidebar-search">
      <input type="search" id="sidebar-filter" class="sidebar-filter-input" placeholder="Filter files…" autocomplete="off" spellcheck="false" aria-label="Filter files in sidebar">
      <button type="button" class="sidebar-filter-hint" id="sidebar-filter-hint" aria-label="Open command palette for full content search">
        <span class="sidebar-filter-hint-text">⌘K for full search</span>
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
  var isMobile = matchMedia("(max-width: 760px)").matches;

  if (isMobile && sb) {
    // ── Mobile: overlay drawer pattern ──────────────────────────────────────
    // The existing sidebar-toggle (btn) stays INSIDE the drawer as the ✕ close button.
    // A new ☰ open button is created for the sticky topbar.
    if (btn) {
      btn.textContent = "✕";
      btn.setAttribute("aria-label", "Close navigation");
    }

    // Build sticky topbar: [☰ open btn] [vault title]
    var openBtn = document.createElement("button");
    openBtn.className = "mobile-menu-btn";
    openBtn.textContent = "☰";
    openBtn.setAttribute("aria-label", "Open navigation");
    openBtn.setAttribute("aria-expanded", "false");

    var topbar = document.createElement("div");
    topbar.className = "mobile-topbar";
    var titleEl = sb.querySelector(".sidebar-title");
    var titleText = titleEl ? titleEl.textContent || "" : "";
    var titleSpan = document.createElement("span");
    titleSpan.className = "mobile-topbar-title";
    titleSpan.textContent = titleText;
    topbar.appendChild(openBtn);
    topbar.appendChild(titleSpan);
    sb.parentNode.insertBefore(topbar, sb);

    // Backdrop
    var backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);

    function openDrawer() {
      sb.classList.add("open");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
      openBtn.setAttribute("aria-expanded", "true");
    }
    function closeDrawer() {
      sb.classList.remove("open");
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
      openBtn.setAttribute("aria-expanded", "false");
    }

    openBtn.addEventListener("click", openDrawer);
    if (btn) btn.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    sb.querySelectorAll(".tree-file").forEach(function(a) {
      a.addEventListener("click", closeDrawer);
    });

  } else if (btn && sb) {
    // ── Desktop: collapse sidebar to 48px icon rail ──────────────────────────
    btn.setAttribute("aria-expanded", sb.classList.contains("collapsed") ? "false" : "true");
    btn.addEventListener("click", function(){
      sb.classList.toggle("collapsed");
      btn.setAttribute("aria-expanded", sb.classList.contains("collapsed") ? "false" : "true");
    });
  }

  document.querySelectorAll("[data-open-palette]").forEach(function(el){
    el.addEventListener("click", function(ev){
      ev.preventDefault();
      if (window.__brainshareOpenPalette) window.__brainshareOpenPalette();
    });
  });

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

/**
 * Reverse of buildEdges: for each note (target), who links TO it?
 * The result powers the "Notes that link here" panel on note pages, the same
 * way Obsidian's backlinks pane works.
 *
 * Returns Map<targetUlid, Array<{ulid, basename, path, title}>>.
 */
export function buildBacklinks(records: NoteRecord[]): Map<string, Array<{ ulid: string; basename: string; path: string; title: string }>> {
  const setByBasename = shareSetFromNotes(records);
  const byTarget = new Map<string, Array<{ ulid: string; basename: string; path: string; title: string }>>();
  const seen = new Set<string>();
  for (const source of records) {
    if (!source.md) continue;
    const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source.md))) {
      const target = m[1].trim();
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

/**
 * For the current note within a folder, return the previous/next sibling notes
 * (sorted by basename). Powers the prev/next nav at the foot of every note.
 */
export function folderSiblings(
  current: { ulid: string; path: string },
  all: Array<{ ulid: string; path: string; basename: string; title: string }>
): { prev?: { ulid: string; title: string }; next?: { ulid: string; title: string } } {
  const folder = current.path.includes("/") ? current.path.split("/").slice(0, -1).join("/") : "";
  const siblings = all
    .filter((n) => {
      const f = n.path.includes("/") ? n.path.split("/").slice(0, -1).join("/") : "";
      return f === folder;
    })
    .sort((a, b) => a.basename.localeCompare(b.basename));
  const i = siblings.findIndex((n) => n.ulid === current.ulid);
  if (i < 0) return {};
  return {
    prev: i > 0 ? { ulid: siblings[i - 1].ulid, title: siblings[i - 1].title } : undefined,
    next: i < siblings.length - 1 ? { ulid: siblings[i + 1].ulid, title: siblings[i + 1].title } : undefined,
  };
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
  // "Notes that link here" — already-resolved list of source notes whose
  // wikilinks point at the current note. Rendered as a panel after the body.
  backlinks?: Array<{ ulid: string; title: string; path: string }>;
  // Previous / next sibling within the current folder, for in-place reading
  // of a multi-part series without going back to the landing.
  folderNav?: { prev?: { ulid: string; title: string }; next?: { ulid: string; title: string } };
}

export function renderNote(md: string, ulid: string, ctx?: RenderCtx): string {
  const { fm, body: rawBody } = parseFrontmatter(md);
  // Title falls back through: body's leading H1 (highest signal — that's what
  // the AUTHOR wrote) → frontmatter title → filename basename → ULID.
  const bodyH1Match = rawBody.match(/^\s*#\s+(.+?)\s*$/m);
  const bodyH1 = bodyH1Match ? bodyH1Match[1].trim() : "";
  const fileTitle = ctx?.path?.split("/").pop()?.replace(/\.md$/i, "");
  const title = bodyH1 || (fm?.byKey.get("title") as string) || fileTitle || ulid;

  const tq = ctx?.tokenQuery ?? "";
  // Always strip the body's leading H1 — we always render `title` ourselves
  // below, so leaving the original would duplicate. (Previously this only
  // stripped on exact match, which left a stray H1 whenever the file's
  // basename and the body's heading differed by a prefix.)
  const dedupedBody = bodyH1Match
    ? rawBody.replace(bodyH1Match[0], "")
    : rawBody;
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
      return `<span class="embed-missing" title="asset not in this share">[missing: ${escapeHtml(t)}]</span>`;
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
          return `<a class="wikilink-internal wikilink-canvas" href="${ctx.shareBase}/c/${canvasUlid}${tq}" title="canvas">${escapeHtml(label)}</a>`;
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
    const backlinksHtml = renderBacklinks(ctx);
    const folderNavHtml = renderFolderNav(ctx);
    // OG / Twitter card metadata. The og.svg endpoint inherits the token from
    // the page (same gate semantics) — so previews work for whoever already
    // has the share link and fail for everyone else, which is exactly the
    // privacy posture of gated shares.
    const wrapTitle = ctx.wrapTree?.wrapTitle ?? "";
    const ogImage = `${ctx.shareBase}/${ulid}/og.svg${tq}`;
    const noteBody = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/^#[^\n]*\n/, "").trim();
    const noteExcerpt = noteBody.replace(/[#*_`[\]]/g, "").replace(/\s+/g, " ").slice(0, 160).trim();
    const ogDesc = noteExcerpt || (wrapTitle ? `From the "${wrapTitle}" brain share` : "Published via BrainShare");
    const pageUrl = `${ctx.shareBase}/${ulid}`;
    // Reading time and word count — strip frontmatter, count words, divide by 200 wpm
    const bodyForCount = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/[#*_`[\]]/g, "");
    const wordCount = (bodyForCount.match(/\b\w+\b/g) ?? []).length;
    const readMinutes = Math.max(1, Math.round(wordCount / 200));
    const readingMeta = `<div class="note-reading-meta"><span class="rmeta-time">${readMinutes} min read</span><span class="rmeta-sep">·</span><span class="rmeta-words">${wordCount.toLocaleString()} words</span></div>`;
    return shell({ title, sidebarLayout: true, meta: { ogImage, ogTitle: title, ogDescription: ogDesc, pageUrl }, body: `
${sidebar}
<main class="wrap-main">
  <article class="prose">
    ${breadcrumb}
    ${renderNoteActions()}
    <h1>${escapeHtml(title)}</h1>
    ${readingMeta}
    ${props}
    ${html}
    ${backlinksHtml}
    ${folderNavHtml}
  </article>
  ${tail}
</main>
${SIDEBAR_TOGGLE_JS}
${NOTE_ACTIONS_JS}
${STICKINESS_JS}
${READ_PROGRESS_JS}
${WIKILINK_PREVIEW_JS}
${NOTE_TOC_JS}
${palette}
` });
  }

  // Reading time and word count — strip frontmatter, count words, divide by 200 wpm
  const bodyForCount = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/[#*_`[\]]/g, "");
  const wordCount = (bodyForCount.match(/\b\w+\b/g) ?? []).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));
  const readingMeta = `<div class="note-reading-meta"><span class="rmeta-time">${readMinutes} min read</span><span class="rmeta-sep">·</span><span class="rmeta-words">${wordCount.toLocaleString()} words</span></div>`;
  return shell({ title, body: `
${breadcrumb}
<h1>${escapeHtml(title)}</h1>
${readingMeta}
${props}
${html}
${tail}
${STICKINESS_JS}
` });
}

// Loaded only on pages that contain ```mermaid``` blocks. Converts
// <pre><code class="language-mermaid"> into a styled host with a click-to-expand
// fullscreen viewer (pan + zoom + ESC to close). Inline diagrams render at
// native size with horizontal scroll; the modal lets the user actually read
// wide sequence diagrams without squinting.
const MERMAID_BOOTSTRAP = `<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs";
// Always use the default (light) theme. We don't switch to "dark" based on
// prefers-color-scheme because the SVG render is one-shot — if the user
// toggles their OS theme later, the SVG colours can't update, which makes
// the diagram unreadable on the new background. The .mermaid-host /
// .mermaid-modal-stage CSS pins the surrounding background to white in
// both light and dark mode to match.
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

// Pull a human-readable label from the diagram source. Mermaid sources commonly
// open with a directive line like "sequenceDiagram" / "graph TD" / "flowchart LR";
// the most useful title is usually the first non-directive non-empty line, which
// is often the diagram's first node label or a "%% comment" header.
function diagramTitle(src) {
  const lines = src.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return "Diagram";
  const directive = /^(sequenceDiagram|graph\\b|flowchart\\b|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|xychart\\b)/i;
  for (const line of lines) {
    if (line.startsWith("%%")) {
      const cleaned = line.replace(/^%%\\s*/, "").slice(0, 80);
      if (cleaned) return cleaned;
    }
    if (!directive.test(line)) return line.slice(0, 80);
  }
  return lines[0].slice(0, 80);
}

// 1) Replace <pre><code class="language-mermaid"> blocks with .mermaid-host > .mermaid
document.querySelectorAll("pre > code.language-mermaid").forEach((el) => {
  const code = el.textContent;
  const host = document.createElement("div");
  host.className = "mermaid-host";
  host.dataset.title = diagramTitle(code);
  const inner = document.createElement("div");
  inner.className = "mermaid";
  inner.textContent = code;
  host.appendChild(inner);
  const actions = document.createElement("div");
  actions.className = "mermaid-actions";
  actions.innerHTML = '<button class="mermaid-btn" type="button" title="Open in viewer (or click the diagram)" aria-label="Open in viewer">⛶</button>';
  host.appendChild(actions);
  el.parentElement.replaceWith(host);
});

// 2) Render
await mermaid.run().catch(e => console.warn("mermaid:", e));

// 3) Wire up click-to-expand on each rendered host
const modal = (() => {
  const m = document.createElement("div");
  m.className = "mermaid-modal";
  m.innerHTML = \`
    <div class="mermaid-modal-bar">
      <div class="mermaid-modal-title"></div>
      <div class="mermaid-controls">
        <button data-act="out" title="Zoom out (–)">−</button>
        <button data-act="in" title="Zoom in (+)">+</button>
        <button data-act="fit" title="Fit to screen (F)">⛶ Fit</button>
        <button data-act="reset" title="Reset (R)">⌖ 1:1</button>
        <button data-act="close" title="Close (Esc)">✕</button>
      </div>
    </div>
    <div class="mermaid-modal-stage"></div>
    <div class="mermaid-modal-hint">Scroll to zoom · drag to pan · Esc to close</div>
  \`;
  document.body.appendChild(m);
  return m;
})();
const stage = modal.querySelector(".mermaid-modal-stage");

let scale = 1, tx = 0, ty = 0, currentSvg = null;
function applyTransform() {
  if (currentSvg) currentSvg.style.transform = \`translate(\${tx}px,\${ty}px) scale(\${scale})\`;
}
function fit() {
  if (!currentSvg) return;
  const bb = currentSvg.getBoundingClientRect();
  // Read intrinsic size from viewBox or width/height attributes
  const vb = currentSvg.viewBox && currentSvg.viewBox.baseVal;
  const w = (vb && vb.width) || currentSvg.getBBox().width || bb.width;
  const h = (vb && vb.height) || currentSvg.getBBox().height || bb.height;
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const pad = 40;
  scale = Math.min((sw - pad) / w, (sh - pad) / h, 4);
  if (!isFinite(scale) || scale <= 0) scale = 1;
  tx = (sw - w * scale) / 2;
  ty = (sh - h * scale) / 2;
  applyTransform();
}
function open(svg, title) {
  // Clone so the inline diagram keeps its own copy
  const clone = svg.cloneNode(true);
  clone.removeAttribute("style");
  stage.replaceChildren(clone);
  currentSvg = clone;
  modal.querySelector(".mermaid-modal-title").textContent = title || "Diagram";
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(fit);
}
function close() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  stage.replaceChildren();
  currentSvg = null;
}

document.querySelectorAll(".mermaid-host").forEach((host) => {
  const svg = host.querySelector("svg");
  if (!svg) return;
  const inner = host.querySelector(".mermaid");
  const onActivate = (ev) => { ev.preventDefault(); open(svg, host.dataset.title || ""); };
  inner.addEventListener("click", onActivate);
  host.querySelector(".mermaid-btn")?.addEventListener("click", onActivate);
});

// Modal interactions
modal.querySelector(".mermaid-controls").addEventListener("click", (e) => {
  const act = e.target?.dataset?.act;
  if (!act) return;
  if (act === "in") { scale = Math.min(scale * 1.25, 8); applyTransform(); }
  else if (act === "out") { scale = Math.max(scale / 1.25, 0.1); applyTransform(); }
  else if (act === "reset") { scale = 1; tx = 0; ty = 0; applyTransform(); }
  else if (act === "fit") { fit(); }
  else if (act === "close") { close(); }
});

stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  const cx = e.clientX - r.left, cy = e.clientY - r.top;
  const factor = Math.exp(-e.deltaY * 0.0015);
  const newScale = Math.max(0.1, Math.min(8, scale * factor));
  // cursor-anchored zoom
  tx = cx - (cx - tx) * (newScale / scale);
  ty = cy - (cy - ty) * (newScale / scale);
  scale = newScale;
  applyTransform();
}, { passive: false });

let dragStart = null;
stage.addEventListener("mousedown", (e) => {
  dragStart = { x: e.clientX - tx, y: e.clientY - ty };
  stage.classList.add("dragging");
});
window.addEventListener("mousemove", (e) => {
  if (!dragStart) return;
  tx = e.clientX - dragStart.x;
  ty = e.clientY - dragStart.y;
  applyTransform();
});
window.addEventListener("mouseup", () => {
  dragStart = null;
  stage.classList.remove("dragging");
});

// Touch pan + pinch
let touchStart = null;
stage.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    touchStart = { type: "pan", x: e.touches[0].clientX - tx, y: e.touches[0].clientY - ty };
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    touchStart = { type: "pinch", dist: Math.hypot(dx, dy), scale };
  }
}, { passive: true });
stage.addEventListener("touchmove", (e) => {
  if (!touchStart) return;
  if (touchStart.type === "pan" && e.touches.length === 1) {
    tx = e.touches[0].clientX - touchStart.x;
    ty = e.touches[0].clientY - touchStart.y;
    applyTransform();
  } else if (touchStart.type === "pinch" && e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    scale = Math.max(0.1, Math.min(8, touchStart.scale * dist / touchStart.dist));
    applyTransform();
  }
  e.preventDefault();
}, { passive: false });
stage.addEventListener("touchend", () => { touchStart = null; });

// Keyboard
window.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") close();
  else if (e.key === "+" || e.key === "=") { scale = Math.min(scale * 1.25, 8); applyTransform(); }
  else if (e.key === "-") { scale = Math.max(scale / 1.25, 0.1); applyTransform(); }
  else if (e.key.toLowerCase() === "f") fit();
  else if (e.key.toLowerCase() === "r") { scale = 1; tx = 0; ty = 0; applyTransform(); }
});

// Click backdrop to close
modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
</script>`;

// Action row shown above every note's H1. Subtle ghost buttons — search,
// copy-link, theme toggle. Wired up by NOTE_ACTIONS_JS at the bottom of the
// page so we don't pay client-script cost until the user actually interacts.
function renderNoteActions(): string {
  return `<div class="note-actions" data-note-actions>
    <button class="note-action-btn" data-action="search" title="Search this share (⌘K)">
      <span>Search</span>
    </button>
    <button class="note-action-btn" data-action="copy-link" title="Copy a link to this note">
      <span>Copy link</span>
    </button>
    <button class="note-action-btn" data-action="copy-md" title="Copy the note's source as Markdown">
      <span>Copy as Markdown</span>
    </button>
  </div>`;
}

const NOTE_ACTIONS_JS = `<script>
(function(){
  var row = document.querySelector("[data-note-actions]");
  if (!row) return;
  function flash(btn, ok, msg) {
    var label = btn.querySelector("span:last-child");
    if (!label) return;
    var original = label.textContent;
    label.textContent = msg || (ok ? "Copied!" : "Failed");
    btn.dataset.flash = ok ? "ok" : "err";
    setTimeout(function(){ label.textContent = original; delete btn.dataset.flash; }, 1400);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for older browsers / non-https
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
      return ok;
    }
  }
  row.addEventListener("click", async function(ev){
    var btn = ev.target.closest && ev.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.dataset.action;
    if (action === "search") {
      if (window.__brainshareOpenPalette) window.__brainshareOpenPalette();
      return;
    }
    if (action === "copy-link") {
      var ok = await copy(window.location.href);
      flash(btn, ok);
      return;
    }
    if (action === "copy-md") {
      // Use the full current URL so the scoped route handles ?raw=1 correctly.
      var rawHref = window.location.href;
      var sep = rawHref.indexOf("?") >= 0 ? "&" : "?";
      var rawUrl = rawHref + sep + "raw=1";
      // Safari requires ClipboardItem + Promise to keep the user-gesture alive
      // across an async fetch. Without this pattern, Safari rejects the write
      // after the await because it considers the gesture "consumed".
      if (navigator.clipboard && window.ClipboardItem) {
        var blobPromise = fetch(rawUrl)
          .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
          .then(function(t){ return new Blob([t], {type:"text/plain"}); });
        try {
          await navigator.clipboard.write([new ClipboardItem({"text/plain": blobPromise})]);
          flash(btn, true, "Copied!");
        } catch(e) {
          flash(btn, false, "Failed");
        }
        return;
      }
      // Fallback path for browsers without ClipboardItem support
      try {
        var resp = await fetch(rawUrl);
        if (!resp.ok) { flash(btn, false, "Fetch " + resp.status); return; }
        var text = await resp.text();
        var ok = await copy(text);
        flash(btn, ok, ok ? "Copied " + text.length + " chars" : "Failed");
      } catch (e) {
        flash(btn, false, "Network error");
      }
      return;
    }
  });
})();
</script>`;

const READ_PROGRESS_JS = `<script>
(function(){
  var bar = document.createElement('div');
  bar.className = 'read-progress';
  document.body.appendChild(bar);
  function update(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max <= 0) { bar.style.width = '0'; return; }
    var pct = Math.min(100, Math.max(0, (h.scrollTop || document.body.scrollTop) / max * 100));
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
</script>`;

const STICKINESS_JS = `<script>
(function(){
  var STORAGE_VISITED = 'brainshare_visited_v1';
  var STORAGE_LAST_VISIT = 'brainshare_last_visit_v1';
  function safeGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function safeSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

  // Decode ULID's leading 10 chars to a unix ms timestamp.
  // Crockford base32: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
  var ULID_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function ulidTime(ulid){
    if (!ulid || ulid.length < 10) return 0;
    var t = 0;
    for (var i = 0; i < 10; i++) {
      var c = ulid.charAt(i).toUpperCase();
      var v = ULID_ALPHA.indexOf(c);
      if (v < 0) return 0;
      t = t * 32 + v;
    }
    return t;
  }

  // Visited-set: JSON array of ULIDs (cap at 500 to bound storage)
  function getVisited(){
    try { return JSON.parse(safeGet(STORAGE_VISITED) || '[]'); }
    catch(e) { return []; }
  }
  function markVisited(ulid){
    if (!ulid) return;
    var list = getVisited();
    if (list.indexOf(ulid) >= 0) return;
    list.push(ulid);
    if (list.length > 500) list = list.slice(-500);
    safeSet(STORAGE_VISITED, JSON.stringify(list));
  }

  // Detect if we're on a note page (path has /share/:id/:ulid)
  var ulidMatch = location.pathname.match(/\\/share\\/[^/]+\\/([0-9A-HJKMNP-TV-Z]{26})$/);
  if (ulidMatch) {
    markVisited(ulidMatch[1]);
  }

  // On landing page, apply read-state + new-since-visit classes to tiles
  var noteLinks = document.querySelectorAll('.note-list a[data-ulid]');
  if (noteLinks.length > 0) {
    var visited = getVisited();
    var visitedSet = {};
    for (var i = 0; i < visited.length; i++) visitedSet[visited[i]] = true;
    var lastVisit = parseInt(safeGet(STORAGE_LAST_VISIT) || '0', 10);
    var hasNew = false;
    noteLinks.forEach(function(a){
      var ulid = a.getAttribute('data-ulid');
      if (!ulid) return;
      if (visitedSet[ulid]) a.classList.add('is-read');
      if (lastVisit > 0 && ulidTime(ulid) > lastVisit) {
        a.classList.add('is-new');
        hasNew = true;
      }
    });
    // Update last-visit AFTER applying classes (next visit will compare against now)
    safeSet(STORAGE_LAST_VISIT, String(Date.now()));
  }

  // Also apply read-state in the sidebar tree on note pages
  var treeLinks = document.querySelectorAll('.tree-file[data-ulid]');
  if (treeLinks.length > 0) {
    var visited2 = getVisited();
    var vs2 = {};
    for (var j = 0; j < visited2.length; j++) vs2[visited2[j]] = true;
    treeLinks.forEach(function(a){
      var u = a.getAttribute('data-ulid');
      if (u && vs2[u]) a.classList.add('is-read');
    });
  }
})();
</script>`;

const WIKILINK_PREVIEW_JS = `<script>
(function(){
  var cache = {};            // href -> { title, body }
  var pending = {};          // href -> Promise (dedupe in-flight requests)
  var popover = null;
  var showTimer = null;
  var hideTimer = null;
  var currentAnchor = null;

  function ensurePopover(){
    if (popover) return popover;
    popover = document.createElement('div');
    popover.className = 'wikilink-preview';
    document.body.appendChild(popover);
    popover.addEventListener('mouseenter', function(){
      // Keep open if mouse moves into popover
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    });
    popover.addEventListener('mouseleave', function(){ hide(); });
    return popover;
  }

  function extractTitle(md){
    // First H1 in body wins, else first non-empty line
    var stripped = md.replace(/^---[\\s\\S]*?\\n---\\s*\\n/, '');
    var h1 = stripped.match(/^\\s*#\\s+(.+?)\\s*$/m);
    if (h1) return h1[1].trim();
    var firstLine = stripped.split('\\n').find(function(l){ return l.trim().length > 0; });
    return firstLine ? firstLine.trim().slice(0, 80) : '';
  }
  function extractBody(md){
    var stripped = md.replace(/^---[\\s\\S]*?\\n---\\s*\\n/, '').replace(/^#[^\\n]*\\n/, '').trim();
    return stripped.replace(/[#*_\`\\[\\]]/g, '').replace(/\\s+/g, ' ').slice(0, 280);
  }

  function fetchExcerpt(href){
    // href like /share/:wrapId/:ulid?t=JWT — append &raw=1 (or ?raw=1)
    var sep = href.indexOf('?') >= 0 ? '&' : '?';
    var url = href + sep + 'raw=1';
    if (pending[href]) return pending[href];
    pending[href] = fetch(url).then(function(r){
      if (!r.ok) throw new Error('http ' + r.status);
      return r.text();
    }).then(function(md){
      var entry = { title: extractTitle(md), body: extractBody(md) };
      cache[href] = entry;
      delete pending[href];
      return entry;
    }).catch(function(e){
      delete pending[href];
      throw e;
    });
    return pending[href];
  }

  function position(anchor){
    var rect = anchor.getBoundingClientRect();
    var pop = ensurePopover();
    var pw = pop.offsetWidth || 280;
    var ph = pop.offsetHeight || 100;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = (spaceBelow >= ph + 12 || rect.top < ph + 12)
      ? rect.bottom + window.scrollY + 6
      : rect.top + window.scrollY - ph - 6;
    var left = rect.left + window.scrollX;
    // Clamp horizontally to viewport
    var maxLeft = window.scrollX + window.innerWidth - pw - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }

  function render(entry){
    var pop = ensurePopover();
    var titleHtml = entry.title ? '<div class="wikilink-preview-title">' + escape(entry.title) + '</div>' : '';
    var bodyHtml = entry.body ? '<div class="wikilink-preview-body">' + escape(entry.body) + '</div>' : '<div class="wikilink-preview-body" style="font-style:italic;opacity:.6">No content</div>';
    pop.innerHTML = titleHtml + bodyHtml;
  }

  function escape(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function show(anchor){
    var href = anchor.getAttribute('href');
    if (!href) return;
    currentAnchor = anchor;
    var pop = ensurePopover();
    if (cache[href]) {
      render(cache[href]);
      position(anchor);
      pop.classList.add('visible');
      return;
    }
    // Loading state
    pop.innerHTML = '<div class="wikilink-preview-body" style="font-style:italic;opacity:.6">Loading…</div>';
    position(anchor);
    pop.classList.add('visible');
    fetchExcerpt(href).then(function(entry){
      if (currentAnchor !== anchor) return;
      render(entry);
      position(anchor);
    }).catch(function(){
      if (currentAnchor !== anchor) return;
      pop.innerHTML = '<div class="wikilink-preview-body" style="font-style:italic;opacity:.5">Preview unavailable</div>';
    });
  }

  function hide(){
    if (popover) popover.classList.remove('visible');
    currentAnchor = null;
  }

  document.addEventListener('mouseover', function(ev){
    var a = ev.target.closest && ev.target.closest('a.wikilink-internal');
    if (!a) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(function(){ show(a); }, 320);
  });
  document.addEventListener('mouseout', function(ev){
    var a = ev.target.closest && ev.target.closest('a.wikilink-internal');
    if (!a) return;
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    hideTimer = setTimeout(hide, 180);
  });
})();
</script>`;

// "Notes that link here" — Obsidian's backlinks pane, rendered as a section
// after the article body. Quietly omitted when there are no inbound links.
function renderBacklinks(ctx: RenderCtx | undefined): string {
  const links = ctx?.backlinks ?? [];
  if (!links.length) return "";
  const shareBase = ctx?.shareBase ?? "";
  const tq = ctx?.tokenQuery ?? "";
  const items = links
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((b) => {
      const folder = b.path.includes("/") ? b.path.split("/").slice(0, -1).join("/") : "";
      const folderHint = folder ? `<span class="backlink-folder">${escapeHtml(folder)}</span>` : "";
      return `<li><a href="${shareBase}/${b.ulid}${tq}"><span class="backlink-title">${escapeHtml(b.title)}</span>${folderHint}</a></li>`;
    })
    .join("");
  return `<aside class="note-backlinks" aria-labelledby="backlinks-heading">
    <h2 id="backlinks-heading" class="note-backlinks-heading">
      Notes that link here <span class="backlinks-count">${links.length}</span>
    </h2>
    <ul class="note-backlinks-list">${items}</ul>
  </aside>`;
}

// Prev / next navigation within the current folder. Lets readers walk a multi-
// part series in order without bouncing through the landing every time.
function renderFolderNav(ctx: RenderCtx | undefined): string {
  const nav = ctx?.folderNav;
  if (!nav || (!nav.prev && !nav.next)) return "";
  const shareBase = ctx?.shareBase ?? "";
  const tq = ctx?.tokenQuery ?? "";
  const prev = nav.prev
    ? `<a class="folder-nav-link folder-nav-prev" href="${shareBase}/${nav.prev.ulid}${tq}">
        <span class="folder-nav-dir">← Previous</span>
        <span class="folder-nav-title">${escapeHtml(nav.prev.title)}</span>
      </a>`
    : `<span class="folder-nav-placeholder"></span>`;
  const next = nav.next
    ? `<a class="folder-nav-link folder-nav-next" href="${shareBase}/${nav.next.ulid}${tq}">
        <span class="folder-nav-dir">Next →</span>
        <span class="folder-nav-title">${escapeHtml(nav.next.title)}</span>
      </a>`
    : `<span class="folder-nav-placeholder"></span>`;
  return `<nav class="folder-nav" aria-label="Folder navigation">${prev}${next}</nav>`;
}

// Auto-TOC: builds a sticky right-rail of <h2>/<h3> anchors from the article.
// Pure client script — does nothing on notes with ≤2 headings. Runs after
// paint so it doesn't block first contentful render.
const NOTE_TOC_JS = `<script>
(function(){
  var article = document.querySelector("article.prose");
  if (!article) return;
  var heads = article.querySelectorAll("h2, h3");
  if (heads.length < 3) return;
  // Assign stable ids
  var seen = {};
  function slug(text) {
    var s = (text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) s = "section";
    var base = s, i = 1;
    while (seen[s]) { s = base + "-" + (++i); }
    seen[s] = true;
    return s;
  }
  var items = [];
  heads.forEach(function(h){
    if (!h.id) h.id = slug(h.textContent);
    items.push({ id: h.id, text: h.textContent || "", level: h.tagName === "H3" ? 3 : 2 });
  });
  var toc = document.createElement("nav");
  toc.className = "note-toc";
  toc.setAttribute("aria-label", "On this page");
  var html = '<div class="note-toc-title">On this page</div><ol class="note-toc-list">';
  items.forEach(function(it){
    html += '<li class="note-toc-item note-toc-l' + it.level + '"><a href="#' + it.id + '">' + (it.text.replace(/</g, "&lt;")) + '</a></li>';
  });
  html += '</ol>';
  toc.innerHTML = html;
  article.parentElement.appendChild(toc);
  // Highlight the section currently in view
  if (typeof IntersectionObserver !== "undefined") {
    var links = {};
    toc.querySelectorAll("a").forEach(function(a){ links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var a = links[e.target.id];
        if (!a) return;
        if (e.isIntersecting) a.classList.add("active"); else a.classList.remove("active");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    heads.forEach(function(h){ io.observe(h); });
  }
})();
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
      ? `<span class="scope-badge gated-badge">gated</span>`
      : `<span class="scope-badge">scoped to share</span>`;
  return `<div class="breadcrumb">${back}${folderPart}<span>${escapeHtml(title)}</span>${badge}</div>`;
}

/**
 * Compact inline chips shown right under the action row — surfaces tags and
 * status (the highest-signal frontmatter fields) so a reader can scan them at
 * a glance without expanding the full properties panel. Empty when there's
 * nothing useful to show.
 */
function renderInlineMeta(fm: Frontmatter | null): string {
  if (!fm) return "";
  const chips: string[] = [];
  const tags = fm.byKey.get("tags");
  if (Array.isArray(tags)) {
    for (const t of tags) chips.push(`<span class="meta-chip meta-chip-tag">#${escapeHtml(String(t))}</span>`);
  }
  const status = fm.byKey.get("status");
  if (typeof status === "string" && status.trim()) {
    chips.push(`<span class="meta-chip meta-chip-status">${escapeHtml(status)}</span>`);
  }
  if (!chips.length) return "";
  return `<div class="note-meta-chips">${chips.join("")}</div>`;
}

/**
 * Full properties table. Rendered as a `<details>` element collapsed by
 * default — the article must NOT be buried under 10 rows of frontmatter
 * metadata. The summary line shows the count so readers know it's there
 * without it dominating the viewport.
 *
 * Placement: AFTER the article body, before backlinks. The agent + power-user
 * audience that cares about properties can expand them; everyone else reads
 * the note first.
 */
function renderProperties(fm: Frontmatter | null, ulid: string): string {
  const rows: string[] = [];
  if (fm) {
    for (const { key, value } of fm.fields) {
      const icon = PROP_ICON[key] ?? PROP_ICON.default;
      const valHtml = renderFmValue(key, value);
      rows.push(`<div class="prop-row"><span class="prop-key">${icon}${escapeHtml(key)}</span><span class="prop-val">${valHtml}</span></div>`);
    }
  }
  // ensure id is always in the panel (even if absent from frontmatter)
  if (!fm || !fm.byKey.has("id")) {
    rows.push(`<div class="prop-row"><span class="prop-key">${PROP_ICON.id}id</span><span class="prop-val"><code>${ulid}</code></span></div>`);
  }
  const count = rows.length;
  // open by default — mimics Notion's properties-at-top behaviour. Reader can
  // collapse with one click. State is per-page-load (native <details>; no JS).
  return `<details class="properties" open>
    <summary class="properties-summary">
      <span class="properties-summary-label">Properties</span>
      <span class="properties-summary-count">${count}</span>
    </summary>
    <div class="properties-body">${rows.join("")}</div>
  </details>`;
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
      ? `<h3 class="folder-heading" id="folder-${slug}"><span class="folder-icon"></span>${escapeHtml(folder)}<span class="folder-count">${groups.get(folder)!.length}</span></h3>`
      : `<h3 class="folder-heading" id="folder-root"><span class="folder-icon"></span>vault root<span class="folder-count">${groups.get(folder)!.length}</span></h3>`;
    const lis = groups.get(folder)!.map((r) => {
      const cls = r.md ? "" : "missing";
      return `<li class="${cls}"><a href="${shareBase}/${r.ulid}${tq}" title="${r.ulid}" data-ulid="${r.ulid}"><span class="title">${escapeHtml(r.title)}</span></a></li>`;
    });
    return `${heading}<ul class="note-list">${lis.join("")}</ul>`;
  });

  // Recently updated — top 6 notes by ULID timestamp (newest first)
  const recentRecords = [...records]
    .filter(r => r.md) // skip missing/private notes
    .sort((a, b) => b.ulid.localeCompare(a.ulid))
    .slice(0, 6);
  function ulidToDate(u: string): string {
    // Decode first 10 chars as Crockford base32 timestamp
    const alpha = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let t = 0;
    for (let i = 0; i < 10; i++) {
      const v = alpha.indexOf(u.charAt(i).toUpperCase());
      if (v < 0) return "";
      t = t * 32 + v;
    }
    const d = new Date(t);
    return d.toISOString().slice(0, 10);
  }
  function noteExcerpt(md: string): string {
    const body = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/^#[^\n]*\n/, "").trim();
    return body.replace(/[#*_`[\]>]/g, "").replace(/\s+/g, " ").slice(0, 110).trim();
  }
  function noteFolder(p: string): string {
    if (!p.includes("/")) return "vault root";
    return p.split("/").slice(0, -1).join(" / ");
  }
  function noteWordCount(md: string): number {
    const body = md.replace(/^---[\s\S]*?\n---\s*\n/, "");
    return (body.match(/\b\w+\b/g) ?? []).length;
  }
  const recentHtml = recentRecords.length > 0
    ? `<section class="recently-updated"><h2 class="recently-updated-heading">Recently updated</h2><ul class="recently-updated-list-v2">${
        recentRecords.slice(0, 4).map(r => {
          const folder = noteFolder(r.path);
          const wc = noteWordCount(r.md ?? "");
          const minutes = Math.max(1, Math.round(wc / 200));
          return `<li><a href="${shareBase}/${r.ulid}${tq}" data-ulid="${r.ulid}">
          <div class="ru-card-title">${escapeHtml(r.title)}</div>
          ${folder ? `<div class="ru-card-folder">${escapeHtml(folder)}</div>` : ""}
          <div class="ru-card-meta"><span>${ulidToDate(r.ulid)}</span><span class="ru-card-dot">·</span><span>${minutes} min</span></div>
        </a></li>`;
        }).join("")
      }</ul></section>`
    : "";

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

  const authorLine = wrap.author
    ? `<div class="wrap-hero-byline">by <span class="wrap-hero-author">${escapeHtml(wrap.author)}</span></div>`
    : "";
  const hero = `<header class="wrap-hero">
    ${authorLine}
    <h1 class="wrap-hero-title">${escapeHtml(wrap.title ?? "Untitled vault")}</h1>
    ${wrap.description ? `<p class="wrap-hero-desc">${escapeHtml(wrap.description)}</p>` : ""}
    <div class="wrap-hero-actions">
      <button class="wrap-hero-cta wrap-hero-cta-primary" type="button" data-open-palette>
        Explore vault <kbd>⌘K</kbd>
      </button>
      <a class="wrap-hero-cta wrap-hero-cta-secondary" href="${shareBase}/feed.xml${tq}" title="Subscribe via RSS/Atom for new notes">
        Follow via RSS
      </a>
    </div>
    <div class="wrap-hero-stats">
      <span class="wrap-stat"><strong>${wrap.ulids.length}</strong> notes</span>
      ${wrap.canvases?.length ? `<span class="wrap-stat-sep">·</span><span class="wrap-stat"><strong>${wrap.canvases.length}</strong> canvases</span>` : ""}
      ${wrap.assets && Object.keys(wrap.assets).length ? `<span class="wrap-stat-sep">·</span><span class="wrap-stat"><strong>${Object.keys(wrap.assets).length}</strong> assets</span>` : ""}
      ${wrap.gated ? `<span class="wrap-stat-sep">·</span><span class="gated-badge">private share</span>` : ""}
    </div>
  </header>`;

  return shell({
    title: wrap.title ?? "Shared slice",
    wide: true,
    sidebarLayout: true,
    body: `
${sidebar}

<main class="wrap-main">
  ${hero}

  ${recentHtml}

  <div class="graph-wrapper" id="graph-wrapper" data-controls="open">
    <div id="graph-host">
      <div id="graph" style="width:100%;height:100%"></div>
      <div class="graph-hint-bar">drag · scroll to zoom · click to open · hover to focus · dbl-click to reset</div>
    </div>

    <aside id="graph-controls-panel" class="graph-controls-panel" aria-label="Graph controls">
      <div class="gcp-header">
        <span>Graph</span>
        <button id="gcp-close" class="gcp-close-btn" type="button" aria-label="Close controls panel">✕</button>
      </div>

      <div class="gcp-section">
        <div class="gcp-section-title">Filters</div>
        <div class="gcp-toggle-row">
          <span class="gcp-label">Orphan nodes</span>
          <button class="gcp-toggle active" id="ctrl-orphans" role="switch" aria-checked="true" type="button"></button>
        </div>
      </div>

      <div class="gcp-section">
        <div class="gcp-section-title">Display</div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Node size</span><span class="gcp-val" id="ctrl-node-size-val">1×</span></div>
          <input type="range" id="ctrl-node-size" class="gcp-slider" min="0.3" max="3" step="0.1" value="1">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Link thickness</span><span class="gcp-val" id="ctrl-edge-val">1×</span></div>
          <input type="range" id="ctrl-edge-size" class="gcp-slider" min="0.5" max="4" step="0.5" value="1">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Label density</span></div>
          <input type="range" id="ctrl-label-density" class="gcp-slider" min="1" max="5" step="1" value="3">
        </div>
      </div>

      <div class="gcp-section">
        <div class="gcp-section-title">Forces</div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Repel</span><span class="gcp-val" id="ctrl-repel-val">260</span></div>
          <input type="range" id="ctrl-repel" class="gcp-slider" min="50" max="600" step="10" value="260">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Link distance</span><span class="gcp-val" id="ctrl-linkdist-val">80</span></div>
          <input type="range" id="ctrl-link-dist" class="gcp-slider" min="20" max="200" step="10" value="80">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Center pull</span><span class="gcp-val" id="ctrl-center-val">0.12</span></div>
          <input type="range" id="ctrl-center" class="gcp-slider" min="0.01" max="0.4" step="0.01" value="0.12">
        </div>
        <button id="ctrl-apply-forces" class="gcp-apply-btn" type="button">Apply</button>
      </div>

      <div class="gcp-section">
        <button id="graph-reset" class="gcp-reset-btn" type="button">⌖ Reset view</button>
      </div>
    </aside>

    <button id="graph-open-controls" class="graph-open-btn" type="button" aria-label="Open graph controls">Controls</button>
  </div>
</main>

${SIDEBAR_TOGGLE_JS}
${STICKINESS_JS}
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
    var gw = document.getElementById("graph-wrapper");
    if (gw) gw.style.display = "none";
    return;
  }
  var g = new graphology.Graph();
  var styles = getComputedStyle(document.body);
  var accent     = (styles.getPropertyValue("--text-accent").trim() || "#a882ff");
  var nodeColor  = (styles.getPropertyValue("--text-muted").trim()  || "#8a8a8a");
  var edgeColor  = (styles.getPropertyValue("--border").trim()      || "#363636");
  var labelColor = (styles.getPropertyValue("--text-normal").trim() || "#dcddde");
  var bgIsDark   = matchMedia("(prefers-color-scheme: dark)").matches;
  var dimColor   = bgIsDark ? "#2a2a2a" : "#dee2e6";
  var labelBg    = (styles.getPropertyValue("--bg-primary").trim() || (bgIsDark ? "#1e1e1e" : "#ffffff"));

  // Degree map — used for base node sizing
  var degree = {};
  DATA.edges.forEach(function(e){
    if (e.from === e.to) return;
    degree[e.from] = (degree[e.from] || 0) + 1;
    degree[e.to]   = (degree[e.to]   || 0) + 1;
  });

  // Base node descriptors (no positions yet — assigned by computeLayout)
  var baseNodes = DATA.nodes.map(function(n){
    var d = degree[n.id] || 0;
    return { id: n.id, label: n.label, folder: n.folder, baseSize: 3 + Math.min(d, 10) * 0.5 };
  });
  var links = DATA.edges
    .filter(function(e){ return e.from !== e.to; })
    .map(function(e){ return { source: e.from, target: e.to }; });

  // Orphan detection
  var hasEdge = {};
  DATA.edges.forEach(function(e){ if (e.from !== e.to){ hasEdge[e.from] = true; hasEdge[e.to] = true; } });
  var orphans = baseNodes.filter(function(n){ return !hasEdge[n.id]; }).map(function(n){ return n.id; });

  // ── Layout computation ────────────────────────────────────────────────────
  function computeLayout(repel, linkDist, center) {
    var sized = baseNodes.map(function(n, i){
      var theta = (i / baseNodes.length) * 2 * Math.PI;
      return { id: n.id, size: n.baseSize, x: Math.cos(theta) * 80, y: Math.sin(theta) * 80 };
    });
    if (typeof d3 !== "undefined" && d3.forceSimulation) {
      var lnkArr = links.map(function(l){ return { source: l.source, target: l.target }; });
      var sim = d3.forceSimulation(sized)
        .force("link", d3.forceLink(lnkArr).id(function(d){ return d.id; }).distance(linkDist).strength(0.2))
        .force("charge", d3.forceManyBody().strength(-Math.abs(repel)).distanceMax(700))
        .force("center", d3.forceCenter(0, 0).strength(center))
        .force("x", d3.forceX(0).strength(0.04))
        .force("y", d3.forceY(0).strength(0.04))
        .force("collide", d3.forceCollide().radius(function(d){ return d.size + 18; }).strength(0.95))
        .stop();
      var ticks = Math.max(250, Math.min(600, Math.round(140 * Math.log2(sized.length + 2))));
      for (var t = 0; t < ticks; t++) sim.tick();
    }
    var positions = sized.filter(function(d){ return isFinite(d.x) && isFinite(d.y); });
    if (positions.length > 0) {
      var meanX = 0, meanY = 0;
      positions.forEach(function(d){ meanX += d.x; meanY += d.y; });
      meanX /= positions.length; meanY /= positions.length;
      sized.forEach(function(d){ d.x -= meanX; d.y -= meanY; });
      var TARGET = 50;
      var distances = positions.map(function(d){ return Math.sqrt(d.x*d.x + d.y*d.y); }).sort(function(a,b){ return a-b; });
      var p90 = distances[Math.floor(distances.length * 0.9)] || 1;
      var scale = TARGET / Math.max(1, p90);
      sized.forEach(function(d){ d.x *= scale; d.y *= scale; });
      var MAX_R = TARGET * 1.6;
      sized.forEach(function(d){
        var r = Math.sqrt(d.x*d.x + d.y*d.y);
        if (r > MAX_R) { d.x = d.x / r * MAX_R; d.y = d.y / r * MAX_R; }
      });
    }
    return sized;
  }

  // Initial layout + graphology population
  var positioned = computeLayout(260, 80, 0.12);
  positioned.forEach(function(d){
    g.addNode(d.id, { label: baseNodes.find(function(n){ return n.id === d.id; }).label,
      x: d.x, y: d.y, size: d.size, color: nodeColor });
  });
  DATA.edges.forEach(function(e){
    if (g.hasNode(e.from) && g.hasNode(e.to) && !g.hasEdge(e.from, e.to) && e.from !== e.to)
      g.addEdge(e.from, e.to, { size: 1, color: edgeColor });
  });

  // ── Sigma renderer ───────────────────────────────────────────────────────
  function drawLabelWithBg(context, data, settings) {
    if (!data.label) return;
    var size = settings.labelSize, font = settings.labelFont, weight = settings.labelWeight;
    context.font = (weight || "400") + " " + size + "px " + font;
    var metrics = context.measureText(data.label);
    var PADX = 5, PADY = 3, RADIUS = 4;
    var textX = data.x + data.size + 4, textY = data.y + size / 3;
    context.fillStyle = labelBg;
    context.beginPath();
    var rx = textX - PADX, ry = data.y - size / 2 - PADY + 1, rw = metrics.width + PADX * 2, rh = size + PADY * 2;
    if (typeof context.roundRect === "function") context.roundRect(rx, ry, rw, rh, RADIUS);
    else context.rect(rx, ry, rw, rh);
    context.fill();
    var col = settings.labelColor && settings.labelColor.color;
    context.fillStyle = col || labelColor;
    context.fillText(data.label, textX, textY);
  }

  var n = DATA.nodes.length;
  var graphEl = document.getElementById("graph");
  var renderer = new Sigma(g, graphEl, {
    labelColor: { color: labelColor },
    labelSize: 12, labelWeight: "500",
    labelRenderer: drawLabelWithBg, hoverRenderer: drawLabelWithBg,
    labelDensity: n > 50 ? 0.1 : 0.4,
    labelGridCellSize: n > 50 ? 180 : 100,
    labelRenderedSizeThreshold: n > 50 ? 4.5 : 1,
    renderEdgeLabels: false,
    defaultEdgeColor: edgeColor,
    minCameraRatio: 0.05, maxCameraRatio: 8,
    zIndex: true, allowInvalidContainer: true,
  });

  if (typeof ResizeObserver !== "undefined" && graphEl) {
    var lastW = 0, lastH = 0;
    new ResizeObserver(function(entries){
      var r = entries[0] && entries[0].contentRect;
      if (!r || (r.width === lastW && r.height === lastH)) return;
      lastW = r.width; lastH = r.height;
      try { renderer.resize(); renderer.refresh(); } catch(e){}
    }).observe(graphEl);
  }

  // ── Camera reset ─────────────────────────────────────────────────────────
  function resetView() {
    var cam = renderer.getCamera();
    if (typeof cam.animatedReset === "function") cam.animatedReset({ duration: 400 });
    else cam.setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
  }
  var resetBtn = document.getElementById("graph-reset");
  if (resetBtn) resetBtn.addEventListener("click", resetView);
  renderer.on("doubleClickStage", function(e){
    if (e && e.preventSigmaDefault) e.preventSigmaDefault();
    resetView();
  });

  // ── Hover-focus ──────────────────────────────────────────────────────────
  var hoveredNode = null, hoveredNeighbors = null;
  renderer.setSetting("nodeReducer", function(node, data){
    var res = Object.assign({}, data);
    if (hoveredNode) {
      if (node === hoveredNode) { res.color = accent; res.size = data.size * 2; res.forceLabel = true; res.zIndex = 2; }
      else if (hoveredNeighbors[node]) { res.color = accent; res.forceLabel = true; res.zIndex = 1; }
      else { res.color = dimColor; res.label = ""; res.zIndex = 0; }
    }
    return res;
  });
  renderer.setSetting("edgeReducer", function(edge, data){
    var res = Object.assign({}, data);
    if (hoveredNode) {
      var src = g.source(edge), tgt = g.target(edge);
      if (src === hoveredNode || tgt === hoveredNode) { res.color = accent; res.size = (data.size||1)*2.5; res.zIndex = 1; }
      else { res.color = dimColor; res.zIndex = 0; }
    }
    return res;
  });
  renderer.on("enterNode", function(p){
    hoveredNode = p.node; hoveredNeighbors = { [p.node]: true };
    g.forEachNeighbor(p.node, function(nb){ hoveredNeighbors[nb] = true; });
    renderer.refresh(); document.body.style.cursor = "pointer";
  });
  renderer.on("leaveNode", function(){
    hoveredNode = null; hoveredNeighbors = null;
    renderer.refresh(); document.body.style.cursor = "";
  });
  var isTouch = matchMedia && matchMedia("(hover: none)").matches;
  var navigateTo = function(node){ window.location = "/share/" + DATA.wrapId + "/" + node + DATA.tokenQuery; };
  renderer.on("clickNode", function(p){
    if (!isTouch) { navigateTo(p.node); return; }
    if (hoveredNode === p.node) { navigateTo(p.node); return; }
    hoveredNode = p.node; hoveredNeighbors = { [p.node]: true };
    g.forEachNeighbor(p.node, function(nb){ hoveredNeighbors[nb] = true; });
    renderer.refresh();
  });
  renderer.on("clickStage", function(){
    if (!isTouch || !hoveredNode) return;
    hoveredNode = null; hoveredNeighbors = null; renderer.refresh();
  });

  // ── Graph controls panel ─────────────────────────────────────────────────
  var wrapper = document.getElementById("graph-wrapper");
  var nodeSizeMul = 1, edgeSizeMul = 1, showOrphans = true;

  // Panel open/close
  var closeBtn = document.getElementById("gcp-close");
  var openBtn  = document.getElementById("graph-open-controls");
  if (closeBtn) closeBtn.addEventListener("click", function(){ wrapper.setAttribute("data-controls","closed"); });
  if (openBtn)  openBtn.addEventListener("click",  function(){ wrapper.setAttribute("data-controls","open"); });

  // Orphan toggle
  var orphanBtn = document.getElementById("ctrl-orphans");
  if (orphanBtn) orphanBtn.addEventListener("click", function(){
    showOrphans = !showOrphans;
    orphanBtn.classList.toggle("active", showOrphans);
    orphanBtn.setAttribute("aria-checked", String(showOrphans));
    orphans.forEach(function(id){
      if (g.hasNode(id)) g.setNodeAttribute(id, "hidden", !showOrphans);
    });
    renderer.refresh();
  });

  // Node size slider
  var nodeSizeSlider = document.getElementById("ctrl-node-size");
  var nodeSizeVal    = document.getElementById("ctrl-node-size-val");
  if (nodeSizeSlider) nodeSizeSlider.addEventListener("input", function(){
    nodeSizeMul = parseFloat(this.value);
    if (nodeSizeVal) nodeSizeVal.textContent = nodeSizeMul.toFixed(1) + "x";
    g.forEachNode(function(id, attrs){
      var base = baseNodes.find(function(n){ return n.id === id; });
      if (base) g.setNodeAttribute(id, "size", base.baseSize * nodeSizeMul);
    });
    renderer.refresh();
  });

  // Edge thickness slider
  var edgeSizeSlider = document.getElementById("ctrl-edge-size");
  var edgeSizeVal    = document.getElementById("ctrl-edge-val");
  if (edgeSizeSlider) edgeSizeSlider.addEventListener("input", function(){
    edgeSizeMul = parseFloat(this.value);
    if (edgeSizeVal) edgeSizeVal.textContent = edgeSizeMul.toFixed(1) + "x";
    g.forEachEdge(function(id){ g.setEdgeAttribute(id, "size", edgeSizeMul); });
    renderer.refresh();
  });

  // Label density slider (1=sparse … 5=dense)
  var labelSlider = document.getElementById("ctrl-label-density");
  if (labelSlider) labelSlider.addEventListener("input", function(){
    var v = parseInt(this.value);
    var densityMap  = [0,0.05,0.15,0.35,0.6,1];
    var threshMap   = [0,5,   3.5, 2,   1,  0];
    var gridMap     = [0,220, 160, 120, 80, 60];
    renderer.setSetting("labelDensity",                densityMap[v]);
    renderer.setSetting("labelRenderedSizeThreshold",  threshMap[v]);
    renderer.setSetting("labelGridCellSize",           gridMap[v]);
    renderer.refresh();
  });

  // Forces re-layout
  var repelSlider   = document.getElementById("ctrl-repel");
  var repelVal      = document.getElementById("ctrl-repel-val");
  var linkDistSlider= document.getElementById("ctrl-link-dist");
  var linkDistVal   = document.getElementById("ctrl-linkdist-val");
  var centerSlider  = document.getElementById("ctrl-center");
  var centerVal     = document.getElementById("ctrl-center-val");
  function bindVal(slider, valEl) {
    if (!slider) return;
    slider.addEventListener("input", function(){ if (valEl) valEl.textContent = this.value; });
  }
  bindVal(repelSlider, repelVal);
  bindVal(linkDistSlider, linkDistVal);
  bindVal(centerSlider, centerVal);

  var applyBtn = document.getElementById("ctrl-apply-forces");
  if (applyBtn) applyBtn.addEventListener("click", function(){
    var repel    = parseFloat(repelSlider ? repelSlider.value : "260");
    var linkDist = parseFloat(linkDistSlider ? linkDistSlider.value : "80");
    var center   = parseFloat(centerSlider  ? centerSlider.value  : "0.12");
    applyBtn.textContent = "Computing...";
    applyBtn.disabled = true;
    setTimeout(function(){
      var newPos = computeLayout(repel, linkDist, center);
      newPos.forEach(function(d){
        if (g.hasNode(d.id)) {
          g.setNodeAttribute(d.id, "x", d.x);
          g.setNodeAttribute(d.id, "y", d.y);
        }
      });
      renderer.refresh();
      resetView();
      applyBtn.textContent = "Apply";
      applyBtn.disabled = false;
    }, 30);
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
    const inner = `<div class="canvas-file-name">${escapeHtml(basename)}</div>`;
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
    return `<a class="canvas-card canvas-link" href="${escapeAttr(url)}" target="_blank" rel="noopener" style="${posStyle(n)};border-color:${color}">${escapeHtml(url)}</a>`;
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
  const canvasBody = `<h1 class="canvas-title">${escapeHtml(title)}</h1>
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
  <div class="gate-icon"></div>
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

/**
 * Render a 1200×630 OpenGraph card for a note as an SVG. Slack / Discord /
 * Mastodon / iMessage render SVG previews directly. Twitter requires raster
 * (the og:image URL still resolves; their bot just won't render the preview).
 * For an MVP this trades preview-on-Twitter for an order of magnitude less
 * complexity (no PNG renderer in the Worker).
 *
 * Word-wraps the title across up to three lines. Falls back to a single line
 * if the title is short.
 */
export function renderOgCard(opts: {
  title: string;
  wrapTitle: string;
  folder?: string;
  wordCount?: number;
  gated?: boolean;
}): string {
  const W = 1200, H = 630;
  // Naive word-wrap. Hard-coded char budgets per line because SVG has no
  // line-break, and computing real text widths server-side would need a font
  // metrics table. The numbers are tuned for the 60px title font below.
  const MAX_LINES = 3, CHARS_PER_LINE = 28;
  const titleWords = opts.title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of titleWords) {
    if ((cur + " " + w).trim().length > CHARS_PER_LINE && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === MAX_LINES - 1) {
        // Pack the rest into the last line, truncating.
        const rest = titleWords.slice(titleWords.indexOf(w)).join(" ");
        lines.push(rest.length > CHARS_PER_LINE ? rest.slice(0, CHARS_PER_LINE - 1) + "…" : rest);
        cur = "";
        break;
      }
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  const titleSvg = lines.map((line, i) =>
    `<text x="80" y="${260 + i * 80}" font-size="64" font-weight="700" fill="#1f2328" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${escapeHtml(line)}</text>`
  ).join("");

  const folderLine = opts.folder
    ? `<text x="80" y="${260 + lines.length * 80 + 60}" font-size="28" fill="#57606a" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${escapeHtml(opts.folder)}</text>`
    : "";
  const wordsChip = opts.wordCount
    ? `<text x="80" y="${260 + lines.length * 80 + (opts.folder ? 110 : 60)}" font-size="22" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${opts.wordCount.toLocaleString()} words</text>`
    : "";

  const gatedBadge = opts.gated
    ? `<g transform="translate(${W - 220}, 60)">
         <rect x="0" y="0" width="160" height="44" rx="22" fill="#7f6df2" opacity="0.15"/>
         <text x="80" y="29" font-size="20" font-weight="600" fill="#5b4ad6" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">GATED</text>
       </g>`
    : "";

  // Bottom-right corner: brand mark
  const brand = `
    <g transform="translate(${W - 80}, ${H - 60})">
      <text x="0" y="0" font-size="22" font-weight="600" fill="#7f6df2" text-anchor="end" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">BrainShare</text>
    </g>`;

  // Bottom-left corner: the wrapper title (small)
  const wrap = opts.wrapTitle
    ? `<text x="80" y="${H - 60}" font-size="22" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${escapeHtml(opts.wrapTitle.slice(0, 50))}${opts.wrapTitle.length > 50 ? "…" : ""}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f5f6f8"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7f6df2"/>
      <stop offset="100%" stop-color="#a882ff"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="8" fill="url(#accent)"/>
  <text x="80" y="120" font-size="24" font-weight="500" letter-spacing="2" fill="#7f6df2" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">BRAINSHARE</text>
  ${gatedBadge}
  ${titleSvg}
  ${folderLine}
  ${wordsChip}
  ${wrap}
  ${brand}
</svg>`;
}

/** Optional OG/Twitter card metadata for shareable note URLs. */
export interface ShellMeta {
  ogImage?: string;     // absolute URL to an og.svg for this page
  ogTitle?: string;     // <meta property="og:title"> override
  ogDescription?: string;
  pageUrl?: string;     // <meta property="og:url"> + canonical
}

function shell(opts: { title: string; body: string; wide?: boolean; sidebarLayout?: boolean; meta?: ShellMeta }): string {
  // sidebarLayout puts the body directly into a flex container so the wrapper
  // landing's <aside> + <main> children lay out side-by-side. Other pages
  // (notes, canvases, gate errors) keep the centered .container layout.
  const inner = opts.sidebarLayout
    ? `<div id="main-content" class="wrap-shell">${opts.body}</div>`
    : `<main id="main-content" class="container ${opts.wide ? "wide" : ""}">${opts.body}</main>`;
  const meta = opts.meta;
  const ogTitle = escapeHtml(meta?.ogTitle ?? opts.title);
  const ogDescription = meta?.ogDescription ? `<meta property="og:description" content="${escapeAttr(meta.ogDescription)}">` : "";
  const ogUrl = meta?.pageUrl ? `<meta property="og:url" content="${escapeAttr(meta.pageUrl)}">\n<link rel="canonical" href="${escapeAttr(meta.pageUrl)}">` : "";
  const ogImage = meta?.ogImage ? `
<meta property="og:image" content="${escapeAttr(meta.ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitle}">
${meta?.ogDescription ? `<meta name="twitter:description" content="${escapeAttr(meta.ogDescription)}">` : ""}
<meta name="twitter:image" content="${escapeAttr(meta.ogImage)}">` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<meta property="og:title" content="${ogTitle}">
<meta property="og:type" content="article">
${ogDescription}
${ogUrl}
${ogImage}
<script>
/* Pre-paint theme apply — avoids flash-of-wrong-theme when the user has
   chosen "light" or "dark" via the toggle. Runs before <style> below to set
   data-theme on <html>. localStorage access is fine on the synchronous path. */
(function(){
  try {
    var m = localStorage.getItem("brainshare_theme");
    if (m === "light" || m === "dark") document.documentElement.setAttribute("data-theme", m);
  } catch (e) { /* private mode etc. */ }
})();
</script>
<style>${css}</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>
${inner}
${THEME_TOGGLE_HTML}
${THEME_TOGGLE_JS}
</body>
</html>`;
}

// Floating theme toggle — sits in the top-right of every page (landing,
// notes, canvases, error pages). Cycles auto → light → dark → auto.
// Stored in localStorage; the pre-paint script in <head> applies the saved
// choice before first paint to avoid flash-of-wrong-theme.
const THEME_TOGGLE_HTML = `<button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle theme (auto / light / dark)" title="Theme: auto">
  <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>
</button>
<script>
(function(){
  try {
    var m = localStorage.getItem("brainshare_theme");
    if (!m || m === "auto") return;
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var SUN  = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
    var MOON = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.innerHTML = m === "light" ? SUN : MOON;
    btn.setAttribute("title", "Theme: " + m + " (click to cycle)");
  } catch(e) {}
})();
</script>`;

const THEME_TOGGLE_JS = `<script>
(function(){
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  var iconEl = btn.querySelector(".theme-icon");
  var SUN = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  var MOON = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var AUTO = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>';
  function modeOf(){ try { return localStorage.getItem("brainshare_theme") || "auto"; } catch(e){ return "auto"; } }
  function apply(mode){
    var html = document.documentElement;
    if (mode === "light") html.setAttribute("data-theme", "light");
    else if (mode === "dark") html.setAttribute("data-theme", "dark");
    else html.removeAttribute("data-theme");
    btn.innerHTML = mode === "dark" ? MOON : mode === "light" ? SUN : AUTO;
    btn.setAttribute("title", "Theme: " + mode + " (click to cycle)");
  }
  apply(modeOf());
  btn.addEventListener("click", function(){
    var order = ["auto", "light", "dark"];
    var next = order[(order.indexOf(modeOf()) + 1) % order.length];
    try { localStorage.setItem("brainshare_theme", next); } catch(e){}
    apply(next);
    // Flash a tiny tooltip-like cue
    btn.dataset.flash = "1";
    setTimeout(function(){ delete btn.dataset.flash; }, 400);
  });
})();
</script>`;

// ─────────────────────────────────────────────────────────────────────────────
// HTML helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"} as Record<string,string>)[c]);
}
function escapeAttr(s: string): string { return escapeHtml(s); }
