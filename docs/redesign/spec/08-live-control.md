> **Spec chapter §8 — Page: Live Control.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 8. Page: Live Control (`/admin`)

Live Control is the instrument the operator runs the show from. This section turns the 1342-line `DirectorPlayer` card stack into a three-zone, zero-scroll console: **Session sheet** (left), **Program** (centre: label strip, monitor, transport, telemetry), **Rundown** (right) and **Dock** (under Program). It first extracts DirectorPlayer with no behaviour change, then restyles it, then adds truthful ON AIR and the air lock. All `path:line` references are **as of 845147c** (verified: `git diff --stat 845147c HEAD -- dashboard` is empty). Paths are repo-relative. Short references such as `DirectorPlayer.tsx:1082` point into `dashboard/components/`, a bare `:1082` means `dashboard/components/DirectorPlayer.tsx`, and every shell command follows the working-directory rule stated once in the §8.10 intro.

### 8.1 Goal & hero interaction

**Goal.**
- **Zero page scroll** from 1024 px wide: `document.scrollingElement.scrollHeight <= innerHeight` at 1024×768, 1280×800, 1440×900 and 1920×1080. Every control is reachable without the monitor leaving the viewport.
- **Truthful tally.** STBY/PVW, REC and ON AIR are driven by real signals: the first decoded frame, MediaRecorder state, and WHIP `connectionState` plus growing `bytesSent`. Red appears only when the output is public (§6.7, §7.4 TallyBar).
- **Keyboard-first directing.** ⌘↵/Ctrl+Enter starts the Director or sends a direction. ↑/↓ recalls the last 20 directions. Esc cancels a connect (the §7.12 global handler runs `director.cancel`, §8.5.12).
- **Contract-safe.** The session engine (connect, disconnect, `handleData`, recorders, clip rotation, the audio mixer, frame tools) moves **verbatim** into a hook. It is never rewritten. Every preserved string, aria-label, title, key, URL parameter and pipeline rule in §8.9 survives byte-for-byte, apart from the listed allowed changes (§8.9.6).

**Hero interaction: "type, ⌘↵, watch it land".**
1. The operator lands on `/admin`. The composer (Rundown › Direction) holds DEFAULT_PROMPT under the label 'Opening prompt (the series premise)'. The monitor's standby slate mirrors the premise as the operator types.
2. ⌘↵ in the composer runs the same `connect()` as 'Start Director'. The monitor acquires signal: the CONNECT_STEPS StageTrack advances and the SymbolRaster densifies (§6.5). At the **first decoded frame** the raster clears in 320 ms, the PVW lamp lights and the viewfinder brackets tighten by 4 px.
3. The composer label becomes 'Next direction' and the composer is empty. The operator types a direction and presses ⌘↵. A queue row `v2 sent — …` resolves in under the composer (120 ms, hollow LED). It turns to a warning LED on `prompt_pending` and a success LED on `prompt_applied`, and 'Applied: …' updates. The monitor never leaves the viewport, focus never leaves the composer, and nothing reflows.

**Budget.** The row is in the DOM in the same React commit as the `session.send`. The resolve takes 120 ms. CLS is 0.

### 8.2 Files

`dashboard/components/director/` is new. Appendix B holds the global file map; this table is the Live Control slice of it.

**Create**

| Path | Purpose | PR |
|---|---|---|
| `dashboard/components/director/constants.ts` | `DIRECTOR_MODEL`, `DEFAULT_PROMPT`, `CONNECT_STEPS`, `DirectionStatus`, `RoutedDirection`, `pickRecorderMimeType`. Moved verbatim from `DirectorPlayer.tsx:27-74`. `formatBytes` (`:76-79`) is not moved: M2 already replaced it with `bytes(n)` from `lib/format.ts` (§5.20.4) | 8A |
| `dashboard/components/director/useDirectorSession.ts` | The session engine: every ref, state, callback and effect from `DirectorPlayer.tsx:86-1046` (§8.5.2) | 8A |
| `dashboard/components/director/eventLog.ts` | Two leveled ring buffers (500 non-debug entries, 100 debug entries) read with `useSyncExternalStore` (§8.5.6) | 8A |
| `dashboard/components/director/firstFrame.ts` | `armFirstFrame(video, onFirst)`: the `requestVideoFrameCallback` gate (§8.5.6) | 8A |
| `dashboard/components/director/diagnostic.ts` | Pure `formatDiagnostic(d)`: the ConnectPlate diagnostic line, with its detail-key allowlist and address masking (§8.5.6) | 8B |
| `dashboard/components/director/useTwitchBroadcast.ts` | TwitchBroadcast state and actions moved verbatim from `TwitchBroadcast.tsx:42-162`. 8C adds the `whip` state, the `air` publishes, `onNegotiationFailed` and the `twitch.stop` command (§8.5.6) | 8A, 8C |
| `dashboard/components/director/MonitorLabelStrip.tsx` | 28 px strip: h2, model id, state word, Rundown toggle | 8A (legacy markup), 8B |
| `dashboard/components/director/DirectorStage.tsx` | Monitor: bezel, TallyBar, screen well, the single `<video>`, raster, plates and slates, brackets, lip tag | 8A, 8B |
| `dashboard/components/director/TransportBar.tsx` | 56 px transport (§8.4.5, §8.5.7) | 8A, 8B, 8C |
| `dashboard/components/director/TelemetryStrip.tsx` | 32 px readouts. Every ticking value is a leaf that uses `useSecondClock` | 8A, 8B |
| `dashboard/components/director/AlertTray.tsx` | The `role="alert"` error region under the telemetry strip | 8A, 8B |
| `dashboard/components/director/SessionSheet.tsx` | TalentCard, PreflightList, SessionSettings (`<details>`), LockedSettings, PremiseBlock, and the slot for the Twitch panel | 8A, 8B |
| `dashboard/components/director/preflight.ts` | Pure `preflightRows(input) → Row[]` with no I/O (§8.5.8) | 8B |
| `dashboard/components/director/Rundown.tsx` | Tabs: DirectionComposer, DirectionQueue, the ChatSteerer host and EventConsole | 8A, 8B |
| `dashboard/components/director/Dock.tsx` | Tabs: Script (ScriptEditor) and Audio (TrackManager). Collapse control | 8A, 8B |
| `dashboard/components/director/LiveControlVisualFixture.tsx` | Every Live Control state from fixture props, with no Convex, network or session (§8.5.13) | 8B |
| `dashboard/app/styles/live-control.css` | `.lc-*` grid and monitor rules, `@layer components` only (§8.4.1). Add its line to `app/globals.css` at its §5.1 position | 8B |
| `dashboard/components/states/skeletons/LiveSkeleton.tsx` | The layout-exact skeleton (§8.6.1). It swaps into `dashboard/app/admin/(live)/loading.tsx` in 8B, replacing the 4D RouteSkeleton (§6.3) | 8B |
| `dashboard/lib/broadcast/useWhipTruth.ts` | `useWhipTruth` and the pure `nextAir` reducer. §8.5.6 owns the algorithm; §7.2 lists the hook | 8C |
| `dashboard/tests/whip-truth.spec.ts` | `nextAir` cases (§8.5.6, C3) | 8C |
| `dashboard/tests/unit/diagnostic.spec.ts` | `formatDiagnostic` cases (§8.5.6, B32) | 8B |

**Change**

| Path | Change | PR |
|---|---|---|
| `dashboard/components/DirectorPlayer.tsx` | Becomes the composition root (≤ 320 lines): it calls `useDirectorSession` and `useTwitchBroadcast`, registers palette commands, and renders the grid. It keeps `export default function DirectorPlayer({ persistence })`. It re-exports `DIRECTOR_MODEL` with `export { DIRECTOR_MODEL } from './director/constants'`. 8C adds the leave handler registration and the Stop confirm (DEC-8-14, §0.4 BC-11) | 8A, 8B, 8C |
| `dashboard/app/admin/(live)/page.tsx` (moved from `app/admin/page.tsx` in 4D) | Change (8B): replace the `space-y-8` wrapper with a fragment; the sr-only `<h1>` landed in 4B. It stays `'use client'` and exports no metadata | 8B |
| `dashboard/components/DirectorSettingsForm.tsx` | Restyle only. Keep the props and every string. Add `id`/`htmlFor` pairs (§8.8). The 2-column rail layout | 8B |
| `dashboard/components/ScriptEditor.tsx` | Becomes the Dock › Script timeline. Keep the props contract (`beats`, `onChange`, `sendOnConnect`, `onSendOnConnectChange`, `onSendLive`, `live`, `playbackSeconds`, `onTemplateApplied`). Export a pure `ScriptTimeline`. Add stable client ids (§8.5.10) | 8B |
| `dashboard/components/ScriptTemplatePicker.tsx` | 8B: separate loading from empty (`boards === undefined` vs `boards.length === 0`) and restyle. 8C: both Links (`:101`, `:128`) get `onNavigate={guard(href)}` with `guard = useLeaveGuard()` from `lib/leaveGuard.ts` (§7.2). No change to query or apply logic | 8B, 8C |
| `dashboard/components/ChatSteerer.tsx` | Becomes the Chat desk. Add optional controlled `steer`/`onSteerChange` props, a per-line `outcome` and a `pendingLabel`. The logic and the direction throttle are unchanged; the only behaviour change is the `!frame`/`!snap` throttle (DEC-8-13, §0.4 BC-13, §8.5.9) | 8B |
| `dashboard/components/TrackManager.tsx` | Becomes the Dock › Audio deck. Export a pure `TrackDeck` (§8.5.10). MorphSlider is imported through `next/dynamic` from 5C (§14.3 R5). D3 keeps autoplay: TrackManager passes `autoplay={autoplayOn}` and `autoplayDelay={6}`, and `autoplayOn` is false under the five pause conditions of §8.5.10. The carousel becomes display-only (DEC-8-04, §0.4 BC-15): `onIndexChange={setShownIndex}` replaces `onIndexChange={selectSliderTrack}` (`:142`, `:91`), and a track is armed only through the radiogroup or 'Arm this track'. The track list becomes a `role="radiogroup"` whose first radio is 'No track' (DEC-8-10, §0.4 BC-14). The artwork becomes a 164×164 square beside the list, and 'Expand artwork' opens it in a Sheet at up to 480×480; one MorphSlider instance at a time, slot-gated. Violet and the `:144` `backdrop-blur` are already gone in 1B (§5.10, §5.19 codemod 4), and the `:144` authored uppercase lands in M2 (§5.20.5) | 8B |
| `dashboard/components/TwitchBroadcast.tsx` | A presentational panel that consumes `useTwitchBroadcast`. It also exports `GoLiveControl` for the transport. Adds HoldButton and ConfirmDialog | 8A, 8B, 8C |
| `dashboard/components/AssetUrlInput.tsx` | Restyle. `Loader2` becomes `BayerSpinner`. Add an optional `id?: string`, passed to the text input for `<label htmlFor>`, and put `role="alert"` on the upload error. **Shared with Shotboard** (`shotboard/ShotCard.tsx`, `CharacterPanel.tsx`, `SceneSidebar.tsx`): the API change is additive only | 8B |
| `dashboard/components/reactbits/MorphSlider.tsx` | §12.4.1 owns every edit: render-on-demand, a live `useReducedMotion`, IntersectionObserver, and the silent `WEBGL_lose_context` release after `renderer.dispose()` (never `forceContextLoss`). §12.4.1 also owns the component side of the autoplay pause. Live Control depends on the release, because the MorphSlider mounts and unmounts with its effect slot and moves between the Dock and the 'Expand artwork' Sheet (§8.5.10), and leaked contexts would otherwise reach "Too many active WebGL contexts". §8 makes no edit of its own | 5C (§12.4.1) |
| `dashboard/app/admin/visual-test/page.tsx` | §10.5.9 owns the final file. 8B adds only its `LiveControlVisualFixture` import line and the `<LiveControlVisualFixture />` element | 8B |
| `dashboard/lib/fixtures/designSystem.ts` | §10.5.9 owns the file. 8B replaces the five literal CONNECT_STEPS strings of `FX_DECRYPT_LABELS` with the import from `components/director/constants.ts` | 8B |
| `dashboard/tests/live-extraction.spec.ts` | Delete it (created in 1A, §15; its job ends with 8A) | 8B |
| `.agents/skills/admin-testing/SKILL.md` | Replace the Live Control sentence (§8.9.5) in the same PR as the layout change | 8B |

**Never touch:** every path in the §1.4 never-touch list; its regex is the check. Also leave `dashboard/components/ReferenceAssetManager.tsx` unchanged (it is not used on this page). A5 repeats the Live Control subset in every Live Control PR.

> Note: `dashboard/lib/twitchWhip.ts:6-9,77-80` already returns `{ pc: RTCPeerConnection; stop }`. That is everything `useWhipTruth` needs, so the ingest code stays untouched.

### 8.3 Before

**Screenshots** (`docs/redesign/baseline/`): `admin-dark.jpg` and `admin-light.jpg` (viewport 1440×900, full page 1440×1791), and `admin-mobile.jpg` (viewport 390×844, full page 390×1561).

| # | Defect | Evidence |
|---|---|---|
| B1 | The page scrolls 891 px at 1440×900. 'Start Director' sits at y≈1153, below the fold. Program, controls, Script and Chat are one vertical stack | `admin-dark.jpg`; `dashboard/components/DirectorPlayer.tsx:1082` (full-width `aspect-video`); `dashboard/app/layout.tsx:63` (`max-w-7xl … py-8`) |
| B2 | The stage ignores the aspect ratio. It is always 16:9, while the form offers 9:16 and 1:1 | `DirectorPlayer.tsx:1082`; `DirectorSettingsForm.tsx:59-61` |
| B3 | Inverted tally. A red pulsing "Live" means WebRTC-to-fal is up. The header pill is green 'live'. Public Twitch output is a small green sentence | `DirectorPlayer.tsx:1145-1149`, `:1060-1061`; `TwitchBroadcast.tsx:212-216` |
| B4 | No ingest truth. `pc` is exposed but never observed, so a dropped ingest keeps saying "● pushing to Twitch ingest" | `dashboard/lib/twitchWhip.ts:77-80`; `TwitchBroadcast.tsx:137-160` |
| B5 | The connect overlay ends at transport 'live', before the first decoded frame. A 'closed' state can re-show the overlay with 'Cancel' | `DirectorPlayer.tsx:1085-1113`, `:1087` |
| B6 | The whole tree re-renders at 1 Hz or more while live: the ping interval sets `elapsedSeconds`, every `pong` sets `pingMs` and logs, and every REC chunk sets `recordedBytes`. The log is capped at 50 lines of mostly `pong` | `:1019-1032`, `:539-546`, `:371-375`, `:174` |
| B7 | Locked settings are hidden, not shown, while live or busy. `disabled={live \|\| busy}` is dead code | `:1194`, `:1203` |
| B8 | The premise and the next direction share one textarea and are never cleared, so 'Send direction' can re-send stale premise text. There is no ⌘↵, no history, and the `<label>` has no `htmlFor` | `:131`, `:650-709`, `:1212-1221` |
| B9 | The error box is a pink slab in dark mode (2.53:1), has no `role="alert"`, and cannot be dismissed | `:1291-1293` |
| B10 | MorphSlider autoplay changes the armed track about 6 s after any selection | `TrackManager.tsx:138-139`, `:142`, `:91`; `reactbits/MorphSlider.tsx:500-503` |
| B11 | 'Start Director' stacks its Play icon above its label (DitherButton wraps children in `<span className="relative">`) | `dither-kit/button.tsx:213`; `DirectorPlayer.tsx:1243-1252`; `admin-dark.jpg` |
| B12 | 'Stop' stays clickable during 'closing', so it can call `disconnect()` twice. It looks the same as 'Send direction' | `:1254` |
| B13 | Violet off-brand chrome in the Audio library, and `backdrop-blur` on the carousel badge | `TrackManager.tsx:128`, `:144`, `:154-157`, `:187` |
| B14 | Keyboard and label gaps. Track rows are `<li onClick>`. Settings labels are unassociated. The chat prefix is title-only. The stream-key input is placeholder-only | `TrackManager.tsx:152-160`; `DirectorSettingsForm.tsx:41-186`; `ChatSteerer.tsx:183-189`; `TwitchBroadcast.tsx:222-228` |
| B15 | The dark native textarea renders UA grey, because it has no background class | `DirectorPlayer.tsx:1216-1221`; `admin-dark.jpg` |
| B16 | Mobile: a ≈292×164 stage (measured on the screenshot), then a scroll of controls. 'Start Director' and 'Send direction' stack, and nothing is pinned | `admin-mobile.jpg` |

§3.7 ranks these app-wide.

### 8.4 Layout spec

The whole instrument is one `<section aria-label="Director" data-density="compact" data-testid="lc-root" class="lc-root">`, rendered by DirectorPlayer. `data-density="compact"` sets `--h-control: 32px`, `--h-row: 32px` and `--pad-panel: 12px` (§5.8). **The DOM order is fixed at every breakpoint:** Program (`.lc-program`), then Session sheet (`.lc-session`), then Dock (`.lc-dock`), then Rundown (`.lc-rundown`). Breakpoints only re-place these four nodes with CSS. No node ever moves to another parent, so no breakpoint change remounts `<video>`, ChatSteerer's IRC client, TrackManager or the recorders. Program comes first so that 'Start Director' is the first control after the skip link and the label strip.

#### 8.4.1 Root, grid and dock height (`dashboard/app/styles/live-control.css`)

This block holds the grid, sticky, unit and tray rules. The well and screen (§8.4.3), program keyline (§8.4.4), mobile pane and fixed-transport (§8.4.10) rules go in the same file, which contains only `@layer components` (plus comments). The global tokens it reads (`--h-chrome`, `--h-offline`, `--dock-h`, `--h-status`, `--h-transport`) live in `tokens.css` (§5.2); the element-scoped properties (`--rail-l`, `--rail-r`, `--ar`, `--ar-n`, `--lc-sticky-h`) live here.

```css
@layer components {
  .lc-root {
    --rail-l: 248px; --rail-r: 304px;
    --ar: 16 / 9; --ar-n: 1.7778;
    width: min(100vw - 32px, 1920px);
    margin-inline: auto;
    display: flex; flex-direction: column; gap: 12px;
    padding-block: 12px calc(var(--h-transport) + 16px);
  }
  .lc-root[data-aspect="9:16"] { --ar: 9 / 16; --ar-n: 0.5625; }
  .lc-root[data-aspect="1:1"]  { --ar: 1 / 1;  --ar-n: 1; }

  /* below 1024: the sticky monitor block and mobile tabs (§8.4.10) */
  .lc-monitor {
    position: sticky; top: calc(var(--h-chrome) + var(--h-offline)); z-index: 10; background: rgb(var(--c-canvas));
    display: flex; flex-direction: column; gap: 4px;
  }
  .lc-mobile-tabs {
    position: sticky; top: calc(var(--h-chrome) + var(--h-offline) + var(--lc-sticky-h, 0px)); z-index: 10;
    background: rgb(var(--c-canvas));
  }
  @media (max-width: 1023px) {
    .lc-program { display: contents; }    /* monitor, tabs and unit become .lc-root flex items, so they stay sticky over every pane */
    .lc-dock-toggle { display: none; }    /* the Dock ignores data-dock below 1024 */
  }
  @media (max-width: 1023px) and (max-height: 740px) {
    .lc-monitor, .lc-mobile-tabs { position: static; }   /* short phones: only the transport stays fixed */
  }

  /* the transport + telemetry unit (§8.4.3) and the AlertTray (§8.4.6) */
  .lc-unit { position: relative; flex: none; }           /* no border and no overflow: the AlertTray hangs outside it */
  .lc-unit-frame { position: relative; overflow: hidden; }  /* rounded-md sq in the markup */
  .lc-unit-frame::after {                                /* the frame paints above the children's opaque surfaces */
    content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
    box-shadow: inset 0 0 0 1px rgb(var(--c-border-subtle));
  }
  .lc-telemetry { box-shadow: inset 0 1px 0 rgb(var(--c-border-subtle)); }   /* the transport/telemetry divider */

  @media (min-width: 1024px) {
    .lc-root {
      display: grid; gap: 12px; padding-block: 12px;
      margin-top: var(--h-offline);
      height: calc(100dvh - var(--h-chrome) - var(--h-status) - var(--h-offline));
      min-height: 560px;
      grid-template-columns: var(--rail-l) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) var(--dock-h);
      grid-template-areas: "session program" "session dock";
    }
    .lc-program { grid-area: program; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
    .lc-monitor { position: static; flex: 1 1 0; min-height: 0; gap: 8px; background: none; }
    .lc-mobile-tabs { display: none; }
    .lc-session { grid-area: session; min-height: 0; }
    .lc-dock    { grid-area: dock;    min-height: 0; }
    .lc-rundown { min-height: 0; display: flex; flex-direction: column; }
    .lc-alert-tray { position: absolute; top: 100%; inset-inline: 0; margin-top: 4px; z-index: 10; }
    :root[data-dock="open"] .lc-alert-tray { top: calc(100% + 12px + 36px); }   /* over the Dock body, never its header */
  }
  @media (min-width: 1024px) and (max-width: 1279px) {    /* the Rundown replaces the Session sheet while open */
    .lc-root { --rail-l: 304px; }
    .lc-rundown { display: none; }
    .lc-root[data-rundown-open] .lc-session { display: none; }
    .lc-root[data-rundown-open] .lc-rundown { display: flex; grid-area: session; }
  }
  @media (min-width: 1280px) {
    .lc-root {
      grid-template-columns: var(--rail-l) minmax(0, 1fr) var(--rail-r);
      grid-template-areas: "session program rundown" "session dock rundown";
    }
    .lc-rundown { grid-area: rundown; }
  }
  @media (min-width: 1440px) { .lc-root { --rail-l: 264px; --rail-r: 336px; } }
  @media (min-width: 1920px) { .lc-root { --rail-l: 288px; --rail-r: 384px; } }
}
```

- **`data-dock`.** themeInit (§7.6) sets `data-dock` before paint. The Dock toggle then writes `localStorage['wzrd:dock']` and `document.documentElement.dataset.dock`, and `--dock-h` follows the attribute (§5.2). The skeleton and the page read the same variable, so the dock never causes layout shift (CLS 0).
- **Offline.** While `html[data-offline]` is set (§7.6), `--h-offline` is 36 px (§5.2). At ≥1024 the root moves down by it and its height shrinks by it; below 1024 the sticky offsets add it. Zero page scroll holds and nothing sits under the OfflineBanner.
- **ChyronHost on this route:** placement is §7.15's pathname table. Live Control sets no chyron variables.
- **Rundown at 1024–1279.** DirectorPlayer sets `data-rundown-open` on `.lc-root` while the Rundown is open there. The Rundown then takes the left rail and the Session sheet is `display: none`; both stay mounted. It is not a Sheet and not fixed, so it never covers Program or the transport.

#### 8.4.2 Columns and rows per breakpoint

| Viewport width | Left `--rail-l` | Program | Right `--rail-r` | Rundown | Rows (≥1024) |
|---|---|---|---|---|---|
| ≥1920 | 288 | `minmax(0,1fr)` (root capped at 1920) | 384 | grid column | `minmax(0,1fr)` / `var(--dock-h)` |
| 1440–1919 | 264 | `minmax(0,1fr)` | 336 | grid column | same |
| 1280–1439 | 248 | `minmax(0,1fr)` | 304 | grid column | same |
| 1024–1279 | 304 | `minmax(0,1fr)` | none | left rail, in place of the Session sheet while open; the strip's Rundown IconButton toggles it | same |
| <1024 | single flex column; the mobile tab bar picks one pane | | | pane | no grid (§8.4.10) |

Constants for all bands ≥1024: column and row gap 12, `padding-block` 12, side gutter 16 (from `100vw - 32px`), root height `100dvh − 48 − 24 − offline` with `margin-top: offline` (offline = `--h-offline`, 0 or 36), `min-height` 560.

#### 8.4.3 Program column and monitor size

Program column, top to bottom, with 8 px gaps:

| Element | Height | Notes |
|---|---|---|
| MonitorLabelStrip | 28 (`--h-strip`); 40 below 768 (two lines) | h2 **'Director (realtime WebRTC)'** (`title-sm`) · `minimax/h3-max/director` (`code` text-3; a second line below 768) · spacer · state word (`label`, `data-testid="lc-state-word"`, `data-state={state}`) · at 1024–1279 only, the 'Rundown' IconButton |
| Monitor bezel (`.lc-bezel`, `data-testid="lc-bezel"`) | flex `1 1 0`, `min-height: 0` | Grid rows `28px minmax(0,1fr) 12px`, `row-gap: 8px`, `padding: 8px`, 1 px `line-subtle` border, `rounded-screen`, `bg-bezel`. Rows: TallyBar, screen well, lip |
| TransportBar + TelemetryStrip (`.lc-unit`) | exactly 88 (56 + 32), one unit with no gap, as wide as the column | `.lc-unit` (`position: relative; flex: none`) has no border and no overflow. Its first child `.lc-unit-frame` (`rounded-md sq overflow-hidden`) holds TransportBar (`surface-panel`) and TelemetryStrip (`.lc-telemetry`, `surface-inset`). The frame and the transport/telemetry divider are drawn with `box-shadow: inset …` (§8.4.1), never with borders, so they add no height. The AlertTray is the frame's sibling inside `.lc-unit` and hangs below it (§8.4.6) |

**Screen well** (`.lc-well`): `container-type: size; display: grid; place-items: center`.
**Screen** (`.lc-screen`, `data-testid="lc-program-screen"`): `position: relative; aspect-ratio: var(--ar); width: min(100cqw, calc(100cqh * var(--ar-n))); container-type: inline-size; container-name: lc-screen; border-radius: var(--r-screen); overflow: hidden; background: rgb(var(--c-screen))`. Its `cqw`/`cqh` resolve against `.lc-well`; the slates inside query `lc-screen`. The aspect comes from `settings.aspectRatio` through `data-aspect` on `.lc-root`, so the screen is contain-fit at 16:9, 9:16 and 1:1. It is height-limited or width-limited, never cropped.

The well is `H = viewportH − 314 − dockH` tall (minus 36 more while offline) and `W = programCol − 18` wide:
- `314` = 48 (bar) + 24 (rail) + 24 (root padding) + 12 (row gap) + 132 (strip 28 + gaps 16 + unit 88) + 74 (bezel chrome: 2 borders + 16 padding + TallyBar 28 + 2×8 row gaps + lip 12).
- `programCol = min(vw − 32, 1920) − railL − railR − gaps`.

| Viewport | Dock (default) | Columns | Well W×H | Screen at 16:9 | at 9:16 | at 1:1 |
|---|---|---|---|---|---|---|
| 1024×768 | collapsed (768 < 820) | 304 / 676 / — | 658×418 | **658×370** | 235×418 | 418×418 |
| 1280×800 | collapsed | 248 / 672 / 304 | 654×450 | **654×368** | 253×450 | 450×450 |
| 1440×900 | open | 264 / 784 / 336 | 766×386 | **686×386** | 217×386 | 386×386 |
| 1440×900 | collapsed | 264 / 784 / 336 | 766×550 | **766×431** | 309×550 | 550×550 |
| 1920×1080 | open | 288 / 1192 / 384 | 1174×566 | **1006×566** | 318×566 | 566×566 |
| 2560×1440 | open | 288 / 1224 / 384 (root 1920) | 1206×926 | **1206×678** | 521×926 | 926×926 |

Tolerance is ±1 px per dimension (the values are rounded to the nearest pixel).

#### 8.4.4 Monitor anatomy (DirectorStage)

The bezel is theme-invariant hardware, with the same pixels in light and dark (§5.3).

| Layer | Element | Spec |
|---|---|---|
| Bezel row 1 | `<TallyBar/>` (§7.4) | 28 px. Left: the `STBY`/`PVW` lamp, then the `REC` lamp with readout `REC {bytes} · HH:MM:SS` (§7.4; `bytes(n)`, §5.20.4). Right: the `ON AIR` lamp, which reads `CUE {MM:SS}` (counting from `cueSince`) while a cue is not confirmed (§6.7). It reads the broadcast store |
| Bezel row 2 → screen z0 | `bg-screen` | #000 |
| z1 | `<DitherGradient from="blue" direction="up" opacity={0.55} cell={4} className="absolute inset-0" />` | **Kept base layer, props unchanged** (`DirectorPlayer.tsx:1083`). It is the fallback whenever nothing above it paints |
| z2 | **The single `<video ref={videoRef} autoPlay playsInline muted={muted}>`** | `className="absolute inset-0 h-full w-full object-contain"`, `aria-label="Program output"`. Rendered unconditionally in every state and every breakpoint. It never carries a `key`, is never inside a conditional, and is never moved between parents. `srcObject` is assigned only imperatively (`:254`, `:888`, `:964`) |
| z3 | `SymbolRaster` **or** `BrandImage` | Shown in the standby, failed and acquiring phases (§8.5.11 slots). `SymbolRaster src="/brand/standby/coast-{16x9\|9x16\|1x1}-lum.png"` (§12.3.10, §13.8). Loser, or while the SymbolRaster module is loading: `` <BrandImage id={`standby/coast-${aspect.replace(':', 'x')}`} sizes="100vw" alt="" /> `` (canonical §13.6 ids) with `image-rendering: pixelated`. `aria-hidden` |
| z4 | Plate or slate | Exactly one of these: StandbySlate, ConnectPlate, StoppingPlate, FailedSlate (§8.6.2). Otherwise nothing |
| z5 | `<SelectionBrackets variant="viewfinder" inset={12} tight={firstFrame} />` | Ink `text-fg-on-screen-2` at .7 (screen-invariant; `text-3` would turn dark-on-black in light mode, §12.3.9). Tightens 4 px once, over 200 ms, when the first frame arrives (§6.5). This is the only thing that ever covers program video |
| Bezel row 3 (lip, 12 px) | Tag, right-aligned | `micro` `text-fg-on-screen-2` (solid bezel only). Before the first frame: `{settings.resolution} · {settings.aspectRatio} · H3 MAX` (for example `768p · 16:9 · H3 MAX`). After it: `{video.videoWidth}×{video.videoHeight} · H3 MAX`. Hidden below 1024 |
| Bezel outer edge | Program keyline | `.lc-bezel[data-air="on"] { box-shadow: 0 0 0 2px rgb(var(--c-tally-program)) }`. Cuts in and out with no transition. Present only while `air === 'on'`, never while `stalled` |

> Note: the keyline cuts out on `stalled` and cuts back in on recovery (same rule as §6.7).

**Plate and slate geometry** (all `surface-hud` plates, text `text-fg-on-screen` only; accent text is never placed on a HUD plate, §5.6):
- **StandbySlate.** At 16:9 the plate sits on the right two-thirds: `left: 33.333%; right: 16px; top: 50%; translateY(-50%)`, padding 16, max 3 premise lines. At 9:16 and 1:1 it sits at the bottom: `inset-inline: 12px; bottom: 12px`, max 45% of the screen height. Content: `<PixelFace text="STAND BY" cell={2} srText="Stand by" />` (accent is not allowed on the plate, so text-on-screen), then the **premise** (the composer's live value) in `text-premise` (24/30, weight 300) clamped to 3 lines, then **'Director offline'** in `caption`, then the hint `<Kbd keys={['mod','Enter']} /> to start` in `caption` text-on-screen (the hint never says 'Start Director'). With `@container lc-screen (max-width: 559px)` (the screen's width, §8.4.3) the premise drops to `text-title` (16/22), clamped to 2 lines.
- **ConnectPlate** (`data-air-allow`, §6.12). Bottom-left, inset 16, width `min(320px, 100% − 32px)`. Content: `` <StageTrack orientation="vertical" tone="hud" decryptActive label="Connection progress" stages={CONNECT_STEPS.map((label, i) => ({ id: `s${i}`, label }))} current={`s${connectStep}`} status="running" /> `` (API: §12.3.6; `decryptActive` re-keys the active label's DecryptedText, so there is no separate `<DecryptedText>` wrapper), the `T+{tcShort(Date.now() − telemetryRef.current.connectStartedAt)}` readout (for example `T+00:07.4`, `readout`, updated at 10 Hz through the shared ticker), the latest diagnostic line (`code`, 1 line, ellipsis), and a `<Button size="sm" variant="secondary">Cancel</Button>` plus an aria-hidden `<Kbd keys={['Esc']} />`.
- **StoppingPlate.** Centred, `<BayerSpinner size={16} />` plus **'Stopping…'** in `title-sm`.
- **FailedSlate.** Same box as StandbySlate. Kicker `<PixelFace text="SIGNAL LOST" cell={2} srText="Signal lost" />`, then **'Session failed'** in `title-lg`. The error text itself appears only in the AlertTray, so it is never duplicated.

#### 8.4.5 TransportBar slots (56 px, `container-type: inline-size; container-name: transport`, padding-inline 8, gap 8)

Every slot has a **fixed width**. A control that appears or disappears renders inside its reserved slot, and an empty slot renders `<span aria-hidden className="block" />` at the same width. Nothing in the transport moves when a control appears (air lock, §6.12).

| Order | Slot | Width: `≥900` container / `<900` / `<700` / `<480` | Content |
|---|---|---|---|
| 1 | Air clock | 136 / 136 / 116 / hidden | Kicker `AIR` (`label`, text-3) over the timecode `HH:MM:SS`. `timecode` 28/32; `readout-lg` 24/28 below 700. Hidden below 768 viewport |
| 2 | Start/Stop | 164 / 164 / 164 / 164 | §8.5.7 |
| 3 | Record ↔ Stop & save recording | 184 / 32 / 32 / 32 | Full label at ≥900. Otherwise icon-only with the label in sr-only text |
| 4 | Capture frame | 136 / 32 / 32 / 32 | same |
| 5 | Remix frame | 128 / 32 / 32 / 32 | same |
| 6 | Mute | 32 / 32 / 32 / 32 | IconButton |
| 7 | Spacer | `flex: 1` / `flex: 1` / `flex: 1` / 0 | none |
| 8 | Go live on Twitch ↔ Stop broadcast | 176 / 176 / 176 (32 below 768) / 32 | §8.5.7. At 32 px it is icon-only with the same string as sr-only text |

> Note: the bible's "program clock" is implemented as **time on air** (kicker `AIR`, counting from `airSince` while `air ∈ {on, stalled}`, otherwise `00:00:00` in `text-fg-disabled`). Session time is already shown as 'Live · HH:MM:SS' in the telemetry, so the two clocks never display the same number.

Slots 3–6 form one group with a 4 px internal gap. **Budget check:** at 1280 wide (container 672, inner 656) the widths are 116 + 164 + (4×32 + 3×4) + 176 + 4×8 = 628 ≤ 656. At 1920 wide (container 1192, inner 1176) with full labels: 136 + 164 + (184+136+128+32 + 12) + 176 + 32 = 1000 ≤ 1176.

**Below 480 (container).** Padding-inline 4, gap 4. The slot 3–6 group is `flex: 1 1 0; min-width: 0` inside `<ScrollFade axis="x">`, so it scrolls inside the bar instead of pushing slot 8 out. On `(pointer: coarse)` every icon-only slot (3–6 and 8) is 44 px wide (§5.8). Budget at 360 wide, fine pointer: padding 8 + 164 + (4×32 + 3×4 = 140) + 0 (spacer) + 32 + 3 gaps × 4 = 356 ≤ 360; on a coarse pointer the group scrolls and slots 2 and 8 stay in view.

#### 8.4.6 TelemetryStrip (32 px, `surface-inset`, `readout` 13/16, `.nums`) and AlertTray

The cells sit in one row separated by 1 px `line-subtle` rules, wrapped in `<ScrollFade axis="x">`, so it scrolls horizontally with `edge-fade-x` when narrow. Cells always render. A value that does not exist yet is shown **unlit** in `text-fg-disabled`, so nothing appears or reflows when the session starts. The order puts the public-output truth (WHIP) second, so it is inside the visible strip at every width ≥ 1280.

| # | Cell | Live text (exact) | Unlit text | Width |
|---|---|---|---|---|
| 1 | Session clock | `Live · HH:MM:SS` (D6 change from `Live · {n}s`) | kicker `SESSION` + `--:--:--` | `min-w-[15ch]` |
| 2 | WHIP (only while `air ∈ {on, stalled}`, occupying a reserved slot) | `{kbps} kbps · {fps} fps · {rtt} ms` | slot reserved, empty | `min-w-[26ch]` |
| 3 | Allowance ladder | 20-segment LedLadder only; its `valueText` is the cell 8 sentence | 0 lit segments | 80 px |
| 4 | Ping | 4-segment LedLadder + `Ping · {n} ms` | `Ping · -- ms` | `min-w-[14ch]` + ladder |
| 5 | Buffer | `buf {n.n}s` (verbatim, `:1152`) | `buf --s` | `min-w-[9ch]` |
| 6 | Generation | `gen {n.n}s` (verbatim, `:1153`) | `gen --s` | `min-w-[9ch]` |
| 7 | Tape | 'Uploading…' (`role="status"`), then `{size} uploaded` (`bytes(n)`, §5.20.4) in success tone | empty | `min-w-[16ch]` |
| 8 | Allowance text | `Session allowance: {m}:{ss} · about {N}m remaining` (verbatim format, `:1163-1165`) | `Session allowance: --` | auto |

**Ladder mapping** (§7.4 LedLadder; `value` is the lit fraction 0–1, and the tones below are the requirement):
- **Allowance** (cell 3): `remaining = max(0, sessionAllowance − elapsed)` in seconds, `value = remaining / sessionAllowance`. Tone success above 300 s, warning at `remaining ≤ 300`, danger at `remaining ≤ 60` (`thresholds={{ warn: 300 / sessionAllowance, danger: 60 / sessionAllowance }}`).
- **Ping** (cell 4): 4 lit segments under 100 ms, 3 under 150 ms, 2 under 400 ms, else 1 (`value = lit / 4`). Tone success under 150 ms, warning under 400 ms, else danger (`thresholds={{ warn: 0.5, danger: 0.25 }}`). `aria-valuenow = pingMs`, `aria-valuemin = 0`, `aria-valuemax = 1000`, `valueText` = `Ping · {n} ms`.
- **Buffer** (cell 5): the text is `text-warning` below 1.0 s.
- **Unlit:** both ladders show 0 lit segments until their value exists.

> Note: the bible also lists "the REC readout" in the telemetry. `REC {bytes} · HH:MM:SS` lives once, in the TallyBar. The telemetry's tape cell carries the upload lifecycle instead, so the text 'REC 12.3 MB' is never rendered twice.

**AlertTray** is `<div data-testid="lc-alert-tray" role="alert" className="lc-alert-tray">`, rendered only when `error !== null`. It is the sibling of `.lc-unit-frame` inside `.lc-unit` (§8.4.3), so no `overflow` clips it. At ≥1024 it is `position: absolute; top: 100%; inset-inline: 0; margin-top: 4px; z-index: 10` (§8.4.1). With the dock open its top is `calc(100% + 12px + 36px)`, so it covers the Dock body and never the Dock header (tabs, 'Cut to script', 'Queue script', the collapse control); with the dock collapsed it stays at `top: 100%`. It never moves Program. Below 1024 it is in the normal flow, directly under the telemetry. It is 40 px min-height, `surface-raised shadow-e2 rounded-sm sq`, with a 1 px `border-danger` and a 4 px left bar in `danger` at a 50% Bayer mask (§5.13). Content: a kicker `ERROR` (`micro`, text-danger), then `{error}` verbatim (`body-sm`, 2-line clamp, full text in `title`), then `<Button variant="ghost" size="sm">View events</Button>`, then `<IconButton icon={X} label="Dismiss error" size="sm" />`.

#### 8.4.7 Session sheet (left rail)

`surface-chassis`, 1 px `line-subtle` right border, `rounded-md sq`, padding 12. It scrolls internally (`overflow-y: auto`, `<ScrollFade axis="y">`). Blocks are separated by a `.dither-rule` (2 px, 12 px vertical margin).

| Block | Height | Content |
|---|---|---|
| Header | 24 | Kicker `SESSION` (`label`, text-3) + state readout |
| TalentCard | 116 | Kicker `TALENT` + name token (`code`): `settings.characterName`, or the placeholder `$COAST` in `text-fg-disabled` when empty. Two screens side by side (`grid-cols-2 gap-2`, each `aspect-video bg-screen rounded-screen`): `settings.characterSheet` (label `SHEET`) and `settings.imageUrl` (label `FIRST FRAME`). An empty screen shows a 25% Bayer field with `micro` `NONE`. A `Badge tone="accent"` reading `NEXT SESSION` appears on FIRST FRAME when `capturedFrame !== null && capturedFrame === settings.imageUrl`. Below: `Continuity frame set: {capturedFrame}` (`caption`, 1 line, ellipsis, full URL in `title`) when `capturedFrame` is set |
| PreflightList | 24 + 7×24 | Kicker `PREFLIGHT` + `{ok}/{total}` readout. 7 rows (§8.5.8), each 24: `<Led>` + label (`body-sm`) + fix (`caption` text-3, 1 line) |
| SessionSettings **or** LockedSettings | 32 closed | `!live && !busy`: the `<details>` 'Session settings (locked once connected)'. Otherwise: kicker `LOCKED` + Lock icon + a Chip row (§8.5.8) |
| PremiseBlock | ≤ 96 | Only while `live \|\| busy`: kicker `PREMISE` + the snapshot premise (`body-sm` text-2, 4-line clamp, full text in `title`) |
| Twitch panel | ~120 | §8.5.8 |

#### 8.4.8 Rundown (right rail; at 1024–1279, the left rail while open)

`surface-chassis`, `rounded-md sq`, 1 px `line-subtle`, in every band. Header: a 36 px `Tabs.List` ('Direction', 'Chat', 'Events'); at 1024–1279 only, a trailing `<IconButton icon={X} label="Close rundown" />` that gives the left rail back to the Session sheet. The panels scroll internally.
- **Direction**, top to bottom:
  - Composer label, 16 px.
  - Textarea (`autoGrow`, 3 to 8 rows at 16/24, padding 8).
  - Attachment chip row, 28.
  - Send row, 32: 'Send direction' plus `<Kbd keys={['mod','Enter']} />` plus a character count readout.
  - 'Applied: …', 2-line clamp.
  - Kicker `QUEUE`, then the StreamList. Rows are 28, newest first, 8 rows at most (the existing `.slice(-8)`).
- **Chat:** a 32 px header row (h3 'Chat steering' + LED status), the description (`caption`), a 32 px controls row, then the feed.
- **Events:** a 32 px filter row, then the log list.

#### 8.4.9 Dock (under Program)

- **Height** is `var(--dock-h)` (§5.2): 200 open, 36 collapsed.
- **Header** (36 px): `Tabs.List` ('Script', and 'Audio' only when `useConvexEnabled()`), the script readout `{n} beat{s}` plus ` · beat @{X}s playing`, a source Chip (§8.5.10), the live script actions ('Cut to script', 'Queue script') or, when not live, the 'Send with session start' checkbox, and the collapse IconButton (`.lc-dock-toggle`; 'Collapse dock' / 'Expand dock', PanelBottom icon, `aria-expanded`, `aria-controls="lc-dock-body"`).
- **Body** (164 px, `id="lc-dock-body"`, `hidden` when collapsed):
  - **Script:** timeline pane (`flex: 1`) and inspector pane (256 px below 1440, 288 px at 1440 and up).
  - **Audio:** track list (240), armed-track controls (`flex: 1`, min 280), artwork (a square at the body's full height, 164×164, shown only when the Dock is at least 776 px wide: the former 760 px rule plus the 16 px the square grew). At every width, the Audio header's 'Expand artwork' IconButton opens the artwork in a Sheet at up to 480×480 (§8.5.10).
- **Under the air lock** the collapse control is disabled with `aria-disabled` and the tooltip 'Locked while on air' (the lock reason, §6.12). Height never changes while `html[data-lock="air"]` is set.

#### 8.4.10 Below 1024

- **Single column.** `.lc-root` is a flex column, and `.lc-program` is `display: contents`, so `.lc-monitor`, MobileTabs (`.lc-mobile-tabs`) and `.lc-unit` become flex items of `.lc-root` and stay sticky through every pane (a sticky element cannot leave its parent box). The **monitor block** (label strip + bezel) is `position: sticky; top: calc(var(--h-chrome) + var(--h-offline)); z-index: 10; background: rgb(var(--c-canvas))` (§8.4.1). `--h-chrome` is 48 + 44 = 92 below 768 and 48 from 768 to 1023 (§5.2).
- **Label strip at this size:** 40 px below 768, with `minimax/h3-max/director` on its own line so it stays visible (H8). The monitor block has a 4 px gap between the strip and the bezel.
- **Bezel at this size:** padding 4, row gap 4, rows `28px auto`, no lip. The well is `height: min(calc((100vw - 42px) / var(--ar-n)), 40dvh)`.
- **Mobile tab bar.** `role="tablist"`, 40 px, sticky at `top: calc(var(--h-chrome) + var(--h-offline) + var(--lc-sticky-h, 0px))`. `--lc-sticky-h` is set on `.lc-root` by a ResizeObserver on the monitor block. Tabs: 'Direction' | 'Session' | 'Script' | 'Chat' | 'Audio' (only when Convex is enabled) | 'Events'. It horizontally scrolls with `edge-fade-x`.
- **Short viewports.** When `(max-height: 740px)`, the monitor block and the mobile tab bar are `position: static` (cut-order item 9 applied automatically); the transport stays fixed.
- **Choosing a pane.** The active tab sets `data-mpane` on `.lc-root`. CSS shows exactly one of `.lc-session`, `.lc-dock` or `.lc-rundown`, and hides the others with `display: none`, which keeps them mounted. The Rundown and Dock `Tabs.List` are hidden and their `value` is driven by the mobile tab, so no tab trigger is duplicated in the accessibility tree.
- **Transport and telemetry.**
  - TransportBar: `position: fixed; inset-inline: 0; bottom: calc(var(--h-status) + env(safe-area-inset-bottom, 0px)); height: 56px; z-index: 40; border-radius: 0`. Its container is the viewport width, so the `<480` slot column of §8.4.5 applies on phones.
  - TelemetryStrip: in the normal flow directly under the mobile tab bar, scrolling horizontally. The AlertTray, when present, follows it.
  - The root reserves `padding-bottom: calc(56px + 16px)`.
- **Dock and density at this size.** The Dock renders at its natural height and scrolls with the page; `--dock-h` does not apply. The Dock ignores `data-dock`: `#lc-dock-body` is never `hidden`, and the collapse IconButton (`.lc-dock-toggle`) is `display: none`. The Dock's collapsed flag is `html.dataset.dock === 'collapsed' && !matchMedia('(max-width: 1023px)').matches`, read in a layout effect and re-read on that query's `change` event. Density stays compact, but `(pointer: coarse)` forces 44 px targets (§5.8).

#### 8.4.11 Wireframes

Legend: `[o]` Record, `[c]` Capture frame, `[*]` Remix frame, `[m]` Mute, `(o)` Go live on Twitch, `#` an LED, `[x]` a checkbox, `>` a closed `<details>`.

**≥1440** (1440×900, idle, dock open):

```text
+------------------------------------------------------------------------------------------------------------------+
| [bug] Stream Admin | Live Control Shotboard | Characters ... | [STBY] [REC] [AIR] [Cmd K] [theme]                |  48  CommandBar
+-----------------------+--------------------------------------------------------------+---------------------------+
| SESSION           264 | Director (realtime WebRTC) minimax/h3-max/director Standby   | RUNDOWN             336   |  28  label strip
| TALENT        $COAST  | +-bezel #0B0F17 -------------------------------------------+ | [Direction][Chat][Events] |
| [ SHEET ][1ST FRAME]  | | (STBY) (REC)                                (OFF AIR)    | | Opening prompt (the       |
|   106x60    106x60    | |  +-screen 686x386, 16:9 ------------------------------+  | | series premise)           |
| PREFLIGHT         4/7 | |  | SymbolRaster        +-HUD plate, right 2/3 -----+  |  | | +-----------------------+ |
| # Convex              | |  | Coast art in the    | STAND BY                  |  |  | | | A continuous original | |
| # Twitch channel      | |  | left third          | <premise, 24/30 Light,    |  |  | | | live-action stream    | |
| # Stream key          | |  |                     |  max 3 lines>             |  |  | | | following a group ... | |
| # Character sheet     | |  |                     | Director offline          |  |  | | +-----------------------+ |
| # First frame         | |  |                     | [Cmd][Enter] to start     |  |  | | [+ End frame] [+ Audio]   |
| # Script              | |  |                     +---------------------------+  |  | | [Send direction] Cmd+Ent  |
| # fal   Verified on   | |  +----------------------------------------------------+  | | Applied: ...              |
|         start         | |                               768p . 16:9 . H3 MAX       | | QUEUE                     |
| > Session settings    | +----------------------------------------------------------+ | Directions you send       |
|   (locked once        | AIR  [> Start Director] [o][c][*][m]  [(o) Go live on Twitch]| appear here.              |  56  transport
|   connected)          | 00:00:00                                                     |                           |
| TWITCH BROADCAST      | SESSION --:--:-- |          | [........] | Ping . -- ms | ...|                           |  32  telemetry
| [Connect to Twitch]   +--------------------------------------------------------------+                           |
| > Paste a stream key  | [Script] [Audio]  0 beats   [x] Send with session start  [v] |                           |  200 dock (--dock-h)
|   instead             | 0s    10s    20s    30s    40s ...  | Timed shots the model  |                           |
|                       | (no beats)    [+ Add shot]          | runs on its own clock  |                           |
|                       |                                     | [Load template...] edit|                           |
|                       |                                     |                        |                           |
+-----------------------+--------------------------------------------------------------+---------------------------+
| NET * CONVEX * TWITCH *  (message slot)                                                    21:04:12              |  24  StatusRail
+------------------------------------------------------------------------------------------------------------------+
```

**1024–1279** (1024×768, live, recording, Rundown open in the left rail, dock collapsed):

```text
+----------------------------------------------------------------------------------------------+
| [bug] | (o)(r)(c)(f)(v)(m)(a)  Live Control      [AIR] [Cmd K] [theme]                       |  48  CommandBar (inactive links icon-only)
+----------------------------+-----------------------------------------------------------------+
| RUNDOWN      304       [x] | Director (realtime WebRTC) minimax/h3-max/director  Preview [R] |  28  strip; [R] = Rundown IconButton, aria-expanded=true
| [Direction][Chat][Events]  | +-bezel ------------------------------------------------------+ |      the Rundown takes the left rail; the Session sheet is display:none
| Next direction             | | (PVW) (REC 12.3 MB . 00:04:12)                  (OFF AIR)   | |
| +----------------------+   | |  +-screen 658x370 ---------------------------------------+  | |
| | <draft>              |   | |  |                                                       |  | |
| +----------------------+   | |  |     <program video>                                   |  | |
| [+ End frame] [+ Audio]    | |  |                                                       |  | |
| [Send direction] Cmd+Ent   | |  +-------------------------------------------------------+  | |
| Applied: [chat @ana] ...   | |                                           <w>x<h> . H3 MAX  | |
| QUEUE                      | +-------------------------------------------------------------+ |
| o v7 sent - ...            | AIR      [Stop] [o][c][*][m]          [(o) Go live on Twitch]   |  56  transport
| * v6 pending - ...         | 00:12:44                                                        |
| # v5 applied - ...         | Live . 00:12:44 |          | [#######.] | Ping . 42 ms | ...    |  32  telemetry
| x v4 rejected - ...        +-----------------------------------------------------------------+
|                            | [Script] [Audio]  4 beats . beat @12s playing [Cut][Queue] [^]  |  36  dock collapsed (768 < 820 px tall)
+----------------------------+-----------------------------------------------------------------+
| NET * CONVEX * TWITCH *  Info: Recording started                     21:16:02                |  24  StatusRail
+----------------------------------------------------------------------------------------------+
```

**<1024 mobile** (390×844, idle, Direction tab):

```text
+--------------------------------------------+
| [bug]            [STBY]  [Search] [theme]  |  48  CommandBar
| Live Control | Shotboard | Characters | >  |  44  nav row (scroll-snap)
+--------------------------------------------+
| Director (realtime WebRTC)       Standby   |  40  strip        -+
| minimax/h3-max/director                    |
| +-bezel ---------------------------------+ |
| | (STBY) (REC)                  (OFF AIR)| |
| | +-screen 348x196 --------------------+ | |
| | | Symbol- | STAND BY                 | | |
| | | Raster  | <premise, 16/22, 2 lines>| | |  238 monitor       | sticky, top:92
| | |         | Director offline         | | |
| | |         | Cmd+Enter to start       | | |
| | +------------------------------------+ | |
| +----------------------------------------+ |                   -+
| [Direction][Session][Script][Chat][Au >    |  40  mobile tabs (sticky under monitor)
+--------------------------------------------+
| SESSION --:--:-- |          | [........]   |  32  telemetry (scrolls, edge-fade-x)
| Opening prompt (the series premise)        |      active tab panel (scrolls)
| +--------------------------------------+   |
| | A continuous original live-action    |   |
| | stream following a group of friends  |   |
| +--------------------------------------+   |
| [Send direction]                           |
| QUEUE  Directions you send appear here.    |
+--------------------------------------------+
| [> Start Director] [o][c][*][m]   [(o)]    |  56  transport, position:fixed (+ safe area)
+--------------------------------------------+
| NET * CONVEX * TWITCH *        21:04:12    |  24  StatusRail
+--------------------------------------------+
```

### 8.5 Component tree

#### 8.5.1 PR sequence (parts 8A, 8B and 8C; placement in §14.12)

| PR | Scope | Visual change | Gate |
|---|---|---|---|
| **8A: Extract** | Moves `DirectorPlayer.tsx` into `dashboard/components/director/*` using the map in §8.5.2. Moves TwitchBroadcast's logic into `useTwitchBroadcast`. Moves the 1 s tick into leaves via `useSecondClock`. Replaces the log with the ring buffers. Publishes to the broadcast store. Runs the 1A `tests/live-extraction.spec.ts` and creates no test file | **None.** The DOM is byte-identical in every state reachable without credentials | §8.5.4 proof, §8.10 A-series |
| **8B: Instrument** | Grid, monitor anatomy, transport, telemetry, Session sheet, Rundown, Dock, the states in §8.6, keyboard, a11y, `live-control.css`, the LiveSkeleton swap in `app/admin/(live)/loading.tsx`, `LiveControlVisualFixture` and its page line, codemod 10 on every Live Control file (§5.19), the ScriptTemplatePicker restyle, DEC-8-13 (§0.4 BC-13), the display-only artwork carousel with 'Arm this track', the 'No track' radio and the 'Expand artwork' Sheet (DEC-8-04 and DEC-8-10, §0.4 BC-15 and BC-14), the `FX_DECRYPT_LABELS` import, deleting `tests/live-extraction.spec.ts`, and the SKILL.md step 5 replacement | Full restyle | §8.10 B-series |
| **8C: Air** | `useWhipTruth` + `tests/whip-truth.spec.ts`; the go-live HoldButton + ConfirmDialog; the program keyline; `twitch.stop` registration, with the §6.7 stalled chyron and cue warning chyron verified end to end; the `cueSince`/`cueUnconfirmed` publishes and the cue-failure chyron (DEC-8-06, §0.4 BC-7); `broadcast.setLeaveHandler`/`leave` wiring and the ScriptTemplatePicker link guards; the Stop confirm (DEC-8-14, §0.4 BC-11); end-to-end ON AIR title/favicon checks | ON AIR states only | §8.10 C-series |

8B builds on 8A, and 8C on 8B; branching, stacking and merge order follow §14.12 and §1.4. Each PR re-runs the §1.6 admin-testing flow.

#### 8.5.2 Extraction map (PR 8A), with every range in `DirectorPlayer.tsx`

Move each range **verbatim** (cut and paste, then fix imports). The only edits allowed are E1–E12 in §8.5.4.

| Lines | Content | 8A destination (legacy markup where JSX) | Final home (8B/8C) |
|---|---|---|---|
| 1–25 | imports | split across the new files | same |
| 27 | `export const DIRECTOR_MODEL = 'minimax/h3-max/director'` | `director/constants.ts`. DirectorPlayer.tsx keeps `export { DIRECTOR_MODEL } from './director/constants'` | same |
| 29–30 | `DEFAULT_PROMPT` | `constants.ts` | same |
| 32–51 | `DirectorSession` type, `DirectorMessage` | `useDirectorSession.ts` | same |
| 53–60 | `CONNECT_STEPS` | `constants.ts` (exported) | read by ConnectPlate |
| 62–67 | `DirectionStatus`, `RoutedDirection` | `constants.ts` (exported) | 8B adds optional `reason?: string` and `atPlayback?: number` |
| 69–79 | `pickRecorderMimeType` (`:69-74`); `formatBytes` (`:76-79`) is already `bytes(n)` from `lib/format.ts` (M2, §5.20.4) | `constants.ts` (`pickRecorderMimeType` only) | same (`bytes(n)` is the only byte formatter for 'REC …' and '… uploaded') |
| 81–84 | `DirectorPlayerProps` | DirectorPlayer.tsx | same |
| 86–126 | component head, `convexEnabled`, 29 refs | `useDirectorSession(persistence)` | same |
| 128–157 | 27 `useState`s | hook, except `log` (133), which becomes eventLog (E1), and `recordedBytes` (136), which moves to the store (E6) | same |
| 148–152 | `connectStep`, `pingMs`, `bufferDepth`, `genEstimate`, `sessionAllowance` | `connectStep` and `sessionAllowance` stay state. `pingMs`, `bufferDepth` and `genEstimate` become fields of `telemetryRef` (E3, E4) | same |
| 158–161 | `pingTimerRef`, `lastPingAtRef`, `liveStartedAtRef`, `elapsedSeconds` | hook. `elapsedSeconds` is **deleted**, and `liveStartedAtRef` becomes `telemetryRef.current.liveStartedAt` (E5) | same |
| 163–171 | persistence `noop` wiring | hook | same |
| 173–175 | `appendLog` | hook: `appendLog = useCallback((line: string) => log.push(line), [log])` (E1) | same |
| 177–265 | `primeMusic`, `attachOutputStream`, re-attach effect (251–256), audio unmount cleanup (258–265) | hook, verbatim | same |
| 267–527 | `persist`, recorder, clip recorder, `uploadClipSegment`, `rotateClip`, `flushClip` | hook, verbatim, plus store publishing in `startRecorder` and `stopRecorder` (E6) | same |
| 529–648 | `handleData` | hook, verbatim except the `pong` branch (E3) and the `chunk` branch (E4) | 8B: `prompt_rejected` also records `reason` on the direction row; `prompt_applied`/`configured` record `atPlayback`; the `chunk` branch writes `playbackSeconds` to `telemetryRef` and notifies (§8.5.3) |
| 650–742 | `sendPrompt`, `sendScript` | hook, verbatim | same |
| 744–843 | `captureFrame`, `remixFrame`, `generateSheet` | hook, verbatim | 8B: each `catch` also sets `frameToolError` |
| 845–858 | `sendChatDirection` | hook, verbatim | same |
| 860–906 | `disconnect`, `disconnectRef` | hook, verbatim except `:888-894` (E3–E5, E8) | same |
| 908–1014 | `connect` | hook, verbatim except 911 (E2), 923–924 (E5) and `onMedia` 961–974 (E5, E8) | 8B: sets the `premise` snapshot and `connectStartedAt` |
| 1016–1032 | ping interval | hook. The body keeps `lastPingAtRef.current = Date.now()` and `send({type:'ping', ts})`. Lines 1024–1026 are removed (E5). The interval stays **1000 ms**; the comment at 1016 changes to "Ping every 1 s" | same |
| 1034–1043 | unmount effect | hook, verbatim, plus E8's `broadcast.reset()` | same |
| 1045–1046 | `live`, `busy` | hook return | same |
| 1049 | outer `<div>` | DirectorPlayer | `<section className="lc-root">` |
| 1050–1079 | card header: h3, model line, state pill, REC pill | `MonitorLabelStrip` | strip: h2 + model + state word (`data-state`). REC moves to the TallyBar |
| 1081 | `fal-card-content` wrapper | DirectorPlayer | removed |
| 1082–1113 | stage box, DitherGradient, `<video>`, connect overlay, text states | `DirectorStage` | DirectorStage (bezel, screen, plates, slates) |
| 1114–1144 | mute, 'Capture frame', 'Remix frame' overlay buttons | `DirectorStage` (same position) | TransportBar slots 4–6 |
| 1145–1154 | HUD pill: Live, Ping, buf, gen | `DirectorStage` → leaf `<HudReadouts telemetryRef>` using `useSecondClock` (E5) | TelemetryStrip cells 1, 4, 5, 6 |
| 1159–1167 | 'Session allowance' line | `TelemetryStrip` renders the legacy block 1159–1192 with a leaf `<AllowanceText>` (E5) | TelemetryStrip cells 3 (ladder) and 8 (text) |
| 1168–1187 | direction list | inside `TelemetryStrip`'s legacy block as `<DirectionQueue>` | Rundown › Direction › QUEUE |
| 1188–1190 | 'Continuity frame set:' line | inside `TelemetryStrip`'s legacy block as `<ContinuityLine>` | SessionSheet › TalentCard |
| 1194–1210 | settings `<details>` | `SessionSheet` export `SessionSettings` | SessionSheet |
| 1212–1239 | prompt label and textarea, 'Applied:', live asset inputs | `Rundown` export `DirectionComposer` | Rundown › Direction |
| 1241–1258 | Start/Stop | `TransportBar` | TransportBar slot 2 |
| 1259–1266 | 'Send direction' | `TransportBar` (same row) | DirectionComposer send row |
| 1267–1284 | 'Record' and 'Stop & save recording' | `TransportBar` | slot 3 |
| 1285–1286 | 'Uploading…' and '{size} uploaded' | `TransportBar` | TelemetryStrip cell 7 |
| 1289 | `<TwitchBroadcast live getStream onLog>` | `TwitchBroadcast` stays in place; its state comes from `useTwitchBroadcast` called in DirectorPlayer | the panel goes to SessionSheet; `GoLiveControl` goes to transport slot 8 |
| 1291–1293 | error box | `AlertTray` (legacy markup) | AlertTray |
| 1295–1299 | log `<pre>` | `Rundown` export `EventConsole` (legacy `<pre>`: newest-first non-debug entries, 50 at most, format `` `${new Date(t).toLocaleTimeString()}  ${text}` ``) | Rundown › Events |
| 1303–1320 | `<ScriptEditor …>` + inline `onTemplateApplied` | `Dock` renders `<ScriptEditor>`. `onTemplateApplied` moves into the hook as a `useCallback` with an identical body (E7) | Dock › Script |
| 1322–1326 | `<ChatSteerer …>` + inline `onFrameCommand` | `Rundown` renders `<ChatSteerer>`. `onFrameCommand` moves into the hook (E7) | Rundown › Chat |
| 1328–1339 | `<TrackManager …>` + inline callbacks | `Dock` renders `<TrackManager>`. `onUseForSession`, `onUseLive` (= `setLiveAudioUrl`) and `onUseForMix` move into the hook (E7). **`onUseForMix` keeps its body order exactly: `primeMusic(config)` → `setMusicConfig(config)` → `appendLog(…)`** | Dock › Audio |

In 8A, DirectorPlayer's return composes these pieces **in the original DOM order** inside the original wrappers (`<div>` › `.fal-card` › header + `.fal-card-content` › …, then ScriptEditor, ChatSteerer, TrackManager). That is why the DOM is byte-identical.

#### 8.5.3 Where state lives after 8A

| Owner | State and refs |
|---|---|
| `useDirectorSession` | All 29 refs from `:88-126`, plus `pingTimerRef` and `lastPingAtRef` (`:158-159`) and `clipUnsupportedLoggedRef` (`:384`). `liveStartedAtRef` (`:160`) becomes `telemetryRef`. All session state: `state`, `error`, `muted`, `prompt`, `activePrompt`, `recording`, `uploading`, `lastUpload`, `settings`, `scriptBeats`, `sendScriptOnConnect`, `playbackSeconds`, `liveEndImage`, `liveAudioUrl`, `musicConfig`, `connectStep`, `sessionAllowance`, `directions`, `capturing`, `capturedFrame`, `remixing`, `generatingSheet`. `telemetryRef: { liveStartedAt, connectStartedAt, pingMs, bufferDepth, genEstimate, playbackSeconds }` (a mutable ref, never state; `playbackSeconds` joins it in 8B). `hadFirstFrameRef` (8B): `false` at `connect()`, `true` in the first-frame callback (§8.6.2). `log` (one `createEventLog()` per hook instance, via `useState(() => createEventLog())`) |
| Broadcast store (§7.17) | `director`, `firstFrame`, `rec { active, startedAt, bytes }`, `air`, `airSince`, `stalledSince`, `cueSince`, `cueUnconfirmed`, `whip`. DirectorPlayer reads `firstFrame` with `useBroadcast(s => s.firstFrame)` and passes it as a prop |
| `useTwitchBroadcast` (called in DirectorPlayer) | `auth`, `manualKey`, `exchanging`, `connectError`, `broadcasting`, `starting`, `whipRef`, `opRef`, `liveRef`, plus `whip` state (8C; mirrors `whipRef` for `useWhipTruth`) |
| DirectorPlayer (layout only, 8B) | `rundownTab: 'direction' \| 'chat' \| 'events'`, `rundownOpen: boolean` (1024–1279; mirrored as `data-rundown-open` on `.lc-root`), `mobilePane`, `dockTab: 'script' \| 'audio'`, `steer` (lifted from ChatSteerer for the palette), `scriptSource: string \| null` |
| Leaves (1 Hz via `useSecondClock`) | `LiveClock`, `AllowanceCell`, `PingCell`, `BufCell`, `GenCell`, `AirClock`. Each reads `telemetryRef.current` or the store on every tick, and each is `React.memo` with stable props |
| Leaves (10 Hz via `dashboard/lib/motion/ticker.ts`) | the ConnectPlate `T+` readout only, and only while it is mounted |
| Local UI state | Dock collapsed (`html[data-dock]` + `wzrd:dock`); DirectionComposer `history` (in memory, 20 at most) and the tray open state; ChatSteerer, TrackManager, ScriptEditor and AssetUrlInput keep their existing local state |

After 8A, no timer, `ping` or `pong` changes React state; the root re-renders only on real events: state transitions, directions, captures, recordings starting and stopping, settings edits, and (until 8B) `chunk` messages, which still call `setPlaybackSeconds` (E4).

**`playbackSeconds` (8B).** The `chunk` branch writes `telemetryRef.current.playbackSeconds` instead of calling `setPlaybackSeconds`, then notifies subscribers. The hook exposes `subscribePlayback(cb): () => void` and `getPlaybackSeconds(): number | null`. Only `Dock` reads it, with `useSyncExternalStore(s.subscribePlayback, s.getPlaybackSeconds)`, and passes it to `<ScriptEditor playbackSeconds>` (props contract unchanged) for the playhead and the `beat @{X}s playing` readout. DirectorPlayer then commits on no `chunk` message.

#### 8.5.4 8A allowed edits and no-behaviour-change proof

**Allowed edits (anything else in the moved code is a review failure; check with `git diff 845147c --color-moved=dimmed-zebra -- components` (from `dashboard/`)):**

| # | Edit |
|---|---|
| E1 | `appendLog` pushes to `log` (eventLog.ts) instead of `setLog`. Its identity is stable (`[log]` deps) |
| E2 | `setLog([])` at `:911` becomes `log.clear()` |
| E3 | `pong` (`:541-546`) writes `telemetryRef.current.pingMs = Math.max(0, Date.now() - base)` in place of `setPingMs`. The echo `appendLog` at `:539` is unchanged (the eventLog levels it `debug`). `disconnect` sets `pingMs = null` in place of `setPingMs(null)` |
| E4 | In the `chunk` branch (`:642-643`), `setBufferDepth`/`setGenEstimate` become writes to `telemetryRef.current.bufferDepth` and `telemetryRef.current.genEstimate`. `setPlaybackSeconds` and `setConnectStep` stay as they are. `disconnect` nulls both |
| E5 | `liveStartedAtRef.current = x` becomes `telemetryRef.current.liveStartedAt = x` (`:891`, `:924`, `:968`). `setElapsedSeconds(…)` is deleted (`:890`, `:923`, `:1025`). The HUD and allowance leaves compute `elapsed = (now − liveStartedAt) / 1000` from `useSecondClock()`. In 8A the HUD keeps the legacy text `` ` · ${elapsed.toFixed(0)}s` `` |
| E6 | `setRecordedBytes` is replaced by store publishing. `startRecorder` (`:364-381`): `broadcast.publish({ rec: { active: true, startedAt: Date.now(), bytes: 0 } })`. `ondataavailable` (`:374`): increment a `recBytesRef` and `publish({ rec: { …, bytes } })`. `stopRecorder`'s `onstop` (`:288`): `publish({ rec: { active: false, bytes: 0 } })`. The REC pill reads `useBroadcast(s => s.rec.bytes)`. `setRecording` stays |
| E7 | Every inline callback passed to an extracted child component (the list below) becomes a `useCallback` in the hook, with an identical body and statement order, and is passed to the child as a prop. Local DOM handlers such as the textarea `onChange` at `:1218` stay inline. The list is `:1117` (mute), `:1125`, `:1135`, `:1260`, `:1275-1278` (`stopAndSaveRecording`), `:1289` (`getStream`), `:1311-1319`, `:1325` and `:1330-1338` |
| E8 | Store publishing (§8.5.6), including `broadcast.reset()` in the unmount effect, plus the first-frame gate armed in `onMedia` right after `videoRef.current.srcObject = output` (`:964`) |
| E9 | `DIRECTOR_MODEL` re-export (see the `:27` row) |
| E10 | TwitchBroadcast `:42-162` moves verbatim into `useTwitchBroadcast({ live, getStream, onLog })`, which returns every value the JSX reads |
| E11 | Each extracted presentational component is wrapped in `React.memo` |
| E12 | Dev-only render counters: `if (process.env.NODE_ENV === 'development') bump('DirectorPlayer')` writes `window.__wzrd.renders[name]++` (the `window.__wzrd` typing is `types/wzrd.d.ts`, §6.2.11) |

**Proof steps (paste all output into the 8A PR under Verification):**

**Steps 1–4 (parity).** Run `tests/live-extraction.spec.ts` (created in 1A; 8A changes nothing in it) per §14.12 step 7: parent and 8A snapshots, the DOM diff and the pixel comparison. The spec normalises times, the premise suffix ` qa-parity` and the stubbed SDK error (it installs the `**/api/fal/**` 401 stub, §8.10 intro).

5. Run the §1.6 flow. The per-route console matches the §1.6 allowed table exactly.
6. `npm run lint`, `npm run typecheck` and `npm run qa:build` exit 0, and the route sizes do not grow. The parent worktree is §14.12 step 7.1's `../pre-8a`, created from the repository root, so from `dashboard/` it is `../../pre-8a`; step 7.2 builds it with `npm run qa:build`. From `dashboard/`:
   ```bash
   node scripts/checks/route-sizes.mjs --milestone 6a --compare ../../pre-8a/dashboard/.qa/build.log .qa/build.log
   ```
   It exits 0.
7. Grep gates, all printing `0`:
   ```bash
   grep -rnE "set(PingMs|BufferDepth|GenEstimate|ElapsedSeconds|RecordedBytes|Log)\(" components | wc -l
   grep -rn "setInterval(" components/director components/DirectorPlayer.tsx | grep -v "useDirectorSession.ts" | wc -l
   ```
   `grep -c "setInterval(" components/director/useDirectorSession.ts` prints `1` (the ping).
8. **Human operator only; Devin never runs a Director session (§1.8 item 3).** Devin lists this step under "Deferred / blocked" as "not run (paid)". The operator records a 30 s session, checks that 'REC … MB' grows and that 'Stop & save recording' uploads, and reads `window.__wzrd.renders.DirectorPlayer` (E12) before and after 10 s of live playback: ping, pong and the clock cause zero DirectorPlayer commits, and the count grows by no more than the number of `chunk` and `prompt_*` messages logged in that window. The automated commit counts are §15.6's perf.spec tests.

#### 8.5.5 Final tree (after 8B/8C)

```text
app/admin/(live)/page.tsx ('use client'; moved in 4D)
├─ <h1 className="sr-only">Live Control</h1>           (landed in 4B)
└─ DirectorPanel                               (unchanged: persistence iff useConvexEnabled())
   └─ DirectorPlayer({ persistence? })
      ├─ s  = useDirectorSession(persistence)
      ├─ tw = useTwitchBroadcast({ live: s.live, getStream: s.getStream, onLog: s.appendLog })   (8C: also registers twitch.stop)
      ├─ useWhipTruth(tw.whip, tw.onNegotiationFailed)                (8C)
      ├─ useRegisterCommand × 15                                      (§8.5.12)
      ├─ useEffect: broadcast.setLeaveHandler(s.disconnect); cleared on unmount   (8C)
      └─ <section aria-label="Director" data-density="compact" data-aspect={s.settings.aspectRatio}
                  data-rundown-open={rundownOpen || undefined} className="lc-root">
         ├─ <div className="lc-program">                              (display: contents below 1024)
         │  ├─ <div className="lc-monitor">                             (sticky below 1024)
         │  │  ├─ MonitorLabelStrip  { state, firstFrame, rundownOpen, onToggleRundown }
         │  │  └─ DirectorStage      { videoRef, muted, phase, connectStep, diagnostic, telemetryRef,
         │  │                           premise: s.prompt, aspect, resolution, firstFrame, air, onCancel: s.disconnect }
         │  │       bezel: TallyBar · screen: DitherGradient · <video> · SymbolRaster|BrandImage
         │  │              · StandbySlate|ConnectPlate|StoppingPlate|FailedSlate · SelectionBrackets · lip tag
         │  ├─ MobileTabs (.lc-mobile-tabs; below 1024 only) { value: mobilePane, onChange, audio: convexEnabled }
         │  └─ <div className="lc-unit">                                (position: relative; no border, no overflow)
         │     ├─ <div className="lc-unit-frame">                       (rounded-md sq overflow-hidden)
         │     │  ├─ TransportBar     (§8.5.7)
         │     │  └─ TelemetryStrip   { telemetryRef, sessionAllowance, uploading, lastUpload }
         │     └─ AlertTray        { error, onViewEvents, onDismiss }   (sibling of the frame, §8.4.6)
         ├─ SessionSheet  { settings, setSettings, live, busy, scriptPlanned, onGenerateSheet, generatingSheet,
         │                  capturedFrame, premise, preflight, twitchPanel: <TwitchBroadcast view={tw} /> }
         ├─ Dock          { tab, onTab, live, beats, setBeats, sendOnConnect, setSendOnConnect, sendScript,
         │                  subscribePlayback, getPlaybackSeconds, directions, onTemplateApplied, scriptSource,
         │                  audio: <TrackManager …/> }
         └─ Rundown       { tab, onTab, open, onClose, composer props, directions, activePrompt,
                            chat: <ChatSteerer live onDirection onFrameCommand steer onSteerChange />, log }
```

**Primitive usage (from §7.3–§7.5 and §12.3; do not invent parallel components):**

| Region | Primitives |
|---|---|
| Label strip | `<IconButton icon={PanelRight} label="Rundown" pressed={open}>` (1024–1279 only; `aria-controls="lc-rundown"`, `aria-expanded`) |
| Monitor | `TallyBar`, `SelectionBrackets`, `SymbolRaster`, `BrandImage`, `PixelFace`, `StageTrack` (its `decryptActive` runs `DecryptedText`; no separate wrapper), `Kbd`, `Button`, `BayerSpinner` |
| Transport | `Button` (primary/secondary/danger), `IconButton`, `HoldButton`, `ConfirmDialog` |
| Telemetry | `LedLadder` (20-segment and 4-segment), `Readout`, `ScrollFade` |
| Session | `Led`, `Chip`, `Badge`, `Field`, `Input`, `Select`, `Checkbox`, `Button`; the native `<details>` stays |
| Rundown | `Tabs` (`keepMounted`), `Textarea` (`autoGrow`, `maxRows={8}`), `Chip`, `Button`, `Kbd`, `StreamList`, `Led`, `SegmentedControl`, `Checkbox`, `Badge` |
| Dock | `Tabs` (`keepMounted`), `IconButton`, `Checkbox`, `Slider` (native range), `Button`, `Sheet` ('Expand artwork'), `MorphSlider` (§12.4.1), `Skeleton`, `NotConfigured`/`AuthRequired` (`size="panel"`) |

#### 8.5.6 Contracts: hook, log, first frame, store publishing, WHIP truth

**`useDirectorSession(persistence?: DirectorPersistence): DirectorSessionApi`.** Members marked (8B) are additive in 8B. Everything else is exactly what the 845147c JSX reads.

```ts
export interface Telemetry { liveStartedAt: number | null; connectStartedAt: number | null
  pingMs: number | null; bufferDepth: number | null; genEstimate: number | null
  playbackSeconds?: number | null }                                              // playbackSeconds (8B)
export interface DirectorSessionApi {
  videoRef: React.RefObject<HTMLVideoElement>; telemetryRef: React.MutableRefObject<Telemetry>; log: EventLog
  state: RealtimeState | 'idle' | 'closing'; live: boolean; busy: boolean
  error: string | null; dismissError(): void                                   // dismissError (8B)
  muted: boolean; toggleMuted(): void
  prompt: string; setPrompt(v: string): void; premise: string | null            // premise (8B)
  activePrompt: string | null; directions: RoutedDirection[]
  settings: DirectorSettings; setSettings: React.Dispatch<React.SetStateAction<DirectorSettings>>
  scriptBeats: ScriptBeat[]; setScriptBeats: React.Dispatch<React.SetStateAction<ScriptBeat[]>>
  sendScriptOnConnect: boolean; setSendScriptOnConnect(v: boolean): void
  playbackSeconds: number | null; connectStep: number; sessionAllowance: number | null  // playbackSeconds: 8A only
  subscribePlayback(cb: () => void): () => void; getPlaybackSeconds(): number | null   // (8B) replace playbackSeconds
  hadFirstFrameRef: React.MutableRefObject<boolean>                              // (8B) §8.6.2
  diagnostic: string | null                                                     // (8B)
  liveEndImage: string; setLiveEndImage(v: string): void; liveAudioUrl: string; setLiveAudioUrl(v: string): void
  recording: boolean; uploading: boolean; lastUpload: string | null
  capturing: boolean; capturedFrame: string | null; remixing: boolean; generatingSheet: boolean
  frameToolError: { tool: 'capture' | 'remix' | 'sheet'; at: number } | null    // (8B)
  connect(): Promise<void>; disconnect(): Promise<void>
  sendPrompt(text: string, configure: boolean): void
  sendDirection(): boolean                                                      // (8B) composer path, §8.5.9
  sendScript(beats: ScriptBeat[], mode: 'replace' | 'append'): void
  startRecorder(): void; stopAndSaveRecording(): Promise<void>                  // body = :1275-1278 verbatim
  captureFrame(source: string): Promise<void>; remixFrame(directionText?: string): Promise<void>
  generateSheet(): Promise<void>; sendChatDirection(text: string, author: string): void
  onFrameCommand(author: string): void; onTemplateApplied(meta: TemplateAppliedMeta): void
  onUseForSession(url: string): void; onUseLive(url: string): void; onUseForMix(config: MusicConfig): void
  getStream(): MediaStream | null; appendLog(line: string): void
}
```

- `diagnostic` (8B): `onDiagnostic` sets `diagnostic = formatDiagnostic(d)` (`components/director/diagnostic.ts`, pure). Warning and failure events are still logged exactly as at `:1007`. `connect()` and `disconnect()` reset it to `null`. `formatDiagnostic`:
  - Progress events give `d.phase`, then ` · {key} {value}` for each present detail key in this allowlist, in this order: `source`, `status`, `state`, `usesTurn`, `host`, `srflx`, `relay`. Every other key is dropped; `local` and `remote` (the WMA `network-path` candidate endpoints, `node_modules/@fal-ai/client/src/realtime/wma.js:966-975`) are never shown.
  - Warning and failure events give `` `${d.kind}: ${d.message}` ``.
  - In the result, every IPv4 address (`/\b\d{1,3}(\.\d{1,3}){3}\b/g`) and every IPv6 address (a run of hex digits and colons, with an optional `%zone`, that contains `::` or at least 7 colons) is replaced with `[addr]`, so the operator's public IP never reaches the monitor, screen captures or PR screenshots.
- `premise` (8B): `connect()` sets `premise = prompt` right after `setState('opening')`. `connect` still sends `prompt` in `configure` (`:1013`). **Composer lifecycle (DEC-8-01, §0.4 BC-10):**
  - on the first transition to `'live'` of an attempt: `setPrompt('')`;
  - after `sendDirection()` returns true: push the sent text to history, then `setPrompt('')`;
  - when the state returns to `idle`/`failed`/`closed` from `live` (or from `closing` after `live`): push a non-empty draft to history, then `setPrompt(premise ?? DEFAULT_PROMPT)`. After a failure from `opening` (no `live` in the attempt), push nothing; still `setPrompt(premise ?? DEFAULT_PROMPT)`, which leaves the premise in place.

  This fixes stale-premise re-sends (B8) while keeping the idle textarea prefilled and editable (admin-testing). To reverse it, delete these three effects.

**`eventLog.ts`.**

```ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export interface LogEntry { id: number; t: number; level: LogLevel; text: string }
export const LOG_CAP = 500                        // non-debug ring (info, warn, error)
export const DEBUG_CAP = 100                      // debug ring
export interface EventLog {
  push(text: string, level?: LogLevel): void      // level defaults to levelOf(text); a debug entry goes to the debug ring
                                                  // (drops its oldest beyond 100), any other entry to the non-debug ring
                                                  // (drops its oldest beyond 500), so debug noise never evicts info, warn or error
  clear(): void                                   // empties both rings
  subscribe(cb: () => void): () => void           // notifications batched per microtask
  getAll(): readonly LogEntry[]                   // both rings merged by id, newest first; new identity only on push/clear
  getVisible(): readonly LogEntry[]               // the non-debug ring, newest first; identity changes only when a
                                                  // non-debug entry arrives or on clear
  getAlertSeq(): number                           // +1 per warn/error entry
}
export function createEventLog(): EventLog
export function levelOf(text: string): LogLevel
```

`levelOf` rules are tested in order, and the first match wins. It makes no console calls.

| Level | Regex on the line | Sources (845147c) |
|---|---|---|
| `debug` | `^(pong\|ping)( v\d+)?$` and `^[a-z_]*(chunk\|segment)[a-z_]*( v\d+)?$` | the `:539` echo of `pong`/`chunk*` |
| `error` | `^(error\|failure\|convex\|upload\|cleanup\|close\|clip\|clip capture\|frame capture\|frame remix\|character sheet\|music mixer unavailable): ` and `^prompt_rejected v\d+: ` | `:208`, `:245`, `:273`, `:334`, `:342`, `:407`, `:448`, `:499`, `:601`, `:770`, `:808`, `:839`, `:880`, `:946`, `:990`, `:1007` (failure) |
| `warn` | `^(warning: \|stream_exhausted: \|music: \|Recording captured but NEXT_PUBLIC_CONVEX_URL\|Clip capture unsupported\|Twitch broadcast stopped \(session ended\))` | `:206`, `:298`, `:392`, `:632`, `:1007` (warning), `TwitchBroadcast.tsx:102` |
| `info` | everything else | |

The same rules in runnable form (in the table, `\|` is Markdown escaping for `|`):

```ts
const LEVEL_RULES: ReadonlyArray<[LogLevel, RegExp]> = [
  ['debug', /^(pong|ping)( v\d+)?$/],
  ['debug', /^[a-z_]*(chunk|segment)[a-z_]*( v\d+)?$/],
  ['error', /^(error|failure|convex|upload|cleanup|close|clip|clip capture|frame capture|frame remix|character sheet|music mixer unavailable): /],
  ['error', /^prompt_rejected v\d+: /],
  ['warn', /^(warning: |stream_exhausted: |music: |Recording captured but NEXT_PUBLIC_CONVEX_URL|Clip capture unsupported|Twitch broadcast stopped \(session ended\))/],
]
export function levelOf(text: string): LogLevel {
  for (const [level, re] of LEVEL_RULES) if (re.test(text)) return level
  return 'info'
}
```

**First-frame gate (`firstFrame.ts`).** `armFirstFrame(video: HTMLVideoElement, onFirst: () => void): () => void`.
- It calls `onFirst` once, from `video.requestVideoFrameCallback` when that method exists. Otherwise it calls `onFirst` from the first `loadeddata` or `playing` event.
- It returns a cleanup that cancels the callback and removes the listeners.
- The hook arms it in `onMedia` and guards it with the connect attempt: `if (attempt === connectAttemptRef.current)`. It cleans up in `disconnect` and on unmount. From 8B the callback also sets `hadFirstFrameRef.current = true` (reset to `false` in `connect()`, §8.6.2).
- The re-attach effect (`:251-256`) does **not** re-arm it.

**Broadcast store publishing (all in 8A except `air`, which is 8C).** This table is the single list of Live Control's air publishers; the `air` state table itself is §6.7's.

| Event | Location (845147c) | Publisher | `broadcast.publish(…)` |
|---|---|---|---|
| Any `state` change (`:863`, `:904`, `:925`, `:977`) | one `useEffect(() => broadcast.publish({ director: state }), [state])` | hook | `{ director: state }` |
| Connect starts | with `setState('opening')` (`:925`) | hook | `{ firstFrame: false }` |
| First decoded frame | `armFirstFrame` callback | hook | `{ firstFrame: true }`, then `announce('Preview is up', 'polite')` |
| Disconnect | with `srcObject = null` (`:888`) | hook | `{ firstFrame: false }` |
| Recorder start, data, stop | `:364-381`, `:371-375`, `:283-290` | hook | `rec` (E6) |
| Unmount | `:1034-1043` | hook (DirectorPlayer's unmount) | `broadcast.reset()`, so leaving the route releases `data-lock` and no `air`, `airSince` or `whip` value outlives Live Control |
| Go live committed (8C) | `startBroadcast`, before `startWhipBroadcast` (`TwitchBroadcast.tsx:143-145`) | useTwitchBroadcast | `{ air: 'cue' }` |
| Negotiation threw or was superseded (8C) | `TwitchBroadcast.tsx:148-151`, `:155-156` | useTwitchBroadcast | `{ air: 'off' }` |
| WHIP installed (8C) | `TwitchBroadcast.tsx:152-153`: `setWhip(session)` hands over to `useWhipTruth` | useWhipTruth, when its `session` becomes non-null while `air === 'cue'` | `{ cueSince: Date.now() }`: the start of the 10 000 ms window and of the lamp's `CUE {MM:SS}` count (§6.7) |
| Truth gate true, stall, recovery, WHIP stats (8C) | `useWhipTruth` | useWhipTruth | `on`, `stalled`, recovery `on`, `whip` (below) |
| Cue not confirmed (8C): `connectionState === 'disconnected'`, or 10 000 ms after `cueSince` with no truth gate, while `air === 'cue'` | `useWhipTruth` | useWhipTruth | `{ cueUnconfirmed: true }`, once per `cueSince`. `air` stays `cue` and nothing is torn down. BroadcastProvider derives the cue warning chyron 'Twitch ingest not confirmed' from it (§6.7); §8 never pushes that chyron |
| Negotiation failed (8C): `connectionState === 'failed'` while `air === 'cue'` | `onNegotiationFailed` | useWhipTruth, then useTwitchBroadcast | useWhipTruth publishes `{ air: 'off', airSince: undefined, whip: undefined }`. useTwitchBroadcast then tears the already-dead WHIP session down without publishing `offair` (the `:130-133` teardown plus `setWhip(null)`) and pushes the cue-failure chyron: `chyron.push({ tone: 'error', title: "Couldn't start the Twitch broadcast", body: 'Twitch ingest never received media. Try again.' })` |
| Stop broadcast / session end (8C), from `on`, `stalled` or `cue` (confirmed or not) | `TwitchBroadcast.tsx:129-135`, `:95-105` (only inside its `if (whipRef.current)` branch, so mount never publishes). 'End broadcast' on the stalled or the cue warning chyron runs the same `stopBroadcast` through `twitch.stop` (§8.5.12) | useTwitchBroadcast | `{ air: 'offair', whip: undefined, stalledSince: undefined }` and `setWhip(null)`; after 3000 ms, if `air` is still `offair`, `{ air: 'off', airSince: undefined }` (the timer is cleared on unmount) |

`publish` deletes `cueSince` and `cueUnconfirmed` whenever the merged `air` is not `cue` (§7.17), so no row above clears them.

**Store API used here.** `broadcast.setLeaveHandler(fn)` and `broadcast.leave()` are §7.17's (used from 8C): DirectorPlayer registers `s.disconnect` and clears it with `null` on unmount. The dev `window.__wzrd.broadcast = { publish, get }` exists from 3A (§7.17).

**`useWhipTruth(session: WhipSession | null, onNegotiationFailed: () => void): void`** (8C; it wraps `dashboard/lib/twitchWhip.ts` and never modifies it). §8.5.6 owns this algorithm; §6.7 keeps only the `air` state table. When `session` becomes non-null while `air === 'cue'`, it first publishes `{ cueSince: Date.now() }`: the 10 000 ms window starts when the WHIP session arrives, not at the commit. Then it polls every 1000 ms. On each poll:
1. `stats = await session.pc.getStats()`. Sum `bytesSent` over every `outbound-rtp` report. Take `fps = framesPerSecond` from the video `outbound-rtp`. Take `rttMs = round(roundTripTime × 1000)` from `remote-inbound-rtp`; fall back to the nominated, succeeded `candidate-pair`'s `currentRoundTripTime`. Compute `kbps = round((bytes − prevBytes) × 8 / (Δt ms))`.
2. **Truth gate:** `pc.connectionState === 'connected' && bytes > prevBytes`. When it becomes true from `cue` or `stalled`, publish `{ air: 'on', airSince: airSince ?? Date.now(), stalledSince: undefined }`.
3. **Stall, cue and negotiation failure** (inside `nextAir`).
   - While `air ∈ {on, stalled}`: `connectionState ∈ {failed, disconnected}`, or `bytes` flat for 4 consecutive polls, gives `stalled` (publish `{ air: 'stalled', stalledSince: Date.now() }` on entry); when the gate is true again, `on` (keep `airSince`).
   - While `air === 'cue'`: `connectionState === 'failed'` gives `off`. It is a terminal WebRTC failure, and the session is already dead: publish `{ air: 'off', airSince: undefined, whip: undefined }` and call `onNegotiationFailed()`.
   - While `air === 'cue'`: `connectionState === 'disconnected'`, or no truth gate within 10 000 ms of `cueSince` (`now − cueSince >= 10000`), **keeps `cue`** and sets `cueUnconfirmed` (publish `{ cueUnconfirmed: true }` once per `cueSince`). Nothing is torn down and `onNegotiationFailed()` is not called. The lamp reads `CUE {MM:SS}`, and BroadcastProvider shows the warning chyron 'Twitch ingest not confirmed' with the actions 'End broadcast' and 'Dismiss' (§6.7). A later truth gate still gives `on`; the operator can end the push with 'End broadcast' or the transport's 'Stop broadcast' (DEC-8-06, §0.4 BC-7).
   - A `cue` session never becomes `stalled`, and no timeout ever tears a WHIP session down.
4. Publish `{ whip: { kbps, fps, rttMs } }` only when a value changes.
5. Also listen to `connectionstatechange` and evaluate step 3 immediately.
6. When `session` becomes `null`: clear the interval, the listener and the op counter. useWhipTruth never publishes on mount, on unmount or on `null`; its only publish outside a poll is the `cueSince` of an arriving session.
7. Ignore late `getStats()` results with an op counter. Swallow errors. **Zero console output.**

Implement steps 2–3 as an exported pure reducer, `nextAir(prev: { air; lastBytes; flatPolls; airSince?; cueSince?; cueUnconfirmed? }, sample: { connectionState; bytes; now }) → next`, where `cueSince` is the time the session arrived while `air === 'cue'` and `cueUnconfirmed` stays `true` from the first warning until `air` leaves `cue`, so that `dashboard/tests/whip-truth.spec.ts` can check the gate without a browser (C3). The hook publishes a field only when `nextAir` changes it.

**BroadcastProvider** (§6.7, §6.12; lands in 4B) owns the ON AIR side effects: the title and favicon swap and restore, the announcements, the house lights, the stalled chyron ('Twitch ingest lost', action 'End broadcast') and its recovery, the cue warning chyron ('Twitch ingest not confirmed', action 'End broadcast', dismiss control 'Dismiss'; derived from `air === 'cue' && cueUnconfirmed === true`, pushed with `airAllow: true` so it floats under the air lock), the off-air message, `beforeunload` and the mouse-button guard. §8 adds only the publishers above and the `twitch.stop` command, and verifies the result end to end (C1, C2, C8).

#### 8.5.7 TransportBar: order and conditional rendering (mirrors 845147c exactly)

`live = state === 'live'` and `busy = state === 'opening' || state === 'closing'` (`:1045-1046`).

| Slot | Condition (verbatim logic) | Control | Pending / disabled | Title (preserved) |
|---|---|---|---|---|
| 2 | `!live && !busy` (`:1242`) | `<Button variant="primary" icon={Play}>Start Director</Button>`, onClick `connect` (DitherButton `color={215} variant="gradient"`, label on a bezel plate, §7.3) | none | none |
| 2 | otherwise | `<Button variant="secondary" icon={Square}>Stop</Button>`, onClick `requestStop` (below) | `pending={state === 'closing'}` with **no** `pendingLabel` (the label stays 'Stop'; a BayerSpinner replaces the icon; clicks are guarded). DEC-8-02 (§0.4 BC-11) fixes B12 | none |
| 3 | `live && !recording` (`:1267`) | `<Button variant="secondary" icon={CircleDot}>Record</Button>` (icon in `text-tally-rec`), onClick `startRecorder` | none | none |
| 3 | `recording` (`:1273`) | `<Button variant="secondary" icon={Upload}>Stop & save recording</Button>`, onClick `stopAndSaveRecording` | none | none |
| 4 | `live` (`:1114`) | `<Button variant="secondary" icon={Camera}>Capture frame</Button>`, onClick `() => captureFrame('admin')` | `pending={capturing}` `pendingLabel="Capturing…"` | "Snapshot this frame → becomes the next end frame + next session's first frame" |
| 5 | `live && capturedFrame` (`:1133`) | `<Button variant="secondary" icon={Sparkles}>Remix frame</Button>`, onClick `() => remixFrame()` | `pending={remixing}` `pendingLabel="Remixing…"` | 'Evolve the captured frame with nano-banana-2 (same character, new shot)' |
| 6 | `live` (`:1114`) | `<IconButton icon={muted ? VolumeX : Volume2} label={muted ? 'Unmute' : 'Mute'} />`, onClick `toggleMuted` | none | none |
| 8 | `tw.broadcasting` (`TwitchBroadcast.tsx:193`) | `<Button variant="danger" icon={Square}>Stop broadcast</Button>`, onClick `stopBroadcast` | none | none |
| 8 | otherwise | `<HoldButton holdMs={600} variant="secondary" label="Go live on Twitch" confirm={…}>` (Radio icon; hold-to-take, §0.4 BC-5; the confirm dialog is §8.6.5 step 2) | disabled when `!live \|\| !firstFrame \|\| !streamKeyReady \|\| starting`. Pending while `starting`, with label 'Negotiating…' (`:208`). DEC-8-03 (§0.4 BC-6) adds `!firstFrame` | `live ? 'Push the live Director output to Twitch ingest' : 'Start the Director session first'` (`:205`) |

- **`requestStop` (DEC-8-14, §0.4 BC-11, 8C).** While `air ∈ {on, stalled}`, 'Stop' and the palette's `director.stop` open `<ConfirmDialog title="Stop the Director?" body="Stopping ends the session and the Twitch broadcast." confirmLabel="Stop and end broadcast" cancelLabel="Keep running" destructive onConfirm={disconnect}>`. Otherwise they call `disconnect()` at once, so the §1.6 flows are unchanged. Before 8C (no `air` yet), `requestStop` is `disconnect`.
- **Stop mount guard (DEC-8-14, §0.4 BC-11).** The 'Stop' control ignores activations for 600 ms after it mounts and ignores `keydown` with `event.repeat`, so a double-click or a held Enter on 'Start Director' never cancels the connect it just started.
- **Icon-only slots** (container < 900 px): the visible label becomes `<span className="sr-only">`, **the same string** (and the same pending string). The accessible name is unchanged, so `getByRole('button', { name: 'Record' })` still resolves.
- **Tooltips:** a button that carries a preserved `title` never also gets a `<Tooltip>`.
- **8B success and error micro-states:**
  - Capture: success word 'Captured' for 900 ms.
  - Remix: success word 'Remixed'.
  - Error when `frameToolError.tool` matches: colour-only while `data-lock="air"` (it is within 24 px of the monitor; §6.12), otherwise the 3-frame jitter.

#### 8.5.8 Session sheet components

- **PreflightList.** `preflightRows()` is pure. Its input is `{ convexEnabled, channel: process.env.NEXT_PUBLIC_TWITCH_CHANNEL ?? '', clientIdPresent: Boolean(process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID), auth, manualKey, settings, wireBeats: beatsToWire(scriptBeats).length, sendScriptOnConnect }`. It makes **no network calls and no storage reads**; `auth` comes from `useTwitchBroadcast`. Rows (all copy is new):

| Label | LED tone and fix text |
|---|---|
| `Convex` | success "Recordings and clips save to Convex" · warning "Recordings download locally · set NEXT_PUBLIC_CONVEX_URL" |
| `Twitch channel` | success `#{channel}` · warning "Chat steering needs NEXT_PUBLIC_TWITCH_CHANNEL" |
| `Stream key` | success "Stored for @{login}" · success "Pasted for this page" · off "Not connected · see Twitch below" (and, when `!clientIdPresent`, off "Paste one below · NEXT_PUBLIC_TWITCH_CLIENT_ID is not set") |
| `Character sheet` | success "Set · remix reference" · off "Optional · remix reference" |
| `First frame` | success "Set" · off "Optional · the model picks the opening shot" |
| `Script` | success "{n} beats attached to start" · warning "{n} beats not attached" · off "No beats" |
| `fal` | off "Verified on start" (it is never probed) |

  No fix text repeats a preserved control label.
- **SessionSettings.** Rendered **only when `!live && !busy`** (`:1194`). It is the native `<details>`, closed by default, and its `<summary>` reads `Session settings <span>(locked once connected)</span>`. It contains `<DirectorSettingsForm settings onChange={setSettings} disabled={live || busy} scriptPlanned={sendScriptOnConnect && beatsToWire(scriptBeats).length > 0} onGenerateSheet={generateSheet} generatingSheet={generatingSheet} />`, with props identical to `:1200-1207`. In the rail the form is 2 columns: Resolution | Aspect ratio, Memory | Seed, then full-width rows for Character name, Character sheet, First frame, Last frame of first chunk, Target audio and Audio bitrate. 'Generate from first frame' is `<Button variant="ghost" size="sm" pending={generatingSheet} pendingLabel="Generating…">`, keeping its disabled rule and title.
- **LockedSettings.** Rendered when `live || busy`. It is a **separate** element, never the form. Kicker `LOCKED` + Lock icon, then `<Chip mono>`s: `{resolution}`, `{aspectRatio}`, `seed {seed ?? 'random'}`, `mem {memory}`, `{audioBitrate / 1000} kbps`, plus `{characterName}` when it is non-empty. For example `768p` `16:9` `seed random` `mem 12` `192 kbps`. An sr-only lead reads "Locked for this session:".
- **PremiseBlock.** Shown while `live || busy`, when `premise` is set.
- **Twitch panel** (`<TwitchBroadcast view={tw} />`). It has an h3 **'Twitch broadcast'**, the connection row ('connected as {login}' + 'Disconnect' with title 'Forget the stored Twitch connection', or 'Connect to Twitch' with `pending={exchanging}` and `pendingLabel="Connecting…"`), the `<details>` 'Paste a stream key instead' (only when `!auth`) with `<input type="password" placeholder="live_… stream key" aria-label="Stream key">`, the line '● pushing to Twitch ingest — viewers see the stream on your channel' (shown only while `broadcasting && air === 'on'`), and `connectError` as a `role="alert"` caption. 'Go live on Twitch' and 'Stop broadcast' render **only** in the transport, so neither is ever duplicated.

#### 8.5.9 Rundown components

- **DirectionComposer.**
  - `<label htmlFor="lc-composer">` reads `live ? 'Next direction' : 'Opening prompt (the series premise)'`. `<Textarea id="lc-composer" autoGrow maxRows={8} className="text-body-lg" aria-keyshortcuts="Meta+Enter Control+Enter">` holds `value={prompt}`.
  - **Attachment chips** (live only, `:1227`): `<Chip>` 'End frame' (shows a 20×20 `bg-screen` thumbnail when `liveEndImage` is set) and `<Chip>` 'Audio' (accent when `liveAudioUrl` is set). Each is a toggle button with `aria-expanded` and `aria-controls` pointing at an inline tray that stays mounted (`hidden` when closed); each tray id comes from `useId()`. The trays contain `<Field label="End frame for next scene (optional)">` + `<AssetUrlInput placeholder="Image URL or upload">`, and `<Field label="Replace audio track (optional)">` + `<AssetUrlInput kind="audio" placeholder="Audio URL or upload">`. After a send the one-shot values clear (`:692-694`) and the trays close.
  - **Send row:** `<Button variant={live ? 'primary' : 'secondary'} icon={Send}>Send direction</Button>`, disabled `!live || !prompt.trim()` (`:1261`); aria-hidden `<Kbd keys={['mod','Enter']} />`; the readout `{prompt.length}` (text-3).
  - `Applied: {activePrompt}` (`caption` text-2, 2-line clamp) renders when `activePrompt` is set.
- **DirectionQueue.** `StreamList` rows keyed by `version`, newest first, 8 at most. Each row: `<Led tone>` (sent `off`, pending `warning`, applied `success`, rejected `danger`; label = status word, sr-only) + `readout` `v{version}` + `caption` `{status} — {text.slice(0, 90)}` (the preserved format of `:1183`). A rejected row has `title={reason}`. Empty: caption 'Directions you send appear here with their version.'
- **ChatSteerer** (Chat desk). Logic, the direction throttle (`ChatSteerer.tsx:94-100`) and sanitisation are byte-identical, with one exception, DEC-8-13:
  - **`!frame`/`!snap` throttle (DEC-8-13, §0.4 BC-13).** Today the frame command (`:81-84`) returns before the throttle, so any viewer can trigger fal storage uploads and overwrite the next end frame and the next session's first frame mid-show. It now obeys a 10 s global and 8 s per-user minimum through new `lastFrameAtRef` (a number) and `lastFrameByUserRef` (a `Map<string, number>`), checked and set inside the `:81` branch before `onFrameCommandRef.current?.(user)`. A throttled frame command still `return`s without calling it.
  - Header row: h3 'Chat steering' + `<Led tone={connected ? 'success' : 'off'} label={connected ? 'listening' : 'offline'} />`.
  - Description: `:150-153` verbatim.
  - Controls: 'Connect'/'Disconnect', with `pending={connecting}` and `pendingLabel="Connecting…"` on 'Connect'; `<Checkbox>` 'Chat can direct'; prefix `<Input mono className="w-24" title="Command prefix" aria-label="Command prefix">`; `status` as `role="alert"`.
  - Feed: `StreamList`, 20 lines at most (`slice(-19)` kept). Each line: `DitherAvatar` 16 + `{user}:` + text + outcome `Badge` (`DIRECT`, `THROTTLED` or `FRAME`; a throttled direction or frame command is `THROTTLED`). Leave `:79` byte-identical. After the handler's decision, call `setChatLog((prev) => prev.map((l, i) => (i === prev.length - 1 && l.user === user ? { ...l, outcome } : l)))`: both updaters are queued in the same handler call, so the last line is this message's.
  - When `!ch`: `<InlineBanner tone="warning" kicker="NOT PATCHED">Set NEXT_PUBLIC_TWITCH_CHANNEL to listen to chat.</InlineBanner>`. Connect stays disabled (`:159`).
- **EventConsole.**
  - Filter row: `<SegmentedControl label="Log level" options=[All, Warnings, Errors]>`, `<Checkbox>` 'Show debug' (off by default), `<Button size="sm" variant="ghost" icon={Copy}>Copy log</Button>` (success word 'Copied').
  - List: `role="log"` with `aria-live="off"`, newest first. Rows (`data-testid="lc-log-row"`): `readout` `HH:MM:SS` text-3 + level `Badge` (`DEBUG` neutral, `INFO` neutral, `WARN` warning, `ERROR` danger) + `code` text (error rows `text-danger`).
  - It subscribes with `useSyncExternalStore(log.subscribe, showDebug ? log.getAll : log.getVisible)`, so hidden debug pings never re-render it.
  - Tab badge: warn and error entries since the Events panel was last visible, in a danger Badge when any error is present, otherwise a warning Badge. The badge is aria-hidden, plus sr-only " ({n} new)".
  - Empty: 'No events yet.'

#### 8.5.10 Dock components

- **Script (ScriptEditor → timeline).**
  - **Stable ids.** Beats carry a client-only `id` (`(b as ScriptBeat & { id?: string })`), assigned in `newBeat` (`crypto.randomUUID()`) and by an effect that fills any id-less beat (template or transfer loads). `beatsToWire` (`dashboard/lib/directorProtocol.ts:58-68`) builds new objects from 4 fields, so ids never reach the wire, and `dashboard/lib/directorProtocol.ts` is not edited. React keys and the `expanded`/selected state move from index to `id` (fixes `:103`, `:58`).
  - **Timeline pane:**
    - **Ruler:** 16 px, ticks every 5 s, labels every 10 s (`micro` text-3). Scale `pps = max(8, (paneWidth − 16) / span)` with `span = max(maxOffset + 10, 60)`. It scrolls horizontally.
    - **Beats lane** (48 px, `<ol aria-label="Script beats">`): a block per beat, `left = offset × pps`, width to the next offset (the last beat gets 10 s), min 48. Each block is a `<button aria-pressed={selected}>` with the accessible name `Beat at {offset} seconds: {prompt or 'empty'}` and a roving tabindex (←/→ move). Content: `@{offset}s` + a 1-line prompt excerpt + a 28×16 end-frame screen + a Music icon when `audioUrl` is set. A beat that `beatsToWire` would drop gets a dashed `line-control` border.
    - **Directions lane** (20 px): applied `v{n}` badges at `atPlayback × pps`.
    - **Playhead:** a 2 px accent line at `playbackSeconds × pps` (transform only). The active beat uses the existing `activeBeat` logic (`:65-68`).
  - **Inspector pane:** for the selected beat, the offset `<input type="number" title="Offset in seconds" aria-label="Offset in seconds">` + 's', `<Textarea placeholder="Direction for this shot…" aria-label="Direction for this shot">`, `<IconButton label="Optional assets">` revealing 'End frame at this offset' / 'Audio starting at this offset' (AssetUrlInputs), and `<IconButton label="Delete shot">`. With no selection it shows the description `:85-88` verbatim, `<ScriptTemplatePicker>` (only when `convexEnabled`, inside `TemplatePickerBoundary`), and 'Add shot'.
  - **Dock header:** `{wire.length} beat{s}` + ` · beat @{X}s playing` (`:78-81`); a source `<Chip icon={Clapperboard}>{meta.title}</Chip>` after `onTemplateApplied` ('Prepared Director transfer' or the board title); `live ? ['Cut to script' (title 'Cut to this script at the next chunk'), 'Queue script' (title 'Queue after the running script'), both disabled when !wire.length] : <Checkbox>Send with session start</Checkbox>`.
  - **ScriptTemplatePicker:** `boards === undefined` shows `<Skeleton shape="text" w={160} />` + sr-only `role="status"` 'Loading…'. `boards.length === 0` shows the 'Open shotboard editor' link. Otherwise it shows the select ('Load template…', 'Untitled', title 'Autofill the script from a saved shotboard') and the 'edit' link.
  - **Link guards (8C).** Both Links (`ScriptTemplatePicker.tsx:101` 'Open shotboard editor' and `:128` 'edit') get `onNavigate={guard(href)}` with the same `href` they render, where `guard = useLeaveGuard()` from `lib/leaveGuard.ts` (§7.2). Under the air lock a click opens the 'Leave Live Control?' dialog (§8.6.6) instead of unmounting DirectorPlayer; otherwise the guard does nothing.
- **Audio (TrackManager → deck).** It still `return null`s when `!useConvexEnabled()`; the Audio tab is then not rendered either. TrackManager keeps the Convex queries, the mutations and the `selected` state, and renders the pure `TrackDeck` with `armed={selected}` and `onArm={setSelected}`; the fixture renders `TrackDeck` with its own state (§8.5.13). `TrackDeck` owns the UI state below (`shownIndex`, `artOpen`), takes `dockOpen`, `audioVisible` and `dockWidth` from Dock (Dock measures its own width with a ResizeObserver), and takes the optional `snapshot` (§8.5.13).
  - **Header row:** h3 'Audio library' + kicker `COAST ORIGINALS · {n} TRACKS` (authored uppercase in M2, §5.20.5; its `backdrop-blur` went in 1B, §5.10; listed in §8.9.6) + `<IconButton icon={Maximize2} label="Expand artwork" size="sm" aria-haspopup="dialog">` (rendered when `sliderTracks.length > 0`; it sets `artOpen`) + 'Upload song' (`pending={uploading}`; the label stays 'Upload song').
  - **List** (rendered when `tracks.length > 0`): `role="radiogroup" aria-label="Armed track"`.
    - **The first radio is 'No track'** (DEC-8-10, §0.4 BC-14). It is a 32 px row whose `role="radio"` button holds a 32×32 `bg-screen rounded-screen` well with a Music glyph in `text-fg-disabled` and the label 'No track', with `aria-checked={armed === null}`, no size and no Delete. Choosing it calls `onArm(null)`, which disarms, as clicking the armed row did at 845147c (`TrackManager.tsx:159`).
    - Then each track row is a flex of a `role="radio" aria-checked={armed === track._id}` button (32×32 cover `bg-screen rounded-screen` or a Music glyph, name, size) followed by `` <IconButton icon={Trash2} label={`Delete ${track.name}`}> `` **outside** the radio.
    - Roving tabindex across every radio, 'No track' included, with Space/Enter to arm. Clicking a track radio calls `onArm(track._id)`; clicking the armed one keeps it armed. Deleting the armed track still disarms it first (`:175`).
  - **Armed panel:** `` <audio controls preload="metadata" aria-label={`Preview ${name}`}> ``; label 'Volume' + `<Slider aria-label="Music mix volume" min 0 max 1 step 0.05>` + `{n}%`; label 'Start (s)' + number `aria-label="Music start offset"`; `<Checkbox>` 'Loop'; 'Use for session', 'Queue on next direction' (disabled `!live`) and 'Mix in output', each with its preserved `title`. **'Mix in output' calls `onUseForMix(config)` synchronously inside its own click handler.** No `await`, `setTimeout` or state round-trip may come before it, because `primeMusic` must run while the user activation is live.
  - **Artwork (display-only; DEC-8-04, §0.4 BC-15, D3).** `<section aria-label="Coast originals artwork carousel">` is a square at the Dock body's full height, 164×164 (`--dock-h` 200 minus the 36 px header), beside the list. It is shown only while the Dock is at least 776 px wide (`dockWidth`): the former 760 px rule plus the 16 px the square grew. While TrackDeck holds the `morph` slot and the Sheet is closed, it holds `<ArtworkSlider key={sliderTracks.map((track) => track._id).join(':')} … />` (the `:131` key, moved onto the wrapper) plus 'Arm this track'. `ArtworkSlider` lives in `TrackManager.tsx`:

    ```tsx
    function ArtworkSlider({ sliderItems, armedSliderIndex, shownIndex, setShownIndex, autoplayOn }: ArtworkSliderProps) {
      const [start] = useState(() => (armedSliderIndex >= 0 ? armedSliderIndex : shownIndex))   // frozen per mount
      return (
        <MorphSlider items={sliderItems} startIndex={start} activeIndex={armedSliderIndex >= 0 ? armedSliderIndex : undefined}
          transition="melt" intensity={0.46} aberration={0.24} drift={0} autoplay={autoplayOn} autoplayDelay={6}
          radius={2} overlayColor="#05080F" onIndexChange={setShownIndex} />
      )
    }
    ```

    - **Display-only.** `onIndexChange={setShownIndex}` only records the slide shown. No slide change calls `onArm`: not autoplay, not 'Previous song artwork'/'Next song artwork', not the 'Show {caption}' tabs, not drag, and not ←/→ on the stage. At 845147c, `onIndexChange={selectSliderTrack}` (`:142`, `:91`) armed whichever slide was shown, so autoplay re-armed a different track every 6 s (§3.7 #1). `selectSliderTrack` is deleted. `shownIndex` is clamped to `[0, sliderTracks.length − 1]` whenever `sliderTracks` changes.
    - **'Arm this track'.** `<Button size="sm" variant="secondary" icon={Check}>Arm this track</Button>` sits at the artwork's top-left (`absolute top-2 left-2 z-10`). The MorphSlider's previous/next buttons sit at mid-height and its caption and indicators at the bottom, so nothing overlaps. It renders only while a MorphSlider is mounted, never on the static cover. Its click runs `onArm(sliderTracks[shownIndex]._id)`. It and the radiogroup are the only ways to arm a track.
    - **`activeIndex`.** Arming through the radiogroup moves the carousel to that track's slide.
    - **`startIndex` is frozen per mount.** A new instance starts on the armed track's slide, else on the slide last shown. Never pass the live `shownIndex`: `startIndex` is a dependency of the engine effect (`MorphSlider.tsx:492`), so a changing value would rebuild the WebGL engine on every slide.
    - **Autoplay pauses (D3).** `autoplayOn = !locked && !reduced && dockOpen && audioVisible && pageVisible`, with `locked = useBroadcast(deriveLock)` (or `deriveLock(snapshot)` when a `snapshot` is passed; the hook is still called), `reduced = useReducedMotion()` and `pageVisible = usePageVisible()` (§7.2). So autoplay pauses under the air lock, under reduced motion, while the dock is collapsed, while the Audio tab is hidden and while the page is hidden, and it resumes when all five clear. MorphSlider's own hover pause (`:500`) stays. §12.4.1 owns the component side of the pause.
    - **One instance, one slot.** TrackDeck calls `useEffectCanvasSlot('morph', 2, want)` once, with `want = sliderTracks.length > 0 && (artOpen || (audioVisible && dockOpen && dockWidth >= 776))` (§8.5.11). While the slot is granted, the MorphSlider renders in the Sheet when `artOpen` and in the Dock section otherwise. Every place without it, and both places while the slot is lost, shows a static `<img src={sliderTracks[shownIndex]?.coverUrl} alt="">` (`rounded-screen`, `object-cover`). **Only one MorphSlider instance is ever mounted.** Opening or closing the Sheet unmounts one instance and mounts the other in the same commit, and the §12.4.1 `WEBGL_lose_context` release frees the old context.
  - **'Expand artwork' Sheet.** `<Sheet side={wide ? 'right' : 'bottom'} open={artOpen} onClose={() => setArtOpen(false)} title="Coast originals artwork" width={528}>` (§7.3). `wide = matchMedia('(min-width: 1024px)').matches` is read when the Sheet opens; below 1024 it is a bottom Sheet with a max-height of 80dvh, as in §9. The body holds one square stage (`width: min(480px, 100%)`, `aspect-ratio: 1`, `bg-screen rounded-screen`) with the same `<ArtworkSlider key=… />` and 'Arm this track', or the static cover. While the Sheet is open, the Dock section keeps its label and shows the static cover. The Sheet also opens under the air lock (with 0 ms motion, §6.12); the lock only pauses autoplay.
  - **States:** `tracks === undefined` shows 3 track-row skeletons + sr-only `role="status"` 'Loading…'. `tracks.length === 0` shows the preserved empty sentence. An unauthenticated resolved auth state (`useConvexAuthState()`, §7.2) shows `<AuthRequired size="panel">`. `error` shows as `role="alert"`.

#### 8.5.11 Effect-slot priorities (one effect canvas per view, `useEffectCanvasSlot`; ids and priorities: §7.16)

| Slot id | Priority | `want` | Loser renders |
|---|---|---|---|
| `symbol-raster` while acquiring and during its 320 ms clear | **3** | `phase === 'acquiring'`, or the clear is running | never loses |
| `morph` | **2** | covered tracks > 0 && (the 'Expand artwork' Sheet is open, or (Audio panel visible && dock open && dock width ≥ 776)). One request per TrackDeck, so one MorphSlider instance (§8.5.10) | static cover `<img>` (in the Dock section, and in the Sheet if it is open) |
| `symbol-raster` while idle | **1** | `phase ∈ {standby, failed}` | `` <BrandImage id={`standby/coast-${aspect.replace(':', 'x')}`} sizes="100vw" alt="" /> ``, pixelated |

The raster uses one slot id whose priority changes with the phase. It unmounts when the program phase begins, which is the first decoded frame; the 320 ms clear runs first. DitherGradient, DitherButton and DitherAvatar canvases are exempt (§7.16).

> Note: the bible's `<BrandImage id="standby-16x9">` is shorthand for the canonical §13.6 ids `standby/coast-16x9`, `standby/coast-9x16` and `standby/coast-1x1` (the §13.8 aliases are for bible compatibility only). Live Control computes `` `standby/coast-${aspect.replace(':', 'x')}` `` from `settings.aspectRatio`.

#### 8.5.12 Command palette (Director group, §7.11)

DirectorPlayer registers these 15 commands on `/admin` only, with `useRegisterCommand` (§7.2). Each command's `enabled` equals its button's enabled rule. The palette list mounts only while it is open, so no preserved name is ever duplicated in the DOM.

| id | Label | Enabled | Run |
|---|---|---|---|
| `director.start` | Start Director | `!live && !busy` | `connect()` |
| `director.stop` | Stop | `(live \|\| busy) && state !== 'closing'` | `requestStop()` (§8.5.7: the 'Stop the Director?' dialog while `air ∈ {on, stalled}`, else `disconnect()`) |
| `director.send` | Send direction | `live && prompt.trim() !== ''` | `sendDirection()` |
| `director.record` | Record | `live && !recording` | `startRecorder()` |
| `director.save` | Stop & save recording | `recording` | `stopAndSaveRecording()` |
| `director.capture` | Capture frame | `live && !capturing` | `captureFrame('admin')` |
| `director.remix` | Remix frame | `live && !!capturedFrame && !remixing` | `remixFrame()` |
| `director.mute` | `muted ? 'Unmute' : 'Mute'` | `live` | `toggleMuted()` |
| `director.golive` | Go live on Twitch | HoldButton enabled rule | opens the ConfirmDialog (never holds) |
| `director.stopbroadcast` | Stop broadcast | `broadcasting` | `stopBroadcast()` |
| `director.cut` | Cut to script | `live && wire.length > 0` | `sendScript(beats, 'replace')` |
| `director.queue` | Queue script | `live && wire.length > 0` | `sendScript(beats, 'append')` |
| `director.chat` | Toggle chat steering | always | `setSteer(!steer)` |
| `director.events` | Open events | always | `rundownTab = 'events'` (and open the Rundown at 1024–1279, or set `mobilePane = 'events'`) |
| `director.cancel` | Cancel | `phase === 'acquiring'` | `disconnect()`; `palette: false` (run by the §7.12 Esc handler) |

`useTwitchBroadcast` also registers `twitch.stop` (8C; `palette: false`, `run: stopBroadcast`, not in the Director group). The §6.7 stalled chyron's 'End broadcast' action runs it through `commands.run('twitch.stop')`.

#### 8.5.13 Visual-test fixture (`LiveControlVisualFixture`)

The component renders its own root `<section id="live-control-visual-test">`; the page (§10.5.9) only imports and renders it, and still calls `notFound()` in production. It renders no `h1` (its label strips keep their h2), so the page keeps exactly one `h1`.
- **Fixed geometry:** each state is a 784×(28 + 8 + 460 + 8 + 88) program column, which is the 1440×900 dock-open geometry.
- **Programs rendered:** idle 16:9, idle 9:16, idle 1:1, acquiring (connectStep 2, the frozen readout `T+00:07.4`), preview (a `programStill` fixture image under the transparent `<video>`), recording, on air (TallyBar `snapshot` with `air: 'on'`, plus the keyline), stalled, stopping, failed (AlertTray showing 'Prompt rejected: fixture reason').
- **Ready-state targets (§10.5.9, §15.10):** the element wrapping the idle 16:9 program column (label strip included) carries `data-ready-state="live-standby"`, the preview column `data-ready-state="live-preview"` and the on-air column `data-ready-state="live-onair"`, each exactly once. 8B captures them in dark and light at 1440 for its PR Screenshots table.
- **Transport wiring:** every transport control is live against the fixture's own props. 'Stop' runs `requestStop` with the state's `air`, so it opens the 'Stop the Director?' dialog in the on-air and stalled states and does nothing visible in preview; an enabled 'Go live on Twitch' click opens the 'Go live on Twitch?' dialog. Confirming a fixture dialog only closes it.
- **Panels rendered:** a PreflightList with mixed tones, LockedSettings, a composer in live mode, a queue with sent, pending, applied and rejected rows, an EventConsole preloaded with 600 `info` entries whose texts are `fixture 1` … `fixture 600`, a ScriptTimeline with 4 beats and the playhead at 23 s, and a TrackDeck (below).
- **TrackDeck:** in a 784×164 box (the 1440×900 Dock body), with `dockOpen` and `audioVisible` true, `dockWidth={784}`, `snapshot` set to the §7.17 initial state (`{ director: 'idle', firstFrame: false, rec: { active: false, bytes: 0 }, air: 'off' }`), and 3 fixture tracks: names 'fixture track 1', 'fixture track 2' and 'fixture track 3'; `coverUrl` `/brand/slate/clips.webp`, `/brand/slate/recordings.webp` and `/brand/slate/analytics.webp` (§13.6, from 3B); `sizeBytes` 3145728, 4194304 and 5242880; and each `url` the 44-byte silent WAV `data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=`. The fixture holds `armed` in its own `useState` (initially 'fixture track 1') and passes `onArm`, so 'No track', the track radios, 'Arm this track' and 'Expand artwork' all work. The artwork is the real, slot-gated MorphSlider with autoplay (D3), so fixture screenshots mask it (B11).
- **Render probe:** in development the fixture root calls `bump('LiveFixtureRoot')` and each `LiveClock` leaf calls `bump('LiveClock')` (E12). The fixture's `telemetryRef` holds a fixed `liveStartedAt = mountTime − 754 000 ms`, so `LiveClock` ticks through `useSecondClock` alone. The fixture has no interval of its own.
- **Constraints:**
  - No Convex hooks. Render `ScriptTimeline` and `TrackDeck`, never `ScriptEditor`/`TrackManager`.
  - No network (no `fetch` in fixture files), no session, no WebGL besides the carrier and the TrackDeck's slot-gated MorphSlider. Images and media are same-origin (`/brand/**`, `/fixtures/**`) or `data:`; `programStill` is one of these.
  - Store-reading components take an optional `snapshot` prop, so the fixture never publishes to the global store and never sets `data-lock` or the ON AIR title.

### 8.6 States

#### 8.6.1 Route-level states

| State | Behaviour and exact copy |
|---|---|
| **Route loading** (`dashboard/app/admin/(live)/loading.tsx`; §6.3 owns the file, created in 4D with RouteSkeleton; 8B swaps in LiveSkeleton) | Renders `<LiveSkeleton />`: the same `.lc-root` classes, with `Skeleton` blocks at the exact §8.4 geometry. Session rail: header line; two `media` 16:9; 7 text rows; a 32 px block; a 96 px block. Program: strip text at 40% width; a `bg-bezel` frame holding three 40×16 lamp blocks and a `bg-screen` screen with `.skeleton-dither`; transport blocks 116×32, 164×32, 4 × 32×32 and 176×32; one 32 px telemetry row. Dock: 36 px of tabs, plus a 164 px body when `data-dock="open"`. Rundown: 36 px of tabs, an 88 px block and 3 text rows. `<CoastLoader size={64} label="Loading Live Control" />` is centred in the skeleton's `bg-screen` block (§6.3); the strip shows only its 40%-width text skeleton. The CoastLoader is the status, so the skeleton adds no extra `role="status"`. It appears after 150 ms (§6.3). CLS against the loaded page is 0 |
| **Convex not configured** (`NEXT_PUBLIC_CONVEX_URL` unset) | Standalone `<DirectorPlayer />` (`DirectorPanel.tsx:15`). No slate: "Director stays silent standalone". No Audio tab (TrackManager `return null`, `:33`). No template picker (`ScriptEditor.tsx:90`). The Preflight 'Convex' row shows a warning. A saved recording downloads `director-<ts>.webm` and logs 'Recording captured but NEXT_PUBLIC_CONVEX_URL is not set; download it instead.' (warn) |
| **fal not configured** (server `FAL_KEY` unset) | Nothing is shown until Start, and nothing is probed. Start leads to Failed (§8.6.2) with the SDK or proxy message in the AlertTray. It may be an upstream auth error (SKILL.md) |
| **Twitch channel unset** | Chat: `NOT PATCHED` InlineBanner "Set NEXT_PUBLIC_TWITCH_CHANNEL to listen to chat.". Connect stays disabled, and the description keeps '#…'. Preflight shows a warning |
| **Twitch client id unset** | 'Connect to Twitch' stays enabled. Clicking it sets `role="alert"` 'NEXT_PUBLIC_TWITCH_CLIENT_ID is not configured — paste a stream key instead' (`TwitchBroadcast.tsx:109`) |
| **Auth** (Convex configured, Access session missing or expired) | The route itself follows middleware (unchanged 401 strings in production). In the page: `useConvexAuthState()` resolved `!isAuthenticated` makes the Audio panel show `<AuthRequired size="panel" />` (API §7.5, copy §11.D.7). Persistence mutation failures log `convex: …` (error) and raise the Events badge. The template picker shows 'Open shotboard editor' (boards `[]`) |
| **Offline** (`navigator.onLine === false`) | §7.6 OfflineBanner (copy: §11.D.7) sets `html[data-offline]`, so `--h-offline` is 36 px. At ≥1024 the root moves down by it and its height subtracts it (§8.4.1), so the banner covers nothing and there is still zero page scroll. Start while offline leads to Failed |
| **Render error** | `dashboard/app/admin/error.tsx` (§11.D.3) is the SIGNAL LOST route slate inside the surviving shell. `TemplatePickerBoundary` (`ScriptEditor.tsx:28-39`) is kept byte-for-byte, including its existing `console.warn('shotboard template picker unavailable:', error)` |

#### 8.6.2 Director session states

`phase` is derived like this and passed to DirectorStage:
- `'acquiring'` if `state === 'opening' || (state === 'live' && !firstFrame)`
- `'program'` if `state === 'live'`
- `'stopping'` if `state === 'closing'`
- `'failed'` if `state === 'failed'`, or `state === 'closed'` with no first frame in this attempt (`!s.hadFirstFrameRef.current`, reset in `connect()`)
- `'standby'` otherwise (`idle`, and `closed` after a first frame)

| `state` (+ first frame) | `data-state` | State word | `html[data-broadcast]` | Monitor (exact copy) | Transport slot 2 | Session sheet | Announce |
|---|---|---|---|---|---|---|---|
| `idle` | `idle` | Standby | `idle` | StandbySlate: `STAND BY` · premise · **'Director offline'** · `⌘↵ to start` (Ctrl+↵ off Mac). Idle raster (priority 1) | **Start Director** | `<details>` 'Session settings (locked once connected)' | none |
| `opening` | `opening` | Tuning | `connecting` | ConnectPlate: StageTrack **'Network checked' → 'Finding a machine' → 'Connecting' → 'Building world' → 'Generating first scene'** (current = `connectStep`), `T+MM:SS.s`, diagnostic line, **'Cancel'** + Esc. Raster (priority 3) at density `.10`, then `.25/.40/.60/.80` for `connectStep` 1–4 | **Stop** | LockedSettings + PremiseBlock | 'Connecting to the Director' (polite) |
| `live`, no frame yet | `live` | Tuning | `connecting` | ConnectPlate continues (step 3 or 4). The overlay no longer ends at transport 'live' (fixes B5) | Stop | same | none |
| `live`, first frame | `live` | Preview | `preview` | Program video. Raster clears (320 ms) and unmounts. Brackets tighten. Nothing else covers program | Stop | same | 'Preview is up' (polite) |
| `closing` | `closing` | Stopping | `stopping` | StoppingPlate: BayerSpinner + **'Stopping…'** | Stop, pending (click-guarded) | same | none |
| `failed` | `failed` | Failed | `idle` | FailedSlate: `SIGNAL LOST` · **'Session failed'**. Idle raster | **Start Director** (restored, `:1242`) | `<details>` | none (the AlertTray `role="alert"` announces) |
| `closed`, no first frame in this attempt (the SDK dropped the connect) | `closed` | Failed | `idle` | FailedSlate: `SIGNAL LOST` · **'Session failed'** (fixes B5: no stray 'Cancel'). Idle raster | **Start Director** | `<details>` | none |
| `closed`, after a first frame | `closed` | Off air | `idle` | StandbySlate (fixes B5: no stray 'Cancel') | **Start Director** | `<details>` | none |
| any + recording | unchanged | unchanged | `data-rec` present | TallyBar REC lamp ring + `REC {bytes} · HH:MM:SS` | slot 3 'Stop & save recording' | none | 'Recording' / 'Recording stopped' (polite) |
| after upload | unchanged | unchanged | none | none | slot 3 per `live` | Telemetry tape: 'Uploading…', then '{size} uploaded' | none |

**Other session events.**
- **`stream_exhausted`** (`:631-636`). The auto-disconnect path is unchanged. The `warn` entry is 'stream_exhausted: {reason}'. Then `statusMessage.set({ tone: 'warning', text: 'Session allowance reached · the Director stopped' })`.
- **Allowance thresholds.** When remaining time first crosses ≤ 300 s, and again at ≤ 60 s, fire `statusMessage.set({ tone: 'warning', text: 'About {5|1}m of session allowance left' })` once per session.

#### 8.6.3 Where every error renders

| Source (845147c) | Exact text | Renders in |
|---|---|---|
| `onError` `:987-996` | the SDK message | AlertTray (`role="alert"`) + Events `error: …` + FailedSlate when `state` becomes `failed` |
| `prompt_rejected` `:598-602` | `Prompt rejected: {reason}` | AlertTray + queue row `rejected` (danger LED, `title=reason`) + Events |
| message `type === 'error'` `:606-616` | `msg.error ?? msg.message ?? raw` | AlertTray |
| close failure `:903` | `Session close: {closeError}` | AlertTray |
| capture, remix, sheet `:770`, `:808`, `:839` | `frame capture: …`, `frame remix: …`, `character sheet: …` | Events (error) + badge + the matching button's error micro-state (§8.5.7). **No AlertTray**: they stay non-blocking, as today |
| convex, upload, clip, cleanup, music | as logged | Events (warn/error) + badge |
| Twitch `connectError` | 'OAuth state mismatch — try Connect to Twitch again', 'NEXT_PUBLIC_TWITCH_CLIENT_ID is not configured — paste a stream key instead', server `error` or 'Connect failed', `startWhipBroadcast` messages ('No video track on the live stream', 'No local SDP offer produced', 'Twitch ingest rejected the offer ({status})') or 'Broadcast failed' | Twitch panel `role="alert"` caption |
| ChatSteerer `status` | the error message | Chat desk `role="alert"` |
| TrackManager `error` | 'Upload failed ({status})' (+ ' — and the uploaded file could not be cleaned up') | Audio panel `role="alert"` |
| AssetUrlInput `uploadError` | the error message | inline `role="alert"` under the field |

- **AlertTray lifecycle.** `connect()` still clears `error` (`:910`). 'Dismiss error' calls `dismissError()` (new). 'View events' sets the Rundown tab to `events`; at 1024–1279 it also opens the Rundown, and below 1024 it sets `mobilePane='events'`. Focus then moves to the Events tab.
- **Under the air lock** the AlertTray still appears. It is an error, so it never goes to the status rail (§6.10, §6.12).

#### 8.6.4 Panel states

| Panel | Loading | Empty | Populated / active | Disabled / error |
|---|---|---|---|---|
| Direction queue | none | 'Directions you send appear here with their version.' | rows `v{n} {status} — {text}` | none |
| Composer | none | idle: DEFAULT_PROMPT prefilled | live: empty 'Next direction' draft | 'Send direction' disabled `!live \|\| !prompt.trim()` |
| Chat | 'Connect' pending, label 'Connecting…' | connected, no lines: 'Chat lines appear here once connected.' | lines with outcome badges | `!ch`: NOT PATCHED banner; `status`: `role="alert"` |
| Events | none | 'No events yet.' | leveled rows; debug hidden by default | none |
| Script | picker: skeleton + sr-only 'Loading…' | 'Add shot' + the description `:85-88` + the picker ('Open shotboard editor' when there are no boards) | timeline + inspector; `{n} beats · beat @{X}s playing` | 'Cut to script'/'Queue script' disabled when `!wire.length` |
| Audio | 3 row skeletons + sr-only 'Loading…' | 'No songs yet — upload one to use it as the stream's audio reference.' | radiogroup ('No track' first) + armed panel + the 164×164 display-only artwork, and 'Expand artwork' | 'Queue on next direction' disabled `!live`; `AuthRequired` when unauthenticated |
| Session settings | none | none | form | 'Last frame of first chunk (scripted)' and 'Target audio (scripted)' disabled when a script is planned, with the title 'Not available while a script is queued for this session'; 'Generate from first frame' pending shows 'Generating…' |

#### 8.6.5 Twitch and ON AIR

**Twitch panel states** (panel copy is verbatim from `TwitchBroadcast.tsx`):

| State | Panel | Transport slot 8 | `air` |
|---|---|---|---|
| No auth | 'Connect to Twitch' + `<details>` 'Paste a stream key instead' | 'Go live on Twitch', disabled | `off` |
| Exchanging `?code` | 'Connecting…' (pending) | disabled | `off` |
| Authenticated | 'connected as {login}' + 'Disconnect' | enabled iff `live && firstFrame && !starting` | `off` |
| Key pasted | the password field holds `manualKey` | enabled iff `live && firstFrame` | `off` |
| Negotiating | unchanged | 'Negotiating…' (pending) | `cue` (steady amber CUE lamp) |
| Cue not confirmed (the session arrived, then `connectionState` is `disconnected`, or no truth gate within 10 s of `cueSince`) | the pushing line stays hidden; BroadcastProvider's sticky warning chyron 'Twitch ingest not confirmed' with 'End broadcast' and 'Dismiss' (§6.7) | 'Stop broadcast' (the session exists, so `broadcasting` is true) | `cue` with `cueUnconfirmed` (lamp `CUE {MM:SS}`); nothing is torn down |
| Negotiation failed (`connectionState` becomes `failed` while `cue`, or `startWhipBroadcast` throws) | unchanged; `failed` shows the cue-failure chyron "Couldn't start the Twitch broadcast", and a throw shows its message as the `connectError` caption (`role="alert"`) | 'Go live on Twitch' | `off` |
| Pushing, truth gate true | '● pushing to Twitch ingest — viewers see the stream on your channel' | 'Stop broadcast' (danger outline) | `on` |
| Stalled | the pushing line is hidden; the §6.7 stalled chyron is the `role="alert"` | 'Stop broadcast' | `stalled` |
| Stopped / session ended | none | 'Go live on Twitch' | `offair` for 3 s, then `off` |

**ON AIR flow (8C).** §6.7 owns the motion and the `air` state table; this is the page wiring.
1. **Precondition.** `data-broadcast="preview"` (live + first frame) and `streamKeyReady`. Otherwise the HoldButton is disabled and keeps its preserved `title`.
2. **Commit** (hold-to-take, §0.4 BC-5). Either hold for 600 ms (pointer, or Space/Enter held), or a click/Enter/assistive activation that opens `<ConfirmDialog title="Go live on Twitch?" body={body} confirmLabel="Go live" cancelLabel="Not yet">`. When `auth` exists (its stream key is the one used), `body` is 'Viewers on twitch.tv/{auth.login} will see program output.'. When the pasted key is used (`!auth`; `TwitchBroadcast.tsx:139` reads `auth?.streamKey ?? manualKey`), `body` is always 'Viewers on the channel bound to this stream key will see program output.'. The body never names `NEXT_PUBLIC_TWITCH_CHANNEL`, which may not be the channel bound to a pasted key. Commit calls `startBroadcast()`, which first publishes `{ air: 'cue' }`.
3. **WHIP negotiation.** `startWhipBroadcast(stream, key)` is unchanged. On success it runs `setWhip(session)`; `useWhipTruth` publishes `cueSince` and starts polling. If `connectionState` becomes `failed` while `cue`, `air` returns to `off`, the dead WHIP session is torn down and the cue-failure chyron appears. If the connection is `disconnected`, or no truth gate arrives within 10 s of `cueSince`, `air` **stays `cue`**: the lamp counts `CUE {MM:SS}` and BroadcastProvider shows the warning chyron 'Twitch ingest not confirmed' ('End broadcast', 'Dismiss'). A timeout never tears the session down: a later truth gate still reaches step 4, and 'End broadcast' or the transport's 'Stop broadcast' ends the push through step 6 (§8.5.6, DEC-8-06, §0.4 BC-7).
4. **T0.** The truth gate becomes true, so `air: 'on'`: the lamp resolves to ON AIR, the keyline cuts in, `data-broadcast="on-air"` triggers house lights, the title and favicon swap, and 'On air' is announced assertively (§6.7). The telemetry WHIP cell lights, and the pushing line appears.
5. **Stall.** `air: 'stalled'`: STALLED lamp (≤ 5 blinks), keyline off, TWITCH LED shows danger. BroadcastProvider (§6.7) is the only publisher of the stalled chyron; its 'End broadcast' action runs `twitch.stop`, which useTwitchBroadcast registers (`palette: false`, `run: stopBroadcast`). The chyron's copy and counter are §6.7's; it is dismissed on recovery or stop.
6. **Off air.** Triggered by 'Stop broadcast', by 'End broadcast' on the stalled or the cue warning chyron, or by the session ending (`:95-105`, with its opRef invalidation unchanged): `offair`, then after 3 s `off`. The title and favicon are restored (§6.7).
7. **Stopping the Director while on air (DEC-8-14, §0.4 BC-11).** 'Stop' or the palette's 'Stop' while `air ∈ {on, stalled}` first opens the 'Stop the Director?' dialog (§8.5.7). 'Stop and end broadcast' runs `disconnect()`, and the session end then takes the broadcast off air (step 6). 'Keep running' changes nothing.

> Note: the chyron action is 'End broadcast', not the bible's 'Stop broadcast'; the label and the reason for it are §6.7's.

#### 8.6.6 Air lock on Live Control (`html[data-lock="air"]`, §6.12 matrix; §0.4 BC-2)

**Lock on** means `data-broadcast ≠ idle` or `data-rec` is present, so it covers connecting, preview, on air, stopping and recording.

| While locked | Behaviour |
|---|---|
| Dock | collapse control disabled, with the tooltip 'Locked while on air' (§6.12). The artwork carousel's autoplay pauses on the slide shown (§8.5.10) |
| Density | forced compact on the root anyway; the palette density command is disabled (§7.14) |
| Rundown (1024–1279) | it swaps with the Session sheet by a cut at all times (no animation), so the lock changes nothing |
| Transport | slots are fixed, so nothing reflows; error micro-states are colour-only; no hover transforms |
| Monitor | only lamps, the tag and HUD readouts change. The raster clear is allowed because it is the acquisition itself |
| Info, success and warning notices | go to the StatusRail message slot (§7.10). Errors still show the AlertTray or a chyron |
| Navigating away (AppNav Links, palette "Go to", Alt+1…7, and the two ScriptTemplatePicker Links; DEC-8-07, §0.4 BC-3) | `useLeaveGuard()` (`lib/leaveGuard.ts`, §7.2) prevents the navigation, and AppNav renders the single `<ConfirmDialog title="Leave Live Control?" body="Leaving Live Control ends the Director session and the broadcast." confirmLabel="Leave and stop" cancelLabel="Stay" destructive>` (§6.12). Confirm sets `pending` with `pendingLabel="Ending session…"`, runs `await broadcast.leave()`, then `router.push(href)`. DirectorPlayer registered `setLeaveHandler(s.disconnect)`, so the full teardown and the recording upload run first; the unmount path alone would discard the main recording, because `:1040` stops the recorder without the `onstop` that `stopRecorder` attaches (`:283`). 'Stay' keeps the URL at `/admin` |
| Reload or close | a `beforeunload` handler is active while the lock is set (§6.12, §0.4 BC-4) |
| Browser back/forward | The mouse back and forward buttons (`event.button` 3 and 4) are blocked while the lock is set (§6.12, §0.4 BC-4). Keyboard and toolbar back/forward are not intercepted, so the existing unmount cleanup runs (`:1034-1043`; flush clip, stop recorder, close session). That is a documented known gap and matches 845147c |

### 8.7 Motion

Tokens and keyframes come from §5.12 and §5.14. Everything here obeys the §6.12 air-lock and §6.14 reduced-motion maps.

| Moment | Trigger | Spec | Under lock | Reduced motion |
|---|---|---|---|---|
| Slate entrance | standby or failed slate mounts | one `.px-resolve`, 160 ms | n/a (unlocked) | instant |
| Acquisition raster | `connectStep` changes | SymbolRaster repaint at the new density: a cut, with no rAF loop | allowed | same (static) |
| Active step label | `connectStep` changes | `DecryptedText` ≤ 320 ms, once | allowed (CONNECT_STEPS exception) | final text immediately |
| `T+` readout | connecting | 10 Hz via the shared ticker; digits snap | allowed (HUD readout) | same |
| First frame | `armFirstFrame` fires | raster clears in reverse Bayer-8 order over 320 ms (rAF, slot priority 3), then unmounts; brackets tighten 4 px over 200 ms `--ease-out`; PVW lamp resolves in 160 ms | allowed | 150 ms opacity crossfade; brackets jump; lamp cuts |
| Queue row | `sendPrompt` | `StreamList` 120 ms resolve, no slide | allowed | instant |
| LED status change | server acks | snap in `--dur-tick` (60 ms) | allowed | cut |
| Telemetry values | 1 Hz leaves | snap, no roll, no CountUp (CountUp is never used on Live Control) | allowed | same |
| Key press | secondary buttons | `translate-y-px` + `shadow-key-pressed`, 60 ms `--ease-key` | allowed (no hover transforms) | colour only |
| Button error | `frameToolError` | 3-frame 2 px jitter, 180 ms `steps(3)` | **colour only** (within 24 px of the monitor) | colour only |
| Rundown (1024–1279) | toggle | swaps with the Session sheet by a cut (`display`), no animation | cut | cut |
| Dock collapse | toggle | `--dock-h` switches; the grid row is not animated (a cut) | disabled | cut |
| ON AIR, stall, off air | `air` | §6.7: lamp resolve, keyline cut, house lights 1200 ms | allowed | cuts; veil instant |
| MorphSlider | autoplay every 6 s (D3); explicit prev/next/dot/drag | tween only; rAF only during tween, drag or texture load (§12.4.1). A slide change never arms a track (DEC-8-04) | autoplay paused on the slide shown; explicit navigation allowed only when it holds the slot (never while acquiring) | autoplay paused; tween capped at 0.35 s (existing) |

There is no `animate-pulse`, `animate-spin` or `Loader2` in any Live Control file. The REC lamp is steady. The only blinking element is the STALLED lamp (§6.7).

### 8.8 Accessibility

**Landmarks and headings.**
- The h1 'Live Control' is sr-only (`dashboard/app/admin/(live)/page.tsx`; it landed in 4B).
- `<section aria-label="Director">` contains h2 **'Director (realtime WebRTC)'** in the label strip.
- Regions: `<section aria-label="Session">` (`.lc-session`), `<section id="lc-rundown" aria-label="Rundown">`, `<section aria-label="Dock">`.
- h3 headings: 'Twitch broadcast', 'Chat steering', 'Script', 'Audio library'.
- There is exactly one h1 on the route. The shell's 'Stream Admin' is not a heading (§7.8).

**Label associations** (fixes B8 and B14):

| Control | Accessible name |
|---|---|
| Composer | `<label htmlFor="lc-composer">` ('Opening prompt (the series premise)' / 'Next direction') |
| Settings form | `id`/`htmlFor` pairs `lc-set-resolution`, `lc-set-aspect`, `lc-set-memory`, `lc-set-seed`, `lc-set-charname`, `lc-set-sheet`, `lc-set-first`, `lc-set-last`, `lc-set-audio`, `lc-set-bitrate` (AssetUrlInput receives `id`). The existing `title`s stay |
| Chat prefix | `aria-label="Command prefix"` plus its existing `title` |
| Stream key | `aria-label="Stream key"` |
| Beat offset | `aria-label="Offset in seconds"` |
| Beat prompt | `aria-label="Direction for this shot"` |
| Track rows | `role="radio"` inside `role="radiogroup" aria-label="Armed track"`; the first radio is 'No track' |
| Telemetry ladders | `<LedLadder>` `role="meter"`. The allowance ladder's `aria-valuetext` is the cell 8 sentence; the ping ladder's is `Ping · {n} ms` (§8.4.6) |

**Live regions and announcements.**
- Use `announce()` (§7.2) only: 'Connecting to the Director', 'Preview is up', 'Recording', 'Recording stopped', 'Director stopped' (on returning to idle from closing), 'Frame captured', 'Frame remixed'. All are polite. ON AIR messages are §6.7's.
- The ConnectPlate StageTrack region is `aria-live="polite"` and announces each new step label once.
- The AlertTray is `<div data-testid="lc-alert-tray" role="alert">`. The tape cell 'Uploading…' is `role="status"`.
- The EventConsole is `role="log"` with `aria-live="off"`, to prevent SR floods.

**Keyboard map** (no single-character global shortcuts, §7.12; the new shortcuts are §0.4 BC-9):

| Keys | Scope | Action |
|---|---|---|
| ⌘↵ / Ctrl+Enter | composer | `!live && !busy` → `connect()`; `live && prompt.trim()` → `sendDirection()`; otherwise nothing |
| ↑ | composer, when the value is empty or the caret is at 0 with no selection | recall the previous history entry (20 at most, newest first). The first press stashes the current draft |
| ↓ | composer, when the caret is at the end | step toward newer entries; past the newest, restore the stashed draft |
| ←/→ | Script beats list (focused) | move the selected beat (roving tabindex) |
| ←/→ | MorphSlider stage (focused) | existing prev/next artwork (`MorphSlider.tsx` keyDown); display only, it never arms a track (DEC-8-04) |
| Space/Enter held | 'Go live on Twitch' | hold-to-take (600 ms); a quick press opens the ConfirmDialog |
| ⌘K, ⌘/, Alt+1…7 | global | §7.12 |

Esc is §7.12's global handler: it closes the top dialog, sheet or popover (Tooltip, Popover and Sheet call `e.preventDefault()` when they consume Esc, and the handler skips `e.defaultPrevented`), and otherwise, while connecting, runs `director.cancel` (§8.5.12), the same `disconnect()` as 'Cancel'. Live Control adds no Esc listener of its own.

**Focus management.**
- At 1024–1279, opening the Rundown moves focus to its active tab. Closing it ('Close rundown', or the strip's 'Rundown' IconButton) returns focus to the 'Rundown' IconButton.
- 'View events' focuses the Events tab.
- A Button that goes pending keeps focus, because it never sets native `disabled` while pending (§7.3).
- When the transport slot 2 control swaps (Start ↔ Stop) while it has focus, move focus to the new control in the same commit.

**Targets and contrast.**
- Transport controls are ≥ 32 px (44 px on `(pointer: coarse)`). LEDs are never the only signal.
- HUD plates use `text-fg-on-screen` only. `text-fg-on-screen-2` is allowed on the solid bezel (the lip) and on `bg-screen` (the viewfinder brackets), never on a HUD plate (§5.6).
- The AlertTray is `danger` text on `surface-raised`, which is 6.50:1 or better (§5.6).
- The native textarea gets `surface-inset` with `text-fg` (fixes B15).

**Motion and transparency.** `prefers-reduced-motion` follows §8.7. `prefers-reduced-transparency` makes the chassis, panel and HUD opaque (§5.10).

**axe.** 0 serious or critical violations on `/admin` in the idle and failed states, in both themes and at 390 px (§15).

### 8.9 Preserved contract

This subsection is binding and feeds Appendix A. §8.9.1 and §8.9.2 are copied **verbatim** from the evidence audits. The only edit is Markdown safety: raw tags such as `<details>` and `<html>` are wrapped in code spans. Their line references are as of 845147c. Where the redesign satisfies an item through a new mechanism, §8.9.3 says how. §8.9.3 never weakens an item.

#### 8.9.1 From `docs/redesign/audit/live.md` (all 24 invariants, verbatim)

- **L1** The route `/admin` must render Live Control, and `/` must keep redirecting to `/admin` (app/page.tsx:4). The AdminNav tab label 'Live Control' → href '/admin' and the nav `aria-label="Admin sections"` stay unchanged (AdminNav.tsx:8, 21).
- **L2** admin-testing skill (SKILL.md:12): there must be a button whose accessible name is exactly **Start Director**. It must be visible in the idle state and must reappear (restored Start control) after a failed start. Today this is guaranteed by `!live && !busy` (DirectorPlayer.tsx:1242). If an icon-only or command-palette variant is added, the visible 'Start Director' button must remain.
- **L3** admin-testing skill: a failed start must render a visible error message on the page. Keep an error region, and add role=alert rather than removing the text.
- **L4** admin-testing skill: the operator must be able to 'Append a unique prompt' before starting. There must be an editable prompt textarea in the idle state, prefilled with DEFAULT_PROMPT ('A continuous original live-action stream following a group of friends as they explore a new city.', DirectorPlayer.tsx:29-30), and its value must be what connect() sends in `configure`.
- **L5** admin-testing skill (SKILL.md:14): the Director 'Record' button appears ONLY during a live session. Keep `live && !recording` gating (1267).
- **L6** admin-testing skill (SKILL.md:13): a fresh load of /admin in unconfigured mode must produce only the React DevTools info console message. The redesign must not add failing network requests on load (e.g., FAL, Twitch or Convex preflight probes that 401 or 500), React key or hydration warnings, or WebGL errors. The legacy 'FAL_KEY not configured' error must not reappear (do not re-import TestControlPanel or WebRTCPlayer).
- **L7** Keep a discoverable 'Director' region or heading on Live Control. The skill refers to 'The Director card', so for example keep an h2 or aria-label containing 'Director'. Keep the model id text `minimax/h3-max/director` (export DIRECTOR_MODEL, DirectorPlayer.tsx:27) visible somewhere.
- **L8** DirectorPanel contract: when Convex is enabled, render DirectorPlayer with `persistence={useDirectorPersistence()}`, otherwise standalone. Convex hooks must only run beneath ConvexProvider (useConvexEnabled gating in DirectorPanel.tsx, TrackManager.tsx:32-34 and ScriptEditor.tsx:59/90).
- **L9** Media pipeline: exactly ONE `<video ref={videoRef} autoPlay playsInline muted>` element must stay mounted across idle, opening, live, closing and failed. Layout switches must not conditionally unmount or remount it (srcObject is assigned imperatively at 254, 964 and 888). The default is `muted` true, for the autoplay policy.
- **L10** A single stable output MediaStream (`streamRef` / `outputStreamRef`) feeds preview, the main MediaRecorder, the rotating clip recorder and the Twitch WHIP. `getStream={() => streamRef.current}` must stay the source for TwitchBroadcast.
- **L11** `onUseForMix` must call `primeMusic(config)` synchronously inside the click handler, to satisfy the user-activation and autoplay rules (DirectorPlayer.tsx:1332-1338). Any redesigned 'Mix' control must preserve this.
- **L12** DirectorPlayer must not unmount mid-session unintentionally: its unmount effect flushes the clip, stops the recorder and closes the session (1034-1043). Tabs or panels inside Live Control must hide (CSS) rather than unmount DirectorPlayer. Navigating to other admin routes ends the session, as today.
- **L13** The disconnect teardown order must be preserved: clipClosing, then flushClip, then stopRecorder, then send {type:'stop'} and close, then upload the recording, then setSessionStatus 'ended' (860-905). The Stop and Cancel UI must call the same disconnect().
- **L14** Wire protocol (lib/directorProtocol.ts): `configure` carries protocol_version 1 and the locked settings. `prompt` messages must NOT include protocol_version (comment at lines 87-88). A script in configure excludes end_image_url and audio_url. Live end frame and audio are one-shot and cleared after send (692-694). beatsToWire filters empty beats and sorts them by offset. Any client-only beat `id` added for the timeline must be stripped before the wire.
- **L15** Chat safety: `sendChatDirection` strips `[\]<>\n\r@` from the author (max 32 chars) and `\n\r<>` from the text (max 300 chars), and prefixes '[chat @user]' (849-858). ChatSteerer's default prefix is '!direct' and `!frame`/`!snap` trigger a frame capture. The throttle is a 2s global minimum plus 8s per user (ChatSteerer.tsx:94-100). The anonymous tmi.js read-only connection is to `NEXT_PUBLIC_TWITCH_CHANNEL`.
- **L16** Twitch OAuth: TwitchBroadcast (or its successor) must be mounted on /admin at page load to complete `?code&state`. redirect_uri is `${origin}/admin`, the scope is `channel:read:stream_key`, and the exchange is POST `/api/twitch/connect`. Storage keys: localStorage `wzrd_twitch_auth` {login, streamKey}, sessionStorage `wzrd_twitch_oauth_state`. The WHIP endpoint is `https://g.webrtc.live-video.net:4443/v2/offer` with the H264 and Opus preference. Keep the manual stream-key fallback. The broadcast must auto-stop when the Director session ends, via the opRef invalidation that guards against late answers.
- **L17** Deep links: /admin consumes `?board=<shotboardId>` and `?transfer=<directorTransferId>` (ScriptTemplatePicker.tsx:47-53). ShotboardPage pushes `/admin?transfer=` (ShotboardPage.tsx:260). The picker links to `/admin/shotboard?board=<id>`. onTemplateApplied syncs firstFrame, characterName and characterSheet into settings.
- **L18** Theme persistence: localStorage key 'theme' with the `.dark` class on `<html>` (app/layout.tsx:11-19). DitherBackground reacts to that class through a MutationObserver. The global React Bits Dither background (components/DitherBackground.tsx) MUST be kept.
- **L19** Existing aria-labels to preserve or carry over: 'Unmute'/'Mute' (DirectorPlayer.tsx:1119), 'Optional assets' and 'Delete shot' (ScriptEditor.tsx:126, 134), 'Clear' (AssetUrlInput.tsx:79), `Delete ${track.name}`, `Preview ${track.name}`, 'Music mix volume', 'Music start offset', 'Coast originals artwork carousel' (TrackManager.tsx:179, 190, 192, 196, 128), 'Reference images', 'Use as primary image', 'Remove reference from this item' (ReferenceAssetManager.tsx:89, 110, 113). There are no data-testids in the repo today; adding them is safe.
- **L20** Visible strings that users or tests may rely on: 'Start Director', 'Stop', 'Send direction', 'Record', 'Stop & save recording', 'Capture frame', 'Remix frame', 'Cancel', 'Director offline', 'Session failed', 'Stopping…', 'Session settings', 'Next direction', 'Opening prompt (the series premise)', 'Connect to Twitch', 'Go live on Twitch', 'Stop broadcast', 'Paste a stream key instead', 'Chat steering', 'Chat can direct', 'Script', 'Add shot', 'Cut to script', 'Queue script', 'Send with session start', 'Load template…', 'Open shotboard editor', 'Audio library', 'Upload song', 'Use for session', 'Queue on next direction', 'Mix in output'. Renames are acceptable only if SKILL.md is updated in the same change, and 'Start Director' must not be renamed.
- **L21** Convex calls (unchanged signatures): api.sessions.create, api.sessions.setStatus, api.promptEvents.log, api.clips.create, api.clips.attachMedia, api.recordings.generateUploadUrl, api.recordings.deleteStorage and api.recordings.create (useDirectorPersistence.ts). TrackManager uses api.tracks.list, tracks.generateUploadUrl, tracks.add and tracks.remove. ScriptTemplatePicker uses api.shotboards.list, api.director.get and api.shotboards.load. ReferenceAssetManager uses api.assets.generateUploadUrl, assets.recordUpload and assets.getStorageUrl.
- **L22** All fal calls from the browser go through `FAL_SDK_PROXY_URL = '/api/fal/sdk-proxy'` (the FAL_KEY stays server-side). Frame remix and character sheet use `fal-ai/nano-banana-2/edit`. Do not add direct fal calls with keys in client code.
- **L23** dither-kit files (components/dither-kit/*) are pinned by sha256 in dither-kit.json. Do not edit them. Import and wrap them (DitherButton, DitherGradient, DitherAvatar, Sparkline) from new components instead.
- **L24** Clip capture semantics: one Convex clip row per applied direction version, deduped for the double `configured` / `prompt_applied` ack (clipSegVersionRef). Uploads are detached so they never block teardown. UI refactors must not move the rotateClip calls out of the handleData and onMedia paths.

#### 8.9.2 Director-related invariants from `states.md`, `fal.md` and `shell.md` (verbatim)

`states.md`:

- **S1** admin-testing skill (.agents/skills/admin-testing/SKILL.md): the Director card is the only Live Control content. Its button text is exactly 'Start Director'. A failed start must show an error AND restore the Start control. Per-page console must contain only the React DevTools info message, so loaders and animations must not console.log/warn. Do not add three.js forceContextLoss on unmount, because it logs 'THREE.WebGLRenderer: Context Lost.'.
- **S2** CONNECT_STEPS strings and order (DirectorPlayer.tsx:54-60): 'Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene'. The overlay 'Cancel' must call disconnect(). DIRECTOR_MODEL string 'minimax/h3-max/director' is displayed.
- **S3** Director strings and controls: 'Director offline', 'Stopping…', 'Session failed', 'Capture frame'/'Capturing…', 'Remix frame'/'Remixing…', 'Live', 'Ping · {n} ms', 'REC {bytes}', 'Record', 'Stop & save recording', 'Send direction', 'Stop', 'Uploading…', 'Session settings (locked once connected)', labels 'Next direction' / 'Opening prompt (the series premise)'. Mute button aria-label toggles 'Mute'/'Unmute'. The Record button appears only while live.
- **S4** Session semantics: settings `<details>` hidden while live or busy; 'Send direction' disabled unless live with a non-empty prompt; 'Queue on next direction' disabled unless live; 'Go live on Twitch' disabled unless live and a stream key exists.
- **S5** aria-labels to preserve: nav 'Admin sections'; 'Delete board'; 'Board visual style'; 'Move shot earlier'; 'Move shot later'; 'Delete shot'; `Image prompt for shot ${n}`; 'Move scene up'; 'Move scene down'; 'Delete scene'; 'Delete character'; 'Remove element'; 'Clear'; 'Image accordion gallery' (role=list); 'Coast audio artwork' (aria-roledescription carousel); 'Coast originals artwork carousel'; 'Previous song artwork'; 'Next song artwork'; 'Song artwork' tablist with `Show ${caption}` tabs; 'Music mix volume'; 'Music start offset'; `Delete ${track.name}`; `Preview ${track.name}`; 'Reference images'; 'Use as primary image'; 'Remove reference from this item'; DitherAvatar `${name} avatar` role=img.
- **S6** ids, classes and test hooks: `#audio-library-visual-test` (AssetStudioVisualFixture.tsx:45); `.asset-studio` wrapper on the library pages and fixture; `.pixel-card-latest` on the first clip/recording; `.fal-card`, `.fal-card-header`, `.fal-card-content`, `.fal-card-title`, `.fal-button-primary`, `.fal-button-secondary`, `.connection-indicator`/`.connection-connected`/`.connection-disconnected` (restyle, don't silently delete without updating callers). role=status/role=alert on library notice/error must remain announced, even if moved into toasts.
- **S7** Query-param contracts: `/admin/shotboard?board=<id>` preselects a board (useSearchParams) and needs a Suspense boundary; `/admin?transfer=<id>` and `/admin?board=<id>` are read by ScriptTemplatePicker; Twitch OAuth returns to `/admin?code&state` and TwitchBroadcast strips them with history.replaceState.
- **S8** Storage keys: localStorage 'wzrd_twitch_auth', sessionStorage 'wzrd_twitch_oauth_state', localStorage 'theme'. A new boot gate may add sessionStorage 'wzrd:boot' but must not collide with these.
- **S9** Convex calls unchanged: api.clips.list {limit:100}; api.recordings.list {limit:100}; api.recordings.remove (behind confirm('Delete this recording permanently?')); api.recordings.deleteStorage; api.tracks.list/generateUploadUrl/add/remove; api.assets.* (listCharacters, listLocations, create/patch, removeReference, seedStarterLibrary, startGeneration, completeGeneration, failGeneration, generateUploadUrl, listAssetHistory, getCharacter, recordUpload, getStorageUrl); api.shotboards.*; api.promptExpansion.start and .expand; api.director.prepare and .get; api.twitchStats.record and .history; useDirectorPersistence mutations. Hooks must stay mounted only under ConvexProvider (the `useConvexEnabled()` gates).
- **S10** fal access only via FAL_SDK_PROXY_URL / createFalClient({proxyUrl}) so FAL_KEY stays server-side. Adding onQueueUpdate/logs to fal.subscribe is fine; changing endpoints or inputs is not.
- **S11** dither-kit files (components/dither-kit/*) are hash-locked by dashboard/dither-kit.json: consume via props, imports and wrappers only. components/reactbits/* is not locked and may be edited.
- **S12** visual-test route must keep calling notFound() in production and must never mount Convex hooks.
- **S13** Chat steering safety: sanitisation and throttles (2s global, 8s per user) plus '!frame'/'!snap' commands; untrusted chat text is never rendered as HTML.

`fal.md`:

- **F1** Browser code must keep reaching fal ONLY through `/api/fal/sdk-proxy` (FAL_SDK_PROXY_URL in lib/directorProtocol.ts:4) and `/api/fal/proxy`. Both keep `export const runtime = 'edge'`. The offline brand script calls fal directly with server credentials and never goes through these routes.
- **F2** `export const DIRECTOR_MODEL = 'minimax/h3-max/director'` (DirectorPlayer.tsx:27) stays exported and stays displayed under 'Director (realtime WebRTC)'. The realtime `fal.realtime.open(wma(DIRECTOR_MODEL), …)` flow, CONNECT_STEPS labels and 'Cancel' button behavior must not change.
- **F3** `DirectorSettings.characterSheet` is a remix-only reference and is NOT sent to the model (directorProtocol.ts:24). Keep the 'Character sheet (optional)' field, placeholder 'Sheet URL or upload', helper copy 'Passed as a consistency reference to every Remix frame.', button labels 'Generate from first frame'/'Generating…' and character-name placeholder '$COAST'.
- **F4** aria-labels and roles that must survive: 'Image model', 'Image aspect ratio', 'Image variations', 'Output image format', 'Nano Banana resolution', 'GPT Image quality', 'Image background' (ImageGenerationControls.tsx); 'Clear' (AssetUrlInput.tsx:79); 'Mute'/'Unmute' (DirectorPlayer); role='status' on notices and role='alert' on errors in the Character and Location library pages.
- **F5** Visible strings used by flows and tests: 'Generate character sheet', 'Generating character sheet…', 'Sheet history', 'Use as primary reference', 'Generated sheets will remain here for review.', 'Load SF starters', 'New character', 'Capture frame', 'Capturing…', 'Remix frame', 'Remixing…', 'Director offline', 'Session failed', 'Stopping…', 'Loading character library…', 'Start with a reusable character', 'Convex is not configured. Character library changes are disabled.'
- **F6** Do not edit components/dither-kit/* (their hashes are locked in dither-kit.json). DirectorPlayer's `<DitherGradient from="blue" …>` stays as the base layer under any new boot video.

`shell.md`:

- **H1** Routes and nav: '/' redirects to '/admin' (app/page.tsx). AdminNav tabs, hrefs and labels are exact: '/admin' Live Control, '/admin/shotboard' Shotboard, '/admin/characters' Characters, '/admin/locations' Locations, '/admin/clips' Clips, '/admin/recordings' Recordings, '/admin/analytics' Twitch Analytics. Active matching: exact for '/admin', startsWith for the others. The nav landmark keeps aria-label="Admin sections". /admin/visual-test must keep notFound() in production and the id="audio-library-visual-test" section.
- **H2** middleware.ts behavior and exact 401 plain-text strings (the admin-testing SKILL.md step 3 depends on them), and `config.matcher: ['/admin/:path*', '/api/:path*']`. API routes /api/auth/convex, /api/fal/proxy, /api/fal/sdk-proxy, /api/twitch, /api/twitch/connect are untouched.
- **H3** ConvexClientProvider public API: default export wrapper, `useConvexEnabled()` hook, ConvexProviderWithAuth with useCloudflareAuth fetching '/api/auth/convex' with {credentials:'include', cache:'no-store'}, and the no-client fallback when NEXT_PUBLIC_CONVEX_URL is unset (must keep rendering children).
- **H4** SKILL.md test flow: the Live Control page's only content is the Director card; its primary button label is exactly 'Start Director' and must be restored after an error; 'Director Record' appears only during a live session; per-page console output must remain clean (only the React DevTools info message). No new console errors or warnings from WebGL, hydration mismatches, missing keys, or 404ed assets.
- **H5** Do NOT edit any file listed in dashboard/dither-kit.json (all of components/dither-kit/*: palette.ts, pixel.ts, button.tsx, lib.ts, charts...), because the sha256 hashes would break. Compose or wrap them instead (e.g. DitherButton `color` accepts a numeric hue; wrap children in an inline-flex span). Keep components.json registry '@dither-kit': 'https://tripwire.sh/r/{name}.json'.
- **H6** Live custom classes still referenced by code (either keep them working or migrate every call site in the same change): fal-card (17 live uses / 12 files), fal-card-header (8), fal-card-title (5), fal-card-content (17), fal-button-primary (2: CharacterLibraryPage.tsx:149, LocationLibraryPage.tsx:141), fal-button-secondary (31 / 15 files), connection-indicator / connection-connected / connection-disconnected (analytics/page.tsx:146-147), fade-in (layout.tsx:64), pixel-card-latest (clips/page.tsx:39, recordings/page.tsx:56), and the PixelCard CSS vars --pixel-card-border / --pixel-card-background / --pixel-card-active-color.
- **H7** Existing aria-labels in shell-adjacent controls must survive restyling (e.g. 'Admin sections', 'Image model', 'Image aspect ratio', 'Image variations', 'Output image format', 'Nano Banana resolution', 'GPT Image quality', 'Image background', 'Optional assets', 'Delete shot', 'Clear').
- **H8** Metadata title 'stream.wzrd.tech admin' and the brand strings 'WZRD.TECH' (logo alt), 'Stream Admin' and 'stream.wzrd.tech'. Visible identifiers such as `minimax/h3-max/director` must remain visible in the Director header.

#### 8.9.3 How §8 satisfies the items that change mechanism

| Items | Mechanism in the redesign |
|---|---|
| L2, S1, H4 ("the Director card is the only Live Control content") | The single `<section aria-label="Director">` instrument is the only Live Control content. SKILL.md gets the §8.9.5 replacement in PR 8B |
| L7, H8 | h2 'Director (realtime WebRTC)' + `aria-label="Director"` + `minimax/h3-max/director` stay visible in the label strip at every breakpoint |
| L9 | DirectorStage renders the one `<video>` unconditionally. Breakpoints move nodes only with CSS (§8.4 DOM order). Acceptance B3 checks node identity |
| L11 | `onUseForMix` (hook, E7) is called synchronously by 'Mix in output' (§8.5.10). Acceptance B27 checks the statement order |
| L12 | Rundown and Dock use `Tabs keepMounted`. Mobile panes use `display:none`. At 1024–1279 the Rundown and the Session sheet swap with `display: none`; both stay mounted. Nothing inside Live Control ever unmounts DirectorPlayer, ChatSteerer or TrackManager |
| L13 | `disconnect` moves verbatim (§8.5.2). 'Stop' (directly, or through the DEC-8-14 dialog while on air, §0.4 BC-11), 'Cancel', Esc (`director.cancel`), the palette 'Stop' and "Leave and stop" all call that same function |
| L16 | `useTwitchBroadcast` is called by DirectorPlayer at page load, so `?code&state` completes on mount exactly as `TwitchBroadcast.tsx:58-90` does |
| L18 | The theme mechanism is §7.13's ThemeProvider. The tint still follows `.dark`, and the key is still `'theme'` |
| L20 (the "Renames are acceptable…" clause) | **Stricter here:** D6 allows no renames on this page apart from §8.9.6 |
| S3 ('Live') | D6: 'Live · {n}s' becomes 'Live · HH:MM:SS' |
| S6, H6 (`.fal-*` classes) | Every Live Control call site migrates in 8B. §5.18's shims are deleted only when the app-wide last call site is gone |
| S8 (the "new boot gate" clause) | The boot gate uses `localStorage['wzrd:boot']` (the epoch-ms timestamp of the last full POST, §6.2.4; §0.4 BC-1), **not** `sessionStorage`. It collides with none of the three keys S8 lists, which stay unchanged |

#### 8.9.4 String, label, title and placeholder ledger (every Live Control string, with its 845147c location)

Every entry keeps its exact text (HTML entities as in the source; rendered `’` for `&rsquo;`), except where §8.9.6 lists a change. It may move to the component named in §8.5.

| File | Strings (exact) |
|---|---|
| `DirectorPlayer.tsx` | `minimax/h3-max/director` (27, visible 1055) · DEFAULT_PROMPT 'A continuous original live-action stream following a group of friends as they explore a new city.' (29-30) · CONNECT_STEPS 'Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene' **in this order** (54-60) · 'Director (realtime WebRTC)' (1054) · raw state `{state}`, now in `data-state` (1069) · 'REC {formatBytes}' (1074) · 'Cancel' (1104) · 'Stopping…', 'Session failed', 'Director offline' (1109) · aria-label 'Unmute'/'Mute' (1119) · 'Capture frame'/'Capturing…' (1131), title "Snapshot this frame → becomes the next end frame + next session's first frame" (1128) · 'Remix frame'/'Remixing…' (1141), title 'Evolve the captured frame with nano-banana-2 (same character, new shot)' (1138) · 'Live' + ' · {n}s' (1148-1149, D6) · 'Ping · {n} ms' (1151) · 'buf {n.n}s', 'gen {n.n}s' (1152-1153) · 'Session allowance: {m}:{ss}' + ' · about {N}m remaining' (1163-1165) · 'v{n} {status} — {text}' (1183) · 'Continuity frame set: {url}' (1189) · 'Session settings' + '(locked once connected)' (1197) · 'Next direction' / 'Opening prompt (the series premise)' (1214) · 'Applied: {activePrompt}' (1224) · 'End frame for next scene (optional)' (1230) · 'Replace audio track (optional)' (1234) · placeholders 'Image URL or upload' (1231), 'Audio URL or upload' (1235) · 'Start Director' (1251) · 'Stop' (1256) · 'Send direction' (1265) · 'Record' (1270) · 'Stop & save recording' (1282) · 'Uploading…' (1285) · '{size} uploaded' (331) · 'Prompt rejected: {reason}' (600) · 'Session close: {msg}' (903) · download name `director-${Date.now()}.webm` (302, 349) · every `appendLog` line text (206, 208, 245, 273, 298, 332, 334, 340, 342, 381, 392, 407, 446, 448, 499, 535, 539, 567, 601, 632, 698, 731, 768, 770, 806, 808, 837, 839, 855, 880, 946, 967, 978, 990, 1007, 1318, 1337) · fal inputs, unchanged: remix prompt (792, 797), sheet prompt (830), `'fal-ai/nano-banana-2/edit'` (795, 828) |
| `DirectorSettingsForm.tsx` | 'Resolution' (41) · '480p' '768p' '1080p' (47-49) · 'Aspect ratio' (53) · '16:9' '9:16' '1:1' (59-61) · 'Memory' + title 'Prior segment prompts kept as prompt-expansion context (1-50)' (65-66) · 'Seed' + title 'Fixes the opening setup; blank = random' (78-79) · placeholder 'random' (84) · 'Character name (optional)' (94) · placeholder '$COAST' (100) · 'Prefixed into chat directions + remix prompts.' (103) · 'Character sheet (optional)' (107) · placeholder 'Sheet URL or upload' (112) · 'Passed as a consistency reference to every Remix frame.' (116) · title 'Generate a turnaround/expressions sheet from the first frame (nano-banana-2)' (123) · 'Generating…'/'Generate from first frame' (125) · 'First frame (optional)' (134) · 'Last frame of first chunk' + ' (scripted)'/' (optional)' (147) · title 'Not available while a script is queued for this session' (145, 162) · 'Target audio' + suffix (164) · 'Audio bitrate' (175) · '96 kbps' '128 kbps' '192 kbps' (181-183) · 'Locked at connect; reconnect to compare.' (185) |
| `TwitchBroadcast.tsx` | keys `'wzrd_twitch_auth'`, `'wzrd_twitch_oauth_state'`, scope `'channel:read:stream_key'` (12-14) · 'OAuth state mismatch — try Connect to Twitch again' (67) · 'Connect failed' (79, 86) · 'Twitch connected as {login}' (84, log) · 'Twitch broadcast stopped (session ended)' (102, log) · 'NEXT_PUBLIC_TWITCH_CLIENT_ID is not configured — paste a stream key instead' (109) · `redirect_uri: ${origin}/admin` (116) · `https://id.twitch.tv/oauth2/authorize?` (121) · 'Twitch broadcast stopped' (134, log) · 'Broadcasting to Twitch (WHIP H264+Opus)' (154, log) · 'Broadcast failed' (156) · 'Twitch broadcast' (169) · 'connected as {login}' (174) · title 'Forget the stored Twitch connection' (178) · 'Disconnect' (180) · 'Connecting…'/'Connect to Twitch' (190) · 'Stop broadcast' (198) · title 'Push the live Director output to Twitch ingest' / 'Start the Director session first' (205) · 'Negotiating…'/'Go live on Twitch' (208) · '● pushing to Twitch ingest — viewers see the stream on your channel' (214) · 'Paste a stream key instead' (220) · placeholder 'live_… stream key' (226) |
| `lib/twitchWhip.ts` (read-only) | `TWITCH_WHIP_URL = 'https://g.webrtc.live-video.net:4443/v2/offer'` (4) · 'No video track on the live stream' (29) · 'No local SDP offer produced' (58) · 'Twitch ingest rejected the offer ({status})' (68) |
| `ChatSteerer.tsx` | default prefix `'!direct'` (33) · `'!frame'`/`'!snap'` (81) · throttle 2000/8000 ms (96, 98) · 'Chat steering' (137) · 'listening'/'offline' (144) · 'Anonymous read-only IRC on #{ch \|\| '…'}. While the stream is live, {command \|\| '!direct'} &lt;text&gt; messages are sent as directions with the chatter’s name, and !frame snapshots the current frame for scene continuity — steering alongside the script.' (150-153) · 'Connect' (163) · 'Disconnect' (171) · 'Chat can direct' (181) · title 'Command prefix' (188) · DitherAvatar aria-label `${name} avatar`, `role="img"` (`dither-kit/avatar.tsx:193-194`) |
| `ScriptEditor.tsx` | console.warn 'shotboard template picker unavailable:' (34) · 'Script' (76) · '{n} beat{s}' + ' · beat @{X}s playing' (79-80) · 'Timed shots the model runs on its own clock — each beat’s direction starts at its offset and holds until the next one. Sent with the session, or pushed live to replace/append the queue.' (86-87) · title 'Offset in seconds' (112) · 's' (114) · placeholder 'Direction for this shot…' (119) · aria-label 'Optional assets' (126) · aria-label 'Delete shot' (134) · 'End frame at this offset' (142) · 'Audio starting at this offset' (150) · 'Add shot' (170) · title 'Cut to this script at the next chunk' + 'Cut to script' (180, 183) · title 'Queue after the running script' + 'Queue script' (190, 193) · 'Send with session start' (205) |
| `ScriptTemplatePicker.tsx` | `?board=` / `?transfer=` read (49-50) · 'Prepared Director transfer' (64) · 'Open shotboard editor' → `/admin/shotboard` (101-103) · title 'Autofill the script from a saved shotboard' (118) · 'Load template…' (120) · 'Untitled' (123) · 'edit' → `/admin/shotboard?board={id}` (128-131) |
| `TrackManager.tsx` | 'Upload failed ({status})' (63) · ' — and the uploaded file could not be cleaned up' (78) · 'Audio library' (97) · 'Upload song' (116) · 'Loading…' (121) · 'No songs yet — upload one to use it as the stream's audio reference.' (124) · aria-label 'Coast originals artwork carousel' (128) · 'Coast originals · {n} tracks' (145; §8.9.6) · aria-label `Delete ${track.name}` (179) · aria-label `Preview ${selectedTrack.name}` (190) · 'Volume' (191) · aria-label 'Music mix volume' (192) · '{n}%' (193) · 'Start (s)' (195) · aria-label 'Music start offset' (196) · 'Loop' (198) · title 'Use as the target audio on the next session connect' + 'Use for session' (202, 204) · title 'Replace the stream audio on the next direction you send' + 'Queue on next direction' (210, 212) · title 'Mix the song with Director speech and effects in preview, recordings, clips, and Twitch' + 'Mix in output' (218, 220) |
| `reactbits/MorphSlider.tsx` | `role="group"` `aria-roledescription="carousel"` aria-label 'Coast audio artwork' (545) · caption `aria-live="polite"` (548) · 'Previous song artwork', 'Next song artwork' (550-551) · tablist 'Song artwork' (553) · tabs `` Show ${caption ?? `cover ${n}`} `` (554) |
| `AssetUrlInput.tsx` | default placeholder `Paste ${kind} URL` (50) · 'Upload' (71) · aria-label 'Clear' (79) · thumbnail `alt=""` (87) |

**Storage and URLs:** `localStorage['theme']`, `localStorage['wzrd_twitch_auth']` `{login, streamKey}`, `sessionStorage['wzrd_twitch_oauth_state']`, and the new `localStorage['wzrd:dock']` (`'open' \| 'collapsed'`). URL parameters `?board=`, `?transfer=`, and `?code&state` (stripped with `history.replaceState`, `TwitchBroadcast.tsx:65`). Deep links in: `/admin?transfer=<id>` (from `ShotboardPage.tsx:260`). Links out: `/admin/shotboard` and `/admin/shotboard?board=<id>`.

**Convex** (via `useDirectorPersistence`, TrackManager and ScriptTemplatePicker; names and arguments are unchanged): `api.sessions.create`, `api.sessions.setStatus`, `api.promptEvents.log`, `api.clips.create`, `api.clips.attachMedia`, `api.recordings.generateUploadUrl`, `api.recordings.deleteStorage`, `api.recordings.create`, `api.tracks.list`, `api.tracks.generateUploadUrl`, `api.tracks.add`, `api.tracks.remove`, `api.shotboards.list`, `api.director.get`, `api.shotboards.load`. `createSession` config `{ model: 'director', outputMode: 'webrtc', config: { model, prompt, resolution, aspectRatio, memory, seed, scriptBeats } }` (`:932-944`); recording `model: 'director'`, `title: activePrompt` (`:322-330`); clip `source: 'director'` (`:489-496`).

#### 8.9.5 admin-testing SKILL.md dependencies

| SKILL.md line (845147c) | Dependency | Kept by |
|---|---|---|
| 12 | A button whose accessible name is exactly **Start Director**, visible when idle | transport slot 2 (`!live && !busy`); count exactly 1 |
| 12 | "Append a unique prompt" to an editable textarea, then start | the composer `#lc-composer`, labelled 'Opening prompt (the series premise)', prefilled with DEFAULT_PROMPT. `connect()` sends that value in `configure`. At 1024–1279, open the Rundown first |
| 12 | "verify an error plus restored Start control" | AlertTray `role="alert"` + slot 2 back to 'Start Director' |
| 13 | Console holds only the React DevTools info message | §1.6 allowed table. Live Control adds no probes, no `forceContextLoss` and no logging |
| 14 | "Director Record appears only during a live session" | slot 3 `live && !recording` |
| 9–10 (steps 2–3) | The unconfigured environment and the production 401 gate | unchanged |

**Replacement text for SKILL.md step 5, applied in PR 8B.** These are factual edits only (§1.9). Keep the front matter and the "Devin Secrets Needed" section.

> 5. Use the seven admin tabs (Live Control, Shotboard, Characters, Locations, Clips, Recordings, Twitch Analytics); `/admin/visual-test` exists in dev only. Live Control renders one Director instrument, `section[aria-label="Director"]` with the heading 'Director (realtime WebRTC)': Session sheet, program monitor, transport bar, Rundown (Direction, Chat, Events) and Dock (Script, Audio; Audio only with Convex). Its start button is **Start Director** in the transport bar; the premise is the 'Opening prompt (the series premise)' textarea in the Rundown's Direction tab (at 1024–1279 px wide, open the Rundown with the 'Rundown' button first; it replaces the Session sheet in the left column). Append a unique prompt, start, and verify an error in the `role="alert"` tray under the transport plus a restored Start Director control. Without credentials, the SDK may report an upstream auth error rather than a local missing-key message.

#### 8.9.6 Allowed changes on this page (exhaustive) and new strings

**Allowed changes to existing strings and structure:**
1. 'Live · {n}s' becomes 'Live · HH:MM:SS' (D6, O15).
2. The raw state pill text (`idle`/`opening`/`live`/`closing`/`failed`/`closed`) becomes the state words 'Standby', 'Tuning', 'Preview', 'Stopping', 'Failed', 'Off air' (`closed` reads 'Failed' when no first frame arrived in the attempt, DEC-8-08). The raw value stays in `data-state` on `[data-testid="lc-state-word"]`.
3. Heading levels change and the text does not: 'Director (realtime WebRTC)' goes from h3 to h2, 'Audio library' from h2 to h3, and 'Twitch broadcast' from `<span>` to h3.
4. The coloured `●` bullet before queue rows (`:1181`) becomes an `<Led>` (the status word is still visible). The `●` in '● pushing to Twitch ingest…' stays.
5. `Coast originals · {n} tracks` rendered through `uppercase` becomes the authored `COAST ORIGINALS · {n} TRACKS` with the class removed. The rendered case is identical. The edit lands in M2 (§5.20.5 row 10) and its `backdrop-blur` goes in 1B (§5.10); it is listed here because it is this page's string.
6. Strings move but do not change: 'Uploading…' and '{size} uploaded' to the telemetry tape cell; mute, capture and remix to the transport; 'Continuity frame set:' to the TalentCard; 'Send direction' to the composer; the log to Events; 'Loading…' (TrackManager) into sr-only `role="status"` text beside a skeleton.
7. Behaviour decisions made by this spec, labelled `DEC-8-<nn>` (§1.7; a decision Devin makes in a PR uses `DEC-M<n>-<nn>`). Each decision that changes what an operator action does is a row of §0.4 and names it here. Every §0.4 row applies by default; the owner vetoes one with `OVERRIDE D10: <BC-id>` (§2.2 D10), and Devin then keeps the 845147c behaviour for that row and records it under "Decisions". An entry marked "no §0.4 row" changes presentation or internals only.
   - DEC-8-01 (§0.4 BC-10): the composer lifecycle (§8.5.6).
   - DEC-8-02 (§0.4 BC-11): 'Stop' is click-guarded while `closing`.
   - DEC-8-03 (§0.4 BC-6): 'Go live on Twitch' also requires the first frame.
   - DEC-8-04 (§0.4 BC-15): the artwork carousel is display-only. Autoplay stays (`autoplayDelay={6}`, D3) and pauses under the air lock, under reduced motion, while the dock is collapsed, while the Audio tab is hidden and while the page is hidden. `onIndexChange={setShownIndex}` only records the slide shown, so no slide change (autoplay, previous/next, the 'Show {caption}' tabs, drag, ←/→) arms a track; a track is armed only through the 'Armed track' radiogroup or 'Arm this track' on the current slide. At 845147c `onIndexChange={selectSliderTrack}` armed whichever slide was shown (§3.7 #1). 'Expand artwork' opens the carousel in a Sheet at up to 480×480, and only one MorphSlider instance is ever mounted (§8.5.10).
   - DEC-8-05 (no §0.4 row): the error can be dismissed.
   - DEC-8-06 (§0.4 BC-7): the pushing line shows only when `air === 'on'`, and `air` follows the §8.5.6 truth gate. While `cue`, only `connectionState === 'failed'` (or a thrown negotiation) returns to `off`; `disconnected`, or no truth gate within 10 000 ms, keeps `cue` with the 'Twitch ingest not confirmed' warning chyron, and a timeout never tears the session down.
   - DEC-8-07 (§0.4 BC-3): "Leave and stop" runs the full `disconnect()` before navigating.
   - DEC-8-08 (no §0.4 row): `closed` after a first frame shows the standby slate ('Off air'); `closed` with no first frame in the attempt shows the FailedSlate ('Failed'). Neither shows 'Cancel'.
   - DEC-8-09 (§0.4 BC-12): the log keeps 500 non-debug entries plus 100 debug entries, with debug hidden (the 50-line cap is removed).
   - DEC-8-10 (§0.4 BC-14): track rows are radios, so clicking the armed row keeps it armed instead of disarming it; the first radio, 'No track', disarms (`armed === null`), which keeps the 845147c ability to leave no track armed.
   - DEC-8-11 (no §0.4 row): beats are keyed by a client id.
   - DEC-8-12 (no §0.4 row): the template picker shows a skeleton while loading.
   - DEC-8-13 (§0.4 BC-13): `!frame`/`!snap` obey a 10 s global and 8 s per-user throttle (`lastFrameAtRef`, `lastFrameByUserRef`); a throttled frame command gets the `THROTTLED` badge. The direction throttle (`ChatSteerer.tsx:94-100`) is byte-identical.
   - DEC-8-14 (§0.4 BC-11): while `air ∈ {on, stalled}`, 'Stop' and the palette's 'Stop' first open the 'Stop the Director?' dialog; otherwise Stop acts at once. 'Stop' ignores activations for 600 ms after it mounts and ignores `keydown` with `event.repeat`.

   §8 also carries these §0.4 rows, which have no `DEC-8` id: BC-2 (the air lock, §8.6.6), BC-4 (`beforeunload` and the blocked mouse back/forward buttons, §8.6.6), BC-5 (hold-to-take, §8.5.7 and §8.6.5) and BC-9 (the keyboard map and command palette, §8.5.12 and §8.8).

**New strings (not preserved; Appendix A lists them as §8-owned):**
- **Kickers:** `SESSION`, `TALENT`, `SHEET`, `FIRST FRAME`, `NONE`, `NEXT SESSION`, `PREFLIGHT`, `LOCKED`, `PREMISE`, `QUEUE`, `AIR`, `STAND BY`, `SIGNAL LOST`, `ERROR`, `NOT PATCHED`, `DEBUG`, `INFO`, `WARN`, `DIRECT`, `THROTTLED`, `FRAME`, `COAST ORIGINALS · {n} TRACKS`.
- **Tab labels:** 'Direction', 'Chat', 'Events', 'Session', 'Script', 'Audio'.
- **Controls:** 'Rundown', 'Close rundown', 'View events', 'Dismiss error', 'Collapse dock', 'Expand dock', 'End frame', 'Audio', 'Show debug', 'Copy log', 'Copied', 'Captured', 'Remixed', 'Log level' with 'All', 'Warnings' and 'Errors', 'Go live', 'Not yet', 'Leave and stop', 'Stay', 'Ending session…', 'Stop and end broadcast', 'Keep running', 'Connecting…' (Chat Connect), 'No track' (the first 'Armed track' radio), 'Arm this track', 'Expand artwork'. The 'End broadcast' action of the stalled and the cue warning chyrons is §6.7's string, and the cue warning's 'Dismiss' is §6.10's.
- **Accessible names:** 'Program output', 'Armed track', 'Stream key', 'Command prefix' (aria-label; equal to the existing title), 'Offset in seconds' (aria-label; equal to the title), 'Direction for this shot', 'Beat at {n} seconds: {prompt}', 'Script beats', 'Connection progress'.
- **Copy:**
  - Slates and plates: '⌘↵ to start' / 'Ctrl+↵ to start' (rendered through `Kbd`), 'Loading Live Control', 'Locked for this session:', and the diagnostic-line mask `[addr]` (§8.5.6).
  - Tooltips: none of its own; the dock collapse control uses the lock reason 'Locked while on air' (§6.12's string).
  - Preflight rows and fixes (§8.5.8).
  - Empty states: 'Directions you send appear here with their version.', 'Chat lines appear here once connected.', 'No events yet.'
  - Chat banner: 'Set NEXT_PUBLIC_TWITCH_CHANNEL to listen to chat.'
  - Unlit telemetry: `SESSION`, `--:--:--`, 'Session allowance: --', 'Ping · -- ms', 'buf --s', 'gen --s', and the `AIR` kicker's disabled `00:00:00`.
  - Dialogs: 'Go live on Twitch?', with the bodies 'Viewers on twitch.tv/{auth.login} will see program output.' and 'Viewers on the channel bound to this stream key will see program output.'; 'Leave Live Control?' with 'Leaving Live Control ends the Director session and the broadcast.'; 'Stop the Director?' with 'Stopping ends the session and the Twitch broadcast.'; the artwork Sheet title 'Coast originals artwork'.
  - Chyron: the cue-failure chyron, title "Couldn't start the Twitch broadcast" and body 'Twitch ingest never received media. Try again.'. The stalled chyron ('Twitch ingest lost') and the cue warning chyron ('Twitch ingest not confirmed') are §6.7's, and so are the lamp words `CUE` and `CUE {MM:SS}`.
  - Status messages: 'Session allowance reached · the Director stopped', 'About {5|1}m of session allowance left'.
  - Announcements (§8.8).

### 8.10 Acceptance criteria

- **Working directory.** Commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`. A path that contains `(live)` is quoted, for example `'app/admin/(live)/page.tsx'`.
- **Run modes** (§1.6). Browser checks use Playwright in **dev** at `/admin?noboot`, in both themes, unless a check says **prod** or **fixture**. **Fixture** means dev at `/admin/visual-test?noboot#live-control-visual-test`; fixture checks never run on prod, where the route is 404. **Store publish** means calling `window.__wzrd.broadcast.publish(…)` in dev (§7.17, from 3A); `publish({ director: 'live', firstFrame: true })` sets the air lock.
- **fal stub.** Every automated check that clicks 'Start Director' or presses Control+Enter in the idle composer first calls `page.route('**/api/fal/**', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"qa-stub"}' }))`. Devin never runs a live Director session: a check that needs one is "Human operator only" and is recorded under "Deferred / blocked" as "not run (paid)".

**PR 8A: Extract (no behaviour change)**
- [ ] A1. The §8.5.4 proof is pasted: `tests/live-extraction.spec.ts` passes per §14.12 step 7 (an empty DOM diff, and `maxDiffPixels: 0` for idle-dark, idle-light, idle-390 and failed-dark), and the step 6 `route-sizes.mjs --compare` run exits 0.
- [ ] A2. `wc -l < components/DirectorPlayer.tsx` prints ≤ 320. `grep -c "export { DIRECTOR_MODEL } from './director/constants'" components/DirectorPlayer.tsx` prints `1`. `grep -rn "'minimax/h3-max/director'" components | wc -l` prints `1`.
- [ ] A3. `grep -rnE "set(PingMs|BufferDepth|GenEstimate|ElapsedSeconds|RecordedBytes|Log)\(" components | wc -l` prints `0`. `grep -c "setInterval(" components/director/useDirectorSession.ts` prints `1`, and no other file under `components/director` or `components/DirectorPlayer.tsx` contains `setInterval(`.
- [ ] A4. `grep -c "LOG_CAP = 500" components/director/eventLog.ts` prints `1`. `grep -c "DEBUG_CAP = 100" components/director/eventLog.ts` prints `1`. From 8B, in the fixture, the EventConsole preloaded with 600 `info` entries renders exactly 500 rows (`[data-testid="lc-log-row"]`), and the first row reads `fixture 600`.
- [ ] A5. `git diff --stat 845147c -- lib/directorProtocol.ts lib/twitchWhip.ts components/useDirectorPersistence.ts components/DirectorPanel.tsx components/dither-kit` prints nothing (this repeats in every Live Control PR).
- [ ] A6. `grep -c "protocol_version" components/director/useDirectorSession.ts` prints `1` (only `configure`). `grep -c "sendPrompt(prompt, true)" components/director/useDirectorSession.ts` prints `1`.
- [ ] A7. The §1.6 flow passes, and the per-route console matches the §1.6 allowed table exactly.

**PR 8B: Instrument**
- [ ] B1. `document.scrollingElement.scrollHeight <= innerHeight` on `/admin` at 1024×768, 1280×800, 1440×900 and 1920×1080. It still holds with `localStorage['wzrd:dock']='open'` at 1280×800.
- [ ] B2. `[data-testid="lc-program-screen"]` `boundingBox()` is within ±1 px of: 686×386 at 1440×900 (dock open), 654×368 at 1280×800 (collapsed), 1006×566 at 1920×1080 (open) and 658×370 at 1024×768 (collapsed). After choosing '9:16' in Session settings at 1440×900 (open) it is 217×386, and after '1:1' it is 386×386.
- [ ] B3. `document.querySelectorAll('video').length === 1` on `/admin` in idle, opening and failed. A marker set before Start (`document.querySelector('video').__lc = 1`) is still present after the failed-start flow and after resizing 1440 → 1100 → 390 → 1440.
- [ ] B4. `getByRole('button', { name: 'Start Director' })` has count `1` and lies fully inside the viewport, idle, at 1280×800 and at 390×844.
- [ ] B5. Failed start (§1.6 step 3, with the fal stub): the tray element is `<div data-testid="lc-alert-tray" role="alert">`, and `[data-testid="lc-alert-tray"][role="alert"]` has non-empty text, 'Start Director' is visible again within 30 s, and `[data-testid="lc-state-word"]` has `data-state` ∈ {`failed`, `idle`, `closed`}. 'View events' selects the Events tab (`aria-selected="true"`), which lists at least one `ERROR` row. At 1280×800 and at 1440×900 the tray passes `toBeInViewport()`, and `document.elementFromPoint(trayCenterX, trayCenterY)` is inside the tray.
- [ ] B6. `getByRole('button', { name: 'Record' })` count is `0` in idle and in failed.
- [ ] B7. On a fresh load, `getByLabel('Opening prompt (the series premise)')` is a `<textarea>` whose value equals DEFAULT_PROMPT, and it is editable. After typing ` qa-slate` into it, the text of `[data-testid="lc-program-screen"]` contains `qa-slate`.
- [ ] B8. Idle: exactly one `summary` with text 'Session settings (locked once connected)'. During `opening` (hold it open with the B9 route delay), that summary has count `0`, and the LockedSettings chips include `768p` and `16:9`.
- [ ] B9. Keyboard. Install the fal stub with a 5000 ms delay before `r.fulfill(…)`, so the session stays `opening`. With focus in `#lc-composer`, idle, `Control+Enter` makes `data-state` `opening` within 1 s. `Escape` then reaches `idle` within 10 s, with 'Start Director' visible. Fixture composer (live mode): type `a`, press `Control+Enter`, type `b`, press `Control+Enter`, then `ArrowUp` gives `b` and `ArrowUp` again gives `a`.
- [ ] B10. In the fixture "acquiring" state, the `ol[aria-label="Connection progress"]` label spans read exactly `['Network checked','Finding a machine','Connecting','Building world','Generating first scene']` in order (the sr-only state suffixes excluded), and a button named exactly 'Cancel' exists.
- [ ] B11. Fixture screenshots of every §8.5.13 state in dark and light match the committed baselines (§15), with the TrackDeck artwork kept stable the §15.4 way, never with a Playwright `mask:` (§15.11): its autoplay advances every 6 s, so the paused fake clock (`page.clock.pauseAt`) freezes it and `tests/screenshot.css` hides its canvas (`.morph-slider-stage canvas`), and transport slot x-positions are identical between the idle and preview fixtures (no reflow).
- [ ] B12. `grep -c "autoplayDelay={6}" components/TrackManager.tsx` prints at least `1` (D3 keeps autoplay). `grep -c "selectSliderTrack" components/TrackManager.tsx` prints `0`, and `grep -n "onIndexChange=" components/TrackManager.tsx | grep -v "onIndexChange={setShownIndex}"` prints nothing, so no slide change reaches the armed track (DEC-8-04). Every aria-label in the §8.9.4 TrackManager and MorphSlider rows is found by `grep -F`.
- [ ] B13. In a fresh context with `localStorage['wzrd:dock']='collapsed'`, `document.documentElement.dataset.dock` is `'collapsed'` at `DOMContentLoaded`. The sum of `layout-shift` entries during load is `0`. With no stored value at 1440×900, `data-dock` is `'open'`, and at 1280×800 it is `'collapsed'`.
- [ ] B14. The Appendix A preserved-strings check (§15) passes for every §8.9.4 entry.
- [ ] B15. `@axe-core/playwright` reports 0 serious and 0 critical violations on `/admin` idle and failed, in dark, light and at 390 px.
- [ ] B16. `tests/contrast.spec.ts` passes in both themes. `grep -cE "text-accent|text-fg-2" components/director/DirectorStage.tsx` prints `0` (HUD plates use on-screen text only).
- [ ] B17. `grep -rnE "animate-pulse|animate-spin|Loader2|backdrop-(blur|filter)|violet-|#090713|#0c0c12" components/director components/DirectorPlayer.tsx components/TrackManager.tsx components/ChatSteerer.tsx components/ScriptEditor.tsx components/ScriptTemplatePicker.tsx components/TwitchBroadcast.tsx components/AssetUrlInput.tsx components/DirectorSettingsForm.tsx | wc -l` prints `0`.
- [ ] B18. Canvas and slot audit on `/admin` idle: exactly one WebGL context. `window.__wzrd.slots` shows one holder, `symbol-raster` (priority 1). After 10 theme toggles there is still one context and no console output.
- [ ] B19. Render budget. On the fixture, after 5 s, `window.__wzrd.renders.LiveFixtureRoot` is ≤ 2 and `window.__wzrd.renders.LiveClock` is ≥ 5. On `/admin` idle, `window.__wzrd.renders.DirectorPlayer` does not change over 5 s.
- [ ] B20. At 390×844, after `window.scrollBy(0, 400)`, the top of `[data-testid="lc-bezel"]` is 136 ±1 px (sticky: 92 + 40 strip + 4 gap), the transport's bottom equals `innerHeight − 24` (±1), and the five mobile tabs (six with Convex) switch panes without changing the `video` marker from B3. At 390×667 with no stored `wzrd:dock` value, selecting the 'Script' mobile tab makes `#lc-dock-body` visible, and the monitor block is `position: static` (height ≤ 740).
- [ ] B21. At 1100×800, `.lc-rundown` computes `display: none` and `.lc-session` is visible. Clicking 'Rundown' hides `.lc-session`, shows `.lc-rundown` with the same `boundingBox().x` and width as the Session sheet had, and moves focus into its selected tab. Clicking 'Close rundown' restores the Session sheet and returns focus to the 'Rundown' button. At 1024×768 with the Rundown open, the bounding boxes of `.lc-rundown` and `[data-testid="lc-program-screen"]` do not intersect, and 'Go live on Twitch' is fully inside the viewport.
- [ ] B22. From the repository root, `grep -c 'section\[aria-label="Director"\]' .agents/skills/admin-testing/SKILL.md` prints `1`, and `grep -c "four admin tabs" .agents/skills/admin-testing/SKILL.md` prints `0`.
- [ ] B23. `/admin` First Load JS is ≤ 360 kB in the `npm run qa:build` table (`.qa/build.log`; baseline 348 kB). SymbolRaster and MorphSlider are loaded through `next/dynamic` with `ssr: false` (`grep -n "dynamic(" components/director/DirectorStage.tsx components/TrackManager.tsx`), and `head -1` of both files prints `'use client'`.
- [ ] B24. Prod: unconfigured `/admin` has desktop LCP ≤ 1.8 s.
- [ ] B25. `grep -rn "console\." components/director lib/broadcast | wc -l` prints `0`.
- [ ] B26. Configured and manual only (list under "Deferred / blocked" when there are no credentials): with Convex set, toggling the Audio tab 20 times and opening and closing 'Expand artwork' 10 times prints no console output, and `window.__wzrd.slots` never shows two holders.
- [ ] B27. `primeMusic` ordering. `node -e "const s=require('fs').readFileSync('components/director/useDirectorSession.ts','utf8');const i=s.indexOf('const onUseForMix = useCallback(');if(i<0)process.exit(1);const b=s.slice(i,i+400);const p=b.indexOf('primeMusic(config)'),m=b.indexOf('setMusicConfig(config)');if(!(p>=0&&p<m))process.exit(1)"` exits 0, and the 'Mix in output' `onClick` in `TrackManager.tsx` calls `onUseForMix(` with no `await` before it.
- [ ] B28. Phone transport. At 360×740 and at 390×844 with `hasTouch: true, isMobile: true`, the transport's `scrollWidth <= clientWidth`, and 'Start Director' and 'Go live on Twitch' lie fully inside the viewport.
- [ ] B29. In the fixture's on-air state at 1440×900, the WHIP cell's bounding box lies inside the telemetry strip's visible box.
- [ ] B30. Offline. At 1440×900 on `/admin`, after `context.setOffline(true)`, `html[data-offline]` is present, `document.scrollingElement.scrollHeight <= innerHeight`, and the top of the label strip is ≥ the OfflineBanner's bottom.
- [ ] B31. `grep -cE "lastFrameAtRef|lastFrameByUserRef" components/ChatSteerer.tsx` prints ≥ 4, and `git diff 845147c -- components/ChatSteerer.tsx | grep -E '^-.*(2000|8000|lastDirection)'` prints nothing (no direction-throttle line is removed or changed, DEC-8-13, §0.4 BC-13).
- [ ] B32. `WZRD_MILESTONE=6b npx playwright test --project=unit tests/unit/diagnostic.spec.ts` passes (the §15 `unit` project, no browser). It checks `formatDiagnostic`: a `network-path` progress event with `local: 'srflx/udp 203.0.113.7:54321'`, `remote: 'relay/udp 198.51.100.2:3478'`, `usesTurn: 'no'` and `rttMs: 42` gives `network-path · usesTurn no`; an `ice-servers` event with `source: 'ice-endpoint-failed: 203.0.113.7 timed out'` gives `ice-servers · source ice-endpoint-failed: [addr] timed out`; a value holding `2001:db8::1` is masked to `[addr]`; a `warning` event with message `x` gives `warning: x`.
- [ ] B33. Display-only artwork and 'No track' (fixture; DEC-8-04, §0.4 BC-15; DEC-8-10, §0.4 BC-14). Switch the `#audio-library-visual-test` MorphSlider specimen's 'Artwork slot' off (§10.5.9) so the `morph` slot is free, scroll the fixture TrackDeck's `section[aria-label="Coast originals artwork carousel"]` into view, move the pointer to (0, 0), and wait until that section contains a `canvas` (≤ 5000 ms). In the TrackDeck's `[role="radiogroup"][aria-label="Armed track"]`, exactly one radio has `aria-checked="true"`, and its name starts with 'fixture track 1'. Then:
  1. Click 'Next song artwork', then the tab 'Show fixture track 3', then move the pointer to (0, 0) and wait until the selected tab of the 'Song artwork' tablist changes with no input (autoplay, ≤ 7000 ms). After each of the three changes, the only checked radio still starts with 'fixture track 1'.
  2. Click 'Arm this track': the only checked radio's name starts with the text of `.morph-slider-caption-text`.
  3. Click the radio 'No track': it has `aria-checked="true"`, it is the only checked radio in the group, and the deck contains no `audio[aria-label^="Preview "]`.
  4. Click 'Expand artwork' at 1440×900: a `dialog[data-sheet]` titled 'Coast originals artwork' opens, `document.querySelectorAll('.morph-slider').length` is `1`, that element is inside the dialog, and its bounding box is at most 480×480. Press `Escape`: within 5000 ms the count is still `1` and the element is inside the Dock's artwork section.

**PR 8C: Air**
- [ ] C1. Store publish `{ director: 'live', firstFrame: true }` and then `{ air: 'on', airSince: Date.now() }` gives `html[data-broadcast="on-air"]`, `document.title === '● ON AIR · stream.wzrd.tech admin'`, a `link[rel=icon]` href ending in `/brand/icons/favicon-onair.svg`, and a computed `box-shadow` on `[data-testid="lc-bezel"]` containing `rgb(255, 59, 48)`. Publishing `{ air: 'stalled', stalledSince: Date.now() }` removes that box-shadow and pushes exactly one `role="alert"` chyron (BroadcastProvider's, §6.7) with a button named 'End broadcast'. Publishing `{ air: 'off' }` restores the previous title.
- [ ] C2. Store publish `{ director: 'live', firstFrame: true }` gives `html[data-lock="air"]`. Clicking the AppNav link 'Shotboard' opens a dialog containing 'Leaving Live Control ends the Director session and the broadcast.' and the buttons 'Stay' and 'Leave and stop'. Clicking 'Stay' leaves the URL at `/admin`. The Dock collapse control has `aria-disabled="true"`. `grep -c "onNavigate={guard(" components/ScriptTemplatePicker.tsx` prints `2`. Configured only (Convex; list under "Deferred / blocked" otherwise): under the lock, clicking 'Open shotboard editor' or 'edit' in Dock › Script opens the same dialog and the URL stays `/admin`.
- [ ] C3. `WZRD_MILESTONE=6b npx playwright test tests/whip-truth.spec.ts` passes. It exercises `nextAir` with: `cue` + connected + growing bytes → `on`; `on` + 4 flat polls → `stalled`; `on` + `connectionState: 'failed'` → `stalled`; then growth again → `on` with `airSince` unchanged; `cue` + `failed` → `off`; `cue` + `disconnected` → `cue` with `cueUnconfirmed: true`; `cue` with `now − cueSince = 10000` and no gate → `cue` with `cueUnconfirmed: true`; `cue` with `now − cueSince = 60000` and no gate → still `cue` (no timeout ever gives `off`); `cue` with 4 flat polls and `now − cueSince = 9999` → `cue` with `cueUnconfirmed` not `true`; `cue` with `cueUnconfirmed: true`, then connected + growing bytes → `on`.
- [ ] C4. In every fixture state, `getByRole('button', { name: 'Stop broadcast' })` count is ≤ 1 and `getByRole('button', { name: 'Go live on Twitch' })` count is ≤ 1. In idle the Go live button is disabled and its `title` is 'Start the Director session first'. A click (no hold) on an enabled Go live in the fixture opens a dialog titled 'Go live on Twitch?' with the buttons 'Not yet' and 'Go live'.
- [ ] C5. `git diff 845147c -- lib/twitchWhip.ts` prints nothing. `grep -c "getStats" lib/broadcast/useWhipTruth.ts` prints ≥ 1.
- [ ] C6. Long tasks while on air: covered by §15.6 'Live Control with the store on air' (no long task over 50 ms in any 10 s window at 4× CPU throttle). A real-session run is Human operator only and is recorded as "not run (paid)".
- [ ] C7. Stop while on air (DEC-8-14, §0.4 BC-11). In the fixture's on-air state, clicking 'Stop' opens a dialog titled 'Stop the Director?' with the body 'Stopping ends the session and the Twitch broadcast.' and the buttons 'Keep running' and 'Stop and end broadcast'. In the preview state, clicking 'Stop' opens no dialog.
- [ ] C8. Cue not confirmed, end to end (dev, `/admin`; DEC-8-06, §0.4 BC-7). Store publish `{ director: 'live', firstFrame: true }`, then `{ air: 'cue', cueSince: Date.now() - 12000, cueUnconfirmed: true }`: exactly one chyron starts with 'Twitch ingest not confirmed' and holds the buttons 'End broadcast' and 'Dismiss', and the TallyBar ON AIR lamp text matches `/^CUE \d\d:\d\d$/`. Clicking 'End broadcast' (it runs `twitch.stop`, registered by useTwitchBroadcast) makes `window.__wzrd.broadcast.get().air` equal `'offair'` within 500 ms and removes that chyron; 3000 ms later (±500) `air` is `'off'`. No console output. `window.__wzrd.broadcast.reset()` afterwards.

### 8.11 Cut order

If time runs short, cut from the top:
1. The directions lane on the Script timeline (keep the beats lane and the playhead).
2. Chat line outcome badges.
3. The Events tab unseen-count badge.
4. The allowance-threshold status messages.
5. The Script source Chip.
6. The beat inspector pane. Fall back to a restyled per-beat list inside the Script tab, keeping the client ids.
7. Container-query full labels. Record, Capture and Remix become icon-only (with sr-only labels) at every width.
8. SymbolRaster acquisition densities. Keep the ConnectPlate over a static `BrandImage`.
9. The sticky monitor below 1024. The monitor scrolls away; the transport stays fixed.
10. Fixture states beyond idle, acquiring, preview, on air and failed (on air stays for B29 and C7).

**Never cut:**
- The 8A extraction and its proof.
- The single never-unmounted `<video>`.
- `useSecondClock` leaves and the eventLog ring buffers (500 non-debug, 100 debug).
- The zero-scroll grid at ≥1024.
- The TallyBar, the truth-gated `air` and `useWhipTruth`, including the rule that a `cue` is never torn down by a timeout (DEC-8-06).
- The air lock and leave-confirm.
- The AlertTray with `role="alert"` and the restored 'Start Director'.
- LockedSettings.
- The display-only artwork carousel: autoplay kept with its five pause conditions, and a track armed only through the 'Armed track' radiogroup (with 'No track' first) or 'Arm this track' (DEC-8-04, DEC-8-10).
- `primeMusic` running synchronously in the click.
- Every §8.9 item.
