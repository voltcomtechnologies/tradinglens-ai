"use client";

import { useRef, useEffect, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  scale?: number;
  rotate?: number;
  stagger?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  y = 40,
  x = 0,
  scale = 1,
  rotate = 0,
  stagger = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 });
      gsap.set(el.children, { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 });
      return;
    }

    const targets = stagger > 0 ? el.children : el;

    const tween = gsap.fromTo(
      targets,
      { opacity: 0, y, x, scale, rotate },
      {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        rotate: 0,
        duration,
        delay,
        stagger: stagger > 0 ? stagger : 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );

    return () => {
      tween.kill();
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
    };
  }, [delay, duration, y, x, scale, rotate, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
