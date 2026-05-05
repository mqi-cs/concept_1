"use client";

import { Marker, Popup } from "react-leaflet";
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
    popupAnchor: [0, -20],
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
}

export default function PhotoMarker({ photo }: PhotoMarkerProps) {
  return (
    <Marker
      position={[photo.latitude, photo.longitude]}
      icon={createPhotoIcon(photo.url)}
    >
      <Popup>
        <div className="text-sm">
          {photo.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt="" className="max-w-[200px] rounded mb-2" />
          )}
          <span className="text-gray-500">
            {photo.loveCount} love{photo.loveCount !== 1 ? "s" : ""}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}
