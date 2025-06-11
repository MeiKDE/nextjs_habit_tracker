"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
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

  // Add a force refresh method for debugging
  const forceRefresh = async () => {
    console.log("Force refreshing authentication state...");
    setUser(null);
    setLoading(true);
    await checkAuth();
  };

  const checkAuth = async () => {
    try {
      // First check if we have a valid JWT session
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log("Valid JWT session found:", data.data.id);
          setUser(data.data);
          return;
        }
      }

      // If no valid JWT, check if we have an Appwrite session
      try {
        console.log("Checking for Appwrite session...");
        const currentUser = await account.get();
        console.log("Found Appwrite session for user:", currentUser.email);

        // We have an Appwrite session but no JWT, sync them
        console.log("Syncing Appwrite session with JWT...");
        const sessions = await account.listSessions();
        const currentSession =
          sessions.sessions.find((s) => s.current) || sessions.sessions[0];

        const syncResponse = await fetch("/api/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: currentUser.email,
            appwriteUserId: currentUser.$id,
            sessionId: currentSession?.$id || "existing-session",
          }),
        });

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          if (syncData.success && syncData.data) {
            console.log("Successfully synced sessions:", syncData.data.user.id);
            setUser(syncData.data.user);
            return;
          }
        }
      } catch (appwriteError) {
        console.log("No Appwrite session found");
      }

      // No valid sessions found
      console.log("No authenticated user found");
      setUser(null);
    } catch (error: any) {
      console.log("Auth check failed:", error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process...");

      let session;
      let currentUser;

      try {
        // First, check if there's already an active session
        console.log("Checking for existing session...");
        currentUser = await account.get();
        console.log("Found existing session for user:", currentUser.email);

        // If the existing user matches the login email, use the existing session
        if (currentUser.email === email) {
          console.log("Using existing session for same user");
          // We don't have the session object, but we can get current session info
          const sessions = await account.listSessions();
          session =
            sessions.sessions.find((s) => s.current) || sessions.sessions[0];
        } else {
          console.log("Different user, clearing existing session...");
          // Different user, clear the existing session
          await account.deleteSession("current");
          throw new Error("NEED_NEW_SESSION"); // This will trigger the catch block
        }
      } catch (error: any) {
        // No existing session or need to create new session
        console.log("Creating new Appwrite session...");
        session = await account.createEmailPasswordSession(email, password);
        console.log("Appwrite session created:", session.$id);

        // Get current user info from Appwrite
        currentUser = await account.get();
        console.log("Current user from Appwrite:", currentUser.$id);
      }

      // Now exchange the Appwrite session for a JWT token from our API
      console.log("Exchanging session for JWT token...");
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: currentUser.email,
          appwriteUserId: currentUser.$id,
          sessionId: session?.$id || "existing-session",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If JWT creation fails, clean up the Appwrite session (only if we created it)
        if (session && session.$id !== "existing-session") {
          try {
            await account.deleteSession(session.$id);
          } catch (cleanupError) {
            console.error("Failed to cleanup Appwrite session:", cleanupError);
          }
        }
        throw new Error(data.error || "Sign in failed");
      }

      console.log("Sign in successful, user ID:", data.data.user.id);
      setUser(data.data.user);
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

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, username, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      console.log("Sign up successful, user ID:", data.data.user.id);
      setUser(data.data.user);
      console.log("Sign up process completed successfully");
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // First, clean up the Appwrite session
      try {
        await account.deleteSession("current");
        console.log("Appwrite session deleted");
      } catch (appwriteError) {
        console.error("Failed to delete Appwrite session:", appwriteError);
        // Continue with JWT cleanup even if Appwrite cleanup fails
      }

      // Then clean up the JWT cookie
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
      console.log("JWT token cleared");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
    }
  };

  const clearSessions = async () => {
    try {
      await fetch("/api/auth/clear-sessions", {
        method: "POST",
        credentials: "include",
      });
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
