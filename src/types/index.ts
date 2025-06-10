export interface Todo {
  id: number; //unique identifier, auto set by database
  title: string;
  description?: string;
  completed: boolean; //default as false
  createdAt: Date; // default as current date
  updatedAt: Date; // default as current date
}

export interface User {
  $id: string;
  email: string;
  username: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitData {
  title: string;
  description?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
}

export interface Habit {
  $id: string;
  title: string;
  description?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  streakCount: number;
  lastCompleted?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  completions?: HabitCompletion[];
}

export interface HabitCompletion {
  $id: string;
  completedAt: string;
  notes?: string;
  createdAt: string;
  habitId: string;
  habit?: Habit;
}

export interface CreateCompletionData {
  habitId: string;
  completedAt?: string;
  notes?: string;
}

export interface StreakData {
  streak: number;
  bestStreak: number;
  total: number;
}

export interface HabitWithStreak extends Habit {
  streakData: StreakData;
}

// Auth types
export interface SignUpData {
  email: string;
  password: string;
  username: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form validation schemas using Zod (we'll implement these)
export interface FormErrors {
  [key: string]: string | undefined;
}
