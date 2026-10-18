'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/shell/page-header'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import type { ListingView } from '@/lib/objects/types'
import {
  calendarShowings,
  showingOutcomes,
  week,
  type CalendarShowing,
  type ShowingOutcome,
} from '@/lib/data'
import { formatListingPrice } from '@/lib/format'

const NOW_MINUTES = 14 * 60 + 25

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function endTime(s: CalendarShowing) {
  const end = toMinutes(s.start) + s.duration
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
}

function isPast(s: CalendarShowing) {
  if (s.day < week.todayIndex) return true
  if (s.day > week.todayIndex) return false
  return toMinutes(s.start) + s.duration <= NOW_MINUTES
}

function findConflicts(items: CalendarShowing[]) {
  const ids = new Set<string>()
  for (const a of items) {
    for (const b of items) {
      if (a.id >= b.id || a.day !== b.day || a.agent !== b.agent) continue
      const aStart = toMinutes(a.start)
      const bStart = toMinutes(b.start)
      if (aStart < bStart + b.duration && bStart < aStart + a.duration) {
        ids.add(a.id)
        ids.add(b.id)
      }
    }
  }
  return ids
}

export function CalendarView() {
  const { getListingView } = useObjectWorkspace()
  const [showings, setShowings] = useState(calendarShowings)
  const [day, setDay] = useState(week.todayIndex)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const conflicts = useMemo(() => findConflicts(showings), [showings])
  const needsResult = showings.filter((s) => isPast(s) && !s.result)
  const dayItems = showings
    .filter((s) => s.day === day)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const selected = showings.find((s) => s.id === selectedId) ?? null

  function saveResult(id: string, outcome: ShowingOutcome, note: string) {
    setShowings((prev) => prev.map((s) => (s.id === id ? { ...s, result: { outcome, note: note || undefined } } : s)))
    setSelectedId(null)
  }

  function confirm(id: string) {
    setShowings((prev) => prev.map((s) => (s.id === id ? { ...s, confirmed: true } : s)))
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        title="Показы"
        description={`${showings.length} показов на неделе · ${needsResult.length} ждут результата`}
        actions={
          <Button className="rounded-full">
            <Plus aria-hidden="true" />
            Назначить показ
          </Button>
        }
      />

      {needsResult.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            setDay(needsResult[0].day)
            setSelectedId(needsResult[0].id)
          }}
          className="flex items-center gap-3 rounded-2xl border bg-secondary/60 p-3 text-left transition-colors hover:bg-secondary"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Clock className="size-4" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium">
              {needsResult.length === 1 ? '1 показ без результата' : `${needsResult.length} показа без результата`}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Отметьте итог за 10 секунд — это обновит статистику объекта и follow-up клиенту
            </span>
          </span>
          <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{week.label}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Предыдущая неделя">
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setDay(week.todayIndex)}
            >
              Сегодня
            </Button>
            <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Следующая неделя">
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div role="tablist" aria-label="Дни недели" className="grid grid-cols-7 gap-1 rounded-2xl bg-secondary/60 p-1">
          {week.days.map((d, index) => {
            const count = showings.filter((s) => s.day === index).length
            const active = index === day
            const today = index === week.todayIndex
            return (
              <button
                key={d.date}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setDay(index)
                  setSelectedId(null)
                }}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl py-2 transition-colors',
                  active ? 'bg-background shadow-xs' : 'hover:bg-background/60',
                )}
              >
                <span className={cn('text-[11px]', active ? 'text-foreground' : 'text-muted-foreground')}>{d.short}</span>
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-sm font-medium tabular-nums',
                    today && 'bg-primary text-primary-foreground',
                  )}
                >
                  {d.date}
                </span>
                <span className="flex h-1.5 items-center gap-0.5" aria-label={`${count} показов`}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className="size-1 rounded-full bg-foreground/40" />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Расписание дня" className="flex flex-col">
          {dayItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-14 text-center">
              <p className="text-sm font-medium">Показов нет</p>
              <p className="text-xs text-muted-foreground">Свободный день — хорошее время обновить базу объектов</p>
            </div>
          ) : (
            <ol className="flex flex-col">
              {dayItems.map((s, index) => (
                <ShowingRow
                  key={s.id}
                  showing={s}
                  listingView={getListingView(s.listingId)}
                  last={index === dayItems.length - 1}
                  conflict={conflicts.has(s.id)}
                  selected={s.id === selectedId}
                  onSelect={() => setSelectedId(s.id)}
                  onConfirm={() => confirm(s.id)}
                />
              ))}
            </ol>
          )}
        </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          {selected ? (
            <ResultPanel
              key={selected.id}
              showing={selected}
              listingView={getListingView(selected.listingId)}
              onClose={() => setSelectedId(null)}
              onSave={saveResult}
            />
          ) : (
            <WeekSummary showings={showings} />
          )}
        </aside>
      </div>
    </div>
  )
}

function ShowingRow({
  showing,
  listingView,
  last,
  conflict,
  selected,
  onSelect,
  onConfirm,
}: {
  showing: CalendarShowing
  listingView: ListingView | null
  last: boolean
  conflict: boolean
  selected: boolean
  onSelect: () => void
  onConfirm: () => void
}) {
  const property = listingView?.property
  if (!property) return null
  const past = isPast(showing)
  const outcome = showing.result ? showingOutcomes.find((o) => o.id === showing.result?.outcome) : null

  return (
    <li className="flex gap-4">
      <div className="flex w-12 shrink-0 flex-col items-end pt-3">
        <span className={cn('text-sm font-medium tabular-nums', past && 'text-muted-foreground')}>{showing.start}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">{endTime(showing)}</span>
      </div>
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            'mt-4 size-2.5 shrink-0 rounded-full ring-4 ring-background',
            past ? 'bg-muted-foreground/40' : 'bg-primary',
          )}
          aria-hidden="true"
        />
        {!last ? <span className="w-px flex-1 bg-border" aria-hidden="true" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-3">
        <div
          className={cn(
            'flex flex-col gap-3 rounded-2xl border bg-background p-3 transition-shadow',
            selected ? 'border-foreground shadow-sm' : 'hover:shadow-sm',
          )}
        >
          <button type="button" onClick={onSelect} className="flex items-center gap-3 text-left">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image src={property.image ?? '/placeholder.jpg'} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{showing.client}</span>
              <span className="truncate text-xs text-muted-foreground">{property.title}</span>
              <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                {property.district}, {property.landmark}
              </span>
            </div>
            <span className="hidden text-sm tabular-nums sm:block">
              {formatListingPrice(listingView.listing.price, listingView.listing.currency, listingView.listing.priceUnit)}
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">{showing.agent}</span>
            <span className="text-muted-foreground/40" aria-hidden="true">
              ·
            </span>
            {outcome ? (
              <span
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium',
                  outcome.positive ? 'bg-success/12 text-[oklch(0.45_0.12_152)]' : 'bg-secondary text-secondary-foreground',
                )}
              >
                {outcome.positive ? <Check className="size-3" aria-hidden="true" /> : null}
                {outcome.label}
              </span>
            ) : past ? (
              <span className="inline-flex h-5 items-center rounded-full bg-primary px-2 text-[11px] font-medium text-primary-foreground">
                Нужен результат
              </span>
            ) : showing.confirmed ? (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-secondary px-2 text-[11px] font-medium">
                <Check className="size-3" aria-hidden="true" />
                Подтверждён
              </span>
            ) : (
              <span className="inline-flex h-5 items-center rounded-full bg-warning/15 px-2 text-[11px] font-medium text-[oklch(0.5_0.12_70)]">
                Ждёт подтверждения
              </span>
            )}
            {conflict ? (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-destructive/10 px-2 text-[11px] font-medium text-destructive">
                <AlertTriangle className="size-3" aria-hidden="true" />
                Пересечение по времени
              </span>
            ) : null}

            <div className="ml-auto flex items-center gap-1">
              {!past && !showing.confirmed ? (
                <Button size="sm" variant="secondary" className="h-7 rounded-full px-3 text-xs" onClick={onConfirm}>
                  Подтвердить
                </Button>
              ) : null}
              {past && !showing.result ? (
                <Button size="sm" className="h-7 rounded-full px-3 text-xs" onClick={onSelect}>
                  Отметить итог
                </Button>
              ) : null}
              <a
                href={`tel:${showing.phone.replace(/\s/g, '')}`}
                aria-label={`Позвонить: ${showing.client}`}
                className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'size-7 rounded-full' })}
              >
                <Phone className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

function ResultPanel({
  showing,
  listingView,
  onClose,
  onSave,
}: {
  showing: CalendarShowing
  listingView: ListingView | null
  onClose: () => void
  onSave: (id: string, outcome: ShowingOutcome, note: string) => void
}) {
  const property = listingView?.property
  const [outcome, setOutcome] = useState<ShowingOutcome | null>(showing.result?.outcome ?? null)
  const [note, setNote] = useState(showing.result?.note ?? '')
  const past = isPast(showing)
  const nextStep =
    outcome === 'interested'
      ? 'Сделка перейдёт в «Переговоры», клиенту уйдёт follow-up завтра в 10:00'
      : outcome === 'reschedule'
        ? 'Предложим клиенту 3 свободных слота'
        : outcome
          ? 'Причина попадёт в статистику объекта, подберём 3 альтернативы'
          : null

  return (
    <section aria-labelledby="result-title" className="flex flex-col gap-4 rounded-2xl border bg-background p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="result-title" className="text-base font-semibold">
            {past ? 'Как прошёл показ?' : 'Детали показа'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {showing.client} · {week.days[showing.day].short}, {showing.start}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onClose} aria-label="Закрыть">
          <X aria-hidden="true" />
        </Button>
      </header>

      {property ? (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={property.image ?? '/placeholder.jpg'} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{property.title}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {property.area ? `${property.area} м²` : 'Площадь не указана'}
              {property.floor && property.floorsTotal ? ` · ${property.floor}/${property.floorsTotal} эт.` : ''} ·{' '}
              {listingView
                ? formatListingPrice(listingView.listing.price, listingView.listing.currency, listingView.listing.priceUnit)
                : ''}
            </span>
          </div>
        </div>
      ) : null}

      {past ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Итог</legend>
            <div className="flex flex-wrap gap-1.5">
              {showingOutcomes.map((o) => {
                const active = outcome === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setOutcome(o.id)}
                    className={cn(
                      'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-secondary',
                    )}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Заметка</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Что сказал клиент, что важно для следующего шага…"
              className="resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
            />
          </label>

          {nextStep ? (
            <p className="rounded-xl bg-secondary px-3 py-2 text-xs text-pretty">
              <span className="font-medium">Следующий шаг: </span>
              {nextStep}
            </p>
          ) : null}

          <Button
            className="rounded-full"
            disabled={!outcome}
            onClick={() => outcome && onSave(showing.id, outcome, note)}
          >
            Сохранить итог
          </Button>
        </>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Время</dt>
            <dd className="tabular-nums">
              {showing.start} – {endTime(showing)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Агент</dt>
            <dd>{showing.agent}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Телефон</dt>
            <dd className="tabular-nums">{showing.phone}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Напоминание</dt>
            <dd>За 2 ч в Telegram</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

function WeekSummary({ showings }: { showings: CalendarShowing[] }) {
  const done = showings.filter(isPast)
  const withResult = done.filter((s) => s.result)
  const interested = withResult.filter((s) => s.result?.outcome === 'interested')
  const rate = done.length ? Math.round((withResult.length / done.length) * 100) : 0
  const reasons = showingOutcomes
    .filter((o) => !o.positive)
    .map((o) => ({ ...o, count: withResult.filter((s) => s.result?.outcome === o.id).length }))
    .filter((o) => o.count > 0)

  return (
    <section aria-labelledby="week-summary" className="flex flex-col gap-4 rounded-2xl border bg-background p-4">
      <h2 id="week-summary" className="text-sm font-semibold">
        Итоги недели
      </h2>
      <dl className="grid grid-cols-3 gap-2">
        {[
          { label: 'Проведено', value: done.length },
          { label: 'С результатом', value: `${rate}%` },
          { label: 'Интерес', value: interested.length },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 rounded-xl bg-secondary/60 p-3">
            <dt className="text-[11px] text-muted-foreground">{stat.label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Причины отказов</h3>
        {reasons.length ? (
          <ul className="flex flex-col gap-1.5">
            {reasons.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.label.replace('Отказ: ', '')}</span>
                <span className="tabular-nums text-muted-foreground">{r.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Пока без отказов</p>
        )}
      </div>
      <p className="border-t pt-3 text-xs text-muted-foreground text-pretty">
        Выберите показ в расписании, чтобы увидеть детали или отметить итог.
      </p>
    </section>
  )
}
