"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Please enter a valid email").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type SignupState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
} | undefined;

export async function signup(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  // Validate form fields
  const validatedFields = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        message: "An account with this email already exists. Please sign in instead.",
      };
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Sign the user in immediately after registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return {
        message: "Account created but could not sign in. Please try signing in manually.",
      };
    }

    return { message: "success" };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      message: "An error occurred while creating your account. Please try again.",
    };
  }
}
