import { NextRequest } from "next/server";
import { addReaction, removeReaction } from "@/lib/db/photos";
import { getAuthUser, jsonResponse, errorResponse } from "@/lib/api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    await addReaction(id, user.id);
  } catch {
    return errorResponse("Already loved this photo", 409);
  }

  return jsonResponse({ loved: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const removed = await removeReaction(id, user.id);
  if (!removed) return errorResponse("Reaction not found", 404);

  return jsonResponse({ loved: false });
}
