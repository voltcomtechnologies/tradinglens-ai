"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const faqs = [
  {
    q: "Is TradingLens AI beginner-friendly?",
    a: "Absolutely. EduLens was built around the real questions beginners ask — not reverse-engineered from a finance textbook. You get structured, step-by-step lessons from market fundamentals to advanced strategy, while TraderLens explains every analysis in plain language.",
  },
  {
    q: "Does the AI give entry and exit points?",
    a: "Yes — with full transparency. TraderLens doesn't just output a buy or sell signal and expect you to act on faith. It shows you the reasoning: the technical patterns it identified, the timeframes it analysed, and the risk levels it factored in.",
  },
  {
    q: "Do you cover forex, crypto and stocks?",
    a: "TraderLens simplifies trading, forex analysis, and stock market insights with real-time AI-powered chart breakdowns. ChartLens streams live analysis across 16 major currency pairs and metals, 24/7.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. All challenge fees are fully refundable once you complete the track successfully. Subscription plans start with a 7-day free trial — no credit card required — and you can cancel anytime.",
  },
  {
    q: "Is customer support available?",
    a: "Our team of trading experts is available 24/7 through live chat, email at info@tradinglensai.com, or WhatsApp. Business hours line: Mon–Fri, 9am–5pm.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary/[0.05] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14">
          {/* Left: heading + contact card */}
          <div>
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <MessageCircle className="h-3.5 w-3.5" />
                FAQ&apos;s
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
                Common queries &{" "}
                <span className="gradient-text glow-text-subtle">solutions</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-md">
                Can&apos;t find what you&apos;re looking for? Let&apos;s chat —
                drop us a line and our experts will get back to you.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-7 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/15 blur-3xl rounded-full" />
                <h3 className="font-display font-semibold text-lg mb-1">
                  Get in Touch
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Let&apos;s chat, drop us a line!
                </p>
                <ul className="space-y-3.5 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/25">
                      <Phone className="h-4 w-4 text-primary" />
                    </span>
                    <a
                      href="tel:+2347055555676"
                      className="hover:text-primary transition-colors"
                    >
                      +234 705 555 5676
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/25">
                      <Mail className="h-4 w-4 text-primary" />
                    </span>
                    <a
                      href="mailto:info@tradinglensai.com"
                      className="hover:text-primary transition-colors"
                    >
                      info@tradinglensai.com
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/25">
                      <MapPin className="h-4 w-4 text-primary" />
                    </span>
                    <span className="text-muted-foreground">
                      Plot 8, Port Elizabeth Street, Off Nairobi Street, Wuse II,
                      Abuja, Nigeria
                    </span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: accordion */}
          <ScrollReveal delay={0.1} className="space-y-3.5">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={faq.q}
                  className={`rounded-2xl border transition-colors overflow-hidden ${
                    isOpen
                      ? "border-primary/40 bg-primary/[0.04]"
                      : "border-border/60 bg-card/40 hover:border-primary/25"
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-sm sm:text-base">
                      {faq.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isOpen
                          ? "bg-primary border-primary text-white"
                          : "border-border/80 text-muted-foreground"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
