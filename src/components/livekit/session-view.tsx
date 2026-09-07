"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { motion } from "framer-motion";
import { Bot, Radio, Wifi } from "lucide-react";
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

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Top Session Status Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">TradingLens Voice Room</h2>
            <p className="text-xs text-muted-foreground">Connected to LiveKit Cloud WebRTC</p>
          </div>
        </div>

        {/* Agent State Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span className="capitalize">{agentState || "Listening..."}</span>
        </div>
      </div>

      {/* Main Grid: Visualizer + Video (Left) | Transcript (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[560px]">
        {/* Left Stage (Visualizer & Video) */}
        <div className="lg:col-span-7 flex flex-col h-full rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-xl p-6 relative overflow-hidden justify-between">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Avatar Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">AI Voice Trader</h3>
                <p className="text-xs text-muted-foreground">Forex Market Intelligence Partner</p>
              </div>
            </div>
            <Wifi className="h-4 w-4 text-emerald-400" />
          </div>

          {/* Video Tracks / Audio Visualizer Center */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 relative z-10">
            {tracks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full h-full max-h-[300px]">
                {tracks.map((track) => (
                  <div key={track.publication.trackSid} className="relative rounded-2xl overflow-hidden border border-primary/20 bg-black/60">
                    <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full space-y-6">
                <motion.div
                  animate={{
                    scale: agentState === "speaking" ? [1, 1.08, 1] : 1,
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-2xl shadow-primary/20"
                >
                  <Bot className="h-12 w-12 text-primary" />
                </motion.div>

                {/* LiveKit Audio Visualizer Bar */}
                <div className="w-full max-w-sm h-16 flex items-center justify-center">
                  <BarVisualizer
                    track={audioTrack}
                    state={agentState}
                    barCount={15}
                    options={{ minHeight: 8, maxHeight: 48 }}
                    className="h-12 w-full text-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="z-10 flex justify-center pt-2">
            <AgentControlBar onDisconnect={onDisconnect} />
          </div>
        </div>

        {/* Right Stage (Live Transcript Stream) */}
        <div className="lg:col-span-5 h-full">
          <ChatTranscript />
        </div>
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
      className="w-full"
    >
      <RoomAudioRenderer />
      <SessionInner onDisconnect={onDisconnect} />
    </LiveKitRoom>
  );
}
