// SPDX-License-Identifier: AGPL-3.0-only
import { App, TFile, requestUrl, normalizePath } from "obsidian";

// The Worker intentionally accepts only inert raster images in KV. Other
// attachments require a separate reviewed storage/serving policy (R2).
export const SUPPORTED_IMAGE_MIMES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", avif: "image/avif", bmp: "image/bmp",
};
const EMBEDDED_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|bmp|svg|pdf|mp4|webm|mov|mp3|m4a|wav|ogg)$/i;
const MAX_IMAGE_BYTES = 5_000_000;

export interface LocalMedia {
  reference: string; file: TFile; mime: string;
}

/** Extract local embeds, not ordinary links or examples inside fenced code. */
export function extractEmbeddedMediaTargets(markdown: string): string[] {
  const withoutFences = markdown.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*(?:\n|$)/gm, "");
  const targets: string[] = [];
  const obsidianEmbed = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = obsidianEmbed.exec(withoutFences)) !== null) {
    targets.push(match[1].trim());
  }
  const markdownEmbed = /!\[[^\]]*\]\((<[^>]+>|[^)\n]+)\)/g;
  while ((match = markdownEmbed.exec(withoutFences)) !== null) {
    let src = match[1].trim().replace(/^<|>$/g, "");
    // Markdown supports an optional quoted title after the path.
    src = src.replace(/\s+["'][^"']*["']\s*$/, "").trim();
    if (/^(?:https?:|data:|blob:|\/\/)/i.test(src)) continue;
    targets.push(src);
  }
  return [...new Set(targets.filter(target => EMBEDDED_EXTENSIONS.test(target.split(/[?#]/)[0])))];
}

function decoded(target: string): string {
  try { return decodeURIComponent(target); } catch { return target; }
}

/** Obsidian's link resolver handles attachment folders and vault-wide aliases. */
export function resolveNoteMedia(app: App, note: TFile, markdown: string): LocalMedia[] {
  return extractEmbeddedMediaTargets(markdown).map((reference) => {
    const lookup = decoded(reference.split(/[?#]/)[0]);
    const extension = lookup.split(".").pop()?.toLowerCase() ?? "";
    const mime = SUPPORTED_IMAGE_MIMES[extension];
    if (!mime) throw new Error(`Unsupported embedded attachment "${reference}" in ${note.path}. Currently publishable: PNG, JPEG, GIF, WebP, AVIF and BMP.`);
    const viaCache = app.metadataCache.getFirstLinkpathDest(lookup, note.path);
    const folder = note.path.includes("/") ? note.path.slice(0, note.path.lastIndexOf("/")) : "";
    const candidate = app.vault.getAbstractFileByPath(normalizePath(folder ? folder + "/" + lookup : lookup))
      ?? app.vault.getAbstractFileByPath(normalizePath(lookup));
    const file = viaCache instanceof TFile ? viaCache : candidate;
    if (!(file instanceof TFile) || SUPPORTED_IMAGE_MIMES[file.extension.toLowerCase()] !== mime) {
      throw new Error(`Cannot resolve local image "${reference}" referenced by ${note.path}. Check the attachment path before publishing.`);
    }
    if (file.stat.size > MAX_IMAGE_BYTES) {
      throw new Error(`Image "${file.path}" exceeds BrainShare's 5 MB KV limit. Compress it before publishing.`);
    }
    return { reference, file, mime };
  });
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Fail closed: all referenced local media must upload successfully before the
 * associated Markdown/manifest is published. Uploads are SHA-256 addressed and
 * idempotent. A per-note manifest avoids basename collisions between notes.
 */
export async function uploadNoteMedia(
  app: App, note: TFile, markdown: string, publisherUrl: string, publisherToken: string,
  resolved?: LocalMedia[],
): Promise<Record<string, string>> {
  const media = resolved ?? resolveNoteMedia(app, note, markdown);
  const assets: Record<string, string> = {};
  const uploaded = new Map<string, string>();
  for (const item of media) {
    let key = uploaded.get(item.file.path);
    if (!key) {
      const bytes = await app.vault.readBinary(item.file);
      if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`Image too large: ${item.file.path}`);
      key = await sha256(bytes);
      const response = await requestUrl({
        url: `${publisherUrl}/api/assets/${key}`,
        method: "PUT",
        headers: { authorization: `Bearer ${publisherToken}`, "content-type": item.mime },
        body: bytes, throw: false,
      });
      if (response.status >= 400) {
        throw new Error(`Asset upload failed for "${item.file.path}" (HTTP ${response.status}): ${(response.text ?? "").slice(0, 160)}`);
      }
      uploaded.set(item.file.path, key);
    }
    assets[item.reference] = key;
    assets[item.file.path] = key;
  }
  return assets;
}
