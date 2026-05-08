import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret(name: "DELETE_TOKEN_SECRET" | "REPORT_TOKEN_SECRET"): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

/**
 * Deterministic HMAC token for a resource (e.g., reportId).
 * Long-lived: anyone who knows the resource ID + holds a token can access. Verify-only.
 */
export function signResourceToken(
  resourceId: string,
  secretName: "REPORT_TOKEN_SECRET"
): string {
  return createHmac("sha256", getSecret(secretName))
    .update(resourceId)
    .digest("hex")
    .slice(0, 32);
}

export function verifyResourceToken(
  resourceId: string,
  token: string | null | undefined,
  secretName: "REPORT_TOKEN_SECRET"
): boolean {
  if (!token || token.length !== 32) return false;
  const expected = signResourceToken(resourceId, secretName);
  try {
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/**
 * Time-bound HMAC token for one-shot actions (e.g., account-delete confirmation).
 * Format: `${expiryMs}.${signature}` where signature = HMAC(secret, `${payload}:${expiryMs}`).
 */
export function signTimedToken(
  payload: string,
  ttlMs: number,
  secretName: "DELETE_TOKEN_SECRET"
): string {
  const expiryMs = Date.now() + ttlMs;
  const sig = createHmac("sha256", getSecret(secretName))
    .update(`${payload}:${expiryMs}`)
    .digest("hex")
    .slice(0, 32);
  return `${expiryMs}.${sig}`;
}

export function verifyTimedToken(
  payload: string,
  token: string | null | undefined,
  secretName: "DELETE_TOKEN_SECRET"
): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expiryStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expiryMs = Number(expiryStr);
  if (!Number.isFinite(expiryMs) || expiryMs < Date.now()) return false;
  if (sig.length !== 32) return false;
  const expected = createHmac("sha256", getSecret(secretName))
    .update(`${payload}:${expiryStr}`)
    .digest("hex")
    .slice(0, 32);
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
