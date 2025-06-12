import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== EMAIL VERIFICATION TEST API CALLED ===");

  try {
    const { Client, Account, Users } = require("node-appwrite");

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.APPWRITE_API_KEY || "");

    const account = new Account(client);
    const users = new Users(client);

    const testEmail = "rubymxzhang@gmail.com";
    console.log("Testing email verification for:", testEmail);

    // Step 1: Check if user exists
    try {
      const userList = await users.list();
      const existingUser = userList.users.find(
        (u: any) => u.email === testEmail
      );

      if (!existingUser) {
        return NextResponse.json({
          success: false,
          error: "User does not exist",
          message: `No user found with email ${testEmail}. Please sign up first.`,
          data: {
            totalUsers: userList.total,
            testEmail: testEmail,
          },
        });
      }

      console.log("✅ User found:", existingUser.$id);
      console.log(
        "User email verified status:",
        existingUser.emailVerification
      );

      // Step 2: Try to send verification email
      try {
        console.log("Attempting to create session for verification...");

        // We need to create a session to send verification
        // But we don't have the password, so let's try a different approach

        // Check if we can send verification directly using server API
        console.log("Attempting to send verification email...");

        // Create a temporary session for this user (this requires password)
        // Since we don't have password, let's try alternative approach

        return NextResponse.json({
          success: true,
          message: "User exists but cannot test verification without password",
          data: {
            userId: existingUser.$id,
            email: existingUser.email,
            emailVerified: existingUser.emailVerification,
            status: existingUser.status,
            registration: existingUser.registration,
            suggestion:
              "Try signing up with a new email or use existing credentials to test verification",
          },
        });
      } catch (verificationError: any) {
        console.error("❌ Verification failed:", verificationError);

        return NextResponse.json(
          {
            success: false,
            error: "Failed to send verification email",
            details: {
              message: verificationError.message,
              type: verificationError.type,
              code: verificationError.code,
              userId: existingUser.$id,
              emailVerified: existingUser.emailVerification,
            },
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error("❌ Failed to check user:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to check user existence",
          details: {
            message: error.message,
            type: error.type,
            code: error.code,
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Email verification test API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: {
          message: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
