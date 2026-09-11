import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  AboutHero,
  CompanyStats,
  MissionVision,
  CoreValues,
  WhyDifferent,
  FoundersNote,
} from "@/components/landing/about-content";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "About Company",
  description:
    "TradingLens AI is the all-in-one platform where real-time AI analysis, live expert chart sessions, and structured trading education come together.",
};

export default async function AboutPage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-background overflow-x-clip">
      <Navbar user={session?.user} />
      <main className="pt-24">
        <AboutHero />
        <FoundersNote />
        <CompanyStats />
        <MissionVision />
        <CoreValues />
        <WhyDifferent />
      </main>
      <Footer />
    </div>
  );
}
