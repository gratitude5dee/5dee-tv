'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createFalClient } from '@fal-ai/client'
import { wma, type ManagedRealtimeSession, type RealtimeState, type WmaRealtimeSession } from '@fal-ai/client/realtime'
import { Camera, Circle, Play, Send, Square, Upload, Volume2, VolumeX } from 'lucide-react'
import type { Id } from '../convex/_generated/dataModel'
import type { DirectorPersistence } from './useDirectorPersistence'
import AssetUrlInput from './AssetUrlInput'
import ChatSteerer from './ChatSteerer'
import DirectorSettingsForm from './DirectorSettingsForm'
import ScriptEditor from './ScriptEditor'
import {
  beatsToWire,
  DEFAULT_DIRECTOR_SETTINGS,
  type ConfigureWire,
  type DirectorSettings,
  type PromptWire,
  type ScriptBeat,
} from '../lib/directorProtocol'

export const DIRECTOR_MODEL = 'minimax/h3-max/director'
export const FAL_SDK_PROXY_URL = '/api/fal/sdk-proxy'

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
  const clipIndexRef = useRef(0)
  // Monotonic attempt counter: invalidating it aborts an in-flight connect().
  const connectAttemptRef = useRef(0)

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
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const noop = async () => undefined
  const createSession = persistence?.createSession
  const setSessionStatus = persistence?.setSessionStatus ?? noop
  const logPromptEvent = persistence?.logPromptEvent ?? noop
  const createClip = persistence?.createClip ?? noop
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
          headers: { 'Content-Type': blob.type },
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

      if (type === 'pong' && typeof msg.ts === 'number') {
        setPingMs(Math.max(0, Date.now() - msg.ts))
        return
      }

      if (type === 'configured') {
        setConnectStep((s) => Math.max(s, 3))
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
        setState('idle')
        void persist(() =>
          convexSessionIdRef.current
            ? setSessionStatus({ sessionId: convexSessionIdRef.current, status: 'ended' })
            : Promise.resolve(),
        )
        return
      }

      if (type === 'chunk' || (/chunk|segment/.test(type) && /(complete|done|finished|end)/.test(type))) {
        const chunkIndex =
          typeof msg.chunk_index === 'number'
            ? msg.chunk_index
            : typeof msg.index === 'number'
              ? msg.index
              : clipIndexRef.current
        clipIndexRef.current = chunkIndex + 1
        const played = msg.playback_seconds ?? msg.playbackSeconds
        if (typeof played === 'number') setPlaybackSeconds(played)
        if (typeof msg.buffer_depth_seconds === 'number') setBufferDepth(msg.buffer_depth_seconds)
        if (typeof msg.next_generation_estimate_seconds === 'number') setGenEstimate(msg.next_generation_estimate_seconds)
        setConnectStep((s) => (s >= 0 ? CONNECT_STEPS.length - 1 : s))
        void persist(() =>
          createClip({
            sessionId: convexSessionIdRef.current ?? undefined,
            prompt:
              promptsByVersionRef.current.get(msg.prompt_version ?? promptVersionRef.current) ??
              promptsByVersionRef.current.get(promptVersionRef.current) ??
              '',
            promptVersion: msg.prompt_version ?? promptVersionRef.current,
            chunkIndex,
            durationSeconds: msg.duration_seconds ?? msg.duration ?? 0,
            source: 'director',
          }),
        )
      }
    },
    [appendLog, persist, logPromptEvent, createClip, setSessionStatus],
  )

  const sendPrompt = useCallback(
    (text: string, configure: boolean) => {
      const session = sessionRef.current
      if (!session) return
      promptVersionRef.current += 1
      const version = promptVersionRef.current
      promptsByVersionRef.current.set(version, text)
      if (configure) {
        // Full configure message: world prompt + every locked setting. A script
        // in configure cannot combine with end_image_url/audio_url — the beats
        // carry their own.
        const beats = sendScriptOnConnect ? beatsToWire(scriptBeats) : []
        const wire: ConfigureWire = {
          protocol_version: 1,
          type: 'configure',
          prompt: text,
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
          protocol_version: 1,
          type: 'prompt',
          prompt: text,
          prompt_version: version,
          ...(liveEndImage.trim() ? { end_image_url: liveEndImage.trim() } : {}),
          ...(liveAudioUrl.trim() ? { audio_url: liveAudioUrl.trim(), audio_behavior: 'replace' } : {}),
        }
        session.send(wire)
      }
      setActivePrompt(text)
      setDirections((prev) => [...prev, { version, text, status: 'sent' as const }].slice(-8))
      appendLog(`${configure ? 'configure' : 'prompt'} sent (v${version})`)
      void persist(() =>
        logPromptEvent({
          sessionId: convexSessionIdRef.current!,
          kind: configure ? 'configure' : 'prompt',
          prompt: text,
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
        protocol_version: 1,
        type: 'prompt',
        prompt_version: version,
        script: wireBeats,
        script_mode: mode,
      }
      session.send(wire)
      setActivePrompt(`script (${wireBeats.length} beats, ${mode})`)
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

  /** A chat-sourced direction; attributed so the expander and the log show the chatter. */
  const sendChatDirection = useCallback(
    (text: string, author: string) => {
      sendPrompt(`[chat @${author}] ${text}`, false)
      appendLog(`chat @${author}: ${text.slice(0, 80)}`)
    },
    [sendPrompt, appendLog],
  )

  const disconnect = useCallback(async () => {
    // Invalidate any in-flight connect() so a cancelled startup can't open a session.
    connectAttemptRef.current += 1
    setState('closing')
    const blob = await stopRecorder()
    const session = sessionRef.current
    sessionRef.current = null
    if (session) {
      try {
        session.send({ type: 'stop' })
      } catch {
        // channel may already be closing
      }
      await session.close()
    }
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setConnectStep(-1)
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
    setState('idle')
  }, [stopRecorder, uploadRecording, persist, setSessionStatus])

  const connect = useCallback(async () => {
    const attempt = ++connectAttemptRef.current
    setError(null)
    setLog([])
    promptVersionRef.current = 0
    promptsByVersionRef.current = new Map()
    clipIndexRef.current = 0
    setPlaybackSeconds(null)
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
        setConnectStep(CONNECT_STEPS.length - 1)
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
  }, [createSession, prompt, appendLog, handleData, persist, setSessionStatus, sendPrompt, settings, scriptBeats])

  // Ping the session every 5s while a session object exists; `pong` sets pingMs.
  useEffect(() => {
    if (state !== 'live' && state !== 'opening') return
    pingTimerRef.current = setInterval(() => {
      sessionRef.current?.send({ type: 'ping', ts: Date.now() })
    }, 5000)
    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      pingTimerRef.current = null
    }
  }, [state])

  useEffect(() => {
    return () => {
      recorderRef.current?.stop()
      sessionRef.current?.close()
    }
  }, [])

  const live = state === 'live'
  const busy = state === 'opening' || state === 'closing'

  return (
    <div>
      <div className="fal-card">
        <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="fal-card-title">Director (realtime WebRTC)</h3>
            <p className="text-xs text-fal-gray-500 font-mono">{DIRECTOR_MODEL}</p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                live
                  ? 'bg-green-100 text-green-700'
                  : busy
                    ? 'bg-yellow-100 text-yellow-700'
                    : state === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-fal-gray-100 text-fal-gray-600'
              }`}
            >
              {state}
            </span>
            {recording && (
              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                <Circle className="w-3 h-3 fill-current animate-pulse" />
                <span>REC {formatBytes(recordedBytes)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

        <div className="fal-card-content space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-contain" />
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
                        <Circle className="w-3 h-3 fill-transparent text-fal-gray-600" />
                      )}
                      <span className={i <= connectStep ? 'text-fal-gray-100' : 'text-fal-gray-500'}>
                        {label}
                      </span>
                    </div>
                  ))}
                  <button onClick={disconnect} className="text-xs text-fal-gray-400 hover:text-white mt-1 underline">
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="text-fal-gray-400 text-sm">
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
              <button
                onClick={() => void captureFrame('admin')}
                disabled={capturing}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-black/60 text-white text-xs hover:bg-black/80 disabled:opacity-50"
                title="Snapshot this frame → becomes the next end frame + next session's first frame"
              >
                <Camera className="w-4 h-4" />
                {capturing ? 'Capturing…' : 'Capture frame'}
              </button>
              <div className="absolute top-3 left-3 flex items-center gap-3 rounded-md bg-black/60 px-3 py-1.5 text-xs font-mono text-white">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live
                  {playbackSeconds != null && ` · ${playbackSeconds.toFixed(1)}s`}
                </span>
                {pingMs != null && <span className="text-yellow-300">Ping · {pingMs} ms</span>}
                {bufferDepth != null && <span className="text-fal-gray-300">buf {bufferDepth.toFixed(1)}s</span>}
                {genEstimate != null && <span className="text-fal-gray-300">gen {genEstimate.toFixed(1)}s</span>}
              </div>
            </>
          )}
        </div>

        {(live || connectStep >= 0) && (
          <div className="text-xs font-mono text-fal-gray-500 space-y-1">
            {sessionAllowance != null && (
              <p>
                Session allowance: {Math.floor(sessionAllowance / 60)}:{String(Math.floor(sessionAllowance % 60)).padStart(2, '0')}
                {playbackSeconds != null &&
                  ` · about ${Math.max(0, Math.floor((sessionAllowance - playbackSeconds) / 60))}m remaining`}
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
                          ? 'text-red-600'
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
          <details className="rounded-md border border-fal-gray-200">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-fal-gray-700 select-none">
              Session settings <span className="text-xs text-fal-gray-400 font-normal">(locked once connected)</span>
            </summary>
            <div className="px-3 pb-3">
              <DirectorSettingsForm
                settings={settings}
                onChange={setSettings}
                disabled={live || busy}
                scriptPlanned={sendScriptOnConnect && beatsToWire(scriptBeats).length > 0}
              />
            </div>
          </details>
        )}

        <div>
          <label className="block text-sm font-medium text-fal-gray-700 mb-1">
            {live ? 'Next direction' : 'Opening prompt (the series premise)'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-fal-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
          />
          {activePrompt && (
            <p className="text-xs text-fal-gray-500 mt-1">
              Active (v{promptVersionRef.current}): {activePrompt}
            </p>
          )}
          {live && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-2">
              <div>
                <label className="block text-xs text-fal-gray-500 mb-1">End frame for next scene (optional)</label>
                <AssetUrlInput value={liveEndImage} onChange={setLiveEndImage} placeholder="Image URL or upload" />
              </div>
              <div>
                <label className="block text-xs text-fal-gray-500 mb-1">Replace audio track (optional)</label>
                <AssetUrlInput value={liveAudioUrl} onChange={setLiveAudioUrl} kind="audio" placeholder="Audio URL or upload" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!live && !busy ? (
            <button onClick={connect} className="fal-button-primary flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Start Director</span>
            </button>
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
              <Circle className="w-4 h-4 text-red-600" />
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
          {uploading && <span className="text-sm text-fal-gray-500 self-center">Uploading…</span>}
          {lastUpload && !uploading && <span className="text-sm text-green-700 self-center">{lastUpload}</span>}
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        {log.length > 0 && (
          <pre className="text-xs font-mono bg-fal-gray-50 border border-fal-gray-200 rounded-md p-3 max-h-40 overflow-auto">
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
    </div>
  )
}
