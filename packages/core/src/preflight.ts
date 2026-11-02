// SPDX-License-Identifier: AGPL-3.0-only
// Shared best-effort scanner for editor-side pre-publish review.
// Only code/location is returned: detected credential values must not appear in UI or logs.
export interface PublicationFinding { code: string; line: number | null; message: string; }

const secretPatterns: Array<[string, RegExp]> = [
  ["private_key", /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i],
  ["cloud_access_key", /\\b(?:AKIA|ASIA)[A-Z0-9]{16}\\b/],
  ["github_token", /\\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\\b|\\bgithub_pat_[A-Za-z0-9_]{20,}\\b/],
  ["api_token", /\\b(?:sk-[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,})\\b/],
  ["credential_assignment", /\\b(?:api[_-]?key|client[_-]?secret|password|auth[_-]?token)\\s*[:=]\\s*["']?(?!example\\b|placeholder\\b|redacted\\b|your[_-])[A-Za-z0-9_+/=-]{16,}/i],
];
const sensitivePath = /(^|\\/)(?:\\.env(?:\\.|$)|\\.ssh(?:\\/|$)|\\.aws(?:\\/|$)|id_(?:rsa|ed25519)(?:\\.|$)|[^/]*(?:secret|credentials|private[_-]key)[^/]*)(?:\\/|$)/i;

export function scanPublicationMarkdown(filename: string, markdown: string): PublicationFinding[] {
  const findings: PublicationFinding[] = [];
  if(sensitivePath.test(filename)) findings.push({code:"sensitive_path",line:null,message:"Selected path may contain private material"});
  for(const [index,line] of markdown.split(/\\r?\\n/).entries()) {
    for(const [code,pattern] of secretPatterns) {
      if(pattern.test(line)) findings.push({code,line:index+1,message:"Possible credential in document"});
    }
    if(/<(?:script|iframe|object|embed|form|meta|link)\\b/i.test(line))
      findings.push({code:"active_html",line:index+1,message:"Embedded HTML should be removed"});
  }
  return findings;
}
