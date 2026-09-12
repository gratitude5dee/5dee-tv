'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createFalClient } from '@fal-ai/client'
import { wma, type ManagedRealtimeSession, type RealtimeState, type WmaRealtimeSession } from '@fal-ai/client/realtime'
import { Circle, Play, Send, Square, Upload, Volume2, VolumeX } from 'lucide-react'
import type { Id } from '../convex/_generated/dataModel'
import type { DirectorPersistence } from './useDirectorPersistence'

export const DIRECTOR_MODEL = 'minimax/h3-max/director'
export const FAL_SDK_PROXY_URL = '/api/fal/sdk-proxy'

const DEFAULT_PROMPT =
  'A continuous original live-action stream following a group of friends as they explore a new city.'

type DirectorSession = ManagedRealtimeSession<WmaRealtimeSession>

interface DirectorMessage {
  type?: string
  prompt_version?: number
  chunk_index?: number
  duration?: number
  duration_seconds?: number
  message?: string
  error?: string
  [key: string]: unknown
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
  const convexSessionIdRef = useRef<Id<'sessions'> | null>(null)
  const clipIndexRef = useRef(0)

  const [state, setState] = useState<RealtimeState | 'idle'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [muted, setMuted] = useState(true)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recordedBytes, setRecordedBytes] = useState(0)
  const [lastUpload, setLastUpload] = useState<string | null>(null)

  const noop = async () => undefined
  const createSession = persistence?.createSession
  const setSessionStatus = persistence?.setSessionStatus ?? noop
  const logPromptEvent = persistence?.logPromptEvent ?? noop
  const createClip = persistence?.createClip ?? noop
  const generateUploadUrl = persistence?.generateUploadUrl
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
    async (blob: Blob) => {
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
      try {
        const uploadUrl = await generateUploadUrl()
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': blob.type },
          body: blob,
        })
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
        const { storageId } = (await res.json()) as { storageId: Id<'_storage'> }
        const durationSeconds = recordingStartedAtRef.current
          ? (Date.now() - recordingStartedAtRef.current) / 1000
          : 0
        await createRecording({
          sessionId: convexSessionIdRef.current ?? undefined,
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
      } finally {
        setUploading(false)
        recordingStartedAtRef.current = null
      }
    },
    [convexEnabled, generateUploadUrl, createRecording, activePrompt, appendLog],
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

      if (/chunk|segment/.test(type) && /(complete|done|finished|end)/.test(type)) {
        const chunkIndex = typeof msg.chunk_index === 'number' ? msg.chunk_index : clipIndexRef.current
        clipIndexRef.current = chunkIndex + 1
        void persist(() =>
          createClip({
            sessionId: convexSessionIdRef.current ?? undefined,
            prompt: activePrompt ?? prompt,
            promptVersion: msg.prompt_version ?? promptVersionRef.current,
            chunkIndex,
            durationSeconds: msg.duration_seconds ?? msg.duration ?? 0,
            source: 'director',
          }),
        )
      }
    },
    [appendLog, persist, logPromptEvent, createClip, activePrompt, prompt],
  )

  const sendPrompt = useCallback(
    (text: string, configure: boolean) => {
      const session = sessionRef.current
      if (!session) return
      promptVersionRef.current += 1
      const version = promptVersionRef.current
      session.send({
        protocol_version: 1,
        type: configure ? 'configure' : 'prompt',
        prompt: text,
        prompt_version: version,
      })
      setActivePrompt(text)
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
    [appendLog, persist, logPromptEvent],
  )

  const disconnect = useCallback(async () => {
    const blob = await stopRecorder()
    const session = sessionRef.current
    sessionRef.current = null
    if (session) await session.close()
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setState('idle')
    if (blob) await uploadRecording(blob)
    await persist(() =>
      convexSessionIdRef.current
        ? setSessionStatus({ sessionId: convexSessionIdRef.current, status: 'ended' })
        : Promise.resolve(),
    )
    convexSessionIdRef.current = null
  }, [stopRecorder, uploadRecording, persist, setSessionStatus])

  const connect = useCallback(async () => {
    setError(null)
    setLog([])
    promptVersionRef.current = 0
    clipIndexRef.current = 0
    setState('opening')

    if (createSession) {
      try {
        convexSessionIdRef.current = await createSession({
          model: 'director',
          outputMode: 'webrtc',
          config: { model: DIRECTOR_MODEL, prompt },
        })
      } catch (e) {
        appendLog(`convex: ${e instanceof Error ? e.message : String(e)}`)
      }
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
        if (d.kind !== 'progress') appendLog(`${d.kind}: ${d.message}`)
      },
    })
    sessionRef.current = session
    sendPrompt(prompt, true)
  }, [createSession, prompt, appendLog, handleData, persist, setSessionStatus, sendPrompt])

  useEffect(() => {
    return () => {
      recorderRef.current?.stop()
      sessionRef.current?.close()
    }
  }, [])

  const live = state === 'live'
  const busy = state === 'opening'

  return (
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
            <div className="absolute inset-0 flex items-center justify-center text-fal-gray-400 text-sm">
              {busy ? 'Negotiating WebRTC session…' : 'Director offline'}
            </div>
          )}
          {live && (
            <button
              onClick={() => setMuted((m) => !m)}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-fal-gray-700 mb-1">Prompt</label>
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
            <span>Update prompt</span>
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
  )
}
