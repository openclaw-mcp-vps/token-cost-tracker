"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const openCheckout = async () => {
    setCheckoutError(null);
    setLoadingCheckout(true);

    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      const lemon = (window as Window & {
        LemonSqueezy?: { Url?: { Open?: (url: string) => void };
        };
      }).LemonSqueezy;

      if (lemon?.Url?.Open) {
        lemon.Url.Open(data.checkoutUrl);
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-20">
        <section className="rounded-3xl border border-slate-800 bg-[#0f172a]/60 p-8 shadow-2xl shadow-cyan-900/20 sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-6">
              <p className="inline-block rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-sm text-cyan-300">
                AI Agent Cost Control for Solo Builders and Small Teams
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
                See exactly what each AI agent cost you yesterday
              </h1>
              <p className="text-lg leading-relaxed text-slate-300">
                Token Cost Tracker aggregates usage from OpenAI, Anthropic, Google, and Moltbook and
                attributes spend to the specific workflow that generated it. Spot outliers in minutes,
                not after your card is charged.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={openCheckout}
                disabled={loadingCheckout}
                className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingCheckout ? "Opening checkout..." : "Start for $19/mo"}
              </button>
              <Link
                href="/dashboard"
                className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:border-cyan-400"
              >
                I already paid, open dashboard
              </Link>
              {checkoutError ? <p className="text-sm text-rose-300">{checkoutError}</p> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "The Problem",
              text: "Provider consoles show total usage per account, but not which production workflow burned the budget."
            },
            {
              title: "The Solution",
              text: "Track token and dollar usage by agent and workflow with provider-level detail and historical trends."
            },
            {
              title: "The Outcome",
              text: "Catch runaway prompts early, enforce monthly limits, and keep your AI margin predictable."
            }
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-2xl font-semibold text-slate-100">Pricing</h2>
          <p className="mt-2 max-w-2xl text-slate-300">
            One plan, built for builders shipping real agents. Includes unlimited tracked requests, daily
            snapshots, Discord alerts, and workflow-level attribution.
          </p>
          <div className="mt-6 max-w-md rounded-2xl border border-cyan-900 bg-cyan-950/30 p-6">
            <p className="text-sm text-cyan-200">Token Cost Tracker</p>
            <p className="mt-2 text-4xl font-bold text-slate-100">$19<span className="text-lg text-slate-300">/mo</span></p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>Per-agent spend attribution across providers</li>
              <li>Monthly budget threshold alerts to Discord</li>
              <li>Daily and monthly burn trend dashboard</li>
              <li>API routes for provider ingestion and webhook sync</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-2xl font-semibold text-slate-100">FAQ</h2>
          <div className="mt-6 space-y-5 text-sm text-slate-300">
            <div>
              <h3 className="font-semibold text-slate-100">How is usage attributed to one workflow?</h3>
              <p className="mt-1">
                Each usage record stores provider metadata, model, agent key, and workflow tag. You can
                pass these tags from your runtime or map API keys to agents.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Do I need to move my existing agent stack?</h3>
              <p className="mt-1">
                No. Keep your current stack and send usage events to the provider ingestion endpoints.
                The dashboard normalizes and aggregates cost data in Postgres.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">What happens after checkout?</h3>
              <p className="mt-1">
                Lemon Squeezy webhook marks your account as active. The dashboard unlocks with a secure
                access cookie so only paying users can open the tool.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
