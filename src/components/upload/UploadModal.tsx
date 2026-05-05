"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useMapStore } from "@/stores/mapStore";
import { extractPhotoLocation } from "@/lib/exif";
import PhotoDropzone from "./PhotoDropzone";
import MetadataForm from "./MetadataForm";
import PlaceSearchModal from "./PlaceSearchModal";

const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasExif, setHasExif] = useState(false);
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);
  const { bounds } = useMapStore();

  const handleFileSelect = useCallback(
    async (f: File) => {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setError(null);

      const exif = await extractPhotoLocation(f);
      if (exif) {
        setLocation({ lat: exif.lat, lng: exif.lng });
        setHasExif(true);
      } else {
        setHasExif(false);
        setPlaceSearchOpen(true);
      }
    },
    []
  );

  function applyFallbackLocation() {
    if (location) return;
    const fallback = bounds
      ? { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }
      : { lat: 51.505, lng: -0.09 };
    setLocation(fallback);
  }

  const handleMetadataChange = useCallback((m: Record<string, unknown>) => {
    setMetadata(m);
  }, []);

  function reset() {
    setFile(null);
    setPreview(null);
    setLocation(null);
    setHasExif(false);
    setPlaceSearchOpen(false);
    setMetadata({});
    setError(null);
  }

  async function handleUpload() {
    if (!file || !location) return;
    setError(null);
    setUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      await createPhoto({
        storageId: storageId as Id<"_storage">,
        latitude: location.lat,
        longitude: location.lng,
        timeOfDay: (metadata.timeOfDay as string) || undefined,
        gearNotes: (metadata.gearNotes as string) || undefined,
        accessibilityNotes: (metadata.accessibilityNotes as string) || undefined,
        tags: (metadata.tags as string[]) || [],
      });

      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upload Photo</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              &times;
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="relative">
              <PhotoDropzone onFileSelect={handleFileSelect} preview={preview} />
            </div>

            {location && (
              <LocationPicker
                lat={location.lat}
                lng={location.lng}
                hasExif={hasExif}
                onChange={(lat, lng) => setLocation({ lat, lng })}
              />
            )}

            <MetadataForm onMetadataChange={handleMetadataChange} />

            <button
              onClick={handleUpload}
              disabled={!file || !location || uploading}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </div>
      </div>

      {placeSearchOpen && (
        <PlaceSearchModal
          isOpen
          onClose={() => {
            setPlaceSearchOpen(false);
            applyFallbackLocation();
          }}
          onSelect={(lat, lng) => setLocation({ lat, lng })}
        />
      )}
    </div>
  );
}
