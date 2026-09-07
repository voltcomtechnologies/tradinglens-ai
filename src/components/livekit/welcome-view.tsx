"use client";

import { motion } from "framer-motion";
import { Mic, Radio, Shield, Zap, Key, Activity, Sparkles } from "lucide-react";
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
    <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-xl p-8 sm:p-12 text-center shadow-2xl"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>LiveKit WebRTC Voice & Multimodal Engine</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text glow-text">TradingLens AI Voice Trader</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Connect directly via ultra-low latency voice WebRTC. Ask questions about forex setups, discuss SMC & ICT price action, analyze market structure, or trade live with your AI partner.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {[
            { icon: Radio, label: "Sub-100ms Voice Latency" },
            { icon: Zap, label: "Real-Time Speech & Audio" },
            { icon: Shield, label: "Secure WebRTC Room" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/60 border border-primary/10 text-xs text-muted-foreground shadow-sm"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>

        {/* Connection Notice / Warning if credentials missing */}
        {!isConfigured && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-300 flex items-start gap-3">
            <Key className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">LiveKit Credentials Pending</p>
              <p className="text-amber-300/80">
                To connect to a live voice agent, please add <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">LIVEKIT_API_KEY</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">LIVEKIT_API_SECRET</code>, and <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">NEXT_PUBLIC_LIVEKIT_URL</code> to your environment variables on Vercel.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
            {errorMessage}
          </div>
        )}

        {/* Start Button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            size="lg"
            onClick={onStartSession}
            disabled={isConnecting}
            className="px-10 py-7 text-base font-bold rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-xl shadow-primary/25 cursor-pointer"
          >
            {isConnecting ? (
              <>
                <Activity className="h-5 w-5 mr-3 animate-spin" />
                Connecting to Voice Room...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-3" />
                Connect Voice Trader
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
