import type { Listing, ListingDuplicate, ListingStatus, ListingView, Property } from './types'

const freshnessWindowDays = 14
const millisecondsPerDay = 24 * 60 * 60 * 1000

function normalize(value: string | undefined) {
  return (value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('ru')
    .replace(/[.,/#!$%^&*;:{}=_`~()'"—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function samePhysicalProperty(left: Property, right: Property) {
  if (left.id === right.id) return true
  if (left.kind !== right.kind || normalize(left.district) !== normalize(right.district)) return false

  const sameTitle = normalize(left.title) !== '' && normalize(left.title) === normalize(right.title)
  const sameLandmarkAndSize =
    normalize(left.landmark) !== '' &&
    normalize(left.landmark) === normalize(right.landmark) &&
    left.area !== undefined &&
    left.area === right.area &&
    left.rooms === right.rooms

  return sameTitle || sameLandmarkAndSize
}

function sameOfferTerms(left: Listing, right: Listing) {
  return (
    left.deal === right.deal &&
    left.price === right.price &&
    left.currency === right.currency &&
    left.priceUnit === right.priceUnit
  )
}

export function validateListingDraft(
  property: Pick<Property, 'title' | 'district'>,
  listing: Pick<Listing, 'price'>,
): { allowed: boolean; missing: string[] } {
  const missing: string[] = []
  if (!property.title.trim()) missing.push('название объекта')
  if (!property.district.trim()) missing.push('район')
  if (!Number.isFinite(listing.price) || listing.price <= 0) missing.push('цена')
  return { allowed: missing.length === 0, missing }
}

export function findListingDuplicates(candidate: ListingView, catalog: ListingView[]): ListingDuplicate[] {
  return catalog.flatMap((existing) => {
    if (existing.listing.id === candidate.listing.id) return []
    if (!samePhysicalProperty(candidate.property, existing.property)) return []

    const exactListing = sameOfferTerms(candidate.listing, existing.listing)
    const kinds: ListingDuplicate['kinds'] = exactListing
      ? ['same_property', 'same_listing']
      : ['same_property']

    return [
      {
        propertyId: existing.property.id,
        listingId: existing.listing.id,
        kinds,
        reasons: exactListing
          ? ['Совпадают характеристики физического объекта', 'Совпадают тип сделки, цена, валюта и период оплаты']
          : ['Совпадают характеристики физического объекта; условия предложения отличаются'],
      },
    ]
  })
}

export function canActivateListing(
  listing: Listing,
  property: Property,
): { allowed: boolean; missing: string[] } {
  const nonReactivatable: ListingStatus[] = ['closed', 'withdrawn', 'archived']
  if (nonReactivatable.includes(listing.status)) {
    return { allowed: false, missing: ['создайте новое объявление для нового предложения'] }
  }

  if (listing.status !== 'draft' && listing.status !== 'review') {
    return { allowed: false, missing: ['проведите отдельную проверку актуальности'] }
  }

  const missing: string[] = []
  if (!property.kind) missing.push('тип объекта')
  if (!property.district.trim()) missing.push('район')
  if (!listing.deal) missing.push('тип сделки')
  if (!Number.isFinite(listing.price) || listing.price <= 0) missing.push('цена')
  if (!listing.currency) missing.push('валюта')
  if (!listing.priceUnit) missing.push('единица цены')
  if (!listing.agent.trim()) missing.push('ответственный')
  if (!listing.source.label.trim()) missing.push('источник')
  if (!listing.visibility) missing.push('видимость')
  if (!listing.clientShareAllowed) missing.push('разрешение на показ клиенту')

  return { allowed: missing.length === 0, missing }
}

export function getClientEligibleListings(views: ListingView[], now = Date.now()): ListingView[] {
  return views.filter(({ listing }) => {
    if (listing.status !== 'active' || !listing.clientShareAllowed || !listing.verifiedAt) return false
    const checkedAt = Date.parse(listing.verifiedAt)
    if (!Number.isFinite(checkedAt)) return false
    const ageInDays = (now - checkedAt) / millisecondsPerDay
    return ageInDays <= freshnessWindowDays
  })
}
