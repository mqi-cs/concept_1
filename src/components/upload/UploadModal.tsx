"use client";

import { useState, useCallback } from "react";
import PhotoDropzone from "./PhotoDropzone";
import MetadataForm from "./MetadataForm";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLandmarkId?: string;
}

export default function UploadModal({ isOpen, onClose, defaultLandmarkId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [landmarkId, setLandmarkId] = useState(defaultLandmarkId || "");
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleMetadataChange = useCallback((m: Record<string, unknown>) => {
    setMetadata(m);
  }, []);

  async function handleUpload() {
    if (!file || !landmarkId) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify({ ...metadata, landmarkId }));

      const res = await fetch("/api/photos", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      onClose();
      // Reset
      setFile(null);
      setPreview(null);
      setLandmarkId(defaultLandmarkId || "");
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

            <MetadataForm
              onLandmarkChange={setLandmarkId}
              onMetadataChange={handleMetadataChange}
            />

            <button
              onClick={handleUpload}
              disabled={!file || !landmarkId || uploading}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
