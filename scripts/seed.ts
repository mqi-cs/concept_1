import { PrismaClient } from "@prisma/client";
import landmarks from "./seed-data/landmarks.json";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a system user for seed data
  const systemUser = await prisma.user.upsert({
    where: { email: "system@geoshot.app" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000000",
      email: "system@geoshot.app",
      displayName: "GeoShot",
    },
  });

  console.log(`System user: ${systemUser.id}`);

  for (const landmark of landmarks) {
    // Insert landmark with PostGIS location
    await prisma.$queryRaw`
      INSERT INTO landmarks (id, name, description, category, city, country, created_by_id, location, created_at)
      VALUES (
        gen_random_uuid(),
        ${landmark.name},
        ${landmark.description},
        ${landmark.category}::"LandmarkCategory",
        ${landmark.city},
        ${landmark.country},
        ${systemUser.id},
        ST_SetSRID(ST_MakePoint(${landmark.longitude}, ${landmark.latitude}), 4326),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;
    console.log(`  + ${landmark.name}`);
  }

  console.log(`\nSeeded ${landmarks.length} landmarks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
