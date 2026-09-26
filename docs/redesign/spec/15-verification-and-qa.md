> **Spec chapter §15 — Verification and QA.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 15. Verification and QA

This section is the complete verification harness. Devin builds it in **M1 part 1A**, before the first visual change (§14.3 R1), and runs it in every PR after that. Every file below is complete; copy it verbatim. Change a file only where a later milestone's PR adds a spec, an entry or an allowance, and say so under "Decisions". File paths inside this section are relative to `dashboard/` unless they start with `docs/` or `.agents/`. Facts about the existing code are **as of 845147c**.

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`, and every script in this section refuses to run anywhere else.

The harness was run against 845147c in a scratch copy with Node 22.22.2, `@playwright/test` 1.56.1, Chromium 1194 and SwiftShader. These results were verified:
- With `WZRD_MILESTONE=0`, every dev project passes, and every later gate is skipped.
- Two consecutive visual runs match in all four viewport projects.
- `tests/live-extraction.spec.ts` matches its own previous run at `maxDiffPixels: 0`, with an empty DOM diff.
- `grep-gates.sh` reproduces the §15.3 "845147c" column on 845147c and the "Post-D1 (M0 head)" column on 845147c minus the 11 D1 files; `route-sizes.mjs` reproduces the §3.5 numbers.
- `appendix-a.mjs` finds every Appendix A fragment on 845147c minus the D1 files, with Appendix A as written (A.4.3 writes the two `MAX_ASSET_REFERENCES` values as `{MAX_ASSET_REFERENCES}`).
- The production project passes, with a median LCP of 132 ms at 845147c.

### 15.1 The harness: files, dependencies and environment

**When:** M1 part 1A adds everything in this section. M0 verifies with the §1.5 commands only. From 1A on, every PR runs §15.8.

**Files** (all new):

```text
dashboard/
  playwright.config.ts
  tests/
    tsconfig.json                    type-checks tests + playwright.config.ts (the root tsconfig excludes them)
    global-setup.ts                  warms every route so dev compiles never land inside a test
    screenshot.css                   hides self-animating pixels during regression comparisons
    helpers/  env.ts  test.ts  routes.ts  console.ts  probes.ts  react-commits.ts  media.ts  pw-jsx.ts
    lib/      contrast.ts (§5.6, verbatim)  ledger.ts
    routes.spec.ts  visual.spec.ts  a11y.spec.ts  contrast.spec.ts  canvas-audit.spec.ts  boot.spec.ts  lcp.spec.ts
    live-control.spec.ts  preserved-contract.spec.ts  live-extraction.spec.ts (runs until 6a; 8B deletes it)  perf.spec.ts  reduced-media.spec.ts
    unit/ledger.spec.ts
    __screenshots__/<project>/*.png  regression snapshots (committed)
  scripts/checks/  grep-gates.sh  route-sizes.mjs  qa-build.sh  appendix-a.mjs
```

**`package.json`** (merge these keys; this adds no runtime dependency):

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit && tsc --noEmit -p convex/tsconfig.json && tsc --noEmit -p tests/tsconfig.json",
    "qa:build": "bash scripts/checks/qa-build.sh",
    "gates": "bash scripts/checks/grep-gates.sh",
    "test:e2e": "playwright test",
    "test:prod": "WZRD_PROD=1 playwright test",
    "test:unit": "playwright test --project=unit"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.56.1"
  },
  "overrides": {
    "playwright-core": "1.56.1"
  }
}
```

- **Versions** (checked with `npm view`, 2026-09-25):
  - `@playwright/test` is pinned to 1.56.1, whose Chromium build is 1194. That is the browser the §1.6 console table was measured with, so snapshots and console text stay comparable.
  - `@axe-core/playwright` 4.13.0 depends on `axe-core ~4.13.0`, and its peer dependency is `playwright-core >= 1.0.0`.
- **`overrides`:** without it, npm installs `playwright-core@1.63.0` at the top level for axe's peer, while `@playwright/test` keeps 1.56.1 nested. `new AxeBuilder({ page })` then fails type-checking with TS2740 (verified). The override is not a dependency, and D8 allows both packages.
- **Type-checking:**
  - In `tsconfig.json`, change `"exclude"` to `["node_modules", "scripts", "tests", "playwright.config.ts"]`. `"scripts"` lands here in 1A, not in 3B: §13.3.2 relies on it, 3B does not edit the file, and BC-11 checks it.
  - That keeps `next build`, and every Cloudflare Pages build, independent of the test devDependencies. `npm run typecheck` still checks the tests through `tests/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["**/*.ts", "**/*.tsx", "../playwright.config.ts"],
  "exclude": []
}
```

**`.gitignore`** (dashboard/): append `test-results/`, `playwright-report/` and `.qa/`.

**Install:**
1. Run `npm ci`.
2. Run `npx playwright install chromium`. On a fresh Linux image, run `npx playwright install --with-deps chromium`.
3. If the browser download is blocked, follow the §1.6 pitfall and record the gap under Verification.

**Environment variables** (read by the harness only; the servers never see them):

| Variable | Values | Effect |
|---|---|---|
| `WZRD_MILESTONE` | `0`…`5`, `6a`, `6b`, `7`, `8`, `9` (default `9`) | Which gates are enforced. `since('<m>')` skips a test until the branch reaches that milestone. §14.2 says which value each PR uses |
| `WZRD_PROD` | `1` | Runs the `prod` project against `next start` (edge-only) on `WZRD_PROD_PORT`. Run `npm run qa:build` first |
| `WZRD_AFTER` | `1` | `tests/visual.spec.ts` also writes after-screenshots to `docs/redesign/after/m<id>/` (§15.10) |
| `WZRD_LIVE_OUT` | a directory | `tests/live-extraction.spec.ts` writes normalised `main` HTML there (§14.12) |
| `WZRD_REUSE_SERVER` | `1` | Reuses a server that is already listening. Use it only for a server you started with the §1.6 `env -u` list (the 8A parent run) |
| `WZRD_DEV_PORT`, `WZRD_PROD_PORT` | default `3107`, `3109` | The §1.6 ports |

**Projects:**

| Project | Viewport and preferences | Runs |
|---|---|---|
| `unit` | no browser | `tests/unit/**` |
| `desktop-dark` | 1440×900, dark | every dev spec except `reduced-media` |
| `desktop-light` | 1440×900, light | routes, visual, a11y, preserved-contract, live-control and the chapter page specs |
| `laptop` | 1280×800, dark | routes, visual, preserved-contract, live-control |
| `mobile` | 390×844, dark, fine pointer | routes, visual, a11y, preserved-contract, live-control |
| `reduced-motion` | 1440×900, dark, `reducedMotion: 'reduce'` | canvas-audit (zero rAF), reduced-media |
| `prod` (`WZRD_PROD=1`) | 1440×900, dark | boot, lcp, routes |

The mobile project leaves `hasTouch` off. With `hasTouch: true`, Chromium matches `(pointer: coarse)` (verified), and the §5.2 44 px control height would change every mobile geometry that §8–§11 specify. The coarse-pointer target sizes are covered in §15.9 step 6.

### 15.2 Command gates and bundle budgets

Every PR runs these from `dashboard/`. Each one must exit 0.

| # | Command | Rule |
|---|---|---|
| C1 | `npm ci` | exit 0 |
| C2 | `npm run lint` | exit 0. No warning in a file the PR created or changed. From M0 on, the only warnings allowed are `reactbits/AccordionGallery.jsx:229` and `reactbits/ChromaGrid.jsx:115` |
| C3 | `npm run typecheck` | exit 0 (app, convex and tests) |
| C4 | `NEXT_TELEMETRY_DISABLED=1 npm run build` | exit 0. This is the §1.5 build, configured from `.env.production`. The two `@fal-ai/server-proxy` warnings are expected (D7) |
| C5 | `npm run qa:build` | exit 0. This is the unconfigured production build; its route table is `.qa/build.log`. §1.6 step 5 and the `prod` project serve this build |
| C6 | `node scripts/checks/route-sizes.mjs --milestone <id> .qa/build.log` | exit 0 (from M1). 8A adds `--compare` (§14.12 step 10) |
| C7 | `node scripts/checks/appendix-a.mjs` | exit 0 (from M1). Every Appendix A literal is still in the source, or its A.12 change is present (script below) |

`scripts/checks/qa-build.sh`:

```bash
#!/usr/bin/env bash
# dashboard/scripts/checks/qa-build.sh — the unconfigured production build of goal.md §1.6 step 5. Run from dashboard/.
# Empty NEXT_PUBLIC_* values stop `next build` from inlining dashboard/.env.production (it never overwrites a key that exists).
# The route table lands in .qa/build.log for scripts/checks/route-sizes.mjs.
set -euo pipefail
[[ -f package.json && -d app ]] || { echo "qa-build: run from dashboard/" >&2; exit 2; }
[[ ! -e .env.local ]] || { echo "qa-build: remove .env.local (goal.md §1.6 step 0)" >&2; exit 2; }
mkdir -p .qa
env -u FAL_KEY -u NEXT_PUBLIC_CONVEX_URL -u TWITCH_CLIENT_ID -u TWITCH_CLIENT_SECRET -u TWITCH_CHANNEL \
  -u NEXT_PUBLIC_TWITCH_CHANNEL -u NEXT_PUBLIC_TWITCH_CLIENT_ID -u NEXT_PUBLIC_FAL_API_URL \
  -u CF_ACCESS_TEAM_DOMAIN -u CF_ACCESS_AUD -u ADMIN_AUTH_MODE \
  NEXT_PUBLIC_CONVEX_URL= NEXT_PUBLIC_TWITCH_CHANNEL= NEXT_PUBLIC_TWITCH_CLIENT_ID= NEXT_TELEMETRY_DISABLED=1 \
  npx next build 2>&1 | tee .qa/build.log
```

**Budgets.** Next's table prints "First Load JS" per route. That number omits root-layout chunks, which means the whole shell.
- Measured on 845147c: adding a `motion/react` `LayoutGroup` nav indicator to `app/layout.tsx` created a 38.9 kB (gzip) chunk under `/layout`, and every route's printed First Load stayed the same.
- So `route-sizes.mjs` checks both the printed table (the numbers the chapters budget) and the true first-load set: every layout, template, loading, error and not-found chunk on the route's path, plus its page, each gzipped at level 9.

| Measure | Budget | From | 845147c (unconfigured build) | Source and reason |
|---|---|---|---|---|
| First Load JS shared by all | ≤ 106 kB | M0 | 102 kB | Framework chunks only. Growth means an app module leaked into them |
| Middleware | ≤ 42 kB | M0 | 41.6 kB | Never touched (§16) |
| `/admin` First Load | ≤ 360 kB | M0 | 347 kB (348 kB configured, §3.5) | §8.10 B23 and the dynamic-import rule. Details below |
| Every route's First Load in PR 8A | ≤ the parent build's value + 1 kB | 8A (`--compare`) | — | §8.5.4 step 6: the extraction adds nothing. After 5C, `/admin` is about 197–210 kB, so only a relative cap can catch growth |
| Every other route, until its page milestone | ≤ max(§3.5 value + 12 kB, the route's final budget below) | M0 | §3.5 | Codemods and shims only before the page PR. Page PRs run with the previous milestone's id (§14.2), so the cap never undercuts the chapter budget of the route being rebuilt |
| `/admin/shotboard` First Load − shared | ≤ 93 kB | M7 | 94 kB | §9.10. gsap leaves with ChromaGrid and AccordionGallery |
| `/admin/characters`, `/admin/locations` First Load | ≤ 210 kB each | M7 | 192 kB | §10.10 |
| `/admin/clips`, `/admin/recordings` First Load − shared | ≤ 45 kB each | M8 | 29 kB | §11.A.10, §11.B.10 |
| `/admin/analytics` First Load − shared | ≤ 100 kB | M8 | 95 kB | §11.C.10 |
| Root-layout chunks (the shell), gzip -9 | ≤ 180 kB | M4 | 123.6 kB | 123.6 kB, plus `motion/react` for the nav indicator (38.9 kB, measured), plus 17 kB for the stores, providers, CommandBar, StatusRail, ChyronHost and LiveRegion. The palette and boot client are `next/dynamic`, and BOOT_SCRIPT is inline HTML |
| three.js (`WebGLRenderer`) in a production route's first-load set | none | M5 | `/admin` | bible §10.1.9 |
| gsap (`GreenSock`) in a first-load set | none | `/admin`, clips, recordings, analytics from M5; shotboard, characters, locations from M7 | `/admin`, shotboard, characters, locations | bible §10.1.9; §9.10 |
| BOOT_SCRIPT and BOOT_CSS, gzip -9 | ≤ 4096 B and ≤ 1536 B | M4 | — | §6.2.12. `tests/boot.spec.ts` checks it |
| `public/brand` totals and per-file sizes | §13.9 | M3 | — | `npm run brand:check` |

**Why `/admin` may not exceed 360 kB.**
- The 845147c figure is 348 kB: 103 kB shared plus 245 kB for the route.
- In gzipped chunks, 136 kB of that is three r169 (117 kB) and gsap 3.15 (19 kB). Both arrive only through TrackManager's static `import MorphSlider from './reactbits/MorphSlider'` (`components/TrackManager.tsx:9`). The Dither carrier's three.js is already dynamic.
- Bible §10.1.9 requires `next/dynamic` with `ssr:false` for the boot client, SymbolRaster, HoloCard, HoverClip, CommandPalette and MorphSlider. A scratch build of 845147c that changed only that one import printed `/admin 197 kB`.
- Through M4, the static import is still in place, so the redesign may add at most 12 kB (3.4%) to the route. After 5C (§14.3 R5), the same 360 kB ceiling leaves about 160 kB of headroom, which exists only because the rule holds. A single static import of a three.js or gsap user would bring back about 136 kB and still pass 360 kB. From M5, the leak check is therefore what enforces the rule, and 360 kB catches everything else.

`scripts/checks/route-sizes.mjs`:

```js
#!/usr/bin/env node
// dashboard/scripts/checks/route-sizes.mjs — the docs/redesign/spec/15-verification-and-qa.md §15.2 bundle budgets. Run from dashboard/ after a production build:
//   npm run qa:build && node scripts/checks/route-sizes.mjs --milestone <id> [--compare <parent build.log>] .qa/build.log
// 1. Parses Next's printed route table (the numbers the chapters budget) and applies TABLE_BUDGETS. Until a route's page
//    milestone, its First Load may reach max(goal.md §3.5 baseline + 12 kB, the route's final budget).
// 2. --compare fails when any route's First Load grows by more than 1 kB over the parent build's log (PR 8A).
// 3. Next's table omits root-layout chunks (the whole shell). So it also recomputes each route's true first-load set from
//    .next/app-build-manifest.json — every layout/template/loading/error chunk on the path plus the page — gzips each
//    chunk (level 9), applies the 180 kB shell budget, and fails when three.js or gsap sit in a first-load set they must have left.
import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const ORDER = ['0', '1', '2', '3', '4', '5', '6a', '6b', '7', '8', '9']
const argv = process.argv.slice(2)
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined }
const M = String(opt('--milestone') ?? '').replace(/^m/i, '')
const PARENT = opt('--compare')
const log = argv.find((a, i) => !a.startsWith('--') && !['--milestone', '--compare'].includes(argv[i - 1]))
if (!ORDER.includes(M) || !log || (argv.includes('--compare') && !PARENT)) {
  console.error('usage: route-sizes.mjs --milestone <0..9|6a|6b> [--compare <parent build.log>] <build.log>'); process.exit(2)
}
const reached = (m) => ORDER.indexOf(M) >= ORDER.indexOf(m)
const SPEC = 'docs/redesign/spec/'

// ---- 1. printed table --------------------------------------------------------------------------------------------
const kb = (s) => { const [n, u] = s.trim().split(/\s+/); return Number(n) * (u === 'MB' ? 1024 : u === 'B' ? 1 / 1024 : 1) }
function parseLog(file) {
  const table = new Map()
  let shared = NaN
  let middleware = NaN
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const r = line.match(/^[┌├└]\s+[○ƒ●◐λ]\s+(\S+)\s+([\d.]+ (?:B|kB|MB))\s+([\d.]+ (?:B|kB|MB))\s*$/)
    if (r) table.set(r[1], { page: kb(r[2]), firstLoad: kb(r[3]) })
    const s = line.match(/^\+ First Load JS shared by all\s+([\d.]+ (?:kB|MB))/)
    if (s) shared = kb(s[1])
    const w = line.match(/^ƒ Middleware\s+([\d.]+ (?:kB|MB))/)
    if (w) middleware = kb(w[1])
  }
  if (!table.size || Number.isNaN(shared)) { console.error(`no route table found in ${file}`); process.exit(2) }
  return { table, shared, middleware }
}
const { table, shared, middleware } = parseLog(log)

// Baseline First Load JS at 845147c (goal.md §3.5).
const BASELINE = { '/admin': 348, '/admin/analytics': 197, '/admin/characters': 192, '/admin/clips': 131, '/admin/locations': 192, '/admin/recordings': 131, '/admin/shotboard': 196 }
// [route, measure, max kB, from milestone, source]. measure: 'firstLoad' or 'own' (= First Load − shared).
const TABLE_BUDGETS = [
  ['/admin', 'firstLoad', 360, '0', `${SPEC}08-live-control.md §8.10 B23; bible §10.1.9 dynamic imports`],
  ['/admin/shotboard', 'own', 93, '7', `${SPEC}09-shotboard.md §9.10`],
  ['/admin/characters', 'firstLoad', 210, '7', `${SPEC}10-characters-locations.md §10.10`],
  ['/admin/locations', 'firstLoad', 210, '7', `${SPEC}10-characters-locations.md §10.10`],
  ['/admin/clips', 'own', 45, '8', `${SPEC}11-clips-recordings-analytics-states.md §11.A.10`],
  ['/admin/recordings', 'own', 45, '8', `${SPEC}11-clips-recordings-analytics-states.md §11.B.10`],
  ['/admin/analytics', 'own', 100, '8', `${SPEC}11-clips-recordings-analytics-states.md §11.C.10`],
]
const PAGE_MILESTONE = { '/admin': '6a', '/admin/shotboard': '7', '/admin/characters': '7', '/admin/locations': '7', '/admin/clips': '8', '/admin/recordings': '8', '/admin/analytics': '8' }
/** The route's final First Load budget in kB ('own' budgets plus the shared chunks), or 0 when it has none. */
const finalCap = (route) => Math.max(0, ...TABLE_BUDGETS.filter(([r]) => r === route).map(([, m, max]) => (m === 'own' ? max + shared : max)))
const failures = []
const rows = []
const check = (label, value, max, from, source) => {
  const on = reached(from)
  const ok = !on || value <= max
  if (!ok) failures.push(`${label}: ${value.toFixed(1)} kB > ${max.toFixed(1)} kB (${source})`)
  rows.push(`${on ? (ok ? 'ok  ' : 'FAIL') : 'info'}  ${label.padEnd(46)} ${value.toFixed(1).padStart(7)} kB  ≤ ${max.toFixed(1).padStart(6)}  from M${from}  ${source}`)
}
check('shared by all', shared, 106, '0', 'framework chunks only; baseline 102–103 kB')
if (!Number.isNaN(middleware)) check('middleware', middleware, 42, '0', 'never touched; baseline 41.6–41.8 kB')
for (const [route, base] of Object.entries(BASELINE)) {
  const t = table.get(route); if (!t) { failures.push(`${route}: missing from the build table`); continue }
  if (route !== '/admin' && !reached(PAGE_MILESTONE[route])) {
    check(`${route} First Load (interim)`, t.firstLoad, Math.max(base + 12, finalCap(route)), '0', 'max(goal.md §3.5 baseline + 12 kB, final budget) until the page milestone')
  }
}
for (const [route, measure, max, from, source] of TABLE_BUDGETS) {
  const t = table.get(route); if (!t) continue
  check(`${route} ${measure === 'own' ? 'First Load − shared' : 'First Load'}`, measure === 'own' ? t.firstLoad - shared : t.firstLoad, max, from, source)
}

// ---- 2. --compare: no route grows by more than 1 kB over the parent build ----------------------------------------------
if (PARENT) {
  const parent = parseLog(PARENT)
  for (const [route, t] of table) {
    const p = parent.table.get(route); if (!p) continue
    const ok = t.firstLoad <= p.firstLoad + 1
    if (!ok) failures.push(`${route}: First Load ${t.firstLoad.toFixed(1)} kB > parent ${p.firstLoad.toFixed(1)} kB + 1 kB (--compare)`)
    rows.push(`${ok ? 'ok  ' : 'FAIL'}  ${(route + ' vs parent').padEnd(46)} ${t.firstLoad.toFixed(1).padStart(7)} kB  parent ${p.firstLoad.toFixed(1)} kB (+1 kB allowed)`)
  }
}

// ---- 3. true first-load sets from the manifest ---------------------------------------------------------------------
const manifestPath = path.join('.next', 'app-build-manifest.json')
if (!existsSync(manifestPath)) { console.error(`${manifestPath} missing: run the production build first`); process.exit(2) }
const pages = JSON.parse(readFileSync(manifestPath, 'utf8')).pages
const gz = new Map()
const size = (f) => { if (!gz.has(f)) gz.set(f, gzipSync(readFileSync(path.join('.next', f)), { level: 9 }).length / 1024); return gz.get(f) }
const text = (f) => readFileSync(path.join('.next', f), 'utf8')
const SEG_FILES = ['layout', 'template', 'loading', 'error', 'not-found']
function firstLoad(route) {            // '/admin/clips' → keys '/layout', '/admin/layout', '/admin/clips/layout', …, '/admin/clips/page'
  // The manifest keys keep route groups: from 4D, '/admin' is served by '/admin/(live)/page' (goal.md §14.10).
  const page = Object.keys(pages).find((k) => k.replace(/\/\([^/)]+\)/g, '') === `${route === '/' ? '' : route}/page`) ?? `${route}/page`
  const segs = page.split('/').filter(Boolean).slice(0, -1)
  const keys = [page]
  for (let i = 0; i <= segs.length; i++) { const base = '/' + segs.slice(0, i).join('/'); for (const f of SEG_FILES) keys.push(`${base === '/' ? '' : base}/${f}`) }
  return [...new Set(keys.flatMap((k) => pages[k] ?? []).filter((f) => f.endsWith('.js')))]
}
const sum = (files) => files.reduce((a, f) => a + size(f), 0)
check('root layout chunks (the shell), gzip -9', sum((pages['/layout'] ?? []).filter((f) => f.endsWith('.js'))), 180, '4', 'baseline 123.6 kB + motion/react 38.9 kB + 17 kB shell')
const LEAKS = [
  ['three.js', /WebGLRenderer/, { '/admin': '5', '/admin/shotboard': '5', '/admin/characters': '5', '/admin/locations': '5', '/admin/clips': '5', '/admin/recordings': '5', '/admin/analytics': '5' }],
  ['gsap', /GreenSock/, { '/admin': '5', '/admin/clips': '5', '/admin/recordings': '5', '/admin/analytics': '5', '/admin/shotboard': '7', '/admin/characters': '7', '/admin/locations': '7' }],
]
for (const route of Object.keys(PAGE_MILESTONE)) {
  const files = firstLoad(route)
  rows.push(`info  ${(route + ' true first load, gzip -9').padEnd(46)} ${sum(files).toFixed(1).padStart(7)} kB  (${files.length} chunks)`)
  for (const [lib, marker, from] of LEAKS) {
    const hit = files.filter((f) => marker.test(text(f)))
    if (hit.length && reached(from[route])) failures.push(`${route}: ${lib} in first load (${hit.join(', ')}) — must be next/dynamic (bible §10.1.9)`)
    else if (hit.length) rows.push(`info  ${route}: ${lib} still in first load (allowed until M${from[route]})`)
  }
}
console.log(rows.join('\n'))
if (failures.length) { console.error('\nroute sizes: FAIL\n' + failures.map((f) => `  ${f}`).join('\n')); process.exit(1) }
console.log('route sizes: ok')
```

`scripts/checks/appendix-a.mjs` (C7) checks every double-quoted value in Appendix A.1–A.11: visible text, accessible names, titles, placeholders, error and log text, including the configured-mode strings that `tests/preserved-contract.spec.ts` cannot reach. The Convex names (A.9) and fal endpoints (A.10) are code spans, which A.14's own greps check. It reads the chapter file `docs/redesign/spec/appendix-a-preserved-contract.md`, never `goal.md`.
- **Scope.** It searches `app components lib hooks`, plus `middleware.ts` and `convex/`. Those two are never touched (§1.4), but A.1.5's three 401 bodies live in `middleware.ts` and A.3's "Two prompt-expansion jobs are already running; try again shortly" lives in `convex/promptExpansion.ts:62`, so without them the check could not pass at 845147c.
- **Interpolated values.** A value whose source builds it from a constant is written with `{…}` in Appendix A (A.4.3: "This library item already has the {MAX_ASSET_REFERENCES}-image reference limit." and "{n}/{MAX_ASSET_REFERENCES} · drop or choose"), so its fragments are literal in `ReferenceAssetManager.tsx:49` and `:123`.
- **Measured** on 845147c minus the 11 D1 files, with Appendix A as written: 466 values and 474 fragments, 0 missing. Replacing one preserved string (for example 'Send direction' → 'Send prompt') makes it exit 1 and name the fragment; applying an A.12 change (for example L5's `COAST ORIGINALS · {n} TRACKS`) passes with `ok (A.12 L5)` under `--verbose`, and `--diff 845147c` lists the lost literal with its A.12 row.

```js
#!/usr/bin/env node
// dashboard/scripts/checks/appendix-a.mjs — the Appendix A literal check (docs/redesign/spec/15-verification-and-qa.md §15.2 C7). Run from dashboard/:
//   node scripts/checks/appendix-a.mjs [--verbose] [--diff <base>]
// It reads ../docs/redesign/spec/appendix-a-preserved-contract.md; A.1–A.14 below are that file's sections.
// 1. Takes every double-quoted value in the first cell of the A.1–A.11 table rows. A backtick code span outside a value
//    is skipped whole; inside a value it stays part of the value.
// 2. Splits each value into fragments at every {…} interpolation and every code span (the span's content is a fragment
//    of its own), HTML-unescapes them and collapses whitespace. Fragments shorter than 3 characters are ignored.
// 3. Every fragment must occur in app/, components/, lib/ or hooks/, or in the never-touched middleware.ts and convex/
//    (A.1.5's 401 bodies, A.3's backend error text). The source is normalised the same way (entities decoded, JSX {' '}
//    spacers removed, whitespace collapsed) and is also searched with JSX tags stripped (text split by inline elements).
//    A missing fragment passes only when an A.12 row lists it on its old side and either removes it or has one new
//    value whose fragments are all present.
// 4. --diff <base> also prints every fragment present at <base> and absent at HEAD (the A.14 diff mode).
// Exit 0 when nothing is missing, 1 on any miss, 2 on a usage or input error.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const argv = process.argv.slice(2)
const VERBOSE = argv.includes('--verbose')
const di = argv.indexOf('--diff')
const BASE = di >= 0 ? argv[di + 1] : null
if ((di >= 0 && !BASE) || argv.some((a, i) => a.startsWith('--') && a !== '--verbose' && a !== '--diff' && i !== di + 1)) {
  console.error('usage: appendix-a.mjs [--verbose] [--diff <base>]'); process.exit(2)
}
if (!existsSync('package.json') || !existsSync('app')) { console.error('appendix-a: run from dashboard/'); process.exit(2) }
const SPEC = path.join('..', 'docs', 'redesign', 'spec', 'appendix-a-preserved-contract.md')
if (!existsSync(SPEC)) { console.error(`appendix-a: ${SPEC} not found`); process.exit(2) }
const DIRS = ['app', 'components', 'lib', 'hooks', 'convex', 'middleware.ts']
const EXT = /\.(tsx?|jsx?|mjs|cjs|css|json)$/

// ---- normalisation (shared by the appendix values and the source) -------------------------------------------------------
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  hellip: '…', mdash: '—', ndash: '–', middot: '·', rarr: '→', larr: '←', times: '×', copy: '©' }
const unescape = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
const collapse = (s) => s.replace(/\s+/g, ' ').trim()
const normSource = (s) => collapse(unescape(s.replace(/\{\s*(['"])\s\1\s*\}/g, ' ')))
const stripTags = (s) => s.replace(/<\/?[A-Za-z][\w.]*(\s[^<>]*)?\/?>/g, '')     // JSX text split by inline elements

// ---- 1. values from the A.1–A.11 rows ---------------------------------------------------------------------------------------
const cells = (row) => row.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim())
/** Double-quoted values in one table cell. A code span outside a value is skipped whole; inside a value it is kept. */
function quoted(cell) {
  const out = []
  for (let i = 0; i < cell.length; i++) {
    if (cell[i] === '`') { const j = cell.indexOf('`', i + 1); if (j < 0) break; i = j; continue }
    if (cell[i] !== '"') continue
    let v = ''
    for (i++; i < cell.length && cell[i] !== '"'; i++) {
      if (cell[i] === '`') { const j = cell.indexOf('`', i + 1); if (j < 0) break; v += cell.slice(i, j + 1); i = j } else v += cell[i]
    }
    out.push(v)
  }
  return out
}
/** Fragments of one value: text between interpolations and code spans, plus each code span's content. */
function fragments(value) {
  const parts = []
  const rest = value.replace(/`([^`]*)`/g, (_, code) => { parts.push(code); return '\u0000' })
  for (const p of rest.split(/\{[^}]*\}|\u0000/)) parts.push(p)
  return [...new Set(parts.map((p) => collapse(unescape(p))).filter((p) => p.length >= 3))]
}

const lines = readFileSync(SPEC, 'utf8').split('\n')
const values = []   // { section, value, frags }
const a12 = []      // { id, oldFrags: Set, news: string[][], removal: boolean }
let section = null
for (const line of lines) {
  const h = line.match(/^###\s+(A\.\d+)\b/)
  if (h) { section = h[1]; continue }
  if (!section || !line.startsWith('|') || /^\|\s*:?-{3,}/.test(line)) continue
  const n = Number(section.slice(2))
  const c = cells(line)
  if (n >= 1 && n <= 11) {
    if (/^(Value|Function|Audit or chapter claim)$/i.test(c[0])) continue
    for (const v of quoted(c[0])) values.push({ section, value: v, frags: fragments(v) })
  } else if (n === 12 && c.length >= 2 && /^[A-Z]+\d+$/.test(c[0])) {
    const [oldSide, ...newParts] = c[1].split('→')
    const newSide = newParts.join('→')
    const oldFrags = new Set(quoted(oldSide).flatMap(fragments))
    const removal = /\b(removed|drops|deleted)\b/i.test(newParts.length ? newSide : oldSide)
    a12.push({ id: c[0], oldFrags, news: quoted(newSide).map(fragments), removal })
  }
}
if (!values.length) { console.error(`appendix-a: no quoted values found in ${SPEC} A.1–A.11`); process.exit(2) }

// ---- 2. the source corpus ---------------------------------------------------------------------------------------------------
function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  if (!statSync(dir).isDirectory()) { out.push(dir); return out }
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (EXT.test(e.name)) out.push(p)
  }
  return out
}
const corpus = (texts) => { const raw = texts.join('\n'); return [normSource(raw), normSource(stripTags(raw))] }
const headCorpus = corpus(DIRS.flatMap((d) => walk(d)).map((f) => readFileSync(f, 'utf8')))
function corpusAt(rev) {
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', rev, '--', ...DIRS], { encoding: 'utf8' }).split('\n').filter((f) => EXT.test(f))
  return corpus(files.map((f) => execFileSync('git', ['show', `${rev}:./${f}`], { encoding: 'utf8', maxBuffer: 64 << 20 })))
}

// ---- 3. check -----------------------------------------------------------------------------------------------------------------
const has = ([plain, untagged], f) => plain.includes(f) || untagged.includes(f)
const replaced = (f) => a12.find((r) => r.oldFrags.has(f) && (r.removal || r.news.some((nf) => nf.length && nf.every((x) => has(headCorpus, x)))))
const misses = []
let checked = 0
for (const v of values) for (const f of v.frags) {
  checked++
  if (has(headCorpus, f)) continue
  const r = replaced(f)
  if (r) { if (VERBOSE) console.log(`ok (A.12 ${r.id})  ${v.section}  ${JSON.stringify(f)}`); continue }
  misses.push(`${v.section}  ${JSON.stringify(f)}  (from "${v.value}")`)
}
console.log(`appendix A: ${values.length} values, ${checked} fragments, ${a12.length} A.12 rows, ${misses.length} missing`)
if (BASE) {
  const base = corpusAt(BASE)
  const lost = [...new Set(values.flatMap((v) => v.frags))].filter((f) => has(base, f) && !has(headCorpus, f))
  console.log(`diff ${BASE}..HEAD: ${lost.length} literal(s) present at ${BASE} and absent at HEAD`)
  for (const f of lost) { const r = replaced(f); console.log(`  lost ${JSON.stringify(f)}  ${r ? `(A.12 ${r.id})` : '(not in A.12)'}`) }
}
if (misses.length) { console.error('appendix A: MISSING\n' + misses.map((m) => `  ${m}`).join('\n')); process.exit(1) }
console.log('appendix A: ok')
```

### 15.3 Grep gates

`scripts/checks/grep-gates.sh --milestone <id>` counts each pattern over the §3.5 scope. That scope is `app/` and `components/`, minus `components/dither-kit/` and `components/reactbits/*.css`. G5 has its own scan, which includes the vendored reactbits CSS and excepts only `ChromaGrid.css` (fixture-only, not a blur), because `MorphSlider.css` blurs on Live Control (§5.10, §14.3 R7). An enforced gate fails on any count above 0. A gate that is not yet enforced prints `info`. G16 is enforced from M9, and it must already read 0 at the end of 11C (§14.14).

The script reproduces every §3.5 count except G1 (64: case-insensitive, adds `#8B5CF6`), G5 (5: reactbits CSS included, `ChromaGrid.css` excepted) and G8 (20: TrackManager excluded until M6b). The "845147c" column is what `--milestone 0` prints on 845147c. The "Post-D1 (M0 head)" column is what it prints once the 11 D1 files are gone: on the M0 head and on the 1A branch (§15.11). Both were measured.

| Gate | Pattern (ERE) | 845147c | Post-D1 (M0 head) | Enforced from | Source |
|---|---|---|---|---|---|
| G1 | `violet-\|purple-\|#a78bfa\|#7c3aed\|#8b5cf6\|#6d28d9\|#05030b\|#090713`, **case-insensitive** | 64 | 57 | M1 | bible §10.4; §5.19 step 4 |
| G2 | `fal-primary-(50\|100\|200\|300)\b\|fal-purple` | 27 | 19 | M1 | bible §10.4, with the §3.5 word-boundary fix; step 3 |
| G3 | `\bfont-(semibold\|extrabold\|black\|thin\|extralight)\b` | 34 | 27 | M2 | bible §10.4; step 1 |
| G4 | `\btext-(xs\|sm\|base\|lg\|xl\|2xl\|3xl)\b\|text-\[1[01]px\]` | 367 | 255 | M2 | §5.19 step 2 |
| G5 | `backdrop-(blur\|filter)` (own scan: reactbits CSS included, `ChromaGrid.css` excepted) | 5 | 5 | M1 | bible §10.4; §5.10; §14.3 R7 |
| G6 | `Loader2\|animate-spin\|animate-pulse` | 34 | 31 | M5 | bible §10.4; step 9 |
| G7 | `!p[xy]-` | 23 | 23 | M1 | bible §10.4; step 6 |
| G8 | `hover:[^ ]+ dark:(text\|border\|bg)-` | 20 printed (21 raw; `components/TrackManager.tsx` excluded until M6b) | 6 printed (7 raw) | M1 | bible §10.4; step 5 |
| G9 | `focus:ring\|focus:outline-none`, excluding `app/layout.tsx` | 53 | 53 | M1 | step 7. `main#content` keeps `focus:outline-none` (§7.6) |
| G10 | `\brounded(-(tl\|tr\|bl\|br\|ss\|se\|es\|ee\|[tblrse]))?-(xl\|2xl\|3xl)\b` | 19 | 19 | M1 | step 8 |
| G11 | `\bbg-(chassis\|panel\|raised\|inset)/` | 0 | 0 | M1 | §5.3 |
| G12 | `ring-inset\|frosted-glass\|@apply[^;]*\bsq\b` | 0 | 0 | M1 | §5.21 |
| G13 | `\buppercase\b` above each file's allowance | 11 | 11 | M2 | bible §10.4; §5.20.5 |
| G14 | `#[0-9a-fA-F]{3,8}\b` in `app/**/*.ts(x)`, excluding `app/global-error.tsx`, `app/manifest.ts`, `app/api/**` and the viewport `themeColor` lines of `app/layout.tsx` | 2 | 2 | M4 | §7.1, §11.D.4, §13.6.10 |
| G15 | `console\.(log\|info\|warn\|error\|debug\|trace)\(` in `app components hooks lib` (excluding `app/api/**` and the two preserved messages) | 25 (all in D1 files) | 0 | M1 | bible §10.3.4; §1.6 |
| G16 | `\bfal-(gray\|primary\|green\|yellow\|blue\|red)-` | 1200 | 690 | M9 (0 by the end of 11C, §14.14) | bible §10.4 (final phase) |

In the table, `\|` is Markdown escaping for `|`. The runnable form is this block:

```bash
# From dashboard/: the runnable form of each row above. Each line prints that row's raw count; grep-gates.sh (below)
# runs the same scans with the milestone rules (G8's TrackManager exclusion, G13's per-file allowances).
scope() { { grep -rEo "$@" app components --exclude-dir=dither-kit 2>/dev/null || true; } | { grep -vE '^components/reactbits/[^:]*\.css:' || true; }; }
scope -i -e 'violet-|purple-|#a78bfa|#7c3aed|#8b5cf6|#6d28d9|#05030b|#090713' | wc -l        # G1
scope -e 'fal-primary-(50|100|200|300)\b|fal-purple' | wc -l                                # G2
scope -e '\bfont-(semibold|extrabold|black|thin|extralight)\b' | wc -l                      # G3
scope -e '\btext-(xs|sm|base|lg|xl|2xl|3xl)\b|text-\[1[01]px\]' | wc -l                     # G4
{ grep -rEo -e 'backdrop-(blur|filter)' app components --exclude-dir=dither-kit || true; } | { grep -v '^components/reactbits/ChromaGrid\.css:' || true; } | wc -l   # G5 (own scan)
scope -e 'Loader2|animate-spin|animate-pulse' | wc -l                                       # G6
scope -e '!p[xy]-' | wc -l                                                                  # G7
scope -e 'hover:[^ ]+ dark:(text|border|bg)-' | wc -l                                       # G8 (before M6b the gate drops components/TrackManager.tsx)
scope -e 'focus:ring|focus:outline-none' | { grep -v '^app/layout\.tsx:' || true; } | wc -l  # G9
scope -e '\brounded(-(tl|tr|bl|br|ss|se|es|ee|[tblrse]))?-(xl|2xl|3xl)\b' | wc -l          # G10
scope -e '\bbg-(chassis|panel|raised|inset)/' | wc -l                                       # G11
scope -e 'ring-inset|frosted-glass|@apply[^;]*\bsq\b' | wc -l                               # G12
scope -e '\buppercase\b' | wc -l                                                            # G13 (raw; the gate subtracts each file's allowance)
{ grep -rEn --include='*.ts' --include='*.tsx' -e '#[0-9a-fA-F]{3,8}\b' app || true; } | { grep -vE '^app/(global-error\.tsx|manifest\.ts|api/)|^app/layout\.tsx:[0-9]+:.*prefers-color-scheme' || true; } | cut -d: -f3- | { grep -oE '#[0-9a-fA-F]{3,8}\b' || true; } | wc -l   # G14
{ grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -e 'console\.(log|info|warn|error|debug|trace)\(' app components hooks lib --exclude-dir=dither-kit 2>/dev/null || true; } | { grep -vE '^app/api/' || true; } | { grep -vF -e "'shotboard template picker unavailable:'" -e "'Failed to record twitch sample'" || true; } | wc -l   # G15
scope -e '\bfal-(gray|primary|green|yellow|blue|red)-' | wc -l                              # G16
```

> Note: G1 is case-insensitive because the bible's case-sensitive pattern misses `'#8B5CF6'` at `components/shotboard/CharacterPanel.tsx:10`. Codemod 4 rewrites that value with `/gi`, and its 16-replacement count already includes it. G7 is written `!p[xy]-` because GNU grep 3.8 and later warn about the bible's stray backslash in `\!`. Both forms match the same 23 sites.

**Uppercase allowlist mechanism (G13):**
- G13 reads `scripts/checks/uppercase-allowlist.txt` (§5.20.5). Each line is `<path>`, TAB, `<max>`, TAB, `<preserved string>`.
- For every file, the gate counts `\buppercase\b` occurrences in scope. Occurrences above that file's `<max>` count toward the gate. A file that is not listed has a max of 0. If the allowlist's maxima sum to more than 9 (§5.20.5), that adds 1.
- A preserved site that moves to another file moves its allowlist line in the same commit (§5.20.5).
- `node scripts/checks/uppercase.mjs` (§5.20.5) is the stricter per-file check, and it also covers `components/reactbits/*.css`. Both must pass from M2.

`scripts/checks/grep-gates.sh`:

```bash
#!/usr/bin/env bash
# dashboard/scripts/checks/grep-gates.sh — the docs/redesign/spec/15-verification-and-qa.md §15.3 grep gates. Run from dashboard/.
#
#   scripts/checks/grep-gates.sh --milestone <0|1|2|3|4|5|6a|6b|7|8|9> [--verbose]
#
# One line per gate: status (ok / FAIL / info), count, name, the milestone that enforces it.
# A gate is enforced from its milestone on and fails on any non-zero count; before that it prints "info".
# Standard scope: app/ and components/ recursively, minus components/dither-kit/ (hash-locked) and
# components/reactbits/*.css (vendored CSS), as the goal.md §3.5 baseline counts were taken. G5 has its own scan.
set -euo pipefail

usage() { echo "usage: $0 --milestone <0|1|2|3|4|5|6a|6b|7|8|9> [--verbose]" >&2; exit 2; }
MILESTONE=""; VERBOSE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --milestone) [[ $# -ge 2 ]] || usage; MILESTONE="$2"; shift 2 ;;
    --verbose) VERBOSE=1; shift ;;
    *) usage ;;
  esac
done
[[ -f package.json && -d app && -d components ]] || { echo "grep-gates: run from dashboard/" >&2; exit 2; }

ORDER=(0 1 2 3 4 5 6a 6b 7 8 9)
idx() { local i; for i in "${!ORDER[@]}"; do if [[ "${ORDER[$i]}" == "$1" ]]; then echo "$i"; return 0; fi; done; return 1; }
MILESTONE="${MILESTONE#[mM]}"
CUR=$(idx "$MILESTONE") || usage

FAILED=0
lines() { if [[ -z "$1" ]]; then echo 0; else printf '%s\n' "$1" | wc -l | tr -d ' '; fi; }

# hits ERE [extra grep flags...] → one "path:match" line per occurrence in the standard scope
hits() {
  local re="$1"; shift
  { grep -rEo "$@" -e "$re" app components --exclude-dir=dither-kit 2>/dev/null || true; } \
    | { grep -vE '^components/reactbits/[^:]*\.css:' || true; }
}

# report NAME ENFORCED_FROM COUNT DETAIL
report() {
  local name="$1" from="$2" count="$3" detail="$4" status
  if (( CUR >= $(idx "$from") )); then
    if (( count == 0 )); then status="ok  "; else status="FAIL"; FAILED=1; fi
  else
    status="info"
  fi
  printf '%s %6d  %-34s enforced from M%s\n' "$status" "$count" "$name" "$from"
  if [[ -n "$detail" ]] && [[ "$status" == "FAIL" || $VERBOSE -eq 1 ]]; then
    printf '%s\n' "$detail" | sort | uniq -c | sort -rn | head -n 30 | sed 's/^/          /'
  fi
}

gate() { # gate NAME FROM ERE [grep flags...]
  local name="$1" from="$2" re="$3"; shift 3
  local d; d=$(hits "$re" "$@")
  report "$name" "$from" "$(lines "$d")" "$d"
}

echo "grep gates · milestone M${ORDER[$CUR]}"

# G1 violet and stray dark hexes. Case-insensitive: the bible's case-sensitive form misses '#8B5CF6'
#    (components/shotboard/CharacterPanel.tsx:10 at 845147c), which codemod 4 rewrites with /gi.
gate "G1 violet / stray hex"            1  'violet-|purple-|#a78bfa|#7c3aed|#8b5cf6|#6d28d9|#05030b|#090713' -i
# G2 undefined shades. \b is required: without it every fal-primary-500 matches (goal.md §3.5 Note).
gate "G2 undefined fal shades"          1  'fal-primary-(50|100|200|300)\b|fal-purple'
gate "G3 banned weights"                2  '\bfont-(semibold|extrabold|black|thin|extralight)\b'
gate "G4 legacy text sizes"             2  '\btext-(xs|sm|base|lg|xl|2xl|3xl)\b|text-\[1[01]px\]'

# G5 backdrop filters, with its own scan: vendored reactbits CSS is included (MorphSlider.css blurs on Live Control);
#    only ChromaGrid.css (fixture-only, not a blur) is excepted.
d=$( { grep -rEo -e 'backdrop-(blur|filter)' app components --exclude-dir=dither-kit || true; } | { grep -v '^components/reactbits/ChromaGrid\.css:' || true; })
report "G5 backdrop filters" 1 "$(lines "$d")" "$d"

gate "G6 spinners and pulses"           5  'Loader2|animate-spin|animate-pulse'
gate "G7 !important padding"            1  '!p[xy]-'

# G8 hover/dark pairs. TrackManager.tsx:157 is a regex false positive until the Audio deck lands (M6b).
d=$(hits 'hover:[^ ]+ dark:(text|border|bg)-')
if (( CUR < $(idx 6b) )); then d=$(printf '%s\n' "$d" | { grep -v '^components/TrackManager\.tsx:' || true; }); fi
report "G8 hover:X dark:Y pairs" 1 "$(lines "$d")" "$d"

# G9 focus-ring utilities (codemod 7). app/layout.tsx is excluded: main#content is a non-interactive skip target.
d=$(hits 'focus:ring|focus:outline-none' | { grep -v '^app/layout\.tsx:' || true; })
report "G9 focus:ring / focus:outline-none" 1 "$(lines "$d")" "$d"

gate "G10 legacy radii"                 1  '\brounded(-(tl|tr|bl|br|ss|se|es|ee|[tblrse]))?-(xl|2xl|3xl)\b'
gate "G11 alpha on surface colours"     1  '\bbg-(chassis|panel|raised|inset)/'
gate "G12 banned utilities"             1  'ring-inset|frosted-glass|@apply[^;]*\bsq\b'

# G13 uppercase outside scripts/checks/uppercase-allowlist.txt (TAB-separated "<path> <max> <string>", total <= 9).
#     The count is the number of occurrences above each file's allowance (+1 if the allowlist total exceeds 9).
d=$(hits '\buppercase\b' | cut -d: -f1 | sort | uniq -c | awk -v list="scripts/checks/uppercase-allowlist.txt" '
  BEGIN { while ((getline line < list) > 0) { if (line ~ /^#/ || line == "") continue; split(line, f, "\t"); allow[f[1]] = f[2] + 0; total += f[2] }
          if (total > 9) print "1 allowlist total " total " > 9" }
  { a = ($2 in allow) ? allow[$2] : 0; if ($1 > a) print ($1 - a) " " $2 ": " $1 " uppercase, allowed " a }')
n=0; if [[ -n "$d" ]]; then n=$(printf '%s\n' "$d" | awk '{ s += $1 } END { print s + 0 }'); fi
report "G13 uppercase outside allowlist" 2 "$n" "$d"

# G14 hex literals in app/ TypeScript. Allowed: app/global-error.tsx (it has no stylesheet), app/manifest.ts
#     (web-manifest colours) and the two viewport themeColor lines in app/layout.tsx.
HEX='#[0-9a-fA-F]{3,8}\b'
d=$({ grep -rEn --include='*.ts' --include='*.tsx' -e "$HEX" app 2>/dev/null || true; } \
  | { grep -vE '^app/(global-error\.tsx|manifest\.ts):' || true; } \
  | { grep -vE '^app/layout\.tsx:[0-9]+:.*prefers-color-scheme' || true; } \
  | { grep -vE '^app/api/' || true; })
n=0; if [[ -n "$d" ]]; then n=$(printf '%s\n' "$d" | cut -d: -f3- | { grep -oE "$HEX" || true; } | wc -l | tr -d ' '); fi
report "G14 hex literals in app/*.ts(x)" 4 "$n" "$(printf '%s\n' "$d" | cut -d: -f1,2)"

# G15 console calls in app code. Allowed: app/api/** (never touched) and the two preserved messages
#     'shotboard template picker unavailable:' and 'Failed to record twitch sample', wherever they live.
d=$({ grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -e 'console\.(log|info|warn|error|debug|trace)\(' \
      app components hooks lib --exclude-dir=dither-kit 2>/dev/null || true; } \
  | { grep -vE '^app/api/' || true; } \
  | { grep -vF "'shotboard template picker unavailable:'" || true; } \
  | { grep -vF "'Failed to record twitch sample'" || true; })
report "G15 console.* in app code" 1 "$(lines "$d")" "$(printf '%s\n' "$d" | cut -d: -f1,2)"

# G16 legacy fal-* palette classes. Codemod 10 empties it page by page (M6–M8, 0 after 11C); M9 sweep then deletes
#     the deprecated aliases from tailwind.config.js.
gate "G16 legacy fal-* classes"         9  '\bfal-(gray|primary|green|yellow|blue|red)-'

if [[ $FAILED -eq 1 ]]; then echo "grep gates: FAIL"; exit 1; fi
echo "grep gates: ok"
```

### 15.4 Playwright configuration and shared helpers

**Conventions every spec follows:**
- **Navigation:** always use `gotoRoute(page, path)`. It adds `?noboot`, so the boot's gate 4 skips the overlay (§6.2.4). `navigator.webdriver` alone would also skip it; the parameter makes the intent explicit. Then it waits for network idle, fonts, the carrier's first frame (from M3) and 1 s for StrictMode's double effects (§1.6 pitfalls).
- **Theme:** the `theme` project option writes `localStorage.theme` once, when the context is created, through `storageState`. A test that toggles the theme and reloads therefore keeps its choice.
- **Console:** use the `consoleEntries` fixture and `checkConsole()`, which encodes the §1.6 table. The only harness-noise rule is next dev's `[Fast Refresh] rebuilding` / `done in Nms` after an on-demand compile. Warm-up compiles every page first, but API routes still compile on first use.
- **Screenshots:**
  - Regression comparisons use `tests/screenshot.css` as `stylePath`. It hides the carrier canvas, the next dev indicator, the StatusRail clock and the MorphSlider art.
  - `visual.spec.ts` also installs Playwright's fake clock before navigation and pauses it after settling. That freezes rAF, timers and clocks, so two captures are identical.
  - Never use `mask` on the carrier (§14.3 R11).
  - Never install the fake clock on a page that has started a Director session. Measured on 845147c: after a failed start, the SDK's timers spin under the fake clock, and screenshots time out.
- **Milestone gating:** `since('<m>')` at the start of a test. `reached('<m>')` chooses between old and new expectations.
- **`role="alert"`:** Next's route announcer is also `role="alert"` (measured: `getByRole('alert')` returns an empty announcer on `/admin`). Always scope alerts. Live Control's AlertTray carries the role itself (`<div data-testid="lc-alert-tray" role="alert">`, §8.4), so its selector is `[data-testid="lc-alert-tray"][role="alert"]`.
- **'Start Director':** every test that clicks it first stubs the fal proxy, so no request can reach fal and every run fails the same way: `await page.route('**/api/fal/**', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"qa-stub"}' }))`. The servers never have `FAL_KEY` either (§1.6), and Devin never runs a live Director session (§1.8 item 3).
- **No `.env.local`:** `tests/global-setup.ts` throws when `dashboard/.env.local` exists (§1.6 step 0), because `next dev` and `next start` would load it.
- **Test hook added by the app:** the StatusRail clock renders as `<time data-testid="status-clock">` (M4, §14.10).

`playwright.config.ts`:

```ts
// dashboard/playwright.config.ts — the docs/redesign/spec/15-verification-and-qa.md §15 harness. Chromium only, one worker, unconfigured servers only (goal.md §1.6).
import { defineConfig } from '@playwright/test'
import type { TestOptions } from './tests/helpers/test'

const PROD = process.env.WZRD_PROD === '1'
const DEV_PORT = Number(process.env.WZRD_DEV_PORT ?? 3107)
const PROD_PORT = Number(process.env.WZRD_PROD_PORT ?? 3109)
const REUSE = process.env.WZRD_REUSE_SERVER === '1' // only for a server you started yourself with the same env -u list
// goal.md §1.6 step 2: every configuration variable is removed from the server process.
const UNSET = 'env -u FAL_KEY -u NEXT_PUBLIC_CONVEX_URL -u TWITCH_CLIENT_ID -u TWITCH_CLIENT_SECRET -u TWITCH_CHANNEL' +
  ' -u NEXT_PUBLIC_TWITCH_CHANNEL -u NEXT_PUBLIC_TWITCH_CLIENT_ID -u NEXT_PUBLIC_FAL_API_URL -u CF_ACCESS_TEAM_DOMAIN -u CF_ACCESS_AUD -u ADMIN_AUTH_MODE'

const desktop = { width: 1440, height: 900 }
const NOT_DEV = /(boot|lcp)\.spec\.ts$/
const SELF_THEMED = /(contrast|canvas-audit|perf|live-extraction|whip-truth|reduced-media)\.spec\.ts$/

export default defineConfig<TestOptions>({
  testDir: './tests',
  outputDir: './test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  forbidOnly: true,
  globalSetup: './tests/global-setup.ts',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide', scale: 'css', stylePath: './tests/screenshot.css' },
  },
  use: {
    baseURL: `http://localhost:${PROD ? PROD_PORT : DEV_PORT}`,
    browserName: 'chromium',
    locale: 'en-US',
    timezoneId: 'UTC',
    deviceScaleFactor: 1,
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
    trace: 'retain-on-failure',
  },
  webServer: PROD
    ? { // requires `npm run qa:build` first (docs/redesign/spec/15-verification-and-qa.md §15.2); never run while `next dev` shares .next/
        command: `${UNSET} ADMIN_AUTH_MODE=edge-only NEXT_TELEMETRY_DISABLED=1 npx next start -p ${PROD_PORT}`,
        url: `http://localhost:${PROD_PORT}/admin?noboot`, reuseExistingServer: REUSE, timeout: 120_000 }
    : { command: `${UNSET} NEXT_TELEMETRY_DISABLED=1 npx next dev -p ${DEV_PORT}`,
        url: `http://localhost:${DEV_PORT}/admin?noboot`, reuseExistingServer: REUSE, timeout: 180_000 },
  projects: PROD
    ? [
        { name: 'prod', testMatch: [NOT_DEV, /routes\.spec\.ts$/], use: { viewport: desktop, theme: 'dark', colorScheme: 'dark' } },
      ]
    : [
        { name: 'unit', testMatch: /unit\/.*\.spec\.tsx?$/ },
        { name: 'desktop-dark', testIgnore: [/unit\//, NOT_DEV, /reduced-media\.spec\.ts$/], use: { viewport: desktop, theme: 'dark', colorScheme: 'dark' } },
        { name: 'desktop-light', testIgnore: [/unit\//, NOT_DEV, SELF_THEMED], use: { viewport: desktop, theme: 'light', colorScheme: 'light' } },
        { name: 'laptop', testMatch: /(routes|visual|preserved-contract|live-control)\.spec\.ts$/, use: { viewport: { width: 1280, height: 800 }, theme: 'dark', colorScheme: 'dark' } },
        { name: 'mobile', testMatch: /(routes|visual|a11y|preserved-contract|live-control)\.spec\.ts$/, use: { viewport: { width: 390, height: 844 }, theme: 'dark', colorScheme: 'dark' } },
        { name: 'reduced-motion', testMatch: /(canvas-audit|reduced-media)\.spec\.ts$/, use: { viewport: desktop, theme: 'dark', colorScheme: 'dark', contextOptions: { reducedMotion: 'reduce' } } },
      ],
})
```

`tests/helpers/env.ts`:

```ts
// dashboard/tests/helpers/env.ts — which milestone the branch has reached (goal.md §14). Gates switch on from their milestone.
import { test } from '@playwright/test'

export const MILESTONES = ['0', '1', '2', '3', '4', '5', '6a', '6b', '7', '8', '9'] as const
export type Milestone = (typeof MILESTONES)[number]

const raw = (process.env.WZRD_MILESTONE ?? '9').toLowerCase().replace(/^m/, '')
if (!(MILESTONES as readonly string[]).includes(raw)) {
  throw new Error(`WZRD_MILESTONE must be one of ${MILESTONES.join(', ')} (got "${process.env.WZRD_MILESTONE}")`)
}
export const MILESTONE = raw as Milestone

/** True when the branch has reached milestone `m` (M6a < M6b). */
export const reached = (m: Milestone): boolean => MILESTONES.indexOf(MILESTONE) >= MILESTONES.indexOf(m)

/** Skip the current test (or describe block) until milestone `m`. */
export function since(m: Milestone): void {
  test.skip(!reached(m), `enforced from M${m} (WZRD_MILESTONE=${MILESTONE})`)
}

/** Fixed wall clock for deterministic screenshots. The fixture data keeps its own FIXTURE_NOW (docs/redesign/spec/10-characters-locations.md §10.5.9). */
export const FIXED_NOW = new Date(Date.UTC(2026, 8, 24, 21, 4, 12))
```

`tests/helpers/test.ts`:

```ts
// dashboard/tests/helpers/test.ts — the project-wide `test`: theme option, console capture.
import { test as base, expect } from '@playwright/test'

export type Theme = 'dark' | 'light'
export type TestOptions = { theme: Theme }
export type ConsoleEntry = { type: string; text: string; url: string }

export const test = base.extend<TestOptions & { consoleEntries: ConsoleEntry[] }>({
  theme: ['dark', { option: true }],
  // The theme is written once, at context creation, so tests that toggle it and reload keep their choice.
  storageState: async ({ theme, baseURL }, use) => {
    await use({ cookies: [], origins: [{ origin: new URL(baseURL ?? 'http://localhost:3107').origin, localStorage: [{ name: 'theme', value: theme }] }] })
  },
  consoleEntries: async ({ page }, use) => {
    const entries: ConsoleEntry[] = []
    page.on('console', (m) => entries.push({ type: m.type(), text: m.text(), url: page.url() }))
    page.on('pageerror', (e) => entries.push({ type: 'pageerror', text: String(e?.message ?? e), url: page.url() }))
    await use(entries)
  },
})

export { expect }
```

`tests/helpers/routes.ts`:

```ts
// dashboard/tests/helpers/routes.ts — the 8 admin routes, their headings and the milestone that redesigns each (goal.md §14).
import type { Page, Response } from '@playwright/test'
import { reached, type Milestone } from './env'

export type Route = {
  path: string
  slug: string            // file-name form: '/admin/shotboard' → 'admin_shotboard' (same as docs/redesign/baseline/)
  title: string           // metadata.title from M4 (docs/redesign/spec/07-primitives-and-shell.md §7.7)
  h1: string              // the route's only h1 (an interim sr-only h1 with the same text until the page milestone, goal.md §14.3 R4)
  h1From?: Milestone      // default '4'; characters and locations get their h1 with their page (R4)
  page: Milestone         // milestone whose PR redesigns the route (full-page axe and page specs switch on here)
  devOnly?: boolean       // notFound() in production
}

export const ROUTES: Route[] = [
  { path: '/admin', slug: 'admin', title: 'Live Control', h1: 'Live Control', page: '6b' },
  { path: '/admin/shotboard', slug: 'admin_shotboard', title: 'Shotboard', h1: 'Shotboard', page: '7' },
  { path: '/admin/characters', slug: 'admin_characters', title: 'Characters', h1: 'Characters with a stable identity', h1From: '7', page: '7' },
  { path: '/admin/locations', slug: 'admin_locations', title: 'Locations', h1: 'Locations that hold their atmosphere', h1From: '7', page: '7' },
  { path: '/admin/clips', slug: 'admin_clips', title: 'Clips', h1: 'Clips', page: '8' },
  { path: '/admin/recordings', slug: 'admin_recordings', title: 'Recordings', h1: 'Recordings', page: '8' },
  { path: '/admin/analytics', slug: 'admin_analytics', title: 'Twitch Analytics', h1: 'Twitch Analytics', page: '8' },
  { path: '/admin/visual-test', slug: 'admin_visual-test', title: 'Visual test', h1: 'Characters with a stable identity', page: '7', devOnly: true },
]

export const NOT_FOUND: Route = {
  path: '/admin/does-not-exist', slug: 'admin_does-not-exist', title: 'Not found', h1: 'No signal on this channel', page: '4',
}

export type Boot = 'skip' | 'post' | 'flip' | 'auto' | 'none'
const BOOT_PARAM: Record<Boot, string | null> = { skip: 'noboot', post: 'boot=1', flip: 'boot=flip', auto: 'boot=auto', none: null }

export function url(path: string, boot: Boot = 'skip'): string {
  const p = BOOT_PARAM[boot]
  if (!p) return path
  const [base, hash] = path.split('#')
  return `${base}${base.includes('?') ? '&' : '?'}${p}${hash ? `#${hash}` : ''}`
}

/** Navigate and wait until the page is quiet: network idle, fonts, the carrier's first frame (M3+), StrictMode's double effects. */
export async function gotoRoute(page: Page, path: string, boot: Boot = 'skip'): Promise<Response | null> {
  const res = await page.goto(url(path, boot), { waitUntil: 'domcontentloaded' })
  await settle(page)
  return res
}

export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  if (reached('3')) {
    await page.waitForFunction(() => Boolean((window as unknown as { __wzrdDitherReady?: unknown }).__wzrdDitherReady), undefined, { timeout: 15_000 })
  }
  await page.waitForTimeout(1_000)
}
```

`tests/helpers/console.ts` (the §1.6 table; `fixture-hosts` ends when 10F makes every fixture image same-origin):

```ts
// dashboard/tests/helpers/console.ts — the goal.md §1.6 allowed-console table as data. Anything else is a regression.
import { expect } from '@playwright/test'
import { reached, type Milestone } from './env'
import type { ConsoleEntry } from './test'

type Rule = { id: string; type: RegExp; text: RegExp; max: number; route?: RegExp; until?: Milestone; prodOnly?: boolean }
const PROD = process.env.WZRD_PROD === '1'

export const ALLOWED: Rule[] = [
  { id: 'react-devtools', type: /^info$/, text: /Download the React DevTools for a better development experience/, max: 1 },
  { id: 'password-field', type: /^(debug|verbose)$/, text: /\[DOM\] Password field is not contained in a form/, max: 1, route: /^\/admin$/ },
  { id: 'twitch-503', type: /^error$/, text: /Failed to load resource: the server responded with a status of 503/, max: 1, route: /^\/admin\/analytics$/ },
  { id: 'fixture-hosts', type: /^error$/, text: /Failed to load resource: net::ERR_(TUNNEL_CONNECTION_FAILED|NAME_NOT_RESOLVED|CONNECTION_REFUSED)/, max: 40, route: /^\/admin\/visual-test$/, until: '7' },
  { id: 'not-found-doc', type: /^error$/, text: /Failed to load resource: the server responded with a status of 404/, max: 1, route: /does-not-exist/ },
  { id: 'visual-test-prod-404', type: /^error$/, text: /Failed to load resource: the server responded with a status of 404/, max: 1, route: /^\/admin\/visual-test$/, prodOnly: true },
  // Harness noise: next dev's HMR after an on-demand compile. Never app output.
  { id: 'fast-refresh', type: /^log$/, text: /^\[Fast Refresh\] (rebuilding|done in \d+ms)$/, max: 6 },
]

/** Classify every entry; fail on an unknown entry, an entry over its max, or any pageerror. Returns the PR table rows. */
export function checkConsole(entries: ConsoleEntry[], routePath: string): string[] {
  const counts = new Map<string, number>()
  const unknown: ConsoleEntry[] = []
  for (const e of entries) {
    const rule = ALLOWED.find((r) => r.type.test(e.type) && r.text.test(e.text) && (!r.route || r.route.test(routePath)) && (!r.until || !reached(r.until)) && (!r.prodOnly || PROD))
    if (!rule || e.type === 'pageerror') { unknown.push(e); continue }
    counts.set(rule.id, (counts.get(rule.id) ?? 0) + 1)
  }
  const over = ALLOWED.filter((r) => (counts.get(r.id) ?? 0) > r.max).map((r) => `${r.id} ×${counts.get(r.id)} > ${r.max}`)
  const rows = [...counts].map(([id, n]) => `${routePath} → ${id} ×${n}`)
  expect(unknown.map((e) => `${e.type}: ${e.text.slice(0, 200)}`), `unexpected console output on ${routePath}`).toEqual([])
  expect(over, `console entries over their allowance on ${routePath}`).toEqual([])
  return rows.length ? rows : [`${routePath} → (none)`]
}
```

`tests/global-setup.ts`:

```ts
// dashboard/tests/global-setup.ts — refuse to run with a .env.local, then compile every route once so on-demand dev
// compiles never land inside a test.
import fs from 'node:fs'
import path from 'node:path'
import type { FullConfig } from '@playwright/test'
import { NOT_FOUND, ROUTES, url } from './helpers/routes'

export default async function globalSetup(config: FullConfig): Promise<void> {
  // next dev / next start load dashboard/.env.local into the server, and the goal.md §1.6 step 2 check cannot see it.
  if (fs.existsSync(path.join(__dirname, '..', '.env.local'))) {
    throw new Error('dashboard/.env.local exists: delete it before any QA run (goal.md §1.6 step 0)')
  }
  const base = config.projects[0]?.use?.baseURL
  if (!base) throw new Error('baseURL missing')
  const prod = process.env.WZRD_PROD === '1'
  for (const r of [...ROUTES, NOT_FOUND]) {
    const expected = r === NOT_FOUND || (prod && r.devOnly) ? 404 : 200
    const res = await fetch(new URL(url(r.path), base), { signal: AbortSignal.timeout(180_000) })
    if (res.status !== expected) throw new Error(`warm-up ${r.path}: HTTP ${res.status}, expected ${expected}`)
  }
}
```

`tests/screenshot.css`:

```css
/* dashboard/tests/screenshot.css — applied only while Playwright compares regression snapshots (docs/redesign/spec/15-verification-and-qa.md §15.4).
   It hides what changes on its own between two identical renders; it never hides UI under test. */
body > div.fixed.-z-10 canvas { visibility: hidden !important; } /* carrier frame (time-based wave); the host, veil and fallback stay */
nextjs-portal { display: none !important; }                      /* next dev indicator ("N" badge) */
[data-testid="status-clock"] { visibility: hidden !important; }  /* StatusRail HH:MM:SS (M4+) */
.morph-slider-stage canvas { visibility: hidden !important; }   /* MorphSlider art: loops every frame until the M5 render-on-demand patch */
```

`tests/helpers/probes.ts`:
- It counts only WebGL contexts whose canvas is still connected and not lost. StrictMode's first, disposed mount therefore never counts. Measured on 845147c: two `webgl2` contexts were created, and one was live.
- The rAF patch records each caller's stack frame. In next dev, frames read like `webpack-internal:///(app-pages-browser)/./components/reactbits/Dither.jsx`. Measured on 845147c under reduced motion: Dither.jsx was the only caller, with 17 calls in 2 s. Next's dev runtime requests no frames while idle.

```ts
// dashboard/tests/helpers/probes.ts — in-page instruments installed with addInitScript (before any app script runs).
import type { Page } from '@playwright/test'

export type QA = {
  gl: WebGLRenderingContext[]          // every WebGL context ever created on this document
  rafArmed: boolean
  raf: string[]                        // one caller line per requestAnimationFrame call while armed
  ditherReady: number                  // 'wzrd:dither-ready' events seen
  cls: number                          // sum of layout-shift values without recent input
  lcp: number                          // latest largest-contentful-paint startTime (ms)
  longTasks: { start: number; duration: number }[]
}

/** WebGL context tracking, rAF caller capture, layout shift, LCP and long tasks. */
export function installProbes(page: Page): Promise<void> {
  return page.addInitScript(() => {
    const qa: QA = { gl: [], rafArmed: false, raf: [], ditherReady: 0, cls: 0, lcp: 0, longTasks: [] }
    ;(window as unknown as { __qa: QA }).__qa = qa
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (getContext as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest)
      if (ctx && /webgl/.test(type) && !qa.gl.includes(ctx as WebGLRenderingContext)) qa.gl.push(ctx as WebGLRenderingContext)
      return ctx
    } as typeof getContext
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
      if (qa.rafArmed) qa.raf.push((new Error().stack ?? '').split('\n').slice(2, 3).join('').trim())
      return raf(cb)
    }
    addEventListener('wzrd:dither-ready', () => { qa.ditherReady++ })
    const observe = (type: string, fn: (e: PerformanceEntry) => void) => {
      try { new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true }) } catch { /* unsupported entry type */ }
    }
    observe('layout-shift', (e) => { const s = e as PerformanceEntry & { value: number; hadRecentInput: boolean }; if (!s.hadRecentInput) qa.cls += s.value })
    observe('largest-contentful-paint', (e) => { qa.lcp = e.startTime })
    observe('longtask', (e) => { qa.longTasks.push({ start: e.startTime, duration: e.duration }) })
  })
}

/** WebGL contexts whose canvas is still in the document and not lost (StrictMode's disposed first mount does not count). */
export const liveWebGL = (page: Page): Promise<number> =>
  page.evaluate(() => (window as unknown as { __qa: QA }).__qa.gl
    .filter((c) => c.canvas instanceof HTMLCanvasElement && c.canvas.isConnected && !c.isContextLost()).length)

/** Count requestAnimationFrame calls for `ms`, grouped by the calling frame. */
export async function rafCallers(page: Page, ms: number): Promise<Record<string, number>> {
  await page.evaluate(() => { const q = (window as unknown as { __qa: QA }).__qa; q.raf = []; q.rafArmed = true })
  await page.waitForTimeout(ms)
  const lines = await page.evaluate(() => { const q = (window as unknown as { __qa: QA }).__qa; q.rafArmed = false; return q.raf })
  const out: Record<string, number> = {}
  for (const l of lines) { const k = l.replace(/\?[^\s)]*/g, ''); out[k] = (out[k] ?? 0) + 1 }
  return out
}

export const qa = (page: Page): Promise<Omit<QA, 'gl'>> =>
  page.evaluate(() => { const { gl: _gl, ...rest } = (window as unknown as { __qa: QA }).__qa; return rest })
```

`tests/helpers/react-commits.ts` (§15.6):

```ts
// dashboard/tests/helpers/react-commits.ts — the React Profiler commit-count method (docs/redesign/spec/15-verification-and-qa.md §15.6).
// A minimal React DevTools hook: react-dom 18.3 calls onCommitFiberRoot on every commit. For each commit it records which
// named components performed work (PerformedWork flag, 0b1), descending only into subtrees whose child pointer changed —
// the same rule React DevTools uses — so bailed-out subtrees never count. Development builds keep component names.
// Side effect: React's "Download the React DevTools" console message disappears, so never combine with console checks.
import type { Page } from '@playwright/test'

export type Commit = { t: number; rendered: Record<string, number> }

export function installCommitProbe(page: Page): Promise<void> {
  return page.addInitScript(() => {
    type Fiber = { tag: number; type: unknown; flags: number; child: Fiber | null; sibling: Fiber | null; alternate: Fiber | null }
    const commits: Commit[] = []
    const TAGS = new Set([0, 1, 11, 14, 15]) // Function, Class, ForwardRef, Memo, SimpleMemo
    const nameOf = (t: unknown): string | null => {
      if (!t || typeof t === 'string') return null
      const o = t as { displayName?: string; name?: string; render?: { displayName?: string; name?: string }; type?: { displayName?: string; name?: string } }
      return o.displayName || o.name || o.render?.displayName || o.render?.name || o.type?.displayName || o.type?.name || null
    }
    const walk = (next: Fiber, prev: Fiber | null, out: Record<string, number>) => {
      if (TAGS.has(next.tag)) { const n = nameOf(next.type); if (n && (!prev || (next.flags & 1) === 1)) out[n] = (out[n] ?? 0) + 1 }
      if (prev && next.child === prev.child) return
      for (let c = next.child; c; c = c.sibling) walk(c, prev ? c.alternate : null, out)
    }
    ;(window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown }).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true, isDisabled: false, renderers: new Map(),
      inject: () => 1, checkDCE: () => undefined, onScheduleFiberRoot: () => undefined,
      onCommitFiberUnmount: () => undefined, onPostCommitFiberRoot: () => undefined,
      onCommitFiberRoot: (_id: number, root: { current: Fiber }) => {
        const rendered: Record<string, number> = {}
        try { walk(root.current, root.current.alternate, rendered) } catch { rendered.__walkError = 1 }
        commits.push({ t: performance.now(), rendered })
      },
    }
    ;(window as unknown as { __qaCommits: Commit[] }).__qaCommits = commits
  })
}

/** Commits recorded while `during` runs, and how often each named component rendered across them. */
export async function commitsDuring(page: Page, during: () => Promise<void>): Promise<{ commits: number; rendered: Record<string, number> }> {
  const start = await page.evaluate(() => (window as unknown as { __qaCommits: Commit[] }).__qaCommits.length)
  await during()
  const slice = await page.evaluate((s) => (window as unknown as { __qaCommits: Commit[] }).__qaCommits.slice(s), start)
  const rendered: Record<string, number> = {}
  for (const c of slice) for (const [k, v] of Object.entries(c.rendered)) rendered[k] = (rendered[k] ?? 0) + v
  return { commits: slice.length, rendered }
}
```

`tests/helpers/media.ts` (§15.7):

```ts
// dashboard/tests/helpers/media.ts — user-preference emulation. Playwright covers reduced motion and contrast;
// prefers-reduced-transparency has no Playwright option, so it goes through CDP Emulation.setEmulatedMedia.
// Verified on Chromium 1194: the CDP override survives navigations and later page.emulateMedia calls, but it is
// cleared when its CDP session detaches — so the session is kept for the page's lifetime.
import type { CDPSession, Page } from '@playwright/test'

export type Prefs = { reducedMotion?: 'reduce' | 'no-preference'; contrast?: 'more' | 'no-preference'; reducedTransparency?: 'reduce' | 'no-preference' }

const sessions = new WeakMap<Page, CDPSession>()

/** Only the keys present in `p` change; the project's own emulation (e.g. reducedMotion) is otherwise kept. */
export async function emulatePrefs(page: Page, p: Prefs): Promise<void> {
  const media: { reducedMotion?: Prefs['reducedMotion']; contrast?: Prefs['contrast'] } = {}
  if (p.reducedMotion) media.reducedMotion = p.reducedMotion
  if (p.contrast) media.contrast = p.contrast
  if (Object.keys(media).length) await page.emulateMedia(media)
  if (p.reducedTransparency) {
    let cdp = sessions.get(page)
    if (!cdp) { cdp = await page.context().newCDPSession(page); sessions.set(page, cdp) }
    const value = p.reducedTransparency === 'reduce' ? 'reduce' : ''
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value }] })
  }
}

export const matches = (page: Page, query: string): Promise<boolean> => page.evaluate((q) => matchMedia(q).matches, query)
```

`tests/helpers/pw-jsx.ts`, for unit specs that render app components (§14.3's note):

```ts
// dashboard/tests/helpers/pw-jsx.ts — render app components in runner-only (unit) specs.
// @playwright/test compiles every .tsx it loads with its component-testing JSX runtime (babel automatic runtime,
// importSource "playwright"), so app components return { __pw_type: 'jsx' } descriptors instead of React elements and
// react-dom/server throws "Objects are not valid as a React child". `component()` converts them on the fly.
import { createElement, type ComponentType, type ReactNode } from 'react'

type PwNode = { __pw_type: 'jsx'; type: unknown; props: Record<string, unknown>; key?: string | null }
const wrapped = new WeakMap<object, ComponentType<Record<string, unknown>>>()

function toReact(node: unknown): ReactNode {
  if (Array.isArray(node)) return node.map(toReact)
  if (!node || typeof node !== 'object' || (node as PwNode).__pw_type !== 'jsx') return node as ReactNode
  const { type, props, key } = node as PwNode
  const { children, ...rest } = props ?? {}
  const t = typeof type === 'function' ? component(type as ComponentType<Record<string, unknown>>) : type
  return createElement(t as string, { ...rest, key: key ?? undefined }, toReact(children))
}

/** Wrap an app component imported into a unit spec so it renders real React elements. */
export function component<P>(fn: ComponentType<P>): ComponentType<P> {
  const f = fn as unknown as ComponentType<Record<string, unknown>>
  if (!wrapped.has(f)) wrapped.set(f, (p: Record<string, unknown>) => toReact((f as (q: Record<string, unknown>) => unknown)(p)) as never)
  return wrapped.get(f) as unknown as ComponentType<P>
}
```

### 15.5 Core specs

`tests/routes.spec.ts`:
- Every route loads (production: `/admin/visual-test` returns 404), and the console stays within §1.6.
- From M4: one h1 per §14.3 R4, the landmarks, the titles, the skip link, and no horizontal page scroll.

```ts
// dashboard/tests/routes.spec.ts — every route loads, has one h1 and the shell landmarks, and a console inside goal.md §1.6.
import { test, expect } from './helpers/test'
import { NOT_FOUND, ROUTES, gotoRoute } from './helpers/routes'
import { reached, since } from './helpers/env'
import { checkConsole } from './helpers/console'

const PROD = process.env.WZRD_PROD === '1'

for (const r of ROUTES) {
  test.describe(r.path, () => {
    test('loads with HTTP 200 and an allowed console', async ({ page, consoleEntries }, info) => {
      const res = await gotoRoute(page, r.path)
      expect(res?.status()).toBe(PROD && r.devOnly ? 404 : 200)
      const rows = checkConsole(consoleEntries, r.path)
      await info.attach('console', { body: rows.join('\n'), contentType: 'text/plain' })
    })

    test('headings', async ({ page }) => {
      test.skip(PROD && Boolean(r.devOnly), 'dev-only route')
      since('4') // before M4 the legacy 'Stream Admin' h1 is the only heading; preserved-contract covers its text
      await gotoRoute(page, r.path)
      const h1 = page.locator('h1')
      if (!reached(r.h1From ?? '4')) { expect(await h1.count()).toBeLessThanOrEqual(1); return }
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(r.h1)
    })

    test('shell landmarks and title', async ({ page }) => {
      test.skip(PROD && Boolean(r.devOnly), 'dev-only route')
      since('4')
      await gotoRoute(page, r.path)
      await expect(page.getByRole('banner')).toHaveCount(1)
      await expect(page.getByRole('navigation', { name: 'Admin sections', exact: true })).toHaveCount(1)
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.locator('main#content')).toHaveCount(1)
      await expect(page.getByRole('contentinfo')).toHaveCount(1)
      await expect(page).toHaveTitle(`${r.title} · stream.wzrd.tech admin`)
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toHaveText('Skip to content')
    })

    test('no horizontal page scroll', async ({ page }) => {
      test.skip(PROD && Boolean(r.devOnly), 'dev-only route')
      since('4')
      await gotoRoute(page, r.path)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  })
}

test.describe('404', () => {
  test('unknown admin URL returns 404 with an allowed console', async ({ page, consoleEntries }) => {
    const res = await gotoRoute(page, NOT_FOUND.path)
    expect(res?.status()).toBe(404)
    checkConsole(consoleEntries, NOT_FOUND.path)
  })

  test('the CH 404 slate renders inside the shell', async ({ page }) => {
    since('4')
    await gotoRoute(page, NOT_FOUND.path)
    await expect(page.locator('h1')).toHaveText(NOT_FOUND.h1)
    await expect(page.getByRole('link', { name: 'Back to Live Control', exact: true })).toHaveAttribute('href', '/admin')
    await expect(page.getByRole('navigation', { name: 'Admin sections', exact: true })).toHaveCount(1)
    await expect(page).toHaveTitle('Not found · stream.wzrd.tech admin')
  })
})
```

`tests/visual.spec.ts`: after-screenshots for human review against the JPEG baseline, and PNG regression snapshots from M1.

```ts
// dashboard/tests/visual.spec.ts — after-screenshots for the PR (human, vs the JPEG baseline) and PNG regression snapshots.
import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from './helpers/test'
import { NOT_FOUND, ROUTES, gotoRoute } from './helpers/routes'
import { FIXED_NOW, MILESTONE, since } from './helpers/env'

const PROD = process.env.WZRD_PROD === '1'
const AFTER = process.env.WZRD_AFTER === '1'
// dashboard/ → repo root → docs/redesign/after/m<id>/
const AFTER_DIR = path.resolve(__dirname, '..', '..', 'docs', 'redesign', 'after', `m${MILESTONE}`)

for (const r of [...ROUTES, NOT_FOUND]) {
  test(r.slug, async ({ page, theme }, info) => {
    test.skip(PROD && Boolean(r.devOnly), 'dev-only route')
    test.setTimeout(180_000) // full-page captures under SwiftShader take 5–15 s each; toHaveScreenshot needs two identical ones
    // Fake clock from the first script: the page loads with time flowing, then time jumps to a fixed instant and stops.
    // Stopping it freezes rAF (the carrier stops drawing), timers and every clock readout, so two captures are identical.
    await page.clock.install({ time: FIXED_NOW })
    await gotoRoute(page, r.path)
    await page.clock.pauseAt(new Date(FIXED_NOW.getTime() + 120_000))
    const width = info.project.use.viewport?.width ?? 1440
    if (AFTER) {
      // The real carrier stays visible here: this file is what a reviewer compares with docs/redesign/baseline/*.jpg.
      fs.mkdirSync(AFTER_DIR, { recursive: true })
      await page.screenshot({ path: path.join(AFTER_DIR, `${r.slug}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
    }
    // Regression snapshots from M1; the dev-only fixture only from its own milestone (before M7 it autoplays and animates).
    since(r.devOnly ? r.page : '1')
    await expect(page).toHaveScreenshot(`${r.slug}.png`, { fullPage: true, timeout: 60_000 })
  })
}
```

- **Baselines:** `docs/redesign/baseline/*.jpg` are JPEG captures of 845147c. Compare them with the after-screenshots side by side, as a human (§15.10); they are never pixel-diffed.
- **Regression snapshots:** 1A creates them, and every later PR diffs against them.
  - A milestone changes snapshots only in its `M<n>: update regression snapshots` commit.
  - Each changed file is listed in the PR's Screenshots table with its cause.
  - A snapshot that changes on a route the part does not touch is a regression.
  - Playwright sanitises `_` to `-` in snapshot file names (`admin_shotboard.png` is stored as `admin-shotboard.png`).
  - `/admin/visual-test` snapshots start at M7 (10F). Before that, its MorphSlider autoplays and its gallery images fail against blocked hosts, so no two captures match.

`tests/a11y.spec.ts`: `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`. A serious or critical violation fails the test.
- From M4, it checks the shell (`header`, `footer`) on every route.
- From each route's page milestone, it checks the whole page.
- It checks each fixture section from the milestone whose run first includes it (§10.5.9 lists the sections): `#design-system-visual-test` from M5, `#live-control-visual-test` from M6b, `#shotboard-visual-test` from M7, and `#clips-visual-test`, `#recordings-visual-test` and `#analytics-visual-test` from M8.

```ts
// dashboard/tests/a11y.spec.ts — axe-core with the WCAG 2.2 AA tag set: zero serious or critical violations.
// From M4 the shell (banner, nav, status rail) is checked on every route; each route's whole page from its own milestone
// (routes.ts `page`); the visual-test fixture sections from the milestone that builds them.
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { test, expect } from './helpers/test'
import { NOT_FOUND, ROUTES, gotoRoute } from './helpers/routes'
import { reached, since, type Milestone } from './helpers/env'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const PROD = process.env.WZRD_PROD === '1'

async function axe(page: Page, info: import('@playwright/test').TestInfo, include?: string[]): Promise<void> {
  const builder = new AxeBuilder({ page }).withTags(TAGS)
  for (const sel of include ?? []) builder.include(sel)
  const results = await builder.analyze()
  await info.attach('axe-violations', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(blocking.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(' | ')}`)).toEqual([])
}

for (const r of [...ROUTES, NOT_FOUND]) {
  test(`axe ${r.path}`, async ({ page }, info) => {
    test.skip(PROD && Boolean(r.devOnly), 'dev-only route')
    since('4')
    await gotoRoute(page, r.path)
    await axe(page, info, reached(r.page) ? undefined : ['header', 'footer'])
  })
}

const FIXTURES: [string, Milestone][] = [['#design-system-visual-test', '5'], ['#live-control-visual-test', '6b'], ['#shotboard-visual-test', '7'],
  ['#clips-visual-test', '8'], ['#recordings-visual-test', '8'], ['#analytics-visual-test', '8']]
for (const [section, from] of FIXTURES) {
  test(`axe /admin/visual-test ${section}`, async ({ page }, info) => {
    test.skip(PROD, 'dev-only route')
    since(from)
    await gotoRoute(page, '/admin/visual-test')
    await axe(page, info, [section])
  })
}
```

`tests/contrast.spec.ts` computes the §5.6 ledger from live CSS variables. It runs 12 times: 2 themes × `data-broadcast` idle or on-air × no preference, `prefers-reduced-transparency: reduce` or `prefers-contrast: more`. `tests/lib/contrast.ts` is the §5.6 file, verbatim. `tests/lib/ledger.ts` holds the compositing math:
- veil = canvas at `--dither-veil` over the carrier pixel;
- chassis, panel and raised = each surface at its `--a-*` over the veil;
- inset = inset at `--a-inset` over the panel composite;
- hover is opaque;
- dialog = raised over (scrim at `--a-scrim` over the veil);
- accent-soft = accent at `--a-accent-soft` over the panel composite;
- HUD plate = bezel at `--a-hud` over `#FFFFFF`.

Every text pair takes the minimum over every pixel the carrier can render.

```ts
// dashboard/tests/lib/ledger.ts — the contrast ledger of docs/redesign/spec/05-foundations.md §5.6, computed from live CSS custom properties.
import { carrierPalette, over, parseChannels, ratio, worst, type RGB } from './contrast'

export type Vars = Record<string, string>
export type Row = { pair: string; min: number; value: number }

const WHITE: RGB = [255, 255, 255]
const SURFACES = ['chassis', 'panel', 'raised', 'inset', 'hover'] as const

/** Every "Min" row of the ledger for one theme and one set of live variables. */
export function ledger(v: Vars, theme: 'light' | 'dark'): Row[] {
  const c = (n: string): RGB => parseChannels(v[`--c-${n}`])
  const a = (n: string): number => Number(v[`--a-${n}`])
  const trip = (n: string): number[] => v[n].trim().split(/\s+/).map(Number)
  const palette = carrierPalette(trip('--dither-wave'), trip('--dither-bg'))
  const veilAlpha = Number(v['--dither-veil'])

  // Compositing stack (the ledger's Method). Every function maps one carrier pixel to the colour the eye sees.
  const veil = (px: RGB): RGB => over(c('canvas'), veilAlpha, px)                        // canvas at --dither-veil over the pixel
  const panel = (px: RGB): RGB => over(c('panel'), a('panel'), veil(px))
  const surface: Record<(typeof SURFACES)[number], (px: RGB) => RGB> = {
    chassis: (px) => over(c('chassis'), a('chassis'), veil(px)),
    panel,
    raised: (px) => over(c('raised'), a('raised'), veil(px)),
    inset: (px) => over(c('inset'), a('inset'), panel(px)),                               // inputs always sit inside panels
    hover: () => c('hover'),                                                              // opaque
  }
  const dialog = (px: RGB): RGB => over(c('raised'), a('raised'), over(c('scrim'), a('scrim'), veil(px)))
  const accentSoft = (px: RGB): RGB => over(c('accent'), a('accent-soft'), panel(px))
  const hudPlate = over(c('bezel'), a('hud'), WHITE)                                      // worst screen content is white

  const rows: Row[] = []
  const push = (pair: string, min: number, value: number) => rows.push({ pair, min, value })
  for (const fg of ['text-1', 'text-2', 'text-3', 'accent', 'success', 'warning', 'danger'])
    for (const s of SURFACES) push(`${fg} on ${s}`, 4.5, worst(c(fg), surface[s], palette))
  for (const fg of ['text-1', 'text-2', 'text-3']) push(`${fg} on dialog`, 4.5, worst(c(fg), dialog, palette))
  for (const fg of ['text-1', 'text-2', 'accent']) push(`${fg} on accent-soft`, 4.5, worst(c(fg), accentSoft, palette))
  push('accent-ink on accent', 4.5, ratio(c('accent-ink'), c('accent')))
  push('accent-ink on accent-hover', 4.5, ratio(c('accent-ink'), c('accent-hover')))
  push('tally-ink on PGM', 4.5, ratio(c('tally-ink'), c('tally-program')))
  push('tally-ink on PVW', 4.5, ratio(c('tally-ink'), c('tally-preview')))
  push('text-on-screen on HUD plate', 4.5, ratio(c('text-on-screen'), hudPlate))
  push('text-on-screen-2 on solid bezel', 4.5, ratio(c('text-on-screen-2'), c('bezel')))
  push('text-1 on bare veil (display text >= 24 px)', 3, worst(c('text-1'), veil, palette))
  for (const fg of ['border-control', 'focus'])
    for (const s of SURFACES) push(`${fg} vs ${s}`, 3, worst(c(fg), surface[s], palette))
  for (const t of ['program', 'rec', 'cue', 'standby']) push(`tally-${t} ring vs bezel`, 3, ratio(c(`tally-${t}`), c('bezel')))
  if (theme === 'light') push('bezel housing vs light chassis', 3, worst(c('bezel'), surface.chassis, palette))
  return rows
}
```

```ts
// dashboard/tests/contrast.spec.ts — the docs/redesign/spec/05-foundations.md §5.6 ledger from live CSS variables: 2 themes × 2 broadcast states × 3 media = 12 runs.
import { test, expect } from './helpers/test'
import { ledger, type Vars } from './lib/ledger'
import { emulatePrefs } from './helpers/media'
import { settle, url } from './helpers/routes'
import { since } from './helpers/env'

const C = ['canvas', 'chassis', 'panel', 'raised', 'inset', 'hover', 'scrim', 'bezel', 'text-on-screen', 'text-on-screen-2',
  'text-1', 'text-2', 'text-3', 'border-control', 'accent', 'accent-hover', 'accent-ink', 'focus', 'success', 'warning', 'danger',
  'tally-program', 'tally-preview', 'tally-rec', 'tally-cue', 'tally-standby', 'tally-ink']
const A = ['chassis', 'panel', 'raised', 'inset', 'scrim', 'hud', 'accent-soft']
const NAMES = [...C.map((n) => `--c-${n}`), ...A.map((n) => `--a-${n}`), '--dither-wave', '--dither-bg', '--dither-veil']

const THEMES = ['light', 'dark'] as const
const BROADCAST = ['idle', 'on-air'] as const
const MEDIA = ['none', 'reduced-transparency', 'contrast-more'] as const

for (const theme of THEMES) for (const broadcast of BROADCAST) for (const media of MEDIA) {
  test(`${theme} · ${broadcast} · ${media}`, async ({ browser, baseURL }, info) => {
    since('1')
    test.skip(info.project.name !== 'desktop-dark', 'runs once, in desktop-dark')
    const origin = new URL(baseURL ?? 'http://localhost:3107').origin
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 },
      storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'theme', value: theme }] }] } })
    const page = await context.newPage()
    if (media === 'reduced-transparency') await emulatePrefs(page, { reducedTransparency: 'reduce' })
    if (media === 'contrast-more') await emulatePrefs(page, { contrast: 'more' })
    await page.goto(url('/admin'), { waitUntil: 'domcontentloaded' })
    await settle(page)
    const vars: Vars = await page.evaluate(({ names, state }) => {
      const html = document.documentElement
      html.dataset.broadcast = state             // the store's SSR default is 'idle'; on-air only changes --dither-veil/--dither-speed
      const cs = getComputedStyle(html)
      return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]))
    }, { names: NAMES, state: broadcast })
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(theme === 'dark')
    expect(NAMES.filter((n) => !vars[n]), 'unset tokens').toEqual([])
    const rows = ledger(vars, theme)
    await info.attach(`ledger-${theme}-${broadcast}-${media}`, { body: rows.map((r) => `${r.pair}\t${r.value.toFixed(2)}\t≥ ${r.min}`).join('\n'), contentType: 'text/plain' })
    expect(rows.filter((r) => r.value < r.min).map((r) => `${r.pair}: ${r.value.toFixed(2)} < ${r.min}`)).toEqual([])
    await context.close()
  })
}
```

> Note: `ledger.ts`, fed the §5.2 token values, reproduces §5.6's figures to the second decimal: dark and light text-3 on hover 5.04 and 5.51, the HUD plate 6.70, and bezel versus light chassis 15.94. All 12 variants pass, and the tightest pair is border-control versus hover, at 3.09 dark and 3.35 light. The §5.21 mutation (light `--c-text-3: 120 130 150`) fails six text-3 rows. `tests/unit/ledger.spec.ts` keeps the math honest without a browser:

```ts
// dashboard/tests/unit/ledger.spec.ts — the contrast math is itself tested: the docs/redesign/spec/05-foundations.md §5.6 figures and the mutation check.
import { test, expect } from '@playwright/test'
import { carrierPalette, ratio } from '../lib/contrast'
import { ledger } from '../lib/ledger'

const DARK = { '--c-canvas': '5 8 15', '--c-chassis': '7 11 20', '--a-chassis': '.84', '--c-panel': '11 17 29', '--a-panel': '.86', '--c-raised': '17 26 42', '--a-raised': '.94',
  '--c-inset': '4 7 13', '--a-inset': '.92', '--c-hover': '24 35 58', '--c-scrim': '2 4 8', '--a-scrim': '.64', '--c-text-1': '232 238 249', '--c-text-2': '169 182 204',
  '--c-text-3': '133 147 171', '--c-border-control': '90 111 148', '--c-accent': '122 165 224', '--c-accent-hover': '156 192 240', '--c-accent-ink': '5 8 15',
  '--a-accent-soft': '.14', '--c-focus': '156 192 242', '--c-success': '52 210 123', '--c-warning': '245 184 61', '--c-danger': '255 107 107',
  '--c-screen': '0 0 0', '--c-bezel': '11 15 23', '--a-hud': '.72', '--c-text-on-screen': '232 238 249', '--c-text-on-screen-2': '169 180 198',
  '--c-tally-program': '255 59 48', '--c-tally-preview': '48 209 88', '--c-tally-rec': '255 122 69', '--c-tally-cue': '255 176 32', '--c-tally-standby': '140 152 174',
  '--c-tally-ink': '5 8 15', '--dither-wave': '0.2 0.34 0.66', '--dither-bg': '0.02 0.03 0.06', '--dither-veil': '.45' }

test('the carrier can render #5555AA in both themes', () => {
  for (const [wave, bg] of [[[0.2, 0.34, 0.66], [0.02, 0.03, 0.06]], [[0.5, 0.63, 0.86], [0.98, 0.98, 1]]]) {
    expect(carrierPalette(wave, bg).map((p) => p.join(','))).toContain('85,85,170')
  }
})

test('WCAG ratio: black on white is 21', () => { expect(ratio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5) })

test('dark ledger reproduces the published figures (text-3 on hover 5.04, HUD plate 6.70) and passes', () => {
  const rows = ledger(DARK, 'dark')
  const v = (pair: string) => Math.floor(rows.find((r) => r.pair === pair)!.value * 100) / 100
  expect(v('text-3 on hover')).toBe(5.04)
  expect(v('text-on-screen on HUD plate')).toBe(6.7)
  expect(rows.filter((r) => r.value < r.min)).toEqual([])
})

test('mutation: a lighter text-3 fails', () => {
  const rows = ledger({ ...DARK, '--c-text-3': '60 66 80' }, 'dark')
  expect(rows.some((r) => r.pair.startsWith('text-3') && r.value < r.min)).toBe(true)
})
```

`tests/canvas-audit.spec.ts`:
- One live WebGL context per route, plus one when the slot owner is `morph`.
- `window.__wzrd.slots` is present from M4.
- 10 theme toggles keep the same canvas node, one context, one `wzrd:dither-ready` event and a silent console.
- Between 1 and 62 carrier frames in 2 s, and zero while hidden.
- Under reduced motion, zero rAF calls and zero infinite animations after settling.

The single rAF allowance is the hash-locked dither-kit chart loop (`cartesian-canvas.tsx` re-requests every frame and draws static frames under reduced motion). The chart is the Analytics effect slot (bible §10.1.1).

```ts
// dashboard/tests/canvas-audit.spec.ts — one WebGL context (the carrier) per route, at most one effect canvas (the slot owner),
// no context churn on theme toggles, the ≤30 fps cap, pause when hidden, and zero rAF under reduced motion. Dev server only.
import { test, expect } from './helpers/test'
import { ROUTES, gotoRoute } from './helpers/routes'
import { reached, since } from './helpers/env'
import { installProbes, liveWebGL, rafCallers } from './helpers/probes'

type Wzrd = { slots?: { owner: string | null; requests: { id: string; priority: number; want: boolean }[] }; frames?: Record<string, number> }
const wzrd = (page: import('@playwright/test').Page): Promise<Wzrd> => page.evaluate(() => JSON.parse(JSON.stringify((window as unknown as { __wzrd?: Wzrd }).__wzrd ?? {})))
const CARRIER = 'body > div.fixed.-z-10 canvas'
// Hash-locked dither-kit chart loop (cartesian-canvas.tsx re-requests every frame and draws static under reduced motion).
const RAF_ALLOWED: Record<string, RegExp> = { '/admin/analytics': /components\/dither-kit\/cartesian-canvas/ }

test.beforeEach(async ({ page }) => { await installProbes(page) })

for (const r of ROUTES) {
  test.describe(r.path, () => {
    test('one WebGL context; at most one effect canvas', async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop-dark', 'desktop-dark only')
      await gotoRoute(page, r.path)
      const w = await wzrd(page)
      if (reached('4')) {
        expect(w.slots, 'window.__wzrd.slots (dev audit, docs/redesign/spec/07-primitives-and-shell.md §7.16)').toBeDefined()
        expect(w.slots!.owner === null || typeof w.slots!.owner === 'string').toBe(true)
      }
      const morphUngated = !reached('5') && r.path === '/admin/visual-test' // MorphSlider is slot-gated from M5
      const expected = 1 + (w.slots?.owner === 'morph' || morphUngated ? 1 : 0)
      await expect.poll(() => liveWebGL(page), { timeout: 10_000 }).toBe(expected)
    })

    test('reduced motion: no requestAnimationFrame after settle', async ({ page }, info) => {
      test.skip(info.project.name !== 'reduced-motion', 'reduced-motion project only')
      since('3')
      await gotoRoute(page, r.path)
      await page.waitForTimeout(1_000)
      const callers = await rafCallers(page, 2_000)
      const allowed = RAF_ALLOWED[r.path]
      const offenders = Object.entries(callers).filter(([k]) => !(allowed && allowed.test(k)))
      expect(offenders, 'rAF callers under prefers-reduced-motion').toEqual([])
      const infinite = await page.evaluate(() => document.getAnimations()
        .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length)
      expect(infinite, 'infinite CSS/WAAPI animations under reduced motion').toBe(0)
    })
  })
}

test.describe('carrier', () => {
  test.beforeEach(({}, info) => { test.skip(info.project.name !== 'desktop-dark', 'desktop-dark only') })

  test('10 theme toggles keep one context, the same canvas node and a silent console', async ({ page, consoleEntries }) => {
    since('3')
    await gotoRoute(page, '/admin/clips')
    await page.evaluate((sel) => { (window as unknown as { __qaCarrier: Element | null }).__qaCarrier = document.querySelector(sel) }, CARRIER)
    const before = consoleEntries.length
    for (let i = 0; i < 10; i++) {
      const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      await page.locator(`[title="Switch to ${dark ? 'light' : 'dark'} mode"]`).first().click()
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(!dark)
    }
    await page.waitForTimeout(1_000)
    expect(await liveWebGL(page)).toBe(1)
    expect(await page.evaluate((sel) => document.querySelector(sel) === (window as unknown as { __qaCarrier: Element | null }).__qaCarrier, CARRIER)).toBe(true)
    expect(await page.evaluate(() => (window as unknown as { __qa: { ditherReady: number } }).__qa.ditherReady)).toBe(1)
    expect(consoleEntries.slice(before).map((e) => `${e.type}: ${e.text}`)).toEqual([])
  })

  test('≤ 30 fps while visible, zero frames while hidden', async ({ page }) => {
    since('3')
    await gotoRoute(page, '/admin/clips')
    const frames = async () => (await wzrd(page)).frames?.carrier ?? 0
    const f0 = await frames(); await page.waitForTimeout(2_000); const f1 = await frames()
    expect(f1 - f0).toBeGreaterThanOrEqual(1)
    expect(f1 - f0).toBeLessThanOrEqual(62)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.waitForTimeout(500)
    const h0 = await frames(); await page.waitForTimeout(2_000); const h1 = await frames()
    expect(h1 - h0).toBe(0)
  })
})
```

`tests/boot.spec.ts` (the `prod` project, from M4). It checks:
- the overlay is removed by 1617 ms after navigation start (1600 ms at 60 Hz plus at most one frame; `tEnd ≤ 1617`, and `#wzrd-boot` is gone at 1650 ms), provided the script started by 600 ms (`t0 ≤ 600`, §6.2);
- the layout-shift sum over 0–2000 ms is 0;
- the boot is skipped under `navigator.webdriver` and `?noboot`;
- the first-visit → channel-flip session logic (`tEnd − t0 ≤ 257`: 224 ms plus the script start and one frame);
- the reduced-motion static card;
- the gzipped inline sizes.

§6.16 lists more boot items (interrupt, JS disabled, POST rows). Add them to this file in 4C.

```ts
// dashboard/tests/boot.spec.ts — the docs/redesign/spec/06-motion-and-loading.md §6.2 boot on a production build (project `prod`,
// WZRD_PROD=1). From M4.
import zlib from 'node:zlib'
import { test, expect } from './helpers/test'
import { url } from './helpers/routes'
import { since } from './helpers/env'
import { installProbes, qa } from './helpers/probes'
import { checkConsole } from './helpers/console'

type BootRecord = { mode: 'post' | 'flip' | 'static' | 'skip'; t0: number; tEnd: number; interrupted: boolean }
const boot = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __wzrd?: { boot?: BootRecord } }).__wzrd?.boot ?? null)
const at = (page: import('@playwright/test').Page, ms: number) =>
  page.waitForFunction((t) => performance.now() >= t, ms, { polling: 16 })

test.beforeEach(async ({ page }) => { since('4'); await installProbes(page) })

test('first visit (?boot=1): overlay gone by 1617 ms, CLS 0, console clean, boot images served', async ({ page, consoleEntries }) => {
  const bootImages = new Map<string, number>()
  const bad: string[] = []
  page.on('response', (r) => {
    const p = new URL(r.url()).pathname
    if (r.status() >= 400) bad.push(`${r.status()} ${p}`)
    if (p === '/brand/wordmark/wzrdtech-640.webp' || p === '/brand/loader/coast-boot-strip@2x.png') bootImages.set(p, r.status())
  })
  await page.goto(url('/admin', 'post'), { waitUntil: 'commit' })
  await at(page, 1_650)
  expect(await page.evaluate(() => document.getElementById('wzrd-boot'))).toBeNull()
  const b = await boot(page)
  expect(b?.mode).toBe('post')
  expect(b!.t0, 'precondition: the boot script started by 600 ms (re-run otherwise)').toBeLessThanOrEqual(600)
  expect(b?.interrupted).toBe(false)
  expect(b!.tEnd).toBeLessThanOrEqual(1_617) // 1600 ms at 60 Hz plus at most one frame
  await at(page, 2_000)
  expect((await qa(page)).cls).toBe(0)
  expect(bad).toEqual([])
  expect([...bootImages.keys()].sort()).toEqual(['/brand/loader/coast-boot-strip@2x.png', '/brand/wordmark/wzrdtech-640.webp'])
  checkConsole(consoleEntries, '/admin')
})

test('Playwright default (navigator.webdriver) and ?noboot skip the boot', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'domcontentloaded' })
  expect(await page.evaluate(() => document.getElementById('wzrd-boot'))).toBeNull()
  expect((await boot(page))?.mode).toBe('skip')
  await page.goto(url('/admin', 'skip'), { waitUntil: 'domcontentloaded' })
  expect(await page.evaluate(() => document.getElementById('wzrd-boot'))).toBeNull()
  expect((await boot(page))?.mode).toBe('skip')
})

test('session logic (?boot=auto): first load POST, reload channel flip ≤ 257 ms', async ({ page }) => {
  await page.goto(url('/admin', 'auto'), { waitUntil: 'commit' })
  await at(page, 1_700)
  expect((await boot(page))?.mode).toBe('post')
  expect(await page.evaluate(() => sessionStorage.getItem('wzrd:boot'))).toBe('1')
  await page.reload({ waitUntil: 'commit' })
  await at(page, 1_000)
  const b = await boot(page)
  expect(b?.mode).toBe('flip')
  expect(b!.tEnd - b!.t0).toBeLessThanOrEqual(257)
})

test('reduced motion: static card, gone ≤ 450 ms after the script starts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(url('/admin', 'post'), { waitUntil: 'commit' })
  await at(page, 1_000)
  const b = await boot(page)
  expect(b?.mode).toBe('static')
  expect(b!.t0, 'precondition: the boot script started by 600 ms (re-run otherwise)').toBeLessThanOrEqual(600)
  expect(b!.tEnd - b!.t0).toBeLessThanOrEqual(450)
})

test('inline boot script ≤ 4096 B and BOOT_CSS ≤ 1536 B gzipped', async ({ request }) => {
  const html = await (await request.get('/admin')).text()
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('wzrd-boot'))
  const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).find((s) => s.includes('#wzrd-boot'))
  expect(script, 'inline boot script').toBeTruthy()
  expect(css, 'BOOT_CSS').toBeTruthy()
  expect(zlib.gzipSync(script!, { level: 9 }).length).toBeLessThanOrEqual(4096)
  expect(zlib.gzipSync(css!, { level: 9 }).length).toBeLessThanOrEqual(1536)
})
```

`tests/live-control.spec.ts`:
- The §1.6 flow: exactly one 'Start Director', a failed start that restores it, and no 'Record' while idle or failed.
- From 6b, the zero-scroll instrument.

Before it clicks 'Start Director', the spec stubs every `/api/fal/**` request with a 401 `{"detail":"qa-stub"}` (§15.4). The SDK's WMA client sends its `/ice` and `/session` requests through the `/api/fal/sdk-proxy` proxy, so the stub answers them locally and the start fails the same way on every run, with no request leaving the machine. Measured on 845147c without the stub, in a sandbox without credentials: the failed start took 16 s and showed 'WMA session request failed (HTTP 403)'. During the flow the SDK logs `Failed to load resource …` and `[wma] /ice unavailable, falling back to STUN`. Those are expected, so this spec checks console entries on load only (routes.spec), never during the flow.

```ts
// dashboard/tests/live-control.spec.ts — the admin-testing flow (goal.md §1.6 step 3) plus the zero-scroll instrument
// (docs/redesign/spec/08-live-control.md).
import { test, expect } from './helpers/test'
import { gotoRoute } from './helpers/routes'
import { reached, since } from './helpers/env'

const START = { name: 'Start Director', exact: true } as const
// Every test that clicks 'Start Director' stubs the fal proxy first: no request reaches fal, and the failure is repeatable.
const stubFal = (page: import('@playwright/test').Page) =>
  page.route('**/api/fal/**', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"qa-stub"}' }))
const premise = (page: import('@playwright/test').Page) =>
  reached('6b') ? page.getByLabel('Opening prompt (the series premise)', { exact: true }) : page.locator('main textarea').first()

test.describe('/admin', () => {
  test('idle: one "Start Director", no "Record", premise prefilled', async ({ page }) => {
    await gotoRoute(page, '/admin')
    const start = page.getByRole('button', START)
    await expect(start).toHaveCount(1)
    await expect(start).toBeVisible()
    await expect(page.getByRole('button', { name: 'Record', exact: true })).toHaveCount(0)
    await expect(premise(page)).toHaveValue('A continuous original live-action stream following a group of friends as they explore a new city.')
    if (reached('6b')) await expect(start).toBeInViewport({ ratio: 1 }) // B4: idle, fully inside the viewport at every project size
  })

  test('failed start shows an error and restores "Start Director"', async ({ page }) => {
    test.setTimeout(120_000)
    await stubFal(page)
    await gotoRoute(page, '/admin')
    const box = premise(page)
    await box.press('End')
    await box.pressSequentially(` qa-${Math.floor(Date.now() / 1000)}`)
    await page.getByRole('button', START).click()
    // The stubbed proxy answers 401, so the SDK fails locally ('qa-stub' or its own HTTP 401 message). Both pass.
    await expect(page.getByRole('button', START)).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('main')).toContainText(/failed/i)
    await expect(page.getByRole('button', { name: 'Record', exact: true })).toHaveCount(0)
    if (reached('6b')) {
      // Next's route announcer is also role="alert"; always scope to the Live Control tray.
      await expect(page.locator('[data-testid="lc-alert-tray"][role="alert"]')).not.toHaveText('')
      await expect(page.locator('[data-testid="lc-state-word"]')).toHaveAttribute('data-state', /^(failed|idle|closed)$/)
    }
  })

  test('zero page scroll at 1024×768, 1280×800, 1440×900, 1920×1080', async ({ page }, info) => {
    since('6b')
    test.skip(info.project.name !== 'laptop', 'laptop project (resizes itself)')
    for (const [width, height] of [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]]) {
      await page.setViewportSize({ width, height })
      await gotoRoute(page, '/admin')
      const { sh, ih } = await page.evaluate(() => ({ sh: document.scrollingElement!.scrollHeight, ih: innerHeight }))
      expect(sh, `scrollHeight at ${width}×${height}`).toBeLessThanOrEqual(ih)
    }
  })
})
```

`tests/preserved-contract.spec.ts` covers the route-visible slice of Appendix A in unconfigured mode.
- Every entry holds at 845147c. A PR adds an entry when it creates a new preserved surface, with `since` set to its milestone.
- An entry is removed only when Appendix A's allowed-changes list removes the string.
- The full list of quoted Appendix A values, including configured-mode strings and log lines, is checked by `scripts/checks/appendix-a.mjs` in each PR (§15.2 C7). The Convex names and fal endpoints are checked by A.14's greps.

```ts
// dashboard/tests/preserved-contract.spec.ts — the route-visible slice of docs/redesign/spec/appendix-a-preserved-contract.md
// in unconfigured mode (next dev, ?noboot).
// Every entry holds at 845147c and must keep holding. Entries are only added (with the PR that creates the surface) or
// removed by an allowed change listed in its A.12; the entry's `since` is the milestone from which it applies.
import type { Page } from '@playwright/test'
import { test, expect } from './helpers/test'
import { gotoRoute } from './helpers/routes'
import { reached, type Milestone } from './helpers/env'

type Entry = { id: string; since?: Milestone; minWidth?: number; minHeight?: number; check: (page: Page) => Promise<void> }

const text = (s: string) => async (page: Page) => { await expect(page.locator('body')).toContainText(s) }
const noText = (s: string) => async (page: Page) => { await expect(page.locator('main')).not.toContainText(s) }
const button = (name: string, count = 1) => async (page: Page) => { await expect(page.getByRole('button', { name, exact: true })).toHaveCount(count) }
const attr = (selector: string, name: string, value: string) => async (page: Page) => { await expect(page.locator(selector).first()).toHaveAttribute(name, value) }
const exists = (selector: string) => async (page: Page) => { await expect(page.locator(selector).first()).toBeAttached() }

const NAV: [string, string][] = [['Live Control', '/admin'], ['Shotboard', '/admin/shotboard'], ['Characters', '/admin/characters'],
  ['Locations', '/admin/locations'], ['Clips', '/admin/clips'], ['Recordings', '/admin/recordings'], ['Twitch Analytics', '/admin/analytics']]

const SHELL: Entry[] = [
  { id: 'nav landmark', check: async (p) => { await expect(p.locator('nav[aria-label="Admin sections"]')).toHaveCount(1) } },
  ...NAV.map(([name, href]): Entry => ({ id: `nav link ${name}`, check: async (p) => {
    await expect(p.getByRole('navigation', { name: 'Admin sections', exact: true }).getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
  } })),
  { id: 'logo alt WZRD.TECH', check: exists('img[alt="WZRD.TECH"]') },
  { id: "brand 'Stream Admin'", minWidth: 768, check: text('Stream Admin') },
  { id: "brand 'stream.wzrd.tech'", minWidth: 768, check: text('stream.wzrd.tech') },
  { id: 'theme titles', minWidth: 768, check: exists('[title="Switch to light mode"], [title="Switch to dark mode"]') },
  { id: "footer 'Powered by FAL realtime' removed (D6)", since: '4', check: async (p) => { await expect(p.locator('body')).not.toContainText('Powered by FAL realtime') } },
]

const PAGES: Record<string, Entry[]> = {
  '/admin': [
    { id: "'Start Director'", check: button('Start Director') },
    { id: "no 'Record' while idle", check: button('Record', 0) },
    { id: "'Director (realtime WebRTC)'", check: text('Director (realtime WebRTC)') },
    { id: 'model id visible', check: async (p) => { await expect(p.getByText('minimax/h3-max/director', { exact: true }).first()).toBeVisible() } },
    { id: "'Opening prompt (the series premise)'", check: text('Opening prompt (the series premise)') },
    { id: 'premise label wired', since: '6b', check: async (p) => { await expect(p.getByLabel('Opening prompt (the series premise)', { exact: true })).toHaveJSProperty('tagName', 'TEXTAREA') } },
    { id: "'Session settings'", minWidth: 1024, check: text('Session settings') },
    { id: "summary 'Session settings (locked once connected)'", since: '6b', minWidth: 1024, check: async (p) => {
      await expect(p.locator('summary').filter({ hasText: 'Session settings' })).toHaveText(/^\s*Session settings\s*\(locked once connected\)\s*$/) } },
    { id: "'Send direction'", minWidth: 1280, check: button('Send direction') },
    { id: "'Go live on Twitch' disabled with its idle title", minWidth: 1024, check: async (p) => {
      const b = p.getByRole('button', { name: 'Go live on Twitch', exact: true })
      await expect(b).toHaveCount(1); await expect(b).toBeDisabled(); await expect(b).toHaveAttribute('title', 'Start the Director session first') } },
    { id: "'Twitch broadcast'", minWidth: 1024, check: text('Twitch broadcast') },
    { id: "'Connect to Twitch'", minWidth: 1024, check: button('Connect to Twitch') },
    { id: "'Paste a stream key instead'", minWidth: 1024, check: text('Paste a stream key instead') },
    { id: "'Send with session start'", minWidth: 1024, check: async (p) => { await expect(p.getByRole('checkbox', { name: 'Send with session start', exact: true })).toHaveCount(1) } },
    { id: "'Add shot'", minWidth: 1440, minHeight: 900, check: button('Add shot') },
  ],
  '/admin/shotboard': [
    { id: "'New board'", check: async (p) => { await expect(p.getByRole('button', { name: 'New board', exact: true }).first()).toBeAttached() } },
    { id: 'local-mode sentence', check: text('Convex not configured — this board lives only in this page’s state and cannot be sent to Director.') },
    { id: 'board description', check: text('Build scenes of shots with generated keyframes — the board compiles to the timed script the Director runs.') },
  ],
  '/admin/characters': [{ id: 'not-configured sentence', check: text('Convex is not configured. Character library changes are disabled.') }],
  '/admin/locations': [{ id: 'not-configured sentence', check: text('Convex is not configured. Location library changes are disabled.') }],
  '/admin/clips': [
    { id: "'Convex is not configured'", check: text('Convex is not configured') },
    { id: 'env + command sentence', check: text('Set NEXT_PUBLIC_CONVEX_URL to enable clips. Run npx convex dev in dashboard/ to create a deployment.') },
  ],
  '/admin/recordings': [
    { id: "'Convex is not configured'", check: text('Convex is not configured') },
    { id: 'env + command sentence', check: text('Set NEXT_PUBLIC_CONVEX_URL to enable recordings. Run npx convex dev in dashboard/ to create a deployment.') },
  ],
  '/admin/analytics': [
    { id: "'Not configured'", check: text('Not configured') },
    { id: 'server error verbatim', check: text('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured') },
    { id: "'Refresh'", check: button('Refresh') },
    { id: "no red 'OFFLINE' when not configured", since: '8', check: noText('OFFLINE') },
    { id: "no 'Collecting samples…' when not configured", since: '8', check: noText('Collecting samples…') },
  ],
  '/admin/visual-test': [
    { id: '#audio-library-visual-test', check: exists('#audio-library-visual-test') },
    { id: '.asset-studio', check: exists('.asset-studio') },
    { id: '#design-system-visual-test', since: '5', check: exists('section#design-system-visual-test') },
    { id: '#live-control-visual-test', since: '6b', check: exists('section#live-control-visual-test') },
    { id: '#shotboard-visual-test', since: '7', check: exists('section#shotboard-visual-test') },
    { id: '#clips-visual-test', since: '8', check: exists('section#clips-visual-test') },
    { id: '#recordings-visual-test', since: '8', check: exists('section#recordings-visual-test') },
    { id: '#analytics-visual-test', since: '8', check: exists('section#analytics-visual-test') },
  ],
}

for (const [path, entries] of Object.entries(PAGES)) {
  test(`preserved contract ${path}`, async ({ page }, info) => {
    await gotoRoute(page, path)
    const vp = info.project.use.viewport ?? { width: 1440, height: 900 }
    const applicable = [...SHELL, ...entries].filter((e) => (!e.since || reached(e.since)) && vp.width >= (e.minWidth ?? 0) && vp.height >= (e.minHeight ?? 0))
    const failures: string[] = []
    for (const e of applicable) {
      try { await e.check(page) } catch (err) { failures.push(`${e.id}: ${String(err).split('\n')[0]}`) }
    }
    await info.attach('checked', { body: applicable.map((e) => e.id).join('\n'), contentType: 'text/plain' })
    expect(failures, `${path} preserved-contract failures`).toEqual([])
  })
}
```

`tests/live-extraction.spec.ts` is the 8A parity proof (§14.12, §14.3 R12). 1A creates it with the rest of the harness, 8A runs it without changing it, and 8B deletes it. It runs only while `WZRD_MILESTONE` is below `6b`. Its failed-start case stubs the fal proxy (§15.4), types the constant suffix ` qa-parity`, and waits for 1000 ms without network traffic before it normalises and captures, so late log lines land in both runs.

```ts
// dashboard/tests/live-extraction.spec.ts — the M6a (PR 8A) no-change proof, docs/redesign/spec/08-live-control.md §8.5.4
// steps 1–4, in one spec. Run it twice (goal.md §14.12 step 7): against the parent commit's dev server (WZRD_REUSE_SERVER=1,
// WZRD_LIVE_OUT=.qa/live-before, --update-snapshots), then against the 8A branch (WZRD_LIVE_OUT=.qa/live-after).
// `diff -r .qa/live-before .qa/live-after` must print nothing and every capture must match at maxDiffPixels 0.
// No fake clock here: with Playwright's clock installed, the SDK's failure path spins on timers and starves the renderer
// (measured on 845147c). Time-dependent text is normalised in the DOM instead, and tests/screenshot.css hides the carrier
// canvas and the StatusRail clock.
import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect } from './helpers/test'
import { gotoRoute } from './helpers/routes'
import { reached } from './helpers/env'

const OUT = process.env.WZRD_LIVE_OUT

/** Resolve once no request has been in flight for `quiet` ms (late log lines then land before the capture). */
async function networkQuiet(page: Page, quiet = 1_000, timeout = 30_000): Promise<void> {
  let inflight = 0
  let last = Date.now()
  const up = () => { inflight++; last = Date.now() }
  const down = () => { inflight = Math.max(0, inflight - 1); last = Date.now() }
  page.on('request', up); page.on('requestfinished', down); page.on('requestfailed', down)
  try {
    for (const end = Date.now() + timeout; !(inflight === 0 && Date.now() - last >= quiet);) {
      if (Date.now() > end) throw new Error(`network not quiet for ${quiet} ms within ${timeout} ms`)
      await page.waitForTimeout(100)
    }
  } finally {
    page.off('request', up); page.off('requestfinished', down); page.off('requestfailed', down)
  }
}
const CASES = [
  { name: 'idle-dark', width: 1440, height: 900, theme: 'dark', failed: false },
  { name: 'idle-light', width: 1440, height: 900, theme: 'light', failed: false },
  { name: 'idle-390', width: 390, height: 844, theme: 'dark', failed: false },
  { name: 'failed-dark', width: 1440, height: 900, theme: 'dark', failed: true },
] as const

for (const c of CASES) {
  test(`8A parity ${c.name}`, async ({ browser, baseURL }, info) => {
    test.skip(info.project.name !== 'desktop-dark', 'desktop-dark only (the spec sets its own viewports and themes)')
    test.skip(reached('6b'), 'the 8A proof only; 8B changes the page on purpose')
    test.setTimeout(180_000)
    const origin = new URL(baseURL ?? 'http://localhost:3107').origin
    const context = await browser.newContext({ baseURL, viewport: { width: c.width, height: c.height }, locale: 'en-US', timezoneId: 'UTC',
      colorScheme: c.theme, storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'theme', value: c.theme }] }] } })
    const page = await context.newPage()
    // No request reaches fal, and both runs fail identically (docs/redesign/spec/15-verification-and-qa.md §15.4).
    await page.route('**/api/fal/**', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"qa-stub"}' }))
    await gotoRoute(page, '/admin')
    if (c.failed) {
      const box = page.locator('main textarea').first()
      await box.press('End')
      await box.pressSequentially(' qa-parity')          // constant, so both runs render the same premise
      await page.getByRole('button', { name: 'Start Director', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Start Director', exact: true })).toBeVisible({ timeout: 60_000 })
      await networkQuiet(page)
    }
    // Normalise what legitimately differs between two runs, in the DOM itself so the capture and the HTML agree:
    // wall-clock times in log lines → 'T', and the SDK's failure message (401 vs 403, request ids) → 'ERR'.
    await page.evaluate(() => {
      const main = document.querySelector('main')!
      const box = [...main.querySelectorAll('div')].find((d) => /(^|\s)bg-red-/.test(d.className) && d.textContent?.trim())
      const msg = box?.textContent?.trim()
      const walk = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        let v = n.nodeValue ?? ''
        if (msg) v = v.split(msg).join('ERR')
        n.nodeValue = v.replace(/\d{1,2}:\d{2}:\d{2}( ?[AP]M)?/g, 'T')
      }
    })
    if (OUT) {
      const html = await page.evaluate(() => document.querySelector('main')!.outerHTML)
      fs.mkdirSync(OUT, { recursive: true })
      fs.writeFileSync(path.join(OUT, `${c.name}.html`), html)
    }
    await expect(page).toHaveScreenshot(`live-${c.name}.png`, { fullPage: true, maxDiffPixels: 0, timeout: 60_000 })
    await context.close()
  })
}
```

**Specs owned by the chapters.** The chapters add these. They use the same helpers, and they run in the projects shown.

| Spec | Added in | Projects |
|---|---|---|
| `tests/whip-truth.spec.ts` (pure `nextAir`) | 8C | desktop-dark |
| `tests/shotboard.spec.ts`; `tests/unit/{shotboard-load,shot-prompt,shot-model,director-transfer,frame-geometry,shot-strings}.spec.ts` | 9A–9D | desktop-dark and desktop-light; unit |
| `tests/library.spec.ts`; `tests/unit/{clip-status,format-media}.spec.ts` | 11A | desktop-dark and desktop-light; unit |
| `tests/recordings.spec.ts` | 11B | desktop-dark and desktop-light |
| `tests/analytics.spec.ts`, `tests/helpers/twitch.ts`; `tests/unit/{lamp-state,chart-data}.spec.ts` | 11C | desktop-dark and desktop-light; unit |
| `tests/unit/global-error.spec.ts` (uses `component()` from `pw-jsx.ts`) | 4D | unit |

### 15.6 Performance checks

`tests/perf.spec.ts`:

```ts
// dashboard/tests/perf.spec.ts — Live Control long tasks at 4× CPU throttle and React commit counts (docs/redesign/spec/15-verification-and-qa.md §15.6). Dev server, desktop-dark.
import type { Page } from '@playwright/test'
import { test, expect } from './helpers/test'
import { gotoRoute } from './helpers/routes'
import { reached, since } from './helpers/env'
import { installProbes, qa } from './helpers/probes'
import { commitsDuring, installCommitProbe } from './helpers/react-commits'

test.beforeEach(({}, info) => { test.skip(info.project.name !== 'desktop-dark', 'desktop-dark only') })

/** Long tasks (> 50 ms) that start inside a 10 s window with the renderer main thread throttled 4×. */
async function longTasksAt4x(page: Page): Promise<{ start: number; duration: number }[]> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const t0 = await page.evaluate(() => performance.now())
  await page.waitForTimeout(10_000)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await cdp.detach()
  return (await qa(page)).longTasks.filter((t) => t.start >= t0 && t.duration > 50)
}

test('Live Control idle: no long task over 50 ms in 10 s at 4× throttle', async ({ page }) => {
  since('3')
  await installProbes(page)
  await gotoRoute(page, '/admin')
  expect(await longTasksAt4x(page)).toEqual([])
})

test('Live Control with the store on air: no long task over 50 ms in 10 s at 4× throttle', async ({ page }) => {
  since('6b')
  await installProbes(page)
  await gotoRoute(page, '/admin')
  await page.evaluate(() => {
    const b = (window as unknown as { __wzrd: { broadcast: { publish(s: object): void } } }).__wzrd.broadcast
    const now = Date.now()
    b.publish({ director: 'live', firstFrame: true, rec: { active: true, startedAt: now, bytes: 0 }, air: 'on', airSince: now })
  })
  await page.waitForTimeout(1_500) // the 1200 ms house-lights tween
  expect(await longTasksAt4x(page)).toEqual([])
})

test('Live fixture at 1 Hz: only leaves commit; no long task at 4× throttle', async ({ page }) => {
  since('6b')
  await installProbes(page)
  await installCommitProbe(page)
  await gotoRoute(page, '/admin/visual-test#live-control-visual-test')
  await page.locator('#live-control-visual-test').scrollIntoViewIfNeeded()
  const { rendered } = await commitsDuring(page, () => page.waitForTimeout(5_000))
  expect(rendered.LiveFixtureRoot ?? 0, 'LiveFixtureRoot renders in 5 s').toBe(0)
  expect(rendered.DirectorPlayer ?? 0).toBe(0)
  expect(rendered.LiveClock ?? 0, 'LiveClock renders in 5 s').toBeGreaterThanOrEqual(4)
  expect(await longTasksAt4x(page)).toEqual([])
})

test('DirectorPlayer never commits while idle (10 s)', async ({ page }) => {
  await installCommitProbe(page)
  await gotoRoute(page, '/admin')
  const { rendered } = await commitsDuring(page, () => page.waitForTimeout(10_000))
  expect(rendered.DirectorPlayer ?? 0).toBe(0)
})

test('M6a parity: 5 keystrokes in the premise render DirectorPlayer exactly 5 times', async ({ page }) => {
  test.skip(reached('6b'), 'M0–M6a only: the extraction must not change what re-renders on input')
  await installCommitProbe(page)
  await gotoRoute(page, '/admin')
  const box = page.locator('main textarea').first()
  await box.press('End')
  const { rendered } = await commitsDuring(page, async () => { await box.pressSequentially('abcde', { delay: 120 }); await page.waitForTimeout(500) })
  expect(rendered.DirectorPlayer).toBe(5)
})
```

- **Long tasks.**
  - A `PerformanceObserver` for `longtask` (buffered) runs from the first script.
  - After settling, `Emulation.setCPUThrottlingRate({ rate: 4 })` (CDP) throttles the renderer's main thread for a 10 s window. Any entry longer than 50 ms that starts inside the window fails the test.
  - The scenarios are Live Control idle (from M3), Live Control with the store on air (from 6b), and the Live fixture ticking at 1 Hz (from 6b).
  - "UI-caused" (bible §10.1.6) means everything on the renderer main thread, because the harness cannot tell UI from other work.
  - Measured on 845147c: `/admin` idle at 4× had no long task.
- **React Profiler commit-count method** (`tests/helpers/react-commits.ts`):
  - It installs a minimal `__REACT_DEVTOOLS_GLOBAL_HOOK__` before React loads. react-dom 18.3 calls `onCommitFiberRoot` for every commit.
  - For each commit, the probe walks the committed tree and counts a named component as "rendered" when it mounted or its `PerformedWork` flag (`flags & 1`) is set. It descends only where `fiber.child !== alternate.child`, the rule React DevTools uses, so bailed-out subtrees never count.
  - It needs a development build for component names.
  - Measured on 845147c: 10 s idle on `/admin` gave 0 commits. Typing 2 characters into the premise gave 2 commits. Each commit rendered DirectorPlayer once, plus 17 other named components.
  - The hook suppresses React's "Download the React DevTools" message, so never combine this probe with a console assertion.
  - It complements the dev-only `bump()` counters (§8.5.4 E12, `window.__wzrd.renders`): the counters prove what a component rendered, and the probe proves what React committed.
  - **Manual cross-check. Human operator only; Devin never runs it** (§1.8 item 3, §8.5.4 step 8, §7.18): it needs a paid Director session. In a desktop Chrome with the React DevTools extension, the operator runs Profiler → records 10 s of live playback. The commit list shows no DirectorPlayer render, and "Highlight updates" flashes only the leaf readouts. The exported profile JSON is attached to the PR by the operator; Devin lists the step under "Deferred / blocked" as "not run (paid)". No acceptance item depends on it.
- **LCP:** `tests/lcp.spec.ts` (the `prod` project) takes the median of 5 cold contexts on `/admin` (webdriver, so the boot is skipped). The median of each context's last `largest-contentful-paint` entry `startTime` must be ≤ 1800 ms (bible §10.1.10). It is enforced in every run of `test:prod`. Measured on 845147c: samples of 120–280 ms, median 132 ms, with the logo image as the LCP element.

```ts
// dashboard/tests/lcp.spec.ts — unconfigured /admin on a local production build (edge-only), desktop, median LCP ≤ 1800 ms.
import { test, expect } from './helpers/test'
import { url } from './helpers/routes'
import { installProbes, qa } from './helpers/probes'

test('LCP /admin ≤ 1800 ms (median of 5 cold contexts)', async ({ browser, baseURL }, info) => {
  const samples: number[] = []
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }) // empty cache every run
    const page = await context.newPage()
    await installProbes(page)
    await page.goto(url('/admin', 'none'), { waitUntil: 'load' })  // webdriver: the boot skips itself (gate 4)
    await page.waitForTimeout(3_000)
    samples.push((await qa(page)).lcp)
    await context.close()
  }
  samples.sort((a, b) => a - b)
  await info.attach('lcp-ms', { body: samples.map((s) => s.toFixed(0)).join(', '), contentType: 'text/plain' })
  expect(samples[0]).toBeGreaterThan(0)
  expect(samples[2]).toBeLessThanOrEqual(1_800)
})
```

- **Bundles:** §15.2.

### 15.7 Reduced motion, reduced transparency and increased contrast

| Preference | How it is emulated | Verified on Chromium 1194 / Playwright 1.56.1 |
|---|---|---|
| `prefers-reduced-motion: reduce` | Playwright: the `reduced-motion` project (`contextOptions.reducedMotion`) or `page.emulateMedia({ reducedMotion: 'reduce' })` | `matchMedia` matches |
| `prefers-contrast: more` | Playwright 1.56 `page.emulateMedia({ contrast: 'more' })` | `matchMedia` matches |
| `prefers-reduced-transparency: reduce` | Playwright has no option. CDP `Emulation.setEmulatedMedia({ features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })` through `emulatePrefs()` | `matchMedia` matches. The override survives navigations and later `emulateMedia` calls, is per page (a new page starts clear), and **is cleared when its CDP session detaches**, so `media.ts` keeps the session open |

`tests/reduced-media.spec.ts` (the `reduced-motion` project, from M1), together with canvas-audit's zero-rAF test (from M3), §6.16's reduced-motion items and contrast.spec's 12 runs:

```ts
// dashboard/tests/reduced-media.spec.ts — prefers-reduced-motion, prefers-reduced-transparency and prefers-contrast (docs/redesign/spec/15-verification-and-qa.md §15.7).
// Runs in the `reduced-motion` project (context reducedMotion: 'reduce'); the other two preferences are emulated per test.
import type { Page } from '@playwright/test'
import { test, expect } from './helpers/test'
import { gotoRoute } from './helpers/routes'
import { since } from './helpers/env'
import { emulatePrefs, matches } from './helpers/media'

const probe = (page: Page, cls: string) => page.evaluate((c) => {
  const el = document.createElement('div'); el.className = c; el.style.cssText = 'width:40px;height:40px'
  document.body.appendChild(el)
  const cs = getComputedStyle(el); const after = getComputedStyle(el, '::after')
  const out = { bg: cs.backgroundColor, animationName: cs.animationName, animationDuration: cs.animationDuration, afterContent: after.content }
  el.remove(); return out
}, cls)
const cssVar = (page: Page, n: string) => page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), n)

test('reduced motion: skeleton sweep removed, every animation collapses to 1 ms', async ({ page }) => {
  since('1')
  await gotoRoute(page, '/admin/clips')
  expect(await matches(page, '(prefers-reduced-motion: reduce)')).toBe(true)
  expect((await probe(page, 'skeleton-dither')).afterContent).toBe('none')        // docs/redesign/spec/05-foundations.md §5.14
  expect((await probe(page, 'px-resolve')).animationDuration).toBe('0.001s')      // docs/redesign/spec/05-foundations.md §5.2 global reduced-motion rule
})

test('reduced transparency: every surface opaque, veil .80', async ({ page }) => {
  since('1')
  await emulatePrefs(page, { reducedTransparency: 'reduce' })
  await gotoRoute(page, '/admin/clips')
  expect(await matches(page, '(prefers-reduced-transparency: reduce)')).toBe(true)
  for (const n of ['--a-chassis', '--a-panel', '--a-raised', '--a-inset']) expect(await cssVar(page, n), n).toBe('1')
  expect(Number(await cssVar(page, '--dither-veil'))).toBe(0.8)
  for (const s of ['surface-chassis', 'surface-panel', 'surface-raised', 'surface-inset']) {
    expect((await probe(page, s)).bg, s).toMatch(/^rgb\(\d+, \d+, \d+\)$/) // no alpha channel left
  }
})

test('prefers-contrast: more raises text-3 and border-subtle', async ({ page, theme }) => {
  since('1')
  await emulatePrefs(page, { contrast: 'more' })
  await gotoRoute(page, '/admin/clips')
  expect(await matches(page, '(prefers-contrast: more)')).toBe(true)
  const dark = theme === 'dark'
  expect(await cssVar(page, '--c-text-3')).toBe(dark ? '169 182 204' : '57 70 92')
  expect(await cssVar(page, '--c-border-subtle')).toBe(dark ? '90 111 148' : '111 127 155')
})
```

### 15.8 Running the harness in a PR

From `dashboard/`, with `<id>` from §14.2:

```bash
test ! -e .env.local                                     # §1.6 step 0: must succeed before any server or suite starts
npm ci && npx playwright install chromium
npm run lint && npm run typecheck && NEXT_TELEMETRY_DISABLED=1 npm run build
npm run gates -- --milestone <id>
node scripts/checks/appendix-a.mjs                       # from M1 (§15.2 C7)
WZRD_MILESTONE=<id> npm run test:e2e                     # all dev projects + unit; starts next dev unconfigured on 3107
npm run qa:build                                         # unconfigured production build → .qa/build.log
node scripts/checks/route-sizes.mjs --milestone <id> .qa/build.log
WZRD_MILESTONE=<id> npm run test:prod                    # from M4: boot, LCP, routes on next start (edge-only) :3109
WZRD_MILESTONE=<id> WZRD_AFTER=1 npx playwright test tests/visual.spec.ts   # after-screenshots (§15.10)
```

- Run `test:e2e` and `test:prod` one after the other, never at the same time: both use `.next/`.
- Paste into Verification: the last lines of each command, the per-project Playwright summary (`N passed, M skipped`), the gates output, the route-sizes output, and the console rows that `routes.spec` attaches (`npx playwright show-report` → each test's "console" attachment).
- A red run is fixed, not retried: `retries` is 0, and a flaky test is a failure to investigate. The one exception is the boot precondition `t0 ≤ 600` (§6.16): a run whose boot script started later is re-run once, and both outputs are pasted.
- Keep §1.6 alongside: the scripted suites do not replace step 1 (inspecting env names), step 2 (the `/proc/<pid>/environ` check of the server), the manual walk through all 8 routes, or step 5 (the 401 and edge-only curls).

### 15.9 Manual QA script

Automation cannot prove these. Run the steps that apply to the PR's scope, and record each as passed, failed (with a screenshot), or under "Deferred / blocked" with the reason.

1. **Side-by-side review.** Open each after-screenshot next to its §3.6 baseline. Confirm that every visible defect listed in §3.6 for that route is gone, and that nothing else regressed. Write one line per route in the Screenshots table.
2. **Boot in a real browser** (from M4). Use desktop Chrome, not headless, with a fresh profile, at 1440×900:
   1. The first visit shows the POST, the wordmark resolve and the flight into the bug.
   2. A reload inside the same tab shows the 240 ms channel flip.
   3. Pressing ⌘K or Ctrl+K during the POST interrupts it, and the palette opens.
   4. Under the OS reduced-motion setting, the static card shows.
3. **Keyboard only** (from M4). On every route, walk the tab order, with no mouse:
   1. The skip link is first, and the 2 px focus ring is always visible and never clipped by the sticky bars.
   2. No focus trap outside dialogs.
   3. Escape closes every overlay, and focus returns to its trigger.
   4. The §7.12 shortcuts work and do not fire inside text fields.
4. **Screen reader spot check** (from M4; page routes in their milestone). With VoiceOver (macOS) or NVDA (Windows):
   1. The landmarks list as banner, 'Admin sections', main and contentinfo.
   2. Every lamp and LED is announced with its text.
   3. The failed start announces the alert.
   4. `announce()` messages are spoken once.
5. **OS preferences.** Turn on macOS Reduce motion, Reduce transparency and Increase contrast, one at a time. Confirm that loops stop, that surfaces are opaque with the veil at .80, and that text-3 and the borders darken.
6. **Coarse pointer** (from M4). In Chrome DevTools device mode, with touch enabled, at 390×844: every control and every StatusRail button is at least 44 px tall (§5.2, §7.10), and the nav strip scrolls with scroll-snap.
7. **Configured Convex.** Only against a non-production deployment that the user named in writing (§2.1), never the one in `.env.production` or `wrangler.toml`. Confirm loading, empty and NO ACCESS on Clips, Recordings, Characters, Locations and Shotboard. Mark the result "verified live" or "not verified live".
8. **A live Director session. Human operator only; Devin never runs this step** (§1.8 item 3). It is a paid fal call. Devin records it under Verification as "not run (paid)". The operator runs it only with credentials the user provided for this purpose, in a separate session whose server has `FAL_KEY`, never on the §1.6 keyless server.
   1. Record 30 s. 'REC … MB' grows, and 'Stop & save recording' uploads.
   2. Run the §15.6 DevTools Profiler cross-check.
   3. The TallyBar shows PVW, and never ON AIR.
9. **ON AIR** is verified only through the fixture's simulator (§10.5.9 `ds-simulator`, §8.10 C-series). **Never press 'Go live on Twitch' with a real stream key** (§1.6, §16): Twitch output is public.
10. **Brand finals** (M9 `brand`). The contact sheet is reviewed against the §13.10 rubric by a human and by Coast. Devin never approves a likeness (§1.8 item 4).

### 15.10 After-screenshots and the PR Screenshots table

**Naming:**
- The path is `docs/redesign/after/m<id>/<slug>-<theme>-<width>.png`.
  - `<id>` is the §14.2 milestone id: `0`…`9`, `6a` or `6b`.
  - `<slug>` is the route path without its leading slash, with `/` replaced by `_`, the same as the baseline names (`admin`, `admin_shotboard`, `admin_does-not-exist`).
  - `<theme>` is `dark` or `light`, and `<width>` is `1440`, `1280` or `390`.
- `WZRD_AFTER=1` makes `tests/visual.spec.ts` write them from the `desktop-dark`, `desktop-light`, `laptop` and `mobile` projects: full page, CSS animations disabled, the real carrier visible, and the fake clock paused.
- **Other captures** use the same folder and the name `<surface>-<state>-<theme>.png`: `boot-post-dark.png` (M4), `live-fixture-onair-dark.png` (6b), `admin_error-probe-dark-1440.png` (4D), and the brand contact sheets (`brand-placeholders-contact-sheet.png` in 3B, `docs/redesign/after/brand-contact-sheet.png` in M9). Both are written by `npm run brand:check -- --contact-sheet <path>` run from `dashboard/` (§14.9 step 11, §13.10 step 9).
- Commit them in the separate `M<n>: after-screenshots` commit.
- A part commits the captures of every route it changes, in all four projects. The last part of M1, M4 and M9 commits the complete set.

**PR Screenshots table rules** (the §1.4 template):
- One row per changed route × theme × width. The "Route · theme · width" cell reads like `/admin/clips · dark · 1440`.
- **Before** is the §3.6 baseline file when one exists for that route, theme and width:
  - 1440 dark → `docs/redesign/baseline/<slug>-dark.jpg`;
  - 1440 light → `<slug>-light.jpg` (Live Control and Shotboard only);
  - 390 → `<slug>-mobile.jpg` (Live Control, Shotboard and Characters only).
  - Otherwise, Before is the previous milestone's after-screenshot, for example `docs/redesign/after/m3/admin_clips-dark-1280.png`.
- **After** is the new file's path. Embed it as `![](https://github.com/gratitude5dee/5dee-tv/blob/<branch>/<path>?raw=true)`, so the reviewer sees it inline (§13.10 uses the same form).
- Add one more row per changed regression snapshot: `tests/__screenshots__/<project>/<file>` → `expected: <cause>`.
- A PR with no rendered change carries the single row "n/a — no rendered change", plus the evidence (M0, 8A).

### 15.11 Acceptance criteria

Working directory (§1.5): commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`.

- [ ] After 1A: every file in §15.1 exists. `node -p "const p=require('./package.json');[p.devDependencies['@playwright/test'],p.devDependencies['@axe-core/playwright'],p.overrides['playwright-core']].join(' ')"` prints `1.56.1 4.13.0 1.56.1`, and `npm ls playwright-core` lists only 1.56.1.
- [ ] `git diff main...HEAD -- package.json` adds nothing under `"dependencies"` (D8), and `npm run typecheck` checks `tests/tsconfig.json`.
- [ ] 1A: `WZRD_MILESTONE=0 npm run test:e2e` has 0 failed on the 1A branch, and two consecutive `npx playwright test tests/visual.spec.ts` runs pass without `--update-snapshots`.
- [ ] 1A mutation proofs, pasted and not committed. In each case, revert the injected change afterwards:
  1. Adding `className="text-violet-500"` to any component makes `npm run gates -- --milestone 1` print `FAIL` for G1 and exit 1.
  2. Adding `useEffect(() => { console.log('qa') }, [])` to `app/admin/clips/page.tsx` makes routes.spec fail on `/admin/clips`, with `log: qa` listed.
  3. Setting light `--c-text-3` to `120 130 150` (from 1B) fails contrast.spec, and `npx playwright test --project=unit` fails `tests/unit/ledger.spec.ts` when its `DARK['--c-text-3']` is set to `60 66 80`.
- [ ] `bash scripts/checks/grep-gates.sh --milestone 0` run on the 1A branch prints the §15.3 "Post-D1 (M0 head)" column and exits 0.
- [ ] `node scripts/checks/appendix-a.mjs` exits 0 on the 1A branch, and replacing one preserved string with text that does not contain it (for example 'Send direction' → 'Send prompt' in `components/DirectorPlayer.tsx`) makes it exit 1 and name that fragment (reverted afterwards, not committed). The check matches substrings, so an edit that keeps the old string inside the new one ('Send directions') still passes.
- [ ] `node scripts/checks/route-sizes.mjs --milestone 0 .qa/build.log` exits 0 on the 1A branch, and `--milestone 5` on that same build fails on three.js and gsap in `/admin` (proving the leak check).
- [ ] Every PR from 1A on pastes the §15.8 outputs, starting with `test ! -e .env.local`. `git ls-files test-results playwright-report .qa` prints nothing.
- [ ] No spec in `tests/` calls `test.only`, and `forbidOnly: true` is set. No spec uses `mask:` on the carrier host (`grep -rn "mask:" tests` prints nothing).
- [ ] Every spec that clicks 'Start Director' installs the `**/api/fal/**` 401 stub first: `grep -l "name: 'Start Director'" tests/*.spec.ts | xargs -r grep -L "api/fal"` prints nothing.
- [ ] From M4, `WZRD_MILESTONE=<id> npm run test:prod` passes, including LCP ≤ 1800 ms and the boot removed by 1617 ms after navigation start (1600 ms at 60 Hz plus at most one frame) with CLS 0.
- [ ] The M9 sweep runs every project with `WZRD_MILESTONE=9` and `npm run gates -- --milestone 9`, with 0 failed and 0 gate failures.
