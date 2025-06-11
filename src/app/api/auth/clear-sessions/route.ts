import { NextRequest, NextResponse } from "next/server";
import { account } from "@/lib/appwrite";

// POST /api/auth/clear-sessions - Clear all sessions safely
export async function POST(request: NextRequest) {
  try {
    // Try to clear Appwrite sessions, but handle guest user errors gracefully
    try {
      await account.deleteSessions();
      console.log("All Appwrite sessions cleared");
    } catch (appwriteError: any) {
      // Handle guest user errors - these are expected when not authenticated
      if (
        appwriteError.message?.includes("missing scope") ||
        appwriteError.message?.includes("guests") ||
        appwriteError.message?.includes("User (role: guests)") ||
        appwriteError.code === 401 ||
        appwriteError.type === "general_unauthorized_scope"
      ) {
        console.log("No sessions to clear (guest user)");
      } else {
        console.error("Failed to clear Appwrite sessions:", appwriteError);
      }
    }

    // Clear JWT cookie
    const response = NextResponse.json({
      success: true,
      message: "Sessions cleared successfully",
    });

    // Clear the JWT cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Clear sessions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear sessions",
        message: "An error occurred while clearing sessions",
      },
      { status: 500 }
    );
  }
}
