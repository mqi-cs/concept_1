import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getInBBox = query({
  args: {
    west: v.number(),
    south: v.number(),
    east: v.number(),
    north: v.number(),
  },
  handler: async (ctx, args) => {
    const landmarks = await ctx.db.query("landmarks").collect();
    return landmarks.filter(
      (l) =>
        l.latitude >= args.south &&
        l.latitude <= args.north &&
        l.longitude >= args.west &&
        l.longitude <= args.east
    ).slice(0, 200);
  },
});

export const getById = query({
  args: { id: v.id("landmarks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query) return [];
    const results = await ctx.db
      .query("landmarks")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(10);
    return results.map((l) => ({
      _id: l._id,
      name: l.name,
      city: l.city,
      country: l.country,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("landmarks", {
      ...args,
      createdBy: userId,
      photoCount: 0,
    });
  },
});
