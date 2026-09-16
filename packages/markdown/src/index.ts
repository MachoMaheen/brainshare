export interface MarkdownLink { raw: string; target: string; label?: string; kind: "wikilink" | "markdown"; }
export interface MarkdownDocument { frontmatter: Record<string,string>; body: string; title: string; links: MarkdownLink[]; }
export function parseMarkdown(input: string, fallbackTitle = "Untitled"): MarkdownDocument {
  const normalized = input.replace(/\r\n/g, "\n"); let body = normalized; const frontmatter: Record<string,string> = {};
  if (normalized.startsWith("---\n")) { const end = normalized.indexOf("\n---\n", 4); if (end >= 0) { for (const line of normalized.slice(4, end).split("\n")) { const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/); if (m) frontmatter[m[1]] = m[2].replace(/^['"]|['"]$/g, ""); } body = normalized.slice(end + 5); } }
  const h1 = body.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim(); const title = h1 || frontmatter.title || fallbackTitle;
  return { frontmatter, body, title, links: extractMarkdownLinks(body) };
}
export function extractMarkdownLinks(body: string): MarkdownLink[] {
  const scrubbed = body.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, ""); const out: MarkdownLink[] = [];
  const wiki = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g; for (const m of scrubbed.matchAll(wiki)) out.push({ raw:m[0], target:m[1].trim(), label:m[2]?.trim(), kind:"wikilink" });
  const md = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g; for (const m of scrubbed.matchAll(md)) { const target = m[2].trim(); if (/^(https?:|mailto:|#)/i.test(target)) continue; out.push({ raw:m[0], target:target.split("#")[0], label:m[1], kind:"markdown" }); }
  return out;
}
export function escapeHtml(value: string): string { return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
export function renderMarkdownLite(markdown: string): string {
  const { body } = parseMarkdown(markdown); const lines = body.split("\n"); const html: string[] = []; let inCode = false, code: string[] = [], list: "ul"|"ol"|null = null;
  const closeList = () => { if (list) { html.push(`</${list}>`); list = null; } };
  const inline = (s:string) => {
    let v = escapeHtml(s);
    v = v.replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>");
    v = v.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_m,label,target)=>{
      const t=String(target).trim();
      if(/^https?:\/\//i.test(t))return `<a href="${t}" target="_blank" rel="noreferrer">${label}</a>`;
      if(/^mailto:/i.test(t))return `<a href="${t}">${label}</a>`;
      if(t.startsWith("#"))return `<a href="${t}">${label}</a>`;
      return `<span class="wikilink local-link" data-target="${t.split("#")[0]}">${label}</span>`;
    });
    v = v.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_m,t,l)=>`<span class="wikilink" data-target="${escapeHtml(t)}">${escapeHtml(l||t)}</span>`);
    return v;
  };
  for (const line of lines) { if (line.startsWith("```")) { closeList(); if (!inCode) { inCode=true; code=[]; } else { html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); inCode=false; } continue; } if (inCode) { code.push(line); continue; } if (!line.trim()) { closeList(); continue; } const h = line.match(/^(#{1,6})\s+(.+)$/); if (h) { closeList(); const n=h[1].length; html.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; } const task=line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/); if(task){ if(list!=="ul"){closeList();list="ul";html.push("<ul>");} html.push(`<li class="task"><input type="checkbox" disabled ${task[1].trim()?"checked":""}> ${inline(task[2])}</li>`); continue; } const ul=line.match(/^[-*]\s+(.+)$/); if(ul){ if(list!=="ul"){closeList();list="ul";html.push("<ul>");} html.push(`<li>${inline(ul[1])}</li>`); continue; } const ol=line.match(/^\d+[.)]\s+(.+)$/); if(ol){ if(list!=="ol"){closeList();list="ol";html.push("<ol>");} html.push(`<li>${inline(ol[1])}</li>`); continue; } if(line.startsWith("> ")) { closeList(); html.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; } closeList(); html.push(`<p>${inline(line)}</p>`); }
  closeList(); if(inCode) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); return html.join("\n");
}
