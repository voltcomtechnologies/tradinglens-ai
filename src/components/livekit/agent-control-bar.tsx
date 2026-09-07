"use client";

import { useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Monitor, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentControlBarProps {
  onDisconnect: () => void;
}

export function AgentControlBar({ onDisconnect }: AgentControlBarProps) {
  const micToggle = useTrackToggle({ source: Track.Source.Microphone });
  const cameraToggle = useTrackToggle({ source: Track.Source.Camera });
  const screenToggle = useTrackToggle({ source: Track.Source.ScreenShare });

  return (
    <div className="flex items-center justify-center gap-3 p-3 rounded-full bg-card/60 border border-primary/20 backdrop-blur-xl shadow-2xl">
      {/* Microphone Mute Toggle */}
      <Button
        variant={micToggle.enabled ? "default" : "destructive"}
        size="icon"
        onClick={() => micToggle.toggle()}
        className="h-12 w-12 rounded-full transition-all duration-300 shadow-md cursor-pointer"
        title={micToggle.enabled ? "Mute Microphone" : "Unmute Microphone"}
      >
        {micToggle.enabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      {/* Camera Video Toggle */}
      <Button
        variant={cameraToggle.enabled ? "secondary" : "outline"}
        size="icon"
        onClick={() => cameraToggle.toggle()}
        className="h-12 w-12 rounded-full transition-all duration-300 border-primary/20 hover:border-primary/50 cursor-pointer"
        title={cameraToggle.enabled ? "Turn Off Camera" : "Turn On Camera"}
      >
        {cameraToggle.enabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      {/* Screen / Chart Share Toggle */}
      <Button
        variant={screenToggle.enabled ? "secondary" : "outline"}
        size="icon"
        onClick={() => screenToggle.toggle()}
        className="h-12 w-12 rounded-full transition-all duration-300 border-primary/20 hover:border-primary/50 cursor-pointer"
        title={screenToggle.enabled ? "Stop Sharing Screen" : "Share Chart Screen"}
      >
        {screenToggle.enabled ? <Monitor className="h-5 w-5 text-primary" /> : <MonitorOff className="h-5 w-5" />}
      </Button>

      <div className="h-6 w-px bg-primary/20 mx-1" />

      {/* Disconnect Button */}
      <Button
        variant="destructive"
        size="icon"
        onClick={onDisconnect}
        className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-600/30 cursor-pointer"
        title="Disconnect Call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
