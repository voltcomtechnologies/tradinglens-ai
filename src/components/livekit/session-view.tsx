"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  VideoTrack,
  useTracks,
  MediaDeviceSelect,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Radio,
  Sliders,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Activity,
  Zap,
} from "lucide-react";
import { AgentControlBar } from "./agent-control-bar";
import { ChatTranscript } from "./chat-transcript";

interface SessionViewProps {
  serverUrl: string;
  token: string;
  onDisconnect: () => void;
}

// State pill with animated indicator
function StatePill({ state }: { state: string }) {
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-500 ${
        isSpeaking
          ? "bg-primary/10 border-primary/30 text-primary"
          : isListening
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-white/[0.04] border-white/10 text-white/40"
      }`}
    >
      <motion.div
        animate={
          isSpeaking
            ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
            : isListening
            ? { scale: [1, 1.2, 1] }
            : {}
        }
        transition={{ repeat: Infinity, duration: 1.2 }}
        className={`h-1.5 w-1.5 rounded-full ${
          isSpeaking ? "bg-primary" : isListening ? "bg-emerald-400" : "bg-white/20"
        }`}
      />
      <span className="capitalize">{state || "Initialising..."}</span>
    </div>
  );
}

function SessionInner({ onDisconnect }: { onDisconnect: () => void }) {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const [showTranscript, setShowTranscript] = useState(true);

  const isSpeaking = agentState === "speaking";

  return (
    <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-4 flex flex-col gap-4 h-[calc(100vh-9rem)] min-h-[640px]">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/[0.08] bg-[#060d1e]/90 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shrink-0">
        {/* Left: Agent identity */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative h-11 w-11 shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/25 via-[#0d1830] to-cyan-500/15 border border-primary/20" />
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute inset-0 rounded-xl flex items-center justify-center"
            >
              <Brain className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(242,193,78,0.5)]" />
            </motion.div>
            {/* Speaking ring */}
            {isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-[-4px] rounded-xl border border-primary/30"
              />
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              Casey-367{" "}
              <span className="text-[10px] font-normal text-white/30">· AI Trading Partner</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-white/35">LiveKit WebRTC · Active Session</span>
            </div>
          </div>
        </div>

        {/* Right: State + device selector */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-white/40 [&_select]:bg-transparent [&_select]:text-white/60 [&_select]:outline-none [&_select]:text-xs">
            <Sliders className="h-3 w-3 text-primary/60 shrink-0" />
            <MediaDeviceSelect kind="audioinput" />
          </div>

          <StatePill state={agentState || ""} />
        </div>
      </div>

      {/* ── Main Stage ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Agent / Video Stage */}
        <div
          className={`flex flex-col rounded-3xl border border-white/[0.08] bg-[#060d1e]/90 backdrop-blur-2xl relative overflow-hidden shadow-[0_0_80px_-20px_rgba(242,193,78,0.06),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 ${
            showTranscript ? "lg:col-span-7" : "lg:col-span-12"
          }`}
        >
          {/* Top edge glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Ambient background glow */}
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              animate={isSpeaking ? { opacity: [0.4, 0.9, 0.4] } : { opacity: 0.4 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle,rgba(242,193,78,0.06),transparent_65%)]"
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-48 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.04),transparent_60%)]" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
            {tracks.length > 0 ? (
              /* ── Shared Video Tracks ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full h-full max-h-[400px]">
                {tracks.map((track) => (
                  <div
                    key={track.publication.trackSid}
                    className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black shadow-inner"
                  >
                    <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                    {/* Track label */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] text-white/60 border border-white/10">
                      <Activity className="h-2.5 w-2.5 text-primary" />
                      Screen Share
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ── Audio-only: Holographic avatar + visualizer ── */
              <div className="flex flex-col items-center justify-center w-full gap-8 py-4">
                {/* Holographic avatar */}
                <div className="relative flex items-center justify-center">
                  <div className="relative h-36 w-36 sm:h-44 sm:w-44">
                    {/* Pulse rings */}
                    {isSpeaking && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 rounded-full border border-primary/40"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.25, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                          className="absolute inset-0 rounded-full border border-primary/20"
                        />
                        <motion.div
                          animate={{ scale: [1, 2.1], opacity: [0.15, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}
                          className="absolute inset-0 rounded-full border border-primary/10"
                        />
                      </>
                    )}

                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary/15 bg-gradient-to-br from-primary/[0.05] to-cyan-500/[0.04]" />
                    <div className="absolute inset-[10px] rounded-full border border-white/[0.05] bg-gradient-to-br from-[#0d1830] to-[#060d1e]" />

                    {/* Core */}
                    <motion.div
                      animate={
                        isSpeaking
                          ? { scale: [1, 1.06, 1], boxShadow: ["0 0 20px rgba(242,193,78,0.1)", "0 0 50px rgba(242,193,78,0.25)", "0 0 20px rgba(242,193,78,0.1)"] }
                          : { scale: 1 }
                      }
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-[20px] rounded-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-[#080f20] to-cyan-500/[0.07] shadow-[inset_0_0_30px_rgba(242,193,78,0.06)]"
                    >
                      <motion.div
                        animate={{ rotate: isSpeaking ? [0, 10, -10, 0] : 0 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      >
                        <Brain className="h-12 w-12 sm:h-14 sm:w-14 text-primary drop-shadow-[0_0_14px_rgba(242,193,78,0.5)]" />
                      </motion.div>
                    </motion.div>

                    {/* Orbiting dots */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                      className="absolute inset-0"
                    >
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(242,193,78,0.9)]" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                      className="absolute inset-3"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
                    </motion.div>
                  </div>
                </div>

                {/* State label */}
                <motion.div
                  key={agentState}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <p className="text-sm font-bold text-white/70 capitalize">
                    {isSpeaking ? "Casey is speaking..." : agentState === "listening" ? "Listening to you..." : agentState || "Connecting..."}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-white/25">
                    <Zap className="h-3 w-3 text-primary/40" />
                    Share your screen to show Casey a chart
                  </div>
                </motion.div>

                {/* BarVisualizer — untouched LiveKit component */}
                <div className="w-full max-w-sm h-20 flex items-center justify-center px-4">
                  <BarVisualizer
                    track={audioTrack}
                    state={agentState}
                    barCount={21}
                    options={{ minHeight: 4, maxHeight: 56 }}
                    className="h-16 w-full text-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Control Bar ── */}
          <div className="z-10 flex justify-center pb-5 px-4 shrink-0">
            <AgentControlBar
              onDisconnect={onDisconnect}
              onToggleTranscript={() => setShowTranscript((prev) => !prev)}
              isTranscriptOpen={showTranscript}
            />
          </div>
        </div>

        {/* Chat Transcript Drawer */}
        <AnimatePresence mode="wait">
          {showTranscript && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-5 h-full min-h-0"
            >
              <ChatTranscript />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function SessionView({ serverUrl, token, onDisconnect }: SessionViewProps) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
      data-lk-theme="default"
      className="w-full h-full"
    >
      <RoomAudioRenderer />
      <SessionInner onDisconnect={onDisconnect} />
    </LiveKitRoom>
  );
}
