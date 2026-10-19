import type { Metadata } from 'next'
import { AgencyAccessPreview } from '@/components/shell/agency-access-preview'
import { OwnerPulse } from '@/components/pulse/owner-pulse'

export const metadata: Metadata = { title: 'Пульс агентства — Kalit' }

export default function PulsePage() {
  return (
    <AgencyAccessPreview title="Пульс агентства" description="Текущие исключения, требующие решения руководителя.">
      <OwnerPulse />
    </AgencyAccessPreview>
  )
}
