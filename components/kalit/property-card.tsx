import Image from 'next/image'
import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import type { Property as LegacyProperty } from '@/lib/data'
import type { Listing, ListingStatus, Property } from '@/lib/objects/types'
import { formatListingPrice, formatPrice } from '@/lib/format'
import { FreshnessBadge } from './badges'

type PropertyCardProps = { property: LegacyProperty | Property; listing?: Listing; footer?: ReactNode; top?: ReactNode; priority?: boolean }

export function PropertyCard({ property, listing, footer, top, priority = false }: PropertyCardProps) {
  const isLegacy = 'price' in property
  const price = listing?.price ?? (isLegacy ? property.price : 0)
  const deal = listing?.deal ?? (isLegacy ? property.deal : 'sale')
  const status: ListingStatus | 'available' | 'stale' = listing?.status ?? (isLegacy ? property.status : 'needs_review')
  const days = listing?.verifiedAt
    ? Math.max(0, Math.floor((Date.now() - Date.parse(listing.verifiedAt)) / 86_400_000))
    : isLegacy
      ? property.verifiedDaysAgo
      : 999
  const image = property.image ?? '/placeholder.jpg'

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-background transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={image}
          alt={`${property.title}, ${property.district}`}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {top ? <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">{top}</div> : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="whitespace-nowrap text-lg font-semibold tracking-tight tabular-nums">
            {listing ? formatListingPrice(price, listing.currency, listing.priceUnit) : formatPrice(price, deal)}
          </p>
          <span className="shrink-0 whitespace-nowrap"><FreshnessBadge status={status} days={days} /></span>
        </div>
        <h3 className="text-sm font-medium">{property.title}</h3>
        <p className="text-sm text-muted-foreground">
          {property.area ? `${property.area} м²` : 'Площадь не указана'}
          {property.floor && property.floorsTotal ? ` · ${property.floor}/${property.floorsTotal} эт.` : ''}
          {property.renovation ? ` · ${property.renovation}` : ''}
        </p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          {property.district}{property.landmark ? `, ${property.landmark}` : ''}
        </p>
        {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
      </div>
    </article>
  )
}
