"use client";

import { useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentControlBarProps {
  onDisconnect: () => void;
  onToggleTranscript?: () => void;
  isTranscriptOpen?: boolean;
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
    <div className="flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-zinc-950/90 border border-zinc-800 backdrop-blur-2xl shadow-2xl">
      {/* Microphone Mute Toggle */}
      <Button
        variant={micToggle.enabled ? "default" : "destructive"}
        size="icon"
        onClick={() => micToggle.toggle()}
        className={`h-11 w-11 rounded-full transition-all duration-200 cursor-pointer ${
          micToggle.enabled
            ? "bg-zinc-800 hover:bg-zinc-700 text-cyan-400"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
        title={micToggle.enabled ? "Mute Microphone" : "Unmute Microphone"}
      >
        {micToggle.enabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      {/* Camera Video Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => cameraToggle.toggle()}
        className={`h-11 w-11 rounded-full transition-all duration-200 cursor-pointer ${
          cameraToggle.enabled
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
        }`}
        title={cameraToggle.enabled ? "Turn Off Camera" : "Turn On Camera"}
      >
        {cameraToggle.enabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      {/* Screen Share Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => screenToggle.toggle()}
        className={`h-11 w-11 rounded-full transition-all duration-200 cursor-pointer ${
          screenToggle.enabled
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
        }`}
        title={screenToggle.enabled ? "Stop Sharing Screen" : "Share Chart Screen"}
      >
        {screenToggle.enabled ? <Monitor className="h-5 w-5" /> : <MonitorOff className="h-5 w-5" />}
      </Button>

      {/* Transcript Drawer Toggle */}
      {onToggleTranscript && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTranscript}
          className={`h-11 w-11 rounded-full transition-all duration-200 cursor-pointer ${
            isTranscriptOpen
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
              : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
          }`}
          title="Toggle Transcript Drawer"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      <div className="h-6 w-px bg-zinc-800 mx-1" />

      {/* End Call / Disconnect Button */}
      <Button
        variant="destructive"
        size="icon"
        onClick={onDisconnect}
        className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg shadow-red-600/20 cursor-pointer"
        title="End Call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
