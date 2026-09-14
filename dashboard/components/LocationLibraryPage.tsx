/* eslint-disable @next/next/no-img-element -- Convex storage URLs are user-provided at runtime. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction, useConvex, useMutation, useQuery } from 'convex/react'
import { Check, ImagePlus, Loader2, MapPin, Plus, Sparkles } from 'lucide-react'
import AccordionGallery from './reactbits/AccordionGallery'
import ImageGenerationControls from './ImageGenerationControls'
import ReferenceAssetManager, { type ReferenceAsset } from './ReferenceAssetManager'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { buildLocationSheetSource, defaultGenerationOptions, promptFingerprint } from '../lib/assetGeneration'
import { generateImages } from '../lib/imageGen'
import { DEFAULT_IMAGE_MODEL, type ImageGenerationOptions } from '../lib/imageModels'
import { assetPlaceholder } from '../lib/assetPlaceholders'
import { useConvexEnabled } from './ConvexClientProvider'

type LocationKind = 'landmark' | 'neighborhood' | 'coast' | 'interior' | 'other'
type StudioLocation = {
  _id: Id<'locations'>
  name: string
  handle?: string
  kind?: LocationKind
  description?: string
  architecture?: string
  defaultTimeOfDay?: string
  defaultWeather?: string
  visualStyle?: string
  imageUrl?: string
  primaryStorageId?: Id<'_storage'>
  referenceStorageIds?: Id<'_storage'>[]
  referenceAssets?: ReferenceAsset[]
  revision?: number
}
type LocationDraft = Omit<StudioLocation, '_id' | 'referenceAssets' | 'primaryStorageId'>

const field = 'mt-1 w-full rounded-lg border border-fal-gray-300 bg-white px-3 py-2 text-sm text-fal-gray-900 shadow-sm outline-none transition focus:border-fal-primary-500 focus:ring-2 focus:ring-fal-primary-500/30 dark:border-fal-gray-600 dark:bg-fal-gray-900 dark:text-fal-gray-100'
const blank = (): LocationDraft => ({ name: '', handle: '', kind: 'other', description: '', architecture: '', defaultTimeOfDay: '', defaultWeather: '', visualStyle: '', referenceStorageIds: [] })
const toDraft = (location: StudioLocation): LocationDraft => ({ name: location.name, handle: location.handle ?? '', kind: location.kind ?? 'other', description: location.description ?? '', architecture: location.architecture ?? '', defaultTimeOfDay: location.defaultTimeOfDay ?? '', defaultWeather: location.defaultWeather ?? '', visualStyle: location.visualStyle ?? '', imageUrl: location.imageUrl, referenceStorageIds: location.referenceStorageIds ?? [], revision: location.revision })

export default function LocationLibraryPage() {
  const enabled = useConvexEnabled()
  if (!enabled) return <div className="fal-card"><div className="fal-card-content text-sm text-amber-700 dark:text-amber-300">Convex is not configured. Location library changes are disabled.</div></div>
  return <LocationLibraryInner />
}

function LocationLibraryInner() {
  const convex = useConvex()
  const locations = useQuery(api.assets.listLocations) as StudioLocation[] | undefined
  const create = useMutation(api.assets.createLocation)
  const patch = useMutation(api.assets.patchLocation)
  const removeReference = useMutation(api.assets.removeReference)
  const seed = useMutation(api.assets.seedStarterLibrary)
  const startGeneration = useMutation(api.assets.startGeneration)
  const completeGeneration = useMutation(api.assets.completeGeneration)
  const failGeneration = useMutation(api.assets.failGeneration)
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const expand = useAction(api.promptExpansion.expand)
  const [selectedId, setSelectedId] = useState<Id<'locations'> | null>(null)
  const [draft, setDraft] = useState<LocationDraft>(blank)
  const [editingId, setEditingId] = useState<Id<'locations'> | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modelId, setModelId] = useState(DEFAULT_IMAGE_MODEL)
  const [options, setOptions] = useState<ImageGenerationOptions>(defaultGenerationOptions)
  const current = locations?.find((location) => location._id === selectedId) ?? null
  const history = useQuery(api.assets.listAssetHistory, { targetType: 'location', locationId: selectedId ?? undefined }) as Array<{ _id: Id<'assetVersions'>; storageId?: Id<'_storage'>; url?: string | null }> | undefined

  useEffect(() => {
    if (!current || editingId === current._id) return
    setEditingId(current._id)
    setDraft(toDraft(current))
  }, [current, editingId])

  const createLocation = async () => {
    setError(null)
    try {
      const id = await create({ name: 'New location', kind: 'other' })
      setSelectedId(id); setEditingId(null)
      setNotice('Location created. Define its environment before generating a reusable reference sheet.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
  }

  const save = async (): Promise<StudioLocation | null> => {
    if (!current) return null
    const name = draft.name.trim()
    if (!name) throw new Error('A location name is required')
    setSaving(true); setError(null)
    try {
      await patch({ locationId: current._id, name, handle: draft.handle?.trim() || undefined, kind: draft.kind ?? 'other', description: draft.description?.trim(), architecture: draft.architecture?.trim(), defaultTimeOfDay: draft.defaultTimeOfDay?.trim(), defaultWeather: draft.defaultWeather?.trim(), visualStyle: draft.visualStyle?.trim(), referenceStorageIds: draft.referenceStorageIds })
      const fresh = await convex.query(api.assets.listLocations) as StudioLocation[]
      const saved = fresh.find((location) => location._id === current._id) ?? null
      if (!saved) throw new Error('Location was not available after saving')
      setEditingId(saved._id); setDraft(toDraft(saved))
      return saved
    } finally { setSaving(false) }
  }

  const saveGeneratedImage = async (url: string) => {
    const source = await fetch(url)
    if (!source.ok) throw new Error(`Generated image could not be read (${source.status})`)
    const image = await source.blob()
    const uploadUrl = await generateUploadUrl()
    const uploaded = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': image.type || 'image/png' }, body: image })
    if (!uploaded.ok) throw new Error(`Generated image could not be saved (${uploaded.status})`)
    return (await uploaded.json() as { storageId: Id<'_storage'> }).storageId
  }

  const generateSheet = async () => {
    if (!current) return
    setError(null); setNotice(null); setGenerating(true)
    let jobId: Id<'imageGenerationJobs'> | null = null
    try {
      const saved = await save()
      if (!saved || !saved.description?.trim()) throw new Error('Add an environment description before generating')
      const references = saved.referenceAssets?.map((asset) => asset.url) ?? []
      const source = buildLocationSheetSource({ ...saved, description: saved.description, hasReferences: references.length > 0 })
      const expanded = await expand({ kind: 'image', source, context: `Location library sheet. Reference count: ${references.length}.`, requestId: `location-${saved._id}-${Date.now()}` })
      const prompt = expanded.prompt
      const sourceHash = await promptFingerprint(`${saved._id}:${saved.revision}:${modelId}:${prompt}:${references.join('|')}`)
      const started = await startGeneration({ targetType: 'location', locationId: saved._id, requestId: `location-sheet-${saved._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sourceRevision: saved.revision ?? 0, sourceHash, modelId, prompt })
      jobId = started.jobId
      if (started.status !== 'running') throw new Error(`This generation is already ${started.status}`)
      const images = await generateImages({ modelId, mode: references.length ? 'edit' : 't2i', prompt, refImages: references, options })
      const storageIds = await Promise.all(images.map(saveGeneratedImage))
      await completeGeneration({ jobId, storageIds })
      setNotice(`${storageIds.length} location-sheet variation${storageIds.length === 1 ? '' : 's'} saved to Convex storage.`)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      if (jobId) await failGeneration({ jobId, error: message }).catch(() => undefined)
      setError(message)
    } finally { setGenerating(false) }
  }

  const galleryItems = useMemo(() => (locations ?? []).map((location) => ({ id: location._id, image: location.imageUrl || assetPlaceholder(location.name, 204), label: location.name, alt: `${location.name} location card` })), [locations])
  const readyToGenerate = Boolean(draft.name.trim() && draft.description?.trim())

  return <div className="asset-studio space-y-5">
    <section className="rounded-2xl border border-fal-gray-300 bg-fal-gray-950 px-5 py-5 text-white shadow-xl dark:border-fal-gray-700"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 inline-flex items-center gap-2 rounded-full bg-fal-primary-500/20 px-3 py-1 text-xs font-medium text-fal-primary-200"><Sparkles className="h-3.5 w-3.5" /> Visual asset studio</p><h1 className="text-2xl font-semibold tracking-tight">Locations that hold their atmosphere</h1><p className="mt-1 max-w-2xl text-sm text-fal-gray-300">Reusable places carry landmark geometry, weather, light, and texture into every scene.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void seed().then((result) => setNotice(`Starter library ready: ${result.locationsCreated} San Francisco locations${result.coastCreated ? ' and @coast' : ''}.`)).catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))} className="rounded-lg border border-fal-gray-600 px-3 py-2 text-xs font-medium text-fal-gray-100 hover:bg-white/10">Load SF starters</button><button type="button" onClick={() => void createLocation()} className="fal-button-primary flex items-center gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New location</button></div></div></section>
    {locations === undefined ? <div className="flex items-center gap-2 p-6 text-sm text-fal-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading location library…</div> : locations.length === 0 ? <div className="rounded-2xl border border-dashed border-fal-gray-400 bg-fal-gray-50 p-10 text-center dark:border-fal-gray-600 dark:bg-fal-gray-900"><MapPin className="mx-auto h-7 w-7 text-fal-gray-500" /><p className="mt-3 font-medium">Start with a reusable environment</p><p className="mt-1 text-sm text-fal-gray-500">Load the San Francisco starter library or create an original location.</p></div> : <AccordionGallery key={`${galleryItems.map((item) => item.id).join(',')}-${selectedId ?? ''}`} items={galleryItems} defaultIndex={Math.max(0, galleryItems.findIndex((item) => item.id === selectedId))} height={290} expandRatio={0.5} accentColor="#a78bfa" overlayColor="#05030b" trigger="hover" grayscale={false} onSelect={(index: number) => setSelectedId(galleryItems[index]?.id ?? null)} />}
    {current && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-fal-gray-300 bg-white p-5 shadow-sm dark:border-fal-gray-700 dark:bg-fal-gray-950"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-fal-primary-700 dark:text-fal-primary-300">Location source</p><h2 className="mt-1 text-lg font-semibold">{draft.name || 'Untitled location'}</h2></div><button type="button" onClick={() => void save().then(() => setNotice('Location source saved.')).catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))} disabled={saving} className="fal-button-secondary flex items-center gap-1.5 text-xs"><Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save source'}</button></div>
        <div className="grid gap-4 sm:grid-cols-3"><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300 sm:col-span-2">Name<input className={field} value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="Location name" /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Type<select className={field} value={draft.kind ?? 'other'} onChange={(event) => setDraft((value) => ({ ...value, kind: event.target.value as LocationKind }))}><option value="landmark">Landmark</option><option value="neighborhood">Neighborhood</option><option value="coast">Coast</option><option value="interior">Interior</option><option value="other">Other</option></select></label></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Handle (optional)<input className={field} value={draft.handle ?? ''} onChange={(event) => setDraft((value) => ({ ...value, handle: event.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '') }))} placeholder="ferrybuilding" /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Default light<input className={field} value={draft.defaultTimeOfDay ?? ''} onChange={(event) => setDraft((value) => ({ ...value, defaultTimeOfDay: event.target.value }))} placeholder="Morning fog, sunset, night…" /></label></div>
        <label className="mt-4 block text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Environment description<textarea className={field} rows={4} value={draft.description ?? ''} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="Architecture, materials, spatial layout, Bay light, weather, and scene invariants…" /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Architecture and materials<textarea className={field} rows={3} value={draft.architecture ?? ''} onChange={(event) => setDraft((value) => ({ ...value, architecture: event.target.value }))} placeholder="Stone, glass, streetscape…" /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Weather<textarea className={field} rows={3} value={draft.defaultWeather ?? ''} onChange={(event) => setDraft((value) => ({ ...value, defaultWeather: event.target.value }))} placeholder="Fog, wind, rain…" /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Visual style<textarea className={field} rows={3} value={draft.visualStyle ?? ''} onChange={(event) => setDraft((value) => ({ ...value, visualStyle: event.target.value }))} placeholder="Optional production style…" /></label></div>
        <div className="mt-5 border-t border-fal-gray-200 pt-5 dark:border-fal-gray-700"><ReferenceAssetManager targetType="location" targetId={String(current._id)} references={current.referenceAssets ?? []} primaryStorageId={current.primaryStorageId ? String(current.primaryStorageId) : undefined} defaultRole="environment" onUploaded={(storageId) => setDraft((value) => ({ ...value, referenceStorageIds: [...new Set([...(value.referenceStorageIds ?? []), storageId as Id<'_storage'>])] }))} onMakePrimary={async (storageId) => { await patch({ locationId: current._id, primaryStorageId: storageId as Id<'_storage'> }) }} onRemove={async (storageId) => { await removeReference({ targetType: 'location', locationId: current._id, storageId: storageId as Id<'_storage'> }); setDraft((value) => ({ ...value, referenceStorageIds: (value.referenceStorageIds ?? []).filter((id) => String(id) !== storageId) })) }} /></div>
      </section>
      <aside className="rounded-2xl border border-fal-gray-700 bg-[#11131a] p-5 text-white shadow-xl"><p className="text-xs font-medium uppercase tracking-[0.16em] text-fal-primary-300">Generate</p><h2 className="mt-1 text-lg font-semibold">Location sheet</h2><p className="mt-2 text-sm leading-6 text-fal-gray-300">The metaprompt turns your environment notes into production-ready coverage before the selected Fal model is called.</p><div className="mt-4"><ImageGenerationControls modelId={modelId} options={options} editing={Boolean(current.referenceAssets?.length)} onModelChange={setModelId} onOptionsChange={(change) => setOptions((value) => ({ ...value, ...change }))} /></div><button type="button" onClick={() => void generateSheet()} disabled={!readyToGenerate || generating || saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-fal-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-fal-primary-400 disabled:cursor-not-allowed disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{generating ? 'Generating location sheet…' : 'Generate location sheet'}</button>{!readyToGenerate && <p className="mt-2 text-xs text-amber-300">Add a name and environment description to continue.</p>}<div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-medium text-fal-gray-300">Sheet history</p><div className="mt-2 grid grid-cols-3 gap-2">{history?.map((asset) => asset.url && <button key={asset._id} type="button" onClick={() => asset.storageId && void patch({ locationId: current._id, primaryStorageId: asset.storageId })} className="aspect-square overflow-hidden rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-fal-primary-400" title="Use as primary reference">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={asset.url} alt="Generated location-sheet history" className="h-full w-full object-cover" /></button>)}</div>{history?.length === 0 && <p className="mt-2 text-xs text-fal-gray-500">Generated sheets will remain here for review.</p>}</div></aside>
    </div>}
    {notice && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">{notice}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200">{error}</p>}
  </div>
}
