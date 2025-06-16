"use client";
import React from "react";
import { CheckCircle, Trash2 } from "lucide-react";
import { Habit, HabitCompletion } from "@/types";

interface HabitCardProps {
  habit: Habit;
  onComplete: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onComplete,
  onDelete,
}) => {
  const streak = habit.streakCount || 0;
  const frequency = habit.frequency || "DAILY";
  const completed = habit.completions?.some((c: HabitCompletion) => {
    const today = new Date().toDateString();
    return new Date(c.completedAt).toDateString() === today;
  });

  return (
    <div
      className={`rounded-2xl mb-4 shadow-sm border transition-all duration-200 flex flex-col ${completed ? "bg-green-50 border-green-200" : "bg-white"}`}
    >
      <div className="flex flex-row items-center p-5 gap-4">
        <div className="mr-2">
          {completed ? (
            <CheckCircle size={24} className="text-emerald-500" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-200" />
          )}
        </div>
        <div className="flex-1">
          <h3
            className={`text-lg font-semibold mb-1 ${completed ? "text-emerald-700" : "text-slate-800"}`}
          >
            {habit.title}
          </h3>
          {habit.description && (
            <p
              className={`text-sm mb-2 leading-5 ${completed ? "text-emerald-600" : "text-slate-500"}`}
            >
              {habit.description}
            </p>
          )}
          <div className="flex flex-row items-center gap-3 mt-1">
            <span className="text-xs font-medium text-violet-500 bg-indigo-50 px-2 py-1 rounded">
              {frequency.charAt(0) + frequency.slice(1).toLowerCase()}
            </span>
            <span className="text-xs font-medium text-red-600">
              🔥 {streak} day streak
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2 ml-2">
          <button
            onClick={() => onComplete(habit.$id)}
            className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
            title="Complete"
          >
            <CheckCircle size={16} className="text-emerald-700" />
          </button>
          <button
            onClick={() => onDelete(habit.$id)}
            className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitCard;
