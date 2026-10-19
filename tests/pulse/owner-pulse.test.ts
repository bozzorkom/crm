import { describe, expect, it } from 'vitest'
import { leads } from '../../lib/data'
import { properties, listings } from '../../lib/objects/fixtures'
import { getOwnerPulseItems } from '../../lib/pulse'

describe('owner Pulse', () => {
  it('derives open signals from current leads and review-needed listings with record destinations', () => {
    const items = getOwnerPulseItems(leads, listings, properties)

    expect(items.map(({ id, count }) => ({ id, count }))).toEqual([
      { id: 'new-leads', count: 2 },
      { id: 'overdue-next-step', count: 1 },
      { id: 'stale-listings', count: 2 },
      { id: 'missing-next-step', count: 1 },
    ])
    expect(items[0].records.map(({ id, href }) => [id, href])).toEqual([
      ['l2', '/leads?id=l2'],
      ['l1', '/leads?id=l1'],
    ])
    expect(items[1].records[0]).toMatchObject({ id: 'l4', href: '/leads?id=l4' })
    expect(items[2].records.map(({ id, href }) => [id, href])).toEqual([
      ['listing-p3', '/objects/listing-p3'],
      ['listing-p8', '/objects/listing-p8'],
    ])
    expect(items[3].records[0]).toMatchObject({ id: 'l6', href: '/leads?id=l6' })
  })

  it('states how many new leads actually exceeded the response deadline', () => {
    const [newLeads] = getOwnerPulseItems(leads, listings, properties)

    expect(newLeads.summary).toBe('У 1 из 2 обращений превышен срок первого ответа')
  })

  it('omits issue groups with no records instead of showing zero-value warnings', () => {
    expect(getOwnerPulseItems([], [], [])).toEqual([])
  })
})
