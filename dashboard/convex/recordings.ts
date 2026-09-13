import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { sessionModel } from './schema'

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => { await requireIdentity(ctx); return ctx.storage.generateUploadUrl() },
})

/** Deletes an uploaded storage object that never got a recording row. */
export const deleteStorage = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    await requireIdentity(ctx)
    await ctx.storage.delete(storageId)
  },
})

export const create = mutation({
  args: {
    sessionId: v.optional(v.id('sessions')),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    sizeBytes: v.number(),
    durationSeconds: v.number(),
    model: sessionModel,
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    return await ctx.db.insert('recordings', { ...args, createdAt: Date.now() })
  },
})

export const remove = mutation({
  args: { recordingId: v.id('recordings') },
  handler: async (ctx, { recordingId }) => {
    await requireIdentity(ctx)
    const recording = await ctx.db.get(recordingId)
    if (!recording) return
    await ctx.storage.delete(recording.storageId)
    await ctx.db.delete(recordingId)
  },
})

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    const rows = await ctx.db
      .query('recordings')
      .withIndex('by_createdAt')
      .order('desc')
      .take(limit ?? 100)
    return await Promise.all(
      rows.map(async (recording) => ({
        ...recording,
        url: await ctx.storage.getUrl(recording.storageId),
      })),
    )
  },
})
