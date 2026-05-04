"use client";

import { useState } from "react";

interface LoveButtonProps {
  photoId: string;
  initialLoved: boolean;
  initialCount: number;
}

export default function LoveButton({ photoId, initialLoved, initialCount }: LoveButtonProps) {
  const [loved, setLoved] = useState(initialLoved);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);

    // Optimistic update
    const newLoved = !loved;
    setLoved(newLoved);
    setCount((c) => c + (newLoved ? 1 : -1));

    try {
      const res = await fetch(`/api/photos/${photoId}/react`, {
        method: newLoved ? "POST" : "DELETE",
      });
      if (!res.ok) {
        // Revert on error
        setLoved(!newLoved);
        setCount((c) => c + (newLoved ? -1 : 1));
      }
    } catch {
      setLoved(!newLoved);
      setCount((c) => c + (newLoved ? -1 : 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="flex items-center gap-1 text-sm transition-colors"
    >
      <span className={loved ? "text-red-500" : "text-gray-400"}>
        {loved ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        )}
      </span>
      <span className={loved ? "text-red-500 font-medium" : "text-gray-500"}>
        {count}
      </span>
    </button>
  );
}
