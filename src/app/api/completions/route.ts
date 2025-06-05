import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getUserFromJWT } from "@/lib/jwt-auth";

// Helper function to get user from either NextAuth session or JWT token
async function getAuthenticatedUser(request: NextRequest) {
  // Try JWT first (for React Native)
  const jwtUser = await getUserFromJWT(request);
  if (jwtUser) {
    return jwtUser;
  }

  // Fallback to NextAuth session (for web)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email!,
      username: (session.user as any).username,
      name: session.user.name,
    };
  }

  return null;
}

// GET /api/completions - Get all completions for all user's habits
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all completions for habits that belong to the user
    const completions = await prisma.habitCompletion.findMany({
      where: {
        habit: {
          userId: user.id,
          isActive: true,
        },
      },
      include: {
        habit: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: completions,
    });
  } catch (error) {
    console.error("Error fetching completions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
