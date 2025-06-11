import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    username: string;
    sessionId: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  private static JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

  /**
   * Extract and validate JWT token from request
   */
  static async validateToken(request: NextRequest): Promise<JWTPayload | null> {
    try {
      // Try to get token from Authorization header
      const authHeader = request.headers.get("authorization");
      let token: string | null = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      // Fallback: try to get token from cookies (for web clients)
      if (!token) {
        token = request.cookies.get("auth-token")?.value || null;
      }

      if (!token) {
        console.log("No token found in request");
        return null;
      }

      // Verify the JWT token
      const payload = verify(token, this.JWT_SECRET) as JWTPayload;

      console.log("Token validated for user:", payload.userId);
      return payload;
    } catch (error: any) {
      console.error("Token validation failed:", error.message);
      return null;
    }
  }

  /**
   * Middleware function to protect API routes
   */
  static async requireAuth(request: NextRequest): Promise<{
    isAuthenticated: boolean;
    user?: JWTPayload;
    error?: string;
  }> {
    const user = await this.validateToken(request);

    if (!user) {
      return {
        isAuthenticated: false,
        error: "Authentication required",
      };
    }

    return {
      isAuthenticated: true,
      user,
    };
  }

  /**
   * Helper to get user ID from request
   */
  static async getUserId(request: NextRequest): Promise<string | null> {
    const user = await this.validateToken(request);
    return user?.userId || null;
  }

  /**
   * Create standardized auth error response
   */
  static createAuthErrorResponse(message: string = "Unauthorized") {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * Helper function to use in API routes
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (request: NextRequest, user: JWTPayload) => Promise<T>
): Promise<T | Response> {
  const auth = await AuthMiddleware.requireAuth(request);

  if (!auth.isAuthenticated || !auth.user) {
    return AuthMiddleware.createAuthErrorResponse(auth.error);
  }

  return handler(request, auth.user);
}

// Helper function to check if a route requires authentication
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    "/dashboard",
    "/habits",
    "/profile",
    "/settings",
    "/streaks",
  ];

  const publicRoutes = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/api/auth/signin",
    "/api/auth/signup",
    "/debug",
  ];

  // Check if it's explicitly public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // Check if it's explicitly protected
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // Default to protected for API routes (except auth)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    return true;
  }

  return false;
}
