# BrainShare for VS Code

Publish connected Markdown knowledge from VS Code to your self-hosted BrainShare publisher.

BrainShare is not a paste service. A **slice** can contain a folder or curated set of Markdown files while preserving stable note identities and the BrainShare reader experience: links, backlinks, search, graph context, access control, and agent-readable URLs.

## What this extension supports

- Publish the current Markdown file.
- Publish a folder recursively as a named BrainShare slice.
- Add the current file to an existing slice.
- Re-publish a slice without changing its stable share URL.
- Copy or open note and slice URLs.
- Create public/unlisted or JWT-gated slices.
- Mint per-recipient gated URLs and revoke them by JTI.
- Unpublish notes and delete slices.
- Optional automatic re-publish when an already-published Markdown file is saved.
- Sidecar note identities by default, so BrainShare does not modify normal repository Markdown.
- Optional `id:` frontmatter mode for interoperability with the Obsidian BrainShare plugin.

## Requirements

BrainShare is self-hosted. Deploy the Cloudflare Worker from the main repository first and keep your `PUBLISHER_TOKEN` private.

Repository and deployment guide: https://github.com/MachoMaheen/brainshare

## Configure

Run:

`BrainShare: Configure Publisher`

Enter:

1. Your Worker URL, for example `https://brainshare-publisher.<subdomain>.workers.dev`.
2. Your `PUBLISHER_TOKEN`.

The URL is stored in workspace settings. The token is stored in VS Code's SecretStorage rather than `settings.json`.

## Publish a file

Open a `.md` file and run:

`BrainShare: Publish Current Markdown File`

The stable published URL is copied to your clipboard.

You can also right-click a Markdown file in the Explorer or editor title area.

## Publish a folder as a slice

Right-click a folder and choose:

`BrainShare: Publish Folder as Slice`

BrainShare recursively finds Markdown files (excluding `.git`, `node_modules`, and `.brainshare`), publishes changed files, creates/updates the wrapper, and copies the stable slice URL.

## Stable note identities

### Sidecar mode — default

BrainShare stores local note identity and slice state in:

`.brainshare/manifest.json`

This is recommended for normal Git repositories because BrainShare does not modify README/docs files just to add an ID.

### Frontmatter mode

Set `brainshare.identityMode` to `frontmatter` to use:

```yaml
---
id: 01K...
---
```

Use this when the same Markdown is also managed by the BrainShare Obsidian plugin and you want both editors to share the exact same note identities.

## Commands

- `BrainShare: Configure Publisher`
- `BrainShare: Publish Current Markdown File`
- `BrainShare: Publish Folder as Slice`
- `BrainShare: Add Current File to Slice`
- `BrainShare: Re-publish Slice`
- `BrainShare: Copy Current Published URL`
- `BrainShare: Open Current Published URL`
- `BrainShare: Copy Slice URL`
- `BrainShare: Open Slice`
- `BrainShare: Mint Slice Access Token`
- `BrainShare: Revoke Slice Access Token`
- `BrainShare: Unpublish Current File`
- `BrainShare: Delete Slice`

## Build

```bash
cd vscode-extension
npm install
npm run check
npm run compile
npm run package
```

This creates `brainshare-vscode.vsix`.

## Publishing

### Visual Studio Marketplace

Create the `MachoMaheen` publisher (or change the `publisher` field before first public release), authenticate `vsce`, then:

```bash
npm run publish:vscode
```

### Open VSX

Create the same namespace on Open VSX and publish the same package:

```bash
OVSX_PAT=<token> npm run publish:openvsx
```

Keep the same extension identifier across both registries so VS Code, Cursor, VSCodium and other Open VSX consumers resolve the same BrainShare extension identity.

## Security

`PUBLISHER_TOKEN` gives full write/delete access to the self-hosted BrainShare Worker. Do not share it with readers. Use BrainShare's JWT-gated slice URLs for recipient access.
