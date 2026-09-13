'use client'

import { useMemo, useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clapperboard, Plus, Send, Trash2 } from 'lucide-react'
import SceneSection from './SceneSection'
import SceneSidebar from './SceneSidebar'
import SceneGallery from './SceneGallery'
import CharacterPanel from './CharacterPanel'
import ImageModelSelect from './ImageModelSelect'
import { useConvexShotboard, useLocalShotboard } from './useShotboard'
import { useConvexEnabled } from '../ConvexClientProvider'
import { generateImage } from '../../lib/imageGen'
import { DEFAULT_IMAGE_MODEL, getImageModel } from '../../lib/imageModels'
import { compileShotsToBeats, shotboardRuntimeSeconds } from '../../lib/shotboardCompiler'
import { shotTypeLabel, type CharacterDetails, type LocationDetails, type SceneDetails, type ShotDetails } from '../../lib/shotboardTypes'

const boardAspect = (aspectRatio?: string) => aspectRatio || '16:9'

export default function ShotboardPage() {
  const convexEnabled = useConvexEnabled()
  // Convex hooks cannot mount without a ConvexProvider, so the two variants
  // are separate components — both render the same view.
  return convexEnabled ? <ConvexShotboard /> : <LocalShotboard />
}

function ConvexShotboard() {
  const params = useSearchParams()
  const expand = useAction(api.promptExpansion.start)
  const prepare = useMutation(api.director.prepare)
  const locations = useQuery(api.locations.list, {})
  return <ShotboardView sb={useConvexShotboard(params.get('board'))} expandPrompt={expand} prepareDirector={prepare} locations={(locations ?? []).filter((l) => !l.archivedAt).map((l) => ({ id: String(l._id), name: l.name, description: l.description, imageUrl: l.imageUrl }))} />
}

function LocalShotboard() {
  const params = useSearchParams()
  return <ShotboardView sb={useLocalShotboard(params.get('board'))} />
}

type ExpandPrompt = (args: { kind: 'image' | 'director'; source: string; context?: string; requestId: string; sourceRevision?: number; shotId?: Id<'shots'> }) => Promise<{ prompt: string }>
type PrepareDirector = (args: { boardId: Id<'shotboards'>; shotIds?: Id<'shots'>[]; expectedRevision?: number }) => Promise<Id<'directorTransfers'>>

function ShotboardView({ sb, expandPrompt, prepareDirector, locations = [] }: { sb: ReturnType<typeof useConvexShotboard>; expandPrompt?: ExpandPrompt; prepareDirector?: PrepareDirector; locations?: LocationDetails[] }) {

  const router = useRouter()
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL)
  const [imageQuality, setImageQuality] = useState<string | undefined>(undefined)
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [preparingDirector, setPreparingDirector] = useState(false)

  const selectedScene = sb.scenes.find((s) => s.id === selectedSceneId) ?? sb.scenes[0] ?? null

  const beatPreview = useMemo(
    () => compileShotsToBeats(sb.scenes, sb.shots, sb.characters),
    [sb.scenes, sb.shots, sb.characters],
  )
  const runtimeSeconds = useMemo(
    () => shotboardRuntimeSeconds(sb.scenes, sb.shots),
    [sb.scenes, sb.shots],
  )

  const setGen = (id: string, on: boolean) =>
    setGenerating((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const characterImageRefs = (shot: ShotDetails) =>
    (shot.characterIds ?? [])
      .map((id) => sb.characters.find((c) => c.id === id)?.imageUrl)
      .filter((u): u is string => !!u)

  const generateShotImage = async (shot: ShotDetails) => {
    const prompt = (shot.expandedPrompt || shot.visualPrompt || shot.promptIdea || '').trim()
    if (!prompt) {
      setStatus('Give the shot a prompt or direction first')
      return
    }
    const model = getImageModel(shot.imageModel ?? imageModel)
    const scene = sb.scenes.find((s) => s.id === shot.sceneId)
    const refs = [shot.imageUrl, scene?.keyframeUrl, ...characterImageRefs(shot)].filter((u): u is string => !!u)
    const mode = refs.length ? 'edit' : 't2i'
    setGen(shot.id, true)
    sb.patchShot(shot.id, { imageStatus: 'generating' })
    try {
      const url = await generateImage({
        modelId: shot.imageModel ?? model.id,
        mode: mode === 'edit' && model.kind !== 't2i' ? 'edit' : 't2i',
        prompt: `${shotTypeLabel(shot.shotType)}: ${prompt}`,
        refImages: refs,
        aspectRatio: boardAspect(sb.board?.aspectRatio),
        quality: imageQuality,
      })
      sb.patchShot(shot.id, { imageUrl: url, imageStatus: 'completed', imageModel: model.id })
      setStatus(null)
    } catch (e) {
      sb.patchShot(shot.id, { imageStatus: 'failed' })
      setStatus(`Image generation failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setGen(shot.id, false)
    }
  }

  const expandShotPrompt = async (shot: ShotDetails) => {
    const source = (shot.expandedPrompt || shot.promptIdea || '').trim()
    if (!source) return
    if (!expandPrompt) { setStatus('Prompt expansion requires an authenticated Convex connection'); return }
    const scene = sb.scenes.find((s) => s.id === shot.sceneId)
    const characters = (shot.characterIds ?? []).map((id) => sb.characters.find((c) => c.id === id)).filter(Boolean)
    const context = [scene?.title, scene?.description, scene?.location, ...characters.map((c) => `${c?.handle || c?.name}: ${c?.description || ''}`)].filter(Boolean).join('\n')
    const sourceRevision = sb.board?.updatedAt
    try {
      const result = await expandPrompt({ kind: 'image', source, context, requestId: `${shot.id}-${Date.now()}`, sourceRevision, shotId: shot.id as Id<'shots'> })
      sb.patchShot(shot.id, { expandedPrompt: result.prompt, expandedPromptRevision: sourceRevision })
      setStatus(null)
    } catch (e) { setStatus(`Prompt expansion failed: ${e instanceof Error ? e.message : String(e)}`) }
  }

  const generateSceneKeyframe = async (scene: SceneDetails) => {
    const prompt = [scene.title, scene.description, scene.location, scene.timeOfDay, scene.weather, scene.atmosphere]
      .filter(Boolean)
      .join(' — ')
    if (!prompt.trim()) {
      setStatus('Add a scene description first')
      return
    }
    setGen(scene.id, true)
    try {
      const url = await generateImage({
        modelId: imageModel,
        mode: scene.keyframeUrl ? 'edit' : 't2i',
        prompt,
        refImages: scene.keyframeUrl ? [scene.keyframeUrl] : undefined,
        aspectRatio: boardAspect(sb.board?.aspectRatio),
        quality: imageQuality,
      })
      sb.patchScene(scene.id, { keyframeUrl: url })
      setStatus(null)
    } catch (e) {
      setStatus(`Keyframe generation failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setGen(scene.id, false)
    }
  }

  const generateCharacterPortrait = async (character: CharacterDetails) => {
    const prompt = `Character portrait: ${character.name}${character.description ? ` — ${character.description}` : ''}. Clean neutral background, centered.`
    setGen(character.id, true)
    try {
      const url = await generateImage({
        modelId: imageModel,
        mode: character.imageUrl ? 'edit' : 't2i',
        prompt: character.imageUrl ? `Keep the same character; refine the portrait.` : prompt,
        refImages: character.imageUrl ? [character.imageUrl] : undefined,
        aspectRatio: '1:1',
        quality: imageQuality,
      })
      sb.patchCharacter(character.id, { imageUrl: url })
      setStatus(null)
    } catch (e) {
      setStatus(`Portrait generation failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setGen(character.id, false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="fal-card">
        <div className="fal-card-header">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-fal-gray-500 dark:text-fal-gray-400" />
              <h3 className="fal-card-title">Shotboard</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sb.persistent && (
                <select
                  value={sb.boardId ?? ''}
                  onChange={(e) => sb.selectBoard(e.target.value || null)}
                  className="rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1.5 text-xs bg-white dark:bg-fal-gray-900"
                  title="Saved shotboards"
                >
                  <option value="">New / unsaved board</option>
                  {sb.boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title || 'Untitled'}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => void sb.createBoard('Untitled Shotboard')}
                className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New board</span>
              </button>
              <ImageModelSelect modelId={imageModel} quality={imageQuality} onChange={setImageModel} onQualityChange={setImageQuality} />
              {sb.boardId && sb.persistent && (
                <button
                  type="button"
                  onClick={() => {
                    setPreparingDirector(true)
                    void sb.flush().then(async () => {
                      if (!prepareDirector || !sb.boardId) throw new Error('Director transfer is unavailable')
                      const transferId = await prepareDirector({ boardId: sb.boardId as Id<'shotboards'>, expectedRevision: sb.board?.revision })
                      router.push(`/admin?transfer=${String(transferId)}`)
                    }).catch((e) => setStatus(`Could not prepare Director transfer: ${e instanceof Error ? e.message : String(e)}`)).finally(() => setPreparingDirector(false))
                  }}
                  disabled={preparingDirector}
                  className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5"
                  title="Load this board's compiled script in the Director"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{preparingDirector ? 'Preparing…' : 'Send to Director'}</span>
                </button>
              )}
              {sb.boardId && sb.persistent && (
                <button
                  type="button"
                  onClick={sb.deleteBoard}
                  className="p-1.5 text-fal-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  aria-label="Delete board"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="fal-card-content">
          <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">
            Build scenes of shots with generated keyframes — the board compiles to the timed script the
            Director runs. {beatPreview.length > 0 && <span className="font-medium">{beatPreview.length} beats · {runtimeSeconds}s runtime.</span>}
          </p>
          {status && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{status}</p>}
          {!sb.persistent && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Convex not configured — this board lives only in this page&rsquo;s state and cannot be sent to Director.</p>
          )}
        </div>
      </div>

      {sb.loading ? (
        <div className="fal-card">
          <div className="fal-card-content text-xs text-fal-gray-500 dark:text-fal-gray-400">
            Loading shotboard…
          </div>
        </div>
      ) : sb.boardId ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <div className="fal-card">
            <div className="fal-card-content space-y-4">
              <SceneSidebar
                scene={selectedScene}
                boardTitle={sb.board?.title ?? ''}
                boardDescription={sb.board?.description}
                onBoardPatch={sb.patchBoard}
                onScenePatch={(patch) => selectedScene && sb.patchScene(selectedScene.id, patch)}
                onGenerateKeyframe={generateSceneKeyframe}
                generatingKeyframe={selectedScene ? generating.has(selectedScene.id) : false}
              />
              <CharacterPanel
                characters={sb.characters}
                selectedId={selectedCharacterId}
                generatingIds={generating}
                onSelect={setSelectedCharacterId}
                onAdd={sb.addCharacter}
                onPatch={sb.patchCharacter}
                onDelete={sb.deleteCharacter}
                onGenerateImage={generateCharacterPortrait}
              />
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <SceneGallery
              scenes={sb.scenes}
              shots={sb.shots}
              selectedSceneId={selectedScene?.id ?? null}
              onSelect={setSelectedSceneId}
            />
            {sb.scenes.map((scene) => (
              <SceneSection
                key={scene.id}
                scene={scene}
                shots={sb.shots.filter((s) => s.sceneId === scene.id)}
                characters={sb.characters}
                selected={selectedScene?.id === scene.id}
                generatingIds={generating}
                onSelect={() => setSelectedSceneId(scene.id)}
                onPatchScene={(patch) => sb.patchScene(scene.id, patch)}
                onDeleteScene={() => sb.deleteScene(scene.id)}
                onMoveScene={(dir) => sb.moveScene(scene.id, dir)}
                onAddShot={() => sb.addShot(scene.id)}
                onPatchShot={sb.patchShot}
                onDeleteShot={sb.deleteShot}
                onMoveShot={sb.moveShot}
                onGenerateImage={generateShotImage}
                onToggleCharacter={sb.toggleShotCharacter}
                onExpandPrompt={expandShotPrompt}
                locations={locations}
              />
            ))}
            <button
              type="button"
              onClick={sb.addScene}
              className="fal-button-secondary flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add scene</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="fal-card">
          <div className="fal-card-content text-xs text-fal-gray-500 dark:text-fal-gray-400">
            Create a board or pick a saved one to start laying out scenes and shots.
          </div>
        </div>
      )}
    </div>
  )
}
