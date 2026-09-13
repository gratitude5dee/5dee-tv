'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clapperboard, ListPlus, Play, Plus, Send, Trash2 } from 'lucide-react'
import AssetUrlInput from './AssetUrlInput'
import ScriptTemplatePicker, { type TemplateAppliedMeta } from './ScriptTemplatePicker'
import { useConvexEnabled } from './ConvexClientProvider'
import { beatsToWire, type ScriptBeat } from '../lib/directorProtocol'

interface ScriptEditorProps {
  beats: ScriptBeat[]
  onChange: (beats: ScriptBeat[]) => void
  /** Attach the script to the next `configure` (pre-connect send). */
  sendOnConnect: boolean
  onSendOnConnectChange: (v: boolean) => void
  /** Send a prompt message carrying the script while live. */
  onSendLive: (beats: ScriptBeat[], mode: 'replace' | 'append') => void
  live: boolean
  /** Seconds of video played under the running script (from chunk messages), for progress display. */
  playbackSeconds: number | null
  /** Fired after a saved shotboard template fills the beats — carries session-level
   * extras (first frame, lead character) to sync into Director settings. */
  onTemplateApplied?: (meta: TemplateAppliedMeta) => void
}

const newBeat = (beats: ScriptBeat[]): ScriptBeat => ({
  offset: beats.length ? Math.max(...beats.map((b) => b.offset)) + 10 : 0,
  prompt: '',
  endImageUrl: '',
  audioUrl: '',
})

export default function ScriptEditor({
  beats,
  onChange,
  sendOnConnect,
  onSendOnConnectChange,
  onSendLive,
  live,
  playbackSeconds,
  onTemplateApplied,
}: ScriptEditorProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const convexEnabled = useConvexEnabled()

  const update = (i: number, patch: Partial<ScriptBeat>) =>
    onChange(beats.map((b, j) => (j === i ? { ...b, ...patch } : b)))

  const wire = beatsToWire(beats)
  const activeBeat =
    playbackSeconds == null
      ? null
      : [...wire].reverse().find((b) => b.offset <= playbackSeconds) ?? null

  return (
    <div className="fal-card mt-4">
      <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-fal-gray-500 dark:text-fal-gray-400" />
            <h3 className="fal-card-title">Script</h3>
          </div>
          <span className="text-xs text-fal-gray-500 dark:text-fal-gray-400">
            {wire.length} beat{wire.length === 1 ? '' : 's'}
            {activeBeat && ` · beat @${activeBeat.offset}s playing`}
          </span>
        </div>
      </div>
      <div className="fal-card-content space-y-3">
        <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">
          Timed shots the model runs on its own clock — each beat&rsquo;s direction starts at its offset and
          holds until the next one. Sent with the session, or pushed live to replace/append the queue.
        </p>

        {convexEnabled && (
          <div className="flex flex-wrap items-center gap-2">
            <ScriptTemplatePicker
              onApply={(compiled, meta) => {
                onChange(compiled)
                onTemplateApplied?.(meta)
              }}
            />
          </div>
        )}

        {beats.map((beat, i) => (
          <div key={i} className="rounded-md border border-fal-gray-200 dark:border-fal-gray-700 p-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={beat.offset}
                onChange={(e) => update(i, { offset: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                className="w-16 rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs"
                title="Offset in seconds"
              />
              <span className="text-xs text-fal-gray-400">s</span>
              <textarea
                value={beat.prompt}
                onChange={(e) => update(i, { prompt: e.target.value })}
                rows={2}
                placeholder="Direction for this shot…"
                className="flex-1 rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500"
              />
              <button
                type="button"
                onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
                className="p-1 text-fal-gray-400 hover:text-fal-gray-600 dark:text-fal-gray-400"
                aria-label="Optional assets"
              >
                {expanded[i] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onChange(beats.filter((_, j) => j !== i))}
                className="p-1 text-fal-gray-400 hover:text-red-600 dark:text-red-400"
                aria-label="Delete shot"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {expanded[i] && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pl-1">
                <div>
                  <label className="block text-xs text-fal-gray-500 dark:text-fal-gray-400 mb-1">End frame at this offset</label>
                  <AssetUrlInput
                    value={beat.endImageUrl}
                    onChange={(u) => update(i, { endImageUrl: u })}
                    placeholder="Image URL or upload"
                  />
                </div>
                <div>
                  <label className="block text-xs text-fal-gray-500 dark:text-fal-gray-400 mb-1">Audio starting at this offset</label>
                  <AssetUrlInput
                    value={beat.audioUrl}
                    onChange={(u) => update(i, { audioUrl: u })}
                    kind="audio"
                    placeholder="Audio URL or upload"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChange([...beats, newBeat(beats)])}
            className="fal-button-secondary flex items-center gap-1.5 text-xs !py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add shot</span>
          </button>

          {live ? (
            <>
              <button
                type="button"
                onClick={() => onSendLive(beats, 'replace')}
                disabled={!wire.length}
                className="fal-button-secondary flex items-center gap-1.5 text-xs !py-1.5 disabled:opacity-50"
                title="Cut to this script at the next chunk"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Cut to script</span>
              </button>
              <button
                type="button"
                onClick={() => onSendLive(beats, 'append')}
                disabled={!wire.length}
                className="fal-button-secondary flex items-center gap-1.5 text-xs !py-1.5 disabled:opacity-50"
                title="Queue after the running script"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Queue script</span>
              </button>
            </>
          ) : (
            <label className="flex items-center gap-1.5 text-xs text-fal-gray-600 dark:text-fal-gray-400">
              <input
                type="checkbox"
                checked={sendOnConnect}
                onChange={(e) => onSendOnConnectChange(e.target.checked)}
                className="rounded border-fal-gray-300 dark:border-fal-gray-700"
              />
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" /> Send with session start
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
