import {
  account,
  databases,
  ID,
  Query,
  DATABASE_ID,
  COLLECTIONS,
  User,
} from "./appwrite";

// Client-side authentication service using Appwrite
export class AuthService {
  // Sign up a new user
  static async signUp(
    email: string,
    password: string,
    username: string,
    name?: string
  ) {
    try {
      // Create user account (this automatically creates a session)
      const user = await account.create(
        ID.unique(),
        email,
        password,
        name || username
      );

      // Create user document in database
      const userDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id,
        {
          email,
          username,
          name: name || username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      // Get the current session (created automatically by account.create)
      const session = await account.getSession("current");

      return {
        user: userDoc,
        session,
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign up");
    }
  }

  // Sign in user
  static async signIn(email: string, password: string) {
    console.log("=== STARTING SIGN IN PROCESS ===");
    console.log("Email:", email);

    // Strategy: Always clear sessions first, then create new session
    // This prevents all session conflict issues
    await this.forceCompleteSessionReset();

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Sign in attempt ${attempts}/${maxAttempts}`);

      try {
        // Try to create the session
        console.log("Attempting to create email session...");
        const session = await account.createEmailPasswordSession(
          email,
          password
        );
        console.log("Session created successfully:", session.$id);

        const user = await account.get();
        console.log("User retrieved:", user.email);

        // Get user document from database
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          user.$id
        );

        console.log("=== SIGN IN SUCCESSFUL ===");
        return {
          user: userDoc,
          session,
        };
      } catch (error: any) {
        console.error(`Sign in attempt ${attempts} failed:`, error);

        // If it's a session conflict error, try to clear sessions again
        if (
          error.message?.includes("Creation of a session is prohibited") ||
          error.message?.includes("session is already exists") ||
          error.type === "user_session_already_exists" ||
          error.code === 401
        ) {
          console.log("Session conflict detected, clearing sessions again...");

          if (attempts < maxAttempts) {
            // Clear sessions more aggressively
            await this.forceCompleteSessionReset();

            // Wait longer between attempts
            const waitTime = attempts * 1000; // 1s, 2s, 3s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));

            continue; // Try again
          } else {
            console.error("Max attempts reached, giving up");
            throw new Error(
              "Unable to create session after multiple attempts. Please try again later."
            );
          }
        } else {
          // Non-session error, throw immediately
          throw new Error(error.message || "Failed to sign in");
        }
      }
    }

    throw new Error("Sign in failed after multiple attempts");
  }

  // Sign out user
  static async signOut() {
    try {
      await account.deleteSession("current");
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign out");
    }
  }

  // Clear all sessions (useful for debugging session issues)
  static async clearAllSessions() {
    try {
      console.log("Clearing all sessions...");
      await this.forceSessionCleanup();
      console.log("All sessions cleared successfully");
    } catch (error: any) {
      // Ignore errors if no sessions exist
      console.log(
        "No sessions to clear or error clearing sessions:",
        error.message
      );
    }
  }

  // Get current user (client-side)
  static async getCurrentUser() {
    try {
      // First, check if we have a valid session to avoid 401 guest errors
      const hasSession = await this.hasValidSession();
      if (!hasSession) {
        return null;
      }

      const user = await account.get();

      if (!user || !user.$id) {
        return null;
      }

      // Get user document from database
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id
      );

      return userDoc as unknown as User;
    } catch (error: any) {
      // Don't log guest user errors - this is expected when not authenticated
      if (
        error.message?.includes("missing scope") ||
        error.message?.includes("guests") ||
        error.message?.includes("User (role: guests)")
      ) {
        return null;
      }

      console.log("getCurrentUser failed:", error.message);
      return null;
    }
  }

  // Check if username is available
  static async isUsernameAvailable(username: string) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal("username", username)]
      );

      return result.documents.length === 0;
    } catch (error) {
      return false;
    }
  }

  // Check if email is available
  static async isEmailAvailable(email: string) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal("email", email)]
      );

      return result.documents.length === 0;
    } catch (error) {
      return false;
    }
  }

  // Helper method to check if user has a valid session without triggering guest errors
  static async hasValidSession(): Promise<boolean> {
    try {
      const session = await account.getSession("current");
      return !!(session && session.$id);
    } catch (error) {
      return false;
    }
  }

  // Helper method to clear any existing sessions for the user
  private static async clearAnyExistingSessions(email: string): Promise<void> {
    try {
      console.log("Checking for existing sessions...");

      // Try to get current user
      const existingUser = await account.get();

      if (existingUser) {
        console.log("Found existing session for:", existingUser.email);

        if (existingUser.email === email) {
          console.log(
            "Same user - reusing session would be ideal, but clearing for fresh login"
          );
        } else {
          console.log(
            "Different user - clearing session for:",
            existingUser.email
          );
        }

        // Clear current session
        await account.deleteSession("current");
        console.log("Current session cleared");

        // Also try to clear all sessions to be extra safe
        try {
          await account.deleteSessions();
          console.log("All sessions cleared");
        } catch (clearAllError: any) {
          console.log(
            "Could not clear all sessions (might be expected):",
            clearAllError.message
          );
        }
      } else {
        console.log("No existing session found");
      }
    } catch (error: any) {
      if (error.code === 401) {
        console.log("No existing session (401 expected)");
      } else {
        console.log("Error checking existing session:", error.message);
        // Try to clear sessions anyway in case there's a ghost session
        try {
          await account.deleteSession("current");
          console.log("Cleared potential ghost session");
        } catch (clearError) {
          console.log("No session to clear");
        }
      }
    }
  }

  // Helper method to force cleanup all sessions
  private static async forceSessionCleanup(): Promise<void> {
    console.log("Starting force session cleanup...");

    const cleanupMethods = [
      () => account.deleteSession("current"),
      () => account.deleteSessions(),
    ];

    for (const cleanup of cleanupMethods) {
      try {
        await cleanup();
        console.log("Session cleanup method succeeded");
      } catch (error: any) {
        console.log(
          "Session cleanup method failed (might be expected):",
          error.message
        );
      }
    }

    console.log("Force session cleanup completed");
  }

  // Complete session reset - more aggressive than before
  private static async forceCompleteSessionReset(): Promise<void> {
    console.log("=== FORCING COMPLETE SESSION RESET ===");

    // Array of all possible session cleanup methods
    const cleanupMethods = [
      {
        name: "Delete current session",
        method: () => account.deleteSession("current"),
      },
      {
        name: "Delete all sessions",
        method: () => account.deleteSessions(),
      },
      {
        name: "Check and clear current user session",
        method: async () => {
          try {
            const user = await account.get();
            if (user) {
              console.log("Found active user:", user.email);
              await account.deleteSession("current");
            }
          } catch (e) {
            // Expected if no user
          }
        },
      },
    ];

    // Try each cleanup method
    for (const cleanup of cleanupMethods) {
      try {
        console.log(`Executing: ${cleanup.name}`);
        await cleanup.method();
        console.log(`✓ ${cleanup.name} succeeded`);
      } catch (error: any) {
        console.log(`✗ ${cleanup.name} failed:`, error.message);
        // Continue with other methods
      }
    }

    // Final verification - make sure no session exists
    try {
      console.log("Verifying session cleanup...");
      const user = await account.get();
      if (user) {
        console.warn("Session still exists after cleanup! User:", user.email);
        // Try one more time to clear
        await account.deleteSessions();
      } else {
        console.log("No session found - this shouldn't happen");
      }
    } catch (error: any) {
      if (error.code === 401) {
        console.log("✓ Session cleanup verified - no active session");
      } else {
        console.log("Session verification error:", error.message);
      }
    }

    console.log("=== SESSION RESET COMPLETE ===");
  }

  // Manual session reset - can be called directly if needed
  static async resetSessions() {
    console.log("Manual session reset requested");
    await this.forceCompleteSessionReset();
    console.log("Manual session reset completed");
  }
}
