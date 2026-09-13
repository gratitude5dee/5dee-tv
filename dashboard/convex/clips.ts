import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { sessionModel } from './schema'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
})

export const create = mutation({
  args: {
    sessionId: v.optional(v.id('sessions')),
    storageId: v.optional(v.id('_storage')),
    url: v.optional(v.string()),
    prompt: v.string(),
    promptVersion: v.optional(v.number()),
    chunkIndex: v.number(),
    durationSeconds: v.number(),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    source: sessionModel,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('clips', { ...args, createdAt: Date.now() })
  },
})

/** Attaches captured segment media to an existing clip row (set when the
 * segment's rotated recorder is stopped and uploaded). */
export const attachMedia = mutation({
  args: {
    clipId: v.id('clips'),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    sizeBytes: v.number(),
    durationSeconds: v.number(),
  },
  handler: async (ctx, { clipId, ...media }) => {
    await ctx.db.patch(clipId, media)
  },
})

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query('clips')
      .withIndex('by_createdAt')
      .order('desc')
      .take(limit ?? 100)
    return await Promise.all(
      rows.map(async (clip) => ({
        ...clip,
        url: clip.url ?? (clip.storageId ? await ctx.storage.getUrl(clip.storageId) : null),
      })),
    )
  },
})

export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const rows = await ctx.db
      .query('clips')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect()
    return await Promise.all(
      rows.map(async (clip) => ({
        ...clip,
        url: clip.url ?? (clip.storageId ? await ctx.storage.getUrl(clip.storageId) : null),
      })),
    )
  },
})
