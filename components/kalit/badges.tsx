import { cn } from '@/lib/utils'
import type { Lead, LeadStatus, PropertyStatus } from '@/lib/data'
import type { ListingStatus } from '@/lib/objects/types'
import { initials } from '@/lib/format'

const leadStatusLabels: Record<LeadStatus, string> = {
  new: 'Новый',
  contacted: 'На связи',
  qualified: 'Квалифицирован',
  showing: 'Показ',
  lost: 'Потерян',
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium',
        status === 'new' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
      )}
    >
      {leadStatusLabels[status]}
    </span>
  )
}

export function slaState(lead: Pick<Lead, 'minutesAgo' | 'slaMinutes' | 'status'>) {
  if (lead.status !== 'new') return null
  const left = lead.slaMinutes - lead.minutesAgo
  return left >= 0
    ? { overdue: false, label: `Ответить за ${left} мин` }
    : { overdue: true, label: `Просрочено на ${Math.abs(left)} мин` }
}

export function SlaBadge({ lead }: { lead: Pick<Lead, 'minutesAgo' | 'slaMinutes' | 'status'> }) {
  const sla = slaState(lead)
  if (!sla) return null
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium',
        sla.overdue ? 'bg-destructive/10 text-destructive' : 'bg-warning/15 text-[oklch(0.5_0.12_70)]',
      )}
    >
      <span className={cn('size-1.5 rounded-full', sla.overdue ? 'bg-destructive' : 'bg-warning')} aria-hidden="true" />
      {sla.label}
    </span>
  )
}

export function FreshnessBadge({ status, days }: { status: PropertyStatus | ListingStatus; days: number }) {
  if (status === 'reserved')
    return (
      <span className="inline-flex h-5 items-center rounded-full bg-secondary px-2 text-[11px] font-medium text-muted-foreground">
        Забронирован
      </span>
    )
  const labels: Partial<Record<ListingStatus, string>> = {
    draft: 'Черновик',
    review: 'На проверке',
    temporarily_unavailable: 'Временно недоступно',
    closed: 'Закрыто',
    withdrawn: 'Снято',
    archived: 'В архиве',
  }
  if (status in labels) {
    return (
      <span className="inline-flex h-5 items-center rounded-full bg-secondary px-2 text-[11px] font-medium text-muted-foreground">
        {labels[status as ListingStatus]}
      </span>
    )
  }
  const stale = status === 'stale' || status === 'needs_review' || days > 14
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium',
        stale ? 'bg-warning/15 text-[oklch(0.5_0.12_70)]' : 'bg-success/12 text-[oklch(0.45_0.12_152)]',
      )}
    >
      <span className={cn('size-1.5 rounded-full', stale ? 'bg-warning' : 'bg-success')} aria-hidden="true" />
      {stale ? `Проверить · ${days} дн.` : `Проверено ${days} дн. назад`}
    </span>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
