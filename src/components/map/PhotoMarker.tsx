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
        width: 80,
        height: 80,
        borderRadius: 14,
        border: "2px solid white",
        boxShadow: "0 3px 10px rgba(0,0,0,0.45)",
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
