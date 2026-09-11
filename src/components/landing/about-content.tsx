"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  Target,
  Compass,
  Users,
  TrendingUp,
  Lightbulb,
  HeartHandshake,
  Infinity as InfinityIcon,
  Brain,
  ChartCandlestick,
  BookOpen,
  MessagesSquare,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

/* ---------------- Hero ---------------- */
export function AboutHero() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid mask-fade-y opacity-60" />
      <div className="absolute -top-32 left-1/3 w-[600px] h-[500px] bg-primary/10 blur-[140px] rounded-full animate-aurora pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* breadcrumb */}
        <ScrollReveal className="mb-6">
          <nav className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">About Company</span>
          </nav>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h1 className="font-display text-4xl sm:text-6xl font-bold mb-6 tracking-tight">
            About <span className="gradient-text glow-text-subtle">TradingLens AI</span>
          </h1>
          <p className="font-display text-xl sm:text-2xl text-foreground/90 max-w-3xl mx-auto leading-relaxed">
            We put institutional-grade intelligence{" "}
            <span className="gradient-text font-semibold">
              in every trader&apos;s hands.
            </span>
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
            TradingLens AI is the all-in-one platform where real-time AI
            analysis, live expert chart sessions, and structured trading
            education come together — so you stop guessing and start trading
            with clarity.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ---------------- Founder note ---------------- */
export function FoundersNote() {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-8 sm:p-12 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-56 h-56 bg-primary/15 blur-3xl rounded-full" />
            <div className="relative">
              <div className="text-6xl font-display text-primary/25 leading-none mb-4 select-none">
                &ldquo;
              </div>
              <blockquote className="text-lg sm:text-xl leading-relaxed text-foreground/90 mb-8">
                We didn&apos;t build TradingLens AI to be another signal service
                or copy-trading shortcut. We built it because the trading world
                had a clarity problem — too much noise, too little guidance, and
                far too many traders losing money they didn&apos;t have to lose.
                Our mission is simple: give every trader the tools, knowledge,
                and real-time intelligence they need to make consistently better
                decisions — regardless of their background or experience level.
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/25">
                  GI
                </div>
                <div>
                  <div className="font-semibold">Gabriel Iheonu</div>
                  <div className="text-sm text-muted-foreground">
                    CEO &amp; Founder
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ---------------- Company stats ---------------- */
const companyStats = [
  { value: "4 Hours", label: "Avg Payout Processing Time" },
  { value: "2 Days", label: "To Earn a Trading Account" },
  { value: "10 Million", label: "No. of Trades Opened Last Month" },
  { value: "6 Billion", label: "Trader Payouts Provided Since 2013" },
];

export function CompanyStats() {
  return (
    <section className="relative py-16 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {companyStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-3xl sm:text-4xl font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Mission & Vision ---------------- */
export function MissionVision() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/[0.05] blur-[130px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Empowering Every Trader to Make{" "}
            <span className="gradient-text glow-text-subtle">
              Decisions with Confidence
            </span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <ScrollReveal>
            <div className="group relative h-full rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-8 sm:p-10 overflow-hidden hover:border-primary/30 transition-colors">
              <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-colors" />
              <div className="relative">
                <div className="inline-flex p-3.5 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">
                  Our Mission
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We didn&apos;t build TradingLens AI to be another signal
                  service or copy-trading shortcut. Our mission is simple: give
                  every trader the tools, knowledge, and real-time intelligence
                  they need to make consistently better decisions — regardless
                  of their background or experience level.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.12}>
            <div className="group relative h-full rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-8 sm:p-10 overflow-hidden hover:border-accent/30 transition-colors">
              <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-accent/10 blur-3xl rounded-full group-hover:bg-accent/20 transition-colors" />
              <div className="relative">
                <div className="inline-flex p-3.5 rounded-2xl bg-accent/10 border border-accent/30 mb-6">
                  <Eye className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">
                  Our Vision
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We envision a future where the gap between institutional
                  traders and everyday retail traders no longer exists. A world
                  where anyone with the drive to learn and the discipline to act
                  can access the same quality of market intelligence that once
                  required a Bloomberg terminal and a six-figure salary.
                  TradingLens AI is building that future — one clear trade
                  decision at a time.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Core values ---------------- */
const values = [
  {
    icon: Lightbulb,
    title: "Clarity Over Complexity",
    description:
      "Plain-language insights. If the AI can't explain it, it doesn't ship it.",
  },
  {
    icon: Users,
    title: "Accessibility for All",
    description:
      "Institutional-grade tools at a price any serious trader can afford.",
  },
  {
    icon: HeartHandshake,
    title: "Community Over Competition",
    description:
      "Traders win together — shared sessions, shared playbooks, shared growth.",
  },
  {
    icon: TrendingUp,
    title: "Continuous Growth",
    description:
      "Every session, lesson, and analysis compounds into lasting skill.",
  },
  {
    icon: Compass,
    title: "Radical Transparency",
    description:
      "The AI shows its reasoning. Our track record is public. No smoke.",
  },
  {
    icon: InfinityIcon,
    title: "Built for the Long Run",
    description:
      "No hype cycles, no shortcuts — durable systems that outlast markets.",
  },
];

export function CoreValues() {
  return (
    <section className="relative py-24 border-y border-border/40 overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-20 mask-fade-y pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Our <span className="gradient-text glow-text-subtle">Core Values</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            These aren&apos;t poster values. They&apos;re the rules we hold
            ourselves to — in the product we build, the sessions we host, and
            the community we nurture.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((value, i) => (
            <ScrollReveal key={value.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                className="group h-full rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-7 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/25 mb-5 group-hover:scale-110 transition-transform duration-500">
                  <value.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why different ---------------- */
const differentiators = [
  {
    icon: Layers,
    title: "Three Tools. One Platform. Zero Gaps",
    description:
      "TradingLens AI was architected so that ChartLens, TraderLens, and EduLens work together. That connected loop is what builds lasting skill, not isolated features.",
  },
  {
    icon: ChartCandlestick,
    title: "Live Sessions That Mirror Real Markets",
    description:
      "ChartLens isn't a polished highlight reel. It's real-time, live-market chart analysis with expert commentary happening as prices move. When volatility hits, you see how a skilled trader handles it — not how a presenter explains it after the fact.",
  },
  {
    icon: Brain,
    title: "AI That Explains Itself",
    description:
      "TraderLens doesn't just output a buy or sell signal and expect you to act on faith. It shows you the reasoning — the technical patterns it identified, the timeframes it analysed, and the risk levels it factored in.",
  },
  {
    icon: GraduationCap,
    title: "A Learning Curve Built for Real People",
    description:
      "EduLens wasn't reverse-engineered from a finance textbook. It was built around the real questions beginner and intermediate traders ask, the mistakes they consistently make, and the breakthroughs that actually change their results.",
  },
  {
    icon: MessagesSquare,
    title: "A Community That Trades With You",
    description:
      "4,235+ members strong. Share setups, review the day's sessions, and get mentorship from traders who've walked the path.",
  },
];

// Layer icon defined locally to avoid an unused-import
function Layers({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  );
}

export function WhyDifferent() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Here&apos;s what makes TradingLens AI{" "}
            <span className="gradient-text glow-text-subtle">different</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Why Choose TradingLens AI — designed as one connected loop, not a
            bundle of disconnected features.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {differentiators.map((item, i) => (
            <ScrollReveal
              key={item.title}
              delay={i * 0.08}
              className={i === 0 ? "md:col-span-2 lg:col-span-1" : ""}
            >
              <motion.div
                whileHover={{ y: -6 }}
                className="group h-full rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-7 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/25 mb-5 group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}

          {/* CTA tile */}
          <ScrollReveal delay={0.4}>
            <Link
              href="/auth/signup"
              className="group flex h-full min-h-[180px] flex-col items-start justify-between rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-7 transition-all hover:border-primary/60 glow-orange"
            >
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <div className="font-display font-bold text-xl mb-1.5">
                  Ready to Trade With Clarity?
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Join thousands of traders who&apos;ve replaced guesswork with
                  intelligence. Start free — no card required.
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
