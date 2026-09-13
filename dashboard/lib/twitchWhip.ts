// Twitch WebRTC ingest (WHIP): pushes a MediaStream to the channel bound to the
// stream key. Server is the same for everyone; only H264 + Opus are accepted.

export const TWITCH_WHIP_URL = 'https://g.webrtc.live-video.net:4443/v2/offer'

export interface WhipSession {
  pc: RTCPeerConnection
  stop: () => void
}

function preferCodecs(kind: 'video' | 'audio', mime: string): RTCRtpCodec[] {
  return (
    RTCRtpReceiver.getCapabilities(kind)?.codecs.filter(
      (c) => c.mimeType.toLowerCase() === mime.toLowerCase(),
    ) ?? []
  )
}

/** Negotiates a send-only WebRTC session with Twitch ingest and starts pushing. */
export async function startWhipBroadcast(
  stream: MediaStream,
  streamKey: string,
): Promise<WhipSession> {
  const pc = new RTCPeerConnection()
  const videoTrack = stream.getVideoTracks()[0]
  const audioTrack = stream.getAudioTracks()[0]
  if (!videoTrack) {
    pc.close()
    throw new Error('No video track on the live stream')
  }

  const videoTransceiver = pc.addTransceiver(videoTrack, { direction: 'sendonly' })
  const h264 = preferCodecs('video', 'video/H264')
  if (h264.length) videoTransceiver.setCodecPreferences(h264)

  if (audioTrack) {
    const audioTransceiver = pc.addTransceiver(audioTrack, { direction: 'sendonly' })
    const opus = preferCodecs('audio', 'audio/opus')
    if (opus.length) audioTransceiver.setCodecPreferences(opus)
  }

  await pc.setLocalDescription()
  await new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve()
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onChange)
        resolve()
      }
    }
    pc.addEventListener('icegatheringstatechange', onChange)
    // Host-candidate gathering is fast; don't hang the UI if it never completes.
    setTimeout(resolve, 4000)
  })

  const offer = pc.localDescription?.sdp
  if (!offer) {
    pc.close()
    throw new Error('No local SDP offer produced')
  }

  const res = await fetch(TWITCH_WHIP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sdp',
      Authorization: `Bearer ${streamKey}`,
    },
    body: offer,
  })
  if (!res.ok) {
    pc.close()
    throw new Error(`Twitch ingest rejected the offer (${res.status})`)
  }

  const answerSdp = await res.text()
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

  return {
    pc,
    stop: () => pc.close(),
  }
}
