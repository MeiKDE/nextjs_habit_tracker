"use client";
import { account } from "/Users/mei/projects/React_Practice_Projects/habit-tracker/nextjs-habit-tracker/src/lib/appwrite";

const loginWithGoogle = () => {
  account.createOAuth2Session(
    "google",
    "http://localhost:3000/", // Success redirect
    "http://localhost:3000/login" // Failure redirect
  );
};

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Sign in to Habit Tracker
        </h1>
        <button
          onClick={loginWithGoogle}
          className="bg-violet-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-violet-600 transition-colors flex items-center gap-2 shadow-lg text-lg"
        >
          <svg className="w-6 h-6 mr-2" viewBox="0 0 48 48">
            <g>
              <path
                fill="#4285F4"
                d="M44.5 20H24v8.5h11.7C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 .9 8.3 2.7l6.2-6.2C34.2 4.5 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.3-.1-2.7-.5-4z"
              />
              <path
                fill="#34A853"
                d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c3.1 0 6 .9 8.3 2.7l6.2-6.2C34.2 4.5 29.3 3 24 3 15.1 3 7.6 8.7 6.3 14.7z"
              />
              <path
                fill="#FBBC05"
                d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.2-5.1C29.8 37 24 37 24 37c-5.8 0-10.7-3.1-13.2-7.5l-7 5.4C7.6 39.3 15.1 44 24 44z"
              />
              <path
                fill="#EA4335"
                d="M44.5 20H24v8.5h11.7C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 .9 8.3 2.7l6.2-6.2C34.2 4.5 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.3-.1-2.7-.5-4z"
                opacity=".2"
              />
            </g>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
