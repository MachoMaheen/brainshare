// SPDX-License-Identifier: AGPL-3.0-only
import { App, TFile, requestUrl, normalizePath } from "obsidian";
import { extractEmbeddedMediaTargets } from "./media-extract";

// The Worker intentionally accepts only inert raster images in KV. Other
// attachments require a separate reviewed storage/serving policy (R2).
export const SUPPORTED_IMAGE_MIMES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", avif: "image/avif", bmp: "image/bmp",
};
const MAX_IMAGE_BYTES = 5_000_000;

export interface LocalMedia {
  reference: string; file: TFile; mime: string;
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

/**
 * The Worker deliberately rejects embedded image metadata. For static images
 * re-encode in the Obsidian renderer before upload so EXIF/XMP/text chunks do
 * not get published. Do not silently flatten animated GIFs.
 */
async function privacySafeBytes(bytes: ArrayBuffer, mime: string, filePath: string): Promise<ArrayBuffer> {
  const raw = new TextDecoder("latin1").decode(bytes);
  const markers = ["Exif", "exif", "eXIf", "tEXt", "iTXt", "zTXt", "XMP", "xmp", "http://ns.adobe.com/xap"];
  if (!markers.some(marker => raw.includes(marker))) return bytes;
  // Canvas re-encoding would silently remove animation frames. Never flatten
  // an animated PNG/WebP just to strip metadata.
  if ((mime === "image/png" && raw.includes("acTL")) ||
      (mime === "image/webp" && (raw.includes("ANIM") || raw.includes("ANMF")))) {
    throw new Error(`Animated image "${filePath}" contains metadata. Export a clean animated copy before publishing.`);
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) {
    throw new Error(`Image "${filePath}" contains metadata that cannot safely be removed automatically from ${mime}. Export a metadata-free copy first.`);
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error(`Image "${filePath}" contains metadata; this Obsidian environment does not support safe re-encoding.`);
  }
  const bitmap = await createImageBitmap(new Blob([bytes], {type:mime}));
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(bitmap, 0, 0);
    const cleaned = await new Promise<Blob>((resolve,reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image conversion failed")), mime, 0.96)
    );
    if (cleaned.type !== mime) throw new Error(`Image format ${mime} not supported for safe re-encoding`);
    return await cleaned.arrayBuffer();
  } catch (e) {
    throw new Error(`Could not safely strip metadata from "${filePath}": ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    bitmap.close();
  }
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
      const originalBytes = await app.vault.readBinary(item.file);
      if (originalBytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`Image too large: ${item.file.path}`);
      const bytes = await privacySafeBytes(originalBytes, item.mime, item.file.path);
      if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`Sanitized image too large: ${item.file.path}`);
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
    // Store the exact Markdown reference, not a second full-path alias.
    // The per-note scope resolves same-basename attachments without collisions.
    assets[item.reference] = key;
  }
  return assets;
}
