"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "James Okafor",
    role: "Day Trader, Lagos",
    content: "TradingLens completely changed how I approach the markets. The AI analysis is incredibly accurate and has improved my win rate by 40%.",
    rating: 5,
  },
  {
    name: "Sarah Kimani",
    role: "Swing Trader, Nairobi",
    content: "The Chart Lens feature is like having a Bloomberg terminal. I wake up to fresh analysis every morning. Worth every penny.",
    rating: 5,
  },
  {
    name: "Michael Adeyemi",
    role: "Forex Educator, Accra",
    content: "Edu Lens transformed how I teach my students. The AI tutor adapts to each learner's pace. My students love it.",
    rating: 5,
  },
];

export function Testimonials() {
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
            Trusted by <span className="gradient-text">Traders</span> Worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of traders who have elevated their trading with AI intelligence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm mb-4 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
