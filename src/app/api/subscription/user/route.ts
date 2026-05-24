import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "TRIAL", "CANCELLED"] },
    },
    include: {
      plan: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Parse JSON string fields for SQLite compatibility
  if (subscription?.plan) {
    subscription.plan.features =
      typeof subscription.plan.features === "string"
        ? JSON.parse(subscription.plan.features)
        : subscription.plan.features;
    subscription.plan.lensAccess =
      typeof subscription.plan.lensAccess === "string"
        ? JSON.parse(subscription.plan.lensAccess)
        : subscription.plan.lensAccess;
  }

  return NextResponse.json(subscription);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planId } = body;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive plan" },
        { status: 400 }
      );
    }

    // Cancel any existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "TRIAL"] },
      },
      data: { status: "CANCELLED" },
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        status: "PENDING",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: { plan: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "cancel") {
      await prisma.subscription.updateMany({
        where: {
          userId: session.user.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        data: { status: "CANCELLED", autoRenew: false },
      });

      return NextResponse.json({ message: "Subscription cancelled" });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 400 }
    );
  }
}
