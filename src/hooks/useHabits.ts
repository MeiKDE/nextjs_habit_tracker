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

  //GET - Now uses JWT authentication from cookies
  const fetchHabits = async (retryCount = 0) => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      setLoading(true);
      setError(null);

      console.log("Fetching habits for authenticated user");
      const response = await fetch(`/api/habits`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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

  // POST - Now uses JWT authentication, no userId needed
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
        body: JSON.stringify(habitData), // Remove userId - it comes from JWT
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

  // DELETE - Now uses JWT authentication, no userId needed
  const deleteHabit = async (habitId: string) => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      setLoading(true);
      setError(null);

      const response = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

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
        body: JSON.stringify(completionData || {}), // Remove userId - it comes from JWT
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
