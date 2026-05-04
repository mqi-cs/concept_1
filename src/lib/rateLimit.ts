import { getUserPhotoCountToday } from "@/lib/db/photos";

const DAILY_UPLOAD_LIMIT = 20;

export async function checkUploadRateLimit(userId: string): Promise<boolean> {
  const count = await getUserPhotoCountToday(userId);
  return count < DAILY_UPLOAD_LIMIT;
}
