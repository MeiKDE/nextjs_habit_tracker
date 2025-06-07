"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Check, Flame } from "lucide-react";
import { Habit } from "@/types";
import { isCompletedToday, formatFrequency } from "@/lib/habits";

interface HabitCardProps {
  habit: Habit;
  onComplete: (habitId: string) => Promise<void>;
  onDelete: (habitId: string) => Promise<void>;
}

const HabitCard = ({ habit, onComplete, onDelete }: HabitCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const completed = isCompletedToday(habit.completions || []);

  const handleComplete = async () => {
    if (completed || isCompleting) return;

    try {
      setIsCompleting(true);
      await onComplete(habit.id);
    } catch (error) {
      console.error("Error completing habit:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await onDelete(habit.id);
    } catch (error) {
      console.error("Error deleting habit:", error);
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-200 ${
        completed
          ? "opacity-60 border-green-200"
          : "border-gray-100 hover:border-gray-200"
      }`}
      style={{ borderLeftColor: habit.color, borderLeftWidth: "6px" }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {habit.title}
          </h3>
          {habit.description && (
            <p className="text-gray-600 text-sm mb-3">{habit.description}</p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={handleComplete}
            disabled={completed || isCompleting}
            className={`p-2 rounded-full transition-all duration-200 ${
              completed
                ? "bg-green-100 text-green-600 cursor-not-allowed"
                : "bg-green-50 text-green-600 hover:bg-green-100 active:scale-95"
            }`}
            title={completed ? "Completed today!" : "Mark as complete"}
          >
            {isCompleting ? (
              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={20} />
            )}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 active:scale-95"
            title="Delete habit"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={20} />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-1">
          <Flame size={18} className="text-orange-500" />
          <span className="text-orange-600 font-semibold text-sm">
            {habit.streakCount} day streak
          </span>
        </div>

        <div className="bg-purple-50 rounded-xl px-3 py-1">
          <span className="text-purple-600 font-semibold text-sm">
            {formatFrequency(habit.frequency)}
          </span>
        </div>
      </div>

      {completed && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <Check size={16} />
            Completed today!
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default HabitCard;
