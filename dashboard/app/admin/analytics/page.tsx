'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { AlertCircle, Clock, Eye, Gamepad2, Heart, Radio, RefreshCw } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { useConvexEnabled } from '../../../components/ConvexClientProvider'
import ViewerChart, { type ViewerSample } from '../../../components/ViewerChart'
import type { TwitchAnalytics } from '../../api/twitch/route'

const POLL_MS = 30_000
const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000

function formatUptime(seconds: number | null) {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Eye
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="fal-card">
      <div className="fal-card-content py-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${accent}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-fal-gray-600 dark:text-fal-gray-400">{label}</div>
            <div className="text-xl font-semibold text-fal-gray-900 dark:text-fal-gray-50 font-mono">{value}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Writes each poll to Convex and feeds the persisted history back to the chart. */
function ConvexHistory({
  latest,
  onHistory,
}: {
  latest: TwitchAnalytics | null
  onHistory: (samples: ViewerSample[]) => void
}) {
  const record = useMutation(api.twitchStats.record)
  // Anchor the window to the poll timestamp so query args only change once per poll.
  const history = useQuery(
    api.twitchStats.history,
    latest ? { channel: latest.channel, sinceMs: latest.capturedAt - HISTORY_WINDOW_MS } : 'skip',
  )
  const lastRecordedRef = useRef<number>(0)

  useEffect(() => {
    if (!latest || latest.capturedAt === lastRecordedRef.current) return
    lastRecordedRef.current = latest.capturedAt
    record({
      channel: latest.channel,
      viewerCount: latest.viewerCount,
      followerCount: latest.followerCount ?? undefined,
      isLive: latest.isLive,
      title: latest.title ?? undefined,
      gameName: latest.gameName ?? undefined,
    }).catch((e) => console.error('Failed to record twitch sample', e))
  }, [latest, record])

  useEffect(() => {
    if (history) onHistory(history)
  }, [history, onHistory])

  return null
}

export default function AnalyticsPage() {
  const convexEnabled = useConvexEnabled()
  const [data, setData] = useState<TwitchAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [localSamples, setLocalSamples] = useState<ViewerSample[]>([])
  const [persistedSamples, setPersistedSamples] = useState<ViewerSample[] | null>(null)

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/twitch', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      const next = body as TwitchAnalytics
      setData(next)
      setError(null)
      setLocalSamples((prev) =>
        [...prev, { capturedAt: next.capturedAt, viewerCount: next.viewerCount, isLive: next.isLive }].slice(-240),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  const samples = persistedSamples && persistedSamples.length > 1 ? persistedSamples : localSamples

  return (
    <div className="space-y-6">
      {convexEnabled && <ConvexHistory latest={data} onHistory={setPersistedSamples} />}

      {/* Channel header */}
      <div className="fal-card">
        <div className="fal-card-content py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {data?.user?.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.user.profileImageUrl} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-fal-gray-200 dark:bg-fal-gray-800" />
              )}
              <div>
                <div className="text-lg font-semibold text-fal-gray-900 dark:text-fal-gray-50">
                  {data?.user?.displayName ?? data?.channel ?? 'Twitch'}
                </div>
                <div className="text-xs text-fal-gray-600 dark:text-fal-gray-400 font-mono">
                  {data ? `twitch.tv/${data.channel}` : loading ? 'Loading…' : 'Not configured'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`connection-indicator ${
                  data?.isLive ? 'connection-connected' : 'connection-disconnected'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>{data?.isLive ? 'LIVE' : 'OFFLINE'}</span>
              </div>
              <button
                onClick={poll}
                className="bg-fal-gray-100 dark:bg-fal-gray-800 hover:bg-fal-gray-200 dark:bg-fal-gray-800 text-fal-gray-700 dark:text-fal-gray-300 font-medium px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center space-x-2 text-fal-red-600 text-sm mt-3">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Current viewers"
          value={data ? String(data.viewerCount) : '—'}
          accent="bg-fal-purple-500/10 text-fal-purple-500"
        />
        <StatCard
          icon={Heart}
          label="Followers"
          value={data?.followerCount != null ? data.followerCount.toLocaleString() : '—'}
          accent="bg-fal-red-500/10 text-fal-red-500"
        />
        <StatCard
          icon={Clock}
          label="Uptime"
          value={data ? formatUptime(data.uptimeSeconds) : '—'}
          accent="bg-fal-green-500/10 text-fal-green-500"
        />
        <StatCard
          icon={Gamepad2}
          label="Category"
          value={data?.gameName ?? '—'}
          accent="bg-fal-blue-500/10 text-fal-blue-500"
        />
      </div>

      {/* Stream title / thumbnail */}
      {data?.isLive && (
        <div className="fal-card">
          <div className="fal-card-content grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {data.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${data.thumbnailUrl}?t=${data.capturedAt}`}
                alt="Stream preview"
                className="rounded-lg w-full aspect-video object-cover bg-black"
              />
            )}
            <div className="lg:col-span-2">
              <div className="text-sm font-medium text-fal-gray-700 dark:text-fal-gray-300 mb-1">Stream title</div>
              <div className="text-sm text-fal-gray-900 dark:text-fal-gray-50 bg-fal-gray-100 dark:bg-fal-gray-800 rounded p-2 font-mono">{data.title}</div>
              <div className="text-xs text-fal-gray-600 dark:text-fal-gray-400 mt-2">
                Started {data.startedAt ? new Date(data.startedAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      <ViewerChart
        samples={samples}
        title={persistedSamples && persistedSamples.length > 1 ? 'Viewers (last 24h, Convex)' : 'Viewers (this session)'}
      />
    </div>
  )
}
