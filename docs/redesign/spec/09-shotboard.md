> **Spec chapter §9 — Page: Shotboard.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 9. Page: Shotboard (`/admin/shotboard`)

Shotboard is where a show is planned before it airs. The operator lays out scenes of shots, generates a keyframe per shot and has GMI expand the prompts. The board then compiles to a script that goes to the Director through `/admin?transfer=<id>`. This section turns today's stacked CRUD form into a **sequencer** with four parts: a 48 px slate bar, a scene rail, a track canvas of image-first frames at the board aspect, and a contextual inspector. Every write path, Convex call, patch allowlist, transfer step and preserved string stays. All `path:line` references are **as of 845147c** (`git diff --stat 845147c HEAD -- dashboard` is empty). Paths are under `dashboard/` unless they start with `docs/`.

### 9.1 Goal & hero interaction

**Goal.**
- **Image-first.** Every shot is a `ShotFrame` of screen material at the board aspect (16:9, 9:16 or 1:1). A generated image is never cropped (`object-fit: contain`). A board of 3 scenes × 5 default (8 s) shots fits the canvas at 1440×900 with no scrolling in either axis:
  - Width: a lane of 5×128 + 4×8 + 24 track padding = 696 px, inside a 784 px canvas.
  - Height: toolbar 32 + 3 tracks × 168 + 3 gaps × 12 = 572 px, inside a 756 px pane.
- **Truth over theatre.** A frame shows the real fal queue state (§6.6). The save LED is driven by the hook's real in-flight and rejected writes. 'Send to Director' shows the real per-shot Director expansion, two at a time. A persisted `imageStatus: 'failed'` is rendered, which never happens today.
- **Nothing hangs, nothing is lost silently.** When `load` returns `{ board: null }`, the page shows a NOT FOUND or NO ACCESS slate, never an endless 'Loading shotboard…'. Deleting a board requires typing its title. Deleting a scene or shot shows an 8 s undo chyron. A failed write lights a danger LED.
- **Keyboard-first.** When the canvas has focus, arrows walk the shots, and Enter, G, `[`/`]` and mod+Backspace act on the selected shot (§7.12).
- **Contract-safe.** These all survive unchanged:
  - the Convex/local split and `?board=`;
  - the transfer order: flush → expand (≤2 concurrent) → patch → flush → prepare → `router.push('/admin?transfer=')`;
  - the patch allowlists and the `trackWrite`/`flush` semantics;
  - the model ids and every preserved string in §9.9.

  Only the changes listed in §9.9.4 are allowed (D6).

**Hero interaction: "walk, stretch, shoot".**
1. The operator opens a board and presses Tab until the track canvas has focus. The selected frame (SC01 · SH01) carries SelectionBrackets inside its block (no tag), and the inspector kicker reads `SC01 · SH01 · IN 00:00`.
2. → moves the selection to SH02. The brackets cut to it (no tween) and the inspector swaps to Shot 2.
3. `]` twice: the duration goes from 8 to 10 s.
   - The frame widens from 128 to 160 px and later frames shift right.
   - The seconds in the slate-bar readout `{n} beats · {s}s runtime` snap from 40s to 42s in the same React commit.
   - Each key press issues one `patchShot({ duration })`.
4. G: the frame's picture becomes a GenerationFrame.
   - The readout goes `QUEUE --`, then `Q 02`, then `00:03.2`, while the Bayer field densifies at ≤4 Hz. A 1× picture is at most 128 px wide, so the frame shows the §6.6 compact forms; a 256 px (16:9, 2×) picture shows `QUEUE 02` and `RENDER 00:03.2 · ~00:12`.
   - On completion the keyframe lands with a 160 ms `px-resolve` and a `SAVED` plate for 900 ms.
   - Focus never leaves the canvas.
5. Enter moves focus to the inspector's Idea field at ≥1280, or opens the inspector Sheet below 1280.

**Budget.**
- The width change and the readout update land in one commit (no second layout pass).
- CLS is 0 outside the edited lane.
- No `LongTask` over 50 ms per key press on a 30-shot board at 4× CPU throttle.

### 9.2 Files

`components/shotboard/` is rebuilt. Appendix B holds the global file map; this is the Shotboard slice. The work ships as four PRs, and §14 places them in its milestone:
- **9A:** hook and state changes. The old view keeps a single `role="alert"` line, fed by `useShotGeneration.errors`, `usePromptExpansion.error` and `transfer.error` (latest wins), until 9B removes it. The only visual additions are the Suspense fallback and the ShotboardSkeleton swap in `loading.tsx`.
- **9B:** layout (slate bar, rail, canvas, inspector).
- **9C:** generation frames, model chip and transfer sheet.
- **9D:** contact sheet and drag reorder (cut-able, §9.11).

**Create**

| Path | Purpose | PR |
|---|---|---|
| `components/shotboard/ShotboardView.tsx` | Composition root, moved from `ShotboardPage.tsx:47-377`. Same props plus three optional injection props and `headingLevel` (§9.5.1) | 9A |
| `components/shotboard/ShotboardBoundary.tsx` | Error boundary around `<ConvexShotboard/>` only (a malformed `?board=` makes `useQuery` throw at render) | 9A |
| `components/shotboard/layout.ts` | Geometry constants and `frameGeometry()` (§9.4.4), shared with the skeleton | 9A |
| `lib/shotPrompt.ts` | `activeImagePrompt`, `promptLayer`, `directorPromptText`, `activeDirectorSource`, `resolveModelId`, `SHOT_TYPE_ABBR` (§9.5.4) | 9A |
| `components/shotboard/directorTransfer.ts` | `runDirectorTransfer(deps)` and `transferError(e)`: the Send-to-Director pipeline, moved out of the inline `onClick` at `ShotboardPage.tsx:236-262`, as a pure async function with no React, so the Node unit specs run it directly (§9.5.3) | 9A |
| `components/shotboard/useDirectorTransfer.ts` | Wraps `runDirectorTransfer` in React state (`status`, `stage`, `rows`, `error`) (§9.5.3) | 9A |
| `components/shotboard/useShotGeneration.ts` | Shot, keyframe and portrait generation with a per-id job map, model overrides, takes and inline errors. Replaces the `generating` Set (`:52`) and the `status` string (`:55`) | 9A (logic), 9C (phases) |
| `components/shotboard/usePromptExpansion.ts` | Per-shot GMI 'image' expansion; runs `flush()` and `settled()` before it reads the revision | 9A |
| `components/shotboard/useShotboardSelection.ts` | `{ kind, id }` selection, walking, fallback on delete | 9B |
| `components/shotboard/useUndoDelete.ts` | Delete shot or scene with an 8 s undo chyron | 9B |
| `components/states/skeletons/ShotboardSkeleton.tsx` | Layout-exact skeleton (full and `.Body`), built from `layout.ts` | 9A |
| `components/shotboard/SlateBar.tsx` | `BoardTitle`, `SlateTools`, `SlateActions`, `BoardSettings`, `RuntimeReadout`, `SaveLed` | 9B |
| `components/shotboard/SceneRail.tsx` | Cast strip and scene rows (plus `Reorder.Group axis="y"` in 9D) | 9B |
| `components/shotboard/CastStrip.tsx` | Replaces `CharacterPanel`'s ChromaGrid | 9B |
| `components/shotboard/TrackCanvas.tsx` | Toolbar, keyboard walking and view switch; renders `SceneTrack`s or `ShotContactSheet` | 9B |
| `components/shotboard/SceneTrack.tsx` | Track header and lane grid (plus `Reorder.Group axis="x"` in 9D) | 9B |
| `components/shotboard/ShotFrame.tsx` | Pure visual frame: picture, hold, tag row, action cluster. Variants `track`, `sheet`, `inspector` | 9B |
| `components/shotboard/ShotContactSheet.tsx` | Contact-sheet view | 9D |
| `components/shotboard/inspector/{Inspector,ShotInspector,SceneInspector,CharacterInspector,BoardInspector,PromptLineage,ModelChip,MentionCombobox,LocationPicker}.tsx` | Contents of the inspector column or Sheet | 9B, 9C |
| `components/shotboard/TransferSheet.tsx` | Preflight, StageTrack and per-shot list | 9C |
| `components/shotboard/ShotboardVisualFixture.tsx` | Every Shotboard state from fixture data, with no Convex, no fal and no network (§9.6.3) | 9B, 9C |
| `app/styles/shotboard.css` | `.sb-*` rules in `@layer components` only (§9.4.1). Add its line to `app/globals.css` at its §5.1 position | 9B |
| `tests/shotboard.spec.ts`, `tests/unit/{shotboard-load,shot-prompt,shot-model,director-transfer,frame-geometry,shot-strings}.spec.ts` | Playwright e2e specs and runner-only unit specs (§15 harness) | 9A–9D |

**Change**

| Path | Change | PR |
|---|---|---|
| `app/admin/shotboard/page.tsx` | Keep `'use client'` and `<Suspense>`; add a `fallback` (§9.6.1) (9A). Delete the interim sr-only `<h1>` that 4B added (§14.3 R4), because `BoardTitle` renders the route's h1 (9B) | 9A, 9B |
| `app/admin/shotboard/loading.tsx` | Created in 4D with RouteSkeleton (§6.3). Replace RouteSkeleton with `ShotboardSkeleton`; the loader slot and caption stay §6.3's | 9A |
| `components/shotboard/ShotboardPage.tsx` | Gate only: `ShotboardPage` (`:23-28`), `ConvexShotboard` (`:30-37`, wrapped in `<ShotboardBoundary key={params.get('board') ?? ''}>`, so the gate adds one `useSearchParams()` read for that key, §9.6.1 S7), `LocalShotboard` (`:39-42`). The shotboard hook calls and their props are unchanged | 9A |
| `components/shotboard/useShotboard.ts` | **Additive only** (§9.5.2): the load-state fix for `:373` (plus `inFlight` in the hydration effect's dependencies), `syncState`, `settled()`, `reload()`, reorder and restore methods. The `add*` methods return their new id | 9A, 9B, 9D |
| `components/shotboard/ImageModelSelect.tsx` | Restyle with `Select`. Add an `aria-label` equal to each existing `title`. Props unchanged | 9B |
| `lib/imageGen.ts`, `lib/imageModels.ts` | `onStatus` and `IMAGE_MODEL_ETA_MS` (§6.6; endpoints and inputs unchanged). They land in 5B with GenerationFrame (§14); 9C only consumes them | owned by §6 |
| `components/ui/Sheet.tsx` | `dismissible` and `reason` props (§7.3). TransferSheet passes `dismissible={transfer.status !== 'running'}` (§9.6.2) | owned by §7 |
| `components/ConvexClientProvider.tsx` | Additive `useConvexAuthState()` export (§7.2) | owned by §7 |
| `components/AssetUrlInput.tsx` | Additive `id` prop, `BayerSpinner`, `role="alert"` (owned by §8.2) | owned by §8 |
| `app/admin/visual-test/page.tsx` | Add the `ShotboardVisualFixture` import and its `<ShotboardVisualFixture />` element. The file is §10.5.9's; the fixture renders its own `<section id="shotboard-visual-test">` root (§9.6.3) | 9B |
| `.agents/skills/admin-testing/SKILL.md` | Add the Shotboard local-mode expectations (§9.10) in the PR that changes them (§1.9) | 9B |

**Delete** these once their strings have moved (§9.9.3): `components/shotboard/ShotCard.tsx`, `SceneSection.tsx`, `SceneSidebar.tsx`, `SceneGallery.tsx`, `CharacterPanel.tsx`. Their `@ts-ignore` vendored imports (`SceneGallery.tsx:4`, `CharacterPanel.tsx:5`) go with them.

**Never touch.** A `git diff --stat` in every Shotboard PR must not list any of these:
- `convex/**`
- `lib/shotboardCompiler.ts`, `lib/shotboardTypes.ts`, `lib/directorProtocol.ts`
- `components/ScriptTemplatePicker.tsx`: its `?board=` link at `:128` is the deep-link contract, and §8 owns its restyle.
- `components/dither-kit/**` (hash-locked)
- `components/reactbits/AccordionGallery.{jsx,css}` and `ChromaGrid.{jsx,css}`: the libraries and the fixture still use them.
- `app/api/**`, `middleware.ts`

### 9.3 Before

**Screenshots** (`docs/redesign/baseline/`): `admin_shotboard-dark.jpg` and `admin_shotboard-light.jpg` (1440×900), and `admin_shotboard-mobile.jpg` (390×844). All three are in local mode with no board open. They show:
- one header card (a static "Shotboard", 'New board', 'Nano Banana 2');
- the description line and the amber not-configured sentence;
- a one-line empty card;
- about 400 px of empty page, with a floating footer below (§3.6).

| # | Defect | Evidence (as of 845147c) |
|---|---|---|
| B1 | The form-first layout is capped at 1280 px: a 280 px form sidebar and 256 px cards of about 10 controls each. Below `lg`, about 900 px of forms come before the first shot | `app/layout.tsx:63`; `components/shotboard/ShotboardPage.tsx:304`; `ShotCard.tsx:69` |
| B2 | Every keyframe is cropped to a fixed 2:1 well (`h-32` in `w-64`, `object-cover`) whatever the board aspect. There is no aspect control, although `patchBoard` accepts `aspectRatio` | `ShotCard.tsx:87`, `:90`; `lib/imageModels.ts:85-95` |
| B3 | **Sticky model.** After a shot's first generation, the toolbar model never applies to it again: `getImageModel(shot.imageModel ?? imageModel)`, `modelId: shot.imageModel ?? model.id`, then `imageModel: model.id` is saved. No UI shows or resets it, and the button title promises "the selected model" | `ShotboardPage.tsx:96`, `:105`, `:112`; `ShotCard.tsx:106` |
| B4 | **Infinite loading.** `loading = !!mirror && !!boardId && String(loadQuery?.board?._id ?? '') !== boardId` never turns false when `load` returns `{ board: null }` (signed out, or a deleted `?board=`), so 'Loading shotboard…' shows forever | `useShotboard.ts:373`; `ShotboardPage.tsx:297-303`; `convex/shotboards.ts:138` |
| B5 | `<Suspense>` has no fallback, so the SSR HTML for `<main>` is empty and the editor pops in after hydration. A malformed `?board=` throws in `useQuery` with no boundary | `app/admin/shotboard/page.tsx:8`; `useShotboard.ts:411-414` |
| B6 | Failures are invisible where they happen. `imageStatus` 'failed' and 'generating' are persisted but never read, and every error overwrites one amber, non-live status line at the top of the page | `ShotboardPage.tsx:102`, `:115`, `:290` |
| B7 | Optimistic write failures are swallowed, and there is no Saving/Saved/Failed indicator | `useShotboard.ts:148` |
| B8 | Destructive actions have no confirmation or undo. 'Delete board' is a bare icon beside 'Send to Director'. 'Delete scene' also deletes its shots. 'Delete shot' fires immediately. 'Delete character' archives shared library characters such as @coast for the whole studio | `ShotboardPage.tsx:274`; `SceneSection.tsx:90`; `ShotCard.tsx:81`; `CharacterPanel.tsx:92`; `convex/shotboards.ts:309-331` |
| B9 | 'Send to Director' is a 27-line inline pipeline whose only feedback is 'Preparing…' for minutes. The amber "N shots need Director expansion before transfer." shows on every new board | `ShotboardPage.tsx:236-268`, `:288` |
| B10 | **Transfer crash on untouched shots.** `(stale ? (A \|\| B \|\| C) : (D \|\| A \|\| B \|\| C) \|\| '').trim()` parses as `stale ? (A\|\|B\|\|C) : (… \|\| '')`, so a stale shot with no prompt calls `undefined.trim()`. Every new shot is stale (`directorPromptRevision` is undefined), so any board with an empty shot fails with "Could not prepare Director transfer: Cannot read properties of undefined (reading 'trim')". Reproduced with `node -e` | `ShotboardPage.tsx:248-250`; `useShotboard.ts:284` |
| B11 | **Stale revision race** [plausible, from code reasoning]. The transfer and the per-shot Expand read `sb.board?.revision` from the render-time closure. After `flush()` of pending edits the server revision is higher, so GMI rejects with 'Prompt is stale; reload the shot before expanding' | `ShotboardPage.tsx:130`, `:240`; `convex/promptExpansion.ts:71` |
| B12 | ChromaGrid is clipped in the 280 px sidebar (320 px cards in `h-[420px] overflow-hidden`). The 3rd and later characters are unreachable, and `.chroma-info` forces `system-ui` | `CharacterPanel.tsx:69`; `reactbits/ChromaGrid.css:6`, `:22`, `:40`, `:108` |
| B13 | The 'Expand' pill and 'Choose from character gallery' use undefined `fal-primary-50/300` shades, so in dark mode they fall back to #4c1d95 on #111827 (1.62:1) | `ShotCard.tsx:158`, `:169`; `tailwind.config.js:27-32`, `:74-79` |
| B14 | Four prompt fields and no lineage. The textarea shows `expandedPrompt \|\| promptIdea`, and typing overwrites the idea. `visualPrompt` silently wins for images. `directorPrompt` is never shown | `ShotCard.tsx:41`, `:48`; `ShotboardPage.tsx:91`; `lib/shotboardCompiler.ts:40` |
| B15 | A scene can be selected only through its 12 px padding, because the header and the shots row stop propagation. It has no role, tabindex or key handler | `SceneSection.tsx:56`, `:58`, `:95` |
| B16 | A GSAP AccordionGallery mounts inside every closed `<details>` (per shot and per scene). The SceneGallery strip desyncs on hover, remounts on every scene add, remove or reorder (it is keyed on the scene ids), and shows a blank panel for a cleared keyframe (`??` on `''`) | `ShotCard.tsx:169`; `SceneSection.tsx:69`; `SceneGallery.tsx:23`, `:36`, `:41` |
| B17 | The board style cannot be cleared. 'Board style…' sends `styleId: undefined`, which `pickDefined` drops, so the style snaps back | `ShotboardPage.tsx:224`; `useShotboard.ts:60-67`, `:218` |
| B18 | Add scene, shot and character are neither optimistic nor guarded. A double-click on 'Add shot' creates two shots with the same number | `useShotboard.ts:237-239`, `:280-286`, `:336-338` |
| B19 | @mentions match only at the end of the text, have no combobox semantics, and close on a 120 ms blur timer. The '$HANDLE'/'$COAST' copy contradicts the `@coast` convention | `ShotCard.tsx:49`, `:139`; `CharacterPanel.tsx:88-89`; `components/CharacterLibraryPage.tsx:153` |
| B20 | Missing names and tiny targets: an unlabeled shot-type select, title-only duration and model selects, placeholder-only titles, `alt=""` keyframes, icon buttons of about 22 px, and 14 uses of `text-[10px]` in Focal Light | `ShotCard.tsx:113`, `:125`, `:90`, `:75-83`; `ImageModelSelect.tsx:25`, `:38`; `SceneSidebar.tsx:53-66`; `ShotboardPage.tsx:197-211` |
| B21 | The board selection is not written to the URL, so a refresh drops it | `useShotboard.ts:181-194`, `:409` |

### 9.4 Layout spec

#### 9.4.1 Root grid (`app/styles/shotboard.css`)

The route is full-bleed up to 1920 px with a fixed 16 px gutter (§5). From 1024 px the page never scrolls; the three panes scroll internally.

```css
@layer components {
  .sb-root {
    width: min(100%, 1920px); margin-inline: auto;
    box-sizing: content-box;                                             /* the padding sits outside the ≥1024 height */
    padding-top: var(--h-offline);                                       /* 36px while html[data-offline] is set (tokens.css): the OfflineBanner strip */
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr) auto;
    grid-template-areas: "title tools actions" "banner banner banner" "body body body";
    grid-template-rows: var(--h-slate) auto auto;
  }
  .sb-title, .sb-tools, .sb-actions {
    height: var(--h-slate); display: flex; align-items: center; gap: 8px; min-width: 0;
    position: sticky; top: calc(var(--h-chrome) + var(--h-offline)); z-index: 10;   /* z-raised */
    background-color: rgb(var(--c-chassis) / var(--a-chassis));          /* surface-chassis */
    border-bottom: 1px solid rgb(var(--c-border-subtle));
  }
  .sb-title   { grid-area: title;   padding-inline: 16px 12px; }
  .sb-tools   { grid-area: tools;   padding-inline: 12px; }
  .sb-actions { grid-area: actions; padding-inline: 12px 16px; }
  .sb-banner  { grid-area: banner;  padding: 8px 16px 0; }
  .sb-body {
    grid-area: body; min-height: 0; padding: 12px 16px; gap: 12px; display: grid;
    grid-template-columns: 240px minmax(0, 1fr) 360px;
    grid-template-areas: "rail canvas inspector";
  }
  .sb-rail { grid-area: rail; } .sb-canvas { grid-area: canvas; } .sb-inspector { grid-area: inspector; }
  @media (min-width: 1024px) {
    .sb-root { height: calc(100dvh - var(--h-chrome) - var(--h-offline) - var(--h-status)); grid-template-rows: var(--h-slate) auto minmax(0, 1fr); }
    .sb-rail, .sb-canvas, .sb-inspector { min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  }
  @media (max-width: 1279px) {
    .sb-body { grid-template-columns: 240px minmax(0, 1fr); grid-template-areas: "rail canvas"; }
    .sb-inspector { display: none; }                                    /* the inspector renders in a Sheet */
  }
  @media (max-width: 1023px) {
    .sb-body { display: flex; flex-direction: column; }                 /* page scrolls */
  }
  @media (max-width: 767px) {
    .sb-root { grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas: "title actions" "tools tools" "banner banner" "body body";
      grid-template-rows: var(--h-slate) var(--h-navrow) auto auto; }
    .sb-tools { position: static; height: var(--h-navrow); overflow-x: auto; scroll-snap-type: x proximity; }
  }
}
```

- The three slate-bar parts are **siblings of the body**. Each one can therefore stick on its own, and on mobile the tools strip scrolls away while the title and actions stay. The DOM order is the same at every width (title, tools, actions), and no control is rendered twice.
- **Offline offset.** The OfflineBanner (§7.6) is `position: fixed` under the CommandBar and 36 px tall, and while it shows `html[data-offline]` sets `--h-offline: 36px` (§5.2). `.sb-root` reserves that strip with `padding-top: var(--h-offline)`, the three slate-bar parts stick at `calc(var(--h-chrome) + var(--h-offline))`, and from 1024 px the root's height subtracts `var(--h-offline)` (the root is `content-box`, so its padding is outside that height). No control is covered, and from 1024 px the page still never scrolls.
- Materials:
  - Rail and inspector: `surface-chassis border border-line-subtle rounded-md sq`.
  - Canvas pane: transparent, so the carrier shows between tracks. Canvas toolbar: `surface-chassis`.
  - Each scene track: `surface-panel border border-line-subtle rounded-md sq shadow-e1`.
  - Frames: `bg-screen rounded-screen`.

  No translucent surface nests inside another (§5).

#### 9.4.2 Breakpoints

| Width | Slate bar | Body | Rail | Inspector |
|---|---|---|---|---|
| ≥ 1920 | Title ≤ 280 px. Board settings are **inline** (aspect, style, model + quality) | `240px minmax(0,1fr) 360px` | Column | Column |
| 1536–1919 | Title ≤ 240. Settings sit in a Popover; the trigger shows a summary (`16:9 · Neon noir · Nano Banana 2`, ≤ 240 px, ellipsis) | same | Column | Column |
| 1280–1535 | Title ≤ 180. The trigger reads "Board settings" | same | Column | Column |
| 1024–1279 | Title ≤ 160. 'New board' and the settings trigger become icon-only (sr-only label + Tooltip, so accessible names are unchanged). The runtime readout moves into the Popover | `240px minmax(0,1fr)` | Column | Right `Sheet` 360 |
| 768–1023 | Title ≤ 120; board select 120 px; 'Send to Director' becomes icon-only (sr-only label + Tooltip) | Single column, page scrolls | Two horizontal strips (cast, scene chips) | Bottom `Sheet` |
| < 768 | Row 1 (48, sticky): title · save LED · 'Send to Director' (icon-only). Row 2 (44, scrolls on x, not sticky): board select 160 · 'New board' (full label) · 'Delete board' · 'Board settings' (label) · runtime readout | same | same | Bottom `Sheet` |

**Width budget.** Computed from the §5 type scale, with `readout` at 13 px JBM ≈ 7.8 px per character:

| Width | Bar needs | Available |
|---|---|---|
| 1280 | ≈1212 px | 1248 px |
| 1024 | ≈809 px | 992 px |
| 768 | ≈621 px | 736 px |

With every control inline the bar needs ≈1784 px, so settings go inline only from 1920.

> Note: the bible places the aspect control, style select and ImageModelSelect directly in the slate bar. They stay in the slate bar, but below 1920 they sit behind its "Board settings" Popover, because inline they need ≈1784 px and a 48 px bar has 1248 px at 1280. Below 1920 the inline copy is `display:none`, and the Popover renders its own instance only while open, so no control is duplicated in the accessibility tree.

#### 9.4.3 Slate bar (48 px, `--h-slate`)

| Part | Element | Primitive and props | Size | Shown when |
|---|---|---|---|---|
| `.sb-title` | Clapperboard icon | lucide `Clapperboard` 16, `text-fg-2`, `aria-hidden` | 16 | Always |
| `.sb-title` | **h1** | `BoardTitle` (§9.5.1): the board title in `title-lg`, click or Enter to edit; "Shotboard" when no board is open | max-w per §9.4.2 | Always |
| `.sb-tools` | Board select | `<Select title="Saved shotboards" aria-label="Saved shotboards">`: option `''` 'New / unsaved board', then `{b.title \|\| 'Untitled'}` | 28 × 200 (180/160/140/120/160 by breakpoint) | `sb.persistent` |
| `.sb-tools` | 'New board' | `<Button variant="secondary" size="sm" icon={Plus} pending pendingLabel="Creating…">New board</Button>` | 28 | Always |
| `.sb-tools` | 'Delete board' | `<IconButton icon={Trash2} label="Delete board" variant="ghost" size="sm">` → ConfirmDialog (§9.6) | 28 | `sb.persistent && sb.boardId` |
| `.sb-tools` | 1 px × 20 divider | `line-subtle` | — | Board open |
| `.sb-tools` | Board settings | `BoardSettings`: inline at ≥ 1920; otherwise a `<Popover>` whose trigger is `<Button variant="ghost" size="sm" icon={SlidersHorizontal}>` | 28 | Board open |
| ↳ | Aspect | `<SegmentedControl label="Board aspect" size="sm" options={['16:9','9:16','1:1']} value={toAspect(board.aspectRatio)} onValueChange>` (plain strings, because each value equals its label, §7.3) → `patchBoard({ aspectRatio })`. Shows `16:9` when unset (`boardAspect()`, `ShotboardPage.tsx:21`) | 3 × 44 | Board open |
| ↳ | Style | `<Select title="Board visual style" aria-label="Board visual style">`: option `''` 'Board style…' (**disabled while a style is set**, B17), then the styles | 160 | `styles.length > 0` |
| ↳ | Model | `<ImageModelSelect modelId quality onChange onQualityChange />` (the board default, page state as today at `:50-51`) | 176 (+ 88 quality) | Board open |
| `.sb-tools` | Runtime | `RuntimeReadout`: `{n} beats · {s}s runtime` in `readout` `.nums text-fg-2`, `min-w-[24ch]`, `data-testid="runtime-readout"`. CountUp once on first reveal (§12) | — | `beats > 0`, at ≥ 1280 and < 768 (and in the Popover header at every width) |
| `.sb-actions` | Save LED | `SaveLed` (§9.6.2) | — | Board open |
| `.sb-actions` | **'Send to Director'** | `<Button variant="primary" icon={Send} title="Load this board's compiled script in the Director" pending pendingLabel="Preparing…" data-testid="send-to-director">Send to Director</Button>` → opens `TransferSheet`. It is `aria-disabled`, with the Tooltip "Board is still loading", while `sb.loading \|\| !sb.board \|\| sb.board.revision == null` (the `:263` conditions) | `--h-control` | `sb.persistent && sb.boardId` (as at `:233`) |

'Delete board' sits with the board controls, far from the primary (B8). The route has exactly one primary.

#### 9.4.4 Frame geometry (`components/shotboard/layout.ts`)

```ts
export type BoardAspect = '16:9' | '9:16' | '1:1'
/** Display only. Generation keeps passing boardAspect(sb.board?.aspectRatio) verbatim (ShotboardPage.tsx:21). */
export const toAspect = (a?: string): BoardAspect => (a === '9:16' || a === '1:1' ? a : '16:9')
export const SB = { rail: 240, inspector: 360, gap: 12, toolbar: 32, trackHeader: 32, tagRow: 20, clusterRow: 28,
  frameGap: 8, thumbW: 64, thumbH: 36, avatar: 36, trackPad: 12 } as const
export const LANE_H: Record<BoardAspect, number> = { '16:9': 72, '1:1': 96, '9:16': 160 }
export const PIC_W:  Record<BoardAspect, number> = { '16:9': 128, '1:1': 96, '9:16': 90 }
export const PX_PER_S = 16
export const MIN_BLOCK_W = 120
export type Zoom = 1 | 2
export function frameGeometry(aspect: BoardAspect, duration: number | undefined, zoom: Zoom) {
  const d = Math.max(1, Math.floor(duration ?? 8))            // the compiler's rule, lib/shotboardCompiler.ts:84
  const picH = LANE_H[aspect] * zoom
  const picW = PIC_W[aspect] * zoom
  const blockW = Math.max(MIN_BLOCK_W * zoom, picW, d * PX_PER_S * zoom)
  return { d, picW, picH, blockW, holdW: blockW - picW }
}
/** Inspector preview box: the board aspect fitted inside 320×256. */
export const INSPECTOR_PIC: Record<BoardAspect, readonly [number, number]> = { '16:9': [320, 180], '1:1': [256, 256], '9:16': [144, 256] }
```

| Aspect · zoom | Picture | 8 s block | 16 s block | 4 s block |
|---|---|---|---|---|
| 16:9 · 1× | 128×72 | 128 | 256 (hold 128) | 128 |
| 16:9 · 2× | 256×144 | 256 | 512 | 256 |
| 1:1 · 1× | 96×96 | 128 (hold 32) | 256 | 120 (hold 24) |
| 9:16 · 1× | 90×160 | 128 (hold 38) | 256 | 120 (hold 30) |

- The **picture** is always at the board aspect. The image inside is `object-fit: contain` on `bg-screen`, so an image made before an aspect change is letterboxed, never cropped.
- The **hold** is the rest of the block: the duration beyond the picture, drawn as film base (25% Bayer `--bayer-4-03` in `ramp-1`, with a 1 px left rule in `ramp-2`). Every lane on a board has the same height, so the lanes read as a timeline.
- `ShotFrame` sets `--c-ramp-1: 29 49 96; --c-ramp-2: 51 87 168; --c-ramp-3: 122 165 224` on its root. Screen material is theme-invariant, as with GenerationFrame in §6.6.

> Note: the bible's width is `max(120px, duration×16px)`. At 16:9 the picture itself is 128 px wide (the only even 16:9 size near 120 at a 72 px lane), so the 16:9 floor is 128. For 1:1 and 9:16 the formula is exactly the bible's.

#### 9.4.5 Panes

**Scene rail** (`.sb-rail`, 240 px, padding 12, `ScrollFade axis="y"` from 1024):

| Part | Spec |
|---|---|
| Cast header | 32 px: `<h2>` "Characters" in `title-sm`, the count in `readout text-fg-3`, and `<Button variant="ghost" size="sm" icon={Plus} pending pendingLabel="Adding…">New</Button>` |
| Cast grid | `grid grid-cols-5 gap-2`.<br>**Cell:** a 36×36 avatar `<button aria-label="@coast, library, in selected shot">` (the handle or name, then whichever suffixes apply). The avatar is `bg-screen rounded-screen`. Its source chain, display only (no Convex change): the portrait `imageUrl` with `object-cover`; else, when `handle === 'coast'`, `<BrandImage id="avatar/coast-px" sizes="36px" alt="">` (§13.8; library rows reach this route raw from `load`, so @coast's studio portrait is not in `imageUrl`); else `<DitherAvatar name={handle \|\| name} hue={215} size={36} animate={false}/>`. Below it, the handle in `micro text-fg-2`, truncated at 40 px.<br>**Library characters** (`boardId` undefined) carry a 12 px `Lock` glyph on a `surface-hud` plate at the bottom right.<br>**In the selected shot:** a 2 px `accent` outline, offset 2.<br>**Being inspected:** the §5 selected state (1 px accent border + 25% Bayer accent fill at .22).<br>**Empty:** 'No characters yet — add one, generate its portrait, then tag it on shots.' in `caption text-fg-3` |
| Rule | `.dither-rule`, 12 px margin |
| Scenes header | 32 px: `<h2>` "Scenes" in `title-sm`, plus the count |
| Scene row | A 56 px `<li>` holding a `<button>` (`data-testid="scene-rail-item"`, `aria-current="true"` when selected), then two 28 px `IconButton`s: `ArrowUp` 'Move scene up' and `ArrowDown` 'Move scene down'. At the ends they are `aria-disabled="true"` (the handler is a no-op; Tooltip "Already first" / "Already last"), never native `disabled`, so focus stays on the button (§6.9).<br>**The button holds:**<ul><li>the 64×36 thumb (`bg-screen rounded-screen`, `object-contain`; source `scene.keyframeUrl \|\| firstShotImage`, using `\|\|` rather than `??`, B16);</li><li>`SC 01` in `label text-fg-3`;</li><li>the title in `body-sm` medium (fallback `Scene {n}`);</li><li>the meta line `3 shots · 00:24` in `micro text-fg-3`.</li></ul>A running keyframe job shows a 12 px `BayerSpinner` on the thumb. Selected: the §5 selected state |
| Add scene | `<Button variant="secondary" size="sm" icon={Plus} pending pendingLabel="Adding…">Add scene</Button>`, full width |
| < 1024 | Same DOM, restyled:<ul><li>**Cast:** one 52 px horizontal strip (header inline, avatars in a row, `ScrollFade axis="x"`).</li><li>**Scenes:** one 44 px strip of `SC 01 · title` chips, 32 px tall. Thumbs and meta are `display:none`, and the move buttons show only on the selected chip.</li><li>'Add scene' ends the strip.</li></ul> |

**Track canvas** (`.sb-canvas`):

| Part | Spec |
|---|---|
| Toolbar | 32 px, `surface-chassis rounded-md`. Sticky at the top of the canvas pane from 1024, static below. Holds, in order:<ul><li>`<SegmentedControl label="View" options={[{ value: 'board', label: 'Board' }, { value: 'sheet', label: 'Contact sheet' }]}>`;</li><li>`<SegmentedControl label="Track zoom" options={[{ value: '1', label: '1×' }, { value: '2', label: '2×' }]}>` (Board view only; the value is stored as `Number(value)`);</li><li>a spacer;</li><li>an `IconButton` `Keyboard` "Keyboard shortcuts" that opens the §7.11 ShortcutSheet;</li><li>below 1280, an `IconButton` `PanelRight` "Open inspector" (`PanelBottom` below 1024).</li></ul>View and zoom persist per viewer in `localStorage['wzrd:shotboard']` as `{"view":"board"\|"sheet","zoom":1\|2}` (try/catch; the defaults are board and 1) |
| Scene track | `<section aria-labelledby>` (the id comes from `useId()`) `surface-panel … sq shadow-e1`, padding 8 px 12 px. Height `32 + picH + 20 + 28 + 16`: 168 at 16:9 1×, 240 at 16:9 2×, 256 at 9:16 1×. 12 px between tracks. `content-visibility: auto`, with ``style={{ containIntrinsicSize: `auto ${32 + picH + 20 + 28 + 16}px` }}``, where `picH` is `frameGeometry(aspect, 8, zoom).picH` |
| Track header | 32 px, holding, in order:<ul><li>an `<h3>` containing a `<button>` (`SC 01` in `readout` + the title in `body-sm` medium) that selects the scene;</li><li>the meta line `3 shots · 00:24` in `micro text-fg-3`;</li><li>a read-only location `Chip` (`MapPin`) when a location is set;</li><li>a spacer;</li><li>`<Button variant="secondary" size="sm" icon={Plus} pending pendingLabel="Adding…">Add shot</Button>`;</li><li>`<IconButton icon={Trash2} label="Delete scene" variant="ghost" size="sm">`.</li></ul> |
| Lane | `role="grid"` with one `role="row"`; flex, gap 8, `overflow-x: auto` + `ScrollFade axis="x"`. An empty scene shows the 'First shot' button (dashed 1 px `line-control`, picture-sized, `Plus` 16 + `caption`) instead of the grid |
| Frame (`ShotFrame variant="track"`) | `role="gridcell"`, `data-testid="shot-frame"`, `data-shot-id`, `data-phase`, `data-selected`. The block is `blockW × picH`, `rounded-screen`, with a 1 px `line-subtle` outline (`line-strong` on fine-pointer hover; no transform). The picture follows §9.6.2 |
| Tag row | 20 px: `SC02 · SH03 · 8s` in `micro text-fg-2` (2-digit numbers, `.nums`). Above the text, a 4 px ruler: one 1 px `line-strong` tick per second across `blockW` (a `repeating-linear-gradient` at `blockW / d` spacing), with a 2 px tick at the IN point |
| Cluster row | 28 px.<br>**At rest:** the shot-type abbreviation (`SHOT_TYPE_ABBR`) and the prompt layer (`IDEA`, `VISUAL` or `GMI`, from `promptLayer`), for example `MS · GMI` (`micro text-fg-3`), or `NO PROMPT` in `text-warning` when the prompt is empty. When the §9.5.4 no-reference condition holds, ` · NO REF` follows in `text-warning` (`MS · GMI · NO REF`).<br>**Selected frame** (and fine-pointer hover): replaced by three 28 px `IconButton`s with gap 0: `ChevronLeft` 'Move shot earlier', `ChevronRight` 'Move shot later', `Trash2` 'Delete shot'. At the ends the move buttons are `aria-disabled="true"` (the handler is a no-op; Tooltip "Already first" / "Already last"), never native `disabled`, so focus stays on the button. 'Delete shot' is `aria-disabled` with the reason "Wait for the generation to finish" while the shot's job runs |
| Selection | `<SelectionBrackets variant="selection" inset={4} />` inside the selected block, with no tag (§12.3.9). At `inset={4}` the 6 px corner handles, drawn 4 px outside each corner, end at the block edge, so nothing crosses the lane's `overflow-x: auto` clip. The IN point (the board time, from `duration()` in `lib/format.ts`) is in the inspector kicker (§9.5.1) and the frame's `aria-label` (§9.8) |

**Inspector** (`.sb-inspector`, 360 px, `data-density="compact"` → `--pad-panel` 12, `ScrollFade axis="y"`). Its contents are in §9.5.1. Below 1280 the same `Inspector` renders inside a Sheet:
- 1024–1279: `<Sheet side="right" width={360}>`.
- Below 1024: `<Sheet side="bottom">`, max-height 80dvh.

The Sheet is titled by the selection: "Shot 3", "Scene 2", the character name, or "Board".

#### 9.4.6 Wireframes

Desktop 1440×900, Convex configured, a shot selected (not to scale horizontally; 5–6 frames fit a lane):

```text
    16 |<-- 240 rail -->| 12 |<------------ 784 canvas (1fr) ------------>| 12 |<-- 360 inspector -->| 16
+------------------------------------------------------------------------------------------------------------------+
| [bug] Stream Admin | Live Control  Shotboard | Characters ... Twitch Analytics  [PVW][REC][AIR] [Cmd K] [o]      |  48  CommandBar (§7.8)
+------------------------------------------------------------------------------------------------------------------+
| [clap] Night market pilot | [Night market pilot v][+ New board][del] | [= Board settings] 12 beats · 96s runtime |  48  slate bar: ONE row,
|    .sb-title                 .sb-tools ......................................... [#] Saved [> Send to Director]  |      drawn on two lines
+------------------------+----------------------------------------------------------+------------------------------+
| Characters  3   [+ New]| [Board|Contact sheet]  [1x|2x]                  [kbd]    | SC02 · SH03 · IN 00:40       |  32  canvas toolbar
| [co] [mi] [dx] [+2]    | -------------------------------------------------------  | Shot 3                       |
| @coast @mira @dex      | SC 01 · Market opening  3 shots · 00:24 [+Add shot][x]   | +--------------------------+ |  32  track header
| -----------------------| +-----------+ +-----------+ +-----------+                | |  picture 320x180 (16:9)  | |
| Scenes                 | |  128x72   | | QUEUE 03  | |SIGNAL LOST|                | |  object-contain, screen  | |  72  picture (16:9, 1x)
| +----+ SC 01        [^]| |  keyframe | | 3/16 field| |  [Retry]  |                | +--------------------------+ |
| |thmb| Market open. [v]| +-----------+ +-----------+ +-----------+                | [MODEL Nano Banana 2 v]      |
| +----+ 3 shots · 00:24 | SC01·SH01·8s  SC01·SH02·8s  SC01·SH03·8s                 | [Regenerate image]           |  20  tag row + ruler ticks
| +----+ SC 02        [^]| MS · GMI      [<][>][x]     WS · IDEA                    | Images generate from: GMI    |  28  cluster row (selected)
| |thmb| Alley chase  [v]| -------------------------------------------------------  | IDEA  ...................    |
| +----+ 4 shots · 00:40 | SC 02 · Alley chase     4 shots · 00:40 [+Add shot][x]   | VISUAL  (collapsed)          |
|                        | +-----------+-----------+ +-----------+                  | GMI  REV 12 · CURRENT        |
|                        | |  128x72   | hold ···  | |           |  ...             | DIR  STALE                   |
| [+ Add scene]          | +-----------+-----------+ +-----------+                  | Shot type / Duration / Cast  |
+------------------------+----------------------------------------------------------+------------------------------+
| * NET  * CONVEX  * TWITCH   (message slot)                                                         21:04:12      |  24  StatusRail
+------------------------------------------------------------------------------------------------------------------+
```

1024–1279 (inspector in a Sheet):

```text
    16 |<-- 240 rail -->| 12 |<--------------------- 740 canvas (1fr) at 1024 --------------------->| 16
+-------------------------------------------------------------------------------------------------------+
| [bug] [Live Control] (icons) [PVW][REC][AIR] [Cmd K] [o]                                              |  48  CommandBar
+-------------------------------------------------------------------------------------------------------+
| [clap] Night market.. | [Night market v][+][del] [=]                [#] Saved [> Send to Director]    |  48  slate bar
+------------------------+------------------------------------------------------------------------------+
| Characters  3   [+ New]| [Board|Contact sheet] [1x|2x]                        [Open inspector]        |  32  toolbar
| [co] [mi] [dx]         | SC 01 · Market opening   3 shots · 00:24          [+ Add shot][x]            |  32
| Scenes                 | +-----------+ +-----------+ +-----------+ +-----------+ +-----------+        |
| SC 01 Market..  [^][v] | |  128x72   | |           | |           | |           | |           |        |  72
| SC 02 Alley...  [^][v] | +-----------+ +-----------+ +-----------+ +-----------+ +-----------+        |
| [+ Add scene]          | SC01·SH01·8s  ...                                                            |  20 + 28
+------------------------+------------------------------------------------------------------------------+
  Inspector: <Sheet side="right" width={360}> opened by Enter, double-click or [Open inspector];
  modal (native <dialog>), 320 ms --ease-out slide-in, instant under reduced motion.
```

Mobile 390×844 (local mode):

```text
+------------------------------------------+
| [bug]            [AIR]   [search] [o]    |  48  CommandBar row 1
| Live Control  Shotboard  Charac...  >    |  44  same <nav>, scroll-snap
+------------------------------------------+
| [clap] Night market pi..  [#] Saved [>]  |  48  slate row 1 (sticky, --h-chrome + --h-offline)
| [Saved v][+ New board][del][= Board ..>  |  44  tools strip (scrolls x, not sticky)
+------------------------------------------+
| NOT PATCHED Convex not configured — ...  |  auto  InlineBanner (local mode only)
| Characters 3 [+ New]  [co][mi][dx] ->    |  52  cast strip (scrolls x)
| [SC 01 Market][SC 02 Alley] [+ Add sc..> |  44  scene chips (scrolls x)
| [Board|Contact sheet]      [1x|2x]       |  32  canvas toolbar
| SC 01 · Market opening  [+ Add shot][x]  |  32  track header
| +----------+ +----------+ +-----         |
| |  128x72  | |  128x72  | |   ->         |  72  lane (scrolls x)
| +----------+ +----------+ +-----         |
| SC01·SH01·8s SC01·SH02·8s                |  20 + 28
| SC 02 · Alley chase ...                  |  (page scrolls vertically)
+------------------------------------------+
| * NET * CONVEX * TWITCH       21:04:12   |  24  StatusRail
+------------------------------------------+
  Tap a frame: select + <Sheet side="bottom"> inspector (max-height 80dvh).
```

### 9.5 Component tree

#### 9.5.1 Tree and props

```text
app/admin/shotboard/page.tsx ('use client')
└─ <Suspense fallback={<ShotboardFallback/>}>                     // §9.6.1
   └─ <ShotboardPage/>                                              // gate, ShotboardPage.tsx:23-28 plus the boundary and its key (§9.2)
      ├─ useConvexEnabled() → <ShotboardBoundary key={params.get('board') ?? ''}><ConvexShotboard/></ShotboardBoundary>
      │                        └─ <ShotboardView sb={useConvexShotboard(params.get('board'))} expandPrompt prepareDirector locations styles/>
      └─ else               → <LocalShotboard/> → <ShotboardView sb={useLocalShotboard(params.get('board'))}/>
<ShotboardView>  div.sb-root  data-testid="shotboard"
├─ div.sb-title    → <Clapperboard/> <BoardTitle/>
├─ div.sb-tools    → board <Select/> · 'New board' · 'Delete board' · <BoardSettings/> · <RuntimeReadout/>
├─ div.sb-actions  → <SaveLed/> · 'Send to Director'
├─ div.sb-banner   → <InlineBanner tone="warning" kicker="NOT PATCHED">…</InlineBanner>   (local mode only)
├─ div.sb-body     → one of: <ShotboardSkeleton.Body/> | <Slate kind="not-found"/> | <Slate kind="error"/> (S6b) | <AuthRequired/> | <Slate kind="empty"/> | editor:
│   ├─ <SceneRail>  aside.sb-rail aria-label="Scenes and cast"  → <CastStrip/> <ol aria-label="Scenes">…</ol> 'Add scene'
│   ├─ <TrackCanvas> section.sb-canvas aria-label="Shot track" → toolbar · <SceneTrack/>* | <ShotContactSheet/>
│   └─ <Inspector>   aside.sb-inspector aria-label="Inspector" (column ≥ 1280 | <Sheet> < 1280)
│        → <ShotInspector/> | <SceneInspector/> | <CharacterInspector/> | <BoardInspector/>
├─ <TransferSheet/>                     (right Sheet, 400)
└─ <ConfirmDialog/> ×3                  (delete board, delete character, reload board)
```

```ts
// components/shotboard/ShotboardView.tsx — props = today's props + optional injections (fixture/tests only)
type ShotboardViewProps = {
  sb: ShotboardState
  expandPrompt?: ExpandPrompt            // ShotboardPage.tsx:44, unchanged
  prepareDirector?: PrepareDirector      // ShotboardPage.tsx:45, unchanged
  locations?: LocationDetails[]; styles?: StyleDetails[]
  generate?: typeof generateImage        // default: lib/imageGen generateImage
  navigate?: (href: string) => void      // default: router.push
  authState?: { isLoading: boolean; isAuthenticated: boolean }   // default: useConvexAuthState()
  headingLevel?: 1 | 2                   // default 1; ShotboardVisualFixture passes 2, so /admin/visual-test keeps one h1
}
```

`headingLevel` changes only the level of the route heading: `BoardTitle` and `ShotboardBoundary` take the same prop (default 1) and render `h2` instead of `h1` at 2. The h2/h3 levels inside the view do not change.

| Component | Props (all callbacks come from the hooks in §9.5.2–§9.5.5) | Notes |
|---|---|---|
| `BoardTitle` | `title: string \| null; editable: boolean; autoEditToken: number; headingLevel?: 1 \| 2; onCommit(title: string): void` | **At rest:** `<h1 class="text-title-lg truncate"><button aria-describedby={hintId}>{title \|\| 'Untitled'}</button></h1>`, plus an sr-only `<span id={hintId}>` reading "Rename board" (`hintId = useId()`).<br>**Editing:** the h1 contains `<input aria-label="Board title" placeholder="Untitled shotboard" maxLength={120}>`. Enter or blur commits `patchBoard({ title: value.trim() })`; an empty value reverts and never writes `''`. Esc reverts.<br>`autoEditToken` bumps after 'New board' resolves, which enters edit mode with the text selected.<br>**No board:** a plain `<h1>Shotboard</h1>` |
| `BoardSettings` | `aspect; onAspect; styles; styleId; onStyle; modelId; quality; onModel; onQuality; beats; seconds; inline: boolean` | Popover content: the runtime line, then the three controls stacked with `Field` labels "Aspect", "Visual style" and "Image model" |
| `SaveLed` | `state: 'local' \| 'saved' \| 'saving' \| 'error'; error: Error \| null; onReload(): void` | §9.6.2 |
| `CastStrip` | `characters; inShotIds: Set<string>; inspectedId; portraitJobs; onInspect(id); onAdd(): Promise<string \| null>` | Selecting a character sets `selection = { kind: 'character', id }` |
| `SceneRail` | `scenes; shots; selectedSceneId; keyframeJobs; onSelect(id); onMove(id, dir); onReorder(ids) (9D); onAdd(): Promise<string \| null>` | |
| `TrackCanvas` | `view; zoom; onView; onZoom; scenes; shots; aspect; selection; jobs; overrides; …frame callbacks` | Owns the keyboard handler (§9.5.5) |
| `SceneTrack` | `scene; shots (ordered by order ?? shotNumber); aspect; zoom; inTimes: Map<shotId, number>; selectedShotId; jobs; onSelectScene; onAddShot; onDeleteScene; onReorder(ids) (9D)` | |
| `ShotFrame` | `shot; sceneNumber; aspect; zoom; variant: 'track' \| 'sheet' \| 'inspector'; job?: GenJob; modelLabel; modelId; inTime: number; selected; tabIndex: 0 \| -1; canEarlier; canLater; deleteReason?: string; onSelect; onOpen; onRetry; onMove(dir); onDelete` | Pure component.<ul><li>In the track: `<img alt="" loading="lazy" decoding="async" width={picW} height={picH}>`, because the gridcell carries the name.</li><li>In the inspector: `alt="Keyframe for SC02 · SH03: {first 80 chars of activeImagePrompt}"`.</li><li>Each `<img>` has `// eslint-disable-next-line @next/next/no-img-element`.</li></ul> |
| `ShotInspector` | `shot; scene; board; characters; job; model: { resolved: ImageModelDef; override: string \| null; boardModelId: string; lastTakeId?: string }; expand: { running: boolean; startedAt?: number; error?: string; unavailableReason?: string }; errors; takes: string[]; …callbacks` | Sections below |
| `SceneInspector` | `scene; locations; keyframeJob; errors; onPatch; onGenerateKeyframe` | SceneSidebar's fields (`SceneSidebar.tsx:73-146`), plus the title and `LocationPicker` |
| `CharacterInspector` | `character; library: boolean; portraitJob; errors; onPatch; onGeneratePortrait; onDelete` | Read-only for library characters |
| `BoardInspector` | `board; sceneCount; shotCount; onPatch` | |
| `TransferSheet` | `open; onClose; transfer: ReturnType<typeof useDirectorTransfer>; preflight: PreflightRow[]; onJump(shotId)` | §9.6.2 |

**Shot inspector, top to bottom** (the `Inspector` root carries `data-testid="sb-inspector"`):

| # | Block | Spec |
|---|---|---|
| 1 | Header (48) | Kicker `SC02 · SH03 · IN 00:24` (`label text-fg-3`; the IN point is the shot's board time, from `duration()` in `lib/format.ts`), then `<h2 class="text-title-lg">Shot 3</h2>` (text "Shot {shotNumber}"). Inside a Sheet, the Sheet title is the heading and this h2 is not rendered |
| 2 | Picture | `ShotFrame variant="inspector"` at `INSPECTOR_PIC[aspect]`, centred on `bg-screen` |
| 3 | Model + generate | **`ModelChip`** (`data-testid="model-chip"`): a `Chip` + `Popover` showing `MODEL` (`micro`) and the resolved label, suffixed "· board default" or "· this shot".<br>**The Popover** holds a `role="radiogroup"` of the three `IMAGE_MODELS` labels; `<Button variant="ghost" size="sm">Use board default</Button>`, which sets the override to `null`; and the caption "Last take: {label}". The caption comes from the persisted `shot.imageModel`, looked up with `IMAGE_MODELS.find`; an unknown id shows raw in `code`.<br>**Then**, when the §9.5.4 no-reference condition holds, the `NO REF` `InlineBanner` (§9.6.2).<br>**Then, full width:** `<Button variant="secondary" icon={Wand2} pending={jobActive} pendingLabel="Generating…" title={shot.imageUrl ? 'Re-generate / edit the keyframe with the selected model' : 'Generate a keyframe image'}>{shot.imageUrl ? 'Regenerate image' : 'Generate image'}</Button>` |
| 4 | Takes (cut-able) | A `TAKES` kicker and up to 6 session-local previous `imageUrl`s as 48×27 thumbs. Each is a `<button aria-label="Use take {k}">` → `patchShot({ imageUrl })` |
| 5 | Prompt lineage | `PromptLineage` (`data-testid="prompt-lineage"`). It starts with two pinned lines: "Images generate from: {Idea \| Visual override \| GMI expansion}" (from `promptLayer`) and "Director uses: {…}" (from the `directorPromptText` precedence). Four cards follow, each `surface-inset rounded-sm`, with an 8 px gap:<br>**IDEA** — `<Textarea autoGrow maxRows={8}>` in `body-lg`, placeholder 'Image prompt or direction for this shot…', ``aria-label={`Image prompt for shot ${shot.shotNumber}`}``, wrapped by `MentionCombobox`. Edits patch `{ promptIdea, expandedPrompt: '' }` (today's rule, `ShotCard.tsx:48`). When that clears a non-empty expansion, `chyron.push({ tone: 'info', title: 'GMI expansion discarded', action: { label: 'Undo', run } })` restores `{ expandedPrompt, expandedPromptRevision }` (derived-only, so no revision bump).<br>**VISUAL** — a disclosure labelled 'Visual prompt (image gen)', holding a `Textarea` with the placeholder 'Detailed prompt for the keyframe image…'. Shows a `Badge` `OVERRIDES IDEA` (warning, outline) when non-empty.<br>**GMI** — read-only text in `body-sm text-fg-2`, with the badges `REV {expandedPromptRevision}` and `CURRENT` (success) or `STALE` (warning), compared with `board.revision`. Actions:<ul><li>`<Button variant="secondary" size="sm" icon={Sparkles} title="Expand this prompt with GMI" pending pendingLabel="Expanding…">Expand</Button>`;</li><li>`<Button variant="ghost" size="sm">Use as idea</Button>`, which patches `{ promptIdea: shot.expandedPrompt, expandedPrompt: '' }` (the explicit form of today's first-keystroke overwrite);</li><li>`<Button variant="ghost" size="sm">Undo expansion</Button>`, which patches `{ expandedPrompt: '' }`.</li></ul>While expanding: a `BayerSpinner` and `EXPANDING 00:12.4` (`readout`, `tcShort`, ticker ≤ 4 Hz). Empty: the caption "Not expanded yet."<br>**DIR** — the read-only `directorPrompt`, with a `CURRENT`/`STALE` badge (`directorPromptRevision !== board.revision`). Empty: the caption "Not prepared yet. Send to Director expands it." |
| 6 | Shot | `Field` "Shot type" + a `Select` of the `SHOT_TYPE_OPTIONS` labels (value `shot.shotType ?? 'medium'`). `Field` "Duration" + `<NumberStepper value min={1} max={120} step={1} unit="s" label="Duration">`, whose input has `title="Shot duration in seconds (drives the beat offset)"`. It writes `Math.max(1, Math.floor(n))` (`ShotCard.tsx:128`). Existing values above 120 display as they are and can only decrease |
| 7 | Cast | `<div role="group" aria-label="Cast in this shot">` of `Chip`s (`aria-pressed`, `selected` when assigned, a `LIBRARY` Badge on library characters) → `toggleShotCharacter` |
| 8 | Details | A disclosure labelled 'Details', holding four fields:<ul><li>`Field` "Dialogue" + an input with the placeholder 'Dialogue (optional)';</li><li>`Field` "Sound effects" + the placeholder 'Sound effects (optional)';</li><li>`Field` 'Audio at this beat' + `<AssetUrlInput kind="audio" placeholder="Audio URL or upload">`;</li><li>`Field` 'Keyframe image URL' + `<AssetUrlInput placeholder="Image URL or upload">`.</li></ul> |

**Scene inspector:**
- Header: kicker `SC 02`, then `<h2>` "Scene 2".
- `Field` "Title" + an `Input` with the placeholder `Scene {n}` (today's placeholder, `SceneSection.tsx:66`).
- SceneSidebar's four sections, with their labels, placeholders and fields unchanged: 'Scene description', 'Location & time', 'Atmosphere & elements', 'Camera environment'.
- The keyframe block: a `ShotFrame`-style well at `INSPECTOR_PIC` with a GenerationFrame while generating; an `AssetUrlInput` with the placeholder 'Image URL or upload'; and `<Button variant="secondary" icon={Wand2} pending pendingLabel="Generating…">Generate keyframe</Button>`.
- 'Location & time' also holds `LocationPicker`: a `Chip` trigger showing the location name or 'Choose location', which opens a Popover grid of 120×90 `object-cover` plates in 2 columns. It is hidden when `locations.length === 0`, as at `SceneSection.tsx:69`.
- Elements use `<Chip onRemove removeLabel="Remove element">` and the 'Add' button.

**Character inspector, board-local characters:**
- `Input` with the placeholder 'Name'.
- `Input` with the placeholder 'handle' and `title="Prompt anchor (e.g. @coast)"`, normalised on change to `value.toLowerCase().replace(/^[@$]+/, '').replace(/[^a-z0-9_-]/g, '')`.
- `Textarea` with the placeholder 'Appearance, outfit, style — used in prompts'.
- A portrait well (1:1, 256) + an `AssetUrlInput` with the placeholder 'Portrait URL or upload'.
- `<Button variant="secondary" icon={Wand2} pending pendingLabel="Generating…">{imageUrl ? 'Regenerate portrait' : 'Generate portrait'}</Button>`.
- `<IconButton icon={Trash2} label="Delete character">` → ConfirmDialog.

**Character inspector, library characters** (`boardId` undefined): a `LIBRARY` Badge, the name, `@handle` in `code`, the description and the portrait, all read-only. There is no generate and no delete. A `next/link` "Edit in Characters" goes to `/admin/characters`.

**Board inspector** (nothing selected):
- Kicker `BOARD`, then `<h2>` "Board".
- `Field` "Description" + a `Textarea` with the placeholder 'Add a board description…'.
- 'Build scenes of shots with generated keyframes — the board compiles to the timed script the Director runs.' in `caption text-fg-3`.
- A `{s} scenes · {n} shots` readout.
- The caption 'Select a scene to edit its details.'

#### 9.5.2 `useShotboard.ts` additions (additive; nothing renamed or removed)

```ts
export type BoardLoad = 'idle' | 'loading' | 'ready' | 'missing' | 'error'
/** Pure; exported for tests. `loaded`: undefined = query pending, null = { board: null }, else the loaded id.
 *  `blocked` = syncError != null: a rejected write stays in pendingWritesRef until flush() (:139-143), and while it is
 *  there hydration returns early (:172), so the loaded board can never appear without reload(). */
export function boardLoadState(a: { persistent: boolean; boardId: string | null; hasBoard: boolean; loaded: string | null | undefined; blocked: boolean }): BoardLoad {
  if (!a.persistent) return a.hasBoard ? 'ready' : 'idle'
  if (!a.boardId) return 'idle'
  if (a.loaded === undefined) return 'loading'
  if (a.loaded === null) return 'missing'
  if (a.loaded === a.boardId && a.hasBoard) return 'ready'
  if (a.loaded === a.boardId && a.blocked) return 'error'
  return 'loading'
}

export interface ShotboardState {
  // …every existing member of useShotboard.ts:17-45, unchanged…
  loadState: BoardLoad
  /** Replaces the formula at :373. Never true once load answered { board: null }, nor while loadState is 'error'. */
  loading: boolean                                     // = persistent && loadState === 'loading'
  syncState: 'local' | 'saved' | 'saving' | 'error'    // !mirror → 'local'; syncError → 'error'; inFlight > 0 → 'saving'; else 'saved'
  syncError: Error | null
  /** Resolves in a post-commit effect once pendingWritesRef.current.size === 0 && inFlight === 0 && (!mirror ||
   *  (loadQuery?.board && board?.revision === loadQuery.board.revision)); rejects after 10 000 ms with
   *  Error('Board is still syncing; try again in a moment'). Local mode resolves immediately. */
  settled: () => Promise<void>
  /** await flush().catch(() => undefined); syncError = null; selectBoard(boardId) (forces re-hydration). */
  reload: () => Promise<void>
  reorderShots: (sceneId: string, orderedIds: string[]) => void   // one setShotOrder; local order & shotNumber = index + 1 (moveShot's rule, :324-326)
  reorderScenes: (orderedIds: string[]) => void                    // sceneNumber = index + 1, one patchScene per scene (moveScene's rule, :270-271)
  restoreShot: (snap: ShotDetails) => Promise<string | null>       // createShot with pickDefined(snap, SHOT_PATCH_KEYS); local: re-insert snap
  restoreScene: (snap: { scene: SceneDetails; shots: ShotDetails[] }) => Promise<string | null>  // createScene, then createShot per shot
  // addScene / addShot / addCharacter now return Promise<string | null> (the new id; null when no board).
  // A function returning a Promise is assignable to the old `() => void`, so callers compile unchanged.
}
```

- **In-flight and error tracking** wrap the *raw* promise inside `trackWrite` with separate handlers: the `inFlight` state goes +1 on add and −1 on settle, and `setSyncError(err)` runs on rejection. These stay untouched, so rejected writes remain visible to `flush()`:
  - the `tracked` promise and its `pendingWritesRef` bookkeeping;
  - the rethrow at `:139-143`;
  - `void tracked.catch(() => undefined)` at `:148`.
- `syncError` clears when the hydration effect (`:164-179`) re-hydrates, and in `reload()`. `reload()`'s `flush()` removes the settled (including rejected) writes from `pendingWritesRef` (`:151-159`), so hydration can run again.
- The hydration effect adds `inFlight` to its dependency list (additive). A write that settles after the next board's `load` has answered then re-runs hydration, instead of leaving `loaded === boardId && !hasBoard` (`loading`) until the next server push.
- In Convex mode, `restore*` re-creates the rows (new ids; §9.9.4 item 9) and appends to local state only after the mutation resolves, as `add*` does. `characterIds` and `locationId` are cast to `Id<…>`, as `patchShot` does (`:299`).
- `loadState` uses `loaded = loadQuery === undefined ? undefined : loadQuery.board ? String(loadQuery.board._id) : null` and `blocked = syncError != null`.
- **Rejected adds.** In Convex mode `add*` and `restore*` return the tracked write, which rejects on an auth or network failure. Every caller (ShotboardView, `useUndoDelete`, `useShotboardSelection`) awaits it inside `try/catch`. On rejection it pushes `chyron.push({ tone: 'error', title, body: message })` with the §9.6.2 "Add or restore failure" title, and resolves `null`. No `Uncaught (in promise)` reaches the console.

#### 9.5.3 `runDirectorTransfer` and `useDirectorTransfer` (order preserved)

The pipeline is a pure async function in `components/shotboard/directorTransfer.ts`. It imports no React, so `tests/unit/director-transfer.spec.ts` runs it in Node with fake deps (the repo has no jsdom or React test renderer, and D8 forbids adding one). `useDirectorTransfer` only wraps it in state.

```ts
// components/shotboard/directorTransfer.ts — no React. useDirectorTransfer passes getState: () => sbRef.current (sbRef.current = sb on every render).
export type TransferStage = 'save' | 'expand' | 'prepare' | 'open'
export type TransferRowState = 'queued' | 'expanding' | 'done' | 'failed' | 'skipped'
export type TransferDeps = {
  getState(): ShotboardState
  expandPrompt?: ExpandPrompt                  // ShotboardPage.tsx:44, unchanged
  prepareDirector?: PrepareDirector            // ShotboardPage.tsx:45, unchanged
  navigate(href: string): void                 // default router.push
  isStopped(): boolean
  isUnmounted(): boolean
  runningJobs(): number                        // queued/running useShotGeneration jobs + running usePromptExpansion jobs
  onStage(stage: TransferStage): void
  onRow(shotId: string, patch: { state: TransferRowState; startedAt?: number; error?: string }): void
  announce(text: string): void
}
export async function runDirectorTransfer(d: TransferDeps): Promise<'done' | 'stopped' | 'refused'> {
  if (d.runningJobs() > 0) return 'refused'                                                          // nothing else is called
  const { expandPrompt, prepareDirector } = d
  d.onStage('save');   await d.getState().flush();  await d.getState().settled()
  const s = d.getState()
  const boardId = s.boardId
  if (!prepareDirector || !boardId) throw new Error('Director transfer is unavailable')                // :239
  const revision = s.board?.revision
  if (expandPrompt && revision != null) {                                                            // :241
    d.onStage('expand')
    const pending = s.shots.filter((shot) => !shot.directorPrompt?.trim() || shot.directorPromptRevision !== revision) // :242
    for (const shot of pending) d.onRow(shot.id, { state: 'queued' })
    let failedCount = 0
    for (let index = 0; index < pending.length; index += 2) {                                        // :243, batches of 2
      if (d.isStopped() || d.isUnmounted()) break
      const batch = pending.slice(index, index + 2)
      const results = await Promise.allSettled(batch.map(async (shot) => {
        const scene = s.scenes.find((item) => item.id === shot.sceneId)
        const source = activeDirectorSource(shot, revision)                                           // lib/shotPrompt.ts (B10 fix)
        if (!source) { d.onRow(shot.id, { state: 'skipped' }); return null }                          // row → SKIPPED · NO PROMPT
        const context = [scene?.title, scene?.description, scene?.location, shot.dialogue ? `Dialogue: ${shot.dialogue}` : '', shot.soundEffects ? `SFX: ${shot.soundEffects}` : ''].filter(Boolean).join('\n') // :252
        d.onRow(shot.id, { state: 'expanding', startedAt: Date.now() })
        try {
          return { shot, result: await expandPrompt({ kind: 'director', source, context, requestId: `director-${shot.id}-${Date.now()}`, sourceRevision: revision, shotId: shot.id as Id<'shots'> }) } // :253
        } catch (e) {
          d.onRow(shot.id, { state: 'failed', error: e instanceof Error ? e.message : String(e) })
          throw e
        }
      }))
      failedCount += results.filter((r) => r.status === 'rejected').length
      for (const r of results) if (r.status === 'fulfilled' && r.value) {
        d.getState().patchShot(r.value.shot.id, { directorPrompt: r.value.result.prompt, directorPromptRevision: revision }) // :255
        d.onRow(r.value.shot.id, { state: 'done' })
      }
    }
    await d.getState().flush();  await d.getState().settled()                                        // :257
    if (d.isStopped()) return 'stopped'
    if (failedCount > 0) throw new Error(`${failedCount} of ${pending.length} Director expansions failed`)
  }
  d.onStage('prepare')
  const transferId = await prepareDirector({ boardId: boardId as Id<'shotboards'>, expectedRevision: d.getState().board?.revision }) // :259
  d.onStage('open'); d.announce('Transfer ready, opening Live Control')
  if (!d.isUnmounted()) d.navigate(`/admin?transfer=${String(transferId)}`)                          // :260
  return 'done'
}
/** The preserved prefix (:261). */
export const transferError = (e: unknown) => `Could not prepare Director transfer: ${e instanceof Error ? e.message : String(e)}`
```

`useDirectorTransfer(sb, { expandPrompt, prepareDirector, navigate, runningJobs })` keeps `sbRef`, `stopRef` and `unmountedRef`. `start()` sets `status: 'running'`, clears `rows` and `error`, and calls `runDirectorTransfer`. The result `'done'` or `'stopped'` becomes the status, and `'refused'` returns it to `'idle'` (the Start button is `aria-disabled` in that case anyway, §9.6.2). A rejection sets `status: 'failed'` and `error: transferError(e)`. `onRow` upserts the row, deriving `tag` (`SC02 · SH03`) from the shot and its scene.

**Unchanged:**
- flush first, then the stale filter;
- batches of 2, never a 3rd concurrent job (the server rejects one with 'Two prompt-expansion jobs are already running');
- the source, context and requestId shapes;
- the patch `{ directorPrompt, directorPromptRevision }`, then flush again;
- `prepare({ boardId, expectedRevision })`, then `router.push('/admin?transfer=<id>')`;
- `shotIds` is still never passed.

**Changed, with the reason:**
- `settled()` runs after each flush (B11).
- `Promise.allSettled` means one failed expansion no longer discards its batch partner's result. `failedCount` accumulates per batch inside the function, never from React state. Failures stop the run **before** `prepare`, never after.
- `activeDirectorSource` parenthesises the source, so an empty shot is skipped instead of throwing a TypeError (B10).
- A run is refused, with nothing called, while any generation or per-shot expansion is running. Those jobs patch the board on completion and bump its revision, and a running Expand holds one of the server's two expansion slots (`convex/promptExpansion.ts:62`). While a transfer runs, the generation and Expand controls are locked (§9.5.4).
- `stop()` finishes the current batch, saves it, and never calls `prepare`.
- `retryFailed()` is `start()` again: the stale filter re-selects only the shots still lacking a current Director prompt.
- Unmounting stops new batches and suppresses `navigate`.

The hook exposes `{ status: 'idle'|'running'|'stopped'|'failed'|'done', stage: TransferStage, rows: { shotId, tag, state: TransferRowState, startedAt?, error? }[], done, total, error, start, stop, retryFailed }`.

#### 9.5.4 `lib/shotPrompt.ts` and generation

```ts
/** Same expression as ShotboardPage.tsx:91. */
export const activeImagePrompt = (s: ShotDetails) => (s.expandedPrompt || s.visualPrompt || s.promptIdea || '').trim()
export const promptLayer = (s: ShotDetails): 'gmi' | 'visual' | 'idea' | 'none' =>
  s.expandedPrompt ? 'gmi' : s.visualPrompt ? 'visual' : s.promptIdea ? 'idea' : 'none'
/** Same precedence as lib/shotboardCompiler.ts:40 (display only; the compiler is not edited). */
export const directorPromptText = (s: ShotDetails) =>
  s.directorPrompt?.trim() || s.expandedPrompt?.trim() || s.visualPrompt?.trim() || s.promptIdea?.trim() || ''
/** ShotboardPage.tsx:247-250 with the precedence bug fixed (B10): never throws, '' means "skip". */
export function activeDirectorSource(s: ShotDetails, revision: number): string {
  const stale = s.directorPromptRevision !== revision
  return ((stale ? (s.expandedPrompt || s.visualPrompt || s.promptIdea)
                 : (s.directorPrompt || s.expandedPrompt || s.visualPrompt || s.promptIdea)) || '').trim()
}
export const SHOT_TYPE_ABBR: Record<string, string> = { wide: 'WS', medium: 'MS', close: 'CU', extreme_close_up: 'ECU',
  establishing: 'EST', pov: 'POV', over_the_shoulder: 'OTS', aerial: 'AER', low_angle: 'LOW', high_angle: 'HIGH',
  dutch_angle: 'DUTCH', tracking: 'TRK', insert: 'INS' }   // keys = SHOT_TYPE_OPTIONS values, lib/shotboardTypes.ts:87-101
/** The B3 fix, pure for the unit spec: the shot's persisted imageModel cannot reach the choice. */
export const resolveModelId = (shotId: string, overrides: Record<string, string>, boardModelId: string): string =>
  overrides[shotId] ?? boardModelId
```

**`useShotGeneration(sb, { boardModelId, quality, styles, locations, generate })`** keeps every rule of `ShotboardPage.tsx:90-185` except the model choice:

| Rule | Spec |
|---|---|
| **Model (B3 fix)** | `resolved = getImageModel(resolveModelId(shot.id, overrides, boardModelId))`. `shot.imageModel` is **never** read for the choice. `overrides` is session-local state (`Record<shotId, modelId>`), cleared when the board changes; "Use board default" deletes the key. The `modelId` sent to fal is `resolved.id`, which fixes the `:105` mismatch |
| Prompt | `` `${style?.description ? `Style: ${style.description}. ` : ''}${shotTypeLabel(shot.shotType)}: ${activeImagePrompt(shot)}` `` (`:107`). If empty: `errors[shot.id] = 'Give the shot a prompt or direction first'` and no call |
| References | `[shot.imageUrl, scene?.keyframeUrl, location?.imageUrl, ...characterImageRefs(shot)]`, filtered (`:99`). Mode is `edit` when there is any reference and the model is not t2i-only (`:106`) |
| Aspect, quality | `boardAspect(sb.board?.aspectRatio)`; the toolbar `quality` |
| Persisted status | `patchShot({ imageStatus: 'generating' })` before the call. On success, `patchShot({ imageUrl: url, imageStatus: 'completed', imageModel: resolved.id })` (provenance, kept per the invariant). On failure, `patchShot({ imageStatus: 'failed' })` and `errors[shot.id] = 'Image generation failed: <msg>'` |
| Job map | `jobs[id] = { phase, phaseSince, queuePosition?, modelId, src?, error? }`. On click the phase is `queued` with no position. `onStatus` (§6.6) then sets `queued` with a position, and `running`. An `onStatus({ phase: 'done' })` is ignored, because fal reports COMPLETED before `generateImage` resolves with the URL: the job enters `done` only after `generate()` resolves, with `src = url`. A `done` entry is kept for 900 ms, then removed. Keyframes and portraits use the same map, keyed by scene or character id |
| No reference | If the shot tags a character with `identityLocked === true` and no `imageUrl`, the ShotInspector shows the `NO REF` `InlineBanner` (§9.6.2) above Generate, and the frame's cluster row shows `NO REF` in `text-warning` (§9.4.5). G and Generate stay enabled (no behaviour change). The raw `characters` row's `identityLocked` survives `toCharacter`'s spread (`useShotboard.ts:53`), but `CharacterDetails` (`lib/shotboardTypes.ts:77-85`, never touched) does not declare it, so read it through the local type `CharacterDetails & { identityLocked?: boolean }` |
| Transfer lock | While `transfer.status === 'running'`, 'Generate image'/'Regenerate image', G, 'Expand', 'Generate keyframe' and 'Generate portrait' are `aria-disabled` with the reason 'Transfer in progress' |
| Takes (cut-able) | Before a successful regenerate overwrites `imageUrl`, push the old URL to `takes[shot.id]` (max 6, session-local) |
| Keyframe, portrait | `generateSceneKeyframe` and `generatePortrait` keep `:138-185` verbatim (board model, prompts, refs, `'1:1'`). They add job phases and the inline errors 'Add a scene description first', 'Keyframe generation failed: ' and 'Portrait generation failed: ' |

**`usePromptExpansion(sb, expandPrompt)`:**
- If `!expandPrompt`, the Expand button is `aria-disabled` with the reason 'Prompt expansion requires an authenticated Convex connection'.
- Otherwise it runs `await sb.flush(); await sb.settled()`, then exactly `:123-133` with `sourceRevision = sbRef.current.board?.revision`.
- On failure it shows an inline `role="alert"`: 'Prompt expansion failed: <msg>'.

#### 9.5.5 Selection and keyboard

`useShotboardSelection` holds `selection: { kind: 'board' } | { kind: 'scene'; id } | { kind: 'shot'; id; sceneId } | { kind: 'character'; id }`.
- Selecting a shot also selects its scene (the rail highlights it).
- On delete, the selection falls back in this order: next shot in the scene → previous shot → its scene → board.
- A new scene, shot or character is selected when its `add*` promise resolves.

Canvas keys act only when `event.target` is a `[role="gridcell"][data-shot-id]`, never inside inputs, and every handler calls `preventDefault`. None is global (WCAG 2.1.4). Home/End are added to the §7.12 Shotboard row so the ShortcutSheet lists them.

| Key | Action |
|---|---|
| ← / → | Previous/next shot in the scene; at an edge, the last shot of the previous scene / first shot of the next |
| ↑ / ↓ | Same index (clamped) in the previous/next scene; an empty scene focuses its 'First shot' button |
| Home / End | First/last shot of the scene |
| Enter (or double-click) | At ≥ 1280, focus the Idea textarea. Below 1280, open the inspector Sheet |
| G | Same as the Generate button (ignored while that shot's job runs or a transfer runs) |
| `[` / `]` | Duration −1 / +1 s (min 1, max 120); `announce('Duration 9 seconds')` |
| mod+Backspace | Delete the shot with the undo chyron (ignored while its job runs) |

**Roving focus.**
- Exactly one gridcell per lane has `tabIndex=0`: the selected one, or else the first.
- Tab from the selected cell reaches its three cluster buttons, then leaves the lane.
- The grid's `aria-describedby` points to an sr-only hint (its id comes from `useId()`): "Arrow keys move between shots. Enter opens the inspector. G generates. Left and right brackets change the duration. Command or Control plus Backspace deletes."
- Moving focus calls `el.scrollIntoView({ block: 'nearest', inline: 'nearest' })`.

**Palette commands (§7.11):** `shotboard.newBoard` "New board", `shotboard.send` "Send to Director" and `shotboard.generate` "Generate selected shot". Each is `enabled` exactly when its button is enabled.

#### 9.5.6 Contact-sheet view (9D, cut-able)

`ShotContactSheet` does not use `ContactSheet` (§7.5, a flat review grid). It renders, per scene, a `<section aria-labelledby>` (the id comes from `useId()`) holding:
- The divider heading, an `<h3>` as in the Board view: `SCENE 02 · {title} · 4 SHOTS · 00:32` in `label text-fg-3`; the user's title keeps its own case.
- Then a `div role="grid"` holding one `div role="row"` with `display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 8px`, whose children are `ShotFrame variant="sheet"` gridcells. Each tile shows the picture at the board aspect, the exposure number `02-03` in `micro`, and the prompt clamped to 2 lines in `caption`.

Selection, Enter and the cluster behave as in the Board view. Keys: ←/→ move in reading order, ↑/↓ move between scenes.

#### 9.5.7 Drag reorder (9D, cut-able; the buttons are the required path)

`motion` 13.2.0 exports `Reorder`, with `Group` and `Item`, from `motion/react` (verified: `Object.keys(require('motion/react').Reorder)` → `['Group','Item']`).
- **Groups and items.** `Reorder.Group` and `Reorder.Item` default to `<ul>`/`<li>`, so each sets `as` to keep the grid markup:
  - Lanes: `<Reorder.Group as="div" role="row" axis="x" values={ids} onReorder={setDraftIds}>` is the lane's row, and each frame's gridcell is `<Reorder.Item as="div" role="gridcell" value={id} dragListener={false} dragControls={controls}>`. In 9D, ShotFrame's root attributes (`role`, `tabIndex`, `aria-selected`, `aria-label`, `data-testid`, `data-shot-id`, `data-phase`, `data-selected`) move to that item, so no element sits between the row and its gridcells.
  - Rail: `<Reorder.Group as="ol" axis="y" …>` is the `ol aria-label="Scenes"`, and each row is `<Reorder.Item as="li" …>`.
- **Handles:** each `Reorder.Item` sets `dragListener={false}` and starts only from a `GripVertical` handle (`useDragControls`), so clicks elsewhere still select.
  - In a lane: 20×28 px at the left of the frame's cluster row, on the selected or hovered frame (20 + 3 × 28 = 104 px, within the 120 px minimum block).
  - In the rail: 16×56 px at the left edge of the row.
- **Commit:** once, on drag end: `reorderShots(sceneId, draftIds)` or `reorderScenes(draftIds)`.
- **Motion:** layout transition `{ duration: 0.12, ease: [0.3, 0, 0, 1] }` (`--dur-fast`, `--ease-key`); `duration: 0` under reduced motion. The dragged item gets `shadow-e2` and a 1 px accent outline, with no scale, rotation or spring.
- Cross-scene moves are not offered.

'Move shot earlier/later' and 'Move scene up/down' remain the single-pointer and keyboard path (WCAG 2.5.7).

> Note: `motion/react` is imported only by `SceneRail.tsx` and `SceneTrack.tsx`, for `Reorder` only, and only while 9D ships (§12.1 rule 4). Cutting 9D removes both imports.

### 9.6 States

#### 9.6.1 Route and board states

The body state is computed in the order of this table. The slate bar renders in every state except S1 and S2, where the skeleton draws it, and S7, where the boundary replaces the view.

| # | State | Condition | Rendering | Exact copy |
|---|---|---|---|---|
| S1 | Route loading | Navigation pending | `app/admin/shotboard/loading.tsx`: its shape, loader slot and caption are §6.3's. 9A swaps its RouteSkeleton for `ShotboardSkeleton` | The §6.3 caption "Loading Shotboard" |
| S2 | Suspense fallback | The `useSearchParams` bail-out during SSR | `page.tsx`'s `<Suspense fallback={<ShotboardFallback/>}>`, where `ShotboardFallback` renders `<div className="route-fallback" aria-busy="true"><ShotboardSkeleton loader={<CoastLoader size={64} label="Loading Shotboard" />} /></div>`. Same geometry as the page, so the SSR HTML is no longer empty | "Loading Shotboard" |
| S3 | Auth resolving | `sb.persistent && auth.isLoading` | `ShotboardSkeleton.Body`, shown through `useDelayedFlag(loading, { delayMs: 150, minMs: 300 })` | sr-only `role="status"` 'Loading shotboard…' |
| S4 | **No access** | `sb.persistent && !auth.isLoading && !auth.isAuthenticated`. Checked **before** S5, because `load` returns `{ board: null }` when signed out | `<AuthRequired size="route"/>` (API §7.5; kicker `NO ACCESS`, art `slate/no-access`, §6.13). 'New board' is `aria-disabled` with the reason "Sign in to create boards" | AuthRequired copy: §11.D.7 |
| S5 | **Not found** | `sb.loadState === 'missing'` | `<Slate kind="not-found" size="route">` (kicker `CH 404`, art `slate/not-found`) | Title "This board is gone"; body "It was deleted, or the link points to a board that doesn't exist."; action `<Button variant="secondary">Back to boards</Button>` → `sb.selectBoard(null)` + `router.replace('/admin/shotboard', { scroll: false })` |
| S6 | Board loading | `sb.loading` | `ShotboardSkeleton.Body`, delayed as in S3. The h1 shows the title from `sb.boards` when it is known | sr-only `role="status"` 'Loading shotboard…' |
| S6b | **Board blocked** | `sb.loadState === 'error'`: `load` answered for this board, but hydration is held behind a rejected write (§9.5.2) | `<Slate kind="error" size="route">` (kicker `SIGNAL LOST`) | Title "This board could not load"; body "An earlier change was not saved, so the board cannot refresh."; action `<Button variant="secondary">Reload board</Button>` → `sb.reload()` |
| S7 | Error boundary | `useQuery` threw inside `ConvexShotboard`, for example on a malformed `?board=` | `ShotboardBoundary` renders `<h1>Shotboard</h1>` (`h2` at `headingLevel={2}`) + `<Slate kind="error" size="route">` (kicker `SIGNAL LOST`). The gate renders `<ShotboardBoundary key={params.get('board') ?? ''}>`, so the boundary resets itself whenever `?board=` changes | Title "This board could not load"; body: `error.message` in `code` (one line, ellipsis); actions "Back to boards" (only `router.replace('/admin/shotboard', { scroll: false })`; the key change resets the boundary after the URL commits, so the stale id is never re-read) and "Retry" (the boundary's `reset()`) |
| S8 | Empty | Persistent: `loadState === 'idle'`. Local: `!sb.board` (a local `?board=` can never resolve) | `<Slate kind="empty" kicker="BLANK BOARD" art="shotboard" size="route">` | Title "No board open"; body 'Create a board or pick a saved one to start laying out scenes and shots.'; actions `<Button variant="secondary" icon={Plus}>Start a board</Button>` (same handler as 'New board') and, when `sb.boards.length > 0`, `<Button variant="ghost">Open latest board</Button>` (the board with the highest `updatedAt`) |
| S9 | **Not configured** (local mode) | `!sb.persistent` (the banner shows above S8 or the editor) | The editor stays fully usable. `.sb-banner` holds `<InlineBanner tone="warning" kicker="NOT PATCHED">` with the exact sentence. The board select, 'Delete board' and 'Send to Director' are hidden (as at `:197`, `:233`, `:271`). The save LED reads `Local only` | 'Convex not configured — this board lives only in this page’s state and cannot be sent to Director.' (U+2014 em dash, U+2019 apostrophe) |
| S10 | Zero scenes | A board is open and `scenes.length === 0` | Canvas: one dashed `surface-panel` block, 168 px tall, with the caption. Inspector: Board | "No scenes yet. Start the track from the scene rail." |
| S11 | Zero shots in a scene | Lane | A dashed 'First shot' button, picture-sized | 'First shot' |
| S12 | Air lock | Not reachable: leaving Live Control under the lock ends the session (§6.12). Primitives still honour `deriveLock`; there is no route-specific behaviour | — | — |
| S13 | Offline | `navigator.onLine === false` | The shell's OfflineBanner (§7.6; copy §11.D), with the §9.4.1 offline offset. Writes that fail light the save LED's error state (§9.6.2) | — |

> Note: the bible quotes this sentence with a straight apostrophe ("page's"). The code renders `page&rsquo;s` (`ShotboardPage.tsx:292`), which is U+2019. U+2019 is the preserved form.

#### 9.6.2 In-editor states

| State | Where | Rendering | Exact copy |
|---|---|---|---|
| Shot, no image | Picture | A 25% Bayer `ramp-1` field + `<PixelFace text="SH03" cell={2} srText={null} aria-hidden>` (decorative: the gridcell's `aria-label` carries the name) in `text-fg-on-screen-2`, centred | — |
| Queued / running | Picture | `<GenerationFrame phase modelId modelLabel startedAt={job.phaseSince} queuePosition previousUrl={shot.imageUrl} src={job.src ?? shot.imageUrl} ratio={aspect}>` (§6.6), plus `announce="progress"` on track frames (the inspector renders the inline `role="alert"`). Before the first status arrives, the phase is `queued` with no position | Long forms `QUEUE --`, `QUEUE 03`, `RENDER 00:14.2 · ~00:22`; each frame picks the long or the §6.6 compact form from its own width (see below) |
| Landed | Picture | The job enters `done` only once `generate()` has resolved and `src` is set (§9.5.4). The frame then runs `img.decode()` → `.px-resolve` (160 ms), then a `SAVED` plate for 900 ms | `SAVED` |
| Failed | Picture + inspector | `phase="failed"` with `onRetry`, which re-runs generation. The inspector shows a `role="alert"` under the button. A persisted `imageStatus === 'failed'` with no job renders the same way, with the reason "Last attempt failed" | `SIGNAL LOST · <reason>`; 'Image generation failed: <msg>' |
| Interrupted | Picture | A persisted `imageStatus === 'generating'` with no job (the page was reloaded mid-generation) shows the failed plate | `SIGNAL LOST · Interrupted` |
| No prompt | Idea field | A `Field` error with `role="alert"`. G announces it assertively | 'Give the shot a prompt or direction first' |
| Expanding / failed / unavailable | GMI card | §9.5.1 row 5 | 'Expanding…'; 'Prompt expansion failed: <msg>'; 'Prompt expansion requires an authenticated Convex connection' |
| Keyframe | Scene inspector + rail thumb | A GenerationFrame in the well; a 12 px `BayerSpinner` on the thumb | 'Generating…'; 'Add a scene description first'; 'Keyframe generation failed: <msg>' |
| Portrait | Character inspector + cast avatar | A GenerationFrame in the 1:1 well; a 12 px `BayerSpinner` over the avatar | 'Generating…'; 'Portrait generation failed: <msg>' |
| Mention menu | Idea field | The §9.8 combobox. With no match, it shows a non-option row | 'Unknown character handle' |
| Save state | `SaveLed` | **local:** `<Led tone="off" label="Local only">`.<br>**saved:** `<Led tone="success" label="Saved">`.<br>**saving:** `<Led tone="accent" label="Saving…">`, shown only after a write has been in flight for 150 ms, and held for at least 300 ms.<br>**error:** a `<button aria-expanded aria-controls>` (the Popover id comes from `useId()`) holding `<Led tone="danger" label="Couldn't save">`. It opens a Popover with `syncError.message` in `code`, "Copy details" and "Reload board". The first transition to error also pushes a sticky error chyron | "Couldn't save"; chyron title "Couldn't save changes", body = the message, action "Reload board" |
| Reload board | ConfirmDialog | `destructive`, `cancelLabel="Keep editing"` | Title "Reload this board?"; body "Unsaved changes on this page are discarded and the board reloads from Convex."; confirm "Reload board" |
| Delete board | ConfirmDialog | `destructive`, `typeToConfirm={board.title.trim() \|\| 'Untitled'}`, `cancelLabel="Keep board"`. Confirm → `sb.deleteBoard()` + `router.replace('/admin/shotboard')` + an info chyron | Title "Delete this board?"; body "“{title}”, its {s} scenes, {n} shots and board-only characters are deleted permanently. Library characters are not affected. Type the board title to confirm."; confirm "Delete permanently"; chyron "Board deleted" |
| Delete shot | Chyron | `useUndoDelete`: take a snapshot → `deleteShot` → `chyron.push({ tone: 'info', title: 'Shot {n} deleted', body: 'SC02 · SH03', action: { label: 'Undo', run: () => restoreShot(snap) }, ttlMs: 8000 })`. In local mode, Undo re-inserts the snapshot with its original id | "Shot 3 deleted" · "Undo" |
| Delete scene | Chyron | Take a snapshot of the scene and its shots → `deleteScene` → undo chyron (`restoreScene`). The button is `aria-disabled` with the reason "Wait for the generation to finish" while any of the scene's shots is generating | "Scene 2 deleted", body "{k} shots removed with it." · "Undo" |
| Delete character | ConfirmDialog (board-local only) | `destructive`, `cancelLabel="Keep character"` | Title "Remove {name}?"; body "{name} is archived and untagged from every shot on this board."; confirm "Remove character" |
| Library character | Inspector | Read-only; no delete, no generate | `LIBRARY`; "Edit in Characters" |
| New board failure | Chyron | The `createBoard` rejection is caught (today it is an unhandled rejection, `:214`) | "Could not create board: <msg>" |
| Add or restore failure | Error chyron | A rejected `add*`/`restore*` write (§9.5.2); body = the error message | "Could not add scene", "Could not add shot", "Could not add character"; "Could not restore scene", "Could not restore shot" |
| No reference | ShotInspector, above Generate + cluster row | §9.5.4 no-reference condition. `<InlineBanner tone="warning" kicker="NO REF">`; G and Generate stay enabled | "@{handle} has no reference image on this board; the model will invent a face."; cluster row `NO REF` |
| Transfer | `TransferSheet` | Below | Below |

**GenerationFrame at track size.** The compact forms at ≤ 199 px, and the rule that `QUEUE --` reads the same at every size, are §6.6's ("Compact frames"; API §7.5); this route adds nothing to the component. Which Shotboard pictures are compact follows from their widths: every 1× track picture (90–128 px), the 2× 9:16 and 1:1 track pictures (180 and 192 px) and the 9:16 inspector picture (144 px). The 2× 16:9 track picture (256 px) and the 16:9 and 1:1 inspector pictures (320 and 256 px) show the long forms. A compact failed frame drops the reason from its plate; the reason stays in the frame's `aria-label` and the inspector's `role="alert"`.

**TransferSheet** (`<Sheet side="right" width={400} title="Send to Director" dismissible={transfer.status !== 'running'} reason="Wait for the current batch or stop the transfer">`, `data-testid="transfer-sheet"`; `dismissible` and `reason` are §7.3's Sheet props):
- Description: "Load this board's compiled script in the Director".
- **PREFLIGHT** (`label` kicker): one `Led` row per check, recomputed live while the sheet is open.

| Row | Success | Otherwise |
|---|---|---|
| Edits | "All edits saved" | accent "Saving…"; danger "Couldn't save" + "Reload board" |
| Generations | "No generations running" | warning `{k} generation{k === 1 ? '' : 's'} still running`: any `useShotGeneration.jobs` entry (shot, keyframe or portrait) is `queued` or `running`, or a `usePromptExpansion` job is running |
| Opening frame (`firstFrameUrl()`) | "Opening frame: SC01 · SH01" | warning "The first shot has no image. The Director starts without an opening frame." + "Show shot". Jump actions select the shot and close the sheet; they are disabled while running |
| Images | "{n}/{n} shots have images" | warning "{k}/{n} shots have images" + up to 5 jump `Chip`s `SC02 · SH03` and "+{m} more" |
| Director prompts | "Every shot has a current Director prompt" | accent: `{n} shot{n === 1 ? '' : 's'} need Director expansion before transfer.` (verbatim from `:288`, including its pluralisation) |
| Empty prompts | (row hidden) | warning "{k} shots have no prompt and are sent without one." |
| Runtime | `{n} beats · {s}s runtime` + an `ESTIMATE` Badge + the caption "The Director compiles the final script on the server; wording can differ." | — |

- **Progress:** ``<StageTrack label="Transfer progress" orientation="horizontal" stages={[{ id: 'save', label: 'Save edits' }, { id: 'expand', label: `Expand prompts ${done}/${total}` }, { id: 'prepare', label: 'Prepare transfer' }, { id: 'open', label: 'Open Live Control' }]} current={transfer.status === 'idle' ? null : transfer.stage} status={transfer.status === 'done' ? 'done' : transfer.status === 'failed' ? 'failed' : 'running'} />`` (API §12.3.6). A stopped run shows the Stopped banner in its place.
- **Per-shot list** (after start): `<ol aria-label="Director expansion">`, max-height 280 px. Each row shows `SC02 · SH03`, a `Led`, and a state word: `QUEUED`, `EXPANDING 00:41.2`, `DONE`, `FAILED · <reason>` or `SKIPPED · NO PROMPT`.
- **Footer** (a dialog never adds a second primary, §7.3):
  - `<Button variant="secondary">Close</Button>`;
  - while running, `<Button variant="secondary">Stop after this batch</Button>`;
  - after failures, `<Button variant="secondary" icon={RotateCcw}>Retry failed</Button>`;
  - `<Button variant="secondary" icon={Send} pending pendingLabel="Transferring…">Start transfer</Button>`. It is `aria-disabled` with the reason "Fix the save error first" while `syncState === 'error'`, and with the reason 'Wait for running generations to finish' while the Generations row is not in its success state.
- **While running**, the sheet cannot close: `dismissible` is false, so the Sheet ignores Esc's `cancel` and the backdrop, and its header close button is `aria-disabled` with the `reason`; the footer Close is `aria-disabled` with the same reason. Generation and Expand are locked (§9.5.4), and a run cannot start while a job is running, so no edit or job can bump the revision mid-transfer. The slate-bar button shows 'Preparing…'.
- **Errors:** `<InlineBanner tone="danger">` with `role="alert"`: 'Could not prepare Director transfer: <msg>'.
- **Stopped:** `<InlineBanner tone="info">` "Transfer stopped. {k} of {n} prompts were expanded and saved."

#### 9.6.3 Visual fixture

`ShotboardVisualFixture` renders its own root, `<section id="shotboard-visual-test">`; §10.5.9's page only imports it and renders `<ShotboardVisualFixture />`. It passes `headingLevel={2}` to every `ShotboardView` and `ShotboardBoundary` it renders, so the fixture adds no `h1` to `/admin/visual-test`. It uses fixture data and these injected fakes:
- `generate` resolves to a `data:image/svg+xml` frame after emitting `queued 2 → running`;
- `expandPrompt` resolves after 1500 ms;
- `prepareDirector` returns `'fixture-transfer'`;
- `navigate` writes to `statusMessage`;
- `authState` is fixed;
- the fake `sb` (a `ShotboardState` built from fixture data) has a fixture-only Switch 'Reject writes', off by default. While it is on, `addScene`, `addShot`, `addCharacter`, `restoreShot` and `restoreScene` reject with `Error('fixture write rejected')`.

It renders:
1. The editor with a fixture board in `persistent: true` mode: 3 scenes and 7 shots, every one with a prompt and 3 with a current Director prompt; 2 board-local characters and 1 library character, @coast (`handle: 'coast'`, no `imageUrl`, `identityLocked: true`), tagged on SC01 · SH02; 16:9; board model `nano-banana`; one shot with `imageModel: 'gpt-sunburst'`.
2. A `ShotFrame` matrix: empty, queued (no position), queued 03, running at 0.5×ETA, done, failed (persisted `imageStatus: 'failed'`, no job) and interrupted, each at 16:9 1× (128 px, compact forms) and again at 16:9 2× (256 px, long forms); 9:16 and 1:1 pictures; and a 24 s hold.
3. The S4, S5, S6b, S7, S8 and S9 bodies side by side.

It never mounts a Convex hook and never calls fal or GMI (§10).

### 9.7 Motion

| Moment | Spec | Reduced motion |
|---|---|---|
| Selection moves | Brackets and inspector **cut** (no tween); focus ring per §5 | Same |
| Duration change | The block width snaps; later frames shift in the same frame (information moving) | Same |
| New scene, shot or character | The row or frame resolves over 120 ms (`--px-resolve-dur: 120ms`) once the id returns | Instant |
| Delete | The removed item fades over 80 ms (0.66 × 120); an undo re-entry resolves over 120 ms | Instant |
| Reorder by button | Cut | Same |
| Reorder by drag (9D) | `motion` layout 120 ms `--ease-key`; no scale, rotation or spring | `duration: 0` |
| Generation | GenerationFrame per §6.6 (field at ≤ 4 Hz, stepped scanline, DecryptedText on phase change); the landing is a 160 ms `px-resolve` | Static 25% field + text; 150 ms crossfade on landing |
| Skeleton → content | Per §6.8, the content root gets `.px-resolve` only if the skeleton was shown | Instant |
| Runtime readout | CountUp once on first reveal (600 ms, 12 fps); later changes snap | Final value |
| Save LED | Tone changes snap (`--dur-tick`); 'Saving…' is gated by `useDelayedFlag` | Same |
| Sheets / dialogs / popovers | 320 ms / 160 ms / 200 ms per §7.3 | Instant |
| Slates | One 160 ms `px-resolve` on mount | Instant |
| StageTrack | Steady squares; no pulse | Same |
| Hover | Outline colour only (`--dur-fast`); never a transform | Same |

Only four things loop: the GenerationFrame scanline while `running`, BayerSpinners while pending, CoastLoader in the route fallback, and the skeleton sweep. Nothing blinks.

The route runs **no effect canvas**:
- GenerationFrame is CSS-only.
- DitherAvatar canvases are exempt (§7.16).
- AccordionGallery, ChromaGrid and GSAP are gone from the route.
- The WebGL context count stays at 1 (the carrier).

### 9.8 Accessibility

- **Headings and landmarks:**
  - Exactly one h1: the board title, or "Shotboard" (`h2` in the fixture, which passes `headingLevel={2}`, §9.6.3).
  - h2s: "Characters", "Scenes", the sr-only "Shot track", and the inspector title. One h3 per scene track.
  - Landmarks: the rail is `<aside aria-label="Scenes and cast">`, the canvas is `<section aria-label="Shot track">`, and the inspector is `<aside aria-label="Inspector">`.
- **Canvas:**
  - Each scene lane is one `role="grid"` with `aria-label="SC 01 · {title} shots"` and one `role="row"`.
  - Frames are `role="gridcell"` with `aria-selected` and roving tabindex (§9.5.5).
  - A frame's `aria-label` is `SC02 · SH03 · IN 00:24 · 8s · Medium Shot · {first 60 chars of activeImagePrompt or "no prompt"} · {No image | Image | Generating | Failed: {reason}}`. The gridcell's label carries the failure reason because a compact frame drops it from its plate (§6.6).
  - GenerationFrame supplies `aria-busy` and one announcement per phase (§6.6).
- **Mentions:** the Idea textarea is an ARIA 1.2 combobox.
  - Attributes: `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` (the listbox id, from `useId()`), `aria-activedescendant` (option ids derived from the same `useId()` value).
  - Trigger: `/@([a-z0-9_-]*)$/i`, tested on `value.slice(0, selectionStart)`, so it matches at the caret, not at the end of the text.
  - Keys: ↑/↓ move, Enter or Tab inserts, Esc closes. Blur closes without a timer.
  - At most 6 `role="option"` rows, each with a 24 px portrait, `@handle` and a `LIBRARY` Badge where it applies.
  - Insert keeps `insertMention` (`ShotCard.tsx:54-60`): replace the token before the caret with `@${handle} ` and patch `{ promptIdea, expandedPrompt: '', characterIds: [...new Set([...assigned, character.id])] }`.
- **Names:** every select, input and textarea has a visible `Field` label or an `aria-label` equal to its preserved `title`. The model and board selects add an `aria-label` equal to their existing `title` text, so their accessible names do not change.
- **Targets:** IconButtons are 28 px, with 44 px hit areas on `(pointer: coarse)`. No target is below 24 px except the 9D drag grips (20×28 and 16×56), which have button equivalents (the WCAG 2.5.8 equivalent-control exception). The icons outside the §5 icon list (`ArrowUp`, `ArrowDown`, `ChevronLeft`) were verified in lucide-react 0.294.0 with `node -e "require('lucide-react').ArrowUp"`.
- **Disabled vs pending:** pending buttons use `aria-busy`/`aria-disabled` and keep focus (§6.9). Reasons appear in Tooltips and serve as the accessible description.
- **Live regions:**
  - Errors are inline `role="alert"` next to their trigger, plus an error chyron when the trigger is off-screen.
  - Undo chyrons are `role="status"`.
  - The save LED has no `aria-live`, because it would speak on every keystroke.
- **Colour:** LEDs always carry their label. STALE, CURRENT, IDEA and GMI are text badges. Text on screen material uses only `text-fg-on-screen`/`text-fg-on-screen-2`.
- **Focus:**
  - Opening the inspector Sheet moves focus to its first field; closing it returns focus to the frame.
  - After 'New board', focus is in the title input.
  - After a delete, focus moves to the new selection.
  - After a move by button ('Move scene up/down', 'Move shot earlier/later'), focus stays on the same button. If the reorder detached it, a layout effect calls `focus()` on it again. At the ends the button is `aria-disabled`, so focus never drops to `<body>`.
- **Reduced transparency and contrast:** every surface is a token (§5), so both media queries apply with no page code.

### 9.9 Preserved contract

#### 9.9.1 Invariants from `docs/redesign/audit/shotboard.md` (verbatim)

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

> Note: the last invariant is met by its second option: §5 coordinates the `fal-primary` → chrome change across all surfaces, so no `--sb-*` palette is added. The AccordionGallery/ChromaGrid invariant is met by no longer using them on this route; their files are untouched.

#### 9.9.2 Invariants from `docs/redesign/audit/states.md` that apply here (verbatim)

- admin-testing skill (.agents/skills/admin-testing/SKILL.md): the Director card is the only Live Control content. Its button text is exactly 'Start Director'. A failed start must show an error AND restore the Start control. Per-page console must contain only the React DevTools info message, so loaders and animations must not console.log/warn. Do not add three.js forceContextLoss on unmount, because it logs 'THREE.WebGLRenderer: Context Lost.'.
- aria-labels to preserve: nav 'Admin sections'; 'Delete board'; 'Board visual style'; 'Move shot earlier'; 'Move shot later'; 'Delete shot'; `Image prompt for shot ${n}`; 'Move scene up'; 'Move scene down'; 'Delete scene'; 'Delete character'; 'Remove element'; 'Clear'; 'Image accordion gallery' (role=list); 'Coast audio artwork' (aria-roledescription carousel); 'Coast originals artwork carousel'; 'Previous song artwork'; 'Next song artwork'; 'Song artwork' tablist with `Show ${caption}` tabs; 'Music mix volume'; 'Music start offset'; `Delete ${track.name}`; `Preview ${track.name}`; 'Reference images'; 'Use as primary image'; 'Remove reference from this item'; DitherAvatar `${name} avatar` role=img.
- Query-param contracts: `/admin/shotboard?board=<id>` preselects a board (useSearchParams) and needs a Suspense boundary; `/admin?transfer=<id>` and `/admin?board=<id>` are read by ScriptTemplatePicker; Twitch OAuth returns to `/admin?code&state` and TwitchBroadcast strips them with history.replaceState.
- Convex calls unchanged: api.clips.list {limit:100}; api.recordings.list {limit:100}; api.recordings.remove (behind confirm('Delete this recording permanently?')); api.recordings.deleteStorage; api.tracks.list/generateUploadUrl/add/remove; api.assets.* (listCharacters, listLocations, create/patch, removeReference, seedStarterLibrary, startGeneration, completeGeneration, failGeneration, generateUploadUrl, listAssetHistory, getCharacter, recordUpload, getStorageUrl); api.shotboards.*; api.promptExpansion.start and .expand; api.director.prepare and .get; api.twitchStats.record and .history; useDirectorPersistence mutations. Hooks must stay mounted only under ConvexProvider (the `useConvexEnabled()` gates).
- fal access only via FAL_SDK_PROXY_URL / createFalClient({proxyUrl}) so FAL_KEY stays server-side. Adding onQueueUpdate/logs to fal.subscribe is fine; changing endpoints or inputs is not.
- dither-kit files (components/dither-kit/*) are hash-locked by dashboard/dither-kit.json: consume via props, imports and wrappers only. components/reactbits/* is not locked and may be edited.
- Shotboard safety: selectBoard clears board/scenes/shots/characters before the next load (useShotboard.ts:183-195); hydration is skipped while pendingWritesRef has writes; Send to Director awaits flush() before prepare.

#### 9.9.3 Where every preserved Shotboard string lands

| String (verbatim) | Source | New home |
|---|---|---|
| 'Shotboard' | `ShotboardPage.tsx:194` | The h1 when no board is open; the nav label is unchanged |
| 'Saved shotboards' (title) · 'New / unsaved board' · 'Untitled' | `:202`, `:204`, `:207` | Board `Select` title + `aria-label`; its first option; the option fallback |
| 'New board' · 'Untitled Shotboard' | `:218`, `:214` | Slate-bar Button label; `createBoard` argument |
| 'Board visual style' (title and aria-label) · 'Board style…' | `:226-229` | Style `Select`; its first option |
| 'Send to Director' · 'Preparing…' · "Load this board's compiled script in the Director" | `:265-268` | Primary Button label / pendingLabel / title; TransferSheet title and description |
| 'Delete board' | `:276` | IconButton label |
| 'Build scenes of shots with generated keyframes — the board compiles to the timed script the Director runs.' | `:286-287` | Board inspector caption |
| '{n} beats · {s}s runtime' | `:287` | `RuntimeReadout`; TransferSheet runtime row |
| '{n} shot(s) need Director expansion before transfer.' | `:288` | TransferSheet preflight row |
| 'Convex not configured — this board lives only in this page’s state and cannot be sent to Director.' | `:292` | `InlineBanner` |
| 'Loading shotboard…' | `:300` | The sr-only `role="status"` of the in-page skeleton |
| 'Create a board or pick a saved one to start laying out scenes and shots.' | `:371` | BLANK BOARD slate body |
| 'Add scene' | `:364` | Rail Button |
| 'Give the shot a prompt or direction first' · 'Prompt expansion requires an authenticated Convex connection' · 'Add a scene description first' · 'Director transfer is unavailable' | `:93`, `:125`, `:144`, `:239` | Idea field error · Expand disabled reason · keyframe field error · transfer error |
| 'Image generation failed: ' · 'Prompt expansion failed: ' · 'Keyframe generation failed: ' · 'Portrait generation failed: ' · 'Could not prepare Director transfer: ' | `:116`, `:135`, `:160`, `:181`, `:261` | Inline `role="alert"` next to each trigger (plus an error chyron when off-screen) |
| 'Move scene up' · 'Move scene down' · 'Add shot' · 'Delete scene' · 'First shot' · 'Choose location' | `SceneSection.tsx:74`, `:82`, `:88`, `:90`, `:117`, `:69` | Rail row · rail row · track header · track header · empty lane · LocationPicker trigger |
| `Scene ${scene.sceneNumber}` (placeholder and fallback) | `SceneSection.tsx:66`; `SceneGallery.tsx:24` | Scene title placeholder; rail and track title fallback |
| 'Move shot earlier' · 'Move shot later' · 'Delete shot' | `ShotCard.tsx:75`, `:78`, `:81` | Frame action cluster |
| 'Generate image' · 'Regenerate image' · 'Generating…' · 'Re-generate / edit the keyframe with the selected model' · 'Generate a keyframe image' | `:106`, `:109` | Inspector generate Button label / pendingLabel / title |
| 'Shot duration in seconds (drives the beat offset)' · 's' | `:130`, `:132` | NumberStepper input title / unit |
| 'Image prompt or direction for this shot…' · `Image prompt for shot ${shot.shotNumber}` | `:141`, `:143` | Idea textarea placeholder / aria-label |
| 'Unknown character handle' | `:151` | Mention listbox |
| 'Expand' · 'Expanding…' · 'Expand this prompt with GMI' · 'Undo expansion' | `:159-164` | GMI card |
| 'Details' · 'Visual prompt (image gen)' · 'Detailed prompt for the keyframe image…' · 'Dialogue (optional)' · 'Sound effects (optional)' · 'Audio at this beat' · 'Audio URL or upload' · 'Keyframe image URL' · 'Image URL or upload' | `:178-213` | Inspector Details disclosure and Visual card |
| SHOT_TYPE_OPTIONS labels ('Wide Shot' … 'Insert Shot') | `lib/shotboardTypes.ts:87-101` | Shot type Select |
| 'Untitled shotboard' · 'Add a board description…' · 'Select a scene to edit its details.' | `SceneSidebar.tsx:57`, `:64`, `:70` | h1 input placeholder · Board inspector · Board inspector |
| 'Scene description' · 'Location & time' · 'Atmosphere & elements' · 'Camera environment' · 'What happens in this scene…' · 'Location' · 'Time of day' · 'Weather' · 'e.g. neon-lit, crowded, tense and quiet' · 'Specific element…' · 'Add' · 'Remove element' · 'e.g. street level with reflections, aerial view' · 'Generate keyframe' | `SceneSidebar.tsx:73-146` | Scene inspector |
| 'Characters' · 'New' · 'No characters yet — add one, generate its portrait, then tag it on shots.' · 'Name' · 'Delete character' · 'Appearance, outfit, style — used in prompts' · 'Portrait URL or upload' · 'Generate portrait' · 'Regenerate portrait' | `CharacterPanel.tsx:57-115` | CastStrip and Character inspector |
| 'Image model used for generation' · 'GPT Image 2.5 quality — higher = more detail, slower, pricier' · 'Nano Banana 2' · 'GPT Image 2.5 Flare' · 'GPT Image 2.5 Sunburst' | `ImageModelSelect.tsx:25`, `:38`; `lib/imageModels.ts:47`, `:55`, `:65` | Model and quality selects (title + aria-label), ModelChip, GenerationFrame plate |
| Model ids 'nano-banana' · 'gpt-flare' · 'gpt-sunburst'; `DEFAULT_IMAGE_MODEL` | `lib/imageModels.ts:46`, `:54`, `:64`, `:75` | Unchanged; the only values ever written to `imageModel` |
| 'Clear' | `AssetUrlInput.tsx:79` | Unchanged (the component is reused) |
| `?board=<id>`; `/admin?transfer=<id>` | `ShotboardPage.tsx:31-41`, `:260` | Read as the initial board (unchanged); written back with `router.replace` on selection, in Convex mode only; the transfer URL is unchanged |

#### 9.9.4 Allowed changes on this route (D6 list; nothing else changes)

1. The shot card label (`ShotCard.tsx:71-72`; 'Shot {n}' under CSS `uppercase` at 845147c, authored as `SHOT {n}` with no `uppercase` class in M2, §5.20.5) is removed with ShotCard in 9B. Frames show the authored-uppercase slate tag `SC02 · SH03 · 8s`, and the inspector title renders "Shot {n}" with no `text-transform`. `ShotCard.tsx` is never an uppercase-allowlist entry (§5.20.5), so the allowlist does not change.
2. 'Choose from character gallery' (`ShotCard.tsx:169`) is removed with the per-card AccordionGallery; cast chips replace it.
3. 'Scene keyframe (drives the gallery strip)' becomes 'Scene keyframe (drives the scene rail thumbnail)' (`SceneSidebar.tsx:82`), because the strip no longer exists.
4. The placeholder '$HANDLE' becomes 'handle', and the title 'Prompt anchor (e.g. $COAST)' becomes 'Prompt anchor (e.g. @coast)' (`CharacterPanel.tsx:88-89`), as the audit asks. Handles are normalised to `[a-z0-9_-]`.
5. The runtime pattern loses the sentence's trailing '.' (`:287`); the pattern itself is unchanged.
6. The amber status line (`:290`) is removed in 9B (9A keeps it as one `role="alert"` line, §9.2). Each message moves verbatim to an inline alert (plus a chyron when off-screen). Errors become `danger`; advisories stay `warning`.
7. The Director-expansion sentence (`:288`) moves from the header to the TransferSheet preflight, unchanged.
8. Library characters (`boardId` undefined) become read-only on this route: no rename, no portrait generation and no 'Delete character' (B8). Board-local characters keep every control.
9. Undo of a deleted scene or shot re-creates the rows through `createScene`/`createShot`, so they get **new Convex ids**. `shotNumber`, `order`, `sceneNumber` and every other field are restored from the snapshot.
10. 'Expand' is `aria-disabled` in local mode (today it is enabled and fails on click); its reason is the preserved sentence.
11. Generation ignores `shot.imageModel` when choosing a model (B3). The value is still written on success, as provenance.
12. 'New board' drops the operator into editing the title. 'Board style…' is disabled while a style is set (B17); clearing it needs a backend sentinel, which is a §17 follow-up.
13. `?board=` is written back to the URL with `router.replace(…, { scroll: false })` when the Convex board selection changes. Its read-once semantics are unchanged.

#### 9.9.5 Recorded for §17 (out of scope here; no `convex/` change)

- Clearing `styleId`/`locationId` (a clear mutation or a sentinel).
- A persisted per-shot model override field.
- Server/client compiler parity: `convex/director.ts:34-50` omits the shot-type label, elements and camera environment, and `:24` loads only board-scoped characters, so @coast is dropped from 'Featuring'.
- Persisted take history.
- Cross-scene shot moves (`setShotOrder` already patches `sceneId`).

#### 9.9.6 New strings (authored)

Every visible string, accessible name, tooltip reason and announcement that §9.4–§9.6 introduce, verbatim. None is preserved until it merges (Appendix A). Sentence case unless authored uppercase. Strings other chapters own are not repeated: the §6.3 caption 'Loading Shotboard', the §6.6 GenerationFrame readouts and 'Retry', the §6.13 slate kickers, and the AuthRequired copy (§11.D).
- **Slate bar:** 'Rename board'; 'Board title'; 'Board settings'; 'Board aspect'; '16:9', '9:16', '1:1'; 'Aspect'; 'Visual style'; 'Image model'; 'Creating…'; 'Board is still loading'; 'Sign in to create boards'; 'Local only'; 'Saved'; 'Saving…'; "Couldn't save"; 'Copy details'; 'Reload board'.
- **Rail and canvas:** 'Scenes and cast'; 'Scenes'; 'Adding…'; the cast-avatar name `@{handle}` (or the name) followed by ', library' and ', in selected shot' where they apply; `SC {nn}`; `{k} shots · {mm:ss}`; 'Already first'; 'Already last'; 'Shot track'; 'View'; 'Board'; 'Contact sheet'; 'Track zoom'; '1×'; '2×'; 'Keyboard shortcuts'; 'Open inspector'; `SC {nn} · {title} shots`; the tag `SC{nn} · SH{nn} · {d}s`; the cluster words `WS`, `MS`, `CU`, `ECU`, `EST`, `POV`, `OTS`, `AER`, `LOW`, `HIGH`, `DUTCH`, `TRK`, `INS`, `IDEA`, `VISUAL`, `GMI`, `NO PROMPT` and `NO REF`; 'Wait for the generation to finish'; the frame name `SC{nn} · SH{nn} · IN {mm:ss} · {d}s · {shot type label} · {prompt or 'no prompt'} · {'No image' | 'Image' | 'Generating' | 'Failed: {reason}'}`; the PixelFace text `SH{nn}`; 'Arrow keys move between shots. Enter opens the inspector. G generates. Left and right brackets change the duration. Command or Control plus Backspace deletes.'; the announcement `Duration {n} seconds`; the contact-sheet divider `SCENE {nn} · {title} · {k} SHOTS · {mm:ss}` and exposure number `{nn}-{nn}`.
- **Inspector:** 'Inspector'; the Sheet titles `Shot {n}`, `Scene {n}` and 'Board'; the kickers `SC{nn} · SH{nn} · IN {mm:ss}`, `SC {nn}` and `BOARD`; `MODEL`; '· board default'; '· this shot'; 'Use board default'; `Last take: {label}`; `TAKES`; `Use take {k}`; `Images generate from: {Idea | Visual override | GMI expansion}`; `Director uses: {…}`; `IDEA`; `VISUAL`; `GMI`; `DIR`; `OVERRIDES IDEA`; `REV {n}`; `CURRENT`; `STALE`; 'Use as idea'; `EXPANDING {mm:ss.s}`; 'Not expanded yet.'; 'Not prepared yet. Send to Director expands it.'; 'Shot type'; 'Duration'; 'Cast in this shot'; `LIBRARY`; 'Dialogue'; 'Sound effects'; 'Title'; 'Description'; `{s} scenes · {n} shots`; 'Edit in Characters'; 'Transfer in progress'; `NO REF`; '@{handle} has no reference image on this board; the model will invent a face.'; and the §9.9.4 replacements 'Scene keyframe (drives the scene rail thumbnail)', 'handle' and 'Prompt anchor (e.g. @coast)'.
- **States:** 'This board is gone'; "It was deleted, or the link points to a board that doesn't exist."; 'Back to boards'; 'This board could not load'; 'An earlier change was not saved, so the board cannot refresh.'; 'No board open'; 'Start a board'; 'Open latest board'; 'No scenes yet. Start the track from the scene rail.'; the failure reasons 'Last attempt failed' and 'Interrupted'; 'Reload this board?'; 'Unsaved changes on this page are discarded and the board reloads from Convex.'; 'Keep editing'; 'Delete this board?'; '“{title}”, its {s} scenes, {n} shots and board-only characters are deleted permanently. Library characters are not affected. Type the board title to confirm.'; 'Delete permanently'; 'Keep board'; 'Remove {name}?'; '{name} is archived and untagged from every shot on this board.'; 'Remove character'; 'Keep character'.
- **TransferSheet:** `PREFLIGHT`; 'All edits saved'; 'No generations running'; `{k} generation{k === 1 ? '' : 's'} still running`; 'Opening frame: SC01 · SH01'; 'The first shot has no image. The Director starts without an opening frame.'; 'Show shot'; '{n}/{n} shots have images'; '{k}/{n} shots have images'; '+{m} more'; 'Every shot has a current Director prompt'; '{k} shots have no prompt and are sent without one.'; `ESTIMATE`; 'The Director compiles the final script on the server; wording can differ.'; 'Transfer progress'; 'Save edits'; `Expand prompts {done}/{total}`; 'Prepare transfer'; 'Open Live Control'; 'Director expansion'; `QUEUED`; `EXPANDING {mm:ss.s}`; `DONE`; `FAILED · {reason}`; `SKIPPED · NO PROMPT`; 'Close'; 'Stop after this batch'; 'Retry failed'; 'Start transfer'; 'Transferring…'; 'Fix the save error first'; 'Wait for running generations to finish'; 'Wait for the current batch or stop the transfer'; '{k} of {n} Director expansions failed'; 'Transfer stopped. {k} of {n} prompts were expanded and saved.'; the announcement 'Transfer ready, opening Live Control'.
- **Chyrons:** "Couldn't save changes"; 'GMI expansion discarded'; 'Undo'; 'Board deleted'; `Shot {n} deleted`; `Scene {n} deleted`; '{k} shots removed with it.'; 'Could not create board: <msg>'; 'Could not add scene'; 'Could not add shot'; 'Could not add character'; 'Could not restore scene'; 'Could not restore shot'.
- **Palette:** 'Generate selected shot'.
- **Fixture:** 'Reject writes'; 'fixture write rejected'.

### 9.10 Acceptance criteria

- **Working directory.** Commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.
- **Run modes** (§1.6). Browser checks use Playwright in **dev** (unconfigured) at `/admin/shotboard?noboot`, unless a check says **fixture** or is marked "Human operator only". **Fixture** means dev at `/admin/visual-test?noboot#shotboard-visual-test`; fixture checks never run on prod, where the route is 404.
- Selectors use the `data-testid`s from §9.4–§9.6 (§2.13 names).

**Contract and gates**
- [ ] `git diff --stat "$(git merge-base HEAD origin/<base branch of this PR>)" -- dashboard/convex dashboard/lib/shotboardCompiler.ts dashboard/lib/shotboardTypes.ts dashboard/lib/directorProtocol.ts dashboard/components/dither-kit dashboard/components/ScriptTemplatePicker.tsx dashboard/components/reactbits/AccordionGallery.jsx dashboard/components/reactbits/AccordionGallery.css dashboard/components/reactbits/ChromaGrid.jsx dashboard/components/reactbits/ChromaGrid.css dashboard/app/api dashboard/middleware.ts` prints nothing (the §9.2 never-touch slice; §1.4 holds the full list). The base is this PR's own base, never 845147c: §8 edits `ScriptTemplatePicker.tsx` in 8B and 8C, before any Shotboard part.
- [ ] `grep -rnE "AccordionGallery|ChromaGrid|Loader2|animate-spin|fal-(primary|gray|purple)|#7c3aed|#a78bfa|#05030b|#0a0713|@ts-ignore|backdrop-|text-\[10px\]|uppercase" dashboard/components/shotboard dashboard/app/admin/shotboard` prints nothing.
- [ ] `grep -rn "imageModel ??" dashboard/components/shotboard` prints nothing.
- [ ] `ls dashboard/components/shotboard/{ShotCard,SceneSection,SceneSidebar,SceneGallery,CharacterPanel}.tsx` fails for all five files.
- [ ] Every string in §9.9.3 is found in `dashboard/components` or `dashboard/lib`. `tests/unit/shot-strings.spec.ts` holds the list, with templated strings as regexes.
- [ ] Each aria-label and title in §9.9.1 is present on the stated element in the §9.6.3 fixture (Playwright `getByRole`/`getByTitle`).
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` exit 0.
- [ ] In the PR's route table, `/admin/shotboard` First Load JS minus "First Load JS shared by all" is ≤ 93 kB (baseline 196 − 103; gsap leaves the route along with AccordionGallery and ChromaGrid).
- [ ] `npx playwright test tests/contrast.spec.ts` (§15.5) passes in both themes, and every text colour used under `.sb-root` (slate bar, rail meta `micro text-fg-3`, tag row, cluster row, TransferSheet) is the foreground of a §5.6 ledger row for the surface it sits on.

**Unit (`npx playwright test tests/unit`)**
- [ ] `boardLoadState` returns:
  - local with a board → `ready`;
  - local with no board, even with a `?board=` id → `idle`;
  - persistent with no id → `idle`;
  - `loaded` undefined → `loading`;
  - `loaded` null → `missing`;
  - loaded ≠ id → `loading`;
  - loaded = id without a hydrated board, `blocked: false` → `loading`;
  - loaded = id without a hydrated board, `blocked: true` (`syncError` set) → `error`;
  - loaded = id with a board → `ready`.
- [ ] `activeDirectorSource({}, 3)` returns `''` without throwing.
- [ ] For 200 random shots, `activeImagePrompt` equals the `ShotboardPage.tsx:91` expression and `directorPromptText` equals the `lib/shotboardCompiler.ts:40` expression.
- [ ] `resolveModelId('s1', {}, 'nano-banana')` returns `'nano-banana'` for a shot whose `imageModel` is `'gpt-sunburst'` (the function never sees it); with `{ s1: 'gpt-flare' }` it returns `'gpt-flare'`; after the key is deleted ("Use board default") it returns `'nano-banana'` again.
- [ ] `runDirectorTransfer` with fake deps (`tests/unit/director-transfer.spec.ts`, which imports `components/shotboard/directorTransfer.ts` directly):
  - records the call order `flush, settled`, then per batch `expand×2, patch×2` (the last batch may hold 1), then `flush, settled, prepare({ boardId, expectedRevision }), navigate('/admin?transfer=T1')`, and resolves `'done'`;
  - never has more than **2** `expandPrompt` calls pending at once, for 7 stale shots;
  - reports a shot with no prompt through `onRow(id, { state: 'skipped' })`, without blocking the run;
  - on one rejected expansion, rejects with `Error('1 of 7 Director expansions failed')` and never calls `prepare`; `transferError(thatError)` starts with 'Could not prepare Director transfer: ';
  - when `isStopped()` turns true during batch 1, resolves `'stopped'` and calls neither `prepare` nor `navigate`;
  - with `runningJobs: () => 1`, resolves `'refused'` and never calls `flush` or `expandPrompt`.
- [ ] `frameGeometry` returns the §9.4.4 table exactly (all 12 cells).

**Local-mode e2e (`tests/shotboard.spec.ts`, 1440×900, dark and light)**
- [ ] `/admin/shotboard` shows `[data-testid=shotboard]` and the BLANK BOARD slate.
- [ ] The InlineBanner's `textContent` includes exactly `Convex not configured — this board lives only in this page’s state and cannot be sent to Director.` (U+2014, U+2019).
- [ ] No 'Send to Director', 'Delete board' or board select exists.
- [ ] Clicking 'New board' focuses an input inside `h1` whose value `Untitled Shotboard` is fully selected. Typing "Pilot" + Enter makes the h1 text `Pilot`. The save LED reads `Local only`.
- [ ] 'Add scene' then 'First shot' creates a `[data-testid=shot-frame]` whose picture box is 128×72 (±0.5), and `[data-testid=runtime-readout]` reads `1 beats · 8s runtime`.
- [ ] Typing a 32×64 `data:image/svg+xml` URL into 'Keyframe image URL' renders an `<img>` in that box with computed `object-fit: contain`.
- [ ] With the frame focused:
  - `]` twice → frame block width 160 and readout `1 beats · 10s runtime`;
  - then `[` → 144 and `9s`;
  - after 'Add shot' twice, → and ← move `aria-selected` across the 3 frames;
  - Enter moves focus to `getByRole('combobox', { name: 'Image prompt for shot 1' })` (the Idea textarea is an ARIA 1.2 combobox, §9.8).
- [ ] mod+Backspace on a frame removes it and shows a chyron containing "Shot 1 deleted" with an "Undo" button. Clicking Undo restores the frame, with the same tag, within 1 s.
- [ ] Board aspect `9:16` makes the picture 90×160 and the 8 s block 128 wide. `1:1` gives 96×96. Track zoom `2×` at 16:9 gives 256×144.
- [ ] With 2 scenes, clicking 'Move scene up' on the second scene makes it first; afterwards `document.activeElement` is still that 'Move scene up' button, which now has `aria-disabled="true"` and no `disabled` attribute. The same holds for 'Move shot earlier' on the second of 2 shots.
- [ ] 'Generate image' on a shot with an empty prompt shows 'Give the shot a prompt or direction first' in a `role="alert"` and makes **no** request to `/api/fal/` (Playwright request log).
- [ ] 'Expand' has `aria-disabled="true"`, and its description is 'Prompt expansion requires an authenticated Convex connection'.
- [ ] Axe (`@axe-core/playwright`) reports 0 serious or critical violations on the empty state and on a board with 2 scenes × 3 shots, in both themes.
- [ ] At 1280×800 with 6 scenes × 6 shots, `document.scrollingElement.scrollHeight <= innerHeight`, and the canvas pane scrolls (`scrollHeight > clientHeight`).
- [ ] At 1024×768, no `.sb-inspector` is visible. Enter on a frame opens a `dialog[data-sheet]` titled "Shot 1"; Esc closes it and focus returns to the frame.
- [ ] At 390×844:
  - `document.scrollingElement.scrollWidth <= 390`;
  - `.sb-title` and `.sb-actions` are 48 px tall, and their `getBoundingClientRect().top` is 92 (48 + 44) after scrolling 600 px;
  - tapping a frame opens a bottom Sheet.
- [ ] Console capture after navigation and after each flow above contains only the §1.6 allowed messages.
- [ ] The WebGL context count on the route is 1 after toggling the theme 10 times.
- [ ] Under `reducedMotion: 'reduce'`, the fixture's running frame uses `--bayer-4-03` and has no `.gen-scan` element.
- [ ] With `prefers-reduced-transparency: reduce` emulated, `.sb-rail`, `.sb-inspector` and `.sb-title` have an opaque computed `background-color` (alpha 1).

**Fixture and Convex-shaped states (fixture: dev at `/admin/visual-test?noboot#shotboard-visual-test`)**
- [ ] `#shotboard-visual-test` is the fixture's own `section` and contains no `h1`.
- [ ] The 2× (256 px) matrix frames show the long readouts `QUEUE --`, `QUEUE 03`, a `RENDER ` readout containing ` · ~`, `SAVED`, `SIGNAL LOST · Last attempt failed` and `SIGNAL LOST · Interrupted`. The 1× (128 px) matrix frames show `QUEUE --`, `Q 03` and `SIGNAL LOST` with no reason in the plate. Each failed frame, at both sizes, has a button named "Retry".
- [ ] The S4, S5, S6b and S7 bodies show the kickers `NO ACCESS`, `CH 404`, `SIGNAL LOST` and `SIGNAL LOST` and their exact titles (S4: the §11.D.7 AuthRequired title; S5, S6b and S7: §9.6.1). None shows 'Loading shotboard…' as visible text.
- [ ] The library @coast cast cell (no `imageUrl`) renders an `img` whose `currentSrc` contains `/brand/avatar/coast-px-` and no DitherAvatar `canvas`.
- [ ] Selecting SC01 · SH02 (tagged @coast) shows the `NO REF` InlineBanner with the exact §9.6.2 text above 'Generate image', which has no `aria-disabled`; at rest, that frame's cluster row contains `NO REF`.
- [ ] With 'Reject writes' on, clicking 'Add scene' shows an error chyron titled 'Could not add scene', adds no scene, and the console has no `Uncaught (in promise)` entry.
- [ ] In the fixture editor, 'Send to Director' opens `[data-testid=transfer-sheet]` with 6 visible preflight rows, one of which reads `4 shots need Director expansion before transfer.` and one `No generations running`.
- [ ] 'Start transfer' drives the StageTrack to `Open Live Control`, and the fake `navigate` receives `/admin?transfer=fixture-transfer`. During the run, the Close button has `aria-disabled="true"`.
- [ ] 'Delete board' opens a dialog whose confirm button stays disabled until the input equals the board title.
- [ ] The ModelChip of a shot whose `imageModel` is `gpt-sunburst` reads "Nano Banana 2 · board default" and "Last take: GPT Image 2.5 Sunburst".
- [ ] `/admin/visual-test` makes zero requests to Convex, `/api/fal/` or GMI (request log).

**Configured QA (Human operator only, §1.6 step 6; recorded under Verification)**
- [ ] `/admin/shotboard?board=<deleted id>` shows the CH 404 slate within 5 s.
- [ ] Signed out, the route shows NO ACCESS.
- [ ] `?board=not-an-id` shows the S7 slate, with the shell, nav and carrier intact. 'Back to boards' then shows the BLANK BOARD slate at `/admin/shotboard`, with no second S7.
- [ ] Two quick edits followed by 'Send to Director' → 'Start transfer' complete without 'Prompt is stale' and land on `/admin?transfer=…` with the beats applied.

**Screenshots:** the PR attaches dark, light and 390 px after-screenshots of the empty state, a 3-scene board and the TransferSheet, next to `docs/redesign/baseline/admin_shotboard-*.jpg`.

### 9.11 Cut order

When time runs short, cut from the top. Each cut keeps every invariant.
1. Take history (the `TAKES` row).
2. Drag reorder (9D, §9.5.7); the buttons remain.
3. The contact-sheet view (9D, §9.5.6); the View control goes with it.
4. Track zoom `2×` (keep `1×`).
5. The ≥ 1920 inline settings tier (use the Popover at every width).
6. CountUp on the runtime readout (it snaps instead).
7. The "GMI expansion discarded" undo chyron (the discard still happens, as today).

**Never cut on this route:**
- the `useShotboard.ts:373` fix and the S4/S5/S6b/S7 slates;
- the Suspense fallback and `loading.tsx`;
- `settled()` and the B10 fix;
- GenerationFrame driven by real `onStatus`, including the failed and interrupted states;
- the sticky-model fix and ModelChip;
- the save LED;
- the TransferSheet with the preserved transfer order;
- the Delete-board type-to-confirm, the undo chyrons and read-only library characters;
- keyboard walking with its button alternatives;
- the not-configured banner, with local mode fully usable.
