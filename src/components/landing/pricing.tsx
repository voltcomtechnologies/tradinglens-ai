"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";

const plans = [
  {
    name: "Basic",
    description: "For beginners exploring forex trading",
    price: { ngn: 15000, usd: 10 },
    features: [
      "Trading Lens Access",
      "5 chart analyses/day",
      "Basic AI chat support",
      "Edu Lens - 3 courses",
      "Trading Journal",
    ],
    cta: "Start Basic",
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious traders who want an edge",
    price: { ngn: 45000, usd: 30 },
    features: [
      "Everything in Basic",
      "Chart Lens Access",
      "Unlimited analyses",
      "Edu Lens - All courses",
      "Priority AI support",
      "Leaderboard access",
      "Push notifications",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Elite",
    description: "For professional traders and firms",
    price: { ngn: 120000, usd: 80 },
    features: [
      "Everything in Pro",
      "Multi-screen AI view",
      "Custom AI prompts",
      "API access",
      "Team collaboration",
      "White-label options",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-border/50 overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            Flexible Plans
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
            Simple, Transparent{" "}
            <span className="gradient-text glow-text-subtle">Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Choose the plan that fits your trading journey. All plans include a
            7-day free trial.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={cn(
                  "relative rounded-2xl border p-7 h-full transition-all",
                  plan.popular
                    ? "border-primary/50 bg-primary/[0.03] glow-orange"
                    : "border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/30"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/30">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold gradient-text">
                      ${plan.price.usd}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    or ₦{plan.price.ngn.toLocaleString()}/month
                  </div>
                </div>

                <ul className="space-y-3.5 mb-7">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className={cn(
                    "block w-full text-center px-4 py-3 rounded-xl font-semibold transition-all",
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary/90 glow-orange"
                      : "border border-border/80 hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
