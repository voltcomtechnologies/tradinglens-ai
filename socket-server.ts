/**
 * Standalone Socket.IO server for real-time forex price streaming.
 *
 * Usage: npx tsx socket-server.ts
 * Runs alongside `next dev` on port 3001 by default.
 *
 * On Vercel (production), this server is NOT used — the client falls back
 * to HTTP polling via /api/market/data. This server is for local development
 * and self-hosted deployments.
 */

import { createServer } from "http";
import { Server } from "socket.io";
import { MAJOR_PAIRS, type CurrencyPair } from "./src/types";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const REFRESH_INTERVAL = 15_000; // 15 seconds between price updates
const ALPHA_VANTAGE_API_KEY =
  process.env.ALPHA_VANTAGE_API_KEY || "";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

// ── In-memory price store ──────────────────────────────────────────

interface PairPrice {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  change: number;
  high: number;
  low: number;
  updatedAt: number;
}

const priceStore = new Map<string, PairPrice>();

// ── Alpha Vantage fetch ────────────────────────────────────────────

async function fetchPrice(pair: CurrencyPair): Promise<PairPrice | null> {
  if (!ALPHA_VANTAGE_API_KEY) return null;

  try {
    const url = `${ALPHA_VANTAGE_BASE}?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.base}&to_currency=${pair.quote}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const quote = data?.["Realtime Currency Exchange Rate"];
    if (!quote) return null;

    const bid = parseFloat(quote["8. Bid Price"] || "0");
    const ask = parseFloat(quote["9. Ask Price"] || "0");
    const price = parseFloat(quote["5. Exchange Rate"] || "0");

    const prev = priceStore.get(pair.symbol);
    const change = prev ? price - prev.price : 0;

    return {
      symbol: pair.symbol,
      bid,
      ask,
      price,
      change,
      high: Math.max(price, prev?.high ?? price),
      low: Math.min(price, prev?.low ?? price),
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error(`Failed to fetch ${pair.symbol}:`, error);
    return null;
  }
}

// ── Price seeding (fallback to ensure we always have data) ─────────

const FALLBACK_PRICES: Record<string, Omit<PairPrice, "updatedAt">> = {
  EURUSD: { symbol: "EURUSD", bid: 1.0848, ask: 1.0852, price: 1.085, change: 0, high: 1.085, low: 1.085 },
  GBPUSD: { symbol: "GBPUSD", bid: 1.2648, ask: 1.2652, price: 1.265, change: 0, high: 1.265, low: 1.265 },
  USDJPY: { symbol: "USDJPY", bid: 151.48, ask: 151.52, price: 151.5, change: 0, high: 151.5, low: 151.5 },
  USDCHF: { symbol: "USDCHF", bid: 0.9048, ask: 0.9052, price: 0.905, change: 0, high: 0.905, low: 0.905 },
  AUDUSD: { symbol: "AUDUSD", bid: 0.6498, ask: 0.6502, price: 0.65, change: 0, high: 0.65, low: 0.65 },
  USDCAD: { symbol: "USDCAD", bid: 1.3648, ask: 1.3652, price: 1.365, change: 0, high: 1.365, low: 1.365 },
  NZDUSD: { symbol: "NZDUSD", bid: 0.5948, ask: 0.5952, price: 0.595, change: 0, high: 0.595, low: 0.595 },
  EURGBP: { symbol: "EURGBP", bid: 0.8578, ask: 0.8582, price: 0.858, change: 0, high: 0.858, low: 0.858 },
  EURJPY: { symbol: "EURJPY", bid: 164.18, ask: 164.22, price: 164.2, change: 0, high: 164.2, low: 164.2 },
  GBPJPY: { symbol: "GBPJPY", bid: 191.68, ask: 191.72, price: 191.7, change: 0, high: 191.7, low: 191.7 },
  AUDJPY: { symbol: "AUDJPY", bid: 98.48, ask: 98.52, price: 98.5, change: 0, high: 98.5, low: 98.5 },
  CHFJPY: { symbol: "CHFJPY", bid: 167.38, ask: 167.42, price: 167.4, change: 0, high: 167.4, low: 167.4 },
  EURAUD: { symbol: "EURAUD", bid: 1.6688, ask: 1.6692, price: 1.669, change: 0, high: 1.669, low: 1.669 },
  GBPAUD: { symbol: "GBPAUD", bid: 1.9468, ask: 1.9472, price: 1.947, change: 0, high: 1.947, low: 1.947 },
  XAUUSD: { symbol: "XAUUSD", bid: 2334.8, ask: 2335.2, price: 2335.0, change: 0, high: 2335.0, low: 2335.0 },
  XAGUSD: { symbol: "XAGUSD", bid: 31.68, ask: 31.72, price: 31.7, change: 0, high: 31.7, low: 31.7 },
};

// ── Simulate price movement (for when API is unavailable) ──────────

function simulateTick(prev: PairPrice): PairPrice {
  const spread = prev.ask - prev.bid;
  const volatility = prev.price * 0.0002; // 0.02% volatility per tick
  const delta = (Math.random() - 0.5) * volatility * 2;

  const newPrice = prev.price + delta;
  return {
    symbol: prev.symbol,
    price: newPrice,
    bid: newPrice - spread / 2,
    ask: newPrice + spread / 2,
    change: prev.change + delta,
    high: Math.max(prev.high, newPrice),
    low: Math.min(prev.low, newPrice),
    updatedAt: Date.now(),
  };
}

// ── Initialize prices ──────────────────────────────────────────────

async function initializePrices(): Promise<void> {
  const fetchPromises = MAJOR_PAIRS.map(async (pair) => {
    const price = await fetchPrice(pair);
    if (price) {
      priceStore.set(pair.symbol, price);
    } else {
      // Use fallback with current timestamp
      const fallback = FALLBACK_PRICES[pair.symbol];
      if (fallback) {
        priceStore.set(pair.symbol, { ...fallback, updatedAt: Date.now() });
      }
    }
  });

  await Promise.allSettled(fetchPromises);
  console.log(`Initialized ${priceStore.size} pairs`);
}

// ── Refresh loop ───────────────────────────────────────────────────

let refreshInterval: ReturnType<typeof setInterval> | null = null;

async function refreshAllPrices(): Promise<void> {
  const fetchPromises = MAJOR_PAIRS.map(async (pair) => {
    const price = await fetchPrice(pair);
    if (price) {
      priceStore.set(pair.symbol, price);
    } else {
      // Simulate from existing price
      const existing = priceStore.get(pair.symbol);
      if (existing) {
        priceStore.set(pair.symbol, simulateTick(existing));
      }
    }
  });

  await Promise.allSettled(fetchPromises);
}

function startRefreshLoop(io: Server): void {
  refreshInterval = setInterval(async () => {
    await refreshAllPrices();
    const allPrices = Object.fromEntries(priceStore);
    io.emit("prices", allPrices);
  }, REFRESH_INTERVAL);
}

// ── HTTP + Socket.IO server ────────────────────────────────────────

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://tradinglens-ai.vercel.app"],
    methods: ["GET"],
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current prices immediately on connect
  const allPrices = Object.fromEntries(priceStore);
  socket.emit("prices", allPrices);

  // Client can request a specific pair
  socket.on("subscribe", (symbols: string[]) => {
    symbols.forEach((symbol) => {
      socket.join(`pair:${symbol}`);
    });
  });

  socket.on("unsubscribe", (symbols: string[]) => {
    symbols.forEach((symbol) => {
      socket.leave(`pair:${symbol}`);
    });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ── Startup ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🚀 Starting TradingLens Socket.IO server...");
  console.log(`   Alpha Vantage API: ${ALPHA_VANTAGE_API_KEY ? "✓ configured" : "✗ NOT configured (using simulation)"}`);

  await initializePrices();
  startRefreshLoop(io);

  httpServer.listen(PORT, () => {
    console.log(`📡 Socket.IO server listening on http://localhost:${PORT}`);
    console.log(`   Connect from Next.js at ws://localhost:${PORT}`);
  });
}

main().catch(console.error);

// Graceful shutdown
process.on("SIGINT", () => {
  if (refreshInterval) clearInterval(refreshInterval);
  io.close();
  httpServer.close();
  console.log("\n👋 Server shut down");
  process.exit(0);
});
