"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
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

function UploadButton({ onClick, enabled }: { onClick: () => void; enabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      title={enabled ? undefined : "Sign in to upload"}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
    >
      + Upload
    </button>
  );
}

export default function Home() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { selectedPhotoId, selectPhoto } = useMapStore();

  return (
    <div className="h-full relative">
      <MapView />

      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
        <h1 className="text-xl font-bold text-gray-800 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow pointer-events-auto">
          GeoShot
        </h1>
        <div className="flex items-center gap-2 pointer-events-auto">
          <AuthLoading>
            <UploadButton onClick={() => {}} enabled={false} />
          </AuthLoading>
          <Authenticated>
            <UploadButton onClick={() => setUploadOpen(true)} enabled />
          </Authenticated>
          <Unauthenticated>
            <UploadButton onClick={() => {}} enabled={false} />
          </Unauthenticated>
          <UserMenu />
        </div>
      </div>

      <LandmarkPanel />

      <Authenticated>
        <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
      </Authenticated>

      <PhotoLightbox photoId={selectedPhotoId} onClose={() => selectPhoto(null)} />
    </div>
  );
}
