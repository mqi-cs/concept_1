import { NextRequest } from "next/server";
import { deletePhoto } from "@/lib/db/photos";
import { getAuthUser, jsonResponse, errorResponse } from "@/lib/api";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const deleted = await deletePhoto(id, user.id);
  if (!deleted) return errorResponse("Photo not found or not owned by you", 404);

  return jsonResponse({ ok: true });
}
