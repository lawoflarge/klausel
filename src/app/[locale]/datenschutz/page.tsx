export default function Datenschutz() {
  return (
    <main className="prose mx-auto px-6 py-12 max-w-2xl">
      <h1>Datenschutzerklärung</h1>

      <h2>1. Verantwortlicher</h2>
      <p>Levin Schwab, [Adresse], support@klausel.app</p>

      <h2>2. Erhobene Daten</h2>
      <ul>
        <li>E-Mail-Adresse (zur Berichtsversendung)</li>
        <li>Hochgeladene Mietverträge (zur Analyse, Speicherung max. 30 Tage)</li>
        <li>Bundesland, Grundmiete, Mietbeginn (Pflichtangaben für Analyse)</li>
        <li>Zahlungsdaten (verarbeitet von Stripe Inc., separate Datenschutzerklärung)</li>
        <li>Server-Logs (IP, User-Agent, anonymisiert nach 7 Tagen)</li>
      </ul>

      <h2>3. Auftragsverarbeiter</h2>
      <ul>
        <li>Anthropic (KI-Analyse, US-Anbieter, EU-SCCs)</li>
        <li>Supabase (Hosting + Storage, EU-Region Frankfurt)</li>
        <li>Stripe (Zahlungsabwicklung, EU-Stripe Payments Europe)</li>
        <li>Resend (E-Mail-Versand, EU-Region)</li>
        <li>Vercel (Hosting, EU-Edge)</li>
        <li>PostHog (Analytics, EU-Region, server-side ohne Cookies)</li>
      </ul>

      <h2>4. Speicherdauer</h2>
      <p>Hochgeladene Mietverträge werden 30 Tage nach Upload automatisch gelöscht. Berichte bleiben für die gesetzliche Aufbewahrungsfrist (10 Jahre für Rechnungen) gespeichert. Auf Anfrage löschen wir alle Daten unter <a href="/account/delete">/account/delete</a>.</p>

      <h2>5. Deine Rechte</h2>
      <p>Auskunft, Berichtigung, Löschung, Datenübertragbarkeit, Beschwerde bei der zuständigen Aufsichtsbehörde (für Berlin: Berliner Beauftragte für Datenschutz und Informationsfreiheit).</p>

      <h2>6. Cookies</h2>
      <p>Klausel verwendet keine Tracking-Cookies. Analytics laufen serverseitig ohne Browser-Cookies. Stripe Checkout setzt eigene Cookies — siehe Stripe Datenschutzerklärung.</p>

      <p className="text-xs text-muted-foreground mt-8">
        Stand: 2026-05-08. Diese Erklärung wird vor Produktivstart durch eine vollständige, anwaltlich geprüfte Version ersetzt (siehe e-recht24.de Generator).
      </p>
    </main>
  );
}
