export default function AGB() {
  return (
    <main className="prose mx-auto px-6 py-12 max-w-2xl">
      <h1>Allgemeine Geschäftsbedingungen</h1>

      <h2>1. Anbieter</h2>
      <p>Levin Schwab, [Adresse], support@klausel.app (im Folgenden „Klausel").</p>

      <h2>2. Leistungsumfang</h2>
      <p>Klausel bietet eine KI-gestützte Analyse von deutschen Mietverträgen mit zweisprachiger Berichterstellung. Die Analyse umfasst die Prüfung gegen kuratierte BGH-Urteile, BGB-Vorschriften und Mietspiegel-Daten.</p>
      <p><strong>Klausel ist keine Rechtsanwaltskanzlei und bietet keine Rechtsdienstleistungen im Sinne des RDG.</strong> Die Analyse stellt rechtliche Information und Bildung dar, keine verbindliche Rechtsberatung. Für rechtsverbindliche Auskünfte wende dich an einen Rechtsanwalt oder Mieterverein.</p>

      <h2>3. Preise und Zahlung</h2>
      <p>One-Shot Mietvertrag-Review: €19 brutto. Pro-Abo: €9,99/Monat oder €69/Jahr. Zahlung über Stripe.</p>

      <h2>4. Widerruf und Erstattung</h2>
      <p>Bei One-Shot-Käufen: 7-tägige Rückerstattung möglich, sofern der Bericht nicht heruntergeladen wurde. Pro-Abo: jederzeit kündbar (1-Klick-Kündigungsbutton in /account/billing), 7-tägige Erstattung der ersten Monatsgebühr.</p>

      <h2>5. Haftung</h2>
      <p>Die Haftung ist auf den Kaufpreis (€19 für One-Shot, eine Monatsgebühr für Pro) begrenzt. Klausel haftet nicht für Schäden aus der Nutzung der Analyseergebnisse, da diese keine Rechtsberatung darstellen. Die Haftung für Vorsatz und grobe Fahrlässigkeit bleibt unberührt.</p>

      <h2>6. Datenschutz</h2>
      <p>Siehe <a href="/datenschutz">Datenschutzerklärung</a>.</p>

      <h2>7. Anwendbares Recht</h2>
      <p>Es gilt deutsches Recht. Gerichtsstand für Verbraucher: Wohnsitz des Verbrauchers.</p>

      <p className="text-xs text-muted-foreground mt-8">
        Stand: 2026-05-08. Vollständige Version vor Produktivstart anwaltlich prüfen lassen (siehe Sektion 5a der Design-Spec).
      </p>
    </main>
  );
}
