'use client'

import Image from 'next/image'
import { showingsToday } from '@/lib/data'
import { useObjectWorkspace } from '@/components/objects/object-workspace'

export function ShowingsToday() {
  const { getListingView } = useObjectWorkspace()

  return (
    <section aria-labelledby="showings-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="showings-title" className="text-sm font-semibold">
          Показы сегодня
        </h2>
        <span className="text-sm text-muted-foreground">{showingsToday.length}</span>
      </div>
      <ol className="flex flex-col gap-2">
        {showingsToday.map((showing) => {
          const view = getListingView(showing.listingId)
          if (!view) return null
          const { property } = view
          return (
            <li key={showing.id} className="flex items-center gap-3 rounded-2xl border p-2.5">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image src={property.image ?? '/placeholder.jpg'} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium tabular-nums">{showing.time}</span>
                  {!showing.confirmed ? (
                    <span className="rounded-full bg-warning/15 px-1.5 text-[11px] font-medium text-[oklch(0.5_0.12_70)]">
                      Не подтверждён
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-sm">{showing.client}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {property.title} · {property.district}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const stats = [
  { label: 'Первый ответ', value: '9 мин', hint: 'медиана за неделю' },
  { label: 'Лиды со следующим шагом', value: '83%', hint: 'цель 95%' },
  { label: 'Показы на неделе', value: '14', hint: '+4 к прошлой' },
  { label: 'Ожидаемая комиссия', value: '$9 525', hint: '7 сделок в работе' },
]

export function StatsStrip() {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 bg-background p-4">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="text-xl font-semibold tracking-tight tabular-nums">{stat.value}</dd>
          <dd className="text-xs text-muted-foreground">{stat.hint}</dd>
        </div>
      ))}
    </dl>
  )
}
