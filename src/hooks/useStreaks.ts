import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Habit, HabitCompletion, StreakData } from "@/types";
import { calculateStreakData } from "@/lib/habits";

interface HabitWithStreakData extends Habit {
  streakData: StreakData;
}

export const useStreaks = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      const response = await fetch(`/api/habits?userId=${user.$id}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch habits");
      }

      setHabits(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch habits");
    }
  }, [user]);

  const fetchCompletions = useCallback(async () => {
    try {
      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      const response = await fetch(`/api/completions?userId=${user.$id}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch completions");
      }

      setCompletions(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch completions"
      );
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setCompletions([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Calls two asynchronous functions: fetchHabits() and fetchCompletions()
    // Waits for both to finish using Promise.all
    // Returns a single Promise that resolves when both functions have completed
    try {
      await Promise.all([fetchHabits(), fetchCompletions()]);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [fetchHabits, fetchCompletions, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate streak data for each habit
  const habitsWithStreaks: HabitWithStreakData[] = habits.map((habit) => {
    const habitCompletions = completions.filter(
      (completion) => completion.habitId === habit.$id
    );

    const streakData = calculateStreakData(habitCompletions);

    return {
      ...habit,
      streakData,
    };
  });

  // Sort habits by best streak (descending)
  const rankedHabits = habitsWithStreaks.sort(
    (a, b) => b.streakData.bestStreak - a.streakData.bestStreak
  );

  return {
    habits: habitsWithStreaks,
    rankedHabits,
    loading,
    error,
    refetch: fetchData,
  };
};
