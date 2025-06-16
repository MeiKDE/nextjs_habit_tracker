import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HabitsService } from "@/lib/habits-appwrite";
import { calculateStreakData } from "@/lib/habits";
import { HabitWithStreak } from "@/types";

export const useStreaks = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreaks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const habitsData = await HabitsService.getUserHabits(user.$id);
      // Add streakData to each habit
      const habitsWithStreaks = habitsData.map((habit) => ({
        ...habit,
        streakData: calculateStreakData(habit.completions || []),
      }));
      setHabits(habitsWithStreaks);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to fetch streaks");
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStreaks();
  }, [user, fetchStreaks]);

  // Sort by best streak
  const rankedHabits = [...habits].sort(
    (a, b) => b.streakData.bestStreak - a.streakData.bestStreak
  );

  return { habits, rankedHabits, loading, error };
};
