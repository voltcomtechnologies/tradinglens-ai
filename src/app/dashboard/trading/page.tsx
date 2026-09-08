"use client";

import "@livekit/components-styles";
import { ViewController } from "@/components/livekit/view-controller";

export default function DashboardTradingLensPage() {
  return (
    <div className="space-y-6 min-h-[calc(100vh-6rem)] flex flex-col justify-center">
      <ViewController />
    </div>
  );
}
