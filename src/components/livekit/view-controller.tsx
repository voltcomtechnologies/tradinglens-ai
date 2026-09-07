"use client";

import { useState, useEffect, useCallback } from "react";
import { WelcomeView } from "./welcome-view";
import { SessionView } from "./session-view";

export function ViewController() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check connection details readiness on load
  useEffect(() => {
    fetch("/api/connection-details")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.isConfigured === "boolean") {
          setIsConfigured(data.isConfigured);
        }
      })
      .catch(() => {
        // Soft fallback
      });
  }, []);

  const handleStartSession = useCallback(async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/connection-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: `Trader_${Math.random().toString(36).substring(2, 6)}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || "Failed to generate connection token");
      }

      if (!data.participantToken) {
        setIsConfigured(false);
        throw new Error(
          data.message || "LiveKit credentials are not configured in environment variables."
        );
      }

      setServerUrl(data.serverUrl);
      setToken(data.participantToken);
      setIsConnected(true);
    } catch (err) {
      console.error("LiveKit connection error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to connect to Voice Room.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setToken("");
    setServerUrl("");
  }, []);

  if (isConnected && serverUrl && token) {
    return (
      <SessionView
        serverUrl={serverUrl}
        token={token}
        onDisconnect={handleDisconnect}
      />
    );
  }

  return (
    <WelcomeView
      onStartSession={handleStartSession}
      isConnecting={isConnecting}
      isConfigured={isConfigured}
      errorMessage={errorMessage}
    />
  );
}
