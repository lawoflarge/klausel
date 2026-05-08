"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DeleteAccount() {
  const [email, setEmail] = useState("");
  const [requested, setRequested] = useState(false);
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
    if (res.ok) setRequested(true);
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Delete my data</h1>
      <p className="text-muted-foreground mb-6">
        Per Art. 17 DSGVO, we delete all uploaded leases, reports, and orders associated with your email. We&apos;ll send you a confirmation link first.
      </p>
      {requested ? (
        <p className="text-green-700">
          If {email} is registered with us, a confirmation email has been sent. Click the link in that email to complete the deletion. The link expires in 24 hours.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email used at purchase</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send confirmation email"}
          </Button>
        </form>
      )}
    </main>
  );
}
