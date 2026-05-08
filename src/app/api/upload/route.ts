import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

const Body = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.literal("application/pdf"),
  email: z.string().email(),
  bundesland: z.string().min(1),
  baseRentEur: z.number().positive().max(20_000),
  leaseStartDate: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const uploadId = randomUUID();
  const storagePath = `${uploadId}/${parsed.data.filename}`;

  const { data: signed, error: signedErr } = await supabase.storage
    .from("lease-uploads")
    .createSignedUploadUrl(storagePath);
  if (signedErr) {
    return NextResponse.json({ error: "storage_error", details: signedErr.message }, { status: 500 });
  }

  const insertRow = {
    id: uploadId,
    storage_path: storagePath,
    email: parsed.data.email,
    bundesland: parsed.data.bundesland,
    base_rent_eur: parsed.data.baseRentEur,
    lease_start_date: parsed.data.leaseStartDate ?? null,
  };
  const { error: insertErr } = await supabase
    .from("lease_uploads")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertRow as any);
  if (insertErr) {
    return NextResponse.json({ error: "db_error", details: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    uploadId,
    signedUrl: signed.signedUrl,
    token: signed.token,
    storagePath,
  });
}
