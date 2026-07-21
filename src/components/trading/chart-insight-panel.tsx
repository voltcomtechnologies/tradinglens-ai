"use client";

/**
 * ChartInsightPanel — the narrator UI. Sits BELOW the LiveChart as a
 * sibling card. Owns the toggle (which doubles as the autoplay-block
 * user-gesture) and reflects the narrator status back to the user.
 *
 * Wiring rule: the Narrator toggle is OFF by default. Click it ON to
 *   (1) trust-gesture unlock the browser's speechSynthesis.
 *   (2) start the 5-minute heartbeat + symbol-change debounced triggers.
 * Click OFF to silence. Manual "Narrate now" button forces an immediate
 *   capture even when auto-triggers are off.
 */

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  HeadphoneOff,
  Sparkles,
  Volume2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChartNarrator, type NarratorStatus } from "@/lib/hooks/use-chart-narrator";
import { useSpeechSynthesis } from "@/lib/hooks/use-speech-synthesis";
import { MAJOR_PAIRS } from "@/types";
import type { LiveChartHandle } from "@/components/trading/live-chart";

interface ChartInsightPanelProps {
  chartRef: React.RefObject<LiveChartHandle | null>;
  symbol: string;
  granularity: string;
  className?: string;
}

const STATUS_LABEL: Record<NarratorStatus, string> = {
  idle: "Ready",
  muted: "Off",
  capturing: "Capturing chart…",
  thinking: "Grok is looking…",
  speaking: "Speaking",
  error: "Error",
};

const STATUS_COLOR: Record<NarratorStatus, string> = {
  idle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  muted: "bg-muted text-muted-foreground border-border",
  capturing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  thinking: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  speaking: "bg-primary/10 text-primary border-primary/30",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function ChartInsightPanel({
  chartRef,
  symbol,
  granularity,
  className,
}: ChartInsightPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const { speak, isSpeaking, supported, stop } = useSpeechSynthesis();

  const handleInsight = useCallback((text: string) => {
    // No-op side-effects beyond the hook's internal state — the parent's
    // own state cache is the user-facing transcript. The hook already
    // calls speak() itself.
  }, []);

  const { status, latestInsight, error, triggerNow } = useChartNarrator({
    chartRef,
    symbol,
    granularity,
    enabled,
    speak,
    // Pass stopSpeak so the hook can cancel an in-flight native utterance
    // when a fresh capture supersedes an older one (sub-second symbol
    // switch halts the OLD sentence mid-speak).
    stopSpeak: stop,
    onInsight: handleInsight,
  });

  // Pair display name without crashing on bad inputs.
  const displayPair = MAJOR_PAIRS.find((p) => p.symbol === symbol)?.name ?? symbol;

  const toggle = () => {
    if (!supported) return;
    if (enabled) {
      // Setting enabled=false also fires the hook's `enabled`-effect,
      // which calls cancelInFlight() (stopping native TTS + dropping
      // queued sentences). We belt-and-braces call stop() so the
      // browser TTS is killed synchronously before the render commits.
      stop();
      setEnabled(false);
    } else {
      setEnabled(true);
      // Kick off an immediate narration so the user hears feedback immediately.
      void triggerNow();
    }
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-primary/20 bg-card/40 backdrop-blur-xl rounded-3xl",
        className,
      )}
    >
      {/* Animated top accent bar — keeps the chrome in family with the
          surrounding scanner/livechart panels. */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary z-20 animate-pulse" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 rounded-xl blur-lg animate-pulse" />
            <div className="relative p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-foreground">
              Grok Narrator
            </h3>
            <p className="text-xs text-muted-foreground">
              {displayPair} · {granularity.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border",
              STATUS_COLOR[status],
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                status === "speaking" && "bg-primary animate-pulse",
                status === "idle" && "bg-emerald-400",
                status === "capturing" && "bg-amber-400",
                status === "thinking" && "bg-blue-400",
                status === "muted" && "bg-muted-foreground",
                status === "error" && "bg-red-400",
              )}
            />
            {STATUS_LABEL[status]}
          </span>

          <button
            type="button"
            onClick={() => void triggerNow()}
            aria-label="Narrate now"
            disabled={status === "capturing" || status === "thinking"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Narrate now
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-pressed={enabled}
            aria-label={enabled ? "Mute Grok narrator" : "Enable Grok narrator"}
            disabled={!supported}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              enabled
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-primary/10 border-transparent hover:border-primary/20",
              !supported && "opacity-50 cursor-not-allowed",
            )}
          >
            {enabled ? (
              <Headphones className="h-3.5 w-3.5" />
            ) : (
              <HeadphoneOff className="h-3.5 w-3.5" />
            )}
            {enabled ? "Mute" : "Enable"}
          </button>
        </div>
      </div>

      {/* Transcript body */}
      <div className="relative z-10 px-6 py-4 min-h-[88px]">
        {!supported ? (
          <p className="text-xs text-muted-foreground">
            Voice not supported in this browser.
          </p>
        ) : isSpeaking ? (
          <LiveSpeechWave text={latestInsight ?? ""} />
        ) : error ? (
          <ErrorBlock message={error} />
        ) : latestInsight ? (
          <motion.p
            key={latestInsight}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-foreground/95 leading-relaxed"
          >
            {latestInsight}
          </motion.p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {enabled
              ? "Waiting for the next candle update to narrate…"
              : "Click Enable to start the narrator. It will comment on the in-focus chart, refresh on currency change, and speak top-of-the-hour forex headlines."}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-6 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary"
          >
            <Volume2 className="h-3 w-3 animate-pulse" />
            Speaking
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveSpeechWave({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1 pt-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1 rounded-full bg-primary"
            animate={{ height: ["6px", "18px", "6px"] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="text-sm text-foreground/95 leading-relaxed flex-1">{text}</p>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2">
      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
      <p className="text-xs text-red-300 leading-relaxed">{message}</p>
    </div>
  );
}
