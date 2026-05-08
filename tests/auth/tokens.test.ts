import { describe, it, expect, beforeAll } from "vitest";
import {
  signResourceToken,
  verifyResourceToken,
  signTimedToken,
  verifyTimedToken,
} from "@/lib/auth/tokens";

beforeAll(() => {
  process.env.REPORT_TOKEN_SECRET = "0".repeat(64);
  process.env.DELETE_TOKEN_SECRET = "1".repeat(64);
});

describe("resource token (deterministic HMAC)", () => {
  it("signs and verifies a token for a given resourceId", () => {
    const t = signResourceToken("report-uuid-1", "REPORT_TOKEN_SECRET");
    expect(t).toHaveLength(32);
    expect(verifyResourceToken("report-uuid-1", t, "REPORT_TOKEN_SECRET")).toBe(true);
  });

  it("rejects token signed for a different resourceId", () => {
    const t = signResourceToken("report-uuid-1", "REPORT_TOKEN_SECRET");
    expect(verifyResourceToken("report-uuid-2", t, "REPORT_TOKEN_SECRET")).toBe(false);
  });

  it("rejects null/empty/wrong-length tokens", () => {
    expect(verifyResourceToken("x", null, "REPORT_TOKEN_SECRET")).toBe(false);
    expect(verifyResourceToken("x", "", "REPORT_TOKEN_SECRET")).toBe(false);
    expect(verifyResourceToken("x", "abc", "REPORT_TOKEN_SECRET")).toBe(false);
  });
});

describe("timed token (HMAC + expiry)", () => {
  it("signs and verifies a token within TTL", () => {
    const t = signTimedToken("user@example.com", 60_000, "DELETE_TOKEN_SECRET");
    expect(verifyTimedToken("user@example.com", t, "DELETE_TOKEN_SECRET")).toBe(true);
  });

  it("rejects token for a different payload", () => {
    const t = signTimedToken("user@example.com", 60_000, "DELETE_TOKEN_SECRET");
    expect(verifyTimedToken("attacker@example.com", t, "DELETE_TOKEN_SECRET")).toBe(false);
  });

  it("rejects expired tokens", () => {
    const t = signTimedToken("user@example.com", -1, "DELETE_TOKEN_SECRET");
    expect(verifyTimedToken("user@example.com", t, "DELETE_TOKEN_SECRET")).toBe(false);
  });

  it("rejects tampered tokens", () => {
    const t = signTimedToken("user@example.com", 60_000, "DELETE_TOKEN_SECRET");
    const [exp, sig] = t.split(".");
    const tampered = `${exp}.${sig.slice(0, -2)}aa`;
    expect(verifyTimedToken("user@example.com", tampered, "DELETE_TOKEN_SECRET")).toBe(false);
  });
});
