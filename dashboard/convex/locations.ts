import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const fields = {
  description: v.optional(v.string()), handle: v.optional(v.string()), kind: v.optional(v.union(v.literal('landmark'), v.literal('neighborhood'), v.literal('coast'), v.literal('interior'), v.literal('other'))),
  architecture: v.optional(v.string()), defaultTimeOfDay: v.optional(v.string()), defaultWeather: v.optional(v.string()), visualStyle: v.optional(v.string()),
  styleId: v.optional(v.id('styles')), imageUrl: v.optional(v.string()), primaryStorageId: v.optional(v.id('_storage')),
  referenceStorageIds: v.optional(v.array(v.id('_storage'))), archivedAt: v.optional(v.number()),
}
const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

export const list = query({ args: {}, handler: async (ctx) => {
  if (!(await ctx.auth.getUserIdentity())) return []
  const rows = await ctx.db.query('locations').withIndex('by_archivedAt_and_updatedAt', (q) => q.eq('archivedAt', undefined)).order('desc').take(100)
  return await Promise.all(rows.map(async (location) => ({
    ...location,
    imageUrl: location.primaryStorageId ? await ctx.storage.getUrl(location.primaryStorageId) : location.imageUrl,
  })))
} })
export const create = mutation({ args: { name: v.string(), ...fields }, handler: async (ctx, { name, ...rest }) => { await requireIdentity(ctx); const now = Date.now(); return await ctx.db.insert('locations', { name: name.trim(), ...rest, createdAt: now, updatedAt: now }) } })
export const patch = mutation({ args: { locationId: v.id('locations'), name: v.optional(v.string()), ...fields }, handler: async (ctx, { locationId, ...rest }) => { await requireIdentity(ctx); await ctx.db.patch(locationId, { ...rest, updatedAt: Date.now() }) } })
export const remove = mutation({ args: { locationId: v.id('locations') }, handler: async (ctx, { locationId }) => { await requireIdentity(ctx); await ctx.db.patch(locationId, { archivedAt: Date.now(), updatedAt: Date.now() }) } })
