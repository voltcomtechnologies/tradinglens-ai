"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Radio,
  Shield,
  Zap,
  Sliders,
  TrendingUp,
  Brain,
  Activity,
  Monitor,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { MediaDeviceSelect } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface WelcomeViewProps {
  onStartSession: () => void;
  isConnecting: boolean;
  isConfigured?: boolean;
  errorMessage?: string | null;
}

// Animated ring component for the holographic avatar
function PulseRing({ delay = 0, size = 1, color = "rgba(242,193,78,0.15)" }: { delay?: number; size?: number; color?: string }) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: `${100 * size}%`,
        height: `${100 * size}%`,
        borderColor: color,
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
      }}
      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
      transition={{ repeat: Infinity, duration: 3.2, delay, ease: "easeInOut" }}
    />
  );
}

// Floating stat card
function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 backdrop-blur"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
      <div className="relative flex items-start gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-medium text-white/35 tracking-wider uppercase">{label}</p>
          <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-white/25">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// Animated EQ bars (decorative)
function AudioEqDecoration() {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[0.5, 0.8, 0.6, 1, 0.7, 0.9, 0.55, 0.75, 0.65].map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary/50"
          animate={{ scaleY: [h, h * 0.5 + 0.2, h] }}
          transition={{ repeat: Infinity, duration: 0.9 + i * 0.1, delay: i * 0.05 }}
          style={{ height: `${h * 100}%`, originY: 1 }}
        />
      ))}
    </div>
  );
}

export function WelcomeView({
  onStartSession,
  isConnecting,
  errorMessage,
}: WelcomeViewProps) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative z-10 w-full px-4 py-6 flex flex-col lg:flex-row items-stretch gap-6 min-h-[640px]">
      {/* ─── LEFT: Side stats panel ─── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="hidden lg:flex flex-col gap-3 w-64 shrink-0"
      >
        {/* Live clock */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-center">
          <p className="text-[10px] tracking-widest text-white/30 uppercase mb-1">Market Time</p>
          <p className="font-mono text-2xl font-bold text-primary tabular-nums">{time}</p>
          <div className="mt-2 flex justify-center">
            <AudioEqDecoration />
          </div>
        </div>

        <StatCard label="Partner" value="Casey-367" sub="AI Voice Agent" icon={Brain} color="bg-primary/10 text-primary" />
        <StatCard label="Protocol" value="WebRTC" sub="LiveKit Cloud" icon={Radio} color="bg-cyan-400/10 text-cyan-400" />
        <StatCard label="Latency" value="< 100ms" sub="Real-time voice" icon={Zap} color="bg-emerald-400/10 text-emerald-400" />
        <StatCard label="Security" value="Encrypted" sub="End-to-end" icon={Shield} color="bg-indigo-400/10 text-indigo-400" />
        <StatCard label="Analysis" value="Chart + Voice" sub="Screen sharing" icon={Monitor} color="bg-violet-400/10 text-violet-400" />
        <StatCard label="Coverage" value="24 / 7" sub="Always available" icon={Activity} color="bg-rose-400/10 text-rose-400" />
      </motion.div>

      {/* ─── CENTER: Main holographic card ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="flex-1 relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#060d1e]/90 backdrop-blur-2xl shadow-[0_0_100px_-30px_rgba(242,193,78,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] p-8 sm:p-10 text-center flex flex-col items-center justify-center"
      >
        {/* Top edge glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-72 bg-[radial-gradient(ellipse_at_top,rgba(242,193,78,0.07),transparent_60%)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-60 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.06),transparent_60%)]" />
        </div>

        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/[0.07] text-primary text-[11px] font-bold tracking-[0.15em] uppercase mb-8"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Virtual Trading Partner Ready
        </motion.div>

        {/* ── Holographic Avatar ── */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="relative h-44 w-44 sm:h-52 sm:w-52">
            {/* Pulse rings */}
            <PulseRing delay={0} size={1.5} color="rgba(242,193,78,0.12)" />
            <PulseRing delay={0.8} size={1.8} color="rgba(6,182,212,0.08)" />
            <PulseRing delay={1.6} size={2.1} color="rgba(242,193,78,0.05)" />

            {/* Outer glowing ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 bg-gradient-to-br from-primary/[0.06] via-transparent to-cyan-500/[0.06]" />
            <div className="absolute inset-[8px] rounded-full border border-primary/15 bg-gradient-to-br from-[#0d1830] to-[#060d1e]" />

            {/* Avatar core */}
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-[16px] rounded-full flex items-center justify-center bg-gradient-to-br from-primary/15 via-[#080f20] to-cyan-500/10 shadow-[inset_0_0_40px_rgba(242,193,78,0.08)]"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              >
                <Brain className="h-14 w-14 sm:h-16 sm:w-16 text-primary drop-shadow-[0_0_12px_rgba(242,193,78,0.6)]" />
              </motion.div>
            </motion.div>

            {/* Orbiting dot */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute top-1/2 left-0 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(242,193,78,0.8)]" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="absolute inset-4"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            </motion.div>
          </div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none mb-3"
        >
          Meet{" "}
          <span className="bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
            Casey
          </span>
          , Your AI Analyst
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-sm text-white/40 max-w-md mx-auto mb-8 leading-relaxed"
        >
          Share your screen, describe the chart, and get instant institutional-grade analysis.
          Casey listens, sees, and speaks — your always-available trading companion.
        </motion.p>

        {/* Capabilities row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
          {[
            { icon: TrendingUp, label: "Chart Analysis" },
            { icon: Mic, label: "Voice Conversation" },
            { icon: Monitor, label: "Screen Sharing" },
            { icon: Zap, label: "< 100ms Latency" },
            { icon: Shield, label: "WebRTC Secured" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-[11px] text-white/45 hover:text-white/70 hover:border-white/[0.12] transition-colors"
            >
              <Icon className="h-3 w-3 text-primary/70" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Audio device select */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="w-full max-w-sm mx-auto mb-6 p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] flex items-center gap-3 text-left"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sliders className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Microphone</p>
            <div className="[&_select]:w-full [&_select]:bg-transparent [&_select]:text-white/70 [&_select]:text-xs [&_select]:outline-none [&_select]:border-0">
              <MediaDeviceSelect kind="audioinput" />
            </div>
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="w-full max-w-sm mx-auto mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.07] text-xs text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            size="lg"
            onClick={onStartSession}
            disabled={isConnecting}
            className="group relative overflow-hidden px-10 py-6 text-sm font-bold rounded-2xl bg-primary hover:bg-primary/90 text-black transition-all duration-300 shadow-[0_0_40px_rgba(242,193,78,0.25)] hover:shadow-[0_0_60px_rgba(242,193,78,0.4)] disabled:opacity-60 cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center gap-2.5">
              <Mic className="h-4.5 w-4.5" />
              {isConnecting ? (
                <>
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    Connecting to Casey...
                  </motion.span>
                </>
              ) : (
                <>
                  Begin Trading Session
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </Button>
        </motion.div>

        {/* Bottom edge glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </motion.div>

      {/* ─── RIGHT: Info / tips panel ─── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="hidden lg:flex flex-col gap-3 w-64 shrink-0"
      >
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="text-[10px] tracking-widest text-white/30 uppercase mb-3">How It Works</p>
          {[
            { n: "01", text: "Click Begin to connect to Casey" },
            { n: "02", text: "Share your chart screen" },
            { n: "03", text: "Speak naturally — ask anything" },
            { n: "04", text: "Get live analysis with voice" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3 mb-3 last:mb-0">
              <span className="shrink-0 text-[10px] font-bold text-primary/60 font-mono w-6">{n}</span>
              <p className="text-xs text-white/40 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="text-[10px] tracking-widest text-white/30 uppercase mb-3">Casey Can Analyse</p>
          {[
            "Support & Resistance",
            "Trend & Price Action",
            "RSI / MACD / EMA",
            "Entry & Exit Zones",
            "Fundamental Drivers",
            "Risk / Reward Ratios",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 mb-2 last:mb-0">
              <div className="h-1 w-1 rounded-full bg-primary/50" />
              <p className="text-xs text-white/35">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
          <p className="text-[10px] tracking-widest text-emerald-500/60 uppercase mb-2">Pro Tip</p>
          <p className="text-xs text-white/30 leading-relaxed">
            Share your chart screen before speaking for best results. Casey sees and hears simultaneously.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
