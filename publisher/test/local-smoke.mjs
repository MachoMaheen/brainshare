// SPDX-License-Identifier: AGPL-3.0-only
// HTTP smoke checks against an isolated local workerd/Miniflare instance.
// No Cloudflare account, real secrets, user data, or remote KV is involved.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const dir = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(dir, "..");
const ULID_PUBLIC = "01HX0000000000000000000001";
const ULID_GATED = "01HX0000000000000000000002";
const ULID_EXCLUDED = "01HX0000000000000000000003";
import { createHash } from "node:crypto";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==","base64");
const KEY_PUBLIC = createHash("sha256").update(PNG).digest("hex");
const KEY_GATED = KEY_PUBLIC;
const CANARY = "EXCLUDED_ONLY_SYNTHETIC_CANARY_7851";
const OWNER = "synthetic-smoke-publisher-token";
const auth = { authorization: "Bearer " + OWNER };

function randomFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function main() {
  const persist = await fs.mkdtemp(path.join(os.tmpdir(), "brainshare-worker-smoke-"));
  const port = await randomFreePort();
  const origin = "http://127.0.0.1:" + port;
  const wrangler = path.join(project, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
  const command = process.platform === "win32" ? wrangler : wrangler;
  const worker = spawn(command, [
    "dev", "--config", "wrangler.smoke.toml", "--local", "--ip", "127.0.0.1",
    "--port", String(port), "--persist-to", persist
  ], {
    cwd: project,
    env: {
      ...process.env,
      CI: "true",
      CLOUDFLARE_API_TOKEN: "",
      CLOUDFLARE_ACCOUNT_ID: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  const capture = chunk => { logs = (logs + String(chunk)).slice(-12000); };
  worker.stdout.on("data", capture);
  worker.stderr.on("data", capture);
  let exit = null;
  worker.once("exit", (code, signal) => { exit = { code, signal }; });
  const request = async (pathname, opts = {}) =>
    fetch(origin + pathname, { redirect: "manual", ...opts, signal: AbortSignal.timeout(10000) });
  const putText = (pathname, text, headers = {}) =>
    request(pathname, { method: "PUT", headers: { ...auth, ...headers }, body: text });
  const putJson = (pathname, data) =>
    putText(pathname, JSON.stringify(data), { "content-type": "application/json" });
  const postJson = (pathname, data) =>
    request(pathname, {
      method: "POST", headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify(data)
    });
  let assertions = 0;
  const check = (value, expected, label) => {
    assert.equal(value, expected, label);
    assertions++;
  };
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (exit) throw new Error("Worker stopped before it was ready: " + JSON.stringify(exit));
      try {
        const resp = await request("/robots.txt");
        if (resp.status === 200) { ready = true; break; }
      } catch { /* Worker may still be starting. */ }
      await delay(500);
    }
    if (!ready) throw new Error("Worker readiness timeout");

    const publicText = "# Public documentation\nA safe page with [[Private]] and no credentials.";
    const gatedText = "# Private\nGated fixture for authorized readers.";
    const excludedText = "# Excluded\n" + CANARY;
    for (const [id, filename, text] of [
      [ULID_PUBLIC, "docs/Public.md", publicText],
      [ULID_GATED, "internal/Private.md", gatedText],
      [ULID_EXCLUDED, "internal/Excluded.md", excludedText]
    ]) {
      const resp = await putText("/api/notes/" + id, text, { "x-note-path": filename });
      check(resp.status, 200, "Owner can upload fixture " + filename);
    }
    const assetPut = await request("/api/assets/" + KEY_PUBLIC, {
      method: "PUT", headers: { ...auth, "content-type": "image/png" }, body: PNG
    });
    check(assetPut.status, 200, "Owner uploads a hash-verified synthetic PNG");

    const publicWrap = await putJson("/api/wrappers/public", {
      title: "Public", ulids: [ULID_PUBLIC], gated: false,
      assets: { "diagram.png": KEY_PUBLIC }
    });
    check(publicWrap.status, 200, "Create public Slice");
    const gatedWrap = await putJson("/api/wrappers/gated", {
      title: "Private", ulids: [ULID_GATED], gated: true,
      assets: { "private.png": KEY_GATED }
    });
    check(gatedWrap.status, 200, "Create gated Slice");

    // The unscoped note, canvas and asset routes must not bypass Slice policy.
    for (const pathname of [
      "/" + ULID_PUBLIC, "/" + ULID_GATED, "/" + ULID_EXCLUDED,
      "/c/" + ULID_GATED, "/asset/" + KEY_PUBLIC, "/asset/" + KEY_GATED
    ]) {
      check((await request(pathname)).status, 404, "Unscoped read blocked: " + pathname);
    }
    check((await request("/share/public/" + ULID_EXCLUDED)).status, 403, "Excluded member rejected");
    check((await request("/share/public/" + ULID_GATED)).status, 403, "Gated member rejected from public Slice");

    const page = await request("/share/public/" + ULID_PUBLIC);
    check(page.status, 200, "Published note accessible");
    const html = await page.text();
    check(html.includes(CANARY), false, "Excluded canary absent from HTML");
    check(html.includes("internal/Excluded.md"), false, "Excluded path absent from HTML");
    check(html.includes("[not shared]"), true, "Excluded link target redacted");
    const search = await request("/share/public/api/search?q=" + encodeURIComponent(CANARY));
    check(search.status, 200, "Public search serves scoped request");
    const searchData = await search.json();
    check(Array.isArray(searchData.matches), true, "Search returns a match collection");
    check(searchData.matches.length, 0, "Excluded notes do not appear as search hits");
    for (const pathname of ["/share/public", "/share/public/feed.xml", "/share/public/download"]) {
      const resp = await request(pathname);
      check(resp.status, 200, "Public route accessible: " + pathname);
      const bytes = await resp.arrayBuffer();
      check(Buffer.from(bytes).includes(Buffer.from(CANARY)), false, "Excluded canary absent from public output");
    }

    // A public Slice must not expose a private asset, even when its key is known.
    check((await request("/share/public/asset/" + KEY_GATED)).status, 403, "Asset membership enforced");
    check((await request("/share/public/asset/" + KEY_PUBLIC)).status, 200, "Public asset accessible");

    for (const pathname of [
      "/share/gated",
      "/share/gated/" + ULID_GATED,
      "/share/gated/" + ULID_GATED + "?raw=1",
      "/share/gated/api/search?q=Private",
      "/share/gated/feed.xml",
      "/share/gated/download",
      "/share/gated/asset/" + KEY_GATED
    ]) {
      check((await request(pathname)).status, 401, "Anonymous gated request denied: " + pathname);
    }

    const tokenResponse = await postJson("/api/wrappers/gated/tokens", {
      exp_seconds: 3600, viewer: "synthetic-viewer"
    });
    check(tokenResponse.status, 200, "Owner may mint token");
    const minted = await tokenResponse.json();
    const token = minted.jwt;
    assert.ok(typeof token === "string" && token.length > 40);
    const bearer = { authorization: "Bearer " + token };
    const privateNote = await request("/share/gated/" + ULID_GATED + "?raw=1", { headers: bearer });
    check(privateNote.status, 200, "Authorized machine can read raw Markdown");
    check((await privateNote.text()).includes(gatedText), true, "Correct gated note delivered");
    const privateAsset = await request("/share/gated/asset/" + KEY_GATED, { headers: bearer });
    check(privateAsset.status, 200, "Authorized machine can read gated asset");
    check(privateAsset.headers.get("cache-control").includes("no-store"), true, "Gated asset is not publicly cached");
    check((await request("/share/gated/asset/" + KEY_PUBLIC, { headers: bearer })).status, 403, "Other Slice asset excluded");

    // Browser token exchange must create a scoped, HttpOnly cookie without exposing
    // the token in a cached HTML response.
    const exchange = await request("/share/gated?t=" + encodeURIComponent(token));
    check(exchange.status, 302, "Browser link exchanged for a session");
    const cookie = exchange.headers.get("set-cookie");
    assert.ok(cookie && cookie.includes("HttpOnly") && cookie.includes("Path=/share/gated"));
    check(exchange.headers.get("location").includes("?t="), false, "Token stripped from redirect URL");
    const cookieHeader = { cookie: cookie.split(";")[0] };
    const browserNote = await request("/share/gated/" + ULID_GATED, { headers: cookieHeader });
    check(browserNote.status, 200, "Authorized browser session accesses note");
    check((await browserNote.text()).includes(token), false, "Token not embedded in cached HTML");
    check((await request("/share/gated/" + ULID_GATED)).status, 401, "Separate anonymous session denied");
    check((await request("/share/gated/" + ULID_GATED, { headers: { authorization: "Bearer forged" } })).status, 401, "Forged token denied");

    const revoked = await postJson("/api/wrappers/gated/revoke", { jti: minted.jti });
    check(revoked.status, 200, "Owner revokes token");
    check((await request("/share/gated/" + ULID_GATED, { headers: bearer })).status, 401, "Revoked bearer denied");
    check((await request("/share/gated/" + ULID_GATED, { headers: cookieHeader })).status, 401, "Revoked browser cookie denied");

    // A note explicitly marked standalone is still forbidden when it is also
    // a member of a gated Slice.
    const standalone = await putText("/api/notes/" + ULID_GATED, gatedText, {
      "x-note-path": "internal/Private.md",
      "x-brainshare-standalone": "public"
    });
    check(standalone.status, 200, "Explicit standalone upload accepted");
    check((await request("/" + ULID_GATED)).status, 403, "Gated membership overrides standalone flag");

    console.log("PASS: local HTTP Worker privacy smoke checks (" + assertions + " assertions)");
  } catch (error) {
    console.error("Local Worker smoke failure:", error && error.stack || error);
    console.error("Recent Wrangler output:\n" + logs.slice(-6000));
    process.exitCode = 1;
  } finally {
    worker.kill("SIGTERM");
    await delay(500);
    await fs.rm(persist, { recursive: true, force: true });
  }
}
await main();
