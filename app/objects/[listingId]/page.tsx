import { ListingDetail } from '@/components/objects/listing-detail'

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ listingId: string }>
  searchParams: Promise<{ verify?: string; leadId?: string }>
}) {
  const [{ listingId }, { verify, leadId }] = await Promise.all([params, searchParams])
  return <ListingDetail key={listingId} listingId={listingId} verifyOnLoad={verify === '1'} initialLeadId={leadId} />
}
