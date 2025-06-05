import { useState, useEffect, useCallback } from "react";
import { Habit, HabitCompletion, StreakData } from "@/types";
import { calculateStreakData } from "@/lib/habits";

interface HabitWithStreakData extends Habit {
  streakData: StreakData;
}

export const useStreaks = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      const response = await fetch("/api/habits");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch habits");
      }

      setHabits(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch habits");
    }
  }, []);

  const fetchCompletions = useCallback(async () => {
    try {
      const response = await fetch("/api/completions");
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
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchHabits(), fetchCompletions()]);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [fetchHabits, fetchCompletions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate streak data for each habit
  const habitsWithStreaks: HabitWithStreakData[] = habits.map((habit) => {
    const habitCompletions = completions.filter(
      (completion) => completion.habitId === habit.id
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
