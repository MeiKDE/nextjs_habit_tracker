import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This code wires up NextAuth authentication in a Next.js API route.
// It creates a handler configured by your authOptions.
// It handles both GET and POST HTTP requests using that handler.
// This allows NextAuth to manage sign-in, sign-out, session retrieval, and other auth-related requests seamlessly.

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
