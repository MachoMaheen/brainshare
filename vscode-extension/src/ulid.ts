const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function isValidUlid(value: string): boolean {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(value);
}

export function ulid(now = Date.now()): string {
  let time = now;
  let out = "";
  for (let i = 0; i < 10; i++) {
    out = ENCODING[time % 32] + out;
    time = Math.floor(time / 32);
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bits = 0;
  let bitCount = 0;
  for (const byte of bytes) {
    bits = (bits << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5 && out.length < 26) {
      bitCount -= 5;
      out += ENCODING[(bits >>> bitCount) & 31];
    }
  }
  while (out.length < 26) out += ENCODING[Math.floor(Math.random() * 32)];
  return out.slice(0, 26);
}
