// SPDX-License-Identifier: AGPL-3.0-only
// Author-side publication preflight. Findings never print captured secret values.
// This is a best-effort detector, not a proof that content is safe to publish.
import path from "node:path";

const SENSITIVE_PATH = /(^|\/)(?:\.env(?:\.|$)|\.ssh(?:\/|$)|\.aws(?:\/|$)|id_(?:rsa|ed25519)(?:\.|$)|[^/]*(?:secret|credentials|private[_-]key)[^/]*)(?:\/|$)/i;
const SENSITIVE_CONTENT = [
  {code:"private_key", test:/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i},
  {code:"cloud_access_key", test:/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/},
  {code:"github_token", test:/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/},
  {code:"api_token", test:/\b(?:sk-[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/},
  {code:"credential_assignment", test:/\b(?:api[_-]?key|client[_-]?secret|password|auth[_-]?token)\s*[:=]\s*["']?(?!example\b|placeholder\b|redacted\b|your[_-])[A-Za-z0-9_+/=-]{16,}/i}
];
const LINK = /!?\[\[([^\]]+)\]\]|!?\[[^\]]*\]\(([^)]+)\)/g;
const ASSET = /\.(?:png|jpe?g|webp|gif|svg|avif|bmp|pdf|canvas)$/i;

function findTarget(raw, source, allPaths) {
  const target = raw.trim().split("|")[0].split("#")[0].trim();
  if (!target || /^(?:https?:|mailto:|data:|#)/i.test(target)) return {external:true};
  if (/^\/|^[A-Za-z]:[\\/]|\\|%2f|%5c/i.test(target) || target.includes("\0")) {
    return {blocked:true, target:"unsafe relative path"};
  }
  const normalized = path.posix.normalize(path.posix.join(path.posix.dirname(source),target));
  if (normalized === ".." || normalized.startsWith("../")) return {blocked:true,target:"outside project root"};
  const noExt = normalized.replace(/\.md$/i,"");
  const candidates = [normalized, normalized+".md", noExt+".md"];
  if (!target.includes("/") && !target.startsWith(".")) {
    for(const p of allPaths) {
      if(p.toLowerCase() === normalized.toLowerCase() ||
        path.posix.basename(p,".md").toLowerCase() === target.replace(/\.md$/i,"").toLowerCase()) {
        candidates.push(p); break;
      }
    }
  }
  const resolved = candidates.find(p=>allPaths.includes(p));
  if(resolved) return {resolved};
  if(ASSET.test(target)) return {unresolvedAsset:true};
  if(/\.md$/i.test(target) || raw.startsWith("../")) return {unresolvedDoc:true};
  return {unresolvedWiki:true};
}

export function inspectSlicePublication({slice,files,blockText=[]}) {
  if(!slice || !Array.isArray(slice.files) || typeof files!=="object" || !files)
    throw new Error("A compiled Slice and project files are required");
  if(!Array.isArray(blockText) || blockText.some(s=>typeof s!=="string" || !s.trim() || s.length>200))
    throw new Error("Block text must be non-empty strings up to 200 characters");
  const allowed = new Set(slice.files.map(f=>f.path));
  const allPaths = Object.keys(files);
  const findings=[];
  const add=(severity,code,file,line,message)=>findings.push({severity,code,file,line,message});
  for(const entry of slice.files) {
    const name=entry.path;
    const data=files[name];
    if(typeof data!=="string") {add("error","missing_document",name,null,"Selected Markdown file is missing");continue;}
    if(SENSITIVE_PATH.test(name)) add("error","sensitive_path",name,null,"Selected filename indicates sensitive material");
    const rows=data.split(/\r?\n/);
    for(let i=0;i<rows.length;i++) {
      const line=rows[i];
      for(const {code,test} of SENSITIVE_CONTENT) {
        if(test.test(line))add("error",code,name,i+1,"Possible secret in published document");
      }
      for(const phrase of blockText) {
        if(line.toLowerCase().includes(phrase.toLowerCase()))
          add("error","custom_block",name,i+1,"Matched a configured blocked phrase");
      }
      // Raw HTML may contain external resources or unreviewed embedded metadata.
      if(/<(?:script|iframe|object|embed|form|meta|link)\b/i.test(line))
        add("error","active_html",name,i+1,"Embedded HTML requires removal before publication");
      if(/<img\b|!\[[^\]]*\]\(https?:\/\//i.test(line))
        add("warning","external_resource",name,i+1,"Embedded or external image may transmit viewer data");
      for(const match of line.matchAll(LINK)) {
        const raw=(match[1]??match[2]).trim();
        const result=findTarget(raw,name,allPaths);
        if(result.blocked) add("error","unsafe_reference",name,i+1,"Reference escapes or uses an unsafe project path");
        else if(result.resolved && !allowed.has(result.resolved)) add("error","excluded_reference",name,i+1,"Reference targets a document outside this Slice");
        else if(result.unresolvedAsset) add("warning","unresolved_asset",name,i+1,"Asset is not part of the Markdown selection; review publication assets");
        else if(result.unresolvedDoc) add("warning","unresolved_reference",name,i+1,"Relative document reference could not be verified");
      }
    }
  }
  if(slice.entrypoint && !allowed.has(slice.entrypoint))
    add("error","entrypoint_outside_slice",null,null,"Slice entrypoint is not one of the published files");
  return {
    version:1, sliceId:slice.id, revision:slice.revision,
    visibility:slice.visibility, selectedPaths:slice.files.map(f=>f.path).sort(),
    selectedCount:slice.files.length, findings,
    errors:findings.filter(f=>f.severity==="error").length,
    warnings:findings.filter(f=>f.severity==="warning").length,
    note:"Best-effort preflight. Public and unlisted content is readable by anyone with its URL; gated content requires publisher-side authorization. Review all selected content manually."
  };
}
