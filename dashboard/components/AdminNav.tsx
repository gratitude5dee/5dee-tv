'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radio, Film, Video, BarChart3, Clapperboard, UsersRound, MapPin } from 'lucide-react'

const tabs = [
  { href: '/admin', label: 'Live Control', icon: Radio },
  { href: '/admin/shotboard', label: 'Shotboard', icon: Clapperboard },
  { href: '/admin/characters', label: 'Characters', icon: UsersRound },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/clips', label: 'Clips', icon: Film },
  { href: '/admin/recordings', label: 'Recordings', icon: Video },
  { href: '/admin/analytics', label: 'Twitch Analytics', icon: BarChart3 },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-1 overflow-x-auto border-b border-fal-gray-200 dark:border-fal-gray-700 mb-8" aria-label="Admin sections">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center space-x-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
