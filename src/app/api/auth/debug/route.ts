import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";

// GET /api/auth/debug - Debug environment status
export async function GET(request: NextRequest) {
  try {
    // Environment checks
    const hasAppwriteEndpoint = !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const hasAppwriteProject = !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const hasAppwriteAPIKey = !!process.env.APPWRITE_API_KEY;
    const hasAppwriteDatabase = !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    return NextResponse.json({
      authMode: "client-only",
      environment: {
        hasAppwriteEndpoint,
        hasAppwriteProject,
        hasAppwriteAPIKey,
        hasAppwriteDatabase,
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      authMode: "client-only",
      environment: {
        hasAppwriteEndpoint: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        hasAppwriteProject: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        hasAppwriteAPIKey: !!process.env.APPWRITE_API_KEY,
        hasAppwriteDatabase: !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// POST /api/auth/debug - Debug session issues
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "clear-appwrite-sessions" && process.env.APPWRITE_API_KEY) {
      // This is for debugging only - in production, you wouldn't want this
      console.log("Debug: Attempting to clear Appwrite sessions via API key");

      const client = new Client()
        .setEndpoint(
          process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
            "https://cloud.appwrite.io/v1"
        )
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
        .setKey(process.env.APPWRITE_API_KEY);

      const account = new Account(client);

      // Note: This won't work for clearing user sessions as we need user-specific permissions
      // This is mainly for debugging and understanding the issue
      return NextResponse.json({
        message: "API key cannot clear user sessions directly",
        note: "Session clearing must be done client-side with user authentication",
        suggestion: "Use the clearSessions method from the AuthContext",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: "Invalid action or missing API key",
      availableActions: ["clear-appwrite-sessions"],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
