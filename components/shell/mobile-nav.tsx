'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { isActive, getNavigationForRole } from './nav-items'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'
import { DemoRoleSelect } from './demo-role-select'
import { useDemoRole } from './demo-role-provider'

export function MobileHeader() {
  const { role } = useDemoRole()
  const utilityLinks = getNavigationForRole(role).filter((item) => !item.mobile)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl md:hidden">
      <Link href="/" aria-label="Kalit — на главную">
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        {utilityLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <Icon className="size-[18px]" />
          </Link>
        ))}
        <DemoRoleSelect variant="compact" />
      </div>
    </header>
  )
}

export function MobileTabBar() {
  const pathname = usePathname()
  const { leads } = useLeadWorkspace()
  const { role } = useDemoRole()
  const newLeadCount = leads.filter((lead) => lead.status === 'new').length
  const tabs = getNavigationForRole(role).filter((item) => item.mobile)

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          const badge = item.href === '/leads' ? newLeadCount : undefined
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                {item.label}
                {badge ? (
                  <span className="absolute top-2 left-1/2 ml-2 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
