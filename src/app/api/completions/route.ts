import { NextRequest, NextResponse } from "next/server";
import {
  serverDatabases,
  DATABASE_ID,
  COLLECTIONS,
  Query,
} from "@/lib/appwrite";
import { withAuth } from "@/lib/auth-middleware";

// GET /api/completions - Get all completions for all user's habits
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log("Fetching completions for authenticated user:", user.userId);

      // First get all user's habits
      const habits = await serverDatabases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        [Query.equal("userId", user.userId), Query.equal("isActive", true)]
      );

      // Get all completions for these habits
      const habitIds = habits.documents.map((habit: any) => habit.$id);

      if (habitIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const completions = await serverDatabases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HABIT_COMPLETIONS,
        [Query.equal("habitId", habitIds), Query.orderDesc("completedAt")]
      );

      // Add habit info to each completion
      const completionsWithHabits = completions.documents.map(
        (completion: any) => {
          const habit = habits.documents.find(
            (h: any) => h.$id === completion.habitId
          );
          return {
            ...completion,
            habit: habit
              ? {
                  $id: habit.$id,
                  title: (habit as any).title,
                }
              : null,
          };
        }
      );

      return NextResponse.json({
        success: true,
        data: completionsWithHabits,
      });
    } catch (error: any) {
      console.error("Error fetching completions:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
          message: "Failed to fetch completions",
        },
        { status: 500 }
      );
    }
  });
}
