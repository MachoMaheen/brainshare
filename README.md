# BrainShare

> Selectively publish slices of your Obsidian second brain to private URLs. ULID-stable note IDs, JWT-gated access, scoped wrapper URLs that resolve internal wikilinks, force-directed subgraph viewer, full Obsidian-style chrome.

**Live demo:** https://brainshare-publisher.machomaheen.workers.dev/share/brainshare-kb-tour

---

## Why this exists

You keep an Obsidian vault as a "second brain" — for a codebase, a product, a company. You want to share a *slice* of it (3 notes, or a folder, or a curated subgraph) with a teammate, without exposing the whole vault and without forcing them to install Obsidian. Existing tools (Obsidian Publish, Quartz, Jotbird) publish everything, or one note at a time, and don't let multiple people's brains compose into one shared graph.

BrainShare's bet: the value of a second brain isn't the notes — it's the **curation**. So sharing should be slice-level, URL-driven, and federation-friendly. See the [philosophical anchor (Karpathy gist)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## Features

- **Per-note publishing** — every note gets a stable ULID and a `/<ulid>` public URL
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

### Prerequisites

- Cloudflare account (free tier is fine)
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

### 2. Build + install the Obsidian plugin

```bash
cd ~/Desktop/brainshare/plugin
npm install
npm run build

mkdir -p <your-vault>/.obsidian/plugins/brainshare
cp manifest.json main.js <your-vault>/.obsidian/plugins/brainshare/
```

In Obsidian: **Settings → Community plugins → enable BrainShare → BrainShare settings**

- **Publisher URL**: your worker URL from step 1
- **Publisher token**: the `PUBLISHER_TOKEN` value
- **Auto-stamp ULIDs**: on

Run command **"BrainShare: Stamp ULIDs into all notes"** to retroactively stamp existing notes. New notes auto-stamp on creation.

### 3. Publish a note

Open any note → **Cmd+P → "BrainShare: Publish current note"**. The note's URL is copied to your clipboard. Open it in a browser.

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
| Smoke-tested all routes | ✅ |
| Multi-tenancy (shared worker, multiple authors) | ❌ — single `PUBLISHER_TOKEN` per worker; deploy your own |
| Rate limiting | ❌ — add a Cloudflare WAF rule before going public |
| Backups / export | ❌ — KV deletion is forever; write your own dump script |
| Tests beyond smoke | ❌ |
| Mermaid / syntax highlighting / math | ❌ — markdown rendering is plain |
| Mobile / accessibility audit | ❌ |
| Plugin in Obsidian community store | ❌ — install via BRAT or copy the build manually |

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
