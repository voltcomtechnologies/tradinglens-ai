"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, TrendingUp, TrendingDown, Minus, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ScanHistoryItem } from "@/lib/hooks/use-trading";

interface ScanHistoryGalleryProps {
  items: ScanHistoryItem[];
  onSelect?: (item: ScanHistoryItem) => void;
  className?: string;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function signalIcon(signal: ScanHistoryItem["signal"]) {
  switch (signal) {
    case "buy":
      return <TrendingUp className="h-4 w-4" />;
    case "sell":
      return <TrendingDown className="h-4 w-4" />;
    default:
      return <Minus className="h-4 w-4" />;
  }
}

function signalClass(signal: ScanHistoryItem["signal"]) {
  switch (signal) {
    case "buy":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "sell":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default:
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
}

export function ScanHistoryGallery({ items, onSelect, className }: ScanHistoryGalleryProps) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Recent Scans</h2>
        <span className="ml-auto text-xs text-muted-foreground">{items.length} saved</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {sorted.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => onSelect?.(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect?.(item);
                  }
                }}
                className="group relative overflow-hidden border border-primary/10 bg-card/40 backdrop-blur-sm hover:border-primary/30 hover:bg-card/60 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                {/* Top accent line */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-0.5",
                    item.signal === "buy" && "bg-emerald-500",
                    item.signal === "sell" && "bg-rose-500",
                    item.signal === "hold" && "bg-amber-500"
                  )}
                />

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground">
                        {item.pair} <span className="text-muted-foreground font-medium">{item.timeframe}</span>
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide",
                        signalClass(item.signal)
                      )}
                    >
                      {signalIcon(item.signal)}
                      {item.signal}
                    </div>
                  </div>

                  {/* Chart thumbnail */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-primary/10 mb-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={`${item.pair} chart scan`}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        No chart image
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-xs font-medium text-primary bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity">
                        View analysis
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Confidence
                      <span className="font-semibold text-foreground">{item.confidence}%</span>
                    </div>
                    <div className="h-1.5 w-24 rounded-full bg-primary/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.confidence}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                        className={cn(
                          "h-full rounded-full",
                          item.signal === "buy" && "bg-emerald-500",
                          item.signal === "sell" && "bg-rose-500",
                          item.signal === "hold" && "bg-amber-500"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
