import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== EMAIL TEST API CALLED ===");

  try {
    // Test Appwrite configuration without requiring user credentials
    const { Client, Account } = require("node-appwrite");

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.APPWRITE_API_KEY || "");

    const account = new Account(client);

    console.log("Testing Appwrite configuration...");
    console.log("Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
    console.log("Project ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
    console.log("API Key available:", !!process.env.APPWRITE_API_KEY);
    console.log("App URL:", process.env.NEXT_PUBLIC_APP_URL);

    // Test 1: Check if we can connect to Appwrite
    try {
      // Try to list users using server-side API (this tests API key and connection)
      const { Users } = require("node-appwrite");
      const users = new Users(client);
      const userList = await users.list();
      console.log(
        "✅ Appwrite connection successful. User count:",
        userList.total
      );

      return NextResponse.json({
        success: true,
        message: "Appwrite connection test successful",
        data: {
          endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
          projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
          appUrl: process.env.NEXT_PUBLIC_APP_URL,
          userCount: userList.total,
          connection: "✅ Connected",
          apiKeyStatus: "✅ Valid",
        },
      });
    } catch (connectionError: any) {
      console.error("❌ Appwrite connection failed:", connectionError);

      return NextResponse.json(
        {
          success: false,
          error: "Appwrite connection failed",
          details: {
            message: connectionError.message,
            type: connectionError.type,
            code: connectionError.code,
            endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
            projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
            hasApiKey: !!process.env.APPWRITE_API_KEY,
            apiKeyLength: process.env.APPWRITE_API_KEY?.length || 0,
            suggestions: [
              "Check if APPWRITE_API_KEY is set correctly in .env.local",
              "Verify API key has 'Users' scope with read permissions",
              "Ensure NEXT_PUBLIC_APPWRITE_ENDPOINT is correct",
              "Confirm NEXT_PUBLIC_APPWRITE_PROJECT_ID matches your Appwrite project",
            ],
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Email test API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Configuration test failed",
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
