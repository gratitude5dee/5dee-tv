import { action, internalMutation, internalQuery, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

const GMI_URL = 'https://api.gmi-serving.com/v1/chat/completions'
const TEMPLATE_VERSION = 'gmi-astra-glm-2026-09-1'
const DEFAULT_COORDINATOR = 'openai/gpt-6-astra'
const DEFAULT_WORKER = 'zai-org/GLM-5.3-Flash'
type Message = { role: 'system' | 'user' | 'developer'; content: string }

async function completion(model: string, messages: Message[], timeoutMs = 45_000): Promise<{ text: string; usage?: { prompt_tokens?: number; completion_tokens?: number } }> {
  const key = process.env.GMI_CLOUD_API_KEY
  if (!key) throw new Error('GMI prompt expansion is not configured (GMI_CLOUD_API_KEY is missing)')
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(GMI_URL, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(process.env.GMI_CLOUD_ORGANIZATION_ID ? { 'X-Organization-ID': process.env.GMI_CLOUD_ORGANIZATION_ID } : {}) }, body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 1600, response_format: { type: 'json_object' }, stream: false }), signal: controller.signal })
    if (!response.ok) throw new Error(`GMI request failed (${response.status})`)
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } }
    const text = payload.choices?.[0]?.message?.content?.trim(); if (!text) throw new Error('GMI returned an empty expansion'); return { text, usage: payload.usage }
  } finally { clearTimeout(timer) }
}
function validateModelId(value: string, role: string): string {
  if (!/^[A-Za-z0-9._/-]{1,120}$/.test(value)) throw new Error(`Invalid GMI ${role} model id`)
  return value
}
function parseObject(text: string): { prompt: string; notes?: string } { let parsed: unknown; try { parsed = JSON.parse(text) } catch { throw new Error('GMI returned invalid JSON') }; if (!parsed || typeof parsed !== 'object' || typeof (parsed as { prompt?: unknown }).prompt !== 'string') throw new Error('GMI response did not contain a prompt'); const prompt = (parsed as { prompt: string }).prompt.trim(); if (!prompt || prompt.length > 12_000) throw new Error('GMI returned an invalid prompt length'); return { prompt, notes: typeof (parsed as { notes?: unknown }).notes === 'string' ? (parsed as { notes: string }).notes : undefined } }
const system = (kind: 'image' | 'director') => `You are Astra, a prompt editor for a storyboard application. Return JSON only: {"prompt":"...","notes":"..."}. Preserve the user's intent and any quoted dialogue exactly. Never invent asset IDs, URLs, timings, or model parameters. The target is ${kind === 'image' ? 'a Nano Banana or GPT image prompt' : 'a MiniMax H3 Max Director beat prompt'}; use concrete subject, composition, motion, camera, lighting, materials, and constraints.`

export const expand = action({
  args: { kind: v.union(v.literal('image'), v.literal('director')), source: v.string(), context: v.optional(v.string()), requestId: v.string(), sourceRevision: v.optional(v.number()), shotId: v.optional(v.id('shots')) },
  handler: async (ctx, args): Promise<{ prompt: string; notes?: string; requestId: string; templateVersion: string; coordinatorModel: string; workerModel: string }> => {
    if (!(await ctx.auth.getUserIdentity())) throw new Error('Authentication required for GMI prompt expansion')
    if (args.source.trim().length < 1 || args.source.length > 12_000 || args.requestId.length < 8 || args.requestId.length > 128) throw new Error('Invalid prompt expansion request')
    if (args.shotId && args.sourceRevision != null) {
      const shot = await ctx.runQuery(internal.promptExpansion.getShot, { shotId: args.shotId })
      const revision = shot ? await ctx.runQuery(internal.promptExpansion.getBoardRevision, { boardId: shot.boardId }) : null
      if (!shot || revision !== args.sourceRevision) throw new Error('Prompt is stale; reload the shot before expanding')
    }
    const coordinator = validateModelId(process.env.GMI_COORDINATOR_MODEL || DEFAULT_COORDINATOR, 'coordinator'); const worker = validateModelId(process.env.GMI_WORKER_MODEL || DEFAULT_WORKER, 'worker'); const base = `${args.source}\n\nContext:\n${args.context || '(none)'}`
    const sourceHash = await hash(base)
    const cached = await ctx.runQuery(internal.promptExpansion.findCached, { kind: args.kind, sourceRevision: args.sourceRevision, sourceHash, coordinatorModel: coordinator, workerModel: worker, templateVersion: TEMPLATE_VERSION })
    if (cached?.result) return { prompt: cached.result, requestId: cached.requestId, templateVersion: TEMPLATE_VERSION, coordinatorModel: coordinator, workerModel: worker }
    const brief = await completion(coordinator, [{ role: 'system', content: system(args.kind) + '\nCreate a compact specialist brief.' }, { role: 'user', content: base }])
    const [visual, continuity] = await Promise.all([completion(worker, [{ role: 'system', content: system(args.kind) + '\nAct as the visual/motion specialist.' }, { role: 'user', content: `Specialist brief:\n${brief.text}` }]), completion(worker, [{ role: 'system', content: system(args.kind) + '\nAct as the reference and continuity specialist. Keep dialogue verbatim.' }, { role: 'user', content: `Specialist brief:\n${brief.text}` }])])
    const final = await completion(coordinator, [{ role: 'system', content: system(args.kind) + '\nSynthesize the candidates into the final prompt.' }, { role: 'user', content: `Original:\n${base}\n\nVisual:\n${visual.text}\n\nContinuity:\n${continuity.text}` }])
    const parsed = parseObject(final.text)
    await ctx.runMutation(internal.promptExpansion.record, { kind: args.kind, requestId: args.requestId, sourceRevision: args.sourceRevision, sourceHash, result: parsed.prompt, coordinatorModel: coordinator, workerModel: worker, templateVersion: TEMPLATE_VERSION, inputTokens: (brief.usage?.prompt_tokens || 0) + (visual.usage?.prompt_tokens || 0) + (continuity.usage?.prompt_tokens || 0) + (final.usage?.prompt_tokens || 0), outputTokens: (brief.usage?.completion_tokens || 0) + (visual.usage?.completion_tokens || 0) + (continuity.usage?.completion_tokens || 0) + (final.usage?.completion_tokens || 0) })
    return { ...parsed, requestId: args.requestId, templateVersion: TEMPLATE_VERSION, coordinatorModel: coordinator, workerModel: worker }
  },
})

// Stable public name for clients that submit a prompt-expansion job. Keeping
// the implementation in one action avoids a second provider path with
// different safety or billing behavior.
export const start = expand

export const record = internalMutation({
  args: { kind: v.union(v.literal('image'), v.literal('director')), requestId: v.string(), sourceRevision: v.optional(v.number()), sourceHash: v.string(), result: v.string(), coordinatorModel: v.string(), workerModel: v.string(), templateVersion: v.string(), inputTokens: v.number(), outputTokens: v.number() },
  handler: async (ctx, args) => { const existing = await ctx.db.query('promptJobs').withIndex('by_requestId', (q) => q.eq('requestId', args.requestId)).unique(); const now = Date.now(); if (existing) { await ctx.db.patch(existing._id, { status: 'completed', result: args.result, updatedAt: now }); return existing._id }; return await ctx.db.insert('promptJobs', { ...args, status: 'completed', createdAt: now, updatedAt: now }) },
})
export const getShot = internalQuery({ args: { shotId: v.id('shots') }, handler: async (ctx, { shotId }) => await ctx.db.get(shotId) })
export const getBoardRevision = internalQuery({ args: { boardId: v.id('shotboards') }, handler: async (ctx, { boardId }) => (await ctx.db.get(boardId))?.revision ?? 0 })
export const findCached = internalQuery({
  args: { kind: v.union(v.literal('image'), v.literal('director')), sourceRevision: v.optional(v.number()), sourceHash: v.string(), coordinatorModel: v.string(), workerModel: v.string(), templateVersion: v.string() },
  handler: async (ctx, args) => await ctx.db.query('promptJobs').withIndex('by_sourceHash', (q) => q.eq('sourceHash', args.sourceHash).eq('kind', args.kind).eq('sourceRevision', args.sourceRevision)).filter((q) => q.and(q.eq(q.field('coordinatorModel'), args.coordinatorModel), q.eq(q.field('workerModel'), args.workerModel), q.eq(q.field('templateVersion'), args.templateVersion), q.eq(q.field('status'), 'completed'))).order('desc').first(),
})
export const get = query({ args: { requestId: v.string() }, handler: async (ctx, { requestId }) => { if (!(await ctx.auth.getUserIdentity())) return null; return await ctx.db.query('promptJobs').withIndex('by_requestId', (q) => q.eq('requestId', requestId)).unique() } })
async function hash(value: string): Promise<string> { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, '0')).join('') }
