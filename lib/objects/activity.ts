import type { Lead, TimelineEvent } from '../data'
import { currentUser } from '../data'
import type { ClientReaction, Listing, ListingEvent } from './types'

export type ListingActivity = { listingId: string; event: ListingEvent }
export type ActivityOptions = { at?: string; actor?: string }

const reactionLabels: Record<ClientReaction, string> = {
  interested: 'Клиент заинтересован',
  not_interested: 'Клиент отказался',
  question: 'У клиента есть вопрос',
  showing: 'Клиент хочет записаться на показ',
}

export function recordSelectionActivity(
  lead: Lead,
  listings: Listing[],
  listingIds: string[],
  options: ActivityOptions = {},
): { lead: Lead; listingEvents: ListingActivity[] } {
  const actor = options.actor ?? currentUser.name
  const at = options.at ?? new Date().toISOString()
  const selected = [...new Set(listingIds)].filter((id) => listings.some((listing) => listing.id === id))
  if (!selected.length) return { lead, listingEvents: [] }

  const timelineEvent: TimelineEvent = {
    id: `timeline-${crypto.randomUUID()}`,
    kind: 'system',
    text: `Подборка подготовлена: ${selected.length} ${selected.length === 1 ? 'объявление' : selected.length < 5 ? 'объявления' : 'объявлений'}. Она не отправлена клиенту из этого демо.`,
    at: 'Только что',
    author: actor,
  }
  const listingEvents = selected.map((listingId) => ({
    listingId,
    event: {
      id: `event-${crypto.randomUUID()}`,
      kind: 'selection' as const,
      at,
      author: actor,
      summary: `Включено в локальную подборку для ${lead.name}`,
      leadId: lead.id,
    },
  }))
  return { lead: { ...lead, timeline: [...lead.timeline, timelineEvent] }, listingEvents }
}

export function recordClientReaction(
  lead: Lead,
  listing: Listing,
  reaction: ClientReaction,
  reason = '',
  options: ActivityOptions = {},
): { lead: Lead; listingEvent: ListingEvent } {
  const actor = options.actor ?? currentUser.name
  const at = options.at ?? new Date().toISOString()
  const cleanReason = reason.trim()
  const label = reactionLabels[reaction]
  const text = `${label} по объявлению ${listing.id}${cleanReason ? `: ${cleanReason}` : ''}.`
  return {
    lead: {
      ...lead,
      timeline: [...lead.timeline, { id: `timeline-${crypto.randomUUID()}`, kind: 'system', text, at: 'Только что', author: actor }],
    },
    listingEvent: {
      id: `event-${crypto.randomUUID()}`,
      kind: 'reaction',
      at,
      author: actor,
      summary: `${label} · ${lead.name}${cleanReason ? `: ${cleanReason}` : ''}`,
      leadId: lead.id,
      reaction,
      reason: cleanReason || undefined,
    },
  }
}
