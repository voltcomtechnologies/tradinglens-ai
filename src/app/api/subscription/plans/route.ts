import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceUSD: "asc" },
  });

  // Parse JSON string fields for SQLite compatibility
  const parsed = plans.map((plan) => ({
    ...plan,
    features: typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features,
    lensAccess: typeof plan.lensAccess === "string" ? JSON.parse(plan.lensAccess) : plan.lensAccess,
  }));

  return NextResponse.json(parsed);
}
