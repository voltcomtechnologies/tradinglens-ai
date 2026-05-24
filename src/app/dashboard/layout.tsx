import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardTopBar } from "./top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopBar />

      {/* Main content */}
      <div className="lg:pl-64 pt-14 lg:pt-0 transition-all duration-300">
        {/* Desktop top bar */}
        <div className="hidden lg:flex sticky top-0 z-20 h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-8">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search trades, courses, charts..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <svg className="h-5 w-5 text-muted-foreground hover:text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
