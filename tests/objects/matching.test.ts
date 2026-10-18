import { describe, expect, it } from 'vitest'
import type { Lead, Need } from '../../lib/data'
import { currentUser } from '../../lib/data'
import { recordClientReaction, recordSelectionActivity } from '../../lib/objects/activity'
import { extractNeed, needFromSearchParams, needToSearchParams } from '../../lib/match'
import { filterSelectedMatchIds, matchListings } from '../../lib/objects/matching'
import type { Listing, ListingView, Property } from '../../lib/objects/types'

const now = Date.parse('2026-10-16T12:00:00.000Z')
const need: Need = { deal: 'sale', rooms: 3, districts: ['Чиланзар'], budgetMax: 85000, mortgage: true }

function makeView(overrides: Partial<Listing> = {}, propertyOverrides: Partial<Property> = {}): ListingView {
  const property: Property = {
    id: 'property-1', kind: 'apartment', title: '3-комн., тестовый дом', city: 'Ташкент', district: 'Чиланзар',
    rooms: 3, area: 82, features: [], ...propertyOverrides,
  }
  const listing: Listing = {
    id: 'listing-1', propertyId: property.id, deal: 'sale', price: 80000, currency: 'USD', priceUnit: 'total',
    mortgage: true, agent: 'Агент', source: { type: 'demo', label: 'Демо' }, visibility: 'team', clientShareAllowed: true,
    status: 'active', verifiedAt: '2026-10-15T12:00:00.000Z', priceHistory: [], events: [], ...overrides,
  }
  return { property, listing }
}

function makeLead(): Lead {
  return {
    id: 'lead-1', name: 'Клиент демо', source: 'Сайт', minutesAgo: 0, slaMinutes: 15, status: 'qualified', owner: 'Дилноза К.',
    request: 'Тестовый запрос', need, timeline: [],
  }
}

describe('session matching and linked activity', () => {
  it.each(['needs_review', 'temporarily_unavailable', 'reserved', 'closed', 'withdrawn', 'archived', 'draft', 'review'] as const)(
    'never matches a %s listing exactly',
    (status) => {
      const result = matchListings(need, [makeView({ status })], now)
      expect(result.exact).toEqual([])
      expect(result.near).toEqual([])
    },
  )

  it('excludes fresh active listings without explicit sharing permission', () => {
    expect(matchListings(need, [makeView({ clientShareAllowed: false })], now).exact).toEqual([])
  })

  it('excludes stale active listings beyond the freshness window', () => {
    expect(matchListings(need, [makeView({ verifiedAt: '2026-09-01T12:00:00.000Z' })], now).exact).toEqual([])
  })

  it('returns only eligible active, fresh, explicitly shareable listings as exact matches', () => {
    const eligible = makeView()
    const result = matchListings(need, [eligible, makeView({ id: 'reserved', status: 'reserved' })], now)
    expect(result.exact.map((item) => item.view.listing.id)).toEqual(['listing-1'])
  })

  it('does not compare unlike currencies as if they were equivalent', () => {
    const result = matchListings(need, [makeView({ currency: 'UZS', price: 80_000 })], now)
    expect(result.exact).toEqual([])
    expect(result.near[0].warnings).toContain('Валюта предложения UZS не сравнивается с бюджетом в USD')
  })

  it('preserves an explicit UZS budget from request parsing and compares only UZS listings', () => {
    const extraction = extractNeed('Нужна 3-комнатная квартира в Чиланзаре до 200 000 000 сум')
    expect(extraction.need).toMatchObject({ budgetMax: 200_000_000, budgetCurrency: 'UZS' })
    expect(extraction.fields.find((field) => field.key === 'budget')?.value).toContain('сум')

    const roundTrip = needFromSearchParams(Object.fromEntries(new URLSearchParams(needToSearchParams(extraction.need))))
    expect(roundTrip).toMatchObject({ budgetMax: 200_000_000, budgetCurrency: 'UZS' })

    const uzs = matchListings(extraction.need, [makeView({ currency: 'UZS', price: 150_000_000 })], now)
    expect(uzs.exact).toHaveLength(1)
    const usd = matchListings(extraction.need, [makeView({ currency: 'USD', price: 150_000 })], now)
    expect(usd.exact).toEqual([])
    expect(usd.near[0].warnings).toContain('Валюта предложения USD не сравнивается с бюджетом в UZS')
  })

  it.each(["so'm", 'soʻm', 'so’m'])('recognizes the Uzbek Latin currency spelling %s as UZS', (currency) => {
    const extraction = extractNeed(`Нужна 3-комнатная квартира в Чиланзаре до 200 000 000 ${currency}`)
    expect(extraction.need).toMatchObject({ budgetMax: 200_000_000, budgetCurrency: 'UZS' })
    expect(extraction.fields.find((field) => field.key === 'budget')?.value).toContain('сум')
  })

  it('drops selected listing IDs that are no longer present in the current match results', () => {
    const result = matchListings(need, [makeView()], now)
    expect(filterSelectedMatchIds(['listing-1', 'hidden-listing'], result)).toEqual(['listing-1'])
  })

  it('records a prepared selection in the lead and listing timelines without claiming delivery', () => {
    const lead = makeLead()
    const view = makeView()
    const at = '2026-10-16T12:00:00.000Z'
    const result = recordSelectionActivity(lead, [view.listing], ['listing-1'], { at, actor: currentUser.name })

    expect(result.lead.timeline.at(-1)?.text).toContain('Подборка подготовлена')
    expect(result.lead.timeline.at(-1)?.text).toContain('не отправлена')
    expect(result.listingEvents).toEqual([expect.objectContaining({ listingId: 'listing-1', event: expect.objectContaining({ kind: 'selection', leadId: lead.id, at }) })])
  })

  it('records a client reaction and reason in both timelines', () => {
    const lead = makeLead()
    const view = makeView()
    const result = recordClientReaction(lead, view.listing, 'not_interested', 'Не подходит район', { at: '2026-10-16T12:10:00.000Z', actor: currentUser.name })

    expect(result.lead.timeline.at(-1)?.text).toContain('Не подходит район')
    expect(result.listingEvent).toMatchObject({ kind: 'reaction', leadId: lead.id, reaction: 'not_interested', reason: 'Не подходит район' })
  })
})
