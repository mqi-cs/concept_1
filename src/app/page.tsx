"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import UserMenu from "@/components/UserMenu";
import LandmarkPanel from "@/components/landmark/LandmarkPanel";
import UploadModal from "@/components/upload/UploadModal";
import PhotoLightbox from "@/components/photo/PhotoLightbox";
import { useMapStore } from "@/stores/mapStore";

const MapView = dynamic(() => import("@/components/map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="animate-pulse text-gray-400">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { selectedPhotoId, selectPhoto } = useMapStore();
  const user = useQuery(api.users.current);
  const signedIn = !!user;

  return (
    <div className="h-full relative">
      <MapView />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
        <h1 className="text-xl font-bold text-gray-800 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow pointer-events-auto">
          GeoShot
        </h1>
        <div className="flex items-center gap-2 pointer-events-auto">
          {user !== undefined && (
            signedIn ? (
              <button
                onClick={() => setUploadOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition-colors"
              >
                + Upload
              </button>
            ) : (
              <a
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition-colors"
              >
                Sign up to upload
              </a>
            )
          )}
          <UserMenu />
        </div>
      </div>

      {/* Landmark detail panel */}
      <LandmarkPanel />

      {/* Upload modal */}
      {signedIn && (
        <UploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
        />
      )}

      <PhotoLightbox
        photoId={selectedPhotoId}
        onClose={() => selectPhoto(null)}
      />
    </div>
  );
}
