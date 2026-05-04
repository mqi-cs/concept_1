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

    return await Promise.all(
      photos.map(async (photo) => {
        const uploader = await ctx.db.get(photo.uploadedBy);
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
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Rate limit: 20 per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayPhotos = await ctx.db
      .query("photos")
      .withIndex("by_uploader_time", (q) => q.eq("uploadedBy", userId))
      .order("desc")
      .take(20);

    const todayCount = todayPhotos.filter(
      (p) => p._creationTime >= startOfDay.getTime()
    ).length;

    if (todayCount >= 20) throw new Error("Daily upload limit reached (20/day)");

    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    landmarkId: v.id("landmarks"),
    timeOfDay: v.optional(v.string()),
    gearNotes: v.optional(v.string()),
    accessibilityNotes: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Storage file not found");

    const photoId = await ctx.db.insert("photos", {
      url,
      storageId: args.storageId,
      landmarkId: args.landmarkId,
      uploadedBy: userId,
      timeOfDay: args.timeOfDay,
      gearNotes: args.gearNotes,
      accessibilityNotes: args.accessibilityNotes,
      tags: args.tags,
      loveCount: 0,
    });

    // Increment photo count on landmark
    const landmark = await ctx.db.get(args.landmarkId);
    if (landmark) {
      await ctx.db.patch(args.landmarkId, {
        photoCount: landmark.photoCount + 1,
      });
    }

    return photoId;
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

    // Decrement photo count
    const landmark = await ctx.db.get(photo.landmarkId);
    if (landmark) {
      await ctx.db.patch(photo.landmarkId, {
        photoCount: Math.max(0, landmark.photoCount - 1),
      });
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
