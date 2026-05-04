"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!supabase?.auth) return;
    supabase.auth.getUser().then((res) => setUser(res.data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
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
        {user.user_metadata?.display_name || user.email}
      </span>
      <button
        onClick={handleSignOut}
        className="bg-white/90 backdrop-blur text-gray-600 px-3 py-2 rounded-lg text-sm shadow hover:bg-white transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
