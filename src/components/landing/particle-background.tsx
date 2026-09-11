"use client";

import { useEffect, useMemo, useRef } from "react";

/* ==================================================================== *
 *  HeroParticleField — interactive canvas background for the hero
 * ==================================================================== *
 *
 *  What it renders, back to front:
 *    1. A mesh-gradient "aura" (three soft radial gradients, animated)  ← DOM
 *    2. Floating geometry: glowing dots, translucent rings, hollow
 *       polygons (+ optional connecting constellation lines)            ← canvas
 *    3. Twinkling sparkles on a random subset of nodes / links
 *    4. Click shockwaves: an expanding ring that shoves nodes outward
 *       as its front sweeps past them
 *
 *  Behaviour:
 *    • Every node drifts slowly and floats on its own sine wave.
 *    • A spring pulls each node back to its float path, so cursor
 *      repulsion / attraction always resolves smoothly into natural drift.
 *    • Depth of field: background nodes are smaller, slower, dimmer and
 *      rendered as a soft defocused halo; foreground nodes are crisp.
 *    • A click (or tap) drops a shockwave that expands from that point
 *      and pushes the field outward, then decays into the normal drift.
 *
 *  ── TUNING CHEAT-SHEET ──────────────────────────────────────────────
 *    Density ......... HERO_PARTICLE_CONFIG.density  (per-breakpoint node caps
 *                      + `pxPerNode`, the screen area each node may occupy)
 *    Colours ......... HERO_PARTICLE_CONFIG.colors   (keep in sync with
 *                      --primary / --accent / --chart-5 in globals.css)
 *    Mesh aura ....... AURA_GRADIENT (below) + auraOpacity
 *    Motion speed .... speed (global multiplier: 0.4 calm → 2 lively),
 *                      radius, mouse.strength, return.spring
 *    Cursor feel ..... mouse.radius (reach) + mouse.strength (push force)
 *    Click ripple .... shockwave.{enabled,strength,speed,width,maxRadius,
 *                      maxWaves}
 *    Constellation ... links.distance (0 disables lines) + links.opacity
 *
 *  Pass a partial config to override anything, e.g.
 *    <ParticleBackground config={{ density: { desktop: 60 }, speed: 0.6 }} />
 *  Config is read once when the field mounts.
 * ==================================================================== */

const TAU = Math.PI * 2;
/** Fixed physics timestep (seconds) — keeps motion identical at 60/120/144Hz. */
const STEP = 1 / 60;
/** Hard cap on node velocity in px/frame so a fast cursor can't fling nodes. */
const MAX_VELOCITY = 12;
/** Canvas backing-store cap. 1.5 is visually indistinguishable from 3x on
 *  these soft shapes but roughly halves fill cost on retina phones. */
const MAX_DPR = 1.5;
/** Below this width we drop constellation lines + soften quality. */
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1280;

type ParticleKind = "dot" | "ring" | "polygon";

export interface HeroParticleConfig {
  /** Node caps per breakpoint + how much screen area a single node owns. */
  density: { desktop: number; tablet: number; mobile: number; pxPerNode: number };
  /** Smallest (far) / largest (near) node radius, in CSS px. */
  radius: { min: number; max: number };
  /** Global motion multiplier. 0.4 = calm, 1 = default, 2 = lively. */
  speed: number;
  /** Cursor interaction: reach in px, push force, and aura opacity (0 disables). */
  mouse: { radius: number; strength: number; aura: number };
  /** Return spring stiffness + per-frame velocity damping. */
  return: { spring: number; damping: number };
  /**
   * Click shockwave: an expanding ring that shoves nodes outward.
   *   strength  – outward impulse handed to a node on the wavefront
   *   speed     – ring expansion in px/s
   *   width     – thickness of the band that actually pushes nodes (px)
   *   maxRadius – ring is discarded here (also shortens on small screens)
   *   maxWaves  – concurrent wave cap; the oldest is dropped past this
   */
  shockwave: {
    enabled: boolean;
    strength: number;
    speed: number;
    width: number;
    maxRadius: number;
    maxWaves: number;
  };
  /** Constellation lines: max length in px (0 = off) and base opacity. */
  links: { distance: number; opacity: number };
  /** Palette. Matches the theme's orange/amber/violet accents. */
  colors: { primary: string; accent: string; violet: string };
  /** 0–1 chance a mid/near node twinkles. */
  sparkleChance: number;
  /** Opacity of the mesh-gradient aura layer. */
  auraOpacity: number;
  /** Honour `prefers-reduced-motion` by rendering one static frame. */
  respectReducedMotion: boolean;
}

export const HERO_PARTICLE_CONFIG: HeroParticleConfig = {
  density: { desktop: 92, tablet: 62, mobile: 34, pxPerNode: 13000 },
  radius: { min: 0.9, max: 3.2 },
  speed: 1,
  mouse: { radius: 150, strength: 0.26, aura: 0.1 },
  return: { spring: 0.024, damping: 0.93 },
  shockwave: {
    enabled: true,
    strength: 0.9,
    speed: 760,
    width: 74,
    maxRadius: 620,
    maxWaves: 4,
  },
  links: { distance: 118, opacity: 0.17 },
  colors: { primary: "#ff6b00", accent: "#ffb020", violet: "#8b5cf6" },
  sparkleChance: 0.24,
  auraOpacity: 0.5,
  respectReducedMotion: true,
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };
export type HeroParticleOverrides = DeepPartial<HeroParticleConfig>;

/** The shifting mesh gradient sitting behind the particles. Edit the stops
 *  (colour + size + position) to re-skin the whole hero backdrop. */
const AURA_GRADIENT = [
  "radial-gradient(42% 42% at 20% 16%, rgba(255,107,0,0.34) 0%, rgba(255,107,0,0) 64%)",
  "radial-gradient(38% 38% at 80% 28%, rgba(255,176,32,0.22) 0%, rgba(255,176,32,0) 66%)",
  "radial-gradient(48% 48% at 52% 98%, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0) 62%)",
].join(", ");

interface Particle {
  /** Current position (CSS px). */
  x: number;
  y: number;
  /** Anchor the sine float orbits around; drifts slowly across the hero. */
  ox: number;
  oy: number;
  /** Velocity in px per 1/60s frame. */
  vx: number;
  vy: number;
  /** 0 = far/background … 1 = near/foreground. Drives size, speed, opacity. */
  depth: number;
  kind: ParticleKind;
  radius: number;
  colorIndex: number;
  /** Polygon only. */
  sides: number;
  rotation: number;
  spin: number;
  /** Sine float: amplitude (px) and angular frequency (rad/s). */
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  phaseX: number;
  phaseY: number;
  /** Slow linear drift of the anchor, px/s. */
  driftX: number;
  driftY: number;
  alpha: number;
  /** Cursor affinity: negative = repelled, positive = attracted, 0 = ignores. */
  affinity: number;
  /** Twinkle rate in rad/s (0 = no sparkle). */
  twinkleRate: number;
  twinklePhase: number;
}

/** One expanding click ripple. */
interface Shockwave {
  x: number;
  y: number;
  /** Current front radius in CSS px. */
  radius: number;
  /** Expansion speed in px/s (the global speed multiplier is applied via dt). */
  speed: number;
  /** Impulse handed to each node the front passes. */
  strength: number;
  /** Radius at which the wave fades out and is discarded. */
  maxRadius: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [255, 107, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Pre-render a soft radial glow to an offscreen canvas.
 * Drawing a sprite with `drawImage` is far cheaper than building a
 * `createRadialGradient` per particle per frame, which is the usual
 * reason particle fields drop frames on mobile.
 */
function makeGlowSprite(rgb: [number, number, number], size = 128) {
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const g = sprite.getContext("2d");
  if (!g) return sprite;
  const [r, gr, b] = rgb;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${gr},${b},0.95)`);
  grad.addColorStop(0.22, `rgba(${r},${gr},${b},0.34)`);
  grad.addColorStop(0.55, `rgba(${r},${gr},${b},0.08)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return sprite;
}

function resolveConfig(overrides?: HeroParticleOverrides): HeroParticleConfig {
  return {
    ...HERO_PARTICLE_CONFIG,
    ...overrides,
    density: { ...HERO_PARTICLE_CONFIG.density, ...overrides?.density },
    radius: { ...HERO_PARTICLE_CONFIG.radius, ...overrides?.radius },
    mouse: { ...HERO_PARTICLE_CONFIG.mouse, ...overrides?.mouse },
    return: { ...HERO_PARTICLE_CONFIG.return, ...overrides?.return },
    shockwave: { ...HERO_PARTICLE_CONFIG.shockwave, ...overrides?.shockwave },
    links: { ...HERO_PARTICLE_CONFIG.links, ...overrides?.links },
    colors: { ...HERO_PARTICLE_CONFIG.colors, ...overrides?.colors },
  };
}

/** Node budget: capped per breakpoint *and* by how much screen it covers. */
function nodeBudget(w: number, h: number, cfg: HeroParticleConfig) {
  const cap =
    w < MOBILE_BREAKPOINT
      ? cfg.density.mobile
      : w < TABLET_BREAKPOINT
        ? cfg.density.tablet
        : cfg.density.desktop;
  const byArea = Math.round((w * h) / cfg.density.pxPerNode);
  return Math.max(12, Math.min(cap, byArea));
}

export function ParticleBackground({ config }: { config?: HeroParticleOverrides }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const resolved = useMemo(() => resolveConfig(config), [config]);
  // Motion params are read once when the field mounts; the ref gives the
  // effect a stable handle without re-creating the whole simulation.
  const cfgRef = useRef(resolved);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctxMaybe = canvasEl.getContext("2d", { alpha: true });
    if (!ctxMaybe) return;
    // Explicitly non-nullable: the helpers below are hoisted function
    // declarations, so TS drops the narrowing from the guards above.
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctxMaybe;

    const cfg = cfgRef.current;
    // ── Colours ──────────────────────────────────────────────────────────
    const palette = [cfg.colors.primary, cfg.colors.accent, cfg.colors.violet];
    const sprites = [
      makeGlowSprite(hexToRgb(cfg.colors.primary)),
      makeGlowSprite(hexToRgb(cfg.colors.accent)),
      makeGlowSprite(hexToRgb(cfg.colors.violet)),
    ];

    // ── Environment state ────────────────────────────────────────────────
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = cfg.respectReducedMotion && motionQuery.matches;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    let width = 0;
    let height = 0;
    let nodes: Particle[] = [];
    let waves: Shockwave[] = [];
    let linksEnabled = cfg.links.distance > 0 && cfg.links.opacity > 0;
    let simTime = 0;

    let rafId = 0;
    let lastFrame = 0;
    let accumulator = 0;
    let frameCount = 0;
    let frameCost = 0;

    let pointerVisible = false;
    let intersecting = true;
    let tabVisible = true;

    const pointer = { x: 0, y: 0 };
    const aura = { x: 0, y: 0, writtenX: "", writtenY: "" };

    function createParticle(w: number, h: number): Particle {
      // Bias slightly toward the mid field so the framing reads as depth
      // rather than a flat starfield.
      const depth = Math.pow(Math.random(), 0.85);
      const roll = Math.random();
      const kind: ParticleKind = roll < 0.56 ? "dot" : roll < 0.8 ? "ring" : "polygon";
      const x = Math.random() * w;
      const y = Math.random() * h;

      // Colour mix: mostly primary, a quarter amber, the rest violet.
      const colour = Math.random();
      const colorIndex = colour < 0.6 ? 0 : colour < 0.86 ? 1 : 2;

      // Deeper nodes drift + float slower and less far (see render() for the
      // matching size/opacity falloff) — this is the depth-of-field model.
      const driftScale = (1.5 + depth * 6) * cfg.speed;

      // ~a third gravitate toward the cursor, the rest are pushed away.
      const affinityRoll = Math.random();

      return {
        x,
        y,
        ox: x,
        oy: y,
        vx: 0,
        vy: 0,
        depth,
        kind,
        radius:
          (cfg.radius.min + (cfg.radius.max - cfg.radius.min) * depth) *
          (0.8 + Math.random() * 0.45),
        colorIndex,
        sides: 3 + Math.floor(Math.random() * 3),
        rotation: Math.random() * TAU,
        spin: (Math.random() - 0.5) * 0.5 * (0.3 + depth),
        ampX: 6 + depth * 26,
        ampY: 6 + depth * 22,
        freqX: 0.22 + Math.random() * 0.42 + depth * 0.18,
        freqY: 0.2 + Math.random() * 0.38 + depth * 0.16,
        phaseX: Math.random() * TAU,
        phaseY: Math.random() * TAU,
        driftX: (Math.random() - 0.5) * driftScale * 0.7,
        // Slight upward bias so the field reads as "rising".
        driftY: -(0.4 + Math.random() * 1.1) * driftScale * 0.45,
        alpha: 0.3 + Math.random() * 0.45,
        affinity:
          affinityRoll < 0.62
            ? -(0.5 + Math.random() * 0.5)
            : affinityRoll < 0.87
              ? 0.35 + Math.random() * 0.45
              : 0,
        // Only mid/near nodes sparkle — a blurred backdrop node twinkling
        // would break the depth illusion.
        twinkleRate:
          depth > 0.35 && Math.random() < cfg.sparkleChance
            ? 1.4 + Math.random() * 3.2
            : 0,
        twinklePhase: Math.random() * TAU,
      };
    }

    function buildNodes() {
      const count = nodeBudget(width, height, cfg);
      const next: Particle[] = [];
      for (let i = 0; i < count; i++) next.push(createParticle(width, height));
      // Sort once (depth never changes) so render() paints far → near.
      next.sort((a, b) => a.depth - b.depth);
      nodes = next;
      if (reduced) settle();
    }

    /** Advance the simulation 24 fixed steps so a still frame looks composed. */
    function settle() {
      for (let i = 0; i < 24; i++) step();
    }

    /** Drop a ripple at a point in canvas space (CSS px, origin top-left). */
    function spawnWave(x: number, y: number) {
      if (!cfg.shockwave.enabled || reduced) return;
      // Keep the cap so rapid clicking can't stack up unbounded work.
      if (waves.length >= cfg.shockwave.maxWaves) waves.shift();
      waves.push({
        x,
        y,
        radius: 0,
        speed: cfg.shockwave.speed,
        strength: cfg.shockwave.strength,
        // Shorten the ripple on small screens so it fades before it has to
        // travel absurdly far relative to the visible field.
        maxRadius: Math.min(
          cfg.shockwave.maxRadius,
          Math.max(width, height) * 0.85
        ),
      });
    }

    function step() {
      const interacting = pointerVisible && !reduced;
      const { radius: reach, strength } = cfg.mouse;
      const reach2 = reach * reach;
      const { spring, damping } = cfg.return;
      const dt = STEP * cfg.speed;
      const margin = 40;
      const halfBand = cfg.shockwave.width / 2;

      // Shockwave fronts advance once per fixed step; spent waves are dropped.
      if (waves.length > 0) {
        for (const w of waves) w.radius += w.speed * dt;
        waves = waves.filter((w) => w.radius < w.maxRadius);
      }

      for (const n of nodes) {
        // 1 · slow drift of the float anchor, wrapping at the edges
        n.ox += n.driftX * dt;
        n.oy += n.driftY * dt;
        if (n.ox < -margin) n.ox = width + margin;
        else if (n.ox > width + margin) n.ox = -margin;
        if (n.oy < -margin) n.oy = height + margin;
        else if (n.oy > height + margin) n.oy = -margin;

        // 2 · the sine-wave path the node "wants" to float along
        const targetX = n.ox + Math.sin(simTime * n.freqX + n.phaseX) * n.ampX;
        const targetY = n.oy + Math.cos(simTime * n.freqY + n.phaseY) * n.ampY;

        // 3 · spring back toward the path — this is what makes a cursor
        //     displacement resolve into a smooth return instead of a snap.
        const k = spring * (0.75 + n.depth * 0.7);
        n.vx += (targetX - n.x) * k;
        n.vy += (targetY - n.y) * k;

        // 4 · cursor force, falling off quadratically inside the reach
        if (interacting && n.affinity !== 0) {
          const dx = n.x - pointer.x;
          const dy = n.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < reach2 && dist2 > 1) {
            const dist = Math.sqrt(dist2);
            const falloff = 1 - dist / reach;
            const force =
              falloff * falloff * strength * (0.45 + n.depth * 0.85) * n.affinity;
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        }

        // 4b · shockwave front: shove nodes outward as the ring sweeps past
        for (const w of waves) {
          const wx = n.x - w.x;
          const wy = n.y - w.y;
          const dist = Math.hypot(wx, wy);
          // A node sitting exactly under the origin has no push direction.
          if (dist < 1) continue;
          const offset = Math.abs(dist - w.radius);
          if (offset > halfBand) continue;
          const falloff = 1 - offset / halfBand;
          const decay = 1 - w.radius / w.maxRadius;
          const shove =
            falloff * falloff * w.strength * decay * (0.5 + n.depth * 0.8);
          n.vx += (wx / dist) * shove;
          n.vy += (wy / dist) * shove;
        }

        // 5 · damp, clamp, integrate
        n.vx *= damping;
        n.vy *= damping;
        const speed = Math.hypot(n.vx, n.vy);
        if (speed > MAX_VELOCITY) {
          const s = MAX_VELOCITY / speed;
          n.vx *= s;
          n.vy *= s;
        }
        n.x += n.vx;
        n.y += n.vy;
        n.rotation += n.spin * dt;
      }

      simTime += dt;
    }

    function drawLinks() {
      const maxDist = cfg.links.distance;
      const maxDist2 = maxDist * maxDist;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 0.6;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > maxDist2) continue;

          const t = 1 - Math.sqrt(dist2) / maxDist;
          ctx.globalAlpha =
            t * t * cfg.links.opacity * (0.35 + (a.depth + b.depth) * 0.5);
          ctx.strokeStyle =
            a.colorIndex === 2 || b.colorIndex === 2
              ? cfg.colors.violet
              : cfg.colors.primary;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // Ambient shimmer: a pulse travels along a deterministic subset of
          // the lines, which keeps the constellation feeling alive.
          if ((i * 31 + j * 17) % 100 < 7) {
            const p = (simTime * 0.09 + ((i * 31 + j * 17) % 100) * 0.31) % 1;
            ctx.globalAlpha = Math.sin(p * Math.PI) * 0.5 * t;
            ctx.fillStyle = cfg.colors.accent;
            ctx.beginPath();
            // travels a → b (dx/dy are a − b)
            ctx.arc(a.x + dx * -p, a.y + dy * -p, 1.2 + t, 0, TAU);
            ctx.fill();
          }
        }
      }
    }

    /** Expanding rings — drawn under the nodes so they read as pushing them. */
    function drawShockwaves() {
      for (const w of waves) {
        const p = w.radius / w.maxRadius;
        const fade = (1 - p) * (1 - p);

        // Leading edge: thin and bright.
        ctx.globalAlpha = fade * 0.32;
        ctx.strokeStyle = cfg.colors.accent;
        ctx.lineWidth = 1 + fade * 2.2;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, TAU);
        ctx.stroke();

        // Trailing haze just behind the front — suggests displaced "air".
        ctx.globalAlpha = fade * fade * 0.15;
        ctx.lineWidth = 8 + (1 - fade) * 18;
        ctx.beginPath();
        ctx.arc(w.x, w.y, Math.max(0, w.radius - 10), 0, TAU);
        ctx.stroke();

        // Quick flash at the click point.
        const flash = 1 - Math.min(1, w.radius / 90);
        if (flash > 0) {
          const size = 70 + w.radius * 0.6;
          ctx.globalAlpha = flash * 0.3;
          ctx.drawImage(sprites[1], w.x - size, w.y - size, size * 2, size * 2);
        }
      }
    }

    function draw() {
      if (width < 2 || height < 2) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      // Additive blending over the (near-black) page gives the glows their
      // bloom without any per-frame shadowBlur cost.
      ctx.globalCompositeOperation = "lighter";

      const showLinks = linksEnabled && width >= MOBILE_BREAKPOINT;
      if (showLinks) drawLinks();
      if (waves.length > 0) drawShockwaves();

      // Cursor aura: a soft primary-coloured glow that trails the pointer.
      if (pointerVisible && !reduced && cfg.mouse.aura > 0) {
        const reach = cfg.mouse.radius * 1.15;
        ctx.globalAlpha = cfg.mouse.aura;
        ctx.drawImage(
          sprites[0],
          aura.x - reach,
          aura.y - reach,
          reach * 2,
          reach * 2
        );
      }

      for (const n of nodes) {
        const sceneScale = 0.5 + n.depth;
        const r = Math.max(0.6, n.radius * sceneScale);
        const twinkle =
          n.twinkleRate > 0
            ? 0.62 + 0.38 * Math.sin(simTime * n.twinkleRate + n.twinklePhase)
            : 1;
        // Opacity is a direct function of depth (far = faint, near = bright).
        const alpha = n.alpha * (0.3 + n.depth * 0.9) * twinkle;
        const far = n.depth <= 0.42;

        // Defocused halo — the only thing background nodes draw.
        const halo = r * (7 + n.depth * 4);
        ctx.globalAlpha = Math.min(1, alpha * (far ? 0.42 : 0.3));
        ctx.drawImage(sprites[n.colorIndex], n.x - halo, n.y - halo, halo * 2, halo * 2);

        if (far) continue;

        ctx.globalAlpha = Math.min(1, alpha);
        ctx.strokeStyle = palette[n.colorIndex];
        ctx.fillStyle = palette[n.colorIndex];

        if (n.kind === "dot") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, Math.max(0.7, r * 0.62), 0, TAU);
          ctx.fill();
        } else {
          ctx.lineWidth = 0.8 + n.depth * 0.7;
          ctx.beginPath();
          if (n.kind === "ring") {
            ctx.arc(n.x, n.y, r * 1.6, 0, TAU);
          } else {
            const sides = n.sides;
            for (let s = 0; s <= sides; s++) {
              const a = n.rotation + (s / sides) * TAU;
              const px = n.x + Math.cos(a) * r * 1.7;
              const py = n.y + Math.sin(a) * r * 1.7;
              if (s === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
          }
          ctx.stroke();
        }

        // Sparkle: a four-point star that flares on a slow random rhythm.
        if (n.twinkleRate > 0) {
          const flare = Math.sin(
            simTime * n.twinkleRate * 0.6 + n.twinklePhase * 1.7
          );
          if (flare > 0.72) {
            const f = (flare - 0.72) / 0.28;
            const armLength = r * (2.6 + f * 3);
            ctx.globalAlpha = Math.min(1, f * 0.75) * (0.4 + n.depth * 0.6);
            ctx.strokeStyle = palette[n.colorIndex];
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(n.x - armLength, n.y);
            ctx.lineTo(n.x + armLength, n.y);
            ctx.moveTo(n.x, n.y - armLength);
            ctx.lineTo(n.x, n.y + armLength);
            ctx.moveTo(n.x - armLength * 0.42, n.y - armLength * 0.42);
            ctx.lineTo(n.x + armLength * 0.42, n.y + armLength * 0.42);
            ctx.moveTo(n.x - armLength * 0.42, n.y + armLength * 0.42);
            ctx.lineTo(n.x + armLength * 0.42, n.y - armLength * 0.42);
            ctx.stroke();

            ctx.globalAlpha = Math.min(1, f) * 0.8;
            ctx.fillStyle = "#fff6e8";
            ctx.beginPath();
            ctx.arc(n.x, n.y, Math.max(0.8, r * 0.5), 0, TAU);
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    /** Depth cue: let the mesh aura lag the cursor and drift a little. */
    function updateAuraParallax() {
      const el = auraRef.current;
      if (!el || reduced || !pointerVisible || width < 2) return;
      aura.x += (pointer.x - aura.x) * 0.12;
      aura.y += (pointer.y - aura.y) * 0.12;
      const nx = ((aura.x / width - 0.5) * -26).toFixed(2);
      const ny = ((aura.y / height - 0.5) * -26).toFixed(2);
      // Skip the style write when nothing meaningfully changed.
      if (nx === aura.writtenX && ny === aura.writtenY) return;
      aura.writtenX = nx;
      aura.writtenY = ny;
      el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    }

    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      const elapsed = lastFrame ? now - lastFrame : 16.7;
      lastFrame = now;

      // Fixed-step integration: identical motion on any refresh rate, and a
      // max of 3 catch-up steps so a stalled tab can't spiral.
      const dt = Math.min(elapsed / 1000, 0.1);
      accumulator += dt;
      let steps = 0;
      while (accumulator >= STEP && steps < 3) {
        step();
        accumulator -= STEP;
        steps++;
      }
      if (steps === 3) accumulator = 0;

      // Cheap adaptive quality: if we can't hold ~48fps, drop the
      // constellation lines rather than the whole effect.
      frameCost += elapsed;
      frameCount++;
      if (frameCount >= 45) {
        if (frameCost / frameCount > 21) linksEnabled = false;
        frameCost = 0;
        frameCount = 0;
      }

      updateAuraParallax();
      draw();
    }

    function start() {
      if (rafId || reduced || !intersecting || !tabVisible) return;
      lastFrame = performance.now();
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(rect.width));
      const nextH = Math.max(1, Math.round(rect.height));
      if (nextW === width && nextH === height) return;

      const scaleX = width > 0 ? nextW / width : 1;
      const scaleY = height > 0 ? nextH / height : 1;
      width = nextW;
      height = nextH;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      const budget = nodeBudget(width, height, cfg);
      if (nodes.length === 0 || Math.abs(budget - nodes.length) > budget * 0.25) {
        // Breakpoint crossed (or first paint) — rebuild the field.
        buildNodes();
      } else {
        // Same density — just re-fit nodes into the new box.
        for (const n of nodes) {
          n.x *= scaleX;
          n.y *= scaleY;
          n.ox *= scaleX;
          n.oy *= scaleY;
        }
      }

      if (reduced) {
        settle();
        draw();
      }
    }

    // ---------------------------------------------------------------- events
    /** Canvas-space coords for a pointer event. */
    function toCanvasPoint(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const point = toCanvasPoint(event);
      pointer.x = point.x;
      pointer.y = point.y;
      if (!pointerVisible) {
        // Ease in from the pointer's position instead of jumping.
        aura.x = point.x;
        aura.y = point.y;
      }
      pointerVisible = true;
    }

    function onPointerLeave() {
      pointerVisible = false;
    }

    function onPointerDown(event: PointerEvent) {
      // Left click only; touch taps and pen presses are welcome as-is.
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const point = toCanvasPoint(event);
      if (event.pointerType === "mouse") {
        // A click implies the cursor is here even if it never moved.
        pointer.x = point.x;
        pointer.y = point.y;
        pointerVisible = true;
      }
      spawnWave(point.x, point.y);
    }

    function onVisibilityChange() {
      tabVisible = document.visibilityState === "visible";
      if (tabVisible) start();
      else stop();
    }

    function onMotionChange() {
      reduced = cfg.respectReducedMotion && motionQuery.matches;
      if (reduced) {
        stop();
        // Don't leave a ripple frozen mid-flight in the still frame.
        waves = [];
        settle();
        draw();
        const el = auraRef.current;
        if (el) el.style.transform = "";
      } else {
        start();
      }
    }

    // ---------------------------------------------------------------- wiring
    // Pointer tracking is bound to the hero <section> (the container) so it
    // keeps working over the headline, CTAs and badges, while every visual
    // layer stays pointer-events-none.
    const host: EventTarget =
      (canvas.closest("section") as HTMLElement | null) ?? window;
    host.addEventListener("pointermove", onPointerMove as EventListener);
    host.addEventListener("pointerdown", onPointerDown as EventListener);
    host.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);

    // Only animate while the hero is actually on screen.
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              intersecting = entries[0]?.isIntersecting ?? true;
              if (intersecting) start();
              else stop();
            },
            { threshold: 0 }
          )
        : null;
    io?.observe(canvas);

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    resize();
    if (reduced) draw();
    else start();

    // ---------------------------------------------------------------- cleanup
    return () => {
      stop();
      ro.disconnect();
      io?.disconnect();
      host.removeEventListener("pointermove", onPointerMove as EventListener);
      host.removeEventListener("pointerdown", onPointerDown as EventListener);
      host.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      nodes = [];
      waves = [];
    };
  }, []);

  return (
    // Visual layers are all pointer-events-none; the hero section owns the
    // pointer tracking. z-0 keeps the whole field under the z-10 hero copy.
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* 1 · Mesh gradient / aurora — one composited layer instead of several
          blurred blobs, which is markedly cheaper on mobile GPUs. */}
      <div ref={auraRef} className="absolute inset-0 will-change-transform">
        <div
          className="animate-aurora absolute inset-[-18%]"
          style={{
            backgroundImage: AURA_GRADIENT,
            filter: "blur(70px)",
            opacity: resolved.auraOpacity,
            animationDuration: "26s",
          }}
        />
      </div>

      {/* 2 · Particles + geometry + constellation lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-hidden="true"
        role="presentation"
      />
    </div>
  );
}
