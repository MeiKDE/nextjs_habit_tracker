import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createCompletionSchema = z.object({
  completedAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// POST /api/habits/[id]/completions - Mark habit as complete
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { completedAt, notes } = createCompletionSchema.parse(body);

    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Check if already completed today
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const existingCompletion = await prisma.habitCompletion.findFirst({
      where: {
        habitId: params.id,
        completedAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    if (existingCompletion) {
      return NextResponse.json(
        { error: "Habit already completed today" },
        { status: 400 }
      );
    }

    // Create completion
    const completion = await prisma.habitCompletion.create({
      data: {
        habitId: params.id,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        notes,
      },
    });

    // Update habit streak and last completed
    const updatedHabit = await prisma.habit.update({
      where: {
        id: params.id,
      },
      data: {
        streakCount: habit.streakCount + 1,
        lastCompleted: completion.completedAt,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: completion,
      message: "Habit completed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating completion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/habits/[id]/completions - Get completions for a habit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const completions = await prisma.habitCompletion.findMany({
      where: {
        habitId: params.id,
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
