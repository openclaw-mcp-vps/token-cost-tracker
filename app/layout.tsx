import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://token-cost-tracker.app"),
  title: "Token Cost Tracker | Per-Agent AI Spend Visibility",
  description:
    "Track AI token spend per agent, workflow, provider, and model. Catch runaway costs early and get Discord alerts before your monthly budget is gone.",
  openGraph: {
    title: "Token Cost Tracker",
    description:
      "See exactly what each AI agent cost you yesterday, broken down by provider, model, and workflow.",
    type: "website",
    url: "https://token-cost-tracker.app"
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
