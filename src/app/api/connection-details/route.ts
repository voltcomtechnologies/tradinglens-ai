import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomName = body.roomName || `trading-lens-${Math.random().toString(36).substring(2, 7)}`;
    const participantName = body.participantName || `Trader_${Math.random().toString(36).substring(2, 6)}`;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

    // Fallback response if live keys are not set in environment yet
    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        {
          error: "LiveKit credentials not configured",
          message: "Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL in your environment variables.",
          serverUrl: wsUrl || "wss://demo.livekit.cloud",
          participantToken: "",
          isConfigured: false,
        },
        { status: 200 }
      );
    }

    // Issue LiveKit Access Token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
      metadata: JSON.stringify({
        role: "user",
        agentPersona: "TradingLens AI Voice Trader",
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      serverUrl: wsUrl,
      participantToken: token,
      roomName,
      isConfigured: true,
    });
  } catch (error) {
    console.error("Error generating LiveKit connection details:", error);
    return NextResponse.json(
      { error: "Failed to generate LiveKit connection token" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;
  const isConfigured = !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && wsUrl);
  return NextResponse.json({ isConfigured, serverUrl: wsUrl || "" });
}
