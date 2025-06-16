"use client";
import React, { useState } from "react";

interface AddHabitFormProps {
  isOpen: boolean;
  onSubmit: (data: {
    title: string;
    description?: string;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  }) => void;
  onClose: () => void;
}

const AddHabitForm: React.FC<AddHabitFormProps> = ({
  isOpen,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    "DAILY"
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, frequency });
    setTitle("");
    setDescription("");
    setFrequency("DAILY");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
          Add New Habit
        </h2>
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-4 text-base text-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-4 text-base text-slate-800 min-h-[80px] focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="mb-6">
          <label className="block text-base font-semibold text-slate-800 mb-2">
            Frequency
          </label>
          <div className="flex gap-3">
            {["DAILY", "WEEKLY", "MONTHLY"].map((freq) => (
              <button
                key={freq}
                type="button"
                className={`flex-1 bg-white rounded-xl border py-3 items-center transition-colors duration-150 ${
                  frequency === freq
                    ? "bg-violet-50 border-violet-500"
                    : "border-slate-200"
                }`}
                onClick={() => setFrequency(freq as any)}
              >
                <span
                  className={`text-base font-medium ${frequency === freq ? "text-violet-600 font-semibold" : "text-slate-500"}`}
                >
                  {freq.charAt(0) + freq.slice(1).toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-gray-200 text-slate-700 font-medium hover:bg-gray-300 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg hover:from-violet-600 hover:to-purple-600 transition-colors"
          >
            Create Habit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddHabitForm;
