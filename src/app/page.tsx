"use client";
import React, { useState } from "react";
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

const Page = () => {
  const { user, loading } = useAuth();
  const [reloadHabits, setReloadHabits] = useState(0);
  const {
    habits,
    loading: habitsLoading,
    error,
    completeHabit,
    deleteHabit,
  } = useHabits(reloadHabits);
  const [showAddForm, setShowAddForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    // Show login UI (already handled on your main page)
    return null;
  }

  const completedToday = habits.filter((habit) =>
    habit.completions?.some((completion: any) => {
      const today = new Date();
      const completedAt = new Date(completion.completedAt);
      return completedAt.toDateString() === today.toDateString();
    })
  ).length;

  const totalStreak = habits.reduce((sum, habit) => sum + habit.streakCount, 0);

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await completeHabit(habitId);
    } catch (err) {
      toast.error("Failed to complete habit");
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to add habit");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Toaster position="top-right" />
      <Navigation>
        <Link
          href="/streaks"
          className="ml-auto px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
        >
          View Streaks
        </Link>
      </Navigation>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Welcome back, {user.name || user.username}!
              </h2>
              <p className="text-gray-600">
                Track your habits and build better routines
              </p>
            </div>
            <button
              className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} />
              Add Habit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed Today</p>
              <p className="text-2xl font-bold text-gray-800">
                {completedToday}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Plus className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Habits</p>
              <p className="text-2xl font-bold text-gray-800">
                {habits.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-xl">🔥</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Streak</p>
              <p className="text-2xl font-bold text-gray-800">{totalStreak}</p>
            </div>
          </div>
        </div>

        {/* Habits List */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Today's Habits
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
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray mb-2">
                No habits yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first habit to get started on your journey
              </p>
              <button
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
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
