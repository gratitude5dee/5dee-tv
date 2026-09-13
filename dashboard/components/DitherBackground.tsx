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
        waveSpeed={0.03}
        waveFrequency={3}
        waveAmplitude={0.25}
        waveColor={dark ? [0.13, 0.2, 0.36] : [0.8, 0.87, 0.95]}
        backgroundColor={dark ? [0.04, 0.05, 0.08] : [0.96, 0.97, 0.99]}
        colorNum={5}
        pixelSize={2.5}
      />
    </div>
  )
}
