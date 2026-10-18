'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, Archive, CalendarDays, Check, Clock3, Pencil, Plus, RefreshCw, Shield } from 'lucide-react'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'
import { VerificationForm } from '@/components/objects/verification-form'
import { FreshnessBadge } from '@/components/kalit/badges'
import { Button } from '@/components/ui/button'
import { currentUser, calendarShowings } from '@/lib/data'
import { formatListingPrice } from '@/lib/format'
import type { ListingStatus, PropertyKind } from '@/lib/objects/types'
import type { ClientReaction } from '@/lib/objects/types'
import { recordClientReaction } from '@/lib/objects/activity'
import type { VerificationInput } from '@/lib/objects/workspace-state'
import { getShowingsForListing } from '@/lib/objects/related'

const kindLabels: Record<PropertyKind, string> = {
  apartment: 'Квартира',
  house: 'Дом',
  commercial: 'Коммерческая недвижимость',
  land: 'Земельный участок',
}

const statusLabels: Record<ListingStatus, string> = {
  draft: 'Черновик',
  review: 'На проверке',
  active: 'Активно',
  needs_review: 'Нужна проверка',
  temporarily_unavailable: 'Временно недоступно',
  reserved: 'Забронировано',
  closed: 'Продано / сдано',
  withdrawn: 'Снято',
  archived: 'В архиве',
}

function formatDate(value?: string) {
  if (!value) return 'Ещё не проверяли'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Дата не указана'
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function ListingDetail({ listingId, verifyOnLoad = false, initialLeadId = '' }: { listingId: string; verifyOnLoad?: boolean; initialLeadId?: string }) {
  const router = useRouter()
  const { getListingView, recordVerification, archiveListing, activateListing, appendListingEvents } = useObjectWorkspace()
  const { leads, updateLead } = useLeadWorkspace()
  const [checking, setChecking] = useState(verifyOnLoad)
  const [message, setMessage] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId)
  const [reaction, setReaction] = useState<ClientReaction>('interested')
  const [reactionReason, setReactionReason] = useState('')
  const view = getListingView(listingId)

  if (!view) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary"><Clock3 className="size-5" aria-hidden="true" /></div>
        <h1 className="text-2xl font-semibold tracking-tight">Демо-запись недоступна</h1>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">Объекты хранятся только в состоянии открытой вкладки. Возможно, эта запись была создана в предыдущей сессии и сбросилась после перезагрузки.</p>
        <Link href="/objects" className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">Вернуться в каталог</Link>
      </div>
    )
  }

  const { property, listing } = view
  const linkedShowings = getShowingsForListing(calendarShowings, listing.id)
  const activity = [...listing.events].sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
  const daysSinceVerification = listing.verifiedAt
    ? Math.max(0, Math.floor((Date.now() - Date.parse(listing.verifiedAt)) / 86_400_000))
    : 999
  const canArchive = listing.status !== 'archived'

  function submitVerification(input: VerificationInput) {
    const saved = recordVerification(listing.id, input)
    if (!saved) {
      setMessage('Проверка не сохранена. Для закрытого или архивного предложения создайте новое объявление.')
      return
    }
    setChecking(false)
    setMessage('Проверка записана в историю. Изменения демо-каталога видны только в этой сессии.')
  }

  function activate() {
    const result = activateListing(listing.id)
    setMessage(result.activated ? 'Объявление активно. Перед подбором отдельно зафиксируйте актуальность.' : `Нужно заполнить: ${result.missing.join(', ')}.`)
  }

  function archive() {
    if (!window.confirm('Переместить объявление в архив? История сохранится.')) return
    if (archiveListing(listing.id)) router.push('/objects')
  }

  function saveReaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const lead = leads.find((item) => item.id === selectedLeadId)
    if (!lead) {
      setMessage('Сначала выберите demo-лида.')
      return
    }
    const result = recordClientReaction(lead, listing, reaction, reactionReason)
    updateLead(result.lead)
    appendListingEvents([{ listingId: listing.id, event: result.listingEvent }])
    setReactionReason('')
    setMessage('Реакция записана в историю лида и объявления. Внешнее сообщение не отправлялось.')
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/objects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Каталог объектов
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/objects/${listing.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium hover:bg-secondary">
            <Pencil className="size-3.5" aria-hidden="true" /> Изменить
          </Link>
          <Link href={`/objects/new?propertyId=${encodeURIComponent(property.id)}`} className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium hover:bg-secondary">
            <Plus className="size-4" aria-hidden="true" /> Новое объявление
          </Link>
          <Button type="button" variant="secondary" className="h-9 rounded-full" onClick={() => setChecking((open) => !open)}>
            <RefreshCw className="size-3.5" aria-hidden="true" /> Проверить
          </Button>
          {listing.status === 'draft' || listing.status === 'review' ? (
            <Button type="button" className="h-9 rounded-full" onClick={activate}>Активировать</Button>
          ) : null}
          {canArchive ? (
            <Button type="button" variant="ghost" className="h-9 rounded-full" onClick={archive}>
              <Archive className="size-3.5" aria-hidden="true" /> Архивировать
            </Button>
          ) : null}
        </div>
      </div>

      {message ? <p role="status" className="rounded-xl border bg-secondary/50 px-4 py-3 text-sm">{message}</p> : null}
      {checking ? <VerificationForm listing={listing} onCancel={() => setChecking(false)} onConfirm={submitVerification} /> : null}

      <section className="grid overflow-hidden rounded-3xl border lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-64 bg-muted sm:min-h-80">
          <Image src={property.image ?? '/placeholder.jpg'} alt={`${property.title}, ${property.district}`} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-between gap-8 p-5 sm:p-7">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{kindLabels[property.kind]}</span>
              <FreshnessBadge status={listing.status} days={daysSinceVerification} />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{property.title || kindLabels[property.kind]}</h1>
              <p className="text-sm text-muted-foreground">{property.city} · {property.district}{property.landmark ? ` · ${property.landmark}` : ''}</p>
            </div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatListingPrice(listing.price, listing.currency, listing.priceUnit)}</p>
            <p className="text-sm text-muted-foreground">{listing.deal === 'sale' ? 'Продажа' : 'Аренда'} · {statusLabels[listing.status]}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-secondary/50 p-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Последняя проверка</p><p className="mt-1 font-medium">{formatDate(listing.verifiedAt)}</p></div>
            <div><p className="text-xs text-muted-foreground">Кто проверил</p><p className="mt-1 font-medium">{listing.verifiedBy ?? 'Нет подтверждения'}</p></div>
            <div><p className="text-xs text-muted-foreground">Способ</p><p className="mt-1 font-medium">{listing.verificationMethod ?? 'Не указан'}</p></div>
            <div><p className="text-xs text-muted-foreground">Ответственный</p><p className="mt-1 font-medium">{listing.agent || 'Не назначен'}</p></div>
          </div>
        </div>
      </section>

      <p className="rounded-xl border bg-secondary/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
        Демо: изменения действуют в этой вкладке и сбрасываются после перезагрузки. Отметка разрешения на показ — ручной UX-флаг, не проверка права собственности или юридической чистоты.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-3xl border p-5" aria-labelledby="property-facts-title">
          <h2 id="property-facts-title" className="text-base font-semibold">Физический объект</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <Fact label="Тип" value={kindLabels[property.kind]} />
            <Fact label="Район" value={property.district || 'Не указан'} />
            <Fact label="Комнат" value={property.rooms ? String(property.rooms) : 'Не указано'} />
            <Fact label="Площадь" value={property.area ? `${property.area} м²` : 'Не указана'} />
            <Fact label="Этаж" value={property.floor && property.floorsTotal ? `${property.floor} из ${property.floorsTotal}` : 'Не указан'} />
            <Fact label="Состояние" value={property.renovation ?? property.condition ?? 'Не указано'} />
            <Fact label="Точный адрес" value={property.exactAddress ? '•••••••• · скрыт в демо' : 'Не указан в демо'} />
            <Fact label="Ориентир" value={property.landmark || 'Не указан'} />
          </dl>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border p-5" aria-labelledby="offer-terms-title">
          <h2 id="offer-terms-title" className="text-base font-semibold">Условия предложения</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <Fact label="Сделка" value={listing.deal === 'sale' ? 'Продажа' : 'Аренда'} />
            <Fact label="Цена" value={formatListingPrice(listing.price, listing.currency, listing.priceUnit)} />
            <Fact label="Ипотека" value={listing.mortgage ? 'Возможна' : 'Не указана'} />
            <Fact label="Источник" value={listing.source.label || 'Не указан'} />
            <Fact label="Основание" value={listing.source.note || 'Не указано'} />
            <Fact label="Видимость" value={visibilityLabel(listing.visibility)} />
          </dl>
          <div className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            {listing.clientShareAllowed ? <Check className="mt-0.5 size-4 text-success" aria-hidden="true" /> : <Shield className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />}
            <div><p className="font-medium">{listing.clientShareAllowed ? 'Разрешено показывать клиенту' : 'Не разрешено показывать клиенту'}</p><p className="mt-0.5 text-xs text-muted-foreground">Это ручная отметка агента для прототипа, не юридическое подтверждение.</p></div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex flex-col gap-4 rounded-3xl border p-5" aria-labelledby="history-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="history-title" className="text-base font-semibold">История объявления</h2>
            <span className="text-xs text-muted-foreground">{listing.events.length} событий</span>
          </div>
          {activity.length ? (
            <ol className="flex flex-col">
              {activity.map((event, index) => (
                <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < activity.length - 1 ? <span className="absolute top-7 bottom-0 left-[11px] w-px bg-border" aria-hidden="true" /> : null}
                  <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary"><Clock3 className="size-3" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{event.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.at)} · {event.author}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-muted-foreground">История появится после сохранения изменений.</p>}
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-medium">История цены</h3>
            {listing.priceHistory.length ? (
              <ul className="flex flex-col gap-2">
                {[...listing.priceHistory].reverse().map((price) => (
                  <li key={price.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium tabular-nums">{formatListingPrice(price.amount, price.currency, price.priceUnit)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(price.at)} · {price.author}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-muted-foreground">Изменений цены пока нет.</p>}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border p-5" aria-labelledby="related-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="related-title" className="text-base font-semibold">Связанные показы</h2>
            <Link href="/calendar" className="text-xs font-medium text-muted-foreground hover:text-foreground">Календарь</Link>
          </div>
          {linkedShowings.length ? (
            <ul className="flex flex-col gap-2">
              {linkedShowings.map((showing) => (
                <li key={showing.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-3">
                  <div><p className="text-sm font-medium">{showing.client}</p><p className="mt-0.5 text-xs text-muted-foreground">{showing.start} · {showing.confirmed ? 'Подтверждён' : 'Ожидает подтверждения'}</p></div>
                  <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">В демо-календаре пока нет показов этого объекта.</p>}
          <form onSubmit={saveReaction} className="flex flex-col gap-3 rounded-2xl border bg-secondary/20 p-4">
            <div><h3 className="text-sm font-medium">Записать реакцию клиента</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Событие появится в обеих демо-историях. Реальных сообщений здесь нет.</p></div>
            <label className="flex flex-col gap-1.5 text-xs font-medium">Demo-лид
              <select value={selectedLeadId} onChange={(event) => setSelectedLeadId(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm font-normal">
                <option value="">Выберите лида…</option>
                {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium">Результат
              <select value={reaction} onChange={(event) => setReaction(event.target.value as ClientReaction)} className="h-10 rounded-xl border bg-background px-3 text-sm font-normal">
                <option value="interested">Заинтересован</option><option value="not_interested">Не подходит</option><option value="question">Есть вопрос</option><option value="showing">Хочет на показ</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium">Комментарий <span className="font-normal text-muted-foreground">необязательно</span>
              <textarea value={reactionReason} onChange={(event) => setReactionReason(event.target.value)} rows={2} maxLength={240} className="resize-y rounded-xl border bg-background px-3 py-2 text-sm font-normal" placeholder="Например, хочет уточнить этажность" />
            </label>
            <Button type="submit" variant="secondary" className="h-9 rounded-full" disabled={!selectedLeadId}>Сохранить реакцию</Button>
          </form>
          <p className="text-xs text-muted-foreground">Действия фиксируются от имени {currentUser.name}.</p>
        </section>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>
}

function visibilityLabel(visibility: 'team' | 'assigned' | 'partner') {
  if (visibility === 'assigned') return 'Назначенные сотрудники'
  if (visibility === 'partner') return 'Партнёр'
  return 'Команда'
}
