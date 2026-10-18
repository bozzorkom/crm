import { describe, expect, it } from 'vitest'
import { currentUser } from '../../lib/data'
import { getListingViewByLegacyId } from '../../lib/objects/fixtures'
import { activateListing, recordVerification, type VerificationInput } from '../../lib/objects/workspace-state'
import type { Listing } from '../../lib/objects/types'

const confirmedAt = new Date('2026-10-16T09:30:00.000Z')

function withStatus(status: Listing['status']): Listing {
  return {
    ...getListingViewByLegacyId('p3')!.listing,
    id: `test-${status}`,
    status,
    price: 78000,
    priceHistory: [],
    events: [],
  }
}

const available: VerificationInput = { result: 'available_same_price', method: 'phone' }

describe('Object workspace verification', () => {
  it('activates a complete draft only through a separate action, without implying verification', () => {
    const view = getListingViewByLegacyId('p1')!
    const draft = { ...view.listing, status: 'draft' as const, verifiedAt: undefined, events: [] }
    const activated = activateListing(draft, view.property, confirmedAt)

    expect(activated).toMatchObject({ listing: { status: 'active', verifiedAt: undefined } })
    expect(activated.listing?.events[0]).toMatchObject({
      kind: 'status',
      author: currentUser.name,
      at: confirmedAt.toISOString(),
      fromStatus: 'draft',
      toStatus: 'active',
    })
  })

  it('keeps incomplete drafts inactive and reports activation prerequisites', () => {
    const view = getListingViewByLegacyId('p1')!
    const draft = {
      ...view.listing,
      status: 'draft' as const,
      price: 0,
      clientShareAllowed: false,
      verifiedAt: undefined,
      events: [],
    }
    const result = activateListing(draft, { ...view.property, district: '' }, confirmedAt)

    expect(result.listing).toBeNull()
    expect(result.missing).toEqual(['район', 'цена', 'разрешение на показ клиенту'])
  })

  it('records fixed actor, confirmation time, and a changed price in both histories', () => {
    const before = withStatus('needs_review')
    const input: VerificationInput = {
      result: 'available_price_changed',
      method: 'phone',
      price: 76500,
      comment: 'Цена подтверждена агентом',
    }
    const [after] = recordVerification([before], before.id, input, confirmedAt)

    expect(after).toMatchObject({
      status: 'active',
      price: 76500,
      verifiedAt: confirmedAt.toISOString(),
      verifiedBy: currentUser.name,
      verificationMethod: 'phone',
    })
    expect(after.priceHistory).toHaveLength(1)
    expect(after.priceHistory[0]).toMatchObject({
      amount: 76500,
      currency: 'USD',
      at: confirmedAt.toISOString(),
      author: currentUser.name,
      note: 'Цена подтверждена агентом',
    })
    expect(after.events[0]).toMatchObject({
      kind: 'verification',
      author: currentUser.name,
      at: confirmedAt.toISOString(),
      result: 'available_price_changed',
      method: 'phone',
      price: 76500,
    })
  })

  it.each([
    ['needs_review', 'active'],
    ['temporarily_unavailable', 'active'],
    ['reserved', 'active'],
    ['draft', 'draft'],
    ['review', 'review'],
  ] as const)('moves %s to %s after explicit availability confirmation', (beforeStatus, expectedStatus) => {
    const before = withStatus(beforeStatus)
    const [after] = recordVerification([before], before.id, available, confirmedAt)
    expect(after.status).toBe(expectedStatus)
    expect(after.verifiedAt).toBe(confirmedAt.toISOString())
  })

  it('does not change state when verification is cancelled or asks to reactivate a terminal listing', () => {
    const cancelledState = [withStatus('needs_review')]
    expect(recordVerification(cancelledState, cancelledState[0].id, null, confirmedAt)).toBe(cancelledState)

    const closedState = [withStatus('closed')]
    expect(recordVerification(closedState, closedState[0].id, available, confirmedAt)).toBe(closedState)
    expect(closedState[0].status).toBe('closed')
  })

  it('rejects changed-price verification without a new positive price', () => {
    const state = [withStatus('needs_review')]
    const invalid: VerificationInput = { result: 'available_price_changed', method: 'message', price: 0 }

    expect(recordVerification(state, state[0].id, invalid, confirmedAt)).toBe(state)
  })
})
