import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HabitsService } from "@/lib/habits-appwrite";
import { Habit, HabitCompletion } from "@/types";

const useHabits = (reloadTrigger?: number) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<
    (Habit & { completions: HabitCompletion[] })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await HabitsService.getUserHabits(user.$id);
      setHabits(data);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to fetch habits");
      }
    }
    setLoading(false);
  }, [user]);

  const completeHabit = async (habitId: string) => {
    if (!user) return;
    await HabitsService.completeHabit(habitId, user.$id);
    fetchHabits();
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;
    await HabitsService.deleteHabit(habitId, user.$id);
    fetchHabits();
  };

  useEffect(() => {
    fetchHabits();
  }, [user, reloadTrigger, fetchHabits]);

  return { habits, loading, error, completeHabit, deleteHabit };
};

export default useHabits;
