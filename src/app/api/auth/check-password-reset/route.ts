import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkSchema = z.object({
  email: z.string().email(),
});

// Check if a user needs a password reset after Argon2id migration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = checkSchema.parse(body);

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if password is the invalidated temporary password
    const needsReset = user.password.includes(
      "INVALID_TEMP_PASSWORD_REQUIRES_RESET"
    );

    return NextResponse.json({
      success: true,
      data: {
        needsPasswordReset: needsReset,
        message: needsReset
          ? "Your password was invalidated during a security upgrade. Please reset your password."
          : "Your password is up to date.",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Check password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
