import { NextRequest, NextResponse } from "next/server";
import { ServerHabitsService } from "@/lib/habits-appwrite";
import { z } from "zod";
import { withAuth } from "@/lib/auth-middleware";

const updateHabitSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/habits/[id] - Update a habit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const updateData = updateHabitSchema.parse(body);

      console.log(
        "Updating habit:",
        id,
        "for authenticated user:",
        user.userId
      );

      const updatedHabit = await ServerHabitsService.updateHabit(
        id,
        user.userId,
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

      console.error("Error updating habit:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
          message: "Failed to update habit",
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params;

      console.log(
        "Deleting habit:",
        id,
        "for authenticated user:",
        user.userId
      );

      await ServerHabitsService.deleteHabit(id, user.userId);

      return NextResponse.json({
        success: true,
        message: "Habit deleted successfully",
      });
    } catch (error: any) {
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

      console.error("Error deleting habit:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
          message: "Failed to delete habit",
        },
        { status: 500 }
      );
    }
  });
}
