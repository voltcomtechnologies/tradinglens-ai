import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "TradingLens AI — Trade Smarter with AI-Powered Precision",
    template: "%s | TradingLens AI",
  },
  description:
    "TradingLens AI helps you analyze the market, learn proven strategies, and make confident trading decisions — all in one intelligent platform.",
  keywords: [
    "forex",
    "trading",
    "AI",
    "market analysis",
    "trading education",
    "chart intelligence",
    "prop firm",
    "funded trading",
  ],
  metadataBase: new URL("https://tradinglensai.com"),
  openGraph: {
    title: "TradingLens AI — Trade Smarter with AI-Powered Precision",
    description:
      "Real-time AI market analysis, live chart sessions, and structured trading education — all in one intelligent platform.",
    type: "website",
    siteName: "TradingLens AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradingLens AI — Trade Smarter with AI-Powered Precision",
    description:
      "Real-time AI market analysis, live chart sessions, and structured trading education — all in one intelligent platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
