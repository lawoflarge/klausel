import { z } from "zod";

export const RiskScore = z.enum(["GREEN", "YELLOW", "RED"]);
export const ClauseSeverity = z.enum(["INFO", "WARN", "CRITICAL"]);
export const RecommendedAction = z.enum([
  "negotiate_removal",
  "accept",
  "walk_away",
  "consult_lawyer",
]);

export const FlaggedClause = z.object({
  clause_text_de: z.string(),
  clause_text_en: z.string(),
  severity: ClauseSeverity,
  reason_en: z.string(),
  reason_de: z.string(),
  legal_basis: z.string(),
  confidence: z.number().min(0).max(1),
  recommended_action: RecommendedAction,
  negotiation_script_en: z.string().nullable(),
  negotiation_script_de: z.string().nullable(),
});

export const MietpreisbremseAnalysis = z.object({
  applies: z.boolean(),
  ortsuebliche_vergleichsmiete_estimate_eur: z.number().nullable(),
  your_rent_eur: z.number().nullable(),
  delta_percent: z.number().nullable(),
  may_be_entitled_to_reduction: z.boolean(),
  notes_en: z.string().nullable(),
  notes_de: z.string().nullable(),
});

export const LeaseAnalysisReport = z.object({
  risk_score: RiskScore,
  summary_en: z.string(),
  summary_de: z.string(),
  flagged_clauses: z.array(FlaggedClause),
  mietpreisbremse: MietpreisbremseAnalysis,
  next_steps_en: z.array(z.string()),
  next_steps_de: z.array(z.string()),
  metadata: z.object({
    clauses_analyzed: z.number().int().nonnegative(),
    model_used: z.string(),
    confidence_overall: z.number().min(0).max(1),
  }),
});

export type LeaseAnalysisReportT = z.infer<typeof LeaseAnalysisReport>;
export type FlaggedClauseT = z.infer<typeof FlaggedClause>;
