# BrainShare platform architecture v1

BrainShare is the open context layer for Markdown. The canonical product primitive is a **Slice**: a curated, stable, permission-aware subgraph of Markdown knowledge that can be consumed by humans and agents.

## Invariants

1. File path is not identity. Notes use stable ULIDs.
2. A Slice is more than a folder: it carries membership, relationships, entrypoint, visibility, revision and future provenance.
3. Author-side compilation does expensive work once; the Cloudflare read path stays edge-first.
4. The current Worker + `caches.default` + KV data plane remains the serving foundation.
5. D1, if introduced for managed Cloud accounts/billing/teams, is a control-plane store and does not replace KV on the hot published-content path.
6. Human and machine views resolve to the same logical Slice revision.
7. The protocol stays editor-neutral. Obsidian, VS Code, Viewer and CLI are adapters.
8. Gated authorization happens before shared Cache API lookup. Browser `?t=` credentials are exchanged for a scoped HttpOnly session cookie before rendered HTML enters `caches.default`, so shared cached representations never contain one recipient's JWT.
9. The local Viewer is Markdown-scoped: its HTTP API can read only `.md` files inside the chosen project root and its static server exposes only the bundled app shell.

## Repository direction

- `packages/protocol`: portable manifest/revision contracts.
- `packages/markdown`: Markdown/frontmatter/link semantics shared by author-side clients.
- `packages/core`: identity, Slice compilation, graph/backlinks, revision/diff logic.
- `packages/sdk`: publisher API client compatible with the existing Worker.
- `cli`: universal automation and CI surface.
- `apps/viewer`: local read-first Viewer and agent-output watcher.
- existing `plugin`, `vscode-extension`, `publisher`: retained while being migrated incrementally to shared packages.

## Viewer MVP

The Viewer is an acquisition and workflow surface, not the core moat. It opens a folder, watches Markdown changes, highlights recent agent-generated artifacts, renders files locally, follows wikilinks and relative Markdown links, and can curate selected files into a Live Slice manifest. The local HTTP bridge is bound to `127.0.0.1` and refuses non-Markdown project file reads.

## Live and Snapshot Slices

A Live Slice is a stable definition whose compiled revision changes as its selected source Markdown changes. The CLI can also emit a self-contained local Snapshot artifact that stores the compiled Slice manifest together with the exact Markdown bodies for that revision. Hosted immutable revision URLs remain a later data-plane feature.

## Future compatibility

The protocol reserves room for signed manifests, source Git commits, context-budget assembly, cross-publisher references and federated Project Brains. These are not required for v1.
