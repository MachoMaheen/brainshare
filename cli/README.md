# BrainShare CLI

The CLI is the editor-neutral authoring surface for BrainShare.

```bash
npm ci
npm run build
node cli/brainshare.mjs init
node cli/brainshare.mjs slice create architecture --title "Architecture" --include "README.md,docs/**/*.md" --exclude "docs/private/**"
node cli/brainshare.mjs inspect architecture
node cli/brainshare.mjs snapshot architecture
BRAINSHARE_PUBLISHER=https://... BRAINSHARE_TOKEN=... node cli/brainshare.mjs publish architecture
node cli/brainshare.mjs view .
```

`init` creates `.brainshare/manifest.json` and `.brainshare/slices.json`. File paths are not identities: the manifest keeps stable ULIDs and reconciles a content-identical rename automatically.
