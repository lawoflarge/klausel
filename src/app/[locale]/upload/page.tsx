import { UploadDropzone } from "@/components/upload-dropzone";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          {locale === "de" ? "Mietvertrag hochladen" : "Upload your Mietvertrag"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {locale === "de"
            ? "PDF, max 10 MB. Wir analysieren in 5 Minuten und mailen dir den Bericht."
            : "PDF, max 10 MB. We analyze in 5 minutes and email the report."}
        </p>
        <UploadDropzone locale={locale} />
      </div>
    </main>
  );
}
