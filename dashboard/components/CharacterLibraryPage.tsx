/* eslint-disable @next/next/no-img-element -- Convex storage URLs are user-provided at runtime. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction, useConvex, useMutation, useQuery } from 'convex/react'
import { Check, ImagePlus, Loader2, Plus, Sparkles, UserRound } from 'lucide-react'
import AccordionGallery from './reactbits/AccordionGallery'
import ImageGenerationControls from './ImageGenerationControls'
import ReferenceAssetManager, { type ReferenceAsset } from './ReferenceAssetManager'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { buildCharacterSheetSource, defaultGenerationOptions, promptFingerprint } from '../lib/assetGeneration'
import { generateImages } from '../lib/imageGen'
import { DEFAULT_IMAGE_MODEL, type ImageGenerationOptions } from '../lib/imageModels'
import { assetPlaceholder } from '../lib/assetPlaceholders'
import { useConvexEnabled } from './ConvexClientProvider'

type StudioCharacter = {
  _id: Id<'characters'>
  name: string
  handle?: string
  description?: string
  appearance?: string
  identityNotes?: string
  defaultWardrobe?: string
  voiceNotes?: string
  visualStyle?: string
  identityLocked?: boolean
  imageUrl?: string
  primaryStorageId?: Id<'_storage'>
  referenceStorageIds?: Id<'_storage'>[]
  referenceAssets?: ReferenceAsset[]
  revision?: number
}

type CharacterDraft = Omit<StudioCharacter, '_id' | 'referenceAssets' | 'primaryStorageId'>

const field = 'mt-1 w-full rounded-lg border border-fal-gray-300 bg-white px-3 py-2 text-sm text-fal-gray-900 shadow-sm outline-none transition focus:border-fal-primary-500 focus:ring-2 focus:ring-fal-primary-500/30 dark:border-fal-gray-600 dark:bg-fal-gray-900 dark:text-fal-gray-100'
const newDraft = (): CharacterDraft => ({ name: '', handle: '', description: '', appearance: '', identityNotes: '', defaultWardrobe: '', voiceNotes: '', visualStyle: '', identityLocked: true, referenceStorageIds: [] })
const asDraft = (character: StudioCharacter): CharacterDraft => ({ name: character.name, handle: character.handle ?? '', description: character.description ?? '', appearance: character.appearance ?? '', identityNotes: character.identityNotes ?? '', defaultWardrobe: character.defaultWardrobe ?? '', voiceNotes: character.voiceNotes ?? '', visualStyle: character.visualStyle ?? '', identityLocked: character.identityLocked ?? true, imageUrl: character.imageUrl, referenceStorageIds: character.referenceStorageIds ?? [], revision: character.revision })

export default function CharacterLibraryPage() {
  const enabled = useConvexEnabled()
  if (!enabled) return <div className="fal-card"><div className="fal-card-content text-sm text-amber-700 dark:text-amber-300">Convex is not configured. Character library changes are disabled.</div></div>
  return <CharacterLibraryInner />
}

function CharacterLibraryInner() {
  const convex = useConvex()
  const characters = useQuery(api.assets.listCharacters) as StudioCharacter[] | undefined
  const create = useMutation(api.assets.createCharacter)
  const patch = useMutation(api.assets.patchCharacter)
  const removeReference = useMutation(api.assets.removeReference)
  const seed = useMutation(api.assets.seedStarterLibrary)
  const startGeneration = useMutation(api.assets.startGeneration)
  const completeGeneration = useMutation(api.assets.completeGeneration)
  const failGeneration = useMutation(api.assets.failGeneration)
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const expand = useAction(api.promptExpansion.expand)
  const [selectedId, setSelectedId] = useState<Id<'characters'> | null>(null)
  const [draft, setDraft] = useState<CharacterDraft>(newDraft)
  const [editingId, setEditingId] = useState<Id<'characters'> | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modelId, setModelId] = useState(DEFAULT_IMAGE_MODEL)
  const [options, setOptions] = useState<ImageGenerationOptions>(defaultGenerationOptions)

  const current = characters?.find((character) => character._id === selectedId) ?? null
  const history = useQuery(api.assets.listAssetHistory, { targetType: 'character', characterId: selectedId ?? undefined }) as Array<{ _id: Id<'assetVersions'>; storageId?: Id<'_storage'>; url?: string | null }> | undefined

  useEffect(() => {
    if (!current || editingId === current._id) return
    setEditingId(current._id)
    setDraft(asDraft(current))
  }, [current, editingId])

  const canGenerate = Boolean(draft.name.trim() && draft.handle.trim() && draft.description.trim() && (!draft.identityLocked || current?.referenceAssets?.length))

  const createCharacter = async () => {
    setError(null)
    try {
      const id = await create({ name: 'New character', handle: `character-${Date.now().toString(36)}`, identityLocked: true })
      setSelectedId(id)
      setEditingId(null)
      setNotice('Character created. Add a name, handle, identity description, and approved face references.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
  }

  const persistDraft = async (): Promise<StudioCharacter | null> => {
    if (!current) return null
    const name = draft.name.trim()
    const handle = draft.handle.trim()
    if (!name || !handle) throw new Error('Name and @handle are required')
    setSaving(true)
    setError(null)
    try {
      await patch({ characterId: current._id, name, handle, description: draft.description.trim(), appearance: draft.appearance?.trim(), identityNotes: draft.identityNotes?.trim(), defaultWardrobe: draft.defaultWardrobe?.trim(), voiceNotes: draft.voiceNotes?.trim(), visualStyle: draft.visualStyle?.trim(), identityLocked: draft.identityLocked ?? true, referenceStorageIds: draft.referenceStorageIds })
      const fresh = await convex.query(api.assets.getCharacter, { characterId: current._id }) as StudioCharacter | null
      if (!fresh) throw new Error('Character was not available after saving')
      setEditingId(fresh._id)
      setDraft(asDraft(fresh))
      return fresh
    } finally { setSaving(false) }
  }

  const uploadGeneratedImage = async (url: string) => {
    const source = await fetch(url)
    if (!source.ok) throw new Error(`Generated image could not be read (${source.status})`)
    const image = await source.blob()
    const uploadUrl = await generateUploadUrl()
    const upload = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': image.type || 'image/png' }, body: image })
    if (!upload.ok) throw new Error(`Generated image could not be saved (${upload.status})`)
    return (await upload.json() as { storageId: Id<'_storage'> }).storageId
  }

  const generateSheet = async () => {
    if (!current) return
    setError(null); setNotice(null); setGenerating(true)
    let jobId: Id<'imageGenerationJobs'> | null = null
    try {
      const saved = await persistDraft()
      if (!saved) throw new Error('Choose a character first')
      const references = saved.referenceAssets?.map((asset) => asset.url) ?? []
      if (saved.identityLocked && !references.length) throw new Error('Add an approved face reference before generating a locked identity like @coast')
      if (!saved.description?.trim() || !saved.handle?.trim()) throw new Error('A handle and identity description are required to generate a sheet')
      const source = buildCharacterSheetSource({ ...saved, handle: saved.handle, description: saved.description, hasReferences: references.length > 0 })
      const expanded = await expand({ kind: 'image', source, context: `Character library sheet. Reference count: ${references.length}.`, requestId: `character-${saved._id}-${Date.now()}` })
      const prompt = expanded.prompt
      const sourceHash = await promptFingerprint(`${saved._id}:${saved.revision}:${modelId}:${prompt}:${references.join('|')}`)
      const started = await startGeneration({ targetType: 'character', characterId: saved._id, requestId: `sheet-${saved._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sourceRevision: saved.revision ?? 0, sourceHash, modelId, prompt })
      jobId = started.jobId
      if (started.status !== 'running') throw new Error(`This generation is already ${started.status}`)
      const generated = await generateImages({ modelId, mode: references.length ? 'edit' : 't2i', prompt, refImages: references, options })
      const storageIds = await Promise.all(generated.map(uploadGeneratedImage))
      await completeGeneration({ jobId, storageIds })
      setNotice(`${storageIds.length} character-sheet variation${storageIds.length === 1 ? '' : 's'} saved to Convex storage.`)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      if (jobId) await failGeneration({ jobId, error: message }).catch(() => undefined)
      setError(message)
    } finally { setGenerating(false) }
  }

  const galleryItems = useMemo(() => (characters ?? []).map((character) => ({ id: character._id, image: character.imageUrl || assetPlaceholder(character.handle ? `@${character.handle}` : character.name, 268), label: character.handle ? `@${character.handle}` : character.name, alt: `${character.name} character card` })), [characters])

  return <div className="asset-studio space-y-5">
    <section className="rounded-2xl border border-fal-gray-300 bg-fal-gray-950 px-5 py-5 text-white shadow-xl dark:border-fal-gray-700"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 inline-flex items-center gap-2 rounded-full bg-fal-primary-500/20 px-3 py-1 text-xs font-medium text-fal-primary-200"><Sparkles className="h-3.5 w-3.5" /> Visual asset studio</p><h1 className="text-2xl font-semibold tracking-tight">Characters with a stable identity</h1><p className="mt-1 max-w-2xl text-sm text-fal-gray-300">Keep a face and overall look consistent, then swap wardrobe and scene styling without rebuilding the character.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void seed().then((result) => setNotice(`Starter library ready: ${result.locationsCreated} San Francisco locations${result.coastCreated ? ' and @coast' : ''}.`)).catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))} className="rounded-lg border border-fal-gray-600 px-3 py-2 text-xs font-medium text-fal-gray-100 hover:bg-white/10">Load SF starters</button><button type="button" onClick={() => void createCharacter()} className="fal-button-primary flex items-center gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New character</button></div></div></section>
    {characters === undefined ? <div className="flex items-center gap-2 p-6 text-sm text-fal-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading character library…</div> : characters.length === 0 ? <div className="rounded-2xl border border-dashed border-fal-gray-400 bg-fal-gray-50 p-10 text-center dark:border-fal-gray-600 dark:bg-fal-gray-900"><UserRound className="mx-auto h-7 w-7 text-fal-gray-500" /><p className="mt-3 font-medium">Start with a reusable character</p><p className="mt-1 text-sm text-fal-gray-500">Create one, or load the San Francisco starter set to add @coast.</p></div> : <AccordionGallery key={`${galleryItems.map((item) => item.id).join(',')}-${selectedId ?? ''}`} items={galleryItems} defaultIndex={Math.max(0, galleryItems.findIndex((item) => item.id === selectedId))} height={290} expandRatio={0.5} accentColor="#a78bfa" overlayColor="#05030b" trigger="hover" grayscale={false} onSelect={(index: number) => setSelectedId(galleryItems[index]?.id ?? null)} />}
    {current && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-fal-gray-300 bg-white p-5 shadow-sm dark:border-fal-gray-700 dark:bg-fal-gray-950"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-fal-primary-700 dark:text-fal-primary-300">Character source</p><h2 className="mt-1 text-lg font-semibold">{draft.name || 'Untitled character'}</h2></div><button type="button" onClick={() => void persistDraft().then(() => setNotice('Character source saved.')).catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))} disabled={saving} className="fal-button-secondary flex items-center gap-1.5 text-xs"><Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save source'}</button></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Name<input className={field} value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="Character name" /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Handle<input className={field} value={draft.handle ?? ''} onChange={(event) => setDraft((value) => ({ ...value, handle: event.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '') }))} placeholder="coast" /></label></div>
        <label className="mt-4 block text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Identity and continuity description<textarea className={field} rows={4} value={draft.description ?? ''} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="Face, hair, body proportions, age, overall look, and traits that must remain consistent…" /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Appearance details<textarea className={field} rows={3} value={draft.appearance ?? ''} onChange={(event) => setDraft((value) => ({ ...value, appearance: event.target.value }))} placeholder="Materials, grooming, proportions…" /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Default wardrobe<textarea className={field} rows={3} value={draft.defaultWardrobe ?? ''} onChange={(event) => setDraft((value) => ({ ...value, defaultWardrobe: event.target.value }))} placeholder="Flexible scene-ready outfit baseline…" /></label></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Identity invariants<textarea className={field} rows={3} value={draft.identityNotes ?? ''} onChange={(event) => setDraft((value) => ({ ...value, identityNotes: event.target.value }))} placeholder="What must not change between generations…" /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Visual style<textarea className={field} rows={3} value={draft.visualStyle ?? ''} onChange={(event) => setDraft((value) => ({ ...value, visualStyle: event.target.value }))} placeholder="Optional board or series style…" /></label></div>
        <label className="mt-4 flex items-center gap-2 text-sm text-fal-gray-700 dark:text-fal-gray-200"><input type="checkbox" checked={draft.identityLocked ?? true} onChange={(event) => setDraft((value) => ({ ...value, identityLocked: event.target.checked }))} /> Lock the face and overall look across generations</label>
        <div className="mt-5 border-t border-fal-gray-200 pt-5 dark:border-fal-gray-700"><ReferenceAssetManager targetType="character" targetId={String(current._id)} references={current.referenceAssets ?? []} primaryStorageId={current.primaryStorageId ? String(current.primaryStorageId) : undefined} defaultRole="identity" onUploaded={(storageId) => setDraft((value) => ({ ...value, referenceStorageIds: [...new Set([...(value.referenceStorageIds ?? []), storageId as Id<'_storage'>])] }))} onMakePrimary={async (storageId) => { await patch({ characterId: current._id, primaryStorageId: storageId as Id<'_storage'> }) }} onRemove={async (storageId) => { await removeReference({ targetType: 'character', characterId: current._id, storageId: storageId as Id<'_storage'> }); setDraft((value) => ({ ...value, referenceStorageIds: (value.referenceStorageIds ?? []).filter((id) => String(id) !== storageId) })) }} /></div>
      </section>
      <aside className="rounded-2xl border border-fal-gray-700 bg-[#11131a] p-5 text-white shadow-xl"><p className="text-xs font-medium uppercase tracking-[0.16em] text-fal-primary-300">Generate</p><h2 className="mt-1 text-lg font-semibold">Character sheet</h2><p className="mt-2 text-sm leading-6 text-fal-gray-300">Astra expands the saved source; the selected Fal model then creates a reviewable sheet. No model call occurs until the source is valid.</p><div className="mt-4"><ImageGenerationControls modelId={modelId} options={options} editing={Boolean(current.referenceAssets?.length)} onModelChange={setModelId} onOptionsChange={(change) => setOptions((value) => ({ ...value, ...change }))} /></div><button type="button" onClick={() => void generateSheet()} disabled={!canGenerate || generating || saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-fal-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-fal-primary-400 disabled:cursor-not-allowed disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{generating ? 'Generating character sheet…' : 'Generate character sheet'}</button>{!canGenerate && <p className="mt-2 text-xs text-amber-300">Add a name, handle, description, and a face reference while identity lock is enabled.</p>}<div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-medium text-fal-gray-300">Sheet history</p><div className="mt-2 grid grid-cols-3 gap-2">{history?.map((asset) => asset.url && <button key={asset._id} type="button" onClick={() => asset.storageId && void patch({ characterId: current._id, primaryStorageId: asset.storageId })} className="aspect-square overflow-hidden rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-fal-primary-400" title="Use as primary reference">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={asset.url} alt="Generated character-sheet history" className="h-full w-full object-cover" /></button>)}</div>{history?.length === 0 && <p className="mt-2 text-xs text-fal-gray-500">Generated sheets will remain here for review.</p>}</div></aside>
    </div>}
    {notice && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">{notice}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200">{error}</p>}
  </div>
}
