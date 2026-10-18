import type { Need } from '../data'
import { getClientEligibleListings } from './domain'
import type { ListingView } from './types'

export type ListingMatchResult = {
  view: ListingView
  score: number
  matches: string[]
  mismatches: string[]
  warnings: string[]
}

export function filterSelectedMatchIds(
  selectedIds: string[],
  results: { exact: ListingMatchResult[]; near: ListingMatchResult[] },
) {
  const visibleIds = new Set([...results.exact, ...results.near].map((result) => result.view.listing.id))
  return selectedIds.filter((id) => visibleIds.has(id))
}

export function matchListings(need: Need, views: ListingView[], now = Date.now()): { exact: ListingMatchResult[]; near: ListingMatchResult[] } {
  const results: ListingMatchResult[] = []

  for (const view of getClientEligibleListings(views, now)) {
    const { property, listing } = view
    if (listing.deal !== need.deal) continue

    const matches: string[] = []
    const mismatches: string[] = []
    const warnings: string[] = []
    let score = 100

    if (need.rooms) {
      if (property.rooms === need.rooms) matches.push(`${need.rooms} комн.`)
      else if (property.rooms === undefined) {
        mismatches.push('Количество комнат не указано')
        score -= 20
      } else if (Math.abs(property.rooms - need.rooms) === 1) {
        mismatches.push(`${property.rooms} комн. вместо ${need.rooms}`)
        score -= 30
      } else continue
    }

    if (need.districts.length) {
      if (need.districts.includes(property.district)) matches.push(property.district)
      else continue
    }

    if (need.budgetMax) {
      const budgetCurrency = need.budgetCurrency ?? 'USD'
      if (budgetCurrency === 'unknown') {
        warnings.push('Валюта бюджета не распознана; цена не сравнивается')
        score -= 25
      } else if (listing.currency !== budgetCurrency) {
        warnings.push(`Валюта предложения ${listing.currency} не сравнивается с бюджетом в ${budgetCurrency}`)
        score -= 25
      } else {
        const expectedUnit = need.deal === 'rent' ? 'month' : 'total'
        if (listing.priceUnit !== expectedUnit) {
          warnings.push('Период цены не сопоставим с бюджетом клиента')
          score -= 25
        } else if (listing.price <= need.budgetMax) {
          matches.push('В бюджете')
        } else {
          const over = (listing.price - need.budgetMax) / need.budgetMax
          if (over > 0.12) continue
          mismatches.push(`Выше бюджета на ${Math.round(over * 100)}%`)
          score -= Math.round(over * 200)
        }
      }
    }

    if (need.mortgage) {
      if (listing.mortgage) matches.push('Ипотека')
      else {
        mismatches.push('Без ипотеки')
        score -= 20
      }
    }

    results.push({ view, score: Math.max(score, 5), matches, mismatches, warnings })
  }

  results.sort((left, right) => right.score - left.score)
  return {
    exact: results.filter((result) => result.mismatches.length === 0 && result.warnings.length === 0),
    near: results.filter((result) => result.mismatches.length > 0 || result.warnings.length > 0),
  }
}
