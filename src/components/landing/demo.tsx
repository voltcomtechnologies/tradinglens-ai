"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CirclePlay, X, Sparkles, Clock } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function DemoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="relative py-28 sm:py-36 overflow-hidden border-y border-border/40">
      {/* backdrop */}
      <div className="absolute inset-0 bg-grid opacity-40 mask-fade-y pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent/[0.06] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <CirclePlay className="h-4 w-4" />
              Interactive Platform Demo
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
              Watch TradingLens AI in{" "}
              <span className="gradient-text glow-text-subtle">Action</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-lg">
              Get an inside look at how TradingLens AI helps you turn market
              data into clear trading decisions — from live chart analysis to
              structured lessons.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Duration: 1.05 mins
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Full walkthrough
              </span>
            </div>
            <button
              onClick={() => setPlaying(true)}
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold transition-all hover:scale-[1.03] glow-orange hover:bg-accent hover:text-accent-foreground"
            >
              <CirclePlay className="h-5 w-5" />
              Watch Demo Now
            </button>
          </ScrollReveal>

          {/* Player */}
          <ScrollReveal delay={0.15} x={60} y={0}>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/15 to-accent/10 blur-3xl rounded-full" />

              <div className="relative rounded-3xl overflow-hidden border border-primary/25 bg-card/70 backdrop-blur-xl shadow-2xl shadow-black/60">
                {/* screen */}
                <div className="relative aspect-video bg-[#0a0806] overflow-hidden">
                  {/* fake UI behind */}
                  <div className="absolute inset-0 bg-grid opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-end gap-1.5 h-24">
                      {[0.5, 0.8, 0.35, 1, 0.6, 0.9, 0.45, 0.75, 0.55].map(
                        (h, i) => (
                          <motion.span
                            key={i}
                            animate={
                              playing
                                ? { scaleY: [h, 0.3, h * 1.2, h] }
                                : { scaleY: h }
                            }
                            transition={
                              playing
                                ? {
                                    duration: 0.9,
                                    repeat: Infinity,
                                    delay: i * 0.09,
                                  }
                                : { duration: 0.5 }
                            }
                            className="w-2.5 origin-bottom rounded-full bg-gradient-to-t from-primary to-accent"
                            style={{ height: "100%" }}
                          />
                        )
                      )}
                    </div>
                  </div>
                  {/* scan line */}
                  {playing && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
                  )}

                  {/* play overlay */}
                  <AnimatePresence>
                    {!playing && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        onClick={() => setPlaying(true)}
                        aria-label="Play demo video"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 group cursor-pointer"
                      >
                        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-2xl shadow-primary/50 transition-transform group-hover:scale-110 animate-pulse-ring">
                          <CirclePlay className="h-9 w-9" />
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* playing chrome */}
                  {playing && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
                    >
                      <div className="h-1.5 rounded-full bg-white/15 overflow-hidden mb-2.5">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 65, ease: "linear" }}
                          className="h-full bg-gradient-to-r from-primary to-accent"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-white/70">
                        <span>TradingLens AI — Platform Demo</span>
                        <span>1:05</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* footer bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    Master the Markets with AI-Powered Insights
                  </span>
                  {playing && (
                    <button
                      onClick={() => setPlaying(false)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" /> Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
