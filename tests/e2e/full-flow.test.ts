import { describe, it, expect } from "vitest";
import { LeaseAnalysisReport } from "@/lib/ai/schema";
import { SAMPLE_REPORT } from "@/lib/sample-report";
import { generateReportPDF } from "@/lib/pdf/generate";

describe("e2e smoke (no external APIs)", () => {
  it("sample report parses through schema", () => {
    expect(() => LeaseAnalysisReport.parse(SAMPLE_REPORT)).not.toThrow();
  });

  it("PDF generation works end-to-end with sample data", async () => {
    const pdf = await generateReportPDF(SAMPLE_REPORT);
    expect(pdf.byteLength).toBeGreaterThan(2000);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("system prompt is under 200K chars", async () => {
    const { SYSTEM_PROMPT } = await import("@/lib/ai/system-prompt");
    expect(SYSTEM_PROMPT.length).toBeLessThan(200_000);
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(1000);
  });
});
