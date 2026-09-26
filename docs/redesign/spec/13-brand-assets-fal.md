> **Spec chapter §13 — Brand assets with fal (Coast sheet, GPT Image 2.5 Sunburst, MiniMax H3 Max).** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 13. Brand assets with fal: Coast brand sheet, GPT Image 2.5 Sunburst stills, MiniMax H3 Max motion

This section owns every static and motion brand file: the offline `dashboard/scripts/brand` pipeline, its prompts, the post-processing, the procedural placeholders, the generated manifest, the budgets and the likeness gate. How these assets move is in §6. The `Wordmark` and `CoastLoader` components are in §7.5. The `BrandImage` and `BrandVideo` API and behaviour are owned here (§13.8); §7.5 lists their files and points here. The effects that use them (SymbolRaster, HoloCard, HoverClipButton, PixelFace) are in §12. Paths are repo-relative and line references are **as of 845147c** (the `dashboard/` tree is unchanged at `a52f7c6`). Coast is never gendered: write "Coast" or they/them, in code, prompts, comments and PR text.

### 13.1 Why, and the principles

**Why.** The app has no brand system today. Every fact below was checked in the repo:

| Fact | Evidence |
|---|---|
| `public/` holds exactly two files: `favicon.ico` (1,155 B, one 32×32 PNG entry) and `wzrdtechlogo.png` (1717×425 RGBA, 690,760 B) | `ls -la dashboard/public`; `file public/favicon.ico` |
| The header shows the 690,760 B PNG at `h-9 w-auto`, about 145×36 CSS px. That is 12× more pixels than needed, with no width/height and no modern format | `app/layout.tsx:45-49` |
| @coast has no image. `seedStarterLibrary` inserts Coast with `identityLocked: true` and no references, so the gallery falls back to `assetPlaceholder()`: a violet Arial SVG that reads "visual fixture · add approved reference" | `convex/assets.ts:466-478`, `components/CharacterLibraryPage.tsx:146`, `lib/assetPlaceholders.ts:4` |
| There is no `app/icon*`, `apple-icon`, `manifest`, `opengraph-image` or `twitter-image`. The `app/` root holds only `globals.css`, `layout.tsx` and `page.tsx` | `find app -maxdepth 1 -type f` |
| The in-app GPT Image path cannot make exact sizes: `gptImageSize` maps every ratio to one of 3 presets | `lib/imageModels.ts:85-95` |
| The browser fal path is an unpinned proxy (`createRouteHandler()` with no config) and must not carry batch jobs | `app/api/fal/sdk-proxy/route.ts:7` |
| Coast is likely a real performer: `TWITCH_CHANNEL = "510coast"` | `wrangler.toml:22` |

**Principles.** Every rule in §13.2–§13.10 comes from these.

1. **One identity anchor.** Exactly one approved sheet, `coast-brand-sheet-v1`, made from references Coast has approved, is **Image 1** of every later Coast call. Nothing else defines Coast's identity. That excludes earlier generations, the Convex "Sheet history", the Twitch channel, and the "Coast originals" cover art (`components/AssetStudioVisualFixture.tsx:22-27`), unless the user lists those URLs in `COAST_REF_URLS`.
2. **Exact letterforms are never generated.** The wordmark, "WZRD", the 404 digits and every line of text on the OG card come from the real raster (`public/wzrdtechlogo.png`) or from the PX5×7 pixel font (`lib/pixelFont.json`, §12.3.4). Prompts forbid all text.
3. **The model proposes, `quantize.mts` decides the pixels.** Every generated still is re-quantised the same way every time: to the brand ramp (PX) or to a 32-colour ordered-dither palette (CHROME). Two builds of the same approved raw are byte-identical.
4. **Offline, run by an operator, never in the app.** The pipeline runs on a human's machine or in a Devin session under D5, and reads `FAL_KEY` from the environment. It calls fal directly with `createFalClient({ credentials })`. It never goes through `/api/fal/*`, never runs inside `next build`, CI or the browser, and never adds a runtime dependency (D8).
5. **Likeness and consent gate (D5, D9).** Coast pixels are generated only when `FAL_KEY` **and** approved references exist. References come from `COAST_REF_URLS`. Files in `scripts/brand/.cache/refs/` are read only when a human operator passes `run --operator-refs` (§13.4). Supplying the references is the user's confirmation of Coast's consent (§2.1). Raw references and the master sheet never enter `public/`, `app/` or git. Only stylised, quantised outputs ship, and Coast signs off on the finals before merge.
6. **Provenance.** Every shipped generated file can be traced in the committed `scripts/brand/approved.json`: endpoint, exact prompt, input with references tokenised, request id, and sha256 of the raw and built files. `build` needs no key.
7. **Complete without a key.** Without the D5 secrets, `build` writes procedural, **non-human** placeholders at the final dimensions, listed with `generated:false`. The UI never shows a fake likeness and never 404s a brand file.
8. **Budgets are code.** `brand:check` enforces dimensions, bytes, alpha, palettes, provenance and git hygiene. `run` enforces the money cap ($40, D5).

**Not in scope.** These ideas come from `docs/redesign/audit/fal.md` and the bible dropped them: the admin hero banner, the section textures, light-theme art variants, a monogram "W", and an H3 loop inside the program monitor (bible O13). Also out: the in-app "Brand style" preset and every in-app pipeline change (D7; §17 lists them).

### 13.2 Endpoints and verification status

Status as of 2026-09-25, from the authoring sandbox, where `fal.ai` and `api.fal.ai` are blocked (the proxy returns 403 on `CONNECT`). "Typings" means `dashboard/node_modules/@fal-ai/client/src/types/endpoints.d.ts` in `@fal-ai/client@1.11.0-alpha.3`.

| Role | Endpoint id | Status | Evidence | Used by |
|---|---|---|---|---|
| Still, edit (primary) | `openai/gpt-image-2.5/sunburst/edit` | **UNVERIFIED** | Appears only in `lib/imageModels.ts:69`; absent from the typings | Every still in §13.6 |
| Still, text-to-image (primary) | `openai/gpt-image-2.5/sunburst/text-to-image` | **UNVERIFIED** | Only in `lib/imageModels.ts:68` | Nothing in §13.6: every asset shows Coast, so every still is an edit. Kept for future art without Coast |
| Still, edit (fallback) | `openai/gpt-image-2/edit` | Verified in typings | `GptImage2EditInput` (`:13994`), map entry (`:65019`) | Automatic fallback |
| Still, text-to-image (fallback) | `openai/gpt-image-2` | Verified in typings | `GptImage2Input` (`:14028`), map entry (`:65015`) | Fallback for the unused text-to-image role |
| Motion, image-to-video (primary) | `minimax/h3-max/image-to-video` | **UNVERIFIED** | Referenced nowhere. The H3 Max family exists on the account: the realtime `DIRECTOR_MODEL = 'minimax/h3-max/director'` (`components/DirectorPlayer.tsx:27`, opened at `:959`) | Both motion assets |
| Motion, image-to-video (fallback) | `minimax/h3/image-to-video` | Verified in typings | `H3ImageToVideoInput` (`:14250`), map entry (`:64927`) | Automatic fallback |
| Motion, identity-drift fallback | `minimax/h3/reference-to-video` | Verified in typings | `H3ReferenceToVideoInput` (`:14272`), map entry (`:64931`) | Only after a variant is rejected for identity drift (§13.6.6) |
| Realtime anchor | `minimax/h3-max/director` | In production use | `DirectorPlayer.tsx:27`, `:959` | Only the manual H3 Max alternative (below) |

**Verified schema facts (typings).** Re-verify them before coding by running this from `dashboard/`: `grep -n "export type GptImage2EditInput\|export type GptImage2Input\|export type H3ImageToVideoInput\|export type H3ReferenceToVideoInput\|export type I2VOutput\|export type photaOutput\|export type ImageSize = " node_modules/@fal-ai/client/src/types/endpoints.d.ts`

- `GptImage2Input.image_size` (`:14030-14032`) takes a preset or `{ width, height }`. The typings say: "Concrete sizes must have both dimensions as multiples of 16, max edge 3840px, aspect ratio <= 3:1, total pixels between 655,360 and 8,294,400." `ImageSize` is `{ width?: number; height?: number }` (`:17308`). The edit variant accepts the same type and defaults to `'auto'` (`:13998`).
- `GptImage2EditInput.image_urls` takes at most 16 images (`:14000-14002`). `quality` is `'auto' | 'low' | 'medium' | 'high'` (`:14022`). There is **no** `background`, `output_compression` or `seed` key. `sync_mode` exists (`:14026`). The pipeline never sets it. Instead, every submit passes `storageSettings: { expiresIn: '7d' }` (§13.3.4), so fal's copies of the outputs expire after 7 days. The pipeline downloads each output at once, and 7 days covers a resumed poll. The installed client sends this as the object-lifecycle header (`src/queue.js:50`, `src/types/common.d.ts:35`; `expiresIn` accepts `'1h' | '1d' | '7d' | …`, `src/storage.d.ts`).
- Both GPT endpoints output `photaOutput { images: ImageFile[] }` (`:36430`).
- `H3ImageToVideoInput` (`:14250-14271`) has:
  - `image_url` (the output aspect follows this image);
  - optional `end_image_url`, "for first-to-last keyframe generation";
  - `duration` (default 5; other values unverified);
  - `resolution` ("Only 2K is currently supported").
- `H3ReferenceToVideoInput` (`:14272-14301`) has:
  - `aspect_ratio`, one of `adaptive | 21:9 | 16:9 | 4:3 | 1:1 | 3:4 | 9:16`;
  - `reference_image_urls`, which the prompt addresses as "Image 1, Image 2…";
  - at most 12 reference files in total;
  - `duration` and `resolution`.
- Video output is `I2VOutput { video: File }` (`:16012`), with the URL in `File.url` (`:9820`).

**Size rule, enforced in code.** `assets.mts` runs this on every still when the module loads, so a bad size fails before any call:

```ts
export function assertImageSize(s: { width: number; height: number }): void {
  const px = s.width * s.height
  const ratio = Math.max(s.width, s.height) / Math.min(s.width, s.height)
  if (s.width % 16 !== 0 || s.height % 16 !== 0 || Math.max(s.width, s.height) > 3840 || ratio > 3 || px < 655_360 || px > 8_294_400) {
    throw new Error(`image_size ${s.width}x${s.height} violates the GPT Image size rule`)
  }
}
```

All nine generation sizes in §13.6 pass. Checked: 2048×1152, 2048×1024, 1024×1024, 1920×1088, 1088×1920, 1088×1088, 1536×2048, 1536×1024, 2400×1264.

**Verification protocol (mandatory before the first paid call):**

1. Open `https://fal.ai/models/openai/gpt-image-2.5/sunburst/edit/api` and `https://fal.ai/models/minimax/h3-max/image-to-video/api`. Record in the PR "Decisions":
   - the date you read the page;
   - whether the endpoint exists;
   - the input keys and allowed values for `image_size`, `quality`, `background`, `image_urls` (max count), `image_url`, `end_image_url`, `duration` and `resolution`.
2. If a key name or allowed value differs from §13.6, change **only** that endpoint's adapter in `endpoints.mts` (for example, renaming a key). Never change a prompt to fit a schema. List the difference in the PR.
3. The first still call on any endpoint is a draft (`quality: 'low'`, `num_images: 1`).
   - `run --tier final` refuses a **still** endpoint until `.cache/probe.json` records a successful draft on it (`probe: <endpoint> not verified by a draft yet`).
   - A final always uses the endpoint its selected draft used.
   - The probe gate applies to still endpoints only. Motion endpoints have no draft tier: the first real call is the probe, and the first successful motion final writes that endpoint's `probe.json` entry.
4. **Fallback rules.** `fal.mts` applies these; never apply them by hand.
   - HTTP 404 (endpoint missing): switch to the asset's fallback endpoint.
   - HTTP 422 (validation):
     1. Print the redacted error body.
     2. Drop only `background`, and switch the prompt's background clause to the magenta key (`BG.magenta`, §13.5).
     3. Retry once on the same endpoint.
     4. If that fails too, switch to the fallback endpoint.
     The prompt text is never shortened.
   - `openai/gpt-image-2/edit` has no `background` key, so a transparent asset always uses the magenta key there.
   - Every switch is written to the ledger and, on approval, to `approved.json`. Its `endpoint` field records what actually ran.
   - There is weak evidence that 2.5 accepts `background`: the app sends `background: 'auto'` on every GPT Image 2.5 call today (`lib/imageModels.ts:128`). Whether `'transparent'` works is unverified.

**Manual H3 Max alternative.** **Human operator only; Devin never runs it** (§1.8 item 3): it opens a paid realtime Director session and needs a browser `MediaStream`. It is unverified end to end. If a motion asset would need it, Devin lists it under Deferred / blocked as "not run (paid)".
1. Upload the approved still (the raw from `.cache/raw/…`) with the upload button of the 'First frame (optional)' field. Paste the same URL into 'Last frame of first chunk (optional)' (`components/DirectorSettingsForm.tsx:134-155`).
2. Paste the motion prompt (§13.6.6 or §13.6.7) as the premise.
3. Press 'Start Director' and wait for PVW.
4. Press 'Record' (`DirectorPlayer.tsx:1270`) and record at least 6 s (one full first chunk).
5. Press 'Stop & save recording' (`:1282`), then 'Stop'.
6. On Recordings, press 'Download' (`app/admin/recordings/page.tsx:110`). Register the file with `node --experimental-strip-types scripts/brand/generate.mts approve <assetId> --manual <file>` (§13.3.3). `approved.json` then records `endpoint: "minimax/h3-max/director (manual capture)"` and `requestId: null`.

### 13.3 The `scripts/brand` pipeline

#### 13.3.1 Files

```text
dashboard/
  scripts/brand/
    generate.mts            CLI entry: plan | run | approve | build | check
    assets.mts              canonical asset list as data (§13.6): ids, tier, size, inputs, needs, outputs, budgets
    prompts.mts             STYLE_PX, STYLE_CHROME, IDENTITY, IMAGE2_WORDMARK, CONSTRAINTS, BG, compose(), per-asset parts (§13.5, §13.6)
    endpoints.mts           endpoint ids, fallbacks, per-endpoint input adapters, droppable keys
    fal.mts                 client, uploads, queue submit/status/result, semaphore(3), cache, ledger (the ONLY module importing @fal-ai/client)
    pricing.mts             live pricing + fallback table + estimate()
    quantize.mts            PX and CHROME quantisers, median cut, magenta key, alpha threshold, outline, nearest upscale, sprite slicer
    encode.mts              sharp encode ladders, favicon.ico writer, SVG rect writer, pixel-font text renderer
    video.mts               ffmpeg resolution, frame extraction, loop seam, per-frame quantise, WebM/MP4 ladders
    placeholders.mts        procedural non-human placeholders (§13.7)
    manifest.mts            writes public/brand/manifest.json, lib/brandAssets.ts, components/boot/masks.ts
    check.mts               brand:check rules BC-01…BC-16 and the contact sheet (§13.9)
    util.mts                args, glob, sha256, canonical JSON, redact(), exit codes
    no-network.mjs          preload that disables every network API for the offline checks (§13.3.7); never imported by the pipeline
    pricing.fallback.json   conservative manual price table (§13.3.6)
    approved.json           committed provenance (§13.3.5)
    spend.jsonl             committed spend ledger: one line per paid submit (§13.3.4); first written by the M9 `brand` run
    tsconfig.json           type-check only (npm run brand:typecheck)
    .cache/                 gitignored working area (below)
  lib/brandAssets.ts        generated (§13.8)
  lib/pixelFont.json        PX5×7 glyph table shared with PixelFace (content and encoding: §12.3.4; created in 3B, §13.6.10)
  components/boot/masks.ts  generated (§13.6.11)
  public/brand/**           built outputs (§13.6)
  public/favicon.ico        replaced in place (§13.6.10)
  app/icon.svg, app/apple-icon.png, app/manifest.ts, app/opengraph-image.png(+.alt.txt), app/twitter-image.png(+.alt.txt)
```

The `.cache/` layout (never committed):

```text
scripts/brand/.cache/
  refs/                         identity references: url-<n>.<ext> downloaded from COAST_REF_URLS; top-level files placed by a human operator are read only with run --operator-refs (§13.4)
  refs/anchor/                  coast-brand-sheet-v1.png (approved master sheet) and wordmark-material.png; a subfolder, so never read as identity refs
  raw/<assetId>/                <key16>-<i>.<png|mp4|webm>, <key16>.meta.json, index.json (ordered variants #1, #2, …)
  frames/<assetId>/             ffmpeg scratch, deleted at the end of build
  contact/<tier>-<yyyymmdd-hhmmss>.png   review sheets written by run
  uploads.json                  sha256 → { url, uploadedAt }; entries older than 20 h are re-uploaded
  requests.jsonl                ledger, one JSON object per line (the submit lines are also in the committed spend.jsonl)
  pending.json                  cache key → { endpoint, requestId } for submitted, unfinished requests
  selection.json                assetId → { variant, canonicalPromptSha256, endpoint, transparency } approved drafts (gate for --tier final)
  probe.json                    endpoint → { ok: true, at, assetId } after the first successful draft (still) or final (motion)
```

Asset ids contain `/` (for example `slate/clips`), so `raw/slate/clips/` is a nested folder.

#### 13.3.2 Runtime rules

- **Node.** Requires Node ≥ 22.6; `npm run brand:plan` prints the Node version first. Nothing pins Node (`dashboard/package.json` has no `engines` field and there is no `.nvmrc`), so every `brand:*` script that runs Node passes `--experimental-strip-types`: 22.6–22.17 need it, and later versions accept it as a no-op (`node --experimental-strip-types -e 1` exits 0 on 22.22.2). It is a flag, not a loader. On the measured Node v22.22.2, `node -p process.features.typescript` prints `strip`, and an `.mts` file that imports another `.mts` file runs with no warning (verified). Never add `tsx`, `ts-node` or a loader.
- **Erasable TypeScript only.**
  - Allowed: annotations, `type`, `interface`, `as`, `satisfies`, `import type`, `export type`.
  - Banned: `enum`, `const enum`, `namespace` with values, constructor parameter properties, `import x = require()`, `export =`, decorators, JSX.
  - Type-only imports must use `import type`. Under type stripping, a value import of a type crashes.
  - Relative imports carry the explicit `.mts` extension. Built-ins use the `node:` prefix. Read JSON files with `fs.readFileSync` + `JSON.parse`.
  - Never import app code from `app/`, `components/` or `lib/*.ts`. A `.ts` file in a package without `"type"` triggers `MODULE_TYPELESS_PACKAGE_JSON` warnings (verified). The only shared file is `lib/pixelFont.json`.
- **Type-check.** `scripts/brand/tsconfig.json` is below. Verified with TypeScript 5.9.2: `erasableSyntaxOnly` rejects `enum` with TS1294.

  ```json
  {
    "compilerOptions": {
      "target": "es2023", "module": "nodenext", "moduleResolution": "nodenext",
      "strict": true, "noEmit": true, "allowImportingTsExtensions": true,
      "erasableSyntaxOnly": true, "verbatimModuleSyntax": true,
      "skipLibCheck": true, "types": ["node"]
    },
    "include": ["*.mts"]
  }
  ```

- **Root `dashboard/tsconfig.json`:** its `"exclude"` already contains `"scripts"` from part 1A (§15.1), so `next build` and `npm run typecheck` never read Node-only code. 3B does not edit the file; BC-11 checks it. `next lint` lints only `app`, `components`, `lib`, `pages` and `src`, so `scripts/` needs no ESLint change.
- **`dashboard/.gitignore`:** append the line `scripts/brand/.cache/` **before** the first run.
- **`dashboard/package.json`:**

  ```json
  "scripts": {
    "brand:plan": "node --experimental-strip-types scripts/brand/generate.mts plan",
    "brand:gen": "node --experimental-strip-types scripts/brand/generate.mts run",
    "brand:build": "node --experimental-strip-types scripts/brand/generate.mts build",
    "brand:check": "node --experimental-strip-types scripts/brand/generate.mts check",
    "brand:typecheck": "tsc -p scripts/brand/tsconfig.json"
  },
  "devDependencies": { "sharp": "0.34.5" }
  ```

  - `sharp` is pinned to the version `next` already resolves (`node -p "require('sharp/package.json').version"` prints `0.34.5`), so no second copy installs.
  - No script reads an env file. `FAL_KEY` and `COAST_REF_URLS` come only from the process environment (Devin secrets). Never create `dashboard/.env.local` (§1.6 step 0, §2.1).
  - `approve` has no npm alias. Run `node --experimental-strip-types scripts/brand/generate.mts approve …` from `dashboard/`.
  - Never add `prebuild`, `postinstall` or `pages:build` hooks that call the pipeline.
- **ffmpeg.**
  - Do **not** add `ffmpeg-static` to `package.json`. Its install script downloads a platform binary on every `npm ci`, including Cloudflare Pages builds.
  - On the machine that builds motion, run `npm i --no-save ffmpeg-static@5.3.0` (the current version on npm, verified with `npm view`).
  - `video.mts` resolves `ffmpeg-static` through `createRequire`, never through a literal `import('ffmpeg-static')`. The package is not in `package.json`, so tsc would resolve a literal specifier and fail `npm run brand:typecheck` with TS2307 on every checkout. `createRequire` returns `any`, so the type-check never resolves the module:

    ```ts
    import { createRequire } from 'node:module'
    function ffmpegStatic(): string | null {
      try { return createRequire(import.meta.url)('ffmpeg-static') as string | null } catch { return null }
    }
    ```

  - Lookup order: `process.env.FFMPEG_PATH`, then `ffmpegStatic()`, then `ffmpeg` on `PATH`.
  - If none is found and a motion raw is approved, `build` exits 3 with `ffmpeg not found: set FFMPEG_PATH or run npm i --no-save ffmpeg-static@5.3.0`. With no approved motion raw, `build` needs no ffmpeg. ffprobe is never needed.

> Note: D8 (§2.2) allows `ffmpeg-static` only through `npm i --no-save`; it is never saved (§16.6 N19).

#### 13.3.3 CLI

Run every command from `dashboard/`.

Exit codes:

| Code | Meaning |
|---|---|
| `0` | OK |
| `1` | Check failed |
| `2` | Usage error |
| `3` | Missing prerequisite: key, references, sheet, ffmpeg or `lib/pixelFont.json` |
| `4` | Budget exceeded, or `--yes` required |
| `5` | CI refusal |
| `6` | fal error after all fallbacks |

| Command | Flags | Behaviour |
|---|---|---|
| `plan` | `--only <glob>` · `--tier draft\|final\|all` (default `all`) · `--json` · `--list <assetId>` · `--ledger` | Makes no generation calls. Prints one row per job: asset, tier, endpoint (fallback), `image_size`, quality, `num_images`, estimated USD, price source, `needs`, and cache status (`hit`/`miss`/`pending`). Then prints totals: draft, final, motion, contingency, ledger to date, remaining budget. Works without `FAL_KEY` (price source `fallback`). `--list` prints the variant index of one asset: `#n`, tier, key16, endpoint, dimensions, first 8 characters of the sha256, and `selected`/`approved` flags. `--ledger` prints only the ledger summary |
| `run` | `--tier draft\|final` (required) · `--only <globs>` · `--budget-usd <n>` (default `40`) · `--yes` · `--allow-ci` · `--reroll <n>` (default `0`) · `--dry-run` · `--operator-refs` (human operator only, §13.4) | Checks, in this order: CI refusal (exit 5), `FAL_KEY` (exit 3), references (§13.4; exit 3 when `COAST_REF_URLS` is empty without `--operator-refs`), budget (exit 4). Then it uploads, builds each job's input, checks the cache, submits with concurrency 3, downloads, writes the ledger, prints a variant list, and writes `.cache/contact/<tier>-<stamp>.png`. See the tier and reroll rules below this table |
| `approve` | `<assetId> <n>` · `<assetId> --manual <file>` · `--trim-start <s>` (motion, default `0`) · `--seam auto\|off` (loop, default `auto`) | `<n>` is the variant `#n` from `plan --list`. Approving a **draft** variant writes it to `.cache/selection.json`, which gates the final. Approving a **final** variant writes it to `approved.json`. Approving `coast-brand-sheet-v1` also copies the raw to `.cache/refs/anchor/coast-brand-sheet-v1.png`. `--manual` registers a Live Control recording (§13.2) |
| `build` | `--only <glob>` · `--placeholders` | Offline and repeatable: never imports `fal.mts` and makes zero network requests (proved under `no-network.mjs`, §13.3.7). For each asset: if an approved raw is in `.cache`, build it; if the asset is approved but its raw is absent, keep the committed outputs, which must hash-match `approved.json`; otherwise build placeholders (§13.7). Derived assets (wordmark, masks, icons) always build. Writes `public/brand/manifest.json`, `lib/brandAssets.ts` and `components/boot/masks.ts`. No output contains a timestamp, so a second run produces no git diff. `--placeholders` forces placeholders everywhere (for tests) |
| `check` | `--contact-sheet <path>` · `--rebuild` | Runs BC-01…BC-16 (§13.9) and prints a table of violations. `--contact-sheet` writes a PNG of every shipped image (§13.10). `--rebuild` rebuilds into a temp dir and compares sha256 (needs the `.cache` raws) |

**`run` tier and reroll rules:**
- **Draft:** `quality: 'low'`, `num_images: 1`.
- **Final:** `quality: 'high'`, `num_images: 2`.
  - It requires a selected draft whose canonical prompt hash (taken before any magenta switch) equals the current one.
  - It reuses that draft's endpoint and exact prompt, so only `quality` and `num_images` change.
- Motion jobs run only with `--tier final`.
- An asset whose `needs` are not approved is skipped with `SKIP <id>: needs <dep> approved`.
- **Stills:** `--reroll n` adds `"reroll": n` to the cache key only, never to the request. `n` is at most the asset's `maxRerolls`: 2 for the sheet, 1 for everything else.
- **Motion:** `--reroll 1` selects `minimax/h3/reference-to-video`, the identity-drift fallback (§13.6.6).
- `--dry-run` resolves cache hits and cost without uploading or calling.

`--only` takes a comma-separated list of globs over asset ids. `*` matches within one segment and `**` matches across segments (`slate/*`, `standby/**,talent/**`).

#### 13.3.4 fal access, queue, cache and ledger (`fal.mts`)

- **Auth.**
  - `const fal = createFalClient({ credentials: key })`, from the installed `@fal-ai/client`, where `key = process.env.FAL_KEY?.trim()`.
  - Only `run` imports `fal.mts`. `pricing.mts` reads the same variable for the pricing request.
  - When the key is missing, `run` exits 3 with `FAL_KEY is not set (goal.md D5: ship placeholders instead)`, and `plan` uses fallback prices.
  - Cache keys use content hashes, so `plan` can compute hit/miss status without uploading anything.
  - Never read the key from any other variable. Never print it, write it to disk, or pass it to a child process.
- **Never the app proxy.** `grep -rnE "sdk-proxy|/api/fal|proxyUrl" dashboard/scripts/brand` prints nothing.
- **Submit, poll, fetch.** At most 3 jobs are in flight at once, limited by a 10-line semaphore written in the file (never `p-limit`). `ApiError` is imported from `@fal-ai/client` (`src/index.d.ts:11`; it carries `status`):

  ```ts
  export async function callQueued(job: Job): Promise<unknown> {
    const pending = readPending()[job.key]
    const requestId = pending?.requestId
      ?? (await fal.queue.submit(job.endpoint, { input: job.input, storageSettings: { expiresIn: '7d' } })).request_id
    if (!pending) {
      writePending(job.key, { endpoint: job.endpoint, requestId })
      ledger({ event: 'submit', assetId: job.assetId, tier: job.tier, endpoint: job.endpoint, key: job.key, requestId, estUsd: job.estUsd })
    }
    const deadline = Date.now() + (job.kind === 'motion' ? 30 : 10) * 60_000
    for (;;) {
      const st = await fal.queue.status(job.endpoint, { requestId, logs: false })
      if (st.status === 'COMPLETED') break
      if (Date.now() > deadline) { ledger({ event: 'timeout', assetId: job.assetId, requestId }); throw new BrandError(6, `timeout ${job.assetId}`) }
      await sleep(job.kind === 'motion' ? 5000 : 2000)
    }
    let data: unknown
    try {
      ({ data } = await fal.queue.result(job.endpoint, { requestId }))
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status <= 499) { // the request failed: never re-poll it
        clearPending(job.key)
        ledger({ event: 'error', assetId: job.assetId, requestId, status: e.status })
      }
      throw e // 4xx → the fallback rules of docs/redesign/spec/13-brand-assets-fal.md §13.2; 5xx keeps the pending entry
    }
    clearPending(job.key)
    ledger({ event: 'done', assetId: job.assetId, endpoint: job.endpoint, requestId })
    return data
  }
  ```

  - A timed-out or interrupted request stays in `pending.json`. The next `run` **resumes polling that `requestId`** instead of resubmitting, so a crash never bills twice.
  - A 4xx from `fal.queue.result` (for example 404 or 422 on a failed request) clears the pending entry, writes an `error` ledger line and goes to §13.2's fallback rules, so a later run resubmits instead of re-polling a failed request. A 5xx keeps the pending entry.
  - Status polling retries network errors and 5xx responses after 2, 4, 8, 16 and 32 s (polling is free). A 5xx on **submit** is retried once after 5 s. 4xx responses follow only §13.2's fallback rules.
  - Outputs are read from `data.images[i].url` (images) and `data.video.url` (video). Each is downloaded immediately with `fetch` and its content type checked (`image/png` or `video/mp4`). It is written to `.cache/raw/<assetId>/<key16>-<i>.<ext>` with a `meta.json` holding the endpoint, tokenised input, requestId, timings, estUsd, and each image's sha256 and dimensions.
- **Cache.** `key = sha256(canonicalJson({ endpoint, input: tokenised, reroll }))`. `canonicalJson` sorts object keys. `tokenised` replaces every uploaded URL with `sha256:<hex of the uploaded bytes>`. A cache hit is never billed again and is logged as `cache-hit`.
- **Ledger.** `.cache/requests.jsonl` has one line per event (`submit`, `cache-hit`, `done`, `error`, `timeout`, `fallback`):

  ```json
  {"ts":"2026-09-26T10:14:03.512Z","event":"submit","assetId":"slate/clips","tier":"draft","endpoint":"openai/gpt-image-2.5/sunburst/edit","key":"9f2c41d07aa3e6b1","requestId":"<fal request id>","estUsd":0.05}
  ```

- **Spend ledger (committed).** `.cache/` is gitignored and Devin sessions are ephemeral, so `ledger()` also appends every `submit` event to `scripts/brand/spend.jsonl`, which is committed. Each line is the `submit` line above without its `event` field: exactly `ts`, `assetId`, `tier`, `endpoint`, `key` (key16), `requestId` and `estUsd`. A fresh clone therefore starts from the recorded spend, not from $0 (§13.3.6).
- Ledger and spend lines never contain a URL, a reference file name, or the `FAL_KEY` value.

#### 13.3.5 `approved.json` (committed)

Part 3B commits this initial content: `{ "version": 1, "sheet": null, "assets": {} }`.

```ts
type Approved = {
  version: 1
  sheet: null | {
    assetId: 'coast-brand-sheet-v1'
    endpoint: string; requestId: string; prompt: string; promptSha256: string
    input: Record<string, unknown>        // image_urls → ["coast-ref-1", …, "coast-ref-n"]
    raw: { sha256: string; width: 2048; height: 1152 }
    refs: { count: number; sha256: string[] } // hashes of the identity references used; never URLs or file names
    approvedAt: string                      // ISO date
  }
  assets: Record<string, {
    tier: 'PX' | 'CHROME' | 'MOTION'
    endpoint: string                        // the endpoint that actually produced the raw
    requestId: string | null                // null only for --manual
    prompt: string                          // verbatim, as sent
    promptSha256: string
    input: Record<string, unknown>          // image_urls → ["coast-brand-sheet", "wzrdtech-wordmark"]; image_url/end_image_url → "<assetId>@raw"
    transparency?: 'alpha' | 'magenta-key'
    sheetSha256: string                     // must equal sheet.raw.sha256
    raw: { sha256: string; width: number; height: number; variant: number }
    build: { trimStartS?: number; seam?: 'auto' | 'off' }
    outputs: Record<string, string>         // repo-relative path → sha256 of the built file
    approvedAt: string
    approvedBy: string                      // 'devin' or the human's name
  }>
}
```

`approved.json` and `spend.jsonl` must never contain `http`, `Key `, or any `COAST_REF_URLS` value (BC-09).

#### 13.3.6 Budget guard and pricing (`pricing.mts`)

- **Live price.** Request `GET https://api.fal.ai/v1/models/pricing?endpoint_id=<comma-separated, URL-encoded ids>` with the header `Authorization: Key <FAL_KEY>`. The response shape is unverified. Accept either `{ prices: [{ endpoint_id, unit_price, unit, currency }] }` or `{ data: [{ endpoint_id, pricing: { price, unit } }] }` (the fal-platform skill's scripts use both). Any other shape, or any error, means "no live price".
- **Fallback table.** `scripts/brand/pricing.fallback.json` holds conservative placeholders, not quotes:

  ```json
  {
    "openai/gpt-image-2.5/sunburst/edit":          { "unit": "image", "low": 0.05, "medium": 0.15, "high": 0.40, "refMegapixels": 2.36 },
    "openai/gpt-image-2.5/sunburst/text-to-image": { "unit": "image", "low": 0.05, "medium": 0.15, "high": 0.40, "refMegapixels": 2.36 },
    "openai/gpt-image-2/edit":                     { "unit": "image", "low": 0.05, "medium": 0.15, "high": 0.40, "refMegapixels": 2.36 },
    "openai/gpt-image-2":                          { "unit": "image", "low": 0.05, "medium": 0.15, "high": 0.40, "refMegapixels": 2.36 },
    "minimax/h3-max/image-to-video":               { "unit": "video_second", "price": 1.00 },
    "minimax/h3/image-to-video":                   { "unit": "video_second", "price": 0.60 },
    "minimax/h3/reference-to-video":               { "unit": "video_second", "price": 0.60 }
  }
  ```

- **Estimate.**
  - Image: `unitPrice × num_images × max(1, megapixels / 2.36)`.
  - Video: `unitPrice × duration`.
  - Unit `request` or `call`: `unitPrice`.
  - An unknown unit uses the fallback.
  - **The estimate is the larger of the live figure and the fallback figure**, so an incomplete live price never under-counts.
  - Every row prints its price source: `live`, `fallback`, or `fallback>live`.
- **Guard** (runs before any upload or submit):
  - `ledgerTotal` is the sum of `estUsd` over the `submit` lines of the committed `scripts/brand/spend.jsonl` and `.cache/requests.jsonl` together, de-duplicated by `requestId`, across all runs, sessions and machines. `plan`'s "ledger to date" and `plan --ledger` use the same sum.
  - If `ledgerTotal + thisRun > --budget-usd`, exit 4 with `budget: $<ledger> spent + $<run> planned > $<cap> cap`.
  - If `thisRun > 10` and `--yes` is absent, exit 4 with `this run is estimated at $<run>; re-run with --yes`.
  - Devin never passes a `--budget-usd` above `40` (D5).

#### 13.3.7 Safety

- **CI refusal.**
  - `run` exits 5 with `refusing to spend money in CI; pass --allow-ci only for a deliberate operator run` when any of `CI`, `GITHUB_ACTIONS`, `CF_PAGES` or `VERCEL` is set to anything other than `''`, `0` or `false`, unless `--allow-ci` is passed.
  - If Devin's own shell sets `CI`, Devin may pass `--allow-ci` on a D5 command line and must say so in the PR "Decisions".
  - `--allow-ci` never appears in `package.json`, a workflow, or any script file.
  - `plan`, `build` and `check` are safe to run in CI.
- **Redaction.** `util.mts` exports `redact(s)`, which is applied to every console line, thrown message (including the 422 error bodies that §13.2 prints) and ledger write. It replaces, in this order:
  - `/Key\s+[A-Za-z0-9_:.\-]{8,}/g` with `Key [REDACTED]`;
  - the literal `FAL_KEY` value with `[REDACTED]`;
  - every `COAST_REF_URLS` entry and every uploaded reference URL with `ref-<n>`;
  - every other URL whose host is `fal.media` or `fal.run` or ends in `.fal.media` or `.fal.run` (outputs, the master-sheet and `<assetId>@raw` uploads), and every URL listed in `.cache/uploads.json`, with `fal-url-<sha8>` (the first 8 hex digits of the URL's sha256).
  References are printed only as `ref-<n> (sha256:<first 8>)`. `redact('https://v3.fal.media/files/a/b.png')` contains no `fal.media` (§13.11).
- **Network scope.** `run` talks only to fal hosts and to the hosts in `COAST_REF_URLS`. `build` and `check` make zero network requests. Node's global `fetch` (undici) ignores `HTTP_PROXY` and `HTTPS_PROXY` (measured on Node 22.22.2: a `fetch` with both set to `http://127.0.0.1:9` returned 200), so a dead proxy proves nothing. §13.11 runs `build` and `check` under this preload instead, which makes every network API throw:

  ```js
  // dashboard/scripts/brand/no-network.mjs — preload for the offline checks (docs/redesign/spec/13-brand-assets-fal.md §13.3.7). Never imported by the pipeline.
  import { syncBuiltinESMExports } from 'node:module'
  import dns from 'node:dns'
  import http from 'node:http'
  import https from 'node:https'
  import net from 'node:net'
  import tls from 'node:tls'

  const off = () => { throw new Error('network disabled (brand offline check)') }
  globalThis.fetch = off
  net.connect = off; net.createConnection = off; tls.connect = off
  http.request = off; http.get = off; https.request = off; https.get = off
  dns.lookup = off
  syncBuiltinESMExports() // named ESM imports of these built-ins see the replacements too
  ```

  Verified on Node 22.22.2 with `node --experimental-strip-types --import ./no-network.mjs`: `fetch`, `https.request` and `net.connect` each throw `network disabled (brand offline check)`.
- **Never in the app.** No file under `app`, `components`, `hooks` or `lib` imports from `scripts/brand`. The generated files only name it in a comment.

### 13.4 The reference protocol

1. **Sources**, in this order:
   - `COAST_REF_URLS`: comma-separated `https` URLs. For example, @coast's identity references from Characters → `referenceAssets`, which are Convex storage URLs.
     - Each is fetched with `redirect: 'follow'`.
     - The response must be 2xx, have `content-type: image/*`, and be at most 20 MB.
     - It is saved as `.cache/refs/url-<n>.<ext>`.
   - Files a human operator put directly in `.cache/refs/`: top level only, `*.png|*.jpg|*.jpeg|*.webp`, sorted by name. They are read **only** with `run --operator-refs`, which only a human passes. Without it, top-level files in `.cache/refs/` are ignored.
   - Devin never passes `--operator-refs` and never writes, copies or downloads files into `scripts/brand/.cache/refs/` (§2.1). The pipeline's own writes are the exception: the `url-<n>` downloads above and the `refs/anchor/` files (§13.3.1).
   - Without `--operator-refs`, if `COAST_REF_URLS` is empty, `run` exits 3 with `no approved Coast references (D5): COAST_REF_URLS is empty`.
2. **Validation.**
   - Each reference must decode with sharp and have a short side of at least 512 px.
   - It must not be one of the pipeline's own outputs: its sha256 must not match any file under `.cache/raw/**`, any `raw.sha256` in `approved.json`, or `sheet.raw.sha256`.
   - A reference that fails is skipped with a redacted warning.
3. **Count.**
   - De-duplicate by sha256 and use the first **4**.
   - If more are supplied, print `using 4 of <n> references (the pipeline accepts at most 4 identity references)`.
   - Never use a previously generated sheet as an identity reference. That includes the sheets D2 describes as appended to the references.
4. **Zero usable references** (every supplied reference failed step 2). Every Coast job (all of §13.6) is skipped with `SKIP <id>: no approved Coast references (D5)`, and `build` ships placeholders. The script never asks for references and never waits.
5. **Consent line.** At the start of `run`, print once: `Using <n> approved Coast references (COAST_REF_URLS). Proceeding on the user's confirmation of Coast's consent (goal.md §2.1).` There is no interactive prompt.
6. **Upload.**
   - sharp auto-orients each reference and re-encodes it to PNG (`.rotate().png()`), which strips EXIF and GPS data.
   - It is uploaded with `fal.storage.upload(new Blob([buf], { type: 'image/png' }), { lifecycle: { expiresIn: '1d' } })`. The installed client accepts `'1d'` for `UploadOptions.lifecycle.expiresIn` (`src/storage.d.ts`).
   - Upload URLs are cached in `.cache/uploads.json` by content hash and re-uploaded after 20 h.
7. **Image roles.**
   - The **sheet call** receives only the references: `image_urls: [ref-1 … ref-n]`, addressed as "Images 1–n".
   - **Every other Coast still**: Image 1 is the approved `coast-brand-sheet-v1`, uploaded from `.cache/refs/anchor/`.
   - **CHROME stills** (standby ×3, portrait, OG) add Image 2, the wordmark, as a **material-only** reference. It is `public/wzrdtechlogo.png` flattened onto `#05080F` (`sharp(...).flatten({ background: '#05080F' })`), saved as `.cache/refs/anchor/wordmark-material.png` and uploaded once.
   - **Motion**: `image_url` and `end_image_url` are both the approved raw of the source still, re-encoded as JPEG (`quality: 92, mozjpeg: true`) to stay well under typical input limits.
8. **Never:**
   - copy a reference or the master sheet into `public/`, `app/`, `docs/` or git;
   - upload them anywhere except fal storage with the 1-day lifecycle;
   - upload them to Convex (D2, D7);
   - put a reference URL in a prompt, a log line, `approved.json` or a PR.

> Note: bible §9 puts the master sheet in `.cache/refs/`. It lives in `.cache/refs/anchor/` instead, so step 1 can never pick it up as an identity reference.

### 13.5 Shared prompt blocks (`scripts/brand/prompts.mts`)

The prompts follow the GPT Image structure (Scene / Subject / Important details / Use case / Constraints), label every input image by its role, and say "Do not redesign the character". They are sent verbatim. They never go through GMI prompt expansion (`convex/promptExpansion.ts`), which rewrites prompts differently on every run. Any edit to a string below changes `promptSha256`, which forces a new draft (§13.3.3).

```ts
// dashboard/scripts/brand/prompts.mts
// Verbatim, versioned prompt text for the brand pipeline (docs/redesign/spec/13-brand-assets-fal.md §13.5).
// Never route through GMI prompt expansion. Never use gendered pronouns for Coast.

export const PROMPT_VERSION = 1

export const PALETTE = {
  void: '#05080F', ink: '#0B1120', ramp1: '#1D3160', ramp2: '#3357A8', ramp3: '#7AA5E0',
  glint: '#E8EEF9', chrome: '#4F83CC', tally: '#FF3B30', key: '#FF00FF',
} as const

/** PX tier: the pixel instrument. Embedded in "Important details". */
export const STYLE_PX = [
  'Game Boy Camera-style 4-level ordered-dither pixel illustration, 4x4 Bayer pattern.',
  'Strict palette: #05080F, #1D3160, #3357A8 and #7AA5E0, darkest to lightest; glints #E8EEF9 only, as single pixels.',
  'Tones are mapped by luminance: skin, hair, clothing and props all become these four blues, with no selective recolouring and no other hues.',
  '1px #05080F outline around every silhouette.',
  'Hard pixel edges; no anti-aliasing, gradients, grain, blur, glow or bokeh.',
  '#FF3B30 only on tally-lamp props.',
  'No text, no logos.',
].join(' ')

/** CHROME tier: flagship key art (portrait, standby, OG). Always sent with Image 2. */
export const STYLE_CHROME = [
  'Cinematic key art for a late-night broadcast station.',
  'Deep navy ink shadows #05080F and #0B1120; one cool ice-blue rim light #7AA5E0; a dim neutral-white key light on the face.',
  'Gunmetal chrome props with a polished electric-blue #4F83CC edge, matching the material of Image 2.',
  'Skin tones natural and true to Image 1, never tinted blue.',
  'Backgrounds and shadow falloff resolve into coarse 4-level ordered Bayer dither in navy and chrome blue; Coast stays cleanly rendered.',
  'Low-key light. No text, logos, lens flares, bokeh or watermarks.',
].join(' ')

/** Image 1 role for every Coast call after the sheet. */
export const IDENTITY = [
  'Image 1: the approved Coast brand sheet (coast-brand-sheet-v1).',
  "It is the only source of truth for Coast's face shape, eyes, nose, mouth, hairline and hairstyle, skin tone, body proportions and signature outfit.",
  'Keep Coast recognisably identical to Image 1. Do not redesign the character:',
  'no change of age, face, body, skin tone or hairstyle, and no accessories, tattoos, makeup or clothing that Image 1 does not show.',
].join(' ')

/** Image 2 role for CHROME calls. */
export const IMAGE2_WORDMARK = [
  'Image 2: the WZRD.tech chrome wordmark.',
  'Use it only as a material and colour reference for gunmetal chrome with an electric-blue edge.',
  'Draw no letters, words or shapes from it; the wordmark itself must not appear anywhere in the image.',
].join(' ')

export const CAST_ONE = 'exactly one Coast and no other people, faces or characters'

export function CONSTRAINTS(bg: string, cast: string = CAST_ONE): string {
  return `Constraints: ${cast}; no text, letters, numbers, captions, labels, signatures or watermarks; no logos; ` +
    `no border or frame around the whole image; no UI or grid lines; no extra or missing limbs; no faces other than Coast's; background: ${bg}.`
}

export const BG = {
  transparent: 'fully transparent (alpha 0) everywhere outside Coast, the props and any floor shadow named in Scene',
  magenta: 'flat pure magenta #FF00FF everywhere outside Coast, the props and any floor shadow named in Scene; perfectly uniform, with no gradient, texture or vignette',
  void: 'flat #05080F',
} as const

export type PromptParts = {
  images: readonly string[]   // role lines, in image_urls order
  scene: string
  subject: string
  details: string
  useCase: string
  bg: string
  cast?: string
}

export function compose(p: PromptParts): string {
  return [
    ...p.images,
    `Scene: ${p.scene}`,
    `Subject: ${p.subject}`,
    `Important details: ${p.details}`,
    `Use case: ${p.useCase}`,
    CONSTRAINTS(p.bg, p.cast),
  ].join('\n')
}

/** Transparent assets switch to the magenta key after a 422 on `background` or on openai/gpt-image-2/edit. */
export const withMagenta = (p: PromptParts): PromptParts => ({ ...p, bg: BG.magenta })

/** The anchor sheet (§13.6.1). n = number of identity references (1–4). */
export function SHEET(n: number): string {
  const refs = n === 1
    ? 'Image 1: an approved reference photo of Coast. It is the only source of truth for Coast\'s identity.'
    : `Images 1–${n}: approved reference photos of Coast. Together they are the only source of truth for Coast's identity.`
  return [
    refs,
    'Change: redraw Coast as the WZRD.tech brand character on one horizontal character reference sheet.',
    'Preserve: face shape, eyes, nose, mouth, hairline and hairstyle, skin tone, body proportions, and every accessory or tattoo visible in the references. Do not redesign the character.',
    'Scene: a flat #05080F backdrop with one thin #3357A8 floor line under the full-body row; even, soft, neutral-white studio light from the front; no dither on Coast.',
    'Subject: Coast nine times on one sheet. Top row, five full-body views from left to right: front, three-quarter left, profile left, back, three-quarter right. Bottom row, four head-and-shoulders close-ups from left to right: neutral, slight smile, focused, surprised.',
    'Important details: clean cinematic illustration with natural skin tones true to the references and crisp, readable facial features; the same signature outfit (the one worn in Image 1) in every view; feet on one shared baseline; equal spacing; an identical head-to-body ratio in all five full-body views; all four close-ups at the same scale.',
    'Use case: master identity reference for every later brand illustration and video. It is never published.',
    CONSTRAINTS(BG.void, 'only Coast, shown in the nine views described and nowhere else, and no other people'),
  ].join('\n')
}

/** H3 motion prompts: motion only, short (§13.6.6, §13.6.7). */
export const MOTION_NOD =
  'Locked-off camera, no cuts, no zoom, no camera movement. Coast holds the pose of the first frame, blinks once, ' +
  'gives one small friendly nod toward the camera and returns to the exact starting pose within the first two seconds, ' +
  'then stays still and breathes gently. The background and lighting never change. The last frame matches the first frame exactly.'

export const MOTION_STANDBY =
  'Locked-off camera, no cuts, no zoom, no camera movement. Coast breathes slowly, blinks once, nudges one fader up and ' +
  'returns it to its starting position. The CRT monitors behind flicker gently with drifting blue dithered static. ' +
  'Nothing else moves and no new objects or people appear. The last frame matches the first frame exactly, for a seamless loop.'

/** Prefix for minimax/h3/reference-to-video (identity-drift fallback). */
export const R2V_PREFIX =
  "Image 1 is the approved Coast brand sheet and defines Coast's identity; keep Coast identical to Image 1. " +
  "Image 2 is the exact first frame: keep its scene, framing, lighting and Coast's pose. "
```

> Note: the bible puts "exactly one Coast" inside both STYLE blocks. Here it lives in the `cast` parameter of `CONSTRAINTS` instead, because the sheet (nine views) and the loader (eight cells) need different wording. Every single-figure asset still sends "exactly one Coast". The fixed constraints never forbid what a subject asks for: they ban a frame around the whole image (not the storyboard or film frames that the `shotboard` and `clips` slates draw) and faces other than Coast's (not Coast's repeated views on the sheet and the loader).

> Note: bible §9's CHROME block says "like a chrome blackletter logo". Naming a blackletter logo invites the model to draw blackletter glyphs on props, against principle 2, so `STYLE_CHROME` names only the material of Image 2 (whose role `IMAGE2_WORDMARK` defines).

**Fully expanded example.** This is the `avatar/coast-px` draft prompt exactly as sent, produced by running `compose()` on §13.6.3's parts:

```text
Image 1: the approved Coast brand sheet (coast-brand-sheet-v1). It is the only source of truth for Coast's face shape, eyes, nose, mouth, hairline and hairstyle, skin tone, body proportions and signature outfit. Keep Coast recognisably identical to Image 1. Do not redesign the character: no change of age, face, body, skin tone or hairstyle, and no accessories, tattoos, makeup or clothing that Image 1 does not show.
Scene: no environment.
Subject: Coast's head and shoulders, facing the viewer with a slight three-quarter turn, calm and confident.
Important details: Game Boy Camera-style 4-level ordered-dither pixel illustration, 4x4 Bayer pattern. Strict palette: #05080F, #1D3160, #3357A8 and #7AA5E0, darkest to lightest; glints #E8EEF9 only, as single pixels. Tones are mapped by luminance: skin, hair, clothing and props all become these four blues, with no selective recolouring and no other hues. 1px #05080F outline around every silhouette. Hard pixel edges; no anti-aliasing, gradients, grain, blur, glow or bokeh. #FF3B30 only on tally-lamp props. No text, no logos. Designed on a 32×32 art-pixel grid, one art pixel per 32×32 block of the image: the head fills the upper 70% of the square, the shoulders touch the bottom edge, and the hairstyle silhouette is the most recognisable shape. The face stays readable at 16×16.
Use case: roster avatar in a broadcast-console web app and the master for the browser favicon and app icons; it must stay recognisable at 16×16.
Constraints: exactly one Coast and no other people, faces or characters; no text, letters, numbers, captions, labels, signatures or watermarks; no logos; no border or frame around the whole image; no UI or grid lines; no extra or missing limbs; no faces other than Coast's; background: fully transparent (alpha 0) everywhere outside Coast, the props and any floor shadow named in Scene.
```

### 13.6 The canonical asset list

**Conventions for this section:**
- All public outputs live under `dashboard/public/brand/**`, unless the path starts with `app/` or is `public/favicon.ico`.
- Byte budgets use KB = 1,024 B.
- **Draft input** is the final input with `quality: 'low'` and `num_images: 1`.
- Every still input also carries `output_format: 'png'`.
- The symbolic tokens `coast-ref-n`, `coast-brand-sheet`, `wzrdtech-wordmark` and `<assetId>@raw` are replaced by upload URLs at run time, and restored in `approved.json`.

`assets.mts` holds the table below as data:

```ts
// dashboard/scripts/brand/assets.mts — the canonical asset list (docs/redesign/spec/13-brand-assets-fal.md §13.6). Every § below is in that file.
export type AssetSpec = {
  id: string
  tier: 'anchor' | 'PX' | 'CHROME' | 'MOTION' | 'DERIVED'
  endpoints: readonly string[]                       // primary first, then fallbacks (§13.2)
  size?: { width: number; height: number }           // stills only; passed through assertImageSize at load
  images: readonly ('coast-ref' | 'coast-brand-sheet' | 'wzrdtech-wordmark')[]
  transparent: boolean
  needs: readonly string[]
  maxRerolls: number                                 // sheet 2, every other asset 1
  prompt: (refCount: number) => string               // SHEET(n) or compose(parts); motion returns MOTION_*
  input: (tier: 'draft' | 'final') => Record<string, unknown> // tokenised input, exactly as in §13.6.1–§13.6.9
  outputs: readonly { path: string; width: number; height: number; maxBytes: number; alpha: 'required' | 'forbidden' | 'any' }[]
}
export const ASSETS: readonly AssetSpec[] = [ /* §13.6.1–§13.6.11, in this order */ ]
export function assertImageSize(s: { width: number; height: number }): void { /* §13.2 */ }
```

| # | id | Tier | Endpoint → fallback | Generate at | Art master / cell grid | Ships (§13.9 has every budget) | Used in |
|---|---|---|---|---|---|---|---|
| 1 | `coast-brand-sheet-v1` | anchor | sunburst/edit → gpt-image-2/edit | 2048×1152 | — | **Nothing** (hash only) | Image 1 of every Coast call |
| 2 | `loader/coast-boot` | PX, transparent | sunburst/edit → gpt-image-2/edit | 2048×1024 | 8 frames × 32×32 | strip @1x/@2x, still, json | CoastLoader (§7.5), every `loading.tsx` (§6.3), boot POST sprite (§6.2) |
| 3 | `avatar/coast-px` | PX, transparent | sunburst/edit → gpt-image-2/edit | 1024×1024 | 32×32 and 16×16 | 16/32 PNG masters, 48/96 WebP | Characters roster fallback (§10), Shotboard CastStrip (§9), icon source (#10) |
| 4 | `standby/coast-16x9`, `-9x16`, `-1x1` | CHROME | sunburst/edit (+ wordmark) → gpt-image-2/edit | 1920×1088, 1088×1920, 1088×1088 | 640×360, 360×640, 640×640 at 2 px | `-1280`/`-640` AVIF+WebP, `-lum.png` | SymbolRaster source and idle-slot fallback (§8.4.4, §8.5.11), loop start frame (#7), loop poster |
| 5 | `talent/coast-portrait` | CHROME | sunburst/edit (+ wordmark) → gpt-image-2/edit | 1536×2048 | 384×512 at 2 px | `-768`/`-384` AVIF+WebP | HoloCard (§10, §12), nod poster (`-768`), OG fallback crop |
| 6 | `motion/coast-talent-nod` | MOTION | h3-max/image-to-video → h3/image-to-video → h3/reference-to-video | 5 s, trimmed to 2.0 s | 384×512 cells at 2 px (768×1024 frames) | WebM + MP4 | HoverClipButton "Play ident" (§10, §12); first in the cut order |
| 7 | `motion/coast-standby-loop` | MOTION | same chain | 5 s | 640×360 cells at 2 px (1280×720 frames) | `-1280` WebM + MP4 | Analytics StreamRail offline (§11) |
| 8 | `slate/<11 ids>` | PX, transparent | sunburst/edit → gpt-image-2/edit | 1536×1024 | 192×128 | `<id>.png` master + `<id>.webp` 384×256 | Slate family (§6.13), §8–§11, `app/not-found.tsx`, `app/admin/error.tsx` |
| 9 | `share/og` | CHROME, text-free | sunburst/edit (+ wordmark) → gpt-image-2/edit | 2400×1264 | 600×316 at 2 px | `app/opengraph-image.png`, `app/twitter-image.png`, alt texts | Metadata (§7.7) |
| 10 | `icons/app` | **derived** from #3 | — | — | 16/32 masters | `public/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `icons/icon-{192,512}.png`, `icons/icon-maskable-512.png`, `icons/favicon-onair.svg`, `app/manifest.ts` | Tab icon, PWA, ON AIR favicon swap (§6.7, §8) |
| 11 | `wordmark/wzrdtech` | **derived** from `public/wzrdtechlogo.png` | — | — | — | `wordmark/wzrdtech-{160,320,640}.{avif,webp}`, `components/boot/masks.ts` | CommandBar bug (§7.8), boot (§6.2), OG composite (#9), `app/not-found.tsx` (§7.5) |

**Needs** (enforced by `run`): #2–#5, #8 and #9 need #1 approved. #6 needs #5 approved. #7 needs `standby/coast-16x9` approved. #10 and #11 need nothing.

#### 13.6.0 Post-processing library (`quantize.mts`, `encode.mts`)

**Common constants.** `B4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]`, the same matrix and order as `--bayer-4-*` (§5). Dark ramp: `#05080F #1D3160 #3357A8 #7AA5E0`. Glint: `#E8EEF9`. Tally: `#FF3B30`.

**Downscale.** Every raw is reduced to its art master or cell grid with sharp `resize(w, h, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })`. Nearest-neighbour is used **only** for integer upscales (`kernel: 'nearest'`; ×2, ×3, ×4, ×6, ×12, ×16).

> Note: the bible's PX post-process says "nearest-neighbour downscale to the art master". Nearest sampling from a source 8×–32× larger aliases 1-pixel outlines and skips detail. So the reduction uses lanczos3 (area-correct), and nearest is kept for the upscales.

**Alpha** (transparent assets):
- **Alpha path:** a pixel is opaque if α ≥ 128; otherwise α = 0 (1-bit alpha).
- **Magenta key** (`keyMagenta(img, tol = 8)`):
  - A pixel with |R−255| ≤ 8, G ≤ 8 and |B−255| ≤ 8 gets α = 0.
  - Then one spill pass: an opaque pixel that touches a keyed pixel (8-neighbour) and has R ≥ 200, B ≥ 200 and G ≤ 96 also gets α = 0.
  - The key runs on the full-resolution raw, before the downscale.
- `fal-ai/bria/background/remove` is never used, because it softens pixel edges.

**PX quantiser** (`quantizePx(master, { transparent, outline, outlineColor = '#05080F' })`). It runs per pixel of the art master:
1. Opaque assets are flattened onto `#05080F` first.
2. **Tally rule:** if R ≥ 170, G ≤ 90, B ≤ 90 and R − max(G, B) ≥ 100, the pixel becomes `#FF3B30`.
3. **Luminance:** `L = (0.2126 R + 0.7152 G + 0.0722 B) / 255`. Auto-levels over the opaque pixels: `L' = clamp((L − p2) / (p98 − p2) × 0.92 + 0.04, 0, 1)`, where p2 and p98 are the 2nd and 98th percentiles of L.
4. **Glint rule:** the pixel becomes `#E8EEF9` when all three hold:
   - `L' ≥ 0.92`;
   - it is a strict local maximum of L' among its 8 neighbours (ties go to the first pixel in raster order);
   - max(R,G,B) − min(R,G,B) ≤ 24.
5. **Ordered dither:** `level = clamp(floor(3·L' + (B4[y & 3][x & 3] + 0.5) / 16), 0, 3)`, then use ramp colour `level`. At L' = 0.5, exactly half the cells land on level 1 and half on level 2.
6. **Outline** (transparent assets): every opaque pixel that touches a transparent pixel or the image edge (4-neighbour) becomes `outlineColor`:
   - `#1D3160` (ramp-1) for `slate/*` and `loader/coast-boot`. Slates sit in the black `bg-screen` art window (§6.13) and the loader on dark panels, where `#05080F` has a contrast of about 1.05:1 against `#000` and the outline would vanish.
   - `#05080F` (the default) for `avatar/coast-px`, whose WebPs are flattened onto `#1D3160` (§13.6.3).
   - Both colours are in the BC-06 palette.
7. The output has at most 6 colours plus transparency.

**CHROME quantiser** (`quantizeChrome(grid, { colors, palette? })`). It runs on an opaque RGB cell grid:
1. **Palette.** A deterministic median cut over the grid's pixels to `colors` boxes:
   - Repeatedly split the box with the largest single-channel range, on that channel, at the median of its pixels sorted by (value, index).
   - Stop early when no box has a range above 0.
   - Each palette colour is the rounded mean of its box.
   - Sort the palette by luminance, then by R, G, B.
   - When a frozen `palette` is given (for video), skip this step.
2. **Dither.** Add `t = ((B4[y & 3][x & 3] + 0.5) / 16 − 0.5) × 40` to each of R, G and B. Pick the nearest palette colour by `2ΔR² + 4ΔG² + 3ΔB²`.
3. **Upscale.** Upscale ×2 (nearest) for the variants with 2 px cells (`-1280`, `-768`, OG). The `-640` and `-384` variants ship the grid at ×1. The 2 px grid starts at (0,0) and every dimension is even, so 4:2:0 video chroma blocks line up with cells. That holds only for 2 px cells, so every video ships 2 px cells (§13.6.6, §13.6.7).
4. Skin is preserved because the palette adapts to the image and there is no hue remapping.

> Note: sharp 0.34.5 cannot make this palette. Measured in the authoring sandbox: `png({ palette: true, colors: 32 })` returns only 16 colours (bit depth 4) for any `colors` from 17 to 255, and `colors: 8` returns 4 colours and **changes** the brand ramp colours. Hence the median cut written in the file. PX PNGs are written with `colors: 16`, which measured exact for the 6 brand colours plus transparency.

**Encode ladders.** Each output tries its rungs in order and keeps the first that fits the file's budget. The chosen rung is recorded in the manifest as `enc` (for example `webp:lossless:c24` or `avif:q58`). If the last rung is still over budget, `build` exits 1.

| Output kind | Rungs | Why |
|---|---|---|
| PX PNG (masters, strips, icons) | `png({ palette: true, colors: 16, dither: 0, compressionLevel: 9, effort: 10 })` only | Exact colours |
| PX WebP (slates 384×256, avatar 48/96) | `webp({ lossless: true, effort: 6, exact: true })` only | Exact colours |
| CHROME WebP | Lossless (`{ lossless: true, effort: 6 }`) on the variant's pixels quantised to **32**, then **24**, then **16** colours. Never lossy | Measured in the authoring sandbox (sharp 0.34.5) on a synthetic scene and on `docs/redesign/baseline/admin_characters-dark.jpg`, each quantised to a 640×360 grid: lossless 1280×720 = 44–85 KB; lossy q90 = 270–288 KB (lossy WebP inflates dithered art). The 1× 640×360 file at 32/24/16 colours = 65.8/59.3/40.8 KB |
| CHROME AVIF | `avif({ quality: q, effort: 6, chromaSubsampling: '4:4:4' })` with q = 70, 64, 58, 52, 46, 40. It encodes the **same pixels** as that variant's WebP | Same measurement: 1280×720 at q70 = 100–122 KB, at q52 = 55–82 KB |
| Wordmark WebP | `webp({ quality: q, alphaQuality: aq, effort: 6, smartSubsample: true })` with (q, aq) = (90, 100), (85, 100), (80, 100), (75, 100), (75, 90), (75, 80), (70, 80) | The wordmark is a smooth chrome raster, not pixel art. Measured from `public/wzrdtechlogo.png`: 160 fits at (90, 100) = 7.4 KB; 320 needs (75, 80) = 14.8 KB, because the alpha plane dominates; 640 fits at (75, 100) = 37.2 KB |
| Wordmark AVIF | `avif({ quality: q, effort: 6, chromaSubsampling: '4:4:4' })` with q = 64, 58, 52, 46 | Measured: 160 at q64 = 6.7 KB, 320 at q58 = 14.9 KB, 640 at q64 = 31.1 KB |
| Luminance PNG | `greyscale().normalise({ lower: 1, upper: 99 }).toColourspace('b-w').png({ compressionLevel: 9 })`: 8-bit, 1 channel, IHDR colour type 0 | Input for SymbolRaster. Never pass `effort`, `quality`, `colours` or `dither` to a PNG that must stay greyscale or truecolour: in sharp 0.34.5 any of them switches the encoder to palette mode (verified) |
| OG PNG | `png({ palette: true, colors: 256, dither: 0, compressionLevel: 9, effort: 10 })`, with the art quantised to 32, then 24, then 16 colours | Measured on a synthetic 2400×1264 scene composited with the real wordmark: 256-colour PNG 72 KB, truecolour PNG 192 KB, JPEG q82 182 KB |

Each variant's colour count is the largest of 32, 24 and 16 whose lossless WebP fits. Video frames use the palette of the still that serves as their poster (§13.6.6, §13.6.7).

#### 13.6.1 `coast-brand-sheet-v1` (anchor)

- **Input:** `{ "prompt": SHEET(n), "image_urls": ["coast-ref-1", "…", "coast-ref-n"], "image_size": { "width": 2048, "height": 1152 }, "quality": "high", "num_images": 2, "output_format": "png" }`, with n ≤ 4. `maxRerolls: 2`.
- **Prompt:** `SHEET(n)` (§13.5), complete.
- **Post:** none.
  - `approve` copies the chosen raw to `.cache/refs/anchor/coast-brand-sheet-v1.png` and records `sheet` in `approved.json`.
  - For the identity comparison, this asset's draft contact sheet also shows the references side by side (in `.cache` only).
- **Ships:** nothing. Approving a different sheet later invalidates every asset whose `sheetSha256` no longer matches (BC-09).

#### 13.6.2 `loader/coast-boot` (PX)

- **Input:** `{ prompt, "image_urls": ["coast-brand-sheet"], "image_size": { "width": 2048, "height": 1024 }, "quality": "high", "num_images": 2, "output_format": "png", "background": "transparent" }`.
- **Prompt parts:**
  - images: `[IDENTITY]`
  - scene: `an empty sprite sheet with no environment.`
  - subject: `Coast as a compact full-body pixel-art sprite, repeated in a 4-column by 2-row grid of eight equal square cells, one pose per cell. The animation reads left to right, top row then bottom row: in frames 1–4 Coast raises a small chrome broadcast remote and taps its button while a blue pixel spark grows at the remote's antenna tip; in frames 5–7 the spark becomes a tiny chrome diamond spinning above the remote; frame 8 is exactly the pose of frame 1.`
  - details: `${STYLE_PX} Each of the eight cells is drawn on a 32×32 art-pixel grid, one art pixel per 16×16 block of the image. The head is about 40% of the body height. Coast is centred in every cell at identical scale, stands on one shared baseline 2 art pixels above the bottom of the cell, and is turned three-quarters toward the viewer in all eight frames; only the arm, the remote, the spark and the diamond move. Bold readable silhouette at 32×32; no motion blur.`
  - useCase: `a looping 8-frame loading animation in a dark broadcast-console web app, shown at 64 and 128 px.`
  - bg: `BG.transparent`
  - cast: `exactly one Coast in each of the eight cells and nothing else in any cell except the remote, the spark and the diamond`
- **Post:**
  1. Alpha threshold or magenta key on the raw.
  2. Slice into 8 cells of 512×512. Frame i is at column `i % 4`, row `floor(i / 4)`.
  3. Take the union of the 8 alpha bounding boxes (in cell coordinates). Expand it to a square, centred horizontally and bottom-aligned, so all frames share one baseline.
  4. Crop every cell to that square, resize with lanczos3 to **32×32**, then run `quantizePx({ transparent: true, outline: true, outlineColor: '#1D3160' })`.
  5. Overwrite frame 8 with frame 1, pixel for pixel.
  6. Pack the frames horizontally.
- **Ships:**

  | File | Size | Budget |
  |---|---|---|
  | `loader/coast-boot-strip@1x.png` | 512×64 (frames ×2) | 25 KB |
  | `loader/coast-boot-strip@2x.png` | 1024×128 (frames ×4) | 60 KB |
  | `loader/coast-boot-still@2x.png` | 128×128 (frame 1 ×4) | 8 KB |
  | `loader/coast-boot.json` | `{"frames":8,"fps":10,"frameW":128,"frameH":128,"master":32}` | 1 KB |

  The `.coast-sprite` utility that animates the strip is defined in §5.14 (it uses the `@2x` strip at both CoastLoader sizes).

#### 13.6.3 `avatar/coast-px` (PX)

- **Input:** `{ prompt, "image_urls": ["coast-brand-sheet"], "image_size": { "width": 1024, "height": 1024 }, "quality": "high", "num_images": 2, "output_format": "png", "background": "transparent" }`.
- **Prompt parts:**
  - images: `[IDENTITY]`
  - scene: `no environment.`
  - subject: `Coast's head and shoulders, facing the viewer with a slight three-quarter turn, calm and confident.`
  - details: `${STYLE_PX} Designed on a 32×32 art-pixel grid, one art pixel per 32×32 block of the image: the head fills the upper 70% of the square, the shoulders touch the bottom edge, and the hairstyle silhouette is the most recognisable shape. The face stays readable at 16×16.`
  - useCase: `roster avatar in a broadcast-console web app and the master for the browser favicon and app icons; it must stay recognisable at 16×16.`
  - bg: `BG.transparent`
  - The expanded text is in §13.5.
- **Post:** alpha threshold, then two independent masters: lanczos3 to 32×32 and to 16×16, each through `quantizePx({ transparent: true, outline: true })`.
- **Ships:**
  - `avatar/coast-px-16.png` 16×16 (2 KB) and `avatar/coast-px-32.png` 32×32 (2 KB), both transparent;
  - `avatar/coast-px-48.webp` 48×48 (16 master ×3) and `avatar/coast-px-96.webp` 96×96 (32 master ×3), both flattened onto `#1D3160` and opaque (8 KB each).

#### 13.6.4 `standby/coast-16x9`, `standby/coast-9x16`, `standby/coast-1x1` (CHROME)

- **Input** (three jobs):

  ```json
  { "prompt": "<compose(STANDBY[aspect])>", "image_urls": ["coast-brand-sheet", "wzrdtech-wordmark"],
    "image_size": { "width": 1920, "height": 1088 }, "quality": "high", "num_images": 2, "output_format": "png" }
  ```

  `image_size` is `{1920,1088}` for 16x9, `{1088,1920}` for 9x16 and `{1088,1088}` for 1x1. There is no `background` key (the art is opaque).
- **Prompt parts:**
  - images: `[IDENTITY, IMAGE2_WORDMARK]`
  - scene: `a dark late-night broadcast control booth: a long gunmetal chrome mixing desk with rows of faders and, behind it, a wall of small dark CRT monitors showing only faint blue dithered static.`
  - subject: `Coast seated at the chrome desk, hands resting on the faders, calm and focused, waiting for the show to start.`, followed by:
    - 16x9: `Coast is in the left third of the frame, turned three-quarters toward screen-right, with the head between 25% and 50% of the frame height.`
    - 9x16: `Coast is centred horizontally in the upper half of the frame, turned three-quarters toward the viewer, with the head between 15% and 35% of the frame height.`
    - 1x1: `Coast is centred horizontally, turned three-quarters toward the viewer, with the head between 18% and 38% of the frame height.`
  - details: `${STYLE_CHROME}`, followed by:
    - 16x9: `The right two-thirds of the frame stay dark, empty and low-contrast, with only faint dithered monitor glow, reserved for an overlaid status plate.`
    - 9x16 and 1x1: `The bottom 45% of the frame is the dark front of the desk, empty and low-contrast, reserved for an overlaid status plate.`
    - then, for all three: `Locked-off eye-level camera. The pose is neutral and relaxed because this image is also the first and last frame of a seamless 5-second loop.`
  - useCase: `standby key art behind the program monitor of a live-broadcast console; it is also sampled into a coarse symbol raster and used as the start and end frame of an ambient video loop.`
  - bg: `the booth described in Scene; every monitor shows only dithered static, never readable text`

  The compositions match §8's StandbySlate plate: the right two-thirds at 16:9, the bottom 45% at 9:16 and 1:1. At 16:9, Coast's head sits below the top-left `STAND BY` plate of §11's StreamRail.
- **Post:**
  - Cover-resize the raw to the cell grid (640×360, 360×640 or 640×640), then run `quantizeChrome` (32, 24 or 16 colours, per the ladder).
  - Upscale ×2 (nearest) for `-1280`; keep ×1 for `-640`.
  - The luminance file comes from the **raw**, not the quantised art: lanczos3 to 160×90, 90×160 or 90×90, then the luminance-PNG rung.
- **Ships** (the number in the file name is the long edge):

  | File | 16x9 | 9x16 | 1x1 | Budget each |
  |---|---|---|---|---|
  | `standby/coast-<a>-1280.avif`, `.webp` | 1280×720 | 720×1280 | 1280×1280 | 120 KB |
  | `standby/coast-<a>-640.avif`, `.webp` | 640×360 | 360×640 | 640×640 | 45 KB |
  | `standby/coast-<a>-lum.png` | 160×90 | 90×160 | 90×90 | 8 KB |

#### 13.6.5 `talent/coast-portrait` (CHROME)

- **Input:** `{ prompt, "image_urls": ["coast-brand-sheet", "wzrdtech-wordmark"], "image_size": { "width": 1536, "height": 2048 }, "quality": "high", "num_images": 2, "output_format": "png" }`.
- **Prompt parts:**
  - images: `[IDENTITY, IMAGE2_WORDMARK]`
  - scene: `a dark studio void in deep navy; the background resolves into coarse ordered dither.`
  - subject: `Coast waist-up, turned three-quarters toward camera-left, eyes to camera, relaxed and confident, hands out of frame, wearing the signature outfit from Image 1.`
  - details: `${STYLE_CHROME} Vertical 3:4 composition: the eyes sit on the upper-third line, the top of the head is 8–12% below the top edge, and both shoulders are fully in frame. A strong ice-blue rim light traces the hair and the camera-right shoulder against the dark background; the dim neutral key keeps the face readable. The pose is neutral because this image is also the first and last frame of a 5-second video.`
  - useCase: `talent-card portrait for a character bible, shown 144–400 px wide under a holographic foil overlay.`
  - bg: `the navy studio void described in Scene`
- **Post:** lanczos3 to 384×512, then `quantizeChrome`. Upscale ×2 to 768×1024; keep ×1 at 384×512.
- **Ships:** `talent/coast-portrait-768.{avif,webp}` at 768×1024 (90 KB each) and `talent/coast-portrait-384.{avif,webp}` at 384×512 (35 KB each). The `-768` variant is the poster and the frozen palette of `motion/coast-talent-nod` (§13.6.6).
- If `share/og` fails review, its fallback art is this portrait: the raw, cover-cropped into the right third of the OG canvas. No extra call is made.

> Note: the bible sends Image 2 (the wordmark) only for standby and OG, yet its CHROME style block refers to "Image 2". Every CHROME call here sends Image 2, the portrait included, so the style block never refers to a missing image.

#### 13.6.6 `motion/coast-talent-nod` (MOTION)

- **Input**, tried in endpoint order until one succeeds:
  1. `minimax/h3-max/image-to-video`: `{ "prompt": MOTION_NOD, "image_url": "talent/coast-portrait@raw", "end_image_url": "talent/coast-portrait@raw", "duration": 5, "resolution": "2K" }`
  2. `minimax/h3/image-to-video`: the same input.
  3. `minimax/h3/reference-to-video`: only after review rejects the output of 1–2 for identity drift. Select it with `run --only motion/coast-talent-nod --tier final --reroll 1`. Input: `{ "prompt": R2V_PREFIX + MOTION_NOD, "reference_image_urls": ["coast-brand-sheet", "talent/coast-portrait@raw"], "aspect_ratio": "3:4", "duration": 5, "resolution": "2K" }`
- **Post** (`video.mts`):
  1. Extract 48 frames. `trimStartS` comes from `approve --trim-start` (default 0):

     ```bash
     ffmpeg -v error -y -ss <trimStartS> -i <raw.mp4> -t 2.0 \
       -vf "fps=24,scale=384:512:flags=lanczos:force_original_aspect_ratio=increase,crop=384:512" \
       -pix_fmt rgb24 .cache/frames/motion/coast-talent-nod/f%04d.png
     ```

  2. Run each 384×512 frame through `quantizeChrome` with the **frozen palette of `talent/coast-portrait-768`**, then upscale it ×2 (nearest) to 768×1024 (2 px cells, the same pitch as the poster). Write the frames contiguously as `.cache/frames/motion/coast-talent-nod/q0001.png` … `q0048.png`. Ordered dither is fixed in space, so static regions stay identical from frame to frame (no shimmer).
  3. Encode with the WebM and MP4 commands below. There is no loop seam: the prompt returns Coast to the start pose within 2 s.
- **Ships:** `motion/coast-talent-nod.webm` and `motion/coast-talent-nod.mp4`, both 768×1024 (700 KB and 1,024 KB). The poster is `talent/coast-portrait-768`; no new file. Manifest: `durationMs: 2000`, `loop: false`.

> Note: the bible specifies 480×640. The clip is 768×1024, the 384×512 cell grid at 2 px, so its cell pitch equals the `talent/coast-portrait-768` poster exactly. At 480 px, the 384 cells across would each be 1.25 px wide, and the picture would jump visibly when HoverClip starts. It is not encoded at 1 px cells: `yuv420p` halves chroma resolution, so colour bleeds across 1 px cells. Measured with the VP9 command below on a 1 px ramp dither at 384×512: 22.4% of pixels off by more than 24 levels (mean max-channel error 16.0); the same art at 2 px cells (768×1024): 0.0% off (mean error 5.7).

#### 13.6.7 `motion/coast-standby-loop` (MOTION)

- **Input:** the same endpoint chain as §13.6.6, with `"prompt": MOTION_STANDBY` and with `"image_url"` and `"end_image_url"` both `"standby/coast-16x9@raw"`. The reference-to-video variant uses `"aspect_ratio": "16:9"`.
- **Post:**
  1. Extract the frames (N ≈ 120):

     ```bash
     ffmpeg -v error -y -i <raw.mp4> \
       -vf "fps=24,scale=640:360:flags=lanczos:force_original_aspect_ratio=increase,crop=640:360" \
       -pix_fmt rgb24 .cache/frames/motion/coast-standby-loop/f%04d.png
     ```

  2. **Loop seam** (`--seam auto`). Compute `seamDelta = mean |F[0] − F[N−1]| / 255` over RGB. If it is above 0.02, crossfade the frames with K = 10 (0.42 s):
     - The output is F[K … N−1].
     - The last K output frames are `F[N−K+j] × (1 − w) + F[j] × w`, with `w = (j + 1) / (K + 1)` for j = 0…K−1.
     - The output ends on a blend that is mostly F[K−1] and restarts at F[K], so the loop point is seamless.
     - `--seam off` skips this step.
  3. Quantise each output frame once, with the frozen palette of `standby/coast-16x9-1280`, and upscale it ×2 (nearest) to 1280×720. Write the frames contiguously from `q1280_0001.png`, after the seam crop (output frame F[K] becomes `q1280_0001.png`).
  4. Encode.
- **Ships:**
  - `motion/coast-standby-loop-1280.webm`, 1280×720, max 1,228,800 B;
  - `motion/coast-standby-loop-1280.mp4`, 1280×720, max 2,097,152 B.
  There is no 640 variant: 1 px cells smear under 4:2:0 chroma (§13.6.6 Note), so `BrandVideo` always uses the 1280 source. The poster is `standby/coast-16x9`. Manifest: `durationMs = round(frames × 1000 / 24)`, `loop: true`.

**Video encode commands** (both motion assets). `<frames>` is `.cache/frames/motion/coast-talent-nod/q%04d.png` for the nod and `.cache/frames/motion/coast-standby-loop/q1280_%04d.png` for the loop. Both sequences start at `0001`, which the image2 demuxer finds by probing (it tries start numbers 0–4). Each ladder tries CRF values in order until the file fits; the chosen CRF is recorded in `enc`:

```bash
# WebM (VP9); crf ladder 34 → 36 → 38 → 40
ffmpeg -v error -y -framerate 24 -i <frames> \
  -c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf <crf> -deadline good -cpu-used 1 -row-mt 1 \
  -g 240 -an -fflags +bitexact -flags:v +bitexact -map_metadata -1 -threads 4 -f webm <out>.webm
# MP4 (H.264, faststart); crf ladder 22 → 24 → 26 → 28
ffmpeg -v error -y -framerate 24 -i <frames> \
  -c:v libx264 -preset slow -tune animation -crf <crf> -pix_fmt yuv420p -profile:v high \
  -movflags +faststart -an -fflags +bitexact -flags:v +bitexact -map_metadata -1 -threads 4 <out>.mp4
```

- **Determinism.** Without bitexact flags the WebM muxer writes random track UIDs: the same 24 frames encoded twice with ffmpeg-static 5.3.0 gave two different sha256, and with `-fflags +bitexact -flags:v +bitexact` both runs matched. x264 output depends on the thread count, so `-threads 4` pins it. A rebuild from the same approved raw therefore produces byte-identical video, which `build`'s no-diff rule, `check --rebuild` and BC-09 require.
- Audio is always stripped (`-an`). `.cache/frames/<assetId>/` is deleted after encoding.

#### 13.6.8 `slate/*` (PX, 11 assets)

- **Input** (per id): `{ prompt, "image_urls": ["coast-brand-sheet"], "image_size": { "width": 1536, "height": 1024 }, "quality": "high", "num_images": 2, "output_format": "png", "background": "transparent" }`.
- **Shared prompt parts:**
  - images: `[IDENTITY]`
  - scene: `an isolated spot illustration with no environment except a small dithered oval floor shadow directly under Coast.`
  - details: `${STYLE_PX} Drawn on a 192×128 art-pixel grid, one art pixel per 8×8 block of the image. Coast and the props stay inside the central 76% of the width and 84% of the height, with empty margins, and the silhouette reads clearly at 192×128 inside a black monitor window.`, plus the slate's extra detail from the table below
  - useCase: `a spot illustration for the ${screen} of a broadcast-console web app, shown at 384×256 inside a black monitor window.`
  - bg: `BG.transparent`
- **Per-slate subject.** The kicker is §6.13's and is never sent to the model.

  | id | Kicker | `${screen}` | Subject | Extra detail |
  |---|---|---|---|---|
  | `live-control` | (none, §8) | Live Control screen before the show starts | `Coast standing beside a vintage shoulder-mounted broadcast camera on a short tripod, one hand on the camera handle, looking at the small tally lamp on top of the camera, which is dark and unlit.` | `The tally lamp is unlit, so no red appears.` |
  | `shotboard` | BLANK BOARD | empty storyboard screen | `Coast pinning small blank storyboard frames onto a floating board, holding one more blank frame; every frame is empty, with no drawing inside.` | — |
  | `characters` | OPEN CASTING | empty character library screen | `Coast standing beside three empty dotted-outline silhouettes of equal height, gesturing toward them like a casting director. The silhouettes are hollow outlines with no faces or features; they are not people.` | — |
  | `locations` | NO SCOUTS | empty location library screen | `Coast holding an unfolded paper map from which a tiny pop-up landscape rises: one suspension-bridge tower and wisps of fog.` | — |
  | `clips` | NO FOOTAGE | empty clips library screen | `Coast holding a blank strip of film up to the light, with two empty frames curling off the end.` | — |
  | `recordings` | NO TAPE | empty recordings library screen | `Coast sitting on a stack of chrome VHS cassettes, holding one up and squinting at its blank label.` | — |
  | `analytics` | NO DATA | analytics screen with no data yet | `Coast peering through a chrome spyglass at three dithered bar-chart columns; the third column is only an empty outline.` | — |
  | `not-found` | CH 404 | page-not-found screen | `Coast tangled in loose coaxial cables on the left, holding one cable end, beside a small CRT television. The CRT is exactly centred in the frame; its screen is completely blank and dark and is about 34% of the frame width and 24% of the frame height.` | `Nothing is drawn on the CRT screen; digits are added later.` |
  | `not-patched` | NOT PATCHED | service-not-configured screen | `Coast holding two unplugged chrome cable ends that almost touch, with a tiny blue pixel spark between them.` | — |
  | `no-access` | NO ACCESS | sign-in-required screen | `Coast holding up a lanyard access pass toward the viewer; the pass is blank except for a small padlock shape.` | — |
  | `signal-lost` | SIGNAL LOST, NO CARRIER | error and connection-lost screen | `Coast sitting calmly beside a small CRT television whose screen is full of noisy dithered static.` | — |

  The `not-found` CRT screen (about 65×31 art pixels) holds §11's centred `<PixelFace text="404" cell={4}>` (68×28 display px, or 34×14 art pixels). The digits are SVG and are never generated.
- **Post:** alpha threshold or magenta key → lanczos3 to 192×128 → `quantizePx({ transparent: true, outline: true, outlineColor: '#1D3160' })` → ×2 nearest.
- **Ships:** `slate/<id>.png`, the 192×128 palette master (12 KB), and `slate/<id>.webp`, 384×256 lossless (40 KB). §6.13 shows the WebP at 384×256 (`route`) and at 192×128 (`panel`), with `image-rendering: pixelated`.

#### 13.6.9 `share/og` (CHROME, text-free)

- **Input:** `{ prompt, "image_urls": ["coast-brand-sheet", "wzrdtech-wordmark"], "image_size": { "width": 2400, "height": 1264 }, "quality": "high", "num_images": 2, "output_format": "png" }`.
- **Prompt parts:**
  - images: `[IDENTITY, IMAGE2_WORDMARK]`
  - scene: `a void-navy field crossed by slow horizontal bands of blue ordered-dither waves, like a broadcast carrier signal, with faint CRT scanlines.`
  - subject: `Coast waist-up, turned three-quarters toward camera-left, looking at the viewer with a slight confident smile, lit by cool blue monitor light from camera-left.`
  - details: `${STYLE_CHROME} Wide 1.9:1 composition. Coast stays between 62% and 92% of the frame width and inside the central 90% of the frame height. The left 55% of the frame is calm, low-contrast dithered navy with no objects, reserved for a logo and one line of text added later.`
  - useCase: `1200×630 social share card for stream.wzrd.tech.`
  - bg: `the dithered navy field described in Scene`
- **Post** (sharp; the same output every run):
  1. Cover-resize the raw to 600×316, run `quantizeChrome`, upscale ×2 to 1200×632, then `extract({ left: 0, top: 1, width: 1200, height: 630 })`.
  2. Composite the **real** wordmark: `public/wzrdtechlogo.png` resized with lanczos3 to width 560 (560×139), at `{ left: 64, top: 216 }`.
  3. Composite the mono line `STREAM.WZRD.TECH` at `{ left: 64, top: 387 }`. It is rendered from `lib/pixelFont.json` as SVG `<rect>` runs: `shape-rendering="crispEdges"`, fill `#7AA5E0`, 4 px cells, a 1-cell gap between letters. That is 95×7 cells, or 380×28 px. The text block (216–415) is vertically centred on the 630 px height.
  4. Encode with the OG PNG rung.
- **Ships:**
  - `app/opengraph-image.png` and `app/twitter-image.png`: byte-identical, 1200×630, ≤180 KB each;
  - `app/opengraph-image.alt.txt` and `app/twitter-image.alt.txt`. The alt text is `Pixel-art key art of Coast beside the chrome WZRD.tech wordmark and the line STREAM.WZRD.TECH.` when the art is generated, and `The chrome WZRD.tech wordmark and the line STREAM.WZRD.TECH over a blue pixel-dither field.` for the placeholder.
  These root metadata routes sit outside the middleware matcher `['/admin/:path*', '/api/:path*']`.

> Note: the bible specifies `.jpg`. A 256-colour PNG keeps the 2 px dither exact and measured 2.5× smaller (72 KB vs 182 KB for JPEG q82 on the same composite), so the metadata files are `.png`. There is no "LIVE" dot on the card: a static image cannot know the broadcast state (principle "Truth over theatre").

#### 13.6.10 `icons/app` (derived from `avatar/coast-px`; never generated)

Built from the 16×16 and 32×32 masters of §13.6.3, or from the placeholder avatar (§13.7) when that is what exists.

| Output | Construction | Budget |
|---|---|---|
| `public/favicon.ico` (**replaced in place**) | Three RGBA PNG entries (`png({ compressionLevel: 9 })`, not palette): 16 (the 16 master), 32 (the 32 master), 48 (the 16 master ×3). Written by `writeIco` below. Never create `app/favicon.ico`: both files would serve `/favicon.ico` | 10 KB |
| `app/icon.svg` | `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">` with one `<path fill="#RRGGBB" d="M x y h w v1 h-w z …"/>` per colour, built from the row runs of the 32 master. Transparent background | 6 KB |
| `app/apple-icon.png` | 180×180, opaque `#05080F`, with the 32 master ×4 (128×128) at (26, 26), which leaves 14% margins | 25 KB |
| `public/brand/icons/icon-192.png` | 32 master ×6, transparent | 25 KB |
| `public/brand/icons/icon-512.png` | 32 master ×16, transparent | 25 KB |
| `public/brand/icons/icon-maskable-512.png` | 512×512, opaque `#05080F`, with the 32 master ×12 (384×384) at (64, 64), inside the 80% safe zone | 25 KB |
| `public/brand/icons/favicon-onair.svg` | The content of `app/icon.svg` plus, last in the document, `<rect x="27" y="0" width="5" height="5" fill="#05080F"/><rect x="28" y="0" width="4" height="4" fill="#FF3B30"/>`: a 4×4 tally LED at top-right with a 1 px dark edge | 6 KB |
| `app/manifest.ts` | Written by hand once (below); served at `/manifest.webmanifest` | — |

```ts
// encode.mts — PNG-in-ICO writer (no dependency)
export function writeIco(entries: { size: 16 | 32 | 48; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + dir.length
  entries.forEach(({ size, png }, i) => {
    const o = i * 16
    dir.writeUInt8(size, o); dir.writeUInt8(size, o + 1)       // width, height
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3)         // palette count, reserved
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6)  // planes, bits per pixel
    dir.writeUInt32LE(png.length, o + 8); dir.writeUInt32LE(offset, o + 12)
    offset += png.length
  })
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)])
}
```

```ts
// dashboard/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'stream.wzrd.tech admin',
    short_name: 'WZRD',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#05080F',
    theme_color: '#05080F',
    icons: [
      { src: '/brand/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

**Pixel font.** The OG line and the contact-sheet labels use the PX5×7 glyphs in `dashboard/lib/pixelFont.json`. It is the single glyph table, and §12's `PixelFace` reads the same file.
- The glyph table, its encoding (`base32-rows-bit16-left`), its charset and its advance (6 cells: 5 + a 1-cell gap): §12.3.4 (owner). The charset has no lowercase.
- Part 3B creates the file with exactly §12.3.4's content, because `build` needs it before PixelFace lands in 4A.
- `encode.mts` reads the file with `fs.readFileSync` + `JSON.parse` and decodes each row with `B32.indexOf(c)` (bit 16 = leftmost column).
- `build` exits 3 if a needed glyph is missing; it never draws the U+FFFD box.

#### 13.6.11 `wordmark/wzrdtech` (derived from `public/wzrdtechlogo.png`; never generated)

- **Source:** `public/wzrdtechlogo.png` (1717×425; `trim()` would give 1712×423, so never trim: the masks, the boot image and the OG composite all use the full 1717×425 box). It stays on disk, and no app file references it once the `Wordmark` (§7.5) replaces it in the CommandBar (§7.8).
- **Raster:** `sharp(src).resize({ width: W, kernel: 'lanczos3' })`, alpha preserved, gives 160×40, 320×79 and 640×158 (heights checked against 425/1717). Each size is written as AVIF and WebP with the wordmark rungs.

  | File | Size | Budget each | Used by |
  |---|---|---|---|
  | `wordmark/wzrdtech-160.{avif,webp}` | 160×40 | 8 KB | `Wordmark` at 20 px (81×20, 2×) |
  | `wordmark/wzrdtech-320.{avif,webp}` | 320×79 | 15 KB | `Wordmark` at 4× |
  | `wordmark/wzrdtech-640.{avif,webp}` | 640×158 | 40 KB | The boot `<img width="480" height="119">` and its glint mask (§6.2) |

- **Boot masks.** `components/boot/masks.ts` uses exactly §6.2's format:
  - `export const MASK_L = { w: 120, h: 30, b64: '…' } as const` and `export const MASK_S = { w: 80, h: 20, b64: '…' } as const`.
  - 1 bit per cell, row-major, most significant bit first.
  - Cell (cx, cy) covers source columns `[floor(cx·1717/w), floor((cx+1)·1717/w))` and rows `[floor(cy·425/h), floor((cy+1)·425/h))`. The cell is 1 when the mean alpha over that box is ≥ 50% (127.5).
  - The file starts with `// Generated by scripts/brand (build). Do not edit.`
  - The base64 strings are 600 and 268 characters long.

### 13.7 Placeholders (`placeholders.mts`)

Placeholders let the whole UI ship complete without a key.
- They are **non-human**, use only the dark ramp, and are drawn in code.
- They go through the **same** quantisers, encoders and file names as the generated assets, so every consumer, dimension and budget stays the same.
- Every entry they produce is `origin: 'placeholder'`, `generated: false`.
- The wordmark and masks are always `origin: 'derived'`, `generated: false`.
- The icons are `origin: 'derived'` and copy the avatar's `generated` value: false from the placeholder avatar, true from an approved one.

**Glyphs.** `.` is transparent, `0`–`3` are ramp levels, `g` is the glint. ANTENNA and CRT are symmetric:

```ts
export const ANTENNA = [ // 15×15 broadcast mast
  '.......g.......', '..3...333...3..', '.3..3..3..3..3.', '.3.3...3...3.3.', '.3.3..222..3.3.',
  '.3..3.2.2.3..3.', '..3...2.2...3..', '......2.2......', '.....2.2.2.....', '.....2...2.....',
  '....2.2.2.2....', '....2.....2....', '...2.2.2.2.2...', '...2.......2...', '..11111111111..',
] as const
export const CAMERA = [ // 15×10 broadcast camera, lens left, unlit tally top-right
  '.....333....22.', '....3333333333.', '....3111111113.', '33333111111113.', '3g223111111113.',
  '32223111111113.', '33333111111113.', '....3111111113.', '....3333333333.', '......33..33...',
] as const
export const CRT = [ // 15×11 television; screen = columns 2–12, rows 4–8
  '...3.......3...', '....3.....3....', '.....3...3.....', '.3333333333333.', '.3000000000003.',
  '.3000000000003.', '.3000000000003.', '.3000000000003.', '.3000000000003.', '.3333333333333.', '....33...33....',
] as const
```

**Field.** `field(W, H, L(x, y))` evaluates a luminance function for each cell and runs it through the PX quantiser's dither step (without auto-levels). The result is a Bayer field in the ramp colours.

Each placeholder starts from its art master or cell grid, then goes through the asset's normal upscale and encode steps. Placeholders skip `quantizeChrome`, because they are already quantised.

| Asset | Placeholder composition |
|---|---|
| `loader/coast-boot` | 8 frames of 32×32, transparent, each with ANTENNA ×2 at (1, 1). A spark is centred on the tip cell (15, 1) and clipped to the frame. Frame 1: no spark (only the glyph's glint). Frames 2–4: a ramp-3 plus sign with arms of length 1, 2 and 3, and a glint at the centre. Frames 5–7: a ramp-3 diamond outline of 5×5, 3×5 and 1×5 (the spin). Frame 8 = frame 1. The outline rule is applied with `outlineColor: '#1D3160'`, as in §13.6.2 |
| `avatar/coast-px` | 32 master: ANTENNA ×2 at (1, 1), transparent. 16 master: ANTENNA ×1 at (0, 0) |
| `standby/coast-16x9` | Grid 640×360: `L = 0.08 + 0.30·max(0, 1 − d/(0.55W))`, where d is the distance to (0.2W, 0.45H). CAMERA ×8 centred at (0.2W, 0.45H). The right two-thirds stay at L ≈ 0.08 |
| `standby/coast-9x16` | Grid 360×640: centre (0.5W, 0.3H), radius 0.8W, CAMERA ×8 at the centre. The bottom 45% stays dark |
| `standby/coast-1x1` | Grid 640×640: centre (0.5W, 0.32H), radius 0.6W, CAMERA ×10 at the centre |
| `standby/*-lum.png` | Downscaled from the placeholder grid instead of a raw |
| `talent/coast-portrait` | Grid 384×512: centre (0.5W, 0.42H), radius 0.7W, CAMERA ×12 at the centre |
| `motion/*` | **No video files.** The manifest has `sources: []`, and `BrandVideo` renders the poster (`talent/coast-portrait` or `standby/coast-16x9`) |
| `slate/<id>` | 192×128, transparent. A floor-shadow ellipse (centre (96, 112), rx 60, ry 8) as a 25% Bayer field in ramp-1, then one glyph: CAMERA ×5 centred at (96, 60) for `live-control`, `clips` and `recordings`; CRT ×6 with its origin at (51, 25) for `not-found` (the screen is centred on (96, 64) and is 66×30 art pixels); CRT ×6 at (51, 25) with the screen filled by a 50% Bayer field in ramp-2 for `signal-lost`; ANTENNA ×5 centred at (96, 60) for the other six |
| `share/og` | Grid 600×316: `L = 0.10 + 0.08·sin(2π·(2.6·y/H + 0.4·sin(2π·x/W)))` (carrier bands), CAMERA ×8 centred at (0.77W, 0.5H). Then the same wordmark and pixel-line composite as §13.6.9 |
| `icons/app`, `wordmark/*`, masks | Always derived; built the same way with or without a key |

Placeholders go through `quantizePx` (4 ramp colours plus glint) even for CHROME ids, so they pass BC-06 as PX files. Their manifest `enc` is `placeholder`.

### 13.8 `lib/brandAssets.ts` (generated) and how it is used

`build` writes this typed module and `public/brand/manifest.json`.
- The JSON's shape is `{ "version": 1, "assets": { "<id>": <the same entry, with "sha256" and "enc" added to every source> } }`.
- The JSON also lists `icons/app`, for `check` only. The TypeScript module does not.
- Both files come out the same on every run.
- The TypeScript uses two-space indents, single quotes and a trailing newline, and passes `npm run lint` and `npm run typecheck`.

```ts
// dashboard/lib/brandAssets.ts
// Generated by `npm run brand:build` (scripts/brand/manifest.mts). Do not edit by hand.

export type BrandSource = {
  readonly src: string              // absolute path under /brand/ (or /opengraph-image.png)
  readonly type: 'image/avif' | 'image/webp' | 'image/png' | 'video/webm' | 'video/mp4'
  readonly width: number
  readonly height: number
  readonly bytes: number
}

export type BrandImageEntry = {
  readonly kind: 'image'
  readonly width: number            // intrinsic size of the largest variant
  readonly height: number
  readonly sources: readonly BrandSource[] // AVIF ascending width, then WebP ascending, then PNG
  readonly fallback: string         // largest WebP (or PNG) — the <img src>
  readonly color: string            // '#RRGGBB', mean colour of the art master
  readonly blur: string             // 'data:image/png;base64,…', a 16-px-wide nearest mosaic, rendered pixelated
  readonly pixelated: boolean       // true for PX and CHROME art; false for wordmark
  readonly generated: boolean
  readonly origin: 'fal' | 'placeholder' | 'derived'
}

export type BrandVideoEntry = {
  readonly kind: 'video'
  readonly width: number
  readonly height: number
  readonly sources: readonly BrandSource[] // the WebM, then the MP4; [] for placeholders
  readonly poster: BrandImageId
  readonly durationMs: number | null
  readonly loop: boolean
  readonly generated: boolean
  readonly origin: 'fal' | 'placeholder'
}

export const brandAssets = {
  'standby/coast-16x9': {
    kind: 'image', width: 1280, height: 720,
    sources: [
      { src: '/brand/standby/coast-16x9-640.avif', type: 'image/avif', width: 640, height: 360, bytes: 29811 },
      { src: '/brand/standby/coast-16x9-1280.avif', type: 'image/avif', width: 1280, height: 720, bytes: 98114 },
      { src: '/brand/standby/coast-16x9-640.webp', type: 'image/webp', width: 640, height: 360, bytes: 40310 },
      { src: '/brand/standby/coast-16x9-1280.webp', type: 'image/webp', width: 1280, height: 720, bytes: 50122 },
    ],
    fallback: '/brand/standby/coast-16x9-1280.webp',
    color: '#0B1426', blur: 'data:image/png;base64,…', pixelated: true, generated: false, origin: 'placeholder',
  },
  // … one entry per id in §13.6 (#2–#9, #11), in §13.6 order (byte counts above are illustrative)
} as const satisfies Record<string, BrandImageEntry | BrandVideoEntry>

export const brandAliases = {
  'standby-16x9': 'standby/coast-16x9',
  'standby-9x16': 'standby/coast-9x16',
  'standby-1x1': 'standby/coast-1x1',
  'coast-talent-nod': 'motion/coast-talent-nod',
  'coast-standby-loop': 'motion/coast-standby-loop',
} as const

export type BrandImageId =
  | 'loader/coast-boot' | 'avatar/coast-px' | 'standby/coast-16x9' | 'standby/coast-9x16' | 'standby/coast-1x1'
  | 'talent/coast-portrait' | 'share/og' | 'wordmark/wzrdtech'
  | 'slate/live-control' | 'slate/shotboard' | 'slate/characters' | 'slate/locations' | 'slate/clips' | 'slate/recordings'
  | 'slate/analytics' | 'slate/not-found' | 'slate/not-patched' | 'slate/no-access' | 'slate/signal-lost'
  | 'standby-16x9' | 'standby-9x16' | 'standby-1x1'
export type BrandVideoId = 'motion/coast-talent-nod' | 'motion/coast-standby-loop' | 'coast-talent-nod' | 'coast-standby-loop'

export function resolveBrandId(id: BrandImageId | BrandVideoId): keyof typeof brandAssets {
  return (brandAliases as Record<string, keyof typeof brandAssets>)[id] ?? (id as keyof typeof brandAssets)
}
```

> Note: the bible writes `<BrandImage id="standby-16x9">` and `<BrandVideo id="coast-standby-loop">`. `brandAliases` keeps those forms valid and type-checked for bible compatibility only. The canonical ids are the §13.6 ids, and new code passes only canonical ids (Live Control computes `standby/coast-${aspect.replace(':', 'x')}`).

**How components use the manifest.** This section owns the `BrandImage` and `BrandVideo` API and behaviour; §7.5 lists their files under `components/brand/` and points here:
- **`<BrandImage id sizes alt className?>`**
  - Resolves the id, then renders `<picture>` with one `<source type="image/avif" srcSet="<src> <w>w, …" sizes={sizes}>`, one `<source type="image/webp" …>`, and `<img src={fallback} width height alt loading="lazy" decoding="async">`.
  - Until `load`, the `<img>` has `background-color: color` and `background-image: url(blur)` at `100% 100%`.
  - When `pixelated` is true, both the image and the mosaic get `image-rendering: pixelated`, so the placeholder reads as a coarse pixel mosaic, never a blur.
  - On `load`, the background is removed and one `.px-resolve` runs (none under reduced motion or the air lock).
  - `alt` is required. Decorative uses pass `alt=""` and `aria-hidden`.
  - No brand image uses `next/image`.
- **`<BrandVideo id className?>`**
  - Resolves the id.
  - When `sources.length === 0`, under `prefers-reduced-motion: reduce`, or under `html[data-lock="air"]`, it renders only `<BrandImage id={poster} alt="" aria-hidden>`.
  - Otherwise it renders `<video muted playsInline loop={loop} preload="none" poster={posterFallback} aria-hidden="true">`, with the WebM `<source>` before the MP4. `posterFallback` is the poster entry's `fallback` (the `-768` or `-1280` WebP).
  - Each motion asset ships exactly one WebM and one MP4 at 2 px cells (§13.6.6, §13.6.7), so there is no width-based source choice.
  - The `<source>` elements are attached once, when the element first becomes visible.
  - It plays while at least 25% is visible and `document.visibilityState === 'visible'`, and pauses otherwise.
- **Fixed paths.** Paths that §6/§7 name directly stay fixed: `/brand/loader/coast-boot-strip@2x.png`, `/brand/wordmark/wzrdtech-*`, `/brand/slate/<id>.webp`, `/brand/standby/coast-<a>-lum.png` and `/brand/icons/favicon-onair.svg`. The manifest still lists them so `check` can verify them.

### 13.9 Budgets and `brand:check`

**Per-file budgets and dimensions** (KB = 1,024 B):

| Files | Dimensions | Max bytes | Alpha |
|---|---|---|---|
| `loader/coast-boot-strip@1x.png` · `@2x.png` · `coast-boot-still@2x.png` | 512×64 · 1024×128 · 128×128 | 25 KB · 60 KB · 8 KB | required |
| `loader/coast-boot.json` | — | 1 KB | — |
| `avatar/coast-px-16.png` · `-32.png` | 16×16 · 32×32 | 2 KB each | required |
| `avatar/coast-px-48.webp` · `-96.webp` | 48×48 · 96×96 | 8 KB each | forbidden |
| `standby/coast-<a>-1280.{avif,webp}` | 1280×720 · 720×1280 · 1280×1280 | 120 KB each | forbidden |
| `standby/coast-<a>-640.{avif,webp}` | 640×360 · 360×640 · 640×640 | 45 KB each | forbidden |
| `standby/coast-<a>-lum.png` | 160×90 · 90×160 · 90×90, 1 channel | 8 KB each | forbidden |
| `talent/coast-portrait-768.{avif,webp}` · `-384.{avif,webp}` | 768×1024 · 384×512 | 90 KB · 35 KB each | forbidden |
| `slate/<id>.png` · `slate/<id>.webp` (×11) | 192×128 · 384×256 | 12 KB · 40 KB | required |
| `icons/icon-192.png` · `icon-512.png` | 192×192 · 512×512 | 25 KB each | required |
| `icons/icon-maskable-512.png` | 512×512 | 25 KB | forbidden |
| `icons/favicon-onair.svg` | viewBox 0 0 32 32 | 6 KB | — |
| `wordmark/wzrdtech-160` · `-320` · `-640` `.{avif,webp}` | 160×40 · 320×79 · 640×158 | 8 · 15 · 40 KB each | required |
| `motion/coast-talent-nod.webm` · `.mp4` | 768×1024 | 700 KB · 1,024 KB | — |
| `motion/coast-standby-loop-1280.webm` · `-1280.mp4` | 1280×720 | 1,228,800 B · 2,097,152 B | — |
| `public/favicon.ico` | 16, 32, 48 | 10 KB | required |
| `app/icon.svg` · `app/apple-icon.png` | 32×32 · 180×180 | 6 KB · 25 KB | — · forbidden |
| `app/opengraph-image.png` · `app/twitter-image.png` | 1200×630 | 180 KB each | forbidden |
| `components/boot/masks.ts` | 120×30, 80×20 | 2 KB | — |

**Totals.**
- Images under `public/brand/` (png, webp, avif, svg): ≤ **2,621,440 B** (2.5 MB).
- Video under `public/brand/` (webm, mp4): ≤ **6,291,456 B** (6 MB).
- The per-file image maximums above add up to 2,156 KB, so files that each fit can never exceed the image total.
- The per-file video maximums add up to 5,091,328 B (about 4.86 MB), within the video total.

**Pre-LCP allowlist.** Only these files may be referenced by `<link rel="preload" as="image">` or be loaded eagerly on first paint: `/brand/wordmark/wzrdtech-160.{avif,webp}`, `/brand/wordmark/wzrdtech-320.{avif,webp}`, `/brand/wordmark/wzrdtech-640.webp` and `/brand/loader/coast-boot-strip@2x.png` (requested by the boot script in post mode only; never preloaded).

> Note: the bible allows only the wordmark 160/320 and the loader strip before LCP. The boot needs `wzrdtech-640.webp` (see the note in §6.2), so it joins the allowlist.

**Rules.** `npm run brand:check` prints each violation as `BC-nn <path> <detail>` and exits 1 on any violation.

| Rule | Checks |
|---|---|
| BC-01 Files | Every output listed in `assets.mts` exists, in both modes. The exception is the video files of a motion entry whose `sources` is `[]`. No file under `public/brand/` except `manifest.json` is unlisted |
| BC-02 Dimensions | Images: sharp `metadata()` width and height match the table. ICO: sharp 0.34.5 cannot decode it, so `check.mts` parses it: `readUInt16LE(2) === 1`, the entry count at offset 4, then the 16-byte directory entries (width byte 0 means 256; size at +8, offset at +12). There are exactly 3 entries, of 16, 32 and 48, and each starts with `89 50 4E 47`; BC-02, BC-05 and BC-06 then run on each embedded PNG with sharp. Video (sharp cannot decode it, and `check` never needs ffmpeg): the MP4 `tkhd` width and height (16.16 fixed point, the last 8 bytes of the box) and the WebM EBML `PixelWidth` (ID `0xB0`) and `PixelHeight` (ID `0xBA`) match the table |
| BC-03 Bytes | Every file is within its budget |
| BC-04 Totals | The image and video totals above hold |
| BC-05 Alpha | "required": the file has alpha, at least 1 pixel with α = 0, and (for PX files) every α ∈ {0, 255}. "forbidden": no alpha channel, or every α = 255. Does not apply to video |
| BC-06 Palette | Applies only to PNG and lossless WebP (AVIF is lossy and exempt; video does not apply). PX files (loader, avatar, slates, icons and every placeholder): every opaque pixel ∈ {`#05080F`, `#1D3160`, `#3357A8`, `#7AA5E0`, `#E8EEF9`, `#FF3B30`}. CHROME lossless WebP: ≤ 32 unique colours. `-lum.png`: 1 channel |
| BC-07 Loader | Strip width = 8 × height. Frame 8 equals frame 1 pixel for pixel. `coast-boot.json` equals §13.6.2 |
| BC-08 No raw leak | No file under `public/` or `app/` has a sha256 equal to: a reference hash (`approved.json` `sheet.refs.sha256`), `sheet.raw.sha256`, any `assets.*.raw.sha256`, or any file in `.cache/` when present. No image under `public/` or `app/` has a generation size (2048×1152, 2048×1024, 1024×1024, 1920×1088, 1088×1920, 1088×1088, 1536×2048, 1536×1024, 2400×1264) or a long edge > 1280. The exception is `public/wzrdtechlogo.png`, the wordmark source. No image carries EXIF or XMP (sharp `metadata().exif` and `.xmp` are undefined) |
| BC-09 Provenance | Every manifest entry with `generated: true` has an `approved.json` entry whose `outputs` sha256 match the files and whose `sheetSha256` equals `sheet.raw.sha256`. `approved.json` and `scripts/brand/spend.jsonl` (when present) contain no `http`, no `Key ` and no `COAST_REF_URLS` value |
| BC-10 Manifest parity | Every id in `lib/brandAssets.ts` is in `public/brand/manifest.json` with identical sources and bytes. The bytes match the files. Every alias target exists |
| BC-11 Git hygiene | `.gitignore` contains the line `scripts/brand/.cache/`. `git ls-files scripts/brand/.cache` is empty. The `exclude` in `tsconfig.json` contains `"scripts"`. `app/favicon.ico` does not exist |
| BC-12 Pre-LCP | The `<link rel="preload" as="image">` hrefs in `app/layout.tsx` are all in the allowlist |
| BC-13 Icons | `app/icon.svg` has `viewBox="0 0 32 32"`. `favicon-onair.svg` contains a `#FF3B30` 4×4 rect at x=28, y=0. `app/manifest.ts` references the three icon paths |
| BC-14 Masks | `masks.ts` exports `MASK_L` (w 120, h 30) and `MASK_S` (w 80, h 20). The decoded bit counts equal w·h. The fill ratio is in [0.2, 0.8] |
| BC-15 Honesty | Every `origin: 'placeholder'` entry has `generated: false`. When `approved.json.assets` is empty, every entry has `generated: false` |
| BC-16 Video containers | WebM files start with `1A 45 DF A3`. MP4 files have `ftyp` at byte 4 and `moov` before `mdat` (faststart). A generated video lists both formats |

**Contact sheet** (`check --contact-sheet <path>`):
- A PNG on `#05080F`, 4 columns of 320×240 tiles, with each shipped image fitted inside its tile (nearest-neighbour when `pixelated`).
- Video entries are shown by their poster, with a `VIDEO` tag.
- Under each tile is `<id> · <origin>` in PX5×7 at 2 px cells in `#7AA5E0`. Labels are uppercased, because the glyph table has no lowercase.
- It is built only from files under `public/` and `app/`, never from `.cache`.

### 13.10 Cost plan and the D5 run procedure

**Cost plan** at the fallback prices (§13.3.6). A live price replaces any figure it exceeds.

| Asset | Endpoint | Draft (low × 1) | Final (high × 2) | Est. draft | Est. final |
|---|---|---|---|---|---|
| `coast-brand-sheet-v1` | sunburst/edit | 1 call | 1 call | $0.05 | $0.80 |
| `loader/coast-boot` | sunburst/edit | 1 | 1 | $0.05 | $0.80 |
| `avatar/coast-px` | sunburst/edit | 1 | 1 | $0.05 | $0.80 |
| `standby/*` (3) | sunburst/edit | 3 | 3 | $0.15 | $2.40 |
| `talent/coast-portrait` (3.15 MP, ×1.333) | sunburst/edit | 1 | 1 | $0.07 | $1.07 |
| `slate/*` (11) | sunburst/edit | 11 | 11 | $0.55 | $8.80 |
| `share/og` (3.03 MP, ×1.285) | sunburst/edit | 1 | 1 | $0.06 | $1.03 |
| **Stills subtotal** | | 19 calls | 19 calls (38 images) | **$0.98** | **$15.69** |
| `motion/coast-talent-nod` | h3-max/image-to-video, 5 s | — | 1 | — | $5.00 |
| `motion/coast-standby-loop` | h3-max/image-to-video, 5 s | — | 1 | — | $5.00 |
| **Planned total** | | | | | **$26.68** |
| Contingency | 5 draft rerolls ($0.25) + 1 reference-to-video retry ($3.00) | | | | $3.25 |
| **Planned + contingency** | | | | | **$29.93** of the $40.00 cap |

**With `FAL_KEY` and references (D5; the M9 `brand` part).** Run from `dashboard/`, with `FAL_KEY` and `COAST_REF_URLS` in the process environment (Devin secrets). **Never create `dashboard/.env.local`** (§1.6 step 0): `next dev` would load it and break §1.6's keyless QA.

1. The keyless pipeline is part 3B; the finals are the M9 `brand` PR (§14.15). Waiting for Coast's sign-off therefore never blocks the pipeline or any other part.
2. Run `npm run brand:plan` and paste the table into the PR.
3. Verify the endpoints (§13.2 protocol). Record the findings in the PR "Decisions".
4. Make the sheet draft:
   1. Run `npm run brand:gen -- --tier draft --only coast-brand-sheet-v1`.
   2. Open the newest `.cache/contact/draft-*.png`.
   3. Run `node --experimental-strip-types scripts/brand/generate.mts approve coast-brand-sheet-v1 1` (the later `approve …` steps use the same command). If identity drifts, re-run the draft with `--reroll 1`, then `--reroll 2`.
5. Make the sheet final: run `npm run brand:gen -- --tier final --only coast-brand-sheet-v1`, compare both variants with the references, then run `approve coast-brand-sheet-v1 <n>`.
6. Make the still drafts (18 drafts):
   1. Run `npm run brand:gen -- --tier draft --only 'loader/**,avatar/**,standby/**,talent/**,slate/**,share/**'`.
   2. Review the contact sheet and run `approve <id> <n>` for each acceptable draft.
   3. Use at most one `--reroll 1` per rejected asset.
7. Make the still finals: run `npm run brand:gen -- --tier final --only 'loader/**,avatar/**,standby/**,talent/**,slate/**,share/**' --yes`, review, and run `approve <id> <n>` for each.
8. Make the motion finals:
   1. Run `npm i --no-save ffmpeg-static@5.3.0`.
   2. Run `npm run brand:gen -- --tier final --only 'motion/**'`.
   3. Review the clips in any video player.
   4. Run `approve motion/coast-talent-nod <n> --trim-start <s>` and `approve motion/coast-standby-loop <n>`.
9. Run `npm run brand:build`, then `npm run brand:check -- --contact-sheet ../docs/redesign/after/brand-contact-sheet.png`, then `npm run build`.
10. Commit only these files:
    - `public/brand/**` and `public/favicon.ico`;
    - `app/icon.svg`, `app/apple-icon.png`, `app/manifest.ts`;
    - `app/opengraph-image.png` and `app/twitter-image.png`, each with its `.alt.txt`;
    - `lib/brandAssets.ts` and `components/boot/masks.ts`;
    - `scripts/brand/approved.json`;
    - `scripts/brand/spend.jsonl` (every paid submit of this run and of any earlier session, §13.3.4);
    - `docs/redesign/after/brand-contact-sheet.png` (from the repository root; every other path in this list is under `dashboard/`).
11. Fill in the PR body, under "Owner-decision evidence":
    - the contact sheet: `![Brand finals](https://github.com/gratitude5dee/5dee-tv/blob/<branch>/docs/redesign/after/brand-contact-sheet.png?raw=true)`;
    - the `plan --ledger` output, computed over the committed `spend.jsonl` (ledger total ≤ $40.00);
    - the endpoint that produced each asset (from `approved.json`), including every fallback taken;
    - under "Deferred / blocked": `Coast sign-off on brand finals (D5/D9)`.

    Devin does not merge this PR. The user merges it after Coast signs off.

**Review rubric** for `approve`. Reject a variant if any line applies:
- The face, hairline, hairstyle, skin tone or proportions differ from Image 1 or the references.
- There is any second person or face, any text, letter, digit or logo, a border or frame around the whole image, or a grid line. Frames that a subject asks for (the `shotboard` and `clips` slates) are allowed (§13.5 Note).
- Composition: Coast is outside the stated third or band, the reserved empty space is busy, or the `not-found` CRT is off centre.
- CHROME only: the skin reads blue.
- PX only: after `build`, BC-06 fails, or the 32×32 or 16×16 master is unreadable.
- Motion: identity drifts, anything besides the prompted motion moves, or the nod does not return to the start pose within the kept 2 s.

**Without `FAL_KEY` or without references (keyless; part 3B, which runs this even when `FAL_KEY` is set):**
1. Run `npm run brand:build`. It writes the placeholders and the derived wordmark, masks and icons.
2. Run `npm run brand:check`.
3. Run `npm run brand:plan` and paste the table (price source `fallback`) into the PR, so a human can run the procedure above later.
4. Commit the pipeline, `lib/pixelFont.json` (§13.6.10), the placeholder and derived outputs, `lib/brandAssets.ts`, `public/brand/manifest.json`, `components/boot/masks.ts`, and `approved.json` containing `{ "version": 1, "sheet": null, "assets": {} }`.
5. Never ask for, wait for, or embed a key. The PR states: "Brand art is placeholder (`generated:false`). Run §13.10 with `FAL_KEY` and `COAST_REF_URLS` to replace it."

**Cut order** (bible §0.7): if time or budget runs short, drop `motion/coast-talent-nod` first, then `motion/coast-standby-loop` (poster only). A dropped motion asset keeps its manifest entry with `sources: []`.

### 13.11 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`. No command mixes both forms. The run modes (dev, prod, fixture) are §1.6's. Untagged items are keyless and gate part 3B. Items tagged "From 5C" need the `#ds-brand` specimen, which lands in 5C (§14.11), and gate that part. Items tagged "D5 run only" gate the M9 `brand` PR.

- [ ] `ls dashboard/scripts/brand` lists `generate.mts assets.mts prompts.mts endpoints.mts fal.mts pricing.mts quantize.mts encode.mts video.mts placeholders.mts manifest.mts check.mts util.mts no-network.mjs pricing.fallback.json approved.json tsconfig.json` (plus `spend.jsonl` after the D5 run).
- [ ] `npm run brand:typecheck` exits 0. `grep -rnE "^\s*(export\s+)?(const\s+)?enum\s|namespace\s" dashboard/scripts/brand` prints nothing, and `grep -rnE "import\(['\"]ffmpeg-static|from ['\"]ffmpeg-static" dashboard/scripts/brand` prints nothing (`createRequire` only, §13.3.2).
- [ ] `node -e "const t=require('./tsconfig.json');process.exit(t.exclude.includes('scripts')?0:1)"` exits 0 (added in 1A, §15.1), and `npm run typecheck`, `npm run lint` and `npm run build` exit 0.
- [ ] `git check-ignore -q dashboard/scripts/brand/.cache/refs/x.png` exits 0, and `git ls-files dashboard/scripts/brand/.cache` prints nothing.
- [ ] `node -e "const p=require('./package.json');const b=['brand:plan','brand:gen','brand:build','brand:check'];process.exit(p.devDependencies.sharp==='0.34.5'&&!('ffmpeg-static' in {...p.dependencies,...p.devDependencies})&&b.every(s=>(p.scripts[s]||'').startsWith('node --experimental-strip-types ')&&!/env-file/.test(p.scripts[s]))?0:1)"` exits 0 (no brand script reads an env file).
- [ ] With no `FAL_KEY` in the environment: `npm run brand:build` exits 0; running it a second time leaves `git status --porcelain` unchanged; `npm run brand:check` exits 0.
- [ ] `build` and `check` are offline (§13.3.7): `env -u FAL_KEY node --experimental-strip-types --import ./scripts/brand/no-network.mjs scripts/brand/generate.mts build && env -u FAL_KEY node --experimental-strip-types --import ./scripts/brand/no-network.mjs scripts/brand/generate.mts check` exits 0.
- [ ] `env -u FAL_KEY -u CI node --experimental-strip-types --import ./scripts/brand/no-network.mjs scripts/brand/generate.mts run --tier draft` exits 3, and its output contains no `network disabled`. `CI=1 FAL_KEY=x npm run brand:gen -- --tier draft --dry-run` exits 5.
- [ ] Reference gate (§13.4): `env -u CI -u COAST_REF_URLS FAL_KEY=x node --experimental-strip-types --import ./scripts/brand/no-network.mjs scripts/brand/generate.mts run --tier draft --dry-run` exits 3 and prints `no approved Coast references (D5): COAST_REF_URLS is empty`. Devin never places a file in `.cache/refs/` for this check. **Human operator only:** with one PNG at the top level of `scripts/brand/.cache/refs/`, the same command still exits 3.
- [ ] `FAL_KEY=test-key-1234567890abcdef npm run brand:plan 2>&1 | grep -c "test-key-1234567890abcdef"` prints `0`, the first line of the output names the Node version, and every row shows a `PRICE SOURCE` value.
- [ ] `node --experimental-strip-types --input-type=module -e "const {redact}=await import('./scripts/brand/util.mts'); process.exit(redact('https://v3.fal.media/files/a/b.png').includes('fal.media')?1:0)"` exits 0 (§13.3.7).
- [ ] `grep -rnE "sdk-proxy|/api/fal|proxyUrl" dashboard/scripts/brand` prints nothing. `grep -rln "@fal-ai/client" dashboard/scripts/brand` prints only `fal.mts`. `grep -rnE "from ['\"][^'\"]*scripts/brand" dashboard/app dashboard/components dashboard/lib dashboard/hooks` prints nothing.
- [ ] `node --experimental-strip-types --input-type=module -e "const a=await import('./scripts/brand/assets.mts'); for (const x of a.ASSETS) if (x.size) a.assertImageSize(x.size); let t=0; try { a.assertImageSize({width:2048,height:600}) } catch { t=1 }; process.exit(t?0:1)"` exits 0.
- [ ] Keyless: `node -e "const m=require('./public/brand/manifest.json');process.exit(Object.values(m.assets).every(a=>a.generated===false)?0:1)"` exits 0, `cat scripts/brand/approved.json` prints `{ "version": 1, "sheet": null, "assets": {} }` (ignoring whitespace), and `test ! -e scripts/brand/spend.jsonl` succeeds.
- [ ] Every file in §13.9's table exists with the listed dimensions and within its budget. The image total is ≤ 2,621,440 B and the video total ≤ 6,291,456 B (BC-01…BC-04 pass).
- [ ] `file dashboard/public/favicon.ico` reports 3 icons, and `test ! -e dashboard/app/favicon.ico` succeeds. In prod (§1.6), `curl -s localhost:3109/favicon.ico | head -c 4 | xxd -p` prints `00000100`.
- [ ] In prod (§1.6), `curl -s -o /dev/null -w '%{http_code}' localhost:3109<path>` prints `200` for each `<path>` of `/manifest.webmanifest`, `/icon.svg`, `/apple-icon.png`, `/opengraph-image.png`, `/twitter-image.png`, `/brand/icons/favicon-onair.svg` and `/brand/loader/coast-boot-strip@2x.png`. The HTML of `curl -s localhost:3109/admin` contains `og:image` and `rel="manifest"`.
- [ ] `grep -rlE "coast-brand-sheet-v1|/\.cache/" dashboard/public dashboard/app` prints nothing, and BC-08 passes: no raw, reference or master sheet is under `public/` or `app/`.
- [ ] `grep -rniE "coast[^.]{0,80}\b(he|him|his|she|her|hers)\b" dashboard/scripts/brand` prints nothing (D9).
- [ ] `node --experimental-strip-types --input-type=module -e "const {ASSETS}=await import('./scripts/brand/assets.mts'); const ok=ASSETS.filter(a=>a.size).every(a=>a.prompt(3).includes('\nConstraints: ')) && ASSETS.filter(a=>a.tier==='CHROME').every(a=>a.images.join()==='coast-brand-sheet,wzrdtech-wordmark'); process.exit(ok?0:1)"` exits 0.
- [ ] The loader strip's 8th 128×128 frame is pixel-identical to its 1st (BC-07).
- [ ] From 5C, in fixture mode (§1.6): the `#ds-brand` `CoastLoader`s (64 and 128) show the strip, and the console has no 404.
- [ ] `lib/brandAssets.ts` exports `brandAssets`, `brandAliases`, `BrandImageId`, `BrandVideoId` and `resolveBrandId`. `resolveBrandId('standby-16x9') === 'standby/coast-16x9'` and `resolveBrandId('coast-standby-loop') === 'motion/coast-standby-loop'`.
- [ ] From 5C, keyless, in fixture mode (§1.6): `#ds-brand` renders `<BrandVideo id="motion/coast-standby-loop">` as the `standby/coast-16x9` poster `<img>` with no `<video>`, and the page makes no request whose path starts with `/brand/motion/`.
- [ ] D5 run only: `approved.json` has one entry per generated asset and a non-null `sheet`; `check` passes BC-09; `scripts/brand/spend.jsonl` is committed with one line per paid submit, and `plan --ledger` over it prints a total ≤ $40.00; the PR body shows the contact sheet image, that total and the endpoint used for each asset; the PR is left unmerged until Coast signs off.
- [ ] D5 run only: with the approved motion raws in `.cache`, running `npm run brand:build` a second time leaves `git status --porcelain` unchanged (byte-identical video, §13.6.7).
- [ ] D5 run only: `git log -p -- dashboard/scripts/brand/approved.json dashboard/scripts/brand/spend.jsonl | grep -cE "https?://|Key [A-Za-z0-9]"` prints `0`.
