import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BookOpen, BarChart3, TrendingUp, AlertTriangle, LogOut, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "ADMIN") redirect("/dashboard");

  let stats: { userCount: number; tradeCount: number; courseCount: number; subscriptionCount: number } | null = null;
  let dbError = false;
  try {
    const [userCount, tradeCount, courseCount, subscriptionCount] = await Promise.all([
      prisma.user.count(),
      prisma.tradingJournal.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
    ]);
    stats = { userCount, tradeCount, courseCount, subscriptionCount };
  } catch { dbError = true; }

  const cards = [
    { label: "Total Users", value: stats?.userCount ?? "—", icon: Users, tint: "border-primary/15 bg-primary/10 text-primary" },
    { label: "Total Trades", value: stats?.tradeCount ?? "—", icon: TrendingUp, tint: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300" },
    { label: "Courses", value: stats?.courseCount ?? "—", icon: BookOpen, tint: "border-violet-400/15 bg-violet-400/10 text-violet-300" },
    { label: "Active Subs", value: stats?.subscriptionCount ?? "—", icon: BarChart3, tint: "border-accent/15 bg-accent/10 text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-primary">
            <Shield className="h-3.5 w-3.5" /> ADMIN
          </div>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Command Center</h1>
          <p className="mt-1.5 text-sm text-white/40">Manage users, content, and platform operations.</p>
        </div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
          Back to cockpit <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {dbError ? (
        <Card className="rounded-[20px] border-amber-400/20 bg-amber-400/5">
          <CardContent className="flex items-center gap-3 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/20 text-amber-300"><AlertTriangle className="h-5 w-5" /></span>
            <div><p className="font-semibold text-amber-300">Database Unavailable</p><p className="text-sm text-white/45">The database may be temporarily unreachable.</p></div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label} className="rounded-[20px] border-white/10 bg-[#0b1428]/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold tracking-wide text-white/40">{c.label}</CardTitle>
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${c.tint}`}><c.icon className="h-4 w-4" /></span>
              </CardHeader>
              <CardContent><div className="font-display text-2xl font-bold text-white">{c.value}</div></CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="rounded-[20px] border-white/10 bg-[#0b1428]/60 backdrop-blur">
        <CardHeader><CardTitle className="font-display text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/learn" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-[#050a18] transition-colors">Manage Courses</Link>
            <Link href="/dashboard/subscription" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-[#050a18] transition-colors">Subscriptions</Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 hover:text-red-300 hover:border-red-400/20 hover:bg-red-400/10 transition-colors">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
