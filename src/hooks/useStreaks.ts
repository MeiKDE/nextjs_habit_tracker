import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HabitsService } from "@/lib/habits-appwrite";
import { calculateStreakData } from "@/lib/habits";

export const useStreaks = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreaks = async () => {
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
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchStreaks();
  }, [user]);

  // Sort by best streak
  const rankedHabits = [...habits].sort(
    (a, b) => b.streakData.bestStreak - a.streakData.bestStreak
  );

  return { habits, rankedHabits, loading, error };
};
