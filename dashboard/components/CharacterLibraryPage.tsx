'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Loader2, Plus, Save, UserRound } from 'lucide-react'
import AssetUrlInput from './AssetUrlInput'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useConvexEnabled } from './ConvexClientProvider'

const field = 'w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-3 py-2 text-sm bg-white dark:bg-fal-gray-900 focus:outline-none focus:ring-2 focus:ring-fal-primary-500'

export default function CharacterLibraryPage() {
  const enabled = useConvexEnabled()
  if (!enabled) return <div className="fal-card"><div className="fal-card-content text-sm text-amber-600">Convex is not configured. Character library changes are disabled.</div></div>
  return <CharacterLibraryInner />
}

function CharacterLibraryInner() {
  const characters = useQuery(api.shotboards.listCharacters, {})
  const create = useMutation(api.shotboards.createCharacter)
  const patch = useMutation(api.shotboards.patchCharacter)
  const [selected, setSelected] = useState<Id<'characters'> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = characters?.find((character) => character._id === selected) ?? null

  const add = async () => {
    setError(null)
    try { const id = await create({ name: 'New character' }); setSelected(id) } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  const save = async (patches: Parameters<typeof patch>[0]) => {
    setSaving(true); setError(null)
    try { await patch(patches) } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setSaving(false) }
  }

  return <div className="space-y-4">
    <div className="fal-card"><div className="fal-card-header flex items-center justify-between"><div><h1 className="fal-card-title flex items-center gap-2"><UserRound className="w-4 h-4" /> Character library</h1><p className="text-xs text-fal-gray-500 mt-1">Reusable identity references for @mentions in shot prompts.</p></div><button type="button" onClick={() => void add()} className="fal-button-secondary flex items-center gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> New character</button></div></div>
    <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
      <div className="fal-card"><div className="fal-card-content p-2"><div className="space-y-1">{characters === undefined && <p className="p-2 text-xs text-fal-gray-500">Loading…</p>}{characters?.filter((c) => !c.archivedAt).map((c) => <button key={c._id} type="button" onClick={() => setSelected(c._id)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selected === c._id ? 'border-fal-primary-500 bg-fal-primary-50 dark:bg-fal-primary-900/20' : 'border-fal-gray-200 dark:border-fal-gray-700'}`}><span className="font-medium">{c.name}</span><span className="block text-xs text-fal-gray-500">{c.handle ? `@${c.handle.replace(/^@/, '')}` : 'No handle yet'}</span></button>)}</div></div></div>
      <div className="fal-card"><div className="fal-card-content space-y-3">{current ? <><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-fal-gray-500">Name<input className={field} value={current.name} onChange={(e) => void save({ characterId: current._id, name: e.target.value })} /></label><label className="text-xs text-fal-gray-500">Handle (without @)<input className={field} value={current.handle ?? ''} onChange={(e) => void save({ characterId: current._id, handle: e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9-_]/g, '') })} /></label></div><label className="text-xs text-fal-gray-500">Identity and continuity description<textarea className={field} rows={6} value={current.description ?? ''} onChange={(e) => void save({ characterId: current._id, description: e.target.value })} placeholder="Appearance, wardrobe, age, personality, and invariants…" /></label><AssetUrlInput value={current.imageUrl ?? ''} onChange={(url) => void save({ characterId: current._id, imageUrl: url })} placeholder="Character sheet or portrait URL" /><p className="flex items-center gap-1 text-xs text-fal-gray-500">{saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : <><Save className="w-3 h-3" /> Saved automatically</>}</p></> : <p className="text-sm text-fal-gray-500">Choose a character or create one to edit its identity references.</p>}{error && <p className="text-xs text-red-600">{error}</p>}</div></div>
    </div>
  </div>
}
