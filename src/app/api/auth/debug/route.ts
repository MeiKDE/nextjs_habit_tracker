import { NextRequest, NextResponse } from "next/server";

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
