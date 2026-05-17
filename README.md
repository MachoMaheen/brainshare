# BrainShare

**Publish a curated slice of your Obsidian vault as a live URL — wikilinks working, knowledge graph visible — in one click.**

[![License: MIT](https://img.shields.io/badge/License-MIT-7f6df2.svg)](./LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Runs%20on-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Install via BRAT](https://img.shields.io/badge/BRAT-MachoMaheen%2Fbrainshare-5c2d91)](https://github.com/TfTHacker/obsidian42-brat)

**Live demo →** https://brainshare-publisher.machomaheen.workers.dev/share/letter
*(That page was published from an Obsidian vault using BrainShare. The page IS the demo.)*

---

## Why this exists

You keep an Obsidian vault as a second brain for a codebase, a product, a research thread. You want to share a *slice* of it — 7 notes, a folder, a curated subgraph — without exposing the whole vault, without forcing the recipient to install Obsidian, and without losing what makes the vault useful: the wikilinks, the graph, the context.

Existing tools (Obsidian Publish, Quartz, Jotbird) publish everything or one note at a time, and don't let you compose multiple people's notes into one shared graph.

BrainShare's bet: **the value of a second brain isn't the notes — it's the curation.** Sharing should be slice-level, URL-driven, and agent-readable. The page is clean HTML at a stable URL: a human can read it in a browser, and an AI agent can read it at the same URL. See the [philosophical anchor](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

---

## Features

- **One-click publish** — select notes or folders from a tree modal in Obsidian, name the slice, hit Publish. The whole slice is live on Cloudflare's edge in seconds.
- **Stable ULID note IDs** — every note gets a permanent ID stamped into its frontmatter; auto-stamped on creation or bulk-stamped for existing vaults.
- **Working wikilinks** — within a slice, `[[links]]` resolve to navigable URLs. Targets outside the slice render as "private" pills — no broken links, no leaked context.
- **Force-directed knowledge graph** — every shared slice gets an interactive Sigma.js graph of the notes and their connections. Hover to highlight, drag to explore.
- **Obsidian-style rendering** — callouts (`> [!note]`, `> [!warning]`, etc.), properties panel, folder breadcrumb, backlinks, full-text search, tags.
- **JWT-gated shares** — mark any slice `gated: true`, mint per-recipient tokens with expiry, view-count limits, and revocation. Each recipient gets their own token; revoke one without touching the others.
- **Real API** — `/api/search`, `/api/wraps`, `/api/notes/:ulid`, `/api/feed.xml`. Your slice is queryable, not just readable.
- **Instant unpublish** — one button in the plugin removes the slice from the edge immediately. Nothing persists without your intent.
- **Agent-readable** — clean server-side-rendered HTML at a stable URL, `llms.txt`, JSON-LD schemas. Same URL a human reads, an agent can cite.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Obsidian vault  (your second brain)                │
│  ↓ plugin stamps ULIDs into frontmatter             │
│  ↓ select notes → click Publish                     │
└─────────────────────────────────────────────────────┘
                        │  PUT /api/notes/:ulid
                        ▼
┌─────────────────────────────────────────────────────┐
│  Cloudflare Worker  (publisher/)                    │
│  · KV-backed, no Postgres, no Redis, no S3          │
│  · HS256-JWT auth on gated routes                   │
│  · server-side MD → Obsidian-style HTML             │
│  · resolves wikilinks against share-set             │
│  · sigma.js + d3-force graph data                   │
└─────────────────────────────────────────────────────┘
                        │  GET /share/:wrap-id
                        ▼
┌─────────────────────────────────────────────────────┐
│  Anyone with the URL                                │
│  reads the slice, navigates wikilinks within it,    │
│  or is an AI agent citing it in context             │
└─────────────────────────────────────────────────────┘
```

Three packages, one worker:

| Package | What | Where it runs |
|---|---|---|
| `publisher/` | Cloudflare Worker, KV storage, JWT, rendering | Cloudflare edge |
| `plugin/` | Obsidian plugin — ULID stamper, publish modal, slice manager | Obsidian (Electron) |
| `wrapper/` | Node CLI — `create / mint / revoke` subcommands | your terminal |

---

## Self-hosted by design

BrainShare is **self-hosted, single-tenant**. There is no `brainshare.app` to sign up for. Every user runs their own Cloudflare Worker — your notes never touch shared infrastructure. Cloudflare's free tier covers ~100k requests/day per worker, so the cost is $0 for almost everyone.

| You're trying to… | Do this |
|---|---|
| **Try it for 30 seconds** | Open the live demo link above. No install. |
| **Publish your own slices** | [Deploy your worker (10 min, free)](#quickstart) → install the Obsidian plugin → point it at your URL |
| **Share with a teammate** | They open URLs you send. They don't deploy anything. |
| **Team with multiple authors** | Run one shared worker; put `PUBLISHER_TOKEN` in a shared secret manager (1Password, Vault). Each author installs the plugin pointing at the same worker. |

> **Note on tokens:** `PUBLISHER_TOKEN` is full read/write/delete on your worker. Don't share it like a read URL — share slice URLs instead. For per-recipient access control, use JWT-gated wrappers.

---

## Quickstart

> Zero to a live URL in ~10 minutes. You'll have your own Cloudflare Worker URL and a token only you hold. Your notes go to your KV namespace.

### Prerequisites

- Cloudflare account (free tier — [cloudflare.com](https://cloudflare.com))
- Node 20+
- An Obsidian vault

### 1. Clone + deploy the worker

```bash
git clone https://github.com/MachoMaheen/brainshare ~/Desktop/brainshare
cd ~/Desktop/brainshare/publisher

cp wrangler.toml.example wrangler.toml
npm install
npx wrangler login

# Create KV namespaces and paste the IDs into wrangler.toml
npx wrangler kv namespace create NOTES          # → copy `id`
npx wrangler kv namespace create NOTES --preview # → copy `preview_id`

# Generate secrets and push them
echo $(openssl rand -hex 32) | npx wrangler secret put PUBLISHER_TOKEN
echo $(openssl rand -hex 32) | npx wrangler secret put JWT_SECRET

npx wrangler deploy
# → https://brainshare-publisher.<your-subdomain>.workers.dev
```

Save the `PUBLISHER_TOKEN` value — Cloudflare won't show it again. Paste it into the plugin settings in step 2.

### 2. Install the Obsidian plugin

**Via BRAT (recommended):**

1. Install **Obsidian42 BRAT** from the community store.
2. `Cmd+P → "BRAT: Add a beta plugin"` → paste `MachoMaheen/brainshare`.
3. Enable BrainShare in **Settings → Community plugins**.

**Build from source:**

```bash
cd ~/Desktop/brainshare/plugin
npm install && npm run build
mkdir -p <vault>/.obsidian/plugins/brainshare
cp manifest.json main.js <vault>/.obsidian/plugins/brainshare/
```

**Plugin settings** (Settings → BrainShare):
- **Publisher URL**: your worker URL from step 1
- **Publisher token**: your `PUBLISHER_TOKEN`
- **Auto-stamp ULIDs**: on

Run `Cmd+P → "BrainShare: Stamp ULIDs into all notes"` to stamp your existing vault. New notes stamp on creation.

### 3. Publish a slice

**From the plugin:**

`Cmd+P → "BrainShare: Publish slice…"` → pick folders or individual notes from the tree, name the slice, click Publish. A share URL is copied to your clipboard.

**Single note:**

`Cmd+P → "BrainShare: Publish current note"` — the note's direct URL is copied.

### 4. (Optional) JWT-gated shares via CLI

```bash
cd ~/Desktop/brainshare/wrapper && npm install

# Create a gated wrapper
npx tsx src/cli.ts create \
  --ulids 01HX... 01HX... \
  --title "Q2 architecture notes" \
  --name q2-arch \
  --gated \
  --publisher https://brainshare-publisher.<subdomain>.workers.dev \
  --token <PUBLISHER_TOKEN>

# Mint a per-recipient token (7 days, 10 views max)
npx tsx src/cli.ts mint \
  --wrap q2-arch \
  --exp-days 7 \
  --max-views 10 \
  --viewer "Alice" \
  --publisher https://brainshare-publisher.<subdomain>.workers.dev \
  --token <PUBLISHER_TOKEN>

# Revoke one recipient without affecting others
npx tsx src/cli.ts revoke \
  --wrap q2-arch \
  --jti <jti-from-mint> \
  --publisher https://brainshare-publisher.<subdomain>.workers.dev \
  --token <PUBLISHER_TOKEN>
```

---

## Bulk-publish an entire vault

`scripts/bulk-publish.py` walks every `.md` in a vault, stamps a ULID if missing, PUTs to the worker, and writes a list of all published ULIDs for use with the CLI.

```bash
python3 scripts/bulk-publish.py \
  ~/path/to/your-vault \
  https://brainshare-publisher.<subdomain>.workers.dev \
  <PUBLISHER_TOKEN>
```

---

## Calling the API directly

⚠ **Cloudflare's bot-fight protection on `*.workers.dev` will silently reject requests with default User-Agent strings** (403 with `error code: 1010`). The token is fine, the URL is fine — it's just the UA. Set a custom `User-Agent` on every scripted request.

```bash
curl -X PUT \
  "https://brainshare-publisher.<subdomain>.workers.dev/api/notes/01HXYZ..." \
  -H "Authorization: Bearer $PUBLISHER_TOKEN" \
  -H "Content-Type: text/markdown" \
  -H "X-Note-Path: My Note.md" \
  -H "User-Agent: my-uploader/1.0" \
  --data-binary @"My Note.md"
```

If you see 403 with `error code: 1010`, the User-Agent is the first thing to check — not the token, not the URL.

---

## How wikilinks work in scoped views

| View mode | Wikilink behaviour |
|---|---|
| Standalone `/<ulid>` | Every `[[Link]]` renders as a "private" pill — opaque, unclickable, hover says "not in this slice." |
| Scoped `/share/<wrap-id>/<ulid>` | Links whose target is in the same slice become navigable blue links. Links outside the slice stay as private pills. |

This is what makes the recipient experience feel like a real navigable subgraph instead of a document dump.

---

## Production readiness

| Area | Status |
|---|---|
| TypeScript strict, end-to-end | ✅ |
| JWT auth with revoke / expiry / view-limits | ✅ |
| Cloudflare edge-replicated KV | ✅ |
| 33 unit tests — JWT, frontmatter, ULID; all routes smoke-tested | ✅ |
| Per-IP rate limiting on auth-required write routes | ✅ — KV-based; catches sustained floods (>1 min). Bursts may leak due to KV eventual consistency. For hard ceilings use Cloudflare's paid Rate Limiting or Durable Objects. |
| Backup / export | ✅ — `GET /api/export` returns NDJSON of all KV keys; `scripts/export.py` for CLI dumps |
| Full-text search | ✅ — `/api/search?q=` across all published notes in a slice |
| Agent-readable (llms.txt, JSON-LD, clean HTML) | ✅ |
| Mermaid diagrams, LaTeX math, syntax highlighting | ❌ — planned |
| Mobile / full accessibility audit | ❌ — functional but not audited |
| Multi-tenancy (multiple authors, separate tokens) | ❌ — single `PUBLISHER_TOKEN` per worker; deploy one worker per team or share one token in a secret manager |
| Obsidian community store | 🟡 — PR #12449 submitted, awaiting review. Install via BRAT in the meantime. |

**TL;DR: production-ready for self-hosted use. You control your data, your token, and your Cloudflare account. Nobody else can touch them.**

---

## Roadmap

- **LLM-grounded slice chat** — Tier 0 (server → Anthropic BYOK), Tier 1 (`brainshare-bridge` CLI that routes to the visitor's own `claude -p` subscription), Tier 2 (Ollama), Tier 3 (WebLLM in-browser via WebGPU)
- **Federation** — multi-author merged team graph; one shared brain, multiple writers
- **Company brain** — private, gated, MCP-served slices for teams; AI agents authenticated to read internal knowledge
- **Polish** — Mermaid diagrams, syntax highlighting, embedded images, deeper mobile UX

---

## Contributing

PRs welcome. The codebase is intentionally small (~1500 LOC TypeScript across three packages) and opinionated. Open an issue first if you want to add a significant tier (LLM chat, federation, Quartz mode).

---

## License

MIT — see [LICENSE](./LICENSE).

---

Built by [@MachoMaheen](https://github.com/MachoMaheen). The launch announcement — itself a published BrainShare slice — is at https://brainshare-publisher.machomaheen.workers.dev/share/letter.
