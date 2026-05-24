"use client";

import Link from "next/link";
import { BarChart3, Globe, MessageCircle, Briefcase, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">TradingLens</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered forex intelligence platform. Analyze, learn, and trade with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/lens/trading" className="hover:text-foreground transition-colors">Trading Lens</Link></li>
              <li><Link href="/lens/chart" className="hover:text-foreground transition-colors">Chart Lens</Link></li>
              <li><Link href="/lens/edu" className="hover:text-foreground transition-colors">Edu Lens</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Connect</h3>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Briefcase className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p> {new Date().getFullYear()} TradingLens AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
