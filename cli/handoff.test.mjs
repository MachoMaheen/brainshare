// SPDX-License-Identifier: AGPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHandoff, latestHandoff, checkHandoff, inspectGit, assertHandoffId } from "./handoff.mjs";

const run = promisify(execFile);
const slice = (revision = "revision-1") => ({ id: "architecture", revision, files: [{path:"README.md"}] });
async function fixture() { return await fs.mkdtemp(path.join(os.tmpdir(), "brainshare-handoff-")); }

test("creates a private, local handoff without claiming agent assertions are verified", async t => {
  const root = await fixture(); t.after(() => fs.rm(root, {recursive:true,force:true}));
  const {file, handoff} = await createHandoff(root, slice(), {
    task:"Finish authentication refactor", claims:["Agent says all tests passed"],
    nextSteps:["Run CI"], blockers:["Staging identity provider unavailable"]
  });
  assert.equal(handoff.kind, "brainshare-handoff");
  assert.equal(handoff.source.available, false);
  assert.equal(handoff.verification.status, "unverified");
  assert.equal(handoff.claims[0].verification, "unverified");
  assert.deepEqual(handoff.task.nextSteps, ["Run CI"]);
  const stored = await latestHandoff(root, "architecture");
  assert.equal(stored.file, file);
  assert.equal(stored.handoff.id, handoff.id);
  assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  assert.equal(await fs.readFile(path.join(root, ".brainshare", "handoffs", ".gitignore"), "utf8"), "*\n!.gitignore\n");
  const inspected = await checkHandoff(root, handoff, slice());
  assert.equal(inspected.freshness, "limited");
  assert.equal(inspected.claimsVerified, false);
  assert.equal(JSON.stringify(handoff).includes("/tmp/brainshare-handoff-"), false);
});

test("detects revised Slice content rather than treating old claims as current", async t => {
  const root = await fixture(); t.after(() => fs.rm(root, {recursive:true,force:true}));
  const {handoff} = await createHandoff(root, slice(), {task:"Document API"});
  const fresh = await checkHandoff(root, handoff, slice());
  assert.equal(fresh.freshness, "limited");
  const stale = await checkHandoff(root, handoff, slice("revision-2"));
  assert.equal(stale.freshness, "stale");
  assert.match(stale.reasons.join(" "), /Slice content/);
});

test("records Git HEAD, detects new commit, and never treats claims as attested", async t => {
  const root = await fixture(); t.after(() => fs.rm(root, {recursive:true,force:true}));
  await run("git", ["init", "-q"], {cwd:root});
  await run("git", ["config","user.email","test@example.invalid"], {cwd:root});
  await run("git", ["config","user.name","BrainShare Test"], {cwd:root});
  await fs.writeFile(path.join(root,"README.md"), "# Architecture\n");
  await run("git", ["add", "README.md"], {cwd:root});
  await run("git", ["commit", "-qm", "initial"], {cwd:root});
  const {handoff} = await createHandoff(root, slice(), {task:"Check auth", claims:["Tests passed"]});
  assert.equal(handoff.source.available, true);
  assert.match(handoff.source.sha, /^[0-9a-f]{40}$/);
  assert.equal(handoff.source.dirty, false);
  const fresh = await checkHandoff(root,handoff,slice());
  assert.equal(fresh.freshness,"current");
  await fs.writeFile(path.join(root,"README.md"), "# Revised\n");
  await run("git", ["add","README.md"], {cwd:root});
  await run("git", ["commit","-qm","update"], {cwd:root});
  const stale = await checkHandoff(root,handoff,slice());
  assert.equal(stale.freshness,"stale");
  assert.match(stale.reasons.join(" "), /Git HEAD changed/);
  assert.equal(stale.claimsVerified,false);
});

test("rejects traversal ids, unsafe claims and invalid statuses", async t => {
  const root=await fixture();t.after(() => fs.rm(root, {recursive:true,force:true}));
  assert.throws(() => assertHandoffId("../secrets"), /Invalid Slice id/);
  await assert.rejects(createHandoff(root, {id:"../etc",revision:"r"}, {task:"task"}), /Invalid Slice id/);
  await assert.rejects(createHandoff(root, slice(), {task:"task",status:"completed"}), /Invalid task status/);
  await assert.rejects(createHandoff(root, slice(), {task:"task",claims:["x".repeat(3000)]}), /at most/);
  await assert.rejects(latestHandoff(root, "../secrets"), /Invalid Slice id/);
});

test("refuses symlinked handoff files", async t => {
  const root=await fixture();t.after(() => fs.rm(root, {recursive:true,force:true}));
  const {file}=await createHandoff(root, slice(), {task:"task"});
  const link = path.join(path.dirname(file), "architecture-z-unsafe.json");
  await fs.symlink(file,link);
  await assert.rejects(latestHandoff(root, "architecture"), /Invalid handoff file/);
});

test("does not execute agent-authored commands or ingest session transcripts", async t => {
  const root=await fixture();t.after(() => fs.rm(root, {recursive:true,force:true}));
  const marker=path.join(root,"unexpected-execution");
  const {handoff}=await createHandoff(root,slice(),{task:"Prepare handoff",claims:["echo compromised > " + marker]});
  assert.equal(handoff.claims[0].verification,"unverified");
  await assert.rejects(fs.stat(marker), {code:"ENOENT"});
});
