"use client";
import { use, useEffect, useState } from "react";

export default function ConfirmDeletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = use(searchParams);
  const [status, setStatus] = useState<"idle" | "deleting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid confirmation link.");
      setStatus("error");
      return;
    }
  }, [token, email]);

  async function confirmDelete() {
    if (!token || !email) return;
    setStatus("deleting");
    const res = await fetch("/api/account/delete/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Deletion failed.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Confirm data deletion</h1>
      {status === "idle" && (
        <>
          <p className="text-muted-foreground mb-6">
            This will permanently delete all uploaded leases, reports, and orders for {email}. This cannot be undone.
          </p>
          <button
            onClick={confirmDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Delete all my data
          </button>
        </>
      )}
      {status === "deleting" && <p>Deleting your data...</p>}
      {status === "done" && (
        <p className="text-green-700">All data for {email} has been permanently deleted.</p>
      )}
      {status === "error" && (
        <p className="text-destructive">
          {error ?? "Something went wrong. The link may have expired (24h TTL) or been used already."}
        </p>
      )}
    </main>
  );
}
