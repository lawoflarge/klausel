import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signResourceToken } from "@/lib/auth/tokens";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const supabase = createServiceRoleClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase.from("orders") as any)
    .select("id, status")
    .eq("stripe_session_id", sessionId)
    .single();

  if (!order) {
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({ status: "awaiting_payment" });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase.from("reports") as any)
    .select("id, status, error_message")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!report) {
    return NextResponse.json({ status: "queued" });
  }

  if (report.status === "completed") {
    const token = signResourceToken(report.id, "REPORT_TOKEN_SECRET");
    return NextResponse.json({
      status: report.status,
      reportId: report.id,
      token,
      error: report.error_message ?? null,
    });
  }

  return NextResponse.json({
    status: report.status,
    reportId: report.id,
    error: report.error_message ?? null,
  });
}
