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
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4">Add New Habit</h2>
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="w-full border rounded px-3 py-2 mb-4"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as any)}
        >
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </select>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-purple-500 text-white"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddHabitForm;
