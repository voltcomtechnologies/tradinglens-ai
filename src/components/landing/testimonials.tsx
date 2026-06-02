"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const testimonials = [
  {
    name: "James Okafor",
    role: "Day Trader, Lagos",
    content:
      "TradingLens completely changed how I approach the markets. The AI analysis is incredibly accurate and has improved my win rate by 40%.",
    rating: 5,
  },
  {
    name: "Sarah Kimani",
    role: "Swing Trader, Nairobi",
    content:
      "The Chart Lens feature is like having a Bloomberg terminal. I wake up to fresh analysis every morning. Worth every penny.",
    rating: 5,
  },
  {
    name: "Michael Adeyemi",
    role: "Forex Educator, Accra",
    content:
      "Edu Lens transformed how I teach my students. The AI tutor adapts to each learner's pace. My students love it.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-border/50 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Quote className="h-3.5 w-3.5" />
            Testimonials
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight">
            Trusted by{" "}
            <span className="gradient-text glow-text-subtle">Traders</span>{" "}
            Worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join thousands of traders who have elevated their trading with AI
            intelligence
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-7 overflow-hidden hover:border-primary/30 transition-colors"
              >
                {/* Quote icon background */}
                <Quote className="absolute top-4 right-4 h-10 w-10 text-primary/10 group-hover:text-primary/20 transition-colors" />

                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-sm mb-6 leading-relaxed text-foreground/90">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.role}
                    </div>
                  </div>
                </div>

                {/* Bottom glow line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

