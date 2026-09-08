"use client";

import { useRef, useEffect } from "react";
import { useChat, useTranscriptions } from "@livekit/components-react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, MessageSquare } from "lucide-react";

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
    <div className="flex flex-col h-full rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-2xl p-4 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800/80">
        <MessageSquare className="h-4 w-4 text-cyan-400" />
        <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
          Live Agent Transcripts
        </h3>
      </div>

      {/* Message Log */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 py-8">
            <Bot className="h-8 w-8 mb-2 text-cyan-500/40 animate-pulse" />
            <p className="text-xs text-zinc-400 font-medium">Speak into your mic to start</p>
            <p className="text-[11px] mt-1 text-zinc-600">Transcripts stream here in real time</p>
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
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      isAgent
                        ? "bg-zinc-900 border border-zinc-800 text-zinc-100"
                        : "bg-cyan-950/60 border border-cyan-800/40 text-cyan-100"
                    }`}
                  >
                    <p className="font-semibold text-[10px] text-zinc-400 mb-0.5">
                      {isAgent ? "Voice Assistant" : "You"}
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
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      isAgent
                        ? "bg-zinc-900 border border-zinc-800 text-zinc-100"
                        : "bg-cyan-950/60 border border-cyan-800/40 text-cyan-100"
                    }`}
                  >
                    <p className="font-semibold text-[10px] text-zinc-400 mb-0.5">
                      {msg.from?.name || (isAgent ? "Voice Assistant" : "You")}
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
