> **Spec chapter §12 — Effects: the React Bits / Arlan Vault component plan.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 12. Effects: the React Bits / Arlan Vault component plan

This section owns every component derived from `docs/redesign/component-prompts.csv`: the 15 picks, the 4 retained vendored components, and the 171 banned rows. Tokens, keyframes and CSS utilities are in §5 (§5.14), the motion grammar in §6, primitives and the effect-slot contract in §7, brand files in §13, the QA harness in §15. Line references are **as of 845147c** (identical at HEAD `a52f7c6` for `dashboard/`).

**Verified facts this section relies on:**

| Fact | Evidence |
|---|---|
| `www.reactbits.dev`, `reactbits.dev` and `arlan.me` cannot be reached from the authoring sandbox: `curl` fails with `CONNECT tunnel failed, response 403`. No registry JSON, file list or dependency list could be read | Re-run on 2026-09-25; `docs/redesign/audit/csv.md` (install mechanics) |
| The CSV has 190 rows. Arlan Vault: 18 (file lines 2–19, empty `category` and `cli_identifier`). React Bits: Animations 38 (20–57), Backgrounds 57 (58–114), Components 45 (115–159), Text Animations 32 (160–191). Every React Bits `cli_identifier` is the `name` without spaces | Python `csv.DictReader` over the file |
| All 172 React Bits `implementation_prompt`s end: "Use a clean TypeScript API and do not copy React Bits source code." All 18 Arlan Vault prompts end: "…provide a reduced-motion fallback, and avoid copying source code or proprietary artwork from the reference." | Same |
| `components/reactbits/` holds Dither, MorphSlider, AccordionGallery, ChromaGrid and PixelCard. None is in `dither-kit.json`, so all are editable. `Dither.jsx:1-4` records that the R3F wrapper "pulls in react-reconciler, which is incompatible with this app's bundled React" | `dashboard/dither-kit.json`; `components/reactbits/Dither.jsx:1-4` |
| Installed: `three` 0.169.0 (no `@types/three`; `tsconfig.json` has `"strict": false`, so THREE is untyped), `motion` 13.2.0, `gsap` 3.15.0. Not installed: `ogl`, `@react-three/*`, `postprocessing`, `matter-js`, `meshline`, `lenis`, `@use-gesture/react` | `dashboard/package.json`; `node_modules` |
| Dither today: `antialias: true` (`Dither.jsx:136`); a perpetual rAF that re-sets every uniform each frame (`:172-186`); `disableAnimation` only freezes `time` (`:176`); the effect depends on 8 props (`:196`) and `DitherBackground.tsx:28-29` passes fresh array literals, so every theme toggle disposes and recreates the WebGL context; WebGL failure returns silently (`:137-139`) | Source |
| three r169 `dispose()` removes its `webglcontextlost` listener first (`node_modules/three/build/three.module.js:29355`). The "THREE.WebGLRenderer: Context Lost." `console.log` lives in that listener (`:29384`). So `WEBGL_lose_context.loseContext()` **after** `dispose()` is silent, while `forceContextLoss()` (`:29072`) logs | Source |
| MorphSlider today: a perpetual rAF from construction (`MorphSlider.tsx:257-258`, `:304-309`); `powerPreference: 'high-performance'` (`:216`); reduced motion read once (`:480`); `autoplay` defaults to `false` (`:455`), but `TrackManager.tsx:138-139` and `AssetStudioVisualFixture.tsx:45` pass `autoplay autoplayDelay={6}`, and `TrackManager.tsx:142` wires `onIndexChange={selectSliderTrack}` into `setSelected` (`:91`), so autoplay re-arms the operator's track | Source |
| Importers at 845147c. AccordionGallery: `CharacterLibraryPage.tsx:7`, `LocationLibraryPage.tsx:7`, `AssetStudioVisualFixture.tsx:5`, `shotboard/ShotCard.tsx:6`, `shotboard/SceneSection.tsx:5`, `shotboard/SceneGallery.tsx:5`. ChromaGrid: `shotboard/CharacterPanel.tsx:6`. PixelCard: `app/admin/clips/page.tsx:8`, `app/admin/recordings/page.tsx:8`. MorphSlider: `TrackManager.tsx:9`, `AssetStudioVisualFixture.tsx:6` | `grep -rn` |
| The baseline lint warnings inside vendored files are `reactbits/AccordionGallery.jsx:229` and `reactbits/ChromaGrid.jsx:115` (`no-img-element`). The §15 grep gates (violet, backdrop, uppercase, spinners) match nothing in `components/reactbits/*.{jsx,tsx}` | `baseline-status`; `grep -niE` |

**New strings.** Every visible string, accessible name and announcement this chapter introduces. None is preserved until it merges (Appendix A). Use them byte-for-byte.
- **HoloCard (§12.3.11):** the article name `{name} talent card`; the Led labels 'Identity locked' and 'Identity unlocked'; the plate readouts `REFS {count}/{max}` and `SHEET v{n}`.
- **HoverClipButton (§12.3.12):** the button label 'Play ident'.
- **StageTrack (§12.3.6):** the sr-only state suffixes ', done', ', in progress' and ', failed'. The stage labels and the track `label` belong to the calling chapter (§8, §9, §10).
- **Fixture controls (§12.1 rule 9):** 'Replay', 'Next label', 'Connect step' (options '0'–'4'), 'Add 3', 'Add 12', 'Tight', 'Density .10', 'Density .40', 'Density 1', 'Clear', 'Run raster', 'Set 1300', 'Artwork slot', 'Show PixelCard'.
- PixelFace renders strings owned elsewhere (slate kickers §6.13, lamp labels §7.4 and §11.C, `SH{nn}` §9) and adds none.

### 12.1 Build policy

1. **Original implementations only.** Every pick except Dither is new code, written from this section and the row's `scraped_description`. Dither stays the vendored plain-three port and is hardened in place (§12.3.1). It is never reinstalled.
2. **No registry installs.** Do not run `npx shadcn@latest add …`, `npx jsrepo add …` or any React Bits CLI. Do not paste registry JSON. Do not add a `@react-bits` (or any new) entry to `dashboard/components.json` `registries`. Do not open, fetch or read source from reactbits.dev, arlan.me or mirrors of them. There are three reasons:
   - The authoring sandbox got `CONNECT tunnel failed, response 403` from reactbits.dev and arlan.me. The registry URL, the paths the CLI writes to, and each item's npm dependencies are therefore unverified. A CLI install can also rewrite `tailwind.config.js`, `app/globals.css`, `components.json` and `package.json` without asking.
   - Every CSV `implementation_prompt` forbids copying. The 172 React Bits rows say "do not copy React Bits source code", and the 18 Arlan rows say "avoid copying source code or proprietary artwork from the reference".
   - A registry Dither would bring back `@react-three/fiber` and its reconciler, which `Dither.jsx:1-4` removed on purpose.
3. **Arlan Vault studies** are built from the `scraped_description` alone, under generic names (PixelFace, SelectionBrackets, SymbolRaster, HoloCard, HoverClipButton, `.sq`). Third-party names (Airbnb, Figma, Apple, Dia, Midjourney, Amo) may appear **only** inside the provenance comment. They never appear in identifiers, class names, UI copy, alt text or art. No hearts, ID-card layouts, logos or proprietary artwork.
4. **No new dependencies** (D8). New effect code may import only:
   - `react` and `next/dynamic`;
   - `lucide-react` (the §5.20.6 allowlist);
   - `@/lib/*` and `@/hooks/*` (§7.2);
   - the §7 primitives: `@/components/ui/*` (§7.3), `@/components/broadcast/*` (§7.4), `@/components/brand/*` (§7.5) and `@/components/shell/ThemeProvider` (§7.13);
   - sibling effects: `@/components/effects/*` and `@/components/generation/*`, plus `./reactbits/Dither` from `DitherBackground.tsx` only;
   - `@/components/dither-kit/pixel` (`fnv1a`, `xorshift32`, `BAYER4`), as an import only, because dither-kit is hash-locked.
   
   Three packages stay confined to their existing files:
   - `three` to `Dither.jsx` and `MorphSlider.tsx`;
   - `motion/react` to `components/shell/AppNav.tsx` and, only if §9.5.7 (9D) ships, to `components/shotboard/SceneRail.tsx` and `components/shotboard/SceneTrack.tsx` (`Reorder` only);
   - `gsap` to the three vendored files that already import it. No new effect uses `gsap`.

   > Note: bible §8 confines `motion` to the nav `layoutId`. The Shotboard drag reorder (§9.5.7) extends that. It is cut-able, and cutting 9D removes both Shotboard imports.
5. **Provenance header, verbatim.** Every file that implements a pick starts with this line, one line per pick it implements. It goes before `'use client'`, since comments may precede a directive. CSS files use the same text in `/* … */`.
   ```ts
   // Original implementation inspired by "<CSV name>" (<canonical_url>). No upstream source copied.
   ```
   | File | Header line(s) (exact) |
   |---|---|
   | `components/boot/bootScript.ts` | `// Original implementation inspired by "Pixel Swap" (https://www.reactbits.dev/animations/pixel-swap). No upstream source copied.` and `// Original implementation inspired by "Shiny Text" (https://www.reactbits.dev/text-animations/shiny-text). No upstream source copied.` (TS comments outside the `BOOT_SCRIPT` string, so they add no bytes to the §6.2.12 budget) |
   | `components/boot/boot.src.js` | The same two lines as `bootScript.ts`, as lines 1–2, before the §6.2.14 header comment. `scripts/gen-boot.mjs` strips comments, so they never reach `bootScript.generated.ts` or the client |
   | `components/effects/SymbolRaster.tsx` | `// Original implementation inspired by "Symbols effect" (https://arlan.me/vault/sandbox). No upstream source copied.` and `// Original implementation inspired by "Pixel Swap" (https://www.reactbits.dev/animations/pixel-swap). No upstream source copied.` |
   | `components/effects/PxResolve.tsx` | `// Original implementation inspired by "Pixel Transition" (https://www.reactbits.dev/animations/pixel-transition). No upstream source copied.` |
   | `app/styles/utilities.css` | `/* Original implementation inspired by "Pixel Transition" (https://www.reactbits.dev/animations/pixel-transition). No upstream source copied. */` and `/* Original implementation inspired by "Apple's corners" (https://arlan.me/vault/squircle). No upstream source copied. */` |
   | `components/effects/PixelFace.tsx`, `components/effects/px5x7.ts` | `// Original implementation inspired by "Arcade pixel" (https://arlan.me/vault/arcade-pixel). No upstream source copied.` (`lib/pixelFont.json` is data and carries no comment; `px5x7.ts` re-exports it, §12.3.4) |
   | `components/effects/DecryptedText.tsx` | `// Original implementation inspired by "Decrypted Text" (https://www.reactbits.dev/text-animations/decrypted-text). No upstream source copied.` |
   | `components/generation/StageTrack.tsx` | `// Original implementation inspired by "Stepper" (https://www.reactbits.dev/components/stepper). No upstream source copied.` |
   | `components/effects/StreamList.tsx` | `// Original implementation inspired by "Animated List" (https://www.reactbits.dev/components/animated-list). No upstream source copied.` |
   | `components/shell/AppNav.tsx` | `// Original implementation inspired by "Pill Nav" (https://www.reactbits.dev/components/pill-nav). No upstream source copied.` |
   | `components/effects/SelectionBrackets.tsx`, `SelectionBrackets.module.css` | `// Original implementation inspired by "Figma vector editor" (https://arlan.me/vault/vector-editor). No upstream source copied.` |
   | `components/effects/HoloCard.tsx`, `HoloCard.module.css` | `// Original implementation inspired by "Holo" (https://arlan.me/vault/holo). No upstream source copied.` |
   | `components/effects/HoverClipButton.tsx` | `// Original implementation inspired by "Amo hover button" (https://arlan.me/vault/amo). No upstream source copied.` |
   | `components/effects/CountUp.tsx` | `// Original implementation inspired by "Count Up" (https://www.reactbits.dev/text-animations/count-up). No upstream source copied.` |
   | `components/reactbits/Dither.jsx` | Keeps its vendored header (`:1-4`) and adds line 5: `// Hardened for the stream.wzrd.tech admin (docs/redesign/spec/12-effects.md §12.3.1). Shaders unchanged.` It is **not** marked "original" |
6. **Shared contract for every effect.**
   - Tokens only (§5). No hex values except the documented screen-ink constants in SymbolRaster.
   - `'use client'` on every effect file except `PixelFace.tsx` and `px5x7.ts`, which are hookless and server-safe.
   - `cn` from `lib/utils.ts`.
   - `forwardRef` wherever the component has a DOM root.
   - Live `useReducedMotion()` (§7.2).
   - The air lock through `useBroadcast(deriveLock)`, with `el.closest('[data-air-allow]')` as the only exemption (§6.1 law 6).
   - JS-driven animation runs on the shared ticker (`lib/motion/ticker.ts`, ≤ 30 fps, pauses when hidden). The only private rAF users are `Dither.jsx`, `MorphSlider.tsx`, and HoloCard's pointer coalescer (one rAF per pointer batch, no loop). The untouched vendored `PixelCard.jsx` keeps its own loop, fixture only, behind its slot (rule 8).
   - Final text is always in the DOM. Effect layers are `aria-hidden`.
   - Zero console output.
   - StrictMode-safe: everything created in an effect is disposed in its cleanup.
7. **Code splitting** (§16): SymbolRaster, HoloCard (which contains HoverClipButton) and MorphSlider are only ever imported through `next/dynamic(() => import(…), { ssr: false })`, and that call sits only in a `'use client'` file. The other effects are small and imported statically.
8. **Canvas budget** (§16, §7.16). Each view has one persistent WebGL context (the carrier) and at most one effect canvas. Among the picks, only SymbolRaster needs an effect slot. Among the retained components, MorphSlider (slot `morph`) and PixelCard need one. PixelCard's canvas is an effect canvas (fixture only, slot `pixel-card`, priority 0, §7.16): it creates a Canvas2D and loops `requestAnimationFrame` on hover and focus (`PixelCard.jsx:150`, `:175`, `:203`, `:243`). Every other pick is CSS, SVG or DOM and draws no canvas.
9. **Fixture specimens.** `/admin/visual-test` (§10.5.9 owns the page and its sections) renders one specimen of each effect and retained component. Each specimen root carries `data-specimen="<Component>"`, each value appears once on the page, and the specimens use fixture data only, with no network. Media are same-origin (`/brand/**`, `/fixtures/**`) or `data:`. The hosts are:

   | Host section | Specimens |
   |---|---|
   | `#ds-effects` (inside `#design-system-visual-test`) | PxResolve, PixelFace, DecryptedText, CountUp, SelectionBrackets, SymbolRaster, HoloCard, HoverClipButton, StreamList |
   | `#ds-generation` (inside `#design-system-visual-test`) | StageTrack |
   | `#ds-accordion-gallery` (inside `#design-system-visual-test`) | AccordionGallery |
   | `#ds-reactbits` (inside `#design-system-visual-test`) | ChromaGrid, PixelCard |
   | `#audio-library-visual-test` | MorphSlider |

   So `#design-system-visual-test` and `#audio-library-visual-test` together contain exactly these `data-specimen` values: PxResolve, PixelFace, DecryptedText, CountUp, SelectionBrackets, SymbolRaster, HoloCard, HoverClipButton, StreamList, StageTrack, AccordionGallery, ChromaGrid, PixelCard, MorphSlider.

   **Specimen controls** (owned here; §10.5.9 lists them verbatim). Each control sits inside its specimen's root:

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

   The canvas specimens request the effect slot (§7.16): SymbolRaster (`symbol-raster`, 3 while 'Run raster' is on), MorphSlider (`morph`, 2) and PixelCard (`pixel-card`, 0). PixelCard sits behind a 'Show PixelCard' switch, off by default, and mounts only while `useEffectCanvasSlot('pixel-card', 0, shown)` is granted; otherwise it renders a same-size static 25% Bayer tile. So no two of them ever hold canvases at the same time.
10. **Dev instrumentation** (stripped from production by `process.env.NODE_ENV`). The `Window` globals these effects write (`__wzrdDitherReady`, `__wzrd.frames`, `__wzrd.carrier`, `__wzrd.slots`) are declared in `dashboard/types/wzrd.d.ts`: §6.2.11 item 5 (owner; lands in 3A).

### 12.2 The 15 picks

| # | CSV name (file line) | `cli_identifier` | `canonical_url` (from the CSV) | Our component | Placement | Deps |
|---|---|---|---|---|---|---|
| 1 | Dither (67) | Dither | https://www.reactbits.dev/backgrounds/dither | `components/reactbits/Dither.jsx` (hardened, never reinstalled) + `components/DitherBackground.tsx` + `components/reactbits/Dither.css` | Global carrier, every route | `three` 0.169 (installed) |
| 2 | Pixel Swap (45) | PixelSwap | https://www.reactbits.dev/animations/pixel-swap | `components/boot/boot.src.js` (POST resolve, handoff, channel flip; minified into `BOOT_SCRIPT` via `bootScript.generated.ts` and `bootScript.ts`, §6.2.1) + the clear in `components/effects/SymbolRaster.tsx` | Boot POST, repeat-visit flip, connect → first-frame clear | none |
| 3 | Pixel Transition (47) | PixelTransition | https://www.reactbits.dev/animations/pixel-transition | `components/effects/PxResolve.tsx` + `.px-resolve` (`app/styles/utilities.css`) | Route enter, skeleton → content, slates, generation land, chyrons, lamp lit, list rows, dialogs | none |
| 4 | Arcade pixel (4) | Arlan study | https://arlan.me/vault/arcade-pixel | `components/effects/PixelFace.tsx` + `components/effects/px5x7.ts` (re-export of `lib/pixelFont.json`) | md lamp faces, slate kickers, empty ShotFrame tag, not-found digits | none |
| 5 | Decrypted Text (165) | DecryptedText | https://www.reactbits.dev/text-animations/decrypted-text | `components/effects/DecryptedText.tsx` | Active CONNECT_STEP label; GenerationFrame phase word | none (imports `fnv1a`, `xorshift32` from dither-kit) |
| 6 | Stepper (158) | Stepper | https://www.reactbits.dev/components/stepper | `components/generation/StageTrack.tsx` | Connect plate (5), Darkroom (6), Send to Director (4) | none |
| 7 | Animated List (116) | AnimatedList | https://www.reactbits.dev/components/animated-list | `components/effects/StreamList.tsx` | Direction queue, chat feed, event console | none |
| 8 | Pill Nav (149) | PillNav | https://www.reactbits.dev/components/pill-nav | `components/shell/AppNav.tsx` (indicator concept only) | Command-bar nav | `motion` 13 (installed) |
| 9 | Figma vector editor (8) | Arlan study | https://arlan.me/vault/vector-editor | `components/effects/SelectionBrackets.tsx` + `.module.css` | Monitor viewfinder, Shotboard selection, turnaround labels, Locations compare | none |
| 10 | Symbols effect (17) | Arlan study | https://arlan.me/vault/sandbox | `components/effects/SymbolRaster.tsx` | Idle monitor and connect acquisition | none |
| 11 | Holo (10) | Arlan study | https://arlan.me/vault/holo | `components/effects/HoloCard.tsx` + `.module.css` | Characters talent bible (@coast first) | none |
| 12 | Amo hover button (2) | Arlan study | https://arlan.me/vault/amo | `components/effects/HoverClipButton.tsx` | "Play ident" on HoloCard | none |
| 13 | Apple's corners (3) | Arlan study | https://arlan.me/vault/squircle | `.sq` in `app/styles/utilities.css` + radii tokens (§5) | Panels, keys, inputs, chips, sheets, dialogs, slates | none |
| 14 | Count Up (163) | CountUp | https://www.reactbits.dev/text-animations/count-up | `components/effects/CountUp.tsx` | Analytics KPIs, Clips and Recordings totals, Shotboard runtime (first reveal only) | none |
| 15 | Shiny Text (180) | ShinyText | https://www.reactbits.dev/text-animations/shiny-text | The glint inside `components/boot/bootScript.ts` (`BOOT_CSS`), concept only | The wordmark in the full boot POST, at most once per 12 h per browser (§6.2.4) | none |

### 12.3 Per-pick specifications

Each pick has a spec card, its API, the implementation detail Devin cannot infer, and acceptance criteria.

Every "Acceptance criteria" block in §12.3 and §12.4 uses these rules:
- **Working directory (§1.5):** commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`. No command mixes both forms. A path that contains `(live)` is quoted.
- **Run modes (§1.6):**
  - **dev** is `: "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET NEXT_TELEMETRY_DISABLED=1 npx next dev -p 3107` (from `dashboard/`). `window.__wzrd.frames`, `.carrier` and `.slots` exist only in dev.
  - **Fixture** is dev at `/admin/visual-test?noboot`, plus the specimen's host section from §12.1 rule 9 (for example `#ds-effects`). The route returns 404 in prod, so fixture items never run on prod.
  - **Prod** is `npm run qa:build`, then `: "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET ADMIN_AUTH_MODE=edge-only NEXT_TELEMETRY_DISABLED=1 npx next start -p 3109` (both from `dashboard/`). A plain `next start` returns 401 and is never a prod check.
  - "The simulator holding the lock" means the fixture's broadcast simulator (`ds-simulator`, §10.5.9). On `/admin` in dev, set the lock with `window.__wzrd.broadcast.publish({ director: 'live', firstFrame: true })` (§7.17).

#### 12.3.1 Dither: the carrier, hardened (`components/reactbits/Dither.jsx`, `Dither.css`, `components/DitherBackground.tsx`)

| | |
|---|---|
| Purpose | The one full-screen field. Its look stays byte-for-byte: the shader (`Dither.jsx:10-114`) and the constants `waveFrequency 2.6`, `waveAmplitude 0.4`, `colorNum 4`, `pixelSize 2` are unchanged. It becomes cheap, calm and truthful |
| Technique | WebGL 2 through three 0.169: one full-screen quad and the unchanged fragment shader. The backing store is half resolution and upscaled 2× with `image-rendering: pixelated` |
| Timings | ≤ 30 fps. Tweens of colour and speed: `tweenMs` 1200 for a broadcast-state change and 300 for a theme change, eased with `easeInOutCubic`. After the first frame the canvas fades in over 600 ms with `--ease-out`, or appears at once while `html[data-boot]` is set (§6.2.2 L1) |
| Colours | `--dither-wave`, `--dither-bg` and `--dither-speed` (§5.2), read with `getComputedStyle`. The WebGL-failure class `.dither-fallback` (a static 25% Bayer field in `ramp-2` over the canvas colour) is defined once, in `components.css` (§5.14); `Dither.css` does not redefine it |
| Reduced motion | `disableAnimation`: never requests rAF. It renders synchronously once on mount, once per resize and once per param change. Theme and state changes snap (`tweenMs` 0) |
| Air lock | The retint is allowed: 1200 ms, once per state change (§6.12) |
| Perf | The one persistent WebGL context. It is not an effect slot. Half-resolution backing means ¼ of the fragment work. `antialias: false`, `powerPreference: 'low-power'`. Paused while the tab is hidden. Never recreated on a theme or state change |
| A11y | The host is `aria-hidden` and `pointer-events: none`, and the canvas is decorative |
| Used by | `app/layout.tsx` → `<DitherBackground/>`, the first DOM child of `<body>` (§7.6) |

**API** (`Dither.jsx` stays JavaScript; this is its documented contract):

```ts
type DitherProps = {
  waveSpeed?: number;  waveFrequency?: number; waveAmplitude?: number   // defaults 0.05 / 3 / 0.3 (unchanged)
  waveColor?: [number, number, number]; backgroundColor?: [number, number, number]   // 0–1 RGB; compared by value, never by identity
  colorNum?: number; pixelSize?: number                                 // defaults 4 / 2 (unchanged); pixelSize is the VISUAL cell in CSS px
  disableAnimation?: boolean                                            // existing prop: static mode (reduced motion)
  renderScale?: number                                                  // NEW, default 0.5: backing store = ceil(CSS size × renderScale)
  maxFps?: number                                                       // NEW, default 30
  paused?: boolean                                                      // NEW, default false: freeze on the current frame, repaint only on param change
  tweenMs?: number                                                      // NEW, default 0: duration for tweening waveColor/backgroundColor/waveSpeed
  onFirstFrame?: (detail: { webgl: boolean }) => void                   // NEW: once per mount, after the first render or in the failure branch (docs/redesign/spec/06-motion-and-loading.md §6.2.11)
}
```

**Changes to `Dither.jsx`:**

| Lines | Today | Change |
|---|---|---|
| 1–4 | Vendored header | Keep. Add line 5 (§12.1 rule 5) |
| 5 | `import { useEffect, useRef } from 'react';` | Add `useState` |
| 10–114 | `vertexShader`, `fragmentShader` | **Unchanged, byte for byte** |
| 116–125 | Props | Add `renderScale = 0.5, maxFps = 30, paused = false, tweenMs = 0, onFirstFrame` |
| 128–196 | One effect whose deps are the 8 props (`:196`), so every change of an inline array recreates the renderer | One effect with `[]` deps: **the renderer is created once per mount**. Props flow in through `paramsRef` and a second, dependency-free effect that calls `engine.update()` |
| 134–139 | `new THREE.WebGLRenderer({ antialias: true })` inside `try`; failure returns silently | Probe `canvas.getContext('webgl2', {…})` with explicit attributes (`antialias:false`, `powerPreference:'low-power'`, `alpha/depth/stencil:false`), then hand the context to three with `{ canvas, context: gl }`. On failure: add `.dither-fallback`, call `onFirstFrame({ webgl: false })`, return. The probe means three never logs a creation error, and it creates no extra context: three 0.169 needs WebGL 2 anyway |
| 141 | `renderer.domElement.className = 'dither-container'` | The canvas **keeps** `dither-container` (preserved, Appendix A A.1.4) and gains a second class: `canvas.className = 'dither-container dither-canvas'`. `dither-canvas` is the hook for the canvas rules in `Dither.css`; `dither-container` is never removed from the canvas or renamed |
| 146–156 | Uniforms from props | The `waveSpeed` uniform is fixed at `1`, because speed is integrated into `time` (see below). `pixelSize` becomes `pixelSize × renderScale` (2 × 0.5 = 1 backing px = 2 CSS px, the same look) |
| 163–167 | `setSize(w, h)` at full resolution | `bw = ceil(w × renderScale)`, `bh = ceil(h × renderScale)`, `setSize(bw, bh, false)`, CSS size `bw / renderScale` × `bh / renderScale` px (an exact integer 2× scale, where 1 px of overflow is clipped by the host), `resolution = (bw, bh)`, then **draw synchronously**, because `setSize` clears the drawing buffer |
| 172–186 | A perpetual `tick` that re-sets every uniform every frame | A frame gate of `1000 / maxFps − 2` ms, phase integration, the colour/speed tween, the visibility pause and static mode (code below) |
| 188–195 | Cleanup | Also remove the `visibilitychange` listener. After `renderer.dispose()`, call `gl.getExtension('WEBGL_lose_context')?.loseContext()`, which is silent because `dispose()` already removed three's listener. **Never call `renderer.forceContextLoss()`** |
| 198 | `<div ref={hostRef} className="dither-container" aria-hidden />` | Adds `dither-fallback` to the class after a failure |

**Why the phase is integrated.** The shader computes `p - time * waveSpeed` (`:78`). The carrier speed now changes at runtime (.04 standby, .055 Tuning, .02 ON AIR, §5). With `time` running from page load, a speed change of Δ jumps the pattern by `time × Δ`: about 4.8 units when going on air after 4 minutes, which is a visible lurch. Accumulating `phase += dt × speed` and fixing the uniform at 1 makes every speed change continuous, and the shader stays unchanged.

**The component body that replaces `:116-199`:**

```jsx
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export default function Dither({
  waveSpeed = 0.05, waveFrequency = 3, waveAmplitude = 0.3,
  waveColor = [0.5, 0.5, 0.5], backgroundColor = [0, 0, 0],
  colorNum = 4, pixelSize = 2, disableAnimation = false,
  renderScale = 0.5, maxFps = 30, paused = false, tweenMs = 0, onFirstFrame,
}) {
  const hostRef = useRef(null);
  const engineRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const paramsRef = useRef(null);
  paramsRef.current = { waveSpeed, waveFrequency, waveAmplitude, waveColor, backgroundColor, colorNum, pixelSize,
                        disableAnimation, renderScale, maxFps, paused, tweenMs };
  const firstFrameRef = useRef(onFirstFrame);
  firstFrameRef.current = onFirstFrame;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    let renderer = null;
    if (gl) { try { renderer = new THREE.WebGLRenderer({ canvas, context: gl }); } catch { renderer = null; } }
    if (!renderer) {                                   // WebGL unavailable: static CSS field, and the boot still hears "ready"
      setFailed(true);
      firstFrameRef.current?.({ webgl: false });
      return undefined;
    }
    renderer.setPixelRatio(1);
    canvas.className = 'dither-container dither-canvas';   // keeps the preserved class; adds the canvas hook
    host.appendChild(canvas);

    const p0 = paramsRef.current;
    const uniforms = {
      time: new THREE.Uniform(0),
      resolution: new THREE.Uniform(new THREE.Vector2(1, 1)),
      waveSpeed: new THREE.Uniform(1),                 // speed is integrated into `time` (phase)
      waveFrequency: new THREE.Uniform(p0.waveFrequency),
      waveAmplitude: new THREE.Uniform(p0.waveAmplitude),
      waveColor: new THREE.Uniform(new THREE.Color(...p0.waveColor)),
      backgroundColor: new THREE.Uniform(new THREE.Color(...p0.backgroundColor)),
      colorNum: new THREE.Uniform(p0.colorNum),
      pixelSize: new THREE.Uniform(p0.pixelSize * p0.renderScale),
    };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms }));
    scene.add(mesh);

    const targetOf = (p) => ({ wave: [...p.waveColor], bg: [...p.backgroundColor], speed: p.waveSpeed });
    const keyAll = (p) => JSON.stringify([p.waveColor, p.backgroundColor, p.waveSpeed, p.waveFrequency, p.waveAmplitude,
      p.colorNum, p.pixelSize, p.renderScale, p.disableAnimation, p.paused, p.maxFps]);
    const keyTarget = (p) => JSON.stringify([p.waveColor, p.backgroundColor, p.waveSpeed]);
    let cur = targetOf(p0), tween = null, lastAll = keyAll(p0), lastTarget = keyTarget(p0);
    let phase = 0, raf = 0, lastDraw = 0, first = true, scale = p0.renderScale;
    let hidden = document.visibilityState === 'hidden';

    const looping = () => { const p = paramsRef.current; return !hidden && !p.paused && !p.disableAnimation; };
    const stepTween = (now) => {
      if (!tween) return;
      const k = tween.ms > 0 ? Math.min(1, (now - tween.start) / tween.ms) : 1;
      const e = easeInOutCubic(k);
      cur = { wave: mix3(tween.from.wave, tween.to.wave, e), bg: mix3(tween.from.bg, tween.to.bg, e),
              speed: tween.from.speed + (tween.to.speed - tween.from.speed) * e };
      if (k >= 1) tween = null;
    };
    const draw = () => {
      const p = paramsRef.current;
      uniforms.time.value = phase;
      uniforms.waveFrequency.value = p.waveFrequency;
      uniforms.waveAmplitude.value = p.waveAmplitude;
      uniforms.colorNum.value = p.colorNum;
      uniforms.pixelSize.value = p.pixelSize * scale;
      uniforms.waveColor.value.setRGB(cur.wave[0], cur.wave[1], cur.wave[2]);
      uniforms.backgroundColor.value.setRGB(cur.bg[0], cur.bg[1], cur.bg[2]);
      renderer.render(scene, camera);
      if (process.env.NODE_ENV !== 'production') {
        const w = (window.__wzrd = window.__wzrd || {}); w.frames = w.frames || {};
        w.frames.carrier = (w.frames.carrier || 0) + 1;
      }
      if (first) { first = false; canvas.setAttribute('data-ready', ''); firstFrameRef.current?.({ webgl: true }); }
    };
    const frame = (now) => {
      raf = 0;
      const p = paramsRef.current;
      if (lastDraw && now - lastDraw < 1000 / p.maxFps - 2) { raf = requestAnimationFrame(frame); return; }
      const dt = lastDraw ? Math.min(now - lastDraw, 100) : 0;   // clamp: no jump after a stall
      lastDraw = now;
      stepTween(now);
      phase += (dt / 1000) * cur.speed;
      draw();
      if (looping()) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && looping()) { lastDraw = 0; raf = requestAnimationFrame(frame); } };
    const resize = () => {
      scale = paramsRef.current.renderScale;
      const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      const bw = Math.ceil(w * scale), bh = Math.ceil(h * scale);
      renderer.setSize(bw, bh, false);
      canvas.style.width = `${bw / scale}px`;
      canvas.style.height = `${bh / scale}px`;
      uniforms.resolution.value.set(bw, bh);
      draw();                                          // setSize cleared the buffer: never show an empty frame
      lastDraw = performance.now();
    };
    const update = () => {                             // called after every render of <Dither>
      const p = paramsRef.current;
      const all = keyAll(p);
      if (all === lastAll) return;
      lastAll = all;
      const t = keyTarget(p);
      if (t !== lastTarget) {
        lastTarget = t;
        const ms = p.disableAnimation || p.paused || hidden ? 0 : p.tweenMs;
        tween = { from: cur, to: targetOf(p), start: performance.now(), ms };
      }
      if (p.renderScale !== scale) resize();
      if (looping()) { start(); return; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (tween) { tween.ms = 0; stepTween(0); }      // static or paused: snap, render once, no rAF
      draw();
    };
    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden';
      if (hidden) { cancelAnimationFrame(raf); raf = 0; } else start();
    };

    document.addEventListener('visibilitychange', onVisibility);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();                                          // first frame, synchronously → onFirstFrame
    start();
    engineRef.current = { update };

    return () => {
      engineRef.current = null;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
      mesh.geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      gl.getExtension('WEBGL_lose_context')?.loseContext();   // silent after dispose(); never forceContextLoss()
      canvas.remove();
    };
  }, []);

  useEffect(() => { engineRef.current?.update(); });

  return <div ref={hostRef} className={failed ? 'dither-container dither-fallback' : 'dither-container'} aria-hidden />;
}
```

**`components/reactbits/Dither.css`** (replaces `:1-5`). It holds only the container, canvas, `[data-ready]` and `[data-boot]` rules. `.dither-fallback` and its `::before` live only in `components.css` (§5.14), which the safelist always emits (§5.15). Line 1 stays the preserved `.dither-container` rule (Appendix A A.1.4). Both the host `<div>` and the canvas carry `dither-container`, so the canvas rules are written as `canvas.dither-canvas` (specificity 0,1,1), which beats `.dither-container` (0,1,0) on the canvas whatever the source order. `resize()` sets the canvas's width and height inline, which overrides the host rule's `100%`:

```css
.dither-container { position: relative; width: 100%; height: 100%; overflow: hidden; }
canvas.dither-canvas { position: absolute; top: 0; left: 0; display: block; image-rendering: pixelated;
  opacity: 0; transition: opacity 600ms var(--ease-out); }   /* the canvas also carries .dither-container; this selector outranks it */
canvas.dither-canvas[data-ready] { opacity: 1; }
:root[data-boot] canvas.dither-canvas { transition: none; }   /* under the boot overlay the carrier appears at once (docs/redesign/spec/06-motion-and-loading.md §6.2.2 L1) */
```

**`components/DitherBackground.tsx`** (replaces `:1-35`). The `MutationObserver` (`:13-20`) and the inline arrays (`:28-29`) go away. Theme comes from `useTheme()` (§7.13) and state from the broadcast store (§7.17). Both write their `<html>` attributes **before** notifying subscribers, so `getComputedStyle` inside the effect already sees the new tokens.

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@/components/shell/ThemeProvider'
import { deriveBroadcast, useBroadcast } from '@/lib/broadcast/store'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const Dither = dynamic(() => import('./reactbits/Dither'), { ssr: false })

type Rgb = [number, number, number]
type Carrier = { wave: Rgb; bg: Rgb; speed: number; tweenMs: number }
const FALLBACK = { wave: [0.2, 0.34, 0.66] as Rgb, bg: [0.02, 0.03, 0.06] as Rgb, speed: 0.04 } // = dark tokens
let announced = false // module scope: StrictMode double mounts announce once per page load

function triple(cs: CSSStyleDeclaration, name: string, fallback: Rgb): Rgb {
  const v = cs.getPropertyValue(name).trim().split(/\s+/).map(Number)
  return v.length === 3 && v.every(Number.isFinite) ? (v as Rgb) : fallback
}

export default function DitherBackground() {
  const { resolved } = useTheme()
  const state = useBroadcast(deriveBroadcast)
  const reduced = useReducedMotion()
  const [carrier, setCarrier] = useState<Carrier | null>(null)
  const lastTheme = useRef<string | null>(null)

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement)
    const speed = parseFloat(cs.getPropertyValue('--dither-speed'))
    const tweenMs = lastTheme.current === null ? 0 : lastTheme.current !== resolved ? 300 : 1200
    lastTheme.current = resolved
    const next = { wave: triple(cs, '--dither-wave', FALLBACK.wave), bg: triple(cs, '--dither-bg', FALLBACK.bg),
                   speed: Number.isFinite(speed) ? speed : FALLBACK.speed, tweenMs }
    setCarrier(next)
    if (process.env.NODE_ENV !== 'production') (window.__wzrd ??= {}).carrier = next
  }, [resolved, state])

  const onFirstFrame = useCallback((detail: { webgl: boolean }) => {
    if (announced) return
    announced = true
    window.__wzrdDitherReady = detail
    window.dispatchEvent(new CustomEvent('wzrd:dither-ready', { detail }))
  }, [])

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
      {carrier && (
        <Dither waveSpeed={carrier.speed} waveFrequency={2.6} waveAmplitude={0.4}
          waveColor={carrier.wave} backgroundColor={carrier.bg} colorNum={4} pixelSize={2}
          renderScale={0.5} maxFps={30} disableAnimation={reduced} tweenMs={reduced ? 0 : carrier.tweenMs}
          onFirstFrame={onFirstFrame} />
      )}
      <div className="dither-veil absolute inset-0" />
    </div>
  )
}
```

The veil (`.dither-veil`, its opacities and its 1200 ms transition) is §5. `paused` is available to hosts, but no call site sets it: the visibility pause lives inside `Dither.jsx`, so the vendored component meets its own CSV prompt ("pause expensive rendering while … the tab is hidden").
> Note: §7.2 lists `usePageVisible` as used by the carrier. The pause is implemented inside `Dither.jsx` instead, so DitherBackground does not need that hook.

**Acceptance criteria**
- [ ] The shader block is unchanged. From the repo root this exits 0: `node -e "const cp=require('child_process'),fs=require('fs');const cut=s=>s.slice(s.indexOf('const vertexShader'),s.indexOf('export default function Dither')).trim();const a=cut(cp.execSync('git show 845147c:dashboard/components/reactbits/Dither.jsx').toString());process.exit(fs.readFileSync('dashboard/components/reactbits/Dither.jsx','utf8').includes(a)?0:1)"`.
- [ ] `grep -rn "forceContextLoss" dashboard/app dashboard/components` prints nothing.
- [ ] `grep -c "dither-fallback" dashboard/components/reactbits/Dither.css` prints `0`: the class lives only in `components.css` (§5.14).
- [ ] The preserved `.dither-container` class is kept, never renamed (Appendix A A.1.4): `head -1 dashboard/components/reactbits/Dither.css` prints `.dither-container { position: relative; width: 100%; height: 100%; overflow: hidden; }`, `grep -c "'dither-container dither-canvas'" dashboard/components/reactbits/Dither.jsx` prints `1`, and `grep -c "className = 'dither-canvas'" dashboard/components/reactbits/Dither.jsx` prints `0`.
- [ ] Prod, `/admin`, 1440×900: `document.querySelectorAll('canvas.dither-canvas').length === 1`; that canvas has `classList.contains('dither-container') === true` and `getComputedStyle(canvas).position === 'absolute'`; `document.querySelectorAll('.dither-container').length === 2` (the host `div` and the canvas); `canvas.width === 720`; `canvas.style.width === '1440px'`; `getComputedStyle(canvas).imageRendering === 'pixelated'`; `canvas.getContext('webgl2').getContextAttributes()` has `antialias === false` and `powerPreference === 'low-power'`.
- [ ] Theme identity (dev): keep a reference to the canvas node, click the ThemeSwitch 10 times, then check the node is still the same (`===`), `querySelectorAll('canvas.dither-canvas').length === 1`, and there are zero console messages. After a toggle to light, `__wzrd.carrier` (dev) equals `{ wave:[0.5,0.63,0.86], bg:[0.98,0.98,1], speed:0.04, tweenMs:300 }`.
- [ ] State (fixture): with the broadcast simulator (`ds-simulator`, §10.5.9), publishing `director:'opening'` makes `__wzrd.carrier.speed === 0.055` and `tweenMs === 1200` within 100 ms. Publishing `director:'live', firstFrame:true, air:'on'` gives `speed === 0.02`.
- [ ] Frame cap (dev): over 2000 ms of idle, `__wzrd.frames.carrier` increases by at least 1 and at most 62.
- [ ] Hidden (dev): after `Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))`, the counter increases by 0 over 1000 ms. Restoring `'visible'` resumes it.
- [ ] Reduced motion (dev; `emulateMedia({ reducedMotion:'reduce' })`, then reload): the counter increases by 0 between 1000 ms and 3000 ms. One theme toggle increases it by exactly 1.
- [ ] Chromium with `--disable-webgl --disable-3d-apis`: the host `div` has class `dither-fallback`; `window.__wzrdDitherReady` deep-equals `{ webgl:false }`; no `canvas.dither-canvas` exists; `document.querySelectorAll('.dither-container').length === 1` (the host only); and the console holds zero entries beyond the §1.6 allowed list.
- [ ] Exactly one `wzrd:dither-ready` event per page load, including after 10 theme toggles (§6.16).

#### 12.3.2 Pixel Swap: boot POST, channel flip and the raster clear

| | |
|---|---|
| Purpose | Pixel fragments assemble into a cover, then dissolve into the live carrier, in the carrier's own Bayer-8 order. The first-visit boot, the repeat-visit channel flip, and the connect → first-frame clear are one algorithm |
| Technique | Canvas2D with a backing store of 1 px per cell, CSS-upscaled with `image-rendering: pixelated`. Cells light when `ease(p) > B8(x,y)` and clear when `ease(p) > 1 − B8(x,y)`, with `B8(x,y) = (BAYER8[(y&7)*8+(x&7)] + 0.5) / 64`. `BAYER8` (`lib/bayer.ts`, §7.2) holds the **integers** 0–63 in the carrier's order, the numerators of `Dither.jsx:83-90` (`[0,48,12,60,3,51,15,63,32,16,…]`), never the normalised k/64 floats; normalised values would collapse `B8` to about 0.008–0.023 and light every cell. Order is Bayer-8, never random, except the flip's 80 ms static burst |
| Timings | Boot: 4 px cells; the overlay is removed by 1617 ms after navigation start (1600 ms at 60 Hz plus at most one frame, §6.2.5). Channel flip: 224 ms, a burst of 0–80 ms then a clear of 80–224 ms (§6.2.8). Raster clear: 6 px cells, 320 ms `easeInOutCubic` (§12.3.10) |
| Colours | `--c-canvas` and `--c-ramp-1…3`, read once from `getComputedStyle` (boot). The raster uses screen ink (§12.3.10) |
| Reduced motion | Boot: a static card for 250 ms, then a 150 ms fade, and skipped on repeat visits (§6.2.9). Raster: a 150 ms WAAPI opacity crossfade instead of the clear (§6.5, §12.3.10) |
| Air lock | The boot runs before any lock can exist. The raster clear is the signal-acquired transition and carries `data-air-allow` |
| Perf | The boot is outside the slot system: it is removed by 1617 ms after navigation start (§6.2.5), at about 0.4 ms per frame, with `canvas.width = 0` at the end. The raster clear runs while the raster holds the priority-3 slot (§7.16) |
| A11y | The overlay and the raster canvas are `aria-hidden`. The boot's `role="status"` "Loading stream.wzrd.tech" is §6.2.2 L4 |
| Used by | `components/boot/*` (§6.2), SymbolRaster (§12.3.10) |

The boot is an inline script, not React: its files are `components/boot/BootMarkup.tsx`, `bootScript.ts`, `boot.src.js` (the readable algorithm), `bootScript.generated.ts` (its minified form) and `masks.ts` (§6.2.1).
> Note: the bible's component names `BootSequence`/`ChannelFlip` are superseded by §6.2.1's files. The bible also placed a PixelFace "CH 05" in the boot. §6.2.3 renders the mono line `STREAM.WZRD.TECH · CH 05 · 5DEE` as JetBrains Mono `micro` DOM text instead, because the inline boot script cannot use React components. PixelFace is not used in the boot.

**Acceptance criteria**
- [ ] Every boot item in §6.16 passes.
- [ ] `head -3 dashboard/components/boot/bootScript.ts` and `head -3 dashboard/components/boot/boot.src.js` each contain both provenance lines from §12.1.
- [ ] The headers never reach the client. On prod, this exits 0: `test "$(curl -s -o /tmp/admin.html -w '%{http_code}' http://localhost:3109/admin)" = 200 && ! grep -q "Original implementation inspired" /tmp/admin.html`. The status check matters, because a 401 body would also pass the grep. So the headers add nothing to the §6.2.12 size budget.
- [ ] `grep -nE "Math\.random" dashboard/components/boot/boot.src.js dashboard/components/boot/bootScript.ts dashboard/components/effects/SymbolRaster.tsx` prints nothing. Order is Bayer-8, and the flip burst uses `xorshift32`.

#### 12.3.3 Pixel Transition → `PxResolve` (`components/effects/PxResolve.tsx`, `.px-resolve`)

| | |
|---|---|
| Purpose | The only way new content appears (the Resolve verb, §6.1): a 4-step Bayer mask of 25 → 50 → 75 → 100%. It is triggered by mount or by a key, **never by hover** (the CSV row's hover trigger is dropped) |
| Technique | CSS `mask-image` stepping through `--bayer-4-03 → -07 → -11 → -15 → none` on an 8 px tile of 2 px cells. The keyframes and `.px-resolve` are defined once, in §5.14 (`@keyframes px-resolve` and the `px-fade` fallback in `keyframes.css`; the utility, its reduced-motion rule and its air-lock rule in `utilities.css`). §6.15 is the usage table. This section never redefines them |
| Timings | `--dur-resolve` 160 ms (4 × 40 ms) with `steps(1,end)` per segment and `fill-mode: both`. List rows use 120 ms (`--px-resolve-dur`). Popovers use 200 ms (`--dur-base`) |
| Colours | None: the mask is colourless |
| Reduced motion | `animation: none` (§5.14). `onDone` fires in the same commit |
| Air lock | Frozen unless the element or an ancestor carries `data-air-allow` (§5.14 air-lock block). When frozen, `onDone` fires in the same commit |
| Perf | Compositor mask steps only; no JS per frame; no canvas |
| A11y | None needed: the content is in the DOM from the first frame and only its visibility steps |
| Used by | `app/admin/template.tsx` (the class directly, §6.4.1); skeleton → content (§6.8); slates (§6.13); generation land (§6.6); chyron enter (§6.10); TallyLight lit change (§7.4); StreamList rows (§12.3.7); Dialog enter (§7.3); ContactSheet tiles (§7.5) |

```ts
type PxResolveProps = {
  as?: 'div' | 'span' | 'li' | 'section' | 'figure' | 'article'   // default 'div'
  trigger?: 'mount' | 'key'          // default 'mount'
  resolveKey?: string | number       // trigger="key": the element re-mounts and resolves on every change after the first render
  durationMs?: 120 | 160 | 200       // default 160; sets --px-resolve-dur inline when not 160
  airAllow?: boolean                 // sets data-air-allow (lamps, LEDs, StreamList rows, error chyrons)
  onDone?: () => void                // after animationend of px-resolve/px-fade, or immediately when frozen
  className?: string; style?: React.CSSProperties; children?: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'style' | 'children'>
export const PxResolve: React.ForwardRefExoticComponent<PxResolveProps & React.RefAttributes<HTMLElement>>
```

- `trigger="mount"` renders `.px-resolve` from the first render, so it plays on insertion.
- `trigger="key"` renders `<Tag key={resolveKey}>` and adds `.px-resolve` only after the first mount (a `useRef` flag set in an effect). The initial render never animates, and each later key change re-mounts the element and resolves it. Use `trigger="key"` for leaf content only, because the children re-mount too.
- **Frozen check.** A `useLayoutEffect` keyed on `resolveKey` computes `reduced || (locked && !el.closest('[data-air-allow]'))`. When the result is true, it calls `onDone()` synchronously.
- **`animationend`.** `onAnimationEnd` accepts only events with `e.target === e.currentTarget` and an `animationName` of `px-resolve` or `px-fade`.
- **No masked targets.** Never put PxResolve on an element that has its own `mask-image` (a Bayer field, a skeleton). Wrap that element instead.

**Acceptance criteria**
- [ ] Fixture `[data-specimen="PxResolve"]`. On mount, the specimen computes `animation-name: px-resolve` with `animation-duration: 0.16s`. The 120 ms instance computes `0.12s`.
- [ ] The key specimen has no `.px-resolve` on first render. Clicking its "Replay" button replaces the element node (`!==`), and the new node computes `animation-name: px-resolve`. `onDone` has fired once, 160–220 ms after the click.
- [ ] With reduced motion, `animation-name` is `none` and `onDone` has fired before the next animation frame.
- [ ] With the simulator holding the lock: the plain specimen computes `animation-name: none`, and the `airAllow` specimen computes `px-resolve`.
- [ ] `grep -rn "onPointerEnter\|onMouseEnter\|:hover" dashboard/components/effects/PxResolve.tsx` prints nothing.

#### 12.3.4 Arcade pixel → `PixelFace` (`components/effects/PixelFace.tsx`, `components/effects/px5x7.ts`, `lib/pixelFont.json`)

| | |
|---|---|
| Purpose | True pixel lettering with no font file and no canvas, on the carrier's 2 px grid. It is scoped (O11) to md lamp faces, slate kickers and the empty ShotFrame tag, and is **never more than 3 words** |
| Technique | An original 5×7 bitmap set. Each glyph row is drawn as horizontal SVG `<rect>` runs in `currentColor`, with `shape-rendering="crispEdges"`, a `viewBox` in cell units, and `width`/`height` = cells × `cell`. The advance is 6 cells (5 + a 1-cell gap). Width in cells is `6n − 1` |
| Timings | None. The host resolves it (TallyLight re-key, Slate entrance) |
| Colours | `currentColor`, set by the host: `text-accent` (slate kickers on panel), `text-fg-on-screen` (HUD plates, where accent is not allowed), `text-tally-ink` or a tally colour (lamps) |
| Reduced motion / air lock | Static; nothing to freeze |
| Perf | Pure render with **no hooks**, so it works in server and client components. At most 24 characters and 160 `<rect>`s per face |
| A11y | The `<svg>` is `aria-hidden` and `focusable="false"`. The real text is in a sibling `sr-only` span: `srText ?? text`. When a host supplies its own accessible name (TallyLight's `srLabel`), it passes `srText={null}` and no sr span is rendered. A decorative face (the not-found `404` digits, the empty ShotFrame tag) passes `srText={null}` and `aria-hidden`, which is forwarded to the root span. `srText=""` is never used: it would render an empty sr-only span |
| Used by | TallyLight md (§7.4), including the Analytics ON-AIR strip (§11); Slate kickers (§6.13); StandbySlate and FailedSlate (§8); empty ShotFrame `SH03` (§9); the decorative not-found `404` digits (§11.D.2) |

```tsx
// Original implementation inspired by "Arcade pixel" (https://arlan.me/vault/arcade-pixel). No upstream source copied.
// components/effects/PixelFace.tsx: no 'use client' (hookless, server-safe)
import { cn } from '@/lib/utils'
import { PX5X7 } from './px5x7'

const B32 = '0123456789abcdefghijklmnopqrstuv'
export type PixelFaceProps = { text: string; cell?: 2 | 4; srText?: string | null; className?: string; 'aria-hidden'?: true }

export function pixelRuns(text: string) {
  const chars = Array.from(text)
  const runs: [x: number, y: number, w: number][] = []
  let missing = ''
  chars.forEach((ch, i) => {
    let g = PX5X7[ch]
    if (g === undefined) { missing += ch; g = PX5X7['\uFFFD'] }
    for (let y = 0; y < 7; y++) {
      const bits = B32.indexOf(g[y])
      for (let x = 0; x < 5; ) {
        if (bits & (16 >> x)) { let w = 1; while (x + w < 5 && bits & (16 >> (x + w))) w++; runs.push([i * 6 + x, y, w]); x += w }
        else x++
      }
    }
  })
  return { runs, width: Math.max(1, chars.length * 6 - 1), missing }
}

export function PixelFace({ text, cell = 2, srText, className, 'aria-hidden': ariaHidden }: PixelFaceProps) {
  const { runs, width, missing } = pixelRuns(text)
  return (
    <span data-pixel-face data-missing={missing || undefined} aria-hidden={ariaHidden} className={cn('inline-flex shrink-0 align-middle', className)}>
      <svg aria-hidden="true" focusable="false" width={width * cell} height={7 * cell} viewBox={`0 0 ${width} 7`}
           shapeRendering="crispEdges" fill="currentColor">
        {runs.map(([x, y, w]) => <rect key={`${x}.${y}`} x={x} y={y} width={w} height={1} />)}
      </svg>
      {srText !== null && <span className="sr-only">{srText ?? text}</span>}
    </span>
  )
}
```

**Glyph data format.**
- Each glyph is **7 characters**, one per row from top to bottom.
- Each character is a base-32 digit (`0–9a–v`). Its 5 bits are the row's columns, and bit 16 is the leftmost. The file's `encoding` field names this format (`base32-rows-bit16-left`), and every reader decodes a row with `B32.indexOf(c)`.
- `'\uFFFD'` is the missing-glyph box. An unknown character renders as that box and is listed in `data-missing`, so a typo is visible in screenshots and caught by tests. It is never silent.
- Numerals: `0` is slashed, so it is distinct from `O`, matching `.nums` `slashed-zero`. Lowercase letters are not in the set, so kickers are authored in uppercase (§5.20.5).

The glyph table lives in **one** file, `dashboard/lib/pixelFont.json`. Its content is owned here; §13's brand build reads the same file (§13.6.10). It lands in 3B, before PixelFace, because the brand build needs it; `px5x7.ts` and PixelFace land in 4A (§14). Paste this as `dashboard/lib/pixelFont.json` (exactly these 47 entries):

```json
{
  "w": 5,
  "h": 7,
  "encoding": "base32-rows-bit16-left",
  "glyphs": {
    "A": "ehhvhhh", "B": "uhhuhhu", "C": "ehggghe", "D": "uhhhhhu", "E": "vgguggv", "F": "vgguggg", "G": "ehgnhhf", "H": "hhhvhhh", "I": "e44444e",
    "J": "72222ic", "K": "hikokih", "L": "ggggggv", "M": "hrllhhh", "N": "hhpljhh", "O": "ehhhhhe", "P": "uhhuggg", "Q": "ehhhlid", "R": "uhhukih",
    "S": "fgge11u", "T": "v444444", "U": "hhhhhhe", "V": "hhhhha4", "W": "hhhllla", "X": "hha4ahh", "Y": "hha4444", "Z": "v1248gv",
    "0": "ehjlphe", "1": "4c4444e", "2": "eh1248v", "3": "v2421he", "4": "26aiv22", "5": "vgu11he", "6": "68guhhe", "7": "v124888", "8": "ehhehhe", "9": "ehhf12c",
    ".": "0000004", "-": "000e000", ":": "0400040", "/": "11248gg", "·": "0004000", "#": "aavavaa", "@": "ehnlngf", "$": "4fke5u4", "!": "4444404", " ": "0000000", "\uFFFD": "vhhhhhv"
  }
}
```

`components/effects/px5x7.ts` is a re-export, exactly these three lines:

```ts
// Original implementation inspired by "Arcade pixel" (https://arlan.me/vault/arcade-pixel). No upstream source copied.
import font from '@/lib/pixelFont.json'
export const PX5X7: Readonly<Record<string, string>> = font.glyphs
```

`tsconfig.json` already sets `"resolveJsonModule": true`, so the import needs no config change.

For example, `A` = `ehhvhhh` decodes to `.###.` `#...#` `#...#` `#####` `#...#` `#...#` `#...#`.

**Required coverage.** Every string any section passes to PixelFace renders with no `data-missing`:
- Slate kickers: `STAND BY`, `BLANK BOARD`, `OPEN CASTING`, `NO SCOUTS`, `NO FOOTAGE`, `NO TAPE`, `NO DATA`, `NOT PATCHED`, `NO ACCESS`, `NO CARRIER`, `SIGNAL LOST`, `CH 404`.
- md lamp words: `ON AIR`, `OFF AIR`, `CUE`, `PVW`, `STBY`, `REC`, `STALLED 00:06` (any `STALLED MM:SS`), `LIVE`, `OFFLINE`, `ERROR`, `STALE`.
- Shotboard: `SH01`–`SH99`.
- Not-found art: `404` at `cell={4}`, decorative (`srText={null}` and `aria-hidden`, §11.D.2).

At `cell={2}` the cap height is 14 px, and `NOT PATCHED` is 130 px wide.

**Acceptance criteria**
- [ ] From the repository root, this exits 0: `node -e "const f=require('./dashboard/lib/pixelFont.json');process.exit(Object.keys(f.glyphs).length===47&&Object.values(f.glyphs).every(v=>/^[0-9a-v]{7}$/.test(v))?0:1)"`.
- [ ] `grep -c "@/lib/pixelFont.json" dashboard/components/effects/px5x7.ts` prints `1`, and `grep -cE "'[0-9a-v]{7}'" dashboard/components/effects/px5x7.ts` prints `0` (no second glyph table).
- [ ] Fixture `[data-specimen="PixelFace"]` renders every required string above at `cell={2}`, `CH 404` at `cell={4}`, and the decorative `404` at `cell={4}` with `srText={null} aria-hidden`. Across the specimen:
  - `querySelectorAll('[data-pixel-face][data-missing]').length === 0`;
  - every svg `height` is `14` (cell 2) or `28` (cell 4);
  - every `sr-only` text has ≤ 3 words;
  - `querySelectorAll('[data-pixel-face] rect').length ≤ 160` per face;
  - the decorative `404` root has `aria-hidden="true"` and no `.sr-only` child.
- [ ] The fixture's negative case `<PixelFace text="Aé" />` renders `data-missing="é"` and an svg that is `11 × cell` wide (two glyph boxes).
- [ ] Screenshot `pixelface-dark.png` of the specimen is added to the §15 after-screenshots.
- [ ] `grep -rn "PixelFace" dashboard/components/boot` prints nothing.

#### 12.3.5 Decrypted Text → `DecryptedText` (`components/effects/DecryptedText.tsx`)

| | |
|---|---|
| Purpose | A state word resolves out of glyph noise **once**, like a machine handshake. It is used only for the active CONNECT_STEP label and for a GenerationFrame phase word when the phase changes. It is never used on telemetry, numbers, timecode, data or any string that updates on a timer |
| Technique | DOM text. A scramble overlay is written through `textContent` on a ref from the shared ticker, so React does not re-render per frame |
| Timings | Glyphs `░▒▓█01/<>_`. Frames are 28 ms, with ≤ 6 scrambles per character (168 ms). The stagger is `min(16, 152 / (n − 1))` ms per character, which keeps the **total ≤ 320 ms** for any length. Spaces never scramble |
| Colours | Inherited (`currentColor`) |
| Reduced motion | The final text renders immediately and no run starts |
| Air lock | Frozen (final text) unless the element is inside `[data-air-allow]`. The connect plate carries it, which gives the CONNECT_STEPS exception (§6.12) |
| Perf | ≤ 11 `textContent` writes per run, at ≤ 30 fps on the shared ticker. It never runs while the tab is hidden: the ticker pauses, and the run completes on return |
| A11y | During a run the final text is in an `sr-only` span, and the scramble and the width-lock copy are `aria-hidden`. After the run, the final text is the **only** text (`root.textContent === text`) |
| Used by | StageTrack `decryptActive` in the connect plate (§6.5, §8); GenerationFrame phase readouts `SAVING`/`EXPANDING` on entering the phase (§6.6) |

```ts
export type DecryptedTextProps = {
  text: string
  trigger?: 'mount' | 'change'   // default 'change': scramble when `text` changes after mount; 'mount': once on mount
  className?: string
}
export const DecryptedText: React.ForwardRefExoticComponent<DecryptedTextProps & React.RefAttributes<HTMLSpanElement>>
```

**DOM**
- At rest: `<span data-decrypted>{text}</span>`.
- While running (entered in `useLayoutEffect`, so no frame shows the plain text first): `<span data-decrypted data-running className="relative inline-block"><span className="sr-only">{text}</span><span aria-hidden className="invisible">{text}</span><span aria-hidden className="absolute inset-0 whitespace-pre overflow-hidden" ref={scrambleRef} /></span>`. The invisible copy locks the width, so there is zero layout shift, even in Focal, where the block glyphs are wider than letters.

**Per-frame state** at elapsed `t` (ms), for character `i` of `n` (`Array.from(text)`):

```ts
const F = 28, K = 6, TOTAL = 320
const stagger = n > 1 ? Math.min(16, (TOTAL - K * F) / (n - 1)) : 0
const startAt = (i: number) => i * stagger
const lockAt  = (i: number) => startAt(i) + K * F                       // lockAt(n − 1) ≤ 320
const glyphAt = (i: number, t: number) => {                             // ≤ 6 distinct glyphs per character
  const f = Math.max(0, Math.min(K - 1, Math.floor((t - startAt(i)) / F)))
  const r = xorshift32(fnv1a(text) ^ Math.imul(i + 1, 73856093) ^ Math.imul(f + 1, 19349663))()   // dither-kit/pixel
  return '░▒▓█01/<>_'[Math.floor(r * 10)]
}
// char i shows: ch === ' ' || t >= lockAt(i) ? ch : glyphAt(i, t); the run ends at t ≥ lockAt(n − 1)
```

The glyphs are deterministic, so screenshots are stable. A `text` change during a run restarts the run with the new text.

**Acceptance criteria**
- [ ] Fixture `[data-specimen="DecryptedText"]`: clicking "Next label" cycles the five CONNECT_STEPS.
  - Within one frame of the click, `getByText('<new label>', { exact: true })` resolves (the sr-only span).
  - No later than 360 ms after the click, the element has no `data-running` and `textContent === '<new label>'`.
  - The root's `getBoundingClientRect().width` sampled every frame varies by ≤ 0.5 px.
- [ ] With reduced motion, and under the simulator lock outside `[data-air-allow]`, no `data-running` ever appears.
- [ ] `grep -rln "DecryptedText" dashboard/app dashboard/components` lists only files under `components/effects/`, `components/generation/` and `components/director/`, plus fixture files. It is never imported by a telemetry, readout or chart component.

> Note: §8's ConnectPlate animates the active label through StageTrack, never through a separate `<DecryptedText trigger="change">` wrapper. The call is exactly ``<StageTrack orientation="vertical" tone="hud" decryptActive label="Connection progress" stages={CONNECT_STEPS.map((label, i) => ({ id: `s${i}`, label }))} current={`s${connectStep}`} status="running" />`` (§8.4.4). StageTrack re-keys the active label's `<DecryptedText trigger="mount">` by stage id, which is the same behaviour and keeps the label inside the list item. `label` is required (§12.3.6).

#### 12.3.6 Stepper → `StageTrack` (`components/generation/StageTrack.tsx`)

This section owns StageTrack's API; §7.5 points here.

| | |
|---|---|
| Purpose | A system-driven progress indicator for multi-stage waits: indicators only. The CSV Stepper's wizard behaviour (Back/Continue buttons, clickable steps) is dropped |
| Technique | DOM. An `ol` of 8×8 `rounded-lamp` squares with labels. Horizontal: 16×1 px connectors in `line-subtle`. Vertical: 20 px rows |
| Timings | Square state changes **snap**: no transition on the square (§6.1 law 1 animates only transform, opacity, stepped masks and clip-path, and a stepped colour transition would still delay the change and appear in `getAnimations()`). The active square is **steady**, never pulsing |
| Colours | done `bg-success`; active `bg-accent`; pending a 1 px `border-line-control` outline; failed `bg-danger` (an 8 px status square, like `Led`). `tone="hud"` sets `--c-accent: 122 165 224; --c-success: 52 210 123; --c-danger: 255 107 107` inline on the root, the dark values, because screen material is theme-invariant (the same pattern as §6.6). It also sets pending outlines and every label to `text-fg-on-screen`, since accent text is never placed on HUD plates (§5) |
| Reduced motion | Identical: there is no motion to remove. `decryptActive` does nothing |
| Air lock | Snaps are allowed; the connect plate carries `data-air-allow` |
| Perf | DOM only |
| A11y | `<ol role="list" aria-label={label}>`. The explicit role is needed because `list-none` strips list semantics in Safari. The active `li` has `aria-current="step"`. Each label is its own span (exact text), followed by an `sr-only` state suffix: ", done", ", in progress" or ", failed" |
| Used by | Connect plate: vertical, `tone="hud"`, `decryptActive`, the 5 verbatim CONNECT_STEPS (§6.5, §8). Darkroom: horizontal, Save → Expand → Queue → Render → Upload → Review (§10). TransferSheet: horizontal, 'Save edits', `Expand prompts {done}/{total}`, 'Prepare transfer', 'Open Live Control' (§9) |

```ts
export type Stage = { id: string; label: string }
export type StageTrackProps = {
  stages: readonly Stage[]
  current: string | null                      // id of the active stage; null = not started
  status: 'running' | 'done' | 'failed'
  orientation?: 'horizontal' | 'vertical'     // default 'horizontal'
  tone?: 'panel' | 'hud'                      // default 'panel'
  decryptActive?: boolean                     // wrap the active label in <DecryptedText trigger="mount" key={stage.id}>
  label: string                               // aria-label, e.g. 'Connection progress'
  className?: string
}
```

State derivation, with `ci` = the index of `current`:
- `i < ci` is `done`.
- `i === ci` is `active` while `running`, `failed` when `status === 'failed'`, and `done` when `status === 'done'`.
- `i > ci` is `pending`.
- With `current === null`, every stage is `pending`, or `done` if `status === 'done'`.

Panel label colours: done `text-fg-2`, active `text-fg` medium, pending `text-fg-3`, failed `text-danger`.

**Acceptance criteria**
- [ ] Fixture `[data-specimen="StageTrack"]` at connect steps 0–4.
  - The label spans read exactly 'Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene', in order.
  - Exactly one `li[aria-current="step"]` exists while `running`.
  - `document.getAnimations()` targeting the track is empty 100 ms after a step change.
- [ ] With `status="failed"`, the failed square computes `background-color` equal to `rgb(var(--c-danger))` and its `li` text ends with ", failed".
- [ ] `grep -nE "Back|Continue|onClick" dashboard/components/generation/StageTrack.tsx` prints nothing.

#### 12.3.7 Animated List → `StreamList` (`components/effects/StreamList.tsx`)

| | |
|---|---|
| Purpose | Streams (directions, chat, events) feel alive but orderly: new rows resolve, and old rows never animate or jump under the reader |
| Technique | DOM. New rows (keys not seen before) get `.px-resolve` with `--px-resolve-dur: 120ms` and `animation-delay: calc(min(k, 7) × 30ms)`, where `k` is the row's index among the rows new in this commit. Rows present at mount are "seen" and do not animate |
| Timings | 120 ms (4 × 30 ms) resolve, **no slide**. A 30 ms stagger for up to 8 rows; the rest arrive with the 8th (§6.1 law 3) |
| Colours | None of its own. Rows are styled by the caller |
| Reduced motion | Rows appear instantly (§5.14) |
| Air lock | Allowed: every row carries `data-air-allow` (§6.12) |
| Perf | No JS per frame. One passive `scroll` listener keeps `atEdgeRef` current. No gradients, no transforms, no `backdrop-filter` |
| A11y | The scroll container is focusable (`tabIndex={0}`) and named (`aria-label={label}`), so keyboard users can scroll it (axe `scrollable-region-focusable`). `live="polite"` gives it `role="log"` (additions announced); `live="off"` gives it `role="group"`. There is **no** arrow-key row navigation. Rows are `li`s in a `ul role="list"` |
| Used by | DirectionQueue (newest first, ≤ 8), Chat feed (newest last, ≤ 20), EventConsole (newest last) (§8). ChyronHost may render its stack through it (newest first, `live="off"`, because each chyron has its own role, §6.10) |

```ts
export type StreamListProps<T> = {
  items: readonly T[]
  getKey: (item: T) => string | number
  renderItem: (item: T, index: number) => React.ReactNode
  newest: 'first' | 'last'
  label: string
  live?: 'off' | 'polite'          // default 'off'
  className?: string               // scroll container (the caller sets max-height)
  rowClassName?: string
}
export function StreamList<T>(props: StreamListProps<T>): JSX.Element
```

**Stick-to-edge.** The list follows new rows only when the user is already within 8 px of the newest edge:
- `atEdgeRef` is `scrollTop ≤ 8` for `newest="first"` and `scrollHeight − scrollTop − clientHeight ≤ 8` for `newest="last"`.
- After the commit, a `useLayoutEffect` keyed on the key list sets `scrollTop` to the newest edge only when `atEdgeRef.current` is true.
- Otherwise the rows the reader is looking at stay put. With `newest="first"`, rows are prepended above them: rely on `overflow-anchor: auto`, and where `CSS.supports('overflow-anchor: auto')` is false (Safari), add the container's `scrollHeight` delta to `scrollTop` in the same layout effect.

**Acceptance criteria**
- [ ] Fixture `[data-specimen="StreamList"]`: "Add 3" gives 3 new `li`s with `animation-name: px-resolve`, `animation-duration: 0.12s` and delays `0s`, `0.03s`, `0.06s`; the existing rows compute `animation-name: none`. "Add 12" caps the delays at `0.21s`.
- [ ] In both `newest` modes, scroll the container 100 px away from the newest edge, then "Add 3": the first fully visible row's `getBoundingClientRect().top` is unchanged (± 1 px). At the edge, the newest row is fully visible after the commit.
- [ ] Every row has `data-air-allow`, and no row computes a `transform` other than `none`.
- [ ] With focus on the container, `ArrowDown` scrolls it natively and `document.activeElement` stays the container.

#### 12.3.8 Pill Nav → the AppNav indicator (`components/shell/AppNav.tsx`)

| | |
|---|---|
| Purpose | A stable sense of place in the command bar: a 2 px accent bar slides under the active link |
| Technique | **Concept only.** There is no pill blob, no logo slot and no initial animation. `motion/react` `layoutId="nav-indicator"` inside `<LayoutGroup id="appnav">`, with `initial={false}`. The full code and parts table are in §6.4.2 |
| Timings | 200 ms `[.16,1,.3,1]` (`--dur-base`, `--ease-out`), transform only. The active LED snaps in 60 ms (`--dur-tick`) |
| Colours | `rgb(var(--c-accent))` under the 50% Bayer mask (`--bayer-4-07`) |
| Reduced motion / air lock | `transition={{ duration: 0 }}`: the bar jumps |
| Perf | One motion layout animation per navigation. `motion/react` is confined to this file, plus the two cut-able Shotboard `Reorder` files while 9D ships (§12.1 rule 4) |
| A11y | Unchanged link semantics: the 7 exact labels, hrefs and icons (`AdminNav.tsx:7-15`), the active rule (`:23`), `aria-label="Admin sections"`, and `aria-current="page"`. The indicator is `aria-hidden` |
| Used by | CommandBar (§7.8, §7.9) |

**Acceptance criteria**
- [ ] The §6.16 nav-indicator items pass.
- [ ] `head -3 dashboard/components/shell/AppNav.tsx` contains the Pill Nav provenance line.
- [ ] The output of `grep -rlE "from ['\"]motion/react['\"]" dashboard/app dashboard/components --exclude-dir=dither-kit` contains `dashboard/components/shell/AppNav.tsx`, and every line is one of `dashboard/components/shell/AppNav.tsx`, `dashboard/components/shotboard/SceneRail.tsx` or `dashboard/components/shotboard/SceneTrack.tsx` (the last two only while 9D ships, §9.5.7).

#### 12.3.9 Figma vector editor → `SelectionBrackets` (`components/effects/SelectionBrackets.tsx`, `.module.css`)

| | |
|---|---|
| Purpose | A production-tool selection and viewfinder: thin L-shaped corner brackets, handle squares in the selection variant, and a small tag. There is no drag, no bezier editing and no third-party branding |
| Technique | DOM and CSS: 4 corner `span`s, each drawing its L with 1 px borders, plus 4 handle `::after` squares (selection variant) and one tag `span`. It is absolutely positioned inside a `position: relative` host |
| Timings | Viewfinder `tight`: each corner moves 4 px inward **once**, `transform` over 200 ms `--ease-out` (`--dur-base`). The selection variant has no motion (it cuts) |
| Colours | Viewfinder ink `rgb(var(--c-text-on-screen-2) / .7)`; selection lines and handles `rgb(var(--c-accent))`; tag `micro` `text-fg-on-screen` on a solid `bg-bezel` plate (`rounded-xs`, `px-1`, 16 px tall) |
| Reduced motion | `tight` is a cut |
| Air lock | The viewfinder tighten happens at the first decoded frame, which is under the lock. It is the signal-acquired indicator, so the viewfinder root carries `data-air-allow`. The selection variant has no motion |
| Perf | 5–9 DOM nodes, `pointer-events: none`, no canvas |
| A11y | The root is `aria-hidden`. Selection is conveyed by the host (`aria-selected`/`data-selected`). The tag is decorative and its facts exist elsewhere in text |
| Used by | Monitor viewfinder: `variant="viewfinder" inset={12} tight={firstFrame}`; the size tag lives on the bezel lip (§8). Shotboard selected frame: `variant="selection" inset={4}` with no tag, inside the block, so nothing crosses the lane's `overflow-x: auto` clip; the IN point is in the inspector kicker (§9). Characters turnaround labels and the Locations compare (§10) |

> Note: bible §7.1 and bible §8 (pick 9) give the viewfinder ink as text-3 at .7. `text-3` changes with the theme and turns dark-on-black on the screen in light mode, so the screen-invariant `--c-text-on-screen-2` at .7 is used. §8.4.4 uses the same value.

```ts
export type SelectionBracketsProps = {
  variant: 'viewfinder' | 'selection'
  inset?: number                 // px from the host box; negative = outside. Default 12 (viewfinder) / -6 (selection)
  arm?: number                   // L arm length, default 12
  tag?: string                   // authored uppercase, ≤ 24 chars
  tagPlacement?: 'top-start' | 'bottom-start' | 'bottom-end'   // default 'top-start': outside, above the top-left corner
  tight?: boolean                // viewfinder only: false → true moves each corner 4 px inward once
  className?: string
}
```

```css
/* components/effects/SelectionBrackets.module.css */
/* Original implementation inspired by "Figma vector editor" (https://arlan.me/vault/vector-editor). No upstream source copied. */
.root { position: absolute; inset: var(--sb-inset); pointer-events: none; }
.root[data-variant="viewfinder"] { --sb-ink: rgb(var(--c-text-on-screen-2) / .7); }
.root[data-variant="selection"]  { --sb-ink: rgb(var(--c-accent)); }
.corner { position: absolute; width: var(--sb-arm); height: var(--sb-arm); border: 0 solid var(--sb-ink);
  transition: transform var(--dur-base) var(--ease-out); }
.corner[data-c="tl"] { top: 0; left: 0;     border-top-width: 1px;    border-left-width: 1px; }
.corner[data-c="tr"] { top: 0; right: 0;    border-top-width: 1px;    border-right-width: 1px; }
.corner[data-c="bl"] { bottom: 0; left: 0;  border-bottom-width: 1px; border-left-width: 1px; }
.corner[data-c="br"] { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }
.root[data-tight] .corner[data-c="tl"] { transform: translate(4px, 4px); }
.root[data-tight] .corner[data-c="tr"] { transform: translate(-4px, 4px); }
.root[data-tight] .corner[data-c="bl"] { transform: translate(4px, -4px); }
.root[data-tight] .corner[data-c="br"] { transform: translate(-4px, -4px); }
.root[data-variant="selection"] .corner { transition: none; }
.root[data-variant="selection"] .corner::after { content: ""; position: absolute; width: 6px; height: 6px; background: rgb(var(--c-accent)); }
.corner[data-c="tl"]::after { top: -4px; left: -4px; }
.corner[data-c="tr"]::after { top: -4px; right: -4px; }
.corner[data-c="bl"]::after { bottom: -4px; left: -4px; }
.corner[data-c="br"]::after { bottom: -4px; right: -4px; }
.tag { position: absolute; white-space: nowrap; }
.tag[data-at="top-start"]    { left: 0;  bottom: calc(100% + 4px); }
.tag[data-at="bottom-start"] { left: 0;  top: calc(100% + 4px); }
.tag[data-at="bottom-end"]   { right: 0; top: calc(100% + 4px); }
@media (prefers-reduced-motion: reduce) { .corner { transition: none; } }
```

`--sb-inset` and `--sb-arm` are set inline from the props. The host must leave unclipped space outside its own box: `max(0, 4 − inset)` px on every side for the selection handles (none at `inset={4}`, 10 px at the default −6), plus `max(0, 20 − inset)` px on the tag's side when a tag is shown (`|inset| + 20` px at a negative inset). Inside a scroll container, give the lane that much padding, or use an inset and tag choice that needs none, as the Shotboard does (`inset={4}`, no tag, §9). Clipping is the host's bug to fix this way, never by overriding the component's CSS.

**Acceptance criteria**
- [ ] Fixture `[data-specimen="SelectionBrackets"]`, viewfinder: 4 `[data-c]` spans, each 12×12 with two 1 px borders. Toggling `tight` gives each corner a computed transform of `matrix(1, 0, 0, 1, ±4, ±4)` after 250 ms, and the root has `data-air-allow`. With reduced motion, the transform is final within one frame.
- [ ] Selection: 4 handles, each 6×6, `background-color` = the accent token. The tag's bounding box bottom is 4 px above the brackets' top edge.
- [ ] The root is `aria-hidden="true"` and computes `pointer-events: none`.

#### 12.3.10 Symbols effect → `SymbolRaster` (`components/effects/SymbolRaster.tsx`)

| | |
|---|---|
| Purpose | The idle monitor becomes a station test card: the Coast standby key art rebuilt from four symbols. During connect, the same raster "acquires signal" (it densifies), then dissolves into the first decoded frame (§6.5). The CSV study runs live video on the GPU; this build is a still image on Canvas2D |
| Technique | Canvas2D with 6 px cells and 1 backing px per CSS px (independent of DPR), CSS-upscaled with `image-rendering: pixelated`. Written as one `ImageData` through a `Uint32Array`. Paints happen **only** on: mount, `src` change, container resize and `density` change. There is no loop |
| Timings | A density change is a cut. `clearing` runs a 320 ms reverse-Bayer-8 clear with `easeInOutCubic` on the shared ticker (≤ 30 fps). A `setTimeout` of 400 ms guarantees `onCleared` if the ticker is paused (hidden tab) |
| Colours | **Screen ink, theme-invariant:** `[29,49,96]`, `[51,87,168]`, `[122,165,224]`, `[232,238,249]` on `[0,0,0]`. These equal the dark `--c-ramp-1`, `--c-ramp-2`, `--c-ramp-3` and `--c-ramp-glint`, and `--c-screen` (§5). They are constants because the screen never follows the theme |
| Reduced motion | Densities still cut. Under reduced motion (the live hook), `clearing` runs `canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'linear', fill: 'forwards' })`, which the global reduced-motion CSS rule (§5.2, §6.14) does not affect, and calls `finish()` from `animation.finished`, with a 250 ms `setTimeout` guard. It never relies on `transitionend`: under reduced motion a CSS transition becomes a 1 ms cut (§6.14) |
| Air lock | Allowed: acquisition and the clear are signal. The canvas carries `data-air-allow` |
| Perf | **An effect canvas: it needs a slot** (it covers more than 25% of the viewport). The **host** requests the slot `symbol-raster` and mounts SymbolRaster only while granted: priority 3 while acquiring and during its 320 ms clear, 1 while idle (§7.16; the call is §8.5.11). Loaded via `next/dynamic` with `ssr: false`. A paint is ≤ 16 ms at a 1920×1080 container on the CI runner, measured with `performance.measure('symbol-raster:paint')` in dev |
| A11y | `<canvas aria-hidden>`. The monitor's text (plates, slates) carries the meaning |
| Used by | DirectorStage z3 (§8.4.4); fixture |

```ts
export type SymbolRasterProps = {
  src: string                 // '/brand/standby/coast-{16x9|9x16|1x1}-lum.png' (docs/redesign/spec/13-brand-assets-fal.md §13.6.4: 160×90 / 90×160 / 90×90 greyscale)
  density: number             // 0–1: the fraction of cells showing a symbol (idle 1; acquiring .10/.25/.40/.60/.80)
  clearing?: boolean          // false → true: run the clear once, then onCleared()
  onCleared?: () => void      // the host unmounts the raster
  onError?: () => void        // the luminance image failed to decode; the host renders its BrandImage fallback
  className?: string
}
export default function SymbolRaster(props: SymbolRasterProps): JSX.Element   // default export for next/dynamic
```

**Algorithm:**

```ts
const CELL = 6
const GLYPH = [                         // 5×5 inside the 6×6 cell; column 5 and row 5 stay black
  '00000 00000 00100 00000 00000',      // band 0  ·
  '00000 00100 01110 00100 00000',      // band 1  +
  '00000 01010 00100 01010 00000',      // band 2  ×
  '11111 11111 11111 11111 11111',      // band 3  █
]
const INK = [[29, 49, 96], [51, 87, 168], [122, 165, 224], [232, 238, 249]]   // dark ramp-1..3, ramp-glint (screen ink)
const B8 = (x: number, y: number) => (BAYER8[(y & 7) * 8 + (x & 7)] + 0.5) / 64   // BAYER8 (lib/bayer.ts): the INTEGERS 0–63 in carrier order, the numerators of Dither.jsx:83-90
const abgr = ([r, g, b]: number[], a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0   // little-endian ImageData
// Module-level, built once: TILE[b] = Uint32Array(36): lit → abgr(INK[b]), unlit → abgr([0,0,0]);
// BLACK = Uint32Array(36).fill(abgr([0,0,0])); CLEAR = Uint32Array(36) (all 0 = transparent)

// On mount: ctx.fillRect in #000 at once (never a transparent flash), then `await img.decode()` of `src`.
function prepare() {                    // after decode; on src change; on ResizeObserver
  cols = Math.ceil(host.clientWidth / CELL); rows = Math.ceil(host.clientHeight / CELL)
  canvas.width = cols * CELL; canvas.height = rows * CELL          // CSS size set to the same px; top-left anchored; the screen clips
  const s = sampler(cols, rows)                                    // a detached 2D canvas, willReadFrequently: true
  s.imageSmoothingQuality = 'high'; s.drawImage(img, 0, 0, cols, rows)   // box-filters the luminance master to one sample per cell
  const L = s.getImageData(0, 0, cols, rows).data                  // same-origin PNG: never tainted
  for (y < rows) for (x < cols) { const i = y * cols + x
    band[i] = clamp(Math.floor((L[i * 4] / 255) * 4 + B8(x + 4, y + 4) - 0.5), 0, 3)   // ordered dither between adjacent bands
    rank[i] = B8(x, y) }                                           // order of appearance (density) and of the clear
  image = ctx.createImageData(canvas.width, canvas.height); px = new Uint32Array(image.data.buffer)
  paint(density, 1)
}
function paint(density: number, keep: number) {                    // keep < 1 only while clearing; allocates nothing per cell
  const cw = canvas.width
  for (y < rows) for (x < cols) { const i = y * cols + x
    const t = rank[i] > keep ? CLEAR : rank[i] > density ? BLACK : TILE[band[i]]
    let o = y * CELL * cw + x * CELL, k = 0                        // direct indexed writes: no subarray views
    for (let gy = 0; gy < 6; gy++, o += cw) { px[o] = t[k++]; px[o+1] = t[k++]; px[o+2] = t[k++]; px[o+3] = t[k++]; px[o+4] = t[k++]; px[o+5] = t[k++] } }
  ctx.putImageData(image, 0, 0)                                    // dev: frames.raster++ and performance.measure
}
function clear() {                                                 // clearing: false → true
  if (reducedRef.current) {                                        // live useReducedMotion(): WAAPI, which the global reduced-motion CSS rule never shortens
    const a = canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'linear', fill: 'forwards' })
    a.finished.then(finish, () => {})                              // never transitionend; a cancel on unmount is silent
    setTimeout(finish, 250)                                        // guard
    return
  }
  const t0 = performance.now()
  const off = ticker.register((t) => {
    const p = Math.min(1, (t - t0) / 320)
    paint(density, 1 - easeInOutCubic(p))                          // highest rank clears first: reverse Bayer-8
    if (p === 1) { off(); finish() }                               // finish(): idempotent → onCleared?.()
  })
  setTimeout(() => { off(); finish() }, 400)
}
```

- Cleared cells become **transparent**, which reveals the `<video>` below (z2). Masked cells (`rank > density`) stay opaque black.
- `paint()` allocates nothing per cell: no `subarray`, no arrays, no closures inside the loops. At 1920×1080 that is 57,600 cells per paint; one `subarray` view per cell row would allocate about 345,600 objects per paint and break the ≤ 16 ms budget during the go-live clear.
- If `decode()` rejects, render nothing and call `onError`.
- Do not repaint on a theme change: the ink is theme-invariant.
> Note: the bible lists "theme" as a paint trigger. It is dropped because the raster's colours are screen material and never change with the theme.

**Acceptance criteria**
- [ ] Fixture `[data-specimen="SymbolRaster"]` at 1280×720, with 'Run raster' on (the specimen holds slot `symbol-raster` at priority 3):
  - `canvas.width === 1284` and `canvas.height === 720`;
  - `getComputedStyle(canvas).imageRendering === 'pixelated'`;
  - every opaque pixel from `getImageData` is one of `#000000`, `#1D3160`, `#3357A8`, `#7AA5E0`, `#E8EEF9`;
  - `__wzrd.frames.raster` does not change over 2000 ms idle.
- [ ] At density buttons .10 / .40 / 1, the share of cells with a lit symbol pixel is 9.4% ± 1.5, 40.6% ± 1.5 and 100% (6, 26 and 64 of every 64 Bayer ranks). Each click increases `frames.raster` by exactly 1.
- [ ] "Clear" calls `onCleared` 320–420 ms after the click, and the last painted frame is fully transparent. With reduced motion, `onCleared` fires 150–250 ms after the click and no ticker callback runs.
- [ ] In dev, `performance.getEntriesByName('symbol-raster:paint')` at a 1920×1080 container has every duration ≤ 16 ms (unthrottled CI runner).
- [ ] `grep -c "subarray" dashboard/components/effects/SymbolRaster.tsx` prints `0` (no per-cell views).
- [ ] With reduced motion, 50 ms after "Clear", `canvas.getAnimations()` holds exactly one animation, with `effect.getTiming().duration === 150` (a WAAPI fade, not a CSS transition).
- [ ] On `/admin` idle (dev), the raster holds the slot: `__wzrd.slots.owner === 'symbol-raster'`. With the Audio tab visible, the dock open and covered tracks present, `__wzrd.slots.owner === 'morph'`, no raster canvas exists, and the BrandImage fallback is present (§8).

#### 12.3.11 Holo → `HoloCard` (`components/effects/HoloCard.tsx`, `.module.css`)

| | |
|---|---|
| Purpose | The flagship talent card: a collectible, identity-locked artifact for @coast (and other locked characters). An unlocked card renders the same layout with no foil |
| Technique | CSS 3D tilt driven by pointer custom properties. The foil is a chrome conic gradient inside a **static** 8 px Bayer mask (50%, `--bayer-4-07`) with `mix-blend-mode: color-dodge` at .22, clipped to the 6 px bezel frame so it never covers the portrait. Pointer movement translates the foil band (transform only), and the mask never moves. There is no WebGL, no canvas and no recolouring of the photo |
| Timings | Tilt ≤ 6° per axis, tracking the pointer with no transition while the pointer is inside. On leave, it returns over 200 ms `--ease-out` |
| Colours | Body `bg-bezel` with `--shadow-e2`; screen `bg-screen` and `--r-screen`; the plate is a HUD plate (`rgb(var(--c-bezel) / var(--a-hud))` over the screen), so all its text is `text-fg-on-screen` (never `-2` on a HUD plate, §5.6); foil stops `theme('colors.chrome.50' / .300 / .600 / .100 / .400 / .50)` (§5 chrome scale, art only) |
| Reduced motion | Static: no tilt, and the foil at its 35° rest angle |
| Air lock | Static (`useBroadcast(deriveLock)`) |
| Keyboard | While any descendant has `:focus-visible`, the card is static at 35°, so focus never moves the target |
| Perf | No loop. Pointer events are coalesced into ≤ 1 style write per animation frame. Loaded via `next/dynamic` with `ssr: false` |
| A11y | `<article aria-label="{name} talent card">`. The foil layers and the plate are `aria-hidden="true"`: the plate repeats facts the host already carries as text (the TalentBible `h2`, Led seal and `REFS` readout, §10.5.4). The photo's alt text comes from the caller |
| Used by | Characters talent bible, identity-locked characters, @coast first (§10) |

```ts
export type HoloCardProps = {
  image: React.ReactNode | null          // the caller passes <BrandImage id="talent/coast-portrait" …> or an <img>; null → placeholder
  name: string
  handle: string                         // rendered in `code`, e.g. '@coast'
  locked: boolean                        // foil only when true
  refs: { count: number; max: number }   // readout '{count}/{max}'
  sheetVersion?: number | null           // `SHEET v{n}` in micro
  clip?: { webm: string; mp4: string; poster: string } | null   // renders HoverClipButton "Play ident" (docs/redesign/spec/12-effects.md §12.3.12)
  plate?: boolean                        // default true; false → no plate (TalentBible, whose header shows the same facts)
  className?: string                     // the width comes from the host (144–400 px); the aspect ratio is fixed at 3:4
}
export default function HoloCard(props: HoloCardProps): JSX.Element
```

**Structure**
- `article.card[data-holo][data-locked?]` (perspective, and the inline-size container for the plate query)
  - `div.body` (the tilt, `rounded-lg sq`, clips its children), with the children in this order:
    - `div.screen` (inset 6 px: the 3:4 card minus the bezel): `image`, or the placeholder (a 25% Bayer `ramp` field with a `<PixelFace>` of the first two `[A-Z0-9]` characters of the uppercased handle), then the HoverClipButton `<video>` layer and button. The button sits at `absolute right-2 bottom-8` above the plate, or `bottom-2` when `plate` is false;
    - `div.foilMask` (static mask, clipped to the 6 px bezel frame) containing `div.foilBand` (moves);
    - `div.plate` (`aria-hidden="true"`; rendered only when `plate` is true): a 24 px HUD strip overlaid on the bottom edge of the screen.

```css
/* components/effects/HoloCard.module.css */
/* Original implementation inspired by "Holo" (https://arlan.me/vault/holo). No upstream source copied. */
.card { position: relative; aspect-ratio: 3 / 4; perspective: 800px; container-type: inline-size; --rx: 0deg; --ry: 0deg; --fx: 0%; }
.body { position: absolute; inset: 0; overflow: hidden; background: rgb(var(--c-bezel)); box-shadow: var(--shadow-e2);
  transform: rotateX(var(--rx)) rotateY(var(--ry)); transition: transform var(--dur-base) var(--ease-out); }
.card[data-tracking] .body, .card[data-tracking] .foilBand { transition: none; }
.screen { position: absolute; inset: 6px; overflow: hidden; border-radius: var(--r-screen); background: rgb(var(--c-screen)); }
.screen img { width: 100%; height: 100%; object-fit: cover; }   /* never a filter: skin tones stay true (docs/redesign/spec/13-brand-assets-fal.md §13.5) */
.foilMask { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: .22; mix-blend-mode: color-dodge;
  -webkit-mask: var(--bayer-4-07) 0 0 / 8px 8px repeat; mask: var(--bayer-4-07) 0 0 / 8px 8px repeat;
  /* the frame only: the even-odd hole is the 6 px screen inset, so the foil never touches the portrait */
  clip-path: polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 6px 6px, 6px calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 6px, 6px 6px); }
.foilBand { position: absolute; top: 0; bottom: 0; left: -50%; width: 200%;
  background: conic-gradient(from 35deg at 50% 50%, theme('colors.chrome.50'), theme('colors.chrome.300'),
    theme('colors.chrome.600'), theme('colors.chrome.100'), theme('colors.chrome.400'), theme('colors.chrome.50'));
  transform: translateX(var(--fx)); transition: transform var(--dur-base) var(--ease-out); }
.card:not([data-locked]) .foilMask { display: none; }
.plate { position: absolute; left: 6px; right: 6px; bottom: 6px; height: 24px; padding: 0 8px; display: flex; align-items: center; gap: 8px;
  border-radius: 0 0 var(--r-screen) var(--r-screen); background: rgb(var(--c-bezel) / var(--a-hud)); color: rgb(var(--c-text-on-screen)); }
.plateWide { display: none; }
.plateEnd { margin-left: auto; flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
@container (min-width: 280px) { .plateWide { display: flex; min-width: 0; align-items: baseline; gap: 8px; } }
@media (prefers-reduced-motion: reduce) { .body, .foilBand { transition: none; } }
```

**Plate** (`aria-hidden="true"`, one 24 px row, every text `text-fg-on-screen`):
- Left, only under `@container (min-width: 280px)` (`.plateWide`): `name` (`title-sm`, truncated with an ellipsis), then `handle` (`code`).
- Right (`.plateEnd`): `<Led tone={locked ? 'success' : 'off'} label={locked ? 'Identity locked' : 'Identity unlocked'} labelHidden />`, `REFS {count}/{max}` (`micro`, `.nums`), and, only under the same container query, `SHEET v{n}` (`micro`, `.plateWide`) when `sheetVersion` is set.
- Below 280 px (the 144 px and 192 px hosts of §10) the plate shows only the Led and `REFS {count}/{max}`.

**Pointer logic.**
- Tilt is enabled only when `matchMedia('(pointer: fine)').matches`, `e.pointerType !== 'touch'`, there is no reduced motion, no lock, and no descendant `:focus-visible`.
- `pointerenter` sets `data-tracking`.
- `pointermove` stores `nx`, `ny` (0–1 within the card) and schedules one rAF that writes:
  - `--ry: ${(nx − .5) × 12}deg`;
  - `--rx: ${(.5 − ny) × 12}deg`;
  - `--fx: ${(nx − .5) × 25}%` (the band is 200% wide, so this is ±25% of the card).
- `pointerleave` removes `data-tracking` and resets all three to their rest values, and the 200 ms transitions carry it home.

**Acceptance criteria**
- [ ] Fixture `[data-specimen="HoloCard"]` (locked). After a mouse move to (0.95w, 0.05h): `--ry` parses to ≤ 6 and `--rx` to ≤ 6 (absolute values), and `.body` computes a 3D matrix. After `mouse.move` off the card plus 250 ms: `transform` is `none` or the identity.
- [ ] With reduced motion, the lock, or `hasTouch: true`, the same move leaves `--rx`/`--ry` at `0deg`.
- [ ] The unlocked specimen's `.foilMask` computes `display: none`.
- [ ] Geometry (fixture, locked specimen at rest): its `.screen` box is inset exactly 6 px from `.body` on all four sides, and `.foilMask` computes a `clip-path` other than `none`. Take a screenshot of the `.screen` element, remove `data-locked` from the `[data-holo]` root, and take it again: the pixel at the portrait centre is identical in both (the foil never covers the portrait).
- [ ] Plate (fixture, locked specimen): `.plate` is 24 px tall, has `aria-hidden="true"`, and its bottom edge coincides with the screen's bottom edge. With the specimen root set to `width: 192px`, the plate's visible text is only `REFS {count}/{max}` (name, handle and `SHEET v{n}` compute `display: none`). At `width: 300px` the name and handle are visible. The Led inside the plate has its label sr-only (`labelHidden`), and the plate's text computes `color` equal to `rgb(var(--c-text-on-screen))`.
- [ ] No `canvas` and no WebGL context exist inside `[data-holo]`, and the portrait `img` computes `filter: none`. Over a 2 s hover, `document.getAnimations()` contains nothing that animates `filter` or `background`.
- [ ] `grep -rniE "airbnb|heart" dashboard/components/effects/HoloCard.tsx dashboard/components/effects/HoloCard.module.css` prints nothing.

#### 12.3.12 Amo hover button → `HoverClipButton` (`components/effects/HoverClipButton.tsx`)

| | |
|---|---|
| Purpose | "Play ident": hovering or focusing the button plays a 2 s MiniMax H3 Max clip of Coast (§13 `motion/coast-talent-nod`) in the card's screen, and leaving resets it. Everything puffy is in the video, so the button stays a plain, honest key |
| Technique | `<video muted playsInline loop preload="none" poster>` with WebM and MP4 `<source>`s, positioned by the caller. The first `play()` triggers the network load. The video is `opacity: 0` until `playing`, a cut, so the portrait below shows until real frames exist. The cut is seamless because the nod is encoded at 768×1024 from its quantised 384×512 frames upscaled ×2 (nearest), so every dither cell is 2×2 px and 4:2:0 chroma never bleeds across cells; its first frame is the portrait crop. As §13.6.6 ships it, the clip is `motion/coast-talent-nod.webm` and `.mp4`, both 768×1024, and its poster is the `-768` variant of `talent/coast-portrait` (`talent/coast-portrait-768.{avif,webp}`, shipped by §13.6.5; no new file) |
| Timings | Hover/focus → `play()`; leave/blur → `pause()` and `currentTime = 0`, a cut back to the portrait. Touch/click toggles play and stop |
| Colours | The button is `<Button variant="secondary" size="sm" icon={Play}>` (§7.3) |
| Reduced motion / air lock | **Never plays.** The component renders nothing: no button and no video. The caller reserves the slot, so nothing shifts |
| Perf | `preload="none"`, so zero bytes before the first hover. It is not a canvas and holds no slot. `play()` promises are caught silently |
| A11y | The button's accessible name is its visible `label`. The video is `aria-hidden` and decorative. Playback is ≤ 2 s loops and only while hovered or focused (WCAG 2.2.2) |
| Click | `onClick(e)` runs **first and synchronously**. Media calls come after it and are never awaited, so the click is never delayed |
| Used by | HoloCard, when `clip` is set and the §13.8 manifest marks `motion/coast-talent-nod` `generated: true`. Otherwise HoloCard omits it (never a fake likeness, D9). The fixture specimen is the exception: it renders HoverClipButton on its own with the committed, non-human test card `public/fixtures/testcard-320x180-2s.{webm,mp4}` (created in 5C, §11.0) and the poster `/brand/talent/coast-portrait-384.webp`, so its criteria run without `FAL_KEY` |

```ts
export type HoverClipButtonProps = {
  label: string                                   // e.g. 'Play ident'
  clip: { webm: string; mp4: string; poster: string }
  videoClassName?: string                         // HoloCard: 'absolute inset-0 h-full w-full object-cover'
  className?: string                              // the button (HoloCard: 'absolute right-2 bottom-8' above its plate; 'bottom-2' when plate is false)
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}
export function HoverClipButton(props: HoverClipButtonProps): JSX.Element | null   // renders a fragment: <video/> + <Button/>
```

**Acceptance criteria**
- [ ] In the fixture with the Playwright request log: no request to `testcard-320x180-2s.webm` or `testcard-320x180-2s.mp4` before the first hover. After hovering "Play ident", a request for `testcard-320x180-2s.webm` goes out and `video.paused === false` within 1500 ms. After mouse leave plus 100 ms, `video.paused === true`, `video.currentTime === 0`, and the video computes `opacity: 0`.
- [ ] Keyboard focus on the button plays the clip; `blur` stops it.
- [ ] Aborting the clip request (`page.route('**/fixtures/testcard-320x180-2s.*', r => r.abort())`) and then clicking still calls the `onClick` stub exactly once. The console holds no entries other than the aborted request's own resource error ("Failed to load resource", `net::ERR_FAILED`), and no page error. This is the only `page.route` in these criteria: the normal runs fetch the committed files.
- [ ] With reduced motion or under the lock, `getByRole('button', { name: 'Play ident' })` has count 0, and hovering the specimen produces no clip request.

#### 12.3.13 Apple's corners → `.sq` (squircle corners)

| | |
|---|---|
| Purpose | Continuous-curvature corners on chassis and panel materials, applied once in the system |
| Technique | Progressive enhancement: inside `@supports (corner-shape: squircle)`, `.sq` sets `corner-shape: squircle` and switches the four `rounded-{xs,sm,md,lg}` radii to their squircle values. The rules are written once, in `utilities.css` (§5.14); the tokens and squircle values are §5.7. Where unsupported, the plain `--r-*` radius applies |
| Timings / motion | None |
| Colours | None |
| Rules | Primitives pair `rounded-{xs\|sm\|md\|lg}` with `sq`. `.sq` is never used on screens (`rounded-screen`), lamps (`rounded-lamp`) or pills (`rounded-pill`), and `clip-path` is never used on a focusable element |
| Perf / a11y | CSS only. Focus rings (outlines) are unaffected |
| Used by | Panel, keys (Button secondary), Input/Textarea, Chip, Sheet, Dialog, Slate, HoloCard, chyrons (§7) |

**Acceptance criteria**
- [ ] `grep -c "@supports (corner-shape: squircle)" dashboard/app/styles/utilities.css` prints `1`, and the Apple's corners provenance comment is in the first 3 lines of that file.
- [ ] `grep -rnE "(\bsq\b[^\"']*rounded-(screen|lamp|pill))|(rounded-(screen|lamp|pill)[^\"']*\bsq\b)" dashboard/app dashboard/components` prints nothing.
- [ ] `grep -rn "clip-path" dashboard/components/ui dashboard/components/shell` prints nothing.

#### 12.3.14 Count Up → `CountUp` (`components/effects/CountUp.tsx`)

| | |
|---|---|
| Purpose | A tasteful data-arrival cue for one-shot totals: it counts up **once**, on first reveal. Every later change **snaps** |
| Technique | DOM text written through a ref from the shared ticker. The value eases with `easeOutCubic` and is written at 12 fps: a write happens only when `floor(elapsed × 12 / 1000)` changes |
| Timings | 600 ms from 0 to the value, ≤ 8 writes |
| Colours | Inherited |
| Reduced motion / air lock / hidden tab | Final value immediately (no run) |
| Start rule | The first commit in which `value` is a finite number runs a `useLayoutEffect`, before paint. It animates only if the element intersects the viewport at that moment and the document is visible. Otherwise the final value shows. It runs **once per mount**, never on polls, and **never on Live Control** |
| Perf | No React renders per frame; one ticker registration for ≤ 600 ms |
| A11y | At rest, `<span data-count-up class="nums">{format(value)}</span>`, so `textContent` is exactly the caller's formatted string. While running: `inline-grid` with the final value in `sr-only`, an `invisible` final-value copy that locks the width, and an `aria-hidden` counting span |
| Used by | Analytics KPI StatTiles (§11), the Clips `{n} clips` and Recordings `{n} recordings` totals (§11), and the Shotboard runtime `{n} beats · {s}s runtime` (two instances, §9) |

```ts
export type CountUpProps = {
  value: number | null | undefined
  format?: (n: number) => string        // default: (n) => Math.round(n).toLocaleString(); must reproduce the preserved copy exactly
  placeholder?: string                   // default '—' (the StatCard placeholder)
  className?: string
}
export const CountUp: React.ForwardRefExoticComponent<CountUpProps & React.RefAttributes<HTMLSpanElement>>
```

Callers pass a `format` that reproduces their strings exactly:
- Current viewers and Followers: `(n) => n.toLocaleString('en-US')` (§11.C, D6). This is a listed copy change: viewers go from `String` (`analytics/page.tsx:176`) to `1,284`, and followers from the default `toLocaleString()` (`:182`) to en-US grouping (§11.C.9).
- Clips and Recordings: `String` (`clips/page.tsx:21`, `recordings/page.tsx:37`).

**Acceptance criteria**
- [ ] Fixture `[data-specimen="CountUp"]` with value 1234: the recorded `textContent` sequence of the counting span has ≤ 8 distinct values and ends at '1,234' (en-US runner) within 600 ± 50 ms. Afterwards the root's `textContent === '1,234'`, and its width stayed within ± 0.5 px throughout.
- [ ] Setting the value to 1300 after the run changes the text to '1,300' in the next commit, with no intermediate values.
- [ ] With reduced motion, under the lock, or with the specimen scrolled out of view when the value arrives, the first painted frame already shows the final value.
- [ ] `grep -rn "CountUp" 'dashboard/app/admin/(live)/page.tsx' dashboard/components/DirectorPanel.tsx dashboard/components/DirectorPlayer.tsx dashboard/components/director dashboard/components/TwitchBroadcast.tsx dashboard/components/ScriptEditor.tsx dashboard/components/ChatSteerer.tsx dashboard/components/TrackManager.tsx` prints nothing.

#### 12.3.15 Shiny Text → the boot glint

| | |
|---|---|
| Purpose | The only shimmer in the system: one metallic sweep across the WZRD.tech wordmark, once per full POST, so at most once per 12 h per browser (§6.2.4). It echoes the chrome badge |
| Technique | CSS in `BOOT_CSS`: `#wzrd-boot-glint`, a 28° band 18% of the box width, `rgb(236 244 255 / .55)` (#ECF4FF at .55), `translateX(−120%) → translateX(120%)`, clipped by the wordmark's own alpha (`mask-image: url(/brand/wordmark/wzrdtech-640.webp)`). The rule text is `BOOT_CSS` (§6.2.13, owner) and the timeline §6.2.5; this card only summarises them |
| Timings | 340 ms with `--ease-spec` (`cubic-bezier(.45,0,.2,1)`), at t = 1020–1360 ms of the first-visit boot. It never repeats and is cut on repeat visits (the channel flip has no glint) |
| Reduced motion | No glint: the static card (§6.2.9) |
| Air lock | Not applicable (boot only) |
| Rules | It is never used on text, data, buttons, H1s or any React component |
| Used by | Boot (§6.2). It is §12.6 cut item 3: if cut, the wordmark fades out instead |

**Acceptance criteria**
- [ ] `grep -rnE "236 244 255|ECF4FF|ease-spec|ease-\[?spec" dashboard/app dashboard/components` lists only `dashboard/components/boot/bootScript.ts`, plus the token definitions in `dashboard/app/styles/tokens.css`.
- [ ] `grep -rniE "shiny|shimmer" dashboard/app dashboard/components --exclude-dir=boot --exclude=PixelCard.jsx | grep -v "Original implementation inspired by"` prints nothing, so no shimmer exists outside the boot. The vendored, untouched `PixelCard.jsx` (§12.4) is excluded because it names its own hover `shimmer()` method (`PixelCard.jsx:26-68`).
- [ ] The §6.16 boot timeline items pass. On a first visit (`?boot=1`), `document.getAnimations()` sampled at `performance.now() ≈ 1100` contains exactly one animation whose target is inside `#wzrd-boot-glint`, with `effect.getTiming().duration === 340`. On a repeat visit (flip), none.

### 12.4 Retained vendored components

| CSV row (line) | File(s) | Importers at 845147c | After the redesign | Edits | Lint |
|---|---|---|---|---|---|
| Morph Slider (147), https://www.reactbits.dev/components/morph-slider | `components/reactbits/MorphSlider.tsx`, `.css` | `TrackManager.tsx:9` (used `:130-143`), `AssetStudioVisualFixture.tsx:6` (`:45`) | The Live Control Audio dock artwork (§8.5.10): a **display-only** carousel with autoplay kept (D3, §0.4 BC-15), shown as a square at the Dock body's full height beside the track list, and the same single instance in the 'Expand artwork' Sheet at up to 480×480. Only one MorphSlider instance is ever mounted. Also the fixture (`#audio-library-visual-test`), which keeps autoplay. Both are loaded through `next/dynamic`, and both request `useEffectCanvasSlot('morph', 2, want)` (slot rules unchanged, §7.16) | **Autoplay kept** (D3): the fixture keeps `autoplay autoplayDelay={6}` (`AssetStudioVisualFixture.tsx:45`), and TrackManager keeps `autoplayDelay={6}` and passes `autoplay={autoplayOn}` (§8.5.10). **Display-only** (§0.4 BC-15): `onIndexChange` no longer writes the armed track. `onIndexChange={selectSliderTrack}` (`TrackManager.tsx:142`, `:91`) becomes `onIndexChange={setShownIndex}`, and a track is armed only through the 'Armed track' radiogroup or 'Arm this track' (§8.5.10). Apply the render-on-demand and autoplay-pause patch (§12.4.1). MorphSlider.css edits: §5.10 (1B). Every aria-label is unchanged | Must stay warning-free |
| Accordion Gallery (115), https://www.reactbits.dev/components/accordion-gallery | `AccordionGallery.jsx`, `.css` | `CharacterLibraryPage.tsx:7`, `LocationLibraryPage.tsx:7`, `AssetStudioVisualFixture.tsx:5`, `ShotCard.tsx:6`, `SceneSection.tsx:5`, `SceneGallery.tsx:5` | Removed from the Characters and Locations heroes (§10) and from the Shotboard pickers, where chips plus a popover grid replace it (§9). **Fixture only** (`#ds-accordion-gallery`). The fixture passes tokens through its CSS-variable props: `accentColor="rgb(var(--c-accent))" overlayColor="rgb(var(--c-screen))"` | None: the file is untouched. 'Image accordion gallery' (`role="list"`) is kept inside the file | Baseline warning `:229` remains |
| Chroma Grid (123), https://www.reactbits.dev/components/chroma-grid | `ChromaGrid.jsx`, `.css` | `shotboard/CharacterPanel.tsx:6` (`:70`) | Replaced by CastStrip on Shotboard (§9). **Fixture only** (`#ds-reactbits`). The fixture gains one specimen, because no fixture imports it today | None: untouched. Its `backdrop-filter` rules (`ChromaGrid.css:125-126`, `:158-159`) sit in the one file that the §15.3 G5 backdrop gate excepts, and it never reaches a product route | Baseline warning `:115` remains |
| Pixel Card (150), https://www.reactbits.dev/components/pixel-card | `PixelCard.jsx`, `.css` | `app/admin/clips/page.tsx:8`, `app/admin/recordings/page.tsx:8` | Replaced by MediaCard on Clips and Recordings (§11), which removes 100 hover canvases. `.pixel-card-latest` moves to MediaCard as a kept class hook, and the `.pixel-card*` shims stay permanently in `components.css` (§5.18). **Fixture only** (`#ds-reactbits`), with one specimen behind the 'Show PixelCard' switch: its canvas is an effect canvas and mounts only while slot `pixel-card` (priority 0) is granted (§12.1 rules 8–9) | None: untouched | — |

> Note: the bible says ChromaGrid is "kept for the fixture only", but at 845147c no fixture imports it (`AssetStudioVisualFixture.tsx:5-6` import only AccordionGallery and MorphSlider). Adding the ChromaGrid and PixelCard specimens keeps both files importable and under visual regression. They are not on the D1 dead-code list, so they stay on disk.

#### 12.4.1 MorphSlider render-on-demand and autoplay-pause patch (`components/reactbits/MorphSlider.tsx`)

The goal is that the slider draws **only** while a tween, a drag or a texture load is in progress, is invisible to the GPU otherwise, follows reduced motion live, never holds a stale context, and keeps its autoplay (D3) only while it is safe to move.

**Autoplay pause (D3, §0.4 BC-15).** Autoplay stays, and it pauses on the slide shown under five conditions: the air lock, reduced motion, the Dock collapsed, the Audio tab hidden, and the page hidden. The component owns three of them, so every caller gets them, the fixture included: the air lock (`useBroadcast(deriveLock)`, §7.17), reduced motion (the live `useReducedMotion()`, §7.2) and a hidden page (`usePageVisible()`, §7.2). The caller owns the other two and expresses them through the `autoplay` prop: TrackManager passes `autoplay={autoplayOn}`, which is false while the Dock is collapsed or the Audio tab is hidden (§8.5.10; its `autoplayOn` may repeat the component's three conditions, which is harmless). The existing hover pause (`:500`) stays. While any condition holds, no autoplay step starts. A tween already running finishes (`duration`, 1.1 s by default; at most 0.35 s under reduced motion). When every condition clears, the next step comes a full `autoplayDelay` later (6 s). Autoplay only changes the slide shown. It never arms a track, because no caller's `onIndexChange` writes the armed track (§8.5.10, §10.5.9).

MorphSlider.css edits (the backdrop-filter removal at `:39-40` and `:65-66`, and the violet retint): §5.10 (1B). They land before this patch; this section does not repeat them.

| Lines | Today | Change |
|---|---|---|
| 4 | React imports | Add `import { useReducedMotion } from '@/hooks/useReducedMotion'`, `import { usePageVisible } from '@/hooks/usePageVisible'` and `import { deriveLock, useBroadcast } from '@/lib/broadcast/store'` (all three land in 3A, §7.2, §7.17) |
| 188–205 | Engine fields | Add `private inView = true`, `private readonly io: IntersectionObserver`, and `private readonly onVisibility = () => { if (document.visibilityState === 'visible') this.requestRender() }` |
| 210 | `private readonly reducedMotion: boolean` | `private reducedMotion: boolean` (mutable) |
| 214 | Constructor body start | Move `this.loop = this.loop.bind(this)` (today `:257`) to be the **first** statement, because `resize()` now renders |
| 216 | `new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })` | `new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' })`. A full-screen quad (164×164 in the Dock, up to 480×480 in the 'Expand artwork' Sheet, §8.5.10) has no geometry edges, and `'high-performance'` can switch dual-GPU laptops to the discrete GPU while WebRTC is decoding |
| 253–258 | `ResizeObserver`, `resize()`, `loadTextures()`, `bind`, `requestAnimationFrame(this.loop)` | Keep the RO. Add `this.io = new IntersectionObserver(([e]) => { this.inView = e?.isIntersecting ?? true; if (this.inView) this.requestRender() }); this.io.observe(container)` and `document.addEventListener('visibilitychange', this.onVisibility)`. **Delete** the unconditional `requestAnimationFrame` (`:258`) |
| 267–281 | Texture `onLoad` | Append `this.requestRender()` |
| 288–292 | `resize()` | Append `this.renderer.render(this.scene, this.camera)`, a synchronous repaint because `setSize` cleared the buffer |
| 304–309 | Perpetual `loop` | Replace with the code below |
| 335–343 | `commit()` | Append `this.requestRender()`, which draws the committed texture once |
| 345–359, 361–376 | `move()`, `goTo()` | After the `gsap` tween starts, `this.requestRender()` |
| 384–390 | `beginDrag()` | After `this.dragging = true`, `this.requestRender()` |
| 422–427 | `endDrag()` snap-back `onComplete` | Add `this.requestRender()` after `this.animating = false` |
| 431–441 | `destroy()` | Add `this.io.disconnect()` and `document.removeEventListener('visibilitychange', this.onVisibility)`. After `this.renderer.dispose()`, add `this.renderer.getContext().getExtension('WEBGL_lose_context')?.loseContext()`, which is silent (see the facts table and §8). Never `forceContextLoss()` |
| 470–474 | Component state | Add `const reduced = useReducedMotion(); const reducedRef = useRef(reduced); reducedRef.current = reduced`, `const locked = useBroadcast(deriveLock)` and `const pageVisible = usePageVisible()` |
| 480 | `window.matchMedia('(prefers-reduced-motion: reduce)').matches` | `reducedRef.current` |
| after 492 | — | `useEffect(() => { engineRef.current?.setReducedMotion(reduced) }, [reduced])` and `useEffect(() => { engineRef.current?.invalidate() })` (no deps: option props such as `overlayColor` may have changed) |
| 499–503 | Autoplay timer: a `setTimeout` of `Math.max(autoplayDelay, 1) * 1000` ms that calls `engineRef.current?.move(1)`, skipped while `hovering` or with fewer than 2 items, re-armed on every `index` change | Kept (D3) and extended with the component's three pause conditions (the second code block below). The step, the delay, the hover pause and the re-arm on `index` are unchanged |
| 544–556 | Markup and aria | **Unchanged**: 'Coast audio artwork' (`:545`, `role="group"`, `aria-roledescription="carousel"`), the fallback `<img>` (`:546`), the caption `aria-live="polite"` (`:548`), 'Previous song artwork' and 'Next song artwork' (`:550-551`), the 'Song artwork' tablist (`:553`), and `` Show ${caption ?? `cover ${n}`} `` (`:554`) |

```ts
  private loop(time: number) {
    this.animationFrame = 0
    this.material.uniforms.uTime.value = time * 0.001
    if (!this.dragging && !this.animating) this.syncOptions()
    this.renderer.render(this.scene, this.camera)
    if (process.env.NODE_ENV !== 'production') {
      const w = (window.__wzrd ??= {}); w.frames = { ...w.frames, morph: (w.frames?.morph ?? 0) + 1 }
    }
    if (this.animating || this.dragging) this.requestRender()   // continue only while something moves
  }
  private requestRender() {
    if (this.animationFrame || !this.inView || document.visibilityState === 'hidden') return
    this.animationFrame = requestAnimationFrame(this.loop)
  }
  invalidate() { this.requestRender() }
  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced                                // move()/goTo() already cap tweens at 0.35 s when reduced
    this.material.uniforms.uReduce.value = reduced ? 1 : 0
    this.requestRender()
  }
```

The autoplay effect that replaces `:499-503` (`locked`, `reduced` and `pageVisible` come from the component-state row above):

```tsx
  useEffect(() => {
    // Autoplay pauses on the slide shown while hovered, under the air lock, under reduced motion and while the page is hidden.
    // The caller turns `autoplay` off for its own conditions. A running tween finishes; the next step waits a full delay.
    if (!autoplay || hovering || locked || reduced || !pageVisible || items.length < 2) return undefined
    const timeout = window.setTimeout(() => engineRef.current?.move(1), Math.max(autoplayDelay, 1) * 1000)
    return () => window.clearTimeout(timeout)
  }, [autoplay, autoplayDelay, hovering, locked, reduced, pageVisible, index, items.length])
```

`drift` animates only while frames are being drawn, so it freezes at rest. §8 passes `drift={0}`.

**Acceptance criteria**
- [ ] Autoplay is kept in both callers (D3): `grep -c "autoplayDelay={6}" dashboard/components/TrackManager.tsx` prints at least `1`, and so does `grep -c "autoplayDelay={6}" dashboard/components/AssetStudioVisualFixture.tsx`. Under `OVERRIDE D3: autoplay off` (§2.2), `grep -n "autoplay" dashboard/components/TrackManager.tsx dashboard/components/AssetStudioVisualFixture.tsx` prints nothing instead. The display-only wiring is not a §12.4.1 check: §8.10 B12 and B33 check TrackManager's, and the §10.10 "Fixture display-only arming" item checks the fixture's.
- [ ] The component side of the pause is in the file: `grep -c "useBroadcast(deriveLock)" dashboard/components/reactbits/MorphSlider.tsx` prints `1`, `grep -c "usePageVisible()" dashboard/components/reactbits/MorphSlider.tsx` prints `1`, and `grep -c "window.matchMedia('(prefers-reduced-motion: reduce)')" dashboard/components/reactbits/MorphSlider.tsx` prints `0`.
- [ ] The §5.10 MorphSlider.css "Done when" grep (1B) still prints nothing; in particular `grep -n "backdrop-filter" dashboard/components/reactbits/MorphSlider.css` prints nothing.
- [ ] Autoplay pause (fixture, no reduced-motion emulation). Scroll `[data-specimen="MorphSlider"]` into view, wait until it contains a `canvas` (≤ 5000 ms), and move the pointer to (0, 0). Let `sel` be the name of the selected tab of its 'Song artwork' tablist (`[role="tab"][aria-selected="true"]`).
  - `sel` changes within 7000 ms (autoplay kept).
  - Hidden page: after `Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))`, `sel` stays the same for 13 000 ms (two 6 s periods). After the same two calls with `'visible'`, `sel` changes within 7000 ms.
  - Hover: with the pointer over the specimen's `.morph-slider`, `sel` stays the same for 13 000 ms.
  - The air lock and reduced motion: the §6.16 MorphSlider autoplay item ('Simulate recording' in `#ds-simulator`, and `reducedMotion: 'reduce'`) passes.
- [ ] Fixture `[data-specimen="MorphSlider"]` with 4 covers, after the textures load, with the pointer over the specimen's `.morph-slider` (the hover pause holds autoplay, so no autoplay step lands inside a measurement):
  - `__wzrd.frames.morph` does not change over 2000 ms idle;
  - clicking 'Next song artwork' increases it, and 1500 ms later it is stable again;
  - scrolling the specimen out of view during a tween stops it from increasing.
- [ ] `document.querySelector('.morph-slider-canvas').getContext('webgl2').getContextAttributes().powerPreference === 'low-power'`.
- [ ] Toggling the specimen's 'Artwork slot' switch 20 times produces zero console messages (no "Too many active WebGL contexts", no "Context Lost").
- [ ] With `emulateMedia({ reducedMotion: 'reduce' })` set **after** mount, the next 'Next song artwork' tween finishes in ≤ 400 ms (the live hook, not the value read at mount).
- [ ] `grep -F` finds each of `aria-label="Coast audio artwork"`, `aria-label="Previous song artwork"`, `aria-label="Next song artwork"` and `aria-label="Song artwork"` in `dashboard/components/reactbits/MorphSlider.tsx`, and `aria-label="Coast originals artwork carousel"` in `dashboard/components/TrackManager.tsx`.

### 12.5 Banned list and full CSV coverage

All 190 rows are accounted for: **15 picks + 4 retained + 171 banned**.

#### 12.5.1 Banned groups

"Banned" means: do not install, port or imitate. A group reason applies to every member.

| Group | Rows | Members | Why |
|---|---|---|---|
| **B1** Second backgrounds | 56 | Every Background except Dither: Acid Squares, Aero Shards, Aurora, Balatro, Ballpit, Beams, Color Bends, CRT Warp, Dark Veil, Dot Field, Dot Grid, Evil Eye, Faulty Terminal, Ferrofluid, Floating Lines, Galaxy, Ghost Fibers, Gradient Blinds, Gradient Waves, Grainient, Grid Distortion, Grid Motion, Grid Scan, Hyperspeed, Iridescence, Letter Glitch, Light Pillar, Light Rays, Light Tunnel, Lightfall, Lightning, Line Waves, Liquid Chrome, Liquid Ether, Molten Metal, Orb, Particles, Pixel Blast, Pixel Snow, Plasma, Plasma Wave, Prism, Prismatic Burst, Radar, Ripple Grid, Scanner, Shape Grid, Shape Waves, Side Rays, Silk, Sliced Waves, Soft Aurora, Threads, Topography, Waves, Web Threads | A second full-screen field competes with the carrier, which is the system's grammar. It also costs GPU fill while DirectorPlayer decodes WebRTC and runs two MediaRecorders. Radar, Scanner and Faulty Terminal are extra acquisition metaphors, and SymbolRaster already carries acquisition |
| **B2** Cursor effects | 16 | Blob Cursor, Click Spark, Crosshair, Cursor Grid, Elastic Mesh, Ghost Cursor, Glow Cursor, Image Trail, Magnet, Magnet Lines, Pixel Trail, Ribbons, Splash Cursor, Swarm Cursor, Target Cursor, Text Cursor | Trails, lag and magnetism reduce pointing accuracy on small live controls ('Capture frame', 'Move shot earlier'), and several create full-viewport canvases |
| **B3** 3D, R3F, physics and WebGL | 23 | Antigravity, Cubes, Meta Balls, Orbit Images, Ripple Distortion, Lanyard, Fluid Glass, Model Viewer, Dome Gallery, Circular Gallery, Flying Posters, Infinite Spiral, Infinite Menu, Depth Carousel, Drift Wall, Carousel, Stack, Card Swap, Bounce Cards, Specular Button, Metallic Paint, ASCII Text, Warp Text | Each needs its own WebGL context, or a library that is not installed and not allowed (R3F, whose reconciler conflicts with the bundled React per `Dither.jsx:1-4`, or `ogl`, rapier, `matter-js`). Orbiting or perspective layouts distort the images operators compare for identity drift |
| **B4** Blur, glass and glow | 12 | Glass Surface, Glass Icons, Gradual Blur, Shape Blur, Dia Browser's gradient, Chromatic glow, Border Glow, Star Border, Electric Border, Laser Flow, Magic Rings, Strands | `backdrop-filter` re-blurs the animating carrier every frame and is grep-gated to zero. Soft glows and animated borders break "no smooth gradients, blur or glow", and continuous border motion around program pulls the eye off the picture. Border Glow is also pointer-reactive |
| **B5** Hover theatrics on data | 11 | Magic Bento, Spotlight Card, Tilted Card, Glare Hover, Decay Card, Profile Card, Reflective Card, Sticker Peel, Folder, Scroll Stack, Scroll Expand | Tilt, glare, spotlight and peel on data tiles turn a monitoring grid into a toy and move targets under the pointer. Reflective Card also triggers a camera-permission prompt during live shows |
| **B6** Flicker, pointer-reactive or extra text effects | 25 | Glitch Text, Fuzzy Text, Scrambled Text, Shuffle, Text Pressure, Variable Proximity, True Focus, Echo Text, Falling Text, Fold Text, Depth Text, Particle Text, Stroke Text, Gradient Text, Masked Heading, Blur Text, Split Text, Scroll Float, Scroll Reveal, Text Type, The typer, Kinetic typography, Ransom note, Split Flap Text, Counter | State words resolve once through DecryptedText and digits snap. Flickering, rolling, pointer-reactive or per-letter text is illegible at a glance in a control room and raises WCAG 2.2.2 and 2.3.1 risk. The system allows exactly one text effect |
| **B7** Moving hit targets and marquees | 15 | Dock, Gooey Nav, Staggered Menu, Bubble Menu, Card Nav, Flowing Menu, Line Sidebar, Option Wheel, Curved Input, Logo Loop, Scroll Velocity, Curved Loop, Text Loop, Rotating Text, Circular Text | Navigation needs fixed, scannable positions, and moving or looping text cannot be read at a glance. Logo strips also raise trademark and endorsement questions |
| **B8** Replaced by a primitive or out of scope | 13 | Fade Content, Animated Content, Fade motion, Ghosty reveal, Halftone Reveal, Noise, Midjourney Medical's ASCII, Liquid UI, Pixel brushes, The art of color depth, Realistic emboss, Masonry, Elastic Slider | Fades and soft reveals are replaced by the 4-step PxResolve. Grain muddies the 4-level palette. Halftone Reveal hides content until the pointer finds it. The rest either have no use here (Pixel brushes, Liquid UI, the ASCII loader, colour depth) or are replaced by something better: `--shadow-key` for Realistic emboss, uniform grids for Masonry, and the native range input, which keeps its semantics, for Elastic Slider |

#### 12.5.2 Never

- Never reinstall Dither from the registry.
- Never add `@react-three/*`, `ogl`, `postprocessing`, `mathjs`, `cmdk`, `matter-js`, `meshline`, `lenis` or `@use-gesture/react`.
- Never edit `components/dither-kit/*` (hash-locked by `dashboard/dither-kit.json`; wrap and import instead).
- Never call `renderer.forceContextLoss()`.
- Never create a WebGL context outside `Dither.jsx` and `MorphSlider.tsx`.

#### 12.5.3 Coverage table (all 190 CSV rows, in CSV order, grouped by category)

| CSV line | Category | Name | Decision |
|---|---|---|---|
| 2 | Arlan Vault (no category) | Amo hover button | PICK 12 · HoverClipButton |
| 3 | Arlan Vault (no category) | Apple's corners | PICK 13 · .sq |
| 4 | Arlan Vault (no category) | Arcade pixel | PICK 4 · PixelFace |
| 5 | Arlan Vault (no category) | Chromatic glow | BANNED · B4 |
| 6 | Arlan Vault (no category) | Dia Browser's gradient | BANNED · B4 |
| 7 | Arlan Vault (no category) | Fade motion | BANNED · B8 |
| 8 | Arlan Vault (no category) | Figma vector editor | PICK 9 · SelectionBrackets |
| 9 | Arlan Vault (no category) | Ghosty reveal | BANNED · B8 |
| 10 | Arlan Vault (no category) | Holo | PICK 11 · HoloCard |
| 11 | Arlan Vault (no category) | Kinetic typography | BANNED · B6 |
| 12 | Arlan Vault (no category) | Liquid UI | BANNED · B8 |
| 13 | Arlan Vault (no category) | Midjourney Medical's ASCII | BANNED · B8 |
| 14 | Arlan Vault (no category) | Pixel brushes | BANNED · B8 |
| 15 | Arlan Vault (no category) | Ransom note | BANNED · B6 |
| 16 | Arlan Vault (no category) | Realistic emboss | BANNED · B8 (`--shadow-key` covers it) |
| 17 | Arlan Vault (no category) | Symbols effect | PICK 10 · SymbolRaster |
| 18 | Arlan Vault (no category) | The art of color depth | BANNED · B8 |
| 19 | Arlan Vault (no category) | The typer | BANNED · B6 |
| 20 | Animations | Animated Content | BANNED · B8 |
| 21 | Animations | Antigravity | BANNED · B3 |
| 22 | Animations | Blob Cursor | BANNED · B2 |
| 23 | Animations | Click Spark | BANNED · B2 |
| 24 | Animations | Crosshair | BANNED · B2 |
| 25 | Animations | Cubes | BANNED · B3 |
| 26 | Animations | Cursor Grid | BANNED · B2 |
| 27 | Animations | Elastic Mesh | BANNED · B2 |
| 28 | Animations | Electric Border | BANNED · B4 |
| 29 | Animations | Fade Content | BANNED · B8 |
| 30 | Animations | Ghost Cursor | BANNED · B2 |
| 31 | Animations | Glare Hover | BANNED · B5 |
| 32 | Animations | Glow Cursor | BANNED · B2 |
| 33 | Animations | Gradual Blur | BANNED · B4 (`backdrop-filter`) |
| 34 | Animations | Halftone Reveal | BANNED · B8 (content hidden until pointer) |
| 35 | Animations | Image Trail | BANNED · B2 |
| 36 | Animations | Laser Flow | BANNED · B4 |
| 37 | Animations | Logo Loop | BANNED · B7 |
| 38 | Animations | Magic Rings | BANNED · B4 |
| 39 | Animations | Magnet | BANNED · B2 |
| 40 | Animations | Magnet Lines | BANNED · B2 |
| 41 | Animations | Meta Balls | BANNED · B3 |
| 42 | Animations | Metallic Paint | BANNED · B3 |
| 43 | Animations | Noise | BANNED · B8 (grain muddies the 4-level palette) |
| 44 | Animations | Orbit Images | BANNED · B3 |
| 45 | Animations | Pixel Swap | PICK 2 · boot + SymbolRaster clear |
| 46 | Animations | Pixel Trail | BANNED · B2 |
| 47 | Animations | Pixel Transition | PICK 3 · PxResolve |
| 48 | Animations | Ribbons | BANNED · B2 |
| 49 | Animations | Ripple Distortion | BANNED · B3 |
| 50 | Animations | Scroll Expand | BANNED · B5 |
| 51 | Animations | Shape Blur | BANNED · B4 |
| 52 | Animations | Splash Cursor | BANNED · B2 |
| 53 | Animations | Star Border | BANNED · B4 |
| 54 | Animations | Sticker Peel | BANNED · B5 |
| 55 | Animations | Strands | BANNED · B4 |
| 56 | Animations | Swarm Cursor | BANNED · B2 |
| 57 | Animations | Target Cursor | BANNED · B2 |
| 58 | Backgrounds | Acid Squares | BANNED · B1 |
| 59 | Backgrounds | Aero Shards | BANNED · B1 |
| 60 | Backgrounds | Aurora | BANNED · B1 |
| 61 | Backgrounds | Balatro | BANNED · B1 |
| 62 | Backgrounds | Ballpit | BANNED · B1 |
| 63 | Backgrounds | Beams | BANNED · B1 |
| 64 | Backgrounds | Color Bends | BANNED · B1 |
| 65 | Backgrounds | CRT Warp | BANNED · B1 |
| 66 | Backgrounds | Dark Veil | BANNED · B1 |
| 67 | Backgrounds | Dither | PICK 1 · Dither.jsx (hardened) |
| 68 | Backgrounds | Dot Field | BANNED · B1 |
| 69 | Backgrounds | Dot Grid | BANNED · B1 |
| 70 | Backgrounds | Evil Eye | BANNED · B1 |
| 71 | Backgrounds | Faulty Terminal | BANNED · B1 (SymbolRaster carries acquisition) |
| 72 | Backgrounds | Ferrofluid | BANNED · B1 |
| 73 | Backgrounds | Floating Lines | BANNED · B1 |
| 74 | Backgrounds | Galaxy | BANNED · B1 |
| 75 | Backgrounds | Ghost Fibers | BANNED · B1 |
| 76 | Backgrounds | Gradient Blinds | BANNED · B1 |
| 77 | Backgrounds | Gradient Waves | BANNED · B1 |
| 78 | Backgrounds | Grainient | BANNED · B1 |
| 79 | Backgrounds | Grid Distortion | BANNED · B1 |
| 80 | Backgrounds | Grid Motion | BANNED · B1 |
| 81 | Backgrounds | Grid Scan | BANNED · B1 |
| 82 | Backgrounds | Hyperspeed | BANNED · B1 |
| 83 | Backgrounds | Iridescence | BANNED · B1 |
| 84 | Backgrounds | Letter Glitch | BANNED · B1 |
| 85 | Backgrounds | Light Pillar | BANNED · B1 |
| 86 | Backgrounds | Light Rays | BANNED · B1 |
| 87 | Backgrounds | Light Tunnel | BANNED · B1 |
| 88 | Backgrounds | Lightfall | BANNED · B1 |
| 89 | Backgrounds | Lightning | BANNED · B1 |
| 90 | Backgrounds | Line Waves | BANNED · B1 |
| 91 | Backgrounds | Liquid Chrome | BANNED · B1 |
| 92 | Backgrounds | Liquid Ether | BANNED · B1 |
| 93 | Backgrounds | Molten Metal | BANNED · B1 |
| 94 | Backgrounds | Orb | BANNED · B1 |
| 95 | Backgrounds | Particles | BANNED · B1 |
| 96 | Backgrounds | Pixel Blast | BANNED · B1 |
| 97 | Backgrounds | Pixel Snow | BANNED · B1 |
| 98 | Backgrounds | Plasma | BANNED · B1 |
| 99 | Backgrounds | Plasma Wave | BANNED · B1 |
| 100 | Backgrounds | Prism | BANNED · B1 |
| 101 | Backgrounds | Prismatic Burst | BANNED · B1 |
| 102 | Backgrounds | Radar | BANNED · B1 (SymbolRaster carries acquisition) |
| 103 | Backgrounds | Ripple Grid | BANNED · B1 |
| 104 | Backgrounds | Scanner | BANNED · B1 (SymbolRaster carries acquisition) |
| 105 | Backgrounds | Shape Grid | BANNED · B1 |
| 106 | Backgrounds | Shape Waves | BANNED · B1 |
| 107 | Backgrounds | Side Rays | BANNED · B1 |
| 108 | Backgrounds | Silk | BANNED · B1 |
| 109 | Backgrounds | Sliced Waves | BANNED · B1 |
| 110 | Backgrounds | Soft Aurora | BANNED · B1 |
| 111 | Backgrounds | Threads | BANNED · B1 |
| 112 | Backgrounds | Topography | BANNED · B1 |
| 113 | Backgrounds | Waves | BANNED · B1 |
| 114 | Backgrounds | Web Threads | BANNED · B1 |
| 115 | Components | Accordion Gallery | RETAINED · AccordionGallery (fixture only) |
| 116 | Components | Animated List | PICK 7 · StreamList |
| 117 | Components | Border Glow | BANNED · B4 (pointer-reactive glow) |
| 118 | Components | Bounce Cards | BANNED · B3 |
| 119 | Components | Bubble Menu | BANNED · B7 |
| 120 | Components | Card Nav | BANNED · B7 |
| 121 | Components | Card Swap | BANNED · B3 |
| 122 | Components | Carousel | BANNED · B3 |
| 123 | Components | Chroma Grid | RETAINED · ChromaGrid (fixture only) |
| 124 | Components | Circular Gallery | BANNED · B3 |
| 125 | Components | Counter | BANNED · B6 (digits snap) |
| 126 | Components | Curved Input | BANNED · B7 |
| 127 | Components | Decay Card | BANNED · B5 |
| 128 | Components | Depth Carousel | BANNED · B3 |
| 129 | Components | Dock | BANNED · B7 |
| 130 | Components | Dome Gallery | BANNED · B3 |
| 131 | Components | Drift Wall | BANNED · B3 |
| 132 | Components | Elastic Slider | BANNED · B8 (loses native range) |
| 133 | Components | Flowing Menu | BANNED · B7 |
| 134 | Components | Fluid Glass | BANNED · B3 |
| 135 | Components | Flying Posters | BANNED · B3 |
| 136 | Components | Folder | BANNED · B5 |
| 137 | Components | Glass Icons | BANNED · B4 |
| 138 | Components | Glass Surface | BANNED · B4 (`backdrop-filter`) |
| 139 | Components | Gooey Nav | BANNED · B7 |
| 140 | Components | Infinite Menu | BANNED · B3 |
| 141 | Components | Infinite Spiral | BANNED · B3 |
| 142 | Components | Lanyard | BANNED · B3 |
| 143 | Components | Line Sidebar | BANNED · B7 |
| 144 | Components | Magic Bento | BANNED · B5 |
| 145 | Components | Masonry | BANNED · B8 (uniform grids) |
| 146 | Components | Model Viewer | BANNED · B3 |
| 147 | Components | Morph Slider | RETAINED · MorphSlider (patched) |
| 148 | Components | Option Wheel | BANNED · B7 |
| 149 | Components | Pill Nav | PICK 8 · AppNav indicator |
| 150 | Components | Pixel Card | RETAINED · PixelCard (fixture only) |
| 151 | Components | Profile Card | BANNED · B5 |
| 152 | Components | Reflective Card | BANNED · B5 (webcam prompt) |
| 153 | Components | Scroll Stack | BANNED · B5 |
| 154 | Components | Specular Button | BANNED · B3 |
| 155 | Components | Spotlight Card | BANNED · B5 |
| 156 | Components | Stack | BANNED · B3 |
| 157 | Components | Staggered Menu | BANNED · B7 |
| 158 | Components | Stepper | PICK 6 · StageTrack |
| 159 | Components | Tilted Card | BANNED · B5 |
| 160 | Text Animations | ASCII Text | BANNED · B3 (WebGL) |
| 161 | Text Animations | Blur Text | BANNED · B6 |
| 162 | Text Animations | Circular Text | BANNED · B7 |
| 163 | Text Animations | Count Up | PICK 14 · CountUp |
| 164 | Text Animations | Curved Loop | BANNED · B7 |
| 165 | Text Animations | Decrypted Text | PICK 5 · DecryptedText |
| 166 | Text Animations | Depth Text | BANNED · B6 |
| 167 | Text Animations | Echo Text | BANNED · B6 |
| 168 | Text Animations | Falling Text | BANNED · B6 |
| 169 | Text Animations | Fold Text | BANNED · B6 |
| 170 | Text Animations | Fuzzy Text | BANNED · B6 |
| 171 | Text Animations | Glitch Text | BANNED · B6 |
| 172 | Text Animations | Gradient Text | BANNED · B6 |
| 173 | Text Animations | Masked Heading | BANNED · B6 |
| 174 | Text Animations | Particle Text | BANNED · B6 |
| 175 | Text Animations | Rotating Text | BANNED · B7 |
| 176 | Text Animations | Scrambled Text | BANNED · B6 |
| 177 | Text Animations | Scroll Float | BANNED · B6 |
| 178 | Text Animations | Scroll Reveal | BANNED · B6 |
| 179 | Text Animations | Scroll Velocity | BANNED · B7 |
| 180 | Text Animations | Shiny Text | PICK 15 · boot glint |
| 181 | Text Animations | Shuffle | BANNED · B6 |
| 182 | Text Animations | Split Flap Text | BANNED · B6 (state words resolve) |
| 183 | Text Animations | Split Text | BANNED · B6 |
| 184 | Text Animations | Stroke Text | BANNED · B6 |
| 185 | Text Animations | Text Cursor | BANNED · B2 |
| 186 | Text Animations | Text Loop | BANNED · B7 |
| 187 | Text Animations | Text Pressure | BANNED · B6 |
| 188 | Text Animations | Text Type | BANNED · B6 |
| 189 | Text Animations | True Focus | BANNED · B6 |
| 190 | Text Animations | Variable Proximity | BANNED · B6 |
| 191 | Text Animations | Warp Text | BANNED · B3 (WebGL) |

### 12.6 Cut order (effects only; the global list is §17)

1. HoverClipButton and the `motion/coast-talent-nod` clip. HoloCard renders no button.
2. HoloCard tilt and foil. It renders static, with `locked` still shown by the LED.
3. The boot glint (Shiny Text) with the FLIP. The wordmark fades out instead (§6.2.5).
4. CountUp. Values render final; the component stays as a pass-through so call sites do not change.
5. `.sq` squircles. The plain `--r-*` radii remain.

**Never cut:** Dither hardening (§12.3.1), PxResolve, the MorphSlider render-on-demand and autoplay-pause patch (§12.4.1; the display-only carousel it serves is §8.5.10), StageTrack in the connect plate, and PixelFace wherever a slate kicker or md lamp needs it (the slate family is never-cut).

### 12.7 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`. No command mixes both forms. Run modes (dev, fixture, prod) are §1.6's, as restated in §12.3.

- [ ] **Provenance.** Every file in §12.1 rule 5 carries its exact line(s) within its first 3 lines: script 12.7-A below prints nothing.
- [ ] **No registry installs.**
  - `git diff 845147c -- dashboard/components.json` prints nothing.
  - `grep -rnE "reactbits\.dev/r/|jsrepo|@react-bits/|shadcn@" dashboard --include=*.json --include=*.ts --include=*.tsx --include=*.js --include=*.jsx --include=*.mjs --exclude-dir=node_modules` prints nothing.
  - `head -4 dashboard/components/reactbits/Dither.jsx` equals `git show 845147c:dashboard/components/reactbits/Dither.jsx | head -4`.
- [ ] **No new runtime dependencies** (D8). From the repository root, this exits 0: `node -e "const a=JSON.parse(require('child_process').execSync('git show 845147c:dashboard/package.json'));const b=require('./dashboard/package.json');const n=Object.keys(b.dependencies).filter(k=>!(k in a.dependencies));if(n.length){console.error(n);process.exit(1)}"`.
- [ ] **Import confinement** (from `dashboard/`):
  - `grep -rlE "from ['\"]three['\"]" app components` prints exactly `components/reactbits/Dither.jsx` and `components/reactbits/MorphSlider.tsx`.
  - `grep -rlE "from ['\"]gsap['\"]" app components` prints only files under `components/reactbits/`.
  - `motion/react` (§12.1 rule 4): the output of `grep -rlE "from ['\"]motion/react['\"]" app components --exclude-dir=dither-kit` contains `components/shell/AppNav.tsx` and is a subset of {`components/shell/AppNav.tsx`, `components/shotboard/SceneRail.tsx`, `components/shotboard/SceneTrack.tsx`}. Script 12.7-C below exits 0.
  - `grep -rnE "from ['\"](ogl|@react-three/|postprocessing|mathjs|cmdk|matter-js|meshline|lenis|@use-gesture/)" app components` prints nothing.
- [ ] **WebGL creators** (from `dashboard/`): `grep -rlE "WebGLRenderer|getContext\(['\"](webgl2?|experimental-webgl)['\"]" app components --exclude-dir=dither-kit` prints exactly `components/reactbits/Dither.jsx` and `components/reactbits/MorphSlider.tsx`. `grep -rn "forceContextLoss" app components` prints nothing.
- [ ] **Code splitting** (from `dashboard/`): `grep -rnP "^import (?!type\b).*\b(SymbolRaster|HoloCard|HoverClipButton|MorphSlider)\b.*from" app components --exclude-dir=effects --exclude-dir=reactbits` prints nothing, and `grep -rn "dynamic(" components/director components/TrackManager.tsx components/AssetStudioVisualFixture.tsx` finds the SymbolRaster and MorphSlider imports.
- [ ] **Generic names.** `grep -rniE "airbnb|figma|apple|dia browser|midjourney|\bamo\b" dashboard/components/effects dashboard/components/generation dashboard/components/shell dashboard/components/boot dashboard/app/styles | grep -v "Original implementation inspired by"` prints nothing.
- [ ] **Fixture** (dev at `/admin/visual-test?noboot`). `#design-system-visual-test` and `#audio-library-visual-test` together contain exactly these `data-specimen` values, each once and in the §12.1 rule 9 host: PxResolve, PixelFace, DecryptedText, CountUp, SelectionBrackets, SymbolRaster, HoloCard, HoverClipButton, StreamList, StageTrack, AccordionGallery, ChromaGrid, PixelCard, MorphSlider. Interacting with every control in the §12.1 rule 9 controls table produces zero console entries beyond the §1.6 allowed list, and `window.__wzrd.slots.owner` is never more than one id.
- [ ] **Canvas budget.** The §15 canvas and slot audit passes on all 8 routes: one WebGL context (the carrier), at most one effect canvas, and still one context after 10 theme toggles.
- [ ] **Reduced motion** (dev). With `emulateMedia({ reducedMotion: 'reduce' })` on every route, then 1000 ms: `__wzrd.frames.carrier`, `.morph` and `.raster` do not change over 2000 ms, and the §6.16 "no infinite animations" check passes.
- [ ] **Per-pick criteria.** Every checklist in §12.3.1–§12.3.15 and §12.4.1 passes.
- [ ] **CSV coverage.** Script 12.7-B below prints `ok`: the §12.5.3 table has exactly the 190 CSV names, 15 picks, 4 retained and 171 banned.

**Script 12.7-A (provenance headers; run from `dashboard/`):**

```bash
while IFS='|' read -r f n u; do head -3 "$f" | grep -qF "Original implementation inspired by \"$n\" ($u). No upstream source copied." || echo "MISSING $f :: $n"; done <<'EOF'
components/boot/bootScript.ts|Pixel Swap|https://www.reactbits.dev/animations/pixel-swap
components/boot/bootScript.ts|Shiny Text|https://www.reactbits.dev/text-animations/shiny-text
components/boot/boot.src.js|Pixel Swap|https://www.reactbits.dev/animations/pixel-swap
components/boot/boot.src.js|Shiny Text|https://www.reactbits.dev/text-animations/shiny-text
components/effects/SymbolRaster.tsx|Symbols effect|https://arlan.me/vault/sandbox
components/effects/SymbolRaster.tsx|Pixel Swap|https://www.reactbits.dev/animations/pixel-swap
components/effects/PxResolve.tsx|Pixel Transition|https://www.reactbits.dev/animations/pixel-transition
app/styles/utilities.css|Pixel Transition|https://www.reactbits.dev/animations/pixel-transition
app/styles/utilities.css|Apple's corners|https://arlan.me/vault/squircle
components/effects/PixelFace.tsx|Arcade pixel|https://arlan.me/vault/arcade-pixel
components/effects/px5x7.ts|Arcade pixel|https://arlan.me/vault/arcade-pixel
components/effects/DecryptedText.tsx|Decrypted Text|https://www.reactbits.dev/text-animations/decrypted-text
components/generation/StageTrack.tsx|Stepper|https://www.reactbits.dev/components/stepper
components/effects/StreamList.tsx|Animated List|https://www.reactbits.dev/components/animated-list
components/shell/AppNav.tsx|Pill Nav|https://www.reactbits.dev/components/pill-nav
components/effects/SelectionBrackets.tsx|Figma vector editor|https://arlan.me/vault/vector-editor
components/effects/SelectionBrackets.module.css|Figma vector editor|https://arlan.me/vault/vector-editor
components/effects/HoloCard.tsx|Holo|https://arlan.me/vault/holo
components/effects/HoloCard.module.css|Holo|https://arlan.me/vault/holo
components/effects/HoverClipButton.tsx|Amo hover button|https://arlan.me/vault/amo
components/effects/CountUp.tsx|Count Up|https://www.reactbits.dev/text-animations/count-up
EOF
```

**Script 12.7-B (CSV coverage; run from the repository root after `docs/redesign/spec/12-effects.md` is committed):**

```bash
python3 - <<'PY'
import csv, re
names = [r['name'] for r in csv.DictReader(open('docs/redesign/component-prompts.csv', encoding='utf-8'))]
sec = open('docs/redesign/spec/12-effects.md', encoding='utf-8').read().split('#### 12.5.3')[1].split('\n### ')[0]
rows = [l.split('|') for l in sec.splitlines() if re.match(r'^\| \d+ \|', l)]
got = [r[3].strip() for r in rows]
assert len(got) == 190 and sorted(got) == sorted(names), (set(names) - set(got), set(got) - set(names))
kinds = [r[4].strip().split(' ')[0] for r in rows]
assert (kinds.count('PICK'), kinds.count('RETAINED'), kinds.count('BANNED')) == (15, 4, 171), kinds
print('ok')
PY
```

**Script 12.7-C (`motion/react` confinement; run from `dashboard/`; exits 0):**

```bash
out=$(grep -rlE "from ['\"]motion/react['\"]" app components --exclude-dir=dither-kit)
echo "$out" | grep -qx 'components/shell/AppNav.tsx' && ! echo "$out" | grep -vxE 'components/(shell/AppNav|shotboard/SceneRail|shotboard/SceneTrack)\.tsx'
```
