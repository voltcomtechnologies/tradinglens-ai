"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Sparkles, Shield, Zap, Brain } from "lucide-react";
import type { ScanHistoryItem } from "@/lib/hooks/use-trading";
import { toast } from "sonner";
import { TradingScanner, type ScannerResult } from "@/components/trading/scanner";
import { ScanResult } from "@/components/trading/scan-result";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAnalyzeChart, useScanHistory, useDeleteScan } from "@/lib/hooks/use-trading";
import { useVoice } from "@/lib/hooks/use-voice";
import { dataUrlToFile } from "@/lib/utils";
import { ScanHistoryGallery } from "@/components/trading/scan-history";

export default function TradingLensPage() {
  const { data: session } = useSession();
  const [capturedImage, setCapturedImage] = useState<string | File | null>(null);
  const [result, setResult] = useState<ScannerResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = useAnalyzeChart();
  const { data: scanHistory, isLoading: isHistoryLoading } = useScanHistory(!!session?.user);
  const deleteScanMutation = useDeleteScan();
  const { speak, isSpeaking, isSupported } = useVoice({ rate: 0.95, volume: 1 });

  const handleImageCapture = useCallback((imageData: string | File) => {
    setCapturedImage(imageData);
    setResult(null);
  }, []);

  const handleScanComplete = useCallback(async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const imageFile =
        capturedImage instanceof File
          ? capturedImage
          : await dataUrlToFile(capturedImage, "chart-scan.jpg");

      const data = await analyzeMutation.mutateAsync({
        prompt: "Analyze this forex chart and provide a clear BUY, SELL, or HOLD recommendation with key levels and reasoning.",
        pair: "EURUSD",
        timeframe: "1H",
        image: imageFile,
      });

      const signal = data.signal || "hold";
      const confidence = data.confidence ?? 70;
      const scanResult: ScannerResult = {
        signal,
        confidence,
        pair: data.pair || "EURUSD",
        timeframe: data.timeframe || "1H",
        analysis: data.content,
      };

      setResult(scanResult);

      // Auto-speak the recommendation
      if (isSupported) {
        const summary = `Trading Lens analysis complete. Recommendation: ${signal?.toUpperCase() || "HOLD"} with ${confidence}% confidence. ${data.content.slice(0, 200)}`;
        speak(summary);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze chart. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedImage, analyzeMutation, isSupported, speak]);

  const handleSpeak = useCallback(() => {
    if (!result) return;
    const summary = `Trading Lens analysis for ${result.pair} on the ${result.timeframe} timeframe. Recommendation: ${result.signal?.toUpperCase() || "HOLD"} with ${result.confidence}% confidence. ${result.analysis.slice(0, 300)}`;
    speak(summary);
  }, [result, speak]);

  const handleSelectHistory = useCallback((item: ScanHistoryItem) => {
    setResult({
      signal: item.signal,
      confidence: item.confidence,
      pair: item.pair,
      timeframe: item.timeframe,
      analysis: item.content,
    });
  }, []);

  const handleDeleteScan = useCallback(
    async (id: string) => {
      try {
        await deleteScanMutation.mutateAsync(id);
        toast.success("Scan deleted successfully");
      } catch (error) {
        console.error("Failed to delete scan:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete scan. Please try again.");
      }
    },
    [deleteScanMutation]
  );

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Navbar user={session?.user} />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-24 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI Chart Scanner
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="gradient-text glow-text">Trading Lens</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Snap or upload a forex chart and let our AI analyze it in real-time.
              Get instant BUY, SELL, or HOLD signals with voice guidance.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              {[
                { icon: Brain, label: "AI Analysis" },
                { icon: Zap, label: "Real-time" },
                { icon: Shield, label: "Secure" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 border border-primary/10 text-sm text-muted-foreground"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scanner */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <TradingScanner
          onImageCapture={handleImageCapture}
          onScanComplete={handleScanComplete}
          isAnalyzing={isAnalyzing}
          className="mb-8"
        />

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <ScanResult
                result={result}
                onSpeak={handleSpeak}
                isSpeaking={isSpeaking}
                isSupported={isSupported}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live region for scan completion announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {result &&
            `Analysis complete. Recommendation: ${result.signal?.toUpperCase() || "HOLD"} with ${result.confidence}% confidence.`}
        </div>

        {/* Empty state hint */}
        {!result && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-sm text-muted-foreground">
              Point your camera at a chart or upload a screenshot to begin scanning.
            </p>
          </motion.div>
        )}

        {/* Scan history gallery */}
        {isHistoryLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-5 rounded-full bg-primary/10 animate-pulse" />
              <div className="h-5 w-32 rounded bg-primary/10 animate-pulse" />
              <div className="ml-auto h-4 w-16 rounded bg-primary/10 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl border border-primary/10 bg-card/40 animate-pulse"
                />
              ))}
            </div>
          </motion.div>
        ) : scanHistory && scanHistory.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16"
          >
            <ScanHistoryGallery
              items={scanHistory}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteScan}
              isDeleting={deleteScanMutation.isPending}
            />
          </motion.div>
        ) : null}
      </div>

      {/* How it works */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Capture Chart",
              description: "Use your camera or upload a forex chart image directly from your device.",
            },
            {
              step: "02",
              title: "AI Scanning",
              description: "Our futuristic scanner processes patterns, levels, and momentum indicators.",
            },
            {
              step: "03",
              title: "Get Signal",
              description: "Receive a clear BUY, SELL, or HOLD recommendation with voice narration.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-2xl border border-primary/10 bg-card/30 backdrop-blur-sm"
            >
              <div className="text-4xl font-black text-primary/20 mb-3">{item.step}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}


