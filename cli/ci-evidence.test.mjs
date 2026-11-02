// SPDX-License-Identifier: AGPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { verifyGitHubActionsRun, validateGitHubRepo, validateRunId } from "./ci-evidence.mjs";

const SHA = "a".repeat(40);
function handoff(dirty = false) {
  return { kind:"brainshare-handoff", version:1,
    source:{ available:true, sha:SHA, dirty } };
}
const run = (overrides = {}) => ({
  id: 123, repository:{full_name:"acme/project"},
  head_sha: SHA, status:"completed", conclusion:"success",
  workflow_id:25, run_attempt:2, ...overrides
});
function setup(payload = run(), status = 200) {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({url, init});
    return {ok:status >= 200 && status < 300,status,
      json:async()=>payload};
  };
  return {requests, fetchImpl};
}
const request = (fetchImpl, h = handoff(), extra = {}) =>
  verifyGitHubActionsRun(h, {repo:"acme/project",runId:"123",fetchImpl,...extra});

test("accepts GitHub reported success only for the exact handoff commit", async () => {
  const {requests,fetchImpl} = setup();
  const result = await request(fetchImpl, handoff(), {token:"example-private-token"});
  assert.equal(result.result, "reported_success");
  assert.equal(result.ciReportedSuccessForCommit, true);
  assert.equal(result.claimsVerified, false);
  assert.equal(result.handoffVerified, false);
  assert.equal(result.observedGitSha, SHA);
  assert.equal(result.runAttempt, 2);
  assert.equal(requests.length,1);
  assert.equal(requests[0].url,"https://api.github.com/repos/acme/project/actions/runs/123");
  assert.equal(requests[0].init.headers.Authorization,"Bearer example-private-token");
  assert.equal(requests[0].init.redirect,"error");
  assert.equal(JSON.stringify(result).includes("example-private-token"),false);
});

test("rejects wrong Git SHA even if workflow succeeded", async () => {
  const {fetchImpl} = setup(run({head_sha:"b".repeat(40)}));
  const result = await request(fetchImpl);
  assert.equal(result.result, "sha_mismatch");
  assert.equal(result.ciReportedSuccessForCommit,false);
});

test("pending and failed runs never pass", async () => {
  const pending = await request(setup(run({status:"in_progress",conclusion:null})).fetchImpl);
  const failed = await request(setup(run({conclusion:"failure"})).fetchImpl);
  assert.equal(pending.result,"pending");
  assert.equal(failed.result,"not_successful");
  assert.equal(pending.ciReportedSuccessForCommit,false);
  assert.equal(failed.ciReportedSuccessForCommit,false);
});

test("a dirty handoff remains limited to its recorded commit", async () => {
  const result = await request(setup().fetchImpl,handoff(true));
  assert.equal(result.result,"reported_success");
  assert.match(result.warning,/dirty/);
  assert.equal(result.handoffVerified,false);
});

test("rejects mismatched repository, run identity, errors and malformed responses", async () => {
  await assert.rejects(request(setup(run({repository:{full_name:"other/project"}})).fetchImpl),/identify/);
  await assert.rejects(request(setup(run({id:999})).fetchImpl),/identify/);
  await assert.rejects(request(setup(null).fetchImpl),/identify/);
  await assert.rejects(request(setup(run(),403).fetchImpl),/HTTP 403/);
});

test("blocks invalid repository/run inputs before network access", async () => {
  const {requests,fetchImpl} = setup();
  for(const repo of ["","acme","acme/../project","acme/project/other","https://github.com/acme/project","acme/..","acme/%2F"]) {
    assert.throws(()=>validateGitHubRepo(repo));
    await assert.rejects(request(fetchImpl,handoff(),{repo}),/repo/);
  }
  for(const runId of ["0","-1","1/../2","123?x=1","Infinity","9007199254740993"]) {
    assert.throws(()=>validateRunId(runId));
    await assert.rejects(request(fetchImpl,handoff(),{runId}),/run-id/);
  }
  assert.equal(requests.length,0);
});

test("requires an authentic captured Git commit shape; cannot validate arbitrary claims", async () => {
  const {requests,fetchImpl} = setup();
  await assert.rejects(request(fetchImpl,{kind:"brainshare-handoff",version:1,source:{available:false}}),/Git commit SHA/);
  await assert.rejects(request(fetchImpl,{kind:"brainshare-handoff",version:1,source:{available:true,sha:"invalid"}}),/Git commit SHA/);
  await assert.rejects(request(fetchImpl,{kind:"fake",version:1,source:{available:true,sha:SHA}}),/Git commit SHA/);
  assert.equal(requests.length,0);
});
