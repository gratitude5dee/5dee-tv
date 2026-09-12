import { NextResponse } from 'next/server'
import { runtimeEnv } from '../../../lib/runtimeEnv'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const HELIX = 'https://api.twitch.tv/helix'

export interface TwitchAnalytics {
  channel: string
  isLive: boolean
  viewerCount: number
  /** null when the token lacks `moderator:read:followers` (app tokens only return `total` for some channels). */
  followerCount: number | null
  title: string | null
  gameName: string | null
  startedAt: string | null
  uptimeSeconds: number | null
  thumbnailUrl: string | null
  user: {
    id: string
    displayName: string
    profileImageUrl: string
    description: string
  } | null
  capturedAt: number
}

// App access tokens last ~60 days; cache per isolate and refresh a minute early.
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAppToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error(`Twitch token request failed (${res.status})`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
  return cachedToken.value
}

async function helix<T>(path: string, clientId: string, token: string): Promise<T> {
  const res = await fetch(`${HELIX}${path}`, {
    headers: { 'Client-Id': clientId, Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) cachedToken = null
  if (!res.ok) throw new Error(`Helix ${path} failed (${res.status})`)
  return (await res.json()) as T
}

interface HelixUser {
  id: string
  display_name: string
  profile_image_url: string
  description: string
}
interface HelixStream {
  viewer_count: number
  title: string
  game_name: string
  started_at: string
  thumbnail_url: string
}

export async function GET() {
  const clientId = runtimeEnv('TWITCH_CLIENT_ID')
  const clientSecret = runtimeEnv('TWITCH_CLIENT_SECRET')
  const channel = (runtimeEnv('TWITCH_CHANNEL') || runtimeEnv('NEXT_PUBLIC_TWITCH_CHANNEL') || '').toLowerCase()

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not configured' },
      { status: 503 },
    )
  }
  if (!channel) {
    return NextResponse.json({ error: 'TWITCH_CHANNEL is not configured' }, { status: 503 })
  }

  try {
    const token = await getAppToken(clientId, clientSecret)
    const [users, streams] = await Promise.all([
      helix<{ data: HelixUser[] }>(`/users?login=${encodeURIComponent(channel)}`, clientId, token),
      helix<{ data: HelixStream[] }>(`/streams?user_login=${encodeURIComponent(channel)}`, clientId, token),
    ])

    const user = users.data[0] ?? null
    if (!user) {
      return NextResponse.json({ error: `Twitch channel "${channel}" not found` }, { status: 404 })
    }

    // Followers is best-effort: Helix may reject app tokens for this endpoint, and
    // live status/viewers must still be returned when it does.
    const followerCount = await helix<{ total: number }>(
      `/channels/followers?broadcaster_id=${user.id}&first=1`,
      clientId,
      token,
    )
      .then((r) => (typeof r.total === 'number' ? r.total : null))
      .catch(() => null)

    const stream = streams.data[0] ?? null
    const startedAt = stream?.started_at ?? null

    const body: TwitchAnalytics = {
      channel,
      isLive: Boolean(stream),
      viewerCount: stream?.viewer_count ?? 0,
      followerCount,
      title: stream?.title ?? null,
      gameName: stream?.game_name ?? null,
      startedAt,
      uptimeSeconds: startedAt ? Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000)) : null,
      thumbnailUrl: stream ? stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360') : null,
      user: {
        id: user.id,
        displayName: user.display_name,
        profileImageUrl: user.profile_image_url,
        description: user.description,
      },
      capturedAt: Date.now(),
    }

    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
