// Disposable staging verification. Only anonymous HTTP requests; no credentials.
const base="https://brainshare-staging-20261103.kabeermaheen6.workers.dev";
const pub="01HX0000000000000000000001";
const gated="01HX0000000000000000000002";
const excluded="01HX0000000000000000000003";
const canary="EXCLUDED_STAGING_CANARY_7851";
const key="a".repeat(64);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function get(p){return fetch(base+p,{redirect:"manual",signal:AbortSignal.timeout(15000)});}
let ready=false;
for(let n=0;n<30;n++){
  try{
    const r=await get("/share/smokepub");
    if(r.status===200 && (await r.text()).includes("PUBLIC_STAGING_TITLE")){ready=true;break;}
  }catch(e){if(n===29)throw e}
  await delay(3000);
}
if(!ready)throw Error("Worker or KV synthetic fixture was not available after retries");
let checks=0;
const eq=(actual,expected,label)=>{if(actual!==expected)throw Error(label+": expected "+expected+", got "+actual);checks++;};
const hidden=(text,label)=>{eq(text.includes(canary),false,label);};
for(const [path,status] of [
  ["/robots.txt",200],
  ["/share/smokepub",200],
  ["/share/smokepub/"+pub,200],
  ["/share/smokepub/"+excluded,403],
  ["/share/smokepub/"+gated,403],
  ["/"+pub,404],
  ["/"+gated,404],
  ["/"+excluded,404],
  ["/c/"+gated,404],
  ["/asset/"+key,404],
  ["/share/smokegated",401],
  ["/share/smokegated/"+gated,401],
  ["/share/smokegated/"+gated+"?raw=1",401],
  ["/share/smokegated/api/search?q=PRIVATE",401],
  ["/share/smokegated/feed.xml",401],
  ["/share/smokegated/download",401],
  ["/api/export",403]
]) {
  const r=await get(path);
  eq(r.status,status,path);
  if(r.headers.get("content-type")?.includes("text"))hidden(await r.text(),path);
}
for(const path of ["/share/smokepub","/share/smokepub/"+pub,"/share/smokepub/feed.xml"]) {
  const r=await get(path);hidden(await r.text(),path);
}
const search=await get("/share/smokepub/api/search?q="+encodeURIComponent(canary));
eq(search.status,200,"public search response");
const data=await search.json();eq(data.matches.length,0,"excluded item not indexed in public search");
const zip=await get("/share/smokepub/download");eq(zip.status,200,"public ZIP available");
const buffer=Buffer.from(await zip.arrayBuffer());
eq(buffer.length>100,true,"ZIP non-empty");
console.log("PASS remote Cloudflare staging HTTP checks:",checks,"assertions");
