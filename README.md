# BrainShare

**The open context layer for Markdown.**

BrainShare turns local Markdown into **Slices**: curated, stable, permission-aware context that humans can browse and agents can call.

> **Share the context behind the work.**  
> Lend your brain. Anyone can read it. Anything can call it.

[![License: MIT](https://img.shields.io/badge/current%20license-MIT-7f6df2.svg)](./LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/data%20plane-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Obsidian](https://img.shields.io/badge/client-Obsidian-7c3aed)](./plugin)
[![VS Code](https://img.shields.io/badge/client-VS%20Code-007acc)](./vscode-extension)

**Existing live demo →** https://brainshare-publisher.machomaheen.workers.dev/share/letter

> This branch contains the platform-foundation work. The existing Obsidian product remains compatible while BrainShare is being generalized into an editor-neutral platform.

---

## The idea

Markdown is increasingly the interchange format for human and agent work:

```text
PLAN.md
PRD.md
ARCHITECTURE.md
SECURITY.md
TEST_REPORT.md
research/*.md
notes/*.md
```

The hard part is no longer creating Markdown. The hard part is turning the right subset into context that is easy to read, safe to share, stable over time, and usable by machines.

BrainShare's canonical primitive is a **Slice**.

```text
                       Slice: "Backend Architecture"

 architecture.md ─────── auth.md
       │                    │
       ├──── database.md ───┤
       │                    │
       └──── queues.md ─────┘

 stable identities · relationships · backlinks · entrypoint
 visibility · revision · source paths · content hashes
```

A Slice is not a ZIP and not just a folder website. BrainShare understands that the Markdown files form **connected knowledge**.

The same logical Slice can be consumed through:

```text
Browser / hosted reader
Local BrainShare Viewer
CLI / CI
MCP / agent tools
Editor integrations
```

---

## What exists today

### BrainShare Publisher

The production data plane is the existing Cloudflare Worker. It stores published knowledge in KV and serves the reader at the edge.

```text
request
  ↓
Cloudflare Worker
  ↓
authorization (when gated)
  ↓
caches.default          ← rendered edge response
  ↓ miss
Workers KV edge cache   ← notes / wrapper / precomputed index
  ↓ cold miss
KV backing storage
```

The platform foundation deliberately **does not replace this hot path with D1**.

At publish time BrainShare precomputes wrapper indexes/backlinks so a cold note render does not need to fan out across every note in the Slice.

### Obsidian

The original BrainShare plugin remains a first-class client:

- select notes/folders as a curated Slice
- stable ULID identities
- scoped wikilinks
- backlinks and graph
- public/unlisted/gated sharing
- canvases and assets
- instant update/unpublish

The migration to shared platform packages is intentionally incremental so the working plugin is not destabilized.

### VS Code

The VS Code adapter supports repository-native publishing:

- publish the current Markdown file
- publish a folder as a Slice
- add a file to an existing Slice
- re-publish while preserving the stable URL
- copy/open published URLs
- gated token mint/revoke
- Activity Bar Slice view
- optional publish-on-save
- sidecar identities for normal Git repositories

The extension consumes the shared BrainShare SDK/Core instead of defining a second backend protocol.

### BrainShare CLI

The universal CLI is the escape hatch for editors, CI and agents:

```bash
brainshare init
brainshare slice create architecture --include "README.md,docs/**/*.md"
brainshare inspect architecture
brainshare snapshot architecture
brainshare publish architecture
brainshare view .
```

Publishing accepts:

```bash
BRAINSHARE_PUBLISHER=https://your-worker.example
BRAINSHARE_TOKEN=your-publisher-token
```

or the equivalent command flags.

### BrainShare Viewer

The Viewer MVP is deliberately **read-first**, not another Markdown editor.

```bash
brainshare view .
# or
brainshare view ./PLAN.md
```

Current workflow:

- open a Markdown file or folder
- render locally
- navigate wikilinks and relative Markdown links
- inspect backlinks/outgoing context
- watch filesystem changes live
- surface Markdown changed during the current agent/work session
- select those files and create a Live Slice
- publish the Slice through the same BrainShare protocol

The local bridge binds to `127.0.0.1`, only exposes the bundled Viewer shell, and restricts project reads to Markdown files inside the selected root.

A native desktop/Tauri shell is a packaging step after this workflow is validated; Slice semantics do not depend on Tauri.

### BrainShare MCP

The local MCP server exposes project knowledge without introducing another AI/chat layer:

- `list_slices`
- `get_slice`
- `get_note`
- `search_notes`
- `get_context`

BrainShare is the **context/provenance layer**. Claude, Codex, ChatGPT, Cursor or another agent can remain the reasoning interface.

---

## Universal BrainShare project format

For an ordinary repository BrainShare stores its portable state alongside the project instead of modifying every Markdown file:

```text
.brainshare/
├── manifest.json
├── slices.json
└── snapshots/
```

Example Slice definition:

```json
{
  "version": 1,
  "slices": {
    "architecture": {
      "id": "architecture",
      "title": "System Architecture",
      "include": [
        "README.md",
        "docs/**/*.md"
      ],
      "exclude": [
        "docs/private/**"
      ],
      "entrypoint": "docs/architecture.md",
      "visibility": "unlisted",
      "live": true
    }
  }
}
```

Obsidian can continue using frontmatter identities. Repository-oriented clients can use `.brainshare/manifest.json` instead.

### Identity invariant

**Path is not identity.**

A note can move from:

```text
docs/auth.md
```

to:

```text
architecture/security/authentication.md
```

while retaining its ULID and therefore its BrainShare identity.

---

## Live Slices and snapshots

A **Live Slice** is a stable definition whose revision changes as the selected source Markdown changes.

A local **snapshot** freezes the compiled manifest and exact Markdown bodies:

```bash
brainshare snapshot architecture
```

which writes a self-contained artifact under:

```text
.brainshare/snapshots/
```

Hosted immutable revision URLs are a later data-plane feature; the protocol already carries deterministic Slice revisions.

---

## Shared packages

The platform foundation separates product semantics from individual clients:

| Package | Responsibility |
|---|---|
| `packages/protocol` | portable manifest, Slice and compiled-revision contracts |
| `packages/markdown` | frontmatter, links and safe lightweight local rendering semantics |
| `packages/core` | ULIDs, hashing, graph/backlinks, Slice compilation, revisions and diffs |
| `packages/sdk` | client for the existing BrainShare Worker API |
| `cli` | universal author/automation interface |
| `apps/viewer` | local reader + agent-output watcher |
| `mcp` | local machine/agent interface |
| `plugin` | Obsidian adapter |
| `vscode-extension` | VS Code adapter |
| `publisher` | Cloudflare Worker data plane and hosted reader |

The architectural rule is:

```text
Obsidian ─┐
VS Code ──┤
Viewer ───┼── BrainShare Core / Protocol ── Publisher
CLI ──────┤
MCP ──────┘
```

not five separate implementations of identity, graph and publishing.

---

## Gated-share cache safety

Gated HTML still benefits from one shared rendered edge representation without sharing one recipient's credential.

For browser-facing gated pages:

```text
?t=<JWT>
   ↓ verify signature / slice / expiry / revocation
302 + scoped HttpOnly session cookie
   ↓ clean URL
verify authorization
   ↓
caches.default
```

The JWT is excluded from both the cache key **and rendered cached HTML**. Authorization continues to happen before Cache API lookup.

---

## Build and test the platform foundation

Requires Node 22+.

```bash
git clone https://github.com/MachoMaheen/brainshare
cd brainshare
npm install
npm test
```

The root suite builds/tests the shared protocol, Markdown, Core, SDK, CLI, Viewer and MCP packages. Existing Publisher, Obsidian plugin, wrapper and VS Code workflows are also checked in CI.

### VS Code package

```bash
cd vscode-extension
npm install
npm run check
npm run package
```

### Publisher

```bash
cd publisher
npm ci
npm test
npx tsc
```

---

## Deploy the existing self-hosted Publisher

BrainShare remains self-hostable. The current Worker uses Cloudflare KV for published content and does not require Postgres/Redis.

```bash
cd publisher
cp wrangler.toml.example wrangler.toml
npm install
npx wrangler login

npx wrangler kv namespace create NOTES
npx wrangler kv namespace create NOTES --preview

# Copy the namespace IDs into wrangler.toml, then set secrets:
echo $(openssl rand -hex 32) | npx wrangler secret put PUBLISHER_TOKEN
echo $(openssl rand -hex 32) | npx wrangler secret put JWT_SECRET

npx wrangler deploy
```

Point Obsidian, VS Code or the CLI at the resulting Worker URL.

`PUBLISHER_TOKEN` is full write/delete authority. Do not send it to readers; share public/unlisted Slice URLs or mint gated recipient access instead.

---

## Product direction

BrainShare is being built around three reinforcing loops:

1. **Read local context** — especially Markdown produced by humans and coding agents.
2. **Curate connected context into a Slice.**
3. **Share the same logical context with humans and machines.**

Future protocol-compatible directions include:

- hosted immutable Snapshot revisions
- “changed since you last read” Slice diffs
- signed/provenance manifests and source Git commits
- context-budget assembly for agents
- Managed BrainShare Cloud / Managed BYOC
- team/project brains
- cross-publisher federation

These are roadmap directions, not claims about the current release.

See:

- [`docs/ARCHITECTURE_V1.md`](./docs/ARCHITECTURE_V1.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- [`docs/LICENSE_STRATEGY.md`](./docs/LICENSE_STRATEGY.md)

---

## License and commercialization

**The repository is currently MIT licensed.** Existing MIT grants remain valid.

The approved product strategy is to evaluate a future community/commercial model (including AGPL-style network copyleft for appropriate components, permissive protocol/SDK surfaces, and a commercial/OEM license), but **this repository has not been relicensed by this platform-foundation work**.

Any license migration should happen only after copyright/contributor review and proper legal review. See [`docs/LICENSE_STRATEGY.md`](./docs/LICENSE_STRATEGY.md).

---

## Why BrainShare

Single-file Markdown publishing is useful. Folder publishing is useful. A viewer is useful. MCP is useful.

None of those alone is the moat.

BrainShare's bet is that the durable primitive is **curated context**:

> the right Markdown, with stable identity, relationships, scope, permissions and revision — readable by a person and callable by an agent.
