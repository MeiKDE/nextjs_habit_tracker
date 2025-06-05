import { NextRequest, NextResponse } from "next/server";

// Example:
// You have:
// Your frontend app on https://myfrontend.com
// Your backend API on https://myapi.com
// If your frontend tries to fetch data from https://myapi.com, the browser sends a preflight request to myapi.com asking permission. If the backend replies:
// http
// Copy
// Edit
// Access-Control-Allow-Origin: https://myfrontend.com
// Access-Control-Allow-Methods: GET, POST
// Then the browser allows the frontend to fetch data.

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Handle preflight requests
    // check CORS permissions before the actual request.
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    // For non-OPTIONS requests to /api/ routes,
    // continue processing normally (let the request hit the API route handler).
    // Handle actual requests
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
