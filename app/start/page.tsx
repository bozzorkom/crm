import type { Metadata } from 'next'
import { ActivationStart } from '@/components/activation/activation-start'

export const metadata: Metadata = { title: 'Первый результат — Kalit' }

export default function ActivationStartPage() {
  return <ActivationStart />
}
