import { NextRequest, NextResponse } from "next/server";
import { ServerHabitsService } from "@/lib/habits-appwrite";
import { z } from "zod";
import { withAuth } from "@/lib/auth-middleware";

const createHabitSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
});

// GET /api/habits - Get all habits for the authenticated user
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log("Fetching habits for authenticated user:", user.userId);

      const habits = await ServerHabitsService.getUserHabits(user.userId);

      return NextResponse.json({
        success: true,
        data: habits,
      });
    } catch (error: any) {
      console.error("Error fetching habits:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
          message: "Failed to fetch habits",
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      const { title, description, frequency } = createHabitSchema.parse(body);

      console.log("Creating habit for authenticated user:", user.userId);

      const habit = await ServerHabitsService.createHabit(
        user.userId,
        title,
        description,
        frequency
      );

      return NextResponse.json({
        success: true,
        data: habit,
        message: "Habit created successfully",
      });
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

      console.error("Error creating habit:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
          message: "Failed to create habit",
        },
        { status: 500 }
      );
    }
  });
}
