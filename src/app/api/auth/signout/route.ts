import { NextResponse } from "next/server";
import { AuthService } from "@/lib/auth-appwrite";

export async function POST() {
  try {
    // Sign out from Appwrite
    await AuthService.signOut();

    // Clear session cookie
    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });

    response.cookies.delete("appwrite-session");

    return response;
  } catch (error: any) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign out" },
      { status: 500 }
    );
  }
}
