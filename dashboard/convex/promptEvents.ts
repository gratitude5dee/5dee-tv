import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

export const log = mutation({
  args: {
    sessionId: v.id('sessions'),
    kind: v.union(
      v.literal('configure'),
      v.literal('prompt'),
      v.literal('prompt_applied'),
      v.literal('error'),
    ),
    prompt: v.optional(v.string()),
    promptVersion: v.optional(v.number()),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    return await ctx.db.insert('promptEvents', { ...args, createdAt: Date.now() })
  },
})

export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    return await ctx.db
      .query('promptEvents')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .collect()
  },
})
