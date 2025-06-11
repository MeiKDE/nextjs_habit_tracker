import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/signout - Sign out user by clearing cookies
export async function POST(request: NextRequest) {
  try {
    console.log("User signing out, clearing cookies");

    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });

    // Clear the JWT token cookies
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Expire immediately
      path: "/",
    });

    response.cookies.set("appwrite-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Expire immediately
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Signout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sign out",
        message: "Sign out failed",
      },
      { status: 500 }
    );
  }
}
