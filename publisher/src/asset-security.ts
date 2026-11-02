// SPDX-License-Identifier: AGPL-3.0-only
// Image bytes are treated as untrusted; do not trust client supplied MIME or key.
export const MAX_ASSET_BYTES = 5_000_000;
export const SAFE_IMAGE_MIMES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/avif", "image/bmp"
]);
export function sniffSafeImage(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  const ascii = (offset:number,length:number) => String.fromCharCode(...bytes.subarray(offset,offset+length));
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)) return "image/png";
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return "image/jpeg";
  if (ascii(0,6)==="GIF87a" || ascii(0,6)==="GIF89a") return "image/gif";
  if (ascii(0,4)==="RIFF" && ascii(8,4)==="WEBP") return "image/webp";
  if (ascii(4,4)==="ftyp" && (ascii(8,4)==="avif" || ascii(8,4)==="avis")) return "image/avif";
  if (bytes[0]===0x42 && bytes[1]===0x4d) return "image/bmp";
  // SVG, XML, HTML, PDF, and all unknown or polyglot formats fail closed.
  return null;
}
export function safeStoredImageMime(metadata: unknown): string | null {
  if (!metadata || typeof metadata!=="object") return null;
  const value=(metadata as {contentType?:unknown}).contentType;
  return typeof value==="string" && SAFE_IMAGE_MIMES.has(value) ? value : null;
}
export async function digestSha256Hex(bytes:ArrayBuffer):Promise<string> {
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,"0")).join("");
}
