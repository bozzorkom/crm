import type { Lead } from './data'
import type { Listing, Property } from './objects/types'

export type PulseRecord = {
  id: string
  label: string
  detail: string
  href: string
}

export type OwnerPulseItem = {
  id: 'new-leads' | 'overdue-next-step' | 'stale-listings' | 'missing-next-step'
  label: string
  summary: string
  priority: 'urgent' | 'attention' | 'review'
  count: number
  records: PulseRecord[]
}

function leadAge(minutesAgo: number) {
  if (minutesAgo < 60) return `${minutesAgo} мин назад`
  const hours = Math.floor(minutesAgo / 60)
  return `${hours} ч. назад`
}

function issue<T extends PulseRecord>(
  item: Omit<OwnerPulseItem, 'count' | 'records'>,
  records: T[],
): OwnerPulseItem | null {
  if (records.length === 0) return null
  return { ...item, count: records.length, records }
}

export function getOwnerPulseItems(leads: Lead[], listings: Listing[], properties: Property[]): OwnerPulseItem[] {
  const propertiesById = new Map(properties.map((property) => [property.id, property]))

  const newLeads = leads
    .filter((lead) => lead.status === 'new')
    .sort((a, b) => b.minutesAgo - a.minutesAgo)
    .map((lead) => ({
      id: lead.id,
      label: lead.name,
      detail: `${lead.source} · ${leadAge(lead.minutesAgo)} · ${lead.owner}${lead.minutesAgo > lead.slaMinutes ? ' · срок ответа превышен' : ''}`,
      href: `/leads?id=${lead.id}`,
    }))
  const overdueResponseCount = leads.filter(
    (lead) => lead.status === 'new' && lead.minutesAgo > lead.slaMinutes,
  ).length

  const overdueSteps = leads
    .filter((lead) => lead.nextStep?.overdue)
    .map((lead) => ({
      id: lead.id,
      label: lead.name,
      detail: `${lead.nextStep!.text} · ${lead.nextStep!.due}`,
      href: `/leads?id=${lead.id}`,
    }))

  const staleListings = listings
    .filter((listing) => listing.status === 'needs_review')
    .sort((a, b) => (a.verifiedAt ?? '').localeCompare(b.verifiedAt ?? ''))
    .map((listing) => {
      const property = propertiesById.get(listing.propertyId)
      const lastCheck = listing.events.findLast((event) => event.kind === 'verification')?.summary
      return {
        id: listing.id,
        label: property?.title ?? 'Объект без названия',
        detail: `${property?.district ?? 'Район не указан'} · ${listing.agent} · ${lastCheck ?? 'Дата проверки не указана'}`,
        href: `/objects/${listing.id}`,
      }
    })

  const missingNextStep = leads
    .filter((lead) => lead.status !== 'new' && lead.status !== 'lost' && !lead.nextStep)
    .map((lead) => ({
      id: lead.id,
      label: lead.name,
      detail: `${lead.status === 'qualified' ? 'Квалифицирован' : 'В работе'} · ${lead.owner}`,
      href: `/leads?id=${lead.id}`,
    }))

  return [
    issue(
      {
        id: 'new-leads',
        label: 'Новые обращения',
        summary: overdueResponseCount
          ? `У ${overdueResponseCount} из ${newLeads.length} обращений превышен срок первого ответа`
          : 'Нужно дать первый ответ',
        priority: overdueResponseCount ? 'urgent' : 'attention',
      },
      newLeads,
    ),
    issue(
      {
        id: 'overdue-next-step',
        label: 'Просроченный следующий шаг',
        summary: 'Срок действия уже прошёл',
        priority: 'urgent',
      },
      overdueSteps,
    ),
    issue(
      {
        id: 'stale-listings',
        label: 'Объекты требуют проверки',
        summary: 'Проверьте статус и условия до нового подбора',
        priority: 'review',
      },
      staleListings,
    ),
    issue(
      {
        id: 'missing-next-step',
        label: 'Активные лиды без продолжения',
        summary: 'Зафиксируйте задачу или осознанно завершите работу',
        priority: 'attention',
      },
      missingNextStep,
    ),
  ].filter((item): item is OwnerPulseItem => item !== null)
}
