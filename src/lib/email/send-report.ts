import { getResend } from "./client";
import { generateReportPDF } from "@/lib/pdf/generate";
import type { LeaseAnalysisReportT } from "@/lib/ai/schema";

export async function sendReportEmail(args: {
  reportId: string;
  to: string;
  report: LeaseAnalysisReportT;
}): Promise<void> {
  const resend = getResend();
  const pdf = await generateReportPDF(args.report);
  const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/report/${args.reportId}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@klausel.app",
    to: args.to,
    subject: `Your Klausel report — ${args.report.risk_score}`,
    html: `
      <p>Hi,</p>
      <p>Your Mietvertrag analysis is ready.</p>
      <p><strong>Risk: ${args.report.risk_score}</strong></p>
      <p>${args.report.summary_en}</p>
      <p><a href="${reportUrl}">View full report online</a> or see the PDF attached.</p>
      <hr/>
      <p style="font-size: 12px; color: #666;">
        Klausel is not a law firm. For binding legal advice, consult a Rechtsanwalt or Mieterverein.
        — Klausel ist keine Rechtsanwaltskanzlei. Für verbindliche Rechtsberatung wende dich an einen Rechtsanwalt oder Mieterverein.
      </p>
    `,
    attachments: [
      {
        filename: `klausel-report-${args.reportId}.pdf`,
        content: pdf,
      },
    ],
  });
}
