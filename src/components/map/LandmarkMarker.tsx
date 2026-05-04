"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Landmark, LandmarkCategory } from "@/types";

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

function createIcon(category: string) {
  const color = CATEGORY_COLORS[category as LandmarkCategory] || "#6b7280";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

interface LandmarkMarkerProps {
  landmark: Landmark;
  onClick: () => void;
}

export default function LandmarkMarker({ landmark, onClick }: LandmarkMarkerProps) {
  return (
    <Marker
      position={[landmark.latitude, landmark.longitude]}
      icon={createIcon(landmark.category)}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="text-sm">
          <strong>{landmark.name}</strong>
          <br />
          <span className="text-gray-500">{landmark.category}</span>
          {landmark.photoCount > 0 && (
            <span className="ml-2 text-gray-400">
              {landmark.photoCount} photo{landmark.photoCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
