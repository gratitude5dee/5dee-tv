'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

const ConvexEnabledContext = createContext(false)

/** True when NEXT_PUBLIC_CONVEX_URL is configured and Convex hooks may be used. */
export function useConvexEnabled() {
  return useContext(ConvexEnabledContext)
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url])

  if (!client) {
    return <ConvexEnabledContext.Provider value={false}>{children}</ConvexEnabledContext.Provider>
  }

  return (
    <ConvexEnabledContext.Provider value={true}>
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </ConvexEnabledContext.Provider>
  )
}
