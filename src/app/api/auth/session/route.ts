import { NextRequest, NextResponse } from "next/server";
import { AuthMiddleware } from "@/lib/auth-middleware";

// GET /api/auth/session - Check if user is authenticated
export async function GET(request: NextRequest) {
  try {
    const auth = await AuthMiddleware.requireAuth(request);

    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          message: "No valid session found",
        },
        { status: 401 }
      );
    }

    // Return user data from JWT token
    return NextResponse.json({
      success: true,
      data: {
        id: auth.user.userId,
        email: auth.user.email,
        username: auth.user.username,
        name: auth.user.username, // Use username as name fallback
        createdAt: new Date().toISOString(), // We don't have this in JWT, use current time
        updatedAt: new Date().toISOString(), // We don't have this in JWT, use current time
      },
      message: "Session valid",
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Session check failed",
        message: "Failed to validate session",
      },
      { status: 500 }
    );
  }
}
