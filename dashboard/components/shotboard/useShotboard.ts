'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { FunctionReference, FunctionReturnType } from 'convex/server'
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

type Mut<T extends FunctionReference<'mutation'>> = (args: T['_args']) => Promise<T['_returnType']>

/** The set of Convex mutations the shotboard mirrors local edits to. */
interface ShotboardMirror {
  createBoard: Mut<typeof api.shotboards.create>
  patchBoard: Mut<typeof api.shotboards.patch>
  removeBoard: Mut<typeof api.shotboards.remove>
  createScene: Mut<typeof api.shotboards.createScene>
  patchScene: Mut<typeof api.shotboards.patchScene>
  removeScene: Mut<typeof api.shotboards.removeScene>
  createShot: Mut<typeof api.shotboards.createShot>
  patchShot: Mut<typeof api.shotboards.patchShot>
  removeShot: Mut<typeof api.shotboards.removeShot>
  setShotOrder: Mut<typeof api.shotboards.setShotOrder>
  createCharacter: Mut<typeof api.shotboards.createCharacter>
  patchCharacter: Mut<typeof api.shotboards.patchCharacter>
  removeCharacter: Mut<typeof api.shotboards.removeCharacter>
}

type BoardsResult = FunctionReturnType<typeof api.shotboards.list> | undefined
type LoadResult = FunctionReturnType<typeof api.shotboards.load> | undefined

interface ImplArgs {
  boardId: string | null
  setBoardId: (id: string | null) => void
  /** Convex mutations — null in local-only mode (no ConvexProvider mounted). */
  mirror: ShotboardMirror | null
  boardsQuery: BoardsResult
  loadQuery: LoadResult
}

/**
 * Board data lives in local React state for instant edits; when `mirror` is
 * provided every mutation is mirrored to Convex. Convex changes made
 * elsewhere are pulled in on board selection only (single-operator admin tool).
 */
function useShotboardImpl({ boardId, setBoardId, mirror, boardsQuery, loadQuery }: ImplArgs): ShotboardState {
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
    if (!mirror || !boardId || !loadQuery?.board || hydratedBoardRef.current === boardId) return
    hydratedBoardRef.current = boardId
    setBoard({ id: loadQuery.board._id, title: loadQuery.board.title, description: loadQuery.board.description, aspectRatio: loadQuery.board.aspectRatio })
    setScenes((loadQuery.scenes as unknown as ConvexScene[]).map(toScene))
    setShots((loadQuery.shots as unknown as ConvexShot[]).map(toShot))
    setCharacters((loadQuery.characters as unknown as ConvexCharacter[]).map(toCharacter))
  }, [mirror, boardId, loadQuery])

  const selectBoard = useCallback(
    (id: string | null) => {
      hydratedBoardRef.current = null
      setBoardId(id)
      if (!id) {
        setBoard(null)
        setScenes([])
        setShots([])
        setCharacters([])
      }
    },
    [setBoardId],
  )

  const createBoard = useCallback(
    async (title: string) => {
      if (mirror) {
        const id = String(await mirror.createBoard({ title }))
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
    [mirror, selectBoard, setBoardId],
  )

  const patchBoard = useCallback(
    (patch: Partial<ShotboardDetails>) => {
      setBoard((b) => (b ? { ...b, ...patch } : b))
      if (mirror && boardId) {
        const args = pickDefined(patch, ['title', 'description', 'aspectRatio'])
        void mirror.patchBoard({ boardId: boardId as Id<'shotboards'>, ...args })
      }
    },
    [mirror, boardId],
  )

  const deleteBoard = useCallback(() => {
    const id = boardId
    selectBoard(null)
    if (mirror && id) void mirror.removeBoard({ boardId: id as Id<'shotboards'> })
  }, [mirror, boardId, selectBoard])

  const addScene = useCallback(() => {
    const sceneNumber = scenes.length ? Math.max(...scenes.map((s) => s.sceneNumber)) + 1 : 1
    if (mirror && boardId) {
      void mirror.createScene({ boardId: boardId as Id<'shotboards'>, sceneNumber, title: `Scene ${sceneNumber}` }).then((id) =>
        setScenes((prev) => [...prev, { id: String(id), boardId, sceneNumber, title: `Scene ${sceneNumber}` }]),
      )
    } else if (boardId) {
      setScenes((prev) => [...prev, { id: uid(), boardId, sceneNumber, title: `Scene ${sceneNumber}` }])
    }
  }, [mirror, boardId, scenes])

  const patchScene = useCallback(
    (sceneId: string, patch: Partial<SceneDetails>) => {
      setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)))
      if (mirror) void mirror.patchScene({ sceneId: sceneId as Id<'scenes'>, ...pickDefined(patch, SCENE_PATCH_KEYS) })
    },
    [mirror],
  )

  const deleteScene = useCallback(
    (sceneId: string) => {
      setScenes((prev) => prev.filter((s) => s.id !== sceneId))
      setShots((prev) => prev.filter((s) => s.sceneId !== sceneId))
      if (mirror) void mirror.removeScene({ sceneId: sceneId as Id<'scenes'> })
    },
    [mirror],
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
        if (mirror) for (const s of renumbered) void mirror.patchScene({ sceneId: s.id as Id<'scenes'>, sceneNumber: s.sceneNumber })
        return renumbered
      })
    },
    [mirror],
  )

  const addShot = useCallback(
    (sceneId: string) => {
      const sceneShots = shots.filter((s) => s.sceneId === sceneId)
      const shotNumber = sceneShots.length ? Math.max(...sceneShots.map((s) => s.shotNumber)) + 1 : 1
      const order = sceneShots.length ? Math.max(...sceneShots.map((s) => s.order ?? s.shotNumber)) + 1 : 1
      if (mirror && boardId) {
        void mirror.createShot({ sceneId: sceneId as Id<'scenes'>, boardId: boardId as Id<'shotboards'>, shotNumber, shotType: 'medium', duration: 8, order }).then(
          (id) => setShots((prev) => [...prev, { id: String(id), sceneId, boardId, shotNumber, shotType: 'medium', duration: 8, order }]),
        )
      } else if (boardId) {
        setShots((prev) => [...prev, { id: uid(), sceneId, boardId, shotNumber, shotType: 'medium', duration: 8, order }])
      }
    },
    [mirror, boardId, shots],
  )

  const patchShot = useCallback(
    (shotId: string, patch: Partial<ShotDetails>) => {
      setShots((prev) => prev.map((s) => (s.id === shotId ? { ...s, ...patch } : s)))
      if (mirror) {
        const args = pickDefined(patch, SHOT_PATCH_KEYS)
        if (args.characterIds) args.characterIds = (args.characterIds as string[]).map((id) => id as Id<'characters'>)
        void mirror.patchShot({ shotId: shotId as Id<'shots'>, ...args })
      }
    },
    [mirror],
  )

  const deleteShot = useCallback(
    (shotId: string) => {
      setShots((prev) => prev.filter((s) => s.id !== shotId))
      if (mirror) void mirror.removeShot({ shotId: shotId as Id<'shots'> })
    },
    [mirror],
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
        if (mirror) void mirror.setShotOrder({ sceneId: shot.sceneId as Id<'scenes'>, shotIds: renumbered.map((s) => s.id as Id<'shots'>) })
        return [...rest, ...renumbered]
      })
    },
    [mirror],
  )

  const addCharacter = useCallback(() => {
    const name = `Character ${characters.length + 1}`
    if (mirror && boardId) {
      void mirror.createCharacter({ boardId: boardId as Id<'shotboards'>, name }).then((id) =>
        setCharacters((prev) => [...prev, { id: String(id), boardId, name }]),
      )
    } else {
      setCharacters((prev) => [...prev, { id: uid(), boardId: boardId ?? undefined, name }])
    }
  }, [mirror, boardId, characters.length])

  const patchCharacter = useCallback(
    (characterId: string, patch: Partial<CharacterDetails>) => {
      setCharacters((prev) => prev.map((c) => (c.id === characterId ? { ...c, ...patch } : c)))
      if (mirror) void mirror.patchCharacter({ characterId: characterId as Id<'characters'>, ...pickDefined(patch, CHARACTER_PATCH_KEYS) })
    },
    [mirror],
  )

  const deleteCharacter = useCallback(
    (characterId: string) => {
      setCharacters((prev) => prev.filter((c) => c.id !== characterId))
      setShots((prev) => prev.map((s) => ({ ...s, characterIds: s.characterIds?.filter((id) => id !== characterId) })))
      if (mirror) void mirror.removeCharacter({ characterId: characterId as Id<'characters'> })
    },
    [mirror],
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

  const loading = !!mirror && !!boardId && !loadQuery?.board

  return {
    boards,
    boardId,
    board,
    scenes: [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber),
    shots,
    characters,
    loading,
    persistent: !!mirror,
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

/**
 * Convex-backed shotboard. Must only be mounted under ConvexProvider —
 * gates live in ShotboardPage via useConvexEnabled().
 */
export function useConvexShotboard(initialBoardId?: string | null): ShotboardState {
  const [boardId, setBoardId] = useState<string | null>(initialBoardId ?? null)
  const boardsQuery = useQuery(api.shotboards.list, {})
  const loadQuery = useQuery(
    api.shotboards.load,
    boardId ? { boardId: boardId as Id<'shotboards'> } : 'skip',
  )

  const mirror: ShotboardMirror = {
    createBoard: useMutation(api.shotboards.create),
    patchBoard: useMutation(api.shotboards.patch),
    removeBoard: useMutation(api.shotboards.remove),
    createScene: useMutation(api.shotboards.createScene),
    patchScene: useMutation(api.shotboards.patchScene),
    removeScene: useMutation(api.shotboards.removeScene),
    createShot: useMutation(api.shotboards.createShot),
    patchShot: useMutation(api.shotboards.patchShot),
    removeShot: useMutation(api.shotboards.removeShot),
    setShotOrder: useMutation(api.shotboards.setShotOrder),
    createCharacter: useMutation(api.shotboards.createCharacter),
    patchCharacter: useMutation(api.shotboards.patchCharacter),
    removeCharacter: useMutation(api.shotboards.removeCharacter),
  }

  return useShotboardImpl({ boardId, setBoardId, mirror, boardsQuery, loadQuery })
}

/** Local-state shotboard for environments without Convex configured. */
export function useLocalShotboard(initialBoardId?: string | null): ShotboardState {
  const [boardId, setBoardId] = useState<string | null>(initialBoardId ?? null)
  return useShotboardImpl({ boardId, setBoardId, mirror: null, boardsQuery: undefined, loadQuery: undefined })
}
