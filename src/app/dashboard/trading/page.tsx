"use client";

import "@livekit/components-styles";
import { ViewController } from "@/components/livekit/view-controller";
import { motion } from "framer-motion";
import { Brain, ShieldCheck, Clock, Sparkles } from "lucide-react";

export default function DashboardTradingLensPage() {
  return (
    <div className="relative -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen overflow-hidden bg-[#020610]">
      {/* ── Cinematic ambient lighting ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(242,193,78,0.07)_0%,transparent_65%)]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.06)_0%,transparent_65%)]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.05)_0%,transparent_65%)]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Top HUD bar ── */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-8 pt-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          {/* Left: Identity */}
          <div className="flex items-center gap-4">
            {/* Animated brand chip */}
            <div className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/[0.08] text-primary text-[11px] font-bold tracking-[0.16em] uppercase overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-[shimmer_2.5s_linear_infinite]" />
              <Brain className="h-3.5 w-3.5" />
              TradingLens AI
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                AI Trading Partner
              </h1>
              <p className="mt-0.5 text-xs text-white/35">
                Your virtual institutional companion — always available
              </p>
            </div>
          </div>

          {/* Right: Status chips */}
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </motion.span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/35">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Encrypted
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/35">
              <Clock className="h-3 w-3 text-cyan-400" />
              24 / 7
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/35">
              <Sparkles className="h-3 w-3 text-primary" />
              LiveKit WebRTC
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Main studio area ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 px-4 sm:px-6 lg:px-8 pt-4 pb-6"
      >
        {/* Outer card - premium glassmorphism */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#080f20]/80 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_32px_80px_-20px_rgba(0,0,0,0.8),0_0_120px_-40px_rgba(242,193,78,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* Top bar inside card */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 bg-white/[0.015]">
            <div className="flex items-center gap-3">
              {/* Traffic-light decorators */}
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">
                Trading Partner Studio
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scaleX: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 3.5 }}
                className="h-px w-12 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              />
              <span className="text-[10px] text-white/20">CASEY-367</span>
            </div>
          </div>

          {/* Ambient inner glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(242,193,78,0.05),transparent_55%)] pointer-events-none" />
          </div>

          {/* LiveKit ViewController — untouched */}
          <div className="relative min-h-[560px] lg:min-h-[680px] flex flex-col">
            <ViewController />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
