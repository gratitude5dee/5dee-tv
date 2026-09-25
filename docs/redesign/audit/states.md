# Audit: Cross-cutting sweep of loading, empty, error, pending, not-configured and motion states across dashboard/app and dashboard/components, plus a proposed signature loading-animation system for wzrd.tech / 5DEE

## Files read
- dashboard/app/layout.tsx
- dashboard/app/page.tsx
- dashboard/app/globals.css
- dashboard/app/admin/layout.tsx
- dashboard/app/admin/page.tsx
- dashboard/app/admin/analytics/page.tsx
- dashboard/app/admin/characters/page.tsx
- dashboard/app/admin/clips/page.tsx
- dashboard/app/admin/locations/page.tsx
- dashboard/app/admin/recordings/page.tsx
- dashboard/app/admin/shotboard/page.tsx
- dashboard/app/admin/visual-test/page.tsx
- dashboard/components/DitherBackground.tsx
- dashboard/components/reactbits/Dither.jsx
- dashboard/components/reactbits/Dither.css
- dashboard/components/reactbits/PixelCard.jsx
- dashboard/components/reactbits/PixelCard.css
- dashboard/components/reactbits/AccordionGallery.jsx
- dashboard/components/reactbits/AccordionGallery.css
- dashboard/components/reactbits/ChromaGrid.jsx
- dashboard/components/reactbits/ChromaGrid.css (transition/@media rules)
- dashboard/components/reactbits/MorphSlider.tsx
- dashboard/components/reactbits/MorphSlider.css
- dashboard/components/ConvexClientProvider.tsx
- dashboard/components/ConvexNotConfigured.tsx
- dashboard/components/AdminNav.tsx
- dashboard/components/ThemeToggle.tsx
- dashboard/components/DirectorPanel.tsx
- dashboard/components/DirectorPlayer.tsx
- dashboard/components/DirectorSettingsForm.tsx (lines 95-140)
- dashboard/components/TrackManager.tsx
- dashboard/components/AssetUrlInput.tsx
- dashboard/components/ChatSteerer.tsx
- dashboard/components/TwitchBroadcast.tsx
- dashboard/components/ScriptEditor.tsx (lines 1-60)
- dashboard/components/ScriptTemplatePicker.tsx
- dashboard/components/ViewerChart.tsx
- dashboard/components/CharacterLibraryPage.tsx
- dashboard/components/LocationLibraryPage.tsx
- dashboard/components/ReferenceAssetManager.tsx
- dashboard/components/AssetStudioVisualFixture.tsx
- dashboard/components/shotboard/ShotboardPage.tsx
- dashboard/components/shotboard/ShotCard.tsx
- dashboard/components/shotboard/SceneGallery.tsx
- dashboard/components/shotboard/SceneSection.tsx
- dashboard/components/shotboard/SceneSidebar.tsx
- dashboard/components/shotboard/CharacterPanel.tsx
- dashboard/components/shotboard/useShotboard.ts
- dashboard/components/dither-kit/button.tsx
- dashboard/components/dither-kit/gradient.tsx
- dashboard/components/dither-kit/pixel.ts
- dashboard/components/dither-kit/palette.ts
- dashboard/components/dither-kit/avatar.tsx (lines 100-212)
- dashboard/components/dither-kit/cartesian-canvas.tsx (lines 50-200)
- dashboard/components/dither-kit/chart-context.tsx (revision/entrance logic)
- dashboard/components/dither-kit/dither-paint.ts (easing + reduced motion)
- dashboard/dither-kit.json
- dashboard/lib/imageGen.ts
- dashboard/lib/assetPlaceholders.ts
- dashboard/utils/falApi.ts
- dashboard/tailwind.config.js
- dashboard/package.json
- dashboard/next.config.js
- dashboard/middleware.ts (head)
- dashboard/convex/shotboards.ts (load query)
- dashboard/convex/clips.ts, recordings.ts, tracks.ts, assets.ts (auth guards via grep)
- dashboard/node_modules/@fal-ai/client/src/queue.d.ts
- dashboard/node_modules/@fal-ai/client/src/realtime/extension.d.ts (RealtimeState)
- dashboard/.next/static/css/app/layout.css (compiled order + token evidence)
- .agents/skills/admin-testing/SKILL.md
- docs/redesign/baseline/admin-dark.jpg
- docs/redesign/baseline/admin_shotboard-dark.jpg
- docs/redesign/baseline/admin_analytics-dark.jpg
- docs/redesign/baseline/admin_characters-dark.jpg
- docs/redesign/baseline/admin_clips-dark.jpg
- docs/redesign/component-prompts.csv

## Current state
VERIFIED FACTS (from code, compiled CSS, and the baseline screenshots in docs/redesign/baseline/):

1) Route-level states. None of app/**/loading.tsx, error.tsx, not-found.tsx, global-error.tsx or template.tsx exist (a `find` returned nothing). The only Suspense boundary is app/admin/shotboard/page.tsx:8, and it has no fallback (`<Suspense>` wrapping ShotboardPage, needed for useSearchParams). app/page.tsx redirects to /admin. app/admin/visual-test/page.tsx:5 calls notFound() in production, which falls through to Next's built-in 404 because the app has no not-found.tsx. The root layout (app/layout.tsx) is a server component. It contains an inline pre-paint `themeInit` script (lines 11-19, injected at line 34), then <DitherBackground/> (line 37), then a translucent wrapper `min-h-screen bg-fal-gray-50/60 dark:bg-[#0a0d14]/45` (line 38), an opaque #0a0d14 header with a 690 KB 1717x425 PNG logo shown at h-9 through a plain <img> (lines 40-45), and a <main> whose child uses `.fade-in` (line 64). Because the layout persists across client navigations, `.fade-in` plays once, on the first load only. There are no route transitions.

2) Global background and motion. DitherBackground.tsx loads the vendored React Bits Dither with next/dynamic `{ ssr:false }` (line 6) and no `loading` fallback. It sits in a `fixed inset-0 -z-10 pointer-events-none` host and takes its tint from a MutationObserver on the html `dark` class. Dither.jsx is plain three.js (WebGLRenderer, antialias:true, pixelRatio 1). It draws a full-screen fbm-of-fbm shader (4 octaves, nested, so about 8 cnoise calls per pixel) with an 8x8 Bayer quantize (colorNum 4, pixelSize 2), in a perpetual requestAnimationFrame loop (Dither.jsx:172-186). It exposes a `disableAnimation` prop that DitherBackground never passes, and it never reads prefers-reduced-motion. When WebGL is unavailable it bails silently (136-139) and the body background (#fff light, #0a0d14 dark) shows instead. The canvas appears after hydration with a hard cut and no fade.

3) Motion inventory.
- CSS: body color transition 0.2s (globals.css:74); `.fade-in` + `@keyframes fadeIn` at 0.5s with translateY(10px) (globals.css:167-180); `.progress-fill` transition-all 1000ms (globals.css:188, used only by dead components); btn transition-colors (199, 204).
- Tailwind config: `animation.pulse-slow` and `animation.fade-in` are defined but unused. `plugins: []` (tailwind.config.js:141), so neither tailwindcss-animate nor typography is registered even though both are installed.
- Tailwind animate-* in live code: animate-spin at AssetUrlInput:70, TrackManager:115, ReferenceAssetManager:120, CharacterLibraryPage:150,160, LocationLibraryPage:142,151, SceneSidebar:91, CharacterPanel:114, ShotCard:96. animate-pulse at DirectorPlayer:1073 (REC dot), 1094 (current connect step), 1147 (Live dot).
- Vendored CSS: PixelCard.css border 200ms and ::before opacity 800ms; ChromaGrid.css four transitions (0.25-0.5s); MorphSlider.css button/dot transitions, the only CSS reduced-motion block (106-108); AccordionGallery.css reduced-motion only removes will-change (146-150 region).
- gsap: AccordionGallery timelines (0.6s power3.out, stagger 0.06, collapses to 0 under reduced motion); ChromaGrid quickSetter spotlight (damping 0.45, fade 0.25/0.6, no reduced-motion check); MorphSlider uProgress tweens (1.1s power2.inOut, capped at 0.35s when reduced).
- motion/react: only dither-kit/tooltip.tsx (AnimatePresence).
- rAF loops: Dither.jsx:175 (perpetual); MorphSlider.tsx:255-259 (perpetual while mounted); dither-kit cartesian-canvas.tsx:118 (perpetual while a chart is mounted; with bloom 'aura' and bloomOnHover=false it redraws the bloom canvas every frame, 120-127); PixelCard.jsx:175 (runs while hovered, never idles while hovered, even with reduced motion); dither-kit button.tsx:128 (only while easing hover); dither-kit avatar.tsx:152 (600ms Bayer-order entrance per chat line).
- Timers: DirectorPlayer 1s setInterval ping plus setElapsedSeconds (1019-1032), which re-renders the whole 1342-line player every second while opening or live; analytics 30s poll.

4) WebGL contexts alive at once, per page (fact from the component graph):
- /admin: 1 (Dither) + 1 MorphSlider (TrackManager.tsx:130, only when Convex is enabled and at least one track has coverUrl) = up to 2, both perpetual loops. The page also has 2D canvases: DitherGradient (static, DirectorPlayer:1083), DitherButton (Start Director), up to 20 DitherAvatar canvases in the chat log.
- /admin/visual-test: 2 (Dither + MorphSlider, AssetStudioVisualFixture:45 section).
- /admin/shotboard, /characters, /locations: 1 (Dither), plus gsap DOM galleries. AccordionGallery instances mount inside closed <details> on every ShotCard (ShotCard.tsx:169) and every SceneSection (SceneSection.tsx:69).
- /admin/clips, /recordings: 1, plus up to 100 PixelCard 2D canvases (limit 100 queries) with 100 ResizeObservers.
- /admin/analytics: 1, plus the dither-kit area chart's perpetual 2D loop.
- React StrictMode is on (next.config.js), so dev mounts each WebGL effect twice. Neither Dither nor MorphSlider calls forceContextLoss, so disposed contexts linger until GC.
- Theme toggle: DitherBackground passes fresh array literals (lines 28-29), which changes the Dither effect deps (Dither.jsx:196) and disposes and recreates the WebGLRenderer on every toggle.

5) Loading, empty, error and not-configured treatments are plain text and inconsistent:
- Loading: 'Loading…' strings in card headers (clips, recordings, analytics subtitle, TrackManager); 'Loading shotboard…' text card; Loader2 plus text on the libraries.
- Skeletons: none anywhere.
- Empty states: centered Lucide icon at opacity-50 plus two lines (clips, recordings); dashed boxes (libraries); plain sentences (shotboard, CharacterPanel, TrackManager).
- Not configured: four variants (ConvexNotConfigured card; amber one-line card; amber inline sentence; TrackManager renders null).
- Errors: red text, red boxes, and amber text for shotboard errors. role=alert/status appears only on the library pages and ReferenceAssetManager.
- Generation in progress: a spinning Loader2 over bg-black/50 (ShotCard), or only a button label change ('Generating…', 'Expanding…', 'Remixing…', 'Capturing…', 'Negotiating…', 'Preparing…').
- lib/imageGen.ts:36 calls fal.subscribe without onQueueUpdate or logs, so no queue position or progress is available to the UI, even though @fal-ai/client 1.11.0-alpha.3 supports onQueueUpdate (queue.d.ts:45) with queue_position and logs.

6) Live Control video box (DirectorPlayer.tsx:1082-1157): a black aspect-video box with a static DitherGradient (blue, up, opacity .55, cell 4). While idle it shows 'Director offline' in small gray text (baseline screenshot admin-dark.jpg). While opening it shows a bg-black/70 panel listing CONNECT_STEPS as Circle icons: green fill when done, animate-pulse when current, gray when pending, plus an underlined 'Cancel'. While live it shows a HUD pill (red pulse dot 'Live · Ns', 'Ping · N ms', buf, gen), Capture frame / Remix frame buttons and a mute toggle. The status badge prints the raw state enum ('idle', 'opening', 'live', 'closing', 'failed', 'closed'). The <video> has no waiting/stalled handlers, so there is no buffering state.

7) Brand tokens as compiled (verified in .next/static/css/app/layout.css): `.text-fal-primary-600` = rgb(91 33 182), which is purple. The nested `fal.primary` block (tailwind.config.js:74) overrides the flattened 'wzrd chrome blue' `fal-primary` block (tailwind.config.js:27), and the screenshots show purple active tabs. `fal-purple-*` classes are referenced but never generated. `.dark *{border-color:#1f2937}` is emitted at layout.css:2079, after the utilities (e.g. .border-fal-primary-500 at :1224), so in dark mode it overrides every non-`dark:` border colour, including the active-tab underline. That underline is invisible in the dark baseline screenshots.

8) Existing primitives worth reusing (fact): dither-kit/pixel.ts exports BAYER4, clamp01, fillOf, pixelBloomStyle and pixelPrefersReducedMotion. dither-kit/dither-paint.ts exports easeOutCubic and easeInOutCubic. dither-kit/avatar.tsx already implements a 'cells materialize in Bayer order' entrance (start = BAYER4*0.7, 0.3 window, easeOutCubic, 600ms) that matches the proposed loader language. dither-kit/palette.ts PALETTE has blue fill [53,143,243], green [40,210,110], red [240,70,70] and grey [92,92,100]. The dither-kit files are hash-locked by dither-kit.json (only components/dither-kit/* paths), so import from them rather than editing them. components/reactbits/* is not in the lockfile and may be edited.

## Problems
- **[high] [states]** `dashboard/app (no loading.tsx / error.tsx / not-found.tsx / global-error.tsx anywhere)` — No route-level states at all. Convex useQuery throws query errors at render time (documented Convex behavior). For example, a malformed ?board= id fails the `v.id('shotboards')` validator (convex/shotboards.ts:136), useShotboard.ts:414-417 then throws, and with no error boundary the whole tree is replaced by Next's default client-exception screen, taking the header, nav and the Dither background with it. Client navigations between tabs also get no instant fallback while the route chunk and RSC payload load (most noticeable on first dev compile). visual-test's production notFound() (app/admin/visual-test/page.tsx:5) renders the unbranded default 404.
- **[high] [states]** `dashboard/components/shotboard/useShotboard.ts:373` — `loading = !!mirror && !!boardId && String(loadQuery?.board?._id ?? '') !== boardId` never becomes false when `api.shotboards.load` returns `{ board: null }`, which is what it returns for an unauthenticated user (convex/shotboards.ts:138) or a deleted board id. ShotboardPage.tsx:297-302 then shows 'Loading shotboard…' forever. There is no not-found or auth-required branch.
- **[high] [states]** `dashboard/app/admin/shotboard/page.tsx:8` — `<Suspense>` has no fallback. Because ShotboardPage uses useSearchParams, the server HTML for this route renders nothing inside <main>, and the entire shotboard appears in one pop after hydration with no skeleton. This is a visible blank-then-content flash.
- **[high] [a11y]** `dashboard/components/DitherBackground.tsx:24-32 + dashboard/components/reactbits/Dither.jsx:116-186` — Reduced motion is ignored by the one always-on animation. Dither supports `disableAnimation`, but DitherBackground never passes it, and even when it is set the rAF loop keeps calling renderer.render every frame (174-185). The compiled layout.css contains no prefers-reduced-motion rule, so .fade-in (globals.css:167-180), animate-spin (12 sites) and animate-pulse (DirectorPlayer:1073/1094/1147) always run. PixelCard's hover loop also never idles when reduced (speed 0 but isIdle stays false).
- **[high] [performance]** `dashboard/components/DitherBackground.tsx:28-29 -> dashboard/components/reactbits/Dither.jsx:196` — Theme toggle destroys and recreates the WebGL context. The inline array literals for waveColor and backgroundColor change the effect deps, which runs renderer.dispose() (without forceContextLoss) followed by a new THREE.WebGLRenderer. The result is a flash of the body background, context churn, and in StrictMode dev doubled contexts. Any new loader that listens for Dither readiness would also re-fire on every toggle.
- **[high] [states]** `dashboard/lib/imageGen.ts:36; dashboard/components/CharacterLibraryPage.tsx:118-144; dashboard/components/LocationLibraryPage.tsx:111-135; dashboard/components/shotboard/ShotCard.tsx:94-98; dashboard/components/shotboard/ShotboardPage.tsx:102-116` — Generation states are opaque. fal.subscribe is called with no onQueueUpdate or logs, so queued, running and position cannot be shown. The library sheet pipeline runs six stages (persistDraft → expand via Astra/GMI → fingerprint → startGeneration → generateImages → upload each → completeGeneration), yet the UI shows one Loader2 plus 'Generating character sheet…'. ShotCard shows a spinner on bg-black/50. The CharacterPanel ChromaGrid card and the SceneGallery keyframe show nothing in-frame. `imageStatus: 'failed'` is persisted (ShotboardPage.tsx:115) but no component renders it (a grep for imageStatus shows no reader in components/).
- **[medium] [performance]** `dashboard/components/reactbits/Dither.jsx:64-80,136,172-186; dashboard/components/reactbits/MorphSlider.tsx:255-259; dashboard/components/dither-kit/cartesian-canvas.tsx:118-127; dashboard/components/ViewerChart.tsx:58` — Unbudgeted continuous rendering. The full-viewport nested-fbm shader runs at 60fps with antialias:true, has no frame cap, and renders at full CSS resolution although pixelSize=2 means half resolution would look identical. MorphSlider adds a second perpetual WebGL loop on Live Control and visual-test even when idle. The analytics chart's perpetual loop copies the bloom canvas every frame (bloom='aura', bloomOnHover=false), which forces a blur(15px) re-filter each frame. Adding any WebGL loader on top would push weaker GPUs over budget.
- **[medium] [motion]** `dashboard/components/ViewerChart.tsx:23-30 + dashboard/components/dither-kit/chart-context.tsx:165-173 + dashboard/components/dither-kit/cartesian-canvas.tsx:131-135` — The chart replays its 900ms left-to-right entrance sweep on every data identity change. Each 30s poll in analytics/page.tsx:112-116 and each Convex history update builds a new chartData array, which bumps the revision, so the chart visibly re-animates twice a minute. This is repetitive, distracting motion.
- **[medium] [visual-hierarchy]** `dashboard/components/dither-kit/button.tsx:213 used at dashboard/components/DirectorPlayer.tsx:1243-1252` — The hero CTA 'Start Director' is broken. DitherButton wraps children in `<span className="relative">`, so the `flex items-center space-x-2` passed by DirectorPlayer never reaches the icon and label, and Tailwind preflight's `svg{display:block}` stacks the Play icon above the text (visible in admin-dark.jpg). The button has no pending treatment either: when state is 'opening' it is swapped out for a plain 'Stop' secondary button.
- **[medium] [consistency]** `dashboard/components/TwitchBroadcast.tsx:190,208; dashboard/components/ChatSteerer.tsx:157-164; dashboard/components/DirectorPlayer.tsx:1131,1141; dashboard/components/CharacterLibraryPage.tsx:152 ('Save source'→'Saving…'); dashboard/components/shotboard/ShotboardPage.tsx:268` — Pending states are ad hoc. Buttons change label length and therefore width (layout shift in flex rows). ChatSteerer's Connect gives no visual feedback at all, only `disabled`. Native `disabled` drops keyboard focus mid-operation. No button sets aria-busy. Twelve different Loader2 animate-spin usages, in sizes w-3, w-3.5, w-4 and w-5, are the only indicator vocabulary.
- **[medium] [a11y]** `dashboard/components/DirectorPlayer.tsx:1291-1293; dashboard/components/shotboard/ShotboardPage.tsx:290; dashboard/app/admin/analytics/page.tsx:162-167; dashboard/components/TrackManager.tsx:226; dashboard/components/TwitchBroadcast.tsx:231; dashboard/components/ChatSteerer.tsx:190; dashboard/components/CharacterLibraryPage.tsx:162-163` — Error and notice feedback is inconsistent and mostly not announced. Only the library pages and ReferenceAssetManager use role=status/alert. The DirectorPlayer error box uses `bg-red-50 border-red-200` with no dark bg variant, so it renders as a bright pink slab in dark mode. Shotboard errors are amber, the same colour as its advisory text. Library notices render at the very bottom of the page, far from the trigger, and never auto-dismiss.
- **[medium] [states]** `dashboard/components/ConvexNotConfigured.tsx:1-17 vs dashboard/components/CharacterLibraryPage.tsx:44, dashboard/components/LocationLibraryPage.tsx:43, dashboard/components/shotboard/ShotboardPage.tsx:291-293, dashboard/components/TrackManager.tsx:33, dashboard/app/admin/analytics/page.tsx:140-151 + dashboard/components/ViewerChart.tsx:67-71` — Not-configured and unauthenticated states are handled five different ways. When Twitch credentials are missing, analytics shows a red 'OFFLINE' pill plus 'Collecting samples…' that never resolves (baseline admin_analytics-dark.jpg). Unauthenticated Convex list queries return [] (e.g. convex/clips.ts:52), so a signed-out operator sees 'No clips yet' rather than 'auth required'. useCloudflareAuth exposes isLoading/isAuthenticated (ConvexClientProvider.tsx:8-29) but no UI reads it.
- **[medium] [dark-mode]** `dashboard/app/globals.css:87-89 (compiled .next/static/css/app/layout.css:2079 after utilities at :1224)` — In dark mode `.dark * { border-color:#1f2937 }` overrides every border colour that lacks a `dark:` prefix, because it has equal specificity and comes later in the output. This kills the state-carrying borders: the active tab underline (AdminNav.tsx:30 'border-fal-primary-500', invisible in the dark screenshots), selected scene (SceneSection.tsx:53), selected track (TrackManager.tsx:156), assigned-character chips (ShotCard.tsx:169), and red error borders (DirectorPlayer.tsx:1292).
- **[medium] [color]** `dashboard/tailwind.config.js:27 vs :74; dashboard/app/admin/analytics/page.tsx:177; dashboard/components/ViewerChart.tsx:44` — Brand colour collision. The flattened `fal-primary` chrome blue (#7aa5e0/#4f83cc) is overwritten by the nested `fal.primary` purple, so the compiled `.text-fal-primary-600` is rgb(91 33 182). Active tabs and focus rings therefore ship purple, not the wzrd chrome blue. `fal-purple-500` is not a defined colour, so those icon tints silently render nothing. Any new loader palette must use explicit tokens rather than fal-primary until this is fixed.
- **[low] [motion]** `dashboard/tailwind.config.js:141; dashboard/app/layout.tsx:64` — The motion infrastructure is missing. tailwindcss-animate is installed but not registered, so there are no motion tokens or easing variables and no motion-safe usage. `.fade-in` on the persistent layout plays only on the first load, so tab switches are hard cuts. There are no exit animations anywhere; for example, deleted recordings and tracks vanish instantly on Convex reactivity.
- **[low] [states]** `dashboard/components/DirectorPlayer.tsx:1084,1087` — The live <video> has no waiting/stalled/playing handlers, so a stalled WebRTC stream looks identical to a frozen frame with no buffering indicator, even though bufferDepth and genEstimate are tracked in the HUD. Inferred and not reproduced: if the SDK reports state 'closed' while connectStep >= 0, the overlay condition keeps the connect-steps panel with 'Cancel' on screen.
- **[low] [performance]** `dashboard/app/layout.tsx:45; dashboard/public/wzrdtechlogo.png; dashboard/components/DitherBackground.tsx:6` — Boot performance and first paint. The header logo is a 690 KB 1717x425 PNG displayed at 36px tall, making it the likely LCP element. The Dither canvas pops in after the dynamic chunk loads, with no fade and no SSR placeholder. There is no branded first-paint moment at all.
- **[low] [states]** `dashboard/components/shotboard/useShotboard.ts:132-150` — Optimistic writes fail silently (`void tracked.catch(() => undefined)`). There is no 'Saving… / Saved / Couldn't save' sync indicator, so failures surface only when 'Send to Director' calls flush(). pendingWritesRef.size could drive a status chip.
- **[low] [a11y]** `dashboard/components/reactbits/PixelCard.css:19; dashboard/components/reactbits/PixelCard.jsx:97-126,233-242` — `user-select:none` on every Clips/Recordings card prevents copying prompts, session ids and MIME types. VARIANTS.activeColor is never applied, so the hover `::before` radial always uses the #09090b fallback, including in light mode. The shimmer canvas paints behind the metadata text, which hurts legibility on hover.

## Redesign opportunities
### Signature boot: 'WZRD test card' CRT power-on → Bayer-resolve logo → dissolve into the live Dither wave (transformative) — CSV: Pixel Transition, Pixel Swap, Midjourney Medical's ASCII, Arcade pixel, Faulty Terminal (concept only — do not install; it is WebGL), Scanner (concept only)
WHAT: an SSR-painted, pre-hydration boot overlay that turns first load into a broadcast ident. It hands off to the existing Dither background without a second WebGL context.

IMPLEMENTATION
- In app/layout.tsx, render `<div id="wzrd-boot" aria-hidden="true"><canvas id="wzrd-boot-cv"/></div>` as the first child of <body>, before <DitherBackground/>.
- Add a ~3 KB inline `bootInit` script next to the existing `themeInit` (layout.tsx:11-19, 34) so the animation starts before React and Next chunks arrive.
- Canvas2D only. Use a cell grid with cols=ceil(innerWidth/8) and rows=ceil(innerHeight/8) (about 180x113 at 1440x900). Write cells into one ImageData (Uint32Array view), call putImageData, and CSS-upscale with `image-rendering:pixelated`. That is about 0.3ms per frame and needs no WebGL.
- Palette: sample the Dither itself so the handoff is seamless. Background rgb(5,8,15) = Dither backgroundColor [0.02,0.03,0.06]; wave rgb(51,87,168) = waveColor [0.2,0.34,0.66]; chrome #7aa5e0; highlight #e6eefc. Bars use dither-kit PALETTE fills (grey, orange, blue, green, purple, red, blue), each ordered-dithered 2-tone against the background so they read as pixels, not flat SMPTE.
- Light mode: use the light Dither tints [0.98,0.98,1.0] and [0.5,0.63,0.86].

TIMELINE (first visit per session; hard cap 1600ms)
- 0-120ms: a 2px horizontal line grows from centre, scaleX 0→1, cubic-bezier(0.2,0.9,0.1,1).
- 120-320ms: vertical open scaleY 0.004→1, cubic-bezier(0.16,1,0.3,1), with filter brightness 2.2→1 as a CRT flash.
- These two phases are pure CSS on the SSR element, so they play even before the script parses.
- 320-720ms: dithered brand bars plus a bottom PLUGE strip carrying 'stream.wzrd.tech · CH 05 · 5DEE' in JetBrains Mono. A 1-row scanline rolls at 1 row per frame.
- 720-1050ms: logo resolve. A pre-baked 1-bit wordmark mask (about 160x40 cells, base64 in the script) lights cell (x,y) when easeOutCubic(p) > BAYER8[y&7][x&7], while bar cells switch off in reverse Bayer order. This is the same 'materialize in Bayer order' idea as dither-kit/avatar.tsx:117-121.
- 1050-1400ms: handoff. On `wzrd:dither-ready` (or at the cap), clear cells in Bayer-8 order over 350ms with easeInOutCubic, revealing the live wave and app beneath. Then set display:none, set canvas.width=0 to free the backing store, and remove the node.

READINESS
- Add an `onFirstFrame` prop to components/reactbits/Dither.jsx (vendored React Bits, not in dither-kit.json) and call it once after the first renderer.render.
- DitherBackground dispatches `window.dispatchEvent(new Event('wzrd:dither-ready'))`.
- Also dispatch it in the WebGL-unavailable branch (Dither.jsx:136-139) so boot never hangs.

GATING
- Full boot only when sessionStorage 'wzrd:boot' is unset. Later reloads get a 280ms 'channel flip': 120ms static burst, then a 160ms dissolve.
- Skip entirely when `navigator.webdriver` is true or `?noboot` is present, so screenshot and test flows stay deterministic.

REDUCED MOTION
- No line/open/scanline/dissolve. Show the static logo card for at most 250ms, then fade opacity over 150ms linear, or skip it.

NO LAYOUT SHIFT
- Overlay is `position:fixed; inset:0; z-index:9999; contain:strict; pointer-events:none`.
- The app hydrates and lays out underneath immediately; nothing waits on the loader.
- It must never console.log (admin-testing skill step 6).

ASSETS
- Replace the 690 KB PNG with an SVG or ≤20 KB WebP wordmark, and derive the 1-bit mask from it.
- Optional ident: generate a Coast test-card still with openai/gpt-image-2.5/sunburst/edit, using the Coast character sheet as the image reference. Quantize it offline to the 4-colour boot palette and bake it as a 2-bit sprite. No video on boot.

### Dither skeleton system (CSS-only, zero JS, zero canvas) with layout-exact page skeletons (high) — CSV: Animated List (for the content-arrival stagger only, 30ms per item, max 8), Fade Content
WHAT: a `.skeleton-dither` primitive plus composed skeletons that mirror real DOM geometry. They replace every 'Loading…' string.

CSS (globals.css, @layer components)
- Base: `background-image:url(data:image/svg+xml,…)`, a 4x4 Bayer tile of 2px squares whose alpha = ((BAYER4 value)+0.5)/16 × 0.18.
- `background-size:8px 8px; image-rendering:pixelated; background-color:transparent`.
- Ink colour var: `--skeleton-ink: 122 165 224` (chrome #7aa5e0). Alpha: dark 0.10 / light 0.06.
- Highlight: `::after` is 300% wide and carries the same tile at 0.22/0.12 alpha, masked by linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent).
- Animate `transform: translateX(-66%)→translateX(0)` over 1400ms, `steps(28,end)`, infinite. The stepped motion reads as pixels marching rather than a smooth shimmer. It is compositor-only via will-change:transform and overflow:hidden on the host.
- Reduced motion: `::after{animation:none;opacity:0}`.

COMPONENTS (components/ui/skeleton/)
- `<SkeletonText lines w>`: line-height matched to 12/14/16px text.
- `<SkeletonMedia ratio>`, `<SkeletonStat>`, `<SkeletonCard>`.

COMPOSED, DOM-EXACT (so there is zero CLS)
- ClipsSkeleton: the same `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`, 6 cards of aspect-video plus 3 meta rows and the p-3 prompt block.
- RecordingsSkeleton: `p-4 grid lg:grid-cols-3`, video plus a 4-col meta grid.
- LibrarySkeleton: a 290px strip of 5 flex panels, the same height AccordionGallery receives.
- ShotboardSkeleton: `lg:grid-cols-[280px_1fr]`, sidebar blocks plus 2 scene rows of w-64 shot cards with h-32 frames.
- AnalyticsSkeleton: the 4 StatCards with the value bar at text-xl height, plus a 220px chart block.
- TrackListSkeleton and SheetHistorySkeleton: a grid-cols-3 aspect-square set.

WIRE-IN POINTS
- clips/page.tsx:21 and 26; recordings/page.tsx:37 and 43.
- TrackManager.tsx:121; CharacterLibraryPage.tsx:150; LocationLibraryPage.tsx:142; ShotboardPage.tsx:297-302.
- shotboard/page.tsx:8 as the Suspense fallback.
- ScriptTemplatePicker when boards===undefined. It currently flashes the 'Open shotboard editor' link.
- CharacterLibraryPage/LocationLibraryPage sheet history while history===undefined.
- analytics StatCards while loading && !data.
- New app/admin/loading.tsx using a generic header-card + content skeleton. It renders below AdminNav because the nav lives in app/admin/layout.tsx.

TIMING RULES
- A `useDelayedFlag(150ms)` hook means skeletons never flash for fast Convex cache hits. Once shown, keep them for at least 300ms.
- Exit: skeleton to content crossfade of 160ms opacity with --ease-out. No translate, so there is no shift.

A11Y
- Container `aria-busy=true`, plus one sr-only `role=status` ('Loading clips…').

### Generation-in-progress 'Signal Resolve': queue-aware progressive dither → de-rez reveal for fal images (transformative) — CSV: Halftone Reveal (concept), Pixel Transition, Ghosty reveal (concept for the final soft edge), Decrypted Text, Split Flap Text, Symbols effect (concept), Stepper
WHAT: `components/generation/GenerationFrame.tsx`, a Canvas2D overlay that fills an existing aspect box, driven by real fal queue status.

DATA
- Extend lib/imageGen.ts generateImages with `onStatus?(s)`.
- Call `fal.subscribe(endpoint,{ input, logs:true, onQueueUpdate })` (API verified at node_modules/@fal-ai/client/src/queue.d.ts:45).
- Map IN_QUEUE to {phase:'queued', position: queue_position}, IN_PROGRESS to {phase:'running', logs}, and COMPLETED to 'done'.
- The library pipelines prepend 'saving' and 'expanding' (the Astra/GMI expand call) and append 'uploading i/n' and 'saved'.

VISUAL PHASES (Bayer-8 threshold field at 4px cells, ImageData + pixelated upscale)
- saving/expanding: density 0.08. The caption cycles glyphs in the Decrypted Text style (mono 10px uppercase: 'EXPANDING PROMPT').
- queued: density pulses 0.08↔0.14 over 1.2s, stepped. A split-flap numeral shows 'QUEUE #3' and flips only when queue_position changes.
- running: density d(t)=0.12+0.73·(1−e^(−t/τ)), where τ = modelETA/2.3. Add per-model ETA fields to lib/imageModels.ts; Devin should measure these (e.g. nano-banana-2 vs openai/gpt-image-2.5/sunburst) rather than guess. The ramp never reaches 1 before completion.
- A 1-cell bright scanline sweeps top→bottom every 1.6s with steps(rows/2).
- In edit mode, draw the previous image (shot.imageUrl, scene keyframe, or the character reference) beneath as a 12px mosaic: drawImage into a tiny canvas, then upscale with imageSmoothingEnabled=false. This needs no getImageData, so cross-origin fal.media images cannot taint anything.
- done: `await img.decode()` first, then de-rez: mosaic cell 24→12→6→3→1px at 80ms each (steps, 400ms), while the dither layer clears in Bayer order (300ms easeOutCubic). The real <img> then fades in over 180ms and the canvas unmounts. Total about 700ms.
- failed: freeze the field and retint it to dither-kit PALETTE.red [240,70,70] at 0.35 density. Show 'SIGNAL LOST' plus a Retry button. This finally renders the persisted imageStatus 'failed' (ShotboardPage.tsx:115).

ENGINE
- One module-level ticker (lib/motion/ticker.ts) that registers and unregisters frames, runs a single rAF capped at 30fps via an accumulator, stops when empty, and pauses on visibilitychange.
- About 15 frames can be active without cost. No WebGL.

PLACEMENTS
- ShotCard.tsx:87-99: already a fixed h-32 box, so no CLS.
- Library 'Sheet history' grid: prepend N aspect-square GenerationFrame tiles (N = options variations) while generating.
- CharacterPanel: the selected ChromaGrid card's `.chroma-img-wrapper` when generatingIds has it.
- SceneGallery panel for the scene keyframe.
- DirectorPlayer captureFrame/remixFrame/generateSheet: show a continuity-frame thumbnail next to the 'Continuity frame set:' line (DirectorPlayer.tsx:1188-1190) in place of the raw URL.

REDUCED MOTION
- Static 0.25-density dither plus text phase labels, with no ramp or scanline. On completion, a 150ms opacity crossfade.

A11Y
- Frame `aria-busy`. A single polite live region announces phase changes only ('Queued, position 3', 'Rendering', 'Saved 2 variations').

MOTION ASSETS
- Do not use H3 Max video here; video decode during generation is wasteful.

### Pending-button system: BayerSpinner, width-locked labels, focus-preserving aria-busy, success/error micro-states (high) — CSV: Stepper, Star Border (rejected — too decorative for an ops console), Electric Border (rejected, same reason)
BAYERSPINNER (components/ui/BayerSpinner.tsx)
- Replaces all 12 `Loader2 animate-spin` sites.
- A 4x4 grid of 2px (w-3) or 3px (w-4) squares in currentColor. Each square has `--b` = its BAYER4 index and runs `@keyframes bayer-blink{0%{opacity:.15}6%{opacity:1}40%{opacity:.35}100%{opacity:.15}}` over 880ms with `steps(1)`, infinite, `animation-delay: calc(var(--b) * 55ms)`.
- The result reads as an ordered-dither fill cycling. It is pure CSS and costs almost nothing.
- Reduced motion: squares static at 0.6 opacity with a centre cell at 1, a still 'busy' glyph.

PENDINGBUTTON (components/ui/PendingButton.tsx)
- Wraps the existing `.fal-button-primary/.fal-button-secondary` classes.
- The label and pending label are stacked in one grid cell (`display:inline-grid; > *{grid-area:1/1}`), with the inactive one `visibility:hidden`. Width is max(label, pendingLabel), so there is zero layout shift for 'Go live on Twitch'/'Negotiating…', 'Save source'/'Saving…', 'Capture frame'/'Capturing…' and 'Send to Director'/'Preparing…'.
- While pending: `aria-busy="true"`, `aria-disabled="true"`, `data-state="pending"`, and a click guard. Do not set native `disabled`, which drops focus.
- Success (900ms): `@keyframes lock-in`, 2 steps: border/fill flash dither green (PALETTE.green) with label 'Saved' or 'Sent', then revert.
- Error: 3-frame 2px x-jitter (`steps(3)`, 180ms) plus red tone.
- Both micro-states are colour-only under reduced motion.

DITHERBUTTON (Start Director; dither-kit file, do not edit)
- Wrap its children in `<span className="inline-flex items-center gap-2">` at DirectorPlayer.tsx:1250-1251 to fix the stacked icon.
- Pending: while state==='opening', keep the button mounted as 'Starting…' with a sibling overlay `.dither-scan`. That overlay is absolute inset-0 with a 2px dithered bar translating bottom→top over 1200ms `steps(20)` (compositor-only). Today the button is swapped for 'Stop'. The 'Stop'/'Cancel' affordance stays next to it.

MULTI-STAGE
- A `<StageTrack stages current>` mini stepper, mono 10px uppercase, cells ░→▓→█, sits under long-running CTAs.
- Character/Location sheet: Save → Expand → Queue → Render → Upload n/m → Done.
- Shotboard 'Send to Director' (ShotboardPage.tsx:236-262): Flush → Expand 4/12 (batches of 2 already exist) → Prepare → Opening Director.
- ChatSteerer Connect: 'Connecting…' plus BayerSpinner. Today it has no feedback at all.

### Live Control 'tuning' sequence, offline test card, buffering and signal-lost states for the Director video box (transformative) — CSV: Split Flap Text, Stepper, Faulty Terminal (concept only), Noise (concept only; implement as a Canvas2D field, not the WebGL component)
SCOPE: DirectorPlayer.tsx:1082-1157.

IDLE
- Replace 'Director offline' with a Canvas2D test card painted once per resize (no rAF): dithered brand bars, the WZRD ident, `minimax/h3-max/director` in mono, and '● STANDBY'.
- Optionally a generated motion ident: use fal MiniMax H3 Max, with a GPT Image 2.5 Sunburst still of Coast (character sheet as reference) as the first frame, to render a 4-6s loop of Coast at a CRT. Embed it as `<video muted loop playsInline preload="none" poster>`. It starts only when visible (IntersectionObserver), pauses when hidden, and under reduced motion shows the poster only.
- Keep the DitherGradient backdrop.

OPENING (existing CONNECT_STEPS)
- Render the steps as a 'tuning' panel: five signal bars, one lit per step, stepped 120ms fill.
- Step labels use split-flap text when they become current. The completed glyph is a solid 2x2 pixel block instead of a Circle icon.
- The background test card's noise density rises per step: 0.10 / 0.25 / 0.40 / 0.60 / 0.80.
- Wrap the panel in `aria-live=polite`. The Cancel link becomes a proper secondary button.

FIRST FRAME
- On the video's `playing` event (in addition to onMedia), a Canvas2D overlay clears in Bayer-8 order over 450ms (easeOutCubic): 'the test card resolves into the live picture'. No WebGL.

BUFFERING
- Add `waiting`/`stalled` listeners that show a 0.2-density dither veil plus 'BUFFERING · buf 0.4s · gen 3.1s', reusing bufferDepth and genEstimate. `playing` removes it with a 200ms fade.

FAILED / CLOSED
- On 'failed' or onError, show a 'SIGNAL LOST' card in the red dither tone with the error text, a Retry button that calls connect, and the restored Start Director control (required by admin-testing skill step 5).
- Map the raw state enum in the badge (1058-1070) to Standby / Tuning / On air / Stopping / Failed / Off air, keeping `data-state` equal to the raw value for tests.

LIVE HUD
- Keep 'Live · Ns', 'Ping · N ms', buf and gen. Swap the animate-pulse dot for a 2-frame stepped blink (1s, steps(2)) that holds still under reduced motion.
- The REC pill gets the same treatment.

### Motion foundation: tokens, registered plugins, live reduced-motion hook, route enter transitions (high) — CSV: Fade Content, Pill Nav (for the sliding active indicator concept), Flowing Menu (concept)
TOKENS (globals.css :root)
- Easing: `--ease-out: cubic-bezier(0.16,1,0.3,1)`, `--ease-in-out: cubic-bezier(0.65,0,0.35,1)`, `--ease-crt: cubic-bezier(0.2,0.9,0.1,1)`.
- Durations: `--dur-instant: 80ms`, `--dur-fast: 140ms`, `--dur-base: 220ms`, `--dur-slow: 360ms`, `--dur-reveal: 600ms`.
- Stepping: `--steps-dither: steps(8,end)`.
- Mirror these in tailwind.config.js `transitionTimingFunction` and `transitionDuration`.
- Register `require('tailwindcss-animate')` and `@tailwindcss/typography` (plugins: [] at line 141). Add keyframes `crt-on`, `bayer-blink`, `dither-sweep`, `scanline`, `lock-in`, `jitter`, `chyron-in`.

REDUCED MOTION
- Global block: `@media (prefers-reduced-motion: reduce){ .fade-in,.animate-spin,.animate-pulse,[data-motion=decorative]{animation:none!important} *{scroll-behavior:auto} }`. Use `motion-safe:` for all new decorative animations.
- `hooks/useReducedMotion.ts` subscribes to the matchMedia change event. PixelCard.jsx:134-136, AccordionGallery.jsx:47-50 and MorphSlider.tsx:480 currently read it once at mount; switch them to the hook, since those vendored files are editable.

ROUTE TRANSITIONS
- app/admin/template.tsx remounts per navigation. Content enters with opacity 0→1 plus translateY(4px)→0 over 220ms --ease-out, plus a 1px dithered scan line that sweeps the top of the content area over 180ms steps(12).
- AdminNav active indicator: a single absolutely-positioned 2px dithered bar that slides between tabs (transform only, 220ms --ease-out), replacing per-tab border-b-2. This also sidesteps the `.dark *` border override bug.
- Reduced motion: no transform and no scan.

CHART
- ViewerChart: pass a stable `replayToken` and `animate` only on first mount (or memoize samples by capturedAt signature) so 30s polls ease the line instead of replaying the 900ms sweep. Set `bloomOnHover` to stop per-frame bloom copies.
- dither-kit is consumed through props only, not edited.

### GPU budget: one always-on WebGL context, cheaper Dither, on-demand MorphSlider (high) — CSV: Dither (the existing global background, kept), Morph Slider (existing, made on-demand), Pixel Card (existing, made lazy)
RULE FOR DEVIN: at most 2 WebGL contexts ever alive: the Dither plus at most one feature surface. Every loader, skeleton and progress effect is Canvas2D, CSS or SVG.

DITHER.JSX (vendored React Bits, editable)
- Hold uniforms in refs and update colours in the tick instead of in effect deps. Use module-constant colour arrays in DitherBackground.tsx (DARK_WAVE, LIGHT_WAVE, DARK_BG, LIGHT_BG) so the theme toggle only tweens uniforms over 300ms and never recreates the renderer (fixes the churn at DitherBackground.tsx:28-29).
- `antialias:false`.
- Render at half resolution, `renderer.setSize(w/2,h/2,false)` with `pixelSize: 1` and CSS `image-rendering:pixelated` on the canvas. The ditherQuantize at Dither.jsx:94 floors fragCoord/pixelSize, so the output is visually identical at 1/4 the fragment cost.
- Cap at 30fps with an accumulator.
- When disableAnimation or reduced motion is set, render one frame and stop the loop.
- Fade the canvas in (opacity 0→1, 600ms --ease-out) after the first frame and fire `onFirstFrame` for the boot handoff.
- Do NOT call renderer.forceContextLoss on unmount: three r169 logs 'THREE.WebGLRenderer: Context Lost.', which would break the admin-testing console expectation. The singleton-never-unmount approach makes it unnecessary.

MORPHSLIDER.TSX
- Replace the perpetual loop (255-259) with render-on-demand. Request frames only while a tween, drag or texture load is active, plus a low 15fps idle drift if `drift>0` and in view.
- IntersectionObserver pauses it offscreen.
- Show a dither skeleton on the stage until the first texture's onLoad (today a flat #0c0d13 fallback texture shows with no loading cue).

PIXELCARD
- Stop the hover shimmer loop after about 1.5s, or when reduced motion is set.
- Lazy-init pixels on first hover rather than on mount. This avoids building roughly 1.3k Pixel objects × 100 cards on Clips/Recordings at load.

### Unified feedback: 'chyron' toasts plus branded Empty / NotConfigured / AuthRequired / Error / NotFound states (high) — CSV: Decrypted Text (for the 'NO SIGNAL' kicker, one-shot, 600ms), Glitch Text (rejected — noisy for errors)
STATUSCHYRON (components/ui/StatusChyron.tsx + a tiny store)
- A TV lower-third toast stack, bottom-left on desktop and bottom full-width on mobile, safe-area aware.
- Styling: JetBrains Mono 12px; a 4px dithered left bar in the tone colour (info #7aa5e0, success PALETTE.green, warn amber, error PALETTE.red); dark glass #0a0d14/90.
- Enter: clip-path inset(0 100% 0 0)→inset(0) over 220ms steps(6). Exit: Bayer fade over 160ms.
- Semantics: notices are `role=status`, auto-dismiss after 5s, and pause on hover/focus. Errors are `role=alert`, sticky, and have a dismiss button and an optional 'Copy details' action.
- Replaces setNotice/setError at CharacterLibraryPage.tsx:162-163 and LocationLibraryPage.tsx:153-154, ShotboardPage `status` (290; errors become red, advisories stay inline amber), DirectorPlayer error (1291-1293), analytics error (162-167), TrackManager (226), TwitchBroadcast (231) and ChatSteerer (190).
- Field-level errors such as AssetUrlInput:89 and ReferenceAssetManager:126 stay inline.

STATE COMPONENTS (one family, test-card motif)
- `<EmptyState>`, `<NotConfigured feature envVars cmd>`, `<AuthRequired>`, `<ErrorState onRetry>`.
- Visual: a static dithered SVG frame (no animation) with a mono 'CH OFF AIR' / 'NO SIGNAL' kicker, a title, one line of copy, and a primary action.
- Illustrations: fal-generated Coast spots via openai/gpt-image-2.5/sunburst/edit with the Coast character sheet as reference, post-quantized to the 4-colour dither palette as ≤40 KB WebP. Clips: Coast with a clapperboard. Recordings: Coast with VHS tapes. Characters: a blank ID badge. Locations: a map pin on the SF skyline. Analytics: Coast at a CRT showing a flat line. Shotboard: an empty storyboard.
- `<NotConfigured>` replaces ConvexNotConfigured (keeping its copy and env names), the amber one-liners (CharacterLibraryPage:44, LocationLibraryPage:43), and the ShotboardPage:291-293 sentence (kept as an inline banner variant).
- Analytics gets a distinct 'Twitch not connected' state instead of OFFLINE plus endless 'Collecting samples…'.
- `<AuthRequired>` renders when useCloudflareAuth reports !isAuthenticated after loading, which means exposing it through ConvexEnabledContext.

ROUTE FILES
- app/admin/error.tsx: client, 'SIGNAL LOST', `reset()`, and the error digest in mono. It keeps the layout, so the Dither and nav survive.
- app/global-error.tsx: its own <html>/<body> with inline dark styles and a static dither CSS pattern, no JS dependencies.
- app/not-found.tsx: 'CH 404 · NO SIGNAL' with a link to /admin.
- app/admin/loading.tsx: generic skeleton.
- Shotboard: add explicit not-found and auth branches when `loadQuery?.board === null`.

## States inventory
FORMAT: path:line | state | current treatment

ROUTE LEVEL
- app/**/loading.tsx, error.tsx, not-found.tsx, global-error.tsx, template.tsx | NONE EXIST | Next defaults. Uncaught Convex query errors blank the whole app.
- app/admin/shotboard/page.tsx:8 | Suspense (useSearchParams) | `<Suspense>` with no fallback; empty SSR, then pop-in.
- app/admin/visual-test/page.tsx:5 | production not-found | notFound() leads to the unbranded default 404.
- app/layout.tsx:64 | first-load entrance | `.fade-in` 0.5s translateY(10px). First load only, no reduced-motion guard.
- components/DitherBackground.tsx:6 | dynamic import | next/dynamic ssr:false with no `loading`; the canvas hard-cuts in after hydration.
- components/reactbits/Dither.jsx:135-139 | WebGL unavailable | silent bail; the body background (#fff or #0a0d14) shows.
- middleware.ts:28-32 | prod auth missing | plaintext 401 'Unauthorized: set CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD…' (not a UI surface).
- components/ConvexClientProvider.tsx:8-29 | Convex auth loading/unauthenticated | isLoading/isAuthenticated fed to Convex only; no UI. Unauthenticated list queries return [] (convex/clips.ts:52, recordings.ts:53, tracks.ts:47, assets.ts:97), so the UI shows 'empty' instead of 'auth required'.

LIVE CONTROL (components/DirectorPlayer.tsx)
- 1058-1070 | session state badge | raw enum text ('idle', 'opening', 'live', 'closing', 'failed', 'closed') in a colored pill. Green = live, yellow = busy, red = failed, gray otherwise.
- 1071-1076 | recording | red pill, Circle with animate-pulse, 'REC {bytes}'.
- 1082-1084 | video frame | black aspect-video with a static DitherGradient (from blue, up, 0.55, cell 4). <video> has no waiting/stalled handlers, so there is no buffering state.
- 1087-1106 | connecting | bg-black/70 panel of CONNECT_STEPS ['Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene']: green filled Circle when done, animate-pulse outline when current, gray outline when pending, underlined 'Cancel'. Steps advance via onDiagnostic (1001-1005), configured (550), chunk (644) and onMedia (969).
- 1108-1110 | idle / closing / failed | small gray text: 'Director offline', 'Stopping…', 'Session failed'.
- 1114-1154 | live | mute toggle (aria-label Mute/Unmute); 'Capture frame' becomes 'Capturing…' (disabled); 'Remix frame' becomes 'Remixing…' (disabled); HUD shows red pulse dot 'Live · Ns', 'Ping · N ms', 'buf Xs', 'gen Xs'.
- 1159-1192 | session telemetry | mono lines: 'Session allowance', direction list with colored ● (green applied, red rejected, yellow pending, gray sent), 'Continuity frame set: {url}'.
- 1194-1210 | settings | <details> 'Session settings (locked once connected)', hidden while live or busy.
- 1242-1258 | start/stop | DitherButton 'Start Director' (icon stacks above the label: layout bug). While live or busy it is replaced by a secondary 'Stop'. There is no pending state on Start.
- 1259-1266 | send direction | disabled when !live or the prompt is empty (opacity-50).
- 1285-1286 | recording upload | 'Uploading…' text, then green '{size} uploaded'.
- 1291-1293 | error | red text in a bg-red-50/border-red-200 box. The background has no dark variant. Prompt rejections show 'Prompt rejected: {reason}'.
- 1295-1299 | log | <pre> of the last 50 lines.
- DirectorSettingsForm.tsx:117-126 | sheet generation | underlined link 'Generate from first frame' becomes 'Generating…' (disabled).
- TwitchBroadcast.tsx:186-191 | OAuth exchange | 'Connect to Twitch' becomes 'Connecting…' (disabled).
- TwitchBroadcast.tsx:201-209 | WHIP start | 'Go live on Twitch' becomes 'Negotiating…'. Disabled when !live or no key; title 'Start the Director session first'.
- TwitchBroadcast.tsx:212-216 | broadcasting | green mono '● pushing to Twitch ingest…'.
- TwitchBroadcast.tsx:231 | error | red xs text. OAuth state mismatch copy: 'OAuth state mismatch — try Connect to Twitch again'.
- ChatSteerer.tsx:139-145 | IRC status | pill 'listening' (green) or 'offline' (gray).
- ChatSteerer.tsx:157-164 | connecting | button disabled only; no label or indicator change.
- ChatSteerer.tsx:190 | error | red inline text.
- ChatSteerer.tsx:192-202 | chat log | up to 20 lines, each with a DitherAvatar (600ms Bayer-order entrance rAF).
- TrackManager.tsx:33 | Convex not configured | returns null (silent).
- TrackManager.tsx:115 | uploading | Loader2 animate-spin inside 'Upload song' (disabled).
- TrackManager.tsx:121 | loading | 'Loading…' xs text.
- TrackManager.tsx:122-126 | empty | 'No songs yet — upload one…' xs text.
- TrackManager.tsx:127-148 | carousel | MorphSlider (2nd WebGL). While textures load it shows a flat #0c0d13 fallback texture with no cue.
- TrackManager.tsx:208 | disabled | 'Queue on next direction' disabled when !live.
- TrackManager.tsx:226 | error | red xs text.
- MorphSlider.tsx:541 | empty | `.morph-slider-empty` blank div.
- MorphSlider.tsx:535 | WebGL failed | <img> fallback.
- ScriptEditor.tsx:27-38 | template picker crash | error boundary hides the picker and logs console.warn.
- ScriptTemplatePicker.tsx:97-104 | boards loading OR empty | both render the 'Open shotboard editor' link, then flip to a <select> when loaded (layout flash).
- ScriptTemplatePicker.tsx:52-67 | ?transfer= loading | silent; beats appear when ready.
- AssetUrlInput.tsx:70 | uploading | Loader2 animate-spin in 'Upload'; input and button disabled.
- AssetUrlInput.tsx:89 | upload error | red xs text.

SHOTBOARD
- ShotboardPage.tsx:263-268 | Send to Director | disabled while preparing, loading, or no revision. Label becomes 'Preparing…' during a multi-step flush → expand-in-batches-of-2 → prepare → router.push.
- ShotboardPage.tsx:288 | advisory | amber '{n} shots need Director expansion before transfer.'
- ShotboardPage.tsx:290 | errors | amber xs text (the same colour as advisories).
- ShotboardPage.tsx:291-293 | not configured | amber sentence 'Convex not configured — this board lives only in this page's state and cannot be sent to Director.'
- ShotboardPage.tsx:297-302 | loading | card with 'Loading shotboard…'. Loops forever when load returns board:null (useShotboard.ts:373).
- ShotboardPage.tsx:368-373 | no board | card with 'Create a board or pick a saved one to start laying out scenes and shots.'
- useShotboard.ts:132-150 | optimistic write failure | swallowed; surfaces only on flush().
- SceneGallery.tsx:251 | no scenes | returns null.
- SceneGallery.tsx (via AccordionGallery) | scene without image | empty #0a0713 panel.
- SceneSection.tsx:110-119 | no shots | dashed 'First shot' button.
- SceneSidebar.tsx:68-69 | no scene | 'Select a scene to edit its details.'
- SceneSidebar.tsx:86-93 | keyframe generating | Loader2 plus 'Generating…' (disabled). Nothing shows in the image frame.
- ShotCard.tsx:87-93 | no image | ImagePlus icon in a dashed gray h-32 box.
- ShotCard.tsx:94-98 | generating | bg-black/50 overlay plus Loader2 animate-spin (white). Button reads 'Generating…'.
- ShotCard.tsx (none) | imageStatus 'failed' | NOT RENDERED.
- ShotCard.tsx:154-162 | expanding | 'Expand' becomes 'Expanding…' (disabled when there is no onExpandPrompt, e.g. local mode).
- ShotCard.tsx:151 | mention no match | red 'Unknown character handle'.
- CharacterPanel.tsx:64-67 | empty | 'No characters yet — add one, generate its portrait, then tag it on shots.'
- CharacterPanel.tsx:110-116 | portrait generating | Loader2 plus 'Generating…'. The ChromaGrid card shows nothing.
- ChromaGrid.jsx:115 + ChromaGrid.css:96-101 | no image | striped `.chroma-img-empty` 180px.

CHARACTERS / LOCATIONS
- CharacterLibraryPage.tsx:44 and LocationLibraryPage.tsx:43 | Convex not configured | amber one-line card: 'Convex is not configured. Character library changes are disabled.' / '…Location library…'
- CharacterLibraryPage.tsx:150 and LocationLibraryPage.tsx:142 | loading | Loader2 plus 'Loading character library…' / 'Loading location library…'.
- CharacterLibraryPage.tsx:150 and LocationLibraryPage.tsx:142 | empty | dashed rounded-2xl box with icon, 'Start with a reusable character' / 'Start with a reusable environment'.
- CharacterLibraryPage.tsx:146 and LocationLibraryPage.tsx:138 | item without image | assetPlaceholder() SVG ('visual fixture · add approved reference').
- CharacterLibraryPage.tsx:152 and LocationLibraryPage.tsx:144 | saving | 'Save source' becomes 'Saving…' (disabled).
- CharacterLibraryPage.tsx:160 and LocationLibraryPage.tsx:151 | generating | full-width primary button with Loader2 and 'Generating character sheet…' / 'Generating location sheet…'. Disabled when !canGenerate; amber helper 'Add a name, handle, description, and a face reference while identity lock is enabled.'
- CharacterLibraryPage.tsx:160 | sheet history | undefined shows nothing; empty shows 'Generated sheets will remain here for review.'
- CharacterLibraryPage.tsx:162-163 and LocationLibraryPage.tsx:153-154 | notice / error | emerald role=status box and red role=alert box at the bottom of the page; never auto-dismissed.
- ReferenceAssetManager.tsx:119-121 | uploading | Loader2 plus 'Uploading…'. Disabled at MAX_ASSET_REFERENCES; counter '{n}/{max} · drop or choose'.
- ReferenceAssetManager.tsx:126 | error | red role=alert text.

CLIPS / RECORDINGS
- clips/page.tsx:87 and recordings/page.tsx:136 | Convex not configured | <ConvexNotConfigured feature> card (Database icon, 'Convex is not configured', env var and `npx convex dev` copy).
- clips/page.tsx:21 and recordings/page.tsx:37 | loading | header right text 'Loading…'; body empty (no skeleton).
- clips/page.tsx:26-31 | empty | Film icon, 'No clips yet', 'Start an LTX stream or a Director session to populate clips' (stale LTX copy).
- recordings/page.tsx:43-48 | empty | Video icon, 'No recordings yet', 'Use “Record” on the Director player, then “Stop & save recording”'.
- clips/page.tsx:43-50 | media missing | 'No media stored for this segment'.
- recordings/page.tsx:60-66 | media missing | 'Media unavailable'.
- clips/page.tsx:39 and recordings/page.tsx:56 | latest item | `.pixel-card-latest` green border (overridden in dark mode by `.dark *`? PixelCard.css order-dependent; unverified).
- recordings/page.tsx:113-121 | delete | native confirm('Delete this recording permanently?'); no pending state; the row vanishes instantly.
- 100× <video preload="metadata"> | media loading | black box, no poster.

ANALYTICS
- analytics/page.tsx:129-134 | avatar loading | gray circle placeholder.
- analytics/page.tsx:140 | subtitle | 'twitch.tv/{channel}', 'Loading…', or 'Not configured'.
- analytics/page.tsx:145-151 | live status | 'LIVE' (green) or 'OFFLINE' (red). Also shown when not configured.
- analytics/page.tsx:153-159 | refresh | button with no pending state.
- analytics/page.tsx:162-167 | error | AlertCircle plus red text (e.g. 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured').
- analytics/page.tsx:173-196 | stats loading or empty | '—' values.
- ViewerChart.tsx:67-71 | fewer than 2 samples | 'Collecting samples…' in an h-48 box. Never resolves when not configured.
- ViewerChart.tsx:53-66 | chart | dither-kit AreaChart with bloom 'aura'. The 900ms entrance replays on every poll.

DEAD CODE (unreferenced; delete or ignore)
- TestControlPanel.tsx: 'Uploading image...' border spinner at 512; animate-pulse at 213-261.
- QueueVisualization.tsx:108; AIPerformanceBreakdown.tsx:153-163 (transition-all); PerformanceMetrics.tsx; WebRTCPlayer.tsx; RealtimeChart.tsx; GenerationHistory.tsx.
- hooks/useRealtimeData.ts, hooks/useRealtimeWebSocket.ts.

MOTION (see current_state for the full inventory)
- WebGL contexts alive: /admin up to 2 (Dither + MorphSlider); /admin/visual-test 2; every other page 1.
- Perpetual loops: Dither.jsx:175, MorphSlider.tsx:258, cartesian-canvas.tsx:118.
- Hover-driven loops: PixelCard.jsx:175, dither-kit button.tsx:128.
- Timers: DirectorPlayer 1s interval (1021); analytics 30s poll (114).
- prefers-reduced-motion honored only by dither-kit (button, avatar, charts), PixelCard (speed and delay only), AccordionGallery (durations), MorphSlider (tween length and CSS transitions). NOT honored by the Dither background, .fade-in, animate-spin, animate-pulse, ChromaGrid or PixelCard's loop.

## Invariants
- Keep the global React Bits Dither background: DitherBackground in app/layout.tsx:37, host `fixed inset-0 -z-10 pointer-events-none` aria-hidden. Keep the tints: dark waveColor [0.2,0.34,0.66] / backgroundColor [0.02,0.03,0.06]; light [0.5,0.63,0.86] / [0.98,0.98,1.0]. Keep colorNum 4, pixelSize 2 (visually; half-res + pixelSize 1 is equivalent), waveSpeed 0.04, waveFrequency 2.6, waveAmplitude 0.4. Its tint must keep following the html `dark` class.
- Dither.jsx WebGL-unavailable fallback (try/catch at 135-139) must still leave a usable page. Any boot loader must also dismiss itself when WebGL fails.
- Pre-paint theme script `themeInit` (app/layout.tsx:11-19, 34), localStorage key 'theme', `suppressHydrationWarning` on <html>, and ThemeToggle toggling `document.documentElement.classList` 'dark' plus colorScheme.
- admin-testing skill (.agents/skills/admin-testing/SKILL.md): the Director card is the only Live Control content. Its button text is exactly 'Start Director'. A failed start must show an error AND restore the Start control. Per-page console must contain only the React DevTools info message, so loaders and animations must not console.log/warn. Do not add three.js forceContextLoss on unmount, because it logs 'THREE.WebGLRenderer: Context Lost.'.
- CONNECT_STEPS strings and order (DirectorPlayer.tsx:54-60): 'Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene'. The overlay 'Cancel' must call disconnect(). DIRECTOR_MODEL string 'minimax/h3-max/director' is displayed.
- Director strings and controls: 'Director offline', 'Stopping…', 'Session failed', 'Capture frame'/'Capturing…', 'Remix frame'/'Remixing…', 'Live', 'Ping · {n} ms', 'REC {bytes}', 'Record', 'Stop & save recording', 'Send direction', 'Stop', 'Uploading…', 'Session settings (locked once connected)', labels 'Next direction' / 'Opening prompt (the series premise)'. Mute button aria-label toggles 'Mute'/'Unmute'. The Record button appears only while live.
- Session semantics: settings <details> hidden while live or busy; 'Send direction' disabled unless live with a non-empty prompt; 'Queue on next direction' disabled unless live; 'Go live on Twitch' disabled unless live and a stream key exists.
- aria-labels to preserve: nav 'Admin sections'; 'Delete board'; 'Board visual style'; 'Move shot earlier'; 'Move shot later'; 'Delete shot'; `Image prompt for shot ${n}`; 'Move scene up'; 'Move scene down'; 'Delete scene'; 'Delete character'; 'Remove element'; 'Clear'; 'Image accordion gallery' (role=list); 'Coast audio artwork' (aria-roledescription carousel); 'Coast originals artwork carousel'; 'Previous song artwork'; 'Next song artwork'; 'Song artwork' tablist with `Show ${caption}` tabs; 'Music mix volume'; 'Music start offset'; `Delete ${track.name}`; `Preview ${track.name}`; 'Reference images'; 'Use as primary image'; 'Remove reference from this item'; DitherAvatar `${name} avatar` role=img.
- ids, classes and test hooks: `#audio-library-visual-test` (AssetStudioVisualFixture.tsx:45); `.asset-studio` wrapper on the library pages and fixture; `.pixel-card-latest` on the first clip/recording; `.fal-card`, `.fal-card-header`, `.fal-card-content`, `.fal-card-title`, `.fal-button-primary`, `.fal-button-secondary`, `.connection-indicator`/`.connection-connected`/`.connection-disconnected` (restyle, don't silently delete without updating callers). role=status/role=alert on library notice/error must remain announced, even if moved into toasts.
- Query-param contracts: `/admin/shotboard?board=<id>` preselects a board (useSearchParams) and needs a Suspense boundary; `/admin?transfer=<id>` and `/admin?board=<id>` are read by ScriptTemplatePicker; Twitch OAuth returns to `/admin?code&state` and TwitchBroadcast strips them with history.replaceState.
- Storage keys: localStorage 'wzrd_twitch_auth', sessionStorage 'wzrd_twitch_oauth_state', localStorage 'theme'. A new boot gate may add sessionStorage 'wzrd:boot' but must not collide with these.
- Convex calls unchanged: api.clips.list {limit:100}; api.recordings.list {limit:100}; api.recordings.remove (behind confirm('Delete this recording permanently?')); api.recordings.deleteStorage; api.tracks.list/generateUploadUrl/add/remove; api.assets.* (listCharacters, listLocations, create/patch, removeReference, seedStarterLibrary, startGeneration, completeGeneration, failGeneration, generateUploadUrl, listAssetHistory, getCharacter, recordUpload, getStorageUrl); api.shotboards.*; api.promptExpansion.start and .expand; api.director.prepare and .get; api.twitchStats.record and .history; useDirectorPersistence mutations. Hooks must stay mounted only under ConvexProvider (the `useConvexEnabled()` gates).
- Generation pipeline order and idempotency in the library pages: persistDraft/save → expand → promptFingerprint → startGeneration (throws if status !== 'running') → generateImages → upload each → completeGeneration, with failGeneration on error. A progress UI may observe this sequence but must not reorder it. Identity lock rule: generation is blocked without a face reference when identityLocked.
- fal access only via FAL_SDK_PROXY_URL / createFalClient({proxyUrl}) so FAL_KEY stays server-side. Adding onQueueUpdate/logs to fal.subscribe is fine; changing endpoints or inputs is not.
- dither-kit files (components/dither-kit/*) are hash-locked by dashboard/dither-kit.json: consume via props, imports and wrappers only. components/reactbits/* is not locked and may be edited.
- visual-test route must keep calling notFound() in production and must never mount Convex hooks.
- Shotboard safety: selectBoard clears board/scenes/shots/characters before the next load (useShotboard.ts:183-195); hydration is skipped while pendingWritesRef has writes; Send to Director awaits flush() before prepare.
- Chat steering safety: sanitisation and throttles (2s global, 8s per user) plus '!frame'/'!snap' commands; untrusted chat text is never rendered as HTML.
- Twitch analytics poll interval 30_000ms, 24h history window, and 'Viewers (last 24h, Convex)' / 'Viewers (this session)' title switch.

## Refactor notes
1) New shared layer (build this first so every page migrates onto it):
- components/ui/motion/: tokens.css (easings, durations, steps), useReducedMotion.ts (live matchMedia listener), ticker.ts (one rAF, 30fps cap, visibility-aware, register/unregister), bayer.ts (re-export BAYER4 from dither-kit/pixel.ts plus add BAYER8 locally; do not edit dither-kit).
- components/ui/feedback/: BayerSpinner, PendingButton, StageTrack, StatusChyron plus store, EmptyState, NotConfigured, AuthRequired, ErrorState.
- components/ui/skeleton/: DitherSkeleton primitives plus per-page compositions.
- components/generation/GenerationFrame.tsx.
- components/boot/BootVeil.tsx (React side of the handoff) and lib/boot/bootScript.ts (string exported for the layout's inline script, like themeInit).
Swap sites one by one. The 12 Loader2 sites are mechanical replacements.

2) DirectorPlayer.tsx (1342 lines) mixes session transport, the audio graph, recorders, clip rotation, fal remix and all of the UI.
- Before redesigning the video box, extract the presentational pieces with no logic changes: <DirectorStage> (lines 1082-1157: video, overlays, HUD), <DirectorStatusBadge> (1058-1076), <DirectorTelemetry> (1159-1192), <DirectorControls> (1241-1287).
- Pass them state, connectStep, live, busy, pingMs, bufferDepth, genEstimate, elapsedSeconds, capturing, remixing, capturedFrame and callbacks.
- Move the 1s `setElapsedSeconds` tick (1019-1032) into <DirectorStage>, via a ref plus a local interval or a useSyncExternalStore clock, so the whole player, ScriptEditor, ChatSteerer and TrackManager stop re-rendering every second.
- Keep all refs and callbacks in the parent. Do not move connect/disconnect/handleData.

3) CharacterLibraryPage.tsx and LocationLibraryPage.tsx are about 90% duplicated. They use single-line mega-JSX (e.g. lines 149-160 are each hundreds of characters with inline `className` soups and inline async handlers).
- Split out <StudioHero>, <StudioGallery>, <SourceForm> (field configs as data), <GeneratePanel>, <SheetHistory>, and a shared `useSheetGeneration(targetType)` hook that owns the pipeline and emits stage events for StageTrack and GenerationFrame.
- Keep the exact Convex call order and the failGeneration-on-error behaviour.
- The `field` class string repeats; move it to a `.studio-field` @layer component.

4) ShotboardPage.tsx:236-262 has an 25-line async IIFE inside onClick. Move it into `useSendToDirector()` returning {run, stage, progress:{done,total}}. ShotCard.tsx:169 is a single 1,000+ character line containing the chips plus an AccordionGallery inside <details>. Extract <ShotCharacterPicker> and mount the gallery only when <details> is open (onToggle state), which also removes N hidden gsap timelines and ResizeObservers. SceneSection.tsx:69 has the same problem for the location picker.

5) Loading and state logic: centralize `useLoadState(query, {delayMs:150, minMs:300})`, returning 'loading' | 'empty' | 'ready' | 'auth' for Convex queries. Fix useShotboard.ts:373 to return 'notFound' when loadQuery?.board === null, and expose a `syncState` ('idle' | 'saving' | 'error') from pendingWritesRef in useShotboardImpl for a 'Saving… / Saved' chip.

6) Theme and CSS debt that affects every state colour:
- Scope the dark border reset to `@layer base` (move `* {border-color}` and `.dark * {border-color}` into `@layer base`) so utilities win again.
- Remove the nested `fal.primary` purple block (tailwind.config.js:74-79) or rename it. Decide the brand primary explicitly (chrome blue per the comment), then grep for purple dependencies: violet-* is used heavily in TrackManager and the library pages.
- Define `fal-purple` or replace its two usages.
- Register the tailwindcss-animate and typography plugins.

7) Vendored React Bits edits are allowed and small:
- Dither.jsx: uniform refs, half-res, antialias:false, 30fps cap, reduced-motion single frame, onFirstFrame, fade-in.
- MorphSlider.tsx: render on demand, IntersectionObserver.
- PixelCard.jsx: apply activeColor, lazy init, stop the shimmer, remove user-select:none from PixelCard.css:19 or scope it to the canvas.
- AccordionGallery.jsx: live reduced-motion, plus a skeleton when item.image is falsy instead of the bare #0a0713 panel.
Never edit components/dither-kit/* because dither-kit.json hashes would break. Wrap it instead (e.g. fix the DitherButton icon layout by passing a flex span as children).

8) Delete dead code before the redesign to shrink the surface: TestControlPanel.tsx (1163 lines), WebRTCPlayer, RealtimeChart, PerformanceMetrics, QueueVisualization, AIPerformanceBreakdown, GenerationHistory, hooks/useRealtimeData.ts, hooks/useRealtimeWebSocket.ts, and the globals.css classes used only by them (.progress-bar, .progress-fill, .terminal, .metric-*, .status-*). Grep-verified: none are imported by app/ or by live components. Also fix the stale 'Start an LTX stream…' empty-state copy (clips/page.tsx:30) and the layout metadata description mentioning LTX (layout.tsx:23).

9) Verification Devin should run after each step:
- `npm run typecheck` and `npm run lint`.
- The admin-testing skill flow (unconfigured) with console capture per page.
- Throttle CPU 4x in DevTools and confirm the boot loader never exceeds 1600ms and that the Dither is at or below 30fps.
- Toggle the theme 10 times and confirm there is still exactly 1 WebGL context: `performance` panel or `document.querySelectorAll('canvas')` plus the `webglcontextcreationerror` absence.
- Check prefers-reduced-motion emulation, where every loop must stop or become static.
- CLS should be 0 on skeleton-to-content transitions (Lighthouse / web-vitals).
