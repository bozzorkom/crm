import { describe, expect, it } from 'vitest'
import { calendarShowings } from '../../lib/data'
import { getShowingsForListing } from '../../lib/objects/related'

describe('listing-level related showings', () => {
  it('keeps a legacy showing attached to its original listing, not every later offer for the same property', () => {
    expect(getShowingsForListing(calendarShowings, 'listing-p1').map((showing) => showing.id)).toEqual(['c8'])
    expect(getShowingsForListing(calendarShowings, 'listing-secondary-p1')).toEqual([])
  })
})
