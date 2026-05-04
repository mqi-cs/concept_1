"use client";

import { create } from "zustand";

interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface MapState {
  bounds: BoundingBox | null;
  zoom: number;
  selectedLandmarkId: string | null;

  setBounds: (bounds: BoundingBox) => void;
  setZoom: (zoom: number) => void;
  selectLandmark: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  bounds: null,
  zoom: 13,
  selectedLandmarkId: null,

  setBounds: (bounds) => set({ bounds }),
  setZoom: (zoom) => set({ zoom }),
  selectLandmark: (id) => set({ selectedLandmarkId: id }),
}));
