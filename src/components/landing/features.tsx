"use client";

import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  BookOpen,
  Globe,
  Shield,
  TrendingUp,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const features = [
  {
    icon: Brain,
    title: "Trading Lens",
    description:
      "Upload charts or share your screen for real-time AI analysis. Get instant trade signals, entry points, and risk management advice.",
    color: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/20",
    stat: "Real-time",
  },
  {
    icon: BarChart3,
    title: "Chart Lens",
    description:
      "AI continuously analyzes major currency pairs with Bloomberg-level commentary. Watch automated technical and fundamental analysis.",
    color: "from-amber-500 to-yellow-500",
    glow: "shadow-amber-500/20",
    stat: "24/7",
  },
  {
    icon: BookOpen,
    title: "Edu Lens",
    description:
      "AI-powered learning platform with PDF curriculum. Get personalized tutoring, interactive quizzes, and progress tracking.",
    color: "from-orange-600 to-red-500",
    glow: "shadow-orange-600/20",
    stat: "Interactive",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    description:
      "Pay in NGN, USD, EUR, or GBP. Integrated with Paystack and Flutterwave for seamless global transactions.",
    color: "from-yellow-500 to-orange-400",
    glow: "shadow-yellow-500/20",
    stat: "4 Currencies",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description:
      "Enterprise-grade encryption, secure payment processing, and GDPR-compliant data handling protect your information.",
    color: "from-red-500 to-orange-500",
    glow: "shadow-red-500/20",
    stat: "256-bit",
  },
  {
    icon: TrendingUp,
    title: "Trading Journal",
    description:
      "Track every trade with AI-powered insights. Analyze your performance, identify patterns, and improve your win rate.",
    color: "from-amber-600 to-orange-500",
    glow: "shadow-amber-600/20",
    stat: "Analytics",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Powerful Features
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
            Everything You Need to{" "}
            <span className="gradient-text glow-text-subtle">
              Trade Successfully
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Three powerful lenses, one intelligent platform. Get AI analysis,
            live market commentary, and expert education all in one place.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative h-full rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 overflow-hidden transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                {/* Glow effect on hover */}
                <div
                  className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}
                />

                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg ${feature.glow}`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                <div className="absolute top-4 right-4 text-xs font-medium text-muted-foreground bg-muted/80 px-2 py-1 rounded-full border border-border/50">
                  {feature.stat}
                </div>

                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
