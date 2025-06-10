import { NextRequest, NextResponse } from "next/server";
import { ServerHabitsService } from "@/lib/habits-appwrite";
import { z } from "zod";

const createHabitSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  userId: z.string().min(1),
});

// GET /api/habits - Get all habits for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching habits for user:", userId);

    const habits = await ServerHabitsService.getUserHabits(userId);

    return NextResponse.json({
      success: true,
      data: habits,
    });
  } catch (error: any) {
    console.error("Error fetching habits:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, frequency, userId } =
      createHabitSchema.parse(body);

    console.log("Creating habit for user:", userId);

    const habit = await ServerHabitsService.createHabit(
      userId,
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
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating habit:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
