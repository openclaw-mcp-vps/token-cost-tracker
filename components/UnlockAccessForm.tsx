"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UnlockAccessForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/webhooks/lemonsqueezy", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ action: "unlock", email })
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !payload.success) {
        setStatus(payload.error ?? "Unable to unlock your subscription right now.");
      } else {
        setStatus("Access granted. Redirecting to dashboard...");
        window.location.href = "/dashboard";
      }
    } catch {
      setStatus("Request failed. Please retry in a few seconds.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="space-y-1">
        <Label htmlFor="unlock-email">Already paid? Unlock your dashboard</Label>
        <Input
          id="unlock-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Verifying Purchase..." : "Unlock Dashboard"}
      </Button>

      {status ? <p className="text-sm text-[var(--muted-text)]">{status}</p> : null}
    </form>
  );
}
