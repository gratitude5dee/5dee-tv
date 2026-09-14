import type { ImageGenerationOptions } from './imageModels'

export interface CharacterSheetSource {
  name: string
  handle: string
  description: string
  appearance?: string
  identityNotes?: string
  defaultWardrobe?: string
  visualStyle?: string
  identityLocked?: boolean
  hasReferences: boolean
}

export interface LocationSheetSource {
  name: string
  description: string
  architecture?: string
  defaultTimeOfDay?: string
  defaultWeather?: string
  visualStyle?: string
  hasReferences: boolean
}

/**
 * The short source brief sent to GMI before any paid Fal request. It follows
 * the image-generation prompt structure while keeping user-authored identity
 * and wardrobe facts explicitly separate.
 */
export function buildCharacterSheetSource(character: CharacterSheetSource) {
  const lines = [
    'Use case: identity-preserve',
    'Asset type: reusable character sheet for a storyboard library',
    `Character: ${character.name} (@${character.handle.replace(/^@/, '')})`,
    `Primary request: generate one horizontal character sheet with a front view, three-quarter view, profile, back view, and a compact expression study.`,
    `Identity description: ${character.description}`,
    character.appearance ? `Appearance: ${character.appearance}` : '',
    character.identityNotes ? `Identity invariants: ${character.identityNotes}` : '',
    character.defaultWardrobe ? `Default wardrobe: ${character.defaultWardrobe}` : 'Default wardrobe: choose a restrained neutral wardrobe only when none is specified.',
    character.visualStyle ? `Style: ${character.visualStyle}` : 'Style: clean editorial character-design reference.',
    character.hasReferences ? 'Reference manifest: supplied images are identity references. Preserve face, hair, body proportions, and overall look across every panel.' : 'Reference manifest: no identity image is supplied; create a new fictional identity consistently across all panels.',
    character.identityLocked ? 'Constraints: preserve the approved face and overall look. Outfit may vary only when the requested wardrobe says so.' : 'Constraints: keep the newly created identity internally consistent across all panels.',
    'Composition: neutral studio background, even readable lighting, full-body views, practical material and wardrobe detail.',
    'Avoid: text, logos, watermarks, collaged borders, duplicated limbs, inconsistent faces, harsh bloom, oversharpening.',
  ]
  return lines.filter(Boolean).join('\n')
}

export function buildLocationSheetSource(location: LocationSheetSource) {
  const lines = [
    'Use case: photorealistic-natural',
    'Asset type: reusable storyboard location reference sheet',
    `Location: ${location.name}`,
    `Primary request: generate one horizontal location sheet with an establishing view, a street or approach view, an architectural detail, and a texture or atmosphere detail.`,
    `Environment description: ${location.description}`,
    location.architecture ? `Architecture and materials: ${location.architecture}` : '',
    location.defaultTimeOfDay ? `Default light: ${location.defaultTimeOfDay}` : '',
    location.defaultWeather ? `Default weather: ${location.defaultWeather}` : '',
    location.visualStyle ? `Style: ${location.visualStyle}` : 'Style: restrained editorial location reference.',
    location.hasReferences ? 'Reference manifest: supplied images define the environment, landmark geometry, material palette, and atmosphere.' : 'Reference manifest: create an original environment consistent across all views.',
    'Composition: each view should be legible and useful as a production reference, with natural perspective and calm framing.',
    'Avoid: text, logos, watermarks, implausible geometry, tourist-postcard saturation, heavy lens flare, clutter.',
  ]
  return lines.filter(Boolean).join('\n')
}

export function defaultGenerationOptions(): ImageGenerationOptions {
  return { aspectRatio: '4:3', resolution: '1K', outputFormat: 'png', numImages: 1, quality: 'high', background: 'auto', safetyTolerance: '4' }
}

export async function promptFingerprint(value: string) {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
