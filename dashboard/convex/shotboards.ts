import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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
}

const characterFields = {
  handle: v.optional(v.string()),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  traits: v.optional(v.any()),
}

// ---------------------------------------------------------------- boards

export const list = query({
  args: {},
  handler: async (ctx) =>
    await ctx.db.query('shotboards').withIndex('by_createdAt').order('desc').take(50),
})

export const get = query({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) => await ctx.db.get(boardId),
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('shotboards', { ...args, createdAt: now, updatedAt: now })
  },
})

export const patch = mutation({
  args: {
    boardId: v.id('shotboards'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
  },
  handler: async (ctx, { boardId, ...updates }) => {
    await ctx.db.patch(boardId, { ...updates, updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) => {
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
    return { board, scenes, shots, characters }
  },
})

// ---------------------------------------------------------------- scenes

export const listScenes = query({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) =>
    await ctx.db
      .query('scenes')
      .withIndex('by_board', (q) => q.eq('boardId', boardId))
      .collect(),
})

export const createScene = mutation({
  args: { boardId: v.id('shotboards'), sceneNumber: v.number(), ...sceneFields },
  handler: async (ctx, { boardId, ...fields }) => {
    const id = await ctx.db.insert('scenes', { boardId, ...fields })
    await ctx.db.patch(boardId, { updatedAt: Date.now() })
    return id
  },
})

export const patchScene = mutation({
  args: { sceneId: v.id('scenes'), sceneNumber: v.optional(v.number()), ...sceneFields },
  handler: async (ctx, { sceneId, ...fields }) => {
    await ctx.db.patch(sceneId, fields)
  },
})

export const removeScene = mutation({
  args: { sceneId: v.id('scenes') },
  handler: async (ctx, { sceneId }) => {
    const shots = await ctx.db
      .query('shots')
      .withIndex('by_scene', (q) => q.eq('sceneId', sceneId))
      .collect()
    for (const shot of shots) await ctx.db.delete(shot._id)
    await ctx.db.delete(sceneId)
  },
})

// ---------------------------------------------------------------- shots

export const listShots = query({
  args: { boardId: v.id('shotboards') },
  handler: async (ctx, { boardId }) =>
    await ctx.db
      .query('shots')
      .withIndex('by_board', (q) => q.eq('boardId', boardId))
      .collect(),
})

export const createShot = mutation({
  args: { sceneId: v.id('scenes'), boardId: v.id('shotboards'), shotNumber: v.number(), ...shotFields },
  handler: async (ctx, { sceneId, boardId, ...fields }) => {
    const id = await ctx.db.insert('shots', { sceneId, boardId, ...fields })
    await ctx.db.patch(boardId, { updatedAt: Date.now() })
    return id
  },
})

export const patchShot = mutation({
  args: { shotId: v.id('shots'), shotNumber: v.optional(v.number()), ...shotFields },
  handler: async (ctx, { shotId, ...fields }) => {
    await ctx.db.patch(shotId, fields)
  },
})

export const removeShot = mutation({
  args: { shotId: v.id('shots') },
  handler: async (ctx, { shotId }) => {
    await ctx.db.delete(shotId)
  },
})

/** Write the full ordering in one call after a client-side reorder. */
export const setShotOrder = mutation({
  args: { sceneId: v.id('scenes'), shotIds: v.array(v.id('shots')) },
  handler: async (ctx, { sceneId, shotIds }) => {
    for (let i = 0; i < shotIds.length; i++) {
      await ctx.db.patch(shotIds[i], { sceneId, order: i + 1, shotNumber: i + 1 })
    }
  },
})

// ---------------------------------------------------------------- characters

export const listCharacters = query({
  args: { boardId: v.optional(v.id('shotboards')) },
  handler: async (ctx, { boardId }) => {
    if (boardId) {
      return await ctx.db
        .query('characters')
        .withIndex('by_board', (q) => q.eq('boardId', boardId))
        .collect()
    }
    return await ctx.db.query('characters').collect()
  },
})

export const createCharacter = mutation({
  args: { boardId: v.optional(v.id('shotboards')), name: v.string(), ...characterFields },
  handler: async (ctx, { boardId, name, ...fields }) => {
    return await ctx.db.insert('characters', { boardId, name, ...fields, createdAt: Date.now() })
  },
})

export const patchCharacter = mutation({
  args: { characterId: v.id('characters'), name: v.optional(v.string()), ...characterFields },
  handler: async (ctx, { characterId, ...fields }) => {
    await ctx.db.patch(characterId, fields)
  },
})

export const removeCharacter = mutation({
  args: { characterId: v.id('characters') },
  handler: async (ctx, { characterId }) => {
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
    await ctx.db.delete(characterId)
  },
})
