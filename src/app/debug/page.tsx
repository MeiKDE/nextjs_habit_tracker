"use client";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { account } from "@/lib/appwrite";
import { isGuestUserError, completeAuthReset } from "@/lib/session-utils";

const DebugPage = () => {
  const { user, loading, signIn, clearSessions } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    setStatus("");
    try {
      await clearSessions();
      setStatus("✅ All sessions (Appwrite + JWT) cleared successfully");
    } catch (error: any) {
      setStatus(`❌ Error clearing all sessions: ${error.message}`);
    }
    setIsLoading(false);
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

  const checkAppwriteSession = async () => {
    setIsLoading(true);
    setStatus("");
    try {
      const currentUser = await account.get();
      setStatus(
        `✅ Found Appwrite session for: ${currentUser.email} (ID: ${currentUser.$id})`
      );
    } catch (error: any) {
      // Handle guest user errors gracefully
      if (isGuestUserError(error)) {
        setStatus("❌ No active Appwrite session found (user is guest)");
      } else {
        setStatus(`❌ Error checking session: ${error.message}`);
      }
    }
    setIsLoading(false);
  };

  const clearAppwriteSessions = async () => {
    setIsLoading(true);
    setStatus("");
    try {
      await account.deleteSessions();
      setStatus("✅ All Appwrite sessions cleared successfully");
    } catch (error: any) {
      // Handle guest user errors gracefully
      if (isGuestUserError(error)) {
        setStatus("❌ No sessions to clear (user is guest)");
      } else {
        setStatus(`❌ Error clearing sessions: ${error.message}`);
      }
    }
    setIsLoading(false);
  };

  const testSignIn = async () => {
    setIsLoading(true);
    setStatus("");

    const email = (document.getElementById("email") as HTMLInputElement)?.value;
    const password = (document.getElementById("password") as HTMLInputElement)
      ?.value;

    if (!email || !password) {
      setStatus("❌ Please enter email and password");
      setIsLoading(false);
      return;
    }

    try {
      // Try to create a session directly
      const session = await account.createEmailPasswordSession(email, password);
      setStatus(
        `✅ Direct Appwrite session created successfully: ${session.$id}`
      );
    } catch (error: any) {
      if (error.type === "user_session_already_exists") {
        setStatus(`❌ Session conflict error: ${error.message}`);
      } else {
        setStatus(`❌ Sign in error: ${error.message}`);
      }
    }
    setIsLoading(false);
  };

  const completeReset = async () => {
    setIsLoading(true);
    setStatus("Starting complete authentication reset...");

    try {
      const result = await completeAuthReset();

      if (result.success) {
        setStatus("✅ Complete authentication reset successful");
        console.log("Reset steps:", result.steps);
      } else {
        setStatus("⚠️ Authentication reset completed with some issues");
        console.log("Reset steps with issues:", result.steps);
      }

      // Refresh the page after reset
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setStatus(`❌ Complete reset failed: ${error.message}`);
    } finally {
      setIsLoading(false);
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

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={checkAppwriteSession}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Check Appwrite Session
            </button>
            <button
              onClick={clearAppwriteSessions}
              disabled={isLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              Clear Appwrite Sessions
            </button>
            <button
              onClick={clearAllSessions}
              disabled={isLoading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              Clear All Sessions
            </button>
            <button
              onClick={completeReset}
              disabled={isLoading}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
            >
              🔄 Complete Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Direct Sign In</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your password"
              />
            </div>
            <button
              onClick={testSignIn}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Direct Appwrite Sign In
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            How to use this debug page
          </h2>
          <div className="space-y-2 text-blue-700">
            <p>
              1. <strong>Check Appwrite Session:</strong> See if there's an
              active Appwrite session
            </p>
            <p>
              2. <strong>Clear Appwrite Sessions:</strong> Clear only Appwrite
              sessions
            </p>
            <p>
              3. <strong>Clear All Sessions:</strong> Clear both Appwrite and
              JWT sessions
            </p>
            <p>
              4. <strong>Complete Reset:</strong> Clear everything - Appwrite
              sessions, browser storage, cookies, and JWT tokens (most thorough)
            </p>
            <p>
              5. <strong>Test Direct Sign In:</strong> Try to create an Appwrite
              session directly to reproduce the error
            </p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              <strong>If you get the session conflict error:</strong> Use
              "Complete Reset" first for the most thorough cleanup, then try
              signing in again.
            </p>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800">
              <strong>Recommended workflow:</strong> Use "Complete Reset" → wait
              for page reload → try sign in. This handles all possible sources
              of session conflicts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
