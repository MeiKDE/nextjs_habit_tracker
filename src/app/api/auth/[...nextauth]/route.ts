import NextAuth, { type NextAuthOptions } from "next-auth";
import { authOptions } from "@/lib/auth";

// This code wires up NextAuth authentication in a Next.js API route.
// It creates a handler configured by your authOptions.
// It handles both GET and POST HTTP requests using that handler.
// This allows NextAuth to manage sign-in, sign-out, session retrieval, and other auth-related requests seamlessly.

// Ensure NextAuth is properly initialized with error handling
const handler = NextAuth(authOptions as NextAuthOptions);

// Export named GET and POST handlers for App Router
export const GET = handler;
export const POST = handler;
