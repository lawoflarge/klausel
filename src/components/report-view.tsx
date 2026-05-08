"use client";
import { useLocale } from "next-intl";
import { RiskScoreBadge } from "./risk-score-badge";
import { FlaggedClauseCard } from "./flagged-clause-card";
import { MietpreisbremseCard } from "./mietpreisbremse-card";
import type { LeaseAnalysisReportT } from "@/lib/ai/schema";

export function ReportView({ report }: { report: LeaseAnalysisReportT }) {
  const locale = useLocale();
  const summary = locale === "de" ? report.summary_de : report.summary_en;
  const nextSteps = locale === "de" ? report.next_steps_de : report.next_steps_en;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <RiskScoreBadge score={report.risk_score} />
        <h1 className="text-2xl font-bold">{summary}</h1>
      </header>

      <MietpreisbremseCard data={report.mietpreisbremse} locale={locale} />

      <section>
        <h2 className="text-xl font-semibold mb-4">
          {locale === "de"
            ? `${report.flagged_clauses.length} Klauseln markiert`
            : `${report.flagged_clauses.length} flagged clauses`}
        </h2>
        {report.flagged_clauses.map((c, i) => (
          <FlaggedClauseCard key={i} clause={c} locale={locale} />
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          {locale === "de" ? "Nächste Schritte" : "Next steps"}
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          {nextSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </section>

      <footer className="text-xs text-muted-foreground border-t pt-4">
        {locale === "de"
          ? `Analyse mit ${report.metadata.model_used}, Konfidenz ${(report.metadata.confidence_overall * 100).toFixed(0)}%, ${report.metadata.clauses_analyzed} Klauseln geprüft.`
          : `Analyzed with ${report.metadata.model_used}, overall confidence ${(report.metadata.confidence_overall * 100).toFixed(0)}%, ${report.metadata.clauses_analyzed} clauses reviewed.`}
      </footer>
    </div>
  );
}
