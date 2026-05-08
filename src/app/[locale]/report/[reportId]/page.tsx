import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { LeaseAnalysisReport } from "@/lib/ai/schema";
import { ReportView } from "@/components/report-view";
import { track } from "@/lib/analytics/posthog-server";
import { verifyResourceToken } from "@/lib/auth/tokens";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string; locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { reportId } = await params;
  const { t } = await searchParams;

  if (!verifyResourceToken(reportId, t ?? null, "REPORT_TOKEN_SECRET")) {
    notFound();
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("reports")
    .select("payload, status")
    .eq("id", reportId)
    .single();

  const row = data as { payload: unknown; status: string } | null;

  if (!row || row.status !== "completed" || !row.payload) {
    notFound();
  }

  const parsed = LeaseAnalysisReport.safeParse(row.payload);
  if (!parsed.success) notFound();

  const distinctId = (await headers()).get("x-forwarded-for") ?? "anon";
  await track(distinctId, "report_viewed", { reportId });

  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <ReportView report={parsed.data} />
    </main>
  );
}
