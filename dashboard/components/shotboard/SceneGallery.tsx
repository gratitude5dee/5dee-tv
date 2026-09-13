'use client'

import { useMemo } from 'react'
// @ts-ignore - vendored reactbits JSX component
import AccordionGallery from '../reactbits/AccordionGallery'
import type { SceneDetails, ShotDetails } from '../../lib/shotboardTypes'

interface SceneGalleryProps {
  scenes: SceneDetails[]
  shots: ShotDetails[]
  selectedSceneId: string | null
  onSelect: (sceneId: string) => void
}

/** Scene strip: one accordion panel per scene, keyed on its keyframe or first shot image. */
export default function SceneGallery({ scenes, shots, selectedSceneId, onSelect }: SceneGalleryProps) {
  const items = useMemo(
    () =>
      scenes.map((s) => {
        const firstImage = shots.find((sh) => sh.sceneId === s.id && sh.imageUrl)?.imageUrl
        return {
          id: s.id,
          image: s.keyframeUrl ?? firstImage ?? '',
          label: s.title || `Scene ${s.sceneNumber}`,
        }
      }),
    [scenes, shots],
  )

  const defaultIndex = Math.max(0, scenes.findIndex((s) => s.id === selectedSceneId))

  if (scenes.length === 0) return null

  return (
    <AccordionGallery
      key={items.map((i) => i.id).join(',')}
      items={items}
      defaultIndex={defaultIndex}
      height={140}
      expandRatio={0.4}
      trigger="hover"
      grayscale
      accentColor="#7c3aed"
      onSelect={(i: number) => {
        const scene = scenes[i]
        if (scene) onSelect(scene.id)
      }}
    />
  )
}
