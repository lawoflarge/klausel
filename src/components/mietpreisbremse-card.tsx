import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeaseAnalysisReportT } from "@/lib/ai/schema";

export function MietpreisbremseCard({
  data,
  locale,
}: {
  data: LeaseAnalysisReportT["mietpreisbremse"];
  locale: string;
}) {
  if (!data.applies) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mietpreisbremse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {locale === "de"
              ? "Mietpreisbremse gilt in deinem Bundesland nicht oder wurde im Vertrag korrekt eingehalten."
              : "Mietpreisbremse does not apply in your Bundesland or your lease complies."}
          </p>
        </CardContent>
      </Card>
    );
  }
  const note = locale === "de" ? data.notes_de : data.notes_en;
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Mietpreisbremse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>{locale === "de" ? "Deine Miete" : "Your rent"}</span>
          <strong>€{data.your_rent_eur?.toFixed(2)}</strong>
        </div>
        <div className="flex justify-between">
          <span>{locale === "de" ? "Geschätzte ortsübliche" : "Estimated local average"}</span>
          <strong>€{data.ortsuebliche_vergleichsmiete_estimate_eur?.toFixed(2)}</strong>
        </div>
        <div className="flex justify-between">
          <span>{locale === "de" ? "Differenz" : "Delta"}</span>
          <strong className={data.delta_percent && data.delta_percent > 10 ? "text-destructive" : ""}>
            +{data.delta_percent?.toFixed(1)}%
          </strong>
        </div>
        {data.may_be_entitled_to_reduction && (
          <p className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border rounded-md">
            {locale === "de"
              ? "Möglicherweise hast du Anspruch auf Mietminderung nach Mietpreisbremse (BGB §556d)."
              : "You may be entitled to rent reduction under Mietpreisbremse (BGB §556d)."}
          </p>
        )}
        {note && <p className="text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}
