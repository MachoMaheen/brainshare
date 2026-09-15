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

  it("still authorizes before Cache API lookup", () => {
    const gate = source.indexOf("const gate = await checkGate", source.indexOf("GET /share/:wrapId/:ulid"));
    const cache = source.indexOf("cache.match(cacheKey)", gate);
    expect(gate).toBeGreaterThan(-1);
    expect(cache).toBeGreaterThan(gate);
  });
});
