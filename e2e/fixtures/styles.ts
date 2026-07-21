/**
 * STYLE_RESET_CSS — shared reset applied via `page.addStyleTag` AFTER
 * navigation, BEFORE the screenshot, in every visual snapshot spec on
 * TradingLensAi.
 *
 * Two layers of neutralizing, in priority order:
 *
 * 1. Wildcard layer:
 *      - `animation-duration / delay / iteration-count`: forces finite
 *        CSS animations to fire once and finish in 0s; infinite ones
 *        freeze at first keyframe.
 *      - `transition-duration / delay`: stops any mid-flight CSS
 *        transition (e.g. Tailwind's `transition-all duration-300` on
 *        `<aside>` elements) from being captured mid-tween.
 *      - `caret-color: transparent`: prevents blinking-caret artifacts
 *        on focused inputs that would otherwise flicker into the snapshot.
 *
 * 2. `[data-projection-id]` layer:
 *      - Targets framer-motion's *layout-projection* system only. The
 *        attribute is set on elements participating in `layout` or
 *        `layoutId` props (e.g. DashboardSidebar's
 *        `<motion.div layoutId="sidebar-active">` indicator, LiveChart's
 *        `<motion.div layout>` wrapper). Playwright's
 *        `animations: "disabled"` does NOT touch framer-motion's
 *        requestAnimationFrame loop, so layoutId springs can leave
 *        residual sub-pixel offsets between UPDATE and VERIFY phases
 *        of a baseline bake — stripping their `transform` here pins
 *        the element to its measured rect at paint time.
 *
 * Selector matters: Tailwind utility classes like `-translate-x-full`
 * on the mobile DashboardSidebar are NOT projection-driven, so they
 * remain unaffected and the mobile sidebar's slide-in/slide-out
 * behavior is preserved on REAL pages (we only strip transforms during
 * the visual snapshot itself).
 *
 * Framer Motion v10+ does NOT emit a `data-layoutid` attribute — the
 * ONLY emitted projection attribute is `data-projection-id`. Don't add
 * `[data-layoutid]` to this reset without verifying the attribute exists.
 */

export const STYLE_RESET_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  [data-projection-id] {
    transform: none !important;
  }
`;
