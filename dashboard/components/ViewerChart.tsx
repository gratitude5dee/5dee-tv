'use client'

import { useMemo } from 'react'
import { AreaChart } from '@/components/dither-kit/area-chart'
import { Area } from '@/components/dither-kit/area'
import { XAxis } from '@/components/dither-kit/x-axis'
import { YAxis } from '@/components/dither-kit/y-axis'
import { Tooltip } from '@/components/dither-kit/tooltip'
import { Users } from 'lucide-react'

export interface ViewerSample {
  capturedAt: number
  viewerCount: number
  isLive: boolean
}

interface ViewerChartProps {
  samples: ViewerSample[]
  title?: string
}

export default function ViewerChart({ samples, title = 'Viewers Over Time' }: ViewerChartProps) {
  const chartData = useMemo(
    () =>
      samples.map((s) => ({
        time: new Date(s.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        viewers: s.isLive ? s.viewerCount : 0,
      })),
    [samples],
  )

  const span = useMemo(() => {
    if (samples.length < 2) return null
    const ms = samples[samples.length - 1].capturedAt - samples[0].capturedAt
    const minutes = Math.round(ms / 60000)
    return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`
  }, [samples])

  return (
    <div className="fal-card">
      <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-fal-purple-500" />
            <h3 className="text-lg font-semibold text-fal-gray-900 dark:text-fal-gray-50">{title}</h3>
          </div>
          <div className="text-sm text-fal-gray-600 dark:text-fal-gray-400 font-mono">
            {span ? `Last ${span}` : `${samples.length} samples`}
          </div>
        </div>
      </div>
      <div className="fal-card-content">
        {chartData.length > 1 ? (
          <div className="bg-white dark:bg-fal-gray-900 rounded-lg p-4">
            <AreaChart
              data={chartData}
              config={{ viewers: { label: 'Viewers', color: 'blue' } }}
              bloom="aura"
              className="h-[220px] w-full"
            >
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip labelKey="time" />
              <Area dataKey="viewers" variant="gradient" />
            </AreaChart>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 bg-white dark:bg-fal-gray-900 rounded-lg">
            <div className="text-fal-gray-600 dark:text-fal-gray-400">Collecting samples…</div>
          </div>
        )}
      </div>
    </div>
  )
}
