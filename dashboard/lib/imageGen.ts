import { createFalClient } from '@fal-ai/client'
import { FAL_SDK_PROXY_URL } from './directorProtocol'
import { buildImageInput, getImageModel, type ImageGenerationOptions } from './imageModels'

interface FalImagesResult {
  data?: { images?: { url: string }[] }
  images?: { url: string }[]
}

/**
 * Generate (t2i) or edit an image through the fal sdk-proxy — FAL_KEY stays
 * server-side. Returns every generated image URL in model order so callers
 * can keep each requested variation instead of silently discarding it.
 */
export async function generateImages(args: {
  modelId?: string | null
  mode?: 't2i' | 'edit'
  prompt: string
  refImages?: string[]
  aspectRatio?: string
  quality?: string
  options?: ImageGenerationOptions
}): Promise<string[]> {
  const model = getImageModel(args.modelId)
  const mode = args.mode ?? (args.refImages?.length ? 'edit' : 't2i')
  const { endpoint, input } = buildImageInput({
    model,
    mode,
    prompt: args.prompt,
    refImages: args.refImages,
    aspectRatio: args.aspectRatio,
    quality: args.quality,
    options: args.options,
  })
  const fal = createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })
  const res = (await fal.subscribe(endpoint, { input })) as FalImagesResult
  const urls = (res.data?.images ?? res.images ?? []).map((image) => image.url).filter(Boolean)
  if (!urls.length) throw new Error(`${model.label} returned no image`)
  return urls
}

/** Backwards-compatible single-image helper for existing shotboard callers. */
export async function generateImage(args: Parameters<typeof generateImages>[0]): Promise<string> {
  return (await generateImages(args))[0]
}
