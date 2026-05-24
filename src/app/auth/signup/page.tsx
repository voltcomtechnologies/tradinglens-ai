"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from "lucide-react";
import { signup, type SignupState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SignupState = undefined;

export default function SignUpPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [showPassword, setShowPassword] = useState(false);

  // Handle successful signup navigation
  useEffect(() => {
    if (state?.message === "success") {
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">
            Start your 7-day free trial. No credit card required.
          </p>
        </div>

        {/* Success/Error message */}
        {state?.message && state.message !== "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
          >
            {state.message}
          </motion.div>
        )}

        {/* Signup form */}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                className="pl-10"
                required
                autoComplete="name"
              />
            </div>
            {state?.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                required
                autoComplete="email"
              />
            </div>
            {state?.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className="pl-10 pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {state?.errors?.password && (
              <ul className="text-xs text-destructive space-y-0.5 list-disc list-inside">
                {state.errors.password.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Creating account...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Account
              </div>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
