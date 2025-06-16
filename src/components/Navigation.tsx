"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationProps {
  children?: React.ReactNode;
}

const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="w-full bg-white shadow px-4 py-3 mb-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <span className="font-bold text-purple-600 text-xl">Habit Tracker</span>
        <div className="flex items-center gap-4">
          {children}
          {user && (
            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white font-semibold shadow-lg hover:from-red-500 hover:to-red-600 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
