import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose/jwt/verify'
import { createRemoteJWKSet } from 'jose/jwks/remote'
import { runtimeEnv } from './lib/runtimeEnv'

// Gates /admin/** and the FAL/Twitch API routes behind Cloudflare Access.
//
// Modes, chosen by env:
//  - CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD set: verify the Cf-Access-Jwt-Assertion JWT that
//    Access injects, so requests that bypass the Access proxy are refused at the origin.
//  - ADMIN_AUTH_MODE=edge-only: skip verification; Access (or another edge gate) is trusted
//    to protect the path. Explicit opt-in so production never fails open by accident.
//  - Neither, in development: allow (local dev).
//  - Neither, in production: 401 everything.
//
// Env is read per request via `runtimeEnv`: Pages exposes vars as request-context
// bindings, and Next inlines `process.env.*` in middleware at build time.

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null
let jwksIssuer: string | null = null

export async function middleware(request: NextRequest) {
  const teamDomain = runtimeEnv('CF_ACCESS_TEAM_DOMAIN')
  const audience = runtimeEnv('CF_ACCESS_AUD')
  const edgeOnly = runtimeEnv('ADMIN_AUTH_MODE') === 'edge-only'

  if (!teamDomain || !audience) {
    if (edgeOnly || process.env.NODE_ENV !== 'production') return NextResponse.next()
    return new NextResponse(
      'Unauthorized: set CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD, or ADMIN_AUTH_MODE=edge-only if Cloudflare Access already protects this path',
      { status: 401 },
    )
  }

  if (!jwks || jwksIssuer !== teamDomain) {
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`))
    jwksIssuer = teamDomain
  }

  const token =
    request.headers.get('cf-access-jwt-assertion') ?? request.cookies.get('CF_Authorization')?.value

  if (!token) {
    return new NextResponse('Unauthorized: Cloudflare Access assertion missing', { status: 401 })
  }

  try {
    await jwtVerify(token, jwks, { issuer: `https://${teamDomain}`, audience })
    return NextResponse.next()
  } catch {
    return new NextResponse('Unauthorized: invalid Cloudflare Access assertion', { status: 401 })
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
