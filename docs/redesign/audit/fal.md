# Audit: fal.ai generation pipeline and brand-asset generation plan (dashboard/utils/falApi.ts, utils/falUpload.ts, lib/imageGen.ts, lib/imageModels.ts, lib/assetGeneration.ts, app/api/fal/proxy, app/api/fal/sdk-proxy, DirectorPlayer character sheet / remix / capture, DirectorSettingsForm, CharacterLibraryPage + ShotboardPage callers, convex/assets.ts, convex/promptExpansion.ts, wrangler.toml, .env.production, README fal sections)

## Files read
- dashboard/utils/falApi.ts
- dashboard/utils/falUpload.ts
- dashboard/lib/imageGen.ts
- dashboard/lib/imageModels.ts
- dashboard/lib/assetGeneration.ts
- dashboard/lib/assetPlaceholders.ts
- dashboard/lib/directorProtocol.ts
- dashboard/lib/runtimeEnv.ts
- dashboard/app/api/fal/proxy/route.ts
- dashboard/app/api/fal/sdk-proxy/route.ts
- dashboard/app/layout.tsx
- dashboard/app/page.tsx
- dashboard/app/admin/layout.tsx
- dashboard/app/admin/visual-test/page.tsx
- dashboard/middleware.ts
- dashboard/next.config.js
- dashboard/tsconfig.json
- dashboard/tailwind.config.js
- dashboard/package.json
- dashboard/wrangler.toml
- dashboard/.env.production (variable NAMES only; values redacted)
- dashboard/.gitignore
- dashboard/components/DirectorPlayer.tsx (lines 1-60, 735-1150, 1290-1342)
- dashboard/components/DirectorSettingsForm.tsx
- dashboard/components/AssetUrlInput.tsx
- dashboard/components/CharacterLibraryPage.tsx
- dashboard/components/LocationLibraryPage.tsx (generation aside + empty state)
- dashboard/components/ImageGenerationControls.tsx
- dashboard/components/ReferenceAssetManager.tsx (upload/role lines)
- dashboard/components/ScriptTemplatePicker.tsx (lines 55-110)
- dashboard/components/AssetStudioVisualFixture.tsx
- dashboard/components/DitherBackground.tsx
- dashboard/components/shotboard/ShotboardPage.tsx (lines 1-200)
- dashboard/convex/assets.ts
- dashboard/convex/promptExpansion.ts
- dashboard/convex/schema.ts (assetVersions/imageGenerationJobs/tracks)
- dashboard/public/wzrdtechlogo.png (viewed)
- docs/redesign/baseline/admin_characters-dark.jpg (viewed)
- README.md (fal sections)
- dashboard/node_modules/@fal-ai/server-proxy/src/index.js, config.js, nextjs.js (v1.3.0-alpha.0)
- dashboard/node_modules/@fal-ai/client/src/types/endpoints.d.ts (v1.11.0-alpha.3: H3*, GptImage2*, NanoBanana2Edit*, ImageSize, I2VOutput)
- docs/redesign/component-prompts.csv (filtered for loader/dither/pixel/video components)
- skill anthropic-skills:fal-models-catalog (SKILL.md + references/text-to-image.md, image-to-video.md, image-to-image.md)
- skill anthropic-skills:fal-prompting (SKILL.md + references/gpt-image-2.md)
- skill fal-platform SKILL.md (pricing API), fal-gamedev SKILL.md (sprite-sheet recipe)

## Current state
HOW GENERATION IS WIRED TODAY (verified by reading the code). The browser starts every fal call. The browser never sees FAL_KEY. Two server routes run on the edge runtime (`export const runtime = 'edge'`) and add the key:
(1) `/api/fal/proxy` (app/api/fal/proxy/route.ts:37-107) is a legacy custom proxy. It reads FAL_KEY through `runtimeEnv('FAL_KEY')` (line 39) and takes the target from an `X-Fal-Target-Url` header plus `X-Fal-Method`. It only allows `https` hosts matching `/(^|\.)fal\.(ai|run)$/` or the origin of NEXT_PUBLIC_FAL_API_URL (lines 8-35). It has a 30s AbortSignal timeout (line 69) and logs full request and response bodies (lines 59-60, 92). Its only live caller is `utils/falApi.ts` (startStream/stopStream/updateConfig/getMetrics against the old LTX streaming app), used by hooks/useRealtimeData.ts:5.
(2) `/api/fal/sdk-proxy` (app/api/fal/sdk-proxy/route.ts:7) is the official `@fal-ai/server-proxy` 1.3.0-alpha.0 `createRouteHandler()` with NO config. I confirmed in node_modules/@fal-ai/server-proxy/src/config.js that the defaults are: allowedUrlPatterns `fal.run/**`, `queue.fal.run/**` and the two `rest.fal.ai/storage/upload/...fal-cdn-v3` routes; serviceHosts `['wma.fal.run']`; `allowedEndpoints: []`, which means ALL endpoints (the library itself warns about this); and `allowUnauthorizedRequests: true`. The key is read from `process.env.FAL_KEY` at module init (index.js), which works on Pages because wrangler.toml:128 sets `nodejs_compat_populate_process_env`. Both routes sit behind middleware.ts. Its matcher is `['/admin/:path*', '/api/:path*']` (line 56) and it does Cloudflare Access JWT verification (CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD) or `ADMIN_AUTH_MODE=edge-only`. Deployment is Cloudflare Pages via `@cloudflare/next-on-pages` (package.json `pages:build` / `pages:deploy`, wrangler.toml:126-129, output `.vercel/output/static`). FAL_KEY and TWITCH_CLIENT_SECRET are Pages secrets and are never in `[vars]` (wrangler.toml:122-124, 152-155). `.env.production` holds only NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_TWITCH_CHANNEL, NEXT_PUBLIC_TWITCH_CLIENT_ID, GMI_COORDINATOR_MODEL and GMI_WORKER_MODEL (names only; values not printed). There is no FAL var in it. The README (lines 116-117, 163, 178-182, 229-251) documents the same split. Much of the README still describes the old LTX system.

CLIENT CALL SITES. Every call uses `createFalClient({ proxyUrl: FAL_SDK_PROXY_URL })`, where `FAL_SDK_PROXY_URL = '/api/fal/sdk-proxy'` (lib/directorProtocol.ts:4):
- lib/imageGen.ts:36-37: `fal.subscribe(endpoint, { input })` for all still-image generation. The result is `data.images[].url` (fal CDN URLs).
- DirectorPlayer.tsx:763-764: `fal.storage.upload` of a canvas PNG frame ('Capture frame').
- DirectorPlayer.tsx:789-802: `remixFrame`, a hard-coded `fal-ai/nano-banana-2/edit` with `image_urls: [source, characterSheet?]`.
- DirectorPlayer.tsx:821-843: `generateSheet`, a hard-coded `fal-ai/nano-banana-2/edit` using the prompt 'Character reference sheet for ${name}: front view, three-quarter view, and side profile plus a row of expression close-ups — identical outfit, colors, and art style as the reference image. Clean layout on a plain background.' and `image_urls: [settings.imageUrl]`.
- DirectorPlayer.tsx:958: `fal.realtime.open(wma(DIRECTOR_MODEL))` with `DIRECTOR_MODEL = 'minimax/h3-max/director'` (line 27). This is the realtime WebRTC H3 Max session.
- AssetUrlInput.tsx:33-34: `fal.storage.upload(file)` for the URL-or-upload fields.

MODEL REGISTRY (lib/imageModels.ts:44-73). `nano-banana` (the default, DEFAULT_IMAGE_MODEL line 75) maps to `fal-ai/nano-banana-2` and `fal-ai/nano-banana-2/edit`. `gpt-flare` maps to `openai/gpt-image-2.5/flare/text-to-image` and `/edit`. `gpt-sunburst` maps to `openai/gpt-image-2.5/sunburst/text-to-image` and `openai/gpt-image-2.5/sunburst/edit`. The GPT qualities are `['auto','low','medium','high','xhigh','max']`, default 'high'. `buildImageInput` (lines 97-177) sends the following to the GPT family: prompt, `image_size: gptImageSize(...)`, quality, num_images (1-4), output_format (default png), `background` (default 'auto'), an optional `output_compression`, `image_urls` (edit) and `mask_url`. `gptImageSize` (lines 85-95) maps only '9:16' to 'portrait_16_9' and '1:1' to 'square'; every other ratio becomes 'landscape_16_9'. MAX_ASSET_REFERENCES = 14 (line 41). The UI for these knobs is ImageGenerationControls.tsx, with aria-labels 'Image model', 'Image aspect ratio', 'Image variations', 'Output image format', 'Nano Banana resolution', 'GPT Image quality' and 'Image background'.

PROMPT EXPANSION (convex/promptExpansion.ts). The Convex action `expand` (also exported as `start`) calls GMI at https://api.gmi-serving.com/v1/chat/completions. It uses coordinator `openai/gpt-6-astra` and worker `zai-org/GLM-5.3-Flash` (overridable by env). Each expansion is 4 calls: a coordinator brief, then visual and continuity specialists in parallel, then a coordinator synthesis. All return JSON `{prompt, notes}`. Other properties:
- Template versions are 'gmi-director-glm-2026-09-2' and 'gmi-astra-glm-2026-09-1'.
- There is a 180s deadline, and at most 2 expansions run at once per isolate.
- Results are idempotent through `promptJobs` (requestId, sourceHash) and cached by sourceHash.
- The system prompt (line 50) is: 'You are Astra … Return JSON only … Never invent asset IDs, URLs, timings, or model parameters. The target is a Nano Banana or GPT image prompt | a MiniMax H3 Max Director beat prompt; use concrete subject, composition, motion, camera, lighting, materials, and constraints.'
- The brief for a character sheet comes from `buildCharacterSheetSource` (lib/assetGeneration.ts:28-45): 'Use case: identity-preserve', a five-view horizontal sheet, 'Composition: neutral studio background…', 'Avoid: text, logos, watermarks…'.
- `defaultGenerationOptions()` returns `{aspectRatio:'4:3', resolution:'1K', outputFormat:'png', numImages:1, quality:'high', background:'auto', safetyTolerance:'4'}` (line 67).

WHERE RESULTS ARE STORED. Storage is inconsistent across the three generation paths.
(a) Character and Location libraries (CharacterLibraryPage.tsx:120-144; LocationLibraryPage mirrors it). The flow is: persistDraft, then expand (GMI), then `startGeneration` (an `imageGenerationJobs` row checked against revision and sourceHash), then `generateImages`. Next, `uploadGeneratedImage` (lines 108-116) fetches each fal CDN URL in the browser and POSTs it to a Convex `generateUploadUrl`. Finally `completeGeneration` (convex/assets.ts:397-424) sets `primaryStorageId = savedIds[0]`, APPENDS every result to `referenceStorageIds`, and inserts `assetVersions` rows with `role:'sheet'`, modelId and prompt. These images persist in Convex `_storage`.
(b) Shotboard (ShotboardPage.tsx:90-190). The raw fal CDN URLs go straight into `shot.imageUrl`, `scene.keyframeUrl` and board `character.imageUrl` with no Convex copy.
(c) Director. Captured frames live on the fal CDN. Remix and sheet results are fal CDN URLs held only in React state (`settings.characterSheet`, `liveEndImage`); `characterSheet` is never persisted and is 'not sent to the model' (directorProtocol.ts:24). Recordings and clips from MediaRecorder do go to Convex storage (DirectorPlayer.tsx:295-361, 426-458).

WHERE THE @COAST IDENTITY LIVES. It is not in the repo. I checked the whole repo outside node_modules. The only images are dashboard/public/favicon.ico (32x32, 1,155 B), dashboard/public/wzrdtechlogo.png (1717x425 RGBA, 690,760 B, a chrome-gunmetal blackletter 'WZRD.tech' with an electric-blue rim) and the docs/redesign/baseline/*.jpg screenshots. @coast is a Convex `characters` row. `seedStarterLibrary` (convex/assets.ts:466-478) inserts it with `name:'Coast', handle:'coast', starterKey:'coast', identityLocked:true` and NO images, plus the description 'Add approved face-reference images before generating. Keep the face and overall look consistent; outfits are chosen per scene.' Face references are uploaded by hand through ReferenceAssetManager to Convex `_storage` (`recordUpload`, which takes a role of identity/wardrobe/style/environment and stores it in `referenceStorageIds`/`primaryStorageId`). `presentCharacter` (assets.ts:44-54) returns `imageUrl` (the primary) and `referenceUrls`/`referenceAssets` but NOT the role of each ref.

HOW A 'COAST CHARACTER SHEET' IS PRODUCED AND STORED. There are two unrelated ways:
(A) Characters page, 'Generate character sheet'. It uses the selected model (default Nano Banana 2) in edit mode, with all references as `image_urls` and the GMI-expanded prompt. Results go to Convex storage as `assetVersions` role 'sheet'. They become the primary gallery image and are also appended as new references. A locked identity with no references throws 'Add an approved face reference before generating a locked identity like @coast'.
(B) Director, 'Generate from first frame' (DirectorSettingsForm.tsx:117-127). This runs nano-banana-2/edit on the First-frame URL and stores the result only in the transient 'Character sheet (optional)' field (placeholder 'Sheet URL or upload'). ScriptTemplatePicker.tsx:94 also copies a board's lead character `imageUrl` into `characterSheet`.
The Coast song cover art ('SPRING (intro)', "CHASIN $'s", 'POP OUT', "KEEP GOIN'") is hard-coded as production Convex storage URLs in AssetStudioVisualFixture.tsx:22-27, backed by `tracks.coverStorageId`. It could serve as a secondary style reference, but I could not view its content because the network is blocked.

ENDPOINT VERIFICATION. fal websites are blocked, and the genmedia CLI and ffmpeg are not installed. The installed `@fal-ai/client` 1.11.0-alpha.3 typings (src/types/endpoints.d.ts) are the best source available here:
- VERIFIED: `minimax/h3/text-to-video` (aspect_ratio 21:9|16:9|4:3|1:1|3:4|9:16, duration default 5, resolution only '2K'), `minimax/h3/image-to-video` (image_url, end_image_url for first-to-last keyframe, duration, resolution '2K'; aspect follows the image) and `minimax/h3/reference-to-video` (reference_image_urls/video/audio, at most 12 files, prompt refers to 'Image 1…', aspect default 'adaptive'). All three output `{video: File}`.
- VERIFIED for `openai/gpt-image-2` and `/edit`: `image_size` is a preset or `{width,height}` with both sides multiples of 16, max edge 3840, aspect ≤3:1, total pixels between 655,360 and 8,294,400. `quality` is auto|low|medium|high. `mask_url` exists. Edit takes at most 16 image_urls. There is NO `background` or `output_compression` field and NO `seed`.
- VERIFIED also present in the typings: `fal-ai/nano-banana-2/edit` (aspect_ratio including 'auto' and extreme ratios, resolution 0.5K-4K, seed, system_prompt, thinking_level), `fal-ai/bria/background/remove`, `fal-ai/birefnet/v2`, the `fal-ai/ffmpeg-api/*` family and `fal-ai/recraft/v4/text-to-vector`.
- UNVERIFIED: every `openai/gpt-image-2.5/{flare,sunburst}/*` ID and its schema (they exist only in the repo), and any batch 'H3 Max' ID such as `minimax/h3-max/image-to-video`. Only the realtime `minimax/h3-max/director` is referenced anywhere.
- The fal-models-catalog and fal-prompting skills list neither GPT Image 2.5 nor H3. The fal-prompting skill has a GPT Image 2 guide (five-section Scene/Subject/Important details/Use case/Constraints; label every input image by role; quote exact text; 'do not redesign the character'). It has no MiniMax guide.
- Tools on disk: Node v22.22.2, and sharp 0.34.5 (transitive through next). There is no ffmpeg, no png-to-ico and no dotenv.

## Problems
- **[high] [code-structure]** `dashboard/app/api/fal/sdk-proxy/route.ts:7` — `createRouteHandler()` is called with no config. The installed @fal-ai/server-proxy defaults (node_modules/@fal-ai/server-proxy/src/config.js DEFAULT_PROXY_CONFIG) are `allowedEndpoints: []`, which lets any fal endpoint through, and `allowUnauthorizedRequests: true`. The only guard is the Cloudflare Access middleware. Anyone with an Access session, or any XSS on stream.wzrd.tech, can therefore bill any fal model with the org key, including 2K video and 4K images. This proxy must not be the path for brand-asset batch jobs. It should be pinned to the endpoints the app actually uses: fal-ai/nano-banana-2 and /edit, openai/gpt-image-2.5/{flare,sunburst}/text-to-image and /edit, minimax/h3-max/director, and the storage upload routes.
- **[high] [code-structure]** `dashboard/lib/imageModels.ts:85-95` — `gptImageSize` squeezes the 10 ASPECT_RATIOS offered in the UI (imageModels.ts:42, ImageGenerationControls.tsx:28-30) down to 3 presets. `defaultGenerationOptions()` sets aspectRatio '4:3' (assetGeneration.ts:67), so every Sunburst or Flare character sheet is actually made at 'landscape_16_9', and 21:9, 3:2, 4:5 and 2:3 silently become 16:9. For brand assets that need exact sizes (1200x630 OG, 1:1 icons, 3:1 banners) the size must be a custom `{width,height}` object: multiples of 16, 655,360–8,294,400 px, ratio ≤3:1. That constraint is verified in the gpt-image-2 typings; for 2.5 it is UNVERIFIED.
- **[high] [code-structure]** `dashboard/lib/imageModels.ts:60,70,121-133` — The GPT Image 2.5 input shape is unverified. The code sends `background` (default 'auto'), `output_compression`, and qualities 'xhigh'/'max'. The only fal GPT Image typings installed (openai/gpt-image-2 and /edit) have none of these: quality is auto|low|medium|high and there is no background or compression field. If the 2.5 Sunburst schema matches gpt-image-2, requests with background='transparent' or quality='max' may return 422 or quietly ignore the setting, and transparent-background brand assets would come back opaque. The endpoint IDs `openai/gpt-image-2.5/sunburst/text-to-image` and `/edit` are also UNVERIFIED: they appear only in this repo and are absent from both the SDK typings and the fal-models-catalog skill.
- **[high] [code-structure]** `dashboard/convex/assets.ts:411 + dashboard/components/CharacterLibraryPage.tsx:125,135` — Generated sheets feed back in as identity references. `completeGeneration` appends every generated sheet to `referenceStorageIds`, and `generateSheet` sends all `referenceAssets` as `image_urls`. `presentCharacter` (assets.ts:44-54) drops each asset's role, so the client cannot filter to 'identity' refs. Each run therefore conditions on earlier AI output, and Coast's identity drifts. After a few runs with 4 variations (for example 2 face refs + 3x4 sheets = 14) the next run throws 'This workspace supports at most 14 reference images; remove some references first' (imageModels.ts:111-113). A brand pipeline that reuses 'the Coast sheet' needs ONE approved canonical sheet plus the original identity refs, not the whole pile.
- **[high] [states]** `dashboard/components/shotboard/ShotboardPage.tsx:111,156,177; dashboard/components/DirectorPlayer.tsx:764,804,836` — Shotboard shot images, scene keyframes and board-character portraits store raw fal CDN URLs in Convex rows with no copy to Convex storage. Director capture, remix and sheet URLs exist only in React state (`setSettings((s) => ({ ...s, characterSheet: url }))`). The fal CDN retention period is UNVERIFIED. These assets can vanish, and a Coast sheet made in Director is lost on reload. The character library already has a working 'copy to Convex storage' routine (`uploadGeneratedImage`, CharacterLibraryPage.tsx:108-116), but it is not shared.
- **[medium] [consistency]** `dashboard/components/DirectorPlayer.tsx:821-843; dashboard/components/DirectorSettingsForm.tsx:117-127` — There are two divergent 'character sheet' generators. Director's 'Generate from first frame' hard-codes `fal-ai/nano-banana-2/edit` and a one-line prompt. It ignores the model picker, @coast's approved Convex references, identityNotes and GMI expansion. It saves nothing, and errors appear only as a log line (`character sheet: …`). Two different sheets can therefore exist for the same character, and the Director one is not what the Characters page shows.
- **[medium] [states]** `dashboard/public/ (favicon.ico 32x32 1,155 B; wzrdtechlogo.png 690,760 B) + dashboard/app/layout.tsx:21-24` — The app has no brand asset system. public/ holds only a single-size 32x32 favicon and the wordmark. There is no app/icon, app/apple-icon, manifest, OG/Twitter image, metadataBase, app/admin/loading.tsx, not-found.tsx or error.tsx (verified with `find app -type f`). The metadata description is stale: 'Control panel for the realtime AI livestream: LTX + Director models, clips, recordings, Twitch analytics'. Shared links unfurl with no image.
- **[medium] [performance]** `dashboard/app/layout.tsx:40-44` — The header loads `/wzrdtechlogo.png`: a 1717x425 PNG of 690,760 B, rendered at `className="h-9 w-auto"` (about 145x36 CSS px). That is roughly 12x oversampled, with no WebP/AVIF, no width/height and a raw <img> (eslint rule disabled). It sits on the critical path of every page. next-on-pages has no default next/image optimizer (believed; UNVERIFIED here), so every brand asset has to be pre-optimized at build or script time.
- **[medium] [consistency]** `dashboard/lib/assetGeneration.ts:37-41; dashboard/convex/promptExpansion.ts:50` — No brand style layer exists anywhere in generation. The sheet brief asks for 'neutral studio background' and 'clean editorial character-design reference', and the GMI system prompt knows nothing about dither/pixel/chrome, the GPT Image five-section template, or H3's 'Image 1 / Video 1' reference syntax. GMI expansion also rewrites prompts non-deterministically (4 LLM calls). Brand assets must skip it and send versioned, verbatim prompts, or the outputs cannot be reproduced or reviewed.
- **[medium] [color]** `dashboard/components/CharacterLibraryPage.tsx:150; LocationLibraryPage.tsx:142; shotboard/ShotCard.tsx:169; shotboard/SceneSection.tsx:69; tailwind.config.js:27-32` — The palette drifts from the brand, and the generated art has to match a palette. AccordionGallery uses `accentColor="#a78bfa"` (violet) and `overlayColor="#05030b"`, but the brand chrome blue is fal-primary-500 #4f83cc, the Dither wave is #3357A8 on #05080F (DitherBackground.tsx:28-29) and the header is #0a0d14. `fal-primary-50/200/300` appear 18 times in components, yet tailwind defines only 400-700, so those classes emit nothing. The asset plan needs one locked token set before any prompts are written.
- **[medium] [motion]** `dashboard/components/DirectorPlayer.tsx:1082-1110` — The Director stage is the most-watched loading surface. It shows a `DitherGradient from="blue" direction="up" opacity={0.55} cell={4}` behind the video, a boxed list of CONNECT_STEPS with lucide `Circle` icons (green fill = done, `animate-pulse` = current) and plain text states 'Director offline', 'Session failed' and 'Stopping…'. Nothing on-brand or character-driven appears while the H3 Max session boots, which can take several seconds. This is where an ambient Coast loop or a standby card belongs.
- **[low] [copy]** `dashboard/lib/assetPlaceholders.ts:1-5` — `assetPlaceholder()` draws an off-brand SVG (hue gradient, Arial 34px/18px, the copy 'visual fixture · add approved reference'). Production galleries use it whenever an item has no image (CharacterLibraryPage.tsx:147), so the default look of an empty Coast card is a dev fixture.
- **[low] [code-structure]** `dashboard/utils/falUpload.ts:36-53; dashboard/package.json ("@fal-ai/serverless-client": "^0.14.0")` — This is dead code with a secret-leak footgun. `uploadImageToFal` is never imported, and its commented 'future implementation' calls `fal.config({ credentials: process.env.NEXT_PUBLIC_FAL_API_KEY })`. Un-commenting it would ship the key to every browser. `getOptimalImageDimensions` refers to the retired LTX model. @fal-ai/serverless-client is an unused legacy dependency.
- **[low] [code-structure]** `dashboard/app/api/fal/proxy/route.ts:59-60,92` — The legacy proxy calls `console.log` on full request and response bodies. Prompts, reference URLs and results end up in the Cloudflare Pages logs. The 30s timeout (line 69) also makes it unusable for queue or video work.
- **[low] [code-structure]** `dashboard/.gitignore (whole file); repo root has no .gitignore` — dashboard/.gitignore ignores `.env`, `.env.local` and `.env.*.local`, but it has no entry for a generation cache. A brand script that writes raw 2K PNGs, 2K videos or Coast face refs under dashboard/scripts/ could commit likeness material and large binaries by accident. Add something like `scripts/brand/.cache/` before the script lands.
- **[low] [consistency]** `dashboard/lib/imageModels.ts:41 vs :101` — The comment says reference images are '≤16' for all models, but the constant is `MAX_ASSET_REFERENCES = 14`. The 16-image limit in the gpt-image-2 edit typings supports 16 for GPT. Nano Banana 2's limit is not stated in the typings (UNVERIFIED).

## Redesign opportunities
### Scriptable brand-asset generator: dashboard/scripts/brand/ (plan → run → approve → build → check) (transformative)
FILES:
- scripts/brand/generate.mts: the CLI.
- scripts/brand/assets.mts: the asset list, kept as data.
- scripts/brand/prompts.mts: the STYLE, IDENTITY and CONSTRAINTS blocks and one subject per asset.
- scripts/brand/fal.mts, optimize-image.mts, optimize-video.mts, ico.mts and check.mts.
- scripts/brand/approved.json: committed.
- scripts/brand/.cache/: gitignored. Add `scripts/brand/.cache/` to dashboard/.gitignore.
Use `.mts` with erasable-only TypeScript: no enums or namespaces, and explicit `.mts` import extensions. Node v22.22 is installed; its default type-stripping is believed but UNVERIFIED, so add `--experimental-strip-types` if Node rejects the file. Add `"exclude": ["node_modules", "scripts"]` to tsconfig so next build and `npm run typecheck` never touch them.

RUN: `cd dashboard && node --env-file=.env.local scripts/brand/generate.mts <cmd>`. `.env.local` is already gitignored. Add npm scripts `brand:plan`, `brand:gen`, `brand:build` and `brand:check`.

AUTH: call fal directly with `createFalClient({ credentials: process.env.FAL_KEY })` from the already-installed @fal-ai/client. Never use /api/fal/*: those routes are Access-gated and the browser path. At startup, abort with a clear message if FAL_KEY is missing. Never print it and never write it to disk. Redact any `Key …` from errors.

COMMANDS:
- `plan`: prints each asset × variants × tier with the endpoint, full input JSON and estimated cost. It makes no generation calls. Pricing comes from `GET https://api.fal.ai/v1/models/pricing?endpoint_id=<id>` with header `Authorization: Key $FAL_KEY` (from the fal-platform skill; the response shape is UNVERIFIED, so fall back to a manual `--unit-price` table).
- `run --only <glob> --tier draft|final [--budget-usd 40] [--yes]`: submits with `fal.queue.submit`, then polls `fal.queue.status` / `fal.queue.result` with concurrency 3. Implement the concurrency as a tiny in-file semaphore rather than relying on transitive p-limit. It logs request_id and writes to .cache/raw/<assetId>/<sha256(endpoint+input)>-<i>.<ext> plus meta.json (endpoint, input without secrets, request_id, timings, cost estimate). Identical inputs are cache hits and are never re-billed. Refuse to run when `process.env.CI` is set unless `--allow-ci` is passed.
- `approve <assetId> <variant>`: copies the chosen raw file's sha256, prompt, endpoint and request_id into approved.json.
- `build`: fully offline and deterministic. It reads only approved raws and writes optimized files to public/brand/** and app/ metadata files. It generates public/brand/manifest.json and lib/brandAssets.ts, a typed map of src, width, height, bytes, dominant color and a tiny 16px base64 blur placeholder.
- `check`: enforces the size budgets and dimensions, alpha presence where required, and that no file under public/ is a raw identity reference.

TIERS: 'draft' uses quality 'low' at 1 variant; 'final' uses quality 'high' at 2 variants. GPT Image has no seed (gpt-image-2 typings), so the approved raw file is the source of truth; commit its hash, not the URL.

ENDPOINT RESOLUTION: each asset lists [primary, fallback]:
- Stills: primary `openai/gpt-image-2.5/sunburst/edit` or `/text-to-image` (UNVERIFIED); fallback `openai/gpt-image-2/edit` or `openai/gpt-image-2` (verified in typings).
- Video: primary `minimax/h3-max/image-to-video` (UNVERIFIED; try it first and treat a 404 or 422 as 'not available'); fallback `minimax/h3/image-to-video` (verified).
On a 422, the script prints the error body and drops only the unverified optional keys (`background`, `output_compression`, quality 'xhigh'/'max'), never the prompt.

DEVIN RULE: if FAL_KEY is absent, Devin builds and commits the script, the prompts and procedural fallbacks (SVG/CSS dither placeholders at the exact final dimensions, listed in the manifest with `generated:false`). A human then runs `brand:gen` and `brand:build`. Devin must never ask for the key or put it anywhere in the repo.

### Coast identity anchor: one approved 'Coast Brand Sheet v1' plus a fixed reference and prompt protocol (transformative)
Before generating any other asset, make ONE canonical, brand-styled Coast sheet and use it as Image 1 for every later edit.

INPUTS: `COAST_REF_URLS`, a comma-separated list of https URLs. Copy them from the Characters page: @coast's identity references and the best entry in 'Sheet history'. These are Convex storage URLs from `api.assets.getCharacter` → `referenceAssets`. Alternatively, drop local files in scripts/brand/.cache/refs/*.png; the script uploads them with `fal.storage.upload`. Use at most 4 identity refs. Never use previously generated sheets as identity refs (see the feedback-loop problem).

ENDPOINT: `openai/gpt-image-2.5/sunburst/edit` (UNVERIFIED; fallback `openai/gpt-image-2/edit`). INPUT: `{ prompt, image_urls: [...coastRefs], image_size: { width: 2048, height: 1152 }, quality: 'high', num_images: 2, output_format: 'png' }` (2,359,296 px, both sides multiples of 16).

SHARED BLOCKS (prompts.mts). The palette comes from DitherBackground.tsx:28-29 and tailwind fal-primary.
STYLE = 'Rendering: ordered-dither pixel illustration using a 4x4 Bayer pattern; every tone is built from visible square pixels roughly 1/320 of the image width. Strict palette: void navy #05080F, header navy #0A0D14, deep chrome blue #2D5488, dither blue #3357A8, wordmark blue #4F83CC, ice highlight #7AA5E0, and pure white only for tiny specular glints. Metal surfaces are polished gunmetal chrome with a thin electric-blue rim light, matching a blackletter chrome wordmark. Faint horizontal CRT scanlines. Hard pixel edges; no smooth airbrush gradients, no photographic grain, no bokeh, no lens flare.'
IDENTITY = 'Image 1 is the Coast identity sheet and the only source of truth for Coast’s face, hairline and hairstyle, skin tone, body proportions and signature outfit. Keep Coast recognizably identical. Do not redesign, age, slim, or restyle the character.' Append 'Image 2 is the WZRD.tech chrome wordmark: use it only as a reference for chrome material and blue color; do not draw any letters from it.' whenever the wordmark is passed as image_urls[1].
CONSTRAINTS(bg) = 'Constraints: exactly one Coast; no text, captions, labels, signatures or watermarks; no logos; no borders, frames, grid lines or UI; no extra limbs or duplicated faces; background: ${bg}.'

PROMPT FOR THE SHEET: 'Images 1–N: approved reference photos of Coast — identity source of truth. Change: redraw Coast as the WZRD.tech brand character on a single horizontal character reference sheet. Scene: flat void-navy #05080F backdrop with a thin dithered floor line, even cool studio light. Subject: Coast in five full-body views left to right — front, three-quarter left, profile left, back, three-quarter right — and below them a row of four head close-ups: neutral, grin, focused, surprised. Important details: {STYLE}; identical outfit in every panel; feet on one shared baseline; equal spacing; consistent head-to-body ratio. Preserve: face shape, eyes, nose, mouth, hairline and hairstyle, skin tone, and every accessory or tattoo visible in the references. Use case: master identity reference for all brand illustrations and video. {CONSTRAINTS("flat #05080F")}'

APPROVAL: a human picks one with `approve coast-brand-sheet <n>`. The raw file stays in .cache/refs/ (gitignored) and its hash goes in approved.json. Optionally, upload it to @coast in the Characters page with role 'sheet' so the app and the script share one identity source. It must never be copied to public/.

All later edit calls send `image_urls: [coastBrandSheetUrl]`, or `[coastBrandSheetUrl, wordmarkUrl]` for chrome-heavy art, where wordmarkUrl is public/wzrdtechlogo.png uploaded via fal.storage.

### Coast boot loader: 8-frame pixel sprite for app/admin/loading.tsx and every in-app spinner (high) — CSV: Pixel Swap, Decrypted Text, Shuffle, Arcade pixel
ASSET: `loader.coast-boot`.

ENDPOINT: sunburst/edit (UNVERIFIED; fallback gpt-image-2/edit). INPUT: `{ image_urls: [coastBrandSheet], image_size: { width: 2048, height: 1024 }, quality: 'high', num_images: 2, output_format: 'png', background: 'transparent' }`. `background` is UNVERIFIED. If the endpoint rejects it, drop the key and switch the prompt background to 'flat pure magenta #FF00FF'. The build step then chroma-keys exact #FF00FF (±8 tolerance) with sharp, which keeps hard pixel edges. Use `fal-ai/bria/background/remove` only as a last resort because it softens pixel art.

PROMPT: '{IDENTITY} Create an 8-frame sprite sheet of Coast as a compact pixel-art character (head about 40% of body height, 32-bit era sprite detail) arranged in a 4-column by 2-row grid of equal square cells. Each Coast is centered in its cell with identical scale and an identical baseline. Animation, reading left to right, top row then bottom row: Coast taps a small chrome broadcast remote; a blue pixel spark grows at the antenna tip (frames 1–4); the spark becomes a tiny spinning chrome diamond hovering above the hand (frames 5–7); frame 8 is exactly the pose of frame 1 so the loop is seamless. Important details: {STYLE}; one-pixel void-navy #05080F outline around the silhouette; no anti-aliasing blur; no motion blur. Use case: looping loading indicator in a dark web dashboard, shown at 64–128 px. {CONSTRAINTS("fully transparent" | "flat pure magenta #FF00FF")}'

BUILD (sharp):
1. Slice the 4x2 grid into 512x512 cells and trim all cells to one shared bounding box.
2. Resize with `kernel: 'nearest'` to 128x128 for @2x and 64x64 for @1x.
3. Palette-quantize with `.png({ palette: true, colors: 8, dither: 0 })`.
4. Pack horizontally into public/brand/loader/coast-boot-strip@1x.png (512x64, ≤25 KB) and @2x.png (1024x128, ≤60 KB), plus lossless .webp twins.
5. Write coast-boot-still.png (frame 1) for reduced motion, and coast-boot.json (frameCount 8, frameW/H, fps 10).

USAGE: a `<CoastLoader size=64|128 label='Loading…'/>` component with `role='status'` and visually hidden text. It uses a CSS `background-image` strip and `animation: coast-boot 0.8s steps(8) infinite` (background-position 0 → -800%). Under `@media (prefers-reduced-motion: reduce)` it shows the still. It is rendered by app/admin/loading.tsx and replaces the lucide `Loader2 animate-spin` in the 'Loading character library…' and 'Loading location library…' rows. Pair the label with a text-scramble effect. Budget: 1 draft + 2 final images.

### Ambient boot loops for the Director stage (H3 image-to-video with end frame = start frame) (high) — CSV: Amo hover button, Faulty Terminal, CRT Warp, Noise, Shiny Text, Metallic Paint
ASSET: `boot.booth-loop`. It plays behind the CONNECT_STEPS overlay and in the 'Director offline' state (DirectorPlayer.tsx:1082-1110). The existing `DitherGradient` stays as the base layer and is also the fallback.

STEP 1, the still. Endpoint: sunburst/edit. INPUT: `{ image_urls: [coastBrandSheet, wordmark], image_size: { width: 1920, height: 1088 }, quality: 'high', num_images: 2, output_format: 'png' }`, then center-crop to 1920x1080.
PROMPT: '{IDENTITY} Image 2 is the WZRD.tech chrome wordmark: material and color reference only; draw no letters. Scene: a dark broadcast control booth floating in a void of slow blue ordered-dither waves; behind Coast a wall of small CRT monitors shows only dithered static and fragments of blue color bars; the monitors are the only key light, cool and soft, with a blue rim light. Subject: Coast seated at a chrome mixing desk in three-quarter view facing screen-left, hands resting on faders, calm and focused, waiting for the stream to start. Important details: {STYLE}; wide 16:9 composition with Coast in the left third; the right two-thirds stay dark and low-contrast for an overlaid status panel; horizon on the lower third. Use case: first and last frame of a seamless ambient video loop. Constraints: no readable text on any monitor, no logos, no extra people, no lens flare.'

STEP 2, the video. Try `minimax/h3-max/image-to-video` first (UNVERIFIED), then `minimax/h3/image-to-video` (verified). INPUT: `{ image_url: still, end_image_url: still, prompt, duration: 5, resolution: '2K' }`. The allowed duration values are UNVERIFIED; typings show only the default 5.
PROMPT, motion only and short (H3 prompting guidance is UNVERIFIED): 'Locked-off camera, no cuts, no zoom. The CRT monitors flicker gently with drifting dithered static; blue dither waves scroll slowly behind the booth; Coast breathes, blinks once, nudges one fader up and returns it to its starting position; monitor light pulses softly. The final frame matches the first frame exactly for a seamless loop.'
If identity drifts, re-run with `minimax/h3/reference-to-video`: `{ reference_image_urls: [coastBrandSheet, still], aspect_ratio: '16:9', duration: 5, prompt: 'Image 2 is the exact scene and framing; Image 1 defines Coast\'s identity. <motion prompt>' }`.
Manual H3 Max alternative, needing no script: on Live Control set 'First frame' = the still and 'Last frame of first chunk' = the still, paste the motion prompt, record, then download from Recordings. The realtime `wma()` session needs a browser MediaStream, so scripting it from Node is UNVERIFIED.

STEP 3, ffmpeg. It is not installed in this sandbox: require system ffmpeg or add devDependency `ffmpeg-static`.
- If there is a visible seam, cross-fade the last 0.4s into the first with `xfade`.
- Scale and frame rate: `-vf scale=1280:-2:flags=lanczos,fps=24`.
- WebM: `-c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -an`, giving booth-loop-720.webm (≤1.2 MB).
- MP4: `-c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an`, giving booth-loop-720.mp4 (≤2 MB).
- Repeat at 640w for booth-loop-360.* (≤400 KB each).
- Poster: take the first frame and convert with sharp to booth-poster.avif (q50) and booth-poster.webp (q72), each ≤60 KB.
All files go in public/brand/boot/.

USAGE: `<video autoPlay muted loop playsInline preload='none' poster=…>` with `<source type='video/webm'>` before mp4 and `aria-hidden`. Reduced motion shows the poster only. Pause it when `document.hidden`. The CONNECT_STEPS copy and the 'Cancel' button stay exactly as they are, on top.

OPTIONAL `boot.wordmark-shine`: a 1920x1088 still of the real wordmark centered on #05080F. Build it by compositing public/wzrdtechlogo.png with sharp, NOT by generating it, so the letters stay exact. Then run H3 i2v with end=start: 'A single slow specular highlight sweeps left to right across the chrome letters; nothing else moves; ends identical to the first frame.' QA for letter warping; if it warps, fall back to a CSS or WebGL shine. Budget: 2–3 video calls in total.

### Coast empty/error-state illustration set: 10 spot illustrations with transparent backgrounds (high) — CSV: Ghosty reveal, Halftone Reveal, Pixel Transition, Pixel Card
ENDPOINT: sunburst/edit. INPUT per asset: `{ image_urls: [coastBrandSheet], image_size: { width: 1536, height: 1024 }, quality: 'high', num_images: 2, output_format: 'png', background: 'transparent' }`. `background` is UNVERIFIED; the fallback is the magenta key described in the loader item.

TEMPLATE: '{IDENTITY} Scene: isolated spot illustration; no environment beyond a small dithered oval floor shadow. Subject: {SUBJECT}. Important details: {STYLE}; Coast and props occupy the central 60% of the frame with generous empty margins; silhouette must read clearly at 240 px wide on both a dark #05080F and a light #FAFAFF page. Use case: empty-state illustration in a dark admin dashboard. {CONSTRAINTS("fully transparent")}'

SUBJECTS, one file each:
- empty/live-control: 'Coast shouldering a vintage chrome shoulder-mounted broadcast camera whose red tally lamp is unlit, peeking around the side of the camera, ready to go live'.
- empty/shotboard: 'Coast pinning small blank pixel storyboard frames onto a floating dithered grid board, one blank frame in hand, a chrome clapperboard tucked under one arm'.
- empty/characters: 'Coast standing beside three empty dotted-outline human silhouettes of equal height, gesturing toward them like a casting director'.
- empty/locations: 'Coast holding an unfolded paper map from which a tiny pixel Golden Gate Bridge and fog wisps pop up like a pop-up book'.
- empty/clips: 'Coast mid-snip with oversized chrome scissors on a strip of blank film frames, two frames floating away'.
- empty/recordings: 'Coast sitting on a stack of chrome VHS cassettes, holding one up and squinting at its blank label'.
- empty/analytics: 'Coast peering through a chrome spyglass at three rising dithered bar-chart columns, the last column still empty'.
- state/not-found (404): 'Coast tangled in unplugged coaxial cables in front of a small CRT whose screen shows large blocky pixel digits reading exactly "404" and nothing else'. This is the only asset with text; if the digits come out wrong, render them in SVG instead.
- state/offline (for 'Convex is not configured' and connection loss): 'Coast holding two unplugged chrome cable ends that almost touch, a small blue pixel spark between them'.
- state/error: 'Coast calmly aiming a fire extinguisher shaped like a chrome microphone at a tiny dithered puff of smoke'.

BUILD: trim the transparent margin and pad to a 3:2 canvas. Export 768w and 384w as webp (`quality 80, alphaQuality 90, effort 6`, 768w ≤70 KB) and avif (`quality 50`, ≤45 KB), plus a 768w PNG fallback (≤180 KB, palette mode). Write to public/brand/empty/<id>-{384,768}.{avif,webp,png}.

USAGE: a `<EmptyState art='characters' title=… body=… action=…/>` component. Existing copy stays verbatim, e.g. 'Start with a reusable character' / 'Create one, or load the San Francisco starter set to add @coast.' and 'Start with a reusable environment'. Add a subtle reveal on mount (disabled under reduced motion). Budget: 10 draft + 20 final images.

### Share card, favicon/app icons and manifest (Next metadata file conventions, pre-optimized for Pages) (high) — CSV: Metallic Paint, Liquid Chrome, Masked Heading
OG / TWITTER (`share.og`). Generate TEXT-FREE art and composite the real wordmark and text with sharp and SVG, so the typography is exact.
ENDPOINT: sunburst/edit. INPUT: `{ image_urls: [coastBrandSheet, wordmark], image_size: { width: 2400, height: 1264 }, quality: 'high', num_images: 2, output_format: 'png' }` (3,033,600 px).
PROMPT: '{IDENTITY} Image 2 is the WZRD.tech chrome wordmark: material and color reference only; draw no letters. Scene: void-navy background filled with slow blue ordered-dither wave bands and faint CRT scanlines. Subject: Coast waist-up on the right third, three-quarter view, looking at the viewer with a slight confident grin, lit by cool blue monitor light. Important details: {STYLE}; the left 55% of the frame is calm dithered navy reserved for a logo and headline; keep Coast inside the central 90% safe area. Use case: 1200x630 social share card. Constraints: no text, no logos, no watermarks, exactly one person.'
BUILD:
1. Cover-crop and resize to 1200x630.
2. Composite public/wzrdtechlogo.png at 560 px wide in the left column.
3. Add SVG text 'STREAM.WZRD.TECH' in JetBrains Mono, #7AA5E0, letter-spacing 0.2em, and a red dot with 'LIVE' at top-left.
4. Write app/opengraph-image.jpg and app/twitter-image.jpg (mozjpeg q82, ≤180 KB each) plus opengraph-image.alt.txt ('Coast in the WZRD.tech control booth — stream.wzrd.tech').
5. Add `metadataBase: new URL('https://stream.wzrd.tech')` in app/layout.tsx and refresh the stale description.
These live at root paths outside the middleware matcher, so crawlers can fetch them.

ICONS (`icons.app`).
ENDPOINT: sunburst/text-to-image or edit with the Coast sheet. INPUT: `{ image_size: { width: 1024, height: 1024 }, quality: 'high', num_images: 2, output_format: 'png', background: 'transparent' }` (1,048,576 px, above the 655,360 px minimum; a 512 or 32 px request would be rejected).
Concept A, Coast avatar: '{IDENTITY} Subject: Coast’s head and shoulders as a bold pixel-art avatar designed on a 32x32 pixel grid, front-facing, instantly recognizable hairstyle silhouette, chrome-blue rim light. Important details: {STYLE}; subject fills 80% of the square, centered. Use case: app icon and browser favicon that must stay recognizable at 16x16. {CONSTRAINTS("fully transparent")}'
Concept B, monogram: edit with `image_urls: [wordmark]`: 'Image 1 is a chrome blackletter wordmark. Isolate only its first letter, the blackletter W, redrawn as a standalone chrome monogram centered in a square, same chrome material and blue rim light, transparent background, no other letters.'
BUILD: app/icon.png (512), app/apple-icon.png (180, opaque #05080F with 12% padding), public/brand/icons/icon-192.png, icon-512.png and icon-maskable-512.png (content scaled into the central 80% on #05080F), each ≤25 KB. Also a multi-size favicon.ico (16, 32, 48) that REPLACES public/favicon.ico in place; do not add app/favicon.ico, because both would serve /favicon.ico. The 16 and 32 px sizes are downsampled with `kernel: 'nearest'` from a 32x32 palette-quantized master and hand-checked. Write the ICO container with a ~30-line PNG-in-ICO writer in ico.mts, since there is no png-to-ico dependency. Add app/manifest.ts with name 'stream.wzrd.tech admin', short_name 'WZRD', theme_color and background_color '#05080F', display 'standalone' and the icon set.

WORDMARK (no generation): export public/brand/wordmark/wzrdtech@1x.webp (146x36) and @2x.webp/.avif (292x72), each ≤15 KB, from the existing PNG. Keep the original file. Swap the header <img> to a <picture> with explicit width and height. Budget: about 3 OG and 6 icon images.

### Hero banner, standby test card, section textures and light-theme variants (medium) — CSV: Dither, Faulty Terminal, Gradient Blinds, Symbols effect
HERO (`hero.admin`). ENDPOINT: sunburst/edit. INPUT: `{ image_urls: [coastBrandSheet, wordmark], image_size: { width: 2688, height: 1152 }, quality: 'high', num_images: 2, output_format: 'png' }` (7:3, 3,096,576 px).
PROMPT: '{IDENTITY} Scene: a rooftop at night above a San Francisco skyline rendered entirely in blue ordered dither, the Golden Gate Bridge towers emerging from fog on the far right, stars as single ice-blue pixels. Subject: Coast standing on the left third beside a tripod-mounted chrome broadcast camera whose lens glows ice blue, looking out over the city. Important details: {STYLE}; the center and right half stay low-contrast for an overlaid headline. Use case: wide header banner for the stream admin home. Constraints: no text, no logos, one person.'
BUILD: public/brand/hero/admin-hero-{840,1680}.{avif,webp}, ≤180 KB at 1680w and ≤70 KB at 840w.

STANDBY TEST CARD (`testcard.standby`). Draw the bars procedurally in SVG so they are exact: seven stepped brand-blue bars from #7AA5E0 down to #05080F, plus a PLUGE strip. Only the character is generated.
INPUT: `{ image_urls: [coastBrandSheet], image_size: { width: 1536, height: 1024 }, background: 'transparent', quality: 'high' }`.
PROMPT: '{IDENTITY} Subject: Coast leaning in from the bottom-right corner, holding up a blank cardboard sign with both hands, friendly apologetic smile. Important details: {STYLE}. Use case: character overlay for a Please Stand By test card. {CONSTRAINTS("fully transparent")}'
The sign text 'PLEASE STAND BY' is composited in SVG. Output public/brand/testcard/standby-1920.{avif,webp} (≤150 KB) for the Director 'Director offline' / 'Session failed' stage and for a possible Twitch pre-roll canvas.

SECTION TEXTURES (optional, phase 2). No Coast, and 'medium' quality to save cost. ENDPOINT: sunburst/text-to-image `{ image_size: { width: 2304, height: 784 }, quality: 'medium' }`.
PROMPT: 'Seamless abstract banner texture: {MOTIF} built from blue ordered-dither pixels on void navy #05080F; {STYLE}; very low contrast so white text stays readable on top; no text, no logos.'
MOTIFS:
- Live Control: concentric broadcast signal rings.
- Shotboard: a faint storyboard grid.
- Characters: overlapping silhouette outlines.
- Locations: topographic contour lines.
- Clips: film sprocket holes.
- Recordings: tape reels.
- Twitch Analytics: rising scanline bars.
Crop to 2304x384, then public/brand/sections/<id>.webp (≤35 KB). These can be skipped in favor of live React Bits backgrounds.

LIGHT THEME: the transparent spot art works on both themes. For hero and OG only, run an edit with `image_urls: [approvedDark]`: 'Change only the palette: background #FAFAFF, dither tones #80A1DB and #4F83CC, outlines #1B2E5A; keep every shape, pose and pixel position identical.' at quality 'medium'. Output *-light.* variants chosen by a `.dark` class switch, which matches ThemeToggle.

### Harden the in-app pipeline the redesign depends on (high)
1. PIN THE SDK PROXY. Change `createRouteHandler({ allowedEndpoints: ['fal-ai/nano-banana-2', 'fal-ai/nano-banana-2/edit', 'openai/gpt-image-2.5/flare/**', 'openai/gpt-image-2.5/sunburst/**', 'minimax/h3-max/director'], allowUnauthorizedRequests: false, isAuthenticated: async () => true })`. Keep FAL_SDK_PROXY_URL unchanged. Middleware remains the auth layer; confirm the matcher semantics against the library's picomatch rules.
2. FIX IMAGE SIZES. `gptImageSize` should return a custom `{width, height}` for each ASPECT_RATIOS entry, rounded to multiples of 16 inside 655,360–8,294,400 px (e.g. 4:3 → 1536x1152, 3:2 → 1536x1024, 21:9 → 2688x1152). It should reject ratios over 3:1.
3. ROLE-AWARE REFERENCES. Return `role` per reference in `presentCharacter` by joining the latest `assetVersions` row per storageId. Send only role 'identity' plus the single approved 'sheet' as `image_urls`. Stop `completeGeneration` from appending generated sheets to `referenceStorageIds`; history already lives in `assetVersions`. This stops identity drift and the 14-reference error.
4. PERSIST EVERY RESULT. Move `uploadGeneratedImage` into lib/persistGenerated.ts and call it from ShotboardPage (shot, keyframe and portrait) and from DirectorPlayer (capture, remix and sheet), so no fal CDN URL is stored long-term.
5. ONE SHEET GENERATOR. Point Director's 'Generate from first frame' at the same buildCharacterSheetSource → generateImages → Convex path. When @coast exists, it targets that character and fills 'Character sheet (optional)' with the saved Convex URL. Keep the visible label 'Generate from first frame' / 'Generating…'.
6. BRAND STYLE PRESET. Add an optional brand-style preset to ImageGenerationControls that appends the same STYLE block from scripts/brand/prompts.mts (shared in lib/brandPrompt.ts). In-app Coast generations then match the static brand art.
7. CLEANUP. Delete utils/falUpload.ts and the @fal-ai/serverless-client dependency, and drop the body `console.log`s in /api/fal/proxy.

### Budget, cost guard and provenance ledger (medium)
PLANNED CALLS for the full set:
- Coast sheet: 1 draft + 2 final.
- Loader: 1 + 2.
- Booth still: 1 + 2.
- Empty states: 10 + 20.
- OG: 1 + 2.
- Icons: 2 + 4.
- Hero: 1 + 2, plus 1 light variant.
- Test-card character: 1 + 1.
- Sections (optional): 7 at medium quality.
That is about 21 low + 38 high + 8 medium image calls and 2–4 H3 image-to-video calls (5s at 2K).

COST: fal pricing could not be checked here (network blocked). The script must pull live prices (`GET https://api.fal.ai/v1/models/pricing?endpoint_id=…`) and print a table. As a guess only, to be replaced by the live table: GPT Image at high quality around 2 MP might cost a few tenths of a dollar per image, and a 5s 2K H3 clip roughly $0.5–2. That puts the whole set around $15–45.

GUARDS:
- Default `--budget-usd 40`. The script aborts before submitting if the estimate is over budget, and asks for `--yes` above $10.
- Drafts always run at quality 'low', and only approved drafts are re-run at 'high'.
- Keep outputs in fal request history, so `sync_mode` stays false and a crash does not lose paid results.

LEDGER: record every paid call in .cache/requests.jsonl (timestamp, assetId, endpoint, request_id, estimated USD, status). The approved subset goes in the committed scripts/brand/approved.json (assetId, endpoint, prompt, input with refs replaced by the placeholder 'coast-brand-sheet', request_id, sha256 of the raw and built files). This gives provenance for every public image and lets `build` run without the key.

### Delivery layer: typed manifest, <BrandImage>/<BrandVideo>, reduced motion, CLS-safe sizing (polish) — CSV: Accordion Gallery
`brand:build` generates lib/brandAssets.ts, e.g. `export const brand = { empty: { characters: { avif384, avif768, webp384, webp768, png768, width: 768, height: 512, color: '#0A0D14', blur: 'data:image/webp;base64,…' } }, … } as const`.

<BrandImage> renders `<picture>` with an AVIF then WebP `srcSet` and `sizes`, explicit width and height, `loading='lazy'` and `decoding='async'`, and the blur as a CSS background until load. It does not rely on next/image, whose optimizer next-on-pages does not provide (believed; UNVERIFIED).

<BrandVideo> handles webm/mp4 sources, the poster, `preload='none'`, `muted loop playsInline`, pausing on `visibilitychange`, and showing the poster only under `prefers-reduced-motion`.

<CoastLoader> is the sprite component described in the loader item.

SIZE BUDGETS (the `brand:check` script enforces them and fails CI):
- Total images in public/brand ≤ 2.5 MB; total video ≤ 6 MB.
- Per file: sprite @2x ≤ 60 KB; empty state 768w webp ≤ 70 KB; hero 1680w ≤ 180 KB; OG ≤ 180 KB; icons ≤ 25 KB; 720p webm ≤ 1.2 MB and mp4 ≤ 2 MB; 360p ≤ 400 KB.
- Only the wordmark @2x (≤15 KB) and the loader strip may load before LCP.

`assetPlaceholder()` keeps its signature for existing callers, but its SVG gets the brand palette and JetBrains Mono and loses the 'visual fixture' copy.

## States inventory
All verified by reading the code.

DIRECTOR STAGE (DirectorPlayer.tsx:1082-1110):
- Base: a `DitherGradient from=\"blue\" direction=\"up\" opacity={0.55} cell={4}` under `<video autoPlay playsInline muted={muted}>` in a `bg-black rounded-lg aspect-video` box.
- Opening/connecting: a `bg-black/70 border border-fal-gray-700` panel listing CONNECT_STEPS ('Network checked', 'Finding a machine', 'Connecting', 'Building world', 'Generating first scene'; defined at lines 54-60). Done steps show `Circle fill-green-400`, the current step `animate-pulse`, pending steps gray. A 'Cancel' underline button calls disconnect.
- Idle: 'Director offline'. Failed: 'Session failed'. Closing: 'Stopping…'. All three are plain `text-fal-gray-400 text-sm` text.
- Live: a red `animate-pulse` dot with 'Live · Ns', a Mute/Unmute button (aria-label 'Mute'/'Unmute'), 'Capture frame'/'Capturing…' (disabled while capturing) and 'Remix frame'/'Remixing…' (only after a capture; title 'Evolve the captured frame with nano-banana-2 (same character, new shot)'). Lines 1115-1143.

DIRECTOR ERRORS AND RESULTS:
- Errors: a red box `bg-red-50 border-red-200` (line 1290-1291) and a mono log `<pre>` limited to max-h-40.
- Sheet, remix and capture results and failures appear ONLY as log lines: 'character sheet generated → consistency reference for remixes', 'character sheet: <err>', 'frame remixed via nano-banana-2 → next end frame', 'frame capture: <err>'.

DIRECTORSETTINGSFORM (lines 105-128):
- The whole form is a `<fieldset disabled={disabled}>` while a session is live or opening.
- The 'Generate from first frame' link is disabled when `disabled || generatingSheet || !settings.imageUrl.trim()` (opacity-50, no-underline) and reads 'Generating…' while busy. Its title is 'Generate a turnaround/expressions sheet from the first frame (nano-banana-2)'.
- The helper copy 'Passed as a consistency reference to every Remix frame.' and the character name placeholder '$COAST' are shown.
- 'Last frame of first chunk' and 'Target audio' show ' (scripted)' and are disabled while a script is queued.

ASSETURLINPUT (lines 43-90):
- Uploading: the Loader2 icon spins and the text input and button are disabled.
- Error: `text-red-600` text.
- With a value: a 48px-high thumbnail with `alt=\"\"` and a Clear button (aria-label 'Clear').

CHARACTERLIBRARYPAGE:
- Convex disabled: amber card 'Convex is not configured. Character library changes are disabled.' (line 44). This is what the baseline screenshot docs/redesign/baseline/admin_characters-dark.jpg shows.
- Loading: Loader2 spinner with 'Loading character library…' (line 150).
- Empty: dashed card with the UserRound icon, 'Start with a reusable character' / 'Create one, or load the San Francisco starter set to add @coast.' (line 150).
- Items without an image show the `assetPlaceholder` SVG (line 147).
- Generating: the button shows a spinner and 'Generating character sheet…'. It is disabled when `!canGenerate || generating || saving`, with the amber hint 'Add a name, handle, description, and a face reference while identity lock is enabled.' (line 160).
- History: 'Sheet history' shows a grid of buttons titled 'Use as primary reference' (img alt 'Generated character-sheet history'). With no history it shows 'Generated sheets will remain here for review.'
- Notices: `role=\"status\"` in emerald ('N character-sheet variation(s) saved to Convex storage.', 'Starter library ready: …'). Errors: `role=\"alert\"` in red (lines 162-163).

LOCATIONLIBRARYPAGE:
- Loading: 'Loading location library…'.
- Empty: 'Start with a reusable environment' (line 142).
- Generating: 'Generating location sheet…'. Hint: 'Add a name and environment description to continue.' (line 151).

SHOTBOARD:
- Per-shot `imageStatus`: 'generating' | 'completed' | 'failed'.
- Status strings: 'Give the shot a prompt or direction first', 'Image generation failed: …', 'Prompt expansion requires an authenticated Convex connection', 'Prompt expansion failed: …', 'Add a scene description first', 'Keyframe generation failed: …', 'Portrait generation failed: …' (ShotboardPage.tsx:90-190).

SERVER AND BACKEND STATES:
- /api/fal/proxy: 500 'FAL_KEY not configured', 400 'X-Fal-Target-Url must be a fal.ai/fal.run URL or match NEXT_PUBLIC_FAL_API_URL', 504 'Request timeout - FAL API took too long to respond'.
- sdk-proxy: 400 'Invalid request' when the target header is missing.
- middleware 401: 'Unauthorized: set CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD, or ADMIN_AUTH_MODE=edge-only…', 'Unauthorized: Cloudflare Access assertion missing', 'Unauthorized: invalid Cloudflare Access assertion'.
- GMI errors: 'GMI prompt expansion is not configured (GMI_CLOUD_API_KEY is missing)', 'Two prompt-expansion jobs are already running; try again shortly', 'GMI prompt expansion exceeded its three-minute deadline', 'Prompt is stale; reload the shot before expanding'.
- Asset job errors: 'Character changed; review it before generating', 'This request id belongs to another generation', 'This workspace supports at most 14 reference images; remove some references first'.

VISUAL-TEST FIXTURE:
- app/admin/visual-test calls `notFound()` in production. It shows the amber banner 'Visual-test fixture only. No account, Convex mutation, GMI request, or Fal generation is available on this route.'

MISSING STATES:
- There are no route-level loading.tsx, not-found.tsx or error.tsx files anywhere in app/.

## Invariants
- Never commit FAL_KEY or any fal credential. The brand script reads it only from the environment (`node --env-file=.env.local …`; `.env.local` is gitignored by dashboard/.gitignore), never logs or persists it, and redacts `Key …` from errors. Never create a NEXT_PUBLIC_*FAL*KEY variable. Never add FAL_KEY to wrangler.toml [vars] or .env.production. It stays a Cloudflare Pages secret (wrangler.toml:122-124,152-155).
- Browser code must keep reaching fal ONLY through `/api/fal/sdk-proxy` (FAL_SDK_PROXY_URL in lib/directorProtocol.ts:4) and `/api/fal/proxy`. Both keep `export const runtime = 'edge'`. The offline brand script calls fal directly with server credentials and never goes through these routes.
- middleware.ts matcher `['/admin/:path*', '/api/:path*']` and its Access JWT logic stay unchanged. Brand files must live under /brand/*, /opengraph-image.*, /twitter-image.*, /icon.*, /apple-icon.*, /favicon.ico or /manifest.webmanifest (all outside the gate) so crawlers and the browser tab can fetch them.
- Server env is read through `runtimeEnv()` (lib/runtimeEnv.ts), never `process.env` in middleware. Keep `nodejs_compat_populate_process_env` in wrangler.toml: the sdk-proxy's module-level `process.env.FAL_KEY` depends on it.
- `export const DIRECTOR_MODEL = 'minimax/h3-max/director'` (DirectorPlayer.tsx:27) stays exported and stays displayed under 'Director (realtime WebRTC)'. The realtime `fal.realtime.open(wma(DIRECTOR_MODEL), …)` flow, CONNECT_STEPS labels and 'Cancel' button behavior must not change.
- Image model ids 'nano-banana', 'gpt-flare' and 'gpt-sunburst' (lib/imageModels.ts:44-73) are persisted in Convex (`shot.imageModel`, `imageGenerationJobs.modelId`, `assetVersions.modelId`). Do not rename them. DEFAULT_IMAGE_MODEL stays 'nano-banana' unless the product owner decides otherwise.
- Convex API names and flows: api.assets.{listCharacters, getCharacter, createCharacter, patchCharacter, listLocations, createLocation, patchLocation, generateUploadUrl, getStorageUrl, recordUpload, removeReference, listAssetHistory, startGeneration, completeGeneration, failGeneration, seedStarterLibrary} and api.promptExpansion.{expand, start, get}. The idempotent job sequence is startGeneration → generateImages → upload to Convex → completeGeneration or failGeneration. assetVersions roles are identity|wardrobe|style|environment|sheet.
- `seedStarterLibrary` creates @coast with handle 'coast', starterKey 'coast' and identityLocked true. Locked identities keep requiring an approved face reference, including the error text 'Add an approved face reference before generating a locked identity like @coast'.
- `DirectorSettings.characterSheet` is a remix-only reference and is NOT sent to the model (directorProtocol.ts:24). Keep the 'Character sheet (optional)' field, placeholder 'Sheet URL or upload', helper copy 'Passed as a consistency reference to every Remix frame.', button labels 'Generate from first frame'/'Generating…' and character-name placeholder '$COAST'.
- aria-labels and roles that must survive: 'Image model', 'Image aspect ratio', 'Image variations', 'Output image format', 'Nano Banana resolution', 'GPT Image quality', 'Image background' (ImageGenerationControls.tsx); 'Clear' (AssetUrlInput.tsx:79); 'Mute'/'Unmute' (DirectorPlayer); role='status' on notices and role='alert' on errors in the Character and Location library pages.
- Visible strings used by flows and tests: 'Generate character sheet', 'Generating character sheet…', 'Sheet history', 'Use as primary reference', 'Generated sheets will remain here for review.', 'Load SF starters', 'New character', 'Capture frame', 'Capturing…', 'Remix frame', 'Remixing…', 'Director offline', 'Session failed', 'Stopping…', 'Loading character library…', 'Start with a reusable character', 'Convex is not configured. Character library changes are disabled.'
- Keep the global React Bits Dither background (components/DitherBackground.tsx: waveSpeed 0.04, waveFrequency 2.6, waveAmplitude 0.4, colorNum 4, pixelSize 2; dark wave [0.2,0.34,0.66] = #3357A8 on [0.02,0.03,0.06] = #05080F; light wave #80A1DB on #FAFAFF). Generated art must use this palette, not replace it.
- Do not edit components/dither-kit/* (their hashes are locked in dither-kit.json). DirectorPlayer's `<DitherGradient from="blue" …>` stays as the base layer under any new boot video.
- Asset size budgets are enforced by `brand:check`: public/brand images ≤ 2.5 MB total and video ≤ 6 MB total; loader strip @2x ≤ 60 KB; empty state 768w webp ≤ 70 KB; hero 1680w ≤ 180 KB; OG ≤ 180 KB; icons ≤ 25 KB; 720p webm ≤ 1.2 MB and mp4 ≤ 2 MB. Raw 2K generations and videos are never committed.
- Replace public/favicon.ico in place. Do not also add app/favicon.ico, because both would serve /favicon.ico.
- Likeness and licensing. TWITCH_CHANNEL '510coast' (wrangler.toml:137) and the Coast track catalog suggest Coast is a real performer; this is an inference to confirm. Generate Coast imagery only from references Coast has explicitly approved. Keep raw face references and the master sheet out of public/ and out of git (Convex storage or the gitignored scripts/brand/.cache/). Ship only stylized outputs. Record model, prompt and request_id for every published asset in scripts/brand/approved.json. Confirm fal/OpenAI/MiniMax output-use terms for commercial brand use before launch (UNVERIFIED). Put no third-party logos (fal, OpenAI, MiniMax, Twitch) inside generated art.
- Unverified endpoints must be treated as unverified. `openai/gpt-image-2.5/sunburst/{text-to-image,edit}`, the `background` and `output_compression` params, quality 'xhigh'/'max', and any batch `minimax/h3-max/*` ID get a verified fallback (`openai/gpt-image-2[/edit]`, `minimax/h3/image-to-video`). Every schema assumption is checked with a quality 'low' draft call first.
- If no FAL_KEY is available to the implementing agent, it ships procedural placeholders at final dimensions plus the script. It must not block on, request, or embed the key.

## Refactor notes
WHAT TO KEEP AND WHERE THE SEAMS ARE.
- lib/imageModels.ts, lib/imageGen.ts and lib/assetGeneration.ts are small and cleanly split. Keep them.
- Put the brand prompt blocks in ONE shared module, lib/brandPrompt.ts, holding the STYLE, IDENTITY and CONSTRAINTS strings and the palette constants. The in-app 'Brand style' preset imports it, and scripts/brand/prompts.mts imports it with a relative `../../lib/brandPrompt.ts` path. The style text then lives in one place.
- Size mapping: rewrite `gptImageSize` as `gptImageSize(aspectRatio): {width,height} | preset`, backed by a table of multiple-of-16 sizes. It is only called from `buildImageInput`, so the change is local.

GENERATION DUPLICATION. Director has its own inline nano-banana calls: generateSheet (DirectorPlayer.tsx:821-843) and remixFrame (779-813). Replace them with `generateImages({ modelId, mode:'edit', prompt, refImages })` from lib/imageGen.ts. Then extract `uploadGeneratedImage` (CharacterLibraryPage.tsx:108-116; LocationLibraryPage has a copy) into lib/persistGenerated.ts, with the signature `(generateUploadUrl, url) => Promise<Id<'_storage'>>`. Reuse it in ShotboardPage (lines 104-113, 149-157, 170-178) and DirectorPlayer. The split is safe to do piece by piece, one call site at a time, because none of these functions share state beyond `setSettings`/`setStatus`.

UNREADABLE PAGE FILES. CharacterLibraryPage.tsx and LocationLibraryPage.tsx cram whole sections onto single lines of 1,500+ characters (e.g. CharacterLibraryPage.tsx:149-150 and 160; LocationLibraryPage.tsx:142 and 151). Before any visual redesign, run Prettier or break them by hand into StudioHero, LibraryGallery, SourceForm and GeneratePanel components with the same props and strings. That is mechanical and has no behavior change. Only then add <EmptyState>/<BrandImage>. AssetStudioVisualFixture.tsx:42-45 has the same one-line layout and is the dev visual-test mirror. Update it alongside so /admin/visual-test keeps matching.

DEAD CODE. Delete utils/falUpload.ts, which is unused and holds a commented NEXT_PUBLIC key pattern. Remove `@fal-ai/serverless-client` from package.json. utils/falApi.ts is still used by hooks/useRealtimeData.ts (LTX metrics); leave it until the LTX path is retired.

PROXY CHANGES. sdk-proxy/route.ts is 7 lines. Adding an `allowedEndpoints` config is a one-object change, but test the Director WMA handshake (`wma.fal.run` serviceHosts, `/ice`, `/session`) and storage upload afterwards, because the library special-cases those paths. In proxy/route.ts, remove the body logs; keep the host allowlist and the timeout.

SCRIPTS ISOLATION.
- Use `.mts` under dashboard/scripts/brand/ and add `scripts` to tsconfig `exclude`, so Next's type-check and `npm run typecheck` ignore Node-only code.
- Use only erasable TypeScript syntax so Node 22 can run it without tsx.
- Import sharp directly. It resolves today through next's optional dependency (sharp 0.34.5), but add it as an explicit devDependency so it stays pinned.
- ffmpeg is a system prerequisite or the `ffmpeg-static` devDependency. The build step prints a clear message if it is missing.

GITIGNORE. Add `scripts/brand/.cache/` to dashboard/.gitignore before the first run.

CONVEX. Role-aware references are an additive change:
- In presentCharacter, return `role` per referenceAsset (look it up from assetVersions via the by_characterId index, capped at 24).
- Stop appending generated sheets to `referenceStorageIds` in completeGeneration. Existing rows keep working; generated sheets simply stop polluting future calls.
- Stripping previously-appended sheet ids from @coast is data cleanup. Do it through a small internal mutation, not by editing the schema.
