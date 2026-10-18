import type { DealType } from './data'
import type { Currency, PriceUnit } from './objects/types'

const number = new Intl.NumberFormat('ru-RU')

export function formatUsd(value: number) {
  return `$${number.format(value)}`
}

export function formatPrice(value: number, deal: DealType) {
  return deal === 'rent' ? `${formatUsd(value)}/мес` : formatUsd(value)
}

export function formatListingPrice(value: number, currency: Currency, priceUnit: PriceUnit) {
  const formatted = currency === 'USD' ? formatUsd(value) : `${number.format(value)} сум`
  return priceUnit === 'month' ? `${formatted}/мес` : formatted
}

export function formatNeedBudget(value: number, currency: Currency | 'unknown' = 'USD', deal?: DealType) {
  const formatted = currency === 'UZS'
    ? `${number.format(value)} сум`
    : currency === 'unknown'
      ? `${number.format(value)} · валюта не распознана`
      : formatUsd(value)
  return deal === 'rent' ? `${formatted}/мес` : formatted
}

export function formatAgo(minutes: number) {
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч`
  const days = Math.floor(hours / 24)
  return `${days} дн`
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function roomsLabel(rooms: number) {
  return `${rooms}-комн.`
}
