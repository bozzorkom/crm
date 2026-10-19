import type { Metadata } from 'next'
import { PageHeader } from '@/components/shell/page-header'
import { AgencyAccessPreview } from '@/components/shell/agency-access-preview'

export const metadata: Metadata = { title: 'Аналитика — Kalit' }

const kpis = [
  { label: 'Время первого ответа', value: '9 мин', delta: '−6 мин', good: true },
  { label: 'Лиды со следующим шагом', value: '83%', delta: '+12 п.п.', good: true },
  { label: 'Показ → переговоры', value: '31%', delta: '+4 п.п.', good: true },
  { label: 'Потеряно без причины', value: '3', delta: '+1', good: false },
]

const sources = [
  { name: 'Telegram', leads: 48, deals: 6 },
  { name: 'Instagram', leads: 31, deals: 2 },
  { name: 'OLX', leads: 27, deals: 3 },
  { name: 'Рекомендации', leads: 12, deals: 4 },
  { name: 'Звонки', leads: 9, deals: 1 },
]

const funnel = [
  { stage: 'Лиды', value: 127 },
  { stage: 'Квалифицированы', value: 74 },
  { stage: 'Показы', value: 39 },
  { stage: 'Переговоры', value: 12 },
  { stage: 'Сделки', value: 6 },
]

const agents = [
  { name: 'Тимур Х.', response: '5 мин', showings: 11, commission: 4210 },
  { name: 'Дилноза К.', response: '7 мин', showings: 9, commission: 3060 },
  { name: 'Камила Ю.', response: '12 мин', showings: 8, commission: 2520 },
  { name: 'Азиз Р.', response: '21 мин', showings: 6, commission: 1275 },
]

const usd = new Intl.NumberFormat('ru-RU')

export default function AnalyticsPage() {
  const maxLeads = Math.max(...sources.map((s) => s.leads))

  return (
    <AgencyAccessPreview title="Аналитика" description="Исторические показатели команды за выбранный период.">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <PageHeader title="Аналитика" description="Демо-данные · последние 30 дней · все агенты" />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1.5 bg-background p-5">
            <dt className="text-xs text-muted-foreground">{kpi.label}</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{kpi.value}</dd>
            <dd className={kpi.good ? 'text-xs text-[oklch(0.45_0.12_152)]' : 'text-xs text-destructive'}>
              {kpi.delta} к прошлому месяцу
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="sources-title" className="flex flex-col gap-5 rounded-2xl border p-5">
          <div className="flex items-baseline justify-between">
            <h2 id="sources-title" className="text-sm font-semibold">
              Источники
            </h2>
            <span className="text-xs text-muted-foreground">лиды · сделки</span>
          </div>
          <ul className="flex flex-col gap-4">
            {sources.map((source) => (
              <li key={source.name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span>{source.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {source.leads} · <span className="font-medium text-foreground">{source.deals}</span>
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-foreground/15"
                    style={{ width: `${(source.leads / maxLeads) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: `${(source.deals / maxLeads) * 100 * 3}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="funnel-title" className="flex flex-col gap-5 rounded-2xl border p-5">
          <h2 id="funnel-title" className="text-sm font-semibold">
            Воронка
          </h2>
          <ol className="flex flex-col gap-2">
            {funnel.map((step, index) => {
              const prev = funnel[index - 1]
              return (
                <li key={step.stage} className="flex items-center gap-3">
                  <div className="h-9 flex-1">
                    <div
                      className="flex h-full items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
                      style={{ width: `${Math.max((step.value / funnel[0].value) * 100, 22)}%`, opacity: 1 - index * 0.14 }}
                    >
                      <span className="truncate">{step.stage}</span>
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-medium tabular-nums">{step.value}</span>
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {prev ? `${Math.round((step.value / prev.value) * 100)}%` : ''}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      <section aria-labelledby="agents-title" className="flex flex-col gap-3">
        <h2 id="agents-title" className="text-sm font-semibold">
          Агенты
        </h2>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">Агент</th>
                <th scope="col" className="px-4 py-3 font-medium">Первый ответ</th>
                <th scope="col" className="px-4 py-3 font-medium">Показы</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Комиссия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent) => (
                <tr key={agent.name}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">{agent.name}</th>
                  <td className="px-4 py-3 tabular-nums">{agent.response}</td>
                  <td className="px-4 py-3 tabular-nums">{agent.showings}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${usd.format(agent.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </AgencyAccessPreview>
  )
}
