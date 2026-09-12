import { getRequestContext } from '@cloudflare/next-on-pages'

// Reads a server env var at request time. On Cloudflare Pages the values are
// request-context bindings, not `process.env` — and in middleware Next inlines
// `process.env.*` at build time regardless. Falls back to `process.env` so
// `next dev` and non-Pages runtimes still work.
export function runtimeEnv(name: string): string | undefined {
  try {
    const ctx = getRequestContext() as unknown as {
      env?: Record<string, string | undefined>
    }
    const value = ctx.env?.[name]
    if (value !== undefined) return value
  } catch {
    // Not running under Pages dev/production context.
  }
  return process.env[name]
}
