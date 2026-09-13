'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Check, Loader2, Music, Play, Trash2, Upload } from 'lucide-react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useConvexEnabled } from './ConvexClientProvider'

interface TrackManagerProps {
  /** Use the track as the session's target audio (configure-time audio_url). */
  onUseForSession: (url: string) => void
  /** Use the track on the next live prompt (one-shot audio_url). */
  onUseLive: (url: string) => void
  live: boolean
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Song library: uploads land in Convex storage (public URLs the Director model
 * can fetch), and a selected track feeds audio_url on configure or live prompts.
 * Only mounted when Convex is configured.
 */
export default function TrackManager(props: TrackManagerProps) {
  const convexEnabled = useConvexEnabled()
  if (!convexEnabled) return null
  return <TrackManagerInner {...props} />
}

function TrackManagerInner({ onUseForSession, onUseLive, live }: TrackManagerProps) {
  const tracks = useQuery(api.tracks.list)
  const generateUploadUrl = useMutation(api.tracks.generateUploadUrl)
  const addTrack = useMutation(api.tracks.add)
  const removeTrack = useMutation(api.tracks.remove)
  const deleteStorage = useMutation(api.recordings.deleteStorage)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Id<'tracks'> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    setUploading(true)
    setError(null)
    let storageId: Id<'_storage'> | null = null
    try {
      const uploadUrl = await generateUploadUrl()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type.split(';')[0] || 'audio/mpeg' },
        body: file,
      })
      if (!res.ok) throw new Error(`Upload failed (${res.status})`)
      storageId = ((await res.json()) as { storageId: Id<'_storage'> }).storageId
      await addTrack({
        name: file.name.replace(/\.[a-z0-9]+$/i, ''),
        storageId,
        mimeType: file.type.split(';')[0] || 'audio/mpeg',
        sizeBytes: file.size,
      })
    } catch (e) {
      // Storage was already committed when addTrack fails — delete the orphan.
      let message = e instanceof Error ? e.message : String(e)
      if (storageId) {
        const cleaned = await deleteStorage({ storageId })
          .then(() => true)
          .catch(() => false)
        if (!cleaned) message += ' — and the uploaded file could not be cleaned up'
      }
      setError(message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const selectedTrack = tracks?.find((t) => t._id === selected)

  return (
    <div className="fal-card">
      <div className="fal-card-header flex items-center justify-between">
        <h2 className="fal-card-title flex items-center gap-2">
          <Music className="w-4 h-4" /> Audio library
        </h2>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void upload(f)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload song
          </button>
        </div>
      </div>
      <div className="fal-card-content space-y-2">
        {tracks === undefined && <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">Loading…</p>}
        {tracks?.length === 0 && (
          <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">
            No songs yet — upload one to use it as the stream&apos;s audio reference.
          </p>
        )}
        <ul className="space-y-1">
          {tracks?.map((track) => (
            <li
              key={track._id}
              className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer ${
                selected === track._id
                  ? 'border-fal-primary-500 bg-fal-primary-50 dark:bg-fal-primary-900/20'
                  : 'border-fal-gray-200 dark:border-fal-gray-700'
              }`}
              onClick={() => setSelected(selected === track._id ? null : track._id)}
            >
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                selected === track._id ? 'border-fal-primary-500' : 'border-fal-gray-400'
              }`}>
                {selected === track._id && <Check className="w-2.5 h-2.5 text-fal-primary-500" />}
              </span>
              <span className="flex-1 truncate font-medium text-fal-gray-700 dark:text-fal-gray-300">
                {track.name}
              </span>
              <span className="text-fal-gray-400">{formatBytes(track.sizeBytes)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (selected === track._id) setSelected(null)
                  void removeTrack({ trackId: track._id })
                }}
                className="p-1 text-fal-gray-400 hover:text-red-500"
                aria-label={`Delete ${track.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
        {selectedTrack?.url && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onUseForSession(selectedTrack.url!)}
              className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5"
              title="Use as the target audio on the next session connect"
            >
              <Check className="w-3 h-3" /> Use for session
            </button>
            <button
              onClick={() => onUseLive(selectedTrack.url!)}
              disabled={!live}
              className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5 disabled:opacity-50"
              title="Replace the stream audio on the next direction you send"
            >
              <Play className="w-3 h-3" /> Queue on next direction
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  )
}
