"use client";

/**
 * Gemini Realtime Multimodal Live Audio Client
 * Connects directly to Google's BidiGenerateContent WebSocket
 * Model: gemini-3.1-flash-live-preview (fallback to gemini-2.0-flash-exp)
 * Voice: Aoede
 * Audio Input: 16kHz PCM from browser microphone
 * Audio Output: 24kHz PCM to Web Audio API
 */

export interface GeminiRealtimeConfig {
  apiKey: string;
  modelId?: string;
  voiceName?: string;
  systemInstruction?: string;
  onStatusChange?: (status: GeminiStatus, detail?: string) => void;
  onAudioLevel?: (level: number) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
  onError?: (err: Error) => void;
}

export type GeminiStatus =
  | "disconnected"
  | "connecting"
  | "ready"
  | "speaking"
  | "listening"
  | "error";

export class GeminiRealtimeClient {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private nextPlayTime = 0;
  private isMuted = false;
  private isMicActive = false;
  private isSetupComplete = false;
  private pendingTextMessage: string | null = null;
  private setupTimer: ReturnType<typeof setTimeout> | null = null;
  private connectResolver: (() => void) | null = null;
  private connectRejecter: ((err: Error) => void) | null = null;
  private status: GeminiStatus = "disconnected";
  private config: GeminiRealtimeConfig;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(config: GeminiRealtimeConfig) {
    this.config = config;
  }

  public getStatus(): GeminiStatus {
    return this.status;
  }

  private setStatus(status: GeminiStatus, detail?: string) {
    this.status = status;
    this.config.onStatusChange?.(status, detail);
  }

  /**
   * Connect to Google Gemini Realtime Live WebSocket
   */
  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const apiKey = this.config.apiKey?.trim().replace(/[\\"\s]/g, "");
    if (!apiKey) {
      throw new Error("Gemini API key is required to connect to Gemini Realtime.");
    }

    this.setStatus("connecting");
    this.isSetupComplete = false;

    // Initialize Web Audio Output Context
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }
    this.nextPlayTime = this.audioCtx.currentTime;

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    return new Promise((resolve, reject) => {
      this.connectResolver = resolve;
      this.connectRejecter = reject;

      // Timeout safety: if setupComplete doesn't arrive within 10 seconds, reject cleanly
      if (this.setupTimer) {
        clearTimeout(this.setupTimer);
      }
      this.setupTimer = setTimeout(() => {
        if (!this.isSetupComplete) {
          const err = new Error("Gemini Realtime setup timed out");
          this.disconnect();
          this.setStatus("error", err.message);
          this.config.onError?.(err);
          reject(err);
        }
      }, 10000);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.sendInitialSetup();
          // Note: We wait for the server's setupComplete message before resolving the connect promise!
        };

        this.ws.onmessage = async (event) => {
          try {
            let data: unknown;
            if (event.data instanceof Blob) {
              const text = await event.data.text();
              data = JSON.parse(text);
            } else if (typeof event.data === "string") {
              data = JSON.parse(event.data);
            }
            this.handleServerMessage(data);
          } catch (e) {
            console.error("Error parsing Gemini message:", e);
          }
        };

        this.ws.onerror = (event) => {
          if (this.setupTimer) {
            clearTimeout(this.setupTimer);
            this.setupTimer = null;
          }
          console.error("Gemini WebSocket error:", event);
          this.setStatus("error", "WebSocket connection error");
          const err = new Error("WebSocket error connecting to Gemini Realtime");
          this.config.onError?.(err);
          if (this.connectRejecter) {
            this.connectRejecter(err);
            this.connectResolver = null;
            this.connectRejecter = null;
          }
        };

        this.ws.onclose = (event) => {
          if (this.setupTimer) {
            clearTimeout(this.setupTimer);
            this.setupTimer = null;
          }
          this.cleanupAudio();
          this.isSetupComplete = false;
          if (event.code !== 1000) {
            console.warn(`Gemini WebSocket closed unexpectedly (${event.code})`);
            const err = new Error(`Connection closed (${event.code})`);
            this.setStatus("error", `Connection closed (${event.code})`);
            this.config.onError?.(err);
            if (this.connectRejecter) {
              this.connectRejecter(err);
              this.connectResolver = null;
              this.connectRejecter = null;
            }
          } else {
            this.setStatus("disconnected", `Connection closed (1000)`);
          }
        };
      } catch (err) {
        if (this.setupTimer) {
          clearTimeout(this.setupTimer);
          this.setupTimer = null;
        }
        this.setStatus("error", (err as Error).message);
        reject(err);
      }
    });
  }

  /**
   * Send the initial Setup frame to Gemini
   */
  private sendInitialSetup() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const modelName = this.config.modelId || "gemini-3.1-flash-live-preview";
    const voice = this.config.voiceName || "Aoede";

    const setupMsg = {
      setup: {
        model: `models/${modelName}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text:
                this.config.systemInstruction ||
                "You are an institutional trading floor commentator speaking with voice 'Aoede'. You deliver live market briefings, technical indicator analysis, and fundamental macro perspectives directly to the trader.",
            },
          ],
        },
      },
    };

    this.ws.send(JSON.stringify(setupMsg));
  }

  /**
   * Send text prompt to initiate or direct the commentary
   */
  public sendTextMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not open, cannot send text message");
      return;
    }

    // Google BidiGenerateContent protocol forbids sending clientContent before setupComplete
    if (!this.isSetupComplete) {
      this.pendingTextMessage = text;
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const clientMsg = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(clientMsg));
    this.setStatus("speaking", "Generating live commentary...");
    this.config.onTranscript?.(text, true);
  }

  /**
   * Start microphone capture and stream 16kHz PCM audio to Gemini
   */
  public async startMicrophone(): Promise<void> {
    if (this.isMicActive) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      this.micSource = inputCtx.createMediaStreamSource(this.micStream);
      this.scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isMicActive || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Compute volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const level = Math.min(1, (sum / inputData.length) * 5);
        this.config.onAudioLevel?.(level);

        // Convert Float32 to 16-bit PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Base64 encode PCM
        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const audioChunkMsg = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Audio,
                },
              ],
            },
          };
          this.ws.send(JSON.stringify(audioChunkMsg));
        }
      };

      this.micSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(inputCtx.destination);
      this.isMicActive = true;
      this.setStatus("listening", "Listening to your microphone...");
    } catch (err) {
      console.error("Failed to access microphone:", err);
      throw err;
    }
  }

  public stopMicrophone(): void {
    this.isMicActive = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.status === "listening") {
      this.setStatus("ready");
    }
  }

  /**
   * Handle incoming message from Gemini Realtime
   */
  private handleServerMessage(msg: any) {
    if (!msg) return;

    // Check for setup completion handshake
    if (msg.setupComplete) {
      if (this.setupTimer) {
        clearTimeout(this.setupTimer);
        this.setupTimer = null;
      }
      this.isSetupComplete = true;
      this.setStatus("ready", "Gemini 3.1 Flash Live (Aoede) connected");
      if (this.connectResolver) {
        this.connectResolver();
        this.connectResolver = null;
        this.connectRejecter = null;
      }
      if (this.pendingTextMessage) {
        const text = this.pendingTextMessage;
        this.pendingTextMessage = null;
        this.sendTextMessage(text);
      }
      return;
    }

    // Check for server audio data
    const parts = msg?.serverContent?.modelTurn?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (part?.text) {
          this.config.onTranscript?.(part.text, false);
        }
        if (part?.inlineData?.data) {
          this.playPcmAudio(part.inlineData.data);
          this.setStatus("speaking", "Aoede is speaking...");
        }
      }
    }

    // Check for interruption signal from server
    if (msg?.serverContent?.interrupted) {
      this.stopAllAudioPlayback();
      this.setStatus("listening", "Interrupted — listening...");
    }

    if (msg?.serverContent?.turnComplete) {
      // Turn finished
      setTimeout(() => {
        if (this.status === "speaking") {
          this.setStatus(this.isMicActive ? "listening" : "ready");
        }
      }, 500);
    }
  }

  /**
   * Queue & play 24kHz PCM audio chunk received from Gemini
   */
  private playPcmAudio(base64Data: string) {
    if (this.isMuted || !this.audioCtx) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    try {
      const pcmBytes = this.base64ToArrayBuffer(base64Data);
      const int16Array = new Int16Array(pcmBytes);
      const float32Array = new Float32Array(int16Array.length);

      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
      };
    } catch (e) {
      console.error("Error decoding/playing PCM audio:", e);
    }
  }

  public stopAllAudioPlayback(): void {
    for (const src of this.activeSources) {
      try {
        src.stop();
      } catch {
        // already stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAllAudioPlayback();
    }
  }

  public disconnect(): void {
    if (this.setupTimer) {
      clearTimeout(this.setupTimer);
      this.setupTimer = null;
    }
    this.stopMicrophone();
    this.stopAllAudioPlayback();
    this.isSetupComplete = false;
    this.pendingTextMessage = null;
    if (this.connectRejecter) {
      this.connectRejecter(new Error("Gemini Realtime disconnected"));
      this.connectResolver = null;
      this.connectRejecter = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.cleanupAudio();
    this.setStatus("disconnected");
  }

  private cleanupAudio(): void {
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch {
        // ignore
      }
      this.audioCtx = null;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
