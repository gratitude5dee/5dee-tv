> **Spec chapter Appendix A — Preserved contract.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## Appendix A — Preserved contract

This is the master contract. It merges and deduplicates §8.9, §9.9, §10.9 and §11.A.9–§11.D.9 with the Invariants lists of `docs/redesign/audit/{shell,live,shotboard,assets,data,states,fal}.md`. Every row was re-checked with `grep` against the code **as of 845147c**. This appendix ranks with §16, above every other section (§1.2).

**How to read it.**
- A value in quotes is exact, byte for byte, including `…` (U+2026), `’` (U+2019, from `&rsquo;`), `—` and `·`. `{x}` marks an interpolation whose expression and surrounding text are preserved.
- "Kind" says what must survive: visible text, accessible name (`aria-label`), `title`, `placeholder`, `alt`, id, class, role, storage key, URL parameter, Convex name, fal id, or a behaviour.
- An item may **move** to another component, breakpoint or DOM position that the page sections specify. Its text, accessible name and role do not change, and no `text-transform` is added or removed (§16.2 A16).
- An item changes only if A.12 lists the change. Any other change is a §1.8 item 1 stop-and-ask.
- Appendix B.3 lists the files that disappear. Their preserved items survive in the files named in the page sections' ledgers.

### A.1 Every route: shell, navigation, theme, carrier, platform

**A.1.1 Routes and navigation**

| Value | Kind | Where (845147c) |
|---|---|---|
| `/` redirects to `/admin` (`redirect('/admin')`) | behaviour | `app/page.tsx:4` |
| "Admin sections" on the single `<nav>` | aria-label | `components/AdminNav.tsx:21` |
| `'/admin'` "Live Control" (Radio) · `'/admin/shotboard'` "Shotboard" (Clapperboard) · `'/admin/characters'` "Characters" (UsersRound) · `'/admin/locations'` "Locations" (MapPin) · `'/admin/clips'` "Clips" (Film) · `'/admin/recordings'` "Recordings" (Video) · `'/admin/analytics'` "Twitch Analytics" (BarChart3), in this order | link hrefs, labels, icons (the `tabs` array stays byte-identical) | `components/AdminNav.tsx:7-15` |
| Active rule: exact match for `/admin`, `startsWith` for the others | behaviour | `components/AdminNav.tsx:23` |
| `if (process.env.NODE_ENV === 'production') notFound()` | behaviour | `app/admin/visual-test/page.tsx:5` |
| `/admin/shotboard` stays `'use client'` and wraps the editor in `<Suspense>` (a fallback is added, A.12) | behaviour | `app/admin/shotboard/page.tsx:1`, `:8` |
| `/admin/clips`, `/admin/recordings` and `/admin/analytics` stay `'use client'` pages | behaviour | each `page.tsx:1` |

**A.1.2 Brand strings and metadata**

| Value | Kind | Where |
|---|---|---|
| "stream.wzrd.tech admin" | `metadata.title` (becomes `title.default`, A.12) | `app/layout.tsx:22` |
| "WZRD.TECH" | `alt` of the wordmark image | `app/layout.tsx:47` |
| "Stream Admin" | visible text (stays in the DOM at every width: visible from 1536 px, sr-only below) | `app/layout.tsx:52` |
| "stream.wzrd.tech" | visible text (as above) | `app/layout.tsx:54` |
| "stream.wzrd.tech admin" + the current year | footer text (moves to the StatusRail from `xl`) | `app/layout.tsx:73`, `:77` |
| "Switch to light mode" / "Switch to dark mode" | `title` (kept on the Light and Dark ThemeSwitch segments) | `components/ThemeToggle.tsx:28` |

**A.1.3 Theme**

| Value | Kind | Where |
|---|---|---|
| `localStorage['theme']` holds exactly `'dark'` or `'light'` (choosing System removes the key) | storage key | read at `app/layout.tsx:13`; written at `components/ThemeToggle.tsx:19` |
| `.dark` on `<html>`, plus `document.documentElement.style.colorScheme` `'dark'`/`'light'` | class, behaviour | `app/layout.tsx:15-16`; `components/ThemeToggle.tsx:16-17` |
| The pre-paint `themeInit` script in `<head>`; its theme lines stay byte-identical (new blocks are appended, §7.6) | behaviour | `app/layout.tsx:11-19`, injected at `:34` |
| `suppressHydrationWarning` on `<html>` | attribute | `app/layout.tsx:32` |
| `darkMode: 'class'` | Tailwind config | `tailwind.config.js:3` |

**A.1.4 Carrier (the global Dither)**

| Value | Kind | Where |
|---|---|---|
| `<DitherBackground />` is the first DOM child of `<body>` | behaviour | `app/layout.tsx:37` |
| Host `fixed inset-0 -z-10 pointer-events-none` with `aria-hidden` | classes, attribute | `components/DitherBackground.tsx:23` |
| `dynamic(() => import('./reactbits/Dither'), { ssr: false })` | behaviour | `components/DitherBackground.tsx:6` |
| The `try`/`catch` WebGL-unavailable bail-out | behaviour | `components/reactbits/Dither.jsx:132-139` |
| `waveSpeed` 0.04 · `waveFrequency` 2.6 · `waveAmplitude` 0.4 · `colorNum` 4 · `pixelSize` 2 | props (half resolution with `pixelSize` 1 is the visual equivalent, §12.3.1) | `components/DitherBackground.tsx:25-27`, `:30-31` |
| Dark wave `[0.2, 0.34, 0.66]`, bg `[0.02, 0.03, 0.06]`; light wave `[0.5, 0.63, 0.86]`, bg `[0.98, 0.98, 1.0]` (now `--dither-wave`/`--dither-bg`, with the same values) | props → tokens | `components/DitherBackground.tsx:28-29` |
| `.dither-container` | class | `components/reactbits/Dither.jsx:141`, `:198`; `Dither.css:1` |

**A.1.5 Platform, middleware, API, Convex provider**

| Value | Kind | Where |
|---|---|---|
| `matcher: ['/admin/:path*', '/api/:path*']` | middleware config | `middleware.ts:56` |
| "Unauthorized: set CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD, or ADMIN_AUTH_MODE=edge-only if Cloudflare Access already protects this path" | 401 body | `middleware.ts:30` |
| "Unauthorized: Cloudflare Access assertion missing" | 401 body | `middleware.ts:44` |
| "Unauthorized: invalid Cloudflare Access assertion" | 401 body | `middleware.ts:51` |
| `/api/auth/convex`, `/api/fal/proxy`, `/api/fal/sdk-proxy`, `/api/twitch`, `/api/twitch/connect`, each with `export const runtime = 'edge'` | routes (never edited) | `app/api/**/route.ts` |
| The default export `ConvexClientProvider`; `useConvexEnabled()`; the no-client fallback that still renders children when `NEXT_PUBLIC_CONVEX_URL` is unset | public API | `components/ConvexClientProvider.tsx:36-51`, `:32-34`, `:40-42` |
| `fetch('/api/auth/convex', { credentials: 'include', cache: 'no-store' })` | behaviour | `components/ConvexClientProvider.tsx:13` |
| `ConvexNotConfigured({ feature })`; "Convex is not configured"; "Set `NEXT_PUBLIC_CONVEX_URL` to enable {feature}. Run `npx convex dev` in `dashboard/` to create a deployment." (the rendered `textContent` is preserved) | prop, visible text | `components/ConvexNotConfigured.tsx:3`, `:8`, `:10-12` |
| Every Convex hook mounts only when `useConvexEnabled() === true` | behaviour | `DirectorPanel.tsx:14-15`; `TrackManager.tsx:32-34`; `ScriptEditor.tsx:59`, `:90`; `shotboard/ShotboardPage.tsx:23-28`; `CharacterLibraryPage.tsx:43-45`; `LocationLibraryPage.tsx:42-44`; `app/admin/clips/page.tsx:86-87`; `recordings/page.tsx:135-136`; `analytics/page.tsx:122` |
| All 7 files in `dashboard/fonts/focal/`; JetBrains Mono with `variable: '--font-mono'` | files (D4), font | `dashboard/fonts/focal/`; `app/layout.tsx:8` |

### A.2 Live Control (`/admin`)

**A.2.1 Composition and identifiers**

| Value | Kind | Where |
|---|---|---|
| `DirectorPanel` renders `<DirectorPlayer persistence={useDirectorPersistence()} />` when Convex is enabled, and `<DirectorPlayer />` otherwise | behaviour | `components/DirectorPanel.tsx:7-16` |
| `export const DIRECTOR_MODEL = 'minimax/h3-max/director'`, shown as visible text under the Director heading | export, visible text | `components/DirectorPlayer.tsx:27`, `:1055` |
| "A continuous original live-action stream following a group of friends as they explore a new city." (DEFAULT_PROMPT; it prefills the premise textarea, and that value is what `configure` sends) | visible text, behaviour | `components/DirectorPlayer.tsx:29-30` |
| "Network checked", "Finding a machine", "Connecting", "Building world", "Generating first scene", in this order (CONNECT_STEPS) | visible text | `components/DirectorPlayer.tsx:54-60` |
| `export default function DirectorPlayer({ persistence })` | export | `components/DirectorPlayer.tsx` |

**A.2.2 DirectorPlayer strings**

| Value | Kind | Where (`components/DirectorPlayer.tsx`) |
|---|---|---|
| "Director (realtime WebRTC)" | heading text (the level changes, A.12) | `:1054` |
| `{state}` raw value | text → `data-state` (A.12) | `:1069` |
| "REC {formatBytes(recordedBytes)}" (`KB` with `toFixed(0)` below 1 MiB, else `MB` with `toFixed(1)`) | visible text | `:1074`; format at `:76-79` |
| "Cancel" (calls `disconnect()`) | button | `:1103-1104` |
| "Stopping…" · "Session failed" · "Director offline" | visible text | `:1109` |
| "Unmute" / "Mute" | aria-label | `:1119` |
| "Capture frame" / "Capturing…" | button text | `:1131` |
| "Snapshot this frame → becomes the next end frame + next session's first frame" | `title` | `:1128` |
| "Remix frame" / "Remixing…" | button text | `:1141` |
| "Evolve the captured frame with nano-banana-2 (same character, new shot)" | `title` | `:1138` |
| "Live" | visible text (its `' · {n}s'` suffix changes, A.12) | `:1148-1149` |
| "Ping · {pingMs} ms" | visible text | `:1151` |
| "buf {n.n}s" · "gen {n.n}s" | visible text | `:1152-1153` |
| "Session allowance: {m}:{ss}" + " · about {N}m remaining" | visible text | `:1163-1165` |
| "v{version} {status} — {text}" | visible text | `:1183` |
| "Continuity frame set: {url}" | visible text | `:1189` |
| "Session settings" + "(locked once connected)" | `<summary>` text | `:1197` |
| "Next direction" / "Opening prompt (the series premise)" | label | `:1214` |
| "Applied: {activePrompt}" | visible text | `:1224` |
| "End frame for next scene (optional)" · "Replace audio track (optional)" | label | `:1230`, `:1234` |
| "Image URL or upload" · "Audio URL or upload" | placeholder | `:1231`, `:1235` |
| "Start Director" | button (exactly one; visible when idle; restored after a failed start) | `:1251` |
| "Stop" | button | `:1256` |
| "Send direction" (disabled unless live with a non-empty prompt) | button | `:1265` |
| "Record" (only while `live && !recording`) | button | `:1267-1270` |
| "Stop & save recording" | button | `:1282` |
| "Uploading…" · "{size} uploaded" | visible text | `:1285`, `:331` |
| "Prompt rejected: {reason}" · "Session close: {msg}" | error text | `:600`, `:903` |
| `director-${Date.now()}.webm` | download filename | `:302`, `:349` |
| Every `appendLog(…)` text | log text | `:206`, `:208`, `:245`, `:273`, `:298`, `:332`, `:334`, `:340`, `:342`, `:381`, `:392`, `:407`, `:446`, `:448`, `:499`, `:535`, `:539`, `:567`, `:601`, `:632`, `:698`, `:731`, `:768`, `:770`, `:806`, `:808`, `:837`, `:839`, `:855`, `:880`, `:946`, `:967`, `:978`, `:990`, `:1007`, `:1318`, `:1337` |
| The remix and sheet prompts and inputs sent to `'fal-ai/nano-banana-2/edit'` | fal input | `:790-798`, `:828-832` |

**A.2.3 DirectorSettingsForm** (`components/DirectorSettingsForm.tsx`)

| Value | Kind | Where |
|---|---|---|
| "Resolution" with the options "480p", "768p", "1080p" | label, options | `:41`, `:47-49` |
| "Aspect ratio" with the options "16:9", "9:16", "1:1" | label, options | `:53`, `:59-61` |
| "Memory" + `title` "Prior segment prompts kept as prompt-expansion context (1-50)" | label, `title` | `:65-66` |
| "Seed" + `title` "Fixes the opening setup; blank = random"; placeholder "random" | label, `title`, placeholder | `:78-79`, `:84` |
| "Character name (optional)"; placeholder "$COAST"; "Prefixed into chat directions + remix prompts." | label, placeholder, help | `:94`, `:100`, `:103` |
| "Character sheet (optional)"; placeholder "Sheet URL or upload"; "Passed as a consistency reference to every Remix frame." | label, placeholder, help | `:107`, `:112`, `:116` |
| `title` "Generate a turnaround/expressions sheet from the first frame (nano-banana-2)"; "Generating…" / "Generate from first frame" | `title`, button | `:123`, `:125` |
| "First frame (optional)" | label | `:134` |
| "Last frame of first chunk" + " (scripted)" / " (optional)"; "Target audio" + the same suffix | label | `:147`, `:164` |
| "Not available while a script is queued for this session" | `title` | `:145`, `:162` |
| "Audio bitrate" with "96 kbps", "128 kbps", "192 kbps"; "Locked at connect; reconnect to compare." | label, options, help | `:175`, `:181-183`, `:185` |

**A.2.4 Twitch broadcast** (`components/TwitchBroadcast.tsx`, `lib/twitchWhip.ts`)

| Value | Kind | Where |
|---|---|---|
| `'wzrd_twitch_auth'` (`{login, streamKey}`) · `'wzrd_twitch_oauth_state'` · `'channel:read:stream_key'` | localStorage key · sessionStorage key · OAuth scope | `TwitchBroadcast.tsx:12-14` |
| `?code&state` completed on mount, then stripped with `history.replaceState` | URL params, behaviour | `:58-65` |
| `redirect_uri: ${window.location.origin}/admin`; `https://id.twitch.tv/oauth2/authorize?`; exchange via `POST /api/twitch/connect` | OAuth contract | `:116`, `:121`, `:71` |
| "OAuth state mismatch — try Connect to Twitch again" · "Connect failed" · "Broadcast failed" | error text | `:67`, `:79`, `:86`, `:156` |
| "NEXT_PUBLIC_TWITCH_CLIENT_ID is not configured — paste a stream key instead" | error text | `:109` |
| "Twitch connected as {login}" · "Twitch broadcast stopped (session ended)" · "Twitch broadcast stopped" · "Broadcasting to Twitch (WHIP H264+Opus)" | log text | `:84`, `:102`, `:134`, `:154` |
| "Twitch broadcast" | visible text (becomes an h3, A.12) | `:169` |
| "connected as {login}" · "Disconnect" + `title` "Forget the stored Twitch connection" | text, button, `title` | `:174`, `:178-180` |
| "Connecting…" / "Connect to Twitch" | button | `:190` |
| "Stop broadcast" | button | `:198` |
| `title` "Push the live Director output to Twitch ingest" / "Start the Director session first"; "Negotiating…" / "Go live on Twitch" (disabled unless live with a stream key) | `title`, button | `:205`, `:208` |
| "● pushing to Twitch ingest — viewers see the stream on your channel" | visible text | `:214` |
| "Paste a stream key instead"; placeholder "live_… stream key" on a `type="password"` input | text, placeholder | `:220`, `:223-226` |
| `TWITCH_WHIP_URL = 'https://g.webrtc.live-video.net:4443/v2/offer'` with the H264 + Opus preference; "No video track on the live stream" · "No local SDP offer produced" · "Twitch ingest rejected the offer ({status})" | endpoint, errors (the file is never edited) | `lib/twitchWhip.ts:4`, `:29`, `:58`, `:68` |

**A.2.5 Chat steering** (`components/ChatSteerer.tsx`)

| Value | Kind | Where |
|---|---|---|
| Default prefix `'!direct'`; `'!frame'` / `'!snap'` capture a frame | behaviour | `:33`, `:81` |
| Throttle: 2000 ms global, 8000 ms per user | behaviour | `:96`, `:98` |
| "Chat steering" · "listening" / "offline" | visible text | `:137`, `:144` |
| "Anonymous read-only IRC on #{ch \|\| '…'}. While the stream is live, {command \|\| '!direct'} `<text>` messages are sent as directions with the chatter’s name, and !frame snapshots the current frame for scene continuity — steering alongside the script." (the source writes `&lt;text&gt;` and `&rsquo;`) | visible text | `:150-153` |
| "Connect" · "Disconnect" · "Chat can direct" | buttons, label | `:163`, `:171`, `:181` |
| "Command prefix" | `title` | `:188` |
| Anonymous `tmi.js` connection to `NEXT_PUBLIC_TWITCH_CHANNEL` | behaviour | `:29` |
| `${name} avatar` with `role="img"` (DitherAvatar) | aria-label, role | `components/dither-kit/avatar.tsx:193-194` |

**A.2.6 Script** (`components/ScriptEditor.tsx`, `components/ScriptTemplatePicker.tsx`)

| Value | Kind | Where |
|---|---|---|
| `console.warn('shotboard template picker unavailable:', …)` | log (the one preserved warn) | `ScriptEditor.tsx:34` |
| "Script" · "{n} beat{s}" + " · beat @{X}s playing" | visible text | `ScriptEditor.tsx:76`, `:79-80` |
| "Timed shots the model runs on its own clock — each beat’s direction starts at its offset and holds until the next one. Sent with the session, or pushed live to replace/append the queue." | visible text | `ScriptEditor.tsx:86-87` |
| "Offset in seconds" (+ the unit "s") | `title` | `ScriptEditor.tsx:112`, `:114` |
| "Direction for this shot…" | placeholder | `ScriptEditor.tsx:119` |
| "Optional assets" · "Delete shot" | aria-label | `ScriptEditor.tsx:126`, `:134` |
| "End frame at this offset" · "Audio starting at this offset" | label | `ScriptEditor.tsx:142`, `:150` |
| "Add shot" | button | `ScriptEditor.tsx:170` |
| "Cut to script" + `title` "Cut to this script at the next chunk" · "Queue script" + `title` "Queue after the running script" | button, `title` | `ScriptEditor.tsx:180-183`, `:190-193` |
| "Send with session start" | label | `ScriptEditor.tsx:205` |
| ScriptEditor props `beats`, `onChange`, `sendOnConnect`, `onSendOnConnectChange`, `onSendLive`, `live`, `playbackSeconds`, `onTemplateApplied` | props | `DirectorPlayer.tsx:1303-1320` |
| Reads `?board=` and `?transfer=` | URL params | `ScriptTemplatePicker.tsx:49-50` |
| "Prepared Director transfer" | applied template title | `ScriptTemplatePicker.tsx:64` |
| "Open shotboard editor" → `/admin/shotboard` | link | `ScriptTemplatePicker.tsx:101-103` |
| "Load template…" + `title` "Autofill the script from a saved shotboard"; option fallback "Untitled" | option, `title` | `ScriptTemplatePicker.tsx:118-123` |
| "edit" → `/admin/shotboard?board={id}` | link | `ScriptTemplatePicker.tsx:128-131` |

**A.2.7 Audio library and shared inputs** (`components/TrackManager.tsx`, `components/reactbits/MorphSlider.tsx`, `components/AssetUrlInput.tsx`)

| Value | Kind | Where |
|---|---|---|
| "Upload failed ({status})" · " — and the uploaded file could not be cleaned up" | error text | `TrackManager.tsx:63`, `:78` |
| "Audio library" | heading text (the level changes, A.12) | `TrackManager.tsx:97` |
| "Upload song" · "Loading…" · "No songs yet — upload one to use it as the stream's audio reference." | text | `TrackManager.tsx:116`, `:121`, `:124` |
| "Coast originals artwork carousel" | aria-label | `TrackManager.tsx:128` |
| "Coast originals · {n} tracks" (rendered uppercase) | visible text (authored uppercase, A.12) | `TrackManager.tsx:144-145` |
| `` `Delete ${track.name}` `` · `` `Preview ${selectedTrack.name}` `` | aria-label | `TrackManager.tsx:179`, `:190` |
| "Volume" · "Music mix volume" · "{n}%" · "Start (s)" · "Music start offset" · "Loop" | label, aria-label, text | `TrackManager.tsx:191-198` |
| "Use for session" + `title` "Use as the target audio on the next session connect" | button, `title` | `TrackManager.tsx:202-204` |
| "Queue on next direction" + `title` "Replace the stream audio on the next direction you send" (disabled unless live) | button, `title` | `TrackManager.tsx:210-212` |
| "Mix in output" + `title` "Mix the song with Director speech and effects in preview, recordings, clips, and Twitch" | button, `title` | `TrackManager.tsx:218-220` |
| `role="group"` `aria-roledescription="carousel"` "Coast audio artwork" | role, aria-label | `MorphSlider.tsx:545` |
| The fallback `<img className="morph-slider-fallback">` when WebGL fails; the caption's `aria-live="polite"` | behaviour | `MorphSlider.tsx:546`, `:548` |
| "Previous song artwork" · "Next song artwork" | aria-label | `MorphSlider.tsx:550-551` |
| "Song artwork" `role="tablist"`; tabs `` `Show ${item.caption ?? `cover ${itemIndex + 1}`}` `` | aria-label | `MorphSlider.tsx:553-554` |
| The `activeIndex` / `onIndexChange` props (the contract stays; TrackManager keeps passing `onIndexChange={selectSliderTrack}`, so explicit artwork navigation still arms that track, DEC-8-04) | props | `MorphSlider.tsx`; `TrackManager.tsx:142` |
| `` `Paste ${kind} URL` `` · "Upload" · "Clear" · the thumbnail's `alt=""` | placeholder, button, aria-label, `alt` | `AssetUrlInput.tsx:50`, `:71`, `:79`, `:87` |

**A.2.8 Live Control behaviour (media pipeline and protocol)**

| Rule | Where |
|---|---|
| Exactly one `<video ref={videoRef} autoPlay playsInline muted={muted}>` stays mounted across idle, opening, live, closing and failed. `srcObject` is assigned imperatively, and `muted` defaults to true | `DirectorPlayer.tsx:1084`, `:254`, `:888`, `:964`, `:130` |
| One stable output MediaStream (`streamRef` / `outputStreamRef`) feeds preview, the full-session recorder, the clip recorder and WHIP. `getStream={() => streamRef.current}` stays TwitchBroadcast's source | `:90`, `:99`, `:237-241`, `:1289` |
| `onUseForMix` calls `primeMusic(config)` synchronously in the click, before `setMusicConfig` | `:1332-1338` |
| DirectorPlayer's unmount flushes the clip, stops the recorder and closes the session. Nothing inside Live Control unmounts it | `:1034-1043` |
| Disconnect order: `clipClosing` → `flushClip` → `stopRecorder` → `send({ type: 'stop' })` + `close` → upload the recording → `setSessionStatus` `'ended'`. Stop and Cancel call the same `disconnect()` | `:860-905` |
| `configure` carries `protocol_version` 1 and the locked settings. `prompt` messages never carry `protocol_version`. A script in `configure` excludes `end_image_url` and `audio_url`. The live end frame and audio are one-shot and cleared after sending. `beatsToWire` filters empty beats and sorts by offset. Client-only beat ids are stripped before the wire | `lib/directorProtocol.ts:58-94`, comment at `:87-88`; `DirectorPlayer.tsx:692-694` |
| `DirectorSettings.characterSheet` is remix-only and never sent to the model | `lib/directorProtocol.ts:24-25` |
| Chat: the author is stripped of `[\]<>\n\r@` (max 32 characters) and the text of `\n\r<>` (max 300), with the prefix `[chat @{author}]`. Chat text is never rendered as HTML | `DirectorPlayer.tsx:849-858` |
| One Convex clip per applied direction version, deduplicated for the double `configured`/`prompt_applied` ack (`clipSegVersionRef`). Uploads are detached from teardown. `rotateClip` stays on the `handleData` and `onMedia` paths | `:386-527`, `:465-488`, `:557`, `:586`, `:973` |
| Recording row `model: 'director'`, `title: activePrompt`; clip `source: 'director'`; session `{ model: 'director', outputMode: 'webrtc', config: { model, prompt, resolution, aspectRatio, memory, seed, scriptBeats } }` | `:322-330`, `:489-496`, `:932-944` |
| The broadcast auto-stops when the Director session ends (the `opRef` invalidation guards against late answers); the manual stream-key fallback stays | `TwitchBroadcast.tsx:95-104`, `:217-228` |
| The failed-start error stays visible on the page (it gains `role="alert"`, A.12) | `DirectorPlayer.tsx:1291-1293` |

### A.3 Shotboard (`/admin/shotboard`)

**A.3.1 Strings** (§9.9.3 gives every row's new home)

| Value | Kind | Where (845147c) |
|---|---|---|
| "Shotboard" | heading text | `shotboard/ShotboardPage.tsx:194` |
| "Saved shotboards" (`title`) · "New / unsaved board" · "Untitled" | `title`, option | `:202`, `:204`, `:207` |
| "New board" · `createBoard('Untitled Shotboard')` | button, argument | `:218`, `:214` |
| "Board visual style" (`title` and aria-label) · "Board style…" | `title`, aria-label, option | `:226-227`, `:229` |
| "Send to Director" / "Preparing…" + `title` "Load this board's compiled script in the Director" | button, `title` | `:265-268` |
| "Delete board" | aria-label | `:276` |
| "Build scenes of shots with generated keyframes — the board compiles to the timed script the Director runs." | visible text | `:286-287` |
| "{n} beats · {s}s runtime" (the trailing "." is dropped, A.12) | visible text | `:287` |
| "{n} shot{s} need Director expansion before transfer." | visible text | `:288` |
| "Convex not configured — this board lives only in this page’s state and cannot be sent to Director." | visible text | `:292` |
| "Loading shotboard…" | status text | `:300` |
| "Add scene" | button | `:364` |
| "Create a board or pick a saved one to start laying out scenes and shots." | empty text | `:371` |
| "Give the shot a prompt or direction first" · "Prompt expansion requires an authenticated Convex connection" · "Add a scene description first" · "Director transfer is unavailable" | error text | `:93`, `:125`, `:144`, `:239` |
| "Image generation failed: " · "Prompt expansion failed: " · "Keyframe generation failed: " · "Portrait generation failed: " · "Could not prepare Director transfer: " | error prefixes | `:116`, `:135`, `:160`, `:181`, `:261` |
| "Move scene up" · "Move scene down" · "Delete scene" | aria-label | `shotboard/SceneSection.tsx:74`, `:82`, `:90` |
| "Add shot" · "First shot" · "Choose location" | button, text | `SceneSection.tsx:88`, `:117`, `:69` |
| `` `Scene ${scene.sceneNumber}` `` (placeholder) · `` `Scene ${s.sceneNumber}` `` (fallback) | placeholder, text | `SceneSection.tsx:66`; `SceneGallery.tsx:24` |
| "Move shot earlier" · "Move shot later" · "Delete shot" | aria-label | `shotboard/ShotCard.tsx:75`, `:78`, `:81` |
| "Generate image" / "Regenerate image" / "Generating…" + `title` "Re-generate / edit the keyframe with the selected model" / "Generate a keyframe image" | button, `title` | `ShotCard.tsx:106-109` |
| "Shot duration in seconds (drives the beat offset)" + the unit "s" | `title` | `ShotCard.tsx:130`, `:132` |
| "Image prompt or direction for this shot…" · `` `Image prompt for shot ${shot.shotNumber}` `` | placeholder, aria-label | `ShotCard.tsx:141`, `:143` |
| "Unknown character handle" | visible text | `ShotCard.tsx:151` |
| "Expand" / "Expanding…" + `title` "Expand this prompt with GMI" · "Undo expansion" | button, `title` | `ShotCard.tsx:159-164` |
| "Details" · "Visual prompt (image gen)" · "Detailed prompt for the keyframe image…" · "Dialogue (optional)" · "Sound effects (optional)" · "Audio at this beat" · "Audio URL or upload" · "Keyframe image URL" · "Image URL or upload" | labels, placeholders | `ShotCard.tsx:178-213` |
| SHOT_TYPE_OPTIONS labels "Wide Shot" … "Insert Shot" | option labels | `lib/shotboardTypes.ts:87-101` |
| "Untitled shotboard" · "Add a board description…" · "Select a scene to edit its details." | placeholder, text | `shotboard/SceneSidebar.tsx:57`, `:64`, `:70` |
| "Scene description" · "Location & time" · "Atmosphere & elements" · "Camera environment" | section labels | `SceneSidebar.tsx:73`, `:98`, `:104`, `:138` |
| "What happens in this scene…" · "Location" · "Time of day" · "Weather" · "e.g. neon-lit, crowded, tense and quiet" · "Specific element…" · "e.g. street level with reflections, aerial view" | placeholders | `SceneSidebar.tsx:78`, `:99-101`, `:105`, `:112`, `:143` |
| "Add" · "Remove element" (aria-label) · "Generate keyframe" | button, aria-label | `SceneSidebar.tsx:116`, `:128`, `:92` |
| "Characters" · "New" · "No characters yet — add one, generate its portrait, then tag it on shots." | text, button | `shotboard/CharacterPanel.tsx:57`, `:60`, `:66` |
| "Name" · "Appearance, outfit, style — used in prompts" · "Portrait URL or upload" | placeholders | `CharacterPanel.tsx:81`, `:100`, `:106` |
| "Delete character" | aria-label | `CharacterPanel.tsx:92` |
| "Generate portrait" / "Regenerate portrait" | button | `CharacterPanel.tsx:115` |
| "Image model used for generation" · "GPT Image 2.5 quality — higher = more detail, slower, pricier" | `title` (each gains an equal aria-label, A.12) | `shotboard/ImageModelSelect.tsx:25`, `:38` |
| "Clear" | aria-label (the shared AssetUrlInput) | `AssetUrlInput.tsx:79` |

**A.3.2 Shotboard behaviour**

| Rule | Where |
|---|---|
| `?board=<id>` preselects a board (read once; it needs the Suspense boundary) | `ShotboardPage.tsx:31-41` |
| Director hand-off: after `api.director.prepare`, `` router.push(`/admin?transfer=${transferId}`) `` | `ShotboardPage.tsx:260` |
| Convex/local split: the Convex variant mounts only when `useConvexEnabled()` is true; local mode stays fully usable without Convex or `FAL_KEY` | `ShotboardPage.tsx:23-42` |
| Transfer order: `flush()` → expand stale shots (kind `'director'`, `requestId` `director-${shot.id}-${Date.now()}`, `sourceRevision`, `shotId`), at most 2 at once (the server rejects a third with "Two prompt-expansion jobs are already running; try again shortly") → `patchShot({ directorPrompt, directorPromptRevision })` → `flush()` → `prepareDirector({ boardId, expectedRevision })` | `ShotboardPage.tsx:236-262`; `convex/promptExpansion.ts:62` |
| Image expansion: `useAction(api.promptExpansion.start)` with kind `'image'` and `requestId` `${shot.id}-${Date.now()}`; the result is written as `patchShot({ expandedPrompt, expandedPromptRevision })` | `ShotboardPage.tsx:32`, `:132-133` |
| The patch allowlists `SCENE_PATCH_KEYS`, `SHOT_PATCH_KEYS`, `CHARACTER_PATCH_KEYS` and `pickDefined`. `ShotboardState` stays backward-compatible (add methods, never rename) | `useShotboard.ts:56-67`, `:17-45` |
| `trackWrite`/`flush` semantics; hydration is skipped while writes are pending; `selectBoard` clears state before loading | `useShotboard.ts:131-160`, `:172`, `:181-195` |
| Generation prompt `` `${style ? `Style: ${style.description}. ` : ''}${shotTypeLabel(shot.shotType)}: ${prompt}` ``; references `[shot.imageUrl, scene.keyframeUrl, location.imageUrl, ...character images]` capped at 14; aspect `board.aspectRatio`, default `'16:9'`; `imageStatus` `'generating'` → `'completed'` (with `imageUrl` and `imageModel`) or `'failed'` | `ShotboardPage.tsx:21`, `:96-116`, `:107` |
| Compiler: order `(sceneNumber, order ?? shotNumber)`; duration an integer ≥ 1, default 8 (`DEFAULT_SHOT_SECONDS`); the first shot's image is the opening frame; reorder writes both `order` and `shotNumber` and keeps `sceneNumber` contiguous | `lib/shotboardCompiler.ts:5`, `:49-111` |
| Adding an @mention also adds the character to `shot.characterIds`; toggling a chip calls `toggleShotCharacter` | `ShotCard.tsx:54` (`insertMention`) |

### A.4 Characters (`/admin/characters`), Locations (`/admin/locations`) and the fixture (`/admin/visual-test`)

**A.4.1 Characters** (`components/CharacterLibraryPage.tsx`)

| Value | Kind | Where |
|---|---|---|
| "Convex is not configured. Character library changes are disabled." | visible text | `:44` |
| "Character created. Add a name, handle, identity description, and approved face references." · "Character source saved." | notice (`role="status"`) | `:87`, `:152` |
| "Name and @handle are required" · "Character was not available after saving" · "Generated image could not be read ({status})" · "Generated image could not be saved ({status})" · "Choose a character first" · "A handle and identity description are required to generate a sheet" · "This generation is already {status}" | error (`role="alert"`) | `:95`, `:101`, `:110`, `:114`, `:124`, `:127`, `:134` |
| "Add an approved face reference before generating a locked identity like @coast" | error | `:126` |
| "{n} character-sheet variation{s} saved to Convex storage." | notice | `:138` |
| Context `Character library sheet. Reference count: {n}.`; request ids `character-{id}-{now}` and `sheet-{id}-{now}-{rand}` | fal/GMI input | `:129`, `:132` |
| `{name} character card` | `alt` | `:146` |
| "Visual asset studio" · "Characters with a stable identity" · "Keep a face and overall look consistent, then swap wardrobe and scene styling without rebuilding the character." | visible text | `:149` |
| "Load SF starters" · "Starter library ready: {n} San Francisco locations{ and @coast}." · "New character" | button, notice | `:149` |
| "Loading character library…" · "Start with a reusable character" · "Create one, or load the San Francisco starter set to add @coast." | status, empty text | `:150` |
| "Character source" (keeps `uppercase`) · "Untitled character" · "Save source" / "Saving…" | heading, text, button | `:152` |
| "Name" + placeholder "Character name" · "Handle" + placeholder "coast" | label, placeholder | `:153` |
| "Identity and continuity description" + "Face, hair, body proportions, age, overall look, and traits that must remain consistent…" | label, placeholder | `:154` |
| "Appearance details" + "Materials, grooming, proportions…" · "Default wardrobe" + "Flexible scene-ready outfit baseline…" | label, placeholder | `:155` |
| "Identity invariants" + "What must not change between generations…" · "Visual style" + "Optional board or series style…" | label, placeholder | `:156` |
| "Lock the face and overall look across generations" | accessible label (checkbox → Switch, A.12) | `:157` |
| "Generate" (keeps `uppercase`) · "Character sheet" · "Astra expands the saved source; the selected Fal model then creates a reviewable sheet. No model call occurs until the source is valid." | heading, text | `:160` |
| "Generate character sheet" / "Generating character sheet…" · "Add a name, handle, description, and a face reference while identity lock is enabled." | button, hint | `:160` |
| "Sheet history" · "Use as primary reference" (`title`) · "Generated character-sheet history" (`alt`) · "Generated sheets will remain here for review." | heading, `title`, `alt`, empty text | `:160` |
| `role="status"` on notices, `role="alert"` on errors | role | `:162`, `:163` |
| The `.asset-studio` wrapper | class | `:148` |

**A.4.2 Locations** (`components/LocationLibraryPage.tsx`)

| Value | Kind | Where |
|---|---|---|
| "Convex is not configured. Location library changes are disabled." | visible text | `:43` |
| "Location created. Define its environment before generating a reusable reference sheet." · "{n} location-sheet variation{s} saved to Convex storage." | notice | `:82`, `:129` |
| "A location name is required" · "Location was not available after saving" · "Add an environment description before generating" | error | `:89`, `:95`, `:117` |
| Context `Location library sheet. Reference count: {n}.`; the `location-sheet-…` request ids | fal/GMI input | `:120`, `:123` |
| `{name} location card` | `alt` | `:137` |
| "Visual asset studio" · "Locations that hold their atmosphere" · "Reusable places carry landmark geometry, weather, light, and texture into every scene." · "Load SF starters" · "New location" | text, buttons | `:141` |
| "Loading location library…" · "Start with a reusable environment" · "Load the San Francisco starter library or create an original location." | status, empty text | `:142` |
| "Location source" (keeps `uppercase`) · "Untitled location" | heading, text | `:144` |
| "Name" + "Location name" · "Type" with "Landmark", "Neighborhood", "Coast", "Interior", "Other" (values `'landmark'`…`'other'`) | label, placeholder, options | `:145` |
| "Handle (optional)" + "ferrybuilding" · "Default light" + "Morning fog, sunset, night…" | label, placeholder | `:146` |
| "Environment description" + "Architecture, materials, spatial layout, Bay light, weather, and scene invariants…" | label, placeholder | `:147` |
| "Architecture and materials" + "Stone, glass, streetscape…" · "Weather" + "Fog, wind, rain…" · "Visual style" + "Optional production style…" | label, placeholder | `:148` |
| "Generate" (keeps `uppercase`) · "Location sheet" · "The metaprompt turns your environment notes into production-ready coverage before the selected Fal model is called." · "Generate location sheet" / "Generating location sheet…" · "Add a name and environment description to continue." · "Generated location-sheet history" (`alt`) | text, button, `alt` | `:151` |
| `role="status"` · `role="alert"` | role | `:153`, `:154` |
| The `.asset-studio` wrapper | class | `:140` |

**A.4.3 Shared studio components**

| Value | Kind | Where |
|---|---|---|
| `<section aria-label="Reference images">` + the visible "Reference images" · "Identity, wardrobe, style, or environment images stay in Convex storage." | aria-label, text | `ReferenceAssetManager.tsx:89`, `:92`, `:93` |
| "Role" with "Identity", "Wardrobe" (characters), "Style", "Environment" (locations); `defaultRole` `'identity'` / `'environment'` | label, options | `:96-100`; `CharacterLibraryPage.tsx:158`; `LocationLibraryPage.tsx:149` |
| "Saved visual reference" (`alt`) · "Primary" · "Use as primary image" (aria-label) · "Remove reference from this item" (aria-label) | `alt`, text, aria-label | `:108`, `:110-111`, `:113` |
| A hidden `<input type="file" accept="image/*">`; "Uploading…" / "Add reference"; "{n}/{MAX_ASSET_REFERENCES} · drop or choose" (renders `{n}/14`) | behaviour, text | `:118`, `:121`, `:123` |
| "This library item already has the {MAX_ASSET_REFERENCES}-image reference limit." (renders `14-image`) · "Choose an image file for a visual reference." · "Upload failed ({status})" (`role="alert"`) | error | `:49`, `:53`, `:61`, `:126` |
| Props `{targetType, targetId, references, primaryStorageId, defaultRole, onRemove, onMakePrimary, onUploaded, disabled}` | props | `ReferenceAssetManager.tsx` |
| "Image model" · "Image aspect ratio" · "Image variations" · "Output image format" · "Nano Banana resolution" · "GPT Image quality" · "Image background" | aria-label | `ImageGenerationControls.tsx:23`, `:28`, `:31`, `:34`, `:38`, `:42`, `:45` |
| "Auto background" · "Opaque" · "Transparent"; "PNG" · "JPEG" · "WebP"; "0.5K" · "1K" · "2K" · "4K" | options | `ImageGenerationControls.tsx:34-46` |
| "Advanced model controls" · "Seed" (placeholder "Random") · "Safety tolerance" · "Enable web search" · "Thinking" ("Provider default", "Minimal", "High") · "System prompt" (placeholder "Optional model-level instruction") · "Compression (JPEG/WebP only)" (placeholder "Provider default") · "Mask URL (optional)" (placeholder "https://…") | labels, placeholders | `ImageGenerationControls.tsx:51-60` |
| The `assetPlaceholder(label: string, hue = 260)` signature | export | `lib/assetPlaceholders.ts:2` |
| Identity lock: `identityLocked` defaults to true, and a locked character cannot generate without a reference | behaviour | `CharacterLibraryPage.tsx:118-144`; `convex/assets.ts:473` |
| Handle normalisation (client `.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '')`; server `/^[a-z0-9][a-z0-9_-]{1,62}$/`); @coast has handle `'coast'` and `starterKey` `'coast'`; the STARTER_LOCATIONS keys stay stable | behaviour | `convex/assets.ts:26-27`, `:437-448`, `:471` |
| Enum literals: kind `'landmark'`, `'neighborhood'`, `'coast'`, `'interior'`, `'other'`; roles `'identity'`, `'wardrobe'`, `'style'`, `'environment'`, `'sheet'` | literals | `convex/assets.ts:13`; `convex/schema.ts` |
| Generation order: persist the draft → validate → GMI expand → `promptFingerprint` → `startGeneration` → `generateImages` → upload each output to Convex → `completeGeneration`, or `failGeneration` on error | behaviour | `CharacterLibraryPage.tsx:118-144`; `LocationLibraryPage.tsx:111-135` |

**A.4.4 Visual-test fixture** (`components/AssetStudioVisualFixture.tsx`, `app/admin/visual-test/page.tsx`)

| Value | Kind | Where |
|---|---|---|
| "Development-only deterministic visual fixture. It never mounts Convex hooks." | docstring | `:30` |
| "Visual-test fixture only. No account, Convex mutation, GMI request, or Fal generation is available on this route." | banner text | `:40` |
| `.asset-studio` | class | `:39` |
| "Fixture state mirrors the generated character-sheet workspace." · "The source is expanded before the selected Fal image route is called." | text | `:41`, `:43` |
| "Location selection" (keeps `uppercase`) · "Reusable San Francisco environments" | text | `:44` |
| `id="audio-library-visual-test"` · "Audio library visual fixture" (keeps `uppercase`) · "Coast originals" · "Preview" · "Music gain · 25%" · "Mix in output" | id, text | `:45` |
| Track names "SPRING (intro)", "CHASIN $'s", "POP OUT", "KEEP GOIN'" | text | `:22-27` |
| No Convex hook, no mutation and no network request on this route | behaviour | the whole file |

### A.5 Clips (`/admin/clips`)

| Value | Kind | Where (`app/admin/clips/page.tsx`) |
|---|---|---|
| `useQuery(api.clips.list, { limit: 100 })` | Convex | `:11` |
| `enabled ? <ClipsList /> : <ConvexNotConfigured feature="clips" />` | behaviour | `:86-87` |
| "Clips" | heading text (becomes the h1) | `:19` |
| `` `${clips.length} clips` `` | visible text (the pattern is extended, A.12) | `:21` |
| "No clips yet" | empty title | `:29` |
| "No media stored for this segment" | text | `:48` |
| `{clip.source}`; `` `segment v${clip.promptVersion}` `` when defined, else `` `chunk #${clip.chunkIndex}` `` | visible text | `:55` |
| `clip.prompt`; `durationSeconds`; `` `${clip.sessionId.slice(0, 8)}…` `` with `title={clip.sessionId}` | visible text, `title` | `:63`, `:66`, `:68-70` |
| Newest first; index 0 carries `pixel-card-latest` | behaviour, class | `:34-39` |

### A.6 Recordings (`/admin/recordings`)

| Value | Kind | Where (`app/admin/recordings/page.tsx`) |
|---|---|---|
| `useQuery(api.recordings.list, { limit: 100 })`; `useMutation(api.recordings.remove)` called as `remove({ recordingId })` | Convex | `:25-26`, `:115` |
| `enabled ? <RecordingsList /> : <ConvexNotConfigured feature="recordings" />` | behaviour | `:135-136` |
| "Recordings" | heading text (becomes the h1) | `:34` |
| `` `${recordings.length} recordings` `` | visible text (the pattern is extended, A.12) | `:37` |
| "No recordings yet" · "Use “Record” on the Director player, then “Stop & save recording”" (the source writes `&amp;`) | empty title, body | `:46`, `:47` |
| "Media unavailable" | text | `:64` |
| The `recording.title ?? …` title fallback (the fallback text changes, A.12) | behaviour | `:72` |
| "Duration" (`formatDuration`: `1h 2m 3s` / `2m 3s` / `3s`) · "Size" (`formatBytes` with GB, `toFixed(2)`) · "Session" (`` `${sessionId.slice(0, 8)}…` `` or "—", with the full id in `title`) | labels, formats | `:81-82`, `:85-86`, `:95-97`; formats at `:10-22` |
| "Download" · "Delete" | button text | `:110`, `:120` |
| "Delete this recording permanently?" (every delete stays confirmed and permanent) | confirmation text | `:115` |
| Newest first; index 0 carries `pixel-card-latest` | behaviour, class | `:51-56` |

### A.7 Twitch Analytics (`/admin/analytics`)

| Value | Kind | Where (`app/admin/analytics/page.tsx`, `components/ViewerChart.tsx`) |
|---|---|---|
| `POLL_MS = 30_000`; `HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000` | constants | `page.tsx:11-12` |
| `fetch('/api/twitch', { cache: 'no-store' })`; the server's `body.error` is shown verbatim | behaviour | `page.tsx:96-98`, `:165` |
| The `.slice(-240)` local cap; persisted history is used only when it has more than 1 sample | behaviour | `page.tsx:103`, `:118` |
| `ConvexHistory` is mounted only when `convexEnabled`; `useMutation(api.twitchStats.record)` with `{channel, viewerCount, followerCount?, isLive, title?, gameName?}` and `?? undefined`; `useQuery(api.twitchStats.history, latest ? { channel, sinceMs: latest.capturedAt - HISTORY_WINDOW_MS } : 'skip')`; `lastRecordedRef` | Convex, behaviour | `page.tsx:51-84`, `:122` |
| `console.error('Failed to record twitch sample', e)` | log (preserved) | `page.tsx:76` |
| `data?.user?.displayName ?? data?.channel ?? 'Twitch'` | visible text | `page.tsx:137` |
| `` `twitch.tv/${data.channel}` `` / "Loading…" / "Not configured" | visible text | `page.tsx:140` |
| "LIVE" / "OFFLINE" | lamp text | `page.tsx:151` |
| "Refresh" | button | `page.tsx:158` |
| "Current viewers" · "Followers" · "Uptime" · "Category"; "—" when missing | labels | `page.tsx:175-194` |
| `` `${data.thumbnailUrl}?t=${data.capturedAt}` `` · "Stream preview" (`alt`) · "Stream title" · "Started {…}" | cache-buster, `alt`, text | `page.tsx:206-215` |
| "Viewers (last 24h, Convex)" / "Viewers (this session)" | chart title switch | `page.tsx:224` |
| `export interface ViewerSample { capturedAt; viewerCount; isLive }`; the default export with `title = 'Viewers Over Time'` | type, prop default | `ViewerChart.tsx:11-15`, `:22` |
| `` `Last ${span}` `` / `` `${samples.length} samples` `` · the config label "Viewers" · "Collecting samples…" | text | `ViewerChart.tsx:48`, `:57`, `:69` |
| `import type { TwitchAnalytics } from '../../api/twitch/route'` (the response shape is unchanged) | type import | `page.tsx:9` |
| Server errors "TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured" · "TWITCH_CHANNEL is not configured" · `Twitch channel "{channel}" not found` | server text (the route is untouched) | `app/api/twitch/route.ts:80`, `:85`, `:97` |

### A.8 Storage keys, URL parameters, events and environment names

| Value | Kind | Status | Where |
|---|---|---|---|
| `theme` | localStorage | preserved | A.1.3 |
| `wzrd_twitch_auth` · `wzrd_twitch_oauth_state` | localStorage · sessionStorage | preserved | `TwitchBroadcast.tsx:12-13` |
| `?board=<shotboardId>` on `/admin` and `/admin/shotboard` | URL | preserved (Shotboard also writes it back, A.12) | `ScriptTemplatePicker.tsx:49`; `ShotboardPage.tsx:36`, `:41` |
| `?transfer=<directorTransferId>` on `/admin` | URL | preserved | `ScriptTemplatePicker.tsx:50`; `ShotboardPage.tsx:260` |
| `?code&state` on `/admin` | URL | preserved | `TwitchBroadcast.tsx:58-65` |
| `NEXT_PUBLIC_CONVEX_URL` · `NEXT_PUBLIC_TWITCH_CHANNEL` · `NEXT_PUBLIC_TWITCH_CLIENT_ID` | env names read by the client | preserved | `ConvexClientProvider.tsx:37`; `ChatSteerer.tsx:29`; `TwitchBroadcast.tsx:54` |
| `wzrd:boot` | sessionStorage | new (§6.2) | — |
| `wzrd:density` · `wzrd:dock` · `wzrd:shotboard` | localStorage | new (§7.14, §8, §9) | — |
| `wzrd:dither-ready` · `wzrd:twitch-auth` | window events | new (§6.2.11, §7.10) | — |
| `?noboot` · `?boot=1` · `?boot=flip` · `?boot=auto` · `?throw=render` (dev only, `/admin/visual-test`) | URL (test hooks) | new (§6.2.15, §11.D.10) | — |
| `data-theme-pref`, `data-broadcast`, `data-rec`, `data-lock`, `data-density`, `data-platform`, `data-boot`, `data-dock`, `data-offline` on `<html>` | attributes | new; one writer each (§7.6) | — |

New keys never reuse a preserved name, and new test ids (`data-testid`) become stable once merged (data.md DI-17).

### A.9 Convex functions and arguments

Every name and argument shape below stays unchanged; the backend is never edited (§16.6 N11). Verified with `grep -rnoE "api\.[a-zA-Z]+\.[a-zA-Z]+" app components hooks lib`.

| Function | Caller(s) at 845147c | Arguments as called |
|---|---|---|
| `api.sessions.create` · `api.sessions.setStatus` | `components/useDirectorPersistence.ts:51-52` | `{ model: 'director', outputMode: 'webrtc', config: { model, prompt, resolution, aspectRatio, memory, seed, scriptBeats } }` (`DirectorPlayer.tsx:932-944`); `{ sessionId, status, error? }` |
| `api.promptEvents.log` | `useDirectorPersistence.ts:53` | unchanged |
| `api.clips.create` · `api.clips.attachMedia` | `useDirectorPersistence.ts:54-55` | `{ sessionId, prompt, promptVersion, chunkIndex, durationSeconds: 0, source: 'director' }` (`DirectorPlayer.tsx:489-496`) |
| `api.recordings.generateUploadUrl` · `api.recordings.deleteStorage` · `api.recordings.create` | `useDirectorPersistence.ts:56-58`; `deleteStorage` also at `TrackManager.tsx:42` | `{ sessionId, storageId, mimeType, sizeBytes, durationSeconds, model: 'director', title }` (`DirectorPlayer.tsx:322-330`) |
| `api.clips.list` | `app/admin/clips/page.tsx:11` | `{ limit: 100 }` |
| `api.recordings.list` · `api.recordings.remove` | `app/admin/recordings/page.tsx:25-26` | `{ limit: 100 }`; `{ recordingId }` |
| `api.tracks.list` · `.generateUploadUrl` · `.add` · `.remove` | `components/TrackManager.tsx:38-41` | unchanged |
| `api.shotboards.list` · `.load` | `ScriptTemplatePicker.tsx:37`, `:43`; `shotboard/useShotboard.ts:88-89`, `:410-412` | unchanged |
| `api.shotboards.create` · `.patch` · `.remove` · `.createScene` · `.patchScene` · `.removeScene` · `.createShot` · `.patchShot` · `.removeShot` · `.setShotOrder` · `.createCharacter` · `.patchCharacter` · `.removeCharacter` | `shotboard/useShotboard.ts:73-85`, `:417-429` | allowlisted keys only (A.3.2) |
| `api.director.get` · `api.director.prepare` | `ScriptTemplatePicker.tsx:39`; `ShotboardPage.tsx:33` | `prepare({ boardId, expectedRevision })` |
| `api.promptExpansion.start` (an alias of `expand`) · `api.promptExpansion.expand` | `ShotboardPage.tsx:32`; `CharacterLibraryPage.tsx:59`; `LocationLibraryPage.tsx:58` | `{ kind, source, context, requestId, sourceRevision?, shotId? }` |
| `api.locations.list` · `api.styles.list` (archived rows filtered client-side) | `ShotboardPage.tsx:34-35` | unchanged |
| `api.assets.listCharacters` · `.getCharacter` · `.createCharacter` · `.patchCharacter` · `.removeReference` · `.seedStarterLibrary` · `.startGeneration` · `.completeGeneration` · `.failGeneration` · `.generateUploadUrl` · `.listAssetHistory` | `CharacterLibraryPage.tsx:50-59`, `:71`, `:100` | `createCharacter({ name, handle, identityLocked })`; `patchCharacter({ characterId, name, handle, description, appearance, identityNotes, defaultWardrobe, voiceNotes, visualStyle, identityLocked, referenceStorageIds, primaryStorageId })` (assets.md A4; the Save call omits the optional `referenceStorageIds`, A.12) |
| `api.assets.listLocations` · `.createLocation` · `.patchLocation` (plus the shared ones above) | `LocationLibraryPage.tsx:49-58`, `:69`, `:93` | `createLocation({ name, kind })`; `patchLocation({ locationId, name, handle, kind, description, architecture, defaultTimeOfDay, defaultWeather, visualStyle, referenceStorageIds, primaryStorageId })` |
| `api.assets.recordUpload` · `.getStorageUrl` · `.generateUploadUrl` | `ReferenceAssetManager.tsx:40-41`, `:73` | `recordUpload({ targetType, characterId \| locationId, storageId, role, makePrimary })` |
| `api.twitchStats.record` · `api.twitchStats.history` | `app/admin/analytics/page.tsx:58`, `:61` | A.7 |
| `api.sessions.list` | none at 845147c (a new read added by §11.A; the query exists at `convex/sessions.ts:44`) | unchanged |

### A.10 fal endpoints, model ids and access rules

| Value | Kind | Where |
|---|---|---|
| `FAL_SDK_PROXY_URL = '/api/fal/sdk-proxy'`; browser clients are only ever `createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })` | access rule | `lib/directorProtocol.ts:4`; `lib/imageGen.ts:35`; `AssetUrlInput.tsx:33`; `DirectorPlayer.tsx:763`, `:789`, `:826`, `:958` |
| `minimax/h3-max/director`, opened with `fal.realtime.open(wma(DIRECTOR_MODEL), …)` | endpoint | `DirectorPlayer.tsx:27`, `:959` |
| `fal-ai/nano-banana-2/edit` (Director remix and sheet) | endpoint | `DirectorPlayer.tsx:795`, `:828` |
| `fal-ai/nano-banana-2` · `fal-ai/nano-banana-2/edit` | endpoints | `lib/imageModels.ts:50-51` |
| `openai/gpt-image-2.5/flare/text-to-image` · `openai/gpt-image-2.5/flare/edit` | endpoints | `lib/imageModels.ts:58-59` |
| `openai/gpt-image-2.5/sunburst/text-to-image` · `openai/gpt-image-2.5/sunburst/edit` | endpoints | `lib/imageModels.ts:68-69` |
| Model ids `'nano-banana'` (also `DEFAULT_IMAGE_MODEL`), `'gpt-flare'` and `'gpt-sunburst'`, persisted in Convex; labels "Nano Banana 2", "GPT Image 2.5 Flare", "GPT Image 2.5 Sunburst" | ids, labels | `lib/imageModels.ts:46-47`, `:54-55`, `:64-65`, `:75` |
| `MAX_ASSET_REFERENCES = 14` | constant | `lib/imageModels.ts:41` |
| `fal.subscribe(endpoint, { input })`: adding `logs: true` and `onQueueUpdate` is allowed; `endpoint` and `buildImageInput(…)` do not change | rule | `lib/imageGen.ts:26-36` |
| No paid call on mount or in CI; `FAL_KEY` is never in client code or a `NEXT_PUBLIC_*` variable | rule | §16.3, §16.5 |
| New, in `scripts/brand` only (not preserved; §13.2): `openai/gpt-image-2.5/sunburst/edit`, `openai/gpt-image-2/edit`, `openai/gpt-image-2.5/sunburst/text-to-image`, `openai/gpt-image-2`, `minimax/h3-max/image-to-video`, `minimax/h3/image-to-video`, `minimax/h3/reference-to-video` | endpoints | `dashboard/scripts/brand/endpoints.mts` |

### A.11 CSS hooks, ids, classes and roles

| Value | Kind | Where | Rule |
|---|---|---|---|
| `#audio-library-visual-test` | id | `AssetStudioVisualFixture.tsx:45` | Kept |
| `.asset-studio` | class | `CharacterLibraryPage.tsx:148`, `LocationLibraryPage.tsx:140`, `AssetStudioVisualFixture.tsx:39` | Kept on the studio roots and the fixture |
| `.pixel-card`, `.pixel-card-latest` | class | `reactbits/PixelCard.jsx:235`; `app/admin/clips/page.tsx:39`; `recordings/page.tsx:56`; `app/globals.css:230-244` | `.pixel-card-latest` moves to MediaCard and the recording row, with the NEW lamp |
| `--pixel-card-border`, `--pixel-card-background`, `--pixel-card-active-color` | CSS variables | `app/globals.css:231-236`; `reactbits/PixelCard.css:28` (`--pixel-card-active-color` exists there only as a fallback) | Stay defined (Appendix B.6 R-20) |
| `.fal-card`, `.fal-card-header`, `.fal-card-title`, `.fal-card-content`, `.fal-button-primary`, `.fal-button-secondary` | class | `app/globals.css:141-155`, `:198-210` (live uses 17/8/5/17/2/31, per shell.md) | Shims until their last call site migrates, then deleted (A.12) |
| `.connection-indicator`, `.connection-connected`, `.connection-disconnected` | class | `app/globals.css:213-224`; the only call site is `analytics/page.tsx:146-147` | Deleted with that call site (A.12) |
| `.fade-in` | class | `app/globals.css:167`; the only call site is `app/layout.tsx:64` | Deleted with the shell (A.12) |
| `.accordion-gallery`, `.ag-panel`, `.ag-panel--active`, `role="list"` "Image accordion gallery", roving tabindex and arrow keys | class, role, aria-label | `reactbits/AccordionGallery.jsx:195`, `:204-205`, `:214` | The file is untouched, and the fixture specimen keeps them |
| ChromaGrid `onSelect(item)` | prop | `reactbits/ChromaGrid.jsx:14`, `:64-65` | The file is untouched |
| `.morph-slider-canvas`, `.morph-slider-fallback` | class | `reactbits/MorphSlider.tsx:218`, `:546` | Kept |
| `role="status"` / `role="alert"` on existing notices and errors | role | A.4.1, A.4.2, A.4.3 | Kept, including inside chyrons |

### A.12 Allowed changes (D6, exhaustive)

These are the only changes allowed to Appendix A items, and each one names the section that authorises it. Any change not listed here is a §1.8 item 1 stop-and-ask. Moves that do not change text (a string relocated to a new component, breakpoint or sr-only span) are not listed; the page ledgers track them.

**Every surface**

| # | Old → new | Authorised by |
|---|---|---|
| P1 | Any preserved button may show a transient `pendingLabel`/`successLabel` while its action runs, and returns to its preserved label afterwards; its resting accessible name is unchanged | §7.3 |

**Shell and global**

| # | Old → new | Authorised by |
|---|---|---|
| G1 | The footer "Powered by FAL realtime" (`app/layout.tsx:75`) → removed, along with the footer | D6, §7.6 |
| G2 | `metadata.description` "Control panel for the realtime AI livestream: LTX + Director models, clips, recordings, Twitch analytics" (`app/layout.tsx:23`) → "Operator console for the WZRD.tech realtime AI livestream: MiniMax H3 Max Director, Shotboard, character and location assets, clips, recordings and Twitch analytics." | D6, §7.7 |
| G3 | `title: 'stream.wzrd.tech admin'` → `title: { default: 'stream.wzrd.tech admin', template: '%s · stream.wzrd.tech admin' }`. Each route's `document.title` becomes "{Route} · stream.wzrd.tech admin" ("Live Control", "Shotboard", "Characters", "Locations", "Clips", "Recordings", "Twitch Analytics", "Visual test", "Not found"). While ON AIR it is "● ON AIR · stream.wzrd.tech admin" | §7.7, §6.7, §11.D.6 |
| G4 | The h1 "Stream Admin" (`app/layout.tsx:51-53`) → the same text in a non-heading brand block. Each route supplies its own single h1 (Live Control's is the sr-only "Live Control") | §7.8, §8.2 |
| G5 | The header `<img src="/wzrdtechlogo.png">` → a `Wordmark` `<picture>` from `/brand/wordmark/*` with the same `alt`, "WZRD.TECH" | §7.5, §13.6.11 |
| G6 | AdminNav moves into the CommandBar (`git mv` to `components/shell/AppNav.tsx`). The active link gains `aria-current="page"`. At 1024–1439 px, inactive links are icon-only, with their exact label as sr-only text (accessible names unchanged) | §7.8, §7.9 |
| G7 | ThemeToggle (one button with a `title`) → ThemeSwitch: a `role="radiogroup"` "Theme" with the radios "System", "Light" and "Dark" (the Light and Dark segments keep the existing titles). Below 768 px it is one IconButton, "Theme: System" / "Theme: Light" / "Theme: Dark". Choosing System removes `localStorage['theme']` | §7.13 |
| G8 | `themeInit` gains appended blocks (`wzrd:density`, `data-platform`, `data-theme-pref`, `data-dock`); the theme lines stay byte-identical | §7.6 |
| G9 | Through the `--dither-*` tokens, the carrier speed becomes 0.055 while connecting and 0.02 on air, and the veil alpha becomes .72 (light) / .62 (dark) on air; the rest values are unchanged | §5.5, §6.7 |
| G10 | Deleted: `.fade-in` (`layout.tsx:64`, `globals.css:167`); `.connection-*` (`globals.css:213-227`, with `analytics/page.tsx:146-147` migrating to TallyLight in 11C); and the `.fal-*` shims (each with its last call site, and the aliases in M9) | §5.18, §7.6, §11.C.2 |
| G11 | `ConvexNotConfigured` renders `<NotConfigured feature size="route">` with the title "Convex is not configured" and the body "Set `NEXT_PUBLIC_CONVEX_URL` to enable {feature}. Run `npx convex dev` in `dashboard/` to create a deployment." (the body's rendered `textContent` is unchanged) | §7.5, §11.D.7 |
| G12 | `TwitchBroadcast` dispatches the `window` event `wzrd:twitch-auth` after it writes or removes `wzrd_twitch_auth` (the storage format is unchanged) | §7.10 |
| G13 | `public/favicon.ico` is replaced in place by the derived Coast or placeholder icon. `app/icon.svg`, `app/apple-icon.png`, `app/manifest.ts`, `app/opengraph-image.png` and `app/twitter-image.png` are added | §13.6.9, §13.6.10 |

**Live Control (§8.9.6)**

| # | Old → new | Authorised by |
|---|---|---|
| L1 | "Live · {n}s" (`DirectorPlayer.tsx:1148-1149`) → "Live · HH:MM:SS" (`'Live · ' + tc(elapsed)`) | D6, §4.4 O15, §8.9.6 #1 |
| L2 | The raw state text `idle`/`opening`/`live`/`closing`/`failed`/`closed` (`:1069`) → the words "Standby", "Tuning", "Preview", "Stopping", "Failed", "Off air". The raw value stays in `data-state` on `[data-testid="lc-state-word"]` | §8.9.6 #2 |
| L3 | Heading levels only: "Director (realtime WebRTC)" h3 → h2 (plus `aria-label="Director"` on its section); "Audio library" h2 → h3; "Twitch broadcast" `<span>` → h3 | §8.9.6 #3 |
| L4 | The coloured "●" before queue rows (`:1181`) → an `<Led>` (the status word stays visible). The "●" in "● pushing to Twitch ingest…" stays | §8.9.6 #4 |
| L5 | "Coast originals · {n} tracks", rendered through `uppercase` → the authored "COAST ORIGINALS · {n} TRACKS" with the class removed (the rendered case is identical); `backdrop-blur` removed | §8.9.6 #5, §5.20.5 |
| L6 | The failed-start error region gains `role="alert"` and a 'Dismiss error' control (DEC-8-05) | §8.9.6 #7, live.md L3 |
| L7 | The behaviour decisions DEC-8-01 … DEC-8-14: the composer lifecycle; Stop click-guarded; Go live needs the first frame; MorphSlider autoplay off, explicit navigation still arms; a dismissible error; the pushing line only on air; Leave and stop runs `disconnect()`; `closed` shows the standby slate without 'Cancel'; a 500-entry log with debug hidden; radio track rows; client beat ids stripped before the wire; the template picker skeleton; `!frame`/`!snap` throttled 10 s global, 8 s per user (DEC-8-13); while on air, 'Stop' first confirms with 'Stop the Director?', and it ignores activations for 600 ms after mounting (DEC-8-14) | §8.9.6 #7 |
| L8 | TrackManager stops passing `autoplay` and `autoplayDelay={6}` to MorphSlider (`TrackManager.tsx:138-139`), and the fixture stops passing `autoplay autoplayDelay={6}` (`AssetStudioVisualFixture.tsx:45`) | D3, §12.4 |
| L9 | 'Stop broadcast' remains the transport control; the stalled chyron's new action is "End broadcast" | §6.7 (see B.6 R-7) |

**Shotboard (§9.9.4)**

| # | Old → new | Authorised by |
|---|---|---|
| S1 | The "Shot {n}" card label (`ShotCard.tsx:71-72`, CSS `uppercase`) → M2 authors "SHOT {n}". §9 then removes ShotCard: frames show the authored slate tag `SC02 · SH03 · 8s`, and the inspector title renders "Shot {n}" with no `text-transform` | §5.20.5 #9, §9.9.4 #1 |
| S2 | "Choose from character gallery" (`ShotCard.tsx:169`) → removed with the per-card AccordionGallery (cast chips replace it) | §9.9.4 #2 |
| S3 | "Scene keyframe (drives the gallery strip)" (`SceneSidebar.tsx:82`) → "Scene keyframe (drives the scene rail thumbnail)" | §9.9.4 #3 |
| S4 | The placeholder "$HANDLE" → "handle", and the `title` "Prompt anchor (e.g. $COAST)" → "Prompt anchor (e.g. @coast)" (`CharacterPanel.tsx:88-89`); handles are normalised to `[a-z0-9_-]` | §9.9.4 #4 |
| S5 | "{n} beats · {s}s runtime." → "{n} beats · {s}s runtime" (the trailing "." is dropped, `:287`) | §9.9.4 #5 |
| S6 | The amber status line (`:290`) → each message moves verbatim to an inline `role="alert"` (plus a chyron when off-screen). Errors become danger; advisories stay warning | §9.9.4 #6 |
| S7 | The Director-expansion sentence (`:288`) moves unchanged to the TransferSheet preflight | §9.9.4 #7 |
| S8 | Library characters (`boardId` undefined) become read-only on this route: no rename, no portrait generation, no 'Delete character' | §9.9.4 #8 |
| S9 | Undoing a deleted scene or shot re-creates the rows through `createScene`/`createShot` (new Convex ids; every field restored) | §9.9.4 #9 |
| S10 | 'Expand' is `aria-disabled` in local mode, with the preserved reason sentence | §9.9.4 #10 |
| S11 | Generation ignores `shot.imageModel` when choosing the model (the value is still written on success) | §9.9.4 #11 |
| S12 | 'New board' starts title editing; 'Board style…' is disabled while a style is set | §9.9.4 #12 |
| S13 | `?board=` is written back with `router.replace(…, { scroll: false })` in Convex mode (the read-once semantics are unchanged) | §9.9.4 #13 |
| S14 | `<Suspense>` gains a `fallback` (the Shotboard skeleton) | §9.2 |
| S15 | The `ImageModelSelect` selects gain an `aria-label` equal to each existing `title` | §9.2 |

**Characters, Locations, fixture (§10.9.6)**

| # | Old → new | Authorised by |
|---|---|---|
| C1 | The Location Type option label "Coast" → "Coastline" (the value `'coast'` is unchanged); kind filters and badges read "Coastline" / `COASTLINE` | §10.9.6 #1 |
| C2 | `assetPlaceholder()` drops the in-image text "visual fixture · add approved reference" and the Arial/violet art, with the same signature | §10.9.6 #2 |
| C3 | Notices and errors move from the bottom `<p>`s to chyrons and the inline Darkroom alert (text and roles unchanged) | §10.9.6 #3 |
| C4 | The identity checkbox becomes a Switch with the same label | §10.9.6 #4 |
| C5 | Sheet history lists only `role: 'sheet'` rows, and a click opens the viewer; promotion uses 'Use as primary reference' | §10.9.6 #5 |
| C6 | Save payloads omit `referenceStorageIds` (a data-loss fix) | §10.9.6 #6 |
| C7 | @coast is pinned first, the wall is ordered by `_creationTime` descending, and the first item is auto-selected | §10.9.6 #7 |
| C8 | 'New character' / 'New location' render as secondary buttons, and 'Load SF starters' as ghost | §10.9.6 #8 |
| C9 | The header band (eyebrow, h1, description) also renders in the not-configured and auth states (additive) | §10.9.6 #9 |
| C10 | Fixture: the nested `<main>` → `<div>`; the `sleek-opossum-939.convex.cloud` artwork URLs (`AssetStudioVisualFixture.tsx:23-26`) → local `/brand/slate/*.webp`; autoplay off; inert copies become the real components; violet removed | §10.9.6 #10 |

**Clips (§11.A.9)**

| # | Old → new | Authorised by |
|---|---|---|
| K1 | "Start an LTX stream or a Director session to populate clips" (`clips/page.tsx:30`) → "Use “Start Director” on Live Control, then send directions. Each applied direction is saved here as a clip." | D6, §11.A.9 |
| K2 | "Clips" h3 → h1 via PageHeader (same text) | §11.A.9 |
| K3 | `` `${clips.length} clips` `` → the same pattern, with "1 clip" when n = 1 and " · latest 100" appended at 100 | §11.A.9 |
| K4 | The header "Loading…" (`:21`) → removed; a skeleton plus the sr-only "Loading clips" | §11.A.9 |
| K5 | `{clip.source} · segment v{n}` / `chunk #{n}` → the label in the card `h3`, and the source in `code` in the action row | §11.A.9 |
| K6 | `new Date(createdAt).toLocaleString()` → the visible `stamp()` (`Sep 24, 21:04`), with the full value in `<time title>` and in the viewer | §11.A.9 |
| K7 | Prompt `line-clamp-3` → `line-clamp-2` (the full text is in the viewer); `{durationSeconds.toFixed(1)}s` → the HUD plate `MM:SS`, hidden at 0 | §11.A.9 |
| K8 | The session short id moves to the group header `code`, with the same `title` | §11.A.9 |

**Recordings (§11.B.9)**

| # | Old → new | Authorised by |
|---|---|---|
| V1 | "Recordings" h3 → h1 | §11.B.9 |
| V2 | `` `${n} recordings` `` / "Loading…" → the meta "{n} recordings · {bytes}" ("1 recording" at n = 1, " · latest 100" at 100); "Loading…" removed (a skeleton plus the sr-only "Loading recordings") | §11.B.9 |
| V3 | The title fallback `` `${recording.model} recording` `` → "{Model} session · {stamp}" (for example "Director session · Sep 24, 21:04") | §11.B.9 |
| V4 | `toLocaleString()` → the visible `stamp()`, with the full value in `title` | §11.B.9 |
| V5 | The plate "Type" + the raw MIME → "Format" + `formatMime()`; the raw MIME stays in `title` | §11.B.9 |
| V6 | The download filename `recording-${id}.webm` → `recording-${id}.${extFromMime(mimeType)}`, fetched as a Blob | §11.B.9 |
| V7 | `confirm('Delete this recording permanently?')` → a ConfirmDialog with that exact title; `remove({ recordingId })` is awaited | §11.B.9 |

**Twitch Analytics (§11.C.9)**

| # | Old → new | Authorised by |
|---|---|---|
| T1 | `twitch.tv/{channel}` / "Loading…" / "Not configured": "Loading…" becomes a skeleton plus the sr-only "Loading…"; "Not configured" shows on 503; "Unavailable" shows for other errors when there is no data | §11.C.9 |
| T2 | "LIVE" / "OFFLINE" stay, and the new lamp words "NOT PATCHED", "ERROR" and "STALE" are added. In the not-configured (503) state, the OFFLINE lamp word and the "Collecting samples…" chart text are not rendered; they still render in the configured offline and empty states | §11.C.9 |
| T3 | "Refresh" gains the pending label "Refreshing…" and the success label "Updated" | §11.C.9 |
| T4 | `String(data.viewerCount)` → `toLocaleString('en-US')` (`1284` → `1,284`) | §11.C.9 |
| T4b | `data.followerCount.toLocaleString()` (`analytics/page.tsx:182`) → `toLocaleString('en-US')` | §11.C.9 |
| T5 | `Started ${…toLocaleString()}` → "Started {stamp}", with the full value in `title` | §11.C.9 |
| T6 | The `.connection-*` pill → `TallyLight` (G10) | §11.C.2 |

**New strings.** Each new string a chapter introduces (kickers, lamp words, slates, dialogs, chyrons, announcements, fixture labels) belongs to that chapter's "New strings" list (§8.9.6, §9.9, §10.9.6, §11.A.9, §11.B.9, §11.C.9, §11.D, §6.2, §7). It is not preserved until it merges.

> Note: **conflicts resolved conservatively.**
> 1. An earlier §5.20.5 draft wrote 'Generate' as `GENERATE` (removing the class) at `CharacterLibraryPage.tsx:160`, at `LocationLibraryPage.tsx:151` and in the fixture, while §10 keeps the `uppercase` class on all three. The three 'Generate' eyebrows keep `uppercase` (D6: no chapter lists a change), and the uppercase allowlist total is ≤ 9 (§5.20.5, B.6 R-2). L5 and S1 are allowed because §8.9.6 and §9.9.4 list them and their surfaces are rebuilt; no chapter lists 'Generate', so it keeps its text and its class.
> 2. §5.20.4 lets `bytes()` switch 'REC {formatBytes}' to GB above 1 GiB, and §7.2 forbids any change to that readout. `bytes(n)` without the option therefore keeps the `DirectorPlayer.tsx:76-79` output byte-for-byte at every size, and only Recordings calls `bytes(n, { gb: true })`. §5.21's `format.mjs` row for 1.25 GiB calls `bytes(1.25*1073741824, { gb: true })` → `1.25 GB`, and `bytes(1610612736)` → `1536.0 MB` (§7.18).
> 3. data.md DI-11 permits changing 'Delete this recording permanently?', but no chapter lists a change, so it stays (V7).
> 4. An earlier design draft's Locations eyebrow `SETS` would drop the preserved 'Visual asset studio' (`LocationLibraryPage.tsx:141`), so it is not applied (§10.9.6 Note).
> 5. live.md L20 allows renames when SKILL.md changes in the same PR. D6 is stricter and allows none beyond this list.

### A.13 Items dropped or corrected during verification

| Audit or chapter claim | Finding at 845147c | Resolution |
|---|---|---|
| live.md L19 / states.md S5: aria-label `Preview ${track.name}` | The code is `` `Preview ${selectedTrack.name}` `` (`TrackManager.tsx:190`) | Preserved as written in the code |
| §8.9.4: the raw state is "now in `data-state`" | No `data-state` exists at 845147c; L2 adds it | Listed as a new attribute, not a preserved one |
| shell.md H6 / assets.md A16: `--pixel-card-active-color` is in `globals.css` | It is defined only as a fallback in `components/reactbits/PixelCard.css:28`; `globals.css:231-236` sets the other two variables | Kept as a PixelCard hook (A.11) |
| assets.md A11: the ImageGenerationControls props are "shared with the Shotboard" | Only `CharacterLibraryPage.tsx`, `LocationLibraryPage.tsx` and `AssetStudioVisualFixture.tsx` import it; Shotboard uses `ImageModelSelect.tsx` | The props stay unchanged anyway (§10.2 Note) |
| assets.md A14: AccordionGallery is shared with Shotboard | True at 845147c (`ShotCard.tsx:6`, `SceneSection.tsx:5`, `SceneGallery.tsx:5`), but §9 deletes those files | The vendored file stays untouched; afterwards only the fixture uses it |
| fal.md F7 (quoted in §10.9.2): `TWITCH_CHANNEL '510coast'` at `wrangler.toml:137` | It is at `wrangler.toml:22` (the file has 51 lines) | Cite `wrangler.toml:22` |
| states.md S1 / shell.md H4: "the Director card is the only Live Control content" | Script, Chat steering and (with Convex) Audio library also render (`DirectorPlayer.tsx:1303-1339`) | SKILL.md is corrected in the first PR (§1.9); §8.9.5 gives the replacement text |
| Some sources list ChatSteerer's 'Command prefix' among the aria-labels | It is a `title` (`ChatSteerer.tsx:188`); §8 adds an equal `aria-label` | Preserved as the `title` |

### A.14 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] `node scripts/checks/appendix-a.mjs` (§15.1, run per §15.2 in every PR from M1) exits 0 on the PR's head. It reads this file (`docs/redesign/spec/appendix-a-preserved-contract.md`) and checks every double-quoted A.1–A.11 value, or its A.12 replacement. Its extraction rules and search scope are §15.2's (gate C7). The M9 `sweep` PR pastes the full report, with zero misses.
- [ ] Every A.12 change is present on the M9 build, and `git diff 845147c...HEAD` makes no other change to an A.1–A.11 value. Review this with `node scripts/checks/appendix-a.mjs --diff 845147c`, which prints every A-listed literal present at 845147c and absent at HEAD.
- [ ] `getByRole` counts on the M9 build:
  - exactly one button named 'Start Director' (idle);
  - zero buttons named 'Record' (idle and failed);
  - at most one button each named 'Go live on Twitch', 'Stop broadcast' and 'Cancel' in every Live Control fixture state;
  - one `navigation` named 'Admin sections' on every route.
- [ ] `grep -rnoE "api\.[a-zA-Z]+\.[a-zA-Z]+" dashboard/app dashboard/components dashboard/hooks dashboard/lib --exclude-dir=api | awk -F: '{print $NF}' | sort -u` on the M9 build prints only A.9 function names. (`--exclude-dir=api` skips the `api.twitch.tv` host strings in `app/api/twitch/**`.)
- [ ] `grep -rnoE "'(fal-ai|openai|minimax)/[^']+'" dashboard/app dashboard/components dashboard/lib | awk -F: '{print $NF}' | sort -u` prints only the A.10 app endpoints.
- [ ] Theme persistence (§7.18 theme checks), the `?code&state` strip (§6.16 video-node check), the `?transfer=` href (`tests/unit/director-transfer.spec.ts` asserts `navigate('/admin?transfer=<id>')`) and the `?board=` replace (§9.10) pass; configured behaviour is walked manually and pasted (§1.6 step 6).

