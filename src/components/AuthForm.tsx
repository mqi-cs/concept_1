"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuthActions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn("password", {
        email,
        password,
        flow: mode === "register" ? "signUp" : "signIn",
        ...(mode === "register" ? { name: displayName } : {}),
      });
      if (res?.signingIn) {
        window.location.href = "/";
        return;
      }
      setError("Authentication didn't complete. Please try again.");
      setSubmitting(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      setError(friendlyError(raw, mode));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {mode === "register" && (
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />

      <input
        type="password"
        placeholder="Password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        minLength={8}
        required
      />

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Loading..." : mode === "login" ? "Sign In" : "Sign Up"}
      </button>

      <p className="text-sm text-gray-500 text-center">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue-600 hover:underline">Sign up</a>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
          </>
        )}
      </p>
    </form>
  );
}

function friendlyError(raw: string, mode: "login" | "register"): string {
  if (raw.includes("InvalidSecret")) return "Wrong password.";
  if (raw.includes("InvalidAccountId")) return "No account with that email.";
  if (raw.includes("Account") && raw.includes("already exists")) {
    return mode === "register"
      ? "An account with that email already exists. Try signing in."
      : raw;
  }
  if (raw.includes("Invalid password")) return "Password must be at least 8 characters.";
  return raw.replace(/^\[CONVEX [^\]]+\]\s*/, "").replace(/^Uncaught Error:\s*/, "");
}
