import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HabitsService } from "@/lib/habits-appwrite";

const useHabits = (reloadTrigger?: number) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await HabitsService.getUserHabits(user.$id);
      setHabits(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

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
  }, [user, reloadTrigger]);

  return { habits, loading, error, completeHabit, deleteHabit };
};

export default useHabits;
