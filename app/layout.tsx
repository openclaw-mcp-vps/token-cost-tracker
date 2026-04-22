import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Geist } from "next/font/google";

import "@/app/globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: {
    default: "Token Cost Tracker",
    template: "%s | Token Cost Tracker",
  },
  description:
    "See exactly what each AI agent cost you yesterday, broken down per provider, model, and workflow.",
  applicationName: "Token Cost Tracker",
  keywords: [
    "AI token costs",
    "agent monitoring",
    "OpenAI cost tracking",
    "Anthropic cost dashboard",
    "MCP tooling",
  ],
  openGraph: {
    type: "website",
    title: "Token Cost Tracker",
    description:
      "Real per-agent cost visibility across OpenAI, Anthropic, Google, and Moltbook with budget alerts.",
    siteName: "Token Cost Tracker",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Token Cost Tracker dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Token Cost Tracker",
    description:
      "Prevent silent AI cost blowups with per-agent attribution and Discord alerts.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="en" className={cn(spaceGrotesk.variable, ibmPlexMono.variable, "font-sans", geist.variable)}>
      <body className="bg-[#0d1117] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
