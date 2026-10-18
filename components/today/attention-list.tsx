'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAgo } from '@/lib/format'
import { Avatar, SlaBadge } from '@/components/kalit/badges'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'

export function AttentionList() {
  const { leads } = useLeadWorkspace()
  const queue = leads.filter((lead) => lead.status === 'new' || lead.nextStep?.overdue || !lead.nextStep)

  return (
    <section aria-labelledby="attention-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="attention-title" className="text-sm font-semibold">
          Требует внимания
        </h2>
        <Link href="/leads" className="text-sm text-muted-foreground hover:text-foreground">
          Все лиды
        </Link>
      </div>
      {queue.length ? (
        <ul className="divide-y overflow-hidden rounded-2xl border">
          {queue.map((lead) => {
            const reason =
              lead.status === 'new'
                ? lead.request
                : lead.nextStep?.overdue
                  ? `Просрочено: ${lead.nextStep.text}`
                  : 'Нет следующего шага'
            return (
              <li key={lead.id}>
                <Link
                  href={`/leads?id=${encodeURIComponent(lead.id)}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60"
                >
                  <Avatar name={lead.name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {lead.source} · {formatAgo(lead.minutesAgo)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'truncate text-sm',
                        lead.nextStep?.overdue ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {reason}
                    </p>
                  </div>
                  <div className="hidden shrink-0 sm:block">
                    <SlaBadge lead={lead} />
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Всё под контролем — обращений, требующих внимания, нет.
        </div>
      )}
    </section>
  )
}
