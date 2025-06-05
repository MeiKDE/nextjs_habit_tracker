"use client";
import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, LogOut, TrendingUp } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import HabitCard from "@/components/HabitCard";
import AddHabitForm from "@/components/AddHabitForm";
import toast, { Toaster } from "react-hot-toast";

const Page = () => {
  const { data: session, status } = useSession();
  const { habits, loading, error, createHabit, deleteHabit, completeHabit } =
    useHabits();
  const [showAddForm, setShowAddForm] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to Habit Tracker
          </h1>
          <p className="text-gray-600 mb-8">Please sign in to continue</p>
          <a
            href="/auth/signin"
            className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const handleCreateHabit = async (data: any) => {
    try {
      await createHabit(data);
      toast.success("Habit created successfully!");
    } catch (error) {
      toast.error("Failed to create habit");
      throw error;
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await completeHabit(habitId);
      toast.success("Habit completed! 🎉");
    } catch (error) {
      toast.error("Failed to complete habit");
      throw error;
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
      toast.success("Habit deleted");
    } catch (error) {
      toast.error("Failed to delete habit");
      throw error;
    }
  };

  // Counts how many habits have at least one completion entry
  // where the date matches today’s date.
  const completedToday = habits.filter((habit) =>
    // checks if it has a completions array.
    // uses .some() to check if any one of the completions matches today's date.
    habit.completions?.some((completion) => {
      const today = new Date();
      const completedAt = new Date(completion.completedAt);
      return completedAt.toDateString() === today.toDateString();
    })
  ).length; //takes count of those habits

  //sum keeps track of the accumulated total.
  // habit is the current habit being processed in the loop.
  // 0 is the initial value of sum.
  const totalStreak = habits.reduce((sum, habit) => sum + habit.streakCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Habit Tracker
              </h1>
              <p className="text-gray-600">
                Welcome back, {session?.user?.name || session?.user?.username}!
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Add Habit
              </button>

              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
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
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
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
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-orange-600 text-xl">🔥</span>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Streak</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalStreak}
                </p>
              </div>
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

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading habits...</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No habits yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first habit to get started on your journey!
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                Add Your First Habit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
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

      {/* Add Habit Form Modal */}
      <AddHabitForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleCreateHabit}
      />
    </div>
  );
};

export default Page;
