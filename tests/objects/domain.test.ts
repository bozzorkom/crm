import { describe, expect, it } from 'vitest'
import {
  canActivateListing,
  findListingDuplicates,
  getClientEligibleListings,
  validateListingDraft,
} from '../../lib/objects/domain'
import { getListingViewByLegacyId, listings, properties } from '../../lib/objects/fixtures'
import type { Listing, ListingView, Property } from '../../lib/objects/types'

const now = Date.parse('2026-10-16T12:00:00.000Z')

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'property-new',
    kind: 'apartment',
    title: '3-комн., ЖК Chilonzor City',
    city: 'Ташкент',
    district: 'Чиланзар',
    landmark: 'м. Новза',
    rooms: 3,
    area: 82,
    floor: 6,
    floorsTotal: 12,
    image: '/objects/1.png',
    renovation: 'Евроремонт',
    features: [],
    ...overrides,
  }
}

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-new',
    propertyId: 'property-new',
    deal: 'sale',
    price: 82000,
    currency: 'USD',
    priceUnit: 'total',
    mortgage: true,
    agent: 'Дилноза К.',
    source: { type: 'owner', label: 'Собственник', note: 'Синтетические данные' },
    visibility: 'team',
    clientShareAllowed: true,
    status: 'draft',
    verifiedAt: '2026-10-15T12:00:00.000Z',
    verifiedBy: 'Дилноза Каримова',
    verificationMethod: 'phone',
    nextVerificationAt: undefined,
    priceHistory: [],
    events: [],
    ...overrides,
  }
}

function view(property: Property, listing: Listing): ListingView {
  return { property, listing }
}

describe('Property and Listing domain', () => {
  it('keeps legacy property IDs resolvable while separating physical and offer identities', () => {
    expect(properties).toHaveLength(8)
    expect(listings).toHaveLength(8)

    const legacyView = getListingViewByLegacyId('p1')
    expect(legacyView).toMatchObject({
      property: { id: 'p1', title: '3-комн., ЖК Chilonzor City' },
      listing: { id: 'listing-p1', propertyId: 'p1', price: 82000, currency: 'USD' },
    })
    expect(legacyView?.property.id).not.toBe(legacyView?.listing.id)
  })

  it('distinguishes a new offer for the same home from an exact listing duplicate', () => {
    const original = getListingViewByLegacyId('p1')!
    const newOffer = view(
      makeProperty(),
      makeListing({ price: 80500 }),
    )
    const exactCopy = view(
      makeProperty(),
      makeListing({ id: 'listing-copy', price: original.listing.price }),
    )

    expect(findListingDuplicates(newOffer, [original])).toEqual([
      expect.objectContaining({ propertyId: 'p1', listingId: 'listing-p1', kinds: ['same_property'] }),
    ])
    expect(findListingDuplicates(exactCopy, [original])).toEqual([
      expect.objectContaining({ propertyId: 'p1', listingId: 'listing-p1', kinds: ['same_property', 'same_listing'] }),
    ])
  })

  it('allows activation only when every required field and client permission are explicit', () => {
    const complete = canActivateListing(makeListing(), makeProperty())
    expect(complete).toEqual({ allowed: true, missing: [] })

    const incomplete = canActivateListing(
      makeListing({ price: 0, agent: '', clientShareAllowed: false, source: { type: 'unknown', label: '' } }),
      makeProperty({ district: '' }),
    )
    expect(incomplete.allowed).toBe(false)
    expect(incomplete.missing).toEqual(['район', 'цена', 'ответственный', 'источник', 'разрешение на показ клиенту'])
  })

  it('requires a title, district, and positive price before saving a draft', () => {
    expect(validateListingDraft(makeProperty(), makeListing())).toEqual({ allowed: true, missing: [] })
    expect(
      validateListingDraft(makeProperty({ title: '', district: '' }), makeListing({ price: 0 })),
    ).toEqual({ allowed: false, missing: ['название объекта', 'район', 'цена'] })
  })

  it('does not reactivate a closed listing through the generic activation action', () => {
    expect(canActivateListing(makeListing({ status: 'closed' }), makeProperty())).toMatchObject({
      allowed: false,
      missing: ['создайте новое объявление для нового предложения'],
    })
  })

  it.each(['needs_review', 'temporarily_unavailable', 'reserved', 'closed', 'withdrawn', 'archived'] as const)(
    'excludes %s from exact client matching',
    (status) => {
      const candidate = view(
        makeProperty(),
        makeListing({ id: `status-${status}`, status }),
      )
      expect(getClientEligibleListings([candidate], now)).toEqual([])
    },
  )

  it('excludes active listings that are stale or lack explicit client-share permission', () => {
    const property = makeProperty()
    const stale = view(
      property,
      makeListing({ status: 'active', verifiedAt: '2026-09-01T12:00:00.000Z' }),
    )
    const notCleared = view(
      property,
      makeListing({ id: 'not-cleared', status: 'active', clientShareAllowed: false }),
    )

    expect(getClientEligibleListings([stale, notCleared], now)).toEqual([])
  })
})
