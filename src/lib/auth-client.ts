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
    try {
      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();

      // Get user document from database
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id
      );

      return {
        user: userDoc,
        session,
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign in");
    }
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
      await account.deleteSessions();
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
}
