import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Habit,
  CreateHabitData,
  CreateCompletionData,
  ApiResponse,
} from "@/types";

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle authentication errors
  const handleAuthError = async (response: Response, data: any) => {
    if (response.status === 401) {
      throw new Error("Please sign in to continue.");
    }
    throw new Error(data.error || "Request failed");
  };

  //GET
  const fetchHabits = async (retryCount = 0) => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      setLoading(true);
      setError(null);

      console.log("Fetching habits for user:", user.$id);
      const response = await fetch(`/api/habits?userId=${user.$id}`, {
        credentials: "include",
      });
      const data: ApiResponse<Habit[]> = await response.json();

      if (!response.ok) {
        await handleAuthError(response, data);
      }

      console.log("Successfully fetched habits:", data.data?.length || 0);
      setHabits(data.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch habits";
      console.error("Fetch habits error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // POST
  const createHabit = async (habitData: CreateHabitData) => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      setLoading(true);
      setError(null);

      console.log("Creating habit with data:", habitData);
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...habitData, userId: user.$id }),
      });

      const data: ApiResponse<Habit> = await response.json();
      console.log("Create habit response:", { status: response.status, data });

      if (!response.ok) {
        await handleAuthError(response, data);
      }

      // Add new habit to the list
      setHabits((prev) => [data.data!, ...prev]);
      console.log("Successfully created habit:", data.data?.$id);
      return data.data!;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create habit";
      console.error("Create habit error:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteHabit = async (habitId: string) => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/habits/${habitId}?userId=${user.$id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        await handleAuthError(response, data);
      }

      // Remove habit from the list
      setHabits((prev) => prev.filter((habit) => habit.$id !== habitId));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete habit";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeHabit = async (
    habitId: string,
    completionData?: CreateCompletionData
  ) => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      setLoading(true);
      setError(null);

      const response = await fetch(`/api/habits/${habitId}/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...completionData, userId: user.$id }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        await handleAuthError(response, data);
      }

      // Refresh habits to get updated streak count
      await fetchHabits();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to complete habit";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
  }, [user]);

  return {
    habits,
    loading,
    error,
    fetchHabits,
    createHabit,
    deleteHabit,
    completeHabit,
  };
};
