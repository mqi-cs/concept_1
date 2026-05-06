"use client";

import { create } from "zustand";

interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

type MapView = "public" | "friends";

interface MapState {
  bounds: BoundingBox | null;
  zoom: number;
  view: MapView;
  selectedLandmarkId: string | null;
  selectedPhotoId: string | null;

  setBounds: (bounds: BoundingBox) => void;
  setZoom: (zoom: number) => void;
  setView: (view: MapView) => void;
  selectLandmark: (id: string | null) => void;
  selectPhoto: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  bounds: null,
  zoom: 13,
  view: "public",
  selectedLandmarkId: null,
  selectedPhotoId: null,

  setBounds: (bounds) => set({ bounds }),
  setZoom: (zoom) => set({ zoom }),
  setView: (view) => set({ view }),
  selectLandmark: (id) => set({ selectedLandmarkId: id }),
  selectPhoto: (id) => set({ selectedPhotoId: id }),
}));
