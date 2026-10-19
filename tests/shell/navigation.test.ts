import { describe, expect, it } from 'vitest'
import * as navigationModule from '../../components/shell/nav-items'
import * as rolesModule from '../../lib/roles'

const navigationFor = (role: 'agent' | 'manager' | 'owner') => {
  const getNavigationForRole = (navigationModule as Record<string, unknown>).getNavigationForRole
  return typeof getNavigationForRole === 'function'
    ? (getNavigationForRole as (role: 'agent' | 'manager' | 'owner') => { href: string }[])(role)
    : []
}

describe('role-aware workspace navigation', () => {
  it('keeps the agent navigation focused on daily work without owner surfaces', () => {
    expect(navigationFor('agent').map((item) => item.href)).toEqual([
      '/', '/leads', '/match', '/calendar', '/objects', '/deals',
    ])
  })

  it('gives managers a live Pulse while keeping Analytics a separate destination', () => {
    const routes = navigationFor('manager').map((item) => item.href)

    expect(routes).toContain('/pulse')
    expect(routes).toContain('/analytics')
    expect(routes).toContain('/team')
    expect(routes.indexOf('/pulse')).toBeLessThan(routes.indexOf('/analytics'))
  })

  it('gives owners the agency overview and operational routes', () => {
    expect(navigationFor('owner').map((item) => item.href)).toEqual([
      '/', '/leads', '/match', '/calendar', '/objects', '/deals', '/pulse', '/team', '/analytics',
    ])
  })

  it('keeps direct agency-page previews consistent with role navigation', () => {
    const canViewAgencyPages = (rolesModule as Record<string, unknown>).canViewAgencyPages
    const canView = typeof canViewAgencyPages === 'function'
      ? canViewAgencyPages as (role: 'agent' | 'manager' | 'owner') => boolean
      : () => true

    expect(canView('agent')).toBe(false)
    expect(canView('manager')).toBe(true)
    expect(canView('owner')).toBe(true)
  })
})
