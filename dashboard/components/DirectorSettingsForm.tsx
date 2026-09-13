'use client'

import AssetUrlInput from './AssetUrlInput'
import type {
  DirectorAspectRatio,
  DirectorAudioBitrate,
  DirectorResolution,
  DirectorSettings,
} from '../lib/directorProtocol'

interface DirectorSettingsFormProps {
  settings: DirectorSettings
  onChange: (next: DirectorSettings) => void
  /** Once a session is open these are immutable — disable while live/opening. */
  disabled: boolean
  /** Script beats are queued for configure; end image + startup audio can't combine with it. */
  scriptPlanned: boolean
}

const selectClass =
  'rounded-md border border-fal-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500 disabled:opacity-50 bg-white'

export default function DirectorSettingsForm({
  settings,
  onChange,
  disabled,
  scriptPlanned,
}: DirectorSettingsFormProps) {
  const set = <K extends keyof DirectorSettings>(key: K, value: DirectorSettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-fal-gray-600 mb-1">Resolution</label>
          <select
            value={settings.resolution}
            onChange={(e) => set('resolution', e.target.value as DirectorResolution)}
            className={selectClass}
          >
            <option value="480p">480p</option>
            <option value="768p">768p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-fal-gray-600 mb-1">Aspect ratio</label>
          <select
            value={settings.aspectRatio}
            onChange={(e) => set('aspectRatio', e.target.value as DirectorAspectRatio)}
            className={selectClass}
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-fal-gray-600 mb-1" title="Prior segment prompts kept as prompt-expansion context (1-50)">
            Memory
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.memory}
            onChange={(e) => set('memory', Math.max(1, Math.min(50, Number(e.target.value) || 12)))}
            className={selectClass + ' w-full'}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-fal-gray-600 mb-1" title="Fixes the opening setup; blank = random">
            Seed
          </label>
          <input
            type="number"
            value={settings.seed ?? ''}
            placeholder="random"
            onChange={(e) => set('seed', e.target.value === '' ? null : Math.floor(Number(e.target.value)))}
            className={selectClass + ' w-full'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-fal-gray-600 mb-1">First frame (optional)</label>
          <AssetUrlInput
            value={settings.imageUrl}
            onChange={(u) => set('imageUrl', u)}
            placeholder="Image URL or upload"
            disabled={disabled}
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium text-fal-gray-600 mb-1"
            title={scriptPlanned ? 'Not available while a script is queued for this session' : undefined}
          >
            Last frame of first chunk{scriptPlanned ? ' (scripted)' : ' (optional)'}
          </label>
          <AssetUrlInput
            value={settings.endImageUrl}
            onChange={(u) => set('endImageUrl', u)}
            placeholder="Image URL or upload"
            disabled={disabled || scriptPlanned}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            className="block text-xs font-medium text-fal-gray-600 mb-1"
            title={scriptPlanned ? 'Not available while a script is queued for this session' : undefined}
          >
            Target audio{scriptPlanned ? ' (scripted)' : ' (optional)'}
          </label>
          <AssetUrlInput
            value={settings.audioUrl}
            onChange={(u) => set('audioUrl', u)}
            kind="audio"
            placeholder="Audio URL or upload"
            disabled={disabled || scriptPlanned}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-fal-gray-600 mb-1">Audio bitrate</label>
          <select
            value={settings.audioBitrate}
            onChange={(e) => set('audioBitrate', Number(e.target.value) as DirectorAudioBitrate)}
            className={selectClass}
          >
            <option value={96000}>96 kbps</option>
            <option value={128000}>128 kbps</option>
            <option value={192000}>192 kbps</option>
          </select>
          <p className="text-xs text-fal-gray-400 mt-1">Locked at connect; reconnect to compare.</p>
        </div>
      </div>
    </fieldset>
  )
}
