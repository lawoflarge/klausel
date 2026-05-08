import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";

const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { email } = parsed.data;
  const supabase = createServiceRoleClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: uploads } = await (supabase.from("lease_uploads") as any)
    .select("id, storage_path")
    .eq("email", email);
  if (uploads?.length) {
    await supabase.storage
      .from("lease-uploads")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .remove(uploads.map((u: any) => u.storage_path));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase.from("orders") as any)
    .select("id")
    .eq("email", email);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderIds = orders?.map((o: any) => o.id) ?? [];
  if (orderIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reports } = await (supabase.from("reports") as any)
      .select("pdf_storage_path")
      .in("order_id", orderIds);
    const pdfPaths = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reports?.map((r: any) => r.pdf_storage_path).filter(Boolean) ?? []
    ) as string[];
    if (pdfPaths.length) {
      await supabase.storage.from("report-pdfs").remove(pdfPaths);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("orders") as any).delete().eq("email", email);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("lease_uploads") as any).delete().eq("email", email);

  return NextResponse.json({ deleted: true });
}
