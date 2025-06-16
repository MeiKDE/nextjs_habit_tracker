import { Client, Account, Databases, ID, Query } from "appwrite";

// Environment variables (you'll need to set these)
const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";

// Collections IDs (you'll need to create these in Appwrite console)
export const COLLECTIONS = {
  USERS: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "",
  HABITS: process.env.NEXT_PUBLIC_APPWRITE_HABITS_COLLECTION_ID || "",
  HABIT_COMPLETIONS:
    process.env.NEXT_PUBLIC_APPWRITE_HABIT_COMPLETIONS_COLLECTION_ID || "",
};

// Client-side Appwrite client
export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Client-side services
export const account = new Account(client);
console.log("🔍 Appwrite account object created and exported");

export const databases = new Databases(client);

// Server-side configuration
let serverClient: unknown;
let serverAccount: unknown;
let serverDatabases: unknown;

// Initialize server-side services only on server
if (typeof window === "undefined") {
  (async () => {
    try {
      // Check if we have the required API key
      if (!process.env.APPWRITE_API_KEY) {
        console.warn(
          "APPWRITE_API_KEY not set - server-side authentication will not work"
        );
      } else {
        const nodeAppwrite = await import("node-appwrite");

        serverClient = new nodeAppwrite.Client()
          .setEndpoint(APPWRITE_ENDPOINT)
          .setProject(APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY || "");

        serverAccount = new nodeAppwrite.Account(
          serverClient as InstanceType<typeof nodeAppwrite.Client>
        );
        serverDatabases = new nodeAppwrite.Databases(
          serverClient as InstanceType<typeof nodeAppwrite.Client>
        );

        console.log("Server-side Appwrite clients initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize server Appwrite client:", error);
      console.error(
        "Make sure node-appwrite is installed and APPWRITE_API_KEY is set"
      );
    }
  })();
}

export { serverClient, serverAccount, serverDatabases };

// Helper constants
export const DATABASE_ID = APPWRITE_DATABASE_ID;
export { ID, Query };

// Types for Appwrite collections
export interface User {
  $id: string;
  email: string;
  username: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  $id: string;
  title: string;
  description?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  streakCount: number;
  lastCompleted?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface HabitCompletion {
  $id: string;
  completedAt: string;
  notes?: string;
  createdAt: string;
  habitId: string;
}
