import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("gated shared-cache representation", () => {
  const source = readFileSync(resolve(process.cwd(), "src/index.ts"), "utf8");

  it("exchanges browser query tokens for an HttpOnly session cookie", () => {
    expect(source).toContain("HttpOnly; SameSite=Lax");
    expect(source).toContain("gatedSessionRedirect");
  });

  it("never threads the current viewer token into shared rendered routes", () => {
    expect(source).not.toContain("tokenQuery: gate.tokenQuery");
    expect(source).not.toContain("renderWrapper(env.NOTES, origin, id, wrap, gate.tokenQuery)");
    expect(source).toContain('return { ok: true, tokenQuery: "" }');
  });

  it("keeps machine access available without putting credentials in cached HTML", () => {
    expect(source).toContain('authorization.startsWith("Bearer ")');
    expect(source).toContain('const rawRequest = url.searchParams.get("raw") === "1"');
    expect(source).toContain('req, !rawRequest');
  });

  it("keeps tokenized gated Atom feeds usable without public caching", () => {
    expect(source).toContain('const feedQueryToken = url.searchParams.get("t")');
    expect(source).toContain('wrap.gated && feedQueryToken ? `?t=${encodeURIComponent(feedQueryToken)}` : ""');
    expect(source).toContain('wrap.gated ? "private, no-store" : "public, max-age=600, s-maxage=600"');
  });

  it("still authorizes before Cache API lookup", () => {
    const gate = source.indexOf("const gate = await checkGate", source.indexOf("GET /share/:wrapId/:ulid"));
    const cache = source.indexOf("cache.match(cacheKey)", gate);
    expect(gate).toBeGreaterThan(-1);
    expect(cache).toBeGreaterThan(gate);
  });
});
