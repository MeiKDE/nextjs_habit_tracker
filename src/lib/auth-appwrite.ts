import {
  account,
  serverAccount,
  databases,
  serverDatabases,
  ID,
  Query,
  DATABASE_ID,
  COLLECTIONS,
  User,
} from "./appwrite";
import { isGuestUserError } from "./session-utils";

// Authentication service using Appwrite
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
    } catch {
      throw new Error("Failed to sign up");
    }
  }

  // Sign in user
  static async signIn(email: string, password: string) {
    console.log("=== STARTING SIGN IN PROCESS ===");
    console.log("Email:", email);

    // First, check if there's already an active session
    let existingSession = null;
    let shouldCreateNewSession = true;

    try {
      console.log("Checking for existing session...");
      const currentUser = await account.get();
      console.log("Found existing session for user:", currentUser.email);

      // If the existing user matches the login email, reuse the session
      if (currentUser.email === email) {
        console.log("Same user - checking if session is valid...");
        try {
          existingSession = await account.getSession("current");
          console.log("Found valid existing session:", existingSession.$id);
          shouldCreateNewSession = false;

          // Get user document from database
          const userDoc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            currentUser.$id
          );

          console.log("=== SIGN IN SUCCESSFUL (using existing session) ===");
          return {
            user: userDoc,
            session: existingSession,
          };
        } catch {
          console.log("Existing session is invalid, will create new one");
          shouldCreateNewSession = true;
        }
      } else {
        console.log("Different user - clearing existing session...");
        await account.deleteSession("current");
        console.log("Previous session cleared");
        shouldCreateNewSession = true;
      }
    } catch {
      shouldCreateNewSession = true;
    }

    // Only create new session if needed
    if (shouldCreateNewSession) {
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
        } catch {
          console.error(`Sign in attempt ${attempts} failed.`);

          // No error variable available, just throw a generic error
          throw new Error("Failed to sign in");
        }
      }

      throw new Error("Sign in failed after multiple attempts");
    }

    // This should not be reached, but just in case
    throw new Error("Unexpected sign in flow error");
  }

  // Sign out user
  static async signOut() {
    try {
      await account.deleteSession("current");
    } catch {
      throw new Error("Failed to sign out");
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

      // Get user document from database
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id
      );

      return userDoc as unknown as User;
    } catch {
      return null;
    }
  }

  // Server-side authentication check - SIMPLIFIED VERSION
  static async getServerUser(sessionId?: string) {
    try {
      if (!sessionId) {
        console.log("getServerUser: No session ID provided");
        return null;
      }

      if (!serverDatabases || !serverAccount) {
        console.error(
          "Server services not initialized - check APPWRITE_API_KEY environment variable"
        );
        return null;
      }

      console.log(
        "getServerUser: Attempting to validate session:",
        sessionId.substring(0, 10) + "..."
      );

      // Since sessions.read permission is not available, we'll use a different approach
      // We'll try to get user info using the server account with API key

      // First, let's try a simple approach: validate the session format
      if (sessionId.length < 20) {
        console.log("getServerUser: Session ID format is invalid");
        return null;
      }

      // For now, we'll use a simplified validation approach
      // In a production app, you might want to store session mappings in your database

      // Use node-appwrite with API key to validate the session differently
      const nodeAppwrite = await import("node-appwrite");

      // Create a client with just the API key (not session-based)
      new nodeAppwrite.Client()
        .setEndpoint(
          process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
            "https://cloud.appwrite.io/v1"
        )
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
        .setKey(process.env.APPWRITE_API_KEY || "");

      console.log("getServerUser: Client configured with API key approach");

      // const adminAccount = new nodeAppwrite.Account(serverClient);
      // const adminDatabases = new nodeAppwrite.Databases(serverClient);

      // Since we can't validate the session directly, we'll need to trust the client
      // and extract the user ID from a different source or use a different approach

      // Alternative approach: Get all users and see if there's an active session
      // This is not ideal but works without sessions.read

      console.log("getServerUser: Using alternative validation approach");

      // For now, return null to force client-side only authentication
      // We'll modify the API endpoints to work differently
      console.log("getServerUser: sessions.read not available, returning null");
      return null;
    } catch (error) {
      console.error("getServerUser error details:", {
        message:
          error && typeof error === "object" && "message" in error
            ? (error as { message?: string }).message
            : undefined,
        code:
          error && typeof error === "object" && "code" in error
            ? (error as { code?: number }).code
            : undefined,
        type:
          error && typeof error === "object" && "type" in error
            ? (error as { type?: string }).type
            : undefined,
        response:
          error && typeof error === "object" && "response" in error
            ? (error as { response?: unknown }).response
            : undefined,
        sessionIdPrefix: sessionId
          ? sessionId.substring(0, 10) + "..."
          : "none",
      });

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
    } catch {
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
    } catch {
      return false;
    }
  }

  // Helper method to check if user has a valid session without triggering guest errors
  static async hasValidSession(): Promise<boolean> {
    try {
      const session = await account.getSession("current");
      return !!(session && session.$id);
    } catch {
      return false;
    }
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
          } catch {
            // Handle guest user errors gracefully
            console.log("No user session to clear (guest user)");
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
      } catch {
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
    } catch {
      // Could not verify session cleanup
      console.log("Session verification error");
    }

    console.log("=== SESSION RESET COMPLETE ===");
  }

  // Clear all sessions (useful for debugging session issues)
  static async clearAllSessions() {
    try {
      console.log("Clearing all sessions...");
      await this.forceCompleteSessionReset();
      console.log("All sessions cleared successfully");
    } catch {
      // Ignore errors if no sessions exist
      console.log("No sessions to clear or error clearing sessions");
    }
  }

  // Manual session reset - can be called directly if needed
  static async resetSessions() {
    console.log("Manual session reset requested");
    await this.forceCompleteSessionReset();
    console.log("Manual session reset completed");
  }
}

// Note: getAuthenticatedUser function removed since we're using client-only authentication
// All authentication is now handled client-side with user IDs passed in API requests
