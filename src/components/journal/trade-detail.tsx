"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Shield,
  Activity,
  Brain,
  BookOpen,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/lib/hooks/use-journal";
import { useDeleteJournalEntry } from "@/lib/hooks/use-journal";
import { TradeForm } from "./trade-form";

interface TradeDetailProps {
  entry: JournalEntry | null;
  open: boolean;
  onClose: () => void;
}

export function TradeDetail({ entry, open, onClose }: TradeDetailProps) {
  const deleteEntry = useDeleteJournalEntry();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!entry) return null;

  const isProfitable = (entry.pips ?? 0) > 0;
  const isLoss = (entry.pips ?? 0) < 0;
  const pipsColor = isProfitable
    ? "text-emerald-400"
    : isLoss
      ? "text-red-400"
      : "text-muted-foreground";

  const entryDate = new Date(entry.entryDate);
  const exitDate = entry.exitDate ? new Date(entry.exitDate) : null;

  // Duration in minutes, then convert for display
  const durationMin = exitDate
    ? Math.round(
        (exitDate.getTime() - entryDate.getTime()) / (1000 * 60)
      )
    : null;

  const durationDisplay = () => {
    if (durationMin == null) return "—";
    if (durationMin < 60) return `${durationMin}m`;
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days}d ${remHours}h`;
    }
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleDelete = async () => {
    await deleteEntry.mutateAsync(entry.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Sheet open={open && !showEdit} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    entry.direction === "BUY"
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10"
                  )}
                >
                  {entry.direction === "BUY" ? (
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div>
                  <SheetTitle className="flex items-center gap-2">
                    {entry.pair}
                    <span className="text-sm font-normal flex items-center gap-1">
                      <Badge
                        variant={
                          entry.direction === "BUY" ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {entry.direction}
                      </Badge>
                    </span>
                  </SheetTitle>
                  <SheetDescription>
                    Status: {entry.status}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShowEdit(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "rounded-xl p-6 text-center mb-6",
              isProfitable
                ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20"
                : isLoss
                  ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20"
                  : "bg-muted/30 border border-border"
            )}
          >
            <p className={cn("text-3xl font-bold", pipsColor)}>
              {entry.pips != null
                ? `${entry.pips >= 0 ? "+" : ""}${entry.pips} pips`
                : "—"}
            </p>
            {entry.profitLoss != null && (
              <p
                className={cn(
                  "text-lg mt-1",
                  entry.profitLoss >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                )}
              >
                {entry.profitLoss >= 0 ? "+" : ""}${entry.profitLoss.toFixed(2)}
              </p>
            )}
            {entry.strategy && (
              <Badge variant="outline" className="mt-3">
                {entry.strategy}
              </Badge>
            )}
          </motion.div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailCard
                icon={Target}
                label="Entry"
                value={entry.entryPrice.toFixed(5)}
              />
              <DetailCard
                icon={Target}
                label="Exit"
                value={entry.exitPrice?.toFixed(5) ?? "—"}
              />
              <DetailCard
                icon={Shield}
                label="Stop Loss"
                value={entry.stopLoss?.toFixed(5) ?? "—"}
              />
              <DetailCard
                icon={Activity}
                label="Take Profit"
                value={entry.takeProfit?.toFixed(5) ?? "—"}
              />
              <DetailCard
                icon={Activity}
                label="Lot Size"
                value={entry.lotSize?.toString() ?? "—"}
              />
              <DetailCard
                icon={Calendar}
                label="Duration"
                value={durationDisplay()}
              />
            </div>
          </div>

          <Separator className="my-6" />

          {entry.notes && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Notes
              </div>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
                {entry.notes}
              </p>
            </div>
          )}

          {entry.emotions && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Brain className="h-4 w-4 text-muted-foreground" />
                Emotions
              </div>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
                {entry.emotions}
              </p>
            </div>
          )}

          {entry.lessons && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Lessons Learned
              </div>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
                {entry.lessons}
              </p>
            </div>
          )}

          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Entry Date</p>
              <p className="font-medium">
                {entryDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {exitDate && (
              <div>
                <p className="text-muted-foreground">Exit Date</p>
                <p className="font-medium">
                  {exitDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <p className="text-sm font-medium text-red-400 mb-3">
                  Are you sure you want to delete this trade?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteEntry.isPending}
                  >
                    {deleteEntry.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      <TradeForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        editEntry={entry}
      />
    </>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium font-mono">{value}</p>
    </div>
  );
}
