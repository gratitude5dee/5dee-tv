import { NextResponse } from 'next/server'
import { runtimeEnv } from '../../../../lib/runtimeEnv'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const HELIX = 'https://api.twitch.tv/helix'

async function helix<T>(path: string, clientId: string, token: string): Promise<T> {
  const res = await fetch(`${HELIX}${path}`, {
    headers: { 'Client-Id': clientId, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Helix ${path} failed (${res.status})`)
  return (await res.json()) as T
}

/**
 * Twitch OAuth "Connect to Twitch" exchange. The browser sends the code it got
 * back on the /admin redirect; we swap it for a user token server-side (keeps
 * TWITCH_CLIENT_SECRET off the client), look up the broadcaster's user id, and
 * pull the RTMP/WHIP stream key (requires the channel:read:stream_key scope).
 * The stream key is returned to the browser — it is never persisted here.
 */
export async function POST(request: Request) {
  const clientId = runtimeEnv('TWITCH_CLIENT_ID')
  const clientSecret = runtimeEnv('TWITCH_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured' },
      { status: 503 },
    )
  }

  let body: { code?: string; redirectUri?: string }
  try {
    body = (await request.json()) as { code?: string; redirectUri?: string }
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 })
  }
  if (!body.code || !body.redirectUri) {
    return NextResponse.json({ error: 'code and redirectUri are required' }, { status: 400 })
  }

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: body.code,
        redirect_uri: body.redirectUri,
      }),
    })
    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: `Twitch token exchange failed (${tokenRes.status})` },
        { status: 502 },
      )
    }
    const tokenData = (await tokenRes.json()) as { access_token: string }
    const userToken = tokenData.access_token

    const users = await helix<{ data: { id: string; login: string; display_name: string }[] }>(
      '/users',
      clientId,
      userToken,
    )
    const me = users.data[0]
    if (!me) return NextResponse.json({ error: 'Could not resolve Twitch user' }, { status: 502 })

    const keys = await helix<{ data: { stream_key: string }[] }>(
      `/streams/key?broadcaster_id=${me.id}`,
      clientId,
      userToken,
    )
    const streamKey = keys.data[0]?.stream_key
    if (!streamKey) {
      return NextResponse.json(
        { error: 'Stream key unavailable — grant the channel:read:stream_key scope' },
        { status: 502 },
      )
    }

    return NextResponse.json({ login: me.login, displayName: me.display_name, streamKey })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Twitch connect failed' },
      { status: 502 },
    )
  }
}
