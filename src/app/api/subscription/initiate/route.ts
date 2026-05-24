import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscriptionId, provider } = body;

    if (!subscriptionId || !provider) {
      return NextResponse.json(
        { error: "Subscription ID and provider required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // In production, integrate with Paystack or Flutterwave here
    // For demo, simulate a successful payment
    const transactionRef = `TXL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        subscriptionId: subscription.id,
        amount: subscription.plan.priceNGN,
        currency: "NGN",
        provider: provider.toUpperCase(),
        providerRef: transactionRef,
        status: "PENDING",
      },
    });

    // Simulate payment authorization URL
    const authorizationUrl = `/api/subscription/verify?reference=${transactionRef}`;

    return NextResponse.json({
      payment,
      authorizationUrl,
      transactionRef,
      // Paystack/Flutterwave would return an actual URL
      paymentUrl: `https://checkout.${provider}.com/${transactionRef}`,
    });
  } catch (error) {
    console.error("Payment initiation failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
