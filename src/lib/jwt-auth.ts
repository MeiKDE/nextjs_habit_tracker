import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import crypto from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Ensure we have proper secrets in production
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.NEXTAUTH_SECRET || !process.env.JWT_REFRESH_SECRET)
) {
  throw new Error("JWT secrets must be configured in production");
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function verifyJWTToken(
  token: string,
  tokenType: "access" | "refresh" = "access"
): Promise<JWTPayload | null> {
  try {
    const secret = tokenType === "access" ? JWT_SECRET : JWT_REFRESH_SECRET;
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Verify token type matches
    if (decoded.type !== tokenType) {
      console.error("Token type mismatch");
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("Token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error("Invalid token");
    } else {
      console.error("JWT verification failed:", error);
    }
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
    const payload = await verifyJWTToken(token, "access");

    if (!payload) {
      return null;
    }

    // Verify user still exists in database and is active
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

    if (!user) {
      console.warn("User not found for valid JWT token");
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user from JWT:", error);
    return null;
  }
}

export function generateTokenPair(user: {
  id: string;
  email: string;
  username: string;
}): TokenPair {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: "access",
    },
    JWT_SECRET,
    { expiresIn: "15m" } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: "refresh",
      tokenId: crypto.randomUUID(), // Unique identifier for refresh token
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // Longer-lived refresh token
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

// Legacy function for backward compatibility
export function generateJWTToken(user: {
  id: string;
  email: string;
  username: string;
}): string {
  const tokenPair = generateTokenPair(user);
  return tokenPair.accessToken;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenPair | null> {
  try {
    const payload = await verifyJWTToken(refreshToken, "refresh");

    if (!payload) {
      return null;
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      return null;
    }

    // Generate new token pair
    return generateTokenPair(user);
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;
  }
}

// Utility function to extract token from request
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}

// Utility function to validate token strength
export function isTokenSecure(token: string): boolean {
  // Basic token strength validation
  return (
    token.length >= 32 &&
    /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)
  );
}
