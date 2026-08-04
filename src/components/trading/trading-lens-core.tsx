"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { TradingScanner, type ScannerResult } from "@/components/trading/scanner";
import { ScanResult } from "@/components/trading/scan-result";
import { ScanHistoryGallery } from "@/components/trading/scan-history";
import { useAnalyzeChart, useScanHistory, useDeleteScan } from "@/lib/hooks/use-trading";
import { useVoice } from "@/lib/hooks/use-voice";
import { dataUrlToFile } from "@/lib/utils";
import { ChartInsightPanel } from "@/components/trading/chart-insight-panel";
import { ForexNewsTicker } from "@/components/trading/forex-news-ticker";
import { useTradingLensPrefs } from "@/lib/hooks/use-trading-lens-prefs";
import type { ScanHistoryItem } from "@/lib/hooks/use-trading";
import type { LiveChartHandle, LiveChartFeedStatus } from "@/components/trading/live-chart";
import type { Granularity } from "@/app/api/market/data/route";

// `lightweight-charts` reads `document` and creates a canvas at import time,
// so the LiveChart module has to be loaded off the SSR path. The dynamic
// wrapper does that AND surfaces a non-jarring placeholder so the layout
// doesn't shift visibly when the JS chunk arrives.
const LiveChart = dynamic(() => import("@/components/trading/live-chart"), {
  ssr: false,
  loading: () => (
    <div
      aria-label="Loading live chart"
      className="h-[360px] sm:h-[420px] w-full rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-xl animate-pulse"
    />
  ),
});

export function TradingLensCore() {
  const { data: session } = useSession();
  const [capturedImage, setCapturedImage] = useState<string | File | null>(null);
  const [result, setResult] = useState<ScannerResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Last-session prefs (symbol + timeframe + Narrator-enabled boolean)
  // are persisted via `useTradingLensPrefs` so a page refresh resumes
  // where the user left off. The hook guards against SSR/CSR
  // hydration mismatches by returning DEFAULTS on the first render
  // and swapping to the stored value inside a mount-only `useEffect`.
  const {
    hydrated: prefsHydrated,
    symbol: chartSymbol,
    granularity: chartGranularity,
    narratorEnabled,
    setSymbol: setChartSymbol,
    setGranularity: setChartGranularity,
    setNarratorEnabled,
  } = useTradingLensPrefs();
  const [chartStatus, setChartStatus] = useState<LiveChartFeedStatus>("loading");
  const chartHandleRef = useRef<LiveChartHandle | null>(null);

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

      // Use the in-focus pair + timeframe so Grok sees the user's actual
      // context. Before this fix the request hardcoded "EURUSD" / "1H",
      // so even when a user uploaded a USDJPY chart the LLM was told it
      // was a EURUSD 1H chart — Grok then reported wrong levels.
      // Timeframe is rendered uppercase ("1H" / "1D") to match the UI
      // pill labels shown above the live chart.
      // `Granularity` is the literal union "1h" | "1d", so the else
      // branch is statically "1D" — no `toUpperCase()` fallback needed.
      const timeframeLabel = chartGranularity === "1h" ? "1H" : "1D";

      const data = await analyzeMutation.mutateAsync({
        prompt: "Analyze this forex chart and provide a clear BUY, SELL, or HOLD recommendation with key levels and reasoning.",
        pair: chartSymbol,
        timeframe: timeframeLabel,
        image: imageFile,
      });

      const signal = data.signal || "hold";
      const confidence = data.confidence ?? 70;
      const scanResult: ScannerResult = {
        signal,
        confidence,
        pair: data.pair || chartSymbol,
        timeframe: data.timeframe || timeframeLabel,
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
  }, [capturedImage, analyzeMutation, isSupported, speak, chartSymbol, chartGranularity]);

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
    <div className="relative z-10 w-full">
      <TradingScanner
        onImageCapture={handleImageCapture}
        onScanComplete={handleScanComplete}
        isAnalyzing={isAnalyzing}
        className="mb-8"
      />

      {/* Live candle chart — observation path, sibling to the AI scan above.
          Bubbles symbol/status up via callbacks so the narrator panel and
          news ticker below can react to focus changes.
          `key` is keyed off the hydrated-vs-default flag AND the
          user-selected symbol/timeframe so the chart re-mounts once
          on hydration completion (default → persisted value) and again
          whenever the user picks a different pair. Lightweight Charts
          re-mount is fast (~150ms) and deterministic; the alternative
          (no key) would leave LiveChart rendering with `initialSymbol`
          set to whatever was passed on the FIRST render — the default
          — even though the user had selected e.g. GBPUSD previously. */}
      <div className="mb-8">
        <LiveChart
          key={
            prefsHydrated
              ? `${chartSymbol}|${chartGranularity}`
              : "__default__"
          }
          ref={chartHandleRef}
          initialSymbol={chartSymbol}
          initialGranularity={chartGranularity}
          onSymbolChange={(symbol, granularity) => {
            setChartSymbol(symbol);
            setChartGranularity(granularity);
          }}
          onStatusChange={setChartStatus}
        />
      </div>

      {/* Grok narrator — sits BELOW the chart so its content is always
          visible at the same scroll position as the candle stream the
          user is watching. */}
      <div className="mb-8" data-chart-status={chartStatus}>
        <ChartInsightPanel
          chartRef={chartHandleRef}
          symbol={chartSymbol}
          granularity={chartGranularity}
          enabled={narratorEnabled}
          onEnabledChange={setNarratorEnabled}
        />
      </div>

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
          className="text-center mt-8"
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
          className="mt-12"
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
          className="mt-12"
        >
          <ScanHistoryGallery
            items={scanHistory}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteScan}
            isDeleting={deleteScanMutation.isPending}
          />
        </motion.div>
      ) : null}

      {/* Bottom-scrolling Forex news ticker — sits at the END of the
          page content so it reads as "the last thing on the chart lens
          page" on both /lens (above the footer) and /dashboard (below
          the scan history). Internally re-fetches when `pair` changes. */}
      <div className="mt-12">
        <ForexNewsTicker pair={chartSymbol} />
      </div>
    </div>
  );
}
