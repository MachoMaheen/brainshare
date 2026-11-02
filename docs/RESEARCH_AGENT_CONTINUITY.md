# BrainShare agent-continuity research and launch decision
Updated: 2026-11-02

## Product decision

**Positioning:** BrainShare helps teams share *the trustworthy state of a project*, not merely accumulated chat history.

**Wedge:** local, scoped, portable Verified Handoff tied to a BrainShare Slice and Git revision, readable by humans and agent clients. The current v1 is deliberately a *freshness-checked handoff*, not an independently verified CI result. Do not market this version as guaranteeing completion or proof.

**What not to copy:** cross-agent transcript ingestion, auto-generated summaries, skill mining and org-wide memory already exist in Deep Lake Hivemind, and native assistants provide memory and automated handoffs. Build adapters after demonstrating value.

## Evidence audit (verified public links, November 2026)

Evidence below is qualitative and self-selected. It establishes pain points and competition, **not market size or willingness to pay**.

| Source | Observed problem or counterevidence | Decision |
| --- | --- | --- |
| [r/cursor: 2-4 minutes re-learning project context](https://www.reddit.com/r/cursor/comments/1t5l5gs/) | Claude, Codex and Cursor repeat context discovery; `CLAUDE.md` doesn't capture evolving tasks | Add project-state and scoped handoff |
| [r/ContextEngineering: open-source cross-tool memory files](https://www.reddit.com/r/ContextEngineering/comments/1rdzwbk/) | A Git-based memory bank addresses much of the problem | Must beat plain Markdown on correctness and portability |
| [r/ClaudeCode: session handoff grows to 150k tokens](https://www.reddit.com/r/ClaudeCode/comments/1x7j9zb/) | Handoff bloat makes resumption worse; commenters recommend separating durable state and task delta | Keep handoff bounded, link to full Slice instead of copying all content |
| [r/claudeskills: low-overhead automatic handoff](https://www.reddit.com/r/claudeskills/comments/1x6zeja/) | Competing hook captures changes after every reply, supports restart | Don't compete only on generation frequency |
| [r/ClaudeCode: native auto-handoff](https://www.reddit.com/r/ClaudeCode/comments/1x776ms/) | Built-in handoffs reduce basic continuity friction | Avoid selling session summary alone |
| [r/ClaudeCode: fresh vs long sessions](https://www.reddit.com/r/ClaudeCode/comments/1wvpffv/) | Not everyone needs forced handoff; some prefer one ongoing context | Handoff should be opt-in |
| [r/ClaudeAI: git worktree isolation](https://www.reddit.com/r/ClaudeAI/comments/1qzduim/) | Separate working copies avoid direct file overwrites | Git worktrees useful, not sufficient |
| [r/AI_Agents: parallel coding hidden failures](https://www.reddit.com/r/AI_Agents/comments/1v53mns/) | Shared databases/ports and unrecognized agent loops remain after worktrees | Isolation and bounded retries belong to a later runner |
| [r/ClaudeCode: test environment beyond worktrees](https://www.reddit.com/r/ClaudeCode/comments/1wyc4g4/) | QA may test the wrong API or DB despite separate worktrees | Bind evidence to actual environment, branch and SHA |
| [r/ClaudeAI: agent ownership/approval patterns](https://www.reddit.com/r/ClaudeAI/comments/1xcvu46/) | Constrained file ownership and centralized merges matter | Avoid unconstrained auto-merging |
| [r/AI_Agents: cross-user memory](https://www.reddit.com/r/AI_Agents/comments/1w0oknd/) | Shared recollections are not the same as branchable task/decision state | Scope/project/owner required |
| [r/AI_Agents: memory-poisoning experiment](https://www.reddit.com/r/AI_Agents/comments/1wtbtna/) | Later false memories may overwrite approved facts | Never auto-promote untrusted claims |
| [r/ClaudeAI: project memory as business](https://www.reddit.com/r/ClaudeAI/comments/1scdnmy/) | Developer reports lost context and a task-backed MCP workflow | Self-promotional post; treat cautiously |
| [HN: maximizing Claude Code sessions](https://news.ycombinator.com/item?id=49300800) | Portable handoffs already popular and debated | Differentiate through independent evidence |
| [HN: cross-harness agent memory](https://news.ycombinator.com/item?id=50182883) | Open-source entrants with normalization and human-approved skill mining already exist | Avoid redundant connectors/knowledge graph |
| [Anthropic: native memory and `CLAUDE.md`](https://support.claude.com/en/articles/14554922-claude-code-user-faq) | First-party memory and resume features set a high baseline | Benchmark against native tooling |
| [Anthropic: agent auto-mode safeguards](https://www.anthropic.com/research/claude-code-auto-mode) | Delegation checks, action gating and retry limits matter | No autonomous execution in the context engine |

## Competitive map / integration decisions

- [Deep Lake Hivemind](https://deeplake.ai/hivemind), [open-source code](https://github.com/activeloopai/hivemind), [architecture](https://github.com/activeloopai/hivemind/blob/main/docs/ARCHITECTURE.md): captures multiple assistant traces; workspace recall, summaries, skills, and BYOC. Integrate *read-only and opt-in* later; do not require it for BrainShare.
- [Beads](https://github.com/steveyegge/beads): durable task state for agents. Potential external task-status input.
- [Repomix](https://github.com/yamadashy/repomix): code-context bundling. BrainShare must preserve identity, scope, access and revisions beyond a text pack.
- Native agent handoff / memory: default baseline; compete on independent project-level evidence and multi-person governance rather than memory persistence.

## What is implemented in Verified Handoff v1

- Creates JSON handoff from a compiled Slice plus Git SHA, branch, dirty status, task title, blockers, next steps and explicitly unverified claims.
- Bounded fields, validated Slice IDs, local-only storage, symlink guards, file permissions, default Git ignore file.
- CLI `handoff create` / `handoff check`; read-only MCP `get_handoff`.
- Handoff changes from `current` to `stale` on Slice revision or Git HEAD changes. `limited` means untracked/dirty Git context.
- **Does not verify CI results**, ingest transcripts, run agent-authored commands, upload organizational memories, guarantee secrecy or operate autonomous agents.

## Trust hierarchy for future versions

1. **Claim:** raw statement from human, session, issue, model, or memory store; default is unverified.
2. **Observed code state:** repository, branch, commit, and working-tree fingerprint; shows what code was present, not whether correct.
3. **Independent evidence:** authenticated CI run bound to specific commit and job environment; still scope-limited.
4. **Approval:** human or explicit policy approval for production/security decisions.
5. **Supersession:** keep history and reasons when facts change; never silently overwrite a verified decision because a newer memory says otherwise.

A CI result only attests that the relevant job ran and reported its outcome. It does not prove deployment, security, or production correctness. Store exact repository identity, commit, workflow, run ID, timestamps, actor and result when building CI integration.

## Market-entry roadmap

### P0 — foundation and instrumented workflow
- Consolidate foundation PR with AGPL license and tests; keep existing Obsidian publisher working.
- Ship CLI and MCP handoffs and a sample project.
- Add privacy and publication preview before sharing handoff contents.
- Measure setup completion and whether people can independently resume an interrupted task.

### P1 — verifiable handoff
- GitHub Actions adapter to attest tests for an exact SHA.
- Human approval for key project decisions and statuses.
- Cross-platform handoff views and token-efficient task delta.
- Optional adapters for GitHub Issues/Beads and Hivemind (with consent and permissions).

### P2 — monetization only if P1 works
- Self-hosted AGPL remains free.
- Personal BYOC: managed setup and upgrades, no central raw session capture requirement.
- Teams: reviews, role-based access, project governance, audit and opt-in hosted infrastructure.
- Avoid pricing claims without interviews, paid pilot and actual cost measurements.

### Not now
- Another vector memory store; unlimited automatic transcript collection; autonomous shell executor; browser-based IDE; enterprise federation; blanket lifetime promises.

## Evaluation and kill criteria

Pilot across at least **12 non-sensitive engineering handoffs** with multiple developers and at least two different agents. Compare:
1. Native assistant memory and existing docs (baseline);
2. Hivemind-assisted shared memory;
3. Verified BrainShare handoff with equivalent authorized inputs.

Predefine task completion criteria. Rotate order, freeze reference commits where practical, and have an independent reviewer mark correctness. Measure:
- time to first correct code change and verified task completion;
- false completion claims, repeated work, missed constraints;
- onboarding time and extra context tokens;
- cost per accepted change, and any unauthorized cross-project retrieval.

Never use the user's production secrets or customer data for the pilot. If BrainShare does not improve correctness, resumption or time without high setup overhead, keep this feature free and revise the product thesis before building billing.

## Specific edge cases

- Old Git SHA / changed Slice: stale; do not assert completion.
- Dirty worktree / no Git: limited; warn about state.
- Duplicate handoff events: unique IDs and immutability; future idempotency keys.
- Agent prompt injection in notes: parsed as data, never executed or converted to policy.
- Bad memories: cannot overwrite approved statements without evidence and approval.
- Workspace/tenant leakage: authorization at query and storage boundary, not just prompt instructions.
- Symlinks and path traversal: deny arbitrary reads; do not expose raw filesystem paths in public APIs.
- Offboarding: revoke access to all future reads; identify copies already downloaded separately.
- Data deletion: specify cleanup for raw records, derivatives, caches and backups.
- Parallel runtime changes: worktrees alone don't isolate databases, ports or queues.
- Repeated attempts: bounded retries and explicit human escalation.
- Lost agent/CI network: fail closed on verification; preserve the handoff as unverified.
- Third-party provider outage and billing caps: don't block the core local experience.
- AGPL: existing MIT release rights survive; project-owned code now AGPL-3.0-only; third-party dependencies keep their licenses.

## November 2 follow-up: additional forum and competitor validation

These are individual self-selected reports, not population-level demand. Posts created to promote a competing product are directional evidence only.

| Public report | Specific failure mode | Product implication |
| --- | --- | --- |
| [r/ClaudeCode: 150k-token handoffs](https://www.reddit.com/r/ClaudeCode/comments/1x7j9zb/) | Full-history handoffs consume the next session's available context | Bound task-state records; reference source material rather than duplicate it |
| [r/claudeskills: stop-hook automatic handoff](https://www.reddit.com/r/claudeskills/comments/1x6zeja/) | A competing project reconstructs handoffs automatically without extra model calls | Automation alone is not a defensible paid feature |
| [r/cursor: Cursor-to-Claude handoff](https://www.reddit.com/r/cursor/comments/1v93dmi/) | Dirty Git tree, missing decisions, stale chat summaries | Capture branch/commit/dirty status; warn if current state differs |
| [r/cursor: dirty-worktree handoffs](https://www.reddit.com/r/cursor/comments/1v8d9ha/) | Next agent must distinguish durable docs, current code state and chat | Keep separate claim, Git, evidence and approval layers |
| [r/cursor: handoff relay tool](https://www.reddit.com/r/cursor/comments/1stt6i0/) | Custom relay packages project, latest commit and next steps | Basic multi-tool relay has competition; validate evidence differentiation |
| [r/ClaudeCode: CI/worktree test environment](https://www.reddit.com/r/ClaudeCode/comments/1wyc4g4/) | Worktrees do not isolate service instances, databases or queues | CI evidence must name the actual tested SHA; runtime isolation is a separate product |
| [r/ClaudeCode: worktrees and serialized merging](https://www.reddit.com/r/ClaudeCode/comments/1uvysm6/) | Worktrees help avoid file interference; merge/testing still require coordination | Do not claim worktree equals safe autonomous execution |
| [r/ExperiencedDevs: comprehension trap](https://www.reddit.com/r/ExperiencedDevs/comments/1ux5lcn/) | Agent-created code can reduce developer architectural understanding | Preserve the why and evidence, not only agent-generated prose |
| [r/LocalLLaMA: memory vs retrieval quality](https://www.reddit.com/r/LocalLLaMA/comments/1r21ojm/) | Fuzzy retrieval and unfiltered chat dumps can worsen correctness | Keep provenance, exact identifiers and scoped retrieval |
| [r/LocalLLaMA: measuring memory benchmarks](https://www.reddit.com/r/LocalLLaMA/comments/1u21vgq/) | Task success alone cannot prove memory helped | Compare agents with and without controlled, equivalent inputs |
| [r/ClaudeCode: token-baseline overload](https://www.reddit.com/r/ClaudeCode/comments/1xghkdy/) | Baseline tools/skills/memory can consume large context | Keep handoff short and on-demand, not auto-injected wholesale |
| [r/LocalLLaMA: babysitting agents](https://www.reddit.com/r/LocalLLaMA/comments/1u6mmuu/) | Unattended coding loops may change inappropriate code | Separate evidence and task approval from execution |
| [Hacker News: coding-agent memory discussions](https://news.ycombinator.com/item?id=50182883) | Multi-harness memory adapters already exist | Don't recreate Hivemind |

**Primary sources:**
- [Deep Lake Hivemind README](https://github.com/activeloopai/hivemind/blob/main/README.md): cross-agent traces, summaries, skillify, code graphs, team rules, BYOC; not a full task-verification framework.
- [Cursor Memories](https://docs.cursor.com/en/context/memories): project memory already present, sometimes requires user approval.
- [Anthropic Claude Code memory guide](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips): native auto-memory and project instructions; standalone session recap is a commodity.
- [GitHub Actions REST API](https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run): retrieve run identity, SHA, conclusion with scoped Actions-read access for private repositories.

## Research-driven shipping decision

Release a read-only `handoff ci-check` command in the local CLI before attempting a hosted verification service. It checks the selected GitHub Actions run against the handoff's exact recorded commit. It never promotes an agent claim to a verified fact, never executes agent-authored instructions and never claims that CI pass proves deployment or security. A dirty worktree, changed commit or synthetic PR-merge SHA must not yield a fully current actionable handoff.

The next step after technical validation is a **paired pilot** using no fewer than 12 non-sensitive interrupted tasks across at least two agents and multiple developers, comparing native memory/docs, Hivemind (where consented) and BrainShare handoffs. Track: correct first action, successful acceptance criteria, false completion claims, time-to-resume, context tokens, operator setup time and any data oversharing.

**Stop/adjust rule:** If equivalent tasks are not completed more reliably, or if operator time outweighs saved time, do not put the workflow behind a subscription. Interview the participants to learn whether source verification, handoff UX or retrieval was actually useful.

Do not automatically upload Hivemind summaries or Claude session transcripts: they may contain proprietary source, credentials, customer data, or adversarial text. Any future integration must be opt-in, read-only by default, project-scoped, redacted and independently permission-checked.
