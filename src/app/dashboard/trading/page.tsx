"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Brain } from "lucide-react";
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
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          <span className="gradient-text glow-text">Trading Lens</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-3">
          Snap or upload a forex chart for instant AI analysis.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {[
            { icon: Brain, label: "AI Analysis" },
            { icon: Zap, label: "Real-time" },
            { icon: Shield, label: "Secure" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/40 border border-primary/10 text-xs text-muted-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
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
