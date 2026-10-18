import { ListingForm } from '@/components/objects/listing-form'

export default async function NewObjectPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>
}) {
  const { propertyId } = await searchParams
  return <ListingForm key={propertyId ?? 'new-property'} existingPropertyId={propertyId} />
}
