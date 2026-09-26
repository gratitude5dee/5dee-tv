> **Spec chapter §11 — Pages: Clips, Recordings, Twitch Analytics and route-level states.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 11. Pages: Clips, Recordings, Twitch Analytics, and route-level states

The three data routes are where a show is reviewed after it airs: the per-direction clip log, the full-session tapes, and the Twitch meter bridge. Today they are thin client pages that misreport state (a blank card while loading, "No clips yet" when signed out, a red OFFLINE pill when Twitch is simply not configured), mount up to 100 PixelCard canvases and 100 `<video preload="metadata">` at once, and ship a broken download. This section rebuilds them on the §7 primitives and defines every route-level state file (404, error, global error, loading, segment titles) plus the canonical NotConfigured, AuthRequired and Offline copy that §7.5 defers here.

All `path:line` references are **as of 845147c** (`git diff --stat 845147c HEAD -- dashboard` is empty). Paths are under `dashboard/` unless they start with `docs/`. Parts (§14 places them): **11A** media foundation + Clips · **11B** Recordings · **11C** Twitch Analytics. The route-level state files of §11.D land in part **4D** (§14), with the §7.5 `Slate`, `ErrorState` and skeletons; 5A uses the §11.D.7 copy for `NotConfigured` and `AuthRequired`. 11B and 11C reuse 11A's media and format helpers.

### 11.0 Shared ground rules

**Architecture.** Each page stays a `'use client'` container that owns its Convex hooks and gating (DI-3, DI-18). Everything visible is a presentational view with plain props (`ClipsView`, `RecordingsView`, `AnalyticsView`), so `/admin/visual-test` (owned by §10) renders every state from fixtures with no Convex, no Twitch and no network. **No file under `convex/` changes in this section, and `app/api/twitch/route.ts` is never touched.**

**Shared files** (created in 11A unless the row says otherwise; reused by 11B, 11C and §8–§10 where noted):

| Path | Contents |
|---|---|
| `lib/format.ts` (additive to §5.20.4; appended in 11A) | `hms(s)`: today's `formatDuration` (`app/admin/recordings/page.tsx:16-22`) byte-for-byte (`1h 2m 3s` / `2m 3s` / `3s`). `uptime(s \| null)`: today's `formatUptime` (`app/admin/analytics/page.tsx:14-20`) byte-for-byte, `'—'` for null. `extFromMime(mime?)`: base type (before `;`, trimmed, lowercased) → `video/webm` `webm`, `video/mp4` `mp4`, `video/quicktime` `mov`, `video/x-matroska` `mkv`, anything else or missing → `webm`. `formatMime`: §5.20.4 (this chapter expects `'video/webm;codecs=vp9,opus'` → `WebM · VP9` and `'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'` → `MP4 · H.264`). `stamp`, `day` and `hhmm` use no `Intl` (the §5.20.4 file header): `const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']`, `d = new Date(ms)` and §5.20.4's module-level `p2`. `stamp(ms)` = `` `${MON[d.getMonth()]} ${d.getDate()}, ${p2(d.getHours())}:${p2(d.getMinutes())}` `` → `Sep 24, 21:04`. `day(ms)` = `` `${MON[d.getMonth()]} ${d.getDate()}` `` → `Sep 24`. `hhmm(ms)` = `` `${p2(d.getHours())}:${p2(d.getMinutes())}` `` → `21:04`. All six are tested in `tests/unit/format-media.spec.ts` |
| `lib/download.ts` | `downloadMedia(url, filename, { sizeBytes }?): Promise<'saved' \| 'fallback' \| 'cancelled'>` (§11.A.5) |
| `lib/media/posterQueue.ts` | At most **4** poster loads in flight, FIFO; `acquire(): Promise<release>`. `release` is idempotent: only its first call frees the slot. A waiter whose card unmounts is dropped. The release conditions are the MediaScreen poster row (§11.A.5) |
| `lib/media/fixInfiniteDuration.ts` | MediaRecorder WebM often reports `duration === Infinity`. On `loadedmetadata`, if not finite: add a one-shot `timeupdate` listener that sets `currentTime = 0`, then set `currentTime = 1e101`. Used by `MediaViewer` only, and only for media of at most 64 MiB (§11.A.5) |
| `hooks/useInView.ts` | §7.2 (lands in 4A) |
| `hooks/useOnline.ts` | §7.2 (lands in 4A) |
| `components/media/MediaScreen.tsx` | The 16:9 screen with placeholder, lazy poster, hover-scrub, HUD plates (§11.A.5) |
| `components/media/MediaViewer.tsx` | The viewer `Dialog` with native `<video controls>` (§11.A.5) |
| `components/media/layout.ts` | Geometry constants shared by views and skeletons (§11.A.4, §11.B.4) |
| `app/styles/library.css` | `.lib-*`, `.media-*`, `.reel-*`, `.clip-*`, `.rec-*` rules. The file holds only `@layer components { … }` (§5.1). 11A adds its `@import` line to `app/globals.css` at its §5.1 position |
| `public/fixtures/testcard-320x180-2s.webm`, `public/fixtures/testcard-320x180-2s.mp4` | Same-origin fixture media, ≤ 40 KB each. Created in **5C** for the §12.3.12 specimen with the commands below; §11 reuses them. Fixtures never point at external hosts, so the visual-test console stays clean |
| `public/fixtures/testcard-thumb.jpg` (640×360), `public/fixtures/testcard-avatar.png` (64×64) | Created in **11C** with the commands below, ≤ 20 KB each. `twitchBody()` (§11.C.10) and the Analytics fixture use them as `thumbnailUrl` and `user.profileImageUrl` |

The fixture media commands (run from `dashboard/`). `ffmpeg-static` is installed with `--no-save` and never saved to `package.json` (D8, §13.3.2). Measured output with `ffmpeg-static` 5.3.0: 20,782 / 18,112 / 10,941 / 1,687 bytes.

```bash
npm i --no-save ffmpeg-static@5.3.0
FF="$(node -p "require('ffmpeg-static')")"
mkdir -p public/fixtures
# 5C: the testcard clips
"$FF" -v error -y -f lavfi -i testsrc2=size=320x180:rate=15 -t 2 -c:v libvpx-vp9 -b:v 80k -an public/fixtures/testcard-320x180-2s.webm
"$FF" -v error -y -f lavfi -i testsrc2=size=320x180:rate=15 -t 2 -c:v libx264 -crf 35 -pix_fmt yuv420p -movflags +faststart -an public/fixtures/testcard-320x180-2s.mp4
# 11C: the Twitch fixture images
"$FF" -v error -y -f lavfi -i testsrc2=size=640x360 -frames:v 1 -q:v 10 public/fixtures/testcard-thumb.jpg
"$FF" -v error -y -f lavfi -i testsrc2=size=64x64 -frames:v 1 public/fixtures/testcard-avatar.png
```

**Test hooks** (DI-17 names, stable from here on): `clip-card`, `clip-status-{capturing|uploading|failed}`, `clip-open`, `session-reel`, `clips-show-more`, `recording-row`, `recording-download`, `recording-delete`, `kpi-viewers`, `kpi-followers`, `kpi-uptime`, `kpi-category`, `onair-tally`, `onair-refresh`, `viewer-chart`, `stream-rail`.

**Air lock.** It cannot be set on these routes: leaving Live Control under the lock ends the session and `DirectorPlayer` unmount calls `broadcast.reset()` (§7.17). The primitives still honour `deriveLock`; no route here adds lock-specific behaviour.

**Offline offset.** `OfflineBanner` (§7.6) is `position: fixed` under the command bar, so it never reflows the page. It toggles `html[data-offline]`, which sets `--h-offline` to 36 px (§5.2; `0px` otherwise). Library and Analytics roots add `var(--h-offline)` to their top padding, and every sticky element on these routes uses `top: calc(var(--h-chrome) + var(--h-offline))`, so the banner never covers content.
> Note: every surface uses this one offset: the library routes pad by it, and Live Control (§8) and Shotboard (§9) shrink their fixed-height roots by it.

**Preserved contract, verbatim.** The page subsections (§11.A.9, §11.B.9, §11.C.9, §11.D.9) map each item to its implementation.

From `docs/redesign/audit/data.md` (all 18 invariants):

| ID | Invariant (verbatim) |
|---|---|
| DI-1 | Keep the global React Bits Dither background: app/layout.tsx:37 `<DitherBackground />`, rendered as `fixed inset-0 -z-10 pointer-events-none` with aria-hidden (DitherBackground.tsx:23). Its tint follows the `dark` class via a MutationObserver; do not remove or cover it with fully opaque full-page layers. |
| DI-2 | Keep the routes /admin/clips, /admin/recordings and /admin/analytics, and the AdminNav tab labels 'Clips', 'Recordings', 'Twitch Analytics' plus nav aria-label="Admin sections" (AdminNav.tsx:12-14, :21). README.md:142-144 documents these routes. |
| DI-3 | Convex gating: Clips and Recordings must keep `useConvexEnabled()` and render `<ConvexNotConfigured feature="clips"\|"recordings" />` when Convex is off, with its strings 'Convex is not configured', 'NEXT_PUBLIC_CONVEX_URL' and 'npx convex dev'. The admin-testing skill exercises unconfigured states. Analytics must keep working WITHOUT Convex (local samples) and mount ConvexHistory only when convexEnabled (analytics/page.tsx:122). |
| DI-4 | Convex calls and args: `useQuery(api.clips.list, { limit: 100 })`, `useQuery(api.recordings.list, { limit: 100 })`, `useMutation(api.recordings.remove)` called as `{ recordingId }`, `useMutation(api.twitchStats.record)` with {channel, viewerCount, followerCount?, isLive, title?, gameName?}, and `useQuery(api.twitchStats.history, latest ? { channel, sinceMs: latest.capturedAt - 24h } : 'skip')`. Keep the window anchored to `latest.capturedAt` rather than Date.now() so query args change only once per poll (comment at :59). |
| DI-5 | Twitch polling contract: `fetch('/api/twitch', { cache: 'no-store' })` every POLL_MS = 30_000 ms. Show server `body.error` messages verbatim (e.g. 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured', 'TWITCH_CHANNEL is not configured', 'Twitch channel "x" not found'). Keep the lastRecordedRef de-duplication of Convex writes, the localSamples cap of 240, and the rule 'use persisted history only when it has more than 1 sample, else local samples' (:118). |
| DI-6 | Types: keep `export interface ViewerSample { capturedAt; viewerCount; isLive }` exported from components/ViewerChart (imported by analytics/page.tsx:8), or re-export it if the chart moves. `TwitchAnalytics` is type-imported from app/api/twitch/route.ts; do not change the API response shape. |
| DI-7 | Stream thumbnail freshness: keep a cache-buster tied to capturedAt (`${thumbnailUrl}?t=${capturedAt}`) or an equivalent; route.ts:122 fixes the 640x360 size. |
| DI-8 | Ordering and highlight semantics: lists are newest-first (by_createdAt desc), and index 0 is highlighted as latest (`pixel-card-latest` today). Preserve a 'latest/new' treatment even if PixelCard is replaced. |
| DI-9 | Clip label logic: show `segment v{promptVersion}` when promptVersion is defined, else `chunk #{chunkIndex}`. Show the prompt text, the durationSeconds-based duration, the session short id (first 8 chars plus an ellipsis, with the full id in title), and the clip source. |
| DI-10 | Recording title fallback: `recording.title ?? <model-based label>`. Duration via formatDuration semantics (h/m/s); size via formatBytes (KB/MB/GB). |
| DI-11 | Recording deletion must stay behind an explicit confirmation step and stay permanent (convex/recordings.ts remove also deletes storage). The confirm copy 'Delete this recording permanently?' may change, but the confirmation must not be removed. |
| DI-12 | Empty-state guidance must reference the real Director controls, whose labels are “Record” and “Stop & save recording” (DirectorPlayer.tsx:1270, :1282). If those labels change there, update the copy. |
| DI-13 | Console hygiene: the admin-testing skill (SKILL.md step 6) expects only a React DevTools info message per page. Do not wire useRealtimeData or useRealtimeWebSocket (1s polling plus emoji console.logs), and add no console.log noise in new components. |
| DI-14 | Reduced motion: the dither-kit (prefersReducedMotion in dither-paint.ts:173, pixel.ts:105) and PixelCard (PixelCard.jsx:134-136) already honor prefers-reduced-motion. Every new animation (count-up, hover-scrub autoplay, tally pulse, skeleton shimmer, H3 motion loops) must have a static fallback. |
| DI-15 | Theme: `darkMode: 'class'` (tailwind.config.js:3) with the pre-paint themeInit script in app/layout.tsx:11-19 reading localStorage 'theme'. New surfaces must look correct in both themes; the kit's colour-vs-opacity rule (dither-paint.ts:32-40) is the model to follow. |
| DI-16 | dither-kit is a vendored registry (`components/dither-kit/*`, `dither-kit.json`, components.json registry '@dither-kit'). Do not hand-edit kit files; compose wrappers elsewhere. scales.ts carries a deliberate crash fix (commit 16af204) that a registry reinstall would revert. ChatSteerer (DitherAvatar), DirectorPlayer (DitherButton, DitherGradient) and ViewerChart depend on the kit. |
| DI-17 | There are no data-testid, aria-label or role hooks on these pages today (verified by grep), so no tests depend on DOM structure. If you add hooks, use stable names (e.g. data-testid='clip-card', 'clip-status-capturing', 'recording-row', 'recording-download', 'recording-delete', 'kpi-viewers', 'onair-tally', 'viewer-chart') and keep them stable afterwards. |
| DI-18 | The Next.js pages are client components ('use client'). There is no Suspense or server data loading here; keep Convex React hooks inside ConvexClientProvider (layout.tsx:65). |

From `docs/redesign/audit/states.md` (route-state and data-page items):

| ID | Invariant (verbatim) |
|---|---|
| ST-1 | Keep the global React Bits Dither background: DitherBackground in app/layout.tsx:37, host `fixed inset-0 -z-10 pointer-events-none` aria-hidden. Keep the tints: dark waveColor [0.2,0.34,0.66] / backgroundColor [0.02,0.03,0.06]; light [0.5,0.63,0.86] / [0.98,0.98,1.0]. Keep colorNum 4, pixelSize 2 (visually; half-res + pixelSize 1 is equivalent), waveSpeed 0.04, waveFrequency 2.6, waveAmplitude 0.4. Its tint must keep following the html `dark` class. |
| ST-2 | admin-testing skill (.agents/skills/admin-testing/SKILL.md): the Director card is the only Live Control content. Its button text is exactly 'Start Director'. A failed start must show an error AND restore the Start control. Per-page console must contain only the React DevTools info message, so loaders and animations must not console.log/warn. Do not add three.js forceContextLoss on unmount, because it logs 'THREE.WebGLRenderer: Context Lost.'. |
| ST-3 | ids, classes and test hooks: `#audio-library-visual-test` (AssetStudioVisualFixture.tsx:45); `.asset-studio` wrapper on the library pages and fixture; `.pixel-card-latest` on the first clip/recording; `.fal-card`, `.fal-card-header`, `.fal-card-content`, `.fal-card-title`, `.fal-button-primary`, `.fal-button-secondary`, `.connection-indicator`/`.connection-connected`/`.connection-disconnected` (restyle, don't silently delete without updating callers). role=status/role=alert on library notice/error must remain announced, even if moved into toasts. |
| ST-4 | Convex calls unchanged: api.clips.list {limit:100}; api.recordings.list {limit:100}; api.recordings.remove (behind confirm('Delete this recording permanently?')); api.recordings.deleteStorage; api.tracks.list/generateUploadUrl/add/remove; api.assets.* (listCharacters, listLocations, create/patch, removeReference, seedStarterLibrary, startGeneration, completeGeneration, failGeneration, generateUploadUrl, listAssetHistory, getCharacter, recordUpload, getStorageUrl); api.shotboards.*; api.promptExpansion.start and .expand; api.director.prepare and .get; api.twitchStats.record and .history; useDirectorPersistence mutations. Hooks must stay mounted only under ConvexProvider (the `useConvexEnabled()` gates). |
| ST-5 | dither-kit files (components/dither-kit/*) are hash-locked by dashboard/dither-kit.json: consume via props, imports and wrappers only. components/reactbits/* is not locked and may be edited. |
| ST-6 | visual-test route must keep calling notFound() in production and must never mount Convex hooks. |
| ST-7 | Twitch analytics poll interval 30_000ms, 24h history window, and 'Viewers (last 24h, Convex)' / 'Viewers (this session)' title switch. |

From `docs/redesign/audit/shell.md` (route-state items):

| ID | Invariant (verbatim) |
|---|---|
| SH-1 | Keep the React Bits Dither WebGL background as the global background: components/DitherBackground.tsx rendered first inside `<body>`, wrapper `fixed inset-0 -z-10 pointer-events-none` with aria-hidden, dynamic import with ssr:false, and the try/catch WebGL-unavailable bail-out in components/reactbits/Dither.jsx:134-139. Baseline look: waveSpeed 0.04, waveFrequency 2.6, waveAmplitude 0.4, colorNum 4, pixelSize 2, chrome-blue wave. Retune only via tokens. |
| SH-2 | Routes and nav: '/' redirects to '/admin' (app/page.tsx). AdminNav tabs, hrefs and labels are exact: '/admin' Live Control, '/admin/shotboard' Shotboard, '/admin/characters' Characters, '/admin/locations' Locations, '/admin/clips' Clips, '/admin/recordings' Recordings, '/admin/analytics' Twitch Analytics. Active matching: exact for '/admin', startsWith for the others. The nav landmark keeps aria-label="Admin sections". /admin/visual-test must keep notFound() in production and the id="audio-library-visual-test" section. |
| SH-3 | middleware.ts behavior and exact 401 plain-text strings (the admin-testing SKILL.md step 3 depends on them), and `config.matcher: ['/admin/:path*', '/api/:path*']`. API routes /api/auth/convex, /api/fal/proxy, /api/fal/sdk-proxy, /api/twitch, /api/twitch/connect are untouched. |
| SH-4 | ConvexClientProvider public API: default export wrapper, `useConvexEnabled()` hook, ConvexProviderWithAuth with useCloudflareAuth fetching '/api/auth/convex' with {credentials:'include', cache:'no-store'}, and the no-client fallback when NEXT_PUBLIC_CONVEX_URL is unset (must keep rendering children). |
| SH-5 | ConvexNotConfigured copy and prop: `feature` prop, the text 'Convex is not configured', and the mentions of `NEXT_PUBLIC_CONVEX_URL`, `npx convex dev` and `dashboard/`. If replaced by a NotConfigured primitive, preserve these strings. |
| SH-6 | SKILL.md test flow: the Live Control page's only content is the Director card; its primary button label is exactly 'Start Director' and must be restored after an error; 'Director Record' appears only during a live session; per-page console output must remain clean (only the React DevTools info message). No new console errors or warnings from WebGL, hydration mismatches, missing keys, or 404ed assets. |
| SH-7 | Live custom classes still referenced by code (either keep them working or migrate every call site in the same change): fal-card (17 live uses / 12 files), fal-card-header (8), fal-card-title (5), fal-card-content (17), fal-button-primary (2: CharacterLibraryPage.tsx:149, LocationLibraryPage.tsx:141), fal-button-secondary (31 / 15 files), connection-indicator / connection-connected / connection-disconnected (analytics/page.tsx:146-147), fade-in (layout.tsx:64), pixel-card-latest (clips/page.tsx:39, recordings/page.tsx:56), and the PixelCard CSS vars --pixel-card-border / --pixel-card-background / --pixel-card-active-color. |
| SH-8 | Metadata title 'stream.wzrd.tech admin' and the brand strings 'WZRD.TECH' (logo alt), 'Stream Admin' and 'stream.wzrd.tech'. Visible identifiers such as `minimax/h3-max/director` must remain visible in the Director header. |
| SH-9 | Cloudflare Pages / next-on-pages build (`pages:build`): shell code must stay edge-compatible (no Node-only APIs in layout/middleware); next/font local/google is fine. |

---

### 11.A Clips: "Tape log" (`/admin/clips`)

#### 11.A.1 Goal & hero interaction

**Goal.**
- **Read a show as a story.** Clips are grouped by Director session under sticky headers. Each session has a **reel**: one segment per clip, width proportional to its duration, filled by status. You can see at a glance how the stream evolved direction by direction.
- **Truthful per-clip state.** A segment that is still recording reads **CAPTURING**, one whose media is in flight reads **UPLOADING**, and one that never received media reads **FAILED**. Today all three render as a broken "No media stored for this segment" with "0.0s".
- **Cheap at 100 clips.** No PixelCard canvases. 24 cards at a time. Posters load lazily through an IntersectionObserver, at most 4 at once, as paused `<video>` frames. Video decoding happens only on hover-scrub or in the viewer.
- **Correct files.** Download saves `clip-<id>.<ext>`, with `<ext>` taken from `mimeType`: through a Blob up to 256 MiB, and streamed to a save dialog above that (§11.A.5).
- **Honest emptiness.** The page separates loading (skeleton), signed out (NO ACCESS), not configured (NOT PATCHED), offline (NO CARRIER) and truly empty (NO FOOTAGE, without the stale LTX copy).

**Hero interaction: "find the moment".**
1. After a show, the operator opens Clips. The newest session is on top: `SESSION 3f2a91c0… · 14 clips · 06:12 · Sep 24`, with its reel beneath.
2. Hovering reel segments shows each direction's prompt in a Tooltip. One segment is a 50% vermilion field (CAPTURING), because a second tab is still live.
3. Clicking a segment scrolls its card to the centre of the viewport and focuses the card's screen button. It expands "Show more" first if needed.
4. Moving a fine pointer across the poster scrubs the segment. The duration plate reads `00:07 / 00:14`.
5. Space opens the viewer and plays. J, K and L step back 5 s, toggle pause and step forward 5 s.
6. "Download" saves `clip-<id>.webm` (or `.mp4` when the stored `mimeType` is `video/mp4`), and the button runs its pending → success micro-state.

**Budget.** At 1440×900 with 100 clips: 0 `<canvas>` in `main`, ≤ 16 `<video>` elements after load, ≤ 1 decoding video at a time, and no long task over 50 ms on "Show more" at 4× CPU throttle.

#### 11.A.2 Files

**Create**

| Path | Purpose | PR |
|---|---|---|
| `components/media/ClipsView.tsx` | Presentational root: header, groups, grid, "Show more", viewer. Props: `{ state: 'loading'\|'empty'\|'ready'\|'auth'\|'offline'; groups: ClipGroup[]; total: number; statusOf: Map<string, ClipStatus>; onDownload(clip); headingLevel?: 1 \| 2 }` (`headingLevel` default 1, §11.A.8) | 11A |
| `components/media/SessionGroup.tsx` | Sticky `h2` header + `SessionReel` + card grid for one group | 11A |
| `components/media/SessionReel.tsx` | Status-filled segment strip (§11.A.5) | 11A |
| `components/media/MediaCard.tsx` | Clip card: `MediaScreen`, label, time, prompt, source, actions | 11A |
| `components/media/useClipsLibrary.ts` | Wraps the queries, grouping, status derivation and the boundary timer | 11A |
| `lib/clips.ts` | Pure `deriveClipStatus`, `groupClips`, `isSessionLive`, `UPLOAD_GRACE_MS`, `LIVE_MAX_MS` (unit-tested) | 11A |
| `components/media/fixtures.ts` | `CLIP_FIXTURES`: 100 clips in 5 groups (4 sessions plus a no-session group). Clip `n` (1 = newest) is created at `now − 20_000 − (n − 1) × 60_000`. Session s1 (`live`, `startedAt: now − 70 min`) holds clips 1–64: #1 has no media (`durationSeconds: 0`, no `url`) → capturing; #2 has no media → uploading (its segment ended when #1 was created, 20 s ago); #3 has `url: null` and `durationSeconds: 14` → failed; #4 has `promptVersion: 12`; #5 has no `promptVersion` and `chunkIndex: 3` → `chunk #3`; #6 has a 600-character prompt; clips #4–#100 (in every group) are ready. s2 (`ended`, `endedAt: now − 30_000`) holds clips 65–80, s3 (`ended`, `endedAt: now − 60 min`) 81–92 and s4 (`ended`, `endedAt: now − 90 min`) 93–96. Clips 97–100 have no `sessionId`. Every clip except #5 has a `promptVersion` (#4 = 12, the others `200 − n`). Ready clips alternate between the §11.0 webm (odd `n`) and mp4 (even `n`) testcard files, with the matching `mimeType`, the file's real `sizeBytes` and `durationSeconds: 2`. `SESSION_FIXTURES` holds s1–s4; `RECORDING_FIXTURES` is the §11.B.10 list. Every timestamp is relative to an injected `now`, so statuses are deterministic. (No clip field records an aspect ratio; the screen's `object-contain` handles 9:16 media, so there is no portrait fixture) | 11A |
| `components/media/LibraryVisualFixture.tsx` | Renders its own `<section id="clips-visual-test">` (11A) and `<section id="recordings-visual-test">` (11B), with every Clips and Recordings state from fixtures and the views at `headingLevel={2}`. It makes no `fetch` of its own: Download calls `lib/download.ts` on same-origin `/fixtures/*` only, which §10's fixture rules permit | 11A, 11B |
| `components/states/skeletons/ClipsSkeleton.tsx` | Layout-exact skeleton built from `components/media/layout.ts` (§11.A.6) | 11A |
| `tests/library.spec.ts`, `tests/unit/{clip-status,format-media}.spec.ts` | e2e and unit specs (§15 harness) | 11A |
| Shared files | §11.0 table | 11A |

**Change**

| Path | Change | PR |
|---|---|---|
| `app/admin/clips/page.tsx` | Container only: `useConvexEnabled()` gate kept; `ClipsList` renders `<ClipsView>` from `useClipsLibrary()`; the unconfigured branch renders the PageHeader + `<ConvexNotConfigured feature="clips" />` (§11.A.5; the wrapper is §7.5's, 5A). Imports of `PixelCard`, `Clock`, `Film`, `Layers` removed | 11A |
| `app/admin/clips/loading.tsx` | Swap `RouteSkeleton` for `ClipsSkeleton` (the file is created in 4D; shape and caption: §6.3). The route title (`app/admin/clips/layout.tsx`) is §7.7's, 4B | 11A |
| `app/globals.css` | Add `@import './styles/library.css';` at its §5.1 position. Nothing else: `.pixel-card*` lives in `app/styles/components.css` (§5.18) and stays as is. The MediaCard and recording-row treatment is the `library.css` rule in §11.A.4 | 11A |
| `app/admin/visual-test/page.tsx` | Add the `LibraryVisualFixture` import and element at their §10.5.9 positions (§10 owns the file) | 11A |
| `components/broadcast/TallyLight.tsx` | Adds `fault`/`stale` per §7.4 (11A) | 11A |

**Delete:** nothing. `components/reactbits/PixelCard.jsx` and `PixelCard.css` stay on disk, unimported. They are not in the D1 list, and the §12 retained-components table keeps them.

**Never touch:** `convex/**`, `components/DirectorPlayer.tsx` clip paths (`:386-527`), `components/dither-kit/*`, `dither-kit.json`, `components/reactbits/PixelCard.*`.

#### 11.A.3 Before

Baseline: `docs/redesign/baseline/admin_clips-dark.jpg`. The baseline is unconfigured, so it shows only the ConvexNotConfigured card: a Database icon, "Convex is not configured" and the env sentence, inside an opaque card under the old header. The configured defects below come from the code.

| # | Defect | Evidence |
|---|---|---|
| C1 | **Loading renders nothing.** `clips && clips.length === 0 ? empty : grid` sends `undefined` into the grid branch, which maps nothing. The only cue is the 14 px header text 'Loading…' | `app/admin/clips/page.tsx:26`, `:34`, `:21` |
| C2 | **Signed out looks empty.** `clips.list` returns `[]` without an identity, so a signed-out operator reads "No clips yet" | `convex/clips.ts:52`; `app/admin/clips/page.tsx:26-31` |
| C3 | **A clip being captured looks broken.** The row is inserted at segment start with `durationSeconds: 0` and no media. Media is attached only when the next direction rotates the segment, or on flush. The newest ("latest") card therefore shows 'No media stored for this segment' and '0.0s' during every live session | `components/DirectorPlayer.tsx:489-495` (`durationSeconds: 0` at `:494`), `:426-458` (upload), `:510-527` (flush); `app/admin/clips/page.tsx:46-49`, `:66` |
| C4 | **Three real states are indistinguishable.** Capturing, a failed upload (`:447-455` logs it and cleans up storage, but no row state records it) and browsers without MediaRecorder ('segments will be metadata-only', `:392`) all render the same text | `components/DirectorPlayer.tsx:392`, `:447-455` |
| C5 | **PixelCard canvas cost.** Every card is a PixelCard: a `<canvas>` sized to the whole card (`PixelCard.jsx:152-155`), a `ResizeObserver` (`:219-224`) and one `Pixel` object per 10 px cell (`:159-160`, gap 10 for `variant="blue"`, `:105-110`). At 1280 px a card is ≈379×343, which is ≈1.3k objects and a ≈0.5 MB backing store. For 100 clips that is **100 canvases, ≈130k objects and ≈50 MB** allocated on load (computed estimate), plus a 60 fps hover loop that never idles while hovered (`:174-199`) | `components/reactbits/PixelCard.jsx`; `app/admin/clips/page.tsx:35-40` |
| C6 | **100 media requests on load.** Up to 100 `<video controls preload="metadata">` mount at once, each issuing a range request to Convex storage | `app/admin/clips/page.tsx:11`, `:44` |
| C7 | **Unselectable data, off-palette hover.** `.pixel-card { user-select: none }` blocks copying prompts and ids. The hover glow is the `#09090b` fallback, because `activeColor` is never applied, and it reads as a dark smudge in light mode | `components/reactbits/PixelCard.css:19`, `:28`; `PixelCard.jsx:97-126` |
| C8 | **Stale copy.** 'Start an LTX stream or a Director session to populate clips' (LTX is legacy) | `app/admin/clips/page.tsx:30` |
| C9 | **No hierarchy, no actions.** The page title is an `h3` under the global `h1` "Stream Admin". There is no download, no copy and no viewer. The count '100 clips' hides the `limit: 100` cap | `app/admin/clips/page.tsx:19`, `:21`; `app/layout.tsx:51` |
| C10 | **Reactive inserts shift the grid.** Each applied direction inserts at index 0 and the green latest border jumps | `components/DirectorPlayer.tsx:489`; `app/admin/clips/page.tsx:39` |

#### 11.A.4 Layout spec

**Root and grid** (`app/styles/library.css`, `@layer components`; constants in `components/media/layout.ts`: `CARD_MIN = 280`, `GRID_GAP = 16`, `SCREEN_INSET = 8`, `GROUP_HEAD_H = 40`, `REEL_H = 16`, `PAGE_SIZE = 24`):

```css
.lib-root { width: 100%; max-width: 1440px; margin-inline: auto;
  padding: calc(24px + var(--h-offline)) var(--gutter) 48px; }
.lib-body { display: flex; flex-direction: column; gap: 24px; margin-top: 16px; }
.clip-group-head { position: sticky; top: calc(var(--h-chrome) + var(--h-offline)); z-index: 10; /* z-raised */
  height: 40px; display: flex; align-items: center; gap: 12px; padding-inline: 12px; }
.reel { height: 16px; margin: 8px 0 12px; }
.clip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.media-card { display: flex; flex-direction: column; overflow: hidden; }
.media-card .media-screen { margin: 8px 8px 0; aspect-ratio: 16 / 9; }
.media-card.pixel-card-latest, .rec-row.pixel-card-latest { border-color: rgb(var(--c-tally-preview) / .7); }  /* the NEW treatment (DI-8) */
```

- **Group header:** `surface-chassis border border-line-subtle rounded-sm sq`, `shadow-e1`. It is opaque enough over the scrolling cards, and under reduced transparency it becomes fully opaque.
- **MediaCard:** `Panel tone="panel"` with padding 0 (`surface-panel border border-line-subtle rounded-md sq shadow-e1`). The screen is inset 8 px with `bg-screen rounded-screen`. The body padding is `10px 12px 12px`.

**Card body rows** (heights exact; the skeleton uses the same numbers):

| Row | Height | Content |
|---|---|---|
| Screen | `(cardWidth − 16) × 9/16` | §11.A.5 `MediaScreen` |
| gap | 10 | — |
| Title row | 16 | `h3` label (`readout` 13/16 `text-fg`) · right: `<time>` (`caption` 12/16 `text-fg-3`) |
| gap | 6 | — |
| Prompt | 36 | `body-sm` 13/18 `text-fg-2`, `line-clamp-2`, `select-text` |
| gap | 8 | — |
| Action row | 28 | left `code` source `text-fg-3` · right IconButton 'Copy prompt' (28) + `Button size="sm" variant="ghost"` 'Download' |

**Column count by width** (content = viewport − 2 × gutter; CSS `auto-fill` derives these, and they are listed only for verification):

| Viewport | Gutter | Columns × card width | Screen |
|---|---|---|---|
| 1920 | 32 | 4 × 332 (root capped at 1440 → content 1376) | 316×178 |
| 1440 | 32 | 4 × 332 | 316×178 |
| 1280 | 24 | 4 × 296 | 280×158 |
| 1024 | 24 | 3 × 314 | 298×168 |
| 768 | 24 | 2 × 352 | 336×189 |
| 390 | 16 | 1 × 358 | 342×192 |

**PageHeader** (≤ 96 px): eyebrow `LIBRARY`, `h1` 'Clips', and on the right (`actions` slot) the count meta in `readout` `text-fg-3` `.nums` (§11.A.9 for copy). Below 768 the meta wraps under the h1.

**Wireframes.**

```text
1440 × 900 · gutter 32 · content 1376 (times abbreviated; they render as `Sep 24, 21:04`)
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CommandBar 48 (§7.8)                                                                             │ 48
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ LIBRARY                                                                   100 clips · latest 100 │ PageHeader 60
│ Clips                                                                                            │
│                                                                                                  │
│┌ SESSION 3f2a91c0… · 14 clips · 06:12 · Sep 24 ──────────────────────────────────── [●] LIVE ───┐│ 40 sticky, top = --h-chrome + --h-offline
│└────────────────────────────────────────────────────────────────────────────────────────────────┘│
│ [██████████|████|█████████████|██|▒▒▒▒]                                                          │ reel 16 (aria-hidden, oldest left)
│┌──────── 332 ────────┐16┌──────── 332 ────────┐16┌──────── 332 ────────┐16┌──────── 332 ────────┐│ cards 4 × 332, gap 16
││┌───── 316×178 ─────┐│  │┌───── 316×178 ─────┐│  │┌───── 316×178 ─────┐│  │┌───── 316×178 ─────┐││ screen 316×178
│││[NEW][CAPTURING]   ││  ││           [FAILED]││  ││                   ││  ││                   │││
│││Segment still      ││  ││No media stored for││  ││   poster frame    ││  ││   poster frame    │││
│││recording          ││  ││this segment       ││  ││                   ││  ││                   │││
│││                   ││  ││                   ││  ││              00:14││  ││              00:21│││
││└───────────────────┘│  │└───────────────────┘│  │└───────────────────┘│  │└───────────────────┘││
││segment v14 · 21:04  │  │segment v13 · 21:02  │  │segment v12 · 20:58  │  │segment v11 · 20:51  ││ title row 16
││A slow dolly past    │  │Rain on the neon     │  │Crane up over the    │  │Coast at the desk,   ││ prompt 36 (2 lines)
││the market stalls…   │  │sign, close-up…      │  │night market…        │  │tally lamp lit…      ││
││director     [⧉] [↓] │  │director     [⧉]     │  │director     [⧉] [↓] │  │director     [⧉] [↓] ││ action row 28
│└─────────────────────┘  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘│
│ … rows until 24 cards (counted across groups) …                                                  │
│                              [ Show more ]  24 of 100                                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ StatusRail 24                                                                                    │ 24
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
[⧉] Copy prompt · [↓] Download

390 × 844 · gutter 16 · content 358
┌────────────────────────────────────┐
│ WZRD.tech            [AIR] [⌕] [◐] │ 48
│ Live Control  Shotboard  Charac… › │ 44 nav row
├────────────────────────────────────┤
│ LIBRARY                            │
│ Clips                              │
│ 100 clips · latest 100             │ meta wraps
│┌ SESSION 3f2a91c0… · 14 clips ────┐│ 40 sticky, top 92
│└──────────────────────────────────┘│
│ [████|██|██████|█|▒▒]              │ reel 16
│┌──────────────────────────────────┐│ card 358
││┌────────────────────────────────┐││ screen 342×192
│││[NEW]                      00:14│││
│││                                │││
││└────────────────────────────────┘││
││ segment v14 · 21:04              ││
││ A slow dolly past the market     ││
││ stalls as rain begins…           ││
││ director               [⧉] [↓]   ││
│└──────────────────────────────────┘│
└────────────────────────────────────┘
```

At < 768 the group header shows `SESSION <id>… · <n> clips`; the duration and date move into the header's `title` and sr-only text so they stay in the accessible name.

#### 11.A.5 Component tree

```text
app/admin/clips/page.tsx ('use client')
└─ ClipsPage
   ├─ enabled === false → <div class="lib-root"><PageHeader eyebrow="LIBRARY" title="Clips"/><ConvexNotConfigured feature="clips"/></div>
   └─ enabled === true  → <ClipsList/>  → const lib = useClipsLibrary() → <ClipsView {...lib}/>
ClipsView (div.lib-root)
├─ PageHeader eyebrow="LIBRARY" title="Clips" titleAs={headingLevel === 2 ? 'h2' : 'h1'} actions={<CountMeta …/> | <Skeleton shape="text" w={120} h={16}/>}
├─ state==='loading' → ClipsSkeleton.Body (delayed, §11.A.6)
├─ state==='auth'    → <AuthRequired size="route"/>                                   (§11.D.7)
├─ state==='offline' → <Slate kind="offline" size="route" …/>                           (§11.D.7)
├─ state==='empty'   → <Slate kind="empty" kicker="NO FOOTAGE" art="clips" size="route" …/>
└─ state==='ready'   → div.lib-body
   ├─ SessionGroup × n  (section aria-labelledby → its h2; headId = useId())
   │  ├─ header.clip-group-head > h2#{headId} … [Led tone="success" label="LIVE"] when isSessionLive(session, now)
   │  ├─ SessionReel clips={group.clips} statusOf onJump(id)
   │  └─ ul.clip-grid role="list" > li > MediaCard × (visible slice of the group)
   │     └─ article#clip-<id>.media-card[data-testid=clip-card][data-status] aria-labelledby → its h3 (+ .pixel-card-latest on global index 0)
   │        ├─ MediaScreen src poster status durationSeconds label isLatest onOpen
   │        ├─ div.title-row > h3#{labelId} "segment v14" (labelId = useId(); tabIndex -1) | <time>
   │        ├─ p.prompt
   │        └─ div.actions > code(source) · IconButton "Copy prompt" · Button "Download" (url only)
   ├─ ShowMore (Button secondary "Show more" + readout "24 of 100") when visible < total
   └─ MediaViewer (single instance; open state holds the clip id)
```

The `article#clip-<id>` id is a scroll target for the reel (`document.getElementById`), never an ARIA reference; every id that `aria-labelledby` or `aria-describedby` points at comes from `useId()`.

**`useClipsLibrary()`** (`components/media/useClipsLibrary.ts`):

```ts
const clips = useQuery(api.clips.list, { limit: 100 })        // DI-4, unchanged
const sessions = useQuery(api.sessions.list, { limit: 50 })   // existing read-only query (convex/sessions.ts:44-54); additive use
const auth = useConvexAuthState()                             // docs/redesign/spec/07-primitives-and-shell.md §7.2
const online = useOnline()                                    // docs/redesign/spec/07-primitives-and-shell.md §7.2
const loadState = useLoadState(clips, { isAuthed: auth.isLoading ? undefined : auth.isAuthenticated })  // docs/redesign/spec/07-primitives-and-shell.md §7.2
const state = !online && clips === undefined ? 'offline'
  : auth.isLoading || (clips !== undefined && sessions === undefined) ? 'loading'   // no 'empty' while auth resolves (signed out also returns []); no FAILED flash before sessions arrive
  : loadState                           // 'loading' | 'empty' | 'ready' | 'auth'
const [now, setNow] = useState(() => Date.now())
const { groups, statusOf, nextBoundary } = useMemo(
  () => (clips !== undefined && sessions !== undefined ? groupClips(clips, sessions, now) : NO_GROUPS),  // NO_GROUPS: module-level { groups: [], statusOf: new Map(), nextBoundary: null }
  [clips, sessions, now])
useEffect(() => {                                             // one timer, only for the next status flip; no polling
  if (nextBoundary === null) return
  const id = setTimeout(() => setNow(Date.now()), Math.max(0, nextBoundary - Date.now()) + 50)
  return () => clearTimeout(id)
}, [nextBoundary])
useEffect(() => setNow(Date.now()), [clips, sessions])        // re-anchor on every reactive update
```

> Note: `api.sessions.list` is an existing query (`convex/sessions.ts:44-54`, auth-guarded, `[]` when signed out). Reading it adds a subscription, not a backend change. It is the only signal that a session is still live, which CAPTURING needs.

**Status derivation** (`lib/clips.ts`, pure, unit-tested):

```ts
export type ClipStatus = 'ready' | 'capturing' | 'uploading' | 'failed'
export const UPLOAD_GRACE_MS = 120_000
export const LIVE_MAX_MS = 4 * 60 * 60 * 1000   // an 'opening'/'live' row older than this is treated as ended

export const isSessionLive = (s: SessionRow | undefined, now: number): boolean =>
  !!s && (s.status === 'opening' || s.status === 'live') && now - s.startedAt < LIVE_MAX_MS

/** newer = the next newer clip in the same session group (undefined for the newest);
 *  session = the api.sessions.list row for clip.sessionId (undefined if absent). */
export function deriveClipStatus(clip: ClipRow, newer: ClipRow | undefined,
                                 session: SessionRow | undefined, now: number): ClipStatus {
  if (clip.url) return 'ready'
  if (clip.durationSeconds > 0) return 'failed'                       // media attached but the URL is gone
  if (!newer && isSessionLive(session, now)) return 'capturing'
  const segmentEndedAt = newer?.createdAt ?? session?.endedAt ?? clip.createdAt
  return now - segmentEndedAt < UPLOAD_GRACE_MS ? 'uploading' : 'failed'
}
```

- This follows the real lifecycle. `createClip` inserts `durationSeconds: 0` at segment start (`DirectorPlayer.tsx:489-495`). The segment ends when the next direction inserts the next row (`rotateClip`, `:465-507`) or on flush (`:510-527`). `attachMedia` then sets `storageId`, `mimeType`, `sizeBytes` and `durationSeconds` in one patch (`convex/clips.ts:35-47`), which makes `url` non-null.
- `groupClips` keeps the query's newest-first order. The group key is `sessionId ?? 'none'`, groups are ordered by their newest clip, and each group's `totalSeconds` is the sum of `durationSeconds`. `nextBoundary` is the smallest future value among `segmentEndedAt + UPLOAD_GRACE_MS` of the `uploading` clips and `startedAt + LIVE_MAX_MS` of the sessions for which `isSessionLive` is true, or `null`.

> Note: a session row becomes `ended` only in `disconnect()`, after the recording upload (`DirectorPlayer.tsx:899-902`). The unmount path (`:1034-1043`), a tab close or a crash leave it `opening` or `live` forever. `LIVE_MAX_MS` caps how long such a row can show CAPTURING or the LIVE LED. The unmount fix is a §17.4 follow-up (it belongs to §8).

**`SessionGroup` header** (`h2`, 40 px): kicker `SESSION` (`label` `text-fg-3`, authored uppercase), then the short id `<code title={sessionId}>{sessionId.slice(0, 8)}…</code>` (DI-9), then `{n} clips`, `duration(totalSeconds)` (`MM:SS`, or `HH:MM:SS` from 1 h) and `day(oldest.createdAt)`. Separators are `<span aria-hidden="true"> · </span>` with sr-only commas, so the accessible name reads "Session 3f2a91c0…, 14 clips, 06:12, Sep 24". A group without a session reads `NO SESSION · {n} clips` and has no `code`. When `isSessionLive(session, now)`, a right-aligned `<Led tone="success" label="LIVE">` is shown.
> Note: the bible's example `SESSION 3F2A91C0…` uppercases the id. Convex ids are case-sensitive and must round-trip through copy-paste, so they render as stored.

**`SessionReel`** (`div.reel[data-testid=session-reel][aria-hidden=true]`, `bg-screen rounded-screen`, padding 2, `display:flex; gap:2px`):
- The reel is chronological (oldest left), with one `<button type="button" tabIndex={-1}>` per clip. A clip with `durationSeconds > 0` gets `flex: <durationSeconds> 1 0; min-width: 6px`. A zero-duration clip gets `flex: 0 0 24px`.
- Fill is `background-color` plus a `mask-image` tile (§5 Bayer tiles, both prefixed and unprefixed, `8px 8px` repeat):

| Status | Colour | Mask |
|---|---|---|
| ready | `rgb(var(--c-ramp-2))` | none (100%) |
| capturing | `rgb(var(--c-tally-rec))` | `--bayer-4-07` (50%) |
| uploading | `rgb(var(--c-accent))` | `--bayer-4-03` (25%) |
| failed | `rgb(var(--c-danger))` | `--bayer-4-03` (25%) |

- Hover draws a 1 px `accent` outline and opens a `Tooltip` (`delay={400}`) with the first 140 characters of the prompt, then `segment v12 · 00:14 · READY`.
- Click (`onJump(id)`):
  1. If the clip's global index is ≥ `visibleCount`, set `visibleCount = ceil((index + 1) / 24) × 24`.
  2. On the next frame, run `document.getElementById('clip-' + id).scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })`.
  3. Then focus that card's `[data-testid=clip-open]` with `preventScroll: true`. If the clip has no media, focus its `h3` (`tabIndex={-1}`).
- The reel is a redundant pointer shortcut: every clip is reachable in the grid, so the reel is `aria-hidden` and its buttons stay out of the tab order.

**`MediaScreen`** (`components/media/MediaScreen.tsx`; shared with Recordings):

```ts
interface MediaScreenProps {
  src: string | null; durationSeconds: number; label: string            // label feeds aria-label "Play {label}"
  status: 'ready' | 'capturing' | 'uploading' | 'failed' | 'unavailable'
  isLatest?: boolean; onOpen?: () => void; testId?: string
}
```

| Layer (bottom → top) | Spec |
|---|---|
| Placeholder | Always present. A `rgb(var(--c-tally-off))` field (theme-invariant) under the `--bayer-4-03` mask (25%) on `bg-screen`, with a centred caption plate `surface-hud rounded-xs px-2 py-0.5 text-fg-on-screen caption` (6.70:1, §5.6): ready (before the poster lands) shows nothing; capturing "Segment still recording"; uploading "Segment uploading"; failed **'No media stored for this segment'** (preserved, `clips/page.tsx:48`); unavailable **'Media unavailable'** (preserved, `recordings/page.tsx:64`); poster error or poster timeout "Preview unavailable" |
| Poster | Only when `src` is set. On the first `useInView(ref, { rootMargin: '200px 0px' })`, `posterQueue.acquire()`, then mount `<video src={src + '#t=0.1'} muted playsInline preload="metadata" disablePictureInPicture tabIndex={-1} aria-hidden className="absolute inset-0 h-full w-full object-contain">`. Release the slot exactly once, on the first of: `loadeddata`; `loadedmetadata` plus one frame (`requestVideoFrameCallback` when present, else a 250 ms timer); `error`; `stalled`; `abort`; component unmount; or an 8000 ms timeout. The timeout also unmounts the `<video>` and leaves the placeholder with "Preview unavailable". On `loadeddata` the video gets `.px-resolve` once. The video **unmounts** when its card is outside `rootMargin: '50% 0px'`, and the placeholder remains. No `<video>` exists before a card is near the viewport |
| Hover-scrub | Only when `src` is set **and** `matchMedia('(hover: hover) and (pointer: fine)')` matches. On `pointerenter`, set `preload = 'auto'`. On `pointermove`, compute `t = clamp01((x − left) / width) × D`, where `D = durationSeconds > 0 ? durationSeconds : video.duration` (skip when not finite). Keep one seek in flight: when `video.seeking`, store `t` and apply the latest value on `seeked`. The screen shows a 2 px `accent` bar at the bottom (`transform: scaleX(t / D)`, no transition). On `pointerleave`, set `currentTime = 0.1` and hide the bar. It never plays, so it stays allowed under reduced motion (direct manipulation) |
| HUD top-left | A flex row, gap 4, inset 6 px: `isLatest` → `<TallyLight kind="preview" lit size="sm" label="NEW" srLabel="Newest clip">`; capturing → `<TallyLight kind="rec" lit size="sm" label="CAPTURING" srLabel="Capturing" data-testid="clip-status-capturing">` (TallyLight spreads `data-*` onto its root, §7.4); uploading → `kind="standby" lit label="UPLOADING" srLabel="Uploading"` (`clip-status-uploading`); failed → `kind="fault" lit label="FAILED" srLabel="No media"` (`clip-status-failed`) |
| HUD bottom-right | `surface-hud rounded-xs px-1 h-4` with `micro` `text-fg-on-screen` `.nums`: `duration(Math.round(durationSeconds))` (for example `00:14`). It is hidden when `durationSeconds === 0`. While scrubbing it reads `` `${duration(t)} / ${duration(D)}` `` (`MM:SS`, §5.20.4; for example `00:07 / 00:14`) |
| Open control | When `src` is set, the whole screen is a `<button type="button" data-testid="clip-open" aria-label={'Play ' + label}>` that calls `onOpen`. Without `src` it is a `div` (nothing to play) |

**`MediaCard` actions:**
- **Copy prompt:** `<IconButton icon={Copy} label="Copy prompt" size="sm">` runs `navigator.clipboard.writeText(clip.prompt)`. On success the icon shows `Check` for 900 ms and `announce('Prompt copied')` fires. On rejection, `chyron.push({ tone:'error', title:"Couldn't copy the prompt", body: message })`.
- **Download** (only when `clip.url`): `<Button size="sm" variant="ghost" icon={Download} pending={p} pendingLabel="Downloading…" successLabel="Saved" successSignal={savedAt} errorSignal={failedAt} aria-describedby={labelId}>Download</Button>` runs ``downloadMedia(clip.url, `clip-${clip._id}.${extFromMime(clip.mimeType)}`, { sizeBytes: clip.sizeBytes })``. `labelId` is the card `h3`'s `useId()`. The result `'saved'` sets `savedAt = Date.now()` (success micro-state), `'fallback'` sets `failedAt = Date.now()` (error micro-state) and `'cancelled'` sets neither (§7.3 signals).

**`lib/download.ts`:**

```ts
type SaveFilePicker = (o: { suggestedName: string }) => Promise<FileSystemFileHandle>   // not in TypeScript 5.9's lib.dom
export const BLOB_MAX_BYTES = 256 * 1024 * 1024

export async function downloadMedia(url: string, filename: string,
    { sizeBytes }: { sizeBytes?: number } = {}): Promise<'saved' | 'fallback' | 'cancelled'> {
  try {
    if (sizeBytes !== undefined && sizeBytes > BLOB_MAX_BYTES) {         // never buffer a whole session tape in the renderer
      const pick = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker
      if (!pick) return fallback(url, 'Large file: open it in a new tab and save it from there.')
      let handle: FileSystemFileHandle
      try { handle = await pick({ suggestedName: filename }) }
      catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'; throw e }
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      await res.body.pipeTo(await handle.createWritable())
      return 'saved'
    }
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const href = URL.createObjectURL(await res.blob())
    const a = Object.assign(document.createElement('a'), { href, download: filename, rel: 'noopener' })
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
    return 'saved'
  } catch {
    return fallback(url, 'Open the file in a new tab and save it from there.')
  }
}

function fallback(url: string, body: string): 'fallback' {
  chyron.push({ tone: 'warning', title: "Couldn't download directly", body,
    action: { label: 'Open file', run: () => {
      const a = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener noreferrer' }); a.click() } } })
  return 'fallback'
}
```

- Up to `BLOB_MAX_BYTES` (256 MiB), `fetch` → Blob → object URL is what makes `download` work: the attribute is ignored on cross-origin `href`s, and Convex storage URLs are cross-origin. Above it, the file streams to disk through `showSaveFilePicker`, so a whole-session tape (1.5 GiB is realistic) is never buffered in a renderer that may sit next to the on-air Live Control tab. A browser without the picker gets the "Large file" chyron at once, without fetching.
- A cancelled save dialog (`AbortError`) returns `'cancelled'`: no chyron and no micro-state.
- Both fetch paths need `Access-Control-Allow-Origin` on Convex storage GET responses. Nothing verifies it before configured QA (§11.B.10); without it every download takes the fallback (a §17.4 follow-up).
- The fallback never navigates the admin tab and never opens a window without a click. The Button runs its error micro-state on `'fallback'`.
- No `console.*`.

**`MediaViewer`** (one per page): `Dialog size="lg"` titled `{label}` (for example `segment v14`), with the description `{source} · {stamp(createdAt)}`. It contains:
- `<video key={id} src={url} controls playsInline preload="auto" autoPlay={!reduced} className="aspect-video w-full bg-screen object-contain">`, with `onLoadedMetadata={(e) => fixInfiniteDuration(e.currentTarget)}` only when `sizeBytes` is unknown or at most 64 MiB. Seeking a larger cue-less WebM to its end reads the whole file, so above 64 MiB the description appends ` · {hms(durationSeconds)}` (the stored duration) instead;
- the full prompt (`body`, `select-text`);
- the session id in `code` with `title` (DI-9);
- `<time dateTime={iso}>{new Date(createdAt).toLocaleString()}</time>`;
- Download and Copy prompt;
- IconButtons 'Previous clip' (ChevronLeft, verified with `node -e`) and 'Next clip' (ChevronRight), which step through clips that have a `url` in the flattened order.

Keys while the dialog is open (ignored when focus is in an input): **J** `currentTime −= 5`, **K** play/pause, **L** `currentTime += 5` (§7.12). Esc closes it, and focus returns to the opening screen button (`Dialog` behaviour).

> Note: §16's media budget says `preload="none"` with IntersectionObserver posters. This spec is stricter before the viewport (no `<video>` element exists at all) and uses `preload="metadata"` only for a card within 200 px of the viewport, because a paused frame cannot paint without it.

**Pagination.** `visibleCount` starts at `PAGE_SIZE` (24) and counts across groups in flattened newest-first order. A group renders only the part of its slice that falls inside `visibleCount`, but its header and reel always show the whole group. A group with no visible clip is not rendered. "Show more" (`Button variant="secondary"`, `data-testid=clips-show-more`) adds 24. It is followed by `readout` `text-fg-3` "`{visible} of {total}`". After a click, focus moves to the first newly rendered card's open control, or its `h3`.

**New arrivals.** A `seenIds` ref (a `Set`) records the ids present at the first ready render. After every later commit, `n` = the number of clip ids not yet in `seenIds`; they are added to it, and when `n > 0` the §11.A.8 announcement is scheduled. Counting ids, not `clips.length`, keeps it working when the `limit: 100` window is full and a new clip pushes the oldest out. A card whose id was not in `seenIds` when it mounted (captured once per card) gets `.px-resolve` with `--px-resolve-dur: 120ms` and `animation-delay: calc(min(var(--i), 7) * 30ms)` (§6.11 rhythm). Browser scroll anchoring (`overflow-anchor: auto`, the default) keeps the viewport stable when a card is inserted above it.

#### 11.A.6 States

Order of evaluation: not configured → offline without data → auth → loading → empty → ready.

| State | Condition | Rendering | Exact copy |
|---|---|---|---|
| Route loading | Navigation pending | `app/admin/clips/loading.tsx` (§6.3, §11.D.5): `RouteSkeleton` from 4D; from 11A `<ClipsSkeleton loader={<CoastLoader size={64} label="Loading Clips" />} />` in `.route-fallback` | "Loading Clips" |
| Not configured | `useConvexEnabled() === false` | `PageHeader` + `<ConvexNotConfigured feature="clips" />` → `NotConfigured size="route"` (§11.D.7) | Title 'Convex is not configured'; body 'Set `NEXT_PUBLIC_CONVEX_URL` to enable clips. Run `npx convex dev` in `dashboard/` to create a deployment.' |
| Offline, no data | `!useOnline() && clips === undefined` | `<Slate kind="offline" size="route">` (§11.D.7) | Title "Network offline"; body "This view reconnects on its own when the network returns." |
| No access | `!auth.isLoading && !auth.isAuthenticated` (before loading/empty, because `clips.list` returns `[]` signed out) | `<AuthRequired size="route" />` | §11.D.7 |
| Loading | `clips === undefined` or `auth.isLoading` | The PageHeader renders (meta is a 120×16 text skeleton). The body is `ClipsSkeleton.Body`, shown through `useDelayedFlag(loading, { delayMs: 150, minMs: 300 })`. Before the flag, the body is empty (≤ 150 ms). The container has `aria-busy="true"` and an sr-only `role="status"` | sr-only "Loading clips" |
| Empty | `clips.length === 0` and authenticated | `<Slate kind="empty" kicker="NO FOOTAGE" art="clips" size="route" actions={<Link href="/admin" className={buttonClassName('secondary','md')}>Open Live Control</Link>}>` (`buttonClassName` from `components/ui/buttonClassName.ts`, §7.3) | Title 'No clips yet' (preserved); body 'Use “Start Director” on Live Control, then send directions. Each applied direction is saved here as a clip.' (U+201C/U+201D quotes) |
| Ready | Otherwise | §11.A.4–§11.A.5 | — |
| Per clip | `deriveClipStatus` | §11.A.5 HUD and captions | CAPTURING · UPLOADING · FAILED · NEW; captions per the MediaScreen table |
| Poster error | `<video>` `error` | Placeholder caption | "Preview unavailable" |
| Download fallback | `downloadMedia` → `'fallback'` | Warning chyron with action | "Couldn't download directly" / "Open the file in a new tab and save it from there." / "Open file". Over 256 MiB without a save dialog, the body is 'Large file: open it in a new tab and save it from there.' |
| Air lock | Not reachable (§11.0) | — | — |

`ClipsSkeleton` geometry: the real PageHeader (with the loader in `actions` for the route fallback), then one `clip-group-head` block (40 px, 60% width text bar), a `Skeleton shape="block" h={16}` reel, and a `.clip-grid` of **8** `MediaCard` skeletons. Each skeleton card has a `media` 16:9 screen inset 8, a 16 px text bar at 40%, 2 lines at 13/18, and a 28 px row with a 96×28 block. Cards 3–8 are `display:none` below 768 px. It uses the same `.clip-grid` and `layout.ts` constants, so replacing it causes no shift.

> Note: the design bible's Clips summary says the fixed empty copy names 'Record' and 'Stop & save recording'. Those controls create **Recordings**. Clips are captured automatically, one per applied direction (`rotateClip`, `DirectorPlayer.tsx:465-507`, called on each applied direction at `:557` and `:586`, and at first media at `:973`). DI-12 ("reference the real Director controls") is met with the control that actually produces clips, 'Start Director', verbatim.

#### 11.A.7 Motion

| Moment | Motion | Reduced motion |
|---|---|---|
| Route enter | `app/admin/template.tsx` `.px-resolve` (§6.4.1). No other page-root resolve | None |
| Skeleton → content | `.px-resolve` on `div.lib-body`, only if the skeleton was shown (§6.8) | Cut |
| Header count | `<CountUp value={n} />` 600 ms, once on first reveal (§12); later changes snap | Final value |
| Poster lands | 160 ms `.px-resolve` on the `<video>` at `loadeddata` | Cut |
| New clip arrives | 120 ms resolve, 30 ms stagger, ≤ 8 (§11.A.5) | Cut |
| "Show more" | New cards resolve 120 ms with a 30 ms stagger for the first 8, then the rest arrive together | Cut |
| Status change | The TallyLight lit change runs its 160 ms resolve once (§7.4) | Cut |
| Card hover | Border `line-subtle` → `line-strong`, 120 ms `--ease-out`. **No transform, no lift, no glow** | Instant |
| Scrub | Bar `scaleX` follows the pointer with no transition | Same (user-driven) |
| Viewer | `Dialog` 160 ms resolve in, 120 ms opacity out (§7.3) | Instant |
| Reel jump | `scrollIntoView({ behavior: 'smooth' })` | `'auto'` |

Nothing else moves. There are no loops on this page apart from the `BayerSpinner` inside a pending Download.

#### 11.A.8 Accessibility

- **Headings:** `h1` 'Clips' (the only h1) → `h2` per session → `h3` per card. Each card is an `<article>` labelled by its `h3` (`aria-labelledby`, id from `useId()`), and each grid is a `ul role="list"`.
  - `headingLevel` changes only the route heading: at 2, PageHeader renders `titleAs="h2"`; the `h2`/`h3` levels inside the view do not change. `LibraryVisualFixture` passes 2, so `/admin/visual-test` keeps one `h1` (§10.5.9).
- **Names:**
  - The open control is "Play segment v14" (or "Play chunk #3").
  - Download and Copy prompt carry `aria-describedby` → the card `h3` (the same `useId()` id), so repeated buttons are distinguishable.
  - Lamps always carry text (§7.4 `srLabel`).
- **Keyboard:**
  - Tab order is: header, then per card: open control → Copy prompt → Download, then "Show more".
  - Space/Enter on the open control opens the viewer. J/K/L work only inside the viewer.
  - The reel is `aria-hidden` and `tabIndex={-1}`, because it duplicates the grid.
- **Announcements:** new clips are not announced one by one (noise during a live show). When `n > 0` new ids arrive after first ready (§11.A.5 New arrivals), `announce('{n} new clips')` fires, debounced to 5 s. Download success announces "Saved `clip-<id>.<ext>`" (the real file name). Copy announces "Prompt copied".
- **Contrast:**
  - Screen captions sit on a HUD plate in `text-fg-on-screen` (6.70:1, §5.6); `text-fg-on-screen-2` never sits on a HUD plate.
  - HUD plates use `text-fg-on-screen` (6.70:1, §5.6).
  - Accent text never appears on HUD plates.
  - The prompt uses `text-fg-2` on panel (8.80 dark, 8.56 light, §5.6).
- **Targets:** IconButtons are 28 px, with 44 px on coarse pointers (§7.3). The open control is the whole screen.
- **Selection:** prompt, session id and source are selectable. There is no `user-select: none` anywhere on this route.
- **Reduced transparency:** `.clip-group-head` and cards become opaque through `--a-*` (§5).

#### 11.A.9 Preserved contract

| ID | How §11.A satisfies it |
|---|---|
| DI-1, ST-1, SH-1 | No opaque full-page layer. Surfaces are `surface-*` (translucent); screens are card-sized |
| DI-2, SH-2 | Route and nav label untouched (AppNav owns them, §7.9) |
| DI-3, SH-5 | `app/admin/clips/page.tsx` keeps `useConvexEnabled()` and the literal `<ConvexNotConfigured feature="clips" />`; the wrapper keeps the `feature` prop and every string |
| DI-4, ST-4 | `useQuery(api.clips.list, { limit: 100 })` byte-identical; `api.sessions.list` is an additional read of an existing query |
| DI-8, ST-3, SH-7 | Newest-first order kept; global index 0 carries `.pixel-card-latest` on the `article` plus the NEW lamp; `--pixel-card-*` stay defined in `app/styles/components.css` (§5.18) |
| DI-9 | `h3` shows `segment v{promptVersion}` or `chunk #{chunkIndex}`; prompt shown; duration from `durationSeconds` on the HUD plate and in the reel; the session short id `{id.slice(0,8)}…` with `title={id}` in the group header and the viewer; the source in `code` on every card |
| DI-12 | Empty copy names 'Start Director' (see the §11.A.6 Note) |
| DI-13, ST-2, SH-6 | No `console.*` in any new file (grep gate §11.A.10) |
| DI-14 | Every motion has the reduced mapping in §11.A.7; hover-scrub never autoplays |
| DI-15 | Tokens only; screenshots in both themes |
| DI-16, ST-5 | No kit import on this route |
| DI-17 | Test ids from §11.0 |
| DI-18 | Page stays `'use client'`; no Suspense or server data |

**String ledger** (every visible string of `app/admin/clips/page.tsx` at 845147c). Every row whose "After" differs from the original is a D6-listed change for this route; nothing else changes:

| String | Where | After |
|---|---|---|
| 'Clips' (`:19`, h3) | Card header | `h1` via PageHeader (same text) |
| `` `${clips.length} clips` `` (`:21`) | Header right | PageHeader meta; `1 clip` when n = 1; ` · latest 100` appended when n = 100 |
| 'Loading…' (`:21`) | Header right | Removed; skeleton + sr-only "Loading clips" |
| 'No clips yet' (`:29`) | Empty | Slate title (same text) |
| 'Start an LTX stream or a Director session to populate clips' (`:30`) | Empty | **Replaced** (D6): 'Use “Start Director” on Live Control, then send directions. Each applied direction is saved here as a clip.' |
| 'No media stored for this segment' (`:48`) | No media | FAILED screen caption (same text) |
| `{clip.source} · segment v{n}` / `chunk #{n}` (`:55`) | Meta line | Label in `h3`; source in `code` in the action row |
| `new Date(createdAt).toLocaleString()` (`:59`) | Meta line | Visible `stamp()` (`Sep 24, 21:04`); the `toLocaleString()` value moves to `<time title>` and the viewer |
| `clip.prompt` (`:63`) | Prompt box | `line-clamp-2` (was 3), selectable; full text in the viewer |
| `` `${durationSeconds.toFixed(1)}s` `` (`:66`) | Footer | HUD plate `MM:SS`; hidden at 0 |
| `` `${sessionId.slice(0, 8)}…` `` + `title={sessionId}` (`:68-70`) | Footer | Group header `code` with the same `title`; viewer |

**New strings:** 'LIBRARY', 'SESSION', 'NO SESSION', 'LIVE' (Led), 'NEW', 'CAPTURING', 'UPLOADING', 'FAILED', 'READY' (reel Tooltip), 'Segment still recording', 'Segment uploading', 'Preview unavailable', 'Play {label}', 'Copy prompt', 'Download', 'Downloading…', 'Saved', "Couldn't copy the prompt", "Couldn't download directly", 'Open the file in a new tab and save it from there.', 'Large file: open it in a new tab and save it from there.', 'Open file', 'Show more', '{n} of {total}', 'Previous clip', 'Next clip', 'Loading clips', '{n} new clips', 'Prompt copied', 'Open Live Control', the NO FOOTAGE kicker, and the empty body above. Appendix A collects them.

#### 11.A.10 Acceptance criteria

**How to run.** Run modes are §1.6's: browser items run in **dev** (unconfigured) on `/admin/clips?noboot`, or in **fixture** mode (dev at `/admin/visual-test?noboot#clips-visual-test`; the route is 404 in prod, so fixture items never run on prod), unless a line says otherwise. Commands whose paths start with `dashboard/` or `docs/`, and `git` commands with such pathspecs, run from the repository root; every other command runs from `dashboard/`.

**Contract and gates**
- [ ] `git diff --stat 845147c -- dashboard/convex dashboard/components/DirectorPlayer.tsx dashboard/components/dither-kit dashboard/components/reactbits/PixelCard.jsx dashboard/components/reactbits/PixelCard.css` prints nothing.
- [ ] `grep -n "useQuery(api.clips.list, { limit: 100 })" dashboard/components/media/useClipsLibrary.ts` prints exactly one line; `grep -n "<ConvexNotConfigured feature=\"clips\" />" dashboard/app/admin/clips/page.tsx` prints one line.
- [ ] `grep -rnE "PixelCard|Loader2|animate-spin|animate-pulse|fal-(gray|primary|purple|blue)|user-select: ?none|select-none|console\.|toFixed\(1\)}s|LTX" dashboard/app/admin/clips dashboard/components/media` prints nothing.
- [ ] `grep -n "pixel-card-latest" dashboard/components/media/MediaCard.tsx dashboard/app/styles/components.css` finds the hook in both files, and `grep -oE -- "--pixel-card-(border|background|active-color)" dashboard/app/styles/components.css | sort -u | wc -l` prints `3` (the §5.18 shim, unchanged).
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` exit 0. In the PR's route table, `/admin/clips` First Load JS minus "First Load JS shared by all" is ≤ 45 kB.

**Unit (`npx playwright test tests/unit`)**
- [ ] `deriveClipStatus` returns: `url` set → `ready`; `url` null and duration 14 → `failed`; newest in a `live` session started 10 min ago → `capturing`; newest in an `opening` session → `capturing`; newer clip created 30 s ago → `uploading`; newer clip created 121 s ago → `failed`; newest, session `ended` with `endedAt` 60 s ago → `uploading`; the same at 200 s → `failed`; no `sessionId` and no newer clip, created 5 min ago → `failed`.
- [ ] Stale and missing session rows: the newest clip of a `live` session whose `startedAt` is 5 h ago, itself created 5 h ago → `failed`, and `isSessionLive` of that session is `false` (the LIVE LED is hidden). With the clip's session row absent from `sessions`, the newest clip is never `capturing`, and `isSessionLive(undefined, now)` is `false`.
- [ ] `groupClips` on `CLIP_FIXTURES` returns 5 groups in newest-first order whose clip counts sum to 100, with the no-session group keyed `'none'`; clips #1, #2 and #3 derive `capturing`, `uploading` and `failed`; `nextBoundary` equals the smallest future value among `segmentEndedAt + 120000` of the `uploading` clips and `startedAt + LIVE_MAX_MS` of live sessions, which is `now + 100_000` for the fixture.
- [ ] `posterQueue` (in `tests/unit/clip-status.spec.ts`): of 6 `acquire()` calls, the first 4 resolve at once and their holders never see a load event; releasing holders 1 and 2 (as their cards unmount) resolves acquires 5 and 6. Calling holder 1's `release` a second time frees nothing: a 7th `acquire()` stays pending.
- [ ] `extFromMime`: `'video/webm;codecs=vp9,opus'`→`webm`, `'video/mp4'`→`mp4`, `'video/mp4;codecs=avc1.42E01E'`→`mp4`, `'VIDEO/QUICKTIME'`→`mov`, `undefined`→`webm`, `'application/octet-stream'`→`webm`. `formatMime('video/webm;codecs=vp9,opus') === 'WebM · VP9'`, `formatMime('video/mp4;codecs=avc1.64001F,mp4a.40.2') === 'MP4 · H.264'`, `formatMime('video/webm') === 'WebM'`. With `t = new Date(2026, 8, 24, 21, 4).getTime()` (local time), `stamp(t)` is `Sep 24, 21:04`, `day(t)` is `Sep 24` and `hhmm(t)` is `21:04`; `grep -n "Intl\." dashboard/lib/format.ts` prints nothing.
- [ ] `hms(s)` equals the 845147c `formatDuration(s)` and `uptime(s)` equals `formatUptime(s)` for every integer `s` in 0…7300.

**Fixture e2e (`tests/library.spec.ts`, 1440×900, dark and light)**
- [ ] `#clips-visual-test` (100 fixture clips) renders exactly 24 `[data-testid=clip-card]` after load. `section#clips-visual-test canvas` count is 0. `section#clips-visual-test video` count is ≤ 16 immediately after scrolling it into view, and every such video has `preload="metadata"` and `video.muted === true` (read the DOM property: React never writes the `muted` attribute on a client render).
- [ ] Clicking `[data-testid=clips-show-more]` 3 times renders 100 cards, and the button then disappears. After scrolling through all cards and back to the top, `section#clips-visual-test video` count is ≤ 24.
- [ ] The first card has class `pixel-card-latest` and contains a lamp whose sr-only text is 'Newest clip'. The fixture's capturing clip has `data-status="capturing"` and `[data-testid=clip-status-capturing]`. The uploading clip has `clip-status-uploading`. The failed clip has `clip-status-failed` and the text 'No media stored for this segment'. No card shows '0.0s' or `00:00`.
- [ ] A card whose fixture clip has `promptVersion: 12` has `h3` text `segment v12`; the fixture clip without `promptVersion` and with `chunkIndex: 3` has `h3` text `chunk #3`. Each group `h2` except the NO SESSION group contains a `code` element whose text matches `/^[a-z0-9]{8}…$/` and whose `title` equals the full session id.
- [ ] Every `[data-testid=session-reel]` has `aria-hidden="true"` and one child per group clip. Clicking the reel segment of the 60th clip renders at least 72 cards and leaves `#clip-<id> [data-testid=clip-open]` focused, with its bounding box inside the viewport.
- [ ] Hovering a ready card's screen and moving the pointer to 50% of its width sets the poster `video.currentTime` within ±0.25 s of `durationSeconds / 2` and shows a HUD reading `MM:SS / MM:SS`. After `pointerleave`, `currentTime` is 0.1 ± 0.05. With `hasTouch: true` and `isMobile: true`, the same gesture does not change `currentTime`.
- [ ] Focusing a card's open control and pressing Space opens a `dialog` whose title is the card label and which contains `video[controls]`. With the 2 s fixture media, pressing `l` from `currentTime = 0` sets it to the end (±0.1 s; +5 s clamped) and `j` then sets it to 0 (−5 s clamped), `k` toggles `paused`, and Esc closes the dialog and returns focus to the open control.
- [ ] Clicking 'Download' on a webm fixture clip fires a Playwright `download` whose `suggestedFilename()` is `clip-<id>.webm`, and the button then contains 'Saved'; on the mp4 fixture clip it is `clip-<id>.mp4`. Routing the fixture URL to `abort()` shows a chyron titled "Couldn't download directly" with an "Open file" button, and `page.url()` is unchanged.
- [ ] The fixture's `auth`, `offline`, `empty` and `loading` bodies show, respectively: kicker `NO ACCESS` and the §11.D.7 title; `NO CARRIER` and "Network offline"; `NO FOOTAGE`, 'No clips yet' and the new body string exactly; `[aria-busy=true]` with a `role="status"` reading "Loading clips". None shows 'No clips yet' except the empty body.
- [ ] Axe (`@axe-core/playwright`) reports 0 serious or critical violations on `#clips-visual-test` in both themes, and exactly one `h1` exists on `/admin/clips`.
- [ ] Emulating `reducedMotion: 'reduce'`: after load, `document.getAnimations().filter(a => a.playState === 'running')` inside `#clips-visual-test` is empty.

**Unconfigured e2e**
- [ ] `/admin/clips`: `h1` is 'Clips'; `main` contains the kicker `NOT PATCHED` and `textContent` includes `Convex is not configured` and `Set NEXT_PUBLIC_CONVEX_URL to enable clips. Run npx convex dev in dashboard/ to create a deployment.`; `main video` and `main canvas` counts are 0; `document.title === 'Clips · stream.wzrd.tech admin'`; the console holds only the §1.6 allowed messages.
- [ ] On `/admin/clips`, the NOT PATCHED slate title is an `h2` whose computed `font-size` is `20px` (`title-lg`, §7.5), below the page `h1`'s `28px` (`display`).
- [ ] At 390×844: `document.scrollingElement.scrollWidth <= 390`.

**Configured QA** (Human operator only, §1.6 step 6; recorded under Verification)
- [ ] **Needs a live Director session: Devin never runs one (§1.8 item 3) and records this item under Deferred / blocked as "not run (paid)".** During a live Director session in tab A, tab B on `/admin/clips` shows the newest clip as CAPTURING. After the next applied direction, it shows UPLOADING, then a poster within 120 s. A clip whose stored `mimeType` starts with `video/webm` saves `.webm`, and one with `video/mp4` saves `.mp4`.
- [ ] Signed out (expired Access cookie), `/admin/clips` shows NO ACCESS, not 'No clips yet'.

**Screenshots:** dark, light and 390 px after-screenshots of the fixture (ready with all four statuses) and of the unconfigured route, attached next to `docs/redesign/baseline/admin_clips-dark.jpg` in the PR.

#### 11.A.11 Cut order

Cut from the top when time runs short; each cut keeps every invariant.
1. The debounced '{n} new clips' announcement.
2. Reel Tooltips (clicking still jumps).
3. Previous/Next in the viewer.
4. Hover-scrub (the poster stays; the viewer still plays).
5. The whole SessionReel (the group headers remain).
6. CountUp on the header count.

**Never cut:** C1–C4 fixes (`useLoadState`, auth before empty, `deriveClipStatus` and the three lamps), no PixelCard, 24-at-a-time with lazy posters, the download with `extFromMime` (a Blob up to 256 MiB, the save dialog above), `.pixel-card-latest` with the NEW lamp, and the LTX copy removal.

---

### 11.B Recordings: "Tape vault" (`/admin/recordings`)

#### 11.B.1 Goal & hero interaction

**Goal.**
- **A tape is a row, not a card.** Each recording is a wide row: a 320×180 poster screen with scrub on the left, and on the right an `h2` title, engraved `inset` plates (Duration, Size, Format, Session) and two actions.
- **Downloads work.** Download saves `recording-<id>.<ext>`, where the extension comes from the stored `mimeType`; it is never a hard-coded `.webm`. Up to 256 MiB it goes through a Blob (the cross-origin `download` attribute is ignored today); a larger session tape streams to disk through the save dialog and is never buffered in the tab (§11.A.5).
- **Delete is safe and visible.** Delete opens a `ConfirmDialog` titled 'Delete this recording permanently?', runs a real pending state around the awaited mutation, reports failure inline, and returns focus predictably.
- **Same honest states as Clips.** The page has skeleton, NO ACCESS, NOT PATCHED, NO CARRIER and NO TAPE states, and keeps the preserved guidance sentence.

**Hero interaction: "pull the tape".** The operator scrubs the top row's poster to check the ending, then presses "Download" (a tape over 256 MiB first opens the browser's save dialog). The button reads "Downloading…" (width-locked) and then "Saved" for 900 ms, and the file saves as `recording-<id>.mp4` for a recording whose stored `mimeType` is `video/mp4`. Then "Delete" on an old take opens the dialog: "Delete permanently" → "Deleting…" → the dialog closes, the row disappears, the INFO chyron reads "Recording deleted", and focus lands on the next row's Download.

#### 11.B.2 Files

**Create**

| Path | Purpose | PR |
|---|---|---|
| `components/media/RecordingsView.tsx` | Presentational root: header, list, "Show more", viewer, delete dialog. Props: `{ state; recordings: RecordingRow[]; total: number; totalBytes: number; onDownload(r); onDelete(id): Promise<void>; headingLevel?: 1 \| 2 }` (`headingLevel` as §11.A.8) | 11B |
| `components/media/RecordingRow.tsx` | One row (§11.B.4) | 11B |
| `components/media/useRecordings.ts` | `useQuery(api.recordings.list, { limit: 100 })`, `useMutation(api.recordings.remove)`, the load state, and `deleteRecording(id)` that awaits `remove({ recordingId: id })` and rethrows | 11B |
| `components/states/skeletons/RecordingsSkeleton.tsx` | Layout-exact skeleton (§11.B.6) | 11B |
| `tests/recordings.spec.ts` | e2e | 11B |

**Change**

| Path | Change | PR |
|---|---|---|
| `app/admin/recordings/page.tsx` | Container only; the gate and the literal `<ConvexNotConfigured feature="recordings" />` are kept. The local `formatBytes` (`:10-14`) and `formatDuration` (`:16-22`) move to `lib/format.ts` as `bytes(n, { gb: true })` (§5.20.4) and `hms(s)` (§11.0), with byte-identical output | 11B |
| `app/admin/recordings/loading.tsx` | Swap `RouteSkeleton` for `RecordingsSkeleton` (the file is created in 4D; shape and caption: §6.3). The route title is §7.7's, 4B | 11B |
| `components/media/LibraryVisualFixture.tsx` | Adds `<section id="recordings-visual-test">` (§11.A.2) | 11B |

`ConfirmDialog` needs no change here: `pendingLabel`, `error`, `errorSignal` and `restoreFocus` are in its §7.3 API (4A).

**Never touch:** `convex/recordings.ts`, `components/DirectorPlayer.tsx` recorder paths (`:279-382`), `components/dither-kit/*`.

#### 11.B.3 Before

Baseline: `docs/redesign/baseline/admin_recordings-dark.jpg` (unconfigured: the ConvexNotConfigured card, "…to enable recordings…").

| # | Defect | Evidence |
|---|---|---|
| R1 | **Broken download.** (a) The name is hard-coded as `recording-<id>.webm`, but `pickRecorderMimeType` falls back to `video/mp4`, and the stored `mimeType` is ignored. (b) The href is a cross-origin Convex storage URL, so `download` is ignored and the admin tab navigates to the raw file | `app/admin/recordings/page.tsx:104-107`; `components/DirectorPlayer.tsx:69-74`, `:325` |
| R2 | **Blocking, unhandled delete.** Native `confirm()`, then `remove()` is neither awaited nor caught. `requireIdentity` throws 'Authentication required', which becomes an unhandled rejection. There is no pending state or feedback, and the row vanishes abruptly | `app/admin/recordings/page.tsx:113-121`; `convex/recordings.ts:39-48` |
| R3 | **Loading renders nothing; signed out looks empty.** Same ternary bug as Clips; `recordings.list` returns `[]` without an identity | `app/admin/recordings/page.tsx:43`, `:37`; `convex/recordings.ts:53` |
| R4 | **100 PixelCards and 100 videos** with `preload="metadata"`, each in a 1/3-width box that letterboxes 9:16 outputs | `app/admin/recordings/page.tsx:52-61` |
| R5 | **Raw data leaks.** 'Type' shows the raw MIME with codecs (`video/webm;codecs=vp9,opus`); the title fallback reads 'director recording' | `app/admin/recordings/page.tsx:89-92`, `:72` |
| R6 | **Contrast.** 'Delete' in `text-fal-red-600` on the dark PixelCard `#1f2937` measures 3.04:1 | `app/admin/recordings/page.tsx:117`; data audit |
| R7 | **Unreliable duration.** MediaRecorder WebM usually lacks a duration header, so the native scrubber shows ∞ or nothing | `app/admin/recordings/page.tsx:61` |

> Note: `docs/redesign/audit/data.md` cites `convex/recordings.ts:135` for the unauthenticated `[]`; the file has 66 lines and the guard is at `:53`.

#### 11.B.4 Layout spec

```css
.rec-list { display: flex; flex-direction: column; gap: 12px; }
.rec-row { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 12px; }  /* Panel tone="panel" */
@media (min-width: 768px) { .rec-row { grid-template-columns: 320px minmax(0, 1fr); gap: 16px; } }
.rec-plates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
@media (min-width: 1024px) { .rec-plates { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
```

| Part | Spec |
|---|---|
| Root | `.lib-root` (§11.A.4); PageHeader eyebrow `LIBRARY`, `h1` 'Recordings', meta right |
| Row | `article.rec-row[data-testid=recording-row]`, `Panel tone="panel"` (`rounded-md sq shadow-e1`); index 0 adds `.pixel-card-latest` (border `rgb(var(--c-tally-preview) / .7)`, §11.A.4 rule) |
| Screen | `MediaScreen` 16:9 (320×180 from 768; full width below); click opens `MediaViewer`; HUD bottom-right `duration(durationSeconds)` (`MM:SS`, or `HH:MM:SS` from 1 h); `isLatest` → NEW lamp |
| Title row | `h2` `title` 16/22 `text-fg`, `line-clamp-2`, `title={full}`; right: `<time>` `caption` `text-fg-3`. When the fallback title is used (it already contains the stamp), the visible `<time>` is omitted and its `toLocaleString()` value moves to the `h2`'s `title` |
| Plates | `<dl class="rec-plates">`; each plate `surface-inset rounded-sm sq px-3 py-2`, 48 px tall: `<dt>` `label` `text-fg-3`, `<dd>` `readout` `text-fg` `.nums` `truncate` |
| Actions | `flex gap-2`, 32 px: `Button variant="secondary" size="sm" icon={Download}` 'Download' (`recording-download`, url only) · `Button variant="danger" size="sm" icon={Trash2}` 'Delete' (`recording-delete`) |
| Right column height | 44 (2 title lines) + 12 + 48 (plates at ≥1024) + 16 + 32 = 152 ≤ 180, so the row is 204 px tall at ≥ 1024 |

```text
1440 × 900 · gutter 32 · content 1376
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CommandBar 48 (§7.8)                                                                             │ 48
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ LIBRARY                                                                  12 recordings · 3.41 GB │ PageHeader 60
│ Recordings                                                                                       │
│                                                                                                  │
│┌────────────────────────────────────────────────────────────────────────────────────────────────┐│ row 204 = 12 + 180 + 12 (Panel, .pixel-card-latest on index 0)
││┌─ 320×180 ───────┐  A continuous original late-night market story…    Sep 24, 21:04            ││ h2, line-clamp-2 · <time>
│││[NEW]            │  in the rain, told in eight directions                                      ││
│││                 │  ┌─ Duration ───┐ ┌─ Size ───────┐ ┌─ Format ─────┐ ┌─ Session ────┐        ││ plates 48, 4 columns from 1024
│││  poster / scrub │  │1h 2m 3s      │ │412.3 MB      │ │WebM · VP9    │ │3f2a91c0…     │        ││
│││                 │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        ││
│││         01:02:03│  [↓ Download]  [Delete]                                                     ││ actions 32
││└─────────────────┘                                                                             ││
│└────────────────────────────────────────────────────────────────────────────────────────────────┘│
│ … 24 rows, then [ Show more ]  24 of 100                                                         │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ StatusRail 24                                                                                    │ 24
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

390 × 844 · gutter 16 · content 358
┌────────────────────────────────────┐
│ WZRD.tech            [AIR] [⌕] [◐] │ 48
│ Live Control  Shotboard  Charac… › │ 44 nav row
├────────────────────────────────────┤
│ LIBRARY                            │
│ Recordings                         │
│ 12 recordings · 3.41 GB            │ meta wraps
│┌──────────────────────────────────┐│ row panel 358, padding 12
││┌─ 334×188 ──────────────────────┐││ screen 334×188
│││[NEW]                   01:02:03│││
│││                                │││
││└────────────────────────────────┘││
││ A continuous original late-night ││ h2 (2 lines)
││ market story in the rain…        ││
││ Sep 24, 21:04                    ││
││ ┌─ Duration ───┐ ┌─ Size ───────┐││ plates 2 × 2
││ │1h 2m 3s      │ │412.3 MB      │││
││ └──────────────┘ └──────────────┘││
││ ┌─ Format ─────┐ ┌─ Session ────┐││
││ │WebM · VP9    │ │3f2a91c0…     │││
││ └──────────────┘ └──────────────┘││
││ [↓ Download] [Delete]            ││ actions 32
│└──────────────────────────────────┘│
└────────────────────────────────────┘
```

#### 11.B.5 Component tree

```text
app/admin/recordings/page.tsx ('use client')
└─ RecordingsPage: enabled ? <RecordingsList/> : <div.lib-root><PageHeader eyebrow="LIBRARY" title="Recordings"/><ConvexNotConfigured feature="recordings"/></div>
   RecordingsList → const r = useRecordings() → <RecordingsView {...r}/>
RecordingsView
├─ PageHeader (meta: `{n} recordings · {bytes(totalBytes, { gb: true })}` [+ ' · latest 100'])
├─ states per §11.B.6
├─ ol.rec-list role="list" > li > RecordingRow × min(visibleCount, n)   (visibleCount starts at 24, +24 per "Show more")
│  └─ article.rec-row (+ .pixel-card-latest on index 0) aria-labelledby → its h2 (titleId = useId())
│     ├─ MediaScreen src={url} status={url ? 'ready' : 'unavailable'} durationSeconds label={'recording from ' + stamp(createdAt)} isLatest
│     ├─ div > h2#{titleId} · <time dateTime title={toLocaleString()}>{stamp(createdAt)}</time>
│     ├─ dl.rec-plates: Duration hms(durationSeconds) · Size bytes(sizeBytes,{gb:true}) · Format formatMime(mimeType) [title=mimeType] · Session {id.slice(0,8)}… | '—' [title=sessionId]
│     └─ div.actions: Download (url only) · Delete
├─ ShowMore
├─ MediaViewer (shared, §11.A.5)
└─ ConfirmDialog (one instance; target id in state)
```

**Title.** ``recording.title ?? `${modelLabel(recording.model)} session · ${stamp(recording.createdAt)}` ``, where `modelLabel('director') === 'Director'` and every other `sessionModel` literal is shown as stored. For example: "Director session · Sep 24, 21:04" (DI-10: still `title ?? <model-based label>`).

**Download.** ``downloadMedia(url, `recording-${recording._id}.${extFromMime(recording.mimeType)}`, { sizeBytes: recording.sizeBytes })``. The Button has `pending`, `pendingLabel="Downloading…"`, `successLabel="Saved"`, `successSignal`/`errorSignal` set exactly as the Clips Download (§11.A.5), and `aria-describedby={titleId}` (the row `h2`). It runs the error micro-state on `'fallback'`.

**Delete flow:**

```tsx
<ConfirmDialog
  open={target !== null}
  title="Delete this recording permanently?"                 // preserved confirm copy (DI-11)
  body="The video file is removed from Convex storage. This cannot be undone."
  confirmLabel="Delete permanently" pendingLabel="Deleting…" cancelLabel="Keep recording"
  destructive pending={deleting}
  restoreFocus={!removed}                                    // the opener (this row's Delete) is gone after a delete; focusAfterDelete() moves focus
  error={deleteError === null ? undefined : (
    <><p role="alert" className="text-caption text-danger">Couldn't delete the recording.</p>
      <code className="text-code text-fg-2 line-clamp-3">{deleteError}</code></>)}
  errorSignal={errorSignal}
  onCancel={() => { if (!deleting) { setTarget(null); setDeleteError(null) } }}
  onConfirm={async () => {
    setDeleting(true); setDeleteError(null)
    try { await deleteRecording(target!); setRemoved(true); setTarget(null); chyron.push({ tone: 'info', title: 'Recording deleted' }); announce('Recording deleted'); focusAfterDelete() }
    catch (e) { setDeleteError(e instanceof Error ? e.message : String(e)); setErrorSignal(Date.now()) }
    finally { setDeleting(false) }
  }}
/>
```

- Opening the dialog sets `removed` to `false`, so "Keep recording" returns focus to the row's Delete button (Dialog behaviour, §7.3).
- While `deleting`, Esc and "Keep recording" are ignored (`aria-disabled="true"`). The mutation is permanent, and closing mid-flight would hide its outcome.
- A failure keeps the dialog open. The `error` slot (rendered under the body, §7.3) shows the `role="alert"` line "Couldn't delete the recording." plus the message in `code`, and the new `errorSignal` plays the confirm Button's error micro-state.
- `focusAfterDelete()`:
  1. Focus the next row's Download, or its Delete if that row has no URL.
  2. If there is no next row, use the previous row's Download or Delete.
  3. If there are no rows left, focus the page `h1` (`tabIndex={-1}`).
  4. It runs after the reactive query drops the row, using `useLayoutEffect` keyed on `recordings.length`.

#### 11.B.6 States

| State | Condition | Rendering | Exact copy |
|---|---|---|---|
| Route loading | Navigation pending | `app/admin/recordings/loading.tsx` (§6.3): `RouteSkeleton` from 4D; from 11B `RecordingsSkeleton` + `<CoastLoader size={64} label="Loading Recordings" />` | "Loading Recordings" |
| Not configured | `!useConvexEnabled()` | PageHeader + `<ConvexNotConfigured feature="recordings" />` | Title 'Convex is not configured'; body 'Set `NEXT_PUBLIC_CONVEX_URL` to enable recordings. Run `npx convex dev` in `dashboard/` to create a deployment.' |
| Offline, no data | `!online && recordings === undefined` | `<Slate kind="offline" size="route">` | §11.D.7 |
| No access | `!auth.isLoading && !auth.isAuthenticated` | `<AuthRequired size="route" />` | §11.D.7 |
| Loading | `recordings === undefined` or `auth.isLoading` | `RecordingsSkeleton.Body` via `useDelayedFlag` (150/300); `aria-busy`; sr-only status | "Loading recordings" |
| Empty | `recordings.length === 0` | `<Slate kind="empty" kicker="NO TAPE" art="recordings" size="route" actions={<Link href="/admin" …>Open Live Control</Link>}>` | Title 'No recordings yet' (preserved); body 'Use “Record” on the Director player, then “Stop & save recording”' (preserved, U+201C/U+201D, no final period) |
| Media URL null | `recording.url === null` | Screen placeholder; no Download | 'Media unavailable' (preserved) |
| Session missing | `!recording.sessionId` | Session plate | '—' (preserved) |
| Downloading / saved / fallback | §11.B.5 | Button micro-states; fallback chyron (§11.A.6) | 'Downloading…' · 'Saved' · "Couldn't download directly" (body 'Large file: open it in a new tab and save it from there.' over 256 MiB without a save dialog) |
| Deleting / deleted / delete failed | §11.B.5 | Dialog pending / INFO chyron / inline alert | 'Deleting…' · 'Recording deleted' · "Couldn't delete the recording." + message |

`RecordingsSkeleton`: the real PageHeader (loader in `actions` for the route fallback), then **3** `rec-row` skeletons. Each has a `media` 16:9 screen (320 wide from 768), 2 title lines at 16/22 (60% and 35%), four 48 px `block` plates in `.rec-plates`, and 104×32 and 88×32 blocks.

#### 11.B.7 Motion

Same table as §11.A.7 for route enter, skeleton → content, CountUp on the count, poster land, "Show more", hover and scrub. In addition:
- The Delete dialog opens and closes per `Dialog` (§7.3), with pending shown by the in-button `BayerSpinner`.
- The removed row is a **cut** (Convex reactivity). There is no exit animation, because holding a deleted row on screen would misstate storage.
- The INFO chyron resolves in over 160 ms (§6.10).
- Reduced motion: everything is instant; the BayerSpinner is a static glyph.

#### 11.B.8 Accessibility

- **Headings:** `h1` 'Recordings' → one `h2` per row, which is also the `article`'s name. `headingLevel` changes only the route heading (§11.A.8).
- **Plates:** plates form a `<dl>`, so each label is programmatically tied to its value.
- **Buttons:**
  - 'Download' and 'Delete' keep their visible names, and `aria-describedby` points to the row title (id from `useId()`).
  - The Delete button is `variant="danger"`: an outline with `text-danger` measures 6.50:1 dark and 6.28:1 light on panel (§5.6), which fixes R6.
- **ConfirmDialog:**
  - `role="dialog"` with native focus trap. The initial focus is **"Keep recording"**, the safe action.
  - The destructive button is never the default.
  - While pending, `aria-busy="true"` is on the dialog, and the confirm button keeps focus (never native `disabled`).
- **Focus after delete:** §11.B.5.
- **Announcements:** `announce('Recording deleted')`; download success "Saved `recording-<id>.<ext>`" (the real file name).
- **Selection:** title and plates are selectable.
- **Targets:** buttons are 28 px (sm), 44 px on coarse pointers.

#### 11.B.9 Preserved contract

| ID | How §11.B satisfies it |
|---|---|
| DI-3, SH-5 | Gate and `<ConvexNotConfigured feature="recordings" />` kept literally |
| DI-4, ST-4 | `useQuery(api.recordings.list, { limit: 100 })` and `useMutation(api.recordings.remove)` called as `remove({ recordingId })`, now awaited |
| DI-8, ST-3, SH-7 | Newest first; index 0 row carries `.pixel-card-latest` + NEW lamp |
| DI-10 | `title ?? <model-based label>`; Duration plate uses `hms()` (= `formatDuration`, h/m/s); Size uses `bytes(n, { gb: true })` (= this page's `formatBytes`, KB/MB/GB) |
| DI-11 | Confirmation required for every delete; title 'Delete this recording permanently?' unchanged; permanence unchanged (`convex/recordings.ts:39-48` untouched) |
| DI-12 | Empty body keeps 'Use “Record” on the Director player, then “Stop & save recording”' byte-for-byte |
| DI-1, DI-13–DI-18, ST-1/2/5, SH-1/6 | As §11.A.9 |

> Note: the `MM:SS` media-duration format (§5 typography) applies to the screen's HUD plate. The Duration **plate** keeps `formatDuration` semantics, because DI-10 requires it.

**String ledger** (`app/admin/recordings/page.tsx` at 845147c). Every row whose "After" differs is a D6-listed change; nothing else changes:

| String | After |
|---|---|
| 'Recordings' (`:34`, h3) | `h1` (same text) |
| `` `${n} recordings` `` / 'Loading…' (`:37`) | Meta `{n} recordings · {bytes}` (`1 recording` when n = 1; ` · latest 100` at 100); 'Loading…' removed (skeleton + sr-only "Loading recordings") |
| 'No recordings yet' (`:46`) | Slate title (same) |
| 'Use “Record” on the Director player, then “Stop &amp; save recording”' (`:47`) | Slate body (same rendered text) |
| 'Media unavailable' (`:64`) | Screen caption (same) |
| `` recording.title ?? `${recording.model} recording` `` (`:72`) | `title ?? '{Model} session · Sep 24, 21:04'` (D6, listed) |
| `toLocaleString()` (`:76`) | Visible `stamp()`; full value in `title` |
| 'Duration', 'Size', 'Session' (`:81`, `:85`, `:95`) | Plate labels (same text; authored-case unchanged, `label` style adds no `text-transform`) |
| 'Type' (`:89`) + raw MIME (`:91`) | **'Format'** + `formatMime()`; raw MIME stays in `title` (D6, listed) |
| `` `${sessionId.slice(0, 8)}…` `` / '—' (`:97`) | Session plate (same), same `title` |
| 'Download' (`:110`), `download="recording-${id}.webm"` (`:106`) | 'Download'; file `recording-${id}.${extFromMime(mimeType)}` |
| 'Delete' (`:120`), `confirm('Delete this recording permanently?')` (`:115`) | 'Delete'; ConfirmDialog title (same string) |

**New strings:** 'Format', 'Director session · {stamp}', 'The video file is removed from Convex storage. This cannot be undone.', 'Delete permanently', 'Deleting…', 'Keep recording', "Couldn't delete the recording.", 'Recording deleted', 'Loading recordings', 'NO TAPE', plus the shared strings from §11.A.9.

#### 11.B.10 Acceptance criteria

**How to run.** Run modes are §1.6's: browser items run in **dev** (unconfigured) on `/admin/recordings?noboot`, or in **fixture** mode (dev at `/admin/visual-test?noboot#recordings-visual-test`; never on prod, where the route is 404), unless a line says otherwise. Commands whose paths start with `dashboard/` or `docs/`, and `git` commands with such pathspecs, run from the repository root; every other command runs from `dashboard/`.

**Contract and gates**
- [ ] `git diff --stat 845147c -- dashboard/convex/recordings.ts` prints nothing; `grep -n "useQuery(api.recordings.list, { limit: 100 })" dashboard/components/media/useRecordings.ts` and `grep -n "remove({ recordingId" dashboard/components/media/useRecordings.ts` each print one line.
- [ ] `grep -rnE '\bconfirm\(|PixelCard|console\.|fal-red|\.webm' dashboard/app/admin/recordings dashboard/components/media --exclude=fixtures.ts` prints nothing (the extension comes only from `extFromMime` in `lib/format.ts`).
- [ ] `/admin/recordings` First Load JS minus shared is ≤ 45 kB.

**Fixture e2e (`tests/recordings.spec.ts`, `#recordings-visual-test`, 1440×900, both themes)**
- [ ] The fixture list (30 rows: a webm row and an mp4 row on the §11.0 testcard files with their real `sizeBytes`, a `url: null` row, a `sizeBytes: 1_610_612_736` row whose `url` is the webm testcard, and a row with `sessionId` absent) renders 24 `[data-testid=recording-row]`; the first has class `pixel-card-latest`; `section#recordings-visual-test canvas` count is 0.
- [ ] Plate text: the 1.5 GiB row's Size is `1.50 GB`; a row with `durationSeconds: 3723` shows Duration `1h 2m 3s` and a screen HUD `01:02:03`; the webm row's Format is `WebM · VP9` with `title="video/webm;codecs=vp9,opus"`; the row without a session shows '—'. The row with `url: null` shows 'Media unavailable' and has no `[data-testid=recording-download]`.
- [ ] A fixture row with `title: undefined, model: 'director', createdAt: Date.UTC(2026, 8, 24, 21, 4)`, rendered under `timezoneId: 'UTC'`, has `h2` text `Director session · Sep 24, 21:04`.
- [ ] Download on the mp4 row fires a `download` with `suggestedFilename() === 'recording-<id>.mp4'`, and on the webm row `…webm`. During the fetch (fixture route delayed 500 ms), the button has `aria-busy="true"`, contains 'Downloading…', and its width equals its idle width ± 0.5 px.
- [ ] Large file: with `Response.prototype.blob` wrapped to count calls, and `window.showSaveFilePicker` stubbed through `page.addInitScript` to return a handle whose `createWritable()` resolves to a byte-counting `WritableStream`, Download on the 1.5 GiB row ends with the button containing 'Saved', the stream received ≥ 1 byte, and `blob` was called 0 times. With `showSaveFilePicker` deleted instead, the same click shows the chyron body 'Large file: open it in a new tab and save it from there.', issues no request with `request.resourceType() === 'fetch'` after the click (the poster `<video>` may still load the same testcard file as `media`), and `blob` is still called 0 times.
- [ ] Delete opens a dialog titled exactly 'Delete this recording permanently?' with buttons 'Keep recording' (focused) and 'Delete permanently'. With the fixture `remove` resolving after 400 ms, the confirm button shows 'Deleting…' with `aria-busy="true"`, Esc does not close the dialog while pending, then the row is gone, a `role="status"` chyron reads 'Recording deleted', and `document.activeElement` is the next row's Download. Pressing 'Keep recording' on another row's dialog closes it and returns focus to that row's Delete. With `remove` rejecting 'Authentication required', the dialog stays open with a `role="alert"` containing "Couldn't delete the recording." and 'Authentication required', and the row remains.
- [ ] The fixture `auth`, `empty`, `offline` and `loading` bodies show `NO ACCESS`; `NO TAPE` + 'No recordings yet' + the preserved sentence exactly; `NO CARRIER`; "Loading recordings" as `role="status"`.
- [ ] Axe: 0 serious or critical violations in both themes; one `h1`.

**Unconfigured e2e**
- [ ] `/admin/recordings` shows `h1` 'Recordings', kicker `NOT PATCHED`, and the text `Set NEXT_PUBLIC_CONVEX_URL to enable recordings. Run npx convex dev in dashboard/ to create a deployment.`; `document.title === 'Recordings · stream.wzrd.tech admin'`; no `video` or `canvas` in `main`; console clean per §1.6.

**Configured QA** (Human operator only, §1.6 step 6, on existing recordings of a configured deployment; recorded under Verification)
- [ ] CORS first: `curl -sI -H 'Origin: https://stream.wzrd.tech' "<a recording url>" | grep -i '^access-control-allow-origin'` prints `*` or the origin. If it prints nothing, record "fallback-only download" in the PR (the §17.4 follow-up); the fallback chyron is then the expected result, and the file-name items below are N/A.
- [ ] A recording whose stored `mimeType` starts with `video/mp4` saves `.mp4`, and one with `video/webm` saves `.webm` (the Format plate's `title` shows the stored `mimeType`); the admin tab never navigates away; the viewer shows a finite duration for a Chromium WebM of at most 64 MiB after `fixInfiniteDuration`, and the stored duration in the description above 64 MiB.

#### 11.B.11 Cut order

1. The optional 8-frame filmstrip seek row from the bible: **not built** unless every §11.B.10 item passes first. It needs canvas frame extraction, which requires CORS-clean media (unverified for Convex storage).
2. CountUp on the count.
3. Hover-scrub on the row poster (the viewer remains).
4. The total-size meta (keep `{n} recordings`).

**Never cut:** the download with the correct extension (a Blob up to 256 MiB, the save dialog above), ConfirmDialog with pending, failure alert and focus return, NO ACCESS before empty, the skeleton, and `.pixel-card-latest`.

---

### 11.C Twitch Analytics: "Meter bridge" (`/admin/analytics`)

#### 11.C.1 Goal & hero interaction

**Goal.**
- **One glance answers three questions:** are we live, since when, and is this data fresh? The 56 px ON-AIR strip carries:
  - a `TallyLight` that is **LIVE** (program red, public), **OFFLINE** (standby), **NOT PATCHED** (amber, never red), **ERROR** (red outline) or **STALE** (grey hatch);
  - the channel identity;
  - a ticking uptime in `timecode`;
  - a FreshnessStamp;
  - a Refresh key with a real pending state.
- **Numbers that settle, not dance.** KPI StatTiles use `readout-lg` and monochrome icons. CountUp runs on first reveal only, and a 30 s poll only snaps the values.
- **One effect, calmly.** The dither-kit AreaChart is Analytics' **one effect slot**. It runs with `animate={false}` and memoised rows, so a poll tweens the line instead of replaying the 900 ms sweep. It is wrapped in `ChartFigure` with a summary, an sr-only table and a keyboard crosshair.
- **Honest configuration.** A 503 from `/api/twitch` shows NOT PATCHED with the server sentence verbatim. It no longer shows a red OFFLINE pill and 'Collecting samples…' forever.
- **Station feel when dark.** When configured and offline, the stream rail plays `<BrandVideo id="motion/coast-standby-loop" />`, and shows the poster under reduced motion.

**Hero interaction: "glance and trust".** The operator opens the page during a show. The strip reads `[LIVE] 510coast · twitch.tv/510coast · UPTIME 01:12:44 · Updated 4s ago`. KPIs count up once to `1,284` viewers. Thirty seconds later the viewer tile snaps to `1,301`, the chart's line eases to the new point without re-sweeping, and "Updated" resets. Tabbing to the chart and pressing ← walks the crosshair: the readout below says `21:04 · 1,610 viewers`, and a screen reader hears the same through `aria-valuetext`.

#### 11.C.2 Files

**Create**

| Path | Purpose | PR |
|---|---|---|
| `components/analytics/useTwitchAnalytics.ts` | The poll, local samples and state (§11.C.5); replaces `app/admin/analytics/page.tsx:86-116` | 11C |
| `components/analytics/ConvexHistory.tsx` | Moved from `app/admin/analytics/page.tsx:50-84` **byte-identical in behaviour** (same hooks, args, `lastRecordedRef`, the existing `console.error` on a failed `record`) | 11C |
| `components/analytics/lampState.ts` | Pure `lampState()` and `bodyState()` (unit-tested) | 11C |
| `components/analytics/AnalyticsView.tsx` | Presentational root (props: the hook's state + `samples` + `chartTitle` + `headingLevel?: 1 \| 2`, as §11.A.8) | 11C |
| `components/analytics/OnAirStrip.tsx`, `OnAirLamp.tsx`, `UptimeReadout.tsx`, `StreamRail.tsx` | §11.C.5 | 11C |
| `components/charts/ChartFigure.tsx` | Accessible chart wrapper (§11.C.5) | 11C |
| `components/charts/ChartStatic.tsx` | Static inline-SVG fallback when the effect slot is not granted | 11C |
| `components/charts/chartData.ts` | Pure `toRows`, `rowsSignature`, `downsample(rows, 48)`, `summarize`, `xTick`, `yTick` (unit-tested; used by `ViewerChart` and `ChartFigure`) | 11C |
| `tests/helpers/twitch.ts` | `twitchBody()` and route helpers for the mocked-API e2e; images are the same-origin §11.0 fixture files (§11.C.10) | 11C |
| `components/analytics/fixtures.ts`, `AnalyticsVisualFixture.tsx` | Fixture states (live, offline, not configured, no access (401), error, stale, followers null, a 60-character category, fewer than 2 samples) and `VIEWER_SERIES_24H` (2880 samples; latest 1,284, peak 1,610 at 21:04 UTC, live average 902). Thumbnail and avatar are the same-origin §11.0 files. `AnalyticsVisualFixture` renders its own `<section id="analytics-visual-test">`, with `AnalyticsView` at `headingLevel={2}` | 11C |
| `components/states/skeletons/AnalyticsSkeleton.tsx` | §11.C.6 | 11C |
| `app/styles/analytics.css` | `.an-*`, `.chart-*` rules. The file holds only `@layer components { … }` (§5.1). 11C adds its `@import` line at its §5.1 position | 11C |
| `public/fixtures/testcard-thumb.jpg`, `public/fixtures/testcard-avatar.png` | §11.0 commands | 11C |
| `tests/analytics.spec.ts`, `tests/unit/{lamp-state,chart-data}.spec.ts` | Specs | 11C |

**Change**

| Path | Change | PR |
|---|---|---|
| `app/admin/analytics/page.tsx` | Container: `useConvexEnabled()`, `useTwitchAnalytics()`, `{convexEnabled && <ConvexHistory latest={tw.data} onHistory={setPersistedSamples} />}`, the `samples` rule and the title switch, then `<AnalyticsView/>` | 11C |
| `app/admin/analytics/loading.tsx` | Swap `RouteSkeleton` for `AnalyticsSkeleton` (the file is created in 4D; shape and caption: §6.3). The route title is §7.7's, 4B | 11C |
| `app/globals.css` | Add `@import './styles/analytics.css';` at its §5.1 position | 11C |
| `app/admin/visual-test/page.tsx` | Add the `AnalyticsVisualFixture` import and element at their §10.5.9 positions (§10 owns the file) | 11C |
| `components/ViewerChart.tsx` | Rewritten on `ChartFigure`; keeps `export interface ViewerSample` (`:11-15`) and the default export with props `{ samples, title = 'Viewers Over Time' }` | 11C |
| `components/broadcast/TallyLight.tsx` | `fault` and `stale` kinds per §7.4 (landed in 11A) | — |
| `app/styles/components.css` | Delete the three `.connection-*` shims (§5.18) in the same PR that removes their only call site (`app/admin/analytics/page.tsx:146-147`), per ST-3/SH-7 | 11C |

**Delete:** `components/states/skeletons/RouteSkeleton.tsx` (§7.5). This PR swaps its last user, `app/admin/analytics/loading.tsx`, to `AnalyticsSkeleton`.

`StatTile` needs no change: it already renders `<dt>`/`<dd>` inside the `<dl>` (§7.4).

**Never touch:** `app/api/twitch/route.ts`, `convex/twitchStats.ts`, `components/dither-kit/*`, `dither-kit.json`.

#### 11.C.3 Before

Baseline: `docs/redesign/baseline/admin_analytics-dark.jpg`. It shows a 'Twitch' / 'Not configured' header, a red `OFFLINE` pill, a red error line reading 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured', and four '—' tiles. The 'Current viewers' chip is untinted. The chart panel reads 'Viewers (this session)' and '0 samples', with 'Collecting samples…' that will never resolve.

| # | Defect | Evidence |
|---|---|---|
| A1 | **Undefined colour.** `bg-fal-purple-500/10 text-fal-purple-500` and `text-fal-purple-500` reference a colour the config never defines. `node -e` over the resolved config shows no `fal-purple` key, and the nested `fal` object has no `purple`. The hero KPI chip and the chart icon render untinted | `app/admin/analytics/page.tsx:177`; `components/ViewerChart.tsx:44` |
| A2 | **Conflated states.** On 503 the subtitle says 'Not configured' but the pill says red 'OFFLINE'. KPIs show '—' and the chart shows 'Collecting samples…' forever. After a transient error, stale data stays with no age shown | `app/admin/analytics/page.tsx:140`, `:145-152`; `components/ViewerChart.tsx:68-70`; `app/api/twitch/route.ts:78-86` |
| A3 | **Chart replays every 30 s.** A new samples array per poll bumps the kit revision, and the canvas resets its 900 ms reveal. `config` is a fresh object per render, which rebuilds the context | `app/admin/analytics/page.tsx:102-104`; `components/ViewerChart.tsx:57`; `components/dither-kit/chart-context.tsx:165-173`; `components/dither-kit/cartesian-canvas.tsx:131-135` |
| A4 | **Inaccessible chart.** The front SVG is `role="img" aria-label="Chart"`, not overridable. There is no table or summary, and scrubbing is pointer-only | `components/dither-kit/cartesian-root.tsx:151`, `:177-178` |
| A5 | **Contrast and hover.** LIVE 3.03:1 and OFFLINE 2.52:1 in dark (no `.dark` overrides). The Refresh button has no dark hover (`hover:bg-… dark:bg-…` ordering), no pending state, and can be spammed | `app/globals.css:217-223`; `app/admin/analytics/page.tsx:153-159`, `:155` |
| A6 | **Signal-free KPIs.** Formatting is inconsistent (`String(viewerCount)` vs `toLocaleString`), Category does not truncate, and red Heart duplicates the error hue | `app/admin/analytics/page.tsx:172-197`, `:176`, `:182`, `:194` |
| A7 | **Axes.** YAxis produces fractional viewer ticks (0.2, 0.4); XAxis is `HH:MM` only across 24 h | `components/ViewerChart.tsx:26`, `:61-62` |
| A8 | **Thumbnail hard swap** on every poll (`?t=capturedAt`), shown only in a live-only card | `app/admin/analytics/page.tsx:200-220`, `:206` |
| A9 | **No heading.** The channel name is a `div`; the only h1 is the global "Stream Admin" | `app/admin/analytics/page.tsx:136`; `app/layout.tsx:51` |

#### 11.C.4 Layout spec

```css
.an-root { width: 100%; max-width: 1440px; margin-inline: auto; display: grid; gap: 16px;
  padding: calc(24px + var(--h-offline)) var(--gutter) 48px; }
.an-strip { min-height: 56px; display: flex; flex-wrap: wrap; align-items: center; column-gap: 16px; row-gap: 8px;
  padding: 8px 12px; }                                   /* Panel tone="panel" */
.an-kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
@media (min-width: 1024px) { .an-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; } }
.an-main { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
@media (min-width: 1280px) { .an-main { grid-template-columns: minmax(0, 1fr) 320px; } }
.chart-plot { position: relative; height: 240px; }
@media (max-width: 767px) { .chart-plot { height: 200px; } }
.chart-plot svg g.fill-current { color: rgb(var(--c-text-3)); }   /* kit axis text; (0,2,2) beats the kit's .dark\:text-gray-400 (0,2,0) */
```

**ON-AIR strip** (left to right; ≥ 768 one row, 56 px):

| Slot | Content | Size |
|---|---|---|
| Lamp | `<OnAirLamp>` → `TallyLight size="md"` (§11.C.5) | 20 px tall |
| Identity | Avatar 32×32 `rounded-sm sq` (`<img alt="">` from `profileImageUrl`, else a `ramp-1` 25% Bayer square); name `h2` `title-sm` `text-fg` truncate (`data?.user?.displayName ?? data?.channel ?? 'Twitch'`); below it `code` `text-fg-3`: `twitch.tv/{channel}` as `<a href="https://twitch.tv/{channel}" target="_blank" rel="noopener noreferrer">` with `ExternalLink` 12 px, or 'Not configured', or 'Unavailable' | `flex-1 min-w-0` |
| Uptime | `label` `UPTIME` `text-fg-3` + `timecode` 28/32 `.nums` `min-w-[8ch]` | 32 px |
| Freshness | `<FreshnessStamp at={lastOkAt} staleAfterMs={60000}/>` (hidden before the first success) | — |
| Refresh | `Button variant="secondary" size="sm" icon={RefreshCw}` 'Refresh' | 28 px |

The bible's "name and title" for the strip is met by the channel name and `twitch.tv/{channel}`. The stream title lives in the rail under the preserved 'Stream title' label, so the 56 px strip stays one row.

Below 768 the strip wraps into two rows: [lamp · identity · Refresh] and [uptime · freshness], 96 px total.

**KPI row:** a `<dl class="an-kpis">` of 4 `StatTile`s, each at least 96 px tall (§11.C.5).

**Main:** `ChartFigure` (Panel `as="figure"`, padding 16). It contains a header row (22), a 4 px gap, the summary (16), a 12 px gap, `.chart-plot` (240), an 8 px gap and the readout (16), so it is 350 px tall at ≥ 768. The `StreamRail` sits at 320 px from 1280 (xl). At 1024–1279 the rail drops under the chart as a 2-column panel (screen 320 + text). Below 1024 it stacks.

```text
1440 × 900 · gutter 32 · content 1376
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CommandBar 48 (§7.8)                                                                             │ 48
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INSIGHTS                                                                                         │
│ Twitch Analytics                                                                                 │ PageHeader 60
│                                                                                                  │
│┌────────────────────────────────────────────────────────────────────────────────────────────────┐│ ON-AIR strip 56 (section 'On-air status')
││[█ LIVE ] [av] 510coast                UPTIME 01:12:44     [●] Updated 4s ago     [↻ Refresh]   ││
││               twitch.tv/510coast ↗                                                             ││
│└────────────────────────────────────────────────────────────────────────────────────────────────┘│
│┌─ Current viewers ───┐  ┌─ Followers ─────────┐  ┌─ Uptime ────────────┐  ┌─ Category ──────────┐│ KPI <dl>, 4 × 332, min-height 96
││[eye]  1,284   ╱╲╱‾  │  │[heart]  48,112      │  │[clock]  1h 12m      │  │[pad]  Just Chatting ││
│└─────────────────────┘  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘│
│┌─ Viewers (last 24h, Convex) ───────────────────────────── Last 23.9h ─┐  ┌─ stream rail 320 ───┐│ ChartFigure 350 · rail from 1280 (xl)
││Now 1,284 viewers · peak 1,610 at 21:04 · average 902                  │  │┌ 304×171 ──────────┐││ summary
││┌ plot 240 · role=slider · tabindex 0 ───────────────────────────────┐ │  ││ Stream preview    │││ .chart-plot 240
│││ ░▒▓ dither area (kit AreaChart, blue, aura while hovered/focused)  │ │  │└───────────────────┘││
│││ 18:00       19:00       20:00       21:00       Sep 25             │ │  │Stream title         ││
││└────────────────────────────────────────────────────────────────────┘ │  │Late-night market…   ││
││21:04 · 1,610 viewers                                                  │  │Started Sep 24, 19:52││ readout (aria-hidden; slider valuetext)
│└───────────────────────────────────────────────────────────────────────┘  └─────────────────────┘│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ StatusRail 24                                                                                    │ 24
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

390 × 844 · gutter 16 · content 358
┌────────────────────────────────────┐
│ WZRD.tech            [AIR] [⌕] [◐] │ 48
│ Live Control  Shotboard  Charac… › │ 44 nav row
├────────────────────────────────────┤
│ INSIGHTS                           │
│ Twitch Analytics                   │
│┌──────────────────────────────────┐│ strip wraps: 2 rows, 96
││[█ LIVE] [av] 510coast [↻ Refresh]││
││UPTIME 01:12:44  Updated 4s ago   ││
│└──────────────────────────────────┘│
│┌────────────────┐┌────────────────┐│ KPI 2 × 2
││Current viewers ││Followers       ││
││1,284           ││48,112          ││
│└────────────────┘└────────────────┘│
│┌────────────────┐┌────────────────┐│
││Uptime          ││Category        ││
││1h 12m          ││Just Chatting   ││
│└────────────────┘└────────────────┘│
│┌─ Viewers (this session) ─────────┐│ ChartFigure, plot 200
││Now 1,284 viewers · peak 1,610…   ││
││[ plot 200 ]                      ││
││21:04 · 1,610 viewers             ││
│└──────────────────────────────────┘│
│┌─ stream rail ────────────────────┐│ rail stacks below 1024
││[ 16:9 screen, full width ]       ││
││Stream title · Started …          ││
│└──────────────────────────────────┘│
└────────────────────────────────────┘
```

#### 11.C.5 Component tree

```text
app/admin/analytics/page.tsx ('use client')
└─ AnalyticsPage
   ├─ const convexEnabled = useConvexEnabled()
   ├─ const tw = useTwitchAnalytics()
   ├─ const [persistedSamples, setPersistedSamples] = useState<ViewerSample[] | null>(null)
   ├─ {convexEnabled && <ConvexHistory latest={tw.data} onHistory={setPersistedSamples} />}       // DI-3, analytics/page.tsx:122
   ├─ const samples = persistedSamples && persistedSamples.length > 1 ? persistedSamples : tw.localSamples   // DI-5, :118
   ├─ const chartTitle = persistedSamples && persistedSamples.length > 1 ? 'Viewers (last 24h, Convex)' : 'Viewers (this session)'  // ST-7, :224
   └─ <AnalyticsView tw={tw} samples={samples} chartTitle={chartTitle} />
AnalyticsView (div.an-root)
├─ PageHeader eyebrow="INSIGHTS" title="Twitch Analytics" titleAs={headingLevel === 2 ? 'h2' : 'h1'}
├─ section.an-strip[aria-label="On-air status"] (Panel)
│  ├─ OnAirLamp            (leaf; useSecondClock for STALE; data-testid=onair-tally)
│  ├─ identity (h2 name, code link/subtitle)
│  ├─ UptimeReadout        (leaf; useSecondClock; tc((now − Date.parse(data.startedAt)) / 1000) when data.isLive && data.startedAt, else '--:--:--')
│  ├─ FreshnessStamp at={lastOkAt} staleAfterMs={60000}
│  └─ Button "Refresh" (data-testid=onair-refresh)
├─ InlineBanner tone="danger" kicker="ERROR" role="alert"   when data && error && error.status !== 503 && error.status !== 401   (server message verbatim)
└─ body by bodyState():
   ├─ 'loading'        → AnalyticsSkeleton.Body
   ├─ 'not-configured' → <Slate kind="not-configured" size="panel" title="Twitch is not configured" body={error.message}/>
   ├─ 'auth'           → <AuthRequired size="panel"/> + <code className="text-code text-fg-2">{error.message}</code>   (server text verbatim, DI-5)
   ├─ 'offline'        → <Slate kind="offline" size="panel" …/>
   ├─ 'error'          → <Slate kind="error" size="panel" title="Twitch data unavailable" body={error.message} actions={Retry → refresh()}/>
   └─ 'ready'
      ├─ section[aria-labelledby → its h2; kpiId = useId()] > h2#{kpiId}.sr-only "Channel stats" > dl.an-kpis > StatTile × 4
      └─ div.an-main > ViewerChart samples title={chartTitle} · StreamRail
```

`UptimeReadout`'s `now` is `useSecondClock()`; while it is `null` (server render and hydration) the readout is `'--:--:--'`. `TwitchAnalytics.startedAt` is an ISO string and `tc()` takes seconds (§5.20.4).

**`useTwitchAnalytics()`** (`components/analytics/useTwitchAnalytics.ts`):

```ts
export const POLL_MS = 30_000                                   // DI-5
export interface TwitchPollError { message: string; status: number | null }   // null = network or parse failure
export interface TwitchState {
  data: TwitchAnalytics | null; error: TwitchPollError | null
  loading: boolean              // true until the first poll settles (today's `loading`, :90)
  lastOkAt: number | null       // Date.now() at the last successful poll
  refreshing: boolean           // a manual refresh is pending
  localSamples: ViewerSample[]  // ≤ 240 (DI-5)
  refresh(): Promise<void>
}
async function pollOnce(): Promise<TwitchAnalytics> {
  const res = await fetch('/api/twitch', { cache: 'no-store' })          // DI-5, byte-identical call
  const text = await res.text()
  let body: (Partial<TwitchAnalytics> & { error?: string }) | null
  try { body = JSON.parse(text) } catch { body = null }
  if (!res.ok || body === null)
    throw new TwitchPollErrorImpl(body?.error ?? (text.trim().slice(0, 200) || `HTTP ${res.status}`), res.status)
  return body as TwitchAnalytics
}
```

- **Success:** `setData(next)`, `setError(null)`, `setLastOkAt(Date.now())`, then `setLocalSamples(prev => [...prev, { capturedAt, viewerCount, isLive }].slice(-240))`. This is the `:102-104` expression unchanged.
- **Failure:** `setError({ message, status })`, where `status` is `null` for `TypeError` (network). `data` is kept. `finally setLoading(false)`.
- **Interval:** `useEffect(() => { void run(); const id = setInterval(run, POLL_MS); return () => clearInterval(id) }, [])`.
- **In-flight guard:** `run` shares one in-flight promise. A tick that finds a poll in flight awaits that promise instead of issuing a second request. `refresh()` sets `refreshing` until the shared promise settles.
- A non-JSON body (for example the middleware's plain-text 401, `middleware.ts:44`) now surfaces **verbatim**. Today the page shows a JSON parse error instead.

**Lamp and body precedence** (`components/analytics/lampState.ts`):

```ts
export type Lamp = 'loading' | 'not-patched' | 'error' | 'stale' | 'live' | 'offline'
export function lampState(s: Pick<TwitchState,'data'|'error'|'lastOkAt'>, now: number): Lamp {
  if (s.error?.status === 503) return 'not-patched'
  if (!s.data) return s.error ? 'error' : 'loading'
  if (s.lastOkAt !== null && now - s.lastOkAt > 2 * POLL_MS) return 'stale'
  return s.data.isLive ? 'live' : 'offline'
}
export type Body = 'loading' | 'not-configured' | 'auth' | 'offline' | 'error' | 'ready'
export function bodyState(s: Pick<TwitchState,'data'|'error'>, online: boolean): Body {
  if (s.error?.status === 503) return 'not-configured'
  if (s.error?.status === 401) return 'auth'            // the edge gate's plain-text 401 (middleware.ts:44, :51): an Access problem, not a Twitch one
  if (!s.data && !online) return 'offline'
  if (!s.data && s.error) return 'error'
  if (!s.data) return 'loading'
  return 'ready'
}
```

| Lamp | TallyLight | Label | srLabel | Announce (polite, on change after the first settled state) |
|---|---|---|---|---|
| live | `kind="program" lit` | `LIVE` | "Live on Twitch" | "Twitch channel is live" |
| offline | `kind="standby" lit` | `OFFLINE` | "Offline" | "Twitch channel is offline" |
| not-patched | `kind="cue" lit` (amber ring, steady) | `NOT PATCHED` | "Twitch not configured" | "Twitch is not configured" |
| error | `kind="fault" lit` | `ERROR` | "Twitch data unavailable" | "Twitch data unavailable" |
| stale | `kind="stale" lit` | `STALE` | "Twitch data stale" | "Twitch data is stale" |
| loading | `<Skeleton shape="block" w={88} h={20}/>` | — | — | — |

The root carries `data-testid="onair-tally"` and `data-state={lamp}` (TallyLight spreads `data-*` onto its root, §7.4). `lampState` is unchanged by a 401: without data it is `error`.

> Note: `fault` and `stale` are §7.4's steady error and stale faces (11A); neither animates, because §6.1 law 4 reserves blinking for the ingest lamp. Clips also uses `fault` for FAILED.

**KPI StatTiles** (in `<dl>`; icons 16 px `text-fg-2`, never tinted, which removes both `fal-purple-500` usages):

| `data-testid` | label | icon | value | format | trend | countUp |
|---|---|---|---|---|---|---|
| `kpi-viewers` | 'Current viewers' | Eye | `data.viewerCount` → `toLocaleString('en-US')` | int | last 60 `samples` (`isLive ? viewerCount : 0`), shown when ≥ 2 | yes |
| `kpi-followers` | 'Followers' | Heart | `followerCount` → `toLocaleString('en-US')`, '—' when null | int | — | yes |
| `kpi-uptime` | 'Uptime' | Clock | `uptime(data.uptimeSeconds)` | text | — | no |
| `kpi-category` | 'Category' | Gamepad2 | `gameName ?? '—'`, `truncate`, `title` = full | text | — | no |

For viewers and followers, `format="int"` means `(n) => n.toLocaleString('en-US')`, both for the static value and as CountUp's `format` (§12.3.14): viewers `1284` → `1,284` and followers pinned to en-US grouping (both D6, listed in §11.C.9).

CountUp runs once, when a tile first receives a number (a `revealed` ref), for 600 ms at 12 fps via the ticker (§12). After that, values snap. Every tile reads '—' until `data` exists.

**`ViewerChart`** (`components/ViewerChart.tsx`):

```tsx
const VIEWERS_CONFIG = { viewers: { label: 'Viewers', color: 'blue' } } satisfies ChartConfig   // module level; ChartConfig.color takes DitherColor names (chart-context.tsx:23)
export interface ViewerSample { capturedAt: number; viewerCount: number; isLive: boolean }   // DI-6, unchanged
export default function ViewerChart({ samples, title = 'Viewers Over Time' }: ViewerChartProps) {
  const sig = rowsSignature(samples)   // `${n}|${first.capturedAt}|${last.capturedAt}|${last.viewerCount}|${last.isLive}`, '0' when empty
  const rows = useMemo(() => toRows(samples),   // { t: capturedAt, viewers: isLive ? viewerCount : 0, live: isLive }[]
    [sig])                                        // eslint-disable-line react-hooks/exhaustive-deps -- identity follows content
  const granted = useEffectCanvasSlot('chart', 1, rows.length > 1)      // Analytics' one effect slot (docs/redesign/spec/07-primitives-and-shell.md §7.16)
  …
  <ChartFigure testId="viewer-chart" title={title} meta={span ? `Last ${span}` : `${samples.length} samples`}
    rows={rows} empty={<Slate kind="empty" kicker="NO DATA" art="analytics" size="panel" title="Collecting samples…"
                              body="The chart draws after the second poll, 30 s apart." />}
    plot={({ markerIndex, focused, onHoverChange }) => granted
      ? <AreaChart data={rows} config={VIEWERS_CONFIG} animate={false} bloom="aura" bloomOnHover hovered={focused}
          markerIndex={markerIndex} onHoverChange={onHoverChange} className="h-full w-full">
          <XAxis dataKey="t" tickFormatter={xTick} /><YAxis tickFormatter={yTick} /><Area dataKey="viewers" variant="gradient" />
        </AreaChart>
      : <ChartStatic rows={rows} markerIndex={markerIndex} />} />
}
```

- `span` is today's computation (`:32-37`), unchanged.
- `yTick = v => Number.isInteger(v) ? v.toLocaleString('en-US') : ''` fixes A7.
- `xTick(v, i)` returns `hhmm(v)`, or `day(v)` when the row `i − ceil(n / 8)` falls on another calendar day.
- The kit `Tooltip` is **not** used: it is a spring-animated floating card (`tooltip.tsx:45-60`) that ignores reduced motion. The readout replaces it.
- `ChartStatic` is an inline SVG of the same rows:
  - area filled `rgb(var(--c-accent))` through an SVG `<pattern>` of the 25% Bayer tile;
  - 1.5 px `accent` polyline;
  - a 1 px `text-3` marker line at `markerIndex`;
  - no animation.

> Note: the bible's "memoised data signature" alone cannot stop the replay. Every poll appends a sample, so the signature changes every 30 s. `startCartesianLoop` captures `animate` **once** at loop start (`cartesian-canvas.tsx:64`; the loop restarts only on `[cols, rows]`, `:372`) and resets the reveal on every revision (`:131-135`). Passing `animate` only on first paint therefore does not work either. The spec sets `animate={false}` permanently: data changes tween through the kit's `EASE` (`:63`, `:146-166`), which is information moving. First appearance uses `.px-resolve` on the plot's keyed child (the system's only entrance grammar). The memo still prevents context rebuilds on unrelated re-renders.

**`ChartFigure`** (`components/charts/ChartFigure.tsx`):

```ts
interface ChartFigureProps {
  testId: string; title: string; meta: string
  rows: { t: number; viewers: number; live: boolean }[]
  empty: React.ReactNode                                             // rendered when rows.length < 2
  plot: (p: { markerIndex: number | null; focused: boolean; onHoverChange: (i: number | null) => void }) => React.ReactNode
}
```

| Part | Spec |
|---|---|
| Root | `<figure data-testid aria-labelledby="{id}-t" aria-describedby="{id}-s">`, Panel material, where `id = useId()` |
| Header | `h2#{id}-t` `title` 16/22 (the title string verbatim) · right `readout` `text-fg-3` `meta` ('Last 23.9h' / '12 samples', preserved) |
| Summary | `p#{id}-s` `caption` `text-fg-2`: `Now {v} viewers · peak {p} at {hhmm} · average {a}` (live rows only; `a` rounded). When the latest row is off air, `Off air now · peak …`. With no live rows, `Off air for the whole window`. Numbers use `toLocaleString('en-US')` |
| Plot | `div.chart-plot` (mounted once) wrapping a child keyed by `rows.length > 1` that carries `.px-resolve`, so the resolve plays once when the empty state gives way to the plot and never on polls. While the plot shows, `div.chart-plot` has `role="slider"`, `tabIndex={0}`, `aria-label="{title} crosshair"`, `aria-valuemin={0}`, `aria-valuemax={n−1}`, `aria-valuenow={i}`, `aria-valuetext={readout}` |
| Keys | ←/→ ±1 · Shift+←/→ ±10 · Home/End · Esc clears the marker (back to latest). Keys set `markerIndex`; pointer moves report through `onHoverChange` into ChartFigure's own `hover` state; `focused` lifts the bloom (`hovered`). Any keydown also sets that `hover` state to `null` (the next pointer move sets it again), and any pointer move clears `markerIndex` |
| Readout | `p` `readout` `.nums` `text-fg`, `aria-hidden` (the slider's `aria-valuetext` carries it): `{hhmm} · {v} viewers`, or `{hhmm} · off air`. Its index is `hover ?? markerIndex ?? n − 1`, the kit's own precedence (live hover wins, `cartesian-canvas.tsx:190-192`), so the readout and the canvas crosshair agree. `aria-valuenow` is that same index |
| Table | `table.sr-only` with caption = title, columns Time / Viewers / Status (`Live` / `Off air`). At most **48** rows: evenly spaced indices `round(k × (n−1)/47)`, deduplicated, and always including the last row. Time is `stamp(t)` |
| Empty | `rows.length < 2` → `empty` inside the plot box (same height, no slider role). The box is `surface-inset rounded-sm`, and the panel-size Slate inside it adds no second translucent surface (§5 no-nesting rule) |

**`StreamRail`** (`section[data-testid=stream-rail]` labelled by its `h2.sr-only` "Stream preview" through `aria-labelledby`, id from `useId()`):
- **Live:** a `bg-screen rounded-screen` 16:9 box containing ``<img src={`${thumbnailUrl}?t=${capturedAt}`} alt="Stream preview">`` (DI-7). A new URL is preloaded with `new Image()` and swapped on `load` (a cut, no blank flash). Below it:
  - `label` 'Stream title' (preserved), then the title in `body-sm` `text-fg`, `line-clamp-3`, selectable;
  - `caption` `text-fg-3` `Started {stamp(startedAt)}`, with `toLocaleString()` in `title`.
- **Offline (configured):** `<BrandVideo id="motion/coast-standby-loop" />`. It plays only while visible and shows only the poster under reduced motion or the lock (§13.8). A `STAND BY` `PixelFace` kicker sits on a `surface-hud` plate at the top-left of the screen, and below the screen `body-sm` `text-fg-2` reads "twitch.tv/{channel} is offline."
- Not rendered in the `not-configured`, `auth`, `error`, `offline` or `loading` body states.

#### 11.C.6 States

| State | Lamp | Strip identity | Body | Exact copy |
|---|---|---|---|---|
| Route loading | — | — | `app/admin/analytics/loading.tsx` (§6.3): `RouteSkeleton` from 4D; from 11C `AnalyticsSkeleton` + `<CoastLoader size={64} label="Loading Twitch Analytics" />` right-aligned in the KPI row | "Loading Twitch Analytics" |
| First poll pending | Skeleton block | Name 'Twitch'; subtitle skeleton bar (sr-only "Loading…") | `AnalyticsSkeleton.Body` via `useDelayedFlag` (150/300) | sr-only `role="status"` "Loading Twitch Analytics" |
| Not configured (503) | NOT PATCHED | 'Twitch' / 'Not configured' (preserved) | `Slate kind="not-configured" size="panel"` (kicker NOT PATCHED, art `not-patched`) | Title "Twitch is not configured"; body = server `body.error` verbatim, for example 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured' or 'TWITCH_CHANNEL is not configured'. **No** 'Collecting samples…', **no** OFFLINE |
| No access (401 from the edge gate) | ERROR (without data; data-driven with data) | 'Twitch' / 'Unavailable' | `<AuthRequired size="panel" />` (kicker NO ACCESS), then the server text verbatim in a `code` line (DI-5). No Retry: reloading after signing in is the fix | §11.D.7 copy; the `code` line is, for example, 'Unauthorized: Cloudflare Access assertion missing' |
| Error, no data (404/502/network) | ERROR | 'Twitch' / 'Unavailable' | `Slate kind="error" size="panel"` (kicker SIGNAL LOST) with action `Button variant="secondary" icon={RotateCcw}` "Retry" → `refresh()` | Title "Twitch data unavailable"; body = message verbatim (for example 'Twitch channel "x" not found') |
| Offline, no data | ERROR (network) | 'Twitch' / 'Unavailable' | `Slate kind="offline" size="panel"` | §11.D.7 |
| Live | LIVE | name / `twitch.tv/{channel}` | KPIs, chart, rail (live) | — |
| Offline (configured) | OFFLINE | same | KPIs (viewers `0`, uptime '—', category '—'), chart, rail with standby loop | "twitch.tv/{channel} is offline." |
| Error with data | Data-driven (then STALE after 60 s) | same | Ready body + `InlineBanner tone="danger" kicker="ERROR"` with the message verbatim | server message |
| Stale | STALE | same | Ready body; FreshnessStamp turns `text-warning` with a warning LED (§7.4) | FreshnessStamp text per §7.4 |
| Fewer than 2 samples (configured) | per data | — | Chart box shows the NO DATA panel slate | Title 'Collecting samples…' (preserved); body "The chart draws after the second poll, 30 s apart." |
| Followers unavailable | — | — | `kpi-followers` value '—' | '—' |
| Refreshing | — | — | Refresh Button `pending={refreshing}` → `pendingLabel="Refreshing…"`, then `successLabel="Updated"` for 900 ms. When `refresh()` settles it sets `successSignal = Date.now()` on success and `errorSignal = Date.now()` on failure (§7.3) | 'Refresh' / 'Refreshing…' / 'Updated' |
| Air lock | Not reachable (§11.0) | | | |

`AnalyticsSkeleton` geometry: the real PageHeader, then the strip Panel (56 px) with an 88×20 lamp block, a 32×32 block and two text bars. Then 4 StatTile skeletons in `.an-kpis`, each 96 px with a 12 px bar, a 28 px bar and an optional 16 px bar. Then `.an-main` with the ChartFigure skeleton (22 + 16 bars, a 240 px `block`, a 16 px bar) and the rail (a `media` 16:9 block + 3 text lines).

#### 11.C.7 Motion

| Moment | Motion | Reduced motion |
|---|---|---|
| First reveal | Route enter `.px-resolve` (template); the plot's keyed child resolves once when the chart first appears | None |
| KPI values | CountUp 600 ms on first numeric value only; later polls snap | Final value |
| Chart data update | Kit `EASE` tween of the line/fill toward the new point (information moves); **no sweep** | Snap (kit `EASE = 1`) |
| Chart stars | Kit winks (the page's one effect slot) | Static (kit) |
| Chart bloom | Only while hovered or focused (`bloomOnHover`, `hovered={focused}`), 220 ms kit opacity | Same (opacity only) |
| Lamp change | TallyLight 160 ms resolve once | Cut |
| Uptime, freshness | Snap at 1 Hz (leaf re-renders only) | Same |
| Thumbnail | Preloaded swap, cut | Same |
| Standby loop | `BrandVideo` plays while visible | Poster |
| Refresh | Pending `BayerSpinner`, success LED 900 ms | Static glyph; colour-only success |

Nothing pulses. LIVE is steady (§6.1 law 4).

#### 11.C.8 Accessibility

- **Headings:**
  - `h1` 'Twitch Analytics' (the only h1).
  - `h2` channel name in the strip, the sr-only `h2` "Channel stats", and the chart `h2` (the title switch string).
  - The rail's sr-only `h2` "Stream preview".
  - `headingLevel` changes only the route heading (§11.A.8).
- **Landmarks:** the strip is `section aria-label="On-air status"`; the KPIs are a `<dl>` (`dt` label, `dd` value).
- **Status announcements:** exactly the §11.C.5 lamp table, through `announce()` (polite). Viewer counts and poll ticks are never announced. The error InlineBanner uses `role="alert"` and announces on insertion or text change only.
- **Chart:**
  - `role="slider"` with `aria-valuetext`.
  - The sr-only table covers ≤ 48 points.
  - The figure is described by the summary.
  - The kit's inner `role="img" aria-label="Chart"` is a presentational child of the slider.
  - Focus is a 2 px ring on `.chart-plot` (focus vs panel 9.65 dark / 7.94 light, §5.6).
- **Contrast:**
  - Axis text is `text-3` (5.80 dark / 5.98 light on panel, §5.6) via the `.chart-plot` override.
  - Lamp rings and labels follow §5.6 against the bezel: the NOT PATCHED cue ring 10.48:1; the PGM ring, which is also the `fault` ring and label colour, 5.40:1.
  - FreshnessStamp warning uses `text-warning` (10.14 dark / 6.28 light on panel, §5.6).
- **Links:** `twitch.tv/{channel}` opens in a new tab. Its accessible name is "twitch.tv/{channel} (opens in a new tab)", with the suffix in sr-only text.
- **Avatar:** `alt=""` (decorative; the name is text).
- **Targets:** Refresh is 28 px, 44 px coarse.

#### 11.C.9 Preserved contract

| ID | How §11.C satisfies it |
|---|---|
| DI-3 | Works without Convex (local samples); `ConvexHistory` mounted only when `convexEnabled` |
| DI-4 | `ConvexHistory` moved verbatim: `useMutation(api.twitchStats.record)` with the same fields and `?? undefined` coercions; `useQuery(api.twitchStats.history, latest ? { channel: latest.channel, sinceMs: latest.capturedAt - HISTORY_WINDOW_MS } : 'skip')` with the anchoring comment |
| DI-5, ST-7 | `fetch('/api/twitch', { cache: 'no-store' })` every `POLL_MS = 30_000`; `body.error` shown verbatim; `lastRecordedRef`; `.slice(-240)`; the persisted-vs-local rule; `HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000` |
| DI-6 | `ViewerSample` still exported from `components/ViewerChart`; `import type { TwitchAnalytics } from '@/app/api/twitch/route'`; route untouched |
| DI-7 | `` `${thumbnailUrl}?t=${capturedAt}` `` kept |
| DI-16, ST-5 | Kit consumed through props only: `AreaChart`, `Area`, `XAxis`, `YAxis`, `ChartConfig`; axis colour via an external CSS rule, not a kit edit |
| ST-3, SH-7 | `.connection-*` restyled out: the only call site (`analytics/page.tsx:146-147`) migrates to `TallyLight` in the same PR that deletes the classes |
| SH-3 | `app/api/twitch/route.ts` untouched; middleware untouched |
| DI-1, DI-13–DI-15, DI-17, DI-18 | As §11.A.9. The one existing `console.error('Failed to record twitch sample', e)` (`:76`) is kept byte-identical and fires only on a failed Convex write; no new `console.*` |

**String ledger** (`app/admin/analytics/page.tsx` and `components/ViewerChart.tsx` at 845147c). Every row whose "After" differs is a D6-listed change; nothing else changes:

| String | After |
|---|---|
| `data?.user?.displayName ?? data?.channel ?? 'Twitch'` (`:137`) | Strip `h2` (same expression) |
| `` `twitch.tv/${data.channel}` `` / 'Loading…' / 'Not configured' (`:140`) | Link (same text) / skeleton + sr-only 'Loading…' / 'Not configured' on 503; **'Unavailable'** for other errors without data (D6, listed) |
| 'LIVE' / 'OFFLINE' (`:151`) | Lamp labels (same); **new** 'NOT PATCHED', 'ERROR', 'STALE' |
| 'Refresh' (`:158`) | Button label (same); new 'Refreshing…', 'Updated' |
| Error text (`:165`) | Verbatim in the NOT PATCHED slate body, the NO ACCESS panel's `code` line, the error slate body or the InlineBanner |
| 'Current viewers', 'Followers', 'Uptime', 'Category' (`:175-193`) | StatTile labels (same) |
| `String(data.viewerCount)` (`:176`) | `toLocaleString('en-US')` (D6, listed: `1284` → `1,284`) |
| `data.followerCount.toLocaleString()` (`:182`) | `toLocaleString('en-US')` (D6, listed: grouping pinned to en-US instead of the browser locale) |
| '—' (`:176-194`) | Same |
| 'Stream preview' alt (`:207`) | Same alt; also the rail's sr-only h2 |
| 'Stream title' (`:212`) | Rail label (same) |
| `` `Started ${…toLocaleString()}` `` / '—' (`:215`) | `Started {stamp}`; full value in `title` |
| 'Viewers (last 24h, Convex)' / 'Viewers (this session)' (`:224`) | Chart `h2` (same switch) |
| 'Viewers Over Time' default (`ViewerChart.tsx:22`) | Same default |
| `` `Last ${span}` `` / `` `${samples.length} samples` `` (`ViewerChart.tsx:48`) | Figure meta (same) |
| 'Collecting samples…' (`ViewerChart.tsx:69`) | NO DATA panel slate title (same), configured only |
| 'Viewers' config label (`ViewerChart.tsx:57`) | `VIEWERS_CONFIG` (same) |

**New strings:** 'INSIGHTS', 'On-air status', 'UPTIME', 'Channel stats', 'Twitch is not configured', 'Twitch data unavailable', 'Unavailable', 'Retry', 'Refreshing…', 'Updated', 'Live on Twitch', 'Offline', 'Twitch not configured', 'Twitch data stale', the five announcements, 'NO DATA', 'The chart draws after the second poll, 30 s apart.', '{title} crosshair', the summary and readout patterns, 'Off air now', 'Off air for the whole window', 'STAND BY', 'twitch.tv/{channel} is offline.', '(opens in a new tab)', 'Loading Twitch Analytics'.

#### 11.C.10 Acceptance criteria

**How to run.** Run modes are §1.6's. Most items run in **dev** (unconfigured) on the real `/admin/analytics?noboot`, with `/api/twitch` answered by `page.route('**/api/twitch', …)` from `tests/helpers/twitch.ts` and `page.clock.install()` controlling time. `twitchBody({ isLive, viewerCount, followerCount, gameName, startedAt, capturedAt })` builds a valid `TwitchAnalytics` whose `thumbnailUrl` is `/fixtures/testcard-thumb.jpg` and whose `user.profileImageUrl` is `/fixtures/testcard-avatar.png` (same-origin §11.0 files), so no request leaves the test server and the console stays clean. Without Convex, the page uses local samples only, as today. **Fixture** items run in dev at `/admin/visual-test?noboot#analytics-visual-test`, never on prod. Commands whose paths start with `dashboard/` or `docs/`, and `git` commands with such pathspecs, run from the repository root; every other command runs from `dashboard/`.

**Contract and gates**
- [ ] `git diff --stat 845147c -- dashboard/app/api dashboard/convex dashboard/components/dither-kit dashboard/dither-kit.json` prints nothing.
- [ ] `grep -rn "fal-purple" dashboard/app dashboard/components` prints nothing (the D1 deletions in part 0A removed the dead components).
- [ ] `grep -rnE "connection-(indicator|connected|disconnected|connecting)" dashboard/app dashboard/components` prints nothing.
- [ ] In `dashboard/components/analytics/useTwitchAnalytics.ts`, `grep -c "fetch('/api/twitch', { cache: 'no-store' })"`, `grep -c "POLL_MS = 30_000"` and `grep -c "slice(-240)"` each print `1`; `grep -n "HISTORY_WINDOW_MS" dashboard/components/analytics/ConvexHistory.tsx` shows `24 * 60 * 60 * 1000` and the `sinceMs: latest.capturedAt - HISTORY_WINDOW_MS` argument.
- [ ] In `dashboard/components/ViewerChart.tsx`, `grep -c "animate={false}"`, `grep -c "satisfies ChartConfig"` and `grep -c "export interface ViewerSample"` each print `1`, and `grep -c "<Tooltip"` prints `0`.
- [ ] `/admin/analytics` First Load JS minus shared is ≤ 100 kB (baseline 197 − 103 = 94).
- [ ] On the 11C branch, the §14.14 G16 check (no `fal-*` colour class left in `app` or `components`) prints `0`.

**Unit (`tests/unit/{lamp-state,chart-data}.spec.ts`)**
- [ ] `lampState`: `error.status 503` → `not-patched` (even with data); no data + error 404 → `error`; no data, no error → `loading`; data + `lastOkAt = now − 60_001` → `stale`; `now − 30_000` + `isLive` → `live`; not live → `offline`; no data + error 401 → `error`. `bodyState`: 503 → `not-configured`; 401, with or without data → `auth`; no data + offline → `offline`; no data + error → `error`; data + error 502 → `ready`.
- [ ] `components/charts/chartData.ts`: `rowsSignature(a) === rowsSignature(b)` for two arrays with identical content, and differs after one sample is appended; `downsample(rows, 48)` on 2880 rows returns 48 rows whose last equals the last input; `summarize()` of the fixture series returns `Now 1,284 viewers · peak 1,610 at 21:04 · average 902` with `process.env.TZ = 'UTC'` set at the top of the spec (unit specs run in Node, where `timezoneId` does not apply).

**Mocked-API e2e (`tests/analytics.spec.ts`, 1440×900, both themes)**
- [ ] 503 `{ error: 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured' }`: `[data-testid=onair-tally]` has `data-state="not-patched"`, its TallyLight root has `data-kind="cue"`, and its sr text is 'Twitch not configured'. The strip subtitle is 'Not configured'. The slate body text equals the server message exactly. No element in `main` has text `OFFLINE` or 'Collecting samples…', and no element in `main` computes `background-color: rgb(255, 59, 48)`.
- [ ] 401 `text/plain` 'Unauthorized: Cloudflare Access assertion missing' → lamp `error`; the body shows the kicker `NO ACCESS`, the §11.D.7 title "Sign in through Cloudflare Access", a 'Reload' button and a `code` element whose text equals that string; no element in `main` has text 'Retry'. 404 `{ error: 'Twitch channel "x" not found' }` → the SIGNAL LOST slate titled "Twitch data unavailable" whose body equals that string. `route.abort()` → lamp `error` and a non-empty body.
- [ ] Two live responses 30 s apart (`clock.runFor(30_000)`): lamp `live` with label `LIVE`; `[data-testid=kpi-viewers] dd` reads `1,284`; the rail `img` has `alt="Stream preview"` and a `src` ending `?t=<capturedAt of the latest response>`; the chart `h2` is 'Viewers (this session)'; `[data-testid=viewer-chart] canvas` exists; in `next dev`, `window.__wzrd.slots.owner === 'chart'`. With `startedAt` 1 h 12 min 44 s before the mocked clock, the strip's `UPTIME` readout reads `01:12:44`, and `01:12:45` after `clock.runFor(1_000)`.
- [ ] **No replay:** after a third response (`clock.runFor(30_000)`), then `clock.runFor(50)`, `getImageData` on the kit's crisp canvas finds non-transparent pixels in the rightmost 10% of columns (a replayed 900 ms sweep would leave them empty). A `MutationObserver` on `[data-testid=kpi-viewers] dd` records only the old and new values (no count-up on polls).
- [ ] The first response reveals `kpi-viewers` through CountUp: a `MutationObserver` records ≥ 3 distinct values within 600 ms of the first render, ending at `1,284`. With `reducedMotion: 'reduce'` it records exactly one.
- [ ] Cadence: after load, `clock.runFor(90_000)` produces exactly 3 more `GET /api/twitch` requests. With responses delayed 500 ms, clicking `[data-testid=onair-refresh]` during an in-flight poll issues no extra request; the button has `aria-busy="true"` and contains 'Refreshing…' until the response, then 'Updated'; its width stays within ± 0.5 px of its idle width.
- [ ] Staleness: after one live response, abort every later request; at `clock.runFor(61_000)` the lamp has `data-state="stale"`, no element in the strip has text `LIVE`, an InlineBanner with `role="alert"` shows the abort message, and the FreshnessStamp has the `text-warning` class.
- [ ] Offline channel (`isLive: false`): lamp `offline` with label `OFFLINE`; `kpi-viewers` reads `0`; `kpi-uptime` and `kpi-category` read '—'; the rail contains a `video[preload="none"][loop]` whose `video.muted` property is `true`, from `<BrandVideo id="motion/coast-standby-loop" />` (or only its poster `img` while the manifest entry has no sources, §13.8); with `reducedMotion: 'reduce'`, the rail contains no `video` and contains the poster `img`.
- [ ] Chart keyboard: focusing `[data-testid=viewer-chart] [role=slider]` and pressing `Home`, `ArrowRight`, then `Shift+ArrowRight` (after ≥ 12 samples) sets `aria-valuenow` to 0, 1, then 11. `aria-valuetext` matches `/^\d\d:\d\d · ([\d,]+ viewers|off air)$/`, and `table.sr-only tbody tr` count is ≤ 48.
- [ ] With a series peaking at 3 viewers, every Y-axis tick text in the chart matches `/^[\d,]*$/` (no fractions).
- [ ] After the first response only, the chart box shows the NO DATA slate titled 'Collecting samples…'; after the second, it shows the plot.
- [ ] `document.title === 'Twitch Analytics · stream.wzrd.tech admin'`, one `h1`, and Axe reports 0 serious or critical violations in the not-configured, live and stale states.

**Fixture e2e (`#analytics-visual-test`, fixture)**
- [ ] With > 1 persisted fixture sample, the chart `h2` reads 'Viewers (last 24h, Convex)' and the meta reads `Last {span}`.
- [ ] With `#analytics-visual-test` scrolled into view and `#audio-library-visual-test` out of view, exactly one `ViewerChart` in the section contains a `canvas` and every other one contains the `ChartStatic` `svg`.

**Unconfigured e2e (no route mocking)**
- [ ] `/admin/analytics` shows lamp `not-patched` and the slate body 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured'; `main canvas` count is 0; the console holds only the §1.6 allowed entries (including one 503 resource error per poll).

**Configured QA** (Human operator only, authorized channel; recorded under Verification)
- [ ] **Needs a live broadcast: Devin never runs a Director session (§1.8 item 3) and records this item under Deferred / blocked as "not run (paid)".** While live, the lamp reads LIVE within 30 s, uptime ticks once per second, and a 30 s poll does not re-sweep the chart. Stopping the stream flips the lamp to OFFLINE within 30 s and the rail plays the standby loop.

**Screenshots:** dark, light and 390 px of the not-configured route and the mocked live and offline states, next to `docs/redesign/baseline/admin_analytics-dark.jpg`.

#### 11.C.11 Cut order

1. The `motion/coast-standby-loop` video in the rail; use its poster (§17 global cut order).
2. StatTile trend polyline.
3. X-axis day labels (keep `HH:MM`).
4. Bloom (`bloom="off"`).
5. CountUp on KPIs (§17 global cut order).

**Never cut:** the lamp precedence with NOT PATCHED never red, `animate={false}` with the memoised rows, ChartFigure (summary, sr table, slider), the verbatim server errors, the Refresh pending guard, the `fal-purple` removal, and the slot registration.

---

### 11.D Route-level and cross-cutting states

#### 11.D.1 File list

| File | Kind | Owner of the spec | Part |
|---|---|---|---|
| `app/not-found.tsx` | Server | §11.D.2 | 4D |
| `app/admin/error.tsx` | Client | §11.D.3 | 4D |
| `app/global-error.tsx` | Client, own `<html>` | §11.D.4 | 4D |
| `app/admin/visual-test/ThrowProbe.tsx` | Client, dev-only error probe | §11.D.10 | 4D |
| `app/admin/visual-test/page.tsx` (4D wraps the body in `<Suspense fallback={null}>` and adds `<ThrowProbe />`) | Server | §10.5.9 (final file) | 4D |
| The 7 `loading.tsx` files: `app/admin/(live)/loading.tsx` (with §6.3's move of `app/admin/page.tsx` into the `(live)` route group), `shotboard`, `characters`, `locations`, `clips`, `recordings`, `analytics` | Server | §6.3 (list, shape, captions, loader placement); §11.D.5 | 4D; 11A/11B/11C swap in their compositions |
| `app/admin/layout.tsx` and the 7 segment `layout.tsx` files | Server | §7.7 (titles, admin template, file shape) | 4B |
| `app/admin/template.tsx` | Server | §6.4.1 | 4B |
| `components/states/{NotConfigured,AuthRequired,ErrorState}.tsx` copy | — | §11.D.7 and §11.D.3 own the copy; the APIs are §7.5's | 4D (ErrorState), 5A (NotConfigured, AuthRequired) |
| `tests/unit/global-error.spec.ts` | Unit | §11.D.10 | 4D |

`Slate` (`titleAs`, title style), `Button` and `buttonClassName`, and `ConfirmDialog` need no change here: §7.3 and §7.5 own them. Server files such as `app/not-found.tsx` import `buttonClassName` from `components/ui/buttonClassName.ts`, which has no `'use client'` (§7.3).

#### 11.D.2 `app/not-found.tsx`

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Slate from '@/components/states/Slate'
import Kbd from '@/components/ui/Kbd'
import { buttonClassName } from '@/components/ui/buttonClassName'   // never from Button.tsx, a 'use client' module (docs/redesign/spec/07-primitives-and-shell.md §7.3)

export const metadata: Metadata = { title: 'Not found' }        // → "Not found · stream.wzrd.tech admin" (docs/redesign/spec/07-primitives-and-shell.md §7.7)

export default function NotFound() {
  return (
    <div className="lib-root">
      <Slate kind="not-found" size="route" titleAs="h1"
        title="No signal on this channel"
        body="This page doesn’t exist or has moved."
        actions={<>
          <Link href="/admin" className={buttonClassName('secondary', 'md')}>Back to Live Control</Link>
          <p className="text-caption text-fg-3">Or press <Kbd keys={['mod', 'K']} /> to open the command palette.</p>
        </>} />
    </div>
  )
}
```

- It renders inside the root layout, so the CommandBar, StatusRail, carrier and nav survive. It is used for unmatched URLs (HTTP 404) and for `/admin/visual-test`'s production `notFound()` (ST-6, SH-2).
- **Art:** `slate/not-found` (a centred blank CRT, §13) with `<PixelFace text="404" cell={4} srText={null} aria-hidden>` in `accent`, absolutely centred in the art window (Slate's `not-found` kind, §7.5). The digits are composited as SVG; letterforms are never generated (§13).
- The `’` in "doesn’t" is U+2019 (it also satisfies `react/no-unescaped-entities`).
- The ⌘K hint is not a button, so it duplicates no control.
- `lib-root` (here and in `app/admin/error.tsx`) is the §11.A.4 rule, which lands with `library.css` in 11A. From 4D until 11A the class has no rule; the route Slate still centres itself (§6.13). Do not create `library.css` early (§5.1).

#### 11.D.3 `app/admin/error.tsx`

```tsx
'use client'
import ErrorState from '@/components/states/ErrorState'
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="lib-root"><ErrorState error={error} digest={error.digest} onRetry={reset} /></div>
}
```

`ErrorState` (`components/states/ErrorState.tsx`) = `<Slate kind="error" size="route" titleAs="h1">`:

| Part | Spec |
|---|---|
| Kicker / art | `SIGNAL LOST` / `slate/signal-lost` |
| Title | "This view lost its signal" (`h1`, `tabIndex={-1}`, focused on mount) |
| Body | `<code className="text-code text-fg-2 line-clamp-3 break-words">{error.message \|\| 'An unexpected error occurred.'}</code>` |
| Digest | Only when present: `<p className="text-code text-fg-3">Digest {digest}</p>` |
| Actions | `<Button variant="secondary" icon={RotateCcw} onClick={onRetry}>Retry</Button>` · `<Button variant="ghost" icon={Copy} successLabel="Copied" …>Copy details</Button>`. Copy writes `JSON.stringify({ message, digest: digest ?? null, route: location.pathname + location.search, time: new Date().toISOString() }, null, 2)` |
| Announce | `announce('This view lost its signal', 'assertive')` once on mount |

- It covers every `/admin/**` page (not `app/admin/layout.tsx` itself). The shell, carrier and nav are in the root layout and survive (ST-1, SH-1).
- A malformed `?board=` is caught first by Shotboard's own boundary (§9.6.1 S7). An error thrown inside Live Control unmounts `DirectorPlayer` (its unmount resets the store, §7.17).
- There is no `console.*`. Next's own dev overlay and logging are unchanged.

#### 11.D.4 `app/global-error.tsx`

It replaces the root layout when the layout itself throws, so it carries its own `<html>`/`<body>`. It has **no imports** (the JSX runtime is automatic), uses a `<style>` element for all CSS (no stylesheet links, no fonts, no Tailwind), and is dark-only. The carrier is already gone in this state, so a full-page opaque background does not violate DI-1.

```tsx
'use client'
const BAYER_25 = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' shape-rendering='crispEdges'%3E%3Cg fill='%231D3160'%3E%3Crect width='2' height='2'/%3E%3Crect x='4' width='2' height='2'/%3E%3Crect y='4' width='2' height='2'/%3E%3Crect x='4' y='4' width='2' height='2'/%3E%3C/g%3E%3C/svg%3E")`
const CSS = `
html,body{margin:0;min-height:100%;color-scheme:dark;background:#05080F ${BAYER_25} repeat;background-size:8px 8px;
  color:#E8EEF9;font:400 14px/20px ui-sans-serif,system-ui,"Segoe UI",Helvetica,Arial,sans-serif}
.ge{min-height:100dvh;display:grid;place-items:center;padding:16px;box-sizing:border-box}
.ge-card{width:100%;max-width:480px;box-sizing:border-box;background:#0B111D;border:1px solid #2B3A55;border-radius:14px;padding:24px}
.ge-k{margin:0 0 8px;font:500 11px/14px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.1em;color:#7AA5E0}
.ge h1{margin:0 0 8px;font-size:28px;line-height:32px;font-weight:500;letter-spacing:-.02em}
.ge-b{margin:0 0 16px;color:#A9B6CC}
.ge-d{margin:0 0 16px;font:400 12px/18px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#8593AB}
.ge-a{display:flex;gap:8px}
.ge button{height:36px;padding:0 16px;border-radius:6px;border:1px solid #5A6F94;background:#111A2A;color:#E8EEF9;
  font-family:inherit;font-size:13px;font-weight:500;cursor:pointer}
.ge button:focus-visible{outline:2px solid #9CC0F2;outline-offset:2px}`
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <head><title>Signal lost · stream.wzrd.tech admin</title><style>{CSS}</style></head>
      <body>
        <main className="ge">
          <section className="ge-card" role="alert">
            <p className="ge-k">SIGNAL LOST</p>
            <h1>The admin lost its signal</h1>
            <p className="ge-b">Something failed outside the page. Retry, or reload the tab.</p>
            {error.digest ? <p className="ge-d">Digest {error.digest}</p> : null}
            <div className="ge-a">
              <button type="button" onClick={() => reset()}>Retry</button>
              <button type="button" onClick={() => window.location.reload()}>Reload</button>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
```

- The colours are the dark token values (§5): canvas, panel, border-strong, border-control, raised, text-1/2/3, accent, focus and ramp-1.
- The contrast pairs are the §5.6 dark-panel rows: text-2 8.80:1, text-3 5.80:1, accent 7.11:1.
- The `section` carries no `aria-labelledby`: the file has no imports, so it cannot call `useId()`, and a literal id is not allowed (§7.1). The `role="alert"` region is announced with its text, and the `h1` names the page.
- The Bayer tile is exactly `--bayer-4-03` (cells where `B4[y][x] ≤ 3`: (0,0), (4,0), (0,4), (4,4) in px).
- This is the only file in `app/` allowed hex literals; the §15 hex gate excludes it by path.

#### 11.D.5 `app/admin/**/loading.tsx` (7 files)

- The list, the file shape, the captions and the loader placement are §6.3's (7 files, created in 4D). No `loading.tsx` exists at `app/admin/` or `app/admin/visual-test/` (§6.3).
- The Clips, Recordings and Analytics files start with `RouteSkeleton` (§7.5) and swap in `ClipsSkeleton` (11A), `RecordingsSkeleton` (11B) and `AnalyticsSkeleton` (11C); each swap changes only the skeleton import and element.
- Skeleton geometry: Live §8.6.1, Shotboard §9.6.1, Characters/Locations §10, Clips §11.A.6, Recordings §11.B.6, Analytics §11.C.6.
- The fallback is invisible for 150 ms (`.route-fallback`, §5.14). A skeleton's PageHeader, or `RouteSkeleton`'s visually hidden `h1`, renders the route's real `h1` text, so the fallback never leaves a route without its `h1`.

#### 11.D.6 Segment `layout.tsx` files (titles)

Titles, template and file shape: §7.7.

#### 11.D.7 NotConfigured, AuthRequired, Offline: canonical copy

| State | Component | Kicker / art | Title | Body | Actions |
|---|---|---|---|---|---|
| Convex not configured (Clips, Recordings) | `<ConvexNotConfigured feature>` → `<NotConfigured feature size="route">` | NOT PATCHED / `not-patched` | 'Convex is not configured' | 'Set `NEXT_PUBLIC_CONVEX_URL` to enable {feature}. Run `npx convex dev` in `dashboard/` to create a deployment.' (env names and command in `code`; the rendered `textContent` equals the 845147c text of `ConvexNotConfigured.tsx:8-13`) | None |
| Convex not configured (Characters, Locations) | `<NotConfigured message size="route">` (call sites and placement: §10.5.5, §10.5.6, §10.6) | NOT PATCHED / `not-patched` | — | Exactly 'Convex is not configured. Character library changes are disabled.' / 'Convex is not configured. Location library changes are disabled.' (§10) | None |
| Convex not configured (Shotboard) | InlineBanner (§9.6.1 S9) | NOT PATCHED | — | The preserved sentence (§9) | — |
| Twitch not configured | `<Slate kind="not-configured" size="panel">` (§11.C.6) | NOT PATCHED / `not-patched` | "Twitch is not configured" | Server `body.error` verbatim | None |
| Auth required | `<AuthRequired size="route"\|"panel" />` | NO ACCESS / `no-access` | "Sign in through Cloudflare Access" | "Your Access session is missing or expired. Sign in, then reload." | `<Button variant="secondary" icon={RefreshCw} onClick={() => location.reload()}>Reload</Button>` |
| Offline (page body, no data) | `<Slate kind="offline">` | NO CARRIER / `signal-lost` | "Network offline" | "This view reconnects on its own when the network returns." | None |
| Offline (shell) | `OfflineBanner` (§7.6) | NO CARRIER | — | "Network offline" | — |

- **AuthRequired** shows when `useConvexAuthState()` has resolved (`!isLoading`) with `!isAuthenticated`. Lists that return `[]` for a signed-out user show it **instead of** their empty state.
- **Offline:**
  - `OfflineBanner` renders while `useOnline() === false` and sets `html[data-offline]` (§7.6; the page offset is §11.0).
  - The StatusRail NET LED reads "NET · OFFLINE" (§7.10).
  - Page-level offline slates appear only when a page has no data yet. Pages with data keep it on screen under the banner.
- **Not configured** is never shown as red or as an error: the kicker is accent, and lamps use the amber cue face.

#### 11.D.8 Motion and accessibility

- Every slate enters with one 160 ms `px-resolve` (§6.13), and nothing loops.
- The route fallback appears after 150 ms. Under reduced motion there is no resolve, and the CoastLoader shows frame 1.
- `error.tsx` focuses its `h1` and announces assertively. `not-found.tsx` does not move focus (a normal navigation).
- `global-error.tsx` uses `role="alert"`. Its buttons are native, 36 px tall, and have a 2 px focus ring.
- Each route state has exactly one `h1`: the 404 and error slates via `titleAs="h1"`; page states via their PageHeader.

#### 11.D.9 Preserved contract

| ID | How §11.D satisfies it |
|---|---|
| ST-1, SH-1, DI-1 | `not-found` and `admin/error` render inside the root layout (carrier, shell and nav intact); only `global-error` is full-page opaque, and it renders only when the root layout (with the carrier) has already failed |
| ST-6, SH-2 | `/admin/visual-test` keeps `notFound()` in production and lands on `app/not-found.tsx` with HTTP 404, because no `loading.tsx` sits above it (§6.3); its `layout.tsx` and `ThrowProbe` mount no Convex hook |
| SH-3 | No middleware or API change; the 401 plain-text strings are untouched |
| SH-4 | `ConvexClientProvider` default export, `useConvexEnabled` and the no-client fallback unchanged; `useConvexAuthState` is additive (§7.2) |
| SH-5, DI-3 | `ConvexNotConfigured` keeps `feature` and every string |
| SH-6, ST-2, DI-13 | No `console.*` in any route-state file; the fallback and slates make no network requests |
| SH-8 | `title.default` 'stream.wzrd.tech admin' unchanged; templates per §7.7 |
| SH-9 | Route files use no Node-only API (edge-compatible); `pages:build` checks it (§11.D.10) |

**New strings** (§11.D; the route titles are §7.7's, the loading captions §6.3's and the slate kickers §6.13's): 'No signal on this channel', 'This page doesn’t exist or has moved.', 'Back to Live Control', 'Or press {⌘K} to open the command palette.', 'This view lost its signal', 'An unexpected error occurred.', 'Digest {digest}', 'Retry', 'Copy details', 'Copied', 'The admin lost its signal', 'Something failed outside the page. Retry, or reload the tab.', 'Reload', 'Signal lost · stream.wzrd.tech admin', 'Sign in through Cloudflare Access', 'Your Access session is missing or expired. Sign in, then reload.', 'Network offline', 'This view reconnects on its own when the network returns.'. The global-error card's `SIGNAL LOST` line reuses the §6.13 kicker text. Appendix A collects them.

#### 11.D.10 Acceptance criteria

**Error probe** (`app/admin/visual-test/ThrowProbe.tsx`, 4D). The dev-only child that the `?throw=render` check uses; §10.5.9's page renders it inside its `<Suspense fallback={null}>`:

```tsx
'use client'
// Dev-only error probe for docs/redesign/spec/11-clips-recordings-analytics-states.md §11.D.10.
import { useSearchParams } from 'next/navigation'

export default function ThrowProbe() {
  const params = useSearchParams()
  if (params.get('throw') === 'render' && process.env.NODE_ENV !== 'production') throw new Error('visual-test probe')
  return null
}
```

**How to run.** Run modes are §1.6's **dev**, **prod** and **fixture** (dev at `/admin/visual-test?noboot`; never on prod, where the route is 404). Browser items that name neither prod nor fixture run in **dev**. Commands whose paths start with `dashboard/` or `docs/`, and `git` commands with such pathspecs, run from the repository root; every other command runs from `dashboard/`. Quote any path that contains `(live)`. Items marked (from 11A/11B) are checked again when that part lands.

- [ ] `ls dashboard/app/not-found.tsx dashboard/app/admin/error.tsx dashboard/app/global-error.tsx dashboard/app/admin/visual-test/ThrowProbe.tsx` succeeds.
- [ ] `find dashboard/app/admin -name loading.tsx | wc -l` prints `7`; `test ! -e dashboard/app/admin/loading.tsx && test ! -e dashboard/app/admin/visual-test/loading.tsx` succeeds; `find dashboard/app/admin -name layout.tsx | wc -l` prints `8`; `test ! -e 'dashboard/app/admin/(live)/layout.tsx'` succeeds.
- [ ] `grep -c "^import" dashboard/app/global-error.tsx` prints `0`; the file contains `<html lang="en">` and `<body>`; `grep -rn "console\." dashboard/app/not-found.tsx dashboard/app/admin/error.tsx dashboard/app/global-error.tsx dashboard/app/admin/visual-test/ThrowProbe.tsx dashboard/components/states` prints nothing.
- [ ] `grep -n "components/ui/Button'" dashboard/app/not-found.tsx` prints nothing, and `npm run qa:build` exits 0 with `/_not-found` in its route table (`grep -c "/_not-found" .qa/build.log` prints at least `1`). A server file that called a function from the `'use client'` `Button.tsx` would fail this prerender.
- [ ] `env $UNSET NEXT_TELEMETRY_DISABLED=1 npm run pages:build` exits 0, and its output contains no line matching `not configured to run with the Edge Runtime` (SH-9).
- [ ] Unit (`tests/unit/global-error.spec.ts`, a `.ts` file): `renderToStaticMarkup(createElement(component(GlobalError), { error: Object.assign(new Error('x'), { digest: 'd1' }), reset: () => {} }))`, with `component()` from `tests/helpers/pw-jsx.ts` (§15.4), contains `<title>Signal lost · stream.wzrd.tech admin</title>`, `<h1>The admin lost its signal</h1>`, `Digest d1`, two `<button type="button">` (Retry, Reload), and no `<link`, `<script src` or `aria-labelledby`.
- [ ] dev: `curl -s -o /dev/null -w '%{http_code}' localhost:3107/admin/does-not-exist` prints `404`; the page has one `h1` 'No signal on this channel', the body text 'This page doesn’t exist or has moved.' (U+2019), a link named 'Back to Live Control' with `href="/admin"`, one `banner`, one `navigation` named 'Admin sections', one `contentinfo`, and `document.title === 'Not found · stream.wzrd.tech admin'`.
- [ ] prod: `curl -s -o /dev/null -w '%{http_code}' localhost:3109/admin/visual-test` prints `404` and `curl -s -o /dev/null -w '%{http_code}' localhost:3109/admin` prints `200`; the `/admin/visual-test` body contains 'No signal on this channel'.
- [ ] fixture: `/admin/visual-test?noboot&throw=render` shows the `SIGNAL LOST` kicker, an `h1` 'This view lost its signal' that is `document.activeElement`, a `code` containing 'visual-test probe', and buttons 'Retry' and 'Copy details'. The CommandBar and `nav[aria-label="Admin sections"]` are still present, and `window.__wzrdDitherReady` is still set (the truthy `{ webgl }` object, §6.2.11). Clicking 'Copy details' puts JSON with the keys `message`, `digest`, `route` and `time` on the clipboard. Without `throw=render`, the page renders no error.
- [ ] `document.title` equals its §7.7 value on each of the 8 admin routes after load (`/admin/visual-test` in dev; the prod `<title>` check is §7.18's).
- [ ] With the Clips RSC request delayed 1000 ms via `page.route`, `.route-fallback` exists after the click, has opacity `0` at 100 ms and `1` at 300 ms, and contains `role="status"` text 'Loading Clips' and an `h1` 'Clips'. (from 11A) After the route renders, the `h1`'s bounding box equals the fallback `h1`'s box ± 1 px (the §11.A.4 geometry).
- [ ] (from 11B) On unconfigured `/admin/recordings`, `context.setOffline(true)` shows the OfflineBanner text 'Network offline' with kicker `NO CARRIER`, sets `html[data-offline]`, and makes `.lib-root`'s computed `padding-top` exactly 36 px larger; `setOffline(false)` removes the banner and the attribute and restores the padding.
- [ ] (fixture, from 11A) The fixture renders `AuthRequired` with the exact title, body and a 'Reload' button, and `NotConfigured feature="clips"` whose `textContent` includes `Set NEXT_PUBLIC_CONVEX_URL to enable clips. Run npx convex dev in dashboard/ to create a deployment.`
- [ ] Axe on `/admin/does-not-exist` and on the error probe: 0 serious or critical violations in both themes.

**Never cut (whole section):** the route state files (§17 never-cut list), NOT PATCHED never red, NO ACCESS before empty, and the exact preserved copy.
