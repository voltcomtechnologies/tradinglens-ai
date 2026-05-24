import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Navbar user={session?.user} />

      <main className="relative pt-16">
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
