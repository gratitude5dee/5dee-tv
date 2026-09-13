import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
})

export const add = mutation({
  args: {
    name: v.string(),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    sizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('tracks', { ...args, createdAt: Date.now() })
  },
})

export const remove = mutation({
  args: { trackId: v.id('tracks') },
  handler: async (ctx, { trackId }) => {
    const track = await ctx.db.get(trackId)
    if (!track) return
    await ctx.storage.delete(track.storageId)
    await ctx.db.delete(trackId)
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('tracks').withIndex('by_createdAt').order('desc').take(100)
    return await Promise.all(
      rows.map(async (track) => ({
        ...track,
        url: await ctx.storage.getUrl(track.storageId),
      })),
    )
  },
})
