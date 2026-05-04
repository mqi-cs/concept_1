import { prisma } from "@/lib/prisma";
import { BoundingBox } from "@/types";
import { Prisma } from "@prisma/client";

export async function getLandmarksInBBox(bbox: BoundingBox, limit = 200) {
  const landmarks = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      description: string | null;
      category: string;
      city: string | null;
      country: string | null;
      created_by_id: string;
      created_at: Date;
      latitude: number;
      longitude: number;
      photo_count: number;
    }>
  >`
    SELECT
      l.id, l.name, l.description, l.category, l.city, l.country,
      l.created_by_id, l.created_at,
      ST_Y(l.location::geometry) as latitude,
      ST_X(l.location::geometry) as longitude,
      (SELECT COUNT(*)::int FROM photos p WHERE p.landmark_id = l.id) as photo_count
    FROM landmarks l
    WHERE ST_Intersects(
      l.location,
      ST_MakeEnvelope(${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}, 4326)
    )
    LIMIT ${limit}
  `;

  return landmarks.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description,
    category: l.category,
    latitude: l.latitude,
    longitude: l.longitude,
    city: l.city,
    country: l.country,
    createdById: l.created_by_id,
    createdAt: l.created_at.toISOString(),
    photoCount: l.photo_count,
  }));
}

export async function getLandmarkById(id: string) {
  const landmark = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      description: string | null;
      category: string;
      city: string | null;
      country: string | null;
      created_by_id: string;
      created_at: Date;
      latitude: number;
      longitude: number;
      photo_count: number;
    }>
  >`
    SELECT
      l.id, l.name, l.description, l.category, l.city, l.country,
      l.created_by_id, l.created_at,
      ST_Y(l.location::geometry) as latitude,
      ST_X(l.location::geometry) as longitude,
      (SELECT COUNT(*)::int FROM photos p WHERE p.landmark_id = l.id) as photo_count
    FROM landmarks l
    WHERE l.id = ${id}
  `;

  if (!landmark.length) return null;

  const l = landmark[0];
  return {
    id: l.id,
    name: l.name,
    description: l.description,
    category: l.category,
    latitude: l.latitude,
    longitude: l.longitude,
    city: l.city,
    country: l.country,
    createdById: l.created_by_id,
    createdAt: l.created_at.toISOString(),
    photoCount: l.photo_count,
  };
}

export async function createLandmark(data: {
  name: string;
  description?: string;
  category: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  createdById: string;
}) {
  const result = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO landmarks (id, name, description, category, city, country, created_by_id, location, created_at)
    VALUES (
      gen_random_uuid(),
      ${data.name},
      ${data.description || null},
      ${data.category}::"LandmarkCategory",
      ${data.city || null},
      ${data.country || null},
      ${data.createdById},
      ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
      NOW()
    )
    RETURNING id
  `;

  return result[0].id;
}

export async function searchLandmarks(query: string, limit = 10) {
  return prisma.landmark.findMany({
    where: {
      name: { contains: query, mode: Prisma.QueryMode.insensitive },
    },
    take: limit,
    select: { id: true, name: true, city: true, country: true },
  });
}
