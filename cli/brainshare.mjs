#!/usr/bin/env node
import path from "node:path"; import { spawn } from "node:child_process"; import { fileURLToPath } from "node:url"; import { initProject, readJson, writeJson, compileProjectSlice, publishProjectSlice } from "./lib.mjs";
import { createHandoff, latestHandoff, checkHandoff } from "./handoff.mjs";
import { verifyGitHubActionsRun } from "./ci-evidence.mjs";
const argv=process.argv.slice(2),cmd=argv.shift(),cwd=path.resolve(process.env.BRAINSHARE_ROOT||process.cwd());
function opt(name,fallback){const i=argv.indexOf(`--${name}`);return i>=0?argv[i+1]:fallback}
function allOpts(name){const out=[];for(let i=0;i<argv.length;i++)if(argv[i]===`--${name}`){if(!argv[i+1]||argv[i+1].startsWith("--"))throw new Error(`Missing value for --${name}`);out.push(argv[i+1]);}return out;}
function csv(value){return (value||"").split(",").map(x=>x.trim()).filter(Boolean)}
try{
 if(cmd==="init"){await initProject(cwd,opt("name"));console.log(`BrainShare initialized in ${cwd}`)}
 else if(cmd==="slice"){const sub=argv.shift();if(sub!=="create")throw new Error("Usage: brainshare slice create <id> --title <title> --include <glob[,glob]>");const id=argv.shift();if(!id)throw new Error("Missing slice id");await initProject(cwd);const f=path.join(cwd,".brainshare","slices.json"),data=await readJson(f);data.slices[id]={id,title:opt("title",id),description:opt("description","")||"",include:csv(opt("include","**/*.md")),exclude:csv(opt("exclude","")),entrypoint:opt("entrypoint"),visibility:opt("visibility","unlisted"),live:opt("live","true")!=="false"};await writeJson(f,data);console.log(`Created slice ${id}`)}
 else if(cmd==="inspect"){const id=argv.shift();if(!id)throw new Error("Missing slice id");const{slice}=await compileProjectSlice(cwd,id);console.log(JSON.stringify(slice,null,2))}
 else if(cmd==="snapshot"){const id=argv.shift();if(!id)throw new Error("Missing slice id");const p=await compileProjectSlice(cwd,id);const file=path.join(cwd,".brainshare","snapshots",`${id}-${p.slice.revision}.json`);const documents=Object.fromEntries(p.slice.files.map(f=>[f.path,p.files[f.path]]));await writeJson(file,{version:1,kind:"brainshare-snapshot",createdAt:new Date().toISOString(),slice:{...p.slice,live:false},documents});console.log(file)}
 else if(cmd==="publish"){const id=argv.shift();if(!id)throw new Error("Missing slice id");const publisher=opt("publisher",process.env.BRAINSHARE_PUBLISHER),token=opt("token",process.env.BRAINSHARE_TOKEN);if(!publisher||!token)throw new Error("Set --publisher/--token or BRAINSHARE_PUBLISHER/BRAINSHARE_TOKEN");const r=await publishProjectSlice(cwd,id,{publisher,token});console.log(r.url)}
 else if(cmd==="handoff"){
   const sub=argv.shift(),id=argv.shift();
   if(!id)throw new Error("Usage: brainshare handoff create|check <slice-id> [--task <title>]");
   const {slice}=await compileProjectSlice(cwd,id);
   if(sub==="create"){
     const out=await createHandoff(cwd,slice,{task:opt("task"),status:opt("status","in_progress"),nextSteps:allOpts("next"),blockers:allOpts("blocker"),claims:allOpts("claim")});
     console.log(out.file);
   }else if(sub==="check"){
     const {handoff}=await latestHandoff(cwd,id);
     const result=await checkHandoff(cwd,handoff,slice);
     console.log(JSON.stringify(result,null,2));
     if(result.freshness==="stale")process.exitCode=2;
   }else if(sub==="ci-check"){
     const {handoff}=await latestHandoff(cwd,id);
     const freshness=await checkHandoff(cwd,handoff,slice);
     if(freshness.freshness==="stale"){
       console.log(JSON.stringify({freshness,ci:null,note:"Handoff is stale; create a new handoff before checking CI evidence"},null,2));
       process.exitCode=2;
     }else{
       const ci=await verifyGitHubActionsRun(handoff,{
         repo:opt("repo"),runId:opt("run-id"),token:process.env.GITHUB_TOKEN
       });
       console.log(JSON.stringify({freshness,ci},null,2));
       if(ci.result!=="reported_success"||freshness.freshness!=="current")process.exitCode=2;
     }
   }else throw new Error("Usage: brainshare handoff create|check|ci-check <slice-id>");
 }
 else if(cmd==="view"){const target=argv[0]??cwd,server=fileURLToPath(new URL("../apps/viewer/server.mjs",import.meta.url)),child=spawn(process.execPath,[server,path.resolve(target)],{stdio:"inherit",env:process.env});child.on("error",e=>{console.error(`Could not start BrainShare Viewer: ${e.message}`);process.exitCode=1});child.on("exit",c=>process.exit(c??0))}
 else console.log("BrainShare CLI\n\n  init\n  slice create <id>\n  inspect <id>\n  snapshot <id>\n  publish <id>\n  view [path]\n  handoff create <slice-id> --task <title> [--next <step>] [--claim <unverified-claim>]\n  handoff check <slice-id>\n  handoff ci-check <slice-id> --repo owner/name --run-id 123 (optional GITHUB_TOKEN)");
}catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=1}
