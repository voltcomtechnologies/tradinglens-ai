"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  ChartCandlestick,
  TrendingUp,
  ShieldCheck,
  Zap,
  Play,
} from "lucide-react";
import { ParticleBackground } from "./particle-background";

/* ------------------------------------------------------------------ */
/*  Animated candlestick chart canvas                                  */
/* ------------------------------------------------------------------ */
function AnimatedCandleChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let rafId = 0;
    let visible = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();

    interface Candle {
      o: number;
      c: number;
      h: number;
      l: number;
    }

    const W = () => canvas.width;
    const H = () => canvas.height;
    const COUNT = 42;
    const cw = () => W() / COUNT;

    // Seeded walk so first paint looks good
    const candles: Candle[] = [];
    let price = 0.5;
    for (let i = 0; i < COUNT; i++) {
      const drift = Math.sin(i / 6) * 0.012;
      const o = price;
      const c = Math.min(
        0.92,
        Math.max(0.08, o + drift + (Math.random() - 0.44) * 0.06)
      );
      const h = Math.max(o, c) + Math.random() * 0.03;
      const l = Math.min(o, c) - Math.random() * 0.03;
      candles.push({ o, c, h, l });
      price = c;
    }

    let t = 0;
    const draw = () => {
      if (!visible || !ctx) return;
      t += 1;

      // Occasionally push a new candle
      if (t % 18 === 0 && !prefersReduced) {
        const last = candles[candles.length - 1];
        const o = last.c;
        const c = Math.min(
          0.92,
          Math.max(0.08, o + (Math.random() - 0.44) * 0.07)
        );
        candles.push({
          o,
          c,
          h: Math.max(o, c) + Math.random() * 0.03,
          l: Math.min(o, c) - Math.random() * 0.03,
        });
        if (candles.length > COUNT) candles.shift();
      }

      ctx.clearRect(0, 0, W(), H());

      const pad = 8 * dpr;
      const y = (v: number) => pad + (1 - v) * (H() - pad * 2);

      // horizontal gridlines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const gy = pad + ((H() - pad * 2) / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W(), gy);
        ctx.stroke();
      }

      candles.forEach((cd, i) => {
        const x = i * cw() + cw() / 2;
        const bull = cd.c >= cd.o;
        const color = bull ? "#10b981" : "#ef4444";

        // wick
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(x, y(cd.h));
        ctx.lineTo(x, y(cd.l));
        ctx.stroke();
        ctx.globalAlpha = 1;

        // body
        const bw = cw() * 0.55;
        const bh = Math.max(2, Math.abs(y(cd.c) - y(cd.o)));
        const by = Math.min(y(cd.c), y(cd.o));
        ctx.fillStyle = color;
        ctx.globalAlpha = bull ? 0.9 : 0.75;
        ctx.beginPath();
        ctx.roundRect(x - bw / 2, by, bw, bh, 2 * dpr);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // glowing last-price line
      const last = candles[candles.length - 1];
      const ly = y(last.c);
      const grad = ctx.createLinearGradient(0, 0, W(), 0);
      grad.addColorStop(0, "rgba(255,107,0,0)");
      grad.addColorStop(1, "rgba(255,140,0,0.9)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(W(), ly);
      ctx.stroke();

      // pulsing dot at live price
      const pulse = 3 + Math.sin(t / 10) * 1.5;
      ctx.fillStyle = "rgba(255,140,0,0.35)";
      ctx.beginPath();
      ctx.arc(W() - 6 * dpr, ly, (pulse + 6) * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb020";
      ctx.beginPath();
      ctx.arc(W() - 6 * dpr, ly, pulse * dpr, 0, Math.PI * 2);
      ctx.fill();

      rafId = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        visible = false;
        cancelAnimationFrame(rafId);
      } else {
        visible = true;
        rafId = requestAnimationFrame(draw);
      }
    };

    if (prefersReduced) {
      draw();
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      aria-hidden="true"
      role="presentation"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Typing AI insight ticker                                           */
/* ------------------------------------------------------------------ */
const AI_INSIGHTS = [
  "Strong support at 1.0820 — RSI printing bullish divergence.",
  "GBP/USD breaking out of falling wedge on the 1H.",
  "Risk reward 1:3.2 on XAU/USD long — entry zone validated.",
  "Momentum shift detected: EUR/JPY approaching supply zone.",
];

function useTypewriter(lines: string[], speed = 28, pause = 2400) {
  const [text, setText] = useState("");
  const [line, setLine] = useState(0);

  useEffect(() => {
    let i = 0;
    let dir = 1;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = lines[line];
      setText(current.slice(0, i));
      if (dir === 1) {
        if (i < current.length) {
          i++;
          timeout = setTimeout(tick, speed);
        } else {
          dir = 0;
          timeout = setTimeout(tick, pause);
        }
      } else if (dir === 0) {
        dir = -1;
        timeout = setTimeout(tick, 400);
      } else {
        if (i > 0) {
          i = Math.max(0, i - 3);
          timeout = setTimeout(tick, 12);
        } else {
          dir = 1;
          setLine((l) => (l + 1) % lines.length);
        }
      }
    };
    tick();
    return () => clearTimeout(timeout);
  }, [line, lines, speed, pause]);

  return text;
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const typed = useTypewriter(AI_INSIGHTS);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const headline = "Trade Smarter with AI-Powered Precision";

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden flex items-center"
    >
      {/* ---- Background layers (all z-0, all pointer-events-none) ---- */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        {/* Grid */}
        <div className="absolute inset-0 bg-grid mask-fade-y opacity-70" />

        {/* Interactive particle field: mesh-gradient aura + floating geometry.
            Owns its own canvas, cursor physics and reduced-motion handling.
            Tune density / colours / speed via the `config` prop. */}
        <ParticleBackground />

        {/* Legibility scrim — dims the busiest part of the field behind the
            copy so the headline and CTAs stay crisp. Deliberately a gradient
            rather than backdrop-filter: a full-size backdrop blur would have
            to re-sample the animating canvas every frame. The small badges and
            the secondary CTA still use real glassmorphism. */}
        <div className="absolute inset-0 bg-[radial-gradient(85%_75%_at_20%_45%,rgba(7,6,5,0.88)_0%,rgba(7,6,5,0.5)_42%,transparent_75%)] lg:bg-[radial-gradient(62%_95%_at_16%_48%,rgba(7,6,5,0.82)_0%,rgba(7,6,5,0.38)_50%,transparent_78%)]" />

        {/* Radial vignette — also reads as background depth-of-field */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#070605_85%)]" />
      </motion.div>

      <motion.div style={{ opacity: fade }} className="relative z-10 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
            {/* ---------------- Left: copy ---------------- */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-sm font-medium mb-7 backdrop-blur-sm"
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary/30 animate-ping" />
                  <Sparkles className="h-3.5 w-3.5 relative" />
                </span>
                AI-Powered Market Analysis
              </motion.div>

              {/* Word-by-word reveal headline */}
              <h1 className="font-display text-[2.75rem] leading-[1.06] sm:text-6xl lg:text-[4.4rem] font-bold tracking-tight mb-6">
                {headline.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 34, rotateX: -50 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      delay: 0.25 + i * 0.07,
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="inline-block mr-[0.28em]"
                  >
                    {i >= 3 ? (
                      <span className="gradient-text glow-text-subtle">
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg text-muted-foreground mb-9 max-w-xl leading-relaxed"
              >
                TradingLens AI helps you analyze the market, learn proven
                strategies, and make confident trading decisions — all in one
                intelligent platform.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap gap-4 mb-12"
              >
                <Link
                  href="/auth/signup"
                  className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold transition-all hover:scale-[1.03] glow-orange-strong hover:bg-accent hover:text-accent-foreground"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
                <Link
                  href="/lens/chart"
                  className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all bg-background/25 backdrop-blur-md"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 border border-primary/30 group-hover:scale-110 transition-transform">
                    <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                  </span>
                  See It In Action
                </Link>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.15, duration: 0.8 }}
                className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bullish/10 border border-bullish/25">
                    <TrendingUp className="h-3.5 w-3.5 text-bullish" />
                  </div>
                  <span>
                    <strong className="text-foreground font-semibold">84.65%</strong>{" "}
                    win ratio last year
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/25">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  </div>
                  <span>
                    <strong className="text-foreground font-semibold">4.9/5</strong>{" "}
                    from 1.5M+ traders
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/25">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Bank-level security</span>
                </div>
              </motion.div>
            </div>

            {/* ---------------- Right: floating dashboard ---------------- */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              {/* Glow behind card */}
              <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 via-transparent to-accent/15 blur-3xl rounded-full" />

              {/* Dashboard card */}
              <div className="relative rounded-3xl overflow-hidden border border-primary/25 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/60">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-bullish/70" />
                    <span className="ml-3 text-xs font-semibold tracking-wide text-muted-foreground">
                      EUR/USD · 1H
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-bullish bg-bullish/10 border border-bullish/25 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-bullish animate-pulse" />
                    LIVE
                  </div>
                </div>

                {/* Price header */}
                <div className="flex items-end justify-between px-5 pt-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Current Price
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-display text-bullish tabular-nums">
                        1.0847
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-bullish bg-bullish/10 px-2 py-0.5 rounded-lg">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +0.24%
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground space-y-0.5">
                    <div>
                      Bid <span className="text-foreground font-medium">1.0845</span>
                    </div>
                    <div>
                      Ask <span className="text-foreground font-medium">1.0849</span>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-44 px-2 pt-2">
                  <AnimatedCandleChart />
                </div>

                {/* AI insight bar */}
                <div className="px-5 pb-5 pt-1">
                  <div className="p-3.5 rounded-2xl bg-primary/[0.07] border border-primary/20">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI ANALYSIS
                      <span className="flex gap-0.5 items-end h-2.5 ml-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-0.5 bg-primary rounded-full animate-wave"
                            style={{
                              height: "100%",
                              animationDelay: `${i * 0.18}s`,
                            }}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 min-h-[2.5rem]">
                      {typed}
                      <span className="inline-block w-0.5 h-3.5 bg-primary align-middle ml-0.5 animate-pulse" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-7 -right-6 px-4 py-2.5 rounded-2xl glass border border-accent/30 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20">
                    <ChartCandlestick className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-accent leading-none">
                      16 Pairs
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Analyzed 24/7
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-7 -left-7 px-4 py-2.5 rounded-2xl glass border border-bullish/30 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-bullish/20">
                    <Zap className="h-4 w-4 text-bullish" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-bullish leading-none">
                      +6.39%
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Market comparison
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-primary to-transparent relative overflow-hidden">
          <motion.span
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-0 w-full h-1/2 bg-accent"
          />
        </div>
      </motion.div>
    </section>
  );
}

// Local star icon (avoids extra import churn above)
function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l2.92 6.26 6.58.83-4.86 4.53 1.25 6.53L12 16.9 6.11 20.15l1.25-6.53L2.5 9.09l6.58-.83L12 2z" />
    </svg>
  );
}
