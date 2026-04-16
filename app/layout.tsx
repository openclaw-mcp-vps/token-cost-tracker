import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Token Cost Tracker | Per-Agent AI Cost Visibility",
  description:
    "Track token usage and spend across OpenAI, Anthropic, Google, and Moltbook with per-agent attribution and budget alerts.",
  keywords: [
    "ai agent cost tracking",
    "token usage dashboard",
    "anthropic cost monitor",
    "openai usage by workflow",
    "discord budget alerts",
  ],
  openGraph: {
    title: "Token Cost Tracker",
    description:
      "See exactly what each AI agent cost you yesterday, broken down per provider, model, and workflow.",
    type: "website",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Token Cost Tracker",
    description:
      "Per-agent AI spend visibility with budget alerts and provider-level breakdowns.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
