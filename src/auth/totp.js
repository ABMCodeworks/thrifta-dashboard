/**
 * App-level TOTP (RFC 6238) using the Web Crypto API — no Firebase MFA, no
 * external dependency. Defaults match every standard authenticator app:
 * SHA-1, 6 digits, 30-second period.
 *
 * NOTE: verification happens in the browser against a secret we store, so this
 * is a soft second factor (good for an internal admin tool) rather than a
 * server-enforced one. See SECURITY.md for the hardening path.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // RFC 4648 base32
const PERIOD = 30;
const DIGITS = 6;

function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1; // keep only leftover bits (avoid 32-bit overflow)
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  const clean = (str || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
    value &= (1 << bits) - 1;
  }
  return new Uint8Array(out);
}

/** Random base32 secret (default 160 bits, the TOTP recommendation). */
export function generateSecret(byteLength = 20) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base32Encode(bytes);
}

async function hmacSha1(keyBytes, msgBytes) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgBytes);
  return new Uint8Array(sig);
}

/** Generate the 6-digit code for a given 30s time-step counter. */
export async function generateTotp(secret, counter) {
  const key = base32Decode(secret);
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hmac = await hmacSha1(key, msg);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/**
 * Verify a token against the current time, tolerating ±`window` steps for
 * clock drift between the device and this browser.
 */
export async function verifyTotp(secret, token, window = 1) {
  if (!secret || !/^\d{6}$/.test((token || "").trim())) return false;
  const t = (token || "").trim();
  const counter = Math.floor(Date.now() / 1000 / PERIOD);
  for (let w = -window; w <= window; w++) {
    if ((await generateTotp(secret, counter + w)) === t) return true;
  }
  return false;
}

/** otpauth:// URI for QR codes — readable by Google Authenticator, 1Password, etc. */
export function otpauthURL(secret, account, issuer = "Thrifta Admin") {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
