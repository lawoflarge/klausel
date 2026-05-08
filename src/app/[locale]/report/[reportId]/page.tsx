import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { LeaseAnalysisReport } from "@/lib/ai/schema";
import { ReportView } from "@/components/report-view";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string; locale: string }>;
}) {
  const { reportId } = await params;
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

  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <ReportView report={parsed.data} />
    </main>
  );
}
