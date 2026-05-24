"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
    lensAccess: ["trading", "edu"],
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
    lensAccess: ["trading", "chart", "edu"],
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
    lensAccess: ["trading", "chart", "edu"],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
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
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your trading journey. All plans include a 7-day free trial.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className={cn(
                "relative rounded-2xl border p-6 transition-all",
                plan.popular
                  ? "border-primary/50 bg-primary/5 glow-blue"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price.usd}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  or ₦{plan.price.ngn.toLocaleString()}/month
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className={cn(
                  "block w-full text-center px-4 py-2.5 rounded-xl font-medium transition-all",
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-muted"
                )}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
