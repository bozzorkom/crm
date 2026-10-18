import {
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  Inbox,
  Sparkles,
  SquareKanban,
  Sun,
  UsersRound,
} from 'lucide-react'

export const navItems = [
  { href: '/', label: 'Сегодня', icon: Sun, mobile: true },
  { href: '/leads', label: 'Лиды', icon: Inbox, badge: 2, mobile: true },
  { href: '/match', label: 'Подбор', icon: Sparkles, mobile: false },
  { href: '/calendar', label: 'Показы', icon: CalendarDays, mobile: true },
  { href: '/objects', label: 'Объекты', icon: Building2, mobile: true },
  { href: '/deals', label: 'Сделки', icon: SquareKanban, mobile: true },
  { href: '/team', label: 'Команда', icon: UsersRound, mobile: false },
  { href: '/analytics', label: 'Аналитика', icon: ChartNoAxesColumn, mobile: false },
] as const

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
