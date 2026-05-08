import { createServiceRoleClient } from "@/lib/supabase/server";
import { analyzeLease } from "@/lib/ai/analyze-lease";
import { sendReportEmail } from "@/lib/email/send-report";
import { track } from "@/lib/analytics/posthog-server";

export async function processOrder(stripeSessionId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase.from("orders") as any)
    .select("id, email, lease_upload_id")
    .eq("stripe_session_id", stripeSessionId)
    .single();

  if (!order || !order.lease_upload_id) {
    throw new Error(`order or lease_upload missing for session ${stripeSessionId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upload } = await (supabase.from("lease_uploads") as any)
    .select("storage_path, bundesland, base_rent_eur, lease_start_date")
    .eq("id", order.lease_upload_id)
    .single();
  if (!upload) throw new Error(`lease_upload ${order.lease_upload_id} missing`);

  // Idempotency check: if a report row already exists for this order, skip.
  // Prevents duplicate processing on Stripe webhook retries.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from("reports") as any)
    .select("id, status")
    .eq("order_id", order.id)
    .limit(1)
    .single();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log(
      `[process-order] order ${order.id} already has report ${existing.id} (status=${(existing as any).status}), skipping`
    );
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reportRow, error: insertErr } = await (supabase.from("reports") as any)
    .insert({ order_id: order.id, status: "processing" })
    .select("id")
    .single();
  if (insertErr || !reportRow) throw new Error(`report insert failed: ${insertErr?.message}`);

  try {
    const { data: pdfBlob, error: dlErr } = await supabase.storage
      .from("lease-uploads")
      .download(upload.storage_path);
    if (dlErr || !pdfBlob) throw new Error(`PDF download failed: ${dlErr?.message}`);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    const result = await analyzeLease({
      pdfBuffer,
      bundesland: upload.bundesland,
      baseRentEur: Number(upload.base_rent_eur),
      leaseStartDate: upload.lease_start_date ?? undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("reports") as any)
      .update({
        status: "completed",
        risk_score: result.report.risk_score,
        payload: result.report,
        model_used: result.modelUsed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportRow.id);

    await sendReportEmail({
      reportId: reportRow.id,
      to: order.email,
      report: result.report,
    });

    await track(order.email, "report_generated", {
      reportId: reportRow.id,
      modelUsed: result.modelUsed,
      riskScore: result.report.risk_score,
    });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[process-order] failed", msg);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("reports") as any)
      .update({ status: "failed", error_message: msg })
      .eq("id", reportRow.id);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orderRow } = await (supabase.from("orders") as any)
        .select("stripe_payment_intent")
        .eq("id", order.id)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentIntent = (orderRow as any)?.stripe_payment_intent;
      if (paymentIntent) {
        const { getStripe } = await import("@/lib/stripe/client");
        const stripe = getStripe();
        await stripe.refunds.create({
          payment_intent: paymentIntent,
          reason: "requested_by_customer",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("orders") as any)
          .update({ status: "refunded" })
          .eq("id", order.id);
      }
    } catch (refundErr) {
      console.error("[process-order] refund failed", refundErr);
    }

    throw e;
  }
}
