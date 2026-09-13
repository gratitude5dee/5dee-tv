'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const Dither = dynamic(() => import('./reactbits/Dither'), { ssr: false })

/** Fixed-position React Bits Dither wave behind all page content; tint follows
 * the `dark` class the ThemeToggle flips. */
export default function DitherBackground() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const el = document.documentElement
    const update = () => setDark(el.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
      <Dither
        waveSpeed={0.04}
        waveFrequency={2.6}
        waveAmplitude={0.4}
        waveColor={dark ? [0.2, 0.34, 0.66] : [0.5, 0.63, 0.86]}
        backgroundColor={dark ? [0.02, 0.03, 0.06] : [0.98, 0.98, 1.0]}
        colorNum={4}
        pixelSize={2}
      />
    </div>
  )
}
