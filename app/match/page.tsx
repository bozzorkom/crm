import type { Metadata } from 'next'
import { PageHeader } from '@/components/shell/page-header'
import { MatchView } from '@/components/match/match-view'
import { needFromSearchParams } from '@/lib/match'
import type { Need } from '@/lib/data'

export const metadata: Metadata = { title: 'Подбор — Kalit' }

const defaultNeed: Need = { deal: 'sale', rooms: 3, districts: ['Чиланзар', 'Юнусабад'], budgetMax: 85000, mortgage: true }

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const need = needFromSearchParams(params) ?? defaultNeed
  const rawLeadId = params.leadId
  const leadId = Array.isArray(rawLeadId) ? rawLeadId[0] : rawLeadId

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <PageHeader title="Подбор" description="Свежие объявления с разрешением на показ, отсортированные по совпадению с запросом клиента." />
      <MatchView key={`${JSON.stringify(need)}-${leadId ?? ''}`} initialNeed={need} leadId={leadId} />
    </div>
  )
}
