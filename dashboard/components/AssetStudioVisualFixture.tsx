'use client'

import { useMemo, useState } from 'react'
import { ImagePlus, MapPin, Sparkles, UserRound } from 'lucide-react'
import AccordionGallery from './reactbits/AccordionGallery'
import ImageGenerationControls from './ImageGenerationControls'
import { assetPlaceholder } from '../lib/assetPlaceholders'
import { defaultGenerationOptions } from '../lib/assetGeneration'
import { DEFAULT_IMAGE_MODEL, type ImageGenerationOptions } from '../lib/imageModels'

const characterFixtures = [
  { id: 'coast', label: '@coast', name: 'Coast', handle: 'coast', description: 'Approved face reference, overall look, and body proportions remain consistent. Wardrobe is selected separately for each shot.', image: assetPlaceholder('@coast', 268) },
  { id: 'mara', label: '@mara', name: 'Mara', handle: 'mara', description: 'Keep Mara’s approved facial features and silhouette consistent while allowing scene-specific wardrobe changes.', image: assetPlaceholder('@mara', 315) },
  { id: 'orio', label: '@orio', name: 'Orio', handle: 'orio', description: 'Preserve Orio’s identity and visual language across the character sheet; keep styling choices editable per scene.', image: assetPlaceholder('@orio', 198) },
]
const locationFixtures = [
  { id: 'ferry', label: 'Ferry Building', image: assetPlaceholder('Ferry Building', 202) },
  { id: 'mission', label: 'Mission District', image: assetPlaceholder('Mission District', 348) },
  { id: 'palace', label: 'Palace of Fine Arts', image: assetPlaceholder('Palace of Fine Arts', 36) },
]
const field = 'mt-1 w-full rounded-lg border border-fal-gray-300 bg-white px-3 py-2 text-sm text-fal-gray-900 shadow-sm outline-none dark:border-fal-gray-600 dark:bg-fal-gray-900 dark:text-fal-gray-100'

/** Development-only deterministic visual fixture. It never mounts Convex hooks. */
export default function AssetStudioVisualFixture() {
  const [character, setCharacter] = useState(0)
  const [location, setLocation] = useState(0)
  const [modelId, setModelId] = useState(DEFAULT_IMAGE_MODEL)
  const [options, setOptions] = useState<ImageGenerationOptions>(defaultGenerationOptions)
  const selectedCharacter = useMemo(() => characterFixtures[character] ?? characterFixtures[0], [character])
  return <main className="asset-studio mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
    <div className="rounded-lg border border-amber-400/50 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Visual-test fixture only. No account, Convex mutation, GMI request, or Fal generation is available on this route.</div>
    <section className="rounded-2xl border border-fal-gray-300 bg-fal-gray-950 p-5 text-white shadow-xl dark:border-fal-gray-700"><p className="inline-flex items-center gap-2 rounded-full bg-fal-primary-500/20 px-3 py-1 text-xs font-medium text-fal-primary-200"><Sparkles className="h-3.5 w-3.5" /> Visual asset studio</p><h1 className="mt-3 text-2xl font-semibold">Characters with a stable identity</h1><p className="mt-1 text-sm text-fal-gray-300">Fixture state mirrors the generated character-sheet workspace.</p></section>
    <AccordionGallery key={`character-${character}`} items={characterFixtures} defaultIndex={character} height={280} expandRatio={0.5} accentColor="#a78bfa" overlayColor="#05030b" grayscale={false} onSelect={(index: number) => setCharacter(index)} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-2xl border border-fal-gray-300 bg-white p-5 shadow-sm dark:border-fal-gray-700 dark:bg-fal-gray-950"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-fal-primary-500" /><div><p className="text-xs font-medium uppercase tracking-[.16em] text-fal-primary-700 dark:text-fal-primary-300">Character source</p><h2 className="text-lg font-semibold">{selectedCharacter.label}</h2></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Name<input className={field} value={selectedCharacter.name} readOnly /></label><label className="text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Handle<input className={field} value={selectedCharacter.handle} readOnly /></label></div><label className="mt-4 block text-xs font-medium text-fal-gray-600 dark:text-fal-gray-300">Identity and continuity description<textarea className={field} rows={4} value={selectedCharacter.description} readOnly /></label><div className="mt-5 grid grid-cols-3 gap-2"><div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-violet-500/80 to-fal-gray-950" /><div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-indigo-500/80 to-fal-gray-950" /><button className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border border-dashed border-fal-gray-400 text-xs text-fal-primary-700 dark:border-fal-gray-600 dark:text-fal-primary-300"><ImagePlus className="mb-1 h-4 w-4" />Add reference</button></div></section><aside className="rounded-2xl border border-fal-gray-700 bg-[#11131a] p-5 text-white shadow-xl"><p className="text-xs font-medium uppercase tracking-[.16em] text-fal-primary-300">Generate</p><h2 className="mt-1 text-lg font-semibold">Character sheet</h2><p className="mt-2 text-sm leading-6 text-fal-gray-300">The source is expanded before the selected Fal image route is called.</p><div className="mt-4"><ImageGenerationControls modelId={modelId} options={options} editing onModelChange={setModelId} onOptionsChange={(change) => setOptions((value) => ({ ...value, ...change }))} /></div><button type="button" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-fal-primary-500 px-4 py-3 text-sm font-semibold text-white"><ImagePlus className="h-4 w-4" />Generate character sheet</button></aside></div>
    <section className="rounded-2xl border border-fal-gray-300 bg-white p-5 shadow-sm dark:border-fal-gray-700 dark:bg-fal-gray-950"><div className="mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-fal-primary-500" /><div><p className="text-xs font-medium uppercase tracking-[.16em] text-fal-primary-700 dark:text-fal-primary-300">Location selection</p><h2 className="text-lg font-semibold">Reusable San Francisco environments</h2></div></div><AccordionGallery key={`location-${location}`} items={locationFixtures} defaultIndex={location} height={220} expandRatio={0.5} accentColor="#a78bfa" overlayColor="#05030b" grayscale={false} onSelect={(index: number) => setLocation(index)} /></section>
  </main>
}
