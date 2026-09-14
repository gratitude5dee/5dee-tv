import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => { await requireIdentity(ctx); return await ctx.storage.generateUploadUrl() },
})

export const add = mutation({
  args: {
    name: v.string(),
    storageId: v.id('_storage'),
    coverStorageId: v.optional(v.id('_storage')),
    mimeType: v.string(),
    sizeBytes: v.number(),
  },
  returns: v.id('tracks'),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    return await ctx.db.insert('tracks', { ...args, createdAt: Date.now() })
  },
})

export const remove = mutation({
  args: { trackId: v.id('tracks') },
  returns: v.null(),
  handler: async (ctx, { trackId }) => {
    await requireIdentity(ctx)
    const track = await ctx.db.get(trackId)
    if (!track) return null
    await ctx.storage.delete(track.storageId)
    if (track.coverStorageId && track.coverStorageId !== track.storageId) await ctx.storage.delete(track.coverStorageId)
    await ctx.db.delete(trackId)
    return null
  },
})

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    const rows = await ctx.db.query('tracks').withIndex('by_createdAt').order('desc').take(100)
    return await Promise.all(
      rows.map(async (track) => ({
        ...track,
        url: await ctx.storage.getUrl(track.storageId),
        coverUrl: track.coverStorageId ? await ctx.storage.getUrl(track.coverStorageId) : null,
      })),
    )
  },
})
