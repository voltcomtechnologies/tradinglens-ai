"use client";

import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  BookOpen,
  ChartCandlestick,
  Check,
  CircleGauge,
  Layers,
  LineChart,
  Play,
  Sparkles,
  ShieldCheck,
  Zap,
  Crosshair,
  Award,
  Headphones,
  Quote,
  Star,
  ChevronDown,
  CirclePlay,
  X,
  Clock,
  Target,
  Timer,
  TrendingDown,
  Scale,
  Flag,
  CircleDollarSign,
  Users,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Hero3DScene } from "./hero-3d-scene";

// ──────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────
function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
      {icon ?? <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(242,193,78,0.9)]" />}
      {children}
    </div>
  );
}

function Counter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
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
      {display}
      {suffix}
    </span>
  );
}

// ──────────────────────────────────────────────────────────
// HERO
// ──────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#050a18] border-b border-white/[0.06]">
      <Hero3DScene />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.18] [mask-image:linear-gradient(to_bottom,black_40%,transparent_88%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_75%_at_18%_42%,rgba(242,193,78,0.10),transparent_45%),radial-gradient(60%_55%_at_86%_18%,rgba(92,225,255,0.07),transparent_42%),radial-gradient(50%_40%_at_50%_100%,rgba(124,140,255,0.06),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.06fr_0.94fr] gap-10 lg:gap-8 items-center">
          {/* copy */}
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <Eyebrow>Market intelligence, reimagined</Eyebrow>
            <h1 className="mt-6 font-display text-[2.95rem] sm:text-[3.75rem] lg:text-[5.1rem] font-semibold leading-[0.92] tracking-[-0.055em] text-white">
              Trade Smarter
              <br />
              <span className="gradient-text-gold glow-text-subtle">with AI-Powered</span>
              <br />
              <span className="text-white/90">Precision</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] sm:text-[18px] leading-7 sm:leading-8 text-white/55">
              TradingLens AI helps you analyze the market, learn proven strategies, and make confident trading decisions — all in one intelligent platform.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-Powered Market Analysis
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-white/70">
                <LineChart className="h-3.5 w-3.5 text-accent" /> Real-Time Chart Insights
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-white/70">
                <BookOpen className="h-3.5 w-3.5 text-violet-300" /> Structured Education
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/signup"
                className="group relative inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-[14px] font-bold text-primary-foreground shadow-[0_12px_28px_rgba(242,193,78,0.35)] hover:shadow-[0_16px_36px_rgba(242,193,78,0.45)] hover:scale-[1.02] transition-all overflow-hidden"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                <span className="absolute inset-0 -translate-x-[130%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-12deg] group-hover:translate-x-[130%] transition-transform duration-700" />
              </Link>
              <Link
                href="/lens/trading"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-[14px] font-semibold text-white backdrop-blur hover:bg-white/[0.08] hover:border-primary/30 transition-all"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
                  <Play className="h-3.5 w-3.5 fill-primary text-primary" />
                </span>
                Explore the Lens
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-4 text-xs text-white/45">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-300" /> No card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-300" /> 7-day free preview
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-300" /> Cancel anytime
              </span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Win ratio — last year</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-display text-xl font-bold text-white">
                    <Counter value={84.65} decimals={2} suffix="%" />
                  </span>
                  <span className="text-xs font-semibold text-emerald-300">+6.39%</span>
                </div>
                <div className="text-[11px] text-white/35">Market comparison</div>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.07] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-primary/70">Trustpilot</div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="font-display text-xl font-bold text-white">4.9/5</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </span>
                </div>
                <div className="text-[11px] text-white/50">Best Rated • 1.5M+ traders</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">We are featured in</div>
                <div className="mt-1 font-display text-xs font-semibold tracking-widest text-white/60">BLOOMBERG • TRADINGVIEW • MARKETWATCH</div>
                <div className="text-[11px] text-white/35">Institutional-grade data</div>
              </div>
            </div>
          </motion.div>

          {/* visual */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[520px] lg:mr-0"
          >
            <div className="absolute -inset-10 rounded-[40px] bg-primary/10 blur-3xl opacity-60" />
            <div className="relative rounded-[28px] border border-white/10 bg-[#0b1428]/70 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.55),0_0_0_1px_rgba(242,193,78,0.08)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-accent/[0.06]" />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 border border-primary/20 text-primary">
                      <LineChart className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">Live market pulse</p>
                      <p className="text-[10px] text-white/40">Tuesday • 09:41 UTC • 16 pairs tracked</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE
                  </span>
                </div>

                <div className="px-5 pt-5 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">EUR / USD • 1H</p>
                    <p className="font-display text-4xl font-semibold tracking-tight text-white mt-1">1.0847</p>
                    <p className="text-xs text-emerald-300 mt-1 flex items-center gap-1">
                      <span className="inline-flex h-5 items-center rounded-full bg-emerald-400/15 border border-emerald-300/20 px-2 text-[11px] font-bold">+0.24%</span>
                      <span className="text-white/40">Bid 1.0845 • Ask 1.0849</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3.5 py-2.5 text-center min-w-[92px]">
                    <p className="text-[10px] tracking-widest text-primary/70 uppercase">Confidence</p>
                    <p className="font-display text-lg font-bold text-primary">84.6%</p>
                    <p className="text-[10px] text-primary/60">High conviction</p>
                  </div>
                </div>

                <div className="relative mx-5 mt-4 h-[156px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#060d1e]">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
                  <svg viewBox="0 0 600 180" className="relative h-full w-full" preserveAspectRatio="none" aria-hidden>
                    <defs>
                      <linearGradient id="pfill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f2c14e" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#f2c14e" stopOpacity="0" />
                      </linearGradient>
                      <filter id="pgglow">
                        <feGaussianBlur stdDeviation="3.5" result="b" />
                        <feMerge>
                          <feMergeNode in="b" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <path d="M0 142 C34 130 44 146 72 120 S112 134 142 107 S182 120 212 92 S252 110 278 84 S312 94 342 68 S376 86 402 60 S432 75 462 45 S502 60 532 28 S572 46 600 18 V180 H0Z" fill="url(#pfill)" />
                    <path d="M0 142 C34 130 44 146 72 120 S112 134 142 107 S182 120 212 92 S252 110 278 84 S312 94 342 68 S376 86 402 60 S432 75 462 45 S502 60 532 28 S572 46 600 18" fill="none" stroke="#f2c14e" strokeWidth="3" filter="url(#pgglow)" />
                    <circle cx="532" cy="28" r="5" fill="#fff7d6" stroke="#f2c14e" strokeWidth="2" />
                    <circle cx="532" cy="28" r="12" fill="none" stroke="#f2c14e" strokeOpacity="0.25" strokeWidth="1" />
                  </svg>
                  <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-white/70 backdrop-blur">1H • 42 CANDLES</span>
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-400/15 border border-emerald-300/20 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-300">BULLISH</span>
                  <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                </div>

                <div className="px-5 pt-4 pb-4">
                  <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] p-3.5">
                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> AI ANALYSIS
                      <span className="ml-auto flex gap-0.5 items-end h-3">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-0.5 bg-primary rounded-full animate-wave" style={{ height: "100%", animationDelay: `${i * 0.18}s` }} />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-white/85">Strong support at 1.0820 — RSI printing bullish divergence. Risk-reward 1:3.2 on reclaim.</p>
                  </div>
                </div>

                <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                  {[
                    { p: "EUR/USD", v: "1.0847", c: "+0.24%" },
                    { p: "GBP/USD", v: "1.2648", c: "+0.18%" },
                    { p: "XAU/USD", v: "2,342.8", c: "−0.12%" },
                  ].map((r) => (
                    <div key={r.p} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                      <div className="text-[10px] tracking-widest text-white/40">{r.p}</div>
                      <div className="text-xs font-semibold text-white mt-0.5">{r.v}</div>
                      <div className={`text-[11px] font-medium ${r.c.startsWith("+") ? "text-emerald-300" : "text-red-300"}`}>{r.c}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 sm:-left-10 top-10 rounded-2xl border border-amber-200/20 bg-[#0f1c36]/90 px-3.5 py-3 backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <CircleGauge className="h-4 w-4 text-primary" /> Risk mapped
              </div>
              <p className="text-[11px] text-white/50 mt-1">Before you enter — 0.5% sizing.</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
              className="absolute -right-3 sm:-right-8 bottom-10 rounded-2xl border border-emerald-200/20 bg-[#0f1c36]/90 px-3.5 py-3 backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Zap className="h-4 w-4 text-emerald-300" /> Momentum shift
              </div>
              <p className="text-[11px] text-white/50 mt-1">Detected 12s ago • 1H + 15m aligned</p>
            </motion.div>
          </motion.div>
        </div>

        <div className="hidden sm:flex items-center justify-center gap-3 pt-10 text-[10px] uppercase tracking-[0.28em] text-white/25">
          <span className="h-px w-12 bg-white/10" /> Scroll to explore <span className="h-px w-12 bg-white/10" />
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// PROOF BAND
// ──────────────────────────────────────────────────────────
function ProofBand() {
  const logos = ["GLOBAL GATE", "TRUSTPILOT ★ 4.9/5", "TRADINGVIEW", "FOREX FACTORY", "MARKETWATCH", "INVESTING.COM", "BLOOMBERG GRADE"];
  return (
    <section className="border-y border-white/[0.06] bg-[#070e24]/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-7">
          {[
            { label: "Last Year Winning Ratio", value: 84.65, suffix: "%", decimals: 2, sub: "+6.39% vs market" },
            { label: "Trader Rating", value: 4.9, suffix: "/5", decimals: 1, sub: "1.5M+ reviews" },
            { label: "Currency Pairs", value: 16, suffix: "", decimals: 0, sub: "Analyzed 24/7" },
            { label: "Trading Expertise", value: 15, suffix: "+", decimals: 0, sub: "Years • Global Gate" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-white">
                  <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <div className="text-xs text-white/60">{s.label}</div>
                <div className="text-[11px] text-white/35">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] py-4 overflow-hidden">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-white/30 uppercase mb-3">We are featured in</div>
          <div className="relative mask-fade-edges-x">
            <div className="flex w-max animate-marquee gap-10 pr-10">
              {[...logos, ...logos].map((l, i) => (
                <span key={i} className="text-sm font-semibold tracking-[0.14em] text-white/35 whitespace-nowrap">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// LENSES
// ──────────────────────────────────────────────────────────
const lenses = [
  {
    n: "01",
    name: "TraderLens",
    tag: "Your AI trading co-pilot",
    desc: "TraderLens simplifies trading, forex analysis, and stock market insights using real-time AI-powered chart breakdowns.",
    bullets: ["Real-time chart breakdowns", "Trade signals with reasoning", "Forex & stock insights"],
    icon: BrainCircuit,
    href: "/lens/trading",
    grad: "from-primary/15 via-primary/[0.04] to-transparent",
    iconWrap: "bg-primary/10 border-primary/20 text-primary",
  },
  {
    n: "02",
    name: "ChartLens",
    tag: "Live chart intelligence",
    desc: "ChartLens helps you analyze live trading charts, interpret price action, and apply AI-powered market analysis to make informed trading decisions with confidence.",
    bullets: ["Live expert chart sessions", "Price action interpretation", "Entry & exit zone breakdowns"],
    icon: ChartCandlestick,
    href: "/dashboard/charts",
    grad: "from-accent/15 via-accent/[0.04] to-transparent",
    iconWrap: "bg-accent/10 border-accent/25 text-accent",
  },
  {
    n: "03",
    name: "EduLens",
    tag: "Structured trading education",
    desc: "EduLens is a structured financial market training designed to help you understand market fundamentals, price action, risk management, and disciplined trading strategies.",
    bullets: ["Market fundamentals → advanced", "Risk management mastery", "Disciplined strategy building"],
    icon: BookOpen,
    href: "/dashboard/learn",
    grad: "from-violet-400/15 via-violet-400/[0.04] to-transparent",
    iconWrap: "bg-violet-400/10 border-violet-400/25 text-violet-300",
  },
];

function LensesSection() {
  return (
    <section className="relative overflow-hidden bg-[#060d1e] py-20 sm:py-28 border-b border-white/[0.06]">
      <div className="absolute inset-0 bg-grid opacity-[0.18] pointer-events-none" />
      <div className="absolute -top-24 right-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Eyebrow>What we offer</Eyebrow>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white">
            Provide all your needs. <span className="gradient-text-gold">Three lenses. One loop.</span>
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-white/55 max-w-2xl">
            Analysis, live charts, and education — engineered to work as one connected loop so every session compounds into skill.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {lenses.map((lens, i) => (
            <motion.div
              key={lens.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${lens.grad} p-7 sm:p-8 backdrop-blur`}
            >
              <span className="absolute right-6 top-6 font-display text-5xl font-bold text-white/[0.04] group-hover:text-primary/10 transition-colors">
                {lens.n}
              </span>
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${lens.iconWrap}`}>
                <lens.icon className="h-5 w-5" />
              </div>
              <div className="mt-6 text-[11px] font-semibold tracking-[0.18em] text-white/40 uppercase">{lens.tag}</div>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">{lens.name}</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">{lens.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {lens.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-white/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <Link href={lens.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
                Explore {lens.name} <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// DEMO CINEMA
// ──────────────────────────────────────────────────────────
function DemoCinema() {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="relative overflow-hidden bg-[#050a18] py-20 sm:py-28 border-y border-white/[0.06]">
      <div className="absolute inset-0 bg-grid-gold opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[110px] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-12 items-center">
          <div>
            <Eyebrow icon={<CirclePlay className="h-3.5 w-3.5" />}>Interactive Platform Demo • 1.05 mins</Eyebrow>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white">
              Watch TradingLens AI <span className="gradient-text-gold">in Action</span>
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-white/55 max-w-lg">
              Master the Markets with AI-Powered Insights — get an inside look at how TradingLens AI turns market data into clear trading decisions.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/60">
                <Clock className="h-3.5 w-3.5 text-primary" /> Duration: 1:05
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/60">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Full walkthrough
              </span>
            </div>
            <button
              onClick={() => setPlaying(true)}
              className="mt-7 group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_10px_28px_rgba(242,193,78,0.35)] hover:shadow-[0_14px_36px_rgba(242,193,78,0.45)] hover:scale-[1.02] transition-all"
            >
              <CirclePlay className="h-5 w-5" /> Watch Demo Now
            </button>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/15 to-accent/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1428]/80 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
              <div className="relative aspect-video bg-[#060a18] overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-end gap-1.5 h-24">
                    {[0.5, 0.82, 0.36, 1, 0.62, 0.9, 0.44, 0.76, 0.54].map((h, i) => (
                      <motion.span
                        key={i}
                        animate={playing ? { scaleY: [h, 0.32, h * 1.18, h] } : { scaleY: h }}
                        transition={
                          playing ? { duration: 0.9, repeat: Infinity, delay: i * 0.09 } : { duration: 0.5 }
                        }
                        className="w-2.5 origin-bottom rounded-full bg-gradient-to-t from-primary to-accent"
                        style={{ height: "100%" }}
                      />
                    ))}
                  </div>
                </div>
                {playing && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-scan" />}
                <AnimatePresence>
                  {!playing && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 1.12 }}
                      onClick={() => setPlaying(true)}
                      aria-label="Play demo"
                      className="absolute inset-0 flex items-center justify-center bg-black/35 group"
                    >
                      <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(242,193,78,0.45)] group-hover:scale-110 transition-transform animate-pulse-ring">
                        <CirclePlay className="h-8 w-8" />
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
                {playing && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/75 to-transparent">
                    <div className="h-1.5 rounded-full bg-white/15 overflow-hidden mb-2.5">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 65, ease: "linear" }} className="h-full bg-gradient-to-r from-primary to-accent" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/65">
                      <span>TradingLens AI — Platform Demo</span>
                      <span>1:05</span>
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3.5">
                <span className="text-xs text-white/50">Master the Markets with AI-Powered Insights</span>
                {playing && (
                  <button onClick={() => setPlaying(false)} className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" /> Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// PRICING
// ──────────────────────────────────────────────────────────
const subscriptionPlans = [
  {
    name: "Starter Plan",
    desc: "Everything you need to start trading with clarity.",
    price: "$0",
    fee: "Free",
    features: ["$0 funding amount", "Access to EduLens basics", "Limited AI analysis per day", "1 weekly live session preview", "Limited chart uploads", "24/7 technical support"],
    popular: false,
  },
  {
    name: "Standard Plan",
    desc: "For serious traders who want the full edge.",
    price: "$25K",
    fee: "Refundable Fee $199 o/t",
    features: ["$25K funding amount", "Unlimited AI market analysis", "Full EduLens curriculum", "Full access to ChartLens live streams", "Trade breakdowns with entry/exit zones", "24/7 technical support"],
    popular: true,
  },
  {
    name: "Advanced Plan",
    desc: "Maximum capital, mentorship, and mastery.",
    price: "$50K",
    fee: "Refundable Fee $299 o/t",
    features: ["$50K funding amount", "Everything in Standard", "Advanced strategy modules", "Multi-timeframe AI analysis", "Community access + mentorship", "Exclusive high-level live sessions"],
    popular: false,
  },
];

const challengePlans = {
  oneStep: [
    { name: "Starter Challenge", desc: "One step to a funded account.", price: "$10K", fee: "Refundable Fee $99 o/t", target: "$500", minDays: "5 Days", dailyDD: "5%", maxDD: "10%", period: "No Limit", popular: false },
    { name: "Standard Challenge", desc: "One step to a funded account.", price: "$25K", fee: "Refundable Fee $199 o/t", target: "$2,000", minDays: "5 Days", dailyDD: "5%", maxDD: "10%", period: "No Limit", popular: true },
    { name: "Advanced Challenge", desc: "One step to a funded account.", price: "$50K", fee: "Refundable Fee $299 o/t", target: "$5,000", minDays: "5 Days", dailyDD: "5%", maxDD: "10%", period: "No Limit", popular: false },
  ],
  twoStep: [
    { name: "Starter 2-Step", desc: "Two phases, fully funded.", price: "$110K", fee: "Refundable Fee $99 o/t", target: "$500", minDays: "5 Days", dailyDD: "5%", maxDD: "10%", period: "No Limit", popular: false },
    { name: "Standard 2-Step", desc: "Two phases, fully funded.", price: "$125K", fee: "Refundable Fee $199 o/t", target: "$2,000", minDays: "5 Days", dailyDD: "5%", maxDD: "10%", period: "No Limit", popular: true },
    { name: "Advanced 2-Step", desc: "Two phases, fully funded.", price: "$150K", fee: "Refundable Fee $299 o/t", target: "$5,000", minDays: "5 Days", dailyDD: "5%", maxDD: "10%", period: "No Limit", popular: false },
  ],
};

type ChallengePlan = (typeof challengePlans)["oneStep"][number];

function PricingCardSubscription({ plan }: { plan: (typeof subscriptionPlans)[number] }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`relative flex h-full flex-col rounded-[28px] border p-7 backdrop-blur ${plan.popular ? "border-primary/30 bg-primary/[0.06] glow-gold" : "border-white/10 bg-white/[0.03] hover:border-primary/20"}`}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-[#d4a017] px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-[0_8px_20px_rgba(242,193,78,0.35)]">
          <Sparkles className="h-3 w-3" /> Most Popular
        </div>
      )}
      <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
      <p className="text-sm text-white/50 mt-1">{plan.desc}</p>
      <div className="mt-6">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-sm text-white/40">funding amount</span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <CircleDollarSign className="h-3 w-3" /> {plan.fee}
        </div>
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/20">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <span className="text-white/80">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/auth/signup"
        className={`mt-8 block w-full rounded-full px-4 py-3.5 text-center text-sm font-bold transition-all ${plan.popular ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(242,193,78,0.35)] hover:shadow-[0_14px_32px_rgba(242,193,78,0.45)]" : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07] hover:border-primary/20"}`}
      >
        Start Now
      </Link>
    </motion.div>
  );
}

function PricingCardChallenge({ plan }: { plan: ChallengePlan }) {
  const rows = [
    { icon: Target, label: "Profit Target", value: plan.target },
    { icon: Timer, label: "Min. Trading Days", value: plan.minDays },
    { icon: TrendingDown, label: "Daily Drawdown", value: plan.dailyDD },
    { icon: Scale, label: "Max. Drawdown", value: plan.maxDD },
    { icon: Flag, label: "Trading Period", value: plan.period },
  ];
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`relative flex h-full flex-col rounded-[28px] border p-7 backdrop-blur ${plan.popular ? "border-primary/30 bg-primary/[0.06] glow-gold" : "border-white/10 bg-white/[0.03] hover:border-primary/20"}`}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-[#d4a017] px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-[0_8px_20px_rgba(242,193,78,0.35)]">
          <Sparkles className="h-3 w-3" /> Popular Plan
        </div>
      )}
      <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
      <p className="text-sm text-white/50 mt-1">{plan.desc}</p>
      <div className="mt-6">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-sm text-white/40">funding amount</span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <CircleDollarSign className="h-3 w-3" /> {plan.fee}
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#060d1e]/60 flex-1">
        {rows.map((row, i) => (
          <div key={row.label} className={`flex items-center justify-between px-4 py-3 text-sm ${i !== rows.length - 1 ? "border-b border-white/5" : ""}`}>
            <span className="flex items-center gap-2 text-white/50">
              <row.icon className="h-3.5 w-3.5 text-primary" /> {row.label}
            </span>
            <span className="font-semibold text-white">{row.value}</span>
          </div>
        ))}
      </div>
      <Link
        href="/auth/signup"
        className={`mt-6 block w-full rounded-full px-4 py-3.5 text-center text-sm font-bold transition-all ${plan.popular ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(242,193,78,0.35)]" : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"}`}
      >
        Start Now
      </Link>
    </motion.div>
  );
}

function PricingSection() {
  const [tab, setTab] = useState<"subscriptions" | "oneStep" | "twoStep">("subscriptions");
  return (
    <section id="pricing" className="relative overflow-hidden bg-[#060d1e] py-20 sm:py-28 border-y border-white/[0.06]">
      <div className="absolute top-1/3 left-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[110px] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <Eyebrow>Join TradingLens AI</Eyebrow>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.04em] text-white">
            Our <span className="gradient-text-gold">Pricing Plan</span>
          </h2>
          <p className="mt-4 text-white/55">Subscriptions or funded challenges — pick the path that fits your trading journey. All fees are refundable on track.</p>
          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur gap-1">
            {([
              { key: "subscriptions", label: "Subscriptions" },
              { key: "oneStep", label: "1 Step Challenge" },
              { key: "twoStep", label: "2 Step Challenge" },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${tab === t.key ? "text-primary-foreground" : "text-white/55 hover:text-white"}`}
              >
                {tab === t.key && <motion.span layoutId="pricing-tab" transition={{ type: "spring", stiffness: 340, damping: 28 }} className="absolute inset-0 rounded-full bg-primary shadow-[0_8px_20px_rgba(242,193,78,0.35)]" />}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {tab === "subscriptions" && subscriptionPlans.map((p) => <PricingCardSubscription key={p.name} plan={p} />)}
            {tab === "oneStep" && challengePlans.oneStep.map((p) => <PricingCardChallenge key={p.name} plan={p} />)}
            {tab === "twoStep" && challengePlans.twoStep.map((p) => <PricingCardChallenge key={p.name} plan={p} />)}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/50">
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-300" /> 7-day free trial
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-300" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-300" /> Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// HIGHLIGHTS BENTO
// ──────────────────────────────────────────────────────────
const highlights = [
  { icon: BrainCircuit, title: "AI-Powered Market Analysis", desc: "Get real-time, data-driven insights powered by advanced AI. Analyze price action, identify trends, and make smarter trading decisions without guesswork.", span: "lg:col-span-2" },
  { icon: Layers, title: "All-in-One Trading Platform", desc: "Analysis, live charts, and education in one place — engineered so every tool feeds the next.", span: "" },
  { icon: BookOpen, title: "Structured Trading Education", desc: "Master the financial markets with step-by-step learning. From beginner to advanced, EduLens simplifies complex concepts to build real trading confidence.", span: "" },
  { icon: ChartCandlestick, title: "Real-Time Chart Intelligence", desc: "Track live market movements with precision. ChartLens delivers clear, actionable insights to help you understand price behavior as it happens.", span: "" },
  { icon: Award, title: "Built on 15+ Years Expertise", desc: "Powered by Global Gate Management's trading experience. Our AI is trained on real market data, strategies, and years of practical trading knowledge.", span: "lg:col-span-2" },
  { icon: Crosshair, title: "No Guesswork, Just Clarity", desc: "Eliminate emotional trading and confusion. Make decisions based on structured insights, not hype or noise.", span: "" },
  { icon: Headphones, title: "24/7 Support", desc: "Ask your questions to real experts — anytime, day or night. Human support on top of AI precision.", span: "lg:col-span-2" },
];

function Highlights() {
  return (
    <section className="relative overflow-hidden bg-[#050a18] py-20 sm:py-28">
      <div className="absolute top-0 right-0 h-[560px] w-[560px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <Eyebrow>Key Highlights</Eyebrow>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.04em] text-white">
            Reasons for <span className="gradient-text-gold">choosing us</span>
          </h2>
          <p className="mt-4 text-white/55">Everything is designed to replace guesswork with clarity — powered by AI and 15+ years of real trading expertise.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map((h, i) => (
            <div key={h.title} className={h.span}>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="group relative h-full overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] backdrop-blur p-6 sm:p-7 hover:border-primary/20 transition-colors"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 text-primary group-hover:scale-110 transition-transform">
                  <h.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white group-hover:text-primary transition-colors">{h.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{h.desc}</p>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// TESTIMONIALS
// ──────────────────────────────────────────────────────────
const testimonials = [
  { name: "James Okafor", role: "Day Trader, Lagos", text: "TradingLens completely changed how I approach the markets. The AI analysis is incredibly accurate and has improved my win rate by 40%.", initials: "JO" },
  { name: "Sarah Kimani", role: "Swing Trader, Nairobi", text: "The Chart Lens feature is like having a Bloomberg terminal. I wake up to fresh analysis every morning. Worth every penny.", initials: "SK" },
  { name: "Michael Adeyemi", role: "Forex Educator, Accra", text: "Edu Lens transformed how I teach my students. The AI tutor adapts to each learner's pace. My students love it.", initials: "MA" },
  { name: "Amara Nwosu", role: "Funded Trader", text: "Passed the 2-step challenge in three weeks. The AI risk breakdowns kept me disciplined — drawdown rules are burned into how I trade now.", initials: "AN" },
  { name: "David Mensah", role: "Scalper, London", text: "No guesswork, just clarity. TraderLens shows its reasoning — the patterns, the timeframes, the risk. That transparency sold me.", initials: "DM" },
  { name: "Chioma Eze", role: "Part-time Trader, Abuja", text: "I have a full-time job, so the live sessions are gold. I watch how a pro handles volatility in real time and apply it the next morning.", initials: "CE" },
];

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <figure className="relative w-[340px] sm:w-[380px] shrink-0 rounded-[24px] border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:border-primary/20 transition-colors">
      <Quote className="absolute right-5 top-5 h-7 w-7 text-primary/10" />
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
        ))}
      </div>
      <blockquote className="text-sm leading-6 text-white/80">“{t.text}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-[#d4a017] flex items-center justify-center text-primary-foreground font-bold text-sm">{t.initials}</div>
        <div>
          <div className="text-sm font-semibold text-white">{t.name}</div>
          <div className="text-xs text-white/45">{t.role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

function TestimonialsSection() {
  const a = testimonials.slice(0, 3);
  const b = testimonials.slice(3);
  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#060d1e] py-20 sm:py-28">
      <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/5 blur-[110px] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center mb-10">
        <Eyebrow>Loved by traders worldwide</Eyebrow>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.04em] text-white">
          Loved by <span className="gradient-text-gold">Traders</span> Worldwide
        </h2>
        <p className="mt-4 text-white/55 max-w-2xl mx-auto">Join thousands who elevated their trading with AI intelligence — 4.9/5 from 1.5M+ traders.</p>
      </div>
      <div className="space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex overflow-hidden">
          <div className="flex gap-4 animate-marquee pr-4 hover:[animation-play-state:paused]">
            {[...a, ...a, ...a].map((t, i) => (
              <TestimonialCard key={`a-${i}`} t={t} />
            ))}
          </div>
        </div>
        <div className="flex overflow-hidden">
          <div className="flex gap-4 animate-marquee-reverse pr-4 hover:[animation-play-state:paused]">
            {[...b, ...b, ...b].map((t, i) => (
              <TestimonialCard key={`b-${i}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// FAQ + CONTACT
// ──────────────────────────────────────────────────────────
const faqs = [
  { q: "Is TradingLens AI beginner-friendly?", a: "Absolutely. EduLens was built around real questions beginners ask — not reverse-engineered from a textbook. You get step-by-step lessons from fundamentals to advanced strategy, while TraderLens explains every analysis in plain language." },
  { q: "Does the AI give entry and exit points?", a: "Yes — with full transparency. TraderLens shows the reasoning: technical patterns identified, timeframes analyzed, and risk levels factored in. Clear entry, stop, and take-profit zones, never a black box." },
  { q: "Do you cover forex, crypto and stocks?", a: "TraderLens covers forex, metals, indices and stock insights with real-time AI chart breakdowns. ChartLens streams live analysis across 16 major FX pairs and metals, 24/7." },
  { q: "Is there a refund policy?", a: "All challenge fees are fully refundable once you complete the track successfully. Subscriptions start with a 7-day free trial — no card required — cancel anytime." },
  { q: "Is customer support available?", a: "24/7 via live chat, email at info@tradinglensai.com, and WhatsApp. Business hours line: Mon–Fri, 9am–5pm WAT. Average first response under 4 minutes." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative overflow-hidden bg-[#050a18] py-20 sm:py-28">
      <div className="absolute bottom-0 left-1/4 h-[520px] w-[520px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-10 lg:gap-12">
          <div>
            <Eyebrow>FAQ’s • Common queries & solutions</Eyebrow>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.04em] text-white leading-[0.95]">
              Common queries & <span className="gradient-text-gold">solutions</span>
            </h2>
            <p className="mt-4 text-white/55 max-w-md">Can’t find what you’re looking for? Our trading specialists are standing by.</p>
            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] backdrop-blur p-6 sm:p-7">
              <h3 className="font-display font-semibold text-white">Get in Touch</h3>
              <p className="text-sm text-white/50 mt-1">Let’s chat, drop us a line!</p>
              <ul className="mt-5 space-y-3.5 text-sm">
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <a href="tel:+2347055555676" className="text-white hover:text-primary transition-colors">
                    +234 705 555 5676
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <a href="mailto:info@tradinglensai.com" className="text-white hover:text-primary transition-colors">
                    info@tradinglensai.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="text-white/60 text-sm leading-6">Plot 8, Port Elizabeth Street, Off Nairobi Street, Wuse II, Abuja, Nigeria</span>
                </li>
              </ul>
              <Link href="/contact" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
                Say Hi & Hello <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0b1428]/60 p-6 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs tracking-[0.16em] text-primary uppercase font-semibold">Discord Community</div>
                <div className="text-sm font-semibold text-white mt-1">4,235 members online now</div>
                <div className="text-xs text-white/50">Be a part of our update community.</div>
              </div>
              <a href="https://discord.gg/tradinglensai" target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-white text-[#050a18] px-5 py-2.5 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-colors">
                Accept Invite
              </a>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={faq.q}
                  className={`overflow-hidden rounded-2xl border transition-colors ${isOpen ? "border-primary/30 bg-primary/[0.06]" : "border-white/10 bg-white/[0.03] hover:border-white/15"}`}
                >
                  <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left">
                    <span className="text-sm sm:text-[15px] font-semibold text-white">{faq.q}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isOpen ? "bg-primary border-primary text-primary-foreground" : "border-white/15 text-white/50"}`}>
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                        <p className="px-5 sm:px-6 pb-5 text-sm leading-6 text-white/60">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// FINAL CTA
// ──────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#060d1e] py-16 sm:py-20 border-t border-white/[0.06]">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary/[0.10] via-[#0b1428]/80 to-[#0b1428]/90 p-8 sm:p-12 lg:p-14 text-center backdrop-blur">
          <div className="absolute -top-20 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[70px] pointer-events-none" />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.04em] text-white">
              Ready to Trade With <span className="gradient-text-gold">Clarity?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/55">Join thousands who replaced guesswork with intelligence. Start free — no card required. AI insights are educational, never financial advice.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/auth/signup" className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#050a18] hover:bg-primary hover:text-primary-foreground transition-colors">
                Create your workspace <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#pricing" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors">
                View Pricing
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/35">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Bank-level security
              </span>
              <span>•</span>
              <span>15+ years expertise</span>
              <span>•</span>
              <span>24/7 human support</span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.02] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/25 text-[#5865F2]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs tracking-[0.16em] text-white/40 uppercase font-semibold">Say Hi & Hello</div>
              <div className="font-display font-semibold text-white mt-0.5">Participate in our Discord Community</div>
              <div className="text-sm text-white/50 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> 4,235 members online now
              </div>
            </div>
          </div>
          <a href="https://discord.gg/tradinglensai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-6 py-3 text-sm font-bold text-white hover:bg-[#4752c4] transition-colors">
            Accept Our Invite <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────
// page
// ──────────────────────────────────────────────────────────
export function PremiumHome() {
  return (
    <>
      <Hero />
      <ProofBand />
      <LensesSection />
      <DemoCinema />
      <PricingSection />
      <Highlights />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
