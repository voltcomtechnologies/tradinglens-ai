import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
console.log("URL prefix:", connectionString?.substring(0, 60));

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const count = await prisma.course.count();
    console.log("Courses in DB:", count);
    const courses = await prisma.course.findMany({ select: { title: true, slug: true }, take: 5 });
    console.log("Course list:", courses);
  } catch (e: any) {
    console.error("Error code:", e.code, "message:", e.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
