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
  completions: HabitCompletion[] //array of completed data
): StreakData => {
  if (completions.length === 0) {
    return { streak: 0, bestStreak: 0, total: 0 };
  }

  // Sort completions by date
  //creates a shallow copy of the completions array avoid mutating.
  const sortedCompletions = completions
    .slice()
    // It is expected to return a negative value if the first argument is less than the second argument, zero if they're equal, and a positive value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

  let currentStreak = 0;
  let bestStreak = 0;
  let lastDate: Date | null = null;

  // Goes through all completions in order.
  // Tracks how many consecutive days the user completed the habit.
  // Keeps the longest streak (bestStreak) as the final result.
  //Loop through each completion record in chronological order
  //Example:
  // This loop checks whether each completion is within 1 day of the previous one:
  // 5/28 → first day → streak = 1
  // 5/29 → 1 day later → streak = 2
  // 5/30 → 1 day later → streak = 3
  // 6/01 → skipped 5/31 → streak resets to 1
  // 6/02 → 1 day later → streak = 2 ✅
  // At the end:
  // currentStreak = 2 (from 6/01 → 6/02)
  // bestStreak = 3 (from 5/28 → 5/30)
  // total: 5 //total completions
  sortedCompletions.forEach((completion) => {
    const date = new Date(completion.completedAt);

    if (lastDate) {
      const diffInDays =
        (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

      // Using 1.5 days (instead of exactly 1) helps account
      // for time zone shifts or late-night entries.
      if (diffInDays <= 1.5) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    // track best streak
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    lastDate = date;
  });

  // Whether the current streak is still active (recent enough),
  // The best (longest) streak overall,
  // The total number of completions.
  // Check if current streak is still active (last completion was today or yesterday)

  // now = new Date("2025-06-07T08:00:00")
  // lastCompletionDate = new Date("2025-06-06T20:00:00")
  // daysSinceLastCompletion =
  // (now.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
  // ≈ (12 hours) / 1 day
  // ≈ 0.5 days
  // activeStreak = daysSinceLastCompletion <= 1.5 ? currentStreak : 0
  // → 0.5 <= 1.5 → true → activeStreak = currentStreak

  // now = new Date("2025-06-07")
  // lastCompletionDate = new Date("2025-06-05")
  // daysSinceLastCompletion = (2 days)
  // activeStreak = 2 > 1.5 → false → activeStreak = 0

  const now = new Date();
  const lastCompletionDate = new Date(
    sortedCompletions[sortedCompletions.length - 1].completedAt
  );
  const daysSinceLastCompletion =
    (now.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24);

  // → 0 <= 1.5 → true → activeStreak = currentStreak
  // reset streak if over 1.5 days
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

// Format frequency for display to upper case
export const formatFrequency = (frequency: string): string => {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();
};
