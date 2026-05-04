import { getAuthUser, jsonResponse, errorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return errorResponse("Unauthorized", 401);

  // Upsert user row
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email!,
      displayName: user.user_metadata?.display_name || null,
    },
    create: {
      id: user.id,
      email: user.email!,
      displayName: user.user_metadata?.display_name || null,
    },
  });

  return jsonResponse({ ok: true });
}
