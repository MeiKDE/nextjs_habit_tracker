import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth-appwrite";
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
    const [emailAvailable, usernameAvailable] = await Promise.all([
      AuthService.isEmailAvailable(email),
      AuthService.isUsernameAvailable(username),
    ]);

    if (!emailAvailable) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    if (!usernameAvailable) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Create user with Appwrite
    const { user, session } = await AuthService.signUp(
      email,
      password,
      username,
      name
    );

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        $id: user.$id,
        email: user.email,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
      },
      message: "User created successfully",
    });

    // Set httpOnly cookie for session - use session ID for server-side auth
    response.cookies.set("appwrite-session", session.$id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
