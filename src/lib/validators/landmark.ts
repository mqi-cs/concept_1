import { z } from "zod";

export const createLandmarkSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum([
    "MONUMENT", "PARK", "MUSEUM", "BRIDGE",
    "BUILDING", "CHURCH", "SQUARE", "MARKET", "OTHER",
  ]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const bboxSchema = z.object({
  west: z.number().min(-180).max(180),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  north: z.number().min(-90).max(90),
});

export type CreateLandmarkInput = z.infer<typeof createLandmarkSchema>;
