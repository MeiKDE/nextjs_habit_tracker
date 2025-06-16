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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "100px",
      }}
    >
      <h1>Login</h1>
      <button
        onClick={loginWithGoogle}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
