import { NextRequest } from "next/server";
import { getLandmarksInBBox, createLandmark, searchLandmarks } from "@/lib/db/landmarks";
import { bboxSchema, createLandmarkSchema } from "@/lib/validators/landmark";
import { getAuthUser, jsonResponse, errorResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Search mode
  const query = searchParams.get("q");
  if (query) {
    const results = await searchLandmarks(query);
    return jsonResponse({ landmarks: results });
  }

  // BBox mode
  const bboxParam = searchParams.get("bbox");
  if (!bboxParam) return errorResponse("Missing bbox parameter");

  const parts = bboxParam.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return errorResponse("Invalid bbox format. Expected: west,south,east,north");
  }

  const parsed = bboxSchema.safeParse({
    west: parts[0],
    south: parts[1],
    east: parts[2],
    north: parts[3],
  });

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const landmarks = await getLandmarksInBBox(parsed.data);
  return jsonResponse({ landmarks });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const parsed = createLandmarkSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const id = await createLandmark({
    ...parsed.data,
    createdById: user.id,
  });

  return jsonResponse({ id }, 201);
}
