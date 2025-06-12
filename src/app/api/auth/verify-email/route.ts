import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sign } from "jsonwebtoken";
import { serverDatabases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";

const verifyEmailSchema = z.object({
  userId: z.string(),
  secret: z.string(),
});

export async function POST(request: NextRequest) {
  console.log("=== EMAIL VERIFICATION API CALLED ===");

  try {
    const body = await request.json();
    console.log("Verification request for user:", body.userId);

    // Validate input
    const { userId, secret } = verifyEmailSchema.parse(body);

    // Verify email using Appwrite
    const { Client, Account } = require("node-appwrite");

    const tempClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.APPWRITE_API_KEY || "");

    const tempAccount = new Account(tempClient);

    console.log("Verifying email with Appwrite...");

    try {
      // Complete the email verification
      await tempAccount.updateVerification(userId, secret);
      console.log("Email verification successful");

      // Update user document in database with timestamp
      const userDoc = await serverDatabases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId,
        {
          updatedAt: new Date().toISOString(),
        }
      );

      console.log("User document updated - email verified");

      // Create a new JWT token with email verified status
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
      const accessToken = sign(
        {
          userId: userDoc.$id,
          email: userDoc.email,
          username: userDoc.username,
          sessionId: `verified-${userDoc.$id}-${Date.now()}`,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Return success response
      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: userDoc.$id,
            email: userDoc.email,
            username: userDoc.username,
            name: userDoc.name,
            createdAt: userDoc.createdAt,
            updatedAt: userDoc.updatedAt,
          },
          accessToken,
        },
        message: "Email verified successfully! Your account is now active.",
      });

      // Update JWT token cookie
      response.cookies.set("auth-token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
        path: "/",
      });

      return response;
    } catch (verificationError: any) {
      console.error("Appwrite verification error:", verificationError);

      // Handle specific Appwrite errors
      if (verificationError.type === "general_argument_invalid") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid verification link. Please check your email for the correct link.",
            message: "Verification failed",
          },
          { status: 400 }
        );
      } else if (verificationError.type === "user_verification_expired") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Verification link has expired. Please request a new verification email.",
            message: "Verification expired",
          },
          { status: 410 }
        ); // Gone
      } else if (verificationError.type === "user_already_verified") {
        // Check if user is already verified in our database too
        try {
          const userDoc = await serverDatabases.getDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            userId
          );

          // Update our database timestamp since Appwrite says it's verified
          await serverDatabases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            userId,
            {
              updatedAt: new Date().toISOString(),
            }
          );

          return NextResponse.json({
            success: true,
            message:
              "Email verification confirmed! Your account is now active.",
          });
        } catch (dbError) {
          console.error("Database error during verification check:", dbError);
          return NextResponse.json(
            {
              success: false,
              error:
                "This email has already been verified. You can sign in to your account.",
              message: "Already verified",
            },
            { status: 409 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to verify email. Please try again or request a new verification link.",
            message: "Verification failed",
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification data",
          message: "Verification failed",
        },
        { status: 400 }
      );
    }

    console.error("Email verification API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during email verification",
        message: "Verification failed",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
