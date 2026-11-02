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
