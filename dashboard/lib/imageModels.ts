// Image model registry for shotboard generation. Nano Banana stays the default;
// GPT Image 2.5 adds OpenAI's Flare/Sunburst variants via fal.
//
// Param shapes differ between families — use buildImageInput() to translate.

export type ImageModelKind = 't2i' | 'edit' | 't2i+edit'

export interface ImageModelDef {
  id: string
  label: string
  kind: ImageModelKind
  family: 'nano' | 'gpt-image'
  endpointT2i?: string
  endpointEdit?: string
  /** GPT Image 2.5 quality levels; undefined = no quality param (nano). */
  qualities?: readonly string[]
  defaultQuality?: string
}

/**
 * Model-specific knobs exposed by the asset studio. Unsupported fields are
 * never forwarded to Fal; callers cannot accidentally copy Nano parameters to
 * the GPT Image endpoints (or the other way around).
 */
export interface ImageGenerationOptions {
  aspectRatio?: string
  quality?: string
  numImages?: number
  outputFormat?: 'jpeg' | 'png' | 'webp'
  resolution?: '0.5K' | '1K' | '2K' | '4K'
  seed?: number
  systemPrompt?: string
  enableWebSearch?: boolean
  safetyTolerance?: '1' | '2' | '3' | '4' | '5' | '6'
  thinkingLevel?: 'minimal' | 'high'
  background?: 'auto' | 'transparent' | 'opaque'
  outputCompression?: number
  maskUrl?: string
}

export const MAX_ASSET_REFERENCES = 14
export const ASPECT_RATIOS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'] as const

export const IMAGE_MODELS: readonly ImageModelDef[] = [
  {
    id: 'nano-banana',
    label: 'Nano Banana 2',
    kind: 't2i+edit',
    family: 'nano',
    endpointT2i: 'fal-ai/nano-banana-2',
    endpointEdit: 'fal-ai/nano-banana-2/edit',
  },
  {
    id: 'gpt-flare',
    label: 'GPT Image 2.5 Flare',
    kind: 't2i+edit',
    family: 'gpt-image',
    endpointT2i: 'openai/gpt-image-2.5/flare/text-to-image',
    endpointEdit: 'openai/gpt-image-2.5/flare/edit',
    qualities: ['auto', 'low', 'medium', 'high', 'xhigh', 'max'],
    defaultQuality: 'high',
  },
  {
    id: 'gpt-sunburst',
    label: 'GPT Image 2.5 Sunburst',
    kind: 't2i+edit',
    family: 'gpt-image',
    endpointT2i: 'openai/gpt-image-2.5/sunburst/text-to-image',
    endpointEdit: 'openai/gpt-image-2.5/sunburst/edit',
    qualities: ['auto', 'low', 'medium', 'high', 'xhigh', 'max'],
    defaultQuality: 'high',
  },
] as const

export const DEFAULT_IMAGE_MODEL = 'nano-banana'

export function getImageModel(id?: string | null): ImageModelDef {
  if (!id) return IMAGE_MODELS[0]
  const model = IMAGE_MODELS.find((candidate) => candidate.id === id)
  if (!model) throw new Error(`Unknown image model: ${id}`)
  return model
}

/** Map a director aspect ratio to a gpt-image image_size preset. */
export function gptImageSize(aspectRatio?: string): string {
  switch (aspectRatio) {
    case '9:16':
      return 'portrait_16_9'
    case '1:1':
      return 'square'
    case '16:9':
    default:
      return 'landscape_16_9'
  }
}

export function buildImageInput(args: {
  model: ImageModelDef
  mode: 't2i' | 'edit'
  prompt: string
  /** Reference image URLs for edit calls (all models: ≤16). */
  refImages?: string[]
  aspectRatio?: string
  quality?: string
  options?: ImageGenerationOptions
}): { endpoint: string; input: Record<string, unknown> } {
  const { model, mode, prompt, refImages, aspectRatio, quality, options = {} } = args
  const endpoint = mode === 'edit' ? model.endpointEdit : model.endpointT2i
  if (!endpoint) throw new Error(`${model.label} does not support ${mode}`)
  const references = [...new Set((refImages ?? []).map((url) => url.trim()).filter(Boolean))]
  if (references.length > MAX_ASSET_REFERENCES) {
    throw new Error(`This workspace supports at most ${MAX_ASSET_REFERENCES} reference images; remove some references first`)
  }
  const outputFormat = options.outputFormat ?? 'png'
  const count = options.numImages ?? 1
  if (!Number.isInteger(count) || count < 1 || count > 4) throw new Error('Choose between 1 and 4 image variations')
  if (options.outputCompression != null && (!Number.isInteger(options.outputCompression) || options.outputCompression < 0 || options.outputCompression > 100)) {
    throw new Error('Output compression must be an integer from 0 to 100')
  }

  if (model.family === 'gpt-image') {
    const input: Record<string, unknown> = {
      prompt,
      image_size: gptImageSize(options.aspectRatio ?? aspectRatio),
      quality: options.quality ?? quality ?? model.defaultQuality ?? 'high',
      num_images: count,
      output_format: outputFormat,
      background: options.background ?? 'auto',
    }
    if (options.outputCompression != null) {
      if (outputFormat === 'png') throw new Error('PNG output does not support compression; choose JPEG or WebP')
      input.output_compression = options.outputCompression
    }
    if (mode === 'edit') {
      if (!references.length) throw new Error(`${model.label} needs at least one reference image for editing`)
      input.image_urls = references
      if (options.maskUrl?.trim()) input.mask_url = options.maskUrl.trim()
    }
    return { endpoint, input }
  }

  // nano-banana-2
  if (mode === 'edit') {
    if (!references.length) throw new Error(`${model.label} needs at least one reference image for editing`)
    return {
      endpoint,
      input: {
        prompt,
        image_urls: references,
        aspect_ratio: options.aspectRatio ?? aspectRatio ?? '4:3',
        resolution: options.resolution ?? '1K',
        num_images: count,
        output_format: outputFormat,
        ...(options.seed != null ? { seed: options.seed } : {}),
        ...(options.systemPrompt?.trim() ? { system_prompt: options.systemPrompt.trim() } : {}),
        ...(options.enableWebSearch != null ? { enable_web_search: options.enableWebSearch } : {}),
        ...(options.safetyTolerance ? { safety_tolerance: options.safetyTolerance } : {}),
        ...(options.thinkingLevel ? { thinking_level: options.thinkingLevel } : {}),
      },
    }
  }
  return {
    endpoint,
    input: {
      prompt,
      aspect_ratio: options.aspectRatio ?? aspectRatio ?? '4:3',
      resolution: options.resolution ?? '1K',
      num_images: count,
      output_format: outputFormat,
      ...(options.seed != null ? { seed: options.seed } : {}),
      ...(options.systemPrompt?.trim() ? { system_prompt: options.systemPrompt.trim() } : {}),
      ...(options.enableWebSearch != null ? { enable_web_search: options.enableWebSearch } : {}),
      ...(options.safetyTolerance ? { safety_tolerance: options.safetyTolerance } : {}),
      ...(options.thinkingLevel ? { thinking_level: options.thinkingLevel } : {}),
    },
  }
}
