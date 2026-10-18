'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  CalendarPlus,
  CircleAlert,
  MessageCircle,
  Phone,
  PhoneCall,
  Sparkles,
  StickyNote,
  Eye,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lead, TimelineEvent } from '@/lib/data'
import { formatNeedBudget } from '@/lib/format'
import { needToSearchParams } from '@/lib/match'
import { Avatar, LeadStatusBadge, SlaBadge } from '@/components/kalit/badges'

const timelineIcons: Record<TimelineEvent['kind'], typeof Phone> = {
  message: MessageCircle,
  call: PhoneCall,
  note: StickyNote,
  system: Bot,
  showing: Eye,
}

const stepPresets = [
  { text: 'Позвонить и уточнить бюджет', due: 'Сегодня, 18:00' },
  { text: 'Отправить подборку объектов', due: 'Завтра, 10:00' },
  { text: 'Назначить показ', due: 'Завтра, 15:00' },
]

export function LeadDetail({
  lead,
  onChange,
  onBack,
}: {
  lead: Lead
  onChange: (lead: Lead) => void
  onBack: () => void
}) {
  const [note, setNote] = useState('')
  const { need } = lead
  const matchHref = `/match?${needToSearchParams(need)}&leadId=${encodeURIComponent(lead.id)}`

  function addNote(event?: FormEvent) {
    event?.preventDefault()
    const text = note.trim()
    if (!text) return
    onChange({
      ...lead,
      timeline: [...lead.timeline, { id: crypto.randomUUID(), kind: 'note', text, at: 'Сейчас', author: 'Вы' }],
    })
    setNote('')
  }

  function onNoteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    addNote()
  }

  function setNextStep(step: { text: string; due: string }) {
    onChange({
      ...lead,
      status: lead.status === 'new' ? 'contacted' : lead.status,
      nextStep: step,
      timeline: [
        ...lead.timeline,
        { id: crypto.randomUUID(), kind: 'system', text: `Следующий шаг: ${step.text} · ${step.due}`, at: 'Сейчас' },
      ],
    })
  }

  const needRows = [
    { label: 'Сделка', value: need.deal === 'rent' ? 'Аренда' : 'Покупка' },
    { label: 'Комнаты', value: need.rooms ? String(need.rooms) : '—' },
    { label: 'Районы', value: need.districts.join(', ') || '—' },
    { label: 'Бюджет до', value: need.budgetMax ? formatNeedBudget(need.budgetMax, need.budgetCurrency, need.deal) : '—' },
    { label: 'Оплата', value: need.mortgage ? 'Ипотека' : 'Не указано' },
    { label: 'Ответственный', value: lead.owner },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3 md:px-8 md:py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад к списку"
          className="-ml-1 flex size-9 items-center justify-center rounded-full hover:bg-accent md:hidden"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Avatar name={lead.name} className="size-10" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{lead.name}</h2>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{lead.phone ? `${lead.phone} · ${lead.source}` : lead.source}</p>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone.replace(/\s/g, '')}`}
              className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium hover:bg-accent"
            >
              <Phone className="size-4" aria-hidden="true" />
              Позвонить
            </a>
          ) : null}
          <Link
            href={matchHref}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-85"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Подобрать
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 md:px-8">
          {lead.sessionOnly ? (
            <p role="status" className="rounded-xl border bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Демо-режим: запись и изменения доступны только в текущем сеансе и сбросятся после перезагрузки страницы.
            </p>
          ) : null}
          <div className={cn('grid gap-2 lg:hidden', lead.phone ? 'grid-cols-4' : 'grid-cols-3')}>
            {lead.phone ? (
              <a
                href={`tel:${lead.phone.replace(/\s/g, '')}`}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary py-3 text-xs font-medium"
              >
                <Phone className="size-5" aria-hidden="true" />
                Звонок
              </a>
            ) : null}
            <button
              type="button"
              disabled
              title="Канал сообщений не подключён"
              aria-label="Написать — канал сообщений не подключён"
              className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-2xl bg-secondary py-3 text-xs font-medium opacity-50"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Написать
            </button>
            <button
              type="button"
              disabled
              title="Создание показа пока не подключено"
              aria-label="Показ — создание пока не подключено"
              className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-2xl bg-secondary py-3 text-xs font-medium opacity-50"
            >
              <CalendarPlus className="size-5" aria-hidden="true" />
              Показ
            </button>
            <Link
              href={matchHref}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary py-3 text-xs font-medium"
            >
              <Sparkles className="size-5" aria-hidden="true" />
              Подбор
            </Link>
          </div>

          <SlaBadge lead={lead} />

          <blockquote className="rounded-2xl bg-secondary px-4 py-3 text-[15px] leading-relaxed">
            {lead.request}
          </blockquote>

          <section aria-labelledby="need-title" className="flex flex-col gap-2">
            <h3 id="need-title" className="flex items-center gap-1.5 text-sm font-semibold">
              Потребность
              <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Sparkles className="size-2.5" aria-hidden="true" />
                из сообщения
              </span>
            </h3>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
              {needRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5 bg-background p-3">
                  <dt className="text-xs text-muted-foreground">{row.label}</dt>
                  <dd className="truncate text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="step-title" className="flex flex-col gap-2">
            <h3 id="step-title" className="text-sm font-semibold">
              Следующий шаг
            </h3>
            {lead.nextStep ? (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3',
                  lead.nextStep.overdue && 'border-destructive/30 bg-destructive/5',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full',
                    lead.nextStep.overdue ? 'bg-destructive/10 text-destructive' : 'bg-secondary',
                  )}
                >
                  <CalendarClock className="size-4" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{lead.nextStep.text}</span>
                  <span className={cn('text-xs', lead.nextStep.overdue ? 'text-destructive' : 'text-muted-foreground')}>
                    {lead.nextStep.overdue ? 'Просрочено · ' : ''}
                    {lead.nextStep.due}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed p-3">
                <p className="flex items-center gap-1.5 text-sm text-[oklch(0.5_0.12_70)]">
                  <CircleAlert className="size-4" aria-hidden="true" />
                  Без следующего шага лид легко потерять
                </p>
                <div className="flex flex-wrap gap-2">
                  {stepPresets.map((step) => (
                    <button
                      key={step.text}
                      type="button"
                      onClick={() => setNextStep(step)}
                      className="rounded-full border bg-background px-3 py-1.5 text-[13px] transition-colors hover:bg-accent"
                    >
                      {step.text}
                      <span className="ml-1.5 text-muted-foreground">{step.due}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="history-title" className="flex flex-col gap-3">
            <h3 id="history-title" className="text-sm font-semibold">
              История
            </h3>
            <ol className="flex flex-col">
              {lead.timeline.map((event, index) => {
                const Icon = timelineIcons[event.kind]
                return (
                  <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < lead.timeline.length - 1 ? (
                      <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border" aria-hidden="true" />
                    ) : null}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
                      <p className="text-sm leading-relaxed">{event.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.author ? `${event.author} · ` : ''}
                        {event.at}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>
      </div>

      <form onSubmit={addNote} className="border-t bg-background p-3 md:px-8">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-3xl border p-1.5 pl-4">
          <label htmlFor="note" className="sr-only">
            Заметка
          </label>
          <textarea
            id="note"
            rows={1}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={onNoteKeyDown}
            placeholder="Заметка или итог звонка…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!note.trim()}
            aria-label="Добавить заметку"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  )
}
