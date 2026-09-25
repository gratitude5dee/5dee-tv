# Redesign audit evidence

These eight read-only audits were produced while preparing [`goal.md`](../../../goal.md). They describe the dashboard **as of commit `845147c`**. All `path:line` references point at that commit, so line numbers will drift once implementation starts.

| File | Surface |
| --- | --- |
| [shell.md](shell.md) | App shell, tokens, Tailwind config, typography, Dither background |
| [live.md](live.md) | Live Control / Director (`/admin`) |
| [shotboard.md](shotboard.md) | Shotboard (`/admin/shotboard`) |
| [assets.md](assets.md) | Characters, Locations, visual-test fixture |
| [data.md](data.md) | Clips, Recordings, Twitch Analytics, charts, dither-kit |
| [states.md](states.md) | Loading, empty, error and motion states across the app |
| [csv.md](csv.md) | Curation of `../component-prompts.csv` (React Bits + Arlan Vault) |
| [fal.md](fal.md) | fal generation pipeline and the brand-asset plan |

If an audit disagrees with `goal.md`, **`goal.md` wins**. The audits hold the evidence (verified facts, invariants, exact strings). They are not the plan. An audit's "redesign opportunities" section is input the spec already weighed, not a list of instructions.
