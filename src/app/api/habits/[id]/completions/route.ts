import { NextRequest, NextResponse } from "next/server";
import { ServerHabitsService } from "@/lib/habits-appwrite";
import {
  serverDatabases,
  DATABASE_ID,
  COLLECTIONS,
  Query,
} from "@/lib/appwrite";
import { z } from "zod";
import { withAuth } from "@/lib/auth-middleware";

const createCompletionSchema = z.object({
  completedAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// POST /api/habits/[id]/completions - Mark habit as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { notes } = createCompletionSchema.parse(body);

      console.log(
        "Creating completion for habit:",
        id,
        "authenticated user:",
        user.userId
      );

      // First, verify that the habit exists and belongs to the user
      try {
        const habit = await serverDatabases.getDocument(
          DATABASE_ID,
          COLLECTIONS.HABITS,
          id
        );

        if ((habit as any).userId !== user.userId) {
          return NextResponse.json(
            {
              success: false,
              error: "Habit not found or access denied",
              message: "Habit not found or access denied",
            },
            { status: 404 }
          );
        }

        if (!(habit as any).isActive) {
          return NextResponse.json(
            {
              success: false,
              error: "Habit is no longer active",
              message: "Habit is no longer active",
            },
            { status: 400 }
          );
        }

        console.log("Habit verified successfully:", {
          habitId: id,
          title: (habit as any).title,
          userId: (habit as any).userId,
        });
      } catch (error: any) {
        console.error("Failed to verify habit:", {
          habitId: id,
          userId: user.userId,
          error: error.message,
        });

        if (
          error.message.includes(
            "Document with the requested ID could not be found"
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Habit with ID ${id} not found. Please refresh your habits and try again.`,
              message: "Habit not found",
            },
            { status: 404 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: "Failed to verify habit access",
            message: "Failed to verify habit access",
          },
          { status: 500 }
        );
      }

      // Check if already completed today
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const existingCompletions = await serverDatabases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HABIT_COMPLETIONS,
        [
          Query.equal("habitId", id),
          Query.greaterThanEqual("completedAt", todayStart.toISOString()),
          Query.lessThan("completedAt", todayEnd.toISOString()),
        ]
      );

      if (existingCompletions.documents.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Habit already completed today",
            message: "Habit already completed today",
          },
          { status: 400 }
        );
      }

      // Create completion using ServerHabitsService
      try {
        const completion = await ServerHabitsService.completeHabit(
          id,
          user.userId,
          notes
        );

        return NextResponse.json({
          success: true,
          data: completion,
          message: "Habit completed successfully",
        });
      } catch (error: any) {
        console.error("ServerHabitsService.completeHabit failed:", {
          habitId: id,
          userId: user.userId,
          error: error.message,
        });

        // If the habit is not found, return a more specific error
        if (
          error.message.includes(
            "Document with the requested ID could not be found"
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Habit with ID ${id} not found. Please refresh and try again.`,
              message: "Habit not found",
            },
            { status: 404 }
          );
        }

        throw error; // Re-throw other errors to be handled by outer catch
      }
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

      if (error.message === "Unauthorized") {
        return NextResponse.json(
          {
            success: false,
            error: "Habit not found",
            message: "Habit not found or access denied",
          },
          { status: 404 }
        );
      }

      console.error("Error creating completion:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
          message: "Failed to complete habit",
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/habits/[id]/completions - Get completions for a habit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params;

      console.log(
        "Fetching completions for habit:",
        id,
        "authenticated user:",
        user.userId
      );

      // Get completions using ServerHabitsService
      const completions = await ServerHabitsService.getHabitCompletions(id);

      return NextResponse.json({
        success: true,
        data: completions,
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
