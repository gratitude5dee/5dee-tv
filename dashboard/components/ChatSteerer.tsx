'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessagesSquare, Plug, Unplug } from 'lucide-react'

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
  const [steer, setSteer] = useState(true)
  const [command, setCommand] = useState('!direct')
  const [chatLog, setChatLog] = useState<ChatLine[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const clientRef = useRef<{ disconnect: () => Promise<unknown> } | null>(null)
  const onFrameCommandRef = useRef(onFrameCommand)
  onFrameCommandRef.current = onFrameCommand
  const liveRef = useRef(live)
  const steerRef = useRef(steer)
  const commandRef = useRef(command)
  liveRef.current = live
  steerRef.current = steer
  commandRef.current = command

  const disconnect = useCallback(async () => {
    const c = clientRef.current
    clientRef.current = null
    setConnected(false)
    if (c) await c.disconnect().catch(() => undefined)
  }, [])

  const connect = useCallback(async () => {
    setStatus(null)
    try {
      const tmi = (await import('tmi.js')).default
      const client = new tmi.Client({
        connection: { secure: true, reconnect: true },
        channels: [ch],
      })
      client.on('message', (_chan, tags, message, self) => {
        if (self) return
        const user = String(tags['display-name'] ?? tags.username ?? 'chat')
        const text = message.trim()
        setChatLog((prev) => [...prev.slice(-19), { user, text, ts: Date.now() }])
        const lower = text.toLowerCase()
        if (liveRef.current && (lower === '!frame' || lower === '!snap')) {
          onFrameCommandRef.current?.(user)
          return
        }
        const prefix = commandRef.current.trim().toLowerCase()
        if (steerRef.current && liveRef.current && prefix && lower.startsWith(prefix)) {
          const direction = text.slice(prefix.length).trim()
          if (direction) onDirection(direction, user)
        }
      })
      client.on('connected', () => setConnected(true))
      client.on('disconnected', () => setConnected(false))
      clientRef.current = client
      await client.connect()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e))
    }
  }, [ch, onDirection])

  useEffect(() => {
    return () => {
      void clientRef.current?.disconnect().catch(() => undefined)
      clientRef.current = null
    }
  }, [])

  return (
    <div className="fal-card mt-4">
      <div className="fal-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-fal-gray-500" />
            <h3 className="fal-card-title">Chat steering</h3>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              connected ? 'bg-green-100 text-green-700' : 'bg-fal-gray-100 text-fal-gray-600'
            }`}
          >
            {connected ? 'listening' : 'offline'}
          </span>
        </div>
      </div>
      <div className="fal-card-content space-y-3">
        <p className="text-xs text-fal-gray-500">
          Anonymous read-only IRC on <span className="font-mono">#{ch || '…'}</span>. While the stream is
          live, <span className="font-mono">{command || '!direct'} &lt;text&gt;</span> messages are sent as
          directions with the chatter&rsquo;s name, and <span className="font-mono">!frame</span> snapshots the
          current frame for scene continuity — steering alongside the script.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!connected ? (
            <button
              onClick={connect}
              disabled={!ch}
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
          <label className="flex items-center gap-1.5 text-fal-gray-600">
            <input
              type="checkbox"
              checked={steer}
              onChange={(e) => setSteer(e.target.checked)}
              className="rounded border-fal-gray-300"
            />
            Chat can direct
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-24 rounded-md border border-fal-gray-300 px-2 py-1 font-mono"
            title="Command prefix"
          />
          {status && <span className="text-red-600">{status}</span>}
        </div>
        {chatLog.length > 0 && (
          <pre className="text-xs font-mono bg-fal-gray-50 border border-fal-gray-200 rounded-md p-3 max-h-32 overflow-auto">
            {chatLog.map((l) => `${l.user}: ${l.text}`).join('\n')}
          </pre>
        )}
      </div>
    </div>
  )
}
