import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ConvexClientProvider from '../components/ConvexClientProvider'
import ThemeToggle from '../components/ThemeToggle'
import DitherBackground from '../components/DitherBackground'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

// Applies the saved theme (or OS preference) before first paint.
const themeInit = `
  try {
    var d = localStorage.getItem('theme')
    if (d ? d === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    }
  } catch (e) {}
`

export const metadata: Metadata = {
  title: 'stream.wzrd.tech admin',
  description: 'Control panel for the realtime AI livestream: LTX + Director models, clips, recordings, Twitch analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`font-focal ${jetbrainsMono.variable}`}>
        <DitherBackground />
        <div className="min-h-screen bg-fal-gray-50/60 dark:bg-[#0a0d14]/45">
          {/* wzrd.tech header */}
          <header className="bg-[#0a0d14] border-b border-fal-gray-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/wzrdtechlogo.png"
                    alt="WZRD.TECH"
                    className="h-9 w-auto"
                  />
                  <div className="border-l border-fal-gray-700 pl-4">
                    <h1 className="text-lg font-semibold text-fal-gray-100 tracking-wide">
                      Stream Admin
                    </h1>
                    <p className="text-xs text-fal-gray-500 dark:text-fal-gray-400 font-mono">stream.wzrd.tech</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="relative fade-in">
              <ConvexClientProvider>{children}</ConvexClientProvider>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="border-t border-fal-gray-200 dark:border-fal-gray-700 mt-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center text-sm text-fal-gray-600 dark:text-fal-gray-400">
                <div>stream.wzrd.tech admin</div>
                <div className="flex items-center space-x-4">
                  <span>Powered by FAL realtime</span>
                  <div className="w-1 h-1 bg-fal-gray-400 rounded-full"></div>
                  <span className="font-mono">{new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
