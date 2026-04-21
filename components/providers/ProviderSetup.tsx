"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plug2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProviderRow {
  provider: "openai" | "anthropic" | "google" | "moltbook";
  connected: boolean;
  enabled: boolean;
  updatedAt: string | null;
  apiKeyMasked: string | null;
  baseUrl: string | null;
  organizationId: string | null;
}

interface ProviderSetupProps {
  onSaved?: () => void;
}

export function ProviderSetup({ onSaved }: ProviderSetupProps) {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [organizationIds, setOrganizationIds] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const sortedProviders = useMemo(
    () => [...providers].sort((a, b) => (a.provider < b.provider ? -1 : 1)),
    [providers]
  );

  async function refreshProviders() {
    const response = await fetch("/api/providers", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { providers: ProviderRow[] };
    setProviders(payload.providers);
  }

  useEffect(() => {
    void refreshProviders();
  }, []);

  async function saveProvider(event: FormEvent, provider: ProviderRow["provider"]) {
    event.preventDefault();
    setStatus(null);
    setLoadingProvider(provider);

    try {
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKeys[provider],
          enabled: true,
          baseUrl: baseUrls[provider] || undefined,
          organizationId: organizationIds[provider] || undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setStatus(payload.error ?? `Failed to save ${provider} credentials.`);
      } else {
        setStatus(`${provider} connected.`);
        setApiKeys((current) => ({ ...current, [provider]: "" }));
        await refreshProviders();
        onSaved?.();
      }
    } catch {
      setStatus(`Network failure while saving ${provider}.`);
    } finally {
      setLoadingProvider(null);
    }
  }

  async function disconnectProvider(provider: ProviderRow["provider"]) {
    setStatus(null);
    setLoadingProvider(provider);

    try {
      const response = await fetch(`/api/providers?provider=${provider}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setStatus(payload.error ?? `Failed to disconnect ${provider}.`);
      } else {
        setStatus(`${provider} disconnected.`);
        await refreshProviders();
      }
    } catch {
      setStatus(`Network failure while disconnecting ${provider}.`);
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug2 className="h-5 w-5 text-[#58a6ff]" />
          Provider Connections
        </CardTitle>
        <CardDescription>
          Connect your OpenAI, Anthropic, Google, and Moltbook keys to pull usage data directly from provider APIs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedProviders.map((provider) => (
          <form
            key={provider.provider}
            onSubmit={(event) => void saveProvider(event, provider.provider)}
            className="rounded-lg border border-[var(--border)] bg-[#0f1620] p-4"
          >
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium capitalize">{provider.provider}</p>
                <p className="text-xs text-[var(--muted-text)]">
                  {provider.connected ? `Connected (${provider.apiKeyMasked})` : "Not connected"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {provider.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#3fb950]">
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-text)]">
                    <XCircle className="h-4 w-4" />
                    Inactive
                  </span>
                )}

                {provider.connected ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => void disconnectProvider(provider.provider)}
                    disabled={loadingProvider === provider.provider}
                  >
                    Disconnect
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor={`${provider.provider}-key`}>API Key</Label>
                <Input
                  id={`${provider.provider}-key`}
                  type="password"
                  value={apiKeys[provider.provider] ?? ""}
                  onChange={(event) => setApiKeys((current) => ({ ...current, [provider.provider]: event.target.value }))}
                  placeholder={provider.connected ? "Enter new key to rotate credentials" : "Paste API key"}
                  required={!provider.connected}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${provider.provider}-org`}>Org / Project ID</Label>
                <Input
                  id={`${provider.provider}-org`}
                  value={organizationIds[provider.provider] ?? provider.organizationId ?? ""}
                  onChange={(event) =>
                    setOrganizationIds((current) => ({ ...current, [provider.provider]: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <Label htmlFor={`${provider.provider}-base-url`}>Custom Base URL</Label>
              <Input
                id={`${provider.provider}-base-url`}
                type="url"
                value={baseUrls[provider.provider] ?? provider.baseUrl ?? ""}
                onChange={(event) => setBaseUrls((current) => ({ ...current, [provider.provider]: event.target.value }))}
                placeholder="Optional: https://..."
              />
            </div>

            <div className="mt-3 flex justify-end">
              <Button type="submit" size="sm" disabled={loadingProvider === provider.provider}>
                {loadingProvider === provider.provider ? "Saving..." : `Save ${provider.provider}`}
              </Button>
            </div>
          </form>
        ))}

        {status ? <p className="text-sm text-[var(--muted-text)]">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
