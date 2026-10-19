import {
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  Inbox,
  ScanSearch,
  Sparkles,
  SquareKanban,
  Sun,
  UsersRound,
} from 'lucide-react'
import type { WorkspaceRole } from '@/lib/roles'

export type { WorkspaceRole } from '@/lib/roles'

type NavItem = {
  href: string
  label: string
  icon: typeof Sun
  mobile: boolean
  badge?: number
  roles: readonly WorkspaceRole[]
}

const dailyRoles: readonly WorkspaceRole[] = ['agent', 'manager', 'owner']
const agencyRoles: readonly WorkspaceRole[] = ['manager', 'owner']

export const navItems: readonly NavItem[] = [
  { href: '/', label: 'Сегодня', icon: Sun, mobile: true, roles: dailyRoles },
  { href: '/leads', label: 'Лиды', icon: Inbox, badge: 2, mobile: true, roles: dailyRoles },
  { href: '/match', label: 'Подбор', icon: Sparkles, mobile: false, roles: dailyRoles },
  { href: '/calendar', label: 'Показы', icon: CalendarDays, mobile: true, roles: dailyRoles },
  { href: '/objects', label: 'Объекты', icon: Building2, mobile: true, roles: dailyRoles },
  { href: '/deals', label: 'Сделки', icon: SquareKanban, mobile: true, roles: dailyRoles },
  { href: '/pulse', label: 'Пульс', icon: ScanSearch, mobile: true, roles: agencyRoles },
  { href: '/team', label: 'Команда', icon: UsersRound, mobile: false, roles: agencyRoles },
  { href: '/analytics', label: 'Аналитика', icon: ChartNoAxesColumn, mobile: false, roles: agencyRoles },
]

export function getNavigationForRole(role: WorkspaceRole) {
  return navItems.filter((item) => item.roles.includes(role))
}

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
