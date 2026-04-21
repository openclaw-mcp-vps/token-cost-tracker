import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://token-cost-tracker.app"),
  title: "Token Cost Tracker | Per-Agent AI Spend Visibility",
  description:
    "See exactly what each AI agent cost you yesterday. Track token burn by provider, model, and workflow with budget alerts in Discord.",
  keywords: [
    "AI cost tracking",
    "token usage dashboard",
    "agent budget alerts",
    "OpenAI usage analytics",
    "Anthropic usage analytics",
    "Gemini usage analytics"
  ],
  openGraph: {
    title: "Token Cost Tracker",
    description:
      "Track OpenAI, Anthropic, Google, and Moltbook costs per workflow and per agent. Stop runaway token spend before it blows your monthly budget.",
    url: "https://token-cost-tracker.app",
    siteName: "Token Cost Tracker",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Token Cost Tracker",
    description:
      "Per-agent AI token cost tracking with provider and workflow breakdowns plus Discord budget alerts."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-[var(--text)] antialiased">{children}</body>
    </html>
  );
}
