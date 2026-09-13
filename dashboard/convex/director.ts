import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const requireIdentity = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required')
}

/** Freeze a validated shot selection into an immutable Director handoff. */
export const prepare = mutation({
  args: {
    boardId: v.id('shotboards'),
    shotIds: v.optional(v.array(v.id('shots'))),
    expectedRevision: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')
    const sourceRevision = board.revision ?? 0
    if (args.expectedRevision != null && args.expectedRevision !== sourceRevision) throw new Error('Board changed; reload before preparing the Director transfer')
    const [scenes, allShots, characters, locations] = await Promise.all([
      ctx.db.query('scenes').withIndex('by_board', (q) => q.eq('boardId', args.boardId)).collect(),
      ctx.db.query('shots').withIndex('by_board', (q) => q.eq('boardId', args.boardId)).collect(),
      ctx.db.query('characters').withIndex('by_board', (q) => q.eq('boardId', args.boardId)).collect().then((rows) => rows.filter((row) => !row.archivedAt)),
      ctx.db.query('locations').collect().then((rows) => rows.filter((row) => !row.archivedAt)),
    ])
    const styleRow = board.styleId ? await ctx.db.get(board.styleId) : null
    const style = styleRow && !styleRow.archivedAt ? styleRow : null
    const selected = args.shotIds?.length ? allShots.filter((shot) => args.shotIds!.some((id) => id === shot._id)) : allShots
    if (args.shotIds?.some((id) => !allShots.some((shot) => shot._id === id))) throw new Error('One or more selected shots do not belong to this board')
    const sceneOrder = new Map(scenes.map((scene) => [scene._id, scene.sceneNumber]))
    const byCharacter = new Map(characters.map((character) => [character._id, character]))
    const byLocation = new Map(locations.map((location) => [location._id, location]))
    const sorted = [...selected].sort((a, b) => (sceneOrder.get(a.sceneId) ?? 0) - (sceneOrder.get(b.sceneId) ?? 0) || (a.order ?? a.shotNumber) - (b.order ?? b.shotNumber))
    let clock = 0
    let lastScene: string | null = null
    const beats: Array<{ offset: number; prompt: string; endImageUrl: string; audioUrl: string }> = []
    for (const shot of sorted) {
      const scene = scenes.find((item) => item._id === shot.sceneId)
      const location = scene?.locationId ? byLocation.get(scene.locationId) : undefined
      const context = scene ? [style?.name, style?.description, scene.title, location?.name, scene.location, location?.description, scene.timeOfDay, scene.weather, scene.atmosphere].filter(Boolean).join(' · ') : ''
      const names = (shot.characterIds ?? []).map((id) => byCharacter.get(id)?.handle || byCharacter.get(id)?.name).filter(Boolean).join(', ')
      const prompt = [lastScene === String(shot.sceneId) ? '' : context, shot.directorPrompt || shot.expandedPrompt || shot.visualPrompt || shot.promptIdea || '', names ? `Featuring ${names}.` : '', shot.dialogue ? `Dialogue: "${shot.dialogue}"` : '', shot.soundEffects ? `SFX: ${shot.soundEffects}` : ''].filter(Boolean).join(' — ').replace(/\s+/g, ' ').trim()
      const duration = Math.max(1, Math.floor(shot.duration ?? 8))
      const current = beats.find((item) => item.offset === clock)
      if (current) { current.prompt = prompt; current.audioUrl = shot.audioUrl || '' } else beats.push({ offset: clock, prompt, endImageUrl: '', audioUrl: shot.audioUrl || '' })
      if (beats.length > 1 && shot.imageUrl) beats.push({ offset: clock + duration, prompt: '', endImageUrl: shot.imageUrl, audioUrl: '' })
      clock += duration
      lastScene = String(shot.sceneId)
    }
    const firstFrameUrl = sorted[0]?.imageUrl || ''
    return await ctx.db.insert('directorTransfers', { boardId: args.boardId, sourceRevision, shotIds: sorted.map((shot) => shot._id), beats, firstFrameUrl, createdAt: Date.now() })
  },
})

export const get = query({
  args: { transferId: v.id('directorTransfers') },
  handler: async (ctx, { transferId }) => {
    if (!(await ctx.auth.getUserIdentity())) return null
    return await ctx.db.get(transferId)
  },
})
