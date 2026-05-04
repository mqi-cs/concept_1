"use client";

import { create } from "zustand";
import { Landmark, BoundingBox } from "@/types";

interface MapState {
  bounds: BoundingBox | null;
  zoom: number;
  landmarks: Landmark[];
  selectedLandmarkId: string | null;
  isLoading: boolean;

  setBounds: (bounds: BoundingBox) => void;
  setZoom: (zoom: number) => void;
  setLandmarks: (landmarks: Landmark[]) => void;
  selectLandmark: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  bounds: null,
  zoom: 13,
  landmarks: [],
  selectedLandmarkId: null,
  isLoading: false,

  setBounds: (bounds) => set({ bounds }),
  setZoom: (zoom) => set({ zoom }),
  setLandmarks: (landmarks) => set({ landmarks }),
  selectLandmark: (id) => set({ selectedLandmarkId: id }),
  setLoading: (isLoading) => set({ isLoading }),
}));
