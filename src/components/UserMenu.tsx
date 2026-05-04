"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function UserMenu() {
  const user = useQuery(api.users.current);
  const { signOut } = useAuthActions();

  if (user === undefined) {
    return null; // Loading
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-white transition-colors"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="bg-white/90 backdrop-blur text-gray-800 px-3 py-2 rounded-lg text-sm shadow">
        {user.displayName || user.email}
      </span>
      <button
        onClick={() => signOut()}
        className="bg-white/90 backdrop-blur text-gray-600 px-3 py-2 rounded-lg text-sm shadow hover:bg-white transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
