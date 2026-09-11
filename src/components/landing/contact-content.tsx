"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone,
  MessagesSquare,
  Mail,
  MapPin,
  Clock,
  Send,
  CircleCheck,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

/* ---------------- Hero ---------------- */
export function ContactHero() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-grid mask-fade-y opacity-60" />
      <div className="absolute -top-32 left-1/3 w-[600px] h-[450px] bg-primary/10 blur-[140px] rounded-full animate-aurora pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal className="mb-6">
          <nav className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Contact Us</span>
          </nav>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h1 className="font-display text-4xl sm:text-6xl font-bold mb-5 tracking-tight">
            Get in{" "}
            <span className="gradient-text glow-text-subtle">Touch</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Give us a call, chat with an expert, or drop us a line — our team
            of trading specialists is standing by.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ---------------- Channels ---------------- */
const channels = [
  {
    icon: Phone,
    title: "Give Us a Call",
    value: "+234 905-555-5676",
    href: "tel:+2349055555676",
    accent: "text-primary",
    bg: "bg-primary/10 border-primary/30",
  },
  {
    icon: MessagesSquare,
    title: "Chat with an Expert",
    value: "Live chat with our technical specialists.",
    href: "#message",
    accent: "text-bullish",
    bg: "bg-bullish/10 border-bullish/30",
  },
  {
    icon: Mail,
    title: "Quick Contact",
    value: "info@tradinglensai.com",
    href: "mailto:info@tradinglensai.com",
    accent: "text-accent",
    bg: "bg-accent/10 border-accent/30",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "Mon – Friday : 9 am to 5 pm",
    href: undefined,
    accent: "text-chart-5",
    bg: "bg-chart-5/10 border-chart-5/30",
  },
];

export function ContactChannels() {
  return (
    <section className="relative py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {channels.map((ch, i) => {
            const Wrapper = ch.href ? "a" : "div";
            return (
              <ScrollReveal key={ch.title} delay={i * 0.08}>
                <motion.div whileHover={{ y: -6 }} className="h-full">
                  <Wrapper
                    {...(ch.href
                      ? { href: ch.href, "aria-label": ch.title }
                      : {})}
                    className="block h-full rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-7 hover:border-primary/30 transition-colors"
                  >
                    <div
                      className={`inline-flex p-3 rounded-2xl border mb-5 ${ch.bg}`}
                    >
                      <ch.icon className={`h-5 w-5 ${ch.accent}`} />
                    </div>
                    <h3 className="font-display font-semibold mb-1.5">
                      {ch.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{ch.value}</p>
                  </Wrapper>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Form + info ---------------- */
export function ContactFormSection() {
  const [sent, setSent] = useState(false);

  return (
    <section id="message" className="relative py-24 overflow-hidden">
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-primary/[0.05] blur-[130px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
          {/* Form */}
          <ScrollReveal>
            <div className="relative rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-8 sm:p-10 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-3xl rounded-full" />
              <div className="relative">
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                  Drop a line, stay in touch
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Please do not hesitate to contact us by sending a message.
                </p>

                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-14"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bullish/15 border border-bullish/40 mb-5">
                      <CircleCheck className="h-8 w-8 text-bullish" />
                    </span>
                    <h3 className="font-display text-xl font-bold mb-2">
                      Message sent!
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thanks for reaching out. Our team will get back to you
                      within one business day.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-6 text-sm text-primary hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium mb-2"
                        >
                          Full Name
                        </label>
                        <input
                          id="name"
                          required
                          placeholder="John Doe"
                          className="w-full h-12 px-4 rounded-xl bg-background/60 border border-border/70 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          placeholder="john@example.com"
                          className="w-full h-12 px-4 rounded-xl bg-background/60 border border-border/70 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium mb-2"
                      >
                        Subject
                      </label>
                      <input
                        id="subject"
                        required
                        placeholder="How can we help?"
                        className="w-full h-12 px-4 rounded-xl bg-background/60 border border-border/70 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium mb-2"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        placeholder="Tell us about your trading goals..."
                        className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/70 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-semibold transition-all hover:scale-[1.02] glow-orange hover:bg-accent hover:text-accent-foreground"
                    >
                      Send Message
                      <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* WhatsApp + address */}
          <ScrollReveal delay={0.12} className="space-y-6">
            <div className="relative rounded-3xl border border-bullish/25 bg-gradient-to-br from-bullish/[0.08] to-card/60 p-8 overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-bullish/15 blur-3xl rounded-full animate-glow-pulse" />
              <div className="relative">
                <div className="inline-flex p-3 rounded-2xl bg-bullish/15 border border-bullish/35 mb-5">
                  <MessagesSquare className="h-6 w-6 text-bullish" />
                </div>
                <h3 className="font-display text-xl font-bold mb-1.5">
                  WhatsApp
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Fastest response — chat with us directly on WhatsApp during
                  business hours.
                </p>
                <a
                  href="https://wa.me/2349055555676"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-bullish text-white font-semibold text-sm transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-bullish/25"
                >
                  Send Message
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-8">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/30 mb-5">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-1.5">
                Say Hi &amp; Hello
              </h3>
              <p className="text-sm text-muted-foreground">
                Plot 8, Port Elizabeth Street, Off Nairobi Street, Wuse II,
                Abuja, Nigeria
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
