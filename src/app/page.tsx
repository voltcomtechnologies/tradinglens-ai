import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PremiumHome } from "@/components/landing/premium-home";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <Navbar user={session?.user} />
      <main className="relative">
        <PremiumHome />
      </main>
      <Footer />
    </div>
  );
}
