import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, MODEL_PRIMARY, MODEL_FALLBACK, MAX_TOKENS } from "./client";
import { SYSTEM_PROMPT } from "./system-prompt";
import { LeaseAnalysisReport, type LeaseAnalysisReportT } from "./schema";

export interface AnalyzeLeaseInput {
  pdfBuffer: Buffer;
  bundesland: string;
  baseRentEur: number;
  leaseStartDate?: string;
}

export interface AnalyzeLeaseResult {
  report: LeaseAnalysisReportT;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
}

export async function analyzeLease(
  input: AnalyzeLeaseInput
): Promise<AnalyzeLeaseResult> {
  const anthropic = getAnthropic();
  const userMessage = buildUserMessage(input);

  const primaryResponse = await anthropic.messages.create({
    model: MODEL_PRIMARY,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: input.pdfBuffer.toString("base64"),
            },
          },
          { type: "text", text: userMessage },
        ],
      },
    ],
  });

  const text = extractText(primaryResponse);
  const parsed = tryParseReport(text);

  if (!parsed.ok) {
    throw new Error(
      `Primary model returned invalid JSON: ${parsed.error}. Raw: ${text.slice(0, 500)}`
    );
  }

  const shouldEscalate =
    parsed.report.flagged_clauses.filter((c) => c.severity === "CRITICAL").length >= 3 ||
    parsed.report.metadata.confidence_overall < 0.7;

  if (!shouldEscalate) {
    return {
      report: parsed.report,
      modelUsed: MODEL_PRIMARY,
      tokensInput: primaryResponse.usage.input_tokens,
      tokensOutput: primaryResponse.usage.output_tokens,
    };
  }

  const opusResponse = await anthropic.messages.create({
    model: MODEL_FALLBACK,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: input.pdfBuffer.toString("base64"),
            },
          },
          { type: "text", text: userMessage },
        ],
      },
    ],
  });

  const opusText = extractText(opusResponse);
  const opusParsed = tryParseReport(opusText);
  if (!opusParsed.ok) {
    return {
      report: parsed.report,
      modelUsed: MODEL_PRIMARY,
      tokensInput: primaryResponse.usage.input_tokens,
      tokensOutput: primaryResponse.usage.output_tokens,
    };
  }

  return {
    report: opusParsed.report,
    modelUsed: MODEL_FALLBACK,
    tokensInput: opusResponse.usage.input_tokens,
    tokensOutput: opusResponse.usage.output_tokens,
  };
}

function buildUserMessage(input: AnalyzeLeaseInput): string {
  return `Analyze the attached German Mietvertrag.

Tenant context:
- Bundesland: ${input.bundesland}
- Base rent (Grundmiete): €${input.baseRentEur.toFixed(2)}/month
${input.leaseStartDate ? `- Lease start date: ${input.leaseStartDate}` : ""}

Produce the bilingual report per the schema. Output ONLY valid JSON, no prose.`;
}

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

function tryParseReport(
  text: string
): { ok: true; report: LeaseAnalysisReportT } | { ok: false; error: string } {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (e) {
    return { ok: false, error: `JSON parse failed: ${(e as Error).message}` };
  }
  const result = LeaseAnalysisReport.safeParse(json);
  if (!result.success) {
    return { ok: false, error: `Schema validation failed: ${result.error.message}` };
  }
  return { ok: true, report: result.data };
}
