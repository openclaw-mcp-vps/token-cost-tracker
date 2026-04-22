import type { Metadata } from "next";
import Link from "next/link";

import { UnlockForm } from "@/components/paywall/UnlockForm";

export const metadata: Metadata = {
  title: "Unlock Dashboard",
  description: "Unlock your paid Token Cost Tracker dashboard.",
};

export default function UnlockPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-300">Paid Access</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-100">Token Cost Tracker</h1>
        <p className="mt-3 text-slate-300">
          Purchase once through Stripe checkout, then unlock access instantly with your checkout email.
        </p>
      </div>

      <UnlockForm />

      <Link href="/" className="text-sm text-slate-400 underline-offset-4 hover:underline">
        Back to pricing page
      </Link>
    </main>
  );
}
