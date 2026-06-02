import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta";
import { ParticleBackground } from "@/components/landing/particle-background";
import { ForexTicker } from "@/components/landing/forex-ticker";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Global particle background */}
      <ParticleBackground />

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px]" />
      </div>

      <Navbar user={session?.user} />

      <div className="mt-16">
        <ForexTicker />
      </div>
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <PricingSection />
        <Testimonials />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
