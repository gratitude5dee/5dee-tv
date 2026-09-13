'use client'

import { useRef, useState } from 'react'
import { createFalClient } from '@fal-ai/client'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { FAL_SDK_PROXY_URL } from '../lib/directorProtocol'

interface AssetUrlInputProps {
  value: string
  onChange: (url: string) => void
  /** 'image' adds a thumbnail preview; 'audio' accepts audio/* files. */
  kind?: 'image' | 'audio'
  placeholder?: string
  disabled?: boolean
}

/** URL-or-upload field. Uploads go through the fal proxy so FAL_KEY stays server-side. */
export default function AssetUrlInput({
  value,
  onChange,
  kind = 'image',
  placeholder,
  disabled,
}: AssetUrlInputProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const upload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const fal = createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })
      onChange(await fal.storage.upload(file))
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `Paste ${kind} URL`}
          disabled={disabled || uploading}
          className="flex-1 rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500 disabled:opacity-50"
        />
        <input
          ref={fileRef}
          type="file"
          accept={kind === 'image' ? 'image/*' : 'audio/*'}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void upload(f)
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          className="fal-button-secondary flex items-center gap-1 text-xs !py-1.5 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
          <span>Upload</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled}
            className="p-1 text-fal-gray-400 hover:text-fal-gray-600 dark:text-fal-gray-400 disabled:opacity-50"
            aria-label="Clear"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {kind === 'image' && value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-12 rounded border border-fal-gray-200 dark:border-fal-gray-700 object-cover" />
      )}
      {uploadError && <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
    </div>
  )
}
