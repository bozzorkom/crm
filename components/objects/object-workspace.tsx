'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { currentUser } from '@/lib/data'
import type { ListingActivity } from '@/lib/objects/activity'
import { listings as initialListings, properties as initialProperties } from '@/lib/objects/fixtures'
import type { ImportBatch } from '@/lib/objects/import'
import { activateListing as activateListingRecord, recordVerification, type VerificationInput } from '@/lib/objects/workspace-state'
import type { Listing, ListingEvent, ListingView, Property } from '@/lib/objects/types'

export type NewPropertyInput = Omit<Property, 'id' | 'importBatchId'>
export type PropertyUpdate = Partial<Omit<Property, 'id' | 'importBatchId'>>
export type NewListingInput = Omit<
  Listing,
  'id' | 'propertyId' | 'priceHistory' | 'events' | 'createdAt' | 'updatedAt' | 'importBatchId'
>
export type ListingUpdate = Partial<
  Pick<
    Listing,
    | 'deal'
    | 'price'
    | 'currency'
    | 'priceUnit'
    | 'mortgage'
    | 'agent'
    | 'source'
    | 'visibility'
    | 'clientShareAllowed'
    | 'verifiedAt'
    | 'verifiedBy'
    | 'verificationMethod'
    | 'nextVerificationAt'
  >
>

export type ImportBatchInput = ImportBatch

type ObjectWorkspaceValue = {
  properties: Property[]
  listings: Listing[]
  listingViews: ListingView[]
  getListingView: (listingId: string) => ListingView | null
  getListingViewByLegacyId: (propertyId: string) => ListingView | null
  addPropertyWithListing: (input: { property: NewPropertyInput; listing: NewListingInput }) => Listing
  addListingForProperty: (propertyId: string, input: NewListingInput) => Listing | null
  updateProperty: (id: string, patch: PropertyUpdate) => boolean
  updateListing: (id: string, patch: ListingUpdate) => boolean
  appendListingEvents: (activities: ListingActivity[]) => void
  activateListing: (id: string) => { activated: boolean; missing: string[] }
  recordVerification: (id: string, input: VerificationInput) => boolean
  archiveListing: (id: string) => boolean
  applyImportBatch: (batch: ImportBatchInput) => number
  undoImportBatch: (batchId: string) => boolean
}

const ObjectWorkspaceContext = createContext<ObjectWorkspaceValue | null>(null)

function getInitialHistory(listing: NewListingInput, actor: string, at: string) {
  return [
    {
      id: `price-${crypto.randomUUID()}`,
      amount: listing.price,
      currency: listing.currency,
      priceUnit: listing.priceUnit,
      at,
      author: actor,
      note: 'Начальные условия предложения',
    },
  ]
}

function getCreatedEvent(actor: string, at: string): ListingEvent {
  return {
    id: `event-${crypto.randomUUID()}`,
    kind: 'created',
    at,
    author: actor,
    summary: 'Объявление создано в демо-каталоге',
  }
}

export function ObjectWorkspaceProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [listings, setListings] = useState<Listing[]>(initialListings)

  function addPropertyWithListing(input: { property: NewPropertyInput; listing: NewListingInput }) {
    const at = new Date().toISOString()
    const propertyId = `property-${crypto.randomUUID()}`
    const property: Property = { ...input.property, id: propertyId }
    const listing: Listing = {
      ...input.listing,
      id: `listing-${crypto.randomUUID()}`,
      propertyId,
      createdAt: at,
      updatedAt: at,
      priceHistory: getInitialHistory(input.listing, currentUser.name, at),
      events: [getCreatedEvent(currentUser.name, at)],
    }
    setProperties((current) => [property, ...current])
    setListings((current) => [listing, ...current])
    return listing
  }

  function addListingForProperty(propertyId: string, input: NewListingInput) {
    const propertyExists = properties.some((property) => property.id === propertyId)
    if (!propertyExists) return null

    const at = new Date().toISOString()
    const listing: Listing = {
      ...input,
      id: `listing-${crypto.randomUUID()}`,
      propertyId,
      createdAt: at,
      updatedAt: at,
      priceHistory: getInitialHistory(input, currentUser.name, at),
      events: [getCreatedEvent(currentUser.name, at)],
    }
    setListings((current) => [listing, ...current])
    return listing
  }

  function updateListing(id: string, patch: ListingUpdate) {
    const current = listings.find((listing) => listing.id === id)
    if (!current) return false

    const at = new Date().toISOString()
    const updated: Listing = { ...current, ...patch, updatedAt: at }
    const priceChanged =
      current.price !== updated.price || current.currency !== updated.currency || current.priceUnit !== updated.priceUnit

    if (priceChanged) {
      updated.priceHistory = [
        ...current.priceHistory,
        {
          id: `price-${crypto.randomUUID()}`,
          amount: updated.price,
          currency: updated.currency,
          priceUnit: updated.priceUnit,
          at,
          author: currentUser.name,
          note: 'Условия обновлены при редактировании объявления',
        },
      ]
      updated.events = [
        ...current.events,
        {
          id: `event-${crypto.randomUUID()}`,
          kind: 'price',
          at,
          author: currentUser.name,
          summary: 'Условия предложения изменены',
          price: updated.price,
        },
      ]
    }

    setListings((items) => items.map((listing) => (listing.id === id ? updated : listing)))
    return true
  }

  function updateProperty(id: string, patch: PropertyUpdate) {
    if (!properties.some((property) => property.id === id)) return false
    setProperties((items) => items.map((property) => (property.id === id ? { ...property, ...patch } : property)))
    return true
  }

  function appendListingEvents(activities: ListingActivity[]) {
    if (!activities.length) return
    const byListing = new Map<string, ListingEvent[]>()
    for (const activity of activities) {
      byListing.set(activity.listingId, [...(byListing.get(activity.listingId) ?? []), activity.event])
    }
    setListings((items) => items.map((listing) => {
      const events = byListing.get(listing.id)
      if (!events) return listing
      return { ...listing, events: [...listing.events, ...events], updatedAt: events.at(-1)?.at ?? listing.updatedAt }
    }))
  }

  function activateListingInWorkspace(id: string) {
    const listing = listings.find((item) => item.id === id)
    const property = listing && properties.find((item) => item.id === listing.propertyId)
    if (!listing || !property) return { activated: false, missing: ['объявление или объект не найдены'] }

    const result = activateListingRecord(listing, property)
    if (!result.listing) return { activated: false, missing: result.missing }
    setListings((items) => items.map((item) => (item.id === id ? result.listing! : item)))
    return { activated: true, missing: [] }
  }

  function recordVerificationForListing(id: string, input: VerificationInput) {
    const updated = recordVerification(listings, id, input)
    if (updated === listings) return false
    setListings(updated)
    return true
  }

  function archiveListing(id: string) {
    const current = listings.find((listing) => listing.id === id)
    if (!current || current.status === 'archived') return false
    const at = new Date().toISOString()
    setListings((items) =>
      items.map((listing) =>
        listing.id === id
          ? {
              ...listing,
              status: 'archived',
              updatedAt: at,
              events: [
                ...listing.events,
                {
                  id: `event-${crypto.randomUUID()}`,
                  kind: 'archived',
                  at,
                  author: currentUser.name,
                  summary: 'Объявление перемещено в архив',
                  fromStatus: listing.status,
                  toStatus: 'archived',
                },
              ],
            }
          : listing,
      ),
    )
    return true
  }

  function applyImportBatch(batch: ImportBatchInput) {
    const nextProperties = [...properties]
    const nextListings = [...listings]

    for (const record of batch.records) {
      if (record.action === 'skip') continue

      if (record.propertyAction === 'create' && !nextProperties.some((property) => property.id === record.property.id)) {
        nextProperties.unshift({ ...record.property, importBatchId: batch.id })
      }
      const propertyExists = nextProperties.some((property) => property.id === record.property.id)
      if (!propertyExists || nextListings.some((listing) => listing.id === record.listing.id)) continue

      nextListings.unshift({
        ...record.listing,
        status: 'draft',
        importBatchId: batch.id,
        priceHistory: record.listing.priceHistory.length
          ? record.listing.priceHistory
          : [{
              id: `price-${crypto.randomUUID()}`,
              amount: record.listing.price,
              currency: record.listing.currency,
              priceUnit: record.listing.priceUnit,
              at: new Date().toISOString(),
              author: currentUser.name,
              note: 'Исходные условия локального импорта',
            }],
        events: [
          ...record.listing.events,
          {
            id: `event-${crypto.randomUUID()}`,
            kind: 'import',
            at: new Date().toISOString(),
            author: currentUser.name,
            summary: 'Добавлено из подтверждённого локального импорта',
          },
        ],
      })
    }

    setProperties(nextProperties)
    setListings(nextListings)
    return nextListings.filter((listing) => listing.importBatchId === batch.id).length
  }

  function undoImportBatch(batchId: string) {
    const importedListings = listings.filter((listing) => listing.importBatchId === batchId)
    if (!importedListings.length) return false
    const removedListingIds = new Set(importedListings.map((listing) => listing.id))
    const nextListings = listings.filter((listing) => !removedListingIds.has(listing.id))
    const retainedPropertyIds = new Set(nextListings.map((listing) => listing.propertyId))
    setListings(nextListings)
    setProperties((items) =>
      items.filter((property) => property.importBatchId !== batchId || retainedPropertyIds.has(property.id)),
    )
    return true
  }

  function getListingView(listingId: string) {
    const listing = listings.find((item) => item.id === listingId)
    const property = listing && properties.find((item) => item.id === listing.propertyId)
    return listing && property ? { property, listing } : null
  }

  function getListingViewByLegacyId(propertyId: string) {
    const property = properties.find((item) => item.id === propertyId)
    const listing =
      listings.find((item) => item.id === `listing-${propertyId}`) ??
      listings.find((item) => item.propertyId === propertyId)
    return property && listing ? { property, listing } : null
  }

  const listingViews = listings.flatMap((listing) => {
    const property = properties.find((item) => item.id === listing.propertyId)
    return property ? [{ property, listing }] : []
  })

  return (
    <ObjectWorkspaceContext.Provider
      value={{
        properties,
        listings,
        listingViews,
        getListingView,
        getListingViewByLegacyId,
        addPropertyWithListing,
        addListingForProperty,
        updateProperty,
        updateListing,
        appendListingEvents,
        activateListing: activateListingInWorkspace,
        recordVerification: recordVerificationForListing,
        archiveListing,
        applyImportBatch,
        undoImportBatch,
      }}
    >
      {children}
    </ObjectWorkspaceContext.Provider>
  )
}

export function useObjectWorkspace() {
  const workspace = useContext(ObjectWorkspaceContext)
  if (!workspace) throw new Error('useObjectWorkspace must be used inside ObjectWorkspaceProvider')
  return workspace
}
