// Director (minimax/h3-max/director) data-channel protocol.
// Field names/values mirror the model's AsyncAPI contract (protocol_version 1).

export const FAL_SDK_PROXY_URL = '/api/fal/sdk-proxy'

export type DirectorResolution = '480p' | '768p' | '1080p'
export type DirectorAspectRatio = '16:9' | '9:16' | '1:1'
export type DirectorAudioBitrate = 96000 | 128000 | 192000

/** Settings locked for the life of a session; sent once in `configure`. */
export interface DirectorSettings {
  resolution: DirectorResolution
  aspectRatio: DirectorAspectRatio
  /** Prior segment prompts kept as context (1-50). */
  memory: number
  seed: number | null
  audioBitrate: DirectorAudioBitrate
  /** Exact first frame. */
  imageUrl: string
  /** One-shot exact final frame for the first chunk. Mutually exclusive with script/audio in configure. */
  endImageUrl: string
  /** Startup FL2VA target audio. Mutually exclusive with script in configure. */
  audioUrl: string
}

export const DEFAULT_DIRECTOR_SETTINGS: DirectorSettings = {
  resolution: '768p',
  aspectRatio: '16:9',
  memory: 12,
  seed: null,
  audioBitrate: 192000,
  imageUrl: '',
  endImageUrl: '',
  audioUrl: '',
}

/** A timed direction on the video clock (whole seconds from script start). */
export interface ScriptBeat {
  offset: number
  prompt: string
  endImageUrl: string
  audioUrl: string
}

export interface ScriptBeatWire {
  offset: number
  prompt?: string
  end_image_url?: string
  audio_url?: string
}

export function beatsToWire(beats: ScriptBeat[]): ScriptBeatWire[] {
  return beats
    .filter((b) => b.prompt.trim() || b.endImageUrl.trim() || b.audioUrl.trim())
    .sort((a, b) => a.offset - b.offset)
    .map((b) => ({
      offset: Math.max(0, Math.floor(b.offset)),
      ...(b.prompt.trim() ? { prompt: b.prompt.trim() } : {}),
      ...(b.endImageUrl.trim() ? { end_image_url: b.endImageUrl.trim() } : {}),
      ...(b.audioUrl.trim() ? { audio_url: b.audioUrl.trim() } : {}),
    }))
}

export interface ConfigureWire {
  protocol_version: 1
  type: 'configure'
  prompt: string
  prompt_version: number
  resolution: DirectorResolution
  aspect_ratio: DirectorAspectRatio
  memory: number
  audio_bitrate: DirectorAudioBitrate
  seed?: number
  image_url?: string
  end_image_url?: string
  audio_url?: string
  script?: ScriptBeatWire[]
}

export interface PromptWire {
  protocol_version?: 1
  type: 'prompt'
  prompt_version: number
  prompt?: string
  replan?: boolean
  end_image_url?: string
  audio_url?: string
  audio_behavior?: 'replace' | 'queue'
  script?: ScriptBeatWire[]
  script_mode?: 'replace' | 'append'
}
