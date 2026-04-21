import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, Coins, Workflow } from "lucide-react";
import { UnlockAccessForm } from "@/components/UnlockAccessForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stripePaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";

const faqItems = [
  {
    question: "How does attribution work per agent and workflow?",
    answer:
      "Token Cost Tracker accepts provider usage pulls and direct ingest events from your agent runtime. If you send `agentId` and `workflow`, attribution is exact and immediately visible in the dashboard."
  },
  {
    question: "Do I need all four providers connected?",
    answer:
      "No. Connect only the providers you actively use. The dashboard still works if you only run OpenAI or only run Anthropic workloads."
  },
  {
    question: "How are alerts triggered?",
    answer:
      "Set a monthly per-agent budget and Discord webhook URL. As soon as any agent crosses the limit, the app sends a Discord message with provider-level spend breakdown."
  },
  {
    question: "Can I keep API keys out of the browser?",
    answer:
      "Yes. Provider keys are stored server-side in local app storage and never rendered back to the browser in plain text."
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[#161b22] px-3 py-1 text-xs text-[#8b949e]">
              AI Agent Tools · $19/month
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              See exactly what each AI agent cost you yesterday.
            </h1>
            <p className="max-w-2xl text-lg text-[var(--muted-text)]">
              Stop invisible token burn. Track OpenAI, Anthropic, Google, and Moltbook spend by agent, model, and workflow with
              automated Discord alerts when costs start running away.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={stripePaymentLink} className="inline-flex">
                <Button size="lg" className="w-full sm:w-auto">
                  Buy For $19/month
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/dashboard" className="inline-flex">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Go To Dashboard
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--muted-text)]">Typical Savings</p>
                <p className="text-2xl font-semibold">$500+/mo</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--muted-text)]">Supported Providers</p>
                <p className="text-2xl font-semibold">4</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--muted-text)]">Alert Destination</p>
                <p className="text-2xl font-semibold">Discord</p>
              </div>
            </div>
          </div>

          <UnlockAccessForm />
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[#11182666]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold">The Problem</h2>
          <p className="mt-2 max-w-3xl text-[var(--muted-text)]">
            Provider dashboards show total account spend, but your business runs many workflows. Without per-agent attribution,
            runaway prompts hide in aggregate billing until month-end. Teams discover overruns too late, after shipping costs have
            already compounded.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">No Per-Workflow Visibility</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-text)]">
                One expensive agent can quietly consume the budget while everything else looks normal.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Surprises</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-text)]">
                Billing jumps from a few hundred to thousands before anyone notices the source.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Slow Incident Response</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-text)]">
                Without live alerting, there is no immediate signal when a specific agent breaches budget.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold">The Solution</h2>
        <p className="mt-2 max-w-3xl text-[var(--muted-text)]">
          Token Cost Tracker pulls usage across providers, normalizes spend, and gives you a single cost command center by day,
          model, workflow, and agent.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-[#58a6ff]" />
                Daily Spend Timeline
              </CardTitle>
              <CardDescription>Detect sudden burn spikes immediately.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Workflow className="h-4 w-4 text-[#58a6ff]" />
                Per-Agent Attribution
              </CardTitle>
              <CardDescription>Understand exactly which workflow is driving cost.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-4 w-4 text-[#58a6ff]" />
                Model-Level Cost Breakdown
              </CardTitle>
              <CardDescription>Track expensive model migrations and prompt regressions.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="h-4 w-4 text-[#58a6ff]" />
                Discord Budget Alerts
              </CardTitle>
              <CardDescription>Get notified when a single agent exceeds monthly budget.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[#11182666]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold">Pricing</h2>
          <div className="mt-4 max-w-xl rounded-2xl border border-[#2ea04355] bg-[var(--surface)] p-6">
            <p className="text-sm text-[var(--muted-text)]">Single plan for solo devs and small teams</p>
            <p className="mt-2 text-4xl font-bold">$19<span className="text-base font-medium text-[var(--muted-text)]">/month</span></p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted-text)]">
              <li>OpenAI, Anthropic, Google, and Moltbook connectors</li>
              <li>Per-agent and per-workflow cost attribution</li>
              <li>Runaway spend detection</li>
              <li>Discord webhook alerts for budget breaches</li>
            </ul>
            <a href={stripePaymentLink} className="mt-5 inline-flex w-full">
              <Button size="lg" className="w-full">
                Start Tracking Costs
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-5 grid gap-3">
          {faqItems.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle className="text-base">{item.question}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-text)]">{item.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
