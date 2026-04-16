import Link from 'next/link';
import { BarChart3, BellRing, BrainCircuit, ShieldAlert } from 'lucide-react';

import { CheckoutPanel } from '@/components/CheckoutPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const faq = [
  {
    question: 'How is this different from provider dashboards?',
    answer:
      'Provider dashboards show totals per account. Token Cost Tracker attributes usage per agent and workflow so you can identify which automation is actually creating spend.',
  },
  {
    question: 'Do I need to move my agents to use this?',
    answer:
      'No. Connect your existing API keys and pull yesterday\'s usage across providers. The dashboard normalizes cost and token metrics in one place.',
  },
  {
    question: 'How do budget alerts work?',
    answer:
      'Set monthly budgets per agent. When a single agent exceeds its budget, a Discord webhook alert is sent with spend, budget, and overage amount.',
  },
  {
    question: 'Who is this built for?',
    answer:
      'Solo developers and small teams running several AI agents in production, especially Claude Code users, MCP builders, and workflow automation teams.',
  },
];

export default function HomePage() {
  return (
    <main className="grid-ambient">
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">AI Agent Cost Intelligence</p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            See exactly what each AI agent cost you yesterday, broken down by provider, model, and workflow.
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Most teams discover silent overages too late. Token Cost Tracker gives you per-agent attribution across OpenAI,
            Anthropic, Google, and Moltbook, then warns you when one workflow starts burning your monthly budget.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#pricing"
              className="rounded-md bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
            >
              Start Tracking for $19/mo
            </Link>
            <Link href="/dashboard" className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold hover:bg-slate-800">
              View Product Preview
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainCircuit className="h-5 w-5 text-cyan-300" />
              Per-Agent Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Know which agent, workflow, and model generated every token and dollar.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-emerald-300" />
              Unified Cost Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Track daily cost burn across all providers in one normalized dashboard.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              Runaway Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Flag agents that cross their monthly budget before end-of-month surprises.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="h-5 w-5 text-violet-300" />
              Discord Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Send actionable spend alerts to your ops channel when budgets are exceeded.</CardDescription>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-semibold text-white">The Problem</h2>
          <p className="mt-4 max-w-3xl text-slate-300">
            AI agents can silently burn $500-$5000/month when there is no per-workflow attribution. Provider consoles show
            account-level totals, but they do not answer the critical question: which production workflow is causing this spend?
            Without that visibility, teams cut features blindly or discover cost spikes only after invoices hit.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-semibold text-white">The Solution</h2>
          <p className="mt-4 max-w-3xl text-slate-300">
            Token Cost Tracker ingests yesterday&apos;s usage from all connected providers, normalizes token pricing by model,
            and maps spend to your real production agents and workflows. You can see 30-day trends, set per-agent budgets,
            and send automatic Discord alerts the moment any agent crosses its monthly limit.
          </p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Simple Pricing</CardTitle>
              <CardDescription>One plan for teams that need real visibility and control.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p className="text-4xl font-semibold text-white">
                $19<span className="text-base font-medium text-slate-400">/month</span>
              </p>
              <ul className="space-y-2 text-sm">
                <li>Connect OpenAI, Anthropic, Google, and Moltbook usage feeds</li>
                <li>Daily cost and token breakdowns per agent and workflow</li>
                <li>Monthly budget thresholds with Discord alerts</li>
                <li>30-day trend analysis for cost burn rate and model drift</li>
              </ul>
              <p className="text-sm text-slate-400">
                Dashboard access is paywalled. Complete checkout and unlock from this page instantly.
              </p>
            </CardContent>
          </Card>

          <CheckoutPanel />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-2xl font-semibold text-white">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle className="text-base">{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.answer}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
