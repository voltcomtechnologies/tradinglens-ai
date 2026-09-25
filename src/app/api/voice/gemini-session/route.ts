import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    "";
  const apiKey = rawKey ? rawKey.replace(/[\\"\s]/g, "") : null;

  return NextResponse.json({
    hasKey: !!apiKey,
    apiKey: apiKey,
    modelId: "gemini-3.1-flash-live-preview",
    voiceName: "Aoede",
  });
}

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json().catch(() => ({}));
    if (apiKey && typeof apiKey === "string") {
      process.env.GEMINI_API_KEY = apiKey.trim();
      return NextResponse.json({ success: true, hasKey: true });
    }
    return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to set API key" }, { status: 500 });
  }
}
