'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import ShotCard from './ShotCard'
import type { CharacterDetails, LocationDetails, SceneDetails, ShotDetails } from '../../lib/shotboardTypes'

interface SceneSectionProps {
  scene: SceneDetails
  shots: ShotDetails[]
  characters: CharacterDetails[]
  selected: boolean
  generatingIds: Set<string>
  onSelect: () => void
  onPatchScene: (patch: Partial<SceneDetails>) => void
  onDeleteScene: () => void
  onMoveScene: (dir: -1 | 1) => void
  onAddShot: () => void
  onPatchShot: (shotId: string, patch: Partial<ShotDetails>) => void
  onDeleteShot: (shotId: string) => void
  onMoveShot: (shotId: string, dir: -1 | 1) => void
  onGenerateImage: (shot: ShotDetails) => void
  onToggleCharacter: (shotId: string, characterId: string) => void
  onExpandPrompt?: (shot: ShotDetails) => Promise<void>
  locations?: LocationDetails[]
}

export default function SceneSection({
  scene,
  shots,
  characters,
  selected,
  generatingIds,
  onSelect,
  onPatchScene,
  onDeleteScene,
  onMoveScene,
  onAddShot,
  onPatchShot,
  onDeleteShot,
  onMoveShot,
  onGenerateImage,
  onToggleCharacter,
  onExpandPrompt,
  locations = [],
}: SceneSectionProps) {
  const ordered = [...shots].sort((a, b) => (a.order ?? a.shotNumber) - (b.order ?? b.shotNumber))

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        selected
          ? 'border-fal-primary-500/60 bg-fal-primary-500/5'
          : 'border-fal-gray-200 dark:border-fal-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
        <span className="w-7 h-7 rounded-md bg-fal-gray-900 dark:bg-fal-gray-100 text-white dark:text-fal-gray-900 flex items-center justify-center text-xs font-bold">
          {scene.sceneNumber}
        </span>
        <input
          type="text"
          value={scene.title ?? ''}
          onChange={(e) => onPatchScene({ title: e.target.value })}
          placeholder={`Scene ${scene.sceneNumber}`}
          className="flex-1 min-w-0 rounded-md border border-transparent hover:border-fal-gray-300 dark:hover:border-fal-gray-700 px-2 py-1 text-sm font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-fal-primary-500"
        />
        {locations.length > 0 && <select value={scene.locationId ?? ''} onChange={(e) => onPatchScene({ locationId: e.target.value || undefined })} className="max-w-40 rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs bg-white dark:bg-fal-gray-900" aria-label="Scene location"><option value="">Location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>}
        <button
          type="button"
          onClick={() => onMoveScene(-1)}
          className="p-1 text-fal-gray-400 hover:text-fal-gray-600 dark:hover:text-fal-gray-300"
          aria-label="Move scene up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMoveScene(1)}
          className="p-1 text-fal-gray-400 hover:text-fal-gray-600 dark:hover:text-fal-gray-300"
          aria-label="Move scene down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onAddShot} className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Add shot</span>
        </button>
        <button type="button" onClick={onDeleteScene} className="p-1.5 text-fal-gray-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Delete scene">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" onClick={(e) => e.stopPropagation()}>
        {ordered.map((shot) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            characters={characters}
            generating={generatingIds.has(shot.id)}
            onPatch={(patch) => onPatchShot(shot.id, patch)}
            onDelete={() => onDeleteShot(shot.id)}
            onMove={(dir) => onMoveShot(shot.id, dir)}
            onGenerateImage={onGenerateImage}
            onToggleCharacter={(cid) => onToggleCharacter(shot.id, cid)}
            onExpandPrompt={onExpandPrompt}
          />
        ))}
        {ordered.length === 0 && (
          <button
            type="button"
            onClick={onAddShot}
            className="w-40 h-32 rounded-lg border border-dashed border-fal-gray-300 dark:border-fal-gray-700 text-fal-gray-400 text-xs flex flex-col items-center justify-center gap-1 hover:border-fal-primary-500 hover:text-fal-primary-500"
          >
            <Plus className="w-4 h-4" />
            First shot
          </button>
        )}
      </div>
    </div>
  )
}
