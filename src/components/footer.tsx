"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone, Send } from "lucide-react";
import { MessageCircle, Globe, Briefcase } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-card/20 overflow-hidden">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/[0.07] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr] gap-12">
          {/* Brand + newsletter */}
          <div>
            <Link href="/" className="inline-block mb-5">
              <img
                src="/logo.png"
                alt="TradingLens AI"
                className="h-10 w-auto object-contain logo-enhance"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm">
              AI-powered market analysis, live expert chart sessions, and
              structured trading education — so you stop guessing and start
              trading with clarity.
            </p>

            <form
              className="flex max-w-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-background/60 border border-border/70 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
              </div>
              <button
                type="submit"
                aria-label="Subscribe"
                className="ml-2 h-11 px-4 rounded-xl bg-primary text-white font-medium text-sm inline-flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors glow-orange"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">
              Platform
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: "/lens/trading", label: "Trading Lens" },
                { href: "/lens/chart", label: "Chart Lens" },
                { href: "/lens/edu", label: "Edu Lens" },
                { href: "/#pricing", label: "Pricing" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">
              Company
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/#faq", label: "FAQs" },
                { href: "/auth/signup", label: "Get Started" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + socials */}
          <div>
            <h3 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">
              Connect
            </h3>
            <ul className="space-y-3.5 text-sm text-muted-foreground mb-6">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a href="tel:+2347055555676" className="hover:text-primary transition-colors">
                  +234 705 555 5676
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a
                  href="mailto:info@tradinglensai.com"
                  className="hover:text-primary transition-colors"
                >
                  info@tradinglensai.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Plot 8, Port Elizabeth Street, Off Nairobi Street, Wuse II,
                  Abuja, Nigeria
                </span>
              </li>
            </ul>
            <div className="flex gap-3">
              {[
                { icon: MessageCircle, label: "Discord Community" },
                { icon: Globe, label: "Website" },
                { icon: Briefcase, label: "LinkedIn" },
                { icon: Mail, label: "Email" },
              ].map((item) => (
                <a
                  key={item.label}
                  href="#"
                  aria-label={item.label}
                  className="p-2.5 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/40 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5"
                >
                  <item.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} TradingLens AI. All rights
            reserved.
          </p>
          <p className="flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-bullish animate-pulse" />
            Powered by Global Gate Management — 15+ years of trading expertise
          </p>
        </div>
      </div>
    </footer>
  );
}
