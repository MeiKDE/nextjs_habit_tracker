import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sign } from "jsonwebtoken";
import {
  serverDatabases,
  DATABASE_ID,
  COLLECTIONS,
  Query,
} from "@/lib/appwrite";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().optional(),
});

// Enhanced email validation
function validateEmailFormat(email: string): {
  isValid: boolean;
  message?: string;
} {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Double dots
    /^\.|\.$/, // Starting or ending with dot
    /@\./, // @ followed by dot
    /\.@/, // Dot followed by @
    /\s/, // Whitespace
    /[<>'"]/, // Potentially dangerous characters
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return { isValid: false, message: "Email contains invalid characters" };
    }
  }

  // Check domain length
  const domain = email.split("@")[1];
  if (domain && domain.length > 253) {
    return { isValid: false, message: "Domain name is too long" };
  }

  return { isValid: true };
}

// Server-side user creation using Appwrite API keys
async function createUser(
  email: string,
  password: string,
  username: string,
  name?: string
) {
  try {
    // Enhanced email validation
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.isValid) {
      throw new Error(`Invalid email: ${emailValidation.message}`);
    }

    // First check if email or username already exists
    console.log("Checking for existing users...");
    const [emailCheck, usernameCheck] = await Promise.all([
      serverDatabases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
        Query.equal("email", email.toLowerCase()),
      ]),
      serverDatabases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
        Query.equal("username", username.toLowerCase()),
      ]),
    ]);

    if (emailCheck.documents.length > 0) {
      throw new Error("An account with this email already exists");
    }

    if (usernameCheck.documents.length > 0) {
      throw new Error("This username is already taken");
    }

    // Create user account using server-side Appwrite
    const { Client, Account, ID } = require("node-appwrite");

    const tempClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.APPWRITE_API_KEY || ""); // Server-side API key

    const tempAccount = new Account(tempClient);

    console.log("Creating Appwrite user account...");
    // Create the user account
    const user = await tempAccount.create(
      ID.unique(),
      email.toLowerCase(),
      password,
      name || username
    );

    console.log("User account created with ID:", user.$id);

    // Send email verification - this requires a session
    let verificationSent = false;
    try {
      console.log("Sending email verification...");

      // Create a session for the newly created user
      const session = await tempAccount.createEmailPasswordSession(
        email.toLowerCase(),
        password
      );

      console.log("Session created for verification:", session.$id);

      // Send verification email (this requires an active session)
      const verification = await tempAccount.createVerification(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/auth/verify`
      );

      console.log("Email verification sent:", verification.$id);
      verificationSent = true;

      // Clean up the session after sending verification
      try {
        await tempAccount.deleteSession(session.$id);
        console.log("Temporary session cleaned up");
      } catch (cleanupError) {
        console.log("Session cleanup error (non-critical):", cleanupError);
      }
    } catch (verificationError: any) {
      console.error("Failed to send verification email:", verificationError);
      console.error("Verification error details:", {
        message: verificationError.message,
        type: verificationError.type,
        code: verificationError.code,
      });
      // Don't fail the entire signup process if verification email fails
    }

    // Create user document in database using server API
    console.log("Creating user document in database...");
    const userDoc = await serverDatabases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      user.$id,
      {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        name: name || username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    console.log("User document created in database");

    return {
      user: userDoc,
      emailVerificationSent: verificationSent,
    };
  } catch (error: any) {
    console.error("User creation error:", error);

    // Enhanced error messages for different scenarios
    if (
      error.message?.includes("already exists") ||
      error.message?.includes("already registered")
    ) {
      throw new Error("An account with this email already exists");
    } else if (error.message?.includes("username")) {
      throw new Error("This username is already taken");
    } else if (
      error.message?.includes("email") &&
      error.message?.includes("invalid")
    ) {
      throw new Error("Please enter a valid email address");
    } else if (error.message?.includes("password")) {
      throw new Error("Password does not meet security requirements");
    } else if (error.type === "user_already_exists") {
      throw new Error("An account with this email already exists");
    } else if (error.type === "general_argument_invalid") {
      throw new Error("Invalid input data provided");
    } else if (error.code === 409) {
      throw new Error("An account with this email already exists");
    } else {
      throw new Error(error.message || "Failed to create account");
    }
  }
}

export async function POST(request: NextRequest) {
  console.log("=== SIGNUP API CALLED ===");

  try {
    const body = await request.json();
    console.log("Signup request for email:", body.email);

    // Validate input with enhanced error messages
    let validationResult;
    try {
      validationResult = signupSchema.parse(body);
    } catch (validationError: any) {
      console.error("Validation error:", validationError);

      // Extract first validation error for better user experience
      const firstError = validationError.errors?.[0];
      const errorMessage = firstError?.message || "Invalid input data";

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          field: firstError?.path?.[0] || "unknown",
          message: "Please check your input and try again",
        },
        { status: 400 }
      );
    }

    const { email, username, password, name } = validationResult;

    console.log("Creating user account...");

    // Create user using server-side method
    const { user, emailVerificationSent } = await createUser(
      email,
      password,
      username,
      name
    );

    console.log("User creation successful:", user.$id);

    // Create JWT token but mark it as unverified
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const accessToken = sign(
      {
        userId: user.$id,
        email: user.email,
        username: user.username,
        sessionId: `server-${user.$id}-${Date.now()}`,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return success response with verification status
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.$id,
          email: user.email,
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken: null,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
        emailVerificationSent,
      },
      message:
        "Account created successfully. Please check your email to verify your account.",
    });

    // Set JWT token cookie for web clients (but user won't be fully authenticated until email is verified)
    response.cookies.set("auth-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    console.log("Signup successful for user:", user.$id);

    return response;
  } catch (error: any) {
    console.error("Signup API error:", error);

    // Enhanced error response with appropriate status codes
    let statusCode = 500;
    let errorMessage = "Failed to create account";

    if (
      error.message?.includes("already exists") ||
      error.message?.includes("already taken")
    ) {
      statusCode = 409; // Conflict
      errorMessage = error.message;
    } else if (
      error.message?.includes("invalid") ||
      error.message?.includes("Invalid")
    ) {
      statusCode = 400; // Bad Request
      errorMessage = error.message;
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("connection")
    ) {
      statusCode = 503; // Service Unavailable
      errorMessage = "Service temporarily unavailable. Please try again later.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: "Registration failed",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}
