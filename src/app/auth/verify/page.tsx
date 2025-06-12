"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "expired" | "already-verified"
  >("verifying");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!searchParams) {
        setStatus("error");
        setMessage(
          "Invalid verification link. Please check your email for the correct link."
        );
        return;
      }

      const userId = searchParams.get("userId");
      const secret = searchParams.get("secret");

      if (!userId || !secret) {
        setStatus("error");
        setMessage(
          "Invalid verification link. Please check your email for the correct link."
        );
        return;
      }

      try {
        console.log("Verifying email with Appwrite...");

        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, secret }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMessage(
            "Your email has been successfully verified! You can now sign in to your account."
          );

          // Redirect to sign in page after 3 seconds
          setTimeout(() => {
            router.push(
              "/auth/signin?message=Email verified successfully! You can now sign in."
            );
          }, 3000);
        } else if (response.status === 409) {
          setStatus("already-verified");
          setMessage(
            "This email has already been verified. You can sign in to your account."
          );
        } else if (response.status === 410) {
          setStatus("expired");
          setMessage(
            "This verification link has expired. Please request a new verification email."
          );
        } else {
          setStatus("error");
          setMessage(
            data.error ||
              "Failed to verify email. Please try again or request a new verification link."
          );
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          "An error occurred while verifying your email. Please try again."
        );
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage("");

    try {
      const email = searchParams?.get("email") || "";

      if (!email) {
        setResendMessage(
          "Please go back to the sign up page to request a new verification email."
        );
        setIsResending(false);
        return;
      }

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

  const getStatusIcon = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        );
      case "success":
      case "already-verified":
        return <CheckCircle size={64} className="text-green-500 mx-auto" />;
      case "error":
      case "expired":
        return <AlertCircle size={64} className="text-red-500 mx-auto" />;
      default:
        return <Mail size={64} className="text-gray-500 mx-auto" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "verifying":
        return "text-purple-600";
      case "success":
      case "already-verified":
        return "text-green-600";
      case "error":
      case "expired":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTitle = () => {
    switch (status) {
      case "verifying":
        return "Verifying Your Email...";
      case "success":
        return "Email Verified Successfully!";
      case "already-verified":
        return "Email Already Verified";
      case "error":
        return "Verification Failed";
      case "expired":
        return "Verification Link Expired";
      default:
        return "Email Verification";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-6">{getStatusIcon()}</div>

        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getTitle()}
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

        {status === "verifying" && (
          <div className="text-sm text-gray-500">
            Please wait while we verify your email address...
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Redirecting to sign in page in a few seconds...
            </div>
            <Link
              href="/auth/signin"
              className="inline-block bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Sign In Now
            </Link>
          </div>
        )}

        {status === "already-verified" && (
          <Link
            href="/auth/signin"
            className="inline-block bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Sign In
          </Link>
        )}

        {(status === "error" || status === "expired") && (
          <div className="space-y-4">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Resend Verification Email
                </>
              )}
            </button>

            {resendMessage && (
              <div
                className={`text-sm p-3 rounded-lg ${
                  resendMessage.includes("sent")
                    ? "text-green-600 bg-green-50"
                    : "text-red-600 bg-red-50"
                }`}
              >
                {resendMessage}
              </div>
            )}

            <div className="text-sm text-gray-500">
              Or{" "}
              <Link
                href="/auth/signup"
                className="text-purple-500 hover:text-purple-600 underline"
              >
                create a new account
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
