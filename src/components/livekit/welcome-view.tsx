"use client";

import { motion } from "framer-motion";
import { Mic, Radio, Shield, Zap, Sparkles, Sliders } from "lucide-react";
import { MediaDeviceSelect } from "@livekit/components-react";
import { Button } from "@/components/ui/button";

interface WelcomeViewProps {
  onStartSession: () => void;
  isConnecting: boolean;
  isConfigured: boolean;
  errorMessage?: string | null;
}

export function WelcomeView({
  onStartSession,
  isConnecting,
  isConfigured,
  errorMessage,
}: WelcomeViewProps) {
  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Outer Card - Styled after livekit agent-starter-react theme */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-2xl p-8 sm:p-12 text-center shadow-2xl"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* LiveKit Agent Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-cyan-400 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>LiveKit WebRTC Voice AI Agent</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          TradingLens Voice Assistant
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Experience ultra-fast, sub-100ms real-time voice conversations powered by LiveKit Agents and multimodal AI intelligence.
        </p>

        {/* Device Selectors (Microphone) */}
        <div className="w-full max-w-md mx-auto mb-8 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col gap-3 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Audio Device Settings</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-zinc-400 shrink-0">Microphone:</span>
            <div className="flex-1 overflow-hidden [&_select]:w-full [&_select]:bg-zinc-950 [&_select]:text-zinc-200 [&_select]:border-zinc-800 [&_select]:rounded-lg [&_select]:px-2 [&_select]:py-1.5 [&_select]:text-xs">
              <MediaDeviceSelect kind="audioinput" />
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          {[
            { icon: Radio, label: "Real-Time Audio" },
            { icon: Zap, label: "<100ms Latency" },
            { icon: Shield, label: "WebRTC Encrypted" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400"
            >
              <Icon className="h-3.5 w-3.5 text-cyan-400" />
              {label}
            </div>
          ))}
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
            {errorMessage}
          </div>
        )}

        {/* Primary Start Conversation Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            onClick={onStartSession}
            disabled={isConnecting}
            className="w-full sm:w-auto px-10 py-6 text-base font-bold rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-all duration-300 shadow-xl shadow-cyan-500/20 cursor-pointer"
          >
            <Mic className="h-5 w-5 mr-2.5" />
            {isConnecting ? "Connecting to Agent..." : "Start Conversation"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
