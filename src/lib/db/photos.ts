import { prisma } from "@/lib/prisma";

export async function getPhotosForLandmark(
  landmarkId: string,
  sort: "loved" | "recent" = "loved",
  limit = 5,
  userId?: string
) {
  const photos = await prisma.photo.findMany({
    where: { landmarkId },
    orderBy: sort === "loved" ? { loveCount: "desc" } : { createdAt: "desc" },
    take: limit,
    include: {
      uploadedBy: { select: { displayName: true } },
      reactions: userId ? { where: { userId }, take: 1 } : false,
    },
  });

  return photos.map((p) => ({
    id: p.id,
    url: p.url,
    thumbnailUrl: p.thumbnailUrl,
    landmarkId: p.landmarkId,
    uploadedById: p.uploadedById,
    uploaderName: p.uploadedBy.displayName,
    timeOfDay: p.timeOfDay,
    gearNotes: p.gearNotes,
    accessibilityNotes: p.accessibilityNotes,
    tags: p.tags,
    loveCount: p.loveCount,
    lovedByUser: userId ? (p.reactions as Array<unknown>).length > 0 : false,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function createPhoto(data: {
  url: string;
  thumbnailUrl: string;
  landmarkId: string;
  uploadedById: string;
  timeOfDay?: string;
  gearNotes?: string;
  accessibilityNotes?: string;
  tags?: string[];
}) {
  return prisma.photo.create({
    data: {
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      landmarkId: data.landmarkId,
      uploadedById: data.uploadedById,
      timeOfDay: data.timeOfDay as never,
      gearNotes: data.gearNotes,
      accessibilityNotes: data.accessibilityNotes,
      tags: data.tags || [],
    },
  });
}

export async function deletePhoto(id: string, userId: string) {
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || photo.uploadedById !== userId) return false;
  await prisma.photo.delete({ where: { id } });
  return true;
}

export async function getUserPhotoCountToday(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return prisma.photo.count({
    where: {
      uploadedById: userId,
      createdAt: { gte: startOfDay },
    },
  });
}

export async function addReaction(photoId: string, userId: string) {
  await prisma.$transaction([
    prisma.reaction.create({ data: { photoId, userId } }),
    prisma.photo.update({
      where: { id: photoId },
      data: { loveCount: { increment: 1 } },
    }),
  ]);
}

export async function removeReaction(photoId: string, userId: string) {
  const reaction = await prisma.reaction.findUnique({
    where: { photoId_userId: { photoId, userId } },
  });
  if (!reaction) return false;

  await prisma.$transaction([
    prisma.reaction.delete({ where: { id: reaction.id } }),
    prisma.photo.update({
      where: { id: photoId },
      data: { loveCount: { decrement: 1 } },
    }),
  ]);
  return true;
}
