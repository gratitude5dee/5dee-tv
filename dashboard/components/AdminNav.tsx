'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radio, Film, Video, BarChart3 } from 'lucide-react'

const tabs = [
  { href: '/admin', label: 'Live Control', icon: Radio },
  { href: '/admin/clips', label: 'Clips', icon: Film },
  { href: '/admin/recordings', label: 'Recordings', icon: Video },
  { href: '/admin/analytics', label: 'Twitch Analytics', icon: BarChart3 },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-1 border-b border-fal-gray-200 dark:border-fal-gray-700 mb-8">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-fal-primary-500 text-fal-primary-600 dark:text-fal-primary-400'
                : 'border-transparent text-fal-gray-600 dark:text-fal-gray-400 hover:text-fal-gray-900 dark:text-fal-gray-50 hover:border-fal-gray-300 dark:border-fal-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
