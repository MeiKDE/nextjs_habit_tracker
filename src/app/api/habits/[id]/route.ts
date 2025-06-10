import { NextRequest, NextResponse } from "next/server";
import { ServerHabitsService } from "@/lib/habits-appwrite";
import { z } from "zod";

const updateHabitSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  isActive: z.boolean().optional(),
  userId: z.string().min(1),
});

// PUT /api/habits/[id] - Update a habit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, ...updateData } = updateHabitSchema.parse(body);

    console.log("Updating habit:", id, "for user:", userId);

    const updatedHabit = await ServerHabitsService.updateHabit(
      id,
      userId,
      updateData
    );

    return NextResponse.json({
      success: true,
      data: updatedHabit,
      message: "Habit updated successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    console.error("Error updating habit:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("Deleting habit:", id, "for user:", userId);

    await ServerHabitsService.deleteHabit(id, userId);

    return NextResponse.json({
      success: true,
      message: "Habit deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    console.error("Error deleting habit:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
