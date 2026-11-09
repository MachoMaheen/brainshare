// SPDX-License-Identifier: AGPL-3.0-only
const EMBEDDED_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|bmp|svg|pdf|mp4|webm|mov|mp3|m4a|wav|ogg)$/i;

/** Extract local embeds, not ordinary links or examples inside fenced code. */
export function extractEmbeddedMediaTargets(markdown: string): string[] {
  const withoutFences = markdown.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*(?:\n|$)/gm, "");
  const visible = withoutFences
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(`+)[^`\n]*\1/g, "");
  const targets: string[] = [];
  const obsidianEmbed = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = obsidianEmbed.exec(visible)) !== null) {
    if (match.index > 0 && visible[match.index - 1] === "\\") continue;
    targets.push(match[1].trim());
  }
  const markdownEmbed = /!\[[^\]]*\]\((<[^>]+>|[^)\n]+)\)/g;
  while ((match = markdownEmbed.exec(visible)) !== null) {
    if (match.index > 0 && visible[match.index - 1] === "\\") continue;
    let src = match[1].trim();
    // Markdown supports an optional quoted title after the path.
    src = src.replace(/\s+["'][^"']*["']\s*$/, "").trim();
    if (/^(?:https?:|data:|blob:|\/\/)/i.test(src)) continue;
    targets.push(src);
  }
  return [...new Set(targets.filter(target => EMBEDDED_EXTENSIONS.test(target.split(/[?#]/)[0])))];
}
