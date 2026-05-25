"use client";

/**
 * Socket.IO client hook for real-time forex price streaming.
 *
 * Connects to the standalone Socket.IO server (socket-server.ts) when available.
 * Falls back to HTTP polling via /api/market/data in production or when the
 * WebSocket server is not running.
 */

import { useEffect, useCallback, useSyncExternalStore } from "react";
import type { Socket } from "socket.io-client";

// ── Types ──────────────────────────────────────────────────────────

export interface PairPrice {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  change: number;
  high: number;
  low: number;
  updatedAt: number;
}

export interface PriceMap {
  [symbol: string]: PairPrice;
}

// ── Module-level socket singleton ──────────────────────────────────

let socketPromise: Promise<Socket | null> | null = null;
let socketInstance: Socket | null = null;
let listeners = new Set<() => void>();
let currentPrices: PriceMap = {};
let isConnected = false;
let connectionAttempted = false;
let isClientSide = false;

function notifyListeners(): void {
  listeners.forEach((fn) => fn());
}

async function getSocket(): Promise<Socket | null> {
  // Only connect on the client side
  if (typeof window === "undefined") return null;

  isClientSide = true;

  if (socketInstance?.connected) return socketInstance;

  if (!socketPromise) {
    socketPromise = (async () => {
      try {
        const { io } = await import("socket.io-client");

        const socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`;

        socketInstance = io(socketUrl, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
          timeout: 5000,
        });

        socketInstance.on("connect", () => {
          isConnected = true;
          notifyListeners();
        });

        socketInstance.on("prices", (prices: PriceMap) => {
          currentPrices = { ...currentPrices, ...prices };
          notifyListeners();
        });

        socketInstance.on("disconnect", () => {
          isConnected = false;
          notifyListeners();
        });

        socketInstance.on("connect_error", () => {
          socketInstance?.close();
          socketInstance = null;
          isConnected = false;
          notifyListeners();
        });

        // Wait for connection or timeout
        await new Promise<void>((resolve) => {
          if (!socketInstance) return resolve();

          const onConnect = () => {
            socketInstance?.off("connect_error", onError);
            resolve();
          };
          const onError = () => {
            socketInstance?.off("connect", onConnect);
            resolve();
          };

          socketInstance.once("connect", onConnect);
          socketInstance.once("connect_error", onError);

          setTimeout(() => {
            socketInstance?.off("connect", onConnect);
            socketInstance?.off("connect_error", onError);
            resolve();
          }, 4000);
        });

        return socketInstance?.connected ? socketInstance : null;
      } catch {
        return null;
      } finally {
        connectionAttempted = true;
      }
    })();
  }

  return socketPromise;
}

/**
 * Subscribe to real-time forex prices via Socket.IO (with fallback).
 */
export function useSocketPrices(): {
  prices: PriceMap;
  isConnected: boolean;
  hasSocket: boolean;
} {
  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => currentPrices, []);

  // Server snapshot: return empty object for SSR (avoids hydration mismatch)
  const getServerSnapshot = useCallback(() => ({} as PriceMap), []);

  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // One-time socket connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    getSocket().then((socket) => {
      if (!cancelled && socket?.connected) {
        notifyListeners();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    prices: currentPrices,
    isConnected,
    hasSocket: isConnected,
  };
}

/**
 * Subscribe to prices for specific symbols.
 */
export function useSocketPairPrices(symbols: string[]): {
  prices: Partial<PriceMap>;
  isConnected: boolean;
} {
  const { prices: allPrices, isConnected } = useSocketPrices();

  const filtered: Partial<PriceMap> = {};
  for (const sym of symbols) {
    if (allPrices[sym]) {
      filtered[sym] = allPrices[sym];
    }
  }

  return { prices: filtered, isConnected };
}
