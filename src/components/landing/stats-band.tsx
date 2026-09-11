"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Globe, Briefcase, Landmark } from "lucide-react";

/* ---------------- Animated counter ---------------- */
function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    let raf: number;

    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(
        (value * eased).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, decimals]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

const stats = [
  { value: 84.65, decimals: 2, suffix: "%", label: "Last Year Winning Ratio", icon: Award },
  { value: 4.9, decimals: 1, suffix: "/5", label: "Trader Rating — 1.5M+ Reviews", icon: Globe },
  { value: 16, decimals: 0, suffix: "", label: "Currency Pairs Analyzed 24/7", icon: Briefcase },
  { value: 15, decimals: 0, suffix: "+", label: "Years of Trading Expertise", icon: Landmark },
];

const featuredIn = [
  "Trustpilot — Best Rated",
  "Bloomberg Terminal Grade",
  "TradingView Community",
  "Forex Factory",
  "Investing.com",
  "Global Gate Management",
  "Yahoo Finance",
  "MarketWatch",
];

export function StatsBand() {
  return (
    <section className="relative border-y border-border/50 bg-card/20">
      {/* Counters */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-display gradient-text">
                  <Counter
                    value={stat.value}
                    decimals={stat.decimals}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured-in marquee */}
      <div className="border-t border-border/50 py-6 overflow-hidden">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-5">
          We are featured in
        </p>
        <div className="relative mask-fade-edges-x">
          <div className="flex w-max animate-marquee gap-14 pr-14">
            {[...featuredIn, ...featuredIn].map((name, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold tracking-wide text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                <span className="h-1.5 w-1.5 rotate-45 bg-primary/50" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
