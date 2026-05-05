"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer as LeafletMap, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  hasExif: boolean;
}

const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange, hasExif }: LocationPickerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">Location</label>
        {hasExif && (
          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
            From photo metadata
          </span>
        )}
      </div>
      <div className="h-48 rounded-lg overflow-hidden border">
        <LeafletMap
          center={[lat, lng]}
          zoom={14}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={lat} lng={lng} />
          <Marker
            position={[lat, lng]}
            draggable
            icon={pinIcon}
            ref={(ref) => {
              markerRef.current = ref;
            }}
            eventHandlers={{
              dragend: () => {
                const m = markerRef.current;
                if (!m) return;
                const p = m.getLatLng();
                onChange(p.lat, p.lng);
              },
            }}
          />
        </LeafletMap>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Drag the pin to adjust. {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  );
}
