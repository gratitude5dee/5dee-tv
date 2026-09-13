'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Loader2, MapPin, Plus, Save } from 'lucide-react'
import AssetUrlInput from './AssetUrlInput'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useConvexEnabled } from './ConvexClientProvider'

const field = 'w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-3 py-2 text-sm bg-white dark:bg-fal-gray-900 focus:outline-none focus:ring-2 focus:ring-fal-primary-500'

export default function LocationLibraryPage() {
  const enabled = useConvexEnabled()
  if (!enabled) return <div className="fal-card"><div className="fal-card-content text-sm text-amber-600">Convex is not configured. Location library changes are disabled.</div></div>
  return <LocationLibraryInner />
}

function LocationLibraryInner() {
  const locations = useQuery(api.locations.list, {})
  const create = useMutation(api.locations.create)
  const patch = useMutation(api.locations.patch)
  const [selected, setSelected] = useState<Id<'locations'> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = locations?.find((location) => location._id === selected) ?? null
  const [draft, setDraft] = useState({ name: '', description: '', imageUrl: '' })
  const draftRef = useRef(draft)
  const draftOwnerRef = useRef<Id<'locations'> | null>(null)

  useEffect(() => {
    if (!current || draftOwnerRef.current === current._id) return
    const next = { name: current.name, description: current.description ?? '', imageUrl: current.imageUrl ?? '' }
    draftOwnerRef.current = current._id
    draftRef.current = next
    setDraft(next)
  }, [current])

  const update = async (args: Parameters<typeof patch>[0]) => { setSaving(true); setError(null); try { await patch(args) } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setSaving(false) } }
  const updateDraft = (changes: Partial<typeof draft>) => { const next = { ...draftRef.current, ...changes }; draftRef.current = next; setDraft(next); if (current) void update({ locationId: current._id, ...next }) }
  const add = async () => { setError(null); try { const id = await create({ name: 'New location' }); setSelected(id) } catch (e) { setError(e instanceof Error ? e.message : String(e)) } }

  return <div className="space-y-4"><div className="fal-card"><div className="fal-card-header flex items-center justify-between"><div><h1 className="fal-card-title flex items-center gap-2"><MapPin className="w-4 h-4" /> Location library</h1><p className="text-xs text-fal-gray-500 mt-1">Reusable environments selectable on storyboard scenes.</p></div><button type="button" onClick={() => void add()} className="fal-button-secondary flex items-center gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> New location</button></div></div><div className="grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]"><div className="fal-card"><div className="fal-card-content p-2 space-y-1">{locations?.filter((l) => !l.archivedAt).map((location) => <button type="button" key={location._id} onClick={() => setSelected(location._id)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selected === location._id ? 'border-fal-primary-500 bg-fal-primary-50 dark:bg-fal-primary-900/20' : 'border-fal-gray-200 dark:border-fal-gray-700'}`}>{location.name}</button>)}</div></div><div className="fal-card"><div className="fal-card-content space-y-3">{current ? <><label className="text-xs text-fal-gray-500">Name<input className={field} value={draft.name} onChange={(e) => updateDraft({ name: e.target.value })} /></label><label className="text-xs text-fal-gray-500">Environment description<textarea className={field} rows={6} value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} placeholder="Architecture, materials, light, weather, and style invariants…" /></label><AssetUrlInput value={draft.imageUrl} onChange={(url) => updateDraft({ imageUrl: url })} placeholder="Location reference URL" /><p className="flex items-center gap-1 text-xs text-fal-gray-500">{saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : <><Save className="w-3 h-3" /> Saved automatically</>}</p></> : <p className="text-sm text-fal-gray-500">Choose a location or create one to edit its environment reference.</p>}{error && <p className="text-xs text-red-600">{error}</p>}</div></div></div></div>
}
