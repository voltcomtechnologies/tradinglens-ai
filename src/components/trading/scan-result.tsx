"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Volume2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ScannerResult } from "./scanner";

interface ScanResultProps {
  result: ScannerResult;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  isSupported?: boolean;
  className?: string;
}

export function ScanResult({ result, onSpeak, isSpeaking, isSupported = true, className }: ScanResultProps) {
  const signalConfig = {
    buy: {
      label: "BUY",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      glowColor: "shadow-emerald-500/20",
      gradient: "from-emerald-500 to-teal-400",
    },
    sell: {
      label: "SELL",
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      glowColor: "shadow-red-500/20",
      gradient: "from-red-500 to-orange-500",
    },
    hold: {
      label: "HOLD",
      icon: Minus,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      glowColor: "shadow-amber-500/20",
      gradient: "from-amber-500 to-yellow-400",
    },
  };

  const config = result.signal ? signalConfig[result.signal] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden border border-primary/20 bg-card/40 backdrop-blur-xl",
        className
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
          config ? config.gradient : "from-primary via-accent to-primary"
        )}
      />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md animate-pulse" />
              <Sparkles className="relative h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider uppercase text-foreground">
                Analysis Complete
              </h3>
              <p className="text-xs text-muted-foreground">
                {result.pair} • {result.timeframe}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onSpeak}
            disabled={!isSupported}
            className="self-start sm:self-auto border-primary/20 hover:bg-primary/10 disabled:opacity-50"
          >
            <Volume2 className={cn("h-4 w-4 mr-2", isSpeaking ? "text-primary animate-pulse" : "text-muted-foreground")} />
            {isSpeaking ? "Speaking..." : isSupported ? "Read Aloud" : "Voice unavailable"}
          </Button>
        </div>

        {/* Signal badge */}
        {config && (
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={cn(
                "relative flex items-center justify-center w-32 h-32 rounded-2xl border-2 backdrop-blur-sm",
                config.bgColor,
                config.borderColor,
                "shadow-lg",
                config.glowColor
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-20",
                  config.gradient
                )}
              />
              <div className="relative flex flex-col items-center">
                <config.icon className={cn("h-10 w-10 mb-1", config.color)} />
                <span className={cn("text-2xl font-black tracking-wider", config.color)}>
                  {config.label}
                </span>
              </div>
            </motion.div>

            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Confidence</span>
                <span className={cn("text-sm font-bold", config.color)}>
                  {result.confidence}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                  className={cn("h-full rounded-full bg-gradient-to-r", config.gradient)}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Based on pattern recognition, support/resistance levels, and momentum indicators.
              </p>
            </div>
          </div>
        )}

        {/* Analysis content */}
        <div className="rounded-2xl bg-black/30 border border-primary/10 p-5 sm:p-6">
          <h4 className="text-sm font-bold tracking-wider uppercase text-primary mb-4">
            Detailed Analysis
          </h4>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {result.analysis}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
