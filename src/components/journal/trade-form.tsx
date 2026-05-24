"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAJOR_PAIRS } from "@/types";
import type { JournalEntry, CreateJournalData } from "@/lib/hooks/use-journal";
import {
  useCreateJournalEntry,
  useUpdateJournalEntry,
} from "@/lib/hooks/use-journal";

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
  editEntry?: JournalEntry | null;
}

const STRATEGIES = [
  "Breakout",
  "Trend Following",
  "Support & Resistance",
  "Scalping",
  "Swing Trading",
  "News Trading",
  "Mean Reversion",
  "Grid Trading",
  "Martingale",
  "Custom",
];

export function TradeForm({ open, onClose, editEntry }: TradeFormProps) {
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const isEditing = !!editEntry;

  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [pair, setPair] = useState("EURUSD");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [pips, setPips] = useState("");
  const [profitLoss, setProfitLoss] = useState("");
  const [status, setStatus] = useState<"OPEN" | "CLOSED" | "CANCELLED">("OPEN");
  const [strategy, setStrategy] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [exitDate, setExitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [emotions, setEmotions] = useState("");
  const [lessons, setLessons] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editEntry) {
      setDirection(editEntry.direction);
      setPair(editEntry.pair);
      setEntryPrice(String(editEntry.entryPrice));
      setExitPrice(editEntry.exitPrice ? String(editEntry.exitPrice) : "");
      setStopLoss(editEntry.stopLoss ? String(editEntry.stopLoss) : "");
      setTakeProfit(editEntry.takeProfit ? String(editEntry.takeProfit) : "");
      setLotSize(editEntry.lotSize ? String(editEntry.lotSize) : "");
      setPips(editEntry.pips ? String(editEntry.pips) : "");
      setProfitLoss(editEntry.profitLoss ? String(editEntry.profitLoss) : "");
      setStatus(editEntry.status);
      setStrategy(editEntry.strategy ?? "");
      setEntryDate(
        new Date(editEntry.entryDate).toISOString().slice(0, 16)
      );
      setExitDate(
        editEntry.exitDate
          ? new Date(editEntry.exitDate).toISOString().slice(0, 16)
          : ""
      );
      setNotes(editEntry.notes ?? "");
      setEmotions(editEntry.emotions ?? "");
      setLessons(editEntry.lessons ?? "");
    } else {
      resetForm();
    }
  }, [editEntry, open]);

  const resetForm = () => {
    setDirection("BUY");
    setPair("EURUSD");
    setEntryPrice("");
    setExitPrice("");
    setStopLoss("");
    setTakeProfit("");
    setLotSize("");
    setPips("");
    setProfitLoss("");
    setStatus("OPEN");
    setStrategy("");
    setEntryDate(new Date().toISOString().slice(0, 16));
    setExitDate("");
    setNotes("");
    setEmotions("");
    setLessons("");
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!pair) newErrors.pair = "Pair is required";
    if (!entryPrice) newErrors.entryPrice = "Entry price is required";
    else if (isNaN(Number(entryPrice))) newErrors.entryPrice = "Invalid price";
    if (exitPrice && isNaN(Number(exitPrice)))
      newErrors.exitPrice = "Invalid price";
    if (stopLoss && isNaN(Number(stopLoss)))
      newErrors.stopLoss = "Invalid price";
    if (takeProfit && isNaN(Number(takeProfit)))
      newErrors.takeProfit = "Invalid price";
    if (lotSize && isNaN(Number(lotSize)))
      newErrors.lotSize = "Invalid lot size";
    if (pips && isNaN(Number(pips))) newErrors.pips = "Invalid pip count";
    if (profitLoss && isNaN(Number(profitLoss)))
      newErrors.profitLoss = "Invalid amount";
    if (!entryDate) newErrors.entryDate = "Entry date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateJournalData = {
      pair,
      direction,
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice ? Number(exitPrice) : null,
      stopLoss: stopLoss ? Number(stopLoss) : null,
      takeProfit: takeProfit ? Number(takeProfit) : null,
      lotSize: lotSize ? Number(lotSize) : null,
      pips: pips ? Number(pips) : null,
      profitLoss: profitLoss ? Number(profitLoss) : null,
      status,
      strategy: strategy || null,
      notes: notes || null,
      emotions: emotions || null,
      lessons: lessons || null,
      entryDate: new Date(entryDate).toISOString(),
      exitDate: exitDate ? new Date(exitDate).toISOString() : null,
    };

    try {
      if (isEditing && editEntry) {
        await updateEntry.mutateAsync({ id: editEntry.id, ...data });
      } else {
        await createEntry.mutateAsync(data);
      }
      onClose();
      resetForm();
    } catch (err) {
      console.error("Failed to save trade:", err);
    }
  };

  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Edit Trade" : "New Trade Entry"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your trade details below."
              : "Record a new trade in your journal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Direction Toggle */}
          <div>
            <Label className="mb-2 block">Direction</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDirection("BUY")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                  direction === "BUY"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">BUY</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection("SELL")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                  direction === "SELL"
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                )}
              >
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">SELL</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pair">Currency Pair</Label>
              <select
                id="pair"
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary",
                  errors.pair && "border-red-500"
                )}
              >
                {MAJOR_PAIRS.map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.symbol} - {p.name}
                  </option>
                ))}
              </select>
              {errors.pair && (
                <p className="text-xs text-red-400">{errors.pair}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <select
                id="strategy"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select strategy</option>
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price *</Label>
              <Input
                id="entryPrice"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="1.08450"
                className={errors.entryPrice ? "border-red-500" : ""}
              />
              {errors.entryPrice && (
                <p className="text-xs text-red-400">{errors.entryPrice}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="1.09230"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="1.08000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input
                id="takeProfit"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="1.09500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lotSize">Lot Size</Label>
              <Input
                id="lotSize"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pips">Pips</Label>
              <Input
                id="pips"
                value={pips}
                onChange={(e) => setPips(e.target.value)}
                placeholder="+78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profitLoss">P&L ($)</Label>
              <Input
                id="profitLoss"
                value={profitLoss}
                onChange={(e) => setProfitLoss(e.target.value)}
                placeholder="+780.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "OPEN" | "CLOSED" | "CANCELLED")
                }
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Entry Date *</Label>
              <div className="relative">
                <Input
                  id="entryDate"
                  type="datetime-local"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className={cn(
                    "pl-10",
                    errors.entryDate && "border-red-500"
                  )}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.entryDate && (
                <p className="text-xs text-red-400">{errors.entryDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitDate">Exit Date</Label>
              <div className="relative">
                <Input
                  id="exitDate"
                  type="datetime-local"
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? Why did you enter this trade?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emotions">Emotions</Label>
              <Textarea
                id="emotions"
                value={emotions}
                onChange={(e) => setEmotions(e.target.value)}
                placeholder="How were you feeling during this trade?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessons">Lessons Learned</Label>
              <Textarea
                id="lessons"
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="What will you do differently next time?"
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update Trade" : "Save Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
