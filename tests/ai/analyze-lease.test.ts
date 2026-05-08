import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { analyzeLease } from "@/lib/ai/analyze-lease";

const RUN_AI = process.env.VITEST_RUN_AI === "1";

describe.skipIf(!RUN_AI)("analyzeLease integration", () => {
  it(
    "analyzes Berlin sample lease and flags expected illegal clauses",
    async () => {
      const pdfPath = path.resolve(__dirname, "../../fixtures/sample-lease-berlin.pdf");
      if (!existsSync(pdfPath)) {
        throw new Error(`fixture missing at ${pdfPath} — run scripts/generate-fixture-pdf.js`);
      }
      const pdfBuffer = readFileSync(pdfPath);

      const result = await analyzeLease({
        pdfBuffer,
        bundesland: "Berlin",
        baseRentEur: 1850,
        leaseStartDate: "2026-06-01",
      });

      expect(result.report.risk_score).toMatch(/YELLOW|RED/);
      expect(result.report.flagged_clauses.length).toBeGreaterThanOrEqual(3);

      const allReasons = result.report.flagged_clauses
        .map((c) => `${c.clause_text_de} ${c.reason_de}`)
        .join(" ")
        .toLowerCase();

      expect(allReasons).toMatch(/schönheitsreparaturen|renovierung/);
      expect(result.report.mietpreisbremse.applies).toBe(true);
    },
    120_000
  );
});
