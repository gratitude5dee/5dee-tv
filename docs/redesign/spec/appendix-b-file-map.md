> **Spec chapter Appendix B — File map.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## Appendix B — File map

Paths are relative to `dashboard/`, and a leading `../` marks a repo-root path (`../.agents/`, `../docs/`, `../streaming_pipeline/`). Line references are **as of 845147c**.
- The "Milestone" column follows the §14 plan. The chapter PR id (for example `8A` or `10C`) says which part of the milestone lands the file.
- If §14 and this appendix disagree on **placement**, §14 wins. On **paths and names**, this appendix wins, and B.6 records every resolution.
- At the end of each milestone, run `git diff --name-status 845147c...HEAD -- dashboard .agents` (from the repository root) and check it against B.1–B.3. B.4 is checked by the §1.4 never-touch check, which diffs against `main`: `docs/redesign/{audit,baseline}/**`, `docs/redesign/component-prompts.csv` and the spec itself were committed after 845147c, so a diff from 845147c always lists them.

### B.1 New files

**Harness, foundations, styles and checks (§5, §15)**

| Path | Purpose | Milestone | Chapter |
|---|---|---|---|
| `scripts/checks/{grep-gates.sh,route-sizes.mjs,qa-build.sh,appendix-a.mjs}` | Gates. `appendix-a.mjs` is the Appendix A check (A.14): it reads `../docs/redesign/spec/appendix-a-preserved-contract.md` and must exit 0 on the 1A branch | M1 (1A) | §15.1–§15.3 |
| `playwright.config.ts`, `tests/global-setup.ts`, `tests/screenshot.css`, `tests/helpers/*`, `tests/lib/*` and the core specs (§15.1 list) | The §15 harness. §15.1 owns the full list | M1 (1A) | §15.1, §15.4, §15.5 |
| `tests/contrast.spec.ts`, `tests/lib/contrast.ts` | The contrast ledger over #5555AA (maths: §5.6) | M1 (1A) | §5.6, §15.4 |
| `tests/live-extraction.spec.ts` | Transient: the 8A parity proof. Created in 1A, run unchanged by 8A, deleted in 8B (B.3) | M1 (1A) | §15.5, §8.5.4 |
| `app/styles/tokens.css` | Every global custom property plus the base element rules, in `@layer base` | M1 (1B) | §5.2 |
| `app/styles/bayer.css` | 16 Bayer mask tiles (generated, B.5) | M1 (1B) | §5.13 |
| `app/styles/keyframes.css` | Every `@keyframes` except the `boot-*` keyframes, which `BOOT_CSS` owns | M1 (1B) | §5.14 |
| `app/styles/components.css` | Carrier classes and legacy shims (`.fal-*`, `.connection-*`, `.pixel-card*`), in `@layer components` | M1 (1B) | §5.14, §5.18 |
| `app/styles/utilities.css` | Custom utilities (`.px-resolve`, `.sq`, `.surface-*`, `.skeleton-dither`, …), in `@layer utilities` | M1 (1B) | §5.14 (§6.15 and §12.3.3 point to it) |
| `app/styles/fonts-legacy.css` | `globals.css:5-46` verbatim; **1B only**, deleted in M2 | M1 (1B) | §5.1 |
| `app/fonts.ts` | `next/font/local` Focal (4 woff2) + `next/font/google` JetBrains Mono | M2 | §5.20.1 |
| `lib/motion/tokens.ts` | Motion tokens in TS | M1 (1B) | §5.12 |
| `lib/format.ts` | `tc`, `tcShort`, `duration`, `bytes`, `formatMime` (M2); `hms`, `uptime`, `extFromMime`, `stamp`, `day`, `hhmm` (appended in 11A) | M2, M8 (11A) | §5.20.4, §11.0 |
| `scripts/gen-bayer.mjs` | Generates `app/styles/bayer.css`; has a `--check` mode | M1 (1B) | §5.13 |
| `scripts/codemods/foundations.mjs` | The codemods, one `--step <name>` per run (step names: §5.19) | M1 (1B) | §5.19 |
| `scripts/checks/css-layers.mjs`, `cn.mjs`, `format.mjs`, `uppercase.mjs`, `lucide.mjs` | Gates | M1 (1B: `css-layers`, `cn`), M2 (`format`, `uppercase`, `lucide`; `lucide` passes from 5A) | §5.17, §5.20, §5.21 |
| `scripts/checks/uppercase-allowlist.txt`, `lucide-allowlist.txt` | Allowlists (the uppercase file, its sites and its total ≤ 9: §5.20.5) | M2 | §5.20.5, §5.20.6 |

**Carrier, brand pipeline and outputs (§12.3.1, §13)**

| Path | Purpose | Milestone | Chapter |
|---|---|---|---|
| `types/wzrd.d.ts` | `Window` globals: `__wzrdDitherReady`, `__wzrd` (boot, slots, frames, carrier, broadcast, renders) | M3 (3A) | §6.2.11 |
| `hooks/useReducedMotion.ts`, `hooks/usePageVisible.ts` | Foundations the carrier needs | M3 (3A) | §7.2 |
| `lib/broadcast/store.ts` | Broadcast store (no publishers; dev `window.__wzrd.broadcast`) | M3 (3A) | §7.17 |
| `components/shell/ThemeProvider.tsx` | Theme store; ThemeToggle is rewired to it | M3 (3A) | §7.13 |
| `scripts/brand/{generate,assets,prompts,endpoints,fal,pricing,quantize,encode,video,placeholders,manifest,check,util}.mts`, `no-network.mjs`, `pricing.fallback.json`, `tsconfig.json` | The offline pipeline. The keyless commands (`build`, `check`, `plan`), `placeholders.mts` and `no-network.mjs` land in 3B; the paid path (`run`, `approve`) runs only in the M9 `brand` part (B.6 R-10) | M3 (3B), M9 (`brand`) | §13.3 |
| `scripts/brand/approved.json` | Provenance, committed: `{ "version": 1, "sheet": null, "assets": {} }` until a D5 run fills it | M3 (3B), M9 (`brand`) | §13.3.5 |
| `scripts/brand/spend.jsonl` | Committed spend ledger; first written by the M9 `brand` run | M9 (`brand`) | §13.3.4 |
| `public/brand/**`, `public/brand/manifest.json`, `lib/brandAssets.ts` | Built outputs (B.5): every placeholder and derived file from the keyless build in 3B; approved finals replace the placeholders in the M9 `brand` part when the D5 secrets exist | M3 (3B), M9 (`brand`) | §13.6, §13.8 |
| `components/boot/masks.ts` | 1-bit wordmark masks (generated, B.5) | M3 (3B) | §6.2.1, §13.6.11 |
| `lib/pixelFont.json` | The PX5×7 glyph table shared by PixelFace and the brand build (content: §12.3.4) | M3 (3B) | §12.3.4, §13.6.10 |
| `components/brand/{Wordmark,CoastLoader,BrandImage,BrandVideo}.tsx` | Brand components (the shell, route fallbacks and slates use them from M4) | M3 (3B) | §7.5, §13.8 (BrandImage/BrandVideo API) |
| `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png`, `app/opengraph-image.alt.txt`, `app/twitter-image.png`, `app/twitter-image.alt.txt` | Metadata files (B.5), from the same keyless build | M3 (3B), M9 (`brand`) | §13.6.9 |
| `app/manifest.ts` | Web app manifest, written by hand once (BC-13 needs it from the first `brand:check`) | M3 (3B) | §13.6.10 |

**Shell, boot and route states (§6, §7, §11.D)**

| Path | Purpose | Milestone | Chapter |
|---|---|---|---|
| `hooks/useDelayedFlag.ts`, `useLoadState.ts`, `useDensity.ts` | Foundations | M4 (4A) | §7.2 |
| `hooks/useOnline.ts` | The `online`/`offline` store (StatusRail NET LED, OfflineBanner) | M4 (4A) | §7.2 (B.6 R-11) |
| `hooks/useInView.ts` | IntersectionObserver hook (BrandVideo, posters) | M4 (4A) | §7.2 (B.6 R-11) |
| `lib/leaveGuard.ts` | `useLeaveGuard()` and `useLeaveRequest()`: the leave-confirm guard under the air lock | M4 (4A) | §7.2, §6.12 |
| `lib/motion/ticker.ts`, `lib/clock.ts`, `lib/bayer.ts`, `lib/announce.ts`, `lib/chyron.ts`, `lib/statusMessage.ts`, `lib/commands.ts`, `lib/effectSlot.tsx` | Foundations | M4 (4A) | §7.2, §7.16 |
| `components/ui/{Button,IconButton,Tooltip,Kbd,Popover,Dialog,ConfirmDialog,SegmentedControl,InlineBanner,BayerSpinner,VisuallyHidden,SkipLink,LiveRegion}.tsx` | Primitives consumed by the shell and the route states (the §14.3 R3 set; one default export per file; `ConfirmDialog` with its full §7.3 API) | M4 (4A) | §7.3 |
| `components/ui/buttonClassName.ts` | `buttonClassName(variant, size)`, with no `'use client'`, so server files (`app/not-found.tsx`) import it | M4 (4A) | §7.3 |
| `components/broadcast/{Led,TallyLight,TallyCluster}.tsx` | Lamps, LEDs and the cluster (`TallyLight` gains `fault`/`stale` in 11A) | M4 (4A) | §7.4 |
| `components/effects/PixelFace.tsx`, `components/effects/px5x7.ts` | PX5×7 faces for slate kickers and md lamps; `px5x7.ts` re-exports `lib/pixelFont.json` (B.6 R-24) | M4 (4A) | §12.3.4 |
| `app/styles/shell.css` | `.cmdbar`, `.nav-link`, `.nav-indicator`, `.nav-led`, `.route-progress`, `.rp-fill`, `.rp-edge`, in `@layer components`; its line goes at its §5.1 position | M4 (4B) | §7.8 |
| `app/admin/template.tsx` | Route-enter resolve (server) | M4 (4B) | §6.4.1 |
| `components/shell/CommandBar.tsx` | The 48 px banner | M4 (4B) | §7.8 |
| `components/shell/AppNav.tsx` | `git mv components/AdminNav.tsx` (the `tabs` array stays byte-identical) + indicator, `useLeaveGuard()`, Alt+1…7 | M4 (4B) | §7.9, §12.3.8 |
| `components/shell/StatusRail.tsx` | The 24 px contentinfo: LEDs, clock | M4 (4B) | §7.10 |
| `components/shell/ThemeSwitch.tsx` | Theme switch; replaces ThemeToggle | M4 (4B) | §7.13 |
| `components/shell/DensitySwitch.tsx` | Density control (palette only) | M4 (4B) | §7.14 |
| `components/shell/CommandPalette.tsx`, `ShortcutSheet.tsx`, `PaletteHost.tsx` | The native-`<dialog>` palette, its `next/dynamic` host, and the shortcuts dialog | M4 (4B) | §7.6, §7.11 |
| `components/shell/ChyronHost.tsx` | Notifications region | M4 (4B) | §7.15 |
| `components/shell/RouteProgress.tsx` | `useLinkStatus` progress | M4 (4B) | §6.4.3 |
| `components/shell/OfflineBanner.tsx` | The NO CARRIER banner; the only writer of `html[data-offline]` | M4 (4B) | §7.6 |
| `components/shell/BroadcastProvider.tsx` | Every §6.7/§6.12 side effect: title and favicon swap, announcements, the stalled chyron, recovery, the off-air message, `beforeunload`, the mouse-button guard | M4 (4B) | §6.7, §6.12, §7.6 |
| `components/shell/TallyCluster.tsx` | Re-export of `components/broadcast/TallyCluster` | M4 (4B) | §7.6 |
| `app/admin/{shotboard,characters,locations,clips,recordings,analytics,visual-test}/layout.tsx` (7) | Title-only server layouts | M4 (4B) | §7.7 |
| `components/boot/BootMarkup.tsx` | Server component: `BOOT_CSS`, `#wzrd-boot-host`, `BOOT_SCRIPT` | M4 (4C) | §6.2.1 |
| `components/boot/bootScript.ts` | `BOOT_SCRIPT` (the generated body with both masks substituted), `BOOT_CSS`, `bootHtml()` (provenance: Pixel Swap, Shiny Text) | M4 (4C) | §6.2, §12.3.2, §12.3.15 |
| `components/boot/boot.src.js`, `components/boot/bootScript.generated.ts`, `scripts/gen-boot.mjs` | The readable boot source, its minified output (generated, B.5) and the generator | M4 (4C) | §6.2.1 |
| `app/admin/(live)/page.tsx` | Rename: `git mv app/admin/page.tsx 'app/admin/(live)/page.tsx'` (B.2) | M4 (4D) | §6.3 |
| `app/admin/(live)/loading.tsx` and `app/admin/{shotboard,characters,locations,clips,recordings,analytics}/loading.tsx` (7) | Route fallbacks, all created in 4D; the routes whose layout-exact skeleton comes later use RouteSkeleton until then (B.6 R-1) | M4 (4D) | §6.3 |
| `components/states/{Slate,ErrorState,Skeleton}.tsx` | State primitives (`Slate` with `titleAs`) | M4 (4D) | §7.5 |
| `components/states/skeletons/{StudioSkeleton,RouteSkeleton}.tsx` | The final studio skeleton, and the interim route skeleton (deleted in 11C, B.3) | M4 (4D) | §6.3, §7.5, §10.4.7 |
| `app/not-found.tsx`, `app/admin/error.tsx`, `app/global-error.tsx` | Route states | M4 (4D) | §11.D.2–§11.D.4 |
| `app/admin/visual-test/ThrowProbe.tsx` | Dev-only `?throw=render` probe | M4 (4D) | §11.D.10 |

No `app/admin/loading.tsx` and no `app/admin/visual-test/loading.tsx` ever exist: a Suspense boundary above a `notFound()` page turns its 404 into a 200 (§6.3).

**Primitives, generation and effects (§7, §12)**

| Path | Purpose | Milestone | Chapter |
|---|---|---|---|
| `components/ui/{HoldButton,Panel,SectionHeader,PageHeader,Field,Input,Textarea,Select,Switch,Checkbox,RadioGroup,Slider,NumberStepper,Badge,Chip,Tabs,Sheet,ScrollFade}.tsx` | The remaining controls | M5 (5A) | §7.3 |
| `components/states/{NotConfigured,AuthRequired}.tsx` | Not-configured and auth slates (copy: §11.D.7) | M5 (5A) | §7.5, §11.D.7 |
| `app/admin/visual-test/DesignSystemFixture.tsx`, `lib/fixtures/designSystem.ts` | `section#design-system-visual-test` with the `#ds-*` specimen hosts (specimens added in 5B and 5C; 8B adds `ds-connect` and the page parts add their skeleton compositions; 10F removes the RouteSkeleton specimen). 8B also edits `lib/fixtures/designSystem.ts`: it replaces the five literal CONNECT_STEPS strings of `FX_DECRYPT_LABELS` with the import from `components/director/constants.ts` (§8.2) | M5 (5A), M6 (8B), M7 (10F) | §10.5.9, §8.2 |
| `components/broadcast/{TallyBar,Readout,LedLadder,StatTile,FreshnessStamp}.tsx` | The remaining broadcast primitives | M5 (5B) | §7.4 |
| `components/generation/{GenerationFrame,StageTrack,ContactSheet}.tsx` | Generation primitives | M5 (5B) | §6.6, §7.5, §12.3.6 |
| `components/effects/{PxResolve,DecryptedText,StreamList,SelectionBrackets,SymbolRaster,HoloCard,HoverClipButton,CountUp}.tsx` | The remaining effect picks | M5 (5C) | §12.3 |
| `components/effects/SelectionBrackets.module.css`, `HoloCard.module.css` | The only two CSS modules | M5 (5C) | §12.3.9, §12.3.11 |
| `public/fixtures/testcard-320x180-2s.webm`, `.mp4` | Same-origin fixture media for the HoverClipButton specimen, reused by §11 (generated once, B.5) | M5 (5C) | §11.0, §12.3.12 |

**Live Control (§8)**

| Path | Purpose | Milestone |
|---|---|---|
| `components/director/{constants,useDirectorSession,eventLog,firstFrame,useTwitchBroadcast}.ts` | The extracted engine, moved verbatim. 8C adds `useTwitchBroadcast`'s `whip` state, `air` publishes, `onNegotiationFailed` and the `twitch.stop` command (§8.2) | M6 (8A, 8C) |
| `components/director/{MonitorLabelStrip,DirectorStage,TransportBar,TelemetryStrip,AlertTray,SessionSheet,Rundown,Dock}.tsx` | Instrument parts (legacy markup in 8A, restyled in 8B/8C) | M6 (8A–8C) |
| `components/states/skeletons/LiveSkeleton.tsx` | Layout-exact skeleton; swaps into `app/admin/(live)/loading.tsx` | M6 (8B) |
| `components/director/preflight.ts`, `LiveControlVisualFixture.tsx` | Preflight rows; the `#live-control-visual-test` fixture | M6 (8B) |
| `components/director/diagnostic.ts` | Pure `formatDiagnostic(d)`: the ConnectPlate diagnostic line, with its detail-key allowlist and address masking (§8.5.6) | M6 (8B) |
| `tests/unit/diagnostic.spec.ts` | `formatDiagnostic` cases, run in the §15 `unit` project (§8.5.6, §8.10 B32) | M6 (8B) |
| `app/styles/live-control.css` | `.lc-*` rules; its line goes at its §5.1 position | M6 (8B) |
| `lib/broadcast/useWhipTruth.ts` | `useWhipTruth` and the pure `nextAir` reducer: the WHIP truth gate (wraps `lib/twitchWhip.ts`; algorithm §8.5.6) | M6 (8C) |
| `tests/whip-truth.spec.ts` | The `nextAir` cases (§8.5.6, §8.10 C3) | M6 (8C) |

**Shotboard (§9)**

| Path | Purpose | Milestone |
|---|---|---|
| `components/shotboard/{ShotboardView,ShotboardBoundary}.tsx`, `layout.ts`, `directorTransfer.ts`, `lib/shotPrompt.ts` | Composition root, error boundary, geometry, the pure transfer pipeline, prompt layers | M7 (9A) |
| `components/states/skeletons/ShotboardSkeleton.tsx` | Layout-exact skeleton; swaps into `app/admin/shotboard/loading.tsx` | M7 (9A) |
| `components/shotboard/{useDirectorTransfer,useShotGeneration,usePromptExpansion}.ts` | Transfer, generation and expansion hooks | M7 (9A, 9C) |
| `components/shotboard/{useShotboardSelection,useUndoDelete}.ts` | Selection and undo | M7 (9B) |
| `components/shotboard/{SlateBar,SceneRail,CastStrip,TrackCanvas,SceneTrack,ShotFrame,TransferSheet,ShotboardVisualFixture}.tsx` | Layout and fixture | M7 (9B, 9C) |
| `components/shotboard/inspector/{Inspector,ShotInspector,SceneInspector,CharacterInspector,BoardInspector,PromptLineage,ModelChip,MentionCombobox,LocationPicker}.tsx` | Inspector | M7 (9B, 9C) |
| `components/shotboard/ShotContactSheet.tsx` | Contact-sheet view (cut item 20) | M7 (9D) |
| `app/styles/shotboard.css` | `.sb-*` rules; its line goes at its §5.1 position | M7 (9B) |
| `tests/shotboard.spec.ts`, `tests/unit/{shotboard-load,shot-prompt,shot-model,director-transfer,frame-geometry,shot-strings}.spec.ts` | Specs | M7 (9A–9D) |

**Characters, Locations, fixture (§10)**

| Path | Purpose | Milestone |
|---|---|---|
| `components/asset-studio/{types,format}.ts`; `{StudioHero,CharacterSourceForm,LocationSourceForm,Darkroom}.tsx` | Moved in 10A, then restyled | M7 (10A–10E) |
| `components/asset-studio/{StudioGallery,StudioStatus}.tsx` | Transient: created in 10A; deleted in 10D/10E and 10C respectively | M7 |
| `components/asset-studio/{useStudioDraft,useGuardedSelect}.ts` | Draft safety | M7 (10B) |
| `components/asset-studio/useSheetPipeline.ts`; `{SheetTray,SheetViewer,ReferenceTray,ReadinessRow}.tsx` | Shared studio parts | M7 (10C) |
| `components/asset-studio/{CharacterStudioView,RosterRail,StudioAvatar,TalentBible}.tsx` | Characters "Casting" | M7 (10D) |
| `components/asset-studio/{LocationStudioView,ScoutWall,ScoutPlate,ScoutReport,CompareSheet,TimeOfDayKeys}.tsx` | Locations "Scout wall" | M7 (10E) |
| `app/styles/studio.css` | `.asset-studio` grid rules; its line goes at its §5.1 position | M7 (10C) |
| `lib/fixtures/assetStudio.ts` | Frozen fixture data | M7 (10F) |

**Clips, Recordings, Analytics (§11)**

| Path | Purpose | Milestone |
|---|---|---|
| `components/media/{ClipsView,SessionGroup,SessionReel,MediaCard,MediaScreen,MediaViewer,LibraryVisualFixture}.tsx`; `useClipsLibrary.ts`, `fixtures.ts`, `layout.ts` | Clips | M8 (11A) |
| `components/states/skeletons/ClipsSkeleton.tsx` | Layout-exact skeleton; swaps into `app/admin/clips/loading.tsx` | M8 (11A) |
| `components/media/{RecordingsView,RecordingRow}.tsx`, `useRecordings.ts` | Recordings | M8 (11B) |
| `components/states/skeletons/RecordingsSkeleton.tsx` | Layout-exact skeleton; swaps into `app/admin/recordings/loading.tsx` | M8 (11B) |
| `lib/clips.ts`, `lib/download.ts`, `lib/media/posterQueue.ts`, `lib/media/fixInfiniteDuration.ts` | Library logic | M8 (11A) |
| `app/styles/library.css`, `app/styles/analytics.css` | `.lib-*`, `.media-*`, …; `.an-*`, `.chart-*`; each line goes at its §5.1 position | M8 (11A, 11C) |
| `components/analytics/{useTwitchAnalytics,lampState,fixtures}.ts`; `{ConvexHistory,AnalyticsView,OnAirStrip,OnAirLamp,UptimeReadout,StreamRail,AnalyticsVisualFixture}.tsx` | Analytics | M8 (11C) |
| `components/states/skeletons/AnalyticsSkeleton.tsx` | Layout-exact skeleton; swaps into `app/admin/analytics/loading.tsx` | M8 (11C) |
| `components/charts/{ChartFigure,ChartStatic}.tsx`, `chartData.ts` | Accessible chart | M8 (11C) |
| `public/fixtures/testcard-thumb.jpg`, `public/fixtures/testcard-avatar.png` | Same-origin fixture images for the mocked-API e2e | M8 (11C) |
| `tests/library.spec.ts`, `tests/recordings.spec.ts`, `tests/analytics.spec.ts`, `tests/helpers/twitch.ts`, `tests/unit/{clip-status,format-media,lamp-state,chart-data}.spec.ts` | Specs | M8 (11A–11C) |
| `tests/unit/global-error.spec.ts` | The `app/global-error.tsx` unit spec (content: §11.D.10) | M4 (4D) |

### B.2 Changed files

| Path | Nature of change | Milestone |
|---|---|---|
| `package.json`, `package-lock.json` | Remove `recharts` and `@fal-ai/serverless-client` (0A). Add the devDependencies `@playwright/test` 1.56.1, `@axe-core/playwright` 4.13.0 and the §15.1 scripts (1A); `postcss-import` 15.1.0 (1B); `sharp` 0.34.5 and the `brand:*` scripts (3B). No runtime dependency (D8) | M0 (0A), M1 (1A, 1B), M3 (3B) |
| `postcss.config.js` | `postcss-import` first | M1 (1B) |
| `tailwind.config.js` | Rewritten: token colours and the collision fix (1B); `fontFamily`/`fontWeight` (M2); the deprecated `fal-*` aliases deleted (M9 `sweep`) | M1 (1B), M2, M9 (`sweep`) |
| `tsconfig.json` | `"exclude": ["node_modules", "scripts", "tests", "playwright.config.ts"]` (§15.1). 3B only verifies that `"scripts"` is present | M1 (1A) |
| `.gitignore` | 1A appends `test-results/`, `playwright-report/` and `.qa/`; 3B appends `scripts/brand/.cache/` (before the first `brand:gen`) (B.6 R-19) | M1 (1A), M3 (3B) |
| `app/globals.css` | Becomes the import list only (§5.1). Each surface PR adds its line at its §5.1 position: `shell.css` 4B, `live-control.css` 8B, `shotboard.css` 9B, `studio.css` 10C, `library.css` 11A, `analytics.css` 11C | M1 (1B), M4 (4B), M6 (8B), M7 (9B, 10C), M8 (11A, 11C) |
| `app/layout.tsx` | Font classes (M2); ThemeProvider and the veil (3A); the shell, metadata, viewport and appended `themeInit` blocks, with the footer and header removed (4B); the boot and the wordmark preload (4C) | M2, M3 (3A), M4 (4B, 4C) |
| `app/admin/layout.tsx` | AdminNav removed; `EffectSlotProvider`; `metadata.title` with the default 'Live Control' and the admin template (text: §7.7) | M4 (4B) |
| `app/admin/(live)/page.tsx` (from `app/admin/page.tsx`) | 4B adds `<h1 className="sr-only">Live Control</h1>` at the old path. 4D moves the file with `git mv` (the import becomes `../../../components/DirectorPanel`). 8B replaces the `space-y-8` wrapper with a fragment. It stays `'use client'` | M4 (4B, 4D), M6 (8B) |
| `app/admin/shotboard/page.tsx` | Interim sr-only `<h1>` (4B); `<Suspense fallback>` (9A); the interim h1 deleted (9B) | M4 (4B), M7 (9A, 9B) |
| `app/admin/clips/page.tsx`, `recordings/page.tsx`, `analytics/page.tsx` | Interim sr-only `<h1>` (4B); containers only, gates and queries unchanged, with the interim h1 deleted (11A–11C) | M4 (4B), M8 (11A–11C) |
| `app/admin/visual-test/page.tsx` | The `notFound()` line stays byte-identical. §10.5.9 owns the final file; each owning PR adds only its own import and element: `<Suspense fallback={null}>` and `<ThrowProbe />` (4D), `DesignSystemFixture` (5A), `LiveControlVisualFixture` (8B), `ShotboardVisualFixture` (9B), `LibraryVisualFixture` (11A), `AnalyticsVisualFixture` (11C) | M4 (4D), M5 (5A), M6 (8B), M7 (9B), M8 (11A, 11C) |
| `components/DitherBackground.tsx`, `components/reactbits/Dither.jsx`, `Dither.css` | Carrier hardening; header line 5 added to `Dither.jsx` (§12.3.1) | M3 (3A) |
| `components/ThemeToggle.tsx` | Rewired to ThemeProvider (one theme writer) until 4B deletes it (B.3) | M3 (3A) |
| `components/reactbits/MorphSlider.tsx` | Render-on-demand patch, live reduced motion, `loseContext()` after `dispose()` (§12.4.1; §8 makes no edit) | M5 (5C) |
| `components/reactbits/MorphSlider.css` | Remove `backdrop-filter` (`:39-40`, `:65-66`) and retint the violet (§5.10); line 44 keeps `uppercase` | M1 (1B) |
| `components/ConvexClientProvider.tsx` | Additive `useConvexAuthState()` export only | M4 (4A) |
| `components/ConvexNotConfigured.tsx` | Thin wrapper over `NotConfigured` | M5 (5A) |
| `components/DirectorPlayer.tsx` | Composition root ≤ 320 lines; re-exports `DIRECTOR_MODEL`; 8C adds the leave handler and the Stop confirm (DEC-8-14) | M6 (8A–8C) |
| `components/DirectorSettingsForm.tsx`, `ScriptEditor.tsx`, `ScriptTemplatePicker.tsx`, `ChatSteerer.tsx`, `TrackManager.tsx`, `TwitchBroadcast.tsx`, `AssetUrlInput.tsx` | Live Control restyle and additive props (§8.2); 8C adds the ScriptTemplatePicker link guards. `TrackManager.tsx` also changes in 1B (the `:144` backdrop and violet classes), M2 (the authored `COAST ORIGINALS · {n} TRACKS`) and 5C (the `autoplay` props removed; MorphSlider through `next/dynamic`) | M1 (1B), M2, M5 (5C), M6 (8B, 8C) |
| `components/shotboard/ShotboardPage.tsx` | Gate only | M7 (9A) |
| `components/shotboard/useShotboard.ts` | Additive only: the load-state fix for `:373`, `syncState`, `settled()`, `reload()`, reorder/restore, ids returned | M7 (9A, 9B, 9D) |
| `components/shotboard/ImageModelSelect.tsx` | `Select` restyle; `aria-label` = `title` | M7 (9B) |
| `components/CharacterLibraryPage.tsx`, `LocationLibraryPage.tsx` | Prettier only (0B); containers (10A–10E) | M0 (0B), M7 |
| `components/AssetStudioVisualFixture.tsx` | Prettier only (0B); root `<main>` → `<div>` (4B); drops `autoplay autoplayDelay={6}` with the MorphSlider patch (5C, D3); the rebuilt fixture (10F) | M0 (0B), M4 (4B), M5 (5C), M7 (10F) |
| `components/ReferenceAssetManager.tsx`, `ImageGenerationControls.tsx` | Restyle; additive `roles` prop | M7 (10C) |
| `components/ViewerChart.tsx` | Rewritten on `ChartFigure`; keeps `ViewerSample` and the default export | M8 (11C) |
| `lib/utils.ts` | `cn` via `extendTailwindMerge` | M1 (1B) |
| `lib/imageGen.ts`, `lib/imageModels.ts` | Additive `onStatus` / `IMAGE_MODEL_ETA_MS`; endpoints and inputs unchanged | M5 (5B) |
| `lib/assetPlaceholders.ts` | Brand restyle, same signature | M7 (10C) |
| `public/favicon.ico` | Replaced in place by the keyless build (B.5) | M3 (3B, placeholder icon), M9 (`brand`) |
| `../.agents/skills/admin-testing/SKILL.md` | Factual updates (§1.9): the first PR (tab count, Director card), M4 (shell, boot, route states), 8B (the §8.9.5 text), 9B (Shotboard local mode) | M0 (0A), M4 (4B–4D), M6 (8B), M7 (9B) |

### B.3 Deleted files

**D1 dead code (M0 part 0A, in its own PR).** Before each deletion, run the import grep from `dashboard/` and paste its output in the PR body:

```bash
for b in TestControlPanel WebRTCPlayer RealtimeChart PerformanceMetrics QueueVisualization \
         AIPerformanceBreakdown GenerationHistory useRealtimeData useRealtimeWebSocket falApi falUpload; do
  echo "== $b: $(grep -rlE "from ['\"][^'\"]*/$b['\"]|import\(['\"][^'\"]*/$b['\"]\)" app components hooks lib utils convex | tr '\n' ' ')"
done
grep -rln "recharts\|@fal-ai/serverless-client" app components hooks lib utils
```

At 845147c the loop prints no importer for any file except `falApi: hooks/useRealtimeData.ts` (itself deleted). The last grep lists only `components/RealtimeChart.tsx` and `utils/falUpload.ts`, both deleted. A plain name grep also hits `types.ts:91` (`GenerationHistoryProps`). That is a type name, not an import, and `types.ts` stays.

| Path | Evidence at 845147c |
|---|---|
| `components/TestControlPanel.tsx` | 0 importers (1163 lines; the source of the legacy `FAL_KEY not configured` error) |
| `components/WebRTCPlayer.tsx` | 0 importers (a caller of `/api/fal/proxy`) |
| `components/RealtimeChart.tsx` | 0 importers; the only `recharts` importer |
| `components/PerformanceMetrics.tsx`, `QueueVisualization.tsx`, `AIPerformanceBreakdown.tsx`, `GenerationHistory.tsx` | 0 importers |
| `hooks/useRealtimeData.ts`, `hooks/useRealtimeWebSocket.ts` | 0 importers (1 s polling and emoji `console.log`s, data.md DI-13) |
| `utils/falApi.ts` | The only importer is `hooks/useRealtimeData.ts` (deleted in the same PR) |
| `utils/falUpload.ts` | 0 importers; the only mention of `@fal-ai/serverless-client` (in a comment) |
| `package.json` dependencies `recharts`, `@fal-ai/serverless-client` | Only the two files above use them |

**Other deletions**

| Path | Milestone | Evidence required in the PR |
|---|---|---|
| `components/AdminNav.tsx` | M4 (4B) | `git mv` to `components/shell/AppNav.tsx` (history kept); the AdminNav check (block below) prints nothing |
| `components/ThemeToggle.tsx` | M4 (4B) | The ThemeToggle check (block below) lists only the file itself before deletion and prints nothing after it (B.6 R-23) |
| `app/admin/page.tsx` | M4 (4D) | `git mv` to `app/admin/(live)/page.tsx` (B.2); the page check (block below) prints `ok` |
| `app/styles/fonts-legacy.css` | M2 | Created in 1B; the fonts-legacy check (block below) prints nothing |
| `tests/live-extraction.spec.ts` | M6 (8B) | Created in 1A; the 8A parity proof has passed |
| `components/shotboard/{ShotCard,SceneSection,SceneSidebar,SceneGallery,CharacterPanel}.tsx` | M7 (9B–9D) | Every string in §9.9.3 is found in its new home (`tests/unit/shot-strings.spec.ts`), and the Shotboard check (block below) prints nothing |
| `components/asset-studio/StudioStatus.tsx`, `StudioGallery.tsx` | M7 (10C; 10D/10E) | Created and deleted inside §10 |
| `components/states/skeletons/RouteSkeleton.tsx` | M8 (11C) | Created in 4D; the RouteSkeleton check (block below) prints nothing |
| CSS rules (not files): the dead `globals.css` rules (§5.1 list), `.fade-in`, `.connection-*` (11C), every §5.18 shim except the permanent `.pixel-card*`, the deprecated `fal-*` Tailwind aliases (M9 `sweep`) | M1–M9 | The §5.21 and §15 grep gates |

The B.3 checks (from `dashboard/`, in the PR that deletes the file):

```bash
# AdminNav (4B): prints nothing
grep -rn "AdminNav" app components
# ThemeToggle (4B): prints nothing after the deletion
grep -rn "ThemeToggle" app components
# page (4D): prints ok
test ! -e app/admin/page.tsx && test -f 'app/admin/(live)/page.tsx' && echo ok
# fonts-legacy (M2): prints nothing
grep -rn "fonts-legacy" app
# Shotboard (9D): prints nothing
grep -rnE "ShotCard|SceneSection|SceneSidebar|SceneGallery|CharacterPanel" app components
# RouteSkeleton (11C): prints nothing
grep -rn "RouteSkeleton" app components
```

**Never deleted:** `components/ViewerChart.tsx`, `components/ImageGenerationControls.tsx`, `components/reactbits/{AccordionGallery,ChromaGrid,PixelCard}.{jsx,css}`, `public/wzrdtechlogo.png`, every file in `fonts/focal/`, `types.ts`, and anything with a live importer at implementation time.

### B.4 Never-touch files

**Global.** No PR's `git diff --name-only main...HEAD` lists any row. The §1.4 never-touch check (run from the repository root, in every PR) tests exactly this list, and its regex and this table must stay identical.

| Path | Reason |
|---|---|
| `components/dither-kit/**`, `dither-kit.json`, `components.json` | Hash-locked registry (N1, N2) |
| `convex/**` (including `convex/_generated/**`) | D2, D7; §1.8 item 2 |
| `middleware.ts`, `app/api/**` (5 routes), `lib/runtimeEnv.ts` | Auth boundary and edge routes (§16.3 item 9) |
| `lib/twitchWhip.ts`, `lib/directorProtocol.ts` | Ingest and wire protocol (§16.5) |
| `wrangler.toml`, `.env.production`, `next.config.js` | Platform and build semantics (§16.4) |
| `fonts/focal/*` (7 files) | D4 |
| `public/wzrdtechlogo.png` | The wordmark source (N24); it stays on disk, unreferenced |
| `components/useDirectorPersistence.ts`, `components/DirectorPanel.tsx` | The Live Control persistence contract (A.2.1); no chapter changes them |
| `components/reactbits/AccordionGallery.{jsx,css}`, `ChromaGrid.{jsx,css}`, `PixelCard.{jsx,css}` | Retained vendored components, used only as fixture specimens (§12.4) |
| `lib/shotboardCompiler.ts`, `lib/shotboardTypes.ts`, `lib/assetGeneration.ts` | Compiler semantics, shot-type labels and sheet briefs (A.3.2) |
| `../streaming_pipeline/**`, `../pyproject.toml`, `../requirements.txt` | Python backend |
| `../docs/redesign/audit/**`, `../docs/redesign/baseline/**`, `../docs/redesign/component-prompts.csv` | Read-only evidence (after-screenshots go where §15 says) |
| `../goal.md`, `../docs/redesign/spec/**` | The spec. Only the user edits it (§2.2 overrides, §2.3) |

**Scoped.** The named section's PRs leave these untouched, because another section owns the change.

| Path | Not touched by | Owner |
|---|---|---|
| `components/ScriptTemplatePicker.tsx` | §9 PRs | §8 (8B) |
| `components/ReferenceAssetManager.tsx` | §8 PRs | §10 (10C) |
| `components/shotboard/**` | §10 PRs | §9 |
| `lib/imageGen.ts`, `lib/imageModels.ts` | §9 and §10 PRs, except as §6.6 specifies | §6.6 (5B) |
| `components/DirectorPlayer.tsx` clip paths (`:386-527`) and recorder paths (`:279-382`) | §11 PRs | §8 (moved verbatim in 8A) |

### B.5 Generated files

Never edit these by hand. Regenerate them, then commit the output in the same PR as the change that caused it.

| Output | Generator | Command (from `dashboard/`) | Header / check |
|---|---|---|---|
| `app/styles/bayer.css` | `scripts/gen-bayer.mjs` | `node scripts/gen-bayer.mjs` | Starts `/* GENERATED by scripts/gen-bayer.mjs. …`; `node scripts/gen-bayer.mjs --check` exits 0 |
| `components/boot/masks.ts` | `scripts/brand/manifest.mts` (derived from `public/wzrdtechlogo.png`; no key) | `npm run brand:build` | Starts `// Generated by scripts/brand (build). Do not edit.`; BC-14 |
| `lib/brandAssets.ts` | `scripts/brand/manifest.mts` | `npm run brand:build` | Starts `` // Generated by `npm run brand:build` (scripts/brand/manifest.mts). Do not edit by hand. ``; BC-10 |
| `public/brand/manifest.json` | `scripts/brand/manifest.mts` | `npm run brand:build` | BC-10, BC-15 |
| `public/brand/{wordmark,loader,avatar,standby,talent,motion,slate,icons}/**` | The `scripts/brand` build: approved raws (D5) through `quantize.mts`/`encode.mts`/`video.mts`, or `placeholders.mts` without keys; the wordmark and icons are always derived | `npm run brand:build` | `npm run brand:check` (BC-01…BC-16); a second `build` leaves `git status --porcelain` unchanged |
| `public/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png` (+ `.alt.txt`), `app/twitter-image.png` (+ `.alt.txt`) | The `scripts/brand` build (`encode.mts` `writeIco`, the SVG rect writer, and a sharp composite with the real wordmark) | `npm run brand:build` | BC-02, BC-11, BC-13 |
| `scripts/brand/approved.json` | `scripts/brand` `approve` | `node scripts/brand/generate.mts approve …` | BC-09 (no `http`, no `Key `, no `COAST_REF_URLS` value) |
| `components/boot/bootScript.generated.ts` | `scripts/gen-boot.mjs` (minifies `components/boot/boot.src.js` with Next's bundled terser) | `node scripts/gen-boot.mjs` | `export const BOOT_SCRIPT_BODY = '…'`; `node scripts/gen-boot.mjs --check` exits 0 |
| `scripts/brand/spend.jsonl` | The `scripts/brand` ledger (one line per paid submit, M9 `brand`) | Appended by `run`; never edited | BC-09 |
| `public/fixtures/testcard-320x180-2s.webm`, `.mp4` | `ffmpeg` via `ffmpeg-static` (installed `--no-save`), run once in 5C | The §11.0 `ffmpeg -f lavfi -i testsrc2=size=320x180:rate=15 -t 2 …` commands | ≤ 40 KB each |
| `public/fixtures/testcard-thumb.jpg`, `testcard-avatar.png` | `ffmpeg` via `ffmpeg-static` (installed `--no-save`), run once in 11C | The §11.0 `testsrc2` single-frame commands | ≤ 20 KB each |
| `scripts/brand/.cache/**`, `.qa/**`, `.next/**`, Playwright reports | tools | — | Never committed (§16.6 N10) |

`app/manifest.ts` and `lib/pixelFont.json` are written by hand once; they are not generated.

### B.6 Cross-chapter conflicts and resolutions

| ID | Conflict | Resolution |
|---|---|---|
| R-1 | Skeleton and `loading.tsx` placement: §6.3 and §11.D.5 created every route fallback at once (including `app/admin/loading.tsx` and `visual-test/loading.tsx`), while §8.2 (8B), §9.2 (9A) and §11 (11A–11C) create their layout-exact skeletons with their pages | 4D creates exactly 7 `loading.tsx` files (§6.3): it runs `git mv app/admin/page.tsx 'app/admin/(live)/page.tsx'` (the import becomes `../../../components/DirectorPanel`) and adds `app/admin/(live)/loading.tsx` plus the shotboard, characters, locations, clips, recordings and analytics files, together with the final `StudioSkeleton` and the interim `components/states/skeletons/RouteSkeleton.tsx`. No `loading.tsx` exists at `app/admin/` or `app/admin/visual-test/`, because a Suspense boundary above a `notFound()` page downgrades its 404 to 200. 8B, 9A, 11A, 11B and 11C swap in their layout-exact skeletons, and 11C deletes RouteSkeleton. The R-1 checks (block below) pass from the end of 4D |
| R-2 | 'Generate' eyebrow casing: an earlier §5.20.5 draft wrote `GENERATE` and removed the class; §10.2/§10.4 keep the `uppercase` class on all three sites | 'Generate' is a preserved visible string and no chapter lists a change (D6), so all three sites keep `uppercase`. §5.20.5 owns the allowlist file, its sites and their moves; the total is ≤ 9, and both `uppercase.mjs` and §15.3 G13 fail when `total > 9` |
| R-3 | `bytes()` above 1 GiB: an earlier §5.20.4 draft (C15) switched the REC readout to GB; §7.2 forbids it | §7.2 wins: `bytes(n)` reproduces `DirectorPlayer.tsx:76-79` at every size, and only Recordings passes `{ gb: true }` (§5.20.4; Appendix A.12 Note 2) |
| R-4 | `formatMime()` output: an earlier §5.20.4 draft printed every codec, uppercased (`WebM · VP8, OPUS`, `MP4 · AVC1, MP4A`); §11.0 maps only the first codec (`WebM · VP9`, `avc1.*` → `H.264`) | One function, `formatMime` in `lib/format.ts` (§5.20.4, M2), with §11.0's first-codec mapping. Its only consumer is the Recordings 'Format' plate, and the raw MIME stays in `title`. `format.mjs` asserts `'video/webm;codecs=vp8,opus'` → `WebM · VP8`, `'video/webm;codecs=vp9,opus'` → `WebM · VP9`, `'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'` → `MP4 · H.264`, `'video/mp4'` → `MP4` and `''` → `—` |
| R-5 | Effect-slot ids: §7.16 named `raster-connect` (3) and `raster-idle` (1); §8.5.11 uses one id, `symbol-raster`, whose priority follows the phase | `symbol-raster` (§8.5.11, §7.16), which §8.10 B18 checks. `morph` (2) and `chart` (1) are unchanged, and `pixel-card` (0) exists only on `/admin/visual-test` (§7.16) |
| R-6 | `motion/react` confinement: §12.1 allows it only in `components/shell/AppNav.tsx`; §9.5.7 uses `Reorder` in SceneRail and SceneTrack (9D) | The allowed files are `components/shell/AppNav.tsx` and, only while 9D ships, `components/shotboard/SceneRail.tsx` and `SceneTrack.tsx`. §12.7's grep accepts exactly that list. If drag reorder is cut (§17.2 #19), the list is AppNav only |
| R-7 | The stalled-ingest chyron: §6.7 labelled its action "Stop now" and pushed it from `BroadcastProvider`; §8.5 labelled it "End broadcast" and pushed it from `useTwitchBroadcast` | **'End broadcast'**, pushed only by `BroadcastProvider` (§6.7); `twitch.stop` is registered by `useTwitchBroadcast` (`palette: false`, `run: stopBroadcast`), and the action runs it (§8.5.6) |
| R-8 | 'Leave and stop': §6.12 confirmed with `router.push(href)` and relied on unmount; §8 (DEC-8-07) runs `disconnect()` first | DEC-8-07 (§16.5 item 6): the confirm awaits `broadcast.leave()`, which runs the `disconnect()` DirectorPlayer registers in 8C, then navigates (§6.12) |
| R-9 | OG image format: the design draft named `.jpg`; §13.6.9 ships `.png` | `app/opengraph-image.png` and `app/twitter-image.png` (§13 owns the brand files), with `.alt.txt` siblings |
| R-10 | Boot assets before the brand milestone: §6.2.1 needs `wordmark/wzrdtech-640.webp`, `masks.ts` and the loader strip in 4C, and the M4 route states show `/brand/slate/*` art, while the bible puts §13 last | Keyless pipeline, placeholders, brand components, `lib/pixelFont.json`, `components/boot/masks.ts` and the metadata files land in 3B: the `scripts/brand` modules (including `no-network.mjs`); `brand:build`, `brand:check` and `brand:plan`; `placeholders.mts`; the committed outputs of one keyless `brand:build` (every placeholder and derived file, the icons, the OG images, `app/manifest.ts`); `approved.json`; and the `.gitignore` line. `brand:check` passes from 3B. The D5 finals are the M9 `brand` part (`run`, select, `approve`, rebuild, the first `spend.jsonl` lines), opened only when the secrets exist; otherwise no `brand` PR is opened, and the M9 `sweep` PR records "Brand art is placeholder (`generated:false`)" under Deferred / blocked (§14.15) |
| R-11 | §11.0 created `hooks/useOnline.ts` and `hooks/useInView.ts` in 11A, but the M4 StatusRail NET LED and OfflineBanner read `useOnline()` (§7.10) | Both are §7.2 rows and land in 4A |
| R-12 | The `.pixel-card` variable block: §11.A.2 kept it "in `app/globals.css`"; §5.1 makes `globals.css` an import list and moves `.pixel-card*` to `app/styles/components.css` | The block lives in `app/styles/components.css` (`@layer components`, §5.18) with B1's values (`--pixel-card-active-color: rgb(var(--c-hover))`). It is permanent, and §11 does not edit it |
| R-13 | `.connection-*` deletion: §11.C.2 deletes the classes "from `app/globals.css` (`:213-227`)", but after M1 they are shims in `components.css` (and `.connection-connecting` is already gone in M1) | 11C deletes the three shims from `app/styles/components.css`, in the same PR that migrates `analytics/page.tsx:146-147` |
| R-14 | `components/AssetUrlInput.tsx` is shared by Live Control and Shotboard, and §8 and §9 both change it | §8 (8B) owns it. Its API change is additive (`id?`, `role="alert"`, BayerSpinner); §9 only consumes it |
| R-15 | `lib/imageGen.ts` / `lib/imageModels.ts`: §6.6 owns `onStatus` and `IMAGE_MODEL_ETA_MS`, while §9.2 lands them in 9C "if not yet" | They land in 5B (§6.6); 9C only consumes them |
| R-16 | `app/admin/visual-test/page.tsx` is edited by §11.D (4D), §10 (5A, 10F), §8 (8B), §9 (9B) and §11 (11A, 11C) | §10 owns the file (§10.5.9 final text); each owning PR adds its own import and element; each fixture component renders its own section |
| R-17 | `useWhipTruth`: §7.2 lists `lib/broadcast/useWhipTruth.ts`, and §8.2 creates it in 8C "if §7 has not" | The path is fixed at `lib/broadcast/useWhipTruth.ts`. It is created in 8C per §8.5.6, which owns the algorithm, the publishers and the tests; §7.2 lists only its signature |
| R-18 | `components/director/constants.ts` holds `DIRECTOR_MODEL`, but `components/DirectorPlayer.tsx` must still export it | `DirectorPlayer.tsx` re-exports it (`export { DIRECTOR_MODEL } from './director/constants'`); the literal appears once in `components/` (§8.10 A2) |
| R-19 | `.qa/` (the `qa-build.sh` build log and the 8A parity scratch) and the Playwright output are not gitignored at 845147c | 1A appends `test-results/`, `playwright-report/` and `.qa/` to `dashboard/.gitignore` (§15.1); 3B appends `scripts/brand/.cache/` |
| R-20 | The audits list `--pixel-card-active-color` as a `globals.css` variable | It exists only as a fallback in `PixelCard.css:28`. R-12's block defines it, and it stays available to the fixture specimen |
| R-21 | The pre-LCP wordmark allowlist: the design draft allowed 160/320 and the loader strip, but §6.2.1 preloads `wzrdtech-640.webp` | §13.9's allowlist includes `wzrdtech-640.webp` (BC-12) |
| R-22 | ImageGenerationControls is "shared with the Shotboard" (assets.md A11) | False at 845147c (§10.2 Note); the props are unchanged either way |
| R-23 | Removing `components/ThemeToggle.tsx`: §7 lists it with the shell (4B), ThemeProvider lands with the carrier in 3A, and two theme writers must never coexist | ThemeProvider lands in 3A, and ThemeToggle is rewired to it (one writer), not deleted. 4B replaces it with ThemeSwitch in the CommandBar and deletes the file once the grep shows no importer |
| R-24 | The M4 route states (`not-found.tsx`, `ErrorState`) use `Button`/`buttonClassName`, `Slate` and `PixelFace`, which §7 and §12 otherwise place with the M5 primitives | `lib/pixelFont.json` lands in 3B; `px5x7.ts`, PixelFace, Button, `components/ui/buttonClassName.ts` and the rest of the §14.3 R3 set land in 4A; Slate lands in 4D. The rest of the M5 set is unchanged |

The R-1 checks (from `dashboard/`, after 4D):

```bash
find app/admin -name loading.tsx | wc -l          # prints 7
test ! -e app/admin/loading.tsx && test ! -e app/admin/visual-test/loading.tsx && echo ok   # prints ok
find app/admin -name layout.tsx | wc -l           # prints 8; there is no (live)/layout.tsx
```

### B.7 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] At the end of M9, `git diff --name-status 845147c...HEAD -- dashboard` lists only:
  - paths in B.1 (status `A`), B.2 (`M`) and B.3 (`D`);
  - the `R` renames `components/AdminNav.tsx` → `components/shell/AppNav.tsx` and `app/admin/page.tsx` → `app/admin/(live)/page.tsx`;
  - the generated outputs of B.5.
  
  Any other path is explained under "Decisions" in the PR that added it.
- [ ] The §1.4 never-touch check (from the repository root) prints nothing in every PR, so no PR changes a global B.4 path.
- [ ] The 0A PR body contains the B.3 D1 grep block and its output, and `test ! -e dashboard/utils` succeeds after 0A.
- [ ] On the M9 build, `node scripts/gen-bayer.mjs --check`, `node scripts/gen-boot.mjs --check`, `npm run brand:build` (run twice, with `git status --porcelain` unchanged) and `npm run brand:check` exit 0.
- [ ] The code reflects every B.6 resolution:
  - `grep -rlE "from ['\"]motion/react['\"]" app components --exclude-dir=dither-kit` prints only the R-6 files;
  - `window.__wzrd.slots` reports `symbol-raster` on idle `/admin`;
  - the stalled chyron's button is named 'End broadcast';
  - the uppercase allowlist total is ≤ 9 (`node scripts/checks/uppercase.mjs` exits 0);
  - the R-1 checks (block under B.6) print `7`, `ok` and `8`.
