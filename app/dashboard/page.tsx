import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getAccessCookie, verifyAccessToken } from "@/lib/lemonsqueezy";

export default async function DashboardPage() {
  const token = await getAccessCookie();
  const access = verifyAccessToken(token);

  if (!access.valid) {
    redirect("/");
  }

  return <DashboardClient />;
}
