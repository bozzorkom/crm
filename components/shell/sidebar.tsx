'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronsUpDown, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { currentUser } from '@/lib/data'
import { Logo } from './logo'
import { isActive, navItems } from './nav-items'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'

export function Sidebar() {
  const pathname = usePathname()
  const { leads } = useLeadWorkspace()
  const recent = leads.slice(0, 5)
  const newLeadCount = leads.filter((lead) => lead.status === 'new').length

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" aria-label="Kalit — на главную">
          <Logo />
        </Link>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Поиск"
        >
          <Search className="size-4" />
        </button>
      </div>

      <div className="px-3">
        <Link
          href="/"
          className="flex h-9 w-full items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
        >
          <Plus className="size-4" aria-hidden="true" />
          Новый запрос
        </Link>
      </div>

      <nav aria-label="Основная навигация" className="mt-4 flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          const badge = item.href === '/leads' ? newLeadCount : undefined
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent font-medium text-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
              {badge ? (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                  {badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
        <p className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">Недавние лиды</p>
        <ul className="flex flex-col gap-0.5 overflow-y-auto scrollbar-none">
          {recent.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/leads?id=${lead.id}`}
                className="flex h-8 items-center gap-2 truncate rounded-lg px-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
              >
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    lead.status === 'new' ? 'bg-primary' : 'bg-transparent',
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{lead.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t p-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {currentUser.initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{currentUser.name}</span>
            <span className="truncate text-xs text-muted-foreground">{currentUser.agency}</span>
          </span>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
