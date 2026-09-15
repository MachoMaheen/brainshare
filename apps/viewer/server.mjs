import http from "node:http";
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderMarkdownLite, parseMarkdown } from "@brainshare/markdown";
import { buildKnowledgeGraph } from "@brainshare/core";
import { initProject, publishProjectSlice } from "../../cli/lib.mjs";

const arg=process.argv[2]??process.cwd(),stat=await fs.stat(arg),root=stat.isDirectory()?path.resolve(arg):path.dirname(path.resolve(arg)),initial=stat.isFile()?path.basename(arg):null,publicDir=path.join(path.dirname(fileURLToPath(import.meta.url)),"public"),recent=[],clients=new Set(),sessionStartedAt=new Date().toISOString();
const safe=(p)=>{const abs=path.resolve(root,p||"");if(abs!==root&&!abs.startsWith(root+path.sep))throw new Error("outside root");return abs};
async function files(dir=root,out=[]){for(const e of await fs.readdir(dir,{withFileTypes:true})){if([".git","node_modules",".brainshare"].includes(e.name))continue;const a=path.join(dir,e.name);if(e.isDirectory())await files(a,out);else if(e.isFile()&&/\.md$/i.test(e.name))out.push(path.relative(root,a).replace(/\\/g,"/"));}return out.sort()}
async function markdownMap(){const out={};for(const p of await files())out[p]=await fs.readFile(path.join(root,p),"utf8");return out;}
function json(res,data,status=200){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(data))}
async function body(req){let s="";for await(const c of req)s+=c;return s?JSON.parse(s):{}}
async function serve(req,res){const u=new URL(req.url,"http://local");try{
 if(u.pathname==="/api/files")return json(res,{root,initial,files:await files(),recent,sessionStartedAt});
 if(u.pathname==="/api/file"){const rel=u.searchParams.get("path"),abs=safe(rel),md=await fs.readFile(abs,"utf8"),d=parseMarkdown(md,path.basename(abs,".md"));return json(res,{path:rel,title:d.title,html:renderMarkdownLite(md),raw:md});}
 if(u.pathname==="/api/context"){const rel=u.searchParams.get("path");safe(rel);const map=await markdownMap(),graph=buildKnowledgeGraph(map),titleByPath=Object.fromEntries(graph.nodes.map(n=>[n.path,n.title]));return json(res,{path:rel,outgoing:(graph.outgoing[rel]??[]).map(path=>({path,title:titleByPath[path]??path})),backlinks:(graph.backlinks[rel]??[]).map(path=>({path,title:titleByPath[path]??path}))});}
 if(u.pathname==="/api/graph")return json(res,buildKnowledgeGraph(await markdownMap()));
 if(u.pathname==="/api/slice"&&req.method==="POST"){const b=await body(req);if(!/^[A-Za-z0-9_-]{1,64}$/.test(b.id))return json(res,{error:"bad id"},400);const selected=(b.files||[]).filter(x=>typeof x==="string");for(const p of selected)safe(p);const dir=path.join(root,".brainshare");await fs.mkdir(dir,{recursive:true});const sf=path.join(dir,"slices.json");let data={version:1,slices:{}};try{data=JSON.parse(await fs.readFile(sf,"utf8"))}catch{}data.slices[b.id]={id:b.id,title:b.title||b.id,description:b.description||"",include:selected,visibility:"unlisted",live:true};await fs.writeFile(sf,JSON.stringify(data,null,2)+"\n");return json(res,{ok:true,id:b.id});}
 if(u.pathname==="/api/publish"&&req.method==="POST"){const b=await body(req),publisher=process.env.BRAINSHARE_PUBLISHER,token=process.env.BRAINSHARE_TOKEN;if(!publisher||!token)return json(res,{error:"Set BRAINSHARE_PUBLISHER and BRAINSHARE_TOKEN before launching Viewer."},400);await initProject(root);const out=await publishProjectSlice(root,b.id,{publisher,token});return json(res,{ok:true,url:out.url,revision:out.slice.revision});}
 if(u.pathname==="/events"){res.writeHead(200,{"content-type":"text/event-stream","cache-control":"no-cache","connection":"keep-alive"});res.write("event: ready\ndata: {}\n\n");clients.add(res);req.on("close",()=>clients.delete(res));return;}
 const file=u.pathname==="/"?"index.html":u.pathname.slice(1),abs=path.join(publicDir,file),data=await fs.readFile(abs),type=file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":"text/html";res.writeHead(200,{"content-type":`${type}; charset=utf-8`});res.end(data);
 }catch(e){json(res,{error:e instanceof Error?e.message:String(e)},404)}}
const watcher=fssync.watch(root,{recursive:true},(_,filename)=>{if(!filename||!filename.toLowerCase().endsWith(".md"))return;const rel=filename.replace(/\\/g,"/");const previous=recent.findIndex(x=>x.path===rel);if(previous>=0)recent.splice(previous,1);recent.unshift({path:rel,at:new Date().toISOString()});recent.splice(30);for(const r of clients)r.write(`event: change\ndata: ${JSON.stringify({path:rel})}\n\n`)});watcher.on("error",()=>{});
const server=http.createServer(serve),port=Number(process.env.BRAINSHARE_VIEWER_PORT||43110);server.listen(port,"127.0.0.1",()=>console.log(`BrainShare Viewer: http://127.0.0.1:${port}${initial?`/?file=${encodeURIComponent(initial)}`:""}`));
