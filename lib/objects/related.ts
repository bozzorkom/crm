import type { CalendarShowing } from '../data'

export function getShowingsForListing(showings: readonly CalendarShowing[], listingId: string) {
  return showings.filter((showing) => showing.listingId === listingId)
}
