import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateJWTToken } from "@/lib/jwt-auth";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  name: z.string().optional(),
});

// This is called when the client sends a signup POST request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { email, username, password, name } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name || username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token for React Native compatibility
    const accessToken = generateJWTToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        accessToken, // Include token for React Native
      },
      message: "User created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
