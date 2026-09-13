'use client'

import { Suspense } from 'react'
import ShotboardPage from '../../../components/shotboard/ShotboardPage'

export default function ShotboardRoute() {
  return (
    <Suspense>
      <ShotboardPage />
    </Suspense>
  )
}
