import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { LeaseAnalysisReportT } from "@/lib/ai/schema";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  badge: { padding: 4, fontSize: 10, fontWeight: 700, marginBottom: 8 },
  badgeRed: { backgroundColor: "#fee", color: "#900" },
  badgeYellow: { backgroundColor: "#ffd", color: "#660" },
  badgeGreen: { backgroundColor: "#efe", color: "#060" },
  bilingual: { flexDirection: "row", gap: 8, marginVertical: 4 },
  bilingualCol: { flex: 1, padding: 6, backgroundColor: "#f5f5f5", borderRadius: 4 },
  clauseCard: { borderLeftWidth: 2, borderLeftColor: "#999", paddingLeft: 8, marginBottom: 12 },
  meta: { fontSize: 8, color: "#666", marginTop: 24, borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 6 },
});

export function ReportPDF({ report }: { report: LeaseAnalysisReportT }) {
  const badgeStyle =
    report.risk_score === "RED"
      ? styles.badgeRed
      : report.risk_score === "YELLOW"
        ? styles.badgeYellow
        : styles.badgeGreen;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Klausel — Mietvertrag Analysis</Text>
        <Text style={[styles.badge, badgeStyle]}>{report.risk_score}</Text>

        <View style={styles.bilingual}>
          <View style={styles.bilingualCol}>
            <Text style={{ fontWeight: 700 }}>Summary (EN)</Text>
            <Text>{report.summary_en}</Text>
          </View>
          <View style={styles.bilingualCol}>
            <Text style={{ fontWeight: 700 }}>Zusammenfassung (DE)</Text>
            <Text>{report.summary_de}</Text>
          </View>
        </View>

        <Text style={styles.h2}>Mietpreisbremse</Text>
        {report.mietpreisbremse.applies ? (
          <Text>
            Your rent: €{report.mietpreisbremse.your_rent_eur?.toFixed(2)} | Local average: €
            {report.mietpreisbremse.ortsuebliche_vergleichsmiete_estimate_eur?.toFixed(2)} | Δ{" "}
            {report.mietpreisbremse.delta_percent?.toFixed(1)}%
          </Text>
        ) : (
          <Text>Mietpreisbremse does not apply / lease compliant.</Text>
        )}

        <Text style={styles.h2}>Flagged clauses ({report.flagged_clauses.length})</Text>
        {report.flagged_clauses.map((c, i) => (
          <View key={i} style={styles.clauseCard}>
            <Text style={{ fontWeight: 700 }}>
              {c.severity} — {c.legal_basis} (confidence {(c.confidence * 100).toFixed(0)}%)
            </Text>
            <View style={styles.bilingual}>
              <View style={styles.bilingualCol}>
                <Text>EN: {c.clause_text_en}</Text>
                <Text style={{ marginTop: 4 }}>{c.reason_en}</Text>
              </View>
              <View style={styles.bilingualCol}>
                <Text>DE: {c.clause_text_de}</Text>
                <Text style={{ marginTop: 4 }}>{c.reason_de}</Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.h2}>Next steps</Text>
        <View style={styles.bilingual}>
          <View style={styles.bilingualCol}>
            {report.next_steps_en.map((s, i) => (
              <Text key={i}>• {s}</Text>
            ))}
          </View>
          <View style={styles.bilingualCol}>
            {report.next_steps_de.map((s, i) => (
              <Text key={i}>• {s}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.meta}>
          Klausel ist keine Rechtsanwaltskanzlei. Bericht stellt keine Rechtsberatung dar. — Klausel
          is not a law firm. Report is not legal advice. — {report.metadata.model_used} — confidence{" "}
          {(report.metadata.confidence_overall * 100).toFixed(0)}%
        </Text>
      </Page>
    </Document>
  );
}
