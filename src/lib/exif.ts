import exifr from "exifr";

export interface PhotoLocation {
  lat: number;
  lng: number;
}

export async function extractPhotoLocation(file: File): Promise<PhotoLocation | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") {
      return null;
    }
    return { lat: gps.latitude, lng: gps.longitude };
  } catch {
    return null;
  }
}
