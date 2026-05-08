import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FlaggedClauseT } from "@/lib/ai/schema";

export function FlaggedClauseCard({
  clause,
  locale,
}: {
  clause: FlaggedClauseT;
  locale: string;
}) {
  const sevColor =
    clause.severity === "CRITICAL"
      ? "destructive"
      : clause.severity === "WARN"
        ? "secondary"
        : "outline";
  const reason = locale === "de" ? clause.reason_de : clause.reason_en;
  const negotiation = locale === "de" ? clause.negotiation_script_de : clause.negotiation_script_en;
  const clauseText = locale === "de" ? clause.clause_text_de : clause.clause_text_en;

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row justify-between items-start">
        <CardTitle className="text-base">{clause.legal_basis}</CardTitle>
        <div className="flex gap-2 items-center">
          <Badge variant={sevColor}>{clause.severity}</Badge>
          <span className="text-xs text-muted-foreground">
            {(clause.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <blockquote className="border-l-2 pl-4 italic">{clauseText}</blockquote>
        <p>{reason}</p>
        {negotiation && (
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">
              {locale === "de" ? "Verhandlungsskript:" : "Negotiation script:"}
            </p>
            <p>{negotiation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
