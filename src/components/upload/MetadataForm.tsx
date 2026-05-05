"use client";

import { useState } from "react";
import { TimeOfDay } from "@/types";

interface MetadataFormProps {
  onMetadataChange: (metadata: {
    timeOfDay?: string;
    gearNotes?: string;
    accessibilityNotes?: string;
    tags?: string[];
  }) => void;
}

export default function MetadataForm({ onMetadataChange }: MetadataFormProps) {
  const [timeOfDay, setTimeOfDay] = useState("");
  const [gearNotes, setGearNotes] = useState("");
  const [accessibilityNotes, setAccessibilityNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

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

  return (
    <div className="flex flex-col gap-3">
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
