"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  RefreshCw,
  Key,
  Globe,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCw,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GeminiRealtimeClient, type GeminiStatus } from "@/lib/gemini-realtime";
import type { StrategyResult } from "@/lib/strategy";

interface LiveCommentaryHudProps {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  timeframe: string;
  strategyResult: StrategyResult;
  autoStart?: boolean;
}

export function LiveCommentaryHud({
  symbol,
  currentPrice,
  priceChange,
  timeframe,
  strategyResult,
  autoStart = false,
}: LiveCommentaryHudProps) {
  const [status, setStatus] = useState<GeminiStatus>("disconnected");
  const [statusDetail, setStatusDetail] = useState<string>("Ready to start live commentary");
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [commentaryScript, setCommentaryScript] = useState<string>("");
  const [technicalSummary, setTechnicalSummary] = useState<string>("");
  const [fundamentalSummary, setFundamentalSummary] = useState<string>("");
  const [communitySentiment, setCommunitySentiment] = useState<string>("");
  const [headlines, setHeadlines] = useState<Array<{ title: string; link: string; source?: string }>>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ text: string; isUser: boolean; time: string }>>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // 5-Minute automated update & repetition state
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [autoCycleEnabled, setAutoCycleEnabled] = useState(true);
  const [isRepeatedBriefing, setIsRepeatedBriefing] = useState(false);

  const clientRef = useRef<GeminiRealtimeClient | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const prevSymbolRef = useRef(symbol);

  // Stored references to check if new information arrived over the 5-minute cycle
  const lastCommentaryScriptRef = useRef<string>("");
  const lastPriceRef = useRef<number | null>(null);
  const lastSignalTypeRef = useRef<string | null>(null);
  const lastHeadlinesRef = useRef<string[]>([]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // Natural browser speech fallback — strictly used when Gemini Realtime is not available
  const speakWithBrowserTts = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (isMuted) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current = utterance;

      // Pick best English voice to approximate Aoede
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.name.includes("Samantha") ||
            v.name.includes("Zira") ||
            v.name.includes("Victoria") ||
            (v.lang.startsWith("en") && v.name.includes("Female"))
        ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        setStatus("speaking");
        setStatusDetail("Speaking commentary (Browser Voice Fallback)...");
      };

      utterance.onend = () => {
        setStatus("ready");
        setStatusDetail("Commentary complete. Standing by for market updates.");
      };

      utterance.onerror = () => {
        setStatus("ready");
      };

      window.speechSynthesis.speak(utterance);
    },
    [isMuted]
  );

  // Fetch Grok technical + global fundamental & trading community analysis and speak it
  const generateAndSpeakCommentary = useCallback(
    async (targetSymbol: string, forceFallback = false, is5MinCycle = false) => {
      setIsLoadingAnalysis(true);
      setStatusDetail(
        is5MinCycle
          ? "Checking for new global Bloomberg wires, community chatter & price shifts..."
          : "Synthesizing global Bloomberg, community & technical analysis..."
      );

      try {
        const res = await fetch("/api/trading/chart-commentary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: targetSymbol,
            currentPrice,
            priceChange,
            timeframe,
            regime: strategyResult.marketRegime,
            activeSignal: strategyResult.activeSignal,
            signalsCount: strategyResult.signals.length,
            lastCommentaryScript: lastCommentaryScriptRef.current,
            lastPrice: lastPriceRef.current,
            lastSignalType: strategyResult.activeSignal?.type || null,
            lastHeadlines: lastHeadlinesRef.current,
            is5MinCycle,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setCommentaryScript(data.commentaryScript);
          setTechnicalSummary(data.technicalSummary);
          setFundamentalSummary(data.fundamentalSummary);
          setCommunitySentiment(data.communitySentiment || "");
          setHeadlines(data.headlines || []);
          setIsRepeatedBriefing(!!data.isRepeated);

          // Update previous references for next 5-minute cycle comparison
          lastCommentaryScriptRef.current = data.commentaryScript;
          lastPriceRef.current = currentPrice;
          lastSignalTypeRef.current = strategyResult.activeSignal?.type || null;
          lastHeadlinesRef.current = (data.headlines || []).map((h: any) => h.title);

          // Reset the 5-minute countdown clock
          setSecondsRemaining(300);

          setTranscript((prev) => [
            ...prev,
            {
              text: data.commentaryScript,
              isUser: false,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);

          // Make sure browser speech is stopped first
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }

          // Check if Gemini Realtime client is active or usable
          const hasGemini =
            !forceFallback &&
            !!clientRef.current &&
            (clientRef.current.getStatus() === "ready" ||
              clientRef.current.getStatus() === "speaking" ||
              clientRef.current.getStatus() === "listening" ||
              clientRef.current.getStatus() === "connecting");

          if (hasGemini && clientRef.current) {
            setIsFallbackMode(false);
            // If connecting, wait briefly for ready state
            if (clientRef.current.getStatus() === "connecting") {
              for (let i = 0; i < 25; i++) {
                if (clientRef.current.getStatus() !== "connecting") break;
                await new Promise((r) => setTimeout(r, 100));
              }
            }

            if (
              clientRef.current.getStatus() === "ready" ||
              clientRef.current.getStatus() === "speaking" ||
              clientRef.current.getStatus() === "listening"
            ) {
              const prompt = `As Aoede, deliver this live institutional trading floor commentary for ${targetSymbol} to the trader directly with your natural voice: ${data.commentaryScript}`;
              clientRef.current.sendTextMessage(prompt);
              return;
            }
          }

          // Only if Gemini is unavailable or failed, use browser TTS fallback
          setIsFallbackMode(true);
          speakWithBrowserTts(data.commentaryScript);
        }
      } catch (err) {
        console.error("Failed to generate commentary:", err);
        setStatusDetail("Commentary generation failed. Click refresh to retry.");
      } finally {
        setIsLoadingAnalysis(false);
      }
    },
    [currentPrice, priceChange, timeframe, strategyResult, speakWithBrowserTts]
  );

  // 5-Minute automated briefing interval timer
  useEffect(() => {
    if (status === "disconnected" || !autoCycleEnabled) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // 5 minutes reached: check for new information and repeat if none
          generateAndSpeakCommentary(symbol, isFallbackMode, true);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, autoCycleEnabled, symbol, isFallbackMode, generateAndSpeakCommentary]);

  // Initialize or connect Gemini Realtime Client
  const startRealtimeSession = useCallback(async () => {
    // Immediately stop any browser synthesis that might have been playing
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      // 1. Check if server has API key configured
      let apiKey = customApiKey.trim();
      if (!apiKey) {
        const keyRes = await fetch("/api/voice/gemini-session");
        const keyData = await keyRes.json();
        if (keyData.hasKey && keyData.apiKey) {
          apiKey = keyData.apiKey;
        }
      }

      if (!apiKey) {
        // Prompt for key and run in fallback mode
        setShowKeyModal(true);
        setIsFallbackMode(true);
        setStatus("ready");
        setStatusDetail("Running in fallback voice mode (No Gemini Key)");
        await generateAndSpeakCommentary(symbol, true);
        return;
      }

      setStatus("connecting");
      setStatusDetail("Connecting to Google Gemini Realtime (Aoede)...");

      // Initialize Gemini Realtime client
      const client = new GeminiRealtimeClient({
        apiKey,
        modelId: "gemini-3.1-flash-live-preview",
        voiceName: "Aoede",
        systemInstruction: `You are Aoede, an elite institutional trading floor voice analyst on TradingLens AI.
You deliver real-time, live voice market commentary on candlestick charts and currency pairs.
Whenever the trader asks you questions, you answer them directly, concisely, and authoritatively.
Always balance technical signals (EMA, Bollinger, RSI, SL, TP) with fundamental macroeconomic forces (interest rates, central banks, economic data).`,
        onStatusChange: (newStatus, detail) => {
          setStatus(newStatus);
          if (detail) setStatusDetail(detail);
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
        onTranscript: (text, isUser) => {
          setTranscript((prev) => [
            ...prev,
            {
              text,
              isUser,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        },
        onError: (err) => {
          console.error("Gemini Realtime Client error:", err);
          setIsFallbackMode(true);
          setStatusDetail("Gemini connection error. Browser voice fallback active.");
          if (lastCommentaryScriptRef.current) {
            speakWithBrowserTts(lastCommentaryScriptRef.current);
          }
        },
      });

      clientRef.current = client;
      await client.connect();

      setIsFallbackMode(false);
      setStatus("ready");
      setStatusDetail("Gemini 3.1 Flash Live (Aoede) active • 5m automated cycle ON");

      // Trigger initial commentary exclusively through Gemini Aoede
      await generateAndSpeakCommentary(symbol, false);
    } catch (err) {
      console.warn("Gemini connection failed, switching to browser TTS fallback:", err);
      clientRef.current = null;
      setIsFallbackMode(true);
      setStatus("ready");
      setStatusDetail("Gemini unavailable. Running in browser voice fallback.");
      await generateAndSpeakCommentary(symbol, true);
    }
  }, [customApiKey, generateAndSpeakCommentary, symbol]);

  const stopSession = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus("disconnected");
    setStatusDetail("Live commentary paused");
    setIsMicOn(false);
    setIsFallbackMode(false);
    setSecondsRemaining(300);
    setIsRepeatedBriefing(false);
  };

  const toggleMic = async () => {
    if (!clientRef.current) {
      await startRealtimeSession();
    }
    if (clientRef.current) {
      if (isMicOn) {
        clientRef.current.stopMicrophone();
        setIsMicOn(false);
      } else {
        try {
          await clientRef.current.startMicrophone();
          setIsMicOn(true);
        } catch {
          setIsMicOn(false);
        }
      }
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (clientRef.current) {
      clientRef.current.setMuted(next);
    }
    if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Re-analyze when currency pair changes (prevSymbolRef guards against status changes)
  useEffect(() => {
    if (prevSymbolRef.current !== symbol) {
      prevSymbolRef.current = symbol;
      if (status !== "disconnected") {
        generateAndSpeakCommentary(symbol, isFallbackMode);
      }
    }
  }, [symbol, generateAndSpeakCommentary, status, isFallbackMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="rounded-[22px] border border-cyan-500/20 bg-gradient-to-r from-[#0b172d]/95 via-[#0d1f3d]/90 to-[#0b172d]/95 backdrop-blur-md p-4 sm:p-5 shadow-[0_4px_24px_rgba(6,182,212,0.08)]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
            <Radio className="h-5 w-5 animate-pulse text-cyan-400" />
            {status === "speaking" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Live AI Voice Commentary</span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors",
                  isFallbackMode
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                )}
              >
                {isFallbackMode ? "Browser Voice (Fallback)" : 'Gemini 3.1 Flash Live • Voice "Aoede"'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-white">
                {symbol} Market & Macro Narrative
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span className="text-xs text-white/50">{statusDetail}</span>
            </div>
          </div>
        </div>

        {/* Audio Waveform & Action Controls */}
        <div className="flex items-center gap-2">
          {/* 5-Minute Auto-Briefing Countdown */}
          {status !== "disconnected" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-950/40 text-[11px] font-mono text-cyan-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Next: {formatTime(secondsRemaining)}</span>
              <button
                onClick={() => setAutoCycleEnabled(!autoCycleEnabled)}
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer",
                  autoCycleEnabled
                    ? "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
                    : "bg-white/10 text-white/40 hover:bg-white/20"
                )}
                title={autoCycleEnabled ? "5-minute interval active. Click to pause" : "Auto-cycle paused. Click to resume"}
              >
                {autoCycleEnabled ? "5m Auto" : "Paused"}
              </button>
            </div>
          )}

          {/* Animated Waveform Visualizer */}
          {status === "speaking" || isMicOn ? (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
              {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3].map((height, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-cyan-400"
                  animate={{
                    height: status === "speaking" ? [6, 18 * height, 6] : [4, 12, 4],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6 + i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
              <span className="text-[10px] font-mono font-bold text-cyan-300 ml-1.5">
                {status === "speaking" ? "AOEDE SPEAKING" : "LISTENING"}
              </span>
            </div>
          ) : null}

          {/* Main Play / Stop Button */}
          {status === "disconnected" ? (
            <button
              onClick={startRealtimeSession}
              disabled={isLoadingAnalysis}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              {isLoadingAnalysis ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
              Start Live Voice Commentary
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              Stop Commentary
            </button>
          )}

          {/* Mic Toggle Button */}
          <button
            onClick={toggleMic}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition-colors cursor-pointer",
              isMicOn
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                : "border-white/10 bg-white/5 text-white/50 hover:text-white"
            )}
            title={isMicOn ? "Microphone On (Speak to Gemini)" : "Turn on Microphone"}
          >
            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition-colors cursor-pointer",
              isMuted
                ? "border-amber-400/40 bg-amber-500/20 text-amber-300"
                : "border-white/10 bg-white/5 text-white/50 hover:text-white"
            )}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Refresh Commentary */}
          <button
            onClick={() => generateAndSpeakCommentary(symbol)}
            disabled={isLoadingAnalysis}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Refresh Commentary & News"
          >
            <RefreshCw className={cn("h-4 w-4", isLoadingAnalysis && "animate-spin")} />
          </button>

          {/* Configure Key */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Configure Gemini API Key"
          >
            <Key className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Live Narrative Briefing Cards */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Technical Confluence Section */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Technical Strategy Perspective
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            {technicalSummary || "Analyzing candlestick geometry, EMA 9/21 cross, Bollinger Bands volatility, and risk brackets..."}
          </p>
        </div>

        {/* Global Wires & Community Intelligence Section */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <Globe className="h-3.5 w-3.5" /> Global Wires & Community Intel
            </div>
            <span className="text-[10px] text-white/40 font-mono">Bloomberg • FinTwit • Reddit</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            {fundamentalSummary || `Tracking global central bank monetary policy differentials and news for ${symbol}.`}
          </p>
          {communitySentiment && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-md px-2 py-1">
              <Users className="h-3 w-3 shrink-0" />
              <span className="truncate">{communitySentiment}</span>
            </div>
          )}
          {headlines.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-white/5 pt-1.5">
              {headlines.slice(0, 2).map((h, i) => (
                <div key={i} className="text-[11px] text-white/60 truncate flex items-center gap-1.5">
                  <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white/70 shrink-0">
                    {h.source || "Global Wire"}
                  </span>
                  <span className="truncate">&ldquo;{h.title}&rdquo;</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spoken Commentary Script / Transcript Toggle */}
      {commentaryScript && (
        <div className="mt-3 pt-2 border-t border-white/5">
          {isRepeatedBriefing && (
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-400/30 bg-amber-400/10 text-[11px] text-amber-200">
              <RotateCw className="h-3 w-3 text-amber-300 shrink-0" />
              <span>Market unchanged over past 5 min • Repeating previous briefing</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/70 italic line-clamp-2 pr-4">
              &ldquo;{commentaryScript}&rdquo;
            </p>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 shrink-0 cursor-pointer"
            >
              {showTranscript ? "Hide Transcript" : "Full Transcript"}
            </button>
          </div>
        </div>
      )}

      {/* Transcript Drawer */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#070e1c] p-3"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white/60 mb-2">
              <span>Live Commentary Transcript Log</span>
              <span className="text-[10px] text-white/40">Voice: Aoede</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {transcript.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-2 rounded-lg",
                    item.isUser
                      ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 ml-4"
                      : "bg-white/[0.03] border border-white/5 text-white/80 mr-4"
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                    <span>{item.isUser ? "Trader (Mic Input)" : "Aoede (Gemini Live)"}</span>
                    <span>{item.time}</span>
                  </div>
                  <p className="leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini API Key Configuration Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d182e] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-300">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Gemini Realtime Voice</h3>
                  <p className="text-xs text-white/50">Model: gemini-3.1-flash-live-preview • Voice: Aoede</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-white/70 leading-relaxed">
                Enter your Google Gemini API Key below to stream native bidirectional multimodal audio with Aoede.
                You can get an API key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Google AI Studio</a>.
              </p>

              <div className="mt-4">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (customApiKey.trim()) {
                      await fetch("/api/voice/gemini-session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ apiKey: customApiKey }),
                      });
                    }
                    setShowKeyModal(false);
                    startRealtimeSession();
                  }}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-400 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Connect Realtime Voice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
