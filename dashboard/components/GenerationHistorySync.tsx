'use client'

import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { GenerationParams } from '../types'
import { useConvexEnabled } from './ConvexClientProvider'

interface Props {
  generationHistory?: GenerationParams[]
  fps?: number
}

function ConvexSync({ generationHistory = [], fps }: Props) {
  const recordMany = useMutation(api.generations.recordMany)
  const lastKeyRef = useRef<string>('')

  useEffect(() => {
    if (generationHistory.length === 0) return
    const last = generationHistory[generationHistory.length - 1]
    const key = `${last.generation_id}:${last.timestamp}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    recordMany({
      fps,
      generations: generationHistory.map((g) => ({
        generationId: g.generation_id,
        timestamp: g.timestamp,
        prompt: g.prompt,
        negativePrompt: g.negative_prompt,
        width: g.width,
        height: g.height,
        numFrames: g.num_frames,
        strength: g.strength,
        guidanceScale: g.guidance_scale,
        timesteps: g.timesteps,
      })),
    }).catch((e) => console.error('Failed to persist generation history', e))
  }, [generationHistory, fps, recordMany])

  return null
}

/** Mirrors the metrics socket's LTX generation history into Convex (`generations` + `clips`). */
export default function GenerationHistorySync(props: Props) {
  const enabled = useConvexEnabled()
  return enabled ? <ConvexSync {...props} /> : null
}
