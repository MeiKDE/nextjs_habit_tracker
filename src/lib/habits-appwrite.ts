import {
  databases,
  serverDatabases,
  ID,
  Query,
  DATABASE_ID,
  COLLECTIONS,
  Habit,
  HabitCompletion,
} from "./appwrite";
import { getRandomColor } from "./habits";

export class HabitsService {
  // Create a new habit
  static async createHabit(
    userId: string,
    title: string,
    description?: string,
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY"
  ) {
    try {
      const habitData = {
        title,
        description: description || "",
        frequency,
        streakCount: 0,
        color: getRandomColor(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
      };

      const habit = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        ID.unique(),
        habitData
      );

      return habit as unknown as Habit;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to create habit"
        );
      } else {
        throw new Error("Failed to create habit");
      }
    }
  }

  // Get all habits for a user
  static async getUserHabits(userId: string) {
    try {
      const habits = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        [
          Query.equal("userId", userId),
          Query.equal("isActive", true),
          Query.orderDesc("createdAt"),
        ]
      );

      // Get completions for each habit
      const habitsWithCompletions = await Promise.all(
        habits.documents.map(async (habit) => {
          const completions = await this.getHabitCompletions(habit.$id);
          return {
            ...habit,
            completions,
          };
        })
      );

      return habitsWithCompletions as unknown as (Habit & {
        completions: HabitCompletion[];
      })[];
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to fetch habits"
        );
      } else {
        throw new Error("Failed to fetch habits");
      }
    }
  }

  // Get a single habit by ID
  static async getHabit(habitId: string, userId: string) {
    try {
      const habit = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        habitId
      );

      // Verify ownership
      if ((habit as unknown as { userId: string }).userId !== userId) {
        throw new Error("Unauthorized");
      }

      const completions = await this.getHabitCompletions(habitId);

      return {
        ...habit,
        completions,
      } as unknown as Habit & { completions: HabitCompletion[] };
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to fetch habit"
        );
      } else {
        throw new Error("Failed to fetch habit");
      }
    }
  }

  // Update a habit
  static async updateHabit(
    habitId: string,
    userId: string,
    updates: Partial<Omit<Habit, "$id" | "userId" | "createdAt">>
  ) {
    try {
      // First verify ownership
      const existingHabit = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        habitId
      );

      if ((existingHabit as unknown as { userId: string }).userId !== userId) {
        throw new Error("Unauthorized");
      }

      const updatedHabit = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        habitId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );

      return updatedHabit as unknown as Habit;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to update habit"
        );
      } else {
        throw new Error("Failed to update habit");
      }
    }
  }

  // Delete a habit (soft delete)
  static async deleteHabit(habitId: string, userId: string) {
    try {
      return await this.updateHabit(habitId, userId, { isActive: false });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to delete habit"
        );
      } else {
        throw new Error("Failed to delete habit");
      }
    }
  }

  // Get habit completions
  static async getHabitCompletions(habitId: string) {
    try {
      const completions = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HABIT_COMPLETIONS,
        [Query.equal("habitId", habitId), Query.orderDesc("completedAt")]
      );

      return completions.documents as unknown as HabitCompletion[];
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message ||
            "Failed to fetch completions"
        );
      } else {
        throw new Error("Failed to fetch completions");
      }
    }
  }

  // Mark habit as completed
  static async completeHabit(habitId: string, userId: string, notes?: string) {
    try {
      // First verify habit ownership
      const habit = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        habitId
      );

      if ((habit as unknown as { userId: string }).userId !== userId) {
        throw new Error("Unauthorized");
      }

      // Create completion record
      const completion = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.HABIT_COMPLETIONS,
        ID.unique(),
        {
          habitId,
          completedAt: new Date().toISOString(),
          notes: notes || "",
          createdAt: new Date().toISOString(),
        }
      );

      // Update habit's last completed date and potentially streak count
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.HABITS, habitId, {
        lastCompleted: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return completion as unknown as HabitCompletion;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to complete habit"
        );
      } else {
        throw new Error("Failed to complete habit");
      }
    }
  }

  // Delete a habit completion
  static async deleteCompletion(completionId: string, userId: string) {
    try {
      // First get the completion to verify ownership through habit
      const completion = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.HABIT_COMPLETIONS,
        completionId
      );

      const habit = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.HABITS,
        (completion as unknown as { habitId: string }).habitId
      );

      if ((habit as unknown as { userId: string }).userId !== userId) {
        throw new Error("Unauthorized");
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.HABIT_COMPLETIONS,
        completionId
      );

      return true;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message ||
            "Failed to delete completion"
        );
      } else {
        throw new Error("Failed to delete completion");
      }
    }
  }
}

// Server-side habits service (for API routes)
export class ServerHabitsService {
  // Similar methods but using serverDatabases
  static async getUserHabits(userId: string) {
    try {
      const habits = await (
        serverDatabases as unknown as { listDocuments: Function }
      ).listDocuments(DATABASE_ID, COLLECTIONS.HABITS, [
        Query.equal("userId", userId),
        Query.equal("isActive", true),
        Query.orderDesc("createdAt"),
      ]);

      // Get completions for each habit
      const habitsWithCompletions = await Promise.all(
        habits.documents.map(async (habit: unknown) => {
          const completions = await (
            serverDatabases as unknown as { listDocuments: Function }
          ).listDocuments(DATABASE_ID, COLLECTIONS.HABIT_COMPLETIONS, [
            Query.equal("habitId", (habit as { $id: string }).$id),
            Query.orderDesc("completedAt"),
          ]);
          if (habit && typeof habit === "object") {
            return {
              ...(habit as object),
              completions: completions.documents,
            };
          } else {
            return { completions: completions.documents };
          }
        })
      );

      return habitsWithCompletions as unknown as (Habit & {
        completions: HabitCompletion[];
      })[];
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to fetch habits"
        );
      } else {
        throw new Error("Failed to fetch habits");
      }
    }
  }

  static async createHabit(
    userId: string,
    title: string,
    description?: string,
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY"
  ) {
    try {
      const habitData = {
        title,
        description: description || "",
        frequency,
        streakCount: 0,
        color: getRandomColor(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
      };

      const habit = await (
        serverDatabases as unknown as { createDocument: Function }
      ).createDocument(DATABASE_ID, COLLECTIONS.HABITS, ID.unique(), habitData);

      // Get completions (will be empty for new habit)
      const completions = await (
        serverDatabases as unknown as { listDocuments: Function }
      ).listDocuments(DATABASE_ID, COLLECTIONS.HABIT_COMPLETIONS, [
        Query.equal("habitId", (habit as { $id: string }).$id),
      ]);

      return {
        ...habit,
        completions: completions.documents,
      } as unknown as Habit & { completions: HabitCompletion[] };
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to create habit"
        );
      } else {
        throw new Error("Failed to create habit");
      }
    }
  }

  // Update a habit
  static async updateHabit(
    habitId: string,
    userId: string,
    updates: Partial<Omit<Habit, "$id" | "userId" | "createdAt">>
  ) {
    try {
      // First verify ownership
      const existingHabit = await (
        serverDatabases as unknown as { getDocument: Function }
      ).getDocument(DATABASE_ID, COLLECTIONS.HABITS, habitId);

      if ((existingHabit as unknown as { userId: string }).userId !== userId) {
        throw new Error("Unauthorized");
      }

      const updatedHabit = await (
        serverDatabases as unknown as { updateDocument: Function }
      ).updateDocument(DATABASE_ID, COLLECTIONS.HABITS, habitId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      return updatedHabit as unknown as Habit;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to update habit"
        );
      } else {
        throw new Error("Failed to update habit");
      }
    }
  }

  // Delete a habit (soft delete)
  static async deleteHabit(habitId: string, userId: string) {
    try {
      return await this.updateHabit(habitId, userId, { isActive: false });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to delete habit"
        );
      } else {
        throw new Error("Failed to delete habit");
      }
    }
  }

  // Mark habit as completed
  static async completeHabit(habitId: string, userId: string, notes?: string) {
    try {
      // First verify habit ownership
      const habit = await (
        serverDatabases as unknown as { getDocument: Function }
      ).getDocument(DATABASE_ID, COLLECTIONS.HABITS, habitId);

      if ((habit as unknown as { userId: string }).userId !== userId) {
        throw new Error("Unauthorized");
      }

      // Create completion record
      const completion = await (
        serverDatabases as unknown as { createDocument: Function }
      ).createDocument(
        DATABASE_ID,
        COLLECTIONS.HABIT_COMPLETIONS,
        ID.unique(),
        {
          habitId,
          completedAt: new Date().toISOString(),
          notes: notes || "",
          createdAt: new Date().toISOString(),
        }
      );

      // Update habit's last completed date and potentially streak count
      await (
        serverDatabases as unknown as { updateDocument: Function }
      ).updateDocument(DATABASE_ID, COLLECTIONS.HABITS, habitId, {
        lastCompleted: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return completion as unknown as HabitCompletion;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message || "Failed to complete habit"
        );
      } else {
        throw new Error("Failed to complete habit");
      }
    }
  }

  // Get habit completions
  static async getHabitCompletions(habitId: string) {
    try {
      const completions = await (
        serverDatabases as unknown as { listDocuments: Function }
      ).listDocuments(DATABASE_ID, COLLECTIONS.HABIT_COMPLETIONS, [
        Query.equal("habitId", habitId),
        Query.orderDesc("completedAt"),
      ]);

      return completions.documents as unknown as HabitCompletion[];
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(
          (error as { message: string }).message ||
            "Failed to fetch completions"
        );
      } else {
        throw new Error("Failed to fetch completions");
      }
    }
  }
}
