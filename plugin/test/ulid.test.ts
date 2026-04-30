import { describe, it, expect } from "vitest";
import { ulid, isValidUlid, ULID_PATTERN } from "../src/ulid";

describe("ulid()", () => {
  it("generates a 26-character string", () => {
    const u = ulid();
    expect(u).toHaveLength(26);
  });

  it("only uses Crockford base32 alphabet", () => {
    for (let i = 0; i < 100; i++) {
      expect(ulid()).toMatch(ULID_PATTERN);
    }
  });

  it("encodes time monotonically (later time → lexicographically larger)", () => {
    const a = ulid(1_700_000_000_000);
    const b = ulid(1_700_000_001_000);
    expect(a.slice(0, 10) <= b.slice(0, 10)).toBe(true);
  });

  it("produces unique values across many calls (no random collisions)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(ulid());
    expect(set.size).toBe(1000);
  });

  it("uses uppercase letters only (Crockford convention)", () => {
    const u = ulid();
    expect(u).toBe(u.toUpperCase());
  });
});

describe("isValidUlid()", () => {
  it("accepts a freshly generated ulid", () => {
    expect(isValidUlid(ulid())).toBe(true);
  });

  it("rejects lowercase", () => {
    expect(isValidUlid(ulid().toLowerCase())).toBe(false);
  });

  it("rejects banned letters (I, L, O, U)", () => {
    expect(isValidUlid("01HX000000IOLU0000000000VV")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidUlid("")).toBe(false);
    expect(isValidUlid("01HX")).toBe(false);
    expect(isValidUlid("01HX000000000000000000000000")).toBe(false); // 28 chars
  });

  it("rejects garbage", () => {
    expect(isValidUlid("not-a-ulid")).toBe(false);
    expect(isValidUlid("../etc/passwd")).toBe(false);
  });
});
