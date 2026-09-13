'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { LayoutTemplate } from 'lucide-react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import type { ScriptBeat } from '../lib/directorProtocol'
import { compileShotsToBeats, firstFrameUrl } from '../lib/shotboardCompiler'
import type { CharacterDetails, SceneDetails, ShotDetails } from '../lib/shotboardTypes'

type ConvexSceneRow = Omit<SceneDetails, 'id' | 'boardId'> & { _id: Id<'scenes'>; boardId: Id<'shotboards'> }
type ConvexShotRow = Omit<ShotDetails, 'id' | 'sceneId' | 'boardId' | 'characterIds'> & { _id: Id<'shots'>; sceneId: Id<'scenes'>; boardId: Id<'shotboards'>; characterIds?: Id<'characters'>[] }
type ConvexCharacterRow = Omit<CharacterDetails, 'id' | 'boardId'> & { _id: Id<'characters'>; boardId?: Id<'shotboards'> }

export interface TemplateAppliedMeta {
  title: string
  firstFrame: string
  characterName: string
  characterSheet: string
}

interface ScriptTemplatePickerProps {
  onApply: (beats: ScriptBeat[], meta: TemplateAppliedMeta) => void
}

/**
 * Saved-shotboard template picker for the Script card. Selecting a board
 * compiles its shots into beats — each shot's prompt becomes the direction and
 * its keyframe the beat's end image. Only mounted when Convex is configured.
 */
export default function ScriptTemplatePicker({ onApply }: ScriptTemplatePickerProps) {
  const [templateId, setTemplateId] = useState('')
  const [applied, setApplied] = useState<string | null>(null)
  const boards = useQuery(api.shotboards.list, {})
  const template = useQuery(
    api.shotboards.load,
    templateId ? { boardId: templateId as Id<'shotboards'> } : 'skip',
  )

  // ?board=<id> (from the shotboard page) pre-selects the template.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('board')
    if (id) setTemplateId(id)
  }, [])

  useEffect(() => {
    if (!template?.board || applied === templateId || !templateId) return
    const scenes = (template.scenes as unknown as ConvexSceneRow[]).map((s) => ({ ...s, id: String(s._id), boardId: String(s.boardId) }))
    const shots = (template.shots as unknown as ConvexShotRow[]).map((s) => ({
      ...s,
      id: String(s._id),
      sceneId: String(s.sceneId),
      boardId: String(s.boardId),
      characterIds: s.characterIds?.map(String),
    }))
    const characters = (template.characters as unknown as ConvexCharacterRow[]).map((c) => ({
      ...c,
      id: String(c._id),
      boardId: c.boardId ? String(c.boardId) : undefined,
    }))
    const compiled = compileShotsToBeats(scenes, shots, characters)
    if (!compiled.length) return
    const lead = characters.find((c) => c.imageUrl || c.handle)
    onApply(compiled, {
      title: template.board.title,
      firstFrame: firstFrameUrl(scenes, shots),
      characterName: lead?.handle || lead?.name || '',
      characterSheet: lead?.imageUrl || '',
    })
    setApplied(templateId)
  }, [template, templateId, applied, onApply])

  if (!boards?.length) {
    return (
      <Link href="/admin/shotboard" className="fal-button-secondary flex items-center gap-1.5 text-xs !py-1.5">
        <LayoutTemplate className="w-3.5 h-3.5" />
        <span>Open shotboard editor</span>
      </Link>
    )
  }

  return (
    <span className="flex items-center gap-1.5">
      <LayoutTemplate className="w-3.5 h-3.5 text-fal-gray-400" />
      <select
        value={templateId}
        onChange={(e) => {
          setTemplateId(e.target.value)
          setApplied(null)
        }}
        className="rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1.5 text-xs bg-white dark:bg-fal-gray-900"
        title="Autofill the script from a saved shotboard"
      >
        <option value="">Load template…</option>
        {boards.map((b) => (
          <option key={b._id} value={b._id}>
            {b.title || 'Untitled'}
          </option>
        ))}
      </select>
      <Link
        href={templateId ? `/admin/shotboard?board=${templateId}` : '/admin/shotboard'}
        className="text-xs text-fal-primary-600 dark:text-fal-primary-400 underline"
      >
        edit
      </Link>
    </span>
  )
}
