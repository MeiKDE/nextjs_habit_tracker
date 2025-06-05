import { NextRequest, NextResponse } from "next/server"; // For handling requests/responses in App Router
import bcrypt from "bcryptjs"; // For comparing hashed passwords
import { generateTokenPair } from "@/lib/jwt-auth"; // Using centralized JWT function with token pairs
import { prisma } from "@/lib/prisma"; // DB connection (Prisma ORM)
import { z } from "zod"; // Schema validation

const signinSchema = z.object({
  email: z.string().email(), // must be valid email format
  password: z.string().min(1), // must be at least 1 character
});

// This is called when the client sends a signin/login POST request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { email, password } = signinSchema.parse(body);

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Generate secure token pair using centralized function
    const tokenPair = generateTokenPair({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Return user data and tokens in consistent format
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        // Legacy compatibility
        ...userData,
      },
      message: "Signed in successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    // Logs other errors and returns 500
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
