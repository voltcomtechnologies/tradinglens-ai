"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const errorMessages: Record<string, { title: string; message: string }> = {
  Configuration: {
    title: "Configuration Error",
    message: "There is a problem with the server configuration. Please contact support if this persists.",
  },
  AccessDenied: {
    title: "Access Denied",
    message: "You do not have permission to sign in. Please contact your administrator.",
  },
  Verification: {
    title: "Verification Error",
    message: "The verification link is invalid or has expired. Please request a new one.",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    message: "There was a problem signing in with your OAuth provider. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    message: "There was a problem processing the OAuth callback. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    message: "There was a problem creating your account with this provider. Please try a different method.",
  },
  EmailCreateAccount: {
    title: "Account Creation Error",
    message: "There was a problem creating your account. Please try again.",
  },
  Callback: {
    title: "Callback Error",
    message: "There was a problem processing the authentication callback. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    message: "This email is already associated with another sign-in method. Please sign in using your original method.",
  },
  EmailSignin: {
    title: "Email Sign In Error",
    message: "There was a problem sending the sign-in email. Please try again.",
  },
  CredentialsSignin: {
    title: "Invalid Credentials",
    message: "The email or password you entered is incorrect. Please try again.",
  },
  SessionRequired: {
    title: "Session Required",
    message: "Please sign in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    message: "An unexpected authentication error occurred. Please try again.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold mb-2">{errorInfo.title}</h1>
        <p className="text-muted-foreground mb-8">{errorInfo.message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/signin">
            <Button variant="default" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-72 mx-auto mb-8" />
          <div className="flex justify-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
