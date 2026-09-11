"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import {
  ChartCandlestick,
  BookOpen,
  Brain,
  Menu,
  X,
  Shield,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

const navLinks = [
  { href: "/", label: "Home", icon: Zap },
  { href: "/lens/trading", label: "Trading Lens", icon: Brain },
  { href: "/lens/chart", label: "Chart Lens", icon: ChartCandlestick },
  { href: "/lens/edu", label: "Edu Lens", icon: BookOpen },
];

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !mobileButtonRef.current?.contains(target)
      ) {
        setMobileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const wasUserOpen = userMenuOpen;
        const wasMobileOpen = mobileOpen;
        setUserMenuOpen(false);
        setMobileOpen(false);
        // Return focus to trigger buttons
        if (wasUserOpen) {
          userMenuButtonRef.current?.focus();
        } else if (wasMobileOpen) {
          mobileButtonRef.current?.focus();
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setUserMenuOpen, setMobileOpen]);

  useEffect(() => {
    let rafId: number;
    let lastScrolled = false;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const current = window.scrollY > 20;
        if (current !== lastScrolled) {
          lastScrolled = current;
          setScrolled(current);
        }
        rafId = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="absolute top-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-primary via-accent to-primary z-[2]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex h-16 mt-3 items-center justify-between rounded-2xl px-4 transition-all duration-500",
            scrolled
              ? "glass-strong border border-primary/20 shadow-xl shadow-black/40"
              : "border border-transparent"
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.png"
              alt="TradingLens AI"
              className="h-9 w-auto object-contain logo-enhance transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3.5 py-2 text-sm font-medium rounded-xl transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/25 pointer-events-none" />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.[0] || user.email?.[0] || "U"}
                  </div>
                  <span className="text-sm font-medium">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/50"
                    >
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/dashboard/admin"
                          role="menuitem"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 transition-colors text-primary"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <div className="my-1 h-px bg-border" />
                      <form action="/api/auth/signout" method="POST">
                        <button
                          type="submit"
                          role="menuitem"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="group relative overflow-hidden px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground transition-all glow-orange hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="relative z-10">Get Started</span>
                  <span className="absolute inset-y-0 w-1/2 bg-white/25 blur-md animate-shine" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            ref={mobileButtonRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden p-2.5 rounded-xl border border-border/60 bg-card/60 hover:border-primary/40 transition-colors"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden mx-4 mt-2 rounded-2xl border border-primary/20 glass-strong shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {user ? (
                <>
                  <div className="h-px bg-border my-2" />
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-white/5"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-primary hover:bg-white/5"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="h-px bg-border my-2" />
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-white/5"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground glow-orange"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
