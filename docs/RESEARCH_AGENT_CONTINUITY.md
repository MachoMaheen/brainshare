# Agent continuity: research and product decision (November 2026)

## Decision

**Ship Verified Handoff v1 before attempting a shared-memory database or autonomous agent runner.** Keep BrainShare's Slice primitive as the portable context package. Treat agent histories as untrusted inputs, project code and CI as independent evidence, and user-approved decisions as separate records. Explore Hivemind as an *optional adapter* only after a reliable handoff workflow is validated.

This is a qualitative, non-representative scan of developer discussions and public product documents; it is **not** a paid-demand study.

## Developer research: repeated patterns

| Evidence | Reported problem | Caveat |
| --- | --- | --- |
| [r/ClaudeCode: handoff context exhausting](https://www.reddit.com/r/ClaudeCode/comments/1uefjj1/) | Large summaries consume context and degrade usefulness | Outcome depended partly on model context-window size |
| [r/cursor: context rot](https://www.reddit.com/r/cursor/comments/1r1veb4/) | Long sessions lose constraints; maintaining instruction files becomes work | Self-selected complaint |
| [r/cursor: Claude↔Cursor handoff](https://www.reddit.com/r/cursor/comments/1stt6i0/) | Cross-tool switching requires manually transferring task state | Author promotes their solution |
| [r/cursor: cross-tool checkpoint](https://www.reddit.com/r/cursor/comments/1rp9emv/) | Developers want repo/branch-scoped task progress | A commenter prefers fresh contexts; not everyone wants persistence |
| [r/ClaudeCode: project memory](https://www.reddit.com/r/ClaudeCode/comments/1x8aikj/) | Persistent rules reduce repeated setup | Native memory already helps, so do not clone it |
| [r/ClaudeAI: parallel agents and worktrees](https://www.reddit.com/r/ClaudeAI/comments/1qzduim/) | Agents overwrite each other's work without isolation | Worktrees solve directory isolation, not merge or credential conflicts |
| [r/ClaudeCode: worktree messages](https://www.reddit.com/r/ClaudeCode/comments/1wwh2gh/) | One human manually relays progress across agents | Small, early project |
| [r/ClaudeAI: multi-agent task ownership](https://www.reddit.com/r/ClaudeAI/comments/1uldb2g/) | Duplicate tasks and colliding edits | Also points to a simple task tracker rather than a new memory DB |
| [r/SaasDevelopers: do people pay for context](https://www.reddit.com/r/SaasDevelopers/comments/1twrye4/) | Cross-tool context lost | Explicit counterargument: Git+Markdown solve much of it and native tools will improve |
| [r/ClaudeAI: amnesia over many sessions](https://www.reddit.com/r/ClaudeAI/comments/1scdnmy/) | Repeated re-explanation and lost decisions | Founder promoting their own memory product |
| [Hacker News: stop Claude forgetting](https://news.ycombinator.com/item?id=46426624) | Debate about flat docs vs asynchronous authority/coordination | Disagreement is informative; no consensus that DB is necessary |
| [Hacker News: Agents Remember](https://news.ycombinator.com/item?id=48413877) | Git-aware freshness and evidence-aware session lifecycle | Contemporary competing idea, not validation of BrainShare revenue |
| [Hacker News: Modulus](https://news.ycombinator.com/item?id=47292101) | Cross-repository dependencies and cross-agent memory | Existing entrant |
| [Hacker News: Egregore](https://news.ycombinator.com/item?id=47806427) | Shared memory, human handoff, agent messaging | Existing open-source alternative |

Interpretation: shared memory is a useful feature but increasingly commoditized. The hard part is **which decisions are authoritative, which work is actually done, and which context is appropriate for the current task**. A reliable handoff must also be brief and request-scoped.

## Competitors / complements

- [Deep Lake Hivemind](https://deeplake.ai/hivemind): cross-agent trace capture, recall, skill extraction, workspace sharing, BYOC storage. It is broader than a transcript archive. Avoid duplicating ingestion/search before validating differentiation.
- [Beads](https://github.com/steveyegge/beads): dependency-aware, Git-backed task state. Use as a task-source adapter, not a reason to reinvent an issue tracker.
- [Repomix](https://github.com/yamadashy/repomix): packs repository context for models. BrainShare must be better through revision, scope, permissions and collaboration, not mere concatenation.
- [Agent Orchestrator](https://github.com/ComposioHQ/agent-orchestrator): execution management and worktrees. Do not build this until reliable context handoffs have demonstrated demand.
- Claude/Cursor native memory and worktrees: strong zero-extra-cost alternatives. A standalone paid subscription needs an outcome they cannot easily provide.

## Feature tiers

**Now (implemented in v1):**
- Manually authored scoped handoff based on an existing compiled Slice.
- Git SHA and working-tree state, never a proof of tests/merge/deployment.
- Unverified agent claims, explicit next steps and blockers.
- Latest handoff via local CLI and read-only MCP.
- Freshness check against current Git HEAD and Slice revision.

**Next only after test evidence:**
- Verified CI run bound to exact SHA and repository identity.
- Task-state adapters (GitHub Issues, Beads), with explicit reviewed status.
- Human approval / superseded decisions.
- Redaction and publish-safety inspector.
- Opt-in Hivemind session summary import, with provenance and workspace authorizations.

**Not yet:**
- Universal session-transcript ingestion, vector database, custom code graph.
- Arbitrary agent command execution or claims of "never stopping".
- Automatic promotion of extracted skills into org-wide rules.
- Hosted billing, inter-tenant collaboration, or long-running sandbox infrastructure.

## Safety and reliability acceptance criteria

1. Claims stay **unverified**, even when phrased as completed work.
2. Branch/commit changes and Slice content changes mark older handoffs stale.
3. No Git repository must not be represented as independently verified.
4. Symlinked handoffs and IDs with traversal characters cannot be used for arbitrary reads.
5. Generation does not run shell commands from prompts, contact Hivemind, or capture full agent traces.
6. Local files must not be auto-published; users review the data before sharing.
7. Git state records identity/freshness only. Future CI verification must independently authenticate run ID, tested SHA, outcome and timing.
8. Autonomy, if introduced, will use bounded, isolated execution with explicit stop and approval controls.

## Validation plan: real-world pilot

Run at least **12 task handoffs** across two independent developers/agents, randomized among:

- baseline: repo + built-in agent memory, ordinary notes;
- Hivemind shared memory;
- BrainShare Verified Handoff with the same permitted sources.

Track time to first correct change, replayed/rejected solutions, reviewer corrections, verified task completion, hallucinated "done" claims, prompt/context overhead and cost. Freeze branch and CI provenance for fairness. Do not ship team billing based on self-reported productivity alone.

**Success hypothesis:** for otherwise comparable tasks, the verified-handoff condition measurably reduces re-explanation and false completion claims without significantly increasing setup or context overhead. If it doesn't, keep the handoff as an open-source utility and avoid a separate paid tier.

## Positioning and distribution

Suggested line: **"BrainShare — project context that survives people, sessions, and agents."**

First audiences: freelancers handing work to clients, small engineering teams onboarding replacement developers, and developers switching coding agents. Sell managed deployment and governed team workflows, not a promise that AGPL-licensed handoff JSON or memory storage is proprietary.

A future commercial page should show one realistic end-to-end demo: agent A modifies repo, CI shows a failed check, BrainShare records that it is blocked, agent B resumes correctly and makes the missing change. Track activation and paid intent before adding advanced infrastructure.
