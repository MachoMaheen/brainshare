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

The local file is written to `.brainshare/handoffs/<slice>-<time>-<id>.json` with restrictive file permissions where supported. It contains task text supplied by the author, selected Slice metadata and revision, Git SHA/branch/dirty state, and a **permanently unverified** marker for claims. It does not ingest third-party session transcripts, execute model-supplied commands, or assert tests passed. Review its contents before sharing or committing it.

The `check` command compares the latest stored handoff against the current Slice revision and Git HEAD. It returns `current`, `limited`, or `stale`. **Current means fingerprints match, not that an agent's claims are true**. When stale it exits with status 2. Non-Git projects remain usable but produce a limited result.

The local BrainShare MCP server now exposes a read-only `get_handoff` tool for a specified Slice, returning the same handoff and freshness result. It does not automatically distribute handoffs to third parties.

### Security boundaries

- `get_handoff` only reads files with validated Slice IDs under the local handoff directory; no arbitrary filesystem paths, raw tool logs or credentials are requested.
- Handoff files are **not encrypted**, and the user-provided task text could be sensitive. Git-sharing them or putting them in a published Slice is an explicit operator decision.
- Don't use `claim` for secrets or customer data. This feature cannot scan all user-authored text for secrets.
- For stronger verification, a future CI evidence integration must authenticate the run, confirm the tested SHA, and distinguish test results from agent narratives.

### Attach independently reported GitHub Actions evidence (read-only)

After creating a handoff, ask GitHub whether a **specific workflow run** completed successfully for the exact Git SHA stored in the handoff:

```bash
node cli/brainshare.mjs handoff ci-check architecture \
  --repo your-org/your-repository \
  --run-id 123456789

# For private repositories:
GITHUB_TOKEN=your-read-only-token node cli/brainshare.mjs handoff ci-check architecture \
  --repo your-org/your-repository --run-id 123456789
```

The command fetches `https://api.github.com/repos/<owner>/<repo>/actions/runs/<run-id>` and checks its repository, run ID, commit SHA, completion and conclusion. It **never** invokes a model, runs a test, installs hooks, changes GitHub state, or uploads a handoff. The GitHub token is passed only to the official GitHub API endpoint and is not written to disk or printed.

Possible results are `reported_success`, `pending`, `not_successful`, and `sha_mismatch`. Exit code **0** means GitHub reported a successful workflow for the captured Git commit and the handoff is current and clean; exit **2** means incomplete, mismatched, failed or limited/stale evidence; exit **1** means a validation/network/API error. The check does not modify the handoff.

**Important:** This is **CI evidence**, not independent proof of a completed task, production deployment, security, or the agent's statements. A passing GitHub workflow only attests to the configured checks and the exact commit it evaluated. Worktrees with uncommitted files are not covered. Pull-request CI may check a synthetic merge commit rather than the source branch commit; that mismatch intentionally fails closed. `claimsVerified` and `handoffVerified` remain false.

Avoid sending arbitrary session transcripts, secret values or customer data as task descriptions. Use scoped, read-only GitHub tokens with minimum permissions for private repositories. For public repositories, unauthenticated requests may be rate-limited.

## Pre-publish safety review

Preview the exact Markdown paths selected by a Slice before making any network request:

```bash
node cli/brainshare.mjs preflight architecture
node cli/brainshare.mjs preflight architecture --block-text "internal-only"
```

The JSON report includes the Slice revision, selected file paths, effective visibility, and location-based errors/warnings. It does **not** show matching credential values or the contents of excluded documents. Error findings block publishing. Warnings about external assets and unresolved links require manual review.

Publish only after inspecting the report:

```bash
node cli/brainshare.mjs publish architecture \
  --confirm-publication \
  --revision REVISION_FROM_PREFLIGHT \
  --publisher https://your-worker.example \
  --token YOUR_PUBLISHER_TOKEN
```

`--confirm-publication` is an explicit acknowledgment, not permission to override errors. A supplied revision must still match at publication time. Use environment variables for credentials rather than putting them in shell history where possible.

The local Viewer presents these findings and asks for confirmation before publishing. Obsidian and VS Code check selected Markdown for recognizable credentials and active embedded HTML, then request approval. The safeguards are best-effort; **review the exact documents and assets yourself**, especially frontmatter, direct Markdown links, embedded resources, and custom HTML. Do not assume unlisted URLs are confidential.

### Access model and compatibility

- Slice content is accessed via `/share/<id>/...`. Gated Slices authorize every HTML, raw, search, feed, download and asset request.
- Standalone note URLs require an explicit public standalone publish action. Ordinary Slice uploads do not grant unscoped note access.
- Standalone canvas and unscoped asset GET routes are disabled. Embedded images resolve to authorized, Slice-scoped asset routes.
- Existing direct-note, canvas, and `/asset/<key>` links from older publisher versions may no longer work when upgrading. Re-publish intentional standalone notes through the editor's explicit single-note flow and update old asset links.
- A note simultaneously shared in a gated Slice cannot be read via its standalone route, even if previously marked public.
- This is not retrospective erasure: old copies, downloaded files, crawler caches and already distributed URLs cannot be revoked by software updates.

This preflight checks Markdown text and project paths, not binary asset contents; hosted data should be reviewed and safeguarded before upload. No automated scanner guarantees that sensitive content is absent.
