'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createFalClient } from '@fal-ai/client'
import { wma, type ManagedRealtimeSession, type RealtimeState, type WmaRealtimeSession } from '@fal-ai/client/realtime'
import { Camera, Circle, Play, Send, Sparkles, Square, Upload, Volume2, VolumeX } from 'lucide-react'
import type { Id } from '../convex/_generated/dataModel'
import type { DirectorPersistence } from './useDirectorPersistence'
import AssetUrlInput from './AssetUrlInput'
import ChatSteerer from './ChatSteerer'
import DirectorSettingsForm from './DirectorSettingsForm'
import ScriptEditor from './ScriptEditor'
import TrackManager from './TrackManager'
import TwitchBroadcast from './TwitchBroadcast'
import { DitherButton } from './dither-kit/button'
import { DitherGradient } from './dither-kit/gradient'
import {
  beatsToWire,
  FAL_SDK_PROXY_URL,
  DEFAULT_DIRECTOR_SETTINGS,
  type ConfigureWire,
  type DirectorSettings,
  type PromptWire,
  type ScriptBeat,
} from '../lib/directorProtocol'

export const DIRECTOR_MODEL = 'minimax/h3-max/director'

const DEFAULT_PROMPT =
  'A continuous original live-action stream following a group of friends as they explore a new city.'

type DirectorSession = ManagedRealtimeSession<WmaRealtimeSession>

interface DirectorMessage {
  type?: string
  prompt_version?: number
  chunk_index?: number
  index?: number
  playback_seconds?: number
  playbackSeconds?: number
  buffer_depth_seconds?: number
  next_generation_estimate_seconds?: number
  reason?: string
  ts?: number
  duration?: number
  duration_seconds?: number
  message?: string
  error?: string
  max_session_seconds?: number | null
  [key: string]: unknown
}

/** Connect-overlay phases, driven by diagnostics + server messages. */
const CONNECT_STEPS = [
  'Network checked',
  'Finding a machine',
  'Connecting',
  'Building world',
  'Generating first scene',
] as const

type DirectionStatus = 'sent' | 'pending' | 'applied' | 'rejected'
interface RoutedDirection {
  version: number
  text: string
  status: DirectionStatus
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DirectorPlayerProps {
  /** Convex-backed persistence; omit when NEXT_PUBLIC_CONVEX_URL is not configured. */
  persistence?: DirectorPersistence
}

export default function DirectorPlayer({ persistence }: DirectorPlayerProps) {
  const convexEnabled = Boolean(persistence)
  const videoRef = useRef<HTMLVideoElement>(null)
  const sessionRef = useRef<DirectorSession | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef<number | null>(null)
  const promptVersionRef = useRef(0)
  const promptsByVersionRef = useRef<Map<number, string>>(new Map())
  const recordingStoppedAtRef = useRef<number | null>(null)
  const convexSessionIdRef = useRef<Id<'sessions'> | null>(null)
  // Per-direction clip capture: a rotating MediaRecorder splits the live stream
  // at each applied direction so every clip row gets its actual segment media.
  const clipRecorderRef = useRef<MediaRecorder | null>(null)
  const clipChunksRef = useRef<Blob[]>([])
  const clipStartedAtRef = useRef<number | null>(null)
  // The active segment's clip row as a promise: a rotation that is superseded
  // while its `create` mutation is still in flight still gets its media attached.
  const clipIdRef = useRef<Promise<Id<'clips'> | null> | null>(null)
  const lastAppliedRef = useRef<{ version: number; text: string } | null>(null)
  // Serializes recorder boundary changes so rotations can't interleave.
  const clipQueueRef = useRef<Promise<void>>(Promise.resolve())
  // Set when teardown begins — queued rotations after this start nothing.
  const clipClosingRef = useRef(false)
  // Version of the segment whose recorder+row are live — dedupes the server's
  // double applied-ack (`configured` and `prompt_applied` both fire for it).
  const clipSegVersionRef = useRef<number | null>(null)
  // Monotonic attempt counter: invalidating it aborts an in-flight connect().
  const connectAttemptRef = useRef(0)
  // Lets server-driven teardown (stream_exhausted) reach the cleanup path.
  const disconnectRef = useRef<(() => Promise<void>) | null>(null)

  const [state, setState] = useState<RealtimeState | 'idle' | 'closing'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [muted, setMuted] = useState(true)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recordedBytes, setRecordedBytes] = useState(0)
  const [lastUpload, setLastUpload] = useState<string | null>(null)
  const [settings, setSettings] = useState<DirectorSettings>(DEFAULT_DIRECTOR_SETTINGS)
  const [scriptBeats, setScriptBeats] = useState<ScriptBeat[]>([])
  const [sendScriptOnConnect, setSendScriptOnConnect] = useState(true)
  // Playback clock under the running script, from `chunk` messages.
  const [playbackSeconds, setPlaybackSeconds] = useState<number | null>(null)
  // Live end-frame / target-audio overrides for the next prompt message.
  const [liveEndImage, setLiveEndImage] = useState('')
  const [liveAudioUrl, setLiveAudioUrl] = useState('')
  // Connection observability.
  const [connectStep, setConnectStep] = useState(-1)
  const [pingMs, setPingMs] = useState<number | null>(null)
  const [bufferDepth, setBufferDepth] = useState<number | null>(null)
  const [genEstimate, setGenEstimate] = useState<number | null>(null)
  const [sessionAllowance, setSessionAllowance] = useState<number | null>(null)
  const [directions, setDirections] = useState<RoutedDirection[]>([])
  const [capturing, setCapturing] = useState(false)
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null)
  const [remixing, setRemixing] = useState(false)
  const [generatingSheet, setGeneratingSheet] = useState(false)
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPingAtRef = useRef(0)
  const liveStartedAtRef = useRef<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)

  const noop = async () => undefined
  const createSession = persistence?.createSession
  const setSessionStatus = persistence?.setSessionStatus ?? noop
  const logPromptEvent = persistence?.logPromptEvent ?? noop
  const createClip = persistence?.createClip ?? noop
  const attachClipMedia = persistence?.attachClipMedia
  const generateUploadUrl = persistence?.generateUploadUrl
  const deleteStorage = persistence?.deleteStorage
  const createRecording = persistence?.createRecording ?? noop

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 50))
  }, [])

  const persist = useCallback(
    async (fn: () => Promise<unknown>) => {
      if (!convexEnabled) return
      try {
        await fn()
      } catch (e) {
        appendLog(`convex: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
    [convexEnabled, appendLog],
  )

  const stopRecorder = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return Promise.resolve(null)
    return new Promise((resolve) => {
      recorder.onstop = () => {
        recordingStoppedAtRef.current = Date.now()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        chunksRef.current = []
        recorderRef.current = null
        setRecording(false)
        resolve(blob.size > 0 ? blob : null)
      }
      recorder.stop()
    })
  }, [])

  const uploadRecording = useCallback(
    async (blob: Blob, sessionId?: Id<'sessions'>) => {
      if (!convexEnabled || !generateUploadUrl) {
        appendLog('Recording captured but NEXT_PUBLIC_CONVEX_URL is not set; download it instead.')
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `director-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        return
      }
      setUploading(true)
      let storageId: Id<'_storage'> | null = null
      try {
        const uploadUrl = await generateUploadUrl()
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': blob.type.split(';')[0] || 'video/webm' },
          body: blob,
        })
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
        storageId = ((await res.json()) as { storageId: Id<'_storage'> }).storageId
        const durationSeconds =
          recordingStartedAtRef.current && recordingStoppedAtRef.current
            ? (recordingStoppedAtRef.current - recordingStartedAtRef.current) / 1000
            : 0
        await createRecording({
          sessionId: sessionId ?? convexSessionIdRef.current ?? undefined,
          storageId,
          mimeType: blob.type,
          sizeBytes: blob.size,
          durationSeconds,
          model: 'director',
          title: activePrompt ?? undefined,
        })
        setLastUpload(`${formatBytes(blob.size)} uploaded`)
        appendLog(`Recording saved (${formatBytes(blob.size)})`)
      } catch (e) {
        appendLog(`upload: ${e instanceof Error ? e.message : String(e)}`)
        // The uploaded blob may exist with no recording row — delete it and offer
        // a local download so nothing is stranded in storage without the user seeing it.
        if (storageId && deleteStorage) {
          try {
            await deleteStorage({ storageId })
            appendLog('Orphaned upload cleaned from Convex storage')
          } catch (de) {
            appendLog(`cleanup: ${de instanceof Error ? de.message : String(de)}`)
          }
        }
        try {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `director-${Date.now()}.webm`
          a.click()
          URL.revokeObjectURL(url)
        } catch {
          // ignore
        }
      } finally {
        setUploading(false)
        recordingStartedAtRef.current = null
        recordingStoppedAtRef.current = null
      }
    },
    [convexEnabled, generateUploadUrl, createRecording, deleteStorage, activePrompt, appendLog],
  )

  const startRecorder = useCallback(() => {
    const stream = streamRef.current
    if (!stream || recorderRef.current) return
    const mimeType = pickRecorderMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    setRecordedBytes(0)
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) {
        chunksRef.current.push(ev.data)
        setRecordedBytes((b) => b + ev.data.size)
      }
    }
    recorder.start(1000)
    recorderRef.current = recorder
    recordingStartedAtRef.current = Date.now()
    setRecording(true)
    appendLog(`Recording started (${recorder.mimeType})`)
  }, [appendLog])

  const startClipRecorder = useCallback(() => {
    const stream = streamRef.current
    if (!stream || clipRecorderRef.current) return
    const mimeType = pickRecorderMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    clipChunksRef.current = []
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) clipChunksRef.current.push(ev.data)
    }
    recorder.start(1000)
    clipRecorderRef.current = recorder
    clipStartedAtRef.current = Date.now()
  }, [])

  const stopClipRecorder = useCallback((): Promise<Blob | null> => {
    const recorder = clipRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return Promise.resolve(null)
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(clipChunksRef.current, { type: recorder.mimeType || 'video/webm' })
        clipChunksRef.current = []
        clipRecorderRef.current = null
        clipStartedAtRef.current = null
        resolve(blob.size > 0 ? blob : null)
      }
      recorder.stop()
    })
  }, [])

  const uploadClipSegment = useCallback(
    async (clipId: Id<'clips'>, blob: Blob, durationSeconds: number) => {
      if (!generateUploadUrl || !attachClipMedia) return
      let storageId: Id<'_storage'> | null = null
      try {
        const uploadUrl = await generateUploadUrl()
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': blob.type.split(';')[0] || 'video/webm' },
          body: blob,
        })
        if (!res.ok) throw new Error(`Clip upload failed: ${res.status}`)
        storageId = ((await res.json()) as { storageId: Id<'_storage'> }).storageId
        await attachClipMedia({
          clipId,
          storageId,
          mimeType: blob.type.split(';')[0] || 'video/webm',
          sizeBytes: blob.size,
          durationSeconds,
        })
        appendLog(`Clip segment saved (${formatBytes(blob.size)})`)
      } catch (e) {
        appendLog(`clip: ${e instanceof Error ? e.message : String(e)}`)
        if (storageId && deleteStorage) {
          try {
            await deleteStorage({ storageId })
          } catch {
            // ignore
          }
        }
      }
    },
    [generateUploadUrl, attachClipMedia, deleteStorage, appendLog],
  )

  /** Rotate the clip boundary on a newly applied direction: the outgoing
   * recorder stops and the next starts back-to-back (millisecond gap), while
   * the outgoing segment's upload detaches so it can never delay the next
   * recorder or session teardown. */
  const rotateClip = useCallback(
    (version: number, text: string) => {
      if (!convexEnabled) return
      lastAppliedRef.current = { version, text }
      clipQueueRef.current = clipQueueRef.current
        .then(async () => {
          if (clipSegVersionRef.current === version) return
          const prevClipId = clipIdRef.current
          const prevStartedAt = clipStartedAtRef.current
          clipIdRef.current = null
          const blob = await stopClipRecorder()
          const stoppedAt = Date.now()
          // A rotation queued after teardown began still delivers the previous
          // segment's media, but must not start a new recorder or clip row.
          const closing = clipClosingRef.current
          if (!closing && streamRef.current) startClipRecorder()
          if (blob && prevClipId) {
            const durationSeconds = prevStartedAt ? (stoppedAt - prevStartedAt) / 1000 : 0
            void prevClipId.then((id) => {
              if (id) void uploadClipSegment(id, blob, durationSeconds)
            })
          }
          if (closing || !streamRef.current) return
          clipSegVersionRef.current = version
          clipIdRef.current = createClip({
            sessionId: convexSessionIdRef.current ?? undefined,
            prompt: text,
            promptVersion: version,
            chunkIndex: version,
            durationSeconds: 0,
            source: 'director',
          }).then(
            (id) => id,
            (e) => {
              appendLog(`convex: ${e instanceof Error ? e.message : String(e)}`)
              return null
            },
          )
        })
        .catch(() => undefined)
    },
    [convexEnabled, createClip, startClipRecorder, stopClipRecorder, uploadClipSegment, appendLog],
  )

  /** Queue the final segment flush (disconnect + unmount paths). */
  const flushClip = useCallback((): Promise<void> => {
    clipQueueRef.current = clipQueueRef.current
      .then(async () => {
        const pending = clipIdRef.current
        const startedAt = clipStartedAtRef.current
        clipIdRef.current = null
        lastAppliedRef.current = null
        const blob = await stopClipRecorder()
        const stoppedAt = Date.now()
        const id = pending ? await pending : null
        if (blob && id) {
          const durationSeconds = startedAt ? (stoppedAt - startedAt) / 1000 : 0
          void uploadClipSegment(id, blob, durationSeconds)
        }
      })
      .catch(() => undefined)
    return clipQueueRef.current
  }, [stopClipRecorder, uploadClipSegment])

  const handleData = useCallback(
    (raw: string) => {
      let msg: DirectorMessage
      try {
        msg = JSON.parse(raw)
      } catch {
        appendLog(`data: ${raw.slice(0, 120)}`)
        return
      }
      const type = msg.type ?? 'message'
      appendLog(`${type}${msg.prompt_version !== undefined ? ` v${msg.prompt_version}` : ''}`)

      if (type === 'pong') {
        // ts echo may be absent — fall back to when we last sent a ping.
        const echoed = typeof msg.ts === 'number' ? msg.ts : Number(msg.ts)
        const base = Number.isFinite(echoed) ? echoed : lastPingAtRef.current
        setPingMs(Math.max(0, Date.now() - base))
        return
      }

      if (type === 'configured') {
        setConnectStep((s) => Math.max(s, 3))
        // `configured` is the applied ack for the opening configure prompt.
        const v = msg.prompt_version
        if (typeof v === 'number') {
          setDirections((prev) => prev.map((d) => (d.version === v ? { ...d, status: 'applied' } : d)))
          const applied = promptsByVersionRef.current.get(v)
          if (applied) setActivePrompt(applied)
          rotateClip(v, applied ?? '')
        }
        void persist(() =>
          logPromptEvent({
            sessionId: convexSessionIdRef.current!,
            kind: 'prompt_applied',
            promptVersion: typeof v === 'number' ? v : undefined,
            detail: raw.slice(0, 2000),
          }),
        )
        appendLog('world configured')
        return
      }

      if (type === 'session_info') {
        if (typeof msg.max_session_seconds === 'number') setSessionAllowance(msg.max_session_seconds)
        return
      }

      if (type === 'prompt_pending' || type === 'prompt_applied' || type === 'prompt_rejected') {
        const v = msg.prompt_version
        if (typeof v === 'number') {
          const status: DirectionStatus =
            type === 'prompt_pending' ? 'pending' : type === 'prompt_applied' ? 'applied' : 'rejected'
          setDirections((prev) => prev.map((d) => (d.version === v ? { ...d, status } : d)))
        }
        if (type === 'prompt_applied' && typeof v === 'number') {
          const applied = promptsByVersionRef.current.get(v)
          if (applied) setActivePrompt(applied)
          rotateClip(v, applied ?? '')
        }
        if (type === 'prompt_applied' || type === 'prompt_rejected') {
          void persist(() =>
            logPromptEvent({
              sessionId: convexSessionIdRef.current!,
              kind: type === 'prompt_applied' ? 'prompt_applied' : 'error',
              promptVersion: typeof v === 'number' ? v : undefined,
              detail: raw.slice(0, 2000),
            }),
          )
        }
        if (type === 'prompt_rejected') {
          const reason = String(msg.reason ?? msg.error ?? 'rejected')
          setError(`Prompt rejected: ${reason}`)
          appendLog(`prompt_rejected v${v}: ${reason}`)
        }
        return
      }

      if (type === 'error') {
        const detail = msg.error ?? msg.message ?? raw
        setError(String(detail))
        void persist(() =>
          logPromptEvent({
            sessionId: convexSessionIdRef.current!,
            kind: 'error',
            detail: String(detail),
          }),
        )
        return
      }

      if (/prompt.*(applied|accepted|active)|configured/.test(type)) {
        void persist(() =>
          logPromptEvent({
            sessionId: convexSessionIdRef.current!,
            kind: 'prompt_applied',
            promptVersion: msg.prompt_version,
            detail: raw.slice(0, 2000),
          }),
        )
        return
      }

      if (type === 'stream_exhausted') {
        appendLog(`stream_exhausted: ${String(msg.reason ?? 'ended')}`)
        // Full cleanup path (recorder, session close, Convex finalize) so the
        // exhausted session can't keep running after the UI goes idle.
        void disconnectRef.current?.()
        return
      }

      if (type === 'chunk' || (/chunk|segment/.test(type) && /(complete|done|finished|end)/.test(type))) {
        const played = msg.playback_seconds ?? msg.playbackSeconds
        if (typeof played === 'number') setPlaybackSeconds(played)
        if (typeof msg.buffer_depth_seconds === 'number') setBufferDepth(msg.buffer_depth_seconds)
        if (typeof msg.next_generation_estimate_seconds === 'number') setGenEstimate(msg.next_generation_estimate_seconds)
        setConnectStep((s) => (s >= 0 ? CONNECT_STEPS.length - 1 : s))
      }
    },
    [appendLog, persist, logPromptEvent, rotateClip, setSessionStatus],
  )

  const sendPrompt = useCallback(
    (text: string, configure: boolean) => {
      const session = sessionRef.current
      if (!session) return
      promptVersionRef.current += 1
      const version = promptVersionRef.current
      const anchor = configure ? settings.characterName.trim() : ''
      const wireText = anchor && !text.includes(anchor) ? `${anchor} — ${text}` : text
      promptsByVersionRef.current.set(version, wireText)
      if (configure) {
        // Full configure message: world prompt + every locked setting. A script
        // in configure cannot combine with end_image_url/audio_url — the beats
        // carry their own.
        const beats = sendScriptOnConnect ? beatsToWire(scriptBeats) : []
        const wire: ConfigureWire = {
          protocol_version: 1,
          type: 'configure',
          prompt: wireText,
          prompt_version: version,
          resolution: settings.resolution,
          aspect_ratio: settings.aspectRatio,
          memory: settings.memory,
          audio_bitrate: settings.audioBitrate,
          ...(settings.seed != null ? { seed: settings.seed } : {}),
          ...(settings.imageUrl.trim() ? { image_url: settings.imageUrl.trim() } : {}),
          ...(beats.length
            ? { script: beats }
            : {
                ...(settings.endImageUrl.trim() ? { end_image_url: settings.endImageUrl.trim() } : {}),
                ...(settings.audioUrl.trim() ? { audio_url: settings.audioUrl.trim() } : {}),
              }),
        }
        session.send(wire)
      } else {
        const wire: PromptWire = {
          type: 'prompt',
          prompt: wireText,
          prompt_version: version,
          ...(liveEndImage.trim() ? { end_image_url: liveEndImage.trim() } : {}),
          ...(liveAudioUrl.trim() ? { audio_url: liveAudioUrl.trim(), audio_behavior: 'replace' } : {}),
        }
        session.send(wire)
        // End-frame/audio are one-shot per the model contract — clear after use.
        if (liveEndImage.trim()) setLiveEndImage('')
        if (liveAudioUrl.trim()) setLiveAudioUrl('')
      }
      // Active prompt is only set when the server applies it (prompt_applied).
      setDirections((prev) => [...prev, { version, text: wireText, status: 'sent' as const }].slice(-8))
      appendLog(`${configure ? 'configure' : 'prompt'} sent (v${version})`)
      void persist(() =>
        logPromptEvent({
          sessionId: convexSessionIdRef.current!,
          kind: configure ? 'configure' : 'prompt',
          prompt: wireText,
          promptVersion: version,
        }),
      )
    },
    [appendLog, persist, logPromptEvent, settings, scriptBeats, sendScriptOnConnect, liveEndImage, liveAudioUrl],
  )

  /** Push a script mid-session: 'replace' cuts at the next chunk, 'append' queues it. */
  const sendScript = useCallback(
    (beats: ScriptBeat[], mode: 'replace' | 'append') => {
      const session = sessionRef.current
      if (!session) return
      const wireBeats = beatsToWire(beats)
      if (!wireBeats.length) return
      promptVersionRef.current += 1
      const version = promptVersionRef.current
      promptsByVersionRef.current.set(version, `[script ×${wireBeats.length}]`)
      const wire: PromptWire = {
        type: 'prompt',
        prompt_version: version,
        script: wireBeats,
        script_mode: mode,
      }
      session.send(wire)
      setDirections((prev) =>
        [...prev, { version, text: `script ×${wireBeats.length} (${mode})`, status: 'sent' as const }].slice(-8),
      )
      appendLog(`script ${mode} sent (v${version}, ${wireBeats.length} beats)`)
      void persist(() =>
        logPromptEvent({
          sessionId: convexSessionIdRef.current!,
          kind: 'prompt',
          prompt: `[script ${mode}] ${wireBeats.map((b) => `@${b.offset}s ${b.prompt ?? ''}`.trim()).join(' | ')}`,
          promptVersion: version,
        }),
      )
    },
    [appendLog, persist, logPromptEvent],
  )

  /**
   * Snapshot the current video frame, upload it via fal storage, and use it for
   * continuity: it becomes the next prompt's end frame AND the next session's
   * first frame. Callable from the admin button or a chat command.
   */
  const captureFrame = useCallback(
    async (source: string) => {
      const video = videoRef.current
      if (!video || !video.videoWidth || capturing) return
      setCapturing(true)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')!.drawImage(video, 0, 0)
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        )
        if (!blob) throw new Error('frame capture failed')
        const fal = createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })
        const url = await fal.storage.upload(new File([blob], `frame-${Date.now()}.png`, { type: 'image/png' }))
        setLiveEndImage(url)
        setCapturedFrame(url)
        setSettings((s) => ({ ...s, imageUrl: url }))
        appendLog(`frame captured by ${source} → next end frame + next session's first frame`)
      } catch (e) {
        appendLog(`frame capture: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setCapturing(false)
      }
    },
    [capturing, appendLog],
  )

  /**
   * Reroll the captured frame through nano-banana-2/edit (Gemini 3.1 Flash
   * Image) — keeps the character/scene intact, produces a fresh continuity
   * frame. Replaces the pending end frame + next session's first frame.
   */
  const remixFrame = useCallback(
    async (directionText?: string) => {
      const source = capturedFrame ?? settings.imageUrl.trim()
      if (!source || remixing) return
      setRemixing(true)
      try {
        const fal = createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })
        const editPrompt =
          directionText?.trim() ||
          'Keep the same character, same outfit, same art style and setting; evolve the shot forward — a new camera angle / next beat of the same scene.'
        const refs = [source, ...(settings.characterSheet.trim() ? [settings.characterSheet.trim()] : [])]
        const name = settings.characterName.trim()
        const res = (await fal.subscribe('fal-ai/nano-banana-2/edit', {
          input: {
            prompt: `${editPrompt}${refs.length > 1 ? ` Keep ${name || 'the character'} identical to the character reference sheet — same outfit, proportions, and style.` : ''}`,
            image_urls: refs,
          },
        })) as { data?: { images?: { url: string }[] }; images?: { url: string }[] }
        const url = res.data?.images?.[0]?.url ?? res.images?.[0]?.url
        if (!url) throw new Error('nano-banana returned no image')
        setLiveEndImage(url)
        setCapturedFrame(url)
        setSettings((s) => ({ ...s, imageUrl: url }))
        appendLog('frame remixed via nano-banana-2 → next end frame')
      } catch (e) {
        appendLog(`frame remix: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setRemixing(false)
      }
    },
    [capturedFrame, settings.imageUrl, settings.characterSheet, settings.characterName, remixing, appendLog],
  )

  /**
   * Generate a character reference sheet from the first frame via
   * nano-banana-2/edit — a turnaround/expressions sheet used as a consistency
   * reference on every subsequent remix.
   */
  const generateSheet = useCallback(async () => {
    const source = settings.imageUrl.trim()
    if (!source || generatingSheet) return
    setGeneratingSheet(true)
    try {
      const fal = createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })
      const name = settings.characterName.trim() || 'the character'
      const res = (await fal.subscribe('fal-ai/nano-banana-2/edit', {
        input: {
          prompt: `Character reference sheet for ${name}: front view, three-quarter view, and side profile plus a row of expression close-ups — identical outfit, colors, and art style as the reference image. Clean layout on a plain background.`,
          image_urls: [source],
        },
      })) as { data?: { images?: { url: string }[] }; images?: { url: string }[] }
      const url = res.data?.images?.[0]?.url ?? res.images?.[0]?.url
      if (!url) throw new Error('nano-banana returned no image')
      setSettings((s) => ({ ...s, characterSheet: url }))
      appendLog('character sheet generated → consistency reference for remixes')
    } catch (e) {
      appendLog(`character sheet: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setGeneratingSheet(false)
    }
  }, [settings.imageUrl, settings.characterName, generatingSheet, appendLog])

  /**
   * A chat-sourced direction. Chat text and display names are untrusted —
   * strip brackets/control chars/newlines and cap lengths before splicing.
   */
  const sendChatDirection = useCallback(
    (text: string, author: string) => {
      const safeAuthor = author.replace(/[\[\]<>\n\r@]/g, '').slice(0, 32) || 'chat'
      const safeText = text.replace(/[\n\r<>]/g, ' ').trim().slice(0, 300)
      if (!safeText) return
      sendPrompt(`[chat @${safeAuthor}] ${safeText}`, false)
      appendLog(`chat @${safeAuthor}: ${safeText.slice(0, 80)}`)
    },
    [sendPrompt, appendLog],
  )

  const disconnect = useCallback(async () => {
    // Invalidate any in-flight connect() so a cancelled startup can't open a session.
    connectAttemptRef.current += 1
    setState('closing')
    // Stop the clip recorder and detach its upload — session teardown below is
    // never blocked on storage writes. The closing marker also prevents any
    // rotation queued behind this flush from starting a fresh recorder.
    clipClosingRef.current = true
    await flushClip()
    const blob = await stopRecorder()
    const session = sessionRef.current
    sessionRef.current = null
    let closeError: string | null = null
    if (session) {
      try {
        session.send({ type: 'stop' })
        await session.close()
      } catch (e) {
        // A failed close must not strand the recording or leave us in 'closing'.
        closeError = e instanceof Error ? e.message : String(e)
        appendLog(`close: ${closeError}`)
      }
    }
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setConnectStep(-1)
    setElapsedSeconds(null)
    liveStartedAtRef.current = null
    setPingMs(null)
    setBufferDepth(null)
    setGenEstimate(null)
    // Capture this session's id before clearing the ref — a new connect() may
    // replace it while the upload below is still running.
    const sessionId = convexSessionIdRef.current
    convexSessionIdRef.current = null
    if (blob) await uploadRecording(blob, sessionId ?? undefined)
    await persist(() =>
      sessionId ? setSessionStatus({ sessionId, status: 'ended' }) : Promise.resolve(),
    )
    if (closeError) setError(`Session close: ${closeError}`)
    setState('idle')
  }, [stopRecorder, flushClip, uploadRecording, persist, setSessionStatus, appendLog])
  disconnectRef.current = disconnect

  const connect = useCallback(async () => {
    const attempt = ++connectAttemptRef.current
    setError(null)
    setLog([])
    promptVersionRef.current = 0
    promptsByVersionRef.current = new Map()
    clipIdRef.current = null
    lastAppliedRef.current = null
    clipSegVersionRef.current = null
    clipClosingRef.current = false
    setPlaybackSeconds(null)
    setSessionAllowance(null)
    setDirections([])
    setCapturedFrame(null)
    setElapsedSeconds(null)
    liveStartedAtRef.current = null
    setState('opening')

    if (createSession) {
      // Attempt-local: only becomes the shared session id if this connect is
      // still current when the mutation resolves.
      let sessionId: Id<'sessions'> | null = null
      try {
        sessionId = await createSession({
          model: 'director',
          outputMode: 'webrtc',
          config: {
            model: DIRECTOR_MODEL,
            prompt,
            resolution: settings.resolution,
            aspectRatio: settings.aspectRatio,
            memory: settings.memory,
            seed: settings.seed ?? undefined,
            scriptBeats: beatsToWire(scriptBeats).length,
          },
        })
      } catch (e) {
        appendLog(`convex: ${e instanceof Error ? e.message : String(e)}`)
      }
      if (attempt !== connectAttemptRef.current) {
        // Cancelled while the row was being created: end only this attempt's row.
        if (sessionId) {
          void persist(() => setSessionStatus({ sessionId, status: 'ended' }))
        }
        return
      }
      convexSessionIdRef.current = sessionId
    }

    const fal = createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })
    const session = fal.realtime.open(wma(DIRECTOR_MODEL), {
      receive: ['video', 'audio'],
      onMedia: (stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => undefined)
        }
        appendLog('media stream attached')
        liveStartedAtRef.current = Date.now()
        setConnectStep(CONNECT_STEPS.length - 1)
        // `configured` can apply the opening direction before media attaches;
        // start its clip segment now that the stream exists.
        const pending = lastAppliedRef.current
        if (pending && !clipIdRef.current) rotateClip(pending.version, pending.text)
      },
      onData: handleData,
      onState: (s) => {
        setState(s)
        appendLog(`state: ${s}`)
        if (s === 'live') {
          void persist(() =>
            convexSessionIdRef.current
              ? setSessionStatus({ sessionId: convexSessionIdRef.current, status: 'live' })
              : Promise.resolve(),
          )
        }
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        appendLog(`error: ${message}`)
        void persist(() =>
          convexSessionIdRef.current
            ? setSessionStatus({ sessionId: convexSessionIdRef.current, status: 'failed', error: message })
            : Promise.resolve(),
        )
      },
      onDiagnostic: (d) => {
        if (d.kind === 'progress') {
          // Map transport phases onto the connect overlay.
          const phase = d.phase
          if (phase === 'authenticating' || phase === 'ice-servers' || phase === 'ice-gathering' || phase === 'network-path') {
            setConnectStep((s) => Math.max(s, 1))
          } else if (phase === 'connecting' || phase === 'connection-state') {
            setConnectStep((s) => Math.max(s, 2))
          }
        } else {
          appendLog(`${d.kind}: ${d.message}`)
        }
      },
    })
    sessionRef.current = session
    setConnectStep(0)
    sendPrompt(prompt, true)
  }, [createSession, prompt, appendLog, handleData, persist, rotateClip, setSessionStatus, sendPrompt, settings, scriptBeats])

  // Ping the session every 5s while a session object exists; `pong` sets pingMs.
  // Also keeps a local elapsed clock (the model's playback_seconds restarts per
  // generation segment, so it can't be used as a session clock).
  useEffect(() => {
    if (state !== 'live' && state !== 'opening') return
    pingTimerRef.current = setInterval(() => {
      lastPingAtRef.current = Date.now()
      sessionRef.current?.send({ type: 'ping', ts: lastPingAtRef.current })
      if (liveStartedAtRef.current) {
        setElapsedSeconds((Date.now() - liveStartedAtRef.current) / 1000)
      }
    }, 1000)
    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      pingTimerRef.current = null
    }
  }, [state])

  useEffect(() => {
    return () => {
      // Flush the in-flight clip segment too — navigating away mid-session
      // must not strand the last direction's media.
      clipClosingRef.current = true
      void flushClip()
      recorderRef.current?.stop()
      sessionRef.current?.close()
    }
  }, [flushClip])

  const live = state === 'live'
  const busy = state === 'opening' || state === 'closing'

  return (
    <div>
      <div className="fal-card">
        <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="fal-card-title">Director (realtime WebRTC)</h3>
            <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400 font-mono">{DIRECTOR_MODEL}</p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                live
                  ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400'
                  : busy
                    ? 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
                    : state === 'failed'
                      ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                      : 'bg-fal-gray-100 dark:bg-fal-gray-800 text-fal-gray-600 dark:text-fal-gray-400'
              }`}
            >
              {state}
            </span>
            {recording && (
              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 font-medium">
                <Circle className="w-3 h-3 fill-current animate-pulse" />
                <span>REC {formatBytes(recordedBytes)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

        <div className="fal-card-content space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <DitherGradient from="blue" direction="up" opacity={0.55} cell={4} className="absolute inset-0" />
          <video ref={videoRef} autoPlay playsInline muted={muted} className="relative w-full h-full object-contain" />
          {!live && (
            <div className="absolute inset-0 flex items-center justify-center">
              {state === 'opening' || (connectStep >= 0 && state !== 'idle' && state !== 'failed') ? (
                <div className="rounded-lg bg-black/70 border border-fal-gray-700 px-5 py-4 space-y-2 min-w-[240px]">
                  {CONNECT_STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-2.5 text-xs font-mono">
                      {i < connectStep ? (
                        <Circle className="w-3 h-3 fill-green-400 text-green-400" />
                      ) : i === connectStep ? (
                        <Circle className="w-3 h-3 fill-transparent text-fal-gray-300 animate-pulse" />
                      ) : (
                        <Circle className="w-3 h-3 fill-transparent text-fal-gray-600 dark:text-fal-gray-400" />
                      )}
                      <span className={i <= connectStep ? 'text-fal-gray-100' : 'text-fal-gray-500 dark:text-fal-gray-400'}>
                        {label}
                      </span>
                    </div>
                  ))}
                  <button onClick={disconnect} className="text-xs text-fal-gray-400 hover:text-white mt-1 underline">
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="relative text-fal-gray-400 text-sm">
                  {state === 'closing' ? 'Stopping…' : state === 'failed' ? 'Session failed' : 'Director offline'}
                </span>
              )}
            </div>
          )}
          {live && (
            <>
              <button
                onClick={() => setMuted((m) => !m)}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <button
                  onClick={() => void captureFrame('admin')}
                  disabled={capturing}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-50"
                  title="Snapshot this frame → becomes the next end frame + next session's first frame"
                >
                  <Camera className="w-4 h-4" />
                  {capturing ? 'Capturing…' : 'Capture frame'}
                </button>
                {capturedFrame && (
                  <button
                    onClick={() => void remixFrame()}
                    disabled={remixing}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-50"
                    title="Evolve the captured frame with nano-banana-2 (same character, new shot)"
                  >
                    <Sparkles className="w-4 h-4" />
                    {remixing ? 'Remixing…' : 'Remix frame'}
                  </button>
                )}
              </div>
              <div className="absolute top-3 left-3 flex items-center gap-3 rounded-md bg-black/60 px-3 py-1.5 text-xs font-mono text-white">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live
                  {elapsedSeconds != null && ` · ${elapsedSeconds.toFixed(0)}s`}
                </span>
                {pingMs != null && <span className="text-yellow-300">Ping · {pingMs} ms</span>}
                {bufferDepth != null && <span className="text-fal-gray-300">buf {bufferDepth.toFixed(1)}s</span>}
                {genEstimate != null && <span className="text-fal-gray-300">gen {genEstimate.toFixed(1)}s</span>}
              </div>
            </>
          )}
        </div>

        {(live || connectStep >= 0) && (
          <div className="text-xs font-mono text-fal-gray-500 dark:text-fal-gray-400 space-y-1">
            {sessionAllowance != null && (
              <p>
                Session allowance: {Math.floor(sessionAllowance / 60)}:{String(Math.floor(sessionAllowance % 60)).padStart(2, '0')}
                {elapsedSeconds != null &&
                  ` · about ${Math.max(0, Math.floor((sessionAllowance - elapsedSeconds) / 60))}m remaining`}
              </p>
            )}
            {directions.length > 0 && (
              <div className="space-y-0.5">
                {[...directions].reverse().map((d) => (
                  <p key={d.version} className="truncate">
                    <span className={`mr-1 ${
                      d.status === 'applied'
                        ? 'text-green-600'
                        : d.status === 'rejected'
                          ? 'text-red-600 dark:text-red-400'
                          : d.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-fal-gray-400'
                    }`}>
                      ●
                    </span>
                    v{d.version} {d.status} — {d.text.slice(0, 90)}
                  </p>
                ))}
              </div>
            )}
            {capturedFrame && (
              <p className="truncate">Continuity frame set: {capturedFrame}</p>
            )}
          </div>
        )}

        {!live && !busy && (
          <details className="rounded-md border border-fal-gray-200 dark:border-fal-gray-700">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-fal-gray-700 dark:text-fal-gray-300 select-none">
              Session settings <span className="text-xs text-fal-gray-400 font-normal">(locked once connected)</span>
            </summary>
            <div className="px-3 pb-3">
              <DirectorSettingsForm
                settings={settings}
                onChange={setSettings}
                disabled={live || busy}
                scriptPlanned={sendScriptOnConnect && beatsToWire(scriptBeats).length > 0}
                onGenerateSheet={generateSheet}
                generatingSheet={generatingSheet}
              />
            </div>
          </details>
        )}

        <div>
          <label className="block text-sm font-medium text-fal-gray-700 dark:text-fal-gray-300 mb-1">
            {live ? 'Next direction' : 'Opening prompt (the series premise)'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
          />
          {activePrompt && (
            <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400 mt-1">
              Applied: {activePrompt}
            </p>
          )}
          {live && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-2">
              <div>
                <label className="block text-xs text-fal-gray-500 dark:text-fal-gray-400 mb-1">End frame for next scene (optional)</label>
                <AssetUrlInput value={liveEndImage} onChange={setLiveEndImage} placeholder="Image URL or upload" />
              </div>
              <div>
                <label className="block text-xs text-fal-gray-500 dark:text-fal-gray-400 mb-1">Replace audio track (optional)</label>
                <AssetUrlInput value={liveAudioUrl} onChange={setLiveAudioUrl} kind="audio" placeholder="Audio URL or upload" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!live && !busy ? (
            <DitherButton
              onClick={connect}
              color="blue"
              variant="gradient"
              bloom="low"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              <span>Start Director</span>
            </DitherButton>
          ) : (
            <button onClick={disconnect} className="fal-button-secondary flex items-center space-x-2">
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          )}
          <button
            onClick={() => sendPrompt(prompt, false)}
            disabled={!live || !prompt.trim()}
            className="fal-button-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Send direction</span>
          </button>
          {live && !recording && (
            <button onClick={startRecorder} className="fal-button-secondary flex items-center space-x-2">
              <Circle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Record</span>
            </button>
          )}
          {recording && (
            <button
              onClick={async () => {
                const blob = await stopRecorder()
                if (blob) await uploadRecording(blob)
              }}
              className="fal-button-secondary flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Stop & save recording</span>
            </button>
          )}
          {uploading && <span className="text-sm text-fal-gray-500 dark:text-fal-gray-400 self-center">Uploading…</span>}
          {lastUpload && !uploading && <span className="text-sm text-green-700 dark:text-green-400 self-center">{lastUpload}</span>}
        </div>

        <TwitchBroadcast live={live} getStream={() => streamRef.current} onLog={appendLog} />

        {error && (
          <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        {log.length > 0 && (
          <pre className="text-xs font-mono bg-fal-gray-50 dark:bg-fal-gray-800 border border-fal-gray-200 dark:border-fal-gray-700 rounded-md p-3 max-h-40 overflow-auto">
            {log.join('\n')}
          </pre>
        )}
        </div>
      </div>

      <ScriptEditor
        beats={scriptBeats}
        onChange={setScriptBeats}
        sendOnConnect={sendScriptOnConnect}
        onSendOnConnectChange={setSendScriptOnConnect}
        onSendLive={sendScript}
        live={live}
        playbackSeconds={playbackSeconds}
      />

      <ChatSteerer
        live={live}
        onDirection={sendChatDirection}
        onFrameCommand={(author) => void captureFrame(`@${author}`)}
      />

      <TrackManager
        live={live}
        onUseForSession={(url) => setSettings((s) => ({ ...s, audioUrl: url }))}
        onUseLive={setLiveAudioUrl}
      />
    </div>
  )
}
