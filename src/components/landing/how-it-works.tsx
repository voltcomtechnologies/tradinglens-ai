"use client";

import { motion } from "framer-motion";
import { Upload, Brain, TrendingUp, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload or Share",
    description: "Snap a chart photo, upload an image, or let the AI view your screen for instant analysis.",
  },
  {
    icon: Brain,
    title: "AI Analyzes",
    description: "Our AI engine processes technical indicators, price action, and market sentiment in seconds.",
  },
  {
    icon: TrendingUp,
    title: "Get Insights",
    description: "Receive detailed analysis with trade signals, entry points, stop-losses, and risk management.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Grow",
    description: "Access AI-tutored courses, track progress, and build your trading expertise over time.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From chart upload to profitable trades in four simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative text-center"
            >
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
                <step.icon className="h-7 w-7 text-white" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
