# BrainShare

> Selectively publish slices of your Obsidian second brain to private URLs. ULID-stable note IDs, JWT-gated access, scoped wrapper URLs that resolve internal wikilinks, force-directed subgraph viewer, full Obsidian-style chrome.

**Live demo:** https://brainshare-publisher.machomaheen.workers.dev/share/brainshare-kb-tour

---

## How to use BrainShare — self-hosted by design

BrainShare is **self-hosted, single-tenant**. There is no signup page, no `brainshare.app` to log into. Every user runs their own ~10-minute Cloudflare Worker. Your notes never touch shared infrastructure.

| You're trying to… | Do this |
|---|---|
| **Try it for 30 seconds** | Click the live demo link above. Read a published slice. No install. |
| **Publish your own slices** | [Deploy your own worker (10 min, free)](#quickstart-zero-to-deployed-in-10-minutes) → install the Obsidian plugin → point it at your worker URL |
| **Share with a teammate (one author)** | They open the URLs you send. They don't deploy anything. Done. |
| **Share with a team (multiple authors)** | Run one shared worker for the team; put the `PUBLISHER_TOKEN` in a shared secret manager (1Password, Vault, etc.). Each author installs the plugin pointing at the same worker. |
| **Run BrainShare for strangers as a service** | Currently unsupported — see ["Why no SaaS"](#why-no-saas) below, plus [ADR-002](https://brainshare-publisher.machomaheen.workers.dev/share/adr-002-saas-rationale) for the full graduation triggers and multi-tenant architecture sketch. |

### Why no SaaS?

Three reasons:

1. **Privacy is the pitch.** "Your private notes never touch my infrastructure" is a feature for the target user (engineers, researchers, founders with secret-sauce notes). A SaaS would dilute that.
2. **Cost.** Cloudflare's free tier covers ~100k req/day per worker. Self-hosting costs $0 for almost everyone. SaaS would force the operator to absorb everyone's bandwidth + KV ops.
3. **Operational burden.** Multi-tenant SaaS is a different product (auth, billing, abuse handling, on-call). Build that *only* when there's proven demand.

If you want a hosted version, [open an issue](https://github.com/MachoMaheen/brainshare/issues) — that's a graduation signal documented in [ADR-002](https://brainshare-publisher.machomaheen.workers.dev/share/adr-002-saas-rationale).

### You cannot share credentials across users

If you hand someone your `PUBLISHER_TOKEN`, they get full read/write/delete on **every** note in your worker, plus your KV bill. Tokens are full-permission, single-tenant. Either:

- **Deploy a worker per user** — true isolation, totally separate KV namespaces
- **Share one worker as a team** — fine when everyone in the team is trusted (same as sharing a database password)

---

## Why this exists

You keep an Obsidian vault as a "second brain" — for a codebase, a product, a company. You want to share a *slice* of it (3 notes, or a folder, or a curated subgraph) with a teammate, without exposing the whole vault and without forcing them to install Obsidian. Existing tools (Obsidian Publish, Quartz, Jotbird) publish everything, or one note at a time, and don't let multiple people's brains compose into one shared graph.

BrainShare's bet: the value of a second brain isn't the notes — it's the **curation**. So sharing should be slice-level, URL-driven, and federation-friendly. See the [philosophical anchor (Karpathy gist)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## Features

- **Per-note publishing** — every note gets a stable ULID and a `/<ulid>` public URL
- **Folder publishing** — pick one or more folders from a tree modal, all `.md` notes inside get stamped + published + bundled into a wrapper share URL in one click
- **Scoped wrapper URLs** — `/share/<wrap-id>/<ulid>` views render wikilinks as navigable internal links *only when the target is in the same share-set*; everything else stays as a "private" pill
- **Force-directed subgraph viewer** — sigma.js graph of the shared notes on the wrapper landing page; click a node to open it
- **Obsidian-style chrome** — palette match, callouts (`> [!abstract]` etc.) rendered as colored boxes with icons, properties panel, folder breadcrumb, dark mode
- **JWT-gated wrappers** — mark a wrapper `gated: true`, mint per-recipient tokens with expiry / view-limits, revoke on demand
- **Auto-stamped ULIDs** — Obsidian plugin stamps a stable ID into every note's frontmatter on creation (and bulk-stamps existing notes)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Obsidian vault  (your second brain)                │
│  ↓ plugin stamps ULIDs into frontmatter             │
│  ↓ "Publish current note" sends MD + filename       │
└─────────────────────────────────────────────────────┘
                        │  PUT /api/notes/:ulid
                        ▼
┌─────────────────────────────────────────────────────┐
│  Cloudflare Worker (publisher)                      │
│    - KV-backed                                      │
│    - HS256-JWT auth on share routes                 │
│    - renders MD → Obsidian-style HTML               │
│    - resolves wikilinks against share-set           │
│    - sigma.js subgraph data                         │
└─────────────────────────────────────────────────────┘
                        │  GET /share/:wrap?t=<jwt>
                        ▼
┌─────────────────────────────────────────────────────┐
│  Recipient's browser                                │
│  reads slice, navigates wikilinks within share-set  │
└─────────────────────────────────────────────────────┘
```

Three packages, one worker:

| Package | What | Where it runs |
|---|---|---|
| `publisher/` | Cloudflare Worker — KV storage, JWT, rendering | Cloudflare edge |
| `plugin/` | Obsidian plugin — ULID stamper + publish command | Obsidian (Electron) |
| `wrapper/` | Node CLI — `create / mint / revoke` subcommands | your terminal |

## Quickstart (zero to deployed in ~10 minutes)

> This is the path for new users. You'll end up with your own Cloudflare Worker URL and a token that only you have. Your notes go to your KV namespace, not anybody else's.

### Prerequisites

- Cloudflare account (free tier is fine — sign up at [cloudflare.com](https://cloudflare.com) if you don't have one)
- Node 20+
- An Obsidian vault you want to publish from

### 1. Clone + deploy the worker

```bash
git clone https://github.com/MachoMaheen/brainshare ~/Desktop/brainshare
cd ~/Desktop/brainshare/publisher

cp wrangler.toml.example wrangler.toml
npm install
npx wrangler login

# Create both KV namespaces and paste the IDs into wrangler.toml
npx wrangler kv namespace create NOTES                # → copy `id`
npx wrangler kv namespace create NOTES --preview      # → copy `preview_id`

# Generate two strong secrets and push them
echo $(openssl rand -hex 32) | npx wrangler secret put PUBLISHER_TOKEN
echo $(openssl rand -hex 32) | npx wrangler secret put JWT_SECRET

npx wrangler deploy
# → URL like https://brainshare-publisher.<your-subdomain>.workers.dev
```

Save the `PUBLISHER_TOKEN` value somewhere safe — you'll paste it into the plugin and the CLI. (Cloudflare can't show it to you again.)

### 2. Install the Obsidian plugin

**Option A — via [BRAT](https://github.com/TfTHacker/obsidian42-brat) (one-click, recommended):**

1. Install the **Obsidian42 — BRAT** plugin from the community store and enable it.
2. **Cmd+P → "BRAT: Add a beta plugin for testing"** → paste `MachoMaheen/brainshare`.
3. BRAT downloads the latest GitHub Release into your vault. Enable BrainShare in **Settings → Community plugins**.

**Option B — build from source:**

```bash
cd ~/Desktop/brainshare/plugin
npm install
npm run build

mkdir -p <your-vault>/.obsidian/plugins/brainshare
cp manifest.json main.js <your-vault>/.obsidian/plugins/brainshare/
```

After install (either path): **Settings → Community plugins → enable BrainShare → BrainShare settings**

- **Publisher URL**: your worker URL from step 1
- **Publisher token**: the `PUBLISHER_TOKEN` value
- **Auto-stamp ULIDs**: on

Run command **"BrainShare: Stamp ULIDs into all notes"** to retroactively stamp existing notes. New notes auto-stamp on creation.

### 3. Publish

**Single note:** open any note → **Cmd+P → "BrainShare: Publish current note"**. The note's URL is copied to your clipboard.

**Whole folder(s):** **Cmd+P → "BrainShare: Publish folder(s)…"**. A modal opens with your vault's folder tree — check the folders you want, set a wrapper title, optionally toggle `Gated`, and click Publish. Every `.md` inside the chosen folders gets ULID-stamped, pushed, and bundled into one wrapper share URL.

### 4. Bundle multiple notes into a shareable wrapper

```bash
cd ~/Desktop/brainshare/wrapper
npm install

npx tsx src/cli.ts create \
  --ulids 01HX...,01HX...,01HX... \
  --title "My share" \
  --description "Curated slice for ..." \
  --name my-share-1 \
  --publisher https://brainshare-publisher.<your-subdomain>.workers.dev \
  --token <PUBLISHER_TOKEN>
```

That prints a `https://.../share/my-share-1` URL — share it with anyone.

### 5. (Optional) Lock the wrapper behind tokens

Add `--gated` to the create command, then mint per-recipient tokens:

```bash
npx tsx src/cli.ts mint \
  --wrap my-share-1 \
  --exp-days 7 \
  --max-views 10 \
  --viewer "Alice" \
  --publisher https://brainshare-publisher.<your-subdomain>.workers.dev \
  --token <PUBLISHER_TOKEN>
```

The output `url:` line is what you DM. Each token has its own `jti` — revoke any single recipient with:

```bash
npx tsx src/cli.ts revoke \
  --wrap my-share-1 \
  --jti <jti-from-mint-output> \
  --publisher https://brainshare-publisher.<your-subdomain>.workers.dev \
  --token <PUBLISHER_TOKEN>
```

## Bulk-publish an entire vault

`scripts/bulk-publish.py` walks every `.md` in a vault, stamps a ULID if missing, PUTs to the worker, and writes a list of all published ULIDs you can feed to the wrapper CLI.

```bash
python3 scripts/bulk-publish.py \
  ~/path/to/your-vault \
  https://brainshare-publisher.<your-subdomain>.workers.dev \
  <PUBLISHER_TOKEN>
```

## Production readiness — be honest

| Area | Status |
|---|---|
| Type-checked end-to-end (TypeScript strict) | ✅ |
| JWT auth with revoke / expiry / view-limits | ✅ |
| Cloudflare-edge replicated KV | ✅ |
| Smoke-tested all routes + 33 unit tests (JWT, frontmatter, ULID) | ✅ |
| Per-IP rate limiting on auth-required write routes | ✅ — KV-based, catches sustained floods (>1 min); bursts may leak due to KV's eventual consistency. For hard ceilings use Cloudflare's paid Rate Limiting or Durable Objects. |
| Backup / export | ✅ — `GET /api/export` returns NDJSON of every KV key; `scripts/export.py` for CLI dumps |
| Multi-tenancy (shared worker, multiple authors) | ❌ — single `PUBLISHER_TOKEN` per worker; deploy your own |
| Mermaid / syntax highlighting / math | ❌ — markdown rendering is plain |
| Mobile / accessibility audit | ❌ |
| Plugin in Obsidian community store | 🟡 — submitted, awaiting review (~2-4 weeks). Install via BRAT in the meantime. |

**TL;DR — production-ready for personal/team use. Not yet a public SaaS product.** If you deploy your own worker, you control your own data and tokens; nobody else can touch them.

## How wikilinks work in scoped views

Two render modes, one renderer:

- **Standalone** (`/<ulid>`): every `[[Wikilink]]` becomes a "private" pill — opaque, hovers say "not in this published slice."
- **Scoped** (`/share/<wrap-id>/<ulid>`): for each `[[Target]]`, if `Target` matches the basename of any note in the wrapper's share-set, it becomes a navigable blue link to `/share/<wrap-id>/<other-ulid>` (carrying the access token through the URL if gated). Targets *not* in the share-set stay as private pills.

This is what makes the recipient experience feel like a real navigable subgraph instead of a doc dump.

## Roadmap

Captured in detail in the design vault (companion repo, not this one):

- **Week 4 — paused**: LLM-grounded chat on the slice. Tier 0 (server → Anthropic), Tier 1 (BYOK), Tier 1.5 (`brainshare-bridge` npm CLI that spawns `claude -p` against the visitor's own subscription), Tier 2 (Ollama direct), Tier 3 (WebLLM in-browser via WebGPU).
- **Federation (Layer 4)** — multi-author merged team graph
- **Polish** — mermaid, syntax highlighting, embedded images, mobile UX

## Contributing

PRs welcome but the codebase is opinionated and small (~1500 LOC TypeScript across three packages). Open an issue first if you want to add a tier (e.g., LLM chat, Quartz mode, federation).

## License

MIT — see [LICENSE](./LICENSE).

---

Built by [@MachoMaheen](https://github.com/MachoMaheen) as a stretch off the [agent-os](https://github.com/MachoMaheen/agent-os) work. Companion design vault — and dogfood — lives in a private Obsidian vault.
