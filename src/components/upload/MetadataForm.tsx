"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TimeOfDay } from "@/types";

interface MetadataFormProps {
  onLandmarkChange: (id: string) => void;
  onMetadataChange: (metadata: {
    timeOfDay?: string;
    gearNotes?: string;
    accessibilityNotes?: string;
    tags?: string[];
  }) => void;
}

interface LandmarkOption {
  _id: string;
  name: string;
  city?: string | null;
  country?: string | null;
}

export default function MetadataForm({ onLandmarkChange, onMetadataChange }: MetadataFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkOption | null>(null);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [gearNotes, setGearNotes] = useState("");
  const [accessibilityNotes, setAccessibilityNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const searchResults = useQuery(
    api.landmarks.search,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

  function notifyMetadata(updates: Partial<{ timeOfDay: string; gearNotes: string; accessibilityNotes: string; tagsInput: string }>) {
    const tod = updates.timeOfDay ?? timeOfDay;
    const gear = updates.gearNotes ?? gearNotes;
    const acc = updates.accessibilityNotes ?? accessibilityNotes;
    const ti = updates.tagsInput ?? tagsInput;
    const tags = ti.split(",").map((t) => t.trim()).filter(Boolean);
    onMetadataChange({
      timeOfDay: tod || undefined,
      gearNotes: gear || undefined,
      accessibilityNotes: acc || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  }

  function selectResult(result: LandmarkOption) {
    setSelectedLandmark(result);
    onLandmarkChange(result._id);
    setSearchQuery("");
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Landmark search */}
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 block mb-1">Landmark</label>
        {selectedLandmark ? (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="text-sm">{selectedLandmark.name}</span>
            <button
              onClick={() => { setSelectedLandmark(null); onLandmarkChange(""); }}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Search landmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                {searchResults.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => selectResult(r)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span className="font-medium">{r.name}</span>
                    {(r.city || r.country) && (
                      <span className="text-gray-400 ml-2">
                        {[r.city, r.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Time of day */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Time of Day</label>
        <select
          value={timeOfDay}
          onChange={(e) => { setTimeOfDay(e.target.value); notifyMetadata({ timeOfDay: e.target.value }); }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select...</option>
          {Object.values(TimeOfDay).map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Gear notes */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Gear Notes</label>
        <input
          type="text"
          placeholder="e.g. Canon R5, 24-70mm f/2.8"
          value={gearNotes}
          onChange={(e) => { setGearNotes(e.target.value); notifyMetadata({ gearNotes: e.target.value }); }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Accessibility */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Accessibility Notes</label>
        <input
          type="text"
          placeholder="e.g. Wheelchair accessible, easy path"
          value={accessibilityNotes}
          onChange={(e) => { setAccessibilityNotes(e.target.value); notifyMetadata({ accessibilityNotes: e.target.value }); }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          placeholder="e.g. sunset, panorama, long-exposure"
          value={tagsInput}
          onChange={(e) => { setTagsInput(e.target.value); notifyMetadata({ tagsInput: e.target.value }); }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
