"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthService } from "@/lib/auth-client";
import { User } from "@/types";
import { account } from "@/lib/appwrite";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    name?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  clearSessions: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const clearInvalidSession = async () => {
    console.log("Clearing invalid session...");
    try {
      // Clear client session
      try {
        await account.deleteSession("current");
      } catch (e) {
        console.log("No current session to delete on client");
      }

      console.log("Invalid session cleared");
    } catch (error) {
      console.error("Error clearing invalid session:", error);
    }
  };

  // Add a force refresh method for debugging
  const forceRefresh = async () => {
    console.log("Force refreshing authentication state...");
    setUser(null);
    setLoading(true);
    await checkAuth();
  };

  const checkAuth = async () => {
    try {
      // Try to get current user directly - if this fails, user is not authenticated
      const currentUser = await AuthService.getCurrentUser();

      if (currentUser) {
        console.log("Valid user session found:", currentUser.$id);
        setUser(currentUser);
      } else {
        console.log("No authenticated user found");
        setUser(null);
      }
    } catch (error: any) {
      // Don't log guest user errors as actual errors - this is expected
      if (
        error.message?.includes("missing scope") ||
        error.message?.includes("guests") ||
        error.message?.includes("User (role: guests)")
      ) {
        console.log("User is not authenticated");
      } else {
        console.error("Auth check failed:", error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process...");

      const { user, session } = await AuthService.signIn(email, password);

      console.log("Sign in successful, user ID:", user.$id);
      setUser(user as unknown as User);
      console.log("Sign in process completed successfully");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    name?: string
  ) => {
    try {
      console.log("Starting sign up process...");

      const { user, session } = await AuthService.signUp(
        email,
        password,
        username,
        name
      );

      console.log("Sign up successful, user ID:", user.$id);
      setUser(user as unknown as User);
      console.log("Sign up process completed successfully");
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
    }
  };

  const clearSessions = async () => {
    try {
      await AuthService.clearAllSessions();
    } catch (error) {
      console.error("Clear sessions error:", error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    clearSessions,
    forceRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
