'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Wand2 } from 'lucide-react'
import AssetUrlInput from '../AssetUrlInput'
import type { SceneDetails } from '../../lib/shotboardTypes'

const fieldClass =
  'w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-fal-primary-500 bg-white dark:bg-fal-gray-900'

function Section({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-fal-gray-200 dark:border-fal-gray-700 pb-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-1.5 text-xs font-medium text-fal-gray-600 dark:text-fal-gray-400"
      >
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-2 pt-1">{children}</div>}
    </div>
  )
}

interface SceneSidebarProps {
  scene: SceneDetails | null
  boardTitle: string
  boardDescription?: string
  onScenePatch: (patch: Partial<SceneDetails>) => void
  onBoardPatch: (patch: { title?: string; description?: string }) => void
  onGenerateKeyframe?: (scene: SceneDetails) => void
  generatingKeyframe?: boolean
}

/** Left panel: board + selected-scene fields (wzrd timeline sidebar port). */
export default function SceneSidebar({ scene, boardTitle, boardDescription, onScenePatch, onBoardPatch, onGenerateKeyframe, generatingKeyframe }: SceneSidebarProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({ scene: true, location: true, mood: false, camera: false })
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }))
  const [elementDraft, setElementDraft] = useState('')

  const addElement = () => {
    const v = elementDraft.trim()
    if (!v || !scene) return
    onScenePatch({ elements: [...(scene.elements ?? []), v] })
    setElementDraft('')
  }

  return (
    <div className="space-y-3">
      <div>
        <input
          type="text"
          value={boardTitle}
          onChange={(e) => onBoardPatch({ title: e.target.value })}
          placeholder="Untitled shotboard"
          className="w-full bg-transparent text-xl font-semibold focus:outline-none border-b border-transparent focus:border-fal-primary-500 pb-1"
        />
        <textarea
          value={boardDescription ?? ''}
          onChange={(e) => onBoardPatch({ description: e.target.value })}
          rows={2}
          placeholder="Add a board description…"
          className={fieldClass + ' mt-2'}
        />
      </div>

      {!scene ? (
        <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">Select a scene to edit its details.</p>
      ) : (
        <>
          <Section label="Scene description" open={!!open.scene} onToggle={() => toggle('scene')}>
            <textarea
              value={scene.description ?? ''}
              onChange={(e) => onScenePatch({ description: e.target.value })}
              rows={3}
              placeholder="What happens in this scene…"
              className={fieldClass}
            />
            <div>
              <label className="block text-[10px] text-fal-gray-500 dark:text-fal-gray-400 mb-0.5">Scene keyframe (drives the gallery strip)</label>
              <AssetUrlInput value={scene.keyframeUrl ?? ''} onChange={(u) => onScenePatch({ keyframeUrl: u })} placeholder="Image URL or upload" />
              {onGenerateKeyframe && (
                <button
                  type="button"
                  onClick={() => onGenerateKeyframe(scene)}
                  disabled={generatingKeyframe}
                  className="fal-button-secondary flex items-center gap-1.5 text-xs !py-1.5 mt-1 disabled:opacity-50"
                >
                  {generatingKeyframe ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  <span>{generatingKeyframe ? 'Generating…' : 'Generate keyframe'}</span>
                </button>
              )}
            </div>
          </Section>

          <Section label="Location & time" open={!!open.location} onToggle={() => toggle('location')}>
            <input type="text" value={scene.location ?? ''} onChange={(e) => onScenePatch({ location: e.target.value })} placeholder="Location" className={fieldClass} />
            <input type="text" value={scene.timeOfDay ?? ''} onChange={(e) => onScenePatch({ timeOfDay: e.target.value })} placeholder="Time of day" className={fieldClass} />
            <input type="text" value={scene.weather ?? ''} onChange={(e) => onScenePatch({ weather: e.target.value })} placeholder="Weather" className={fieldClass} />
          </Section>

          <Section label="Atmosphere & elements" open={!!open.mood} onToggle={() => toggle('mood')}>
            <input type="text" value={scene.atmosphere ?? ''} onChange={(e) => onScenePatch({ atmosphere: e.target.value })} placeholder="e.g. neon-lit, crowded, tense and quiet" className={fieldClass} />
            <div className="flex gap-1">
              <input
                type="text"
                value={elementDraft}
                onChange={(e) => setElementDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addElement()}
                placeholder="Specific element…"
                className={fieldClass}
              />
              <button type="button" onClick={addElement} className="fal-button-secondary text-xs !py-1">
                Add
              </button>
            </div>
            {scene.elements?.length ? (
              <div className="flex flex-wrap gap-1">
                {scene.elements.map((el, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded border border-fal-gray-300 dark:border-fal-gray-700 px-1.5 py-0.5 text-[10px] text-fal-gray-600 dark:text-fal-gray-400">
                    {el}
                    <button
                      type="button"
                      onClick={() => onScenePatch({ elements: scene.elements?.filter((_, j) => j !== i) })}
                      className="text-fal-gray-400 hover:text-red-500"
                      aria-label="Remove element"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </Section>

          <Section label="Camera environment" open={!!open.camera} onToggle={() => toggle('camera')}>
            <input
              type="text"
              value={scene.cameraEnvironment ?? ''}
              onChange={(e) => onScenePatch({ cameraEnvironment: e.target.value })}
              placeholder="e.g. street level with reflections, aerial view"
              className={fieldClass}
            />
          </Section>
        </>
      )}
    </div>
  )
}
