"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UnlockForm(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function unlock(): Promise<void> {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not unlock dashboard");
      }

      setMessage(payload.message ?? "Access unlocked. Redirecting to dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to unlock access");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Unlock Your Dashboard</CardTitle>
        <CardDescription>
          Enter the same email address used at Stripe checkout to activate your cookie-based access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Checkout Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>
        {message ? <p className="text-sm text-slate-300">{message}</p> : null}
        <Button onClick={unlock} disabled={loading || email.trim().length === 0}>
          {loading ? "Checking Purchase..." : "Unlock Dashboard"}
        </Button>
      </CardContent>
    </Card>
  );
}
