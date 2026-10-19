'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, MessageSquareText, UserRound } from 'lucide-react'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'
import { leads as sampleLeads } from '@/lib/data'
import { buildActivationMatchHref } from '@/lib/activation'
import { formatNeedBudget } from '@/lib/format'

export function ActivationStart() {
  const { leads } = useLeadWorkspace()
  const lead = leads.find((item) => item.id === 'l1') ?? sampleLeads.find((item) => item.id === 'l1')

  if (!lead) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />Сегодня</Link>
        <section className="rounded-3xl border p-6">
          <h1 className="text-xl font-semibold">Пример сейчас недоступен</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Вернитесь на главную и начните со своего сообщения — исходный текст можно проверить до создания карточки.</p>
          <Link href="/#composer" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">Вставить своё сообщение<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </section>
      </main>
    )
  }

  const need = lead.need
  const details: [string, string][] = [
    ['Сделка', need.deal === 'rent' ? 'Аренда' : 'Покупка'],
    ...(need.rooms ? [['Комнаты', `${need.rooms}-комнатная`] as [string, string]] : []),
    ...(need.districts.length ? [['Район', need.districts.join(' · ')] as [string, string]] : []),
    ...(need.budgetMax ? [['Бюджет', formatNeedBudget(need.budgetMax, need.budgetCurrency, need.deal)] as [string, string]] : []),
    ...(need.mortgage ? [['Условия', 'Ипотека'] as [string, string]] : []),
    ...(need.moveIn ? [['Срок', need.moveIn] as [string, string]] : []),
  ]

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-7 md:px-8 md:py-10">
      <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />Сегодня</Link>

      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"><MessageSquareText className="size-3.5" aria-hidden="true" />Короткий пример · демо-данные</span>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">От сообщения клиента — к подходящему объекту</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Проверьте, как запрос превращается в понятный подбор. Импортировать базу и отправлять что-либо клиенту не нужно.</p>
      </header>

      <section className="overflow-hidden rounded-3xl border" aria-labelledby="sample-request-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-secondary/30 px-5 py-4">
          <div>
            <h2 id="sample-request-title" className="font-semibold">Исходное обращение</h2>
            <p className="mt-1 text-sm text-muted-foreground">{lead.source} · {lead.name}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs"><UserRound className="size-3.5" aria-hidden="true" />Ответственный: {lead.owner}</span>
        </div>
        <blockquote className="px-5 py-5 text-[15px] leading-7">«{lead.request}»</blockquote>
        <div className="border-t px-5 py-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">Что важно клиенту</h3>
            <span className="text-xs text-muted-foreground">Условия из сообщения, без догадок</span>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="flex min-w-0 items-start gap-2.5 rounded-2xl bg-secondary/40 px-3.5 py-3">
                <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words text-sm font-medium">{value}</dd></div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={buildActivationMatchHref(lead)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85">
          Посмотреть подходящие объекты<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link href="/#composer" className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
          Вместо примера — вставить своё сообщение
        </Link>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Это синтетический пример для знакомства с прототипом. Действия сохраняются только в открытой вкладке.</p>
    </main>
  )
}
