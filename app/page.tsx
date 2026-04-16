import Link from "next/link";
import Script from "next/script";
import { CheckCircle2, ShieldAlert, Wallet, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";
import { hasDashboardAccess } from "@/lib/auth";

interface LandingProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LandingPage({ searchParams }: LandingProps) {
  const params = (await searchParams) ?? {};
  const unlock = typeof params.unlock === "string" ? params.unlock : "";
  const unlocked = await hasDashboardAccess();

  return (
    <main>
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      <section className="container-shell py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#80b5ff]">ai-agent-tools</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">
              See exactly what each AI agent cost you yesterday.
            </h1>
            <p className="mt-5 text-lg text-muted leading-relaxed">
              Token Cost Tracker gives you per-agent attribution across OpenAI, Anthropic, Google, and Moltbook so runaway workflows are visible before they hit four figures.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a className="lemonsqueezy-button" href={getCheckoutUrl()}>
                  Start for $19/month
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={unlocked ? "/dashboard" : "#unlock"}>{unlocked ? "Open Dashboard" : "Unlock Existing Purchase"}</Link>
              </Button>
            </div>
            {unlock === "not-found" && (
              <p className="mt-4 text-sm text-[#ffaba8]">Purchase not found. Confirm email + order ID from your Lemon Squeezy receipt.</p>
            )}
            {unlock === "invalid" && (
              <p className="mt-4 text-sm text-[#ffaba8]">Please enter a valid email and order ID.</p>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>What this catches immediately</CardTitle>
              <CardDescription>Visibility your provider dashboards do not give you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 mt-0.5 text-[#f2cc60]" />
                <p>A single workflow suddenly switching to expensive models across one agent pool.</p>
              </div>
              <div className="flex items-start gap-3">
                <Workflow className="h-5 w-5 mt-0.5 text-[#80b5ff]" />
                <p>Which provider-model pair is driving today’s burn rate by workflow and agent.</p>
              </div>
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 mt-0.5 text-[#56d364]" />
                <p>When any agent crosses its monthly budget threshold with Discord alerts.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container-shell py-12">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: "Problem",
              body: "Provider consoles only show account totals. You cannot answer which production agent cost what.",
            },
            {
              title: "Solution",
              body: "Track per-agent, per-model, per-workflow token burn daily, with trend lines and hard budget thresholds.",
            },
            {
              title: "Who it is for",
              body: "Solo devs and lean teams shipping Claude Code, MCP servers, and custom agent workflows.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted leading-relaxed">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-shell py-12" id="pricing">
        <Card className="border-[#2f81f7]/50">
          <CardHeader>
            <CardTitle>Simple pricing</CardTitle>
            <CardDescription>One plan, built for high-signal cost monitoring.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-4xl font-bold">$19<span className="text-base text-muted">/month</span></p>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#56d364]" />Unlimited agents and workflows</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#56d364]" />Provider and model-level cost attribution</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#56d364]" />Discord alerts for budget overruns</li>
                </ul>
              </div>
              <Button asChild size="lg">
                <a className="lemonsqueezy-button" href={getCheckoutUrl()}>Launch Checkout</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container-shell py-12" id="unlock">
        <Card>
          <CardHeader>
            <CardTitle>Unlock your dashboard after purchase</CardTitle>
            <CardDescription>Enter the same email and order ID from your Lemon Squeezy receipt.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/paywall/unlock" method="POST" className="grid md:grid-cols-3 gap-3">
              <input name="email" required type="email" placeholder="you@company.com" className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
              <input name="orderId" required type="text" placeholder="Order ID" className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
              <Button type="submit">Unlock Access</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="container-shell py-12">
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted">
            <p><strong className="text-[var(--text)]">Does this replace provider billing pages?</strong> No. It adds agent and workflow attribution across providers so you can act on cost drivers.</p>
            <p><strong className="text-[var(--text)]">How do Discord alerts work?</strong> Configure a webhook URL and the dashboard sends a summary whenever an agent breaches threshold.</p>
            <p><strong className="text-[var(--text)]">Can I start before wiring every provider?</strong> Yes. Connect providers incrementally and sync usage whenever keys are available.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
