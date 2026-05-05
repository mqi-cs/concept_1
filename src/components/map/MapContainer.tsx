"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer as LeafletMap, TileLayer, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import LandmarkMarker from "./LandmarkMarker";
import PhotoMarker from "./PhotoMarker";
import { useMapStore } from "@/stores/mapStore";
import "leaflet/dist/leaflet.css";

function updateBounds(
  map: L.Map,
  setBounds: (b: { west: number; south: number; east: number; north: number }) => void,
  setZoom: (z: number) => void
) {
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

function LandmarkMarkers() {
  const { bounds, selectLandmark } = useMapStore();

  const landmarks = useQuery(
    api.landmarks.getInBBox,
    bounds ? bounds : "skip"
  );

  if (!landmarks) return null;

  return (
    <MarkerClusterGroup chunkedLoading>
      {landmarks.map((landmark) => (
        <LandmarkMarker
          key={landmark._id}
          landmark={landmark}
          onClick={() => selectLandmark(landmark._id)}
        />
      ))}
    </MarkerClusterGroup>
  );
}

function PhotoMarkers() {
  const { bounds } = useMapStore();

  const photos = useQuery(
    api.photos.getInBBox,
    bounds ? bounds : "skip"
  );

  if (!photos) return null;

  return (
    <>
      {photos.map((photo) => (
        <PhotoMarker key={photo._id} photo={photo} />
      ))}
    </>
  );
}

export default function MapView() {
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
      <LandmarkMarkers />
      <PhotoMarkers />
    </LeafletMap>
  );
}
