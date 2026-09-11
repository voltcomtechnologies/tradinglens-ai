import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero";
import { StatsBand } from "@/components/landing/stats-band";
import { FeaturesSection } from "@/components/landing/features";
import { DemoSection } from "@/components/landing/demo";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQSection } from "@/components/landing/faq";
import { CTASection } from "@/components/landing/cta";
import { ForexTicker } from "@/components/landing/forex-ticker";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-background overflow-x-clip">
      <Navbar user={session?.user} />

      <main className="relative">
        {/* Live price ticker at top */}
        <div className="pt-24">
          <ForexTicker />
        </div>

        <HeroSection />
        <StatsBand />
        <FeaturesSection />
        <DemoSection />
        <HowItWorks />
        <PricingSection />
        <Testimonials />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
