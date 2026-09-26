> **Spec chapter §6 — Motion system and signature moments (incl. the loading animation).** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 6. Motion system and signature moments

This section owns every animation, loader, transition and signal-driven state change in the admin. Token names (`--dur-*`, `--ease-*`, `--steps-*`, `--bayer-4-NN`, `--c-*`, `--a-*`) are defined in §5. Primitive APIs are in §7, effect components in §12 and brand files in §13. Line references are **as of 845147c**.

Verified facts this section relies on:

| Fact | Evidence |
|---|---|
| `next/link` in Next 15.5.2 exports `useLinkStatus(): { pending: boolean }` and the `onNavigate({ preventDefault })` prop. The App Router aliases `next/link` to `next/dist/client/app-dir/link` | `node_modules/next/dist/client/app-dir/link.d.ts:188` and `:171`; `node_modules/next/dist/build/create-compiler-aliases.js:227` |
| `motion` 13.2.0 exports `LayoutGroup`, `useReducedMotion`, `AnimatePresence` and `Reorder` from `motion/react` | `node -e "require('motion/react')"` |
| `@fal-ai/client` 1.11.0-alpha.3 `subscribe` accepts `onQueueUpdate(status)` and `logs`. `status` is `IN_QUEUE` (with `queue_position`), `IN_PROGRESS` (with `logs`) or `COMPLETED` | `node_modules/@fal-ai/client/src/queue.d.ts:45,50`; `src/types/common.d.ts:77-90` |
| The App Router renders with the React 19.2 canary that Next vendors, not the installed 18.3.1. If a script removes a server-rendered node before hydration, React reports a hydration mismatch, so the boot's DOM must live inside a `dangerouslySetInnerHTML` host (§6.2.1) | `node_modules/next/dist/compiled/react/cjs/react.production.js` version string `19.2.0-canary-0bdb9206-20250818`; `node_modules/react/package.json` `18.3.1` |
| The carrier's first `renderer.render` happens synchronously in the first `tick()` call. On WebGL failure, a `try/catch` returns early | `components/reactbits/Dither.jsx:184,186`; `:135-139` |
| The carrier's 8×8 Bayer matrix (row-major, `index = y*8 + x`) is `0,48,12,60,3,51,15,63 / 32,16,44,28,35,19,47,31 / 8,56,4,52,11,59,7,55 / 40,24,36,20,43,27,39,23 / 2,50,14,62,1,49,13,61 / 34,18,46,30,33,17,45,29 / 10,58,6,54,9,57,5,53 / 42,26,38,22,41,25,37,21` | `components/reactbits/Dither.jsx:82-91` |
| `public/wzrdtechlogo.png` is 1717×425 RGBA with a real alpha channel (alpha 0–255) | `file`, `sharp().stats()` |
| `dither-kit/pixel.ts` `BAYER4` holds **normalised** thresholds `(v+0.5)/16`, not the integer indices | `components/dither-kit/pixel.ts:5-10` |
| `next/dist/compiled/terser` ships with Next 15.5.2 and exports an async `minify(code, options)` (terser 5), so the boot can be minified with no new dependency (§6.2.1) | `node_modules/next/dist/compiled/terser/package.json`; `node -e "require('next/dist/compiled/terser').minify"` |

Parts (`3A`, `4B`, `8C` …) are the §14 part ids; this chapter never assigns milestones.

**New strings.** Every visible string, accessible name and announcement this chapter introduces. None is preserved until it merges (Appendix A). Use them byte-for-byte.
- **Boot (§6.2):** POST keys `DISPLAY`, `TYPE`, `THEME`, `PATCH`, `WAVE`; values `FOCAL`, `FALLBACK`, `DARK`, `LIGHT`, `CONVEX`, `NOT PATCHED`, `WEBGL`, `STATIC` and the placeholder `--`; the mono line `STREAM.WZRD.TECH · CH 05 · 5DEE`; the status text 'Loading stream.wzrd.tech'.
- **Route loading captions (§6.3):** 'Loading Live Control', 'Loading Shotboard', 'Loading Characters', 'Loading Locations', 'Loading Clips', 'Loading Recordings', 'Loading Twitch Analytics'.
- **Generation (§6.6):** readouts `SAVING`, `EXPANDING`, `QUEUE {nn}`, `QUEUE --`, `RENDER {mm:ss.s} · ~{mm:ss}`, `RENDER {mm:ss.s}`, `UPLOAD {i}/{n}`, `SAVED`, `SIGNAL LOST · {reason}`; the compact forms `Q {nn}`, `{mm:ss.s}`, `UP {i}/{n}`, `SIGNAL LOST` (`QUEUE --` has no compact form); the button 'Retry'; announcements 'Saving', 'Expanding prompt', 'Queued, position {n}', 'Rendering', 'Uploading {i} of {n}', 'Saved', 'Generation failed: {reason}'.
- **Going ON AIR (§6.7):** the §6.7 "New strings" list.
- **Chyrons (§6.10):** kickers `INFO`, `SAVED`, `WARN`, `ERROR`; the controls 'Dismiss', 'Copy details' and 'Undo'; the queue badge `+{n} queued`.
- **Air lock (§6.12):** the §6.12 "New strings" list.
- **Slate kickers (§6.13):** `STAND BY`, `BLANK BOARD`, `OPEN CASTING`, `NO SCOUTS`, `NO FOOTAGE`, `NO TAPE`, `NO DATA`, `NOT PATCHED`, `NO ACCESS`, `NO CARRIER`, `SIGNAL LOST`, `CH 404`. Slate titles and bodies are listed by §11.D.7 and the page chapters.
- Dialog copy used here but owned elsewhere: the go-live and leave dialogs (§8.9.6).

### 6.1 Motion grammar

The system has three verbs, and every animation in the product is one of them. An animation that fits none of them is a defect.

| Verb | What it means | Timing | Examples |
|---|---|---|---|
| **Key** | A physical control responds to the operator | ≤ `--dur-fast` (120 ms), `--ease-key` | Secondary key press (`translate-y-px`, 60 ms), Switch thumb, LED snap |
| **Resolve** | New information appears | `--dur-resolve` (160 ms) = 4 Bayer steps × 40 ms, `steps(1,end)` per step | Route enter, skeleton → content, slate entrance, generation land, chyron enter, lamp lit |
| **House** | The room changes state | `--dur-house` (1200 ms), `--ease-in-out` | Carrier retint and veil on ON AIR / off air |

**Laws.** These restate §4 for motion; §6.16 checks each one.
1. Animate only `transform`, `opacity`, stepped `mask-image` and `clip-path`. There are two sanctioned exceptions: the HoldButton ring's `stroke-dashoffset` on a 20 px SVG (§6.7), and the boot's Canvas2D (§6.2). Colour, border-colour and box-shadow may transition for ≤ `--dur-fast` on hover or press only.
2. No slide-ins, except Sheets (320 ms `--ease-out` translate, §7.3). No springs, bounces, blur, glow or smooth shimmer. List rows may travel ≤ 4 px. Text is never scaled.
3. Stagger is 30 ms per item for at most 8 items; later items arrive with the 8th. Exits use `--dur-fast` (120 ms), the token nearest 0.66× the 160 ms resolve.
4. **Exactly one element may blink:** the STALLED ingest lamp in the TallyBar, at 1 Hz for 5 cycles, then steady (§6.7). The TallyCluster's AIR lamp shows STALLED with `data-steady` and never blinks (§7.4). The BayerSpinner is a progress indicator that exists only while a real operation is pending; it is not a blink.
5. Every loop stops under `prefers-reduced-motion: reduce` (§6.14). Under the air lock, only the items in §6.12 move.
6. **The `data-air-allow` attribute is the only exemption mechanism.** An element that carries `data-air-allow` (lamps, LEDs, the BayerSpinner, StreamList rows, error chyrons, the connect plate) keeps its resolve under the air lock. CSS rules and JS hooks both check `el.closest('[data-air-allow]')`. Nothing else is exempt.
7. **JS timings use the token mirror.** Every JS duration and curve (motion/react, WAAPI, canvas, the ticker) that equals a §5.12 token is written as `DUR.*`/`EASE.*` from `lib/motion/tokens.ts`, never as a literal. Component constants with no token (the 2400 ms RouteProgress trickle, the 600 ms hold, the 3000 ms off-air hold) are named `const`s in their module. The one exception is `BOOT_SCRIPT`, which cannot import; its literals are the §6.2 values.

### 6.2 Boot: "POST → wordmark → carrier" (the new loading animation)

The first load of each session becomes a broadcast ident. An instrument powers on and runs a truthful self-test. The WZRD.tech wordmark resolves out of the carrier's own Bayer grid, glints once, and flies into the command bar. Then the overlay dissolves into the live Dither wave. The boot never blocks the app, which hydrates underneath from the first byte.

#### 6.2.1 Files and placement

| File | Kind | Exports / content |
|---|---|---|
| `dashboard/components/boot/BootMarkup.tsx` | Server component | `export default function BootMarkup({ convexConfigured }: { convexConfigured: boolean })`. Renders, in order: `<style dangerouslySetInnerHTML={{ __html: BOOT_CSS }} />`, the host `<div id="wzrd-boot-host" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bootHtml(convexConfigured) }} />`, and `<script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />` |
| `dashboard/components/boot/boot.src.js` | Readable source, never imported by the app | The boot algorithm of §6.2.14, authored as one ES2017 IIFE `(function(ML,MS){…})(__MASK_L__,__MASK_S__)`. No imports, no `async`, no spread, no optional chaining, no `console`. Comments and descriptive names are allowed: the build strips them |
| `dashboard/scripts/gen-boot.mjs` | Node script (run from `dashboard/`) | Minifies `boot.src.js` with the terser that ships inside Next (no new dependency): `createRequire(import.meta.url)('next/dist/compiled/terser')`, then `(await minify(src, { ecma: 2017, compress: true, mangle: true })).code`. Writes `components/boot/bootScript.generated.ts`. With `--check` it writes nothing and exits 1 when the committed file differs from a fresh minification, or when the gzip level 9 size of the body with both masks substituted (parsed from `masks.ts`, whose format below is fixed) exceeds 4096 bytes |
| `dashboard/components/boot/bootScript.generated.ts` | Generated by `gen-boot.mjs`; committed; never edited by hand | `export const BOOT_SCRIPT_BODY = '…'` (the minified IIFE, still containing the `__MASK_L__`/`__MASK_S__` placeholders; terser keeps them because they are unresolved globals) |
| `dashboard/components/boot/bootScript.ts` | Plain TS module, no `'use client'` | `BOOT_SCRIPT: string` = `BOOT_SCRIPT_BODY` with `__MASK_L__` and `__MASK_S__` replaced by `JSON.stringify(MASK_L)` and `JSON.stringify(MASK_S)` (function replacers, §6.2.14); `BOOT_CSS: string` (§6.2.13); `bootHtml(convexConfigured: boolean): string` (§6.2.13) |
| `dashboard/components/boot/masks.ts` | Generated by the §13 keyless pipeline (lands in 3B; derived from the wordmark; needs no `FAL_KEY`) | `export const MASK_L = { w: 120, h: 30, b64: '…' }` and `export const MASK_S = { w: 80, h: 20, b64: '…' }`. 1 bit per cell, row-major, MSB first: the bit for cell (x,y) is `bytes[(y*w+x)>>3] >> (7-((y*w+x)&7)) & 1`. A cell is 1 when the wordmark's alpha, box-filtered into that cell, is ≥ 50% |

`boot.src.js`, `gen-boot.mjs` and `bootScript.generated.ts` land in 4C with the rest of the boot. Every PR that touches `boot.src.js` runs `node scripts/gen-boot.mjs` and commits the result; `node scripts/gen-boot.mjs --check` (from `dashboard/`) must exit 0.

**Hydration safety (mandatory).** React owns only `#wzrd-boot-host`, and that element's attributes never change. Everything the script touches (`#wzrd-boot`, its children and the sr-only status) lives inside the host's `dangerouslySetInnerHTML`, whose children React never hydrates. The script can therefore remove `#wzrd-boot` at any time, before or after hydration, without a mismatch. The script also writes `data-boot` on `<html>`, which already carries `suppressHydrationWarning`. Never render the overlay as JSX children, and never remove the host itself.
> Note: this holds for hydration only. If the root ever client-renders (for example after a recoverable hydration error above every Suspense boundary), React re-creates the host from its `__html`. The overlay then reappears for ≤ 2 s until the `boot-failsafe` animation hides it, and the same failsafe hides `#wzrd-boot-sr` (§6.2.13). No script runs in that case.

**Position in `app/layout.tsx`** (full tree in §7.6): `<DitherBackground/>` stays the **first DOM child of `<body>`** (invariant, `app/layout.tsx:37`), and `<BootMarkup/>` comes immediately after it.
> Note: bible §6.1's tree lists BootMarkup before DitherBackground. The invariant "DitherBackground rendered first inside `<body>`" wins. The order has no visual effect, because both are `position: fixed` layers and the overlay is `z-index: 9999`.

**Preloads** (in the `<head>` of `app/layout.tsx`): only `<link rel="preload" as="image" href="/brand/wordmark/wzrdtech-640.webp" />`. The loader strip is **never preloaded**: `BOOT_SCRIPT` requests `/brand/loader/coast-boot-strip@2x.png` itself, right after the gates and only in `post` mode (§6.2.14). An unused preload logs Chrome's "preloaded but not used" console warning, and the skip, flip and static modes never use the strip.
> Note: bible §9 says only the wordmark 160/320 and the loader strip may load before LCP. The boot needs `wzrdtech-640.webp` for its 480 CSS px mark, which makes it the one additional pre-LCP image (≤ 40 KB, cached after the first visit). §13's `brand:check` pre-LCP allowlist includes it, and lists the strip as requested by the boot script in post mode only.

**Asset dependency.** The boot ships only when `public/brand/wordmark/wzrdtech-640.webp`, `components/boot/masks.ts` and `public/brand/loader/coast-boot-strip@2x.png` exist. 3B lands `masks.ts`, the wordmark ladder and the placeholder strip before 4C (§14.3 R2); no `FAL_KEY` is needed. A 404 on any boot asset is a console error and fails §6.16.

#### 6.2.2 Layers (bottom to top)

| Layer | Element | Spec |
|---|---|---|
| L0 | `body` | `background: rgb(var(--c-canvas))` (§5) |
| L1 | Carrier | `DitherBackground` host. After its first frame, the canvas fades in over 600 ms `--ease-out`. **If `html[data-boot]` is present at that moment**, it appears at opacity 1 instantly instead: it is hidden under the opaque overlay, and the reverse-Bayer clear reveals it directly |
| L2 | App | Hydrates immediately. Nothing waits for the boot |
| L3 | `#wzrd-boot` | `position:fixed; inset:0; z-index:9999; contain:strict; pointer-events:auto; background:rgb(var(--c-canvas))`, `aria-hidden="true"`. It takes pointer input, so a press during the boot never reaches a control underneath (§6.2.7); from the handoff (class `out`) it is `pointer-events:none`. Children: `<canvas id="wzrd-boot-cv">`, the power LED, the strip box, the mark wrapper `#wzrd-boot-mark` (wordmark `<img>` plus glint layer), the sprite box, the POST list and the mono line |
| L4 | `#wzrd-boot-sr` | `<div role="status" class="sr-only">Loading stream.wzrd.tech</div>`. It is a **sibling** of `#wzrd-boot` inside the host, because an `aria-hidden` ancestor would silence it. Removed at the end |

> Note: the bible places `id="wzrd-boot-mark"` on the `<img>` and draws the glint with `#wzrd-boot-mark::after`. Pseudo-elements do not render on `<img>`, and a mask on a translating pseudo-element moves with it. So the id goes on a wrapper `<div>`, and the glint is a child `#wzrd-boot-glint` that carries the static wordmark mask, with an inner `<i>` that translates (§6.2.13).

#### 6.2.3 Composition

The boot is a vertical stack, centred horizontally, whose **vertical centre sits at 45% of the viewport height** (`left:50%; top:45%; transform:translate(-50%,-50%)`).

| # | Item | Size ≥ 768 px | Size < 768 px | Gap above |
|---|---|---|---|---|
| 1 | Power LED `#wzrd-boot-led` | 8×8 | 8×8 | — |
| 2 | Display strip `#wzrd-boot-strip` (canvas cells) | 192×8 = 48×2 cells in four 12-cell blocks | same | 16 |
| 3 | Wordmark box `#wzrd-boot-mark` | 480×120 (mask 120×30 cells at 4 px; `<img>` 480×119) | 320×80 (mask 80×20; `<img>` 320×79) | 24 |
| 4 | Row: sprite box `#wzrd-boot-sprite` 128×128 (32×32 art at 4 px), 24 px gap, POST list `#wzrd-boot-post` (150 wide) | 128 + 24 + 150 = 302 wide | same | 24 |
| 5 | Mono line `STREAM.WZRD.TECH · CH 05 · 5DEE`, `micro`, `text-3` | one line | one line | 16 |

Total stack height: 8+16+8+24+120+24+128+16+12 = **356 px** (≥ 768) and **316 px** (< 768). The four strip blocks are `--c-ramp-1`, `--c-ramp-2`, `--c-ramp-3`, and the ramp's far end: `--c-ramp-glint` in dark, `--c-text-1` in light.
> Note: in the light theme, `--c-ramp-glint` is `#FFFFFF` on a `#FAFAFF` overlay and would be invisible, so the fourth block uses `--c-text-1` there.

```text
1440×900, dark (y = centre line at 405)

                         ▪                      ← power LED 8×8 (outline → accent at 60 ms)
                  ▒▒▒▒▓▓▓▓████░░░░              ← display strip 192×8, ramp-1 · ramp-2 · ramp-3 · far end
      ┌────────────────────────────────────┐
      │         W Z R D . t e c h          │    ← 480×120: mask cells (ramp-3) → crisp <img> → glint → FLIP
      └────────────────────────────────────┘
      ┌──────────┐   ● DISPLAY  1440×900
      │  Coast   │   ● TYPE     FOCAL
      │  sprite  │   ● THEME    DARK
      │ 128×128  │   ● PATCH    NOT PATCHED     ← amber when Convex is not configured
      └──────────┘   ○ WAVE     --              ← hollow until the carrier reports
            STREAM.WZRD.TECH · CH 05 · 5DEE
```

The POST list is a 3-column grid: LED 8 px · key `8ch` · value `13ch`. JetBrains Mono at 10 px has a 6 px `ch`, and the `+0.06em` tracking makes 'NOT PATCHED' 73 px wide, so a 13ch (78 px) column holds it. Column gap 8 px, row height 12 px, row gap 4 px (5 rows = 76 px), `micro`. The key is `text-2`; the value is `text-2` (ok) or `text-warning` (warn).

**Canvas geometry.** Cell size `C = 4` CSS px. `cols = ceil(innerWidth/4)`, `rows = ceil(innerHeight/4)`. The backing store is `cols × rows` (1 px per cell, independent of DPR). The CSS size is exactly `cols*4 × rows*4` px, anchored at `left:0; top:0` with `image-rendering: pixelated`; the overlay's `contain:strict` clips the overflow.
> Note: the bible says "CSS 100%". A 100% box stretches cells to non-integer widths. The exact `cols*4` size keeps every cell a 4×4 square.

**Canvas ↔ DOM alignment.** The script never moves DOM. It measures the SSR boxes once (`getBoundingClientRect`) and maps each one to cells with `Math.round(px/4)`. The misalignment is ≤ 2 px and exists only during the 120 ms mask → image crossfade. No DOM box ever moves (only opacity and the FLIP transform change), so the boot's CLS is 0.

#### 6.2.4 Gates

`BOOT_SCRIPT` evaluates these synchronously, top to bottom. The first matching row decides.

| # | Condition | Result | `window.__wzrd.boot.mode` | Sets `sessionStorage['wzrd:boot']` |
|---|---|---|---|---|
| 1 | `#wzrd-boot` missing | Return | — | no |
| 2 | `?boot=1` | Force the first-visit POST (reduced motion → static card) | `post` / `static` | no |
| 3 | `?boot=flip` | Force the channel flip (reduced motion → skip) | `flip` / `skip` | no |
| 4 | `?noboot` present, or `document.visibilityState === 'hidden'`, or (`navigator.webdriver` and not `?boot=auto`) | Remove the node now | `skip` | no |
| 5 | `sessionStorage['wzrd:boot'] === '1'` | Channel flip (§6.2.8); reduced motion → skip | `flip` / `skip` | already set |
| 6 | Otherwise | First-visit POST (§6.2.5); reduced motion → static card (§6.2.9) | `post` / `static` | yes, at the end |

- `?boot=auto` bypasses **only** the `navigator.webdriver` gate, so Playwright can test the real session logic (first load → `post`, reload → `flip`).
- `sessionStorage` access is wrapped in `try/catch`. If it throws, treat the visit as a first visit and skip the write.
- **Late start.** Let `T0 = performance.now()` when the script starts (`performance.now()` counts from navigation start):

| `T0` | Behaviour |
|---|---|
| ≤ 300 ms | Full timeline, with the absolute times of §6.2.5 |
| 300 < T0 ≤ 600 ms | Skip the strip resolve (paint the strip fully at once) and the sprite. Show the POST list at `T0`. Everything from 600 ms runs on the absolute timeline |
| > 600 ms | Run the channel flip (§6.2.8) immediately. The overlay is gone at `T0 + 224` ms (plus at most one frame). Set `sessionStorage`. A visit forced with `?boot=1` never converts: it runs the full POST on the absolute timeline |

#### 6.2.5 First-visit timeline

The hard cap is **1600 ms from navigation start at 60 Hz plus at most one frame**: the last frame is the first rAF with `t ≥ 1584`, so the overlay is removed by 1617 ms (`tEnd ≤ 1617`, the §6.16 limit). Times are absolute `performance.now()` values. Frame numbers assume 60 Hz (`frame = floor(t/16.67)`).

| t (ms) | Frame | Canvas | DOM / CSS | Condition |
|---|---|---|---|---|
| 0 | 0 | Not yet sized (transparent) | SSR paint: the overlay is opaque `--c-canvas`. The power LED is a 1 px `--c-border-control` outline. The mono line is visible. The mark `<img>` has opacity 0; the POST list has `visibility:hidden` | Pure HTML + CSS; paints before any JS |
| script start (≈ 0–50) | — | Sized to `cols × rows`; all cells 0 (transparent) | `html[data-boot]` set (hides `#wzrd-bug`). Colours read once from `getComputedStyle(html)` | Gates passed |
| 60 | 4 | — | Power LED lights in `--c-accent` (`boot-on`, 1 ms, `steps(1,end)`, delay 60 ms) | CSS only |
| 100–300 | 6–18 | Display strip resolves: cell (x,y) is lit when `easeOutCubic(p) > B8(x,y)`, `p = (t−100)/200` | — | — |
| first rAF | ≤ 7 | — | POST row DISPLAY → ok, value `{innerWidth}×{innerHeight}` | — |
| 300 | 18 | Strip complete | POST list becomes visible (`visibility` flip, no fade). Row THEME → ok, `DARK` or `LIGHT` from `html.classList`. Row PATCH → ok `CONVEX` or warn `NOT PATCHED` from `data-convex` | — |
| 300–600 | 18–36 | Coast sprite frame 1 materialises in the sprite box with the same rule, `p = (t−300)/300`. **Skipped** if the strip image has not decoded by 300 ms | — | `img.decode()` resolved |
| 300–1200 | — | — | TYPE and WAVE rows resolve as their real conditions arrive (§6.2.6). A result that arrives before 300 ms is written into the still-hidden list | Event-driven |
| 400 | 24 | — | If the font check has not resolved: TYPE → warn `FALLBACK`. It flips to ok `FOCAL` if the font resolves before 1200 | — |
| 600–1000 | 36–60 | Sprite plays frames 2–5 at 10 fps (frame `1 + floor((t−600)/100)`), repainting only the 32×32 sprite region | — | Sprite decoded |
| 600–900 | 36–54 | Wordmark mask cells light in Bayer-8 order in `--c-ramp-3`, `p = (t−600)/300` | — | — |
| 900–1020 | 54–61 | — | `#wzrd-boot-mark` gets class `on`: `<img>` opacity 0 → 1 over 120 ms `linear` | — |
| 1020 | 61 | Mask cells cleared to 0 | `#wzrd-boot-glint` gets class `go` | — |
| 1020–1360 | 61–82 | — | **Glint**, the only shimmer in the system: a 28° band, 18% of the box width, `rgb(236 244 255 / .55)`, `translateX(−120%) → translateX(120%)` over 340 ms `--ease-spec`, clipped by the wordmark's own alpha | Once per session |
| 1200 | 72 | **Handoff, one frame:** every cell that is still 0 is painted `--c-canvas`, and in the same frame the overlay's CSS background becomes `transparent` (visually identical) | `#wzrd-boot` gets class `out`: LED, POST list and mono line fade over 160 ms `steps(4,end)` | — |
| 1200–1560 | 72–93 | **Reverse Bayer-8 clear:** cell (x,y) becomes 0 when `easeInOutCubic(p) > 1 − B8(x,y)`, `p = (t−1200)/360`. Sprite and strip cells dissolve with the field. The quantised carrier shows through, so the POST reads as dissolving into the wave | — | — |
| 1200–1584 | 72–95 | — | **FLIP:** measure `#wzrd-bug` and the mark `<img>`, then animate `#wzrd-boot-mark` (`transform-origin: 0 0`) to `translate(dx,dy) scale(s)` with `s = bug.width / img.width`, over 384 ms `cubic-bezier(.16,1,.3,1)` (WAAPI, `fill:'forwards'`). If `#wzrd-bug` is missing, `display:none` or zero-sized, add class `fade` instead (opacity → 0 over 160 ms `--ease-exit`) | — |
| first rAF with t ≥ 1584 | 95–96 | `canvas.width = 0` (frees the backing store) | In one task: remove `data-boot` from `<html>` (the bug becomes visible exactly under the flown mark), remove `#wzrd-boot` and `#wzrd-boot-sr`, set `sessionStorage['wzrd:boot'] = '1'`, and record `__wzrd.boot.tEnd` | — |

`B8(x,y) = (BAYER8[(y&7)*8 + (x&7)] + 0.5) / 64`, using the carrier's matrix from the fact table above. No cell is lit at `p = 0`, and every cell is lit at `p = 1`. `easeOutCubic(p) = 1−(1−p)³`; `easeInOutCubic(p) = p<.5 ? 4p³ : 1−(−2p+2)³/2`.

#### 6.2.6 POST rows

Every row reports a real condition, and no row is animated to look busy. The only network requests are for fonts that are already preloaded.

| Row | Green (`data-s="ok"`) value | Amber (`data-s="warn"`) value | Hollow (no `data-s`) value | Source |
|---|---|---|---|---|
| `DISPLAY` | `1440×900` (the live `innerWidth×innerHeight`) | — | `--` | First `requestAnimationFrame` callback |
| `TYPE` | `FOCAL` | `FALLBACK`, if unresolved at 400 ms | `--` | `document.fonts.load('400 14px ' + first family of getComputedStyle(document.body).fontFamily)` resolves with a non-empty list. The first family is next/font's hashed Focal family |
| `THEME` | `DARK` / `LIGHT` | — | — | `html.classList.contains('dark')`, immediately |
| `PATCH` | `CONVEX` | `NOT PATCHED` | — | `#wzrd-boot[data-convex="1"]`, rendered by the server from `!!process.env.NEXT_PUBLIC_CONVEX_URL` |
| `WAVE` | `WEBGL` | `STATIC` (`detail.webgl === false`) | `--` if nothing has arrived by 1200 ms | `window.__wzrdDitherReady`, else the first `wzrd:dither-ready` event (§6.2.11) |

LED colours: ok = `--c-success` fill plus `0 0 0 2px rgb(var(--c-success)/.22)`; warn = the same with `--c-warning`; hollow = 1 px inset `--c-border-control`.

#### 6.2.7 Interrupt and hidden tab

- **Interrupt.** A `keydown` or `pointerdown` on `window` (capture phase, passive, once) at any time before the boot ends starts a **200 ms reverse-Bayer clear** from the current frame. If the handoff's canvas-colour fill (§6.2.5) has not happened yet, it is applied first. There is no FLIP: the mark gets class `fade`. The overlay is gone ≤ 200 ms after the event, and `__wzrd.boot.interrupted = true`.
- **Keys reach the app; the first pointer press only dismisses the boot and never activates a control underneath.** A `keydown` is not prevented (for example, ⌘K opens the palette). When the interrupt came from `pointerdown`, the script also adds a one-shot capture-phase `click` listener on `window` that calls `preventDefault()` and `stopPropagation()`, and removes it after 1000 ms if no click arrived. Before the handoff the overlay itself takes the press (`pointer-events:auto`); from the handoff the swallowed click covers the dissolving frames. Without JavaScript, the `boot-failsafe` animation (`visibility:hidden` at 2000 ms) restores pointer access.
- **Clearing freezes the phases.** Once a clear has started (handoff, flip or interrupt), no phase writes to the pixel buffer again: only the clear and `put()` run. Otherwise a later resolve would write transparent cells into the mark and sprite boxes and punch rectangular holes through the dissolve.
- **Hidden tab or stalled rAF.** A `setTimeout(finish, max(1650, T0 + 300) − performance.now())` guarantees removal even when rAF stops firing. The `T0 + 300` term lets a late-start flip finish. `finish()` is idempotent.

#### 6.2.8 Channel flip (repeat visit, 224 ms)

| t from flip start (ms) | Canvas |
|---|---|
| 0 | Overlay background → `transparent`; every cell painted `--c-canvas` in the same frame |
| 0–80 | **Static burst:** each frame, re-seed `xorshift32` with `(performance.now()*1000)\|0` and light 35% of cells with a random pick of `--c-ramp-1`/`-2`/`-3`. The other cells stay `--c-canvas` |
| 80–224 | Reverse Bayer-8 clear, `p = (t−80)/144`, `easeInOutCubic` |
| first rAF with t ≥ 224 | `finish()` (the same as the §6.2.5 final row, minus the `sessionStorage` write, which is already set). `tEnd − t0 ≤ 257` (224 ms plus the script start and one frame) |

The flip has no wordmark, no POST and no FLIP. `html[data-boot]` hides `#wzrd-bug` for these 224 ms.

#### 6.2.9 Reduced motion

- **First visit:** `#wzrd-boot[data-mode="static"]` shows a static card: the wordmark `<img>` at opacity 1 and the mono line, with no canvas, LED, strip, sprite or POST. After 250 ms (`setTimeout`), class `fade` sets opacity 0 with a 150 ms `linear` transition, and `finish()` runs at 400 ms. No rAF is requested. The global reduced-motion rule in `tokens.css` (§5.2) is `@layer base` `!important`, so it beats the unlayered `BOOT_CSS` transition: the fade is a 1 ms cut in practice. The ≤ 450 ms acceptance (§6.16) is unchanged.
- **Repeat visit:** skip (remove at once).
- The check is `matchMedia('(prefers-reduced-motion: reduce)').matches`, read once at script start.

#### 6.2.10 Failsafes

| Failure | Guarantee |
|---|---|
| JavaScript disabled, or the script never runs | `#wzrd-boot { animation: boot-failsafe 1ms linear 2000ms forwards }` hides the overlay and gives pointer access back. The same animation on `#wzrd-boot-sr` hides the status, so 'Loading stream.wzrd.tech' never stays in the accessibility tree. `html[data-boot]` is never set without JS, so the bug is visible |
| Script throws after setting `data-boot` | The whole IIFE body is inside `try { … } catch (e) { finish() }`. Nothing is logged |
| Script dies without throwing (for example, the tab is killed mid-frame and restored) | `html[data-boot] #wzrd-bug { opacity:0; animation: boot-bug 1ms linear 2000ms forwards }` with `@keyframes boot-bug { from, to { opacity: 1 } }` reveals the bug after 2000 ms, and the `setTimeout` of §6.2.7 removes the overlay |
| WebGL unavailable | `onFirstFrame({ webgl:false })` still fires (§6.2.11) and WAVE reads `STATIC`. The boot never waits for the carrier beyond 1200 ms |

#### 6.2.11 Readiness contract (Dither ↔ boot)

1. `components/reactbits/Dither.jsx` gains `onFirstFrame?: (detail: { webgl: boolean }) => void`. Call it **once per mount**, right after the first `renderer.render(scene, camera)`. Also call it with `{ webgl: false }` inside the WebGL-failure `catch` branch (`Dither.jsx:137`). Hold the callback in a ref so it never enters effect dependencies.
2. `components/DitherBackground.tsx` passes `onFirstFrame`. A module-level `let announced = false` guard (dev StrictMode mounts effects twice) makes it run this once:
   ```ts
   window.__wzrdDitherReady = detail            // { webgl: boolean }, truthy
   window.dispatchEvent(new CustomEvent('wzrd:dither-ready', { detail }))
   ```
   > Note: the bible writes `__wzrdDitherReady = true`. The boot needs `detail.webgl` for the WAVE row, so the flag holds the detail object, which is still truthy.
3. `BOOT_SCRIPT` reads `window.__wzrdDitherReady` first and only then listens for `wzrd:dither-ready` (`{ once: true }`), so it works whichever side finishes first.
4. The event fires **exactly once per page load**. Theme toggles and broadcast-state changes never refire it, because the renderer is created once (§12).
5. Declare every global in `dashboard/types/wzrd.d.ts` (lands in 3A). This is the complete file; §12 and §8 point to it and never re-declare these fields:
   ```ts
   // dashboard/types/wzrd.d.ts — globals written by the boot and by dev instrumentation (docs/redesign/spec/06-motion-and-loading.md §6.2.11).
   import type { BroadcastState } from '@/lib/broadcast/store'
   export {}
   declare global {
     interface BootRecord { mode: 'post' | 'flip' | 'static' | 'skip'; t0: number; tEnd: number; interrupted: boolean }
     interface SlotAudit { owner: string | null; requests: Array<{ id: string; priority: number; want: boolean }> }
     interface Window {
       __wzrdDitherReady?: { webgl: boolean }
       __wzrd?: {
         boot?: BootRecord
         slots?: SlotAudit
         frames?: { carrier?: number; morph?: number; raster?: number }
         carrier?: { wave: number[]; bg: number[]; speed: number; tweenMs: number }
         broadcast?: { publish(p: Partial<BroadcastState>): void; get(): BroadcastState }
         renders?: Record<string, number>
       }
     }
   }
   ```

#### 6.2.12 Constraints and how each is measured

| Constraint | Value | Measurement (§15 automates) |
|---|---|---|
| Script size | `BOOT_SCRIPT` including masks ≤ **4096 bytes** gzipped; `BOOT_CSS` ≤ **1536 bytes** gzipped. Measured on this spec's §6.2.14 sketch with masks derived from `public/wzrdtechlogo.png`: 3644 bytes after `gen-boot.mjs` minification (4712 bytes unminified, with comments); `BOOT_CSS` 1168 bytes. The body is minified by `scripts/gen-boot.mjs` (§6.2.1), never by hand | `gen-boot.mjs --check`, and the served-HTML measurement in the block below |
| Renderer | Canvas2D only; no WebGL | The grep in the block below prints nothing (the POST value string `WEBGL` is allowed) |
| Frame cost | ≈ 0.4 ms per frame at 1440×900 (81 000 cells). Only the handoff and the flip iterate the full grid; the other phases iterate their own region | Performance panel, informational |
| Cap | Overlay removed at the first frame with `t ≥ 1584`, so by **1617 ms** after navigation start (1600 ms at 60 Hz plus at most one frame), when `T0 ≤ 600`; otherwise (late-start flip) ≤ `T0 + 224` ms plus one frame | `window.__wzrd.boot.tEnd` |
| Console | **Zero** messages from the boot in every mode | Playwright `console` + `pageerror` capture with `?boot=1`, `?boot=flip`, `?boot=auto`, `?noboot` |
| Layout shift | CLS **0** | `PerformanceObserver({ type:'layout-shift', buffered:true })` sum over 0–2000 ms |
| Network | The boot itself requests only the wordmark (the parsed `<img>` and the glint mask, both `/brand/wordmark/wzrdtech-640.webp`) and, in `post` mode only, `/brand/loader/coast-boot-strip@2x.png`; no 4xx. The app under the overlay loads its own images (CommandBar Wordmark, Live monitor standby); they are not boot requests | Playwright `request`/`response` log, filtered by initiator (§6.16) |

Runnable forms of the table's measurements. The `grep` runs from the repository root; the size check runs from `dashboard/` against the prod server on port 3109 (§1.6):

```bash
# Renderer (repository root)
grep -rnE "getContext\\(['\"](webgl|webgl2|experimental-webgl)" dashboard/components/boot

# Script size (dashboard/, prod server running): prints "<script bytes> <css bytes>"; limits 4096 and 1536
node scripts/gen-boot.mjs --check
curl -s localhost:3109/admin -o .qa/admin.html
node -e "const h=require('fs').readFileSync('.qa/admin.html','utf8'),z=require('zlib');const pick=(re,k)=>[...h.matchAll(re)].map(m=>m[1]).find(t=>t.includes(k));const s=pick(/<script>([\s\S]*?)<\/script>/g,'wzrd-boot'),c=pick(/<style>([\s\S]*?)<\/style>/g,'#wzrd-boot');console.log(z.gzipSync(s,{level:9}).length,z.gzipSync(c,{level:9}).length)"
```

#### 6.2.13 Markup and `BOOT_CSS`

`bootHtml(convexConfigured)` returns exactly this structure. The real string has no whitespace between tags and no comments.

```html
<div id="wzrd-boot" aria-hidden="true" data-convex="1">   <!-- data-convex only when configured -->
  <canvas id="wzrd-boot-cv"></canvas>
  <div class="wb-stack">
    <i id="wzrd-boot-led"></i>
    <div id="wzrd-boot-strip"></div>
    <div id="wzrd-boot-mark">
      <img src="/brand/wordmark/wzrdtech-640.webp" width="480" height="119" alt="">
      <div id="wzrd-boot-glint"><i></i></div>
    </div>
    <div class="wb-row">
      <div id="wzrd-boot-sprite"></div>
      <ol id="wzrd-boot-post">
        <li data-k="display"><i></i><span>DISPLAY</span><b>--</b></li>
        <li data-k="type"><i></i><span>TYPE</span><b>--</b></li>
        <li data-k="theme"><i></i><span>THEME</span><b>--</b></li>
        <li data-k="patch"><i></i><span>PATCH</span><b>--</b></li>
        <li data-k="wave"><i></i><span>WAVE</span><b>--</b></li>
      </ol>
    </div>
    <p class="wb-id">STREAM.WZRD.TECH · CH 05 · 5DEE</p>
  </div>
</div>
<div id="wzrd-boot-sr" role="status" class="sr-only">Loading stream.wzrd.tech</div>
```

`BOOT_CSS` uses §5 tokens only and is authored without comments. It owns every `boot-*` keyframe (`boot-failsafe`, `boot-bug`, `boot-on`, `boot-out`, `boot-glint`); `keyframes.css` (§5.14) defines none of them.

```css
#wzrd-boot{position:fixed;inset:0;z-index:9999;contain:strict;pointer-events:auto;
  background:rgb(var(--c-canvas));animation:boot-failsafe 1ms linear 2000ms forwards}
#wzrd-boot.out{pointer-events:none}
#wzrd-boot-sr{animation:boot-failsafe 1ms linear 2000ms forwards}
#wzrd-boot-cv{position:absolute;left:0;top:0;image-rendering:pixelated}
#wzrd-boot .wb-stack{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);
  display:flex;flex-direction:column;align-items:center}
#wzrd-boot-led{position:relative;display:block;width:8px;height:8px;border-radius:var(--r-lamp);
  box-shadow:inset 0 0 0 1px rgb(var(--c-border-control))}
#wzrd-boot-led::after{content:"";position:absolute;inset:0;border-radius:inherit;
  background:rgb(var(--c-accent));opacity:0;animation:boot-on 1ms steps(1,end) 60ms forwards}
#wzrd-boot-strip{width:192px;height:8px;margin-top:16px}
#wzrd-boot-mark{position:relative;width:480px;height:120px;margin-top:24px;transform-origin:0 0}
#wzrd-boot-mark img{display:block;width:100%;height:auto;opacity:0;transition:opacity 120ms linear}
#wzrd-boot-mark.on img{opacity:1}
#wzrd-boot-mark.fade{opacity:0;transition:opacity 160ms var(--ease-exit)}
#wzrd-boot-glint{position:absolute;inset:0;overflow:hidden;
  -webkit-mask:url(/brand/wordmark/wzrdtech-640.webp) 0 0/100% auto no-repeat;
          mask:url(/brand/wordmark/wzrdtech-640.webp) 0 0/100% auto no-repeat}
#wzrd-boot-glint i{position:absolute;inset:-10% 0;transform:translateX(-120%);
  background:linear-gradient(118deg,transparent 41%,rgb(236 244 255/.55) 41% 59%,transparent 59%)}
#wzrd-boot-glint.go i{animation:boot-glint 340ms var(--ease-spec) forwards}
#wzrd-boot .wb-row{display:flex;align-items:center;gap:24px;margin-top:24px}
#wzrd-boot-sprite{width:128px;height:128px}
#wzrd-boot-post{visibility:hidden;display:grid;gap:4px;margin:0;padding:0;list-style:none;
  font:500 10px/12px var(--font-mono),ui-monospace,monospace;letter-spacing:.06em;color:rgb(var(--c-text-2))}
#wzrd-boot.post #wzrd-boot-post{visibility:visible}
#wzrd-boot-post li{display:grid;grid-template-columns:8px 8ch 13ch;column-gap:8px;align-items:center}
#wzrd-boot-post i{width:8px;height:8px;border-radius:var(--r-lamp);box-shadow:inset 0 0 0 1px rgb(var(--c-border-control))}
#wzrd-boot-post [data-s=ok] i{background:rgb(var(--c-success));box-shadow:0 0 0 2px rgb(var(--c-success)/.22)}
#wzrd-boot-post [data-s=warn] i{background:rgb(var(--c-warning));box-shadow:0 0 0 2px rgb(var(--c-warning)/.22)}
#wzrd-boot-post [data-s=warn] b{color:rgb(var(--c-warning))}
#wzrd-boot-post b{font-weight:500}
#wzrd-boot .wb-id{margin:16px 0 0;font:500 10px/12px var(--font-mono),ui-monospace,monospace;
  letter-spacing:.06em;color:rgb(var(--c-text-3))}
#wzrd-boot.out #wzrd-boot-led,#wzrd-boot.out #wzrd-boot-post,#wzrd-boot.out .wb-id{
  animation:boot-out 160ms steps(4,end) forwards}
#wzrd-boot[data-mode=static] #wzrd-boot-cv,#wzrd-boot[data-mode=static] #wzrd-boot-led,
#wzrd-boot[data-mode=static] #wzrd-boot-strip,#wzrd-boot[data-mode=static] .wb-row{display:none}
#wzrd-boot[data-mode=static] #wzrd-boot-mark img{opacity:1;transition:none}
#wzrd-boot.fade{opacity:0;transition:opacity 150ms linear}
@media (max-width:767px){#wzrd-boot-mark{width:320px;height:80px}}
html[data-boot] #wzrd-bug{opacity:0;animation:boot-bug 1ms linear 2000ms forwards}
@keyframes boot-failsafe{from,to{opacity:0;visibility:hidden}}
@keyframes boot-bug{from,to{opacity:1}}
@keyframes boot-on{to{opacity:1}}
@keyframes boot-out{to{opacity:0}}
@keyframes boot-glint{from{transform:translateX(-120%)}to{transform:translateX(120%)}}
```

`boot-failsafe` and `boot-bug` set the same values at `from` and `to`. With only a `to` frame, headless Chromium 1194 ends the 1 ms `linear` fill at a progress just below 1 (computed opacity `1.1e-13`), so `visibility` stays `visible` and the overlay, which takes pointer input, would block the page when JavaScript is off (measured; the `from,to` form computes `hidden`).

The band `linear-gradient(118deg, … 41% 59% …)` is 18% of the box wide and leans 28° from vertical. The glint animates only `transform`, over a static mask, so it stays on the compositor.

#### 6.2.14 `boot.src.js` sketch

This is the reference algorithm, authored as `components/boot/boot.src.js` (§6.2.1) and minified by `scripts/gen-boot.mjs`. The names are illustrative; the behaviour, order and timings are binding.

```ts
// dashboard/components/boot/bootScript.ts — § references in this file are docs/redesign/spec/06-motion-and-loading.md (§6.2.1)
import { MASK_L, MASK_S } from './masks'
import { BOOT_SCRIPT_BODY } from './bootScript.generated'
export const BOOT_SCRIPT = BOOT_SCRIPT_BODY
  .replace('__MASK_L__', () => JSON.stringify(MASK_L))
  .replace('__MASK_S__', () => JSON.stringify(MASK_S))
export const BOOT_CSS = `…`                                                        // the §6.2.13 CSS block, verbatim
export const bootHtml = (convex: boolean) => `…${convex ? ' data-convex="1"' : ''}…` // the §6.2.13 markup, verbatim
```

```js
// dashboard/components/boot/boot.src.js — readable source of BOOT_SCRIPT (docs/redesign/spec/06-motion-and-loading.md §6.2.14).
// scripts/gen-boot.mjs minifies it into bootScript.generated.ts; bootScript.ts substitutes the two masks.
(function(ML,MS){
var d=document,w=window,H=d.documentElement,now=function(){return performance.now()};
var host=d.getElementById('wzrd-boot'),sr=d.getElementById('wzrd-boot-sr');if(!host)return;
var W=w.__wzrd=w.__wzrd||{},R=W.boot={mode:'skip',t0:now(),tEnd:0,interrupted:false};
var raf=0,safety=0,ended=false,force=null,q=location.search,sprite=null;
function finish(){ if(ended)return; ended=true; cancelAnimationFrame(raf); clearTimeout(safety);
  removeEventListener('keydown',interrupt,true); removeEventListener('pointerdown',interrupt,true);
  if(cv)cv.width=0; H.removeAttribute('data-boot'); host.remove(); if(sr)sr.remove(); R.tEnd=now();
  if(!force&&R.mode!=='skip'){try{sessionStorage.setItem('wzrd:boot','1')}catch(e){}} }
var cv=null;
try{
  var m=/[?&]boot=(1|flip|auto)\b/.exec(q); force=m&&m[1]!=='auto'?m[1]:null; var auto=m&&m[1]==='auto';
  var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, seen=false;
  try{seen=sessionStorage.getItem('wzrd:boot')==='1'}catch(e){}
  // ---- gates ----
  var mode=force==='1'?'post':force==='flip'?'flip':
    (/[?&]noboot\b/.test(q)||d.visibilityState==='hidden'||(navigator.webdriver&&!auto))?'skip':
    seen?'flip':'post';
  if(reduced)mode=mode==='post'?'static':'skip';
  if(mode==='post'&&!force&&R.t0>600)mode='flip';           // late start; a forced ?boot=1 never converts
  R.mode=mode; if(mode==='skip')return finish();
  if(mode==='post'){sprite=new Image();sprite.src='/brand/loader/coast-boot-strip@2x.png'} // post only; never preloaded
  H.setAttribute('data-boot',''); safety=setTimeout(finish,Math.max(1650,R.t0+300)-now());
  if(mode==='static'){host.setAttribute('data-mode','static');
    setTimeout(function(){host.classList.add('fade')},250); setTimeout(finish,400); return;}
  // ---- canvas + colours ----
  var C=4,cols=Math.ceil(innerWidth/C),rows=Math.ceil(innerHeight/C);
  cv=d.getElementById('wzrd-boot-cv'); cv.width=cols; cv.height=rows;
  cv.style.width=cols*C+'px'; cv.style.height=rows*C+'px';
  var ctx=cv.getContext('2d'),img=ctx.createImageData(cols,rows),px=new Uint32Array(img.data.buffer);
  var cs=getComputedStyle(H),dark=H.classList.contains('dark');
  function rgb(n){var v=cs.getPropertyValue(n).trim().split(/\s+/);return((255<<24)|(v[2]<<16)|(v[1]<<8)|(+v[0]))>>>0}
  var BG=rgb('--c-canvas'),R1=rgb('--c-ramp-1'),R2=rgb('--c-ramp-2'),R3=rgb('--c-ramp-3'),
      FAR=rgb(dark?'--c-ramp-glint':'--c-text-1');
  var B8=[0,48,12,60,3,51,15,63,32,16,44,28,35,19,47,31,8,56,4,52,11,59,7,55,40,24,36,20,43,27,39,23,
          2,50,14,62,1,49,13,61,34,18,46,30,33,17,45,29,10,58,6,54,9,57,5,53,42,26,38,22,41,25,37,21];
  function th(x,y){return(B8[(y&7)*8+(x&7)]+.5)/64}
  function eo(p){p=p<0?0:p>1?1:p;return 1-Math.pow(1-p,3)}
  function eio(p){p=p<0?0:p>1?1:p;return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2}
  function cells(el){var r=el.getBoundingClientRect();return{x:Math.round(r.left/C),y:Math.round(r.top/C),
    w:Math.round(r.width/C),h:Math.round(r.height/C)}}
  // Bayer threshold test: materialise region G from colour source src(ix,iy) (0 = transparent)
  function resolve(G,src,p){var e=eo(p);for(var y=0;y<G.h;y++)for(var x=0;x<G.w;x++){
    var gx=G.x+x,gy=G.y+y;if(gx<0||gy<0||gx>=cols||gy>=rows)continue;
    px[gy*cols+gx]=e>th(gx,gy)?src(x,y):0}}
  function fillUnlit(){for(var i=0;i<px.length;i++)if(!px[i])px[i]=BG}
  // reverse clear: highest thresholds leave first
  function clearReverse(p){var e=eio(p);for(var i=0,y=0;y<rows;y++)for(var x=0;x<cols;x++,i++)
    if(e>1-th(x,y))px[i]=0}
  function put(){ctx.putImageData(img,0,0)}
  var markEl=d.getElementById('wzrd-boot-mark'),markImg=markEl.firstElementChild,
      glint=d.getElementById('wzrd-boot-glint');
  function flipToBug(){var bug=d.getElementById('wzrd-bug'),b=bug&&bug.getBoundingClientRect(),
    m=markImg.getBoundingClientRect();
    if(!b||!b.width||!b.height||getComputedStyle(bug).display==='none'||!markEl.animate){markEl.classList.add('fade');return}
    markEl.animate([{transform:'none'},{transform:'translate('+(b.left-m.left)+'px,'+(b.top-m.top)+'px) scale('+(b.width/m.width)+')'}],
      {duration:384,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'})}
  // ---- clear phase shared by handoff, flip and interrupt ----
  var clr=null; // {t:start, dur:ms}; once set, no phase writes to px again
  function startClear(t,dur){if(clr)return; host.style.background='transparent'; fillUnlit(); clr={t:t,dur:dur}}
  function interrupt(e){ if(ended)return; R.interrupted=true; markEl.classList.add('fade'); host.classList.add('out');
    if(e&&e.type==='pointerdown'){ // the first press only dismisses the boot: swallow its click
      var sw=function(ev){ev.preventDefault();ev.stopPropagation()};
      addEventListener('click',sw,{capture:true,once:true}); setTimeout(function(){removeEventListener('click',sw,true)},1000)}
    var t=now(); if(!clr)startClear(t,200); else{var left=clr.t+clr.dur-t; if(left>200){clr.t=t-(clr.dur-200)}}}
  addEventListener('keydown',interrupt,{capture:true,once:true});
  addEventListener('pointerdown',interrupt,{capture:true,once:true,passive:true});
  // ---- channel flip: 0–80 ms static burst, 80–224 ms reverse clear ----
  if(mode==='flip'){var f0=now(),seed=0;
    (function fr(){var t=now()-f0;
      if(!clr&&t<80){host.style.background='transparent';seed=(now()*1000)|0||1;
        for(var i=0;i<px.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;var r=(seed>>>0)/4294967296;
          px[i]=r<.35?[R1,R2,R3][(r/.35*3)|0]:BG}}
      else{if(!clr)clr={t:f0+80,dur:144}; clearReverse((now()-clr.t)/clr.dur)}
      put(); if(clr&&now()>=clr.t+clr.dur)return finish(); raf=requestAnimationFrame(fr)})();
    return;}
  // ---- first-visit POST ----
  var STRIP=cells(d.getElementById('wzrd-boot-strip')),SPR=cells(d.getElementById('wzrd-boot-sprite')),
      MARK=cells(markEl),MK=innerWidth>=768?ML:MS,bits=atob(MK.b64);
  function maskSrc(x,y){var i=y*MK.w+x;return x<MK.w&&y<MK.h&&(bits.charCodeAt(i>>3)>>(7-(i&7))&1)?R3:0}
  function stripSrc(x){return[R1,R2,R3,FAR][(x/12)|0]}
  var frames=null; // 5 × Uint32Array(32*32), sampled from the @2x strip (128 px per frame → every 4th px)
  sprite.decode().then(function(){ if(now()>300)return; var o=d.createElement('canvas');o.width=160;o.height=32;
    var oc=o.getContext('2d');oc.imageSmoothingEnabled=false;
    oc.drawImage(sprite,0,0,640,128,0,0,160,32); // frames 1–5
    var a=new Uint32Array(oc.getImageData(0,0,160,32).data.buffer);frames=[];
    for(var f=0;f<5;f++){var fr=new Uint32Array(1024);for(var y=0;y<32;y++)for(var x=0;x<32;x++){
      var v=a[y*160+f*32+x];fr[y*32+x]=(v>>>24)>=128?(v|0xff000000)>>>0:0}frames.push(fr)}
  },function(){});
  function spriteSrc(f){return function(x,y){return frames[f][y*32+x]}}
  function row(k,s,v){var li=host.querySelector('[data-k='+k+']');if(s)li.setAttribute('data-s',s);li.lastChild.textContent=v}
  requestAnimationFrame(function(){row('display','ok',innerWidth+'×'+innerHeight)});
  // TYPE, PATCH, WAVE are event-driven
  var fam=getComputedStyle(d.body).fontFamily.split(',')[0],typeOk=false;
  d.fonts&&d.fonts.load('400 14px '+fam).then(function(l){if(l.length){typeOk=true;row('type','ok','FOCAL')}},function(){});
  function wave(det){row('wave',det&&det.webgl===false?'warn':'ok',det&&det.webgl===false?'STATIC':'WEBGL')}
  if(w.__wzrdDitherReady)wave(w.__wzrdDitherReady);else addEventListener('wzrd:dither-ready',function(e){wave(e.detail)},{once:true});
  var late=R.t0>300,did={};
  function once(k,fn){if(!did[k]){did[k]=1;fn()}}
  (function frame(){var t=now();
    if(!clr){ // phase paints stop for good once any clear has started
      if(!late&&t>=100&&t<300)resolve(STRIP,stripSrc,(t-100)/200); if(t>=300||late)once('strip',function(){resolve(STRIP,stripSrc,1)});
      if(frames&&!late&&t>=300&&t<600)resolve(SPR,spriteSrc(0),(t-300)/300);
      if(frames&&!late&&t>=600&&t<1000)resolve(SPR,spriteSrc(1+(((t-600)/100)|0)%4),1);
      if(t>=600&&t<900)resolve(MARK,maskSrc,(t-600)/300);
      if(t>=900)once('img',function(){resolve(MARK,maskSrc,1);markEl.classList.add('on')});
      if(t>=1020)once('glint',function(){resolve(MARK,function(){return 0},1);glint.classList.add('go')});
    }
    if(t>=300||late)once('post',function(){host.classList.add('post');
      row('theme','ok',H.classList.contains('dark')?'DARK':'LIGHT');
      row('patch',host.getAttribute('data-convex')==='1'?'ok':'warn',host.getAttribute('data-convex')==='1'?'CONVEX':'NOT PATCHED')});
    if(t>=400&&!typeOk)once('type',function(){row('type','warn','FALLBACK')});
    if(t>=1200)once('hand',function(){startClear(1200,360);host.classList.add('out');
      if(!R.interrupted)flipToBug()});
    if(clr)clearReverse((t-clr.t)/clr.dur);
    put();
    if(t>=1584||(clr&&t>=clr.t+clr.dur&&R.interrupted))return finish();
    raf=requestAnimationFrame(frame)})();
}catch(e){finish()}
})(__MASK_L__,__MASK_S__)
```

The sketch encodes these rules:
- Every DOM write is a class or text change.
- There is no `console.*` anywhere.
- `Uint32Array` pixels assume little-endian `0xAABBGGRR`, which holds on every target platform.
- The WAVE row stays hollow when nothing arrives, because it is simply never written.
- The late-start branch (`late`) paints the strip at once and skips the sprite. Only an unforced visit with `T0 > 600` converts to the flip.
- The strip image is requested only in `post` mode, immediately after the gates (as early as a preload would be).
- Once a clear has started, no phase writes to the pixel buffer; only `clearReverse` and `put()` run (§6.2.7).
- A pointer-initiated interrupt swallows the next `click` (removed after 1000 ms); a key-initiated one lets the key through.
- The post terminal check is `t >= 1584`, the FLIP runs 384 ms and the flip's clear ends at 224 ms.
- `finish()` is idempotent. It also runs from the `try/catch`, the safety timeout and the interrupt path.

> Note: this sketch, minified by next's terser with masks derived from `public/wzrdtechlogo.png`, was run in headless Chromium 1194 at 1440×900 against the §6.2.13 markup and CSS. Post `tEnd` 1588–1601 ms (6 runs), flip `tEnd − t0` 233–250 ms (6 runs), interrupt removal 206 ms after the key, transparent share inside the mark box 12.5% against 12.6% outside at 50 ms, clicks at 500 ms and 1300 ms over a button never reached it, reduced-motion `tEnd − t0` 401 ms, CLS 0, no console entries in `?boot=1`, `?boot=flip` or `?noboot`, and no strip request outside `post` mode.

#### 6.2.15 Test hooks

| Hook | Effect |
|---|---|
| `?noboot` | Skip; nothing is recorded in `sessionStorage` |
| `?boot=1` | Force the first-visit POST even under `navigator.webdriver`; no `sessionStorage` write |
| `?boot=flip` | Force the channel flip; no `sessionStorage` write |
| `?boot=auto` | Real gates, bypassing only the `navigator.webdriver` skip |
| `window.__wzrd.boot` | `{ mode: 'post'\|'flip'\|'static'\|'skip', t0, tEnd, interrupted }`, present in development **and** production |

### 6.3 Route loading (`loading.tsx`)

Exactly **7** route segments get a `loading.tsx`, all created in 4D. Each is a **server component** that renders a layout-exact skeleton (§6.8) with a `<CoastLoader>`, and appears only after 150 ms. Live Control lives in the route group `app/admin/(live)/` so that its loading boundary wraps only its own page: in the App Router, a segment's `loading.tsx` is the Suspense fallback for its whole `children` slot, so an `app/admin/loading.tsx` would show 'Loading Live Control' while any sibling route suspends. 4D therefore runs `git mv app/admin/page.tsx 'app/admin/(live)/page.tsx'` (from `dashboard/`; the page's import becomes `../../../components/DirectorPanel`); the URL stays `/admin`.

| File | Skeleton (`components/states/skeletons/`; interim until) | CoastLoader placement (`size={64}`) | Caption (visible, `caption` `text-3`) |
|---|---|---|---|
| `app/admin/(live)/loading.tsx` | `LiveSkeleton` (`RouteSkeleton` until 8B) | Centred in the program-monitor `bg-screen` block | Loading Live Control |
| `app/admin/shotboard/loading.tsx` | `ShotboardSkeleton` (`RouteSkeleton` until 9A) | Centred in the track-canvas block | Loading Shotboard |
| `app/admin/characters/loading.tsx` | `StudioSkeleton` (final from 4D) | PageHeader actions slot (right) | Loading Characters |
| `app/admin/locations/loading.tsx` | `StudioSkeleton` (final from 4D) | PageHeader actions slot | Loading Locations |
| `app/admin/clips/loading.tsx` | `ClipsSkeleton` (`RouteSkeleton` until 11A) | PageHeader actions slot | Loading Clips |
| `app/admin/recordings/loading.tsx` | `RecordingsSkeleton` (`RouteSkeleton` until 11B) | PageHeader actions slot | Loading Recordings |
| `app/admin/analytics/loading.tsx` | `AnalyticsSkeleton` (`RouteSkeleton` until 11C) | Right-aligned in the KPI row directly below the 56 px ON-AIR strip block (a 64 px loader does not fit inside the strip) | Loading Twitch Analytics |

- **No `loading.tsx` may exist at `app/admin/` or `app/admin/visual-test/`:** a Suspense boundary above a `notFound()` page downgrades the production 404 to a streamed 200.
- There is no `app/admin/(live)/layout.tsx`: the `/admin` title comes from `app/admin/layout.tsx` (§7.7).
- The page chapters swap in their composition in the part named in the table (8B, 9A, 11A, 11B, 11C); each swap changes only the skeleton import and element.

Every file follows this shape (4D form first, final form second):

```tsx
// app/admin/clips/loading.tsx in 4D (interim)
import CoastLoader from '@/components/brand/CoastLoader'
import RouteSkeleton from '@/components/states/skeletons/RouteSkeleton'

export default function Loading() {
  return (
    <div className="route-fallback" aria-busy="true">
      <RouteSkeleton title="Clips" loader={<CoastLoader size={64} label="Loading Clips" />} />
    </div>
  )
}
```

```tsx
// app/admin/clips/loading.tsx from 11A (final)
import CoastLoader from '@/components/brand/CoastLoader'
import ClipsSkeleton from '@/components/states/skeletons/ClipsSkeleton'

export default function Loading() {
  return (
    <div className="route-fallback" aria-busy="true">
      <ClipsSkeleton loader={<CoastLoader size={64} label="Loading Clips" />} />
    </div>
  )
}
```

- **Delayed appearance:** the `.route-fallback` class (CSS text: §5.14) starts at opacity 0 and runs `appear` after a 150 ms delay. Navigations that resolve within 150 ms never show the fallback. This is CSS only, so it works before hydration.
- **CoastLoader** (§7.5): the 8-frame strip at 10 fps. Under reduced motion or the air lock, it shows frame 1 as a still. `role="status"` sits on the loader, and its visible caption is its accessible name.
- **Geometry:** every skeleton mirrors the real page's DOM geometry at every breakpoint. The page sections §8–§11 define the geometry, and the skeleton files import the same layout constants. When content replaces the fallback, nothing shifts.
- **Hand-off to content:** when the fallback was visible, content replaces it with a cut. Do not add `.px-resolve` to page roots: it would nest inside the template's resolve (§6.4.1), and nested masks compound to 6/25/56/100%.

### 6.4 Route transitions

#### 6.4.1 Enter: `app/admin/template.tsx`

```tsx
// app/admin/template.tsx (server component)
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="px-resolve">{children}</div>
}
```

- The template remounts on every admin route change, so `.px-resolve` (§5.14) plays once per navigation: `--bayer-4-03` → `-07` → `-11` → `-15` → `mask-image:none`, 4 × 40 ms, `steps(1,end)`, `animation-fill-mode: both`. There is no translate, and CLS is 0. The old page is cut, not faded.
- The resolve plays on whatever the segment renders first: the page, or the fallback, which is itself invisible for its first 150 ms.
- **Browsers without `mask-image`:** an `@supports not` fallback runs `opacity 0 → 1` over 120 ms (§5.14).
- **Reduced motion or air lock:** no transition (CSS in §5.14; behaviour table in §6.15).
- The template must not remount `DirectorPlayer` on same-route changes. `TwitchBroadcast` strips `?code&state` with `history.replaceState`, which is not a Next navigation. The single `<video>` element must be the same node before and after (§6.16).
- `app/admin/template.tsx` and RouteProgress (§6.4.3) land in 4B.

#### 6.4.2 Nav indicator

```tsx
// inside components/shell/AppNav.tsx
import { LayoutGroup, motion } from 'motion/react'        // motion 13.2.0 (verified)
import { useReducedMotion } from '@/hooks/useReducedMotion' // the live hook, not motion's
import { DUR, EASE } from '@/lib/motion/tokens'
import { useLeaveGuard } from '@/lib/leaveGuard'

const reduced = useReducedMotion()                          // call every hook unconditionally
const locked = useBroadcast(deriveLock)
const guard = useLeaveGuard()
const instant = reduced || locked
<LayoutGroup id="appnav">
  {tabs.map(({ href, label, icon: Icon }) => {
    const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
    return (
      <Link key={href} href={href} aria-current={active ? 'page' : undefined} onNavigate={guard(href)} className="nav-link">
        <LinkPending />
        <Icon size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        <span className="nav-label">{label}</span>
        <i className="nav-led" data-on={active || undefined} aria-hidden />
        {active && (
          <motion.span layoutId="nav-indicator" data-nav-indicator initial={false} aria-hidden
            className="nav-indicator"
            transition={instant ? { duration: 0 } : { duration: DUR.base / 1000, ease: EASE.out }} />
        )}
      </Link>
    )
  })}
</LayoutGroup>
```

| Part | Spec |
|---|---|
| `.nav-indicator` | `position:absolute; left:12px; right:12px; bottom:0; height:2px; background:rgb(var(--c-accent))` with the 50% Bayer mask (`--bayer-4-07`, 8 px tile). Motion animates `transform` only (layout projection), over `DUR.base` (200 ms) with `EASE.out`. No initial animation. CSS: `app/styles/shell.css` (§7.8) |
| `.nav-led` | 6×6 `rounded-lamp`, absolutely positioned at `top:6px; right:6px`, so it adds no width. `opacity:0`; `[data-on]` → `opacity:1` with `transition: opacity var(--dur-tick) steps(1,end)`. CSS: `shell.css` (§7.8) |
| Reduced motion, air lock | The bar jumps (`duration: 0`) |
| Retired bug | The per-link `border-b-2` underline and its `.dark *` cascade bug are gone (`AdminNav.tsx:28-32`) |

#### 6.4.3 RouteProgress (`components/shell/RouteProgress.tsx`)

RouteProgress is driven by real pending state from `useLinkStatus()` (verified in `next/link` 15.5.2), with no new dependency.

```tsx
// module-level pending counter shared by every nav Link and AppNav's own transition
const subs = new Set<() => void>(); let count = 0
export const routeProgress = {
  begin() { count++; subs.forEach(f => f()); let done = false
    return () => { if (!done) { done = true; count--; subs.forEach(f => f()) } } },
  subscribe(f: () => void) { subs.add(f); return () => subs.delete(f) },
  get: () => count,
}
export function LinkPending() {           // must render inside <Link> (useLinkStatus requirement)
  const { pending } = useLinkStatus()
  useEffect(() => (pending ? routeProgress.begin() : undefined), [pending])
  return null
}
```

`AppNav`'s guarded navigation (palette "Go to", Alt+1…7) runs `router.push` inside its own `startTransition` and feeds `isPending` into `routeProgress.begin()` the same way.

| Phase | Spec |
|---|---|
| Element | `<div class="route-progress" aria-hidden>` on the **bottom edge of the CommandBar** (inside it, `position:absolute; bottom:0; left:0; right:0; height:2px; overflow:hidden`; CSS in `shell.css`, §7.8). It has two children: `.rp-fill`, a solid `rgb(var(--c-accent))` bar with `transform-origin: 0 50%`, and `.rp-edge`, a 24×2 px block in `--c-accent` under the 50% Bayer mask (`--bayer-4-07`), positioned at `left:0`. With `W` = the bar width and progress `s`, the fill is `scaleX(max(0, (s·W − 24) / W))` and the edge is `translateX(s·W − 24 px)`. The dithered edge therefore leads the solid fill without being scaled |
| Pending > 120 ms | Show (opacity 1). WAAPI on both children, with the same timing: `s` from .1 to .9 over 2400 ms, `easing: 'steps(16, end)'`, `fill: 'forwards'`, then hold |
| Pending ends before 120 ms | Nothing shows (cancel the timer) |
| Pending ends after showing | `commitStyles()` then `cancel()` on both animations. Animate `s` from its current value to 1 over `DUR.fast` (120 ms) `linear`, then opacity 1 → 0 over `DUR.fast`, then reset |
| Reduced motion | While pending > 120 ms: a static full-width bar under the 50% Bayer mask, removed when pending ends |

### 6.5 Signal acquisition (Director connect → first decoded frame)

The Live Control monitor (§8) tells the truth about the connect. The overlay stays up until the **first decoded frame**, not until the transport reports `live`. Today it disappears at transport live (`DirectorPlayer.tsx:1085`).

| Store state (§7.17) | `data-broadcast` | Monitor screen | Carrier |
|---|---|---|---|
| `director: 'idle'`, or `'closed'` after the first frame | `idle` | Standby slate (§8) over `SymbolRaster` at `density=1` (the full standby image, id `` `standby/coast-${aspect.replace(':', 'x')}` ``, for example `standby/coast-16x9`), painted once per resize or theme change | standby (.04) |
| `director: 'opening'`, `connectStep` 0 | `connecting` | Raster cuts to `density=.10`; connect plate appears | Tuning (.055) |
| `connectStep` 1 / 2 / 3 / 4 | `connecting` | Raster steps to `.25` / `.40` / `.60` / `.80`, repainting **only on step change** (no rAF loop) | Tuning |
| `director: 'live'`, `firstFrame: false` | `connecting` | Unchanged: plate and raster stay | Tuning |
| First decoded frame | `preview` | Raster clears in reverse Bayer-8 order over 320 ms (rAF, slot owner at priority 3, §7.16), then the canvas unmounts. The PVW lamp lights (160 ms resolve). SelectionBrackets tighten 4 px once (200 ms) | standby |
| `director: 'failed'`, or `'closed'` before the first frame (the SDK dropped the connect) | `idle` | Raster returns to `density=1` with no animation; the failed slate (§8) renders; 'Start Director' is restored (`!live && !busy`) | standby |

**Connect plate** (`surface-hud`, bottom-left, 16 px inset, `data-air-allow`):
- A vertical `StageTrack` (`tone="hud"`, `decryptActive`; API §12.3.6, call site §8) of the five **verbatim** `CONNECT_STEPS` (`DirectorPlayer.tsx:54-60`): 'Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene'. Done = `success`, active = `accent` (steady), pending = `border-control`.
- The active label decrypts once, in ≤ 320 ms, through StageTrack's `decryptActive` (§12.3.5, §12.3.6). The final text is in the DOM from the first frame.
- `T+00:07.4` in `readout` `text-on-screen`, updated at 10 Hz by the shared ticker (§7.2), which writes `textContent` on a ref (no React render).
- The latest `onDiagnostic` detail line in `code` `text-on-screen`, one line, ellipsised.
- A button whose accessible name is exactly **'Cancel'**, calling `disconnect()`, with an `aria-hidden` `<Kbd keys={['Esc']} />` beside it. Esc runs the same action through the `director.cancel` command (§7.12).
- The plate renders only while `director === 'opening' || (director === 'live' && !firstFrame)`. This also fixes the stale plate after an SDK `closed` (`DirectorPlayer.tsx:1087`).

**First-frame gate** (`components/director/firstFrame.ts`, created in 8A; its wiring into the session hook is §8.5.6). Arm it immediately after `videoRef.current.srcObject = output` (`DirectorPlayer.tsx:964`):

```ts
function armFirstFrame(video: HTMLVideoElement, onFrame: () => void): () => void {
  let done = false; const fire = () => { if (!done) { done = true; onFrame() } }
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    const id = video.requestVideoFrameCallback(fire)
    return () => video.cancelVideoFrameCallback(id)
  }
  video.addEventListener('loadeddata', fire, { once: true })
  video.addEventListener('playing', fire, { once: true })
  return () => { video.removeEventListener('loadeddata', fire); video.removeEventListener('playing', fire) }
}
// onFrame → broadcast.publish({ firstFrame: true }); connect() and disconnect() publish { firstFrame: false }
```

**Reduced motion:** a static segmented StageTrack, no DecryptedText, and a 150 ms WAAPI opacity crossfade from raster to video (no reverse-Bayer clear; §6.14).

### 6.6 Generation resolve (images)

`GenerationFrame` (§7.5) is **CSS only** (no canvas). It fills the existing aspect box and is driven by real status, so any number can run at once. The `onStatus` plumbing, `IMAGE_MODEL_ETA_MS` and GenerationFrame land in 5B.

**Status plumbing in `lib/imageGen.ts`** (D7: endpoints and inputs unchanged):

```ts
export type GenStatus =
  | { phase: 'queued'; position: number }
  | { phase: 'running'; log?: string }       // latest RequestLog.message, if any
  | { phase: 'done' }

export async function generateImages(args: {
  modelId?: string | null; mode?: 't2i' | 'edit'; prompt: string; refImages?: string[]
  aspectRatio?: string; quality?: string; options?: ImageGenerationOptions
  onStatus?: (s: GenStatus) => void                                  // NEW, optional
}): Promise<string[]> {
  // … model / mode / buildImageInput exactly as today (lib/imageGen.ts:24-35) …
  let last = ''
  const emit = (s: GenStatus) => {
    const k = s.phase + ('position' in s ? s.position : '') + ('log' in s ? (s.log ?? '') : '')
    if (k !== last) { last = k; args.onStatus?.(s) }
  }
  const res = (await fal.subscribe(endpoint, {
    input,                                                           // unchanged
    logs: true,                                                      // NEW (allowed by invariant 8)
    onQueueUpdate: (u) => {                                          // NEW
      if (u.status === 'IN_QUEUE') emit({ phase: 'queued', position: u.queue_position })
      else if (u.status === 'IN_PROGRESS') emit({ phase: 'running', log: u.logs?.at(-1)?.message })
      else if (u.status === 'COMPLETED') emit({ phase: 'done' })
    },
  })) as FalImagesResult
  // … url extraction exactly as today (lib/imageGen.ts:37-39) …
}
```

- `generateImage(args)` passes `onStatus` through unchanged. Callers that omit `onStatus` behave exactly as they do today.
- `onQueueUpdate` fires on every poll (every 500 ms by default). The `emit` dedupe forwards only phase, position or log changes, so the running `log` reaches callers at most once per poll. §10 decides whether the Darkroom shows it.
- The library pipelines (Characters, Locations) prepend `saving` and `expanding` around their existing persist and expand calls, and append `uploading i/n` for each upload. They must not reorder the invariant pipeline (persist → validate → expand → fingerprint → startGeneration → generateImages → upload → complete/fail).

**ETA table** in `lib/imageModels.ts`:

```ts
/** Defaults until measured. Measuring requires paid calls, which Devin must not make (goal.md §1.8); a human updates these. */
export const IMAGE_MODEL_ETA_MS: Record<string, number> = { 'nano-banana': 12_000, 'gpt-flare': 20_000, 'gpt-sunburst': 30_000 }
export const etaFor = (id: string) => IMAGE_MODEL_ETA_MS[id] ?? 20_000
```

**Layers** (bottom to top, all `position:absolute; inset:0` inside the aspect box):

| # | Layer | Spec |
|---|---|---|
| 1 | Screen | `bg-screen` |
| 2 | Previous image (edit mode) | `previousUrl` at opacity .35, `filter: grayscale(1) contrast(1.2)` (static, never animated) |
| 3 | Field | The element carries `data-gf-field`. `background: rgb(var(--c-ramp-3))`, `mask-image: var(--gf-tile)` with 8 px tiles; `--gf-tile` is set inline on the field to `var(--bayer-4-NN)` |
| 4 | Scanline (running only) | `.gen-scan` (§5.14): 2 px `--c-accent` line, `translateY` in `steps(16,end)` over 1600 ms, infinite |
| 5 | Plates | `surface-hud`, `micro`, `text-on-screen`. Top-left: `modelLabel` as authored in `IMAGE_MODELS` (`Nano Banana 2`, `GPT Image 2.5 Flare`, `GPT Image 2.5 Sunburst`). Bottom-left: the phase readout |

The frame root sets `data-generation-frame`, and inline sets `--c-ramp-3: 122 165 224; --c-accent: 122 165 224; --c-danger: 255 107 107`. The field and scanline therefore use the dark (screen) values in both themes: screen material is theme-invariant (§4), so its ink must be too.

**Compact frames.** The frame root is a size container (`container-type: inline-size`, Tailwind `[container-type:inline-size]`), so track-size pictures (90–128 px wide, §9) fit. At `@container (max-width: 199px)` (Tailwind variant `[@container_(max-width:199px)]:`; no stylesheet):
- the model plate is hidden;
- the readouts use the compact forms `Q 03`, `00:03.2` (elapsed only, no ETA), `UP 1/2` and `SAVED`; `queued` with no position keeps `QUEUE --`, which reads the same at every size;
- `failed` shows `SIGNAL LOST`, and the reason moves to the frame's `aria-label` (the host's inline alert also carries it);
- Retry is icon-only (`RotateCcw`), and its accessible name stays 'Retry';
- plates have `max-width: calc(100% - 8px); overflow: hidden; text-overflow: ellipsis`.

The long and compact readouts are two spans in the same plate; exactly one is displayed at any width.

**Density by phase:**

| Phase | Tile (`--bayer-4-NN`) | Readout | Changes |
|---|---|---|---|
| `saving` | `01` (2/16) | `SAVING` | DecryptedText on entering the phase |
| `expanding` | `01` | `EXPANDING` | DecryptedText on entering the phase |
| `queued` | `02` (3/16), **static, no blink** | `QUEUE 03` (2-digit position); `QUEUE --` while `queuePosition` is undefined, at every size | Text changes only when `position` changes |
| `running` | `N = clamp(round(d(t)·16) − 1, 2, 12)` | `RENDER 00:14.2 · ~00:22`. Once elapsed ≥ ETA: `RENDER 00:25.1` (the ETA segment is dropped, never faked) | Field and readout update ≤ 4 Hz via the shared ticker |
| `uploading` | `13` | `UPLOAD 2/4` | Per upload |
| `done` | The field stays at the last tile until the `src` prop (the landed image) is set and `await img.decode()` resolves. Then the real `<img>` renders with `.px-resolve` (160 ms) and the field unmounts | `SAVED` for 900 ms, then the plates unmount | Once |
| `failed` | Freezes at `03`, colour `rgb(var(--c-danger))` | `SIGNAL LOST · <reason>` (one line, ellipsised) plus `<Button size="sm" variant="secondary">Retry</Button>` | Renders the persisted `imageStatus: 'failed'`, which is never shown today |

**Running density:** `d(t) = 0.12 + 0.73 · (1 − e^(−t/τ))`, with `τ = etaFor(modelId) / 2.3` and `t` = ms since the `running` phase began.

| t / ETA | 0 | 0.25 | 0.5 | 1.0 | 1.5 | 2.0 |
|---|---|---|---|---|---|---|
| d(t) | 0.12 | 0.44 | 0.62 | 0.78 | 0.83 | 0.84 |
| tile N | 2 | 6 | 9 | 11 | 12 | 12 |

The field never reaches `15` before the image exists.

**Accessibility:** `aria-busy="true"` on the aspect box until the phase is `done` or `failed`. One `announce()` per phase change: 'Saving', 'Expanding prompt', 'Queued, position 3', 'Rendering', 'Uploading 2 of 4' and 'Saved' are polite; 'Generation failed: <reason>' is assertive. Queue-position changes are not announced. The `announce` prop gates this: `'all'` (default) announces every phase; `'progress'` announces every phase except the failure (for hosts that render their own inline `role="alert"`); `'none'` announces nothing (for the second and later frames of a batch, so one batch speaks once).

**Reduced motion:** a static 25% field (`03`) plus the phase text, with no scanline and no DecryptedText, and a 150 ms WAAPI opacity crossfade on land (§6.14).

### 6.7 Going ON AIR

The public state is the most consequential signal in the product. Only the WHIP truth gate drives its lamp.

**Air state machine** (field `air` of the broadcast store, §7.17). This table is the only description of the states and how each one looks. The algorithm that moves between them, its publishers and its tests are §8.5.6.

| `air` | Entered when | TallyBar ON AIR lamp | Program keyline (§8.4.4) | `data-broadcast` / house lights | Title and favicon | Announce | Transport button |
|---|---|---|---|---|---|---|---|
| `off` | Initial; 3 s after `offair`; or `cue` failed (next row) | Unlit `OFF AIR` (`tally-off` ring, `text-on-screen-2`) | none | Unchanged (`idle`, `connecting` or `preview`) | default | — | `Go live on Twitch` (HoldButton) |
| `cue` | The operator commits (the hold completes or the dialog is confirmed) | **Steady** amber `CUE` ring | none | `preview` | default | — | `Negotiating…` (width-locked, pending) |
| `cue` → `off` | Negotiation failed (`connectionState` becomes `failed` or `disconnected`, or the negotiation throws), or 10 000 ms pass after the session arrives with no truth gate. A `cue` session never becomes `stalled` | Cut back to unlit `OFF AIR` | none | Unchanged (`preview`) | default | Via the cue-failure chyron's `role="alert"` (strings: §8.9.6) | `Go live on Twitch` |
| `on` | Truth gate true | Resolves in 4 steps over 160 ms to a solid `#FF3B30` face with the `tally-ink` label `ON AIR` | 2 px `tally-program` ring on the bezel's **outer** edge, cut in (no transition). The picture is never touched | `on-air`: veil .62 (dark) / .72 (light), speed .02, tweened over 1200 ms | `● ON AIR · stream.wzrd.tech admin`; every `link[rel~="icon"]` → `/brand/icons/favicon-onair.svg` | `announce('On air', 'assertive')` | `Stop broadcast` (danger outline) |
| `stalled` | `air` is `on` and `connectionState` becomes `failed`/`disconnected`, or `bytesSent` is flat for 4 consecutive 1 s polls (§8.5.6) | `STALLED 00:06` (MM:SS since `stalledSince`), hatched red, `led-stall` 1 Hz × 5, then steady. **Never** reads ON AIR | removed (cut) | stays `on-air` (no retint mid-incident) | kept | Via the stalled chyron's `role="alert"` | `Stop broadcast` |
| `on` (recovered) | Truth gate true again | ON AIR | cut in | `on-air` | kept | `announce('On air again', 'polite')` + status message | `Stop broadcast` |
| `offair` | Stop broadcast, the Director session ends, or WHIP fails while stopping | Resolves back to a hollow `OFF AIR` at full `text-on-screen`, held 3 s | none | `preview` (or `idle`): house lights come up over 1200 ms | Restored to the values saved at `on` | — | `Go live on Twitch` |

> Note: bible §2.3 defines `data-broadcast="on-air"` as "truth gate true". This spec keeps `on-air` during `stalled`, so the carrier does not retint twice during an incident ("Information may move, decoration may not"). The lamp, the chyron and the TWITCH LED carry the stall, and the keyline is cut so the monitor stops claiming a clean program feed.

**Preconditions.** `data-broadcast="preview"` and a stream key ready. Otherwise the HoldButton is `aria-disabled="true"`: still focusable, but activation is ignored. Its Tooltip shows the existing `title` text 'Start the Director session first' (`TwitchBroadcast.tsx:205`). The live-state title 'Push the live Director output to Twitch ingest' is kept too.

**Hold-to-take** (`HoldButton`; §7.3 owns the keyboard and pointer model):

| Input | Result |
|---|---|
| Pointer held ≥ 600 ms, or Space/Enter held ≥ 600 ms while focused | Commit → `air='cue'` |
| Released after 200 ms but before 600 ms | Cancel; the ring resets instantly |
| A press shorter than 200 ms, or an assistive-technology activation (a `click` with `detail === 0` that no HoldButton-handled keydown preceded within 50 ms) | Opens the go-live ConfirmDialog (below) |
| Reduced motion | No ring animation and no hold: every activation opens the dialog |

Enter and Space never reach the native `click`: HoldButton's keydown handler calls `preventDefault()` and starts the hold (§7.3). An Enter press shorter than 200 ms therefore opens the dialog instead of firing a click.

**Go-live dialog** (strings listed in §8.9.6; §8.6.5 step 2 states the same rule): title 'Go live on Twitch?'. When `auth` exists (its key is the one used), the body is 'Viewers on twitch.tv/{auth.login} will see program output.' When the pasted key is used (`!auth`), the body is always 'Viewers on the channel bound to this stream key will see program output.' The body never names `NEXT_PUBLIC_TWITCH_CHANNEL`, which may not be the channel bound to a pasted key. Confirm 'Go live', cancel 'Not yet'. The markup order is body, 'Not yet', 'Go live', and 'Not yet' receives the initial focus (§7.3 ConfirmDialog), so a held or repeating Enter from the activating press can never confirm.

The ring is a 20 px SVG circle (`r=8`, stroke 2 px, `stroke-dasharray = 2πr`) whose `stroke-dashoffset` runs from `2πr` to 0, `linear`, over 600 ms. Its stroke is `rgb(var(--c-accent))` over a `--c-border-control` track. It replaces the Radio icon inside the button.

**Truth gate** (`lib/broadcast/useWhipTruth.ts`, created in 8C; a wrapper only, `lib/twitchWhip.ts` is never edited). Signature: `useWhipTruth(session: WhipSession | null, onNegotiationFailed: () => void): void`. Algorithm (the pure `nextAir` reducer, the stall and negotiation-failure rules, `whip` publishing), publishers and tests (`tests/whip-truth.spec.ts`): §8.5.6. Publisher summary: §7.17.

**Stalled.** `BroadcastProvider` (§7.6, 4B) is the **only** publisher of the stalled chyron:
- A **sticky chyron** with `tone:'error'` (`role="alert"`) and the title 'Twitch ingest lost'. A counter `· 00:00:04` (`HH:MM:SS` since `stalledSince`) sits inside an `aria-hidden` span, so the alert is announced once rather than every second. The action is labelled **'End broadcast'** and runs `commands.run('twitch.stop')`. `useTwitchBroadcast` registers `twitch.stop` (`palette: false`, `run: stopBroadcast`) in 8C.
  > Note: bible §5.5 labels this action "Stop broadcast". 'Stop broadcast' is the transport control, and two buttons with the same role and name break the admin-testing uniqueness rule. The chyron action is therefore 'End broadcast'; it runs the same stop.
- The program keyline is cut (§8.4.4). The StatusRail TWITCH LED shows danger (§7.10).
- On recovery, the chyron is dismissed, the keyline cuts back in, `statusMessage.set({ tone:'success', text:'On air again' })` runs, and a polite announcement plays.

**Cue failure.** On `cue` → `off`, `useTwitchBroadcast` tears the WHIP session down without publishing `offair` and pushes the cue-failure chyron: `tone:'error'`, title "Couldn't start the Twitch broadcast", body 'Twitch ingest never received media. Try again.' (strings listed in §8.9.6). The lamp never reads STALLED for a show that never went on air.

**Off air:** the house lights come up over 1200 ms, the title and favicon are restored, and `statusMessage.set({ tone:'info', text: 'Off air · ' + tc(aired) })` runs (for example "Off air · 01:12:44", with `aired = now − airSince`).

**Rules:** no sound, no glow, no pulse. **Reduced motion:** every lamp change is a cut, the stall lamp is steady, and the veil and speed change instantly.

**New strings (§6.7)**, byte-for-byte:
- Lamp words: `OFF AIR`, `CUE`, `ON AIR`, `STALLED {MM:SS}`.
- Document title while on air: `● ON AIR · stream.wzrd.tech admin`.
- Stalled chyron: title 'Twitch ingest lost', the counter `· {HH:MM:SS}`, action 'End broadcast'.
- Announcements: 'On air' (assertive), 'On air again' (polite).
- Status messages: 'On air again', 'Off air · {HH:MM:SS}'.
- Used here but listed in §8.9.6: the go-live dialog strings and the cue-failure chyron.

### 6.8 Skeletons

`.skeleton-dither` (full CSS in §5.14):
- **Base field** on `::before`: `rgb(var(--c-ramp-3) / var(--a-skel))` under the `--bayer-4-03` mask (25%).
- **Sweep** on `::after`: 300% wide, the same colour, masked by `--bayer-4-07` **intersected** with `linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent)` (`mask-composite: intersect`; `-webkit-mask-composite: source-in`). It animates `translateX(-66%) → translateX(0)` over 1400 ms `steps(28,end)`, infinite.
- **Reduced motion or air lock:** `::after { content: none }`, which removes the sweep and leaves a static 25% field. `content: none` is the only hiding mechanism, under both conditions (§5.14).

> Note: the bible puts the base mask on the element itself. A mask on the host also clips its `::after`, so the 50% sweep could never exceed the host's 25% cells. The base field therefore moves to `::before`, and the host itself is unmasked.

**Primitive:** `<Skeleton shape="text"|"media"|"block" lines? ratio? w? h?>` (§7.5). `shape="text"` renders `lines` bars 14 px tall in 20 px line boxes (the `body` metrics); `h` overrides the bar height (12 for `caption`, 16 for `body-lg`). The last bar of a multi-line block is 60% wide. `media` keeps `ratio`; `block` takes `w`/`h`.

**Timing (in-page):** `const show = useDelayedFlag(loading, { delayMs: 150, minMs: 300 })`. A ref records whether the skeleton was ever shown, and only then does the content root get `.px-resolve` (160 ms) on mount. Fast cache hits never flash and never resolve twice.

**Accessibility:** `aria-busy="true"` on the container while loading, plus one sr-only `role="status"` that names the content, for example "Loading clips".

**Placements:** one per route (§6.3), plus these in-page skeletons: the Characters/Locations sheet history, the TrackManager track list, the ScriptTemplatePicker while `boards === undefined` (today it flashes 'Open shotboard editor'), and the Characters roster. Each mirrors the real DOM geometry.

### 6.9 Pending buttons

Every async action uses `<Button pending pendingLabel>` (§7.3). This replaces all 10 `Loader2` render sites (§3.5).

| State | Visual | Semantics |
|---|---|---|
| idle | Label (and icon) | — |
| pending | `pendingLabel` in the same grid cell as the label, so the width is locked to the widest; a 12 px `BayerSpinner` (root `data-air-allow`, so it keeps running under the air lock) replaces the icon | `aria-busy="true"`, `aria-disabled="true"`, `data-state="pending"`; clicks are ignored; **never** native `disabled` (keeps focus) |
| success (900 ms) | `successLabel` (for example 'Saved', 'Sent') plus an 8 px success LED, then back to idle | `data-state="success"` |
| error | A 3-frame, 2 px x-jitter: `key-jitter` 180 ms (3 × 60 ms, `steps(1, end)`; CSS §5.14) in the `danger` tone, then idle | `data-state="error"` |
| Reduced motion | Success and error change colour only (no jitter) | — |

Width-locked pairs that exist today: 'Go live on Twitch'/'Negotiating…', 'Save source'/'Saving…', 'Capture frame'/'Capturing…', 'Remix frame'/'Remixing…', 'Send to Director'/'Preparing…', 'Connect to Twitch'/'Connecting…'. ChatSteerer's Connect, which gives no feedback today, gains `pendingLabel="Connecting…"`.

### 6.10 Chyrons

A chyron is the product's toast: a broadcast lower-third that resolves in and never slides.

| Property | Spec |
|---|---|
| Material | `surface-raised shadow-e2 rounded-sm sq`, with a 4 px left bar in the tone colour under the 50% Bayer mask |
| Content | An authored-uppercase kicker in `micro`: `INFO` (info), `SAVED` (success), `WARN` (warning), `ERROR` (error). Title and body in `body-sm`. An optional action (`Button size="sm" variant="ghost"`); a dismiss IconButton (label "Dismiss") on sticky and error chyrons; "Copy details" on errors |
| Enter / exit | Enter: 160 ms `px-resolve`. Exit: 120 ms opacity |
| Durations | info and success 5000 ms; warning 8000 ms; undo chyrons 8000 ms with an "Undo" action; errors are sticky. Hover or focus inside a chyron pauses its timer, and leaving resumes the remaining time |
| Roles | Notices `role="status"`, errors `role="alert"`. Existing library notices and errors keep their roles when they move into chyrons |
| Stack | At most 3 visible, newest on top, 8 px gap. A 4th dismisses the oldest non-sticky one. If all 3 are sticky, the 4th waits in a queue. A queued chyron is announced at once with `announce(title, tone === 'error' ? 'assertive' : 'polite')` (it is not in the DOM, so its role would never speak), and the oldest visible sticky chyron shows a `+{n} queued` badge in `micro` `text-fg-3` |
| Placement | §7.15 (per route and breakpoint) |
| Under the air lock | info, success and warning go to the StatusRail message slot (a cut, no motion). Errors still chyron and carry `data-air-allow` |

### 6.11 StreamList

`StreamList` (§12, the Animated List study) renders the direction queue, the chat log and the event console.
- New rows resolve over 120 ms (`--px-resolve-dur: 120ms`, 4 × 30 ms) with no slide. Each row carries `data-air-allow`.
- The stagger is 30 ms for up to 8 rows arriving in one commit; the rest arrive with the 8th.
- The list sticks to the newest row only when the user is already within 8 px of that edge. Otherwise it keeps the scroll position.
- No gradients, no arrow-key navigation, no hover transforms. Under reduced motion, rows appear instantly.

### 6.12 Air lock (`html[data-lock="air"]`)

The lock is set whenever `data-broadcast ≠ idle` or `data-rec` is present (§7.17). During a show, nothing in the operator's eyeline moves unless it is information.

| Allowed | Frozen or forbidden | Enforced by (CSS text: §5.14) |
|---|---|---|
| Lamp and LED state changes (one 160 ms resolve) | Skeleton sweep (static 25% field) | §5.14 air-lock block: `.skeleton-dither::after` gets `content: none` |
| Telemetry snapping at ≤ 1 Hz; the timeline playhead (linear `transform`) | CoastLoader (frame 1 still) | §5.14 air-lock block: `.coast-sprite > i` animation off |
| New queue, chat and event rows (120 ms resolve) | Route transitions | §5.14 air-lock block: `.px-resolve` animation off, unless the element is or sits inside `[data-air-allow]` |
| The STALLED lamp blink (≤ 5 cycles) | CountUp (final value), DecryptedText (final text), except CONNECT_STEPS during connecting | Hooks: `useBroadcast(deriveLock)`; the connect plate carries `data-air-allow` |
| The carrier retint (1200 ms, once per state change) | Any change of density, dock height or panel size | `useDensity().locked`; the dock collapse control, the palette's 'Collapse dock'/'Expand dock' and the density commands are disabled with the reason 'Locked while on air' |
| BayerSpinner inside a pending control (a pending operation is information) | GenerationFrame scanline | The BayerSpinner root carries `data-air-allow` (§7.3); §5.14 air-lock block: `:root[data-lock="air"] .gen-scan` animation off |
| Error chyrons | Floating info/success/warning chyrons (they go to the StatusRail) | `chyron.push` checks `deriveLock(broadcast.get())` |
| — | HoloCard tilt, HoverClip play, BrandVideo (poster only) | Hooks: `useBroadcast(deriveLock)` |
| — | Sheet and Dialog open/close animations (0 ms) | §5.14 air-lock block: `:is(dialog, [data-sheet])` animation and transition durations `0s !important` |
| — | Anything animating inside the monitor or within 24 px of it, except lamps and HUD readouts | Monitor components render static states when locked (§8) |
| — | Hover transforms anywhere; the nav indicator slide (it jumps) | Primitives never use hover transforms on Live Control; AppNav `instant` flag (§6.4.2) |

**Leaving Live Control under the lock** (`lib/leaveGuard.ts`, §7.2; 4A):
- Guarded callers use `const guard = useLeaveGuard()` and pass `onNavigate={guard(href)}` (the `onNavigate` prop is verified in Next 15.5.2): the AppNav Links, the palette's "Go to" commands and Alt+1…7 (4B), and both ScriptTemplatePicker Links, 'Open shotboard editor' (`ScriptTemplatePicker.tsx:101`) and 'edit' (`:128`), in 8C. The handler calls `event.preventDefault()` and requests confirmation when `pathname === '/admin'`, `deriveLock(broadcast.get())` is true and `href !== '/admin'`. `onNavigate` does not fire for modifier-clicks (new tab), which do not end the session.
- AppNav renders the single leave ConfirmDialog, `destructive` (strings listed in §8.9.6): title 'Leave Live Control?', body 'Leaving Live Control ends the Director session and the broadcast.', confirm 'Leave and stop', cancel 'Stay'. Confirm sets `pending` with `pendingLabel="Ending session…"`, runs `await broadcast.leave()`, then `router.push(href)`. 'Stay' closes the dialog and keeps the URL at `/admin`.
- `broadcast.leave()` awaits the handler that DirectorPlayer registers with `broadcast.setLeaveHandler(s.disconnect)` (8C; cleared on unmount), so the session ends through its own stop path before the route unmounts. The unmount path alone would discard an in-progress recording: `DirectorPlayer.tsx:1040` stops the recorder without the `onstop` handler that only `stopRecorder` attaches (`:283`). With no handler registered (before 8C), `leave()` resolves at once.
- While the lock is set, `BroadcastProvider` adds a `beforeunload` listener (`event.preventDefault(); event.returnValue = ''`). It also adds a `mouseup` listener that calls `preventDefault()` when `event.button === 3 || event.button === 4` (the mouse back and forward buttons).
- Browser Back via the keyboard or the toolbar cannot be vetoed without patching the Next router. Do not attempt it; record it in the PR's "Decisions" section.

**New strings (§6.12)**, byte-for-byte: 'Locked while on air', the only lock reason (dock collapse, the palette's 'Collapse dock'/'Expand dock', density; §7.11, §7.14 and §8 use it). No other lock-reason string exists.

### 6.13 Slates

**Anatomy:**

| Part | `size="route"` | `size="panel"` |
|---|---|---|
| Container | `surface-panel border border-line-subtle rounded-lg sq shadow-e1`, padding 24, max width 936, centred, 64 px below the header | Same material, padding 16, fills its panel |
| Art window | `bg-screen rounded-screen` 3:2, **384×256**, `/brand/slate/<id>.webp` (a 384×256 file, 2× the 192×128 master), `image-rendering: pixelated`, `alt=""` | **192×128**, same file (an exact 2:1 nearest downscale) |
| Kicker | `PixelFace` 2 px cell (14 px cap), `text-accent`, ≤ 3 words, real text in sr-only | Same |
| Title | The element and style follow `titleAs` (§7.5), not `size`: `h1` → `display-xl`; `h2` (default) → `title-lg` | Same |
| Body | One `body` line, `text-2` | Same |
| Actions | `Button`s (at most one primary) | Same |
| Layout | Two columns from `md` (art left, 24 px gap, text column max 480), stacked below | Two columns when the container is ≥ 480 px (`@container (min-width: 480px)`), stacked below |
| Entrance | One 160 ms `px-resolve` on mount. No loops | Same |

Slate text sits on the panel material, never on the veil (§5.4 colour law 5). A slate provides the route's `h1` only where no PageHeader exists (404, admin error: `titleAs="h1"`); under a PageHeader it stays `h2`, so it never outranks the page `h1`.

**Kinds:**

| `kind` | Kicker | Art id (`/brand/slate/<id>.webp`) | Used by |
|---|---|---|---|
| `standby` | STAND BY | — (the monitor uses `standby/coast-16x9`, `-9x16` or `-1x1`, computed as `` `standby/coast-${aspect.replace(':', 'x')}` ``, §8) | Live Control monitor (HUD plate variant) |
| `empty` (Shotboard) | BLANK BOARD | `shotboard` | §9 |
| `empty` (Characters) | OPEN CASTING | `characters` | §10 |
| `empty` (Locations) | NO SCOUTS | `locations` | §10 |
| `empty` (Clips) | NO FOOTAGE | `clips` | §11 |
| `empty` (Recordings) | NO TAPE | `recordings` | §11 |
| `empty` (Analytics) | NO DATA | `analytics` | §11 |
| `not-configured` | NOT PATCHED | `not-patched` | §9–§11 |
| `auth` | NO ACCESS | `no-access` | §9–§11 |
| `offline` | NO CARRIER | `signal-lost` | §11 (the OfflineBanner uses the kicker only) |
| `error` | SIGNAL LOST | `signal-lost` | `app/admin/error.tsx`, failed GenerationFrame plates (kicker only) |
| `not-found` | CH 404 | `not-found` | `app/not-found.tsx`, Shotboard `board: null` |

The 11th slate art, `slate/live-control` (a camera with an unlit tally), is available to §8. It has no kind in this table.

### 6.14 Reduced-motion mapping

Reduced motion is driven by the live `useReducedMotion()` hook (§7.2) plus the global reduced-motion rule, which lives only in `tokens.css` (§5.2). That rule is `@layer base` `!important`, so it outranks every later layer and the unlayered `BOOT_CSS`: under reduced motion every CSS transition and animation becomes a 1 ms cut. Where a reduced-motion fade must stay visible (the 150 ms crossfades below), run it with WAAPI, which the rule does not reach (§12.3.10).

| Effect | Default | Reduced | Mechanism |
|---|---|---|---|
| Carrier | ≤ 30 fps loop | One frame, no rAF loop; re-renders once on a theme or state change | `useReducedMotion` in DitherBackground (§12) |
| Boot | POST / flip | Static card for 250 ms, then its CSS fade (a 1 ms cut under the global rule); repeat visits skip | `matchMedia` in `BOOT_SCRIPT` |
| `px-resolve`, route enter | 160 ms mask steps | None | CSS `animation: none` |
| Skeleton | 25% field + sweep | Static 25% field | CSS `::after { content: none }` |
| BayerSpinner | 880 ms cycle | Static: squares at .6, the 2×2 centre at 1 | CSS |
| DecryptedText, CountUp | Scramble / count | Final text immediately | Hook |
| GenerationFrame | Ramp + scanline | Static 25% field + text, 150 ms WAAPI crossfade on land | Hook + CSS |
| Connect raster clear | 320 ms reverse Bayer | 150 ms WAAPI opacity crossfade | Hook |
| Lamp resolve, STALLED blink | 160 ms / 5 cycles | Cut; steady | CSS |
| House lights | 1200 ms | Instant | Global rule (transition 1 ms) + one carrier frame |
| Nav indicator | 200 ms slide | Jumps | `transition={{ duration: 0 }}` |
| RouteProgress | Stepped growth | Static bar while pending | Hook |
| CoastLoader, BrandVideo, HoverClip | Play | Still or poster | CSS + hook |
| HoloCard | Tilt + foil | Static foil at 35° | Hook |
| Sheets, dialogs | 320 / 160 ms | Instant | Global rule |
| HoldButton | 600 ms ring | Dialog only | Hook |
| Button success / error | LED / jitter | Colour only | CSS |

### 6.15 Keyframes and motion utilities

Implemented verbatim in §5.14: every `@keyframes` lives only in `app/styles/keyframes.css`, and every motion class lives in `app/styles/utilities.css`. This section is the usage map only; it holds no CSS. The one exception is `BOOT_CSS`, which owns every `boot-*` keyframe (§6.2.13). The Tailwind config is §5.15. §5.14 implements the keyframe bodies this chapter's motion needs: the 16-cell `bayer-blink` wave with its short peak, the three-frame `key-jitter`, and `px-resolve` with no per-keyframe timing functions (the class supplies `steps(1, end)`).

| Class (`utilities.css`) | Keyframe and timing | Used by | Reduced motion | Air lock |
|---|---|---|---|---|
| `.px-resolve` | `px-resolve`, 4 steps over `var(--px-resolve-dur, var(--dur-resolve))`, `steps(1, end)`, `both`; `px-fade` (`--dur-fast`) where masks are unsupported | Route enter (§6.4.1), skeleton → content (§6.8), slates (§6.13), generation land (§6.6), chyron enter (§6.10), lamp lit (§7.4); StreamList rows with `--px-resolve-dur: 120ms` (§6.11) | `animation: none` | `animation: none`, unless the element is or sits inside `[data-air-allow]` |
| `.route-fallback` | `appear`, 1 ms after a 150 ms delay | Every `loading.tsx` (§6.3) | Keeps its 150 ms delay (a delay is not motion) | Unchanged |
| `.skeleton-dither` | Static field on `::before`; `skeleton-sweep` on `::after`, 1400 ms `var(--steps-sweep)`, infinite | Skeleton (§6.8, §7.5) | `::after { content: none }` | `::after { content: none }` |
| `.bayer-spinner` | `bayer-blink` on each `> i`, 880 ms `steps(1, end)`, infinite, delay `calc(var(--b) * 55ms)` | BayerSpinner (§7.3) | Static: squares at .6, `[data-core]` squares at 1 | Keeps running: the root carries `data-air-allow` |
| `.tally[data-kind="stalled"]:not([data-steady]) .tally-face` | `led-stall`, 1000 ms `var(--steps-led)`, 5 iterations, then steady | TallyBar STALLED lamp (§6.7). TallyCluster's AIR lamp sets `data-steady` and never blinks (§7.4) | `animation: none` (steady) | Allowed: the only blink (§6.1 law 4) |
| `.gen-scan` | `scan-step`, 1600 ms `var(--steps-scan)`, infinite | GenerationFrame `running` scanline (§6.6) | `animation: none` | `animation: none` |
| `.coast-sprite > i` | `coast-sprite` (transform only), 800 ms `var(--steps-sprite)`, infinite | CoastLoader (§7.5) | `animation: none` (frame 1 still) | `animation: none` (frame 1 still) |
| `[data-btn][data-state="error"]` | `key-jitter`, 180 ms `steps(1, end)`, once | Button error micro-state (§6.9) | `animation: none` (colour only) | Unchanged |
| `:is(dialog, [data-sheet])` (air-lock rule only) | — | Dialog, ConfirmDialog, Sheet, the palette (§7.3, §7.11) | The global rule (1 ms) | `animation-duration` and `transition-duration` `0s !important` |

### 6.16 Acceptance criteria

**How to run.** Run modes are §1.6's: **prod** (`npm run qa:build`, then `env $UNSET ADMIN_AUTH_MODE=edge-only NEXT_TELEMETRY_DISABLED=1 npx next start -p 3109`; a plain `next start` returns 401 and is never a prod check), **dev** (`env $UNSET NEXT_TELEMETRY_DISABLED=1 npx next dev -p 3107`) and **fixture** (dev at `/admin/visual-test?noboot#design-system-visual-test`; the route returns 404 in prod, so fixture items never run on prod). Boot, route-loading, navigation and network items run on **prod** unless marked. Items marked (fixture) run in fixture mode; the broadcast simulator is `#ds-simulator` (§10). Items marked (dev, lock) run on `/admin` in dev after `window.__wzrd.broadcast.publish({ director: 'live', firstFrame: true })` (§7.17, from 3A). Commands whose paths start with `dashboard/`, and `git` commands with such pathspecs, run from the repository root; every other command runs from `dashboard/`. Quote any path containing `(live)`.

**Boot**
- [ ] `/admin?boot=1` (precondition `window.__wzrd.boot.t0 ≤ 600`; re-run otherwise): `window.__wzrd.boot` is `{ mode:'post', interrupted:false }` with `tEnd ≤ 1617`, and `document.getElementById('wzrd-boot') === null` at `performance.now() ≥ 1650`.
- [ ] `/admin?boot=auto` twice in one context: the first load records `mode:'post'` and `sessionStorage['wzrd:boot'] === '1'`; the reload records `mode:'flip'` with `tEnd − t0 ≤ 257`.
- [ ] `/admin` with no parameter under Playwright: `mode === 'skip'`, and there is no `#wzrd-boot` at `DOMContentLoaded`.
- [ ] `/admin?boot=1` with `emulateMedia({ reducedMotion: 'reduce' })` (precondition `t0 ≤ 600`): `mode === 'static'` and `tEnd − t0 ≤ 450`. At `t0 + 100` the canvas computes `display: none` while the wordmark `<img>` computes `opacity: 1`.
- [ ] Pressing `Shift` at `performance.now() ≈ 500` in `?boot=1`: `interrupted === true`, and the overlay is gone ≤ 220 ms after the key press.
- [ ] `?boot=1`: a `page.mouse.click` at `performance.now() ≈ 500` aimed at the centre of the ThemeSwitch 'Light' radio sets `interrupted === true` and leaves `localStorage.getItem('theme')` and `html.classList.contains('dark')` unchanged. The same click at `performance.now() ≈ 1300` (after the handoff) also leaves both unchanged. A click after `#wzrd-boot` is gone selects 'Light'.
- [ ] Interrupt with `Shift` at `performance.now() ≈ 700` in `?boot=1`. 50 ms later, read `#wzrd-boot-cv` with `getContext('2d').getImageData` (1 px per cell; the `#wzrd-boot-mark` box in cells is its client rect divided by 4): the share of transparent cells inside the mark box differs from the share outside it by ≤ 10 percentage points.
- [ ] Console and `pageerror` capture across `?boot=1`, `?boot=flip`, `?boot=auto` (both visits), `?noboot` and the reduced-motion run, each held 5 s after load: zero entries beyond the §1.6 allowed list. In particular, no "preloaded … but not used" warning.
- [ ] The layout-shift sum over 0–2000 ms in `?boot=1` equals `0`.
- [ ] `node scripts/gen-boot.mjs --check` exits 0, and the §6.2.12 served-HTML measurement prints a script size ≤ 4096 and a CSS size ≤ 1536.
- [ ] `grep -rnE "getContext\\(['\"](webgl|webgl2|experimental-webgl)|console\." dashboard/components/boot` prints nothing.
- [ ] The served HTML of `/admin` contains exactly one `<link rel="preload" as="image"`, for `/brand/wordmark/wzrdtech-640.webp`, and `grep -n "coast-boot-strip" dashboard/app/layout.tsx` prints nothing.
- [ ] A browser context with `javaScriptEnabled: false`: at 2100 ms `getComputedStyle(#wzrd-boot).visibility === 'hidden'` and `getComputedStyle(#wzrd-boot-sr).visibility === 'hidden'`, `#wzrd-bug` computes opacity `1`, and `document.elementFromPoint(innerWidth / 2, innerHeight / 2)` is not inside `#wzrd-boot`.
- [ ] During `?boot=1`, every response is < 400. The requests whose initiator is the inline boot script or an element inside `#wzrd-boot` (Playwright `request.frame()` plus the CDP `Network.requestWillBeSent` initiator) are exactly `/brand/wordmark/wzrdtech-640.webp` and `/brand/loader/coast-boot-strip@2x.png`. In `?boot=flip` and `?noboot`, no request for `coast-boot-strip@2x.png` is made.
- [ ] Unconfigured build, `?boot=1`: at 1100 ms the POST PATCH row reads `NOT PATCHED` with `data-s="warn"`. Screenshots at 1100 ms in dark and light are stored with the §15 after-screenshots as `boot-post-dark.png` and `boot-post-light.png`.
- [ ] `window.__wzrdDitherReady` is set within 3000 ms on every route. A listener installed by `addInitScript` counts exactly one `wzrd:dither-ready` per page load, including after 10 theme toggles. With `--disable-webgl`, `__wzrdDitherReady.webgl === false`.

**Route loading and transitions**
- [ ] `find app/admin -name loading.tsx | wc -l` prints `7`; `test ! -e app/admin/loading.tsx && test ! -e app/admin/visual-test/loading.tsx` succeeds; `test -f 'app/admin/(live)/page.tsx' && test -f 'app/admin/(live)/loading.tsx' && test ! -e app/admin/page.tsx` succeeds; `test -f app/admin/template.tsx` succeeds.
- [ ] `find app/admin -name layout.tsx | wc -l` prints `8`, and `test ! -e 'app/admin/(live)/layout.tsx'` succeeds.
- [ ] `curl -s -o /dev/null -w '%{http_code}' localhost:3109/admin/visual-test` prints `404`, and `curl -s -o /dev/null -w '%{http_code}' localhost:3109/admin` prints `200`.
- [ ] Every `.route-fallback` has computed `animation-name: appear` and `animation-delay: 0.15s`. Its CoastLoader has `role="status"` and a visible caption matching §6.3.
- [ ] After client navigation from `/admin/clips` to `/admin/recordings`, the template wrapper's computed `animation-name` is `px-resolve` and its `animation-duration` is `0.16s`. With reduced motion, `animation-name` is `none`.
- [ ] Exactly one `[data-nav-indicator]` exists. 250 ms after clicking 'Shotboard', its bounding box is horizontally inside the Shotboard link's box.
- [ ] `grep -rn "useLinkStatus" dashboard/components/shell` finds `LinkPending`, and `git diff 845147c -- dashboard/package.json` adds no runtime dependency.
- [ ] With the Shotboard RSC request delayed 1000 ms via `page.route`, `.route-progress` has opacity `1` at 300 ms after the click and `0` within 400 ms after the route renders.
- [ ] On `/admin`, store `const v = document.querySelector('video')`, click the 'Live Control' link, then run `history.replaceState(history.state, '', '/admin?code=x&state=y')`. After 500 ms, `document.querySelector('video') === v`.

**Signal acquisition, generation, ON AIR**
- [ ] (fixture, from 8B) `#ds-connect` renders the connect plate at `connectStep` 0–4, with the five verbatim CONNECT_STEPS in order and one button named exactly 'Cancel'.
- [ ] `git diff 845147c -- dashboard/lib/imageGen.ts` adds only the `GenStatus` type, the `onStatus` parameter, `logs: true`, `onQueueUpdate` and its `emit` dedupe (keyed on phase, position and log). The `buildImageInput(` call and `endpoint` are unchanged.
- [ ] `lib/imageModels.ts` exports `IMAGE_MODEL_ETA_MS` with exactly the keys `nano-banana`, `gpt-flare` and `gpt-sunburst`.
- [ ] (fixture) GenerationFrame renders in all 7 phases, and no `canvas` exists under any `[data-generation-frame]`. The `failed` frame contains `SIGNAL LOST ·` and a button named 'Retry'. A `queued` frame without `queuePosition` reads `QUEUE --`. For a `running` frame with `startedAt = now − eta`, `frame.querySelector('[data-gf-field]').style.getPropertyValue('--gf-tile') === 'var(--bayer-4-11)'`.
- [ ] (fixture) 'Simulate on air' (`air:'on'` with `director:'live', firstFrame:true`): `html[data-broadcast="on-air"]`, `html[data-lock="air"]`, `document.title === '● ON AIR · stream.wzrd.tech admin'`, and every `link[rel~="icon"]` href ends in `/brand/icons/favicon-onair.svg`. 'Simulate off air' restores the title and icons.
- [ ] (fixture) 'Simulate stalled': the TallyBar ON AIR lamp's text matches `/^STALLED \d\d:\d\d$/`; no element inside the TallyBar and no element inside the `banner` landmark has the text `ON AIR`; the TallyCluster AIR lamp reads `STALLED` and carries `data-steady`. Exactly one `role="alert"` chyron starts with 'Twitch ingest lost', and `getByRole('button', { name: 'End broadcast' })` matches exactly one element. `document.getAnimations().filter(a => a.animationName === 'led-stall')` has length 1, with `effect.getTiming().iterations === 5`.
- [ ] (fixture) HoldButton: a 100 ms pointer press opens a dialog titled 'Go live on Twitch?', and a 700 ms pointer hold calls the commit stub once. Pressing Enter for 100 ms on the focused HoldButton opens the dialog, and `document.activeElement` is the 'Not yet' button. Holding Enter for 700 ms calls the commit stub once and opens no dialog. With reduced motion, a 700 ms hold opens the dialog.

**Skeletons, pending, chyrons, air lock, slates, reduced motion**
- [ ] (fixture) `getComputedStyle(el, '::after')` of a `.skeleton-dither` has `animationName === 'skeleton-sweep'` and `animationDuration === '1.4s'`. Under reduced motion, and separately under `html[data-lock="air"]`, `getComputedStyle(el, '::after').content === 'none'`.
- [ ] (fixture) A pending `Button` has `aria-busy="true"` and `aria-disabled="true"`, has no `disabled` attribute, keeps focus, and its width equals its idle width ± 0.5 px.
- [ ] (fixture) With the simulator holding the lock and no state change for 2 s, every entry of `document.getAnimations().filter(a => a.playState === 'running')` has an effect target inside `[data-air-allow]`.
- [ ] (fixture) With the simulator holding the lock ('Simulate recording'), the `#ds-feedback` button 'Push info chyron' renders no chyron and sets the StatusRail message slot text to the pushed title. 'Push error chyron' still renders a `role="alert"` chyron.
- [ ] (fixture) After three presses of `#ds-feedback` 'Push error chyron' (three sticky error chyrons visible), a fourth press renders no fourth chyron, writes its title into `#live-assertive` within 100 ms, and the oldest visible chyron shows `+1 queued`.
- [ ] (dev, lock) On `/admin`, clicking 'Shotboard' opens a dialog containing 'Leaving Live Control ends the Director session and the broadcast.', `document.activeElement` is the 'Stay' button, and the URL stays `/admin`. 'Stay' closes it and the URL is still `/admin`.
- [ ] From 8C: `grep -c "onNavigate={guard(" components/ScriptTemplatePicker.tsx` prints `2`. The behaviour on a configured deployment is covered by §8.10.
- [ ] (fixture) Every slate kind renders. Each kicker's sr-only text equals the §6.13 kicker, and each `img` src matches `/brand/slate/<id>.webp` with `naturalWidth === 384`.
- [ ] With reduced motion, on every route after 1000 ms, `document.getAnimations().filter(a => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity)` is empty.
- [ ] `grep -rE "Loader2|animate-spin|animate-pulse" dashboard/app dashboard/components --exclude-dir=dither-kit` prints nothing.

