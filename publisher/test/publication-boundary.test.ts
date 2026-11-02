import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { signJWT } from "../src/jwt";
import { strFromU8, unzipSync } from "fflate";

const PUB="01HX0000000000000000000001";
const HIDDEN="01HX0000000000000000000002";
const KEY="a".repeat(64);
const OTHER="b".repeat(64);
const CANARY="EXCLUDED_SECRET_CANARY_7851";

function setup() {
  const data=new Map<string,unknown>([
    ["note:"+PUB,"# Public\nA safe page with [[Hidden]] and no other metadata."],
    ["meta:"+PUB,JSON.stringify({path:"docs/Public.md",basename:"Public"})],
    ["note:"+HIDDEN,"# Hidden\n"+CANARY],
    ["meta:"+HIDDEN,JSON.stringify({path:"private/Hidden.md",basename:"Hidden"})],
    ["wrap:public",JSON.stringify({title:"Public",ulids:[PUB],assets:{"diagram.png":KEY},gated:false})],
    ["wrap:gated",JSON.stringify({title:"Gated",ulids:[HIDDEN],assets:{"private.png":KEY},gated:true})],
    ["noterefs:"+HIDDEN,JSON.stringify(["gated"])],
    ["asset:"+KEY,new TextEncoder().encode("synthetic-image").buffer],
  ]);
  const kv={
    get:async(key:string)=>data.get(key)??null,
    put:async(key:string,value:unknown)=>{data.set(key,value)},
    delete:async(key:string)=>{data.delete(key)},
    getWithMetadata:async(key:string)=>({value:data.get(key)??null,metadata:{contentType:"image/png"}}),
    list:async()=>({keys:[],list_complete:true})
  };
  vi.stubGlobal("caches",{default:{match:async()=>null,put:async()=>{}}});
  const env={NOTES:kv,PUBLISHER_TOKEN:"test-owner-secret",JWT_SECRET:"test-jwt-secret"};
  const ctx={waitUntil:()=>{}};
  const request=async(path:string,headers:Record<string,string>={})=>
    worker.fetch(new Request("https://example.invalid"+path,{headers}),env as never,ctx as never);
  return {data,request};
}

describe("publication privacy boundaries",()=>{
  it("does not expose unflagged notes or canvases through direct URLs",async()=>{
    const {request}=setup();
    expect((await request("/"+HIDDEN)).status).toBe(404);
    expect((await request("/c/"+HIDDEN)).status).toBe(404);
  });
  it("rejects formerly public standalone notes when referenced by a gated Slice",async()=>{
    const {request,data}=setup();
    data.set("standalone:"+HIDDEN,"1");
    expect((await request("/"+HIDDEN)).status).toBe(403);
    data.set("standalone:"+PUB,"1");
    expect((await request("/"+PUB)).status).toBe(200);
  });
  it("checks asset membership and gating; direct asset URLs are not public",async()=>{
    const {request}=setup();
    expect((await request("/asset/"+KEY)).status).toBe(404);
    expect((await request("/share/public/asset/"+OTHER)).status).toBe(403);
    expect((await request("/share/gated/asset/"+KEY)).status).toBe(401);
    const publicAsset=await request("/share/public/asset/"+KEY);
    expect(publicAsset.status).toBe(200);
    expect(publicAsset.headers.get("x-content-type-options")).toBe("nosniff");
  });
  it("requires authorization for gated notes, feed, search and assets",async()=>{
    const {request}=setup();
    for(const url of [
      "/share/gated/"+HIDDEN,
      "/share/gated/api/search?q="+CANARY,
      "/share/gated/feed.xml",
      "/share/gated/asset/"+KEY,
      "/share/gated/download"
    ]) {
      const r=await request(url);
      expect(r.status,url).toBe(401);
      expect(await r.text()).not.toContain(CANARY);
    }
  });
  it("serves a gated asset to an authorized viewer without public cache",async()=>{
    const {request}=setup();
    const token=await signJWT({sub:"gated",jti:"test-jti",iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600},"test-jwt-secret");
    const r=await request("/share/gated/asset/"+KEY,{authorization:"Bearer "+token});
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toContain("no-store");
  });
  it("excludes a private note from public html, search, graph, zip, feed and scoped routes",async()=>{
    const {request}=setup();
    const note=await request("/share/public/"+PUB);
    expect(note.status).toBe(200);
    const html=await note.text();
    expect(html).not.toContain(CANARY);
    expect(html).not.toContain("private/Hidden.md");
    expect(html).not.toContain("[[Hidden]]");
    expect(html).toContain("[not shared]");
    expect((await request("/share/public/"+HIDDEN)).status).toBe(403);
    expect((await request("/share/public/"+HIDDEN+"/og.svg")).status).toBe(403);
    const search=await request("/share/public/api/search?q=SECRET_CANARY");
    expect(search.status).toBe(200);
    const searchData=await search.json();
    expect(searchData.matches).toEqual([]);
    expect(JSON.stringify(searchData)).not.toContain(CANARY);
    const feed=await request("/share/public/feed.xml");
    expect(await feed.text()).not.toContain(CANARY);
    const download=await request("/share/public/download");
    expect(download.status).toBe(200);
    const unpacked=unzipSync(new Uint8Array(await download.arrayBuffer()));
    const contents=Object.entries(unpacked).map(([filename,data])=>filename+strFromU8(data)).join("\n");
    expect(contents).not.toContain(CANARY);
    expect(contents).not.toContain("private/Hidden.md");
  });
});
