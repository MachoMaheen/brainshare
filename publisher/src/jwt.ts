// Minimal HS256 JWT for Cloudflare Workers — uses Web Crypto, no deps.
// Designed for our gated-wrapper use case (one signing secret per worker).

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlBytes(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlStr(s: string): string {
  return b64urlBytes(enc.encode(s));
}

function b64urlDecode(s: string): Uint8Array {
  let pad = s.replace(/-/g, "+").replace(/_/g, "/");
  while (pad.length % 4) pad += "=";
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signJWT(payload: object, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const data = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(payload))}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64urlBytes(sig)}`;
}

export async function verifyJWT<T = unknown>(
  token: string,
  secret: string
): Promise<T | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encH, encP, sig] = parts;
  let valid = false;
  try {
    const key = await hmacKey(secret);
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      enc.encode(`${encH}.${encP}`)
    );
  } catch {
    return null;
  }
  if (!valid) return null;
  try {
    return JSON.parse(dec.decode(b64urlDecode(encP))) as T;
  } catch {
    return null;
  }
}

export interface TokenClaims {
  sub: string;          // wrap-id
  jti: string;          // token id (for revocation)
  iat: number;          // issued at (unix seconds)
  exp: number;          // expiry (unix seconds)
  max_views?: number;
  viewer?: string;
}
