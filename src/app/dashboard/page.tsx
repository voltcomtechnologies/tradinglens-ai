import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardOverview } from "./overview";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return <DashboardOverview user={session.user} />;
}
