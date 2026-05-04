"use client";

import { useCallback, useState } from "react";

interface PhotoDropzoneProps {
  onFileSelect: (file: File) => void;
  preview: string | null;
}

export default function PhotoDropzone({ onFileSelect, preview }: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      {preview ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">
            Drag & drop a photo or <span className="text-blue-600">browse</span>
          </p>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        id="photo-upload"
      />
      <label htmlFor="photo-upload" className="absolute inset-0 cursor-pointer" />
    </div>
  );
}
