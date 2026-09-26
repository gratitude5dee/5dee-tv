> **Spec chapter §10 — Pages: Characters, Locations and the visual-test fixture.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 10. Pages: Characters and Locations (`/admin/characters`, `/admin/locations`) + the `/admin/visual-test` fixture

These two pages hold the show's cast and sets. This section rebuilds them as two views: a **"Casting"** view (roster rail, talent bible, Darkroom) and a **"Scout wall"** view (a uniform contact grid, a scout report and the same Darkroom). It also rebuilds `/admin/visual-test` into a deterministic fixture with no network access. That fixture renders the real studio components plus every primitive in every state. All `path:line` references are **as of 845147c**. `git diff --stat 845147c HEAD -- dashboard` is empty, so the lines still match. Paths are repo-relative. Short references such as `CharacterLibraryPage.tsx:150` point into `dashboard/components/`. Commands follow the §1.5 working-directory rule: a command whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md` (and a `git` command with such pathspecs) runs from the repository root, and every other command runs from `dashboard/`. Every command in this section runs from `dashboard/` unless it is marked "from the repository root".

### 10.1 Goal & hero interaction

**Goals**
- **One selection model.** A row or plate is selected only by a click or by Enter/Space. Hover and focus never select anything. The `AccordionGallery` hover/select mismatch goes away with the gallery itself (§10.5.3).
- **Identity is a visible object.** The locked @coast renders as a HoloCard with a lock seal, a `{n}/14` refs readout, a turnaround and an invariants plate. @coast never renders as a dev placeholder (§10.5.4).
- **Truthful generation.** A 6-stage StageTrack runs Save → Expand → Queue → Render → Upload → Review. It follows the real pipeline events, and GenerationFrames follow fal queue status (§6.6). Failures show next to the CTA.
- **Review before reuse (D2).** New sheets land in a Review tray. The ones that Convex auto-added to references carry a `REF` Badge and a one-click "Remove from references". Promoting a sheet is always an explicit act.
- **No data loss.** The stale-draft reference overwrite is fixed. Switching selection with unsaved edits asks first. The redesign never makes draft safety worse (§10.5.2).
- **Contract-safe.** Every string, aria-label, title, class, Convex call and the pipeline order in §10.9 survives byte-for-byte, except the exhaustive allowed changes in §10.9.6.

**Characters hero: "Lock, render, review"**
1. The operator lands on `/admin/characters`. @coast is pinned first and auto-selected (no mutation). The bible shows the HoloCard with its foil (identity locked), `LOCKED`, `REFS 5/14` and the latest sheet in the turnaround strip.
2. The readiness LEDs (`NAME`, `HANDLE`, `DESCRIPTION`, `REFERENCE`) are all lit. The operator presses **'Generate character sheet'**. The CTA's label changes, width-locked, to 'Generating character sheet…'. The StageTrack advances Save → Expand → Queue (`QUEUE 02`) → Render (the GenerationFrames densify: `RENDER 00:08.2 · ~00:12`) → Upload (`UPLOAD 1/2`) → Review. The `T+` readout counts `MM:SS.s`.
3. The frames resolve into the new sheets (160 ms `px-resolve`). Result 1 carries `PRIMARY` and `REF`, and result 2 carries `REF`: Convex added both automatically (D2). The operator presses 'Remove from references' on result 2. The badge disappears and `REFS` drops by 1. The operator then presses 'Done reviewing'. Focus never leaves the Darkroom, and nothing outside the tray reflows.

**Locations hero: "Scout, compare, set the light"**
1. On the wall, the operator ticks 'Compare Mission District' and 'Compare Ocean Beach' and presses X. The Compare sheet opens with both plates side by side and one synced loupe.
2. The operator closes the sheet, opens Mission District and presses the 'Golden hour' key. The 'Default light' field reads `Golden hour` (free text, `defaultTimeOfDay`). The operator then presses 'Generate location sheet'.

**Budgets:** CLS is 0 for the whole run. The tray reserves N frame slots when the run starts, where N is the requested number of variations. No layout property animates. The pages have no WebGL context besides the carrier.

### 10.2 Files

`dashboard/components/asset-studio/` is new. Files in it take plain props and **never import `convex/react` or `convex/_generated/api`**; type-only imports from `convex/_generated/dataModel` are allowed. The fixture renders them directly. A file that calls `next/dynamic(…, { ssr: false })` starts with `'use client'`: `TalentBible.tsx` (HoloCard) and `components/AssetStudioVisualFixture.tsx` (MorphSlider, already `'use client'` at 845147c).

**PR sequence** (Appendix B is the global map; §14 places every part, and this table names parts only by their §14 ids):

| PR | Part (§14) | Scope | Visual change |
|---|---|---|---|
| 10-0 | 0B | Prettier over the three mega-line files (§10.5.1) | none |
| 10-DS | 5A: the host, its page line and the specimens of every primitive that exists by then. 5B and 5C add theirs; 8B adds `ds-connect`; each page part adds its skeleton composition to `ds-skeletons` | `section#design-system-visual-test` in `DesignSystemFixture` (§10.5.9) | fixture only |
| 10A | 10A (after 9D, §14.13) | Mechanical extraction into `components/asset-studio/` with identical props and strings, plus the uppercase-allowlist moves (§10.5.1) | none |
| 10B | 10B | Draft safety: payload fix, the rehydrate rule, the unsaved-changes guard (§10.5.2) | UNSAVED LED, guard dialog |
| 10C | 10C | Shared studio parts: Darkroom + pipeline, SheetTray, ReferenceTray/ReferenceAssetManager restyle, ImageGenerationControls restyle, assetPlaceholder restyle, chyron routing, `studio.css` | yes |
| 10D | 10D | Characters "Casting". In the fixture, `section#characters-visual-test` with `CharacterStudioView` on the populated fixture data replaces the inert character block, which is the Characters ready-state target (§10.5.9); the fixture's allowlist line drops to 2 (§10.5.1) | yes |
| 10E | 10E | Locations "Scout wall". In the fixture, `section#locations-visual-test` with `LocationStudioBody` on the populated fixture data replaces the inert locations block, which is the Locations ready-state target (§10.5.9) | yes |
| 10F | 10F | `AssetStudioVisualFixture` completed on the real components: the banner, the two state selects and every non-default `?studio=`/`?scout=` state; the audio fixture restyle with display-only arming (D3); the RouteSkeleton specimen leaves `ds-skeletons`, so the page has one `h1` (§10.5.9) | fixture |

**Create**

| Path | Purpose | PR |
|---|---|---|
| `dashboard/components/asset-studio/types.ts` | `StudioCharacter`, `StudioLocation`, `CharacterDraft`, `LocationDraft`, `LocationKind`, `AssetRole`, `HistoryRow`. The types are moved verbatim in 10A (`CharacterLibraryPage.tsx:18-36`, `LocationLibraryPage.tsx:18-35`). 10C adds the fields Convex already returns: `_creationTime`, `createdAt`, `updatedAt`, and on history rows `role`, `modelId`, `prompt`, `sourceRevision` | 10A, 10C |
| `dashboard/components/asset-studio/StudioHero.tsx` | 10A: the hero `<section>` moved verbatim (`:149` / `:141`). 10D: the PageHeader band (§10.4.1) | 10A, 10D |
| `dashboard/components/asset-studio/StudioGallery.tsx` | 10A only: the loading/empty/AccordionGallery ternary moved verbatim (`:150` / `:142`). Deleted in 10D/10E | 10A |
| `dashboard/components/asset-studio/CharacterSourceForm.tsx` | 10A: `:152-158` moved verbatim. 10D: the restyle, the identity read-only group and the Switch | 10A, 10D |
| `dashboard/components/asset-studio/LocationSourceForm.tsx` | 10A: `:144-149` moved verbatim. 10E: the restyle and `TimeOfDayKeys` | 10A, 10E |
| `dashboard/components/asset-studio/Darkroom.tsx` | 10A: the `<aside>` moved verbatim (`:160` / `:151`). 10C: §10.4.6 | 10A, 10C |
| `dashboard/components/asset-studio/StudioStatus.tsx` | 10A: the notice and error `<p>`s moved verbatim (`:162-163` / `:153-154`). Deleted in 10C (chyrons) | 10A |
| `dashboard/components/asset-studio/useStudioDraft.ts` | Draft baseline, `dirty`, `changedElsewhere`, `reloadSaved`, `markSaved` (§10.5.2) | 10B |
| `dashboard/components/asset-studio/useGuardedSelect.ts` | The selection guard (ConfirmDialog state) and a `beforeunload` listener while dirty | 10B |
| `dashboard/components/asset-studio/useSheetPipeline.ts` | Pipeline **state only**: stage, phase times, queue position, uploads, results, error (§10.5.7). It never calls Convex or fal | 10C |
| `dashboard/components/asset-studio/SheetTray.tsx` | The Darkroom tray (running frames → Review) and Sheet history, both on `ContactSheet` | 10C |
| `dashboard/components/asset-studio/SheetViewer.tsx` | A Dialog showing one sheet at native aspect, with its meta and prompt (cut item 4) | 10C |
| `dashboard/components/asset-studio/ReferenceTray.tsx` | The presentational body of ReferenceAssetManager (§10.5.8), including the hidden `<input type="file" accept="image/*">` | 10C |
| `dashboard/components/asset-studio/ReadinessRow.tsx` | LEDs mirroring `canGenerate` / `readyToGenerate` exactly | 10C |
| `dashboard/components/asset-studio/format.ts` | `ago(ms, now)`, `KIND_LABEL`, `KIND_BADGE`, `initials(name)` | 10C |
| `dashboard/components/asset-studio/CharacterStudioView.tsx` | The full Characters view from props (the page and the fixture render it) | 10D |
| `dashboard/components/asset-studio/RosterRail.tsx`, `StudioAvatar.tsx` | §10.4.3, §10.5.4 | 10D |
| `dashboard/components/asset-studio/TalentBible.tsx` | `BibleHeader`, `TurnaroundStrip`, `InvariantsPlate` | 10D |
| `dashboard/components/asset-studio/LocationStudioView.tsx` | PageHeader band + `LocationStudioBody` (the fixture renders the body alone) | 10E |
| `dashboard/components/asset-studio/ScoutWall.tsx`, `ScoutPlate.tsx`, `ScoutReport.tsx`, `CompareSheet.tsx`, `TimeOfDayKeys.tsx` | §10.4.5 | 10E |
| `dashboard/app/styles/studio.css` | `.asset-studio` grid rules in `@layer components` (§10.4.1). Add its line to `app/globals.css` at its §5.1 position (§5.1 owns the import list) | 10C |
| `dashboard/components/states/skeletons/StudioSkeleton.tsx` | Created in 4D by §6.3 (API §7.5) from the §10.4.7 geometry, and re-verified in 10D/10E | 4D |
| `dashboard/app/admin/visual-test/DesignSystemFixture.tsx` | `'use client'`. Renders its own root `<section id="design-system-visual-test">` (§10.5.9). 5B, 5C, 8B and the page parts add their specimens; 10F removes the RouteSkeleton specimen | 5A (10-DS), 10F |
| `dashboard/lib/fixtures/designSystem.ts` | Frozen DS fixture data (§10.5.9). 8B replaces the five literal CONNECT_STEPS strings of `FX_DECRYPT_LABELS` with the import from `components/director/constants.ts` (§8.2) | 5A (10-DS), 8B |
| `dashboard/lib/fixtures/assetStudio.ts` | Frozen studio fixture data (§10.5.9). 10D creates it with `FIXTURE_NOW`, `FX_CHARACTERS` and `FX_CHARACTER_HISTORY`; 10E adds `FX_LOCATIONS` and `FX_LOCATION_HISTORY`; 10F adds `FX_TRACKS`, `FX_RUNS` and the `seeded` Coast row | 10D, 10E, 10F |

**Change**

| Path | Change | PR |
|---|---|---|
| `dashboard/components/CharacterLibraryPage.tsx`, `LocationLibraryPage.tsx` | Become containers that keep all hooks, queries, mutations and handlers and render `CharacterStudioView` / `LocationStudioView`. They keep `export default`, the `useConvexEnabled()` gate before any Convex hook, and the pipeline order | 10A–10E |
| `dashboard/components/ReferenceAssetManager.tsx` | Keeps its default export, props interface, hooks and upload logic, and renders `ReferenceTray`. Additive optional prop `roles?: Record<string, AssetRole>` | 10C |
| `dashboard/components/ImageGenerationControls.tsx` | Restyle only (§10.5.8). Same props, same 7 aria-labels, same option values and labels | 10C |
| `dashboard/lib/assetPlaceholders.ts` | Brand restyle with the **same signature** (§10.5.4) | 10C |
| `dashboard/components/AssetStudioVisualFixture.tsx` | 10-0 formats it. 4B changes its root `<main>` to `<div>` (§14.3 R4). 5C imports MorphSlider through `next/dynamic` (§14.3 R5) and adds the MorphSlider specimen attribute (§10.5.9); it keeps `autoplay autoplayDelay={6}` (D3). 10D replaces the inert character block (hero, AccordionGallery, source form and Generate aside) with `section#characters-visual-test` rendering `CharacterStudioView`; 10E replaces the inert locations block with `section#locations-visual-test` rendering `LocationStudioBody`; 10F completes it on the real presentational components with fixture data, including display-only arming for the MorphSlider (D3, §0.4 BC-15). It keeps the docstring, `.asset-studio`, `#audio-library-visual-test` and the no-network, no-mutation guarantee (§10.5.9) | 0B (10-0), 4B, 5C, 10D, 10E, 10F |
| `dashboard/app/admin/visual-test/page.tsx` | Keeps the `notFound()` line byte-identical. 4D wraps the body in `<Suspense fallback={null}>` and adds `<ThrowProbe />` (§11.D.10); 10-DS adds `DesignSystemFixture`; every other fixture's owning part adds only its own import and element. The final file is in §10.5.9 | 4D, 5A (10-DS), 8B, 9B, 11A, 11C |
| `dashboard/scripts/checks/uppercase-allowlist.txt` | §5.20.5 owns the file. The 8 preserved `uppercase` sites keep their class ('Character source' ×2, 'Location source', 'Generate' ×3, 'Location selection', 'Audio library visual fixture'). Each site's line moves with it in the same commit, and the total stays ≤ 9 at every commit (the exact lines after 10A and 10D: §10.5.1) | 10A, 10D |

**Delete:** `components/asset-studio/StudioGallery.tsx` (10D/10E) and `components/asset-studio/StudioStatus.tsx` (10C). Both are created and deleted inside this section.

**Never touch:** every §1.4 never-touch path (the §1.4 check runs in every §10 PR). For §10 that list matters most for `dashboard/convex/**` (D2, §1.8 item 2) and the vendored `AccordionGallery.jsx`/`.css` (the fixture specimen still renders them). In addition, no §10 part changes `dashboard/components/shotboard/**` (§9), `dashboard/lib/imageGen.ts` or `dashboard/lib/imageModels.ts`: 5B already landed `onStatus` and `IMAGE_MODEL_ETA_MS` (§6.6, §14.3 R6), and §10 only consumes them. In every §10 PR this prints nothing (from the repository root, like the §1.4 check; `BASE` is this PR's base branch, §1.4):

```bash
: "${BASE:?set BASE (§1.4) in this same shell first}" && git diff --name-only "$BASE"...HEAD | grep -E '^dashboard/(components/shotboard/|lib/image(Gen|Models)\.ts$)'
```

> Note: assets.md says the ImageGenerationControls props interface "is shared with the Shotboard". At 845147c only `CharacterLibraryPage.tsx`, `LocationLibraryPage.tsx` and `AssetStudioVisualFixture.tsx` import it; Shotboard uses `components/shotboard/ImageModelSelect.tsx`. The props stay unchanged either way.

### 10.3 Before

**Screenshots** (`docs/redesign/baseline/`): `admin_characters-dark.jpg` and `admin_locations-dark.jpg` (1440×900), and `admin_characters-mobile.jpg` (390×844). All three are unconfigured, so they show one amber sentence under the nav and nothing else. `admin_visual-test-dark.jpg` (1440×2534) is the only picture of the configured layout: violet gradient placeholder cards, the source form, the dark Generate aside, the locations accordion, and an empty ~450 px black MorphSlider.

| # | Defect | Evidence |
|---|---|---|
| B1 | The flagship @coast renders as a dev placeholder: an Arial violet SVG reading "visual fixture · add approved reference". The seed creates Coast with no image, and the repo has no Coast art | `CharacterLibraryPage.tsx:146`; `lib/assetPlaceholders.ts:2-5`; `convex/assets.ts:466-478`; `admin_visual-test-dark.jpg` |
| B2 | Hover and selection disagree. Hover expands a card (`trigger="hover"`), focus expands a card, and only a click calls `onSelect`. `aria-current` marks the expanded card, not the edited one. On first load card 0 shows as current while no editor renders (`current &&`). The gallery key embeds `selectedId`, so every selection remounts it and the GSAP transition snaps | `reactbits/AccordionGallery.jsx:160-162`, `:164-170`, `:220`, `:224`; `CharacterLibraryPage.tsx:150-151` |
| B3 | A stale draft overwrites server references. The draft rehydrates only on an id change. After `completeGeneration` appends sheets, 'Save source' sends the stale `draft.referenceStorageIds`, and `patchCharacter` replaces the array. Sheets silently drop out while `primaryStorageId` still points at one of them | `CharacterLibraryPage.tsx:73-77`, `:99`; `LocationLibraryPage.tsx:71-75`, `:92`; `convex/assets.ts:168`, `:235`, `:411`, `:416` |
| B4 | Unsaved edits vanish when another card is clicked. There is no dirty indicator and no confirmation | `CharacterLibraryPage.tsx:73-77` |
| B5 | Generated sheets are auto-promoted and appended to identity references with no review. This compounds identity drift and leads to the 14-reference lockout | `convex/assets.ts:411`, `:416`; `lib/imageModels.ts:111-113` |
| B6 | One spinner label covers a six-stage pipeline. fal status is never requested, and errors print at the page bottom, far from the CTA, and never clear | `CharacterLibraryPage.tsx:118-144`, `:160`, `:162-163`; `lib/imageGen.ts:36` |
| B7 | Sheet history square-crops horizontal multi-panel sheets. It also lists plain uploads with the alt "Generated character-sheet history", renders nothing while loading, and a click promotes instantly | `CharacterLibraryPage.tsx:160`; `convex/assets.ts:344-357` |
| B8 | Identity lock is a bare native checkbox with no visual weight | `CharacterLibraryPage.tsx:157`; `lib/assetGeneration.ts:42` |
| B9 | Violet collides with the chrome brand: the violet CTA and eyebrows, `accentColor="#a78bfa"`, `overlayColor="#05030b"`, `bg-[#11131a]`. Undefined shades (`fal-primary-200/300`) drop "Add reference" to about 1.8:1 in dark mode | `tailwind.config.js:26` vs `:74-79`; `CharacterLibraryPage.tsx:149-152`, `:160`; `ReferenceAssetManager.tsx:119`; `AssetStudioVisualFixture.tsx:41-45` |
| B10 | Mixed theming. The hero and aside are dark in both themes and hold white pill selects, next to a white source form in light mode | `CharacterLibraryPage.tsx:149`, `:160`; `ImageGenerationControls.tsx:14`, `:50` |
| B11 | Reference tiles hide Primary and Remove behind `sm:group-hover` (keyboard focus lands on invisible buttons). There is no drag-over state, the hints are 10–11 px, and the tiles show no role | `ReferenceAssetManager.tsx:93`, `:109`, `:117`, `:123` |
| B12 | Signed out looks the same as an empty library (`listCharacters`/`listLocations` return `[]`) | `convex/assets.ts:97`, `:178`; `CharacterLibraryPage.tsx:150` |
| B13 | Not configured is a single amber line with no header and no guidance | `CharacterLibraryPage.tsx:44`; `LocationLibraryPage.tsx:43`; baseline screenshots |
| B14 | Two h1s per route (the layout's 'Stream Admin' plus the hero). The hierarchy is flat, and handles are not set in mono | `app/layout.tsx:51`; `CharacterLibraryPage.tsx:149` |
| B15 | The location kind label 'Coast' reads like the character. Kind, light and weather never appear on the cards | `LocationLibraryPage.tsx:137`, `:145` |
| B16 | Mega-lines. Lines over 1,500 characters: `CharacterLibraryPage.tsx:160` (2205), `LocationLibraryPage.tsx:151` (2154), `AssetStudioVisualFixture.tsx:43` (2447), `:45` (1857). Lines over 1,000: `CharacterLibraryPage.tsx:149` (1337), `LocationLibraryPage.tsx:141` (1313), `:142` (1001) | `awk 'length>1000'` on the three files |
| B17 | The fixture is not deterministic: it points at production Convex storage URLs (a black MorphSlider when the network is blocked), its copy has drifted, it nests a `<main>`, it uses violet, and its buttons are inert | `AssetStudioVisualFixture.tsx:23-26`, `:39`, `:43`, `:45` |
| B18 | Below 520 px the accordion collapses to 84 px strips, so the preview disappears on mobile | `reactbits/AccordionGallery.css:130-144` |

### 10.4 Layout spec

#### 10.4.1 Page frame (`dashboard/app/styles/studio.css`, `@layer components`)

```css
@layer components {
  .asset-studio { max-width: 1440px; margin-inline: auto; padding: 24px var(--gutter) 40px; display: grid; gap: 16px; }
  .studio-header { min-height: 72px; }                                   /* Panel tone="panel", px-4 py-3 */
  @media (min-width: 1024px) {
    .studio-header { max-height: 96px; }
    .studio-header__desc { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; }
  }
  .studio-grid { display: grid; gap: 16px; align-items: start; grid-template-columns: minmax(0, 1fr); }
  .studio-grid--characters { grid-template-areas: "rail" "main" "darkroom"; }
  .studio-grid--locations  { grid-template-areas: "main" "darkroom"; }
  .studio-rail { grid-area: rail; min-width: 0; }
  .studio-main { grid-area: main; min-width: 0; display: grid; gap: 16px; }
  .studio-darkroom { grid-area: darkroom; min-width: 0; }
  @media (min-width: 1024px) {
    .studio-grid--characters { grid-template-columns: 280px minmax(0, 1fr); grid-template-areas: "rail main" "rail darkroom"; }
    .studio-rail { position: sticky; top: calc(var(--h-chrome) + var(--h-offline) + 16px);
                   max-height: calc(100dvh - var(--h-chrome) - var(--h-offline) - var(--h-status) - 32px); display: flex; flex-direction: column; }
    .studio-rail__list { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  }
  @media (min-width: 1280px) {
    .studio-grid--characters { grid-template-columns: 280px minmax(0, 1fr) 360px; grid-template-areas: "rail main darkroom"; }
    .studio-grid--locations  { grid-template-columns: minmax(0, 1fr) 360px; grid-template-areas: "main darkroom"; }
    .studio-darkroom { position: sticky; top: calc(var(--h-chrome) + var(--h-offline) + 16px);
                       max-height: calc(100dvh - var(--h-chrome) - var(--h-offline) - var(--h-status) - 32px); overflow-y: auto; overscroll-behavior: contain; }
  }
  @media (max-width: 1023.98px) {
    .studio-rail__list { display: flex; gap: 8px; overflow-x: auto; scroll-snap-type: x mandatory; }
    .studio-rail__list > li { flex: 0 0 200px; scroll-snap-align: start; }
  }
  .scout-wall { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 640px) { .scout-wall { gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); } }
}
```

- **Header band.** `StudioHero` renders the §7.3 `PageHeader` inside `Panel tone="panel"` (`px-4 py-3`, grid `minmax(0,1fr) auto`, `gap-4`, `items-center`). Colour law 5 (§5.4) forbids the eyebrow, the description and the buttons on the bare veil. The h1 is `display` 28/32 and is the route's only h1. Below 768 the actions wrap under the text, and the ≤96 px cap applies from 1024.
- **Description clamp.** StudioHero passes the description as `<span className="studio-header__desc">{description}</span>`. From 1024 it is clamped to one line (the `studio.css` rule above) and keeps its full text in the DOM; below 1024 it wraps freely.
- **Materials.** The roster rail is `Panel tone="chassis"` (a rail is chassis per the glossary). The bible, source form, wall toolbar, scout report and Darkroom are `Panel tone="panel"`. Inner regions (invariants, reference tiles' add slot, Advanced controls) use `surface-inset`. There is never translucent-in-translucent (§5.10). Every image well is `bg-screen rounded-screen`.
- **Sticky offset.** The rail and the Darkroom stick below the command bar and the offline banner (`--h-chrome`, `--h-offline`, §5.2 tokens), so the OfflineBanner never covers them.
- **Ids.** Every id referenced by `aria-labelledby`, `aria-describedby` or `aria-controls` comes from React `useId()`, for example `const titleId = useId(); <section aria-labelledby={titleId}><h3 id={titleId}>`. The fixture renders CharacterStudioView and LocationStudioBody on one page, so a literal id would repeat. The only literal ids are the route section ids (`#audio-library-visual-test`, `#design-system-visual-test`, `#ds-*` and the other `#…-visual-test` sections).
- **Density.** Comfortable: `--h-control` 36, `--h-row` 40, `--pad-panel` 16. `(pointer: coarse)` gives 44 px.
- **Test hooks.** `data-studio="header|rail|main|darkroom"` on the four regions, `data-roster-row`, `data-plate`, `data-sheet-tile`, `data-review`, `data-unsaved`.

#### 10.4.2 Characters grid by breakpoint

| Viewport | Gutter | Content | Columns (rail · main · darkroom) | Notes |
|---|---|---|---|---|
| ≥1440 | 32 | 1376 | 280 · **704** · 360 | Rail and Darkroom are sticky and scroll internally with `edge-fade-y` (ScrollFade) |
| 1280–1439 | 24 | 1232–1391 | 280 · 560–719 · 360 | Same |
| 1024–1279 | 24 | 976–1231 | 280 · 680–935 | The Darkroom moves below the main column (area `rail darkroom`) and is not sticky. Its controls lay out in 3 columns and its history in `repeat(auto-fill,minmax(160px,1fr))` |
| <1024 | 16 (24 from 768) | ≤976 | 1 column | Order: header, rail as a horizontal snap strip of 200×64 items (filter input above it), bible, source form, Darkroom |

#### 10.4.3 Characters regions (sizes at ≥1024 unless noted)

| Region | Spec |
|---|---|
| **Rail header** | `h2` 'Cast' (`title-sm`) + a `readout` `text-fg-3` count (`{n}`, or `{shown}/{n}` while filtering). Below it an `Input type="search"` (36 px, leading Search 14) with `aria-label="Filter characters"` and placeholder `Name or @handle`, matching name or handle case-insensitively |
| **Roster row** | `<li><button data-roster-row>`, **min-height 72**, padding 8/12, grid `48px minmax(0,1fr) auto`, gap 12. Avatar 48×48 `bg-screen rounded-sm sq overflow-hidden` (the bible's squircle headshot; the only squircled media). Middle: name `title-sm` (truncate), `@handle` `code` `text-fg-3`, then `updated {ago}` `caption` `text-fg-3`. Right: `<Led>` with a visible `micro` label (`LOCKED` success = locked with ≥1 reference · `NEEDS REF` warning = locked with 0 references · `UNLOCKED` off), under it `{n}/14` `readout` `text-fg-3`. States: hover `bg-hover` (120 ms colour only); selected = 1 px `border-accent` + 25% Bayer accent fill at .22; focus = the global 2 px outline; target of an in-flight run = a 12 px `BayerSpinner` with sr-only "Generating" after the name |
| **Order** | `handle === 'coast'` first, then query order (`_creationTime` descending, as `listCharacters` returns it). The sort is stable |
| **Bible panel** | `<section data-studio="main" aria-labelledby={nameId}>` (`useId()`), one Panel, padding 16. **BibleHeader:** grid `192px minmax(0,1fr)`, gap 16 (`144px` below 640). The left cell is the **HoloCard** 192×256 (3:4) with `plate={false}` (§12.3.11) when the saved `identityLocked` is true, otherwise a static `bg-screen rounded-screen` 3:4 portrait. For @coast only, the HoloCard's `clip` renders HoverClipButton 'Play ident' inside the card (§10.5.4). The right cell holds the `h2` (`id={nameId}`) `{draft.name \|\| 'Untitled character'}` (`title-lg`), `@handle` `code`, a Led seal (same labels as the row), `Readout label="REFS" value="{n}/14"`, `Readout label="REV" value={revision}`, `caption` `last sheet {ago} · {model label}` (or `No sheet yet`), and the `UNSAVED` warning Led while dirty (`data-unsaved`) |
| **Turnaround** | A `.dither-rule`, then `h3` `TURNAROUND` (`label`), and on the right `IconButton icon={Layers} label="Show view guides" pressed={guides}`. Below: a screen box `aspect-ratio: 16/9`, full panel width (672 at 1440; 528 at 1280). It shows the latest `role:'sheet'` history row, or else the primary image, at **native aspect** (§10.5.5). `SelectionBrackets variant="selection"` surrounds the rendered image rect with tag `SHEET · REV {sourceRevision}` (or `PRIMARY`). The tag stays within §12.3.9's limit (authored uppercase, ≤ 24 characters), so the model label is not in it; the BibleHeader caption `last sheet {ago} · {model label}` already shows it in text. With no image: the screen shows `caption` `text-fg-on-screen-2` "No sheet yet." |
| **Invariants** | `h3` `INVARIANTS`, then a `surface-inset rounded-sm sq` plate, padding 12, 2 columns (stacked below 640). Column kickers `NEVER CHANGES` / `VARIES PER SCENE` (`label` `text-fg-3`). The values are the draft's `identityNotes` / `defaultWardrobe` in `body-sm` `text-fg-2`, or `—`. Display only |
| **Source form** | Its own Panel `<section aria-labelledby={sourceId}>` (`useId()`). Header row: the `h3` (`id={sourceId}`) 'Character source', which **keeps its `uppercase` class** (§5.20.5), then the `UNSAVED` Led, then 'Save source' (secondary, Check, `pending={saving}`, `pendingLabel="Saving…"`). Fields in the 845147c order and grid (§10.5.5) |
| **Darkroom** | §10.4.6, 360 wide |

#### 10.4.4 Locations grid by breakpoint

| Viewport | Columns | Wall columns (`auto-fill, minmax(240px,1fr)`, gap 12) |
|---|---|---|
| ≥1440 | main 1000 · Darkroom 360 | 4 × 241 |
| 1280–1439 | main 856–1015 · 360 | 3–4 |
| 1024–1279 | 1 column (976–1231); the Darkroom is below the source form | 3–4 |
| 640–1023 | 1 column | 2–3 |
| <640 | 1 column | exactly 2 × `(358 − 8) / 2 = 175` at 390, gap 8 |

The main column order is: toolbar, wall, scout report, source form. There is no rail.

#### 10.4.5 Locations regions

| Region | Spec |
|---|---|
| **Header actions** | 'Load SF starters' (ghost, `pending`), `aria-describedby` (id from `useId()`) → a `Chip mono` reading `SAN FRANCISCO · 10 LOCATIONS` (10 = `STARTER_LOCATIONS.length`, `convex/assets.ts:437-448`); then 'New location' (secondary, Plus, `pending`) |
| **Toolbar** | Panel, padding 8, flex wrap, gap 8: `SegmentedControl label="Location kind" size="sm"` with `{ value, label }` option objects (§7.3; every value differs from its label): All `all`, Landmark `landmark`, Neighborhood `neighborhood`, **Coastline `coast`**, Interior `interior`, Other `other` (ScrollFade x below 640); `Input type="search" aria-label="Filter locations"` placeholder `Name or @handle` (240 wide, full width below 640); spacer; `Button size="sm" variant="secondary" icon={ArrowLeftRight}` 'Compare' with an aria-hidden `<Kbd keys={['X']}>`. It is enabled when exactly 2 plates are marked; otherwise `aria-disabled` with Tooltip "Mark two locations to compare" |
| **Wall** | `<ul class="scout-wall" aria-label="Scout wall">`. Plates are ordered by `_creationTime` descending, a stable client sort. **Saving never reorders the wall** (the query sorts by `updatedAt`, `convex/assets.ts:181`) |
| **Plate** | `<li data-plate>`, a `rounded-md sq` Panel-less tile. It holds `<button aria-current={open ? 'true' : undefined}>` containing a screen `aspect-ratio: 4/3` with `<img object-cover loading="lazy" decoding="async">` (or `assetPlaceholder(name, 204)`), then a 8 px padded meta block: name `title-sm`, `@handle` `code` `text-fg-3` (omitted when no handle), a kind `Badge variant="outline"` (`LANDMARK`/`NEIGHBORHOOD`/`COASTLINE`/`INTERIOR`/`OTHER`), and a `Chip icon={Clock}` showing `defaultTimeOfDay` truncated to 24 characters when set. Outside the button: `<input type="checkbox" aria-label="Compare {name}">` (24 px hit area). Open plate: `SelectionBrackets variant="selection" inset={4}` on the screen, with no tag. At `inset={4}` the handles stay inside the screen, so nothing crosses the 12 px row gap into the row above (§12.3.9); `aria-current` and the selected style carry the open state. Marked plates: an aria-hidden `A`/`B` Badge top-left on a `surface-hud` plate. Below 640 the meta shows name + kind Badge only. Plate height at 241 wide: 181 + 8 + 20 + 18 + 4 + 24 + 8 = 263 |
| **Scout report** | Panel `<section aria-labelledby={scoutId}>` (`useId()`): the `h2` (`id={scoutId}`) 'Scout report' + meta `@handle · {KIND_BADGE}` (`readout` `text-fg-3`), and on the right `SegmentedControl label="View crops" size="sm"` with Grid / Strip / Off. Body grid `minmax(0,2fr) minmax(0,1fr)`, gap 8 (stacked below 768: the plate, then 3 tiles in a row). Left: `ESTABLISHING` screen `aspect-ratio: 4/3`. Right: 3 screens in `grid-template-rows: repeat(3,1fr)` of the same total height: `APPROACH`, `DETAIL`, `ATMOSPHERE`. Crop geometry is in §10.5.6. Under the grid: `caption` `text-fg-3` "Crops assume the four views the sheet brief requests, in order." With no sheet: Off mode, the primary image (or placeholder) contain-fit with tag `PRIMARY`, no tiles, `caption` "No location sheet yet." |
| **Source form** | As §10.4.3's source form, with the eyebrow 'Location source' (keeps `uppercase`), the fields in the 845147c order, and `TimeOfDayKeys` directly under 'Default light' (§10.5.6) |
| **Compare sheet** | `Sheet side="bottom" title="Compare locations"`, content height `min(80dvh, 720px)`. Two columns (stacked below 768), each a 4:3 screen, contain-fit, with `SelectionBrackets variant="selection" inset={4}` tagged `A` / `B` and a synced loupe (§10.5.6). Each column keeps 16 px free above its screen for the tag (§12.3.9). A tag never holds a user-entered name. Below them, a 3-column table whose first column holds the row labels and whose column headers are `A · {name}` / `B · {name}`: Kind, Default light, Weather, References (`{n}/14`), Revision (`REV {n}`). Header action `IconButton icon={ArrowLeftRight} label="Swap A and B"` |

#### 10.4.6 Darkroom anatomy (shared, `data-studio="darkroom"`, Panel, padding 16, inner width 328)

Top to bottom, with 12 px gaps:
1. **Header:** eyebrow 'Generate' (**keeps `uppercase`**) + `h2` 'Character sheet' / 'Location sheet' (`title`), and on the right `T+{tcShort}` (`readout` `.nums` `min-w-[9ch]`), shown from the first stage and frozen at the end.
2. **Intro:** the preserved paragraph, `body-sm` `text-fg-2`.
3. **ImageGenerationControls** (§10.5.8).
4. **StageTrack** `orientation="horizontal"` with the 6 stages (§10.5.7). Idle: every stage pending.
5. **ReadinessRow:** `<ul aria-label="Generation readiness">` of `Led` with visible `micro` labels. Characters: `NAME` (`draft.name.trim()`), `HANDLE` (`draft.handle.trim()`), `DESCRIPTION` (`draft.description.trim()`), and `REFERENCE` (only while `draft.identityLocked`; `current.referenceAssets.length > 0`). Locations: `NAME`, `DESCRIPTION`. Tones: success when met, off otherwise. Together they equal `canGenerate` (`:79`) / `readyToGenerate` (`:138`) exactly.
6. **CTA:** `<Button variant="primary" size="lg" icon={ImagePlus} className="w-full" pending={generating} pendingLabel="Generating character sheet…">Generate character sheet</Button>`, the only primary on the page. `disabled` when `!canGenerate || saving || offline`, as today plus offline.
7. **Hint** (when `!canGenerate`): the preserved sentence in `caption` `text-warning`. When offline and otherwise ready, `caption` `text-warning` "Network offline".
8. **Inline alert:** `<p role="alert" class="caption text-danger">{run.error}</p>` for generation failures, directly under the CTA.
9. **Tray** (`data-review`, only when `run.targetId === selectedId` and `run.status !== 'idle'`): the kicker `REVIEW` (or `RENDERING` while running) in `label`, and a caption while in review: "Added to references automatically. Remove any you do not want reused." Then a `ContactSheet` of N frame slots or results, then `Button size="sm" variant="secondary"` 'Done reviewing' (review only). `aria-busy="true"` while running.
10. **Sheet history:** `h3` 'Sheet history' (`title-sm`) + `ContactSheet`, 2 columns (160 each, gap 8). Empty: `caption` `text-fg-3` 'Generated sheets will remain here for review.'. Loading (`history === undefined`): 4 `Skeleton shape="media" ratio="4/3"` tiles + sr-only `role="status"` "Loading sheet history".

**Contact tile** (`data-sheet-tile`, 160 wide):
- A `bg-screen rounded-screen` 160×120 button (`aria-label="View sheet {tag}"`) with `<img object-contain>`, **never cropped**.
- A meta row: `micro` tag (`REV {sourceRevision}`, with ` · A`/` · B`… when one revision has several outputs), then `Badge` `PRIMARY` (accent, soft) and `Badge` `REF` (neutral, outline).
- An action row, visible at rest, rendered only on `REF` tiles:
  - `IconButton icon={Star} label="Use as primary reference" title="Use as primary reference"`;
  - `IconButton icon={X} label="Remove from references"`.
- A tile without `REF` has no action row; its only action is the viewer (the image button). `patchCharacter`/`patchLocation` accept any `primaryStorageId` with no membership check (`convex/assets.ts:144-170`, `:210-237`), so promoting a non-reference would make the primary something that is not a reference.

#### 10.4.7 StudioSkeleton geometry (`<StudioSkeleton variant="characters"|"locations" header={true} loader?>`)

It renders the **same** `.asset-studio`/`.studio-grid*`/`.studio-rail`/`.studio-main`/`.studio-darkroom` containers with `Skeleton` children, so the geometry is exact at every breakpoint.
- **Header** (`header` true, route `loading.tsx`): the band with bars eyebrow 12×140, title 32×420 (max 70%), description 20×560 (max 90%), and `loader` in the actions slot.
- **Characters:**
  - Rail: a 20×64 bar, a 36 px input block, and 8 rows of 72 (a 48×48 media + 3 text bars 14/12/12).
  - Main: a 192×256 media + 4 bars, a 16:9 media, a 120 px block, and a 480 px form block.
  - Darkroom: 2 bars, 4 blocks of 36, a 24 px stage bar, a 40 px CTA block, and 4 tiles at 4:3 in 2 columns.
- **Locations:**
  - Toolbar: 6 blocks of 88×28 + a 240×36 input.
  - Wall: 8 plates (4:3 media + bars 14/12 + a 24 px chip row).
  - Darkroom: as for Characters.
- **In-page use** (`header={false}`, while `characters === undefined`): the real header band stays. `loader` (`<CoastLoader size={64} label="Loading character library…" />` or `…location library…`) sits centred over the first main-column block. `aria-busy="true"` on the container.

#### 10.4.8 Wireframes

```text
/admin/characters · 1440×900 · dark · @coast selected                     (y in CSS px)
+------------------------------------------------------------------------------------------------+ 0
| CommandBar 48 · bug · Stream Admin · nav (Characters active) · PVW REC AIR · ⌘K · theme          |
+------------------------------------------------------------------------------------------------+ 48
  +--------------------------------------------------------------------------------------------+  72
  | Visual asset studio                                  [ Load SF starters ] [ + New character ] |  header band
  | Characters with a stable identity                    (h1 display 28/32)                      |  Panel, ≤96
  | Keep a face and overall look consistent, then swap wardrobe and scene styling without…       |
  +--------------------------------------------------------------------------------------------+  168
  +- rail 280 (chassis) -+ +- main 704 -----------------------------------+ +- Darkroom 360 ------+  184
  | Cast               3 | | +- HoloCard 192x256 -+  Coast   (h2)          | | GENERATE            |
  | [ Name or @handle  ] | | | chrome foil, 3:4   |  @coast                | | Character sheet     |
  | +------------------+ | | |                    |  [#] LOCKED            | | Astra expands the   |
  | |[48] Coast  LOCKED| | | |                    |  REFS 5/14   REV 12    | | saved source; …     |
  | |     @coast   5/14| | | |                    |  last sheet 2d ago ·   | | MODEL [Nano Banana] |
  | |  updated 2d ago  | | | | [> Play ident]     |  Nano Banana 2         | | ASPECT[4:3] VAR [1] |
  | +------------------+ | | +--------------------+  ( ) UNSAVED           | | FORMAT[PNG] RES [1K]|
  | [48] Mara NEEDS REF  | | ~~~~~~~~~~~~~~~~~~~ dither rule ~~~~~~~~~~~~~~ | | > Advanced model …  |
  |      @mara      0/14 | | TURNAROUND                     [Layers guides] | | ■■■□□□    T+00:14.2 |
  | [48] Orio   UNLOCKED | | +- screen 16:9 672x378 --------------------+  | | Save Expand Queue   |
  |      @orio      2/14 | | |[ SHEET · REV 12                        ]|  | | Render Upload Review|
  |                      | | |   sheet at native aspect, contain-fit   |  | | o NAME o HANDLE     |
  |                      | | +-----------------------------------------+  | | o DESCRIPTION o REF |
  |                      | | INVARIANTS                                   | | [ Generate character|
  |                      | | NEVER CHANGES        | VARIES PER SCENE      | |   sheet ]  primary  |
  |                      | | Face, hairline …     | Chosen per scene.     | | Sheet history       |
  |                      | +----------------------------------------------+ | [REV 12·A][REV 12·B]|
  |                      | +- CHARACTER SOURCE  ( ) UNSAVED [✓ Save source]| | [REV 9  ][        ] |
  | (list scrolls,       | | Name [Coast      ]   Handle [coast      ]    | | (scrolls inside)    |
  |  edge-fade-y)        | | Identity and continuity description …        | |                     |
  +----------------------+ +----------------------------------------------+ +---------------------+
  StatusRail 24 (sticky)                                                                           876
```

```text
/admin/characters · 1024×768 (gutter 24 → content 976)
[ CommandBar 48 · nav icon-only except "Characters" ]
[ header band 976 ]
+- rail 280 --------+ +- main 680 -------------------------------------+
| Cast   [filter]   | | BibleHeader: HoloCard 192x256 | meta            |
| rows (sticky,     | | TURNAROUND screen 16:9 648x365                 |
|  scroll inside)   | | INVARIANTS                                     |
|                   | +------------------------------------------------+
|                   | | CHARACTER SOURCE form (fields 2 col)           |
|                   | +------------------------------------------------+
|                   | | Darkroom (row 2 of col 2, not sticky):         |
|                   | |  controls 3 col · StageTrack · readiness       |
|                   | |  [Generate character sheet] (max-w 360)        |
|                   | |  Sheet history 4 col                           |
+-------------------+ +------------------------------------------------+
```

```text
/admin/characters · 390×844 (gutter 16 → 358)
+----------------------------------------+
| CommandBar 48 · bug · lamp · ⌘K · theme |
| nav row 44 (scroll-snap strip)          |
+----------------------------------------+
 +--------------------------------------+
 | Visual asset studio                  |
 | Characters with a stable identity    |  h1 wraps to 2 lines
 | Keep a face and overall look …       |
 | [Load SF starters] [+ New character] |
 +--------------------------------------+
 Cast 3
 [ Name or @handle                     ]
 [48 Coast  ][48 Mara   ][48 Orio → …     200×64 snap items, ←/→ roving
 +--------------------------------------+
 | +HoloCard 144x192+  Coast            |
 | |                |  @coast           |
 | |                |  LOCKED  5/14     |
 | +----------------+  REV 12           |
 | TURNAROUND screen 326x183            |
 | INVARIANTS (stacked)                 |
 +--------------------------------------+
 | CHARACTER SOURCE      [Save source]  |
 | fields 1 col · Switch · refs 2 col   |
 +--------------------------------------+
 | GENERATE · Character sheet           |
 | controls 2 col · StageTrack          |
 | [ Generate character sheet ]         |
 | Sheet history 2 col                  |
 +--------------------------------------+
 StatusRail 24
```

```text
/admin/locations · 1440×900 · Ferry Building open · Mission District = A, Ocean Beach = B
[ CommandBar 48 ]
+- header band 1376 -------------------------------------------------------------------------+
| Visual asset studio     [Load SF starters] (SAN FRANCISCO · 10 LOCATIONS) [+ New location] |
| Locations that hold their atmosphere                                                       |
| Reusable places carry landmark geometry, weather, light, and texture into every scene.     |
+--------------------------------------------------------------------------------------------+
+- main 1000 -------------------------------------------------------+ +- Darkroom 360 -------+
| (All|Landmark|Neighborhood|Coastline|Interior|Other) [Name or @h] [Compare X] | GENERATE  |
| +--241x181--+ +--241x181--+ +--241x181--+ +--241x181--+            | | Location sheet       |
| |⌜         ⌝| |A          | |           | |B          |            | | The metaprompt turns…|
| +-----------+ +-----------+ +-----------+ +-----------+            | | controls · StageTrack|
| Ferry Build.  Mission Dis.  Financial D.  Ocean Beach              | | o NAME o DESCRIPTION |
| @ferrybuil…   @mission      @fidi         @oceanbeach              | | [ Generate location  |
| LANDMARK  [ ] NEIGHB.   [x] NEIGHB.   [ ] COASTLINE [x]            | |   sheet ]            |
| Morning fog                                                        | | Sheet history 2 col  |
| … rows 2–3 …                                                       | |                      |
| Scout report  @ferrybuilding · LANDMARK         (Grid|Strip|Off)   | |                      |
| +- ESTABLISHING 656x492 ------------+ +- APPROACH 328x159 ---+     | |                      |
| |                                   | +- DETAIL -------------+     | |                      |
| |                                   | +- ATMOSPHERE ---------+     | |                      |
| +-----------------------------------+                              | |                      |
| LOCATION SOURCE                       ( ) UNSAVED [✓ Save source]  | |                      |
| Name [Ferry Building        ]  Type [Landmark v]                   | |                      |
| Handle (optional) [ferrybuilding]  Default light [Morning fog    ] | |                      |
|                                    [Morning fog][Golden hour]      | |                      |
|                                    [Blue hour][Night neon]         | |                      |
+--------------------------------------------------------------------+ +----------------------+
```

```text
/admin/locations · 390×844                     Compare sheet (bottom, min(80dvh,720px))
 [header band, actions wrap]                   +- Compare locations -------- [⇄] [x] +
 [(All|Landmark|… scroll-x)]                   | +- A ----------------------------+  |
 [ Name or @handle              ]              | |  ⌜ loupe ⌝ at (cx,cy)          |  |
 +-175x131-+ +-175x131-+                       | +--------------------------------+  |
 |⌜       ⌝| |A        |                       | +- B ----------------------------+  |
 +---------+ +---------+                       | |  ⌜ loupe ⌝ same (cx,cy)        |  |
 Ferry B.    Mission D.                        | +--------------------------------+  |
 LANDMARK[ ] NEIGHB. [x]                       |       A · Mission D. B · Ocean B.   |
 … 2 columns …                                 | Kind   NEIGHBORHOOD   COASTLINE     |
 Scout report · plate, then 3 tiles in a row   | Default light  Golden hour   —      |
 LOCATION SOURCE (1 col)                       | Weather  —     Fog, wind            |
 Darkroom (full width)                         | References 3/14   1/14              |
                                               | Revision  REV 7   REV 2             |
                                               +-------------------------------------+
```

### 10.5 Component tree

#### 10.5.1 Mechanical pre-step: prettier (10-0, part 0B), then extraction (10A)

**10-0 (part 0B, after the D1 deletions, formatting only).** Prettier 3.9.6 is already installed transitively (`convex@1.45.0 → prettier@3.9.6`, `node_modules/.bin/prettier`), so there is no package.json change (D8):

```bash
npx --no-install prettier --no-semi --single-quote --print-width 120 --trailing-comma all --write \
  components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx components/AssetStudioVisualFixture.tsx
```

Measured on scratch copies at 845147c:
- 165/156/47 lines become 551/531/234, and the longest line becomes 273 characters (a `className` string).
- The only token difference is prettier's `{' '}` JSX whitespace preservation (for example before 'Lock the face and overall look across generations'), which renders identically.
- The two `{/* eslint-disable-next-line @next/next/no-img-element */}` comments stay on the line directly above their `<img`.

> Note: 0B reformats these three files before 1B and M2, so their 845147c line numbers no longer match afterwards. Any later step that cites an 845147c line in them (the §5.19 hand edits, for example `CharacterLibraryPage.tsx:149,152,160`) locates its site by its string (`grep -n`), not by the line number.

**Literal check** (used by 10-0 and 10A). Save it as `/tmp/literals.cjs` and never commit it:

```js
// usage (from dashboard/): NODE_PATH=$PWD/node_modules node /tmp/literals.cjs [--set] <baseline files…> -- <candidate files…>
// Default: multiset comparison (10-0). --set: set comparison (10A, where near-identical blocks of the two pages merge into one component).
const ts = require('typescript'), fs = require('fs')
const lits = (files) => files.flatMap((f) => {
  const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), out = []
  const walk = (n) => {
    const p = n.parent
    const skip = p && (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExpressionStatement(p))
    if (!skip && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) && n.text.trim()) out.push(n.text)
    else if (ts.isJsxText(n)) { const t = n.text.replace(/\s+/g, ' ').trim(); if (t) out.push(t) }
    ts.forEachChild(n, walk)
  }
  walk(sf); return out
})
const argv = process.argv.slice(2), set = argv[0] === '--set', args = set ? argv.slice(1) : argv
const i = args.indexOf('--'), a = lits(args.slice(0, i)), b = lits(args.slice(i + 1))
const multi = (x, y) => { const m = new Map(); y.forEach((s) => m.set(s, (m.get(s) ?? 0) + 1)); return x.filter((s) => { const c = m.get(s) ?? 0; if (c) { m.set(s, c - 1); return false } return true }) }
const uniq = (x, y) => { const Y = new Set(y); return [...new Set(x)].filter((s) => !Y.has(s)) }
const diff = set ? uniq : multi
const lost = diff(a, b), added = diff(b, a)
console.log(lost.length || added.length ? JSON.stringify({ lost, added }, null, 1) : `OK ${set ? new Set(a).size : a.length} literals`)
process.exit(lost.length || added.length ? 1 : 0)
```

**10-0 baseline.** The baselines are the 845147c versions of the three files. At 845147c they hold 476 literals, and the prettier output prints `OK 476 literals` (multiset mode). Like the 10A block below, this runs from `dashboard/` (`<rev>:<path>` is repository-relative):

```bash
mkdir -p /tmp/base
for f in CharacterLibraryPage LocationLibraryPage AssetStudioVisualFixture; do git show "845147c:dashboard/components/$f.tsx" > "/tmp/base/$f.tsx"; done
NODE_PATH=$PWD/node_modules node /tmp/literals.cjs /tmp/base/CharacterLibraryPage.tsx /tmp/base/LocationLibraryPage.tsx /tmp/base/AssetStudioVisualFixture.tsx -- \
  components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx components/AssetStudioVisualFixture.tsx
```

**10A baseline.** The 845147c baseline no longer applies to 10A: 1B and M2 codemods rewrite `className` strings and hex props in the two pages before 10A. 10A compares against the merge base of its own PR and uses `--set`, because StudioHero, StudioGallery and Darkroom merge two near-identical page blocks into one component (so a shared literal such as the two identical `<aside>` class strings appears once). The candidates include `.ts` files, because `types.ts` receives the moved types. `<rev>:<path>` is always repository-relative, so this block runs from `dashboard/`:

```bash
: "${BASE:?set BASE (§1.4) in this same shell first}"   # the 10A PR's base branch
base=$(git merge-base HEAD "$BASE")
mkdir -p /tmp/base10a
for f in CharacterLibraryPage LocationLibraryPage; do git show "$base:dashboard/components/$f.tsx" > "/tmp/base10a/$f.tsx"; done
NODE_PATH=$PWD/node_modules node /tmp/literals.cjs --set /tmp/base10a/CharacterLibraryPage.tsx /tmp/base10a/LocationLibraryPage.tsx -- \
  components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx components/asset-studio/*.{ts,tsx}
```

**10A (the first studio part, §14.13): pure moves, no restyle.** Cut the formatted JSX into these components. Each one receives exactly the values and callbacks it used inline. Every `className`, string, element, attribute and handler body moves verbatim, and nothing is renamed:

| New component | Moved from (845147c) | Props |
|---|---|---|
| `StudioHero` | Character `:149`, Location `:141` | `{ title, description, onSeed, onCreate, createLabel }`. The eyebrow text and the icons stay literal inside |
| `StudioGallery` | `:150` / `:142` | `{ items, selectedId, loading, empty: { icon, title, body }, onSelect }`, rendering the same loading/empty/AccordionGallery ternary (as it stands at the 10A merge base) with the same `key` |
| `CharacterSourceForm` / `LocationSourceForm` | `:152-158` / `:144-149` | `{ draft, setDraft, saving, onSave, referenceSlot: ReactNode }`. The `field` constant moves into each file verbatim |
| `Darkroom` | `:160` / `:151` | `{ title, intro, modelId, options, editing, onModelChange, onOptionsChange, onGenerate, disabled, generating, ctaLabel, ctaPendingLabel, hint, showHint, history, onUsePrimary, historyAlt }` |
| `StudioStatus` | `:162-163` / `:153-154` | `{ notice, error }` |

- Hooks, queries, mutations, `persistDraft`/`save`, `uploadGeneratedImage`/`saveGeneratedImage`, `generateSheet` and `galleryItems` **stay in the page files**.
- `ReferenceAssetManager` is still rendered by the page and passed as `referenceSlot`.
- After 10A: the 10A literal check above prints `OK …` (no `lost`, no `added`), and `/admin/visual-test` screenshots are pixel-identical to the pre-10A commit.

**Uppercase-allowlist moves** (§5.20.5 owns the file and its format; §10 moves each kept site's line in the same commit as the site). 'Character source' and 'Location source' move into their source forms, and both pages' 'Generate' eyebrows now render from the one `Darkroom` component. After 10A the file lists these lines (fields separated by one TAB; total 8):

```text
components/asset-studio/CharacterSourceForm.tsx	1	Character source
components/asset-studio/LocationSourceForm.tsx	1	Location source
components/asset-studio/Darkroom.tsx	1	Generate
components/AssetStudioVisualFixture.tsx	4	Character source | Generate | Location selection | Audio library visual fixture
components/reactbits/MorphSlider.css	1	.morph-slider-caption-text (track names, data)
```

10D replaces the fixture's inert character block with `CharacterStudioView` (§10.5.9), so its 'Character source' and 'Generate' copies go away in 10D. From 10D the fixture line is `components/AssetStudioVisualFixture.tsx	2	Location selection | Audio library visual fixture` and the total is 6; 10E and 10F keep both sites ('Location selection' is composition item 4's eyebrow). The two header comment lines stay as §5.20.5 writes them.

#### 10.5.2 Draft safety (10B): the stale-draft overwrite and what the redesign must not make worse

**The risk today** (`CharacterLibraryPage.tsx:73-77`, `:99`; `LocationLibraryPage.tsx:71-75`, `:92`):
- The draft rehydrates only when the selected id changes.
- Every Save sends `referenceStorageIds: draft.referenceStorageIds`, and `patchCharacter`/`patchLocation` **replace** the array (`convex/assets.ts:168`, `:235`).
- So after `completeGeneration` appends sheets (`:411`, `:416`), or after anything else changes references on the server, the next 'Save source' silently drops them.

**Fixes (client only; `dashboard/convex/**` untouched):**
1. **Payload.** Remove `referenceStorageIds` from the two Save payloads (`:99`, `:92`). The server already owns references: `recordUpload` appends, `removeReference` detaches and `completeGeneration` appends. The mutation's accepted argument shape is unchanged; only this call omits an optional field. The draft's `referenceStorageIds` bookkeeping in `onUploaded`/`onRemove` (`:158`, `:149`) stays, and nothing sends it.
2. **Baseline and rehydrate** (`useStudioDraft`). Keep `baseline = toDraft(row)` from the last load or save.
   - `dirty` = any of the compared fields differs between `draft` and `baseline` with `!==`:
     - Characters: `name, handle, description, appearance, identityNotes, defaultWardrobe, voiceNotes, visualStyle, identityLocked`.
     - Locations: `name, handle, kind, description, architecture, defaultTimeOfDay, defaultWeather, visualStyle`.
   - When `current._id !== editingId`, load as today.
   - When `current.revision > baseline.revision`:
     - if `!dirty`, then `setDraft(toDraft(current))` and move the baseline;
     - if `dirty` and the server's compared fields equal the baseline's (the change touched only references or the primary, for example a finished sheet), advance `baseline.revision` silently;
     - otherwise set `changedElsewhere`.
   - `markSaved(fresh)` replaces `:102-103` / `:96`.
   - A lagging list query (`current.revision < baseline.revision`) is ignored.
3. **Changed elsewhere.** An `InlineBanner tone="warning" kicker="CHANGED"` inside the source form reads "Saved elsewhere since you started editing. Saving now overwrites those text fields.", with action `Button size="sm" variant="ghost"` "Load saved version" (→ `reloadSaved()`).
4. **Unsaved guard** (`useGuardedSelect`). While `dirty`, a roster or plate selection, 'New character'/'New location', and 'Load saved version' open `ConfirmDialog destructive title="Discard unsaved changes?" body="{name} has unsaved edits. Switching discards them." confirmLabel="Discard changes" cancelLabel="Keep editing"`. While `dirty`, a `beforeunload` listener calls `event.preventDefault()`. Generation still saves the draft first (Save stage), as today.

**The redesign must not make these worse:**
- One-click roster and plate switching never discards edits silently.
- Rehydration never overwrites unsaved text.
- Review actions (promote, remove) are never undone by a later Save.
- Auto-selection on load and every hover or focus write nothing.
- In-app AppNav navigation away with unsaved edits behaves as at 845147c (no guard). §17.4 F13 lists a shell-level guard as a follow-up.

#### 10.5.3 Hover vs select: why AccordionGallery leaves these pages

The gallery conflates preview with selection:
- `handleEnter` sets `active` on hover (`AccordionGallery.jsx:160-162`), and focus does the same (`:220`).
- `aria-current` follows `active` (`:224`), while `onSelect` fires only on click (`:169`).
- The page keys the gallery on `selectedId` (`CharacterLibraryPage.tsx:150`), so each selection remounts it, `firstRunRef` resets and the transition snaps.

The redesign removes it from both pages (bible: "Removed from the Characters and Locations heroes"). Its file and API stay untouched for Shotboard and the fixture specimen (`#ds-accordion-gallery`). The replacements hold **three separate visual states**: hover (`bg-hover` only), focus (the 2 px outline) and selected (accent border + 25% Bayer fill + `aria-current="true"`).
- **RosterRail:** `<ul aria-label="Cast">` of `<button aria-current>`, with a roving tabindex:
  - ↑/↓ (and ←/→ in the strip below 1024) plus Home/End move focus;
  - Enter, Space or a click selects, through the guard;
  - focus never selects.
- **ScoutWall:** `<ul aria-label="Scout wall">` of plate buttons with a roving tabindex:
  - ←/→ ±1, ↑/↓ ± columns (column count = `getComputedStyle(ul).gridTemplateColumns.split(' ').length`), Home/End;
  - Enter/Space/click opens;
  - the compare checkbox of the roving plate is `tabIndex=0` and all others are `-1`.
  After opening, if the scout report's top is outside the viewport, `scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })`.
- **Auto-select:** when `selectedId === null` and data has arrived, select `roster[0]` (Characters) or `wall[0]` (Locations). If the selected row disappears, select `[0]`.

#### 10.5.4 Coast fallback chain and the `assetPlaceholder()` brand restyle

**Problem.** `seedStarterLibrary` creates @coast with no image (`convex/assets.ts:466-478`), so `galleryItems` falls back to the violet "visual fixture · add approved reference" SVG (`CharacterLibraryPage.tsx:146`, `lib/assetPlaceholders.ts:4`).

**StudioAvatar (48 px roster, 40 px strip)**, first match wins:
1. The first identity reference: the first `referenceAssets` entry whose role is `identity` (`object-cover`, `object-position: 50% 30%`). Roles are loaded only for the selected character (`roles`, below). A row whose roles are not loaded uses `referenceAssets[0]`, the oldest reference: `completeGeneration` appends sheets after the existing references (`convex/assets.ts:411`, `:416`).
2. If `handle === 'coast'`: `<BrandImage id="avatar/coast-px" sizes="48px" alt="">` (`-48.webp`/`-96.webp`, `image-rendering: pixelated`, §13.6.3).
3. `character.imageUrl` (`object-cover`, `object-position: 50% 30%`). `presentCharacter` sets it to the primary (`convex/assets.ts:50`), which after any run is a multi-panel sheet (`:411`), so it comes after the identity reference and the Coast avatar.
4. PX initials: `initials(name)` (the first letters of the first two words, `[A-Z0-9]`, else `#`) as `<PixelFace cell={2}>` in `ramp-3` on `ramp-1`.

`alt=""`, because the name is adjacent.

**Bible portrait (HoloCard or static)**, first match wins:
1. The first `referenceAssets` entry whose role is `identity`. The role comes from `listAssetHistory`, where the latest row per `storageId` wins.
2. If @coast: `` <BrandImage id="talent/coast-portrait" sizes="(max-width: 639px) 144px, 192px" alt={`${name} character card`} /> `` (API §13.8). This is a Coast-approved final (D5, D9), a prop-only no-likeness asset (`likeness:false`, §13) or the manifest's non-human placeholder (`generated:false`), so the UI never shows a fake likeness.
3. `imageUrl` (`object-cover`, 3:4).
4. `StudioAvatar` scaled up.

The image `alt` is `{name} character card` (the 845147c pattern, `:146`). TalentBible passes the HoloCard `plate={false}` (§12.3.11): the BibleHeader already shows the name, the Led seal and `REFS`, and the card's own plate would add a second, conflicting lamp.

**HoverClipButton** 'Play ident' appears only for @coast and only when `lib/brandAssets.ts` lists `motion/coast-talent-nod` as generated (§13.6.6, §13.8). TalentBible passes the HoloCard's `clip` prop only then (§12.3.11, §12.3.12).

**`lib/assetPlaceholders.ts`** keeps `export function assetPlaceholder(label: string, hue = 260)` and the `data:image/svg+xml;charset=UTF-8,` return. The SVG body becomes screen material, theme-invariant because an `<img>` SVG cannot read CSS variables:
- `viewBox 0 0 800 520`;
- a `#05080F` ground;
- a `<pattern>` of 2×2 px rects at BAYER4 ≤ 3 (25%) in `#1D3160`;
- one horizon silhouette in `#3357A8`, chosen by `Math.abs(Math.round(hue)) % 4` from 4 fixed paths;
- 1 px `#7AA5E0` corner brackets with 12 px arms;
- `label` (sanitised exactly as today: `replace(/[<>&]/g, '').slice(0, 28)`) in `font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"` 32 px `#E8EEF9`, and under it `NO IMAGE YET` in 14 px `#7AA5E0`.

The string "visual fixture · add approved reference" and Arial are removed (§10.9.6).

#### 10.5.5 Final tree: Characters

```text
CharacterLibraryPage (default export, 'use client')                      components/CharacterLibraryPage.tsx
├─ !useConvexEnabled() → <div.asset-studio> <StudioHero …no actions/>
│                                         <NotConfigured size="route" message="Convex is not configured. Character library changes are disabled."/>
└─ CharacterLibraryInner   ← every Convex hook, handler, the pipeline and the chyron routing
   └─ <CharacterStudioView {...}/>                                         components/asset-studio/CharacterStudioView.tsx
      ├─ <StudioHero eyebrow="Visual asset studio" title="Characters with a stable identity"
      │              description="Keep a face and overall look consistent, then swap wardrobe and scene styling without rebuilding the character."
      │              actions={authed && <><Button variant="ghost" pending={seeding}>Load SF starters</Button>
      │                                   <Button variant="secondary" icon={Plus} pending={creating}>New character</Button></>}/>
      ├─ state (useLoadState(characters, { isAuthed })):
      │   loading → <StudioSkeleton variant="characters" header={false} loader={<CoastLoader size={64} label="Loading character library…"/>}/>
      │   auth    → <AuthRequired size="route"/>
      │   empty   → <Slate kind="empty" kicker="OPEN CASTING" art="characters" size="route"
      │                    title="Start with a reusable character" body="Create one, or load the San Francisco starter set to add @coast."/>
      └─ ready → <div class="studio-grid studio-grid--characters">
           ├─ <RosterRail items selectedId busyId={run.targetId} filter onFilterChange onSelect={guard(select)} now/>
           ├─ <section data-studio="main">
           │    ├─ <TalentBible character draft history roles latestSheet dirty now guides onToggleGuides/>
           │    │    ├─ BibleHeader: HoloCard plate={false} (next/dynamic, ssr:false; the static card is the loading state) | static portrait
           │    │    ├─ TurnaroundStrip   └─ InvariantsPlate
           │    └─ <CharacterSourceForm draft onDraftChange saving onSave dirty changedElsewhere onReloadSaved
           │          identityReadOnly onEditIdentity referenceSlot={<ReferenceAssetManager … roles={roles}/>}/>
           ├─ <Darkroom kind="character" title="Character sheet" intro="Astra expands the saved source; the selected Fal model then creates a reviewable sheet. No model call occurs until the source is valid." …/>
           └─ <ConfirmDialog {...guard.dialog}/>
```

**Source form fields** (the 845147c order, labels and placeholders verbatim, `Field` + native inputs):
1. Name | Handle (2 columns from 640). The Handle input is `font-mono` and keeps the `:153` normalisation verbatim.
2. 'Identity and continuity description' (`Textarea rows={4} autoGrow maxRows={10}`).
3. 'Appearance details' | 'Default wardrobe'.
4. 'Identity invariants' | 'Visual style'.
5. `<Switch checked={draft.identityLocked ?? true} onCheckedChange label="Lock the face and overall look across generations"/>`.
6. A `.dither-rule`, then the reference slot.

**Identity read-only group.**
- `identityReadOnly = draft.identityLocked === true && (current.referenceAssets?.length ?? 0) > 0 && !identityEditing`.
- When true, 'Identity and continuity description', 'Appearance details' and 'Identity invariants' render `readOnly` (`aria-readonly="true"`, a Lock 14 icon after the label), and a `Button size="sm" variant="ghost" icon={Unlock}` "Edit identity fields" (`aria-controls` of the three, ids from `useId()`) sets `identityEditing` for this selection. It resets on selection change and after a successful save.
- New characters (locked with 0 refs) stay fully editable, so 'Character created. Add a name, handle, identity description, and approved face references.' stays actionable.

> Note: the bible says "when locked, the identity fields render read-only". Because `identityLocked` defaults to true for every new row, the rule applies only once a reference exists; otherwise the created-notice would direct the operator to a locked field.

**Chyron routing** (replaces `StudioStatus`):
- every `setNotice(text)` → `chyron.push({ tone: 'success', title: text })` (`role="status"`, 5000 ms);
- every non-generation `setError(text)` → `chyron.push({ tone: 'error', title: text, sticky: true })` (`role="alert"`);
- generation errors → `pipeline.fail(text)` (§10.5.7), rendered inline under the CTA and not chyroned (one announcement).

Texts are verbatim (§10.9.5).

**Focus.** After 'New character' resolves, select the new id, scroll its row into view, focus the Name input and select its text ('New character').

#### 10.5.6 Final tree: Locations

```text
LocationLibraryPage (default export) → same gates; NotConfigured message "Convex is not configured. Location library changes are disabled."
└─ LocationLibraryInner → <LocationStudioView>
     ├─ <StudioHero eyebrow="Visual asset studio" title="Locations that hold their atmosphere"
     │              description="Reusable places carry landmark geometry, weather, light, and texture into every scene."
     │              actions={Load SF starters (ghost, aria-describedby → pack Chip) · New location (secondary)}/>
     └─ <LocationStudioBody>  (also rendered alone by the fixture)
          loading → StudioSkeleton variant="locations" … label "Loading location library…"
          auth → AuthRequired · empty → <Slate kind="empty" kicker="NO SCOUTS" art="locations" title="Start with a reusable environment"
                                               body="Load the San Francisco starter library or create an original location."/>
          ready → <div class="studio-grid studio-grid--locations">
             ├─ <section data-studio="main">
             │    ├─ <ScoutWall items currentId compareIds kind onKindChange filter onFilterChange onOpen={guard(open)} onToggleCompare onCompare busyId/>
             │    ├─ <ScoutReport location sheet={latestSheet} primaryUrl crop onCropChange/>
             │    └─ <LocationSourceForm … timeOfDay={<TimeOfDayKeys value={draft.defaultTimeOfDay} onPick/>} referenceSlot={<ReferenceAssetManager defaultRole="environment" …/>}/>
             ├─ <Darkroom kind="location" title="Location sheet" intro="The metaprompt turns your environment notes into production-ready coverage before the selected Fal model is called." …/>
             ├─ <CompareSheet open a b onSwap onClose/>   └─ <ConfirmDialog …/>
```

- **Type select:** `Field label="Type"`, native select, `value` literals unchanged, option labels `Landmark`, `Neighborhood`, **`Coastline`** (value `coast`), `Interior`, `Other` (from `KIND_LABEL`).
- **TimeOfDayKeys:** `<div role="group" aria-label="Default light presets">` holds 4 `Button size="sm" variant="secondary"` keys in this order: 'Morning fog', 'Golden hour', 'Blue hour', 'Night neon'. Pressing a key calls `onDraftChange({ defaultTimeOfDay: label })`, which **replaces** the free text (the field exists: `LocationLibraryPage.tsx:26`, `:146`; `convex/assets.ts:84`; `convex/schema.ts:219`; used by `lib/assetGeneration.ts:57` as `Default light:`). A key has `aria-pressed="true"` when `draft.defaultTimeOfDay === label`. The input stays editable, and focus stays on the key.
- **Kind filter:** `'all'` or a literal. It combines with the text filter, and the open location and the compare marks persist while filtered. When nothing matches: `caption` "No locations match “{q}”." (Characters: "No characters match “{q}”.").
- **Compare:** at most 2 marks, first in first out: a third mark drops the oldest and announces politely "Compare set: {A} and {B}". The X key is handled on the wall `<ul>` `keydown` when `key.toLowerCase() === 'x'`, no modifier is held and exactly 2 are marked. It is scoped, so it is not a global shortcut (§7.12 row "X").
- **Compare loupe:** `pointermove` over either screen writes `--cx`/`--cy` (0–100, relative to the rendered image rect) on the sheet body. Each screen draws a 25%×25% bracket box via `transform: translate(…)`, with no transition. The screens are focusable `role="img"` with `aria-label="A · {name}"` / `"B · {name}"`, and arrow keys move the loupe 5%.
- **Scout report crops.** The source is the latest `role:'sheet'` history row. Default mode after `img.decode()` is Strip if `naturalWidth / naturalHeight ≥ 2.2`, else Grid. The user's choice holds for the selection.
  - The view order is the brief's (`lib/assetGeneration.ts:54`): establishing, approach, detail, atmosphere.
  - Each screen is `container-type: size` and holds an inner box with `aspect-ratio: {qw} / {qh}` and `width: min(100cqw, 100cqh * {qw} / {qh})`, centred and `overflow: hidden`. Here `qw = W / cols` and `qh = H / rows`, with Strip = 4×1 and Grid = 2×2.
  - The full `<img>` is absolutely positioned at `width: {cols·100}%`, `height: {rows·100}%`, `left: -{col·100}%`, `top: -{row·100}%`. There is no distortion and no JS layout.

#### 10.5.7 Darkroom pipeline and review-before-promote (D2)

`useSheetPipeline()` holds `run = { status: 'idle'|'running'|'done'|'failed'; stage; targetId; modelId; total; startedAt; phaseStartedAt; queuePosition?; uploaded; results: { storageId, url }[]; error? }`. It exposes `begin(targetId, modelId, total)`, `mark(stage)`, `onStatus(s: GenStatus)` (§6.6), `uploadedOne()`, `finish(results)`, `fail(message)` and `dismiss()`. It holds no Convex or fal code.

**Instrumented pipeline (the order is unchanged; only these calls are inserted):**

| Existing step (Character / Location line, 845147c) | Inserted call | StageTrack stage | GenerationFrame phase |
|---|---|---|---|
| after `setGenerating(true)` (`:120` / `:113`) | `pipeline.begin(current._id, modelId, options.numImages ?? 1)` | Save | `saving` |
| `persistDraft()` / `save()` (`:123` / `:116`), then validations (`:124-127` / `:117`) | none | Save | `saving` |
| before `expand(…)` (`:129` / `:120`) | `mark('expand')` | Expand | `expanding` |
| before `promptFingerprint(…)` (`:131` / `:122`) | `mark('queue')` | Queue | `queued` (`QUEUE --` until fal reports a position) |
| `generateImages({ …, onStatus: pipeline.onStatus })` (`:135` / `:126`) | IN_QUEUE → `queued` + position; IN_PROGRESS → `mark('render')` | Queue → Render | `queued` → `running` (`startedAt = phaseStartedAt`, `etaMs = etaFor(modelId)`) |
| before `Promise.all(… upload …)` (`:136` / `:127`) | `mark('upload')`; each upload `.then((id) => { pipeline.uploadedOne(); return id })` (still parallel, order kept) | Upload | `uploading` `progress={{ done: uploaded, total }}` |
| `completeGeneration` (`:137` / `:128`) resolves | `finish(storageIds.map((id, i) => ({ storageId: String(id), url: generated[i] })))` | Review (`status="done"`) | `done` with `src` = the history URL for that `storageId` when present, else `url` |
| `catch` (`:139-142` / `:130-133`) | `fail(message)` after `failGeneration` | the current stage, `status="failed"` | `failed`, `error={message}`, `onRetry` on **frame 0 only** (calls `generateSheet`) |

- The endpoints, the inputs, the `requestId` formats (`character-…`, `sheet-…`, `location-…`, `location-sheet-…`) and the `failGeneration` behaviour are unchanged.
- The running log is not shown.
- **Announcements.** GenerationFrame's `announce` prop (§7.5) gates its phase announcements. Frame 0 passes `announce="progress"` (the §6.6 progress strings, without 'Generation failed: <reason>'); every other frame passes `announce="none"`. A failure is announced once, by the inline `role="alert"` under the CTA.
- **Revision guard while a run is in flight.** `completeGeneration` discards a result when the target's revision changed after `startGeneration` ('Character changed before this result could be saved', `convex/assets.ts:410`, `:415`), and Save, upload and reference removal each bump the revision (`:169`/`:236`, `:280`/`:293`, `:325`/`:337`). So while `run.status === 'running'` and `run.targetId === current._id`, these are `aria-disabled="true"` with the Tooltip 'Wait for the sheet to finish', and their handlers do nothing: 'Save source'; `<ReferenceAssetManager disabled>` (the existing prop; ReferenceTray also applies it to each tile's 'Primary' and Trash2 actions); every 'Use as primary reference' and 'Remove from references'; and 'Load saved version'. Draft edits and the TimeOfDay keys stay enabled, because they write nothing.
- **Review tray.**
  - `PRIMARY` = `String(current.primaryStorageId) === storageId`, and `REF` = `current.referenceStorageIds.map(String).includes(storageId)`. Both are reactive, so they reflect `completeGeneration`'s automatic promotion and append (`convex/assets.ts:411`, `:416`).
  - 'Remove from references' calls the existing `onRemove` handler (`removeReference`, then the draft filter). If it removes the primary, the server promotes `refs[0]` (`convex/assets.ts:324`, `:336`) and the badge moves.
  - 'Use as primary reference' calls the existing `patch({ characterId|locationId, primaryStorageId })`. Like 'Remove from references', it renders only on `REF` tiles (§10.4.6).
  - 'Done reviewing' calls `dismiss()`.
  - While in review, Sheet history excludes the result ids.
- **Sheet history** lists only `role === 'sheet'` rows with a `url`. Their alts stay 'Generated character-sheet history' / 'Generated location-sheet history'. Uploads remain visible in the reference tray. A tile click opens `SheetViewer`: a `Dialog size="lg"` titled `Sheet {tag}`, the image contain-fit to `70dvh`, meta (model, created, `REV`, role), a `<details>` 'Prompt' with the prompt in `code`, and, for a `REF` sheet only, the same two actions. It never promotes on click.
- **D2.** No Convex behaviour changes. The backend fix (stop auto-append and auto-promote, add `approveSheet`) is follow-up §17.4 F1.

#### 10.5.8 Restyled shared components

**ReferenceAssetManager → ReferenceTray** (same props; additive `roles?`; hooks, `upload`, `acceptDrop` and the `getStorageUrl` resolve stay in `ReferenceAssetManager.tsx`):
- **Frame:** `<section aria-label="Reference images">`. Header: `<p>` 'Reference images' (`title-sm`), hint 'Identity, wardrobe, style, or environment images stay in Convex storage.' (`caption` `text-fg-3`), and on the right `<label>` 'Role' with a Select (`sm`) holding the same options per `targetType`.
- **Grid:** `repeat(auto-fill, minmax(128px, 1fr))`, gap 8.
- **Tile:** a `bg-screen rounded-screen aspect-[4/3]` with the `<img alt="Saved visual reference">`.
  - Top left: a role `Badge` on a `surface-hud` plate (`IDENTITY`/`WARDROBE`/`STYLE`/`ENVIRONMENT`/`SHEET`) when `roles` knows it.
  - Top right on the primary: a `PRIMARY` plate with a filled Star in `text-fg-on-screen` (never accent on a HUD plate, per the §5.6 ledger).
  - Bottom: a **28 px `surface-hud` action strip, always visible**, holding the 'Primary' button (Star 12 + text 'Primary', `aria-label="Use as primary image"`) and a Trash2 IconButton (`aria-label="Remove reference from this item"`).
- **Add tile:** `aspect-[4/3] surface-inset border border-dashed border-line-control rounded-screen`, ImagePlus 16 + 'Add reference' (`body-sm` medium `text-accent`), then `{n}/14 · drop or choose` (`readout` `text-fg-3`). While uploading: BayerSpinner 16 + 'Uploading…'. Drag-over (`dragenter`/`dragleave`, `data-dragover`): `border-accent` + 25% Bayer accent fill. It stays single-file (`files[0]`). At the limit the button is disabled, as today.
- **Error:** `<p role="alert" class="caption text-danger">`.

**ImageGenerationControls** (props and option values unchanged):
- **Layout:** `grid grid-cols-2 gap-2` (3 columns when the Darkroom is ≥ 560 wide). The model select spans all columns.
- **Selects:** each is the native `Select` (`surface-inset border-line-control rounded-sm sq h-[var(--h-control)] text-body-sm`) with its **exact aria-label**. Above each sits an `aria-hidden` `micro` `text-fg-3` kicker: `MODEL`, `ASPECT`, `VARIATIONS`, `FORMAT`, `RESOLUTION` | `QUALITY`, `BACKGROUND`.
- **Icon:** `Settings2` stays `aria-hidden`.
- **Truthful ratio caption:** when `model.family === 'gpt-image'` and the ratio is not `16:9`, `9:16` or `1:1`, a `caption` `text-fg-3` reads "GPT Image 2.5 renders this ratio as 16:9." This matches `gptImageSize` (`lib/imageModels.ts:85-95`). Fixing the mapping is follow-up §17.4 F6 (D7).
- **Advanced:** `<details>` in `surface-inset rounded-sm sq`, summary 'Advanced model controls' (`body-sm` medium, ChevronRight → ChevronDown as a cut), and every inner label and placeholder verbatim.

#### 10.5.9 The `/admin/visual-test` fixture

**Route** (`app/admin/visual-test/page.tsx`). §10 owns this file. This is its final text. Each owning part adds only its own import and element, in the part named in the comment; 10-DS (5A) adds only `DesignSystemFixture`. Every fixture component renders its own root section with its id, so the page adds no `<section>` wrapper. There is no `app/admin/visual-test/loading.tsx`: a Suspense boundary above a `notFound()` page turns its 404 into a 200 (§6.3).

```tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import AssetStudioVisualFixture from '../../../components/AssetStudioVisualFixture'
import DesignSystemFixture from './DesignSystemFixture'                                        // 5A
import ThrowProbe from './ThrowProbe'                                                          // 4D
import LiveControlVisualFixture from '../../../components/director/LiveControlVisualFixture'  // 8B
import ShotboardVisualFixture from '../../../components/shotboard/ShotboardVisualFixture'     // 9B
import LibraryVisualFixture from '../../../components/media/LibraryVisualFixture'            // 11A
import AnalyticsVisualFixture from '../../../components/analytics/AnalyticsVisualFixture'     // 11C

export default function VisualTestPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <Suspense fallback={null}>
      <ThrowProbe />
      <AssetStudioVisualFixture />
      <DesignSystemFixture />
      <LiveControlVisualFixture />
      <ShotboardVisualFixture />
      <LibraryVisualFixture />
      <AnalyticsVisualFixture />
    </Suspense>
  )
}
```

| Section (rendered by the component itself) | Component | Owner | Part |
|---|---|---|---|
| — (throws on `?throw=render` in dev; otherwise `null`) | `app/admin/visual-test/ThrowProbe.tsx` | §11.D.10 | 4D |
| `div.asset-studio` containing `section#characters-visual-test`, `section#locations-visual-test` and `section#audio-library-visual-test` | `components/AssetStudioVisualFixture.tsx` | §10 | exists; 10D adds `#characters-visual-test`, 10E adds `#locations-visual-test`, 10F completes it |
| `section#design-system-visual-test` with the `#ds-*` blocks below | `app/admin/visual-test/DesignSystemFixture.tsx` | §10 hosts; each specimen's content and controls belong to its primitive's owner | 5A–5C |
| `section#live-control-visual-test` | `components/director/LiveControlVisualFixture.tsx` | §8.5.13 | 8B |
| `section#shotboard-visual-test` | `components/shotboard/ShotboardVisualFixture.tsx` | §9.6.3 | 9B |
| `section#clips-visual-test`, `section#recordings-visual-test` | `components/media/LibraryVisualFixture.tsx` | §11.A, §11.B | 11A |
| `section#analytics-visual-test` | `components/analytics/AnalyticsVisualFixture.tsx` | §11.C | 11C |

**Headings.** From 10F the page has exactly one `h1`: CharacterStudioView's PageHeader ('Characters with a stable identity'). DesignSystemFixture and LocationStudioBody render no `h1`. Every other view a fixture renders takes `headingLevel` 2 from its fixture (ShotboardView, BoardTitle and ShotboardBoundary in §9; ClipsView, RecordingsView and AnalyticsView in §11); LiveControlVisualFixture renders no `h1` (§8.5.13). Every `[id]` on the page is unique (ids from `useId()`, §10.4.1).

**Rules for every fixture file** (`components/AssetStudioVisualFixture.tsx`, `app/admin/visual-test/*`, `lib/fixtures/*`, and the fixture components in the table above):
- No import of `convex/react`, `convex/_generated/api`, `@fal-ai/*` or `lib/imageGen`.
- No `fetch` in fixture files. The Clips/Recordings fixtures' Download calls `lib/download.ts` on same-origin `/fixtures/*` only (§11.A).
- Images and media are same-origin (`/brand/**`, `/fixtures/**`) or `data:`.
- Handlers mutate local state only.
- Deterministic clocks via `FIXTURE_NOW`.
- The DS broadcast simulator is the only thing that touches global state, and only on click.
- `AssetStudioVisualFixture` keeps its docstring `/** Development-only deterministic visual fixture. It never mounts Convex hooks. */`. Its root is `<div className="asset-studio">`, not a nested `<main>` (the change lands in 4B, §14.3 R4).

**AssetStudioVisualFixture composition** (items 3 and 4 land in 10D and 10E with the populated data only, so each page part can capture its route's ready state; 10F restyles items 1 and 5, adds item 2 and adds every other state):
1. `InlineBanner tone="warning"` with the verbatim 'Visual-test fixture only. No account, Convex mutation, GMI request, or Fal generation is available on this route.' (10F)
2. Two native selects: 'Studio fixture state' (writes `?studio=`) and 'Scout fixture state' (writes `?scout=`), read with `useSearchParams()`. (10F)
3. `<section id="characters-visual-test">` holding `<CharacterStudioView>` with fixture props, `description="Fixture state mirrors the generated character-sheet workspace."` and Darkroom `intro="The source is expanded before the selected Fal image route is called."` (both fixture strings kept). The references slot is `<ReferenceTray>`. The section has no heading of its own: CharacterStudioView's PageHeader `h1` is inside it. (10D)
4. `<section id="locations-visual-test" aria-labelledby>` (the `h2`'s id from `useId()`) with eyebrow 'Location selection' (keeps `uppercase`), `h2` 'Reusable San Francisco environments', then `<LocationStudioBody>`. (10E)
5. `<section id="audio-library-visual-test">`, restyled (10F):
   - eyebrow 'Audio library visual fixture' (keeps `uppercase`) and `h2` 'Coast originals';
   - the MorphSlider specimen (`[data-specimen="MorphSlider"]`, the attribute lands in 5C): a 1:1 `bg-screen rounded-screen` stage (max 448) holding `next/dynamic` MorphSlider with the 4 covers of `FX_TRACKS`, **`autoplay autoplayDelay={6}` kept** (D3), `overlayColor="#05080F"`, `radius={2}`, `activeIndex={armed}` and `onIndexChange={setShown}`. It is mounted only while `useEffectCanvasSlot('morph', 2, inView && artworkSlot)` returns true (otherwise a static `<img>` of the cover at `shown`), plus a `Switch` 'Artwork slot' (`artworkSlot`, on by default);
   - autoplay pauses under every §12.4.1 condition that exists on this route: the air lock (which 'Simulate recording' and the other `#ds-simulator` buttons can set), reduced motion and a hidden page. The dock-collapsed and Audio-tab-hidden conditions have no fixture counterpart. Where §12.4.1 computes a condition in the caller rather than inside MorphSlider, the fixture computes it the way TrackManager does. Fixture screenshots run with `reducedMotion: 'reduce'` (§10.10 Run modes), so the slide shown is the same in every capture;
   - display-only arming, mirroring §8.5.10 (D3, §0.4 BC-15). The fixture holds two states: `shown` (the slide on screen, written only by `onIndexChange`) and `armed` (initially `0`, 'SPRING (intro)'). No slide change writes `armed`: not autoplay, not 'Previous song artwork' or 'Next song artwork', not a 'Song artwork' tab and not a drag. The 'Arm this track' button under the stage (rendered exactly as §8.5.10 renders it, with its label and disabled rule) sets `armed = shown`;
   - the selected-track row (`surface-inset`, Check icon in `text-accent`, the name of `FX_TRACKS[armed]` in `<span data-armed-track>`, 'Preview' ghost sm with Play);
   - 'Music gain · 25%' readout with Volume2, and 'Mix in output' (secondary sm).
   - All `violet-*`, `#0c0c12` and `#090713` are removed.

`populated` is the default of both params. It is the only state in 10D and 10E; 10F adds the selects and every other row below.

| `?studio=` | Renders | `?scout=` | Renders |
|---|---|---|---|
| `populated` (default) | @coast selected, locked, `REFS 5/14`, history REV 12·A (PRIMARY, REF), REV 12·B (REF), REV 9 | `populated` (default) | 10 starters, Ferry Building open, `Morning fog` set, one sheet (Grid crops) |
| `loading` | StudioSkeleton + CoastLoader 'Loading character library…' | `loading` | 'Loading location library…' |
| `empty` / `auth` / `not-configured` | OPEN CASTING / AuthRequired / NotConfigured with the Characters sentence | `empty` / `auth` | NO SCOUTS / AuthRequired |
| `dirty` | Name edited → `UNSAVED`; a roster click opens the guard | `compare` | Mission District = A, Ocean Beach = B, CompareSheet open |
| `changed` | The CHANGED banner | `review` | Location review tray with 1 result |
| `no-reference` | @mara: NEEDS REF, hint visible, `REFERENCE` LED off | `failed` | Failed at Render, `SIGNAL LOST · Nano Banana 2 returned no image` |
| `unlocked` | @orio: static portrait, no foil | `no-sheet` | Report in Off mode, "No location sheet yet." |
| `seeded` | @coast exactly as `seedStarterLibrary` creates it (locked, 0 refs, no `imageUrl`, no history): `NEEDS REF`, the roster avatar is `avatar/coast-px`, the HoloCard portrait is `talent/coast-portrait` | | |
| `saving`, `expanding`, `queued`, `running`, `uploading` | The run at that stage, 2 frames. `running` uses `startedAt = Date.now() − etaFor('nano-banana')` | | |
| `review` | 2 results, PRIMARY+REF and REF | | |
| `failed` | Failed at Expand, error 'GMI prompt expansion exceeded its three-minute deadline' | | |

**Fixture data (`lib/fixtures/assetStudio.ts`;** 10D: `FIXTURE_NOW`, `FX_CHARACTERS` without the `seeded` row, `FX_CHARACTER_HISTORY`; 10E: `FX_LOCATIONS`, `FX_LOCATION_HISTORY`; 10F: the `seeded` row, `FX_TRACKS`, `FX_RUNS`**):**
- `FIXTURE_NOW = Date.UTC(2026, 8, 24, 21, 4, 0)`.
- `FX_CHARACTERS`:
  - Coast / `coast`: locked, the description from `AssetStudioVisualFixture.tsx:13` verbatim, identityNotes 'Face, hairline and proportions from the approved references.', defaultWardrobe 'Chosen per scene.', revision 12, `updatedAt = FIXTURE_NOW − 2 d`, 3 uploads (2 identity, 1 style) + 2 REF sheets.
  - Mara / `mara`: locked, 0 refs, `:14` description, `FIXTURE_NOW − 5 h`.
  - Orio / `orio`: unlocked, 2 style refs, `:15` description, `FIXTURE_NOW − 26 min`.
  - For `?studio=seeded`, Coast is replaced by the seed row (`convex/assets.ts:468-477`): name 'Coast', handle `coast`, starterKey `coast`, the seed description verbatim, `identityLocked: true`, revision 1, no `referenceStorageIds`, no `primaryStorageId`, no `imageUrl` and no history. Mara and Orio are unchanged.
- `FX_CHARACTER_HISTORY`: `HistoryRow[]` with roles, `sourceRevision`, `modelId: 'nano-banana'`.
- `FX_LOCATIONS`: the 10 `STARTER_LOCATIONS` (`convex/assets.ts:437-448`, with names, handles without `@`, kinds and descriptions verbatim), `_creationTime` 1…10, `defaultTimeOfDay` on Ferry Building 'Morning fog', North Beach 'Golden hour' and Chinatown 'Night neon'.
- `FX_LOCATION_HISTORY`: one sheet for Ferry Building.
- `FX_TRACKS`: 'SPRING (intro)', "CHASIN $'s", 'POP OUT', "KEEP GOIN'", each with images `/brand/slate/{clips,recordings,analytics,shotboard}.webp`.
- `FX_RUNS`: one `SheetRun` per state above.
- Every sheet or reference image is `assetPlaceholder(label, hue)`.

**`section#design-system-visual-test`** (`DesignSystemFixture.tsx`, host created in 5A; 5A–5C add their specimens, 8B adds `ds-connect`, each page part adds its skeleton composition, and 10F removes the RouteSkeleton specimen):
- Each block is `<section id="ds-…" aria-labelledby>` (the `h2`'s id from `useId()`) with an `h2` naming the primitive.
- The fixture is a specimen sheet, so the one-primary-per-view rule does not apply inside it.
- It renders no `PageHeader` and no `h1` (the route's h1 is the studio view's).
- Every §12 effect and retained-component specimen has a root with `data-specimen="<Component>"`, and each value appears once on the page. The hosts: PxResolve, PixelFace, DecryptedText, CountUp, SelectionBrackets, SymbolRaster, HoloCard, HoverClipButton and StreamList in `#ds-effects`; StageTrack in `#ds-generation`; AccordionGallery in `#ds-accordion-gallery`; ChromaGrid and PixelCard in `#ds-reactbits`; MorphSlider in `#audio-library-visual-test` (above).
- Data comes from `lib/fixtures/designSystem.ts`: `FX_BROADCAST_SNAPSHOTS` (idle, connecting, preview, rec, cue, onAir, stalled, offAir), `FX_STREAM_ROWS` ('fixture row 1'…'fixture row 12'), `FX_STAT_TILES` (Current viewers 1284, Followers 51234, Uptime 4364 s, Category 'Just Chatting'), `FX_FORMAT_CASES`, `FX_SLATES` (every kind with its §6.13 kicker and art, and each route's preserved empty copy), `FX_CHYRONS`, and `FX_DECRYPT_LABELS`: the five CONNECT_STEPS strings verbatim ('Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene'). `components/director/constants.ts` does not exist until 8A, so 8B replaces the five literals with its `CONNECT_STEPS` import (§8.2).

| id | Specimens (every state) |
|---|---|
| `ds-tokens` | Every `--c-*` swatch with its name and RGB on panel; ramp 0–3 + glint; tally colours on bezel |
| `ds-type` | Every §5.20.2 key as a sample line labelled with the key |
| `ds-icons` | Every §5.20.6 allowed icon at 14/16/20 |
| `ds-bayer` | `--bayer-4-00…15`, `.bayer-25/50/75`, `.dither-rule`, `.skeleton-dither` |
| `ds-button` | primary/secondary/ghost/danger × sm/md/lg × idle, pending (`pendingLabel` 'Saving…'), success, error, disabled; with icon and `iconRight` |
| `ds-icon-button`, `ds-hold-button` | IconButton ghost/secondary × sm/md × pressed. HoldButton labelled 'Hold to go live (fixture)', `confirm.title` 'Go live on Twitch?', `confirmLabel` 'Go live', `cancelLabel` 'Not yet', and a commit stub counter in `data-commits` |
| `ds-panel`, `ds-section-header` | Panel tones panel/inset/chassis/screen with header and footer; SectionHeader with eyebrow, meta and actions |
| `ds-fields` | Field (hint, error, required); Input, Textarea (`autoGrow`, `mono`), Select: default, disabled, readOnly |
| `ds-toggles` | Switch on/off/description; Checkbox; RadioGroup; SegmentedControl sm/md, disabled with reason; Slider; NumberStepper |
| `ds-badges` | Badge 5 tones × soft/outline; Chip icon/mono/selected/removable |
| `ds-tabs`, `ds-overlays` | Tabs `keepMounted`; Tooltip, Kbd `mod+K`; buttons opening Dialog, ConfirmDialog (destructive, `typeToConfirm` 'Fixture board', `cancelLabel` 'Keep board'), Sheet right and bottom, and Popover |
| `ds-scrollfade`, `ds-banners`, `ds-spinner` | ScrollFade x/y; InlineBanner info/success/warning/danger with kicker and action; BayerSpinner 12/16 |
| `ds-lamps` | TallyLight every §7.4 kind × lit/unlit × sm/md (`fault` and `stale` join in 11A); TallyBar and TallyCluster (full and compact) from `snapshot` props per `FX_BROADCAST_SNAPSHOTS` |
| `ds-meters` | Led 5 tones and `labelHidden`; LedLadder 4/20 at ok/warn/danger; Readout; StatTile ×4 with trend; FreshnessStamp fresh and stale (fixed `at`) |
| `ds-slates` | Every kind at panel size, and `not-found` at route size (Slate's default `titleAs="h2"`, so the page keeps one `h1`) |
| `ds-skeletons` | Skeleton text/media/block; StudioSkeleton from 5A; RouteSkeleton from 5A until 10F, which removes its specimen (its visually hidden `h1` would be a second `h1` on the route, and 11C deletes the component); each other composition joins in the part that creates it (§6.3); each in a 480 px-high clipped frame |
| `ds-generation` | GenerationFrame × 7 phases (ratio 4:3, modelLabel 'GPT Image 2.5 Sunburst'); the StageTrack specimen (`[data-specimen="StageTrack"]`) horizontal/vertical × running/done/failed with its control (table below); ContactSheet with PRIMARY, REF, pending frame and failed frame |
| `ds-connect` | Lands in 8B, with the §8.4.4 ConnectPlate (it needs `components/director/constants.ts`, created in 8A): the connect plate with `SegmentedControl label="Connect step"` 0–4, the five CONNECT_STEPS verbatim, and exactly one button named 'Cancel' |
| `ds-effects` | One `[data-specimen]` root each for PxResolve, PixelFace (the full charset), DecryptedText, CountUp, SelectionBrackets, SymbolRaster, HoloCard (locked and unlocked, `talent/coast-portrait`), HoverClipButton and StreamList, with the controls in the table below |
| `ds-reactbits` | ChromaGrid (`[data-specimen="ChromaGrid"]`, fixture items from `FX_CHARACTERS` with `assetPlaceholder` images). PixelCard (`[data-specimen="PixelCard"]`) behind a `Switch` 'Show PixelCard' (off by default): its canvas mounts only while `useEffectCanvasSlot('pixel-card', 0, shown)` is granted (§7.16); otherwise it renders a same-size static 25% Bayer tile |
| `ds-brand` | Wordmark 20 and 16; CoastLoader 64 and 128; BrandImage for every manifest id; `<BrandVideo id="motion/coast-standby-loop" />` (API §13.8; §13.11's keyless item expects the `standby/coast-16x9` poster `<img>` and no `<video>`) |
| `ds-feedback` | Buttons 'Push info chyron', 'Push success chyron', 'Push warning chyron', 'Push error chyron', 'Push undo chyron', 'Set status message' |
| `ds-format` | `tc(0)`, `tc(4364)`, `tcShort(7400)`, `duration(95)`, `duration(3725)`, `bytes(1610612736)` → '1536.0 MB', `bytes(1610612736, { gb: true })` → '1.50 GB', `formatMime('video/webm;codecs=vp9')` → 'WebM · VP9' (values are §5.20.4's table) |
| `ds-hooks` | Live values of useReducedMotion, usePageVisible, useDelayedFlag (demo toggle), useLoadState on fixture data, useConvexAuthState, useDensity, useTheme, useSecondClock, useBroadcast; `bayerMaskVar(7)`; the `window.__wzrd.slots` owner |
| `ds-simulator` | Broadcast simulator buttons: 'Simulate idle', 'Simulate connecting', 'Simulate preview', 'Simulate recording', 'Simulate cue', 'Simulate on air', 'Simulate stalled', 'Simulate off air', 'Reset simulator'. They call `broadcast.publish`/`reset` and show the live `data-broadcast`/`data-lock`. `reset()` also runs on unmount |
| `ds-accordion-gallery` | The vendored AccordionGallery (untouched) in a `[data-specimen="AccordionGallery"]` root: 3 fixture items, `trigger="click"`, `accentColor="rgb(var(--c-accent))"`, `overlayColor="rgb(var(--c-screen))"` |

**Specimen controls** (owned by §12, listed here verbatim; each control sits inside its specimen's root):

| Specimen | Controls |
|---|---|
| PxResolve | mount, 120 ms and `airAllow` instances, plus a key instance with 'Replay' |
| DecryptedText | 'Next label' (cycles `FX_DECRYPT_LABELS`: the five CONNECT_STEPS strings verbatim in `lib/fixtures/designSystem.ts`; 8B replaces them with the import from `components/director/constants.ts`) |
| StageTrack | `SegmentedControl label="Connect step"` with options `['0','1','2','3','4']` |
| StreamList | 'Add 3', 'Add 12', both `newest` modes |
| SelectionBrackets | viewfinder, selection and tight, plus a Switch 'Tight' |
| SymbolRaster | a 1280×720 container; 'Density .10', 'Density .40', 'Density 1', 'Clear'; a 'Run raster' switch (priority 3) |
| HoloCard | locked and unlocked (`talent/coast-portrait`) |
| HoverClipButton | 'Play ident' with the committed `public/fixtures/testcard-320x180-2s.{webm,mp4}` (created in 5C with §11.0's ffmpeg commands) and the poster `/brand/talent/coast-portrait-384.webp`; no `page.route` stub |
| CountUp | value 1234, 'Replay', 'Set 1300' |
| MorphSlider | 4 covers, plus a Switch 'Artwork slot' (on by default) |

**Ready-state capture targets.** The owner sees every redesigned route in its ready state through element captures of these fixture targets. §10.5.9 owns the two new section ids (`#characters-visual-test`, `#locations-visual-test`) and the `data-ready-state` values, as it owns the section ids above. §15.10 names the capture files and puts them in the PR Screenshots table of the part in the "Lands in" column.
- Each `data-ready-state` value appears exactly once on the page. It sits on the element that wraps exactly that state's view (its label strip or header included), inside its host section. The fixture component named in the §10.5.9 section table adds it in the part listed.
- Every target follows the rules for every fixture file above: fixture data only, no network.
- Each target is captured with `locator.screenshot()` at a 1440×900 viewport, once in dark and once in light, under §15.10's capture settings and with `reducedMotion: 'reduce'`, as every fixture screenshot in §10.10.

| Route | Ready state | Target on `/admin/visual-test?noboot` | Lands in | Before the capture |
|---|---|---|---|---|
| `/admin` (Live Control) | Standby: the idle 16:9 program column (`STAND BY`, 'Director offline') of §8.5.13 | `#live-control-visual-test [data-ready-state="live-standby"]` | 8B | nothing |
| `/admin` (Live Control) | Preview: the preview program column (`programStill` under the transparent `<video>`) | `#live-control-visual-test [data-ready-state="live-preview"]` | 8B | nothing |
| `/admin` (Live Control) | On air: the on-air program column (TallyBar `snapshot` with `air: 'on'`, plus the keyline) | `#live-control-visual-test [data-ready-state="live-onair"]` | 8B | nothing |
| `/admin/shotboard` | The §9.6.3 item-1 editor: 3 scenes and 7 shots, with one frame generating and one failed | `#shotboard-visual-test [data-ready-state="shotboard"]` | 9B | The three Shotboard steps below |
| `/admin/characters` | `?studio=populated` (the default): @coast selected and locked, `REFS 5/14`, the turnaround, Sheet history and the Darkroom, with `assetPlaceholder()` art | `section#characters-visual-test` | 10D | nothing |
| `/admin/locations` | `?scout=populated` (the default): the 4:3 contact wall of the 10 starters with Ferry Building open, the scout report and the Darkroom | `section#locations-visual-test` | 10E | nothing |
| `/admin/clips` | The ready body with the 100 `CLIP_FIXTURES` (§11.A): clips #1, #2 and #3 read CAPTURING, UPLOADING and FAILED at the top of the first group | `#clips-visual-test [data-ready-state="clips"]` | 11A | nothing |
| `/admin/recordings` | The ready list of the 30 fixture rows (24 rendered, §11.B) | `#recordings-visual-test [data-ready-state="recordings"]` | 11B | nothing |
| `/admin/analytics` | LIVE with data: the live state on `VIEWER_SERIES_24H` (§11.C) | `#analytics-visual-test [data-ready-state="analytics-live"]` | 11C | nothing |
| `/admin/analytics` | NOT PATCHED: the not-configured (503) state with the server sentence verbatim | `#analytics-visual-test [data-ready-state="analytics-not-patched"]` | 11C | nothing |

**Shotboard ready board** (9B adds this to §9.6.3's fixture; nothing else in §9.6.3 changes):
- The item-1 board lays its 7 shots out 3/2/2: SC01 · SH01–SH03, SC02 · SH01–SH02 and SC03 · SH01–SH02. SC01 · SH02 stays the @coast shot, and SC01 · SH03 is the `gpt-sunburst` shot.
- SC03 · SH02 carries persisted `imageStatus: 'failed'` and no `imageUrl`, so its frame shows §9.6.2's failed plate with 'Retry' at rest.
- A fixture-only `Switch` 'Hold generation' sits next to 'Reject writes' and is off by default. While it is on, the injected `generate` emits `queued 2 → running` as usual and then stays pending. Turning it off lets every held call resolve as §9.6.3 describes. The switch is off at load, so §9.10's transfer check still reads 'No generations running'.

The three Shotboard steps, in order:
1. Turn on 'Hold generation'.
2. Click the SC02 · SH01 frame (the `[data-testid="shot-frame"]` whose tag row starts with `SC02 · SH01`), then press 'Generate image' in the inspector ('Regenerate image' if the shot already has a picture).
3. Wait until that frame has `data-phase="running"`, then capture the target.

### 10.6 States

| State | Trigger | Characters | Locations |
|---|---|---|---|
| Route loading | Navigation (§6.3 `loading.tsx`) | `StudioSkeleton` + `<CoastLoader size={64} label="Loading Characters">` | 'Loading Locations' |
| In-page loading | `useDelayedFlag(data === undefined \|\| auth.isLoading, { delayMs: 150, minMs: 300 })` | `StudioSkeleton header={false}` + CoastLoader 'Loading character library…' (`role="status"`); `px-resolve` on the content only if the skeleton was shown | 'Loading location library…' |
| Not configured | `!useConvexEnabled()` (checked before any Convex hook) | Header band (no actions) + `<NotConfigured size="route" message="Convex is not configured. Character library changes are disabled.">` (kicker, art and copy: §11.D.7) | "Convex is not configured. Location library changes are disabled." |
| Auth required | Configured, `useConvexAuthState()` loaded and `!isAuthenticated` (a signed-out `[]` is never "empty") | Header band (no actions) + `<AuthRequired size="route">` (kicker, art, copy and the 'Reload' action: §11.D.7) | same |
| Empty | Authenticated, `[]` | Slate `empty` OPEN CASTING, art `slate/characters`, 'Start with a reusable character' / 'Create one, or load the San Francisco starter set to add @coast.', no slate actions (the header keeps them) | NO SCOUTS, `slate/locations`, 'Start with a reusable environment' / 'Load the San Francisco starter library or create an original location.' |
| Filter, no match | The filter text matches 0 | "No characters match “{q}”." | "No locations match “{q}”." |
| Ready | ≥1 row | Auto-selects @coast, else row 0 | Auto-selects wall[0] |
| Saving | Save source | 'Save source' → 'Saving…' (width-locked, `aria-busy`); the CTA is disabled | same |
| Unsaved / changed | §10.5.2 | `UNSAVED` Led; the guard dialog; the CHANGED banner | same |
| Generate blocked | `!canGenerate` / `!readyToGenerate` | ReadinessRow + 'Add a name, handle, description, and a face reference while identity lock is enabled.' (`text-warning`) | 'Add a name and environment description to continue.' |
| Generating | `run.status === 'running'` | CTA 'Generating character sheet…'; StageTrack; N GenerationFrames in the tray (`aria-busy`); the target's roster row shows a BayerSpinner; for the run's target, 'Save source', the reference actions, the promote/remove tile actions and 'Load saved version' are `aria-disabled` with 'Wait for the sheet to finish' (§10.5.7) | 'Generating location sheet…'; the target plate's meta shows a BayerSpinner; the same actions are `aria-disabled` |
| Review | `finish()` | REVIEW tray; success chyron '{n} character-sheet variation(s) saved to Convex storage.' | '{n} location-sheet variation(s) saved to Convex storage.' |
| Generation failure | `catch` | `role="alert"` under the CTA with the message verbatim (for example 'Add an approved face reference before generating a locked identity like @coast', 'This workspace supports at most 14 reference images; remove some references first'); frames `SIGNAL LOST · {reason}`, 'Retry' on frame 0; StageTrack failed at the stage | same, for example 'Add an environment description before generating' |
| Other errors | create / seed / save / promote / remove | Sticky error chyron (`role="alert"`) with the message verbatim (for example 'Name and @handle are required', '@{handle} is already in use') | same ('A location name is required') |
| Notices | Create / save / seed | Success chyron (`role="status"`, 5000 ms): 'Character created. Add a name, handle, identity description, and approved face references.', 'Character source saved.', 'Starter library ready: {n} San Francisco locations and @coast.' | 'Location created. Define its environment before generating a reusable reference sheet.', 'Location source saved.' |
| History | `history` undefined / no sheets | 4 skeleton tiles + "Loading sheet history" / 'Generated sheets will remain here for review.' | same |
| References | ReferenceAssetManager | 'Uploading…'; 'This library item already has the 14-image reference limit.'; 'Choose an image file for a visual reference.'; 'Upload failed ({status})' (`role="alert"`) | same |
| Offline | `navigator.onLine === false` | Shell OfflineBanner (NO CARRIER, "Network offline"); the CTA is disabled with the hint "Network offline"; mutations that fail raise error chyrons | same |
| Live / air lock | Never set on these routes: leaving Live Control ends the session (§6.12) | Components still honour it: HoloCard static, CoastLoader still, skeleton static | same |

### 10.7 Motion

| Moment | Spec | Reduced motion |
|---|---|---|
| Route enter | Template `px-resolve` only (§6.4); no page-level resolve | none |
| Skeleton → content | 160 ms `px-resolve`, only if the skeleton was visible | cut |
| Selection change | The main column (`[data-studio="main"]` content keyed by `selectedId`) runs one `<PxResolve trigger="key">` of 160 ms. The rail, wall and Darkroom chrome never resolve | cut |
| Hover (row, plate, key) | Background colour 120 ms. **No hover transforms**, no image zoom | colour only |
| Selected / marked | The border, fill and brackets snap (60 ms) | cut |
| HoloCard | Tilt ≤ 6° on `(pointer: fine)` hover. `pointermove` writes `--rx/--ry` with no transition while the pointer tracks; on leave the card returns over 200 ms `--ease-out`. Foil per §12.3.11 | static foil at 35°; no tilt under keyboard focus |
| HoverClipButton | Plays on hover or focus, resets on leave (§12.3.12) | not rendered (§12.3.12); the portrait stays |
| Generation | GenerationFrame per §6.6. StageTrack squares snap. The `T+` readout updates ≤ 4 Hz via the ticker | static 25% field + text; 150 ms crossfade |
| Tray and history tiles | New tiles run a 160 ms `px-resolve`, with a 30 ms stagger for ≤ 8 | cut |
| Keys | TimeOfDay keys and secondary buttons: `translate-y-px shadow-key-pressed`, 60 ms `--ease-key` | colour only |
| CompareSheet | Sheet 320 ms `--ease-out`. The loupe follows the pointer via `transform` with no transition | instant |
| Chyrons, dialogs | §6.10 / §7.3 | instant |

Only `transform`, `opacity` and stepped `mask-image` animate. Nothing loops except CoastLoader while loading, the skeleton sweep and the running scanline.

### 10.8 Accessibility

| Area | Requirement |
|---|---|
| Headings | h1 = PageHeader title (one per route; on `/admin/visual-test` from 10F, the Characters PageHeader is the only h1, §10.5.9). h2: 'Cast', `{draft.name \|\| 'Untitled character'}`, 'Character sheet' / 'Location sheet', 'Scout report'. h3: `TURNAROUND`, `INVARIANTS`, 'Character source' / 'Location source', 'Sheet history' |
| Roster / wall | Roving tabindex (§10.5.3). Each button's name is its visible text (for example "Coast @coast LOCKED 5/14 updated 2d ago"). `aria-current="true"` on the selected item. The compare checkbox is named `Compare {name}`. X is documented in the ShortcutSheet (§7.12) and is not global |
| Controls | Every `<label>` is associated (`htmlFor`). The Switch is `role="switch"` named exactly 'Lock the face and overall look across generations'. Read-only identity fields carry `aria-readonly`. The TimeOfDay keys form `role="group"` 'Default light presets' with `aria-pressed`. Every ImageGenerationControls select keeps its aria-label, and the kickers are `aria-hidden`. Every id referenced by `aria-labelledby`, `aria-describedby` or `aria-controls` comes from `useId()` (§10.4.1) |
| Actions at rest | Reference and contact-tile actions are always visible (no hover-only). IconButtons have labels. Targets are ≥ 24 px, and 44 px on coarse pointers |
| Live regions | Notices keep `role="status"` and errors keep `role="alert"`, in chyrons and in the inline Darkroom alert. GenerationFrame frame 0 (`announce="progress"`) makes one polite announcement per phase; the other frames pass `announce="none"`, and a failure is announced once, by the inline alert (§10.5.7). The tray is `aria-busy` while running. Compare-set changes are announced politely |
| Dialogs | ConfirmDialog `cancelLabel` is 'Keep editing' (never 'Cancel'). Focus returns to the trigger. Esc closes the Sheet and dialogs |
| Images | Portrait: `{name} character card`. References: 'Saved visual reference'. History: the preserved alts. Avatars and decorative plates: `alt=""` or `aria-hidden` |
| Casing | The 8 preserved `uppercase` sites keep the class. New kickers are authored uppercase. 'Visual asset studio' computes `text-transform: none` |
| Contrast | Hints and eyebrows use `text-fg-3` or `text-warning` on panel (text-3 on panel is 5.80:1 dark / 5.98:1 light, and its worst surface, hover, is 5.04:1; §5.6). Text on HUD plates uses `text-fg-on-screen`; `text-fg-on-screen-2` appears only on `bg-screen` or the solid bezel (§5.6). `tests/contrast.spec.ts` covers `.asset-studio` |
| Preferences | Reduced motion (§10.7), reduced transparency (opaque panels), `prefers-contrast: more` |

### 10.9 Preserved contract

#### 10.9.1 From `docs/redesign/audit/assets.md` (all 21 invariants, verbatim)

- **A1** Keep the global Dither background exactly as mounted in app/layout.tsx:37 (components/DitherBackground.tsx, fixed -z-10, pointer-events-none, aria-hidden, dark/light palettes). Do not edit vendored dashboard/components/dither-kit/* (dither-kit.json lockfile hashes).
- **A2** Routes and nav: /admin/characters and /admin/locations with AdminNav labels "Characters" (UsersRound) and "Locations" (MapPin) (components/AdminNav.tsx:10-11). /admin/visual-test must keep `if (process.env.NODE_ENV === 'production') notFound()` and must never mount Convex hooks (AssetStudioVisualFixture docstring: "It never mounts Convex hooks").
- **A3** Convex-disabled gate: useConvexEnabled() must be checked before any Convex hook mounts (CharacterLibraryPage.tsx:43-45, LocationLibraryPage.tsx:42-44). Keep the exact strings "Convex is not configured. Character library changes are disabled." and "Convex is not configured. Location library changes are disabled." The unconfigured-admin test flow in .agents/skills/admin-testing/SKILL.md launches with NEXT_PUBLIC_CONVEX_URL unset and expects no console errors beyond a React DevTools message.
- **A4** Convex API contract used by the studio (names and argument shapes must not change): api.assets.listCharacters, getCharacter, createCharacter({name, handle, identityLocked}), patchCharacter({characterId, name, handle, description, appearance, identityNotes, defaultWardrobe, voiceNotes, visualStyle, identityLocked, referenceStorageIds, primaryStorageId}), listLocations, createLocation({name, kind}), patchLocation({locationId, name, handle, kind, description, architecture, defaultTimeOfDay, defaultWeather, visualStyle, referenceStorageIds, primaryStorageId}), generateUploadUrl, recordUpload({targetType, characterId|locationId, storageId, role, makePrimary}), removeReference, getStorageUrl, listAssetHistory({targetType, characterId|locationId}), startGeneration, completeGeneration, failGeneration, seedStarterLibrary (returns {locationsCreated, coastCreated}); api.promptExpansion.expand({kind:'image', source, context, requestId}).
- **A5** Generation safety ordering (CharacterLibraryPage.tsx:118-144, LocationLibraryPage.tsx:111-135): persist the draft, then validate, then GMI expand, then promptFingerprint sourceHash, then startGeneration (idempotent requestId, revision check), then generateImages, then re-upload each output to Convex storage, then completeGeneration. Call failGeneration on error. No fal call may happen before the source is valid; the copy "No model call occurs until the source is valid." states this. Paid calls go only through the fal sdk proxy (FAL_SDK_PROXY_URL); FAL_KEY never reaches the client.
- **A6** Identity-lock semantics: identityLocked defaults to true (newDraft, createCharacter, seed). A locked character cannot generate without a reference. Keep the error string "Add an approved face reference before generating a locked identity like @coast" and the hint "Add a name, handle, description, and a face reference while identity lock is enabled." Keep the accessible label "Lock the face and overall look across generations" even if the checkbox becomes a switch.
- **A7** Handle normalization: the client uses `.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '')`, the server uses assertHandle /^[a-z0-9][a-z0-9_-]{1,62}$/, and handles are unique per table (by_handle index). @coast has handle 'coast' and starterKey 'coast'. STARTER_LOCATIONS starterKeys (ferry-building … sutro-baths) must stay stable for idempotent seeding.
- **A8** Enum literals must not change: location kind 'landmark'|'neighborhood'|'coast'|'interior'|'other' (UI labels may change, e.g. 'Coastline'). Reference roles are 'identity'|'wardrobe'|'style'|'environment'|'sheet'. ReferenceAssetManager defaultRole is 'identity' for characters and 'environment' for locations.
- **A9** MAX_ASSET_REFERENCES = 14 (lib/imageModels.ts:41), with its counter text pattern "{n}/14" and the limit error "This library item already has the 14-image reference limit."
- **A10** ReferenceAssetManager a11y hooks: `<section aria-label="Reference images">`, button aria-labels "Use as primary image" and "Remove reference from this item", upload through a hidden <input type=file accept="image/*">. Its props interface {targetType, targetId, references, primaryStorageId, defaultRole, onRemove, onMakePrimary, onUploaded, disabled} is consumed by both library pages.
- **A11** ImageGenerationControls aria-labels: "Image model", "Image aspect ratio", "Image variations", "Output image format", "Nano Banana resolution", "GPT Image quality", "Image background". Model ids are 'nano-banana' (default), 'gpt-flare' and 'gpt-sunburst', mapped to fal endpoints fal-ai/nano-banana-2(/edit) and openai/gpt-image-2.5/{flare|sunburst}/{text-to-image|edit}. The props interface is shared with the Shotboard.
- **A12** Live-region semantics: success notices use role="status" and failures use role="alert" (CharacterLibraryPage.tsx:162-163, LocationLibraryPage.tsx:153-154, ReferenceAssetManager.tsx:126). They may move closer to the CTA but must keep these roles.
- **A13** Visible copy other agents or tests may key on (restyle freely, keep the text): "Visual asset studio", "Characters with a stable identity", "Locations that hold their atmosphere", "Load SF starters", "New character", "New location", "Character source", "Location source", "Save source"/"Saving…", "Generate character sheet"/"Generating character sheet…", "Generate location sheet"/"Generating location sheet…", "Sheet history", "Use as primary reference" (title), "Loading character library…", "Loading location library…", "Start with a reusable character", "Start with a reusable environment", all field labels (Name, Handle, Identity and continuity description, Appearance details, Default wardrobe, Identity invariants, Visual style, Type, Handle (optional), Default light, Environment description, Architecture and materials, Weather).
- **A14** AccordionGallery is shared with Shotboard (ShotCard.tsx:169, SceneSection.tsx:69, SceneGallery.tsx). Its props API (items[{id,image,label,alt,link}], defaultIndex, height, expandRatio, accentColor, overlayColor, trigger, grayscale, onSelect(index)), root class .accordion-gallery, role="list" aria-label="Image accordion gallery", .ag-panel/.ag-panel--active classes, roving tabIndex and arrow-key navigation must keep working for those callers. Wrap it rather than changing its semantics in place.
- **A15** MorphSlider is used by TrackManager on Live Control (aria-label "Coast originals artwork carousel" wrapper) and by the fixture. Keep its aria-roledescription="carousel", aria-label "Coast audio artwork" (default), "Previous song artwork"/"Next song artwork", the tablist "Song artwork", activeIndex/onIndexChange contract and WebGL fallback img. Add a label prop instead of changing the default.
- **A16** PixelCard (Clips/Recordings) and ChromaGrid (shotboard CharacterPanel) are consumed outside the studio. Keep the .pixel-card / .pixel-card-latest class hooks and CSS vars --pixel-card-border/--pixel-card-background (globals.css:229-244) and the ChromaGrid onSelect(item) contract.
- **A17** Fixture section id="audio-library-visual-test" and the fixture's no-network, no-mutation guarantee. Replacing the hard-coded sleek-opossum-939 URLs with local assets is encouraged; adding Convex or fal calls is not allowed.
- **A18** Theme mechanism: class-based dark mode (tailwind darkMode:'class', the themeInit script in app/layout.tsx:11-19, localStorage key 'theme'). DitherBackground observes the html class attribute. Every new surface must work in both themes.
- **A19** Reduced motion: every new animation (GSAP, motion, WebGL) must respect prefers-reduced-motion, as AccordionGallery, PixelCard and MorphSlider already do.
- **A20** Next.js on Cloudflare Pages (next-on-pages, package.json pages:build). Do not add Node-only server code to routes. next/image has no remote patterns configured, so Convex storage URLs are rendered with <img> and the eslint-disable comments; keep that approach or configure images deliberately.
- **A21** lucide-react is pinned at ^0.294.0. Verify an icon exists in that version before using a newer name.

#### 10.9.2 From `docs/redesign/audit/fal.md` (library items, verbatim)

- **F1** Browser code must keep reaching fal ONLY through `/api/fal/sdk-proxy` (FAL_SDK_PROXY_URL in lib/directorProtocol.ts:4) and `/api/fal/proxy`. Both keep `export const runtime = 'edge'`. The offline brand script calls fal directly with server credentials and never goes through these routes.
- **F2** Image model ids 'nano-banana', 'gpt-flare' and 'gpt-sunburst' (lib/imageModels.ts:44-73) are persisted in Convex (`shot.imageModel`, `imageGenerationJobs.modelId`, `assetVersions.modelId`). Do not rename them. DEFAULT_IMAGE_MODEL stays 'nano-banana' unless the product owner decides otherwise.
- **F3** Convex API names and flows: api.assets.{listCharacters, getCharacter, createCharacter, patchCharacter, listLocations, createLocation, patchLocation, generateUploadUrl, getStorageUrl, recordUpload, removeReference, listAssetHistory, startGeneration, completeGeneration, failGeneration, seedStarterLibrary} and api.promptExpansion.{expand, start, get}. The idempotent job sequence is startGeneration → generateImages → upload to Convex → completeGeneration or failGeneration. assetVersions roles are identity|wardrobe|style|environment|sheet.
- **F4** `seedStarterLibrary` creates @coast with handle 'coast', starterKey 'coast' and identityLocked true. Locked identities keep requiring an approved face reference, including the error text 'Add an approved face reference before generating a locked identity like @coast'.
- **F5** aria-labels and roles that must survive: 'Image model', 'Image aspect ratio', 'Image variations', 'Output image format', 'Nano Banana resolution', 'GPT Image quality', 'Image background' (ImageGenerationControls.tsx); 'Clear' (AssetUrlInput.tsx:79); 'Mute'/'Unmute' (DirectorPlayer); role='status' on notices and role='alert' on errors in the Character and Location library pages.
- **F6** Visible strings used by flows and tests: 'Generate character sheet', 'Generating character sheet…', 'Sheet history', 'Use as primary reference', 'Generated sheets will remain here for review.', 'Load SF starters', 'New character', 'Capture frame', 'Capturing…', 'Remix frame', 'Remixing…', 'Director offline', 'Session failed', 'Stopping…', 'Loading character library…', 'Start with a reusable character', 'Convex is not configured. Character library changes are disabled.'
- **F7** Likeness and licensing. TWITCH_CHANNEL '510coast' (wrangler.toml:137) and the Coast track catalog suggest Coast is a real performer; this is an inference to confirm. Generate Coast imagery only from references Coast has explicitly approved. Keep raw face references and the master sheet out of public/ and out of git (Convex storage or the gitignored scripts/brand/.cache/). Ship only stylized outputs. Record model, prompt and request_id for every published asset in scripts/brand/approved.json. Confirm fal/OpenAI/MiniMax output-use terms for commercial brand use before launch (UNVERIFIED). Put no third-party logos (fal, OpenAI, MiniMax, Twitch) inside generated art.
- **F8** If no FAL_KEY is available to the implementing agent, it ships procedural placeholders at final dimensions plus the script. It must not block on, request, or embed the key.

#### 10.9.3 From `docs/redesign/audit/states.md` (library items, verbatim)

- **S1** aria-labels to preserve: nav 'Admin sections'; 'Delete board'; 'Board visual style'; 'Move shot earlier'; 'Move shot later'; 'Delete shot'; `Image prompt for shot ${n}`; 'Move scene up'; 'Move scene down'; 'Delete scene'; 'Delete character'; 'Remove element'; 'Clear'; 'Image accordion gallery' (role=list); 'Coast audio artwork' (aria-roledescription carousel); 'Coast originals artwork carousel'; 'Previous song artwork'; 'Next song artwork'; 'Song artwork' tablist with `Show ${caption}` tabs; 'Music mix volume'; 'Music start offset'; `Delete ${track.name}`; `Preview ${track.name}`; 'Reference images'; 'Use as primary image'; 'Remove reference from this item'; DitherAvatar `${name} avatar` role=img.
- **S2** ids, classes and test hooks: `#audio-library-visual-test` (AssetStudioVisualFixture.tsx:45); `.asset-studio` wrapper on the library pages and fixture; `.pixel-card-latest` on the first clip/recording; `.fal-card`, `.fal-card-header`, `.fal-card-content`, `.fal-card-title`, `.fal-button-primary`, `.fal-button-secondary`, `.connection-indicator`/`.connection-connected`/`.connection-disconnected` (restyle, don't silently delete without updating callers). role=status/role=alert on library notice/error must remain announced, even if moved into toasts.
- **S3** Convex calls unchanged: api.clips.list {limit:100}; api.recordings.list {limit:100}; api.recordings.remove (behind confirm('Delete this recording permanently?')); api.recordings.deleteStorage; api.tracks.list/generateUploadUrl/add/remove; api.assets.* (listCharacters, listLocations, create/patch, removeReference, seedStarterLibrary, startGeneration, completeGeneration, failGeneration, generateUploadUrl, listAssetHistory, getCharacter, recordUpload, getStorageUrl); api.shotboards.*; api.promptExpansion.start and .expand; api.director.prepare and .get; api.twitchStats.record and .history; useDirectorPersistence mutations. Hooks must stay mounted only under ConvexProvider (the `useConvexEnabled()` gates).
- **S4** Generation pipeline order and idempotency in the library pages: persistDraft/save → expand → promptFingerprint → startGeneration (throws if status !== 'running') → generateImages → upload each → completeGeneration, with failGeneration on error. A progress UI may observe this sequence but must not reorder it. Identity lock rule: generation is blocked without a face reference when identityLocked.
- **S5** fal access only via FAL_SDK_PROXY_URL / createFalClient({proxyUrl}) so FAL_KEY stays server-side. Adding onQueueUpdate/logs to fal.subscribe is fine; changing endpoints or inputs is not.
- **S6** dither-kit files (components/dither-kit/*) are hash-locked by dashboard/dither-kit.json: consume via props, imports and wrappers only. components/reactbits/* is not locked and may be edited.
- **S7** visual-test route must keep calling notFound() in production and must never mount Convex hooks.

#### 10.9.4 How §10 meets the items whose mechanism changes

| Item | Mechanism |
|---|---|
| A6 checkbox → Switch | `<Switch label="Lock the face and overall look across generations">`, bound to the same `draft.identityLocked`, saved by the same Save |
| A12 / S2 notices and errors | Chyrons keep `role="status"`/`role="alert"`; generation errors stay inline with `role="alert"` next to the CTA |
| A13 'Loading character library…' | CoastLoader's visible caption and `role="status"` name, byte-identical |
| A13 'Use as primary reference' (title) | The `title` and `aria-label` of the contact-tile promote IconButton and of SheetViewer's promote button, on every `REF` sheet (a sheet removed from references cannot be promoted, §10.4.6) |
| A14 AccordionGallery | Not used on these pages any more. The file is untouched, and the fixture keeps a specimen with the same semantics |
| A15 MorphSlider in the fixture | Default aria-label unchanged; `autoplay autoplayDelay={6}` kept (D3); the `activeIndex`/`onIndexChange` contract is unchanged, and `onIndexChange` writes only the shown slide, never the armed fixture track (display-only, §0.4 BC-15); local images; slot-gated |
| A17 fixture no-network | Same-origin `/brand/**`, `/fixtures/**` and `data:` only (§10.5.9 fixture rules); enforced by the §10.10 network gate |
| A4 `patchCharacter` / `patchLocation` | Same mutation and accepted arguments. The Save call omits the optional `referenceStorageIds` (§10.5.2). Promote still sends `primaryStorageId` |
| A5 / S4 order | §10.5.7 only inserts state calls; the `await` sequence is gate-checked in §10.10 |
| A10 ReferenceAssetManager props | Unchanged, plus the additive optional `roles` |
| A11 "shared with the Shotboard" | False at 845147c (Note in §10.2); the props are unchanged anyway |

#### 10.9.5 String ledger (845147c locations; every string survives byte-for-byte unless §10.9.6 lists it)

| File:line | Strings |
|---|---|
| `CharacterLibraryPage.tsx:44` | 'Convex is not configured. Character library changes are disabled.' |
| `:87`, `:95`, `:101`, `:110`, `:114`, `:124`, `:126`, `:127`, `:134`, `:138` | 'Character created. Add a name, handle, identity description, and approved face references.'; 'Name and @handle are required'; 'Character was not available after saving'; 'Generated image could not be read ({status})'; 'Generated image could not be saved ({status})'; 'Choose a character first'; 'Add an approved face reference before generating a locked identity like @coast'; 'A handle and identity description are required to generate a sheet'; 'This generation is already {status}'; '{n} character-sheet variation{s} saved to Convex storage.' |
| `:129`, `:132` | context `Character library sheet. Reference count: {n}.`; requestIds `character-{id}-{now}`, `sheet-{id}-{now}-{rand}` |
| `:146` | alt `{name} character card` |
| `:149` | 'Visual asset studio'; 'Characters with a stable identity'; 'Keep a face and overall look consistent, then swap wardrobe and scene styling without rebuilding the character.'; 'Load SF starters'; 'Starter library ready: {n} San Francisco locations{ and @coast}.'; 'New character' |
| `:150` | 'Loading character library…'; 'Start with a reusable character'; 'Create one, or load the San Francisco starter set to add @coast.' |
| `:152-157` | 'Character source' (`uppercase`); 'Untitled character'; 'Save source'/'Saving…'; 'Character source saved.'; Name 'Character name'; Handle 'coast'; 'Identity and continuity description' 'Face, hair, body proportions, age, overall look, and traits that must remain consistent…'; 'Appearance details' 'Materials, grooming, proportions…'; 'Default wardrobe' 'Flexible scene-ready outfit baseline…'; 'Identity invariants' 'What must not change between generations…'; 'Visual style' 'Optional board or series style…'; 'Lock the face and overall look across generations' |
| `:160` | 'Generate' (`uppercase`); 'Character sheet'; 'Astra expands the saved source; the selected Fal model then creates a reviewable sheet. No model call occurs until the source is valid.'; 'Generate character sheet'/'Generating character sheet…'; 'Add a name, handle, description, and a face reference while identity lock is enabled.'; 'Sheet history'; title 'Use as primary reference'; alt 'Generated character-sheet history'; 'Generated sheets will remain here for review.' |
| `LocationLibraryPage.tsx:43`, `:82`, `:89`, `:95`, `:117`, `:120`, `:123`, `:129`, `:137` | 'Convex is not configured. Location library changes are disabled.'; 'Location created. Define its environment before generating a reusable reference sheet.'; 'A location name is required'; 'Location was not available after saving'; 'Add an environment description before generating'; `Location library sheet. Reference count: {n}.`; `location-sheet-…`; '{n} location-sheet variation{s} saved to Convex storage.'; alt `{name} location card` |
| `:141-151` | 'Locations that hold their atmosphere'; 'Reusable places carry landmark geometry, weather, light, and texture into every scene.'; 'New location'; 'Loading location library…'; 'Start with a reusable environment'; 'Load the San Francisco starter library or create an original location.'; 'Location source' (`uppercase`); 'Untitled location'; Name 'Location name'; Type (Landmark, Neighborhood, Coast, Interior, Other); 'Handle (optional)' 'ferrybuilding'; 'Default light' 'Morning fog, sunset, night…'; 'Environment description' 'Architecture, materials, spatial layout, Bay light, weather, and scene invariants…'; 'Architecture and materials' 'Stone, glass, streetscape…'; 'Weather' 'Fog, wind, rain…'; 'Visual style' 'Optional production style…'; 'Location sheet'; 'The metaprompt turns your environment notes into production-ready coverage before the selected Fal model is called.'; 'Generate location sheet'/'Generating location sheet…'; 'Add a name and environment description to continue.'; alt 'Generated location-sheet history' |
| `ReferenceAssetManager.tsx:49-123` | 'This library item already has the 14-image reference limit.'; 'Choose an image file for a visual reference.'; 'Upload failed ({status})'; 'Reference images' (aria-label and text); 'Identity, wardrobe, style, or environment images stay in Convex storage.'; 'Role' (Identity, Wardrobe, Style, Environment); alt 'Saved visual reference'; 'Primary' / 'Use as primary image'; 'Remove reference from this item'; 'Uploading…'/'Add reference'; '{n}/14 · drop or choose' |
| `ImageGenerationControls.tsx:23-60` | The 7 aria-labels; 'Nano Banana 2', 'GPT Image 2.5 Flare', 'GPT Image 2.5 Sunburst'; '{n} image'/'images'; PNG, JPEG, WebP; 0.5K–4K; the qualities; 'Auto background', 'Opaque', 'Transparent'; 'Advanced model controls'; 'Seed' 'Random'; 'Safety tolerance'; 'Enable web search'; 'Thinking' ('Provider default', 'Minimal', 'High'); 'System prompt' 'Optional model-level instruction'; 'Compression (JPEG/WebP only)' 'Provider default'; 'Mask URL (optional)' 'https://…' |
| `AssetStudioVisualFixture.tsx:30-45` | The docstring; the banner sentence; 'Fixture state mirrors the generated character-sheet workspace.'; 'The source is expanded before the selected Fal image route is called.'; 'Location selection' (`uppercase`); 'Reusable San Francisco environments'; 'Audio library visual fixture' (`uppercase`); 'Coast originals'; the 4 track names; 'Preview'; 'Music gain · 25%'; 'Mix in output'; `id="audio-library-visual-test"` |

#### 10.9.6 Allowed changes on these pages (exhaustive) and new strings

**Allowed changes** (add each to Appendix A's allowed-changes list). Items tagged `§0.4 BC-<n>` are behaviour changes listed in goal.md §0.4; each applies by default, and the owner vetoes one with `OVERRIDE D10: <BC-id>` (§2.2 D10), after which Devin keeps the 845147c behaviour for that row and records it under Decisions. The roster and wall that replace the hover AccordionGallery (hover and focus never select) are §0.4 BC-19:
1. The Type option label `Coast` becomes `Coastline` (value `'coast'` unchanged; A8 permits this). The kind filter and badges use `Coastline`/`COASTLINE`.
2. `assetPlaceholder()` drops the in-image text "visual fixture · add approved reference" and the Arial/violet art (§10.5.4), keeping the same signature.
3. Notices and errors move from bottom `<p>`s to chyrons and the inline Darkroom alert. Text and roles are unchanged.
4. The identity checkbox becomes a Switch with the same label.
5. Sheet history lists only `role:'sheet'` rows, and a click opens the viewer instead of promoting. Promotion uses the explicit 'Use as primary reference' control, which renders only on `REF` sheets (§0.4 BC-20).
6. Save payloads omit `referenceStorageIds` (a data-loss fix, §10.5.2). With the unsaved-edits guard ('Discard unsaved changes?' and `beforeunload` while the draft is dirty), this is §0.4 BC-20.
7. Ordering and selection: @coast is pinned first; the wall uses `_creationTime` descending; the first item is auto-selected (§0.4 BC-20).
8. 'New character' and 'New location' render as secondary (one primary per view). 'Load SF starters' renders as ghost.
9. The header band (eyebrow, h1, description) also renders in the not-configured and auth states. This is additive.
10. Fixture: the nested `<main>` becomes `<div>`; production Convex URLs become local `/brand/slate/*.webp`; MorphSlider keeps `autoplay autoplayDelay={6}` but is display-only: a slide change no longer changes the selected-track row, and only 'Arm this track' does, as on Live Control (D3, §0.4 BC-15); inert copies become the real components; violet is removed.

> Note: bible §7.4 sets the Locations eyebrow to `SETS`. That would drop the preserved 'Visual asset studio' from `/admin/locations` (`LocationLibraryPage.tsx:141`), so it is **not** applied. Bible §7.3's roster "last sheet 2d ago" cannot be derived per row: `listAssetHistory` is per character, capped at 24, and would need 100 subscriptions. Rows therefore show `updated {ago}` from `updatedAt ?? createdAt`, and the bible header shows `last sheet {ago}`. Where the bible says the auto-append fix "needs owner sign-off", D2's default applies.

**New strings** (authored; sentence case unless authored uppercase):
- Cast, rail and header: 'Cast'; 'Filter characters'; 'Filter locations'; 'Name or @handle'; 'No characters match “{q}”.'; 'No locations match “{q}”.'; `updated {ago}`; `last sheet {ago}`; 'No sheet yet'; `just now`/`{n}m ago`/`{n}h ago`/`{n}d ago`; `LOCKED`; `NEEDS REF`; `UNLOCKED`; `UNSAVED`; `REFS`; `REV`; 'Generating' (sr-only, on the run's target row).
- Bible: `TURNAROUND`; `SHEET · REV {n}` (the bible's `SHEET · REV {n} · {MODEL LABEL}`, shortened to fit §12.3.9's 24-character tag; the model label is in the BibleHeader caption); 'Show view guides'; `FRONT`, `3/4`, `PROFILE`, `BACK`, `EXPRESSIONS`; 'Guides assume five equal panels in the order the sheet brief requests.'; 'No sheet yet.'; `INVARIANTS`; `NEVER CHANGES`; `VARIES PER SCENE`; 'Edit identity fields'; 'Play ident'.
- Draft safety: 'Discard unsaved changes?'; '{name} has unsaved edits. Switching discards them.'; 'Discard changes'; 'Keep editing'; `CHANGED`; 'Saved elsewhere since you started editing. Saving now overwrites those text fields.'; 'Load saved version'.
- Darkroom: 'Generation readiness'; `NAME`, `HANDLE`, `DESCRIPTION`, `REFERENCE`; 'Save', 'Expand', 'Queue', 'Render', 'Upload', 'Review'; `RENDERING`; `REVIEW`; 'Added to references automatically. Remove any you do not want reused.'; 'Done reviewing'; `PRIMARY`; `REF`; 'Remove from references'; 'Wait for the sheet to finish'; 'View sheet {tag}'; 'Sheet {tag}'; 'Prompt'; 'Loading sheet history'; 'Network offline'; 'GPT Image 2.5 renders this ratio as 16:9.'; `MODEL`, `ASPECT`, `VARIATIONS`, `FORMAT`, `RESOLUTION`, `QUALITY`, `BACKGROUND`.
- Reference tray: `IDENTITY`, `WARDROBE`, `STYLE`, `ENVIRONMENT`, `SHEET`.
- Placeholder art (`assetPlaceholder`, §10.5.4): `NO IMAGE YET`.
- Locations: `SAN FRANCISCO · 10 LOCATIONS`; 'Location kind'; 'All'; 'Coastline'; `LANDMARK`/`NEIGHBORHOOD`/`COASTLINE`/`INTERIOR`/`OTHER`; 'Compare {name}'; 'Compare'; 'Mark two locations to compare'; 'Compare set: {A} and {B}'; 'Compare locations'; `A · {name}`, `B · {name}`; 'Swap A and B'; 'Kind'; 'References'; 'Revision'; 'Scout report'; 'View crops' (Grid, Strip, Off); `ESTABLISHING`, `APPROACH`, `DETAIL`, `ATMOSPHERE`; 'Crops assume the four views the sheet brief requests, in order.'; 'No location sheet yet.'; 'Default light presets'; 'Morning fog', 'Golden hour', 'Blue hour', 'Night neon'.
- Fixture: 'Studio fixture state'; 'Scout fixture state' (their options are the `?studio=`/`?scout=` values in §10.5.9, including `seeded`); 'Artwork slot'; 'Arm this track' (§8.5.10's string, reused by the audio fixture); 'Hold generation' (the Shotboard ready board, §10.5.9, in §9.6.3's fixture); 'Show PixelCard'; every DS specimen heading and every button, control and simulator label in §10.5.9 (including the specimen controls table, whose labels §12 also lists, and the fixture-only 'Hold to go live (fixture)', 'Fixture board' and 'Keep board').

### 10.10 Acceptance criteria

- **Working directory** (§1.5). Commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`; every command below does, unless it is marked "from the repository root".
- **Run modes** (§1.6). **Fixture** means dev (`: "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET NEXT_TELEMETRY_DISABLED=1 npx next dev -p 3107`) at `/admin/visual-test?noboot` with the given `?studio=`/`?scout=`, in both themes, with `emulateMedia({ reducedMotion: 'reduce' })` for screenshots; fixture checks never run on prod, where the route is 404. Product-route browser checks run unconfigured on dev unless marked **prod** (`npm run qa:build`, then `: "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET ADMIN_AUTH_MODE=edge-only NEXT_TELEMETRY_DISABLED=1 npx next start -p 3109`).

**Pre-step (10-0, 10A)**
- [ ] After 10-0: `npx --no-install prettier --no-semi --single-quote --print-width 120 --trailing-comma all --check components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx components/AssetStudioVisualFixture.tsx` exits 0, and `awk 'length($0) > 280' components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx components/AssetStudioVisualFixture.tsx` prints nothing.
- [ ] After 10-0: the §10.5.1 10-0 block (`/tmp/literals.cjs`, multiset mode, against the 845147c versions of the three files) prints `OK 476 literals`.
- [ ] After 10A: the §10.5.1 10A block (`--set`, baseline = the merge base of the 10A PR, candidates = both pages + `components/asset-studio/*.{ts,tsx}`) prints `OK …`, with no `lost` and no `added`.
- [ ] After 10A: `git diff --name-only "$BASE"...HEAD` (from the repository root, after the §1.4 `BASE` guard line) lists only `dashboard/components/CharacterLibraryPage.tsx`, `dashboard/components/LocationLibraryPage.tsx`, `dashboard/scripts/checks/uppercase-allowlist.txt` and new `dashboard/components/asset-studio/` files; the fixture's dark and light screenshots are pixel-identical to the previous commit; `node scripts/checks/uppercase.mjs` exits 0; `npm run typecheck` exits 0; `npm run lint` reports no new warning.

**Draft safety (10B)**
- [ ] `grep -nE "referenceStorageIds: draft\.referenceStorageIds" components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx` prints nothing.
- [ ] Fixture `?studio=dirty`: `[data-unsaved]` is visible. Clicking the Mara row opens a dialog titled 'Discard unsaved changes?' and leaves `aria-current` on Coast. 'Keep editing' keeps the edited Name value. Repeating and choosing 'Discard changes' moves `aria-current` to Mara and clears `[data-unsaved]`.
- [ ] Fixture `?studio=dirty`: type "x" into the Name input (this gives the page sticky user activation, without which Chromium never shows the prompt), then `page.reload()` raises a `beforeunload` dialog. After 'Discard changes', a reload raises none.
- [ ] Fixture `?studio=changed`: an InlineBanner with sr/visible kicker `CHANGED` and a button 'Load saved version' is present; clicking it restores the saved Name.
- [ ] Hover and focus never select: in the fixture, hover the Orio row for 500 ms; then focus the roster (Tab lands on the selected Coast row, because of the roving tabindex) and press ArrowDown until the Orio row has focus. `aria-current="true"` stays on Coast throughout; Enter moves it to Orio.

**Characters (10D)**
- [ ] Fixture at 1440×900: `[data-studio="rail"]` width is 280 ±0.5, `[data-studio="darkroom"]` is 360 ±0.5, `[data-studio="main"]` is 704 ±1 at x = 328 ±1. At 1280×800 main is 560 ±1. At 1100×800 the Darkroom's top is ≥ the main column's bottom and its x equals main's x. At 390×844 `document.documentElement.scrollWidth <= 390` and the regions' y-order is header < rail < main < darkroom.
- [ ] `[data-studio="header"]` height ≤ 96 at 1440 and 1024. At 1024 the description (`.studio-header__desc`) computes `-webkit-line-clamp: 1`, its `scrollHeight` ≤ its `clientHeight` + 20, its bottom is ≤ the header's bottom, and its `textContent` is the full preserved description. `[data-roster-row]` min-height 72 with a 48×48 avatar; the HoloCard box is 192×256 at ≥1024; the turnaround screen's aspect is 16/9 ±0.01; every `[data-sheet-tile] img` computes `object-fit: contain`.
- [ ] On every route in §10: exactly one `h1`. Its text is 'Characters with a stable identity' on `/admin/characters` (unconfigured and fixture) and 'Locations that hold their atmosphere' on `/admin/locations`. From 10F, `/admin/visual-test` has exactly one `h1` (the Characters PageHeader; `routes.spec.ts` checks it from `WZRD_MILESTONE=7`, §14.13), and all `[id]` values on it are unique: `new Set([...document.querySelectorAll('[id]')].map((e) => e.id)).size === document.querySelectorAll('[id]').length`. `getByText('Visual asset studio', { exact: true })` computes `text-transform: none`.
- [ ] The 'Character source', 'Location source' and 'Generate' eyebrow elements have the class `uppercase`; `scripts/checks/uppercase-allowlist.txt` holds exactly the §10.5.1 lines for the current part (from 10D: CharacterSourceForm 1, LocationSourceForm 1, Darkroom 1, AssetStudioVisualFixture 2, MorphSlider.css 1); `node scripts/checks/uppercase.mjs` exits 0.
- [ ] `getByRole('switch', { name: 'Lock the face and overall look across generations' })` resolves to one element whose `aria-checked` toggles on click.
- [ ] With 'Nano Banana 2' selected, comboboxes named 'Image model', 'Image aspect ratio', 'Image variations', 'Output image format', 'Nano Banana resolution' exist. With 'GPT Image 2.5 Sunburst', 'GPT Image quality' and 'Image background' replace 'Nano Banana resolution'. `grep -c 'aria-label="\(Image model\|Image aspect ratio\|Image variations\|Output image format\|Nano Banana resolution\|GPT Image quality\|Image background\)"' components/ImageGenerationControls.tsx` prints `7`.
- [ ] `?studio=no-reference`: 'Add a name, handle, description, and a face reference while identity lock is enabled.' is visible with computed color `rgb(var(--c-warning))`, the `REFERENCE` Led is off, and the button named 'Generate character sheet' is disabled.
- [ ] `?studio=running`: the StageTrack `role="list"` holds 6 items in the order Save, Expand, Queue, Render, Upload, Review with `aria-current="step"` on Render; `[data-review] [data-generation-frame]` count is 2; the CTA has `aria-busy="true"` and visible text 'Generating character sheet…'; the CTA width equals its idle width ±0.5 px; 'Save source' has `aria-disabled="true"`, and clicking it sends nothing.
- [ ] `?studio=failed`: the Darkroom contains `role="alert"` with the text 'GMI prompt expansion exceeded its three-minute deadline'; exactly one button named 'Retry' exists inside `[data-review]`; the StageTrack item 'Expand' has the failed state. A `MutationObserver` installed on `#live-assertive` before navigation records no text that contains 'Generation failed' (frame 0 passes `announce="progress"`, the others `announce="none"`, so the inline alert is the only announcement).
- [ ] `?studio=review`: the first result tile shows `PRIMARY` and `REF`, the second `REF`; buttons named 'Remove from references' appear only on `REF` tiles; clicking the second removes its `REF` badge and decrements `REFS`; 'Done reviewing' removes `[data-review]` and both results appear under 'Sheet history'.
- [ ] Every `[data-sheet-tile]` that shows `REF` has a button with `title="Use as primary reference"`; a tile without `REF` (REV 9 in `?studio=populated`) has no promote button and no 'Remove from references' button. Clicking a tile image opens a dialog titled `Sheet REV …` without changing the PRIMARY badge.
- [ ] `grep -rn "AccordionGallery" components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx components/asset-studio` prints nothing; `git diff 845147c -- components/reactbits/AccordionGallery.jsx components/reactbits/AccordionGallery.css` is empty; the fixture's `#ds-accordion-gallery .accordion-gallery[role="list"][aria-label="Image accordion gallery"]` exists.
- [ ] `grep -rn "visual fixture · add approved reference" --include=*.ts --include=*.tsx .` prints nothing; `grep -n "export function assetPlaceholder(label: string, hue = 260)" lib/assetPlaceholders.ts` prints one line; in `?studio=seeded`, the @coast roster avatar's `currentSrc` contains `/brand/avatar/coast-px-` and the bible portrait's `currentSrc` contains `/brand/talent/coast-portrait-`.
- [ ] The pipeline order is unchanged: `grep -nE "await (persistDraft|save|expand|promptFingerprint|startGeneration|generateImages|Promise\.all|completeGeneration)\(" components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx` prints, per file, lines in exactly the order save → expand → promptFingerprint → startGeneration → generateImages → Promise.all → completeGeneration.

**Locations (10E)**
- [ ] Fixture `?scout=populated` at 1440×900: each `[data-plate]` is 241 ±1 wide (4 per row) with a 4:3 screen whose `img` computes `object-fit: cover`; at 390 there are exactly 2 per row.
- [ ] `getByRole('radiogroup', { name: 'Location kind' })` has radios All, Landmark, Neighborhood, Coastline, Interior, Other. Selecting Coastline leaves only plates whose badge is `COASTLINE` (Ocean Beach in the fixture), and its value is `coast`.
- [ ] `getByRole('combobox', { name: 'Type' })` option texts are [Landmark, Neighborhood, Coastline, Interior, Other] and its values are [landmark, neighborhood, coast, interior, other].
- [ ] Ticking 'Compare Mission District' and 'Compare Ocean Beach', focusing a plate and pressing `x` opens `dialog[data-sheet][open]` titled 'Compare locations' with two images. Pressing `x` with focus in the source form opens nothing.
- [ ] Clicking 'Golden hour' sets the 'Default light' input to `Golden hour` and `aria-pressed="true"` on that key only; typing into the input afterwards keeps working.
- [ ] Saving a location in the fixture does not change the plates' DOM order.
- [ ] `?scout=populated`: the scout report shows tags `ESTABLISHING`, `APPROACH`, `DETAIL`, `ATMOSPHERE` in Grid mode; 'Off' hides the three tiles; `?scout=no-sheet` shows 'No location sheet yet.'

**States (product routes and fixture)**
- [ ] Unconfigured `/admin/characters` and `/admin/locations`: `getByText('Convex is not configured. Character library changes are disabled.', { exact: true })` (and the Location sentence) has count 1; buttons 'Load SF starters', 'New character' and 'New location' have count 0; zero requests to `/api/*` or `*.convex.cloud`; console per §1.6 only.
- [ ] `?studio=empty`: the slate kicker's sr-only text is `OPEN CASTING`, its title and body equal the preserved strings, and the `img` src ends in `/brand/slate/characters.webp`. `?scout=empty` gives `NO SCOUTS` and `locations.webp`. `?studio=auth` shows NO ACCESS and not the empty slate.
- [ ] `?studio=loading`: an element with `role="status"` and accessible name 'Loading character library…' exists inside `[aria-busy="true"]`.
- [ ] With reduced motion on `?studio=running`, after 1000 ms `document.getAnimations().filter(a => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity)` is empty, and the HoloCard's computed `transform` is not a rotation.
- [ ] `@axe-core/playwright` reports 0 serious or critical violations on the fixture states populated, empty, dirty, running and review, on `?scout=populated` and `?scout=compare`, and on the two unconfigured product routes.

**Gates (after 10F)**
- [ ] `grep -rnE "violet-|purple-|#a78bfa|#05030b|#090713|#11131a|#0c0c12|fal-primary-|fal-gray-|Loader2|animate-spin|animate-pulse|backdrop-(blur|filter)" components/CharacterLibraryPage.tsx components/LocationLibraryPage.tsx components/AssetStudioVisualFixture.tsx components/ReferenceAssetManager.tsx components/ImageGenerationControls.tsx components/asset-studio app/admin/visual-test` prints nothing.
- [ ] `grep -rnE "convex/react|_generated/api|@fal-ai|lib/imageGen|fetch\(" components/asset-studio components/AssetStudioVisualFixture.tsx app/admin/visual-test lib/fixtures` prints nothing.
- [ ] `git diff 845147c -- convex` is empty.
- [ ] Fixture network: across a full load plus clicking every fixture-state option and every DS button, every request's origin equals the page origin, none targets `/api/`, and the console has **no** `net::ERR_TUNNEL_CONNECTION_FAILED`, only the §1.6 every-route message.
- [ ] Fixture canvas audit: at most 2 WebGL contexts (the carrier + MorphSlider while `morph` owns the slot); at most one effect canvas at a time; `window.__wzrd.slots.owner` is `null` or exactly one of `morph`, `symbol-raster`, `pixel-card` (§7.16). With 'Show PixelCard' on and 'Run raster' on, only `symbol-raster` (priority 3) holds a canvas, and the PixelCard specimen shows its static Bayer tile.
- [ ] `grep -n "  if (process.env.NODE_ENV === 'production') notFound()" app/admin/visual-test/page.tsx` prints one line; `test ! -e app/admin/visual-test/loading.tsx` succeeds. In prod (§1.6), `curl -s -o /dev/null -w '%{http_code}' localhost:3109/admin/visual-test` prints `404`.
- [ ] The fixture contains `#audio-library-visual-test`, `#design-system-visual-test`, every `ds-*` id in §10.5.9 (including `ds-reactbits`), `#live-control-visual-test` (from 8B), `#shotboard-visual-test` (from 9B), `#characters-visual-test` (from 10D) and `#locations-visual-test` (from 10E); §11 adds `#clips-visual-test`, `#recordings-visual-test` (11A) and `#analytics-visual-test` (11C). `document.querySelectorAll('.asset-studio').length >= 1`. The page has exactly one element for each `data-specimen` value in §10.5.9 (PxResolve, PixelFace, DecryptedText, CountUp, SelectionBrackets, SymbolRaster, HoloCard, HoverClipButton, StreamList, StageTrack, AccordionGallery, ChromaGrid, PixelCard, MorphSlider), each inside its §10.5.9 host. The MorphSlider keeps autoplay (D3): `grep -c "autoplayDelay={6}" components/AssetStudioVisualFixture.tsx` prints `1`, and `grep -n "onIndexChange={setTrack}" components/AssetStudioVisualFixture.tsx` (the 845147c wiring that made the shown slide the selected track) prints nothing.
- [ ] Fixture display-only arming (D3, §0.4 BC-15), with `[data-specimen="MorphSlider"]` scrolled into view, its canvas mounted and the pointer outside it, and no reduced-motion emulation: `[data-armed-track]` reads 'SPRING (intro)' at load. The selected tab of the 'Song artwork' tablist (`[role="tab"][aria-selected="true"]`) changes within 7000 ms, and `[data-armed-track]` still reads 'SPRING (intro)'. Clicking 'Next song artwork' and then the tab named 'Show POP OUT' leaves it unchanged too. Once that tab has `aria-selected="true"`, clicking 'Arm this track' makes `[data-armed-track]` read 'POP OUT'.
- [ ] From 8B, `#ds-connect` contains the five CONNECT_STEPS in order and exactly one button named 'Cancel'. `#ds-format` shows '1536.0 MB' and '1.50 GB' (§5.20.4's values).
- [ ] `npm run qa:build`: the `.qa/build.log` route table shows `/admin/characters` and `/admin/locations` First Load JS ≤ 210 kB each (baseline 192 kB); `npm run typecheck` exits 0; lint has no warning in `components/asset-studio/**`.
- [ ] Playwright screenshots of `/admin/characters` and `/admin/locations` (unconfigured, dark, light, 390) and of every fixture state above are attached to the PR next to `admin_characters-dark.jpg`, `admin_characters-mobile.jpg`, `admin_locations-dark.jpg` and `admin_visual-test-dark.jpg`.

**Ready-state targets** (fixture; each item applies from the part in its §10.5.9 "Lands in" column)
- [ ] Each target of the §10.5.9 ready-state table exists exactly once, inside its host section. For every `data-ready-state` value `v` of the table and its host section id `h` (for example `v = 'clips'`, `h = '#clips-visual-test'`), `document.querySelectorAll('[data-ready-state="' + v + '"]').length === 1` and `document.querySelector(h + ' [data-ready-state="' + v + '"]') !== null`. `document.querySelectorAll('#characters-visual-test').length === 1` and `document.querySelectorAll('#locations-visual-test').length === 1`.
- [ ] (10D) `#characters-visual-test` contains the `h1` 'Characters with a stable identity' (from 10F the page's only `h1`), the text 'Fixture state mirrors the generated character-sheet workspace.', exactly one `[data-roster-row][aria-current="true"]`, whose text contains `@coast`, and exactly one `[data-studio="darkroom"]`, which contains the text 'The source is expanded before the selected Fal image route is called.'.
- [ ] (10E) `#locations-visual-test` contains 10 `[data-plate]`, exactly one `[data-plate] button[aria-current="true"]`, whose text contains 'Ferry Building', and exactly one `[data-studio="darkroom"]`.
- [ ] (9B) At load, no `[data-ready-state="shotboard"] [role="gridcell"][data-testid="shot-frame"]` has `data-phase="running"`, and 'Hold generation' has `aria-checked="false"`. After the three Shotboard steps of §10.5.9, the target contains the `ol` named 'Scenes' with 3 direct `li` children, and 7 `[role="gridcell"][data-testid="shot-frame"]`. Exactly one of those frames has `data-phase="running"` (SC02 · SH01), and it still has it 5000 ms later. Exactly one has `data-phase="failed"` (SC03 · SH02) and contains a button named 'Retry'. Turning 'Hold generation' off makes the SC02 · SH01 frame leave `data-phase="running"` within 3000 ms.
- [ ] (11A–11C) `[data-ready-state="clips"]` contains `[data-testid=clip-status-capturing]`, `[data-testid=clip-status-uploading]` and `[data-testid=clip-status-failed]`. `[data-ready-state="recordings"]` contains 24 `[data-testid=recording-row]`. `[data-ready-state="analytics-live"] [data-testid=onair-tally]` has `data-state="live"`, and `[data-ready-state="analytics-not-patched"] [data-testid=onair-tally]` has `data-state="not-patched"`.
- [ ] (8B) `[data-ready-state="live-standby"]` contains the text 'Director offline'. Neither `[data-ready-state="live-preview"]` nor `[data-ready-state="live-onair"]` contains it.
- [ ] Every ready-state target is captured at 1440×900 in dark and in light as §10.5.9 describes. The 10D PR's Screenshots table has the two `#characters-visual-test` captures and the 10E PR's has the two `#locations-visual-test` captures (§15.10 names the files).

### 10.11 Cut order

Cut first item first. Each cut keeps every §10.9 item and every never-cut item. §17.2 is the project-wide order and wins where the two differ: it places item 3 as its #34, right after the Live beat inspector pane (#33).
1. HoverClipButton 'Play ident' on the HoloCard (bible cut 1).
2. HoloCard tilt and foil. Keep the static 3:4 card with the seal (bible cut 2).
3. Locations: the X key and the scout-report crops. Keep the wall, the CompareSheet (opened by the 'Compare' button) and a plain primary plate (bible cut 5, reduced: the 4:3 wall plus CompareSheet is never cut).
4. SheetViewer. Tile clicks then do nothing, and the actions stay on the tile.
5. Turnaround view guides.
6. The ReadinessRow LEDs. The amber hint stays.
7. The roster and wall filter inputs.
8. Role badges on reference tiles (`roles` prop).
9. The GPT ratio caption.

**Never cut:**
- the prettier and extraction pre-step;
- draft safety (the payload fix, the rehydrate rule and the unsaved guard);
- removal of AccordionGallery from both pages (it fixes hover versus select);
- the Coast fallback chain and the `assetPlaceholder()` restyle;
- the NotConfigured, AuthRequired and empty slates with their exact copy;
- StudioSkeleton plus CoastLoader loading;
- the StageTrack and GenerationFrames driven by real status;
- the inline generation alert;
- the `REF` badge plus 'Remove from references' (D2);
- the Locations 4:3 wall plus CompareSheet (§17.2);
- the fixture's `notFound()`, no-network rule, `#audio-library-visual-test`, `.asset-studio`, `#design-system-visual-test` and the §10.5.9 ready-state targets;
- every invariant in §10.9.
