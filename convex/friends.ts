import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

function canonicalPair(a: Id<"users">, b: Id<"users">) {
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
}

async function getFriendIds(ctx: QueryCtx, userId: Id<"users">): Promise<Set<Id<"users">>> {
  const ids = new Set<Id<"users">>();
  const asA = await ctx.db
    .query("friendships")
    .withIndex("by_userA_userB", (q) => q.eq("userA", userId))
    .take(1000);
  for (const f of asA) ids.add(f.userB);
  const asB = await ctx.db
    .query("friendships")
    .withIndex("by_userB", (q) => q.eq("userB", userId))
    .take(1000);
  for (const f of asB) ids.add(f.userA);
  return ids;
}

export { getFriendIds };

function publicUser(u: Doc<"users">) {
  return {
    _id: u._id,
    email: u.email,
    displayName: u.displayName ?? null,
  };
}

export const search = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const q = args.email.trim().toLowerCase();
    if (q.length < 3) return [];

    const matches = await ctx.db
      .query("users")
      .withIndex("by_email", (idx) => idx.gte("email", q).lt("email", q + "￿"))
      .take(10);

    const friendIds = await getFriendIds(ctx, userId);
    const incoming = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_from", (idx) => idx.eq("toUserId", userId))
      .take(1000);
    const incomingFrom = new Set(incoming.map((r) => r.fromUserId));
    const outgoing = await ctx.db
      .query("friendRequests")
      .withIndex("by_from", (idx) => idx.eq("fromUserId", userId))
      .take(1000);
    const outgoingTo = new Set(outgoing.map((r) => r.toUserId));

    return matches
      .filter((u) => u._id !== userId)
      .map((u) => ({
        ...publicUser(u),
        relation: friendIds.has(u._id)
          ? ("friend" as const)
          : outgoingTo.has(u._id)
            ? ("requested" as const)
            : incomingFrom.has(u._id)
              ? ("incoming" as const)
              : ("none" as const),
      }));
  },
});

export const listFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const friendIds = await getFriendIds(ctx, userId);
    const users = await Promise.all([...friendIds].map((id) => ctx.db.get(id)));
    return users.filter((u): u is Doc<"users"> => u !== null).map(publicUser);
  },
});

export const listIncoming = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_from", (idx) => idx.eq("toUserId", userId))
      .take(100);
    const users = await Promise.all(requests.map((r) => ctx.db.get(r.fromUserId)));
    return requests
      .map((r, i) => ({ requestId: r._id, user: users[i] }))
      .filter((x): x is { requestId: Id<"friendRequests">; user: Doc<"users"> } => x.user !== null)
      .map((x) => ({ requestId: x.requestId, ...publicUser(x.user) }));
  },
});

export const listOutgoing = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_from", (idx) => idx.eq("fromUserId", userId))
      .take(100);
    const users = await Promise.all(requests.map((r) => ctx.db.get(r.toUserId)));
    return requests
      .map((r, i) => ({ requestId: r._id, user: users[i] }))
      .filter((x): x is { requestId: Id<"friendRequests">; user: Doc<"users"> } => x.user !== null)
      .map((x) => ({ requestId: x.requestId, ...publicUser(x.user) }));
  },
});

export const sendRequest = mutation({
  args: { toUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    if (userId === args.toUserId) throw new Error("Cannot friend yourself");

    const target = await ctx.db.get(args.toUserId);
    if (!target) throw new Error("User not found");

    const pair = canonicalPair(userId, args.toUserId);
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_userA_userB", (q) => q.eq("userA", pair.userA).eq("userB", pair.userB))
      .unique();
    if (existingFriendship) throw new Error("Already friends");

    const existingOutgoing = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_from", (q) => q.eq("toUserId", args.toUserId).eq("fromUserId", userId))
      .unique();
    if (existingOutgoing) return;

    const reciprocal = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_from", (q) => q.eq("toUserId", userId).eq("fromUserId", args.toUserId))
      .unique();
    if (reciprocal) {
      await ctx.db.delete(reciprocal._id);
      await ctx.db.insert("friendships", pair);
      return;
    }

    await ctx.db.insert("friendRequests", {
      fromUserId: userId,
      toUserId: args.toUserId,
    });
  },
});

export const acceptRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const request = await ctx.db.get(args.requestId);
    if (!request || request.toUserId !== userId) throw new Error("Request not found");

    const pair = canonicalPair(request.fromUserId, request.toUserId);
    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_userA_userB", (q) => q.eq("userA", pair.userA).eq("userB", pair.userB))
      .unique();
    if (!existing) {
      await ctx.db.insert("friendships", pair);
    }
    await ctx.db.delete(request._id);
  },
});

export const declineRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    if (request.toUserId !== userId && request.fromUserId !== userId) {
      throw new Error("Not allowed");
    }
    await ctx.db.delete(request._id);
  },
});

export const removeFriend = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const pair = canonicalPair(userId, args.otherUserId);
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_userA_userB", (q) => q.eq("userA", pair.userA).eq("userB", pair.userB))
      .unique();
    if (friendship) await ctx.db.delete(friendship._id);
  },
});
