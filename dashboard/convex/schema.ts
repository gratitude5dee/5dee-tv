import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const sessionModel = v.union(
  v.literal('director'),
  v.literal('ltxv1'),
  v.literal('ltx-2.3'),
  v.literal('ltx-2.3-local'),
  v.literal('ltx-2.3-condition'),
)

export const sessionStatus = v.union(
  v.literal('opening'),
  v.literal('live'),
  v.literal('ended'),
  v.literal('failed'),
)

export default defineSchema({
  // One row per livestream session (a Director WebRTC peer or an LTX start_stream run).
  sessions: defineTable({
    model: sessionModel,
    status: sessionStatus,
    outputMode: v.union(v.literal('webrtc'), v.literal('rtmp')),
    config: v.any(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index('by_startedAt', ['startedAt']),

  // Short video segments. Director clips are one per applied direction; the URL points
  // at the MediaRecorder capture stored in Convex file storage.
  clips: defineTable({
    sessionId: v.optional(v.id('sessions')),
    storageId: v.optional(v.id('_storage')),
    url: v.optional(v.string()),
    prompt: v.string(),
    promptVersion: v.optional(v.number()),
    chunkIndex: v.number(),
    durationSeconds: v.number(),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    source: sessionModel,
    createdAt: v.number(),
  })
    .index('by_createdAt', ['createdAt'])
    .index('by_session', ['sessionId', 'chunkIndex']),

  // Full-session recordings captured from the browser's WebRTC stream.
  recordings: defineTable({
    sessionId: v.optional(v.id('sessions')),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    sizeBytes: v.number(),
    durationSeconds: v.number(),
    model: sessionModel,
    title: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_createdAt', ['createdAt'])
    .index('by_session', ['sessionId']),

  // Every direction sent to (or acknowledged by) the Director model.
  promptEvents: defineTable({
    sessionId: v.id('sessions'),
    kind: v.union(
      v.literal('configure'),
      v.literal('prompt'),
      v.literal('prompt_applied'),
      v.literal('error'),
    ),
    prompt: v.optional(v.string()),
    promptVersion: v.optional(v.number()),
    detail: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_session', ['sessionId', 'createdAt']),

  // LTX generation parameter history (mirrors video.generation_params_history from the
  // fal app metrics socket so it survives page reloads and app restarts).
  generations: defineTable({
    sessionId: v.optional(v.id('sessions')),
    generationId: v.number(),
    timestamp: v.number(),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    width: v.number(),
    height: v.number(),
    numFrames: v.number(),
    strength: v.optional(v.number()),
    guidanceScale: v.optional(v.number()),
    timesteps: v.optional(v.array(v.number())),
    createdAt: v.number(),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_generation', ['generationId', 'timestamp']),

  // Admin-uploaded songs usable as Director audio references (audio_url).
  tracks: defineTable({
    name: v.string(),
    storageId: v.id('_storage'),
    // Artwork is independently stored so audio remains reusable if a cover is replaced.
    coverStorageId: v.optional(v.id('_storage')),
    mimeType: v.string(),
    sizeBytes: v.number(),
    createdAt: v.number(),
  }).index('by_createdAt', ['createdAt']),

  // Twitch Helix samples captured by the analytics page poller.
  twitchStats: defineTable({
    channel: v.string(),
    viewerCount: v.number(),
    followerCount: v.optional(v.number()),
    isLive: v.boolean(),
    title: v.optional(v.string()),
    gameName: v.optional(v.string()),
    capturedAt: v.number(),
  }).index('by_channel', ['channel', 'capturedAt']),

  // Saved shotboards (script templates) edited on /admin/shotboard and compiled
  // into Director script beats.
  shotboards: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
    revision: v.optional(v.number()),
    styleId: v.optional(v.id('styles')),
    seriesId: v.optional(v.id('series')),
    soundtrackTrackId: v.optional(v.id('tracks')),
    soundtrackOffsetSeconds: v.optional(v.number()),
    soundtrackVolume: v.optional(v.number()),
    soundtrackLoop: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_createdAt', ['createdAt']),

  scenes: defineTable({
    boardId: v.id('shotboards'),
    sceneNumber: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    timeOfDay: v.optional(v.string()),
    weather: v.optional(v.string()),
    atmosphere: v.optional(v.string()),
    elements: v.optional(v.array(v.string())),
    cameraEnvironment: v.optional(v.string()),
    keyframeUrl: v.optional(v.string()),
    locationId: v.optional(v.id('locations')),
  }).index('by_board', ['boardId', 'sceneNumber']),

  shots: defineTable({
    sceneId: v.id('scenes'),
    boardId: v.id('shotboards'),
    shotNumber: v.number(),
    shotType: v.optional(v.string()),
    duration: v.optional(v.number()),
    promptIdea: v.optional(v.string()),
    visualPrompt: v.optional(v.string()),
    dialogue: v.optional(v.string()),
    soundEffects: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStatus: v.optional(v.string()),
    imageModel: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    characterIds: v.optional(v.array(v.id('characters'))),
    order: v.optional(v.number()),
    expandedPrompt: v.optional(v.string()),
    expandedPromptHash: v.optional(v.string()),
    expandedPromptRevision: v.optional(v.number()),
    directorPrompt: v.optional(v.string()),
    directorPromptHash: v.optional(v.string()),
    directorPromptRevision: v.optional(v.number()),
  })
    .index('by_scene', ['sceneId', 'shotNumber'])
    .index('by_board', ['boardId']),

  characters: defineTable({
    boardId: v.optional(v.id('shotboards')),
    name: v.string(),
    handle: v.optional(v.string()),
    description: v.optional(v.string()),
    /** Stable visual identity. Outfit selections are intentionally separate. */
    appearance: v.optional(v.string()),
    identityNotes: v.optional(v.string()),
    defaultWardrobe: v.optional(v.string()),
    voiceNotes: v.optional(v.string()),
    visualStyle: v.optional(v.string()),
    identityLocked: v.optional(v.boolean()),
    starterKey: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    primaryStorageId: v.optional(v.id('_storage')),
    traits: v.optional(v.any()),
    referenceStorageIds: v.optional(v.array(v.id('_storage'))),
    revision: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_board', ['boardId'])
    .index('by_board_and_archivedAt', ['boardId', 'archivedAt'])
    .index('by_handle', ['handle'])
    .index('by_starterKey', ['starterKey']),

  styles: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    referenceStorageIds: v.optional(v.array(v.id('_storage'))),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_updatedAt', ['updatedAt']),

  locations: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    handle: v.optional(v.string()),
    kind: v.optional(v.union(v.literal('landmark'), v.literal('neighborhood'), v.literal('coast'), v.literal('interior'), v.literal('other'))),
    architecture: v.optional(v.string()),
    defaultTimeOfDay: v.optional(v.string()),
    defaultWeather: v.optional(v.string()),
    visualStyle: v.optional(v.string()),
    starterKey: v.optional(v.string()),
    styleId: v.optional(v.id('styles')),
    imageUrl: v.optional(v.string()),
    primaryStorageId: v.optional(v.id('_storage')),
    referenceStorageIds: v.optional(v.array(v.id('_storage'))),
    revision: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_updatedAt', ['updatedAt'])
    .index('by_archivedAt_and_updatedAt', ['archivedAt', 'updatedAt'])
    .index('by_handle', ['handle'])
    .index('by_starterKey', ['starterKey']),

  // Immutable history for generated/uploaded reference media. The asset itself
  // remains in Convex file storage; public delivery URLs are resolved on read.
  assetVersions: defineTable({
    targetType: v.union(v.literal('character'), v.literal('location')),
    characterId: v.optional(v.id('characters')),
    locationId: v.optional(v.id('locations')),
    storageId: v.optional(v.id('_storage')),
    externalUrl: v.optional(v.string()),
    role: v.union(v.literal('identity'), v.literal('wardrobe'), v.literal('style'), v.literal('environment'), v.literal('sheet')),
    modelId: v.optional(v.string()),
    prompt: v.optional(v.string()),
    sourceRevision: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_characterId_and_createdAt', ['characterId', 'createdAt'])
    .index('by_locationId_and_createdAt', ['locationId', 'createdAt']),

  // The browser performs the authenticated Fal request through the existing
  // server proxy; this row makes each paid attempt idempotent and observable.
  imageGenerationJobs: defineTable({
    targetType: v.union(v.literal('character'), v.literal('location')),
    characterId: v.optional(v.id('characters')),
    locationId: v.optional(v.id('locations')),
    requestId: v.string(),
    sourceRevision: v.number(),
    sourceHash: v.string(),
    status: v.union(v.literal('running'), v.literal('completed'), v.literal('failed')),
    modelId: v.string(),
    prompt: v.string(),
    outputStorageId: v.optional(v.id('_storage')),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_requestId', ['requestId'])
    .index('by_characterId_and_createdAt', ['characterId', 'createdAt'])
    .index('by_locationId_and_createdAt', ['locationId', 'createdAt']),

  series: defineTable({
    name: v.string(),
    bible: v.optional(v.string()),
    canonVersion: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_updatedAt', ['updatedAt']),

  promptJobs: defineTable({
    kind: v.union(v.literal('image'), v.literal('director')),
    shotId: v.optional(v.id('shots')),
    status: v.union(v.literal('queued'), v.literal('running'), v.literal('completed'), v.literal('failed')),
    sourceRevision: v.optional(v.number()),
    sourceHash: v.string(),
    requestId: v.string(),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
    coordinatorModel: v.optional(v.string()),
    workerModel: v.optional(v.string()),
    templateVersion: v.string(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    provider: v.optional(v.string()),
    phase: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_requestId', ['requestId']).index('by_shot', ['shotId', 'createdAt']).index('by_sourceHash', ['sourceHash', 'kind', 'sourceRevision']),

  // Immutable, validated handoff snapshots. Editing a board after preparation
  // never mutates a transfer that is already loaded in Script preview.
  directorTransfers: defineTable({
    boardId: v.id('shotboards'),
    sourceRevision: v.number(),
    shotIds: v.array(v.id('shots')),
    beats: v.array(v.object({
      offset: v.number(),
      prompt: v.string(),
      endImageUrl: v.string(),
      audioUrl: v.string(),
    })),
    firstFrameUrl: v.string(),
    createdAt: v.number(),
  }).index('by_board', ['boardId', 'createdAt']),

  // Editable screenplay-generation jobs. A draft never becomes canon until
  // an explicit episode approval mutation is committed.
  storyboardJobs: defineTable({
    premise: v.string(),
    seriesId: v.optional(v.id('series')),
    boardId: v.optional(v.id('shotboards')),
    duration: v.number(),
    shotCount: v.number(),
    includeDialogue: v.boolean(),
    status: v.union(v.literal('queued'), v.literal('completed'), v.literal('failed')),
    provider: v.string(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_createdAt', ['createdAt']),

  // Versioned episode snapshots and accepted facts for continuity review.
  episodes: defineTable({
    seriesId: v.id('series'),
    title: v.string(),
    revision: v.number(),
    status: v.union(v.literal('draft'), v.literal('approved')),
    draftText: v.optional(v.string()),
    shotPlan: v.optional(v.any()),
    acceptedFacts: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_series', ['seriesId', 'updatedAt']),
})
