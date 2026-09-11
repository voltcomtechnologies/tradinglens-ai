"use client";

import { Star, Quote } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const testimonials = [
  {
    name: "James Okafor",
    role: "Day Trader, Lagos",
    content:
      "TradingLens completely changed how I approach the markets. The AI analysis is incredibly accurate and has improved my win rate by 40%.",
    initials: "JO",
  },
  {
    name: "Sarah Kimani",
    role: "Swing Trader, Nairobi",
    content:
      "The Chart Lens feature is like having a Bloomberg terminal. I wake up to fresh analysis every morning. Worth every penny.",
    initials: "SK",
  },
  {
    name: "Michael Adeyemi",
    role: "Forex Educator, Accra",
    content:
      "Edu Lens transformed how I teach my students. The AI tutor adapts to each learner's pace. My students love it.",
    initials: "MA",
  },
  {
    name: "Amara Nwosu",
    role: "Funded Trader",
    content:
      "Passed the 2-step challenge in three weeks. The AI risk breakdowns kept me disciplined — drawdown rules are burned into how I trade now.",
    initials: "AN",
  },
  {
    name: "David Mensah",
    role: "Scalper, London",
    content:
      "No guesswork, just clarity. TraderLens shows its reasoning — the patterns, the timeframes, the risk. That transparency is what sold me.",
    initials: "DM",
  },
  {
    name: "Chioma Eze",
    role: "Part-time Trader, Abuja",
    content:
      "I have a full-time job, so the live sessions are gold. I watch how a pro handles volatility in real time and apply it the next morning.",
    initials: "CE",
  },
];

function TestimonialCard({
  t,
}: {
  t: (typeof testimonials)[number];
}) {
  return (
    <figure className="relative w-[340px] sm:w-[400px] shrink-0 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 transition-colors">
      <Quote className="absolute top-5 right-5 h-8 w-8 text-primary/10" />
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed text-foreground/85 mb-5">
        &ldquo;{t.content}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
          {t.initials}
        </div>
        <div>
          <div className="font-semibold text-sm">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const rowA = testimonials.slice(0, 3);
  const rowB = testimonials.slice(3);

  return (
    <section className="relative py-28 sm:py-36 overflow-hidden border-y border-border/40">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/[0.05] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-14">
        <ScrollReveal className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Quote className="h-3.5 w-3.5" />
            Testimonials
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight">
            Loved by{" "}
            <span className="gradient-text glow-text-subtle">Traders</span>{" "}
            Worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join thousands of traders who have elevated their trading with AI
            intelligence — 4.9/5 from 1.5 million+ traders.
          </p>
        </ScrollReveal>
      </div>

      {/* Marquees */}
      <ScrollReveal className="space-y-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex overflow-hidden">
          <div className="flex gap-5 animate-marquee pr-5 hover:[animation-play-state:paused]">
            {[...rowA, ...rowA, ...rowA].map((t, i) => (
              <TestimonialCard key={`a-${t.name}-${i}`} t={t} />
            ))}
          </div>
        </div>
        <div className="flex overflow-hidden">
          <div className="flex gap-5 animate-marquee-reverse pr-5 hover:[animation-play-state:paused]">
            {[...rowB, ...rowB, ...rowB].map((t, i) => (
              <TestimonialCard key={`b-${t.name}-${i}`} t={t} />
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
