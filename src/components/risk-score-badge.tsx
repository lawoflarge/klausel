import { Badge } from "@/components/ui/badge";

export function RiskScoreBadge({ score }: { score: "GREEN" | "YELLOW" | "RED" }) {
  const variant =
    score === "GREEN" ? "default" : score === "YELLOW" ? "secondary" : "destructive";
  const label = score === "GREEN" ? "Low risk" : score === "YELLOW" ? "Caution" : "High risk";
  return (
    <Badge variant={variant} className="text-base px-3 py-1">
      {score} — {label}
    </Badge>
  );
}
