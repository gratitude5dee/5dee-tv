import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => { if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required') }
export const list = query({ args: {}, handler: async (ctx) => { if (!(await ctx.auth.getUserIdentity())) return []; return await ctx.db.query('series').withIndex('by_updatedAt').order('desc').take(100) } })
export const create = mutation({ args: { name: v.string(), bible: v.optional(v.string()) }, handler: async (ctx, args) => { await requireIdentity(ctx); const now = Date.now(); return await ctx.db.insert('series', { ...args, canonVersion: 1, createdAt: now, updatedAt: now }) } })
export const patch = mutation({ args: { seriesId: v.id('series'), name: v.optional(v.string()), bible: v.optional(v.string()) }, handler: async (ctx, { seriesId, ...args }) => { await requireIdentity(ctx); const series = await ctx.db.get(seriesId); await ctx.db.patch(seriesId, { ...args, canonVersion: (series?.canonVersion ?? 0) + 1, updatedAt: Date.now() }) } })
