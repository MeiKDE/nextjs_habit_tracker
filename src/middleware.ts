import { NextRequest, NextResponse } from "next/server";

// Define allowed origins for CORS
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
  "http://localhost:8081", // Expo dev server
  "exp://localhost:8081", // Expo development
  // Add your production domains here
  "https://yourapp.com",
  "https://www.yourapp.com",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // Allow development origins in non-production
  if (process.env.NODE_ENV !== "production") {
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("exp://") ||
      origin.startsWith("http://192.168.") ||
      origin.startsWith("http://10.0.")
    ) {
      return true;
    }
  }

  return ALLOWED_ORIGINS.includes(origin);
}

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      const allowOrigin = isAllowedOrigin(origin) ? origin! : "null";

      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }

    // Handle actual requests with security headers
    const response = NextResponse.next();
    const allowOrigin = isAllowedOrigin(origin) ? origin! : "null";

    // CORS headers
    response.headers.set("Access-Control-Allow-Origin", allowOrigin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    // Rate limiting headers
    response.headers.set("X-RateLimit-Limit", "100");
    response.headers.set("X-RateLimit-Remaining", "99");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
