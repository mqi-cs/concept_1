import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getForLandmark = query({
  args: {
    landmarkId: v.id("landmarks"),
    sort: v.union(v.literal("loved"), v.literal("recent")),
  },
  handler: async (ctx, args) => {
    let photos;
    if (args.sort === "loved") {
      photos = await ctx.db
        .query("photos")
        .withIndex("by_landmark_loves", (q) => q.eq("landmarkId", args.landmarkId))
        .order("desc")
        .take(5);
    } else {
      photos = await ctx.db
        .query("photos")
        .withIndex("by_landmark_time", (q) => q.eq("landmarkId", args.landmarkId))
        .order("desc")
        .take(5);
    }

    const userId = await getAuthUserId(ctx);

    const resolved = await Promise.all(
      photos.map(async (photo) => {
        const uploader = photo.uploadedBy ? await ctx.db.get(photo.uploadedBy) : null;
        let lovedByUser = false;
        if (userId) {
          const reaction = await ctx.db
            .query("reactions")
            .withIndex("by_photo_user", (q) =>
              q.eq("photoId", photo._id).eq("userId", userId)
            )
            .first();
          lovedByUser = !!reaction;
        }
        return {
          ...photo,
          url: await ctx.storage.getUrl(photo.storageId),
          uploaderName: uploader?.displayName ?? null,
          lovedByUser,
        };
      })
    );

    return resolved.filter((p): p is typeof p & { url: string } => p.url !== null);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to upload");
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    latitude: v.number(),
    longitude: v.number(),
    landmarkId: v.optional(v.id("landmarks")),
    timeOfDay: v.optional(v.string()),
    gearNotes: v.optional(v.string()),
    accessibilityNotes: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to upload");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Storage file not found");

    const photoId = await ctx.db.insert("photos", {
      url,
      storageId: args.storageId,
      latitude: args.latitude,
      longitude: args.longitude,
      landmarkId: args.landmarkId,
      uploadedBy: userId,
      timeOfDay: args.timeOfDay,
      gearNotes: args.gearNotes,
      accessibilityNotes: args.accessibilityNotes,
      tags: args.tags,
      loveCount: 0,
    });

    if (args.landmarkId) {
      const landmark = await ctx.db.get(args.landmarkId);
      if (landmark) {
        await ctx.db.patch(args.landmarkId, {
          photoCount: landmark.photoCount + 1,
        });
      }
    }

    return photoId;
  },
});

export const getById = query({
  args: { id: v.id("photos") },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.id);
    if (!photo) return null;

    const url = await ctx.storage.getUrl(photo.storageId);
    if (!url) return null;

    const userId = await getAuthUserId(ctx);
    const uploader = photo.uploadedBy ? await ctx.db.get(photo.uploadedBy) : null;
    let lovedByUser = false;
    if (userId) {
      const reaction = await ctx.db
        .query("reactions")
        .withIndex("by_photo_user", (q) =>
          q.eq("photoId", photo._id).eq("userId", userId)
        )
        .first();
      lovedByUser = !!reaction;
    }

    return {
      ...photo,
      url,
      uploaderName: uploader?.displayName ?? null,
      lovedByUser,
      isOwn: !!userId && photo.uploadedBy === userId,
    };
  },
});

export const getInBBox = query({
  args: {
    west: v.number(),
    south: v.number(),
    east: v.number(),
    north: v.number(),
  },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_location", (q) =>
        q.gte("latitude", args.south).lte("latitude", args.north)
      )
      .take(500);

    const filtered = photos
      .filter((p) => p.longitude >= args.west && p.longitude <= args.east)
      .slice(0, 200);

    const withUrls = await Promise.all(
      filtered.map(async (p) => ({
        _id: p._id,
        latitude: p.latitude,
        longitude: p.longitude,
        url: await ctx.storage.getUrl(p.storageId),
        loveCount: p.loveCount,
        landmarkId: p.landmarkId,
      }))
    );

    return withUrls.filter((p): p is typeof p & { url: string } => p.url !== null);
  },
});

export const remove = mutation({
  args: { id: v.id("photos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const photo = await ctx.db.get(args.id);
    if (!photo || photo.uploadedBy !== userId) {
      throw new Error("Photo not found or not owned by you");
    }

    // Delete storage file
    await ctx.storage.delete(photo.storageId);

    // Delete reactions
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_photo_user", (q) => q.eq("photoId", args.id))
      .collect();
    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    if (photo.landmarkId) {
      const landmark = await ctx.db.get(photo.landmarkId);
      if (landmark) {
        await ctx.db.patch(photo.landmarkId, {
          photoCount: Math.max(0, landmark.photoCount - 1),
        });
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const love = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_photo_user", (q) =>
        q.eq("photoId", args.photoId).eq("userId", userId)
      )
      .first();

    if (existing) throw new Error("Already loved");

    await ctx.db.insert("reactions", {
      photoId: args.photoId,
      userId,
    });

    const photo = await ctx.db.get(args.photoId);
    if (photo) {
      await ctx.db.patch(args.photoId, { loveCount: photo.loveCount + 1 });
    }
  },
});

export const unlove = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const reaction = await ctx.db
      .query("reactions")
      .withIndex("by_photo_user", (q) =>
        q.eq("photoId", args.photoId).eq("userId", userId)
      )
      .first();

    if (!reaction) throw new Error("Reaction not found");

    await ctx.db.delete(reaction._id);

    const photo = await ctx.db.get(args.photoId);
    if (photo) {
      await ctx.db.patch(args.photoId, {
        loveCount: Math.max(0, photo.loveCount - 1),
      });
    }
  },
});
