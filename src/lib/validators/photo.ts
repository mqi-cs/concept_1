import { z } from "zod";

export const createPhotoSchema = z.object({
  landmarkId: z.string().uuid(),
  timeOfDay: z.enum([
    "GOLDEN_HOUR", "BLUE_HOUR", "MIDDAY", "NIGHT", "SUNRISE", "SUNSET",
  ]).optional(),
  gearNotes: z.string().max(500).optional(),
  accessibilityNotes: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreatePhotoInput = z.infer<typeof createPhotoSchema>;
