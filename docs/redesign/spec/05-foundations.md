> **Spec chapter §5 — Foundations.** Part of the [`goal.md`](../../../goal.md) spec for the stream.wzrd.tech admin redesign ("PIXEL INSTRUMENT"). Same authority as `goal.md` (§1.2). Cross-references "§N.M" resolve through the Chapter map in `goal.md`. Line references are as of commit `845147c`.

## 5. Foundations

This section implements bible §2–§3 with corrections C1–C16 (§4.4.5). Repo facts and line references are as of `845147c`. Paths are repo-relative. The `.mjs` scripts below run on the baseline Node 22.22.2, and they import `lib/*.ts` directly through Node's built-in type stripping (verified).

**Where this section lands.** §14 is the only source of milestone and part placement. This table names the §14 parts that carry this section's work:

| Part | Lands from this section |
|---|---|
| 1B (tokens and cascade) | §5.1–§5.19, **except**: `app/fonts.ts`; the `fontFamily` and `fontWeight` keys (keep today's `tailwind.config.js:116-128` values until M2); deleting `@font-face` (moved verbatim to `app/styles/fonts-legacy.css` for 1B only); codemods 1, 2, 9 and 10. Adds `postcss-import`. Runs codemods 3–8, including the `TrackManager.tsx:144` backdrop and the `MorphSlider.css` backdrop removal and violet retint (§5.10). Expected screenshot diffs: violet→chrome, token surfaces, radii, and body text weight 300→400. |
| M2 (typography) | §5.20 in full: `app/fonts.ts`, the `html`/`body` font classes, the `fontFamily`/`fontWeight` keys, deleting `fonts-legacy.css`, codemods 1–2 plus hand re-weighting, the uppercase allowlist, `lib/format.ts` (the §5.20.4 helpers), the lucide allowlist file. |
| 5A (controls) | Codemod 9 (spinners → `<BayerSpinner/>`). `scripts/checks/lucide.mjs` passes from here on. |
| M6–M8 (pages) | Codemod 10 (greys → semantic tokens), page by page. Each §5.18 shim is deleted with its last call site, except `.pixel-card*`. |
| M9 `sweep` | The deprecated `fal-*` aliases are deleted. Every §5.21 gate returns 0. |

All counts below assume part 0A (D1 dead-code removal) has merged.

### 5.1 Files, build pipeline and CSS layering

| Path | Status | Contents | Allowed top-level nodes |
|---|---|---|---|
| `dashboard/postcss.config.js` | changed | `postcss-import` first | — |
| `dashboard/package.json` | changed | `"devDependencies": { "postcss-import": "15.1.0" }` (dev-only; justify under D8 in the PR: it is already installed through tailwindcss 3.4.17) | — |
| `dashboard/app/globals.css` | rewritten | import list only | `@import` |
| `dashboard/app/styles/tokens.css` | new | every global custom property (the `--bayer-*` tiles excepted), plus the global reduced-motion rule, `scroll-padding` and the base element rules (§5.2) | `@layer base` |
| `dashboard/app/styles/bayer.css` | new, generated | 16 mask tiles (§5.13) | `@layer base` |
| `dashboard/app/styles/keyframes.css` | new | every `@keyframes` except the `boot-*` keyframes (§5.14) | `@keyframes` |
| `dashboard/app/styles/components.css` | new | carrier classes and legacy shims (§5.14, §5.18) | `@layer components` |
| `dashboard/app/styles/shell.css` | new (4B); owned by §7.8 | command bar, nav and route-progress rules | `@layer components` |
| `dashboard/app/styles/live-control.css` | new (8B); owned by §8.4.1 | Live Control surface rules | `@layer components` |
| `dashboard/app/styles/shotboard.css` | new (9B); owned by §9.4.1 | Shotboard surface rules | `@layer components` |
| `dashboard/app/styles/studio.css` | new (10C); owned by §10.4.1 | Characters and Locations surface rules | `@layer components` |
| `dashboard/app/styles/library.css` | new (11A); owned by §11.A.4 | Clips and Recordings surface rules | `@layer components` |
| `dashboard/app/styles/analytics.css` | new (11C); owned by §11.C.4 | Twitch Analytics surface rules | `@layer components` |
| `dashboard/app/styles/utilities.css` | new | custom utilities (§5.14) | `@layer utilities` |
| `dashboard/app/styles/fonts-legacy.css` | 1B only | `globals.css:5-46` verbatim | `@font-face` |
| `dashboard/tailwind.config.js` | rewritten | §5.15 | — |
| `dashboard/lib/utils.ts` | rewritten | §5.17 | — |
| `dashboard/lib/motion/tokens.ts` | new | §5.12 | — |
| `dashboard/lib/format.ts` | new (M2) | §5.20.4 | — |
| `dashboard/app/fonts.ts` | new (M2) | §5.20.1 | — |
| `dashboard/scripts/gen-bayer.mjs` | new | §5.13 | — |
| `dashboard/scripts/codemods/foundations.mjs` | new | §5.19 | — |
| `dashboard/scripts/checks/{css-layers,cn,uppercase,lucide,format}.mjs`, `uppercase-allowlist.txt`, `lucide-allowlist.txt` | new | §5.17, §5.20.4, §5.20.5, §5.20.6, §5.21 | — |

`dashboard/postcss.config.js`:

```js
module.exports = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

`dashboard/app/globals.css` (the final file):

```css
/* dashboard/app/globals.css — import order is load-bearing. postcss-import inlines every file before Tailwind runs. Nothing else lives here. */
@import 'tailwindcss/base';
@import './styles/tokens.css';
@import './styles/bayer.css';
@import './styles/keyframes.css';
@import 'tailwindcss/components';
@import './styles/components.css';
@import './styles/shell.css';
@import './styles/live-control.css';
@import './styles/shotboard.css';
@import './styles/studio.css';
@import './styles/library.css';
@import './styles/analytics.css';
@import 'tailwindcss/utilities';
@import './styles/utilities.css';
```

- The 1B file has none of the six surface lines. In 1B only, add `@import './styles/fonts-legacy.css';` directly after the `tokens.css` line; M2 removes it.
- The PR that creates each surface file adds its line at the position shown: `shell.css` 4B, `live-control.css` 8B, `shotboard.css` 9B, `studio.css` 10C, `library.css` 11A, `analytics.css` 11C. postcss-import fails the build on a missing file, so a line never lands before its file.

> Note: the bible's order (bible §2.1) breaks `next build`. A scratch build of Next 15.5.2 failed with "`@layer base` is used but no matching `@tailwind base` directive is present". The order above, with `postcss-import`, builds and emits base → components → custom utilities → variants (verified).

**Delete from today's `app/globals.css`**, with line references:
- `:5-46` `@font-face` ×5. In 1B they move verbatim into `fonts-legacy.css`; M2 deletes them.
- `:48-63` the shadcn `:root` variables.
- `:65-67` `* {border-color}` and `:87-89` `.dark * {border-color}`. `borderColor.DEFAULT` replaces them.
- `:69-75` `body`.
- `:78-80` `.dark {color-scheme}`.
- `:82-85` `.dark body`.
- `:91-101` `.dark .fal-card*`.
- `:103-105` `.dark .btn-secondary`.
- `:107-117` `.dark .metric-label`, `.dark .progress-bar`, `.dark .terminal`.
- `:119-138` `.status-*`.
- `:157-164` `.metric-*`.
- `:166-180` `.fade-in` and `@keyframes fadeIn`. `layout.tsx:64` becomes inert and is removed with the shell in 4B.
- `:182-194` `.progress-*` and `.terminal`.
- `:196-210` entirely (`.btn-primary`, `.btn-secondary`, `.fal-button-*` and the `.dark` duplicate). The `.fal-button-*` shims are rewritten from §5.14, not moved.
- `:225-227` `.connection-connecting`.
- These are rewritten in `components.css` as shims (§5.14, §5.18): `:140-155` `.fal-card*`, `:212-224` `.connection-indicator|connected|disconnected`, `:229-244` `.pixel-card*`.

**Rules:**
- Every `@keyframes` is defined only in `app/styles/keyframes.css`. The one exception is the inline `BOOT_CSS`, which owns every `boot-*` keyframe (§6.2.13).
- There is never an un-layered style rule.
- Global custom properties (set on `:root` or `html`) live only in `tokens.css` (and the generated `--bayer-*` tiles in `bayer.css`). Element-scoped custom properties (for example `.bayer-spinner { --p }`) live in the stylesheet that owns the element.
- Every surface stylesheet (`shell.css` … `analytics.css`) contains only `@layer components` plus comments.
- Never `@apply sq`.
- Do not create a `.css` file other than those in this table, the vendored `components/reactbits/*.css` (untouched unless a section says otherwise), `components/effects/{SelectionBrackets,HoloCard}.module.css` (§12) and the inline `BOOT_CSS` (§6). Those two `.module.css` files are the only CSS modules.

### 5.2 `tokens.css` (authoritative, verbatim)

```css
/* dashboard/app/styles/tokens.css — every global custom property (the generated --bayer-* tiles live in bayer.css). Channels are space-separated RGB; alphas live in --a-*. */
@layer base {
  :root {
    color-scheme: light;
    --r-xs:4px; --r-sm:6px; --r-md:10px; --r-lg:14px; --r-screen:2px; --r-lamp:1px;
    --h-cmd:48px; --h-navrow:44px; --h-status:24px; --h-slate:48px; --h-strip:28px;
    --h-transport:56px; --h-telemetry:32px; --h-dock:200px; --h-dock-collapsed:36px;
    --h-chrome:var(--h-cmd); --h-offline:0px; --dock-h:var(--h-dock);
    --gutter:16px; --h-control:36px; --h-row:40px; --pad-panel:16px; --fs-body:14px; --lh-body:20px;
    --dur-tick:60ms; --dur-fast:120ms; --dur-resolve:160ms; --dur-base:200ms;
    --dur-slow:320ms; --dur-reveal:480ms; --dur-house:1200ms;
    --ease-out:cubic-bezier(.16,1,.3,1); --ease-in-out:cubic-bezier(.65,0,.35,1);
    --ease-exit:cubic-bezier(.4,0,1,1); --ease-key:cubic-bezier(.3,0,0,1);
    --ease-crt:cubic-bezier(.2,.9,.1,1); --ease-spec:cubic-bezier(.45,0,.2,1);
    --steps-resolve:steps(4,end); --steps-led:steps(2,jump-none); --steps-scan:steps(16,end);
    --steps-sprite:steps(8,end); --steps-sweep:steps(28,end);
    /* invariant materials */
    --c-screen:0 0 0; --c-bezel:11 15 23; --a-hud:.72;
    --c-text-on-screen:232 238 249; --c-text-on-screen-2:169 180 198;
    --c-tally-program:255 59 48; --c-tally-preview:48 209 88; --c-tally-rec:255 122 69;
    --c-tally-cue:255 176 32; --c-tally-standby:140 152 174; --c-tally-off:58 70 89; --c-tally-ink:5 8 15;
    /* light theme */
    --c-canvas:250 250 255; --c-chassis:238 242 249; --a-chassis:.86;
    --c-panel:251 252 254; --a-panel:.86; --c-raised:255 255 255; --a-raised:.96;
    --c-inset:238 242 248; --a-inset:.92; --c-hover:228 234 245; --c-scrim:5 8 15; --a-scrim:.48;
    --c-text-1:10 15 28; --c-text-2:57 70 92; --c-text-3:80 93 115; --c-text-disabled:154 165 184;
    --c-border-subtle:220 227 238; --c-border-strong:183 195 214; --c-border-control:111 127 155;
    --c-accent:45 84 136; --c-accent-hover:34 66 109; --c-accent-press:27 52 87; --c-accent-ink:255 255 255;
    --a-accent-soft:.10; --c-focus:31 74 133;
    --c-success:15 107 50; --c-warning:122 81 0; --c-danger:176 26 21;
    --c-ramp-0:250 250 255; --c-ramp-1:203 216 240; --c-ramp-2:128 161 219; --c-ramp-3:45 84 136; --c-ramp-glint:255 255 255;
    --a-skel:.10;
    --dither-wave:0.5 0.63 0.86; --dither-bg:0.98 0.98 1.0; --dither-speed:0.04; --dither-veil:.60;
    --shadow-e1:inset 0 1px 0 rgb(255 255 255/.9), 0 1px 2px rgb(16 24 40/.06);
    --shadow-e2:inset 0 1px 0 rgb(255 255 255/1), 0 16px 40px -8px rgb(16 24 40/.14);
    --shadow-e3:inset 0 1px 0 rgb(255 255 255/1), 0 16px 40px -8px rgb(16 24 40/.14), 0 0 0 1px rgb(var(--c-border-strong));
    --shadow-key:inset 0 1px 0 rgb(255 255 255/1), 0 1px 0 rgb(16 24 40/.14);
    --shadow-key-pressed:inset 0 1px 2px rgb(16 24 40/.18);
  }
  @media (min-width:768px){ :root{ --gutter:24px; } }
  @media (min-width:1440px){ :root{ --gutter:32px; } }
  @media (max-width:767px){ :root{ --h-chrome:calc(var(--h-cmd) + var(--h-navrow)); } }
  :root[data-offline]{ --h-offline:36px; }
  :root[data-dock="collapsed"]{ --dock-h:var(--h-dock-collapsed); }
  .dark {
    color-scheme: dark;
    --c-canvas:5 8 15; --c-chassis:7 11 20; --a-chassis:.84;
    --c-panel:11 17 29; --a-panel:.86; --c-raised:17 26 42; --a-raised:.94;
    --c-inset:4 7 13; --a-inset:.92; --c-hover:24 35 58; --c-scrim:2 4 8; --a-scrim:.64;
    --c-text-1:232 238 249; --c-text-2:169 182 204; --c-text-3:133 147 171; --c-text-disabled:74 86 107;
    --c-border-subtle:26 36 54; --c-border-strong:43 58 85; --c-border-control:90 111 148;
    --c-accent:122 165 224; --c-accent-hover:156 192 240; --c-accent-press:94 143 212; --c-accent-ink:5 8 15;
    --a-accent-soft:.14; --c-focus:156 192 242;
    --c-success:52 210 123; --c-warning:245 184 61; --c-danger:255 107 107;
    --c-ramp-0:5 8 15; --c-ramp-1:29 49 96; --c-ramp-2:51 87 168; --c-ramp-3:122 165 224; --c-ramp-glint:232 238 249;
    --a-skel:.16;
    --dither-wave:0.2 0.34 0.66; --dither-bg:0.02 0.03 0.06; --dither-speed:0.04; --dither-veil:.45;
    --shadow-e1:inset 0 1px 0 rgb(255 255 255/.05);
    --shadow-e2:inset 0 1px 0 rgb(255 255 255/.06), 0 16px 40px -8px rgb(0 0 0/.55);
    --shadow-e3:inset 0 1px 0 rgb(255 255 255/.06), 0 16px 40px -8px rgb(0 0 0/.55), 0 0 0 1px rgb(var(--c-border-strong));
    --shadow-key:inset 0 1px 0 rgb(255 255 255/.08), 0 1px 0 rgb(0 0 0/.6);
    --shadow-key-pressed:inset 0 1px 2px rgb(0 0 0/.45);
  }
  [data-density="compact"]{ --h-control:32px; --h-row:32px; --pad-panel:12px; --fs-body:13px; --lh-body:18px; }
  @media (pointer:coarse){ :root, [data-density]{ --h-control:44px; } }
  @media (pointer:coarse){ :root{ --h-status:44px; } }
  :root[data-broadcast="connecting"]{ --dither-speed:0.055; }
  :root[data-broadcast="on-air"]{ --dither-speed:0.02; --dither-veil:.72; }
  :root.dark[data-broadcast="on-air"]{ --dither-veil:.62; }
  @media (prefers-reduced-transparency:reduce){
    :root, :root.dark, :root[data-broadcast], :root.dark[data-broadcast]{
      --a-chassis:1; --a-panel:1; --a-raised:1; --a-inset:1; --dither-veil:.80; }
  }
  @media (prefers-contrast:more){
    :root:not(.dark){ --c-border-subtle:111 127 155; --c-text-3:57 70 92; }
    :root.dark{ --c-border-subtle:90 111 148; --c-text-3:169 182 204; }
  }
  body { background: rgb(var(--c-canvas)); color: rgb(var(--c-text-1)); font-weight: 400;
         font-feature-settings: "rlig" 1, "calt" 1; }
  body, :where(body [data-density]) { font-size: var(--fs-body); line-height: var(--lh-body); }
  :focus-visible { outline: 2px solid rgb(var(--c-focus)); outline-offset: 2px; }
  :where(.bg-screen, .bg-bezel, .surface-hud) :focus-visible { outline-color: rgb(var(--c-text-on-screen)); }
  html { scroll-padding-top: calc(var(--h-chrome) + var(--h-offline) + 8px); scroll-padding-bottom: calc(var(--h-status) + 8px); }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:1ms !important; animation-iteration-count:1 !important;
      transition-duration:1ms !important; scroll-behavior:auto !important; }
  }
}
```

> Note: this adds six things to the bible's file. (1) `--fs-body`/`--lh-body`, which implement the density table (C13). (2) The `body, :where(body [data-density])` font rule. It deliberately excludes `html`, so `1rem` stays 16 px, and `:where()` gives the density-root selector zero specificity, so a `text-*` class on a `data-density` root still wins. (3) The global reduced-motion block from bible §5.10, which §6 relies on. It is the only global reduced-motion rule. (4) The chrome offsets `--h-chrome`, `--h-offline` and `--dock-h`, driven by `html[data-offline]` and `html[data-dock]` (§5.8, §7.6). (5) The 44 px coarse-pointer `--h-status`. (6) The on-screen focus colour for controls inside screen, bezel and HUD materials (§5.6).

### 5.3 Colour tokens

Every colour token is a set of space-separated RGB channels, and alphas live in `--a-*`. Use a surface translucently through its `surface-*` utility, or opaquely as `bg-{name}`. Never use `bg-panel/86`.

| Token | Light (`:root`) | Dark (`.dark`, primary) | Tailwind | Use |
|---|---|---|---|---|
| `--c-canvas` | 250 250 255 `#FAFAFF` | 5 8 15 `#05080F` | `bg-canvas` | Page background. Equals the Dither background. |
| `--c-chassis` / `--a-chassis` | 238 242 249 `#EEF2F9` / .86 | 7 11 20 `#070B14` / .84 | `surface-chassis` | Command bar, rails, status rail |
| `--c-panel` / `--a-panel` | 251 252 254 `#FBFCFE` / .86 | 11 17 29 `#0B111D` / .86 | `surface-panel` | Panels and cards |
| `--c-raised` / `--a-raised` | 255 255 255 / .96 | 17 26 42 `#111A2A` / .94 | `surface-raised` | Popovers, palette, dialogs, secondary keys |
| `--c-inset` / `--a-inset` | 238 242 248 `#EEF2F8` / .92 | 4 7 13 `#04070D` / .92 | `surface-inset` | Inputs, wells, telemetry (always nested in a panel) |
| `--c-hover` | 228 234 245 `#E4EAF5` | 24 35 58 `#18233A` | `bg-hover` | Hover and pressed row fill (opaque) |
| `--c-scrim` / `--a-scrim` | 5 8 15 / .48 | 2 4 8 / .64 | `bg-scrim/[var(--a-scrim)]` | Dialog backdrop (no blur) |
| `--c-screen` | 0 0 0 | 0 0 0 | `bg-screen` | Monitor and media screens (invariant) |
| `--c-bezel` / `--a-hud` | 11 15 23 `#0B0F17` / .72 | same | `bg-bezel`, `surface-hud` | Lamp housings, monitor frame, HUD plates (invariant) |
| `--c-text-on-screen` | 232 238 249 | same | `text-fg-on-screen` | Text on the bezel or HUD plates (invariant) |
| `--c-text-on-screen-2` | 169 180 198 | same | `text-fg-on-screen-2` | Secondary text on the **solid** bezel or on `bg-screen` only, never on a HUD plate |
| `--c-text-1` | 10 15 28 `#0A0F1C` | 232 238 249 `#E8EEF9` | `text-fg` (= `text-fg-1`) | Primary text |
| `--c-text-2` | 57 70 92 `#39465C` | 169 182 204 `#A9B6CC` | `text-fg-2` | Secondary text |
| `--c-text-3` | 80 93 115 `#505D73` | 133 147 171 `#8593AB` | `text-fg-3` | Tertiary text, hints, meta |
| `--c-text-disabled` | 154 165 184 | 74 86 107 | `text-fg-disabled` | Disabled text. Exempt from contrast, and never carries meaning alone. |
| `--c-border-subtle` | 220 227 238 | 26 36 54 | `border` (default), `border-line-subtle` | Panel borders, dividers |
| `--c-border-strong` | 183 195 214 | 43 58 85 | `border-line-strong` | Popover and dialog rings, strong dividers |
| `--c-border-control` | 111 127 155 | 90 111 148 | `border-line-control` | Input, switch and checkbox edges (at least 3:1) |
| `--c-accent` | 45 84 136 `#2D5488` | 122 165 224 `#7AA5E0` | `text-accent`, `bg-accent`, `border-accent`; `info` is an alias | Accent text, icons, selected state |
| `--c-accent-hover` | 34 66 109 `#22426D` | 156 192 240 `#9CC0F0` | `*-accent-hover` | |
| `--c-accent-press` | 27 52 87 `#1B3457` | 94 143 212 `#5E8FD4` | `*-accent-press` | |
| `--c-accent-ink` | 255 255 255 | 5 8 15 | `text-accent-ink` | Text on an accent fill |
| `--a-accent-soft` | .10 | .14 | `bg-accent-soft` | Selected rows and chips, always with a second cue: the 1 px `border-accent` (§5.9) or a check glyph |
| `--c-focus` | 31 74 133 `#1F4A85` | 156 192 242 `#9CC0F2` | global `:focus-visible` | 2 px focus outline |
| `--c-success` | 15 107 50 `#0F6B32` | 52 210 123 `#34D27B` | `text-success` | |
| `--c-warning` | 122 81 0 `#7A5100` | 245 184 61 `#F5B83D` | `text-warning` | Advisory only, never an error |
| `--c-danger` | 176 26 21 `#B01A15` | 255 107 107 `#FF6B6B` | `text-danger`, `border-danger` | Outline and text only, never a fill |
| `--c-tally-program` | 255 59 48 `#FF3B30` | same | `bg-tally-program` | ON AIR fill and program keyline (invariant) |
| `--c-tally-preview` | 48 209 88 `#30D158` | same | `bg-tally-preview` | PVW fill |
| `--c-tally-rec` | 255 122 69 `#FF7A45` | same | `border-tally-rec`, `text-tally-rec` | REC ring and text, never a fill |
| `--c-tally-cue` | 255 176 32 `#FFB020` | same | `border-tally-cue` | CUE ring and text (steady) |
| `--c-tally-standby` | 140 152 174 `#8C98AE` | same | `border-tally-standby` | STBY ring |
| `--c-tally-off` | 58 70 89 `#3A4659` | same | `border-tally-off` | Unlit lamp ring. Decorative; the label carries state. |
| `--c-tally-ink` | 5 8 15 | same | `text-tally-ink` | Label on lit program and preview fills |
| `--c-ramp-0…3` | 250 250 255 · 203 216 240 · 128 161 219 · 45 84 136 | 5 8 15 · 29 49 96 · 51 87 168 · 122 165 224 | `bg-ramp-0…3` | Brand pixel ramp: sprites, skeletons, fields, boot. `ramp-2` equals the wave colour in both themes. |
| `--c-ramp-glint` | 255 255 255 | 232 238 249 | `bg-ramp-glint` | Single-pixel glints only |
| `--a-skel` | .10 | .16 | (`.skeleton-dither`) | Skeleton ink alpha |

**Chrome primitive scale** (`chrome-*`, for art and charts only): 50 #EFF4FC · 100 #DCE7F8 · 200 #BCD2F2 · 300 #9CC0F0 · 400 #7AA5E0 · 500 #4F83CC · 600 #3A6AB0 · 700 #2D5488 · 800 #1F3A63 · 900 #142440 · 950 #0B1426.

**Usage rules:**
- Alpha modifiers on token colours are allowed (`bg-accent/20`, `border-white/[.08]` on bezel housings), except on the four surface colours (§4.2 principle 2).
- `ring-inset` is banned, because the colour name `inset` makes it also set a ring colour (C6).
- Tailwind's default palette stays defined because dither-kit uses stock `gray-*`. App code uses raw palette hues (`red-*`, `amber-*`, `violet-*`…) only until its page migrates. They are gated to 0 in M9 (§15).

### 5.4 Colour laws

1. A solid red fill appears only on the ON AIR lamp and the 2 px program keyline. `bg-danger`, `bg-red-*` and `bg-tally-rec` are never used.
2. Every lamp and every LED shows a text label. Colour is never the only signal.
3. Lamps always sit in bezel housings, so tally colours are identical in both themes.
4. The only hues besides the accent are the tally and status colours. Icons never get colour chips (no `bg-*/10 text-*` icon wells).
5. No text sits directly on the carrier or veil except display text of 24 px or more in `text-fg`. Controls and focus rings never sit on the veil.

### 5.5 Carrier tokens and `html` state attributes

The shader constants never change: `waveFrequency 2.6`, `waveAmplitude 0.4`, `colorNum 4`, and a visual `pixelSize 2`. The 2 px size comes from rendering at `renderScale 0.5` with a shader `pixelSize` of 1 and `image-rendering: pixelated` (§12).

| Variable | Light | Dark |
|---|---|---|
| `--dither-wave` (0–1 RGB, the exact existing values, `DitherBackground.tsx:28`) | `0.5 0.63 0.86` (#80A1DB) | `0.2 0.34 0.66` (#3357A8) |
| `--dither-bg` (`DitherBackground.tsx:29`) | `0.98 0.98 1.0` (#FAFAFF) | `0.02 0.03 0.06` (#05080F) |
| `--dither-speed`, standby (idle and preview) | 0.04 | 0.04 |
| `--dither-speed`, Tuning (`data-broadcast="connecting"`) | 0.055 | 0.055 |
| `--dither-speed`, ON AIR (`data-broadcast="on-air"`) | 0.02 | 0.02 |
| `--dither-veil`, standby and Tuning | .60 | .45 |
| `--dither-veil`, ON AIR (house lights down) | .72 | .62 |
| `--dither-veil`, `prefers-reduced-transparency: reduce` | .80 | .80 |

- DitherBackground reads `--dither-wave`, `--dither-bg` and `--dither-speed` with `getComputedStyle(document.documentElement)` when the theme or state changes, and tweens its uniforms (§12).
- The veil is the pure-CSS `.dither-veil` element inside the DitherBackground host (§5.14). Its opacity transition is `--dur-house` `--ease-in-out`.
- If WebGL fails, the host gets `.dither-fallback`: a static 25% Bayer field in `ramp-2` over the canvas colour.

**`html` state attributes.** The `<html>` state attributes, their values and single writers: §7.6.

### 5.6 Contrast ledger and `tests/contrast.spec.ts`

**Method.** For every pair, the ratio is the **minimum over every pixel the carrier can render** (F1), computed as:
- veil = `--c-canvas` at `--dither-veil` over the pixel;
- chassis, panel, raised = the surface at its `--a-*` over the veil;
- inset = inset at `--a-inset` over the **panel** composite (inputs always sit inside panels);
- hover = `--c-hover` (opaque);
- dialog = raised over (scrim at `--a-scrim` over the veil);
- accent-soft = accent at `--a-accent-soft` over the panel composite;
- HUD plate = bezel at `--a-hud` over `#FFFFFF` (the worst screen content);
- the ratio is WCAG 2.x.

For text on the theme surfaces, the minimising pixel is `#5555AA` in both themes.

The values below are floored to 2 decimals. "Min" is the assertion threshold.

| Pair | Dark | Light | Min |
|---|---|---|---|
| Veil composite over the worst pixel | #313264 | #B8B8DD | — |
| text-1 on chassis / panel / raised / inset / hover | 16.06 / 15.48 / 14.69 / 17.18 / 13.45 | 15.89 / 17.20 / 18.68 / 17.03 / 15.83 | 4.5 |
| text-2 on the same | 9.13 / 8.80 / 8.35 / 9.77 / 7.64 | 7.91 / 8.56 / 9.30 / 8.48 / 7.88 | 4.5 |
| text-3 on the same (worst case is hover) | 6.02 / 5.80 / 5.50 / 6.44 / **5.04** | 5.53 / 5.98 / 6.50 / 5.93 / **5.51** | 4.5 |
| text-1 / 2 / 3 on dialog (raised over scrim) | 14.99 / 8.52 / 5.62 | 18.13 / 9.03 / 6.31 | 4.5 |
| accent on chassis / panel / raised / inset / hover | 7.38 / 7.11 / 6.75 / 7.89 / 6.18 | 6.38 / 6.90 / 7.50 / 6.83 / 6.35 | 4.5 |
| success on the same | 9.49 / 9.14 / 8.67 / 10.15 / 7.94 | 5.50 / 5.96 / 6.47 / 5.90 / 5.48 | 4.5 |
| warning on the same | 10.52 / 10.14 / 9.62 / 11.25 / 8.80 | 5.80 / 6.28 / 6.82 / 6.22 / 5.78 | 4.5 |
| danger on the same | 6.74 / 6.50 / 6.16 / 7.21 / 5.64 | 5.80 / 6.28 / 6.82 / 6.22 / 5.78 | 4.5 |
| text-1 / text-2 / accent on accent-soft | 12.33 / 7.01 / 5.66 | 14.83 / 7.38 / 5.95 | 4.5 |
| accent-ink on accent / accent-hover | 7.90 / 10.69 | 7.67 / 10.15 | 4.5 |
| tally-ink on PGM `#FF3B30` / PVW `#30D158` | 5.64 / 9.91 | same | 4.5 |
| text-on-screen on HUD plate | 6.70 | same | 4.5 |
| text-on-screen-2 on solid bezel / `bg-screen` | 9.16 / 10.03 | same | 4.5 |
| text-1 on bare veil (display text of 24 px or more only) | 10.14 | 9.96 | 3.0 |
| border-control vs chassis / panel / raised / inset / hover | 3.68 / 3.55 / 3.37 / 3.94 / 3.08 | 3.36 / 3.64 / 3.95 / 3.60 / 3.35 | 3.0 |
| focus vs chassis / panel / raised / inset / hover | 10.01 / 9.65 / 9.15 / 10.71 / 8.38 | 7.34 / 7.94 / 8.63 / 7.87 / 7.31 | 3.0 |
| focus inside screen / bezel / HUD plate (outline in `text-on-screen`) | 18.02 / 16.46 / 6.70 | same | 3.0 |
| PGM / REC / CUE / STBY ring vs bezel | 5.40 / 7.41 / 10.48 / 6.59 | same | 3.0 |
| Bezel housing vs light chassis | — | 15.94 | 3.0 |

**Rules derived from the ledger:**
- Accent text is never placed on HUD plates: 3.08 (dark accent) and 1.01 (light accent). Use `text-fg-on-screen` there.
- `text-fg-on-screen-2` is allowed only on the solid bezel (9.16) and on `bg-screen` (10.03), never on a HUD plate (3.73).
- Focus rings never sit directly on the veil. Light focus against the raw pixel is 1.37.
- Controls inside screen, bezel or HUD materials take the on-screen focus colour (the `tokens.css` `:where(.bg-screen, .bg-bezel, .surface-hud) :focus-visible` rule). Light `--c-focus` measures 2.37 on the screen and 2.17 on the bezel.
- `bg-accent-soft` never marks state alone: against the panel it measures 1.15 (light) and 1.23 (dark).
- The `tally-off` ring (2.00 vs bezel) is decorative only.

> Note: the bible's ledger (bible §2.4) listed the HUD plate at ≈7.9 (recomputed: 6.70), bezel vs light chassis at 17.31 (15.94) and hover 13.54 / 7.70 / 5.07 (13.45 / 7.64 / 5.04). Every pair still passes. The table above is what the test asserts (C9).

**`tests/contrast.spec.ts` computation.** §15 owns the harness. The math is this file:

```ts
// dashboard/tests/lib/contrast.ts — WCAG 2.x math + an exact port of Dither.jsx ditherQuantize (colorNum 4).
export type RGB = [number, number, number] // 0–255
const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
export const ratio = (a: RGB, b: RGB) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
export const over = (top: RGB, alpha: number, below: RGB): RGB => top.map((t, i) => t * alpha + below[i] * (1 - alpha)) as RGB
export const parseChannels = (v: string): RGB => v.trim().split(/\s+/).map(Number) as RGB // '11 17 29'

/** Every colour the carrier can render for a given --dither-wave / --dither-bg (0–1 triplets). */
export function carrierPalette(wave: number[], bg: number[]): RGB[] {
  const out = new Map<string, RGB>()
  const smooth = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }
  for (let i = 0; i <= 1000; i++) {
    const col = bg.map((b, k) => b + (wave[k] - b) * (i / 1000))
    for (let k = 0; k < 64; k++) { // the 64 thresholds of bayerMatrix8x8 are k/64
      let c = col.map((v) => v + (k / 64 - 0.25) / 3)
      const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
      const bias = 0.2 * (1 - smooth(0.45, 0.8, l))
      c = c.map((v) => Math.min(1, Math.max(0, v - bias)))
      const q = c.map((v) => Math.round((Math.floor(v * 3 + 0.5) / 3) * 255)) as RGB
      out.set(q.join(','), q)
    }
  }
  return [...out.values()]
}
/** Worst case of a pair over every carrier pixel: min over the palette of ratio(fg, surface(pixel)). */
export const worst = (fg: RGB, surface: (pixel: RGB) => RGB, palette: RGB[]) => Math.min(...palette.map((p) => ratio(fg, surface(p))))
```

**Test procedure:**
1. The spec loads `/admin?noboot` in Chromium.
2. It reads every `--c-*`, `--a-*`, `--dither-wave`, `--dither-bg` and `--dither-veil` from `getComputedStyle(document.documentElement)`. It never uses hard-coded values.
3. It asserts every "Min" row above.
4. It runs 12 times: theme {light, dark} (localStorage `theme` set by `page.addInitScript` before navigation) × `data-broadcast` {`idle`, `on-air`} (set on `html` by the test) × media {none, `prefers-reduced-transparency: reduce`, `prefers-contrast: more`} (set through the CDP call `Emulation.setEmulatedMedia({ features: [{ name, value }] })`).
5. It fails below 4.5 for text and below 3.0 for non-text and large text.

### 5.7 Radii and squircle

| Token | Value | Squircle value | Tailwind | Use |
|---|---|---|---|---|
| `--r-xs` | 4px | 6px | `rounded-xs` | Badges, tags |
| `--r-sm` | 6px | 10px | `rounded-sm` | Keys, inputs, chips |
| `--r-md` | 10px | 16px | `rounded-md` | Panels, cards |
| `--r-lg` | 14px | 22px | `rounded-lg` | Sheets, dialogs, slates, HoloCard |
| pill | 9999px | never squircled | `rounded-pill` | Pills |
| `--r-screen` | 2px | never squircled | `rounded-screen` | Monitor, frames, thumbnails, media, slate art |
| `--r-lamp` | 1px | never squircled | `rounded-lamp` | LEDs |

**Rules:**
- The squircle is progressive enhancement: the `.sq` rules in `utilities.css` apply only under `@supports (corner-shape: squircle)` (§5.14).
- Primitives always pair `rounded-{xs|sm|md|lg}` with `sq`.
- Never put `sq` on screens, lamps or pills.
- Never use `clip-path` or an SVG mask on a focusable element.
- Never `@apply sq`.
- These keys override Tailwind's `sm` (2 px), `md` (6 px) and `lg` (8 px), so codemod 8 remaps existing call sites (§5.19). dither-kit's own `rounded-md` (2 uses) now renders at 10 px and its `rounded` (3 uses) stays at 4 px. `<Button variant="primary">` passes `rounded-[6px]` to DitherButton (§7).

### 5.8 Spacing, gutters, max widths, chrome heights and density

- **Spacing** uses Tailwind's 4 px scale only: 0.5 (2), 1, 2, 3, 4, 5, 6, 8, 10, 12, 16. Every component dimension is an even number of pixels.
- **Gutters** (`--gutter`): 16 px below 768, 24 px from 768 to 1439, 32 px from 1440. Live Control and Shotboard always use 16 px.
- **Max widths:** library pages use `max-w-[1440px]`. Live Control and Shotboard are full-bleed up to `max-w-[1920px]`.
- **Breakpoints** (§5.15): `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `wide` 1440, `2xl` 1536, `3xl` 1920.

| Variable | Value | Tailwind spacing key | Element |
|---|---|---|---|
| `--h-cmd` | 48 | `cmd` | Command bar |
| `--h-navrow` | 44 | `navrow` | Mobile nav row |
| `--h-chrome` | 48; 92 below 768 (`--h-cmd` + `--h-navrow`) | — | Command bar plus, below 768, the nav row: the offset for sticky tops and `scroll-padding-top` |
| `--h-offline` | 0; 36 while `html[data-offline]` is set | — | OfflineBanner offset (§7.6) |
| `--h-status` | 24; 44 on `(pointer: coarse)` | `status` | Status rail |
| `--h-slate` | 48 | `slate` | Shotboard slate bar |
| `--h-strip` | 28 | `strip` | Monitor label strip and tally bar |
| `--h-transport` | 56 | `transport` | Transport bar |
| `--h-telemetry` | 32 | `telemetry` | Telemetry strip |
| `--h-dock` | 200 | `dock` | Dock, open |
| `--h-dock-collapsed` | 36 | `dock-collapsed` | Dock, collapsed |
| `--dock-h` | 200 / 36 (`--h-dock`, or `--h-dock-collapsed` while `html[data-dock="collapsed"]`) | — | Current dock height |

- Sticky tops below the chrome use `calc(var(--h-chrome) + var(--h-offline))`.
- `--h-banner`, `--sticky-top`, `--chyron-w` and `--chyron-left` do not exist. Never define them.

**Density** is set by `data-density` on `html`, or on a route root that overrides it. It is persisted in localStorage `wzrd:density` and read pre-paint by the head script (§7).

| Token | Comfortable (default) | Compact (forced on the Live Control root and the Shotboard inspector) |
|---|---|---|
| `--h-control` | 36 | 32 |
| `--h-row` | 40 | 32 |
| `--pad-panel` | 16 | 12 |
| `--fs-body` / `--lh-body` (drives `text-body` and default body text) | 14 / 20 | 13 / 18 |

- `(pointer: coarse)` forces `--h-control: 44px`, `--h-status: 44px` and 44 px hit areas.
- **Density never changes while `data-lock="air"` is set.** The switch is disabled and its description says why (§7).

### 5.9 Elevation

There are no coloured glows anywhere.

| Token | Dark | Light | Tailwind |
|---|---|---|---|
| `--shadow-e1` (panels) | `inset 0 1px 0 rgb(255 255 255/.05)` | `inset 0 1px 0 rgb(255 255 255/.9), 0 1px 2px rgb(16 24 40/.06)` | `shadow-e1` |
| `--shadow-e2` (popover, raised) | `inset 0 1px 0 rgb(255 255 255/.06), 0 16px 40px -8px rgb(0 0 0/.55)` | `inset 0 1px 0 #fff, 0 16px 40px -8px rgb(16 24 40/.14)` | `shadow-e2` |
| `--shadow-e3` (dialog, palette) | e2 + `0 0 0 1px rgb(var(--c-border-strong))` | same | `shadow-e3` |
| `--shadow-key` (secondary keys) | `inset 0 1px 0 rgb(255 255 255/.08), 0 1px 0 rgb(0 0 0/.6)` | `inset 0 1px 0 #fff, 0 1px 0 rgb(16 24 40/.14)` | `shadow-key` |
| `--shadow-key-pressed` | `inset 0 1px 2px rgb(0 0 0/.45)` | `inset 0 1px 2px rgb(16 24 40/.18)` | `shadow-key-pressed` |

- **Dialogs** add a 1 px top hairline in `accent` at .6 (`::before`, §7).
- **Dither rule** (separator): `.dither-rule`, 2 px tall, a 50% Bayer mask in `border-strong`.
- **Selected state:** a 1 px accent border plus a 25% Bayer fill of `accent` at .22 (`bg-accent/[.22] bayer-25` on an inner layer).
- Legacy `shadow-sm|lg|xl` (21 live uses after D1) and the violet glow `shadow-[0_18px_50px_rgba(44,20,89,0.18)]` (`TrackManager.tsx:128`) are replaced by the e-tokens when their pages migrate. The glow goes in codemod 4.

### 5.10 Translucency ("glass") policy

- **Blur is 0 everywhere.** `backdrop-filter` is banned.
- Surfaces are translucent only through `--a-*` and `surface-*`. The carrier shows through at 14% on panels.
- Only `surface-inset` may nest inside chassis, panel or raised. Never nest chassis, panel or raised inside one another. Other inner regions use dither rules.
- Overlays (palette, dialog, sheet) use `surface-raised` over `bg-scrim/[var(--a-scrim)]`.
- `prefers-reduced-transparency: reduce` sets every `--a-*` to 1 and `--dither-veil` to .80 (§5.2).
- `prefers-contrast: more` sets `--c-border-subtle` to the `--c-border-control` value and `--c-text-3` to the `--c-text-2` value, per theme (§5.2).

**Existing sites to fix:**
- `components/TrackManager.tsx:144` (`backdrop-blur`): the plate becomes `surface-hud` in codemod 4.
- `components/reactbits/MorphSlider.css` (1B; the violet it carries is retinted in the same edit). Line references as of 845147c:
  - `:39-40` and `:65-66` (`backdrop-filter: blur(10px)` and its `-webkit-` twin): delete.
  - `:6` `background: #0c0c12;` → `background: rgb(var(--c-screen));`.
  - `:37` and `:64` (`rgba(8, 7, 18, …)`) → `background: rgb(var(--c-bezel) / var(--a-hud));`.
  - `:19` → `.morph-slider-stage:focus-visible { box-shadow: inset 0 0 0 2px rgb(var(--c-text-on-screen)); }`.
  - `:74` → `.morph-slider-btn:hover { background: rgb(var(--c-bezel)); border-color: rgb(var(--c-text-on-screen) / .85); }` (the `transform: scale(1.06)` is dropped).
  - `:75` → `.morph-slider-btn:focus-visible, .morph-slider-dot:focus-visible { outline: 2px solid rgb(var(--c-text-on-screen)); outline-offset: 3px; }`.
  - `:98` → `.morph-slider-dot.is-active { width: 22px; background: rgb(var(--c-text-on-screen)); }`.
  - `:44` `text-transform: uppercase;` stays (§5.20.5).
  - Done when `grep -nEi '#ddd6fe|#e9d5ff|196, ?181, ?253|221, ?214, ?254|45, ?31, ?87|#0c0c12|rgba\(8, ?7, ?18|backdrop-filter' components/reactbits/MorphSlider.css` prints nothing (from `dashboard/`; also listed under §5.19 step 4).
- Never pass `variant="frosted-glass"` to the dither-kit Tooltip (`components/dither-kit/tooltip.tsx:13` uses `backdrop-blur-sm`). The default variant is used.
- `components/reactbits/ChromaGrid.css:125-126,158-159` (a grayscale backdrop, not a blur, fixture-only after §9) is the only allowed exception.

> Note: the bible's gate excluded all of `components/reactbits/*.css`, which would have left a live 10 px blur on Live Control (C14).

### 5.11 z-index

| Layer | Value | Tailwind | Layer | Value | Tailwind |
|---|---|---|---|---|---|
| dither | −10 | `z-dither` | scrim | 70 | `z-scrim` |
| raised (sticky in-content bars) | 10 | `z-raised` | dialog (palette, dialog, sheet) | 80 | `z-dialog` |
| bar (command bar, status rail) | 40 | `z-bar` | chyron | 90 | `z-chyron` |
| drawer | 50 | `z-drawer` | tooltip | 100 | `z-tooltip` |
| popover | 60 | `z-popover` | boot | 9999 | `z-boot` |

DitherBackground keeps its literal `-z-10` class, which is an invariant and equals `z-dither`. No other numeric `z-*` value is added.

### 5.12 Motion tokens

§6 defines every usage. These are the only values.

| Duration token | Value | Tailwind | Use |
|---|---|---|---|
| `--dur-tick` | 60ms | `duration-tick` | LED snap, key press |
| `--dur-fast` | 120ms | `duration-fast` | Hover colour, exits, list entry resolve |
| `--dur-resolve` | 160ms | `duration-resolve` | 4×40 ms Bayer resolve |
| `--dur-base` | 200ms | `duration-base` | Nav indicator, toggles, popovers |
| `--dur-slow` | 320ms | `duration-slow` | Sheets, dialogs, raster clear |
| `--dur-reveal` | 480ms | `duration-reveal` | Glint, FLIP |
| `--dur-house` | 1200ms | `duration-house` | Carrier retint and veil |

| Easing token | Value | Tailwind | Use |
|---|---|---|---|
| `--ease-out` | cubic-bezier(.16,1,.3,1) | `ease-out` | Entrances |
| `--ease-in-out` | cubic-bezier(.65,0,.35,1) | `ease-in-out` | Tweens, house lights |
| `--ease-exit` | cubic-bezier(.4,0,1,1) | `ease-exit` | Exits |
| `--ease-key` | cubic-bezier(.3,0,0,1) | `ease-key` | Key press |
| `--ease-crt` | cubic-bezier(.2,.9,.1,1) | `ease-crt` | Boot power-on |
| `--ease-spec` | cubic-bezier(.45,0,.2,1) | `ease-spec` | Glint only |

- **Steps:** `--steps-resolve: steps(4,end)`, `--steps-led: steps(2,jump-none)`, `--steps-scan: steps(16,end)`, `--steps-sprite: steps(8,end)`, `--steps-sweep: steps(28,end)`.
- **Choreography constants:** the stagger is 30 ms per item for at most 8 items; after that, items arrive together. Exits run at 0.66× the entry duration. Travel is at most 4 px, and only for list rows. Text is never scaled.

JavaScript (motion/react, canvas, the ticker) never hard-codes a duration or curve. It imports this mirror:

```ts
// dashboard/lib/motion/tokens.ts — JS mirror of the motion tokens in app/styles/tokens.css.
export const DUR = { tick: 60, fast: 120, resolve: 160, base: 200, slow: 320, reveal: 480, house: 1200 } as const
export const EASE = {
  out: [0.16, 1, 0.3, 1], inOut: [0.65, 0, 0.35, 1], exit: [0.4, 0, 1, 1],
  key: [0.3, 0, 0, 1], crt: [0.2, 0.9, 0.1, 1], spec: [0.45, 0, 0.2, 1],
} as const
export const STAGGER = { stepMs: 30, maxItems: 8 } as const
export const EXIT_RATIO = 0.66
export const MAX_TRAVEL_PX = 4
```

### 5.13 Bayer mask tiles

`app/styles/bayer.css` defines `--bayer-4-00` through `--bayer-4-15`, plus the aliases `--bayer-25` (`-03`), `--bayer-50` (`-07`), `--bayer-75` (`-11`) and `--bayer-100` (`-15`).

- Each tile is `url("data:image/svg+xml;utf8,…")`: an 8×8 px SVG of 2×2 px `<rect>`s with `shape-rendering="crispEdges"`.
- Tile N lights cell (x,y) if and only if `B4[y][x] ≤ N`, using the dither-kit order `B4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]`. The density is therefore (N+1)/16.
- Masks are colourless; the colour comes from `background-color`.
- Consumers always write both `mask-image` and `-webkit-mask-image`, with `mask-size: 8px 8px` and `mask-repeat: repeat`.
- `BAYER8` (used by the boot and SymbolRaster) and `bayerMaskVar(n)` live in `lib/bayer.ts` (§7). dither-kit is never edited.

The file is generated once and committed. The generator also refuses to run if dither-kit's `BAYER4` ever changes:

```js
#!/usr/bin/env node
// dashboard/scripts/gen-bayer.mjs
// Generates app/styles/bayer.css: 16 colourless 8x8 px Bayer mask tiles (2x2 px cells).
// Tile N lights cell (x,y) iff B4[y][x] <= N, so density = (N+1)/16.
// Usage:  node scripts/gen-bayer.mjs          -> (re)writes app/styles/bayer.css
//         node scripts/gen-bayer.mjs --check  -> exit 1 if the committed file differs or B4 drifted from dither-kit
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'app/styles/bayer.css')
const PIXEL_TS = join(root, 'components/dither-kit/pixel.ts')

// Integer ranks of dither-kit BAYER4 (pixel.ts stores (v + 0.5) / 16). Never edit dither-kit.
const B4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

function assertMatchesDitherKit() {
  const src = readFileSync(PIXEL_TS, 'utf8')
  const block = src.match(/export const BAYER4 = \[([\s\S]*?)\]\.map/)
  if (!block) throw new Error('gen-bayer: BAYER4 not found in components/dither-kit/pixel.ts')
  const rows = [...block[1].matchAll(/\[([\d,\s]+)\]/g)].map((m) => m[1].split(',').map((n) => Number(n.trim())))
  if (JSON.stringify(rows) !== JSON.stringify(B4)) throw new Error('gen-bayer: B4 differs from dither-kit BAYER4')
}

const enc = (svg) => svg.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')

function tile(n) {
  let rects = ''
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (B4[y][x] <= n) rects += `<rect x="${x * 2}" y="${y * 2}" width="2" height="2"/>`
  return `url("data:image/svg+xml;utf8,${enc(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" shape-rendering="crispEdges">${rects}</svg>`)}")`
}

function build() {
  const lines = []
  lines.push('/* GENERATED by scripts/gen-bayer.mjs. Do not edit by hand; run `node scripts/gen-bayer.mjs`. */')
  lines.push('/* Tile N lights 2x2 px cell (x,y) of an 8x8 px tile iff B4[y][x] <= N (density (N+1)/16). Colourless: colour comes from background-color. */')
  lines.push('@layer base {')
  lines.push('  :root {')
  for (let n = 0; n < 16; n++) lines.push(`    --bayer-4-${String(n).padStart(2, '0')}: ${tile(n)};`)
  lines.push('    --bayer-25: var(--bayer-4-03);')
  lines.push('    --bayer-50: var(--bayer-4-07);')
  lines.push('    --bayer-75: var(--bayer-4-11);')
  lines.push('    --bayer-100: var(--bayer-4-15);')
  lines.push('  }')
  lines.push('}')
  return lines.join('\n') + '\n'
}

assertMatchesDitherKit()
const css = build()
if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (current !== css) {
    console.error('gen-bayer: app/styles/bayer.css is stale. Run `node scripts/gen-bayer.mjs` and commit.')
    process.exit(1)
  }
} else {
  writeFileSync(OUT, css)
}
```

Verified output: 8,874 bytes. Tiles `-00`, `-03`, `-07`, `-11` and `-15` contain 1, 4, 8, 12 and 16 rects.

### 5.14 `keyframes.css`, `utilities.css` and `components.css` (verbatim)

This is the only text of these three files. §6.15 lists each motion class with its use and its reduced-motion and air-lock behaviour. The global reduced-motion rule lives only in `tokens.css` (§5.2).

```css
/* dashboard/app/styles/keyframes.css — the only place @keyframes are defined, except BOOT_CSS's boot-* keyframes (docs/redesign/spec/06-motion-and-loading.md §6.2.13). Unlayered; imported before components. */
@keyframes px-resolve {
  0%   { -webkit-mask-image: var(--bayer-4-03); mask-image: var(--bayer-4-03); }
  25%  { -webkit-mask-image: var(--bayer-4-07); mask-image: var(--bayer-4-07); }
  50%  { -webkit-mask-image: var(--bayer-4-11); mask-image: var(--bayer-4-11); }
  75%  { -webkit-mask-image: var(--bayer-4-15); mask-image: var(--bayer-4-15); }
  100% { -webkit-mask-image: none; mask-image: none; }
}
@keyframes px-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes appear { to { opacity: 1; } }
@keyframes skeleton-sweep { from { transform: translateX(-66%); } to { transform: translateX(0); } }
@keyframes bayer-blink { 0% { opacity: .15; } 6% { opacity: 1; } 40% { opacity: .35; } 100% { opacity: .15; } }
@keyframes led-stall { from { opacity: 1; } to { opacity: .35; } }
@keyframes scan-step { from { transform: translateY(0); } to { transform: translateY(100%); } }
@keyframes coast-sprite { from { transform: translateX(0); } to { transform: translateX(-100%); } }
@keyframes key-jitter { 0% { transform: translateX(-2px); } 33.333% { transform: translateX(2px); } 66.667% { transform: translateX(0); } }
```

**Keyframe contracts:**
- `px-resolve` has no per-keyframe timing function. `.px-resolve` runs it with `steps(1, end)`, so each quarter holds one tile: 25→50→75→100% over `--px-resolve-dur` (default `--dur-resolve`, 4 × 40 ms; list rows set `--px-resolve-dur: 120ms`, 4 × 30 ms).
- `scan-step` moves a full-size overlay whose 2 px accent line is drawn at its top edge. The frame clips it with `overflow:hidden`.
- `coast-sprite` moves an inner strip that is 800% wide (8 frames) inside a one-frame `overflow:hidden` box; `steps(8,end)` shows frames 0–7.
- `appear` is used only by `.route-fallback`: `appear 1ms linear 150ms forwards` on an element that starts at `opacity: 0` (route loading, §6.3).
- `bayer-blink`: 880 ms `steps(1, end)` infinite, delay `calc(var(--b) * 55ms)` (BayerSpinner).
- `key-jitter`: the Button error state (`[data-btn][data-state="error"]`, §6.9): 180 ms, three 60 ms frames, `steps(1, end)`.
- Every `boot-*` keyframe lives only in `BOOT_CSS` (§6.2.13). This file defines none.

> Note: the bible animated `background-position` for CoastLoader, which bible §10.1.4 forbids. The strip now uses a transform (C10). The bible also put keyframes in the Tailwind config, where they would not be emitted for `.px-resolve` or `.skeleton-dither` (C2).

```css
/* Original implementation inspired by "Pixel Transition" (https://www.reactbits.dev/animations/pixel-transition). No upstream source copied. */
/* Original implementation inspired by "Apple's corners" (https://arlan.me/vault/squircle). No upstream source copied. */
/* dashboard/app/styles/utilities.css — custom utilities (safelisted utilities always emit; variants such as md:, dark:, hover: work). */
@layer utilities {
  /* materials: translucency comes only from --a-* (never an /opacity modifier, never blur) */
  .surface-chassis { background-color: rgb(var(--c-chassis) / var(--a-chassis)); }
  .surface-panel   { background-color: rgb(var(--c-panel) / var(--a-panel)); }
  .surface-raised  { background-color: rgb(var(--c-raised) / var(--a-raised)); }
  .surface-inset   { background-color: rgb(var(--c-inset) / var(--a-inset)); }
  .surface-hud     { background-color: rgb(var(--c-bezel) / var(--a-hud)); }

  /* numerals and mono families for the JBM steps of the type scale */
  .nums { font-variant-numeric: tabular-nums slashed-zero; }
  .text-micro, .text-label, .text-readout, .text-readout-lg, .text-timecode, .text-code {
    font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .text-readout, .text-readout-lg, .text-timecode { font-variant-numeric: tabular-nums slashed-zero; }

  /* Bayer mask presets (colour comes from background-color) */
  .bayer-25, .bayer-50, .bayer-75 { -webkit-mask-size: 8px 8px; mask-size: 8px 8px; -webkit-mask-repeat: repeat; mask-repeat: repeat; }
  .bayer-25 { -webkit-mask-image: var(--bayer-4-03); mask-image: var(--bayer-4-03); }
  .bayer-50 { -webkit-mask-image: var(--bayer-4-07); mask-image: var(--bayer-4-07); }
  .bayer-75 { -webkit-mask-image: var(--bayer-4-11); mask-image: var(--bayer-4-11); }

  /* Resolve: the only way new content appears (4 x 40 ms; list rows set --px-resolve-dur: 120ms, 4 x 30 ms) */
  .px-resolve { -webkit-mask-size: 8px 8px; mask-size: 8px 8px; -webkit-mask-repeat: repeat; mask-repeat: repeat; animation: px-resolve var(--px-resolve-dur, var(--dur-resolve)) steps(1, end) both; }
  @supports not ((mask-image: none) or (-webkit-mask-image: none)) {
    .px-resolve { animation: px-fade var(--dur-fast) linear both; }
  }

  /* Route fallback: invisible for 150 ms (docs/redesign/spec/06-motion-and-loading.md §6.3) */
  .route-fallback { opacity: 0; animation: appear 1ms linear 150ms forwards; }

  /* Skeleton (docs/redesign/spec/06-motion-and-loading.md §6.8): static 25 % field (::before) + stepped 50 % sweep (::after). The host itself is never masked,
     otherwise its mask would clip the sweep to the 25 % cells. */
  .skeleton-dither { position: relative; overflow: hidden; isolation: isolate; border-radius: var(--r-xs); }
  .skeleton-dither::before, .skeleton-dither::after {
    content: ""; position: absolute; top: 0; bottom: 0; left: 0; pointer-events: none;
    background-color: rgb(var(--c-ramp-3) / var(--a-skel));
  }
  .skeleton-dither::before {
    right: 0;
    -webkit-mask: var(--bayer-4-03) 0 0 / 8px 8px repeat; mask: var(--bayer-4-03) 0 0 / 8px 8px repeat;
  }
  .skeleton-dither::after {
    width: 300%; will-change: transform;
    -webkit-mask-image: var(--bayer-4-07), linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent);
            mask-image: var(--bayer-4-07), linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent);
    -webkit-mask-size: 8px 8px, 100% 100%; mask-size: 8px 8px, 100% 100%;
    -webkit-mask-repeat: repeat, no-repeat; mask-repeat: repeat, no-repeat;
    -webkit-mask-composite: source-in; mask-composite: intersect;
    animation: skeleton-sweep 1400ms var(--steps-sweep) infinite;
  }

  /* Separator: 2 px, 50 % Bayer in border-strong */
  .dither-rule { height: 2px; background-color: rgb(var(--c-border-strong));
    -webkit-mask-image: var(--bayer-4-07); mask-image: var(--bayer-4-07);
    -webkit-mask-size: 8px 8px; mask-size: 8px 8px; -webkit-mask-repeat: repeat; mask-repeat: repeat; }

  /* Overflow hints — applied by <ScrollFade> only while the element overflows */
  .edge-fade-x { -webkit-mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
                         mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent); }
  .edge-fade-y { -webkit-mask-image: linear-gradient(180deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
                         mask-image: linear-gradient(180deg, transparent, #000 24px, #000 calc(100% - 24px), transparent); }

  /* Squircle (progressive enhancement). Never on screens, lamps or pills. */
  @supports (corner-shape: squircle) {
    .sq { corner-shape: squircle; }
    .sq.rounded-xs { border-radius: 6px; }
    .sq.rounded-sm { border-radius: 10px; }
    .sq.rounded-md { border-radius: 16px; }
    .sq.rounded-lg { border-radius: 22px; }
  }

  /* BayerSpinner (docs/redesign/spec/07-primitives-and-shell.md §7.3): --b = the square's BAYER4 index 0–15 */
  .bayer-spinner { display: inline-grid; grid-template-columns: repeat(4, var(--p)); grid-auto-rows: var(--p); width: calc(var(--p) * 4); height: calc(var(--p) * 4); }
  .bayer-spinner[data-size="12"] { --p: 3px; --s: 2px; }
  .bayer-spinner[data-size="16"] { --p: 4px; --s: 3px; }
  .bayer-spinner > i { width: var(--s); height: var(--s); background: currentColor;
    animation: bayer-blink 880ms steps(1, end) infinite; animation-delay: calc(var(--b) * 55ms); }

  /* Stalled lamp: 1 Hz, 5 cycles (5 s), then steady. data-steady = stalled without blinking (docs/redesign/spec/06-motion-and-loading.md §6.7, docs/redesign/spec/07-primitives-and-shell.md §7.4) */
  .tally[data-kind="stalled"]:not([data-steady]) .tally-face { animation: led-stall 1000ms var(--steps-led) 5; }

  /* GenerationFrame scanline (docs/redesign/spec/06-motion-and-loading.md §6.6) */
  .gen-scan { position: absolute; inset: 0; pointer-events: none; animation: scan-step 1600ms var(--steps-scan) infinite; }
  .gen-scan::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: rgb(var(--c-accent)); }

  /* CoastLoader (docs/redesign/spec/07-primitives-and-shell.md §7.5): transform-only sprite strip, 8 frames at 10 fps */
  .coast-sprite { width: var(--s); height: var(--s); overflow: hidden; }
  .coast-sprite > i { display: block; width: calc(var(--s) * 8); height: 100%;
    background: url(/brand/loader/coast-boot-strip@2x.png) 0 0 / 100% 100% no-repeat;
    image-rendering: pixelated; animation: coast-sprite 800ms var(--steps-sprite) infinite; }

  /* Button error micro-state (docs/redesign/spec/06-motion-and-loading.md §6.9): three 60 ms frames */
  [data-btn][data-state="error"] { animation: key-jitter 180ms steps(1, end) 1; }

  /* ---------- reduced motion (the global 1 ms rule is in tokens.css) ---------- */
  @media (prefers-reduced-motion: reduce) {
    .px-resolve { animation: none; }   /* .route-fallback keeps its 150 ms delay: a delay is not motion */
    .skeleton-dither::after { content: none; }
    .bayer-spinner > i { animation: none; opacity: .6; }
    .bayer-spinner > i[data-core] { opacity: 1; }
    .tally[data-kind="stalled"] .tally-face, .gen-scan, .coast-sprite > i, [data-btn][data-state="error"] { animation: none; }
  }
  /* ---------- air lock (docs/redesign/spec/06-motion-and-loading.md §6.12) ---------- */
  :root[data-lock="air"] .px-resolve:not([data-air-allow]):not([data-air-allow] *) { animation: none; }
  :root[data-lock="air"] .skeleton-dither::after { content: none; }
  :root[data-lock="air"] .coast-sprite > i { animation: none; }
  :root[data-lock="air"] .gen-scan { animation: none; }
  :root[data-lock="air"] :is(dialog, [data-sheet]) { animation-duration: 0s !important; transition-duration: 0s !important; }
}
```

> Note: the bible's `.skeleton-dither` masked the host itself. A masked host also clips its `::after`, so the 50% sweep could never show. The static field is now on `::before` (C8).

```css
/* dashboard/app/styles/components.css — legacy shims and carrier classes. Utilities always win over these. */
@layer components {
  /* carrier */
  .dither-veil { position: absolute; inset: 0; background: rgb(var(--c-canvas)); opacity: var(--dither-veil);
                 transition: opacity var(--dur-house) var(--ease-in-out); }
  .dither-fallback { background-color: rgb(var(--c-canvas)); }
  .dither-fallback::before { content: ""; position: absolute; inset: 0; background-color: rgb(var(--c-ramp-2));
    -webkit-mask-image: var(--bayer-4-03); mask-image: var(--bayer-4-03);
    -webkit-mask-size: 8px 8px; mask-size: 8px 8px; -webkit-mask-repeat: repeat; mask-repeat: repeat; }

  /* DEPRECATED shims — delete each when its last call site migrates (docs/redesign/spec/05-foundations.md §5.18). Legacy geometry, no fixed height. */
  .fal-card { @apply surface-panel border border-line-subtle rounded-md shadow-e1; }
  @supports (corner-shape: squircle) { .fal-card { corner-shape: squircle; border-radius: 16px; } } /* squircle written out: the sq class is never applied here (docs/redesign/spec/05-foundations.md §5.1) */
  .fal-card-header { @apply border-b border-line-subtle px-6 py-4; }
  .fal-card-title { @apply text-title text-fg; }
  .fal-card-content { @apply px-6 py-4; }
  .fal-button-secondary { @apply inline-flex items-center justify-center gap-2 rounded-sm border border-line-control surface-raised px-4 py-2 text-body font-medium text-fg shadow-key transition-colors duration-fast ease-key hover:bg-hover active:translate-y-px active:shadow-key-pressed disabled:opacity-50 disabled:pointer-events-none; }
  .fal-button-primary { @apply inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2 text-body font-medium text-accent-ink transition-colors duration-fast hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none; }
  .connection-indicator { @apply inline-flex items-center gap-2 rounded-xs px-2 py-0.5 text-micro; }
  .connection-connected { @apply border border-success text-success; }
  .connection-disconnected { @apply border border-line-control text-fg-2; }

  /* PixelCard theming hooks (kept permanently; --pixel-card-* stay defined) */
  .pixel-card { --pixel-card-border: rgb(var(--c-border-subtle)); --pixel-card-background: rgb(var(--c-panel) / var(--a-panel)); --pixel-card-active-color: rgb(var(--c-hover)); }
  .pixel-card.pixel-card-latest { --pixel-card-border: rgb(var(--c-tally-preview) / .7); }
}
```

- §12 does not redefine `.dither-fallback`. `components/reactbits/Dither.css` keeps only its container, canvas, `[data-ready]` and `[data-boot]` rules (§12.3.1).
- The shims keep the legacy padding (`px-6 py-4` on card header and content, `px-4 py-2` on buttons) and set no height, so call-site `py-1`/`py-1.5` still wins once codemod 6 strips the `!`. The height tokens arrive with `<Button>` (§7.3).

### 5.15 `tailwind.config.js` (complete)

```js
/** dashboard/tailwind.config.js — PIXEL INSTRUMENT. Colours map to CSS variables; translucency comes from surface-* utilities. */
/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--c-${v}) / <alpha-value>)`
const chrome = { 50:'#EFF4FC',100:'#DCE7F8',200:'#BCD2F2',300:'#9CC0F0',400:'#7AA5E0',500:'#4F83CC',600:'#3A6AB0',700:'#2D5488',800:'#1F3A63',900:'#142440',950:'#0B1426' }
module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}',
            './lib/**/*.{js,ts,jsx,tsx}','./hooks/**/*.{js,ts,jsx,tsx}'],
  // 'dark' keeps every `.dark …` rule inside @layer blocks from being purged; the other four are tested in 1B before any TSX uses them
  safelist: ['dark', 'px-resolve', 'skeleton-dither', 'dither-veil', 'dither-fallback'],
  theme: {
    screens: { sm:'640px', md:'768px', lg:'1024px', xl:'1280px', wide:'1440px', '2xl':'1536px', '3xl':'1920px' }, // full override: extend would mis-order
    fontWeight: { light:'300', normal:'400', medium:'500', bold:'700' },                                   // full override: no 600 in Focal
    extend: {
      colors: {
        canvas:c('canvas'), chassis:c('chassis'), panel:c('panel'), raised:c('raised'), inset:c('inset'),
        hover:c('hover'), scrim:c('scrim'), screen:c('screen'), bezel:c('bezel'),
        fg:{ DEFAULT:c('text-1'), 1:c('text-1'), 2:c('text-2'), 3:c('text-3'), disabled:c('text-disabled'),
             'on-screen':c('text-on-screen'), 'on-screen-2':c('text-on-screen-2') },
        line:{ subtle:c('border-subtle'), strong:c('border-strong'), control:c('border-control') },
        accent:{ DEFAULT:c('accent'), hover:c('accent-hover'), press:c('accent-press'), ink:c('accent-ink'),
                 soft:'rgb(var(--c-accent) / var(--a-accent-soft))' },
        focus:c('focus'), success:c('success'), warning:c('warning'), danger:c('danger'), info:c('accent'),
        tally:{ program:c('tally-program'), preview:c('tally-preview'), rec:c('tally-rec'), cue:c('tally-cue'),
                standby:c('tally-standby'), off:c('tally-off'), ink:c('tally-ink') },
        ramp:{ 0:c('ramp-0'), 1:c('ramp-1'), 2:c('ramp-2'), 3:c('ramp-3'), glint:c('ramp-glint') },
        chrome,
        // ---- DEPRECATED migration aliases (deleted in M9 sweep; grep gate G16 in docs/redesign/spec/15-verification-and-qa.md §15.3) ----
        'fal-primary': chrome,                               // was silently violet; now chrome, 50–950
        'fal-gray': { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
        'fal-green': { 400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d' },
        'fal-yellow':{ 400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207' },
        'fal-blue':  { 400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8' },
        'fal-red':   { 400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c' },
      },
      borderColor: { DEFAULT: 'rgb(var(--c-border-subtle) / <alpha-value>)' }, // replaces `* {}` and `.dark * {}`
      fontFamily: {
        sans:['var(--font-sans)','ui-sans-serif','system-ui','Segoe UI','Helvetica','Arial','sans-serif'],
        focal:['var(--font-sans)','ui-sans-serif','system-ui','sans-serif'],   // alias, same stack
        mono:['var(--font-mono)','ui-monospace','SFMono-Regular','Menlo','Consolas','monospace'],
      },
      fontSize: {
        micro:        ['10px', { lineHeight:'12px', letterSpacing:'0.06em',   fontWeight:'500' }],
        label:        ['11px', { lineHeight:'14px', letterSpacing:'0.10em',   fontWeight:'500' }],
        caption:      ['12px', { lineHeight:'16px', letterSpacing:'0',        fontWeight:'400' }],
        'body-sm':    ['13px', { lineHeight:'18px', letterSpacing:'0',        fontWeight:'400' }],
        body:         ['var(--fs-body)', { lineHeight:'var(--lh-body)', letterSpacing:'0', fontWeight:'400' }], // 14/20, compact 13/18
        'body-lg':    ['16px', { lineHeight:'24px', letterSpacing:'0',        fontWeight:'400' }],
        'title-sm':   ['14px', { lineHeight:'20px', letterSpacing:'-0.005em', fontWeight:'500' }],
        title:        ['16px', { lineHeight:'22px', letterSpacing:'-0.01em',  fontWeight:'500' }],
        'title-lg':   ['20px', { lineHeight:'26px', letterSpacing:'-0.015em', fontWeight:'500' }],
        display:      ['28px', { lineHeight:'32px', letterSpacing:'-0.02em',  fontWeight:'500' }],
        'display-xl': ['44px', { lineHeight:'48px', letterSpacing:'-0.03em',  fontWeight:'700' }],
        premise:      ['24px', { lineHeight:'30px', letterSpacing:'-0.015em', fontWeight:'300' }],
        readout:      ['13px', { lineHeight:'16px', letterSpacing:'0',        fontWeight:'500' }],
        'readout-lg': ['24px', { lineHeight:'28px', letterSpacing:'-0.01em',  fontWeight:'500' }],
        timecode:     ['28px', { lineHeight:'32px', letterSpacing:'-0.02em',  fontWeight:'500' }],
        code:         ['12px', { lineHeight:'18px', letterSpacing:'0',        fontWeight:'400' }],
      },
      borderRadius: { xs:'var(--r-xs)', sm:'var(--r-sm)', md:'var(--r-md)', lg:'var(--r-lg)',
                      pill:'9999px', screen:'var(--r-screen)', lamp:'var(--r-lamp)' },
      boxShadow: { e1:'var(--shadow-e1)', e2:'var(--shadow-e2)', e3:'var(--shadow-e3)',
                   key:'var(--shadow-key)', 'key-pressed':'var(--shadow-key-pressed)' },
      spacing: { cmd:'48px', navrow:'44px', status:'24px', slate:'48px', strip:'28px',
                 transport:'56px', telemetry:'32px', dock:'200px', 'dock-collapsed':'36px' },
      zIndex: { dither:'-10', raised:'10', bar:'40', drawer:'50', popover:'60', scrim:'70',
                dialog:'80', chyron:'90', tooltip:'100', boot:'9999' },
      transitionDuration: { tick:'60ms', fast:'120ms', resolve:'160ms', base:'200ms', slow:'320ms', reveal:'480ms', house:'1200ms' },
      transitionTimingFunction: { out:'cubic-bezier(.16,1,.3,1)', 'in-out':'cubic-bezier(.65,0,.35,1)',
        exit:'cubic-bezier(.4,0,1,1)', key:'cubic-bezier(.3,0,0,1)', crt:'cubic-bezier(.2,.9,.1,1)', spec:'cubic-bezier(.45,0,.2,1)' },
      keyframes: {}, // intentionally empty: every @keyframes lives in app/styles/keyframes.css
      animation: { 'coast-sprite':'coast-sprite 800ms steps(8,end) infinite',
                   'skeleton-sweep':'skeleton-sweep 1400ms steps(28,end) infinite',
                   'bayer-blink':'bayer-blink 880ms steps(1,end) infinite',
                   'led-stall':'led-stall 1000ms steps(2,jump-none) 5',
                   'scan-step':'scan-step 1600ms steps(16,end) infinite' },
    },
  },
  plugins: [],   // no plugins registered (goal.md §4.5)
}
```

In 1B, `fontFamily` and `fontWeight` keep today's values from `tailwind.config.js:116-128`. M2 replaces them with the values above (§5 placement table). The build of this config with the real `app/` and `components/` content was verified: `.fal-card` gets `border-radius: var(--r-md)` and `background-color: rgb(var(--c-panel) / var(--a-panel))`; `.text-body` gets `font-size: var(--fs-body)`; `font-semibold` is not generated.

> Note: `safelist` is added to the bible's config. Without `'dark'`, Tailwind 3 purges `.dark {…}` token blocks inside `@layer` whenever the literal `dark` is missing from the content (reproduced; C3). Without the other four, `.px-resolve`, `.skeleton-dither`, `.dither-veil` and `.dither-fallback` are not emitted until a content file uses them, so the 1B checks in §5.21 would find no rule. `content` also scans `lib/` and `hooks/`, because class strings authored there (for example a tone→class map) would otherwise be purged.

### 5.16 Collision removal and verification

Delete from today's `tailwind.config.js`:
- `:57-104` the whole nested `fal: { light, lighter, gray, primary(violet), green, yellow, blue, red }` object;
- `:105-114` the legacy `primary`, `success`, `warning` and `danger` block (0 uses in `app/`, `components/`, `hooks/` and `lib/`, verified);
- `:129-138` `animation.pulse-slow`, `animation.fade-in` and the `fadeIn` keyframes;
- in M2, `:116-128` (the `fontFamily` literals and the weight remap).

Verification command (run in `dashboard/`):

```bash
node -e "const r=require('tailwindcss/resolveConfig'),f=require('tailwindcss/lib/util/flattenColorPalette').default;const c=f(r(require('./tailwind.config.js')).theme.colors);console.log('fal-primary-500 =',c['fal-primary-500']);process.exit(c['fal-primary-500']==='#4F83CC'&&!c['fal-light']&&!c['primary-500']?0:1)"
```

At 845147c this prints `fal-primary-500 = #6d28d9` and exits 1 (verified: 400 #8b5cf6, 500 #6d28d9, 600 #5b21b6, 700 #4c1d95). After 1B it prints `fal-primary-500 = #4F83CC` and exits 0.

Consequences to expect in 1B:
- `fal-primary-50…300` now resolve to chrome (for example `-300` = `#9CC0F0`), so the 16 previously dead classes render. Codemod 3 replaces them in the same PR.
- The solid 'Generate' call-to-action button (`bg-fal-primary-500 … text-white … hover:bg-fal-primary-400` at `CharacterLibraryPage.tsx:160`, `LocationLibraryPage.tsx:151` and `AssetStudioVisualFixture.tsx:43`) would render white on chrome `#4F83CC` at 3.85:1, and 2.53:1 on hover. In the same PR, on that button element only, replace `bg-fal-primary-500`, `text-white` and `hover:bg-fal-primary-400` (where present) with `bg-accent text-accent-ink hover:bg-accent-hover` (7.67 / 10.15 light, 7.90 / 10.69 dark, §5.6). This is part of the codemod 4 hand edits (§5.19).

### 5.17 `lib/utils.ts` (extendTailwindMerge)

```ts
import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge must know the custom scale names, or it reads them as colours and silently drops classes
// (e.g. cn('text-body-sm', 'text-fg-2') === 'text-fg-2' with a plain twMerge).
const twMerge = extendTailwindMerge({
  extend: {
    theme: { spacing: ['cmd', 'navrow', 'status', 'slate', 'strip', 'transport', 'telemetry', 'dock', 'dock-collapsed'] },
    classGroups: {
      'font-size': [{ text: ['micro', 'label', 'caption', 'body-sm', 'body', 'body-lg', 'title-sm', 'title', 'title-lg',
                             'display', 'display-xl', 'premise', 'readout', 'readout-lg', 'timecode', 'code'] }],
      shadow: [{ shadow: ['e1', 'e2', 'e3', 'key', 'key-pressed'] }],
      rounded: [{ rounded: ['xs', 'sm', 'md', 'lg', 'pill', 'screen', 'lamp'] }],
      z: [{ z: ['dither', 'raised', 'bar', 'drawer', 'popover', 'scrim', 'dialog', 'chyron', 'tooltip', 'boot'] }],
      duration: [{ duration: ['tick', 'fast', 'resolve', 'base', 'slow', 'reveal', 'house'] }],
      ease: [{ ease: ['out', 'in-out', 'exit', 'key', 'crt', 'spec'] }],
      surface: [{ surface: ['chassis', 'panel', 'raised', 'inset', 'hud'] }],
    },
    // surface-* and bg-* both set background-color: the last one wins
    conflictingClassGroups: { surface: ['bg-color'], 'bg-color': ['surface'] },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

`tailwind-merge` is 3.7.0 (installed). `extendTailwindMerge` exists, and every case below was verified.

> Note: `theme.spacing` is added to the bible's config (C4). The bible's `export const cn` arrow form is kept; the existing `import { cn } from '@/lib/utils'` call sites are unchanged.

`scripts/checks/cn.mjs` must exit 0:

```js
// dashboard/scripts/checks/cn.mjs — run: node --no-warnings scripts/checks/cn.mjs
import { cn } from '../../lib/utils.ts'
const cases = [
  [['text-body-sm', 'text-fg-2'], 'text-body-sm text-fg-2'], [['text-sm', 'text-body'], 'text-body'],
  [['text-micro', 'text-caption'], 'text-caption'], [['text-fg', 'text-fg-2'], 'text-fg-2'],
  [['rounded-md', 'rounded-screen'], 'rounded-screen'], [['shadow-e1', 'shadow-key'], 'shadow-key'],
  [['z-bar', 'z-dialog'], 'z-dialog'], [['duration-fast', 'duration-base'], 'duration-base'],
  [['ease-out', 'ease-key'], 'ease-key'], [['h-8', 'h-cmd'], 'h-cmd'],
  [['bg-accent-soft', 'text-accent'], 'bg-accent-soft text-accent'], [['rounded-md sq', 'rounded-lg'], 'sq rounded-lg'],
  [['surface-panel', 'bg-screen'], 'bg-screen'], [['bg-canvas', 'surface-raised'], 'surface-raised'],
]
let fail = 0
for (const [input, want] of cases) { const got = cn(...input); if (got !== want) { fail++; console.error('FAIL', input, '→', got, '≠', want) } }
process.exit(fail ? 1 : 0)
```

**Rules:**
- `components/dither-kit/lib.ts` keeps its plain `twMerge` and is never edited.
- Classes passed into `DitherButton` use arbitrary values for size, radius and height (`text-[13px]`, `rounded-[6px]`, `h-[var(--h-control)]`).
- `cn` keeps the last of `bg-*` / `surface-*` on one element (`cn('surface-panel', 'bg-screen')` → `'bg-screen'`).

### 5.18 Legacy class shims

These live in `components.css` (§5.14). Utilities now always beat them, so the `!` modifiers go (codemod 6).

| Class | Live call sites after D1 | Shim | Delete when |
|---|---|---|---|
| `.fal-card` | 17 / 12 files | `surface-panel border border-line-subtle rounded-md shadow-e1` + `@supports` squircle | The last `<Panel>` migration (M6–M8) |
| `.fal-card-header` | 8 / 8 | `border-b border-line-subtle px-6 py-4` (legacy geometry: 7 of the 8 headers wrap their own `flex justify-between` row) | same |
| `.fal-card-title` | 5 / 5 | `text-title text-fg` | same |
| `.fal-card-content` | 17 / 12 | `px-6 py-4` (legacy geometry) | same |
| `.fal-button-secondary` | 31 / 15 | `<Button variant="secondary">` materials with the legacy `px-4 py-2` and no fixed height, so call-site `py-1`/`py-1.5` still apply | The last `<Button>` migration (M6–M8) |
| `.fal-button-primary` | 2 (`CharacterLibraryPage.tsx:149`, `LocationLibraryPage.tsx:141`) | accent fill, legacy `px-4 py-2`, no fixed height | Migrate both to `<Button variant="primary">` in §10 |
| `.connection-indicator` / `-connected` / `-disconnected` | 1 each (`app/admin/analytics/page.tsx:146-147`) | outline and text only | Replaced by `<TallyLight>` in 11C (§11.C); the three shims are deleted from `components.css` in the same PR |
| `.pixel-card`, `.pixel-card-latest`, `--pixel-card-border`, `--pixel-card-background`, `--pixel-card-active-color` | 2 (`clips/page.tsx:39`, `recordings/page.tsx:56`) | token-driven vars; latest = `tally-preview` at .7 | **Never.** It is kept permanently, with these values, as the MediaCard hook (§11). §11 does not edit it. |

### 5.19 Codemods (ordered)

The auto steps run through `scripts/codemods/foundations.mjs`.
- Scope: `git ls-files 'app/**' 'components/**' 'hooks/**' 'lib/**'` filtered to `.ts|.tsx|.js|.jsx`, excluding `components/dither-kit/**`, `lib/utils.ts` and `lib/motion/**`. §5.17's `lib/utils.ts` holds the object key `rounded:`, which step 8 would rewrite to `rounded-xs:` (a syntax error).
- Within 1B, run steps 3–8 before writing `lib/utils.ts` (§5.17); the counts assume that order.
- Every replacement is single-pass, so values never chain.
- Always dry-run first, then `--write`, then review `git diff`. Put the dry-run counts in the PR body.

```js
#!/usr/bin/env node
// dashboard/scripts/codemods/foundations.mjs — mechanical, single-pass class codemods for docs/redesign/spec/05-foundations.md §5.19 (auto steps only).
// Usage: node scripts/codemods/foundations.mjs --step <weights|sizes|bang|focus|radii|hex> [--write]
// Without --write it prints per-file counts and changes nothing. Always review `git diff` after --write.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const B = '(?<![\\w-])' // token start: not preceded by a word char or '-' (variant prefixes like `dark:` are fine)
const E = '(?![\\w-])'  // token end
const map = (table) => (m, k) => table[k]
const STEPS = {
  // 1. weight preservation: today normal=300, medium=400, semibold=500, bold=500, extrabold=700 (tailwind.config.js:121-128)
  weights: [[new RegExp(`${B}font-(normal|medium|semibold|bold|extrabold)${E}`, 'g'),
    map({ normal: 'font-light', medium: 'font-normal', semibold: 'font-medium', bold: 'font-medium', extrabold: 'font-bold' })]],
  // 2. size mapping onto the named scale
  sizes: [[new RegExp(`${B}text-(\\[10px\\]|\\[11px\\]|xs|sm|base|lg|xl|2xl|3xl)${E}`, 'g'),
    map({ '[10px]': 'text-micro', '[11px]': 'text-label', xs: 'text-caption', sm: 'text-body', base: 'text-body-lg',
          lg: 'text-title-lg', xl: 'text-title-lg', '2xl': 'text-display', '3xl': 'text-display' })]],
  // 6. bang modifiers (the cascade fix makes them unnecessary)
  bang: [[new RegExp(`(?<=[\\s"'\`{(]|^)!(p[xy]-[0-9.]+)${E}`, 'gm'), (m, k) => k]],
  // 7. focus rings: the global :focus-visible outline replaces them; `focus:outline-none` and bare `outline-none` must go too or they hide that outline
  focus: [[new RegExp(`\\s?(?<![\\w:-])(?:[\\w-]+:)*(?:focus:(?:ring(?:-[^\\s"'\`]+)?|outline-none)|outline-none)(?=[\\s"'\`]|$)`, 'gm'), () => '']],
  // 8. radii: one pass so values never chain (Tailwind default px → new token nearest by role)
  radii: [[new RegExp(`${B}rounded(-(?:tl|tr|bl|br|ss|se|es|ee|[tblrse]))?(?:-(sm|md|lg|xl|2xl|3xl))?${E}`, 'g'),
    (m, side = '', size = '') => `rounded${side}-${({ '': 'xs', sm: 'screen', md: 'sm', lg: 'md', xl: 'lg', '2xl': 'lg', '3xl': 'lg' })[size]}`]],
  // 4 (auto part). violet and stray hex in JS props / arbitrary values → chrome primitives or canvas
  hex: [[/#(a78bfa|7c3aed|8b5cf6|6d28d9|05030b|090713)\b/gi,
    (m, k) => ({ a78bfa: '#7AA5E0', '7c3aed': '#4F83CC', '8b5cf6': '#4F83CC', '6d28d9': '#3A6AB0', '05030b': '#05080F', '090713': '#05080F' })[k.toLowerCase()]]],
}

const step = process.argv[process.argv.indexOf('--step') + 1]
const write = process.argv.includes('--write')
if (!STEPS[step]) { console.error(`--step must be one of ${Object.keys(STEPS).join('|')}`); process.exit(2) }
const files = execSync("git ls-files 'app/**' 'components/**' 'hooks/**' 'lib/**'", { encoding: 'utf8' })
  .split('\n').filter((f) => /\.(tsx?|jsx?)$/.test(f) && !f.startsWith('components/dither-kit/') && f !== 'lib/utils.ts' && !f.startsWith('lib/motion/'))
let total = 0
for (const f of files) {
  const src = readFileSync(f, 'utf8'); let out = src; let n = 0
  for (const [re, fn] of STEPS[step]) out = out.replace(re, (...a) => { n++; return fn(...a) })
  if (n) { total += n; console.log(`${String(n).padStart(4)}  ${f}`); if (write) writeFileSync(f, out) }
}
console.log(`${step}: ${total} replacement(s)${write ? ' written' : ' (dry run)'}`)
```

Within a milestone, run the steps in ascending number. The dry-run counts below were measured on 845147c after D1.

| # | Step | Part | How | Expected count | Done when |
|---|---|---|---|---|---|
| 1 | Weight preservation: `font-normal→font-light`, `font-medium→font-normal`, `font-semibold→font-medium`, `font-bold→font-medium`, `font-extrabold→font-bold` | M2, same commit as the new `fontWeight` | `--step weights` | 95 | `font-(semibold\|extrabold\|black\|thin\|extralight)` returns 0 |
| 2 | Sizes: `text-[10px]→text-micro`, `text-[11px]→text-label`, `text-xs→text-caption`, `text-sm→text-body`, `text-base→text-body-lg`, `text-lg`/`text-xl→text-title-lg`, `text-2xl`/`text-3xl→text-display` | M2 | `--step sizes` | 249 | `\btext-(xs\|sm\|base\|lg\|xl\|2xl\|3xl)\b` and `text-\[1[01]px\]` return 0 |
| 3 | Undefined shades by role: `text-fal-primary-200`, `text-fal-primary-300`, `dark:text-fal-primary-300` → `text-accent` (drop the paired `text-fal-primary-700`, since the token is theme-aware); `hover:bg-fal-primary-50 → hover:bg-accent-soft`; `border-fal-primary-300 → border-accent`; `fal-purple-500` → `text-accent`, and `bg-fal-purple-500/10` → `bg-accent-soft` | 1B | by hand at the 19 listed sites: `CharacterLibraryPage.tsx:149,152,160`; `LocationLibraryPage.tsx:141,144,151`; `AssetStudioVisualFixture.tsx:41,43(×3),44`; `ReferenceAssetManager.tsx:119`; `shotboard/ShotCard.tsx:158(×3),169`; `app/admin/analytics/page.tsx:177(×2)`; `ViewerChart.tsx:44` | 19 | `fal-primary-(50\|100\|200\|300)\b\|fal-purple` returns 0 |
| 4 | Violet: hex → auto (`#a78bfa→#7AA5E0`, `#7c3aed/#8b5cf6→#4F83CC`, `#6d28d9→#3A6AB0`, `#05030b/#090713→#05080F`, case-insensitive). Classes by role, by hand, with this exhaustive list (keep `hover:` prefixes; delete every `dark:` twin, because every token is theme-aware): `text-violet-{50…700}` → `text-accent`; `text-violet-100` on the `TrackManager.tsx:144` plate → `text-fg-on-screen`; `bg-violet-{500,600,700} text-white` → `bg-accent text-accent-ink`; `bg-violet-{50,100}[/NN]` and `dark:bg-violet-950/NN` → `bg-accent-soft`; `border-violet-500` (selected) → `border-accent`; every other `border-violet-*` → `border-line-subtle`; `bg-gradient-to-br from-violet-500/80 to-fal-gray-950` (`AssetStudioVisualFixture.tsx:43`) → `bg-screen`; violet `shadow-[…]` → `shadow-e1`. The solid 'Generate' button: `bg-fal-primary-500 text-white hover:bg-fal-primary-400` → `bg-accent text-accent-ink hover:bg-accent-hover` (§5.16). Stray surfaces: `bg-[#11131a]` → `bg-bezel` (theme-invariant dark; the Generate asides keep their light-on-dark children until §10 replaces them); `bg-[#0c0c12]` → `bg-screen`; `bg-[#0a0d14]` (`layout.tsx:38,40`) is removed with the veil and shell (3A/4B). `MorphSlider.css` per §5.10. | 1B | `--step hex` plus hand edits in `TrackManager.tsx`, `AssetStudioVisualFixture.tsx`, `ViewerChart.tsx`, `app/admin/analytics/page.tsx`, `CharacterLibraryPage.tsx:160`, `LocationLibraryPage.tsx:151`, `components/reactbits/MorphSlider.css` | hex 16 | `violet-\|purple-\|#a78bfa\|#7c3aed\|#8b5cf6\|#6d28d9\|#05030b\|#090713` (case-insensitive) returns 0 outside `components/dither-kit` and `components/reactbits/*.css`; the §5.10 MorphSlider.css grep prints nothing; `bg-fal-primary-(400\|500)([^/0-9]\|$)` returns 0 |
| 5 | Hover/dark pairs: `hover:X dark:Y` → `hover:X dark:hover:Y` | 1B | by hand at `AdminNav.tsx:31` (×2), `ScriptEditor.tsx:125`, `ScriptEditor.tsx:133`, `AssetUrlInput.tsx:78`, `app/admin/analytics/page.tsx:155` | 6 | Those 6 sites are converted. `TrackManager.tsx:157` is a false positive of the gate regex and clears when TrackManager migrates. |
| 6 | Bang modifiers: `!py-*`/`!px-*` → plain | 1B | `--step bang` | 23 | `\!p[xy]-` returns 0 |
| 7 | Focus rings: remove `focus:ring-*`, `focus:outline-none` **and** bare `outline-none` with any variant prefix (the global `:focus-visible` rule replaces them; a surviving `outline-none` beats it, as on the shared input `field` constants at `CharacterLibraryPage.tsx:38`, `LocationLibraryPage.tsx:37` and `AssetStudioVisualFixture.tsx:28`) | 1B | `--step focus` | 56 | `focus:ring\|focus:outline-none` returns 0, and no `outline-none` token remains |
| 8 | Radii (single pass): `rounded→rounded-xs`, `rounded-sm→rounded-screen`, `rounded-md→rounded-sm`, `rounded-lg→rounded-md`, `rounded-xl`/`2xl`/`3xl→rounded-lg`, with side variants (`rounded-t-lg→rounded-t-md`). `rounded-full`, `rounded-none` and arbitrary values are untouched. `sq` is **not** added here; primitives add it. | 1B | `--step radii` | 113 | `\brounded-(xl\|2xl\|3xl)\b` returns 0 |
| 9 | Spinners: `Loader2` (8 imports, 10 JSX sites) and `animate-spin` (10) → `<BayerSpinner/>`. `animate-pulse` (3: `DirectorPlayer.tsx:1073,1094,1147`) → tally and LED primitives. | 5A | by hand | 10 + 3 | `Loader2\|animate-spin\|animate-pulse` returns 0 |
| 10 | Greys: `fal-gray-*` (1015 at 845147c including dead code and CSS; 557 in live TS/TSX after D1) → semantic tokens, page by page | M6–M8 | by hand | 557 | `\bfal-(gray\|primary\|green\|yellow\|blue\|red)-` returns 0, then the aliases are deleted (M9 `sweep`) |

In tables, `\|` is Markdown escaping for `|`. The runnable form of the "Done when" column, keyed by step, runs from `dashboard/` after the step is committed (`git grep` reads tracked files, so a missing `hooks/` directory is not an error). Each command prints nothing:

```bash
X=':!components/dither-kit'
# 1 (M2)
git grep -nE '\bfont-(semibold|extrabold|black|thin|extralight)\b' -- app components hooks lib "$X"
# 2 (M2)
git grep -nE '\btext-(xs|sm|base|lg|xl|2xl|3xl)\b|text-\[1[01]px\]' -- app components hooks lib "$X"
# 3 (1B)
git grep -nE 'fal-primary-(50|100|200|300)\b|fal-purple' -- app components hooks lib "$X"
# 4 (1B)
git grep -niE 'violet-|purple-|#a78bfa|#7c3aed|#8b5cf6|#6d28d9|#05030b|#090713' -- app components hooks lib "$X" ':!components/reactbits/*.css'
grep -nEi '#ddd6fe|#e9d5ff|196, ?181, ?253|221, ?214, ?254|45, ?31, ?87|#0c0c12|rgba\(8, ?7, ?18|backdrop-filter' components/reactbits/MorphSlider.css
git grep -nE 'bg-fal-primary-(400|500)([^/0-9]|$)' -- app components
# 5 (1B): no command; the PR diff shows the 6 listed sites converted
# 6 (1B)
git grep -nE '!p[xy]-' -- app components hooks lib "$X"
# 7 (1B)
git grep -nE 'focus:ring|focus:outline-none' -- app components hooks lib "$X"
git grep -nE '(^|[[:space:]"'\''`])([a-z-]+:)*outline-none' -- app components hooks lib "$X"
# 8 (1B)
git grep -nE '\brounded-(xl|2xl|3xl)\b' -- app components hooks lib "$X"
# 9 (5A)
git grep -nE 'Loader2|animate-spin|animate-pulse' -- app components hooks lib "$X"
# 10 (each page's files in its M6–M8 part; the whole scope from 11C, before M9 sweep deletes the aliases)
git grep -nE '\bfal-(gray|primary|green|yellow|blue|red)-' -- app components hooks lib "$X"
```

> Note: the bible's radius step covered only `xl`, `2xl` and bare `rounded`. Once the new keys land, `rounded-sm/md/lg` change meaning, so step 8 remaps every size in one pass (C7). The bible's `fal-red-50/200` and `fal-yellow-300` targets exist only in the dead `TestControlPanel.tsx`, so after D1 those sub-steps are no-ops. Its counts "18 Loader2 sites" and "animate-pulse (4)" are corrected above (C12).

**Hand re-weighting after steps 1–2 (M2):**
- Delete any `font-*` class that sits on the same element as a named size and equals that size's built-in weight. For example, `text-caption font-normal` becomes `text-caption`, and `text-title-lg font-medium` becomes `text-title-lg`.
- Headings (`h1`–`h3`) and `.fal-card-title` take their named size's weight (500) with no override.
- After M2, `font-light` survives only on elements that also carry `text-premise`, and `font-bold` survives only on the JBM ON AIR readout.
- `text-micro` and `text-label` never hold a sentence (4 or more words). Change those elements to `text-caption`.
- Text with no class now renders at 400. It was 300.

### 5.20 Typography

#### 5.20.1 Loading: `app/fonts.ts`

```ts
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'
export const focal = localFont({
  src: [
    { path: '../fonts/focal/focal-light-web.woff2',   weight: '300', style: 'normal' },
    { path: '../fonts/focal/focal-regular-web.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/focal/focal-medium-web.woff2',  weight: '500', style: 'normal' },
    { path: '../fonts/focal/focal-bold-web.woff2',    weight: '700', style: 'normal' },
  ],
  variable: '--font-sans', display: 'swap', preload: true, adjustFontFallback: 'Arial',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
})
export const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'] }) // variable font: 400/500/700 available
```

- Set ``<html className={`${focal.variable} ${jetbrainsMono.variable}`}>`` and `<body className="font-sans">`, so portals inherit both fonts. This replaces `layout.tsx:8` and `:36`; `font-focal` is no longer used.
- Formats are **woff2 only**. All seven files in `dashboard/fonts/focal/` stay on disk (D4). `focal-italic-web.otf`, `focal-regular-web.otf` and `focal-medium-web.otf` become unreferenced.
- **There are no italics in the UI.**
- A scratch build of this exact file with Next 15.5.2 emits 5 preloaded `*.p.woff2` files (4 Focal weights + 1 JBM latin variable, wght 100–800) and the variables `--font-sans:"focal","focal Fallback",…` and `--font-mono:"JetBrains Mono","JetBrains Mono Fallback",…` (verified).

#### 5.20.2 Named scale

This is the Tailwind `fontSize` (§5.15). The JBM steps get their family from `utilities.css`.

| Key | Family | Size / line-height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `micro` | JBM | 10 / 12 | +0.06em | 500 | Lamp labels (sm), keycaps, badges. At most 3 words; never sentences. |
| `label` | JBM | 11 / 14 | +0.10em | 500 | Eyebrows, panel kickers, readout labels |
| `caption` | Focal | 12 / 16 | 0 | 400 | Helper text. The minimum size for any sentence. |
| `body-sm` | Focal | 13 / 18 | 0 | 400 | Rails |
| `body` | Focal | 14 / 20 (compact 13 / 18) | 0 | 400 | Default |
| `body-lg` | Focal | 16 / 24 | 0 | 400 | Composer, prompt fields |
| `title-sm` | Focal | 14 / 20 | −0.005em | 500 | Panel titles, the "Stream Admin" brand line |
| `title` | Focal | 16 / 22 | −0.01em | 500 | Section titles |
| `title-lg` | Focal | 20 / 26 | −0.015em | 500 | Inspector and dialog titles, bar h1s (Shotboard board title) |
| `display` | Focal | 28 / 32 | −0.02em | 500 | The single h1 on library pages |
| `display-xl` | Focal | 44 / 48 | −0.03em | 700 | Route-level slate titles (404, SIGNAL LOST). The only use of 700 in Focal. |
| `premise` | Focal | 24 / 30 | −0.015em | 300 | The show premise on the standby slate. The only use of 300. |
| `readout` | JBM | 13 / 16 | 0 | 500 | Telemetry, table numbers, lamp readouts |
| `readout-lg` | JBM | 24 / 28 | −0.01em | 500 | KPIs |
| `timecode` | JBM | 28 / 32 | −0.02em | 500 | The program clock in the transport bar, uptime in the Analytics ON-AIR strip |
| `code` | JBM | 12 / 18 | 0 | 400 | Model ids, handles, env names, digests |

The PX5×7 face (`<PixelFace>`, §12) is not a font. It is used on md lamp faces, slate kickers and the boot only, for at most 3 words (O11).

#### 5.20.3 Weight policy

- The remap hack (`tailwind.config.js:121-128`) is deleted in M2. The body is 400.
- Only four weights exist: 300 (`premise` only, at 24 px or more), 400 (reading text), 500 (titles, labels, buttons, readouts) and 700 (`display-xl` and the JBM ON AIR readout only).
- `font-semibold`, `font-extrabold`, `font-black`, `font-thin` and `font-extralight` do not compile and are grep-gated to 0.

#### 5.20.4 Numerals, time formats and `lib/format.ts`

- Any number that can change while visible uses JBM with `.nums`. The `readout`, `readout-lg` and `timecode` steps include `.nums`. Focal numbers that update inside prose use `tabular-nums`, because Focal's default digits are proportional (F5).
- Changing values sit in fixed `ch` slots: `min-w-[8ch]` for HH:MM:SS and `min-w-[5ch]` for ms values.
- `slashed-zero` has no effect on JBM's Google latin subset (it has no `zero` feature). It stays for the fallback fonts.
- Focal and the JBM subset both lack `⌘`, `↵` and `●`. These glyphs render in system fonts. `<Kbd>` shows `⌘` only on Apple platforms and `Ctrl` elsewhere (§7). The `●` exists only in `document.title` (§6).

| Kind | Format | Helper |
|---|---|---|
| Session and program clocks, uptime, REC time | `HH:MM:SS` | `tc(seconds)` |
| Generation and connect elapsed | `MM:SS.s` (e.g. `00:07.4`) | `tcShort(ms)` |
| Media durations | `MM:SS`, or `HH:MM:SS` from 1 h | `duration(seconds)` |
| Byte sizes | `512 KB` / `12.3 MB`; `1.25 GB` only with `{ gb: true }` (Recordings) | `bytes(n)`, `bytes(n, { gb: true })` |
| MIME | `WebM · VP9` | `formatMime(mime)` |
| Boot counter only | `HH:MM:SS:FF` | inline in `BOOT_SCRIPT` (§6; it cannot import) |

```ts
// dashboard/lib/format.ts — every visible number/time format in the app. Pure, no Intl, no locale drift.
const p2 = (n: number) => String(n).padStart(2, '0')
const ok = (n: number) => Number.isFinite(n) && n >= 0

/** Clocks, uptime, REC time: 3725 → '01:02:05'. Floors. Invalid → '--:--:--'. */
export function tc(seconds: number): string {
  if (!ok(seconds)) return '--:--:--'
  const s = Math.floor(seconds)
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`
}

/** Generation / connect elapsed: 7400 ms → '00:07.4'. Floors to 0.1 s. Invalid → '--:--.-'. */
export function tcShort(ms: number): string {
  if (!ok(ms)) return '--:--.-'
  const d = Math.floor(ms / 100)
  return `${p2(Math.floor(d / 600))}:${p2(Math.floor((d % 600) / 10))}.${d % 10}`
}

/** Bytes: < 1 MiB → '512 KB' (0 dp); else MB (1 dp), or GB (2 dp) from 1 GiB when { gb: true }. Invalid → '—'.
 *  bytes(n) reproduces DirectorPlayer.tsx:76-79 and TrackManager.tsx:21-24 at every size; bytes(n, { gb: true }) reproduces app/admin/recordings/page.tsx:10-14. */
export function bytes(n: number, { gb = false }: { gb?: boolean } = {}): string {
  if (!ok(n)) return '—'
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  if (!gb || n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** Media durations: 8.4 → '00:08', 3725 → '01:02:05'. Rounds to the nearest second. Invalid → '--:--'. */
export function duration(seconds: number): string {
  if (!ok(seconds)) return '--:--'
  const s = Math.round(seconds)
  return s >= 3600 ? tc(s) : `${p2(Math.floor(s / 60))}:${p2(s % 60)}`
}

const CONTAINERS: Record<string, string> = { webm: 'WebM', mp4: 'MP4', quicktime: 'MOV', 'x-matroska': 'MKV', ogg: 'Ogg' }
const CODECS: [RegExp, string][] = [[/^vp0?9$/, 'VP9'], [/^vp0?8$/, 'VP8'], [/^(avc1|avc3|h264)$/, 'H.264'], [/^(hev1|hvc1|hevc|h265)$/, 'HEVC'], [/^av01$/, 'AV1']]
/** Recordings 'Format' plate: container + the FIRST codec. 'video/webm;codecs=vp9,opus' → 'WebM · VP9'; '' → '—'. */
export function formatMime(mime: string | null | undefined): string {
  if (!mime) return '—'
  const [type, ...params] = mime.split(';').map((s) => s.trim())
  const sub = (type.split('/')[1] ?? type).toLowerCase()
  const container = CONTAINERS[sub] ?? sub.toUpperCase()
  const codecs = params.find((p) => p.toLowerCase().startsWith('codecs='))
  const first = codecs?.slice(7).replace(/"/g, '').split(',')[0]?.trim().split('.')[0].toLowerCase()
  if (!first) return container
  const hit = CODECS.find(([re]) => re.test(first))
  return `${container} · ${hit ? hit[1] : first.toUpperCase()}`
}
```

`scripts/checks/format.mjs` imports `../../lib/format.ts` and asserts every row below (all verified):

| Call | Result | Call | Result |
|---|---|---|---|
| `tc(3725)` | `01:02:05` | `bytes(524288)` | `512 KB` |
| `tc(0)` | `00:00:00` | `bytes(12.34*1048576)` | `12.3 MB` |
| `tc(59.99)` | `00:00:59` | `bytes(1.25*1073741824, { gb: true })` | `1.25 GB` |
| `tc(NaN)`, `tc(-1)` | `--:--:--` | `bytes(1610612736)` | `1536.0 MB` |
| `tc(360000)` | `100:00:00` | `bytes(NaN)` | `—` |
| `tcShort(7400)` | `00:07.4` | `duration(8.4)` | `00:08` |
| `tcShort(61234)` | `01:01.2` | `duration(59.6)` | `01:00` |
| `tcShort(0)` | `00:00.0` | `duration(3725)` | `01:02:05` |
| `formatMime('video/webm;codecs=vp8,opus')` | `WebM · VP8` | `formatMime('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')` | `MP4 · H.264` |
| `formatMime('video/webm;codecs=vp9,opus')` | `WebM · VP9` | `formatMime('video/mp4')` | `MP4` |
| `formatMime('')` | `—` | | |

**Preserved patterns:**
- `'Ping · {n} ms'` and `'REC {formatBytes}'` are verbatim. `'REC ' + bytes(n)` is byte-identical to today's `DirectorPlayer.tsx:76-79` output at every size.
- `'Live · {n}s'` (`DirectorPlayer.tsx:1148-1149`) becomes `'Live · ' + tc(elapsed)` (O15).
- `'{n} beats · {s}s runtime'` and `'{n}/14'` are verbatim.
- The three local `formatBytes` copies are replaced: `DirectorPlayer.tsx:76` and `TrackManager.tsx:21` by `bytes(n)`, `app/admin/recordings/page.tsx:10` by `bytes(n, { gb: true })`. No formatter output changes.
- §11.0 appends its media helpers to this file (11A). They are additive to §5.20.4.

#### 5.20.5 Casing and the uppercase allowlist

- **Sentence case** for every new label, button, heading and body string.
- **Authored uppercase** for new kickers, lamp words, slate kickers, eyebrows and model-tag plates (`"ON AIR"`, `"BLANK BOARD"`, `"CAST"`). Write them in uppercase in the source.
- **Never add or remove `text-transform` or `uppercase` on a preserved string.**
- Handles are lowercase mono (`@coast`). Tokens appear as authored (`$COAST`). Model ids appear verbatim in `code` style (`minimax/h3-max/director`).

**The 12 legacy sites** (as of 845147c) and the decision for each:

| # | Site | Wraps | Decision |
|---|---|---|---|
| 1 | `components/CharacterLibraryPage.tsx:152` | 'Character source' (preserved, assets.md:321) | **Keep** `uppercase` |
| 2 | `components/CharacterLibraryPage.tsx:160` | 'Generate' (a visible string that no chapter lists as changed, D6) | **Keep** |
| 3 | `components/LocationLibraryPage.tsx:144` | 'Location source' (preserved, assets.md:321) | **Keep** |
| 4 | `components/LocationLibraryPage.tsx:151` | 'Generate' | **Keep** |
| 5 | `components/AssetStudioVisualFixture.tsx:43` (1st) | 'Character source' | **Keep** |
| 6 | `components/AssetStudioVisualFixture.tsx:43` (2nd) | 'Generate' | **Keep** |
| 7 | `components/AssetStudioVisualFixture.tsx:44` | 'Location selection' (fixture section name, assets.md:103) | **Keep** |
| 8 | `components/AssetStudioVisualFixture.tsx:45` | 'Audio library visual fixture' (names `#audio-library-visual-test`, assets.md:104) | **Keep** |
| 9 | `components/shotboard/ShotCard.tsx:71` | 'Shot {shot.shotNumber}' | **Author** `SHOT {shot.shotNumber}`. §9 may later replace it with the slate tag. |
| 10 | `components/TrackManager.tsx:144` | 'Coast originals · {sliderTracks.length} tracks' | **Author** `COAST ORIGINALS · {sliderTracks.length} TRACKS` |
| 11 | `app/globals.css:163` (`.metric-label`) | dead class, 0 live uses | **Delete** with the dead CSS (1B) |
| 12 | `components/reactbits/MorphSlider.css:44` (`.morph-slider-caption-text`) | track names (data), vendored | **Keep** |

The visible rendering of the two authored sites (rows 9 and 10) is unchanged. They are listed here as allowed DOM-text changes under D6. The three 'Generate' eyebrows keep their text and their class.

`dashboard/scripts/checks/uppercase-allowlist.txt` (fields are separated by one TAB character). If a kept site moves to a new file, its line moves with it in the same commit (§10 moves them in 10A–10F), and the total never exceeds 9:

```text
# scripts/checks/uppercase-allowlist.txt — max count of \buppercase\b per file (class or text-transform). Sum must stay <= 9.
# <path>	<max>	<preserved string it wraps>
components/CharacterLibraryPage.tsx	2	Character source | Generate
components/LocationLibraryPage.tsx	2	Location source | Generate
components/AssetStudioVisualFixture.tsx	4	Character source | Generate | Location selection | Audio library visual fixture
components/reactbits/MorphSlider.css	1	.morph-slider-caption-text (track names, data)
```

```js
// dashboard/scripts/checks/uppercase.mjs — `uppercase` (class or text-transform) only where the allowlist says; allowlist total <= 9.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
const allow = Object.fromEntries(readFileSync('scripts/checks/uppercase-allowlist.txt', 'utf8').split('\n')
  .filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [path, max] = l.split('\t'); return [path, Number(max)] }))
let bad = 0
const total = Object.values(allow).reduce((a, b) => a + b, 0)
if (total > 9) { bad++; console.error(`allowlist total ${total} > 9`) }
const files = execSync('git ls-files app components', { encoding: 'utf8' }).split('\n')
  .filter((f) => /\.(tsx?|jsx?|css)$/.test(f) && !f.startsWith('components/dither-kit/'))
for (const f of files) {
  // comments are stripped first, so prose such as "authored uppercase" never counts
  const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  const n = (src.match(/\buppercase\b/g) ?? []).length
  if (n > (allow[f] ?? 0)) { bad++; console.error(`${f}: ${n} uppercase > allowed ${allow[f] ?? 0}`) }
}
process.exit(bad ? 1 : 0)
```

At 845147c (after D1) this check reports exactly the 3 author and delete sites (`ShotCard.tsx`, `TrackManager.tsx`, `app/globals.css`) (verified). After M2 it exits 0.

#### 5.20.6 Icons

- lucide-react 0.294.0, always with `strokeWidth={1.5}` and `absoluteStrokeWidth` (the prop exists in 0.294.0).
- **Sizes:** 14 in dense rows and chips, 16 by default, 20 in the transport. Set the icon size with the `size` prop (14/16/20), never with `h-`/`w-` classes: `absoluteStrokeWidth` derives the stroke from `size` (`strokeWidth * 24 / size`, `createLucideIcon.js`), so a class-sized icon at the default `size` 24 renders a 1 px stroke.
- **Colour:** `text-fg-2`, or `text-fg` when active. No colour chips.
- Lamps, LEDs, timecode and state words never use icons.

`dashboard/scripts/checks/lucide-allowlist.txt` (every name verified with `require('lucide-react')`):

```text
Radio Clapperboard UsersRound MapPin Film Video BarChart3
Command Search Sun Moon Monitor Play Square Send SendHorizontal Circle CircleDot Camera Wand2 Volume2 VolumeX Keyboard
Lock Unlock ImagePlus RotateCcw Undo2 Copy Download Upload Trash2 X Plus Minus Check AlertTriangle AlertCircle Info
Unplug Plug Cable Tv Signal Clock Timer Gauge Activity Eye Heart Gamepad2 Users Music GripVertical PanelRight PanelBottom
LayoutGrid Maximize2 Minimize2 ScanFace Sparkles ExternalLink History Star Pencil RefreshCw Wifi WifiOff Layers AtSign
CornerDownLeft ArrowLeftRight CassetteTape ListVideo SlidersHorizontal Settings2 ChevronRight ChevronDown
ChevronLeft ChevronUp ArrowUp ArrowDown ListPlus MessagesSquare LayoutTemplate UserRound Twitch
```

- The first line holds the nav icons, which do not change (`AdminNav.tsx:5`).
- The last line and `Minus` extend the bible's list. They are the icons of preserved controls (`ShotCard` 'Move shot earlier', `SceneSection` 'Move scene up/down', `ScriptEditor`, `ChatSteerer`, `ScriptTemplatePicker`, `TwitchBroadcast`, the character fallback) and NumberStepper's "−" (C11).
- `Loader2` is retired in 5A (BayerSpinner). `Database` is retired in 5A, when `ConvexNotConfigured` becomes the NotConfigured slate.
- To add a name, first run `node -e "process.exit(require('lucide-react').Name ? 0 : 1)"` and paste the output into the PR.

```js
// dashboard/scripts/checks/lucide.mjs — every lucide-react import is on the allowlist and exists in the installed version.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
const lucide = createRequire(import.meta.url)('lucide-react')
const allow = new Set(readFileSync('scripts/checks/lucide-allowlist.txt', 'utf8').split(/\s+/).filter(Boolean))
let bad = 0
for (const n of allow) if (!lucide[n]) { bad++; console.error(`allowlist: ${n} does not exist in lucide-react`) }
const files = execSync("git ls-files 'app/**' 'components/**'", { encoding: 'utf8' }).split('\n').filter((f) => /\.(tsx?|jsx?)$/.test(f))
for (const f of files) {
  for (const m of readFileSync(f, 'utf8').matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g))
    for (const raw of m[1].split(',')) {
      const n = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0] // inline `type LucideIcon` imports are types, not icons
      if (n && !/^Lucide(Icon|Props)$/.test(n) && !allow.has(n)) { bad++; console.error(`${f}: ${n} is not on scripts/checks/lucide-allowlist.txt`) }
    }
}
process.exit(bad ? 1 : 0)
```

After D1 it reports only `Loader2` (8 files) and `Database` (`ConvexNotConfigured.tsx`), as verified. It must exit 0 from 5A onwards.

### 5.21 Acceptance criteria

Commands whose paths start with `dashboard/`, `docs/`, `.agents/`, `goal.md` or `README.md`, and `git` commands with such pathspecs, run from the repository root. Every other command runs from `dashboard/`; that is every command below. Playwright items run in the §1.6 dev mode on `/admin?noboot`.

- [ ] `node -e` resolution (§5.16) prints `fal-primary-500 = #4F83CC` and exits 0.
- [ ] `node scripts/checks/css-layers.mjs` exits 0. The script: for each file in {`app/globals.css`: `@import`; `tokens.css`, `bayer.css`: `@layer base`; `keyframes.css`: `@keyframes`; `components.css`: `@layer components`; `shell.css`, `live-control.css`, `shotboard.css`, `studio.css`, `library.css`, `analytics.css`: `@layer components` (each skipped until the part that creates it); `utilities.css`: `@layer utilities`; `fonts-legacy.css` (1B only, optional): `@font-face`}, it parses the file with `postcss.parse` and fails on any top-level node other than the allowed at-rule and `comment` nodes.
- [ ] `grep -vE '^\s*(@import .+;|/\*.*\*/)?\s*$' app/globals.css | wc -l` prints `0`.
- [ ] `node scripts/gen-bayer.mjs --check` exits 0, and `app/styles/bayer.css` contains exactly 16 `--bayer-4-` definitions.
- [ ] `grep -rn '@keyframes' app components --include=*.css | grep -v '^app/styles/keyframes.css'` prints nothing.
- [ ] `grep -rnE '@apply[^;]*\bsq\b|\bring-inset\b|frosted-glass' app components | grep -v '^components/dither-kit/'` prints nothing.
- [ ] `grep -rnE 'backdrop-(blur|filter)' app components | grep -vE '^components/(dither-kit/|reactbits/ChromaGrid\.css:)'` prints nothing (§5.10).
- [ ] `grep -rnE 'bg-(chassis|panel|raised|inset)/' app components` prints nothing.
- [ ] `node --no-warnings scripts/checks/cn.mjs` exits 0. Run against today's `lib/utils.ts`, the same cases fail (proves the fix).
- [ ] `npm run typecheck` exits 0. `npm run qa:build` (the §1.6 prod build) exits 0, and `grep -c 'is used but no matching' .qa/build.log` prints `0`. `npm run lint` exits 0 with no warning beyond the post-M0 baseline.
- [ ] `tests/contrast.spec.ts` passes all 12 runs (§5.6). Temporarily setting light `--c-text-3` to `120 130 150` makes it fail (mutation check; revert afterwards).
- [ ] Playwright on `/admin?noboot`: `getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim()` is `45 84 136` in light and `122 165 224` in dark. With `data-broadcast="on-air"`, `--dither-veil` is `.72` in light and `.62` in dark. Under emulated `prefers-reduced-transparency: reduce`, `--a-panel` is `1` and `--dither-veil` is `.80`.
- [ ] Playwright: an element with class `px-resolve` has computed `animation-name: px-resolve`. With `html[data-lock="air"]` it has `none`, and a `.px-resolve[data-air-allow]` element still computes `px-resolve` under the lock. A `.skeleton-dither` has a non-`none` `::after` `animation-name`, and `getComputedStyle(el, '::after').content` is `none` under the air lock. In 1B the test sets `data-lock="air"` on `html` itself; from 3A it calls `window.__wzrd.broadcast.publish({ director: 'live', firstFrame: true })` (§1.6).
- [ ] Playwright: `getComputedStyle(document.body).fontWeight === '400'`. After M2, `getComputedStyle(document.body).fontFamily` starts with `focal` or `"focal"`, and `html.className` contains two `__variable_` classes.
- [ ] After M2: `ls .next/static/media/*.p.woff2 | wc -l` prints `5`, and `grep -rl '\.otf' .next/static/css` prints nothing.
- [ ] The §5.19 "Done when" commands (the block under the table) print nothing from their parts on. The 1B PR body lists the dry-run counts (hex 16, bang 23, focus 56, radii 113). The M2 PR body lists weights 95 and sizes 249. Every count differs from these only by edits made between 845147c and the PR, and the PR explains any difference.
- [ ] After M2: `grep -rnE '\bfont-light\b' app components | grep -v 'text-premise'` prints nothing. `grep -rnE '\bfont-(semibold|extrabold|black|thin|extralight)\b' app components | grep -v '^components/dither-kit/'` prints nothing.
- [ ] After 1B: `grep -rnE 'bg-fal-primary-(400|500)([^/0-9]|$)' app components` prints nothing (§5.16).
- [ ] After M2: `node scripts/checks/uppercase.mjs` exits 0, and the sum of the allowlist counts is at most 9.
- [ ] From 5A: `node scripts/checks/lucide.mjs` exits 0.
- [ ] After M2: `node --no-warnings scripts/checks/format.mjs` exits 0 (every row of the §5.20.4 table). `grep -rn 'function formatBytes' app components` prints nothing.
- [ ] `ls fonts/focal/` still lists all 7 files (D4).
- [ ] The 1B and M2 PRs attach dark, light and 390 px screenshots of all 8 routes. The expected diffs are those in the §5 placement table and nothing else.
