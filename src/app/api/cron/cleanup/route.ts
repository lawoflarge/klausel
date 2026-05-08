import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expired } = await (supabase.from("lease_uploads") as any)
    .select("id, storage_path")
    .lt("expires_at", cutoff.toISOString());

  if (!expired?.length) {
    return NextResponse.json({ deleted: 0 });
  }

  await supabase.storage
    .from("lease-uploads")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .remove(expired.map((u: any) => u.storage_path));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("orders") as any)
    .update({ lease_upload_id: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .in("lease_upload_id", expired.map((u: any) => u.id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("lease_uploads") as any)
    .delete()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .in("id", expired.map((u: any) => u.id));

  return NextResponse.json({ deleted: expired.length });
}
