import { createRouteHandler } from '@fal-ai/server-proxy/nextjs'

export const runtime = 'edge'

// Official fal proxy used by `createFalClient({ proxyUrl: '/api/fal/sdk-proxy' })`.
// Reads FAL_KEY from the server environment; the browser never sees it.
export const { GET, POST, PUT } = createRouteHandler()
