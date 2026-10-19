import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Sidebar } from '@/components/shell/sidebar'
import { MobileHeader, MobileTabBar } from '@/components/shell/mobile-nav'
import { LeadWorkspaceProvider } from '@/components/leads/lead-workspace'
import { ObjectWorkspaceProvider } from '@/components/objects/object-workspace'
import { DemoRoleProvider } from '@/components/shell/demo-role-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin', 'cyrillic'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Kalit — CRM для агентств недвижимости',
  description:
    'Рабочая система агентства недвижимости: лиды без потерь, подбор объектов, показы, сделки и комиссия в одном месте.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <DemoRoleProvider>
          <ObjectWorkspaceProvider>
            <LeadWorkspaceProvider>
              <div className="flex min-h-dvh">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <MobileHeader />
                  <main className="flex-1 pb-20 md:pb-0">{children}</main>
                </div>
              </div>
              <MobileTabBar />
            </LeadWorkspaceProvider>
          </ObjectWorkspaceProvider>
        </DemoRoleProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
