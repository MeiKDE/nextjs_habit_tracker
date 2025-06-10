"use client";

import { AuthProvider as AppwriteAuthProvider } from "@/contexts/AuthContext";

// AuthProvider that wraps your app with Appwrite authentication context
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AppwriteAuthProvider>{children}</AppwriteAuthProvider>;
};

export default AuthProvider;
