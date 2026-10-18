'use client'

import Image from 'next/image'
import { Handshake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shell/page-header'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import { dealStages, deals } from '@/lib/data'
import { formatPrice, formatUsd } from '@/lib/format'

export function DealsBoard() {
  const { getListingViewByLegacyId } = useObjectWorkspace()
  const totalCommission = deals.reduce((sum, deal) => sum + deal.commission, 0)

  return (
    <div className="flex w-full flex-col gap-6 py-8 md:py-10">
      <div className="px-4 md:px-8">
        <PageHeader
          title="Сделки"
          description={`${deals.length} в работе · ожидаемая комиссия ${formatUsd(totalCommission)}`}
        />
      </div>

      <div className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-4 scrollbar-none md:px-8">
        {dealStages.map((stage) => {
          const items = deals.filter((deal) => deal.stage === stage.id)
          const sum = items.reduce((total, deal) => total + deal.commission, 0)
          return (
            <section
              key={stage.id}
              aria-labelledby={`stage-${stage.id}`}
              className="flex w-[280px] shrink-0 snap-start flex-col gap-2 rounded-2xl bg-secondary/60 p-2"
            >
              <header className="flex items-baseline justify-between px-2 pt-1 pb-1">
                <h2 id={`stage-${stage.id}`} className="text-sm font-semibold">
                  {stage.label}
                  <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">{items.length}</span>
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">{sum ? formatUsd(sum) : ''}</span>
              </header>
              <ul className="flex flex-col gap-2">
                {items.map((deal) => {
                  const view = getListingViewByLegacyId(deal.propertyId)
                  if (!view) return null
                  const { property, listing } = view
                  const stuck = deal.daysInStage >= 7
                  return (
                    <li key={deal.id} className="flex flex-col gap-3 rounded-xl border bg-background p-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={property.image ?? '/placeholder.jpg'} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">{deal.client}</span>
                          <span className="truncate text-xs text-muted-foreground">{property.title}</span>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="tabular-nums">{formatPrice(deal.amount, listing.deal)}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          комиссия {formatUsd(deal.commission)}
                        </span>
                      </div>
                      <p className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs">{deal.next}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{deal.agent}</span>
                        <span className={cn(stuck && 'font-medium text-destructive')}>
                          {deal.daysInStage === 0 ? 'сегодня' : `${deal.daysInStage} дн. на этапе`}
                        </span>
                      </div>
                      {deal.partner ? (
                        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Handshake className="size-3" aria-hidden="true" />
                          Партнёр: {deal.partner} · 50/50
                        </p>
                      ) : null}
                    </li>
                  )
                })}
                {items.length === 0 ? (
                  <li className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                    Нет сделок
                  </li>
                ) : null}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
