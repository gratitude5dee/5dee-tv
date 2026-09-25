# Audit: Live Control (/admin): Director realtime player (minimax/h3-max/director over WebRTC), Script beats, Chat steering, Audio library, Twitch WHIP broadcast

## Files read
- dashboard/app/admin/page.tsx
- dashboard/app/admin/layout.tsx
- dashboard/app/layout.tsx
- dashboard/app/page.tsx
- dashboard/app/globals.css
- dashboard/app/admin/visual-test/page.tsx
- dashboard/app/api/fal/sdk-proxy/route.ts
- dashboard/middleware.ts
- dashboard/components/DirectorPanel.tsx
- dashboard/components/DirectorPlayer.tsx (all 1342 lines)
- dashboard/components/DirectorSettingsForm.tsx
- dashboard/components/useDirectorPersistence.ts
- dashboard/components/TrackManager.tsx
- dashboard/components/ChatSteerer.tsx
- dashboard/components/ScriptEditor.tsx
- dashboard/components/ScriptTemplatePicker.tsx
- dashboard/components/TwitchBroadcast.tsx
- dashboard/components/AssetUrlInput.tsx
- dashboard/components/ReferenceAssetManager.tsx
- dashboard/components/AdminNav.tsx
- dashboard/components/ConvexClientProvider.tsx
- dashboard/components/ConvexNotConfigured.tsx
- dashboard/components/DitherBackground.tsx
- dashboard/components/reactbits/Dither.jsx (render loop section)
- dashboard/components/reactbits/MorphSlider.tsx (engine announce/move/goTo/autoplay sections)
- dashboard/components/dither-kit/button.tsx
- dashboard/components/dither-kit/gradient.tsx
- dashboard/components/dither-kit/sparkline.tsx (props)
- dashboard/components/TestControlPanel.tsx (head + imports)
- dashboard/components/WebRTCPlayer.tsx (head + imports)
- dashboard/components/ImageGenerationControls.tsx (imports)
- dashboard/components/shotboard/ShotboardPage.tsx:240-275
- dashboard/lib/directorProtocol.ts
- dashboard/lib/twitchWhip.ts
- dashboard/lib/utils.ts
- dashboard/tailwind.config.js
- dashboard/package.json
- dashboard/components.json
- dashboard/dither-kit.json
- dashboard/node_modules/@fal-ai/client/src/realtime/extension.d.ts (RealtimeState, RealtimeDiagnostic)
- dashboard/node_modules/@fal-ai/client/src/realtime/wma.js (header docs)
- .agents/skills/admin-testing/SKILL.md
- README.md (line 141)
- docs/redesign/component-prompts.csv

## Current state
ROUTE AND SHELL [verified]. `/` redirects to `/admin` (dashboard/app/page.tsx:4). The root layout (app/layout.tsx:36-82) mounts the fixed full-screen React Bits `<DitherBackground/>` WebGL wave, then a `min-h-screen bg-fal-gray-50/60 dark:bg-[#0a0d14]/45` wrapper holding a dark `#0a0d14` header (logo `/wzrdtechlogo.png` alt "WZRD.TECH", h1 "Stream Admin", mono "stream.wzrd.tech", ThemeToggle), a `main.max-w-7xl.px-6.lg:px-8.py-8` content column wrapped in `.fade-in` and `ConvexClientProvider`, and a footer ("stream.wzrd.tech admin" / "Powered by FAL realtime" / year). app/admin/layout.tsx puts `<AdminNav/>` above every admin page: a horizontal underline tab bar (`aria-label="Admin sections"`) with 7 tabs, the first being "Live Control" -> `/admin` with a Radio icon (AdminNav.tsx:7-15). app/admin/page.tsx is a 12-line client page that renders `<DirectorPanel/>` inside `space-y-8`. DirectorPanel (16 lines) picks `<DirectorPlayer persistence={useDirectorPersistence()}/>` when Convex is configured, otherwise a bare `<DirectorPlayer/>`.

INFORMATION ARCHITECTURE [verified]. The page is one long vertical stack of four generic `.fal-card`s (white/gray-900, 1px border, rounded-lg, shadow-sm; header `px-6 py-4 border-b`, content `px-6 py-4`), all inside DirectorPlayer's single wrapper `<div>`: (1) the Director card (DirectorPlayer.tsx:1050-1301): header with h3 "Director (realtime WebRTC)", a mono subline showing `minimax/h3-max/director`, a raw-state pill (idle/opening/live/closing/failed/closed) and a pulsing "REC 12.3 MB" pill while recording. Then, in order: the video stage, a telemetry and directions block, a collapsible `<details>` "Session settings (locked once connected)" holding DirectorSettingsForm, the prompt textarea, the action button row, the Twitch broadcast strip, the error box and the log `<pre>`. (2) the Script card (ScriptEditor, `fal-card mt-4`, h3 "Script"). (3) the Chat steering card (ChatSteerer, `fal-card mt-4`, h3 "Chat steering"). (4) the Audio library card (TrackManager, `fal-card` with no top margin, h2 "Audio library"), which is only rendered when Convex is configured. There is no sidebar, grid or sticky region. Everything sits in the 1280px column, so the Dither background shows only in the side gutters and the gaps between cards.

VIDEO STAGE [verified]. DirectorPlayer.tsx:1082 renders `relative bg-black rounded-lg overflow-hidden aspect-video` at full column width (about 1168px wide, so about 657px tall at 1440 wide, an estimate). Behind the video is a static `<DitherGradient from="blue" direction="up" opacity={0.55} cell={4}/>` glow (1083). The `<video autoPlay playsInline muted={muted} class="relative w-full h-full object-contain">` sits on top (1084). When not live, a centered overlay shows either the connect checklist or plain gray text. The checklist is a `bg-black/70 border` box listing CONNECT_STEPS "Network checked / Finding a machine / Connecting / Building world / Generating first scene", with lucide Circle icons: green filled for done, a pulsing outline for the current step, gray for future steps. Below it is an underlined "Cancel" link (1087-1106). The plain gray text reads "Director offline", "Stopping…" or "Session failed" (1108-1110). When live there are three overlays. A top-left HUD pill `bg-black/60 font-mono text-xs` shows a red pulsing dot, "Live · 123s", a yellow "Ping · 42 ms", then "buf 3.2s" and "gen 1.1s" (1145-1154). Bottom-left has "Capture frame" (Camera icon) and, after a capture, "Remix frame" (Sparkles icon) as `bg-black/60` chips (1123-1144). Bottom-right has a round mute toggle with `aria-label` "Unmute"/"Mute" (1116-1122). The frame is always 16:9, whatever aspect ratio is selected.

STATUS, LATENCY AND LOGS [verified]. Below the stage (1159-1192, visible when live or connecting) are three tiny mono gray lines. The first is "Session allowance: m:ss · about Nm remaining" (from the `session_info` max_session_seconds). The second is the last 8 routed directions, newest first, each "● vN status — text" with the dot colored by status: sent is gray, pending is yellow-600, applied is green-600, rejected is red. The third is "Continuity frame set: <raw URL>". Errors appear as one `text-sm text-red-700 bg-red-50 border-red-200` box (1291-1293). Every data-channel message, state change, diagnostic, Convex failure and upload result is prepended to a 50-line `<pre>` log (`max-h-40`, 1295-1299; cap at 173-175), which is cleared on every Start (912). A ping is sent every 1000ms (1021-1027) and each `pong` is logged (539), so the log is dominated by pong/chunk lines while live.

VISUAL LANGUAGE [verified plus opinion]. The palette is Focal Light (body weight 300) with JetBrains Mono for data. Tailwind remaps medium to 400 and semibold/bold to 500 (tailwind.config.js:121-128), so the hierarchy is very flat. Colors are inconsistent. The only branded control is the canvas-painted `DitherButton color="blue" variant="gradient" bloom="low"` "Start Director" (1243-1252). Every other action is the neutral `.fal-button-secondary`. Focus rings and links use `fal-primary-*`, which (verified via tailwind flattenColorPalette) resolves to violet #6d28d9 because the nested `fal.primary` (tailwind.config.js:74) overrides the flat "wzrd.tech chrome blue" `fal-primary` (27). TrackManager hard-codes its own violet theme (violet-300/500, `bg-[#0c0c12]`) and an autoplaying WebGL MorphSlider "Coast originals · N tracks" carousel. Status uses stock Tailwind green, yellow and red. My opinion: overall it reads as a developer debug console rather than a broadcast control room. There is no on-air tally, no timecode, no timeline and no keyboard control, and the only 'premium' moments are the dither button and the melt carousel.

OPERATOR WORKFLOW END TO END [verified from code].
(a) CONFIGURE. The operator either arrives from Shotboard's "Send to Director" (ShotboardPage.tsx:260 pushes `/admin?transfer=<id>`, and ScriptTemplatePicker consumes it into beats plus the first frame) or picks a saved board from the Script card's "Load template…" select (with an "edit" link to `/admin/shotboard?board=`). They open "Session settings" and set Resolution (480p/768p/1080p), Aspect ratio (16:9/9:16/1:1), Memory (1-50), Seed, Character name (placeholder "$COAST"), Character sheet (upload, or "Generate from first frame" via fal-ai/nano-banana-2/edit), First frame, "Last frame of first chunk" and "Target audio" (both disabled with "(scripted)" when a script is queued) and Audio bitrate. They can upload songs in the Audio library and click "Use for session", then edit the opening prompt textarea (prefilled DEFAULT_PROMPT, labelled "Opening prompt (the series premise)"). The Script card's "Send with session start" checkbox attaches the beats to configure.
(b) START. "Start Director" runs connect() (908-1014): it clears the log and directions, creates a Convex `sessions` row, calls `fal.realtime.open(wma(DIRECTOR_MODEL))` through `/api/fal/sdk-proxy` and immediately queues the `configure` message. The overlay steps advance on diagnostics, `configured` and onMedia. `stream_exhausted` auto-disconnects.
(c) STEER. The same textarea becomes "Next direction". "Send direction" sends a `prompt` vN with an optional one-shot "End frame for next scene" and "Replace audio track" (auto-cleared after send). The Script card switches to "Cut to script" (replace) or "Queue script" (append). Chat steering: "Connect" opens an anonymous tmi.js IRC listener; `!direct <text>` is sanitized and throttled (2s global, 8s per user) and becomes "[chat @user] text"; `!frame`/`!snap` captures a frame. On the stage, "Capture frame" uploads a PNG via fal storage and sets it as the next end frame and the next session's first frame, and "Remix frame" evolves it via nano-banana-2/edit. Audio: "Queue on next direction" or "Mix in output" (a Web Audio mix into the single output MediaStream). Each applied direction also silently rotates a per-direction clip MediaRecorder into Convex `clips`.
(d) RECORD. "Record" (only while live) starts a MediaRecorder on the output stream and shows the REC pill with bytes. "Stop & save recording" uploads to Convex storage and a `recordings` row, or downloads `director-<ts>.webm` if Convex is off, and shows "Uploading…" then "X MB uploaded".
(e) BROADCAST. In the Twitch strip, "Connect to Twitch" runs an OAuth redirect to id.twitch.tv with redirect_uri `/admin`, then `?code&state` is exchanged at `/api/twitch/connect` and the stream key is stored in localStorage `wzrd_twitch_auth`. Alternatively the operator can use "Paste a stream key instead". "Go live on Twitch" negotiates WHIP to g.webrtc.live-video.net and shows "Stop broadcast" plus a green "● pushing to Twitch ingest…" line. The broadcast auto-stops when the Director session ends.
(f) STOP. "Stop" runs disconnect(): it flushes the clip, stops the recorder, sends `stop`, closes the session, uploads the recording and marks the Convex session ended.

## Problems
- **[critical] [states]** `dashboard/components/TrackManager.tsx:130-142` — [verified] The autoplaying MorphSlider hijacks the operator's track selection. `autoplay autoplayDelay={6}` calls `engine.move(1)` (MorphSlider.tsx:500-502), which calls `announce()` and then `onIndexChange` (MorphSlider.tsx:318, 482), which TrackManager wires to `selectSliderTrack`, which runs `setSelected(...)` (TrackManager.tsx:91). With 2 or more covered tracks, the selected track silently advances about 6s after any selection unless the pointer is over the slider. "Use for session", "Queue on next direction" and "Mix in output" (TrackManager.tsx:199-221) then act on a track the operator did not choose, possibly mid-broadcast.
- **[high] [visual-hierarchy]** `dashboard/components/DirectorPlayer.tsx:1082` — [verified layout math, estimate at 1440x900] The stage is `aspect-video` at the full width of the max-w-7xl column (app/layout.tsx:63), about 1168x657px. The header, nav, card header and padding add about 260px above it, so at a 1440x900 viewport the stage bottom is cut off and every control is below the fold: prompt, Start/Stop, Send direction, Record, Go live. During a live show the operator must scroll away from program output to steer or stop, and the Script, Chat and Audio cards are several screens further down.
- **[high] [color]** `dashboard/components/DirectorPlayer.tsx:1145-1149` — [verified] Tally semantics are conflated and inverted relative to broadcast conventions. Stage HUD: a red pulsing dot plus "Live" means only that the WebRTC session with fal is up. Header pill: green 'live' (1060-1061). REC: a red pulsing pill (1071-1076). Actual public ON AIR (Twitch WHIP) appears only as a small green mono sentence inside the Twitch strip (TwitchBroadcast.tsx:212-216). There is no persistent, unmistakable on-air indicator, and red is spent on a non-public state.
- **[high] [states]** `dashboard/lib/twitchWhip.ts:75-80` — [verified] The WHIP session exposes `pc`, but TwitchBroadcast never attaches `connectionstatechange` or `iceconnectionstatechange` listeners and never calls `getStats()` (TwitchBroadcast.tsx:137-160). If ingest drops, the UI keeps showing "Stop broadcast" and "● pushing to Twitch ingest — viewers see the stream on your channel". There is no bitrate, fps or RTT readout for the most consequential output. `stop` is only `pc.close()` with no WHIP DELETE.
- **[high] [motion]** `dashboard/components/DirectorPlayer.tsx:1085-1113` — [verified gating, inferred runtime] The loading overlay renders only while `!live`, but the 'Building world' and 'Generating first scene' steps are driven by later events (`configured` at 550, `chunk` at 644, onMedia at 969). The fal WMA 'live' state is transport-level (wma.js header docs), so the overlay likely disappears before world build and first frame, leaving a black stage with a blue dither glow and "Live · 0s". Step 0 is labelled in the past tense, "Network checked" (54-60), yet it is the pulsing current step immediately after open (1012). The animation is a plain lucide Circle list with `animate-pulse`, with no brand, no elapsed timer and no diagnostic detail.
- **[high] [performance]** `dashboard/components/DirectorPlayer.tsx:539` — [verified] The log is flooded with noise and the whole tree re-renders constantly. `appendLog` runs for every data message before the `pong` early-return (541), and the ping interval is 1000ms (1021-1027) even though the comment at 1016 says every 5s. With the 50-line cap (174), the log holds under a minute of mostly 'pong'/'chunk' lines. Real warnings such as `prompt_rejected`, `convex:` and `clip:` scroll away within seconds. Each pong also calls setLog, setPingMs and setElapsedSeconds, re-rendering the 1342-line DirectorPlayer and every child card (ScriptEditor, ChatSteerer, TrackManager with inline callbacks) at 2 or more Hz.
- **[high] [states]** `dashboard/components/DirectorPlayer.tsx:1194` — [verified] Locked session settings are hidden rather than shown read-only while live or busy: `{!live && !busy && (<details>…)}`. The `disabled={live || busy}` passed at 1203 is therefore dead code. Mid-show, the operator cannot see which resolution, aspect ratio, seed, memory, character name, character sheet or first frame is locked in. The only evidence is a raw URL line, "Continuity frame set: …" (1188-1190).
- **[high] [responsive]** `dashboard/components/DirectorPlayer.tsx:1082` — [verified] The stage ignores the chosen aspect ratio. `aspect-video` is hard-coded while DirectorSettingsForm offers 9:16 and 1:1 (DirectorSettingsForm.tsx:59-61). A vertical 9:16 stream ends up pillarboxed in a 1168px-wide 16:9 box using about a third of the width, and the HUD and overlay chips float over empty dither.
- **[medium] [visual-hierarchy]** `dashboard/components/DirectorPlayer.tsx:1242-1258` — [verified] The action hierarchy is wrong. "Stop" (1254) uses the same neutral `.fal-button-secondary` as "Send direction" and "Record", has no confirm or hold-to-stop, and stays clickable during 'closing', which can call disconnect() twice. "Go live on Twitch" (TwitchBroadcast.tsx:201-209) is a `text-xs !py-1` secondary button, the smallest control on the page for the only public action. "Start Director" is the only branded button.
- **[medium] [copy]** `dashboard/components/DirectorPlayer.tsx:1212-1226` — [verified] The premise and the next direction share one `prompt` state (131). After going live, the textarea still holds the opening premise, and it is not cleared after `sendPrompt` (650-709), so repeated 'Send direction' re-sends stale text. There is no Cmd/Ctrl+Enter, no history recall and no character count. The `<label>` has no htmlFor and the textarea no id. "Applied: {activePrompt}" dumps full wire text, including '[chat @user]' and the anchor prefix, as unstyled gray text.
- **[medium] [copy]** `dashboard/components/DirectorSettingsForm.tsx:103` — [verified] The helper copy says the character name is "Prefixed into chat directions + remix prompts.", but `sendPrompt` anchors the name only on configure: `const anchor = configure ? settings.characterName.trim() : ''` (DirectorPlayer.tsx:656). Chat and live directions are never prefixed. Other copy is jargon: "Last frame of first chunk" (147), and "Memory" and "Seed" are explained only by `title` tooltips (65, 78).
- **[medium] [consistency]** `dashboard/tailwind.config.js:27` — [verified with flattenColorPalette] There is a brand token collision. The flat `fal-primary` object is commented "wzrd.tech chrome blue" (#4f83cc), but the nested `fal.primary` (line 74) wins, so `fal-primary-500` = #6d28d9 violet. Live Control therefore mixes blue (DitherButton/DitherGradient `color="blue"`), violet focus rings and links, a hand-rolled violet TrackManager theme (TrackManager.tsx:128, 154-157, 187), and stock green/yellow/red. The violet focus ring on the dark card (#6d28d9 on #111827) is 2.50:1, below the WCAG 1.4.11 minimum of 3:1.
- **[medium] [dark-mode]** `dashboard/components/DirectorPlayer.tsx:1292` — [verified] The error box is `bg-red-50 border-red-200` with only `dark:text-red-400`. In dark mode it renders as a bright pink slab with text contrast of 2.53:1, which fails AA. It has no role="alert" or aria-live, so the failure that the admin-testing skill checks for is never announced. A `prompt_rejected` error (600) persists until the next Start, with no dismiss.
- **[medium] [a11y]** `dashboard/components/TrackManager.tsx:152-160` — [verified] There are several a11y gaps across the surface. Track rows are `<li onClick>` with no role, tabIndex or key handler, so they cannot be selected from the keyboard. Settings labels are not associated with their controls (DirectorSettingsForm.tsx:41-186 has no htmlFor/id). The Script offset uses only `title` (ScriptEditor.tsx:106-113). The AssetUrlInput text field is placeholder-only (AssetUrlInput.tsx:46-53). The chat prefix input is title-only (ChatSteerer.tsx:188) and the stream key input is placeholder-only (TwitchBroadcast.tsx:222-228). Repo-wide there are zero aria-live regions and zero data-testids. ReferenceAssetManager actions are `sm:opacity-0 sm:group-hover:opacity-100` with no focus-within, so they are invisible to keyboard users (ReferenceAssetManager.tsx:109). No keyboard shortcuts exist anywhere (no onKeyDown or keydown handlers).
- **[medium] [states]** `dashboard/components/DirectorPlayer.tsx:1145-1166` — [verified] Telemetry is present but illegible. Elapsed time is raw seconds ("Live · 1834s") rather than HH:MM:SS. Ping is always `text-yellow-300`, whatever its value. buf and gen have no thresholds or trend. The session allowance countdown sits only in a tiny gray mono line below the stage, with no warning as it approaches zero before `stream_exhausted` kills the session (631-636). REC shows bytes, not duration (1074). Per-direction clip capture (465-507) has no UI indicator at all.
- **[medium] [states]** `dashboard/components/ChatSteerer.tsx:81-100` — [verified] Chat steering is opaque to the operator. The chat log (192-203) does not mark which lines became directions, which were throttled or which triggered `!frame`. `!frame`/`!snap` bypass the 2s/8s throttle entirely (81-84), so any viewer can repeatedly trigger fal storage uploads. A missing NEXT_PUBLIC_TWITCH_CHANNEL silently disables Connect and shows "#…" (150, 159) with no explanation. Connecting shows no spinner or label change. There are two different 'Disconnect' buttons with the same Unplug icon: TwitchBroadcast.tsx:180 forgets the stored auth and ChatSteerer.tsx:171 drops IRC.
- **[medium] [consistency]** `dashboard/components/TrackManager.tsx:94` — [verified] Structure and spacing are inconsistent. DirectorPlayer returns one wrapper, so `space-y-8` in app/admin/page.tsx:7 has no effect. ScriptEditor and ChatSteerer add `mt-4` (ScriptEditor.tsx:71, ChatSteerer.tsx:132), but TrackManager's `fal-card` has no margin, so the Audio library butts against the Chat card. Heading levels are mixed: h3 for Director, Script and Chat, but h2 for Audio library (TrackManager.tsx:96). The Director card header JSX is mis-nested and mis-indented (DirectorPlayer.tsx:1050-1052).
- **[medium] [states]** `dashboard/components/DirectorPlayer.tsx:1188-1190` — [verified] The continuity frame appears as raw URL text rather than a thumbnail. Capture and Remix silently overwrite `settings.imageUrl` for the next session (767, 805) with no visible diff. The captured frame populates the live 'End frame for next scene' AssetUrlInput (h-12 thumb) far below the stage.
- **[low] [code-structure]** `dashboard/components/ScriptEditor.tsx:103-104` — [verified] Beats are keyed by array index, and the `expanded` state is keyed by index too (58, 124). Deleting a beat shifts the expanded asset panels onto the wrong beat. The editor list is not sorted by offset (only `beatsToWire` sorts), so the list order can differ from the playback order. Even though `playbackSeconds` is available, the only progress feedback is the header text " · beat @Xs playing" (80). The newBeat default of +10s is invisible.
- **[low] [states]** `dashboard/components/ScriptTemplatePicker.tsx:99-106` — [verified] Loading and empty are conflated: `if (!boards?.length)` is true while the query is still undefined, so "Open shotboard editor" flashes before the select appears. The `applied` state is never rendered, so after a `?transfer=` or template load the Script card shows no source badge. `?transfer=`/`?board=` are never removed from the URL (47-53), so a reload re-applies the transfer and overwrites any edits to the beats.
- **[low] [performance]** `dashboard/components/reactbits/Dither.jsx:173-186` — [verified] Three always-on requestAnimationFrame render loops compete with live video decode, up to two MediaRecorders, a Web Audio graph and WHIP H264 encode: the global Dither WebGL (never pauses; DitherBackground does not use the `disableAnimation` prop or prefers-reduced-motion), the MorphSlider WebGL loop that renders every frame (MorphSlider.tsx:304-309), and the video element. This matters most on the operator's streaming machine.
- **[low] [typography]** `dashboard/tailwind.config.js:121-128` — [verified] Font weights are remapped: normal 300, medium 400, semibold 500, bold 500, on top of body weight 300 (globals.css:73). Card titles (`font-semibold`) render at 500 and labels (`font-medium`) at 400, so the type hierarchy is nearly flat. Status data is not set in `tabular-nums`, so the HUD numbers jitter as they tick.
- **[low] [code-structure]** `dashboard/components/TestControlPanel.tsx:1` — [verified by grep, zero importers] This is dead legacy LTX code. TestControlPanel.tsx (1163 lines) and WebRTCPlayer.tsx (252) are never imported. The same goes for PerformanceMetrics, GenerationHistory, AIPerformanceBreakdown, QueueVisualization, RealtimeChart, hooks/useRealtimeData.ts, hooks/useRealtimeWebSocket.ts, utils/falApi.ts (used only by a dead hook), utils/falUpload.ts, and types.ts (imported only by the dead files). ImageGenerationControls is NOT dead: CharacterLibraryPage, LocationLibraryPage and AssetStudioVisualFixture use it. Leftover LTX mentions remain in the useDirectorPersistence.ts:8 SessionModel union ('ltxv1' | 'ltx-2.3'…) and the root metadata description (app/layout.tsx:23, "LTX + Director models").
- **[low] [copy]** `.agents/skills/admin-testing/SKILL.md:12` — [verified] The test skill is stale. It says "Use the four admin tabs" and "The Director card is the only Live Control content", but AdminNav now has 7 tabs (AdminNav.tsx:7-15) and Live Control also hosts the Script, Chat steering and Audio library cards. A redesign should update the skill in the same PR rather than break its assumptions.

## Redesign opportunities
### Control Room shell: stage-first, zero-scroll, three-zone layout (transformative) — CSV: Glass Surface, Spotlight Card
Replace the vertical card stack with a full-viewport broadcast layout for /admin only, breaking out of max-w-7xl through a route-level wrapper (for example a `ControlRoom` root using `w-[min(100vw-2rem,1920px)]` centered, and `h-[calc(100dvh-var(--chrome-h))]`).

The grid is `grid-cols-[300px_minmax(0,1fr)_380px] grid-rows-[minmax(0,1fr)_auto_auto]`:
- LEFT RAIL, 'Session sheet': a Coast identity card (character sheet and first-frame thumbnails, name token), settings as chips when locked (read-only during live, not hidden) and editable before the session, plus the preflight checklist.
- CENTER, 'Program monitor': the aspect ratio follows `settings.aspectRatio` with `max-h-full` and object-contain, the HUD overlays it, and a sticky TRANSPORT BAR sits directly under it (Start/Stop, Record, Capture, Remix, Mute, Go Live) with one-line telemetry.
- RIGHT RAIL: tabs for Directions (composer plus queue), Chat and Events.
- BOTTOM DOCK (collapsible, 180-240px): Beat timeline plus Audio deck.

Breakpoints: below 1280px the right rail becomes a slide-over drawer. Below 768px use a single column with a sticky mini monitor (`position: sticky; top:0`) and segmented tabs.

Design tokens: new CSS variables on :root and .dark: `--cr-bg:#06080d`, `--cr-panel:rgba(11,15,23,.82)` with `backdrop-blur-md`, `--cr-hairline:rgba(255,255,255,.07)`, `--brand-chrome:#4f83cc` (resolve the fal-primary collision by renaming, not by editing dither-kit), `--tally-program:#ff3b30`, `--tally-preview:#30d158`, `--signal-amber:#ffb020`. Radius 10-14px, 1px hairlines, and panel headers textured with `<DitherGradient from='blue' cell={2} opacity={0.18}/>` so the dither identity carries into the chrome. The global DitherBackground stays and shows around the shell's outer margin.

### Broadcast tally system (PREVIEW / REC / ON AIR) with real signal truth (transformative) — CSV: Border Glow, Electric Border, Split Flap Text, Arcade pixel, Counter
Add a TallyBar pinned to the top edge of the Program monitor, with three independent lamps set in mono caps with tabular numbers:
- STANDBY/PREVIEW (green): the Director session is live and the first frame has been decoded.
- REC (red outline dot plus HH:MM:SS and size): the MediaRecorder state.
- ON AIR (solid red fill): WHIP `pc.connectionState==='connected'` AND outbound `bytesSent` increasing in `getStats()`, polled every 2s.

When ON AIR, the monitor gets a 2px red ring. On transition only, play a brief 600ms energized border (restrained Electric Border or Border Glow), then settle to static. Mirror ON AIR in `document.title` ("● ON AIR · stream.wzrd.tech") and a red favicon dot.

Re-map colors: red is reserved for public/recording, green for healthy preview, amber for degraded. The Director HUD 'Live' dot becomes 'PREVIEW' in green. An ON AIR lamp label can flip with Split Flap Text on state change.

This needs twitchWhip.ts to expose connection-state and stats callbacks, a wrapper-only change.

### Signal-acquisition loader (the new loading animation), gated on the first decoded frame (transformative) — CSV: Stepper, Decrypted Text, Scanner, Pixel Transition, Radar, Noise
Replace the lucide checklist with a full-stage ConnectSequence that stays up until the FIRST DECODED FRAME: `video.requestVideoFrameCallback` or `loadeddata` after `srcObject` is set, not transport 'live'. This closes the black-stage gap. Phases map to real events:
1. AUTHORIZING (proxy/auth diagnostics)
2. ALLOCATING GPU ('Finding a machine'; ice-servers/network-path)
3. HANDSHAKE (connecting/connection-state)
4. WORLD BUILT (`configured`)
5. FIRST FRAME

Visual: a Coast silhouette or character-sheet key art resolves out of 2px Bayer-dithered cells whose density threshold rises per phase. Reuse the ordered-dither math style of dither-kit in a new component; do not edit the kit. Add a slow horizontal scan band (Scanner) and phase labels that resolve with Decrypted Text. Show a mono elapsed counter (00:07.3), the latest diagnostic detail line (e.g. 'ICE host 3 · relay 1', from `onDiagnostic` detail/observed), and an always-visible 'Cancel (Esc)' action. On first frame, a 400ms Pixel Transition dissolves from dither to video.

prefers-reduced-motion: a static segmented progress bar plus a 150ms crossfade. Copy is present-progressive ('Checking network…' becomes 'Network OK').

Assets, generated for Devin via fal:
- GPT Image 2.5 Sunburst `openai/gpt-image-2.5/sunburst/edit`, with the Coast character sheet as the reference image, for a 'Coast at the director's monitor / standby' key art in 16:9 (1920x1080), 9:16 (1080x1920) and 1:1 (1080x1080). Save to `public/brand/coast/standby-{16x9,9x16,1x1}.webp` with a dark, low-detail background so the dither threshold reads.
- MiniMax H3 Max for a 5-6s seamless muted loop 'Coast tuning a CRT, idle breathing', encoded as webm/mp4 plus a poster, used at 35% under the dither mask during phases 1-3.

### Beat timeline dock (Resolve-style) with a direction lane and clip markers (high) — CSV: Animated List, Counter
Turn the Script card into a horizontal timeline:
- A seconds ruler.
- Each beat is a clip block from its offset to the next beat, with an endImageUrl thumbnail filmstrip, the prompt excerpt, and an audio glyph if audioUrl is set.
- A playhead driven by `playbackSeconds`, and the active beat highlighted.
- Drag horizontally to retime (writes `offset` in whole seconds, snapped 1s, Shift for 5s). Click to open an inspector popover with prompt, end frame and audio via AssetUrlInput. Double-click an empty area to add a beat there.
- Stable client-only `id` per beat (stripped by beatsToWire) to fix the index-key bugs.
- A second lane, DIRECTIONS, plots every RoutedDirection by wall-clock time as a version badge (vN) colored by status: sent (hollow), pending (amber), applied (green check), rejected (red with reason tooltip). Chat-sourced directions carry an avatar.
- A third lane, CLIPS, shows the segment boundaries created by rotateClip, linking to /admin/clips.
- The header shows a source badge ('From Shotboard: <title>' or 'Prepared Director transfer') and the transport actions 'Cut to script' (replace) and 'Queue script' (append) with shortcuts. Before connect, the 'Send with session start' toggle becomes a switch in the dock header.

### Direction composer, command palette and a complete keyboard map (high) — CSV: Text Type, The typer, Animated List
Split the premise from the composer. The premise becomes a read-only 'Show premise' block in the Session sheet once live. The composer is a dedicated textarea that clears on send and supports:
- ⌘/Ctrl+Enter to send.
- ↑/↓ to recall the last 20 directions.
- A character counter.
- An '@' insert of the character token from settings.characterName.
- Attachment chips for 'End frame' (thumbnail) and 'Replace audio' (track name) that visibly consume on send, mirroring the one-shot protocol.

After send, the new vN row animates into the queue (Animated List) and shows a Text Type confirmation when applied.

⌘K opens a command palette (Start/Stop Director, Send direction, Capture/Remix frame, Record, Go live/Stop broadcast, Cut/Queue script, Mix track, toggle chat steering, Mute, Open event console) that shows each action's shortcut.

Global shortcuts are ignored while focus is in inputs:
- ⌘↵ Start (idle)
- Esc cancel connect
- R record toggle
- F capture frame, ⇧F remix
- M mute
- C chat steering on/off
- ⌘⇧L Go live (hold 600ms)
- ⌘. Stop Director (hold 600ms, ring-fill affordance)
- ? shortcut sheet

State changes are announced through a single visually hidden `aria-live=polite` region, with errors in `role=alert`.

### Telemetry strip and event console (high) — CSV: Count Up, Counter, Faulty Terminal
Under the monitor, a 32px strip in JetBrains Mono `tabular-nums`:
- Elapsed as HH:MM:SS.
- A session-allowance ring countdown that turns amber at 5:00 and red at 1:00, with a toast at each threshold.
- Ping, buffer and gen as 60s dither-kit `<Sparkline data color>` mini charts. Import them only; do not modify the kit.
- Thresholds: ping under 150ms green, under 400ms amber, otherwise red; buffer under 1.0s amber.
- REC size and duration.
- WHIP out kbps, fps and RTT.

Numbers ease with Count Up only when they change by more than 10%, to avoid jitter.

Replace the `<pre>` with an EventConsole drawer: an external ring buffer (500 entries) with level (debug/info/warn/error), source (director/convex/clip/chat/twitch/audio) and filters. pong/chunk are debug and hidden by default. It supports copy-to-clipboard and 'pin errors'. It must not re-render the page on every entry (use useSyncExternalStore). Errors surface as a dismissible inline banner (dark-safe tokens, AA contrast) plus a toast.

### Chat desk with moderation feedback (medium) — CSV: Animated List
Right-rail Chat tab:
- A feed with DitherAvatar and per-line status badges: '→ v14 applied', 'throttled · 6s', '!frame captured', 'ignored (steering off)'.
- Per-user cooldown micro-rings.
- A header switch 'Chat can direct' (hotkey C), an editable prefix chip (!direct), and an optional 'Approve mode' that holds chat directions in a queue for one-click send or reject.
- Throttle `!frame` (e.g. 10s global).
- An explicit not-configured state naming NEXT_PUBLIC_TWITCH_CHANNEL.
- A connecting spinner, and a distinct label 'Disconnect chat' versus Twitch 'Forget account'.

New entries stagger in with Animated List. Reduced motion shows them instantly.

### Audio deck: explicit selection, routing and bus meters (medium) — CSV: Morph Slider, Elastic Slider
Stop the carousel from owning selection. Either set `autoplay` to false on Live Control or make the MorphSlider display-only, with selection changing only on an explicit click or keyboard. Promote an 'Armed track' card with a segmented routing control: 'Session target' (configure audio_url), 'Next direction' (one-shot), 'Local mix' (Web Audio). Add two faders, Director bus and Music bus, with VU meters from AnalyserNodes inserted after directorGain and musicGain (restrained, not rubbery elastic). Keep the Start (s) offset and Loop. Delete confirms via an undo toast. Track rows become buttons or radios (`role=radio` in a radiogroup) with focus rings. Keep the MorphSlider as a smaller 'Coast originals' art display in the deck header.

### Standby slate, failure slate and branded empty states (medium) — CSV: Noise, Symbols effect, Arcade pixel
When idle, the Program monitor shows a branded slate instead of 'Director offline': the generated Coast standby key art (matched to the selected aspect ratio) rendered through a subtle Bayer dither with a Noise grain overlay, the show premise in large type, and the hint '⌘↵ to go to air'. A failure slate appears for 'failed' and 'closed' states, showing the error summary, a 'Retry' button (same connect()) and a 'View events' link. Empty states for Script ('Load from Shotboard' / 'Add first beat'), Chat and Audio use small Coast pose spot illustrations from the same GPT Image 2.5 Sunburst batch (edit with the Coast character sheet as reference; transparent PNG/WebP at 512px, in `public/brand/coast/empty-*.webp`). Optionally, a Symbols effect treatment on the last captured frame as the 'continuity frame' preview.

### Preflight and session sheet with a configuration checklist (medium) — CSV: Stepper, Spotlight Card
The left rail starts with a Preflight list computed WITHOUT network calls, so it cannot add console errors in unconfigured runs:
- Convex (useConvexEnabled), which also tells the operator that recordings will download instead of upload.
- Twitch channel env (NEXT_PUBLIC_TWITCH_CHANNEL).
- Twitch OAuth client id (NEXT_PUBLIC_TWITCH_CLIENT_ID), or a stream key already stored.
- Character sheet present.
- First frame present.
- Script beats count and whether they are attached to configure.

Each row shows ok, warn or missing with a one-line fix. FAL readiness is shown as 'verified on start' rather than probed. Below the checklist, the settings render as editable fields before start and as locked chips while live (1080p · 16:9 · mem 12 · seed 42 · 192 kbps), with thumbnails for the first frame, end frame and character sheet, plus a diff marker when Capture or Remix has replaced the next session's first frame.

## States inventory
DIRECTOR CARD (dashboard/components/DirectorPlayer.tsx)

- **idle.** Header pill `{state}`='idle' is gray (1058-1070). Stage shows `bg-black` plus DitherGradient blue glow and "Director offline" in gray-400 text (1108-1110). The `<details>` "Session settings (locked once connected)" is visible and collapsed (1194-1210). Textarea label: "Opening prompt (the series premise)" (1214). Buttons: the DitherButton "Start Director" (1243-1252); "Send direction" disabled at opacity-50 (1259-1266). The Twitch strip is visible; "Go live on Twitch" is disabled with title 'Start the Director session first'. The log is hidden when empty (1295).
- **opening.** Pill is yellow 'opening'. Overlay is a `bg-black/70` box listing the five CONNECT_STEPS with green, pulsing or gray Circle icons, plus an underlined "Cancel" (1087-1106). The telemetry/directions block is visible (1159). Settings are hidden (1194). Buttons: "Stop" (`fal-button-secondary`, 1254) and "Send direction" disabled.
- **live (transport).** Pill is green 'live'. The overlay is removed (1085). The top-left HUD reads "Live · Ns", with "Ping · N ms" in yellow-300 and "buf Ns"/"gen Ns" in gray-300 (1145-1154). "Capture frame" is bottom-left; "Remix frame" appears only after a capture (1123-1144). The mute toggle is bottom-right, `aria-label` 'Unmute'/'Mute' (1116-1122). Below the stage: "Session allowance: m:ss · about Nm remaining", the directions list (last 8, sent/pending/applied/rejected dots) and "Continuity frame set: <url>" (1159-1192). Label: "Next direction" (1214). "End frame for next scene (optional)" and "Replace audio track (optional)" AssetUrlInputs appear (1227-1238). "Record" appears (1267-1272), along with "Stop".
- **live but no frame yet.** Likely a black stage with the HUD and no loader (inferred; see problems).
- **recording.** A red pulsing pill "REC 12.3 MB" appears in the header (1071-1076). "Stop & save recording" (Upload icon) replaces "Record" (1273-1284).
- **uploading.** Gray text "Uploading…" appears (1285). On success, green text "12.3 MB uploaded" persists (1286). Convex-off fallback: the log line 'Recording captured but NEXT_PUBLIC_CONVEX_URL is not set; download it instead.' and an auto-download of `director-<ts>.webm` (297-305). Upload failure: the orphaned blob is deleted, then the file is downloaded (333-354).
- **capturing / remixing.** Button text changes to "Capturing…" or "Remixing…" with disabled:opacity-50 (1131, 1141). Failures go to the log only (770, 808).
- **generating sheet.** The link-button reads "Generating…" (DirectorSettingsForm.tsx:125). Failures go to the log only (839).
- **prompt_rejected.** The error box reads "Prompt rejected: <reason>" and the direction dot turns red (598-602, 1176).
- **error / failed.** Pill is red 'failed'. The stage shows "Session failed" (1109). Error box: `text-sm text-red-700 dark:text-red-400 bg-red-50 border border-red-200` (1291-1293). "Start Director" is restored, because `!live && !busy` is true (1242).
- **closing.** Pill is yellow 'closing' and the stage shows "Stopping…" (1109). "Stop" stays visible and clickable (1254).
- **closed.** The SDK state 'closed' is not handled explicitly. The pill shows gray 'closed', and if `connectStep >= 0` the connect overlay with "Cancel" can re-appear (1087), which is a misleading state.
- **stream_exhausted.** Auto-disconnect with the log line 'stream_exhausted: <reason>' (631-636). There is no UI warning beforehand.
- **Session settings form.** Disabled fields (`fieldset disabled`, DirectorSettingsForm.tsx:38) are effectively never shown, because the form is hidden while live or busy. When a script is planned, "Last frame of first chunk (scripted)" and "Target audio (scripted)" are disabled with the title 'Not available while a script is queued for this session' (143-172).

SCRIPT CARD (ScriptEditor.tsx)

- The header shows "N beat(s)", plus " · beat @Xs playing" when `playbackSeconds` is set (78-81).
- The empty state has no illustration: only "Add shot" plus the checkbox "Send with session start" (163-208).
- While live, "Cut to script" and "Queue script" are disabled when there are no wire beats (173-195).
- Per-beat assets are collapsed behind a chevron with `aria-label` 'Optional assets' (122-129). Delete uses `aria-label` 'Delete shot' (130-137).
- The template picker is hidden when Convex is off (90). A failure in the error boundary hides it silently and emits a console.warn (28-39).

SCRIPT TEMPLATE PICKER (ScriptTemplatePicker.tsx)

- While loading, and when no boards exist, it renders the "Open shotboard editor" link (99-106).
- Otherwise a select shows "Load template…" plus the board titles or 'Untitled', with an "edit" link (108-133).
- Applying a `?transfer=` or `?board=` has no visible confirmation beyond the Director log line (DirectorPlayer.tsx:1318).

CHAT STEERING (ChatSteerer.tsx)

- The pill reads 'listening' in green or 'offline' in gray (139-145).
- "Connect" is disabled while connecting or when the channel is missing, with no spinner (157-164). "Disconnect" (166-172).
- Error: red status text (190). Missing channel: "#…" in the description (150).
- The chat log (last 20 lines, max-h-32) is hidden when empty (192-203). There is no accepted or throttled marking.

AUDIO LIBRARY (TrackManager.tsx)

- The whole card is absent when Convex is off (33).
- States: "Loading…" (121), and "No songs yet — upload one to use it as the stream's audio reference." (122-126). The "Upload song" button shows a spinner while uploading (110-117). Errors appear as red text (226).
- The MorphSlider section renders only when at least one track has both a cover and a URL (127-149).
- Track rows use violet selected styling (152-183). The selected-track panel holds the audio preview, Volume, Start (s), Loop, "Use for session", "Queue on next direction" (disabled when not live) and "Mix in output" (186-225).

TWITCH BROADCAST (TwitchBroadcast.tsx)

- Before auth, "Connect to Twitch" shows, reading "Connecting…" during the code exchange (183-192).
- The OAuth state-mismatch error reads 'OAuth state mismatch — try Connect to Twitch again' (66-68). A missing client id produces 'NEXT_PUBLIC_TWITCH_CLIENT_ID is not configured — paste a stream key instead', and only after a click (108-110).
- Once authenticated: "connected as {login}" plus "Disconnect" (172-182).
- The "Paste a stream key instead" `<details>` with a password input appears only when there is no auth (217-230).
- "Go live on Twitch" is disabled until the session is live and a key is ready. It reads "Negotiating…" while starting (200-209). While broadcasting: "Stop broadcast" in red text, plus the green line "● pushing to Twitch ingest — viewers see the stream on your channel" (193-199, 212-216).
- The broadcast auto-stops when the session ends, with a log line (95-105). Errors appear as red text (231). There is no degraded or disconnected state.

ASSET URL INPUT (AssetUrlInput.tsx)

- While uploading, it shows a Loader2 spinner and disables the input (70, 51). Errors appear as red text (89). An image value shows an h-12 thumbnail with `alt=""` (85-88). A value shows the X button `aria-label` 'Clear' (73-83).

REFERENCE ASSET MANAGER (ReferenceAssetManager.tsx)

- Not on Live Control; it is used by the Characters and Locations pages.
- States: 'Uploading…' (121); a limit-reached message and a disabled add button (48-51, 119); a `role=alert` error (126); a counter "n/MAX · drop or choose" (123); hover-revealed Primary/Remove buttons (109-114). The drop zone has no drag-over state.

GLOBAL

- Not-configured FAL has no client indicator. The error arrives from the SDK or proxy after Start, possibly as an upstream auth error (per the skill).
- There are no skeletons anywhere on this surface.

## Invariants
- The route `/admin` must render Live Control, and `/` must keep redirecting to `/admin` (app/page.tsx:4). The AdminNav tab label 'Live Control' → href '/admin' and the nav `aria-label="Admin sections"` stay unchanged (AdminNav.tsx:8, 21).
- admin-testing skill (SKILL.md:12): there must be a button whose accessible name is exactly **Start Director**. It must be visible in the idle state and must reappear (restored Start control) after a failed start. Today this is guaranteed by `!live && !busy` (DirectorPlayer.tsx:1242). If an icon-only or command-palette variant is added, the visible 'Start Director' button must remain.
- admin-testing skill: a failed start must render a visible error message on the page. Keep an error region, and add role=alert rather than removing the text.
- admin-testing skill: the operator must be able to 'Append a unique prompt' before starting. There must be an editable prompt textarea in the idle state, prefilled with DEFAULT_PROMPT ('A continuous original live-action stream following a group of friends as they explore a new city.', DirectorPlayer.tsx:29-30), and its value must be what connect() sends in `configure`.
- admin-testing skill (SKILL.md:14): the Director 'Record' button appears ONLY during a live session. Keep `live && !recording` gating (1267).
- admin-testing skill (SKILL.md:13): a fresh load of /admin in unconfigured mode must produce only the React DevTools info console message. The redesign must not add failing network requests on load (e.g., FAL, Twitch or Convex preflight probes that 401 or 500), React key or hydration warnings, or WebGL errors. The legacy 'FAL_KEY not configured' error must not reappear (do not re-import TestControlPanel or WebRTCPlayer).
- Keep a discoverable 'Director' region or heading on Live Control. The skill refers to 'The Director card', so for example keep an h2 or aria-label containing 'Director'. Keep the model id text `minimax/h3-max/director` (export DIRECTOR_MODEL, DirectorPlayer.tsx:27) visible somewhere.
- DirectorPanel contract: when Convex is enabled, render DirectorPlayer with `persistence={useDirectorPersistence()}`, otherwise standalone. Convex hooks must only run beneath ConvexProvider (useConvexEnabled gating in DirectorPanel.tsx, TrackManager.tsx:32-34 and ScriptEditor.tsx:59/90).
- Media pipeline: exactly ONE `<video ref={videoRef} autoPlay playsInline muted>` element must stay mounted across idle, opening, live, closing and failed. Layout switches must not conditionally unmount or remount it (srcObject is assigned imperatively at 254, 964 and 888). The default is `muted` true, for the autoplay policy.
- A single stable output MediaStream (`streamRef` / `outputStreamRef`) feeds preview, the main MediaRecorder, the rotating clip recorder and the Twitch WHIP. `getStream={() => streamRef.current}` must stay the source for TwitchBroadcast.
- `onUseForMix` must call `primeMusic(config)` synchronously inside the click handler, to satisfy the user-activation and autoplay rules (DirectorPlayer.tsx:1332-1338). Any redesigned 'Mix' control must preserve this.
- DirectorPlayer must not unmount mid-session unintentionally: its unmount effect flushes the clip, stops the recorder and closes the session (1034-1043). Tabs or panels inside Live Control must hide (CSS) rather than unmount DirectorPlayer. Navigating to other admin routes ends the session, as today.
- The disconnect teardown order must be preserved: clipClosing, then flushClip, then stopRecorder, then send {type:'stop'} and close, then upload the recording, then setSessionStatus 'ended' (860-905). The Stop and Cancel UI must call the same disconnect().
- Wire protocol (lib/directorProtocol.ts): `configure` carries protocol_version 1 and the locked settings. `prompt` messages must NOT include protocol_version (comment at lines 87-88). A script in configure excludes end_image_url and audio_url. Live end frame and audio are one-shot and cleared after send (692-694). beatsToWire filters empty beats and sorts them by offset. Any client-only beat `id` added for the timeline must be stripped before the wire.
- Chat safety: `sendChatDirection` strips `[\]<>\n\r@` from the author (max 32 chars) and `\n\r<>` from the text (max 300 chars), and prefixes '[chat @user]' (849-858). ChatSteerer's default prefix is '!direct' and `!frame`/`!snap` trigger a frame capture. The throttle is a 2s global minimum plus 8s per user (ChatSteerer.tsx:94-100). The anonymous tmi.js read-only connection is to `NEXT_PUBLIC_TWITCH_CHANNEL`.
- Twitch OAuth: TwitchBroadcast (or its successor) must be mounted on /admin at page load to complete `?code&state`. redirect_uri is `${origin}/admin`, the scope is `channel:read:stream_key`, and the exchange is POST `/api/twitch/connect`. Storage keys: localStorage `wzrd_twitch_auth` {login, streamKey}, sessionStorage `wzrd_twitch_oauth_state`. The WHIP endpoint is `https://g.webrtc.live-video.net:4443/v2/offer` with the H264 and Opus preference. Keep the manual stream-key fallback. The broadcast must auto-stop when the Director session ends, via the opRef invalidation that guards against late answers.
- Deep links: /admin consumes `?board=<shotboardId>` and `?transfer=<directorTransferId>` (ScriptTemplatePicker.tsx:47-53). ShotboardPage pushes `/admin?transfer=` (ShotboardPage.tsx:260). The picker links to `/admin/shotboard?board=<id>`. onTemplateApplied syncs firstFrame, characterName and characterSheet into settings.
- Theme persistence: localStorage key 'theme' with the `.dark` class on <html> (app/layout.tsx:11-19). DitherBackground reacts to that class through a MutationObserver. The global React Bits Dither background (components/DitherBackground.tsx) MUST be kept.
- Existing aria-labels to preserve or carry over: 'Unmute'/'Mute' (DirectorPlayer.tsx:1119), 'Optional assets' and 'Delete shot' (ScriptEditor.tsx:126, 134), 'Clear' (AssetUrlInput.tsx:79), `Delete ${track.name}`, `Preview ${track.name}`, 'Music mix volume', 'Music start offset', 'Coast originals artwork carousel' (TrackManager.tsx:179, 190, 192, 196, 128), 'Reference images', 'Use as primary image', 'Remove reference from this item' (ReferenceAssetManager.tsx:89, 110, 113). There are no data-testids in the repo today; adding them is safe.
- Visible strings that users or tests may rely on: 'Start Director', 'Stop', 'Send direction', 'Record', 'Stop & save recording', 'Capture frame', 'Remix frame', 'Cancel', 'Director offline', 'Session failed', 'Stopping…', 'Session settings', 'Next direction', 'Opening prompt (the series premise)', 'Connect to Twitch', 'Go live on Twitch', 'Stop broadcast', 'Paste a stream key instead', 'Chat steering', 'Chat can direct', 'Script', 'Add shot', 'Cut to script', 'Queue script', 'Send with session start', 'Load template…', 'Open shotboard editor', 'Audio library', 'Upload song', 'Use for session', 'Queue on next direction', 'Mix in output'. Renames are acceptable only if SKILL.md is updated in the same change, and 'Start Director' must not be renamed.
- Convex calls (unchanged signatures): api.sessions.create, api.sessions.setStatus, api.promptEvents.log, api.clips.create, api.clips.attachMedia, api.recordings.generateUploadUrl, api.recordings.deleteStorage and api.recordings.create (useDirectorPersistence.ts). TrackManager uses api.tracks.list, tracks.generateUploadUrl, tracks.add and tracks.remove. ScriptTemplatePicker uses api.shotboards.list, api.director.get and api.shotboards.load. ReferenceAssetManager uses api.assets.generateUploadUrl, assets.recordUpload and assets.getStorageUrl.
- All fal calls from the browser go through `FAL_SDK_PROXY_URL = '/api/fal/sdk-proxy'` (the FAL_KEY stays server-side). Frame remix and character sheet use `fal-ai/nano-banana-2/edit`. Do not add direct fal calls with keys in client code.
- dither-kit files (components/dither-kit/*) are pinned by sha256 in dither-kit.json. Do not edit them. Import and wrap them (DitherButton, DitherGradient, DitherAvatar, Sparkline) from new components instead.
- Clip capture semantics: one Convex clip row per applied direction version, deduped for the double `configured` / `prompt_applied` ack (clipSegVersionRef). Uploads are detached so they never block teardown. UI refactors must not move the rotateClip calls out of the handleData and onMedia paths.

## Refactor notes
DirectorPlayer.tsx is a 1342-line god component with about 33 useState hooks and about 35 refs. It mixes these concerns:
- The realtime session state machine (connect, disconnect, handleData, sendPrompt, sendScript).
- The Web Audio mixer (primeMusic, attachOutputStream, and the music refs).
- Main recording (startRecorder, stopRecorder, uploadRecording).
- Per-direction clip rotation (clipQueueRef, rotateClip, flushClip, uploadClipSegment).
- Frame tools (captureFrame, remixFrame, generateSheet).
- Telemetry (a 1Hz ping/elapsed interval).
- Logging.
- The whole page's JSX, including composition of the three sibling cards.

Because every piece of state lives at the top, each pong or elapsed tick re-renders ScriptEditor, ChatSteerer and TrackManager, and their callbacks are inline. The safe split below preserves behavior. Move the code verbatim first, then restyle.

1. `lib/director/useDirectorSession.ts`. Owns sessionRef, connectAttemptRef, promptVersionRef and promptsByVersionRef, plus connect, disconnect, sendPrompt, sendScript and handleData. Model state with a reducer: `{phase: 'idle'|'opening'|'acquiring'|'live'|'closing'|'failed'|'closed', connectStep, error, directions, activePrompt, sessionAllowance, playbackSeconds}`. Add 'acquiring' (transport live, no decoded frame yet). Keep the exact teardown ordering and the rotateClip call sites.
2. `lib/director/useOutputMixer.ts`. Holds the audio graph refs. Returns `{attachOutputStream, primeMusic, setMusicConfig, analysers}`, adding AnalyserNodes for VU meters.
3. `lib/director/useRecorder.ts` and `lib/director/useClipRotation.ts`. Keep the promise-queue semantics intact.
4. `lib/director/useFrameTools.ts`. Holds captureFrame, remixFrame and generateSheet.
5. `lib/director/telemetryStore.ts` and `lib/director/eventLog.ts`. External stores (useSyncExternalStore) for ping, buffer, gen and elapsed, and a 500-entry leveled ring-buffer log, so ticking numbers re-render only the HUD and strip leaves. Log pong at debug level (fixes the flood at line 539). Reconcile the ping interval (the 1000ms code versus the '5s' comment at 1016). Once the log is quiet, 2-5s is probably enough for ping.
6. Presentational components in `components/control-room/`:
   - `ControlRoom` (grid shell)
   - `ProgramMonitor` (the single persistent `<video>` plus overlays, with an aspect ratio from settings)
   - `ConnectSequence` (loader)
   - `TallyBar`
   - `TransportBar`
   - `TelemetryStrip` (dither-kit Sparkline)
   - `DirectionComposer`
   - `DirectionQueue`
   - `SessionSheet` (DirectorSettingsForm, reused for editing plus a read-only chip view)
   - `Preflight`
   - `BeatTimeline` (replaces ScriptEditor's list; keep ScriptEditor's props contract so DirectorPlayer wiring stays the same; give beats stable client ids)
   - `ChatDesk` (ChatSteerer logic extracted to `useTwitchChat` returning feed entries with status)
   - `AudioDeck` (TrackManager logic extracted to `useTrackLibrary`; fix the MorphSlider selection coupling)
   - `BroadcastPanel` (TwitchBroadcast logic extracted to `useTwitchBroadcast`; extend twitchWhip.ts to accept `onState` and `onStats` callbacks and poll `pc.getStats()`)
   - `EventConsole`
   - `CommandPalette` plus `useHotkeys` (ignore events from input, textarea, select and contenteditable)
7. UI primitives in `components/ui/`, consistent with components.json aliases and `cn()` in lib/utils.ts, clsx and tailwind-merge: `Button` with variants primary, secondary, danger, ghost, and 'hold' (a hold-to-confirm ring); `Field` (label with htmlFor/id wiring, fixing all the unassociated labels); `Pill`/`Tally`; `Panel` (replacing .fal-card and fal-card-header); `Toast`; and `LiveRegion`. This lets the long inline className strings (e.g. DirectorPlayer.tsx:1059-1067 and TrackManager.tsx:128, 154-157) collapse into variants.

Token cleanup: resolve the `fal-primary` collision in tailwind.config.js. The nested `fal.primary` (violet, line 74) overrides the flat chrome-blue `fal-primary` (line 27). Pick one brand primary and rename the other (e.g. `fal-violet`), then grep every `fal-primary-*` usage to confirm intent, because this changes focus rings and links site-wide. Add CSS-variable tokens for the control-room surfaces and tally colors. Consider registering the already-installed `tailwindcss-animate` and `@tailwindcss/typography` in `plugins: []` (tailwind.config.js:141); they are installed but unused.

Dead code, verified by zero-importer greps. It is safe to delete in a separate commit before the redesign: components/TestControlPanel.tsx, components/WebRTCPlayer.tsx, components/PerformanceMetrics.tsx, components/GenerationHistory.tsx, components/AIPerformanceBreakdown.tsx, components/QueueVisualization.tsx, components/RealtimeChart.tsx, hooks/useRealtimeData.ts, hooks/useRealtimeWebSocket.ts, utils/falApi.ts, utils/falUpload.ts and types.ts. First confirm that `app/api/fal/proxy` is still needed by something else. It is only referenced by the dead WebRTCPlayer's token fetch here, so check before removing it. Keep components/ImageGenerationControls.tsx, which is used by CharacterLibraryPage, LocationLibraryPage and AssetStudioVisualFixture. Also trim the 'ltx*' members from the SessionModel union in useDirectorPersistence.ts:8 only if the Convex schema validators allow it; otherwise leave the type. Update the metadata description at app/layout.tsx:23.

Small correctness fixes worth folding in, because the redesign touches the same lines:
- Disable 'Stop' during 'closing' (1254).
- Handle SDK state 'closed' explicitly and reset connectStep (1087).
- Clear `?transfer`/`?board` from the URL after applying (ScriptTemplatePicker.tsx:47-53).
- Distinguish loading from empty in the template picker (99).
- Throttle `!frame` (ChatSteerer.tsx:81).
- Fix the character-name helper copy (DirectorSettingsForm.tsx:103), or actually anchor live directions.
- Key beats by a stable id (ScriptEditor.tsx:103).
- Make track rows keyboard-operable (TrackManager.tsx:152).
- Show focus-within reveals in ReferenceAssetManager (109).
- Update .agents/skills/admin-testing/SKILL.md ('four admin tabs' and 'only Live Control content' are stale) in the same PR as the layout change.

Suggested order for Devin: (1) delete dead code and fix the tokens; (2) extract the hooks with no visual change and verify via the skill flow (Start Director → error → restored Start, with a clean console); (3) build the ControlRoom shell around the existing components; (4) replace the pieces one by one (monitor/loader → tally/transport → composer/queue → timeline → chat/audio/broadcast → console/palette); (5) generate the fal brand assets last and wire them in with static fallbacks, so an unconfigured run needs no network.
