// Client-side shotboard model. Ids are plain strings so the editor works
// identically with Convex ids and locally generated uuids (no-Convex mode).

export type ImageStatus = 'pending' | 'prompt_ready' | 'generating' | 'completed' | 'failed'

export interface ShotboardDetails {
  id: string
  title: string
  description?: string
  aspectRatio?: string
  revision?: number
  styleId?: string
  seriesId?: string
  soundtrackTrackId?: string
  soundtrackOffsetSeconds?: number
  soundtrackVolume?: number
  soundtrackLoop?: boolean
  updatedAt?: number
}

export interface SceneDetails {
  id: string
  boardId: string
  sceneNumber: number
  title?: string
  description?: string
  location?: string
  timeOfDay?: string
  weather?: string
  atmosphere?: string
  elements?: string[]
  cameraEnvironment?: string
  keyframeUrl?: string
  locationId?: string
}

export interface LocationDetails {
  id: string
  name: string
  description?: string
  styleId?: string
  imageUrl?: string
}

export interface StyleDetails {
  id: string
  name: string
  description?: string
}

export interface ShotDetails {
  id: string
  sceneId: string
  boardId: string
  shotNumber: number
  shotType?: string
  /** Seconds this shot holds; drives the compiled beat offset. */
  duration?: number
  promptIdea?: string
  visualPrompt?: string
  expandedPrompt?: string
  expandedPromptHash?: string
  expandedPromptRevision?: number
  directorPrompt?: string
  directorPromptHash?: string
  directorPromptRevision?: number
  dialogue?: string
  soundEffects?: string
  imageUrl?: string
  imageStatus?: ImageStatus
  imageModel?: string
  audioUrl?: string
  characterIds?: string[]
  order?: number
}

export interface CharacterDetails {
  id: string
  boardId?: string
  name: string
  handle?: string
  description?: string
  imageUrl?: string
  traits?: Record<string, unknown>
}

export const SHOT_TYPE_OPTIONS = [
  { value: 'wide', label: 'Wide Shot' },
  { value: 'medium', label: 'Medium Shot' },
  { value: 'close', label: 'Close-Up' },
  { value: 'extreme_close_up', label: 'Extreme Close-Up' },
  { value: 'establishing', label: 'Establishing Shot' },
  { value: 'pov', label: 'POV Shot' },
  { value: 'over_the_shoulder', label: 'Over-the-Shoulder' },
  { value: 'aerial', label: 'Aerial Shot' },
  { value: 'low_angle', label: 'Low Angle' },
  { value: 'high_angle', label: 'High Angle' },
  { value: 'dutch_angle', label: 'Dutch Angle' },
  { value: 'tracking', label: 'Tracking Shot' },
  { value: 'insert', label: 'Insert Shot' },
] as const

export function shotTypeLabel(value?: string): string {
  return SHOT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? 'Medium Shot'
}
