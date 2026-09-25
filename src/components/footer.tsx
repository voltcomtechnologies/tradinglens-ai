"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#050a18]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute -bottom-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-[90px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_0.85fr_0.85fr_1.1fr] gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <img src="/logo.png" alt="TradingLens AI" className="h-9 w-auto object-contain logo-enhance" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[13px] font-bold tracking-tight text-white">
                  TRADINGLENS<span className="font-light text-primary"> AI</span>
                </span>
                <span className="text-[9px] tracking-[0.22em] text-white/40 font-medium -mt-0.5">INSTITUTIONAL CLARITY</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-white/50 max-w-sm">
              AI-powered market analysis, live expert chart sessions, and structured trading education — so you stop guessing and start trading with clarity.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) return;
                setSent(true);
                setTimeout(() => setSent(false), 3000);
                setEmail("");
              }}
              className="mt-6 flex max-w-sm gap-2"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button type="submit" aria-label="Subscribe" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-white hover:text-[#050a18] transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </form>
            {sent && <p className="mt-2 text-xs text-emerald-300">You’re on the list — welcome aboard.</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> No spam. Unsubscribe anytime.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase">Platform</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { href: "/lens/trading", label: "TraderLens — AI co-pilot" },
                { href: "/dashboard/charts", label: "ChartLens — Live charts" },
                { href: "/dashboard/learn", label: "EduLens — Education" },
                { href: "/#pricing", label: "Pricing" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group inline-flex items-center gap-1 text-white/60 hover:text-primary transition-colors">
                    {l.label} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase">Company</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { href: "/about", label: "About Company" },
                { href: "/contact", label: "Contact Us" },
                { href: "/#faq", label: "FAQs" },
                { href: "/auth/signup", label: "Get Started Free" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group inline-flex items-center gap-1 text-white/60 hover:text-primary transition-colors">
                    {l.label} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase">Connect</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-white/60">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                <a href="tel:+2347055555676" className="hover:text-primary transition-colors">
                  +234 705 555 5676
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-white/60">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                <a href="mailto:info@tradinglensai.com" className="hover:text-primary transition-colors">
                  info@tradinglensai.com
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-white/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="leading-6 text-sm">Plot 8, Port Elizabeth Street, Off Nairobi Street, Wuse II, Abuja, Nigeria</span>
              </li>
            </ul>
            <div className="mt-6 flex gap-2">
              {[
                { label: "Discord", href: "https://discord.gg/tradinglensai" },
                { label: "X", href: "#" },
                { label: "LinkedIn", href: "#" },
                { label: "Email", href: "mailto:info@tradinglensai.com" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-bold"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-xs text-white/35">
          <p>© {new Date().getFullYear()} TradingLens AI. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Powered by Global Gate Management — 15+ years of trading expertise • AI insights are educational, never financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
