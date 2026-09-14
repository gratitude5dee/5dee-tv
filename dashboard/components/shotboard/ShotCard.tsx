'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ImagePlus, Loader2, Trash2, Users, Wand2 } from 'lucide-react'
import AssetUrlInput from '../AssetUrlInput'
import AccordionGallery from '../reactbits/AccordionGallery'
import type { CharacterDetails, ShotDetails } from '../../lib/shotboardTypes'
import { SHOT_TYPE_OPTIONS } from '../../lib/shotboardTypes'

const selectClass =
  'rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500 bg-white dark:bg-fal-gray-900'

interface ShotCardProps {
  shot: ShotDetails
  characters: CharacterDetails[]
  generating: boolean
  onPatch: (patch: Partial<ShotDetails>) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  onGenerateImage: (shot: ShotDetails) => void
  onToggleCharacter: (characterId: string) => void
  onExpandPrompt?: (shot: ShotDetails) => Promise<void>
}

export default function ShotCard({
  shot,
  characters,
  generating,
  onPatch,
  onDelete,
  onMove,
  onGenerateImage,
  onToggleCharacter,
  onExpandPrompt,
}: ShotCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionOpen, setMentionOpen] = useState(false)
  const assigned = new Set(shot.characterIds ?? [])
  const displayedPrompt = shot.expandedPrompt || shot.promptIdea || ''
  const mentionMatches = characters.filter((character) => {
    const needle = mentionQuery.toLowerCase()
    return (character.handle || character.name).toLowerCase().replace(/^@/, '').includes(needle)
  }).slice(0, 6)

  const updatePrompt = (value: string) => {
    onPatch({ promptIdea: value, expandedPrompt: '' })
    const match = value.match(/@([a-z0-9_-]*)$/i)
    setMentionQuery(match?.[1] ?? '')
    setMentionOpen(Boolean(match))
  }

  const insertMention = (character: CharacterDetails) => {
    const handle = (character.handle || character.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')).replace(/^@/, '')
    const next = displayedPrompt.replace(/@[a-z0-9_-]*$/i, `@${handle} `)
    onPatch({ promptIdea: next, expandedPrompt: '', characterIds: [...new Set([...assigned, character.id])] })
    setMentionOpen(false)
    setMentionQuery('')
  }

  const expandPrompt = async () => {
    if (!onExpandPrompt || !displayedPrompt.trim()) return
    setExpanding(true)
    try { await onExpandPrompt(shot) } finally { setExpanding(false) }
  }

  return (
    <div className="w-64 shrink-0 rounded-lg border border-fal-gray-200 dark:border-fal-gray-700 bg-fal-gray-50/50 dark:bg-fal-gray-900/50 p-2 space-y-2">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-fal-gray-500 dark:text-fal-gray-400">
          Shot {shot.shotNumber}
        </span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => onMove(-1)} className="p-1 text-fal-gray-400 hover:text-fal-gray-600 dark:hover:text-fal-gray-300" aria-label="Move shot earlier">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onMove(1)} className="p-1 text-fal-gray-400 hover:text-fal-gray-600 dark:hover:text-fal-gray-300" aria-label="Move shot later">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onDelete} className="p-1 text-fal-gray-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Delete shot">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative h-32 rounded-md border border-dashed border-fal-gray-300 dark:border-fal-gray-700 bg-fal-gray-100 dark:bg-fal-gray-800 overflow-hidden flex items-center justify-center">
        {shot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-5 h-5 text-fal-gray-400" />
        )}
        {generating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onGenerateImage(shot)}
        disabled={generating}
        className="fal-button-secondary w-full flex items-center justify-center gap-1.5 text-xs !py-1.5 disabled:opacity-50"
        title={shot.imageUrl ? 'Re-generate / edit the keyframe with the selected model' : 'Generate a keyframe image'}
      >
        <Wand2 className="w-3.5 h-3.5" />
        <span>{generating ? 'Generating…' : shot.imageUrl ? 'Regenerate image' : 'Generate image'}</span>
      </button>

      <div className="flex items-center gap-1.5">
        <select
          value={shot.shotType ?? 'medium'}
          onChange={(e) => onPatch({ shotType: e.target.value })}
          className={selectClass + ' flex-1'}
        >
          {SHOT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={shot.duration ?? 8}
          onChange={(e) => onPatch({ duration: Math.max(1, Math.floor(Number(e.target.value) || 8)) })}
          className={selectClass + ' w-14'}
          title="Shot duration in seconds (drives the beat offset)"
        />
        <span className="text-[10px] text-fal-gray-400">s</span>
      </div>

      <div className="relative">
        <textarea
          value={displayedPrompt}
          onChange={(e) => updatePrompt(e.target.value)}
          onBlur={() => setTimeout(() => setMentionOpen(false), 120)}
          rows={3}
          placeholder="Image prompt or direction for this shot…"
          className="w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 pr-16 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
          aria-label={`Image prompt for shot ${shot.shotNumber}`}
        />
        {mentionOpen && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-fal-gray-200 bg-white p-1 shadow-lg dark:border-fal-gray-700 dark:bg-fal-gray-900">
            {mentionMatches.length > 0 ? mentionMatches.map((character) => (
              <button key={character.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMention(character)} className="block w-full rounded px-2 py-1 text-left text-[10px] hover:bg-fal-gray-100 dark:hover:bg-fal-gray-800">
                @{(character.handle || character.name).replace(/^@/, '')}
              </button>
            )) : <p className="px-2 py-1 text-[10px] text-red-600">Unknown character handle</p>}
          </div>
        )}
        <button
          type="button"
          onClick={() => void expandPrompt()}
          disabled={!onExpandPrompt || expanding || !displayedPrompt.trim()}
          className="absolute right-1 top-1 rounded border border-fal-primary-300 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-fal-primary-700 shadow-sm hover:bg-fal-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-fal-gray-900/90 dark:text-fal-primary-300"
          title="Expand this prompt with GMI"
        >
          {expanding ? 'Expanding…' : 'Expand'}
        </button>
        {shot.expandedPrompt && (
          <button type="button" onClick={() => onPatch({ expandedPrompt: '' })} className="mt-0.5 text-[10px] text-fal-gray-400 hover:text-fal-gray-600 dark:hover:text-fal-gray-300">Undo expansion</button>
        )}
      </div>

      {characters.length > 0 && (
        <div className="space-y-1"><div className="flex flex-wrap items-center gap-1"><Users className="w-3 h-3 text-fal-gray-400" />{characters.map((c) => <button key={c.id} type="button" onClick={() => onToggleCharacter(c.id)} className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${assigned.has(c.id) ? 'border-fal-primary-500 text-fal-primary-600 dark:text-fal-primary-400 bg-fal-primary-500/10' : 'border-fal-gray-300 dark:border-fal-gray-700 text-fal-gray-500 dark:text-fal-gray-400'}`} title={c.description || c.name}>{c.handle || c.name}</button>)}</div><details><summary className="cursor-pointer text-[10px] text-fal-primary-700 dark:text-fal-primary-300">Choose from character gallery</summary><div className="mt-1 rounded-md border border-fal-gray-200 bg-white p-1 dark:border-fal-gray-700 dark:bg-fal-gray-900"><AccordionGallery key={`${shot.id}-${[...assigned].join(',')}`} items={characters.map((character) => ({ id: character.id, image: character.imageUrl, label: character.handle ? `@${character.handle.replace(/^@/, '')}` : character.name }))} defaultIndex={Math.max(0, characters.findIndex((character) => assigned.has(character.id)))} height={130} expandRatio={0.5} accentColor="#a78bfa" overlayColor="#05030b" grayscale={false} onSelect={(index: number) => { const character = characters[index]; if (character) onToggleCharacter(character.id) }} /></div></details></div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-fal-gray-400 hover:text-fal-gray-600 dark:hover:text-fal-gray-300"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Details
      </button>

      {expanded && (
        <div className="space-y-2 pt-1 border-t border-fal-gray-200 dark:border-fal-gray-700">
          <div>
            <label className="block text-[10px] text-fal-gray-500 dark:text-fal-gray-400 mb-0.5">Visual prompt (image gen)</label>
            <textarea
              value={shot.visualPrompt ?? ''}
              onChange={(e) => onPatch({ visualPrompt: e.target.value })}
              rows={2}
              placeholder="Detailed prompt for the keyframe image…"
              className="w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
            />
          </div>
          <input
            type="text"
            value={shot.dialogue ?? ''}
            onChange={(e) => onPatch({ dialogue: e.target.value })}
            placeholder="Dialogue (optional)"
            className="w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
          />
          <input
            type="text"
            value={shot.soundEffects ?? ''}
            onChange={(e) => onPatch({ soundEffects: e.target.value })}
            placeholder="Sound effects (optional)"
            className="w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
          />
          <div>
            <label className="block text-[10px] text-fal-gray-500 dark:text-fal-gray-400 mb-0.5">Audio at this beat</label>
            <AssetUrlInput value={shot.audioUrl ?? ''} onChange={(u) => onPatch({ audioUrl: u })} kind="audio" placeholder="Audio URL or upload" />
          </div>
          <div>
            <label className="block text-[10px] text-fal-gray-500 dark:text-fal-gray-400 mb-0.5">Keyframe image URL</label>
            <AssetUrlInput value={shot.imageUrl ?? ''} onChange={(u) => onPatch({ imageUrl: u })} placeholder="Image URL or upload" />
          </div>
        </div>
      )}
    </div>
  )
}
