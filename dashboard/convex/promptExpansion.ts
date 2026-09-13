import { action, internalMutation, internalQuery, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

const GMI_URL = 'https://api.gmi-serving.com/v1/chat/completions'
const DEFAULT_COORDINATOR = 'openai/gpt-6-astra'
const DEFAULT_WORKER = 'zai-org/GLM-5.3-Flash'
const DIRECTOR_TEMPLATE_VERSION = 'gmi-director-glm-2026-09-2'
const STORYBOARD_TEMPLATE_VERSION = 'gmi-astra-glm-2026-09-1'
type Message = { role: 'system' | 'user' | 'developer'; content: string }
type Usage = { prompt_tokens?: number; completion_tokens?: number }
let activeExpansions = 0

async function completion(model: string, messages: Message[], timeoutMs = 45_000): Promise<{ text: string; usage?: Usage }> {
  const key = process.env.GMI_CLOUD_API_KEY
  if (!key) throw new Error('GMI prompt expansion is not configured (GMI_CLOUD_API_KEY is missing)')
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(GMI_URL, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(process.env.GMI_CLOUD_ORGANIZATION_ID ? { 'X-Organization-ID': process.env.GMI_CLOUD_ORGANIZATION_ID } : {}) }, body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 1600, response_format: { type: 'json_object' }, stream: false }), signal: controller.signal })
    if (!response.ok) throw new Error(`GMI request failed (${response.status})`)
    const payload = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string } }>; usage?: Usage }
    const choice = payload.choices?.[0]
    if (choice?.finish_reason === 'length') throw new Error('GMI response was truncated')
    if (choice?.finish_reason === 'content_filter') throw new Error('GMI response was blocked by the provider')
    const text = choice?.message?.content?.trim(); if (!text) throw new Error('GMI returned an empty expansion'); return { text, usage: payload.usage }
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`GMI request timed out after ${Math.round(timeoutMs / 1_000)} seconds`)
    throw error
  } finally { clearTimeout(timer) }
}

async function verifyModelCatalog(coordinator: string, worker: string): Promise<void> {
  const key = process.env.GMI_CLOUD_API_KEY
  if (!key) throw new Error('GMI prompt expansion is not configured (GMI_CLOUD_API_KEY is missing)')
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch('https://api.gmi-serving.com/v1/models', { headers: { Authorization: `Bearer ${key}`, ...(process.env.GMI_CLOUD_ORGANIZATION_ID ? { 'X-Organization-ID': process.env.GMI_CLOUD_ORGANIZATION_ID } : {}) }, signal: controller.signal })
    if (!response.ok) throw new Error(`GMI model catalog request failed (${response.status})`)
    const payload = await response.json() as { data?: Array<{ id?: string }> }
    const ids = new Set((payload.data || []).map((item) => item.id).filter((id): id is string => !!id))
    if (!ids.has(coordinator)) throw new Error(`GMI coordinator model is not available: ${coordinator}`)
    if (!ids.has(worker)) throw new Error(`GMI worker model is not available: ${worker}`)
  } finally { clearTimeout(timer) }
}
function validateModelId(value: string, role: string): string {
  if (!/^[A-Za-z0-9._/-]{1,120}$/.test(value)) throw new Error(`Invalid GMI ${role} model id`)
  return value
}
function parseObject(text: string): { prompt: string; notes?: string } { let parsed: unknown; try { parsed = JSON.parse(text) } catch { throw new Error('GMI returned invalid JSON') }; if (!parsed || typeof parsed !== 'object' || typeof (parsed as { prompt?: unknown }).prompt !== 'string') throw new Error('GMI response did not contain a prompt'); const prompt = (parsed as { prompt: string }).prompt.trim(); if (!prompt || prompt.length > 12_000) throw new Error('GMI returned an invalid prompt length'); return { prompt, notes: typeof (parsed as { notes?: unknown }).notes === 'string' ? (parsed as { notes: string }).notes : undefined } }
const system = (kind: 'image' | 'director') => `You are ${kind === 'image' ? 'Astra' : 'a Director prompt editor'}, working in a storyboard application. Return JSON only: {"prompt":"...","notes":"..."}. Preserve the user's intent and any quoted dialogue exactly. Never invent asset IDs, URLs, timings, or model parameters. The target is ${kind === 'image' ? 'a Nano Banana or GPT image prompt' : 'a MiniMax H3 Max Director beat prompt'}; use concrete subject, composition, motion, camera, lighting, materials, and constraints.`

export const expand = action({
  args: { kind: v.union(v.literal('image'), v.literal('director')), source: v.string(), context: v.optional(v.string()), requestId: v.string(), sourceRevision: v.optional(v.number()), shotId: v.optional(v.id('shots')) },
  handler: async (ctx, args): Promise<{ prompt: string; notes?: string; requestId: string; templateVersion: string; coordinatorModel: string; workerModel: string }> => {
    if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required for GMI prompt expansion')
    if (args.source.trim().length < 1 || args.source.length > 12_000 || args.requestId.length < 8 || args.requestId.length > 128) throw new Error('Invalid prompt expansion request')
    const isDirector = args.kind === 'director'
    const coordinator = validateModelId(isDirector ? process.env.GMI_DIRECTOR_COORDINATOR_MODEL || DEFAULT_WORKER : process.env.GMI_STORYBOARD_COORDINATOR_MODEL || process.env.GMI_COORDINATOR_MODEL || DEFAULT_COORDINATOR, 'coordinator')
    const worker = validateModelId(isDirector ? process.env.GMI_DIRECTOR_WORKER_MODEL || DEFAULT_WORKER : process.env.GMI_WORKER_MODEL || DEFAULT_WORKER, 'worker')
    const templateVersion = isDirector ? DIRECTOR_TEMPLATE_VERSION : STORYBOARD_TEMPLATE_VERSION
    const base = `${args.source}\n\nContext:\n${args.context || '(none)'}`
    if (activeExpansions >= 2) throw new Error('Two prompt-expansion jobs are already running; try again shortly')
    activeExpansions += 1
    const startedAt = Date.now()
    const deadline = startedAt + 180_000
    let ownsReservation = false
    try {
      if (args.shotId && args.sourceRevision != null) {
        const shot = await ctx.runQuery(internal.promptExpansion.getShot, { shotId: args.shotId })
        const revision = shot ? await ctx.runQuery(internal.promptExpansion.getBoardRevision, { boardId: shot.boardId }) : null
        if (!shot || revision !== args.sourceRevision) throw new Error('Prompt is stale; reload the shot before expanding')
      }
      const sourceHash = await hash(base)
      const reservation = await ctx.runMutation(internal.promptExpansion.reserve, { kind: args.kind, shotId: args.shotId, requestId: args.requestId, sourceRevision: args.sourceRevision, sourceHash, coordinatorModel: coordinator, workerModel: worker, templateVersion })
      if (reservation.state === 'completed' && reservation.result) return { prompt: reservation.result, requestId: args.requestId, templateVersion, coordinatorModel: coordinator, workerModel: worker }
      if (reservation.state !== 'reserved') throw new Error('Prompt expansion is already running or has failed; use a new requestId')
      ownsReservation = true
      await verifyModelCatalog(coordinator, worker)
      const cached = await ctx.runQuery(internal.promptExpansion.findCached, { kind: args.kind, sourceRevision: args.sourceRevision, sourceHash, coordinatorModel: coordinator, workerModel: worker, templateVersion })
      if (cached?.result) {
        await ctx.runMutation(internal.promptExpansion.record, { kind: args.kind, shotId: args.shotId, requestId: args.requestId, sourceRevision: args.sourceRevision, sourceHash, result: cached.result, coordinatorModel: coordinator, workerModel: worker, templateVersion, provider: 'gmi-cache', phase: 'completed', durationMs: Date.now() - startedAt, inputTokens: 0, outputTokens: 0 })
        return { prompt: cached.result, requestId: args.requestId, templateVersion, coordinatorModel: coordinator, workerModel: worker }
      }
      if (Date.now() >= deadline) throw new Error('GMI prompt expansion exceeded its three-minute deadline')
      const brief = await completion(coordinator, [{ role: 'system', content: system(args.kind) + '\nCreate a compact specialist brief.' }, { role: 'user', content: base }])
      const briefPrompt = parseObject(brief.text).prompt
      if (Date.now() >= deadline) throw new Error('GMI prompt expansion exceeded its three-minute deadline')
      const [visual, continuity] = await Promise.all([completion(worker, [{ role: 'system', content: system(args.kind) + '\nAct as the visual/motion specialist.' }, { role: 'user', content: `Specialist brief:\n${briefPrompt}` }]), completion(worker, [{ role: 'system', content: system(args.kind) + '\nAct as the reference and continuity specialist. Keep dialogue verbatim.' }, { role: 'user', content: `Specialist brief:\n${briefPrompt}` }])])
      const visualPrompt = parseObject(visual.text).prompt
      const continuityPrompt = parseObject(continuity.text).prompt
      if (Date.now() >= deadline) throw new Error('GMI prompt expansion exceeded its three-minute deadline')
      const final = await completion(coordinator, [{ role: 'system', content: system(args.kind) + '\nSynthesize the candidates into the final prompt.' }, { role: 'user', content: `Original:\n${base}\n\nVisual:\n${visualPrompt}\n\nContinuity:\n${continuityPrompt}` }])
      const parsed = parseObject(final.text)
      // Revalidation is also enforced inside record() in the same Convex
      // mutation that writes the result, closing the check-to-write race.
      await ctx.runMutation(internal.promptExpansion.record, { kind: args.kind, shotId: args.shotId, requestId: args.requestId, sourceRevision: args.sourceRevision, sourceHash, result: parsed.prompt, coordinatorModel: coordinator, workerModel: worker, templateVersion, provider: 'gmi', phase: 'completed', durationMs: Date.now() - startedAt, inputTokens: (brief.usage?.prompt_tokens || 0) + (visual.usage?.prompt_tokens || 0) + (continuity.usage?.prompt_tokens || 0) + (final.usage?.prompt_tokens || 0), outputTokens: (brief.usage?.completion_tokens || 0) + (visual.usage?.completion_tokens || 0) + (continuity.usage?.completion_tokens || 0) + (final.usage?.completion_tokens || 0) })
      return { ...parsed, requestId: args.requestId, templateVersion, coordinatorModel: coordinator, workerModel: worker }
    } catch (error) {
      if (ownsReservation) await ctx.runMutation(internal.promptExpansion.recordFailure, { requestId: args.requestId, error: error instanceof Error ? error.message.slice(0, 500) : 'Prompt expansion failed', durationMs: Date.now() - startedAt }).catch(() => undefined)
      throw error
    } finally {
      activeExpansions -= 1
    }
  },
})

// Stable public name for clients that submit a prompt-expansion job. Keeping
// the implementation in one action avoids a second provider path with
// different safety or billing behavior.
export const start = expand

export const reserve = internalMutation({
  args: { kind: v.union(v.literal('image'), v.literal('director')), shotId: v.optional(v.id('shots')), requestId: v.string(), sourceRevision: v.optional(v.number()), sourceHash: v.string(), coordinatorModel: v.string(), workerModel: v.string(), templateVersion: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('promptJobs').withIndex('by_requestId', (q) => q.eq('requestId', args.requestId)).unique()
    if (existing) {
      if (existing.sourceHash !== args.sourceHash || existing.kind !== args.kind || existing.sourceRevision !== args.sourceRevision || existing.coordinatorModel !== args.coordinatorModel || existing.workerModel !== args.workerModel || existing.templateVersion !== args.templateVersion) throw new Error('requestId was already used for a different expansion')
      if (existing.status === 'completed' && existing.result) return { state: 'completed' as const, result: existing.result }
      return { state: 'busy' as const }
    }
    const now = Date.now()
    await ctx.db.insert('promptJobs', { ...args, status: 'running', provider: 'gmi', phase: 'reserved', createdAt: now, updatedAt: now })
    return { state: 'reserved' as const }
  },
})

export const recordFailure = internalMutation({
  args: { requestId: v.string(), error: v.string(), durationMs: v.number() },
  handler: async (ctx, args) => {
    const job = await ctx.db.query('promptJobs').withIndex('by_requestId', (q) => q.eq('requestId', args.requestId)).unique()
    if (job && job.status !== 'completed') await ctx.db.patch(job._id, { status: 'failed', phase: 'failed', error: args.error.slice(0, 500), durationMs: args.durationMs, updatedAt: Date.now() })
  },
})

export const record = internalMutation({
  args: { kind: v.union(v.literal('image'), v.literal('director')), shotId: v.optional(v.id('shots')), requestId: v.string(), sourceRevision: v.optional(v.number()), sourceHash: v.string(), result: v.string(), coordinatorModel: v.string(), workerModel: v.string(), templateVersion: v.string(), provider: v.optional(v.string()), phase: v.optional(v.string()), durationMs: v.optional(v.number()), inputTokens: v.number(), outputTokens: v.number() },
  handler: async (ctx, args) => {
    if (args.shotId && args.sourceRevision != null) {
      const shot = await ctx.db.get(args.shotId)
      const board = shot ? await ctx.db.get(shot.boardId) : null
      if (!shot || !board || (board.revision ?? 0) !== args.sourceRevision) throw new Error('Prompt is stale; reload the shot before expanding')
    }
    const existing = await ctx.db.query('promptJobs').withIndex('by_requestId', (q) => q.eq('requestId', args.requestId)).unique()
    const now = Date.now()
    if (existing) {
      if (existing.sourceHash !== args.sourceHash || existing.kind !== args.kind || existing.sourceRevision !== args.sourceRevision) throw new Error('requestId was already used for a different expansion')
      if (existing.status === 'completed' && existing.result) return existing._id
      await ctx.db.patch(existing._id, { status: 'completed', result: args.result, shotId: args.shotId, provider: args.provider, phase: args.phase, durationMs: args.durationMs, inputTokens: args.inputTokens, outputTokens: args.outputTokens, updatedAt: now })
      return existing._id
    }
    return await ctx.db.insert('promptJobs', { ...args, status: 'completed', createdAt: now, updatedAt: now })
  },
})
export const getShot = internalQuery({ args: { shotId: v.id('shots') }, handler: async (ctx, { shotId }) => await ctx.db.get(shotId) })
export const getBoardRevision = internalQuery({ args: { boardId: v.id('shotboards') }, handler: async (ctx, { boardId }) => (await ctx.db.get(boardId))?.revision ?? 0 })
export const findCached = internalQuery({
  args: { kind: v.union(v.literal('image'), v.literal('director')), sourceRevision: v.optional(v.number()), sourceHash: v.string(), coordinatorModel: v.string(), workerModel: v.string(), templateVersion: v.string() },
  handler: async (ctx, args) => await ctx.db.query('promptJobs').withIndex('by_sourceHash', (q) => q.eq('sourceHash', args.sourceHash).eq('kind', args.kind).eq('sourceRevision', args.sourceRevision)).filter((q) => q.and(q.eq(q.field('coordinatorModel'), args.coordinatorModel), q.eq(q.field('workerModel'), args.workerModel), q.eq(q.field('templateVersion'), args.templateVersion), q.eq(q.field('status'), 'completed'))).order('desc').first(),
})
export const get = query({ args: { requestId: v.string() }, handler: async (ctx, { requestId }) => { if (!(await ctx.auth.getUserIdentity())) return null; return await ctx.db.query('promptJobs').withIndex('by_requestId', (q) => q.eq('requestId', requestId)).unique() } })
async function hash(value: string): Promise<string> { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, '0')).join('') }
