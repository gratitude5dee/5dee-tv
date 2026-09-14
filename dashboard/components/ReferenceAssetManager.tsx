'use client'

import { useRef, useState, type DragEvent } from 'react'
import { useConvex, useMutation } from 'convex/react'
import { ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { MAX_ASSET_REFERENCES } from '../lib/imageModels'

export interface ReferenceAsset {
  storageId: Id<'_storage'>
  url: string
}

interface ReferenceAssetManagerProps {
  targetType: 'character' | 'location'
  targetId: string
  references: ReferenceAsset[]
  primaryStorageId?: string
  defaultRole: 'identity' | 'environment'
  onRemove: (storageId: string) => Promise<void> | void
  onMakePrimary: (storageId: string) => Promise<void> | void
  onUploaded?: (storageId: string) => void
  disabled?: boolean
}

/** Uploads reference files directly to Convex storage and preserves their order. */
export default function ReferenceAssetManager({
  targetType,
  targetId,
  references,
  primaryStorageId,
  defaultRole,
  onRemove,
  onMakePrimary,
  onUploaded,
  disabled,
}: ReferenceAssetManagerProps) {
  const convex = useConvex()
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const recordUpload = useMutation(api.assets.recordUpload)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'identity' | 'wardrobe' | 'style' | 'environment'>(defaultRole)

  const upload = async (file: File) => {
    if (references.length >= MAX_ASSET_REFERENCES) {
      setError(`This library item already has the ${MAX_ASSET_REFERENCES}-image reference limit.`)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for a visual reference.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type || 'image/png' }, body: file })
      if (!result.ok) throw new Error(`Upload failed (${result.status})`)
      const { storageId } = await result.json() as { storageId: Id<'_storage'> }
      await recordUpload({
        targetType,
        ...(targetType === 'character' ? { characterId: targetId as Id<'characters'> } : { locationId: targetId as Id<'locations'> }),
        storageId,
        role,
        makePrimary: references.length === 0,
      })
      onUploaded?.(String(storageId))
      // Resolve once so a storage permission failure is shown next to the file
      // rather than surfacing later as a broken thumbnail.
      await convex.query(api.assets.getStorageUrl, { storageId })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const acceptDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  return (
    <section className="space-y-2" aria-label="Reference images">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-fal-gray-700 dark:text-fal-gray-200">Reference images</p>
          <p className="text-[11px] text-fal-gray-500 dark:text-fal-gray-400">Identity, wardrobe, style, or environment images stay in Convex storage.</p>
        </div>
        <label className="flex items-center gap-1 text-[11px] text-fal-gray-500 dark:text-fal-gray-300">
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="rounded-md border border-fal-gray-300 bg-white px-2 py-1 text-xs dark:border-fal-gray-600 dark:bg-fal-gray-900">
            {targetType === 'character' && <><option value="identity">Identity</option><option value="wardrobe">Wardrobe</option></>}
            <option value="style">Style</option>
            {targetType === 'location' && <option value="environment">Environment</option>}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {references.map((asset) => (
          <div key={asset.storageId} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-fal-gray-300 bg-fal-gray-100 dark:border-fal-gray-600 dark:bg-fal-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.url} alt="Saved visual reference" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" onClick={() => void onMakePrimary(String(asset.storageId))} className="rounded px-1.5 py-1 text-[10px] font-medium text-white hover:bg-white/20" aria-label="Use as primary image">
                <Star className={`inline h-3 w-3 ${String(asset.storageId) === primaryStorageId ? 'fill-current text-amber-300' : ''}`} /> Primary
              </button>
              <button type="button" onClick={() => void onRemove(String(asset.storageId))} className="rounded p-1 text-white hover:bg-white/20" aria-label="Remove reference from this item"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        <div onDragOver={(event) => event.preventDefault()} onDrop={acceptDrop} className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-fal-gray-400 bg-fal-gray-50 px-3 text-center dark:border-fal-gray-600 dark:bg-fal-gray-900/60">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={disabled || uploading || references.length >= MAX_ASSET_REFERENCES} className="flex flex-col items-center gap-1 text-xs font-medium text-fal-primary-700 disabled:opacity-50 dark:text-fal-primary-300">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'Uploading…' : <><Upload className="sr-only" /> Add reference</>}
          </button>
          <span className="mt-1 text-[10px] text-fal-gray-500">{references.length}/{MAX_ASSET_REFERENCES} · drop or choose</span>
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </section>
  )
}
