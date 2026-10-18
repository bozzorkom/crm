import { currentUser, properties as legacyProperties, type Property as LegacyProperty } from '../data'
import type { Listing, ListingEvent, Property } from './types'

const fixtureNow = Date.parse('2026-10-16T12:00:00.000Z')

export const properties: Property[] = legacyProperties.map((legacy: LegacyProperty) => ({
  id: legacy.id,
  kind: 'apartment',
  title: legacy.title,
  city: 'Ташкент',
  district: legacy.district,
  landmark: legacy.landmark,
  rooms: legacy.rooms,
  area: legacy.area,
  floor: legacy.floor,
  floorsTotal: legacy.floorsTotal,
  image: legacy.image,
  renovation: legacy.renovation,
  condition: legacy.renovation,
  features: legacy.mortgage ? ['Ипотека возможна'] : [],
}))

export const listings: Listing[] = legacyProperties.map((legacy: LegacyProperty) => {
  const verifiedAt = new Date(fixtureNow - legacy.verifiedDaysAgo * 24 * 60 * 60 * 1000).toISOString()
  const status: Listing['status'] =
    legacy.status === 'reserved'
      ? 'reserved'
      : legacy.status === 'stale' || legacy.verifiedDaysAgo > 14
        ? 'needs_review'
        : 'active'
  const id = `listing-${legacy.id}`
  const priceHistory = [
    {
      id: `price-${legacy.id}-initial`,
      amount: legacy.price,
      currency: 'USD' as const,
      priceUnit: legacy.deal === 'rent' ? ('month' as const) : ('total' as const),
      at: verifiedAt,
      author: legacy.agent,
      note: 'Исходная демонстрационная цена',
    },
  ]
  const events: ListingEvent[] = [
    {
      id: `event-${legacy.id}-created`,
      kind: 'created',
      at: verifiedAt,
      author: currentUser.name,
      summary: 'Демонстрационное объявление добавлено в каталог',
    },
    {
      id: `event-${legacy.id}-check`,
      kind: 'verification',
      at: verifiedAt,
      author: legacy.agent,
      summary: `Демо-проверка: ${legacy.verifiedDaysAgo} дн. назад`,
      result: 'available_same_price',
      method: 'agent_report',
    },
  ]

  return {
    id,
    propertyId: legacy.id,
    deal: legacy.deal,
    price: legacy.price,
    currency: 'USD',
    priceUnit: legacy.deal === 'rent' ? 'month' : 'total',
    mortgage: legacy.mortgage,
    agent: legacy.agent,
    source: { type: 'demo', label: 'Демо-каталог', note: 'Синтетические данные, источник не проверялся' },
    visibility: 'team',
    clientShareAllowed: status === 'active',
    status,
    verifiedAt,
    verifiedBy: legacy.agent,
    verificationMethod: 'agent_report',
    priceHistory,
    events,
    createdAt: verifiedAt,
    updatedAt: verifiedAt,
  }
})

export function getListingViewByLegacyId(id: string) {
  const property = properties.find((item) => item.id === id)
  const listing = listings.find((item) => item.propertyId === id)
  return property && listing ? { property, listing } : null
}

export function getListingViewById(id: string) {
  const listing = listings.find((item) => item.id === id)
  const property = listing && properties.find((item) => item.id === listing.propertyId)
  return listing && property ? { property, listing } : null
}
