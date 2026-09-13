import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

async function touchBoard(ctx: { db: any }, boardId: any, increment = true) {
  const board = await ctx.db.get(boardId)
  if (board) await ctx.db.patch(boardId, { revision: increment ? (board.revision ?? 0) + 1 : (board.revision ?? 0), updatedAt: Date.now() })
}

// Editable scene fields; sceneNumber lives in scenePatchFields since it is also
// a required create arg (duplicate keys would weaken the validator).
const sceneFields = {
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  timeOfDay: v.optional(v.string()),
  weather: v.optional(v.string()),
  atmosphere: v.optional(v.string()),
  elements: v.optional(v.array(v.string())),
  cameraEnvironment: v.optional(v.string()),
  keyframeUrl: v.optional(v.string()),
  locationId: v.optional(v.id('locations')),
}

const shotFields = {
  shotType: v.optional(v.string()),
  duration: v.optional(v.number()),
  promptIdea: v.optional(v.string()),
  visualPrompt: v.optional(v.string()),
  dialogue: v.optional(v.string()),
  soundEffects: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  imageStatus: v.optional(v.string()),
  imageModel: v.optional(v.string()),
  audioUrl: v.optional(v.string()),
  characterIds: v.optional(v.array(v.id('characters'))),
  order: v.optional(v.number()),
  expandedPrompt: v.optional(v.string()),
  expandedPromptHash: v.optional(v.string()),
  expandedPromptRevision: v.optional(v.number()),
  directorPrompt: v.optional(v.string()),
  directorPromptHash: v.optional(v.string()),
  directorPromptRevision: v.optional(v.number()),
}

const characterFields = {
  handle: v.optional(v.string()),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  traits: v.optional(v.any()),
  referenceStorageIds: v.optional(v.array(v.id('_storage'))),
  archivedAt: v.optional(v.number()),
}

// ---------------------------------------------------------------- boards

export const list = query({
  args: {},
  handler: async (ctx) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    return await ctx.db.query('shotboards').withIndex('by_createdAt').order('desc').take(50)
  },
})

export const get = query({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) => {
    if (!(await ctx.auth.getUserIdentity())) return null
    return await ctx.db.get(boardId)
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
    styleId: v.optional(v.id('styles')),
    seriesId: v.optional(v.id('series')),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const now = Date.now()
    return await ctx.db.insert('shotboards', { ...args, revision: 1, createdAt: now, updatedAt: now })
  },
})

export const patch = mutation({
  args: {
    boardId: v.id('shotboards'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
    styleId: v.optional(v.id('styles')),
    seriesId: v.optional(v.id('series')),
    soundtrackTrackId: v.optional(v.id('tracks')),
    soundtrackOffsetSeconds: v.optional(v.number()),
    soundtrackVolume: v.optional(v.number()),
    soundtrackLoop: v.optional(v.boolean()),
  },
  handler: async (ctx, { boardId, ...updates }) => {
    await requireIdentity(ctx)
    const board = await ctx.db.get(boardId)
    await ctx.db.patch(boardId, { ...updates, revision: (board?.revision ?? 0) + 1, updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) => {
    await requireIdentity(ctx)
    const scenes = await ctx.db
      .query('scenes')
      .withIndex('by_board', (q) => q.eq('boardId', boardId))
      .collect()
    const shots = await ctx.db
      .query('shots')
      .withIndex('by_board', (q) => q.eq('boardId', boardId))
      .collect()
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_board', (q) => q.eq('boardId', boardId))
      .collect()
    for (const row of shots) await ctx.db.delete(row._id)
    for (const row of scenes) await ctx.db.delete(row._id)
    for (const row of characters) await ctx.db.delete(row._id)
    await ctx.db.delete(boardId)
  },
})

/** Whole board in one round-trip for the editor/compiler. */
export const load = query({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) => {
    if (!(await ctx.auth.getUserIdentity())) return { board: null, scenes: [], shots: [], characters: [] }
    const [board, scenes, shots, characters] = await Promise.all([
      ctx.db.get(boardId),
      ctx.db
        .query('scenes')
        .withIndex('by_board', (q) => q.eq('boardId', boardId))
        .collect(),
      ctx.db
        .query('shots')
        .withIndex('by_board', (q) => q.eq('boardId', boardId))
        .collect(),
      ctx.db
        .query('characters')
        .withIndex('by_board', (q) => q.eq('boardId', boardId))
        .collect(),
    ])
    return { board, scenes, shots, characters: characters.filter((row) => !row.archivedAt) }
  },
})

// ---------------------------------------------------------------- scenes

export const listScenes = query({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    return await ctx.db
      .query('scenes')
      .withIndex('by_board', (q) => q.eq('boardId', boardId))
      .collect()
  },
})

export const createScene = mutation({
  args: { boardId: v.id('shotboards'), sceneNumber: v.number(), ...sceneFields },
  handler: async (ctx, { boardId, ...fields }) => {
    await requireIdentity(ctx)
    const id = await ctx.db.insert('scenes', { boardId, ...fields })
    await touchBoard(ctx, boardId)
    return id
  },
})

export const patchScene = mutation({
  args: { sceneId: v.id('scenes'), sceneNumber: v.optional(v.number()), ...sceneFields },
  handler: async (ctx, { sceneId, ...fields }) => {
    await requireIdentity(ctx)
    const scene = await ctx.db.get(sceneId)
    await ctx.db.patch(sceneId, fields)
    if (scene) await touchBoard(ctx, scene.boardId)
  },
})

export const removeScene = mutation({
  args: { sceneId: v.id('scenes') },
  handler: async (ctx, { sceneId }) => {
    await requireIdentity(ctx)
    const scene = await ctx.db.get(sceneId)
    const shots = await ctx.db
      .query('shots')
      .withIndex('by_scene', (q) => q.eq('sceneId', sceneId))
      .collect()
    for (const shot of shots) await ctx.db.delete(shot._id)
    await ctx.db.delete(sceneId)
    if (scene) await touchBoard(ctx, scene.boardId)
  },
})

// ---------------------------------------------------------------- shots

export const listShots = query({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    return await ctx.db
      .query('shots')
      .withIndex('by_board', (q) => q.eq('boardId', boardId))
      .collect()
  },
})

export const createShot = mutation({
  args: { sceneId: v.id('scenes'), boardId: v.id('shotboards'), shotNumber: v.number(), ...shotFields },
  handler: async (ctx, { sceneId, boardId, ...fields }) => {
    await requireIdentity(ctx)
    const id = await ctx.db.insert('shots', { sceneId, boardId, ...fields })
    await touchBoard(ctx, boardId)
    return id
  },
})

export const patchShot = mutation({
  args: { shotId: v.id('shots'), shotNumber: v.optional(v.number()), ...shotFields },
  handler: async (ctx, { shotId, ...fields }) => {
    await requireIdentity(ctx)
    const shot = await ctx.db.get(shotId)
    await ctx.db.patch(shotId, fields)
    if (shot) {
      const board = await ctx.db.get(shot.boardId)
      // Derived GMI text does not invalidate the source revision it was
      // expanded from. User edits and asset/timing changes do.
      const derivedOnly = Object.keys(fields).every((key) => key === 'expandedPrompt' || key === 'expandedPromptHash' || key === 'expandedPromptRevision' || key === 'directorPrompt' || key === 'directorPromptHash' || key === 'directorPromptRevision')
      await ctx.db.patch(shot.boardId, { revision: derivedOnly ? (board?.revision ?? 0) : (board?.revision ?? 0) + 1, updatedAt: Date.now() })
    }
  },
})

export const removeShot = mutation({
  args: { shotId: v.id('shots') },
  handler: async (ctx, { shotId }) => {
    await requireIdentity(ctx)
    const shot = await ctx.db.get(shotId)
    await ctx.db.delete(shotId)
    if (shot) await touchBoard(ctx, shot.boardId)
  },
})

/** Write the full ordering in one call after a client-side reorder. */
export const setShotOrder = mutation({
  args: { sceneId: v.id('scenes'), shotIds: v.array(v.id('shots')) },
  handler: async (ctx, { sceneId, shotIds }) => {
    await requireIdentity(ctx)
    const scene = await ctx.db.get(sceneId)
    for (let i = 0; i < shotIds.length; i++) {
      await ctx.db.patch(shotIds[i], { sceneId, order: i + 1, shotNumber: i + 1 })
    }
    if (scene) await touchBoard(ctx, scene.boardId)
  },
})

// ---------------------------------------------------------------- characters

export const listCharacters = query({
  args: { boardId: v.optional(v.id('shotboards')) },
  handler: async (ctx, { boardId }) => {
    if (!(await ctx.auth.getUserIdentity())) return []
    if (boardId) {
      return await ctx.db
        .query('characters')
        .withIndex('by_board', (q) => q.eq('boardId', boardId))
        .collect()
        .then((rows) => rows.filter((row) => !row.archivedAt))
    }
    return await ctx.db.query('characters').collect().then((rows) => rows.filter((row) => !row.archivedAt))
  },
})

export const createCharacter = mutation({
  args: { boardId: v.optional(v.id('shotboards')), name: v.string(), ...characterFields },
  handler: async (ctx, { boardId, name, ...fields }) => {
    await requireIdentity(ctx)
    const id = await ctx.db.insert('characters', { boardId, name, ...fields, createdAt: Date.now() })
    if (boardId) await touchBoard(ctx, boardId)
    return id
  },
})

export const patchCharacter = mutation({
  args: { characterId: v.id('characters'), name: v.optional(v.string()), ...characterFields },
  handler: async (ctx, { characterId, ...fields }) => {
    await requireIdentity(ctx)
    const character = await ctx.db.get(characterId)
    await ctx.db.patch(characterId, fields)
    if (character?.boardId) await touchBoard(ctx, character.boardId)
  },
})

export const removeCharacter = mutation({
  args: { characterId: v.id('characters') },
  handler: async (ctx, { characterId }) => {
    await requireIdentity(ctx)
    const character = await ctx.db.get(characterId)
    if (character?.boardId) {
      const shots = await ctx.db
        .query('shots')
        .withIndex('by_board', (q) => q.eq('boardId', character.boardId!))
        .collect()
      for (const shot of shots) {
        const characterIds = shot.characterIds?.filter((id) => id !== characterId)
        if (characterIds?.length !== shot.characterIds?.length) {
          await ctx.db.patch(shot._id, { characterIds })
        }
      }
    }
    // Keep the row (and any uploaded references) recoverable for approved
    // episodes. Board-local associations are detached above, while shared
    // characters are simply archived rather than physically deleted.
    await ctx.db.patch(characterId, { archivedAt: Date.now() })
    if (character?.boardId) await touchBoard(ctx, character.boardId)
  },
})
