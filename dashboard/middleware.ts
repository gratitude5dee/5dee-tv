import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose/jwt/verify'
import { createRemoteJWKSet } from 'jose/jwks/remote'

// Gates /admin/** and the FAL/Twitch API routes behind Cloudflare Access.
//
// Cloudflare Access is the primary enforcement layer (configured on the Cloudflare
// dashboard for stream.wzrd.tech/admin*). This middleware is defense-in-depth: when
// CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD are set it verifies the Cf-Access-Jwt-Assertion
// header that Access injects, so the origin refuses requests that bypass the Access proxy.
// When those vars are unset (local dev, or Access not yet configured) it is a no-op.

const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN
const audience = process.env.CF_ACCESS_AUD

const jwks = teamDomain
  ? createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`))
  : null

export async function middleware(request: NextRequest) {
  if (!jwks || !teamDomain || !audience) return NextResponse.next()

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
