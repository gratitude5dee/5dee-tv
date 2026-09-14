'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Check, Loader2, Music, Play, Trash2, Upload } from 'lucide-react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useConvexEnabled } from './ConvexClientProvider'
import MorphSlider from './reactbits/MorphSlider'

interface TrackManagerProps {
  /** Use the track as the session's target audio (configure-time audio_url). */
  onUseForSession: (url: string) => void
  /** Use the track on the next live prompt (one-shot audio_url). */
  onUseLive: (url: string) => void
  /** Mix the original song locally with the Director stream output. */
  onUseForMix?: (config: { url: string; volume: number; offsetSeconds: number; loop: boolean }) => void
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

function TrackManagerInner({ onUseForSession, onUseLive, onUseForMix, live }: TrackManagerProps) {
  const tracks = useQuery(api.tracks.list)
  const generateUploadUrl = useMutation(api.tracks.generateUploadUrl)
  const addTrack = useMutation(api.tracks.add)
  const removeTrack = useMutation(api.tracks.remove)
  const deleteStorage = useMutation(api.recordings.deleteStorage)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Id<'tracks'> | null>(null)
  const [mixVolume, setMixVolume] = useState(0.25)
  const [mixOffset, setMixOffset] = useState(0)
  const [mixLoop, setMixLoop] = useState(false)
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
  const sliderTracks = useMemo(() => (tracks ?? []).filter((track) => Boolean(track.coverUrl && track.url)), [tracks])
  const sliderItems = useMemo(() => sliderTracks.map((track) => ({ image: track.coverUrl!, caption: track.name })), [sliderTracks])
  const selectedSliderIndex = sliderTracks.findIndex((track) => track._id === selected)
  const selectSliderTrack = useCallback((index: number) => setSelected(sliderTracks[index]?._id ?? null), [sliderTracks])

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
      <div className="fal-card-content space-y-4">
        {tracks === undefined && <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">Loading…</p>}
        {tracks?.length === 0 && (
          <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">
            No songs yet — upload one to use it as the stream&apos;s audio reference.
          </p>
        )}
        {sliderTracks.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-violet-300/50 bg-[#0c0c12] shadow-[0_18px_50px_rgba(44,20,89,0.18)] dark:border-violet-400/25" aria-label="Coast originals artwork carousel">
            <div className="relative mx-auto aspect-square w-full max-w-xl">
              <MorphSlider
                key={sliderTracks.map((track) => track._id).join(':')}
                items={sliderItems}
                activeIndex={selectedSliderIndex >= 0 ? selectedSliderIndex : undefined}
                transition="melt"
                intensity={0.46}
                aberration={0.24}
                drift={0.22}
                autoplay
                autoplayDelay={6}
                radius={12}
                overlayColor="#090713"
                onIndexChange={selectSliderTrack}
              />
              <div className="absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-100 backdrop-blur">
                Coast originals · {sliderTracks.length} tracks
              </div>
            </div>
          </section>
        )}
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {tracks?.map((track) => (
            <li
              key={track._id}
              className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 text-xs cursor-pointer transition-colors ${
                selected === track._id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/35'
                  : 'border-fal-gray-200 bg-white/80 hover:border-violet-300 dark:border-fal-gray-700 dark:bg-fal-gray-900/80 dark:hover:border-violet-500/60'
              }`}
              onClick={() => setSelected(selected === track._id ? null : track._id)}
            >
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                selected === track._id ? 'border-fal-primary-500' : 'border-fal-gray-400'
              }`}>
                {selected === track._id && <Check className="w-2.5 h-2.5 text-fal-primary-500" />}
              </span>
              {track.coverUrl ? (
                // Convex storage provides a public, CORS-enabled image URL for the slider and thumbnail.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={track.coverUrl} alt="" className="h-10 w-10 rounded-md object-cover ring-1 ring-black/10" />
              ) : <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-200"><Music className="h-4 w-4" /></div>}
              <span className="min-w-0 flex-1"><span className="block truncate font-medium text-fal-gray-800 dark:text-fal-gray-100">{track.name}</span><span className="block pt-0.5 text-[10px] text-fal-gray-400">{formatBytes(track.sizeBytes)}</span></span>
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
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-500/25 dark:bg-violet-950/20">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-fal-gray-800 dark:text-fal-gray-100"><Music className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" /> {selectedTrack.name}</div>
            <div className="flex flex-wrap items-center gap-2">
            <audio controls preload="metadata" src={selectedTrack.url} className="h-8 max-w-full" aria-label={`Preview ${selectedTrack.name}`} />
            <label className="flex items-center gap-1 text-[10px] text-fal-gray-500">Volume
              <input type="range" min="0" max="1" step="0.05" value={mixVolume} onChange={(e) => setMixVolume(Number(e.target.value))} aria-label="Music mix volume" />
              <span>{Math.round(mixVolume * 100)}%</span>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-fal-gray-500">Start (s)
              <input type="number" min="0" step="1" value={mixOffset} onChange={(e) => setMixOffset(Math.max(0, Number(e.target.value) || 0))} className="w-14 rounded border px-1 py-0.5" aria-label="Music start offset" />
            </label>
            <label className="flex items-center gap-1 text-[10px] text-fal-gray-500"><input type="checkbox" checked={mixLoop} onChange={(e) => setMixLoop(e.target.checked)} /> Loop</label>
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
            {onUseForMix && (
              <button
                onClick={() => onUseForMix({ url: selectedTrack.url!, volume: mixVolume, offsetSeconds: mixOffset, loop: mixLoop })}
                className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5"
                title="Mix the song with Director speech and effects in preview, recordings, clips, and Twitch"
              >
                <Music className="w-3 h-3" /> Mix in output
              </button>
            )}
            </div>
          </div>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  )
}
