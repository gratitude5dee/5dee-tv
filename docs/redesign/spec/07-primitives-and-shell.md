> **Spec chapter §7 — Primitive kit and app shell.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 7. Primitive kit and app shell

This section defines every shared hook, primitive and shell component: its API, its spec and the routes that use it. Motion behaviour is in §6, tokens in §5, effect components in §12 and brand files in §13. Line references are **as of 845147c**. Parts (`3A`, `4A`, `4B` …) are the §14 part ids; this chapter never assigns milestones.

**New strings.** Every visible string and accessible name this chapter introduces. None is preserved until it merges (Appendix A). Use them byte-for-byte.
- **Shell (§7.6–§7.10):** 'Skip to content'; the ⌘K button label 'Open command palette'; StatusRail LEDs `NET`, `NET · OFFLINE`, `CONVEX`, `CONVEX · SIGN IN`, `CONVEX · NOT PATCHED`, `TWITCH`, `TWITCH · NO KEY`, `TWITCH · NO CHANNEL`, `TWITCH · STALLED`; the LED popover sentences "Set `NEXT_PUBLIC_CONVEX_URL`, then run `npx convex dev` in `dashboard/`." and "Use 'Connect to Twitch' on Live Control, or paste a stream key."; the clock placeholder `--:--:--`; the rail credit 'stream.wzrd.tech admin · {year}'.
- **Palette and shortcuts (§7.11):** the dialog name 'Command palette'; the placeholder 'Search commands and pages'; the group labels 'Go to', 'Director', 'Shotboard', 'View'; the View commands 'Theme: System', 'Theme: Light', 'Theme: Dark', 'Density: Comfortable', 'Density: Compact', 'Collapse dock', 'Expand dock', 'Keyboard shortcuts'; the ShortcutSheet title 'Keyboard shortcuts'. Director and Shotboard command labels are listed by §8.9.6 and §9.
- **Theme and density (§7.13, §7.14):** the radiogroup name 'Theme' with 'System', 'Light', 'Dark'; the cycle button names 'Theme: System', 'Theme: Light', 'Theme: Dark'; the SegmentedControl 'Density' with 'Comfortable' and 'Compact'.
- **Primitives (§7.3–§7.5):** the HoldButton description 'Hold to confirm, or press to open a confirmation.'; the ConfirmDialog default cancel 'Dismiss'; lamp labels `PVW`, `REC`, `AIR`, `STBY`, `CUE`, `ON AIR`, `STALLED`; the TallyBar readout `REC {bytes} · {HH:MM:SS}`; the FreshnessStamp text 'Updated {n}s ago'; the ChyronHost region name 'Notifications'.
- Copy owned elsewhere: slate, NotConfigured, AuthRequired and offline copy (§11.D.7); the §6 strings (§6 New strings).

### 7.1 Conventions

- TypeScript, `forwardRef` to the root DOM node (the primary Button forwards to its inner `<button>`, §7.3), `'use client'` only where interactive, `cn` from `lib/utils.ts` (the `extendTailwindMerge` version, §5), and tokens only (no hex, no raw palette, no `fal-*`).
- Every primitive honours `useReducedMotion()`. Where §6.12 says so, it also honours the air lock (`useBroadcast(deriveLock)`).
- Import paths use the `@/` alias (`tsconfig.json` `paths`).
- React and Next rules (app-dir React canary, `@types/react` 18.3):
  - Never pass `inert` as a JSX prop; toggle it with `el.toggleAttribute('inert', …)` in a layout effect.
  - Every id referenced by `aria-labelledby`, `aria-describedby` or `aria-controls` comes from `useId()`. The only literal ids are the route section ids (`#…-visual-test`, `#ds-*`), `#content`, `#live-polite`, `#live-assertive`, `#palette-list`, `#lc-dock-body`, `#lc-rundown` and `#wzrd-*`.
  - `requestIdleCallback` is always called as `(window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1)))(…)`; Safari does not ship it.
  - `next/dynamic(…, { ssr: false })` is called only from `'use client'` files.
  - Every view a fixture renders beside another view's `h1` accepts `headingLevel?: 1 | 2` (default 1); the fixture passes 2, so each route keeps exactly one `h1`.
- Every primitive renders in every state in `/admin/visual-test#design-system-visual-test` (§10). The "Used by" lists below name product routes only: **Live** `/admin`, **Shotboard**, **Characters**, **Locations**, **Clips**, **Recordings**, **Analytics**, and **Shell** (every route).
- **Build order** (parts per §14):
  1. Foundations (§7.2): 3A and 4A, as listed under the §7.2 table.
  2. The shell primitives listed in §14.3 R3 (4A).
  3. The shell (§7.6–§7.15, 4B).
  4. The remaining primitives (5A, 5B).

### 7.2 Foundations (`hooks/`, `lib/`)

| Name | Path | Signature | Contract | Used by |
|---|---|---|---|---|
| useReducedMotion | `hooks/useReducedMotion.ts` | `(): boolean` | Live `matchMedia('(prefers-reduced-motion: reduce)')` listener via `useSyncExternalStore`; server snapshot `false` | All |
| usePageVisible | `hooks/usePageVisible.ts` | `(): boolean` | `document.visibilityState === 'visible'`, live via `visibilitychange` | Live, Analytics, Shell (carrier) |
| useOnline | `hooks/useOnline.ts` | `(): boolean` | `useSyncExternalStore` over the `online`/`offline` window events (`navigator.onLine`); server snapshot `true` | Shell (StatusRail NET LED, OfflineBanner), Clips, Recordings, Analytics |
| useInView | `hooks/useInView.ts` | `(ref: React.RefObject<Element>, opts?: { rootMargin?: string }): boolean` | One `IntersectionObserver` per hook; `false` on the server and until the first observation | Clips, Recordings |
| useDelayedFlag | `hooks/useDelayedFlag.ts` | `(active: boolean, opts?: { delayMs?: number; minMs?: number }): boolean` (defaults 150 / 300) | Becomes true only after `active` has been true for `delayMs`. Once true, it stays true for at least `minMs`, even if `active` drops | Clips, Recordings, Characters, Locations, Shotboard, Live, Analytics |
| useLoadState | `hooks/useLoadState.ts` | `<T>(data: T \| undefined, opts: { isAuthed?: boolean; notFound?: boolean; isEmpty?: (d: T) => boolean }): 'loading' \| 'empty' \| 'ready' \| 'auth' \| 'notFound'` | Precedence: `notFound` → `'notFound'`; `isAuthed === false` → `'auth'` (so a signed-out `[]` is never "empty"); `data === undefined` → `'loading'`; `isEmpty(data)` (default: an array of length 0) → `'empty'`; else `'ready'` | Clips, Recordings, Characters, Locations, Shotboard |
| useConvexAuthState | `components/ConvexClientProvider.tsx` (additive named export) | `(): { isLoading: boolean; isAuthenticated: boolean }` | In the configured branch, a bridge component calls `convex/react` `useConvexAuth()` (exported by convex 1.45.0) and provides the value through a context. Unconfigured, it returns `{ isLoading: false, isAuthenticated: false }`. The default export, `useConvexEnabled` (`:32-34`), `useCloudflareAuth` (`:8-29`, stays internal) and the no-client fallback (`:40-42`) are unchanged | Shell (StatusRail), Clips, Recordings, Characters, Locations, Shotboard |
| ThemeProvider / useTheme | `components/shell/ThemeProvider.tsx` | `useTheme(): { pref: 'system' \| 'light' \| 'dark'; resolved: 'light' \| 'dark'; setPref(p): void }` | §7.13 | Shell, DitherBackground |
| useDensity | `hooks/useDensity.ts` | `(): { density: 'comfortable' \| 'compact'; setDensity(d): void; locked: boolean }` | §7.14 | Shell (palette) |
| ticker | `lib/motion/ticker.ts` | `register(fn: (t: number, dt: number) => void): () => void` | One rAF loop for all JS animation. It skips frames closer than 33 ms (≤ 30 fps), stops when no callbacks remain, stops on `visibilitychange` hidden and restarts on visible. Callbacks throttle themselves (GenerationFrame 4 Hz, connect `T+` 10 Hz) | Live (connect plate, raster clear), Shotboard/Characters/Locations (GenerationFrame), Analytics/Clips/Recordings/Shotboard (CountUp) |
| clock | `lib/clock.ts` | `useSecondClock(): number \| null` | The **only** 1 s timer in the app: one `setTimeout` chain aligned to wall-clock second boundaries (`1000 − Date.now() % 1000`). It uses `useSyncExternalStore` with server snapshot `null`, so SSR and hydration render `--:--:--` | Shell (StatusRail clock), Live (program clock, readouts), Analytics (FreshnessStamp) |
| bayer | `lib/bayer.ts` | `BAYER4` (re-exported from `components/dither-kit/pixel`, normalised), `BAYER4_INDEX: number[][]` (the integer matrix `[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]`), `BAYER8: number[]` (the integers 0–63 in the carrier's row-major order: the numerators of `Dither.jsx:83-90`, `[0,48,12,60,3,51,15,63,32,16,…]`; never the normalised k/64 floats, §12.3.2), `bayerMaskVar(n: 0..15): string` → `` `var(--bayer-4-${String(n).padStart(2, '0')})` `` | dither-kit is never edited | BayerSpinner, GenerationFrame, SymbolRaster, boot (copy inlined) |
| broadcast store | `lib/broadcast/store.ts` | `broadcast.{get, publish, subscribe, reset, setLeaveHandler, leave}`, `useBroadcast(sel)`, `deriveBroadcast(s)`, `deriveLock(s)` | §7.17 | Live, Shell, Analytics (TallyLight only) |
| useWhipTruth | `lib/broadcast/useWhipTruth.ts` | `(session: WhipSession \| null, onNegotiationFailed: () => void): void` | Algorithm, publishers and tests: §8.5.6; the states it drives: §6.7. A wrapper only; `lib/twitchWhip.ts` is untouched. Created in 8C | Live |
| leave guard | `lib/leaveGuard.ts` | `useLeaveGuard(): (href: string) => (e: { preventDefault(): void }) => void`, `useLeaveRequest(): { href: string \| null; clear(): void }` | A module store. The handler calls `e.preventDefault()` and sets the request to `href` when `pathname === '/admin'`, `deriveLock(broadcast.get())` is true and `href !== '/admin'`; otherwise it does nothing. AppNav reads `useLeaveRequest()` and renders the one leave ConfirmDialog (§6.12) | Shell (AppNav, palette "Go to", Alt+1…7), Live (ScriptTemplatePicker Links, 8C) |
| effect slot | `lib/effectSlot.tsx` | `<EffectSlotProvider>`, `useEffectCanvasSlot(id: string, priority: number, want: boolean): boolean` | §7.16 | Live, Analytics |
| commands | `lib/commands.ts` | `useRegisterCommand({ id, group, label, shortcut?, enabled, reason?, palette?, run })`, `commands.run(id)`, `useCommands()`, `useGlobalShortcuts()` | A module registry read with `useSyncExternalStore`. Registration happens in an effect, and `run` is held in a ref so re-renders do not re-register. `palette: false` hides a command from the palette (shortcut-only, for example `director.cancel` and `twitch.stop`). `reason` is shown on disabled rows | Shell, Live, Shotboard |
| announce | `lib/announce.ts` | `announce(text: string, mode: 'polite' \| 'assertive' = 'polite'): void` | Writes to the single LiveRegion pair (§7.15). It clears the region, then sets the text 50 ms later so repeats are spoken, and drops an identical text within 1000 ms | All |
| chyron store | `lib/chyron.ts` | `chyron.push({ tone: 'info'\|'success'\|'warning'\|'error', title, body?, action?: { label, run }, sticky?, ttlMs? }): string`, `chyron.dismiss(id)` | §6.10. Under the lock, non-errors go to `statusMessage` | All |
| status message | `lib/statusMessage.ts` | `statusMessage.set({ tone, text, ttlMs = 6000 })`, `statusMessage.clear()` | One slot; a new message replaces the old one with a cut | Shell, Live |
| format | `lib/format.ts` | §5.20.4 (M2) and §11.0 (11A additions) | §5.20.4 owns `tc`, `tcShort`, `duration`, `bytes` and `formatMime`; §11.0 owns the 11A helpers | Live, Recordings, Clips, Analytics |

**Parts.** 3A lands useReducedMotion, usePageVisible, ThemeProvider/useTheme, `types/wzrd.d.ts` (§6.2.11) and the broadcast store module (no publishers; the dev `window.__wzrd.broadcast`, §7.17). 4A lands every other row except useWhipTruth (8C) and `lib/format.ts` (M2, with the 11A additions).

### 7.3 Controls (`components/ui/`)

| Primitive | API | Spec | Used by |
|---|---|---|---|
| **Button** | `forwardRef<HTMLButtonElement>`: `<Button variant="primary"\|"secondary"\|"ghost"\|"danger" size="sm"\|"md"\|"lg" icon?: LucideIcon iconRight?: LucideIcon pending? pendingLabel? successLabel? successSignal?: number errorSignal?: number type? …buttonProps>`. Also `buttonClassName(variant: 'secondary'\|'ghost'\|'danger', size: 'sm'\|'md'\|'lg'): string` in `components/ui/buttonClassName.ts` (never primary: DitherButton renders a `<button>`) | **primary** wraps dither-kit `DitherButton` inside `<span ref={wrapRef} className="inline-flex" data-btn data-state>` and forwards the ref with `useImperativeHandle(ref, () => wrapRef.current!.querySelector('button')!)`. **Never pass `ref` to DitherButton**: it is not a `forwardRef` component, and under the vendored React 19 runtime a `ref` prop is an ordinary prop, and `{...props}` (`components/dither-kit/button.tsx:197`) spreads after `ref={buttonRef}` (`:191`), replacing the internal `buttonRef` (`:94`). Its paint effect then returns early (`:102`) and the dithered fill never paints. `buttonClassName.ts` has **no** `'use client'`; Button imports it, and server files (for example `app/not-found.tsx`) import it from there, never from `Button.tsx`. The primary DitherButton takes `color={215} variant="gradient"` and the className exactly as in the bible: `h-[var(--h-control)] px-4 font-sans text-[13px] font-medium rounded-[6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:rgb(var(--c-focus))]`. Its children are the **label plate** `<span className="inline-flex items-center gap-2 rounded-xs surface-hud px-2 py-0.5 text-fg-on-screen">{icon}{label}</span>`, which also fixes the stacked icon. At most one primary per view. Every variant's root carries `data-btn` and `data-state` (`idle`\|`pending`\|`success`\|`error`). **secondary**: `surface-raised border border-line-control shadow-key text-fg`; `:active` → `translate-y-px shadow-key-pressed` over 60 ms `--ease-key`. **ghost**: transparent, `hover:bg-hover`. **danger**: transparent, `border border-danger text-danger`, never filled. Sizes: sm 28 px, md `var(--h-control)`, lg 40 px; icons 14/16/16. Pending, success and error: §6.9. Changing `successSignal` or `errorSignal` to a new positive value plays the micro-state. All labels share one grid cell (`inline-grid [&>*]:[grid-area:1/1]`, inactive ones `invisible`). At rest the accessible name is exactly the label: `pendingLabel` and `successLabel` are transient and return to the preserved label afterwards (Appendix A.12 P1). Lands in 4A | All |
| **IconButton** | `<IconButton icon label size="sm"\|"md" variant="ghost"\|"secondary" pressed?>` | `label` is required by type and becomes `aria-label`. 28 or 32 px square, with a 44×44 hit area on `(pointer: coarse)` (`::before` inset −6/−8 px). `pressed` sets `aria-pressed` | Shell, Live, Shotboard, Characters, Locations, Clips, Recordings |
| **HoldButton** | `<HoldButton holdMs={600} onConfirm confirm={{ title, body, confirmLabel, cancelLabel }} variant="secondary"\|"danger" label pending? pendingLabel?>` | States and dialog copy: §6.7. The accessible name is `label` (for example 'Go live on Twitch'). `aria-describedby` (id from `useId()`) → sr-only 'Hold to confirm, or press to open a confirmation.' **Input model:** on `keydown` Enter or Space with `!e.repeat`, call `e.preventDefault()` (this suppresses the native click) and start the hold; on `keyup`, a hold < 200 ms opens the ConfirmDialog, 200–599 ms cancels, ≥ 600 ms commits. Pointer: `pointerdown` starts, `pointerup`/`pointercancel` ends, with the same thresholds. A `click` with `detail === 0` that no HoldButton-handled keydown preceded within 50 ms is an assistive-technology activation and opens the dialog. Under reduced motion every activation opens the dialog | Live |
| **Panel** | `<Panel tone="panel"\|"inset"\|"chassis"\|"screen" as="section" title? eyebrow? actions? footer? aria-labelledby?>` plus `Panel.Header`, `Panel.Body`, `Panel.Footer` | `panel` = `surface-panel border border-line-subtle rounded-md sq shadow-e1`, padding `var(--pad-panel)`. `inset` = `surface-inset`; `chassis` = `surface-chassis`; `screen` = `bg-screen rounded-screen` (never squircled). Replaces `.fal-card*` | All |
| **SectionHeader** | `<SectionHeader eyebrow? title titleAs="h2"\|"h3" meta? actions?>` | Eyebrow `label` `text-fg-3`; title `title`; meta `readout` `text-fg-3` | Live, Shotboard, Characters, Locations, Clips, Recordings, Analytics |
| **PageHeader** | `<PageHeader eyebrow? title titleAs?: 'h1'\|'h2' description? actions?>` (`titleAs` default `'h1'`) | Renders the route's **only h1**, in `display`; a fixture that shows it beside another `h1` passes `titleAs="h2"`. ≤ 96 px tall. Not used on Live or Shotboard, which use bar h1s | Characters, Locations, Clips, Recordings, Analytics |
| **Field** | `<Field label hint? error? required? htmlFor>` | Label `body-sm` medium; hint `caption` `text-fg-3` via `aria-describedby` (id from `useId()`); error `caption` `text-danger`, `role="alert"` | Live, Shotboard, Characters, Locations |
| **Input / Textarea / Select** | Native elements; `<Textarea autoGrow? mono? maxRows?>` | `surface-inset border border-line-control rounded-sm sq h-[var(--h-control)] px-3 text-body`; placeholder `text-fg-3`. With `autoGrow`, the Textarea grows to `maxRows`. Fixes the native grey textarea | Live, Shotboard, Characters, Locations |
| **Switch** | `<Switch checked onCheckedChange label description?>` | `role="switch"`, `aria-checked`. Track 32×18 `surface-inset`; thumb 14 px, `bg-fg` off / `bg-accent` on, moving over 120 ms `--ease-key`. `label` is the accessible name | Characters, Locations, Live |
| **Checkbox / RadioGroup** | Native inputs, restyled | `border-line-control`; checked is `bg-accent` with an `accent-ink` check | Live, Characters, Locations |
| **SegmentedControl** | `<SegmentedControl value onValueChange options label size="sm"\|"md" disabled? reason?>` with `options: Array<string \| { value: string; label: string; icon?: LucideIcon }>`; a string `s` maps to `{ value: s, label: s }`. Callers pass objects wherever the value differs from the label | `role="radiogroup"` with a roving tabindex (arrows move and select). Selected = `bg-accent-soft text-accent` + a 1 px accent border | Shotboard, Locations, Shell (DensitySwitch) |
| **Slider** | Native `<input type="range">`, restyled | Keeps native semantics ('Music mix volume', 'Music start offset'). Inset track, accent fill, 14 px bezel thumb with an accent ring | Live |
| **NumberStepper** | `<NumberStepper value min max step label unit>` | −/+ IconButtons plus an input; `readout` value | Shotboard |
| **Badge** | `<Badge tone="neutral"\|"accent"\|"success"\|"warning"\|"danger" variant="soft"\|"outline">` | `micro`, `rounded-xs`, 18 px tall | Shotboard, Characters, Locations, Clips |
| **Chip** | `<Chip icon? mono? selected? onRemove? removeLabel?>` | 24 px, `rounded-sm sq`, `surface-inset` | Live, Shotboard, Characters, Locations |
| **Tabs** | `<Tabs value onValueChange keepMounted={true}>` with `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel` | Roving tabindex; the active tab has a 2 px accent bar. `keepMounted` hides inactive panels with the `hidden` attribute. It is required on Live, where DirectorPlayer must never unmount | Live |
| **Tooltip** | `<Tooltip content side delay={400}>` | Opens on hover and focus; Escape closes it and calls `e.preventDefault()`, so the global Esc handler (§7.12) skips that press. `surface-raised shadow-e2`, `caption`, `z-tooltip`. Never the only source of a label. If the trigger has a `title` (a preserved string), the Tooltip shows that text, removes the attribute while open and restores it on close. Exactly one tooltip appears, and the title stays in the DOM at rest | Shell, Live, Shotboard, Characters, Locations |
| **Kbd** | `<Kbd keys={['mod','K']} />` | `micro`, `surface-inset`, `border-line-subtle`. `mod` renders both a `⌘` span and a `Ctrl` span, and CSS shows one via `html[data-platform]` (§7.6), so there is no hydration mismatch | Shell, Live |
| **Dialog** | `<Dialog open onClose title description? size="sm"\|"md"\|"lg">` on native `<dialog>` + `showModal()` | `surface-raised shadow-e3 rounded-lg sq`; `::backdrop { background: rgb(var(--c-scrim) / var(--a-scrim)) }`. Enter is a 160 ms `px-resolve`. **Exit:** closing (`onClose`, a cancel button or Escape) calls `e.preventDefault()` on the native `cancel` event, sets `data-closing`, runs a WAAPI opacity 1 → 0 over `DUR.fast` (120 ms; 0 ms under the lock or reduced motion), awaits `.finished`, then calls `dialog.close()` and restores focus. Both are instant under the lock and reduced motion. Stores `document.activeElement` on open and restores focus on close | Shell, Live, Shotboard, Recordings |
| **ConfirmDialog** | `<ConfirmDialog open title body confirmLabel cancelLabel="Dismiss" destructive? typeToConfirm?: string onConfirm onCancel pending? pendingLabel?: string error?: ReactNode errorSignal?: number restoreFocus?: boolean>` (lands in 4A with the full API) | Built on Dialog. **Markup order:** body, then cancel, then confirm. Cancel carries `autoFocus`, so it receives the initial focus, and Enter confirms only when the confirm button has focus. Confirm is `variant="danger"` when `destructive`, else `variant="secondary"`; a dialog never adds a second primary to the view. `pending` puts confirm in its pending state with `pendingLabel` (§6.9). `error` renders under the body; a new positive `errorSignal` plays confirm's error micro-state. `restoreFocus` (default `true`): when `false`, closing does not return focus to the opener (for an opener that the confirmed action removes; the caller moves focus). `typeToConfirm` disables confirm until the input equals the string. Every call site passes a specific `cancelLabel` ('Not yet', 'Stay', 'Keep running', 'Keep board', 'Keep recording'). No call site passes 'Cancel', a preserved button name on Live Control that must not be duplicated | Live, Shotboard, Recordings |
| **Sheet** | `<Sheet side="right"\|"bottom" open onClose title width={360} dismissible?: boolean reason?: string>` (native `<dialog>` + `showModal()`, `data-sheet`; there is no `modal` prop) | 320 ms `--ease-out` translate in; exit uses the Dialog mechanism with a translate over 320 ms; instant under the lock and reduced motion. `dismissible` (default `true`): when `false`, the `cancel` event is `preventDefault()`-ed, a backdrop click is ignored, and the header close IconButton is `aria-disabled` with the caller's `reason` as its Tooltip. When a Sheet consumes Esc it calls `e.preventDefault()` | Live, Shotboard, Locations |
| **Popover** | `<Popover trigger content align>` | `surface-raised shadow-e2`, 200 ms resolve. Escape and an outside click close it; focus returns to the trigger. Escape also calls `e.preventDefault()`, so the global Esc handler (§7.12) skips that press | Shell (StatusRail), Shotboard |
| **ScrollFade** | `<ScrollFade axis="x"\|"y">` | Applies `.edge-fade-x/-y` only while the content overflows (ResizeObserver) | Shell (mobile nav), Live, Shotboard, Characters |
| **InlineBanner** | `<InlineBanner tone kicker? action?>` | 1 px tone border, `surface-panel`, and a 4 px left bar in the tone colour under the 50% Bayer mask | Shell (OfflineBanner), Shotboard, Live |
| **BayerSpinner** | `<BayerSpinner size={12\|16} label?>` | `.bayer-spinner` (§5.14): 16 `<i>` squares with `--b` = `BAYER4_INDEX[y][x]`, and the 2×2 centre marked `data-core`. The root carries `data-air-allow`: a pending operation is information, so it keeps running under the air lock (§6.12). `label` adds `role="status"` + sr-only text; otherwise the spinner is `aria-hidden` | All (inside Button) |
| **VisuallyHidden / SkipLink / LiveRegion** | Standard | SkipLink: `<a href="#content">Skip to content</a>`, sr-only until focused, then fixed at 8/8 px with `surface-raised shadow-e2 rounded-sm`, `z-tooltip`. LiveRegion: §7.15 | Shell |

### 7.4 Broadcast (`components/broadcast/`)

| Primitive | API | Spec | Used by |
|---|---|---|---|
| **TallyLight** | `<TallyLight kind="program"\|"preview"\|"rec"\|"cue"\|"standby"\|"stalled"\|"fault"\|"stale" lit label srLabel size="sm"\|"md" readout? steady? …rest>` | Root `.tally[data-kind][data-lit]`, `data-air-allow`. `...rest` (`data-*`, `id`) is spread onto the `.tally` root, so `data-testid` and `data-state` reach the DOM. `steady` sets `data-steady`: a `stalled` lamp without the blink (TallyCluster). Housing `bg-bezel border border-white/[.08] rounded-screen`. **md:** 20 px tall, 8 px horizontal padding, 8×8 LED, label as `PixelFace` at a 2 px cell. **sm:** 16 px tall, 6 px LED, `micro` label. Lit program/preview: the face fills with the tally colour and the label is `tally-ink`. rec: a 1.5 px ring + label in `tally-rec`, never filled. cue: amber ring + label, steady. standby: grey ring, label `text-on-screen-2`. Unlit: `tally-off` ring, label `text-on-screen-2`. stalled: red outline, hatch `repeating-linear-gradient(135deg, rgb(var(--c-tally-program)/.35) 0 2px, transparent 2px 4px)`, red label, `led-stall` × 5 unless `data-steady`. **fault** (11A): a 1.5 px `--c-tally-program` ring and label, never filled, no hatch, no animation. **stale** (11A): a `--c-tally-standby` ring, the hatch `repeating-linear-gradient(135deg, rgb(var(--c-tally-standby)/.35) 0 2px, transparent 2px 4px)`, a `text-on-screen-2` label, no animation. Both are theme-invariant on the bezel (§11.C.5). A lit change re-keys `.tally-face` with `.px-resolve` (160 ms, once; reduced motion: a cut). `srLabel` is spoken ("Preview", "On air"). `readout` sits outside the face in `readout` `text-on-screen` | Live, Shell, Analytics |
| **TallyBar** | `<TallyBar snapshot?: BroadcastState />` (reads the store; `snapshot` overrides it, for fixtures) | 28 px inside the monitor bezel. Left: the `STBY`/`PVW` lamp, then the `REC` lamp + readout `REC {bytes} · HH:MM:SS`. Right: the ON AIR lamp, moving through `OFF AIR` → `CUE` → `ON AIR` → `STALLED 00:06` → `OFF AIR` (3 s) → `OFF AIR` dim (§6.7) | Live |
| **TallyCluster** | `<TallyCluster compact? snapshot?: BroadcastState />` (reads the store; `snapshot` overrides it) | Three sm lamps: `PVW`, `REC` and `AIR`. **AIR maps `air`:** `off` → kind `program`, unlit, label `AIR`; `cue` → kind `cue`, label `CUE`; `on` → kind `program`, lit, label `ON AIR`; `stalled` → kind `stalled` with `steady` (no blink: only the TallyBar lamp blinks, §6.1 law 4), label `STALLED`; `offair` → unlit `AIR`. The four labels share one grid cell, width-locked to `STALLED`, so it **never** reads ON AIR while stalled. `compact` (below 1024): one lamp showing the highest state, STALLED > ON AIR > CUE > REC > PVW > STBY | Shell |
| **Led** | `<Led tone="off"\|"accent"\|"success"\|"warning"\|"danger" label labelHidden?>` | 8×8 `rounded-lamp`, `data-air-allow`. Off: 1 px `border-line-control`. Lit: fill + `box-shadow: 0 0 0 2px rgb(tone/.22)`. The label is always present, visible or sr-only | Shell, Live, Shotboard, Characters, Analytics |
| **Readout** | `<Readout label value unit? tone?>` | Label `label` `text-fg-3`; value `readout` `.nums` in a fixed `ch` slot. Updates ≤ 1 Hz and **snaps** | Live, Recordings, Analytics |
| **LedLadder** | `<LedLadder value segments={4\|20} thresholds={{ warn, danger }} label valueText>` | CSS segments (4×10 px or 20×3 px) lit in success/warning/danger; `role="meter"`, `aria-valuenow`, `aria-valuetext`. No canvas | Live |
| **StatTile** | `<StatTile label value format="int"\|"duration"\|"text" icon? trend?: number[] countUp?>` | Placed inside a `<dl>`: the root is a `<div>` whose only children are `<dt>` (icon `aria-hidden` + label) and `<dd>` (value, then the trend `<svg aria-hidden>`). Panel material, with the value in `readout-lg`, a monochrome icon, and an optional inline SVG polyline (1.5 px accent), never dither-kit. CountUp on first reveal only | Analytics |
| **FreshnessStamp** | `<FreshnessStamp at={ms} staleAfterMs>` | "Updated 12s ago" from `useSecondClock`. Past `staleAfterMs`, it turns `text-warning` with a warning LED | Analytics |

### 7.5 States, generation, effects, brand

| Primitive | Path | API | Spec | Used by |
|---|---|---|---|---|
| **Slate** | `components/states/Slate.tsx` | `<Slate kind="empty"\|"not-configured"\|"auth"\|"offline"\|"error"\|"not-found"\|"standby" kicker? art? title titleAs?: 'h1'\|'h2' body? actions? size="route"\|"panel">` (`titleAs` default `'h2'`) | §6.13. The title element and style follow `titleAs`, not `size`: `h1` → `display-xl`, `h2` → `title-lg`, at both sizes. Only route-level slates without a PageHeader pass `titleAs="h1"` (404, admin error). For `kind="empty"`, the call site passes `kicker` and `art` from the §6.13 table, because they differ per route. Every other kind defaults both. Lands in 4D | All route states (§11), Shotboard, Characters, Locations, Clips, Recordings, Analytics |
| **NotConfigured** | `components/states/NotConfigured.tsx` | `<NotConfigured feature? message? envVars={['NEXT_PUBLIC_CONVEX_URL']} cmd="npx convex dev" size>` | Slate kind `not-configured`; env names and the command render in `code`. Copy (with and without `message`): §11.D.7. `components/ConvexNotConfigured.tsx` stays as a thin wrapper with the same `feature` prop. Lands in 5A | Clips, Recordings, Characters, Locations, Analytics |
| **AuthRequired** | `components/states/AuthRequired.tsx` | `<AuthRequired size? />` | Slate kind `auth`; copy §11.D.7. Lands in 5A | Clips, Recordings, Characters, Locations, Shotboard |
| **ErrorState** | `components/states/ErrorState.tsx` | `<ErrorState error digest? onRetry onCopy? />` | Slate kind `error` with `titleAs="h1"`; copy §11.D.3. `onCopy` defaults to copying `digest` plus `message` (the §11.D.3 JSON). Lands in 4D | `app/admin/error.tsx` |
| **Skeleton** | `components/states/Skeleton.tsx` | `<Skeleton shape="text"\|"media"\|"block" lines? ratio? w? h? />` | `.skeleton-dither` (§6.8) | All |
| **Skeleton compositions** | `components/states/skeletons/{LiveSkeleton,ShotboardSkeleton,StudioSkeleton,ClipsSkeleton,RecordingsSkeleton,AnalyticsSkeleton}.tsx` | `<XSkeleton loader?: ReactNode header?: boolean />` (`header` default `true`; `false` omits the PageHeader row) | Layout-exact per page section (§8–§11); `loader` slot per §6.3. StudioSkeleton is final from 4D; the others land with their pages (§6.3 table) | Each route's `loading.tsx` |
| **RouteSkeleton** (interim) | `components/states/skeletons/RouteSkeleton.tsx` | `<RouteSkeleton title loader? />` | A visually hidden `<h1>{title}</h1>` (so the fallback keeps the route's one `h1`), one 32 px text bar and one `block`. Created in 4D, deleted in 11C when the last route swaps in its composition | `loading.tsx` files until their page part (§6.3) |
| **GenerationFrame** | `components/generation/GenerationFrame.tsx` | `<GenerationFrame phase="saving"\|"expanding"\|"queued"\|"running"\|"uploading"\|"done"\|"failed" modelId modelLabel startedAt etaMs? queuePosition? progress?: { done, total } previousUrl? error? onRetry? ratio src? announce?: 'all'\|'progress'\|'none' />` (`announce` default `'all'`) | §6.6. `modelId` feeds `etaFor`; `src` is the landed image, and `done` waits for it; `announce` gates the phase announcements (§6.6). The field element carries `data-gf-field`. The root is `container-type: inline-size`, with the §6.6 compact forms at ≤ 199 px; `queued` without `queuePosition` reads `QUEUE --` at every size. Lands in 5B | Shotboard, Characters, Locations |
| **StageTrack** | `components/generation/StageTrack.tsx` | API: §12.3.6 (owner) | §12.3.6 | Live (connect), Characters, Locations (Darkroom), Shotboard (Send to Director) |
| **ContactSheet** | `components/generation/ContactSheet.tsx` | `<ContactSheet items onPromote onRemove selectable />` | Review-before-promote grid; new tiles resolve (160 ms). Shotboard's contact-sheet view does not use it (§9) | Characters, Locations |
| **Effects** | `components/effects/` | `PxResolve`, `DecryptedText`, `CountUp`, `PixelFace`, `SelectionBrackets`, `SymbolRaster`, `HoloCard`, `HoverClipButton`, `StreamList` | APIs and tuning in §12 | PxResolve: all; DecryptedText: Live, GenerationFrame hosts; CountUp: Analytics, Clips, Recordings, Shotboard; PixelFace: TallyLight md, slates; SelectionBrackets: Live, Shotboard, Characters, Locations; SymbolRaster: Live; HoloCard, HoverClipButton: Characters; StreamList: Live |
| **Wordmark** | `components/brand/Wordmark.tsx` | `<Wordmark height={20\|16} id? />` | A `<picture>` with AVIF, then WebP, from `/brand/wordmark/wzrdtech-{160,320}` (paths: §13.6.11). The `<img>` has explicit `width`/`height` (81×20 at 20 px, 65×16 at 16 px), `alt="WZRD.TECH"` (preserved) and `decoding="async"`. The `id` (`wzrd-bug`) and `data-boot-target` go on the `<img>` | Shell, `app/not-found.tsx` |
| **CoastLoader** | `components/brand/CoastLoader.tsx` | `<CoastLoader size={64\|128} label: string />` (`label` is required) | `<span role="status" class="inline-flex items-center gap-3">` containing an `aria-hidden` `.coast-sprite` box (`--s: {size}px`, §5.14), then the visible `caption` `text-fg-3` label. Frame 1 as a still under reduced motion and the lock | Every `loading.tsx` |
| **BrandImage / BrandVideo** | `components/brand/` | `<BrandImage id sizes alt className? />`, `<BrandVideo id className? />` | API and behaviour: §13.8 (owner). New code passes only the canonical §13.6 ids | Live (idle slot fallback), Characters, Analytics, slates |
| **Boot** | `components/boot/` | `BootMarkup`, `bootScript.ts`, `boot.src.js`, `bootScript.generated.ts`, `masks.ts` | §6.2 | Root layout |

### 7.6 App shell structure

**Today**, `app/layout.tsx` is a server component with:
- the pre-paint `themeInit` (`:11-19`, injected at `:34`);
- `<DitherBackground/>` (`:37`);
- the veil wrapper `bg-fal-gray-50/60 dark:bg-[#0a0d14]/45` (`:38`);
- a `bg-[#0a0d14]` header in both themes, holding the 690 KB PNG (`:40-60`);
- `main.max-w-7xl` with `.fade-in` (`:63-66`);
- a footer with 'Powered by FAL realtime' (`:70-81`).

`app/admin/layout.tsx` renders `<AdminNav/>` above every admin page.

**After** (`app/layout.tsx`, server; 4B, with the boot markup and preload added in 4C):

```tsx
<html lang="en" suppressHydrationWarning data-broadcast="idle" data-density="comfortable"
      className={`${focal.variable} ${jetbrainsMono.variable}`}>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeInit }} />            {/* theme lines byte-identical, see below */}
    <link rel="preload" as="image" href="/brand/wordmark/wzrdtech-640.webp" />  {/* the only preload; the boot strip is never preloaded */}
  </head>
  <body className="font-sans">
    <ThemeProvider>                                                        {/* renders no DOM */}
      <DitherBackground />                                                 {/* FIRST DOM child of body (invariant): fixed inset-0 -z-10 pointer-events-none aria-hidden, canvas + .dither-veil */}
      <BootMarkup convexConfigured={!!process.env.NEXT_PUBLIC_CONVEX_URL} />  {/* <style>, #wzrd-boot-host, <script> */}
      <SkipLink href="#content" />
      <ConvexClientProvider>
        <BroadcastProvider>
          <div className="flex min-h-dvh flex-col">
            <CommandBar />                                                 {/* <header>, banner, sticky top-0 z-bar */}
            <OfflineBanner />                                              {/* fixed under the bar; toggles html[data-offline] */}
            <main id="content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
            <StatusRail />                                                 {/* <footer>, contentinfo, sticky bottom-0 z-bar */}
          </div>
          <ChyronHost /> <LiveRegion /> <PaletteHost /> <ShortcutSheet />
        </BroadcastProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  </body>
</html>
```

- `ThemeProvider` wraps DitherBackground, so the carrier reads `useTheme()` directly. DitherBackground's `MutationObserver` (`DitherBackground.tsx:13-20`) and its `useState(true)` default are deleted. Providers render no DOM, so DitherBackground is still the first element in `<body>`.
- `ConvexClientProvider` moves from inside `main` (`:65`) to wrap the whole column, so the StatusRail can read `useConvexEnabled()` and `useConvexAuthState()`.
- `.fade-in`, the veil wrapper (`:38`, replaced by `.dither-veil`, §5), the header (`:40-60`) and the footer (`:70-81`) are deleted. The footer string 'Powered by FAL realtime' is removed (D6).
- `main` gets `focus:outline-none` only because it is a non-interactive skip target. Every interactive element keeps the §5 focus ring.
- **`PaletteHost`** (`components/shell/PaletteHost.tsx`, `'use client'`) is the only place `CommandPalette` is loaded: `const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false })`. Next 15 rejects `ssr: false` in a Server Component, so `app/layout.tsx` never calls `next/dynamic`. PaletteHost renders `<CommandPalette />` only after the first open request, and prefetches the chunk with `(window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1)))(() => import('./CommandPalette'))` (§7.11). `ChyronHost`, `LiveRegion` and `ShortcutSheet` are small client components.

**`themeInit` after the change.** The theme block (`app/layout.tsx:11-19`) stays byte-identical, and four independent blocks are appended, in this order:

```js
  try {
    var d = localStorage.getItem('theme')
    if (d ? d === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    }
  } catch (e) {}
  try {
    if (localStorage.getItem('wzrd:density') === 'compact') document.documentElement.setAttribute('data-density', 'compact')
  } catch (e) {}
  document.documentElement.setAttribute('data-platform', /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? 'mac' : 'other')
  try {
    document.documentElement.setAttribute('data-theme-pref', localStorage.getItem('theme') || 'system')
  } catch (e) {}
  try {
    var k = localStorage.getItem('wzrd:dock')
    document.documentElement.dataset.dock = (k === 'open' || k === 'collapsed') ? k : (innerHeight < 820 ? 'collapsed' : 'open')
  } catch (e) {}
```

**`<html>` state attributes.** This table is the only list of the attributes, their values and their single writers (§5.5 points here):

| Attribute | Values | Sole writer | Consumers |
|---|---|---|---|
| `class="dark"`, `style.colorScheme` | theme | `themeInit`, then ThemeProvider. localStorage `theme` holds exactly `'dark'` or `'light'` | `.dark` tokens |
| `data-theme-pref` | `system` · `light` · `dark` | `themeInit`, then ThemeProvider | ThemeSwitch selected style (§7.13) |
| `data-density` | `comfortable` · `compact` | SSR default, `themeInit` (`wzrd:density`), then `useDensity` | §5.8 tokens |
| `data-platform` | `mac` · `other` | `themeInit` | `<Kbd>` |
| `data-dock` | `open` · `collapsed` | `themeInit` (`wzrd:dock`), then the Live Control Dock toggle | `--dock-h` |
| `data-broadcast` | `idle` · `connecting` · `preview` · `on-air` · `stopping` | `lib/broadcast/store.ts` (SSR `idle`) | carrier tokens; §6 |
| `data-rec` | present while recording | store | REC lamp; air lock |
| `data-lock="air"` | derived | store | §5.14; §6.12 |
| `data-boot` | present while the boot runs | `BOOT_SCRIPT` only | `#wzrd-bug`; Dither.css |
| `data-offline` | present while `navigator.onLine === false` | OfflineBanner | `--h-offline` |

**Admin layout** (`app/admin/layout.tsx`, server; 4B). It no longer renders AdminNav, because the nav lives in the CommandBar. Its `title` object gives `/admin` its default and every child segment its template (§7.7):

```tsx
// app/admin/layout.tsx (server)
import type { Metadata } from 'next'
import { EffectSlotProvider } from '@/lib/effectSlot'
export const metadata: Metadata = { title: { default: 'Live Control', template: '%s · stream.wzrd.tech admin' } }
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <EffectSlotProvider>{children}</EffectSlotProvider>
}
```

**Shell files** (all land in 4B unless the row names another part):

| File | Kind | Notes |
|---|---|---|
| `components/shell/CommandBar.tsx` | Server wrapper + client islands | §7.8. Mounts `useGlobalShortcuts()` through a client child |
| `components/shell/AppNav.tsx` | Client | `git mv components/AdminNav.tsx components/shell/AppNav.tsx`. The `tabs` array (`AdminNav.tsx:7-15`) stays byte-identical. Renders the one leave ConfirmDialog (§6.12) |
| `components/shell/StatusRail.tsx` | Client | §7.10 |
| `components/shell/ThemeProvider.tsx`, `ThemeSwitch.tsx` | Client | §7.13. ThemeProvider lands in 3A with `components/ThemeToggle.tsx` rewired to it; 4B adds ThemeSwitch and deletes `ThemeToggle.tsx` once `grep -rn "ThemeToggle" app components` lists only that file |
| `components/shell/DensitySwitch.tsx` | Client | §7.14 |
| `components/shell/PaletteHost.tsx` | Client | The `next/dynamic` host of CommandPalette (above) |
| `components/shell/CommandPalette.tsx`, `ShortcutSheet.tsx` | Client | §7.11 |
| `components/shell/ChyronHost.tsx` | Client | §7.15 |
| `components/shell/RouteProgress.tsx` | Client | §6.4.3 |
| `components/shell/OfflineBanner.tsx` | Client | Reads `useOnline()` (§7.2). While offline: `InlineBanner tone="warning" kicker="NO CARRIER"` with 'Network offline' (copy §11.D.7), at `position: fixed; top: var(--h-chrome); left: var(--gutter); right: var(--gutter)`, 36 px tall, `z-bar`. It is the only writer of `html[data-offline]`, which sets `--h-offline: 36px` (§5.2) so sticky tops and `scroll-padding-top` clear it |
| `components/shell/BroadcastProvider.tsx` | Client | Every side effect of the store, all in 4B: the title and favicon swap, the announcements, the stalled chyron (its only publisher), the recovery and off-air messages (§6.7), and the `beforeunload` and mouse-button guards (§6.12). 8C adds the publishers and verifies them end to end. Renders `children` only |
| `components/shell/TallyCluster.tsx` | Re-export of `components/broadcast/TallyCluster` | — |
| `app/styles/shell.css` | Surface stylesheet | The §7.8 `@layer components` block, imported at its §5.1 position |

### 7.7 Metadata

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://stream.wzrd.tech'),
  title: { default: 'stream.wzrd.tech admin', template: '%s · stream.wzrd.tech admin' },
  description:
    'Operator console for the WZRD.tech realtime AI livestream: MiniMax H3 Max Director, Shotboard, character and location assets, clips, recordings and Twitch analytics.',
}
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFF' },
    { media: '(prefers-color-scheme: dark)', color: '#05080F' },
  ],
}
```

- The default title 'stream.wzrd.tech admin' is preserved (`app/layout.tsx:22`). The new description replaces the LTX copy (`:23`, D6).
- Per-route titles come from new **server** `layout.tsx` files that export only `metadata` and return `children` (4B). They are needed because the pages are client components, and pages never export metadata. This chapter owns the titles, the admin template and the file shape; §11.D.6 points here. Every segment file has exactly this shape:

```tsx
// app/admin/clips/layout.tsx (same shape for every segment below)
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Clips' }
export default function ClipsLayout({ children }: { children: React.ReactNode }) { return <>{children}</> }
```

| File | `metadata.title` | Resulting `document.title` |
|---|---|---|
| `app/admin/layout.tsx` (§7.6: also wraps `EffectSlotProvider`) | `{ default: 'Live Control', template: '%s · stream.wzrd.tech admin' }` | Live Control · stream.wzrd.tech admin (on `/admin`) |
| `app/admin/shotboard/layout.tsx` | `Shotboard` | Shotboard · stream.wzrd.tech admin |
| `app/admin/characters/layout.tsx` | `Characters` | Characters · stream.wzrd.tech admin |
| `app/admin/locations/layout.tsx` | `Locations` | Locations · stream.wzrd.tech admin |
| `app/admin/clips/layout.tsx` | `Clips` | Clips · stream.wzrd.tech admin |
| `app/admin/recordings/layout.tsx` | `Recordings` | Recordings · stream.wzrd.tech admin |
| `app/admin/analytics/layout.tsx` | `Twitch Analytics` | Twitch Analytics · stream.wzrd.tech admin |
| `app/admin/visual-test/layout.tsx` | `Visual test` | Visual test · stream.wzrd.tech admin |
| `app/not-found.tsx` (error-convention metadata, §11.D.2) | `Not found` | Not found · stream.wzrd.tech admin |

> Note: a plain-string `title` on `app/admin/layout.tsx` would replace the root template for every child segment, so `/admin/clips` would read just "Clips". The admin layout therefore declares its own `template`. Next resolves `default` through the root template (`/admin` → "Live Control · stream.wzrd.tech admin") and each child title through the admin template (`node_modules/next/dist/lib/metadata/resolvers/resolve-title.js`). There is no `app/admin/(live)/layout.tsx` (§6.3), so there are exactly 8 `layout.tsx` files under `app/admin`.

- While ON AIR, `BroadcastProvider` overrides `document.title` with `● ON AIR · stream.wzrd.tech admin` (§6.7) and restores the saved value off air.
- Icons, `app/manifest.ts`, and the Open Graph and Twitter images: §13.

### 7.8 CommandBar

The CommandBar is 48 px tall (`--h-cmd`), `surface-chassis` with a `line-subtle` bottom border, `sticky top-0 z-bar`, and renders as `<header>` (the banner landmark). Horizontal padding is `var(--gutter)`. Grid areas keep one DOM order at every width.

**`app/styles/shell.css`** (created in 4B; this block is the file's complete text, imported at its §5.1 position). It holds the CommandBar grid, the nav indicator and LED (§6.4.2), RouteProgress (§6.4.3) and the ThemeSwitch selected style (§7.13). `--h-chrome`, `--h-offline`, the coarse-pointer `--h-status: 44px` and `scroll-padding-top` are global tokens in `tokens.css` (§5.2), never here.

```css
/* dashboard/app/styles/shell.css — CommandBar, AppNav, RouteProgress and ThemeSwitch rules (docs/redesign/spec/07-primitives-and-shell.md §7.8). @layer components only. */
@layer components {
  .cmdbar { display: grid; align-items: center; column-gap: 16px; height: var(--h-cmd);
    grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "brand nav right"; }
  @media (max-width: 767px) {
    .cmdbar { height: auto; grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-rows: var(--h-cmd) var(--h-navrow); grid-template-areas: "brand . right" "nav nav nav"; }
  }
  .cmdbar nav { position: relative; }
  .nav-link { position: relative; }
  .nav-indicator { position: absolute; left: 12px; right: 12px; bottom: 0; height: 2px; background: rgb(var(--c-accent));
    -webkit-mask: var(--bayer-4-07) 0 0 / 8px 8px repeat; mask: var(--bayer-4-07) 0 0 / 8px 8px repeat; }
  .nav-led { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: var(--r-lamp);
    background: rgb(var(--c-accent)); opacity: 0; transition: opacity var(--dur-tick) steps(1, end); }
  .nav-led[data-on] { opacity: 1; }
  .route-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; overflow: hidden; opacity: 0; pointer-events: none; }
  .rp-fill { position: absolute; inset: 0; background: rgb(var(--c-accent)); transform-origin: 0 50%; transform: scaleX(0); }
  .rp-edge { position: absolute; left: 0; top: 0; width: 24px; height: 2px; background: rgb(var(--c-accent));
    -webkit-mask: var(--bayer-4-07) 0 0 / 8px 8px repeat; mask: var(--bayer-4-07) 0 0 / 8px 8px repeat; transform: translateX(-24px); }
  :root[data-theme-pref="system"] .theme-switch [data-theme-seg="system"],
  :root[data-theme-pref="light"] .theme-switch [data-theme-seg="light"],
  :root[data-theme-pref="dark"] .theme-switch [data-theme-seg="dark"] { @apply bg-accent-soft text-accent; }
  .theme-cycle [data-theme-seg] { display: none; }
  :root[data-theme-pref="system"] .theme-cycle [data-theme-seg="system"],
  :root[data-theme-pref="light"] .theme-cycle [data-theme-seg="light"],
  :root[data-theme-pref="dark"] .theme-cycle [data-theme-seg="dark"] { display: block; }
}
```

`.cmdbar nav { position: relative }` makes `link.offsetLeft` nav-relative for the mobile centring below, and `.nav-link { position: relative }` anchors `.nav-indicator`. RouteProgress drives `opacity` and both children's transforms with WAAPI (§6.4.3); the rules above are the resting state. The sticky offset for everything below the bar (the Shotboard slate bar, the Live Control mobile monitor) is `calc(var(--h-chrome) + var(--h-offline))`; the OfflineBanner itself sits at `top: var(--h-chrome)`.

**Contents, left to right:**

| Area | Element | Spec |
|---|---|---|
| brand | `<Wordmark height={20} id="wzrd-bug" />` | 81×20; 16 px (65×16) below 768 |
| brand | Divider | 1 px × 20 px `line-subtle` |
| brand | Brand block (not a heading) | "Stream Admin" `title-sm` `text-fg`; "stream.wzrd.tech" `micro` `text-fg-3` (preserved strings) |
| nav | `<AppNav />` | §7.9 |
| right | `<TallyCluster />` | Three sm lamps; `compact` below 1024 |
| right | ⌘K button | `IconButton` (32 px; Command icon, or Search icon below 768), label "Open command palette". From `xl`, a `<Kbd keys={['mod','K']} />` is shown inside it |
| right | `<ThemeSwitch />` | Three 28 px segments; a single cycle IconButton below 768 (§7.13) |

**Breakpoints:**

| Width | Behaviour |
|---|---|
| ≥ 1536 | Everything above |
| 1440–1535 | The brand block becomes sr-only (still in the DOM) |
| 1024–1439 | As 1440–1535, plus nav links are icon-only except the active one. Each inactive link keeps its exact label as sr-only text plus a Tooltip, so its accessible name is unchanged. At 1280 and 1366 the full labels plus the right cluster would overflow the nav column, so icon-only starts below 1440 |
| 768–1023 | As 1024–1439, plus `TallyCluster compact` (one aggregate lamp) |
| < 768 | Row 1 (48 px): Wordmark 16, the aggregate lamp, ⌘K (Search icon) and the theme cycle. Row 2 (44 px): the **same** `<nav>` element (never a duplicate) as a horizontal scroll-snap strip with full labels: `ScrollFade axis="x"`, `scroll-snap-type: x proximity`, links `scroll-snap-align: start`, 44 px tall. On mount and on every pathname change, set `nav.scrollLeft = link.offsetLeft − (nav.clientWidth − link.offsetWidth) / 2`. Never use `scrollIntoView`, which can scroll the page |

```text
≥1536 px · one 48 px row
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ WZRD.tech │ Stream Admin      [•]Live Control  Shotboard │ Characters  Locations │ Clips  Recordings │ Twitch Analytics    [PVW][REC][AIR]  [Cmd ⌘K]  [Sys|Light|Dark] │
│  81×20    │ stream.wzrd.tech      ────────────                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   [•] 6 px active LED   ──── 2 px Bayer indicator under the active link   │ 1 px group dividers

<768 px · 48 px row + 44 px nav row
┌──────────────────────────────────────────┐
│ WZRD.tech (65×16)      [AIR] [Srch] [Thm] │
├──────────────────────────────────────────┤
│ [•]Live Control  Shotboard  Charac…     ›│  ← the same <nav>, scroll-snap, edge fade
└──────────────────────────────────────────┘
```

### 7.9 AppNav

- One `<nav aria-label="Admin sections">` (preserved). It holds seven Next `<Link>`s from the unchanged `tabs` array: '/admin' Live Control, '/admin/shotboard' Shotboard, '/admin/characters' Characters, '/admin/locations' Locations, '/admin/clips' Clips, '/admin/recordings' Recordings, '/admin/analytics' Twitch Analytics. The lucide icons are unchanged: Radio, Clapperboard, UsersRound, MapPin, Film, Video, BarChart3.
- The active rule is unchanged (`AdminNav.tsx:23`): exact match for `/admin`, `startsWith` for the others. The active link has `aria-current="page"`.
- Links: 32 px tall (44 px in the mobile row and on coarse pointers), 12 px horizontal padding, `body-sm` medium, `text-fg-2`; active `text-fg`; hover `bg-hover`. Hover is token-driven, so there are no `dark:` variants. Icons are 16 px with a 6 px gap.
- 1 px × 16 px `line-subtle` dividers after Shotboard, Locations and Recordings group the links as PRODUCE | ASSETS | LIBRARY | INSIGHTS. The group names are not rendered.
- Indicator, LED and RouteProgress: §6.4.2, §6.4.3.
- **Guarded navigation:** `const guard = useLeaveGuard()` (`lib/leaveGuard.ts`, §7.2) returns the `onNavigate` handler of §6.12, and AppNav renders the one leave ConfirmDialog from `useLeaveRequest()`. AppNav also registers the seven "Go to" palette commands (`goto.live` … `goto.analytics`) and owns the Alt+1…7 handler. All of them go through the same guard and one `useTransition`, whose `isPending` feeds `routeProgress`.

### 7.10 StatusRail

The StatusRail is 24 px tall (`--h-status`), `surface-chassis` with a `line-subtle` top border, `micro` text, `sticky bottom-0 z-bar`, and renders as `<footer>` (contentinfo). On `(pointer: coarse)` the rail is 44 px tall (the coarse-pointer `--h-status: 44px` in `tokens.css`, §5.2), so every rail button meets the 44 px coarse-pointer rule, and every layout that subtracts `--h-status` follows. `--h-status` stays 24 px for fine pointers.

**Left to right:**

| Item | States | Source (zero network probes) |
|---|---|---|
| NET LED button | `success` "NET"; `danger` "NET · OFFLINE" | `useOnline()` (§7.2) |
| CONVEX LED button | `success` "CONVEX" (enabled and authenticated); `warning` "CONVEX · SIGN IN" (enabled, auth loaded, not authenticated); `warning` "CONVEX · NOT PATCHED" (not configured); `off` "CONVEX" while auth is loading | `useConvexEnabled()`, `useConvexAuthState()` |
| TWITCH LED button | `success` "TWITCH" (channel env present and a stored key in `wzrd_twitch_auth`); `warning` "TWITCH · NO KEY" or "TWITCH · NO CHANNEL" (partial); `danger` "TWITCH · STALLED" while `air === 'stalled'` | `process.env.NEXT_PUBLIC_TWITCH_CHANNEL`; a read-only, try/catch parse of `localStorage['wzrd_twitch_auth']`, re-read on mount, on `storage`, on `visibilitychange` and on the `wzrd:twitch-auth` window event; the store |
| Message slot | `flex-1`, one line, ellipsised, tone colour, cut changes, `role="status"` | `statusMessage` |
| Clock | `HH:MM:SS` local, `readout`, `min-w-[8ch]`. Rendered by its own leaf component `RailClock` as `<time data-testid="status-clock">`, so each tick commits only that leaf | `useSecondClock()`; renders `--:--:--` until mounted |
| From `xl` | "stream.wzrd.tech admin · {year}" (`suppressHydrationWarning` on the year span) | — |

- Each LED is a `<button type="button" aria-haspopup="dialog">` whose accessible name is its visible text (for example "CONVEX · NOT PATCHED"). It opens a Popover with one sentence of detail and the fix, with env names in `code`. Examples: NOT PATCHED → "Set `NEXT_PUBLIC_CONVEX_URL`, then run `npx convex dev` in `dashboard/`."; NO KEY → "Use 'Connect to Twitch' on Live Control, or paste a stream key."
- `TwitchBroadcast` dispatches `window.dispatchEvent(new Event('wzrd:twitch-auth'))` right after it writes or removes `wzrd_twitch_auth`. This is a one-line UI addition; the storage format and the OAuth flow are unchanged.
- Under the air lock, the message slot receives the info, success and warning chyrons (§6.10).

### 7.11 CommandPalette and ShortcutSheet

**CommandPalette** (`components/shell/CommandPalette.tsx`): loaded only by `PaletteHost` (§7.6) with `next/dynamic` `ssr: false`, mounted on first open, and prefetched with `(window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1)))(() => import('./CommandPalette'))`.

| Part | Spec |
|---|---|
| Container | Native `<dialog aria-label="Command palette">` + `showModal()`, `width: min(640px, 100vw − 32px)`, `margin: 15vh auto auto`, `surface-raised shadow-e3 rounded-lg sq`, with the 1 px accent top hairline (§5 dialog rule) |
| Input | 48 px, `body-lg`, `role="combobox"`, `aria-expanded="true"`, `aria-controls="palette-list"`, `aria-autocomplete="list"`, `aria-activedescendant="palette-opt-<id>"`, placeholder "Search commands and pages" |
| List | `<ul id="palette-list" role="listbox">`. Groups are `role="group"` with a visible `label` header (`aria-labelledby`, id from `useId()`). Rows are `role="option"`, 40 px tall, with at most 8 visible (320 px, then scroll). Each row has a 16 px icon, the label in `body` and a right-aligned `<Kbd>` hint. Disabled rows have `aria-disabled="true"` and show the `reason` in `caption` `text-fg-3` |
| Mount rule | The listbox exists **only while open**, so no preserved label is duplicated in the DOM when closed. Open rows are `role="option"`, never `button` |
| Filtering | Case-insensitive. Rank prefix matches of the label first, then word-start matches, then substring matches of the label or group; stable within a rank |
| Keys | ↑/↓ move (wrapping), Home/End jump, Enter runs the active enabled row and closes, Escape closes (native `cancel`). Focus returns to the invoking element |
| Guards | Destructive and on-air commands use the same guards as their buttons: the "Go live on Twitch" row opens the ConfirmDialog, and "Go to" rows use the air-lock guard |

**Groups and commands:**

| Group | Commands (label → registered by) | Visibility |
|---|---|---|
| Go to | Live Control, Shotboard, Characters, Locations, Clips, Recordings, Twitch Analytics (Alt+1…7) → AppNav | Always |
| Director | Start Director (mod+Enter), Stop, Send direction (mod+Enter), Record, Capture frame, Remix frame, Mute / Unmute, Go live on Twitch, Cut to script, Queue script, Toggle chat steering, Open events → DirectorPlayer and its children | On `/admin` only; each is enabled only when its button is enabled |
| Shotboard | New board, Send to Director, Generate selected shot → ShotboardPage | On `/admin/shotboard` only |
| View | Theme: System, Theme: Light, Theme: Dark; Density: Comfortable, Density: Compact (disabled under the lock, reason "Locked while on air"); Collapse dock / Expand dock (on `/admin`; disabled under the lock, reason "Locked while on air"); Keyboard shortcuts (mod+/) → shell | Always |

Shortcut-only commands (`palette: false`): `director.cancel` (Esc while connecting; registered by DirectorPlayer, §8.5.12) and `twitch.stop` (the stalled chyron's 'End broadcast'; registered by `useTwitchBroadcast` in 8C).

**ShortcutSheet** (`components/shell/ShortcutSheet.tsx`): a `Dialog size="md"` titled "Keyboard shortcuts" that renders the §7.12 table grouped by scope, with `<Kbd>`. It opens with mod+/ or the View command.

### 7.12 Keyboard map

WCAG 2.1.4: **no global single-character shortcuts**, and no ⌘⇧L or ⌘. chords. `mod` is ⌘ when `html[data-platform="mac"]` (checks `metaKey`), else Ctrl (checks `ctrlKey`). Global handlers ignore `event.isComposing`.

| Keys | Scope | Action | Owner |
|---|---|---|---|
| mod+K | Global, including inputs | Open the palette | `useGlobalShortcuts` |
| mod+/ | Global, including inputs | Open the ShortcutSheet | `useGlobalShortcuts` |
| Alt+1…7 (`KeyboardEvent.code` `Digit1`…`Digit7`) | Global; ignored when focus is in `input`, `textarea`, `select` or `[contenteditable]` | Go to the nth nav tab (guarded under the lock) | AppNav |
| Esc | Global | Close the top native dialog, sheet or popover. Otherwise, when `!e.defaultPrevented && !e.isComposing`, no `dialog[open]` and no open Popover/Tooltip exist, and `deriveBroadcast(s) === 'connecting'`: `commands.run('director.cancel')`. Tooltip, Popover and Sheet call `e.preventDefault()` when they consume Esc (§7.3), so dismissing one never cancels a connect | Native + `useGlobalShortcuts`; `director.cancel` is registered by DirectorPlayer (§8.5.12) |
| mod+Enter | Composer textarea | Start Director (idle) or Send direction (live) | Live (§8) |
| ↑ / ↓ | Composer, empty or with the caret at the edge | Recall the last 20 directions | Live (§8) |
| ← → ↑ ↓, Home / End, Enter, G, [ ], mod+Backspace | Shotboard canvas **when focused** | Walk shots and scenes, jump to the first/last shot of the scene, open the inspector, generate, change duration ±1 s, delete with an undo chyron | Shotboard (§9.5.5) |
| Space, J/K/L | A focused clip card, or the open viewer | Open the viewer, then scrub | Clips (§11) |
| X | Locations grid, focused, with 2 selected | A/B compare | Locations (§10) |
| ←/→, Shift+←/→ | A focused chart | Crosshair ±1 / ±10 | Analytics (§11) |

### 7.13 ThemeProvider and ThemeSwitch

**Storage contract (invariant):** `localStorage['theme']` holds exactly `'dark'` or `'light'`, and choosing System **removes** the key. `.dark` on `<html>` and `document.documentElement.style.colorScheme` follow the resolved theme. The pre-paint `themeInit` theme logic is unchanged (§7.6). Tailwind stays `darkMode: 'class'`.

Today, `ThemeToggle`:
- keeps its own `useState(false)`, synced in an effect (`ThemeToggle.tsx:7-11`), so the icon flips after hydration;
- writes `'dark'|'light'` (`:19`);
- sets `.dark` and `colorScheme` (`:16-17`);
- has only a `title` (`:28`);
- offers no System option.

**ThemeProvider:**

| Concern | Behaviour |
|---|---|
| Initial state | `useSyncExternalStore`. Server snapshot `{ pref: 'system', resolved: 'dark' }`. Client snapshot `pref = localStorage.theme ?? 'system'` and `resolved = html.classList.contains('dark') ? 'dark' : 'light'`, returned as a **cached** object that is replaced only when a value changes (a fresh object per call loops forever). React hydrates with the server snapshot and then re-renders with the client one, so nothing that depends on `pref` may render differently before and after hydration: the selected segment and the visible cycle icon come from CSS on `html[data-theme-pref]` (below), not from React state |
| `setPref('light' \| 'dark')` | `localStorage.setItem('theme', pref)` (try/catch), set `html[data-theme-pref]`, then apply |
| `setPref('system')` | `localStorage.removeItem('theme')`, set `html[data-theme-pref="system"]`, resolve from `matchMedia('(prefers-color-scheme: dark)')`, then apply |
| Apply | `html.classList.toggle('dark', resolved === 'dark')`; `html.style.colorScheme = resolved` |
| Live OS changes | While `pref === 'system'`, a `prefers-color-scheme` listener re-applies |
| Other tabs | A `storage` event for key `theme` re-reads and re-applies |
| Carrier | DitherBackground reads `resolved`. The carrier tweens its colours over 300 ms with **no** WebGL context recreation (§12) |

**ThemeSwitch** (`components/shell/ThemeSwitch.tsx`):
- ≥ 768: a `role="radiogroup"` (class `theme-switch`) with `aria-label="Theme"` and three 28 px `role="radio"` segments with `aria-checked` and a roving tabindex: `aria-label="System"` (Monitor icon), `aria-label="Light"` (Sun), `aria-label="Dark"` (Moon). The Light and Dark segments keep the existing titles 'Switch to light mode' and 'Switch to dark mode' (`ThemeToggle.tsx:28`). Each segment carries `data-theme-seg="system|light|dark"`, and the selected look (`bg-accent-soft text-accent`) comes only from the `shell.css` rule on `html[data-theme-pref]` (§7.8), which `themeInit` sets before first paint, so the selection never jumps on hydration. `aria-checked` follows the store after hydration.
- < 768: one `IconButton` (class `theme-cycle`) that cycles System → Light → Dark → System and has the label 'Theme: System', 'Theme: Light' or 'Theme: Dark' (from the store after hydration). It renders all three icons, each with `data-theme-seg`, and CSS shows only the one matching `html[data-theme-pref]`.

### 7.14 DensitySwitch

- `useDensity()`: `density` comes from `html[data-density]`. `setDensity(d)` writes `localStorage['wzrd:density']` (try/catch) and `html.dataset.density`. `locked = deriveLock(broadcast.get())`, kept live.
- `DensitySwitch` is a `SegmentedControl size="sm" label="Density"` with the options Comfortable / Compact. It lives only in the palette: it renders in the CommandPalette footer, alongside the two View commands (§7.11).
- Under the air lock, both are disabled with the visible reason "Locked while on air" (§6.12). Route roots may force a density with their own `data-density` attribute (the Live Control root and the Shotboard inspector use `compact`). The switch never overrides a route root.

### 7.15 ChyronHost and LiveRegion

**ChyronHost** (`components/shell/ChyronHost.tsx`) is a persistent `<section aria-label="Notifications">` with a persistent `<ol>`, `position: fixed`, `z-chyron`, that renders the chyron store (§6.10). Its placement depends on `usePathname()` and the breakpoint:

| Context | `left` | `bottom` | Width |
|---|---|---|---|
| Any route except `/admin`, ≥ 768 | `var(--gutter)` | `calc(var(--h-status) + 12px)` | 360 px |
| `/admin`, ≥ 1024 (over the left rail, never the program column or the transport) | `max(16px, calc((100vw - 1920px) / 2))` (the left edge of `.lc-root`, §8.4.1) | `calc(var(--h-status) + 12px)` | The left-rail width `--rail-l` of §8.4.2: 304 px at 1024–1279; 248 px at 1280–1439; 264 px at 1440–1919; 288 px from 1920. ChyronHost sits outside `.lc-root` and cannot read `--rail-l`, so its classes set the four widths with the §5.15 screens: `lg:w-[304px] xl:w-[248px] wide:w-[264px] 3xl:w-[288px]`. When §8.4.2 changes a width, this row changes with it |
| `/admin`, 768–1023 | 16px | `calc(var(--h-status) + var(--h-transport) + 12px + env(safe-area-inset-bottom))` | 360 px |
| Any route except `/admin`, < 768 | 8px (`right: 8px`) | `calc(var(--h-status) + 8px + env(safe-area-inset-bottom))` | `calc(100vw - 16px)` |
| `/admin`, < 768 | 8px (`right: 8px`) | `calc(var(--h-status) + var(--h-transport) + 8px + env(safe-area-inset-bottom))` | `calc(100vw - 16px)` |

**LiveRegion** (`components/ui/LiveRegion.tsx`) renders exactly two sr-only nodes in the shell: `<div id="live-polite" aria-live="polite" aria-atomic="true">` and `<div id="live-assertive" aria-live="assertive" aria-atomic="true">`. Only `announce()` writes to them. Chyrons and inline errors keep their own `role="status"`/`role="alert"`.

### 7.16 EffectSlotProvider contract (`lib/effectSlot.tsx`)

Each view may run at most **one** effect canvas besides the carrier (§16). An effect canvas is any WebGL context, or any canvas that loops rAF or covers more than 25% of the viewport. dither-kit texture canvases (DitherButton, DitherGradient, DitherAvatar) are exempt.

```ts
export function EffectSlotProvider(props: { children: React.ReactNode }): JSX.Element
export function useEffectCanvasSlot(id: string, priority: number, want: boolean): boolean
```

| Rule | Spec |
|---|---|
| Placement | One provider in `app/admin/layout.tsx`. It persists across admin routes; requests unregister on unmount |
| Registration | `useLayoutEffect` registers `{ id, priority, want, seq }` (`seq` = registration order) and updates it on change; the cleanup unregisters |
| Grant | Among requests with `want === true`, the highest `priority` wins, and ties go to the lowest `seq`. The hook returns `owner === id` |
| Obligations | A component creates its canvas or context **only while granted**, and unmounts it in the same commit when the grant is revoked. A loser renders its static fallback; for example, the idle SymbolRaster renders `<BrandImage id="standby/coast-16x9">` with `image-rendering: pixelated` |
| Dev audit | When `process.env.NODE_ENV !== 'production'`, every change writes `window.__wzrd.slots = { owner: string \| null, requests: Array<{ id, priority, want }> }` |

**Priorities:**

| Id | Component | Priority | Route |
|---|---|---|---|
| `symbol-raster` | SymbolRaster: priority 3 while acquiring and during its 320 ms clear; 1 while idle (standby). One id, whose priority changes with the phase | 3 / 1 | Live |
| `morph` | MorphSlider (Audio dock tab visible, dock open) | 2 | Live, visual-test |
| `chart` | Analytics AreaChart (its perpetual 2D loop) | 1 | Analytics |
| `pixel-card` | PixelCard specimen behind its 'Show PixelCard' switch | 0 | visual-test only |

### 7.17 Broadcast store contract (`lib/broadcast/store.ts`)

```ts
export type Director = 'idle' | 'opening' | 'live' | 'closing' | 'failed' | 'closed'   // RealtimeState + idle + closing
export type Air = 'off' | 'cue' | 'on' | 'stalled' | 'offair'
export interface BroadcastState {
  director: Director
  firstFrame: boolean
  rec: { active: boolean; startedAt?: number; bytes: number }
  air: Air
  airSince?: number
  stalledSince?: number
  whip?: { kbps: number; fps: number; rttMs: number }
}
export const broadcast: {
  get(): BroadcastState
  publish(partial: Partial<BroadcastState>): void   // shallow merge; nested objects are replaced, never mutated
  subscribe(fn: () => void): () => void
  reset(): void                                      // back to the initial state
  setLeaveHandler(fn: (() => Promise<void>) | null): void  // DirectorPlayer registers its disconnect (8C); null clears it
  leave(): Promise<void>                             // awaits the registered handler; resolves at once when none is set
}
export function useBroadcast<T>(select: (s: BroadcastState) => T): T  // select must return a primitive or a stored reference
export function deriveBroadcast(s: BroadcastState): 'idle' | 'connecting' | 'preview' | 'on-air' | 'stopping'
export function deriveLock(s: BroadcastState): boolean
```

The initial state is `{ director:'idle', firstFrame:false, rec:{ active:false, bytes:0 }, air:'off' }`. The module lands in 3A with no publishers. In development only (`process.env.NODE_ENV !== 'production'`), it also sets `window.__wzrd.broadcast = { publish, get }` (typed in §6.2.11), which the (dev, lock) acceptance items and §15 use to set the air lock. `setLeaveHandler` and `leave` are first used in 8C (§6.12).

**Derivation:**

```ts
function deriveBroadcast(s) {
  if (s.director === 'closing') return 'stopping'
  if (s.director === 'opening' || (s.director === 'live' && !s.firstFrame)) return 'connecting'
  if (s.director === 'live') return s.air === 'on' || s.air === 'stalled' ? 'on-air' : 'preview'
  return 'idle'                                        // idle, failed, closed
}
const deriveLock = (s) => deriveBroadcast(s) !== 'idle' || s.rec.active
```

**DOM writes.** `publish` writes these only when a value changes, and `BroadcastProvider` writes them once on mount:
- `html.dataset.broadcast = deriveBroadcast(s)`
- `html.toggleAttribute('data-rec', s.rec.active)`
- `deriveLock(s) ? html.setAttribute('data-lock', 'air') : html.removeAttribute('data-lock')`

**Publishers** (summary; the air rows are specified in §8.5.6):

| Field | Publisher | When |
|---|---|---|
| `director` | DirectorPlayer | Every change of its `state` (`DirectorPlayer.tsx:128`) |
| `firstFrame` | DirectorPlayer's first-frame gate (§6.5) | `true` on the first decoded frame; `false` when `connect()` starts and on `disconnect()` |
| `rec` | DirectorPlayer | Recorder start (`startedAt`), stop, and `bytes` at ≤ 1 Hz |
| `air` (`cue`, `off`, `offair`) | `useTwitchBroadcast` (8C) | `cue` on commit; `off` when the negotiation throws; `offair` on stop and on session end, then `off` (with `airSince: undefined`) 3000 ms later if `air` is still `offair` |
| `air` (`on`, `stalled`, recovery `on`, `off` from `cue`), `airSince`, `stalledSince`, `whip` | `useWhipTruth` (8C) | Truth gate, stall and recovery; `off` from `cue` on negotiation failure (§6.7) |
| everything | DirectorPlayer unmount | `broadcast.reset()`, so the lock never outlives Live Control |

The stalled chyron is not a store field: `BroadcastProvider` derives it from `air === 'stalled'` and is its only publisher (§6.7).

Consumers: TallyBar, TallyCluster, StatusRail, BroadcastProvider, DitherBackground (re-reads `--dither-*` on change), AppNav (lock), ChyronHost and `chyron.push` (lock), `useDensity` (lock), and every hook-enforced row of §6.12.

### 7.18 Acceptance criteria

**How to run.** Run modes are §1.6's **prod**, **dev** and **fixture** (the same definitions as the §6.16 intro). Shell, navigation, title and network items run on **prod** unless marked. Items marked (fixture) run at `/admin/visual-test?noboot#design-system-visual-test` in dev; the route returns 404 in prod. Items marked (dev, lock) run on `/admin` in dev after `window.__wzrd.broadcast.publish({ director: 'live', firstFrame: true })`. Commands whose paths start with `dashboard/`, and `git` commands with such pathspecs, run from the repository root; every other command runs from `dashboard/`.

**Foundations and primitives**
- [ ] Every path in §7.2–§7.5 exists, and `npm run typecheck` exits 0 with the listed signatures. A fixture file under `app/admin/visual-test/` imports and calls each one.
- [ ] `grep -rnE "#[0-9a-fA-F]{3,8}\b|fal-(gray|primary|green|yellow|blue|red)-" dashboard/components/{ui,broadcast,states,generation,shell,brand}` prints nothing (tokens only).
- [ ] (fixture) The format specimen renders every §5.20.4 table row with its expected value, for example `bytes(1610612736)` → '1536.0 MB' and `bytes(1610612736, { gb: true })` → '1.50 GB'.
- [ ] `grep -c "use client" components/ui/buttonClassName.ts` prints `0`, `grep -rn "buttonClassName" app | grep "components/ui/Button'"` prints nothing, and `npm run qa:build` exits 0 with `/_not-found` in its route table (`grep -c "/_not-found" .qa/build.log` prints at least `1`).
- [ ] (fixture) A primary `Button` given a `ref` still paints: its DitherButton `canvas` has at least one pixel with non-zero alpha, and `ref.current` is the inner `<button>`.
- [ ] (fixture) `getByRole('button', { name: 'Cancel' })` never matches a ConfirmDialog button, and `grep -rn "cancelLabel=\"Cancel\"" dashboard` prints nothing. In an open ConfirmDialog, the cancel button precedes the confirm button in DOM order and is `document.activeElement`.
- [ ] `useConvexAuthState` is exported from `components/ConvexClientProvider.tsx`, and `git diff 845147c -- dashboard/components/ConvexClientProvider.tsx` shows only additions.
- [ ] (dev) `typeof window.__wzrd.broadcast.publish === 'function'`; on prod, `window.__wzrd?.broadcast === undefined`.

**Shell structure**
- [ ] On every route: exactly one `banner`, one `navigation` named 'Admin sections', one `main` with `id="content"`, one `contentinfo` and one `h1`. The first focusable element is the 'Skip to content' link, and activating it focuses `#content`.
- [ ] `document.body.firstElementChild` is the DitherBackground host (`div.fixed.inset-0` with `aria-hidden`).
- [ ] `git diff 845147c -- dashboard/app/layout.tsx` shows the seven theme lines of `themeInit` (`app/layout.tsx:12-18` at 845147c) unchanged, and the served HTML's inline `themeInit` sets `data-theme-pref` and `data-dock` before `</head>`.
- [ ] `grep -n "next/dynamic" app/layout.tsx` prints nothing, and `head -1 components/shell/PaletteHost.tsx` is `'use client'`.
- [ ] `grep -rn "Powered by FAL realtime\|LTX" dashboard/app/layout.tsx` prints nothing, and `document.querySelector('meta[name=description]').content` equals the §7.7 description.
- [ ] `document.title` equals the §7.7 table value on each of the 8 admin routes (visual-test in dev).
- [ ] `curl -s localhost:3109/admin/clips | grep -o '<title>[^<]*'` prints `<title>Clips · stream.wzrd.tech admin`, and the same command for `/admin` prints `<title>Live Control · stream.wzrd.tech admin`.
- [ ] `grep -c "^@layer components" app/styles/shell.css` prints `1`, and `grep -nE "^\s*:root\s*\{|--h-chrome\s*:" app/styles/shell.css` prints nothing.

**Nav, CommandBar, StatusRail**
- [ ] At 1440, 1366, 1280, 1100, 900 and 390 px wide: `getByRole('link', { name })` resolves each of the 7 labels to its exact href, exactly one link has `aria-current="page"`, and `document.querySelectorAll('nav[aria-label="Admin sections"]').length === 1`.
- [ ] At 1366 and 1280 px wide: `nav.scrollWidth <= nav.clientWidth` for the Admin sections nav, and the nav's bounding box does not intersect the TallyCluster's.
- [ ] At 390 px on `/admin/recordings`, the Recordings link's bounding box lies fully inside the nav's box after load, and `window.scrollY === 0`.
- [ ] At 1100 px and at 1280 px, the inactive links show no visible label text, and hovering the 'Clips' icon shows a Tooltip reading 'Clips'.
- [ ] Unconfigured `/admin` load: zero requests to `/api/*` (the rail makes no probes), and the CONVEX LED button's accessible name is 'CONVEX · NOT PATCHED'.
- [ ] After mount, `[data-testid="status-clock"]` text matches `/^\d\d:\d\d:\d\d$/` and changes once per second. (dev) With `installCommitProbe` (§15.6) on `/admin/clips`, `commitsDuring(page, () => page.waitForTimeout(5_000))` returns `rendered` whose only key is `RailClock`, with a count of 4–6.

**Palette and keyboard**
- [ ] `page.keyboard.press('Control+K')` (non-mac UA) opens `dialog[open]` containing a `role="combobox"`. Before opening, `document.querySelector('[role="listbox"]') === null`. Escape closes it, and focus returns to the previously focused element.
- [ ] Typing "shot" in the palette makes 'Shotboard' the first option, and Enter navigates to `/admin/shotboard`.
- [ ] `Alt+2` with `body` focused navigates to `/admin/shotboard`; `Alt+2` inside the premise textarea does not change the URL.
- [ ] On `/admin` with `body` focused, pressing each of `r f m c ? l .` changes neither the URL, the open dialogs nor the store state.
- [ ] `Control+/` opens a dialog titled 'Keyboard shortcuts' that lists every row of §7.12.
- [ ] (dev) On `/admin`, after `window.__wzrd.broadcast.publish({ director: 'opening' })`, open the CONVEX LED Popover and press Esc once: the Popover closes, a window bubble-phase `keydown` listener installed by the test sees `e.defaultPrevented === true`, and `window.__wzrd.broadcast.get().director` is still `'opening'`.

**Theme and density**
- [ ] Clicking the 'Light' radio sets `localStorage.theme === 'light'`, removes `.dark`, and sets `colorScheme` to 'light'. Clicking 'System' makes `localStorage.getItem('theme') === null`. Each survives a reload with no hydration warning in the console.
- [ ] With `localStorage.theme === 'light'`, on reload: at `DOMContentLoaded`, `document.documentElement.dataset.themePref === 'light'` and the `.theme-switch [data-theme-seg="light"]` segment already computes the selected background; 500 ms after `load`, the same segment is still the only one with that background.
- [ ] With 'System' selected, `emulateMedia({ colorScheme: 'dark' })` then `'light'` toggles `.dark` live without a reload.
- [ ] 10 theme toggles leave exactly one WebGL context and zero console messages (§15 canvas audit).
- [ ] Choosing Compact sets `localStorage['wzrd:density'] === 'compact'`, and on reload `html[data-density="compact"]` is set before first paint. (fixture) Under the simulator's lock, the DensitySwitch is disabled and shows 'Locked while on air'.

**Chyrons, slots, store**
- [ ] (dev) With one chyron visible (`window.__wzrd.broadcast.publish({ air: 'stalled', stalledSince: Date.now() })` makes BroadcastProvider push the stalled chyron on any route; `window.__wzrd.broadcast.reset()` afterwards), ChyronHost's bounding box matches the §7.15 table (±1 px) at 1440×900 on `/admin/clips`, 1440×900 on `/admin` (left 16, width 264), 1280×800 on `/admin` (left 16, width 248), 1024×768 on `/admin` (left 16, width 304), 900×800 on `/admin`, and 390×844 on `/admin/clips`.
- [ ] (dev) `window.__wzrd.slots.owner` is `null` or one id on every route. Two canvases with a WebGL or looping context never exist inside `main` at the same time.
- [ ] (fixture) Simulator: `director:'opening'` → `data-broadcast="connecting"` and `data-lock="air"`. `director:'live', firstFrame:true` → `preview`. `rec:{active:true, bytes:0}` with `director:'idle'` → `data-rec` present and `data-lock="air"`. `reset()` removes `data-rec` and `data-lock` and sets `idle`.
