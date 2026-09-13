'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessagesSquare, Plug, Unplug } from 'lucide-react'
import { DitherAvatar } from './dither-kit/avatar'

interface ChatSteererProps {
  /** Whether a Director session is live; directions are only sent while true. */
  live: boolean
  /** Send a direction to the model. Attributed as chat-sourced. */
  onDirection: (text: string, author: string) => void
  /** `!frame` / `!snap`: capture the current frame for scene continuity. */
  onFrameCommand?: (author: string) => void
  channel?: string
}

interface ChatLine {
  user: string
  text: string
  ts: number
}

/**
 * Anonymous Twitch IRC listener (justinfan read-only). Viewers steer the stream
 * with `!direct <text>` (configurable); each accepted command becomes a prompt
 * on the open session alongside whatever script is running.
 */
export default function ChatSteerer({ live, onDirection, onFrameCommand, channel }: ChatSteererProps) {
  const ch = channel ?? process.env.NEXT_PUBLIC_TWITCH_CHANNEL ?? ''
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [steer, setSteer] = useState(true)
  const [command, setCommand] = useState('!direct')
  const [chatLog, setChatLog] = useState<ChatLine[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const clientRef = useRef<{ disconnect: () => Promise<unknown> } | null>(null)
  const connectingRef = useRef(false)
  const lastDirectionAtRef = useRef(0)
  const lastDirectionByUserRef = useRef(new Map<string, number>())
  const onFrameCommandRef = useRef(onFrameCommand)
  onFrameCommandRef.current = onFrameCommand
  const liveRef = useRef(live)
  const steerRef = useRef(steer)
  const commandRef = useRef(command)
  liveRef.current = live
  steerRef.current = steer
  commandRef.current = command

  const disconnect = useCallback(async () => {
    connectingRef.current = false
    setConnecting(false)
    const c = clientRef.current
    clientRef.current = null
    setConnected(false)
    if (c) await c.disconnect().catch(() => undefined)
  }, [])

  const connect = useCallback(async () => {
    if (connectingRef.current || clientRef.current) return
    connectingRef.current = true
    setConnecting(true)
    setStatus(null)
    let client: { disconnect: () => Promise<unknown> } | null = null
    try {
      const tmi = (await import('tmi.js')).default
      const c = new tmi.Client({
        connection: { secure: true, reconnect: true },
        channels: [ch],
      })
      client = c
      c.on('message', (_chan, tags, message, self) => {
        if (self) return
        const user = String(tags['display-name'] ?? tags.username ?? 'chat')
          .replace(/[\[\]<>\n\r@]/g, '')
          .slice(0, 32) || 'chat'
        const text = message.trim()
        setChatLog((prev) => [...prev.slice(-19), { user, text, ts: Date.now() }])
        const lower = text.toLowerCase()
        if (liveRef.current && (lower === '!frame' || lower === '!snap')) {
          onFrameCommandRef.current?.(user)
          return
        }
        const prefix = commandRef.current.trim().toLowerCase()
        if (
          steerRef.current &&
          liveRef.current &&
          prefix &&
          (lower === prefix || lower.startsWith(prefix + ' '))
        ) {
          const direction = text.slice(prefix.length).trim()
          if (!direction) return
          // Throttle: one direction per user per 8s, 2s global minimum.
          const now = Date.now()
          if (now - lastDirectionAtRef.current < 2000) return
          const lastByUser = lastDirectionByUserRef.current.get(user) ?? 0
          if (now - lastByUser < 8000) return
          lastDirectionAtRef.current = now
          lastDirectionByUserRef.current.set(user, now)
          onDirection(direction, user)
        }
      })
      c.on('connected', () => setConnected(true))
      c.on('disconnected', () => setConnected(false))
      await c.connect()
      // Only adopt the client if nobody disconnected while the handshake ran.
      if (connectingRef.current) {
        clientRef.current = c
      } else {
        void c.disconnect().catch(() => undefined)
      }
    } catch (e) {
      if (client) await client.disconnect().catch(() => undefined)
      if (clientRef.current === client) clientRef.current = null
      setStatus(e instanceof Error ? e.message : String(e))
    } finally {
      connectingRef.current = false
      setConnecting(false)
    }
  }, [ch, onDirection])

  useEffect(() => {
    return () => {
      connectingRef.current = false
      void clientRef.current?.disconnect().catch(() => undefined)
      clientRef.current = null
    }
  }, [])

  return (
    <div className="fal-card mt-4">
      <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-fal-gray-500 dark:text-fal-gray-400" />
            <h3 className="fal-card-title">Chat steering</h3>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              connected ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-fal-gray-100 dark:bg-fal-gray-800 text-fal-gray-600 dark:text-fal-gray-400'
            }`}
          >
            {connected ? 'listening' : 'offline'}
          </span>
        </div>
      </div>
      <div className="fal-card-content space-y-3">
        <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400">
          Anonymous read-only IRC on <span className="font-mono">#{ch || '…'}</span>. While the stream is
          live, <span className="font-mono">{command || '!direct'} &lt;text&gt;</span> messages are sent as
          directions with the chatter&rsquo;s name, and <span className="font-mono">!frame</span> snapshots the
          current frame for scene continuity — steering alongside the script.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!connected ? (
            <button
              onClick={connect}
              disabled={!ch || connecting}
              className="fal-button-secondary flex items-center gap-1.5 !py-1.5 disabled:opacity-50"
            >
              <Plug className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="fal-button-secondary flex items-center gap-1.5 !py-1.5"
            >
              <Unplug className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          )}
          <label className="flex items-center gap-1.5 text-fal-gray-600 dark:text-fal-gray-400">
            <input
              type="checkbox"
              checked={steer}
              onChange={(e) => setSteer(e.target.checked)}
              className="rounded border-fal-gray-300 dark:border-fal-gray-700"
            />
            Chat can direct
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-24 rounded-md border border-fal-gray-300 dark:border-fal-gray-700 px-2 py-1 font-mono"
            title="Command prefix"
          />
          {status && <span className="text-red-600 dark:text-red-400">{status}</span>}
        </div>
        {chatLog.length > 0 && (
          <div className="text-xs font-mono bg-fal-gray-50 dark:bg-fal-gray-800 border border-fal-gray-200 dark:border-fal-gray-700 rounded-md p-3 max-h-32 overflow-auto space-y-1.5">
            {chatLog.map((l, i) => (
              <div key={`${l.ts}-${i}`} className="flex items-center gap-2 min-w-0">
                <DitherAvatar name={l.user} className="w-4 h-4 shrink-0 rounded-sm" />
                <span className="truncate">
                  <span className="text-fal-gray-500 dark:text-fal-gray-400">{l.user}:</span> {l.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
