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

## Repository direction

- `packages/protocol`: portable manifest/revision contracts.
- `packages/markdown`: Markdown/frontmatter/link semantics shared by author-side clients.
- `packages/core`: identity, Slice compilation, graph/backlinks, revision/diff logic.
- `packages/sdk`: publisher API client compatible with the existing Worker.
- `cli`: universal automation and CI surface.
- `apps/viewer`: local read-first Viewer and agent-output watcher.
- existing `plugin`, `vscode-extension`, `publisher`: retained while being migrated incrementally to shared packages.

## Viewer MVP

The Viewer is an acquisition and workflow surface, not the core moat. It opens a folder, watches Markdown changes, highlights recent agent-generated artifacts, renders files locally, follows wikilinks, and can curate selected files into a Live Slice manifest.

## Future compatibility

The protocol reserves room for immutable Snapshot Slices, signed manifests, source Git commits, context-budget assembly, cross-publisher references and federated Project Brains. These are not required for v1.
