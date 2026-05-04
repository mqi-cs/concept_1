"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer as LeafletMap, TileLayer, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import LandmarkMarker from "./LandmarkMarker";
import { useMapStore } from "@/stores/mapStore";
import "leaflet/dist/leaflet.css";

function updateBounds(map: L.Map, setBounds: (b: { west: number; south: number; east: number; north: number }) => void, setZoom: (z: number) => void) {
  const b = map.getBounds();
  setBounds({
    west: b.getWest(),
    south: b.getSouth(),
    east: b.getEast(),
    north: b.getNorth(),
  });
  setZoom(map.getZoom());
}

function MapEvents() {
  const { setBounds, setZoom } = useMapStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const map = useMapEvents({
    moveend() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateBounds(map, setBounds, setZoom);
      }, 300);
    },
  });

  useEffect(() => {
    updateBounds(map, setBounds, setZoom);
  }, [map, setBounds, setZoom]);

  return null;
}

function LandmarksFetcher() {
  const { bounds, setLandmarks, setLoading } = useMapStore();

  useEffect(() => {
    if (!bounds) return;

    const controller = new AbortController();
    setLoading(true);

    fetch(
      `/api/landmarks?bbox=${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.landmarks) setLandmarks(data.landmarks);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [bounds, setLandmarks, setLoading]);

  return null;
}

export default function MapView() {
  const { landmarks, selectLandmark } = useMapStore();

  return (
    <LeafletMap
      center={[51.505, -0.09]}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents />
      <LandmarksFetcher />
      <MarkerClusterGroup chunkedLoading>
        {landmarks.map((landmark) => (
          <LandmarkMarker
            key={landmark.id}
            landmark={landmark}
            onClick={() => selectLandmark(landmark.id)}
          />
        ))}
      </MarkerClusterGroup>
    </LeafletMap>
  );
}
