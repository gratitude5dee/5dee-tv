# Audit: Asset Studio: /admin/characters, /admin/locations, /admin/visual-test. Covers CharacterLibraryPage, LocationLibraryPage, AssetStudioVisualFixture, ReferenceAssetManager and ImageGenerationControls; the React Bits AccordionGallery, ChromaGrid, PixelCard and MorphSlider; lib/assetPlaceholders, assetGeneration and imageModels; and convex/assets.ts plus the schema tables characters, locations, assetVersions, imageGenerationJobs and tracks.

## Files read
- dashboard/app/admin/characters/page.tsx
- dashboard/app/admin/locations/page.tsx
- dashboard/app/admin/visual-test/page.tsx
- dashboard/app/admin/layout.tsx
- dashboard/app/layout.tsx
- dashboard/app/globals.css
- dashboard/tailwind.config.js
- dashboard/next.config.js
- dashboard/package.json
- dashboard/components/CharacterLibraryPage.tsx
- dashboard/components/LocationLibraryPage.tsx
- dashboard/components/AssetStudioVisualFixture.tsx
- dashboard/components/ReferenceAssetManager.tsx
- dashboard/components/ImageGenerationControls.tsx
- dashboard/components/AdminNav.tsx
- dashboard/components/ConvexClientProvider.tsx
- dashboard/components/DitherBackground.tsx
- dashboard/components/TrackManager.tsx (lines 120-145)
- dashboard/components/shotboard/CharacterPanel.tsx
- dashboard/components/reactbits/AccordionGallery.jsx
- dashboard/components/reactbits/AccordionGallery.css
- dashboard/components/reactbits/ChromaGrid.jsx
- dashboard/components/reactbits/ChromaGrid.css
- dashboard/components/reactbits/PixelCard.jsx
- dashboard/components/reactbits/PixelCard.css
- dashboard/components/reactbits/MorphSlider.tsx
- dashboard/components/reactbits/MorphSlider.css
- dashboard/components/reactbits/Dither.jsx (header)
- dashboard/lib/assetPlaceholders.ts
- dashboard/lib/assetGeneration.ts
- dashboard/lib/imageGen.ts
- dashboard/lib/imageModels.ts
- dashboard/convex/assets.ts
- dashboard/convex/schema.ts
- dashboard/convex/locations.ts
- dashboard/convex/director.ts (lines 1-75)
- dashboard/convex/shotboards.ts (lines 270-330)
- dashboard/convex/promptExpansion.ts (grep)
- dashboard/.next/static/css/app/layout.css (grep for compiled fal-primary shades)
- .agents/skills/admin-testing/SKILL.md
- docs/redesign/baseline/admin_characters-dark.jpg
- docs/redesign/baseline/admin_characters-mobile.jpg
- docs/redesign/baseline/admin_locations-dark.jpg
- docs/redesign/baseline/admin_visual-test-dark.jpg
- docs/redesign/baseline/admin_shotboard-dark.jpg
- docs/redesign/component-prompts.csv

## Current state
ROUTING AND SHELL (verified). app/admin/characters/page.tsx and app/admin/locations/page.tsx are 3-line wrappers that render CharacterLibraryPage and LocationLibraryPage. app/admin/visual-test/page.tsx calls notFound() in production and otherwise renders AssetStudioVisualFixture. All three sit inside the root layout (app/layout.tsx). The layout has the fixed full-screen React Bits Dither (DitherBackground.tsx, blue wave [0.2,0.34,0.66] on [0.02,0.03,0.06] in dark), a translucent wrapper (bg-fal-gray-50/60, dark:bg-[#0a0d14]/45), a black header with the chrome blackletter WZRD.tech wordmark and an <h1>Stream Admin</h1>, and a max-w-7xl <main> with a .fade-in wrapper. AdminNav (components/AdminNav.tsx:7-15) is an underline tab bar with 7 tabs, including "Characters" (/admin/characters, UsersRound) and "Locations" (/admin/locations, MapPin). The active tab and every CTA render violet (#6d28d9 / #8b5cf6) while the wordmark and the Dither are chrome blue. The .asset-studio root class has no CSS anywhere.

CHARACTERS PAGE LAYOUT (verified, CharacterLibraryPage.tsx:148-164). The page is a vertical stack (space-y-5) of four parts:
(1) Hero card (line 149). It is always dark (bg-fal-gray-950, text-white, rounded-2xl) in both themes. It has a pill eyebrow "Visual asset studio" with a Sparkles icon, an h1 "Characters with a stable identity", the subcopy "Keep a face and overall look consistent, then swap wardrobe and scene styling without rebuilding the character.", and two buttons: an outline "Load SF starters" and a fal-button-primary "+ New character".
(2) Gallery (line 150). A React Bits AccordionGallery 290px tall: horizontal flex panels with a GSAP flex-grow expansion, an 8° rotateY tilt on inactive panels, image parallax, overlayColor #05030b, a hard-coded violet accentColor #a78bfa for the 3px label bar, and trigger="hover". Each item is {id, image: character.imageUrl || assetPlaceholder('@handle', 268), label: '@handle', alt: 'Name character card'} (line 146).
(3) Editor, shown only when a card has been clicked (`current &&`, line 151). It is a 2-column grid at xl ([minmax(0,1fr)_360px]) and stacks below 1280px.
- Left "Character source" section (white in light mode, fal-gray-950 in dark). It has an eyebrow, an h2 with the draft name, and a "Save source" secondary button. Fields: Name and Handle (the handle strips '@' and non [a-z0-9_-]), "Identity and continuity description" (4 rows), "Appearance details", "Default wardrobe", "Identity invariants", "Visual style", and a native checkbox "Lock the face and overall look across generations". Under a divider sits ReferenceAssetManager.
- Right "Generate / Character sheet" aside, always dark (bg-[#11131a]). It has the copy "Astra expands the saved source; the selected Fal model then creates a reviewable sheet. No model call occurs until the source is valid.", ImageGenerationControls (a row of pill selects for model, aspect, count, format, and resolution or quality+background, plus an "Advanced model controls" <details>), and a full-width violet "Generate character sheet" button. An amber gating hint follows, then a "Sheet history" 3-column grid of square thumbnails; clicking one sets it as the primary.
(4) Page-bottom messages. A notice <p role="status"> (emerald) and an error <p role="alert"> (red).

LOCATIONS PAGE (verified, LocationLibraryPage.tsx:140-155). It is a near-clone of the Characters page:
- Hero h1 "Locations that hold their atmosphere".
- Placeholder hue 204, label = location name (not handle).
- Editor fields: Name (2 cols) + Type select (Landmark/Neighborhood/Coast/Interior/Other), "Handle (optional)", "Default light", "Environment description", "Architecture and materials", "Weather", "Visual style".
- ReferenceAssetManager uses defaultRole 'environment'.
- The aside reads "Location sheet" with the copy "The metaprompt turns your environment notes into production-ready coverage…".
- There is no lock concept. Kind, light and weather never appear on the cards.

HOW @coast IS REPRESENTED (verified). There is no Coast image anywhere in the repo: dashboard/public holds only wzrdtechlogo.png and favicon.ico. @coast exists only as a Convex row created by seedStarterLibrary (convex/assets.ts:466-478): name 'Coast', handle 'coast', starterKey 'coast', identityLocked true, and the description "Add approved face-reference images before generating. Keep the face and overall look consistent; outfits are chosen per scene." That same "Load SF starters" button also seeds 10 SF locations (assets.ts:437-448). Until someone uploads a reference, the gallery card shows assetPlaceholder(): an Arial-set violet gradient SVG with the text "@coast" and "visual fixture · add approved reference" (lib/assetPlaceholders.ts:2-5). The visual-test fixture shows the same placeholder for @coast, @mara and @orio (AssetStudioVisualFixture.tsx:13-15).

Elsewhere the same character is addressed as "$COAST": the Director settings placeholder (DirectorSettingsForm.tsx:100), the Shotboard CharacterPanel prompt anchor title "Prompt anchor (e.g. $COAST)" (shotboard/CharacterPanel.tsx:88-89), and lib/directorProtocol.ts:26. The only existing Coast brand artwork is the "Coast originals" track covers (tracks.coverStorageId). The fixture hard-codes these as production Convex storage URLs on sleek-opossum-939.convex.cloud (AssetStudioVisualFixture.tsx:23-26), and they render as a black square in the baseline screenshot.

REFERENCE IMAGES (verified). ReferenceAssetManager (components/ReferenceAssetManager.tsx) is a section with aria-label "Reference images". It has a role select (Identity/Wardrobe/Style for characters; Style/Environment for locations), a 2–3 column grid of 4:3 thumbnails with hover-revealed "Primary" (star) and trash buttons, and a dashed "Add reference" tile showing "n/14 · drop or choose".
- Upload path: generateUploadUrl → POST file → recordUpload({targetType, characterId|locationId, storageId, role, makePrimary: refs.length===0}). recordUpload appends the file to referenceStorageIds, sets primaryStorageId if none, bumps revision, and inserts an assetVersions row with that role (assets.ts:259-299).
- Roles are stored only in assetVersions, never on the character row, and are never shown on thumbnails.
- presentCharacter / presentLocation (assets.ts:44-66) resolve imageUrl = storage URL of primaryStorageId ?? legacy imageUrl string, plus referenceAssets[{storageId,url}] and referenceUrls.
- removeReference detaches a file (storage and history stay) and promotes refs[0] if the primary was removed.
- MAX_ASSET_REFERENCES = 14 (lib/imageModels.ts:41).

SHEET GENERATION (verified, CharacterLibraryPage.tsx:118-144). The pipeline runs in this order:
1. persistDraft (patchCharacter, then getCharacter).
2. Guard: if identityLocked and there are no references, throw "Add an approved face reference before generating a locked identity like @coast".
3. buildCharacterSheetSource (lib/assetGeneration.ts:30-47) builds a brief asking for "one horizontal character sheet with a front view, three-quarter view, profile, back view, and a compact expression study".
4. api.promptExpansion.expand. This is "Astra" on GMI, with a 3-minute deadline.
5. promptFingerprint (SHA-256), then startGeneration. It is idempotent on requestId/sourceHash and rejects stale revisions with "Character changed; review it before generating".
6. generateImages through the fal sdk proxy. Edit mode sends every reference URL as image_urls.
7. Fetch each output and re-upload it to Convex storage.
8. completeGeneration. It sets primaryStorageId = first output, appends all outputs to referenceStorageIds, and writes assetVersions rows with role 'sheet' (assets.ts:397-424).
On error, failGeneration is called. Default options are 4:3, 1K, png, 1 image, quality high (assetGeneration.ts:67-69). The model list is Nano Banana 2 (default), GPT Image 2.5 Flare and GPT Image 2.5 Sunburst (imageModels.ts:44-75).

IDENTITY LOCK (verified). identityLocked is a boolean. It defaults to true on createCharacter and on the seed. Its only effects:
(a) It swaps one sentence in the brief: "Constraints: preserve the approved face and overall look…" (assetGeneration.ts:42).
(b) Client-side gating: canGenerate needs name, handle and description, plus any reference when locked (CharacterLibraryPage.tsx:79). A style or wardrobe reference satisfies this.
The server does not enforce it. No field becomes read-only, and references can still be removed.

VISUAL-TEST FIXTURE (verified). A second <main> (max-w-6xl) with:
- An amber banner: "Visual-test fixture only. No account, Convex mutation, GMI request, or Fal generation is available on this route."
- A copied hero with the subcopy "Fixture state mirrors the generated character-sheet workspace."
- An AccordionGallery of 3 placeholder characters.
- A copied source form with readOnly inputs and gradient stand-ins instead of ReferenceAssetManager.
- A copied Generate aside whose button does nothing.
- A "Location selection / Reusable San Francisco environments" accordion.
- An "Audio library visual fixture / Coast originals" section (id="audio-library-visual-test") with a WebGL MorphSlider, a selected-track row and a "Mix in output" button.

REACT BITS USAGE (verified). AccordionGallery is also used by shotboard/ShotCard.tsx:169, shotboard/SceneSection.tsx:69 and shotboard/SceneGallery.tsx. ChromaGrid is used only by shotboard/CharacterPanel.tsx:70. PixelCard is used only by the Clips and Recordings pages (variant 'blue', noFocus). MorphSlider is used by TrackManager (Live Control) and the fixture. Changing any of these vendored components affects surfaces beyond the asset studio.

NOT-CONFIGURED STATE (verified from the baseline screenshots). Both library pages render only a fal-card with the amber line "Convex is not configured. Character library changes are disabled." (or "Location…"). Nothing else appears. By contrast, the Shotboard keeps a local-state fallback.

## Problems
- **[critical] [states]** `dashboard/components/CharacterLibraryPage.tsx:146` — The flagship @coast shows up in production as a dev placeholder. seedStarterLibrary creates Coast with no image (convex/assets.ts:466-478). galleryItems then falls back to assetPlaceholder(), which renders an Arial-set violet gradient SVG reading "visual fixture · add approved reference" (lib/assetPlaceholders.ts:4). The repo contains no Coast asset: dashboard/public holds only wzrdtechlogo.png and favicon.ico. The brand character therefore looks like a wireframe until someone manually uploads a face reference.
- **[high] [color]** `dashboard/tailwind.config.js:26` — The brand color collides with itself (verified). The flat 'fal-primary' palette (chrome blue #4f83cc, commented "wzrd.tech chrome blue (from the wordmark)") is shadowed by the nested `fal.primary` violet palette (tailwind.config.js:69-74), because both flatten to fal-primary-*. The compiled .next/static/css/app/layout.css has `.bg-fal-primary-500 { background-color: rgb(109 40 217) }`. Every asset-studio CTA, eyebrow and focus ring is violet, while the wordmark and the global Dither are blue. On top of that, the pages hard-code accentColor="#a78bfa" and overlayColor="#05030b" (CharacterLibraryPage.tsx:150, LocationLibraryPage.tsx:142), `bg-[#11131a]` (lines 160/151) and violet-* utilities (AssetStudioVisualFixture.tsx:45). The result is two competing hue systems.
- **[high] [dark-mode]** `dashboard/components/ReferenceAssetManager.tsx:119` — Several shades used here do not exist. text-fal-primary-200, text-fal-primary-300 and dark:text-fal-primary-300 are used in CharacterLibraryPage.tsx:149,152,160, LocationLibraryPage.tsx:141,144,151, ReferenceAssetManager.tsx:119 and AssetStudioVisualFixture.tsx:41,43,44, but Tailwind defines only 400–700. None of them appear in the compiled CSS. In dark mode the "Character source"/"Location source" eyebrows and the "Add reference" CTA fall back to text-fal-primary-700 (#4c1d95) on #030712, roughly 1.8:1 contrast. The baseline admin_visual-test-dark.jpg shows "Add reference" as nearly invisible.
- **[high] [states]** `dashboard/convex/assets.ts:411` — Generated sheets are promoted and fed back as identity references without any review. completeGeneration sets primaryStorageId to the first output and appends every variation to referenceStorageIds (also at :416 for locations). The next generateSheet sends all references, including earlier sheets, as identity image_urls (CharacterLibraryPage.tsx:125), so each round compounds identity drift. Once uploads plus up to 4 variations per run exceed 14, buildImageInput throws "This workspace supports at most 14 reference images; remove some references first" (lib/imageModels.ts:111-113) and the upload tile disables (ReferenceAssetManager.tsx:119). The aside copy promises a "reviewable sheet", but nothing is reviewed.
- **[high] [states]** `dashboard/components/CharacterLibraryPage.tsx:73` — A stale draft can overwrite server-side references, and unsaved edits vanish on selection change. The draft rehydrates only when the selected id changes (lines 73-77; LocationLibraryPage.tsx:71-75). After completeGeneration appends sheet ids on the server, the next "Save source" sends the stale draft.referenceStorageIds (line 99 / Location :92). patchCharacter replaces the array (assets.ts:168), so sheets silently drop out of the references while primaryStorageId still points at one of them. No thumbnail then shows the Primary star. Clicking another card also discards unsaved edits with no dirty indicator or confirmation.
- **[high] [visual-hierarchy]** `dashboard/components/CharacterLibraryPage.tsx:150` — Hover expansion and actual selection disagree. With trigger="hover", hovering expands a card (AccordionGallery.jsx:160-162), nothing resets it on mouse leave, and onSelect fires only on click. The expanded card is often not the one being edited. On first load selectedId is null, so card 0 renders expanded with aria-current="true" but no editor appears (`current &&`, line 151) and no "select a character" prompt is shown. The gallery key embeds selectedId, so every selection remounts it, killing the GSAP transition (firstRunRef resets) and snapping. Past about 8 records (listCharacters takes 100) the panels become slivers, and there is no search, filter or sort.
- **[medium] [visual-hierarchy]** `dashboard/components/CharacterLibraryPage.tsx:157` — Identity lock is a bare native checkbox ("Lock the face and overall look across generations"), and it does little. Its only effects are one prompt sentence (lib/assetGeneration.ts:42) and a client gate (line 79) that is satisfied by any reference role, including style or wardrobe. startGeneration (assets.ts:360-395) does not enforce it, and it locks no fields: description and references stay editable and removable. The central promise of the page, "stable identity", has no visual or behavioral weight.
- **[medium] [states]** `dashboard/components/CharacterLibraryPage.tsx:160` — Generation feedback is minimal. A single spinner label, "Generating character sheet…", covers the whole multi-stage pipeline: save, then GMI "Astra" expansion with a 3-minute deadline (convex/promptExpansion.ts:84), then startGeneration, then fal.subscribe, then per-image fetch and re-upload, then completeGeneration. There is no stage indicator, elapsed time, cancel, or result preview. Results land only as ~100px square thumbnails in "Sheet history". Errors and notices render at the very bottom of the page (lines 162-163; Location 153-154), far from the CTA, and never clear.
- **[medium] [states]** `dashboard/components/CharacterLibraryPage.tsx:160` — Sheet history crops and mislabels its images. The grid is `grid-cols-3` with `aspect-square object-cover`, which crops horizontal multi-panel sheets (front/¾/profile/back/expressions) down to the middle panel. There is no lightbox or compare view. listAssetHistory (assets.ts:344-357) also returns plain uploads with identity, wardrobe, style or environment roles, yet every image has the alt "Generated character-sheet history". While the query is loading (undefined) nothing renders at all.
- **[medium] [a11y]** `dashboard/components/ReferenceAssetManager.tsx:109` — Reference tiles have several accessibility and usability gaps. The Primary and Remove actions use `sm:opacity-0 sm:group-hover:opacity-100` with no group-focus-within, so keyboard focus lands on invisible buttons, and which tile is primary is visible only on hover. The drop zone has no drag-over state (line 117) and takes only files[0] (line 84); the input lacks `multiple`. Remove has no confirm or undo. The role select is disconnected from the tiles, which never show a role chip. Every tile's alt is "Saved visual reference", and the hint text is 10–11px (lines 93, 123).
- **[medium] [a11y]** `dashboard/components/reactbits/AccordionGallery.jsx:204` — The accordion's ARIA structure is invalid. The root has role="list" with aria-label "Image accordion gallery", but its children are <button> elements without role="listitem" (listitem is applied only to links, line 222). Selection is conveyed with aria-current="true" rather than aria-pressed or aria-selected. prefers-reduced-motion is read via matchMedia once per render (line 47) and never subscribed to. Below 520px the CSS forces a column of 84px strips (AccordionGallery.css:130-144), so the preview effectively disappears on mobile.
- **[medium] [states]** `dashboard/convex/assets.ts:97` — Being unauthenticated looks the same as having an empty library. listCharacters and listLocations return [] without an identity (lines 97, 178), so a signed-out admin sees "Start with a reusable character" / "Start with a reusable environment". The first click on New character then throws "Authentication required", shown at the page bottom. The Convex-not-configured state is a single amber line with no guidance or preview (CharacterLibraryPage.tsx:44; baseline admin_characters-dark.jpg). The Shotboard, by contrast, keeps working in local state.
- **[medium] [states]** `dashboard/components/CharacterLibraryPage.tsx:84` — The studio has no archive or delete, and clicking creates junk rows. createCharacter immediately inserts "New character" with handle `character-<base36>`, and createLocation inserts "New location" (LocationLibraryPage.tsx:80). There is no draft or cancel step. assets.ts has no archive mutation, and the existing archivers api.shotboards.removeCharacter (convex/shotboards.ts:309) and api.locations.remove (convex/locations.ts) are not wired into the studio. Abandoned rows accumulate in the accordion.
- **[medium] [consistency]** `dashboard/components/CharacterLibraryPage.tsx:39` — The character "bible" data is incomplete and partly hidden. voiceNotes is in the draft, asDraft and patch payload (lines 26, 39, 40, 99) but has no input. The `traits` field (schema.ts:192) is unused, and so is location `styleId` (schema.ts:223, styles table). There are no fields for persona, relationships, wardrobe looks or usage (which shots or scenes reference the asset), which a casting sheet or series bible needs. series.bible (convex/series.ts:5) exists but is not linked.
- **[medium] [consistency]** `dashboard/convex/director.ts:24` — Handle vocabulary is split, and library characters are dropped from Director beats. The asset studio uses @coast, while Director and Shotboard use $COAST (DirectorSettingsForm.tsx:100, shotboard/CharacterPanel.tsx:88-89). The location kind literal 'coast' (assets.ts:15, shown as "Coast" in the Type select) reads like the character. Verified: director.prepare resolves only board-scoped characters (withIndex('by_board', eq boardId)), so a library character like @coast tagged on a shot is missing from the "Featuring …" beat text (director.ts:42). This is a backend fact, but it undermines the purpose of the studio.
- **[medium] [dark-mode]** `dashboard/components/ImageGenerationControls.tsx:14` — Theming is mixed between light and dark. The hero is `bg-fal-gray-950 text-white` in both themes, and the Generate aside is a fixed `bg-[#11131a]`, but the source form is white in light mode. Inside the always-dark aside, the model controls use `bg-white` pill selects and a `bg-fal-gray-50/70` details box (lines 14, 50). In light mode this gives a light form next to dark slabs with white pills inside them.
- **[medium] [copy]** `dashboard/lib/imageModels.ts:85` — The aspect-ratio control misrepresents what GPT Sunburst and Flare will do. The select offers 10 ratios (ASPECT_RATIOS, line 42), but gptImageSize maps everything except 1:1 and 9:16 to landscape_16_9. The default 4:3 sheet on GPT Sunburst silently renders at 16:9, and 3:4, 4:5 and 2:3 portraits become landscape. Separately, the sheet brief asks for 5 panels (assetGeneration.ts:35) at the default 4:3 1K (assetGeneration.ts:68), which yields tiny panels.
- **[medium] [typography]** `dashboard/tailwind.config.js:121` — The type hierarchy is flat and small. fontWeight remaps semibold→500, medium→400 and bold→500, and body text is Focal Light 300 (globals.css:73). Page and section titles differ only by size (text-2xl vs text-lg), labels are text-xs at weight 400, and hints are 10–11px in fal-gray-500 on near-black. There are also two h1 elements (layout.tsx:51 "Stream Admin" and the page hero). Handles and prompt anchors are not set in mono, even though JetBrains Mono is loaded (layout.tsx:8).
- **[medium] [code-structure]** `dashboard/components/AssetStudioVisualFixture.tsx:23` — The visual fixture is neither deterministic nor faithful. It hard-codes production Convex storage URLs (sleek-opossum-939.convex.cloud) for track art, which render as a flat #0c0d13 square because MorphSlider swallows texture errors (MorphSlider.tsx:283). It re-implements the UI by copy-paste (lines 41-44) instead of rendering the real components, so it has already drifted: gradient stand-ins replace ReferenceAssetManager, and the subcopy differs. Its buttons are inert: "Generate character sheet" has no handler and "Add reference" is a <button> with no type. It also nests a <main> inside the layout's <main> (line 39 vs app/layout.tsx:63).
- **[low] [code-structure]** `dashboard/components/CharacterLibraryPage.tsx:149` — The two library pages are about 90% duplicated. They share the state machine, the upload helper (uploadGeneratedImage/saveGeneratedImage), generateSheet, the hero, the aside and the status messages. The JSX is single-line with strings up to about 3,000 characters (lines 149-160; Location 141-151), and a local `field` class string is copied into three files. LocationLibraryPage.save re-queries the entire listLocations just to read one row (line 93). presentCharacter calls ctx.storage.getUrl for every reference on up to 100 rows on each reactive update (assets.ts:44-54, 96-103).
- **[low] [performance]** `dashboard/components/reactbits/MorphSlider.tsx:304` — MorphSlider runs a perpetual requestAnimationFrame render loop even when idle, offscreen or in a hidden tab, adding a second WebGL context on top of the global Dither. Its aria-label is hard-coded to "Coast audio artwork" (line 545) and its buttons to "Previous/Next song artwork" (550-551), so it cannot be reused as a turnaround viewer without adding props. Failed texture loads leave live controls over a blank frame, with no error or loading state.
- **[low] [a11y]** `dashboard/components/reactbits/PixelCard.jsx:241` — PixelCard (used on Clips and Recordings) makes the non-interactive wrapper focusable (tabIndex=0) unless noFocus is set. Its canvas ignores devicePixelRatio (lines 152-155), so it is blurry on retina screens. In 'appear' mode the pixels shimmer forever, so the rAF loop never goes idle while hovered (lines 188-198). ChromaGrid uses fixed 320px columns and cards (ChromaGrid.css:6,22,30,40), which overflow narrow containers such as shotboard CharacterPanel's h-[420px] column. It also uses <article role="button"> with no aria-pressed for the `selected` state.

## Redesign opportunities
### Character Bible / Casting Sheet for /admin/characters (transformative) — CSV: Profile Card, Holo, Magic Bento, Figma vector editor, Split Flap Text, Decrypted Text, Tilted Card, Apple's corners, Glass Surface, Line Sidebar
Replace the hero, accordion and form stack with a three-zone casting layout.

(1) Left roster rail, about 280px, sticky. A call-sheet list of cast members. Each row shows a 48px squircle headshot, the name in Focal 500, @handle in JetBrains Mono, a $COAST-style anchor chip, a lock seal, a refs counter such as 3/14, and "last sheet 2d ago". It has a search field, filters (Locked / Needs reference / Has sheet), and a "+ Cast" button that opens an inline draft instead of inserting "New character" immediately. Selection happens on click or Enter only, and is reflected in the URL (?id=) so the Shotboard can deep-link to "Edit @coast".

(2) Center bible page, as a Magic Bento grid:
- An "ID card" hero: the primary identity headshot on a Profile Card / Holo foil treatment, which activates only when identityLocked. It carries the name as a large display headline, @handle and $ANCHOR copy chips (Split Flap or Decrypted text on first render), and "Revision n · updated …".
- A full-width Turnaround strip that shows the latest approved sheet at its native aspect ratio (never square-cropped). Front / ¾ / Profile / Back / Expressions labels are drawn as Figma-vector-editor-style selection boxes, and clicking opens a lightbox with zoom and prev/next through assetVersions.
- An "Identity invariants" two-column checklist: "Never changes" (face, hair, proportions, from identityNotes) versus "Varies per scene" (defaultWardrobe).
- A Wardrobe looks tray (wardrobe-role references).
- A Voice & persona card that surfaces the hidden voiceNotes field.
- A "Used in" card listing shots whose characterIds include the character.
- A Continuity log timeline from listAssetHistory showing role, model, a collapsed prompt, and sourceRevision.

(3) Right Generate dock, sticky at xl and a bottom sheet below xl. See the Darkroom opportunity.

Keep every existing field label, placeholder and aria-label, and restyle them only. The global Dither stays visible through glass surfaces (bg-black/40 with backdrop-blur-xl and a 1px chrome hairline).

### Location Scouting Board for /admin/locations (transformative) — CSV: Masonry, Topography, Pill Nav, Split Flap Text, Option Wheel, Tilted Card, Ghosty reveal, Radar
Turn the locations page into a scouting wall.
- Header band: a Topography contour-line strip (tinted to the Dither blue, low opacity, paused under reduced motion) behind the h1 "Locations that hold their atmosphere".
- Kind filter: a Pill Nav over the existing literals: Landmark, Neighborhood, Coastline (UI label only; the Convex literal stays 'coast'), Interior, Other.
- Grid: a Masonry of scouting "polaroid" cards. Each has the primary image (or a kind-specific branded placeholder), the name, @handle in mono as a Split Flap departure-board line, a kind badge, and chips for default light (sun/fog/moon icon) and weather, plus a refs counter. Hover gives a Tilted Card effect with a Ghosty reveal of the image.
- Detail: a "Scout report" layout that mirrors buildLocationSheetSource's four views. The Establishing image is large, with Approach, Architectural detail and Texture/atmosphere tiles beneath it. The notes blocks are Environment, Architecture & materials, Weather and Visual style, plus the optional style (styleId) picker.
- An Option Wheel for Default light presets (Morning fog / Golden hour / Blue hour / Night neon), which still writes free text into defaultTimeOfDay.
- A "Used in scenes" list driven by scenes.locationId.
- "Load SF starters" becomes a scouting-pack card, "San Francisco pack · 10 locations", with a preview collage.

### Darkroom generation dock with review-before-promote (high) — CSV: Stepper, Pixel Transition, Halftone Reveal, Ghosty reveal, Counter, Border Glow
Replace the single spinner with a Stepper of five stages that mirrors the real pipeline: Save source → Astra brief (GMI, with a 3-minute limit) → Render (model label, e.g. "GPT Image 2.5 Sunburst") → Save to library (Convex upload) → Review. Show an elapsed timer and inline per-stage errors; keep role="alert", but place it next to the CTA rather than at the page bottom.

Outputs appear as a contact sheet of 1–4 variations at native aspect. Each can be revealed with a Pixel Transition or Halftone Reveal dither resolve that matches the background. Per-variation actions: "Approve as primary", "Add as identity reference", "Keep in history", "Discard".

This needs a small backend change, which the spec must list explicitly: completeGeneration should stop auto-appending outputs to referenceStorageIds and stop auto-setting primaryStorageId (or be split into complete + approveSheet), which removes the 14-reference lockout and the identity-drift loop.

A truthful "Output" preset row replaces the raw aspect select for sheets: "Turnaround 21:9 · 2K", "Headshot 4:5", "Expression grid 1:1". Show only the ratios each model family honors, and fix gptImageSize to map 4:3 → landscape_4_3 and 3:4 → portrait_4_3.

Keep the copy "No model call occurs until the source is valid."

### Brand asset pipeline anchored on the Coast character sheet (high) — CSV: Amo hover button, Symbols effect, Noise
Where the Coast sheet comes from:
(a) The runtime canonical source is Convex `_storage`. Upload the sheet on /admin/characters through ReferenceAssetManager with role Identity. It lands in characters.referenceStorageIds, becomes primaryStorageId as the first upload, and is logged in assetVersions with role 'identity'. Every in-app generation (nano-banana-2/edit or openai/gpt-image-2.5/sunburst/edit) then receives it as image_urls.
(b) Build-time brand art has no Coast source in the repo today. The spec should have the owner place it at dashboard/public/brand/coast/coast-character-sheet.webp (or a non-public assets/brand/source/). An owner-run script, scripts/brand/generate-brand-assets.ts, reads FAL_KEY from env and is never run in CI. It uploads the sheet to fal storage and calls openai/gpt-image-2.5/sunburst/edit with image_urls=[sheet] for stills:
- a 21:9 Characters hero,
- a 21:9 Locations hero (Coast on an SF rooftop at blue hour),
- 1:1 empty-state spots,
- kind-specific placeholder plates (landmark, neighborhood, coastline, interior, other),
- a loading poster,
- an OG image.
MiniMax H3 Max from the same sheet produces 2–4 s motion loops (webm/mp4 plus poster). Outputs go to dashboard/public/brand/generated/ with a manifest.json recording prompt, endpoint, seed, dimensions and a sourceHash made with promptFingerprint.
(c) The existing Coast originals cover art (tracks.coverStorageId) can serve as secondary style references.

Surfacing:
- Replace assetPlaceholder() with a kind-aware branded fallback that uses these plates, dithered to the background palette.
- Page heroes and empty states use the stills.
- A "Brand kit" drawer on Characters lists the manifest entries with copy-URL buttons.
- Imported brand stills can be logged into @coast's continuity log via the unused assetVersions.externalUrl field (schema.ts:244).
- The visual-test fixture switches from production Convex URLs to these local files, making it deterministic.

### "Coast resolve" loading system that matches the Dither (high) — CSV: Halftone Reveal, Pixel Transition, Decrypted Text, Scanner, Amo hover button, Noise
Build one loading language for the studio.

(1) Skeletons: roster rows and board cards whose image wells are Bayer-dithered noise in the exact Dither palette (dark wave [0.2,0.34,0.66] on [0.02,0.03,0.06]; light [0.5,0.63,0.86] on [0.98,0.98,1.0]). They are generated once by a 2D-canvas util (lib/ditherImage.ts reusing Dither.jsx's 4-level Bayer matrix), so no extra WebGL contexts are created. When the real image loads it resolves through a 400ms halftone-to-full-color transition.

(2) Page and hero loader, replacing Loader2 with "Loading character library…": a Coast silhouette (from the generated poster) assembles out of dither cells while the "$COAST" wordmark decrypts. The existing text stays for screen readers in a role="status" node.

(3) While a sheet renders, the Generate dock plays the MiniMax H3 Max loop of Coast turning to camera. It follows the Amo pattern: the video plays only while busy and resets afterward, preload="none", with the poster as fallback.

(4) Under prefers-reduced-motion everything collapses to a static dithered poster and a determinate text status.

### Identity Lock as a first-class seal with a readiness checklist (high) — CSV: Star Border, Sticker Peel, Realistic emboss, Electric Border
Replace the native checkbox with a switch (role="switch", aria-checked). The existing label "Lock the face and overall look across generations" stays as its accessible name, alongside a visible seal badge: a squircle stamp reading "IDENTITY LOCKED" with a subtle Star Border shimmer, or a Sticker Peel stamp.

When locked, the identity fields (description, appearance, identity invariants) render as read-only bible text behind an "Unlock to edit" affordance, while wardrobe and style stay editable, which matches the copy "swap wardrobe and scene styling". Identity-role references show a lock glyph and require a confirmation before removal.

Above the Generate CTA, show a readiness checklist with live check marks: Name, @handle, Identity description, and at least one Identity reference. The last one should count only role 'identity', not any role; the spec should flag this as a behavior tightening. Keep the exact amber hint string for the incomplete state.

### Role-segmented reference tray (medium) — CSV: Tilted Card, Folder, Counter, Spotlight Card
Evolve ReferenceAssetManager while keeping its props and aria-labels.
- Tabs or segments: Identity / Wardrobe / Style (characters) and Environment / Style (locations).
- Each tile shows a role chip and a persistent primary star badge, visible at rest and not only on hover.
- Actions are revealed on hover and on focus-within.
- Multi-file drop with a drag-over highlight, per-file progress, and an animated counter such as "3/14".
- Remove shows an undo toast rather than removing instantly.
- Clicking a tile opens a lightbox.
- Alt text is derived as "@coast identity reference 2".

Roles are not currently on the character row. The UI can derive them from listAssetHistory (assetVersions.role by storageId) without a schema change; a later referenceRoles field is optional. The Folder component can group "reference packs".

### Unified studio tokens and glass surfaces over the Dither (high) — CSV: Glass Surface, Apple's corners, Shiny Text, Border Glow, Noise
Resolve the fal-primary collision: choose chrome blue from the wordmark and Dither as the primary, and add one warm "signal" accent for live/generate states. Express these as CSS variables in globals.css (e.g. --studio-surface, --studio-surface-raised, --studio-hairline, --studio-ink, --studio-ink-muted, --studio-accent, --studio-signal) with light and dark values, exposed as Tailwind semantic colors.

Then:
- Delete the non-existent -200/-300 shade usages.
- Replace hard-coded #11131a, #a78bfa and #05030b, passing accentColor/overlayColor to AccordionGallery from the tokens.
- Make the hero and aside follow the theme instead of being dark in both themes.
- Use squircle radii, 1px chrome hairlines and backdrop-blur glass so the Dither reads through.
- Establish a real type scale: display 40/44 at 500 for character names, 13px labels at 400 with 0.02em tracking, and handles, anchors and hashes in JetBrains Mono.
- Guarantee WCAG AA (≥4.5:1) for eyebrows, hints and the "Add reference" CTA.

Removing the nested `fal.primary` palette in tailwind.config.js recolors every admin page, so it must be coordinated globally.

### Honest states: unauthenticated, not configured, empty, archived (medium) — CSV: Animated List, Fade Content
When useConvexEnabled() is false, render the studio in read-only Preview mode using the same presentational components fed with fixture data. Keep the exact line "Convex is not configured. Character library changes are disabled." and add a setup hint naming NEXT_PUBLIC_CONVEX_URL.

When Convex is enabled but useConvexAuth().isAuthenticated is false, show a distinct "Sign in through Cloudflare Access" state instead of the misleading empty library.

The empty state becomes an illustrated casting call using the generated Coast spot art, with two CTAs: "Add @coast + SF starter pack" (seedStarterLibrary) and "Cast a new character".

Add Archive, using the existing api.shotboards.removeCharacter and api.locations.remove, behind a confirmation. Add an "Archived" filter only if a query for it is added.

## States inventory
CHARACTERS (dashboard/components/CharacterLibraryPage.tsx)
- Convex not configured (line 44): only a `fal-card > fal-card-content` with amber text "Convex is not configured. Character library changes are disabled." No hero, no preview. Visible in baseline docs/redesign/baseline/admin_characters-dark.jpg and admin_characters-mobile.jpg.
- Loading (characters === undefined, line 150): a flex row with p-6, a spinning Loader2 h-4 and "Loading character library…" in text-fal-gray-500. No skeleton. The hero is already rendered above it.
- Empty (length 0, line 150): a dashed rounded-2xl box with bg-fal-gray-50 (light) or fal-gray-900 (dark), a UserRound icon, "Start with a reusable character" and "Create one, or load the San Francisco starter set to add @coast." This also appears when the user is not authenticated, because listCharacters returns [] (convex/assets.ts:97).
- Populated, nothing selected: AccordionGallery with card 0 expanded (defaultIndex = max(0, -1)) and aria-current, but no editor and no prompt telling the user to pick a card.
- Selected (line 151): 2-column editor at xl, stacked below 1280px.
- Saving (lines 96-105, 152): the "Save source" button shows "Saving…" and is disabled. The Generate button is also disabled while saving.
- Generate disabled (line 79/160): opacity-50 with cursor-not-allowed, plus the amber hint "Add a name, handle, description, and a face reference while identity lock is enabled."
- Generating (line 160): Loader2 spin and "Generating character sheet…", button disabled. No stage, progress or cancel.
- Generation error: failGeneration is recorded (line 141) and the message appears in the bottom `<p role="alert">` (red, line 163). Example messages:
  - "Add an approved face reference before generating a locked identity like @coast"
  - "A handle and identity description are required to generate a sheet"
  - "This generation is already {status}"
  - "Character changed; review it before generating"
  - "Character changed before this result could be saved"
  - "This workspace supports at most 14 reference images; remove some references first"
  - "{model} returned no image"
  - "GMI prompt expansion is not configured (GMI_CLOUD_API_KEY is missing)"
  - "GMI prompt expansion exceeded its three-minute deadline"
  - "Generated image could not be read/saved (status)"
- Success notices, in the bottom `<p role="status">` (emerald, line 162):
  - "{n} character-sheet variation(s) saved to Convex storage."
  - "Character source saved."
  - "Character created. Add a name, handle, identity description, and approved face references."
  - "Starter library ready: {n} San Francisco locations and @coast."
  Notices and errors can both be visible at once and never auto-dismiss.
- Sheet history, loading (history undefined): renders nothing.
- Sheet history, empty: "Generated sheets will remain here for review." (text-fal-gray-500).
- Sheet history, populated: 3-column square thumbnails with title "Use as primary reference".
- Validation error "Name and @handle are required" (line 95), shown via the bottom alert. The server adds "Handles must use 2–63 lowercase letters, numbers, hyphens, or underscores" and "@{handle} is already in use" (assets.ts:28, 34).

LOCATIONS (dashboard/components/LocationLibraryPage.tsx)
- Not configured (line 43): "Convex is not configured. Location library changes are disabled." (baseline admin_locations-dark.jpg).
- Loading (line 142): "Loading location library…".
- Empty (line 142): MapPin icon, "Start with a reusable environment" and "Load the San Francisco starter library or create an original location." This also appears when unauthenticated.
- Selected, saving, generating: same patterns as Characters. The button shows "Generating location sheet…" and the hint reads "Add a name and environment description to continue."
- Errors include "A location name is required", "Add an environment description before generating", "Location was not available after saving" and "Location changed; review it before generating".
- Notices include "Location created. Define its environment before generating a reusable reference sheet.", "Location source saved." and "{n} location-sheet variation(s) saved to Convex storage."

REFERENCE MANAGER (dashboard/components/ReferenceAssetManager.tsx)
- Idle: the add tile shows ImagePlus and "Add reference", with "{n}/14 · drop or choose" below.
- Uploading: Loader2 and "Uploading…", button disabled.
- At the limit: the button is disabled at opacity-50. Attempting an upload shows the alert "This library item already has the 14-image reference limit."
- Wrong file type: alert "Choose an image file for a visual reference."
- Upload failure: "Upload failed ({status})". The error is a small red `<p role="alert">` below the grid.
- Primary indicator: a star filled with text-amber-300, visible only when the action bar is shown (hover at ≥sm; always visible on mobile).
- Disabled prop: supported, but no caller passes it.
- No drag-over state and no per-file progress.

VISUAL-TEST (dashboard/app/admin/visual-test/page.tsx, dashboard/components/AssetStudioVisualFixture.tsx)
- In production, notFound() returns a 404.
- In development there is a permanent amber banner reading "Visual-test fixture only. No account, Convex mutation, GMI request, or Fal generation is available on this route."
- The MorphSlider has no loading or error state. A failed remote cover shows a flat dark square with live arrows and dots (see baseline admin_visual-test-dark.jpg).
- If WebGL fails, a fallback <img> is rendered (webglFailed, MorphSlider.tsx:546).

REACT BITS
- AccordionGallery: active and inactive panel states (inactive labels at 0.62–0.72 opacity), a focus-visible accent ring, and reduced-motion handling that sets duration to 0. On mobile (≤520px) panels become a column of 84px strips.
- PixelCard: idle, then pixel 'appear' on hover or focus and 'disappear' on leave. Reduced motion sets speed 0 and delay 0. The .pixel-card-latest modifier adds a green border.
- ChromaGrid: grayscale spotlight follows the pointer, the fade overlay restores on leave, .chroma-card--selected shows a border and shadow, and .chroma-img-empty shows a striped placeholder.
- MorphSlider: autoplay pauses on hover, drag and keyboard arrows work, and caption changes are announced via aria-live="polite".

## Invariants
- Keep the global Dither background exactly as mounted in app/layout.tsx:37 (components/DitherBackground.tsx, fixed -z-10, pointer-events-none, aria-hidden, dark/light palettes). Do not edit vendored dashboard/components/dither-kit/* (dither-kit.json lockfile hashes).
- Routes and nav: /admin/characters and /admin/locations with AdminNav labels "Characters" (UsersRound) and "Locations" (MapPin) (components/AdminNav.tsx:10-11). /admin/visual-test must keep `if (process.env.NODE_ENV === 'production') notFound()` and must never mount Convex hooks (AssetStudioVisualFixture docstring: "It never mounts Convex hooks").
- Convex-disabled gate: useConvexEnabled() must be checked before any Convex hook mounts (CharacterLibraryPage.tsx:43-45, LocationLibraryPage.tsx:42-44). Keep the exact strings "Convex is not configured. Character library changes are disabled." and "Convex is not configured. Location library changes are disabled." The unconfigured-admin test flow in .agents/skills/admin-testing/SKILL.md launches with NEXT_PUBLIC_CONVEX_URL unset and expects no console errors beyond a React DevTools message.
- Convex API contract used by the studio (names and argument shapes must not change): api.assets.listCharacters, getCharacter, createCharacter({name, handle, identityLocked}), patchCharacter({characterId, name, handle, description, appearance, identityNotes, defaultWardrobe, voiceNotes, visualStyle, identityLocked, referenceStorageIds, primaryStorageId}), listLocations, createLocation({name, kind}), patchLocation({locationId, name, handle, kind, description, architecture, defaultTimeOfDay, defaultWeather, visualStyle, referenceStorageIds, primaryStorageId}), generateUploadUrl, recordUpload({targetType, characterId|locationId, storageId, role, makePrimary}), removeReference, getStorageUrl, listAssetHistory({targetType, characterId|locationId}), startGeneration, completeGeneration, failGeneration, seedStarterLibrary (returns {locationsCreated, coastCreated}); api.promptExpansion.expand({kind:'image', source, context, requestId}).
- Generation safety ordering (CharacterLibraryPage.tsx:118-144, LocationLibraryPage.tsx:111-135): persist the draft, then validate, then GMI expand, then promptFingerprint sourceHash, then startGeneration (idempotent requestId, revision check), then generateImages, then re-upload each output to Convex storage, then completeGeneration. Call failGeneration on error. No fal call may happen before the source is valid; the copy "No model call occurs until the source is valid." states this. Paid calls go only through the fal sdk proxy (FAL_SDK_PROXY_URL); FAL_KEY never reaches the client.
- Identity-lock semantics: identityLocked defaults to true (newDraft, createCharacter, seed). A locked character cannot generate without a reference. Keep the error string "Add an approved face reference before generating a locked identity like @coast" and the hint "Add a name, handle, description, and a face reference while identity lock is enabled." Keep the accessible label "Lock the face and overall look across generations" even if the checkbox becomes a switch.
- Handle normalization: the client uses `.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '')`, the server uses assertHandle /^[a-z0-9][a-z0-9_-]{1,62}$/, and handles are unique per table (by_handle index). @coast has handle 'coast' and starterKey 'coast'. STARTER_LOCATIONS starterKeys (ferry-building … sutro-baths) must stay stable for idempotent seeding.
- Enum literals must not change: location kind 'landmark'|'neighborhood'|'coast'|'interior'|'other' (UI labels may change, e.g. 'Coastline'). Reference roles are 'identity'|'wardrobe'|'style'|'environment'|'sheet'. ReferenceAssetManager defaultRole is 'identity' for characters and 'environment' for locations.
- MAX_ASSET_REFERENCES = 14 (lib/imageModels.ts:41), with its counter text pattern "{n}/14" and the limit error "This library item already has the 14-image reference limit."
- ReferenceAssetManager a11y hooks: `<section aria-label="Reference images">`, button aria-labels "Use as primary image" and "Remove reference from this item", upload through a hidden <input type=file accept="image/*">. Its props interface {targetType, targetId, references, primaryStorageId, defaultRole, onRemove, onMakePrimary, onUploaded, disabled} is consumed by both library pages.
- ImageGenerationControls aria-labels: "Image model", "Image aspect ratio", "Image variations", "Output image format", "Nano Banana resolution", "GPT Image quality", "Image background". Model ids are 'nano-banana' (default), 'gpt-flare' and 'gpt-sunburst', mapped to fal endpoints fal-ai/nano-banana-2(/edit) and openai/gpt-image-2.5/{flare|sunburst}/{text-to-image|edit}. The props interface is shared with the Shotboard.
- Live-region semantics: success notices use role="status" and failures use role="alert" (CharacterLibraryPage.tsx:162-163, LocationLibraryPage.tsx:153-154, ReferenceAssetManager.tsx:126). They may move closer to the CTA but must keep these roles.
- Visible copy other agents or tests may key on (restyle freely, keep the text): "Visual asset studio", "Characters with a stable identity", "Locations that hold their atmosphere", "Load SF starters", "New character", "New location", "Character source", "Location source", "Save source"/"Saving…", "Generate character sheet"/"Generating character sheet…", "Generate location sheet"/"Generating location sheet…", "Sheet history", "Use as primary reference" (title), "Loading character library…", "Loading location library…", "Start with a reusable character", "Start with a reusable environment", all field labels (Name, Handle, Identity and continuity description, Appearance details, Default wardrobe, Identity invariants, Visual style, Type, Handle (optional), Default light, Environment description, Architecture and materials, Weather).
- AccordionGallery is shared with Shotboard (ShotCard.tsx:169, SceneSection.tsx:69, SceneGallery.tsx). Its props API (items[{id,image,label,alt,link}], defaultIndex, height, expandRatio, accentColor, overlayColor, trigger, grayscale, onSelect(index)), root class .accordion-gallery, role="list" aria-label="Image accordion gallery", .ag-panel/.ag-panel--active classes, roving tabIndex and arrow-key navigation must keep working for those callers. Wrap it rather than changing its semantics in place.
- MorphSlider is used by TrackManager on Live Control (aria-label "Coast originals artwork carousel" wrapper) and by the fixture. Keep its aria-roledescription="carousel", aria-label "Coast audio artwork" (default), "Previous song artwork"/"Next song artwork", the tablist "Song artwork", activeIndex/onIndexChange contract and WebGL fallback img. Add a label prop instead of changing the default.
- PixelCard (Clips/Recordings) and ChromaGrid (shotboard CharacterPanel) are consumed outside the studio. Keep the .pixel-card / .pixel-card-latest class hooks and CSS vars --pixel-card-border/--pixel-card-background (globals.css:229-244) and the ChromaGrid onSelect(item) contract.
- Fixture section id="audio-library-visual-test" and the fixture's no-network, no-mutation guarantee. Replacing the hard-coded sleek-opossum-939 URLs with local assets is encouraged; adding Convex or fal calls is not allowed.
- Theme mechanism: class-based dark mode (tailwind darkMode:'class', the themeInit script in app/layout.tsx:11-19, localStorage key 'theme'). DitherBackground observes the html class attribute. Every new surface must work in both themes.
- Reduced motion: every new animation (GSAP, motion, WebGL) must respect prefers-reduced-motion, as AccordionGallery, PixelCard and MorphSlider already do.
- Next.js on Cloudflare Pages (next-on-pages, package.json pages:build). Do not add Node-only server code to routes. next/image has no remote patterns configured, so Convex storage URLs are rendered with <img> and the eslint-disable comments; keep that approach or configure images deliberately.
- lucide-react is pinned at ^0.294.0. Verify an icon exists in that version before using a newer name.

## Refactor notes
SPLIT THE TWO LIBRARY PAGES INTO A SHARED ENGINE PLUS DOMAIN SHELLS
Both CharacterLibraryPage.tsx (165 lines, 19 KB) and LocationLibraryPage.tsx (156 lines, 18 KB) repeat the same logic: selection and draft state, the persist/save functions, the upload helper (uploadGeneratedImage/saveGeneratedImage), generateSheet, the hero, the generate aside and the status messages. Much of the JSX sits on single lines of 1–3k characters (Character lines 149-160, Location lines 141-151). A safe split:

1. components/asset-studio/useAssetGeneration.ts: one hook parameterized by targetType ('character' | 'location').
   - Wraps startGeneration, completeGeneration, failGeneration, generateUploadUrl and promptExpansion.expand.
   - Exposes a stage enum (saving | expanding | rendering | uploading | completing | done | error) so the new Stepper can render real progress.
   - Keeps the exact call order and requestId formats: `character-${id}-${Date.now()}` / `sheet-${id}-…` and `location-${id}-…` / `location-sheet-${id}-…`.
   - Owns the shared `uploadGeneratedImage(url)` helper.

2. components/asset-studio/useLibraryDraft.ts: generic draft and dirty-state hook.
   - Fixes the stale-reference bug by removing referenceStorageIds from the patch payload in persistDraft/save. The server already owns the references via recordUpload/removeReference.
   - Alternatively, rehydrate the draft from the live query whenever current.revision changes and there are no local edits.
   - Adds an isDirty flag plus confirm-on-switch.

3. Presentational components that take plain props and never mount Convex hooks: StudioHero, RosterRail, CharacterBible, LocationScoutReport, GenerateDock (wraps ImageGenerationControls plus Stepper plus a results contact sheet), SheetViewer (native-aspect lightbox), ReferenceTray (evolves ReferenceAssetManager with the same props), IdentitySeal, StudioStatus (notice/alert with the same roles), StudioEmptyState and StudioSkeleton.
   - AssetStudioVisualFixture then renders these same components with fixture data from lib/fixtures/assetStudio.ts. This ends the current copy-paste drift and makes the fixture a real visual-regression target.
   - Replace the hard-coded production Convex URLs in the fixture with local /brand/generated/* files.

4. CharacterLibraryPage and LocationLibraryPage become thin containers: queries and mutations plus a domain shell. Keep their default exports and the useConvexEnabled gate, because app/admin/*/page.tsx import them by path.

STYLING
- Replace the repeated `field` class constant (defined in three files) and the inline mega-classNames with a few `@layer components` classes in globals.css (e.g. .studio-field, .studio-panel, .studio-eyebrow, .studio-chip) or cva-style variants with clsx and tailwind-merge (both already dependencies).
- Keep the `.asset-studio` root class as the scoping hook; it has no CSS today, so it is free to own studio tokens.
- Remove all fal-primary-200/300 usages.
- Fixing the tailwind.config.js palette collision (nested `fal.primary` violet overriding flat `fal-primary` chrome blue) recolors every page. Do it once, globally, together with the other surface auditors, not as a studio-local hack.

VENDORED REACT BITS
- Do not change AccordionGallery's selection semantics in place; the Shotboard relies on it (ShotCard, SceneSection, SceneGallery). If the studio keeps it, add an `AssetAccordion` wrapper that passes trigger='click', stops keying on selectedId (pass defaultIndex only), and fixes the list/listitem ARIA (which is safe for all callers).
- MorphSlider needs:
  - a `label` prop for its hard-coded aria-labels,
  - an IntersectionObserver plus visibilitychange pause for its perpetual rAF loop,
  - an onError / loading state before it is reused for turnarounds.
- PixelCard needs devicePixelRatio scaling and an idle stop.
- ChromaGrid needs responsive columns.
- Run these fixes as isolated commits so regressions on Clips, Recordings and Live Control are easy to bisect.

BACKEND CHANGES THE UI REDESIGN NEEDS
Flag each as a behavior change in goal.md, with typecheck via `npm run typecheck` (it includes convex/tsconfig.json):
- (a) completeGeneration should stop auto-appending outputs to referenceStorageIds and stop auto-promoting the primary. Add an approveSheet({jobId|storageId, asPrimary, asReference}) mutation. This removes the 14-reference lockout and the identity-drift loop.
- (b) Add a getLocation query so LocationLibraryPage.save stops re-reading the whole listLocations.
- (c) Expose archive in the studio by reusing api.shotboards.removeCharacter and api.locations.remove, or add assets.archiveCharacter / archiveLocation for symmetry.
- (d) Optional: per-reference role on the row. The UI can derive it from assetVersions without a schema change.
- (e) Separately from the redesign: director.prepare (convex/director.ts:24) resolves only board-scoped characters, so @coast from the library never reaches Director beat text. Report this and fix it with a query that also includes library characters (boardId undefined).
- (f) Fix gptImageSize (lib/imageModels.ts:85-95) to map 4:3 and 3:4 to the landscape_4_3 / portrait_4_3 presets, and hide the unsupported ratios for the GPT family.

BRAND ASSETS
- Keep generation of brand stills and loops in an owner-run script (e.g. scripts/brand/generate-brand-assets.ts) that reads FAL_KEY from env and writes to dashboard/public/brand/generated/ plus a manifest.json. It must never run in CI or at build time.
- The Coast source sheet must be supplied by the owner; none exists in the repo today.
- At runtime the canonical Coast identity image lives in Convex `_storage` on @coast's referenceStorageIds/primaryStorageId (role 'identity'). The static copy exists only to seed brand art and deterministic fixtures.
