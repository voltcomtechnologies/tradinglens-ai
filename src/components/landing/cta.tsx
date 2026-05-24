"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNTksIDEzMCwgMjQ2LCAwLjEpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-flex mb-6"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your{" "}
              <span className="gradient-text">Trading?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Start your 7-day free trial today. No credit card required. Cancel anytime.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/lens/chart"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-border hover:bg-muted transition-all"
              >
                Explore Charts
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
