import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if course already exists
  const existing = await prisma.course.findUnique({
    where: { slug: "intermediate-trading-course" },
  });

  if (existing) {
    console.log("Course already exists:", existing.id);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  // Get max orderIndex
  const maxOrder = await prisma.course.aggregate({
    _max: { orderIndex: true },
  });
  const nextOrder = (maxOrder._max.orderIndex ?? 0) + 1;

  // Create course
  const course = await prisma.course.create({
    data: {
      title: "Intermediate Trading Course",
      slug: "intermediate-trading-course",
      description:
        "A comprehensive intermediate-level guide covering chart patterns, pivot points, Elliott Wave theory, harmonic price patterns, trading psychology, and market structures. Build on your foundational knowledge with advanced technical analysis and professional trading mindset techniques.",
      level: "intermediate",
      category: "technical analysis",
      isPublished: true,
      orderIndex: nextOrder,
    },
  });
  console.log("Created course:", course.id, course.title);

  // Module definitions based on PDF structure
  const modulesData = [
    {
      title: "Chart Patterns",
      description:
        "Master reversal and continuation chart patterns including double tops and bottoms, head and shoulders, wedge patterns, and rectangle formations.",
      duration: 45,
      materialTitle: "Chart Patterns Guide",
    },
    {
      title: "Pivot Points",
      description:
        "Learn to calculate pivot points and apply them in range trading, breakout strategies, and market sentiment analysis.",
      duration: 30,
      materialTitle: "Pivot Points Strategies",
    },
    {
      title: "Advanced Technical Analysis",
      description:
        "Dive into Elliott Wave Theory, harmonic price patterns, fractals, and advanced pattern recognition for Forex markets.",
      duration: 50,
      materialTitle: "Elliott Wave & Harmonic Patterns",
    },
    {
      title: "Trading Psychology & Business Perspective",
      description:
        "Develop the mindset of a professional trader. Manage stress, handle losses, avoid psychological mistakes, and treat trading as an investment business.",
      duration: 35,
      materialTitle: "Trading Psychology Workbook",
    },
    {
      title: "Market Structures",
      description:
        "Understand indices, futures, and dealer markets to broaden your market perspective beyond spot Forex.",
      duration: 25,
      materialTitle: "Market Structures Overview",
    },
  ];

  for (let i = 0; i < modulesData.length; i++) {
    const modData = modulesData[i];
    const module = await prisma.courseModule.create({
      data: {
        courseId: course.id,
        title: modData.title,
        description: modData.description,
        duration: modData.duration,
        orderIndex: i + 1,
      },
    });
    console.log("  Created module:", module.title);

    await prisma.pDFMaterial.create({
      data: {
        moduleId: module.id,
        title: modData.materialTitle,
        fileUrl: "/courses/intermediate-trading-course.pdf",
        orderIndex: 1,
      },
    });
    console.log("    Created material:", modData.materialTitle);
  }

  // Create a quiz for the course
  await prisma.quiz.create({
    data: {
      courseId: course.id,
      title: "Intermediate Trading Course - Assessment",
      description:
        "Test your understanding of chart patterns, pivot points, Elliott Wave, harmonic patterns, and trading psychology.",
      questions: JSON.stringify([
        {
          id: "q-1",
          question: "What does a double top pattern typically signal?",
          options: [
            "Trend continuation",
            "Bullish reversal",
            "Bearish reversal",
            "Market consolidation",
          ],
          correctAnswer: 2,
        },
        {
          id: "q-2",
          question:
            "In a head and shoulders pattern, what is the line connecting the two troughs called?",
          options: [
            "Resistance line",
            "Support line",
            "Neckline",
            "Trendline",
          ],
          correctAnswer: 2,
        },
        {
          id: "q-3",
          question:
            "Which pivot point strategy involves buying at support and selling at resistance?",
          options: [
            "Breakout trading",
            "Range trading",
            "Momentum trading",
            "Sentiment analysis",
          ],
          correctAnswer: 1,
        },
        {
          id: "q-4",
          question:
            "According to Elliott Wave Theory, how many waves make up a complete impulse cycle?",
          options: ["3", "5", "8", "13"],
          correctAnswer: 1,
        },
        {
          id: "q-5",
          question: "What is 'revenge trading' in trading psychology?",
          options: [
            "Trading after a winning streak",
            "Trading to recover losses emotionally",
            "Copying another trader's strategy",
            "Trading during high volatility",
          ],
          correctAnswer: 1,
        },
      ]),
      timeLimit: 20,
      passScore: 70,
    },
  });
  console.log("  Created quiz");

  console.log("\n✅ Intermediate Trading Course created successfully!");
  console.log(`   Slug: ${course.slug}`);
  console.log(`   Modules: ${modulesData.length}`);
  console.log(`   URL: /dashboard/learn/${course.slug}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Failed to create course:", e);
  process.exit(1);
});
