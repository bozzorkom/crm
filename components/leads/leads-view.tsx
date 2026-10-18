'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { currentUser, type Lead } from '@/lib/data'
import { formatAgo } from '@/lib/format'
import { Avatar, SlaBadge } from '@/components/kalit/badges'
import { useLeadWorkspace } from './lead-workspace'
import { LeadDetail } from './lead-detail'

const filters = [
  { id: 'all', label: 'Все' },
  { id: 'new', label: 'Новые' },
  { id: 'nostep', label: 'Без шага' },
  { id: 'mine', label: 'Мои' },
] as const

type FilterId = (typeof filters)[number]['id']

function applyFilter(list: Lead[], filter: FilterId) {
  switch (filter) {
    case 'new':
      return list.filter((l) => l.status === 'new')
    case 'nostep':
      return list.filter((l) => !l.nextStep || l.nextStep.overdue)
    case 'mine':
      return list.filter((l) => l.owner.startsWith(currentUser.firstName))
    default:
      return list
  }
}

export function LeadsView({ initialId }: { initialId?: string }) {
  const { leads, updateLead } = useLeadWorkspace()
  const [filter, setFilter] = useState<FilterId>('all')
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null)

  const visible = applyFilter(leads, filter)
  const selected = selectedId ? leads.find((lead) => lead.id === selectedId) : leads[0]

  return (
    <div className="flex h-[calc(100dvh-3.5rem-5rem)] md:h-dvh">
      <section
        aria-label="Список лидов"
        className={cn(
          'flex w-full flex-col border-r md:w-[360px] md:shrink-0',
          selectedId ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="flex flex-col gap-3 px-4 pt-6 pb-3">
          <div className="flex items-baseline justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Лиды</h1>
            <span className="text-sm text-muted-foreground tabular-nums">{visible.length}</span>
          </div>
          <div role="tablist" aria-label="Фильтр лидов" className="flex gap-1 rounded-full bg-secondary p-1">
            {filters.map((f) => (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'h-7 flex-1 rounded-full text-[13px] font-medium transition-all',
                  filter === f.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-4">
          {visible.map((lead) => {
            const active = selected?.id === lead.id
            return (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(lead.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex w-full gap-3 rounded-xl px-2.5 py-3 text-left transition-colors',
                    active ? 'md:bg-accent' : 'hover:bg-accent/60',
                  )}
                >
                  <div className="relative">
                    <Avatar name={lead.name} />
                    {lead.status === 'new' ? (
                      <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{lead.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatAgo(lead.minutesAgo)}</span>
                    </div>
                    <p className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">{lead.request}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">{lead.source}</span>
                      <SlaBadge lead={lead} />
                      {lead.nextStep?.overdue ? (
                        <span className="inline-flex h-5 items-center rounded-full bg-destructive/10 px-2 text-[11px] font-medium text-destructive">
                          Шаг просрочен
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
          {visible.length === 0 ? (
            <li className="px-4 py-12 text-center text-sm text-muted-foreground">Здесь пусто — всё под контролем.</li>
          ) : null}
        </ul>
      </section>

      <section
        aria-label="Карточка лида"
        className={cn('min-w-0 flex-1 flex-col', selectedId ? 'flex' : 'hidden md:flex')}
      >
        {selected ? (
          <LeadDetail key={selected.id} lead={selected} onChange={updateLead} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Карточка не найдена. Возможно, это была запись из демо-сеанса, которая сбросилась после обновления страницы.
            </p>
            <Link href="/leads" className="text-sm font-medium underline underline-offset-4">
              Вернуться к списку лидов
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
