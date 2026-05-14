import {
  renderNote,
  renderWrapper,
  renderGateError,
  renderCanvas,
  renderOgCard,
  buildShareSet,
  loadNotes,
  loadNotesMeta,
  loadCanvasMeta,
  buildBacklinks,
  folderSiblings,
  NoteMeta,
  WrapData,
} from "./render";
import { signJWT, verifyJWT, TokenClaims } from "./jwt";
import { zipSync } from "fflate";

interface Env {
  NOTES: KVNamespace;
  PUBLISHER_TOKEN: string;
  JWT_SECRET: string;
}

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function unauthorized(env: Env, req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  return auth !== `Bearer ${env.PUBLISHER_TOKEN}`;
}

function forbidden(): Response {
  return new Response("forbidden", { status: 403 });
}

// Per-IP rate limiting via KV. KV is eventually consistent, so this leaks slightly under
// concurrent edge requests — fine for "stop a flood from one IP", not a hard ceiling.
async function rateLimitOk(
  env: Env,
  req: Request,
  bucket: string,
  max: number,
  windowSec: number
): Promise<boolean> {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const k = `ratelimit:${bucket}:${ip}`;
  const cur = parseInt((await env.NOTES.get(k)) ?? "0", 10);
  if (cur >= max) return false;
  await env.NOTES.put(k, String(cur + 1), { expirationTtl: windowSec });
  return true;
}

function rateLimited(retryAfterSec: number): Response {
  return new Response("rate limit exceeded — slow down", {
    status: 429,
    headers: { "retry-after": String(retryAfterSec), "content-type": "text/plain" },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function getNotePath(notes: KVNamespace, ulid: string): Promise<string | undefined> {
  const raw = await notes.get(`meta:${ulid}`);
  if (!raw) return undefined;
  try { return (JSON.parse(raw) as NoteMeta).path; } catch { return undefined; }
}

async function buildCanvasSet(notes: KVNamespace, ulids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!ulids.length) return out;
  const metas = await Promise.all(ulids.map((u) => notes.get(`canvasmeta:${u}`)));
  for (let i = 0; i < ulids.length; i++) {
    const raw = metas[i];
    if (!raw) { out.set(ulids[i], ulids[i]); continue; }
    try {
      const meta = JSON.parse(raw) as NoteMeta;
      out.set(meta.basename, ulids[i]);
    } catch {
      out.set(ulids[i], ulids[i]);
    }
  }
  return out;
}

interface GateOk { ok: true; tokenQuery: string }
interface GateBlock { ok: false; resp: Response }

async function checkGate(
  env: Env,
  wrap: WrapData,
  wrapId: string,
  url: URL
): Promise<GateOk | GateBlock> {
  if (!wrap.gated) return { ok: true, tokenQuery: "" };

  if (!env.JWT_SECRET) {
    return { ok: false, resp: html(renderGateError("Server misconfigured: JWT_SECRET not set."), 500) };
  }
  const t = url.searchParams.get("t");
  if (!t) {
    return {
      ok: false,
      resp: html(renderGateError("This share is gated. A valid access token is required (?t=…)."), 401),
    };
  }
  const claims = await verifyJWT<TokenClaims>(t, env.JWT_SECRET);
  if (!claims) {
    return { ok: false, resp: html(renderGateError("Invalid token signature."), 401) };
  }
  if (claims.sub !== wrapId) {
    return { ok: false, resp: html(renderGateError("Token does not match this share."), 403) };
  }
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) {
    return { ok: false, resp: html(renderGateError("This access token has expired."), 401) };
  }
  if (await env.NOTES.get(`revoked:${claims.jti}`)) {
    return { ok: false, resp: html(renderGateError("This access token has been revoked."), 401) };
  }
  if (claims.max_views) {
    const c = parseInt((await env.NOTES.get(`views:${claims.jti}`)) ?? "0", 10);
    if (c >= claims.max_views) {
      return { ok: false, resp: html(renderGateError("This token has reached its view limit."), 401) };
    }
    await env.NOTES.put(`views:${claims.jti}`, String(c + 1));
  }
  return { ok: true, tokenQuery: `?t=${encodeURIComponent(t)}` };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const origin = url.origin;

    // PUT /api/notes/:ulid — store note + filename metadata (auth required)
    const noteMatch = path.match(/^\/api\/notes\/([0-9A-HJKMNP-TV-Z]{26})$/);
    if (noteMatch) {
      if (unauthorized(env, req)) return forbidden();
      if (req.method === "PUT" && !(await rateLimitOk(env, req, "notes", 120, 60))) return rateLimited(60);
      const ulid = noteMatch[1];
      if (req.method === "PUT") {
        const body = await req.text();
        if (body.length > 1_000_000) {
          return new Response("note too large (>1MB)", { status: 413 });
        }
        await env.NOTES.put(`note:${ulid}`, body);
        let notePath = req.headers.get("x-note-path");
        if (notePath) {
          // Path may arrive URI-encoded (HTTP headers are latin-1, so non-ASCII paths
          // — em-dashes, arrows, etc — must be percent-encoded by the client).
          // decodeURIComponent fails on a literal `%` not part of a valid escape; in
          // that case treat the value as already-decoded raw text.
          try { notePath = decodeURIComponent(notePath); } catch { /* keep raw */ }
          const basename = notePath.split("/").pop()!.replace(/\.md$/i, "");
          await env.NOTES.put(`meta:${ulid}`, JSON.stringify({ path: notePath, basename }));
        }
        return json({ ulid, url: `${origin}/${ulid}` });
      }
      if (req.method === "DELETE") {
        await env.NOTES.delete(`note:${ulid}`);
        await env.NOTES.delete(`meta:${ulid}`);
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }

    // PUT/DELETE /api/canvases/:ulid — store/delete a JSON Canvas file (auth required)
    const canvasMatch = path.match(/^\/api\/canvases\/([0-9A-HJKMNP-TV-Z]{26})$/);
    if (canvasMatch) {
      if (unauthorized(env, req)) return forbidden();
      if (req.method === "PUT" && !(await rateLimitOk(env, req, "notes", 120, 60))) return rateLimited(60);
      const ulid = canvasMatch[1];
      if (req.method === "PUT") {
        const body = await req.text();
        if (body.length > 2_000_000) return new Response("canvas too large (>2MB)", { status: 413 });
        try { JSON.parse(body); } catch { return new Response("invalid JSON", { status: 400 }); }
        await env.NOTES.put(`canvas:${ulid}`, body);
        let p = req.headers.get("x-note-path");
        if (p) {
          try { p = decodeURIComponent(p); } catch { /* keep raw */ }
          const basename = p.split("/").pop()!.replace(/\.canvas$/i, "");
          await env.NOTES.put(`canvasmeta:${ulid}`, JSON.stringify({ path: p, basename }));
        }
        return json({ ulid, url: `${origin}/c/${ulid}` });
      }
      if (req.method === "DELETE") {
        await env.NOTES.delete(`canvas:${ulid}`);
        await env.NOTES.delete(`canvasmeta:${ulid}`);
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }

    // PUT/GET /api/assets/:key — opaque-keyed binary uploads (images etc).
    // Key is a 64-char hex sha256 chosen by the uploader. PUT requires auth; GET is
    // public (the long random key is the capability — only people who know it can fetch).
    const assetMatch = path.match(/^\/(?:api\/)?asset(?:s)?\/([a-f0-9]{16,128})(?:\.[a-z0-9]+)?$/i);
    if (assetMatch) {
      const key = assetMatch[1].toLowerCase();
      if (req.method === "PUT") {
        if (unauthorized(env, req)) return forbidden();
        if (!(await rateLimitOk(env, req, "asset-put", 60, 60))) return rateLimited(60);
        const ct = req.headers.get("content-type") ?? "application/octet-stream";
        const buf = await req.arrayBuffer();
        if (buf.byteLength > 5_000_000) return new Response("asset too large (>5MB)", { status: 413 });
        await env.NOTES.put(`asset:${key}`, buf, { metadata: { contentType: ct } });
        return json({ key, url: `${origin}/asset/${key}` });
      }
      if (req.method === "GET") {
        const { value, metadata } = await env.NOTES.getWithMetadata(`asset:${key}`, "arrayBuffer");
        if (!value) return new Response("not found", { status: 404 });
        const ct = (metadata as { contentType?: string } | null)?.contentType ?? "application/octet-stream";
        return new Response(value, {
          headers: {
            "content-type": ct,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      }
      if (req.method === "DELETE" && !unauthorized(env, req)) {
        await env.NOTES.delete(`asset:${key}`);
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }

    // GET /api/export — stream every KV key/value as NDJSON for backup (auth required)
    if (path === "/api/export") {
      if (unauthorized(env, req)) return forbidden();
      if (req.method !== "GET") return new Response("method not allowed", { status: 405 });
      const lines: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const list = await env.NOTES.list({ cursor, limit: 1000 });
        for (const k of list.keys) {
          const value = await env.NOTES.get(k.name);
          lines.push(JSON.stringify({ key: k.name, value }));
        }
        cursor = list.list_complete ? undefined : list.cursor;
        pages++;
        if (pages > 20) break; // safety: 20k keys hard cap; bump if you outgrow this
      } while (cursor);
      return new Response(lines.join("\n") + "\n", {
        headers: {
          "content-type": "application/x-ndjson",
          "content-disposition": `attachment; filename="brainshare-backup-${new Date().toISOString().slice(0, 19)}.ndjson"`,
        },
      });
    }

    // POST /api/wrappers/:id/tokens — mint an access token for a gated wrapper
    const mintMatch = path.match(/^\/api\/wrappers\/([a-zA-Z0-9_-]{1,64})\/tokens$/);
    if (mintMatch) {
      if (unauthorized(env, req)) return forbidden();
      if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
      if (!(await rateLimitOk(env, req, "mint", 30, 60))) return rateLimited(60);
      if (!env.JWT_SECRET) return new Response("JWT_SECRET not configured", { status: 500 });
      const id = mintMatch[1];
      const wrapRaw = await env.NOTES.get(`wrap:${id}`);
      if (!wrapRaw) return new Response("wrapper not found", { status: 404 });

      let body: { exp_seconds?: number; exp_days?: number; max_views?: number; viewer?: string };
      try { body = await req.json(); } catch { body = {}; }

      const now = Math.floor(Date.now() / 1000);
      const expSeconds = body.exp_seconds ?? (body.exp_days ?? 7) * 86400;
      const exp = now + expSeconds;
      const jti = crypto.randomUUID();
      const claims: TokenClaims = {
        sub: id,
        jti,
        iat: now,
        exp,
        ...(body.max_views ? { max_views: body.max_views } : {}),
        ...(body.viewer ? { viewer: body.viewer } : {}),
      };
      const jwt = await signJWT(claims, env.JWT_SECRET);
      return json({
        jti,
        jwt,
        url: `${origin}/share/${id}?t=${jwt}`,
        exp,
        viewer: body.viewer,
        max_views: body.max_views,
      });
    }

    // POST /api/wrappers/:id/revoke — revoke a token by jti
    const revokeMatch = path.match(/^\/api\/wrappers\/([a-zA-Z0-9_-]{1,64})\/revoke$/);
    if (revokeMatch) {
      if (unauthorized(env, req)) return forbidden();
      if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
      if (!(await rateLimitOk(env, req, "revoke", 30, 60))) return rateLimited(60);
      let body: { jti?: string };
      try { body = await req.json(); } catch { body = {}; }
      if (!body.jti) return new Response("missing jti", { status: 400 });
      await env.NOTES.put(`revoked:${body.jti}`, "1");
      return json({ jti: body.jti, revoked: true });
    }

    // GET/PUT/DELETE /api/wrappers/:id — read/write/delete wrapper (auth required)
    const wrapMatch = path.match(/^\/api\/wrappers\/([a-zA-Z0-9_-]{1,64})$/);
    if (wrapMatch) {
      if (unauthorized(env, req)) return forbidden();
      if (req.method === "PUT" && !(await rateLimitOk(env, req, "wrap", 60, 60))) return rateLimited(60);
      const id = wrapMatch[1];
      if (req.method === "GET") {
        const raw = await env.NOTES.get(`wrap:${id}`);
        if (!raw) return new Response("wrapper not found", { status: 404 });
        return new Response(raw, { headers: { "content-type": "application/json" } });
      }
      if (req.method === "PUT") {
        const body = await req.text();
        let parsed: WrapData;
        try {
          parsed = JSON.parse(body);
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        if (!parsed.ulids || !Array.isArray(parsed.ulids)) {
          return new Response("missing ulids[]", { status: 400 });
        }
        for (const u of parsed.ulids) {
          if (!ULID_PATTERN.test(u)) {
            return new Response(`bad ulid: ${u}`, { status: 400 });
          }
        }
        if (parsed.canvases) {
          if (!Array.isArray(parsed.canvases)) return new Response("canvases must be array", { status: 400 });
          for (const u of parsed.canvases) {
            if (!ULID_PATTERN.test(u)) return new Response(`bad canvas ulid: ${u}`, { status: 400 });
          }
        }
        if (parsed.assets && (typeof parsed.assets !== "object" || Array.isArray(parsed.assets))) {
          return new Response("assets must be { filename: key } object", { status: 400 });
        }
        if (!parsed.created_at) parsed.created_at = new Date().toISOString();
        if (parsed.gated !== true) parsed.gated = false; // normalize
        await env.NOTES.put(`wrap:${id}`, JSON.stringify(parsed));
        return json({ id, url: `${origin}/share/${id}`, gated: parsed.gated, canvases: parsed.canvases?.length ?? 0, assets: Object.keys(parsed.assets ?? {}).length });
      }
      if (req.method === "DELETE") {
        await env.NOTES.delete(`wrap:${id}`);
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }

    // GET /share/:wrapId/download — return the slice as a zipped Obsidian-compatible vault
    const downloadMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/download$/);
    if (downloadMatch && req.method === "GET") {
      const wrapId = downloadMatch[1];
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw) return html("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(wrapRaw) as WrapData;
      const gate = await checkGate(env, wrap, wrapId, url);
      if (!gate.ok) return gate.resp;

      const records = await loadNotes(env.NOTES, wrap.ulids);
      const files: Record<string, Uint8Array> = {};
      const enc = new TextEncoder();
      for (const r of records) {
        if (!r.md) continue;
        // Preserve original vault path so the ZIP round-trips into any Obsidian vault.
        const filePath = r.path || `${r.ulid}.md`;
        files[filePath] = enc.encode(r.md);
      }
      // Bundle a manifest so re-importers know which wrapper this came from + which
      // ULIDs the slice contained — needed for the future sync/contribute-back flow.
      files["brainshare.json"] = enc.encode(JSON.stringify({
        wrapId,
        title: wrap.title ?? null,
        description: wrap.description ?? null,
        gated: !!wrap.gated,
        ulids: wrap.ulids,
        created_at: wrap.created_at ?? null,
        publisher: origin,
        exported_at: new Date().toISOString(),
      }, null, 2));

      const zipped = zipSync(files);
      return new Response(zipped, {
        headers: {
          "content-type": "application/zip",
          "content-disposition": `attachment; filename="${wrapId}.zip"`,
          "cache-control": "no-store",
        },
      });
    }

    // GET /share/:wrapId/api/search?q=… — full-text search across the wrapper's
    // note bodies. Used by the command-palette UI when the user types 3+ chars.
    // Returns case-insensitive substring matches with ±60-char snippets.
    const searchMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/api\/search$/);
    if (searchMatch && req.method === "GET") {
      const wrapId = searchMatch[1];
      const q = (url.searchParams.get("q") ?? "").trim();
      if (q.length < 2) return json({ matches: [] });

      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw) return new Response("not found", { status: 404 });
      const wrap = JSON.parse(wrapRaw) as WrapData;
      const gate = await checkGate(env, wrap, wrapId, url);
      if (!gate.ok) return gate.resp;

      const records = await loadNotes(env.NOTES, wrap.ulids);
      const qLower = q.toLowerCase();
      const matches: Array<{
        ulid: string; title: string; path: string;
        snippet: string; matchOffset: number; bodyHits: number;
      }> = [];
      for (const r of records) {
        if (!r.md) continue;
        const titleHit = r.title.toLowerCase().includes(qLower);
        const bodyLower = r.md.toLowerCase();
        const idx = bodyLower.indexOf(qLower);
        if (!titleHit && idx < 0) continue;

        // For body-only matches, return a snippet centred on the first hit.
        // For title-only matches, fall back to the start of the note.
        const anchor = idx >= 0 ? idx : 0;
        // Strip YAML frontmatter so snippets never start with "--- title: ..."
        const mdBody = r.md.replace(/^---[\s\S]*?\n---\s*\n/, "");
        const bodyLowerClean = mdBody.toLowerCase();
        const idxClean = bodyLowerClean.indexOf(qLower);
        const anchorClean = idxClean >= 0 ? idxClean : 0;
        let startClean = Math.max(0, anchorClean - 120);
        let endClean = Math.min(mdBody.length, anchorClean + q.length + 120);
        // Strip frontmatter from snippet if anchor is past it
        const fmMatch = r.md.match(/^---[\s\S]*?\n---\s*\n/);
        const bodyStart = fmMatch ? fmMatch[0].length : 0;
        if (startClean < bodyStart && anchorClean >= bodyStart) startClean = bodyStart;
        // Snap start/end to word boundaries (avoid mid-word cuts)
        if (startClean > 0) {
          const wordStart = mdBody.slice(startClean, anchorClean).search(/\s/);
          if (wordStart >= 0 && wordStart < 30) startClean = startClean + wordStart + 1;
        }
        if (endClean < mdBody.length) {
          const tail = mdBody.slice(anchorClean + q.length, endClean);
          const lastSpace = tail.lastIndexOf(' ');
          if (lastSpace > tail.length - 30) endClean = anchorClean + q.length + lastSpace;
        }
        let snippet = mdBody.slice(startClean, endClean).replace(/\s+/g, " ").trim();
        if (startClean > 0) snippet = "…" + snippet;
        if (endClean < mdBody.length) snippet = snippet + "…";
        // Count occurrences for ranking (capped — full count is wasteful)
        let bodyHits = 0;
        let scan = bodyLower.indexOf(qLower);
        while (scan !== -1 && bodyHits < 50) {
          bodyHits++;
          scan = bodyLower.indexOf(qLower, scan + qLower.length);
        }
        matches.push({
          ulid: r.ulid,
          title: r.title,
          path: r.path,
          snippet,
          matchOffset: anchor,
          bodyHits: titleHit ? bodyHits + 5 : bodyHits, // title hits rank higher
        });
      }
      matches.sort((a, b) => b.bodyHits - a.bodyHits);
      return json({ matches: matches.slice(0, 30), query: q });
    }

    // GET /share/:wrapId/:ulid/og.svg — OpenGraph card for social previews.
    // Same gate as the note itself; for a gated share, the og.svg requires the
    // JWT (passed through as ?t=...). Unauthorized → 403. The note URL embeds
    // <meta property="og:image"> pointing here, so Slack/Discord/Mastodon/etc.
    // unfurl gated shares for recipients who have the link and silently skip
    // for everyone else.
    const ogMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/([0-9A-HJKMNP-TV-Z]{26})\/og\.svg$/);
    if (ogMatch && req.method === "GET") {
      const [, wrapId, ulid] = ogMatch;
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw) return new Response("wrapper not found", { status: 404 });
      const wrap = JSON.parse(wrapRaw) as WrapData;
      if (!wrap.ulids.includes(ulid)) return new Response("note not in this share", { status: 403 });
      const gate = await checkGate(env, wrap, wrapId, url);
      if (!gate.ok) return gate.resp;

      const [md, meta] = await Promise.all([
        env.NOTES.get(`note:${ulid}`),
        env.NOTES.get(`meta:${ulid}`),
      ]);
      if (!md) return new Response("note not yet published", { status: 404 });
      let basename = ulid, fullPath = "";
      if (meta) {
        try { const m = JSON.parse(meta) as NoteMeta; basename = m.basename || ulid; fullPath = m.path || ""; } catch {}
      }
      // Title resolution mirrors renderNote: body H1 → frontmatter → basename
      const bodyH1Match = md.match(/^---[\s\S]*?\n---\s*\n\s*#\s+(.+?)\s*$/m) ?? md.match(/^\s*#\s+(.+?)\s*$/m);
      const title = (bodyH1Match ? bodyH1Match[1].trim() : "") || basename;
      const folder = fullPath.includes("/") ? fullPath.split("/").slice(0, -1).join("/") : "";
      // Strip frontmatter, count words
      const body = md.replace(/^---[\s\S]*?\n---\s*\n/, "");
      const wordCount = (body.match(/\b\w+\b/g) ?? []).length;

      const svg = renderOgCard({
        title,
        wrapTitle: wrap.title ?? "",
        folder,
        wordCount,
        gated: wrap.gated,
      });
      return new Response(svg, {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=300, s-maxage=300",
        },
      });
    }

    /** Decode the creation timestamp embedded in a ULID. Returns ISO-8601 string. */
    function ulidToIso(ulid: string): string {
      const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
      const ts10 = ulid.slice(0, 10).toUpperCase();
      let ms = 0;
      for (let i = 0; i < ts10.length; i++) {
        ms = ms * 32 + CROCKFORD.indexOf(ts10[i]);
      }
      return new Date(ms).toISOString();
    }

    // GET /share/:wrapId/feed.xml — Atom feed of the latest-updated notes in
    // the share. Gated under the same JWT as the rest of the wrapper, so the
    // viewer can subscribe in their feed reader without ever logging in.
    const feedMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/feed\.xml$/);
    if (feedMatch && req.method === "GET") {
      const wrapId = feedMatch[1];
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw) return new Response("wrapper not found", { status: 404 });
      const wrap = JSON.parse(wrapRaw) as WrapData;
      const gate = await checkGate(env, wrap, wrapId, url);
      if (!gate.ok) return gate.resp;

      const records = await loadNotes(env.NOTES, wrap.ulids);
      const shareBase = `${origin}/share/${wrapId}`;
      const tq = gate.tokenQuery;
      // ULIDs are time-sortable (Crockford base32 of unix ms), so reverse-sort
      // gives newest-first. Best we can do without per-note updated_at fields.
      const sorted = [...records].sort((a, b) => b.ulid.localeCompare(a.ulid));
      const updated = wrap.created_at || new Date().toISOString();

      const xmlEscape = (s: string) => s
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

      const entries = sorted.slice(0, 20).map((r) => {
        if (!r.md) return "";
        const body = r.md.replace(/^---[\s\S]*?\n---\s*\n/, "").trim();
        const summary = body.slice(0, 400).replace(/\s+/g, " ");
        const entryUpdated = ulidToIso(r.ulid);
        return `  <entry>
    <title>${xmlEscape(r.title)}</title>
    <link href="${xmlEscape(shareBase + "/" + r.ulid + tq)}"/>
    <id>tag:brainshare,${entryUpdated.slice(0, 10)}:${r.ulid}</id>
    <updated>${xmlEscape(entryUpdated)}</updated>
    <summary>${xmlEscape(summary)}${body.length > 400 ? "…" : ""}</summary>
  </entry>`;
      }).filter(Boolean).join("\n");

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xmlEscape(wrap.title ?? "BrainShare slice")}</title>
  <subtitle>${xmlEscape(wrap.description ?? "")}</subtitle>
  <author><name>${xmlEscape(wrap.title ?? "BrainShare")}</name></author>
  <link href="${xmlEscape(shareBase + tq)}" rel="alternate"/>
  <link href="${xmlEscape(shareBase + "/feed.xml" + tq)}" rel="self"/>
  <id>tag:brainshare,${updated.slice(0, 10)}:${wrapId}</id>
  <updated>${xmlEscape(updated)}</updated>
${entries}
</feed>
`;
      return new Response(xml, {
        headers: {
          "content-type": "application/atom+xml; charset=utf-8",
          "cache-control": "public, max-age=600, s-maxage=600",
        },
      });
    }

    // GET /share/:wrapId/c/:ulid — canvas scoped to a wrapper
    const scopedCanvasMatch = path.match(
      /^\/share\/([a-zA-Z0-9_-]{1,64})\/c\/([0-9A-HJKMNP-TV-Z]{26})$/
    );
    if (scopedCanvasMatch && req.method === "GET") {
      const [, wrapId, ulid] = scopedCanvasMatch;
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw) return html("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(wrapRaw) as WrapData;
      if (!wrap.canvases?.includes(ulid)) {
        return html("<h1>403</h1><p>canvas not in this share</p>", 403);
      }
      const gate = await checkGate(env, wrap, wrapId, url);
      if (!gate.ok) return gate.resp;

      const [canvasJson, canvasPath, shareSet, canvasSet, treeNotes, treeCanvases] = await Promise.all([
        env.NOTES.get(`canvas:${ulid}`),
        env.NOTES.get(`canvasmeta:${ulid}`).then(r => r ? (JSON.parse(r) as NoteMeta).path : undefined),
        buildShareSet(env.NOTES, wrap.ulids),
        buildCanvasSet(env.NOTES, wrap.canvases),
        loadNotesMeta(env.NOTES, wrap.ulids),
        loadCanvasMeta(env.NOTES, wrap.canvases),
      ]);
      if (!canvasJson) return html("<h1>404</h1><p>canvas not yet published</p>", 404);
      const shareBase = `${origin}/share/${wrapId}`;
      return html(renderCanvas(canvasJson, ulid, {
        shareBase, shareSet, canvasSet,
        path: canvasPath, tokenQuery: gate.tokenQuery, gated: wrap.gated,
        wrapTree: {
          wrapTitle: wrap.title ?? "Shared slice",
          wrapDesc: wrap.description,
          notes: treeNotes,
          canvases: treeCanvases,
          assetCount: wrap.assets ? Object.keys(wrap.assets).length : 0,
        },
      }));
    }

    // GET /share/:wrapId/:ulid — note scoped to a wrapper's share-set
    const scopedMatch = path.match(
      /^\/share\/([a-zA-Z0-9_-]{1,64})\/([0-9A-HJKMNP-TV-Z]{26})$/
    );
    if (scopedMatch && req.method === "GET") {
      const [, wrapId, ulid] = scopedMatch;
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw) return html("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(wrapRaw) as WrapData;
      if (!wrap.ulids.includes(ulid)) {
        return html("<h1>403</h1><p>note not in this share</p>", 403);
      }
      const gate = await checkGate(env, wrap, wrapId, url);
      if (!gate.ok) return gate.resp;

      // Load full note records (incl. markdown bodies) for the whole share so
      // we can compute backlinks + folder-nav in one pass. This is ~N extra KV
      // reads per page view (one per note in the wrapper). Acceptable in the
      // alpha; if/when read budget becomes a concern, precompute a
      // backlinks:<wrapId> KV index at wrap-PUT time instead.
      const [allRecords, canvasSet, treeCanvases] = await Promise.all([
        loadNotes(env.NOTES, wrap.ulids),
        buildCanvasSet(env.NOTES, wrap.canvases ?? []),
        loadCanvasMeta(env.NOTES, wrap.canvases ?? []),
      ]);
      const current = allRecords.find((r) => r.ulid === ulid);
      if (!current || !current.md) return html("<h1>404</h1><p>note not yet published</p>", 404);
      // ?raw=1 returns the source markdown — used by the "Copy as Markdown"
      // button in the note action row and any agent that wants the body
      // verbatim. Token still required (raw is INSIDE the gate check above).
      if (url.searchParams.get("raw") === "1") {
        return new Response(current.md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
      }
      const shareSet = new Map(allRecords.map((r) => [r.basename, r.ulid]));
      const backlinksMap = buildBacklinks(allRecords);
      const treeNotes = allRecords.map(({ ulid, basename, path, title }) => ({ ulid, basename, path, title }));
      const folderNav = folderSiblings(
        { ulid: current.ulid, path: current.path },
        allRecords,
      );
      const shareBase = `${origin}/share/${wrapId}`;
      return html(renderNote(current.md, ulid, {
        shareBase,
        shareSet,
        canvasSet,
        assets: wrap.assets,
        path: current.path,
        tokenQuery: gate.tokenQuery,
        gated: wrap.gated,
        wrapTree: {
          wrapTitle: wrap.title ?? "Shared slice",
          wrapDesc: wrap.description,
          notes: treeNotes,
          canvases: treeCanvases,
          assetCount: wrap.assets ? Object.keys(wrap.assets).length : 0,
        },
        backlinks: (backlinksMap.get(ulid) ?? []).map((b) => ({
          ulid: b.ulid, title: b.title, path: b.path,
        })),
        folderNav,
      }));
    }

    // GET /c/:ulid — standalone canvas (no wrapper context)
    const standaloneCanvasMatch = path.match(/^\/c\/([0-9A-HJKMNP-TV-Z]{26})$/);
    if (standaloneCanvasMatch && req.method === "GET") {
      const ulid = standaloneCanvasMatch[1];
      const [canvasJson, metaRaw] = await Promise.all([
        env.NOTES.get(`canvas:${ulid}`),
        env.NOTES.get(`canvasmeta:${ulid}`),
      ]);
      if (!canvasJson) return html("<h1>404</h1><p>canvas not found</p>", 404);
      const canvasPath = metaRaw ? (JSON.parse(metaRaw) as NoteMeta).path : undefined;
      return html(renderCanvas(canvasJson, ulid, { path: canvasPath }));
    }

    // GET /share/:id — wrapper landing page
    const shareMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})$/);
    if (shareMatch && req.method === "GET") {
      const id = shareMatch[1];
      const raw = await env.NOTES.get(`wrap:${id}`);
      if (!raw) return html("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(raw) as WrapData;
      const gate = await checkGate(env, wrap, id, url);
      if (!gate.ok) return gate.resp;
      return html(await renderWrapper(env.NOTES, origin, id, wrap, gate.tokenQuery));
    }

    // GET /:ulid — standalone, never gated (no wrapper context)
    const getMatch = path.match(/^\/([0-9A-HJKMNP-TV-Z]{26})$/);
    if (getMatch && req.method === "GET") {
      const ulid = getMatch[1];
      const [md, notePath] = await Promise.all([
        env.NOTES.get(`note:${ulid}`),
        getNotePath(env.NOTES, ulid),
      ]);
      if (!md) return html("<h1>404</h1><p>note not found</p>", 404);
      return html(renderNote(md, ulid, { path: notePath }));
    }

    if (path === "/" && req.method === "GET") {
      // DEMO_WRAP_URL — set to a real wrapper URL (e.g. /share/<id>?t=<jwt>) before
      // public launch so the "Try the live demo" CTA goes somewhere useful. Until set,
      // the CTA falls back to a "demo coming soon" state. Configure via env (set
      // DEMO_WRAP_URL on the worker) or just edit the constant below.
      const demoUrl = (env as unknown as { DEMO_WRAP_URL?: string }).DEMO_WRAP_URL ?? "";
      const repoUrl = "https://github.com/MachoMaheen/brainshare";
      const ctaPrimary = demoUrl
        ? `<a class="cta cta-primary" href="${demoUrl}">▶ Try the live demo</a>`
        : `<a class="cta cta-primary cta-disabled" href="${repoUrl}">▶ Live demo (coming soon)</a>`;
      return html(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BrainShare — lend your brain. Anyone can read it. Anything can call it.</title>
<meta name="description" content="Lend your second brain. Pick notes and canvases from your Obsidian vault, get a URL with an interactive graph, full-text search, and per-recipient JWT access — readable by humans, queryable by agents. Free. Open source. No vendor lock-in.">
<style>
:root {
  --bg: #ffffff;
  --bg-2: #f5f6f8;
  --bg-card: #ffffff;
  --text: #1f2328;
  --text-2: #57606a;
  --muted: #8b949e;
  --accent: #7f6df2;
  --accent-2: #5b4ad6;
  --border: #e6e8eb;
  --border-faint: #eef0f2;
  --code-bg: #f6f8fa;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1014;
    --bg-2: #16181d;
    --bg-card: #1a1c22;
    --text: #e6e8ee;
    --text-2: #a8aebd;
    --muted: #6a6f80;
    --accent: #a882ff;
    --accent-2: #c2a7ff;
    --border: #2a2d35;
    --border-faint: #1f2228;
    --code-bg: #1a1c22;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 880px; margin: 0 auto; padding: 0 1.25em; }
header.hero {
  padding: 5em 0 3em;
  text-align: center;
  background:
    radial-gradient(ellipse at top, rgba(168,130,255,.12), transparent 60%),
    var(--bg);
  border-bottom: 1px solid var(--border-faint);
}
.brand {
  display: inline-flex; align-items: center; gap: .55em;
  font-size: .85em;
  color: var(--text-2);
  letter-spacing: .04em;
  margin-bottom: 1.2em;
}
.brand-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 14px var(--accent);
}
h1 {
  margin: 0 0 .35em;
  font-size: clamp(2em, 5vw, 3.2em);
  letter-spacing: -.02em;
  font-weight: 700;
  line-height: 1.05;
}
.tagline-emphatic {
  font-size: clamp(1.15em, 2.4vw, 1.55em);
  color: var(--text);
  margin: 0 auto .9em;
  max-width: 38em;
  font-weight: 500;
  letter-spacing: -.005em;
}
.tagline-emphatic .accent { color: var(--accent); }
.tagline {
  font-size: clamp(1em, 1.9vw, 1.15em);
  color: var(--text-2);
  margin: 0 auto 2em;
  max-width: 38em;
}
.ctas { display: flex; gap: .75em; justify-content: center; flex-wrap: wrap; }
.cta {
  display: inline-flex; align-items: center; gap: .4em;
  padding: .75em 1.4em;
  font-size: 1em; font-weight: 500;
  border-radius: 8px;
  text-decoration: none;
  transition: transform .12s, box-shadow .12s, background .12s;
}
.cta-primary { background: var(--accent); color: #fff; }
.cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(127,109,242,.35); }
.cta-disabled { opacity: .55; cursor: not-allowed; }
.cta-disabled:hover { transform: none; box-shadow: none; }
.cta-secondary {
  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
}
.cta-secondary:hover { border-color: var(--accent); color: var(--accent); }

section { padding: 3.5em 0; border-bottom: 1px solid var(--border-faint); }
section h2 {
  font-size: 1.5em;
  margin: 0 0 1em;
  letter-spacing: -.01em;
}
.feature-grid {
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.feature {
  background: var(--bg-card);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  padding: 1.2em 1.4em;
}
.feature-icon { font-size: 1.4em; line-height: 1; }
.feature h3 {
  font-size: 1em; margin: .5em 0 .3em;
  font-weight: 600;
}
.feature p { margin: 0; font-size: .92em; color: var(--text-2); }

.versus {
  background: var(--bg-2);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  padding: 1.2em 1.4em;
  display: grid;
  gap: .8em;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.versus-col h4 { margin: 0 0 .25em; font-size: .8em; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.versus-col p  { margin: 0; font-size: .92em; color: var(--text-2); }

pre, code {
  font-family: "SF Mono", "Menlo", ui-monospace, monospace;
}
.codeblock {
  background: var(--code-bg);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  padding: .9em 1.1em;
  overflow-x: auto;
  font-size: .88em;
  line-height: 1.55;
  margin: 0;
}
.codeblock .c { color: var(--muted); }
ol.steps { padding-left: 1.2em; margin: 0; }
ol.steps li { margin: .6em 0; color: var(--text-2); }
ol.steps li b { color: var(--text); }

footer {
  padding: 3em 0 4em;
  text-align: center;
  font-size: .88em;
  color: var(--muted);
}
footer a { color: var(--text-2); }
footer a:hover { color: var(--accent); }

details.api-ref { margin-top: 2em; }
details.api-ref summary {
  cursor: pointer;
  font-size: .9em;
  color: var(--text-2);
  padding: .6em 0;
}
details.api-ref summary:hover { color: var(--accent); }
details.api-ref ul { margin: .8em 0 0; padding-left: 1.2em; font-size: .88em; color: var(--text-2); }
details.api-ref code { background: var(--code-bg); padding: 1px 6px; border-radius: 4px; }
</style>
</head>
<body>
<header class="hero">
  <div class="wrap">
    <div class="brand"><span class="brand-dot"></span>BrainShare · open source · MIT</div>
    <h1>Lend your brain.</h1>
    <p class="tagline-emphatic"><span class="accent">Anyone</span> can read it. <span class="accent">Anything</span> can call it.</p>
    <p class="tagline">Pick notes and canvases from your Obsidian vault. Get a URL with an interactive graph, full-text search, and per-recipient JWT access — readable by humans, queryable by agents. Free. No vendor lock-in.</p>
    <div class="ctas">
      ${ctaPrimary}
      <a class="cta cta-secondary" href="${repoUrl}">View on GitHub</a>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>What you get when you share a slice</h2>
    <div class="feature-grid">
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Interactive graph view</h3>
        <p>Sigma.js force-directed graph that mirrors your Obsidian graph view — hover to focus a cluster, click to open.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Full-text + filename search</h3>
        <p>⌘K palette searches every note body in the slice. Sidebar filter narrows the file tree as you type.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Per-recipient JWT auth</h3>
        <p>Mint a token per viewer. Expirable, revocable, optional view-count cap. No login screens.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Canvases render natively</h3>
        <p>Colors, groups, bezier edges, file embeds — Obsidian's <code>.canvas</code> spec, faithfully.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Wikilinks resolve correctly</h3>
        <p>Links inside the share-set work. Targets outside become greyed-out "not in this share" labels — no leaks.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Cloudflare free tier</h3>
        <p>Worker + KV. ~1000 publishes/day before you pay anything. Globally cached reads.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Why not Quartz or Obsidian Publish?</h2>
    <div class="versus">
      <div class="versus-col">
        <h4>Quartz</h4>
        <p>Great for "publish my whole vault." Static site setup, full-rebuild per change, no per-recipient gating.</p>
      </div>
      <div class="versus-col">
        <h4>Obsidian Publish</h4>
        <p>Zero-config but $8–10/mo per site, all-or-nothing visibility, no programmatic API.</p>
      </div>
      <div class="versus-col">
        <h4>BrainShare</h4>
        <p><b>Per-slice publishing</b> with a live graph + auth, free on Cloudflare's tier, full programmatic API.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Get it</h2>
    <ol class="steps">
      <li><b>Beta install via BRAT</b> (Obsidian community-store PR pending review): add <code>MachoMaheen/brainshare</code> as a beta plugin.</li>
      <li><b>Deploy your own publisher</b> — clone the repo, <code>wrangler deploy</code>. Two minutes on Cloudflare's free tier:
<pre class="codeblock"><span class="c"># in the publisher/ folder</span>
npm install
wrangler kv:namespace create NOTES
wrangler deploy</pre>
      </li>
      <li><b>Open the BrainShare panel in Obsidian</b>, point it at your worker URL, pick a slice, hit publish — get a URL like <code>https://your-publisher/share/&lt;slice&gt;?t=&lt;jwt&gt;</code>.</li>
    </ol>
  </div>
</section>

<footer>
  <div class="wrap">
    <a href="${repoUrl}">github.com/MachoMaheen/brainshare</a> · MIT
    <details class="api-ref">
      <summary>API reference (for integrators)</summary>
      <ul>
        <li><code>PUT  /api/notes/:ulid</code> — store a note (auth)</li>
        <li><code>GET  /:ulid</code> — render a note (standalone, all wikilinks private)</li>
        <li><code>PUT  /api/wrappers/:id</code> — store a wrapper (auth, optional <code>gated:true</code>)</li>
        <li><code>POST /api/wrappers/:id/tokens</code> — mint an access token (auth)</li>
        <li><code>POST /api/wrappers/:id/revoke</code> — revoke by jti (auth)</li>
        <li><code>GET  /share/:id</code> — wrapper landing (gated wrappers need <code>?t=…</code>)</li>
        <li><code>GET  /share/:id/:ulid</code> — note scoped to a share-set</li>
        <li><code>GET  /share/:id/api/search?q=…</code> — full-text search across the slice's bodies</li>
      </ul>
    </details>
  </div>
</footer>
</body>
</html>`);
    }

    // ── Company Brain waitlist ──────────────────────────────────────────
    // Captures interest for the paid team/AI-native version of BrainShare.
    // Storage: KV key `waitlist:cb:<lowercased-email>` → JSON {email, ts, source}.
    // Idempotent — re-submitting the same email is a no-op.

    if (path === "/company-brain" && req.method === "GET") {
      return html(renderCompanyBrainLanding(), 200);
    }

    if (path === "/company-brain/thanks" && req.method === "GET") {
      return html(renderCompanyBrainThanks(), 200);
    }

    if (path === "/api/company-brain-waitlist" && req.method === "POST") {
      // Rate limit: 5 submissions per IP per hour
      if (!(await rateLimitOk(env, req, "cbwaitlist", 5, 3600))) {
        return rateLimited(3600);
      }
      let body: { email?: string; source?: string };
      try { body = await req.json(); } catch { return new Response("invalid JSON", { status: 400 }); }
      const email = (body.email ?? "").trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
        return new Response(JSON.stringify({ ok: false, error: "invalid email" }), {
          status: 400, headers: { "content-type": "application/json" },
        });
      }
      const key = `waitlist:cb:${email}`;
      const existing = await env.NOTES.get(key);
      const payload = JSON.stringify({
        email,
        ts: new Date().toISOString(),
        source: (body.source ?? "company-brain-landing").slice(0, 80),
        existed: !!existing,
      });
      // Store with no TTL so the waitlist persists; idempotent overwrite is fine
      await env.NOTES.put(key, payload);
      return new Response(JSON.stringify({ ok: true, alreadyOnList: !!existing }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    }

    return html(`
<main class="container" style="text-align:center;padding:6em 1em;">
  <div style="font-size:3em;margin-bottom:.5em"></div>
  <h1 style="font-size:1.8em;margin-bottom:.5em">Page not found</h1>
  <p style="color:var(--text-muted,#888);margin-bottom:2em">
    This note may have been renamed, moved, or removed from the slice.
  </p>
  <a href="/" style="display:inline-block;padding:.6em 1.4em;background:var(--text-accent,#7f6df2);color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
    ← Back to BrainShare
  </a>
</main>`, 404);
  },
};

function renderCompanyBrainLanding(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Company Brain — Coming Q3 2026</title>
<meta property="og:title" content="Company Brain — Your team's collective brain, queryable by any agent">
<meta property="og:description" content="MCP-native knowledge layer for teams. Built on the BrainShare protocol. Coming Q3 2026.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<style>
  :root {
    --bg: #0a0a0c;
    --bg-2: #131318;
    --text: #ecedee;
    --text-2: #9ca0a8;
    --muted: #5d626c;
    --accent: #a882ff;
    --accent-2: #7f6df2;
    --border: #25272f;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    line-height: 1.6;
    min-height: 100vh;
    background-image:
      radial-gradient(circle at 15% 20%, rgba(168,130,255,.18), transparent 40%),
      radial-gradient(circle at 85% 70%, rgba(127,109,242,.12), transparent 45%);
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 5em 1.5em 4em; }
  .nav-back {
    display: inline-flex; align-items: center; gap: .35em;
    color: var(--text-2); text-decoration: none; font-size: .9em;
    margin-bottom: 3em;
  }
  .nav-back:hover { color: var(--text); }
  .eyebrow {
    display: inline-block;
    padding: .35em .8em;
    background: rgba(168,130,255,.13);
    border: 1px solid rgba(168,130,255,.3);
    border-radius: 999px;
    font-size: .78em;
    color: var(--accent);
    letter-spacing: .08em;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 1.2em;
  }
  h1 {
    font-size: 3.2em;
    font-weight: 700;
    letter-spacing: -.03em;
    line-height: 1.05;
    margin: 0 0 .35em;
    background: linear-gradient(135deg, #fff 0%, #a882ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lede {
    font-size: 1.35em;
    line-height: 1.45;
    color: var(--text-2);
    margin: 0 0 2.2em;
    max-width: 38ch;
  }
  .pitch { margin: 0 0 2.5em; }
  .pitch p { font-size: 1.02em; color: var(--text-2); margin: 0 0 1em; }
  .pitch strong { color: var(--text); font-weight: 600; }
  .features {
    list-style: none; padding: 0; margin: 0 0 2.8em;
    display: grid; grid-template-columns: 1fr 1fr; gap: .7em 1.4em;
  }
  .features li {
    display: flex; align-items: flex-start; gap: .55em;
    color: var(--text-2); font-size: .95em;
  }
  .features li::before {
    content: "▸"; color: var(--accent); flex: 0 0 auto;
  }
  .form {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.8em;
    margin: 0 0 2em;
  }
  .form-label {
    display: block;
    font-size: .82em;
    color: var(--text-2);
    margin-bottom: .65em;
    letter-spacing: .04em;
    text-transform: uppercase;
    font-weight: 600;
  }
  .form-row { display: flex; gap: .55em; }
  .form input[type=email] {
    flex: 1;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: .8em 1em;
    font-size: 1em;
    font-family: inherit;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .form input[type=email]:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(168,130,255,.2);
  }
  .form button {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: .8em 1.4em;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s, transform .1s;
  }
  .form button:hover { background: var(--accent-2); transform: translateY(-1px); }
  .form button:disabled { opacity: .5; cursor: not-allowed; }
  .form-hint {
    font-size: .82em;
    color: var(--muted);
    margin-top: .8em;
  }
  .form-msg {
    margin-top: 1em;
    padding: .7em 1em;
    border-radius: 8px;
    font-size: .9em;
    display: none;
  }
  .form-msg.success {
    display: block;
    background: rgba(80,200,120,.14);
    border: 1px solid rgba(80,200,120,.3);
    color: #7adba0;
  }
  .form-msg.error {
    display: block;
    background: rgba(255,80,80,.12);
    border: 1px solid rgba(255,80,80,.3);
    color: #ff8a8a;
  }
  .signature {
    margin-top: 2.5em;
    padding-top: 2em;
    border-top: 1px solid var(--border);
    font-size: .88em;
    color: var(--muted);
  }
  .signature a { color: var(--text-2); }
  @media (max-width: 600px) {
    h1 { font-size: 2.3em; }
    .lede { font-size: 1.1em; }
    .features { grid-template-columns: 1fr; }
    .form-row { flex-direction: column; }
    .form button { width: 100%; padding: .9em; }
  }
</style>
</head>
<body>
<main class="wrap">
  <a class="nav-back" href="/">← BrainShare</a>

  <div class="eyebrow">▸ Q3 2026 · Early access</div>
  <h1>Company Brain.</h1>
  <p class="lede">Your team's collective second brain — readable by every agent you ship.</p>

  <div class="pitch">
    <p>BrainShare lets <strong>one person</strong> publish a vault. Company Brain lets <strong>your whole team</strong> publish a single, shared, AI-native brain — and exposes it to every Claude, Cursor, and custom agent in your stack via the Model Context Protocol.</p>
    <p>Same publishing protocol. Multi-tenant. Auth that works for teams. And the knowledge graph becomes infrastructure — not a tool you visit, a system every agent already knows.</p>
  </div>

  <ul class="features">
    <li>Multi-tenant teams + SSO</li>
    <li>MCP server endpoint per workspace</li>
    <li>Semantic search across the team brain</li>
    <li>AI-generated summaries + linking</li>
    <li>Slack + Notion + Linear sync</li>
    <li>Activity analytics + most-referenced</li>
    <li>Per-workspace agent permissions</li>
    <li>Self-hostable on Cloudflare</li>
  </ul>

  <form class="form" id="waitlist-form" novalidate>
    <label class="form-label" for="email">Join the waitlist</label>
    <div class="form-row">
      <input type="email" id="email" name="email" required placeholder="you@team.com" autocomplete="email">
      <button type="submit" id="submit-btn">Request access →</button>
    </div>
    <div class="form-hint">~50 teams will get early access in Q3. We'll email you when your slot opens.</div>
    <div class="form-msg" id="form-msg" role="status" aria-live="polite"></div>
  </form>

  <div class="signature">
    Built on the open BrainShare protocol — <a href="https://github.com/MachoMaheen/brainshare">github.com/MachoMaheen/brainshare</a>. Free forever for individuals.
  </div>
</main>
<script>
(function(){
  var form = document.getElementById('waitlist-form');
  var msg = document.getElementById('form-msg');
  var btn = document.getElementById('submit-btn');
  var input = document.getElementById('email');
  form.addEventListener('submit', async function(ev){
    ev.preventDefault();
    var email = (input.value || '').trim();
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      show('error', "That doesn't look like a valid email.");
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Adding you…';
    try {
      var resp = await fetch('/api/company-brain-waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email, source: 'cb-landing' })
      });
      var data = await resp.json();
      if (resp.ok && data.ok) {
        if (data.alreadyOnList) {
          show('success', "You're already on the list. We'll be in touch.");
        } else {
          show('success', "You're in. We'll email you when your slot opens in Q3.");
        }
        input.value = '';
      } else {
        show('error', data.error || 'Something went wrong. Try again?');
      }
    } catch(e) {
      show('error', 'Network error. Try again in a moment.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Request access →';
    }
  });
  function show(kind, text){
    msg.className = 'form-msg ' + kind;
    msg.textContent = text;
  }
})();
</script>
</body>
</html>`;
}

function renderCompanyBrainThanks(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're on the list — Company Brain</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #0a0a0c; color: #ecedee; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; max-width: 500px; padding: 2em; }
  h1 { font-size: 2em; margin: 0 0 .5em; }
  p { color: #9ca0a8; line-height: 1.6; }
  a { color: #a882ff; }
</style>
</head>
<body>
<div class="box">
  <h1>✓ You're in.</h1>
  <p>We'll email you when your Company Brain slot opens. Until then, <a href="/">browse the open-source BrainShare protocol</a>.</p>
</div>
</body>
</html>`;
}
