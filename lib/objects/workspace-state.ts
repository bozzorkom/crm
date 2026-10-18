import { currentUser } from '../data'
import { canActivateListing } from './domain'
import type { Listing, ListingEvent, ListingStatus, VerificationMethod, VerificationResult } from './types'

export type VerificationInput = {
  result: VerificationResult
  method: VerificationMethod
  price?: number
  comment?: string
}

export function activateListing(listing: Listing, property: import('./types').Property, now = new Date()) {
  const validation = canActivateListing(listing, property)
  if (!validation.allowed) return { listing: null, missing: validation.missing }

  const at = now.toISOString()
  const event: ListingEvent = {
    id: `event-${crypto.randomUUID()}`,
    kind: 'status',
    at,
    author: currentUser.name,
    summary: 'Объявление активировано после проверки обязательных полей и разрешений',
    fromStatus: listing.status,
    toStatus: 'active',
  }
  return {
    listing: { ...listing, status: 'active' as const, updatedAt: at, events: [...listing.events, event] },
    missing: [],
  }
}

function getNextStatus(status: ListingStatus, result: VerificationResult): ListingStatus {
  switch (result) {
    case 'available_same_price':
    case 'available_price_changed':
      return status === 'needs_review' || status === 'temporarily_unavailable' || status === 'reserved'
        ? 'active'
        : status
    case 'temporarily_unavailable':
      return 'temporarily_unavailable'
    case 'reserved':
      return 'reserved'
    case 'closed':
      return 'closed'
    case 'withdrawn':
      return 'withdrawn'
  }
}

function verificationSummary(result: VerificationResult) {
  const summaries: Record<VerificationResult, string> = {
    available_same_price: 'Доступность и прежняя цена подтверждены',
    available_price_changed: 'Доступность подтверждена, цена обновлена',
    temporarily_unavailable: 'Объект временно недоступен',
    reserved: 'Объект забронирован',
    closed: 'Предложение закрыто: продано или сдано',
    withdrawn: 'Предложение снято',
  }
  return summaries[result]
}

function createVerificationEvent(listing: Listing, input: VerificationInput, actor: string, at: string): ListingEvent {
  return {
    id: `event-${crypto.randomUUID()}`,
    kind: 'verification',
    at,
    author: actor,
    summary: [verificationSummary(input.result), input.comment?.trim()].filter(Boolean).join(' · '),
    fromStatus: listing.status,
    toStatus: getNextStatus(listing.status, input.result),
    result: input.result,
    method: input.method,
    price: input.result === 'available_price_changed' ? input.price : undefined,
  }
}

export function recordVerification(
  listings: Listing[],
  listingId: string,
  input: VerificationInput | null,
  now = new Date(),
): Listing[] {
  if (!input) return listings

  const index = listings.findIndex((listing) => listing.id === listingId)
  if (index === -1) return listings
  const listing = listings[index]
  if (listing.status === 'closed' || listing.status === 'withdrawn' || listing.status === 'archived') return listings

  const changedPrice = input.result === 'available_price_changed'
  if (changedPrice && (!Number.isFinite(input.price) || (input.price ?? 0) <= 0 || input.price === listing.price)) {
    return listings
  }

  const at = now.toISOString()
  const nextPrice = changedPrice ? input.price! : listing.price
  const nextStatus = getNextStatus(listing.status, input.result)
  const nextListing: Listing = {
    ...listing,
    price: nextPrice,
    status: nextStatus,
    verifiedAt: at,
    verifiedBy: currentUser.name,
    verificationMethod: input.method,
    updatedAt: at,
    priceHistory: changedPrice
      ? [
          ...listing.priceHistory,
          {
            id: `price-${crypto.randomUUID()}`,
            amount: nextPrice,
            currency: listing.currency,
            priceUnit: listing.priceUnit,
            at,
            author: currentUser.name,
            note: input.comment?.trim() || 'Цена изменена при проверке актуальности',
          },
        ]
      : listing.priceHistory,
    events: [...listing.events, createVerificationEvent(listing, input, currentUser.name, at)],
  }

  return listings.map((item, itemIndex) => (itemIndex === index ? nextListing : item))
}
