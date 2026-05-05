"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import LoveButton from "./LoveButton";

interface PhotoLightboxProps {
  photoId: string | null;
  onClose: () => void;
}

export default function PhotoLightbox({ photoId, onClose }: PhotoLightboxProps) {
  const photo = useQuery(
    api.photos.getById,
    photoId ? { id: photoId as Id<"photos"> } : "skip"
  );

  useEffect(() => {
    if (!photoId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoId, onClose]);

  if (!photoId) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-lg shadow"
          aria-label="Close"
        >
          &times;
        </button>

        {!photo ? (
          <div className="flex items-center justify-center p-12 text-gray-400">Loading...</div>
        ) : !photo.url ? (
          <div className="flex items-center justify-center p-12 text-gray-400">Photo unavailable</div>
        ) : (
          <>
            <div className="bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="max-h-[60vh] max-w-full object-contain"
              />
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="text-sm text-gray-500">
                  {photo.uploaderName ? (
                    <>by <span className="font-medium text-gray-700">{photo.uploaderName}</span></>
                  ) : (
                    <span className="italic">Anonymous upload</span>
                  )}
                </div>
                <LoveButton
                  photoId={photo._id}
                  initialLoved={photo.lovedByUser}
                  initialCount={photo.loveCount}
                />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {photo.timeOfDay && (
                  <div>
                    <span className="text-gray-400">Time of day: </span>
                    <span className="text-gray-700">
                      {photo.timeOfDay.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                  </div>
                )}
                {photo.gearNotes && (
                  <div>
                    <span className="text-gray-400">Gear: </span>
                    <span className="text-gray-700">{photo.gearNotes}</span>
                  </div>
                )}
                {photo.accessibilityNotes && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Accessibility: </span>
                    <span className="text-gray-700">{photo.accessibilityNotes}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-gray-400">Location: </span>
                  <span className="text-gray-700">
                    {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              {photo.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {photo.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
