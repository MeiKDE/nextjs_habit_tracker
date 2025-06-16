"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAccount = async () => {
      try {
        const accountData = await account.get();
        setUser({
          $id: accountData.$id,
          email: accountData.email,
          username: accountData.name || accountData.email || "",
          name: accountData.name || "",
          createdAt: accountData.$createdAt || "",
          updatedAt: accountData.$updatedAt || "",
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getAccount();
  }, []);

  const signOut = async () => {
    await account.deleteSession("current");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
