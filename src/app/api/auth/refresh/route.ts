import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/jwt-auth";
import { z } from "zod";

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { refreshToken } = refreshSchema.parse(body);

    // Attempt to refresh the access token
    const tokenPair = await refreshAccessToken(refreshToken);

    if (!tokenPair) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
      },
      message: "Token refreshed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
