// SPDX-License-Identifier: AGPL-3.0-only
// Read-only GitHub Actions evidence for a BrainShare handoff.
// A passing workflow is evidence about its exact commit, NOT proof that
// an agent's claims, deployment, security, or entire task are correct.

const SHA_RE = /^[0-9a-f]{40}$/i;
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const NAME_RE = /^[A-Za-z0-9_.-]{1,100}$/;

export function validateGitHubRepo(value) {
  if (typeof value !== "string") throw new Error("--repo must be owner/repository");
  const parts = value.split("/");
  if (parts.length !== 2 || !OWNER_RE.test(parts[0]) ||
      !NAME_RE.test(parts[1]) || parts[1] === "." || parts[1] === ".." ||
      parts[1].endsWith(".") || parts[1].includes("..")) {
    throw new Error("--repo must be a valid GitHub owner/repository");
  }
  return parts.join("/");
}

export function validateRunId(value) {
  const str = String(value ?? "");
  if (!/^[1-9][0-9]*$/.test(str) ||
      !Number.isSafeInteger(Number(str))) throw new Error("--run-id must be a positive integer");
  return str;
}

export async function verifyGitHubActionsRun(handoff, {
  repo, runId, token, fetchImpl = fetch
}) {
  const normalizedRepo = validateGitHubRepo(repo);
  const normalizedRun = validateRunId(runId);
  const sha = handoff?.source?.sha;
  if (handoff?.kind !== "brainshare-handoff" || handoff?.version !== 1 ||
      handoff?.source?.available !== true || typeof sha !== "string" ||
      !SHA_RE.test(sha)) {
    throw new Error("Handoff must contain a captured Git commit SHA");
  }

  // No caller-provided URL or host: credentials are sent to GitHub only.
  const url = `https://api.github.com/repos/${normalizedRepo}/actions/runs/${normalizedRun}`;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "BrainShare-Handoff/0.2",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(url, {
    method: "GET", headers, redirect: "error",
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`GitHub Actions lookup failed (HTTP ${response.status})`);
  const run = await response.json();
  if (!run || typeof run !== "object" ||
      typeof run.repository?.full_name !== "string" ||
      run.repository.full_name.toLowerCase() !== normalizedRepo.toLowerCase() ||
      String(run.id) !== normalizedRun) {
    throw new Error("GitHub response did not identify the requested repository/run");
  }
  const matchingCommit = typeof run.head_sha === "string" &&
    run.head_sha.toLowerCase() === sha.toLowerCase();
  const completed = run.status === "completed";
  const successful = completed && run.conclusion === "success";
  const result = !matchingCommit ? "sha_mismatch" :
    !completed ? "pending" : successful ? "reported_success" : "not_successful";
  return {
    provider: "github_actions",
    repository: run.repository.full_name,
    runId: Number(normalizedRun),
    runUrl: `https://github.com/${normalizedRepo}/actions/runs/${normalizedRun}`,
    runAttempt: Number.isSafeInteger(run.run_attempt) ? run.run_attempt : null,
    workflowId: Number.isSafeInteger(run.workflow_id) ? run.workflow_id : null,
    observedGitSha: run.head_sha ?? null,
    expectedGitSha: sha,
    status: run.status ?? null,
    conclusion: run.conclusion ?? null,
    checkedAt: new Date().toISOString(),
    result,
    ciReportedSuccessForCommit: result === "reported_success",
    claimsVerified: false,
    handoffVerified: false,
    warning: handoff.source.dirty
      ? "Working tree was dirty when the handoff was created; CI covers the Git commit only"
      : "GitHub reports a workflow outcome for one commit, not correctness of the task or deployment"
  };
}
