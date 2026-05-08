"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DeleteAccount() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Delete my data</h1>
      <p className="text-muted-foreground mb-6">
        Per Art. 17 DSGVO, we delete all uploaded leases, reports, and orders associated with your email. This cannot be undone.
      </p>
      {done ? (
        <p className="text-green-700">All data for {email} has been deleted.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email used at purchase</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" variant="destructive" disabled={loading}>
            {loading ? "Deleting..." : "Delete all my data"}
          </Button>
        </form>
      )}
    </main>
  );
}
