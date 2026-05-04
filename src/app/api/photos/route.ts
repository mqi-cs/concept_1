import { NextRequest } from "next/server";
import { createPhoto } from "@/lib/db/photos";
import { createPhotoSchema } from "@/lib/validators/photo";
import { uploadPhoto } from "@/lib/storage";
import { checkUploadRateLimit } from "@/lib/rateLimit";
import { getAuthUser, jsonResponse, errorResponse } from "@/lib/api";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const allowed = await checkUploadRateLimit(user.id);
  if (!allowed) return errorResponse("Daily upload limit reached (20/day)", 429);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return errorResponse("No file provided");

  const metadataRaw = formData.get("metadata") as string | null;
  let metadata = {};
  if (metadataRaw) {
    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      return errorResponse("Invalid metadata JSON");
    }
  }

  const parsed = createPhotoSchema.safeParse(metadata);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const { url, thumbnailUrl } = await uploadPhoto(file, user.id);

  const photo = await createPhoto({
    url,
    thumbnailUrl,
    landmarkId: parsed.data.landmarkId,
    uploadedById: user.id,
    timeOfDay: parsed.data.timeOfDay,
    gearNotes: parsed.data.gearNotes,
    accessibilityNotes: parsed.data.accessibilityNotes,
    tags: parsed.data.tags,
  });

  return jsonResponse({ photo }, 201);
}
