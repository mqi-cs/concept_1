"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, type MapRef, type MarkerDragEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  hasExif: boolean;
}

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function LocationPicker({ lat, lng, onChange, hasExif }: LocationPickerProps) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({ center: [lng, lat], duration: 300 });
  }, [lat, lng]);

  function handleDragEnd(e: MarkerDragEvent) {
    onChange(e.lngLat.lat, e.lngLat.lng);
  }

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
        <Map
          ref={mapRef}
          initialViewState={{ longitude: lng, latitude: lat, zoom: 14 }}
          mapStyle={MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
          dragRotate={false}
          pitchWithRotate={false}
        >
          <Marker
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            draggable
            onDragEnd={handleDragEnd}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)",
                background: "#3b82f6",
                border: "2px solid white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            />
          </Marker>
        </Map>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Drag the pin to adjust. {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  );
}
