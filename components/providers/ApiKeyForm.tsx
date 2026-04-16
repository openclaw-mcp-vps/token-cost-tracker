"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SaveState {
  loading: boolean;
  message: string;
}

export function ApiKeyForm() {
  const [state, setState] = useState<SaveState>({ loading: false, message: "" });

  async function syncUsage() {
    setState({ loading: true, message: "Syncing usage from all providers..." });
    const response = await fetch("/api/usage/sync", { method: "POST" });
    const data = (await response.json()) as { message?: string };
    setState({ loading: false, message: data.message ?? "Usage sync complete." });
  }

  return (
    <div className="card-surface p-5">
      <h3 className="text-lg font-semibold">Connect Provider Keys</h3>
      <p className="text-sm text-muted mt-1">
        Add your API keys as environment variables. Use this sync action to pull fresh usage into the dashboard.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <Input disabled value="OPENAI_API_KEY" />
        <Input disabled value="ANTHROPIC_API_KEY" />
        <Input disabled value="GOOGLE_API_KEY" />
        <Input disabled value="MOLTBOOK_API_KEY" />
      </div>
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <Button onClick={syncUsage} disabled={state.loading}>
          {state.loading ? "Syncing..." : "Sync Provider Usage"}
        </Button>
        <span className="text-sm text-muted">{state.message}</span>
      </div>
    </div>
  );
}
