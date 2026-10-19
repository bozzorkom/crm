import type { Lead } from './data'
import { recordSelectionActivity, type ActivityOptions } from './objects/activity'
import { filterSelectedMatchIds } from './objects/matching'
import type { Listing } from './objects/types'
import { needToSearchParams } from './match'
import type { ListingMatchResult } from './objects/matching'
import { formatListingPrice } from './format'

export type ActivationProof = {
  leadId: string
  leadName: string
  leadSource: Lead['source']
  owner: string
  need: Lead['need']
  requestLabel: string
  listingsLabel: string
  selectedCount: number
  listings: { id: string; title: string; district: string; price: string; sourceLabel: string; fit: string; matches: string[]; notes: string[] }[]
}

export type PreparedActivationSelection = {
  lead: Lead
  listingEvents: ReturnType<typeof recordSelectionActivity>['listingEvents']
  selectedMatches: ListingMatchResult[]
}

export function buildActivationMatchHref(lead: Lead): string {
  const params = new URLSearchParams(needToSearchParams(lead.need))
  params.set('leadId', lead.id)
  params.set('flow', 'activation')
  return `/match?${params.toString()}`
}

export function buildActivationProof(lead: Lead, selected: ListingMatchResult[]): ActivationProof | null {
  if (!selected.length) return null

  const sources = new Set(selected.map((result) => result.view.listing.source.type))
  const listingsLabel = sources.size === 1 && sources.has('demo')
    ? 'Демо-объявления'
    : sources.has('demo')
      ? 'Смешанные источники'
      : 'Объявления рабочего пространства'

  return {
    leadId: lead.id,
    leadName: lead.name,
    leadSource: lead.source,
    owner: lead.owner,
    need: lead.need,
    requestLabel: lead.sessionOnly ? 'Запрос этой сессии' : 'Демо-запрос',
    listingsLabel,
    selectedCount: selected.length,
    listings: selected.map(({ view, matches, mismatches, warnings }) => ({
      id: view.listing.id,
      title: view.property.title,
      district: view.property.district,
      price: formatListingPrice(view.listing.price, view.listing.currency, view.listing.priceUnit),
      sourceLabel: view.listing.source.type === 'demo' ? 'Демо-каталог' : view.listing.source.label.trim() || 'Источник не указан',
      fit: mismatches.length || warnings.length ? 'Есть расхождения' : 'Точное совпадение',
      matches,
      notes: [...mismatches, ...warnings],
    })),
  }
}

export function prepareActivationSelection(
  lead: Lead,
  listings: Listing[],
  selectedIds: string[],
  groups: { exact: ListingMatchResult[]; near: ListingMatchResult[] },
  options?: ActivityOptions,
): PreparedActivationSelection | null {
  const eligibleMatchesById = new Map([...groups.exact, ...groups.near].map((result) => [result.view.listing.id, result]))
  const selectedMatches = filterSelectedMatchIds(selectedIds, groups)
    .flatMap((id) => {
      const match = eligibleMatchesById.get(id)
      return match ? [match] : []
    })

  if (!selectedMatches.length) return null

  const result = recordSelectionActivity(lead, listings, selectedMatches.map((match) => match.view.listing.id), options)
  if (!result.listingEvents.length) return null

  return { ...result, selectedMatches }
}
