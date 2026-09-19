"use client";

import "@livekit/components-styles";
import { ViewController } from "@/components/livekit/view-controller";
import { motion } from "framer-motion";
import { Brain, Sparkles, ShieldCheck } from "lucide-react";

export default function DashboardTradingLensPage() {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-primary">
            <Brain className="h-3.5 w-3.5" /> TRADING LENS
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white">AI Trading Co-Pilot</h1>
          <p className="mt-1 text-sm text-white/45">Live voice + chart analysis — every signal comes with reasoning.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE SESSION
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/40">
            <ShieldCheck className="h-3 w-3" /> Encrypted
          </span>
        </div>
      </motion.div>

      <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-white/[0.02]">
          <span className="text-xs font-bold tracking-[0.14em] text-white/30">LIVE STUDIO</span>
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <Sparkles className="h-3 w-3 text-primary" /> Powered by LiveKit
          </span>
        </div>
        <div className="relative bg-[#020610]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_0%,rgba(242,193,78,0.06),transparent_45%),radial-gradient(50%_40%_at_100%_100%,rgba(92,225,255,0.05),transparent_42%)]" />
          <div className="relative min-h-[520px] lg:min-h-[600px] flex flex-col">
            <ViewController />
          </div>
        </div>
      </div>
    </div>
  );
}
