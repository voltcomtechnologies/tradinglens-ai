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
  ArrowUpRight,
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
  { href: "/", label: "Home" },
  { href: "/lens/trading", label: "TraderLens", icon: Brain },
  { href: "/lens/chart", label: "ChartLens", icon: ChartCandlestick },
  { href: "/lens/edu", label: "EduLens", icon: BookOpen },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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
        const wasUser = userMenuOpen;
        const wasMobile = mobileOpen;
        setUserMenuOpen(false);
        setMobileOpen(false);
        if (wasUser) userMenuButtonRef.current?.focus();
        else if (wasMobile) mobileButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, userMenuOpen]);

  useEffect(() => {
    let raf = 0;
    let last = false;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const cur = window.scrollY > 16;
        if (cur !== last) {
          last = cur;
          setScrolled(cur);
        }
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <motion.div
        style={{ scaleX: progress }}
        className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
      />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div
          className={cn(
            "mt-3 flex h-[58px] items-center justify-between gap-4 rounded-full border px-2 py-2 pl-4 pr-2 transition-all duration-500",
            scrolled
              ? "glass-strong border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(242,193,78,0.08)]"
              : "border-white/[0.07] bg-[#050a18]/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          )}
        >
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="TradingLens AI"
              className="h-[30px] w-auto object-contain logo-enhance"
            />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-[13px] font-bold tracking-tight text-white">
                TRADINGLENS<span className="font-light text-primary"> AI</span>
              </span>
              <span className="text-[9px] tracking-[0.22em] text-white/45 font-medium -mt-0.5">
                INSTITUTIONAL CLARITY
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 rounded-full bg-white/[0.03] p-1 border border-white/[0.04]">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href + "/"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(242,193,78,0.35)]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {/* @ts-ignore */}
                    {link.icon ? <link.icon className="h-3.5 w-3.5" /> : null}
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="User menu"
                  className="flex items-center gap-2.5 rounded-full bg-white/[0.06] border border-white/10 pl-1 pr-3 py-1 hover:bg-white/[0.08] transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-[#d4a017] flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </div>
                  <span className="text-[13px] font-medium text-white max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-white/40 transition-transform",
                      userMenuOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-[#0b1428] p-1.5 shadow-2xl shadow-black/60"
                    >
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/dashboard/admin"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Shield className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4 text-white/40" /> Profile
                      </Link>
                      <div className="my-1 h-px bg-white/10" />
                      <form action="/api/auth/signout" method="POST">
                        <button
                          type="submit"
                          role="menuitem"
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="rounded-full px-5 py-2.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="group relative overflow-hidden rounded-full bg-primary px-6 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(242,193,78,0.35)] hover:shadow-[0_12px_28px_rgba(242,193,78,0.45)] hover:scale-[1.02] transition-all flex items-center gap-1.5"
                >
                  Start Free
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span className="absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-12deg] group-hover:translate-x-[120%] transition-transform duration-700" />
                </Link>
              </>
            )}
          </div>

          <button
            ref={mobileButtonRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="lg:hidden mx-3 mt-3 rounded-[24px] border border-white/10 bg-[#080f22]/90 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      {/* @ts-ignore */}
                      {link.icon ? <link.icon className="h-4 w-4" /> : null}
                      {link.label}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-40" />
                  </Link>
                </motion.div>
              ))}
              <div className="h-px bg-white/10 my-2" />
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-sm text-white/70 hover:bg-white/[0.06]"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3.5 text-sm text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-1">
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
                  >
                    Start Free <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
