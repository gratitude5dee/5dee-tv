import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const record = mutation({
  args: {
    channel: v.string(),
    viewerCount: v.number(),
    followerCount: v.optional(v.number()),
    isLive: v.boolean(),
    title: v.optional(v.string()),
    gameName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('twitchStats', { ...args, capturedAt: Date.now() })
  },
})

export const history = query({
  args: {
    channel: v.string(),
    sinceMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { channel, sinceMs, limit }) => {
    const since = sinceMs ?? Date.now() - 24 * 60 * 60 * 1000
    const rows = await ctx.db
      .query('twitchStats')
      .withIndex('by_channel', (q) => q.eq('channel', channel).gte('capturedAt', since))
      .order('desc')
      .take(limit ?? 24 * 60 * 2)
    return rows.reverse()
  },
})
