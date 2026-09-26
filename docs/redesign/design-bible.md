> **Design bible: rationale record, not the plan.** This is the canonical design bible that the three-way art-direction panel produced (PIXEL INSTRUMENT, with grafts from the *Control Room* and *Chrome & Ink* proposals). The spec chapters were written from it. It is committed so that every "bible §N" citation in [`goal.md`](../../goal.md) and [`docs/redesign/spec/`](spec/README.md) can be followed.
>
> **Precedence.** `goal.md` and the spec chapters **always win** over this file. The spec corrects the bible where the code proved it wrong (§4.4.5, corrections C1–C16) and where later review changed a decision. Where this file says "needs owner sign-off", the owner-decision defaults D1–D9 in `goal.md` §2.2 apply instead. Never implement from this file alone.

# PIXEL INSTRUMENT: canonical design bible for the stream.wzrd.tech admin

**Status:** canonical. This document is binding for every section of `goal.md`. If a section writer's text conflicts with this bible, the bible wins. Every repo claim below was re-verified against the code on 2026-09-25; the verification notes are marked **[v]**.

**Glossary. Use these words exactly.**

| Term | Meaning |
|---|---|
| Carrier | The global React Bits Dither wave (`components/DitherBackground.tsx` → `components/reactbits/Dither.jsx`). |
| Veil | The CSS wash that sits between the carrier and the UI. |
| Chassis | Translucent, never-blurred UI material: the command bar, rails and status rail. |
| Panel | Translucent card material placed on the chassis or on the veil. |
| Screen | Theme-invariant black material: monitors, frames, thumbnails and slate art windows. It has 2px corners. |
| Bezel | Theme-invariant near-black `#0B0F17` hardware. It holds lamps, the tally bar, HUD plates and the monitor frame. |
| Lamp | A tally indicator (PGM/ON AIR, PVW, REC, CUE, STBY). It always sits in a bezel housing and always carries a text label. |
| LED | An 8×8 status square with a text label (health, save state, preflight). |
| Resolve | The 4-step Bayer mask reveal: 25→50→75→100% over 4×40 ms. It is the only way new content appears. |
| Air lock | The live-safety mode, active while `html[data-lock="air"]` is set. |
| Effect slot | The single contextual canvas each view may run alongside the carrier. |

---

## 0. Decision log

### 0.1 Verdict

The chosen direction is **PIXEL INSTRUMENT** (codename BAYER/4), with the chrome brand mark grafted from *Chrome & Ink* and broadcast safety grafted from *Control Room*. Both judges chose pixel-instrument:

| Judge | Delta | Brand | Live ops | Feasibility | Perf/a11y | Distinctiveness |
|---|---|---|---|---|---|---|
| J1 | 9 | 7.5 | 9 | 7.5 | 9 | 9 |
| J2 | 8.5 | 8 | 8.5 | 8.5 | 8.5 | 9 |

It is the only proposal that meets the canvas budget without contradicting itself, and the only one that turns the mandated Dither into the system's grammar instead of wallpaper.

### 0.2 Why it wins

1. **One grammar.** The carrier's own math (4 levels, Bayer ordered dither, 2 px cells) drives every fill, skeleton, reveal, selection, progress field and slate.
2. **It fits the budget.** The design uses no backdrop-filter, a CSS-only GenerationFrame, CSS LED ladders instead of canvas sparklines, and one effect canvas per view.
3. **It is operable live.** Nothing moves unless information moves. The tally lamps are driven by real signal.
4. **It is distinctive.** The references are instruments (OP-1, Playdate, Elektron, ATEM), not SaaS dashboards.
5. **Its weakness is fixable.** The weak point is the brand chrome (the wordmark never appeared, and the Coast art was Game Boy only). Grafts G1–G3 fix it.

### 0.3 Verified facts that override all three proposals

| # | Fact **[v]** | Consequence |
|---|---|---|
| F1 | The Dither shader quantises **each RGB channel independently** to 4 levels (`floor(color*3+.5)/3`, Dither.jsx `ditherQuantize`). I simulated the full shader. The rendered palette is dark {#000000, #000055, #005555, #555555, #0055AA, **#5555AA**} and light {**#5555AA**, #55AAAA, #55AAFF, #AAAAAA, #AAAAFF, #AAFFFF, #FFFFFF}. | The worst-case pixel for contrast is **#5555AA in both themes**. All three proposals computed against #3357A8, which the shader never renders. Every contrast check composites text over #5555AA. |
| F2 | Today's veil is `bg-fal-gray-50/60 dark:bg-[#0a0d14]/45` (app/layout.tsx:38). | The veil is **retuned, not preserved**. The alphas stay the same (.60 / .45). Only the colour changes, to exactly `--c-canvas`. |
| F3 | `components/dither-kit/sparkline.tsx` wraps `AreaChart`, and `cartesian-canvas.tsx:118` re-requests rAF on every frame. | Canvas sparklines are banned on Live Control and on StatTiles. Use CSS LED ladders or inline SVG polylines instead. |
| F4 | MorphSlider has no static mode; it only has a `webglFailed` `<img>` (MorphSlider.tsx:546). Its `autoplay` defaults to `false`, and TrackManager turns it on. | Keep it, with autoplay off. Add a render-on-demand patch (the vendored file may be edited). |
| F5 | Focal woff2 ships `tnum case ss01 ss02 frac` (fontTools). | Numbers in Focal that update use `tnum`. Mono readouts use JetBrains Mono. |
| F6 | `next/link` in Next 15.5.2 exports `useLinkStatus`. | RouteProgress is driven by real pending state with no new dependency. |
| F7 | `dither-kit/lib.ts` `cn` is a plain `twMerge`. `lib/utils.ts` `cn` is too. | Custom font-size names such as `text-body-sm` are misread as colours and silently dropped. `lib/utils.ts` must use `extendTailwindMerge` (§2.13). Classes passed into DitherButton must use arbitrary values for size. |
| F8 | DitherButton fills with `hueFill(215)` at a fixed HSL of s .85, l .58 (≈#3985EF). Under hover intensity, a white label over a lit cell measures about 4.1:1. | The primary label sits on a **bezel label plate** (§4 Button). This guarantees contrast. |
| F9 | `lucide-react` is 0.294.0. `Columns2`, `Rows3` and `Captions` are missing. Every icon listed in §3.6 exists. | Only the icons in §3.6 may be used. |
| F10 | `motion` 13.2.0 exports `LayoutGroup`, `Reorder`, `useReducedMotion` and `AnimatePresence` from `motion/react`. `sharp` is present transitively. `tailwindcss-animate` is installed but unregistered. | No new runtime dependencies. |
| F11 | `ChartConfig.color` accepts only `DitherColor` names (chart-context.tsx:23). | The analytics chart uses `'blue'`. |

### 0.4 Grafts taken

| ID | Graft | Source | Lands in |
|---|---|---|---|
| G1 | Wordmark stage in the boot. The mark resolves from a 1-bit mask in Bayer order, then crossfades to the crisp raster, then gets a single glint, then FLIPs into the command-bar bug. | chrome-ink (J1) | §5.1 |
| G2 | Keep the real raster wordmark (AVIF/WebP, sized). Do not trace it. Derive only the 1-bit boot masks from it. | chrome-ink (J2) | §6, §9 |
| G3 | A "Chrome & Ink" material tier for the flagship Coast art only (portrait, standby key art, OG). Its prompt includes: "skin tones natural and true to Image 1, never tinted blue". | chrome-ink (J1, J2) | §9 |
| G4 | Extract the presentational parts of DirectorPlayer (1342 lines) before any restyle, and move the 1 s tick into a leaf component. | chrome-ink (J1, J2) | §7.1, §10 |
| G5 | Support `prefers-reduced-transparency`, `prefers-contrast: more`, and 44 px targets on `(pointer: coarse)`. | chrome-ink | §2 |
| G6 | Never add or remove `text-transform` on a preserved string. New uppercase strings are authored in uppercase. | chrome-ink (J1, J2) | §3.5 |
| G7 | The `html[data-broadcast]` state machine, extended with `data-rec` and a derived `data-lock`. | chrome-ink | §2.3, §5.8 |
| G8 | GenerationFrame density comes from 16 precomputed Bayer tiles, stepped in CSS. | chrome-ink (J2) | §5.4 |
| G9 | The OFF AIR lamp holds for 3 s, then shows standby. | chrome-ink (J2) | §5.5 |
| G10 | `scripts/brand/approved.json` provenance, plus gitignored `.cache/refs`. | chrome-ink, fal audit | §9 |
| G11 | "Go live on Twitch" is **hold-to-take** (600 ms ring). A click or Enter opens a confirm dialog instead. CUE is a **steady** amber lamp. | control-room (J1, J2) | §5.5 |
| G12 | On ingest loss: a sticky `role=alert` chyron that counts up, plus a hatched lamp. | control-room (J1) | §5.5 |
| G13 | Air lock. Density is frozen, nothing reflows, leaving the page requires a confirm during PVW, REC or PGM, and REC is steady. | control-room (J1, J2) | §5.8 |
| G14 | A carrier **Tuning** state (speed .055 while connecting). | control-room (J1) | §2.3 |
| G15 | A uniform 4:3 Locations contact grid with A/B compare, and review-before-promote for generated sheets. | control-room (J1, J2) | §7 |
| G16 | Tabular timecode in HH:MM:SS, and a FreshnessStamp. | control-room | §3.4, §4 |
| G17 | Exact letterforms are never generated. Icons derive from the pixel Coast master. | control-room (J1) | §9 |
| G18 | A broadcast store published by DirectorPlayer. The status rail makes **zero network probes**. | control-room (J2) | §4, §6 |
| G19 | A slate vocabulary (STAND BY, BLANK BOARD, OPEN CASTING, NO TAPE, CH 404…). The standby slate shows the premise in Focal Light and keeps 'Director offline' in the DOM. | control-room (J2) | §5.9, §7 |
| G20 | The transport bar absorbs the HUD buttons. Nothing covers program except the viewfinder brackets. | control-room | §7.1 |
| G21 | The first-frame gate uses `requestVideoFrameCallback`. | all three | §5.3 |

### 0.5 Director overrides of the winner

| ID | Override | Reason |
|---|---|---|
| O1 | Contrast is measured against #5555AA, not #3357A8. | F1 |
| O2 | Honest veil retune (colour changes, alpha stays). | F2 |
| O3 | **MorphSlider stays on Live Control** (the winner removed it). It sits in the Audio dock tab with autoplay off, renders on demand, and is arbitrated by the effect slot. The aria-labels, including 'Coast originals artwork carousel', are unchanged. | Removing it is a product change the audit did not ask for, and relabelling it would create a semantic mismatch (J2). |
| O4 | **Exactly one thing in the system may blink:** the STALLED ingest lamp, at 1 Hz for at most 5 cycles and then steady. A queued GenerationFrame is static. CUE is steady. There is no blink on the Coast slate. | The winner broke its own rule (J1, J2), and WCAG 2.2.2 applies. |
| O5 | No global single-character shortcuts, and no ⌘⇧L or ⌘. chords. | WCAG 2.1.4. Safari binds ⌘⇧L to its sidebar, and ⌘. stops page loading. |
| O6 | The primary DitherButton label sits on a bezel plate. | F8 |
| O7 | **No registry installs.** Every CSV-derived component is an original implementation with a provenance comment. | reactbits.dev returns 403 from the sandbox, and every CSV prompt says "do not copy source". |
| O8 | Colours map as `rgb(var(--c-x) / <alpha-value>)`. Default translucency comes from separate `surface-*` utilities. | Baking in the alpha broke `/opacity` modifiers (J2). |
| O9 | `extendTailwindMerge` is configured. | F7 |
| O10 | The command palette is original, built on native `<dialog>`. `cmdk` is rejected. | No new dependency. |
| O11 | PX5×7 is kept but scoped: md lamp faces, slate kickers and the boot only, never more than 3 words. Small lamps use JBM `micro`. | Limits the risk of a retro-toy look (J1). |
| O12 | Masonry and Realistic emboss are dropped as picks. A key-shadow token remains. | Uniform grids compare better. The CSV audit leaned against emboss. |
| O13 | There is **no H3 loop inside the monitor**. The idle monitor is a static SymbolRaster. The standby loop lives on the Analytics offline slot. | The invariant allows exactly one `<video>` on Live Control. |
| O14 | Font files are never deleted. The italic and `.otf` files simply stop being referenced. | Deleting them needs owner sign-off (J2). |
| O15 | The copy 'Live · {n}s' becomes 'Live · HH:MM:SS'. 'Ping · {n} ms' and 'REC {formatBytes}' stay verbatim. | This is a deliberate, documented copy change. |

### 0.6 Rejected ideas

| Idea | Source | Why rejected |
|---|---|---|
| Any second background (the other 56 Backgrounds, FloorGlow/Dia gradient, Noise grain) | all | Competes with the carrier, and violates the rule of one full-screen field and no soft glows. |
| `backdrop-filter` anywhere (command bar blur, G2 glass, Glass Surface, Gradual Blur) | control-room, chrome-ink | Re-blurs the animating WebGL every frame and smears the pixel grid. |
| Split Flap Text, Counter | control-room, chrome-ink | Mechanical flips and rolling digits in the operator's line of sight. State words resolve; digits snap. |
| Shiny Text on H1s and buttons, chrome gradient buttons, chrome display type, Border Glow | chrome-ink | Reads as premium SaaS decoration. Border Glow is pointer-reactive. The glint is allowed only on the wordmark. |
| 112 px editorial page header, 21:9 key-art band on Characters | chrome-ink | Wastes operator space. PageHeader is at most 96 px. |
| Colour-bar/PLUGE boot stage | control-room | Replaced by the POST display-test strip, which is the same idea at a smaller size in the brand ramp. |
| Global R/F/M/C shortcuts, hold ⌘. to stop, hold ⌘⇧L to go live | control-room | O5 |
| H3 standby loop inside the program monitor | chrome-ink, control-room | O13 |
| Tracing the wordmark to SVG, generating a monogram "W" on fal | pixel-instrument, chrome-ink | Destroys the chrome bevel and risks distorted letterforms. |
| Holo on non-locked characters, Coast slate blink every 6 s, the custom 8×8 pixel icon set | chrome-ink, pixel-instrument | Too decorative and too much scope. Lucide covers the icons. |
| Masonry for Locations | pixel-instrument | A uniform 4:3 grid compares fairly. |
| Radar, Scanner, Faulty Terminal for acquisition | control-room, chrome-ink | The SymbolRaster already carries acquisition. They are extra metaphors. |

### 0.7 Cut order and never-cut list

**Cut order if time runs short, first item first:**
1. HoverClipButton and the `motion/coast-talent-nod` clip.
2. HoloCard tilt and foil (keep a static card).
3. The `motion/coast-standby-loop` on Analytics (use the poster only).
4. The boot FLIP-to-bug and the glint (the wordmark fades out instead).
5. Locations A/B compare and the scout report.
6. The Shotboard contact-sheet view and drag reorder.
7. The boot Coast-sprite stage, then the whole POST, falling back to the 240 ms channel flip plus the loading sprite.
8. CountUp.
9. Palette actions beyond route jumps.
10. Squircle corners.

**Never cut:**
- Tokens, the cascade fix and violet removal.
- The type reset.
- Dither hardening.
- The broadcast store, the truth-gated tally and the air lock.
- The zero-scroll Live Control layout.
- All invariants.
- PxResolve, skeletons and GenerationFrame driven by real queue status.
- The slate family, including NOT PATCHED.
- The route state files.
- The focus, reduced-motion and reduced-transparency foundation.
- The contrast gate.

---

## 1. Concept and principles

**Concept.** The admin is a piece of hardware for directing a live AI channel.

- **Chassis.** A calm, translucent body over the carrier wave.
- **Screens.** Black monitors and frames where the pixels live.
- **Lamps.** Honest hardware indicators in dark bezel housings.
- **Badge.** One chrome object: the WZRD.tech blackletter wordmark. It glints exactly once per session.
- **Coast.** The station ident. Coast appears on standby, in loaders, on slates and on the talent card, and never in the operator's way during a show.

**Principles. Apply every one of these on every screen.**

1. **The Dither is the grammar.** Every fill, skeleton, reveal, selection and progress field is an ordered Bayer pattern in the brand ramp. Nothing is a smooth gradient, a blur or a glow.
2. **Chassis is glass, screens are black, lamps are hardware.** Chassis and panels are translucent and never blurred. Monitors, frames, lamps and slate art are theme-invariant dark material with 2 px corners.
3. **Chrome is the badge, blue is the only accent.** Violet is deleted. The wordmark is the only chrome object and the only thing that ever glints.
4. **Red means public.** A solid red fill appears only on the ON AIR lamp and the program keyline. REC is a vermilion ring. Danger is outline and text only.
5. **Keys move, information resolves.** Mechanical feedback takes 120 ms or less. New content appears through the 4-step resolve. There are no slides, springs, bounces or shimmer.
6. **Truth over theatre.** Every lamp, LED, progress field and loader is driven by a real signal: the first decoded frame, WHIP `bytesSent`, fal queue status, `document.fonts.ready`, and so on. Nothing fakes progress.
7. **Information may move, decoration may not.** Under the air lock, only lamps, readouts, queues and the playhead change. Layout never reflows. One thing may blink.
8. **Contract-safe.** Preserved strings, aria-labels, routes, the media pipeline and test hooks stay byte-identical. Restyle freely; never rename.

---

## 2. Tokens

### 2.1 Files and layering

**Files:**
- `dashboard/app/styles/tokens.css`: all custom properties.
- `dashboard/app/styles/bayer.css`: 16 mask tiles, generated once by `dashboard/scripts/gen-bayer.mjs`, with the output committed.
- `dashboard/app/styles/utilities.css`: `@layer utilities` classes.

**`app/globals.css` order:**
1. `@import './styles/tokens.css';`
2. `@import './styles/bayer.css';`
3. `@tailwind base;`
4. `@tailwind components;`
5. `@tailwind utilities;`
6. `@import './styles/utilities.css';`, which uses `@layer utilities`.
7. Every legacy custom class moves into `@layer components`.

**Delete from globals.css:**
- The shadcn `:root` variables.
- `* {border-color}` and `.dark * {border-color}`, which are replaced by `borderColor.DEFAULT`.
- `.dark body`.
- `.dark .fal-*`.
- The duplicate `.dark .btn-secondary`.
- The dead `.metric-*`, `.progress-*`, `.terminal`, `.status-*` and `.btn-*` classes.
- `.fade-in` together with its keyframes.
- All `@font-face` blocks, which next/font replaces.

All colour tokens are **space-separated RGB channels**. Alphas live in separate `--a-*` variables.

### 2.2 Colour tokens

| Token | Light (`:root`) | Dark (`.dark`, primary) | Use |
|---|---|---|---|
| `--c-canvas` | 250 250 255 `#FAFAFF` | 5 8 15 `#05080F` | Page background. Equals the Dither background. |
| `--c-chassis` / `--a-chassis` | 238 242 249 `#EEF2F9` / .86 | 7 11 20 `#070B14` / .84 | Command bar, rails, status rail |
| `--c-panel` / `--a-panel` | 251 252 254 `#FBFCFE` / .86 | 11 17 29 `#0B111D` / .86 | Panels and cards |
| `--c-raised` / `--a-raised` | 255 255 255 / .96 | 17 26 42 `#111A2A` / .94 | Popovers, palette, dialogs, secondary keys |
| `--c-inset` / `--a-inset` | 238 242 248 `#EEF2F8` / .92 | 4 7 13 `#04070D` / .92 | Inputs, wells, telemetry |
| `--c-hover` | 228 234 245 `#E4EAF5` | 24 35 58 `#18233A` | Hover and pressed row fill |
| `--c-scrim` / `--a-scrim` | 5 8 15 / .48 | 2 4 8 / .64 | Dialog backdrop (no blur) |
| `--c-screen` | 0 0 0 | 0 0 0 | Monitor and media screens (invariant) |
| `--c-bezel` / `--a-hud` | 11 15 23 `#0B0F17` / .72 | same | Lamp housings, monitor frame, HUD plates (invariant) |
| `--c-text-on-screen` | 232 238 249 | same | Text on the bezel or HUD plates (invariant) |
| `--c-text-on-screen-2` | 169 180 198 | same | Secondary text on **solid** bezel only |
| `--c-text-1` | 10 15 28 `#0A0F1C` | 232 238 249 `#E8EEF9` | Primary text |
| `--c-text-2` | 57 70 92 `#39465C` | 169 182 204 `#A9B6CC` | Secondary text |
| `--c-text-3` | 80 93 115 `#505D73` | 133 147 171 `#8593AB` | Tertiary, hints, meta |
| `--c-text-disabled` | 154 165 184 | 74 86 107 | Disabled text (contrast-exempt; never carries meaning alone) |
| `--c-border-subtle` | 220 227 238 | 26 36 54 | Panel borders, dividers |
| `--c-border-strong` | 183 195 214 | 43 58 85 | Popover and dialog rings, strong dividers |
| `--c-border-control` | 111 127 155 | 90 111 148 | Input, switch and checkbox edges (≥3:1) |
| `--c-accent` | 45 84 136 `#2D5488` | 122 165 224 `#7AA5E0` | Accent text, icons, selected state |
| `--c-accent-hover` | 34 66 109 `#22426D` | 156 192 240 `#9CC0F0` | |
| `--c-accent-press` | 27 52 87 `#1B3457` | 94 143 212 `#5E8FD4` | |
| `--c-accent-ink` | 255 255 255 | 5 8 15 | Text on an accent fill |
| `--a-accent-soft` | .10 | .14 | Selected rows and chips (`bg-accent-soft`) |
| `--c-focus` | 31 74 133 `#1F4A85` | 156 192 242 `#9CC0F2` | 2 px focus outline |
| `--c-success` | 15 107 50 `#0F6B32` | 52 210 123 `#34D27B` | |
| `--c-warning` | 122 81 0 `#7A5100` | 245 184 61 `#F5B83D` | Advisory only, never an error |
| `--c-danger` | 176 26 21 `#B01A15` | 255 107 107 `#FF6B6B` | Outline and text only, never a fill |
| `--c-tally-program` | 255 59 48 `#FF3B30` | same | ON AIR fill and program keyline (invariant) |
| `--c-tally-preview` | 48 209 88 `#30D158` | same | PVW fill |
| `--c-tally-rec` | 255 122 69 `#FF7A45` | same | REC ring and text, never a fill |
| `--c-tally-cue` | 255 176 32 `#FFB020` | same | CUE ring and text (steady) |
| `--c-tally-standby` | 140 152 174 `#8C98AE` | same | STBY ring |
| `--c-tally-off` | 58 70 89 `#3A4659` | same | Unlit lamp ring (decorative; the label carries state) |
| `--c-tally-ink` | 5 8 15 | same | Label on lit program and preview fills |
| `--c-ramp-0…3` | 250 250 255 · 203 216 240 · 128 161 219 · 45 84 136 | 5 8 15 · 29 49 96 · 51 87 168 · 122 165 224 | Brand pixel ramp: sprites, skeletons, fields, boot |
| `--c-ramp-glint` | 255 255 255 | 232 238 249 | Single-pixel glints only |
| `--a-skel` | .10 | .16 | Skeleton ink alpha |

The chrome scale is a primitive exposed only as `chrome-*` for art and charts: 50 #EFF4FC · 100 #DCE7F8 · 200 #BCD2F2 · 300 #9CC0F0 · 400 #7AA5E0 · 500 #4F83CC · 600 #3A6AB0 · 700 #2D5488 · 800 #1F3A63 · 900 #142440 · 950 #0B1426.

**Colour laws**
1. A solid red fill appears only on the ON AIR lamp and the 2 px program keyline.
2. Every lamp and every LED shows a text label. Colour is never the only signal.
3. Lamps always sit in bezel housings, so tally colours are identical in both themes.
4. The only hues besides the accent are tally and status colours. Icons never get colour chips.
5. No text sits directly on the carrier or veil except display text of 24 px or more in `text-1`.

### 2.3 Carrier (Dither) tokens and broadcast states

The shader constants never change: `waveFrequency 2.6`, `waveAmplitude 0.4`, `colorNum 4`, and a visual `pixelSize 2`. The 2 px size is achieved by rendering at `renderScale 0.5` with a shader `pixelSize` of 1 and `image-rendering: pixelated`.

| Variable | Light | Dark |
|---|---|---|
| `--dither-wave` (0–1 RGB, exact existing values) | `0.5 0.63 0.86` (#80A1DB) | `0.2 0.34 0.66` (#3357A8) |
| `--dither-bg` | `0.98 0.98 1.0` (#FAFAFF) | `0.02 0.03 0.06` (#05080F) |
| `--dither-speed`, standby (idle and preview) | 0.04 | 0.04 |
| `--dither-speed`, Tuning (`data-broadcast="connecting"`) | 0.055 | 0.055 |
| `--dither-speed`, ON AIR (`data-broadcast="on-air"`) | 0.02 | 0.02 |
| `--dither-veil`, standby and tuning | .60 | .45 |
| `--dither-veil`, ON AIR ("house lights down") | .72 | .62 |
| `--dither-veil`, reduced transparency | .80 | .80 |

The veil is the element `.dither-veil`, inside the DitherBackground host:

```css
.dither-veil {
  background: rgb(var(--c-canvas));
  opacity: var(--dither-veil);
  transition: opacity var(--dur-house) var(--ease-in-out);
}
```

**HTML state attributes** are set only by `lib/broadcast/store.ts`:

| Attribute | Values |
|---|---|
| `data-broadcast` | `idle` (idle, closed or failed), `connecting` (opening, or live before the first decoded frame), `preview` (live with the first frame decoded), `on-air` (truth gate true), `stopping` (closing) |
| `data-rec` | Present while the MediaRecorder is recording. |
| `data-lock="air"` | Present when `data-broadcast` ≠ `idle` **or** `data-rec` is present. |
| `data-boot` | Present only while the boot overlay runs. |
| `data-density` | `comfortable` or `compact` |

### 2.4 Contrast ledger

These are WCAG 2.x ratios, computed by compositing each surface over the veil over the worst pixel #5555AA.

| Pair | Dark | Light |
|---|---|---|
| Veil composite over worst pixel | #313264 | #B8B8DD |
| text-1 on chassis / panel / raised / inset / hover | 16.07 / 15.49 / 14.69 / 17.19 / 13.54 | 15.90 / 17.21 / 18.68 / 17.04 / 15.89 |
| text-2 on the same surfaces | 9.14 / 8.81 / 8.35 / 9.77 / 7.70 | 7.92 / 8.57 / 9.31 / 8.49 / 7.91 |
| text-3 on the same surfaces (worst case is hover) | 6.02 / 5.81 / 5.51 / 6.44 / **5.07** | 5.53 / 5.99 / 6.50 / 5.93 / 5.53 |
| accent text on panel / hover | 7.12 / 6.22 | 6.91 / 6.38 |
| success / warning / danger on panel | 9.15 / 10.14 / 6.50 | 5.96 / 6.29 / 6.29 |
| accent-ink on accent / on accent-hover | 7.91 / 10.70 | 7.68 / 10.15 |
| border-control vs panel / hover (non-text) | 3.55 / 3.11 | 3.64 / 3.36 |
| focus vs panel | 9.65 | 7.95 |
| text-1 on bare veil (display text of 24 px or more only) | 10.14 | 9.96 |
| tally-ink on PGM #FF3B30 / on PVW #30D158 | 5.65 / 9.91 | same |
| PGM / REC / CUE / STBY ring vs bezel | 5.41 / 7.42 / 10.49 / 6.59 | same |
| text-on-screen on HUD plate (bezel at .72 over a white frame) | ≈7.9 | same |
| Bezel housing vs light chassis | — | 17.31 |

**Rules derived from the ledger:**
- Accent text is **never** placed on HUD plates (3.64:1). On HUD plates use `text-on-screen` only. `text-on-screen-2` is allowed only on the solid bezel.
- Focus rings sit on chassis, panel or raised surfaces, never directly on the veil. Light focus against the raw pixel is only 1.37:1.
- `tests/contrast.spec.ts` recomputes this ledger from the live CSS variables. It fails below 4.5 for text and 3 for non-text.

### 2.5 Radii and squircle

| Token | Value | Squircle value | Use |
|---|---|---|---|
| `--r-xs` | 4px | 6px | Badges, tags |
| `--r-sm` | 6px | 10px | Keys, inputs, chips |
| `--r-md` | 10px | 16px | Panels, cards |
| `--r-lg` | 14px | 22px | Sheets, dialogs, slates, HoloCard |
| `pill` | 9999px | never squircled | Pills |
| `--r-screen` | 2px | never squircled | Monitor, frames, thumbnails, media, slate art |
| `--r-lamp` | 1px | never squircled | LEDs |

The squircle is progressive enhancement:

```css
@supports (corner-shape: squircle) {
  .sq { corner-shape: squircle; }
  .sq.rounded-xs { border-radius: 6px; }
  .sq.rounded-sm { border-radius: 10px; }
  .sq.rounded-md { border-radius: 16px; }
  .sq.rounded-lg { border-radius: 22px; }
}
```

Primitives always pair `rounded-{xs|sm|md|lg}` with `sq`. Never use `clip-path` on a focusable element.

### 2.6 Spacing, chrome heights and density

- **Spacing** uses Tailwind's 4 px scale only: 0.5 (2), 1, 2, 3, 4, 5, 6, 8, 10, 12, 16. Every component dimension is an even number of pixels.
- **Gutters** (`--gutter`): 16 px below 768, 24 px from 768 to 1439, 32 px from 1440. Live Control and Shotboard always use 16 px.
- **Max widths:** library pages 1440 px. Live Control and Shotboard are full-bleed up to 1920 px.

**Fixed chrome heights:**

| Variable | Value | Element |
|---|---|---|
| `--h-cmd` | 48 | Command bar |
| `--h-navrow` | 44 | Mobile nav row |
| `--h-status` | 24 | Status rail |
| `--h-slate` | 48 | Shotboard slate bar |
| `--h-strip` | 28 | Monitor label strip and tally bar |
| `--h-transport` | 56 | Transport bar |
| `--h-telemetry` | 32 | Telemetry strip |
| `--h-dock` | 200 | Dock, open |
| `--h-dock-collapsed` | 36 | Dock, collapsed |

**Density** is set by `html[data-density]` and persisted in localStorage `wzrd:density`. It is read pre-paint in the head script. A route root may override it.

| Setting | Comfortable (default) | Compact (forced on the Live Control root and the Shotboard inspector) |
|---|---|---|
| `--h-control` | 36 | 32 |
| `--h-row` | 40 | 32 |
| `--pad-panel` | 16 | 12 |
| Body text | `body` 14 | `body-sm` 13 |

`(pointer: coarse)` forces `--h-control: 44px` and 44 px hit areas. **Density never changes while `data-lock="air"` is set.** The switch is disabled and says why.

### 2.7 Elevation

There are no coloured glows anywhere.

| Token | Dark | Light |
|---|---|---|
| `--shadow-e1` (panels) | `inset 0 1px 0 rgb(255 255 255/.05)` | `inset 0 1px 0 rgb(255 255 255/.9), 0 1px 2px rgb(16 24 40/.06)` |
| `--shadow-e2` (popover, raised) | `inset 0 1px 0 rgb(255 255 255/.06), 0 16px 40px -8px rgb(0 0 0/.55)` | `inset 0 1px 0 #fff, 0 16px 40px -8px rgb(16 24 40/.14)` |
| `--shadow-e3` (dialog, palette) | e2 + `0 0 0 1px rgb(var(--c-border-strong))` | same |
| `--shadow-key` (secondary keys) | `inset 0 1px 0 rgb(255 255 255/.08), 0 1px 0 rgb(0 0 0/.6)` | `inset 0 1px 0 #fff, 0 1px 0 rgb(16 24 40/.14)` |
| `--shadow-key-pressed` | `inset 0 1px 2px rgb(0 0 0/.45)` | `inset 0 1px 2px rgb(16 24 40/.18)` |

- **Dialogs** add a 1 px top hairline in `accent` at .6 (`::before`).
- **Dither rule** (separator): 2 px tall, with a 50% Bayer mask in `border-strong`.
- **Selected state:** a 1 px accent border plus a 25% Bayer fill of `accent` at .22.

### 2.8 Translucency ("glass") policy

- **Blur is 0 everywhere.** `backdrop-filter` is banned by a grep gate.
- Surfaces are translucent through `--a-*` only (§2.2). The carrier shows through at roughly 14% on panels.
- Never nest translucent inside translucent. Inner regions use `inset` or dither rules.
- Overlays (palette, dialog, sheet) use `surface-raised` over `bg-scrim/…`.
- **`prefers-reduced-transparency: reduce`** sets every `--a-*` to 1 and `--dither-veil` to .80.
- **`prefers-contrast: more`** sets `--c-border-subtle` to the `--c-border-control` value and `--c-text-3` to the `--c-text-2` value, per theme.

### 2.9 z-index

| Layer | Value | Layer | Value |
|---|---|---|---|
| `dither` | −10 | `scrim` | 70 |
| `raised` (sticky in-content bars) | 10 | `dialog` (palette, dialog, sheet) | 80 |
| `bar` (command bar, status rail) | 40 | `chyron` | 90 |
| `drawer` | 50 | `tooltip` | 100 |
| `popover` | 60 | `boot` | 9999 |

### 2.10 Motion tokens

**Durations:**

| Token | Value | Use |
|---|---|---|
| `--dur-tick` | 60ms | LED snap, key press |
| `--dur-fast` | 120ms | Hover colour, exits, list entry resolve |
| `--dur-resolve` | 160ms | 4×40 ms Bayer resolve |
| `--dur-base` | 200ms | Nav indicator, toggles, popovers |
| `--dur-slow` | 320ms | Sheets, dialogs, raster clear |
| `--dur-reveal` | 480ms | Glint, FLIP |
| `--dur-house` | 1200ms | Carrier retint and veil |

**Easings:**

| Token | Value | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(.16,1,.3,1) | Entrances |
| `--ease-in-out` | cubic-bezier(.65,0,.35,1) | Tweens, house lights |
| `--ease-exit` | cubic-bezier(.4,0,1,1) | Exits |
| `--ease-key` | cubic-bezier(.3,0,0,1) | Key press |
| `--ease-crt` | cubic-bezier(.2,.9,.1,1) | Boot power-on |
| `--ease-spec` | cubic-bezier(.45,0,.2,1) | Glint only |

**Steps:** `--steps-resolve: steps(4,end)`, `--steps-led: steps(2,jump-none)`, `--steps-scan: steps(16,end)`, `--steps-sprite: steps(8,end)`, `--steps-sweep: steps(28,end)`.

**Choreography constants:**
- Stagger is 30 ms per item, with at most 8 items. After that, items arrive together.
- Exits run at 0.66× the entry duration.
- Travel is at most 4 px, and only for list rows. Text is never scaled.

### 2.11 Bayer mask tiles

`app/styles/bayer.css` defines `--bayer-4-00` through `--bayer-4-15`:

- Each is `url("data:image/svg+xml;utf8,…")`: an 8×8 px SVG made of 2×2 px `<rect>`s with `shape-rendering="crispEdges"`.
- Tile N lights cell (x,y) if and only if `B4[y][x] ≤ N`, using `B4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]` (dither-kit order). The density is therefore (N+1)/16.
- Named aliases: 25% = `-03`, 50% = `-07`, 75% = `-11`, 100% = `-15`.
- Masks are colourless; the colour comes from `background-color`.
- Always write both `mask-image` and `-webkit-mask-image`, with `mask-size: 8px 8px` and `mask-repeat: repeat`.
- `BAYER8`, used by the boot and SymbolRaster, lives in `lib/bayer.ts` as a local copy. dither-kit is never edited.

### 2.12 tokens.css

This is authoritative. Every writer copies these names.

```css
@layer base {
  :root {
    color-scheme: light;
    --r-xs:4px; --r-sm:6px; --r-md:10px; --r-lg:14px; --r-screen:2px; --r-lamp:1px;
    --h-cmd:48px; --h-navrow:44px; --h-status:24px; --h-slate:48px; --h-strip:28px;
    --h-transport:56px; --h-telemetry:32px; --h-dock:200px; --h-dock-collapsed:36px;
    --gutter:16px; --h-control:36px; --h-row:40px; --pad-panel:16px;
    --dur-tick:60ms; --dur-fast:120ms; --dur-resolve:160ms; --dur-base:200ms;
    --dur-slow:320ms; --dur-reveal:480ms; --dur-house:1200ms;
    --ease-out:cubic-bezier(.16,1,.3,1); --ease-in-out:cubic-bezier(.65,0,.35,1);
    --ease-exit:cubic-bezier(.4,0,1,1); --ease-key:cubic-bezier(.3,0,0,1);
    --ease-crt:cubic-bezier(.2,.9,.1,1); --ease-spec:cubic-bezier(.45,0,.2,1);
    --steps-resolve:steps(4,end); --steps-led:steps(2,jump-none); --steps-scan:steps(16,end);
    --steps-sprite:steps(8,end); --steps-sweep:steps(28,end);
    /* invariant materials */
    --c-screen:0 0 0; --c-bezel:11 15 23; --a-hud:.72;
    --c-text-on-screen:232 238 249; --c-text-on-screen-2:169 180 198;
    --c-tally-program:255 59 48; --c-tally-preview:48 209 88; --c-tally-rec:255 122 69;
    --c-tally-cue:255 176 32; --c-tally-standby:140 152 174; --c-tally-off:58 70 89; --c-tally-ink:5 8 15;
    /* light theme */
    --c-canvas:250 250 255; --c-chassis:238 242 249; --a-chassis:.86;
    --c-panel:251 252 254; --a-panel:.86; --c-raised:255 255 255; --a-raised:.96;
    --c-inset:238 242 248; --a-inset:.92; --c-hover:228 234 245; --c-scrim:5 8 15; --a-scrim:.48;
    --c-text-1:10 15 28; --c-text-2:57 70 92; --c-text-3:80 93 115; --c-text-disabled:154 165 184;
    --c-border-subtle:220 227 238; --c-border-strong:183 195 214; --c-border-control:111 127 155;
    --c-accent:45 84 136; --c-accent-hover:34 66 109; --c-accent-press:27 52 87; --c-accent-ink:255 255 255;
    --a-accent-soft:.10; --c-focus:31 74 133;
    --c-success:15 107 50; --c-warning:122 81 0; --c-danger:176 26 21;
    --c-ramp-0:250 250 255; --c-ramp-1:203 216 240; --c-ramp-2:128 161 219; --c-ramp-3:45 84 136; --c-ramp-glint:255 255 255;
    --a-skel:.10;
    --dither-wave:0.5 0.63 0.86; --dither-bg:0.98 0.98 1.0; --dither-speed:0.04; --dither-veil:.60;
    --shadow-e1:inset 0 1px 0 rgb(255 255 255/.9), 0 1px 2px rgb(16 24 40/.06);
    --shadow-e2:inset 0 1px 0 rgb(255 255 255/1), 0 16px 40px -8px rgb(16 24 40/.14);
    --shadow-e3:inset 0 1px 0 rgb(255 255 255/1), 0 16px 40px -8px rgb(16 24 40/.14), 0 0 0 1px rgb(var(--c-border-strong));
    --shadow-key:inset 0 1px 0 rgb(255 255 255/1), 0 1px 0 rgb(16 24 40/.14);
    --shadow-key-pressed:inset 0 1px 2px rgb(16 24 40/.18);
  }
  @media (min-width:768px){ :root{ --gutter:24px; } }
  @media (min-width:1440px){ :root{ --gutter:32px; } }
  .dark {
    color-scheme: dark;
    --c-canvas:5 8 15; --c-chassis:7 11 20; --a-chassis:.84;
    --c-panel:11 17 29; --a-panel:.86; --c-raised:17 26 42; --a-raised:.94;
    --c-inset:4 7 13; --a-inset:.92; --c-hover:24 35 58; --c-scrim:2 4 8; --a-scrim:.64;
    --c-text-1:232 238 249; --c-text-2:169 182 204; --c-text-3:133 147 171; --c-text-disabled:74 86 107;
    --c-border-subtle:26 36 54; --c-border-strong:43 58 85; --c-border-control:90 111 148;
    --c-accent:122 165 224; --c-accent-hover:156 192 240; --c-accent-press:94 143 212; --c-accent-ink:5 8 15;
    --a-accent-soft:.14; --c-focus:156 192 242;
    --c-success:52 210 123; --c-warning:245 184 61; --c-danger:255 107 107;
    --c-ramp-0:5 8 15; --c-ramp-1:29 49 96; --c-ramp-2:51 87 168; --c-ramp-3:122 165 224; --c-ramp-glint:232 238 249;
    --a-skel:.16;
    --dither-wave:0.2 0.34 0.66; --dither-bg:0.02 0.03 0.06; --dither-speed:0.04; --dither-veil:.45;
    --shadow-e1:inset 0 1px 0 rgb(255 255 255/.05);
    --shadow-e2:inset 0 1px 0 rgb(255 255 255/.06), 0 16px 40px -8px rgb(0 0 0/.55);
    --shadow-e3:inset 0 1px 0 rgb(255 255 255/.06), 0 16px 40px -8px rgb(0 0 0/.55), 0 0 0 1px rgb(var(--c-border-strong));
    --shadow-key:inset 0 1px 0 rgb(255 255 255/.08), 0 1px 0 rgb(0 0 0/.6);
    --shadow-key-pressed:inset 0 1px 2px rgb(0 0 0/.45);
  }
  [data-density="compact"]{ --h-control:32px; --h-row:32px; --pad-panel:12px; }
  @media (pointer:coarse){ :root, [data-density]{ --h-control:44px; } }
  :root[data-broadcast="connecting"]{ --dither-speed:0.055; }
  :root[data-broadcast="on-air"]{ --dither-speed:0.02; --dither-veil:.72; }
  :root.dark[data-broadcast="on-air"]{ --dither-veil:.62; }
  @media (prefers-reduced-transparency:reduce){
    :root, :root.dark, :root[data-broadcast], :root.dark[data-broadcast]{
      --a-chassis:1; --a-panel:1; --a-raised:1; --a-inset:1; --dither-veil:.80; }
  }
  @media (prefers-contrast:more){
    :root:not(.dark){ --c-border-subtle:111 127 155; --c-text-3:57 70 92; }
    :root.dark{ --c-border-subtle:90 111 148; --c-text-3:169 182 204; }
  }
  body { background: rgb(var(--c-canvas)); color: rgb(var(--c-text-1)); font-weight: 400;
         font-feature-settings: "rlig" 1, "calt" 1; }
  :focus-visible { outline: 2px solid rgb(var(--c-focus)); outline-offset: 2px; }
  html { scroll-padding-top: calc(var(--h-cmd) + 8px); scroll-padding-bottom: calc(var(--h-status) + 8px); }
}
```

**`utilities.css`** (`@layer utilities`):
- `.surface-chassis|panel|raised|inset { background-color: rgb(var(--c-X) / var(--a-X)) }`
- `.surface-hud { background-color: rgb(var(--c-bezel) / var(--a-hud)) }`
- `.nums { font-variant-numeric: tabular-nums slashed-zero }`
- `.text-micro, .text-label, .text-readout, .text-readout-lg, .text-timecode, .text-code { font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace }`. Readout and timecode also get `.nums`.
- `.bayer-25|50|75` mask presets.
- `.px-resolve` (§5.2).
- `.skeleton-dither` (§5.6).
- `.dither-rule`.
- `.edge-fade-x`, `.edge-fade-y`: a 24 px mask-image gradient, applied only while the element overflows.
- `.sq` (§2.5).

### 2.13 Tailwind 3 mapping, legacy migration and the collision fix

```js
/** dashboard/tailwind.config.js */
const c = (v) => `rgb(var(--c-${v}) / <alpha-value>)`
const chrome = { 50:'#EFF4FC',100:'#DCE7F8',200:'#BCD2F2',300:'#9CC0F0',400:'#7AA5E0',500:'#4F83CC',600:'#3A6AB0',700:'#2D5488',800:'#1F3A63',900:'#142440',950:'#0B1426' }
module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    screens: { sm:'640px', md:'768px', lg:'1024px', xl:'1280px', wide:'1440px', '2xl':'1536px', '3xl':'1920px' }, // full override: extend would mis-order
    fontWeight: { light:'300', normal:'400', medium:'500', bold:'700' },                                   // full override: no 600 in Focal
    extend: {
      colors: {
        canvas:c('canvas'), chassis:c('chassis'), panel:c('panel'), raised:c('raised'), inset:c('inset'),
        hover:c('hover'), scrim:c('scrim'), screen:c('screen'), bezel:c('bezel'),
        fg:{ DEFAULT:c('text-1'), 1:c('text-1'), 2:c('text-2'), 3:c('text-3'), disabled:c('text-disabled'),
             'on-screen':c('text-on-screen'), 'on-screen-2':c('text-on-screen-2') },
        line:{ subtle:c('border-subtle'), strong:c('border-strong'), control:c('border-control') },
        accent:{ DEFAULT:c('accent'), hover:c('accent-hover'), press:c('accent-press'), ink:c('accent-ink'),
                 soft:'rgb(var(--c-accent) / var(--a-accent-soft))' },
        focus:c('focus'), success:c('success'), warning:c('warning'), danger:c('danger'), info:c('accent'),
        tally:{ program:c('tally-program'), preview:c('tally-preview'), rec:c('tally-rec'), cue:c('tally-cue'),
                standby:c('tally-standby'), off:c('tally-off'), ink:c('tally-ink') },
        ramp:{ 0:c('ramp-0'), 1:c('ramp-1'), 2:c('ramp-2'), 3:c('ramp-3'), glint:c('ramp-glint') },
        chrome,
        // ---- DEPRECATED migration aliases (removed in the final phase; grep gate §10) ----
        'fal-primary': chrome,                               // was silently violet; now chrome, 50–950
        'fal-gray': { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
        'fal-green': { 400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d' },
        'fal-yellow':{ 400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207' },
        'fal-blue':  { 400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8' },
        'fal-red':   { 400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c' },
      },
      borderColor: { DEFAULT: 'rgb(var(--c-border-subtle) / <alpha-value>)' }, // replaces `* {}` and `.dark * {}`
      fontFamily: {
        sans:['var(--font-sans)','ui-sans-serif','system-ui','Segoe UI','Helvetica','Arial','sans-serif'],
        focal:['var(--font-sans)','ui-sans-serif','system-ui','sans-serif'],   // alias, same stack
        mono:['var(--font-mono)','ui-monospace','SFMono-Regular','Menlo','Consolas','monospace'],
      },
      fontSize: { /* exactly §3.2 */ },
      borderRadius: { xs:'var(--r-xs)', sm:'var(--r-sm)', md:'var(--r-md)', lg:'var(--r-lg)',
                      pill:'9999px', screen:'var(--r-screen)', lamp:'var(--r-lamp)' },
      boxShadow: { e1:'var(--shadow-e1)', e2:'var(--shadow-e2)', e3:'var(--shadow-e3)',
                   key:'var(--shadow-key)', 'key-pressed':'var(--shadow-key-pressed)' },
      spacing: { cmd:'48px', navrow:'44px', status:'24px', slate:'48px', strip:'28px',
                 transport:'56px', telemetry:'32px', dock:'200px', 'dock-collapsed':'36px' },
      zIndex: { dither:'-10', raised:'10', bar:'40', drawer:'50', popover:'60', scrim:'70',
                dialog:'80', chyron:'90', tooltip:'100', boot:'9999' },
      transitionDuration: { tick:'60ms', fast:'120ms', resolve:'160ms', base:'200ms', slow:'320ms', reveal:'480ms', house:'1200ms' },
      transitionTimingFunction: { out:'cubic-bezier(.16,1,.3,1)', 'in-out':'cubic-bezier(.65,0,.35,1)',
        exit:'cubic-bezier(.4,0,1,1)', key:'cubic-bezier(.3,0,0,1)', crt:'cubic-bezier(.2,.9,.1,1)', spec:'cubic-bezier(.45,0,.2,1)' },
      keyframes: { /* px-resolve, skeleton-sweep, bayer-blink, led-stall, scan-step, coast-sprite, boot-failsafe: §5 */ },
      animation: { 'coast-sprite':'coast-sprite 800ms steps(8,end) infinite',
                   'skeleton-sweep':'skeleton-sweep 1400ms steps(28,end) infinite',
                   'bayer-blink':'bayer-blink 880ms steps(1,end) infinite' },
    },
  },
  plugins: [],   // tailwindcss-animate and @tailwindcss/typography stay unregistered (unused)
}
```

**Collision removal.** Delete the whole nested `fal: { light, lighter, gray, primary(violet), green, yellow, blue, red }` object, and the legacy `primary`, `success`, `warning` and `danger` block (0 usages **[v]**). After the change, `node -e` resolution of `fal-primary-500` must print `#4F83CC`. Also delete the `animation.fade-in` and `pulse-slow` entries and the `fadeIn` keyframes.

**`lib/utils.ts`:**

```ts
import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
const twMerge = extendTailwindMerge({ extend: { classGroups: {
  'font-size': [{ text: ['micro','label','caption','body-sm','body','body-lg','title-sm','title','title-lg',
                         'display','display-xl','premise','readout','readout-lg','timecode','code'] }],
  shadow: [{ shadow: ['e1','e2','e3','key','key-pressed'] }],
  rounded: [{ rounded: ['xs','sm','md','lg','pill','screen','lamp'] }],
  z: [{ z: ['dither','raised','bar','drawer','popover','scrim','dialog','chyron','tooltip','boot'] }],
  duration: [{ duration: ['tick','fast','resolve','base','slow','reveal','house'] }],
  ease: [{ ease: ['out','in-out','exit','key','crt','spec'] }],
} } })
export const cn = (...i: ClassValue[]) => twMerge(clsx(i))
```

**Legacy class shims.** These move into `@layer components` and are deleted when their last call site migrates:

| Class | Shim |
|---|---|
| `.fal-card` | `@apply surface-panel border border-line-subtle rounded-md sq shadow-e1` |
| `.fal-card-header` | `@apply flex items-center justify-between gap-3 border-b border-line-subtle px-4 py-3` |
| `.fal-card-title` | `@apply text-title text-fg` |
| `.fal-card-content` | `@apply p-4` |
| `.fal-button-secondary` | Same as `<Button variant="secondary" size="md">` |
| `.fal-button-primary` | 2 call sites. Migrate them to `<Button variant="primary">` directly. |
| `.connection-*` | Analytics only. Replaced by `<TallyLight>`. |
| `.pixel-card-latest` | **Kept permanently** as a class hook on MediaCard, restyled as the NEW lamp. |

**Codemods, in order:**

1. **Weight preservation:** `font-normal→font-light`, `font-medium→font-normal`, `font-semibold→font-medium`, `font-bold→font-medium`, `font-extrabold→font-bold`. Then re-weight by hand to match §3.
2. **Size mapping:** `text-[10px]→text-micro`, `text-[11px]→text-label`, `text-xs→text-caption`, `text-sm→text-body`, `text-base→text-body-lg`, `text-lg`/`text-xl→text-title-lg`, `text-2xl`/`text-3xl→text-display`.
3. **Undefined shades:**
   - `fal-primary-50|100|200|300 → accent-soft`, `accent` or `accent-hover`, by role.
   - `fal-purple-500 → accent`.
   - `fal-red-50/200 → danger` outline.
   - `fal-yellow-300 → warning`.
4. **Violet:** `violet-*`, `purple-*`, `#a78bfa`, `#7c3aed`, `#8b5cf6`, `#6d28d9`, `#05030b` and `#090713` → accent or ramp tokens. `#0a0d14`, `#11131a` and `#0c0c12` → `bezel`, `panel` or `inset`.
5. **Hover/dark pairs:** `hover:X dark:Y` → `hover:X dark:hover:Y` (AdminNav, ScriptEditor:125/133, AssetUrlInput:78, analytics:155).
6. **Bang modifiers:** remove `!py-*` and `!px-*`, now that the cascade is fixed.
7. **Focus rings:** remove `focus:ring-*`. The global `:focus-visible` rule covers it.
8. **Radii:** `rounded-xl` and `rounded-2xl → rounded-lg sq`; `rounded → rounded-xs sq`.
9. **Spinners:** `Loader2 animate-spin` (18 sites) → `<BayerSpinner/>`. `animate-pulse` (4) → the tally/LED primitives.
10. **Greys:** `fal-gray-*` (1015 usages **[v]**) → semantic tokens, page by page, as the primitives land.

---

## 3. Typography

### 3.1 Loading

Create `dashboard/app/fonts.ts`:

```ts
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'
export const focal = localFont({
  src: [
    { path: '../fonts/focal/focal-light-web.woff2',   weight: '300', style: 'normal' },
    { path: '../fonts/focal/focal-regular-web.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/focal/focal-medium-web.woff2',  weight: '500', style: 'normal' },
    { path: '../fonts/focal/focal-bold-web.woff2',    weight: '700', style: 'normal' },
  ],
  variable: '--font-sans', display: 'swap', preload: true, adjustFontFallback: 'Arial',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
})
export const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'] }) // variable font: 400/500/700 available
```

- Set `<html className={`${focal.variable} ${jetbrainsMono.variable}`}>` and `<body className="font-sans">`, so portals inherit both fonts.
- The formats are **woff2 only**.
- The `.otf` files and `focal-italic-web.otf` stay on disk but are unreferenced. Never delete them.
- **There are no italics in the UI.**

### 3.2 Named scale

This is the Tailwind `fontSize`. The mono entries get their family from `utilities.css` (§2.12).

| Key | Family | Size / line-height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `micro` | JBM | 10 / 12 | +0.06em | 500 | Lamp labels (sm), keycaps, badges. At most 3 words; never sentences. |
| `label` | JBM | 11 / 14 | +0.10em | 500 | Eyebrows, panel kickers, readout labels |
| `caption` | Focal | 12 / 16 | 0 | 400 | Helper text. The minimum size for any sentence. |
| `body-sm` | Focal | 13 / 18 | 0 | 400 | Compact default, rails |
| `body` | Focal | 14 / 20 | 0 | 400 | Default |
| `body-lg` | Focal | 16 / 24 | 0 | 400 | Composer, prompt fields |
| `title-sm` | Focal | 14 / 20 | −0.005em | 500 | Panel titles, the "Stream Admin" brand line |
| `title` | Focal | 16 / 22 | −0.01em | 500 | Section titles |
| `title-lg` | Focal | 20 / 26 | −0.015em | 500 | Inspector and dialog titles, bar h1s (Shotboard board title) |
| `display` | Focal | 28 / 32 | −0.02em | 500 | The single h1 on library pages |
| `display-xl` | Focal | 44 / 48 | −0.03em | 700 | Route-level slate titles (404, SIGNAL LOST). The only use of 700. |
| `premise` | Focal | 24 / 30 | −0.015em | 300 | Show premise on the standby slate. The only use of 300. |
| `readout` | JBM | 13 / 16 | 0 | 500 | Telemetry, table numbers, lamp readouts |
| `readout-lg` | JBM | 24 / 28 | −0.01em | 500 | KPIs |
| `timecode` | JBM | 28 / 32 | −0.02em | 500 | Program clock in the transport bar, uptime in the Analytics ON-AIR strip |
| `code` | JBM | 12 / 18 | 0 | 400 | Model ids, handles, env names, digests |

### 3.3 Weight policy

- The remap hack (tailwind.config.js:121-128) is deleted. The body is 400.
- Only four weights exist: 300 (`premise` only, at 24 px or more), 400 (reading text), 500 (titles, labels, buttons, readouts) and 700 (`display-xl` and the JBM ON AIR readout only).
- `font-semibold`, `font-extrabold`, `font-black`, `font-thin` and `font-extralight` do not compile and are grep-gated to 0.

### 3.4 Numerals and time

- Any number that can change while visible uses JBM with `.nums` (`tabular-nums slashed-zero`). Focal numbers inside prose that update use `tabular-nums`.
- Changing values sit in fixed `ch` slots: `min-w-[8ch]` for HH:MM:SS and `min-w-[5ch]` for ms values.

**Formats:**

| Kind | Format |
|---|---|
| Session and program clocks, uptime, REC time | `HH:MM:SS` |
| Generation and connect elapsed time | `MM:SS.s` (for example `00:07.4`) |
| Media durations | `MM:SS`, or `HH:MM:SS` from 1 h |
| Boot counter only | `HH:MM:SS:FF` |

**Preserved patterns:**
- `'Ping · {n} ms'` and `'REC {formatBytes}'` are verbatim.
- `'Live · {n}s'` becomes `'Live · HH:MM:SS'` (O15).
- `'{n} beats · {s}s runtime'` is verbatim.
- `'{n}/14'` is verbatim.
- Every format helper lives in `lib/format.ts`: `tc(seconds)`, `tcShort(ms)`, `bytes(n)`, `duration(s)`.

### 3.5 Casing

- **Sentence case** for every new label, button, heading and body string.
- **Authored uppercase** for new kickers, lamp words, slate kickers, eyebrows and model-tag plates, for example `"ON AIR"`, `"BLANK BOARD"`, `"CAST"`. Write them in uppercase in the source.
- **Never add or remove `text-transform`/`uppercase` on a preserved string.** An existing `uppercase` class that wraps a preserved string (for example the 'Character source' eyebrow) stays exactly as it is. Every other legacy `uppercase` is removed and its text authored instead. There are 12 legacy sites **[v]**; an allowlist lives in `scripts/checks/uppercase-allowlist.txt`.
- Handles are lowercase mono (`@coast`). Tokens appear as authored (`$COAST`). Model ids appear verbatim in `code` style (`minimax/h3-max/director`).

### 3.6 Icons

- lucide-react 0.294.0 with `strokeWidth={1.5}` and `absoluteStrokeWidth`.
- **Sizes:** 14 in dense rows and chips, 16 by default, 20 in the transport.
- **Colour:** `text-fg-2`, or `text-fg` when active. No colour chips.

**Allowed names (verified):** Radio, Clapperboard, UsersRound, MapPin, Film, Video, BarChart3 (the nav icons, unchanged), Command, Search, Sun, Moon, Monitor, Play, Square, Send, SendHorizontal, Circle, CircleDot, Camera, Wand2, Volume2, VolumeX, Keyboard, Lock, Unlock, ImagePlus, RotateCcw, Undo2, Copy, Download, Upload, Trash2, X, Plus, Check, AlertTriangle, AlertCircle, Info, Unplug, Plug, Cable, Tv, Signal, Clock, Timer, Gauge, Activity, Eye, Heart, Gamepad2, Users, Music, GripVertical, PanelRight, PanelBottom, LayoutGrid, Maximize2, Minimize2, ScanFace, Sparkles, ExternalLink, History, Star, Pencil, RefreshCw, Wifi, WifiOff, Layers, AtSign, CornerDownLeft, ArrowLeftRight, CassetteTape, ListVideo, SlidersHorizontal, Settings2, ChevronRight, ChevronDown.

Any other name must be checked with `node -e "require('lucide-react').X"` first. Lamps, LEDs, timecode and state words never use icons.

---

## 4. Primitive kit

All primitives are TypeScript, `'use client'` where interactive, use tokens only (no hex, no raw palette), use `cn` from `lib/utils.ts`, honour `useReducedMotion()`, and forward refs.

**Folders:**
- `components/ui/`: generic primitives
- `components/broadcast/`: lamps and LEDs
- `components/states/`: slates and skeletons
- `components/generation/`
- `components/effects/`: CSV-derived originals
- `components/brand/`
- `components/shell/`
- `components/boot/`

### 4.1 Foundations (lib/ and hooks/)

| Name | Path | API |
|---|---|---|
| useReducedMotion | `hooks/useReducedMotion.ts` | `(): boolean`. Live `matchMedia` listener (not read-once). |
| usePageVisible | `hooks/usePageVisible.ts` | `(): boolean` from `visibilitychange` |
| useDelayedFlag | `hooks/useDelayedFlag.ts` | `(active: boolean, { delayMs = 150, minMs = 300 }): boolean` |
| useLoadState | `hooks/useLoadState.ts` | `(data: T \| undefined, { isAuthed, notFound }): 'loading'\|'empty'\|'ready'\|'auth'\|'notFound'` |
| ThemeProvider / useTheme | `components/shell/ThemeProvider.tsx` | `{ pref: 'system'\|'light'\|'dark'; resolved: 'light'\|'dark'; setPref }`. Writes localStorage `theme` = `'dark'\|'light'` exactly; `'system'` **removes** the key. Toggles `.dark` and `style.colorScheme`. Listens to `prefers-color-scheme` when set to system. Replaces both the ThemeToggle state and the DitherBackground MutationObserver. |
| useDensity | `hooks/useDensity.ts` | `{ density, setDensity, locked }`. `locked` is true under the air lock. |
| ticker | `lib/motion/ticker.ts` | `register(fn: (t, dt) => void): () => void`. One rAF loop, 30 fps cap, stops when empty, pauses on hidden. |
| clock | `lib/clock.ts` | `useSecondClock(): number`. A 1 Hz `useSyncExternalStore` clock. The only 1 s timer in the app. |
| bayer | `lib/bayer.ts` | `BAYER4` (re-exported from dither-kit/pixel), `BAYER8` (local), `bayerMaskVar(n: 0..15)` |
| broadcast store | `lib/broadcast/store.ts` | `useBroadcast(sel)`, `broadcast.publish(partial)`. State: `{ director: 'idle'\|'opening'\|'live'\|'closing'\|'failed'\|'closed'; firstFrame: boolean; rec: { active, startedAt?, bytes }; air: 'off'\|'cue'\|'on'\|'stalled'\|'offair'; airSince?, stalledSince?, whip?: { kbps, fps, rttMs } }`. Derives and writes `data-broadcast`, `data-rec` and `data-lock`. |
| useWhipTruth | `lib/broadcast/useWhipTruth.ts` | `(session: WhipSession \| null) => void`. Wrapper only: attaches `connectionstatechange`, polls `getStats()` every 1000 ms, publishes `air`. twitchWhip.ts ingest logic is untouched. |
| effect slot | `lib/effectSlot.tsx` | `<EffectSlotProvider>` at each route root. `useEffectCanvasSlot(id: string, priority: number, want: boolean): boolean`. The highest priority wins; losers render their static fallback. In dev, exposes `window.__wzrd.slots`. |
| commands | `lib/commands.ts` | `useRegisterCommand({ id, group, label, shortcut?, enabled, run })`, used by the palette |
| announce | `lib/announce.ts` | `announce(text, 'polite'\|'assertive')`, feeding the single `<LiveRegion/>` pair in the shell |
| chyron store | `lib/chyron.ts` | `chyron.push({ tone: 'info'\|'success'\|'warning'\|'error', title, body?, action?: { label, run }, sticky?, ttlMs? }): id` and `chyron.dismiss(id)` |
| status message | `lib/statusMessage.ts` | `statusMessage.set({ tone, text, ttlMs = 6000 })`, shown in the StatusRail slot |
| format | `lib/format.ts` | `tc`, `tcShort`, `bytes`, `duration`, `formatMime('video/webm;codecs=vp9') → 'WebM · VP9'` |

### 4.2 Controls (components/ui)

| Primitive | API | Spec |
|---|---|---|
| **Button** | `<Button variant="primary"\|"secondary"\|"ghost"\|"danger" size="sm"\|"md"\|"lg" icon?={LucideIcon} iconRight? pending? pendingLabel? disabled? type? …>` | **primary** wraps dither-kit `DitherButton` with `color={215} variant="gradient"` and `className="h-[var(--h-control)] px-4 font-sans text-[13px] font-medium rounded-[6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:rgb(var(--c-focus))]"`. Its children are `<span className="inline-flex items-center gap-2 rounded-xs surface-hud px-2 py-0.5 text-fg-on-screen">{icon}{label}</span>` (the label plate; fixes the stacked icon). There is at most **one primary per view**. **secondary** = `surface-raised`, `border-line-control`, `shadow-key`, `text-fg`; `:active` gives `translate-y-px shadow-key-pressed` over 60 ms. **ghost** = transparent with `hover:bg-hover`. **danger** = transparent, `border-danger`, `text-danger`; never filled. **Sizes:** sm 28 px, md `--h-control`, lg 40 px. **Pending:** the label and pendingLabel share one grid cell (`inline-grid`, `[&>*]:[grid-area:1/1]`, the inactive one `invisible`), so the width is locked. A 12 px `BayerSpinner` replaces the icon. Sets `aria-busy="true"`, `aria-disabled="true"` and `data-state="pending"`, guards clicks, and **never** sets native `disabled` while pending. **Success** (900 ms): label swaps to the success word plus a success LED. **Error:** 3-frame 2 px x-jitter, 180 ms `steps(3)`, danger tone. Under reduced motion, success and error change colour only. |
| **IconButton** | `<IconButton icon label size="sm"\|"md" variant="ghost"\|"secondary" pressed?>` | `label` is required by type (becomes `aria-label`). 28 or 32 px, with a 44 px hit area on coarse pointers. `pressed` sets `aria-pressed`. |
| **HoldButton** | `<HoldButton holdMs={600} onConfirm confirm={{ title, body, confirmLabel }} variant="secondary"\|"danger" label>` | A pointer hold, or Space/Enter held while focused, fills an SVG ring (stroke-dashoffset, linear, 600 ms). Releasing early cancels. A quick press under 200 ms, a click, or an assistive-technology activation opens the **ConfirmDialog**, which is the accessible path. Reduced motion shows no ring animation (dialog only). |
| **Panel** | `<Panel tone="panel"\|"inset"\|"chassis"\|"screen" as="section" title? eyebrow? actions? footer? aria-labelledby?>` plus `Panel.Header`, `Panel.Body`, `Panel.Footer` | `panel` = `surface-panel border border-line-subtle rounded-md sq shadow-e1`. Padding is `--pad-panel`. `screen` = `bg-screen rounded-screen`, not squircled. Replaces `.fal-card*`. |
| **SectionHeader** | `<SectionHeader eyebrow? title titleAs="h2"\|"h3" meta? actions?>` | Eyebrow `label` in text-3, title `title`, meta `readout` text-3. |
| **PageHeader** | `<PageHeader eyebrow title description? actions?>` | Renders the route's **only h1** (`display`). At most 96 px tall. Not used on Live Control or Shotboard, which use bar h1s. |
| **Field** | `<Field label hint? error? required? htmlFor>` | Label `body-sm` medium. Hint `caption` text-3 via `aria-describedby`. Error `caption` text-danger with `role="alert"`. |
| **Input / Textarea / Select** | Native elements. `<Textarea autoGrow? mono? maxRows?>` | `surface-inset border border-line-control rounded-sm sq h-[var(--h-control)] px-3 text-body`. Placeholder in text-3. Fixes the native grey textarea. |
| **Switch** | `<Switch checked onCheckedChange label description?>` | `role="switch"` with `aria-checked`. The track is 32×18 inset; the thumb 14 px, `bg-fg` when off and `bg-accent` when on, moving 120 ms `--ease-key`. The label is its accessible name (for example 'Lock the face and overall look across generations'). |
| **Checkbox / RadioGroup** | Native inputs, restyled | `border-line-control`. Checked = `bg-accent` with an accent-ink check. |
| **SegmentedControl** | `<SegmentedControl value onValueChange options={[{value,label,icon?}]} label>` | `role="radiogroup"` with a roving tabindex. Selected = `bg-accent-soft text-accent` plus a 1 px accent border. |
| **Slider** | `<Slider>` = native `<input type="range">` restyled | Keeps native semantics ('Music mix volume', 'Music start offset'). Track inset, fill accent, thumb 14 px bezel with an accent ring. |
| **NumberStepper** | `<NumberStepper value min max step label unit>` | For shot duration. Buttons −/+ plus an input. |
| **Badge** | `<Badge tone="neutral"\|"accent"\|"success"\|"warning"\|"danger" variant="soft"\|"outline">` | `micro`, `rounded-xs`, 18 px tall. |
| **Chip** | `<Chip icon? mono? selected? onRemove? removeLabel?>` | 24 px, `rounded-sm sq`, `surface-inset`. Used for handles, cast and locked settings. |
| **Tabs** | `<Tabs value onValueChange keepMounted={true}>` with `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel` | Roving tabindex; the active tab has a 2 px accent bar. `keepMounted` hides panels with the `hidden` attribute instead of unmounting (required on Live Control). |
| **Tooltip** | `<Tooltip content side delay={400}>` | Opens on hover and focus. `surface-raised shadow-e2`, `caption`. Escape closes it. Never the only source of a label. |
| **Kbd** | `<Kbd keys={['mod','K']}/>` | Platform-aware (⌘ or Ctrl). `micro`, `surface-inset`, `border-line-subtle`. |
| **Dialog** | `<Dialog open onClose title description? size="sm"\|"md"\|"lg">` on native `<dialog>` | `surface-raised shadow-e3 rounded-lg sq` over `bg-scrim/[var(--a-scrim)]`. Enter is a 160 ms resolve; exit is 120 ms opacity. Focus is trapped natively and returned on close. |
| **ConfirmDialog** | `<ConfirmDialog open title body confirmLabel destructive? typeToConfirm?={string} onConfirm onCancel>` | Used for Delete board (type the title), Delete recording ('Delete this recording permanently?'), Go live, and leaving Live Control under the air lock. |
| **Sheet** | `<Sheet side="right"\|"bottom" open onClose title width={360}>` | 320 ms `--ease-out` translate. Instant under the air lock and reduced motion. |
| **Popover** | `<Popover trigger content align>` | `surface-raised shadow-e2`, 200 ms resolve. |
| **ScrollFade** | `<ScrollFade axis="x"\|"y">` | Applies `.edge-fade-*` only while the content overflows (ResizeObserver). |
| **InlineBanner** | `<InlineBanner tone kicker? action?>` | 1 px tone border, `surface-panel`, a 4 px left bar with a 50% Bayer mask in the tone colour. Used for advisories, the Shotboard not-configured sentence and offline. |
| **BayerSpinner** | `<BayerSpinner size={12\|16} label?>` | A 4×4 grid of 2 px (12) or 3 px (16) squares in `currentColor`. Each has `--b` = its BAYER4 index and runs `bayer-blink` 880 ms `steps(1)` with delay `calc(var(--b)*55ms)`. Under reduced motion it is static: squares at .6 and the centre cell at 1. Optional `role="status"` label. |
| **VisuallyHidden / SkipLink / LiveRegion** | Standard | The SkipLink targets `#content`. LiveRegion renders one polite and one assertive region in the shell. |

### 4.3 Broadcast (components/broadcast)

| Primitive | API | Spec |
|---|---|---|
| **TallyLight** | `<TallyLight kind="program"\|"preview"\|"rec"\|"cue"\|"standby"\|"stalled" lit={boolean} label srLabel size="sm"\|"md" readout?>` | The housing is always `bg-bezel`, `border border-white/[.08]`, `rounded-screen`. **md:** 20 px tall, 8 px padding, an 8×8 LED, and a `PixelFace` label at a 2 px cell (14 px cap). **sm:** 16 px, a 6 px LED and a `micro` label. **Lit program/preview:** the whole face fills with the tally colour and the label is `tally-ink`. **rec:** 1.5 px ring plus label in `tally-rec`; never filled. **cue:** amber ring plus label, steady. **standby:** grey ring; label `text-on-screen-2`. **Unlit:** `tally-off` ring, label `text-on-screen-2`. **stalled:** red outline with a hatch `repeating-linear-gradient(135deg, rgb(var(--c-tally-program)/.35) 0 2px, transparent 2px 4px)` and a red label; `led-stall` 1 Hz `steps(2)` for at most 5 iterations, then steady (reduced motion: steady). A lit change runs a 160 ms resolve once (reduced motion: a cut). `srLabel` is the spoken word ("Preview", "On air"). `readout` sits outside the face in `readout` text-on-screen. |
| **TallyBar** | `<TallyBar/>` (reads the broadcast store) | 28 px inside the monitor bezel. Left: `STBY`/`PVW` lamp, then the `REC` lamp plus readout `REC {bytes} · HH:MM:SS`. Right: the `ON AIR` lamp (`OFF AIR` → `CUE` → `ON AIR` → `STALLED 00:06` → `OFF AIR` for 3 s → `OFF AIR` dim). |
| **TallyCluster** | `<TallyCluster compact?/>` | Command bar. Three sm lamps: `PVW`, `REC` and `AIR` (the label reads `ON AIR` when lit, width-locked). Below `lg` it collapses to one lamp showing the highest state (AIR > REC > PVW > STBY). |
| **Led** | `<Led tone="off"\|"accent"\|"success"\|"warning"\|"danger" label labelHidden?>` | 8×8, `rounded-lamp`. Off = 1 px `border-line-control`. Lit = fill plus `box-shadow: 0 0 0 2px rgb(tone/.22)`. The label is always present, visually or as sr-only text. |
| **Readout** | `<Readout label value unit? tone?>` | Label in `label` text-3, value in `readout` with `.nums`. Updates at most once per second and **snaps** (no roll). |
| **LedLadder** | `<LedLadder value segments={4\|20} thresholds={{ warn, danger }} label valueText>` | CSS segments 4×10 px (4-segment) or 20×3 px (20-segment), lit in success, warning or danger. `role="meter"` with `aria-valuenow` and `aria-valuetext`. No canvas. |
| **StatTile** | `<StatTile label value format="int"\|"duration"\|"text" icon? trend?={number[]} countUp?>` | Panel with `readout-lg` value, a monochrome icon, and an optional inline SVG polyline sparkline (1.5 px accent, **not** dither-kit). CountUp runs on first reveal only. |
| **FreshnessStamp** | `<FreshnessStamp at={ms} staleAfterMs>` | "Updated 12s ago", ticking from `useSecondClock`. Turns `text-warning` with a warning LED once past `staleAfterMs`. |

### 4.4 States, generation, effects, brand and shell

| Primitive | Path | API | Spec |
|---|---|---|---|
| **Slate** | `components/states/Slate.tsx` | `<Slate kind="empty"\|"not-configured"\|"auth"\|"offline"\|"error"\|"not-found"\|"standby" kicker art title body? actions? size="route"\|"panel">` | Detailed in §5.9. |
| **NotConfigured** | `components/states/NotConfigured.tsx` | `<NotConfigured feature? message? envVars={['NEXT_PUBLIC_CONVEX_URL']} cmd="npx convex dev" size>` | Renders the exact ConvexNotConfigured copy ('Convex is not configured', `NEXT_PUBLIC_CONVEX_URL`, `npx convex dev`, `dashboard/`) or the exact `message` passed in. `components/ConvexNotConfigured.tsx` stays as a thin wrapper with the same `feature` prop. |
| **AuthRequired / ErrorState** | `components/states/` | `<AuthRequired/>`, `<ErrorState error digest? onRetry onCopy/>` | §7.8 |
| **Skeleton** | `components/states/Skeleton.tsx` | `<Skeleton shape="text"\|"media"\|"block" lines? ratio? w? h?/>` | Layout-exact compositions live in `components/states/skeletons/{LiveSkeleton,ShotboardSkeleton,StudioSkeleton,ClipsSkeleton,RecordingsSkeleton,AnalyticsSkeleton}.tsx`. |
| **GenerationFrame** | `components/generation/GenerationFrame.tsx` | `<GenerationFrame phase="saving"\|"expanding"\|"queued"\|"running"\|"uploading"\|"done"\|"failed" modelLabel startedAt etaMs? queuePosition? progress?={done,total} previousUrl? error? onRetry? ratio/>` | §5.4 |
| **StageTrack** | `components/generation/StageTrack.tsx` | `<StageTrack stages={{id,label}[]} current status="running"\|"done"\|"failed" orientation="horizontal"\|"vertical"/>` | Stepper study. |
| **ContactSheet** | `components/generation/ContactSheet.tsx` | `<ContactSheet items onPromote onRemove selectable/>` | Review-before-promote grid. |
| **Effects** | `components/effects/` | PxResolve, DecryptedText, CountUp, PixelFace, SelectionBrackets, SymbolRaster, HoloCard, HoverClipButton, StreamList | APIs in §8. |
| **Wordmark** | `components/brand/Wordmark.tsx` | `<Wordmark height={20} id="wzrd-bug"/>` | `<picture>` with AVIF then WebP from `/brand/wordmark/wzrdtech-{160,320}`, explicit `width`/`height` (81×20 at 20 px), `alt="WZRD.TECH"`, `data-boot-target`. |
| **CoastLoader** | `components/brand/CoastLoader.tsx` | `<CoastLoader size={64\|128} label/>` | CSS background strip `/brand/loader/coast-boot-strip@2x.png`, `animation: coast-sprite 800ms steps(8) infinite`, `image-rendering: pixelated`, `role="status"` plus visible caption. Reduced motion and the air lock show the still. |
| **BrandImage / BrandVideo** | `components/brand/` | `<BrandImage id sizes alt/>`, `<BrandVideo id poster loop muted/>` | Read `lib/brandAssets.ts` (generated). `<picture>` with AVIF, WebP, explicit dimensions, `loading="lazy"` and a blur placeholder. Video has `preload="none"`, plays when visible, pauses when hidden, and shows the poster only under reduced motion or the air lock. |
| **Shell** | `components/shell/` | AppShell, CommandBar, AppNav, TallyCluster (re-export), StatusRail, ThemeSwitch (`role="radiogroup"` System/Light/Dark with Monitor/Sun/Moon icons, aria-labels), DensitySwitch, CommandPalette, ShortcutSheet, ChyronHost, RouteProgress, OfflineBanner | §6 |
| **Boot** | `components/boot/` | `BootMarkup.tsx` (server: `<BootMarkup convexConfigured={boolean}/>`), `bootScript.ts` (exports `BOOT_SCRIPT`, `BOOT_CSS`), `masks.ts` (base64 1-bit masks) | §5.1 |

---

## 5. Motion system and signature moments

### 5.1 Boot: "POST → wordmark → carrier"

**Where it lives.** `BootMarkup` is the first child of `<body>` in `app/layout.tsx`, followed immediately by an inline `<script>{BOOT_SCRIPT}</script>`. It sits before `<DitherBackground/>`. The existing `themeInit` in `<head>` runs first and is extended (without changing its theme logic) to also apply `data-density` from `wzrd:density`.

**Layers, bottom to top:**

| Layer | Content |
|---|---|
| L0 | `body` in `--c-canvas` |
| L1 | Carrier. It fades in over 600 ms `--ease-out` after its first frame. |
| L2 | App, which hydrates immediately and is never blocked. |
| L3 | `#wzrd-boot`: `position:fixed; inset:0; z-index:9999; contain:strict; pointer-events:none; background:rgb(var(--c-canvas))`, `aria-hidden`. It contains `<canvas id="wzrd-boot-cv">` (4 px cells, `cols=ceil(innerWidth/4)`, `rows=ceil(innerHeight/4)`, one `ImageData` with a `Uint32Array` view, CSS 100% with `image-rendering:pixelated`); `<img id="wzrd-boot-mark" src="/brand/wordmark/wzrdtech-640.webp" width="480" height="119" alt="">`; and `<div id="wzrd-boot-post">` (DOM text). |
| L4 | `<div role="status" class="sr-only">Loading stream.wzrd.tech</div>`, removed at the end. |

**Composition.** A centred vertical stack at 45% of viewport height:
1. Power LED, 8×8.
2. 16 px gap, then the display strip, 192×8 CSS px in four blocks: ramp-1, ramp-2, ramp-3, ramp-glint.
3. 24 px gap, then the wordmark box. It is 480×120 on ≥768 (mask 120×30 cells at 4 px) or 320×80 below 768 (mask 80×20).
4. 24 px gap, then a row: the Coast sprite (128×128, which is the 32×32 source at 4 px), 24 px, and the POST list.
5. 16 px gap, then the mono line `STREAM.WZRD.TECH · CH 05 · 5DEE` in `micro` text-3.

The POST list has five rows in `micro`, each with an LED: `DISPLAY`, `TYPE`, `THEME`, `PATCH`, `WAVE`.

**Gates.** These are evaluated synchronously in the inline script, before first paint.
- **Skip entirely** (remove the node) if `navigator.webdriver`, `?noboot` is present, or `document.visibilityState === 'hidden'`.
- **Repeat visit** in the session (`sessionStorage['wzrd:boot']` is set): run the channel flip.
- **Reduced motion:** show a static card (wordmark image plus mono line, no canvas) for 250 ms, then a 150 ms opacity fade, then remove. On repeat visits under reduced motion, skip.
- **Failsafe for no JS or a script error:** `#wzrd-boot { animation: boot-failsafe 1ms linear 2000ms forwards }` with `@keyframes boot-failsafe { to { opacity:0; visibility:hidden } }`.

**First-visit timeline.** The hard cap is **1600 ms from navigation start** (`performance.now()`). If the script starts after 300 ms, it jumps directly to the wordmark phase.

| t (ms) | Event |
|---|---|
| 0 | SSR: the overlay is opaque canvas colour; the power LED shows as a 1 px `border-control` outline. `html[data-boot]` hides `#wzrd-bug` (opacity 0). |
| 60 | CSS only: the power LED lights in accent (`steps(1)`). |
| 100–300 | Canvas: the display strip resolves. Cell (x,y) is lit when `easeOutCubic(p) > BAYER8[y&7][x&7]`, with `p=(t−100)/200`. |
| 300–600 | Coast sprite frame 1 materialises with the same rule over 300 ms. It is skipped if `/brand/loader/coast-boot-strip@2x.png` has not decoded by 300 ms. The POST list appears (`steps(1)`). Its LEDs light as real conditions resolve: **DISPLAY** on the first rAF; **THEME** immediately; **TYPE** on `document.fonts.ready` (amber `FALLBACK` if not ready by 400 ms); **PATCH** green when `data-convex="1"` (rendered by the server from `NEXT_PUBLIC_CONVEX_URL` presence), else amber `NOT PATCHED`; **WAVE** green on `wzrd:dither-ready`, amber `STATIC` if `{webgl:false}`, hollow if nothing has arrived by 1200. No network requests are made. |
| 600–1000 | The sprite plays frames 2–5 at 10 fps. |
| 600–900 | The wordmark mask cells light in Bayer-8 order in ramp-3. |
| 900–1020 | The crisp wordmark `<img>` goes from opacity 0 to 1 (120 ms linear). The mask cells clear at 1020. |
| 1020–1360 | **Glint**, the only shimmer in the system. `#wzrd-boot-mark::after` is a 28° band, 18% of the box width, `#ECF4FF` at .55, moving translateX −120%→120% over 340 ms with `--ease-spec`. It is clipped by `mask-image: url(/brand/wordmark/wzrdtech-640.webp)` (the mark's own alpha). |
| 1200–1560 | **Handoff.** In a single frame, the overlay's CSS background becomes transparent and the canvas paints every cell in canvas colour. Cells then clear in **reverse Bayer-8 order** over 360 ms (`easeInOutCubic`), revealing the app and the carrier. The Bayer-quantised carrier reads as the POST dissolving into it. The POST and sprite text fade out over 160 ms `steps(4)`. |
| 1200–1600 | **FLIP.** The script measures `#wzrd-bug` and translates and scales `#wzrd-boot-mark` to that rect over 400 ms `--ease-out`. If the bug is missing, hidden or zero-sized, the mark fades out over 160 ms instead. |
| 1600 | Remove `data-boot` (the bug becomes visible, a seamless swap), remove the node, set `canvas.width=0`, and set `sessionStorage['wzrd:boot']='1'`. |

- **Interrupt:** any `keydown` or `pointerdown` jumps straight to a 200 ms reverse-Bayer clear with no FLIP (the mark fades), finishing within 200 ms.
- **Channel flip** (repeat visit, 240 ms): 0–80 ms static burst (xorshift-seeded cells at 35% density in ramp-1 to ramp-3), then 80–240 ms reverse-Bayer clear. No wordmark, no POST.

**Readiness contract.**
- `Dither.jsx` gains an `onFirstFrame({ webgl: boolean })` prop, called once after the first `renderer.render`, and **also in the WebGL-failure catch branch**.
- DitherBackground then sets `window.__wzrdDitherReady = true` and dispatches `new CustomEvent('wzrd:dither-ready', { detail })`.
- The boot script reads the flag first, so it works whichever side finishes first.

**Constraints:**
- `BOOT_SCRIPT` plus masks is at most 4 KB gzipped.
- Canvas2D only, with no WebGL. About 0.4 ms per frame.
- **Zero console output.**
- Zero layout shift.
- It never waits on the network except the same-origin sprite and wordmark, both preloaded with `<link rel="preload" as="image">`.

**Route loading** (`app/admin/**/loading.tsx`, one file per route segment):
- A layout-exact skeleton of the target page (§5.6).
- A `<CoastLoader size={64}>` in the header slot, with a visible caption `caption` text-3 "Loading Shotboard" (the route name) and `role="status"`.
- The whole fallback starts at opacity 0 and appears after 150 ms (`animation: appear 1ms 150ms forwards`), so fast navigations never flash.

### 5.2 Route transitions

- **Enter:** `app/admin/template.tsx` wraps children in `<div className="px-resolve">`. `@keyframes px-resolve` steps through 0% `--bayer-4-03`, 25% `--bayer-4-07`, 50% `--bayer-4-11`, 75% `--bayer-4-15`, and 100% `mask-image: none`, over 160 ms with `steps(1,end)` per segment and `animation-fill-mode: both`. There is no translate and zero CLS. The old page is cut. Browsers without mask support fall back to opacity 0→1 over 120 ms.
- **Reduced motion or air lock:** no transition.
- **Nav indicator:** a 2 px bar in `accent` with a 50% Bayer mask sits under the active link. It moves with `motion/react` `layoutId="nav-indicator"` over 200 ms `[.16,1,.3,1]`, transform only. The active LED (6 px) snaps in 60 ms. Reduced motion makes the bar jump. This also retires the `.dark *` underline bug.
- **RouteProgress:** each nav Link renders an inner `<LinkPending/>` using `useLinkStatus()`. When `pending` has lasted more than 120 ms, a 2 px bar appears at the bottom edge of the command bar: accent with a 24 px leading edge at 50% Bayer, `scaleX` from .1 toward .9 with `steps(16)` over 2400 ms, then holding. When pending ends, it fills to 1 over 120 ms and fades over 120 ms.

### 5.3 Director "Signal acquisition" (connect → first frame)

- **Idle:** the monitor shows the **standby slate** (§7.1). Behind it is a `SymbolRaster` of `standby/coast-{aspect}` at `density=1` (the full image), painted once per resize or theme change.
- **Start Director:** the raster cuts to `density=.10`, then steps to `.25/.40/.60/.80` as `connectStep` reaches 1–4. It repaints only on step change, with no rAF loop.
- **Overlay plate** (`surface-hud`, bottom-left, 16 px inset):
  - A vertical `StageTrack` of the five **verbatim** CONNECT_STEPS ('Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene').
  - The active label runs `DecryptedText` once (≤320 ms).
  - `T+00:07.4` in `readout`.
  - The latest diagnostic line in `code` text-on-screen.
  - A **'Cancel'** button (exact accessible name, calls `disconnect()`) with an aria-hidden `<Kbd keys={['Esc']}>` beside it.
- The overlay and raster stay until the **first decoded frame**: `video.requestVideoFrameCallback`, falling back to the first `loadeddata` or `playing` after `srcObject` is set. They do not end on transport 'live'.
- Then the raster clears in reverse Bayer-8 order over 320 ms (rAF, slot owner at priority 3), and the canvas unmounts. The store sets `firstFrame=true`, which makes `data-broadcast="preview"` and lights the PVW lamp. The brackets tighten 4 px once (200 ms).
- **Reduced motion:** a static segmented StageTrack, no decrypt, and a 150 ms opacity crossfade to video.

### 5.4 Generation resolve (images)

`GenerationFrame` is **CSS only** and fills the existing aspect box. It is driven by real status:
- `lib/imageGen.ts` gains an optional `onStatus`.
- `fal.subscribe(endpoint, { input, logs: true, onQueueUpdate })` maps IN_QUEUE to `{phase:'queued', position}`, IN_PROGRESS to `running`, and COMPLETED to `done`.
- The library pipelines prepend `saving` and `expanding` and append `uploading i/n`.
- Endpoints and inputs are unchanged.

**Layers:**
1. `bg-screen`.
2. `previousUrl` (edit mode) at opacity .35 with `grayscale(1) contrast(1.2)`.
3. The field: a div with `background: rgb(var(--c-ramp-3))` and `mask-image: var(--bayer-4-NN)`, where NN comes from quantised density (16 levels).
4. The scanline (running only): a 2 px accent line, translateY `steps(16)` over 1600 ms, infinite.
5. Plates, `surface-hud` with `micro` text-on-screen: top-left is the model label as authored (for example `GPT Image 2.5 Sunburst`); bottom-left is the phase readout.

**Density by phase:**

| Phase | Density (tile) | Readout |
|---|---|---|
| saving / expanding | 2/16 (`-01`) | `SAVING` / `EXPANDING` (DecryptedText on phase change) |
| queued | 3/16 (`-02`), **static, no blink** | `QUEUE 03`, changing only when the position changes |
| running | `d(t)=0.12+0.73·(1−e^(−t/τ))`, with τ = `IMAGE_MODEL_ETA_MS[model]/2.3`, quantised to at most `-12`, updated at most 4 Hz by the shared ticker | `RENDER 00:14.2 · ~00:22` |
| uploading | `-13` | `UPLOAD 2/4` |
| done | After `await img.decode()`, the real image renders with `.px-resolve` (160 ms), then the field unmounts. | `SAVED`, for 900 ms, then the plates are removed |
| failed | The field freezes at `-03`, recoloured `rgb(var(--c-danger))` | `SIGNAL LOST · <reason>` plus `<Button size="sm" variant="secondary">Retry</Button>` |

- `IMAGE_MODEL_ETA_MS` is added to `lib/imageModels.ts`. Its values are **measured** by the implementer; the defaults until then are nano-banana 12000, gpt-flare 20000, gpt-sunburst 30000.
- **Failure display:** failed renders the persisted `imageStatus:'failed'`, which today is never shown.
- **Accessibility:** `aria-busy` on the box, and one polite announcement per phase change.
- **Reduced motion:** a static 25% field plus the phase text, no scanline, and a 150 ms crossfade on land.
- Any number of frames can run at once, because there is no canvas.

### 5.5 Going ON AIR

1. **Preconditions:** `data-broadcast="preview"` and a stream key present. Otherwise the button is disabled with a Tooltip reading 'Start the Director session first'.
2. **"Go live on Twitch"** is a `HoldButton` (600 ms). A click or Enter opens a ConfirmDialog: title "Go live on Twitch?", body "Viewers on twitch.tv/{channel} will see program output.", confirm "Go live".
3. **On commit:** the label becomes "Negotiating…" (width-locked), and `air='cue'` makes the ON AIR lamp a **steady amber `CUE`** ring.
4. **Truth gate:** `pc.connectionState === 'connected'` **and** outbound-rtp `bytesSent` increased between two `getStats()` polls 1000 ms apart.
5. **At T0:**
   - The lamp resolves in 4 steps over 160 ms to solid `#FF3B30` with the ink label `ON AIR`.
   - A 2 px `tally-program` keyline cuts in on the bezel's **outer** edge. The picture itself is never touched.
   - `data-broadcast="on-air"`, which triggers house lights down: veil .62/.72 and speed .02, tweened over 1200 ms.
   - `document.title` becomes `● ON AIR · stream.wzrd.tech admin`, and `link[rel=icon]` switches to `/brand/icons/favicon-onair.svg`.
   - `announce('On air','assertive')`.
   - The button becomes a danger-outline "Stop broadcast".
   - There is no sound, no glow and no pulse.
6. **Stalled:** `connectionState` of `failed` or `disconnected`, or `bytesSent` flat for 4 s, sets `air='stalled'`.
   - The lamp shows `STALLED 00:06` (counting), hatched, blinking at most 5 cycles.
   - A **sticky `role="alert"` chyron** shows "Twitch ingest lost · 00:00:04" (counting), with a "Stop broadcast" action.
   - The status rail's TWITCH LED shows danger.
   - The lamp **never** shows ON AIR while stalled. On recovery it returns to ON AIR with a polite "On air again".
7. **Off air:** the lamp resolves back to hollow `OFF AIR` (held 3 s, then dim). House lights come up over 1200 ms. The title and favicon are restored. The status rail shows "Off air · 01:12:44".
8. **Reduced motion:** every change is a cut, and the veil changes instantly.

### 5.6 Skeletons

`.skeleton-dither`:
- **Base layer:** `background-color: rgb(var(--c-ramp-3) / var(--a-skel))` with the `--bayer-4-03` mask.
- **`::after`:** 300% width, the same colour, masked by `--bayer-4-07` intersected with a `linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent)` (`mask-composite: intersect`; `-webkit-mask-composite: source-in`). It animates `translateX(-66%)→0` over 1400 ms `steps(28,end)`, infinite.
- **Reduced motion or air lock:** no `::after`, which leaves a static 25% field.

**Timing:** `useDelayedFlag(loading, {delayMs:150, minMs:300})`. The exit is a 160 ms `px-resolve` of the content, so there is no shift.

**Accessibility:** `aria-busy` on the container, plus an sr-only `role="status"` such as "Loading clips".

Skeletons **mirror the real DOM geometry**. One per route, plus in-page ones for the sheet history, track list, script picker and roster.

### 5.7 Pending buttons, toasts (chyrons) and lists

- **Pending buttons:** see Button in §4.2. This replaces all 18 `Loader2` sites **[v]**.
- **ChyronHost** position:
  - **Desktop:** fixed, `left: var(--gutter)`, `bottom: calc(var(--h-status) + 12px)`, 360 px wide, at most 3 stacked with the newest on top. On Live Control it docks over the **left rail bottom** and never overlaps the program column or transport.
  - **Mobile:** full width minus 16 px, above the transport or status rail.
- **Chyron style:**
  - `surface-raised shadow-e2 rounded-sm sq`, with a 4 px left bar in the tone colour and a 50% Bayer mask.
  - An authored-uppercase kicker `INFO`, `SAVED`, `WARN` or `ERROR` in `micro`, and the body in `body-sm`.
  - **Enter:** 160 ms `px-resolve`. **Exit:** 120 ms opacity.
- **Chyron durations:** info and success auto-dismiss after 5000 ms, warnings after 8000 ms, and undo chyrons after 8000 ms with an "Undo" action. Hover or focus pauses the timer. Errors are sticky with a dismiss control and "Copy details". Notices use `role="status"` and errors use `role="alert"`.
- **Under the air lock:** info, success and warning go to the **StatusRail message slot** (a cut, no motion). Errors still chyron.
- **StreamList** (the Animated List study) is used for the direction queue, chat log and event console. New rows resolve over 120 ms (4×30 ms) with no slide. The stagger is 30 ms for up to 8 rows. It sticks to the newest row only when the user is already at the edge. It has no gradients and no arrow navigation. Reduced motion shows rows instantly.

### 5.8 Air lock matrix (`html[data-lock="air"]`)

| Allowed | Frozen or forbidden |
|---|---|
| Lamp and LED state changes (a 160 ms resolve, once) | Skeleton sweep (static), CoastLoader (still), HoloCard tilt, HoverClip play, BrandVideo (poster) |
| Telemetry snapping at ≤1 Hz; the timeline playhead (linear transform) | Route transitions, CountUp (final value shown), DecryptedText except CONNECT_STEPS during connecting |
| New queue, chat and event rows (120 ms resolve) | Any change of density, dock height or panel size; Sheet and Dialog open/close animate at 0 ms |
| The STALLED lamp blink (≤5 cycles) | Floating info toasts (they go to the status rail); anything animating inside the monitor or within 24 px of it, other than lamps and HUD readouts |
| The carrier retint (1200 ms, once per state change) | Hover transforms anywhere, nav indicator slide (it jumps) |

**Navigation away** from Live Control under the lock:
- AppNav `onClick` calls `preventDefault` and opens a ConfirmDialog: "Leaving Live Control ends the Director session and the broadcast." with the button "Leave and stop".
- A `beforeunload` handler is active while the lock is set.

### 5.9 Slates (empty, offline, error, 404, not-configured, standby)

**Anatomy:**
- **Art window:** `bg-screen rounded-screen`, 3:2. It is 384×256 for `route` and 192×128 for `panel`, holding `/brand/slate/<id>.webp` (art master 192×128, exported at 2×, `image-rendering: pixelated`).
- **Kicker:** `PixelFace` at a 2 px cell, in accent, at most 3 words.
- **Title:** `display-xl` (route) or `title-lg` (panel).
- **Body:** one `body` line, text-2.
- **Actions:** Buttons.
- **Layout:** two columns from `md` (art left, text column max 480 px), stacked below.
- **Entrance:** one 160 ms `px-resolve` on mount. No loops.

**Kickers:**

| Route or state | Kicker |
|---|---|
| Standby | STAND BY |
| Shotboard | BLANK BOARD |
| Characters | OPEN CASTING |
| Locations | NO SCOUTS |
| Clips | NO FOOTAGE |
| Recordings | NO TAPE |
| Analytics | NO DATA |
| Not configured | NOT PATCHED |
| Auth | NO ACCESS |
| Offline | NO CARRIER |
| Error | SIGNAL LOST |
| 404 | CH 404 |

### 5.10 Reduced-motion mapping

This is driven by `useReducedMotion()` plus a global `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:1ms!important; animation-iteration-count:1!important; transition-duration:1ms!important; scroll-behavior:auto!important } }`.

| Effect | Reduced |
|---|---|
| Carrier | One frame, no rAF loop. It re-renders once when the theme or state changes. |
| Boot | Static card for 250 ms, then a 150 ms fade. Skipped on repeat visits. |
| px-resolve, route enter | None (instant) |
| Skeleton | Static 25% field |
| BayerSpinner | Static glyph |
| DecryptedText, CountUp | Final text immediately |
| GenerationFrame | Static 25% field plus text, 150 ms crossfade |
| Connect raster clear | 150 ms crossfade |
| Lamp resolve, STALLED blink | Cut; steady |
| House lights | Instant |
| Nav indicator | Jumps |
| CoastLoader, BrandVideo, HoverClip | Still or poster |
| HoloCard | Static foil at 35° |
| Sheets, dialogs | Instant |

---

## 6. App shell

### 6.1 Structure (`app/layout.tsx`, server)

```
<html lang="en" suppressHydrationWarning class={focal.variable+' '+jetbrainsMono.variable} data-broadcast="idle">
 <head> themeInit (unchanged theme logic + density) </head>
 <body class="font-sans">
  <BootMarkup convexConfigured={!!process.env.NEXT_PUBLIC_CONVEX_URL}/> <script>{BOOT_SCRIPT}</script>
  <DitherBackground/>        ← fixed inset-0 -z-10 pointer-events-none aria-hidden: canvas + .dither-veil
  <SkipLink href="#content"/>
  <ThemeProvider><ConvexClientProvider><BroadcastProvider>
   <div class="flex min-h-dvh flex-col">
     <CommandBar/>           ← header (banner), sticky top-0, z-bar
     <OfflineBanner/>
     <main id="content" tabIndex={-1} class="flex-1">{children}</main>
     <StatusRail/>           ← footer (contentinfo), sticky bottom-0, z-bar
   </div>
   <ChyronHost/> <LiveRegion/> <CommandPalette/> <ShortcutSheet/>
  </BroadcastProvider></ConvexClientProvider></ThemeProvider>
 </body>
</html>
```

- `app/admin/layout.tsx` no longer renders AdminNav. The nav lives in the CommandBar. It wraps children in `<EffectSlotProvider>`.
- `components/AdminNav.tsx` becomes `components/shell/AppNav.tsx`, keeping the same tabs array, hrefs, labels, icons and active rule.
- `ConvexClientProvider` gains an **additive** `useConvexAuthState(): { isLoading, isAuthenticated }` context. Its default export, `useConvexEnabled` and the no-client fallback are unchanged.

**Metadata:**
- `title: { default: 'stream.wzrd.tech admin', template: '%s · stream.wzrd.tech admin' }`. Per-route titles come from new server `layout.tsx` files per segment.
- `metadataBase: new URL('https://stream.wzrd.tech')`.
- `description: 'Operator console for the WZRD.tech realtime AI livestream: MiniMax H3 Max Director, Shotboard, character and location assets, clips, recordings and Twitch analytics.'` (no mention of LTX).

### 6.2 CommandBar (48 px, `surface-chassis`, bottom border `line-subtle`)

**Left:**
- `<Wordmark height={20} id="wzrd-bug"/>`.
- A 1 px divider.
- A brand block (not a heading): "Stream Admin" in `title-sm`, and "stream.wzrd.tech" in `micro` text-3.

**Centre: AppNav.**
- One `<nav aria-label="Admin sections">`.
- Seven Next `<Link>`s with exact labels and hrefs.
- The active rule: exact match for `/admin`, `startsWith` for the others.
- `aria-current="page"` on the active link.
- Links are 32 px tall with 12 px horizontal padding, in `body-sm` medium, text-2 (active: text-1).
- 1 px dividers group the links into PRODUCE (Live Control, Shotboard) | ASSETS (Characters, Locations) | LIBRARY (Clips, Recordings) | INSIGHTS (Twitch Analytics). The group names are **not rendered**, to save space.

**Right:**
- `<TallyCluster/>`.
- A ⌘K button: `IconButton` with a Command icon, label "Open command palette", and `Kbd` shown from `xl`.
- `<ThemeSwitch/>`, three 28 px segments.
- The DensitySwitch lives in the palette only.

**Breakpoints:**

| Width | Behaviour |
|---|---|
| ≥1536 | Everything above. |
| 1280–1535 | The brand block becomes sr-only (still in the DOM). |
| 1024–1279 | Nav links are icon-only except the active one. Each inactive link keeps its exact label as sr-only text plus a Tooltip, so the accessible name is unchanged. |
| 768–1023 | Same as 1024–1279, and the TallyCluster collapses to one aggregate lamp. |
| <768 | The bar holds the wordmark (16 px), the aggregate lamp, ⌘K (Search icon) and the theme (single cycle IconButton). The **same `<nav>` element** moves to a second 44 px row through CSS grid areas (never a duplicate nav). It becomes a horizontal scroll-snap strip with full labels, `edge-fade-x`, and the active link scrolled into view on mount. |

### 6.3 StatusRail (24 px, `surface-chassis`, top border `line-subtle`, `micro` text)

This replaces the footer. From left to right:
- **NET LED:** `navigator.onLine`.
- **CONVEX LED:** green when enabled and authenticated; amber `SIGN IN` when unauthenticated after auth loads; amber `NOT PATCHED` when not configured.
- **TWITCH LED:** green when the channel env is present and a stored key exists in `wzrd_twitch_auth`; amber for partial; danger while stalled.
- The **message slot** (`flex-1`, single line, cut changes, `statusMessage`).
- The local clock `HH:MM:SS` (`readout`).
- From `xl`: "stream.wzrd.tech admin · {year}".

Each LED is a button that opens a Popover with detail and the fix (env var names in `code`). Health comes **only** from env presence and existing client state, with **zero network probes**. The footer string 'Powered by FAL realtime' is removed.

### 6.4 CommandPalette (⌘K / Ctrl+K)

- Native `<dialog>`, 640 px wide, top 15vh, `surface-raised shadow-e3 rounded-lg sq`.
- A 48 px combobox input and a listbox (`role="listbox"`, `aria-activedescendant`), showing at most 8 rows. Each row shows its Kbd hint right-aligned.
- **The list mounts only while the palette is open**, so no preserved label is duplicated in the DOM.

**Groups:**
- **Go to:** the 7 routes.
- **Director** (on `/admin` only; each enabled only when its button is enabled): Start Director, Stop, Send direction, Record, Capture frame, Remix frame, Mute/Unmute, Go live on Twitch (opens the ConfirmDialog), Cut to script, Queue script, Toggle chat steering, Open events.
- **Shotboard:** New board, Send to Director, Generate selected shot.
- **View:** Theme, Density (disabled under the air lock), Collapse dock, Keyboard shortcuts.

Destructive and on-air actions use the same guards as their buttons.

### 6.5 Keyboard map

WCAG 2.1.4: there are **no global single-character shortcuts**.

| Keys | Scope | Action |
|---|---|---|
| ⌘K / Ctrl+K | Global | Palette |
| ⌘/ / Ctrl+/ | Global | ShortcutSheet |
| Alt+1…7 (`KeyboardEvent.code` `Digit1…7`) | Global, ignored inside inputs | Nav tabs |
| Esc | Global | Close the top dialog, sheet or popover, or else cancel a connect (`disconnect()`) |
| ⌘↵ / Ctrl+Enter | Composer textarea | Start Director (idle) or Send direction (live) |
| ↑ / ↓ | Composer, empty or caret at edge | Recall the last 20 directions |
| ←→ ↑↓, Enter, G, [ ], ⌘⌫ | Shotboard canvas **when focused** | Walk shots and scenes, open the inspector, generate, change duration ±1 s, delete with an undo chyron |
| Space, J/K/L | A clip card when focused, or the open viewer | Open the viewer, then scrub |
| X | Locations grid when focused with 2 selected | A/B compare |
| ←/→, Shift+←/→ | Chart when focused | Crosshair step ±1 or ±10 |

---

## 7. Page composition

Section writers expand these summaries. Every page keeps every invariant in its audit.

### 7.1 Live Control: "The Instrument"

**Before any restyle**, extract DirectorPlayer (1342 lines) into presentational components with **no logic changes**: DirectorStage, MonitorLabelStrip, TransportBar, TelemetryStrip, SessionSheet, Rundown and Dock.
- All refs, callbacks, `connect`, `disconnect`, `handleData`, the recorders and clip rotation stay in DirectorPlayer or a `useDirectorSession` hook.
- The 1 s ping and elapsed tick move to leaf readouts through `useSecondClock` and a ping ref, so the tree stops re-rendering every second.
- The log becomes an external ring buffer of 500 entries with `useSyncExternalStore`. `pong` and `chunk` are debug level and hidden by default.

**Region and layout:**
- The whole instrument is one `<section aria-label="Director">` with `data-density="compact"`. Its visible h2 is **"Director (realtime WebRTC)"**. The route h1 "Live Control" is sr-only.
- The root is `w-[min(100vw-32px,1920px)] mx-auto`, and at ≥1024 `h-[calc(100dvh-var(--h-cmd)-var(--h-status))]`, which gives **zero page scroll at ≥1280×800**.
- Grid: `grid-template-areas: "session program rundown" "session dock rundown"` with rows `minmax(0,1fr) var(--dock-h)` and a gap of 12.

| Width | Columns |
|---|---|
| ≥1920 | `288px minmax(0,1fr) 384px` |
| 1440–1919 | `264px minmax(0,1fr) 336px` |
| 1280–1439 | `248px minmax(0,1fr) 304px` |
| 1024–1279 | `248px minmax(0,1fr)`, with the Rundown in a right Sheet (360) opened by a "Rundown" IconButton in the label strip |
| <1024 | Single column (below) |

**Program column, top to bottom:**
1. **Label strip** (28 px): the h2 in `title-sm`, `minimax/h3-max/director` in `code` text-3, and on the right the state word (Standby, Tuning, Preview, Stopping, Failed or Off air) with `data-state={rawEnum}`.
2. **Monitor:** a `bg-bezel` frame (`rounded-screen`, 1 px `line-subtle`, 8 px padding) containing:
   - the **TallyBar** (28 px);
   - the screen, with aspect from `settings.aspectRatio` (16:9, 9:16 or 1:1), `object-contain`, height-limited;
   - inside the screen: the kept `DitherGradient` base, the **single `<video ref autoPlay playsInline muted>`** (never unmounted), the SymbolRaster, the connect plate or standby/failed slate, and SelectionBrackets (inset 12, text-3 at .7, a tag `1280×720 · H3 MAX` on the bezel below-right).
   - The **program keyline** lives on the bezel's outer edge.
3. **TransportBar** (56 px):
   - The program clock `HH:MM:SS` in `timecode`.
   - [**Start Director** (primary, idle, failed or closed) or **Stop** (secondary, opening, live or closing), exactly as `!live && !busy` today].
   - [**Record**, live only] or [**Stop & save recording**].
   - [**Capture frame** / 'Capturing…'].
   - [**Remix frame** / 'Remixing…'].
   - [Mute IconButton, 'Mute'/'Unmute'].
   - A flex spacer.
   - [**Go live on Twitch** HoldButton or **Stop broadcast**].
4. **TelemetryStrip** (32 px, `surface-inset`): `Live · HH:MM:SS`, ALLOWANCE as a 20-segment LedLadder (warning at ≤5:00, danger at ≤1:00) with "about Nm remaining", PING as a 4-segment LedLadder plus 'Ping · {n} ms' (success under 150, warning under 400, else danger), BUF (warning under 1.0 s), GEN, the REC readout, and while on air WHIP kbps, fps and RTT.

**Screen states:**
- **Idle standby slate:** a `surface-hud` plate on the right two-thirds holding the PixelFace kicker `STAND BY`, the premise (textarea value) in `premise`, capped at 3 lines, the caption **'Director offline'** (text-on-screen), and the hint "⌘↵ to start" (never repeats 'Start Director').
- **Closing:** 'Stopping…'.
- **Failed:** kicker SIGNAL LOST, **'Session failed'**, and the error summary in a `role="alert"` region below the transport with a "View events" link. Start Director is restored in the transport.

**Left rail, "Session sheet"** (`surface-chassis`, scrolls internally with `edge-fade-y`):
- **Talent card:** character sheet and first-frame thumbnails, and the name token `$COAST`.
- **PreflightList:** LEDs with one-line fixes. Convex, Twitch channel env, Twitch client id or stored key, character sheet, first frame, and script beats attached. No network calls.
- **Session settings `<details>`** ('Session settings (locked once connected)'), rendered **only when `!live && !busy`**. While live or busy, a **separate** read-only LockedSettings Chip row appears instead (for example `1080p · 16:9 · seed 42 · mem 12`).
- **Show premise:** read-only while live.
- **Twitch connection panel:** 'Connect to Twitch', 'Paste a stream key instead', with OAuth completion unchanged on mount.

**Right rail, "Rundown":** Tabs (kept mounted).
- **Direction:** the composer Textarea, `body-lg`, prefilled with DEFAULT_PROMPT, labelled **'Opening prompt (the series premise)'** or **'Next direction'**. Below it: live-only End frame and Audio attachment chips, the single **'Send direction'** button, 'Applied: …', and the vN queue StreamList (LEDs: sent is hollow, pending is warning, applied is success, rejected is danger with the reason).
- **Chat:** the ChatSteerer desk ('Chat steering', 'Chat can direct', `!direct`), with DitherAvatar kept.
- **Events:** EventConsole with level filters and copy.

**Dock** (200 px, collapsible to 36 px, persisted in `wzrd:dock`, collapsed by default when the viewport is under 820 px tall): Tabs.
- **Script:** ScriptEditor as a timeline with a seconds ruler, a beats lane and a directions lane. It keeps 'Script', 'Add shot', 'Cut to script', 'Queue script' and 'Send with session start'.
- **Audio:** TrackManager.
  - An "Armed track" `role="radiogroup"` list is the source of truth.
  - The **MorphSlider** is display-only artwork: `autoplay={false}`, render-on-demand patch, IntersectionObserver.
  - It mounts only when the Audio tab is visible, the dock is open, and `useEffectCanvasSlot('morph',2,true)` is granted. Otherwise it shows the static cover.
  - Every existing aria-label is kept, including the 'Coast originals artwork carousel' wrapper.
  - 'Music mix volume' stays a native range.
  - The Mix control keeps `primeMusic(config)` synchronous in the click handler.

**Effect-slot priorities:** SymbolRaster while connecting = 3, MorphSlider = 2, SymbolRaster idle = 1. The idle loser renders `<BrandImage id="standby-16x9">` with `image-rendering: pixelated`.

**Below 1024:**
- The monitor is sticky at `top: var(--h-cmd)` (plus the nav row below 768).
- The transport is pinned at the bottom (56 px plus the safe area).
- Below them, Tabs: Direction | Session | Script | Chat | Audio | Events.

**Hero interaction:** type, press ⌘↵, and watch vN resolve through sent → pending → applied without leaving the monitor.

### 7.2 Shotboard: "Sequencer"

**Slate bar** (48 px, sticky under the command bar, `surface-chassis`, full-bleed 16 px gutter). It holds:
- The h1: the inline-editable board title in `title-lg`, or "Shotboard" when no board is open.
- The board select with title 'Saved shotboards', and 'New board'.
- An aspect SegmentedControl.
- The style select, 'Board visual style'.
- ImageModelSelect.
- The runtime readout `'{n} beats · {s}s runtime'`, with CountUp on first reveal.
- A save LED: 'Saved', 'Saving…' or "Couldn't save", from `pendingWrites`.
- **'Send to Director'** (primary). It opens a right Sheet with a pre-flight checklist and a StageTrack: Save edits → Expand prompts n/m → Prepare transfer → Open Live Control. The existing flush → expand (≤2 concurrent) → prepare → `router.push('/admin?transfer=')` order is unchanged.
- 'Delete board' as an IconButton that opens a ConfirmDialog requiring the title to be typed.

**Body:** `240px minmax(0,1fr) 360px` at ≥1280. At 1024–1279 the inspector becomes a Sheet. Below 1024 the scene rail becomes chips and the inspector a bottom Sheet.
- **Scene rail:** a CastStrip of 36 px avatars at the top (replacing ChromaGrid; shared library characters are read-only with a "Library" badge), then scene rows `SC 01…` with 64×36 thumbnails and 'Move scene up/down'.
- **Track canvas:** one row per scene with a seconds ruler.
  - **ShotFrame:** `bg-screen rounded-screen` at the **board aspect** (never cropped). Width `max(120px, duration×16px)`. Slate tags `SC02 · SH03 · 8s`.
  - The selection uses SelectionBrackets with a tag.
  - GenerationFrame renders in-frame.
  - A failed frame shows SIGNAL LOST.
  - 'Move shot earlier/later' stays as the single-pointer reorder path.
- **Inspector:**
  - Prompt lineage: Idea, Visual override, GMI expansion (read-only, with "Use as idea"), Director prompt.
  - A per-shot model Chip with "Use board default" (fixes the sticky-model bug).
  - Cast chips (an @mention also toggles `characterIds`).
  - A duration NumberStepper (title 'Shot duration in seconds (drives the beat offset)').
  - 'Generate image', 'Regenerate image' or 'Generating…', and 'Expand' or 'Expanding…'.

**States:**
- The Suspense fallback is ShotboardSkeleton.
- `load` returning `board: null` shows NOT FOUND or NO ACCESS slates, never an infinite 'Loading shotboard…'.
- When not configured, an InlineBanner shows the exact sentence 'Convex not configured — this board lives only in this page's state and cannot be sent to Director.' Local mode stays fully usable.

**Views:** Board (default) | Contact sheet (cut-able).

**Hero interaction:** keyboard-driven sequencing on the focused canvas (§6.5).

### 7.3 Characters: "Casting"

- **PageHeader:** eyebrow 'Visual asset studio' (preserved, case unchanged), h1 **'Characters with a stable identity'**, actions 'Load SF starters' and 'New character'.
- **Grid:** `280px minmax(0,1fr) 360px` inside the 1440 px max width. At 1024–1279 the Darkroom moves below the main column. Below 1024 everything stacks. The root keeps `.asset-studio`.

**Roster rail:** each row has a 48 px squircle headshot (fallback `avatar/coast-px` for @coast, or PX initials in the ramp; `assetPlaceholder()` keeps its signature but uses the brand palette and loses the 'visual fixture' copy), the name, `@handle` in `code`, a LOCK LED, `3/14` refs in `readout`, and "last sheet 2d ago".

**Talent bible:**
- **HoloCard**, for identity-locked characters only, with @coast first.
- The turnaround strip at the sheet's native aspect with SelectionBrackets labels.
- An invariants plate: Never changes / Varies per scene.
- SourceForm: 'Character source', 'Save source' / 'Saving…'. When locked, the identity fields render read-only.
- The identity-lock **Switch**, accessible name 'Lock the face and overall look across generations'.
- ReferenceAssetManager, restyled with the same props: `<section aria-label="Reference images">`, 'Use as primary image', 'Remove reference from this item', `{n}/14`.

**Darkroom** (right):
- ImageGenerationControls, with all 7 aria-labels kept.
- A StageTrack: Save → Expand → Queue → Render → Upload → Review.
- **'Generate character sheet'** (primary) / 'Generating character sheet…'.
- The amber hint verbatim.
- Inline `role="alert"` next to the CTA.
- 'Sheet history' as a ContactSheet whose new tiles resolve.

**Review-before-promote:** outputs land for review. "Use as primary reference" is an explicit act. Removing the automatic append to identity references (`convex/assets.ts` `completeGeneration`) is a **pipeline change that needs owner sign-off**. Until it is approved, auto-added sheets carry a `REF` Badge and a "Remove from references" action.

**Hero interaction:** HoloCard plus the lock switch, and review before promote.

### 7.4 Locations: "Scout wall"

- **PageHeader:** eyebrow `SETS`, h1 **'Locations that hold their atmosphere'**, actions 'Load SF starters' (shown as a pack Chip `SAN FRANCISCO · 10 LOCATIONS`) and 'New location'.
- **Kind filter:** a SegmentedControl with All, Landmark, Neighborhood, **Coastline** (label only; the literal stays `'coast'`), Interior, Other.
- **Grid:** a **uniform 4:3 contact grid**, `repeat(auto-fill,minmax(240px,1fr))`, gap 12. Each plate is a `bg-screen rounded-screen` image with the name, `@handle`, a kind `micro` Badge and a time-of-day Chip.
- **Selection and compare:** selecting two plates and pressing X opens a CompareSheet with the two plates side by side and synced brackets.
- **Detail:** a scout report (an establishing plate plus Approach, Detail and Atmosphere tiles), the fields, time-of-day preset keys (Morning fog, Golden hour, Blue hour, Night neon) that write free text to `defaultTimeOfDay`, and the same Darkroom ('Generate location sheet').

### 7.5 Clips: "Tape log"

- **PageHeader:** h1 "Clips", meta `{n} clips` with CountUp once. Note that the header count reflects the `limit:100` cap, so say "latest 100".
- Clips are grouped by session under sticky h2 headers `SESSION 3F2A91C0… · 14 CLIPS · 06:12`, with the full id in `title`.
- **Session reel:** one segment per clip, width proportional to `durationSeconds`, filled with a Bayer density by status. READY is 100% ramp-2, CAPTURING is 50% `tally-rec`, UPLOADING is 25% accent, FAILED is 25% danger. Hovering shows the prompt; clicking scrolls to the clip.
- **MediaCard grid:** `repeat(auto-fill,minmax(280px,1fr))`, gap 16. Each card has:
  - a 16:9 screen with a lazy poster (IntersectionObserver) and hover-scrub for fine pointers only;
  - native `<video controls>` in the viewer;
  - a duration `readout`, a status Badge (CAPTURING, UPLOADING, FAILED), `segment v{n}` or `chunk #{n}`, a 2-line prompt, and the session short id.
- The **first card keeps `.pixel-card-latest`** plus a NEW preview-green lamp.
- Cards render 24 at a time, with a "Show more" button.
- **Download** fetches a blob and saves it with the correct extension from `mimeType`.
- **Empty:** a NO FOOTAGE slate. The copy is fixed to drop the stale "LTX" reference; it names 'Record' and 'Stop & save recording' correctly.
- **Unauthenticated:** AuthRequired, not "No clips yet".
- **Not configured:** `<NotConfigured feature="clips">`.

### 7.6 Recordings: "Tape vault"

- Rows are `grid-cols-[320px_1fr]` from `md`, stacked below:
  - a poster screen with scrub;
  - an h2 title, falling back to "Director session · Sep 24, 21:04";
  - engraved plates in `inset` for Duration, Size, Format (`formatMime`) and Session;
  - **Download** (blob, correct extension);
  - **Delete**, which opens a ConfirmDialog with 'Delete this recording permanently?', a destructive "Delete permanently" button, and a pending state. Confirmation is always required.
- An optional lazy 8-frame filmstrip seek row (cut-able).
- The first row keeps `.pixel-card-latest`.
- **Empty:** a NO TAPE slate that keeps 'Use “Record” on the Director player, then “Stop & save recording”'.

### 7.7 Twitch Analytics: "Meter bridge"

**ON-AIR strip** (56 px Panel at the top):
- A TallyLight md:
  - **LIVE**: program, lit. This is public, so red is correct.
  - **OFFLINE**: standby.
  - **NOT PATCHED**: an amber LED and **never red**.
  - **ERROR**: danger outline, with the server `body.error` shown verbatim.
  - **STALE**: hatched grey, when data is older than 2×30 s.
- The channel avatar, name and title.
- Uptime in `timecode`.
- A FreshnessStamp (stale after 60000 ms).
- Refresh as a secondary Button with a pending state.

**Body:**
- KPI StatTiles: 'Current viewers', 'Followers', 'Uptime', 'Category'. They use `readout-lg`, monochrome icons (Eye, Heart, Clock, Gamepad2) and SVG trend lines. CountUp runs on first reveal only, never on polls.
- The **chart:** dither-kit `AreaChart`, `color:'blue'`, `bloom="aura"` with `bloomOnHover`. A memoised data signature means there is **no replay on the 30 s poll**. It is wrapped in `ChartFigure` (figure, title, a one-line summary, an sr-only table of ≤48 rows, and a focusable keyboard crosshair).
  - This chart is Analytics' **one effect slot**.
  - The title switch 'Viewers (last 24h, Convex)' / 'Viewers (this session)' is kept.
- **Stream rail** (320 px from `xl`): the live thumbnail `?t={capturedAt}`. When offline, it plays `<BrandVideo id="coast-standby-loop">` (poster under the lock or reduced motion).
- **Not configured:** a NOT PATCHED slate. 'Collecting samples…' appears only when the page is configured and has fewer than 2 samples.

### 7.8 Route-level and cross-cutting states

| File or state | Composition |
|---|---|
| `app/not-found.tsx` | Route Slate: kicker `CH 404`, art `slate/not-found` (the "404" on the CRT is composited as SVG, never generated), title "No signal on this channel", body "This page doesn't exist or has moved.", actions "Back to Live Control" (Link) and a ⌘K hint. The visual-test `notFound()` in production lands here. |
| `app/admin/error.tsx` (client) | Route Slate inside the surviving shell (the carrier and nav remain): kicker `SIGNAL LOST`, title "This view lost its signal", `error.message` in `code` text-2 (3 lines), the digest in `code`, actions **Retry** (`reset()`) and "Copy details" (JSON of message, digest, route and time). |
| `app/global-error.tsx` | Its own `<html><body>`, inline styles only, system font stack, `#05080F` background with an inline 25% Bayer SVG pattern, a title, and a Retry button calling `reset()`. No imports beyond React. |
| `app/admin/**/loading.tsx` | §5.1: skeleton, CoastLoader and delayed appearance. |
| Not configured | `NotConfigured` in route or panel size, with exact strings per audit: clips and recordings use the `feature` sentence; Characters and Locations use "Convex is not configured. Character library changes are disabled." and "Convex is not configured. Location library changes are disabled."; Shotboard uses the inline sentence; Director stays silent standalone. |
| Auth required | `useConvexAuthState()` resolved with `!isAuthenticated`: kicker `NO ACCESS`, title "Sign in through Cloudflare Access", body "Your Access session is missing or expired. Sign in, then reload.", action "Reload". Lists that return `[]` for an unauthenticated user show this state, not the empty state. |
| Offline | `navigator.onLine === false` shows an OfflineBanner (InlineBanner warning, kicker `NO CARRIER`, "Network offline") under the command bar, and the NET LED shows danger. |
| `/admin/visual-test` | Keeps `notFound()` in production, never mounts Convex hooks, and keeps `#audio-library-visual-test` and `.asset-studio`. It adds a `<section id="design-system-visual-test">` that renders every primitive in every state (lamps, GenerationFrame phases, slates, skeletons, buttons pending, success and error) with fixture data and no network. |

---

## 8. Final CSV component list (15 picks)

**Build policy:**
- Every pick is an **original implementation**. Nothing is installed from reactbits.dev (it returns 403 from the sandbox, and the CSV prompts say not to copy source).
- Each file starts with: `// Original implementation inspired by "<CSV name>" (<canonical_url>). No upstream source copied.`
- Arlan studies use generic names and no third-party names or art.
- **No new dependencies.** Installed packages used: `three` 0.169 (Dither only) and `motion` 13 (nav `layoutId` only). `gsap` 3.15 is not used by any new component.

| # | CSV name | cli_identifier | Our component (path) | Placement | Tuning | Deps |
|---|---|---|---|---|---|---|
| 1 | Dither | Dither | `components/reactbits/Dither.jsx` (hardened, **never reinstalled**) + `components/DitherBackground.tsx` | Global carrier | Renderer created **once** (`[]` deps); params through a ref; new props `renderScale=0.5`, `maxFps=30`, `paused`, `tweenMs` (1200 for state, 300 for theme), `onFirstFrame`; `antialias:false`, `powerPreference:'low-power'`; half-resolution backing with `image-rendering:pixelated` and shader `pixelSize = pixelSize×renderScale`; pause on hidden; reduced motion renders one frame and re-renders only on param change; **never call `forceContextLoss`**; on WebGL failure the host gets `.dither-fallback` (static 25% Bayer field in wave colour over bg) and still fires ready. DitherBackground reads `--dither-*` via `getComputedStyle` on theme or state change (one MutationObserver on `class` and `data-broadcast`, or the ThemeProvider plus the store) and renders `.dither-veil`. | three 0.169 (installed) |
| 2 | Pixel Swap | PixelSwap | `components/boot/*` (BootSequence, ChannelFlip) + SymbolRaster clear | Boot POST, repeat-visit flip, connect → first-frame clear | Canvas2D, 4 px cells, Bayer-8 order (not random), ramp colours, cap 1600 ms, flip 240 ms | none |
| 3 | Pixel Transition | PixelTransition | `components/effects/PxResolve.tsx` + `.px-resolve` | Route enter, skeleton → content, slate entrance, generation land, chyron enter, lamp lit | CSS mask, 4 steps × 40 ms, 8 px tile of 2 px cells; controlled by mount or `key`, never by hover; `<PxResolve as? trigger="mount"\|"key" onDone?>` | none |
| 4 | Arcade pixel | Arlan study | `components/effects/PixelFace.tsx` | md lamp faces, slate kickers, boot "CH 05" | Original 5×7 bitmap A–Z, 0–9 and `. - : / · # @ $ !`, rendered as SVG `<rect>` runs in `currentColor`, 2 px or 4 px cell, at most 3 words; `<PixelFace text cell={2\|4} srText>` (real text in sr-only) | none |
| 5 | Decrypted Text | DecryptedText | `components/effects/DecryptedText.tsx` | Active CONNECT_STEP label (once), GenerationFrame phase label on change | Glyphs `░▒▓█01/<>_`, 28 ms frames, ≤6 scrambles per character, 16 ms stagger, total ≤320 ms; the final text is in an sr-only span during the scramble and becomes the only visible text afterwards; never on telemetry or data; `<DecryptedText text trigger="mount"\|"change">` | none |
| 6 | Stepper | Stepper | `components/generation/StageTrack.tsx` | Connect (5), Darkroom (6), Send to Director (4) | Indicators only, with no Back or Continue; 8 px squares: done `success`, active `accent` (steady), pending `border-control`, failed `danger`; `role="list"` with `aria-current="step"` | none |
| 7 | Animated List | AnimatedList | `components/effects/StreamList.tsx` | Direction queue, chat, events, chyron stack | 120 ms resolve with no slide, 30 ms stagger (≤8), stick-to-edge only when already at the edge, no gradients, no arrow navigation | none |
| 8 | Pill Nav | PillNav | `components/shell/AppNav.tsx` (indicator concept only) | Command-bar nav | 2 px accent bar with a 50% Bayer mask, `layoutId` slide 200 ms `[.16,1,.3,1]`, active LED snaps in 60 ms, no pill blob, no initial animation, no logo slot | motion 13 (installed) |
| 9 | Figma vector editor | Arlan study | `components/effects/SelectionBrackets.tsx` | Monitor viewfinder, Shotboard selection, turnaround labels, Locations compare | CSS pseudo-elements, 1 px lines, 12 px arms; the selection variant adds 6 px corner squares in accent; tag `micro` on a bezel plate; monitor variant text-3 at .7, inset 12, tightens 4 px once on PVW (200 ms); `<SelectionBrackets inset tag? tight? variant="viewfinder"\|"selection">` | none |
| 10 | Symbols effect | Arlan study | `components/effects/SymbolRaster.tsx` | Idle monitor (standby) and connect acquisition | Canvas2D, 6 px cells, glyphs `· + × █` for 4 luminance bands in `#1D3160 #3357A8 #7AA5E0 #E8EEF9` on `#000` (screen material, invariant); source is `standby/coast-{aspect}-lum.png`; painted on resize, theme or `density` change only (no loop); the clear animation is 320 ms; slot-arbitrated; unmounts at first frame; `<SymbolRaster src density clearing onCleared/>` | none |
| 11 | Holo | Arlan study | `components/effects/HoloCard.tsx` | @coast (identity-locked characters) in the Characters bible | 3:4 portrait, CSS 3D tilt ≤6° on `(pointer:fine)` hover only, conic chrome foil × a static 8 px Bayer mask at `mix-blend-mode:color-dodge` .22, foil only when locked, static 35° under reduced motion, the air lock or keyboard focus; `<HoloCard image name handle locked refs sheetVersion clip?>` | none |
| 12 | Amo hover button | Arlan study | `components/effects/HoverClipButton.tsx` | "Play ident" on HoloCard | `<video muted playsInline preload="none" poster>`; on hover or focus, load and play; on leave or blur, pause and reset to `currentTime=0`; never delays the click; never plays under reduced motion or the lock | none |
| 13 | Apple's corners | Arlan study | Tokens (`.sq` + §2.5) | Panels, keys, inputs, chips, sheets, dialogs, slates | `corner-shape: squircle` under `@supports`, radii 6/10/16/22, never on screens, lamps or pills, never `clip-path` | none |
| 14 | Count Up | CountUp | `components/effects/CountUp.tsx` | Analytics KPIs (first reveal), Clips and Recordings totals, Shotboard runtime | 600 ms, stepped at 12 fps via the shared ticker, once per mount, final value in sr-only text, never on polls, **never on Live Control**, final value under the lock or reduced motion | none |
| 15 | Shiny Text | ShinyText | Glint inside `components/boot` (concept only) | The wordmark in the boot, **once per session** | 28° band, 18% width, `#ECF4FF` at .55, 340 ms `--ease-spec`, masked by the wordmark alpha; never on text, data, buttons or H1s | none |

**Retained vendored components** (`components/reactbits/`, editable, not hash-locked):

| Component | Treatment |
|---|---|
| **MorphSlider** | Live Control Audio dock and the fixture. Autoplay off. Render-on-demand patch (rAF only during tween, drag or texture load). IntersectionObserver. Slot. A live `useReducedMotion`. Labels untouched. |
| **AccordionGallery** | API untouched. Removed from the Characters and Locations heroes and from the Shotboard pickers (replaced by chips plus a popover grid). Remains in the fixture. |
| **ChromaGrid** | Removed from Shotboard (replaced by CastStrip). The file is kept for the fixture only. |
| **PixelCard** | Replaced by MediaCard on Clips and Recordings. The `.pixel-card-latest` hook moves to MediaCard, and the `--pixel-card-*` variables stay defined. |

**Banned. Do not install, port or imitate:**
- **Every other Background (56):** Acid Squares, Aero Shards, Aurora, Balatro, Ballpit, Beams, Color Bends, CRT Warp, Dark Veil, Dot Field, Dot Grid, Evil Eye, Faulty Terminal, Ferrofluid, Floating Lines, Galaxy, Ghost Fibers, Gradient Blinds, Gradient Waves, Grainient, Grid Distortion, Grid Motion, Grid Scan, Hyperspeed, Iridescence, Letter Glitch, Light Pillar, Light Rays, Light Tunnel, Lightfall, Lightning, Line Waves, Liquid Chrome, Liquid Ether, Molten Metal, Orb, Particles, Pixel Blast, Pixel Snow, Plasma, Plasma Wave, Prism, Prismatic Burst, Radar, Ripple Grid, Scanner, Shape Grid, Shape Waves, Side Rays, Silk, Sliced Waves, Soft Aurora, Threads, Topography, Waves, Web Threads. Reason: a second field competing with the carrier, and GPU cost during WebRTC decode.
- **All cursor effects:** Blob Cursor, Click Spark, Crosshair, Cursor Grid, Elastic Mesh, Ghost Cursor, Glow Cursor, Image Trail, Magnet, Magnet Lines, Pixel Trail, Ribbons, Splash Cursor, Swarm Cursor, Target Cursor, Text Cursor.
- **3D, R3F, physics and WebGL components:** Antigravity, Cubes, Meta Balls, Orbit Images, Ripple Distortion, Lanyard, Fluid Glass, Model Viewer, Dome Gallery, Circular Gallery, Flying Posters, Infinite Spiral, Infinite Menu, Depth Carousel, Drift Wall, Carousel, Stack, Card Swap, Bounce Cards, Specular Button, Metallic Paint, ASCII Text, Warp Text.
- **Blur, glass and glow:** Glass Surface, Glass Icons, Gradual Blur, Shape Blur, Dia Browser's gradient, Chromatic glow, Border Glow, Star Border, Electric Border, Laser Flow, Magic Rings, Strands.
- **Hover theatrics on data:** Magic Bento, Spotlight Card, Tilted Card, Glare Hover, Decay Card, Profile Card, Reflective Card (also triggers a webcam prompt), Sticker Peel, Folder, Scroll Stack, Scroll Expand.
- **Flicker or pointer text, and more than one text effect:** Glitch Text, Fuzzy Text, Scrambled Text, Shuffle, Text Pressure, Variable Proximity, True Focus, Echo Text, Falling Text, Fold Text, Depth Text, Particle Text, Stroke Text, Gradient Text, Masked Heading, Blur Text, Split Text, Scroll Float, Scroll Reveal, Text Type, The typer, Kinetic typography, Ransom note, Split Flap Text, Counter.
- **Moving hit targets and marquees:** Dock, Gooey Nav, Staggered Menu, Bubble Menu, Card Nav, Flowing Menu, Line Sidebar, Option Wheel, Curved Input, Logo Loop, Scroll Velocity, Curved Loop, Text Loop, Rotating Text, Circular Text.
- **Replaced by PxResolve or out of scope:** Fade Content, Animated Content, Fade motion, Ghosty reveal, Halftone Reveal, Noise, Midjourney Medical's ASCII, Liquid UI, Pixel brushes, The art of color depth, Realistic emboss (the key-shadow token covers it), Masonry, Elastic Slider (loses native range semantics).
- **Never:** reinstall Dither from the registry, add `@react-three/*`, `ogl`, `postprocessing`, `mathjs`, `cmdk` or `matter-js`, or edit `components/dither-kit/*`.

---

## 9. Brand assets on fal

**Protocol:**
- `dashboard/scripts/brand/` provides `generate.mts` with the commands `plan | run --tier draft|final | approve | build | check`, plus `assets.mts`, `prompts.mts`, `quantize.mts`, `placeholders.mts` and `approved.json` (committed). `.cache/` is gitignored. Add `"exclude": ["node_modules","scripts"]` to tsconfig.
- It is **run by a human** with `FAL_KEY` from `.env.local`, calling `createFalClient({ credentials })` directly. It never goes through `/api/fal/*`, never runs in CI (without `--allow-ci`), and never runs in the app. The budget defaults to $40, with `--yes` required above $10.
- **Stills:** `openai/gpt-image-2.5/sunburst/edit`. Fallback `openai/gpt-image-2/edit`. `text-to-image` is used only for non-Coast art.
- **Motion:** `minimax/h3-max/image-to-video` with `end_image_url = start`. Fallback `minimax/h3/image-to-video`.
- Everything is **unverified until a `quality:'low'` draft succeeds**. On a 422, drop only `background`, `output_compression` and qualities `xhigh`/`max`. Transparency falls back to a `#FF00FF` key (±8), keyed with sharp.
- **Image 1 is always the approved `coast-brand-sheet-v1`.** Image 2 is the wordmark PNG, and only for chrome material: "use only as a material/colour reference; draw no letters."
- **Likeness gate (blocking):** Coast is likely a real performer (Twitch 510coast). Use only references Coast has approved, supplied via `COAST_REF_URLS` or `scripts/brand/.cache/refs/*.png`, and never previously generated sheets. Raw references and the master sheet never enter `public/` or git. Only stylised outputs ship. Every published file is recorded in `approved.json` (endpoint, prompt, input with refs replaced by `coast-brand-sheet`, request_id, sha256). Coast signs off on the finals.
- **Without FAL_KEY**, the implementer ships the script and prompts, plus procedural placeholders at final dimensions from `placeholders.mts`. These are ramp-coloured Bayer compositions with a **non-human** pixel camera or antenna glyph, listed in the manifest with `generated:false`. The UI never shows a fake likeness.

**Style tiers** (writers expand the prompts):

| Tier | STYLE block core | Post-process (`quantize.mts`) |
|---|---|---|
| **PX** (pixel instrument) | "Game Boy Camera–style 4-level ordered-dither pixel illustration, 4×4 Bayer; strict palette #05080F #1D3160 #3357A8 #7AA5E0, glints #E8EEF9 only; tones mapped by luminance (no selective recolouring); 1px #05080F outline; hard pixel edges, no anti-aliasing, gradients, grain or bokeh; #FF3B30 only on tally-lamp props; no text, no logos; exactly one Coast." | Nearest-neighbour downscale to the art master, then an exact **Bayer 4×4 ordered quantise** to the dark ramp plus glint (plus #FF3B30 where present) |
| **CHROME** (flagship key art) | "Cinematic key art for a late-night broadcast station: deep navy ink shadows #05080F/#0B1120, one cool ice-blue rim light #7AA5E0, gunmetal chrome props with an electric-blue edge #4F83CC like a chrome blackletter logo (Image 2, material only). **Skin tones natural and true to Image 1, never tinted blue.** Backgrounds and shadow falloff resolve into coarse 4-level ordered Bayer dither in navy and chrome blue. Low-key light, no text, logos, lens flares, bokeh or watermarks; exactly one Coast." | Bayer 4×4 ordered dither with an **adaptive 32-colour** palette at 2 px cells, which preserves skin |

**Canonical asset list.** Generated files go under `public/brand/**`. `build` writes `public/brand/manifest.json` and `lib/brandAssets.ts`.

| ID | Tier / endpoint | Generate at | Ship (file · budget) | Used in |
|---|---|---|---|---|
| `coast-brand-sheet-v1` | anchor / sunburst/edit (refs ≤4) | 2048×1152 | **Not shipped** (`.cache/refs/`, hash only) | Image 1 of every Coast call |
| `loader/coast-boot` | PX / sunburst/edit, transparent | 2048×1024 (4×2 grid; taps a chrome remote; spark becomes a diamond; frame 8 = frame 1) | `loader/coast-boot-strip@1x.png` 512×64 ≤25 KB · `@2x.png` 1024×128 ≤60 KB · `coast-boot-still@2x.png` 128×128 · `coast-boot.json` {frames:8, fps:10} | CoastLoader, boot POST sprite |
| `avatar/coast-px` | PX / sunburst/edit | 1024×1024 | `avatar/coast-px-16.png`, `-32.png` (palette masters), `-48.webp`, `-96.webp` ≤8 KB | Roster fallback, CastStrip, icon source |
| `standby/coast-16x9`, `-9x16`, `-1x1` | CHROME / sunburst/edit (+ wordmark) | 1920×1088, 1088×1920, 1088×1088 (Coast at a chrome desk in the left third; right two-thirds dark) | `standby/coast-{aspect}-{1280,640}.{avif,webp}` ≤120 KB / ≤45 KB · `standby/coast-{aspect}-lum.png` (160×90, 90×160, 90×90 greyscale, ≤8 KB) | SymbolRaster source, idle-slot fallback image |
| `talent/coast-portrait` | CHROME / sunburst/edit | 1536×2048 (3:4, waist-up, three-quarter, rim-lit) | `talent/coast-portrait-{768,384}.{avif,webp}` ≤90 KB / ≤35 KB | HoloCard, OG crop source |
| `motion/coast-talent-nod` | H3 Max i2v, start = end = the portrait crop | 5 s, trimmed to 2.0 s | `motion/coast-talent-nod.webm` 480×640 ≤400 KB · `.mp4` ≤600 KB · poster = portrait 384 | HoverClipButton (cut first) |
| `motion/coast-standby-loop` | H3 Max i2v, start = end = standby 16:9 (locked-off; breathes, blinks once, nudges a fader and returns it) | 5 s | `motion/coast-standby-loop-1280.webm` ≤1.2 MB · `.mp4` ≤2 MB · `-640.webm` ≤400 KB · poster | Analytics offline stream slot |
| `slate/{live-control, shotboard, characters, locations, clips, recordings, analytics, not-found, not-patched, no-access, signal-lost}` (11) | PX / sunburst/edit, transparent | 1536×1024 → art master 192×128 | `slate/<id>.webp` 384×256 (2× nearest) ≤40 KB + `.png` | Slate family (§5.9). Subjects: camera with an unlit tally; blank storyboard frames; empty casting silhouettes; pop-up map; blank film strip; VHS stack; spyglass with an empty bar; tangled coax with a blank CRT (digits added as SVG); two unplugged cable ends; lanyard pass; CRT full of static |
| `share/og` | CHROME / sunburst/edit (+ wordmark), **text-free** | 2400×1264 (Coast in the right third; left 55% calm) | `app/opengraph-image.jpg` + `app/twitter-image.jpg` 1200×630 ≤180 KB, composited with sharp using the **real** wordmark (560 w) and the SVG mono line `STREAM.WZRD.TECH`, plus `opengraph-image.alt.txt` | Metadata |
| `icons/*` | **Derived, not generated**, from `avatar/coast-px` 16/32 masters | — | `public/favicon.ico` (16/32/48, **replaced in place**; never add `app/favicon.ico`) · `app/icon.svg` (32×32 rects) · `app/apple-icon.png` 180 (opaque #05080F, 12% padding) · `public/brand/icons/icon-{192,512}.png`, `icon-maskable-512.png` ≤25 KB · `public/brand/icons/favicon-onair.svg` (icon + a 4×4 #FF3B30 LED composited top-right) · `app/manifest.ts` (name 'stream.wzrd.tech admin', short_name 'WZRD', theme and background colour #05080F) | Tab icon, PWA manifest, ON AIR swap |
| `wordmark/*` | **Derived, not generated**, from `public/wzrdtechlogo.png` (kept on disk, no longer referenced) | — | `wordmark/wzrdtech-160.{avif,webp}` 160×40 ≤8 KB · `-320` ≤15 KB · `-640` ≤40 KB · `components/boot/masks.ts` (1-bit 120×30 and 80×20, base64) | CommandBar bug, boot, OG composite |

**Totals** (`brand:check` fails otherwise): images in `public/brand` ≤2.5 MB, video ≤6 MB. Only the wordmark 160/320 and the loader strip may load before LCP.

**Never generated:** exact letterforms (the wordmark, "WZRD", the 404 digits) and the carrier fallback, which is CSS.

---

## 10. Non-negotiables

Every section of `goal.md` restates the relevant items here.

### 10.1 Performance budgets

1. **WebGL:** exactly **one** persistent context (the carrier) on every route, and at most **one effect canvas per view**, arbitrated by `useEffectCanvasSlot`.
   - An "effect canvas" is any WebGL context, or any canvas that loops rAF or covers more than 25% of the viewport.
   - dither-kit texture canvases (DitherButton, DitherGradient, DitherAvatar) are exempt.
   - The Analytics chart **is** its slot.
   - Test: toggle the theme 10 times, then confirm there is still exactly one context and no console output.
2. **Carrier:** 30 fps or less, half-resolution backing, `antialias:false`, paused when hidden, and zero rAF after the first frame under reduced motion.
3. **Backdrop:** no `backdrop-filter` anywhere.
4. **Animated properties:** only `transform`, `opacity`, stepped `mask-image` and `clip-path`. No animated `filter` or layout properties.
5. **Boot:** removed within 1600 ms of navigation start. Script plus masks ≤4 KB gzipped. CLS 0. Zero console output.
6. **Live Control at 4× CPU throttle:** no UI-caused long task over 50 ms per 10 s window while live. The DirectorPlayer root does not commit on the 1 Hz tick; only the leaf readouts do (React Profiler).
7. **Library media:** at most 24 cards initially, `preload="none"`, IntersectionObserver posters. No PixelCard canvases.
8. **Fonts:** only the 4 Focal woff2 files and the JBM variable font.
9. **Dependencies:** no new runtime dependencies. Effect components are code-split with `next/dynamic` and `ssr:false`: Boot client, SymbolRaster, HoloCard, HoverClip, CommandPalette, MorphSlider.
10. **LCP:** unconfigured `/admin` on a local production build, desktop, ≤1.8 s.
11. **Asset budgets:** as in §9.

### 10.2 Accessibility (WCAG 2.2 AA)

- **Contrast:** text ≥4.5:1 (≥3:1 at 24 px or more, or 18.66 px bold). Non-text ≥3:1. Measured over **#5555AA** through the veil and surface (§2.4), and automated in `tests/contrast.spec.ts`.
- **Focus:**
  - A 2 px `--c-focus` outline with a 2 px offset on every interactive element, never removed.
  - `scroll-padding` keeps focus clear of the sticky bars.
  - Controls never sit directly on the veil.
- **Targets:** ≥24×24 CSS px (2.5.8), and 44 px on coarse pointers.
- **Keyboard:**
  - No global single-character shortcuts (2.1.4). Every drag has a button alternative (2.5.7). Every hold has a click-to-confirm alternative.
  - The palette and ShortcutSheet list every shortcut.
- **Motion:**
  - `prefers-reduced-motion` is honoured everywhere (§5.10), as are `prefers-reduced-transparency` and `prefers-contrast: more`.
  - At most one blinking element, for 5 s or less (2.2.2). No flashing more than 3 times per second (2.3.1).
- **Semantics:**
  - Skip link. Landmarks: banner = CommandBar, the nav 'Admin sections', `main#content`, contentinfo = StatusRail.
  - Exactly one h1 per route.
  - Lamps and LEDs always have text. Colour is never the only signal.
  - Text effects keep the final text in the DOM. Effect layers are `aria-hidden`.
- **Live regions:** one polite and one assertive announcer. Notices use `role="status"` and errors `role="alert"`, and the existing ones keep their roles even when they move into chyrons.
- **Casing:** no `text-transform` is added to or removed from a preserved string (§3.5).

### 10.3 Invariant categories

Every section must cite the audits' lists verbatim.

1. **Routes and nav:** `/` → `/admin`; the 7 exact labels, hrefs and icons; the active rule; `aria-label="Admin sections"`; `/admin/visual-test` keeps `notFound()` in production, `#audio-library-visual-test`, `.asset-studio`, and no Convex or fal calls.
2. **Theme:** localStorage `theme` holds exactly `'dark'|'light'` (System removes it); the `.dark` class and `colorScheme`; the pre-paint `themeInit` in `<head>`; `suppressHydrationWarning`; `darkMode:'class'`.
3. **Carrier:** DitherBackground is first in body, `fixed inset-0 -z-10 pointer-events-none aria-hidden`, dynamic with `ssr:false`, with its WebGL-failure bail-out, the exact wave and bg triplets, and speed, frequency, amplitude, colorNum and pixelSize. It is retuned only through tokens.
4. **admin-testing flow:**
   - A button named exactly **'Start Director'**, visible when idle and restored after a failure.
   - A visible error on failure (with `role="alert"`).
   - An editable premise textarea prefilled with DEFAULT_PROMPT, which is what `configure` sends.
   - 'Record' only while live.
   - Clean console on every page (only the React DevTools info message): no probes on load, no `forceContextLoss`, no hydration, key or 404 warnings.
   - No preserved control is duplicated by role and name, and no hint repeats a preserved label.
5. **Preserved strings, aria-labels, ids, classes and titles:** all audit lists (shell, live, shotboard, assets, data, states, fal), including CONNECT_STEPS in order, 'Director (realtime WebRTC)', `minimax/h3-max/director` visible, `data-state={raw}`, `.pixel-card-latest`, and the `.fal-*` shims until their call sites migrate.
6. **Director media pipeline:**
   - Exactly one mounted `<video ref autoPlay playsInline muted>` across all states.
   - One stable output MediaStream feeding preview, the recorders and WHIP.
   - The disconnect teardown order.
   - `primeMusic` called synchronously in the click handler.
   - DirectorPlayer never unmounts mid-session; tabs hide and do not unmount.
   - Wire-protocol rules (client beat ids stripped, one-shot end frame and audio).
   - Chat sanitisation and throttles.
   - Clip-rotation paths.
7. **Convex:**
   - `useConvexEnabled` gating before any hook.
   - Every query and mutation name and argument unchanged.
   - `api.clips.list {limit:100}`, `api.recordings.list {limit:100}`, the `remove` confirmation.
   - Shotboard patch allowlists, flush and `trackWrite` semantics, transfer order (≤2 concurrent expansions).
   - The studio generation order: persist → validate → expand → fingerprint → startGeneration → generateImages → upload → complete/fail.
   - Identity-lock rules, enum literals (`'coast'`), `MAX_ASSET_REFERENCES` 14.
8. **fal:**
   - Browser traffic only through `/api/fal/sdk-proxy` and `/api/fal/proxy`.
   - Adding `onQueueUpdate` and `logs` is allowed; changing endpoints or inputs is not.
   - No paid call on mount or in CI.
   - The model ids `nano-banana`, `gpt-flare` and `gpt-sunburst` are unchanged.
   - `FAL_KEY` is never committed, logged or exposed through `NEXT_PUBLIC`.
9. **dither-kit:** `components/dither-kit/*` is hash-locked. Wrap and import; never edit.
10. **Storage and URLs:** `wzrd_twitch_auth`, `wzrd_twitch_oauth_state`, `theme`, and the new `wzrd:boot`, `wzrd:density` and `wzrd:dock`; `?board=`, `?transfer=`, `?code&state`; the Twitch OAuth `redirect_uri` and scope; the WHIP endpoint.
11. **Middleware and platform:** the exact 401 strings and matcher; API routes untouched; edge-compatible (next-on-pages), with no Node-only APIs in the layout or middleware.
12. **Brand pipeline:** offline and human-run; placeholders when no key; the likeness and consent gate; letterforms never generated.

### 10.4 Verification gates

Every section's acceptance criteria include these:

- `node -e` resolution of the Tailwind config prints `fal-primary-500 = #4F83CC`.
- Compiling `globals.css` shows no un-layered rule between utilities and variants.
- `grep -rE` over `app components` (excluding `components/dither-kit` and `components/reactbits/*.css`) returns **0** for each of these:
  - `violet-|purple-|#a78bfa|#7c3aed|#8b5cf6|#6d28d9|#05030b|#090713`
  - `fal-primary-(50|100|200|300)|fal-purple`
  - `font-(semibold|extrabold|black|thin|extralight)`
  - `backdrop-(blur|filter)`
  - `Loader2|animate-spin|animate-pulse`
  - `\!p[xy]-`
  - `hover:[^ ]+ dark:(text|border|bg)-`
  - `uppercase` outside the allowlist
  - In the final phase: `\bfal-(gray|primary|green|yellow|blue|red)-`, after which the deprecated aliases are deleted.
- `tests/contrast.spec.ts` passes in both themes.
- The admin-testing flow is re-run unconfigured with per-page console capture.
- Playwright screenshots of every route in dark, light and 390 px mobile are compared against `docs/redesign/baseline/`.
- Reduced-motion emulation shows every loop stopped. Reduced-transparency emulation shows opaque surfaces.
- The canvas and slot audit (`window.__wzrd.slots`, and counting WebGL contexts) passes on every route.

### 10.5 Binding sequence

Each step ships separately and is screenshot-diffed:

0. Remove dead code (TestControlPanel, WebRTCPlayer, RealtimeChart, PerformanceMetrics, QueueVisualization, AIPerformanceBreakdown, GenerationHistory, `hooks/useRealtime*`, and `recharts`) **with owner sign-off**, then run prettier over the mega-lines.
1. Tokens, the Tailwind mapping, the collision fix and the cascade fix.
2. Typography, including the codemods.
3. Carrier hardening, ThemeProvider and the veil.
4. Shell: CommandBar, AppNav, StatusRail, palette, route state files and the boot.
5. Primitives, states, generation and effects, plus the visual-test design-system section.
6. DirectorPlayer extraction with no visual change, then the Live Control layout, the broadcast store and the air lock.
7. Shotboard, then the studio (Characters and Locations), then the library (Clips and Recordings), then Analytics.
8. The brand script and placeholders. A human then runs generation and approves the results.
9. The full verification suite from §10.4.