import { NextResponse } from 'next/server'

export const runtime = 'edge'

/** Pass the already-verified Cloudflare Access assertion to Convex. */
export async function GET(request: Request) {
  const cookie = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length)
  const token = request.headers.get('cf-access-jwt-assertion') ?? cookie
  if (!token) return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } })
}
