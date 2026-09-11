"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, ChartCandlestick, BookOpen, ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const lenses = [
  {
    number: "01",
    icon: Brain,
    name: "TraderLens",
    tagline: "Your AI trading co-pilot",
    description:
      "TraderLens simplifies trading, forex analysis, and stock market insights using real-time AI-powered chart breakdowns.",
    points: ["Real-time chart breakdowns", "Trade signals with reasoning", "Forex & stock insights"],
    href: "/lens/trading",
    hue: "from-orange-500/25 via-primary/10 to-transparent",
    iconColor: "text-primary",
    iconBg: "bg-primary/15 border-primary/30",
  },
  {
    number: "02",
    icon: ChartCandlestick,
    name: "ChartLens",
    tagline: "Live chart intelligence",
    description:
      "ChartLens helps you analyze live trading charts, interpret price action, and apply AI-powered market analysis to make informed trading decisions with confidence.",
    points: ["Live expert chart sessions", "Price action interpretation", "Entry & exit zone breakdowns"],
    href: "/lens/chart",
    hue: "from-amber-400/25 via-accent/10 to-transparent",
    iconColor: "text-accent",
    iconBg: "bg-accent/15 border-accent/30",
  },
  {
    number: "03",
    icon: BookOpen,
    name: "EduLens",
    tagline: "Structured trading education",
    description:
      "EduLens is a structured financial market training designed to help you understand market fundamentals, price action, risk management, and disciplined trading strategies.",
    points: ["Market fundamentals to advanced", "Risk management mastery", "Disciplined strategy building"],
    href: "/lens/edu",
    hue: "from-rose-500/20 via-chart-5/10 to-transparent",
    iconColor: "text-chart-5",
    iconBg: "bg-chart-5/15 border-chart-5/30",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/[0.06] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-dots mask-fade-y opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <ScrollReveal className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            What we offer
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight">
            Three Lenses.{" "}
            <span className="gradient-text glow-text-subtle">One Platform.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Provide all your trading needs — analysis, live charts, and
            education — engineered to work as one connected loop.
          </p>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7">
          {lenses.map((lens, i) => (
            <ScrollReveal key={lens.name} delay={i * 0.14}>
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group relative h-full rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm p-7 sm:p-8 overflow-hidden transition-colors hover:border-primary/30"
              >
                {/* Hover glow wash */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${lens.hue} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                />

                {/* Big index number */}
                <span className="absolute top-5 right-7 font-display text-6xl font-bold text-white/[0.05] group-hover:text-primary/10 transition-colors duration-500 select-none">
                  {lens.number}
                </span>

                <div className="relative">
                  {/* Icon */}
                  <div
                    className={`inline-flex p-3.5 rounded-2xl border ${lens.iconBg} mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500`}
                  >
                    <lens.icon className={`h-7 w-7 ${lens.iconColor}`} />
                  </div>

                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {lens.tagline}
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-3">
                    {lens.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {lens.description}
                  </p>

                  {/* Feature bullets */}
                  <ul className="space-y-2.5 mb-7">
                    {lens.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2.5 text-sm text-foreground/75"
                      >
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={lens.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-3 transition-all"
                  >
                    Explore {lens.name.replace("Lens", " Lens")}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
