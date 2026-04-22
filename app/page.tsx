import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, BellRing, Bot, ChartNoAxesCombined, ShieldAlert, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE_NAME, isAccessAllowed } from "@/lib/access";

const faqs = [
  {
    q: "How does per-agent attribution work?",
    a: "Token Cost Tracker merges provider-level usage sync with direct agent event ingestion so every request maps to an agent and workflow, not just a provider total.",
  },
  {
    q: "Will this help me catch runaway automations early?",
    a: "Yes. You set monthly per-agent and workspace caps, and the app pushes Discord alerts as soon as a threshold is crossed.",
  },
  {
    q: "Do I need to migrate my stack?",
    a: "No. Keep your existing agent infrastructure and post usage events through one API endpoint. Provider sync fills in the baseline, while ingestion gives exact attribution.",
  },
  {
    q: "Who is this built for?",
    a: "Solo developers and small teams running multiple production agents, especially Claude Code users, MCP developers, and AI workflow builders.",
  },
];

export default async function HomePage(): Promise<React.JSX.Element> {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
  const cookieStore = await cookies();
  const hasAccess = isAccessAllowed(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  return (
    <main className="relative overflow-x-hidden">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-14 md:pt-20">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-600/30 bg-orange-600/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-orange-200">
          <span className="h-2 w-2 rounded-full bg-orange-300" />
          Token Cost Tracker
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
              See exactly what each AI agent cost you yesterday, broken down by provider, model, and workflow.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Your agents can silently burn $500 to $5,000 per month before anyone notices. Token Cost Tracker gives you real per-agent cost attribution across OpenAI, Anthropic, Google, and Moltbook with Discord alerts before budget drift becomes a problem.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={paymentLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Start for $19/mo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>

              <Link href={hasAccess ? "/dashboard" : "/unlock"} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {hasAccess ? "Open Dashboard" : "Unlock Purchased Access"}
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Why teams switch</CardTitle>
              <CardDescription>Provider consoles show totals. You need attribution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border border-slate-800 bg-[#0f1826] p-4">
                <p className="font-medium text-slate-200">Without attribution</p>
                <p className="mt-1 text-slate-400">"OpenAI spend up 41% this month" and no idea which workflow caused it.</p>
              </div>
              <div className="rounded-lg border border-orange-700/40 bg-orange-900/10 p-4">
                <p className="font-medium text-orange-100">With Token Cost Tracker</p>
                <p className="mt-1 text-orange-200/90">
                  "`support-triage-agent` on `claude-sonnet` crossed $120 this month at 03:42 UTC."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-orange-300" />Per-Agent Ledger</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Attribute spend to specific agents and workflows instead of unreadable provider totals.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><ChartNoAxesCombined className="h-4 w-4 text-cyan-300" />Trend Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Review token burn by day, provider, model, and request volume in one operational dashboard.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-red-300" />Runaway Detection</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Flag any agent that exceeds your monthly budget before the invoice hits your card.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><BellRing className="h-4 w-4 text-emerald-300" />Discord Alerts</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Send immediate budget breach alerts to the team channel where incidents are already handled.
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="warning" className="w-fit">Problem</Badge>
            <CardTitle className="pt-2">Provider-level dashboards hide workflow waste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>OpenAI Usage and Anthropic Console only answer "how much total". They do not answer "which agent caused it".</p>
            <p>When one automation loops or a prompt expands unexpectedly, spend can run up for days without per-agent visibility.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge className="w-fit">Solution</Badge>
            <CardTitle className="pt-2">One dashboard for cost accountability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>Connect OpenAI, Anthropic, Google, and Moltbook APIs, then ingest workflow events for exact attribution.</p>
            <p>Set hard budget caps and get Discord alerts the moment any single agent breaches threshold.</p>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <Card className="border-orange-700/30 bg-gradient-to-br from-[#171b23] to-[#111827]">
          <CardHeader>
            <Badge className="w-fit" variant="warning">Pricing</Badge>
            <CardTitle className="pt-2 text-3xl">$19/month</CardTitle>
            <CardDescription>Built for solo devs and small teams shipping multiple AI agents in production.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Multi-provider usage sync (OpenAI, Anthropic, Google, Moltbook)</li>
              <li>Per-agent and per-workflow attribution</li>
              <li>Runaway detection with monthly cap alerts</li>
              <li>Discord webhook notifications</li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={paymentLink} target="_blank" rel="noreferrer">
                <Button size="lg">
                  Buy with Stripe Checkout
                  <Wallet className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/unlock" className="text-sm text-slate-300 underline-offset-4 hover:underline">
                Already paid? Unlock dashboard access
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-semibold text-slate-100">Frequently Asked Questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardHeader>
                <CardTitle className="text-base">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">{faq.a}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
