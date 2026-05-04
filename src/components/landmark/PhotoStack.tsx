"use client";

import Image from "next/image";
import LoveButton from "@/components/photo/LoveButton";
import type { Photo } from "@/types";

interface PhotoStackProps {
  photos: Photo[];
}

export default function PhotoStack({ photos }: PhotoStackProps) {
  if (photos.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-8 text-center">
        No photos yet. Be the first to share!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="relative rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={photo.thumbnailUrl || photo.url}
            alt={`Photo at landmark`}
            width={400}
            height={300}
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-xs">
                {photo.uploaderName || "Anonymous"}
                {photo.timeOfDay && (
                  <span className="ml-2 opacity-75">
                    {photo.timeOfDay.replace("_", " ").toLowerCase()}
                  </span>
                )}
              </span>
              <LoveButton
                photoId={photo.id}
                initialLoved={photo.lovedByUser}
                initialCount={photo.loveCount}
              />
            </div>
          </div>
          {photo.tags.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/80 backdrop-blur text-xs px-2 py-0.5 rounded-full text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
