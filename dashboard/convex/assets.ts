import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const targetType = v.union(v.literal('character'), v.literal('location'))
const assetRole = v.union(
  v.literal('identity'),
  v.literal('wardrobe'),
  v.literal('style'),
  v.literal('environment'),
  v.literal('sheet'),
)
const locationKind = v.union(
  v.literal('landmark'),
  v.literal('neighborhood'),
  v.literal('coast'),
  v.literal('interior'),
  v.literal('other'),
)

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

const normalizeHandle = (value: string) => value.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '')

function assertHandle(value: string) {
  if (!/^[a-z0-9][a-z0-9_-]{1,62}$/.test(value)) {
    throw new Error('Handles must use 2–63 lowercase letters, numbers, hyphens, or underscores')
  }
}

async function assertCharacterHandleAvailable(ctx: any, handle: string, exceptId?: string) {
  const existing = await ctx.db.query('characters').withIndex('by_handle', (q: any) => q.eq('handle', handle)).unique()
  if (existing && existing._id !== exceptId) throw new Error(`@${handle} is already in use`)
}

async function assertLocationHandleAvailable(ctx: any, handle: string, exceptId?: string) {
  const existing = await ctx.db.query('locations').withIndex('by_handle', (q: any) => q.eq('handle', handle)).unique()
  if (existing && existing._id !== exceptId) throw new Error(`@${handle} is already in use`)
}

const uniqueIds = <T,>(values: T[]) => [...new Set(values)]

async function presentCharacter(ctx: any, character: any) {
  const ids = character.referenceStorageIds ?? []
  const referenceAssets = await Promise.all(ids.map(async (storageId: any) => ({ storageId, url: await ctx.storage.getUrl(storageId) })))
  const primaryUrl = character.primaryStorageId ? await ctx.storage.getUrl(character.primaryStorageId) : null
  return {
    ...character,
    imageUrl: primaryUrl ?? character.imageUrl,
    referenceUrls: referenceAssets.map((asset) => asset.url).filter((url: string | null): url is string => Boolean(url)),
    referenceAssets: referenceAssets.filter((asset): asset is { storageId: any; url: string } => Boolean(asset.url)),
  }
}

async function presentLocation(ctx: any, location: any) {
  const ids = location.referenceStorageIds ?? []
  const referenceAssets = await Promise.all(ids.map(async (storageId: any) => ({ storageId, url: await ctx.storage.getUrl(storageId) })))
  const primaryUrl = location.primaryStorageId ? await ctx.storage.getUrl(location.primaryStorageId) : null
  return {
    ...location,
    imageUrl: primaryUrl ?? location.imageUrl,
    referenceUrls: referenceAssets.map((asset) => asset.url).filter((url: string | null): url is string => Boolean(url)),
    referenceAssets: referenceAssets.filter((asset): asset is { storageId: any; url: string } => Boolean(asset.url)),
  }
}

const characterFields = {
  description: v.optional(v.string()),
  appearance: v.optional(v.string()),
  identityNotes: v.optional(v.string()),
  defaultWardrobe: v.optional(v.string()),
  voiceNotes: v.optional(v.string()),
  visualStyle: v.optional(v.string()),
  identityLocked: v.optional(v.boolean()),
  imageUrl: v.optional(v.string()),
  primaryStorageId: v.optional(v.id('_storage')),
  referenceStorageIds: v.optional(v.array(v.id('_storage'))),
}

const locationFields = {
  description: v.optional(v.string()),
  architecture: v.optional(v.string()),
  defaultTimeOfDay: v.optional(v.string()),
  defaultWeather: v.optional(v.string()),
  visualStyle: v.optional(v.string()),
  styleId: v.optional(v.id('styles')),
  imageUrl: v.optional(v.string()),
  primaryStorageId: v.optional(v.id('_storage')),
  referenceStorageIds: v.optional(v.array(v.id('_storage'))),
}

export const listCharacters = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    const rows = await ctx.db
      .query('characters')
      .withIndex('by_board_and_archivedAt', (q) => q.eq('boardId', undefined).eq('archivedAt', undefined))
      .order('desc')
      .take(100)
    return await Promise.all(rows.map((row) => presentCharacter(ctx, row)))
  },
})

export const getCharacter = query({
  args: { characterId: v.id('characters') },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { characterId }) => {
    if (!(await ctx.auth.getUserIdentity())) return null
    const character = await ctx.db.get(characterId)
    return character && !character.archivedAt ? await presentCharacter(ctx, character) : null
  },
})

export const createCharacter = mutation({
  args: {
    name: v.string(),
    handle: v.string(),
    ...characterFields,
  },
  returns: v.id('characters'),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const name = args.name.trim()
    const handle = normalizeHandle(args.handle)
    if (!name) throw new Error('A character name is required')
    assertHandle(handle)
    await assertCharacterHandleAvailable(ctx, handle)
    const now = Date.now()
    return await ctx.db.insert('characters', {
      ...args,
      name,
      handle,
      identityLocked: args.identityLocked ?? true,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const patchCharacter = mutation({
  args: {
    characterId: v.id('characters'),
    name: v.optional(v.string()),
    handle: v.optional(v.string()),
    ...characterFields,
  },
  returns: v.null(),
  handler: async (ctx, { characterId, name, handle, ...patch }) => {
    await requireIdentity(ctx)
    const character = await ctx.db.get(characterId)
    if (!character || character.archivedAt) throw new Error('Character not found')
    const next: Record<string, unknown> = { ...patch }
    if (name !== undefined) {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('A character name is required')
      next.name = trimmed
    }
    if (handle !== undefined) {
      const normalized = normalizeHandle(handle)
      assertHandle(normalized)
      await assertCharacterHandleAvailable(ctx, normalized, characterId)
      next.handle = normalized
    }
    if (patch.referenceStorageIds) next.referenceStorageIds = uniqueIds(patch.referenceStorageIds)
    await ctx.db.patch(characterId, { ...next, revision: (character.revision ?? 0) + 1, updatedAt: Date.now() })
    return null
  },
})

export const listLocations = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    const rows = await ctx.db
      .query('locations')
      .withIndex('by_archivedAt_and_updatedAt', (q) => q.eq('archivedAt', undefined))
      .order('desc')
      .take(100)
    return await Promise.all(rows.map((row) => presentLocation(ctx, row)))
  },
})

export const createLocation = mutation({
  args: {
    name: v.string(),
    handle: v.optional(v.string()),
    kind: locationKind,
    ...locationFields,
  },
  returns: v.id('locations'),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const name = args.name.trim()
    if (!name) throw new Error('A location name is required')
    const handle = args.handle?.trim() ? normalizeHandle(args.handle) : undefined
    if (handle) {
      assertHandle(handle)
      await assertLocationHandleAvailable(ctx, handle)
    }
    const now = Date.now()
    return await ctx.db.insert('locations', { ...args, name, handle, revision: 1, createdAt: now, updatedAt: now })
  },
})

export const patchLocation = mutation({
  args: {
    locationId: v.id('locations'),
    name: v.optional(v.string()),
    handle: v.optional(v.string()),
    kind: v.optional(locationKind),
    ...locationFields,
  },
  returns: v.null(),
  handler: async (ctx, { locationId, name, handle, ...patch }) => {
    await requireIdentity(ctx)
    const location = await ctx.db.get(locationId)
    if (!location || location.archivedAt) throw new Error('Location not found')
    const next: Record<string, unknown> = { ...patch }
    if (name !== undefined) {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('A location name is required')
      next.name = trimmed
    }
    if (handle !== undefined) {
      const normalized = normalizeHandle(handle)
      assertHandle(normalized)
      await assertLocationHandleAvailable(ctx, normalized, locationId)
      next.handle = normalized
    }
    if (patch.referenceStorageIds) next.referenceStorageIds = uniqueIds(patch.referenceStorageIds)
    await ctx.db.patch(locationId, { ...next, revision: (location.revision ?? 0) + 1, updatedAt: Date.now() })
    return null
  },
})

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const getStorageUrl = query({
  args: { storageId: v.id('_storage') },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, { storageId }) => {
    if (!(await ctx.auth.getUserIdentity())) return null
    return await ctx.storage.getUrl(storageId)
  },
})

export const recordUpload = mutation({
  args: {
    targetType,
    characterId: v.optional(v.id('characters')),
    locationId: v.optional(v.id('locations')),
    storageId: v.id('_storage'),
    role: assetRole,
    makePrimary: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = Date.now()
    if (args.targetType === 'character') {
      if (!args.characterId || args.locationId) throw new Error('A character target is required')
      const character = await ctx.db.get(args.characterId)
      if (!character || character.archivedAt) throw new Error('Character not found')
      const refs = uniqueIds([...(character.referenceStorageIds ?? []), args.storageId])
      await ctx.db.patch(character._id, {
        referenceStorageIds: refs,
        primaryStorageId: args.makePrimary || !character.primaryStorageId ? args.storageId : character.primaryStorageId,
        revision: (character.revision ?? 0) + 1,
        updatedAt: now,
      })
      await ctx.db.insert('assetVersions', { targetType: 'character', characterId: character._id, storageId: args.storageId, role: args.role, sourceRevision: character.revision, createdAt: now })
      return null
    }
    if (!args.locationId || args.characterId) throw new Error('A location target is required')
    const location = await ctx.db.get(args.locationId)
    if (!location || location.archivedAt) throw new Error('Location not found')
    const refs = uniqueIds([...(location.referenceStorageIds ?? []), args.storageId])
    await ctx.db.patch(location._id, {
      referenceStorageIds: refs,
      primaryStorageId: args.makePrimary || !location.primaryStorageId ? args.storageId : location.primaryStorageId,
      revision: (location.revision ?? 0) + 1,
      updatedAt: now,
    })
    await ctx.db.insert('assetVersions', { targetType: 'location', locationId: location._id, storageId: args.storageId, role: args.role, sourceRevision: location.revision, createdAt: now })
    return null
  },
})

/**
 * Remove an asset from an item's active reference manifest without deleting
 * the underlying file or its immutable history. If it was the hero image,
 * promote the next remaining reference instead.
 */
export const removeReference = mutation({
  args: {
    targetType,
    characterId: v.optional(v.id('characters')),
    locationId: v.optional(v.id('locations')),
    storageId: v.id('_storage'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = Date.now()
    if (args.targetType === 'character') {
      if (!args.characterId || args.locationId) throw new Error('A character target is required')
      const character = await ctx.db.get(args.characterId)
      if (!character || character.archivedAt) throw new Error('Character not found')
      const refs = (character.referenceStorageIds ?? []).filter((id) => id !== args.storageId)
      await ctx.db.patch(character._id, {
        referenceStorageIds: refs,
        primaryStorageId: character.primaryStorageId === args.storageId ? refs[0] : character.primaryStorageId,
        revision: (character.revision ?? 0) + 1,
        updatedAt: now,
      })
      return null
    }
    if (!args.locationId || args.characterId) throw new Error('A location target is required')
    const location = await ctx.db.get(args.locationId)
    if (!location || location.archivedAt) throw new Error('Location not found')
    const refs = (location.referenceStorageIds ?? []).filter((id) => id !== args.storageId)
    await ctx.db.patch(location._id, {
      referenceStorageIds: refs,
      primaryStorageId: location.primaryStorageId === args.storageId ? refs[0] : location.primaryStorageId,
      revision: (location.revision ?? 0) + 1,
      updatedAt: now,
    })
    return null
  },
})

export const listAssetHistory = query({
  args: { targetType, characterId: v.optional(v.id('characters')), locationId: v.optional(v.id('locations')) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    const rows = args.targetType === 'character'
      ? args.characterId
        ? await ctx.db.query('assetVersions').withIndex('by_characterId_and_createdAt', (q) => q.eq('characterId', args.characterId!)).order('desc').take(24)
        : []
      : args.locationId
        ? await ctx.db.query('assetVersions').withIndex('by_locationId_and_createdAt', (q) => q.eq('locationId', args.locationId!)).order('desc').take(24)
        : []
    return await Promise.all(rows.map(async (row) => ({ ...row, url: row.storageId ? await ctx.storage.getUrl(row.storageId) : row.externalUrl ?? null })))
  },
})

export const startGeneration = mutation({
  args: {
    targetType,
    characterId: v.optional(v.id('characters')),
    locationId: v.optional(v.id('locations')),
    requestId: v.string(),
    sourceRevision: v.number(),
    sourceHash: v.string(),
    modelId: v.string(),
    prompt: v.string(),
  },
  returns: v.object({ jobId: v.id('imageGenerationJobs'), status: v.union(v.literal('running'), v.literal('completed'), v.literal('failed')) }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    if (args.requestId.length < 8 || args.requestId.length > 128) throw new Error('Invalid generation request id')
    const existing = await ctx.db.query('imageGenerationJobs').withIndex('by_requestId', (q) => q.eq('requestId', args.requestId)).unique()
    if (existing) {
      if (existing.sourceHash !== args.sourceHash || existing.modelId !== args.modelId || existing.targetType !== args.targetType) throw new Error('This request id belongs to another generation')
      return { jobId: existing._id, status: existing.status as 'running' | 'completed' | 'failed' }
    }
    if (args.targetType === 'character') {
      if (!args.characterId || args.locationId) throw new Error('A character target is required')
      const character = await ctx.db.get(args.characterId)
      if (!character || character.archivedAt) throw new Error('Character not found')
      if ((character.revision ?? 0) !== args.sourceRevision) throw new Error('Character changed; review it before generating')
    } else {
      if (!args.locationId || args.characterId) throw new Error('A location target is required')
      const location = await ctx.db.get(args.locationId)
      if (!location || location.archivedAt) throw new Error('Location not found')
      if ((location.revision ?? 0) !== args.sourceRevision) throw new Error('Location changed; review it before generating')
    }
    const now = Date.now()
    const jobId = await ctx.db.insert('imageGenerationJobs', { ...args, status: 'running', createdAt: now, updatedAt: now })
    return { jobId, status: 'running' as const }
  },
})

export const completeGeneration = mutation({
  args: { jobId: v.id('imageGenerationJobs'), storageIds: v.array(v.id('_storage')) },
  returns: v.null(),
  handler: async (ctx, { jobId, storageIds }) => {
    await requireIdentity(ctx)
    const savedIds = uniqueIds(storageIds)
    if (!savedIds.length) throw new Error('At least one generated image is required')
    const job = await ctx.db.get(jobId)
    if (!job) throw new Error('Generation job not found')
    if (job.status === 'completed') return null
    const now = Date.now()
    if (job.targetType === 'character' && job.characterId) {
      const character = await ctx.db.get(job.characterId)
      if (!character || (character.revision ?? 0) !== job.sourceRevision) throw new Error('Character changed before this result could be saved')
      await ctx.db.patch(character._id, { primaryStorageId: savedIds[0], referenceStorageIds: uniqueIds([...(character.referenceStorageIds ?? []), ...savedIds]), revision: (character.revision ?? 0) + 1, updatedAt: now })
      await Promise.all(savedIds.map((storageId) => ctx.db.insert('assetVersions', { targetType: 'character', characterId: character._id, storageId, role: 'sheet', modelId: job.modelId, prompt: job.prompt, sourceRevision: job.sourceRevision, createdAt: now })))
    } else if (job.targetType === 'location' && job.locationId) {
      const location = await ctx.db.get(job.locationId)
      if (!location || (location.revision ?? 0) !== job.sourceRevision) throw new Error('Location changed before this result could be saved')
      await ctx.db.patch(location._id, { primaryStorageId: savedIds[0], referenceStorageIds: uniqueIds([...(location.referenceStorageIds ?? []), ...savedIds]), revision: (location.revision ?? 0) + 1, updatedAt: now })
      await Promise.all(savedIds.map((storageId) => ctx.db.insert('assetVersions', { targetType: 'location', locationId: location._id, storageId, role: 'sheet', modelId: job.modelId, prompt: job.prompt, sourceRevision: job.sourceRevision, createdAt: now })))
    } else {
      throw new Error('Generation target is invalid')
    }
    await ctx.db.patch(jobId, { status: 'completed', outputStorageId: savedIds[0], updatedAt: now })
    return null
  },
})

export const failGeneration = mutation({
  args: { jobId: v.id('imageGenerationJobs'), error: v.string() },
  returns: v.null(),
  handler: async (ctx, { jobId, error }) => {
    await requireIdentity(ctx)
    const job = await ctx.db.get(jobId)
    if (job && job.status === 'running') await ctx.db.patch(jobId, { status: 'failed', error: error.slice(0, 500), updatedAt: Date.now() })
    return null
  },
})

const STARTER_LOCATIONS = [
  ['ferry-building', 'Ferry Building', '@ferrybuilding', 'landmark', 'The waterfront market hall with its clock tower, arcades, ferries, and Bay light.'],
  ['mission-district', 'Mission District', '@mission', 'neighborhood', 'Murals, low-slung storefronts, colorful Victorian homes, taquerias, and sunny neighborhood streets.'],
  ['financial-district', 'Financial District', '@fidi', 'neighborhood', 'Downtown towers, granite plazas, cable-car corridors, and shifting fog across polished glass.'],
  ['north-beach', 'North Beach', '@northbeach', 'neighborhood', 'Italian cafés, bookshops, steep streets, neon signs, and Telegraph Hill at golden hour.'],
  ['palace-of-fine-arts', 'Palace of Fine Arts', '@palaceoffinearts', 'landmark', 'A monumental classical rotunda beside a quiet lagoon, colonnades, reeds, and soft Bay haze.'],
  ['chinatown', 'Chinatown', '@chinatown', 'neighborhood', 'Lantern-lit streets, ornate gateways, narrow alleys, painted signs, and dense storefront texture.'],
  ['dolores-park', 'Dolores Park', '@dolorespark', 'landmark', 'Sunlit lawn, palms, city skyline, Victorian rooftops, and relaxed public life.'],
  ['golden-gate-bridge', 'Golden Gate Bridge', '@goldengate', 'landmark', 'International-orange bridge towers through fog above the Pacific and Marin headlands.'],
  ['ocean-beach', 'Ocean Beach', '@oceanbeach', 'coast', 'Open Pacific surf, broad sand, wind-blown dune grass, low fog, and cool muted coastal light.'],
  ['sutro-baths', 'Sutro Baths', '@sutrobaths', 'landmark', 'Ruin-like seawater pools, dark rock, crashing surf, cliffs, and a weathered Pacific atmosphere.'],
] as const

export const seedStarterLibrary = mutation({
  args: {},
  returns: v.object({ locationsCreated: v.number(), coastCreated: v.boolean() }),
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const now = Date.now()
    let locationsCreated = 0
    for (const [starterKey, name, handleWithAt, kind, description] of STARTER_LOCATIONS) {
      const found = await ctx.db.query('locations').withIndex('by_starterKey', (q) => q.eq('starterKey', starterKey)).unique()
      if (found) continue
      const handle = normalizeHandle(handleWithAt)
      const usedHandle = await ctx.db.query('locations').withIndex('by_handle', (q) => q.eq('handle', handle)).unique()
      if (usedHandle) continue
      await ctx.db.insert('locations', { starterKey, name, handle, kind, description, revision: 1, createdAt: now, updatedAt: now })
      locationsCreated += 1
    }
    const coast = await ctx.db.query('characters').withIndex('by_handle', (q) => q.eq('handle', 'coast')).unique()
    if (!coast) {
      await ctx.db.insert('characters', {
        name: 'Coast',
        handle: 'coast',
        starterKey: 'coast',
        description: 'Add approved face-reference images before generating. Keep the face and overall look consistent; outfits are chosen per scene.',
        identityLocked: true,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      })
      return { locationsCreated, coastCreated: true }
    }
    return { locationsCreated, coastCreated: false }
  },
})
