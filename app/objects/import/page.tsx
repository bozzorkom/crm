import type { Metadata } from 'next'
import { ImportWizard } from '@/components/objects/import-wizard'

export const metadata: Metadata = { title: 'Локальный импорт — Kalit' }

export default function ObjectsImportPage() {
  return <ImportWizard />
}
