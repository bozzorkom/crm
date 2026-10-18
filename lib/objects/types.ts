export type DealType = 'sale' | 'rent'
export type PropertyKind = 'apartment' | 'house' | 'commercial' | 'land'
export type Currency = 'USD' | 'UZS'
export type PriceUnit = 'total' | 'month'
export type ListingStatus =
  | 'draft'
  | 'review'
  | 'active'
  | 'needs_review'
  | 'temporarily_unavailable'
  | 'reserved'
  | 'closed'
  | 'withdrawn'
  | 'archived'
export type ListingVisibility = 'team' | 'assigned' | 'partner'
export type VerificationMethod = 'phone' | 'message' | 'in_person' | 'agent_report' | 'source_update'
export type VerificationResult =
  | 'available_same_price'
  | 'available_price_changed'
  | 'temporarily_unavailable'
  | 'reserved'
  | 'closed'
  | 'withdrawn'

export type ClientReaction = 'interested' | 'not_interested' | 'question' | 'showing'

export type Property = {
  id: string
  kind: PropertyKind
  title: string
  city: string
  district: string
  landmark?: string
  exactAddress?: string
  rooms?: number
  area?: number
  floor?: number
  floorsTotal?: number
  buildingType?: string
  yearBuilt?: number
  renovation?: 'Евроремонт' | 'Хороший' | 'Требует ремонта' | 'Коробка' | string
  condition?: string
  features: string[]
  image?: string
  importBatchId?: string
}

export type ListingSource = {
  type: 'owner' | 'agent' | 'portal' | 'referral' | 'import' | 'demo' | 'unknown' | 'other'
  label: string
  note?: string
}

export type PriceHistoryEntry = {
  id: string
  amount: number
  currency: Currency
  priceUnit: PriceUnit
  at: string
  author: string
  note?: string
}

export type ListingEvent = {
  id: string
  kind: 'created' | 'status' | 'verification' | 'price' | 'import' | 'selection' | 'reaction' | 'note' | 'archived'
  at: string
  author: string
  summary: string
  fromStatus?: ListingStatus
  toStatus?: ListingStatus
  result?: VerificationResult
  method?: VerificationMethod
  reaction?: ClientReaction
  price?: number
  leadId?: string
  reason?: string
}

export type Listing = {
  id: string
  propertyId: string
  deal: DealType
  price: number
  currency: Currency
  priceUnit: PriceUnit
  mortgage: boolean
  agent: string
  source: ListingSource
  visibility: ListingVisibility
  clientShareAllowed: boolean
  status: ListingStatus
  verifiedAt?: string
  verifiedBy?: string
  verificationMethod?: VerificationMethod
  nextVerificationAt?: string
  priceHistory: PriceHistoryEntry[]
  events: ListingEvent[]
  createdAt?: string
  updatedAt?: string
  importBatchId?: string
}

export type ListingView = {
  property: Property
  listing: Listing
}

export type ListingDuplicate = {
  propertyId: string
  listingId: string
  kinds: ('same_property' | 'same_listing')[]
  reasons: string[]
}
