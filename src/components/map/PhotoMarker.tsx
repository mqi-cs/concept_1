"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";

function createPhotoIcon(url: string | null) {
  return L.divIcon({
    className: "photo-marker",
    html: `<div style="
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      overflow: hidden;
      background: #e5e7eb;
      ${url ? `background-image: url('${url}'); background-size: cover; background-position: center;` : ""}
    "></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

interface PhotoMarkerProps {
  photo: {
    _id: string;
    latitude: number;
    longitude: number;
    url: string | null;
    loveCount: number;
  };
  onClick: () => void;
}

export default function PhotoMarker({ photo, onClick }: PhotoMarkerProps) {
  return (
    <Marker
      position={[photo.latitude, photo.longitude]}
      icon={createPhotoIcon(photo.url)}
      eventHandlers={{ click: onClick }}
    />
  );
}
