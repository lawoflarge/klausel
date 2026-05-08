"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  "Reading lease...",
  "Translating clauses...",
  "Cross-checking BGB...",
  "Flagging risks...",
  "Generating report...",
];

export default function ProcessPage({
  params,
}: {
  params: Promise<{ reportId: string; locale: string }>;
}) {
  const { reportId: sessionId, locale } = use(params);
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 8000);

    const pollInterval = setInterval(async () => {
      const res = await fetch(`/api/reports/${sessionId}/status`);
      const data = await res.json();
      if (data.status === "completed" && data.reportId) {
        clearInterval(pollInterval);
        clearInterval(stageInterval);
        router.replace(`/${locale}/report/${data.reportId}`);
      } else if (data.status === "failed") {
        clearInterval(pollInterval);
        clearInterval(stageInterval);
        setError(data.error ?? "Analysis failed. We've issued a refund.");
      }
    }, 3000);

    return () => {
      clearInterval(stageInterval);
      clearInterval(pollInterval);
    };
  }, [sessionId, router, locale]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="mt-4 text-sm">A refund has been initiated. Email support@klausel.app if it doesn&apos;t arrive in 5 days.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">
          {locale === "de" ? "Analyse läuft..." : "Analyzing your lease..."}
        </h1>
        <p className="text-lg text-muted-foreground animate-pulse">{STAGES[stage]}</p>
        <p className="mt-8 text-sm text-muted-foreground">
          {locale === "de"
            ? "Üblicherweise 60-90 Sekunden. Du kannst dieses Fenster offen lassen oder warten — wir mailen dir den Bericht."
            : "Usually 60-90 seconds. You can leave this open or close it — we'll email you the report."}
        </p>
      </div>
    </main>
  );
}
