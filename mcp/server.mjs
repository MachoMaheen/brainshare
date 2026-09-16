#!/usr/bin/env node
import readline from "node:readline";
import path from "node:path";
import { loadProject, compileProjectSlice } from "../cli/lib.mjs";
import { buildKnowledgeGraph } from "@brainshare/core";
import { parseMarkdown } from "@brainshare/markdown";

const root=path.resolve(process.env.BRAINSHARE_ROOT||process.argv[2]||process.cwd());
const protocolVersion="2025-06-18";
const tools=[
  {name:"list_slices",description:"List BrainShare Slice definitions in this project.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
  {name:"get_slice",description:"Get a compiled BrainShare Slice revision, membership, graph and backlinks.",inputSchema:{type:"object",properties:{id:{type:"string"}},required:["id"],additionalProperties:false}},
  {name:"get_note",description:"Read a Markdown note by project-relative path.",inputSchema:{type:"object",properties:{path:{type:"string"}},required:["path"],additionalProperties:false}},
  {name:"search_notes",description:"Search Markdown titles and bodies. Optionally restrict to one Slice.",inputSchema:{type:"object",properties:{query:{type:"string"},slice:{type:"string"},limit:{type:"number"}},required:["query"],additionalProperties:false}},
  {name:"get_context",description:"Get local outgoing links and backlinks for a Markdown path.",inputSchema:{type:"object",properties:{path:{type:"string"}},required:["path"],additionalProperties:false}}
];
const text=(value)=>({content:[{type:"text",text:typeof value==="string"?value:JSON.stringify(value,null,2)}]});
const fail=(message)=>({content:[{type:"text",text:String(message)}],isError:true});
async function callTool(name,args={}){
  const project=await loadProject(root);
  if(name==="list_slices")return text(Object.values(project.slices.slices).map(({id,title,description,visibility,live,entrypoint})=>({id,title,description,visibility:visibility??"unlisted",live:live!==false,entrypoint})));
  if(name==="get_slice")return text((await compileProjectSlice(root,args.id)).slice);
  if(name==="get_note"){
    const rel=String(args.path||"").replace(/\\/g,"/");if(!project.files[rel])throw new Error(`Unknown Markdown path: ${rel}`);
    const doc=parseMarkdown(project.files[rel],path.basename(rel,".md"));return text({path:rel,id:project.manifest.notes[rel]?.id,title:doc.title,markdown:project.files[rel]});
  }
  if(name==="search_notes"){
    const q=String(args.query||"").trim().toLowerCase();if(!q)throw new Error("query is required");let allowed=new Set(Object.keys(project.files));if(args.slice){const s=(await compileProjectSlice(root,args.slice)).slice;allowed=new Set(s.files.map(f=>f.path));}
    const limit=Math.max(1,Math.min(50,Number(args.limit)||10)),matches=[];
    for(const rel of allowed){const md=project.files[rel],doc=parseMarkdown(md,path.basename(rel,".md")),hay=`${doc.title}\n${doc.body}`.toLowerCase(),idx=hay.indexOf(q);if(idx<0)continue;const body=doc.body.replace(/\s+/g," "),bodyIdx=body.toLowerCase().indexOf(q);matches.push({path:rel,id:project.manifest.notes[rel]?.id,title:doc.title,snippet:bodyIdx>=0?body.slice(Math.max(0,bodyIdx-80),bodyIdx+q.length+120):body.slice(0,200)});if(matches.length>=limit)break;}return text(matches);
  }
  if(name==="get_context"){
    const rel=String(args.path||"").replace(/\\/g,"/");if(!project.files[rel])throw new Error(`Unknown Markdown path: ${rel}`);const graph=buildKnowledgeGraph(project.files),titles=Object.fromEntries(graph.nodes.map(n=>[n.path,n.title]));return text({path:rel,outgoing:(graph.outgoing[rel]??[]).map(p=>({path:p,title:titles[p]})),backlinks:(graph.backlinks[rel]??[]).map(p=>({path:p,title:titles[p]}))});
  }
  throw new Error(`Unknown tool: ${name}`);
}
async function handle(msg){
  if(msg.method==="initialize")return {jsonrpc:"2.0",id:msg.id,result:{protocolVersion:msg.params?.protocolVersion||protocolVersion,capabilities:{tools:{}},serverInfo:{name:"brainshare",version:"0.1.0"}}};
  if(msg.method==="notifications/initialized")return null;
  if(msg.method==="tools/list")return {jsonrpc:"2.0",id:msg.id,result:{tools}};
  if(msg.method==="tools/call"){
    try{return {jsonrpc:"2.0",id:msg.id,result:await callTool(msg.params?.name,msg.params?.arguments??{})};}
    catch(e){return {jsonrpc:"2.0",id:msg.id,result:fail(e instanceof Error?e.message:String(e))};}
  }
  if(msg.id!==undefined)return {jsonrpc:"2.0",id:msg.id,error:{code:-32601,message:`Method not found: ${msg.method}`}};
  return null;
}
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of rl){if(!line.trim())continue;try{const out=await handle(JSON.parse(line));if(out)process.stdout.write(JSON.stringify(out)+"\n");}catch(e){process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:null,error:{code:-32700,message:e instanceof Error?e.message:String(e)}})+"\n");}}
