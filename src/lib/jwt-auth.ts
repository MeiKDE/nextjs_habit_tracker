import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export async function verifyJWTToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function getUserFromJWT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const payload = await verifyJWTToken(token);

    if (!payload) {
      return null;
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user from JWT:", error);
    return null;
  }
}

export function generateJWTToken(user: {
  id: string;
  email: string;
  username: string;
}): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
