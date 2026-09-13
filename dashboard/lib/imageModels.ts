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
  return IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0]
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
  /** Reference image URLs for edit calls (gpt-image: ≤16; nano: passed through). */
  refImages?: string[]
  aspectRatio?: string
  quality?: string
}): { endpoint: string; input: Record<string, unknown> } {
  const { model, mode, prompt, refImages, aspectRatio, quality } = args
  const endpoint = mode === 'edit' ? model.endpointEdit : model.endpointT2i
  if (!endpoint) throw new Error(`${model.label} does not support ${mode}`)

  if (model.family === 'gpt-image') {
    const input: Record<string, unknown> = {
      prompt,
      image_size: gptImageSize(aspectRatio),
      quality: quality ?? model.defaultQuality ?? 'high',
    }
    if (mode === 'edit') input.image_urls = (refImages ?? []).slice(0, 16)
    return { endpoint, input }
  }

  // nano-banana-2
  if (mode === 'edit') {
    return {
      endpoint,
      input: { prompt, image_urls: refImages ?? [] },
    }
  }
  return {
    endpoint,
    input: {
      prompt,
      aspect_ratio: aspectRatio ?? '16:9',
      resolution: '1K',
      num_images: 1,
      output_format: 'jpeg',
    },
  }
}
