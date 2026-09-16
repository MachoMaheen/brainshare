# BrainShare MCP MVP

BrainShare exposes the same local context model to agents over MCP instead of embedding a proprietary chatbot.

Run from a BrainShare project:

```bash
npm install
npm run build
BRAINSHARE_ROOT=/path/to/project node mcp/server.mjs
```

Tools:

- `list_slices`
- `get_slice`
- `get_note`
- `search_notes`
- `get_context`

The local MCP server reads `.brainshare/manifest.json` and `slices.json`, uses the same Slice compiler as the CLI, and therefore returns the same stable note identities, graph, backlinks and deterministic revision. Hosted/remote MCP can later sit over the same protocol without changing Slice semantics.
