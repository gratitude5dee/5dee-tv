# Audit: CSV component curation (190 React Bits + Arlan Vault candidates) mapped onto the stream.wzrd.tech admin surfaces (dashboard/): global shell + AdminNav, Live Control (Director), Shotboard, Characters, Locations, Clips, Recordings, Twitch Analytics, and the new loading animation

## Files read
- docs/redesign/component-prompts.csv
- dashboard/package.json
- dashboard/components.json
- dashboard/dither-kit.json
- dashboard/tailwind.config.js
- dashboard/tsconfig.json
- dashboard/next.config.js
- dashboard/wrangler.toml
- dashboard/lib/utils.ts
- dashboard/app/layout.tsx
- dashboard/app/globals.css
- dashboard/app/page.tsx
- dashboard/app/admin/layout.tsx
- dashboard/app/admin/page.tsx
- dashboard/app/admin/analytics/page.tsx
- dashboard/app/admin/characters/page.tsx
- dashboard/app/admin/locations/page.tsx
- dashboard/app/admin/clips/page.tsx
- dashboard/app/admin/recordings/page.tsx
- dashboard/app/admin/shotboard/page.tsx
- dashboard/app/admin/visual-test/page.tsx
- dashboard/components/AdminNav.tsx
- dashboard/components/DitherBackground.tsx
- dashboard/components/reactbits/Dither.jsx
- dashboard/components/reactbits/Dither.css
- dashboard/components/reactbits/ChromaGrid.jsx
- dashboard/components/reactbits/ChromaGrid.css
- dashboard/components/reactbits/PixelCard.jsx
- dashboard/components/reactbits/AccordionGallery.css (reduced-motion block)
- dashboard/components/reactbits/MorphSlider.tsx (imports, aria, reduced-motion)
- dashboard/components/DirectorPlayer.tsx (lines 1-70, 1045-1300 + greps)
- dashboard/components/DirectorPanel.tsx
- dashboard/components/ConvexNotConfigured.tsx
- dashboard/components/CharacterLibraryPage.tsx (lines 140-165)
- dashboard/components/LocationLibraryPage.tsx (greps, lines 141-154)
- dashboard/components/shotboard/ShotboardPage.tsx (lines 195-377)
- dashboard/components/shotboard/ShotCard.tsx (lines 85-110)
- dashboard/components/shotboard/CharacterPanel.tsx (greps)
- dashboard/components/ChatSteerer.tsx (lines 186-207)
- dashboard/components/TrackManager.tsx (lines 128-150, greps)
- dashboard/components/TwitchBroadcast.tsx (lines 160-234 strings)
- dashboard/components/dither-kit/gradient.tsx (head)
- dashboard/components/dither-kit/button.tsx (head)
- .agents/skills/admin-testing/SKILL.md

## Current state
CSV FACTS (verified by parsing all 190 data rows with Python csv.DictReader; columns source, category, name, canonical_url, cli_identifier, scraped_description, implementation_prompt):
- Arlan Vault: 18 rows (CSV file lines 2-19). Empty category and empty cli_identifier. Canonical URLs are https://arlan.me/vault/<slug>. Studies: Amo hover button, Apple's corners (squircle), Arcade pixel, Chromatic glow, Dia Browser's gradient, Fade motion, Figma vector editor, Ghosty reveal, Holo, Kinetic typography, Liquid UI, Midjourney Medical's ASCII, Pixel brushes, Ransom note, Realistic emboss, Symbols effect, The art of color depth, The typer.
- React Bits: 172 rows. Animations 38 (lines 20-57), Backgrounds 57 (lines 58-114), Components 45 (lines 115-159), Text Animations 32 (lines 160-191). For every React Bits row, cli_identifier is the PascalCase form of the name (no mismatches found). Canonical URLs are https://www.reactbits.dev/<animations|backgrounds|components|text-animations>/<kebab-name>.
- implementation_prompt uses exactly two templates (verified). The React Bits template reads: "Build an original, reusable React component called **<Name>** ... Expose sensible props ...; preserve keyboard access where it is interactive; avoid unnecessary animation under `prefers-reduced-motion`; and pause expensive rendering while off-screen or the tab is hidden. Use a clean TypeScript API and do not copy React Bits source code." The Arlan Vault template reads: "Build an original interactive web study called **<Name>** ... expose the principal visual controls, make the resting state clear and accessible, provide a reduced-motion fallback, and avoid copying source code or proprietary artwork from the reference." All 18 Arlan entries therefore have to be built as original studies from the description, without copying source. The same "original / do not copy" wording also appears on the React Bits rows, which conflicts with a CLI install (see problems).
- Five CSV components are already vendored in dashboard/components/reactbits. Dither (CSV line 67) is a plain-three.js port; its header at Dither.jsx:1-4 reads "Vendored from reactbits.dev — Dither, ported from react-three-fiber to plain three.js (the R3F wrapper pulls in react-reconciler, which is incompatible with this app's bundled React)". The others are AccordionGallery (line 115, gsap), ChromaGrid (line 123, gsap), MorphSlider (line 147, three + gsap, TSX) and PixelCard (line 150, Canvas2D). Four are JS+CSS variants (.jsx + .css) and MorphSlider is TS+CSS, so the variant choice is already inconsistent.

INSTALL MECHANICS:
- React Bits publishes four variants per component: JS-CSS, JS-TW, TS-CSS and TS-TW. This app is TS + Tailwind, so it should target TS-TW, or TS-CSS to match the vendored CSS-file style. There are two typical CLI formats: shadcn `npx shadcn@latest add https://reactbits.dev/r/<Name>-TS-TW` and jsrepo `npx jsrepo add https://reactbits.dev/ts/tailwind/<Category>/<Name>`. The category path segment for "Text Animations" is probably `TextAnimations`, but that is unverified. Newer shadcn versions may also accept a namespaced `@react-bits/<Name>-TS-TW`. The exact registry URL, the target path the CLI writes to, and each item's npm dependency list must all be verified at install time. From this sandbox, reactbits.dev, www.reactbits.dev and tripwire.sh all fail with "CONNECT tunnel failed, response 403" (verified with curl), so no registry JSON or source could be fetched here. The dependency notes below are expectations from React Bits conventions, not verified facts.
- dashboard/components.json is a shadcn config: style "default", rsc true, tsx true, tailwind.config "tailwind.config.js", css "app/globals.css", baseColor "gray", cssVariables false, iconLibrary "lucide". Aliases: components "@/components", utils "@/lib/utils" (exists; `cn` = twMerge(clsx) in lib/utils.ts), ui "@/components/ui" (the directory does not exist yet), lib "@/lib", hooks "@/hooks". Registries: { "@dither-kit": "https://tripwire.sh/r/{name}.json" }. What this means:
  (a) The shadcn CLI is the sanctioned installer, and path aliases resolve through tsconfig "@/*".
  (b) `shadcn add` will drop files under @/components or @/components/ui, not components/reactbits. It may auto-run npm install for the item's dependencies and may patch tailwind.config.js or globals.css. Every install should therefore run on a branch and be reviewed as a diff, then moved into components/reactbits/<Name>/.
  (c) With rsc true, files must carry 'use client'. The CLI does not add that directive for you, so check each file.
  (d) A "@react-bits" namespace could be added to registries once its URL is verified.
  (e) dither-kit is source-installed with per-file sha256 hashes in dither-kit.json (e.g. components/dither-kit/button.tsx hash fd2e5a37…). Editing those files breaks the lockfile, so wrap them rather than edit them.
- Installed deps, verified in node_modules: react 18.3.1, three 0.169.0, gsap 3.15.0, motion 13.2.0 (exports ./react), framer-motion 13.2.0 (transitive), tailwind-merge 3, clsx, lucide-react 0.294. Missing: ogl, @react-three/fiber, @react-three/drei, @react-three/rapier, postprocessing, matter-js, meshline, lenis, @use-gesture/react, face-api.js. tailwindcss-animate is a devDependency but is NOT registered (tailwind.config.js:141 `plugins: []`).

APP SURFACES (AdminNav.tsx:7-15 tabs, in order): Live Control (/admin, Radio icon), Shotboard (/admin/shotboard, Clapperboard), Characters (/admin/characters, UsersRound), Locations (/admin/locations, MapPin), Clips (/admin/clips, Film), Recordings (/admin/recordings, Video), Twitch Analytics (/admin/analytics, BarChart3). /admin/visual-test is a dev-only fixture (notFound in production), and / redirects to /admin.
- Shell (app/layout.tsx): DitherBackground sits fixed behind everything (line 37). Above it is an overlay div `bg-fal-gray-50/60 dark:bg-[#0a0d14]/45`. The header is solid #0a0d14 with /wzrdtechlogo.png (alt "WZRD.TECH"), the "Stream Admin" h1, the "stream.wzrd.tech" mono subline and ThemeToggle. main is max-w-7xl with a one-shot `.fade-in`. The footer shows "stream.wzrd.tech admin" and "Powered by FAL realtime".
- Live Control = DirectorPlayer (1342 lines) + TwitchBroadcast + ScriptEditor + ChatSteerer (chat log with DitherAvatar) + TrackManager (MorphSlider "Coast originals" carousel). This page already runs two WebGL contexts: Dither and MorphSlider.
- Shotboard = toolbar card (board select, New board, ImageModelSelect, style select, Send to Director, Delete board) + a 280px sidebar (SceneSidebar, CharacterPanel with ChromaGrid) + a main column (SceneGallery with AccordionGallery, SceneSection/ShotCard keyframes).
- Characters and Locations are near-duplicate "asset studio" pages. Each has a dark hero section, an AccordionGallery (accentColor "#a78bfa"), a source form, a dark "Generate" aside, and a sheet-history grid.
- Clips and Recordings use PixelCard variant "blue" around native <video controls>. The latest item gets the green `pixel-card-latest` style.
- Analytics = channel header + LIVE/OFFLINE connection-indicator + 4 StatCards + ViewerChart (dither-kit AreaChart).

BRAND FACTS FOR TUNING (verified):
- Dither dark waveColor [0.2,0.34,0.66] ≈ #3357A8 on bg [0.02,0.03,0.06] ≈ #05080F. Light is ≈ #80A1DB on #FAFAFF. colorNum 4, pixelSize 2, waveSpeed 0.04, waveFrequency 2.6, waveAmplitude 0.4 (DitherBackground.tsx:24-32).
- Header #0a0d14. The intended "chrome blue" is 400 #7aa5e0 / 500 #4f83cc / 600 #3a6ab0 (tailwind.config.js:27-32). However, `fal-primary-500` actually compiles to #6d28d9 purple because the nested `fal.primary` at lines 74-79 wins in Tailwind's flattenColorPalette (verified with node). A violet accent (#a78bfa, violet-* utilities) is used in the galleries and TrackManager.
- Fonts: Focal (weights remapped so font-bold = 500) and JetBrains Mono through next/font.

CURATION OUTCOME: 23 picks (listed in redesign_opportunities).
- Animations: PixelSwap, PixelTransition, AnimatedContent, GradualBlur.
- Backgrounds: Dither (keep and harden), plus Radar only as a contained, non-WebGL port.
- Components: AnimatedList, Counter, Stepper, PillNav, BorderGlow.
- Text Animations: DecryptedText, SplitFlapText, CountUp, ShinyText.
- Arlan Vault originals: Arcade pixel, Symbols effect, Dia Browser's gradient, Figma vector editor, Holo, Amo hover button, The typer, Apple's corners.
- The other 5 already-vendored components stay but should be retuned to the brand palette.
- Rejected: everything else. The largest rejected groups are the 55 other Backgrounds (each would be a second full-screen shader), all cursor effects, and all R3F, 3D and physics components.

## Problems
- **[critical] [performance]** `dashboard/components/DitherBackground.tsx:23` — TEMPTING BUT WRONG: any second full-viewport background from the 57-row Backgrounds category (Aurora, Silk, Galaxy, LiquidEther, Plasma, PlasmaWave, Iridescence, LightRays, Hyperspeed, Beams, DarkVeil, Grainient, SoftAurora, ColorBends, Threads, GradientBlinds, LiquidChrome, Prism, PrismaticBurst, Lightning, Orb, etc.). The Dither wave is the mandated global background (fixed inset-0 -z-10), and a second shader would fight it visually and double GPU fill cost. That cost lands while DirectorPlayer is decoding WebRTC video and running two MediaRecorders (DirectorPlayer.tsx:364-381 full recording, 386-404 rotating clip capture), so a background shader directly threatens the live output.
- **[high] [code-structure]** `dashboard/components/reactbits/Dither.jsx:1` — TEMPTING BUT WRONG: reinstalling `Dither` (CSV line 67) or adding any component built on @react-three/fiber, drei, rapier or meshline: Lanyard, FluidGlass, ModelViewer, Antigravity, Beams, and probably GridScan and others. The file header records that the R3F wrapper 'pulls in react-reconciler, which is incompatible with this app's bundled React' (react 18.3.1). A registry reinstall of Dither would silently undo the plain-three port. R3F-based picks must be rejected or hand-ported to plain three, and a port costs a WebGL context.
- **[high] [performance]** `dashboard/components/TrackManager.tsx:130` — WebGL context budget is already spent on Live Control: the Dither WebGLRenderer (Dither.jsx:136) plus MorphSlider's WebGLRenderer (MorphSlider.tsx:216, mounted here). reactStrictMode: true (next.config.js:3) double-mounts effects in dev. Every shader-based CSV component (SpecularButton, ASCIIText, WarpText, InfiniteMenu, CircularGallery, FlyingPosters, MetallicPaint, MetaBalls, Orb, EvilEye, RippleDistortion, GlowCursor, PixelBlast, etc.) would exceed a one-persistent-context budget. Browsers cap live contexts at around 16 and drop the oldest, which could be Dither.
- **[high] [a11y]** `dashboard/app/layout.tsx:36` — TEMPTING BUT WRONG: all cursor effects (SplashCursor, BlobCursor, GhostCursor, GlowCursor, SwarmCursor, PixelTrail, ImageTrail, Ribbons, Crosshair, TargetCursor, TextCursor, ClickSpark, Magnet, MagnetLines, ElasticMesh, CursorGrid). This is a live broadcast control surface where the operator clicks small precise targets: 'Capture frame' and 'Remix frame' over video (DirectorPlayer.tsx:1122-1136), 'Move shot earlier/later' icons (ShotCard.tsx:75-81), delete icons. Trails and lag reduce pointing accuracy. SplashCursor is a full-screen WebGL fluid sim, and several create full-viewport canvases.
- **[high] [color]** `dashboard/tailwind.config.js:74` — Verified token collision. The nested `fal.primary` (400 #8b5cf6, 500 #6d28d9, 600 #5b21b6) overrides the flat 'fal-primary' chrome blue (tailwind.config.js:27-32, commented 'wzrd.tech chrome blue (from the wordmark)'), so `fal-primary-500` = #6d28d9 (checked with tailwindcss flattenColorPalette). Several classes are also undefined and emit no CSS: `text-fal-primary-200` (CharacterLibraryPage.tsx:149), `text-fal-primary-300` (CharacterLibraryPage.tsx:160, LocationLibraryPage.tsx:151), `bg-fal-purple-500/10 text-fal-purple-500` (analytics/page.tsx:175; ViewerChart.tsx:44). Any CSV component 'tuned to brand primary' with Tailwind classes will come out purple or unstyled. Fix the tokens before tuning props.
- **[high] [visual-hierarchy]** `dashboard/components/CharacterLibraryPage.tsx:150` — TEMPTING BUT WRONG: 3D and physics galleries (DomeGallery, CircularGallery, FlyingPosters, InfiniteSpiral, DepthCarousel, Carousel, Stack, CardSwap, BounceCards, Ballpit, Cubes, Lanyard, ModelViewer) for character, location, sheet-history or clip review. Operators compare generated sheets for identity drift, which needs a stable, side-by-side, legible grid. Orbiting or perspective layouts distort the images being judged. Most also need ogl, R3F, rapier or matter-js (none installed).
- **[high] [a11y]** `dashboard/components/CharacterLibraryPage.tsx:149` — TEMPTING BUT WRONG: ReflectiveCard (CSV line 152, 'dynamic webcam reflection'). It would trigger a camera permission prompt in an admin tool used during live broadcasts, a privacy risk and a jarring interruption. It is tempting for the @coast identity hero, and the Arlan 'Holo' study is the non-invasive substitute.
- **[medium] [motion]** `dashboard/components/DirectorPlayer.tsx:1058` — TEMPTING BUT WRONG: pointer-reactive or flickering text on status, prompts or labels: TextPressure, VariableProximity, ScrambledText, FuzzyText, GlitchText, WarpText (WebGL), ASCIIText (three.js WebGL), TrueFocus, EchoText, FallingText, Shuffle-on-hover. The state pill `{state}` and HUD strings must be instantly legible. GlitchText and FuzzyText flicker raises WCAG 2.3.1 and 2.2.2 concerns. Cursor distortion of the prompt textarea label or the 'Applied:' text harms reading.
- **[medium] [consistency]** `dashboard/components/AdminNav.tsx:21` — TEMPTING BUT WRONG for the 7-tab AdminNav: Dock (proximity magnification makes hit targets move), GooeyNav (particle bursts on every tab change), BubbleMenu, FlowingMenu, InfiniteMenu (WebGL), CardNav, StaggeredMenu (full-screen overlay nav for a desktop-first console). Tabs need fixed, scannable positions. PillNav is the recommended alternative.
- **[medium] [visual-hierarchy]** `dashboard/app/admin/analytics/page.tsx:34` — TEMPTING BUT WRONG: MagicBento (defaults: particles, tilt, magnetism, click ripple, global spotlight), SpotlightCard, TiltedCard, ProfileCard, GlareHover or DecayCard applied to every `.fal-card` or StatCard. Hover theatrics on data tiles turn a monitoring grid into a toy, and MagicBento's global spotlight tracks the cursor across the whole page. A card-level glow (BorderGlow) is used on at most 3 primary-action panels instead.
- **[medium] [performance]** `dashboard/components/DirectorPlayer.tsx:1082` — TEMPTING BUT WRONG: ElectricBorder, StarBorder, LaserFlow, MagicRings or Strands animating continuously around the live video stage. ElectricBorder animates SVG turbulence displacement every frame alongside WebRTC decode and MediaRecorder encode, and any perpetual motion around program output pulls the eye from the picture. Signal on-air state with a static tally, the recommended FloorGlow (Dia gradient study) below the frame, and the SplitFlap state board.
- **[medium] [performance]** `dashboard/components/DirectorPlayer.tsx:1138` — TEMPTING BUT WRONG: GlassSurface, FluidGlass (R3F + drei) or SpecularButton (one shader context per button) for the live HUD chips and the Capture/Remix/Mute buttons that sit over the video (currently bg-black/60). A backdrop-filter or SVG displacement over a surface that changes every frame forces a repaint each frame. SVG-filter backdrops are Chromium-only.
- **[medium] [a11y]** `dashboard/components/TrackManager.tsx:192` — TEMPTING BUT WRONG: ElasticSlider replacing the native `<input type="range" aria-label="Music mix volume">`. The React Bits slider is div-based, so native keyboard stepping, AT value announcements and form semantics are lost unless it is rebuilt as role=slider. Elastic overshoot is also misleading on a live audio gain control. Restyle the native range with brand tokens instead.
- **[medium] [consistency]** `dashboard/components/DitherBackground.tsx:30` — TEMPTING BUT WRONG despite the pixel theme: HalftoneReveal (content stays hidden until the cursor reveals it), PixelBlast (WebGL + postprocessing dep), PixelSnow (WebGL), LetterGlitch and FaultyTerminal (flicker, full-canvas), CRTWarp, Noise (animated grain over Dither's 4-level Bayer quantization muddies the palette), ShapeGrid, DotGrid, DotField, RippleGrid, GridMotion, GridDistortion (a second pattern layer competing with Dither's grid). They dilute the one dither motif rather than reinforce it.
- **[medium] [motion]** `dashboard/components/reactbits/Dither.jsx:174` — The retained Dither violates its own CSV implementation_prompt (line 67: 'avoid unnecessary animation under prefers-reduced-motion; pause expensive rendering while off-screen or the tab is hidden'). tick() calls requestAnimationFrame and renders every frame unconditionally. `disableAnimation` only freezes `time` and still re-renders. DitherBackground.tsx:24-32 never passes disableAnimation. Inline array props (waveColor/backgroundColor, DitherBackground.tsx:28-29) are effect deps (Dither.jsx:196), so each theme toggle tears down and recreates the WebGLRenderer.
- **[medium] [typography]** `dashboard/app/layout.tsx:8` — `JetBrains_Mono({ variable: '--font-mono' })` produces a hashed next/font family exposed only through var(--font-mono), but Tailwind `font-mono` is hard-coded to 'JetBrains Mono', Menlo, … (tailwind.config.js:119) and never references the variable. `font-mono` therefore falls back to system mono unless JetBrains Mono is installed locally. Counter, CountUp, DecryptedText and SplitFlapText rely on stable tabular monospace metrics, so this must be fixed first (fontFamily.mono: ['var(--font-mono)', …]).
- **[medium] [code-structure]** `dashboard/tailwind.config.js:141` — tailwindcss-animate (devDependency) is installed but not registered (`plugins: []`). @tailwindcss/typography is also unregistered. React Bits TW variants and shadcn items that emit `animate-in`, `fade-in-0`, `zoom-in-95` or similar utilities would silently do nothing. Also note that globals.css:167 defines its own `.fade-in` class, which would collide with tailwindcss-animate's `fade-in` naming if the plugin is registered. Rename it first.
- **[medium] [a11y]** `dashboard/components/reactbits/ChromaGrid.css:125` — The vendored ChromaGrid (used in shotboard CharacterPanel.tsx:70 with columns={1} radius={200}) applies `backdrop-filter: grayscale(1) brightness(0.78)` everywhere except near the pointer (lines 125 and 158). The selected state is expressed only as a colored `--card-border` (ChromaGrid.css:57-60) from PALETTE (CharacterPanel.tsx:10), so the selection color is grayscaled away once the pointer leaves. There is no reduced-motion handling, unlike PixelCard.jsx:135 and AccordionGallery.jsx:48.
- **[medium] [code-structure]** `docs/redesign/component-prompts.csv:20` — Policy conflict. Every React Bits row's implementation_prompt ends 'Use a clean TypeScript API and do not copy React Bits source code', yet the requested workflow (CLI install) copies React Bits source, and the repo already vendors copied or ported source (Dither.jsx:1 'Vendored from reactbits.dev'). goal.md must decide, per component, between (a) installing via the official registry, keeping a provenance header, and complying with the upstream React Bits license (verify the current terms at install; reportedly MIT + Commons Clause, meaning no reselling the components themselves), or (b) writing an original per the CSV prompt. Arlan Vault rows must always be option (b).
- **[medium] [states]** `dashboard/app/admin/shotboard/page.tsx:8` — The loading story is fragmented, which is where the new loader must land. There is no app/**/loading.tsx anywhere (verified file list), `<Suspense>` has no fallback here, and the other loaders are ad hoc. Plain 'Loading…' strings: clips/page.tsx:21, recordings/page.tsx:37, analytics/page.tsx:140, TrackManager.tsx:121, ShotboardPage.tsx:300. Lucide Loader2 animate-spin: CharacterLibraryPage.tsx:150 and 160, LocationLibraryPage.tsx:142 and 151, ShotCard.tsx:96, CharacterPanel.tsx:114, SceneSidebar.tsx:91, ReferenceAssetManager.tsx:120, TrackManager.tsx:115, AssetUrlInput.tsx:70. A border spinner sits in the legacy TestControlPanel.tsx:512, and the Director connect list uses pulsing circles (DirectorPlayer.tsx:1094).
- **[low] [copy]** `dashboard/app/layout.tsx:75` — TEMPTING BUT WRONG: marquees and tickers (LogoLoop for a 'Powered by fal / MiniMax / OpenAI / Convex / Twitch' strip, ScrollVelocity, CurvedLoop, TextLoop, RotatingText, CircularText 'ON AIR' badges). Moving text in a control room cannot be read at a glance, and third-party logos raise trademark and endorsement questions. Keep the footer static.
- **[low] [consistency]** `docs/redesign/component-prompts.csv:9` — Arlan studies to skip: Ghosty reveal (line 9; a soft fog reveal breaks the hard-pixel reveal grammar chosen here, so use PixelTransition), Liquid UI (12, gooey fusing cards), Ransom note (15, off-brand), Kinetic typography (11), Fade motion (7, stacks ~200 DOM copies of a word), Pixel brushes (14, a drawing tool with no use case), Realistic emboss (16), Chromatic glow (5), The art of color depth (18, competes with the existing DitherButton 'Start Director' at DirectorPlayer.tsx:1243). Midjourney Medical's ASCII (13) is a decent loader idea but is redundant with DecryptedText + Arcade pixel.
- **[low] [color]** `dashboard/components/LocationLibraryPage.tsx:142` — Accent split. Galleries hard-code violet accentColor="#a78bfa" and overlayColor="#05030b" (CharacterLibraryPage.tsx:150, LocationLibraryPage.tsx:142), TrackManager uses violet-* utilities (TrackManager.tsx:128), and CharacterPanel uses an 8-color rainbow PALETTE (CharacterPanel.tsx:10). The Dither background and header are chrome blue (DitherBackground.tsx:28). New CSV components need one shared palette module; per-call hex literals would multiply this drift.

## Redesign opportunities
### PixelSwap (cli: PixelSwap) — signature boot/route loader and Director first-frame reveal (transformative) — CSV: Pixel Swap
WHERE:
(1) New app/admin/loading.tsx route fallback, plus a one-time BootLoader overlay in app/layout.tsx shown until the Convex client resolves (ConvexClientProvider isLoading, ConvexClientProvider.tsx:9-21). Pixel fragments assemble into a cover carrying the Arcade-pixel '5DEE' wordmark and a pixel sprite of Coast (from the new GPT Image 2.5 Sunburst asset), then dissolve to reveal the page.
(2) On the Director stage (DirectorPlayer.tsx:1082-1111), when `state` becomes 'live', the connect overlay dissolves away into the first video frame instead of hard-cutting.
(3) Inline variant: a 3x3 Bayer-cell pixel spinner (CSS steps()) replaces the ~12 Loader2 animate-spin sites listed in problems.

WHY: It is the single most on-brand motion in the CSV. It speaks the same language as the Dither grid and makes loading feel like 'the broadcast is assembling'.

TUNING:
- Cell size 8px (a multiple of Dither pixelSize=2 at 4x so edges align).
- Max 4 colors to match colorNum=4: #05080F, #1d3160, #3357A8, #7aa5e0 dark; #FAFAFF, #cbd8f0, #80A1DB, #3a6ab0 light.
- Radial-from-center order. Assemble ~700ms, hold ≥250ms, dissolve ~450ms.
- Minimum display 300ms to avoid flash, maximum 1.2s before it gets out of the way.

A11Y: main gets aria-busy while shown; a role=status sr-only label ('Loading Live Control'); reduced motion gives a 150ms opacity crossfade.

DEPS: This is a new component, so read its registry JSON at install. If it is WebGL, port it to Canvas2D: squares on a grid are cheap (~20k fillRect per frame at 1440x900 with 8px cells) and this keeps the one-WebGL-context budget.

### Arcade pixel (Arlan Vault, no cli; original study) — pixel wordmark for loader and eyebrow labels (high) — CSV: Arcade pixel
WHERE:
- The '5DEE' / 'WZRD' mark inside the PixelSwap loader.
- Section eyebrows, e.g. the 'Visual asset studio' pill (CharacterLibraryPage.tsx:149), 'Generate' (CharacterLibraryPage.tsx:160, LocationLibraryPage.tsx:151), and a 'LIVE CONTROL' page eyebrow.

WHY: It gives true pixel typography with no font file and no WebGL, and it matches the Dither cell grid exactly.

BUILD (original, per the CSV prompt 'avoid copying source code'): draw the text with fillText into a tiny offscreen canvas (e.g. 48x9 px), then display it scaled with CSS `image-rendering: pixelated`. The scale is 4px per source pixel, which is 2x the Dither pixelSize of 2. The optional reveal animates column-by-column.

TUNING: #7aa5e0 on #0a0d14 in dark; #3a6ab0 on #FAFAFF in light. Read the theme from the `dark` class, as DitherBackground.tsx:13-20 does.

A11Y: the real text stays in the DOM (visually hidden span or aria-label) and the canvas is aria-hidden. Reduced motion shows it static.

DEPS: none.

### DecryptedText (cli: DecryptedText) — connect steps, model id, loader captions (high) — CSV: Decrypted Text
WHERE:
- CONNECT_STEPS labels (DirectorPlayer.tsx:54-60, rendered at 1088-1103: 'Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene'). Each label decrypts when it becomes the active step.
- DIRECTOR_MODEL under the card title (DirectorPlayer.tsx:1055) decrypts once on mount.
- Loader caption lines.
- Terminal state text 'Session failed' and 'Stopping…' (1110).

WHY: Resolving glyphs read as a machine handshake, which fits WebRTC session setup.

PROPS: sequential, revealDirection='start', speed≈30, maxIterations≈8, characters='░▒▓█01/<>_', animateOn='view' (or keyed on step change), className 'font-mono', encryptedClassName 'text-fal-gray-500'.

CONSTRAINTS: The final strings must stay byte-identical to the current labels, because the test flow and operators read them. Render the real text for AT (sr-only or aria-label) and keep the scramble aria-hidden. Requires the font-mono/next-font fix so the glyph width is stable. Reduced motion renders the final text immediately.

DEPS: motion (installed, motion@13.2.0 exposes ./react).

### PixelTransition (cli: PixelTransition) — keyframe and sheet reveal when a generation lands (high) — CSV: Pixel Transition
WHERE:
- Shot keyframe well (ShotCard.tsx:87-98). It replaces the black/50 + Loader2 overlay with a pixel dissolve from the old image or ImagePlus placeholder to the new `shot.imageUrl`.
- Newly generated items in sheet history (CharacterLibraryPage.tsx:160, LocationLibraryPage.tsx:151).
- The primary sheet panel after 'Generate character sheet' / 'Generate location sheet'.

WHY: It turns 'image appeared' into a legible generation-complete moment that uses the same pixel grammar as the loader.

PROPS: gridSize 12 (small tiles) or 16 (hero). pixelColor '#3357A8' dark / '#80A1DB' light (the Dither wave colors). animationStepDuration ≈0.35, once.

CONSTRAINTS: React Bits triggers on hover by default. Wrap it so the transition is driven by the image `onLoad` of the new URL (controlled), not hover. While generating, show a static dithered skeleton (DitherGradient-style) rather than a spinner. Keep the 'Generating…' / 'Regenerate image' / 'Generate image' button labels (ShotCard.tsx:108). Reduced motion swaps instantly.

DEPS: gsap (installed 3.15.0).

### Symbols effect (Arlan Vault, no cli; original study) — Coast 'standby' poster on the idle Director stage (high) — CSV: Symbols effect
WHERE: The idle stage (DirectorPlayer.tsx:1108-1111, currently the bare text 'Director offline' over DitherGradient at 1083). Render a still of Coast, the new GPT Image 2.5 Sunburst key art made with the Coast character sheet as the edit reference, as a raster of tiny symbols in 4 brightness bands (e.g. '·', '+', '×', '█'). Each band is tinted #0e1a36, #1d3160, #3357A8, #7aa5e0. The 'Director offline' label stays on top. Optionally reuse it as a PixelSwap loader backdrop.

WHY: The empty stage becomes a branded 'standby card', like a broadcast test pattern, instead of a black box. It uses the flagship character without competing with live video.

BUILD: The reference runs on the GPU, but build an original Canvas2D version on a downsampled image (≈160x90 cells), recomputed only on resize or theme change, optionally with ~8fps band-threshold drift. Unmount it the moment state leaves 'idle' or 'failed' so it never overlays program video.

A11Y: aria-hidden. Reduced motion shows a static raster.

DEPS: none.

ASSET: 16:9 PNG, Coast mid-shot on a flat dark background for clean luminance banding.

### Dia Browser's gradient (Arlan Vault, no cli; original study) — on-air floor glow under the stage and loader floor (medium) — CSV: Dia Browser's gradient
WHERE:
- Directly beneath the video box (outside it, DirectorPlayer.tsx:1082) as a reflection-like underglow that grows up from the floor when `live` becomes true and sinks on stop.
- The floor of the boot loader.

WHY: A calm, premium on-air cue that never touches program pixels. It replaces the tempting animated borders.

BUILD (original; do not reproduce Dia branding): 11-13 blurred bars (filter: blur(20-28px)), heights on a bell curve, animated scaleY 0→1 over ~700ms.

TUNING:
- Ramp #05080F → #3a6ab0 → #7aa5e0 → #ffffff (center) → #a78bfa. This deliberately bridges the chrome-blue and violet accents.
- Opacity ≈0.35.
- Add a #ef4444 hint only while `recording` is true (REC badge state, DirectorPlayer.tsx:1070).

Reduced motion shows the final state statically. aria-hidden.

DEPS: none (CSS only).

### Radar (cli: Radar) — contained sweep behind the connect steps (non-WebGL port) (medium) — CSV: Radar
WHERE: The connect overlay (DirectorPlayer.tsx:1085-1107), behind the step list, only while connectStep is 1-2 ('Finding a machine', 'Connecting').

WHY: A literal and instantly readable 'searching for a machine' metaphor that fills a black stage during the slowest part of setup.

TUNING: 4 rings, 12 spokes, beam #7aa5e0 at ~35% alpha on black, a 2.4s sweep period, rendered pixelated (small canvas + image-rendering: pixelated) to match the dither grid.

DEPS: Backgrounds in React Bits are typically ogl shaders; verify at install. Do NOT add ogl for this. Port it to CSS: `conic-gradient` for the beam plus `repeating-radial-gradient` rings with a rotate keyframe, or Canvas2D. It must be transient and unmount when live.

Reduced motion shows static rings with no sweep. aria-hidden.

### Stepper (cli: Stepper) — system-driven progress for connect, sheet generation and Director transfer (medium) — CSV: Stepper
WHERE:
(1) Connect steps (DirectorPlayer.tsx:1088-1103): a horizontal pixel-segment track above the list, or replacing the Circle icons.
(2) The Generate aside (CharacterLibraryPage.tsx:160, whose copy already describes the pipeline 'Astra expands the saved source; the selected Fal model then creates a reviewable sheet'): steps Source valid → Expand → Generate → Review.
(3) Shotboard 'Send to Director' (ShotboardPage.tsx:233-265): Expand prompts → Flush → Transfer.

WHY: It makes multi-stage waits legible without spinners.

CONSTRAINTS:
- Use only the indicator and connector visuals. The React Bits Stepper is a wizard with Back/Continue buttons, and these steps are system-driven, so strip the buttons (e.g. disableStepIndicators, custom renderStepIndicator).
- Square pixel dots. Complete #22c55e (preserves the current green fill semantics at DirectorPlayer.tsx:1091), active #7aa5e0 with a stepped pulse, pending #374151.
- role=list / aria-current='step'.

DEPS: motion (installed).

### Counter (cli: Counter) — odometer digits for live telemetry (high) — CSV: Counter
WHERE:
- Live HUD chip (DirectorPlayer.tsx:1138-1150): elapsed seconds after 'Live · ', 'Ping · {n} ms', 'buf {n}s', 'gen {n}s'.
- REC badge bytes (1070-1075, 'REC {formatBytes}').
- 'Session allowance' remaining (1156-1161).
- Twitch 'Current viewers' StatCard (analytics/page.tsx:171-176).

WHY: Rolling digits read as broadcast equipment and draw the eye only to values that change.

PROPS: fontSize 12-13 in the HUD and ~28 in the StatCard. places derived from the value. gap 0. gradientHeight 0 on the black HUD pill. textColor inherit. fontWeight 500 (the remapped 'bold').

CONSTRAINTS: Throttle to 1Hz for ping/buf so digits are not constantly rolling. The HUD container gets aria-live='off' with an sr-only plain-text summary. Keep the unit strings ('ms', 's', 'Ping ·', 'buf', 'gen') and the formatBytes output. Needs the tabular mono fix. Reduced motion shows digits instantly.

DEPS: motion (installed).

### CountUp (cli: CountUp) — first-reveal totals (polish) — CSV: Count Up
WHERE:
- Analytics 'Followers' StatCard (analytics/page.tsx:177-182, toLocaleString formatting).
- Clips header '{n} clips' (clips/page.tsx:21) and Recordings header '{n} recordings' (recordings/page.tsx:37).
- Shotboard '{beatPreview.length} beats · {runtimeSeconds}s runtime' (ShotboardPage.tsx:287).

WHY: A cheap, tasteful data-arrival cue. Use Counter for continuously changing values and CountUp for one-shot totals.

PROPS: from 0, duration ≈0.8, separator ',', startWhen = data defined.

CONSTRAINTS: Animate only on first reveal, not on every 30s poll (POLL_MS, analytics/page.tsx:11). The final string format must match the current copy exactly. Reduced motion shows the final value.

DEPS: motion (installed).

### SplitFlapText (cli: SplitFlapText) — Director and Twitch state board (high) — CSV: Split Flap Text
WHERE:
- Replace the Director state pill (DirectorPlayer.tsx:1058-1069, currently raw lowercase `{state}`: idle / opening / live / closing / failed) with a 7-tile split-flap board that flips only on state change.
- Twitch header 'LIVE' / 'OFFLINE' (analytics/page.tsx:149-151).
- Optional 'NOW · SC02 SH03' board in ScriptEditor during a live run.

WHY: The strongest broadcast-control signifier in the CSV. It is mechanical, legible and changes rarely.

TUNING: Tile #0a0d14, text #e5e7eb. The LIVE state uses text #ef4444 with a subtle red tile edge. FAILED uses #f87171. OPENING/CLOSING use #facc15. 60-80ms per flip, at most ~6 intermediate glyphs per tile.

A11Y: an aria-live='polite' wrapper exposing the plain state word, with the flap glyphs aria-hidden. Keep a `data-state={state}` hook for tests. Reduced motion shows instant text.

DEPS: new component; verify at install (likely CSS 3D, possibly gsap, which is installed).

### AnimatedList (cli: AnimatedList) — chat, directions and event log streams (high) — CSV: Animated List
WHERE:
- ChatSteerer chat log (ChatSteerer.tsx:192-203, max-h-32 with DitherAvatar per line).
- Directions list (DirectorPlayer.tsx:1163-1183, 'v{n} {status} — {text}' with colored ● for applied/rejected/pending/sent).
- The Director event log `<pre>` (1295-1299), which becomes a structured list with timestamps.

WHY: Streams of events should feel alive but orderly. Staggered entry shows what is new without flashing.

PROPS: enableArrowNavigation false (these are not selection lists). displayScrollbar true. Enter = y 6-8px + opacity over 150ms. showGradients off; use GradualBlur edges instead.

CONSTRAINTS: Auto-stick to the newest item only when the user is already at the edge. Keep DitherAvatar untouched (dither-kit is lockfile-hashed). Reduced motion means no entrance animation.

DEPS: motion (installed).

### GradualBlur (cli: GradualBlur) — scroll-edge affordances (medium) — CSV: Gradual Blur
WHERE:
- Bottom edge of the Director log (DirectorPlayer.tsx:1295, max-h-40 overflow-auto) and the chat log (ChatSteerer.tsx:193, max-h-32).
- Right edge of the AdminNav horizontal overflow on narrow screens (AdminNav.tsx:21 overflow-x-auto).
- The long Shotboard main column.

WHY: It signals that more content exists, a real usability affordance and not decoration.

PROPS: position 'bottom' (or 'right' for the nav), height '2rem', strength ≈1.5, divCount 4, curve 'bezier', target 'parent'.

CONSTRAINTS: Never place it over the live video (backdrop-filter repaint). Hide it when the element is not overflowing.

DEPS: React Bits' GradualBlur has historically imported `mathjs` for its curve math. Verify at install, and if it is present replace the call with Math.pow rather than adding mathjs to the bundle.

### Figma vector editor (Arlan Vault, no cli; original study) — viewfinder brackets and Shotboard selection chrome (high) — CSV: Figma vector editor
WHERE:
(1) Director stage (DirectorPlayer.tsx:1082): four L-shaped corner brackets inset 12px, plus a size tag under the frame like '1280×720 · H3 MAX · {state}'. The brackets tighten 4px when live.
(2) Shotboard selection: the selected scene (SceneSection `selected` prop, ShotboardPage.tsx:325) and the active shot get a thin 1px chrome-blue box, 6px corner squares and a tag 'SC 02 · SH 03 · 4.0s'.

WHY: It reads immediately as a production tool (camera viewfinder / design-tool selection) and replaces weak selection cues.

BUILD: original, CSS-only (pseudo-elements, no drag or bezier editing), and no Figma branding.

TUNING: #4f83cc lines (after fixing the fal-primary collision) and a #0a0d14 tag with #e5e7eb mono text. Reduced motion means no tighten animation.

DEPS: none.

### BorderGlow (cli: BorderGlow) — primary-action panels only (medium) — CSV: Border Glow
WHERE: At most 3 instances app-wide:
- the Character 'Generate' aside (CharacterLibraryPage.tsx:160)
- the Location 'Generate' aside (LocationLibraryPage.tsx:151)
- the Director card while idle (DirectorPlayer.tsx:1050)

WHY: It tells the operator where the spend-money / go-live actions are. Scarcity is what makes it work.

TUNING: The glow gradient runs chrome #7aa5e0 → violet #a78bfa to bridge the two accent systems. Low intensity (~0.35). Radius matches the container (rounded-2xl 16px and fal-card rounded-lg). Disabled for `(pointer: coarse)` and while `live`. Reduced motion shows a static 1px gradient border.

DEPS: new component; verify at install (likely CSS custom properties + pointer events).

### PillNav (cli: PillNav) — AdminNav with a sliding active indicator (high) — CSV: Pill Nav
WHERE: AdminNav (AdminNav.tsx:21-39), 7 tabs.

WHY: The current underline tabs are generic, and a sliding pill gives a premium, stable sense of place. Consider merging the nav into the header row (layout.tsx:40-60) to reclaim vertical space for the video.

MUST PRESERVE:
- Next `<Link>` elements with the same hrefs and labels ('Live Control', 'Shotboard', 'Characters', 'Locations', 'Clips', 'Recordings', 'Twitch Analytics') and their lucide icons.
- `aria-label="Admin sections"`.
- The active logic at line 23 (exact match for '/admin', startsWith for the others).
- Add aria-current='page'.

PROPS: baseColor '#0a0d14', pillColor '#111827', pillTextColor '#9ca3af', hoveredPillTextColor '#e5e7eb', ease 'power3.out', initialLoadAnimation false. Remove its built-in logo slot, since the header owns the logo.

Mobile: keep horizontal scroll plus the GradualBlur edge rather than the hamburger. Reduced motion means no slide.

DEPS: gsap (installed). A ~40-line motion `layoutId` implementation is an acceptable original alternative.

### ShinyText (cli: ShinyText) — one chrome sheen on the header mark (polish) — CSV: Shiny Text
WHERE: Exactly one place. Either the header 'Stream Admin' title (layout.tsx:51-53) or the '@coast' handle on the Holo card.

WHY: It echoes the chrome WZRD wordmark (public/wzrdtechlogo.png) and adds finish at near-zero cost.

PROPS: speed ≈6s with a long idle between sweeps. Base #9ca3af, sheen #ffffff. `disabled` under reduced motion.

CONSTRAINTS: Never on buttons, status text or numbers.

DEPS: none/CSS (newer versions may use motion, which is installed).

### Apple's corners (Arlan Vault, no cli; original study) — squircle radius token (polish) — CSV: Apple's corners
WHERE: The global shape language: `.fal-card` (globals.css:145-147, rounded-lg), the rounded-2xl studio sections, buttons (.btn-primary/.btn-secondary globals.css:197-205), status pills.

WHY: Continuous-curvature corners are a subtle premium upgrade applied once in the design system rather than per component.

BUILD (original; no Apple assets): progressive enhancement with CSS `corner-shape: squircle` where supported (Chromium; verify current support), falling back to border-radius. Use an SVG-mask squircle only for large hero cards.

CONSTRAINTS: Never use clip-path on focusable elements, since it clips focus rings.

DEPS: none.

### AnimatedContent (cli: AnimatedContent) — the single section-entrance primitive (polish) — CSV: Animated Content
WHERE: Replace the root one-shot `.fade-in` (layout.tsx:64; globals.css:167-180, which only fires once because the root layout persists across routes) with per-page section entrances. Cards stagger in at 40ms on route mount on every admin page.

WHY: Route changes currently feel static, and one shared primitive keeps motion consistent.

PROPS: distance 12, direction 'vertical', duration 0.45, ease 'power3.out', initialOpacity 0, animateOpacity, threshold 0.05.

CONSTRAINTS: Never transform the Director stage or the video element. Render immediately under reduced motion.

DEPS: gsap + ScrollTrigger (gsap 3.15.0 installed, ScrollTrigger bundled). FadeContent is the lighter alternative; do not ship both.

### Holo (Arlan Vault, no cli; original study) — the @coast / $COAST identity card (high) — CSV: Holo
WHERE: The Characters hero (CharacterLibraryPage.tsx:149, 'Characters with a stable identity'), shown when the @coast character exists. The card holds:
- the approved primary face reference
- 'Coast' / '@coast'
- identity-lock state ('Lock the face and overall look across generations' checkbox value)
- sheet count

WHY: The flagship character deserves a collectible, brand-defining artifact. It is also the natural home for the new GPT Image 2.5 Sunburst portrait generated from the Coast character sheet.

BUILD (original; the reference rebuilds an Airbnb ID card, so use no Airbnb layout, art or hearts):
- CSS 3D tilt from pointer variables.
- Foil from layered conic/linear gradients with mix-blend-mode color-dodge.
- A static Bayer-dither PNG overlay so the foil 'dithers'.
- The photo palette-shifts toward #3357A8/#7aa5e0 at extreme tilt.

No WebGL. Focusable, with tilt disabled on keyboard focus. Reduced motion shows a static card with a fixed foil angle.

DEPS: none.

ASSET: a 3:4 Coast portrait on a clean background, plus an optional foil mask PNG.

### Amo hover button (Arlan Vault, no cli; original study) — Coast micro-clip on hover (medium) — CSV: Amo hover button
WHERE: The 'Load SF starters' button in the Characters hero (CharacterLibraryPage.tsx:149) or the Holo card's CTA. Hover or focus plays a 1.5-2s MiniMax H3 Max clip of Coast (a turn and nod), generated with the Coast character sheet as the image reference. It resets on leave.

WHY: It is exactly the 'generate your own clip with any AI video model' idea from the CSV description, and it showcases the product's own motion model inside its admin UI.

BUILD (original):
- `<video muted playsInline preload="none" poster>`.
- On pointerenter/focus: load then play. On leave/blur: pause and set currentTime = 0.
- Button text stays real text.

ASSET: 480p webm + mp4 fallback, ≤400KB, a loop-safe first frame as the poster.

Reduced motion never plays and shows the poster. It must not delay the button's click handler.

DEPS: none.

### The typer (Arlan Vault, no cli; original study) — empty-state headline entrance (polish) — CSV: The typer
WHERE: Empty and idle headlines only, once per mount:
- 'Start with a reusable character' (CharacterLibraryPage.tsx:150)
- 'Start with a reusable environment' (LocationLibraryPage.tsx:142)
- 'No clips yet' (clips/page.tsx:29)
- 'No recordings yet' (recordings/page.tsx:46)
- 'Director offline' (DirectorPlayer.tsx:1110)

WHY: Empty states are where personality is cheap and safe. A wave of pill / highlight / outline states resolving to text matches the pixel-block language.

BUILD (original):
- Per-letter spans cycle through solid pill → highlight → outlined pill → plain.
- Adjacent letters in the same state merge (shared background runs).

CONSTRAINTS: The final string must be in the DOM from first render, with the effect layer aria-hidden, because tests and AT read the text. Reduced motion shows plain text.

DEPS: none (or motion, installed).

### Dither (cli: Dither) — KEEP the vendored port and harden it; do not reinstall (high) — CSV: Dither
WHERE: components/reactbits/Dither.jsx + components/DitherBackground.tsx (mounted at app/layout.tsx:37).

WHY: It is the mandated global background. Hardening it is the precondition for adding any other motion.

CHANGES:
(1) Honor prefers-reduced-motion. Pass disableAnimation and stop the rAF loop after a single render. Today tick() renders every frame regardless (Dither.jsx:174-187).
(2) Pause on document.visibilityState === 'hidden' and when the window is blurred for a long period.
(3) Render at 1/pixelSize resolution and upscale with CSS `image-rendering: pixelated`. Use pixelSize=1 in the shader at half size. This cuts fragment work to about a quarter for an identical look (verify visually).
(4) Hoist the color arrays to module constants or useMemo so a theme toggle updates uniforms instead of recreating the WebGLRenderer (deps at Dither.jsx:196, literals at DitherBackground.tsx:28-29).
(5) Optional 'broadcast tint' API, e.g. waveColor lerps 10% toward #ef4444 while live, exposed through a small context. This lets pages 'theme' the one background instead of adding another.

PRESERVE: waveSpeed 0.04, waveFrequency 2.6, waveAmplitude 0.4, colorNum 4, pixelSize 2, both theme color pairs, the `fixed inset-0 -z-10 pointer-events-none` wrapper and aria-hidden, and the silent WebGL-failure fallback (Dither.jsx:133-139).

DEPS: none new. Reinstalling from the registry would pull @react-three/fiber, @react-three/postprocessing and postprocessing, which the port removed on purpose.

## States inventory
GLOBAL / SHELL
- Pre-paint theme init reads localStorage 'theme' or the OS preference (app/layout.tsx:11-19).
- The Dither WebGL-unavailable path bails silently and leaves the body background (#0a0d14 dark / #fff light) (components/reactbits/Dither.jsx:133-139).
- There is no loading.tsx anywhere under app/ (verified file list), and the root `.fade-in` fires once (layout.tsx:64).
- Shotboard route uses `<Suspense>` with NO fallback (app/admin/shotboard/page.tsx:8).
- Dev-only /admin/visual-test calls notFound() in production (app/admin/visual-test/page.tsx:5).

NOT CONFIGURED
- ConvexNotConfigured card: Database icon at 50% opacity, 'Convex is not configured', 'Set NEXT_PUBLIC_CONVEX_URL to enable {feature}… Run npx convex dev in dashboard/' (components/ConvexNotConfigured.tsx:5-15). Used by clips/page.tsx:87 and recordings/page.tsx:136.
- Shotboard amber line 'Convex not configured — this board lives only in this page's state and cannot be sent to Director.' (ShotboardPage.tsx:291-293).
- DirectorPanel falls back to a non-persistent DirectorPlayer (DirectorPanel.tsx:15). Recording upload logs 'Recording captured but NEXT_PUBLIC_CONVEX_URL is not set; download it instead.' (DirectorPlayer.tsx:298).
- Analytics shows 'Not configured' under the channel name (analytics/page.tsx:140).

LIVE CONTROL: DirectorPlayer
- State pill: raw lowercase `{state}`, colored green when live, yellow when opening/closing, red when failed, gray otherwise (DirectorPlayer.tsx:1058-1069).
- REC badge: pulsing filled Circle + 'REC {bytes}' (1070-1075).
- Stage idle text 'Director offline', closing 'Stopping…', failed 'Session failed', all plain gray-400 text over DitherGradient (1083, 1108-1111).
- Connecting: a black/70 panel listing CONNECT_STEPS. Completed steps show a green-filled Circle, the active one a pulsing outline, pending ones gray. A 'Cancel' underline link sits below (1087-1107).
- Live overlays:
  - Mute toggle, aria-label 'Unmute'/'Mute' (1115-1121).
  - 'Capture frame' / 'Capturing…' and 'Remix frame' / 'Remixing…' with disabled opacity-50 (1122-1136).
  - HUD chip with a red pulsing dot, 'Live · {n}s', yellow 'Ping · {n} ms', 'buf {n}s', 'gen {n}s' (1138-1150).
- Telemetry text below the stage: 'Session allowance: m:ss · about Nm remaining' and a directions list with colored ● (applied green-600, rejected red-600, pending yellow-600, sent gray-400), plus 'Continuity frame set: …' (1153-1188).
- Session settings `<details>` is hidden when live or busy, captioned '(locked once connected)' (1190-1206).
- Prompt label switches between 'Opening prompt (the series premise)' and 'Next direction'. 'Applied: {activePrompt}' shows below. Live-only end-frame and audio AssetUrlInputs appear (1208-1238).
- Controls:
  - DitherButton 'Start Director' vs a secondary 'Stop' (1241-1258).
  - 'Send direction' is disabled unless live and the prompt is non-empty (1259-1266).
  - 'Record' ↔ 'Stop & save recording' (1267-1284).
  - 'Uploading…' and a green lastUpload message (1285-1286).
- Error box is red-50/red-200 with no dark background and no role='alert' (1291-1293). The event log is a `<pre>` capped at max-h-40 (1295-1299).

LIVE CONTROL: other panels
- TwitchBroadcast: 'Connecting…', 'Connect to Twitch', disabled hint 'Start the Director session first', 'Negotiating…', 'Go live on Twitch', and the OAuth error 'OAuth state mismatch — try Connect to Twitch again' (TwitchBroadcast.tsx:67, 160-234).
- ChatSteerer: red status text (ChatSteerer.tsx:190); chat log appears only when there are messages (192-203).
- TrackManager: 'Loading…' while tracks are undefined (TrackManager.tsx:121); upload spinner (115); MorphSlider carousel only when covers exist, labeled 'Coast originals · N tracks' (128-148).

SHOTBOARD
- 'Loading shotboard…' plain card (ShotboardPage.tsx:296-302).
- No board: 'Create a board or pick a saved one to start laying out scenes and shots.' (366-372).
- Amber status line (290) and stale-shot warning '{n} shot(s) need Director expansion before transfer.' (288).
- 'Preparing…' on Send to Director (263).
- ShotCard: an empty keyframe shows an ImagePlus icon in a dashed well (ShotCard.tsx:92). Generating shows a black/50 overlay with Loader2 (94-98). The button reads 'Generating…', 'Regenerate image' or 'Generate image' (108).
- CharacterPanel generate spinner (CharacterPanel.tsx:114); SceneSidebar keyframe spinner (SceneSidebar.tsx:91).

CHARACTERS / LOCATIONS
- Loading: Loader2 + 'Loading character library…' / 'Loading location library…' (CharacterLibraryPage.tsx:150; LocationLibraryPage.tsx:142).
- Empty: dashed card 'Start with a reusable character' / 'Create one, or load the San Francisco starter set to add @coast.' and 'Start with a reusable environment' / 'Load the San Francisco starter library or create an original location.'
- Generate button disabled at opacity-50 with a spinner and the labels 'Generating character sheet…' / 'Generate character sheet' (and the location equivalents).
- Amber hints: 'Add a name, handle, description, and a face reference while identity lock is enabled.' (CharacterLibraryPage.tsx:160) and 'Add a name and environment description to continue.' (LocationLibraryPage.tsx:151).
- Empty history: 'Generated sheets will remain here for review.'
- Success notice role='status' in emerald (CharacterLibraryPage.tsx:162; LocationLibraryPage.tsx:153). Error role='alert' in red (163; 154).
- ReferenceAssetManager: uploading spinner (ReferenceAssetManager.tsx:120) and role='alert' error (126).
- AssetUrlInput uploading spinner (AssetUrlInput.tsx:70).

CLIPS
- Header 'Loading…' vs '{n} clips' (clips/page.tsx:21).
- Empty: Film icon, 'No clips yet', 'Start an LTX stream or a Director session to populate clips' (26-31). This copy references the removed LTX path.
- Clip without media: 'No media stored for this segment' (46-49).
- The first item gets a green `pixel-card-latest` border (39; globals.css:238-244).

RECORDINGS
- 'Loading…' vs '{n} recordings' (recordings/page.tsx:37).
- Empty: 'No recordings yet' plus 'Use “Record” on the Director player, then “Stop & save recording”' (43-48).
- 'Media unavailable' (63-65).
- Latest item is green.

ANALYTICS
- 'Loading…' / 'Not configured' (analytics/page.tsx:140).
- connection-indicator 'LIVE' (green) / 'OFFLINE' (red) (145-152).
- Error with AlertCircle in red-600 (162-167).
- StatCards show '—' placeholders (171-194). The 'Current viewers' accent classes fal-purple-500 are undefined, so its icon is unstyled.
- The stream title/thumbnail block renders only when isLive (199+).

## Invariants
- Keep the global Dither background: <DitherBackground /> at app/layout.tsx:37, wrapper `fixed inset-0 -z-10 pointer-events-none` with aria-hidden (DitherBackground.tsx:23), and tuning waveSpeed 0.04 / waveFrequency 2.6 / waveAmplitude 0.4 / colorNum 4 / pixelSize 2 / dark [0.2,0.34,0.66] on [0.02,0.03,0.06] / light [0.5,0.63,0.86] on [0.98,0.98,1.0]. Never add a second full-viewport background (WebGL, canvas or animated CSS).
- WebGL budget: one persistent context (Dither), plus at most one transient, page-scoped context (MorphSlider on Live Control via TrackManager.tsx:130). Every new CSV effect must be CSS, SVG or Canvas2D, must dispose everything on unmount (and survive reactStrictMode double-mount, next.config.js:3), and must never overlay the program <video> (DirectorPlayer.tsx:1084) while live, except for the existing HUD controls.
- No @react-three/fiber, drei, rapier or meshline. Dither.jsx:1-4 documents that R3F's react-reconciler is incompatible with the bundled React (18.3.1). Do not reinstall Dither from the registry.
- dither-kit is hash-locked in dashboard/dither-kit.json (registry https://tripwire.sh, mode 'source'). Do not edit components/dither-kit/*; wrap instead. Keep DitherButton for 'Start Director' (DirectorPlayer.tsx:1243-1252), DitherGradient in the stage (1083), DitherAvatar in the chat log (ChatSteerer.tsx:196) and the dither-kit AreaChart in ViewerChart.tsx.
- Reduced motion and visibility: per both CSV implementation_prompt templates, every new effect honors `prefers-reduced-motion: reduce` (with a static or instant fallback) and pauses rendering when off-screen or when the tab is hidden. Loaders must keep a minimum/maximum display time (≈300ms / 1.2s) and never block interaction indefinitely.
- Licensing and attribution: Arlan Vault entries are 'original study, build from description, don't copy source'. The CSV prompt says 'avoid copying source code or proprietary artwork from the reference'. Do not reuse Airbnb, Dia, Midjourney, Apple or Figma names or art in shipped components, and name them generically (HoloCard, FloorGlow, SelectionBrackets, PixelWordmark, SymbolRaster, HoverClipButton, WaveTyper, Squircle). React Bits components installed via CLI keep a provenance header (source URL, variant, date, like the existing 'Vendored from reactbits.dev' in Dither.jsx:1) and comply with the upstream React Bits license (verify current terms at install). Where the CSV's 'do not copy React Bits source' instruction is followed, write an original.
- Install policy: the exact React Bits registry URL (e.g. `npx shadcn@latest add https://reactbits.dev/r/<Name>-TS-TW` or `npx jsrepo add https://reactbits.dev/ts/tailwind/<Category>/<Name>`), the file targets and the npm deps must be verified at install time; reactbits.dev and tripwire.sh return CONNECT 403 from this sandbox. The CLI must not silently rewrite tailwind.config.js, app/globals.css, components.json or components/dither-kit. Review the diff, then move files into components/reactbits/<Name>/ with 'use client'.
- Preserve these visible strings, which operators and the admin-testing flow depend on (.agents/skills/admin-testing/SKILL.md step 5: 'Its button is **Start Director**… verify an error plus restored Start control'): 'Start Director', 'Stop', 'Send direction', 'Record', 'Stop & save recording', 'Capture frame' / 'Capturing…', 'Remix frame' / 'Remixing…', 'Cancel', 'Director offline', 'Session failed', 'Stopping…', the CONNECT_STEPS labels ('Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene'), 'Director (realtime WebRTC)', 'Opening prompt (the series premise)' / 'Next direction', 'Connect to Twitch', 'Go live on Twitch', 'Load SF starters', 'New character', 'New location', 'Generate character sheet', 'Generate location sheet', 'New board', 'Send to Director', 'Add scene', 'Generate image' / 'Regenerate image', 'Loading shotboard…', and the empty-state copy listed in states_inventory. Animated text effects must render the final string in the DOM from first render.
- Preserve aria and roles: AdminNav `aria-label="Admin sections"`; 'Unmute'/'Mute'; 'Move shot earlier', 'Move shot later', 'Delete shot', 'Delete scene', 'Move scene up', 'Move scene down', 'Delete board', 'Board visual style', 'Delete character', 'Remove element', 'Clear', 'Optional assets', `Image prompt for shot ${n}`; ImageGenerationControls selects ('Image model', 'Image aspect ratio', 'Image variations', 'GPT Image quality', and the other image-option selects in ImageGenerationControls.tsx); ReferenceAssetManager 'Reference images', 'Use as primary image', 'Remove reference from this item'; TrackManager 'Coast originals artwork carousel', `Delete ${name}`, `Preview ${name}`, 'Music mix volume', 'Music start offset'; MorphSlider 'Coast audio artwork', 'Previous song artwork', 'Next song artwork', 'Song artwork' tablist; role='status' and role='alert' notices in CharacterLibraryPage.tsx:162-163 and LocationLibraryPage.tsx:153-154.
- Navigation: the tab hrefs and labels in AdminNav.tsx:7-15 and the active-match rule at line 23 (exact '/admin', startsWith for the others). The Shotboard→Director hand-off route `/admin?transfer=<id>` (ShotboardPage.tsx:257).
- Theme: class-based dark mode (tailwind darkMode 'class'). ThemeToggle persists the localStorage key 'theme'. DitherBackground and every new effect read theme from `document.documentElement.classList.contains('dark')` via MutationObserver, not from prefers-color-scheme alone.
- No behavior or Convex changes for visual work: keep all useQuery/useMutation calls (e.g. api.clips.list {limit:100}, api.recordings.list/remove, api.twitchStats.record/history), the MediaRecorder recording and clip-rotation logic, the 30s Twitch POLL_MS, and native <video controls> in Clips and Recordings.
- Fonts: only Focal (with the font-weight remap in tailwind.config.js:121-128, where 'bold' = 500) and JetBrains Mono via next/font. CSV components must not ship their own webfonts, and inline fontWeight values must respect the remap.
- Deployment: Cloudflare Pages through @cloudflare/next-on-pages (package.json scripts). Effects must be client-only ('use client', or next/dynamic with ssr:false as in DitherBackground.tsx:6) and must not add server-bundle weight.
- Assets: new brand stills (GPT Image 2.5 Sunburst text-to-image/edit with the Coast character sheet as reference) and motion clips (MiniMax H3 Max) are produced in a separate, explicitly approved step. Do not call paid fal endpoints from CI or tests. Commit optimized outputs (webp/avif stills, ≤400KB webm/mp4 clips with posters) under dashboard/public/brand/.

## Refactor notes
1) BEFORE ANY EFFECT WORK, fix the foundations the CSV components will be tuned against:
(a) Tailwind colors. Remove or rename the nested `fal.primary` (tailwind.config.js:74-79), which currently hijacks `fal-primary-*` to purple. Add 50-900 steps for the chrome-blue scale. Either define `fal-purple` or replace its usages (analytics/page.tsx:175, ViewerChart.tsx:44 and the legacy files).
(b) Bind `fontFamily.mono` to `var(--font-mono)` (layout.tsx:8 vs tailwind.config.js:119).
(c) Register tailwindcss-animate and @tailwindcss/typography, and rename globals.css `.fade-in` (line 167) to avoid a class collision.
(d) Add lib/brand.ts exporting one palette: Dither pairs, the chrome scale, violet accent, live red, success green, and HUD black #0a0d14. Every effect's color props should read from it instead of hex literals such as '#a78bfa' (CharacterLibraryPage.tsx:150, LocationLibraryPage.tsx:142) or PALETTE (CharacterPanel.tsx:10).
(e) Add shared hooks: hooks/useReducedMotion.ts, hooks/usePageVisible.ts and hooks/useThemeDark.ts (extracting DitherBackground.tsx:13-20).

2) FOLDER LAYOUT for new components:
- components/reactbits/<Name>/<Name>.tsx (+ .css when needed) for registry-derived React Bits code, each with a provenance header and 'use client'. Convert the four existing .jsx files to TS gradually so the variant stays consistent (MorphSlider.tsx is already TS).
- components/studies/<GenericName>.tsx for the Arlan originals (PixelWordmark, SymbolRaster, FloorGlow, SelectionBrackets, HoloCard, HoverClipButton, WaveTyper, Squircle utilities).
- components/loading/ for BootLoader, the route loading.tsx content, and InlinePixelSpinner, which replaces every Loader2 animate-spin.

3) SPLIT THE GIANT FILES before layering effects, so each effect attaches to a small component:
- DirectorPlayer.tsx (1342 lines) → DirectorHeader (1050-1079: title, model id, state board, REC badge), DirectorStage (1082-1151: video, overlays, HUD, viewfinder, symbols poster, floor glow), DirectorTelemetry (1153-1188), DirectorPromptForm (1190-1239), DirectorControls (1241-1287), DirectorLog (1291-1299). Keep all refs, callbacks and MediaRecorder logic in the parent or a hook (useDirectorSession) and pass props down.
- CharacterLibraryPage.tsx and LocationLibraryPage.tsx put entire sections on single lines of 1,500+ characters (e.g. CharacterLibraryPage.tsx:149-163, LocationLibraryPage.tsx:141-154) and are near-duplicates. Extract a shared AssetStudio layout: StudioHero, StudioGallery (AccordionGallery wrapper), SourceForm, GenerateAside (Stepper + BorderGlow), SheetHistory (PixelTransition). Only the form fields and copy differ between the two.

4) SCOPE: TestControlPanel.tsx (1163 lines), QueueVisualization, PerformanceMetrics, RealtimeChart, AIPerformanceBreakdown, WebRTCPlayer and GenerationHistory are not imported by any route (grep of `<Component` usages shows none outside their own files). Leave them out of the redesign, confirm with a build, and delete them in a separate PR. The Clips empty copy still says 'Start an LTX stream…', a leftover from that removed path.

5) INSTALL WORKFLOW for each React Bits pick:
- Branch.
- Run `npx shadcn@latest add <verified URL>`, or copy from the registry JSON.
- Inspect the diff for package.json, tailwind or globals changes.
- Move the file to components/reactbits/<Name>/ and add 'use client' plus the provenance header.
- Replace any mathjs/ogl/R3F usage with the native or Canvas2D equivalent.
- Wire in the reduced-motion and visibility hooks.
- Swap colors for lib/brand.ts.
- Add to the dev fixture page (/admin/visual-test) for visual regression.
Because reactbits.dev is blocked from this sandbox, none of this could be pre-verified here.

6) Retune the retained vendored components:
- ChromaGrid: add reduced motion and keep the selected card in color outside the grayscale mask.
- PixelCard: move the variant colors to the brand palette and keep the `pixel-card-latest` green.
- AccordionGallery and MorphSlider: accent from the brand palette.
Do not add new WebGL beyond MorphSlider's existing context.
