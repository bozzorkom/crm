'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, CircleAlert, UserRound, UsersRound } from 'lucide-react'
import type { ActivationProof } from '@/lib/activation'
import { formatNeedBudget } from '@/lib/format'

export function ActivationProofView({ proof, onBack }: { proof: ActivationProof; onBack: () => void }) {
  const [showInvitePreview, setShowInvitePreview] = useState(false)
  const plural = new Intl.PluralRules('ru').select(proof.selectedCount)
  const listingNoun = plural === 'one' ? 'объявление' : plural === 'few' ? 'объявления' : 'объявлений'
  const needDetails: [string, string][] = [
    ['Сделка', proof.need.deal === 'rent' ? 'Аренда' : 'Покупка'],
    ...(proof.need.rooms ? [['Комнаты', `${proof.need.rooms}-комнатная`] as [string, string]] : []),
    ...(proof.need.districts.length ? [['Район', proof.need.districts.join(' · ')] as [string, string]] : []),
    ...(proof.need.budgetMax ? [['Бюджет', formatNeedBudget(proof.need.budgetMax, proof.need.budgetCurrency, proof.need.deal)] as [string, string]] : []),
    ...(proof.need.mortgage ? [['Условия', 'Ипотека'] as [string, string]] : []),
    ...(proof.need.moveIn ? [['Срок', proof.need.moveIn] as [string, string]] : []),
  ]

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-7 md:px-8 md:py-10" aria-live="polite">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"><Check className="size-3.5" aria-hidden="true" />Первый результат · {proof.requestLabel}</div>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">Подборка подготовлена</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Для запроса {proof.leadName} в подборку добавлено {proof.selectedCount} {listingNoun}. Ответственный и источник данных указаны ниже.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Клиент и ответственный">
        <div className="rounded-2xl border p-4">
          <span className="text-xs text-muted-foreground">Клиент · {proof.requestLabel}</span>
          <p className="mt-1 font-medium">{proof.leadName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Источник обращения: {proof.leadSource}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <span className="text-xs text-muted-foreground">Ответственный агент</span>
          <p className="mt-1 inline-flex items-center gap-2 font-medium"><UserRound className="size-4 text-muted-foreground" aria-hidden="true" />{proof.owner}</p>
        </div>
      </section>

      <section className="rounded-3xl border p-5" aria-labelledby="activation-need-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="activation-need-title" className="text-base font-semibold">Потребность из обращения</h2>
          <span className="text-xs text-muted-foreground">Условия исходного сообщения</span>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {needDetails.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-secondary/40 px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="activation-listings-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="activation-listings-title" className="text-base font-semibold">Выбранные объявления</h2>
          <span className="text-xs text-muted-foreground">{proof.listingsLabel}</span>
        </div>
        {proof.listings.map((listing) => (
          <article key={listing.id} className="rounded-2xl border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-medium">{listing.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{listing.district} · {listing.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">Источник объявления: {listing.sourceLabel}</p>
              </div>
              <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${listing.notes.length ? 'bg-warning/15 text-[oklch(0.5_0.12_70)]' : 'bg-secondary text-foreground'}`}>
                {listing.notes.length ? <CircleAlert className="size-3.5" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}
                {listing.fit}
              </span>
            </div>
            {listing.matches.length || listing.notes.length ? (
              <div className="mt-3 flex flex-col gap-1.5 border-t pt-3 text-sm leading-5 text-muted-foreground">
                {listing.matches.length ? <p>Совпало: {listing.matches.join(' · ')}</p> : null}
                {listing.notes.length ? <p>Расхождения: {listing.notes.join(' · ')}</p> : null}
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
        Подборка записана в историю прототипа в текущей сессии. Клиенту ничего не отправлено.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`/leads?id=${encodeURIComponent(proof.leadId)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85">
          Открыть карточку клиента<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium hover:bg-accent">
          <ArrowLeft className="size-4" aria-hidden="true" />Вернуться к подбору
        </button>
      </div>

      <section className="rounded-3xl border border-dashed p-5" aria-labelledby="team-next-step-title">
        <div className="flex items-start gap-3">
          <UsersRound className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="flex-1">
            <h2 id="team-next-step-title" className="font-semibold">Следующий шаг — подключить команду</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Посмотрите, как могло бы выглядеть приглашение коллеги после первого результата.</p>
            <button type="button" aria-expanded={showInvitePreview} onClick={() => setShowInvitePreview((shown) => !shown)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium hover:bg-accent">
              {showInvitePreview ? 'Скрыть пример' : 'Посмотреть пример приглашения'}<ArrowRight className="size-4" aria-hidden="true" />
            </button>
            {showInvitePreview ? (
              <div className="mt-4 rounded-2xl bg-secondary/50 p-4" role="status">
                <p className="text-sm leading-6">«Подключайтесь к Uy Group: распределяйте обращения и держите следующий шаг по каждому клиенту в одном месте».</p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">Только текстовый preview: адрес коллеги не запрашивается, приглашение не отправляется.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
