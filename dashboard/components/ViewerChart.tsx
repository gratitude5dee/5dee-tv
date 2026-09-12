'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
        capturedAt: s.capturedAt,
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
            <h3 className="text-lg font-semibold text-fal-gray-900">{title}</h3>
          </div>
          <div className="text-sm text-fal-gray-600 font-mono">
            {span ? `Last ${span}` : `${samples.length} samples`}
          </div>
        </div>
      </div>
      <div className="fal-card-content">
        {chartData.length > 1 ? (
          <div className="bg-white rounded-lg p-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#4b5563' }}
                  minTickGap={40}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={{ stroke: '#e5e7eb' }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(_, payload) => {
                    const at = payload?.[0]?.payload?.capturedAt
                    return at ? new Date(at).toLocaleString() : ''
                  }}
                  formatter={(value: number) => [`${value} viewers`, 'Viewers']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="viewers"
                  stroke="#a78bfa"
                  fill="#a78bfa"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 bg-white rounded-lg">
            <div className="text-fal-gray-600">Collecting samples…</div>
          </div>
        )}
      </div>
    </div>
  )
}
