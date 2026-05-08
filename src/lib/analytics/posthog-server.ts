import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!process.env.POSTHOG_API_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST ?? "https://eu.posthog.com",
      flushAt: 1, // serverless: flush immediately
      flushInterval: 0,
    });
  }
  return client;
}

export type EventName =
  | "landing_viewed"
  | "sample_viewed"
  | "upload_started"
  | "upload_completed"
  | "checkout_started"
  | "checkout_completed"
  | "report_generated"
  | "report_viewed"
  | "report_pdf_downloaded"
  | "refund_requested";

export async function track(
  distinctId: string,
  event: EventName,
  properties: Record<string, unknown> = {}
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  await ph.flush();
}
