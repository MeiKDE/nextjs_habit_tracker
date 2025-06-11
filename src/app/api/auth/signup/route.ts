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
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  name: z.string().optional(),
});

// Server-side user creation using Appwrite API keys
async function createUser(
  email: string,
  password: string,
  username: string,
  name?: string
) {
  try {
    // First check if email or username already exists
    const [emailCheck, usernameCheck] = await Promise.all([
      serverDatabases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
        Query.equal("email", email),
      ]),
      serverDatabases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
        Query.equal("username", username),
      ]),
    ]);

    if (emailCheck.documents.length > 0) {
      throw new Error("User with this email already exists");
    }

    if (usernameCheck.documents.length > 0) {
      throw new Error("Username is already taken");
    }

    // Create user account using server-side Appwrite
    const { Client, Account, ID } = require("node-appwrite");

    const tempClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "");

    const tempAccount = new Account(tempClient);

    // Create the user account
    const user = await tempAccount.create(
      ID.unique(),
      email,
      password,
      name || username
    );

    console.log("User account created with ID:", user.$id);

    // Create user document in database using server API
    const userDoc = await serverDatabases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      user.$id,
      {
        email,
        username,
        name: name || username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    console.log("User document created in database");

    return {
      user: userDoc,
    };
  } catch (error: any) {
    console.error("User creation error:", error);
    throw new Error(error.message || "Failed to create user");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { email, username, password, name } = signupSchema.parse(body);

    console.log("Attempting to create user:", email);

    // Create user using server-side method
    const { user } = await createUser(email, password, username, name);

    console.log("User creation successful:", user.$id);

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const accessToken = sign(
      {
        userId: user.$id,
        email: user.email,
        username: user.username,
        sessionId: `server-${user.$id}-${Date.now()}`, // Create a server-side session ID
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return both cookie and token for cross-platform compatibility
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
      message: "User created successfully",
    });

    // Set JWT token cookie for web clients
    response.cookies.set("auth-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    console.log("JWT token created and cookie set for user:", user.$id);

    return response;
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

    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        message: "Registration failed",
      },
      { status: 500 }
    );
  }
}
