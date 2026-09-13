'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Radio, Square, Twitch, Unplug } from 'lucide-react'
import { startWhipBroadcast, type WhipSession } from '../lib/twitchWhip'

interface TwitchAuth {
  login: string
  streamKey: string
}

const AUTH_STORAGE_KEY = 'wzrd_twitch_auth'
const STATE_STORAGE_KEY = 'wzrd_twitch_oauth_state'
const OAUTH_SCOPE = 'channel:read:stream_key'

interface TwitchBroadcastProps {
  /** True while the Director session is producing frames. */
  live: boolean
  /** Returns the live Director output (the WebRTC MediaStream on the video element). */
  getStream: () => MediaStream | null
  onLog?: (line: string) => void
}

function readStoredAuth(): TwitchAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TwitchAuth>
    return parsed.login && parsed.streamKey ? { login: parsed.login, streamKey: parsed.streamKey } : null
  } catch {
    return null
  }
}

/**
 * "Connect to Twitch" + WHIP broadcast. Connect runs the OAuth code flow via
 * /api/twitch/connect (stream key fetched with channel:read:stream_key), with a
 * manual stream-key paste fallback. Broadcast pushes the Director MediaStream
 * to Twitch ingest (H264+Opus over WebRTC).
 */
export default function TwitchBroadcast({ live, getStream, onLog }: TwitchBroadcastProps) {
  const [auth, setAuth] = useState<TwitchAuth | null>(null)
  const [manualKey, setManualKey] = useState('')
  const [exchanging, setExchanging] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [broadcasting, setBroadcasting] = useState(false)
  const [starting, setStarting] = useState(false)
  const whipRef = useRef<WhipSession | null>(null)
  const liveRef = useRef(live)
  liveRef.current = live
  // Bumps on every start/stop so a superseded negotiation can't install a peer.
  const opRef = useRef(0)

  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ?? ''

  // Restore stored auth, and complete the OAuth redirect if we just came back
  // from twitch with ?code.
  useEffect(() => {
    setAuth(readStoredAuth())
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return
    const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY)
    sessionStorage.removeItem(STATE_STORAGE_KEY)
    window.history.replaceState({}, '', window.location.pathname)
    if (!expectedState || params.get('state') !== expectedState) {
      setConnectError('OAuth state mismatch — try Connect to Twitch again')
      return
    }
    setExchanging(true)
    fetch('/api/twitch/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { login?: string; streamKey?: string; error?: string }
        if (!res.ok || !data.login || !data.streamKey) {
          throw new Error(data.error ?? 'Connect failed')
        }
        const next = { login: data.login, streamKey: data.streamKey }
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
        setAuth(next)
        onLog?.(`Twitch connected as ${data.login}`)
      })
      .catch((e) => setConnectError(e instanceof Error ? e.message : 'Connect failed'))
      .finally(() => setExchanging(false))
    // onLog identity changes each render; the exchange should run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A session ending mid-broadcast tears the WHIP peer down with it.
  useEffect(() => {
    if (!live && whipRef.current) {
      whipRef.current.stop()
      whipRef.current = null
      setBroadcasting(false)
      onLog?.('Twitch broadcast stopped (session ended)')
    }
  }, [live, onLog])

  const connect = useCallback(() => {
    if (!clientId) {
      setConnectError('NEXT_PUBLIC_TWITCH_CLIENT_ID is not configured — paste a stream key instead')
      return
    }
    const state = crypto.randomUUID()
    sessionStorage.setItem(STATE_STORAGE_KEY, state)
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/admin`,
      response_type: 'code',
      scope: OAUTH_SCOPE,
      state,
    })
    window.location.href = `https://id.twitch.tv/oauth2/authorize?${params}`
  }, [clientId])

  const disconnect = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuth(null)
  }, [])

  const stopBroadcast = useCallback(() => {
    opRef.current += 1
    whipRef.current?.stop()
    whipRef.current = null
    setBroadcasting(false)
    onLog?.('Twitch broadcast stopped')
  }, [onLog])

  const startBroadcast = useCallback(async () => {
    const stream = getStream()
    const key = auth?.streamKey ?? manualKey.trim()
    if (!stream || !key) return
    setStarting(true)
    setConnectError(null)
    const op = ++opRef.current
    try {
      const session = await startWhipBroadcast(stream, key)
      // The Director session may have ended (or a stop clicked) while the
      // offer was in flight — don't install a peer for a dead stream.
      if (!liveRef.current || opRef.current !== op) {
        session.stop()
        return
      }
      whipRef.current = session
      setBroadcasting(true)
      onLog?.('Broadcasting to Twitch (WHIP H264+Opus)')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Broadcast failed')
    } finally {
      setStarting(false)
    }
  }, [auth, manualKey, getStream, onLog])

  const streamKeyReady = Boolean(auth?.streamKey || manualKey.trim())

  return (
    <div className="rounded-md border border-fal-gray-200 dark:border-fal-gray-700 px-3 py-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-fal-gray-700 dark:text-fal-gray-300">
          <Twitch className="w-4 h-4" />
          Twitch broadcast
        </span>
        <span className="flex-1" />
        {auth ? (
          <>
            <span className="text-xs text-fal-gray-500 dark:text-fal-gray-400">connected as {auth.login}</span>
            <button
              onClick={disconnect}
              className="fal-button-secondary flex items-center gap-1 !py-1 text-xs"
              title="Forget the stored Twitch connection"
            >
              <Unplug className="w-3.5 h-3.5" /> Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={connect}
            disabled={exchanging}
            className="fal-button-secondary flex items-center gap-1 !py-1 text-xs disabled:opacity-50"
          >
            <Twitch className="w-3.5 h-3.5" />
            {exchanging ? 'Connecting…' : 'Connect to Twitch'}
          </button>
        )}
        {broadcasting ? (
          <button
            onClick={stopBroadcast}
            className="fal-button-secondary flex items-center gap-1 !py-1 text-xs text-red-600 dark:text-red-400"
          >
            <Square className="w-3.5 h-3.5" /> Stop broadcast
          </button>
        ) : (
          <button
            onClick={() => void startBroadcast()}
            disabled={!live || !streamKeyReady || starting}
            className="fal-button-secondary flex items-center gap-1 !py-1 text-xs disabled:opacity-50"
            title={live ? 'Push the live Director output to Twitch ingest' : 'Start the Director session first'}
          >
            <Radio className="w-3.5 h-3.5" />
            {starting ? 'Negotiating…' : 'Go live on Twitch'}
          </button>
        )}
      </div>
      {broadcasting && (
        <p className="text-xs font-mono text-green-600 dark:text-green-400">
          ● pushing to Twitch ingest — viewers see the stream on your channel
        </p>
      )}
      {!auth && (
        <details className="text-xs">
          <summary className="cursor-pointer text-fal-gray-500 dark:text-fal-gray-400 select-none">
            Paste a stream key instead
          </summary>
          <input
            type="password"
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value)}
            placeholder="live_… stream key"
            className="mt-1.5 w-full rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1.5 text-xs"
          />
        </details>
      )}
      {connectError && <p className="text-xs text-red-600 dark:text-red-400">{connectError}</p>}
    </div>
  )
}
