import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  serverDatabases,
  DATABASE_ID,
  COLLECTIONS,
  Query,
} from "@/lib/appwrite";

const resendVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  console.log("=== RESEND VERIFICATION API CALLED ===");

  try {
    const body = await request.json();
    console.log("Resend verification request for email:", body.email);

    // Validate input
    const { email } = resendVerificationSchema.parse(body);

    // Check if user exists in our database
    const userCheck = await serverDatabases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal("email", email.toLowerCase())]
    );

    if (userCheck.documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No account found with this email address. Please check your email or create a new account.",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const userDoc = userCheck.documents[0];

    // User exists, proceed with resending verification

    // Send new verification email using Appwrite
    const { Client, Account } = require("node-appwrite");

    const tempClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.APPWRITE_API_KEY || "");

    const tempAccount = new Account(tempClient);

    try {
      console.log("Creating temporary session to send verification email...");

      // Get user from Appwrite by ID
      const appwriteUser = await tempAccount.get(userDoc.$id);

      if (!appwriteUser) {
        return NextResponse.json(
          {
            success: false,
            error: "User account not found. Please create a new account.",
            message: "User not found",
          },
          { status: 404 }
        );
      }

      // Create verification email
      const verification = await tempAccount.createVerification(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/auth/verify`
      );

      console.log("Verification email sent:", verification.$id);

      return NextResponse.json({
        success: true,
        data: {
          verificationId: verification.$id,
          email: email.toLowerCase(),
        },
        message:
          "Verification email sent successfully! Please check your inbox and spam folder.",
      });
    } catch (appwriteError: any) {
      console.error("Appwrite resend verification error:", appwriteError);

      // Handle specific Appwrite errors
      if (appwriteError.type === "user_not_found") {
        return NextResponse.json(
          {
            success: false,
            error: "User account not found. Please create a new account.",
            message: "User not found",
          },
          { status: 404 }
        );
      } else if (appwriteError.type === "user_already_verified") {
        // Update our database timestamp
        await serverDatabases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          userDoc.$id,
          {
            updatedAt: new Date().toISOString(),
          }
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "This email is already verified. You can sign in to your account.",
            message: "Already verified",
          },
          { status: 409 }
        );
      } else if (appwriteError.type === "general_rate_limit_exceeded") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Too many verification emails sent. Please wait a few minutes before requesting another.",
            message: "Rate limit exceeded",
          },
          { status: 429 }
        ); // Too Many Requests
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to send verification email. Please try again later.",
            message: "Send failed",
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
          error: "Please enter a valid email address",
          message: "Invalid input",
        },
        { status: 400 }
      );
    }

    console.error("Resend verification API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while sending verification email",
        message: "Server error",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
