import { SAMPLE_REPORT } from "@/lib/sample-report";
import { ReportView } from "@/components/report-view";

export default function SamplePage() {
  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
        <strong>Sample report.</strong> Generated from a fictional Berlin lease for demonstration. No real lease was analyzed.
      </div>
      <ReportView report={SAMPLE_REPORT} />
    </main>
  );
}
