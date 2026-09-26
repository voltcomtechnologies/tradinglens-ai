"use client";

import { useRef, useEffect } from "react";
import { useChat, useTranscriptions } from "@livekit/components-react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, User, MessageSquare, Sparkles } from "lucide-react";

export function ChatTranscript() {
  const { chatMessages } = useChat();
  const transcriptions = useTranscriptions();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, transcriptions]);

  const hasMessages = chatMessages.length > 0 || transcriptions.length > 0;

  return (
    <div className="flex flex-col h-full rounded-3xl border border-white/[0.08] bg-[#060d1e]/90 backdrop-blur-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Top edge glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <MessageSquare className="h-3 w-3 text-primary" />
          </div>
          <h3 className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/35">
            Live Transcript
          </h3>
        </div>
        {hasMessages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-[10px] text-white/20"
          >
            <Sparkles className="h-2.5 w-2.5 text-primary/40" />
            Streaming
          </motion.div>
        )}
      </div>

      {/* Message Log */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="h-12 w-12 rounded-2xl bg-primary/[0.07] border border-primary/15 flex items-center justify-center mb-4"
            >
              <Brain className="h-5 w-5 text-primary/60" />
            </motion.div>
            <p className="text-xs font-medium text-white/30">Speak to start a conversation</p>
            <p className="text-[11px] mt-1.5 text-white/15 max-w-[160px] leading-relaxed">
              Transcripts stream here as you talk with Casey
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {/* LiveKit Transcriptions */}
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
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 text-xs ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isAgent
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_rgba(242,193,78,0.1)]"
                        : "bg-white/[0.05] text-white/50 border border-white/[0.08]"
                    }`}
                  >
                    {isAgent ? <Brain className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl p-3 ${
                      isAgent
                        ? "bg-[#0d1830] border border-white/[0.06] text-white/80 rounded-tl-md"
                        : "bg-primary/[0.07] border border-primary/10 text-white/70 rounded-tr-md"
                    }`}
                  >
                    <p className={`font-semibold text-[10px] mb-1 ${isAgent ? "text-primary/60" : "text-white/30"}`}>
                      {isAgent ? "Casey" : "You"}
                    </p>
                    <p className="leading-relaxed text-[12px]">{item.text}</p>
                  </div>
                </motion.div>
              );
            })}

            {/* LiveKit Chat Messages */}
            {chatMessages.map((msg) => {
              const isAgent = msg.from?.isAgent ?? false;
              return (
                <motion.div
                  key={`chat-${msg.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 text-xs ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isAgent
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_rgba(242,193,78,0.1)]"
                        : "bg-white/[0.05] text-white/50 border border-white/[0.08]"
                    }`}
                  >
                    {isAgent ? <Brain className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl p-3 ${
                      isAgent
                        ? "bg-[#0d1830] border border-white/[0.06] text-white/80 rounded-tl-md"
                        : "bg-primary/[0.07] border border-primary/10 text-white/70 rounded-tr-md"
                    }`}
                  >
                    <p className={`font-semibold text-[10px] mb-1 ${isAgent ? "text-primary/60" : "text-white/30"}`}>
                      {msg.from?.name || (isAgent ? "Casey" : "You")}
                    </p>
                    <p className="leading-relaxed text-[12px]">{msg.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom shimmer bar */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent shrink-0" />
    </div>
  );
}
