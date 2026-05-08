import { describe, it, expect } from "vitest";
import { LeaseAnalysisReport } from "@/lib/ai/schema";

describe("LeaseAnalysisReport schema", () => {
  it("accepts a minimal valid report", () => {
    const sample = {
      risk_score: "YELLOW",
      summary_en: "Two clauses need attention.",
      summary_de: "Zwei Klauseln sollten geprüft werden.",
      flagged_clauses: [],
      mietpreisbremse: {
        applies: true,
        ortsuebliche_vergleichsmiete_estimate_eur: 1450,
        your_rent_eur: 1500,
        delta_percent: 3.4,
        may_be_entitled_to_reduction: false,
        notes_en: null,
        notes_de: null,
      },
      next_steps_en: ["Sign with changes"],
      next_steps_de: ["Mit Änderungen unterschreiben"],
      metadata: {
        clauses_analyzed: 12,
        model_used: "claude-sonnet-4-6",
        confidence_overall: 0.87,
      },
    };
    expect(() => LeaseAnalysisReport.parse(sample)).not.toThrow();
  });

  it("rejects a report with invalid risk_score", () => {
    const bad = { risk_score: "ORANGE" };
    expect(() => LeaseAnalysisReport.parse(bad)).toThrow();
  });

  it("rejects a flagged clause with confidence > 1", () => {
    const minimal = {
      risk_score: "RED",
      summary_en: "x",
      summary_de: "x",
      flagged_clauses: [
        {
          clause_text_de: "x",
          clause_text_en: "x",
          severity: "CRITICAL",
          reason_en: "x",
          reason_de: "x",
          legal_basis: "BGB §535",
          confidence: 1.5,
          recommended_action: "negotiate_removal",
          negotiation_script_en: null,
          negotiation_script_de: null,
        },
      ],
      mietpreisbremse: {
        applies: false,
        ortsuebliche_vergleichsmiete_estimate_eur: null,
        your_rent_eur: null,
        delta_percent: null,
        may_be_entitled_to_reduction: false,
        notes_en: null,
        notes_de: null,
      },
      next_steps_en: [],
      next_steps_de: [],
      metadata: {
        clauses_analyzed: 1,
        model_used: "claude-sonnet-4-6",
        confidence_overall: 0.9,
      },
    };
    expect(() => LeaseAnalysisReport.parse(minimal)).toThrow();
  });
});
