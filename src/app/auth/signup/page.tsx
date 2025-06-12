"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, AlertCircle, Mail } from "lucide-react";

// Enhanced email validation function
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: "Please enter a valid email address",
      suggestion: "",
    };
  }

  // Check for common typos in popular domains
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain) {
    // Check for common typos
    const typos: Record<string, string> = {
      "gmail.co": "gmail.com",
      "gmail.cm": "gmail.com",
      "gamil.com": "gmail.com",
      "yahoo.co": "yahoo.com",
      "hotmai.com": "hotmail.com",
      "outlok.com": "outlook.com",
    };

    if (typos[domain]) {
      return {
        isValid: false,
        message: `Did you mean ${email.split("@")[0]}@${typos[domain]}?`,
        suggestion: `${email.split("@")[0]}@${typos[domain]}`,
      };
    }
  }

  return { isValid: true, message: "", suggestion: "" };
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    message: "",
    suggestion: "",
  });
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "sent" | "verified" | null
  >(null);
  const router = useRouter();
  const { signUp } = useAuth();

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    setEmail(emailValue);

    if (emailValue) {
      const validation = validateEmail(emailValue);
      setEmailValidation(validation);
    } else {
      setEmailValidation({ isValid: true, message: "", suggestion: "" });
    }
  };

  // Use email suggestion
  const useSuggestion = () => {
    if (emailValidation.suggestion) {
      setEmail(emailValidation.suggestion);
      setEmailValidation({ isValid: true, message: "", suggestion: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Enhanced validation
    const emailValidationResult = validateEmail(email);
    if (!emailValidationResult.isValid) {
      setError(emailValidationResult.message);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      setIsLoading(false);
      return;
    }

    // Check for valid username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setError(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
      setIsLoading(false);
      return;
    }

    try {
      setVerificationStatus("pending");
      setSuccess("Creating your account...");

      await signUp(email, password, username, name || undefined);

      setVerificationStatus("sent");
      setSuccess(
        `Account created successfully! Please check your email (${email}) to verify your account before signing in.`
      );

      // Don't redirect immediately, let user see the verification message
      setTimeout(() => {
        router.push(
          "/auth/signin?message=Please check your email to verify your account"
        );
      }, 3000);
    } catch (error: any) {
      setVerificationStatus(null);
      console.error("Signup error:", error);

      // Enhanced error messages
      let errorMessage = "Failed to create account";

      if (error.message?.includes("email")) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("already registered")
        ) {
          errorMessage =
            "An account with this email already exists. Please try signing in instead.";
        } else if (error.message.includes("invalid")) {
          errorMessage = "Please enter a valid email address";
        } else {
          errorMessage =
            "There was an issue with your email. Please check and try again.";
        }
      } else if (error.message?.includes("username")) {
        errorMessage =
          "This username is already taken. Please choose a different one.";
      } else if (error.message?.includes("password")) {
        errorMessage =
          "Password does not meet requirements. Please try a stronger password.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("connection")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Start your habit tracking journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                emailValidation.isValid
                  ? "border-gray-300"
                  : "border-red-300 bg-red-50"
              }`}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
            {!emailValidation.isValid && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{emailValidation.message}</span>
                {emailValidation.suggestion && (
                  <button
                    type="button"
                    onClick={useSuggestion}
                    className="text-purple-600 hover:text-purple-700 underline ml-2"
                  >
                    Use this instead
                  </button>
                )}
              </div>
            )}
            {email && emailValidation.isValid && (
              <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Valid email address</span>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="Choose a unique username"
              required
              disabled={isLoading}
              minLength={3}
              maxLength={20}
            />
            <p className="mt-1 text-xs text-gray-500">
              3-20 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Full Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="Your full name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all pr-12"
                placeholder="Create a strong password"
                required
                disabled={isLoading}
                minLength={8}
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
            <p className="mt-1 text-xs text-gray-500">
              At least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm Password *
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                confirmPassword && password !== confirmPassword
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                Passwords do not match
              </p>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg flex items-start gap-2">
              {verificationStatus === "sent" ? (
                <Mail size={16} className="mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              )}
              <span>{success}</span>
            </div>
          )}

          {verificationStatus === "pending" && (
            <div className="text-blue-600 text-sm bg-blue-50 p-3 rounded-lg flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Setting up your account...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              !email ||
              !username ||
              !password ||
              !confirmPassword ||
              !emailValidation.isValid ||
              password !== confirmPassword
            }
            className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-purple-500 hover:text-purple-600 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          By creating an account, you agree to receive email notifications for
          account verification and important updates.
        </div>
      </div>
    </div>
  );
}
