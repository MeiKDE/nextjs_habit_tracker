import { NextRequest, NextResponse } from "next/server";

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export async function withAuth(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
) {
  // Client-only authentication - no server-side auth checks needed
  return NextResponse.next();
}

export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  return (request: NextRequest) => withAuth(request, options);
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
