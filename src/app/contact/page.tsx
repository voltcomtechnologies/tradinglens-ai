import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  ContactHero,
  ContactChannels,
  ContactFormSection,
} from "@/components/landing/contact-content";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with TradingLens AI — call, chat with an expert, or send us a message. Abuja, Nigeria.",
};

export default async function ContactPage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-background overflow-x-clip">
      <Navbar user={session?.user} />
      <main className="pt-24">
        <ContactHero />
        <ContactChannels />
        <ContactFormSection />
      </main>
      <Footer />
    </div>
  );
}
