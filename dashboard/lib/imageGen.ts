import { createFalClient } from '@fal-ai/client'
import { FAL_SDK_PROXY_URL } from './directorProtocol'
import { buildImageInput, getImageModel } from './imageModels'

interface FalImagesResult {
  data?: { images?: { url: string }[] }
  images?: { url: string }[]
}

/**
 * Generate (t2i) or edit an image through the fal sdk-proxy — FAL_KEY stays
 * server-side. Returns the first image URL.
 */
export async function generateImage(args: {
  modelId?: string | null
  mode?: 't2i' | 'edit'
  prompt: string
  refImages?: string[]
  aspectRatio?: string
  quality?: string
}): Promise<string> {
  const model = getImageModel(args.modelId)
  const mode = args.mode ?? (args.refImages?.length ? 'edit' : 't2i')
  const { endpoint, input } = buildImageInput({
    model,
    mode,
    prompt: args.prompt,
    refImages: args.refImages,
    aspectRatio: args.aspectRatio,
    quality: args.quality,
  })
  const fal = createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })
  const res = (await fal.subscribe(endpoint, { input })) as FalImagesResult
  const url = res.data?.images?.[0]?.url ?? res.images?.[0]?.url
  if (!url) throw new Error(`${model.label} returned no image`)
  return url
}
