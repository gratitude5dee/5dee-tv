'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useConvexEnabled } from '../ConvexClientProvider'
import type {
  CharacterDetails,
  SceneDetails,
  ShotboardDetails,
  ShotDetails,
} from '../../lib/shotboardTypes'

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`)

export interface ShotboardState {
  boards: ShotboardDetails[]
  boardId: string | null
  board: ShotboardDetails | null
  scenes: SceneDetails[]
  shots: ShotDetails[]
  characters: CharacterDetails[]
  /** True while Convex-backed data is loading or a local board is unsaved. */
  loading: boolean
  persistent: boolean
  selectBoard: (id: string | null) => void
  createBoard: (title: string) => Promise<string>
  patchBoard: (patch: Partial<ShotboardDetails>) => void
  deleteBoard: () => void
  addScene: () => void
  patchScene: (sceneId: string, patch: Partial<SceneDetails>) => void
  deleteScene: (sceneId: string) => void
  addShot: (sceneId: string) => void
  patchShot: (shotId: string, patch: Partial<ShotDetails>) => void
  deleteShot: (shotId: string) => void
  moveShot: (shotId: string, dir: -1 | 1) => void
  moveScene: (sceneId: string, dir: -1 | 1) => void
  addCharacter: () => void
  patchCharacter: (characterId: string, patch: Partial<CharacterDetails>) => void
  deleteCharacter: (characterId: string) => void
  toggleShotCharacter: (shotId: string, characterId: string) => void
}

type ConvexScene = Omit<SceneDetails, 'id' | 'boardId'> & { _id: Id<'scenes'>; boardId: Id<'shotboards'> }
type ConvexShot = Omit<ShotDetails, 'id' | 'sceneId' | 'boardId' | 'characterIds'> & { _id: Id<'shots'>; sceneId: Id<'scenes'>; boardId: Id<'shotboards'>; characterIds?: Id<'characters'>[] }
type ConvexCharacter = Omit<CharacterDetails, 'id' | 'boardId'> & { _id: Id<'characters'>; boardId?: Id<'shotboards'> }

const toScene = (s: ConvexScene): SceneDetails => ({ ...s, id: String(s._id), boardId: String(s.boardId) })
const toShot = (s: ConvexShot): ShotDetails => ({ ...s, id: String(s._id), sceneId: String(s.sceneId), boardId: String(s.boardId), characterIds: s.characterIds?.map(String) })
const toCharacter = (c: ConvexCharacter): CharacterDetails => ({ ...c, id: String(c._id), boardId: c.boardId ? String(c.boardId) : undefined })

// Keep only mutation-valid fields; Convex rejects unknown args and undefined.
const SCENE_PATCH_KEYS = ['sceneNumber', 'title', 'description', 'location', 'timeOfDay', 'weather', 'atmosphere', 'elements', 'cameraEnvironment', 'keyframeUrl'] as const
const SHOT_PATCH_KEYS = ['shotNumber', 'shotType', 'duration', 'promptIdea', 'visualPrompt', 'dialogue', 'soundEffects', 'imageUrl', 'imageStatus', 'imageModel', 'audioUrl', 'characterIds', 'order'] as const
const CHARACTER_PATCH_KEYS = ['name', 'handle', 'description', 'imageUrl', 'traits'] as const

function pickDefined<T extends object>(obj: T, keys: readonly (keyof T)[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    const val = obj[k]
    if (val !== undefined) out[k as string] = val
  }
  return out
}

/**
 * Board data lives in local React state for instant edits; every mutation is
 * mirrored to Convex when configured. Convex changes made elsewhere are pulled
 * in on board selection only (single-operator admin tool).
 */
export function useShotboard(initialBoardId?: string | null): ShotboardState {
  const convexEnabled = useConvexEnabled()

  // ---- Convex hooks (always mounted; skipped via "skip" when off/disabled)
  const boardsQuery = useQuery(api.shotboards.list, convexEnabled ? {} : 'skip')
  const [boardId, setBoardId] = useState<string | null>(initialBoardId ?? null)
  const loadQuery = useQuery(
    api.shotboards.load,
    convexEnabled && boardId ? { boardId: boardId as Id<'shotboards'> } : 'skip',
  )

  const mCreateBoard = useMutation(api.shotboards.create)
  const mPatchBoard = useMutation(api.shotboards.patch)
  const mRemoveBoard = useMutation(api.shotboards.remove)
  const mCreateScene = useMutation(api.shotboards.createScene)
  const mPatchScene = useMutation(api.shotboards.patchScene)
  const mRemoveScene = useMutation(api.shotboards.removeScene)
  const mCreateShot = useMutation(api.shotboards.createShot)
  const mPatchShot = useMutation(api.shotboards.patchShot)
  const mRemoveShot = useMutation(api.shotboards.removeShot)
  const mSetShotOrder = useMutation(api.shotboards.setShotOrder)
  const mCreateCharacter = useMutation(api.shotboards.createCharacter)
  const mPatchCharacter = useMutation(api.shotboards.patchCharacter)
  const mRemoveCharacter = useMutation(api.shotboards.removeCharacter)

  const boards: ShotboardDetails[] = useMemo(
    () =>
      (boardsQuery ?? []).map((b) => ({
        id: b._id,
        title: b.title,
        description: b.description,
        aspectRatio: b.aspectRatio,
        updatedAt: b.updatedAt,
      })),
    [boardsQuery],
  )

  const [board, setBoard] = useState<ShotboardDetails | null>(null)
  const [scenes, setScenes] = useState<SceneDetails[]>([])
  const [shots, setShots] = useState<ShotDetails[]>([])
  const [characters, setCharacters] = useState<CharacterDetails[]>([])
  const hydratedBoardRef = useRef<string | null>(null)

  // Hydrate once per board selection from the load query.
  useEffect(() => {
    if (!convexEnabled || !boardId || !loadQuery?.board || hydratedBoardRef.current === boardId) return
    hydratedBoardRef.current = boardId
    setBoard({ id: loadQuery.board._id, title: loadQuery.board.title, description: loadQuery.board.description, aspectRatio: loadQuery.board.aspectRatio })
    setScenes((loadQuery.scenes as unknown as ConvexScene[]).map(toScene))
    setShots((loadQuery.shots as unknown as ConvexShot[]).map(toShot))
    setCharacters((loadQuery.characters as unknown as ConvexCharacter[]).map(toCharacter))
  }, [convexEnabled, boardId, loadQuery])

  const selectBoard = useCallback((id: string | null) => {
    hydratedBoardRef.current = null
    setBoardId(id)
    if (!id) {
      setBoard(null)
      setScenes([])
      setShots([])
      setCharacters([])
    }
  }, [])

  const createBoard = useCallback(
    async (title: string) => {
      if (convexEnabled) {
        const id = String(await mCreateBoard({ title }))
        selectBoard(id)
        return id
      }
      const id = uid()
      setBoard({ id, title })
      setBoardId(id)
      setScenes([])
      setShots([])
      setCharacters([])
      return id
    },
    [convexEnabled, mCreateBoard, selectBoard],
  )

  const patchBoard = useCallback(
    (patch: Partial<ShotboardDetails>) => {
      setBoard((b) => (b ? { ...b, ...patch } : b))
      if (convexEnabled && boardId) {
        const args = pickDefined(patch, ['title', 'description', 'aspectRatio'])
        void mPatchBoard({ boardId: boardId as Id<'shotboards'>, ...args })
      }
    },
    [convexEnabled, boardId, mPatchBoard],
  )

  const deleteBoard = useCallback(() => {
    const id = boardId
    selectBoard(null)
    if (convexEnabled && id) void mRemoveBoard({ boardId: id as Id<'shotboards'> })
  }, [convexEnabled, boardId, selectBoard, mRemoveBoard])

  const addScene = useCallback(() => {
    const sceneNumber = scenes.length ? Math.max(...scenes.map((s) => s.sceneNumber)) + 1 : 1
    if (convexEnabled && boardId) {
      void mCreateScene({ boardId: boardId as Id<'shotboards'>, sceneNumber, title: `Scene ${sceneNumber}` }).then((id) =>
        setScenes((prev) => [...prev, { id: String(id), boardId, sceneNumber, title: `Scene ${sceneNumber}` }]),
      )
    } else if (boardId) {
      setScenes((prev) => [...prev, { id: uid(), boardId, sceneNumber, title: `Scene ${sceneNumber}` }])
    }
  }, [convexEnabled, boardId, scenes, mCreateScene])

  const patchScene = useCallback(
    (sceneId: string, patch: Partial<SceneDetails>) => {
      setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)))
      if (convexEnabled) void mPatchScene({ sceneId: sceneId as Id<'scenes'>, ...pickDefined(patch, SCENE_PATCH_KEYS) })
    },
    [convexEnabled, mPatchScene],
  )

  const deleteScene = useCallback(
    (sceneId: string) => {
      setScenes((prev) => prev.filter((s) => s.id !== sceneId))
      setShots((prev) => prev.filter((s) => s.sceneId !== sceneId))
      if (convexEnabled) void mRemoveScene({ sceneId: sceneId as Id<'scenes'>, })
    },
    [convexEnabled, mRemoveScene],
  )

  const moveScene = useCallback(
    (sceneId: string, dir: -1 | 1) => {
      setScenes((prev) => {
        const sorted = [...prev].sort((a, b) => a.sceneNumber - b.sceneNumber)
        const i = sorted.findIndex((s) => s.id === sceneId)
        const j = i + dir
        if (i < 0 || j < 0 || j >= sorted.length) return prev
        ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
        const renumbered = sorted.map((s, k) => ({ ...s, sceneNumber: k + 1 }))
        if (convexEnabled) for (const s of renumbered) void mPatchScene({ sceneId: s.id as Id<'scenes'>, sceneNumber: s.sceneNumber })
        return renumbered
      })
    },
    [convexEnabled, mPatchScene],
  )

  const addShot = useCallback(
    (sceneId: string) => {
      const sceneShots = shots.filter((s) => s.sceneId === sceneId)
      const shotNumber = sceneShots.length ? Math.max(...sceneShots.map((s) => s.shotNumber)) + 1 : 1
      const order = sceneShots.length ? Math.max(...sceneShots.map((s) => s.order ?? s.shotNumber)) + 1 : 1
      if (convexEnabled && boardId) {
        void mCreateShot({ sceneId: sceneId as Id<'scenes'>, boardId: boardId as Id<'shotboards'>, shotNumber, shotType: 'medium', duration: 8, order }).then(
          (id) => setShots((prev) => [...prev, { id: String(id), sceneId, boardId, shotNumber, shotType: 'medium', duration: 8, order }]),
        )
      } else if (boardId) {
        setShots((prev) => [...prev, { id: uid(), sceneId, boardId, shotNumber, shotType: 'medium', duration: 8, order }])
      }
    },
    [convexEnabled, boardId, shots, mCreateShot],
  )

  const patchShot = useCallback(
    (shotId: string, patch: Partial<ShotDetails>) => {
      setShots((prev) => prev.map((s) => (s.id === shotId ? { ...s, ...patch } : s)))
      if (convexEnabled) {
        const args = pickDefined(patch, SHOT_PATCH_KEYS)
        if (args.characterIds) args.characterIds = (args.characterIds as string[]).map((id) => id as Id<'characters'>)
        void mPatchShot({ shotId: shotId as Id<'shots'>, ...args })
      }
    },
    [convexEnabled, mPatchShot],
  )

  const deleteShot = useCallback(
    (shotId: string) => {
      setShots((prev) => prev.filter((s) => s.id !== shotId))
      if (convexEnabled) void mRemoveShot({ shotId: shotId as Id<'shots'> })
    },
    [convexEnabled, mRemoveShot],
  )

  const moveShot = useCallback(
    (shotId: string, dir: -1 | 1) => {
      setShots((prev) => {
        const shot = prev.find((s) => s.id === shotId)
        if (!shot) return prev
        const siblings = prev.filter((s) => s.sceneId === shot.sceneId).sort((a, b) => (a.order ?? a.shotNumber) - (b.order ?? b.shotNumber))
        const i = siblings.findIndex((s) => s.id === shotId)
        const j = i + dir
        if (i < 0 || j < 0 || j >= siblings.length) return prev
        ;[siblings[i], siblings[j]] = [siblings[j], siblings[i]]
        const renumbered = siblings.map((s, k) => ({ ...s, order: k + 1, shotNumber: k + 1 }))
        const rest = prev.filter((s) => s.sceneId !== shot.sceneId)
        if (convexEnabled) void mSetShotOrder({ sceneId: shot.sceneId as Id<'scenes'>, shotIds: renumbered.map((s) => s.id as Id<'shots'>) })
        return [...rest, ...renumbered]
      })
    },
    [convexEnabled, mSetShotOrder],
  )

  const addCharacter = useCallback(() => {
    const name = `Character ${characters.length + 1}`
    if (convexEnabled && boardId) {
      void mCreateCharacter({ boardId: boardId as Id<'shotboards'>, name }).then((id) =>
        setCharacters((prev) => [...prev, { id: String(id), boardId, name }]),
      )
    } else {
      setCharacters((prev) => [...prev, { id: uid(), boardId: boardId ?? undefined, name }])
    }
  }, [convexEnabled, boardId, characters.length, mCreateCharacter])

  const patchCharacter = useCallback(
    (characterId: string, patch: Partial<CharacterDetails>) => {
      setCharacters((prev) => prev.map((c) => (c.id === characterId ? { ...c, ...patch } : c)))
      if (convexEnabled) void mPatchCharacter({ characterId: characterId as Id<'characters'>, ...pickDefined(patch, CHARACTER_PATCH_KEYS) })
    },
    [convexEnabled, mPatchCharacter],
  )

  const deleteCharacter = useCallback(
    (characterId: string) => {
      setCharacters((prev) => prev.filter((c) => c.id !== characterId))
      setShots((prev) => prev.map((s) => ({ ...s, characterIds: s.characterIds?.filter((id) => id !== characterId) })))
      if (convexEnabled) void mRemoveCharacter({ characterId: characterId as Id<'characters'> })
    },
    [convexEnabled, mRemoveCharacter],
  )

  const toggleShotCharacter = useCallback(
    (shotId: string, characterId: string) => {
      const shot = shots.find((s) => s.id === shotId)
      if (!shot) return
      const ids = new Set(shot.characterIds ?? [])
      if (ids.has(characterId)) ids.delete(characterId)
      else ids.add(characterId)
      patchShot(shotId, { characterIds: [...ids] })
    },
    [shots, patchShot],
  )

  const loading = convexEnabled && !!boardId && !loadQuery?.board

  return {
    boards,
    boardId,
    board,
    scenes: [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber),
    shots,
    characters,
    loading,
    persistent: convexEnabled,
    selectBoard,
    createBoard,
    patchBoard,
    deleteBoard,
    addScene,
    patchScene,
    deleteScene,
    addShot,
    patchShot,
    deleteShot,
    moveShot,
    moveScene,
    addCharacter,
    patchCharacter,
    deleteCharacter,
    toggleShotCharacter,
  }
}
