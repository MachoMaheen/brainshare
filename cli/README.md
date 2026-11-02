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


## Verified Handoff v1 (local-first)

Create a **scoped, reviewable handoff** from an existing Slice. BrainShare records the compiled Slice revision and, when available, the Git HEAD and working-tree state:

```bash
node cli/brainshare.mjs handoff create architecture \
  --task "Finish authentication refactor" \
  --status in_progress \
  --next "Run integration tests" \
  --blocker "Staging identity provider unavailable" \
  --claim "Agent says the middleware is ready"

node cli/brainshare.mjs handoff check architecture
```

Create and check accept a Slice ID from `.brainshare/slices.json`. Repeat `--next`, `--blocker`, or `--claim` for multiple entries. `--status` accepts `in_progress`, `blocked`, or `ready_for_review` (not `completed`, because completion must be independently established).

The local file is written to `.brainshare/handoffs/<slice>-<time>-<id>.json` with restrictive file permissions where supported. It contains task text supplied by the author, selected Slice metadata and revision, Git SHA/branch/dirty state, and a **permanently unverified** marker for claims. It does not ingest Claude/Cursor transcripts, execute model-supplied commands, or assert tests passed. Review its contents before sharing or committing it.

The `check` command compares the latest stored handoff against the current Slice revision and Git HEAD. It returns `current`, `limited`, or `stale`. **Current means fingerprints match, not that an agent's claims are true**. When stale it exits with status 2. Non-Git projects remain usable but produce a limited result.

The local BrainShare MCP server now exposes a read-only `get_handoff` tool for a specified Slice, returning the same handoff and freshness result. It does not automatically distribute handoffs to organization members or to Hivemind.

### Security boundaries

- `get_handoff` only reads files with validated Slice IDs under the local handoff directory; no arbitrary filesystem paths, raw tool logs or credentials are requested.
- Handoff files are **not encrypted**, and the user-provided task text could be sensitive. Git-sharing them or putting them in a published Slice is an explicit operator decision.
- Don't use `claim` for secrets or customer data. This feature cannot scan all user-authored text for secrets.
- For stronger verification, a future CI evidence integration must authenticate the run, confirm the tested SHA, and distinguish test results from agent narratives.
