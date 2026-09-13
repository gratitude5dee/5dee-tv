import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { sessionModel, sessionStatus } from './schema'

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

export const create = mutation({
  args: {
    model: sessionModel,
    outputMode: v.union(v.literal('webrtc'), v.literal('rtmp')),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    return await ctx.db.insert('sessions', {
      ...args,
      status: 'opening',
      startedAt: Date.now(),
    })
  },
})

export const setStatus = mutation({
  args: {
    sessionId: v.id('sessions'),
    status: sessionStatus,
    error: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, status, error }) => {
    await requireIdentity(ctx)
    const session = await ctx.db.get(sessionId)
    if (!session) return
    const ended = status === 'ended' || status === 'failed'
    await ctx.db.patch(sessionId, {
      status,
      error,
      endedAt: ended ? session.endedAt ?? Date.now() : session.endedAt,
    })
  },
})

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    return await ctx.db
      .query('sessions')
      .withIndex('by_startedAt')
      .order('desc')
      .take(limit ?? 50)
  },
})

export const get = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => { if (!(await ctx.auth.getUserIdentity())) return null; return ctx.db.get(sessionId) },
})
