import { Database } from 'lucide-react'

export default function ConvexNotConfigured({ feature }: { feature: string }) {
  return (
    <div className="fal-card">
      <div className="fal-card-content text-center py-12 text-fal-gray-600">
        <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium text-fal-gray-900">Convex is not configured</p>
        <p className="text-sm mt-1">
          Set <code className="font-mono">NEXT_PUBLIC_CONVEX_URL</code> to enable {feature}.
          Run <code className="font-mono">npx convex dev</code> in <code className="font-mono">dashboard/</code> to
          create a deployment.
        </p>
      </div>
    </div>
  )
}
