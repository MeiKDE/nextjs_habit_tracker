import { NextRequest, NextResponse } from "next/server"; // For handling requests/responses in App Router
import { AuthService } from "@/lib/auth-appwrite"; // For Appwrite authentication
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

    // Sign in with Appwrite
    const { user, session } = await AuthService.signIn(email, password);

    console.log("Session created:", {
      sessionId: session.$id,
      userId: session.userId,
      expire: session.expire,
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        $id: user.$id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
      message: "Signed in successfully",
    });

    // Set httpOnly cookie for session - use session ID for server-side auth
    response.cookies.set("appwrite-session", session.$id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    console.log("Setting session cookie with ID:", session.$id);

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Signin error:", error);
    return NextResponse.json(
      { error: error.message || "Invalid credentials" },
      { status: 401 }
    );
  }
}
