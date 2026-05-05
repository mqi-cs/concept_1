"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/stores/mapStore";

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
}

export default function PlaceSearchModal({ isOpen, onClose, onSelect }: PlaceSearchModalProps) {
  const { bounds } = useMapStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState(false);

  const trimmed = query.trim();
  const queryActive = trimmed.length >= 3;
  const visibleResults = queryActive ? results : [];
  const useViewBox = !!bounds && !globalSearch;

  useEffect(() => {
    if (!queryActive) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          format: "json",
          limit: "6",
          addressdetails: "0",
        });
        if (useViewBox && bounds) {
          params.set("viewbox", `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`);
        }
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );
        if (res.ok) {
          setResults((await res.json()) as PlaceResult[]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, queryActive, useViewBox, bounds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-base font-bold mb-1">No location in photo</h3>
          <p className="text-sm text-gray-500 mb-4">
            We couldn&apos;t read GPS metadata from this photo. Search for the place where it was taken.
          </p>
          <input
            autoFocus
            type="text"
            placeholder="Search a place, address, or landmark..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {bounds && (
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-500">
                {globalSearch ? "Searching worldwide" : "Nearby results first"}
              </span>
              <button
                onClick={() => setGlobalSearch((v) => !v)}
                className="text-blue-600 hover:underline"
              >
                {globalSearch ? "Bias to map view" : "Search worldwide"}
              </button>
            </div>
          )}

          <div className="mt-3 max-h-64 overflow-y-auto">
            {loading && <p className="text-xs text-gray-400 px-1 py-2">Searching...</p>}
            {!loading && queryActive && visibleResults.length === 0 && (
              <p className="text-xs text-gray-400 px-1 py-2">No matches.</p>
            )}
            {visibleResults.map((r) => (
              <button
                key={r.place_id}
                onClick={() => {
                  onSelect(parseFloat(r.lat), parseFloat(r.lon));
                  onClose();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Skip — pick on map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
