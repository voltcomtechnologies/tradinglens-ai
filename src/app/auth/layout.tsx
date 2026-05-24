import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <BarChart3 className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg group-hover:blur-xl transition-all" />
          </div>
          <span className="text-xl font-bold gradient-text">TradingLens</span>
        </Link>

        {children}
      </div>
    </div>
  );
}
