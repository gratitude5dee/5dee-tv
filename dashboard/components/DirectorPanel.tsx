'use client'

import DirectorPlayer from './DirectorPlayer'
import { useConvexEnabled } from './ConvexClientProvider'
import { useDirectorPersistence } from './useDirectorPersistence'

function ConvexDirectorPlayer() {
  const persistence = useDirectorPersistence()
  return <DirectorPlayer persistence={persistence} />
}

/** Renders the Director with Convex persistence when configured, otherwise standalone. */
export default function DirectorPanel() {
  const convexEnabled = useConvexEnabled()
  return convexEnabled ? <ConvexDirectorPlayer /> : <DirectorPlayer />
}
