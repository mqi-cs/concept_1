import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_email", ["email"]),

  landmarks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    createdBy: v.id("users"),
    photoCount: v.number(),
  })
    .index("by_location", ["latitude", "longitude"])
    .searchIndex("search_name", { searchField: "name" }),

  photos: defineTable({
    url: v.string(),
    storageId: v.id("_storage"),
    landmarkId: v.optional(v.id("landmarks")),
    latitude: v.number(),
    longitude: v.number(),
    uploadedBy: v.id("users"),
    timeOfDay: v.optional(v.string()),
    gearNotes: v.optional(v.string()),
    accessibilityNotes: v.optional(v.string()),
    tags: v.array(v.string()),
    loveCount: v.number(),
  })
    .index("by_landmark_loves", ["landmarkId", "loveCount"])
    .index("by_landmark_time", ["landmarkId"])
    .index("by_uploader_time", ["uploadedBy"])
    .index("by_location", ["latitude", "longitude"]),

  reactions: defineTable({
    photoId: v.id("photos"),
    userId: v.id("users"),
  })
    .index("by_photo_user", ["photoId", "userId"])
    .index("by_user", ["userId"]),
});
