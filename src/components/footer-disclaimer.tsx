import Link from "next/link";

export function FooterDisclaimer() {
  return (
    <footer className="border-t bg-muted/30 mt-12">
      <div className="max-w-4xl mx-auto px-6 py-6 text-xs text-muted-foreground space-y-2">
        <p>
          Klausel ist keine Rechtsanwaltskanzlei. Wir bieten KI-gestützte Mietvertragsanalyse und Mieterbildung. Für verbindliche Rechtsberatung wende dich an einen Rechtsanwalt oder Mieterverein.
        </p>
        <nav className="space-x-4">
          <Link href="/impressum" className="hover:underline">Impressum</Link>
          <Link href="/datenschutz" className="hover:underline">Datenschutz</Link>
          <Link href="/agb" className="hover:underline">AGB</Link>
        </nav>
      </div>
    </footer>
  );
}
