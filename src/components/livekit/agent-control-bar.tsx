"use client";

import { useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface AgentControlBarProps {
  onDisconnect: () => void;
  onToggleTranscript?: () => void;
  isTranscriptOpen?: boolean;
}

interface ControlButtonProps {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  title: string;
  children: React.ReactNode;
  pulse?: boolean;
}

function ControlButton({ onClick, active, danger, title, children, pulse }: ControlButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
        danger
          ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)] hover:shadow-[0_0_24px_rgba(239,68,68,0.45)]"
          : active
          ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 shadow-[0_0_12px_rgba(242,193,78,0.15)]"
          : "bg-white/[0.04] text-white/40 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70"
      }`}
    >
      {pulse && active && (
        <motion.div
          animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-full border border-primary/30"
        />
      )}
      {children}
    </motion.button>
  );
}

function Divider() {
  return <div className="h-6 w-px bg-white/[0.06] mx-0.5" />;
}

export function AgentControlBar({
  onDisconnect,
  onToggleTranscript,
  isTranscriptOpen = true,
}: AgentControlBarProps) {
  const micToggle = useTrackToggle({ source: Track.Source.Microphone });
  const cameraToggle = useTrackToggle({ source: Track.Source.Camera });
  const screenToggle = useTrackToggle({ source: Track.Source.ScreenShare });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 px-5 py-3 rounded-full border border-white/[0.08] bg-[#060d1e]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      {/* Microphone */}
      <ControlButton
        onClick={() => micToggle.toggle()}
        active={micToggle.enabled}
        danger={!micToggle.enabled}
        title={micToggle.enabled ? "Mute Microphone" : "Unmute Microphone"}
        pulse
      >
        {micToggle.enabled ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
      </ControlButton>

      {/* Camera */}
      <ControlButton
        onClick={() => cameraToggle.toggle()}
        active={cameraToggle.enabled}
        title={cameraToggle.enabled ? "Turn Off Camera" : "Turn On Camera"}
      >
        {cameraToggle.enabled ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
      </ControlButton>

      {/* Screen Share */}
      <ControlButton
        onClick={() => screenToggle.toggle()}
        active={screenToggle.enabled}
        title={screenToggle.enabled ? "Stop Sharing Screen" : "Share Chart Screen"}
        pulse={screenToggle.enabled}
      >
        {screenToggle.enabled ? <Monitor className="h-4.5 w-4.5" /> : <MonitorOff className="h-4.5 w-4.5" />}
      </ControlButton>

      {/* Transcript Toggle */}
      {onToggleTranscript && (
        <ControlButton
          onClick={onToggleTranscript}
          active={isTranscriptOpen}
          title="Toggle Transcript"
        >
          <MessageSquare className="h-4.5 w-4.5" />
        </ControlButton>
      )}

      <Divider />

      {/* End Call */}
      <ControlButton
        onClick={onDisconnect}
        danger
        title="End Session"
      >
        <PhoneOff className="h-4.5 w-4.5" />
      </ControlButton>
    </motion.div>
  );
}
