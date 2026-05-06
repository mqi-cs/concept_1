"use client";

import { memo } from "react";
import { LandmarkCategory } from "@/types";

const CATEGORY_COLORS: Record<LandmarkCategory, string> = {
  [LandmarkCategory.MONUMENT]: "#ef4444",
  [LandmarkCategory.PARK]: "#22c55e",
  [LandmarkCategory.MUSEUM]: "#a855f7",
  [LandmarkCategory.BRIDGE]: "#f97316",
  [LandmarkCategory.BUILDING]: "#6366f1",
  [LandmarkCategory.CHURCH]: "#eab308",
  [LandmarkCategory.SQUARE]: "#14b8a6",
  [LandmarkCategory.MARKET]: "#f43f5e",
  [LandmarkCategory.OTHER]: "#6b7280",
};

interface LandmarkMarkerProps {
  name: string;
  category: string;
  photoCount: number;
}

function LandmarkMarker({ name, category, photoCount }: LandmarkMarkerProps) {
  const color = CATEGORY_COLORS[category as LandmarkCategory] ?? "#6b7280";
  return (
    <div
      title={`${name}${photoCount ? ` · ${photoCount} photo${photoCount === 1 ? "" : "s"}` : ""}`}
      style={{
        background: color,
        width: 28,
        height: 28,
        borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        border: "2px solid white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        cursor: "pointer",
        willChange: "transform",
      }}
    />
  );
}

export default memo(LandmarkMarker);
