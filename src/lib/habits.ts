import { HabitCompletion, StreakData } from "@/types";

// Helper function to generate random colors
export const getRandomColor = (): string => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8E8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Calculate streak data for a habit
export const calculateStreakData = (
  completions: HabitCompletion[]
): StreakData => {
  if (completions.length === 0) {
    return { streak: 0, bestStreak: 0, total: 0 };
  }

  // Sort completions by date
  const sortedCompletions = completions
    .slice()
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

  let currentStreak = 0;
  let bestStreak = 0;
  let lastDate: Date | null = null;

  sortedCompletions.forEach((completion) => {
    const date = new Date(completion.completedAt);

    if (lastDate) {
      const diffInDays =
        (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffInDays <= 1.5) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    lastDate = date;
  });

  // Check if current streak is still active (last completion was today or yesterday)
  const now = new Date();
  const lastCompletionDate = new Date(
    sortedCompletions[sortedCompletions.length - 1].completedAt
  );
  const daysSinceLastCompletion =
    (now.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24);

  const activeStreak = daysSinceLastCompletion <= 1.5 ? currentStreak : 0;

  return {
    streak: activeStreak,
    bestStreak,
    total: completions.length,
  };
};

// Check if a habit was completed today
export const isCompletedToday = (completions: HabitCompletion[]): boolean => {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  return completions.some((completion) => {
    const completedAt = new Date(completion.completedAt);
    return completedAt >= todayStart && completedAt < todayEnd;
  });
};

// Get completions for a specific date
export const getCompletionsForDate = (
  completions: HabitCompletion[],
  date: Date
): HabitCompletion[] => {
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);

  return completions.filter((completion) => {
    const completedAt = new Date(completion.completedAt);
    return completedAt >= dateStart && completedAt < dateEnd;
  });
};

// Format frequency for display
export const formatFrequency = (frequency: string): string => {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();
};
