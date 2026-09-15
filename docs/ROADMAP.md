# BrainShare execution roadmap

## Product thesis

**BrainShare is the open context layer for Markdown.** The Viewer gets users in; the Slice makes BrainShare different; managed Cloud/BYOC funds the product; human + machine representations grow the ecosystem; federation is the long-term moat.

## P0 — re-foundation (this branch)

- editor-neutral protocol v1
- portable stable identity + Slice compiler
- Markdown link/backlink graph extraction
- deterministic Slice revisions and diffs
- publisher SDK compatible with the existing Worker APIs
- universal CLI
- local Viewer MVP + agent-output watcher
- preserve Worker + Cache API + KV data plane
- document licensing migration without changing the existing MIT grant yet

## P1 — adapter convergence

- migrate VS Code network/identity logic onto shared packages
- migrate Obsidian publishing semantics onto shared packages without breaking vault compatibility
- formalize `.brainshare/manifest.json` and `slices.json` migration rules
- official Obsidian community release
- VS Code + Open VSX release

## P2 — Viewer product

- package the validated local Viewer in Tauri for Windows/macOS/Linux
- file association, folder open, OS-native recent projects
- rich GFM/mermaid/callouts/relative assets
- Agent Session view and changed-this-session grouping
- create/publish Live Slice from Viewer

## P3 — managed product

- BrainShare Cloud free + inexpensive Personal plan
- Managed BYOC provisioning for Cloudflare
- custom domains/history/analytics on paid tiers
- permanent free public links; monetize capacity/private/history rather than link expiry

## P4+ — context intelligence and teams

- immutable Snapshot Slices
- "changed since last read" and graph-aware diffs
- MCP/API over the same Slice revision
- context-budget assembly
- team Project Brains
- cross-publisher federation only after the earlier workflows prove demand

## Validation gates

Track: first-publish completion, time to first Slice, % of publishers creating 3+ note Slices, 7-day repeat publishing, Viewer→Slice conversion, returning recipients, and managed-hosting demand. If usage stays mostly single-file publishing, the differentiation thesis is not working.
