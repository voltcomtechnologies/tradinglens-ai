"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield, Zap, Brain } from "lucide-react";
import { TradingLensCore } from "@/components/trading/trading-lens-core";

export default function DashboardTradingLensPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 animate-pulse" />
          AI Chart Scanner
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          <span className="gradient-text glow-text">Trading Lens</span>
        </h1>

        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Snap or upload a forex chart and let our AI analyze it in real-time.
          Get instant BUY, SELL, or HOLD signals with voice guidance.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {[
            { icon: Brain, label: "AI Analysis" },
            { icon: Zap, label: "Real-time" },
            { icon: Shield, label: "Secure" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 border border-primary/10 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scanner */}
      <TradingLensCore />
    </div>
  );
}
