import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Token Cost Tracker | Per-Agent AI Spend Visibility',
  description:
    'See exactly what each AI agent cost you yesterday, broken down by provider, model, and workflow. Catch runaway agents before they burn your monthly budget.',
  openGraph: {
    title: 'Token Cost Tracker',
    description:
      'Per-agent visibility for OpenAI, Anthropic, Google, and Moltbook token spend. Real budget alerts for production AI workflows.',
    type: 'website',
    url: '/',
    siteName: 'Token Cost Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Token Cost Tracker',
    description: 'Stop silent AI overages with per-agent token and cost tracking.',
  },
  alternates: {
    canonical: '/',
  },
  keywords: [
    'AI agent cost tracking',
    'OpenAI usage dashboard',
    'Anthropic cost monitoring',
    'token spend attribution',
    'agent workflow budget alerts',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0d1117] text-slate-100 antialiased">
        <header className="border-b border-slate-800/80 bg-[#0d1117]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="text-sm font-semibold tracking-wide text-emerald-300">
              token-cost-tracker
            </Link>
            <nav className="flex items-center gap-5 text-sm text-slate-300">
              <Link href="/#pricing" className="hover:text-white">
                Pricing
              </Link>
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
