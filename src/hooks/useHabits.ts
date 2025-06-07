import { useState, useEffect } from "react";
import {
  Habit,
  CreateHabitData,
  CreateCompletionData,
  ApiResponse,
} from "@/types";

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //GET
  const fetchHabits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/habits");
      const data: ApiResponse<Habit[]> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "HTTP - Failed to fetch habits");
      }

      setHabits(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch habits");
    } finally {
      setLoading(false);
    }
  };

  // POST
  const createHabit = async (habitData: CreateHabitData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(habitData),
      });

      const data: ApiResponse<Habit> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "HTTP - Failed to create habit");
      }

      // Add new habit to the list
      setHabits((prev) => [data.data!, ...prev]);
      return data.data!;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create habit";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteHabit = async (habitId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "HTTP - Failed to delete habit");
      }

      // Remove habit from the list
      setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
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
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/habits/${habitId}/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completionData || {}),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "HTTP - Failed to complete habit");
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
    fetchHabits();
  }, []);

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
