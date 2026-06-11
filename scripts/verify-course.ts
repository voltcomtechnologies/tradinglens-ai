import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.findUnique({
    where: { slug: "intermediate-trading-course" },
    include: {
      modules: {
        orderBy: { orderIndex: "asc" },
        include: { materials: true },
      },
      quizzes: true,
    },
  });

  if (!course) {
    console.log("Course not found");
    return;
  }

  console.log("Course:", course.title, "| Published:", course.isPublished);
  console.log("Modules:", course.modules.length);
  course.modules.forEach((m) => {
    console.log(`  ${m.orderIndex}. ${m.title} (${m.materials.length} material(s))`);
  });
  console.log("Quizzes:", course.quizzes.length);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
