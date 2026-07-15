import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. " +
      "For local dev, create a .env file with DATABASE_URL pointing to your Neon PostgreSQL database."
    );
  }

  console.log("🔌 Connecting to:", connectionString.substring(0, 30) + "...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing seed data (idempotent) ──────────────────────
  console.log("🧹 Cleaning existing data...");
  await prisma.tradingJournal.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.quizResult.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.pDFMaterial.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.course.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  console.log("  ✅ Existing data cleaned");

  // ── Subscription Plans ──────────────────────────────────────────
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: "Basic",
        slug: "basic",
        description: "Essential tools to start your trading journey",
        priceNGN: 0,
        priceUSD: 0,
        interval: "MONTHLY",
        features: JSON.stringify([
          "Basic chart analysis",
          "Trading journal (50 entries/mo)",
          "1 educational course",
          "Community access",
          "Email support",
        ]),
        lensAccess: JSON.stringify(["trading", "chart"]),
        isPopular: false,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: "Pro",
        slug: "pro",
        description: "Advanced AI tools for serious traders",
        priceNGN: 1500000, // ₦15,000
        priceUSD: 9900, // $99
        interval: "MONTHLY",
        features: JSON.stringify([
          "Unlimited AI chart analysis",
          "Real-time market data",
          "All educational courses",
          "Advanced technical indicators",
          "Priority support",
          "Unlimited journal entries",
          "Custom alerts & notifications",
          "API access",
        ]),
        lensAccess: JSON.stringify(["trading", "chart", "edu"]),
        isPopular: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: "Elite",
        slug: "elite",
        description: "Maximum edge with institutional-grade tools",
        priceNGN: 5000000, // ₦50,000
        priceUSD: 29900, // $299
        interval: "MONTHLY",
        features: JSON.stringify([
          "Everything in Pro",
          "Multi-account support (up to 5)",
          "Dedicated account manager",
          "Custom AI model training",
          "Real-time news & sentiment",
          "White-label reports",
          "Early access to new features",
          "24/7 VIP support",
        ]),
        lensAccess: JSON.stringify(["trading", "chart", "edu"]),
        isPopular: false,
      },
    }),
  ]);
  console.log(`  ✅ Created ${plans.length} subscription plans`);

  // ── Demo Users ───────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Demo1234!", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alex.trader@example.com",
        name: "Alex Chen",
        password: hashedPassword,
        role: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            tradingStyle: "swing_trader",
            experienceLevel: "advanced",
            preferredPairs: JSON.stringify(["EURUSD", "GBPUSD", "USDJPY"]),
            bio: "Professional forex trader with 8 years of experience. Focused on price action and market structure.",
            timezone: "America/New_York",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah.profits@example.com",
        name: "Sarah Williams",
        password: hashedPassword,
        role: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            tradingStyle: "day_trader",
            experienceLevel: "intermediate",
            preferredPairs: JSON.stringify(["EURUSD", "GBPJPY", "XAUUSD"]),
            bio: "Day trader specializing in EURUSD and Gold. Consistency over size!",
            timezone: "Europe/London",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "marcus.fx@example.com",
        name: "Marcus Johnson",
        password: hashedPassword,
        role: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            tradingStyle: "scalper",
            experienceLevel: "expert",
            preferredPairs: JSON.stringify(["EURUSD", "USDJPY", "GBPUSD"]),
            bio: "Scalper with 10+ years in the markets. 90% win rate target.",
            timezone: "Asia/Tokyo",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "emma.trades@example.com",
        name: "Emma Davis",
        password: hashedPassword,
        role: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            tradingStyle: "position",
            experienceLevel: "beginner",
            preferredPairs: JSON.stringify(["EURUSD", "AUDUSD"]),
            bio: "Started trading this year. Learning position trading with a focus on risk management.",
            timezone: "Australia/Sydney",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "demo@tradinglens.com",
        name: "Demo Admin",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        profile: {
          create: {
            tradingStyle: "day_trader",
            experienceLevel: "intermediate",
            preferredPairs: JSON.stringify(["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"]),
            bio: "Demo account for exploring TradingLens features.",
            timezone: "UTC",
          },
        },
      },
    }),
  ]);
  console.log(`  ✅ Created ${users.length} demo users`);
  console.log(`     📧 Login with any email + password: Demo1234!`);

  // ── Sample Trading Journal Entries ──────────────────────────────
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000);

  const tradeTemplates = [
    // Alex's trades (user index 0) - 20 trades
    { userIdx: 0, pair: "EURUSD", direction: "BUY", entryPrice: 1.0820, exitPrice: 1.0895, pips: 75, profitLoss: 562.50, status: "CLOSED", strategy: "Breakout", entryDate: daysAgo(14), exitDate: daysAgo(13), emotions: "Focused", lessons: "Patience paid off - waited for the breakout confirmation." },
    { userIdx: 0, pair: "GBPUSD", direction: "SELL", entryPrice: 1.2680, exitPrice: 1.2590, pips: 90, profitLoss: 675.00, status: "CLOSED", strategy: "Trend Following", entryDate: daysAgo(12), exitDate: daysAgo(11), emotions: "Confident", lessons: "Trend is your friend. Don't fight the momentum." },
    { userIdx: 0, pair: "USDJPY", direction: "BUY", entryPrice: 151.20, exitPrice: 152.10, pips: 90, profitLoss: 675.00, status: "CLOSED", strategy: "Support Bounce", entryDate: daysAgo(10), exitDate: daysAgo(9), emotions: "Calm", lessons: "Key support levels held perfectly." },
    { userIdx: 0, pair: "EURUSD", direction: "SELL", entryPrice: 1.0860, exitPrice: 1.0840, pips: -20, profitLoss: -150.00, status: "CLOSED", strategy: "Range Trading", entryDate: daysAgo(8), exitDate: daysAgo(8), emotions: "Frustrated", lessons: "Should have waited for a better entry. Was impatient." },
    { userIdx: 0, pair: "GBPJPY", direction: "BUY", entryPrice: 191.00, exitPrice: 192.50, pips: 150, profitLoss: 1125.00, status: "CLOSED", strategy: "Momentum", entryDate: daysAgo(7), exitDate: daysAgo(6), emotions: "Excited", lessons: "Momentum trades work best when volume confirms the move." },
    { userIdx: 0, pair: "XAUUSD", direction: "BUY", entryPrice: 2330.00, exitPrice: 2355.00, pips: 250, profitLoss: 1875.00, status: "CLOSED", strategy: "Breakout", entryDate: daysAgo(5), exitDate: daysAgo(4), emotions: "Happy", lessons: "Gold breakout above resistance was textbook." },
    { userIdx: 0, pair: "EURUSD", direction: "SELL", entryPrice: 1.0840, exitPrice: 1.0855, pips: -15, profitLoss: -112.50, status: "CLOSED", strategy: "Reversal", entryDate: daysAgo(4), exitDate: daysAgo(4), emotions: "Stressed", lessons: "Reversal patterns need confirmation from higher timeframe." },
    { userIdx: 0, pair: "USDCHF", direction: "BUY", entryPrice: 0.8820, exitPrice: 0.8870, pips: 50, profitLoss: 375.00, status: "CLOSED", strategy: "Trend Following", entryDate: daysAgo(3), exitDate: daysAgo(2), emotions: "Focused", lessons: "Trend continuation pattern was clear on the 4H chart." },
    { userIdx: 0, pair: "AUDUSD", direction: "SELL", entryPrice: 0.6540, exitPrice: 0.6490, pips: 50, profitLoss: 375.00, status: "CLOSED", strategy: "Support Break", entryDate: daysAgo(2), exitDate: daysAgo(1), emotions: "Confident", lessons: "Break of key support level led to quick move." },
    { userIdx: 0, pair: "EURGBP", direction: "BUY", entryPrice: 0.8570, exitPrice: 0.8550, pips: -20, profitLoss: -150.00, status: "CLOSED", strategy: "Range Trading", entryDate: daysAgo(1), exitDate: daysAgo(0), emotions: "Disappointed", lessons: "Cross pairs can be unpredictable. Needed more confluences." },

    // Sarah's trades (user index 1) - 15 trades
    { userIdx: 1, pair: "EURUSD", direction: "SELL", entryPrice: 1.0830, exitPrice: 1.0790, pips: 40, profitLoss: 300.00, status: "CLOSED", strategy: "Resistance Rejection", entryDate: daysAgo(13), exitDate: daysAgo(13), emotions: "Good", lessons: "Resistance held firm, quick 40 pip scalp." },
    { userIdx: 1, pair: "GBPJPY", direction: "BUY", entryPrice: 191.50, exitPrice: 192.80, pips: 130, profitLoss: 975.00, status: "CLOSED", strategy: "Momentum", entryDate: daysAgo(11), exitDate: daysAgo(10), emotions: "Excited", lessons: "GBPJPY momentum was strong after the BOJ announcement." },
    { userIdx: 1, pair: "XAUUSD", direction: "BUY", entryPrice: 2340.00, exitPrice: 2335.00, pips: -50, profitLoss: -375.00, status: "CLOSED", strategy: "Breakout", entryDate: daysAgo(9), exitDate: daysAgo(9), emotions: "Frustrated", lessons: "False breakout! Should have waited for a retest." },
    { userIdx: 1, pair: "EURUSD", direction: "BUY", entryPrice: 1.0800, exitPrice: 1.0845, pips: 45, profitLoss: 337.50, status: "CLOSED", strategy: "Support Bounce", entryDate: daysAgo(7), exitDate: daysAgo(7), emotions: "Happy", lessons: "Support bounce played out exactly as expected." },
    { userIdx: 1, pair: "GBPUSD", direction: "SELL", entryPrice: 1.2650, exitPrice: 1.2620, pips: 30, profitLoss: 225.00, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(5), exitDate: daysAgo(5), emotions: "Neutral", lessons: "Quick scalp during London session volatility." },
    { userIdx: 1, pair: "EURUSD", direction: "SELL", entryPrice: 1.0850, exitPrice: 1.0855, pips: -5, profitLoss: -37.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(4), exitDate: daysAgo(4), emotions: "Fine", lessons: "Sometimes the small losses are the best trades - minimal damage." },
    { userIdx: 1, pair: "XAUUSD", direction: "SELL", entryPrice: 2350.00, exitPrice: 2345.00, pips: 50, profitLoss: 375.00, status: "CLOSED", strategy: "Trend Following", entryDate: daysAgo(3), exitDate: daysAgo(2), emotions: "Focused", lessons: "Gold trendline rejection was clean." },
    { userIdx: 1, pair: "EURJPY", direction: "BUY", entryPrice: 164.00, exitPrice: 165.00, pips: 100, profitLoss: 750.00, status: "CLOSED", strategy: "Breakout", entryDate: daysAgo(1), exitDate: daysAgo(0), emotions: "Confident", lessons: "EURJPY broke above resistance with strong momentum." },

    // Marcus's trades (user index 2) - 25 trades (high frequency scalper)
    { userIdx: 2, pair: "EURUSD", direction: "BUY", entryPrice: 1.0820, exitPrice: 1.0827, pips: 7, profitLoss: 52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(14), exitDate: daysAgo(14), emotions: "Good", lessons: "Quick scalp, tight spread, good execution." },
    { userIdx: 2, pair: "EURUSD", direction: "SELL", entryPrice: 1.0830, exitPrice: 1.0824, pips: 6, profitLoss: 45.00, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(14), exitDate: daysAgo(14), emotions: "Good", lessons: "Second scalp of the session, sticking to the plan." },
    { userIdx: 2, pair: "USDJPY", direction: "BUY", entryPrice: 151.40, exitPrice: 151.55, pips: 15, profitLoss: 112.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(13), exitDate: daysAgo(13), emotions: "Focused", lessons: "USDJPY volitility at Asian open creates opportunities." },
    { userIdx: 2, pair: "EURUSD", direction: "BUY", entryPrice: 1.0815, exitPrice: 1.0808, pips: -7, profitLoss: -52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(13), exitDate: daysAgo(13), emotions: "Annoyed", lessons: "Hit my stop, it happens. Move to the next setup." },
    { userIdx: 2, pair: "GBPUSD", direction: "SELL", entryPrice: 1.2660, exitPrice: 1.2653, pips: 7, profitLoss: 52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(12), exitDate: daysAgo(12), emotions: "Good", lessons: "London open scalps are the most reliable." },
    { userIdx: 2, pair: "EURUSD", direction: "SELL", entryPrice: 1.0840, exitPrice: 1.0835, pips: 5, profitLoss: 37.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(11), exitDate: daysAgo(11), emotions: "Calm", lessons: "US session volitility was high today." },
    { userIdx: 2, pair: "USDJPY", direction: "BUY", entryPrice: 151.60, exitPrice: 151.70, pips: 10, profitLoss: 75.00, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(10), exitDate: daysAgo(10), emotions: "Focused", lessons: "Dollar strength continued after positive data." },
    { userIdx: 2, pair: "EURUSD", direction: "BUY", entryPrice: 1.0825, exitPrice: 1.0832, pips: 7, profitLoss: 52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(9), exitDate: daysAgo(9), emotions: "Happy", lessons: "Nice bounce from support level." },
    { userIdx: 2, pair: "GBPUSD", direction: "BUY", entryPrice: 1.2640, exitPrice: 1.2632, pips: -8, profitLoss: -60.00, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(8), exitDate: daysAgo(8), emotions: "Disappointed", lessons: "GBP weakened after the BOE comments. Should have stayed short." },
    { userIdx: 2, pair: "EURUSD", direction: "SELL", entryPrice: 1.0830, exitPrice: 1.0823, pips: 7, profitLoss: 52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(7), exitDate: daysAgo(7), emotions: "Good", lessons: "Consistency is key. Follow the system." },
    { userIdx: 2, pair: "USDCHF", direction: "BUY", entryPrice: 0.8830, exitPrice: 0.8837, pips: 7, profitLoss: 52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(6), exitDate: daysAgo(6), emotions: "Focused", lessons: "USDCHF correlation with EURUSD inverse was spot on." },
    { userIdx: 2, pair: "EURJPY", direction: "BUY", entryPrice: 164.20, exitPrice: 164.35, pips: 15, profitLoss: 112.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(5), exitDate: daysAgo(5), emotions: "Good", lessons: "Cross pairs give bigger pip movements in same time frame." },
    { userIdx: 2, pair: "EURUSD", direction: "BUY", entryPrice: 1.0835, exitPrice: 1.0840, pips: 5, profitLoss: 37.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(4), exitDate: daysAgo(4), emotions: "Calm", lessons: "End of session scalps are generally slower but steady." },
    { userIdx: 2, pair: "EURUSD", direction: "SELL", entryPrice: 1.0845, exitPrice: 1.0838, pips: 7, profitLoss: 52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(3), exitDate: daysAgo(3), emotions: "Good", lessons: "News spike scalp. Fast in, fast out." },
    { userIdx: 2, pair: "GBPUSD", direction: "SELL", entryPrice: 1.2655, exitPrice: 1.2648, pips: 7, profitLoss: 52.50, status: "CLOSED", strategy: "Scalping", entryDate: daysAgo(2), exitDate: daysAgo(2), emotions: "Focused", lessons: "London session gave clean moves today." },

    // Emma's trades (user index 3) - 8 trades (beginner)
    { userIdx: 3, pair: "EURUSD", direction: "BUY", entryPrice: 1.0800, exitPrice: 1.0820, pips: 20, profitLoss: 150.00, status: "CLOSED", strategy: "Position Trading", entryDate: daysAgo(20), exitDate: daysAgo(18), emotions: "Nervous", lessons: "First win! Followed the trend and used proper risk management." },
    { userIdx: 3, pair: "AUDUSD", direction: "BUY", entryPrice: 0.6500, exitPrice: 0.6480, pips: -20, profitLoss: -150.00, status: "CLOSED", strategy: "Position Trading", entryDate: daysAgo(15), exitDate: daysAgo(14), emotions: "Upset", lessons: "Didn't check the economic calendar. RBA comments caused the drop." },
    { userIdx: 3, pair: "EURUSD", direction: "SELL", entryPrice: 1.0850, exitPrice: 1.0830, pips: 20, profitLoss: 150.00, status: "CLOSED", strategy: "Position Trading", entryDate: daysAgo(10), exitDate: daysAgo(8), emotions: "Happy", lessons: "Respected the resistance level and waited for confirmation." },
    { userIdx: 3, pair: "AUDUSD", direction: "SELL", entryPrice: 0.6530, exitPrice: 0.6500, pips: 30, profitLoss: 225.00, status: "CLOSED", strategy: "Trend Following", entryDate: daysAgo(5), exitDate: daysAgo(3), emotions: "Confident", lessons: "Trend identified on weekly chart. Position held for 2 days." },
    { userIdx: 3, pair: "EURUSD", direction: "BUY", entryPrice: 1.0840, exitPrice: 1.0835, pips: -5, profitLoss: -37.50, status: "CLOSED", strategy: "Position Trading", entryDate: daysAgo(2), exitDate: daysAgo(1), emotions: "Frustrated", lessons: "Small loss but I followed my stop loss rules. That's progress." },

    // Demo trader (user index 4) - 3 open trades
    { userIdx: 4, pair: "EURUSD", direction: "BUY", entryPrice: 1.0830, exitPrice: null, pips: null, profitLoss: null, status: "OPEN", strategy: "Trend Following", entryDate: daysAgo(1), emotions: "Curious", lessons: "Testing the platform features with a demo trade." },
    { userIdx: 4, pair: "XAUUSD", direction: "BUY", entryPrice: 2345.00, exitPrice: null, pips: null, profitLoss: null, status: "OPEN", strategy: "Breakout", entryDate: daysAgo(0), emotions: "Excited", lessons: "Gold looks bullish on the daily chart." },
    { userIdx: 4, pair: "GBPUSD", direction: "SELL", entryPrice: 1.2660, exitPrice: null, pips: null, profitLoss: null, status: "OPEN", strategy: "Resistance", entryDate: daysAgo(0), emotions: "Confident", lessons: "GBP hitting resistance at 1.2660, expecting a pullback." },
  ];

  const journalEntries = [];
  for (const t of tradeTemplates) {
    const user = users[t.userIdx];
    const entry = await prisma.tradingJournal.create({
      data: {
        userId: user.id,
        pair: t.pair,
        direction: t.direction as "BUY" | "SELL",
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice ?? null,
        pips: t.pips ?? null,
        profitLoss: t.profitLoss ?? null,
        stopLoss: t.direction === "BUY" ? t.entryPrice - 0.003 : t.entryPrice + 0.003,
        takeProfit: t.direction === "BUY" ? t.entryPrice + 0.006 : t.entryPrice - 0.006,
        lotSize: Math.random() < 0.3 ? 2.0 : 1.0,
        status: (t.status ?? "CLOSED") as "OPEN" | "CLOSED" | "CANCELLED",
        strategy: t.strategy ?? null,
        notes: null,
        emotions: t.emotions ?? null,
        lessons: t.lessons ?? null,
        entryDate: t.entryDate,
        exitDate: t.exitDate ?? null,
      },
    });
    journalEntries.push(entry);
  }
  console.log(`  ✅ Created ${journalEntries.length} trading journal entries`);

  // ── Leaderboard Entries ──────────────────────────────────────────
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userTrades = journalEntries.filter((e) => e.userId === user.id);
    const closedTrades = userTrades.filter((e) => e.status === "CLOSED");
    const total = closedTrades.length;
    const winners = closedTrades.filter((e) => (e.profitLoss ?? 0) > 0);
    const totalPips = closedTrades.reduce((sum, e) => sum + (e.pips ?? 0), 0);
    const winRate = total > 0 ? (winners.length / total) * 100 : 0;
    const totalProfit = closedTrades.filter((e) => (e.profitLoss ?? 0) > 0).reduce((sum, e) => sum + (e.profitLoss ?? 0), 0);
    const totalLoss = Math.abs(closedTrades.filter((e) => (e.profitLoss ?? 0) < 0).reduce((sum, e) => sum + (e.profitLoss ?? 0), 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    const streak = winners.length; // simplified streak

    await prisma.leaderboardEntry.create({
      data: {
        userId: user.id,
        totalPips,
        winRate,
        totalTrades: total,
        profitFactor,
        rank: 0, // Will be calculated below
        streak,
      },
    });
  }

  // Calculate ranks based on totalPips descending
  const allLeaderboard = await prisma.leaderboardEntry.findMany({
    orderBy: { totalPips: "desc" },
  });
  for (let i = 0; i < allLeaderboard.length; i++) {
    await prisma.leaderboardEntry.update({
      where: { id: allLeaderboard[i].id },
      data: { rank: i + 1 },
    });
  }
  console.log(`  ✅ Created ${allLeaderboard.length} leaderboard entries`);

  // ── Educational Courses ─────────────────────────────────────────
  const courses = [
    {
      title: "Forex Fundamentals Mastery",
      slug: "forex-fundamentals-mastery",
      description: "Master the core concepts of forex trading including currency pairs, pips, leverage, margin, and market structure. Perfect for beginners starting their trading journey.",
      level: "beginner",
      category: "fundamentals",
      orderIndex: 1,
      aiClassroomEnabled: true,
      aiClassroomOutline: getOutline("forex-fundamentals-mastery"),
      modules: [
        {
          title: "Introduction to Forex Markets",
          description: "Understand how the forex market works, who the major players are, and why currencies trade.",
          duration: 25,
          materials: [
            { title: "What is Forex Trading?", fileUrl: "/materials/forex-intro.pdf", pageCount: 12 },
            { title: "Major Currency Pairs Guide", fileUrl: "/materials/major-pairs.pdf", pageCount: 8 },
          ],
        },
        {
          title: "Understanding Pips & Leverage",
          description: "Learn how to calculate pips, understand leverage and margin, and manage position sizing.",
          duration: 30,
          materials: [
            { title: "Pip Calculation Workbook", fileUrl: "/materials/pips-workbook.pdf", pageCount: 15 },
          ],
        },
        {
          title: "Market Structure & Sessions",
          description: "Explore how different trading sessions overlap and affect market behavior.",
          duration: 20,
          materials: [
            { title: "Trading Sessions Overview", fileUrl: "/materials/sessions.pdf", pageCount: 10 },
            { title: "Market Structure Basics", fileUrl: "/materials/market-structure.pdf", pageCount: 14 },
          ],
        },
      ],
    },
    {
      title: "Technical Analysis Pro",
      slug: "technical-analysis-pro",
      description: "Dive deep into technical analysis with support/resistance, candlestick patterns, indicators, and advanced charting techniques used by professional traders.",
      level: "intermediate",
      category: "technical analysis",
      orderIndex: 2,
      aiClassroomEnabled: true,
      aiClassroomOutline: getOutline("technical-analysis-pro"),
      modules: [
        {
          title: "Candlestick Patterns",
          description: "Master every major candlestick pattern from dojis to engulfing patterns.",
          duration: 35,
          materials: [
            { title: "Candlestick Encyclopedia", fileUrl: "/materials/candlestick-patterns.pdf", pageCount: 25 },
          ],
        },
        {
          title: "Support & Resistance",
          description: "Learn how to identify and trade key support and resistance levels.",
          duration: 25,
          materials: [
            { title: "S&R Trading Guide", fileUrl: "/materials/support-resistance.pdf", pageCount: 18 },
          ],
        },
        {
          title: "Technical Indicators",
          description: "Comprehensive guide to RSI, MACD, Bollinger Bands, and Moving Averages.",
          duration: 40,
          materials: [
            { title: "Indicators Master Guide", fileUrl: "/materials/indicators.pdf", pageCount: 30 },
            { title: "RSI & MACD Strategy", fileUrl: "/materials/rsi-macd.pdf", pageCount: 12 },
          ],
        },
      ],
    },
    {
      title: "Trading Psychology & Discipline",
      slug: "trading-psychology",
      description: "Develop the mental framework of successful traders. Master emotional control, discipline, and the psychological aspects of consistent profitability.",
      level: "intermediate",
      category: "psychology",
      orderIndex: 3,
      aiClassroomEnabled: true,
      aiClassroomOutline: getOutline("trading-psychology"),
      modules: [
        {
          title: "The Trader's Mindset",
          description: "Understand the psychological traps that cause traders to fail and how to overcome them.",
          duration: 20,
          materials: [
            { title: "Mindset for Success", fileUrl: "/materials/trader-mindset.pdf", pageCount: 16 },
          ],
        },
        {
          title: "Emotional Control",
          description: "Techniques for managing fear, greed, and revenge trading.",
          duration: 25,
          materials: [
            { title: "Emotional Intelligence in Trading", fileUrl: "/materials/emotional-control.pdf", pageCount: 20 },
          ],
        },
        {
          title: "Building Trading Discipline",
          description: "Creating and sticking to a trading plan with journaling and review processes.",
          duration: 30,
          materials: [
            { title: "Trading Plan Template", fileUrl: "/materials/trading-plan.pdf", pageCount: 10 },
            { title: "Journaling Guide", fileUrl: "/materials/journaling.pdf", pageCount: 14 },
          ],
        },
      ],
    },
    {
      title: "Advanced Risk Management",
      slug: "advanced-risk-management",
      description: "Learn institutional risk management techniques including position sizing, portfolio correlation, Kelly criterion, and drawdown management.",
      level: "advanced",
      category: "risk management",
      orderIndex: 4,
      aiClassroomEnabled: true,
      aiClassroomOutline: getOutline("advanced-risk-management"),
      modules: [
        {
          title: "Position Sizing Models",
          description: "Explore fixed fractional, Kelly criterion, and optimal f position sizing.",
          duration: 30,
          materials: [
            { title: "Position Sizing Mathematics", fileUrl: "/materials/position-sizing.pdf", pageCount: 22 },
          ],
        },
        {
          title: "Portfolio Risk Management",
          description: "Managing correlated positions and overall portfolio exposure.",
          duration: 25,
          materials: [
            { title: "Portfolio Correlation Guide", fileUrl: "/materials/portfolio-risk.pdf", pageCount: 18 },
          ],
        },
        {
          title: "Drawdown Recovery",
          description: "Strategies for recovering from drawdowns and maintaining capital preservation.",
          duration: 20,
          materials: [
            { title: "Drawdown Management", fileUrl: "/materials/drawdown.pdf", pageCount: 15 },
          ],
        },
      ],
    },
  ];

  for (const courseData of courses) {
    const course = await prisma.course.create({
      data: {
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        level: courseData.level,
        category: courseData.category,
        isPublished: true,
        orderIndex: courseData.orderIndex,
        // Path A: every demo course gets an AI Classroom outline so the
        // `/dashboard/learn/[slug]` "Launch AI Classroom" CTA succeeds.
        // courseData.aiClassroomOutline is already constructed above by
        // getOutline(slug) (see the courses[] array) so this is a pure
        // forward of an already-built JSON object.
        aiClassroomEnabled: true,
        aiClassroomOutline: courseData.aiClassroomOutline,
      },
    });

    for (let mi = 0; mi < courseData.modules.length; mi++) {
      const mod = courseData.modules[mi];
      const module = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: mod.title,
          description: mod.description,
          duration: mod.duration,
          orderIndex: mi + 1,
        },
      });

      for (let mati = 0; mati < mod.materials.length; mati++) {
        const mat = mod.materials[mati];
        await prisma.pDFMaterial.create({
          data: {
            moduleId: module.id,
            title: mat.title,
            fileUrl: mat.fileUrl,
            pageCount: mat.pageCount,
            orderIndex: mati + 1,
          },
        });
      }
    }

    // Create a quiz for each course
    await prisma.quiz.create({
      data: {
        courseId: course.id,
        title: `${courseData.title} - Module Assessment`,
        description: `Test your knowledge of ${courseData.title.toLowerCase()} with this comprehensive quiz.`,
        questions: getQuizQuestions(courseData.slug),
        timeLimit: 15,
        passScore: 70,
      },
    });

    console.log(`  ✅ Created course: ${courseData.title}`);
  }

  // ── Notifications ────────────────────────────────────────────────
  const notificationTemplates = [
    { title: "Welcome to TradingLens!", message: "Start exploring AI-powered trading analysis, educational courses, and track your journal entries.", type: "system" as const, link: "/dashboard/trading" },
    { title: "New Course Available", message: "Forex Fundamentals Mastery is now available in Edu Lens. Start learning today!", type: "course_update" as const, link: "/dashboard/learn/forex-fundamentals-mastery" },
    { title: "Trading Tip", message: "Did you know? Keeping a trading journal improves performance by up to 30%. Log your first trade!", type: "system" as const, link: "/dashboard/journal" },
    { title: "Pro Feature Alert", message: "Upgrade to Pro for unlimited AI chart analysis and real-time market data.", type: "subscription" as const, link: "/dashboard/subscription" },
  ];

  for (const user of users) {
    for (const nt of notificationTemplates) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: nt.title,
          message: nt.message,
          type: nt.type,
          link: nt.link,
          isRead: nt.title === "Trading Tip" ? false : true,
          createdAt: new Date(now.getTime() - Math.random() * 7 * 86400000),
        },
      });
    }
  }
  console.log(`  ✅ Created notifications for ${users.length} users`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("   Demo login: any email (e.g., demo@tradinglens.com) + password: Demo1234!");
}

function getOutline(slug: string) {
  const outlines: Record<string, { title: string; audience: string; summary: string; sections: Array<{ title: string; description: string; topics?: string[] }> }> = {
    "forex-fundamentals-mastery": {
      title: "Forex Fundamentals Mastery",
      audience: "First-time retail forex traders with no formal market background",
      summary:
        "A practical introduction to the foreign exchange market, the lingo traders use, and how to size a trade responsibly.",
      sections: [
        {
          title: "What the Forex Market Actually Is",
          description:
            "Explain how a decentralised FX market works, who quotes prices, and why pip and lot sizes exist.",
          topics: [
            "Spot FX vs forwards",
            "Interbank vs retail",
            "Bid / ask spread mechanics",
          ],
        },
        {
          title: "Currency Pairs, Pips and Lots",
          description:
            "Walk through majors, crosses and exotics, then compute pip value for a standard vs mini lot.",
          topics: ["Major pairs", "JPY pairs (two-decimal pip)", "Lot sizing"],
        },
        {
          title: "Leverage, Margin and Position Sizing",
          description:
            "Show how 50:1 leverage amplifies both gains and losses, and how to translate a 1% risk rule into lots.",
          topics: ["Margin vs free margin", "Margin call mechanics", "Risk-based sizing"],
        },
        {
          title: "Trading Sessions and Volatility",
          description:
            "Map the Sydney / Tokyo / London / New York sessions and when EUR/USD typically moves the most.",
          topics: ["Session overlaps", "Average daily range", "News catalysts"],
        },
      ],
    },
    "technical-analysis-pro": {
      title: "Technical Analysis Pro",
      audience: "Traders comfortable with basic charting who want a systematic TA toolkit",
      summary:
        "A practitioner's guide to reading price action using multi-timeframe structure, candle context and confluence with common indicators.",
      sections: [
        {
          title: "Price Action Vocabulary",
          description:
            "Define trend, range and reversal using higher-timeframe structure before zooming into execution timeframes.",
          topics: ["Higher-high / higher-low", "Break of structure", "Change of character"],
        },
        {
          title: "Candlestick Context",
          description:
            "Read individual candles as a story of buyers vs sellers, not as a standalone signal.",
          topics: ["Pin bars in context", "Engulfing at structure", "Inside bars"],
        },
        {
          title: "Indicator Confluence",
          description:
            "Use RSI, MACD, VWAP and moving averages as confirmations, never as primary triggers.",
          topics: ["RSI divergence", "MACD zero-cross", "VWAP as institutional reference"],
        },
        {
          title: "Multi-Timeframe Execution",
          description:
            "Plan on the daily, bias on the 4H, trigger on the 1H or 15M.",
          topics: ["Top-down analysis", "Trigger vs entry", "Invalidation levels"],
        },
      ],
    },
    "trading-psychology": {
      title: "Trading Psychology & Discipline",
      audience: "Traders who are profitable in backtests but struggle in live execution",
      summary:
        "A mental-skills program aimed at removing the two emotions that destroy most trading accounts: fear and revenge.",
      sections: [
        {
          title: "The Two Emotions That Drain Accounts",
          description:
            "Map the FOMO → impulse entry → loss → revenge cycle using real journal entries.",
          topics: ["FOMO entries", "Revenge trading", "Loss aversion asymmetry"],
        },
        {
          title: "Process Over Outcome",
          description:
            "Define a tradable grade-A setup and refuse to act on anything else, even after three losers in a row.",
          topics: ["Pre-trade checklist", "No-trade zones", "Process scorecards"],
        },
        {
          title: "Risk as Sovereign",
          description:
            "Treat 1-2% per trade as a constitutional rule that overrides every other variable.",
          topics: ["Fixed fractional", "Daily loss limit", "Cool-down protocols"],
        },
        {
          title: "Review and Calibration",
          description:
            "Hold a weekly 30-minute review of every trade, win or loss, and convert that into a single change.",
          topics: ["Weekly review template", "Tagging trades", "Tracking process vs P&L"],
        },
      ],
    },
    "advanced-risk-management": {
      title: "Advanced Risk Management",
      audience: "Experienced traders managing prop-firm or personal accounts in the $25k+ range",
      summary:
        "Institutional-grade risk frameworks for traders who care more about surviving 1000 trades than winning any single one.",
      sections: [
        {
          title: "Position-Sizing Models",
          description:
            "Compare fixed-fractional, fixed-ratio and Kelly-criterion sizing with worked examples per account size.",
          topics: ["Kelly criterion edge calculation", "Fixed-ratio tiers", "Volatility-adjusted sizing"],
        },
        {
          title: "Correlation and Portfolio Risk",
          description:
            "Roll up correlated positions into a single net exposure metric.",
          topics: ["Spearman correlation", "Net exposure", "Sector / pair clustering"],
        },
        {
          title: "Drawdown Engineering",
          description:
            "Define a drawdown protocol: at -5% reduce size, at -10% go to cash, at -15% mandatory two-week break.",
          topics: ["Step-down rules", "Freeze rules", "Capital preservation logic"],
        },
        {
          title: "Journaling for Risk, Not Just P&L",
          description:
            "Track process metrics like R-multiple average, % of grade-A setups taken, and drawdown depth.",
          topics: ["Risk scorecards", "R-multiple tracking", "Variance vs edge"],
        },
      ],
    },
  };
  return outlines[slug] ?? outlines["forex-fundamentals-mastery"];
}

function getQuizQuestions(slug: string): Array<{
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}> {
  const questions: Record<string, Array<{ question: string; options: string[]; correctAnswer: number }>> = {
    "forex-fundamentals-mastery": [
      {
        question: "What is the most traded currency pair in the world?",
        options: ["GBP/USD", "USD/JPY", "EUR/USD", "USD/CHF"],
        correctAnswer: 2,
      },
      {
        question: "What does a pip represent in most currency pairs?",
        options: ["0.1", "0.01", "0.0001", "0.001"],
        correctAnswer: 2,
      },
      {
        question: "Which trading session is known for the highest volatility?",
        options: ["Asian Session", "London Session", "New York Session", "Sydney Session"],
        correctAnswer: 1,
      },
      {
        question: "What is leverage in forex trading?",
        options: ["A fee charged by brokers", "Borrowed capital to increase position size", "A type of order", "The spread between bid and ask"],
        correctAnswer: 1,
      },
      {
        question: "What is a 'stop loss' order used for?",
        options: ["To take profits automatically", "To limit potential losses", "To enter a trade", "To calculate pip value"],
        correctAnswer: 1,
      },
    ],
    "technical-analysis-pro": [
      {
        question: "What does a bullish engulfing pattern indicate?",
        options: ["Continuation of downtrend", "Potential reversal to upside", "Market indecision", "Strong selling pressure"],
        correctAnswer: 1,
      },
      {
        question: "What is the primary purpose of the RSI indicator?",
        options: ["Measure trend strength", "Identify overbought/oversold conditions", "Calculate moving averages", "Determine support levels"],
        correctAnswer: 1,
      },
      {
        question: "What does a 'death cross' refer to?",
        options: ["50 MA crossing above 200 MA", "200 MA crossing below 50 MA", "RSI going above 70", "MACD turning positive"],
        correctAnswer: 1,
      },
      {
        question: "Which time frame is best for identifying major trends?",
        options: ["1-minute chart", "5-minute chart", "Daily chart", "15-minute chart"],
        correctAnswer: 2,
      },
      {
        question: "What does a doji candlestick represent?",
        options: ["Strong bullish momentum", "Market indecision", "Strong bearish momentum", "Continuation pattern"],
        correctAnswer: 1,
      },
    ],
    "trading-psychology": [
      {
        question: "What is 'revenge trading'?",
        options: ["Trading to get back at the market after a loss", "A type of day trading strategy", "Following another trader's strategy", "Using leverage strategically"],
        correctAnswer: 0,
      },
      {
        question: "What is the most important quality of successful traders?",
        options: ["Being right most of the time", "Having a large account", "Discipline and consistency", "Using complex strategies"],
        correctAnswer: 2,
      },
      {
        question: "What should you do after a significant losing trade?",
        options: ["Immediately trade bigger to recover losses", "Step away and review your trading plan", "Switch to a different strategy", "Increase risk tolerance"],
        correctAnswer: 1,
      },
      {
        question: "What is 'FOMO' in trading?",
        options: ["Fear Of Missing Out - entering trades due to emotional pressure", "A technical indicator", "A type of stop loss", "Forward Market Order"],
        correctAnswer: 0,
      },
      {
        question: "How often should you review your trading journal?",
        options: ["Never", "Weekly", "Once a year", "Only after losses"],
        correctAnswer: 1,
      },
    ],
    "advanced-risk-management": [
      {
        question: "What is the recommended maximum risk per trade for most traders?",
        options: ["5% of account", "10% of account", "1-2% of account", "20% of account"],
        correctAnswer: 2,
      },
      {
        question: "What does the Kelly Criterion help determine?",
        options: ["Entry timing", "Optimal position size", "Stop loss placement", "Take profit levels"],
        correctAnswer: 1,
      },
      {
        question: "What is drawdown?",
        options: ["Peak profit", "Peak-to-trough decline in account value", "Number of consecutive wins", "Average trade duration"],
        correctAnswer: 1,
      },
      {
        question: "What is portfolio correlation?",
        options: ["How account growth compounds", "How different positions move in relation to each other", "The correlation between entry and exit", "Broker margin requirements"],
        correctAnswer: 1,
      },
      {
        question: "What is the main benefit of using fixed fractional position sizing?",
        options: ["Maximum profit in all conditions", "Risk stays proportional to account size", "Always uses full margin", "Guarantees winning trades"],
        correctAnswer: 1,
      },
    ],
  };

  const qs = questions[slug] || questions["forex-fundamentals-mastery"];
  return qs.map((q, i) => ({
    id: `q-${i + 1}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
