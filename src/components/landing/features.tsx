"use client";

import { motion } from "framer-motion";
import { Brain, BarChart3, BookOpen, Globe, Shield, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Trading Lens",
    description: "Upload charts or share your screen for real-time AI analysis. Get instant trade signals, entry points, and risk management advice.",
    color: "from-blue-500 to-cyan-500",
    stat: "Real-time",
  },
  {
    icon: BarChart3,
    title: "Chart Lens",
    description: "AI continuously analyzes major currency pairs with Bloomberg-level commentary. Watch automated technical and fundamental analysis.",
    color: "from-emerald-500 to-teal-500",
    stat: "24/7",
  },
  {
    icon: BookOpen,
    title: "Edu Lens",
    description: "AI-powered learning platform with PDF curriculum. Get personalized tutoring, interactive quizzes, and progress tracking.",
    color: "from-violet-500 to-purple-500",
    stat: "Interactive",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    description: "Pay in NGN, USD, EUR, or GBP. Integrated with Paystack and Flutterwave for seamless global transactions.",
    color: "from-orange-500 to-amber-500",
    stat: "4 Currencies",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "Enterprise-grade encryption, secure payment processing, and GDPR-compliant data handling protect your information.",
    color: "from-red-500 to-rose-500",
    stat: "256-bit",
  },
  {
    icon: TrendingUp,
    title: "Trading Journal",
    description: "Track every trade with AI-powered insights. Analyze your performance, identify patterns, and improve your win rate.",
    color: "from-pink-500 to-fuchsia-500",
    stat: "Analytics",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-32 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Trade Successfully</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three powerful lenses, one intelligent platform. Get AI analysis, live market commentary, and expert education all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-colors"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <div className="absolute top-4 right-4 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {feature.stat}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
