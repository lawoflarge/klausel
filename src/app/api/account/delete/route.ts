import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signTimedToken } from "@/lib/auth/tokens";
import { getResend } from "@/lib/email/client";

const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { email } = parsed.data;

  // 24h TTL
  const token = signTimedToken(email, 24 * 60 * 60 * 1000, "DELETE_TOKEN_SECRET");
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/account/delete/confirm?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`;

  // Send confirmation email (idempotent: always returns 200 even if email doesn't exist,
  // to avoid leaking which emails are in our system)
  try {
    const resend = getResend();
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@klausel.app",
      to: email,
      subject: "Klausel — confirm data deletion",
      html: `
        <p>You (or someone using your email) requested deletion of all Klausel data associated with ${email}.</p>
        <p><a href="${url}">Click here to confirm deletion</a> (link valid for 24 hours).</p>
        <p>If you did not request this, ignore this email — no action will be taken.</p>
        <hr/>
        <p style="font-size: 12px; color: #666;">Klausel — klausel.app</p>
      `,
    });
  } catch (e) {
    console.error("[account-delete] confirmation email send failed", e);
    // Still return 200 — don't leak whether email is registered
  }

  return NextResponse.json({ ok: true });
}
