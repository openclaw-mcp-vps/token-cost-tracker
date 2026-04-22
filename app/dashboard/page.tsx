import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { ACCESS_COOKIE_NAME, isAccessAllowed } from "@/lib/access";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Per-agent AI token cost analytics dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!isAccessAllowed(token)) {
    redirect("/unlock");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardClient />
    </main>
  );
}
