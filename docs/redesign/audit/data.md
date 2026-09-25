# Audit: Data pages: /admin/clips, /admin/recordings, /admin/analytics (Twitch), plus the chart and metric layer (ViewerChart, the legacy recharts/metric components, the realtime hooks, the vendored dither-kit and dither-kit.json)

## Files read
- dashboard/app/admin/clips/page.tsx
- dashboard/app/admin/recordings/page.tsx
- dashboard/app/admin/analytics/page.tsx
- dashboard/app/admin/layout.tsx
- dashboard/app/layout.tsx
- dashboard/app/globals.css
- dashboard/app/api/twitch/route.ts
- dashboard/app/admin/visual-test/page.tsx
- dashboard/components/ViewerChart.tsx
- dashboard/components/RealtimeChart.tsx
- dashboard/components/PerformanceMetrics.tsx
- dashboard/components/QueueVisualization.tsx
- dashboard/components/AIPerformanceBreakdown.tsx
- dashboard/components/GenerationHistory.tsx
- dashboard/components/AdminNav.tsx
- dashboard/components/ConvexNotConfigured.tsx
- dashboard/components/ConvexClientProvider.tsx
- dashboard/components/DitherBackground.tsx
- dashboard/components/DirectorPlayer.tsx (lines 66-80, 425-530, grep for recorder/clip/record labels)
- dashboard/components/useDirectorPersistence.ts (partial)
- dashboard/components/AssetStudioVisualFixture.tsx (head)
- dashboard/components/reactbits/PixelCard.jsx
- dashboard/components/reactbits/PixelCard.css
- dashboard/components/reactbits/Dither.jsx (head + RAF grep)
- dashboard/components/dither-kit/area-chart.tsx
- dashboard/components/dither-kit/area.tsx
- dashboard/components/dither-kit/sparkline.tsx
- dashboard/components/dither-kit/tooltip.tsx
- dashboard/components/dither-kit/legend.tsx
- dashboard/components/dither-kit/block-legend.tsx
- dashboard/components/dither-kit/x-axis.tsx
- dashboard/components/dither-kit/y-axis.tsx
- dashboard/components/dither-kit/grid.tsx
- dashboard/components/dither-kit/reference-line.tsx
- dashboard/components/dither-kit/cartesian-root.tsx
- dashboard/components/dither-kit/cartesian-canvas.tsx
- dashboard/components/dither-kit/chart-context.tsx
- dashboard/components/dither-kit/common-context.tsx
- dashboard/components/dither-kit/dither-paint.ts
- dashboard/components/dither-kit/pixel.ts
- dashboard/components/dither-kit/palette.ts
- dashboard/components/dither-kit/lib.ts
- dashboard/components/dither-kit/scales.ts (partial)
- dashboard/components/dither-kit/polar-root.tsx (head)
- dashboard/components/dither-kit/gradient.tsx
- dashboard/components/dither-kit/button.tsx
- dashboard/components/dither-kit/avatar.tsx
- dashboard/dither-kit.json
- dashboard/components.json
- dashboard/tailwind.config.js
- dashboard/package.json
- dashboard/hooks/useRealtimeData.ts
- dashboard/hooks/useRealtimeWebSocket.ts
- dashboard/utils/falApi.ts
- dashboard/types.ts (ComponentMetrics section)
- dashboard/convex/clips.ts
- dashboard/convex/recordings.ts
- dashboard/convex/twitchStats.ts
- dashboard/convex/schema.ts (clips/recordings/twitchStats)
- dashboard/lib/assetPlaceholders.ts
- dashboard/.next/static/css/app/layout.css (compiled dev CSS, grep only)
- .agents/skills/admin-testing/SKILL.md
- README.md (routes table lines 142-144)
- docs/redesign/component-prompts.csv

## Current state
VERIFIED FACTS FIRST. The three data routes are thin client pages under the shared admin shell: app/layout.tsx:37 mounts <DitherBackground/> (fixed, -z-10, aria-hidden). The content wrapper `min-h-screen bg-fal-gray-50/60 dark:bg-[#0a0d14]/45` (layout.tsx:38) sits on top of it, followed by a solid #0a0d14 header and `main.max-w-7xl px-6 lg:px-8 py-8` with a one-time `.fade-in`. AdminNav (components/AdminNav.tsx) is a row of underline tabs: 'Live Control', 'Shotboard', 'Characters', 'Locations', 'Clips', 'Recordings', 'Twitch Analytics' (nav aria-label="Admin sections"). None of the data pages renders a page title: the only h1 is "Stream Admin" in the global header. Each page's "title" is an h3 inside a card header, and the analytics page has no heading at all.

CLIPS (/admin/clips, 88 lines). The page renders `<ConvexNotConfigured feature="clips"/>` when Convex is off (clips/page.tsx:85-88). Otherwise it shows one full-width `.fal-card`. The header holds a Film icon (text-fal-blue-500), the h3 "Clips" and a right-aligned muted count "N clips" / "Loading…" (:21). The body is a `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` (:33) of React Bits PixelCards (variant="blue", noFocus). The newest card (index 0, since the query orders by createdAt desc) gets `pixel-card-latest`, a green border in globals.css:238-244. Each card has an `aspect-video bg-black` well with a native `<video controls preload="metadata" object-contain>` (:44), or a centered Film icon with "No media stored for this segment" (:46-49). Below that: a mono meta line "{source} · segment v{promptVersion}" or "chunk #{chunkIndex}", plus a Clock and `new Date(createdAt).toLocaleString()` (:55-60). Then the prompt in a gray mono box with line-clamp-3 (:62-64), and a footer with `{durationSeconds.toFixed(1)}s` and the first 8 characters of the session id with a Layers icon (:66-72). There are no actions: no download, delete, copy, filter, search, sort, pagination or lightbox. The data comes from `useQuery(api.clips.list, { limit: 100 })` (:11). The query is reactive, so new clips appear at the top during a live Director session.

RECORDINGS (/admin/recordings, 137 lines). It uses the same shell and the same ConvexNotConfigured gate (:134-137). A single `.fal-card` has the header "Recordings" (h3, :34) and the count "N recordings" / "Loading…" (:37). The body is a vertical `space-y-4` list (:50) of PixelCards, each with an internal `grid-cols-1 lg:grid-cols-3` (:58). A 1/3-width black 16:9 native `<video controls preload="metadata">` (:61) or "Media unavailable" (:64) sits next to a 2/3 metadata column. That column has the title (`recording.title ?? \`${recording.model} recording\``, :72), a localized timestamp, and a 2x4 micro-grid of Duration / Size / Type (raw MIME, truncated) / Session (:79-99). Actions are a `.fal-button-secondary` "Download" anchor with `download="recording-<id>.webm"` (:103-111) and a red text "Delete" button guarded by `window.confirm('Delete this recording permanently?')` (:113-121). Helper formatters are local: formatBytes :10 (a near-duplicate exists at DirectorPlayer.tsx:76) and formatDuration :16.

ANALYTICS (/admin/analytics, 228 lines). The page is not Convex-gated. It polls `fetch('/api/twitch', {cache:'no-store'})` every POLL_MS=30_000 (:11, :94-116), keeps up to 240 local samples (:103), and when Convex is on mounts an invisible `<ConvexHistory>`. ConvexHistory writes each poll to api.twitchStats.record, deduped by lastRecordedRef (:64-77). It reads api.twitchStats.history with sinceMs anchored to `latest.capturedAt - 24h` so that query args change only once per poll (:59-63). The layout, top to bottom:
(1) A channel header card with a 48px round avatar (Twitch profileImageUrl, or a gray disc), the display name, a mono "twitch.tv/{channel}" / "Loading…" / "Not configured" line, a `.connection-indicator` pill with a Radio icon showing LIVE (green) or OFFLINE (red), a small gray "Refresh" button, and an inline red AlertCircle error line (:125-169).
(2) Four StatCards in `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`: Current viewers (Eye, purple accent), Followers (Heart, red), Uptime (Clock, green) and Category (Gamepad2, blue). Each is a 36px tinted icon chip, a 12px label and a text-xl mono value (:22-48, :172-197).
(3) Only when live, a card with the Twitch thumbnail (cache-busted `?t=capturedAt`), the "Stream title" in a mono gray box and a "Started …" line (:200-220).
(4) ViewerChart, titled 'Viewers (last 24h, Convex)' or 'Viewers (this session)' (:222-225).
There are no deltas, peaks, averages, sparklines, freshness indicator or live tally. Numbers swap instantly.

CHART LAYER. ViewerChart.tsx is the only chart that is actually rendered. It uses the vendored dither-kit: AreaChart + Area variant="gradient" + XAxis(dataKey="time") + YAxis + Tooltip(labelKey="time"), with bloom="aura" at h-[220px]. It sits inside a second `bg-white dark:bg-fal-gray-900 rounded-lg p-4` box nested in a `.fal-card` of the same color (:54-66). With fewer than 2 samples it shows "Collecting samples…" (:68-70). The dither-kit paints a low-resolution ordered-Bayer (4x4) dither fill on a pixelated canvas: CELL=2px, a density-to-alpha falloff, a soft top edge, winking "stars", a crosshair, an optional additive blur "bloom" layer, and a 900ms left-to-right entrance sweep. It honors prefers-reduced-motion (dither-paint.ts:173, cartesian-canvas.tsx:62-64).

Import graph (verified by grep over the repo): ViewerChart is imported by analytics/page.tsx:8. The kit's avatar is used by ChatSteerer.tsx:5, and its button and gradient by DirectorPlayer.tsx:15-16. RealtimeChart (the only recharts consumer, RealtimeChart.tsx:3), PerformanceMetrics, QueueVisualization, AIPerformanceBreakdown, GenerationHistory, hooks/useRealtimeData and hooks/useRealtimeWebSocket have ZERO importers. They are dead LTX-era pipeline widgets (queue/FPS/GPU/overlay metrics fed by a 1s poll or a fal WebSocket).

Inside the kit, these have no importer at all: sparkline, legend, block-legend, grid, reference-line, dot, the LineChart/Line exports, and polar-root, polar-context and polar. polar-root requires a `Canvas` painter (PieCanvas/RadarCanvas) that is not vendored, so pie/radar cannot render. Bar is referenced in chart-context comments but bar.tsx/bar-canvas are not vendored.

dither-kit.json is already out of sync. Running sha256 over every listed file, 20 of 28 hashes mismatch; only area-chart.tsx, cartesian-canvas.tsx, sparkline.tsx, avatar.tsx, lib.ts, dot.tsx, use-chart-dimensions.ts and gradient.tsx match. Commit 16af204 knowingly patched scales.ts.

VISUAL LANGUAGE (opinion, grounded in the code). These pages read as a generic 2023 light SaaS template ("fal" gray and white cards, rounded-lg, shadow-sm, lucide icons in colored chips) placed on top of a moody blue pixel-dither WebGL wave. The opaque `.fal-card` (globals.css:145-147; dark: bg-fal-gray-900 at :91-93) hides the brand background wherever there is content. The only brand-specific motion is the PixelCard hover shimmer and the dither chart, and they speak different pixel dialects: PixelCard uses random square shimmer at a 10px gap with sky-blue (#e0f2fe, #7dd3fc, #0ea5e9) colors, while the kit uses Bayer 2px cells with its own blue [53,143,243]. Typography is Focal Light (fontWeight overrides map bold to 500) with JetBrains Mono for data. There is no display type, no tabular emphasis on numbers, and no hierarchy beyond 18px h3s.

## Problems
- **[high] [code-structure]** `dashboard/components/RealtimeChart.tsx:3` — Dead-code cluster: seven files are LTX-era and never imported. They are RealtimeChart.tsx (the only recharts consumer), PerformanceMetrics.tsx, QueueVisualization.tsx, AIPerformanceBreakdown.tsx, GenerationHistory.tsx, hooks/useRealtimeData.ts and hooks/useRealtimeWebSocket.ts (verified by a repo-wide grep; the only external mentions are README.md:238 and types.ts). recharts ^2.8.0 in package.json exists only for this dead file. A redesign agent told to improve 'every component' will waste effort restyling them or, worse, wire them back in. useRealtimeData polls NEXT_PUBLIC_FAL_API_URL every 1s and console.logs '📡 Starting metrics polling…' and a console.error per failure. That breaks the admin-testing SKILL.md step 6 expectation of only a React DevTools console message, and the step-13 warning about reintroduced LTX code.
- **[high] [color]** `dashboard/app/admin/analytics/page.tsx:177` — `bg-fal-purple-500/10 text-fal-purple-500` (the 'Current viewers' StatCard accent) and `text-fal-purple-500` (ViewerChart.tsx:44) reference a color that tailwind.config.js never defines. It defines only fal-gray, fal-primary, fal-green, fal-yellow, fal-blue and fal-red. The compiled .next/static/css/app/layout.css has 0 'fal-purple' rules (it does have fal-blue-500). The hero KPI icon chip therefore renders with no tint or background, and the chart icon is uncolored. Six more usages sit in the dead components.
- **[high] [states]** `dashboard/app/admin/recordings/page.tsx:106` — Download is broken in two ways. (a) The filename is hard-coded as `recording-<id>.webm`, but pickRecorderMimeType (DirectorPlayer.tsx:69-73) falls back to 'video/mp4' (Safari), and the stored `recording.mimeType` is ignored. (b) `recording.url` is a Convex storage URL on a different origin from the dashboard. Per the HTML spec, the `download` attribute is ignored for cross-origin hrefs, so clicking 'Download' navigates the admin tab away to the raw video (there is no target). High confidence from the spec; not browser-tested here.
- **[high] [states]** `dashboard/app/admin/clips/page.tsx:26` — There is no loading UI. The ternary `clips && clips.length === 0 ? empty : grid` sends the `undefined` (loading) case to the grid branch, which renders nothing, so the body is an empty white or dark card and the only cue is the tiny header text 'Loading…' (:21). Recordings has the same issue (recordings/page.tsx:43, :37). In addition, convex/clips.ts:52 and convex/recordings.ts:135 return [] when unauthenticated, so a signed-out user sees 'No clips yet' / 'No recordings yet' instead of an auth state.
- **[high] [states]** `dashboard/app/admin/clips/page.tsx:46` — A clip that is still being captured is shown as broken. DirectorPlayer.tsx:489-495 inserts the clip row at segment start with `durationSeconds: 0` and no media, and media is attached only at the next rotation (uploadClipSegment, :425-457). During a live session the newest clip (the one highlighted as latest) therefore shows 'No media stored for this segment' and '0.0s' (:66). Upload failures (:446-455) and browsers without MediaRecorder (:389-393, 'metadata-only') leave permanent media-less rows that look identical. No CAPTURING, UPLOADING or FAILED state is distinguished.
- **[high] [performance]** `dashboard/app/admin/clips/page.tsx:11` — Up to 100 `<video preload="metadata">` elements (clips :44, recordings :61) and 100 PixelCards (each with a canvas, a ResizeObserver and a random pixel array, PixelCard.jsx:144-172, 217-230) mount at once with no pagination, virtualization or lazy loading. Each video fires its own metadata range request against Convex storage. The header count ('100 clips') silently hides that the query is capped at `limit: 100`.
- **[medium] [motion]** `dashboard/components/ViewerChart.tsx:57` — Two chart-churn bugs. (1) `config={{ viewers: {...} }}` is a fresh object on every render. The kit memoizes configKeys, bands, seedOf, common and the whole context value on `config` (chart-context.tsx:223, 299-302, 351-415), so every parent render rebuilds the context and re-renders every part. The kit's own Sparkline memoizes config explicitly (sparkline.tsx:48). (2) `useRevision` bumps whenever the data identity changes (chart-context.tsx:165-173, 224), and cartesian-canvas.tsx:131-135 then replays the 900ms entrance. The analytics page creates a new samples array on every 30s poll (analytics/page.tsx:102-104) and on every Convex history push, so the chart wipes and re-sweeps every 30 seconds instead of appending a point.
- **[medium] [states]** `dashboard/app/admin/analytics/page.tsx:145` — Unconfigured, error and offline states are conflated. When /api/twitch returns 503 (missing TWITCH_CLIENT_ID/SECRET or TWITCH_CHANNEL; route.ts:78-86), the header shows 'Twitch' / 'Not configured' but the pill still reads a red 'OFFLINE' (:146-151). All four KPIs show '—', ViewerChart shows 'Collecting samples…' forever (ViewerChart.tsx:69), and polling keeps hitting the 503 every 30s (:112-116). After a transient error, stale `data` stays on screen with no 'last updated' or staleness indicator.
- **[medium] [a11y]** `dashboard/app/globals.css:217` — Contrast failures in dark mode (computed with the WCAG formula). `.connection-connected` (text-fal-green-700) and `.connection-disconnected` (text-fal-red-700) have no `.dark` overrides. The 12px LIVE text is 3.03:1 and OFFLINE is 2.52:1 on the dark card (10% tint over #111827), below the 4.5:1 AA threshold. The Recordings 'Delete' button (text-fal-red-600, recordings/page.tsx:117) on the dark PixelCard background #1f2937 is 3.04:1.
- **[medium] [a11y]** `dashboard/components/dither-kit/cartesian-root.tsx:177` — Chart accessibility. The front SVG is `role="img" aria-label="Chart"` (generic and not overridable via props), there is no text alternative or data table, and scrubbing is pointer-only (onPointerMove, :151). Keyboard and screen-reader users cannot read any value. The page adds nothing on top: there is no figure/figcaption, no summary such as 'peak X at HH:MM', and no aria-live for LIVE status or viewer changes.
- **[medium] [a11y]** `dashboard/app/admin/clips/page.tsx:19` — Heading order skips levels. The global h1 'Stream Admin' (layout.tsx:51) is followed directly by h3 'Clips' / 'Recordings' (recordings :34) and h3 chart titles (ViewerChart.tsx:45), with no h2. The analytics page has no heading: the channel name is a div (:136). KPI StatCards are divs rather than a `<dl>`, so label/value pairs are not associated.
- **[medium] [visual-hierarchy]** `dashboard/components/reactbits/PixelCard.css:19` — `.pixel-card { user-select: none }` makes clip prompts, session ids and recording metadata unselectable and uncopyable. The prompt is the most reusable data on the Clips page. The shimmer canvas (position:absolute behind the content) shows through the transparent metadata area (clips :52 `p-3`, recordings :58), so pixels twinkle behind 12px gray text on hover. The variant `activeColor` is never applied (PixelCard.jsx:97-126 defines it but never sets `--pixel-card-active-color`), so the hover `::before` glow is the default near-black `#09090b` radial (PixelCard.css:28): a dark smudge in light mode.
- **[medium] [visual-hierarchy]** `dashboard/app/globals.css:145` — Opaque containers and triple nesting. Each page is one giant opaque `.fal-card` (bg-white, or bg-fal-gray-900 in dark), containing PixelCards (a different surface, #1f2937 in dark, 12px radius at PixelCard.css:16 against the card's 8px rounded-lg), containing gray prompt boxes. ViewerChart adds a same-color inner box (ViewerChart.tsx:54). The required Dither background is visible only in gutters. Depth is communicated by borders alone and nothing feels broadcast-grade.
- **[medium] [dark-mode]** `dashboard/app/admin/analytics/page.tsx:155` — In dark mode the Refresh button has no hover feedback. Its class string is `hover:bg-fal-gray-200 dark:bg-fal-gray-800`. In the compiled CSS `.dark\:bg-fal-gray-800:is(.dark *)` (layout.css:2624) comes after `.hover\:bg-fal-gray-200:hover` (:2448) with equal specificity (0,2,0), so the dark rule always wins. The button also has no pending, spinning or disabled state and can be spammed while a fetch is in flight.
- **[medium] [visual-hierarchy]** `dashboard/app/admin/analytics/page.tsx:172` — KPI tiles carry no signal: there is no delta, trend, peak, average, sparkline or freshness. Formatting is inconsistent: viewers uses `String(viewerCount)` (:176) while followers uses toLocaleString (:182). Category (:194) can be a long game name in text-xl mono with no truncate, so tile heights become uneven at xl:grid-cols-4. Red (Heart) is used for Followers, which is the same hue as errors and OFFLINE, so the colors carry no consistent meaning. The header row (:127-160) has no flex-wrap or min-w-0, so a long display name collides with the pill and button on phones.
- **[medium] [motion]** `dashboard/app/admin/clips/page.tsx:34` — The reactive list shifts under the user. During a live session each applied direction inserts a new clip at index 0 (DirectorPlayer.tsx:489), pushing the whole grid down while someone may be watching or scrolling. The green `pixel-card-latest` border also jumps to the new card. There is no 'N new clips' affordance and no enter animation.
- **[medium] [responsive]** `dashboard/app/admin/recordings/page.tsx:61` — Playback depends on the native `<video controls>` in a 1/3-width black box with object-contain, which letterboxes 9:16 outputs into a tiny window. Recordings come from MediaRecorder WebM, which in Chromium typically lacks a duration and cues header, so the native scrubber commonly shows no duration or ∞ and seeking misbehaves. The stored `durationSeconds` is ignored for playback UI. (This is known platform behavior, not reproduced here.)
- **[low] [copy]** `dashboard/app/admin/clips/page.tsx:30` — Copy problems. (1) The empty state says 'Start an LTX stream or a Director session'; LTX is legacy per admin-testing SKILL.md:13. (2) The chart title leaks an implementation detail: 'Viewers (last 24h, Convex)' (analytics/page.tsx:224). (3) Raw enum values reach the UI: `clip.source` shows 'director' or 'ltx-2.3-local' (clips :55), and the title fallback yields 'director recording' (recordings :72). (4) Raw MIME 'video/webm;codecs=vp9,opus' (recordings :91): full recordings store `blob.type` with codecs (DirectorPlayer.tsx:325), whereas clips strip codecs (:442).
- **[low] [typography]** `dashboard/components/ViewerChart.tsx:62` — Axis formatting. YAxis has no tickFormatter, so for small or offline channels the domain falls back to [0,1] (scales.ts:40-41, 97-101) and d3 ticks produce fractional viewer counts such as 0.2 and 0.4. XAxis labels are HH:MM only (:26) across a 24h window, which is ambiguous across midnight. Offline stretches are drawn as 0-viewer area (:27) rather than a distinct off-air band. Timestamps elsewhere are verbose `toLocaleString()` (clips :59, recordings :76) with no relative time.
- **[low] [states]** `dashboard/app/admin/recordings/page.tsx:115` — Deleting a recording uses a blocking native `confirm()`, and the `remove()` promise is not awaited or handled. requireIdentity throws 'Authentication required' (convex/recordings.ts), which becomes an unhandled rejection with no error UI. There is no pending state, no toast and no undo, and the row disappears abruptly when the reactive query updates. The action is permanent (it deletes the storage too).
- **[low] [consistency]** `dashboard/components/dither-kit/grid.tsx:30` — The kit's Grid (`stroke-border`) and ReferenceLine (`stroke-muted-foreground/60`, `fill-muted-foreground`, reference-line.tsx:15,43) rely on shadcn color tokens. tailwind.config.js does not map them (the CSS variables --border and --muted-foreground exist at globals.css:54,62 but are not wired into theme.colors), and the compiled CSS has 0 'stroke-border' rules. If adopted as-is, grid and reference lines render with no stroke, i.e. invisibly. In addition, tailwindcss-animate and @tailwindcss/typography are installed but `plugins: []` (tailwind.config.js:141), so `animate-in` and `prose` classes would silently no-op.
- **[low] [code-structure]** `dashboard/dither-kit.json:1` — The lockfile is already stale: 20 of 28 file hashes mismatch the files on disk, and scales.ts was patched on purpose in commit 16af204. Re-running the registry installer (components.json registers '@dither-kit': 'https://tripwire.sh/r/{name}.json') could silently revert that crash fix. Polar root, context and helpers are vendored without a Pie or Radar painter, so they are unusable, and no bar chart is vendored even though chart-context supports 'bar'.
- **[low] [performance]** `dashboard/components/dither-kit/cartesian-canvas.tsx:118` — Every dither-kit cartesian canvas runs a perpetual requestAnimationFrame loop (re-scheduled at the top of every draw so the stars twinkle), with no IntersectionObserver or document.hidden pause. The global Dither WebGL background (reactbits/Dither.jsx:175) also runs continuously. A KPI row with 4-6 dithered sparklines plus a main chart would add 5-7 always-on RAF loops on top of the WebGL wave.
- **[low] [code-structure]** `dashboard/components/PerformanceMetrics.tsx:13` — The dead components contain visible bugs that must not be ported. PerformanceMetrics renders a stray 'ß' (:13) and 's' (:17) in its empty state. QueueVisualization builds `status-${color}` and produces 'status-success', which globals.css does not define (only status-good, status-warning, status-danger and status-info, :124-138). RealtimeChart's flow and fps charts plot 'frames_added', 'frames_consumed' and 'generation_fps', keys absent from the chartData built at :35-41, so the lines are empty. useRealtimeWebSocket.ts:6 names seconds `TOKEN_EXPIRATION_MS` and puts the JWT in the WebSocket query string.
- **[low] [states]** `dashboard/convex/twitchStats.ts:4` — `twitchStats.record` has no requireIdentity check, unlike clips and recordings, and every open analytics tab records one sample per 30s poll (analytics/page.tsx:66-77). Two open tabs double the samples and put near-duplicate points into the 24h chart. The live thumbnail is cache-busted on every poll (:206) and swaps with no crossfade, which reads as a flash every 30s.

## Redesign opportunities
### Unify on the dithered pixel aesthetic: an app-level chart layer over a frozen dither-kit (transformative)
Delete recharts and the dead LTX cluster. Build `components/charts/` as the only place pages import charts from, and never hand-edit `components/dither-kit/*`. Wrappers:
- `<TimeSeriesPanel>`: AreaChart plus Area, XAxis, YAxis and Tooltip. Takes a module-level `const VIEWERS_CONFIG = { viewers: { label: 'Viewers', color: 'blue' } } satisfies ChartConfig` instead of an inline object. Uses an integer `tickFormatter` on YAxis (`v => Number.isInteger(v) ? v.toLocaleString() : ''`) and an XAxis tickFormatter that adds the day at midnight boundaries.
- `<KpiSparkline>`: the kit's Sparkline, variant gradient, bloomOnHover, with `hovered` driven by the tile hover.
- `<ChartFigure>`: the accessibility wrapper described in the keyboard-access opportunity below.
To stop the 30s entrance replay, pass `animate` only for the first paint: `animate={!hasPlayedRef.current}`, then set the ref after the first `ready`. Or keep data identity stable until a sample with a new capturedAt arrives. Render offline periods as a second grey series (`offline: { color: 'grey' }`) so off-air stretches read as a dim dither band instead of a zero cliff. Map the shadcn tokens in tailwind.config.js (`border: 'var(--border)'`, `'muted-foreground': 'var(--muted-foreground)'`, plus dark values) so the kit's Grid and ReferenceLine actually render. Then add `<ReferenceLine y={peak} label={`PEAK ${peak}`}>`. If bars are needed (clips per session, viewers per hour), install the bar family through the registry (`npx shadcn add @dither-kit/bar-chart`; availability not verified). Re-apply the scales.ts patch from commit 16af204 afterwards and regenerate the dither-kit.json hashes with a small script so the lockfile becomes truthful again.

### Broadcast-ops analytics: ON-AIR strip plus KPI tiles with dithered sparklines and count-up numbers (transformative) — CSV: Count Up, Counter, Split Flap Text, Decrypted Text, Scanner, Radar, Spotlight Card, Border Glow
Rebuild /admin/analytics as a broadcast control-room page in three tiers.

(1) ON-AIR STRIP, a sticky glass bar at the top:
- A `<TallyLight>` with states LIVE (red core, 1.6s soft pulse, with 'ON AIR' in pixel-mono caps), STANDBY/OFFLINE (dim grey), NOT CONFIGURED (amber, with a 'Setup' link to env docs), ERROR (red outline, no pulse) and STALE (data older than 2×POLL_MS, hatched).
- The channel avatar (Twitch image; fallback `<DitherAvatar name={channel}>`) and the display name as h1.
- A 'twitch.tv/{channel}' external link.
- A category chip that uses SplitFlapText when the category changes.
- The title with a two-line clamp.
- A client-side ticking uptime clock (`HH:MM:SS`, tabular-nums), derived from `startedAt` every second rather than every poll.
- 'Updated 12s ago'.
- A Refresh icon button that spins while in flight and is disabled meanwhile.

(2) KPI ROW: 4-6 tiles in `grid-cols-2 lg:grid-cols-4`. Each has an uppercase 11px label with tracking-[0.14em], a 40-48px display number in font-mono tabular-nums animated with CountUp (duration ≈ 600ms, easeOut; skipped under reduced motion), a delta chip (▲ +12 vs 5 min ago, colored by sign rather than by metric), and a full-bleed `KpiSparkline` pinned to the tile bottom (h-10, last 60 samples, color per metric: viewers blue, followers pink, uptime green, peak orange). Suggested tiles: Viewers now, Peak today, Avg viewers 24h, Followers (+Δ since stream start), Uptime, Samples/health.

(3) MAIN GRID `lg:grid-cols-[1fr_360px]`: the 24h TimeSeriesPanel on the left (h-[280px], bloom 'aura' in dark and 'off' in light). The right rail holds the live preview: the thumbnail with a crossfade swap (preload `new Image()`, then swap on load), a subtle scanline overlay and a LIVE tally in the corner. When offline, the rail shows a Coast 'standby' card.

Only status changes are announced via aria-live='polite', never each viewer tick.

### Premium media library for Clips: contact sheet with hover-scrub, poster frames, duration and status badges (transformative) — CSV: Masonry, Amo hover button, Ghosty reveal, Pixel Transition, Animated List, Fade Content, Glare Hover
Replace the PixelCard grid with a `<MediaGrid>` of `<MediaCard>`s.

POSTER: prefer a stored poster (see refactor notes: optional `posterStorageId`, captured at segment rotation by reusing DirectorPlayer's captureFrame drawImage/toBlob path at :749-760 as WebP q≈0.8). Fallback 1: lazily seek a hidden `<video preload="metadata">` to 0.1s when the card enters the viewport (IntersectionObserver), draw it to a canvas and keep an objectURL in an in-memory LRU. Fallback 2: a `<DitherGradient from={hue(sessionId)} direction='up'>` plate with the segment number in pixel type. Posters fade in with a soft 'ghost' mask reveal of about 400ms.

HOVER-SCRUB: on pointerenter, mount a muted, playsInline `<video preload="auto">`. Map pointer x to `currentTime = (x/width) * durationSeconds`, using the stored durationSeconds because the WebM header is unreliable. Show a 2px scrub progress bar and the timecode. On leave, unmount the video and return to the poster. Touch devices get tap-to-preview instead.

BADGES:
- Bottom-right duration badge `00:12` (mono, tabular, bg-black/70, 4px radius).
- Top-left status badge: CAPTURING (red pulsing dot, when `!url && durationSeconds === 0` and the session is live or createdAt is under 10 min old); UPLOAD FAILED / METADATA ONLY (amber hatched); NEW (for clips arriving after page load).
- Top-right 'v{promptVersion}' chip.

CAPTION: the prompt with a two-line clamp, selectable, with a copy button (lucide Copy) and a relative time ('3m ago', full timestamp in `title`).

PAGE CHROME: an h1 'Clips' with an eyebrow 'ARCHIVE'; a results count ('Latest 100'); filter chips (All / Has media / Capturing / Failed; source); prompt search; a density toggle (Contact sheet 4-6 cols at 16:9 / Comfortable 3 cols / List) via LayoutGrid and GalleryVerticalEnd icons; and group-by-session sections with sticky headers ('Session 3f2a91c0 · 14 clips · 6m 12s · Sep 24'). New rows arriving while scrolled show a floating 'N new clips ↑' pill instead of shifting the grid. Clicking a card opens a lightbox player with ←/→ navigation, Space, Esc, J/K/L, a copy-prompt button, and a Download that fetches to a blob and uses an objectURL with an extension derived from mimeType. Paginate with a 'Load more' button or an IntersectionObserver sentinel (see refactor notes).

### Recordings as a tape vault: filmstrip scrub rows, correct download, safe delete (high) — CSV: Animated List, Spotlight Card, Fade Content
Each recording becomes a wide row (`grid-cols-[minmax(280px,420px)_1fr]`; stacked below md). On the left is the poster with hover-scrub (the same `HoverScrubVideo` primitive as Clips) and a duration badge. On the right:
- The title as h2 (fallback 'Director session · Sep 24, 21:04' instead of 'director recording').
- A `<dl>` of chips: Duration, Size, Format (derived: 'WebM · VP9' from 'video/webm;codecs=vp9,opus'), Session (copyable short id).
- A lazily generated 8-frame filmstrip below the metadata, which doubles as a seek bar into the lightbox.

Actions are 36px icon+label buttons. 'Download' fetches the file to a Blob and saves `recording-{date}-{id}.{ext}`, with the extension mapped from mimeType (webm or mp4), and shows a progress state. 'Delete' opens a custom confirm dialog (focus trapped; Esc cancels; a destructive button reading 'Delete permanently'), then shows an optimistic 'Deleting…' row state, and on failure an error toast carrying the mutation message. Rows are grouped by day with sticky headers, and there is a total-storage summary chip at the top ('12 recordings · 3.4 GB').

### Dithered skeletons and a branded 'Tuning in…' loader for data states (high) — CSV: Pixel Swap, Faulty Terminal, Scanner, Decrypted Text
Add `components/states/DitherSkeleton.tsx`: a grey Bayer-ordered shimmer (reuse `BAYER4` and `rgb` from dither-kit/pixel.ts and palette.ts in a new component, not by editing the kit). A dither threshold sweeps left to right about every 1.4s; under reduced motion it becomes a static 40% dither. Use shape-matched skeletons:
- MediaCard: a 16:9 plate, two text bars and a badge stub.
- Recordings row: a poster, three chips and two buttons.
- KPI tile: a label bar, a large number block and a sparkline strip.
- Chart: an axis frame and a flat dither band.
For the first analytics fetch, show 'TUNING IN…' in pixel type over a short looping Coast motion asset (MiniMax H3 Max, see the next opportunity) inside a CRT-framed 16:9 slot. The loop is muted and autoplays with playsInline, and its poster is a still for reduced motion. Skeletons must render when `useQuery` returns `undefined`, which fixes the blank-card loading bug.

### Coast-illustrated empty, offline, not-configured and auth states (fal-generated assets) (high) — CSV: Amo hover button, Ghosty reveal
Replace the lucide-icon empty states with a shared `<StateCard art=… title=… body=… action=…>` that uses generated brand art. Stills come from GPT Image 2.5 Sunburst `/edit` (openai/gpt-image-2.5/sunburst/edit) with the Coast character sheet as the identity reference. Motion loops come from MiniMax H3 Max using the still as the first frame. Every prompt should say 'limited 4-color ordered-dither palette matching deep navy #0a0d14 and chrome blue #4f83cc, 2px pixel grain, generous negative space on the left for UI text'. Assets:
- clips-empty: Coast holding a clapperboard under a single spotlight.
- recordings-empty: Coast sliding a VHS tape into a deck, with the REC light off.
- analytics-not-configured: Coast plugging a patch cable into a broadcast patch bay, with one amber light.
- analytics-offline (standby card): Coast asleep at an ON-AIR desk with the sign dark.
- auth-required: Coast at a studio door with a keycard.
- capturing-loop (H3 Max, 3s, seamless): Coast's eyes blinking in a CRT with scanlines. This one is used for the CAPTURING badge hover and the 'Tuning in' loader.
Delivery specs: stills at 1600x1000 WebP under 150KB, stored in `public/brand/states/*.webp` with light and dark variants or a single dark-safe version. Loops as MP4 (H.264) plus WebM at 480p, 3-4s, under 700KB, muted, with a poster frame. Keep all copy as live text, never baked into images. Keep the existing actionable text: 'Use “Record” on the Director player, then “Stop & save recording”', and the verbatim API error strings.

### Glass panels over the dither wave with a coherent token set (high) — CSV: Border Glow, Spotlight Card
On data pages, stop hiding the required DitherBackground behind opaque cards. Introduce `.panel`: dark `bg-[#0a0d14]/72 backdrop-blur-md border border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]`; light `bg-white/78 border-black/[0.06]`. Give it one radius (12px) shared by cards and media, and 24px internal padding (16px on mobile). Remove the nested same-color boxes (ViewerChart.tsx:54) and the prompt gray boxes; use hairline dividers instead. Typography:
- Page h1 at 28-32px Focal medium (weight 500), with an 11px mono uppercase eyebrow ('ARCHIVE / CLIPS', 'ON AIR / TWITCH').
- Section h2 at 18px.
- Numbers in JetBrains Mono tabular-nums.
Semantic state tokens in tailwind.config.js: `onair` (#ef4444 core with #ff6b6b glow), `standby` (#9ca3af), `setup` (#eab308), `ok` (#22c55e), `info` (fal-primary #4f83cc). Either add `fal-purple` or migrate those usages to fal-primary, and add dark overrides for `.connection-*` so they pass AA (for example `dark:text-fal-green-400` at about 8:1). Color KPIs by semantic meaning (delta up or down), not by arbitrary metric hue.

### Accessible, keyboard-scrubbable charts without touching the vendored kit (medium) — CSV: Crosshair
`<ChartFigure title summary data format>` renders `<figure aria-labelledby aria-describedby>` with:
- a visible h3 title;
- a one-line generated summary ('Now 96 viewers · peak 142 at 21:04 · avg 88 over 24h');
- a visually hidden `<table>` of downsampled points (≤48 rows);
- a focusable plot container (`tabIndex=0`, `aria-roledescription='interactive chart'`) where ←/→ step, Shift+←/→ jump 10 and Home/End go to the ends. Keys drive the kit's controlled `markerIndex` prop (cartesian-root.tsx:49) and `onHoverChange` mirrors the pointer.
Because the kit Tooltip only appears on `hoverIndex` (tooltip.tsx:31), render the value in an adjacent always-visible live readout ('21:04 — 142 viewers') tied to the marker, which is also a better broadcast-style readout than a floating card. Honor reduced motion by passing `animate={false}` when `matchMedia('(prefers-reduced-motion: reduce)')` matches.

### Shared live-tally and freshness primitives across data pages (medium) — CSV: Star Border
Create `components/broadcast/TallyLight.tsx` (props: state 'live'|'standby'|'setup'|'error'|'stale'|'capturing'; size sm|md) and `FreshnessStamp.tsx` ('Updated 12s ago', ticking every second via one shared interval; turns amber when older than 2×POLL_MS). Use them in the analytics ON-AIR strip, the Clips CAPTURING badge and any Director-session header. States are announced once through a single `aria-live='polite'` region. The LIVE pulse is a pure-CSS keyframe with a `motion-reduce:animate-none` fallback. This removes the misleading red 'OFFLINE' shown when Twitch is simply not configured.

### Dev-only visual fixture for every data-page state (medium)
Extend the existing dev-only /admin/visual-test pattern (visual-test/page.tsx:5 calls notFound() in production) with a `DataPagesVisualFixture`. It renders the presentational components with fixture data:
- Clips: with media, capturing (url null, duration 0, fresh), failed (url null, duration > 0), a portrait 9:16 clip and a long prompt.
- Recordings: webm and mp4, a missing url, and a very large size.
- Analytics: live (high and low viewers), offline, not configured (503 message), error, stale, followers null, a long game name, and a 24h series with gaps.
The presentational components must take plain props, and Convex/Twitch wiring stays in the page containers. This lets the redesign be screenshot-verified without FAL, Convex or Twitch credentials, consistent with the admin-testing skill's unconfigured-testing rules.

### Session reels: clips as a direction timeline (polish) — CSV: Pixel Transition
Within each session group on /admin/clips, add a horizontal 'reel' strip: one segment per clip, with width proportional to durationSeconds and a dither fill colored by status. It is a scrubbable overview of how the Director stream evolved prompt by prompt (promptVersion). Hovering a segment shows its prompt; clicking scrolls to or opens that clip. The strip is a flex row of `DitherGradient` blocks, which is cheap because it paints statically with no RAF (gradient.tsx:44-47). This turns an undifferentiated grid into a story of the broadcast.

## States inventory
CLIPS (dashboard/app/admin/clips/page.tsx)
- Convex not configured: `<ConvexNotConfigured feature="clips"/>` (:87). This is components/ConvexNotConfigured.tsx: a single fal-card with a Database icon at 50% opacity, bold "Convex is not configured", and "Set NEXT_PUBLIC_CONVEX_URL to enable clips. Run npx convex dev in dashboard/ to create a deployment."
- Loading (useQuery returns undefined): the header right side reads "Loading…" (:21). The body goes to the grid branch (:26 condition false) and renders an empty grid, so the card is blank. There is no skeleton.
- Unauthenticated: convex/clips.ts:52 returns [], so the page shows the empty state. It is indistinguishable from "no data".
- Empty: a centered Film icon (w-12, 50% opacity), "No clips yet", and "Start an LTX stream or a Director session to populate clips" (:26-31). The LTX wording is stale.
- Populated: a 1/2/3-column PixelCard grid (:33). Index 0 gets `pixel-card-latest` (a green border, plus a green 8% tint in dark mode; globals.css:238-244).
- Per-clip with media: native `<video controls preload="metadata">` (:44).
- Per-clip without media: "No media stored for this segment" (:46-49). This covers three different real states: a segment still capturing (created with durationSeconds 0, DirectorPlayer.tsx:494), a failed upload (:446-455) and no MediaRecorder support (:389-393).
- Duration "0.0s" for capturing clips (:66).
- Session present or absent: the Layers chip is hidden when there is no sessionId (:67).
- Hover: PixelCard shimmer (blue pixels) plus a near-black ::before radial glow (PixelCard.css:28). No keyboard focus state (noFocus, so tabIndex -1).
- Reduced motion: PixelCard sets speed 0 and delay 0 (PixelCard.jsx:88-89, 166).
- Error: none. There is no ErrorBoundary; a Convex query error would throw to Next's error overlay or page.

RECORDINGS (dashboard/app/admin/recordings/page.tsx)
- Not configured: `<ConvexNotConfigured feature="recordings"/>` (:136).
- Loading: header "Loading…" (:37) and an empty `space-y-4` body (:43 condition). Blank.
- Unauthenticated: an empty list (convex/recordings.ts:135), shown as the empty state.
- Empty: a Video icon, "No recordings yet", and 'Use “Record” on the Director player, then “Stop &amp; save recording”' (:44-48). These labels match DirectorPlayer.tsx:1270 and :1282.
- Populated: a vertical list; index 0 gets `pixel-card-latest`.
- Media URL null: "Media unavailable" (:64). Unlikely, since storageId is required and url comes from storage.getUrl.
- Title missing: shows `${model} recording` (:72).
- Session missing: shows '—' (:97).
- Download: rendered only if url is set (:103). It is effectively broken (cross-origin, hard-coded .webm).
- Deleting: a native confirm (:115). No pending, success or failure UI; the row disappears when the reactive query updates. An auth failure becomes an unhandled promise rejection.
- Hover and reduced motion: same PixelCard behavior as Clips.

ANALYTICS (dashboard/app/admin/analytics/page.tsx)
- Initial loading (`loading=true`, data null): subtitle "Loading…" (:140), a gray avatar disc (:133), a red "OFFLINE" pill (:146-151, because data?.isLive is falsy), all KPIs '—', and ViewerChart showing "Collecting samples…" (ViewerChart.tsx:68-70).
- Twitch not configured (503): the error line under the header shows the verbatim server message, 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured' or 'TWITCH_CHANNEL is not configured' (route.ts:79-85; rendered at :162-167, red, AlertCircle). The subtitle reads "Not configured" (:140). The pill still says "OFFLINE". KPIs stay '—' and the chart says "Collecting samples…" forever. Polling continues every 30s.
- Channel not found (404): the error `Twitch channel "x" not found`; otherwise the same as above.
- Upstream error (502): the error message; any previous `data` stays displayed with no staleness indicator.
- Live: a green LIVE pill; KPIs filled; the stream title/thumbnail card appears (:200-220), with the thumbnail re-fetched every poll via `?t=capturedAt` (a hard swap).
- Offline (configured): the red OFFLINE pill; viewers show "0"; uptime and category '—'; the thumbnail card is hidden; the chart shows 0-viewer samples.
- Followers unavailable (followerCount null): '—' (:182).
- Convex disabled: the chart uses local samples only, titled 'Viewers (this session)' (:224); capped at 240 samples (:103).
- Convex enabled with more than one persisted sample: 'Viewers (last 24h, Convex)'.
- Chart with fewer than 2 points: "Collecting samples…".
- Chart hover: the kit tooltip (spring-animated card) with heading = time and "Viewers N". The bloom 'aura' is always on.
- Chart data update: the 900ms entrance sweep replays on every new samples array (every 30s).
- Refresh: no in-flight or disabled state; no hover in dark mode.
- Reduced motion: the kit snaps (cartesian-canvas.tsx:62-64). The Tooltip's motion spring does not check reduced motion.

LEGACY or DEAD (not rendered; listed so they are not mistaken for live surfaces)
- PerformanceMetrics "No performance data available" (with stray 'ß' and 's', :13-17).
- QueueVisualization "No queue data available" and statuses EMPTY/LOW/GOOD (unstyled 'status-success').
- AIPerformanceBreakdown "No pipeline data available" and "Processing..."/"Idle".
- GenerationHistory "No generations yet" / "Start streaming to see generation parameters" and the LATEST pill.
- RealtimeChart "No data available".
- useRealtimeData/useRealtimeWebSocket: isConnected/error states, including 'Connection lost. Maximum reconnect attempts reached.' and 'Authentication failed: …'.

## Invariants
- Keep the global React Bits Dither background: app/layout.tsx:37 `<DitherBackground />`, rendered as `fixed inset-0 -z-10 pointer-events-none` with aria-hidden (DitherBackground.tsx:23). Its tint follows the `dark` class via a MutationObserver; do not remove or cover it with fully opaque full-page layers.
- Keep the routes /admin/clips, /admin/recordings and /admin/analytics, and the AdminNav tab labels 'Clips', 'Recordings', 'Twitch Analytics' plus nav aria-label="Admin sections" (AdminNav.tsx:12-14, :21). README.md:142-144 documents these routes.
- Convex gating: Clips and Recordings must keep `useConvexEnabled()` and render `<ConvexNotConfigured feature="clips"|"recordings" />` when Convex is off, with its strings 'Convex is not configured', 'NEXT_PUBLIC_CONVEX_URL' and 'npx convex dev'. The admin-testing skill exercises unconfigured states. Analytics must keep working WITHOUT Convex (local samples) and mount ConvexHistory only when convexEnabled (analytics/page.tsx:122).
- Convex calls and args: `useQuery(api.clips.list, { limit: 100 })`, `useQuery(api.recordings.list, { limit: 100 })`, `useMutation(api.recordings.remove)` called as `{ recordingId }`, `useMutation(api.twitchStats.record)` with {channel, viewerCount, followerCount?, isLive, title?, gameName?}, and `useQuery(api.twitchStats.history, latest ? { channel, sinceMs: latest.capturedAt - 24h } : 'skip')`. Keep the window anchored to `latest.capturedAt` rather than Date.now() so query args change only once per poll (comment at :59).
- Twitch polling contract: `fetch('/api/twitch', { cache: 'no-store' })` every POLL_MS = 30_000 ms. Show server `body.error` messages verbatim (e.g. 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured', 'TWITCH_CHANNEL is not configured', 'Twitch channel "x" not found'). Keep the lastRecordedRef de-duplication of Convex writes, the localSamples cap of 240, and the rule 'use persisted history only when it has more than 1 sample, else local samples' (:118).
- Types: keep `export interface ViewerSample { capturedAt; viewerCount; isLive }` exported from components/ViewerChart (imported by analytics/page.tsx:8), or re-export it if the chart moves. `TwitchAnalytics` is type-imported from app/api/twitch/route.ts; do not change the API response shape.
- Stream thumbnail freshness: keep a cache-buster tied to capturedAt (`${thumbnailUrl}?t=${capturedAt}`) or an equivalent; route.ts:122 fixes the 640x360 size.
- Ordering and highlight semantics: lists are newest-first (by_createdAt desc), and index 0 is highlighted as latest (`pixel-card-latest` today). Preserve a 'latest/new' treatment even if PixelCard is replaced.
- Clip label logic: show `segment v{promptVersion}` when promptVersion is defined, else `chunk #{chunkIndex}`. Show the prompt text, the durationSeconds-based duration, the session short id (first 8 chars plus an ellipsis, with the full id in title), and the clip source.
- Recording title fallback: `recording.title ?? <model-based label>`. Duration via formatDuration semantics (h/m/s); size via formatBytes (KB/MB/GB).
- Recording deletion must stay behind an explicit confirmation step and stay permanent (convex/recordings.ts remove also deletes storage). The confirm copy 'Delete this recording permanently?' may change, but the confirmation must not be removed.
- Empty-state guidance must reference the real Director controls, whose labels are “Record” and “Stop & save recording” (DirectorPlayer.tsx:1270, :1282). If those labels change there, update the copy.
- Console hygiene: the admin-testing skill (SKILL.md step 6) expects only a React DevTools info message per page. Do not wire useRealtimeData or useRealtimeWebSocket (1s polling plus emoji console.logs), and add no console.log noise in new components.
- Reduced motion: the dither-kit (prefersReducedMotion in dither-paint.ts:173, pixel.ts:105) and PixelCard (PixelCard.jsx:134-136) already honor prefers-reduced-motion. Every new animation (count-up, hover-scrub autoplay, tally pulse, skeleton shimmer, H3 motion loops) must have a static fallback.
- Theme: `darkMode: 'class'` (tailwind.config.js:3) with the pre-paint themeInit script in app/layout.tsx:11-19 reading localStorage 'theme'. New surfaces must look correct in both themes; the kit's colour-vs-opacity rule (dither-paint.ts:32-40) is the model to follow.
- dither-kit is a vendored registry (`components/dither-kit/*`, `dither-kit.json`, components.json registry '@dither-kit'). Do not hand-edit kit files; compose wrappers elsewhere. scales.ts carries a deliberate crash fix (commit 16af204) that a registry reinstall would revert. ChatSteerer (DitherAvatar), DirectorPlayer (DitherButton, DitherGradient) and ViewerChart depend on the kit.
- There are no data-testid, aria-label or role hooks on these pages today (verified by grep), so no tests depend on DOM structure. If you add hooks, use stable names (e.g. data-testid='clip-card', 'clip-status-capturing', 'recording-row', 'recording-download', 'recording-delete', 'kpi-viewers', 'onair-tally', 'viewer-chart') and keep them stable afterwards.
- The Next.js pages are client components ('use client'). There is no Suspense or server data loading here; keep Convex React hooks inside ConvexClientProvider (layout.tsx:65).

## Refactor notes
1) DELETE BEFORE REDESIGNING (verified dead: zero importers).
- components/RealtimeChart.tsx, PerformanceMetrics.tsx, QueueVisualization.tsx, AIPerformanceBreakdown.tsx, GenerationHistory.tsx.
- hooks/useRealtimeData.ts, hooks/useRealtimeWebSocket.ts.
- Then remove `recharts` from package.json. It is only referenced by RealtimeChart.tsx:3, so it is not in any route bundle today; removing it cuts install weight and ambiguity.
- utils/falApi.getMetrics becomes unused, as do the types.ts exports ComponentMetrics, RTMPMetrics, VideoMetrics, PromptMetrics, GeneratorMetrics, OverlayMetrics, TwitchMetrics, GenerationParams, RealtimeData, WebSocketMessage and GenerationHistoryProps. Re-grep before pruning, because TestControlPanel.tsx imports other LTX types from the same file; confirm separately whether it is still mounted.
- Update README.md:238-247, which documents getMetrics.

2) NEW FOLDERS (presentational components take plain props; pages stay thin containers):
- `components/charts/`: TimeSeriesPanel, KpiTile, KpiSparkline, ChartFigure (a11y), useFirstPaintAnimate, useInViewport (pauses decorative charts offscreen by unmounting or swapping them for a static DitherGradient). Configs are module-level constants typed `satisfies ChartConfig`.
- `components/media/`: MediaGrid, MediaCard, HoverScrubVideo, PosterImage (with the DitherGradient fallback), DurationBadge, MediaStatusBadge, MediaLightbox, SessionGroupHeader, NewItemsPill, useVideoPoster (lazy poster extraction plus an LRU of object URLs, revoked on unmount).
- `components/broadcast/`: TallyLight, FreshnessStamp, OnAirStrip, UptimeClock.
- `components/states/`: StateCard (art/title/body/action), DitherSkeleton variants, ErrorBanner.
- `lib/format.ts`: formatBytes (merges recordings/page.tsx:10 and DirectorPlayer.tsx:76), formatDuration and formatUptime (merges recordings :16 and analytics :14), formatTimecode (mm:ss), formatRelativeTime, formatMime ('video/webm;codecs=vp9,opus' becomes 'WebM · VP9'), extFromMime, labelForSource ('director' becomes 'Director').
- `lib/download.ts`: fetch to Blob, then objectURL, then an `<a download>` click, then revoke. This fixes the cross-origin Convex download.

3) PAGE SPLIT. Each page becomes a data hook plus a view.
- `useClipsLibrary()` wraps useQuery, then memoized grouping by sessionId, filters, search, derived status (capturing/failed/ready) and new-since-mount tracking.
- `useRecordings()` exposes rows plus a `deleteRecording(id)` wrapper that returns a promise with error surfacing.
- `useTwitchAnalytics()` owns the poll/local-samples/Convex-history logic currently inline in analytics/page.tsx:86-118 and ConvexHistory :51-84. Keep ConvexHistory's behavior identical, including the sinceMs anchoring.
Pages then only compose views, which also enables the dev-only fixture page (extend app/admin/visual-test with a DataPagesVisualFixture that feeds the same views with fixture props).

4) PIXELCARD. It is vendored JSX with `// @ts-nocheck`. Its `user-select: none` (PixelCard.css:19), unused activeColor and random-square dialect clash with the dither-kit. Drop it from the data pages rather than patching it; if a pixel hover is still wanted, use a static DitherGradient overlay whose opacity animates. If kept elsewhere, fix it by setting `style={{ '--pixel-card-active-color': variantCfg.activeColor }}`, but the file is vendored, so note the patch.

5) TAILWIND and CSS HYGIENE.
- Add `fal-purple` (or replace its 8 usages with fal-primary).
- Map `border` and `muted-foreground` colors to the CSS variables so kit Grid and ReferenceLine render.
- Register `tailwindcss-animate` in plugins if animate-in utilities are used (it is currently `plugins: []`).
- Add `.dark .connection-*` overrides.
- Fix the `hover:… dark:bg-…` pattern (analytics :155; AdminNav.tsx:31 has the same unscoped `dark:text-fal-gray-50` issue); it should be `dark:hover:`.
- Replace long inline className strings with small `cn()` variant maps; lib/utils.ts and dither-kit/lib.ts both provide clsx plus tailwind-merge.

6) BACKEND TOUCHPOINTS (optional, widen-only, no migration needed).
- Add an optional `posterStorageId: v.optional(v.id('_storage'))` to clips and recordings.
- Resolve `posterUrl` in clips.list and recordings.list next to `url`.
- Capture the poster in DirectorPlayer at segment rotation or at record stop, reusing captureFrame's drawImage/toBlob path (DirectorPlayer.tsx:749-760) with 'image/webp'.
- Add paginated variants (`listPage` with paginationOpts, for usePaginatedQuery) and keep `list({limit})` for back-compat.
- Consider adding requireIdentity to twitchStats.record and a per-channel minimum interval (for example, skip inserts within 20s of the last row) so multi-tab sessions do not double the samples.

7) DITHER-KIT LOCKFILE POLICY. dither-kit.json is already stale (20/28 hashes mismatch). Add a tiny script (e.g. scripts/dither-kit-hash.mjs) that recomputes sha256 per listed file, and record intentional local patches (scales.ts in commit 16af204) in a comment block at the top of the patched file. Only then add new registry components (bar-chart, if available) so a reinstall cannot silently revert fixes.

8) PERFORMANCE BUDGET.
- Media grids: only posters and badges render by default; `<video>` elements mount on hover or lightbox; aim for at most 1-2 active video elements at a time.
- Decorative sparklines must pause offscreen, because the kit RAF loop is perpetual (cartesian-canvas.tsx:117-118).
- Show at most one bloom 'aura' chart per viewport.
- Keep Convex list sizes at 24-48 per page.
