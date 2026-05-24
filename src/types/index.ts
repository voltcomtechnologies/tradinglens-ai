export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceNGN: number;
  priceUSD: number;
  priceEUR: number | null;
  priceGBP: number | null;
  interval: "MONTHLY" | "QUARTERLY" | "YEARLY";
  features: string[];
  lensAccess: string[];
  maxUsers: number | null;
  isPopular: boolean;
  isActive: boolean;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  level: string;
  category: string;
  isPublished: boolean;
  orderIndex: number;
  modules: CourseModule[];
  progress?: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  duration: number | null;
  materials: PDFMaterial[];
}

export interface PDFMaterial {
  id: string;
  title: string;
  fileUrl: string;
  pageCount: number | null;
  orderIndex: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface TradeSignal {
  pair: string;
  direction: "BUY" | "SELL" | "NEUTRAL";
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number[];
  confidence: number;
  timeframe: string;
  reasoning: string;
}

export interface CurrencyPair {
  symbol: string;
  name: string;
  base: string;
  quote: string;
}

export interface ForexCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    name: string | null;
    avatar: string | null;
  };
  totalPips: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  streak: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

export interface PaymentConfig {
  provider: "paystack" | "flutterwave";
  publicKey: string;
  secretKey: string;
}

export const MAJOR_PAIRS: CurrencyPair[] = [
  { symbol: "EURUSD", name: "EUR/USD", base: "EUR", quote: "USD" },
  { symbol: "GBPUSD", name: "GBP/USD", base: "GBP", quote: "USD" },
  { symbol: "USDJPY", name: "USD/JPY", base: "USD", quote: "JPY" },
  { symbol: "USDCHF", name: "USD/CHF", base: "USD", quote: "CHF" },
  { symbol: "AUDUSD", name: "AUD/USD", base: "AUD", quote: "USD" },
  { symbol: "USDCAD", name: "USD/CAD", base: "USD", quote: "CAD" },
  { symbol: "NZDUSD", name: "NZD/USD", base: "NZD", quote: "USD" },
  { symbol: "EURGBP", name: "EUR/GBP", base: "EUR", quote: "GBP" },
  { symbol: "EURJPY", name: "EUR/JPY", base: "EUR", quote: "JPY" },
  { symbol: "GBPJPY", name: "GBP/JPY", base: "GBP", quote: "JPY" },
  { symbol: "AUDJPY", name: "AUD/JPY", base: "AUD", quote: "JPY" },
  { symbol: "CHFJPY", name: "CHF/JPY", base: "CHF", quote: "JPY" },
  { symbol: "EURAUD", name: "EUR/AUD", base: "EUR", quote: "AUD" },
  { symbol: "GBPAUD", name: "GBP/AUD", base: "GBP", quote: "AUD" },
  { symbol: "XAUUSD", name: "Gold", base: "XAU", quote: "USD" },
  { symbol: "XAGUSD", name: "Silver", base: "XAG", quote: "USD" },
];

export const TIMEFRAMES = [
  { value: "1min", label: "1 Minute" },
  { value: "5min", label: "5 Minutes" },
  { value: "15min", label: "15 Minutes" },
  { value: "30min", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "Daily" },
  { value: "1w", label: "Weekly" },
  { value: "1m", label: "Monthly" },
];
