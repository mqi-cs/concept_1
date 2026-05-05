"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function SignedInMenu() {
  const user = useQuery(api.users.current);
  const { signOut } = useAuthActions();

  return (
    <div className="flex items-center gap-2">
      <span className="bg-white/90 backdrop-blur text-gray-800 px-3 py-2 rounded-lg text-sm shadow">
        {user?.displayName || user?.email || "…"}
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

export default function UserMenu() {
  return (
    <>
      <Authenticated>
        <SignedInMenu />
      </Authenticated>
      <Unauthenticated>
        <a
          href="/login"
          className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-white transition-colors"
        >
          Sign In
        </a>
      </Unauthenticated>
    </>
  );
}
