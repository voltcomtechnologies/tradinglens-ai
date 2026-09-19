"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleGauge,
  LineChart,
  Play,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Hero3DScene } from "./hero-3d-scene";

const signalRows = [
  { pair: "EUR / USD", price: "1.0847", change: "+0.24%", tone: "text-emerald-300" },
  { pair: "GBP / USD", price: "1.2631", change: "+0.18%", tone: "text-emerald-300" },
  { pair: "XAU / USD", price: "2,342.80", change: "−0.12%", tone: "text-rose-300" },
];

const modules = [
  {
    icon: Radar,
    eyebrow: "01 / Detect",
    title: "See the market as it moves.",
    copy: "A live radar for structure, momentum and liquidity — so the important shift never hides inside the noise.",
    className: "from-cyan-400/15 via-cyan-400/[0.03] to-transparent",
  },
  {
    icon: BrainCircuit,
    eyebrow: "02 / Understand",
    title: "Turn patterns into a plan.",
    copy: "Every signal comes with context, confidence and the reasoning behind it. No black boxes. No guesswork.",
    className: "from-violet-400/15 via-violet-400/[0.03] to-transparent",
  },
  {
    icon: Target,
    eyebrow: "03 / Execute",
    title: "Trade with a calmer edge.",
    copy: "Journal the decision, measure the outcome and build a repeatable process that compounds over time.",
    className: "from-emerald-400/15 via-emerald-400/[0.03] to-transparent",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
      {children}
    </div>
  );
}

function MarketCard() {
  return (
    <div className="relative rounded-[28px] border border-white/10 bg-[#101827]/80 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-5">
      <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-cyan-200/25 via-transparent to-violet-300/20 opacity-70" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
              <LineChart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Live market pulse</p>
              <p className="text-[10px] text-slate-500">Tuesday, 09:41:08 UTC</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE
          </span>
        </div>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">EUR / USD</p>
            <p className="font-display text-4xl font-semibold tracking-tight text-white">1.0847</p>
          </div>
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-right">
            <p className="text-[10px] text-emerald-200/70">Signal confidence</p>
            <p className="font-display text-lg font-semibold text-emerald-300">84.6%</p>
          </div>
        </div>

        <div className="relative mb-4 h-36 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b1220] px-2 py-3">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:34px_34px]" />
          <svg viewBox="0 0 600 180" className="relative h-full w-full overflow-visible" preserveAspectRatio="none" aria-label="Animated market chart">
            <defs>
              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity=".28" />
                <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
              </linearGradient>
              <filter id="chartGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path d="M0 142 C35 130 40 145 70 118 S110 132 140 105 S180 118 210 90 S250 108 276 82 S310 92 340 66 S374 84 400 58 S430 73 460 43 S500 58 530 26 S570 44 600 16 V180 H0Z" fill="url(#chartFill)" />
            <path d="M0 142 C35 130 40 145 70 118 S110 132 140 105 S180 118 210 90 S250 108 276 82 S310 92 340 66 S374 84 400 58 S430 73 460 43 S500 58 530 26 S570 44 600 16" fill="none" stroke="#67e8f9" strokeWidth="3" filter="url(#chartGlow)" />
            <circle cx="530" cy="26" r="5" fill="#a7f3d0" />
          </svg>
          <span className="absolute right-3 top-3 rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">BULLISH</span>
        </div>

        <div className="space-y-2">
          {signalRows.map((row) => (
            <div key={row.pair} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-xs">
              <span className="font-medium text-slate-300">{row.pair}</span>
              <span className="text-slate-400">{row.price}</span>
              <span className={row.tone}>{row.change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PremiumHome() {
  return (
    <>
      <section className="relative isolate min-h-[760px] overflow-hidden border-b border-white/[0.07] bg-[#070d18] pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_32%,rgba(103,232,249,0.13),transparent_27%),radial-gradient(circle_at_18%_72%,rgba(167,139,250,0.1),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <Hero3DScene />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 pb-24 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-4 lg:px-10 lg:pb-32">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <SectionLabel>Market intelligence, reimagined</SectionLabel>
            <h1 className="max-w-2xl font-display text-[3.4rem] font-semibold leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl lg:text-[5.9rem]">
              The signal is there. <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">See it sooner.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              TradingLens turns live market data into clear, explainable decisions — so you can move from overwhelmed to in control.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/auth/signup" className="group inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-5 py-3.5 text-sm font-bold text-[#07111d] shadow-[0_0_32px_rgba(103,232,249,0.22)] transition hover:bg-white">
                Start your free workspace <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/lens/trading" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-200/50 hover:bg-white/[0.08]"><Play className="h-4 w-4 fill-cyan-200 text-cyan-200" /> Explore the lens</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> No card required</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Built for every skill level</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Human-readable AI</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.2, duration: 1 }} className="relative mx-auto w-full max-w-[480px] lg:ml-auto lg:mr-3">
            <div className="absolute -inset-10 rounded-full bg-cyan-300/10 blur-3xl" />
            <MarketCard />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-5 top-12 rounded-2xl border border-violet-200/20 bg-[#11192a]/90 p-3 shadow-xl backdrop-blur-xl sm:-left-14">
              <div className="flex items-center gap-2"><CircleGauge className="h-4 w-4 text-violet-300" /><span className="text-xs font-semibold text-white">Risk mapped</span></div><p className="mt-1 text-[10px] text-slate-500">Before you enter.</p>
            </motion.div>
            <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -right-3 bottom-10 rounded-2xl border border-emerald-200/20 bg-[#11192a]/90 p-3 shadow-xl backdrop-blur-xl sm:-right-12">
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-300" /><span className="text-xs font-semibold text-white">Momentum shift</span></div><p className="mt-1 text-[10px] text-slate-500">Detected 12s ago.</p>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-slate-600 sm:flex"><span className="h-px w-10 bg-slate-700" /> Scroll to explore <span className="h-px w-10 bg-slate-700" /></div>
      </section>

      <section className="border-b border-white/[0.07] bg-[#091220] py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 text-xs sm:px-8 lg:px-10">
          <span className="uppercase tracking-[0.22em] text-slate-600">Trusted by focused traders</span>
          <div className="flex flex-wrap gap-x-8 gap-y-2 font-display text-sm font-semibold tracking-wide text-slate-500"><span>GLOBAL GATE</span><span>TRADINGVIEW</span><span>FOREX FACTORY</span><span>MARKETWATCH</span></div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#08101d] py-28 sm:py-36">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div><SectionLabel>The clarity loop</SectionLabel><h2 className="max-w-xl font-display text-4xl font-semibold leading-tight tracking-[-0.045em] text-white sm:text-5xl">A sharper way to <span className="text-cyan-200">read the room.</span></h2></div>
            <p className="max-w-2xl text-lg leading-8 text-slate-400">Your edge is not one more indicator. It is the confidence to know what matters, why it matters, and what to do next.</p>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {modules.map((module, index) => <motion.div key={module.eyebrow} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * 0.12 }} className={`group relative min-h-[310px] overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br ${module.className} p-7 transition hover:-translate-y-1 hover:border-cyan-200/30`}><div className="absolute right-5 top-5 font-display text-5xl font-semibold text-white/[0.05]">0{index + 1}</div><module.icon className="h-8 w-8 text-cyan-200" /><p className="mt-12 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{module.eyebrow}</p><h3 className="mt-3 max-w-xs font-display text-2xl font-semibold leading-tight text-white">{module.title}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">{module.copy}</p><ArrowUpRight className="absolute bottom-7 right-7 h-5 w-5 text-slate-600 transition group-hover:text-cyan-200" /></motion.div>)}
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.07] bg-[#0b1524] py-28 sm:py-36">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-10">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0a1220] p-6 shadow-2xl shadow-black/25 sm:p-8"><div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-400/10 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI decision brief</p><p className="mt-2 font-display text-xl font-semibold text-white">EUR / USD · 1H</p></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">HIGH CONVICTION</span></div><div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="flex items-center gap-2 text-xs font-semibold text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Lens readout</div><p className="mt-4 text-lg leading-7 text-white">“Price is reclaiming the 1.0820 demand zone with momentum aligned across the 15m and 1H.”</p><div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-xl bg-emerald-300/10 p-3"><p className="text-slate-500">Bias</p><p className="mt-1 font-bold text-emerald-300">LONG</p></div><div className="rounded-xl bg-cyan-300/10 p-3"><p className="text-slate-500">R:R</p><p className="mt-1 font-bold text-cyan-200">1 : 3.2</p></div><div className="rounded-xl bg-violet-300/10 p-3"><p className="text-slate-500">Risk</p><p className="mt-1 font-bold text-violet-200">0.5%</p></div></div></div><div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-5 text-xs"><span className="flex items-center gap-2 text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Explainable by design</span><span className="text-cyan-200">View full analysis <ChevronRight className="inline h-3.5 w-3.5" /></span></div></div></div>
          <div><SectionLabel>Inside the lens</SectionLabel><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.045em] text-white sm:text-5xl">Less noise.<br /><span className="text-violet-200">More conviction.</span></h2><p className="mt-6 max-w-lg text-base leading-7 text-slate-400">TradingLens brings technical structure, market context and disciplined risk into one focused workspace. It does not trade for you — it makes your thinking better.</p><Link href="/lens/trading" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 transition hover:gap-3">See how the lens works <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#070d18] py-28 sm:py-36"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" /><div className="mx-auto max-w-4xl px-5 text-center sm:px-8"><SectionLabel>Build your edge</SectionLabel><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-6xl">Trade the plan.<br /><span className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-transparent">Not the noise.</span></h2><p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-400">Join a calmer, clearer way to approach the market. Your first workspace is free.</p><Link href="/auth/signup" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-bold text-[#07111d] transition hover:bg-cyan-200">Create your workspace <ArrowRight className="h-4 w-4" /></Link><p className="mt-5 text-xs text-slate-600">AI-generated insights are educational and never financial advice.</p></div></section>
    </>
  );
}
