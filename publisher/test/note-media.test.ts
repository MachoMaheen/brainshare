import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { digestSha256Hex } from "../src/asset-security";

const ULID = "01M2N2ADTJZD5SN54QCSQW856P";
const OTHER_ULID = "01M2N2ADTJZD5SN54QCSQW857Q";
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg=="), x => x.charCodeAt(0));

function setup() {
  const map = new Map<string, {value: unknown; metadata?: unknown}>();
  const kv = {
    get: async (key:string) => map.get(key)?.value ?? null,
    put: async (key:string, value:unknown, options?:{metadata?:unknown}) => {map.set(key,{value,metadata:options?.metadata});},
    delete: async (key:string) => {map.delete(key);},
    getWithMetadata: async (key:string) => {
      const entry = map.get(key);
      return {value:entry?.value??null,metadata:entry?.metadata??null};
    },
    list:async () => ({keys:[],list_complete:true}),
  };
  vi.stubGlobal("caches",{default:{match:async()=>null,put:async()=>{}}});
  const env = {NOTES:kv,PUBLISHER_TOKEN:"owner",JWT_SECRET:"secret"};
  const ctx = {waitUntil:() => {}};
  const request = (path:string, opts:RequestInit={}) =>
    worker.fetch(new Request("https://example.test"+path,opts),env as never,ctx as never);
  return {request,map};
}
const bearer = {authorization:"Bearer owner"};
const keyOf = () => digestSha256Hex(PNG.buffer as ArrayBuffer);
async function upload(request:ReturnType<typeof setup>["request"]) {
  const key = await keyOf();
  const resp = await request("/api/assets/"+key,{method:"PUT",
    headers:{...bearer,"content-type":"image/png"},body:PNG});
  expect(resp.status).toBe(200);
  return key;
}

describe("Obsidian media publishing regression", () => {
  it("renders seven space-containing pasted-image embeds on a standalone note", async () => {
    const {request} = setup();
    const key = await upload(request);
    const names = Array.from({length:7},(_,i) => `Pasted image 20261106124${(200+i).toString().padStart(3,"0")}.png`);
    const assets = Object.fromEntries(names.map(name => [name,key]));
    const manifest = await request(`/api/notes/${ULID}/assets`,{
      method:"PUT",headers:{...bearer,"content-type":"application/json"},
      body:JSON.stringify({assets}),
    });
    expect(manifest.status).toBe(200);
    const md = "# My action ITEMS\n"+names.map(name=>`![[${name}]]`).join("\n");
    expect((await request(`/api/notes/${ULID}`,{method:"PUT",
      headers:{...bearer,"x-brainshare-standalone":"public","x-note-path":"My action ITEMS.md"},
      body:md})).status).toBe(200);
    const page = await request("/"+ULID);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html.match(/class="embedded-image"/g)?.length).toBe(7);
    expect(html).not.toContain("[asset not shared]");
    expect(html).toContain(`/note/${ULID}/asset/${key}`);
    const image = await request(`/note/${ULID}/asset/${key}`);
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    expect((await image.arrayBuffer()).byteLength).toBe(PNG.length);
  });

  it("rejects unknown hashes and blocks cross-note and global access",async()=>{
    const {request}=setup();
    const key=await upload(request);
    await request(`/api/notes/${ULID}/assets`,{method:"PUT",
      headers:{...bearer,"content-type":"application/json"},body:JSON.stringify({assets:{"photo.png":key}})});
    expect((await request(`/note/${ULID}/asset/${key}`)).status).toBe(404); // not public
    await request(`/api/notes/${ULID}`,{method:"PUT",headers:{...bearer,"x-brainshare-standalone":"public"},body:"photo"});
    expect((await request(`/note/${ULID}/asset/${key}`)).status).toBe(200);
    expect((await request(`/note/${OTHER_ULID}/asset/${key}`)).status).toBe(404);
    expect((await request("/asset/"+key)).status).toBe(404);
    const bad = await request(`/api/notes/${ULID}/assets`,{method:"PUT",headers:{...bearer,"content-type":"application/json"},
      body:JSON.stringify({assets:{"not-uploaded.png":"f".repeat(64)}})});
    expect(bad.status).toBe(409);
    const unauthorized = await request(`/api/notes/${ULID}/assets`,{method:"PUT",body:JSON.stringify({assets:{}})});
    expect(unauthorized.status).toBe(403);
  });

  it("refreshes Slice membership when a note's image manifest changes",async()=>{
    const {request,map}=setup();
    const key=await upload(request);
    map.set("wrap:review",{value:JSON.stringify({title:"Review",ulids:[ULID],assets:{},gated:false})});
    map.set(`noterefs:${ULID}`,{value:JSON.stringify(["review"])});
    const update=await request(`/api/notes/${ULID}/assets`,{method:"PUT",
      headers:{...bearer,"content-type":"application/json"},
      body:JSON.stringify({assets:{"screenshots/Pasted image.png":key}})});
    expect(update.status).toBe(200);
    const stored = JSON.parse(map.get("wrap:review")!.value as string);
    expect(stored.assets[`note:${ULID}:screenshots/Pasted image.png`]).toBe(key);
    expect((await request(`/share/review/asset/${key}`)).status).toBe(200);
    // Removing the media entry revokes its Slice membership.
    const clear=await request(`/api/notes/${ULID}/assets`,{method:"PUT",
      headers:{...bearer,"content-type":"application/json"},body:JSON.stringify({assets:{}})});
    expect(clear.status).toBe(200);
    expect((await request(`/share/review/asset/${key}`)).status).toBe(403);
  });
});
