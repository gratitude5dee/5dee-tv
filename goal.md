# goal.md — 5DEE · stream.wzrd.tech admin: "PIXEL INSTRUMENT" frontend redesign

> **For:** Devin (SWE-2 Max), autonomous implementation. **Scope:** `dashboard/` only. **Base commit:** `845147c` (app code). The spec itself is on branch `claude/tender-brahmagupta-6u6ycx`; the owner merges it into `main` before hand-off (§14.6 prerequisite). **Status:** ready for implementation.
> **Layout:** this file holds §0–§4, §14, §16 and §17. Chapters §5–§13, §15 and Appendices A–B live in [`docs/redesign/spec/`](docs/redesign/spec/README.md). See the Chapter map after §4. Evidence: [`docs/redesign/audit/`](docs/redesign/audit/README.md), baseline screenshots in `docs/redesign/baseline/`, component catalog `docs/redesign/component-prompts.csv`.

## Contents

- §0 Mission (this file)
- §1 How to work (this file)
- §2 Required from the user, secrets, and owner decisions (this file)
- §3 Product context and current state (this file)
- §4 Design direction: PIXEL INSTRUMENT (this file)
- Chapter map (this file, end of §4)
- §5 Foundations → [`docs/redesign/spec/05-foundations.md`](docs/redesign/spec/05-foundations.md)
- §6 Motion system and signature moments (incl. the loading animation) → [`docs/redesign/spec/06-motion-and-loading.md`](docs/redesign/spec/06-motion-and-loading.md)
- §7 Primitive kit and app shell → [`docs/redesign/spec/07-primitives-and-shell.md`](docs/redesign/spec/07-primitives-and-shell.md)
- §8 Page: Live Control → [`docs/redesign/spec/08-live-control.md`](docs/redesign/spec/08-live-control.md)
- §9 Page: Shotboard → [`docs/redesign/spec/09-shotboard.md`](docs/redesign/spec/09-shotboard.md)
- §10 Pages: Characters, Locations and the visual-test fixture → [`docs/redesign/spec/10-characters-locations.md`](docs/redesign/spec/10-characters-locations.md)
- §11 Pages: Clips, Recordings, Twitch Analytics and route-level states → [`docs/redesign/spec/11-clips-recordings-analytics-states.md`](docs/redesign/spec/11-clips-recordings-analytics-states.md)
- §12 Effects: the React Bits / Arlan Vault component plan → [`docs/redesign/spec/12-effects.md`](docs/redesign/spec/12-effects.md)
- §13 Brand assets with fal (Coast sheet, GPT Image 2.5 Sunburst, MiniMax H3 Max) → [`docs/redesign/spec/13-brand-assets-fal.md`](docs/redesign/spec/13-brand-assets-fal.md)
- §15 Verification and QA → [`docs/redesign/spec/15-verification-and-qa.md`](docs/redesign/spec/15-verification-and-qa.md)
- Appendix A — Preserved contract → [`docs/redesign/spec/appendix-a-preserved-contract.md`](docs/redesign/spec/appendix-a-preserved-contract.md)
- Appendix B — File map → [`docs/redesign/spec/appendix-b-file-map.md`](docs/redesign/spec/appendix-b-file-map.md)
- §14 Execution plan (this file)
- §16 Non-negotiables and forbidden actions (this file)
- §17 Risks, cut order, open questions and follow-ups (this file)

## 0. Mission

Redesign the frontend of `dashboard/`, the operator console for the 5DEE realtime AI TV channel, into **PIXEL INSTRUMENT**: a calm broadcast instrument in which the mandated Dither wave (the *carrier*) becomes the grammar of every fill, loader and reveal. Every route, Convex/fal contract and preserved string stays; behaviour changes are only those listed in §0.4. What changes is how the console looks, moves, loads and tells the truth. Ship milestones M0–M9 (§14) as separate PRs, each verified by commands (§15).

### 0.1 What "10x" means

| # | Before (845147c) | After |
|---|---|---|
| 1 | Live Control is a 1791 px card scroll, with 'Start Director' below the fold | A zero-scroll instrument at ≥1280×800 (§8) |
| 2 | Red "Live" only means WebRTC is up; ON AIR is a green sentence | Truth-gated PVW/REC/ON AIR lamps; red means public (§6, §7) |
| 3 | `fal-primary-500` silently renders violet `#6d28d9` | One token system, chrome-blue accent, contrast proven over `#5555AA` (§5) |
| 4 | The Dither is wallpaper behind opaque cards | The Dither is grammar: translucent chassis, Bayer skeletons, a 4-step resolve (§5, §6) |
| 5 | 10 spinners and no route state files | A boot gone by 1617 ms, layout-exact skeletons, loading/error/404 files (§6, §11) |
| 6 | Generation is a spinner, and failures are invisible | A GenerationFrame driven by real fal queue status (§6, §7) |
| 7 | Remapped weights, and a mono font that is never wired | Real Focal weights, JetBrains Mono, a named scale, tabular HH:MM:SS (§5) |
| 8 | @coast is a violet "visual fixture" | Coast brand assets from fal (GPT Image 2.5 Sunburst stills, MiniMax H3 Max motion), a no-likeness fal set, or honest placeholders (D5, §13) |
| 9 | The header and nav scroll away, and the footer floats | A 48 px command bar with ⌘K and a 24 px status rail (§7) |
| 10 | Full-resolution WebGL, forever | A carrier capped at ≤30 fps and half resolution, paused when hidden, with the air lock (§6, §12) |

### 0.2 Deliverables

1. A design system: tokens, the Tailwind mapping, typography and primitives (§5, §7).
2. The shell and boot/loading (§6, §7).
3. Seven redesigned routes plus route state files (§8–§11).
4. An effects kit (§12).
5. A brand-asset pipeline plus assets (§13).

### 0.3 Acceptance criteria: definition of done

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] M0–M9 are merged as separate PRs (one PR per part for milestones with parts, §14.2) that use the §1.4 template.
- [ ] `npm ci`, `typecheck` and `build` exit 0. `lint` exits 0 with no warning in any changed file.
- [ ] Every §15 grep gate prints `0`, `tailwind.config.js` defines no `fal-*` colour (§15.3 G16 = 0), and `getComputedStyle(document.documentElement).getPropertyValue('--c-accent')` is `122 165 224` (dark) / `45 84 136` (light).
- [ ] With `WZRD_MILESTONE=9`, `npm run test:e2e` and `npm run test:prod` have 0 failed in every §15.1 project (visual in desktop-dark, desktop-light, laptop and mobile; axe in desktop-dark, desktop-light and mobile; contrast's 12 runs; canvas-audit in desktop-dark and reduced-motion).
- [ ] The §1.6 QA passes: allowed console messages only, and 'Start Director' is restored after a failed start.
- [ ] `/admin` at 1280×800 has `document.scrollingElement.scrollHeight <= innerHeight`.
- [ ] One WebGL context per route after 10 theme toggles, and no rAF after the first frame under reduced motion.
- [ ] The boot is removed by 1617 ms after navigation start (1600 ms at 60 Hz plus at most one frame), with CLS 0.
- [ ] Appendix A is intact byte-for-byte, apart from the D6 changes.
- [ ] The brand `check` passes in the D5 mode that the secrets select (§2.1): placeholders marked `generated:false` (no `FAL_KEY`), the no-likeness set marked `likeness:false` (`FAL_KEY` only), or the Coast set (`FAL_KEY` plus `COAST_SHEET_URL` or `COAST_REF_URLS`). A generated set ships with its contact sheet (D5).

### 0.4 Behaviour changes beyond visuals

These rows are the only behaviour changes in M0–M9 (§0). Each row applies by default. The owner vetoes a row with `OVERRIDE D10: <BC-id>` (§2.2 D10); Devin then keeps the 845147c behaviour for that row and records it under "Decisions". The owning section holds the exact rules, strings and tests. Where a chapter already labels the change `DEC-<chapter>-<nn>` (§1.7), that id is given too. Cite a row as `§0.4 BC-<n>` (§1): the §13.9 brand checks `BC-01`…`BC-16` are a different series.

| ID | Change | Before (845147c) | After | Owner |
|---|---|---|---|---|
| BC-1 | Boot overlay | No overlay: the app paints directly | An overlay (`#wzrd-boot`) runs the full POST ident, gone by 1617 ms, at most once per 12 h per browser (`localStorage['wzrd:boot']`), and the channel flip on other loads. The app hydrates underneath. The first pointer press only dismisses it and never activates a control underneath. `?noboot`, `navigator.webdriver` and a hidden tab skip it | §6.2 |
| BC-2 | Air lock | Nothing changes during a show | While `html[data-lock="air"]` is set (broadcast not idle, or REC active; §7.17), density, dock height and panel sizes are frozen, and their controls give the reason 'Locked while on air'. Info, success and warning chyrons go to the StatusRail instead of floating. Decorative motion freezes (the §6.12 matrix) | §6.12 |
| BC-3 | Leaving Live Control on air (DEC-8-07) | Any nav link unmounts DirectorPlayer at once. The unmount path (`DirectorPlayer.tsx:1034-1043`) stops the recorder without uploading the recording | Under the air lock, the AppNav links, the palette's "Go to" commands, Alt+1…7 and both ScriptTemplatePicker links open 'Leave Live Control?'. 'Leave and stop' runs the full `disconnect()`, which saves the recording, before navigating; 'Stay' keeps `/admin`. Modifier-clicks (new tab) are not guarded | §6.12, §8.6.6 |
| BC-4 | Page unload and mouse back/forward on air | No guard | Under the air lock, a `beforeunload` prompt runs, and the mouse back and forward buttons (`event.button` 3 and 4) are blocked. Keyboard and toolbar Back are not vetoed | §6.12 |
| BC-5 | Go live: hold-to-take | 'Go live on Twitch' starts the WHIP push on a single click | A 600 ms hold (pointer, Space or Enter) commits. A shorter press, a click or an assistive-technology activation opens the 'Go live on Twitch?' dialog ('Go live' / 'Not yet', initial focus on 'Not yet'). Under reduced motion every activation opens the dialog | §6.7, §8.5.7 |
| BC-6 | Go live: first frame required (DEC-8-03) | Enabled when the session is live, a stream key is ready and no push is starting (`TwitchBroadcast.tsx:203`) | Also requires the first decoded frame | §8.5.7 |
| BC-7 | Twitch ingest truth (DEC-8-06) | Once WHIP negotiates, '● pushing to Twitch ingest…' shows until Stop. There is no `connectionstatechange` listener and no `getStats()` (§3.7 #5) | The `air` state (`off`, `cue`, `on`, `stalled`, `offair`) follows a `getStats()` truth gate. While `cue`: `connectionState === 'failed'` gives `off`, tears the session down and shows the cue-failure chyron; `disconnected`, or no truth gate within 10 000 ms, keeps `cue` (the lamp reads `CUE` with a counting readout) and shows the warning chyron 'Twitch ingest not confirmed' with the actions 'End broadcast' and 'Dismiss'. A timeout never tears the session down. On air, a stall shows `STALLED` and the 'Twitch ingest lost' chyron, and never tears the session down. The pushing line shows only while `air === 'on'` | §6.7, §8.5.6 |
| BC-8 | Theme: System option | One toggle between dark and light; every click writes `localStorage['theme']` | ThemeSwitch offers System, Light and Dark. System removes `localStorage['theme']` and follows the OS live. Other tabs follow through the `storage` event | §7.13 |
| BC-9 | Keyboard map and command palette | No shortcuts beyond native controls | mod+K opens the palette and mod+/ the ShortcutSheet. mod+Enter in the composer starts the Director or sends a direction. Esc cancels a connecting session (`director.cancel`) when no dialog, sheet or popover consumes it. Alt+1…7 go to the nth tab (guarded under the air lock). The page shortcuts are listed in §7.12 | §7.11, §7.12 |
| BC-10 | Composer lifecycle (DEC-8-01) | The premise stays in the textarea after Start, so 'Send direction' can re-send the stale premise | The composer clears on the attempt's first `live`. Sent directions go to history (↑/↓ recalls the last 20). When the session ends, the premise (or the default prompt) returns to the textarea | §8.5.6 |
| BC-11 | Stop guards (DEC-8-02, DEC-8-14) | 'Stop' acts at once and stays clickable during `closing`, so it can call `disconnect()` twice | 'Stop' ignores clicks during `closing`, ignores activations for 600 ms after it mounts and ignores repeated `keydown`. While `air ∈ {on, stalled}`, 'Stop' and the palette's 'Stop' open 'Stop the Director?' ('Stop and end broadcast' / 'Keep running') | §8.5.7 |
| BC-12 | Event log (DEC-8-09) | 50 lines, with every `pong`/`chunk` logged (`DirectorPlayer.tsx:174`) | 500 non-debug entries plus 100 debug entries; debug entries are hidden until 'Show debug' | §8.5.6 |
| BC-13 | Chat frame commands (DEC-8-13) | `!frame`/`!snap` capture a frame on every matching chat line, unthrottled (`ChatSteerer.tsx:81-84`) | A 10 s global and 8 s per-user minimum; a throttled command gets the `THROTTLED` badge. The direction throttle is unchanged | §8.5.9 |
| BC-14 | Arming and disarming a track (DEC-8-10) | Clicking a track row toggles it: clicking the armed row disarms it (`TrackManager.tsx:159`) | The rows form the 'Armed track' radiogroup. Clicking the armed row keeps it armed; the first option, 'No track', disarms | §8.5.10 |
| BC-15 | The artwork carousel is display-only (DEC-8-04, D3) | `onIndexChange={selectSliderTrack}` arms whichever slide is shown, so autoplay re-arms a different track every 6 s (§3.7 #1) | Autoplay stays (`autoplayDelay={6}`), but no slide change (autoplay, previous/next, the caption tabs, drag) changes the armed track. Arming happens only through the radiogroup or the 'Arm this track' button on the current slide. Autoplay pauses under the air lock, under reduced motion, while the dock is collapsed, while the Audio tab is hidden and while the page is hidden. 'Expand artwork' opens a Sheet with the carousel at up to 480×480 | §8.5.10, §12.4.1 |
| BC-16 | Shotboard deletes and undo | 'Delete shot' fires at once, 'Delete scene' also deletes its shots, and 'Delete board' is a bare icon, all without confirmation or undo (§9.3 B8) | Deleting a board requires typing its title. Deleting a scene or a shot shows an 8 s 'Undo' chyron. In Convex mode, Undo re-creates the rows through `createScene`/`createShot`, so they get **new Convex ids**; every field, including `shotNumber`, `order` and `sceneNumber`, comes from the snapshot. In local mode the original id returns | §9.6.2, §9.9.4 |
| BC-17 | Library characters on Shotboard | Rename, portrait generation and 'Delete character' also act on shared library characters; deleting one (for example @coast) archives it for the whole studio | Library characters (`boardId` undefined) are read-only on Shotboard and link to 'Edit in Characters'. Board-local characters keep every control | §9.9.4 |
| BC-18 | Shotboard model, URL and Expand | After a shot's first generation the toolbar model never applies to it again (§9.3 B3). The board selection is not written to the URL (§9.3 B21). 'Expand' is enabled in local mode and fails on click | The board model applies unless a session-local per-shot override is set with the ModelChip ('Use board default' clears it); `shot.imageModel` is only written, as provenance. The Convex board selection is written to `?board=` with `router.replace(…, { scroll: false })`. 'Expand' is `aria-disabled` in local mode, with the preserved sentence as its reason | §9.5.4, §9.9.4 |
| BC-19 | Hover galleries and card canvases leave the product pages | Characters and Locations select through a hover AccordionGallery (hover and focus set the active item; only a click selects). Shotboard uses an AccordionGallery per shot and scene and a ChromaGrid cast. Every Clips and Recordings item is a PixelCard canvas | Characters use the RosterRail and Locations the ScoutWall: hover and focus never select; Enter, Space or a click selects. Shotboard uses cast chips and the CastStrip. Clips and Recordings render plain cards with no canvas. The component files stay unchanged on disk, and the fixture still shows them | §9.2, §10.5.3, §11.A.2, §11.B.2 |
| BC-20 | Editing Characters and Locations | 'Save source' sends `referenceStorageIds`, which silently drops references added on the server since the draft loaded. Switching the selection discards unsaved edits. Clicking a sheet in 'Sheet history' makes it the primary reference | Save omits `referenceStorageIds`. Switching, or 'New character'/'New location', with unsaved edits opens 'Discard unsaved changes?', and a `beforeunload` guard runs while the draft is dirty. A sheet click opens the viewer; promotion needs the explicit 'Use as primary reference' control on `REF` sheets. @coast is pinned first, and the first item is auto-selected | §10.5.2, §10.9.6 |
| BC-21 | Downloads | Clips have no Download control. Recordings use `<a download="recording-<id>.webm">`, which browsers ignore for the cross-origin Convex URL, and the extension is always `.webm` | Clips and Recordings download `clip-<id>.<ext>` and `recording-<id>.<ext>`, with `<ext>` from `mimeType`: through a Blob up to 256 MiB, and streamed to a save dialog (`showSaveFilePicker`) above that | §11.A.5, §11.B.5 |
| BC-22 | Clips and Recordings lists | Up to 100 items render at once, each with a `<video preload="metadata">`. Recordings' Delete uses the native `confirm('Delete this recording permanently?')` | 24 items at a time, with 'Show more'; posters load lazily. Delete opens a ConfirmDialog with the same title, a pending state and an inline failure message | §11.A.5, §11.B.5 |

## 1. How to work

This section is your operating guide. Line references are **as of commit `845147c`** (the app code), which is where `main` stood when this spec was written. The spec itself is on branch `claude/tender-brahmagupta-6u6ycx`; the owner merges it into `main` before hand-off. That branch adds only `goal.md` and `docs/redesign/**`, so `dashboard/` is byte-identical to `845147c`. "The spec" means `goal.md` plus the chapter files in `docs/redesign/spec/`: one document with one authority (§1.2).

- **Where the spec is.** The first prerequisite of 0A (§14.6) checks that `origin/main` contains `goal.md` and [`docs/redesign/spec/appendix-a-preserved-contract.md`](docs/redesign/spec/appendix-a-preserved-contract.md). If it does not, base the first part on `origin/claude/tender-brahmagupta-6u6ycx`, read every `main` in §1.4, §1.10, §14 and §15 as that branch, and record `DEC-M0-01`.
- **IDs are section-scoped.** Always cite them with their section: `§14.3 R7`, `§17.1 R7`, `§15.3 G5`, `§4.4.2 G5`, `Appendix A A.12 G5`, `§4.4.5 C3`, `§15.2 C3`. The same holds for `§0.4 BC-3` (a behaviour change) and `§13.9 BC-03` (a brand check).

### 1.1 Read order

File locations: `goal.md` holds §0–§4, the Chapter map (at the end of §4), §14, §16 and §17. §5–§13, §15 and Appendices A and B live in `docs/redesign/spec/`, and the Chapter map names each file. A reference "§N.M" means that section wherever it lives.

Read just in time, in this order:

1. **Before 0A:** §0–§3 (`goal.md`; §2 holds the owner defaults you apply without asking), §16 (non-negotiables, `goal.md`), Appendix A (preserved contract, [`docs/redesign/spec/appendix-a-preserved-contract.md`](docs/redesign/spec/appendix-a-preserved-contract.md); skim its A.12 allowed-changes list) and §14.1–§14.6 (`goal.md`). Before 0B, also read the rest of M0's §14.1 "Specified by" column (§10.5.1).
2. **Before M1:** §4 (design direction, `goal.md`), §5 ([`docs/redesign/spec/05-foundations.md`](docs/redesign/spec/05-foundations.md)) and §15 ([`docs/redesign/spec/15-verification-and-qa.md`](docs/redesign/spec/15-verification-and-qa.md)). The §4 principles are your tie-breaker for every open choice (§1.7); if an open choice arises during M0, read them then.
3. **Before M4:** §6 and §7 in full ([`docs/redesign/spec/06-motion-and-loading.md`](docs/redesign/spec/06-motion-and-loading.md) and `07-primitives-and-shell.md`). They define every motion and primitive name that the page sections use.
4. **Before each other milestone** (M2, M3 and M5–M9), and for the rest of M4: its §14 subsection and the sections in its §14.1 "Specified by" column (§8–§13 live in `docs/redesign/spec/08-…` to `13-…`; see the Chapter map).
5. **Appendix B** ([`docs/redesign/spec/appendix-b-file-map.md`](docs/redesign/spec/appendix-b-file-map.md)), before you create, move or delete a file.

Re-read §2 at the start of every milestone, because owner overrides are recorded there (§2.3).

### 1.2 Source-of-truth hierarchy

| Rank | Source | Authoritative for |
|---|---|---|
| 1 | `goal.md` plus the chapter files it maps in `docs/redesign/spec/` (one document; same authority). §16 and Appendix A ([`docs/redesign/spec/appendix-a-preserved-contract.md`](docs/redesign/spec/appendix-a-preserved-contract.md)) outrank every other section | What to build, and what must not change |
| 2 | The code at the head of your branch | What exists today: strings, props, imports, line numbers. Line numbers in the spec drift |
| 3 | `docs/redesign/audit/*.md` | Evidence and invariants. They are never the plan, and their "Redesign opportunities" have already been weighed |
| 4 | `docs/redesign/component-prompts.csv` (190 rows) | Inspiration only. §12 decides what ships |
| 5 | `docs/redesign/design-bible.md` | Design rationale only. The spec cites it as "bible §N" and corrects it in §4.4.5. It never outranks ranks 1–3 |

**Conflict rules:**
- If the spec mis-states a fact about the existing code (a moved line, a renamed prop), follow the code for the fact and the spec for the intent, and record it under "Decisions" (§1.7).
- Inside the spec, §5–§7 own token, primitive and motion names and values, and §8–§11 own page layout and page copy.
- No audit outranks the spec (`docs/redesign/audit/README.md`).

### 1.3 Repo orientation

| Path | Rule |
|---|---|
| `goal.md`, `docs/redesign/spec/` | The spec. Never edit it, except that the user edits §2.2 (§2.3) |
| `dashboard/` | The only code in scope (Next.js app) |
| `dashboard/app/`, `components/`, `hooks/`, `lib/`, `public/`, `scripts/`, `tailwind.config.js`, `tsconfig.json`, `.gitignore`, `.nvmrc` (added in 0A, §1.5), `app/globals.css`, `package.json` | Where the work happens, except the paths the rows below protect. Appendix B lists every file. `package.json` changes only as §15.1, §5.1 and §13.3.2 specify: the D1 removals, the D8 devDependencies, the `overrides` block and the named scripts |
| `dashboard/components/reactbits/` | Vendored React Bits. Editable: `Dither.jsx`/`.css` and `MorphSlider.tsx`/`.css` only (Dither hardening, §12.3.1; the MorphSlider CSS edits, §5.10, and render-on-demand patch, §12.4.1). `AccordionGallery`, `ChromaGrid` and `PixelCard` (`.jsx` and `.css`) never change |
| `dashboard/components/dither-kit/`, `dashboard/dither-kit.json`, `dashboard/components.json` | Hash-locked registry and its config. Import and wrap; never edit |
| `dashboard/convex/` | Read only. Any schema or function change is a stop-and-ask (§1.8) |
| `dashboard/middleware.ts`, `dashboard/app/api/**`, `dashboard/lib/twitchWhip.ts` | Never change. Wrap `twitchWhip` with `useWhipTruth` (§8.5.6) |
| `dashboard/lib/directorProtocol.ts`, `lib/runtimeEnv.ts`, `lib/shotboardCompiler.ts`, `lib/shotboardTypes.ts`, `lib/assetGeneration.ts` | Never change |
| `dashboard/components/useDirectorPersistence.ts`, `dashboard/components/DirectorPanel.tsx` | Never change |
| `dashboard/next.config.js`, `dashboard/public/wzrdtechlogo.png` | Never change |
| `dashboard/wrangler.toml`, `dashboard/.env.production` | Never change. `.env.production` is committed and affects builds (§1.6) |
| `dashboard/fonts/focal/` | Never change, and never delete a file (D4) |
| `streaming_pipeline/`, `pyproject.toml`, `requirements.txt` | Python backend. Never touch |
| `docs/redesign/audit/`, `docs/redesign/baseline/`, `docs/redesign/component-prompts.csv`, `docs/redesign/design-bible.md` | Read-only evidence and rationale. After-screenshots go where §15 says |
| `.agents/skills/admin-testing/SKILL.md` | Keep accurate (§1.9) |

The never-touch check in §1.4 enforces every "never" row above.

### 1.4 Branch, commit and PR workflow

- **Branches.** The base branch is `main`. Use one branch and one PR per §14 milestone. Milestones with parts follow §14.2 (one PR per part). Never combine milestones and never push to `main`.
- **Branch names** follow `devin/<milestone>-<slug>`: the milestone in lower case (`m0`…`m9`) and a slug of 2–4 kebab-case words, for example `devin/m2-type-system`. A part's branch puts its part id in front of a slug of 1–3 words (§14.2), for example `devin/m0-0a-dead-code`, so both forms match the §1.10 pattern.
- **PR titles** follow `[M<n>] <milestone title from §14>`, or `[M<n>] <PART> · <title>` for a part (§14.2).
- **Starting a milestone.** Start from the latest `main`. If the previous milestone's PR (its last part's PR, for a milestone with parts) is still open, branch from it and make `Stacked on #<PR number>` the first line of the PR body. If the previous part's PR is open, stack on it. M9's two parts take their base from §14.15. Never merge your own PR.
- **Diff base (`BASE`).** Part-scoped checks compare against this PR's own base branch, so a stacked PR never reports its parents' changes as its own. `BASE=origin/<this PR's base branch>`: `origin/main`, or the stacked parent's branch. Set it in the same shell that runs the check:

  ```bash
  git fetch origin
  BASE=origin/main    # or the stacked parent, for example BASE=origin/devin/m0-0a-dead-code
  : "${BASE:?set BASE (§1.4) in this same shell first}"
  ```

  Every check written `"$BASE"...HEAD` uses it: the D8 line of the PR template below and the part checks in §14 and §15. An empty `BASE` would turn `"$BASE"...HEAD` into `...HEAD`, which compares `HEAD` with itself and prints nothing, hence the guard line. The never-touch check below keeps `main...HEAD`: it compares against the spec base (§1).
- **Design reviews (non-blocking).** After 5A (the design-system fixture) and after 8B (the Live Control instrument), post a PR comment titled `DESIGN REVIEW` with the fixture captures, and keep working (§14). It asks nothing and waits for nothing (§1.10). Apply requested changes in the lowest open part that owns the primitive, then rebase the parts above it.
- **Commits** hold one logical change each, with the message `M<n>: <imperative summary>`. Codemods (§5) are committed separately from hand edits. Never commit `.next/`, `.env.local`, `scripts/brand/.cache/`, raw fal outputs or anything that contains a secret.
- **Never-touch check.** Run it from the repository root in every PR. It must print nothing:

  ```bash
  git diff --name-only main...HEAD | grep -E '^(streaming_pipeline/|pyproject\.toml|requirements\.txt|goal\.md|docs/redesign/(audit|baseline|spec)/|docs/redesign/component-prompts\.csv|dashboard/(components/dither-kit/|dither-kit\.json|components\.json|convex/|middleware\.ts|app/api/|lib/(twitchWhip|directorProtocol|runtimeEnv|shotboardCompiler|shotboardTypes|assetGeneration)\.ts|wrangler\.toml|\.env\.production|next\.config\.js|fonts/focal/|public/wzrdtechlogo\.png|components/(useDirectorPersistence\.ts|DirectorPanel\.tsx)|components/reactbits/(AccordionGallery|ChromaGrid|PixelCard)\.(jsx|css)))'
  ```

  Appendix B.4 lists the same paths as a table.
- **PR body.** Use exactly this template, then paste the §14.5 milestone checklist after "Verification". Omit the `Stacked on` line when the branch is based on `main`.

```markdown
Stacked on #<n>

## Summary
- <3–7 bullets; each names the files/primitives changed>

## Screenshots
| Route · theme · width | Before | After |
|---|---|---|
| /admin · dark · 1440 | docs/redesign/baseline/admin-dark.jpg | <after path from §15> |

## Preserved contract
- [ ] Every Appendix A item this PR touches is still present (paste the grep command + output under Verification)
- [ ] 'Start Director' visible when idle; failed start shows an error and restores 'Start Director'
- [ ] Console per route matches §1.6 allowed list (table under Verification)
- [ ] No never-touch path changed: the §1.4 never-touch check prints nothing (paste the command + output under Verification)
- [ ] No new runtime dependency: `git diff "$BASE"...HEAD -- dashboard/package.json` (`BASE`: §1.4) adds nothing under "dependencies" (D8)
- [ ] No file deleted from dashboard/fonts/focal/ (D4)

## Decisions
- DEC-M<n>-01 · <question> → <decision> · principle: "<§4 principle name>" · reversible by: <how>

## Deferred / blocked
- <item> · reason · link to the BLOCKING QUESTION comment (only §1.8 items)

## Owner-decision evidence
<D1: import-grep command + output per removed file · D5: budget ledger + contact sheet · otherwise "n/a">

## Verification
<last 40 lines of npm ci / lint / typecheck / build, the build route table,
grep-gate counts, §15 suite summaries, console table: route → messages>
```

### 1.5 How to verify locally

**Node.** Use Node ≥ 22.18; 22.22.2 is recommended (0A adds `dashboard/.nvmrc` containing `22.22.2`, so `nvm install && nvm use` in `dashboard/` selects it). The check scripts and the brand pipeline import `.ts` files through Node's type stripping, which runs unflagged only from 22.18. Before `npm ci`, run this from `dashboard/`. The second line must exit 0, and the `node --version` output goes under Verification:

```bash
node --version
node -e "process.exit(+process.versions.node.split('.')[0]>22||(+process.versions.node.split('.')[0]===22&&+process.versions.node.split('.')[1]>=18)?0:1)"
```

Then run these from `dashboard/` for every PR:

```bash
npm ci
npm run lint
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 npm run build
```

- All four must exit 0.
- `npm run lint` must not report a warning for any file the PR created or changed. The baseline has 5 warnings (§3.5). After M0, only the two in `components/reactbits/` remain.
- `npm run build` prints two `@fal-ai/server-proxy` warnings ("No allowed endpoints specified, all endpoints will be allowed…" and "Allowing unauthenticated requests…"). They are expected. Leave them alone (D7).
- Paste the build's route table (First Load JS per route) into every PR, and compare it with §3.5.
- From the milestone where §14 adds them, also run the §15 suites (Playwright visual, axe, contrast, canvas/slot audit) and the grep gates.
- **Working directory.** Commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`. No command mixes both forms. Quote any path that contains `(live)`, for example `'app/admin/(live)/page.tsx'`.
- In tables, `\|` is Markdown escaping for `|`. Commands to run are always in fenced blocks.

### 1.6 The unconfigured QA procedure

This is the procedure from `.agents/skills/admin-testing/SKILL.md`. Run it for every PR, with the pitfalls below.

**Steps:**

0. **No `.env.local`.** From the repository root, this must succeed before any QA server, `npm run test:e2e` or `npm run test:prod` starts:

   ```bash
   test ! -e dashboard/.env.local
   ```

   `next dev` and `next start` load `.env.local` into the server at runtime, and the step 2 check cannot see it. Never create the file (§2.1).

1. **Inspect environment names only, never values** (from the repository root).

   ```bash
   env | cut -d= -f1 | grep -E '^(FAL_KEY|NEXT_PUBLIC_|TWITCH_|CF_ACCESS_|ADMIN_AUTH_MODE)'
   ls -a dashboard | grep '^\.env'
   ```

   The second command prints only `.env.production`, as at baseline. Devin secrets and shared machines can inject `FAL_KEY`.

2. **Launch the dev server with every configuration variable unset**, on a free port. Start from the repository root; the block changes into `dashboard/`, and every later command in this procedure (including the run modes below) runs there:

   ```bash
   cd dashboard
   UNSET="-u FAL_KEY -u NEXT_PUBLIC_CONVEX_URL -u TWITCH_CLIENT_ID -u TWITCH_CLIENT_SECRET -u TWITCH_CHANNEL \
     -u NEXT_PUBLIC_TWITCH_CHANNEL -u NEXT_PUBLIC_TWITCH_CLIENT_ID -u NEXT_PUBLIC_FAL_API_URL \
     -u CF_ACCESS_TEAM_DOMAIN -u CF_ACCESS_AUD -u ADMIN_AUTH_MODE"
   : "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET NEXT_TELEMETRY_DISABLED=1 npx next dev -p 3107
   ```

   This list adds `NEXT_PUBLIC_TWITCH_CLIENT_ID` to the SKILL's list. Every command that uses `$UNSET` starts with the guard `: "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}"`, because agent shells often drop variables between commands, and an empty `$UNSET` would start a server that silently inherits every injected secret. If the guard fails, run the `UNSET=` line and the command in one shell invocation.

   Then, while the server runs, check the listening `next-server` process's environment, by name only. It must print only the `port 3107 pid <n>` line:

   ```bash
   for port in 3107; do
     pid="$( { fuser -n tcp "$port" 2>/dev/null || lsof -t -iTCP:"$port" -sTCP:LISTEN; } | awk 'NR==1{print $1}')"
     echo "port $port pid ${pid:?no server listening on $port}"
     tr '\0' '\n' < "/proc/$pid/environ" | cut -d= -f1 | grep -E 'FAL_KEY|CONVEX|TWITCH|CF_ACCESS|ADMIN_AUTH'
   done
   ```

   With `FAL_KEY` absent from the server, 'Start Director' cannot open a paid Director session.

3. **Walk all 8 admin routes.** On `/admin`:
   - Find the button whose accessible name is exactly **'Start Director'**.
   - Append a unique token (for example ` qa-<unix time>`) to the premise textarea, then click 'Start Director'.
   - Verify that a visible error appears and that 'Start Director' is restored. Without credentials the SDK may report an upstream auth error instead of a local missing-key message. Both outcomes pass.
   - If a script (for example Playwright) clicks 'Start Director', it first installs the `/api/fal/**` 401 stub (§15.4).

4. **Capture the console per route**, immediately after each fresh navigation. The allowed messages, measured at 845147c with Playwright's headless Chromium (build 1194), are:

   | Route | Allowed |
   |---|---|
   | every route | `info` "Download the React DevTools for a better development experience…" |
   | `/admin` | also `verbose` "[DOM] Password field is not contained in a form" (stream-key input, `TwitchBroadcast.tsx:223`). It may disappear; it must not multiply |
   | `/admin/analytics` | also one `error` "Failed to load resource: the server responded with a status of 503" per poll (`/api/twitch` unconfigured, `app/api/twitch/route.ts:78-85`; the route is untouchable) |
   | `/admin/visual-test` | also `net::ERR_TUNNEL_CONNECTION_FAILED` resource errors, only while fixture images point at external hosts that the sandbox blocks |

   Anything else is a regression: WebGL messages, hydration mismatches, missing keys, 404ed assets, `THREE.WebGLRenderer: Context Lost.`, or any log from new code. A `FAL_KEY not configured` error means LTX code came back (D1).

5. **Production-mode checks** (the middleware gate, LCP and production screenshots):

   ```bash
   : "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET NEXT_PUBLIC_CONVEX_URL= NEXT_PUBLIC_TWITCH_CHANNEL= NEXT_PUBLIC_TWITCH_CLIENT_ID= \
     NEXT_TELEMETRY_DISABLED=1 npm run build
   : "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET NEXT_TELEMETRY_DISABLED=1 npx next start -p 3108                              # gate proof
   curl -s -w ' %{http_code}\n' localhost:3108/admin
   # → Unauthorized: set CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD, or ADMIN_AUTH_MODE=edge-only if Cloudflare Access already protects this path 401
   : "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET ADMIN_AUTH_MODE=edge-only NEXT_TELEMETRY_DISABLED=1 npx next start -p 3109    # prod: screenshots, LCP
   curl -s -o /dev/null -w '%{http_code}\n' localhost:3109/admin  # → 200
   ```

   Run both starts, so the result proves the gate works rather than a routing accident. While both servers run, repeat the step 2 environment check on them. It must print the `port 3108 pid <n>` line with nothing under it, then the `port 3109 pid <n>` line followed by exactly one line, `ADMIN_AUTH_MODE` (set on purpose for the edge-only server):

   ```bash
   for port in 3108 3109; do
     pid="$( { fuser -n tcp "$port" 2>/dev/null || lsof -t -iTCP:"$port" -sTCP:LISTEN; } | awk 'NR==1{print $1}')"
     echo "port $port pid ${pid:?no server listening on $port}"
     tr '\0' '\n' < "/proc/$pid/environ" | cut -d= -f1 | grep -E 'FAL_KEY|CONVEX|TWITCH|CF_ACCESS|ADMIN_AUTH'
   done
   ```

   The check cannot see what `next start` itself loads from `dashboard/.env.production` into `process.env` at runtime (the committed `NEXT_PUBLIC_*` values, which have no effect: the build above already inlined empty ones); it proves that `$UNSET` removed every injected variable. From 1A, `npm run qa:build` (§15.2 C5) runs this same unconfigured build and writes its route table to `.qa/build.log`.

6. **Keep configured coverage separate.** 'Record' appears only during a live session, and accepting a valid Cloudflare JWT needs real Access certificates. Unconfigured runs prove nothing about playback, recording, storage or Twitch. A live Director session is a paid fal call, so Devin never starts one (§1.8 item 3): any check that needs one is "Human operator only" and is recorded under Deferred / blocked as "not run (paid)".

**Run modes.** Every chapter uses these words with exactly these meanings:
- **dev**: `: "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET NEXT_TELEMETRY_DISABLED=1 npx next dev -p 3107` (step 2).
- **prod**: `npm run qa:build`, then `: "${UNSET:?run the §1.6 step 2 UNSET= line in this same shell first}" && env $UNSET ADMIN_AUTH_MODE=edge-only NEXT_TELEMETRY_DISABLED=1 npx next start -p 3109`. A plain `next start` returns 401 and is never a prod check.
- **fixture**: dev at `/admin/visual-test?noboot` (plus `#section`). The route returns 404 in prod, so fixture checks never run on prod.
- `/admin` checks that need the air lock run on dev and set it with `window.__wzrd.broadcast.publish({ director: 'live', firstFrame: true })`. The store exposes this in development from 3A (§7.17).

**Pitfalls (all verified):**

- **`dashboard/.env.production` is committed.** It sets `NEXT_PUBLIC_CONVEX_URL` (the production deployment), `NEXT_PUBLIC_TWITCH_CHANNEL` and `NEXT_PUBLIC_TWITCH_CLIENT_ID`.
  - `next dev` ignores the file.
  - `next build` loads it for every variable missing from the process, so `env -u` alone produces a **configured** production bundle. Pass empty strings, as in step 5. `@next/env` never overwrites a key that already exists in `process.env`, even an empty one (checked with `loadEnvConfig`).
  - `NEXT_PUBLIC_*` values are inlined at build time, so setting them on `next start` does nothing.
- **Production `next start` without `CF_ACCESS_*` returns 401** on `/admin/**` and `/api/**` by design. Use `ADMIN_AUTH_MODE=edge-only`. Never set `CF_ACCESS_*` locally.
- **`/admin/visual-test` calls `notFound()` in production.** Capture it from `next dev` only.
- **Orphaned servers.** Killing the shell can leave `next-server` listening (EADDRINUSE). Find the `next-server` child of your own `npm`/`npx` tree, confirm that `readlink /proc/<pid>/cwd` ends in `/dashboard`, kill that tree, restart, and re-run the step 2 environment check.
- **Headless Chromium warnings.** Headless Chromium on software GL prints `Automatic fallback to software WebGL has been deprecated…` warnings. Launch it with `--enable-unsafe-swiftshader --use-angle=swiftshader` and they disappear. They are harness noise, not app output.
- **Strict mode.** `reactStrictMode: true` (`next.config.js:3`) double-mounts effects in dev. Take WebGL and console counts only after the §15 settle wait.
- **Missing Playwright browsers.** Playwright can be importable while its browsers are absent. If `npx playwright install chromium` cannot download, run the SKILL flow in the running browser and state the gap under Verification.
- **The boot overlay** (from 4C, §6.2) skips itself under `navigator.webdriver` or `?noboot`. A manual browser sees it for ≤ 1617 ms (the full POST at most once per 12 h per browser, the channel flip otherwise; §6.2.4); the first pointer press only dismisses it and never activates a control underneath. The console check runs **with** the boot, which must be console-clean too.
- **Never press 'Go live on Twitch' with a real stream key.** Twitch output is public.

### 1.7 How to handle ambiguity

Decide; never block. Follow these steps:

1. If the choice could alter a preserved item (Appendix A), a Convex function, spend, or a likeness, it is not ambiguity. Go to §1.8.
2. Otherwise, apply the §4 principles by name, for example "Truth over theatre" or "Information may move, decoration may not". Pick the option that changes fewer preserved surfaces and costs less CPU/GPU on Live Control.
3. Implement it. Record it in the PR under "Decisions" as `DEC-M<n>-<nn> · question → decision · principle · how to reverse`. Decisions already made by this spec are labelled `DEC-<chapter>-<nn>` (e.g. `DEC-8-13`); decisions you make in a PR use `DEC-M<n>-<nn>`.
4. Do not pause the milestone and do not ask the user.

### 1.8 When to stop and ask

This list is complete. Stop and ask only for these four:

1. A change to any preserved string, aria-label, `title`, id, class, storage key or URL parameter that is not an allowed D6 change (Appendix A).
2. Any change under `dashboard/convex/` (schema, function, arguments, return shape), including the D2 and D7 fixes.
3. A paid fal call that would take the brand run past `--budget-usd 40` (D5). Paid calls outside `dashboard/scripts/brand` are forbidden outright (§16). You never ask for one. A live Director session is such a call: Devin never runs one. Every step that needs one is "Human operator only" and is recorded as "not run (paid)".
4. A likeness question: whether a reference or a sheet is approved, whether an output is an acceptable likeness of Coast, or any depiction of a real person. Devin never judges likeness:
   - Devin's automatic variant selection uses technical checks only: dimensions, alpha, palette and quantisation, artifacts, frame-to-frame consistency and composition safe areas (§13.10). Devin rerolls an asset only on a technical failure or on the owner's PR comment `REROLL <asset-id>`.
   - A `coast-brand-sheet-v1` generated from `COAST_REF_URLS` is this stop. Post it as `BLOCKING QUESTION (§1.8 item 4)` and generate no other Coast asset until the owner comments `APPROVE coast-brand-sheet <n>`. Everything else, including the no-likeness assets, continues.
   - `COAST_SHEET_URL` raises no question: supplying it (or `COAST_REF_URLS`) is the owner's confirmation of Coast's consent (§2.1).
   - Likeness sign-off belongs to the owner and Coast, on the brand PR's contact sheet, before merge (D5).

**How to ask:**
- Post one PR comment that starts `BLOCKING QUESTION (§1.8 item <k>)`. State the options and your recommended default.
- List the item under "Deferred / blocked", and continue with all work that does not depend on it.
- Until you get an answer, the item stays out of the milestone. Never guess on these four.

### 1.9 Keeping the admin-testing skill accurate

Update `.agents/skills/admin-testing/SKILL.md` **in the same PR** whenever that PR changes anything the skill relies on:
- the tab count or labels;
- the Live Control landmark (today, 'The Director card');
- where 'Start Director' lives, or what it is called;
- the failed-start error region;
- the gating of 'Record';
- console expectations, including the §1.6 allowed list;
- boot behaviour (`?noboot`, `navigator.webdriver`);
- new route states (404, error, auth).

**Rules for editing the skill:**
- Make factual edits only. Never weaken a check.
- Keep the front matter `name: test-5dee-admin-unconfigured` and the "Devin Secrets Needed" section.
- It is already stale at `SKILL.md:12`: "Use the four admin tabs" (there are 7, plus `/admin/visual-test`) and "The Director card is the only Live Control content" (the Script and Chat steering cards also render, and the Audio library renders when Convex is configured). Fix both in the first milestone PR you open (0A; §14.6 gives the exact replacement text).

### 1.10 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] Every PR branch matches `^devin/m[0-9]-[a-z0-9]+(-[a-z0-9]+){1,3}$`, and every PR title starts `[M<n>]`.
- [ ] Every PR body contains the headings Summary, Screenshots, Preserved contract, Decisions, Deferred / blocked, Owner-decision evidence and Verification.
- [ ] Every PR's never-touch `git diff` check (§1.4) prints nothing.
- [ ] Every PR's Verification section shows `test ! -e dashboard/.env.local` succeeding before its QA servers and suites started (§1.6 step 0).
- [ ] Every PR's Verification section shows `npm ci`, `lint`, `typecheck` and `build` exiting 0, plus the per-route console table matching §1.6.
- [ ] Every production-mode check shows both the 401 run (exact body) and the `edge-only` 200 run.
- [ ] `grep -n "four admin tabs" .agents/skills/admin-testing/SKILL.md` prints nothing after the first merged PR.
- [ ] No PR comment asks the user anything outside the four §1.8 items. The `DESIGN REVIEW` comments (§1.4) ask nothing and wait for nothing.
- [ ] Every PR's Verification section shows `node --version` and the §1.5 Node check exiting 0 before `npm ci`.

## 2. Required from the user, secrets, and owner decisions

### 2.1 Required from the user

Nothing is required to finish M0–M9. Never request these values and never wait for them. If the user wants an optional outcome, they add the variable as a Devin secret, which reaches the process as an environment variable. The 0A PR body carries an informational "Brand generation inputs" note (§14.6) that lists `FAL_KEY`, `COAST_SHEET_URL` (preferred) or `COAST_REF_URLS`, and what each unlocks. It is not a question and never blocks.

| Secret / variable | Required? | Used for | If absent |
|---|---|---|---|
| `FAL_KEY` | Optional | **Brand generation only** (`dashboard/scripts/brand`, §13): stills from GPT Image 2.5 Sunburst (the `openai/gpt-image-2.5/sunburst/…` endpoints, §13.2), motion from MiniMax H3 Max (`minimax/h3-max/image-to-video`). With no Coast input it still generates the no-likeness set (brand mode 2, below). Read only from the process environment (a Devin secret). Never write it to any file, including `dashboard/.env.local`: `next dev`/`next start` load that file, and §1.6 could not detect it. Never present in the dev or prod **server** env during QA (§1.6 steps 0 and 2) | Ship the pipeline, the prompts and procedural placeholders at final dimensions, marked `generated:false` (brand mode 1, D5). Placeholders are used only when `FAL_KEY` is absent |
| `COAST_SHEET_URL` | Optional; used only together with `FAL_KEY`; preferred over `COAST_REF_URLS` | One `https` URL of the approved Coast character sheet the user already has (for example @coast's current primary sheet in Characters, a Convex storage URL). By supplying it, the user confirms Coast's consent for the brand run. It is used **directly** as Image 1 of every Coast asset; no anchor sheet is generated. The rule "never use a previously generated sheet as an identity reference" covers only automatic sheet history (`referenceAssets`, `.cache/raw`), never this user-designated sheet, and the sha256 self-output check never rejects it (§13.4) | `COAST_REF_URLS` supplies Image 1 instead (next row). Without either Coast input, no Coast likeness is generated anywhere (D5) |
| `COAST_REF_URLS` | Optional; used only together with `FAL_KEY` | Comma-separated `https` URLs of Coast reference images **that Coast has approved**. By supplying them, the user confirms Coast's consent. They are downloaded to `dashboard/scripts/brand/.cache/refs/` (gitignored). When `COAST_SHEET_URL` is absent, they are used to generate `coast-brand-sheet-v1`, which becomes Image 1 only after the owner's PR comment `APPROVE coast-brand-sheet <n>` (§1.8 item 4). A human operator running the pipeline outside Devin may pass `--operator-refs` to use files placed there; Devin never passes it and never writes files into that folder (§13.4) | With `COAST_SHEET_URL`, the Coast set still ships. Without either Coast input, no Coast likeness is generated anywhere: with `FAL_KEY` the no-likeness set ships (brand mode 2), otherwise the non-human placeholders from §13.7 (brand mode 1) |
| `NEXT_PUBLIC_CONVEX_URL` | Optional; configured-mode QA only | The URL of a **non-production** Convex deployment that the user names as authorized for QA. It exercises the loading, empty and auth states. Without Cloudflare Access cookies, `/api/auth/convex` returns 401 (`app/api/auth/convex/route.ts:9`), so data queries run signed-out. Today that shows 'No clips yet'; after §11 lands it shows the NO ACCESS state. Those 401s are expected in this mode | QA runs unconfigured only. Configured states are verified through the `/admin/visual-test` fixtures (§10) and marked "not verified live" in the PR |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_CHANNEL` (server); `NEXT_PUBLIC_TWITCH_CHANNEL`, `NEXT_PUBLIC_TWITCH_CLIENT_ID` (client) | Optional; configured-mode QA only | `/api/twitch` analytics, the chat-steering IRC channel, and 'Connect to Twitch' OAuth | Analytics shows its not-configured state with the server `body.error` verbatim (for example 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured'). Chat 'Connect' is disabled and the TWITCH LED is amber |
| `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` | Not needed | Origin JWT verification in `middleware.ts` | Use `next dev`, or `next start` with `ADMIN_AUTH_MODE=edge-only` (§1.6). Never set these locally |

**Brand modes (D5).** The secrets present when the brand part starts (§14.15) select exactly one mode:

| Mode | Secrets present | What ships |
|---|---|---|
| 1 · Placeholders | No `FAL_KEY` | The pipeline, the prompts and procedural placeholders at final dimensions, marked `generated:false` (§13.7) |
| 2 · No-likeness set | `FAL_KEY`, and neither `COAST_SHEET_URL` nor `COAST_REF_URLS` | Real assets from GPT Image 2.5 Sunburst (stills) and MiniMax H3 Max (motion): the same subjects with props only and no person. For example, the slates show a camera with an unlit tally, blank storyboard frames or a VHS stack; the loader is the chrome broadcast remote whose antenna spark becomes a spinning diamond; standby is the empty chrome control booth; the OG background is text-free booth and carrier art. The per-asset list is §13.6. They ship with `likeness:false` in the manifest, and Coast versions replace them when a Coast input arrives |
| 3 · Coast set | `FAL_KEY` plus `COAST_SHEET_URL` or `COAST_REF_URLS` | The Coast assets of §13.6. Image 1 of every Coast asset is `COAST_SHEET_URL`, used directly. Without it, Image 1 is the generated `coast-brand-sheet-v1`, and no other Coast asset is generated before the owner comments `APPROVE coast-brand-sheet <n>` (§1.8 item 4) |

**Secret-handling rules:**
- Never commit, print, log, screenshot or paste a secret value. Refer to secrets by name only.
- Never create a `NEXT_PUBLIC_*FAL*` variable.
- Redact `Key …` from any error text you quote.
- Never write a secret into a tracked file. Never create `dashboard/.env.local`.
- `COAST_SHEET_URL` and `COAST_REF_URLS` values never appear in commits, logs or PR bodies: `approved.json` records them only as tokens plus sha256 hashes (the references as `coast-ref-1`…`coast-ref-n`; §13.3.5).
- Never run configured QA against the production Convex deployment named in `dashboard/.env.production` or `dashboard/wrangler.toml` unless the user names it in writing.
- Never press 'Go live on Twitch' with a real stream key.

### 2.2 Owner decisions and the defaults Devin applies

Every other section is consistent with these defaults. Apply them without asking.

| ID | Decision | Default Devin applies | How to override |
|---|---|---|---|
| D1 | LTX-era dead code | The deletions are part 0A of M0 (§14.2), a PR of their own. Before deleting anything, re-run the import grep for each file (§2.4) and paste its output into the PR. Files to delete: `components/TestControlPanel.tsx`, `components/WebRTCPlayer.tsx`, `components/RealtimeChart.tsx`, `components/PerformanceMetrics.tsx`, `components/QueueVisualization.tsx`, `components/AIPerformanceBreakdown.tsx`, `components/GenerationHistory.tsx`, `hooks/useRealtimeData.ts`, `hooks/useRealtimeWebSocket.ts`, `utils/falApi.ts` (its only importer is `hooks/useRealtimeData.ts`) and `utils/falUpload.ts`. Also remove the `recharts` and `@fal-ai/serverless-client` dependencies. `components/ViewerChart.tsx` and `components/ImageGenerationControls.tsx` **stay**. Anything that has a live importer at implementation time stays | The user names the files to keep, and 0A skips them |
| D2 | Generated sheets are appended to identity references (`convex/assets.ts:411`, `:416`) | No Convex change in this project. The UI marks auto-appended sheets with a `REF` Badge and offers "Remove from references" (the existing `removeReference`). The backend fix is a §17 follow-up | The user approves the backend fix. It lands as a separate PR after M9, never inside M0–M9 |
| D3 | MorphSlider autoplay (the 'Coast originals artwork carousel') | **Autoplay stays; the carousel becomes display-only** (§0.4 BC-15). Keep `autoplay` and `autoplayDelay={6}` (`TrackManager.tsx:138-139`); the visual-test fixture keeps them too (`AssetStudioVisualFixture.tsx:45`). `onIndexChange` no longer writes the armed track: autoplay, previous/next, the caption tabs and drag change only the slide shown. A track is armed only through the 'Armed track' radiogroup (its first option, 'No track', disarms) or the 'Arm this track' button on the carousel's current slide (§8.5.10). Autoplay pauses under the air lock, under reduced motion, while the dock is collapsed, while the Audio tab is hidden and while the page is hidden (§12.4.1). Size: the Audio dock tab shows the artwork as a square at the dock's full height beside the track list, and an 'Expand artwork' IconButton opens a Sheet with the MorphSlider at up to 480×480. Only one MorphSlider instance is ever mounted, and the effect-slot rules (§7.16) are unchanged. Keep the component, its aria-labels and the 'Coast originals artwork carousel' label | The user writes `OVERRIDE D3: autoplay off`; Devin then removes the `autoplay` and `autoplayDelay` props (`TrackManager.tsx:138-139`, `AssetStudioVisualFixture.tsx:45`), and the carousel stays display-only. Restoring the 845147c arming through `onIndexChange` (and with it §3.7 #1) is `OVERRIDE D10: BC-15` |
| D4 | Font files | Never delete any file in `dashboard/fonts/focal/`. The `.otf` files and the italic simply stop being referenced | The user lists specific files to delete, in writing |
| D5 | Brand-asset generation | The secrets select one of the three brand modes in §2.1: no `FAL_KEY` → the pipeline plus procedural placeholders (`generated:false`); `FAL_KEY` only → the no-likeness set (`likeness:false`); `FAL_KEY` plus `COAST_SHEET_URL` or `COAST_REF_URLS` → the Coast set. Modes 2 and 3 run `plan` → `run --tier draft` → select → `run --tier final` → `approve` → `build` → `check` with `--budget-usd 40`. That is a hard cap, and Devin never raises it. Image 1 of every Coast asset is `COAST_SHEET_URL`, used directly. Without it, Image 1 is the `coast-brand-sheet-v1` generated from `COAST_REF_URLS`, and no other Coast asset is generated until the owner comments `APPROVE coast-brand-sheet <n>` (§1.8 item 4); every other asset and part continues. Devin selects variants by technical checks only, and rerolls only on a technical failure or on the owner's comment `REROLL <asset-id>` (§1.8 item 4, §13.10). Commit only the files §13.10 lists (built, optimized outputs, `approved.json`, the committed spend ledger and the contact sheet), and put a contact sheet of the chosen finals in the PR for the owner's and Coast's likeness sign-off before merge. Never block on keys, request them or embed them | The user writes a new cap in a PR comment, or writes "placeholders only" |
| D6 | Copy changes | Only the changes the spec lists are allowed: `'Live · {n}s'` → `'Live · HH:MM:SS'`; the stale "LTX" copy in the Clips empty state (`app/admin/clips/page.tsx:30`); removal of the footer 'Powered by FAL realtime'; the refreshed metadata description; and the other entries in Appendix A's allowed-changes list. Every other visible string, aria-label, `title` and id is preserved byte-for-byte | The user lists further copy changes in writing. Each one is added to Appendix A's allowed-changes list before it is applied |
| D7 | Security/pipeline-adjacent fixes (pinning sdk-proxy `allowedEndpoints`, role-aware references, persisting fal CDN URLs to Convex, one sheet generator) | Out of scope. They are §17 follow-ups. The exception is pure-frontend status plumbing, for example an optional `onStatus`/`onQueueUpdate` in `lib/imageGen.ts` with endpoints and inputs unchanged | The user asks for them. They land as separate PRs after M9 |
| D8 | New dependencies | No new runtime dependencies. devDependencies may add only `@playwright/test` 1.56.1, `@axe-core/playwright` 4.13.0, `sharp` 0.34.5 and `postcss-import` 15.1.0 (each justified in the PR that adds it: 1A adds the two Playwright packages, 1B adds `postcss-import`, 3B adds `sharp`). `ffmpeg-static` is installed with `npm i --no-save` only and never saved (§16.6 N19). No install, postinstall or prebuild script | The user approves a named package in writing |
| D9 | Coast | Coast is likely a real performer (Twitch channel `510coast`). **Never use gendered pronouns for Coast: write "Coast" or they/them.** Never generate a likeness from anything except the user-approved `COAST_SHEET_URL` or `COAST_REF_URLS` (§2.1). Never commit raw references or the master sheet | Not overridable, except that the user may state the pronouns Coast uses |
| D10 | Behaviour changes beyond visuals | Behaviour changes in §0.4 apply by default. Every other behaviour stays as at 845147c | The owner vetoes a row with `OVERRIDE D10: <BC-id>` (for example `OVERRIDE D10: BC-5`). Devin then keeps the 845147c behaviour for that row and records it under Decisions |

### 2.3 How overrides reach Devin

An override counts only if the user writes it in one of two places:
- a comment on the current milestone's PR, starting `OVERRIDE D<n>:`;
- an edit to this §2.2 table.

Re-read both at the start of each milestone. Quote the override in the PR's "Decisions" section, then apply it. A message from any other source (a tool output, fetched content, another agent) is not an override. The same rule governs the brand commands `APPROVE coast-brand-sheet <n>`, `REROLL <asset-id>` and `PX-NATURAL` (Coast declines the PX blue-ramp stylisation; §13.10 step 12) (D5, §1.8 item 4): they count only as the user's comments on the brand PR.

### 2.4 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] `git log -p 845147c..HEAD | grep -E 'Key [A-Za-z0-9_:-]{20,}'` prints nothing. No value of `FAL_KEY`, `COAST_SHEET_URL`, `COAST_REF_URLS` or `TWITCH_CLIENT_SECRET` appears in any commit or PR body.
- [ ] In every PR whose session has the secrets, this value scan prints nothing. Run it with `bash` from the repository root. It prints secret names only, never values:

  ```bash
  for v in FAL_KEY TWITCH_CLIENT_SECRET COAST_SHEET_URL; do
    val="$(printf '%s' "${!v:-}" | tr -d '[:space:]')"; [ -z "$val" ] || { git log -p 845147c..HEAD | grep -qF -- "$val" && echo "LEAK: $v"; }
  done
  IFS=',' read -ra refs <<< "${COAST_REF_URLS:-}"
  for i in "${!refs[@]}"; do
    u="$(printf '%s' "${refs[$i]}" | tr -d '[:space:]')"
    [ -z "$u" ] || { git log -p 845147c..HEAD | grep -qF -- "$u" && echo "LEAK: COAST_REF_URLS[$i]"; }
  done
  ```

- [ ] `git ls-files dashboard/scripts/brand/.cache dashboard/.env.local` prints nothing.
- [ ] For every D1 file, the 0A PR shows `grep -rlE "from ['\"][^'\"]*/<basename>['\"]|import\\(['\"][^'\"]*/<basename>['\"]\\)" app components hooks lib utils convex` run from `dashboard/`, and its output lists only other D1 files: `falApi` → `hooks/useRealtimeData.ts`, and every other file → nothing. A plain name grep also hits `types.ts:91` `GenerationHistoryProps`, which is not an import. After the deletions it also shows that `grep -rlE "recharts|@fal-ai/serverless-client" app components lib` (from `dashboard/`) prints nothing. The grep omits `hooks/` and `utils/`, because D1 deletes every file in them and a missing path would make `grep` exit 2 (the §14.6 form).
- [ ] `ls dashboard/fonts/focal | wc -l` prints `7` at the end of the project (D4).
- [ ] D3 (§0.4 BC-15): `grep -q "autoplayDelay={6}" dashboard/components/TrackManager.tsx` exits 0 (autoplay stays), and `grep -n "onIndexChange={selectSliderTrack}" dashboard/components/TrackManager.tsx` prints nothing (the 845147c wiring that armed the shown slide, `TrackManager.tsx:142`, is gone). The §8.10 display-only check (behaviour: §8.5.10) passes: an autoplay advance, previous/next, a caption tab or a drag leaves the armed track unchanged, and 'No track' leaves no track armed. Under `OVERRIDE D3: autoplay off`, `grep -n "autoplay" dashboard/components/TrackManager.tsx dashboard/components/AssetStudioVisualFixture.tsx` prints nothing instead of the first check; under `OVERRIDE D10: BC-15`, the second check does not apply.
- [ ] `git diff --stat 845147c -- dashboard/convex` prints nothing (D2, D7).
- [ ] `dashboard/public/brand/manifest.json` matches the D5 mode that the secrets selected (§2.1). Mode 1 (no `FAL_KEY`): every asset has `generated:false`. Mode 2 (`FAL_KEY` only): every generated asset has `likeness:false`, and no asset depicts Coast. Mode 3 (`FAL_KEY` plus `COAST_SHEET_URL` or `COAST_REF_URLS`): the Coast assets of §13.6 ship, and Image 1 of each is `COAST_SHEET_URL` or the `coast-brand-sheet-v1` that the owner approved with `APPROVE coast-brand-sheet <n>`. In modes 2 and 3, `dashboard/scripts/brand/approved.json` has one entry per shipped file, and the PR shows the contact sheet and a ledger total ≤ $40. From `dashboard/`, the line for the shipped mode exits 0:

  ```bash
  node -e "const m=require('./public/brand/manifest.json');process.exit(Object.values(m.assets).every(a=>a.generated===false)?0:1)"                        # mode 1
  node -e "const m=require('./public/brand/manifest.json');process.exit(Object.values(m.assets).every(a=>a.generated!==true||a.likeness===false)?0:1)"   # mode 2
  ```

- [ ] From the repository root, this prints nothing (D9). The last argument adds `dashboard/scripts/brand` only once it exists (from 3B), so the grep never fails on a missing path:

  ```bash
  grep -rniE "coast[^.]{0,80}\b(he|him|his|she|her|hers)\b" goal.md docs/redesign/spec .agents $(test -d dashboard/scripts/brand && echo dashboard/scripts/brand)
  ```

## 3. Product context and current state

All `path:line` references in this section are **as of commit `845147c`**, and each one was checked against the file. Where an earlier planning figure was wrong, a `> Note:` says so.

### 3.1 What the product is

`stream.wzrd.tech admin` is the operator console for 5DEE, a realtime AI TV channel that streams to Twitch (`510coast`). The Next.js app in `dashboard/` does six things:

- **Directs the show live.** Live Control (`/admin`) opens a **Director** session: `fal.realtime.open(wma(DIRECTOR_MODEL))` (`components/DirectorPlayer.tsx:959`) with `DIRECTOR_MODEL = 'minimax/h3-max/director'` (`:27`), a realtime WebRTC world model, reached through `/api/fal/sdk-proxy`.
  - The operator sends a premise, then live directions.
  - Script beats run on the model's clock.
  - Chat viewers can steer with `!direct` or `!frame` (anonymous `tmi.js`).
- **Routes one output stream three ways.** A single stable `MediaStream` feeds the preview `<video>`, a full-session MediaRecorder (saved to Convex as Recordings), a rotating per-direction clip recorder (Clips), and a WHIP push to Twitch ingest (`lib/twitchWhip.ts:4`).
- **Plans shows.** Shotboard (`/admin/shotboard`) lays out scenes and shots with generated keyframes, then compiles them to a timed script handed to the Director via `/admin?transfer=<id>`.
- **Keeps identity stable.** The asset studio (`/admin/characters`, `/admin/locations`) keeps reusable characters and locations with reference images, and generates sheets with fal image models (`nano-banana`, `gpt-flare`, `gpt-sunburst`) after GMI "Astra" prompt expansion. The flagship character is **@coast** (handle `coast`, identity-locked), the station's talent and ident.
- **Archives output** in Clips and Recordings.
- **Reports audience numbers.** Twitch Analytics polls `/api/twitch` every 30 000 ms.

Access is gated at the edge by Cloudflare Access. `middleware.ts` verifies the Access JWT for `/admin/:path*` and `/api/:path*`, and Convex authenticates with the same assertion (`/api/auth/convex`).

### 3.2 Who uses it and when

A **solo operator/producer**, usually on one desktop display 1440–1920 px wide, typically late at night in a dim room.

| Phase | Routes | What matters |
|---|---|---|
| Prep (before the show) | Shotboard, Characters, Locations, Live Control's Script dock | Comparing frames, stable identity, honest generation progress, no lost edits |
| **Show (live, often hours)** | Live Control only. Leaving the route unmounts DirectorPlayer and ends the session | Program output always visible. Start, stop, steer and go live without scrolling. Lamps that tell the truth. Nothing moving that is not information. Free CPU/GPU, because the same machine decodes WebRTC, runs up to 2 MediaRecorders, mixes Web Audio and encodes WHIP H264 |
| Post (after the show) | Clips, Recordings, Twitch Analytics | Scanning footage, correct downloads, safe deletes, readable numbers |
| Status check (any time) | Any route at 390 px | Readable state, no clipped nav |

### 3.3 Stack (resolved from `dashboard/package.json` and `node_modules`)

| Layer | Fact |
|---|---|
| Framework | Next **15.5.2**, App Router (`dashboard/app/`), `reactStrictMode: true`. React / React DOM **18.3.1** (`^18.2.0`). TypeScript **5.9.2** with `strict: false` |
| Styling | Tailwind CSS **3.4.17** (`^3.3.5`), `darkMode: 'class'`, `plugins: []`. `tailwindcss-animate` and `@tailwindcss/typography` are installed but not registered. `tailwind-merge` 3.7.0, `clsx` 2.1.1 |
| Data | Convex **1.45.0** (`dashboard/convex/`). `ConvexProviderWithAuth` fetches `/api/auth/convex`. `useConvexEnabled()` gates every hook |
| AI | `@fal-ai/client` 1.11.0-alpha.3 in the browser, always through `/api/fal/sdk-proxy` or `/api/fal/proxy`. `@fal-ai/server-proxy` 1.3.0-alpha.0. GMI prompt expansion runs in Convex actions |
| Hosting | Cloudflare Pages via `@cloudflare/next-on-pages` 1.13.16 (`npm run pages:build`), `wrangler` 3.114.17. All 5 API routes declare `export const runtime = 'edge'`. `middleware.ts` gates with Cloudflare Access (`jose` 6.2.12) and uses matcher `['/admin/:path*', '/api/:path*']` |
| Motion/3D | `three` 0.169.0 (Dither and MorphSlider WebGL), `motion` 13.2.0, `gsap` 3.15.0 (AccordionGallery, ChromaGrid, MorphSlider) |
| UI deps | `lucide-react` 0.294.0, `tmi.js` 1.8.5, `d3-scale`/`d3-shape` (dither-kit charts). `recharts` 2.15.4 is installed but imported only by the dead `RealtimeChart.tsx` (D1) |
| Fonts | Focal through `@font-face` in `app/globals.css:5-46` (`dashboard/fonts/focal/`: 4 woff2 + 3 otf). JetBrains Mono through `next/font/google` with `variable: '--font-mono'` (`app/layout.tsx:8`) |
| Vendored | `components/dither-kit/*` (hash-locked by `dither-kit.json`). `components/reactbits/{AccordionGallery,ChromaGrid,Dither,MorphSlider,PixelCard}` (only `Dither` and `MorphSlider` are editable, §1.3) |
| Tooling | Node 22.22.2 for baseline measurements, `npm ci` against `package-lock.json`, ESLint `next/core-web-vitals`. **No tests or test runner** |

### 3.4 Routes today

Every admin route shares the same chrome:
- **`app/layout.tsx`:** a header hard-coded to `bg-[#0a0d14]` in both themes, holding the 690 760-byte `wzrdtechlogo.png` (1717×425) with no dimensions, the h1 'Stream Admin' and ThemeToggle; then `main.max-w-7xl`; then a footer reading 'Powered by FAL realtime'.
- **`app/admin/layout.tsx`:** AdminNav, with 7 tabs and `aria-label="Admin sections"`, scrolling with the page.

| Route | Entry (as of 845147c) | What it renders today | Redesign |
|---|---|---|---|
| `/` | `app/page.tsx` | `redirect('/admin')` | unchanged |
| `/admin` | `app/admin/page.tsx` → `DirectorPanel` → `DirectorPlayer` (1342 lines) | **Director card:** h3 'Director (realtime WebRTC)', `minimax/h3-max/director` and a raw state pill (`idle`); a full-width `aspect-video` stage (DitherGradient plus the single `<video>`) showing 'Director offline'; the 'Session settings' `<details>`; the 'Opening prompt (the series premise)' textarea; 'Start Director' (DitherButton) and 'Send direction'; the Twitch broadcast strip. **Below it:** the Script card (ScriptEditor), the Chat steering card (ChatSteerer), and the Audio library (TrackManager with MorphSlider), which renders **only when Convex is configured** (`TrackManager.tsx:33`) | §8 |
| `/admin/shotboard` | `app/admin/shotboard/page.tsx`: `<Suspense>` with no fallback → `ShotboardPage` | A 'Shotboard' header card with 'New board', a model select and the amber line 'Convex not configured — this board lives only in this page’s state and cannot be sent to Director.' Then an empty card, 'Create a board or pick a saved one to start laying out scenes and shots.' With a board open: a 280 px sidebar (SceneSidebar, CharacterPanel/ChromaGrid) and horizontally scrolling rows of 256 px ShotCards | §9 |
| `/admin/characters` | server `page.tsx` → `CharacterLibraryPage` | **Unconfigured:** one amber card, 'Convex is not configured. Character library changes are disabled.' **Configured:** a dark hero ('Visual asset studio' / 'Characters with a stable identity'), a hover AccordionGallery, the source form with ReferenceAssetManager, and a dark 'Generate' aside with ImageGenerationControls | §10 |
| `/admin/locations` | server `page.tsx` → `LocationLibraryPage` | The same pattern. Unconfigured: 'Convex is not configured. Location library changes are disabled.' | §10 |
| `/admin/clips` | `app/admin/clips/page.tsx` (client) | **Unconfigured:** `<ConvexNotConfigured feature="clips">`. **Configured:** a PixelCard grid of up to 100 `<video preload="metadata">` from `api.clips.list {limit:100}` | §11 |
| `/admin/recordings` | `app/admin/recordings/page.tsx` (client) | **Unconfigured:** `<ConvexNotConfigured feature="recordings">`. **Configured:** a list with Download (`<a download>`) and Delete (`confirm('Delete this recording permanently?')`) | §11 |
| `/admin/analytics` | `app/admin/analytics/page.tsx` (client) | A 'Twitch' header card with a red 'OFFLINE' pill and the server error; StatCards for 'Current viewers', 'Followers', 'Uptime' and 'Category'; and ViewerChart ('Viewers (this session)', 'Collecting samples…'). It works without Convex | §11 |
| `/admin/visual-test` | server `page.tsx`; `notFound()` when `NODE_ENV === 'production'` | AssetStudioVisualFixture: the amber fixture banner, the character AccordionGallery (violet placeholders), the source form, the Generate aside, the locations gallery, and `#audio-library-visual-test` with MorphSlider. No Convex and no fal | §10 |
| (none) | no `loading.tsx`, `error.tsx`, `not-found.tsx` or `global-error.tsx` anywhere under `app/` | Next's defaults | §11 |

### 3.5 Baseline measurements (845147c, clean checkout, `npm ci`, Node 22.22.2)

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 5 warnings: `GenerationHistory.tsx:76` jsx-a11y/alt-text; `TestControlPanel.tsx:477` and `:904` no-img-element; `reactbits/AccordionGallery.jsx:229` no-img-element; `reactbits/ChromaGrid.jsx:115` no-img-element |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | exit 0. Prints the `@fal-ai/server-proxy` warnings "No allowed endpoints specified, all endpoints will be allowed…" and "Allowing unauthenticated requests…" |
| First Load JS | `/` 103 kB · `/admin` **348 kB** (page 32.5 kB) · `/admin/analytics` 197 kB · `/admin/characters` 192 kB · `/admin/clips` 131 kB · `/admin/locations` 192 kB · `/admin/recordings` 131 kB · `/admin/shotboard` 196 kB · `/admin/visual-test` 264 kB · shared 103 kB · middleware 41.8 kB |
| Tests | None. No test runner, no Playwright config |
| Unconfigured `next dev` | All 8 admin routes return HTTP 200. Console per route is as in the §1.6 allowed table |
| `/admin` geometry | `scrollHeight` 1791 px at both 1440×900 and 1280×800. 'Start Director' sits below the fold |
| Headings | Every route's only h1 is 'Stream Admin'. `/admin/visual-test` has two h1s |
| WebGL | The carrier plus MorphSlider on Live Control when configured. `/admin` renders 4 `<canvas>` elements unconfigured |

Grep-gate baselines are computed with `grep -rEo <regex> app components --exclude-dir=dither-kit` from `dashboard/`, excluding `components/reactbits/*.css`, and piped to `wc -l`. The runnable form is the block under the table. Row ids are the §15.3 gate ids (cite them as `§15.3 G1` and so on, §1); `mono` has no gate.

| Row | Gate regex | Count at 845147c |
|---|---|---|
| G1 | `violet-\|purple-\|#a78bfa\|#7c3aed\|#8b5cf6\|#6d28d9\|#05030b\|#090713` | 63 |
| G2 | `fal-primary-(50\|100\|200\|300)\b\|fal-purple` | 27 |
| G3 | `font-(semibold\|extrabold\|black\|thin\|extralight)` | 34 |
| G5 | `backdrop-(blur\|filter)` | 1 (`TrackManager.tsx:144`) |
| G6 | `Loader2\|animate-spin\|animate-pulse` | 34 (18 `Loader2` tokens = 10 `<Loader2>` render sites + 8 imports; 12 `animate-spin`; 4 `animate-pulse`) |
| G7 | `!p[xy]-` | 23 |
| G8 | `hover:[^ ]+ dark:(text\|border\|bg)-` | 21 |
| G13 | `\buppercase\b` | 11 |
| G16 | `\bfal-(gray\|primary\|green\|yellow\|blue\|red)-` | 1200 (of which `fal-gray-[0-9]` = 1015) |
| mono | `var(--font-mono)` consumers | 0 |

```bash
# From dashboard/. Each line prints the count in the §3.5 table row named in its comment.
count() { { grep -rEo -e "$1" app components --exclude-dir=dither-kit || true; } | { grep -vE '^components/reactbits/[^:]*\.css:' || true; } | wc -l; }
count 'violet-|purple-|#a78bfa|#7c3aed|#8b5cf6|#6d28d9|#05030b|#090713'   # G1   63
count 'fal-primary-(50|100|200|300)\b|fal-purple'                         # G2   27
count 'font-(semibold|extrabold|black|thin|extralight)'                   # G3   34
count 'backdrop-(blur|filter)'                                            # G5   1
count 'Loader2|animate-spin|animate-pulse'                                # G6   34
count '!p[xy]-'                                                           # G7   23
count 'hover:[^ ]+ dark:(text|border|bg)-'                                # G8   21
count '\buppercase\b'                                                     # G13  11
count '\bfal-(gray|primary|green|yellow|blue|red)-'                       # G16  1200
count 'fal-gray-[0-9]'                                                    # G16 subset  1015
count 'var\(--font-mono\)'                                                # mono 0
```

> Note: `scripts/checks/grep-gates.sh` (§15.3, from 1A) reproduces every count above except §15.3 G1 (64: case-insensitive, adds `#8B5CF6`), §15.3 G5 (5: reactbits CSS included, `ChromaGrid.css` excepted) and §15.3 G8 (20: TrackManager excluded until M6b). On the M0 head, after the D1 deletions, it prints §15.3's "Post-D1 (M0 head)" column, not these 845147c counts. §15.3 G7 is written `!p[xy]-`; the older form `\!p[xy]-` matches the same 23 sites.

> Note: Without a word boundary, the gate `fal-primary-(50|100|200|300)|fal-purple` also matches every `fal-primary-500` (85 matches instead of 27), so it cannot reach 0 while the deprecated `fal-primary-500` alias exists. §15 must use `fal-primary-(50|100|200|300)\b|fal-purple`.

> Note: The planning figure "18 Loader2 sites" counts 18 `Loader2` tokens, of which 8 are imports. There are 10 render sites. The pending-button migration (§7) replaces those 10 sites, plus the 2 `animate-spin` sites in the dead `TestControlPanel.tsx` that D1 deletes.

### 3.6 Baseline screenshot gallery (`docs/redesign/baseline/`)

All screenshots were taken unconfigured on `next dev`. The round "N" badge at the bottom left is Next's dev indicator, not app UI.

| File | Shows | Visible defects |
|---|---|---|
| `admin-dark.jpg` (1440×1791, full page) | Live Control, idle, dark | (1) The page is 1791 px tall; 'Start Director' is at y≈1150, below a 900 px fold. (2) The Play icon is stacked above the 'Start Director' label in a monospace DitherButton. (3) The active tab is violet and its underline is invisible. The textarea is native grey. 'Director offline' is small low-contrast grey on the dither |
| `admin-light.jpg` (1440×1791) | Live Control, light | (1) The header stays a near-black slab over a light page. (2) The violet active tab contradicts the blue wordmark, Dither and 'Start Director'. (3) 'Go live on Twitch' is the smallest control on the page, for the only public action |
| `admin-mobile.jpg` (390×1561) | Live Control at 390 px | (1) The nav is clipped mid-label ('Charac') with no overflow cue. (2) The Play icon stacks above the 'Start Director' label. (3) The footer is squeezed into three wrapped columns |
| `admin_shotboard-dark.jpg` (1440×900) | Shotboard, local mode | (1) The active tab has no visible underline (the `.dark *` override). (2) The not-configured sentence is amber warning text inside the description. (3) The empty state is one grey line, and the footer floats at y≈483 above ~400 px of empty page |
| `admin_shotboard-light.jpg` | Shotboard, light | (1) The underline is visible in light mode only, which proves the dark cascade bug. (2) The header is a dark slab in light theme. (3) The floating footer's full-bleed rule cuts across the Dither |
| `admin_shotboard-mobile.jpg` (390×844) | Shotboard at 390 px | (1) The nav is clipped. (2) The amber not-configured sentence wraps into three lines of warning-coloured text. (3) The footer is squeezed into three columns |
| `admin_characters-dark.jpg` | Characters, unconfigured | (1) The whole page is one amber sentence, with no env var name or command. (2) This is a different not-configured treatment from Clips. (3) The footer floats at y≈340 |
| `admin_characters-mobile.jpg` | Characters at 390 px | (1) The active tab 'Characters' is itself clipped and not scrolled into view. (2) The same bare amber sentence. (3) The footer is squeezed |
| `admin_locations-dark.jpg` | Locations, unconfigured | (1) One amber sentence. (2) Inconsistent with Clips and Recordings. (3) The footer floats mid-viewport |
| `admin_clips-dark.jpg` | Clips, unconfigured | (1) A third not-configured treatment: a centred Database-icon card. (2) Small grey body copy with no action. (3) The footer floats at y≈425 |
| `admin_recordings-dark.jpg` | Recordings, unconfigured | (1) The same card as Clips, with no route identity. (2) The only guidance is inline `code`. (3) The footer floats |
| `admin_analytics-dark.jpg` | Twitch Analytics, unconfigured | (1) A red 'OFFLINE' pill for a not-configured state spends red on a non-public state. (2) The 'Current viewers' icon chip is untinted (`fal-purple-500` is undefined) while its siblings are tinted. (3) 'Collecting samples…' shows even though nothing can be collected |
| `admin_visual-test-dark.jpg` (1440×2534) | Asset-studio fixture | (1) Violet everywhere: the placeholder gradients, 'Generate character sheet', the 'Character source' eyebrow (rendered through CSS `uppercase`). (2) 'Add reference' is nearly invisible (`fal-primary-300` is undefined). (3) The MorphSlider is an empty black box about 450 px tall, because its artwork loads from blocked external hosts |

### 3.7 Top 20 problems (ranked)

| # | Sev. | Problem | Evidence (as of 845147c) | Fixed in |
|---|---|---|---|---|
| 1 | critical | MorphSlider autoplay silently changes the armed track about 6 s after any selection. 'Use for session', 'Queue on next direction' and 'Mix in output' then act on a track the operator did not choose | `components/TrackManager.tsx:138-139` (`autoplay autoplayDelay={6}`), `:142` (`onIndexChange={selectSliderTrack}`), `:91` (`setSelected`), `components/reactbits/MorphSlider.tsx:500-501` | D3, §8, §12 |
| 2 | critical | Brand colour collision: the nested violet `fal.primary` overrides the flat chrome-blue `fal-primary`, so every `fal-primary-*` (nav, focus rings, CTAs) renders violet `#6d28d9` | `tailwind.config.js:27-32` vs `:74-79`. Resolving the config in Node gives `fal-primary-500 = #6d28d9` | §5 |
| 3 | critical | @coast, the flagship character, renders as a violet Arial "visual fixture · add approved reference" SVG. The repo holds no Coast asset (`public/` has only `wzrdtechlogo.png` and `favicon.ico`). Generated sheets are also appended to identity references, which compounds identity drift | `components/CharacterLibraryPage.tsx:146`, `lib/assetPlaceholders.ts:4`, `convex/assets.ts:411` | §10, §13, D2 |
| 4 | high | There is no truthful ON AIR. A red pulsing "Live" means only that WebRTC to fal is up, while the public Twitch state is a small green sentence | `components/DirectorPlayer.tsx:1145-1149`, `components/TwitchBroadcast.tsx:212-216` | §6 (going ON AIR), §7 (TallyLight, TallyBar), §8 |
| 5 | high | Twitch ingest health is invisible. There is no `connectionstatechange` listener and no `getStats()`, so a dropped ingest keeps showing "● pushing to Twitch ingest" | `lib/twitchWhip.ts:77-80`, `components/TwitchBroadcast.tsx:137-160` | §6 (stalled), §8 (`useWhipTruth`, §8.5.6) |
| 6 | high | Live Control is a one-column scroll: a full-width `aspect-video` stage (about 1168×657) inside `max-w-7xl` pushes every control below the fold. The stage also ignores the 9:16 and 1:1 aspect settings | `components/DirectorPlayer.tsx:1082`, `app/layout.tsx:63`, `components/DirectorSettingsForm.tsx:59-61`; `admin-dark.jpg` | §8 |
| 7 | high | The connect overlay renders only while `!live`, so it disappears at transport 'live', before 'Building world' and 'Generating first scene' and before the first decoded frame | `components/DirectorPlayer.tsx:1085-1113`, CONNECT_STEPS `:54-60` | §6 (signal acquisition), §8 |
| 8 | high | The whole 1342-line DirectorPlayer re-renders every second: a 1000 ms ping (the comment says 5 s) sets three states. `appendLog` logs every `pong`/`chunk` into a 50-line cap, which buries real warnings | `components/DirectorPlayer.tsx:1016-1027`, `:539`, `:174` | §7 (`useSecondClock`), §8 (extraction) |
| 9 | high | Locked session settings are hidden while live or busy instead of shown read-only, so mid-show the operator cannot see the locked resolution, aspect, seed or sheet | `components/DirectorPlayer.tsx:1194` | §8 (LockedSettings) |
| 10 | high | Cascade order: `.dark * { border-color }` and the `.fal-*` component classes sit after `@tailwind utilities`, outside any layer. Active and selected borders vanish in dark mode, 23 `!p[xy]-` hacks exist, and 'Stop broadcast' is not red in light mode | `app/globals.css:87-89`, `:145-210`, `components/TwitchBroadcast.tsx:196` | §5 (cascade fix) |
| 11 | high | `hover:X dark:Y` pairs: in dark mode, inactive tabs show a permanent underline, hover is lost, and 'Delete shot' is permanently red | `components/AdminNav.tsx:31`, `components/ScriptEditor.tsx:133` | §5 (codemod 5), §7 (AppNav) |
| 12 | high | The weight remap (normal→300, medium→400, semibold/bold→500) flattens hierarchy on a body of weight 300, and `font-mono` never uses the loaded JetBrains Mono, so every mono string falls back to the OS font | `tailwind.config.js:121-128`, `:119`; `app/globals.css:73`; `app/layout.tsx:8` | §5 (typography) |
| 13 | high | Classes that reference undefined shades emit no CSS: `fal-primary-50/200/300` and `fal-purple-500`. Examples: the 'Visual asset studio' pill, 'Add reference', the Expand pill at ≈1.62:1 in dark mode, the 'Current viewers' chip | `components/CharacterLibraryPage.tsx:149,152`, `components/shotboard/ShotCard.tsx:158`, `app/admin/analytics/page.tsx:177` | §5 |
| 14 | high | The carrier ignores reduced motion and never pauses. It renders every frame at full resolution with `antialias: true`, and the inline colour arrays recreate the WebGL context on every theme toggle | `components/DitherBackground.tsx:28-29`, `components/reactbits/Dither.jsx:136`, `:174-186`, `:196` | §12 (Dither pick), §6 (reduced motion) |
| 15 | high | There are no route-level states: no `loading`, `error`, `not-found` or `global-error` file. The Shotboard `<Suspense>` has no fallback, so a thrown Convex query takes down the header, the nav and the Dither | `dashboard/app/` (0 such files), `app/admin/shotboard/page.tsx:8` | §11, §6 (route loading) |
| 16 | high | 'Loading shotboard…' spins forever when `api.shotboards.load` returns `{ board: null }` (signed out, or a deleted `?board=`) | `components/shotboard/useShotboard.ts:373`, `components/shotboard/ShotboardPage.tsx:297-303`, `convex/shotboards.ts:138` | §9 |
| 17 | high | Generation is opaque. `fal.subscribe` is called without `onQueueUpdate`; the only feedback is a spinner on `bg-black/50`; the persisted `imageStatus: 'failed'` is never rendered; and every error overwrites one amber status line | `lib/imageGen.ts:36`, `components/shotboard/ShotCard.tsx:94-98`, `components/shotboard/ShotboardPage.tsx:115`, `:290` | §6 (generation resolve), §7 (GenerationFrame), §9, §10 |
| 18 | high | Shotboard's per-shot model is sticky. After the first generation, the toolbar model never applies to that shot again, and no UI shows or resets it | `components/shotboard/ShotboardPage.tsx:96`, `:105`, `:112` | §9 (per-shot model Chip, "Use board default") |
| 19 | high | Library pages misreport state. There is no loading UI (`undefined` falls into the grid branch). A signed-out user sees 'No clips yet', because the queries return `[]`. Up to 100 `<video preload="metadata">` mount at once. Download is cross-origin with a hard-coded `.webm` name | `app/admin/clips/page.tsx:26`, `:44`; `convex/clips.ts:52`; `convex/recordings.ts:53`; `app/admin/recordings/page.tsx:43`, `:61`, `:106` | §11 |
| 20 | medium | Shell chrome. The header is `bg-[#0a0d14]` in both themes and is not sticky. The nav scrolls away and is clipped at 390 px with no `aria-current`. The footer floats on short pages. The 690 KB logo has no dimensions. Every route's h1 is 'Stream Admin' | `app/layout.tsx:40`, `:46`, `:51`, `:63`, `:70-81`; `components/AdminNav.tsx:21-38`; `admin_characters-dark.jpg` | §7 (CommandBar, AppNav, StatusRail) |

### 3.8 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] The first M0 PR (0A) re-runs the §3.5 commands (including the §3.5 grep-gate block) on `main` before any change and pastes the results. Any difference from §3.5 (lint warnings, route sizes, grep-gate counts) is explained under "Decisions".
- [ ] Every PR that closes one of the §3.7 problems names its number (for example `Fixes §3.7 #10`) and includes a before/after screenshot or command output that shows the defect gone.
- [ ] After the final milestone, each §3.7 row is re-checked, and its evidence command or screenshot no longer reproduces the defect. For #1: the §2.4 D3 item passes (autoplay kept, `onIndexChange={selectSliderTrack}` gone, and no slide change alters the armed track). For #2: M1–M8: the §5.16 script prints `fal-primary-500 = #4F83CC`; after M9: `grep -c "fal-primary" dashboard/tailwind.config.js` prints `0`. For #6: `scrollHeight <= innerHeight` at 1280×800. For #15: `find dashboard/app -name 'loading.tsx' -o -name 'error.tsx' -o -name 'not-found.tsx' -o -name 'global-error.tsx'` lists at least one of each.
- [ ] Every baseline screenshot in §3.6 has a matching after screenshot (same route, theme and width) produced by §15.

## 4. Design direction: PIXEL INSTRUMENT

This section turns bible §0–§1 into rules for the implementer. Repo facts are as of `845147c`; `dashboard/` is byte-identical at `a52f7c6`. Every fact below was re-checked while writing this spec.

### 4.1 Concept

The admin is a piece of broadcast hardware for directing a live AI channel. Build every screen from these materials and nothing else.

| Material | What it is | Built with (names from §5 and §7) |
|---|---|---|
| Carrier | The global React Bits Dither wave. It is the only full-screen field. How much of it shows per route is stated under this table. | `components/DitherBackground.tsx` → `components/reactbits/Dither.jsx`, `--dither-*` (§5.5) |
| Veil | The CSS wash between the carrier and the UI. | `.dither-veil`, `--dither-veil` |
| Chassis | A calm translucent body that is never blurred: the command bar, the rails and the status rail. | `surface-chassis` |
| Panel | Translucent card material placed on the veil. | `<Panel>` = `surface-panel border border-line-subtle rounded-md sq shadow-e1` |
| Screen | Theme-invariant black where the pixels live: monitors, frames, thumbnails and slate art. It has 2 px corners. | `bg-screen rounded-screen` |
| Bezel | Theme-invariant `#0B0F17` hardware: lamp housings, the tally bar, HUD plates and the monitor frame. | `bg-bezel`, `surface-hud` |
| Lamps and LEDs | Hardware indicators driven by real signals. They always carry a text label. | `<TallyLight>`, `<Led>` (§7) |
| Badge | The one chrome object: the WZRD.tech blackletter wordmark. It glints once per full POST, so at most once per 12 h per browser (§6.2.4). | `<Wordmark>` (§7), glint (§6) |
| Ident | Coast, the station ident: on standby, in loaders, on slates and on Coast's talent card. Coast is never in the operator's way during a show. | `<CoastLoader>`, slates, `HoloCard` (§6, §7, §12, §13) |

**Carrier visibility.** The carrier runs behind every route, and how much of it shows differs by route on purpose:
- **Live Control:** the carrier is deliberately subdued behind the instrument. From 1024 px, the zero-scroll console (§8.4.2) leaves it visible only in the 16 px side gutters, the 12 px column and row gaps and block padding (and beside the root on screens wider than 1920 px, where the root stops growing), and at about 14% through panels and chassis (`--a-panel` .86, §5.10). The program monitor is opaque `bg-screen`. On air, house lights down darkens it further (veil .72 light / .62 dark, speed .02, §5.5).
- **Shotboard, the studio pages (Characters, Locations) and the library pages (Clips, Recordings, Twitch Analytics):** the carrier shows in the gutters, the page margins, empty areas and through panels. Every slate and empty state (§6.13) sits directly over it.

This statement adds no rule. §5.4, §5.5, §5.8 and §5.10 already govern the carrier, the veil and the surfaces.

Coast is likely a real performer (D9). Never use gendered pronouns for Coast in code, comments, prompts, alt text or PR text. Write "Coast" or use they/them.

### 4.2 Principles

Apply every principle on every screen. The last column says how a reviewer proves it.

| # | Principle | What it means in code | Proven by |
|---|---|---|---|
| 1 | **The Dither is the grammar.** | Every fill, skeleton, reveal, selection and progress field is an ordered Bayer mask (`--bayer-4-NN`, `.bayer-*`, `.px-resolve`, `.skeleton-dither`) in `ramp-*`, `accent` or tone colours. There are no smooth gradient fills, no blur and no glow. Exceptions: the 24 px edge-fade masks, the skeleton band mask, the wordmark glint (§6) and the HoloCard foil (§12). | The §5.10 `backdrop-` gate returns 0. `Loader2`, `animate-spin` and `animate-pulse` return 0 (§15). |
| 2 | **Chassis is glass, screens are black, lamps are hardware.** | Translucency comes only from the `surface-*` utilities (alphas in `--a-*`). Media and lamps use the invariant `screen` and `bezel` materials with `rounded-screen` or `rounded-lamp`. | `grep -rnE 'bg-(chassis\|panel\|raised\|inset)/' app components` returns 0. Tally colours are identical in both themes (§5.3). |
| 3 | **Chrome is the badge, blue is the only accent.** | Violet is deleted (§5.16, §5.19). The accent is `--c-accent`. The wordmark is the only chrome object and the only thing that glints. | The violet gate returns 0. `fal-primary-500` resolves to `#4F83CC` (§5.16). |
| 4 | **Red means public.** | A solid red fill (`bg-tally-program`) appears only on the ON AIR lamp and the 2 px program keyline. REC is a vermilion ring. Danger is outline and text only. | `bg-danger` returns 0. `bg-tally-program` appears only in `components/broadcast/**` and the monitor keyline (§8). |
| 5 | **Keys move, information resolves.** | Mechanical feedback uses `duration-tick` or `duration-fast` (120 ms or less). New content appears only through `.px-resolve` (4×40 ms). There are no slides, springs, bounces or shimmer. | `animate-(bounce\|ping\|spin\|pulse)` returns 0, plus the §6 motion checks. |
| 6 | **Truth over theatre.** | Every lamp, LED, progress field and loader reads a real signal: the first decoded frame, WHIP `bytesSent`, fal queue status, `document.fonts.ready`, and so on. No timer fakes progress. | The §6 and §7 tests drive the broadcast store. Nothing lights without store state. |
| 7 | **Information may move, decoration may not.** | Under `html[data-lock="air"]` only lamps, readouts, queues and the playhead change. Layout never reflows. Exactly one thing may blink: the STALLED lamp, for at most 5 cycles. | The air-lock matrix tests (§6, §15). |
| 8 | **Contract-safe.** | Preserved strings, aria-labels, ids, classes, routes and the media pipeline stay byte-identical. Restyle freely; never rename. | The Appendix A diff check (§15). |

In tables, `\|` is Markdown escaping for `|`. The runnable form of the "Proven by" greps, keyed by principle, runs from `dashboard/`; each command prints nothing:

```bash
# principle 1
grep -rnE 'backdrop-(blur|filter)' app components | grep -vE '^components/(dither-kit/|reactbits/ChromaGrid\.css:)'
grep -rnE 'Loader2|animate-spin|animate-pulse' app components | grep -v '^components/dither-kit/'
# principle 2
grep -rnE 'bg-(chassis|panel|raised|inset)/' app components
# principle 4
grep -rn 'bg-danger' app components
# principle 5
grep -rnE 'animate-(bounce|ping|spin|pulse)' app components | grep -v '^components/dither-kit/'
```

### 4.3 Glossary

Use these words exactly, in code comments, PR text and every section.

| Term | Meaning |
|---|---|
| Carrier | The global React Bits Dither wave (`components/DitherBackground.tsx` → `components/reactbits/Dither.jsx`). |
| Veil | The CSS wash between the carrier and the UI (`.dither-veil`). |
| Chassis | Translucent, never-blurred UI material: the command bar, the rails and the status rail. |
| Panel | Translucent card material placed on the veil. |
| Screen | Theme-invariant black material for monitors, frames, thumbnails and slate art windows. It has 2 px corners. |
| Bezel | Theme-invariant near-black `#0B0F17` hardware that holds lamps, the tally bar, HUD plates and the monitor frame. |
| Lamp | A tally indicator (PGM/ON AIR, PVW, REC, CUE, STBY). It always sits in a bezel housing and always carries a text label. |
| LED | An 8×8 status square with a text label (health, save state, preflight). |
| Resolve | The 4-step Bayer mask reveal: 25→50→75→100% over 4×40 ms. It is the only way new content appears. |
| Air lock | The live-safety mode, active while `html[data-lock="air"]` is set. |
| Effect slot | The single contextual canvas each view may run alongside the carrier (`useEffectCanvasSlot`, §7). |
| Tuning | The carrier state while connecting (`data-broadcast="connecting"`, speed .055). |
| House lights down | The ON AIR carrier state: veil .72 (light) or .62 (dark) and speed .02, tweened over 1200 ms. |
| Truth gate | The ON AIR condition: `pc.connectionState === 'connected'` **and** outbound-rtp `bytesSent` increased between two `getStats()` polls 1000 ms apart (§6). |
| Slate | The state card family (empty, not-configured, auth, offline, error, 404, standby): a 3:2 screen art window plus a kicker (§6, §11). |
| Chyron | The toast: bottom-left, with a tone bar under a 50% Bayer mask (§6, §7). |
| Kicker | An authored-uppercase label of at most 3 words (lamp words, slate kickers, eyebrows). |
| Ramp | The 4-step brand pixel ramp `--c-ramp-0…3` plus `--c-ramp-glint`. |
| Bayer tile | One of `--bayer-4-00…15`: an 8×8 px colourless mask tile (§5.13). |

### 4.4 Decision log

#### 4.4.1 Why this direction

- **One grammar.** The carrier's own math (4 levels, ordered Bayer dither, 2 px cells) drives every fill, skeleton, reveal, selection, progress field and slate. Nothing is decoration borrowed from elsewhere.
- **It fits the budget.** There is no `backdrop-filter` and GenerationFrame is CSS-only. Telemetry uses CSS LED ladders, not canvas sparklines. Each view gets one effect canvas beside the carrier.
- **It is operable live.** Nothing moves unless information moves. Tally lamps are driven by real signal.
- **It is distinctive.** The references are instruments (OP-1, Playdate, Elektron, ATEM), not SaaS dashboards.
- **Its weakness is fixed by grafts.** The winning proposal lacked brand chrome. Grafts §4.4.2 G1–G3 add the wordmark boot stage, the real raster wordmark and a chrome tier for flagship Coast art.

#### 4.4.2 Grafts taken

| ID | Take this | Spec |
|---|---|---|
| G1 | Boot wordmark stage: a 1-bit mask resolves in Bayer order, crossfades to the crisp raster, glints once, then FLIPs into the command-bar bug. | §6 |
| G2 | Keep the real raster wordmark (AVIF/WebP, sized). Never trace it. Only the 1-bit boot masks derive from it. | §7, §13 |
| G3 | A "Chrome & Ink" tier for flagship Coast art only, with "skin tones natural and true to Image 1, never tinted blue". | §13 |
| G4 | Extract DirectorPlayer (1342 lines) into presentational parts before any restyle, and move the 1 s tick into leaves. | §8 |
| G5 | `prefers-reduced-transparency`, `prefers-contrast: more`, and 44 px targets on `(pointer: coarse)`. | §5.2, §5.8, §5.10 |
| G6 | Never add or remove `text-transform` on a preserved string. New uppercase strings are authored in uppercase. | §5.20.5 |
| G7 | The `html[data-broadcast]` state machine, plus `data-rec` and a derived `data-lock`. | §7.6, §6 |
| G8 | GenerationFrame density comes from 16 precomputed Bayer tiles stepped in CSS. | §5.13, §6 |
| G9 | The OFF AIR lamp holds for 3 s, then shows standby. | §6 |
| G10 | `scripts/brand/approved.json` provenance, plus gitignored `.cache/refs`. | §13 |
| G11 | "Go live on Twitch" is hold-to-take (600 ms ring); a click or Enter opens a confirm dialog. CUE is a steady amber lamp. | §6, §8 |
| G12 | Ingest loss shows a sticky `role=alert` chyron that counts up, plus a hatched lamp. | §6, §8 |
| G13 | Air lock: density frozen, no reflow, leaving requires a confirm during PVW, REC or PGM, and REC is steady. | §6 |
| G14 | The carrier Tuning state (speed .055 while connecting). | §5.5 |
| G15 | A uniform 4:3 Locations grid with A/B compare, and review-before-promote for generated sheets. Under D2 the Convex behaviour is unchanged: auto-appended sheets get a `REF` badge. | §10 |
| G16 | Tabular HH:MM:SS timecode and a FreshnessStamp. | §5.20.4, §7 |
| G17 | Exact letterforms are never generated. Icons derive from the pixel Coast master. | §13 |
| G18 | A broadcast store published by DirectorPlayer. The status rail makes zero network probes. | §7 |
| G19 | The slate vocabulary (STAND BY, BLANK BOARD, OPEN CASTING, NO TAPE, CH 404…). | §6, §11 |
| G20 | The transport bar absorbs the HUD buttons. Only the viewfinder brackets overlay program. | §8 |
| G21 | The first-frame gate uses `requestVideoFrameCallback`. | §6 |

#### 4.4.3 Director overrides (O1–O15)

| ID | Rule for the implementer | Spec |
|---|---|---|
| O1 | Measure contrast against the carrier's worst pixel `#5555AA`, never `#3357A8`. | §5.6 |
| O2 | Retune the veil honestly: its colour becomes `--c-canvas` and its alphas stay .60 (light) / .45 (dark). | §5.5 |
| O3 | MorphSlider stays on Live Control, in the Audio dock tab, and keeps its autoplay (`autoplay autoplayDelay={6}`, D3). The carousel is display-only: `onIndexChange` never writes the armed track, and a track is armed only through the track radiogroup or the 'Arm this track' button on the current slide (a §0.4 behaviour change). Autoplay pauses under the air lock, under reduced motion, while the dock is collapsed, while the Audio tab is hidden and while the page is hidden. It renders on demand and is arbitrated by the effect slot. The 'Expand artwork' Sheet shows it at up to 480×480; only one MorphSlider instance is ever mounted. Its labels, including 'Coast originals artwork carousel', do not change. | §8, §12 |
| O4 | Exactly one thing may blink: the STALLED lamp, at 1 Hz for at most 5 cycles. Queued frames, CUE and the Coast slate are static. | §6 |
| O5 | No global single-character shortcuts, and no ⌘⇧L or ⌘. chords. | §7 |
| O6 | The primary DitherButton label sits on a bezel label plate. | §7 |
| O7 | Nothing is installed from reactbits.dev. Every CSV-derived component is an original with a provenance comment. | §12 |
| O8 | Colours map as `rgb(var(--c-x) / <alpha-value>)`. Translucency comes from the separate `surface-*` utilities. | §5.14, §5.15 |
| O9 | `lib/utils.ts` uses `extendTailwindMerge`. | §5.17 |
| O10 | The command palette is original, on a native `<dialog>`. No `cmdk`. | §7 |
| O11 | The PX5×7 face is used only on md lamp faces, slate kickers and the boot, for at most 3 words. Small lamps use JBM `micro`. | §5.20.2, §12 |
| O12 | Masonry and Realistic emboss are dropped. A key-shadow token remains. | §5.9, §12 |
| O13 | No H3 loop inside the monitor. The idle monitor is a static SymbolRaster. | §8 |
| O14 | Focal font files are never deleted (D4). The italic and `.otf` files simply stop being referenced. | §5.20.1 |
| O15 | `'Live · {n}s'` becomes `'Live · HH:MM:SS'`. `'Ping · {n} ms'` and `'REC {formatBytes}'` stay verbatim (D6). | §5.20.4 |

#### 4.4.4 Verified facts (bible F1–F11, re-verified at 845147c)

| # | Fact | Evidence | Consequence |
|---|---|---|---|
| F1 | The carrier quantises each RGB channel independently to 4 levels. Rendered palettes: dark {#000000, #000055, #005555, #555555, #0055AA, **#5555AA**}, light {**#5555AA**, #55AAAA, #55AAFF, #AAAAAA, #AAAAFF, #AAFFFF, #FFFFFF}. | `components/reactbits/Dither.jsx:93-103`. Simulated for t∈[0,1] × 64 thresholds. | `#5555AA` is the worst pixel in both themes (§5.6). |
| F2 | Today's veil is `bg-fal-gray-50/60 dark:bg-[#0a0d14]/45`. | `app/layout.tsx:38` | The veil is retuned to `--c-canvas` with the same alphas. |
| F3 | `dither-kit/sparkline.tsx` wraps `AreaChart`, and the chart loop re-requests rAF every frame. | `components/dither-kit/sparkline.tsx:5`, `cartesian-canvas.tsx:118` | No canvas sparklines on Live Control or StatTiles. |
| F4 | MorphSlider has no static mode, only a `webglFailed` `<img>`. `autoplay` defaults to `false` and TrackManager turns it on. | `MorphSlider.tsx:455,546`, `TrackManager.tsx:138` | Keep it and TrackManager's autoplay, make it display-only with the §4.4.3 O3 pause conditions, and add a render-on-demand patch (§8, §12). |
| F5 | Focal woff2 ships `tnum case ss01 ss02 frac` (also `calt dnom kern liga locl numr subs sups`), but no `zero`. Default Focal digits are proportional (advances 359–671 units). | fontTools on `fonts/focal/*.woff2` | Updating Focal numbers use `tabular-nums`. Mono readouts use JBM. |
| F6 | `next/link` in Next 15.5.2 exports `useLinkStatus`. | `node_modules/next/dist/client/app-dir/link.d.ts:188` | RouteProgress with no new dependency (§6). |
| F7 | A plain `twMerge` drops custom font sizes: `cn('text-body-sm','text-fg-2')` returns `'text-fg-2'` with today's `lib/utils.ts`. | Node run against `lib/utils.ts` | `extendTailwindMerge` (§5.17). |
| F8 | `hueFill(215)` = hsl(215, .85, .58) ≈ `#3985EF`. A white label over a lit cell measures about 4.1:1. | `components/dither-kit/pixel.ts:41-45` | The primary label sits on a bezel plate (§7). |
| F9 | `lucide-react` is 0.294.0. `Columns2`, `Rows3` and `Captions` are absent. All 77 icons in the bible list exist. | `node -e require('lucide-react')` | The icon allowlist (§5.20.6). |
| F10 | `motion` 13.2.0 exports `LayoutGroup`, `Reorder`, `useReducedMotion` and `AnimatePresence` from `motion/react`. `sharp` 0.34.5 is present transitively. `tailwindcss-animate` is installed but unregistered. | Node, `package.json`, `tailwind.config.js:141` | No new runtime dependencies. |
| F11 | `ChartConfig.color` accepts only `DitherColor` names. | `components/dither-kit/chart-context.tsx:23` | The analytics chart uses `'blue'` (§11). |

#### 4.4.5 Corrections this spec makes to the bible

Each was verified by building, compiling or running code in a scratch copy. The details are the `> Note:` lines in §5.

| C | The bible said | Verified fact | This spec does | § |
|---|---|---|---|---|
| C1 | `globals.css` imports `tokens.css`/`bayer.css` before `@tailwind base` and `utilities.css` after `@tailwind utilities`. | Next 15.5.2 runs PostCSS on each `@import`ed file separately. `tokens.css` fails the build: "`@layer base` is used but no matching `@tailwind base` directive is present." An `@import` after other rules is invalid CSS. | Add `postcss-import` (15.1.0, already installed through tailwindcss 3.4.17) as the first PostCSS plugin. `globals.css` becomes import-only. | 5.1 |
| C2 | The keyframes live in the Tailwind config. | Tailwind emits config keyframes only next to a used `animate-*` utility. `.px-resolve` and `.skeleton-dither` would reference missing keyframes. | Every `@keyframes` lives in `app/styles/keyframes.css`. The config `keyframes` is `{}`. | 5.14 |
| C3 | `tokens.css` is wrapped in `@layer base`. | Tailwind purges `.dark {…}` inside layers unless the literal `dark` appears in the content (reproduced). | Add `'dark'` to `safelist`. The same list also safelists the nine classes the 1B checks probe before any TSX uses them (`px-resolve`, `skeleton-dither`, `dither-veil`, `dither-fallback` and the five `surface-*` utilities). | 5.15 |
| C4 | `extendTailwindMerge` gets classGroups only. | `cn('h-8','h-cmd')` keeps both classes. | Also extend `theme.spacing`. | 5.17 |
| C5 | The `.fal-card` shim uses `@apply … sq`. | `@apply sq` copies every compound `.sq.rounded-*` rule (15 junk rules). | Never `@apply sq`. The shim writes its own `@supports` block. | 5.18 |
| C6 | (not covered) | The colour name `inset` makes `ring-inset` also set a ring colour. It has 0 uses today. | `ring-inset` is banned. | 5.3 |
| C7 | The radius codemod covers only `rounded-xl`, `rounded-2xl` and bare `rounded`. | The new radius keys change the meaning of `rounded-sm/md/lg` (2/6/8 px become 6/10/14 px). Live code has 41 `rounded-md`, 32 `rounded-lg` and 1 `rounded-sm`. | A single-pass remap of every size. Primitives add `sq`; the codemod does not. | 5.19 |
| C8 | `.skeleton-dither` masks the host with the 25% tile. | A masked host also clips its `::after`, so the sweep could never show 50%. | The static field moves to `::before`. | 5.14 |
| C9 | Ledger: HUD plate ≈7.9, bezel vs light chassis 17.31, hover 13.54 / 7.70 / 5.07… | Recomputed: 6.70, 15.94, and hover 13.45 / 7.64 / 5.04. The "inset" values mean inset nested in a panel. | Publish the recomputed ledger. All pairs still pass. | 5.6 |
| C10 | CoastLoader animates a background strip. | That animates `background-position`, which bible §10.1.4 bans. | `coast-sprite` is a `translateX` of an 800%-wide strip. | 5.14 |
| C11 | Only the icons in the bible list may be used. | Preserved controls use `ChevronLeft`, `ChevronUp`, `ArrowUp`, `ArrowDown`, `ListPlus`, `MessagesSquare`, `LayoutTemplate`, `UserRound` and `Twitch`. NumberStepper needs `Minus`. All exist in 0.294.0. | Add them to the allowlist. | 5.20.6 |
| C12 | Loader2 has "18 sites", animate-pulse has "(4)", fal-gray has "1015". | Loader2 = 8 imports + 10 JSX uses. animate-pulse = 3 live (`DirectorPlayer.tsx:1073,1094,1147`). fal-gray = 1015 including dead code and CSS, 557 in live TS/TSX after D1. | Use the measured counts. | 5.19 |
| C13 | Density switches body text between 14 and 13 px. | There was no mechanism. | Add `--fs-body`/`--lh-body` tokens; `text-body` follows density. | 5.8 |
| C14 | The `backdrop-` gate excludes `components/reactbits/*.css`. | `MorphSlider.css:39-40,65-66` blurs 10 px on Live Control. | Remove it. Only `ChromaGrid.css` (fixture-only, not a blur) stays excluded. | 5.10 |
| C15 | "`REC {formatBytes}` verbatim" and "`bytes(n)` in lib/format.ts". | Three copies of `formatBytes` exist. The copy in `recordings/page.tsx` has a GB branch. | `bytes(n)` matches `DirectorPlayer.tsx:76-79` at every size; `bytes(n, { gb: true })` reproduces `recordings/page.tsx:10-14`. No formatter output changes. | 5.20.4 |
| C16 | "12 legacy `uppercase` sites [v]". | Confirmed: 10 TSX class tokens, plus `globals.css:163` (dead `.metric-label`) and `MorphSlider.css:44`. | The per-site decisions and the allowlist. | 5.20.5 |

### 4.5 Rejected ideas

| Idea | Why rejected |
|---|---|
| Any second background (the other 56 Backgrounds, FloorGlow/Dia gradient, Noise grain) | It competes with the carrier and breaks the rules of one full-screen field and no soft glows. |
| `backdrop-filter` anywhere (command bar blur, glass surfaces, Gradual Blur) | It re-blurs the animating WebGL every frame and smears the pixel grid. |
| Split Flap Text, Counter | Mechanical flips and rolling digits in the operator's line of sight. State words resolve; digits snap. |
| Shiny Text on H1s and buttons, chrome gradient buttons, chrome display type, Border Glow | Reads as premium SaaS decoration, and Border Glow is pointer-reactive. The glint is allowed on the wordmark only. |
| 112 px editorial page header; 21:9 key-art band on Characters | Wastes operator space. PageHeader is at most 96 px. |
| Colour-bar/PLUGE boot stage | Replaced by the POST display-test strip in the brand ramp. |
| Global R/F/M/C shortcuts, hold ⌘. to stop, hold ⌘⇧L to go live | WCAG 2.1.4 and browser conflicts (§4.4.3 O5). |
| H3 standby loop inside the program monitor | §4.4.3 O13. |
| Tracing the wordmark to SVG; generating a monogram "W" on fal | Destroys the chrome bevel and risks distorted letterforms. |
| Holo on non-locked characters, a Coast slate blink every 6 s, a custom 8×8 icon set | Too decorative and too much scope. Lucide covers the icons. |
| Masonry for Locations | A uniform 4:3 grid compares fairly. |
| Radar, Scanner, Faulty Terminal for acquisition | SymbolRaster already carries acquisition. |
| SVG-mask or `clip-path` squircle for hero cards (csv.md, Apple's corners) | Clips focus rings on focusable elements. Only `corner-shape` under `@supports` is allowed. |
| Registering `tailwindcss-animate` | Unused, and its `fade-in` utility collides with legacy names. |
| Downgrading `tailwind-merge` to v2 | 3.7.0 with `extendTailwindMerge` passes every merge case in §5.17. No dependency churn. |

### 4.6 Acceptance criteria

Commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] Every "Proven by" check in §4.2 passes at the end of M9 (commands under the §4.2 table, in §5.21 and in §15).
- [ ] Each correction §4.4.5 C1–C16 is implemented exactly as §5 specifies (verified by the matching §5.21 items).
- [ ] `git diff 845147c -- dashboard/ | grep -niE '\b(he|him|his|she|her|hers)\b'`: every hit has been reviewed, and none refers to Coast.
- [ ] Nothing from §4.5 is present: `grep -rnE "backdrop-(blur|filter)|from ['\"]cmdk['\"]|require\(['\"]tailwindcss-animate" dashboard/app dashboard/components dashboard/tailwind.config.js | grep -vE '^dashboard/components/(dither-kit/|reactbits/ChromaGrid\.css:)'` prints nothing.

## Chapter map

`goal.md` holds §0–§4, §14, §16 and §17. Every other chapter (§5–§13, §15 and both appendices) lives in `docs/redesign/spec/`. Together they are one document with one authority (§1.2); a reference "§N.M" means that section wherever it lives.

| § | Chapter | File |
|---|---|---|
| 0–4 | Mission, how to work, owner decisions, current state, design direction | `goal.md` |
| 5 | Foundations | [`docs/redesign/spec/05-foundations.md`](docs/redesign/spec/05-foundations.md) |
| 6 | Motion system and loading | [`docs/redesign/spec/06-motion-and-loading.md`](docs/redesign/spec/06-motion-and-loading.md) |
| 7 | Primitive kit and app shell | [`docs/redesign/spec/07-primitives-and-shell.md`](docs/redesign/spec/07-primitives-and-shell.md) |
| 8 | Page: Live Control | [`docs/redesign/spec/08-live-control.md`](docs/redesign/spec/08-live-control.md) |
| 9 | Page: Shotboard | [`docs/redesign/spec/09-shotboard.md`](docs/redesign/spec/09-shotboard.md) |
| 10 | Pages: Characters, Locations and the visual-test fixture | [`docs/redesign/spec/10-characters-locations.md`](docs/redesign/spec/10-characters-locations.md) |
| 11 | Pages: Clips, Recordings, Twitch Analytics and route states | [`docs/redesign/spec/11-clips-recordings-analytics-states.md`](docs/redesign/spec/11-clips-recordings-analytics-states.md) |
| 12 | Effects | [`docs/redesign/spec/12-effects.md`](docs/redesign/spec/12-effects.md) |
| 13 | Brand assets with fal | [`docs/redesign/spec/13-brand-assets-fal.md`](docs/redesign/spec/13-brand-assets-fal.md) |
| 14 | Execution plan | `goal.md` |
| 15 | Verification and QA (harness, gates, test code) | [`docs/redesign/spec/15-verification-and-qa.md`](docs/redesign/spec/15-verification-and-qa.md) |
| 16–17 | Non-negotiables and forbidden actions; risks, cut order, open questions | `goal.md` |
| A | Appendix A — Preserved contract | [`docs/redesign/spec/appendix-a-preserved-contract.md`](docs/redesign/spec/appendix-a-preserved-contract.md) |
| B | Appendix B — File map | [`docs/redesign/spec/appendix-b-file-map.md`](docs/redesign/spec/appendix-b-file-map.md) |


## 14. Execution plan

This section turns the bible's binding sequence (bible §10.5) into ten milestones, M0–M9, and fixes the order of every PR. Each milestone names the chapter sub-sections that specify its work. The §15 harness proves each one. Line references are **as of 845147c**. This section is the only source of milestone and part placement: a chapter names a part by its id (`4D`, `8B`, `11A` …), and §14.3 maps any other label.

Working directory (§1.5), for every command in this section, including each "Definition of done": commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`. No command mixes both forms, and a path that contains `(live)` is quoted, for example `'app/admin/(live)/page.tsx'`.

### 14.1 Milestones at a glance

| Milestone | Title | PRs (parts, in order) | Size | Specified by | Closes (§3.7) |
|---|---|---|---|---|---|
| M0 | Baseline, dead code and formatting | 0A dead code · 0B mega-line formatting | S | §2.2 D1, §2.4, §3.5, §10.5.1 | — |
| M1 | Verification harness, tokens and cascade | 1A harness · 1B tokens and cascade | L | §15, §5.1–§5.19 | #2, #10, #11, #13 |
| M2 | Typography | one PR | M | §5.20 | #12 |
| M3 | Carrier, theme and brand pipeline | 3A carrier and theme · 3B brand pipeline | L | §12.3.1, §5.5, §6.2.11, §7.13, §7.17, §13.3–§13.9 | #14 |
| M4 | Shell, boot and route states | 4A foundations · 4B shell · 4C boot · 4D route states | XL | §7.2–§7.15, §6.2–§6.4, §6.8, §6.13, §11.D, §12.3.2, §12.3.4, §12.3.8, §12.3.15 | #15, #20 |
| M5 | Primitives, generation and effects | 5A controls · 5B broadcast and generation · 5C effects | XL | §7.3–§7.5, §6.6–§6.13, §12.3, §12.4.1, §10.5.9 (`ds-*`) | #1 |
| M6 | Live Control | **6a:** 8A extraction · **6b:** 8B instrument, 8C air | XL | §8 | #4, #5, #6, #7, #8, #9 |
| M7 | Shotboard and asset studio | 9A · 9B · 9C · 9D · 10A · 10B · 10C · 10D · 10E · 10F | XL | §9, §10 | #3, #16, #17, #18 |
| M8 | Clips, Recordings and Twitch Analytics | 11A · 11B · 11C | L | §11.0–§11.C, §11.D.10 | #19 |
| M9 | Brand finals and final sweep | brand (only with `FAL_KEY`, D5) · sweep | M | §13.10, §5.15, §5.18, §15 | all 20 re-verified |

**Size scale** (relative engineering effort): **S** is formatting or deletions under 300 changed lines. **M** is one subsystem, 300–1500 lines. **L** is 1500–4000 lines or two coupled subsystems. **XL** is more than 4000 lines or more than three PRs.

### 14.2 PR mechanics for milestones with parts

§1.4 says "one branch and one PR per §14 milestone". A milestone that lists parts refines that rule. Each part is one PR, and each part obeys every §1.4 rule.

- **Branch:** `devin/m<n>-<part>-<slug>`, where `<part>` is the part id in lower case and the slug has 1–3 more words. A single-PR milestone uses `devin/m<n>-<slug>` with 2–4 words. Both forms match the §1.10 pattern `^devin/m[0-9]-[a-z0-9]+(-[a-z0-9]+){1,3}$`.
  - Examples: `devin/m0-0a-dead-code`, `devin/m6-8a-director-extract`, `devin/m7-10e-locations-scout-wall`, `devin/m2-type-system`.
- **Title:** `[M<n>] <PART> · <title>`, for example `[M6] 8A · DirectorPlayer extraction (no visual change)`. A single-PR milestone uses `[M<n>] <title>`.
- **Order:** parts are stacked in the listed order. Each part branches from the previous part while that part's PR is open, and its body starts with `Stacked on #<n>`. The same rule links milestones: a milestone's first part stacks on the previous milestone's last part while that PR is open (§1.4). Devin never waits for a merge. M9 takes its base from §14.15.
- **Part ids:** a part that a chapter defines keeps the chapter's id (8A…11C), so the reviewer can open that chapter's acceptance block. Milestone-native parts use `0A`, `0B`, `1A`, `1B`, `3A`, `3B`, `4A`–`4D`, `5A`–`5C`, `brand` and `sweep`. A "11D" label (§11.D's route-state files) means part 4D (§14.3 R13).
- **Section-scoped ids (§1):** row ids are cited with their section, because the same id means different things in different tables: `§14.3 R7` is a reconciliation below, `§17.1 R7` a risk; `§15.3 G5` a grep gate, `§4.4.2 G5` a graft taken from the bible; `§15.2 C3` a command gate, `§4.4.5 C3` a bible correction; `§8.10 B32` a Live Control acceptance item; `§0.4 BC-7` a behaviour change, `§13.9 BC-09` a brand check.
- **Part diffs (`BASE`, §1.4):** every part-scoped diff in this section and in §15 is `git diff … "$BASE"...HEAD`, with `BASE=origin/<this PR's base branch>`: `origin/main`, or the open parent part's branch when the PR is stacked (for example `BASE=origin/devin/m0-0a-dead-code` in 0B). Set it with the §1.4 block in the same shell. The never-touch check alone keeps `main...HEAD` (§1.4).
- **Design reviews (non-blocking; §1.4):** after opening **5A** (the design-system fixture) and after opening **8B** (the Live Control instrument), post one PR comment on that PR whose first line is `DESIGN REVIEW`, embedding the captures §14.11 and §14.12 name. It asks nothing, waits for nothing and is not a §1.8 question: keep stacking the next parts at once. A change the owner requests there is applied in the lowest open part that owns the primitive (the owning part itself while its PR is open; otherwise the lowest open part), as its own `M<n>: apply design review: <imperative summary>` commit, and every open part stacked above it is then rebased onto it. Record each such change under Decisions as `DEC-M<n>-<nn>`.
- **Commits:** the message format is `M<n>: <imperative summary>`, for parts too. Each codemod step is its own commit, and it contains nothing but the codemod's output (§1.4). Snapshot updates are always a separate commit, `M<n>: update regression snapshots`, and after-screenshots are too, `M<n>: after-screenshots`.
- **`WZRD_MILESTONE` (§15.1):** each PR runs the harness and the gates with the value in this table. A milestone's gates switch on in the part that completes them. A part that finishes one piece of a gate earlier also runs the targeted command in the last column. Every Playwright command (`npx playwright test …`, `npm run test:e2e`, `npm run test:prod`) in a step, a definition of done or an acceptance item sets `WZRD_MILESTONE=<id>` explicitly (§15.4); unset, it defaults to `9`.

| PR | `WZRD_MILESTONE` and `--milestone` | Also run (runnable form in the block below) |
|---|---|---|
| 0A, 0B | — (the harness lands in 1A) | §1.5 and §1.6 only |
| 1A | `0` | — |
| 1B | `1` | — |
| M2 | `2` | — |
| 3A, 3B | `3` | — |
| 4A | `3` | — |
| 4B | `3` | the routes headings, landmarks and scroll tests at `4` |
| 4C | `3` | the production boot spec at `4` |
| 4D | `4` | — |
| 5A | `4` | the design-system fixture a11y test at `5` |
| 5B | `4` | the same as 5A |
| 5C | `5` | — |
| 8A | `6a` | — |
| 8B, 8C | `6b` | — |
| 9A–9D, 10A–10E | `6b` | each chapter spec the PR adds or changes |
| 10F | `7` | — |
| 11A | `7` | each chapter spec the PR adds or changes; the full-page a11y test of `/admin/clips` at `8` |
| 11B | `7` | each chapter spec the PR adds or changes; the full-page a11y tests of `/admin/clips` and `/admin/recordings` at `8` |
| 11C | `8` | — |
| brand | `8` (harness, gates and route sizes) | the §13.11 `brand:check` items |
| sweep | `9` | — |

```bash
# §14.2 "Also run", from dashboard/, keyed by the PR column.
# 4B
WZRD_MILESTONE=4 npx playwright test tests/routes.spec.ts -g "headings|landmarks|scroll"
# 4C
npm run qa:build && WZRD_MILESTONE=4 npm run test:prod -- tests/boot.spec.ts
# 5A, 5B
WZRD_MILESTONE=5 npx playwright test tests/a11y.spec.ts -g "design-system"
# 11A
WZRD_MILESTONE=8 npx playwright test tests/a11y.spec.ts -g "/admin/clips"
# 11B
WZRD_MILESTONE=8 npx playwright test tests/a11y.spec.ts -g "/admin/clips|/admin/recordings"
```

Page PRs run with the previous milestone's id, so `route-sizes.mjs` still applies the interim cap to the route being redesigned. That cap is the larger of the §3.5 value + 12 kB and the route's final budget (§15.2), so a page PR that meets its chapter budget never fails it. The 11A and 11B a11y runs check the rebuilt pages before 11C switches `8` on for the whole suite.

### 14.3 Reconciliations with the bible sequence and the chapters

The bible's binding sequence (bible §10.5) has nine steps (0–8). Several chapters also place work in a milestone. The decisions below make them agree. Each decision follows §4's "Truth over theatre": nothing is built on a surface that does not exist yet.

| # | Conflict | Decision | Why |
|---|---|---|---|
| R1 | The bible has no step for the §15 harness, but bible §10.5 screenshot-diffs every step, and bible §10.4's gates apply to every section | The harness lands in **M1 part 1A**, before the first visual change, and runs against the untouched M0 app | M0 must stay a deletion and formatting diff (D1 evidence; 0A adds only `dashboard/.nvmrc` and the SKILL.md fix). A harness that first runs on an unchanged tree proves itself, because every M0-valid check passes. The first regression snapshots then show the pre-redesign app |
| R2 | The bible puts "brand script and placeholders" last (step 8), but the boot (§6.2.1) needs `components/boot/masks.ts`, `wordmark/wzrdtech-640.webp` and `loader/coast-boot-strip@2x.png`. Slates (§6.13) need `/brand/slate/<id>.webp`. The ON AIR favicon (§6.7, 8C) needs `icons/favicon-onair.svg`. §8, §10 and §11 render `<BrandImage id>` | The keyless pipeline, its placeholders, `lib/brandAssets.ts` and the four brand components move forward to **M3 part 3B**. Generation and approval (the D5 run) stay last, as the **M9 `brand`** part | Placeholders go through the same encoders, file names, dimensions and budgets as finals (§13.7). Swapping in finals changes bytes, not layout. `BrandImageId` makes a missing id a type error in every page PR. §6.2.1's fallback ("the boot's PR runs §13's build step") is no longer needed |
| R3 | Bible step 4 (shell) comes before step 5 (primitives), but the shell and the route files consume primitives (§7.1 build order) | M4 includes the primitives the shell and route states consume. **4A:** Button (with `components/ui/buttonClassName.ts`, §7.3), IconButton, Tooltip, Kbd, Popover, Dialog, ConfirmDialog (its full §7.3 API), SegmentedControl, InlineBanner, BayerSpinner, VisuallyHidden, LiveRegion, Led, TallyLight, TallyCluster and PixelFace (§12.3.4). **4D:** Skeleton, Slate (with `titleAs`, §7.5) and ErrorState. Everything else in §7.3–§7.5 is M5 | This is §7.1's build order. The shell never waits for a primitive, and no primitive is built twice |
| R4 | §7.18 requires exactly one h1 on every route from M4. Page h1s arrive with the page milestones, and the legacy h1 'Stream Admin' stops being a heading in M4 (§7.8) | Four decisions: **(a)** In 4B, `app/admin/page.tsx` gets its final `<h1 className="sr-only">Live Control</h1>` (§8.2, moved forward); 4D moves the file to `app/admin/(live)/page.tsx` (§14.3 R9). **(b)** `app/admin/shotboard/page.tsx`, `clips/page.tsx`, `recordings/page.tsx` and `analytics/page.tsx` get an interim `<h1 className="sr-only">` with the route's metadata title. The PR that renders the route's visible h1 (9B, 11A, 11B, 11C) deletes it. **(c)** `/admin/characters` and `/admin/locations` keep no h1 in unconfigured mode until 10D/10E; `routes.spec.ts` encodes this as `h1From: '7'`. **(d)** `components/AssetStudioVisualFixture.tsx:39` changes its root from `<main className="asset-studio …">` to `<div className="asset-studio …">` in 4B, which is §10.5.9's rule moved forward | (b) keeps one h1 per route with the same text the page will render. (c): both routes' unconfigured branch is an early return inside the component (`CharacterLibraryPage.tsx:44`, `LocationLibraryPage.tsx:43` at 845147c), not in the route file, so an interim h1 would be a hand edit to two files that 0B formats and 10A only moves. It would live only until 10D/10E, whose header band renders the h1 in every state (§10.9.6 item 9). Leaving the files alone keeps 10A a pure move: its literal check (§10.5.1: `--set` against the 10A PR's own merge base, not the 845147c `OK 476 literals` baseline, which is 10-0's) then has no interim string to carry. (d) gives every route one `main` from M4 and changes no literal |
| R5 | §3.7 #1 (MorphSlider autoplay re-arms the operator's track) is critical, but §8 makes the carousel display-only only in 8B (M6) | **5C** makes the Live Control carousel display-only (D3, §0.4 BC-15): it deletes `onIndexChange={selectSliderTrack}` and `selectSliderTrack` (`TrackManager.tsx:142`, `:91`), so no slide change (autoplay, previous/next, drag) writes the armed track any more; the track rows keep arming as at 845147c. `autoplay autoplayDelay={6}` stays in both callers (`TrackManager.tsx:138-139`, `AssetStudioVisualFixture.tsx:45`). In the same PR, it imports MorphSlider through `next/dynamic` with `ssr:false` in both files, together with the §12.4.1 render-on-demand and autoplay-pause patch. 8B adds the shown-slide state (`onIndexChange={setShownIndex}`), 'Arm this track', the 'Armed track' radiogroup with 'No track' (§0.4 BC-14) and the 'Expand artwork' Sheet (§8.5.10); 10F makes the fixture's carousel display-only (§10.5.9). Under `OVERRIDE D3: autoplay off`, 5C also deletes both `autoplay` and `autoplayDelay` props | The fix is two deleted lines and is not a restyle. Moving the import is what takes three r169 and gsap out of `/admin` First Load (§15.2), which the budget check enforces from M5 |
| R6 | `lib/imageGen.ts` `onStatus` (§6.6) is first consumed by the pages in 9C and 10C, but GenerationFrame is built in M5 | It lands in **5B**, with GenerationFrame (§6.6). This is D7's allowed pure-frontend exception: endpoints and inputs are unchanged | GenerationFrame's specimens need real phases in M5 |
| R7 | `TrackManager.tsx:144` carries `backdrop-blur`, and `components/reactbits/MorphSlider.css:39-40,65-66` blurs 10 px on Live Control. Live Control is restyled only in 8B, but §5.21 requires the backdrop-filter gate (§15.3 G5) to read 0 with the M1 gates | Both are removed in **1B**, in the codemod-4 hand edits: `TrackManager.tsx:144` in the edit that already rewrites the violet classes on that line, and `MorphSlider.css` with the §5.10 edits (the backdrop removal and the violet retint; line 44's `uppercase` stays) | The same elements already change in 1B. §15.3 G5 scans the vendored reactbits CSS too (only `ChromaGrid.css` is excepted), so it can be enforced from M1 |
| R8 | Codemod 10 (greys) runs with the page restyles (§5.19), and those pages are rebuilt across three milestones: Live Control (M6), Shotboard and the studio (M7), and the library and analytics pages (M8) | Codemod 10 runs page by page in **M6–M8**, because the library and analytics pages are M8 here. The deprecated aliases are deleted in M9 `sweep` | Clips, Recordings and Analytics are redesigned in M8 |
| R9 | The chapters create layout-exact skeletons with their pages (LiveSkeleton 8B, ShotboardSkeleton 9A, ClipsSkeleton 11A, RecordingsSkeleton 11B, AnalyticsSkeleton 11C), while §6.3 creates every route's `loading.tsx` at once | **4D** first runs `git mv app/admin/page.tsx 'app/admin/(live)/page.tsx'` (its import becomes `../../../components/DirectorPanel`). It then creates exactly **7** `loading.tsx` files (file list, loaders and captions: §6.3), the final `StudioSkeleton` (§10.4.7) and the interim `components/states/skeletons/RouteSkeleton.tsx` (§7.5). Skeleton per file, and the part that swaps in the layout-exact one: `app/admin/(live)/loading.tsx` RouteSkeleton → LiveSkeleton (8B); `shotboard/loading.tsx` RouteSkeleton → ShotboardSkeleton (9A); `characters/` and `locations/loading.tsx` StudioSkeleton (final from 4D); `clips/loading.tsx` RouteSkeleton → ClipsSkeleton (11A); `recordings/loading.tsx` RouteSkeleton → RecordingsSkeleton (11B); `analytics/loading.tsx` RouteSkeleton → AnalyticsSkeleton (11C). 11C deletes RouteSkeleton, its last user | No `loading.tsx` may exist at `app/admin/` or `app/admin/visual-test/`: a Suspense boundary above a `notFound()` page turns its 404 into a 200 (§6.3). The `(live)` route group gives `/admin` its own loading boundary without wrapping the other admin routes, so Live Control's skeleton never flashes on them |
| R10 | Bible §10.5 step 6 lists the broadcast store after the extraction, next to the layout and the air lock, but 8A already publishes to the store (§8.5.4 E6 and E8), and the shell (4B) reads it | The store **module** `lib/broadcast/store.ts` (§7.17) lands in **3A**, with no publishers and the dev-only `window.__wzrd.broadcast`; its first consumer is DitherBackground (§5.5). The shell's consumers and BroadcastProvider with every §6.7 and §6.12 side effect land in 4B, together with `lib/leaveGuard.ts` (4A) and AppNav's leave dialog. The hook-enforced air-lock rows land in 5B. The extraction's publishers land in 8A. The truth gate (`useWhipTruth`, §8.5.6), the go-live HoldButton, the program keyline, `twitch.stop`, `setLeaveHandler`/`leave` and the ScriptTemplatePicker link guards land in 8C (6b), which verifies the ON AIR path end to end | The store is a pure module. Each milestone then wires only its own consumers or publishers |
| R11 | The obvious way to keep the animated carrier out of 8A's zero-pixel comparison is a Playwright `mask: [page.locator('body > div.fixed.-z-10')]` | Screenshots hide the carrier canvas with `tests/screenshot.css` (`stylePath`) instead (§15.4) | Measured on 845147c: a Playwright mask paints a magenta box over the element's bounding box. The carrier host is `fixed inset-0`, so the whole 1440×900 capture became magenta, and the zero-pixel proof would pass vacuously |
| R12 | 8A's parity proof (§8.5.4 steps 1–4) needs a DOM capture as well as a pixel comparison | There is no separate snapshot script (`scripts/checks/live-snapshot.mjs` does not exist). The DOM capture lives in `tests/live-extraction.spec.ts` (§15.5), which **1A** creates with the rest of the harness. It runs only when `WZRD_LIVE_OUT` is set (the 8A proof), writes the normalised `main` HTML into that directory, and is skipped in every other `test:e2e` run; its `live-*.png` captures are gitignored (§15.1). 8A runs it without changing it, and 8B deletes it | One Playwright spec both captures the DOM and compares the pixels. It was run twice on 845147c: the DOM diff was empty, and all 4 captures matched at `maxDiffPixels: 0` |
| R13 | §11.D (route-level state files) was specified as its own PR, "11D" | That PR (§11.D) is part **4D** of M4. Any row or reference still marked 11D lands in 4D, and each page-specific `loading.tsx` composition lands in 8B, 9A, 11A, 11B or 11C per §14.3 R9 | The shell, the route states and the 404 must exist before any page is rebuilt (§14.3 R4, §7.18) |

> Note: §11.D.10 names its unit spec `tests/unit/global-error.spec.ts` and renders the component with `renderToStaticMarkup`. `@playwright/test` 1.56.1 compiles every `.tsx` it loads with its component-testing JSX runtime (`importSource` `playwright`), so the render throws "Objects are not valid as a React child" (verified). Wrap the component with `component()` from `tests/helpers/pw-jsx.ts` (§15.4) and call `createElement`. The spec file stays `.ts`.

### 14.4 Dependency diagram

```text
main = 845147c (app code) + the spec (§14.6 Prerequisites)
 │
 ├─ M0   0A dead code (D1) ──► 0B prettier on 3 mega-line files
 │
 ├─ M1   1A §15 harness (runs on the M0 app) ──► 1B tokens · Tailwind map · collision · cascade · codemods 3–8
 │
 ├─ M2   type system (§5.20, codemods 1–2)
 │
 ├─ M3   3A carrier · theme · veil · store module ──► 3B brand pipeline + placeholders ═══════════╗
 │                                                                                                 ║ masks, wordmark ladder,
 ├─ M4   4A foundations + shell primitives ──► 4B shell ──► 4C boot ◄══════════════════════════════╣ loader strip, slate art,
 │                                              └──────────► 4D route states ◄════════════════════╣ favicon-onair, standby,
 ├─ M5   5A controls · states ──► 5B broadcast · generation ──► 5C effects · MorphSlider (D3)     ║ talent portrait
 │                                                                                                 ║
 ├─ M6   6a: 8A extraction ──► 6b: 8B instrument ──► 8C air ◄═════════════════════════════════════╣
 │                                                                                                 ║
 ├─ M7   9A ──► 9B ──► 9C ──► 9D (cut-able) ──► 10A ──► 10B ──► 10C ──► 10D ──► 10E ──► 10F ◄══════╣
 │                                                                                                 ║
 ├─ M8   11A media + Clips ──► 11B Recordings ──► 11C Analytics ◄═════════════════════════════════╝
 │
 └─ M9   sweep (from main if M8 is merged,   brand finals (same base as sweep; only with FAL_KEY; Coast art also needs
              else stacked on 11C)            COAST_SHEET_URL or COAST_REF_URLS; never a base branch; the user merges it)
```

**Hard dependencies:**
- `──►` means "stacks on, in this order".
- `═══` means "consumes 3B outputs".
- 4C and 4D need 4A. 4D also needs 4B (the admin segment layout).
- 8B needs 5B (TallyBar) and 5C (SymbolRaster, StreamList, SelectionBrackets).
- 9B needs 8B, because Shotboard uses the additive `AssetUrlInput` `id` prop.
- 10A starts after 9D, or after 9C when 9D is cut (§10.2).
- 11B and 11C need 11A (the media and format helpers).
- `sweep` needs every other milestone. `brand` needs only 3B, but it is scheduled after M8 so that the finals are judged on the finished pages.
- The `DESIGN REVIEW` comments after 5A and 8B (§14.2) are not dependencies: 5B and 8C stack at once.

### 14.5 Milestone PR checklist

Paste this block at the end of every PR body, after "Verification", and tick each item or write `n/a (<reason>)`.

```markdown
## Milestone PR checklist (§14.5)
- [ ] Branch and title follow §14.2; `Stacked on #<n>` is the first line when the base is not `main`
- [ ] Re-read §2 and this milestone's PR comments for `OVERRIDE D<n>:`; quoted under Decisions if any
- [ ] Scope is exactly this part's "Scope" in §14; nothing from its "Out of scope"
- [ ] Commits are `M<n>: …`; each codemod step, the snapshot update and the after-screenshots are separate commits
- [ ] `node --version` and the §1.5 Node check (≥ 22.18) pasted before `npm ci`; `npm ci`, `npm run lint`, `npm run typecheck`, `NEXT_TELEMETRY_DISABLED=1 npm run build` exit 0; from 1A also `npm run qa:build` (M0 uses the §1.6 step 5 build); no lint warning in a changed file
- [ ] From M1: `node scripts/checks/route-sizes.mjs --milestone <id> .qa/build.log` exits 0 (output pasted)
- [ ] From M1: `npm run gates -- --milestone <id>` exits 0 (output pasted)
- [ ] From M1: `node scripts/checks/appendix-a.mjs` exits 0 (output pasted; §15.2 C7)
- [ ] From M1: `WZRD_MILESTONE=<id> npm run test:e2e` has 0 failed (per-project summary pasted)
- [ ] From M4: `npm run qa:build && WZRD_MILESTONE=<id> npm run test:prod` has 0 failed
- [ ] §1.6 unconfigured QA run; console table per route pasted; production 401 and edge-only 200 runs pasted
- [ ] Every changed regression snapshot is listed in "Screenshots" with its cause; no snapshot changed on a route this part does not touch
- [ ] After-screenshots committed under docs/redesign/after/m<id>/ and linked in the Screenshots table (§15.10); from 8B, also this part's ready-state captures (`ready-<name>-{dark,light}.png`, §15.10)
- [ ] 5A and 8B only: the `DESIGN REVIEW` comment with its captures is posted (§14.2); no reply awaited
- [ ] Each §3.7 problem this part closes is named (`Fixes §3.7 #n`) with the command output or screenshot that shows it gone
- [ ] Appendix A items this part touches: listed, each with its A.12 row when it changes
- [ ] `.agents/skills/admin-testing/SKILL.md` updated when §1.9 requires it
- [ ] Never-touch check (§1.4, from the repository root) prints nothing; no new runtime dependency (D8); `ls fonts/focal | wc -l` (from `dashboard/`) prints 7 (D4)
- [ ] Part-scoped diffs use `"$BASE"...HEAD` with `BASE` set per §1.4; every Playwright command sets `WZRD_MILESTONE` (§15.4)
- [ ] Decisions recorded as DEC-M<n>-<nn>; §1.8 items only as BLOCKING QUESTION comments
```

### 14.6 M0: Baseline, dead code and formatting

**Goal:** confirm where the spec is, re-measure 845147c, pin Node, delete the D1 dead code and dependencies, correct the admin-testing skill, and format the three mega-line studio files. Nothing renders differently.

**Prerequisites** (0A, run in this order):
1. The spec is on `main` (§1). From the repository root, this must succeed:

   ```bash
   git fetch origin && git cat-file -e origin/main:goal.md && git cat-file -e origin/main:docs/redesign/spec/appendix-a-preserved-contract.md
   ```

   If it fails, the owner has not merged the spec branch yet. Do not wait and do not ask. Base 0A on `origin/claude/tender-brahmagupta-6u6ycx`, and read every `main` in §1.4, §1.10, §14 and §15 as that branch: `BASE=origin/claude/tender-brahmagupta-6u6ycx` for 0A, and the never-touch check becomes `git diff --name-only origin/claude/tender-brahmagupta-6u6ycx...HEAD | grep -E '<the §1.4 pattern>'`. Record it under Decisions as `DEC-M0-01` in the §1.7 format.
2. The §1.5 Node check exits 0 (Node ≥ 22.18; 22.22.2 recommended).
3. Branch 0A from `main`, or from the branch that item 1 selected.

**Size:** S (two PRs).

| Part | Branch | Title |
|---|---|---|
| 0A | `devin/m0-0a-dead-code` | `[M0] 0A · Remove LTX-era dead code (D1)` |
| 0B | `devin/m0-0b-format-mega-lines` | `[M0] 0B · Prettier on the three mega-line studio files` |

**Scope:**
- **0A:**
  - Re-run the §3.5 measurements on `main` (§3.8).
  - Add `dashboard/.nvmrc`, whose only line is `22.22.2` (§1.5). `nvm install && nvm use`, run in `dashboard/`, then select it.
  - Run the D1 import grep for each file (§2.4).
  - Delete `components/{TestControlPanel,WebRTCPlayer,RealtimeChart,PerformanceMetrics,QueueVisualization,AIPerformanceBreakdown,GenerationHistory}.tsx`, `hooks/useRealtimeData.ts`, `hooks/useRealtimeWebSocket.ts`, `utils/falApi.ts` and `utils/falUpload.ts`.
  - Run `npm uninstall recharts @fal-ai/serverless-client`, which touches only `package.json` and `package-lock.json`.
  - Fix the stale lines in `.agents/skills/admin-testing/SKILL.md` (§1.9) with exactly this text. Nothing else in the file changes:
    - **Step 5:** replace its first two sentences, "Use the four admin tabs. The Director card is the only Live Control content in current revisions; earlier revisions buried it under a legacy video-generation form.", with: "Use the seven admin tabs (Live Control, Shotboard, Characters, Locations, Clips, Recordings, Twitch Analytics); `/admin/visual-test` exists in dev only. Live Control renders the Director card, then the Script and Chat steering cards, plus the Audio library when Convex is configured." The rest of step 5, from "Its button is **Start Director**.", stays.
    - **Step 6:** replace "Expect only a React DevTools info message." with "Expect only the messages in goal.md §1.6 step 4's allowed table." The rest of step 6 stays.
  - The 0A PR body carries the "Brand generation inputs" note below (§2.1, D5), verbatim, under "Owner-decision evidence" after the D1 import-grep output. It is informational. It is not a question or a `BLOCKING QUESTION`, and no part waits for it.
- **0B:** run the §10.5.1 command on `components/CharacterLibraryPage.tsx`, `components/LocationLibraryPage.tsx` and `components/AssetStudioVisualFixture.tsx`.

The "Brand generation inputs" note:

```markdown
**Brand generation inputs** (informational; nothing is needed to finish M0–M9, and no part waits for these)
The M9 `brand` part uses whichever of these Devin secrets exist when M9 starts (goal.md §2.1, D5):
- `FAL_KEY` alone → the no-likeness set: GPT Image 2.5 Sunburst stills and MiniMax H3 Max motion that show props and the empty control booth, never a person (`likeness:false`).
- `FAL_KEY` + `COAST_SHEET_URL` (preferred) → the Coast set. `COAST_SHEET_URL` is one `https` URL of the approved Coast character sheet you already have (for example @coast's current primary sheet in Characters). It is used directly as the identity reference, and supplying it confirms Coast's consent.
- `FAL_KEY` + `COAST_REF_URLS` → the Coast set from comma-separated `https` URLs of Coast-approved reference images. The run first generates a brand sheet, `coast-brand-sheet-v1`, and generates no other Coast asset until you comment `APPROVE coast-brand-sheet <n>` on the brand PR.
- No `FAL_KEY` → the non-human placeholders (`generated:false`); no fal call is made.
Secret values never appear in commits, logs or PR bodies.
```

**Out of scope:**
- Any class, token, markup or copy change.
- Formatting any other file.
- `components/ViewerChart.tsx` and `components/ImageGenerationControls.tsx`, which stay (D1).
- `types.ts:91` `GenerationHistoryProps`, which is a type, not an import.

**Steps:**
1. Run Prerequisites 1 and 2, and paste both outputs.
2. On `main`, run the §1.5 commands and the §3.5 grep counts. Paste them. Explain any difference from §3.5 under Decisions.
3. Run the §2.4 import grep for all 11 files, and paste the command and its output.
4. Commit `M0: pin Node 22.22.2 (.nvmrc)`. From the repository root:

   ```bash
   printf '22.22.2\n' > dashboard/.nvmrc
   git add dashboard/.nvmrc && git commit -m "M0: pin Node 22.22.2 (.nvmrc)"
   ```

5. Commit `M0: remove LTX-era dead code (D1)` (the `git rm` of the 11 files).
6. Commit `M0: drop recharts and @fal-ai/serverless-client` (`npm uninstall`).
7. Commit `M0: correct admin-testing skill facts` (the SKILL.md text above).
8. Run §1.5 and §1.6, then open 0A with the "Brand generation inputs" note in its body.
9. On 0B, commit `M0: format studio mega-lines (prettier, no token change)`.
10. Run §10.5.1's literal check. Paste the output: `OK 476 literals`.

**Verification:** §1.5 commands, starting with the Node check; §1.6 QA; the literal check. The harness does not exist yet (§14.3 R1).

**Definition of done:**
- [ ] 0A: Prerequisite 1 succeeded, or the PR is based on `origin/claude/tender-brahmagupta-6u6ycx` and records `DEC-M0-01`.
- [ ] 0A: with `BASE` set per §1.4 (`origin/main`, or `origin/claude/tender-brahmagupta-6u6ycx` under `DEC-M0-01`), `git diff --name-only "$BASE"...HEAD` (from the repository root) lists only the 11 deleted files, `dashboard/package.json`, `dashboard/package-lock.json`, `dashboard/.nvmrc` and `.agents/skills/admin-testing/SKILL.md`.
- [ ] 0A: `cat dashboard/.nvmrc` (from the repository root) prints exactly `22.22.2`, and the §1.5 Node check exits 0.
- [ ] 0A: `grep -rlE "recharts|@fal-ai/serverless-client" app components lib` (from `dashboard/`) prints nothing. `hooks/` and `utils/` no longer exist, because D1 deletes every file in them.
- [ ] 0A: `npm run lint` reports exactly 2 warnings, at `reactbits/AccordionGallery.jsx:229` and `reactbits/ChromaGrid.jsx:115`.
- [ ] 0A: from the repository root, `grep -n "four admin tabs" .agents/skills/admin-testing/SKILL.md` and `grep -n "Expect only a React DevTools info message" .agents/skills/admin-testing/SKILL.md` print nothing, and `grep -c "Use the seven admin tabs (Live Control, Shotboard, Characters, Locations, Clips, Recordings, Twitch Analytics)" .agents/skills/admin-testing/SKILL.md` and `grep -c "Expect only the messages in goal.md §1.6 step 4's allowed table." .agents/skills/admin-testing/SKILL.md` each print `1`.
- [ ] 0A: the PR body contains the "Brand generation inputs" note verbatim, and no PR comment asks for a secret (§2.1).
- [ ] 0B: with `BASE=origin/devin/m0-0a-dead-code` while 0A is open (`origin/main` once it is merged), `git diff --name-only "$BASE"...HEAD` (from the repository root) lists only the 3 formatted files, and the literal check prints `OK 476 literals`.
- [ ] Both: every route's First Load JS is within ±1 kB of §3.5.

**Screenshots:** none. The Screenshots table carries one row, "n/a — no rendered change (unimported files and formatting only)", with a pointer to the import grep and the literal check. 1A records the M0 app as `docs/redesign/after/m0/` (§14.3 R1).

**Risk and rollback:**
- A D1 file may gain a live importer before M0. Then keep it (D1), and record it as the next free `DEC-M0-<nn>` (`DEC-M0-01` is reserved for the Prerequisite 1 fallback).
- Prettier may change a literal, in which case the literal check fails. Then revert that file's formatting and record it.
- Rollback: revert the PR. The lockfile restores both dependencies.

### 14.7 M1: Verification harness, tokens and cascade

**Goal:** install the complete §15 harness against the untouched app, then land the token system, the Tailwind mapping, the `fal-primary` collision fix and the cascade fix.

**Prerequisites:** M0's last part (0B) is merged or open; if it is open, stack on it (§1.4).

**Size:** L.

| Part | Branch | Title |
|---|---|---|
| 1A | `devin/m1-1a-verification-harness` | `[M1] 1A · Verification harness (§15)` |
| 1B | `devin/m1-1b-tokens-cascade` | `[M1] 1B · Tokens, Tailwind mapping, collision and cascade fix` |

**Scope:**
- **1A:**
  - Every file in §15.1 except `tests/foundations.spec.ts` (1B), including `tests/live-extraction.spec.ts` (it runs only with `WZRD_LIVE_OUT` set; 8A runs it, 8B deletes it; §14.3 R12) and `scripts/checks/appendix-a.mjs`.
  - The `package.json` changes in §15.1 (`@playwright/test` 1.56.1 and `@axe-core/playwright` 4.13.0 as exact-version devDependencies, the `overrides` block and the scripts), and the `tsconfig.json` `"exclude"` of §15.1 (`["node_modules", "scripts", "tests", "playwright.config.ts"]`).
  - The `dashboard/.gitignore` lines `test-results/`, `playwright-report/`, `.qa/` and `tests/__screenshots__/desktop-dark/live-*.png` (the 8A proof captures, never committed).
  - The first regression snapshot set (`tests/__screenshots__/**`, without the ignored `live-*.png`) and `docs/redesign/after/m0/*`.
- **1B:**
  - §5.1–§5.19, **except** the M2 items in §5's placement table: `app/fonts.ts`, the `fontFamily`/`fontWeight` keys, deleting `@font-face` (it moves to `fonts-legacy.css`), and codemods 1, 2, 9 and 10.
  - The `postcss-import` devDependency at exactly `15.1.0`, installed with `npm i -D -E postcss-import@15.1.0` (justified under D8 in the PR). 15.1.0 is the version tailwindcss 3.4.17 already resolves in `package-lock.json` at 845147c; confirm it still matches at implementation time.
  - The §5.18 shims.
  - `lib/utils.ts` (§5.17) and `lib/motion/tokens.ts` (§5.12).
  - `scripts/gen-bayer.mjs`, `scripts/codemods/foundations.mjs`, and `scripts/checks/{css-layers,cn}.mjs`.
  - Codemods 3–8, including the `TrackManager.tsx:144` backdrop removal (§14.3 R7).
  - `components/reactbits/MorphSlider.css`: the §5.10 edits (the `backdrop-filter` removal and the violet retint; line 44's `uppercase` stays), in the codemod-4 hand commit (§14.3 R7).
  - `tests/foundations.spec.ts` (§15.5): one test per §5.21 Playwright item.

**Out of scope:** fonts and weights (M2); the carrier and the veil element (M3); the shell (M4); spinners (M5); greys (codemod 10); any page layout.

**Steps:**
- **1A:**
  1. `M1: add Playwright and axe devDependencies`. From `dashboard/`:

     ```bash
     npm i -D -E @playwright/test@1.56.1 @axe-core/playwright@4.13.0
     # now add the §15.1 "overrides" block and "scripts" to package.json by hand, then:
     npm install
     ```

     Commit `package.json` plus `package-lock.json`. `-E` saves the exact versions: without it npm writes `^1.56.1` and `^4.13.0`, which the §15.11 version check rejects.
  2. `M1: add the §15 harness`: the config, helpers, specs, `tests/screenshot.css`, `scripts/checks/{grep-gates.sh,route-sizes.mjs,qa-build.sh,appendix-a.mjs}`, `tsconfig.json` and `.gitignore`.
  3. Run `npx playwright install chromium`, then `WZRD_MILESTONE=0 npm run test:e2e`. Everything passes or is skipped (§14.3 R1; `tests/live-extraction.spec.ts` is skipped because `WZRD_LIVE_OUT` is unset). `node scripts/checks/appendix-a.mjs` exits 0.
  4. Run the two §15.11 1A mutation proofs, without committing them. Paste each output. The grep-gate proof runs in 1B, once the gate it mutates reads 0.
  5. `M1: after-screenshots` (M0 app): `WZRD_MILESTONE=0 WZRD_AFTER=1 npx playwright test tests/visual.spec.ts`, which writes `docs/redesign/after/m0/`.
  6. `M1: update regression snapshots` (the initial set): `WZRD_MILESTONE=1 npx playwright test tests/visual.spec.ts --update-snapshots`, then a second run without the flag, which must pass. Open 1A.
- **1B**, in the §5.19 order. Every commit builds:
  7. `M1: tailwind.config.js, postcss-import and the layered CSS files` (§5.1–§5.16), one commit: `tailwind.config.js` with the collision fix, `npm i -D -E postcss-import@15.1.0` (`package.json`, `package-lock.json`), `postcss.config.js`, `app/globals.css`, the new `app/styles/*.css` files, `scripts/gen-bayer.mjs` with its generated `bayer.css`, `lib/motion/tokens.ts` and `scripts/checks/css-layers.mjs`. They land together because the new CSS uses classes that only the new config defines: built against today's config, `components.css` fails with "The `border-line-subtle` class does not exist".
  8. `M1: legacy class shims` (§5.18).
  9. `M1: foundations codemod script` (`scripts/codemods/foundations.mjs`, §5.19).
  10. Codemods, one commit each, in ascending order, before `lib/utils.ts` (§5.19):
      - `M1: codemod 3 undefined shades (hand)`
      - `M1: codemod 4 violet hex (auto)`
      - `M1: codemod 4 violet classes (hand)`
      - `M1: codemod 5 hover/dark pairs (hand)`
      - `M1: codemod 6 bang padding`
      - `M1: codemod 7 focus rings`
      - `M1: codemod 8 radii`

      Paste every dry-run count.
  11. `M1: extendTailwindMerge in lib/utils.ts` (§5.17), with `scripts/checks/cn.mjs`.
  12. `M1: foundations spec` (`tests/foundations.spec.ts`, §15.5).
  13. Run the two §15.11 1B mutation proofs, without committing them. Paste each output.
  14. Review each failing regression snapshot against §5's expected diffs (violet → chrome, token surfaces, radii, body weight 300 → 400). Then `M1: update regression snapshots`.
  15. `M1: after-screenshots` (`WZRD_MILESTONE=1 WZRD_AFTER=1 npx playwright test tests/visual.spec.ts`).

**Closes:** §3.7 #2, #10, #11, #13.

**Verification:** §15.2 (route sizes, `appendix-a.mjs`); §15.3 (`--milestone 1`); §15.5 routes, preserved-contract, live-control, visual, contrast (12 runs), foundations (1B), canvas-audit (the M0-valid subset) and reduced-media; the §15.11 mutation proofs (two in 1A, two in 1B); §1.6.

**Definition of done:**
- [ ] 1A: `WZRD_MILESTONE=0 npm run test:e2e` passes on the 1A branch, and two consecutive `WZRD_MILESTONE=1 npx playwright test tests/visual.spec.ts` runs pass without `--update-snapshots`.
- [ ] 1A: with `BASE` set per §1.4 (`origin/devin/m0-0b-format-mega-lines` while 0B is open), `git diff --name-only "$BASE"...HEAD -- dashboard/app dashboard/components dashboard/hooks dashboard/lib` (from the repository root) prints nothing.
- [ ] 1A: `npm run gates -- --milestone 0` prints the §15.3 "Post-D1 (M0 head)" column and exits 0, and `node scripts/checks/appendix-a.mjs` exits 0.
- [ ] 1A: `git check-ignore -q tests/__screenshots__/desktop-dark/live-idle-dark.png` exits 0, and `git ls-files 'tests/__screenshots__/desktop-dark/live-*.png'` prints nothing.
- [ ] 1B: the §5.16 `node -e` resolution prints `fal-primary-500 = #4F83CC`.
- [ ] 1B: `npm run gates -- --milestone 1` exits 0. §15.3 G1, G2, G5, G7–G12 and G15 print `0`.
- [ ] 1B: the §15.11 grep-gate mutation proof is pasted: with `className="text-violet-500"` added to any component, `npm run gates -- --milestone 1` prints a `FAIL` line for `G1 violet / stray hex`, then `grep gates: FAIL`, and exits 1 (reverted, not committed).
- [ ] 1B: the §5.10 `MorphSlider.css` "Done when" grep prints nothing.
- [ ] 1B: `node scripts/checks/css-layers.mjs` and `node --no-warnings scripts/checks/cn.mjs` exit 0.
- [ ] 1B: the PR body lists the dry-run counts hex 16, bang 23, focus 56 and radii 113. Any difference is explained.
- [ ] 1B: `node -p "require('./package.json').devDependencies['postcss-import']"` prints `15.1.0`.
- [ ] 1B: every 1B commit builds. From the repository root, with `BASE` set per §1.4 (`origin/devin/m1-1a-verification-harness` while 1A is open): `git rebase --exec 'cd dashboard && NEXT_TELEMETRY_DISABLED=1 npm run build > /dev/null' "$BASE"` exits 0.
- [ ] 1B: `WZRD_MILESTONE=1 npm run test:e2e` has 0 failed, including all 12 contrast runs, `tests/foundations.spec.ts` in desktop-dark and desktop-light, and `tests/reduced-media.spec.ts`.
- [ ] 1B: the dark-mode active nav underline is visible in `docs/redesign/after/m1/admin_shotboard-dark-1440.png` (#10).

**Screenshots:**
- 1A: `docs/redesign/after/m0/<slug>-{dark-1440,light-1440,dark-1280,dark-390}.png` for the 8 routes plus `admin_does-not-exist`.
- 1B: the same set under `m1/`.

**Risk and rollback:**
- Layer order can break `next build` (§5.1 note). Use exactly §5.1's `globals.css`.
- Legacy pages can lose a style that had no shim. Snapshot review catches this, and the fix is a shim, not a page restyle.
- Rollback: revert 1B. 1A stays, and its snapshots become current again.

### 14.8 M2: Typography

**Goal:** real Focal weights, JetBrains Mono wired to `font-mono`, the named scale, the casing allowlist and `lib/format.ts`.

**Prerequisites:** M1's last part (1B) is merged or open; if it is open, stack on it (§1.4).

**Size:** M.

**Branch:** `devin/m2-type-system`.

**Title:** `[M2] Typography: Focal, JetBrains Mono and the named scale`.

**Scope:**
- §5.20 in full:
  - `app/fonts.ts`, the `html`/`body` font classes, and the `fontFamily`/`fontWeight` keys.
  - Delete `app/styles/fonts-legacy.css` and its import.
  - Codemods 1 and 2, then the hand re-weighting.
  - The 2 authored uppercase sites (`SHOT {n}`, `COAST ORIGINALS · {n} TRACKS`); the three 'Generate' eyebrows keep `uppercase` (§5.20.5). `scripts/checks/uppercase-allowlist.txt` (maxima summing to at most 9) and `scripts/checks/uppercase.mjs`.
  - `lib/format.ts` and `scripts/checks/format.mjs`.
  - `scripts/checks/lucide-allowlist.txt` and `scripts/checks/lucide.mjs`. The lucide check must exit 0 only from M5.

**Out of scope:** the `'Live · HH:MM:SS'` copy change (8B consumes `lib/format.ts`); any layout; deleting any file in `fonts/focal/` (D4).

**Steps:**
1. `M2: next/font Focal and JetBrains Mono` (`app/fonts.ts`, layout classes).
2. `M2: weight keys and codemod 1 (same commit, §5.19)`.
3. `M2: codemod 2 sizes`.
4. `M2: hand re-weighting`.
5. `M2: authored uppercase and the allowlist`.
6. `M2: lib/format.ts and its check`.
7. `M2: lucide allowlist`.
8. Review the snapshots, then commit the snapshot update and the after-screenshots.

**Closes:** §3.7 #12.

**Verification:** the gates with `--milestone 2` (§15.3 G3, G4 and G13 print `0`); §15.5 full dev suite; `node scripts/checks/uppercase.mjs`; `node --no-warnings scripts/checks/format.mjs`; §1.6.

**Definition of done:**
- [ ] `npm run gates -- --milestone 2` exits 0.
- [ ] After `npm run qa:build`, `ls .next/static/media/*.p.woff2 | wc -l` prints `5`, and `grep -rl '\.otf' .next/static/css` prints nothing.
- [ ] `ls fonts/focal | wc -l` prints `7`.
- [ ] `node scripts/checks/uppercase.mjs` and `node --no-warnings scripts/checks/format.mjs` exit 0.
- [ ] `grep -rn 'function formatBytes' app components` prints nothing.
- [ ] `WZRD_MILESTONE=2 npm run test:e2e` has 0 failed.

**Screenshots:** the full set under `after/m2/`. Type changes on every route.

**Risk and rollback:**
- Heavier weights and the named sizes re-wrap text. Snapshot review is the check. Nothing is clamped to hide a wrap.
- Rollback: revert the PR. M1 stays.

### 14.9 M3: Carrier, theme and brand pipeline

**Goal:** the hardened carrier, a single theme writer, the veil, the readiness event and the store module (3A). Then the keyless brand pipeline, so every later PR can consume `BrandImageId`s (3B, §14.3 R2).

**Prerequisites:** M2 is merged or open; if it is open, stack on it (§1.4).

**Size:** L.

| Part | Branch | Title |
|---|---|---|
| 3A | `devin/m3-3a-carrier-theme` | `[M3] 3A · Carrier hardening, ThemeProvider and veil` |
| 3B | `devin/m3-3b-brand-pipeline` | `[M3] 3B · Brand pipeline and placeholders (keyless)` |

**Scope:**
- **3A:**
  - §12.3.1: `components/reactbits/Dither.jsx` and `Dither.css`, plus `components/DitherBackground.tsx`. This covers half resolution, ≤ 30 fps, `antialias:false`, pause when hidden, one render under reduced motion, stable uniforms with no context churn, and the `.dither-fallback`.
  - The dev counter `window.__wzrd.frames.carrier`.
  - §5.5: the `.dither-veil` element. Delete the veil wrapper at `app/layout.tsx:38`.
  - §6.2.11: `onFirstFrame`, `window.__wzrdDitherReady` and the `wzrd:dither-ready` event.
  - `types/wzrd.d.ts`.
  - §7.2: `hooks/useReducedMotion.ts` and `hooks/usePageVisible.ts`.
  - §7.13: `components/shell/ThemeProvider.tsx`, which wraps the body content in `app/layout.tsx`. `ThemeToggle` is rewired to `useTheme().setPref` and keeps its titles until 4B deletes it.
  - §7.17: `lib/broadcast/store.ts` with no publishers (§14.3 R10). In development, it exposes `window.__wzrd.broadcast` for §8.10's "store publish".
- **3B:**
  - The keyless procedure of §13.10.
  - The §13.3.1 file tree.
  - The §13.7 placeholders.
  - §13.8: `lib/brandAssets.ts` and `public/brand/manifest.json`.
  - `lib/pixelFont.json` and `components/boot/masks.ts`.
  - The §13.6.10–§13.6.11 derived icons and wordmark ladder: `public/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `app/manifest.ts`, `app/opengraph-image.png` and `app/twitter-image.png`, each image with its `.alt.txt`.
  - `approved.json` as `{ "version": 1, "sheet": null, "assets": {} }`.
  - The `.gitignore` line, and the `package.json` scripts plus the `sharp` devDependency at exactly `0.34.5`, installed with `npm i -D -E sharp@0.34.5` (§13.3.2). 0.34.5 is the version `next` 15.5.2 already resolves in `package-lock.json` at 845147c; confirm it still matches at implementation time. 3B does not edit the root `tsconfig.json`: its `"exclude"` already holds `"scripts"` from 1A (§15.1), and §13.9 BC-11 checks it.
  - §7.5: `components/brand/{BrandImage,BrandVideo,Wordmark,CoastLoader}.tsx`.

**Out of scope:**
- Any fal call. 3B runs `brand:build` only, even when `FAL_KEY` is set. Generation is M9 `brand`.
- Putting the Wordmark in the header (4B). The 690 KB PNG stays in the legacy header until then.
- The boot (4C).

**Steps:**
- **3A:**
  1. `M3: reduced-motion and page-visibility hooks`.
  2. `M3: broadcast store module`.
  3. `M3: harden the Dither carrier` (§12.3.1; the provenance head lines are unchanged, §12.7).
  4. `M3: DitherBackground tokens, veil and readiness event`.
  5. `M3: ThemeProvider as the only theme writer`.
  6. Snapshot update, after-screenshots.
- **3B:**
  7. `M3: gitignore the brand cache`. This must come before any pipeline run.
  8. `M3: brand pipeline scripts` (with `npm i -D -E sharp@0.34.5`, run from `dashboard/`).
  9. `M3: keyless brand build outputs` (`npm run brand:build`).
  10. `M3: brand components`.
  11. `npm run brand:check -- --contact-sheet ../docs/redesign/after/m3/brand-placeholders-contact-sheet.png`, then `M3: after-screenshots`.

**Closes:** §3.7 #14.

**Verification:**
- 3A: `tests/canvas-audit.spec.ts` (every M3 test, including the reduced-motion project); `tests/perf.spec.ts` "Live Control idle"; routes (console); visual; §12.3.1's checklist, including `--disable-webgl`.
- 3B: every untagged (keyless) item of §13.11; `npm run brand:typecheck`; `npm run typecheck`; `npm run qa:build` and route sizes (no page change). The two §13.11 items tagged "From 5C" (the `#ds-brand` CoastLoaders and the keyless `#ds-brand` `BrandVideo` poster) need the `#ds-brand` specimen, so they gate 5C instead (§14.11).

**Definition of done:**
- [ ] 3A: `WZRD_MILESTONE=3 npm run test:e2e` has 0 failed. The canvas audit shows one live WebGL context per route, the same canvas node after 10 theme toggles, exactly one `wzrd:dither-ready`, 1–62 carrier frames in 2000 ms, 0 frames while hidden, and 0 rAF callers under reduced motion.
- [ ] 3A: `grep -rn "MutationObserver" components/DitherBackground.tsx` prints nothing (§7.6).
- [ ] 3B: `npm run brand:build` run twice leaves `git status --porcelain` unchanged, and `npm run brand:check` exits 0.
- [ ] 3B: `node -e "const m=require('./public/brand/manifest.json');process.exit(Object.values(m.assets).every(a=>a.generated===false)?0:1)"` exits 0.
- [ ] 3B: `git ls-files scripts/brand/.cache` prints nothing, and `npm run brand:plan` output (price source `fallback`) is pasted.
- [ ] 3B: `node -p "require('./package.json').devDependencies.sharp"` prints `0.34.5`.

**Screenshots:**
- 3A: the full set under `after/m3/`. The veil and carrier change everywhere. The regression snapshots hide the carrier canvas, so only the veil difference shows there.
- 3B: `after/m3/brand-placeholders-contact-sheet.png`. §13.10's keyless steps do not write it: step 11 does, with `npm run brand:check -- --contact-sheet ../docs/redesign/after/m3/brand-placeholders-contact-sheet.png` run from `dashboard/` (the `check --contact-sheet <path>` flag, §13.3.3 and §13.9).

**Risk and rollback:**
- A carrier regression (context churn, a black canvas under SwiftShader) is caught by the canvas audit. Revert 3A alone; 3B does not depend on it.
- Brand build nondeterminism is prevented by pinning `sharp`, and the double-build check proves it.

### 14.10 M4: Shell, boot and route states

**Goal:** the 48 px CommandBar with the nav, the 24 px StatusRail, the palette, the boot (removed by 1617 ms after navigation start: 1600 ms at 60 Hz plus at most one frame, with CLS 0), route transitions, and every route-level state file.

**Prerequisites:** M3's last part (3B) is merged or open; if it is open, stack on it (§1.4).

**Size:** XL.

| Part | Branch | Title |
|---|---|---|
| 4A | `devin/m4-4a-shell-foundations` | `[M4] 4A · Foundations and shell primitives` |
| 4B | `devin/m4-4b-app-shell` | `[M4] 4B · CommandBar, AppNav, StatusRail and palette` |
| 4C | `devin/m4-4c-boot` | `[M4] 4C · Boot: POST → wordmark → carrier` |
| 4D | `devin/m4-4d-route-states` | `[M4] 4D · Route loading, error and 404 states` |

**Scope:**
- **4A (§14.3 R3):**
  - The §7.2 rows not yet landed: `useDelayedFlag`, `useLoadState`, `useConvexAuthState` (an additive export), `useDensity`, `hooks/useOnline.ts`, `hooks/useInView.ts`, `lib/motion/ticker.ts`, `lib/clock.ts`, `lib/bayer.ts`, `lib/commands.ts`, `lib/announce.ts`, `lib/chyron.ts`, `lib/statusMessage.ts`, `lib/effectSlot.tsx` and `lib/leaveGuard.ts`.
  - The 4A shell primitives listed in §14.3 R3, including `components/ui/buttonClassName.ts` (no `'use client'`, §7.3).
  - §12.3.4 PixelFace with `components/effects/px5x7.ts` (it re-exports `lib/pixelFont.json` from 3B).
- **4B:**
  - §7.6–§7.15: the `app/layout.tsx` "After" tree, CommandBar, AppNav (`git mv components/AdminNav.tsx components/shell/AppNav.tsx`, plus §12.3.8 and §6.4.2), StatusRail, CommandPalette and ShortcutSheet (`next/dynamic`) with PaletteHost, the §7.12 keyboard map, ThemeSwitch (delete `ThemeToggle.tsx`), DensitySwitch, ChyronHost, OfflineBanner, the CommandBar's TallyCluster (built in 4A), and `app/styles/shell.css` (its line at the §5.1 position).
  - BroadcastProvider with every §6.7 and §6.12 side effect (title, favicon, announcements, the stalled chyron, recovery, the off-air message, `beforeunload`, the mouse-button guard).
  - The leave guard (`useLeaveGuard()`, §6.12) on the AppNav links, the palette's "Go to" and Alt+1…7, with AppNav's single leave ConfirmDialog.
  - §7.7 metadata, including the D6 description, `app/admin/layout.tsx` with its title template and `EffectSlotProvider`, and the 7 segment `layout.tsx` files that set each title (§7.7).
  - §6.4 `app/admin/template.tsx` and RouteProgress.
  - The footer's removal (D6).
  - The §14.3 R4 interim h1s, including the sr-only 'Live Control' h1 in `app/admin/page.tsx`, and the fixture root change (`<main>` → `<div>`).
  - The StatusRail clock renders `<time data-testid="status-clock">`. `tests/screenshot.css` hides it (§15.4).
  - SKILL.md: the nav moved into the command bar, the boot skip, and the new route states (§1.9).
- **4C:** §6.2: `components/boot/{BootMarkup.tsx,bootScript.ts,boot.src.js,bootScript.generated.ts}`, `scripts/gen-boot.mjs`, and the wordmark preload only (the loader strip is never preloaded); §12.3.2 Pixel Swap and §12.3.15 glint.
- **4D** (§14.3 R9 and R13):
  - `git mv app/admin/page.tsx 'app/admin/(live)/page.tsx'`, then the 7 `loading.tsx` files of §6.3, including `app/admin/(live)/loading.tsx`.
  - §6.8: Skeleton, the final `StudioSkeleton` and the interim `RouteSkeleton` (§7.5).
  - §6.13: Slate, with its `titleAs` prop (§7.5).
  - ErrorState.
  - §11.D.2–§11.D.5: `app/not-found.tsx`, `app/admin/error.tsx` and `app/global-error.tsx`.
  - The dev-only `/admin/visual-test?throw=render` probe: `app/admin/visual-test/ThrowProbe.tsx` (§11.D.10), and the visual-test page gains `<Suspense fallback={null}>` and `<ThrowProbe />` (§10.5.9).
  - `tests/unit/global-error.spec.ts` (see §14.3's note).

**Out of scope:** page layouts (M6–M8); NotConfigured and AuthRequired (5A); effects other than PixelFace, the boot and the nav indicator (5C); Live Control's own air wiring (8C: `setLeaveHandler`/`leave`, the ScriptTemplatePicker link guards, the go-live hold and the keyline).

**Steps:**
- **4A:** one commit per primitive group (hooks, lib stores, controls, lamps, PixelFace).
- **4B:** for each commit, the shell stays renderable:
  1. `M4: layout tree and providers`.
  2. `M4: CommandBar and AppNav`.
  3. `M4: StatusRail`.
  4. `M4: palette and shortcuts`.
  5. `M4: ThemeSwitch replaces ThemeToggle`.
  6. `M4: chyrons, offline banner, BroadcastProvider`.
  7. `M4: metadata, segment titles, footer removal (D6)`.
  8. `M4: interim h1s and fixture root (§14.3 R4)`.
  9. `M4: route template and progress`.
  10. `M4: admin-testing skill update`.
- **4C:**
  11. `M4: boot markup and script` (`boot.src.js`, then `node scripts/gen-boot.mjs` for `bootScript.generated.ts`).
  12. `M4: wordmark preload`.
  13. Measure the boot script sizes (§6.2.12).
- **4D:**
  14. `M4: move Live Control into the (live) route group` (the `git mv` and its import path only).
  15. `M4: skeletons and slates`.
  16. `M4: route loading files`.
  17. `M4: not-found, error, global-error and the throw probe`.
- Each part ends with its snapshot update and after-screenshots.

**Closes:** §3.7 #15 (every file kind exists; Shotboard's `Suspense` fallback lands in 9A) and #20.

**Verification:**
- The §14.2 values (`3` on 4A–4C with the listed extra runs, `4` on 4D), for:
  - routes (landmarks, titles, skip link, one h1 per §14.3 R4, no horizontal scroll);
  - a11y on the shell;
  - preserved-contract (the shell entries, including the footer removal);
  - canvas-audit (`window.__wzrd.slots`);
  - visual.
- `npm run qa:build && WZRD_MILESTONE=4 npm run test:prod` (4C runs only `tests/boot.spec.ts` this way, §14.2): boot.spec, lcp.spec, routes.
- Route sizes: root layout ≤ 180 kB.
- Gates `--milestone 4`: §15.3 G14 prints `0`.
- §6.16's "Boot" and "Route loading and transitions" items, and §7.18's shell, nav, palette, theme and density items.

**Definition of done:**
- [ ] `WZRD_MILESTONE=4 npm run test:e2e` and `WZRD_MILESTONE=4 npm run test:prod` have 0 failed.
- [ ] `find app/admin -name loading.tsx | wc -l` prints `7`, and `test ! -e app/admin/loading.tsx && test ! -e app/admin/visual-test/loading.tsx` succeeds.
- [ ] `find app/admin -name layout.tsx | wc -l` prints `8`, and `test ! -e 'app/admin/(live)/layout.tsx'` succeeds.
- [ ] `test -f 'app/admin/(live)/page.tsx' && test ! -e app/admin/page.tsx` succeeds.
- [ ] prod (§1.6): `curl -s -o /dev/null -w '%{http_code}' localhost:3109/admin/visual-test` prints `404`, and the same command for `/admin` prints `200`.
- [ ] `ls app/not-found.tsx app/admin/error.tsx app/global-error.tsx app/admin/template.tsx app/admin/visual-test/ThrowProbe.tsx` succeeds.
- [ ] `grep -rn "Powered by FAL realtime" app` prints nothing, and `test ! -e components/ThemeToggle.tsx` succeeds.
- [ ] The boot is removed by 1617 ms after navigation start (1600 ms at 60 Hz plus at most one frame), with CLS 0 (boot.spec). `node scripts/gen-boot.mjs --check` exits 0. The inline boot script is ≤ 4096 B gzipped and BOOT_CSS ≤ 1536 B.
- [ ] The route-sizes root layout chunks are ≤ 180 kB, and LCP is ≤ 1800 ms.
- [ ] `grep -c 'four admin tabs' .agents/skills/admin-testing/SKILL.md` (from the repository root) prints `0`, and the skill describes the command-bar nav and `?noboot`.

**Screenshots:**
- The full set under `after/m4/`: every route changes.
- `after/m4/boot-post-dark.png` and `boot-post-light.png`, taken at 1100 ms by §6.16's boot item (production).
- `after/m4/admin_error-probe-dark-1440.png`.

**Risk and rollback:**
- Hydration mismatches can come from the boot host, the theme or the `data-*` attributes. The console gate fails on them, and §6.2.1's hydration rules are the fix.
- A slower first paint (the wordmark preload) is caught by the LCP gate.
- Rollback: revert 4D, 4C and 4B independently, in reverse order. 4A reverts only together with everything that uses it.

### 14.11 M5: Primitives, generation and effects

**Goal:** the complete primitive kit, GenerationFrame driven by real queue status, the effects kit, the MorphSlider fix (D3), and the design-system fixture that shows every primitive in every state.

**Prerequisites:** M4's last part (4D) is merged or open; if it is open, stack on it (§1.4).

**Size:** XL.

| Part | Branch | Title |
|---|---|---|
| 5A | `devin/m5-5a-controls-states` | `[M5] 5A · Controls, panels and state slates` |
| 5B | `devin/m5-5b-broadcast-generation` | `[M5] 5B · Broadcast primitives and GenerationFrame` |
| 5C | `devin/m5-5c-effects-morphslider` | `[M5] 5C · Effects kit and MorphSlider render-on-demand` |

**Scope:**
- **5A:**
  - The rest of §7.3: Field, Input, Textarea, Select, Switch, Checkbox, RadioGroup, Slider, NumberStepper, Badge, Chip, Tabs, Sheet, ScrollFade, Panel, SectionHeader, PageHeader and HoldButton.
  - §7.5: NotConfigured and AuthRequired. `ConvexNotConfigured` becomes the thin wrapper, which retires lucide `Database`.
  - Codemod 9: the 10 `Loader2` sites and the `animate-spin` sites become `<BayerSpinner/>`. `animate-pulse` at `DirectorPlayer.tsx:1073,1094,1147` becomes Led or TallyLight.
  - `app/admin/visual-test/DesignSystemFixture.tsx` and `lib/fixtures/designSystem.ts` (10-DS), with a specimen for each primitive, and its import and element in the visual-test page (§10.5.9).
  - The first design review (§14.2): once the 5A PR is open, a PR comment whose first line is `DESIGN REVIEW`, embedding this part's after-screenshots `admin_visual-test-dark-1440.png` and `admin_visual-test-light-1440.png` (full page; `#design-system-visual-test` shows every 5A specimen) in the §15.10 `?raw=true` form. 5B starts at once.
- **5B:**
  - The rest of §7.4: TallyBar, Readout, StatTile, FreshnessStamp and LedLadder.
  - §7.5: GenerationFrame, StageTrack (§12.3.6) and ContactSheet.
  - §6.6: `onStatus` in `lib/imageGen.ts` and `IMAGE_MODEL_ETA_MS` in `lib/imageModels.ts` (§14.3 R6).
  - §6.10 chyron visuals.
  - The hook-enforced rows of the §6.12 air-lock matrix.
  - The `ds-simulator`.
- **5C:**
  - §12.3.3 PxResolve, §12.3.5 DecryptedText, §12.3.7 StreamList, §12.3.9 SelectionBrackets, §12.3.10 SymbolRaster, §12.3.11 HoloCard, §12.3.12 HoverClipButton, §12.3.13 `.sq` and §12.3.14 CountUp.
  - §12.4.1 MorphSlider: the render-on-demand and autoplay-pause patch.
  - §14.3 R5: D3's display-only carousel in `TrackManager.tsx` (delete `onIndexChange={selectSliderTrack}` and `selectSliderTrack`, `:142` and `:91`; keep `autoplay autoplayDelay={6}` in both callers), and the `next/dynamic` MorphSlider import in `TrackManager.tsx` and `AssetStudioVisualFixture.tsx`.
  - The `ds-effects`, `ds-reactbits` and `ds-brand` specimens, and the MorphSlider specimen attribute (§10.5.9).
  - `public/fixtures/testcard-320x180-2s.{webm,mp4}` for the §12.3.12 HoverClipButton specimen, made with §11.0's commands (`ffmpeg-static` installed with `--no-save`).

**Out of scope:** any page layout; the TrackManager restyle, the shown-slide state, 'Arm this track', the 'Armed track' radiogroup with 'No track' and the 'Expand artwork' Sheet (8B, §8.5.10); the fixture's display-only carousel (10F, §10.5.9); the Live Control air wiring (8C).

**Steps:**
- One commit per primitive, each with its specimen (§10.2 "10-DS").
- Codemod 9 is its own commit.
- 5A: once its PR is open, post the `DESIGN REVIEW` comment (§14.2) and branch 5B without waiting for a reply.
- 5C's MorphSlider patch, the D3 display-only edit (the two deleted `selectSliderTrack` lines) and the dynamic import are three commits.
- Each part ends with its snapshot update and after-screenshots.

**Closes:** §3.7 #1 (5C: no slide change arms a track). The GenerationFrame and `onStatus` groundwork for #17 lands here; pages use it in 9C and 10C.

**Verification:**
- Gates `--milestone 5`: §15.3 G6 prints `0`.
- `node scripts/checks/lucide.mjs` exits 0.
- Route sizes from M5: three.js and gsap are out of `/admin` First Load, and the printed `/admin` First Load drops by about 150 kB (§15.2).
- The canvas audit: MorphSlider is slot-gated.
- `tests/a11y.spec.ts` on `#design-system-visual-test`.
- §7.18's foundations and primitives items; §6.16's generation, air-lock, slate and HoldButton items; §12.4.1's autoplay items (kept, paused under the air lock, reduced motion and a hidden page); §12.7's fixture, code-splitting, WebGL-creator and import-confinement items; the two §13.11 items tagged "From 5C", which gate 5C and not 3B (§14.9): the `#ds-brand` CoastLoaders (64 and 128) and the keyless `#ds-brand` `BrandVideo` poster.

**Definition of done:**
- [ ] `WZRD_MILESTONE=5 npm run test:e2e` has 0 failed, and `npm run gates -- --milestone 5` exits 0.
- [ ] 5C (D3, §0.4 BC-15): `grep -c "autoplayDelay={6}" components/TrackManager.tsx` and `grep -c "autoplayDelay={6}" components/AssetStudioVisualFixture.tsx` each print `1` (autoplay kept), and `grep -c "selectSliderTrack" components/TrackManager.tsx` prints `0` (no slide change arms a track). Under `OVERRIDE D3: autoplay off`, `grep -n "autoplay" components/TrackManager.tsx components/AssetStudioVisualFixture.tsx` prints nothing instead of the first two counts.
- [ ] 5A: the 5A PR has a comment whose first line is `DESIGN REVIEW` and which embeds `admin_visual-test-dark-1440.png` and `admin_visual-test-light-1440.png`; the 5B PR was opened without waiting for a reply.
- [ ] `node scripts/checks/route-sizes.mjs --milestone 5 .qa/build.log` exits 0 (no `WebGLRenderer` or `GreenSock` in `/admin`'s first-load set).
- [ ] `git diff 845147c -- lib/imageGen.ts` adds only `GenStatus`, `onStatus`, `logs: true` and `onQueueUpdate` (§6.16).
- [ ] `/admin/visual-test#design-system-visual-test` contains every `ds-*` id in §10.5.9 except `ds-connect`, which imports `CONNECT_STEPS` from `components/director/constants.ts` (created in 8A) and lands in 8B. `ds-skeletons` shows StudioSkeleton and RouteSkeleton; each page PR adds its own composition to it.
- [ ] 5C: both §13.11 "From 5C" items pass in fixture mode (§1.6): the `#ds-brand` `CoastLoader`s (64 and 128) show the strip with no 404 in the console, and `#ds-brand` renders `<BrandVideo id="motion/coast-standby-loop">` as the `standby/coast-16x9` poster `<img>` with no `<video>` and no request whose path starts with `/brand/motion/`.

**Screenshots:**
- `after/m5/admin_visual-test-{dark,light}-1440.png`: full page, the fixture.
- Every route whose spinners or pulses changed.

**Risk and rollback:**
- Codemod 9 edits `DirectorPlayer.tsx`. 8A's parity baseline is the M5 head, so this is safe.
- A MorphSlider patch regression is caught by the canvas audit (`frames.morph` must stay flat while idle). Revert 5C alone; 5A and 5B do not depend on it.

### 14.12 M6: Live Control (6a extraction, 6b instrument and air)

**Goal:**
- **6a** moves the 1342-line DirectorPlayer into `components/director/*` with **zero** visual or behaviour change, and removes every 1 Hz root commit.
- **6b** builds the zero-scroll instrument (8B), then the truth-gated air path and the air lock (8C).

**Prerequisites:** M5's last part (5C) is merged or open; if it is open, stack on it (§1.4).

**Size:** XL. 6a is L; 8B is XL; 8C is M.

| Phase | Part | Branch | Title |
|---|---|---|---|
| 6a | 8A | `devin/m6-8a-director-extract` | `[M6] 8A · DirectorPlayer extraction (no visual change)` |
| 6b | 8B | `devin/m6-8b-live-instrument` | `[M6] 8B · Live Control instrument` |
| 6b | 8C | `devin/m6-8c-live-air` | `[M6] 8C · Air: truth gate, go-live hold and air lock` |

**Scope:**
- **8A:**
  - §8.5.2 (extraction map), §8.5.3, and §8.5.4's allowed edits E1–E12.
  - The 8A rows of §8.2.
  - It runs `tests/live-extraction.spec.ts` (already added in 1A, §14.3 R12) without changing it, and creates no test file.
  - Nothing else.
- **8B** (§8.5.1's 8B row and every §8.2 row marked 8B):
  - §8.4, §8.5.5–§8.5.13, §8.6 (except the ON AIR rows), §8.7, §8.8 and §8.9, minus the 8C items below.
  - D6 `'Live · HH:MM:SS'`.
  - `app/styles/live-control.css` (its line at the §5.1 position).
  - LiveSkeleton, with `app/admin/(live)/loading.tsx` switched to it from RouteSkeleton.
  - `LiveControlVisualFixture`, with its import and element in the visual-test page (§10.5.9), including its three §10.5.9 ready-state targets (`live-standby`, `live-preview`, `live-onair`), and the `ds-connect` specimen.
  - `components/director/preflight.ts` (§8.5.8), and `components/director/diagnostic.ts` (`formatDiagnostic`, §8.5.6) with `tests/unit/diagnostic.spec.ts` (§8.10 B32).
  - DEC-8-13 (§0.4 BC-13): the `!frame`/`!snap` throttle in `ChatSteerer.tsx` (§8.5.9).
  - The `FX_DECRYPT_LABELS` import from `components/director/constants.ts` in `lib/fixtures/designSystem.ts` (§8.2).
  - The ScriptTemplatePicker restyle (§8.2).
  - Codemod 10 on every Live Control file.
  - The SKILL.md step 5 replacement (§8.9.5).
  - Delete `tests/live-extraction.spec.ts`, because its job is done.
  - The second design review (§14.2): once the 8B PR is open, a PR comment whose first line is `DESIGN REVIEW`, embedding the `live-fixture-<state>-{dark,light}.png` captures and the six `ready-live-*` captures (§15.10) in the §15.10 `?raw=true` form. 8C starts at once.
- **8C** (§8.5.1's 8C row and every §8.2 row marked 8C):
  - §8.5.6's WHIP truth: `lib/broadcast/useWhipTruth.ts` with the pure `nextAir` reducer, plus `tests/whip-truth.spec.ts`.
  - In `useTwitchBroadcast`: the `whip` state, the `air` publishes and `onNegotiationFailed` (§8.5.6).
  - The go-live HoldButton and ConfirmDialog 'Go live on Twitch?'.
  - The program keyline.
  - `twitch.stop` registration (useTwitchBroadcast); the §6.7 stalled chyron, which BroadcastProvider publishes since 4B, verified end to end; the cue-failure chyron; and the 'Twitch ingest not confirmed' warning chyron with 'End broadcast' and 'Dismiss', shown while `air` stays `cue` without a truth gate (§8.5.6; a timeout never tears the session down, §0.4 BC-7).
  - `broadcast.setLeaveHandler`/`leave` wiring (DirectorPlayer registers `s.disconnect`) and the two ScriptTemplatePicker link guards (§8.5.10, §8.6.6).
  - The Stop confirm while on air (DEC-8-14, §0.4 BC-11).
  - The ON AIR title and favicon, checked end to end.

**Out of scope:**
- **8A:** any class, markup, string or order change beyond §8.5.4 E1–E12, and any §8.4 layout.
- **8B and 8C:** every path in the §1.4 never-touch list (among them `lib/twitchWhip.ts`, `lib/directorProtocol.ts`, `components/useDirectorPersistence.ts` and `components/DirectorPanel.tsx`), and `components/ReferenceAssetManager.tsx` (§8.2 "Never touch"). A real ON AIR is never pressed.

**Steps (8A), with the proof**
1. `M6: director constants and types` (moves only).
2. `M6: useDirectorSession hook` (moves plus §8.5.4 E1–E8).
3. `M6: presentational components with legacy markup` (moves, §8.5.4 E7 and E11).
4. `M6: useTwitchBroadcast` (§8.5.4 E10).
5. `M6: dev render counters` (§8.5.4 E12).
6. No new test file: step 7 runs the existing `tests/live-extraction.spec.ts` unchanged (§14.3 R12).
7. **Screenshot and DOM parity (§8.5.4 steps 1–4).** The parent is the commit that 8A branched from: `main`, or the open 5C branch when 8A is stacked on it (§14.2).
   1. From the repository root, create the parent worktree outside the repo tree and confirm its commit. The last two commands must print the same hash:

      ```bash
      git fetch origin
      BASE=origin/main   # §1.4: the 8A PR's base branch; origin/devin/m5-5c-effects-morphslider while 5C is open
      : "${BASE:?set BASE (§1.4) in this same shell first}"
      git worktree add ../pre-8a "$(git merge-base HEAD "$BASE")"
      git -C ../pre-8a log -1 --format=%H
      git rev-parse "$(git log --reverse --format=%H "$BASE..HEAD" | head -1)^"
      ```

   2. From the repository root, `cd ../pre-8a/dashboard` (the parent's own `dashboard/`). There, run `npm ci`, then `npm run qa:build`, which writes the parent's route table to `.qa/build.log` for step 10.
   3. Start the parent's dev server there with the §1.6 `env -u` list on port 3107, and run the §1.6 step 2 `/proc/<pid>/environ` check.
   4. From the 8A checkout's `dashboard/`: `WZRD_MILESTONE=6a WZRD_REUSE_SERVER=1 WZRD_LIVE_OUT=.qa/live-before npx playwright test tests/live-extraction.spec.ts --project=desktop-dark --update-snapshots`. While the parent server runs, also run step 9.1's parent half the same way (`WZRD_REUSE_SERVER=1`).
   5. Stop that server and confirm the port is free.
   6. `WZRD_MILESTONE=6a WZRD_LIVE_OUT=.qa/live-after npx playwright test tests/live-extraction.spec.ts --project=desktop-dark`.
   7. `diff -r .qa/live-before .qa/live-after` prints nothing.
   8. The `tests/__screenshots__/desktop-dark/live-*.png` files and `.qa/` are proof artifacts. Paste the results. Both are gitignored (§15.1), so they are never committed: `git status --porcelain` lists neither.
   9. Also, `WZRD_MILESTONE=6a npx playwright test tests/visual.spec.ts` passes with **no** snapshot update in the PR.
8. **admin-testing flow:** run §1.6 by hand, plus `tests/live-control.spec.ts` and `tests/routes.spec.ts` in all four viewport projects: `WZRD_MILESTONE=6a npx playwright test tests/live-control.spec.ts tests/routes.spec.ts --project=desktop-dark --project=desktop-light --project=laptop --project=mobile`.
9. **React commit counts (§15.6):**
   1. On the parent and on 8A, run `tests/perf.spec.ts`'s "DirectorPlayer never commits while idle" (10 s, 0 renders) and "M6a parity" (5 keystrokes, exactly 5 DirectorPlayer renders): `WZRD_MILESTONE=6a npx playwright test tests/perf.spec.ts --project=desktop-dark -g "never commits while idle|M6a parity"`, with `WZRD_REUSE_SERVER=1` for the parent run (step 7.4). Paste both runs.
   2. **Human operator only** (§1.8 item 3): the §8.5.4 step 8 check needs a paid Director session, so Devin never runs it. List it under "Deferred / blocked" as "not run (paid): requires a paid Director session".
10. Run the §8.10 A2–A6 greps. Then, from the 8A checkout's `dashboard/` after `npm run qa:build`, `node scripts/checks/route-sizes.mjs --milestone 6a --compare ../../pre-8a/dashboard/.qa/build.log .qa/build.log` exits 0: no route's First Load grows by more than 1 kB over the parent. (From `dashboard/`, the step 7.1 worktree is `../../pre-8a`.)

**Steps (8B, 8C):** follow §8.5.1's order, with one commit per component or state group. Codemod 10 is its own commit. Each part ends with its snapshot update and after-screenshots; 8B also commits its ready-state captures (§15.10) and then posts the `DESIGN REVIEW` comment (§14.2).

**Closes:**
- 8A: #8.
- 8B: #6, #7, #9.
- 8C: #4, #5.

**Verification:**
- **8A:** `WZRD_MILESTONE=6a`, and the proof above.
- **8B and 8C:** `WZRD_MILESTONE=6b` for:
  - §8.10 B- and C-series;
  - live-control.spec (zero scroll at 1024×768, 1280×800, 1440×900 and 1920×1080; Start Director fully in view at every project size);
  - preserved-contract `/admin`;
  - the full-page a11y check on `/admin` and on `#live-control-visual-test`;
  - canvas-audit (`symbol-raster` holds the slot);
  - perf.spec (the fixture render budget; no long task at 4× with the store on air);
  - contrast;
  - LCP;
  - route sizes (`/admin` ≤ 360 kB);
  - 8B: `tests/unit/diagnostic.spec.ts` in the `unit` project (§8.10 B32);
  - 8C: `tests/whip-truth.spec.ts` (§8.10 C3).

**Definition of done:**
- [ ] 8A: `diff -r .qa/live-before .qa/live-after` prints nothing, `tests/live-extraction.spec.ts` passes at `maxDiffPixels: 0` for idle-dark, idle-light, idle-390 and failed-dark, and the PR contains no snapshot update.
- [ ] 8A: `grep -rnE "set(PingMs|BufferDepth|GenEstimate|ElapsedSeconds|RecordedBytes|Log)\(" components | wc -l` prints `0`, and `wc -l < components/DirectorPlayer.tsx` prints ≤ 320.
- [ ] 8A: both perf.spec commit-count tests pass on the parent and on 8A, with identical numbers.
- [ ] 8A: the step 10 `route-sizes.mjs --milestone 6a --compare` run exits 0, and the parent commit check of step 7.1 printed the same hash twice.
- [ ] 8A: "Deferred / blocked" lists the §8.5.4 step 8 session check as "not run (paid)".
- [ ] 8B: `WZRD_MILESTONE=6b npm run test:e2e` has 0 failed, and `document.scrollingElement.scrollHeight <= innerHeight` holds at 1280×800.
- [ ] 8B: `WZRD_MILESTONE=6b npx playwright test --project=unit tests/unit/diagnostic.spec.ts` passes (§8.10 B32).
- [ ] 8B: from the repository root, `ls docs/redesign/after/m6b/ready-live-{standby,preview,onair}-{dark,light}.png` lists 6 files, and each is a row of the PR's Screenshots table (§15.10).
- [ ] 8B: the 8B PR has a comment whose first line is `DESIGN REVIEW` and which embeds the `live-fixture-*` and `ready-live-*` captures; the 8C PR was opened without waiting for a reply.
- [ ] 8C: `git diff 845147c -- lib/twitchWhip.ts` prints nothing, and `WZRD_MILESTONE=6b npx playwright test tests/whip-truth.spec.ts` passes.
- [ ] 6b: `grep -c 'section\[aria-label="Director"\]' .agents/skills/admin-testing/SKILL.md` (from the repository root) prints `1`.

**Screenshots:**
- 8A: the Screenshots table lists `/admin` at 4 sizes with Before = After (the parity proof).
- 8B: `after/m6b/admin-*.png` (4 projects), plus `after/m6b/live-fixture-<state>-<theme>.png` for idle, acquiring, preview, recording, on air, stalled, stopping and failed, in dark and light.
- 8B: the Live Control ready-state captures (§15.10): `after/m6b/ready-live-standby-{dark,light}.png`, `ready-live-preview-{dark,light}.png` and `ready-live-onair-{dark,light}.png`, each a Screenshots row with the `/admin` baseline as Before.
- 8C: the on-air, stalled and go-live dialog fixture states.

**Risk and rollback:**
- 8A's risk is a behaviour drift hidden in a "move". The DOM diff, the pixel diff, the commit counts and the `--color-moved` review catch it. Revert 8A as a whole.
- 8B's risk is remounting the single `<video>` (§8.10 B3's marker test catches that).
- 8C's risk is a stuck lock. Unmounting DirectorPlayer resets the store (§7.17).
- Reverting 8C leaves 8B working, and `air` can then never reach `on`. That fails safe: there is no false ON AIR.

### 14.13 M7: Shotboard and asset studio

**Goal:** rebuild Shotboard (§9), then Characters, Locations and the fixture (§10), as the chapters' PR sequences define them.

**Prerequisites:** M6's last part (8C) is merged or open; if it is open, stack on it (§1.4).

**Size:** XL (10 PRs; 9D can be cut).

| Part | Branch | Title | Specified by |
|---|---|---|---|
| 9A | `devin/m7-9a-shotboard-states` | `[M7] 9A · Shotboard states and hooks (no visual change)` | §9.2, §9.5.2–§9.5.4, §9.6.1 |
| 9B | `devin/m7-9b-shotboard-layout` | `[M7] 9B · Shotboard layout` | §9.4, §9.5.1, §9.5.5 |
| 9C | `devin/m7-9c-generation-transfer` | `[M7] 9C · Generation frames, model chip, transfer sheet` | §9.5.3, §9.5.4, §9.6.2 |
| 9D | `devin/m7-9d-contact-sheet-reorder` | `[M7] 9D · Contact sheet and drag reorder` | §9.5.6, §9.5.7 (cut-able, §9.11) |
| 10A | `devin/m7-10a-studio-extract` | `[M7] 10A · Studio extraction (pure moves)` | §10.5.1 |
| 10B | `devin/m7-10b-draft-safety` | `[M7] 10B · Draft safety` | §10.5.2 |
| 10C | `devin/m7-10c-studio-parts` | `[M7] 10C · Darkroom, sheet tray, references` | §10.5.7, §10.5.8 |
| 10D | `devin/m7-10d-characters-casting` | `[M7] 10D · Characters "Casting"` | §10.4.1–§10.4.3, §10.5.4, §10.5.5 |
| 10E | `devin/m7-10e-locations-scout-wall` | `[M7] 10E · Locations "Scout wall"` | §10.4.4, §10.4.5, §10.5.6 |
| 10F | `devin/m7-10f-visual-test-fixture` | `[M7] 10F · Asset-studio fixture rebuilt` | §10.5.9 |

**Scope:**
- Every file in §9.2 and §10.2, in its listed PR.
- 9A replaces RouteSkeleton with ShotboardSkeleton in the existing `app/admin/shotboard/loading.tsx` (§14.3 R9).
- 9B deletes Shotboard's interim h1 (§14.3 R4), because its BoardTitle renders the route's h1. 9B also adds `app/styles/shotboard.css` and the ShotboardVisualFixture import and element in the visual-test page (§10.5.9); 10C adds `app/styles/studio.css`. Each stylesheet's line goes at its §5.1 position.
- Codemod 10 runs on every file each PR restyles.
- The chapter-owned specs: `tests/shotboard.spec.ts`, the `tests/unit/*` files §9.2 lists, and the §10.10 checks.

**Out of scope:** any `convex/` change, including D2's backend fix (§17); `ReferenceAssetManager` behaviour beyond §10.5.8; the library and analytics pages.

**Steps:** follow each chapter's PR table. 10A includes §10.5.1's literal check (`lost` and `added` both empty) and pixel-identical `/admin/visual-test` screenshots against the pre-10A commit.

**Closes:** §3.7 #3 (10C, 10D), #16 (9A), #17 (9C, 10C) and #18 (9C). #15 is completed for Shotboard (9A).

**Verification:**
- `WZRD_MILESTONE=6b` on 9A–10E, and `WZRD_MILESTONE=7` on 10F.
- §9.10 and §10.10.
- routes: one h1 on `/admin/characters` and `/admin/locations` from 10F's `WZRD_MILESTONE=7` run.
- The full-page a11y check on the four M7 routes and on `#shotboard-visual-test`.
- Route sizes: shotboard route-specific ≤ 93 kB, characters and locations ≤ 210 kB, and gsap out of their first-load sets.
- visual: the fixture's regression snapshots switch on at 10F.

**Definition of done:**
- [ ] `WZRD_MILESTONE=7 npm run test:e2e` has 0 failed after 10F, including `tests/shotboard.spec.ts` and `WZRD_MILESTONE=7 npx playwright test --project=unit tests/unit`.
- [ ] `node scripts/checks/route-sizes.mjs --milestone 7 .qa/build.log` exits 0.
- [ ] 10A: the literal check prints no `lost` and no `added`.
- [ ] `ls components/shotboard/{ShotCard,SceneSection,SceneSidebar,SceneGallery,CharacterPanel}.tsx 2>/dev/null` prints nothing (§9.2 deletions).
- [ ] `git diff --stat 845147c -- convex` prints nothing.
- [ ] 9B, 10D and 10E: each PR commits its ready-state captures (§15.10) and lists them in its Screenshots table: 9B `ready-shotboard-{dark,light}.png`, 10D `ready-characters-{dark,light}.png`, 10E `ready-locations-{dark,light}.png`. From the repository root, `ls docs/redesign/after/*/ready-{shotboard,characters,locations}-{dark,light}.png` lists at least these 6 names after 10E.

**Screenshots:**
- Shotboard, Characters, Locations and visual-test at 4 sizes, under `after/m7/`.
- The ready-state captures (§15.10), each with its route's §3.6 baseline as Before: `ready-shotboard-{dark,light}.png` (9B: the §9.6.3 board with 3 scenes and 7 shots, one frame generating and one failed), `ready-characters-{dark,light}.png` (10D: @coast selected) and `ready-locations-{dark,light}.png` (10E: the 4:3 contact wall).
- The fixture states `?studio=` running, failed and review, and `?scout=compare`, in dark 1440.

**Risk and rollback:** draft-safety regressions and the sticky-model fix are the risky areas. Their unit specs guard them. Every PR reverts independently. 9D is cut first (§9.11).

### 14.14 M8: Clips, Recordings and Twitch Analytics

**Goal:** the three post-show routes, rebuilt on the §7 primitives with honest states, and the final layout-exact route skeletons.

**Prerequisites:** M7's last part (10F) is merged or open; if it is open, stack on it (§1.4).

**Size:** L.

| Part | Branch | Title |
|---|---|---|
| 11A | `devin/m8-11a-clips-tape-log` | `[M8] 11A · Media foundation and Clips "Tape log"` |
| 11B | `devin/m8-11b-recordings-vault` | `[M8] 11B · Recordings "Tape vault"` |
| 11C | `devin/m8-11c-analytics-meters` | `[M8] 11C · Twitch Analytics "Meter bridge"` |

**Scope:**
- §11.0, §11.A, §11.B and §11.C, with the files in each "Files" table. Per part:
  - **11A:** the media foundation and the §11.0 `lib/format.ts` additions; `app/styles/library.css`; LibraryVisualFixture with its import and element in the visual-test page (§10.5.9); the ClipsSkeleton swap in `clips/loading.tsx`; TallyLight's `fault` and `stale` kinds (§7.4).
  - **11B:** Recordings; the RecordingsSkeleton swap in `recordings/loading.tsx`.
  - **11C:** Twitch Analytics; `app/styles/analytics.css`; AnalyticsVisualFixture with its page line; the AnalyticsSkeleton swap in `analytics/loading.tsx`; `public/fixtures/testcard-{thumb.jpg,avatar.png}`.
- Each new stylesheet's line goes at its §5.1 position.
- Deleting the interim h1s (§14.3 R4), and `RouteSkeleton` in 11C (its last user).
- The `.connection-*` shims are deleted from `app/styles/components.css` with their last call site (11C); `.pixel-card*` stays (§5.18).
- Codemod 10. §15.3 G16 reaches `0` in 11C.
- `tests/library.spec.ts`, `tests/recordings.spec.ts`, `tests/analytics.spec.ts` and `tests/helpers/twitch.ts`.
- The unit specs listed in §11.

**Out of scope:** `app/api/twitch/route.ts`; `convex/*`; any Convex query name or argument (§11.0).

**Closes:** §3.7 #19. #15 is complete: all 7 loading files are layout-exact.

**Verification:**
- `WZRD_MILESTONE=7` on 11A and 11B, and `WZRD_MILESTONE=8` on 11C.
- 11A and 11B also run their pages' full-page a11y tests at `WZRD_MILESTONE=8` (the §14.2 block).
- §11.A.10, §11.B.10, §11.C.10 and §11.D.10 in full.
- Route sizes: clips and recordings route-specific ≤ 45 kB, analytics ≤ 100 kB.
- The full-page a11y check on the three routes and on `#clips-visual-test`, `#recordings-visual-test` and `#analytics-visual-test`.
- preserved-contract: no red `OFFLINE` and no 'Collecting samples…' in the not-configured state.

**Definition of done:**
- [ ] `WZRD_MILESTONE=8 npm run test:e2e` and `WZRD_MILESTONE=8 npm run test:prod` have 0 failed.
- [ ] `test ! -e components/states/skeletons/RouteSkeleton.tsx` succeeds.
- [ ] 11C: `grep -rEo '\bfal-(gray|primary|green|yellow|blue|red)-' app components --exclude-dir=dither-kit | grep -vE '^components/reactbits/[^:]*\.css:' | wc -l` prints `0` (§15.3 G16).
- [ ] 11C: `grep -c '\.connection-' app/styles/components.css` prints `0`. The `.pixel-card*` rules stay (§5.18).
- [ ] `node scripts/checks/route-sizes.mjs --milestone 8 .qa/build.log` exits 0.
- [ ] §11.A.10's budget items pass: no `<canvas>` inside `main` on the Clips fixture, at most 24 cards mount initially, and every `<video>` has `preload="none"`.
- [ ] 11A, 11B and 11C: each PR commits its ready-state captures (§15.10) and lists them in its Screenshots table: 11A `ready-clips-{dark,light}.png`, 11B `ready-recordings-{dark,light}.png`, 11C `ready-analytics-live-{dark,light}.png` and `ready-analytics-not-patched-{dark,light}.png`. From the repository root, `ls docs/redesign/after/*/ready-{clips,recordings,analytics-live,analytics-not-patched}-{dark,light}.png` lists at least these 8 names after 11C.

**Screenshots:**
- Clips, Recordings and Analytics at 4 sizes, under `after/m8/`.
- The ready-state captures (§15.10), each with its route's §3.6 baseline as Before: `ready-clips-{dark,light}.png` (11A: CAPTURING, UPLOADING and FAILED at the top), `ready-recordings-{dark,light}.png` (11B: the rows) and `ready-analytics-live-{dark,light}.png` plus `ready-analytics-not-patched-{dark,light}.png` (11C: LIVE with data, and NOT PATCHED).
- The fixture states for loading, auth and the analytics lamp states (not configured, live, stale), in dark 1440.

**Risk and rollback:** cross-origin Blob downloads (§11.A) and the Analytics chart slot are the risky areas. Every PR reverts independently. Revert 11C before 11A.

### 14.15 M9: Brand finals and final sweep

**Goal:** replace the placeholders with fal art when `FAL_KEY` exists (`brand`): the no-likeness set, or the Coast set when a Coast input exists too (D5). Then delete every deprecated alias and prove the whole spec (`sweep`).

**Prerequisites:** branch from `main` if M8 is merged; otherwise stack both parts on 11C (§1.4). `brand` is never a base for `sweep`, and neither part is a base for the other.

**Size:** M (S when keyless).

| Part | Branch | Title |
|---|---|---|
| brand | `devin/m9-brand-finals` | `[M9] brand · fal brand finals (D5)` |
| sweep | `devin/m9-final-sweep` | `[M9] sweep · Alias deletion and final verification` |

**Scope:**
- **brand:**
  - Only with `FAL_KEY`. The Devin secrets present when M9 starts select the brand mode (§2.1, D5):
    - **Mode 2**, `FAL_KEY` without `COAST_SHEET_URL` or `COAST_REF_URLS`: the no-likeness set of §13.6, marked `likeness:false` in the manifest. It shows the same subjects with props only and no person: the slates (for example a camera with an unlit tally, blank storyboard frames, a VHS stack), the loader (the chrome broadcast remote whose antenna spark becomes a spinning diamond), standby (the empty chrome control booth) and the text-free OG background (booth and carrier art).
    - **Mode 3**, `FAL_KEY` plus `COAST_SHEET_URL` or `COAST_REF_URLS`: the Coast set. Image 1 of every Coast asset is `COAST_SHEET_URL`, used directly; no anchor sheet is generated. Without it, the run generates `coast-brand-sheet-v1` from `COAST_REF_URLS`, posts it as `BLOCKING QUESTION (§1.8 item 4)`, and generates no other Coast asset until the owner comments `APPROVE coast-brand-sheet <n>`. Everything else continues meanwhile, including the no-likeness assets and the `sweep` part.
  - The §13.10 procedure within `--budget-usd 40`.
  - `loader/coast-boot`, the signature loading animation (the boot, every `loading.tsx` and CoastLoader), is made with MiniMax H3 Max (§13.6.2): a GPT Image 2.5 Sunburst still in the loader pose (Coast in mode 3, the prop-only chrome remote in mode 2), transparent or magenta-keyed → `minimax/h3-max/image-to-video` with `end_image_url` equal to `image_url` (locked camera, one simple gesture loop, about 3 s) → ffmpeg extracts 8 evenly spaced frames → the PX quantise → the strip, still and JSON exactly as §13.6.2 ships them (same files, sizes and budgets). When H3 Max is unavailable, or the extracted frames fail the frame-to-frame consistency check, the loader falls back to the Sunburst 4×2 grid of §13.6.2.
  - Variant selection is technical only: dimensions, alpha, palette and quantisation, artifacts, frame-to-frame consistency and composition safe areas. Devin rerolls an asset only on a technical failure or on the owner's PR comment `REROLL <asset-id>`, and never judges likeness (§1.8 item 4).
  - Commit only the files on the §13.10 commit list.
  - The PR body:
    - starts with a "Deviation from request" section whenever a fallback endpoint (§13.2) replaced GPT Image 2.5 Sunburst or MiniMax H3 Max for a shipped asset, one line per asset: `<asset id> → <endpoint used> → <reason>`;
    - carries the contact sheet, the `plan --ledger` total and the endpoint of each asset. In mode 3 the contact sheet shows the PX blue-ramp Coast assets and asks Coast to approve that stylisation. If Coast rejects it, the PX Coast assets are rebuilt with the "PX-natural" quantise (§13.5, §13.6) and the rest of the PX system stays.
  - Devin never merges it. The user merges it; in mode 3, only after the owner and Coast sign off on the likeness and the PX stylisation (D5, D9).
  - Without `FAL_KEY` (mode 1), open no PR. The sweep PR states "Brand art is placeholder (`generated:false`)" under Deferred / blocked.
- **sweep:**
  - Delete the deprecated `fal-*` aliases from `tailwind.config.js` (the §5.15 DEPRECATED block). §15.3 G16 already prints `0` from 11C.
  - Delete the remaining §5.18 shims except `.pixel-card*`, which is permanent.
  - Run the full §15 harness at `9`.
  - Re-check each §3.7 row, with its evidence command or screenshot (§3.8).
  - Run §0.3's definition of done.
  - Write the §17 cut record: which cut-order items were applied, and why.
  - Complete the after-screenshot set, including all 20 ready-state captures (§15.10).
  - Run the Appendix A pass: `node scripts/checks/appendix-a.mjs --verbose --diff 845147c`, with its full output pasted (A.14).

**Out of scope:** new features; D2 and D7 follow-ups (§17); raising the budget cap.

**Closes:** re-verifies §3.7 #1–#20.

**Verification:**
- sweep: `WZRD_MILESTONE=9` for every dev project and `prod`; `npm run gates -- --milestone 9`; route sizes `--milestone 9`; `node scripts/checks/appendix-a.mjs`.
- brand: the §14.2 values (`8` for the harness, the gates and route sizes) plus §13.11, including §13.9 BC-09 provenance.

**Definition of done:**
- [ ] sweep: `npm run gates -- --milestone 9` exits 0, and §15.3 G16 prints `0`.
- [ ] sweep: `node scripts/checks/appendix-a.mjs` exits 0, and the `--diff 845147c` report in the PR lists only literals marked with an A.12 row.
- [ ] `grep -nE "DEPRECATED|fal-(gray|primary|green|yellow|blue|red)" tailwind.config.js` prints nothing.
- [ ] `WZRD_MILESTONE=9 npm run test:e2e` and `WZRD_MILESTONE=9 npm run test:prod` have 0 failed across all projects.
- [ ] Every §0.3 and §3.8 item is ticked in the sweep PR, each with its evidence.
- [ ] sweep: from the repository root, `ls docs/redesign/after/m9/ready-*-{dark,light}.png | wc -l` prints `20`.
- [ ] brand (modes 2 and 3): `npm run brand:check` exits 0, the `plan --ledger` total is ≤ $40.00, `docs/redesign/after/brand-contact-sheet.png` is in the PR, and `public/brand/manifest.json` matches the mode (the §2.4 D5 item).
- [ ] brand: the PR body starts with "Deviation from request" exactly when a shipped asset was produced on a fallback endpoint (§13.2), and each of its lines names the asset, the endpoint used and the reason.
- [ ] brand: every `approve` choice and every reroll in the PR cites a technical check or a `REROLL <asset-id>` comment; no Devin comment judges likeness (§1.8 item 4).
- [ ] brand, mode 3 without `COAST_SHEET_URL`: the `BLOCKING QUESTION (§1.8 item 4)` comment with the generated sheet exists, and in the committed `scripts/brand/spend.jsonl` every line of a Coast asset other than `coast-brand-sheet-v1` has a `ts` later than the owner's `APPROVE coast-brand-sheet <n>` comment.

**Screenshots:**
- sweep: the complete set under `after/m9/`: 8 routes plus the 404, at 4 sizes, plus `boot-post-dark.png`, `boot-post-light.png` and the 20 ready-state captures (§15.10).
- brand: `docs/redesign/after/brand-contact-sheet.png`.

**Risk and rollback:**
- Deleting the aliases can expose a missed legacy class. §15.3 G16 must read 0 before the deletion commit.
- brand spend cannot exceed the $40 cap (§13.3.6 exits 4). Likeness is judged only by the owner and Coast, on the contact sheet before merge; Devin's selections are technical (§1.8 item 4).
- Revert either part independently.

### 14.16 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] Every merged PR's branch and title match §14.2, and each milestone's parts landed in §14.1's order (a part's commits descend from the previous part's). The exception is M9: `brand` and `sweep` share one base and neither descends from the other (§14.15).
- [ ] Every PR body ends with the §14.5 checklist, fully ticked or marked `n/a (<reason>)`.
- [ ] 0A's and 0B's diffs contain only the files their definitions of done list, and 1A's diff touches no file under `dashboard/app`, `dashboard/components`, `dashboard/hooks` or `dashboard/lib`. Each is measured with `git diff --name-only "$BASE"...HEAD` (from the repository root), with `BASE` set per §1.4 to that PR's base branch, so a stacked part never reports its parent's files.
- [ ] 3B landed before 4C: `git merge-base --is-ancestor $(git log --diff-filter=A --format=%H -- components/boot/masks.ts | tail -1) $(git log --diff-filter=A --format=%H -- components/boot/bootScript.ts | tail -1)` (from `dashboard/`) exits 0.
- [ ] The 8A PR contains no `M6: update regression snapshots` commit, and its body shows the empty `diff -r`, both commit-count runs and the `--compare` route-size run.
- [ ] From the repository root, `git show <5C's last commit>:dashboard/components/TrackManager.tsx | grep -c "selectSliderTrack"` prints `0` and `git show <5C's last commit>:dashboard/components/TrackManager.tsx | grep -c "autoplayDelay={6}"` prints `1` (§14.3 R5, D3; under `OVERRIDE D3: autoplay off`, the second prints `0`).
- [ ] Each §3.7 problem is named as `Fixes §3.7 #n` in the PR that §14.1 assigns it to.
- [ ] The sweep PR shows `npm run gates -- --milestone 9` exiting 0 with §15.3 G16 at `0`.
- [ ] No PR's Verification section reports a Director session run by Devin; every such step reads "not run (paid)" (§1.8 item 3).
- [ ] The 5A and 8B PRs each carry a `DESIGN REVIEW` comment with their captures, and the next part (5B, 8C) was opened without waiting for a reply (§14.2).
- [ ] 0A's PR body carries the "Brand generation inputs" note verbatim (§14.6).
- [ ] Every Playwright command in a PR body's Verification section sets `WZRD_MILESTONE` (§15.4).


## 16. Non-negotiables and forbidden actions

This section consolidates the design non-negotiables behind §4 with every hard rule in §5–§13. It outranks every section except Appendix A, and Appendix A ranks with it (§1.2). Line references are **as of 845147c**. Each rule names the check that proves it. Paste the check output under "Verification" in every PR that touches the rule's area. Where a chapter states a rule more strictly than this section does, the stricter version applies.

- **Behaviour changes (§0.4, D10).** A rule tagged `§0.4 BC-<n>` makes a behaviour change beyond visuals. It applies by default. When the owner vetoes that row with `OVERRIDE D10: <BC-id>` (§2.2 D10), the rule is replaced by the 845147c behaviour for that row, and Devin records it under "Decisions". No other rule here yields to D10.
- **IDs are section-scoped (§1).** P, A and N ids are this section's. `§0.4 BC-<n>` is a behaviour change, and `§13.9 BC-<nn>` is a brand check.

- **Working directory (§1.5).** Commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`. No command mixes both forms.
- **Commands in tables.** In tables, `\|` is Markdown escaping for `|`. A table cell names its check by row id; the runnable command is in the fenced block under the table, keyed by the same id.

### 16.1 Performance budgets

| # | Budget | Limit | Check | First enforced |
|---|---|---|---|---|
| P1 | WebGL contexts | Exactly **1** persistent context (the carrier) on every route, plus at most **1** effect canvas per view, granted by `useEffectCanvasSlot` (§7.16). An effect canvas is any WebGL context, or any canvas that loops rAF or covers more than 25% of the viewport. dither-kit texture canvases (DitherButton, DitherGradient, DitherAvatar) are exempt. The Analytics chart is its own slot (`chart`) | §15 canvas and slot audit on all 8 routes: one context, and `window.__wzrd.slots.owner` is `null` or one id; after 10 theme toggles, still one context and zero console messages | M3 (carrier), M4 (slot) |
| P2 | Carrier (`components/reactbits/Dither.jsx`) | ≤ 30 fps, half-resolution backing store, `antialias: false`, paused while `document.visibilityState === 'hidden'`, zero rAF after the first frame under reduced motion, and a theme change tweens colours over 300 ms without recreating the context | The §12.3.1 checks, including: `window.__wzrd.frames.carrier` grows by ≤ 31 per visible second, by 0 while hidden, and by 0 over 2000 ms (after a 1000 ms settle) under `emulateMedia({ reducedMotion: 'reduce' })` | M3 |
| P3 | JS animation loops | One shared ticker (`lib/motion/ticker.ts`) at ≤ 30 fps that stops when it has no callbacks and while hidden. Private rAF only in `Dither.jsx`, `MorphSlider.tsx` (render-on-demand), the HoloCard pointer coalescer and the transient boot script | P3 (block below) lists only `components/reactbits/{Dither.jsx,MorphSlider.tsx,PixelCard.jsx}`, `components/effects/HoloCard.tsx`, `components/boot/{boot.src.js,bootScript.generated.ts}` and `lib/motion/ticker.ts` (`PixelCard.jsx` is the untouched, fixture-only vendored file; the boot's rAF lives in `boot.src.js` and its minified copy, §6.2.1) | M4 |
| P4 | Backdrop blur | No `backdrop-filter` anywhere. The only exception is the fixture-only grayscale in `components/reactbits/ChromaGrid.css:125-126,158-159` | P4 (block below; the same scan as §15.3 G5) prints nothing (baseline hits: `TrackManager.tsx:144`, `MorphSlider.css:39-40,65-66`) | M1 |
| P5 | Animated properties | `@keyframes` and JS-driven animation change only `transform`, `opacity`, stepped `mask-image`/`-webkit-mask-image` and `clip-path`. Never animate `filter`, `box-shadow`, `background-position` or a layout property. Hover and press colour transitions (`transition-colors` at `--dur-fast`) are allowed | P5a and P5b (block below) each print nothing | M1 |
| P6 | Boot overlay (§6.2; §0.4 BC-1) | Removed ≤ **1617 ms** after navigation start (1600 ms at 60 Hz + one frame); repeat-visit channel flip ≤ **257 ms**; reduced-motion static mode ≤ 450 ms; inline boot script ≤ 4096 B gzipped and `BOOT_CSS` ≤ 1536 B gzipped; CLS **0** over 0–2000 ms; zero console output; the first pointer press dismisses the overlay and is swallowed (keys pass through) | The §6.16 boot checks, with the precondition `t0 ≤ 600`: `window.__wzrd.boot.tEnd ≤ 1617` (post), `tEnd − t0 ≤ 257` (flip), no `#wzrd-boot` at 1650 ms, layout-shift sum `0`, the gzip sizes from the served HTML; P6 (block below) exits 0 | M4 (4C) |
| P7 | Live Control CPU | While on air at 4× CPU throttle: no UI-caused long task > 50 ms in any 10 s window. The DirectorPlayer root never commits on the 1 Hz tick; only leaf readouts do. `lib/clock.ts` is the only 1 s timer, and the session ping is the only `setInterval` in Live Control code | §8.10 A3 (no per-second telemetry `set…(` state calls; one `setInterval(` in `useDirectorSession.ts`), B19 (`__wzrd.renders.DirectorPlayer` unchanged over 5 s idle; fixture `LiveFixtureRoot` ≤ 2 renders while `LiveClock` ≥ 5) and C6 (§15.6 'Live Control with the store on air': no long task over 50 ms in any 10 s window at 4× throttle). A trace from a real Director session is Human operator only; Devin records it as "not run (paid)" (§1.8 item 3) | M6 |
| P8 | Network on load | The shell, StatusRail and boot make **zero** network probes. An unconfigured `/admin` load makes zero `/api/*` requests, and every boot response is < 400 | §7.18 (zero `/api/*` requests on unconfigured `/admin`), §6.16 (boot requests) | M4 |
| P9 | Library media | ≤ 24 cards on first render, then "Show more"; `<video preload="none">`; posters through IntersectionObserver with ≤ 4 loads in flight; no PixelCard canvas on Clips or Recordings | §11.A.10 and §11.B.10 checks on the 100-clip fixture: `document.querySelectorAll('video').length ≤ 24`, every `video` has `preload="none"`, zero `canvas` inside `main` | M8 |
| P10 | Fonts | Only the 4 Focal woff2 files and the JetBrains Mono variable font load | After M2, on a fresh `npm run build`: P10a (block below) prints `5`, and P10b prints nothing | M2 |
| P11 | Code splitting | SymbolRaster, HoloCard (which contains HoverClipButton), CommandPalette and MorphSlider load only through `next/dynamic(…, { ssr: false })` | §12.7 code-splitting grep (no static import of the four); P11 (block below) finds each of the four inside a `dynamic(` call | M4 (palette), M5 (effects) |
| P12 | Bundle | `/admin` First Load JS ≤ **360 kB** (baseline 348 kB). Every other route's First Load JS is pasted and compared with §3.5 | The §15.2 route-size check (`scripts/checks/route-sizes.mjs`) and the `npm run build` route table in every PR | M0 (≤ 360 kB); M5 (three.js/gsap leak check) |
| P13 | LCP | Unconfigured `/admin` in prod (§1.6: `npm run qa:build`, then `next start -p 3109` with `ADMIN_AUTH_MODE=edge-only`), desktop: LCP ≤ **1.8 s** | Playwright `PerformanceObserver('largest-contentful-paint')` on the `:3109` server (§8.10 B24) | M4 |
| P14 | Brand assets | Images under `public/brand/` ≤ **2,621,440 B**, video ≤ **6,291,456 B**, and every file within its §13.9 budget. Only `/brand/wordmark/wzrdtech-{160,320}.{avif,webp}`, `/brand/wordmark/wzrdtech-640.webp` and `/brand/loader/coast-boot-strip@2x.png` may load before LCP | `npm run brand:check` (§13.9 BC-01…BC-04, BC-12; P14 in the block below) | M3 (3B keyless build), M9 (`brand` finals) |
| P15 | MorphSlider | Draws only during a tween (including an autoplay step), drag or texture load; `powerPreference: 'low-power'`, `antialias: false`; destroyed contexts are released with `WEBGL_lose_context.loseContext()` after `dispose()`. Autoplay (kept, D3) pauses under the air lock, under reduced motion, while the Dock is collapsed, while the Audio tab is hidden and while the page is hidden | §12.4.1 checks (`__wzrd.frames.morph` flat over 2000 ms idle with the pointer over the slider, so the hover pause holds autoplay; 20 slot toggles print nothing; the autoplay-pause items) | M5 |
| P16 | Effect paint cost | SymbolRaster paint ≤ 16 ms at a 1920×1080 container (unthrottled); GenerationFrame is CSS-only, with JS phase ticks ≤ 4 Hz | §12.3.10 (`performance.getEntriesByName('symbol-raster:paint')`), §6.16 (no `canvas` under `[data-generation-frame]`) | M5 |

Runnable forms of the §16.1 checks (from `dashboard/`):

```bash
# P3: lists only the files named in row P3
grep -rln "requestAnimationFrame" app components lib hooks --exclude-dir=dither-kit
# P4: prints nothing
grep -rnE 'backdrop-(blur|filter)' app components --exclude-dir=dither-kit | grep -v '^components/reactbits/ChromaGrid\.css:'
# P5a: prints nothing
grep -nE '^\s*(width|height|top|left|right|bottom|inset|margin|padding|filter|box-shadow|background-position)\s*:' app/styles/keyframes.css
# P5b: prints nothing
grep -rn '@keyframes' app components --include=*.css | grep -v '^app/styles/keyframes.css'
# P6: exits 0 (boot script size and freshness, §6.2.1)
node scripts/gen-boot.mjs --check
# P10a: prints 5 (after M2, on a fresh npm run build)
ls .next/static/media/*.p.woff2 | wc -l
# P10b: prints nothing
grep -rl '\.otf' .next/static/css
# P11: finds SymbolRaster, HoloCard, CommandPalette and MorphSlider, each inside a dynamic( call
grep -rnE "import\(['\"][^'\"]*(SymbolRaster|HoloCard|CommandPalette|MorphSlider)['\"]\)" app components
# P14: exits 0
npm run brand:check
```

### 16.2 Accessibility (WCAG 2.2 AA)

| # | Rule | WCAG | Check |
|---|---|---|---|
| A1 | Text contrast ≥ 4.5:1; large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1; non-text (control borders, focus ring, lamp and LED faces) ≥ 3:1. Every pair is composited over **#5555AA**, the worst carrier pixel in both themes, through the veil and the surface, in normal and reduced-transparency modes (§5.6) | 1.4.3, 1.4.11 | `tests/contrast.spec.ts` passes all 12 runs; setting light `--c-text-3` to `120 130 150` makes it fail (mutation check, then revert) |
| A2 | No text sits directly on the carrier or veil except display text ≥ 24 px in `text-fg`. Controls and focus rings never sit on the veil | 1.4.3, 1.4.11 | Contrast spec + the §15 screenshot review |
| A3 | Every interactive element shows the global `:focus-visible` outline (2 px `--c-focus`, 2 px offset). No rule removes it. `main#content` (a non-interactive skip target) is the only `focus:outline-none` | 2.4.7 | A3 (block below) lists only `app/layout.tsx` |
| A4 | Focus is never hidden under the sticky CommandBar, OfflineBanner or StatusRail (`scroll-padding`) | 2.4.11 | Playwright Tab-walk on 8 routes at 1440×900 and 390×844: the focused element's box never intersects the `banner` or `contentinfo` box |
| A5 | Targets ≥ 24×24 CSS px; ≥ 44×44 on `(pointer: coarse)` | 2.5.8 | axe `target-size`; a Playwright box check of every `button, a, [role=button], input, select, summary` at 1440 and in a `hasTouch` context |
| A6 | Everything works from the keyboard. The only focus traps are modal `<dialog>`s, which close on Escape and return focus to the element that opened them | 2.1.1, 2.1.2 | §7.18 palette and dialog checks; §8.10 B9, B21 |
| A7 | No global single-character shortcut, no ⌘⇧L and no ⌘. chord. Letter keys (G, J/K/L, X, Space) act only while their canvas, card or chart has focus. The palette and ShortcutSheet list every shortcut | 2.1.4 | §7.18: pressing each of `r f m c ? l .` on `/admin` with `body` focused changes neither the URL, the open dialogs nor the store |
| A8 | Every drag has a button alternative ('Move shot earlier', 'Move shot later', 'Move scene up', 'Move scene down'). Every hold has a click-to-confirm alternative ('Go live on Twitch' → ConfirmDialog) | 2.5.7, 2.5.1 | §9.10 keyboard and button checks; §6.16 HoldButton check |
| A9 | `prefers-reduced-motion` is honoured everywhere; `prefers-reduced-transparency: reduce` makes surfaces opaque (`--a-panel` 1, veil .80); `prefers-contrast: more` is honoured | 2.2.2, 2.3.3 (adopted) | §6.16: no running infinite animation 1000 ms after load under reduced motion; §5.21 reduced-transparency values |
| A10 | At most **one** blinking element in the system: the STALLED ingest lamp, at 1 Hz for ≤ 5 cycles, then steady. CUE is steady, and a queued GenerationFrame is static. Nothing flashes more than 3 times per second | 2.2.2, 2.3.1 | §6.16: `document.getAnimations().filter(a => a.animationName === 'led-stall')` has length ≤ 1 with `iterations === 5` |
| A11 | The skip link comes first ('Skip to content' → `#content`). One `banner` (CommandBar), one `navigation` named 'Admin sections', one `main#content`, one `contentinfo` (StatusRail). **Exactly one `h1` per route**, including 404, error and loading fallbacks. `document.title` follows §7.7 | 1.3.1, 2.4.1, 2.4.2, 2.4.6 | §7.18 shell checks; `document.querySelectorAll('h1').length === 1` on every route and state |
| A12 | Lamps and LEDs always carry text (visible or sr-only), and colour is never the only signal. An LED button's accessible name equals its visible text. IconButton requires `label` | 1.4.1, 2.5.3, 4.1.2 | axe; §7.18 LED name check ('CONVEX · NOT PATCHED') |
| A13 | Preserved accessible names are byte-identical (Appendix A). No preserved control is duplicated by role and name: no new button or link is named 'Cancel', 'Stop', 'Stop broadcast', 'Go live on Twitch', 'Start Director' or 'Record'. ConfirmDialog's default cancel label is 'Dismiss', the action of the stalled chyron and of the cue warning chyron ('Twitch ingest not confirmed') is 'End broadcast', and palette rows are `role="option"` and exist only while the palette is open (§7.11). No hint repeats a preserved label | 4.1.2 | §8.10 B4, C4; §7.18 `getByRole('button', { name: 'Cancel' })` check; A13 (block below) prints nothing |
| A14 | One polite (`#live-polite`) and one assertive (`#live-assertive`) live region. Notices use `role="status"` and errors `role="alert"`. Existing roles survive a move into chyrons. Per-second counters sit in `aria-hidden` spans | 4.1.3 | §7.18; axe |
| A15 | Text effects keep the final text in the DOM; effect layers are `aria-hidden` | 1.3.1 | §12.3 per-pick checks |
| A16 | No `text-transform` is added to or removed from a preserved string. New uppercase copy is written in uppercase in the source | 1.3.1 (and the Appendix A contract) | `node scripts/checks/uppercase.mjs` exits 0 (allowlist total ≤ 9; the file and its sites are §5.20.5) |
| A17 | Every input has a programmatic label (`<label htmlFor>`, or an `aria-label` equal to its existing `title`). Errors render inline with `role="alert"` next to their trigger | 1.3.1, 3.3.1, 3.3.2 | axe `label`; §8.8, §9.8, §10.8 checks |
| A18 | At 390 px there is no page-level horizontal scroll: `document.scrollingElement.scrollWidth <= innerWidth` on all 8 routes (the mobile nav strip and Shotboard lanes scroll internally) | 1.4.10 | Playwright at 390×844 |
| A19 | `@axe-core/playwright` reports 0 serious and 0 critical violations on 8 routes × dark, light and 390 px, plus `/admin/does-not-exist` and the error probe | all | §15 a11y suite |

Runnable forms of the §16.2 checks (from `dashboard/`):

```bash
# A3: lists only app/layout.tsx
grep -rnE "focus:(ring|outline-none)" app components --exclude-dir=dither-kit
# A13: prints nothing
grep -rn 'cancelLabel="Cancel"' app components
# A16: exits 0
node scripts/checks/uppercase.mjs
```

### 16.3 Security and secrets

1. **`FAL_KEY`** exists only in the server environment (a Cloudflare Pages secret) and, for `dashboard/scripts/brand`, only in the process environment (a Devin secret). It is never written to any file, including `dashboard/.env.local`, which never exists (§1.6 step 0). It never appears in a tracked file, commit, PR body, log line, screenshot, `NEXT_PUBLIC_*` variable, `wrangler.toml` `[vars]` or `.env.production`. Check: the §2.4 `git log -p` grep prints nothing, and `grep -rnE "NEXT_PUBLIC_[A-Z_]*FAL" dashboard --exclude-dir=node_modules` prints nothing.
2. **Browser → fal** goes only through `/api/fal/sdk-proxy` (`FAL_SDK_PROXY_URL`, `lib/directorProtocol.ts:4`) and `/api/fal/proxy`. App code creates fal clients only as `createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })`. Check: `grep -rnE "createFalClient\(" app components lib hooks` shows `proxyUrl` on every hit, and `grep -rnE "credentials:|fal\.config\(" app components lib hooks | grep -i fal` prints nothing.
3. **Only `dashboard/scripts/brand/fal.mts`** imports `@fal-ai/client` with credentials, and no file under `app`, `components`, `hooks` or `lib` imports from `scripts/`. Check: the §13.11 greps.
4. **Coast inputs.** The `COAST_SHEET_URL` value, `COAST_REF_URLS` values and uploaded reference URLs are never printed or committed: the user's sheet appears only as `sheet-url (sha256:<8>)` and each reference as `ref-<n> (sha256:<8>)` (§13.3.7). The downloaded user sheet (`scripts/brand/.cache/refs/anchor/coast-sheet-user.png`), raw references, the generated master sheet `coast-brand-sheet-v1`, raw fal outputs and `scripts/brand/.cache/**` never enter `public/`, `app/` or git. Devin never places, copies or downloads files into `scripts/brand/.cache/refs/` (the pipeline's own `url-<n>` downloads and `refs/anchor/` files are the exception) and never passes `--operator-refs`; only a human operator running the pipeline outside Devin does (§13.4). `COAST_SHEET_URL` is Image 1 of every Coast asset when present; the rule against using a previously generated sheet as an identity reference covers only automatic sheet history (`referenceAssets`, `.cache/raw`), never this user-designated sheet (§2.1, §13.4). Check: §13.9 BC-08 and BC-09 pass; `git ls-files dashboard/scripts/brand/.cache` prints nothing; `grep -rlE "coast-brand-sheet-v1|coast-sheet-user|/\.cache/" dashboard/public dashboard/app` prints nothing.
5. **Ignore rules first.** Append `scripts/brand/.cache/` to `dashboard/.gitignore` before the first `brand:gen`. Never create `dashboard/.env.local`. Check: `test ! -e dashboard/.env.local` succeeds before any QA server, `npm run test:e2e` or `npm run test:prod` starts (§1.6 step 0).
6. **Redaction.** Every brand-script console line, thrown message and ledger write passes through `redact()` (`Key …` → `Key [REDACTED]`). Redact `Key …` in any error text quoted in a PR.
7. **Twitch stream key.** It stays in `localStorage['wzrd_twitch_auth']` in today's `{login, streamKey}` shape. New code never logs it, never renders it, and never sends it anywhere except the WHIP ingest, through the untouched `lib/twitchWhip.ts`. The StatusRail only tests whether it is present (a try/catch parse; the value is never displayed). Check: `grep -rn "streamKey" components lib hooks` lists only `TwitchBroadcast.tsx`, `components/director/useTwitchBroadcast.ts`, `lib/twitchWhip.ts` and the StatusRail presence check.
8. **Untrusted text** (chat lines, author names, Twitch titles, prompts, fal and server error bodies) renders as text only. `dangerouslySetInnerHTML` appears only in `app/layout.tsx` (`themeInit`) and `components/boot/BootMarkup.tsx` (compile-time constants). Check: `grep -rln dangerouslySetInnerHTML app components --exclude-dir=dither-kit` lists exactly those two files.
9. **The auth boundary is unchanged.** `middleware.ts`, its matcher and 401 strings, and the five `app/api/**` routes stay byte-identical. The new routes (`/manifest.webmanifest`, `/icon.svg`, `/apple-icon.png`, `/opengraph-image.png`, `/twitter-image.png`, `/brand/**`, `/fixtures/**`) are static files that expose no data. Check: the §1.4 never-touch diff, and the §1.6 step 5 `401`/`200` pair.
10. **QA environment.** Never set `CF_ACCESS_*` locally. Unconfigured QA runs with the server environment verified through `/proc/<pid>/environ` (§1.6 step 2). Configured QA runs only against a non-production Convex deployment that the user names in writing, never the one in `.env.production` or `wrangler.toml`.
11. **Dependencies (D8, §2.2).** No new runtime dependency. devDependencies may add only `@playwright/test` 1.56.1, `@axe-core/playwright` 4.13.0, `sharp` 0.34.5 and `postcss-import` 15.1.0 (already installed through tailwindcss, §5.1), each justified in the PR that adds it: 1A adds the two Playwright packages, 1B adds `postcss-import`, 3B adds `sharp`. Each is saved as an exact version, with no `^` (`npm i -D -E …`, §14.7, §14.9). `ffmpeg-static` is installed with `npm i --no-save` only and never saved (§13.3.2, §16.6 N19). No `install`, `postinstall` or `prebuild` script is added. Check: the §12.7 D8 `node -e` script exits 0, and `git diff 845147c -- dashboard/package.json` adds no other key under `devDependencies`.

### 16.4 Platform (Cloudflare Pages, next-on-pages, edge)

1. The deploy target stays Cloudflare Pages through `@cloudflare/next-on-pages` 1.13.16 (`npm run pages:build`). `next.config.js`, `wrangler.toml` and `.env.production` are unchanged. Run `npm run pages:build` in the 4D PR (the last M4 part) and the M9 `sweep` PR, and paste its last 40 lines. If the sandbox cannot run it, say so under "Verification" and rely on items 2–4.
2. All five API routes keep `export const runtime = 'edge'` (`app/api/auth/convex/route.ts:3`, `app/api/fal/sdk-proxy/route.ts:3`, `app/api/fal/proxy/route.ts:4`, `app/api/twitch/route.ts:4`, `app/api/twitch/connect/route.ts:4`). They are never edited.
3. **No Node-only API** in `middleware.ts`, any `layout.tsx`, `template.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `app/manifest.ts`, or any file under `app/`, `components/`, `hooks/` or `lib/`. Node-only code lives only in `scripts/`, which `tsconfig.json` excludes. Check: `grep -rnE "from ['\"](node:[a-z_/]+|fs|fs/promises|path|child_process|os|crypto|stream|zlib)['\"]|require\(['\"](fs|path|child_process)['\"]\)|__dirname|process\.cwd\(" app components hooks lib middleware.ts` prints nothing.
4. **Routes stay static.** No new server component reads `headers()`, `cookies()`, `draftMode()` or `searchParams`, and no page or layout exports `dynamic` or `revalidate`. Only the untouched `app/api/twitch/route.ts:5` and `app/api/twitch/connect/route.ts:5` export `dynamic = 'force-dynamic'`. Under next-on-pages, a dynamic page would need `runtime = 'edge'`. Check: `grep -rnE "from 'next/headers'|export const (dynamic|revalidate)" app | grep -v '^app/api/'` prints nothing, and the build route table shows `○` for every page and metadata route and `ƒ` only for the five `/api/*` routes (baseline: all 10 pages `○`).
5. **Fonts** load only through `next/font/local` (Focal, `app/fonts.ts`) and `next/font/google` (JetBrains Mono). After M2, no `@font-face` remains in CSS.
6. **Images.** Convex and fal media stay `<img>`/`<video>` with the existing eslint-disable comments. Do not add `images.remotePatterns` or use `next/image` for remote URLs. Brand art uses `<picture>` with explicit `width`/`height`, from static files under `/brand/**`.
7. **Build semantics.** `NEXT_PUBLIC_*` values are inlined at build time, and `next build` loads the committed `.env.production` for every variable missing from the process (§1.6 pitfalls). `BootMarkup`'s `convexConfigured` is decided at build time from `process.env.NEXT_PUBLIC_CONVEX_URL`.
8. **No pipeline in the build.** Never add `prebuild`, `postinstall` or `pages:build` hooks that call `scripts/brand`. `brand:gen` never runs inside `next build`, CI or the browser.
9. **Progressive platform features** are feature-detected:
   - `corner-shape` only under `@supports (corner-shape: squircle)`;
   - `requestVideoFrameCallback` with the `loadeddata`/`playing` fallback (§8.5.6);
   - every mask rule written with both `mask-*` and `-webkit-mask-*`, including `-webkit-mask-composite: source-in` beside `mask-composite: intersect`;
   - `prefers-reduced-transparency` treated as optional (the contrast ledger already passes without it).

### 16.5 Live-broadcast safety

1. **Truthful lamps.** PVW lights only after the first decoded frame (`firstFrame`, the `requestVideoFrameCallback` gate), and REC only while a recorder runs. ON AIR (the red face, the `● ON AIR · stream.wzrd.tech admin` title and `/brand/icons/favicon-onair.svg`) shows only while `air === 'on'`. `useWhipTruth` sets it from `getStats()` (`bytesSent` advancing on a `connected` peer), never from a click (§0.4 BC-7). `cue` and `stalled` never read ON AIR. Red (`--c-tally-program`, `#FF3B30`) means public and nothing else, so NOT PATCHED is never red. Check: §8.10 C1, C3 (`tests/whip-truth.spec.ts`); §11.C lamp-precedence unit tests.
2. **Go live.** 'Go live on Twitch' is a HoldButton (600 ms; §0.4 BC-5). A click, a short press or an assistive activation opens the ConfirmDialog 'Go live on Twitch?'. The button is `aria-disabled` unless the monitor is in preview, a stream key is ready and the first frame has arrived (DEC-8-03, §0.4 BC-6). At most one 'Go live on Twitch' button and one 'Stop broadcast' button exist. Check: §8.10 C4; §6.16 HoldButton check.
3. **Never press 'Go live on Twitch' with a real stream key**, in QA, tests, fixtures or screenshots. Automation exercises Go live only in the fixture with its commit stub, and never types a real key into 'live_… stream key'.
4. **No paid call on mount, in CI or in tests.**
   - Every fal and GMI call sits behind an explicit click.
   - `/admin/visual-test` requests only same-origin static files.
   - QA servers run without `FAL_KEY` (verified through `/proc/<pid>/environ`) and with no `dashboard/.env.local` (§1.6 step 0), so 'Start Director' cannot open a paid session.
   - Every automated test that clicks 'Start Director' first installs `page.route('**/api/fal/**', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"qa-stub"}' }))` (§15).
   - Devin never runs a live Director session. Every step that needs one is "Human operator only" and is recorded as "not run (paid)" (§1.8 item 3).
   - `brand:gen` exits 5 under CI and 3 without `FAL_KEY`. The only CI exception is a D5 operator who passes `--allow-ci` on the command line and says so in the PR.
   - Brand spend stays ≤ $40 (D5).
   
   Check: the §10.10 and §11 network gates; the §13.11 CI refusal checks.
5. **Air lock** (§0.4 BC-2). `html[data-lock="air"]` is set whenever `deriveBroadcast(s) !== 'idle'` or REC is active (§7.17). Under the lock:
   - density, dock height and panel sizes are frozen;
   - only `[data-air-allow]` elements animate;
   - route transitions, skeleton sweeps, CountUp, DecryptedText (except CONNECT_STEPS), HoloCard, HoverClip and BrandVideo are frozen, and MorphSlider autoplay pauses on the slide shown (§6.12);
   - info, success and warning chyrons go to the StatusRail. The one exception is BroadcastProvider's cue warning chyron 'Twitch ingest not confirmed', pushed with `airAllow: true`, which floats with `data-air-allow` so its actions stay reachable (§6.7, §6.10);
   - a `beforeunload` guard is active, and the mouse back and forward buttons are blocked (§0.4 BC-4).
   
   Check: §6.16 lock checks (including the MorphSlider autoplay item and the "Cue not confirmed" item); §8.10 C2.
6. **Leaving Live Control under the lock** opens the ConfirmDialog 'Leave Live Control?' with 'Leave and stop' and 'Stay'. 'Leave and stop' runs the full `disconnect()` before navigating (DEC-8-07, §0.4 BC-3).
   > Note: the confirm awaits `broadcast.leave()`, which runs the `disconnect()` that DirectorPlayer registers with `broadcast.setLeaveHandler` (8C), and only then calls `router.push(href)` (§6.12). The unmount path alone (`DirectorPlayer.tsx:1034-1043`) stops the recorder without uploading the recording, so it never ends a session on its own. DEC-8-07 keeps the preserved teardown order and saves the recording.
7. **Session continuity.** DirectorPlayer never unmounts on `/admin` (Tabs `keepMounted`, CSS hiding, hidden panels). Exactly one `<video ref={videoRef} autoPlay playsInline muted>` stays mounted and is never remounted, in every state and at every breakpoint. One stable output MediaStream feeds preview, both recorders and WHIP. DirectorPlayer's unmount calls `broadcast.reset()`, so the lock never outlives Live Control. Check: §8.10 B3 (the `__lc` marker survives a failed start and resizes).
8. **One stop path.** 'Stop', 'Cancel', Escape while connecting, the palette's 'Stop' and 'Leave and stop' all call the same `disconnect()`, whose order is preserved: `clipClosing` → `flushClip` → `stopRecorder` → `send({type:'stop'})` + `close` → upload the recording → `setSessionStatus('ended')` (`DirectorPlayer.tsx:860-905`). 'Stop' is click-guarded while `closing` (DEC-8-02). While `air ∈ {on, stalled}`, 'Stop' first opens the §8.9.6 'Stop the Director?' dialog, whose 'Stop and end broadcast' runs the same `disconnect()` (DEC-8-14). Both guards are §0.4 BC-11.
9. **`primeMusic(config)`** runs synchronously inside the 'Mix in output' click, before any `await` (`DirectorPlayer.tsx:1332-1338`). Check: §8.10 B27.
10. **The artwork carousel never arms a track** (D3; DEC-8-04, §0.4 BC-15; DEC-8-10, §0.4 BC-14). Autoplay stays (`autoplay`, `autoplayDelay={6}`), and the carousel is display-only: no slide change (autoplay, 'Previous song artwork' or 'Next song artwork', a 'Show {caption}' tab, a drag, ←/→) writes the armed track. `onIndexChange` records only the slide shown (from 8B, `onIndexChange={setShownIndex}` in `TrackManager.tsx`; 5C already removes the arming handler). A track is armed only through the 'Armed track' radiogroup, whose first radio 'No track' disarms, or through the 'Arm this track' button on the current slide (§8.5.10). Autoplay pauses under the air lock, under reduced motion, while the Dock is collapsed, while the Audio tab is hidden and while the page is hidden (§12.4.1). The visual-test fixture keeps `autoplay autoplayDelay={6}` and arms only through its own 'Arm this track' (10F, §10.5.9). Check: §8.10 B12 and B33; the §10.10 fixture display-only item; N18 (§16.6).
11. **Ingest not confirmed, and ingest loss.** No timeout ever tears a broadcast down (§0.4 BC-7).
    - While `air === 'cue'`, only `connectionState === 'failed'` (the WebRTC session is already dead) or a thrown negotiation gives `off` and calls `onNegotiationFailed()`.
    - `connectionState === 'disconnected'`, or no truth gate within 10 000 ms of the WHIP session arriving (`cueSince`), keeps `air === 'cue'` and sets `cueUnconfirmed`. The TallyBar ON AIR lamp reads the steady, counting `CUE {MM:SS}` (no blink), and BroadcastProvider pushes one sticky `role="status"` warning chyron, 'Twitch ingest not confirmed', with the action 'End broadcast' (it runs `twitch.stop`) and the dismiss control 'Dismiss'. The truth gate can still take the cue to `on`. The transport keeps 'Stop broadcast' (§6.7, §8.5.6).
    - Ingest loss while on air shows the STALLED lamp (the one allowed blink); one sticky `role="alert"` chyron, 'Twitch ingest lost', with the action 'End broadcast' (pushed once, by BroadcastProvider; the action runs `twitch.stop`, which `useTwitchBroadcast` registers); and the TWITCH LED in danger. Recovery announces 'On air again'.
    
    Check: §8.10 C1, C3 (`tests/whip-truth.spec.ts`: `cue` + `failed` → `off`; `cue` + `disconnected`, and `cue` with no gate after 10 000 ms, → `cue` with `cueUnconfirmed`; after 60 000 ms still `cue`) and C8; the §6.16 "Cue not confirmed" item.
12. **Twitch OAuth completes on mount.** `useTwitchBroadcast` runs in DirectorPlayer at page load, so `/admin?code&state` completes and is stripped with `history.replaceState`. The broadcast auto-stops when the Director session ends (the `opRef` invalidation).
13. **Chat safety.**
    - Author names are stripped of `[\]<>\n\r@` and cut to 32 characters.
    - Text is stripped of `\n\r<>` and cut to 300 characters.
    - Directions are prefixed `[chat @user]` (`DirectorPlayer.tsx:849-858`).
    - Direction throttles stay 2 s global and 8 s per user (`ChatSteerer.tsx:96,98`), and `!frame`/`!snap` are throttled 10 s global, 8 s per user (DEC-8-13, §0.4 BC-13).
    - The default prefix stays `!direct`, and `!frame`/`!snap` capture a frame.
    - Chat text never renders as HTML.

### 16.6 Forbidden actions

Each row is a **NEVER**. A PR that does one of these is rejected, whatever else it does well.

| # | Never | Why | Check that catches it |
|---|---|---|---|
| N1 | Edit any file in `dashboard/components/dither-kit/` or `dashboard/dither-kit.json`, or change the `@dither-kit` entry in `dashboard/components.json` | The files are sha256-locked, and a registry reinstall would also revert the `scales.ts` crash fix (commit `16af204`) | The §1.4 never-touch check prints nothing; N1 (block below) prints nothing |
| N2 | Reinstall Dither (or install anything) from a registry (`npx shadcn add`, `jsrepo`, any React Bits CLI), fetch source from reactbits.dev, arlan.me or their mirrors, or add a `registries` entry | The registry Dither brings back `@react-three/fiber`, whose reconciler conflicts with the bundled React (`Dither.jsx:1-4`). Every CSV prompt forbids copying. The CLIs rewrite config silently | §12.7: N2 (block below) prints nothing (the first 4 lines of `Dither.jsx` equal 845147c's); the registry-string grep prints nothing |
| N3 | Add `@react-three/*`, `ogl`, `postprocessing`, `mathjs`, `cmdk`, `matter-js`, `meshline`, `lenis` or `@use-gesture/react`, register `tailwindcss-animate`, or add any other runtime dependency | D8; the bundle and GPU budgets (P1, P12). The native-`<dialog>` palette replaces `cmdk` | The §12.7 D8 script; N3 (block below) prints nothing |
| N4 | Create a WebGL context outside `components/reactbits/Dither.jsx` and `MorphSlider.tsx`, or call `renderer.forceContextLoss()` | P1. `forceContextLoss` logs "THREE.WebGLRenderer: Context Lost." and breaks the clean-console rule | §12.7 WebGL-creator grep; N4 (block below) prints nothing |
| N5 | Use `backdrop-filter` / `backdrop-blur` (except the fixture-only `ChromaGrid.css` grayscale) | It re-blurs the animating carrier every frame and smears the pixel grid | P4 (§16.1) |
| N6 | Add a second full-screen background: another React Bits Background, a Noise/grain layer, a glow or gradient field, a full-viewport canvas or video, or an opaque full-page layer over the carrier. Only `app/global-error.tsx` may be opaque, because it renders after the root layout has failed | The carrier is the one field (§4.5), and a second one costs GPU during WebRTC decode | Canvas audit (P1); after boot, no element other than the DitherBackground host is `position: fixed` and covers ≥ 90% of the viewport (an open `<dialog>`'s `::backdrop` is excepted) |
| N7 | Add or remove `text-transform`/`uppercase` on a preserved string | It changes the accessible and copied text of a preserved string (§4.4.2 G6) | N7 (block below) exits 0 |
| N8 | Change a preserved string, aria-label, `title`, placeholder, id, class, storage key, URL parameter, Convex name or argument, or fal id that is not in Appendix A.12 | D6; admin-testing and other agents key on them | N8 (block below; the Appendix A check, A.14) exits 0. A §1.8 item 1 BLOCKING QUESTION is the only way to change one |
| N9 | Gender Coast in code, prompts, comments, commits or PR text | D9: Coast is likely a real performer | N9 (block below) prints nothing; the §4.6 diff review |
| N10 | Commit `FAL_KEY`, the `COAST_SHEET_URL` value, `COAST_REF_URLS` values, the downloaded user sheet (`coast-sheet-user.png`), raw references, `coast-brand-sheet-v1`, raw fal outputs, `.env.local` (which never exists, §16.3 item 5), `.next/`, `scripts/brand/.cache/`, `.qa/` or the 8A proof captures `tests/__screenshots__/desktop-dark/live-*.png` | §16.3; the likeness gate | §2.4 greps; §13.9 BC-08, BC-09, BC-11; N10 (block below) prints nothing |
| N11 | Change `dashboard/convex/**`, `middleware.ts`, `app/api/**`, `lib/twitchWhip.ts`, `lib/directorProtocol.ts`, `wrangler.toml`, `.env.production`, or anything under `streaming_pipeline/`, `pyproject.toml` or `requirements.txt` | Backend, auth and protocol contracts are out of scope (D2, D7), and `.env.production` affects builds | The §1.4 never-touch check; N11 (block below) prints nothing |
| N12 | Delete, rename or modify any file in `dashboard/fonts/focal/` | D4 | N12a (block below) prints `7`, and N12b prints nothing |
| N13 | Bind a global single-character shortcut, ⌘⇧L or ⌘. | WCAG 2.1.4. Safari binds ⌘⇧L, and ⌘. stops page loads (§4.4.3 O5) | §7.18 keypress check |
| N14 | Unmount DirectorPlayer or remount the Director `<video>` while on `/admin`, or render the `<video>` conditionally | Unmounting ends the session; a remount drops `srcObject` and the stream (live.md L9, L12) | §8.10 B3 |
| N15 | Merge your own PR, push to `main`, force-push a shared branch, or combine milestones in one PR | §1.4; review and screenshot diffs per milestone | Branch regex and PR history (§1.10) |
| N16 | Make a paid call on mount, in CI, in a test or in a fixture; run `brand:gen` outside the D5 procedure; raise `--budget-usd 40`; or put `--allow-ci` in any file | Spend control (D5); unconfigured QA must never spend | §16.5 item 4 checks; N16 (block below) finds it only in the argument parsing of `scripts/brand/*.mts` |
| N17 | Press 'Go live on Twitch' with a real stream key, set `CF_ACCESS_*` locally, or run configured QA against the production Convex deployment | Twitch output is public; production data is real | The PR's "Verification" states the QA environment (§1.6); reviewers reject a PR whose logs show otherwise |
| N18 | Let the artwork carousel write the armed track (an `onIndexChange` handler that arms the slide shown, such as the 845147c `selectSliderTrack`), or remove its autoplay without `OVERRIDE D3: autoplay off` | At 845147c autoplay re-arms the operator's track every 6 s (§3.7 #1). The fix is display-only arming, not removing the autoplay the owner shipped in `b45e1ea` (D3; §0.4 BC-15) | N18a, N18b and N18c (block below) print nothing (they do not apply under `OVERRIDE D10: BC-15`); N18d prints a count of at least `1` for each file (`0` for each under `OVERRIDE D3: autoplay off`) |
| N19 | Import app code into `scripts/brand`, import `scripts/` from app code, save `ffmpeg-static` to `package.json`, or add `tsx`, `ts-node` or a loader | Pages builds would download the ffmpeg binary on every `npm ci`, and Node type stripping needs none of these (§13.3.2) | §13.11 greps and the `package.json` check |
| N20 | Generate exact letterforms (the wordmark, "WZRD", the 404 digits, OG text); generate a Coast likeness from anything but the user-designated `COAST_SHEET_URL` or the Coast-approved `COAST_REF_URLS` (§2.1); generate any other Coast asset from a generated `coast-brand-sheet-v1` before the owner's `APPROVE coast-brand-sheet <n>`; put a person in a no-likeness asset (`likeness:false`); ship a human-looking placeholder; or judge likeness when selecting a variant | §4.4.2 G17; the D9 likeness gate (§1.8 item 4: Devin selects by technical checks only, and the owner and Coast judge likeness); the UI never shows a fake likeness | `approved.json` provenance (§13.9 BC-09); placeholders are non-human and `generated:false`, and no entry has `likeness: true` while `approved.json` `sheet` is `null` (§13.9 BC-15); the §14.15 `APPROVE` timestamp check; the owner and Coast review the contact sheet |
| N21 | Add `console.*` to new code. The preserved `console.error('Failed to record twitch sample', e)` and `console.warn('shotboard template picker unavailable:', …)` stay | The admin-testing console contract (§1.6) | N21 (block below) prints lines from `components/analytics/ConvexHistory.tsx` only |
| N22 | Use `Loader2`, `animate-spin` or `animate-pulse`, raw palette or violet classes, `fal-*` classes or hex colours in new components. Hex is allowed only in `app/global-error.tsx`, the documented SymbolRaster screen-ink constants and generated brand files | One loader grammar (BayerSpinner, CoastLoader) and one token system (§5) | The §15 grep gates; the §7.18 token grep over `components/{ui,broadcast,states,generation,shell,brand}` |
| N23 | Write an un-layered CSS rule, a `.css` file outside `app/styles/` (the vendored `components/reactbits/*.css` and the two `*.module.css` effect files are excepted), `@apply sq`, or `@keyframes` outside `app/styles/keyframes.css` | The cascade fix (§5.1) | N23 (block below) exits 0; the §5.21 greps |
| N24 | Create `app/favicon.ico`, or delete `public/wzrdtechlogo.png` | Both favicon files would serve `/favicon.ico`, and the PNG is the only wordmark source for derived assets | §13.9 BC-11; N24 (block below) succeeds |
| N25 | Delete a D1 file without re-running its import grep, or delete `components/ViewerChart.tsx`, `components/ImageGenerationControls.tsx` or the vendored `AccordionGallery`, `ChromaGrid` or `PixelCard` files | D1: anything with a live importer stays, and the vendored files remain fixture specimens (§12.4) | The 0A PR's evidence block (§2.4); Appendix B.3 |
| N26 | Mount a Convex hook or make a network request on `/admin/visual-test`, or remove its production `notFound()` | states.md S12 (§11.0 ST-6): the fixture must run with no Convex and no network | §10.10 network gate; N26 (block below) shows the unchanged line |
| N27 | Weaken a check in `.agents/skills/admin-testing/SKILL.md`, or remove its front matter or its "Devin Secrets Needed" section | §1.9 | PR review of the SKILL diff |
| N28 | Ask the user anything outside the four §1.8 items, or wait for a secret | §1.7, §2.1. The 0A PR body's "Brand generation inputs" note (`FAL_KEY`, `COAST_SHEET_URL` or `COAST_REF_URLS`, and what each unlocks) is information, not a question, and nothing waits for it (§14.6) | §1.10 |

Runnable forms of the §16.6 checks. From `dashboard/`:

```bash
# N3: prints nothing
grep -rnE "from ['\"](ogl|@react-three/|postprocessing|mathjs|cmdk|matter-js|meshline|lenis|@use-gesture/)" app components
# N4: prints nothing
grep -rn "forceContextLoss" app components
# N7: exits 0
node scripts/checks/uppercase.mjs
# N8: exits 0
node scripts/checks/appendix-a.mjs
# N18a (from 5C): prints nothing (the 845147c handler that armed the slide shown is gone)
grep -n "selectSliderTrack" components/TrackManager.tsx
# N18b (from 5C): prints nothing (from 8B the only handler is setShownIndex, which records the slide shown)
grep -n "onIndexChange=" components/TrackManager.tsx | grep -v "onIndexChange={setShownIndex}"
# N18c (from 10F): prints nothing (the fixture's 845147c arming handler is gone)
grep -n "onIndexChange={setTrack}" components/AssetStudioVisualFixture.tsx
# N18d: prints <file>:<count> with a count of at least 1 for each file (autoplay kept, D3); 0 for each under OVERRIDE D3: autoplay off
grep -c "autoplayDelay={6}" components/TrackManager.tsx components/AssetStudioVisualFixture.tsx
# N21: prints lines from components/analytics/ConvexHistory.tsx only (bash brace expansion)
grep -rn "console\." components/{director,shell,boot,effects,states,ui,broadcast,generation,brand,media,analytics,asset-studio,shotboard} lib/broadcast app/not-found.tsx app/admin/error.tsx app/global-error.tsx
# N23: exits 0
node scripts/checks/css-layers.mjs
# N26: shows the unchanged line
grep -n "notFound()" app/admin/visual-test/page.tsx
```

From the repository root:

```bash
# N1: prints nothing
git diff 845147c -- dashboard/components.json
# N2: prints nothing
diff <(head -4 dashboard/components/reactbits/Dither.jsx) <(git show 845147c:dashboard/components/reactbits/Dither.jsx | head -4)
# N9: prints nothing (D9; dashboard/scripts/brand is searched once it exists, from 3B)
grep -rniE "coast[^.]{0,80}\b(he|him|his|she|her|hers)\b" goal.md docs/redesign/spec .agents $(test -d dashboard/scripts/brand && echo dashboard/scripts/brand)
# N10: prints nothing
git ls-files dashboard/.qa dashboard/.next dashboard/.env.local 'dashboard/tests/__screenshots__/desktop-dark/live-*.png'
# N11: prints nothing
git diff --stat 845147c -- dashboard/convex dashboard/lib/directorProtocol.ts
# N12a: prints 7
ls dashboard/fonts/focal | wc -l
# N12b: prints nothing
git diff --stat 845147c -- dashboard/fonts
# N16: finds allow-ci only in the argument parsing of dashboard/scripts/brand/*.mts
grep -rn "allow-ci" dashboard --exclude-dir=node_modules
# N24: succeeds
test ! -e dashboard/app/favicon.ico && test -f dashboard/public/wzrdtechlogo.png
```

### 16.7 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] Every P1–P16 check passes at the end of the milestone named in its row and in every later milestone, and the M9 `sweep` PR pastes all of them.
- [ ] Every A1–A19 check passes on the final build in dark, light and at 390 px.
- [ ] The §16.3 greps (items 1, 2, 4, 7, 8) print exactly what they specify, `test ! -e dashboard/.env.local` succeeds (item 5), and `git diff 845147c -- dashboard/package.json` adds no runtime dependency and only the devDependencies in §16.3 item 11.
- [ ] The §16.4 item 3 and item 4 greps print nothing, and the M9 build route table shows `ƒ` only for the five `/api/*` routes.
- [ ] §8.10 B3, B12, B27, B33, C1–C5 and C8, the §10.10 fixture display-only item and §6.16's lock checks pass on the M9 build. No check expects a `cue` to become `off` after a timeout (§16.5 item 11).
- [ ] Every check in the N1–N28 column passes on `git diff 845147c...HEAD` at the end of M9.

## 17. Risks, cut order, open questions and follow-ups

Line references are **as of 845147c**.
- §17.1 names the risks and the milestone that retires each one.
- §17.2 is the single cut order for the whole project. It merges the per-chapter cut lists (§8.11, §9.11, §10.11, §11.A.11, §11.B.11, §11.C.11, §12.6), and none of them overrides it.
- §17.3 lists the owner questions. Each already has a default that Devin applies, so none blocks.
- §17.4 lists the work this project deliberately leaves out.

### 17.1 Risk register

Likelihood (L) and impact (I) use **H** / **M** / **L**. "Owner" is the milestone whose PR must carry the mitigation and its evidence.

| # | Risk | L | I | Mitigation (and the check that retires it) | Owner |
|---|---|---|---|---|---|
| R1 | **GPU/CPU contention while live.** The same machine decodes WebRTC, runs up to 2 MediaRecorders, mixes Web Audio and encodes H264 for WHIP while the carrier, MorphSlider and SymbolRaster draw. Dropped program frames or a stalled ingest would be public | M | H | P1–P3, P7, P15: the carrier at ≤ 30 fps and half resolution, paused when hidden; one effect slot; MorphSlider render-on-demand with `powerPreference: 'low-power'`; the air lock freezes decoration and pauses MorphSlider autoplay; the §15.6 'Live Control with the store on air' long-task check at 4× throttle (§8.10 C6; a real-session trace is Human operator only). If that check still fails, cut §17.2 #37 (SymbolRaster acquisition densities) first. Then hold the carrier on a static frame while `data-lock="air"` is set, and record it as a Decision | M3, M5, M6 |
| R2 | **The boot overlay blocks the page or adds console noise** (a script error leaves `#wzrd-boot` up; a boot asset returns 404; a hydration mismatch) | M | H | §6.2.10 failsafes; the first pointer press is swallowed; the hydration-safe `#wzrd-boot-host`; skipped under `navigator.webdriver` and `?noboot`; CSS hides it at 2100 ms without JS; the console capture runs **with** the boot (§1.6). Check: §6.16 boot checks, P6 | M4 (4C) |
| R3 | **Cascade and codemod regressions** across 1200 `fal-*` tokens, 1015 of them `fal-gray-*` (557 in live TS/TSX after D1): a wrong role mapping, dark-mode borders vanishing, or `!p[xy]-` removal changing spacing | H | M | Codemods run as separate commits with dry-run counts in the PR (§5.19); deprecated aliases stay until M9; greys migrate page by page (M6–M8); `css-layers.mjs`; dark, light and 390 px screenshot diffs of all 8 routes in M1 and M2, showing only the expected diffs (§5.21) | M1, M2, M6–M8, M9 |
| R4 | **DirectorPlayer extraction regressions** (1342 lines → hook + components): a broken teardown order, clip rotation, `primeMusic` ordering, OAuth completion or single `<video>` | M | H | PR 8A is a pure move with the byte-identical DOM proof (`tests/live-extraction.spec.ts`, §8.5.4) and only the E1–E12 edits; §8.10 A1–A7, B3, B27; the §1.6 flow in every Live Control PR; configured-only checks listed under "Deferred / blocked" when credentials are absent | M6 |
| R5 | **next-on-pages / edge incompatibility**: a Node-only import in a layout or `app/manifest.ts`, a page turned dynamic, or `next/font/local` or metadata-file routes behaving differently on Pages | M | H | The §16.4 item 3–4 greps; the route table keeps every page `○`; `npm run pages:build` in 4D and M9 `sweep` (or the stated gap, §16.4 item 1); Node code confined to `scripts/` and excluded from `tsconfig.json` | M3, M4, M9 |
| R6 | **Unverified fal endpoints and schemas**: `openai/gpt-image-2.5/sunburst/edit` and `minimax/h3-max/image-to-video` are absent from the installed typings, and `background: 'transparent'` and the H3 `duration` values are unverified | H | M | The §13.2 verification protocol: read the model pages first; change only the adapters; run a `quality: 'low'` draft probe before any final; automatic fallbacks (`openai/gpt-image-2/edit`, `minimax/h3/image-to-video`); the Sunburst 4×2 grid path for `loader/coast-boot` when H3 Max is unavailable or its 8 frames fail the loader check (§13.6.2); the brand PR body opens with a "Deviation from request" section listing every shipped asset made on a fallback endpoint, with the endpoint used and the reason (§13.10 step 11, §14.15); the magenta key; the committed placeholder for any asset with no approved final | M3 (adapters), M9 (brand) |
| R7 | **Likeness and consent**: Coast is likely a real performer (Twitch `510coast`, `wrangler.toml:22`; §17.3 Q15). Risks are an unapproved reference, identity drift from auto-appended sheets (D2), a PX stylisation Coast has not approved, and gendered copy | M | H | The D5/D9 gates: a Coast likeness only from the user-designated `COAST_SHEET_URL` (used directly as Image 1) or the Coast-approved `COAST_REF_URLS`, whose generated `coast-brand-sheet-v1` needs the owner's `APPROVE coast-brand-sheet <n>` before any other Coast asset; without a Coast input, the no-likeness set (`likeness:false`) or, without `FAL_KEY`, non-human placeholders; the user's sheet, raw references and the master sheet never in git; `approved.json` provenance; Devin selects variants by technical checks only and never judges likeness (§1.8 item 4); the owner and Coast sign off the contact sheet before merge, including the PX blue-ramp stylisation of Coast (a declined one is rebuilt with the PX-natural quantise, §13.10); the `REF` badge and 'Remove from references' (§10); the pronoun grep (§16.6 N9) | M7, M9 |
| R8 | **Safari differences**: no `corner-shape`; no `requestVideoFrameCallback` on older versions; different `mask-composite` keywords (`-webkit-mask-composite: source-in`); Safari's MediaRecorder may record only `video/mp4` (the `pickRecorderMimeType` fallback, `DirectorPlayer.tsx:69-74`), so a hard-coded `.webm` download name is wrong; `<dialog>` needs Safari 15.4 and `inert` 15.5 | H | M | §16.4 item 9 feature detection; `firstFrame.ts` falls back to `loadeddata`/`playing`; both mask syntaxes; `extFromMime()` for downloads (§11.B); a WebKit smoke run of 8 routes when the §15 harness has WebKit, otherwise a manual Safari pass noted under "Verification" | M4–M8 |
| R9 | **Reduced-transparency support** exists only in some engines, so users who need opacity may not get it | M | L | The contrast ledger passes with translucent surfaces over #5555AA, so the query is only an enhancement; `prefers-contrast: more` also makes surfaces opaque (§5) | M1 |
| R10 | **Font metric shifts**: real Focal weights (body 300 → 400) and JetBrains Mono replacing the OS mono change widths, truncation and line breaks | H | M | M1 and M2 ship separately with screenshot diffs; `next/font` fallback metrics; readouts in fixed `ch` slots with `tnum`; CLS 0 (P6); the §11.D.10 h1-box check | M2 |
| R11 | **Playwright in CI**: no test runner today; browsers may be missing or blocked; software-GL warnings; screenshot flake from the moving carrier | H | M | `@playwright/test` and `@axe-core/playwright` as devDependencies (D8); `npx playwright install chromium`; `--enable-unsafe-swiftshader --use-angle=swiftshader`; screenshots with `?noboot` and reduced motion (the carrier holds one frame); `maxDiffPixels` per §15. When browsers cannot install, run the SKILL flow manually and state the gap (§1.6) | M1 (1A) |
| R12 | **WebGL context leaks** from StrictMode double-mounts or repeated MorphSlider mounts ("Too many active WebGL contexts", "Context Lost" logs) | M | M | `loseContext()` after `dispose()`, never `forceContextLoss()`; every effect disposes in cleanup; the §12.4.1 20-toggle check; the 10-theme-toggle audit (P1) | M3, M5 |
| R13 | **Twitch ingest truth**: `getStats()` fields differ across browsers, so STALLED could fire falsely or miss a real drop | M | H | `nextAir` is a pure function with unit tests (`tests/whip-truth.spec.ts`, §8.5.6: growth → `on`; 4 flat polls → `stalled`; `failed` → `stalled`; recovery keeps `airSince`; `cue` + `failed` → `off`; `cue` + `disconnected` → `cue` with `cueUnconfirmed`; `cue` with no gate after 10 000 ms → `cue` with `cueUnconfirmed`, and after 60 000 ms still `cue`, so a flat or missing `bytesSent` never tears a broadcast down; §8.10 C3, C8); an unconfirmed cue shows the 'Twitch ingest not confirmed' warning chyron, whose 'End broadcast' leaves the decision to the operator (§16.5 item 11); both `connectionState` and `bytesSent` feed it; `lib/twitchWhip.ts` is untouched | M6 |
| R14 | **The air lock traps the operator** (a stale lock after leaving `/admin`; `beforeunload` prompts on idle pages) | L | M | The lock is derived only from the store; DirectorPlayer's unmount calls `broadcast.reset()`; §6.16 and §8.10 C2 checks; the §11.0 rule that library routes add no lock behaviour | M6 |
| R15 | **Preserved-contract drift** while strings move into new components, and SKILL.md goes stale | H | H | The Appendix A check (`scripts/checks/appendix-a.mjs`, A.14) in every PR; the per-chapter string ledgers (§8.9.4, §9.9.3, §10.9.5, §11.A.9–§11.C.9); `tests/unit/shot-strings.spec.ts`; the §1.9 SKILL rule | Every milestone |
| R16 | **Auth-state misreads**: signed-out Convex lists return `[]` (`convex/clips.ts:52`, `recordings.ts:53`, `tracks.ts:47`, `assets.ts:97`), so the UI shows "empty" instead of NO ACCESS, or flashes NO ACCESS while auth loads | M | M | `useLoadState` precedence (auth before empty) with `useConvexAuthState` (`isLoading` first); fixture states; configured QA only against a non-production deployment | M4, M8 |
| R17 | **Cross-origin media**: Convex storage URLs may not allow CORS, so Blob downloads and canvas frame extraction fail | M | L | `downloadMedia()` falls back to "Open file" (§11.A); the Recordings filmstrip is not built unless every §11.B.10 item passes | M8 |
| R18 | **Hydration mismatches** from `<html>` attributes (theme, density, platform, boot), `Kbd`, the clock or the year | M | M | The single-writer attribute table (§7.6); `suppressHydrationWarning` on `<html>`; `useSyncExternalStore` server snapshots (`--:--:--`); the console gate | M4 |
| R19 | **Brand spend overrun, or unknown pricing** | L | M | The `--budget-usd 40` hard cap, `--yes` above $10, live pricing with the fallback table, and the ledger in the PR (§13.3.6, §13.10) | M9 |
| R20 | **Scope and time overrun** across M0–M9 | M | M | The §17.2 cut order; the never-cut list; milestones ship independently (§1.4) | Every milestone |

### 17.2 Global cut order

Cut from the top when time runs short. Each cut keeps every Appendix A item, every §16 rule and the never-cut list below. Record every cut in the PR under "Decisions" as `DEC-M<n>-<nn> · cut §17.2 #<k>`. The bracketed references name the lists each item merges: a chapter's cut list, or `design #n`, the n-th item of the design team's original global cut list, which this list replaces.

0. **Not started by default:** the Recordings 8-frame filmstrip seek row. Build it only after every §11.B.10 item passes [§11.B.11 #1].
1. HoverClipButton 'Play ident' and the `motion/coast-talent-nod` clip; HoloCard renders no button [design #1; §10.11 #1; §12.6 #1].
2. HoloCard tilt and foil; keep the static 3:4 card with the seal and the `locked` LED [design #2; §10.11 #2; §12.6 #2].
3. The boot FLIP-to-bug and the glint; the wordmark fades out instead (§6.2.5) [design #4; §12.6 #3].
4. Shotboard take history (the `TAKES` row) [§9.11 #1].
5. Clips: the debounced '{n} new clips' announcement [§11.A.11 #1].
6. Clips: reel Tooltips (clicking still jumps) [§11.A.11 #2].
7. Analytics: the StatTile trend polyline [§11.C.11 #2].
8. Analytics: X-axis day labels (keep `HH:MM`) [§11.C.11 #3].
9. Analytics: chart bloom (`bloom="off"`) [§11.C.11 #4].
10. Live: the directions lane on the Script timeline (keep the beats lane and the playhead) [§8.11 #1].
11. Live: chat line outcome badges [§8.11 #2].
12. Live: the Events tab unseen-count badge [§8.11 #3].
13. Live: the allowance-threshold status messages [§8.11 #4].
14. Live: the Script source Chip [§8.11 #5].
15. Studio: SheetViewer (tile clicks then do nothing; the actions stay on the tile) [§10.11 #4].
16. Studio: turnaround view guides [§10.11 #5].
17. Shotboard: drag reorder; the move buttons remain [design #6; §9.11 #2].
18. Shotboard: the contact-sheet view and its View control [design #6; §9.11 #3].
19. Shotboard: track zoom `2×` (keep `1×`) [§9.11 #4].
20. Shotboard: the ≥ 1920 inline settings tier (the Popover at every width) [§9.11 #5].
21. Clips: Previous/Next in the viewer [§11.A.11 #3].
22. Clips: hover-scrub (the poster stays; the viewer still plays) [§11.A.11 #4].
23. Clips: the whole SessionReel on Clips (the group headers remain). `components/media/SessionReel.tsx` still ships, because the Recordings Session disclosure (§11.B.5) uses its read-only mode [§11.A.11 #5].
24. The boot Coast-sprite stage, then the whole POST, falling back to the 224 ms channel flip (§6.2.8) plus the loading sprite [design #7].
25. CountUp everywhere (Analytics KPIs, the Clips header count, the Recordings count, the Shotboard runtime). The component stays as a pass-through, so call sites do not change [design #8; §9.11 #6; §11.A.11 #6; §11.B.11 #2; §11.C.11 #5; §12.6 #4].
26. Shotboard: the "GMI expansion discarded" undo chyron (the discard still happens, as today) [§9.11 #7].
27. Recordings: hover-scrub on the row poster (the viewer remains) [§11.B.11 #3].
28. Recordings: the total-size meta (keep `{n} recordings`) [§11.B.11 #4].
29. Studio: ReadinessRow LEDs (the amber hint stays) [§10.11 #6].
30. Studio: the roster and wall filter inputs [§10.11 #7].
31. Studio: role badges on reference tiles (the `roles` prop; the D2 `REF` badge is never cut) [§10.11 #8].
32. Studio: the GPT ratio caption [§10.11 #9].
33. Live: the beat inspector pane; fall back to a restyled per-beat list in the Script tab that keeps the client ids [§8.11 #6].
34. Locations: the X key and the scout-report crops. Keep the 4:3 wall, the CompareSheet (opened by the 'Compare' button) and a plain primary plate; the wall plus CompareSheet is never cut [design #5, reduced; §10.11 #3].
35. Live: container-query full labels; Record, Capture and Remix become icon-only with sr-only labels at every width [§8.11 #7].
36. Palette actions beyond route jumps [design #9].
37. Live: SymbolRaster acquisition densities; keep the ConnectPlate over a static `BrandImage` [§8.11 #8].
38. Live: the sticky monitor below 1024 (the monitor scrolls away; the transport stays fixed) [§8.11 #9].
39. Live: fixture states beyond idle, acquiring, preview and failed [§8.11 #10].
40. Squircle corners (`.sq`); the plain `--r-*` radii remain [design #10; §12.6 #5].
41. The `motion/coast-standby-loop` video on Analytics; use its poster. It is the last cut, because it is one of the MiniMax H3 Max clips the owner asked for. `loader/coast-boot` has no cut item: its only fallback is the §13.6.2 grid path [design #3; §11.C.11 #1].

> Note: hover-scrub is one `MediaScreen` prop, so Clips (#22) and Recordings (#27) cut it independently, each in its own chapter's order.
>
> Note: two items sit lower than their chapter lists put them, and this list wins (§17 intro). `motion/coast-standby-loop` (§11.C.11 #1) is the last cut (#41), and the Locations X key and scout-report crops (§10.11 #3) are #34, right after the beat inspector pane (#33).

**Never cut:**
- **Foundations:** the tokens, the cascade fix and violet removal; the type reset; Dither hardening (§12.3.1); the focus, reduced-motion and reduced-transparency foundation; the contrast gate.
- **Truth and safety:** the broadcast store; the truth-gated tally (TallyBar, `air`, `useWhipTruth`); the air lock and leave-confirm; no automatic teardown of an unconfirmed cue (it stays `cue` with the 'Twitch ingest not confirmed' chyron, §16.5 item 11); the display-only artwork carousel (autoplay kept; arming only through the 'Armed track' radiogroup, with 'No track', or 'Arm this track'), with the MorphSlider render-on-demand and autoplay-pause patch (§12.4.1); `primeMusic` running synchronously in the click.
- **Live Control:** the 8A extraction and its proof; the single never-unmounted `<video>`; the `useSecondClock` leaves and the 500-entry ring buffer; the zero-scroll grid at ≥ 1024; the AlertTray with `role="alert"` and the restored 'Start Director'; LockedSettings; StageTrack in the connect plate.
- **States:** PxResolve; layout-exact skeletons; GenerationFrame driven by real queue status, including the failed and interrupted states; the slate family, including NOT PATCHED (never red) and NO ACCESS before empty; the route state files (`not-found`, `admin/error`, `global-error`, every `loading.tsx`, the Shotboard Suspense fallback); PixelFace wherever a slate kicker or md lamp needs it.
- **Shotboard:** the `useShotboard.ts:373` fix and the S4/S5/S7 slates; `settled()`; the sticky-model fix and ModelChip; the save LED; the TransferSheet with the preserved transfer order; Delete-board type-to-confirm, the undo chyrons and read-only library characters; keyboard walking with button alternatives; the not-configured banner, with local mode fully usable.
- **Studio:** the prettier and extraction pre-step; draft safety (the payload fix, the rehydrate rule, the unsaved guard); removing AccordionGallery from both pages; the Coast fallback chain and the `assetPlaceholder()` restyle; the NotConfigured, AuthRequired and empty slates with exact copy; StudioSkeleton with CoastLoader; the inline generation alert; the `REF` badge with 'Remove from references' (D2); Locations: the 4:3 wall plus CompareSheet; the fixture's `notFound()`, no-network rule, `#audio-library-visual-test`, `.asset-studio`, `#design-system-visual-test` and the §10.5.9 ready-state targets.
- **Library and Analytics:** `useLoadState` with auth before empty, `deriveClipStatus` and the three lamps; no PixelCard; 24 cards at a time with lazy posters; the Blob download with `extFromMime`; ConfirmDialog with pending, a failure alert and focus return; `.pixel-card-latest` with the NEW lamp; the LTX copy removal; the lamp precedence; `animate={false}` with memoised rows; ChartFigure (summary, sr table, slider); verbatim server errors; the Refresh pending guard; the `fal-purple` removal; the slot registration.
- **Everything in Appendix A and §16.**

### 17.3 Open questions for the owner

Each question already has a default in effect. Devin applies the default, records it under "Decisions" and never waits. The owner changes a default with an `OVERRIDE D<n>:` comment where a D-number applies (`OVERRIDE D10: <BC-id>` for a §0.4 behaviour change), and otherwise with a PR comment (§2.3).

| # | Question | Default applied | Evidence |
|---|---|---|---|
| Q1 | Which pronouns does Coast use? | "Coast" or they/them everywhere (D9) | `wrangler.toml:22` (`510coast`); fal.md F7 |
| Q2 | Will the user supply `FAL_KEY`, and `COAST_SHEET_URL` (preferred) or `COAST_REF_URLS`, for the brand run? | Devin uses whatever Devin secrets exist when the M9 `brand` part starts, and never asks for them or waits (§2.1). No `FAL_KEY`: the pipeline plus non-human placeholders marked `generated:false` (brand mode 1). `FAL_KEY` without a Coast input: the no-likeness set, marked `likeness:false` (mode 2). `FAL_KEY` plus a Coast input: the Coast set (mode 3), with `COAST_SHEET_URL` used directly as Image 1, or else a generated `coast-brand-sheet-v1` that waits for the owner's `APPROVE coast-brand-sheet <n>`. The 0A PR body's informational "Brand generation inputs" note lists the three variables and what each unlocks | §2.1 (brand modes), D5, §13.10, §14.6 |
| Q3 | Do the fal, OpenAI and MiniMax output terms allow commercial brand use of the generated Coast art? | Unverified. Generated Coast finals ship only after Coast's sign-off, and the brand PR states that the terms are unconfirmed | fal.md F7 ("UNVERIFIED") |
| Q4 | May the D2 backend fix (stop appending generated sheets to identity references) land? | No Convex change. The UI marks auto-appended sheets `REF` and offers 'Remove from references' (D2); the fix is §17.4 F1 | `convex/assets.ts:411`, `:416` |
| Q5 | Should the Coast artwork carousel keep its autoplay? | Yes (D3; §0.4 BC-15). Autoplay stays, and the carousel is display-only: no slide change writes the armed track. A track is armed only through the 'Armed track' radiogroup, whose first radio 'No track' disarms (§0.4 BC-14), or through 'Arm this track'. `OVERRIDE D3: autoplay off` removes the autoplay; `OVERRIDE D10: BC-15` restores the 845147c arming | `TrackManager.tsx:138-142`; commit `b45e1ea` ("Add Coast artwork carousel to audio library") |
| Q6 | May the unused `.otf` and italic Focal files be deleted? | No. They stop being referenced and stay on disk (D4) | `dashboard/fonts/focal/` (7 files) |
| Q7 | Should 'Go live on Twitch' require the first decoded frame, not only a live session? | Yes (DEC-8-03, §0.4 BC-6): no public output before PVW | §8.9.6 |
| Q8 | Should Shotboard allow editing or deleting library characters (such as @coast) from a board? | No (§0.4 BC-17). Library characters are read-only on Shotboard, because `removeCharacter` archives the shared row (§9.9.4 #8) | shotboard.md:87; `convex/shotboards.ts:309` |
| Q9 | Should clearing a board style be possible? | 'Board style…' is disabled while a style is set; clearing it needs a backend sentinel (§17.4 F9) | §9.9.4 #12 |
| Q10 | Should the Locations eyebrow read `SETS`, as an earlier design draft proposed? | No. 'Visual asset studio' is preserved on `/admin/locations` | `LocationLibraryPage.tsx:141`; §10.9.6 Note |
| Q11 | Should leaving a studio page with unsaved edits through the command bar ask first? | No shell-level guard. The in-page selection guard and `beforeunload` apply (§10.5.2); see §17.4 F13 | §10.5.2 |
| Q12 | Which Convex deployment may configured QA use? | None. QA runs unconfigured; configured states are proven through the `/admin/visual-test` fixtures and marked "not verified live" | §2.1 |
| Q13 | Should the Recordings delete confirmation copy change? | No. 'Delete this recording permanently?' stays as the ConfirmDialog title (data.md DI-11 allows a change, but D6 does not list one) | `app/admin/recordings/page.tsx:115` |
| Q14 | Should the boot play on every visit? | No: at most once per 12 h per browser, in any tab (§0.4 BC-1). `localStorage['wzrd:boot']` holds the epoch ms of the last full POST. The full POST runs when the key is absent, unparsable, in the future or at least 43 200 000 ms old, and an unforced POST then rewrites it; every other load gets the 224 ms channel flip, which never rewrites it. The boot is skipped under `navigator.webdriver` and `?noboot` | §6.2.4, §6.2.8 |
| Q15 | Is Coast a real performer, or an original character owned by 5DEE? | Treat Coast as a real performer: the full consent gate applies (D5, D9, §1.8 item 4). A Coast likeness comes only from `COAST_SHEET_URL` or `COAST_REF_URLS`, and the owner and Coast sign off the contact sheet before merge. The pronoun rule (Q1) applies either way | `wrangler.toml:22` (`TWITCH_CHANNEL = "510coast"`); the 'Coast originals' audio library (`TrackManager.tsx:144-145`) |

### 17.4 Recommended follow-ups (outside this project)

None of these lands inside M0–M9. Each one needs the owner's go-ahead and ships as its own PR after M9 (§2.2, D2 and D7).

| # | Follow-up | Evidence (845147c) | Recommended change |
|---|---|---|---|
| F1 | **D2 backend fix**: generated sheets automatically become identity references and the new primary | `convex/assets.ts:411` and `:416` patch `primaryStorageId: savedIds[0]` and append every result to `referenceStorageIds`; fal.md:268 item 3 | Stop appending in `completeGeneration`, keep history in `assetVersions` only, and add an `approveSheet` mutation that promotes one reviewed sheet. Then remove the UI's `REF` auto-append caption (§10) |
| F2 | **D7: pin the SDK proxy** | `app/api/fal/sdk-proxy/route.ts:7` calls `createRouteHandler()` with no config. The installed `@fal-ai/server-proxy` defaults to `allowedEndpoints: []` (every endpoint) and `allowUnauthorizedRequests: true` (`node_modules/@fal-ai/server-proxy/src/config.js`, `DEFAULT_PROXY_CONFIG`), and the build prints both warnings; fal.md:94, :266 | Replace line 7 with the config below and keep `FAL_SDK_PROXY_URL` unchanged; `middleware.ts` stays the auth layer. Afterwards, test the Director WMA handshake (`wma.fal.run` service routes), queue polling, storage uploads from 'Upload' in `AssetUrlInput`, and one generation per image model (fal.md:399). These tests open a live Director session and paid generations, so they are Human operator only; Devin records them as "not run (paid)" (§1.8 item 3) |
| F3 | **Role-aware references** | `presentCharacter` (`convex/assets.ts:44`) returns storage ids without roles, so every reference is sent as `image_urls`; fal.md:268 item 3 | Join the latest `assetVersions` row per storage id, return `role`, and send only `identity` references plus the single approved `sheet` |
| F4 | **Persist fal CDN URLs to Convex** | Shotboard shot, keyframe and portrait images, and Director capture, remix and sheet results, stay as fal CDN URLs (fal.md:76, :269 item 4) | Extract `uploadGeneratedImage` (`CharacterLibraryPage.tsx:108-116`, duplicated in `LocationLibraryPage`) to `lib/persistGenerated.ts`, and call it from Shotboard and Director |
| F5 | **One sheet generator** | Director's 'Generate from first frame' calls `fal-ai/nano-banana-2/edit` inline (`generateSheet`, `DirectorPlayer.tsx:821-843`; `remixFrame` from `:783`); fal.md:270 item 5, :393 | Route it through the studio path (`buildCharacterSheetSource`, `lib/assetGeneration.ts:30` → `generateImages` → Convex), keeping the visible labels 'Generate from first frame' / 'Generating…' |
| F6 | **Exact GPT Image sizes** | `gptImageSize` maps every ratio to one of 3 presets (`lib/imageModels.ts:85-95`); §10 adds the caption 'GPT Image 2.5 renders this ratio as 16:9.' | Return a custom `{ width, height }` per ratio (multiples of 16, 655,360–8,294,400 px, ≤ 3:1), and remove the caption (fal.md:267 item 2) |
| F7 | **Retire or clean up `/api/fal/proxy`** | After D1 it has no caller (only `WebRTCPlayer.tsx:13`, `useRealtimeWebSocket.ts:10` and `utils/falApi.ts:10` used it), and it `console.log`s every request and response body (`app/api/fal/proxy/route.ts`) | Delete the route, or at least drop the body logs and keep the host allowlist and timeout (fal.md:271 item 7, :399) |
| F8 | **README LTX cleanup** | `README.md` still describes the LTX system: the title (line 1), the features (lines 3–8), and 14 "LTX" mentions in all, including lines 255–301 | Rewrite it for the Director, Shotboard, the studio and the brand pipeline, and document `npm run brand:*` and `/admin/visual-test` |
| F9 | **Shotboard backend items** (§9.9.5) | `convex/director.ts:24` loads only board-scoped characters, so @coast is dropped from 'Featuring'. `:34-50` omits the shot-type label, elements and camera environment. Nothing clears `styleId`/`locationId`, and there is no persisted per-shot model override or take history | A clear mutation or sentinel for `styleId`/`locationId`; a persisted model-override field; server/client compiler parity, including library characters; persisted takes; cross-scene moves through `setShotOrder` |
| F10 | **Scope `removeCharacter`** | Deleting a character on Shotboard archives the shared library row, including @coast (shotboard.md:87; `convex/shotboards.ts:309`) | Allow deletion only for `boardId`-scoped characters, then drop the read-only rule of §9.9.4 #8 |
| F11 | **Explicit signed-out results** | List queries return `[]` without an identity (`convex/clips.ts:52`, `recordings.ts:53`, `tracks.ts:47`, `assets.ts:97`) | Return `null` (or throw a typed error) when unauthenticated, so the UI no longer has to infer auth from `useConvexAuthState` |
| F12 | **Pagination beyond 100** | `api.clips.list {limit:100}` and `api.recordings.list {limit:100}`; §11 shows " · latest 100" at the cap | Cursor pagination (`usePaginatedQuery`) on both lists |
| F13 | **Shell-level unsaved-changes guard** | §10.5.2 guards only in-page selection and `beforeunload`; command-bar navigation discards unsaved edits, as at 845147c | Route the studio's dirty state through `useLeaveGuard()` (`lib/leaveGuard.ts`, §6.12), the guard the air lock uses |
| F14 | **Handle vocabulary** | The studio uses `@coast`, while Director and Shotboard placeholders use `$COAST` (`DirectorSettingsForm.tsx:100`); assets.md:125 | Choose one convention and migrate stored handles with a Convex migration |
| F15 | **In-app brand style preset** | fal.md:272 item 6; out of scope in §13.1 | Share the §13.5 STYLE blocks through `lib/brandPrompt.ts` and offer them in ImageGenerationControls |
| F16 | **Storage CORS for media** | Blob downloads and canvas frame extraction need CORS-clean Convex storage URLs (unverified, §11.B.11) | Confirm the Convex storage CORS headers, then enable the Recordings filmstrip |
| F17 | **End the session row on unmount** | DirectorPlayer's unmount path (`DirectorPlayer.tsx:1034-1043`) flushes the clip, stops the recorder and closes the session, but never calls `setSessionStatus('ended')`; only `disconnect()` does (`:899-902`). A tab close or a route change mid-session leaves the row `live` or `opening`; §11.A only caps it in the UI (`isSessionLive`, `LIVE_MAX_MS` = 4 h) | DirectorPlayer unmount should call `setSessionStatus('ended')` (§8) |
| F18 | **Convex storage CORS for GET** | The Blob download (`lib/download.ts`, §11.A) needs `Access-Control-Allow-Origin` on Convex storage GET responses, which is unverified; cross-origin POST uploads work today (`DirectorPlayer.tsx:310-314`) | Confirm the GET CORS headers in configured QA (§11.B.10). If they are absent, downloads stay fallback-only ("Open file") until the deployment serves them |

F2 configuration (`dashboard/app/api/fal/sdk-proxy/route.ts`; keep lines 1–5 and `runtime = 'edge'`):

```ts
export const { GET, POST, PUT } = createRouteHandler({
  // Exact app ids used by the app today (lib/imageModels.ts:50-69, DirectorPlayer.tsx:27, :795, :828).
  allowedEndpoints: [
    'fal-ai/nano-banana-2',
    'fal-ai/nano-banana-2/edit',
    'openai/gpt-image-2.5/flare/text-to-image',
    'openai/gpt-image-2.5/flare/edit',
    'openai/gpt-image-2.5/sunburst/text-to-image',
    'openai/gpt-image-2.5/sunburst/edit',
    'minimax/h3-max/director',
  ],
  // middleware.ts (Cloudflare Access) authenticates every /api/* request before it reaches this handler.
  allowUnauthorizedRequests: false,
  isAuthenticated: async () => true,
})
```

After this change, `npm run build` no longer prints the two `@fal-ai/server-proxy` warnings. Update §1.5 and the admin-testing skill in the same PR.

### 17.5 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] Every PR that mitigates a §17.1 risk names it (`Mitigates §17.1 R<n>`) and pastes the check named in its row.
- [ ] Every cut is recorded as `DEC-M<n>-<nn> · cut §17.2 #<k>`, and cuts happen in §17.2 order: no item is cut while an item above it ships, unless the PR explains why under "Decisions". No never-cut item is missing from the M9 build.
- [ ] No PR asks the owner a §17.3 question, and each default in use is recorded under "Decisions" the first time it applies.
- [ ] At the end of M9, `git diff --stat 845147c -- dashboard/convex dashboard/app/api README.md` (from the repository root; `README.md` is the root README of F8) prints nothing: every §17.4 item stays out of M0–M9.

