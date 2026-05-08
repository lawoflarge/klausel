import { describe, it, expect, beforeAll } from "vitest";
import { verifyWebhook } from "@/lib/stripe/verify-webhook";
import Stripe from "stripe";

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
});

describe("verifyWebhook", () => {
  it("throws on missing signature", () => {
    expect(() => verifyWebhook("{}", null)).toThrow("missing_signature");
  });

  it("verifies a valid signature", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = new Stripe("sk_test_dummy", { apiVersion: "2025-06-30.preview" as any });
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      data: {},
    });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_test_secret",
    });
    const event = verifyWebhook(payload, header);
    expect(event.type).toBe("checkout.session.completed");
  });

  it("throws on invalid signature", () => {
    expect(() =>
      verifyWebhook(JSON.stringify({}), "t=1,v1=invalid")
    ).toThrow();
  });
});
