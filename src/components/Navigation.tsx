"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const navItems = [
    {
      href: "/",
      label: "Habits",
      icon: Home,
    },
    {
      href: "/streaks",
      label: "Streaks",
      icon: TrendingUp,
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-800">Habit Tracker</h1>

            <div className="flex space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? "text-purple-600 bg-purple-50"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
