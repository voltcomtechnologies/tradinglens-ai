"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Zap,
  CircleDollarSign,
  Timer,
  Flag,
  Scale,
  Target,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";

/* ---------------- Monthly subscription plans ---------------- */
const subscriptionPlans = [
  {
    name: "Starter Plan",
    description: "Everything you need to start trading with clarity.",
    price: "$0",
    fee: "Free",
    features: [
      "$0 funding amount",
      "Access to EduLens basics",
      "Limited AI analysis per day",
      "1 weekly live session preview",
      "Limited chart uploads",
      "24/7 technical support",
    ],
    cta: "Start Now",
    popular: false,
  },
  {
    name: "Standard Plan",
    description: "For serious traders who want the full edge.",
    price: "$25K",
    fee: "Refundable Fee $199 o/t",
    features: [
      "$25K funding amount",
      "Unlimited AI market analysis",
      "Full EduLens curriculum",
      "Full access to ChartLens live streams",
      "Trade breakdowns with entry/exit zones",
      "24/7 technical support",
    ],
    cta: "Start Now",
    popular: true,
  },
  {
    name: "Advanced Plan",
    description: "Maximum capital, mentorship, and mastery.",
    price: "$50K",
    fee: "Refundable Fee $299 o/t",
    features: [
      "$50K funding amount",
      "Everything in Standard",
      "Advanced strategy modules",
      "Multi-timeframe AI analysis",
      "Community access + mentorship",
      "Exclusive high-level live sessions",
    ],
    cta: "Start Now",
    popular: false,
  },
];

/* ---------------- Challenge plans ---------------- */
const challengePlans = {
  oneStep: [
    {
      name: "Starter Challenge",
      description: "One step to a funded account.",
      price: "$10K",
      fee: "Refundable Fee $99 o/t",
      target: "$500",
      minDays: "5 Days",
      dailyDD: "5%",
      maxDD: "10%",
      period: "No Limit",
      popular: false,
    },
    {
      name: "Standard Challenge",
      description: "One step to a funded account.",
      price: "$25K",
      fee: "Refundable Fee $199 o/t",
      target: "$2,000",
      minDays: "5 Days",
      dailyDD: "5%",
      maxDD: "10%",
      period: "No Limit",
      popular: true,
    },
    {
      name: "Advanced Challenge",
      description: "One step to a funded account.",
      price: "$50K",
      fee: "Refundable Fee $299 o/t",
      target: "$5,000",
      minDays: "5 Days",
      dailyDD: "5%",
      maxDD: "10%",
      period: "No Limit",
      popular: false,
    },
  ],
  twoStep: [
    {
      name: "Starter 2-Step",
      description: "Two phases, fully funded.",
      price: "$110K",
      fee: "Refundable Fee $99 o/t",
      target: "$500",
      minDays: "5 Days",
      dailyDD: "5%",
      maxDD: "10%",
      period: "No Limit",
      popular: false,
    },
    {
      name: "Standard 2-Step",
      description: "Two phases, fully funded.",
      price: "$125K",
      fee: "Refundable Fee $199 o/t",
      target: "$2,000",
      minDays: "5 Days",
      dailyDD: "5%",
      maxDD: "10%",
      period: "No Limit",
      popular: true,
    },
    {
      name: "Advanced 2-Step",
      description: "Two phases, fully funded.",
      price: "$150K",
      fee: "Refundable Fee $299 o/t",
      target: "$5,000",
      minDays: "5 Days",
      dailyDD: "5%",
      maxDD: "10%",
      period: "No Limit",
      popular: false,
    },
  ],
};

type ChallengePlan = (typeof challengePlans)["oneStep"][number];

function SubscriptionCard({ plan }: { plan: (typeof subscriptionPlans)[number] }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "relative rounded-3xl border p-7 h-full flex flex-col transition-colors",
        plan.popular
          ? "border-primary/50 bg-primary/[0.04] glow-orange"
          : "border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/30"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/40 whitespace-nowrap">
          <Sparkles className="h-3 w-3" />
          Most Popular
        </div>
      )}

      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        {plan.description}
      </p>

      <div className="mb-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold font-display gradient-text">
            {plan.price}
          </span>
          <span className="text-sm text-muted-foreground">funding amount</span>
        </div>
        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 border border-accent/25 px-2.5 py-1 rounded-full">
          <CircleDollarSign className="h-3 w-3" />
          {plan.fee}
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <span className="text-foreground/85">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/auth/signup"
        className={cn(
          "block w-full text-center px-4 py-3.5 rounded-2xl font-semibold transition-all",
          plan.popular
            ? "bg-primary text-white hover:bg-accent hover:text-accent-foreground glow-orange"
            : "border border-border/80 hover:border-primary/40 hover:bg-primary/5"
        )}
      >
        {plan.cta}
      </Link>
    </motion.div>
  );
}

function ChallengeCard({ plan }: { plan: ChallengePlan }) {
  const rows = [
    { icon: Target, label: "Profit Target", value: plan.target },
    { icon: Timer, label: "Min. Trading Days", value: plan.minDays },
    { icon: TrendingDown, label: "Daily Drawdown", value: plan.dailyDD },
    { icon: Scale, label: "Max. Drawdown", value: plan.maxDD },
    { icon: Flag, label: "Trading Period", value: plan.period },
  ];

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "relative rounded-3xl border p-7 h-full flex flex-col transition-colors",
        plan.popular
          ? "border-primary/50 bg-primary/[0.04] glow-orange"
          : "border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/30"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/40 whitespace-nowrap">
          <Sparkles className="h-3 w-3" />
          Popular Plan
        </div>
      )}

      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        {plan.description}
      </p>

      <div className="mb-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold font-display gradient-text">
            {plan.price}
          </span>
          <span className="text-sm text-muted-foreground">funding amount</span>
        </div>
        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 border border-accent/25 px-2.5 py-1 rounded-full">
          <CircleDollarSign className="h-3 w-3" />
          {plan.fee}
        </div>
      </div>

      {/* Spec table */}
      <div className="rounded-2xl border border-border/60 bg-background/40 overflow-hidden mb-8 flex-1">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between px-4 py-3 text-sm",
              i !== rows.length - 1 && "border-b border-border/40"
            )}
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <row.icon className="h-3.5 w-3.5 text-primary" />
              {row.label}
            </span>
            <span className="font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      <Link
        href="/auth/signup"
        className={cn(
          "block w-full text-center px-4 py-3.5 rounded-2xl font-semibold transition-all",
          plan.popular
            ? "bg-primary text-white hover:bg-accent hover:text-accent-foreground glow-orange"
            : "border border-border/80 hover:border-primary/40 hover:bg-primary/5"
        )}
      >
        Start Now
      </Link>
    </motion.div>
  );
}

export function PricingSection() {
  const [tab, setTab] = useState<"subscriptions" | "oneStep" | "twoStep">(
    "subscriptions"
  );

  return (
    <section id="pricing" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-primary/[0.06] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/[0.05] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            Join TradingLens AI
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight">
            Our <span className="gradient-text glow-text-subtle">Pricing Plan</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-10">
            Subscriptions or funded challenges — pick the path that fits your
            trading journey. All fees are fully refundable on track.
          </p>

          {/* Animated segmented control */}
          <div className="inline-flex p-1.5 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm gap-1">
            {(
              [
                { key: "subscriptions", label: "Subscriptions" },
                { key: "oneStep", label: "1 Step Challenge" },
                { key: "twoStep", label: "2 Step Challenge" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors",
                  tab === t.key
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="pricing-tab"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30"
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7"
          >
            {tab === "subscriptions" &&
              subscriptionPlans.map((plan) => (
                <SubscriptionCard key={plan.name} plan={plan} />
              ))}
            {tab === "oneStep" &&
              challengePlans.oneStep.map((plan) => (
                <ChallengeCard key={plan.name} plan={plan} />
              ))}
            {tab === "twoStep" &&
              challengePlans.twoStep.map((plan) => (
                <ChallengeCard key={plan.name} plan={plan} />
              ))}
          </motion.div>
        </AnimatePresence>

        {/* Reassurance row */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-bullish" /> 7-day free trial
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-bullish" /> No credit card required
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-bullish" /> Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
