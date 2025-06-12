"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, AlertCircle, Mail } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, forceRefresh } = useAuth();

  // Handle URL parameters for messages
  useEffect(() => {
    if (searchParams) {
      const message = searchParams.get("message");
      if (message) {
        setSuccess(message);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await signIn(email, password);
      router.push("/");
    } catch (error: any) {
      console.error("Sign in error:", error);

      // Enhanced error handling with verification-specific messaging
      let errorMessage = "Invalid email or password";

      if (
        error.message?.includes("email verification") ||
        error.message?.includes("not verified")
      ) {
        errorMessage =
          "Please verify your email address before signing in. Check your inbox for a verification email.";
      } else if (
        error.message?.includes("invalid credentials") ||
        error.message?.includes("Invalid credentials")
      ) {
        errorMessage =
          "Invalid email or password. Please check your credentials and try again.";
      } else if (
        error.message?.includes("too many requests") ||
        error.message?.includes("rate limit")
      ) {
        errorMessage =
          "Too many login attempts. Please wait a few minutes before trying again.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("connection")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (
        error.message?.includes("scope") ||
        error.message?.includes("guest")
      ) {
        errorMessage =
          "Session conflict detected. Please clear sessions and try again.";
        setShowTroubleshooting(true);
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);

      // Show troubleshooting options for session-related errors
      if (
        error.message?.includes("scope") ||
        error.message?.includes("guest") ||
        error.message?.includes("session")
      ) {
        setShowTroubleshooting(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage("Please enter your email address first");
      return;
    }

    setIsResending(true);
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendMessage(
          "Verification email sent! Please check your inbox and spam folder."
        );
        setError(""); // Clear the error since we're helping the user
      } else if (response.status === 409) {
        setResendMessage(
          "This email is already verified. Please try signing in."
        );
      } else if (response.status === 404) {
        setResendMessage(
          "No account found with this email. Please check your email or create a new account."
        );
      } else {
        setResendMessage(
          data.error || "Failed to send verification email. Please try again."
        );
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setResendMessage("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleClearSessions = async () => {
    setIsLoading(true);
    setError("");

    try {
      await forceRefresh();
      setShowTroubleshooting(false);
      setSuccess("Sessions cleared! Please try signing in again.");
    } catch (error: any) {
      setError("Sessions cleared. Please try signing in again.");
      setShowTroubleshooting(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your habit tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all pr-12"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes("verify your email") && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="text-purple-600 hover:text-purple-700 underline text-sm font-medium"
                    >
                      {isResending ? "Sending..." : "Resend verification email"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {resendMessage && (
            <div
              className={`text-sm p-3 rounded-lg flex items-start gap-2 ${
                resendMessage.includes("sent")
                  ? "text-green-600 bg-green-50"
                  : "text-orange-600 bg-orange-50"
              }`}
            >
              <Mail size={16} className="mt-0.5 flex-shrink-0" />
              <span>{resendMessage}</span>
            </div>
          )}

          {showTroubleshooting && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Login Issue Detected
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                There appears to be a session conflict. This can happen when
                switching between different accounts or browsers. Clearing
                sessions should resolve this issue.
              </p>
              <button
                type="button"
                onClick={handleClearSessions}
                disabled={isLoading}
                className="bg-yellow-500 text-white px-4 py-2 text-sm rounded hover:bg-yellow-600 disabled:opacity-50 transition-colors"
              >
                Clear Sessions & Retry
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-purple-500 hover:text-purple-600 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
