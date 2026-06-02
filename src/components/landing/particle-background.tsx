"use client";

import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationId: number;
    let particles: Particle[] = [];
    let isVisible = true;

    function getMaxParticles() {
      const isMobile = window.innerWidth < 768;
      return isMobile ? 50 : 90;
    }

    let cachedWidth = window.innerWidth;

    function resize() {
      if (!canvas) return;
      cachedWidth = window.innerWidth;
      canvas.width = cachedWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      const maxCount = getMaxParticles();
      const count = Math.min(
        Math.floor((canvas!.width * canvas!.height) / 20000),
        maxCount
      );
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3 - 0.1,
          opacity: Math.random() * 0.6 + 0.1,
          pulseSpeed: Math.random() * 0.02 + 0.005,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw() {
      if (!ctx || !canvas || !isVisible || prefersReduced) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulsePhase += p.pulseSpeed;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
        const currentOpacity = p.opacity * pulse;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 0, ${currentOpacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3 * pulse, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.size * 3 * pulse
        );
        gradient.addColorStop(0, `rgba(255, 140, 0, ${currentOpacity * 0.4})`);
        gradient.addColorStop(1, "rgba(255, 140, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw connections (only on desktop for performance)
      if (cachedWidth >= 768) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              const opacity = (1 - dist / 120) * 0.08;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(255, 107, 0, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        isVisible = false;
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        isVisible = true;
        draw();
      }
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    if (!prefersReduced) {
      draw();
    }

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="presentation"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
