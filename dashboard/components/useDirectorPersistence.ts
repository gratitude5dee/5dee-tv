'use client'

import { useMemo } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'

type SessionModel = 'director' | 'ltxv1' | 'ltx-2.3' | 'ltx-2.3-local' | 'ltx-2.3-condition'
type SessionStatus = 'opening' | 'live' | 'ended' | 'failed'

export interface DirectorPersistence {
  createSession: (args: { model: SessionModel; outputMode: 'webrtc' | 'rtmp'; config: unknown }) => Promise<Id<'sessions'>>
  setSessionStatus: (args: { sessionId: Id<'sessions'>; status: SessionStatus; error?: string }) => Promise<unknown>
  logPromptEvent: (args: {
    sessionId: Id<'sessions'>
    kind: 'configure' | 'prompt' | 'prompt_applied' | 'error'
    prompt?: string
    promptVersion?: number
    detail?: string
  }) => Promise<unknown>
  createClip: (args: {
    sessionId?: Id<'sessions'>
    prompt: string
    promptVersion?: number
    chunkIndex: number
    durationSeconds: number
    source: SessionModel
  }) => Promise<unknown>
  generateUploadUrl: () => Promise<string>
  deleteStorage: (args: { storageId: Id<'_storage'> }) => Promise<unknown>
  createRecording: (args: {
    sessionId?: Id<'sessions'>
    storageId: Id<'_storage'>
    mimeType: string
    sizeBytes: number
    durationSeconds: number
    model: SessionModel
    title?: string
  }) => Promise<unknown>
}

/** Must be called beneath a ConvexProvider. */
export function useDirectorPersistence(): DirectorPersistence {
  const createSession = useMutation(api.sessions.create)
  const setSessionStatus = useMutation(api.sessions.setStatus)
  const logPromptEvent = useMutation(api.promptEvents.log)
  const createClip = useMutation(api.clips.create)
  const generateUploadUrl = useMutation(api.recordings.generateUploadUrl)
  const deleteStorage = useMutation(api.recordings.deleteStorage)
  const createRecording = useMutation(api.recordings.create)

  return useMemo(
    () => ({ createSession, setSessionStatus, logPromptEvent, createClip, generateUploadUrl, deleteStorage, createRecording }),
    [createSession, setSessionStatus, logPromptEvent, createClip, generateUploadUrl, deleteStorage, createRecording],
  )
}
