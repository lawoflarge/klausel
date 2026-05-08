import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { track, type EventName } from "@/lib/analytics/posthog-server";

const Body = z.object({
  distinctId: z.string().min(1).max(200),
  event: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).optional(),
});

const VALID_EVENTS: ReadonlyArray<EventName> = [
  "landing_viewed",
  "sample_viewed",
  "upload_started",
  "upload_completed",
  "checkout_started",
  "checkout_completed",
  "report_generated",
  "report_viewed",
  "report_pdf_downloaded",
  "refund_requested",
];

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  if (!VALID_EVENTS.includes(parsed.data.event as EventName)) {
    return NextResponse.json({ error: "unknown_event" }, { status: 400 });
  }

  await track(
    parsed.data.distinctId,
    parsed.data.event as EventName,
    parsed.data.properties ?? {}
  );

  return NextResponse.json({ ok: true });
}
