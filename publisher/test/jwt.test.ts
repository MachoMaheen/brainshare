import { describe, it, expect } from "vitest";
import { signJWT, verifyJWT, TokenClaims } from "../src/jwt";

const SECRET = "test-secret-do-not-use-in-prod-please";

describe("signJWT / verifyJWT", () => {
  it("roundtrips a simple payload", async () => {
    const payload: TokenClaims = {
      sub: "wrap-abc",
      jti: "tok-1",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    };
    const token = await signJWT(payload, SECRET);
    expect(token.split(".")).toHaveLength(3);
    const verified = await verifyJWT<TokenClaims>(token, SECRET);
    expect(verified).toEqual(payload);
  });

  it("preserves optional claims (max_views, viewer)", async () => {
    const payload: TokenClaims = {
      sub: "wrap-x",
      jti: "tok-2",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
      max_views: 5,
      viewer: "alice",
    };
    const verified = await verifyJWT<TokenClaims>(await signJWT(payload, SECRET), SECRET);
    expect(verified?.max_views).toBe(5);
    expect(verified?.viewer).toBe("alice");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signJWT({ sub: "wrap-abc" }, SECRET);
    expect(await verifyJWT(token, "wrong-secret")).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signJWT({ sub: "wrap-abc", jti: "honest" }, SECRET);
    const [h, _p, s] = token.split(".");
    // swap payload to claim a different sub but keep the original signature
    const fakePayload = btoa(JSON.stringify({ sub: "evil-wrap", jti: "honest" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const tampered = `${h}.${fakePayload}.${s}`;
    expect(await verifyJWT(tampered, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyJWT("not-a-jwt", SECRET)).toBeNull();
    expect(await verifyJWT("a.b", SECRET)).toBeNull();
    expect(await verifyJWT("", SECRET)).toBeNull();
  });

  it("rejects garbage in the signature segment", async () => {
    const token = await signJWT({ sub: "x" }, SECRET);
    const [h, p] = token.split(".");
    expect(await verifyJWT(`${h}.${p}.invalidsig`, SECRET)).toBeNull();
  });
});
