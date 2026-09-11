"use client";

import { useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import {
  Brain,
  Layers,
  BookOpen,
  ChartCandlestick,
  Award,
  Crosshair,
  Headphones,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { cn } from "@/lib/utils";

/* Card with cursor-follow spotlight */
function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 260, damping: 26 });
  const sy = useSpring(my, { stiffness: 260, damping: 26 });
  const spotlight = useMotionTemplate`radial-gradient(360px circle at ${sx}px ${sy}px, rgba(255,107,0,0.10), transparent 65%)`;

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      mx.set(e.clientX - rect.left);
      my.set(e.clientY - rect.top);
    },
    [mx, my]
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 sm:p-7 transition-colors hover:border-primary/30",
        className
      )}
    >
      {/* cursor spotlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: spotlight }}
      />
      {children}
    </motion.div>
  );
}

const highlights = [
  {
    icon: Brain,
    title: "AI-Powered Market Analysis",
    description:
      "Get real-time, data-driven insights powered by advanced AI. Analyze price action, identify trends, and make smarter trading decisions without guesswork.",
    span: "lg:col-span-2",
  },
  {
    icon: Layers,
    title: "All-in-One Trading Platform",
    description:
      "Analysis, live charts, and education in one place — engineered so every tool feeds the next.",
    span: "",
  },
  {
    icon: BookOpen,
    title: "Structured Trading Education",
    description:
      "Master the financial markets with step-by-step learning. From beginner to advanced, EduLens simplifies complex concepts to build real trading confidence.",
    span: "",
  },
  {
    icon: ChartCandlestick,
    title: "Real-Time Chart Intelligence",
    description:
      "Track live market movements with precision. ChartLens delivers clear, actionable insights to help you understand price behavior as it happens.",
    span: "",
  },
  {
    icon: Award,
    title: "Built on 15+ Years Expertise",
    description:
      "Powered by Global Gate Management's trading experience. Our AI is trained on real market data, strategies, and years of practical trading knowledge.",
    span: "lg:col-span-2",
  },
  {
    icon: Crosshair,
    title: "No Guesswork, Just Clarity",
    description:
      "Eliminate emotional trading and confusion. Make decisions based on structured insights, not hype or noise.",
    span: "",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description:
      "Ask your questions to real experts — anytime, day or night.",
    span: "lg:col-span-2",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.05] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Key Highlights
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight">
            Reasons for{" "}
            <span className="gradient-text glow-text-subtle">choosing us</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Everything is designed to replace guesswork with clarity — powered
            by AI and 15+ years of real trading expertise.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.08} className={item.span}>
              <SpotlightCard className="h-full">
                <div className="relative">
                  <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/25 mb-5 group-hover:scale-110 transition-transform duration-500">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
