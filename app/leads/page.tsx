import type { Metadata } from 'next'
import { LeadsView } from '@/components/leads/leads-view'

export const metadata: Metadata = { title: 'Лиды — Kalit' }

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return <LeadsView key={id ?? 'all'} initialId={id} />
}
