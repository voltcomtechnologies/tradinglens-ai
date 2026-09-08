"use client";

import { useRef, useEffect } from "react";
import { useChat, useTranscriptions } from "@livekit/components-react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, MessageSquare } from "lucide-react";

export function ChatTranscript() {
  const { chatMessages } = useChat();
  const transcriptions = useTranscriptions();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new speech/chat arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, transcriptions]);

  const hasMessages = chatMessages.length > 0 || transcriptions.length > 0;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-xl p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-primary/10">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Live AI Transcript Stream
        </h3>
      </div>

      {/* Message Log */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/60 py-8">
            <Bot className="h-8 w-8 mb-2 text-primary/40 animate-pulse" />
            <p className="text-xs">Speak into your mic to talk with the AI Voice Trader</p>
            <p className="text-[10px] mt-1 text-muted-foreground/40">Transcripts will stream here in real time</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {/* Livekit Transcriptions */}
            {transcriptions.map((t, idx) => {
              const item = t as unknown as {
                id?: string;
                text?: string;
                participant?: { isAgent?: boolean };
                streamInfo?: { participant?: { isAgent?: boolean } };
              };
              const isAgent = item.participant?.isAgent ?? item.streamInfo?.participant?.isAgent ?? true;
              return (
                <motion.div
                  key={`transcription-${item.id || idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 text-xs ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      isAgent
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-accent/20 text-accent border border-accent/30"
                    }`}
                  >
                    {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      isAgent
                        ? "bg-card/80 border border-primary/10 text-foreground"
                        : "bg-primary/15 border border-primary/20 text-primary-foreground"
                    }`}
                  >
                    <p className="font-semibold text-[10px] opacity-70 mb-0.5">
                      {isAgent ? "TradingLens Voice Agent" : "You"}
                    </p>
                    <p className="leading-relaxed">{item.text}</p>
                  </div>
                </motion.div>
              );
            })}

            {/* Livekit Chat Messages */}
            {chatMessages.map((msg) => {
              const isAgent = msg.from?.isAgent ?? false;
              return (
                <motion.div
                  key={`chat-${msg.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 text-xs ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      isAgent
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-accent/20 text-accent border border-accent/30"
                    }`}
                  >
                    {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      isAgent
                        ? "bg-card/80 border border-primary/10 text-foreground"
                        : "bg-primary/15 border border-primary/20 text-primary-foreground"
                    }`}
                  >
                    <p className="font-semibold text-[10px] opacity-70 mb-0.5">
                      {msg.from?.name || (isAgent ? "Voice Agent" : "You")}
                    </p>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
