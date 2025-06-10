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
import { cookies } from "next/headers";

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

  // Get current user (client-side)
  static async getCurrentUser() {
    try {
      const user = await account.get();

      // Get user document from database
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id
      );

      return userDoc as unknown as User;
    } catch (error) {
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
      const nodeAppwrite = require("node-appwrite");

      // Create a client with just the API key (not session-based)
      const serverClient = new nodeAppwrite.Client()
        .setEndpoint(
          process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
            "https://cloud.appwrite.io/v1"
        )
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
        .setKey(process.env.APPWRITE_API_KEY || "");

      console.log("getServerUser: Client configured with API key approach");

      const adminAccount = new nodeAppwrite.Account(serverClient);
      const adminDatabases = new nodeAppwrite.Databases(serverClient);

      // Since we can't validate the session directly, we'll need to trust the client
      // and extract the user ID from a different source or use a different approach

      // Alternative approach: Get all users and see if there's an active session
      // This is not ideal but works without sessions.read

      console.log("getServerUser: Using alternative validation approach");

      // For now, return null to force client-side only authentication
      // We'll modify the API endpoints to work differently
      console.log("getServerUser: sessions.read not available, returning null");
      return null;
    } catch (error: any) {
      console.error("getServerUser error details:", {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
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

// Note: getAuthenticatedUser function removed since we're using client-only authentication
// All authentication is now handled client-side with user IDs passed in API requests
