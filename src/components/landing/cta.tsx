"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, Rocket } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function CTASection() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* -------- Discord community band -------- */}
        <ScrollReveal className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-chart-5/25 bg-gradient-to-br from-chart-5/[0.12] via-card/60 to-card/60 p-8 sm:p-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-chart-5/20 blur-3xl rounded-full animate-glow-pulse" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-5/20 border border-chart-5/40">
                  <Users className="h-7 w-7 text-chart-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-chart-5 mb-1.5 font-semibold">
                    Say Hi &amp; Hello
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-1">
                    Participate in our Discord Community
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Be part of our vibrant community of traders —{" "}
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-bullish animate-pulse" />
                      <strong className="text-foreground">4,235 members</strong>{" "}
                      online now.
                    </span>
                  </p>
                </div>
              </div>
              <a
                href="https://discord.gg/tradinglensai"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex shrink-0 items-center gap-2 px-7 py-3.5 rounded-2xl bg-chart-5 text-white font-semibold transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-chart-5/30"
              >
                Accept Our Invite
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* -------- Final CTA -------- */}
        <ScrollReveal>
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl overflow-hidden border border-primary/25 p-10 sm:p-16 text-center"
          >
            {/* Animated backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-accent/[0.05] to-primary/[0.12]" />
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[280px] bg-primary/20 blur-[110px] rounded-full animate-glow-pulse" />

            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                className="inline-flex mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30"
              >
                <Sparkles className="h-7 w-7 text-primary" />
              </motion.div>

              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight">
                Ready to Trade With{" "}
                <span className="gradient-text glow-text">Clarity?</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
                Join thousands of traders who&apos;ve replaced guesswork with
                intelligence. Start free — no card required.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-semibold transition-all hover:scale-[1.03] glow-orange-strong hover:bg-accent hover:text-accent-foreground"
                >
                  <Rocket className="h-4 w-4" />
                  Get Started Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all backdrop-blur-sm"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
