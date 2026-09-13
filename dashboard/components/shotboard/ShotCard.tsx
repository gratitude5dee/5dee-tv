'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ImagePlus, Loader2, Trash2, Users, Wand2 } from 'lucide-react'
import AssetUrlInput from '../AssetUrlInput'
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
}: ShotCardProps) {
  const [expanded, setExpanded] = useState(false)
  const assigned = new Set(shot.characterIds ?? [])

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

      <textarea
        value={shot.promptIdea ?? ''}
        onChange={(e) => onPatch({ promptIdea: e.target.value })}
        rows={2}
        placeholder="Direction for this shot…"
        className="w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
      />

      {characters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <Users className="w-3 h-3 text-fal-gray-400" />
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggleCharacter(c.id)}
              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                assigned.has(c.id)
                  ? 'border-fal-primary-500 text-fal-primary-600 dark:text-fal-primary-400 bg-fal-primary-500/10'
                  : 'border-fal-gray-300 dark:border-fal-gray-700 text-fal-gray-500 dark:text-fal-gray-400'
              }`}
              title={c.description || c.name}
            >
              {c.handle || c.name}
            </button>
          ))}
        </div>
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
