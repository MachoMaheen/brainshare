#!/usr/bin/env bash
set -euo pipefail

python - <<'PY'
from pathlib import Path


def replace_once(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f"pattern not found in {path}: {old[:140]!r}")
    p.write_text(s.replace(old,new,1))

p=Path('vscode-extension/src/extension.ts')
s=p.read_text()
replace_old='''let store: StateStore | undefined;\nlet tree: SliceTreeProvider | undefined;\n\nexport async function activate(context: vscode.ExtensionContext): Promise<void> {\n  const root = workspaceRoot();\n  if (root) {\n    store = new StateStore(root);\n    tree = new SliceTreeProvider(store);\n    context.subscriptions.push(vscode.window.registerTreeDataProvider("brainshare.slices", tree));\n  }\n'''
replace_new='''let store: StateStore | undefined;\nlet storeRootKey: string | undefined;\nlet tree: SliceTreeProvider | undefined;\n\nexport async function activate(context: vscode.ExtensionContext): Promise<void> {\n  syncStore();\n  tree = new SliceTreeProvider(() => store);\n  context.subscriptions.push(vscode.window.registerTreeDataProvider("brainshare.slices", tree));\n'''
if replace_old not in s: raise SystemExit('activation pattern missing')
s=s.replace(replace_old,replace_new,1)
s=s.replace('''  register(context, "brainshare.refresh", () => tree?.refresh());\n\n  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document) => {\n    if (!store || document.languageId !== "markdown") return;\n''','''  register(context, "brainshare.refresh", () => tree?.refresh());\n\n  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => syncStore()));\n\n  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document) => {\n    syncStore();\n    if (!store || document.languageId !== "markdown") return;\n''',1)
s=s.replace('''  context.subscriptions.push(vscode.workspace.onDidRenameFiles(async (event) => {\n    if (!store) return;\n''','''  context.subscriptions.push(vscode.workspace.onDidRenameFiles(async (event) => {\n    syncStore();\n    if (!store) return;\n''',1)
s=s.replace('''function workspaceRoot(): vscode.Uri | undefined {\n  return vscode.workspace.workspaceFolders?.[0]?.uri;\n}\n\nfunction requireStore(): StateStore {\n  if (!store) throw new Error("Open a folder or workspace before using BrainShare.");\n  return store;\n}\n''','''function workspaceRoot(): vscode.Uri | undefined {\n  return vscode.workspace.workspaceFolders?.[0]?.uri;\n}\n\nfunction syncStore(): void {\n  const root = workspaceRoot();\n  const key = root?.toString(true);\n  if (key === storeRootKey) return;\n  storeRootKey = key;\n  store = root ? new StateStore(root) : undefined;\n  tree?.refresh();\n}\n\nfunction requireStore(): StateStore {\n  syncStore();\n  if (!store) throw new Error("Open a folder or workspace before using BrainShare.");\n  return store;\n}\n''',1)
s=s.replace('''  const existing = await api.getWrapper(id);\n  const merged = unique([...(existing?.ulids ?? []), ...published.map((p) => p.id)]);\n  const payload = {\n    title,\n    description,\n    gated: visibility.gated,\n    ulids: merged,\n''','''  const existing = await api.getWrapper(id);\n  const ulids = published.map((p) => p.id);\n  const payload = {\n    title,\n    description,\n    gated: visibility.gated,\n    ulids,\n''',1)
s=s.replace('''    ulids: merged,\n    url: wrapper.url,\n''','''    ulids,\n    url: wrapper.url,\n''',1)
old='''  const files: vscode.Uri[] = [];\n  for (const path of slice.files) {\n    const uri = vscode.Uri.joinPath(workspaceRoot()!, ...path.split("/"));\n    try { await vscode.workspace.fs.stat(uri); files.push(uri); } catch { /* missing file: preserve remote ULID */ }\n  }\n  const published = await publishFiles(context, files);\n  const api = await apiFromSettings(context);\n  const existing = await api.getWrapper(slice.id);\n  if (!existing) throw new Error(`Slice ${slice.id} no longer exists on the publisher.`);\n  const ulids = unique([...existing.ulids, ...published.map((p) => p.id)]);\n  const wrapper = await api.publishWrapper(slice.id, { ...existing, ulids });\n  await stateStore.upsertSlice({ ...slice, ulids, url: wrapper.url });\n'''
new='''  const files: vscode.Uri[] = [];\n  const existingPaths: string[] = [];\n  for (const path of slice.files) {\n    const uri = vscode.Uri.joinPath(workspaceRoot()!, ...path.split("/"));\n    try { await vscode.workspace.fs.stat(uri); files.push(uri); existingPaths.push(path); } catch { /* deleted files leave the Slice on republish */ }\n  }\n  const published = await publishFiles(context, files);\n  const api = await apiFromSettings(context);\n  const existing = await api.getWrapper(slice.id);\n  if (!existing) throw new Error(`Slice ${slice.id} no longer exists on the publisher.`);\n  const ulids = published.map((p) => p.id);\n  const wrapper = await api.publishWrapper(slice.id, { ...existing, ulids });\n  await stateStore.upsertSlice({ ...slice, files: existingPaths, ulids, url: wrapper.url });\n'''
if old not in s: raise SystemExit('republish pattern missing')
s=s.replace(old,new,1)
s=s.replace('''  constructor(private readonly stateStore: StateStore) {}\n  refresh(): void { this.changed.fire(); }\n  getTreeItem(element: SliceTreeItem): vscode.TreeItem { return element; }\n  async getChildren(): Promise<SliceTreeItem[]> {\n    const state = await this.stateStore.read();\n''','''  constructor(private readonly getStateStore: () => StateStore | undefined) {}\n  refresh(): void { this.changed.fire(); }\n  getTreeItem(element: SliceTreeItem): vscode.TreeItem { return element; }\n  async getChildren(): Promise<SliceTreeItem[]> {\n    const stateStore = this.getStateStore();\n    if (!stateStore) return [];\n    const state = await stateStore.read();\n''',1)
p.write_text(s)

replace_once('packages/core/src/index.ts',
  'if(notes[path]){notes[path]={...notes[path],hash,updatedAt:new Date().toISOString()};continue;}',
  'if(notes[path]){if(notes[path].hash!==hash)notes[path]={...notes[path],hash,updatedAt:new Date().toISOString()};continue;}')
replace_once('cli/lib.mjs',
  'const next=ensureManifestIdentities(manifest,files);await writeJson(path.join(root,META_DIR,"manifest.json"),next);return{manifest:next,slices,files};',
  'const next=ensureManifestIdentities(manifest,files);if(JSON.stringify(next)!==JSON.stringify(manifest))await writeJson(path.join(root,META_DIR,"manifest.json"),next);return{manifest:next,slices,files};')

p=Path('apps/viewer/server.mjs'); s=p.read_text()
old='''const arg=process.argv[2]??process.cwd(),stat=await fs.stat(arg);if(stat.isFile()&&!/\\.md$/i.test(arg))throw new Error("BrainShare Viewer opens Markdown files or folders.");const root=stat.isDirectory()?path.resolve(arg):path.dirname(path.resolve(arg)),initial=stat.isFile()?path.basename(arg):null,publicDir=path.join(path.dirname(fileURLToPath(import.meta.url)),"public"),recent=[],clients=new Set(),sessionStartedAt=new Date().toISOString();\nconst safe=(p)=>{if(typeof p!=="string")throw new Error("missing path");const abs=path.resolve(root,p);if(abs!==root&&!abs.startsWith(root+path.sep))throw new Error("outside root");return abs};\nasync function safeMarkdown(p){if(typeof p!=="string"||!/\\.md$/i.test(p))throw new Error("Markdown files only");const abs=safe(p),s=await fs.stat(abs);if(!s.isFile())throw new Error("not a file");return abs;}\n'''
new='''const arg=process.argv[2]??process.cwd(),stat=await fs.stat(arg);if(stat.isFile()&&!/\\.md$/i.test(arg))throw new Error("BrainShare Viewer opens Markdown files or folders.");const root=stat.isDirectory()?path.resolve(arg):path.dirname(path.resolve(arg)),realRoot=await fs.realpath(root),initial=stat.isFile()?path.basename(arg):null,publicDir=path.join(path.dirname(fileURLToPath(import.meta.url)),"public"),recent=[],clients=new Set(),sessionStartedAt=new Date().toISOString();\nconst inside=(base,target)=>target===base||target.startsWith(base+path.sep);\nconst safe=(p)=>{if(typeof p!=="string")throw new Error("missing path");const abs=path.resolve(root,p);if(!inside(root,abs))throw new Error("outside root");return abs};\nasync function safeMarkdown(p){if(typeof p!=="string"||!/\\.md$/i.test(p))throw new Error("Markdown files only");const abs=safe(p),real=await fs.realpath(abs);if(!inside(realRoot,real))throw new Error("outside root");const s=await fs.stat(real);if(!s.isFile())throw new Error("not a file");return real;}\n'''
if old not in s: raise SystemExit('viewer safety pattern missing')
p.write_text(s.replace(old,new,1))

p=Path('publisher/src/index.ts'); s=p.read_text()
s=s.replace('''  const queryToken = url.searchParams.get("t") ?? undefined;\n  const cookieToken = readCookie(req, gateCookieName(wrapId));\n  const t = queryToken ?? cookieToken;\n''','''  const queryToken = url.searchParams.get("t") ?? undefined;\n  const cookieToken = readCookie(req, gateCookieName(wrapId));\n  const authorization = req.headers.get("authorization") ?? "";\n  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;\n  const t = queryToken ?? cookieToken ?? bearerToken;\n''',1)
marker='// GET /share/:wrapId/:ulid — note scoped to a wrapper\'s share-set'
start=s.index(marker)
gate='const gate = await checkGate(env, wrap, wrapId, url, req, true);'
pos=s.index(gate,start)
s=s[:pos]+'''const rawRequest = url.searchParams.get("raw") === "1";\n      const gate = await checkGate(env, wrap, wrapId, url, req, !rawRequest);'''+s[pos+len(gate):]
after=s.index('// ?raw=1 is a different response shape',start)
cond='if (url.searchParams.get("raw") !== "1") {'
pos=s.index(cond,after)
s=s[:pos]+'if (!rawRequest) {'+s[pos+len(cond):]
p.write_text(s)
PY

python - <<'PY'
from pathlib import Path
import json
pkg=Path('vscode-extension/package.json')
data=json.loads(pkg.read_text())
data['scripts']['test']='node --test test/package.test.mjs'
pkg.write_text(json.dumps(data,indent=2)+'\n')

p=Path('apps/viewer/test.mjs'); s=p.read_text()
needle='''const file=await fetch(`http://127.0.0.1:${port}/api/file?path=PLAN.md`).then(r=>r.json());assert.match(file.html,/<h1>Plan<\\/h1>/);'''
insert='''const file=await fetch(`http://127.0.0.1:${port}/api/file?path=PLAN.md`).then(r=>r.json());assert.match(file.html,/<h1>Plan<\\/h1>/);const outside=await fs.mkdtemp(path.join(os.tmpdir(),"bs-outside-")),outsideSecret=path.join(outside,"SECRET.md");await fs.writeFile(outsideSecret,"# secret");await fs.symlink(outsideSecret,path.join(root,"LEAK.md"));const leaked=await fetch(`http://127.0.0.1:${port}/api/file?path=LEAK.md`);assert.equal(leaked.status,404);'''
if needle not in s: raise SystemExit('viewer test insertion point missing')
p.write_text(s.replace(needle,insert,1))

p=Path('packages/core/test/core.test.mjs'); s=p.read_text()
s += '''\ntest("keeps updatedAt stable when content did not change",()=>{const files={"a.md":"same"};const first=ensureManifestIdentities(base,files),stamp=first.notes["a.md"].updatedAt;const second=ensureManifestIdentities(first,files);assert.equal(second.notes["a.md"].updatedAt,stamp)});\n'''
p.write_text(s)

p=Path('publisher/test/gated-cache.test.ts'); s=p.read_text()
s=s.replace('''  it("still authorizes before Cache API lookup", () => {''','''  it("keeps machine access available without putting credentials in cached HTML", () => {\n    expect(source).toContain('authorization.startsWith("Bearer ")');\n    expect(source).toContain('const rawRequest = url.searchParams.get("raw") === "1"');\n    expect(source).toContain('req, !rawRequest');\n  });\n\n  it("still authorizes before Cache API lookup", () => {''',1)
p.write_text(s)
PY

mkdir -p vscode-extension/test
cat > vscode-extension/test/package.test.mjs <<'EOF'
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";

function makeUri(input) {
  const fsPath=path.resolve(input);
  return {fsPath,path:fsPath.replace(/\\/g,"/"),scheme:"file",toString(){return `file://${this.path}`;}};
}
class EventEmitter { constructor(){this.event=()=>({dispose(){}});} fire(){} dispose(){} }
class TreeItem { constructor(label,collapsibleState){this.label=label;this.collapsibleState=collapsibleState;} }
class ThemeIcon { constructor(id){this.id=id;} }
class MarkdownString { constructor(value){this.value=value;} }

test("bundled extension preserves universal manifest and stable identity", async () => {
  const commands=new Map(), errors=[]; let root; let workspaceChange;
  const config={publisherUrl:"http://publisher.test",identityMode:"sidecar",autoPublishOnSave:false};
  const vscode={
    EventEmitter,TreeItem,ThemeIcon,MarkdownString,
    TreeItemCollapsibleState:{None:0},ConfigurationTarget:{Workspace:2},ProgressLocation:{Notification:15},FileType:{File:1,Directory:2},
    Uri:{file:makeUri,joinPath:(u,...xs)=>makeUri(path.join(u.fsPath,...xs)),parse:(s)=>({toString:()=>s,path:s})},
    workspace:{
      workspaceFolders:[],
      getWorkspaceFolder(uri){return root&&(uri.fsPath===root||uri.fsPath.startsWith(root+path.sep))?this.workspaceFolders[0]:undefined;},
      asRelativePath(uri){return path.relative(root,uri.fsPath).replace(/\\/g,"/");},
      getConfiguration(){return{get:(k,d)=>config[k]??d,update:async(k,v)=>{config[k]=v;}};},
      fs:{
        readFile:async(u)=>new Uint8Array(await fs.readFile(u.fsPath)),
        writeFile:async(u,b)=>{await fs.mkdir(path.dirname(u.fsPath),{recursive:true});await fs.writeFile(u.fsPath,b);},
        createDirectory:async(u)=>{await fs.mkdir(u.fsPath,{recursive:true});},
        stat:async(u)=>{const s=await fs.stat(u.fsPath);return{type:s.isDirectory()?2:1};},
      },
      onDidSaveTextDocument:()=>({dispose(){}}),onDidRenameFiles:()=>({dispose(){}}),
      onDidChangeWorkspaceFolders:(fn)=>{workspaceChange=fn;return{dispose(){}};},findFiles:async()=>[],
    },
    window:{
      activeTextEditor:null,registerTreeDataProvider:()=>({dispose(){}}),showErrorMessage:async(m)=>{errors.push(m);},
      showInformationMessage:async()=>{},showWarningMessage:async()=>"Unpublish",showInputBox:async()=>undefined,
      showQuickPick:async()=>undefined,showOpenDialog:async()=>undefined,withProgress:async(_o,fn)=>fn({report(){}}),
    },
    commands:{registerCommand:(name,fn)=>{commands.set(name,fn);return{dispose(){}};}},
    env:{clipboard:{writeText:async()=>{}},openExternal:async()=>{}},
  };

  const originalLoad=Module._load;
  try {
    Module._load=function(request,parent,isMain){if(request==="vscode")return vscode;return originalLoad.call(this,request,parent,isMain);};
    const require=createRequire(import.meta.url);
    const extensionPath=path.resolve("dist/extension.js");
    delete require.cache[extensionPath];
    const extension=require(extensionPath);

    root=await fs.mkdtemp(path.join(os.tmpdir(),"brainshare-vscode-"));
    const note=makeUri(path.join(root,"README.md"));
    await fs.writeFile(note.fsPath,"# Hello\n");
    await fs.mkdir(path.join(root,".brainshare"));
    const id="01JQ8Y4B9G0HBRQKCR3T6G9QJ0";
    await fs.writeFile(path.join(root,".brainshare","manifest.json"),JSON.stringify({version:1,project:{name:"demo",createdAt:"2026-01-01T00:00:00.000Z"},notes:{"README.md":{id}}},null,2)+"\n");
    await fs.writeFile(path.join(root,".brainshare","slices.json"),JSON.stringify({version:1,slices:{}},null,2)+"\n");
    vscode.workspace.workspaceFolders=[{uri:makeUri(root)}];
    vscode.window.activeTextEditor={document:{uri:note,languageId:"markdown"}};
    const context={subscriptions:[],secrets:{get:async()=>"secret",store:async()=>{}}};
    const calls=[];
    global.fetch=async(url,options={})=>{
      calls.push([String(url),options.method||"GET"]);
      if(options.method==="DELETE")return new Response(null,{status:204});
      return new Response(JSON.stringify({url:`http://publisher.test/${id}`}),{status:200,headers:{"content-type":"application/json"}});
    };

    await extension.activate(context);
    assert.equal(commands.size,14);
    await commands.get("brainshare.publishCurrent")(note);
    assert.deepEqual(errors,[]);

    let manifest=JSON.parse(await fs.readFile(path.join(root,".brainshare","manifest.json"),"utf8"));
    assert.equal(manifest.project.name,"demo");
    assert.equal(manifest.notes["README.md"].id,id);
    assert.equal(typeof manifest.notes["README.md"].hash,"string");
    assert.equal("slices" in manifest,false);
    const adapter=JSON.parse(await fs.readFile(path.join(root,".brainshare","vscode.json"),"utf8"));
    assert.match(adapter.notes["README.md"].url,/publisher\.test/);

    await commands.get("brainshare.unpublishCurrent")();
    manifest=JSON.parse(await fs.readFile(path.join(root,".brainshare","manifest.json"),"utf8"));
    assert.equal(manifest.notes["README.md"].id,id,"unpublish must not destroy stable identity");
    const after=JSON.parse(await fs.readFile(path.join(root,".brainshare","vscode.json"),"utf8"));
    assert.equal(after.notes["README.md"],undefined);
    assert.ok(calls.some(([,method])=>method==="PUT"));
    assert.ok(calls.some(([,method])=>method==="DELETE"));
    assert.equal(typeof workspaceChange,"function");
  } finally {
    Module._load=originalLoad;
  }
});
EOF
