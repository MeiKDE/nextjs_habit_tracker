import { NextRequest, NextResponse } from "next/server"; // For handling requests/responses in App Router
import { z } from "zod"; // Schema validation
import { sign } from "jsonwebtoken";
import {
  serverDatabases,
  DATABASE_ID,
  COLLECTIONS,
  Query,
} from "@/lib/appwrite";

const signinSchema = z.object({
  email: z.string().email(), // must be valid email format
  password: z.string().min(1), // must be at least 1 character
});

// Server-side user lookup and JWT creation
async function authenticateAndCreateJWT(email: string, appwriteUserId: string) {
  try {
    // Find user by email in the database
    const users = await serverDatabases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal("email", email)]
    );

    if (users.documents.length === 0) {
      throw new Error("User not found in database");
    }

    const userDoc = users.documents[0];

    // Verify that the Appwrite user ID matches
    if (userDoc.$id !== appwriteUserId) {
      throw new Error("User ID mismatch");
    }

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const accessToken = sign(
      {
        userId: userDoc.$id,
        email: userDoc.email,
        username: userDoc.username,
        sessionId: `server-${userDoc.$id}-${Date.now()}`,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      user: userDoc,
      accessToken,
    };
  } catch (error: any) {
    console.error("JWT creation error:", error);
    throw new Error("Authentication failed");
  }
}

// This endpoint now expects the client to handle Appwrite authentication
// and pass the authenticated user info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a client-authenticated request (with user session info)
    if (body.appwriteUserId && body.sessionId) {
      console.log(
        "Processing client-authenticated signin for user:",
        body.email
      );

      const { user, accessToken } = await authenticateAndCreateJWT(
        body.email,
        body.appwriteUserId
      );

      // Return JWT token for API access
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
        },
        message: "Signed in successfully",
      });

      // Set JWT token cookie for web clients
      response.cookies.set("auth-token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
        path: "/",
      });

      return response;
    }

    // If no client session info, return error asking client to authenticate first
    return NextResponse.json(
      {
        success: false,
        error: "Client authentication required",
        message: "Please authenticate with Appwrite client first",
      },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.errors,
          message: "Validation failed",
        },
        { status: 400 }
      );
    }

    console.error("Signin error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Authentication failed",
        message: "Authentication failed",
      },
      { status: 401 }
    );
  }
}
