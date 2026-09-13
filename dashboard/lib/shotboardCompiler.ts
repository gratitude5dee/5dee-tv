import type { ScriptBeat } from './directorProtocol'
import type { CharacterDetails, SceneDetails, ShotDetails } from './shotboardTypes'
import { shotTypeLabel } from './shotboardTypes'

export const DEFAULT_SHOT_SECONDS = 8

function sceneContextLine(scene: SceneDetails): string {
  const parts = [
    scene.title || `Scene ${scene.sceneNumber}`,
    scene.location,
    scene.timeOfDay,
    scene.weather,
    scene.atmosphere,
    scene.elements?.length ? scene.elements.join(', ') : undefined,
    scene.cameraEnvironment,
  ]
    .map((s) => s?.trim())
    .filter(Boolean)
  return parts.length ? `[${parts.join(' · ')}]` : ''
}

function characterHandles(shot: ShotDetails, byId: Map<string, CharacterDetails>): string {
  const names = (shot.characterIds ?? [])
    .map((id) => byId.get(id))
    .filter((c): c is CharacterDetails => !!c)
    .map((c) => c.handle?.trim() || c.name.trim())
    .filter(Boolean)
  return names.length ? `Featuring ${names.join(', ')}.` : ''
}

function shotPrompt(shot: ShotDetails, scene: SceneDetails, isFirstOfScene: boolean, byId: Map<string, CharacterDetails>): string {
  const parts = [
    isFirstOfScene ? sceneContextLine(scene) : '',
    shotTypeLabel(shot.shotType),
    shot.promptIdea?.trim(),
    !shot.promptIdea?.trim() ? shot.visualPrompt?.trim() : undefined,
    characterHandles(shot, byId),
    shot.dialogue?.trim() ? `Dialogue: "${shot.dialogue.trim()}"` : '',
    shot.soundEffects?.trim() ? `SFX: ${shot.soundEffects.trim()}` : '',
  ]
  return parts.filter(Boolean).join(' — ').replace(/\s+/g, ' ').trim()
}

/** Orders shots by (sceneNumber, order ?? shotNumber) across the board. */
export function orderedShots(scenes: SceneDetails[], shots: ShotDetails[]): { scene: SceneDetails; shot: ShotDetails; firstOfScene: boolean }[] {
  const sceneOrder = new Map(scenes.map((s) => [s.id, s.sceneNumber]))
  const sorted = [...shots].sort((a, b) => {
    const sa = sceneOrder.get(a.sceneId) ?? 0
    const sb = sceneOrder.get(b.sceneId) ?? 0
    if (sa !== sb) return sa - sb
    return (a.order ?? a.shotNumber) - (b.order ?? b.shotNumber)
  })
  let lastScene = ''
  return sorted.map((shot) => {
    const scene = scenes.find((s) => s.id === shot.sceneId)
    const firstOfScene = shot.sceneId !== lastScene
    lastScene = shot.sceneId
    return { scene: scene!, shot, firstOfScene }
  }).filter((r) => r.scene)
}

/**
 * Compile a shotboard to Director script beats: each shot's duration stacks into
 * `offset` seconds, its generated keyframe becomes the beat's `end_image_url`,
 * and its audio becomes `audio_url`.
 */
export function compileShotsToBeats(
  scenes: SceneDetails[],
  shots: ShotDetails[],
  characters: CharacterDetails[],
): ScriptBeat[] {
  const byId = new Map(characters.map((c) => [c.id, c]))
  let clock = 0
  return orderedShots(scenes, shots).map(({ scene, shot, firstOfScene }) => {
    const offset = clock
    clock += Math.max(1, Math.floor(shot.duration ?? DEFAULT_SHOT_SECONDS))
    return {
      offset,
      prompt: shotPrompt(shot, scene, firstOfScene, byId),
      endImageUrl: shot.imageUrl ?? '',
      audioUrl: shot.audioUrl ?? '',
    }
  })
}

/** Total playable runtime using the same whole-second duration rules as compilation. */
export function shotboardRuntimeSeconds(scenes: SceneDetails[], shots: ShotDetails[]): number {
  return orderedShots(scenes, shots).reduce(
    (total, { shot }) => total + Math.max(1, Math.floor(shot.duration ?? DEFAULT_SHOT_SECONDS)),
    0,
  )
}

/** First shot's keyframe doubles as the session's opening frame. */
export function firstFrameUrl(scenes: SceneDetails[], shots: ShotDetails[]): string {
  return orderedShots(scenes, shots)[0]?.shot.imageUrl ?? ''
}
