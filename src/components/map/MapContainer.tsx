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

interface PhotoClusterLike {
  getChildCount(): number;
  getAllChildMarkers(): L.Marker[];
}

function createPhotoClusterIcon(cluster: PhotoClusterLike) {
  const count = cluster.getChildCount();
  const firstChild = cluster.getAllChildMarkers()[0];
  const cover = (firstChild?.options?.icon as L.DivIcon | undefined)?.options?.html ?? "";
  const coverMatch = typeof cover === "string" ? cover.match(/url\('([^']+)'\)/) : null;
  const url = coverMatch?.[1];
  return L.divIcon({
    className: "photo-cluster",
    html: `<div style="
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 10px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.45);
      overflow: hidden;
      background: #d1d5db;
      ${url ? `background-image: url('${url}'); background-size: cover; background-position: center;` : ""}
    ">
      <div style="
        position: absolute;
        bottom: -2px;
        right: -2px;
        background: #2563eb;
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 8px;
        border: 2px solid white;
      ">${count}</div>
    </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function PhotoMarkers() {
  const { bounds, selectPhoto } = useMapStore();

  const photos = useQuery(
    api.photos.getInBBox,
    bounds ? bounds : "skip"
  );

  if (!photos) return null;

  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createPhotoClusterIcon}
      maxClusterRadius={60}
      showCoverageOnHover={false}
    >
      {photos.map((photo) => (
        <PhotoMarker
          key={photo._id}
          photo={photo}
          onClick={() => selectPhoto(photo._id)}
        />
      ))}
    </MarkerClusterGroup>
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
