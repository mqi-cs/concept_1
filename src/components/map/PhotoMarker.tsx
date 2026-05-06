"use client";

import { memo } from "react";

interface PhotoMarkerProps {
  url: string | null;
  loveCount: number;
}

function PhotoMarker({ url, loveCount }: PhotoMarkerProps) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        border: "2px solid white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        overflow: "hidden",
        background: url ? `center/cover no-repeat url('${url}')` : "#e5e7eb",
        cursor: "pointer",
        willChange: "transform",
      }}
      title={`${loveCount} love${loveCount === 1 ? "" : "s"}`}
    />
  );
}

export default memo(PhotoMarker);
