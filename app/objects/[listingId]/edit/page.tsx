import { ListingForm } from '@/components/objects/listing-form'

export default async function EditListingPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params
  return <ListingForm key={listingId} listingId={listingId} />
}
