"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";
import { Hero3DScene } from "./hero-3d-scene";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* 3D Background */}
      <Hero3DScene />

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30 z-[1]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI-Powered Forex Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Trade Smarter with{" "}
              <span className="gradient-text glow-text">AI Intelligence</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed"
            >
              Get real-time AI analysis of forex charts, expert-level education,
              and automated market insights. Your all-in-one trading intelligence platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105 glow-orange"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/lens/chart"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all backdrop-blur-sm"
              >
                <TrendingUp className="h-4 w-4 text-primary" />
                View Live Charts
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <Zap className="h-4 w-4 text-accent" />
                </div>
                <span>Real-time AI</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right visual - mock trading dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card/40 backdrop-blur-xl p-6 neon-border">
              {/* Mock chart header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">EUR/USD</div>
                  <div className="text-2xl font-bold text-bullish">
                    1.0847 <span className="text-sm font-medium">+0.24%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-bullish text-bullish text-xs font-medium">
                    Bullish
                  </span>
                  <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs border border-border">
                    1H
                  </span>
                </div>
              </div>

              {/* Animated bars */}
              <div className="flex items-end gap-1 h-40">
                {[
                  40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 95, 88, 92, 85, 98,
                  90, 95, 100, 92, 98,
                ].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.8 + i * 0.04, duration: 0.5 }}
                    className={`flex-1 rounded-t ${
                      h > 80
                        ? "bg-gradient-to-t from-primary to-accent"
                        : h < 50
                          ? "bg-bearish"
                          : "bg-primary/40"
                    }`}
                  />
                ))}
              </div>

              {/* AI Analysis overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-2 text-xs text-primary mb-1">
                  <Sparkles className="h-3 w-3" />
                  AI Analysis
                </div>
                <div className="text-sm text-foreground/80">
                  Strong support at 1.0820. RSI showing bullish divergence. Consider
                  long position with tight stop-loss.
                </div>
              </motion.div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-4 -right-4 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium backdrop-blur-sm"
            >
              94% Accuracy
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-4 -left-4 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium backdrop-blur-sm"
            >
              16 Pairs
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
