"use client";
import React from "react";

const HabitCard = ({ habit, onComplete, onDelete }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-2">
    <h3 className="font-bold text-lg">{habit.title}</h3>
    <p className="text-gray-600">{habit.description}</p>
    <div className="flex gap-2 mt-2">
      <button
        className="bg-green-500 text-white px-3 py-1 rounded"
        onClick={() => onComplete(habit.$id)}
      >
        Complete
      </button>
      <button
        className="bg-red-500 text-white px-3 py-1 rounded"
        onClick={() => onDelete(habit.$id)}
      >
        Delete
      </button>
    </div>
  </div>
);

export default HabitCard;
