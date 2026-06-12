"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechSynthesisReturn {
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  supported: boolean;
}

const MALE_VOICE_PATTERNS = [
  "male",
  "daniel",
  "david",
  "tom",
  "alex",
  "james",
  "john",
  "mark",
  "paul",
  "richard",
  "simon",
  "william",
  "matthew",
  "christopher",
  "joseph",
  "michael",
  "george",
  "henry",
  "sam",
  "fred",
  "guy",
  "gordon",
  "lee",
  "tony",
];

/**
 * Strips markdown formatting so TTS reads plain text naturally.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^##\s+/gm, "")
    .replace(/^###\s+/gm, "")
    .replace(/^\|\s+/gm, "")
    .replace(/^-\s*\*\*\s*/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\|/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Prefer English voices first
  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const candidates = englishVoices.length > 0 ? englishVoices : voices;

  // Sort by likelihood of being male: exact match first, partial match second
  const scored = candidates.map((voice) => {
    const nameLang = `${voice.name} ${voice.lang}`.toLowerCase();
    let score = 0;
    for (const pattern of MALE_VOICE_PATTERNS) {
      if (nameLang.includes(pattern)) score += 1;
    }
    return { voice, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best && best.score > 0) {
    return best.voice;
  }

  // Fallback: return the first English voice or first available
  return englishVoices[0] || voices[0] || null;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [supported, setSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && !voiceRef.current) {
        voiceRef.current = findMaleVoice(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!supported || !window.speechSynthesis || !text.trim()) return;

    // Stop any current speech and detach old handlers to prevent race conditions
    const old = utteranceRef.current;
    if (old) {
      old.onend = null;
      old.onerror = null;
    }
    window.speechSynthesis.cancel();

    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    // TTS parameters for a natural male voice feel
    utterance.pitch = 0.85;   // slightly lower pitch for male voice
    utterance.rate = 0.95;    // slightly slower for clarity
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      onEnd?.();
    };

    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported || !window.speechSynthesis) return;
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [supported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (!supported || !window.speechSynthesis) return;
    if (isPaused) {
      window.speechSynthesis.resume();
    }
  }, [supported, isPaused]);

  return { speak, stop, pause, resume, isSpeaking, isPaused, supported };
}
