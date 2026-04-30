import {
  renderNote,
  renderWrapper,
  renderGateError,
  buildShareSet,
  NoteMeta,
  WrapData,
} from "./render";
import { signJWT, verifyJWT, TokenClaims } from "./jwt";

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
        const notePath = req.headers.get("x-note-path");
        if (notePath) {
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

    // PUT /api/wrappers/:id — store wrapper (auth required)
    const wrapMatch = path.match(/^\/api\/wrappers\/([a-zA-Z0-9_-]{1,64})$/);
    if (wrapMatch) {
      if (unauthorized(env, req)) return forbidden();
      if (req.method === "PUT" && !(await rateLimitOk(env, req, "wrap", 60, 60))) return rateLimited(60);
      const id = wrapMatch[1];
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
        if (!parsed.created_at) parsed.created_at = new Date().toISOString();
        if (parsed.gated !== true) parsed.gated = false; // normalize
        await env.NOTES.put(`wrap:${id}`, JSON.stringify(parsed));
        return json({ id, url: `${origin}/share/${id}`, gated: parsed.gated });
      }
      if (req.method === "DELETE") {
        await env.NOTES.delete(`wrap:${id}`);
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
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

      const [md, notePath, shareSet] = await Promise.all([
        env.NOTES.get(`note:${ulid}`),
        getNotePath(env.NOTES, ulid),
        buildShareSet(env.NOTES, wrap.ulids),
      ]);
      if (!md) return html("<h1>404</h1><p>note not yet published</p>", 404);
      const shareBase = `${origin}/share/${wrapId}`;
      return html(renderNote(md, ulid, {
        shareBase,
        shareSet,
        path: notePath,
        tokenQuery: gate.tokenQuery,
        gated: wrap.gated,
      }));
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
      return html(`<!doctype html><html><head><meta charset="utf-8"><title>BrainShare publisher</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:4em auto;padding:0 1em;color:#1f2328}code{background:#f6f8fa;padding:2px 6px;border-radius:6px}</style>
</head><body><h1>BrainShare publisher</h1>
<p>API:</p>
<ul>
  <li><code>PUT  /api/notes/:ulid</code> — store a note (auth)</li>
  <li><code>GET  /:ulid</code> — render a note (standalone, all wikilinks private)</li>
  <li><code>PUT  /api/wrappers/:id</code> — store a wrapper (auth, optional <code>gated:true</code>)</li>
  <li><code>POST /api/wrappers/:id/tokens</code> — mint an access token (auth)</li>
  <li><code>POST /api/wrappers/:id/revoke</code> — revoke by jti (auth)</li>
  <li><code>GET  /share/:id</code> — wrapper landing (gated wrappers need <code>?t=…</code>)</li>
  <li><code>GET  /share/:id/:ulid</code> — note scoped to a share-set</li>
</ul></body></html>`);
    }

    return new Response("not found", { status: 404 });
  },
};
