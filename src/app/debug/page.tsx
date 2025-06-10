"use client";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { account } from "@/lib/appwrite";

const DebugPage = () => {
  const { user, loading, signIn } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const checkClientSession = async () => {
    try {
      setStatus("Checking client session...");
      const session = await account.getSession("current");
      console.log("Client session:", session);
      setDebugInfo((prev: any) => ({
        ...prev,
        clientSession: session,
        hasClientSession: !!session,
        clientSessionId: session?.$id,
      }));
      setStatus("Client session found");
    } catch (error: any) {
      console.error("Client session error:", error);
      setDebugInfo((prev: any) => ({
        ...prev,
        clientSession: null,
        hasClientSession: false,
        clientSessionError: error.message,
      }));
      setStatus("No client session");
    }
  };

  const checkServerAuth = async () => {
    try {
      setStatus("Checking server authentication...");
      const response = await fetch("/api/auth/debug", {
        credentials: "include",
      });
      const data = await response.json();
      console.log("Server auth debug:", data);
      setDebugInfo((prev: any) => ({
        ...prev,
        serverAuth: data,
      }));
      setStatus("Server auth checked");
    } catch (error: any) {
      console.error("Server auth error:", error);
      setDebugInfo((prev: any) => ({
        ...prev,
        serverAuthError: error.message,
      }));
      setStatus("Server auth error");
    }
  };

  const manualSync = async () => {
    try {
      setStatus("Attempting manual sync...");
      const session = await account.getSession("current");

      if (!session) {
        throw new Error("No client session to sync");
      }

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: session.$id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Sync failed");
      }

      const result = await response.json();
      console.log("Manual sync result:", result);
      setDebugInfo((prev: any) => ({
        ...prev,
        manualSync: result,
      }));
      setStatus("Manual sync successful");

      // Recheck server auth
      await checkServerAuth();
    } catch (error: any) {
      console.error("Manual sync error:", error);
      setDebugInfo((prev: any) => ({
        ...prev,
        manualSyncError: error.message,
      }));
      setStatus("Manual sync failed: " + error.message);
    }
  };

  const clearAllSessions = async () => {
    try {
      setStatus("Clearing all sessions...");

      // Clear client sessions
      try {
        await account.deleteSessions();
        console.log("Client sessions cleared");
      } catch (error) {
        console.log("No client sessions to clear or already cleared");
      }

      // Clear server session cookie
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      });

      setDebugInfo((prev: any) => ({
        ...prev,
        sessionsClearedAt: new Date().toISOString(),
      }));

      setStatus("All sessions cleared. Please sign in again.");

      // Refresh the page to reset auth state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Clear sessions error:", error);
      setStatus("Session cleanup completed (some errors expected)");
    }
  };

  const forceReauth = async () => {
    try {
      setStatus("Forcing re-authentication...");

      // Step 1: Clear everything
      await clearAllSessions();

      // Note: Page will reload, so the rest won't execute
    } catch (error: any) {
      console.error("Force reauth error:", error);
      setStatus("Force reauth failed: " + error.message);
    }
  };

  const testHabitsAPI = async () => {
    try {
      setStatus("Testing habits API...");
      const response = await fetch("/api/habits", {
        credentials: "include",
      });
      const data = await response.json();
      console.log("Habits API response:", data);
      setDebugInfo((prev: any) => ({
        ...prev,
        habitsAPI: { status: response.status, data },
      }));
      setStatus(response.ok ? "Habits API success" : "Habits API failed");
    } catch (error: any) {
      console.error("Habits API error:", error);
      setDebugInfo((prev: any) => ({
        ...prev,
        habitsAPIError: error.message,
      }));
      setStatus("Habits API error: " + error.message);
    }
  };

  const runFullDiagnostic = async () => {
    setDebugInfo({});
    await checkClientSession();
    await checkServerAuth();
    await testHabitsAPI();
  };

  const handleQuickSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus("Attempting to sign in...");
      await signIn(credentials.email, credentials.password);
      setStatus("Sign in successful!");
      setShowSignIn(false);
      // Run diagnostic after sign in
      setTimeout(() => runFullDiagnostic(), 1000);
    } catch (error: any) {
      setStatus("Sign in failed: " + error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>User:</strong>{" "}
              {user ? `${user.name} (${user.$id})` : "Not logged in"}
            </div>
            <div>
              <strong>Status:</strong> {status}
            </div>
          </div>
        </div>

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              ⚠️ Authentication Required
            </h2>
            <p className="text-gray-700 mb-4">
              You need to be signed in to test the habits API. You can either:
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSignIn(!showSignIn)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {showSignIn ? "Hide" : "Show"} Quick Sign In
              </button>
              <a
                href="/auth/signin"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
              >
                Go to Sign In Page
              </a>
            </div>

            {showSignIn && (
              <form
                onSubmit={handleQuickSignIn}
                className="mt-6 p-4 bg-white rounded border"
              >
                <h3 className="font-semibold mb-4">Quick Sign In</h3>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runFullDiagnostic}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Run Full Diagnostic
            </button>
            <button
              onClick={checkClientSession}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Check Client Session
            </button>
            <button
              onClick={checkServerAuth}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Check Server Auth
            </button>
            <button
              onClick={manualSync}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Manual Sync
            </button>
            <button
              onClick={testHabitsAPI}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Test Habits API
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={clearAllSessions}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              🧹 Clear All Sessions
            </button>
            <button
              onClick={forceReauth}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              🔄 Force Re-auth
            </button>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPage;
