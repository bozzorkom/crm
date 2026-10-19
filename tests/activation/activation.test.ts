import { describe, expect, it } from 'vitest'
import type { Lead } from '../../lib/data'
import { leads } from '../../lib/data'
import type { ListingMatchResult } from '../../lib/objects/matching'
import type { Listing, ListingView, Property } from '../../lib/objects/types'
import { buildActivationMatchHref, buildActivationProof, prepareActivationSelection } from '../../lib/activation'

const lead = leads.find((item) => item.id === 'l1')!

function makeMatch(overrides: { property?: Partial<Property>; listing?: Partial<Listing> } = {}): ListingMatchResult {
  const view: ListingView = {
    property: {
      id: 'property-1', kind: 'apartment', title: '3-комн., ЖК Тест', city: 'Ташкент', district: 'Чиланзар',
      rooms: 3, features: [], ...overrides.property,
    },
    listing: {
      id: 'listing-1', propertyId: 'property-1', deal: 'sale', price: 82000, currency: 'USD', priceUnit: 'total',
      mortgage: true, agent: 'Дилноза К.', source: { type: 'demo', label: 'Демо-каталог' }, visibility: 'team',
      clientShareAllowed: true, status: 'active', priceHistory: [], events: [], ...overrides.listing,
    },
  }
  return { view, score: 100, matches: ['3 комн.', 'Чиланзар', 'В бюджете', 'Ипотека'], mismatches: [], warnings: [] }
}

describe('activation flow', () => {
  it('opens the existing matcher with the sample lead and its confirmed need', () => {
    const params = new URLSearchParams(buildActivationMatchHref(lead).split('?')[1])

    expect(params.get('leadId')).toBe('l1')
    expect(params.get('flow')).toBe('activation')
    expect(params.get('deal')).toBe('sale')
    expect(params.get('rooms')).toBe('3')
    expect(params.get('districts')).toBe('Чиланзар,Юнусабад')
    expect(params.get('budget')).toBe('85000')
    expect(params.get('mortgage')).toBe('1')
  })

  it('builds proof from the selected listing and labels the fixture as demo data', () => {
    const proof = buildActivationProof(lead, [makeMatch()])

    expect(proof).toMatchObject({
      leadName: 'Шахзод Турсунов',
      leadSource: 'Telegram',
      owner: 'Дилноза К.',
      need: { deal: 'sale', rooms: 3, districts: ['Чиланзар', 'Юнусабад'], budgetMax: 85000, mortgage: true, moveIn: '1 месяц' },
      requestLabel: 'Демо-запрос',
      listingsLabel: 'Демо-объявления',
      selectedCount: 1,
      listings: [{ id: 'listing-1', title: '3-комн., ЖК Тест', district: 'Чиланзар', price: '$82 000', sourceLabel: 'Демо-каталог', fit: 'Точное совпадение', matches: ['3 комн.', 'Чиланзар', 'В бюджете', 'Ипотека'] }],
    })
  })

  it('marks session-created client data without mislabeling it as a demo request', () => {
    const sessionLead: Lead = { ...lead, sessionOnly: true }
    const proof = buildActivationProof(sessionLead, [makeMatch()])

    expect(proof?.requestLabel).toBe('Запрос этой сессии')
    expect(proof?.listingsLabel).toBe('Демо-объявления')
  })

  it('identifies the source of each listing when a result combines demo and workspace data', () => {
    const workspaceMatch = makeMatch({
      property: { id: 'property-2', title: '3-комн., рабочее объявление' },
      listing: { id: 'listing-2', propertyId: 'property-2', source: { type: 'agent', label: 'Рабочая база' } },
    })
    const proof = buildActivationProof(lead, [makeMatch(), workspaceMatch])

    expect(proof?.listingsLabel).toBe('Смешанные источники')
    expect(proof?.listings.map((listing) => listing.sourceLabel)).toEqual(['Демо-каталог', 'Рабочая база'])
  })

  it('records only selected eligible matches and builds the proof from those records', () => {
    const selectedView = makeMatch().view
    const hiddenView = makeMatch({ listing: { id: 'listing-hidden' } }).view
    const prepared = prepareActivationSelection(
      lead,
      [selectedView.listing, hiddenView.listing],
      ['listing-1', 'listing-hidden', 'stale-listing'],
      { exact: [makeMatch()], near: [] },
      { at: '2026-10-16T12:00:00.000Z', actor: 'Тестовый агент' },
    )

    expect(prepared?.lead.timeline.at(-1)?.text).toContain('Подборка подготовлена: 1 объявление')
    expect(prepared?.listingEvents).toMatchObject([{ listingId: 'listing-1', event: { kind: 'selection', leadId: 'l1', at: '2026-10-16T12:00:00.000Z' } }])
    expect(prepared?.selectedMatches.map((result) => result.view.listing.id)).toEqual(['listing-1'])
    expect(buildActivationProof(prepared!.lead, prepared!.selectedMatches)?.selectedCount).toBe(1)
  })

  it('does not produce activation proof before an eligible listing is selected', () => {
    expect(buildActivationProof(lead, [])).toBeNull()
  })
})
