import type { Metadata } from 'next'
import { ObjectsView } from '@/components/objects/objects-view'

export const metadata: Metadata = { title: 'Объекты — Kalit' }

export default function ObjectsPage() {
  return <ObjectsView />
}
