'use client'

import Link from 'next/link'
import { ArrowRight, CircleAlert, Clock3, ShieldAlert } from 'lucide-react'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import { PageHeader } from '@/components/shell/page-header'
import { getOwnerPulseItems } from '@/lib/pulse'

const priorityLabels = {
  urgent: { label: 'Срочно', Icon: Clock3, className: 'text-destructive' },
  attention: { label: 'Нужен шаг', Icon: CircleAlert, className: 'text-foreground' },
  review: { label: 'Проверка', Icon: ShieldAlert, className: 'text-muted-foreground' },
} as const

export function OwnerPulse() {
  const { leads } = useLeadWorkspace()
  const { listings, properties } = useObjectWorkspace()

  const items = getOwnerPulseItems(leads, listings, properties)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        title="Пульс агентства"
        description="Текущие сбои в рабочем цикле — с переходом к записи, где нужен следующий шаг."
        actions={<span className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground">Демо-данные · 18 октября 2026</span>}
      />

      <section aria-labelledby="pulse-list-title" className="rounded-2xl border bg-background px-4 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b py-4">
          <h2 id="pulse-list-title" className="text-base font-semibold">Что требует внимания</h2>
          <p className="text-xs text-muted-foreground">{items.length} группы сигналов · данные прототипа</p>
        </div>

        {items.length ? (
          <ul className="divide-y">
            {items.map((item) => {
              const priority = priorityLabels[item.priority]
              const Icon = priority.Icon
              return (
                <li key={item.id} className="grid gap-3 py-5 md:grid-cols-[minmax(180px,0.72fr)_minmax(0,1.8fr)] md:gap-8">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 shrink-0 ${priority.className}`} aria-hidden="true" />
                      <span className={`text-xs font-medium ${priority.className}`}>{priority.label}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums">{item.count}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold">{item.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
                  </div>
                  <ul aria-label={item.label} className="flex min-w-0 flex-col divide-y rounded-xl bg-secondary/50 px-3">
                    {item.records.map((record) => (
                      <li key={record.id}>
                        <Link
                          href={record.href}
                          className="group flex min-h-12 items-center gap-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">{record.label}</span>
                            <span className="break-words text-xs leading-relaxed text-muted-foreground">{record.detail}</span>
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col gap-1 py-10 text-center">
            <p className="font-medium">Открытых сигналов нет</p>
            <p className="text-sm text-muted-foreground">Когда появится просроченный шаг или объект на проверку, здесь будет ссылка на исходную запись.</p>
          </div>
        )}
      </section>

      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Pulse показывает текущие незакрытые вопросы, а «Аналитика» — динамику за период. Все значения на этом экране синтетические и не подтверждают коммерческий результат.
      </p>
    </div>
  )
}
