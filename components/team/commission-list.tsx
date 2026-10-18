'use client'

import { useState } from 'react'
import { Handshake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { commissions as initial, type CommissionStatus } from '@/lib/data'
import { splitCommission as split } from '@/lib/commission'
import { formatUsd } from '@/lib/format'

const statusLabel: Record<CommissionStatus, string> = {
  expected: 'Ожидается',
  pending: 'Ждёт подтверждения',
  approved: 'Подтверждено',
  paid: 'Выплачено',
}

const filters: { id: 'all' | CommissionStatus; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'pending', label: 'К подтверждению' },
  { id: 'expected', label: 'Ожидаются' },
  { id: 'approved', label: 'Подтверждены' },
  { id: 'paid', label: 'Выплачены' },
]

export function CommissionList() {
  const [items, setItems] = useState(initial)
  const [filter, setFilter] = useState<'all' | CommissionStatus>('all')
  const visible = filter === 'all' ? items : items.filter((c) => c.status === filter)

  function approve(id: string) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'approved', payDate: '25 окт' } : c)))
  }

  return (
    <section aria-labelledby="commissions" className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="commissions" className="text-base font-semibold">
          Комиссии
        </h2>
        <div role="tablist" aria-label="Статус комиссии" className="flex gap-1 overflow-x-auto scrollbar-none">
          {filters.map((f) => {
            const count = f.id === 'all' ? items.length : items.filter((c) => c.status === f.id).length
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
                  filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent',
                )}
              >
                {f.label}
                <span className="ml-1 opacity-60 tabular-nums">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ul className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-background">
        {visible.map((c) => {
          const parts = split(c)
          return (
            <li key={c.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{c.client}</span>
                  <StatusPill status={c.status} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {c.kind === 'percent' ? `${c.rate}% от ${formatUsd(c.base)}` : `Фикс. · аренда ${formatUsd(c.base)}/мес`}{' '}
                  · {c.agent}
                  {c.payDate ? ` · ${c.status === 'paid' ? 'выплачено' : 'выплата'} ${c.payDate}` : ''}
                </span>
                {c.partner ? (
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Handshake className="size-3" aria-hidden="true" />
                    {c.partner.name} · {c.partner.share}% по соглашению
                  </span>
                ) : null}
              </div>

              <div className="flex w-full flex-col gap-1.5 md:w-64">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                  <span className="bg-primary" style={{ width: `${(parts.agent / c.total) * 100}%` }} />
                  <span className="bg-foreground/35" style={{ width: `${(parts.agency / c.total) * 100}%` }} />
                  <span className="bg-foreground/12" style={{ width: `${(parts.partner / c.total) * 100}%` }} />
                </div>
                <dl className="flex gap-3 text-[11px] text-muted-foreground tabular-nums">
                  <div className="flex gap-1">
                    <dt>Агент</dt>
                    <dd className="text-foreground">{formatUsd(parts.agent)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Агентство</dt>
                    <dd className="text-foreground">{formatUsd(parts.agency)}</dd>
                  </div>
                  {parts.partner ? (
                    <div className="flex gap-1">
                      <dt>Партнёр</dt>
                      <dd className="text-foreground">{formatUsd(parts.partner)}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="flex items-center justify-between gap-3 md:w-44 md:justify-end">
                <span className="text-base font-semibold tabular-nums">{formatUsd(c.total)}</span>
                {c.status === 'pending' ? (
                  <Button size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => approve(c.id)}>
                    Подтвердить
                  </Button>
                ) : null}
              </div>
            </li>
          )
        })}
        {visible.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">Нет комиссий с этим статусом</li>
        ) : null}
      </ul>
      <p className="text-[11px] text-muted-foreground text-pretty">
        Изменения после подтверждения требуют причины и попадают в журнал аудита. Расчёт не является бухгалтерским или
        налоговым заключением.
      </p>
    </section>
  )
}

function StatusPill({ status }: { status: CommissionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium',
        status === 'pending' && 'bg-primary text-primary-foreground',
        status === 'expected' && 'bg-secondary text-secondary-foreground',
        status === 'approved' && 'bg-success/12 text-[oklch(0.45_0.12_152)]',
        status === 'paid' && 'bg-secondary text-muted-foreground',
      )}
    >
      {statusLabel[status]}
    </span>
  )
}
