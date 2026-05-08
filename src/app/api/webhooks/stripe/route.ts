import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/stripe/verify-webhook";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { processOrder } from "@/lib/orders/process-order";
import { track } from "@/lib/analytics/posthog-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = verifyWebhook(payload, signature);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const supabase = createServiceRoleClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any)
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent: session.payment_intent as string,
      })
      .eq("stripe_session_id", session.id);

    await track(
      session.customer_email ?? "unknown",
      "checkout_completed",
      { sessionId: session.id }
    );

    processOrder(session.id).catch((e) => {
      console.error("[stripe-webhook] processOrder failed", e);
    });
  }

  return NextResponse.json({ received: true });
}
