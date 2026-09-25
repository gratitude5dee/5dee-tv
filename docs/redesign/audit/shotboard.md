# Audit: Shotboard (/admin/shotboard): storyboard editor where scenes contain shots, with per-shot image generation, GMI prompt expansion, a character panel, and compile-and-transfer to the MiniMax H3 Max Director

## Files read
- dashboard/app/admin/shotboard/page.tsx
- dashboard/components/shotboard/ShotboardPage.tsx
- dashboard/components/shotboard/useShotboard.ts
- dashboard/components/shotboard/SceneSection.tsx
- dashboard/components/shotboard/ShotCard.tsx
- dashboard/components/shotboard/SceneSidebar.tsx
- dashboard/components/shotboard/SceneGallery.tsx
- dashboard/components/shotboard/CharacterPanel.tsx
- dashboard/components/shotboard/ImageModelSelect.tsx
- dashboard/lib/shotboardTypes.ts
- dashboard/lib/shotboardCompiler.ts
- dashboard/lib/imageModels.ts
- dashboard/lib/imageGen.ts
- dashboard/components/AssetUrlInput.tsx
- dashboard/components/reactbits/AccordionGallery.jsx
- dashboard/components/reactbits/AccordionGallery.css
- dashboard/components/reactbits/ChromaGrid.jsx
- dashboard/components/reactbits/ChromaGrid.css
- dashboard/components/reactbits/Dither.jsx (imports/renderer only)
- dashboard/components/reactbits/PixelCard.jsx (renderer only)
- dashboard/components/reactbits/MorphSlider.tsx (renderer only)
- dashboard/components/DitherBackground.tsx
- dashboard/components/AdminNav.tsx
- dashboard/components/ScriptTemplatePicker.tsx
- dashboard/components/CharacterLibraryPage.tsx (handle conventions)
- dashboard/components/ConvexClientProvider.tsx
- dashboard/components/dither-kit/pixel.ts (exports)
- dashboard/components/dither-kit/dither-paint.ts (exports)
- dashboard/components/dither-kit/avatar.tsx (header)
- dashboard/app/layout.tsx
- dashboard/app/admin/layout.tsx
- dashboard/app/admin/page.tsx
- dashboard/app/admin/visual-test/page.tsx
- dashboard/app/globals.css
- dashboard/tailwind.config.js
- dashboard/.next/static/css/app/layout.css (compiled fal-primary rules)
- dashboard/node_modules/tailwindcss/lib/util/flattenColorPalette.js
- dashboard/convex/shotboards.ts
- dashboard/convex/promptExpansion.ts
- dashboard/convex/director.ts
- dashboard/convex/assets.ts (createCharacter, coast seed)
- dashboard/convex/schema.ts (characters, promptJobs)
- dashboard/package.json
- .agents/skills/admin-testing/SKILL.md
- docs/redesign/component-prompts.csv

## Current state
ROUTE AND SHELL (verified). app/admin/shotboard/page.tsx:6-11 wraps <ShotboardPage/> in <Suspense> because it reads useSearchParams. ShotboardPage.tsx:23-28 picks <ConvexShotboard/> when useConvexEnabled() is true and <LocalShotboard/> otherwise. The split exists because Convex hooks cannot mount without a provider. Both variants render the same ShotboardView (:47). The page sits inside the global layout (app/layout.tsx:36-67): the fixed React Bits Dither WebGL wave (DitherBackground.tsx:23-32, chrome-blue wave [0.2,0.34,0.66] in dark mode), a translucent wrapper `bg-fal-gray-50/60 dark:bg-[#0a0d14]/45`, a #0a0d14 header, and `main.max-w-7xl mx-auto px-6 lg:px-8 py-8` with a `fade-in` wrapper. The editor is therefore capped at 1280px. AdminNav (tab "Shotboard", Clapperboard icon, nav aria-label "Admin sections") sits above it. Every panel on the page is an opaque `fal-card` (white, or dark `bg-fal-gray-900 border-fal-gray-800`, globals.css:91-155), so the dither only shows in the gutters between cards.

LAYOUT TODAY (verified). There is a single stacked column (`space-y-4`, ShotboardPage.tsx:188).
(1) A header `fal-card` (:189-295) holds a Clapperboard icon, the static h3 "Shotboard", and a wrapping row of controls: the native board <select> "New / unsaved board" (:197-211, Convex only, title "Saved shotboards"), a "New board" button that immediately creates 'Untitled Shotboard' (:212-219), ImageModelSelect (native selects for model and, for GPT models, quality), a "Board style…" select (:221-232), a "Send to Director" button (:233-270), and a trash icon, "Delete board" (:271-280).
(2) The header's content area holds one line of grey copy: "Build scenes of shots… N beats · Ns runtime." After it come an amber "N shots need Director expansion before transfer." (:288), the amber `status` string used for every error (:290), and in local mode the amber "Convex not configured…" message (:291-293).
(3) Below the header there are three possible states: a loading card, an empty card, or the editor grid `grid-cols-1 lg:grid-cols-[280px_1fr]` (:304).
The left column is one fal-card holding SceneSidebar and then CharacterPanel. SceneSidebar has a borderless text-xl board-title input, a description textarea, and four collapsible Sections: "Scene description" (textarea, keyframe AssetUrlInput, "Generate keyframe"), "Location & time" (free-text location, time of day, weather), "Atmosphere & elements" (atmosphere plus element chips), and "Camera environment". CharacterPanel shows a "Characters" label with a "New" button, a vendored ChromaGrid in a fixed `h-[420px] overflow-hidden` box (columns=1, radius 200), and an editor for the selected character (name, "$HANDLE", delete, description, portrait AssetUrlInput, "Generate portrait"/"Regenerate portrait").
The right column holds a SceneGallery strip, then one SceneSection per scene, then "Add scene". SceneGallery is a React Bits AccordionGallery: 140px tall, hover trigger, grayscale, accent #7c3aed, one panel per scene, image = keyframe or first shot image.

SCENE AND SHOT UX (verified). A SceneSection (SceneSection.tsx:50-121) is a `rounded-lg border p-3`; when selected it gets `border-fal-primary-500/60 bg-fal-primary-500/5`. Its header has a 28px scene-number badge, an inline title input, and a library-location picker. The picker is a native <details> popover (z-30, 420px) containing another AccordionGallery (accent #a78bfa). The header also has up/down arrow buttons, an "Add shot" button, and a trash button. Shots render in a horizontally scrolling flex row (`overflow-x-auto`, :95); an empty scene shows a dashed "First shot" button (:110-119).
Each ShotCard (ShotCard.tsx:69-218) is a fixed `w-64` panel containing, top to bottom:
- a "Shot N" micro-label with ←, →, and trash icon buttons;
- a fixed `h-32` dashed image well (2:1 object-cover, whatever the board aspect);
- a full-width "Generate image" / "Regenerate image" / "Generating…" button;
- a shot-type <select> (13 options from SHOT_TYPE_OPTIONS), a duration number input, and an "s" unit;
- the prompt textarea (3 rows). It shows `expandedPrompt || promptIdea`, has an absolutely positioned "Expand" pill (GMI), and a simple @mention dropdown that only triggers when @ is at the end of the text;
- an "Undo expansion" link;
- a row of character toggle chips, plus a <details> "Choose from character gallery" containing a third AccordionGallery;
- a "Details" disclosure revealing the visual prompt, dialogue, SFX, an audio AssetUrlInput, and a keyframe-URL AssetUrlInput.
Most copy is text-xs or text-[10px] (14 occurrences) in Focal Light 300. Tailwind remaps font-bold and font-semibold to weight 500 (tailwind.config.js:121-128).

DATA AND GENERATION FLOW (verified). useShotboard.ts keeps board, scenes, shots, and characters in local React state and mirrors every edit to Convex through 13 mutations. Writes go through trackWrite, and failures are swallowed with `void tracked.catch(() => undefined)` at :148 until flush(). The hook re-hydrates from `api.shotboards.load` whenever the server revision changes and no writes are pending (:164-179). Creating a scene, shot, or character is not optimistic: the item is appended after the mutation resolves (:237-239, :284-286, :336-338). Reordering uses arrow buttons only: moveShot calls setShotOrder (:314-331), and moveScene renumbers every scene (:262-276).
generateShotImage (ShotboardPage.tsx:90-120) builds its prompt as `Style: …. ` + `${shotTypeLabel}: ${expandedPrompt || visualPrompt || promptIdea}`. Its references are [previous shot image, scene keyframe, library location image, …tagged character portraits], so any regenerate is really an edit of the previous take. It uses `shot.imageModel ?? toolbarModel` and calls the fal SDK proxy via lib/imageGen.ts (`fal.subscribe` with no onQueueUpdate). It persists imageStatus generating → completed or failed; progress is tracked only in a local `generating` Set.
GMI expansion (expandShotPrompt, :122-136) calls api.promptExpansion.start (an alias of expand, convex/promptExpansion.ts:110). The server runs a 4-call pipeline with a 180s deadline: brief (coordinator), then visual and continuity specialists in parallel, then synthesis (:84-93). The server allows at most 2 concurrent expansions and records only reserved, completed, or failed phases in promptJobs.
"Send to Director" (:236-262) is a 27-line inline onClick. It calls flush(); re-expands every shot whose directorPrompt is missing or stale with kind 'director', 2 at a time; patches directorPrompt and directorPromptRevision; flushes again; calls api.director.prepare({boardId, expectedRevision}); then pushes `/admin?transfer=<id>`. The only feedback during this multi-minute process is the button label "Preparing…". The header's "N beats · Ns runtime" comes from the client compiler lib/shotboardCompiler.ts. The server compiler (convex/director.ts:34-50) produces different prompt text and drops shared library characters.

VISUAL LANGUAGE VERDICT (opinion). The page reads as a generic CRUD admin form, not a storyboard tool. Images are small, visually secondary, and cropped to the wrong aspect. Prompts, selects, and chips dominate. Three different gallery widgets (AccordionGallery ×3 and ChromaGrid) compete, with four accent colours: compiled violet #6d28d9, #7c3aed, #a78bfa, and an 8-colour rainbow palette. None of them match the chrome-blue dither wave. Nothing on the page evokes film: no slate, frame, sprocket, timecode, or exposure numbering. No part of the canvas shows the whole board at a glance.

## Problems
- **[high] [states]** `dashboard/components/shotboard/ShotboardPage.tsx:96` — [verified: code] After a shot's first generation the toolbar model select stops applying to it. :96 uses `getImageModel(shot.imageModel ?? imageModel)`, :105 sends `modelId: shot.imageModel ?? model.id`, and :112 saves `imageModel: model.id`, so every later regenerate reuses the first model. There is no per-shot model UI to change or reset it. The button title at ShotCard.tsx:106 promises the opposite: 'Re-generate / edit the keyframe with the selected model'. A redesign needs a visible per-shot model chip with a 'use board default' reset.
- **[high] [dark-mode]** `dashboard/components/shotboard/ShotCard.tsx:158` — [verified: compiled CSS] `border-fal-primary-300`, `hover:bg-fal-primary-50` and `dark:text-fal-primary-300` produce zero rules in .next/static/css/app/layout.css because neither palette defines shades 50 or 300 (tailwind.config.js:27-32, :74-79). In dark mode the 'Expand' pill (ShotCard.tsx:158) and the 'Choose from character gallery' summary (ShotCard.tsx:169) therefore fall back to text-fal-primary-700 #4c1d95 on #111827. That is a 1.62:1 contrast ratio, far below WCAG AA's 4.5:1, so the text is effectively invisible. The Expand pill also loses its hover state and border in both themes.
- **[high] [responsive]** `dashboard/components/shotboard/CharacterPanel.tsx:69` — [inferred from CSS, not rendered] ChromaGrid hard-codes 320px columns and cards (ChromaGrid.css:6, :22, :40) with 1rem padding. At lg and above it sits in a 280px sidebar track minus the fal-card-content px-6, which leaves about 232px, inside `h-[420px] overflow-hidden`. Each card is therefore centre-cropped by roughly 44px per side, including the right-aligned handle in `.chroma-info`. Each card is about 264px tall, so only about 1.5 characters are visible. The 3rd and later characters cannot be reached by mouse or touch because the box does not scroll. `.chroma-info` also forces `font-family: system-ui` (ChromaGrid.css:108), breaking the Focal typography.
- **[high] [states]** `dashboard/components/shotboard/CharacterPanel.tsx:92` — [verified: code] Destructive actions have no confirmation and no undo.
- 'Delete board' is a bare trash icon next to 'Send to Director' (ShotboardPage.tsx:274).
- 'Delete scene' also deletes all of the scene's shots (SceneSection.tsx:90; useShotboard.ts:253-260).
- 'Delete shot' fires immediately (ShotCard.tsx:81).
- 'Delete character' in the shotboard calls removeCharacter, which archives the row globally (convex/shotboards.ts removeCharacter). load() returns shared library characters (boardId undefined, e.g. the seeded @coast from convex/assets.ts:466), so one click in this sidebar archives @coast for the whole studio.
- Regenerate overwrites imageUrl with no take history (ShotboardPage.tsx:112). 'Generate portrait' overwrites the shared library character's imageUrl (ShotboardPage.tsx:166-185).
- **[high] [states]** `dashboard/components/shotboard/ShotboardPage.tsx:290` — [verified: code] Failure states are invisible where they happen.
- imageStatus 'failed' and 'generating' are persisted (ShotboardPage.tsx:102, :115) but no component reads imageStatus. A failed shot looks identical to an untouched one, and a reload mid-generation shows nothing.
- Every error from every shot, scene, and portrait goes into one amber `status` string at the top of the page (:290). It is overwritten by the next message, has no aria-live, and is amber (a warning colour) rather than red. On a long board it is off-screen.
- Optimistic Convex write failures are swallowed (useShotboard.ts:148) and only surface later, if at all, when flush() runs during 'Send to Director'. There is no 'Saving… / Saved / Failed to save' indicator.
- **[high] [visual-hierarchy]** `dashboard/components/shotboard/ShotCard.tsx:87` — [verified dims; opinion on impact] The layout is form-first rather than image-first.
- Frames are a fixed `h-32` box inside a `w-64` card, i.e. 2:1 with object-cover, regardless of the board aspect (16:9 default, 9:16 or 1:1 possible). Generated keyframes are always cropped.
- Each card stacks roughly 10 controls, so cards are about 450px tall collapsed. Scenes are separate horizontally scrolling rows (SceneSection.tsx:95).
- You cannot see the whole board, compare adjacent frames, or read the sequence at a glance.
- There is no film vocabulary: no slate, timecode, shot-type abbreviation, or exposure number.
- **[high] [states]** `dashboard/components/shotboard/useShotboard.ts:373` — [verified: code] 'Loading shotboard…' can spin forever. `loading = !!mirror && !!boardId && String(loadQuery?.board?._id ?? '') !== boardId`, and api.shotboards.load returns `{ board: null }` when the user is unauthenticated or the board no longer exists (convex/shotboards.ts load). Opening `/admin/shotboard?board=<deleted or unauthorised id>`, a link ScriptTemplatePicker.tsx:128 generates, shows the plain-text loading card (ShotboardPage.tsx:297-303) indefinitely, with no error or recovery. 'New board' calls `void sb.createBoard(...)` with no catch (ShotboardPage.tsx:214), so an auth failure is a silent unhandled rejection.
- **[medium] [a11y]** `dashboard/components/shotboard/SceneSection.tsx:56` — [verified: code] The scene's selection handler is on the outer div (:56), but both the header (:58) and the shots row (:95) call stopPropagation. The only click targets that select a scene are the 12px p-3 padding and the mb-3 gap. Editing a shot or the scene title does not select that scene in the sidebar, so the sidebar can show Scene 1's fields while you work in Scene 4. The clickable div also has no role, tabIndex, or key handler, so keyboard users cannot select a scene.
- **[medium] [copy]** `dashboard/components/shotboard/ShotCard.tsx:41` — [verified: code] The shot has four prompt fields and the UI shows neither which one is used nor its lineage.
- The main textarea shows `expandedPrompt || promptIdea` (:41). Typing into an expanded prompt writes the whole expanded text into promptIdea and clears the expansion (:48), so the original idea is lost.
- visualPrompt, hidden under 'Details', silently beats the visible promptIdea for generation (ShotboardPage.tsx:91: `expandedPrompt || visualPrompt || promptIdea`).
- directorPrompt is never shown anywhere, yet it takes precedence in compilation (shotboardCompiler.ts:40, convex/director.ts:43).
- There is no badge (idea / visual / GMI / director) and no stale-revision indicator on the card.
- **[medium] [states]** `dashboard/components/shotboard/ShotboardPage.tsx:130` — [plausible: code reasoning] A per-shot 'Expand' can fail as stale right after typing. It sends `sourceRevision = sb.board?.revision` from local state. Every non-derived patchShot increments the server revision (convex/shotboards.ts patchShot), but local re-hydration is blocked while writes are pending (useShotboard.ts:172). Clicking 'Expand' within a round-trip of the last keystroke therefore makes the server throw 'Prompt is stale; reload the shot before expanding', which surfaces only in the top status line. The Send-to-Director path calls flush() first (:238); the per-shot path does not.
- **[medium] [states]** `dashboard/components/shotboard/ShotboardPage.tsx:243` — [verified: code] 'Send to Director' re-expands every stale shot two at a time. Each expansion is a 4-call GMI pipeline with up to a 180s deadline (convex/promptExpansion.ts:84-93), so a 20-shot board can take several minutes. The only feedback is the button label 'Preparing…' (:268): no per-shot progress, no count, no cancel, no retry of individual failures. The amber 'N shots need Director expansion before transfer.' (:288) appears on every new board in a normal state, so it reads as a constant warning (alarm fatigue).
- **[medium] [copy]** `dashboard/components/shotboard/ShotboardPage.tsx:287` — [verified: code] The header's 'N beats · Ns runtime' preview comes from compileShotsToBeats (lib/shotboardCompiler.ts:71), which disagrees with what the Director receives from convex/director.ts:34-50. The server context line omits the shot-type label, `elements`, and `cameraEnvironment`. The server loads only board-scoped characters (`by_board` eq boardId, director.ts:24), so shared library characters such as @coast are dropped from 'Featuring …'. A third compile path, ScriptTemplatePicker.tsx:87, calls compileShotsToBeats without locations or style. Any new 'script preview' UI built on the client compiler will not match the real transfer unless it is labelled as approximate.
- **[medium] [color]** `dashboard/tailwind.config.js:27` — [verified: compiled CSS + flattenColorPalette] The accent colour system is incoherent.
- The flat 'fal-primary' chrome blue (#4f83cc, commented 'wzrd.tech chrome blue') is shadowed by the nested `fal.primary` violet (:74-79). flattenColorPalette's Object.assign lets the later key win, and `.border-fal-primary-500` compiles to rgb(109 40 217).
- The shotboard also hard-codes #7c3aed (SceneGallery.tsx:43), #a78bfa (SceneSection.tsx:69, ShotCard.tsx:169) and an 8-colour rainbow PALETTE (CharacterPanel.tsx:10).
- The Dither wave is chrome blue (DitherBackground.tsx:28).
- Errors use amber: amber-600 on white is 3.19:1, which fails AA for text-xs.
- **[medium] [performance]** `dashboard/components/shotboard/ShotCard.tsx:169` — [verified: code] A GSAP-driven AccordionGallery (timeline, ResizeObserver, 3D tilt) is mounted inside every ShotCard's <details>, and another inside every scene's location <details> (SceneSection.tsx:69). React renders a closed <details>'s children, so a 30-shot board runs 30+ galleries. Their `key` includes the assigned ids, so every toggle remounts the gallery. In a 256px card with many characters the panels become slivers. The gallery looks single-select (one active panel) but behaves as a multi-toggle, and it has no visual indicator of which characters are assigned.
- **[medium] [states]** `dashboard/components/shotboard/SceneGallery.tsx:41` — [verified: code] The SceneGallery strip uses `trigger="hover"`, and AccordionGallery has no mouseleave reset (AccordionGallery.jsx:160-162). After a hover, the expanded panel no longer matches the selected scene. `key={items.map(id).join(',')}` (:36) remounts and re-animates the whole strip on every add, remove, or reorder. Because the image uses `s.keyframeUrl ?? firstImage ?? ''` (:23), a keyframe cleared to '' via AssetUrlInput's Clear shows a blank panel even when shots have images (?? does not fall back on an empty string). With many scenes the panels become slivers. With no images the strip is a row of near-black #0a0713 bars.
- **[medium] [states]** `dashboard/components/shotboard/ShotboardPage.tsx:224` — [verified: code] The board style cannot be cleared. Choosing 'Board style…' calls `patchBoard({ styleId: undefined })`, and pickDefined (useShotboard.ts:60-67, :218) drops undefined values, so no mutation is sent. The UI clears locally, then snaps back to the old style on the next re-hydration. Likewise, the library-location picker (SceneSection.tsx:69) has no 'None' option once a location is set. Both need an explicit clear path; the backend may need a sentinel or dedicated clear mutation, which should be flagged.
- **[medium] [states]** `dashboard/components/shotboard/useShotboard.ts:280` — [verified: code] Add shot, scene, and character are not optimistic in Convex mode. The item appears only after the mutation resolves (:237-239, :284-286, :336-338), and nothing shows pending in the meantime. shotNumber and order are computed from the current closure state, so a quick double-click on 'Add shot' creates two shots with the same 'Shot N' label.
- **[medium] [a11y]** `dashboard/components/shotboard/ShotCard.tsx:49` — [verified: code] The @mention autocomplete is fragile and inaccessible.
- It only matches `@…` at the very end of the text, not at the caret (:49).
- It has no arrow-key or Enter navigation, and no combobox, listbox, or aria-activedescendant roles.
- It closes on blur via `setTimeout(…,120)` (:139).
- The handle sigils disagree: CharacterPanel uses placeholder '$HANDLE' and the title 'Prompt anchor (e.g. $COAST)' (CharacterPanel.tsx:88-89); the library normalises handles to lowercase `coast` shown as `@coast` (CharacterLibraryPage.tsx:153); ShotCard inserts `@${handle}`. A handle typed as '$COAST' becomes '@$COAST', which the mention regex `[a-z0-9_-]` can never match. The shotboard also lets you edit shared library characters' name and handle without the library's sanitisation.
- **[medium] [responsive]** `dashboard/app/layout.tsx:63` — [verified: code; opinion on impact] The editor is constrained to `max-w-7xl` and a 280px form sidebar (ShotboardPage.tsx:304). Below lg the sidebar stacks above everything, so the board title, description, four scene sections, and a 420px character grid come before the first shot. That is roughly 900px or more of forms before any storyboard content on tablets. A storyboard canvas should be full-bleed, with the forms in a contextual inspector.
- **[medium] [a11y]** `dashboard/components/shotboard/ShotCard.tsx:113` — [verified: code] Many controls lack accessible names.
- The shot-type <select> (:113) has no label.
- The duration input (:125) has only a title.
- The scene title input (SceneSection.tsx:62-68) has only a placeholder.
- The board select (ShotboardPage.tsx:197-211) and both ImageModelSelect selects (ImageModelSelect.tsx:25, :38) rely on title only.
- The board title and description (SceneSidebar.tsx:53-66) are placeholder-only.
- The location <details> summary has no label context.
- The generated keyframe has `alt=""` (ShotCard.tsx:90) although it is the primary content.
- Icon buttons are p-1 around a 14px icon, about 22px square, below the 24px WCAG 2.2 target size.
- **[low] [typography]** `dashboard/components/shotboard/ShotCard.tsx:71` — [verified] Type is too small and too light. There are 14 uses of `text-[10px]` (12 in ShotCard, 2 in SceneSidebar), and the body defaults to Focal Light 300 (globals.css:73). Grey-400 micro-labels ('Shot N', 'Details', 'Undo expansion', the 's' unit) measure 2.54:1 on white, failing AA. Because tailwind.config.js:121-128 remaps font-bold and font-semibold to 500, the scene-number badge and card titles have almost no weight contrast.
- **[low] [states]** `dashboard/components/shotboard/useShotboard.ts:409` — [verified: code] The board selection is not kept in the URL. `?board=` is read only as the initial state (:409); selectBoard (:181-194) never updates the URL, so a refresh or shared link drops the selection. The '<option value="">New / unsaved board</option>' (ShotboardPage.tsx:204) does not create anything; it just returns to the empty state. 'New board' creates 'Untitled Shotboard' immediately without asking for a name, so the saved-board list fills with duplicate untitled boards. There is also no board aspect-ratio control, even though patchBoard supports aspectRatio and gptImageSize maps 16:9, 9:16, and 1:1 (imageModels.ts:85-95). The board's soundtrack fields have no UI.
- **[low] [states]** `dashboard/lib/imageGen.ts:36` — [verified: code] `fal.subscribe(endpoint, { input })` is called without `onQueueUpdate` or logs, so the UI cannot show queue position, IN_PROGRESS, or elapsed time. generateImages supports 1–4 variations (imageModels.ts:116), but the shotboard only ever uses the single-image generateImage wrapper, so there is no pick-the-best-take flow.
- **[low] [code-structure]** `dashboard/components/shotboard/SceneSection.tsx:69` — [verified: code] Code structure blocks redesign.
- SceneSection.tsx:69 is a 1,082-character JSX line and ShotCard.tsx:169 is 1,407 characters.
- A 27-line async transfer pipeline is written inline in an onClick (ShotboardPage.tsx:236-262).
- Field and select class strings are duplicated in 4 files (SceneSidebar.tsx:8, CharacterPanel.tsx:12, ShotCard.tsx:10, ImageModelSelect.tsx:4).
- Vendored React Bits components are imported under `@ts-ignore` (SceneGallery.tsx:4, CharacterPanel.tsx:5).
- There are no data-testid hooks anywhere on the surface and no tests.

## Redesign opportunities
### Full-bleed three-pane edit layout: slate bar, scene rail, canvas, inspector (transformative) — CSV: Gradual Blur, Line Sidebar, Dock
Break this route out of `max-w-7xl`, for example with a route-scoped wrapper `w-screen relative left-1/2 -translate-x-1/2 px-4 lg:px-6`, or a layout variant that keeps the global header and Dither. Structure the page as four regions.

1. A sticky 56px 'slate bar' built on glass: `bg-[#0a0d14]/70 backdrop-blur-md border-b border-white/[0.06]`. Left: an inline-editable board title as the H1, in Focal 500 at 20px, with a mono save indicator ('Saved', 'Saving…', or 'Unsynced — retry'). Centre: a view switcher (Board / Contact sheet / Timeline / Animatic), a segmented aspect-ratio control (16:9 / 9:16 / 1:1, wired to patchBoard({aspectRatio})), and a style chip. Right: a model-and-quality popover, a runtime counter (for example '02:16 · 17 beats'), and the primary 'Send to Director' CTA as the only filled button on the page.
2. A 240px left 'Scene rail' replacing SceneGallery and the scene half of SceneSidebar. Each entry is a vertical row with a 64×36 keyframe thumbnail, a mono 'SC 02' slate label, the title, shot count, duration, and a drag handle. It uses listbox semantics with an aria-selected row.
3. A centre canvas that stays scrollable. The dither is visible in the gutters because the scene containers are translucent (`bg-white/[0.02]`, not opaque fal-cards).
4. A 380px right inspector drawer that slides in on selection. For a scene it shows description, location, time, weather, atmosphere, elements, camera, and keyframe. For a shot it shows the prompt stack, characters, dialogue, SFX, audio, keyframe URL, and model override.

Selection becomes one state object, `{kind: 'scene' | 'shot', id}`. Clicking a shot also selects its scene, which fixes the padding-only selection bug. Sync `?board=&shot=` with router.replace. Keyboard: J/K previous/next shot, Enter opens the inspector, G generates, E expands, ⌫ deletes with undo, Esc closes the drawer. Below lg, the inspector becomes a bottom sheet and the rail becomes a horizontal chip scroller. Use semantic tokens in globals.css (`--sb-surface`, `--sb-frame`, `--sb-accent` set to chrome blue #4f83cc to match the Dither, `--sb-ink`, `--sb-muted`) and do not rely on the ambiguous fal-primary.

### Film-strip shot cards (frames) (transformative) — CSV: Border Glow, Glare Hover, Spotlight Card
Replace the 256px form card with an image-first ShotFrame.
- The frame uses the board aspect (`aspect-video`, `aspect-[9/16]` or `aspect-square`) so generations are never cropped.
- It sits on a black film base with sprocket rails: 8px strips top and bottom drawn by CSS `background: radial-gradient(circle, transparent 2px, #000 2.5px) 0 0 / 12px 8px repeat-x` or a hand-authored /public/shotboard/sprocket.svg.
- Overlays: top-left, a mono slate 'SC02 · SH03' in JetBrains Mono 11px with tabular-nums. Top-right, a shot-type abbreviation pill derived from SHOT_TYPE_OPTIONS (WS, MS, CU, ECU, EST, POV, OTS, AER, LOW, HIGH, DUTCH, TRK, INS; the full label goes in a tooltip). Bottom-left, a duration timecode '00:08'. Bottom-right, stacked 20px character avatars (portrait, or a DitherAvatar fallback imported from components/dither-kit/avatar.tsx without editing it).
- Under the frame: a 2-line clamped prompt at text-[13px] with leading-5, plus a prompt-source badge (IDEA / VISUAL / GMI / DIR) and a stale dot when `directorPromptRevision !== board.revision`.
- Hover or focus shows a floating mini-toolbar: Generate, Expand, Duplicate, Model chip, More. Keep the existing aria-labels 'Move shot earlier', 'Move shot later' and 'Delete shot' on equivalent buttons.
- States on the frame itself: empty (dashed frame with a centred '+ Generate' and the shot number as a large ghost numeral); generating (see the shimmer opportunity); failed (red corner notch, 'Failed — Retry' button, message in a tooltip, driven by persisted imageStatus === 'failed'); completed; selected (2px `--sb-accent` ring plus a subtle BorderGlow).
- All remaining fields move to the inspector. Card width is 240px on the Board view. In Timeline view, width is proportional to duration (1s = 20px, minimum 120px).

### Dither-scan generation shimmer and 'develop' reveal (high) — CSV: Pixel Transition, Ghosty reveal, Halftone Reveal, Decrypted Text, Text Type, Scanner, Noise
Replace the `bg-black/50` overlay and spinning Loader2 (ShotCard.tsx:94-98), and the spinner-only buttons in SceneSidebar and CharacterPanel, with a CSS-only ordered-dither shimmer that echoes the global Dither wave.

While generating:
- At module load, render the BAYER4 matrix (import it from components/dither-kit/pixel.ts; do not edit that file) once into a 4×4 data-URL tile, scaled 3× with `image-rendering: pixelated` and tinted chrome blue.
- Animate a `mask-image: linear-gradient(90deg, transparent, #000 40%, transparent)` sweep across the frame, 1.6s linear infinite. Over the last take (if any), apply `filter: grayscale(1) contrast(1.2) brightness(.6)`.
- Show a mono readout: 'NANO BANANA 2 · 00:14 · queue 3', with queue position from `fal.subscribe(..., { logs: true, onQueueUpdate })`. Add this through an optional `onProgress` callback in lib/imageGen.ts that is backward-compatible with generateImage.

On completion, 'develop' the image: a 500ms reveal where a Bayer-threshold mask expands from 0 to 1, with a brief contrast/saturation overshoot, like a Polaroid developing. Pixel Transition, Arlan's Ghosty reveal, or Halftone Reveal are the reference looks; implement in CSS or canvas2D.

Rules:
- No per-card WebGL. The global Dither already holds one WebGL context, and browsers cap live contexts at around 16.
- `prefers-reduced-motion` gets a static dither tile and a 150ms crossfade.
- A persisted `imageStatus === 'generating'` with no local job shows 'Interrupted — Retry'.

For GMI expansion, add a 3-step indicator: 'Brief → Visual + Continuity → Synthesis'. The backend only records reserved, completed and failed, so drive it by elapsed time and label it approximate. When the expanded prompt arrives, resolve it in with Decrypted Text or Text Type (about 400ms, capped, skipped under reduced motion).

### Drag-and-drop reordering within and across scenes (high) — CSV: Animated List
Within a scene, use `Reorder.Group axis="x"` and `Reorder.Item` from `motion/react`; this is already installed and verified exported in motion 13.2.0. On drop, call the existing moveShot/setShotOrder path through a new additive hook method `reorderShots(sceneId, orderedIds)`. Reorder scenes in the scene rail with `Reorder.Group axis="y"` and a new `reorderScenes(ids)` that generalises the existing renumbering in moveScene (useShotboard.ts:262-276).

The backend already supports cross-scene moves: setShotOrder patches `sceneId` on every listed shot (convex/shotboards.ts setShotOrder). Add `moveShotTo(shotId, targetSceneId, index)`, which calls setShotOrder for the target scene and again to renumber the source scene. Reorder is single-axis and single-container, so cross-scene moves and the contact-sheet grid need either a small custom pointer-events DnD or @dnd-kit/core + @dnd-kit/sortable. The latter is a new dependency and should be flagged.

Visuals: the lifted card scales to 1.03 and rotates 1.5°, with shadow `0 24px 48px -12px rgb(0 0 0 / .6)`. The drop target is a 2px `--sb-accent` insertion bar. Siblings reflow with motion layout animations over 200ms.

Keyboard DnD: Space picks up, arrows move, Space drops, Esc cancels. Announce moves through an aria-live='polite' region, for example 'Shot 3 moved to position 1 in Scene 2'. Keep the arrow buttons with their exact aria-labels as a fallback.

### Contact sheet, Timeline, and Animatic views (transformative) — CSV: Split Flap Text, Count Up, Counter, Masonry
Add view modes to the slate bar. None need new API calls.
- Contact sheet: a dense grid of every frame across the board, `grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2`. Scenes are separated by full-width slate dividers ('SCENE 02 — Dolores Park · 4 shots · 00:32'), with mono exposure numbers under each frame, like a darkroom proof sheet. Shift or Cmd-click multi-selects, and a floating selection bar offers batch Generate, batch Expand, and 'Send selected to Director'. api.director.prepare already accepts `shotIds` (convex/director.ts:12); today the UI never passes them.
- Timeline: a horizontal track where frame widths are proportional to duration. It has a seconds ruler, scene bands, audio markers where shot.audioUrl is set, dialogue captions, and beat ticks from compileShotsToBeats (labelled 'preview').
- Animatic: a full-screen player that cycles frames at their durations with dialogue as lower-third captions. Controls: Space play/pause, ←/→ step, and a scrub bar with mono timecode. Use Split Flap Text or Count Up for the running timecode.
- The Board view (the default) keeps scene reels.

Persist the chosen view per viewer in localStorage behind try/catch.

### Prompt lineage inspector and accessible mention combobox (high) — CSV: Text Type
In the shot inspector, show the four prompt layers as a vertical stack of cards, each with a label, revision badge, and status.
1. Idea (promptIdea): editable, the main input.
2. Visual override (visualPrompt): editable, collapsed by default, and marked 'overrides Idea for images' when set.
3. GMI expansion (expandedPrompt): read-only. Actions: 'Use as idea' (copies into the idea field explicitly, instead of the destructive in-place overwrite at ShotCard.tsx:48), 'Discard' (the current 'Undo expansion'), and 'Re-expand'. It shows a word-level diff against the idea and a 'rev 12 · current' or 'stale' badge from expandedPromptRevision.
4. Director (directorPrompt): read-only, with a stale badge when directorPromptRevision !== board.revision. Today this field is never shown.

A pinned pill, 'Images generate from: GMI expansion', is computed by a new shared helper `activeImagePrompt(shot)` in lib, using the precedence at ShotboardPage.tsx:91, so the display matches what is generated.

Flush pending writes before calling expand, to avoid the stale-revision race.

Rebuild @mentions as an ARIA 1.2 combobox: role=combobox on the textarea, a role=listbox popover with aria-activedescendant, caret-position detection (selectionStart), ↑/↓/Enter/Tab/Esc handling, 24px portrait thumbnails, and a 'Library' badge for shared characters. Normalise to the library convention (lowercase `[a-z0-9_-]`, shown as `@coast`) and replace the '$HANDLE' / '$COAST' copy.

### 'Send to Director' as a progress sheet with pre-flight checks (high) — CSV: Stepper, Animated List, Count Up
Move the inline onClick at ShotboardPage.tsx:236-262 into a `useDirectorTransfer` hook and a right-side sheet.

Pre-flight checklist, each item with a ✓ or ⚠ row:
- all edits saved (flush() result);
- first frame present;
- N shots missing images, each with a jump link;
- N shots need Director expansion;
- total runtime and beat count, labelled 'estimate', because the server compiler in convex/director.ts differs.

Clicking 'Prepare' shows an animated per-shot list (queued, expanding, done, failed), processed 2 at a time as the server's concurrency cap requires. Show an overall progress bar and a Count Up of completed shots. 'Cancel' stops issuing new batches; 'Retry failed' re-runs only the failures. Then call prepare, show 'Transfer ready ✓' briefly, and `router.push('/admin?transfer=<id>')`.

Replace the permanent amber 'need Director expansion' banner with a neutral slate-bar counter chip, for example 'DIR 4/12'.

### Branded loading and empty states with generated Coast assets (high) — CSV: Fade Content, Animated Content, Shiny Text, Decrypted Text
Loading: replace 'Loading shotboard…' with a skeleton of the three-pane layout (a rail with 4 rows; 2 reels of 4 frames, each running the dither shimmer), plus an optional 96px Coast clapperboard loop in the slate bar.

Distinct terminal states replace the infinite spinner:
- 'Sign in to load saved shotboards' when unauthenticated;
- 'This board no longer exists' with a 'Back to boards' link when load returns board:null for a valid id;
- a network/error card with Retry.

Empty (no board): a hero with a Coast illustration and CTAs 'New board', which opens a title dialog instead of creating 'Untitled Shotboard' immediately, and 'Open saved board'. Empty scene: a dashed film frame with sprockets and '+ Add first shot'. Empty frame: a large ghost shot numeral over a dithered placeholder.

Asset plan, all generated with the Coast character sheet as the identity reference:
- /public/shotboard/empty-coast-clapper.png: 1536×1024, transparent background. GPT Image 2.5 Sunburst /edit (openai/gpt-image-2.5/sunburst/edit), quality high. Prompt: Coast holding a film clapperboard, 4-level ordered-dither shading, chrome-blue #4f83cc rim light, on transparent.
- /public/shotboard/frame-placeholder-{16x9,9x16,1x1}.png: Sunburst text-to-image, neutral dithered film-base texture, no character.
- /public/shotboard/loader-coast-slate.webm plus a .mp4 fallback and a poster .png: MiniMax H3 Max image-to-video from the clapper still. A 2s seamless loop of Coast snapping the clapper, 512×512, under 400KB, `muted playsInline loop autoPlay`; under reduced motion show the poster only.
- /public/shotboard/sprocket.svg: hand-authored, not generated.

### Cast strip replacing the clipped ChromaGrid, with safe character semantics (medium) — CSV: Chroma Grid, Profile Card, Dock
Replace CharacterPanel's 320px ChromaGrid in the 280px sidebar with a 'Cast' row in the slate bar or at the top of the scene rail: 36px circular portraits with a 2px ring when used in the selected shot, `@handle` in mono beneath, and a DitherAvatar fallback when there is no portrait.
- Shared library characters (boardId undefined, e.g. @coast) get a 'Library' badge. They are read-only here, with 'Edit in Characters →' linking to /admin/characters, and they have no Delete; at most 'Hide from this board'.
- Board-local characters open an inspector editor with the existing fields.
- Tag a character by dragging a portrait onto a frame, or with the inspector's multi-select chips. This replaces the per-card AccordionGallery.
- ChromaGrid can still appear in a full-width 'Cast' drawer where 320px cards fit, if the flourish is wanted.
- 'Generate portrait' on a library character must confirm before overwriting the canonical library image.

### Undo toasts, confirmations, take history, and a save indicator (medium) — CSV: Animated List
Add a small toast system (bottom-centre, glass surface, aria-live='polite'):
- Deleting a shot or scene shows 'Shot 3 deleted · Undo' for 8s. Undo re-creates the item from a cached snapshot via createShot/createScene and restores its order.
- Delete board uses a confirm dialog that requires typing the board title.
- Each shot keeps a session-local take history of previous imageUrls. There is no schema field for this, so keep it client-side or flag a backend addition. It appears as a filmstrip of thumbnails in the inspector with 'Use this take' (patchShot imageUrl).
- Add a 'Fresh composition' toggle on Regenerate that leaves out the previous take from refs, which currently always starts ShotboardPage.tsx:99.
- Show trackWrite failures in the slate-bar save indicator ('Unsynced changes — Retry'), since today they are swallowed at useShotboard.ts:148.

## States inventory
Each state below is verified by code reading; none were rendered.

- CONVEX NOT CONFIGURED (local mode): ShotboardPage.tsx:23-28 routes to LocalShotboard. The header shows amber text-xs "Convex not configured — this board lives only in this page’s state and cannot be sent to Director." (:291-293). The board select, Send to Director, and Delete board are hidden (:197, :233, :271). "Expand" stays enabled; clicking it sets the top status "Prompt expansion requires an authenticated Convex connection" (:125).
- NO BOARD SELECTED (empty): plain grey text-xs fal-card "Create a board or pick a saved one to start laying out scenes and shots." (:368-374), with no CTA inside the card.
- LOADING: fal-card with plain text "Loading shotboard…" (:297-303). No skeleton. It never resolves when unauthenticated or when the board is unknown or deleted, because `loading` is derived from a board-id match (useShotboard.ts:373) and load returns {board:null}.
- BOARD WITH ZERO SCENES: SceneGallery returns null (SceneGallery.tsx:32). Only the secondary "Add scene" button remains (ShotboardPage.tsx:358-365). The sidebar shows "Select a scene to edit its details." (SceneSidebar.tsx:69-70).
- SCENE WITH ZERO SHOTS: dashed w-40 h-32 "First shot" button with a Plus icon (SceneSection.tsx:110-119).
- NO CHARACTERS: text "No characters yet — add one, generate its portrait, then tag it on shots." (CharacterPanel.tsx:64-67).
- NO LIBRARY LOCATIONS: the location picker is hidden entirely (SceneSection.tsx:69 `locations.length > 0`). No styles: the style select is hidden (ShotboardPage.tsx:221).
- SHOT WITHOUT IMAGE: ImagePlus icon centred in a dashed grey h-32 well (ShotCard.tsx:87-93). The button reads "Generate image".
- SHOT GENERATING: absolute `bg-black/50` overlay with a white spinning Loader2 (ShotCard.tsx:94-98). The button is disabled at opacity-50 and reads "Generating…" (:100-110). imageStatus:'generating' is persisted (ShotboardPage.tsx:102) but never read back; the local Set is lost on reload.
- SHOT GENERATION FAILED: imageStatus:'failed' is persisted (ShotboardPage.tsx:115). Nothing changes on the card. The top amber status reads "Image generation failed: <msg>" (:116, :290).
- SHOT HAS NO PROMPT: top status "Give the shot a prompt or direction first" (:93).
- EXPANDING (GMI): the pill reads "Expanding…" and is disabled (ShotCard.tsx:157-161). It is also disabled when the prompt is empty, with no explanation. On failure the top status reads "Prompt expansion failed: <msg>" (ShotboardPage.tsx:135), which includes the server's stale-revision error.
- EXPANDED: the textarea shows expandedPrompt, and an "Undo expansion" grey-400 10px link appears (ShotCard.tsx:163-165). There is no badge distinguishing an expanded prompt from the raw idea.
- MENTION MENU: an absolute dropdown lists up to 6 matches, or red 10px "Unknown character handle" (ShotCard.tsx:145-153).
- SCENE KEYFRAME GENERATING: the sidebar button shows a spinner and "Generating…" and is disabled (SceneSidebar.tsx:84-93). The gallery strip shows no in-progress state. On failure: "Keyframe generation failed: …" (ShotboardPage.tsx:160). With no description: "Add a scene description first" (:144).
- PORTRAIT GENERATING: the CharacterPanel button shows a spinner and "Generating…" (CharacterPanel.tsx:108-116). On failure: "Portrait generation failed: …" (ShotboardPage.tsx:181).
- DIRECTOR STALE COUNT: amber "N shot(s) need Director expansion before transfer." (:288). It is always present on new boards.
- PREPARING TRANSFER: the button reads "Preparing…" and is disabled (:263, :268). It is also disabled while loading, with no board, or when revision is null. On failure: "Could not prepare Director transfer: <msg>" (:261). On success it navigates to /admin?transfer=<id> (:260) with no success feedback.
- UPLOADING (AssetUrlInput): the "Upload" button shows a spinner, inputs are disabled, and a red text-xs upload error appears (AssetUrlInput.tsx:64-72, :89). The image kind shows an h-12 thumbnail preview (:85-88).
- SAVE/SYNC: no indicator exists. Optimistic write failures are swallowed (useShotboard.ts:148) and surface only during Send to Director's flush.
- DISABLED: always rendered as opacity-50 only (fal-button-* uses disabled:opacity-50 disabled:pointer-events-none, globals.css:199-205).
- There are no offline, live, or realtime-presence states. Changes from other tabs are pulled in only on revision change when no writes are pending (useShotboard.ts:164-179).

## Invariants
- Keep the global DitherBackground (components/DitherBackground.tsx) mounted and visible. Do not add opaque full-page backgrounds over it, and do not create per-card WebGL contexts: the Dither and MorphSlider already use THREE.WebGLRenderer.
- Do not edit components/dither-kit/* (dither-kit.json lockfile hashes). Import from it (e.g. BAYER4 from pixel.ts, DitherAvatar from avatar.tsx) without modifying it.
- app/admin/shotboard/page.tsx must stay a client route that wraps the editor in <Suspense>, because ShotboardPage reads useSearchParams.
- Keep the Convex/local split: ShotboardPage renders the Convex variant only when useConvexEnabled() is true (ShotboardPage.tsx:23-28). Convex hooks must never mount without the provider. Local mode must remain fully usable with no NEXT_PUBLIC_CONVEX_URL and no FAL_KEY, because the admin-testing skill tests unconfigured states and must not spend FAL credits. Keep the copy 'Convex not configured — this board lives only in this page’s state and cannot be sent to Director.' or an equivalent.
- `?board=<id>` deep link: ScriptTemplatePicker.tsx:128 links to `/admin/shotboard?board=${templateId}` and ShotboardPage passes `params.get('board')` as the initial board. This must keep working; adding URL sync is fine.
- Director handoff: after api.director.prepare, navigate with `router.push(`/admin?transfer=${transferId}`)` (ShotboardPage.tsx:260). ScriptTemplatePicker.tsx:50 reads the `transfer` param and applies the transfer's beats and firstFrameUrl.
- Transfer pipeline order and contracts:
1. sb.flush().
2. For shots where `!directorPrompt?.trim() || directorPromptRevision !== board.revision`, call expandPrompt with kind 'director', a requestId of `director-${shot.id}-${Date.now()}` (8-128 chars), sourceRevision = board.revision, and shotId.
3. Run at most 2 concurrently; the server rejects a 3rd with 'Two prompt-expansion jobs are already running'.
4. patchShot {directorPrompt, directorPromptRevision}, then flush() again.
5. prepareDirector({ boardId, expectedRevision: board.revision }).
- Image expansion contract: `useAction(api.promptExpansion.start)`, an alias of expand, called with kind 'image', `requestId: `${shot.id}-${Date.now()}``, sourceRevision, and shotId. The result is written as patchShot {expandedPrompt, expandedPromptRevision}. These derived-only fields must not bump the board revision (server behaviour in convex/shotboards.ts patchShot).
- Convex API surface used: api.shotboards.list, load, create, patch, remove, createScene, patchScene, removeScene, createShot, patchShot, removeShot, setShotOrder, createCharacter, patchCharacter, removeCharacter; api.promptExpansion.start; api.director.prepare; api.locations.list; api.styles.list (archived rows filtered client-side).
- Keep the patch allowlists SCENE_PATCH_KEYS, SHOT_PATCH_KEYS, CHARACTER_PATCH_KEYS and pickDefined (useShotboard.ts:56-67), because Convex rejects unknown args and undefined values. Keep the ShotboardState interface (useShotboard.ts:17-45) backward-compatible; add methods rather than renaming.
- Keep trackWrite/flush semantics: rejected writes stay visible to flush(), so a transfer cannot race ahead of an optimistic edit. Re-hydration must not clobber local state while writes are pending (useShotboard.ts:172).
- Image generation contract:
- Prompt format is `${style ? `Style: ${style.description}. ` : ''}${shotTypeLabel(shot.shotType)}: ${prompt}`.
- References are [shot.imageUrl, scene.keyframeUrl, location.imageUrl, ...tagged character imageUrls], with at most 14 (MAX_ASSET_REFERENCES).
- Aspect ratio is board.aspectRatio, default '16:9'.
- Quality comes from the toolbar.
- Persist imageStatus 'generating' → 'completed' (with imageUrl and imageModel) or 'failed'.
- All fal traffic must go through FAL_SDK_PROXY_URL (lib/imageGen.ts, AssetUrlInput) so FAL_KEY stays server-side.
- Compiler semantics used by the Director (lib/shotboardCompiler.ts, convex/director.ts): shot order is (sceneNumber, order ?? shotNumber); duration is an integer ≥ 1 with default 8 (DEFAULT_SHOT_SECONDS); the first shot's image is the opening frame (firstFrameUrl); later images are end-images at the end of their own shot. Reorder UIs must keep writing both `order` and `shotNumber` (setShotOrder does) and keep sceneNumber contiguous (moveScene renumbers).
- Adding an @mention must also add the character to shot.characterIds (ShotCard.tsx insertMention). Toggling a character chip calls toggleShotCharacter.
- aria-labels to preserve or carry over: 'Board visual style', 'Delete board', 'Move scene up', 'Move scene down', 'Delete scene', 'Move shot earlier', 'Move shot later', 'Delete shot', `Image prompt for shot ${shot.shotNumber}`, 'Delete character', 'Remove element', 'Clear' (AssetUrlInput), 'Image accordion gallery' (AccordionGallery role=list, if still used), and AdminNav `aria-label="Admin sections"` with the tab label 'Shotboard' at href '/admin/shotboard'.
- title attributes and tooltips that carry meaning: 'Saved shotboards', 'Board visual style', "Load this board's compiled script in the Director", 'Expand this prompt with GMI', 'Shot duration in seconds (drives the beat offset)', 'Image model used for generation', 'GPT Image 2.5 quality — higher = more detail, slower, pricier'. The 'Prompt anchor (e.g. $COAST)' tooltip should be corrected to the @coast convention rather than kept.
- User-facing strings referenced by flows (keep them, or update them consistently): 'Shotboard', 'New board', 'Send to Director', 'Preparing…', 'Add scene', 'Add shot', 'First shot', 'Generate image', 'Regenerate image', 'Generating…', 'Expand', 'Expanding…', 'Undo expansion', 'Generate keyframe', 'Generate portrait', 'Regenerate portrait', 'Loading shotboard…', 'Unknown character handle', '{n} beats · {s}s runtime', and the error prefixes 'Image generation failed: ', 'Prompt expansion failed: ', 'Keyframe generation failed: ', 'Portrait generation failed: ', 'Could not prepare Director transfer: '. No data-testids exist today, so adding stable data-testids (e.g. shot-frame, scene-rail-item, send-to-director) is encouraged.
- Admin-testing expectations: page loads must produce no new console errors or warnings (the skill expects only the React DevTools info message). No redesign code path may call a paid fal or GMI endpoint on mount; generation stays behind explicit user actions.
- The vendored React Bits components AccordionGallery and ChromaGrid are also used by CharacterLibraryPage, LocationLibraryPage and AssetStudioVisualFixture. Do not change their defaults or CSS globally; wrap them, or stop using them on the shotboard.
- Changing `fal-primary` in tailwind.config.js recolours every admin page, since it currently compiles to violet #6d28d9. Introduce scoped semantic tokens for the shotboard, or coordinate the change across all surfaces.

## Refactor notes
[verified] Structural hot spots:
- ShotboardPage.tsx (377 lines) mixes route gating, all generation orchestration (generateShotImage :90-120, expandShotPrompt :122-136, generateSceneKeyframe :138-164, generateCharacterPortrait :166-185), a 27-line async transfer pipeline written inline in an onClick (:236-262), and all layout.
- There are two mega JSX lines: SceneSection.tsx:69 (1,082 characters: the location <details> popover and AccordionGallery) and ShotCard.tsx:169 (1,407 characters: the character chips and <details> gallery).
- fieldClass/selectClass strings are duplicated in SceneSidebar.tsx:8, CharacterPanel.tsx:12, ShotCard.tsx:10 and ImageModelSelect.tsx:4.
- Vendored React Bits components are imported under `@ts-ignore`.
- Prompt precedence is re-implemented in four places: ShotboardPage.tsx:91, shotboardCompiler.ts:40, the Send-to-Director source selection at ShotboardPage.tsx:248-250, and convex/director.ts:43.

Safe split plan. Each step keeps the ShotboardState API and the Convex calls unchanged.
1. Keep ShotboardPage.tsx as the gate only (ConvexShotboard/LocalShotboard) and move ShotboardView into ShotboardView.tsx. Props stay the same (sb, expandPrompt, prepareDirector, locations, styles).
2. Extract hooks:
   - `useShotGeneration(sb, {styles, locations, board})` returns generateShot, generateSceneKeyframe, generatePortrait, and a per-id job map `{phase: 'queued'|'running'|'done'|'failed', startedAt, queuePosition?, error?}`. This replaces the bare `generating` Set and the single `status` string. It reads persisted imageStatus to detect interrupted jobs.
   - `usePromptExpansion` wraps expand and awaits `sb.flush()` before reading board.revision.
   - `useDirectorTransfer` runs the flush → batched director expansion → prepare → push pipeline, exposing per-shot progress, cancel and retry. It keeps batch size 2.
   - `useShotboardSelection` holds `{kind, id}` plus a multi-select set, and syncs `?board=&shot=` via router.replace.
3. Add lib/shotPrompt.ts with `activeImagePrompt(shot)`, `activeDirectorSource(shot, revision)`, and `promptLayer(shot): 'idea'|'visual'|'gmi'|'director'`, and use it in the view, generation, and client compiler. Leave convex/director.ts alone unless backend work is approved, and label client previews 'estimate'.
4. Add UI primitives under components/shotboard/ui/: Field, Select, IconButton (24px minimum target, required aria-label), Chip, Popover (replacing the ad-hoc <details> popovers), ConfirmDialog, Toast/UndoToast, SaveIndicator, and DitherShimmer (CSS-only, importing BAYER4).
5. Add feature components: SlateBar, SceneRail (replacing SceneGallery), BoardCanvas (reels), ContactSheet, TimelineView, AnimaticPlayer, ShotFrame (a pure visual, aspect-aware frame driven by board.aspectRatio), ShotInspector, SceneInspector (SceneSidebar's fields), PromptLineage, MentionCombobox (extracted from ShotCard), CharacterTagger (replacing the ShotCard.tsx:169 mega line), LocationPicker (replacing SceneSection.tsx:69), CastStrip (replacing CharacterPanel's ChromaGrid), and TransferSheet.
6. Additive methods in useShotboard.ts: reorderShots(sceneId, ids), moveShotTo(shotId, sceneId, index) (setShotOrder already writes sceneId), reorderScenes(ids), and duplicateShot(id). Make add* show a pending placeholder, or disable the triggering button until the Convex id returns. Real Convex ids are required before any patch, so temporary ids must not be sent to mutations. Compute shotNumber from the functional setState to avoid duplicate numbers.
7. Styling: define shotboard-scoped CSS variables in globals.css under :root and .dark: --sb-surface, --sb-surface-raised, --sb-frame (#000), --sb-accent (chrome blue #4f83cc to match the Dither wave), --sb-ink, --sb-muted, --sb-danger, --sb-warn. Stop using the undefined fal-primary-50 and fal-primary-300 shades. Raise the 10px micro-labels to at least 11-12px with weight 400 in Focal, and use JetBrains Mono (already loaded as --font-mono in app/layout.tsx:8) for slates, timecodes, and counters.
8. Add a dev-only visual fixture, following app/admin/visual-test (which calls notFound in production). For example, add a ShotboardVisualFixture with static scenes and shots covering every state (empty, loading skeleton, generating, failed, interrupted, stale director, expanded) so Devin can screenshot and QA without Convex or FAL credits, in line with the admin-testing skill.

Dependencies: motion 13.2.0 is installed and exports `Reorder` from 'motion/react' (verified). gsap is present. No DnD library is installed; cross-container drag needs @dnd-kit (a new dependency, to be flagged) or a small custom pointer implementation.
