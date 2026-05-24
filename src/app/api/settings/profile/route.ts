import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
      profile: true,
    },
  });

  // Parse JSON string field for SQLite compatibility
  if (user?.profile?.preferredPairs && typeof user.profile.preferredPairs === "string") {
    user.profile.preferredPairs = JSON.parse(user.profile.preferredPairs);
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, avatar, currentPassword, newPassword, ...profileFields } = body;

    // Update user fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Handle password change
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user?.password) {
        return NextResponse.json(
          { error: "Cannot change password for OAuth accounts" },
          { status: 400 }
        );
      }

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    // Update/upsert profile
    if (Object.keys(profileFields).length > 0) {
      // Ensure JSON string fields are properly serialized for SQLite
      const sanitized = { ...profileFields };
      if (sanitized.preferredPairs && Array.isArray(sanitized.preferredPairs)) {
        sanitized.preferredPairs = JSON.stringify(sanitized.preferredPairs);
      }

      await prisma.profile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          tradingStyle: sanitized.tradingStyle || null,
          experienceLevel: sanitized.experienceLevel || null,
          preferredPairs: sanitized.preferredPairs || "[]",
          timezone: sanitized.timezone || null,
          bio: sanitized.bio || null,
          phone: sanitized.phone || null,
          country: sanitized.country || null,
        },
        update: sanitized,
      });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 400 }
    );
  }
}
