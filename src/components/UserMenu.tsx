"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import FriendsModal from "./friends/FriendsModal";

function SignedInMenu() {
  const user = useQuery(api.users.current);
  const incoming = useQuery(api.friends.listIncoming, {});
  const { signOut } = useAuthActions();
  const [friendsOpen, setFriendsOpen] = useState(false);

  const incomingCount = incoming?.length ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span className="bg-white/90 backdrop-blur text-gray-800 px-3 py-2 rounded-lg text-sm shadow">
        {user?.displayName || user?.email || "…"}
      </span>
      <button
        onClick={() => setFriendsOpen(true)}
        className="relative bg-white/90 backdrop-blur text-gray-700 px-3 py-2 rounded-lg text-sm shadow hover:bg-white transition-colors"
      >
        Friends
        {incomingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
            {incomingCount}
          </span>
        )}
      </button>
      <button
        onClick={() => signOut()}
        className="bg-white/90 backdrop-blur text-gray-600 px-3 py-2 rounded-lg text-sm shadow hover:bg-white transition-colors"
      >
        Sign Out
      </button>
      <FriendsModal isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} />
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
