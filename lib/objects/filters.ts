import type { Currency, DealType, ListingStatus, ListingView, PropertyKind } from './types'

export type ListingFilters = {
  query: string
  kind: PropertyKind | 'all'
  deal: DealType | 'all'
  status: ListingStatus | 'all' | 'drafts' | 'unavailable'
  rooms: number | 'all'
  district: string | 'all'
  agent: string | 'all'
  currency: Currency | 'all'
  priceRange?: { currency: Currency; min?: number; max?: number }
  freshness: 'all' | 'fresh' | 'needs_review'
  sort: 'updated_desc' | 'price_asc' | 'price_desc' | 'verified_desc'
}

const millisecondsPerDay = 24 * 60 * 60 * 1000
const freshnessWindowDays = 14

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ru')
    .replace(/[.,/#!$%^&*;:{}=_`~()'"—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isFresh(verifiedAt: string | undefined, now: number) {
  if (!verifiedAt) return false
  const checkedAt = Date.parse(verifiedAt)
  return Number.isFinite(checkedAt) && (now - checkedAt) / millisecondsPerDay <= freshnessWindowDays
}

function isNeedsReview(view: ListingView, now: number) {
  return view.listing.status === 'needs_review' || (view.listing.status === 'active' && !isFresh(view.listing.verifiedAt, now))
}

function updatedAt(view: ListingView) {
  const value = view.listing.updatedAt ?? view.listing.createdAt
  const timestamp = value ? Date.parse(value) : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}

function verifiedAt(view: ListingView) {
  const timestamp = view.listing.verifiedAt ? Date.parse(view.listing.verifiedAt) : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function filterListingViews(views: ListingView[], filters: ListingFilters, now = Date.now()) {
  const query = normalize(filters.query)
  const filtered = views.filter(({ property, listing }) => {
    if (filters.kind !== 'all' && property.kind !== filters.kind) return false
    if (filters.deal !== 'all' && listing.deal !== filters.deal) return false
    if (filters.status === 'drafts' && listing.status !== 'draft' && listing.status !== 'review') return false
    if (
      filters.status === 'unavailable' &&
      !(['temporarily_unavailable', 'reserved', 'closed', 'withdrawn'] as ListingStatus[]).includes(listing.status)
    ) {
      return false
    }
    if (filters.status === 'active' && (listing.status !== 'active' || !isFresh(listing.verifiedAt, now))) return false
    if (filters.status === 'needs_review' && !isNeedsReview({ property, listing }, now)) return false
    if (
      filters.status !== 'all' &&
      filters.status !== 'drafts' &&
      filters.status !== 'unavailable' &&
      filters.status !== 'active' &&
      filters.status !== 'needs_review' &&
      listing.status !== filters.status
    ) {
      return false
    }
    if (filters.rooms !== 'all' && property.rooms !== filters.rooms) return false
    if (filters.district !== 'all' && normalize(property.district) !== normalize(filters.district)) return false
    if (filters.agent !== 'all' && listing.agent !== filters.agent) return false
    if (filters.currency !== 'all' && listing.currency !== filters.currency) return false

    if (filters.priceRange) {
      const range = filters.priceRange
      if (listing.currency !== range.currency) return false
      if (range.min !== undefined && listing.price < range.min) return false
      if (range.max !== undefined && listing.price > range.max) return false
    }

    if (filters.freshness === 'fresh' && (listing.status !== 'active' || !isFresh(listing.verifiedAt, now))) return false
    if (filters.freshness === 'needs_review' && !isNeedsReview({ property, listing }, now)) return false

    if (query) {
      const haystack = normalize(
        [property.id, property.title, property.district, property.landmark, listing.id, listing.agent, listing.source.label]
          .filter(Boolean)
          .join(' '),
      )
      if (!haystack.includes(query)) return false
    }

    return true
  })

  return filtered.sort((left, right) => {
    if (filters.sort === 'price_asc' || filters.sort === 'price_desc') {
      const currencyOrder = { USD: 0, UZS: 1 }
      const currencyDifference = currencyOrder[left.listing.currency] - currencyOrder[right.listing.currency]
      if (currencyDifference !== 0) return currencyDifference
      const priceDifference = left.listing.price - right.listing.price
      return filters.sort === 'price_asc' ? priceDifference : -priceDifference
    }

    if (filters.sort === 'verified_desc') return verifiedAt(right) - verifiedAt(left)
    return updatedAt(right) - updatedAt(left)
  })
}

export function isListingNeedsReview(view: ListingView, now = Date.now()) {
  return isNeedsReview(view, now)
}
