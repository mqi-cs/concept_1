import { NextRequest } from "next/server";
import { getLandmarkById } from "@/lib/db/landmarks";
import { getPhotosForLandmark } from "@/lib/db/photos";
import { getAuthUser, jsonResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const landmark = await getLandmarkById(id);
  if (!landmark) return errorResponse("Landmark not found", 404);

  const sort = request.nextUrl.searchParams.get("sort") === "recent" ? "recent" : "loved";
  const user = await getAuthUser();
  const photos = await getPhotosForLandmark(id, sort, 5, user?.id);

  return jsonResponse({ landmark, photos });
}
