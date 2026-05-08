import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPDF } from "./report-template";
import type { LeaseAnalysisReportT } from "@/lib/ai/schema";
import { createElement } from "react";

export async function generateReportPDF(report: LeaseAnalysisReportT): Promise<Buffer> {
  // ReportPDF returns a <Document>, but TS can't see through the component
  // wrapper to verify the element is `ReactElement<DocumentProps>`. The runtime
  // contract is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(ReportPDF, { report }) as any;
  return renderToBuffer(element);
}
