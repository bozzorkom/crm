import type { Metadata } from 'next'
import { DealsBoard } from '@/components/deals/deals-board'

export const metadata: Metadata = { title: 'Сделки — Kalit' }

export default function DealsPage() {
  return <DealsBoard />
}
