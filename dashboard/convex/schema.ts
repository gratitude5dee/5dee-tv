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
  })
    .index('by_scene', ['sceneId', 'shotNumber'])
    .index('by_board', ['boardId']),

  characters: defineTable({
    boardId: v.optional(v.id('shotboards')),
    name: v.string(),
    handle: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    traits: v.optional(v.any()),
    createdAt: v.number(),
  }).index('by_board', ['boardId']),
})
