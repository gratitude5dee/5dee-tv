'use client'

import { useQuery } from 'convex/react'
import { Clock, Film, Layers } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import ConvexNotConfigured from '../../../components/ConvexNotConfigured'
import { useConvexEnabled } from '../../../components/ConvexClientProvider'
import PixelCard from '../../../components/reactbits/PixelCard'

function ClipsList() {
  const clips = useQuery(api.clips.list, { limit: 100 })

  return (
    <div className="fal-card">
      <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Film className="w-5 h-5 text-fal-blue-500" />
            <h3 className="text-lg font-semibold text-fal-gray-900 dark:text-fal-gray-50">Clips</h3>
          </div>
          <div className="text-sm text-fal-gray-600 dark:text-fal-gray-400">{clips ? `${clips.length} clips` : 'Loading…'}</div>
        </div>
      </div>

      <div className="fal-card-content">
        {clips && clips.length === 0 ? (
          <div className="text-center py-8 text-fal-gray-600 dark:text-fal-gray-400">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No clips yet</p>
            <p className="text-sm">Start an LTX stream or a Director session to populate clips</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clips?.map((clip, index) => (
              <PixelCard
                key={clip._id}
                variant="blue"
                noFocus
                className={index === 0 ? 'pixel-card-latest' : ''}
              >
                <div className="relative">
                <div className="aspect-video bg-black flex items-center justify-center">
                  {clip.url ? (
                    <video src={clip.url} controls preload="metadata" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-xs text-fal-gray-400 text-center px-4">
                      <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No media stored for this segment
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-fal-gray-600 dark:text-fal-gray-400">
                    <span className="font-mono">
                      {clip.source} · {clip.promptVersion !== undefined ? `segment v${clip.promptVersion}` : `chunk #${clip.chunkIndex}`}
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(clip.createdAt).toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="text-sm text-fal-gray-900 dark:text-fal-gray-50 bg-fal-gray-100 dark:bg-fal-gray-800 rounded p-2 font-mono">
                    <p className="line-clamp-3">{clip.prompt}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-fal-gray-600 dark:text-fal-gray-400">
                    <span>{clip.durationSeconds.toFixed(1)}s</span>
                    {clip.sessionId && (
                      <span className="flex items-center space-x-1 font-mono" title={clip.sessionId}>
                        <Layers className="w-3 h-3" />
                        <span>{clip.sessionId.slice(0, 8)}…</span>
                      </span>
                    )}
                  </div>
                </div>
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClipsPage() {
  const enabled = useConvexEnabled()
  return enabled ? <ClipsList /> : <ConvexNotConfigured feature="clips" />
}
