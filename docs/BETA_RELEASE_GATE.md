# BrainShare beta candidate validation

This document describes the **pre-release** gate. Producing CI artifacts does not publish a marketplace extension, deploy a Worker, or establish that a hosted service is production ready.

## Build artifacts

- **Obsidian:** The main CI workflow builds and tests the plugin, then attaches `brainshare-obsidian-beta.zip` containing `brainshare/main.js` and `brainshare/manifest.json` (plus optional stylesheet).
- **VS Code:** The separate extension workflow type-checks, bundles, tests, and packages `brainshare-vscode.vsix` as a GitHub Actions artifact.
- **CLI, MCP, Viewer:** From a clean clone, run `npm ci && npm run build && npm test`. The CLI is currently launched with `node cli/brainshare.mjs`; the monorepo is not currently published as an npm package.
- **Worker:** See `publisher/RELEASE_SMOKE.md` and `docs/ASSET_PUBLICATION_SECURITY.md`. Only deploy a tested release candidate to a dedicated staging Worker before using a production namespace.

## Operator verification required before publishing a beta release

1. Verify the actual staging `workers.dev` URL over HTTP using independent anonymous and authorized sessions. Confirm gated pages, assets, search, raw Markdown, ZIP, token expiry and revocation.
2. Confirm no excluded canary appears in any public response, and compare staged Worker code to the intended release commit. Existing local-runtime tests are not sufficient evidence of remote deployment health.
3. Confirm the public demo and any older standalone `/:ulid`, `/c/:ulid` and `/asset/:key` links are compatible or documented as intentionally removed.
4. Install the downloaded Obsidian ZIP in a disposable test vault and the VS Code VSIX in a clean extension host. Confirm creation, selection, preflight, public and gated sharing, token revocation, and removal.
5. Verify no signed packages, secrets, user datasets, build credentials, or internal working notes have been included in the release attachments.
6. Create an explicit versioned release note containing the revision/SHA, supported platforms, known incompatibilities, and a conservative upgrade path.
7. Only then publish the beta binaries or marketplace entries. Marketplace publishing is a separate deliberate action and should not be automated from an unreviewed PR.

## Known constraints

- Full-volume binary metadata sanitization is not proven; a best-effort marker scanner rejects common metadata, but authors must review and strip image metadata before sharing.
- The legacy bulk publisher selects the whole vault, whereas the CLI can curate Slices; do not assume exclusions from one tool transfer to the other.
- Previously distributed files and external caches are outside BrainShare's control.
- The GitHub Actions result describes the checks run for its associated SHA, not the state of any external deployment.
