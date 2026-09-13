'use client'

import { useMemo, useState } from 'react'
import { Loader2, Plus, Trash2, Wand2 } from 'lucide-react'
// @ts-ignore - vendored reactbits JSX component
import ChromaGrid from '../reactbits/ChromaGrid'
import AssetUrlInput from '../AssetUrlInput'
import type { CharacterDetails } from '../../lib/shotboardTypes'

const PALETTE = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16']

const fieldClass =
  'w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500 bg-white dark:bg-fal-gray-900'

interface CharacterPanelProps {
  characters: CharacterDetails[]
  selectedId: string | null
  generatingIds: Set<string>
  onSelect: (id: string | null) => void
  onAdd: () => void
  onPatch: (id: string, patch: Partial<CharacterDetails>) => void
  onDelete: (id: string) => void
  onGenerateImage: (character: CharacterDetails) => void
}

/** Character gallery via reactbits ChromaGrid + editor for the selected card. */
export default function CharacterPanel({
  characters,
  selectedId,
  generatingIds,
  onSelect,
  onAdd,
  onPatch,
  onDelete,
  onGenerateImage,
}: CharacterPanelProps) {
  const items = useMemo(
    () =>
      characters.map((c, i) => ({
        id: c.id,
        image: c.imageUrl,
        title: c.name,
        subtitle: c.description ?? '',
        handle: c.handle,
        borderColor: PALETTE[i % PALETTE.length],
        gradient: `linear-gradient(145deg, ${PALETTE[i % PALETTE.length]}, #0a0713)`,
        selected: c.id === selectedId,
      })),
    [characters, selectedId],
  )

  const selected = characters.find((c) => c.id === selectedId) ?? null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-400">Characters</span>
        <button type="button" onClick={onAdd} className="fal-button-secondary flex items-center gap-1 text-xs !py-1">
          <Plus className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>

      {characters.length === 0 ? (
        <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">
          No characters yet — add one, generate its portrait, then tag it on shots.
        </p>
      ) : (
        <div className="h-[420px] relative rounded-lg overflow-hidden border border-fal-gray-200 dark:border-fal-gray-700">
          <ChromaGrid items={items} columns={1} radius={200} onSelect={(item: { id: string }) => onSelect(item.id === selectedId ? null : item.id)} />
        </div>
      )}

      {selected && (
        <div className="rounded-md border border-fal-gray-200 dark:border-fal-gray-700 p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={selected.name}
              onChange={(e) => onPatch(selected.id, { name: e.target.value })}
              placeholder="Name"
              className={fieldClass}
            />
            <input
              type="text"
              value={selected.handle ?? ''}
              onChange={(e) => onPatch(selected.id, { handle: e.target.value })}
              placeholder="$HANDLE"
              title="Prompt anchor (e.g. $COAST)"
              className={fieldClass + ' w-24'}
            />
            <button type="button" onClick={() => onDelete(selected.id)} className="p-1 text-fal-gray-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Delete character">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={selected.description ?? ''}
            onChange={(e) => onPatch(selected.id, { description: e.target.value })}
            rows={2}
            placeholder="Appearance, outfit, style — used in prompts"
            className={fieldClass}
          />
          <AssetUrlInput
            value={selected.imageUrl ?? ''}
            onChange={(u) => onPatch(selected.id, { imageUrl: u })}
            placeholder="Portrait URL or upload"
          />
          <button
            type="button"
            onClick={() => onGenerateImage(selected)}
            disabled={generatingIds.has(selected.id)}
            className="fal-button-secondary flex items-center gap-1.5 text-xs !py-1.5 disabled:opacity-50"
          >
            {generatingIds.has(selected.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            <span>{generatingIds.has(selected.id) ? 'Generating…' : selected.imageUrl ? 'Regenerate portrait' : 'Generate portrait'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
