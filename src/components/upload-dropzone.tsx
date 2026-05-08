"use client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadDropzone({ locale }: { locale: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [bundesland, setBundesland] = useState("Berlin");
  const [baseRent, setBaseRent] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDrop: (accepted) => {
      if (accepted[0]) setFile(accepted[0]);
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError(locale === "de" ? "Bitte Mietvertrag hochladen" : "Please upload a Mietvertrag");
      return;
    }
    setSubmitting(true);
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          distinctId: email,
          event: "upload_started",
          properties: { bundesland, baseRentEur: Number(baseRent) },
        }),
      }).catch(() => {}); // fire-and-forget, never block upload

      const initRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: "application/pdf",
          email,
          bundesland,
          baseRentEur: Number(baseRent),
          leaseStartDate: null,
        }),
      });
      if (!initRes.ok) throw new Error(`upload init failed: ${initRes.status}`);
      const { uploadId, signedUrl } = await initRes.json();

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "content-type": "application/pdf" },
        body: file,
      });
      if (!putRes.ok) throw new Error(`PDF upload failed: ${putRes.status}`);

      window.location.href = `/api/checkout?uploadId=${uploadId}`;
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-accent" : "border-muted-foreground/30"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="font-medium">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
        ) : (
          <p className="text-muted-foreground">
            {locale === "de" ? "PDF hierher ziehen oder klicken" : "Drag PDF here or click to upload"}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bundesland">Bundesland</Label>
        <select id="bundesland" className="border rounded-md p-2" value={bundesland} onChange={(e) => setBundesland(e.target.value)}>
          {["Berlin", "Bayern", "Hamburg", "Hessen", "Nordrhein-Westfalen", "Baden-Württemberg", "Other"].map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="baseRent">{locale === "de" ? "Grundmiete (€/Monat)" : "Base rent (€/month)"}</Label>
        <Input id="baseRent" type="number" step="0.01" required value={baseRent} onChange={(e) => setBaseRent(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full" size="lg">
        {submitting
          ? locale === "de" ? "Wird hochgeladen..." : "Uploading..."
          : locale === "de" ? "Weiter zur Zahlung — €19" : "Continue to checkout — €19"}
      </Button>
    </form>
  );
}
