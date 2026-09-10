"use client";

import "@livekit/components-styles";
import { ViewController } from "@/components/livekit/view-controller";

export default function DashboardTradingLensPage() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] overflow-hidden flex flex-col items-center justify-center bg-zinc-950">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>
      <ViewController />
    </div>
  );
}

