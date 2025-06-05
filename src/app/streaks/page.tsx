"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, Trophy, CheckCircle } from "lucide-react";
import { useStreaks } from "@/hooks/useStreaks";
import Navigation from "@/components/Navigation";
import toast, { Toaster } from "react-hot-toast";

const StreaksPage = () => {
  const { data: session, status } = useSession();
  const { habits, rankedHabits, loading, error } = useStreaks();

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

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-100 text-yellow-800";
      case 1:
        return "bg-gray-100 text-gray-800";
      case 2:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-purple-100 text-purple-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Toaster position="top-right" />
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-purple-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Habit Streaks</h1>
          </div>
          <p className="text-gray-600">
            Track your consistency and celebrate your progress
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading streaks...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No habits yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first habit to start building streaks!
            </p>
            <a
              href="/"
              className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              Go to Habits
            </a>
          </div>
        ) : (
          <>
            {/* Top Streaks Section */}
            {rankedHabits.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="text-purple-600" size={24} />
                  <span className="text-lg font-bold text-gray-800">
                    🏅 Top Streaks
                  </span>
                </div>

                <div className="space-y-4">
                  {rankedHabits.slice(0, 3).map((habit, index) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(
                            index
                          )}`}
                        >
                          {getRankIcon(index)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {habit.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {habit.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {habit.streakData.bestStreak}
                        </div>
                        <div className="text-xs text-gray-500">Best Streak</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All Habits Streaks */}
            <div className="space-y-4">
              {rankedHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 10) * 0.05 }}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {habit.title}
                      </h3>
                      {habit.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {habit.description}
                        </p>
                      )}
                    </div>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Flame className="text-orange-600" size={20} />
                        <span className="text-2xl font-bold text-gray-800">
                          {habit.streakData.streak}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Current Streak
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy className="text-yellow-600" size={20} />
                        <span className="text-2xl font-bold text-gray-800">
                          {habit.streakData.bestStreak}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Best Streak
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="text-green-600" size={20} />
                        <span className="text-2xl font-bold text-gray-800">
                          {habit.streakData.total}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Total Completions
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StreaksPage;
