import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (!uploadId) return NextResponse.json({ error: "missing_uploadId" }, { status: 400 });

  const supabase = createServiceRoleClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upload } = await (supabase.from("lease_uploads") as any)
    .select("id, email")
    .eq("id", uploadId)
    .single();

  if (!upload) return NextResponse.json({ error: "upload_not_found" }, { status: 404 });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ONESHOT!, quantity: 1 }],
    customer_email: upload.email,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/process/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload?cancelled=1`,
    metadata: { uploadId },
    locale: "auto",
    payment_intent_data: { metadata: { uploadId } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("orders") as any).insert({
    stripe_session_id: session.id,
    email: upload.email,
    amount_eur: 19.0,
    product: "lease_review_oneshot",
    lease_upload_id: uploadId,
    status: "pending",
  });

  return NextResponse.redirect(session.url!, 303);
}
