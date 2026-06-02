"use client";

import Link from "next/link";
import {
  Globe,
  MessageCircle,
  Briefcase,
  Mail,
  ArrowUpRight,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-card/30 backdrop-blur-sm">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="TradingLens AI"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered forex intelligence platform. Analyze, learn, and trade
              with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/80">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                { href: "/lens/trading", label: "Trading Lens" },
                { href: "/lens/chart", label: "Chart Lens" },
                { href: "/lens/edu", label: "Edu Lens" },
                { href: "/pricing", label: "Pricing" },
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

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/80">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
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

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/80">
              Connect
            </h3>
            <div className="flex gap-3">
              {[
                { icon: MessageCircle, label: "Community" },
                { icon: Globe, label: "Website" },
                { icon: Briefcase, label: "LinkedIn" },
                { icon: Mail, label: "Email" },
              ].map((item) => (
                <a
                  key={item.label}
                  href="#"
                  className="p-2.5 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                  aria-label={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} TradingLens AI. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

