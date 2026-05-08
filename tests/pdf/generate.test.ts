import { describe, it, expect } from "vitest";
import { generateReportPDF } from "@/lib/pdf/generate";
import { SAMPLE_REPORT } from "@/lib/sample-report";

describe("generateReportPDF", () => {
  it("produces a non-empty PDF buffer for the sample report", async () => {
    const buf = await generateReportPDF(SAMPLE_REPORT);
    expect(buf.byteLength).toBeGreaterThan(1000);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  }, 10_000);
});
