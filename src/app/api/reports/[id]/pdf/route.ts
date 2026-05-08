import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { LeaseAnalysisReport } from "@/lib/ai/schema";
import { generateReportPDF } from "@/lib/pdf/generate";
import { verifyResourceToken } from "@/lib/auth/tokens";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("t");
  if (!verifyResourceToken(id, token, "REPORT_TOKEN_SECRET")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("reports")
    .select("payload, status, pdf_storage_path")
    .eq("id", id)
    .single();

  const row = data as
    | { payload: unknown; status: string; pdf_storage_path: string | null }
    | null;

  if (!row || row.status !== "completed" || !row.payload) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const parsed = LeaseAnalysisReport.safeParse(row.payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "schema_error" }, { status: 500 });
  }

  if (row.pdf_storage_path) {
    const { data: signed } = await supabase.storage
      .from("report-pdfs")
      .createSignedUrl(row.pdf_storage_path, 60 * 5);
    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl);
    }
  }

  const pdf = await generateReportPDF(parsed.data);

  const path = `${id}/report.pdf`;
  await supabase.storage.from("report-pdfs").upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("reports") as any)
    .update({ pdf_storage_path: path })
    .eq("id", id);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="klausel-report-${id}.pdf"`,
    },
  });
}
