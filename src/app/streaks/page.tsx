"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Flame, Trophy, CheckCircle } from "lucide-react";
import { useStreaks } from "@/hooks/useStreaks";
import Navigation from "@/components/Navigation";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

const streakTips = [
  "Consistency beats perfection - focus on showing up daily",
  "Track your progress to stay motivated",
  "Celebrate small wins along the way",
  "Don't break the chain!",
];

const StreaksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { habits, rankedHabits, loading, error } = useStreaks();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Toaster position="top-right" />
      <Navigation>
        <Link
          href="/"
          className="px-4 py-2 bg-violet-100 text-violet-700 rounded hover:bg-violet-200 transition-colors font-medium"
        >
          Home
        </Link>
      </Navigation>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Flame className="text-orange-400" size={40} />
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">
              Habit Streaks
            </h1>
            <p className="text-base text-slate-500">
              Track your consistency and progress
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Loading streaks...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">📈</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No streaks yet
            </h3>
            <p className="text-slate-500 text-center mb-6 max-w-xs">
              Complete some habits to start building your streaks!
            </p>
            <Link
              href="/"
              className="bg-violet-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-violet-600 transition-colors shadow-lg"
            >
              Go to Habits
            </Link>
          </div>
        ) : (
          <>
            {/* Top Performers Section */}
            {rankedHabits.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="text-amber-400" size={28} />
                  <span className="text-xl font-semibold text-slate-800">
                    Top Performers
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {rankedHabits.slice(0, 3).map((habit, index) => (
                    <div
                      key={habit.$id}
                      className="bg-white flex flex-row items-center p-4 rounded-2xl shadow-sm border border-gray-100"
                    >
                      <div className="items-center mr-4 flex flex-col">
                        <span className="text-2xl mb-1">
                          {getRankIcon(index)}
                        </span>
                        <span className="text-sm font-bold text-slate-500">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-semibold text-slate-800 mb-1 block">
                          {habit.title}
                        </span>
                        <span className="text-sm text-slate-500 block">
                          Best streak: {habit.streakData.bestStreak} days
                        </span>
                      </div>
                      <div className="flex flex-row items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                        <Flame size={16} className="text-orange-400" />
                        <span className="text-sm font-bold text-amber-600">
                          {habit.streakData.streak}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Habits Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-violet-500" size={24} />
                <span className="text-xl font-semibold text-slate-800">
                  All Habits
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {rankedHabits.map((habit) => (
                  <div
                    key={habit.$id}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
                  >
                    <div className="flex flex-row items-center mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                        style={{
                          backgroundColor: (habit.color || "#ddd") + "20",
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: habit.color || "#ddd" }}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-semibold text-slate-800 mb-0.5 block">
                          {habit.title}
                        </span>
                        <span className="text-sm text-slate-500 block">
                          {habit.frequency.charAt(0) +
                            habit.frequency.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row justify-around">
                      <div className="flex flex-col items-center gap-1">
                        <Flame size={16} className="text-orange-400" />
                        <span className="text-lg font-bold text-slate-800">
                          {habit.streakData.streak}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Current
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Trophy size={16} className="text-emerald-500" />
                        <span className="text-lg font-bold text-slate-800">
                          {habit.streakData.bestStreak}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Best
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle size={16} className="text-violet-500" />
                        <span className="text-lg font-bold text-slate-800">
                          {habit.streakData.total}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Total
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <span className="text-slate-600 text-sm text-center block">
                        {habit.streakData.streak === 0
                          ? "Start your streak today!"
                          : habit.streakData.streak === 1
                            ? "Great start! Keep going!"
                            : habit.streakData.streak < 7
                              ? "Building momentum! 🚀"
                              : habit.streakData.streak < 21
                                ? "You're on fire! 🔥"
                                : "Habit master! 🏆"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivation Section */}
            <div className="bg-indigo-50 p-5 rounded-2xl mb-4 border border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg">💡</span>
                <span className="text-lg font-semibold text-slate-800">
                  Streak Tips
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {streakTips.map((tip, index) => (
                  <span
                    key={index}
                    className="text-sm text-slate-600 leading-5"
                  >
                    • {tip}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StreaksPage;
