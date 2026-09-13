import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

/**
 * Create an editable, image-free storyboard draft. This is deliberately a
 * non-billable scaffold until the authenticated Terra screenplay provider is
 * configured; image generation remains an explicit per-shot action.
 */
export const generateDraft = mutation({
  args: {
    premise: v.string(),
    seriesId: v.optional(v.id('series')),
    duration: v.number(),
    shotCount: v.number(),
    includeDialogue: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const premise = args.premise.trim()
    if (!premise || premise.length > 12_000) throw new Error('Premise must be 1–12,000 characters')
    if (!Number.isFinite(args.duration) || args.duration < 5 || args.duration > 3_600) throw new Error('Duration must be between 5 and 3,600 seconds')
    const shotCount = Math.max(1, Math.min(16, Math.floor(args.shotCount || 8)))
    const duration = Math.max(1, Math.round(args.duration / shotCount))
    const now = Date.now()
    const jobId = await ctx.db.insert('storyboardJobs', { premise, seriesId: args.seriesId, duration: args.duration, shotCount, includeDialogue: args.includeDialogue, status: 'queued', provider: 'scaffold-awaiting-terra', createdAt: now, updatedAt: now })
    const boardId = await ctx.db.insert('shotboards', { title: premise.slice(0, 80) || 'Untitled storyboard', description: premise, seriesId: args.seriesId, revision: 1, createdAt: now, updatedAt: now })
    const sceneId = await ctx.db.insert('scenes', { boardId, sceneNumber: 1, title: 'Opening sequence', description: premise })
    for (let index = 0; index < shotCount; index += 1) {
      await ctx.db.insert('shots', {
        boardId,
        sceneId,
        shotNumber: index + 1,
        order: index + 1,
        shotType: index === 0 ? 'establishing' : 'medium',
        duration,
        promptIdea: `${premise} — beat ${index + 1} of ${shotCount}: develop the next visual moment.`,
        dialogue: args.includeDialogue ? `Beat ${index + 1}: advance the story. ` : undefined,
        imageStatus: 'pending',
      })
    }
    await ctx.db.patch(jobId, { boardId, status: 'completed', updatedAt: Date.now() })
    return jobId
  },
})

export const getJob = query({
  args: { jobId: v.id('storyboardJobs') },
  handler: async (ctx, { jobId }) => {
    if (!(await ctx.auth.getUserIdentity())) return null
    return await ctx.db.get(jobId)
  },
})

export const approveEpisode = mutation({
  args: {
    episodeId: v.id('episodes'),
    expectedRevision: v.number(),
    acceptedFacts: v.array(v.string()),
    draftText: v.optional(v.string()),
    shotPlan: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const episode = await ctx.db.get(args.episodeId)
    if (!episode) throw new Error('Episode not found')
    if (episode.revision !== args.expectedRevision) throw new Error('Episode changed; reload before approving')
    await ctx.db.patch(args.episodeId, { status: 'approved', revision: episode.revision + 1, acceptedFacts: args.acceptedFacts, draftText: args.draftText, shotPlan: args.shotPlan, updatedAt: Date.now() })
    return args.episodeId
  },
})

export const listEpisodes = query({
  args: { seriesId: v.id('series') },
  handler: async (ctx, { seriesId }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    return await ctx.db.query('episodes').withIndex('by_series', (q) => q.eq('seriesId', seriesId)).order('desc').take(100)
  },
})
