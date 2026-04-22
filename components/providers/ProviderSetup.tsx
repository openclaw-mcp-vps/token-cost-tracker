"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProviderStatus {
  provider: string;
  configured: boolean;
  connected: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

interface ProviderSetupProps {
  providers: ProviderStatus[];
  onSyncCompleted: () => Promise<void>;
}

export function ProviderSetup({ providers, onSyncCompleted }: ProviderSetupProps): React.JSX.Element {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function syncNow(): Promise<void> {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ sync: true }),
      });

      const payload = (await response.json()) as {
        error?: string;
        addedEvents?: number;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Sync failed");
      }

      setSyncMessage(`Provider sync completed. ${payload.addedEvents ?? 0} new usage events ingested.`);
      await onSyncCompleted();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Connectivity</CardTitle>
        <CardDescription>
          Track API connectivity and trigger an on-demand sync across OpenAI, Anthropic, Google, and Moltbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {providers.map((provider) => (
            <div
              key={provider.provider}
              className="flex flex-col gap-2 rounded-md border border-slate-800 bg-[#0f1826] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium capitalize text-slate-100">{provider.provider}</p>
                <p className="text-xs text-slate-400">
                  {provider.lastSyncAt
                    ? `Last sync: ${new Date(provider.lastSyncAt).toLocaleString()}`
                    : "Not synced yet"}
                </p>
                {provider.lastError ? <p className="text-xs text-red-300">{provider.lastError}</p> : null}
              </div>
              <div className="flex gap-2">
                {provider.configured ? (
                  <Badge variant="secondary">Configured</Badge>
                ) : (
                  <Badge variant="warning">Missing Key</Badge>
                )}
                {provider.connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="danger">Disconnected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={syncNow} disabled={syncing}>
          {syncing ? "Syncing Providers..." : "Sync Provider Usage Now"}
        </Button>

        {syncMessage ? <p className="text-sm text-slate-300">{syncMessage}</p> : null}
      </CardContent>
    </Card>
  );
}
