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
import { Bot, Radio, Sliders } from "lucide-react";
import { AgentControlBar } from "./agent-control-bar";
import { ChatTranscript } from "./chat-transcript";

interface SessionViewProps {
  serverUrl: string;
  token: string;
  onDisconnect: () => void;
}

function SessionInner({ onDisconnect }: { onDisconnect: () => void }) {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const [showTranscript, setShowTranscript] = useState(true);

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 space-y-4 flex flex-col h-[calc(100vh-6rem)] min-h-[620px]">
      {/* Top Header Bar matching agent-starter-react */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-cyan-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">Voice AI Agent</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>LiveKit WebRTC</span>
            </div>
          </div>
        </div>

        {/* Audio Device Selector dropdown & Agent State Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 [&_select]:bg-transparent [&_select]:text-zinc-200 [&_select]:outline-none">
            <Sliders className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <MediaDeviceSelect kind="audioinput" />
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-cyan-400">
            <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="capitalize">{agentState || "Listening..."}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Agent Visualizer Stage (Left) & Chat Transcript Drawer (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Agent Stage */}
        <div
          className={`flex flex-col h-full rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-2xl p-6 relative overflow-hidden justify-between shadow-2xl transition-all duration-300 ${
            showTranscript ? "lg:col-span-7" : "lg:col-span-12"
          }`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Video Tracks / Audio Visualizer Center */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 relative z-10">
            {tracks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full h-full max-h-[360px]">
                {tracks.map((track) => (
                  <div key={track.publication.trackSid} className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black">
                    <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full space-y-8">
                {/* Agent Animated Avatar */}
                <motion.div
                  animate={{
                    scale: agentState === "speaking" ? [1, 1.08, 1] : 1,
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center shadow-2xl shadow-cyan-500/20"
                >
                  <Bot className="h-14 w-14 text-cyan-400" />
                </motion.div>

                {/* LiveKit Bar Visualizer */}
                <div className="w-full max-w-md h-20 flex items-center justify-center">
                  <BarVisualizer
                    track={audioTrack}
                    state={agentState}
                    barCount={17}
                    options={{ minHeight: 10, maxHeight: 60 }}
                    className="h-16 w-full text-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Floating Control Bar */}
          <div className="z-10 flex justify-center pt-2">
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
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
