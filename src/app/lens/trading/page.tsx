"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Brain } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { TradingLensCore } from "@/components/trading/trading-lens-core";

export default function TradingLensPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-20 pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="gradient-text glow-text">Trading Lens</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Snap or upload a forex chart and let our AI analyze it in real-time.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
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
        </div>
      </div>

      {/* Scanner */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <TradingLensCore />
      </div>

      {/* How it works */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Capture Chart",
              description: "Use your camera or upload a forex chart image directly from your device.",
            },
            {
              step: "02",
              title: "AI Scanning",
              description: "Our futuristic scanner processes patterns, levels, and momentum indicators.",
            },
            {
              step: "03",
              title: "Get Signal",
              description: "Receive a clear BUY, SELL, or HOLD recommendation with voice narration.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-2xl border border-primary/10 bg-card/30 backdrop-blur-sm"
            >
              <div className="text-4xl font-black text-primary/20 mb-3">{item.step}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
