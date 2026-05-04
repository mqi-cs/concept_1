"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/stores/mapStore";
import PhotoStack from "./PhotoStack";
import SortToggle from "./SortToggle";
import type { Landmark, Photo } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  MONUMENT: "Monument",
  PARK: "Park",
  MUSEUM: "Museum",
  BRIDGE: "Bridge",
  BUILDING: "Building",
  CHURCH: "Church",
  SQUARE: "Square",
  MARKET: "Market",
  OTHER: "Other",
};

export default function LandmarkPanel() {
  const { selectedLandmarkId, selectLandmark } = useMapStore();
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sort, setSort] = useState<"loved" | "recent">("loved");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedLandmarkId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLandmark(null);
      setPhotos([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/landmarks/${selectedLandmarkId}?sort=${sort}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setLandmark(data.landmark);
        setPhotos(data.photos);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [selectedLandmarkId, sort]);

  if (!selectedLandmarkId) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 md:right-auto md:top-0 md:w-96 bg-white shadow-xl z-[1000] flex flex-col max-h-[70vh] md:max-h-full overflow-hidden rounded-t-2xl md:rounded-none">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {loading && !landmark ? (
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <h2 className="text-lg font-bold truncate">{landmark?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {landmark?.category && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[landmark.category] || landmark.category}
                    </span>
                  )}
                  {(landmark?.city || landmark?.country) && (
                    <span className="text-xs text-gray-500">
                      {[landmark?.city, landmark?.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => selectLandmark(null)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {landmark?.description && (
          <p className="text-sm text-gray-600 mt-2">{landmark.description}</p>
        )}
      </div>

      {/* Sort + Photos */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Photos ({landmark?.photoCount || 0})
          </span>
          <SortToggle sort={sort} onSortChange={setSort} />
        </div>
        <PhotoStack photos={photos} />
      </div>
    </div>
  );
}
