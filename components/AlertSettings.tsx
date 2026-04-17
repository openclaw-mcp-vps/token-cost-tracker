"use client";

import { FormEvent, useState } from "react";

export function AlertSettings() {
  const [agentId, setAgentId] = useState("agent-production");
  const [budget, setBudget] = useState("100");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Checking monthly spend...");

    const response = await fetch("/api/alerts/discord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agentId,
        monthlyBudgetUsd: Number(budget)
      })
    });

    const data = (await response.json()) as { message?: string };
    setStatus(data.message || "Alert check completed.");
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Discord Budget Alerts</h2>
      <p className="mt-1 text-sm text-slate-400">
        Trigger an alert whenever one agent crosses your monthly budget threshold.
      </p>
      <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={submit}>
        <input
          value={agentId}
          onChange={(event) => setAgentId(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500 focus:ring-2"
          placeholder="Agent ID"
          required
        />
        <input
          type="number"
          min="1"
          step="1"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500 focus:ring-2"
          placeholder="Monthly budget (USD)"
          required
        />
        <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400">
          Save & Test Alert
        </button>
      </form>
      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}
    </section>
  );
}
