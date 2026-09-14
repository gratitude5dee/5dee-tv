'use client'

import { Settings2 } from 'lucide-react'
import { ASPECT_RATIOS, getImageModel, type ImageGenerationOptions } from '../lib/imageModels'

interface ImageGenerationControlsProps {
  modelId: string
  options: ImageGenerationOptions
  editing: boolean
  onModelChange: (modelId: string) => void
  onOptionsChange: (patch: Partial<ImageGenerationOptions>) => void
}

const selectClass = 'rounded-full border border-fal-gray-300 bg-white px-3 py-1.5 text-xs text-fal-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-fal-primary-500 dark:border-fal-gray-600 dark:bg-fal-gray-900 dark:text-fal-gray-100'

/** Model-specific controls for Nano Banana 2 and GPT Image 2.5 Fal routes. */
export default function ImageGenerationControls({ modelId, options, editing, onModelChange, onOptionsChange }: ImageGenerationControlsProps) {
  const model = getImageModel(modelId)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Settings2 className="h-4 w-4 text-fal-gray-500" aria-hidden="true" />
        <select value={model.id} onChange={(event) => onModelChange(event.target.value)} className={selectClass} aria-label="Image model">
          <option value="nano-banana">Nano Banana 2</option>
          <option value="gpt-flare">GPT Image 2.5 Flare</option>
          <option value="gpt-sunburst">GPT Image 2.5 Sunburst</option>
        </select>
        <select value={options.aspectRatio ?? '4:3'} onChange={(event) => onOptionsChange({ aspectRatio: event.target.value })} className={selectClass} aria-label="Image aspect ratio">
          {ASPECT_RATIOS.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
        </select>
        <select value={options.numImages ?? 1} onChange={(event) => onOptionsChange({ numImages: Number(event.target.value) })} className={selectClass} aria-label="Image variations">
          {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'image' : 'images'}</option>)}
        </select>
        <select value={options.outputFormat ?? 'png'} onChange={(event) => onOptionsChange({ outputFormat: event.target.value as ImageGenerationOptions['outputFormat'] })} className={selectClass} aria-label="Output image format">
          <option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option>
        </select>
        {model.family === 'nano' ? (
          <select value={options.resolution ?? '1K'} onChange={(event) => onOptionsChange({ resolution: event.target.value as ImageGenerationOptions['resolution'] })} className={selectClass} aria-label="Nano Banana resolution">
            <option value="0.5K">0.5K</option><option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option>
          </select>
        ) : (
          <><select value={options.quality ?? model.defaultQuality ?? 'high'} onChange={(event) => onOptionsChange({ quality: event.target.value })} className={selectClass} aria-label="GPT Image quality">
            {model.qualities?.map((quality) => <option key={quality} value={quality}>{quality}</option>)}
          </select>
          <select value={options.background ?? 'auto'} onChange={(event) => onOptionsChange({ background: event.target.value as ImageGenerationOptions['background'] })} className={selectClass} aria-label="Image background">
            <option value="auto">Auto background</option><option value="opaque">Opaque</option><option value="transparent">Transparent</option>
          </select></>
        )}
      </div>
      <details className="rounded-lg border border-fal-gray-200 bg-fal-gray-50/70 p-2 text-xs dark:border-fal-gray-700 dark:bg-fal-gray-900/70">
        <summary className="cursor-pointer font-medium text-fal-gray-700 dark:text-fal-gray-200">Advanced model controls</summary>
        {model.family === 'nano' ? <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-fal-gray-600 dark:text-fal-gray-300">Seed<input type="number" value={options.seed ?? ''} onChange={(event) => onOptionsChange({ seed: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder="Random" className="mt-1 w-full rounded border border-fal-gray-300 bg-white px-2 py-1.5 dark:border-fal-gray-600 dark:bg-fal-gray-800" /></label>
          <label className="text-fal-gray-600 dark:text-fal-gray-300">Safety tolerance<select value={options.safetyTolerance ?? '4'} onChange={(event) => onOptionsChange({ safetyTolerance: event.target.value as ImageGenerationOptions['safetyTolerance'] })} className="mt-1 w-full rounded border border-fal-gray-300 bg-white px-2 py-1.5 dark:border-fal-gray-600 dark:bg-fal-gray-800">{['1', '2', '3', '4', '5', '6'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="flex items-center gap-2 text-fal-gray-600 dark:text-fal-gray-300"><input type="checkbox" checked={options.enableWebSearch ?? false} onChange={(event) => onOptionsChange({ enableWebSearch: event.target.checked })} /> Enable web search</label>
          <label className="text-fal-gray-600 dark:text-fal-gray-300">Thinking<select value={options.thinkingLevel ?? ''} onChange={(event) => onOptionsChange({ thinkingLevel: event.target.value ? event.target.value as ImageGenerationOptions['thinkingLevel'] : undefined })} className="mt-1 w-full rounded border border-fal-gray-300 bg-white px-2 py-1.5 dark:border-fal-gray-600 dark:bg-fal-gray-800"><option value="">Provider default</option><option value="minimal">Minimal</option><option value="high">High</option></select></label>
          <label className="sm:col-span-2 text-fal-gray-600 dark:text-fal-gray-300">System prompt<textarea value={options.systemPrompt ?? ''} onChange={(event) => onOptionsChange({ systemPrompt: event.target.value })} rows={2} placeholder="Optional model-level instruction" className="mt-1 w-full rounded border border-fal-gray-300 bg-white px-2 py-1.5 dark:border-fal-gray-600 dark:bg-fal-gray-800" /></label>
        </div> : <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-fal-gray-600 dark:text-fal-gray-300">Compression (JPEG/WebP only)<input type="number" min="0" max="100" value={options.outputCompression ?? ''} onChange={(event) => onOptionsChange({ outputCompression: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder="Provider default" className="mt-1 w-full rounded border border-fal-gray-300 bg-white px-2 py-1.5 dark:border-fal-gray-600 dark:bg-fal-gray-800" /></label>
          {editing && <label className="text-fal-gray-600 dark:text-fal-gray-300">Mask URL (optional)<input type="url" value={options.maskUrl ?? ''} onChange={(event) => onOptionsChange({ maskUrl: event.target.value })} placeholder="https://…" className="mt-1 w-full rounded border border-fal-gray-300 bg-white px-2 py-1.5 dark:border-fal-gray-600 dark:bg-fal-gray-800" /></label>}
        </div>}
      </details>
    </div>
  )
}
