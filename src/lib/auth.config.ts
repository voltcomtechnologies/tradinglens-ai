import type { NextAuthConfig, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role?: "USER" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED" | "PENDING";
  }
}

// Augment JWT to include custom fields
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED" | "PENDING";
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Dynamic import bcryptjs — keeps it out of the Edge runtime bundle
        const bcrypt = (await import("bcryptjs")).default;

        // Dynamic import prisma — keeps PrismaClient out of the Edge runtime bundle
        const { prisma } = await import("./prisma");

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        if (user.status === "SUSPENDED") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id ?? token.id;
        token.role = user.role ?? token.role;
        token.status = user.status ?? token.status;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as "USER" | "ADMIN",
          status: token.status as "ACTIVE" | "SUSPENDED" | "PENDING",
        };
      }
      return session;
    },
  },
};
