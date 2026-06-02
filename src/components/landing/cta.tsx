"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl overflow-hidden border border-primary/20 p-10 sm:p-16 text-center"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff6b00' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-flex mb-6"
              >
                <Sparkles className="h-8 w-8 text-primary glow-text" />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
                Ready to Transform Your{" "}
                <span className="gradient-text glow-text">Trading?</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
                Start your 7-day free trial today. No credit card required.
                Cancel anytime.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all hover:scale-105 glow-orange"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/lens/chart"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all backdrop-blur-sm"
                >
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Explore Charts
                </Link>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
