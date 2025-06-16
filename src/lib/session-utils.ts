import { account } from "./appwrite";

/**
 * Check if an error is a guest user error (when user is not authenticated)
 */
export function isGuestUserError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const err = error as { code?: number; type?: string; message?: string };
    return (
      err.code === 401 &&
      (err.type === "general_unauthorized_scope" ||
        !!err.message?.includes("missing scope") ||
        !!err.message?.includes("guests"))
    );
  }
  return false;
}

/**
 * Utility functions for managing Appwrite sessions and handling conflicts
 */
export class SessionUtils {
  /**
   * Check if there's an active Appwrite session and return user info if found
   */
  static async checkActiveSession() {
    try {
      const user = await account.get();
      return {
        hasSession: true,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error: unknown) {
      // Handle guest user errors gracefully
      if (isGuestUserError(error)) {
        return {
          hasSession: false,
          user: null,
          error: "No session (guest user)",
        };
      }
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error) {
        message = (error as { message?: string }).message || message;
      }
      return {
        hasSession: false,
        user: null,
        error: message,
      };
    }
  }

  /**
   * Force clear all Appwrite sessions
   */
  static async clearAllSessions() {
    const results = [];

    // Try different methods to clear sessions
    const methods = [
      {
        name: "deleteSession(current)",
        action: () => account.deleteSession("current"),
      },
      {
        name: "deleteSessions()",
        action: () => account.deleteSessions(),
      },
    ];

    for (const method of methods) {
      try {
        await method.action();
        results.push({ method: method.name, success: true });
      } catch (error: unknown) {
        let message = "Unknown error";
        if (error && typeof error === "object" && "message" in error) {
          message = (error as { message?: string }).message || message;
        }
        results.push({
          method: method.name,
          success: false,
          error: message,
        });
      }
    }

    return results;
  }

  /**
   * Smart session management for sign-in
   * Returns true if it's safe to proceed with creating a new session
   */
  static async prepareForSignIn(email: string): Promise<{
    canProceed: boolean;
    needsNewSession: boolean;
    message: string;
  }> {
    try {
      const sessionCheck = await this.checkActiveSession();

      if (!sessionCheck.hasSession) {
        return {
          canProceed: true,
          needsNewSession: true,
          message: "No existing session, safe to create new one",
        };
      }

      // There's an existing session
      if (sessionCheck.user?.email === email) {
        // Same user - can reuse session
        return {
          canProceed: true,
          needsNewSession: false,
          message: `Existing session found for ${email}, can reuse`,
        };
      } else {
        // Different user - need to clear existing session
        console.log(
          `Clearing session for different user: ${sessionCheck.user?.email} -> ${email}`
        );
        await this.clearAllSessions();

        // Verify session is cleared
        const verifyCheck = await this.checkActiveSession();
        if (!verifyCheck.hasSession) {
          return {
            canProceed: true,
            needsNewSession: true,
            message: `Cleared session for ${sessionCheck.user?.email}, ready for ${email}`,
          };
        } else {
          return {
            canProceed: false,
            needsNewSession: true,
            message:
              "Failed to clear existing session, manual intervention needed",
          };
        }
      }
    } catch (error: unknown) {
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error) {
        message = (error as { message?: string }).message || message;
      }
      return {
        canProceed: false,
        needsNewSession: true,
        message: `Error preparing for sign-in: ${message}`,
      };
    }
  }

  /**
   * Handle session conflict errors by clearing sessions and providing guidance
   */
  static async handleSessionConflict() {
    console.log("Handling session conflict...");

    const clearResults = await this.clearAllSessions();

    // Wait a bit for cleanup to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify cleanup
    const verifyCheck = await this.checkActiveSession();

    return {
      cleared: !verifyCheck.hasSession,
      clearResults,
      verification: verifyCheck,
      recommendation: !verifyCheck.hasSession
        ? "Sessions cleared successfully, you can try signing in again"
        : "Sessions may not be fully cleared, try refreshing the page or clearing browser storage",
    };
  }
}

/**
 * Completely reset all authentication state
 * Use this when you want to ensure a completely clean state
 */
export async function completeAuthReset(): Promise<{
  success: boolean;
  steps: Array<{ step: string; success: boolean; error?: string }>;
}> {
  const results = [];

  // Step 1: Clear Appwrite sessions
  try {
    await account.deleteSessions();
    results.push({ step: "Clear Appwrite sessions", success: true });
  } catch (error: unknown) {
    if (isGuestUserError(error)) {
      results.push({
        step: "Clear Appwrite sessions",
        success: true,
        error: "No sessions to clear (guest)",
      });
    } else {
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error) {
        message = (error as { message?: string }).message || message;
      }
      results.push({
        step: "Clear Appwrite sessions",
        success: false,
        error: message,
      });
    }
  }

  // Step 2: Clear browser storage
  try {
    if (typeof window !== "undefined") {
      // Clear localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach((key) => {
        if (
          key.includes("appwrite") ||
          key.includes("session") ||
          key.includes("auth") ||
          key.includes("user")
        ) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach((key) => {
        if (
          key.includes("appwrite") ||
          key.includes("session") ||
          key.includes("auth") ||
          key.includes("user")
        ) {
          sessionStorage.removeItem(key);
        }
      });

      // Clear cookies (JWT tokens)
      document.cookie =
        "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "a_session_console=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    results.push({ step: "Clear browser storage", success: true });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      message = (error as { message?: string }).message || message;
    }
    results.push({
      step: "Clear browser storage",
      success: false,
      error: message,
    });
  }

  // Step 3: Clear JWT sessions via API
  try {
    await fetch("/api/auth/clear-sessions", {
      method: "POST",
      credentials: "include",
    });
    results.push({ step: "Clear JWT sessions", success: true });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      message = (error as { message?: string }).message || message;
    }
    results.push({
      step: "Clear JWT sessions",
      success: false,
      error: message,
    });
  }

  // Step 4: Verify no active session
  try {
    const sessionCheck = await SessionUtils.checkActiveSession();
    if (!sessionCheck.hasSession) {
      results.push({ step: "Verify cleanup", success: true });
    } else {
      results.push({
        step: "Verify cleanup",
        success: false,
        error: `Session still active for ${sessionCheck.user?.email}`,
      });
    }
  } catch (error: unknown) {
    if (isGuestUserError(error)) {
      results.push({
        step: "Verify cleanup",
        success: true,
        error: "Confirmed guest user state",
      });
    } else {
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error) {
        message = (error as { message?: string }).message || message;
      }
      results.push({
        step: "Verify cleanup",
        success: false,
        error: message,
      });
    }
  }

  const allSuccessful = results.every((r) => r.success);
  return {
    success: allSuccessful,
    steps: results,
  };
}
