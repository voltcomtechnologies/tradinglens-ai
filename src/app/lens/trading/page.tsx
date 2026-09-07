"use client";

import "@livekit/components-styles";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ViewController } from "@/components/livekit/view-controller";

export default function TradingLensPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      <Navbar />

      {/* Futuristic Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* Main Content Area: LiveKit Voice & Multimodal AI Agent Controller */}
      <main className="relative z-10 pt-20 pb-12 flex-1 flex flex-col justify-center">
        <ViewController />
      </main>

      <Footer />
    </div>
  );
}
