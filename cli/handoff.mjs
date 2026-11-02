// SPDX-License-Identifier: AGPL-3.0-only
// Local-first, untrusted-by-default engineering handoffs.
// A Git SHA proves identity of a revision; it does NOT prove a task was completed.
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_TEXT = 2000;
const MAX_ITEMS = 30;
const STATUSES = new Set(["in_progress", "blocked", "ready_for_review"]);

export function assertHandoffId(id) {
  if (typeof id !== "string" || !ID_RE.test(id)) throw new Error("Invalid Slice id for handoff");
  return id;
}

function inputText(value, label, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new Error(label + " is required");
    return "";
  }
  if (typeof value !== "string" || value.length > MAX_TEXT) throw new Error(label + " must be a string of at most " + MAX_TEXT + " characters");
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(label + " is required");
  return trimmed;
}

function inputList(value, label) {
  if (value === undefined) return [];
  const list = Array.isArray(value) ? value : [value];
  if (list.length > MAX_ITEMS) throw new Error(label + " has too many items");
  return list.map((v) => inputText(v, label, true));
}

async function git(root, args) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root, timeout: 5000, maxBuffer: 1024 * 1024, windowsHide: true
  });
  return stdout.trim();
}

export async function inspectGit(root) {
  try {
    const gitRoot = await git(root, ["rev-parse", "--show-toplevel"]);
    const sha = await git(root, ["rev-parse", "HEAD"]);
    const branch = await git(root, ["branch", "--show-current"]);
    // Ignore generated handoff files; don't leak paths from status output.
    const { stdout } = await execFileAsync("git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=normal", "--", ".", ":(exclude).brainshare/handoffs/**"],
      { cwd: root, timeout: 5000, maxBuffer: 1024 * 1024, windowsHide: true });
    const changedCount = stdout.split("\0").filter(Boolean).length;
    return {
      available: true, sha, branch: branch || null,
      projectPath: path.relative(gitRoot, root).replaceAll("\\", "/") || ".",
      dirty: changedCount > 0, changedCount
    };
  } catch {
    return { available: false, reason: "Git revision unavailable" };
  }
}

function directory(root) { return path.join(root, ".brainshare", "handoffs"); }

export async function createHandoff(root, slice, options) {
  assertHandoffId(slice?.id);
  if (typeof slice.revision !== "string" || !slice.revision) throw new Error("Compiled Slice revision required");
  const task = inputText(options.task, "task", true);
  const status = options.status || "in_progress";
  if (!STATUSES.has(status)) throw new Error("Invalid task status");
  const nextSteps = inputList(options.nextSteps, "next steps");
  const blockers = inputList(options.blockers, "blockers");
  const claims = inputList(options.claims, "claims");
  const source = await inspectGit(root);
  const handoff = {
    kind: "brainshare-handoff", version: 1,
    id: randomUUID(), createdAt: new Date().toISOString(),
    task: { title: task, status, nextSteps, blockers },
    slice: { id: slice.id, revision: slice.revision, fileCount: slice.files?.length || 0 },
    source,
    // Claims are statements, not verified facts. No model can self-certify them.
    claims: claims.map(statement => ({ statement, verification: "unverified" })),
    verification: { status: "unverified", explanation: "No CI or independently attested test evidence was collected" }
  };
  const dir = directory(root);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  if (!(await fs.lstat(dir)).isDirectory()) throw new Error("Handoff directory must not be a symlink");
  const filename = slice.id + "-" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + handoff.id.slice(0, 8) + ".json";
  const file = path.join(dir, filename);
  await fs.writeFile(file, JSON.stringify(handoff, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  return { file, handoff };
}

export async function latestHandoff(root, sliceId) {
  assertHandoffId(sliceId);
  const dir = directory(root);
  const stat = await fs.lstat(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Handoff directory is not a regular directory");
  const entries = (await fs.readdir(dir)).filter(name =>
    name.startsWith(sliceId + "-") && /^[-A-Za-z0-9_]+\.json$/.test(name)).sort();
  if (!entries.length) throw new Error("No handoff found for Slice: " + sliceId);
  const file = path.join(dir, entries.at(-1));
  const fileStat = await fs.lstat(file);
  if (!fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.size > 256_000) throw new Error("Invalid handoff file");
  const value = JSON.parse(await fs.readFile(file, "utf8"));
  if (value.kind !== "brainshare-handoff" || value.version !== 1 || value.slice?.id !== sliceId) throw new Error("Unsupported handoff file");
  return { file, handoff: value };
}

export async function checkHandoff(root, handoff, slice) {
  if (handoff.kind !== "brainshare-handoff" || handoff.version !== 1 || handoff.slice?.id !== slice?.id) {
    throw new Error("Handoff does not match the requested Slice");
  }
  const current = await inspectGit(root);
  const reasons = [];
  if (handoff.slice.revision !== slice.revision) reasons.push("Slice content/revision changed");
  if (handoff.source?.available && current.available && handoff.source.sha !== current.sha) {
    reasons.push("Git HEAD changed");
  }
  const warnings = [];
  if (!handoff.source?.available || !current.available) warnings.push("Git revision could not be verified");
  if (handoff.source?.dirty || current.dirty) warnings.push("Working tree has or had uncommitted changes");
  // "current" means only that captured revision fingerprints still match.
  return {
    freshness: reasons.length ? "stale" : warnings.length ? "limited" : "current",
    reasons, warnings, currentGit: current,
    claimsVerified: false,
    note: "Revision freshness is not evidence that agent claims or tests are correct"
  };
}
