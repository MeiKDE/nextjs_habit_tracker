"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Navigation from "@/components/Navigation";
import { Plus, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useHabits from "@/hooks/useHabits";
import { AnimatePresence } from "framer-motion";
import HabitCard from "@/components/HabitCard";
import AddHabitForm from "@/components/AddHabitForm";
import { HabitsService } from "@/lib/habits-appwrite";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HabitCompletion } from "@/types";

const Page = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reloadHabits, setReloadHabits] = useState(0);
  const {
    habits,
    loading: habitsLoading,
    error,
    completeHabit,
    deleteHabit,
  } = useHabits(reloadHabits);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const completedToday = habits.filter((habit) =>
    habit.completions?.some((completion: HabitCompletion) => {
      const today = new Date();
      const completedAt = new Date(completion.completedAt);
      return completedAt.toDateString() === today.toDateString();
    })
  ).length;

  const totalStreak = habits.reduce((sum, habit) => sum + habit.streakCount, 0);

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await completeHabit(habitId);
    } catch {
      toast.error("Failed to complete habit");
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  const handleAddHabit = async (data: {
    title: string;
    description?: string;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  }) => {
    try {
      if (!user) return;
      await HabitsService.createHabit(
        user.$id,
        data.title,
        data.description,
        data.frequency
      );
      toast.success("Habit added!");
      setShowAddForm(false);
      setReloadHabits((prev) => prev + 1);
    } catch {
      toast.error("Failed to add habit");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Toaster position="top-right" />
      <Navigation>
        <Link
          href="/streaks"
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold shadow-lg hover:from-green-600 hover:to-green-600 transition-colors"
        >
          View Streaks
        </Link>
      </Navigation>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-1">
                Today&apos;s Habits
              </h2>
              <p className="text-base text-slate-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              className="bg-violet-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-violet-600 transition-colors flex items-center gap-2 shadow-lg"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={24} />
              Add Habit
            </button>
          </div>

          {/* Progress Card */}
          <div className="bg-white p-5 rounded-2xl mb-8 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold text-slate-800">
                Daily Progress
              </span>
              <span className="text-lg font-bold text-violet-500">
                {completedToday}/{habits.length}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{
                  width:
                    habits.length > 0
                      ? `${(completedToday / habits.length) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <span className="text-sm font-medium text-slate-500 text-center block">
              {completedToday === habits.length && habits.length > 0
                ? "🎉 All habits completed today!"
                : `${habits.length - completedToday} habits remaining`}
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <div className="p-3 bg-green-100 rounded-lg mb-2">
                <TrendingUp className="text-green-600" size={28} />
              </div>
              <p className="text-slate-500 text-sm">Completed Today</p>
              <p className="text-2xl font-bold text-slate-800">
                {completedToday}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <div className="p-3 bg-violet-100 rounded-lg mb-2">
                <Plus className="text-violet-600" size={28} />
              </div>
              <p className="text-slate-500 text-sm">Total Habits</p>
              <p className="text-2xl font-bold text-slate-800">
                {habits.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <div className="p-3 bg-orange-100 rounded-lg mb-2">
                <span className="text-orange-600 text-2xl">🔥</span>
              </div>
              <p className="text-slate-500 text-sm">Total Streak</p>
              <p className="text-2xl font-bold text-slate-800">{totalStreak}</p>
            </div>
          </div>
        </div>

        {/* Habits List */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Today&apos;s Habits
          </h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {habitsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading habits...</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-4xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No habits yet
              </h3>
              <p className="text-slate-500 text-center mb-6 max-w-xs">
                Create your first habit to start building better routines
              </p>
              <button
                className="bg-violet-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-violet-600 transition-colors shadow-lg"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Habit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.$id}
                    habit={habit}
                    onComplete={handleCompleteHabit}
                    onDelete={handleDeleteHabit}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <AddHabitForm
        isOpen={showAddForm}
        onSubmit={handleAddHabit}
        onClose={() => setShowAddForm(false)}
      />
    </div>
  );
};

export default Page;
