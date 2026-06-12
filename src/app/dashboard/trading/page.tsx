"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  Send,
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Camera,
  X,
  AlertTriangle,
  Zap,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useChatMessages, useSendMessage, useAnalyzeChart } from "@/lib/hooks/use-trading";
import { useSpeechSynthesis } from "@/lib/hooks/use-speech-synthesis";
import { MAJOR_PAIRS } from "@/types";
import { toast } from "sonner";

const QUICK_QUESTIONS = [
  { label: "Analyze EURUSD", prompt: "Analyze this EURUSD chart with technical indicators and key levels" },
  { label: "Support & Resistance", prompt: "Identify support and resistance levels for EURUSD" },
  { label: "Market Sentiment", prompt: "What's the current market sentiment for major pairs?" },
  { label: "Trade Opportunities", prompt: "Find trade opportunities on EURUSD with entry and stop levels" },
];

export default function TradingLensPage() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [selectedPair, setSelectedPair] = useState("EURUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1H");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const { data: messages, isLoading: messagesLoading } = useChatMessages(sessionId);
  const sendMessage = useSendMessage();
  const analyzeChart = useAnalyzeChart();
  const speech = useSpeechSynthesis();
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("tradinglens-auto-speak");
    return saved === null ? true : saved === "true";
  });

  // Persist auto-speak preference
  useEffect(() => {
    localStorage.setItem("tradinglens-auto-speak", String(autoSpeakEnabled));
  }, [autoSpeakEnabled]);

  const isProcessing = sendMessage.isPending || analyzeChart.isPending;

  const providerName = analyzeChart.data?.providerName ?? null;
  const aiUsed = analyzeChart.data?.aiUsed ?? false;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analyzeChart.data]);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const sendTextMessage = useCallback(async (message: string, imageUrl: string | null) => {
    await sendMessage.mutateAsync({
      role: "user",
      content: message,
      sessionId,
      metadata: imageUrl ? { imageUrl, pair: selectedPair, timeframe: selectedTimeframe } : { pair: selectedPair, timeframe: selectedTimeframe },
    });
    const result = await analyzeChart.mutateAsync({
      prompt: message,
      pair: selectedPair,
      timeframe: selectedTimeframe,
      image: undefined,
    });
    const assistantMsg = await sendMessage.mutateAsync({
      role: "assistant",
      content: result.content,
      sessionId,
      metadata: { analysisId: result.id },
    });
    if (autoSpeakEnabled) {
      setSpeakingMessageId(assistantMsg.id);
      speech.speak(result.content, () => setSpeakingMessageId(null));
    }
    setUploadedImage(null);
    setInput("");
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, [sendMessage, analyzeChart, sessionId, selectedPair, selectedTimeframe, setInput, setUploadedImage, speech, setSpeakingMessageId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    const userMessage = input.trim();
    setInput("");
    try {
      await sendTextMessage(userMessage, uploadedImage);
    } catch (err) {
      setInput(userMessage);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: () => sendTextMessage(userMessage, uploadedImage),
        },
      });
    }
  }, [input, isProcessing, sendTextMessage, uploadedImage]);

  const handleQuickQuestion = useCallback(async (prompt: string) => {
    if (isProcessing) return;
    try {
      await sendTextMessage(prompt, null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: () => sendTextMessage(prompt, null),
        },
      });
    }
  }, [isProcessing, sendTextMessage]);

  const sendImageMessage = useCallback(async (file: File) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const imageUrl = URL.createObjectURL(file);
    blobUrlRef.current = imageUrl;
    setUploadedImage(imageUrl);
    await sendMessage.mutateAsync({
      role: "user",
      content: `Analyze this ${selectedPair} ${selectedTimeframe} chart`,
      sessionId,
      metadata: { imageUrl, pair: selectedPair, timeframe: selectedTimeframe },
    });
    const result = await analyzeChart.mutateAsync({
      prompt: `Analyze this ${selectedPair} ${selectedTimeframe} chart`,
      pair: selectedPair,
      timeframe: selectedTimeframe,
      image: file,
    });
    const assistantMsg = await sendMessage.mutateAsync({
      role: "assistant",
      content: result.content,
      sessionId,
      metadata: { analysisId: result.id, imageUrl: result.imageUrl },
    });
    if (autoSpeakEnabled) {
      setSpeakingMessageId(assistantMsg.id);
      speech.speak(result.content, () => setSpeakingMessageId(null));
    }
    setUploadedImage(null);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, [selectedPair, selectedTimeframe, sendMessage, analyzeChart, sessionId, setUploadedImage, speech, setSpeakingMessageId]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFileRef.current = file;
    setIsUploading(true);
    try {
      await sendImageMessage(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: async () => {
            const retryFile = pendingFileRef.current;
            if (!retryFile) return;
            setIsUploading(true);
            try {
              await sendImageMessage(retryFile);
            } catch (retryErr) {
              const retryMsg = retryErr instanceof Error ? retryErr.message : "Retry failed";
              toast.error(retryMsg, {
                action: {
                  label: "Retry",
                  onClick: () => {
                    const f = pendingFileRef.current;
                    if (f) sendImageMessage(f);
                  },
                },
              });
            } finally {
              setIsUploading(false);
            }
          },
        },
      });
      setUploadedImage(null);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [sendImageMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Trading Lens</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered chart analysis and trade signals. Ask questions, upload charts, and get real-time market insights.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-3"
          >
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-muted text-sm rounded-lg px-3 py-1.5 border border-border outline-none"
            >
              {MAJOR_PAIRS.map((pair) => (
                <option key={pair.symbol} value={pair.symbol}>{pair.symbol}</option>
              ))}
            </select>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-muted text-sm rounded-lg px-3 py-1.5 border border-border outline-none"
            >
              {["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"].map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isProcessing}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Upload Chart
            </Button>

            {/* Right-aligned controls group */}
            <div className="ml-auto flex items-center gap-3 flex-wrap">
              {/* Auto-speak Toggle */}
              {speech.supported && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Auto-speak</span>
                  <Switch
                    checked={autoSpeakEnabled}
                    onCheckedChange={setAutoSpeakEnabled}
                    size="sm"
                  />
                </div>
              )}

              {/* Provider Status Badge */}
              {providerName && (
              <div
                className={cn(
                  "ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                  providerName === "Groq"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : providerName === "OpenRouter"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}
              >
                <Zap className="h-3 w-3" />
                {providerName}
                {!aiUsed && (
                  <span className="text-[10px] opacity-70 ml-0.5">(fallback)</span>
                )}
              </div>
            )}
            </div>
          </motion.div>

          {/* Uploaded image preview */}
          {uploadedImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="relative rounded-lg overflow-hidden border border-border max-h-48"
            >
              <img src={uploadedImage} alt="Uploaded chart" className="w-full h-48 object-contain bg-muted/30" />
              <button
                onClick={() => {
                  setUploadedImage(null);
                  if (blobUrlRef.current) {
                    URL.revokeObjectURL(blobUrlRef.current);
                    blobUrlRef.current = null;
                  }
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* Chat Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="h-[500px] lg:h-[600px] overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-1">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 border border-border"
                      )}
                    >
                      <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                        {msg.content.split("\n").map((line, i) => {
                          if (line.startsWith("## ")) {
                            return (
                              <h3 key={i} className="text-base font-bold text-primary mt-3 mb-2">
                                {line.replace("## ", "")}
                              </h3>
                            );
                          }
                          if (line.startsWith("### ")) {
                            return (
                              <h4 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1">
                                {line.replace("### ", "")}
                              </h4>
                            );
                          }
                          if (line.startsWith("| ")) {
                            return <p key={i} className="text-xs text-muted-foreground font-mono">{line}</p>;
                          }
                          if (line.startsWith("- **")) {
                            return <p key={i} className="text-xs text-foreground/80 ml-2">{line}</p>;
                          }
                          if (line.startsWith("> ")) {
                            return (
                              <p key={i} className="text-xs text-amber-400 italic bg-amber-500/5 -mx-2 px-2 py-1 rounded">
                                {line.replace("> ", "")}
                              </p>
                            );
                          }
                          if (line.trim() === "") return <br key={i} />;
                          return <p key={i} className="mb-1">{line}</p>;
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-[10px] text-muted-foreground opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                        {msg.role === "assistant" && speech.supported && (
                          <div className="flex items-center gap-1">
                            {speakingMessageId !== msg.id && (
                              <button
                                onClick={() => {
                                  setSpeakingMessageId(msg.id);
                                  speech.speak(msg.content, () => setSpeakingMessageId(null));
                                }}
                                className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                title="Speak analysis"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {speakingMessageId === msg.id && speech.isSpeaking && (
                              <button
                                onClick={() => speech.isPaused ? speech.resume() : speech.pause()}
                                className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                title={speech.isPaused ? "Resume" : "Pause"}
                              >
                                {speech.isPaused ? (
                                  <Play className="h-3 w-3" />
                                ) : (
                                  <Pause className="h-3 w-3" />
                                )}
                              </button>
                            )}
                            {speakingMessageId === msg.id && (
                              <button
                                onClick={() => {
                                  speech.stop();
                                  setSpeakingMessageId(null);
                                }}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                title="Stop speaking"
                              >
                                <VolumeX className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                        <span className="text-xs font-bold text-primary-foreground">
                          {msg.content.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 rounded-xl bg-primary/10 mb-4">
                    <Brain className="h-12 w-12 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ask the AI Trading Assistant</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Select a pair and timeframe, then ask a question or upload a chart screenshot for analysis.
                  </p>
                </div>
              )}

              {/* Loading indicator */}
              {isProcessing && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about any currency pair, pattern, or strategy..."
                  className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm outline-none resize-none min-h-[44px] max-h-[120px] placeholder:text-muted-foreground"
                  rows={1}
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  size="icon"
                  className="h-11 w-11 shrink-0"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h3 className="font-semibold text-sm mb-3">Quick Questions</h3>
            <div className="space-y-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q.prompt)}
                  disabled={isProcessing}
                  className="w-full text-left p-2.5 rounded-lg border border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50 transition-all text-xs disabled:opacity-50"
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{q.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h3 className="font-semibold text-sm mb-3">Analysis Features</h3>
            <div className="space-y-2">
              {[
                { icon: BarChart3, label: "Technical Analysis", desc: "Indicators & patterns" },
                { icon: TrendingUp, label: "Trade Signals", desc: "Entry/exit levels" },
                { icon: TrendingDown, label: "Risk Assessment", desc: "Stop loss & position size" },
                { icon: AlertTriangle, label: "Market Alerts", desc: "Key event tracking" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <feature.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{feature.label}</p>
                    <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h3 className="font-semibold text-sm mb-2">💡 Tips</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Upload a chart screenshot for detailed analysis</li>
              <li>• Ask about specific patterns or indicators</li>
              <li>• Compare multiple timeframes for confirmation</li>
              <li>• Check market sentiment before entering trades</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
