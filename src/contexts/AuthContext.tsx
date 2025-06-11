"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { account } from "@/lib/appwrite";
import { isGuestUserError } from "@/lib/session-utils";

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

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// Helper function to decode JWT token without verification (client-side)
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

// Helper function to check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add debugging to track the auth check
    console.log("AuthProvider: Starting authentication check");
    checkAuth();
  }, []);

  // Add a force refresh method for debugging
  const forceRefresh = async () => {
    console.log("Force refreshing authentication state...");
    setUser(null);
    setLoading(true);
    await checkAuth();
  };

  const clearAllStorage = () => {
    try {
      // Clear any potential Appwrite-related storage
      if (typeof window !== "undefined") {
        // Clear localStorage items that might be related to Appwrite
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (
            key.includes("appwrite") ||
            key.includes("session") ||
            key.includes("auth")
          ) {
            localStorage.removeItem(key);
            console.log(`Cleared localStorage key: ${key}`);
          }
        });

        // Clear sessionStorage items that might be related to Appwrite
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach((key) => {
          if (
            key.includes("appwrite") ||
            key.includes("session") ||
            key.includes("auth")
          ) {
            sessionStorage.removeItem(key);
            console.log(`Cleared sessionStorage key: ${key}`);
          }
        });
      }
    } catch (error) {
      console.log("Error clearing storage:", error);
    }
  };

  // Helper function to handle session conflicts
  const handleSessionConflict = async () => {
    console.log("Handling session conflict...");
    try {
      // Clear all Appwrite sessions
      await account.deleteSessions();
      console.log("All Appwrite sessions cleared due to conflict");
    } catch (error: any) {
      console.log("Error clearing sessions during conflict:", error);
    }

    // Clear local storage
    clearAllStorage();

    // Reset user state
    setUser(null);
  };

  const checkAuth = async () => {
    console.log("checkAuth: Starting authentication check");

    // Clear any potential problematic storage first
    clearAllStorage();

    try {
      // Check for JWT token in cookies directly instead of making API call
      console.log("checkAuth: Checking for JWT token in cookies");
      const token = getCookie("auth-token");

      if (!token) {
        console.log(
          "checkAuth: No JWT token found in cookies, user not authenticated"
        );
        setUser(null);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log("checkAuth: JWT token is expired, user not authenticated");
        setUser(null);
        return;
      }

      // Decode the token to get user information
      const decoded = decodeJWT(token);
      if (!decoded || !decoded.userId) {
        console.log("checkAuth: Invalid JWT token, user not authenticated");
        setUser(null);
        return;
      }

      // Create user object from JWT payload
      const userData: User = {
        $id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        name: decoded.username, // Use username as name fallback
        createdAt: new Date().toISOString(), // We don't have this in JWT, use current time
        updatedAt: new Date().toISOString(), // We don't have this in JWT, use current time
      };

      console.log("checkAuth: Valid JWT token found for user:", userData.$id);
      setUser(userData);
    } catch (error: any) {
      console.log("checkAuth: Error during authentication check:", error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("checkAuth: Authentication check completed");
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Starting sign in process...");

      // Check if there's an existing valid session that matches the user
      let existingSession = null;
      let canReuseSession = false;

      // First, try to check if there's a valid session without triggering guest errors
      try {
        console.log("Checking for existing session...");
        // Use getSession first to see if there's any session at all (safer than account.get)
        const currentSession = await account.getSession("current");
        if (currentSession && currentSession.$id) {
          console.log("Found existing session, now checking user...");
          const currentUser = await account.get();

          if (currentUser && currentUser.email === email) {
            console.log(
              "Found existing session for same user:",
              currentUser.email
            );
            existingSession = currentSession;
            canReuseSession = true;
            console.log(
              "Existing session is valid, can reuse:",
              existingSession.$id
            );
          } else if (currentUser) {
            console.log("Found session for different user, will clear it");
            canReuseSession = false;
          }
        }
      } catch (error: any) {
        // If getSession fails, there's definitely no valid session - no need to call account.get()
        console.log("No existing session found - will create new session");
        canReuseSession = false;
      }

      let session = existingSession;
      let currentUser;

      if (canReuseSession && existingSession) {
        // We can reuse the existing session - we already have the user from above
        console.log("Reusing existing valid session");
        currentUser = await account.get(); // Safe since we just verified it works
      }

      if (!canReuseSession) {
        // Only clear sessions if we actually found a session that needs clearing
        if (existingSession) {
          console.log("Clearing existing session for different user...");
          try {
            await account.deleteSessions();
            console.log("Cleared existing sessions");
          } catch (clearError: any) {
            console.log("Error clearing sessions:", clearError.message);
          }
          // Wait a moment for cleanup to complete
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          console.log(
            "No existing sessions to clear, proceeding with fresh session creation"
          );
        }

        // Create new session
        console.log("Creating new Appwrite session...");
        session = await account.createEmailPasswordSession(email, password);
        console.log("New Appwrite session created:", session.$id);

        // Get current user info from new session (this should always work since we just created the session)
        currentUser = await account.get();
        console.log("Current user from new session:", currentUser.$id);
      }

      // Now exchange the Appwrite session for a JWT token from our API
      console.log("Exchanging session for JWT token...");

      if (!session || !currentUser) {
        throw new Error("Failed to establish valid session or get user info");
      }

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: currentUser.email,
          appwriteUserId: currentUser.$id,
          sessionId: session.$id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If JWT creation fails, clean up the Appwrite session (only if we created a new one)
        if (!canReuseSession && session) {
          try {
            await account.deleteSession(session.$id);
          } catch (cleanupError: any) {
            console.error("Failed to cleanup Appwrite session:", cleanupError);
          }
        }
        throw new Error(data.error || "Sign in failed");
      }

      console.log("Sign in successful, user ID:", data.data.user.id);
      setUser(data.data.user);
      console.log("Sign in process completed successfully");
    } catch (error: any) {
      console.error("Sign in error:", error);

      // If any error occurs during sign in, ensure we clean up completely
      // Only try to clean up if there might actually be sessions to clean
      try {
        await account.deleteSessions();
        console.log("Cleaned up sessions after sign in error");
      } catch (cleanupError: any) {
        // Ignore cleanup errors - there might be nothing to clean
        console.log("No sessions to clean up after error");
      }

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
      // Only try to delete if we might have a valid session (user is not null)
      if (user) {
        try {
          await account.deleteSession("current");
          console.log("Appwrite session deleted");
        } catch (appwriteError: any) {
          // Handle guest user errors gracefully
          if (
            appwriteError.message?.includes("missing scope") ||
            appwriteError.message?.includes("guests") ||
            appwriteError.message?.includes("User (role: guests)") ||
            appwriteError.code === 401 ||
            appwriteError.type === "general_unauthorized_scope"
          ) {
            console.log("No session to delete (guest user)");
          } else {
            console.error("Failed to delete Appwrite session:", appwriteError);
          }
        }
      } else {
        console.log("No user session to delete");
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
      console.log("Clearing all sessions...");

      // First, clear any Appwrite sessions
      try {
        console.log("Clearing Appwrite sessions...");
        await account.deleteSessions(); // Clear all Appwrite sessions
        console.log("Appwrite sessions cleared");
      } catch (appwriteError: any) {
        // Handle guest user errors gracefully
        if (
          appwriteError.message?.includes("missing scope") ||
          appwriteError.message?.includes("guests") ||
          appwriteError.message?.includes("User (role: guests)") ||
          appwriteError.code === 401 ||
          appwriteError.type === "general_unauthorized_scope"
        ) {
          console.log("No Appwrite sessions to clear (guest user)");
        } else {
          console.error("Failed to clear Appwrite sessions:", appwriteError);
        }
      }

      // Then clear JWT sessions via our API
      await fetch("/api/auth/clear-sessions", {
        method: "POST",
        credentials: "include",
      });
      console.log("JWT sessions cleared");
    } catch (error) {
      console.error("Clear sessions error:", error);
    } finally {
      setUser(null);
      console.log("All sessions cleared successfully");
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
