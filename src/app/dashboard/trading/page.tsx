"use client";

import "@livekit/components-styles";
import { App } from "@/components/app/app";

export default function DashboardTradingLensPage() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] overflow-hidden flex flex-col justify-center">
      <App className="h-full max-h-none" />
    </div>
  );
}

