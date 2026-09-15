#!/usr/bin/env node
import path from "node:path"; import { spawn } from "node:child_process"; import { initProject, readJson, writeJson, compileProjectSlice, publishProjectSlice } from "./lib.mjs";
const argv=process.argv.slice(2),cmd=argv.shift(),cwd=path.resolve(process.env.BRAINSHARE_ROOT||process.cwd());
function opt(name,fallback){const i=argv.indexOf(`--${name}`);return i>=0?argv[i+1]:fallback}
try{
 if(cmd==="init"){await initProject(cwd,opt("name"));console.log(`BrainShare initialized in ${cwd}`)}
 else if(cmd==="slice"){const sub=argv.shift();if(sub!=="create")throw new Error("Usage: brainshare slice create <id> --title <title> --include <glob[,glob]>");const id=argv.shift();if(!id)throw new Error("Missing slice id");await initProject(cwd);const f=path.join(cwd,".brainshare","slices.json"),data=await readJson(f);data.slices[id]={id,title:opt("title",id),description:opt("description","")||"",include:(opt("include","**/*.md")||"").split(",").filter(Boolean),exclude:(opt("exclude","")||"").split(",").filter(Boolean),entrypoint:opt("entrypoint"),visibility:opt("visibility","unlisted"),live:opt("live","true")!=="false"};await writeJson(f,data);console.log(`Created slice ${id}`)}
 else if(cmd==="inspect"){const id=argv.shift();if(!id)throw new Error("Missing slice id");const{slice}=await compileProjectSlice(cwd,id);console.log(JSON.stringify(slice,null,2))}
 else if(cmd==="snapshot"){const id=argv.shift();if(!id)throw new Error("Missing slice id");const{slice}=await compileProjectSlice(cwd,id);const file=path.join(cwd,".brainshare","snapshots",`${id}-${slice.revision}.json`);await writeJson(file,{...slice,live:false});console.log(file)}
 else if(cmd==="publish"){const id=argv.shift();if(!id)throw new Error("Missing slice id");const publisher=opt("publisher",process.env.BRAINSHARE_PUBLISHER),token=opt("token",process.env.BRAINSHARE_TOKEN);if(!publisher||!token)throw new Error("Set --publisher/--token or BRAINSHARE_PUBLISHER/BRAINSHARE_TOKEN");const r=await publishProjectSlice(cwd,id,{publisher,token});console.log(r.url)}
 else if(cmd==="view"){const target=argv[0]??cwd,server=new URL("../apps/viewer/server.mjs",import.meta.url),child=spawn(process.execPath,[server.pathname,path.resolve(target)],{stdio:"inherit",env:process.env});child.on("exit",c=>process.exit(c??0))}
 else console.log("BrainShare CLI\n\n  init\n  slice create <id>\n  inspect <id>\n  snapshot <id>\n  publish <id>\n  view [path]");
}catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=1}
