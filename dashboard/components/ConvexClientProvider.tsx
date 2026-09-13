'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'

const ConvexEnabledContext = createContext(false)

function useCloudflareAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const fetchAccessToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/convex', { credentials: 'include', cache: 'no-store' })
      const value = response.ok ? await response.json() as { token?: string } : null
      const nextToken = value?.token ?? null
      setToken(nextToken)
      setIsLoading(false)
      return nextToken
    } catch {
      setToken(null)
      setIsLoading(false)
      return null
    }
  }, [])
  useEffect(() => {
    void fetchAccessToken()
  }, [fetchAccessToken])
  return { isLoading, isAuthenticated: Boolean(token), fetchAccessToken }
}

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
      <ConvexProviderWithAuth client={client} useAuth={useCloudflareAuth}>
        {children}
      </ConvexProviderWithAuth>
    </ConvexEnabledContext.Provider>
  )
}
