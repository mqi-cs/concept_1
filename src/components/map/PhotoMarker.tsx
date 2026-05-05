"use client";

interface PhotoMarkerProps {
  photo: {
    _id: string;
    url: string | null;
    loveCount: number;
  };
}

export default function PhotoMarker({ photo }: PhotoMarkerProps) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        border: "2px solid white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        overflow: "hidden",
        background: photo.url ? `center/cover no-repeat url('${photo.url}')` : "#e5e7eb",
        cursor: "pointer",
      }}
      title={`${photo.loveCount} love${photo.loveCount === 1 ? "" : "s"}`}
    />
  );
}
