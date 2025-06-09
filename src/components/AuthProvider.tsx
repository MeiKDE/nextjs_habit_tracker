"use client";

// SessionProvider gives your app access to session/auth data via React Context.
import { SessionProvider } from "next-auth/react";

// React component named AuthProvider that wraps your app (or part of it) with NextAuth's SessionProvider, making authentication session data available to any nested component.
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
export default AuthProvider;
