// SPDX-License-Identifier: AGPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { inspectSlicePublication } from "./preflight.mjs";
import { initProject, readJson, writeJson, preflightProjectSlice, publishProjectSlice } from "./lib.mjs";

const execFileAsync=promisify(execFile);
const initial={id:"alpha",revision:"a".repeat(24),visibility:"unlisted",files:[{path:"README.md"}]};
test("reports exact publication membership, no excluded private file contents",()=>{
  const files={"README.md":"# Public\n[[Confidential]]", "private/Confidential.md":"# SECRET_CANARY_7851\nkey: PRIVATE"};
  const report=inspectSlicePublication({slice:initial,files});
  assert.deepEqual(report.selectedPaths,["README.md"]);
  assert.equal(report.errors,1);
  assert.equal(report.findings[0].code,"excluded_reference");
  assert.equal(JSON.stringify(report).includes("SECRET_CANARY_7851"),false);
  assert.equal(JSON.stringify(report).includes("private/Confidential.md"),false);
});
test("blocks credentials, private paths and active HTML without displaying values",()=>{
  const secret="ghp_"+"a".repeat(32);
  const files={"docs/private_key.md":"password: abcdefghijklmnopqrstuvwxyz\n"+secret+"\n<iframe src='https://malicious.invalid'></iframe>"};
  const report=inspectSlicePublication({slice:{...initial,files:[{path:"docs/private_key.md"}]},files});
  assert.ok(report.errors>=3);
  assert.ok(report.findings.some(f=>f.code==="sensitive_path"));
  assert.ok(report.findings.some(f=>f.code==="github_token"));
  assert.ok(report.findings.some(f=>f.code==="active_html"));
  assert.equal(JSON.stringify(report).includes(secret),false);
  assert.equal(JSON.stringify(report).includes("abcdefghijklmnopqrstuvwxyz"),false);
});
test("blocks traversal references and configurable block rules",()=>{
  const files={"README.md":"[private](../../outside.md)\nInternal release code X-SECRET"};
  const report=inspectSlicePublication({slice:initial,files,blockText:["X-SECRET"]});
  assert.ok(report.findings.some(f=>f.code==="unsafe_reference"));
  assert.ok(report.findings.some(f=>f.code==="custom_block"));
  assert.equal(JSON.stringify(report).includes("X-SECRET"),false);
});
test("exposes warnings for missing assets and remote images, with explicit confirmation needed",()=>{
  const files={"README.md":"![picture](missing.png)\n![tracking](https://example.invalid/pixel.png)"};
  const report=inspectSlicePublication({slice:initial,files});
  assert.equal(report.errors,0);
  assert.ok(report.warnings>0);
  assert.ok(report.findings.some(f=>f.code==="unresolved_asset"));
});
test("does not include excluded files in a compiled Slice or upload when preflight fails",async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),"bs-preflight-"));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  await fs.mkdir(path.join(root,"docs","private"),{recursive:true});
  await fs.writeFile(path.join(root,"README.md"),"# Public\n[[Secret]]");
  await fs.writeFile(path.join(root,"docs","private","Secret.md"),"# SECRET_CANARY_7851");
  await initProject(root);
  const sf=path.join(root,".brainshare","slices.json");
  const data=await readJson(sf);
  data.slices.alpha={id:"alpha",title:"Alpha",include:["**/*.md"],exclude:["docs/private/**"],visibility:"gated",live:true};
  await writeJson(sf,data);
  const {report}=await preflightProjectSlice(root,"alpha");
  assert.deepEqual(report.selectedPaths,["README.md"]);
  assert.ok(report.findings.some(f=>f.code==="excluded_reference"));
  await assert.rejects(publishProjectSlice(root,"alpha",{publisher:"https://example.invalid",token:"fake",confirmPublication:true}),/preflight error/);
  const cli=new URL("./brainshare.mjs",import.meta.url).pathname;
  await assert.rejects(execFileAsync(process.execPath,[cli,"preflight","alpha"],{env:{...process.env,BRAINSHARE_ROOT:root}}),e=>{
    assert.equal(e.code,2);
    assert.equal(e.stdout.includes("SECRET_CANARY_7851"),false);
    return true;
  });
});
test("requires an explicit publish confirmation even for clean files",async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),"bs-preflight-"));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  await fs.writeFile(path.join(root,"README.md"),"# Clean");
  await initProject(root);
  const file=path.join(root,".brainshare","slices.json");
  await writeJson(file,{version:1,slices:{alpha:{id:"alpha",title:"Alpha",include:["README.md"],visibility:"unlisted",live:true}}});
  await assert.rejects(publishProjectSlice(root,"alpha",{publisher:"https://example.invalid",token:"fake"}),/explicitly confirm/);
  await assert.rejects(publishProjectSlice(root,"alpha",{publisher:"https://example.invalid",token:"fake",confirmPublication:true,expectedRevision:"stale"}),/explicitly confirm/);
});
test("skips symlinked Markdown pointing outside the project root",async t=>{
  if(process.platform==="win32")return t.skip("symlinks require elevated privileges on Windows");
  const root=await fs.mkdtemp(path.join(os.tmpdir(),"bs-preflight-"));
  const outside=await fs.mkdtemp(path.join(os.tmpdir(),"bs-outside-"));
  t.after(async()=>{await fs.rm(root,{recursive:true,force:true});await fs.rm(outside,{recursive:true,force:true})});
  await fs.writeFile(path.join(root,"README.md"),"# Safe");
  await fs.writeFile(path.join(outside,"SECRET.md"),"SECRET_CANARY_7851");
  await fs.symlink(path.join(outside,"SECRET.md"),path.join(root,"unsafe.md"));
  await initProject(root);
  const file=path.join(root,".brainshare","slices.json");
  await writeJson(file,{version:1,slices:{alpha:{id:"alpha",title:"Alpha",include:["**/*.md"],visibility:"unlisted",live:true}}});
  const {report}=await preflightProjectSlice(root,"alpha");
  assert.deepEqual(report.selectedPaths,["README.md"]);
});
