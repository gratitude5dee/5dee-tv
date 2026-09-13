import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { sessionModel } from './schema'

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

const generationArgs = {
  generationId: v.number(),
  timestamp: v.number(),
  prompt: v.string(),
  negativePrompt: v.optional(v.string()),
  width: v.number(),
  height: v.number(),
  numFrames: v.number(),
  strength: v.optional(v.number()),
  guidanceScale: v.optional(v.number()),
  timesteps: v.optional(v.array(v.number())),
}

// Idempotent on (generationId, timestamp) so the dashboard can replay the metrics
// socket's generation_params_history on every tick without duplicating rows.
// Each new LTX generation also becomes a clip row (one segment of the livestream).
export const recordMany = mutation({
  args: {
    sessionId: v.optional(v.id('sessions')),
    model: v.optional(sessionModel),
    fps: v.optional(v.number()),
    generations: v.array(v.object(generationArgs)),
  },
  handler: async (ctx, { sessionId, model, fps, generations }) => {
    await requireIdentity(ctx)
    let inserted = 0
    for (const generation of generations) {
      const existing = await ctx.db
        .query('generations')
        .withIndex('by_generation', (q) =>
          q.eq('generationId', generation.generationId).eq('timestamp', generation.timestamp),
        )
        .first()
      if (existing) continue
      await ctx.db.insert('generations', { ...generation, sessionId, createdAt: Date.now() })
      await ctx.db.insert('clips', {
        sessionId,
        prompt: generation.prompt,
        chunkIndex: generation.generationId,
        durationSeconds: generation.numFrames / (fps ?? 24),
        source: model ?? 'ltxv1',
        createdAt: Math.round(generation.timestamp * 1000),
      })
      inserted++
    }
    return inserted
  },
})

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    return await ctx.db
      .query('generations')
      .withIndex('by_timestamp')
      .order('desc')
      .take(limit ?? 100)
  },
})
