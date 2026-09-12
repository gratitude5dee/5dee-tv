'use client'

import { useMutation, useQuery } from 'convex/react'
import { Clock, Download, Trash2, Video } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import ConvexNotConfigured from '../../../components/ConvexNotConfigured'
import { useConvexEnabled } from '../../../components/ConvexClientProvider'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(seconds: number) {
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function RecordingsList() {
  const recordings = useQuery(api.recordings.list, { limit: 100 })
  const remove = useMutation(api.recordings.remove)

  return (
    <div className="fal-card">
      <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Video className="w-5 h-5 text-fal-blue-500" />
            <h3 className="text-lg font-semibold text-fal-gray-900">Recordings</h3>
          </div>
          <div className="text-sm text-fal-gray-600">
            {recordings ? `${recordings.length} recordings` : 'Loading…'}
          </div>
        </div>
      </div>

      <div className="fal-card-content">
        {recordings && recordings.length === 0 ? (
          <div className="text-center py-8 text-fal-gray-600">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recordings yet</p>
            <p className="text-sm">Use “Record” on the Director player, then “Stop &amp; save recording”</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recordings?.map((recording, index) => (
              <div
                key={recording._id}
                className={`border rounded-lg p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 ${
                  index === 0 ? 'border-fal-green-500 bg-fal-green-500/10' : 'border-fal-gray-200 bg-fal-gray-50'
                }`}
              >
                <div className="aspect-video bg-black rounded overflow-hidden">
                  {recording.url ? (
                    <video src={recording.url} controls preload="metadata" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-fal-gray-400">
                      Media unavailable
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-fal-gray-900">
                        {recording.title ?? `${recording.model} recording`}
                      </span>
                      <span className="flex items-center space-x-1 text-xs text-fal-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(recording.createdAt).toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-fal-gray-600">Duration</div>
                        <div className="font-mono text-fal-gray-900">{formatDuration(recording.durationSeconds)}</div>
                      </div>
                      <div>
                        <div className="text-fal-gray-600">Size</div>
                        <div className="font-mono text-fal-gray-900">{formatBytes(recording.sizeBytes)}</div>
                      </div>
                      <div>
                        <div className="text-fal-gray-600">Type</div>
                        <div className="font-mono text-fal-gray-900 truncate" title={recording.mimeType}>
                          {recording.mimeType}
                        </div>
                      </div>
                      <div>
                        <div className="text-fal-gray-600">Session</div>
                        <div className="font-mono text-fal-gray-900 truncate" title={recording.sessionId}>
                          {recording.sessionId ? `${recording.sessionId.slice(0, 8)}…` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {recording.url && (
                      <a
                        href={recording.url}
                        download={`recording-${recording._id}.webm`}
                        className="fal-button-secondary flex items-center space-x-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this recording permanently?')) remove({ recordingId: recording._id })
                      }}
                      className="flex items-center space-x-2 text-sm text-fal-red-600 hover:text-fal-red-700 px-3 py-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecordingsPage() {
  const enabled = useConvexEnabled()
  return enabled ? <RecordingsList /> : <ConvexNotConfigured feature="recordings" />
}
