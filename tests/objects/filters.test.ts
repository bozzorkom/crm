import { describe, expect, it } from 'vitest'
import { filterListingViews, type ListingFilters } from '../../lib/objects/filters'
import type { Listing, ListingView, Property } from '../../lib/objects/types'

const now = Date.parse('2026-10-16T12:00:00.000Z')

function makeView(
  id: string,
  input: {
    title: string
    district?: string
    kind?: Property['kind']
    rooms?: number
    deal?: Listing['deal']
    price?: number
    currency?: Listing['currency']
    status?: Listing['status']
    agent?: string
    verifiedAt?: string
    updatedAt?: string
  },
): ListingView {
  const property: Property = {
    id: `property-${id}`,
    kind: input.kind ?? 'apartment',
    title: input.title,
    city: 'Ташкент',
    district: input.district ?? 'Чиланзар',
    landmark: 'Метро Новза',
    rooms: input.rooms ?? 3,
    area: 80,
    features: [],
  }
  const listing: Listing = {
    id,
    propertyId: property.id,
    deal: input.deal ?? 'sale',
    price: input.price ?? 80000,
    currency: input.currency ?? 'USD',
    priceUnit: input.deal === 'rent' ? 'month' : 'total',
    mortgage: false,
    agent: input.agent ?? 'Дилноза К.',
    source: { type: 'owner', label: 'Собственник' },
    visibility: 'team',
    clientShareAllowed: true,
    status: input.status ?? 'active',
    verifiedAt: input.verifiedAt ?? '2026-10-15T12:00:00.000Z',
    priceHistory: [],
    events: [],
    updatedAt: input.updatedAt ?? '2026-10-16T10:00:00.000Z',
  }
  return { property, listing }
}

const baseFilters: ListingFilters = {
  query: '',
  kind: 'all',
  deal: 'all',
  status: 'all',
  rooms: 'all',
  district: 'all',
  agent: 'all',
  currency: 'all',
  freshness: 'all',
  sort: 'updated_desc',
}

describe('listing catalogue filters', () => {
  it('combines search, deal, district, agent, currency range, and price sort', () => {
    const views = [
      makeView('l-a', { title: 'Chilonzor City', price: 82000 }),
      makeView('l-b', { title: 'Chilonzor Avenue', price: 70000 }),
      makeView('l-c', { title: 'Chilonzor Rent', deal: 'rent', price: 550 }),
      makeView('l-d', { title: 'Chilonzor UZS', currency: 'UZS', price: 1_200_000_000 }),
      makeView('l-e', { title: 'Yunusabad Park', district: 'Юнусабад', price: 76000 }),
    ]
    const filters: ListingFilters = {
      ...baseFilters,
      query: 'дилноза',
      deal: 'sale',
      district: 'Чиланзар',
      agent: 'Дилноза К.',
      currency: 'USD',
      priceRange: { currency: 'USD', min: 60000, max: 90000 },
      sort: 'price_asc',
    }

    expect(filterListingViews(views, filters, now).map(({ listing }) => listing.id)).toEqual(['l-b', 'l-a'])
  })

  it('never compares prices from different currencies in a selected price range', () => {
    const views = [
      makeView('usd-in-range', { title: 'USD In', price: 80000, currency: 'USD' }),
      makeView('usd-out-range', { title: 'USD Out', price: 140000, currency: 'USD' }),
      makeView('uzs-large-number', { title: 'UZS Large', price: 1_200_000_000, currency: 'UZS' }),
    ]

    expect(
      filterListingViews(
        views,
        { ...baseFilters, priceRange: { currency: 'USD', min: 50000, max: 100000 } },
        now,
      ).map(({ listing }) => listing.id),
    ).toEqual(['usd-in-range'])
  })

  it('sorts prices within currency groups instead of ranking unlike currencies numerically', () => {
    const views = [
      makeView('usd-high', { title: 'USD High', price: 80000, currency: 'USD' }),
      makeView('uzs-high', { title: 'UZS High', price: 1_200_000_000, currency: 'UZS' }),
      makeView('usd-low', { title: 'USD Low', price: 60000, currency: 'USD' }),
      makeView('uzs-low', { title: 'UZS Low', price: 900_000_000, currency: 'UZS' }),
    ]

    expect(filterListingViews(views, { ...baseFilters, sort: 'price_asc' }, now).map(({ listing }) => listing.id)).toEqual([
      'usd-low',
      'usd-high',
      'uzs-low',
      'uzs-high',
    ])
  })

  it('filters status and overdue verification separately and returns an empty result for no matches', () => {
    const views = [
      makeView('draft', { title: 'Draft', status: 'draft' }),
      makeView('fresh', { title: 'Fresh', status: 'active' }),
      makeView('stale', { title: 'Stale', status: 'needs_review', verifiedAt: '2026-09-01T12:00:00.000Z' }),
    ]

    expect(filterListingViews(views, { ...baseFilters, status: 'draft' }, now).map(({ listing }) => listing.id)).toEqual([
      'draft',
    ])
    expect(filterListingViews(views, { ...baseFilters, freshness: 'needs_review' }, now).map(({ listing }) => listing.id)).toEqual([
      'stale',
    ])
    expect(filterListingViews(views, { ...baseFilters, query: 'not here' }, now)).toEqual([])
  })

  it('groups unavailable and closed offers separately from drafts in quick status tabs', () => {
    const views = [
      makeView('reserved', { title: 'Reserved', status: 'reserved' }),
      makeView('closed', { title: 'Closed', status: 'closed' }),
      makeView('draft', { title: 'Draft', status: 'draft' }),
      makeView('review', { title: 'Review', status: 'review' }),
    ]

    expect(filterListingViews(views, { ...baseFilters, status: 'unavailable' }, now).map(({ listing }) => listing.id)).toEqual([
      'reserved',
      'closed',
    ])
    expect(filterListingViews(views, { ...baseFilters, status: 'drafts' }, now).map(({ listing }) => listing.id)).toEqual([
      'draft',
      'review',
    ])
  })

  it('shows stale active records in the needs-check tab instead of the active tab', () => {
    const views = [
      makeView('fresh-active', { title: 'Fresh', status: 'active', verifiedAt: '2026-10-15T12:00:00.000Z' }),
      makeView('stale-active', { title: 'Stale', status: 'active', verifiedAt: '2026-09-01T12:00:00.000Z' }),
    ]

    expect(filterListingViews(views, { ...baseFilters, status: 'active' }, now).map(({ listing }) => listing.id)).toEqual([
      'fresh-active',
    ])
    expect(filterListingViews(views, { ...baseFilters, status: 'needs_review' }, now).map(({ listing }) => listing.id)).toEqual([
      'stale-active',
    ])
  })
})
