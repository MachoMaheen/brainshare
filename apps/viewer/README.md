# BrainShare Viewer MVP

A read-first local viewer for Markdown and agent-generated artifacts. It intentionally is not another Markdown editor.

Current MVP:

- opens a file or folder through `brainshare view`
- renders Markdown locally
- follows local wikilinks
- watches filesystem changes with SSE live reload
- surfaces recently changed Markdown from Codex/Claude/other tools
- supports source/rendered toggle
- lets the user select files and create a Live Slice definition in `.brainshare/slices.json`

The hosted BrainShare reader remains richer; this lightweight renderer exists to validate the local/agent-output workflow before desktop packaging. A later Tauri shell can reuse the protocol/core and UI behavior rather than redefining Slice semantics.
