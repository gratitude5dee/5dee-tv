import type { ScriptBeat } from './directorProtocol'
import type { CharacterDetails, LocationDetails, SceneDetails, ShotDetails, StyleDetails } from './shotboardTypes'
import { shotTypeLabel } from './shotboardTypes'

export const DEFAULT_SHOT_SECONDS = 8

function sceneContextLine(scene: SceneDetails, locations: Map<string, LocationDetails>, style?: StyleDetails): string {
  const selectedLocation = scene.locationId ? locations.get(scene.locationId) : undefined
  const parts = [
    scene.title || `Scene ${scene.sceneNumber}`,
    selectedLocation?.name,
    scene.location,
    selectedLocation?.description,
    style?.name,
    style?.description,
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

function shotPrompt(shot: ShotDetails, scene: SceneDetails, isFirstOfScene: boolean, byId: Map<string, CharacterDetails>, locations: Map<string, LocationDetails>, style?: StyleDetails): string {
  const parts = [
    isFirstOfScene ? sceneContextLine(scene, locations, style) : '',
    shotTypeLabel(shot.shotType),
    shot.directorPrompt?.trim() || shot.expandedPrompt?.trim() || shot.visualPrompt?.trim() || shot.promptIdea?.trim(),
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
 * Compile a shotboard to Director script beats. Text/audio starts at a shot's
 * start; the first image is the session opening frame and later images arrive
 * at their shot end. Coincident prompt/image events are merged.
 */
export function compileShotsToBeats(
  scenes: SceneDetails[],
  shots: ShotDetails[],
  characters: CharacterDetails[],
  locations: LocationDetails[] = [],
  style?: StyleDetails,
): ScriptBeat[] {
  const byId = new Map(characters.map((c) => [c.id, c]))
  const locationsById = new Map(locations.map((location) => [location.id, location]))
  let clock = 0
  const events = new Map<number, ScriptBeat>()
  orderedShots(scenes, shots).forEach(({ scene, shot, firstOfScene }, index) => {
    const offset = clock
    const duration = Math.max(1, Math.floor(shot.duration ?? DEFAULT_SHOT_SECONDS))
    const existing = events.get(offset) ?? { offset, prompt: '', endImageUrl: '', audioUrl: '' }
    existing.prompt = shotPrompt(shot, scene, firstOfScene, byId, locationsById, style)
    existing.audioUrl = shot.audioUrl ?? ''
    events.set(offset, existing)
    // The first image is supplied as image_url on configure. Later images are
    // arrival anchors at the end of their own shot.
    if (index > 0 && shot.imageUrl) {
      const endpoint = clock + duration
      const arrival = events.get(endpoint) ?? { offset: endpoint, prompt: '', endImageUrl: '', audioUrl: '' }
      arrival.endImageUrl = shot.imageUrl
      events.set(endpoint, arrival)
    }
    clock += duration
  })
  return [...events.values()].sort((a, b) => a.offset - b.offset)
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
