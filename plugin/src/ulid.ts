// ULID — Crockford base32, time-ordered, 26 chars (10 time + 16 random)

const ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TIME_LEN = 10;
const RAND_LEN = 16;

function encodeTime(now: number): string {
  let out = "";
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = now % 32;
    out = ENC[mod] + out;
    now = (now - mod) / 32;
  }
  return out;
}

function encodeRandom(): string {
  let out = "";
  const bytes = new Uint8Array(RAND_LEN);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < RAND_LEN; i++) out += ENC[bytes[i] % 32];
  return out;
}

export function ulid(time: number = Date.now()): string {
  return encodeTime(time) + encodeRandom();
}

export const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
export const isValidUlid = (s: string): boolean => ULID_PATTERN.test(s);
