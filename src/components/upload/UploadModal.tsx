"use client";

import { useCallback, useState } from "react";
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

type EntryStatus = "ready" | "needs-location" | "uploading" | "done" | "error";

interface PhotoEntry {
  id: string;
  file: File;
  preview: string;
  hasExif: boolean;
  location: { lat: number; lng: number } | null;
  status: EntryStatus;
  errorMsg?: string;
}

async function decodeImage(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [phase, setPhase] = useState<"select" | "uploading-ready" | "locating">("select");
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);
  const { bounds } = useMapStore();

  const updateEntry = useCallback((id: string, patch: Partial<PhotoEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const handleFilesSelect = useCallback(async (files: File[]) => {
    setPendingFiles(true);
    setGlobalError(null);

    const built: PhotoEntry[] = [];
    let invalid = 0;
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        invalid++;
        continue;
      }
      const ok = await decodeImage(f);
      if (!ok) {
        invalid++;
        continue;
      }
      const exif = await extractPhotoLocation(f);
      built.push({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        hasExif: !!exif,
        location: exif ? { lat: exif.lat, lng: exif.lng } : null,
        status: exif ? "ready" : "needs-location",
      });
    }

    setEntries((prev) => {
      const combined = [...prev, ...built];
      return [
        ...combined.filter((e) => e.hasExif),
        ...combined.filter((e) => !e.hasExif),
      ];
    });
    if (invalid > 0) {
      setGlobalError(`${invalid} file${invalid === 1 ? "" : "s"} skipped (not a supported image).`);
    }
    setPendingFiles(false);
  }, []);

  function handleMetadataChange(m: Record<string, unknown>) {
    setMetadata(m);
  }

  function reset() {
    entries.forEach((e) => URL.revokeObjectURL(e.preview));
    setEntries([]);
    setMetadata({});
    setPhase("select");
    setPlaceSearchOpen(false);
    setGlobalError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function removeEntry(id: string) {
    setEntries((prev) => {
      const e = prev.find((x) => x.id === id);
      if (e) URL.revokeObjectURL(e.preview);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function uploadEntry(entry: PhotoEntry, location: { lat: number; lng: number }) {
    updateEntry(entry.id, { status: "uploading", location });
    try {
      const uploadUrl = await generateUploadUrl();
      const r = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": entry.file.type },
        body: entry.file,
      });
      if (!r.ok) throw new Error("Upload failed");
      const { storageId } = await r.json();
      await createPhoto({
        storageId: storageId as Id<"_storage">,
        latitude: location.lat,
        longitude: location.lng,
        timeOfDay: (metadata.timeOfDay as string) || undefined,
        gearNotes: (metadata.gearNotes as string) || undefined,
        accessibilityNotes: (metadata.accessibilityNotes as string) || undefined,
        tags: (metadata.tags as string[]) || [],
      });
      updateEntry(entry.id, { status: "done" });
    } catch (err) {
      updateEntry(entry.id, {
        status: "error",
        errorMsg: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  async function retryEntry(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry || !entry.location) return;
    await uploadEntry(entry, entry.location);
  }

  async function handleStart() {
    const ready = entries.filter((e) => e.status === "ready" && e.location);
    if (ready.length === 0 && entries.every((e) => e.status !== "needs-location")) return;

    setPhase("uploading-ready");
    await Promise.all(ready.map((e) => uploadEntry(e, e.location!)));

    if (entries.some((e) => e.status === "needs-location")) {
      setPhase("locating");
    } else {
      setPhase("select");
    }
  }

  const locatingEntry = entries.find((e) => e.status === "needs-location") ?? null;

  function setLocatingLocation(lat: number, lng: number) {
    if (!locatingEntry) return;
    updateEntry(locatingEntry.id, { location: { lat, lng } });
  }

  async function confirmLocating() {
    if (!locatingEntry || !locatingEntry.location) return;
    await uploadEntry(locatingEntry, locatingEntry.location);
    if (!entries.some((e) => e.id !== locatingEntry.id && e.status === "needs-location")) {
      setPhase("select");
    }
  }

  function skipLocating() {
    if (!locatingEntry) return;
    removeEntry(locatingEntry.id);
    if (!entries.some((e) => e.id !== locatingEntry.id && e.status === "needs-location")) {
      setPhase("select");
    }
  }

  if (!isOpen) return null;

  const readyCount = entries.filter((e) => e.status === "ready").length;
  const needsLocCount = entries.filter((e) => e.status === "needs-location").length;
  const doneCount = entries.filter((e) => e.status === "done").length;
  const errorCount = entries.filter((e) => e.status === "error").length;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upload Photos</h2>
            <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl">
              &times;
            </button>
          </div>

          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
              {globalError}
            </div>
          )}

          {phase === "select" && (
            <>
              <PhotoDropzone onFilesSelect={handleFilesSelect} />

              {pendingFiles && (
                <p className="text-xs text-gray-500 mt-2">Reading metadata...</p>
              )}

              {entries.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    {readyCount > 0 && <span><span className="text-green-700 font-medium">{readyCount}</span> with location</span>}
                    {needsLocCount > 0 && <span><span className="text-amber-700 font-medium">{needsLocCount}</span> need location</span>}
                    {doneCount > 0 && <span><span className="text-blue-700 font-medium">{doneCount}</span> uploaded</span>}
                    {errorCount > 0 && <span><span className="text-red-700 font-medium">{errorCount}</span> failed</span>}
                  </div>
                  <ul className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {entries.map((e) => (
                      <EntryRow
                        key={e.id}
                        entry={e}
                        onRemove={() => removeEntry(e.id)}
                        onRetry={() => retryEntry(e.id)}
                      />
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <MetadataForm onMetadataChange={handleMetadataChange} />
              </div>

              <button
                onClick={handleStart}
                disabled={readyCount === 0 && needsLocCount === 0}
                className="w-full mt-4 bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {readyCount > 0 && needsLocCount === 0 && `Upload ${readyCount} photo${readyCount === 1 ? "" : "s"}`}
                {readyCount > 0 && needsLocCount > 0 && `Upload ${readyCount} & set location for ${needsLocCount} more`}
                {readyCount === 0 && needsLocCount > 0 && `Set location for ${needsLocCount} photo${needsLocCount === 1 ? "" : "s"}`}
                {readyCount === 0 && needsLocCount === 0 && "Add photos"}
              </button>
            </>
          )}

          {phase === "uploading-ready" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                Uploading {entries.filter((e) => e.status === "uploading").length} of {readyCount + entries.filter((e) => e.status === "uploading").length}...
              </p>
              <ul className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                {entries.map((e) => (
                  <EntryRow key={e.id} entry={e} onRetry={() => retryEntry(e.id)} />
                ))}
              </ul>
            </div>
          )}

          {phase === "locating" && locatingEntry && (
            <LocatingStep
              entry={locatingEntry}
              remainingCount={needsLocCount}
              onSetLocation={setLocatingLocation}
              onConfirm={confirmLocating}
              onSkip={skipLocating}
              onOpenSearch={() => setPlaceSearchOpen(true)}
              fallbackBounds={bounds}
            />
          )}
        </div>
      </div>

      {placeSearchOpen && (
        <PlaceSearchModal
          isOpen
          onClose={() => setPlaceSearchOpen(false)}
          onSelect={(lat, lng) => {
            setLocatingLocation(lat, lng);
            setPlaceSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EntryRow({
  entry,
  onRemove,
  onRetry,
}: {
  entry: PhotoEntry;
  onRemove?: () => void;
  onRetry?: () => void;
}) {
  const statusLabel = {
    ready: { text: "Ready", className: "text-green-700 bg-green-50 border-green-200" },
    "needs-location": { text: "Needs location", className: "text-amber-700 bg-amber-50 border-amber-200" },
    uploading: { text: "Uploading…", className: "text-blue-700 bg-blue-50 border-blue-200" },
    done: { text: "Done", className: "text-gray-600 bg-gray-50 border-gray-200" },
    error: { text: "Failed", className: "text-red-700 bg-red-50 border-red-200" },
  }[entry.status];

  return (
    <li className="flex items-center gap-3 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={entry.preview} alt="" className="w-10 h-10 rounded object-cover border" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{entry.file.name}</p>
        {entry.errorMsg && <p className="text-xs text-red-600">{entry.errorMsg}</p>}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded border ${statusLabel.className}`}>
        {statusLabel.text}
      </span>
      {onRetry && entry.status === "error" && entry.location && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-600 hover:underline"
        >
          Retry
        </button>
      )}
      {onRemove && entry.status !== "uploading" && entry.status !== "done" && (
        <button onClick={onRemove} className="text-gray-400 hover:text-gray-600 text-sm" aria-label="Remove">
          &times;
        </button>
      )}
    </li>
  );
}

function LocatingStep({
  entry,
  remainingCount,
  onSetLocation,
  onConfirm,
  onSkip,
  onOpenSearch,
  fallbackBounds,
}: {
  entry: PhotoEntry;
  remainingCount: number;
  onSetLocation: (lat: number, lng: number) => void;
  onConfirm: () => void;
  onSkip: () => void;
  onOpenSearch: () => void;
  fallbackBounds: { west: number; south: number; east: number; north: number } | null;
}) {
  const initial =
    entry.location ??
    (fallbackBounds
      ? {
          lat: (fallbackBounds.north + fallbackBounds.south) / 2,
          lng: (fallbackBounds.east + fallbackBounds.west) / 2,
        }
      : { lat: 51.505, lng: -0.09 });
  const lat = entry.location?.lat ?? initial.lat;
  const lng = entry.location?.lng ?? initial.lng;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        {remainingCount} photo{remainingCount === 1 ? "" : "s"} need{remainingCount === 1 ? "s" : ""} a location.
      </p>

      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.preview} alt="" className="w-16 h-16 rounded object-cover border" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{entry.file.name}</p>
          <button onClick={onOpenSearch} className="text-xs text-blue-600 hover:underline">
            Search a place
          </button>
        </div>
      </div>

      <LocationPicker lat={lat} lng={lng} hasExif={false} onChange={onSetLocation} />

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={!entry.location}
          className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload & next
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
