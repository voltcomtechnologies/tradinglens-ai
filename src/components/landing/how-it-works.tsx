"use client";

import { motion } from "framer-motion";
import { Upload, Brain, TrendingUp, GraduationCap } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const steps = [
  {
    icon: Upload,
    title: "Upload or Share",
    description:
      "Snap a chart photo, upload an image, or let the AI view your screen for instant analysis.",
  },
  {
    icon: Brain,
    title: "AI Analyzes",
    description:
      "Our AI engine processes technical indicators, price action, and market sentiment in seconds.",
  },
  {
    icon: TrendingUp,
    title: "Get Insights",
    description:
      "Receive detailed analysis with trade signals, entry points, stop-losses, and risk management.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Grow",
    description:
      "Access AI-tutored courses, track progress, and build your trading expertise over time.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-border/50 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Simple Process
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
            How It <span className="gradient-text glow-text-subtle">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From chart upload to profitable trades in four simple steps
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -5 }}
                className="relative text-center group"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-5 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                  <step.icon className="h-8 w-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)]">
                    <div className="h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "linear",
                      }}
                      className="absolute top-0 left-0 w-1/3 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                    />
                  </div>
                )}
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
