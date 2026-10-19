import type { Metadata } from 'next'
import { Handshake, Repeat, ShieldCheck, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shell/page-header'
import { Avatar } from '@/components/kalit/badges'
import { CommissionList } from '@/components/team/commission-list'
import { splitCommission as split } from '@/lib/commission'
import { commissions, currentUser, partners, teamMembers } from '@/lib/data'
import { formatUsd } from '@/lib/format'
import { AgencyAccessPreview } from '@/components/shell/agency-access-preview'

export const metadata: Metadata = { title: 'Команда и комиссии — Kalit' }

export default function TeamPage() {
  const expected = commissions.filter((c) => c.status === 'expected' || c.status === 'pending')
  const confirmed = commissions.filter((c) => c.status === 'approved' || c.status === 'paid')
  const agencyIncome = confirmed.reduce((sum, c) => sum + split(c).agency, 0)

  const stats = [
    { label: 'Ожидаемая комиссия', value: formatUsd(expected.reduce((s, c) => s + c.total, 0)), hint: `${expected.length} сделки в работе` },
    { label: 'Подтверждено в октябре', value: formatUsd(confirmed.reduce((s, c) => s + c.total, 0)), hint: `доход агентства ${formatUsd(agencyIncome)}` },
    { label: 'Ждут подтверждения', value: String(commissions.filter((c) => c.status === 'pending').length), hint: 'нужно ваше решение' },
  ]

  return (
    <AgencyAccessPreview title="Команда и комиссии" description="Работа команды, распределение лидов и ожидаемые комиссии.">
    <div className="flex w-full flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        title="Команда и комиссии"
        description={`${currentUser.agency} · ${teamMembers.length} сотрудников · октябрь 2026`}
        actions={
          <Button variant="secondary" className="rounded-full">
            <UserPlus aria-hidden="true" />
            Пригласить
          </Button>
        }
      />

      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-2xl border bg-background p-4">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
            <dd className="text-xs text-muted-foreground">{s.hint}</dd>
          </div>
        ))}
      </dl>

      <CommissionList />

      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="team" className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="team" className="text-base font-semibold">
              Команда
            </h2>
            <span className="text-xs text-muted-foreground">Результат, а не активность</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-background">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Сотрудник</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Лиды</th>
                  <th scope="col" className="px-3 py-3 font-medium">Ответ в SLA</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Итоги показов</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Сделки</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Комиссия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamMembers.map((m) => (
                  <tr key={m.name}>
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <div className="flex items-center gap-3">
                        <span className="relative">
                          <Avatar name={m.name} className="size-8" />
                          <span
                            className={cn(
                              'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-background',
                              m.onDuty ? 'bg-success' : 'bg-muted-foreground/40',
                            )}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.role}
                            {m.onDuty ? '' : ' · не на смене'}
                          </span>
                        </span>
                      </div>
                    </th>
                    <td className="px-3 py-3 text-right tabular-nums">{m.activeLeads || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                          <span
                            className={cn('block h-full rounded-full', m.slaRate < 75 ? 'bg-destructive' : 'bg-primary')}
                            style={{ width: `${m.slaRate}%` }}
                          />
                        </span>
                        <span className={cn('text-xs tabular-nums', m.slaRate < 75 && 'font-medium text-destructive')}>
                          {m.slaRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {m.role === 'Оператор' ? '—' : `${m.showingResultRate}%`}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{m.deals || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {m.commission ? formatUsd(m.commission) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="routing" className="flex flex-col gap-3 rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-2">
              <Repeat className="size-4" aria-hidden="true" />
              <h2 id="routing" className="text-sm font-semibold">
                Распределение лидов
              </h2>
            </div>
            <p className="text-sm">По очереди между агентами на смене</p>
            <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <li>Первый ответ — 15 минут, затем эскалация руководителю</li>
              <li>Повторный контакт уходит прежнему ответственному</li>
              <li>При уходе сотрудника лиды передаются с историей</li>
            </ul>
            <Button variant="secondary" size="sm" className="self-start rounded-full">
              Настроить правила
            </Button>
          </section>

          <section aria-labelledby="partners" className="flex flex-col gap-3 rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-2">
              <Handshake className="size-4" aria-hidden="true" />
              <h2 id="partners" className="text-sm font-semibold">
                Партнёры
              </h2>
            </div>
            <ul className="flex flex-col divide-y">
              {partners.map((p) => (
                <li key={p.name} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {p.split} · {p.deals} сделк{p.deals === 1 ? 'а' : 'и'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.access}</span>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-pretty">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Партнёры видят только согласованные карточки. Контакты собственника и клиента не передаются без согласия.
            </p>
          </section>
        </div>
      </div>
    </div>
    </AgencyAccessPreview>
  )
}
