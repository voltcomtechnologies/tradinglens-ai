"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              AI-Powered Forex Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
            >
              Trade Smarter with{" "}
              <span className="gradient-text">AI Intelligence</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg text-muted-foreground mb-8 max-w-xl"
            >
              Get real-time AI analysis of forex charts, expert-level education, 
              and automated market insights. Your all-in-one trading intelligence platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105 glow-blue"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/lens/chart"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-muted transition-all"
              >
                <TrendingUp className="h-4 w-4" />
                View Live Charts
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-10 flex items-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Bank-level Security
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Real-time AI
              </div>
            </motion.div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm p-6">
              {/* Mock chart */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">EUR/USD</div>
                  <div className="text-2xl font-bold text-bullish">1.0847 <span className="text-sm">+0.24%</span></div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-bullish text-bullish text-xs font-medium">Bullish</span>
                  <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs">1H</span>
                </div>
              </div>
              {/* Animated bars */}
              <div className="flex items-end gap-1 h-40">
                {[40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 95, 88, 92, 85, 98, 90, 95, 100, 92, 98].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    className={`flex-1 rounded-t ${h > 80 ? "bg-bullish" : h < 50 ? "bg-bearish" : "bg-primary/60"}`}
                  />
                ))}
              </div>
              {/* AI Analysis overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-2 text-xs text-primary mb-1">
                  <Sparkles className="h-3 w-3" />
                  AI Analysis
                </div>
                <div className="text-sm">
                  Strong support at 1.0820. RSI showing bullish divergence. Consider long position with tight stop-loss.
                </div>
              </motion.div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium"
            >
              94% Accuracy
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium"
            >
              16 Pairs
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
