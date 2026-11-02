import { describe,it,expect,vi } from "vitest";
import worker from "../src/index";
import { digestSha256Hex,sniffSafeImage } from "../src/asset-security";
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg=="),x=>x.charCodeAt(0));
function setup(){
 const map=new Map<string,{value:unknown,metadata?:unknown}>();
 const kv={
  get:async(key:string)=>map.get(key)?.value??null,
  put:async(key:string,value:unknown,options?:{metadata?:unknown})=>{map.set(key,{value,metadata:options?.metadata})},
  delete:async(key:string)=>{map.delete(key)},
  getWithMetadata:async(key:string)=>{const r=map.get(key);return {value:r?.value??null,metadata:r?.metadata??null}},
  list:async()=>({keys:[],list_complete:true})
 };
 vi.stubGlobal("caches",{default:{match:async()=>null,put:async()=>{}}});
 const env={NOTES:kv,PUBLISHER_TOKEN:"synthetic-owner-token",JWT_SECRET:"synthetic-jwt-secret"};
 const ctx={waitUntil:()=>{}};
 const request=async(path:string,opts:RequestInit={})=>worker.fetch(new Request("https://example.invalid"+path,opts),env as never,ctx as never);
 return {map,request};
}
describe("binary upload and scoped media restrictions",()=>{
 it("identifies safe raster signatures but excludes active and unknown media",()=>{
  expect(sniffSafeImage(PNG)).toBe("image/png");
  expect(sniffSafeImage(new TextEncoder().encode("<svg onload='alert(1)'></svg>"))).toBe(null);
  expect(sniffSafeImage(new TextEncoder().encode("<script>alert(1)</script>"))).toBe(null);
 });
 it("accepts an authentic SHA-256 keyed PNG and serves only within authorized Slice",async()=>{
  const {request,map}=setup();
  const key=await digestSha256Hex(PNG.buffer as ArrayBuffer);
  const put=await request("/api/assets/"+key,{method:"PUT",headers:{authorization:"Bearer synthetic-owner-token","content-type":"image/png"},body:PNG});
  expect(put.status).toBe(200);
  map.set("wrap:public",{value:JSON.stringify({title:"Public",ulids:[],assets:{"image.png":key},gated:false})});
  const r=await request("/share/public/asset/"+key);
  expect(r.status).toBe(200);
  expect(r.headers.get("content-type")).toBe("image/png");
  expect(r.headers.get("x-content-type-options")).toBe("nosniff");
  expect(r.headers.get("cross-origin-resource-policy")).toBe("same-origin");
  expect((await r.arrayBuffer()).byteLength).toBe(PNG.length);
  expect((await request("/asset/"+key)).status).toBe(404);
 });
 it("rejects spoofed MIME, SVG, invalid hash and unauthenticated writes",async()=>{
  const {request}=setup();const key=await digestSha256Hex(PNG.buffer as ArrayBuffer);
  const upload=(url:string,body:Uint8Array,ct:string,authorized=true)=>request(url,{method:"PUT",headers:{...(authorized?{authorization:"Bearer synthetic-owner-token"}:{}),"content-type":ct},body});
  expect((await upload("/api/assets/"+key,PNG,"image/svg+xml")).status).toBe(415);
  expect((await upload("/api/assets/"+key,PNG,"text/html")).status).toBe(415);
  expect((await upload("/api/assets/"+key,new TextEncoder().encode("<svg/>"),"image/svg+xml")).status).toBe(415);
  expect((await upload("/api/assets/"+"0".repeat(64),PNG,"image/png")).status).toBe(400);
  expect((await upload("/api/assets/"+key,PNG,"image/png",false)).status).toBe(403);
  expect((await upload("/api/assets/ab1234",PNG,"image/png")).status).toBe(404); // malformed route does not match
 });
 it("rejects synthetic metadata chunks in otherwise recognized raster images",async()=>{
  const {request}=setup();
  const payload=new Uint8Array([...PNG,...new TextEncoder().encode("tEXtEXIF_PRIVATE_CANARY")]);
  const key=await digestSha256Hex(payload.buffer as ArrayBuffer);
  const response=await request("/api/assets/"+key,{method:"PUT",
    headers:{authorization:"Bearer synthetic-owner-token","content-type":"image/png"},body:payload});
  expect(response.status).toBe(415);
 });
 it("does not execute or serve legacy SVG values through scoped asset URLs",async()=>{
  const {map,request}=setup();const key="a".repeat(64);
  map.set("wrap:public",{value:JSON.stringify({title:"Public",ulids:[],assets:{"legacy.svg":key},gated:false})});
  map.set("asset:"+key,{value:new TextEncoder().encode('<svg onload="alert(1)"></svg>').buffer,metadata:{contentType:"image/svg+xml"}});
  const r=await request("/share/public/asset/"+key);
  expect(r.status).toBe(415);
  expect(r.headers.get("cache-control")).toBe("no-store");
 });
});
