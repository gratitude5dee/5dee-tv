'use client'

import { IMAGE_MODELS, getImageModel } from '../../lib/imageModels'

const selectClass =
  'rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500 bg-white dark:bg-fal-gray-900'

interface ImageModelSelectProps {
  modelId: string
  quality?: string
  onChange: (modelId: string) => void
  onQualityChange?: (quality: string) => void
  compact?: boolean
}

/** Image-model picker: nano-banana (default) + GPT Image 2.5 variants. */
export default function ImageModelSelect({ modelId, quality, onChange, onQualityChange, compact }: ImageModelSelectProps) {
  const model = getImageModel(modelId)
  return (
    <span className={`flex items-center gap-1.5 ${compact ? '' : 'flex-wrap'}`}>
      <select
        value={model.id}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
        title="Image model used for generation"
      >
        {IMAGE_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {model.qualities && (
        <select
          value={quality ?? model.defaultQuality}
          onChange={(e) => onQualityChange?.(e.target.value)}
          className={selectClass}
          title="GPT Image 2.5 quality — higher = more detail, slower, pricier"
        >
          {model.qualities.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      )}
    </span>
  )
}
