import Stripe from "stripe";
import { getStripe } from "./client";

export function verifyWebhook(
  payload: string,
  signature: string | null
): Stripe.Event {
  if (!signature) throw new Error("missing_signature");
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET missing");
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
