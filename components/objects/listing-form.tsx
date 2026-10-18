'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, Building2, Plus, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/shell/page-header'
import { useObjectWorkspace, type NewListingInput, type NewPropertyInput } from '@/components/objects/object-workspace'
import { currentUser, districts, team } from '@/lib/data'
import { findListingDuplicates, validateListingDraft } from '@/lib/objects/domain'
import type { Listing, ListingDuplicate, Property, PropertyKind } from '@/lib/objects/types'

type FormValues = {
  kind: PropertyKind
  title: string
  city: string
  district: string
  landmark: string
  rooms: string
  area: string
  floor: string
  floorsTotal: string
  renovation: string
  image: string
  deal: Listing['deal']
  price: string
  currency: Listing['currency']
  mortgage: boolean
  agent: string
  sourceType: NewListingInput['source']['type']
  sourceLabel: string
  sourceNote: string
  visibility: Listing['visibility']
  clientShareAllowed: boolean
}

function toFormValues(property?: Property, listing?: Listing): FormValues {
  return {
    kind: property?.kind ?? 'apartment',
    title: property?.title ?? '',
    city: property?.city ?? 'Ташкент',
    district: property?.district ?? '',
    landmark: property?.landmark ?? '',
    rooms: property?.rooms === undefined ? '' : String(property.rooms),
    area: property?.area === undefined ? '' : String(property.area),
    floor: property?.floor === undefined ? '' : String(property.floor),
    floorsTotal: property?.floorsTotal === undefined ? '' : String(property.floorsTotal),
    renovation: property?.renovation ?? '',
    image: property?.image ?? '',
    deal: listing?.deal ?? 'sale',
    price: listing ? String(listing.price) : '',
    currency: listing?.currency ?? 'USD',
    mortgage: listing?.mortgage ?? false,
    agent: listing?.agent ?? 'Дилноза К.',
    sourceType: listing?.source.type ?? 'owner',
    sourceLabel: listing?.source.label ?? '',
    sourceNote: listing?.source.note ?? '',
    visibility: listing?.visibility ?? 'team',
    clientShareAllowed: listing?.clientShareAllowed ?? false,
  }
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function ListingForm({ listingId, existingPropertyId }: { listingId?: string; existingPropertyId?: string }) {
  const router = useRouter()
  const {
    properties,
    listingViews,
    getListingView,
    addPropertyWithListing,
    addListingForProperty,
    updateProperty,
    updateListing,
  } = useObjectWorkspace()
  const editingView = listingId ? getListingView(listingId) : null
  const existingProperty = existingPropertyId ? properties.find((property) => property.id === existingPropertyId) : undefined
  const unavailableExistingProperty = Boolean(existingPropertyId && !existingProperty)
  const [values, setValues] = useState(() => toFormValues(editingView?.property ?? existingProperty, editingView?.listing))
  const [duplicateCandidates, setDuplicateCandidates] = useState<ListingDuplicate[] | null>(null)
  const [error, setError] = useState('')
  const lockedProperty = Boolean(existingPropertyId && existingProperty)
  const editing = Boolean(listingId)

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function propertyInput(): NewPropertyInput {
    return {
      kind: values.kind,
      title: values.title.trim(),
      city: values.city.trim() || 'Ташкент',
      district: values.district.trim(),
      landmark: values.landmark.trim() || undefined,
      rooms: optionalNumber(values.rooms),
      area: optionalNumber(values.area),
      floor: optionalNumber(values.floor),
      floorsTotal: optionalNumber(values.floorsTotal),
      renovation: values.renovation || undefined,
      condition: values.renovation || undefined,
      image: values.image || undefined,
      features: [],
    }
  }

  function listingInput(): NewListingInput {
    return {
      deal: values.deal,
      price: optionalNumber(values.price) ?? 0,
      currency: values.currency,
      priceUnit: values.deal === 'rent' ? 'month' : 'total',
      mortgage: values.mortgage,
      agent: values.agent.trim(),
      source: {
        type: values.sourceType,
        label: values.sourceLabel.trim(),
        note: values.sourceNote.trim() || undefined,
      },
      visibility: values.visibility,
      clientShareAllowed: values.clientShareAllowed,
      status: 'draft',
    }
  }

  function saveNew(options: { reusePropertyId?: string; keepSeparate?: boolean } = {}) {
    const property = propertyInput()
    const listing = listingInput()

    if (options.reusePropertyId) {
      const created = addListingForProperty(options.reusePropertyId, listing)
      if (!created) {
        setError('Не удалось привязать объявление: объект уже недоступен в этой сессии.')
        return
      }
      router.push(`/objects/${created.id}`)
      return
    }

    if (!options.keepSeparate) {
      const candidate = {
        property: { ...property, id: 'candidate-property' } as Property,
        listing: { ...listing, id: 'candidate-listing', propertyId: 'candidate-property', priceHistory: [], events: [] } as Listing,
      }
      const duplicates = findListingDuplicates(candidate, listingViews)
      if (duplicates.length) {
        setDuplicateCandidates(duplicates)
        return
      }
    }

    const created = addPropertyWithListing({ property, listing })
    router.push(`/objects/${created.id}`)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setDuplicateCandidates(null)

    const draftValidation = validateListingDraft(propertyInput(), listingInput())
    if (!draftValidation.allowed) {
      setError(`Чтобы сохранить черновик, заполните: ${draftValidation.missing.join(', ')}.`)
      return
    }

    if (editing && editingView) {
      updateProperty(editingView.property.id, propertyInput())
      updateListing(editingView.listing.id, {
        deal: values.deal,
        price: optionalNumber(values.price) ?? 0,
        currency: values.currency,
        priceUnit: values.deal === 'rent' ? 'month' : 'total',
        mortgage: values.mortgage,
        agent: values.agent.trim(),
        source: { type: values.sourceType, label: values.sourceLabel.trim(), note: values.sourceNote.trim() || undefined },
        visibility: values.visibility,
        clientShareAllowed: values.clientShareAllowed,
      })
      router.push(`/objects/${editingView.listing.id}`)
      return
    }

    if (existingPropertyId && !existingProperty) {
      setError('Исходный объект был создан в другой сессии. Вернитесь в каталог и выберите объект заново.')
      return
    }

    if (existingProperty) {
      const created = addListingForProperty(existingProperty.id, listingInput())
      if (!created) {
        setError('Не удалось создать объявление для выбранного объекта.')
        return
      }
      router.push(`/objects/${created.id}`)
      return
    }

    saveNew()
  }

  if (editing && !editingView) {
    return <ExpiredFormState title="Объявление недоступно" />
  }

  if (unavailableExistingProperty) {
    return <ExpiredFormState title="Объект недоступен в этой сессии" />
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <Link href={editing ? `/objects/${listingId}` : '/objects'} className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {editing ? 'Назад к объявлению' : 'Назад в каталог'}
      </Link>

      <PageHeader
        title={editing ? 'Изменить объявление' : lockedProperty ? 'Новое объявление' : 'Добавить объект'}
        description={editing ? 'Характеристики физического объекта и условия предложения разделены. Изменение цены сохранится в истории.' : lockedProperty ? `Новое предложение для «${existingProperty?.title}» — история предыдущего не изменится.` : 'Создайте короткую карточку сейчас, детали можно дополнить позже. Проверка и активация выполняются отдельно.'}
      />

      <div className="rounded-2xl border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
        Демо: данные существуют только в этой вкладке и сбросятся после перезагрузки страницы. Используйте синтетические сведения.
      </div>

      {duplicateCandidates ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4" aria-labelledby="duplicate-title">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 id="duplicate-title" className="font-semibold">Нашли похожие карточки</h2>
              <p className="text-sm text-muted-foreground">Это подсказка по совпадению, не автоматическое объединение. Выберите действие для каждой похожей записи.</p>
            </div>
          </div>
          {duplicateCandidates.map((duplicate) => {
            const candidate = listingViews.find((view) => view.listing.id === duplicate.listingId)
            if (!candidate) return null
            return (
              <div key={duplicate.listingId} className="flex flex-wrap items-center gap-2 rounded-xl border bg-background p-3">
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-medium">{candidate.property.title}</p>
                  <p className="text-xs text-muted-foreground">{duplicate.kinds.includes('same_listing') ? 'Похоже на то же предложение' : 'Похоже на тот же физический объект'} · {candidate.listing.id}</p>
                </div>
                <Link href={`/objects/${candidate.listing.id}`} className="h-9 rounded-full border px-3 py-2 text-xs font-medium hover:bg-secondary">Открыть</Link>
                {duplicate.kinds.includes('same_property') ? (
                  <button type="button" onClick={() => saveNew({ reusePropertyId: candidate.property.id })} className="h-9 rounded-full border px-3 text-xs font-medium hover:bg-secondary">Создать объявление для этого объекта</button>
                ) : null}
              </div>
            )
          })}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setDuplicateCandidates(null)} className="h-9 rounded-full px-4 text-sm hover:bg-background">Отмена</button>
            <button type="button" onClick={() => saveNew({ keepSeparate: true })} className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">Продолжить как отдельный объект</button>
          </div>
        </section>
      ) : null}

      {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-3xl border p-4 md:p-6" aria-labelledby="property-section-title">
          <div className="flex items-center gap-2">
            <Building2 className="size-4" aria-hidden="true" />
            <h2 id="property-section-title" className="font-semibold">Физический объект</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Тип недвижимости">
              <select disabled={lockedProperty} value={values.kind} onChange={(event) => update('kind', event.target.value as PropertyKind)} className={inputClass}>
                <option value="apartment">Квартира</option><option value="house">Дом</option><option value="commercial">Коммерческая</option><option value="land">Участок</option>
              </select>
            </Field>
            <Field label="Название / ЖК">
              <input disabled={lockedProperty} value={values.title} onChange={(event) => update('title', event.target.value)} placeholder="Например, ЖК Chilonzor City" className={inputClass} />
            </Field>
            <Field label="Город">
              <input disabled={lockedProperty} value={values.city} onChange={(event) => update('city', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Район">
              <select disabled={lockedProperty} value={values.district} onChange={(event) => update('district', event.target.value)} className={inputClass}>
                <option value="">Выберите район</option>{districts.map((district) => <option key={district}>{district}</option>)}
              </select>
            </Field>
            <Field label="Ориентир">
              <input disabled={lockedProperty} value={values.landmark} onChange={(event) => update('landmark', event.target.value)} placeholder="Метро, парк, улица" className={inputClass} />
            </Field>
            <Field label="Фотография из демо-набора">
              <select disabled={lockedProperty} value={values.image} onChange={(event) => update('image', event.target.value)} className={inputClass}>
                <option value="">Без фото</option>{[1, 2, 3, 4, 5, 6].map((number) => <option key={number} value={`/objects/${number}.png`}>Фото {number}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Комнат">
              <input disabled={lockedProperty} type="number" min="0" value={values.rooms} onChange={(event) => update('rooms', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Площадь, м²">
              <input disabled={lockedProperty} type="number" min="0" step="any" value={values.area} onChange={(event) => update('area', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Этаж">
              <input disabled={lockedProperty} type="number" min="0" value={values.floor} onChange={(event) => update('floor', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Этажей в здании">
              <input disabled={lockedProperty} type="number" min="0" value={values.floorsTotal} onChange={(event) => update('floorsTotal', event.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Состояние">
            <select disabled={lockedProperty} value={values.renovation} onChange={(event) => update('renovation', event.target.value)} className={inputClass}>
              <option value="">Не указано</option><option>Евроремонт</option><option>Хороший</option><option>Требует ремонта</option><option>Коробка</option>
            </select>
          </Field>
          {lockedProperty ? <p className="text-xs text-muted-foreground">Характеристики объекта не изменяются при создании нового предложения.</p> : null}
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border p-4 md:p-6" aria-labelledby="listing-section-title">
          <div className="flex items-center gap-2">
            <Plus className="size-4" aria-hidden="true" />
            <h2 id="listing-section-title" className="font-semibold">Условия объявления</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Тип сделки">
              <select value={values.deal} onChange={(event) => update('deal', event.target.value as Listing['deal'])} className={inputClass}>
                <option value="sale">Продажа</option><option value="rent">Аренда</option>
              </select>
            </Field>
            <Field label={values.deal === 'rent' ? 'Цена за месяц' : 'Цена'}>
              <input type="number" min="0" step="any" value={values.price} onChange={(event) => update('price', event.target.value)} placeholder="Можно заполнить позже" className={inputClass} />
            </Field>
            <Field label="Валюта">
              <select value={values.currency} onChange={(event) => update('currency', event.target.value as Listing['currency'])} className={inputClass}>
                <option value="USD">USD · доллар США</option><option value="UZS">UZS · сум</option>
              </select>
            </Field>
            <Field label="Ответственный агент">
              <select value={values.agent} onChange={(event) => update('agent', event.target.value)} className={inputClass}>
                {team.map((agent) => <option key={agent}>{agent}</option>)}
              </select>
            </Field>
            <Field label="Источник предложения">
              <select value={values.sourceType} onChange={(event) => update('sourceType', event.target.value as FormValues['sourceType'])} className={inputClass}>
                <option value="owner">Собственник</option><option value="agent">Агент</option><option value="portal">Портал / площадка</option><option value="referral">Рекомендация</option><option value="demo">Демо-источник</option><option value="import">Импорт</option><option value="other">Другое</option>
              </select>
            </Field>
            <Field label="Источник / ссылка / примечание">
              <input value={values.sourceLabel} onChange={(event) => update('sourceLabel', event.target.value)} placeholder="Например, рекомендация агента" className={inputClass} />
            </Field>
          </div>
          <Field label="Основание хранения и повторного использования">
            <textarea value={values.sourceNote} onChange={(event) => update('sourceNote', event.target.value)} rows={2} placeholder="Коротко укажите, откуда получена информация и что можно показывать" className={`${inputClass} h-auto resize-y py-2`} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Видимость внутри демо">
              <select value={values.visibility} onChange={(event) => update('visibility', event.target.value as Listing['visibility'])} className={inputClass}>
                <option value="team">Команда</option><option value="assigned">Назначенные сотрудники</option><option value="partner">Партнёр</option>
              </select>
            </Field>
            <label className="flex min-h-10 items-center gap-3 self-end rounded-xl border px-3 py-2 text-sm">
              <input type="checkbox" checked={values.clientShareAllowed} onChange={(event) => update('clientShareAllowed', event.target.checked)} className="size-4 accent-foreground" />
              <span>Разрешено показывать клиенту <span className="text-muted-foreground">· ручная отметка, не юридическая проверка</span></span>
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={values.mortgage} onChange={(event) => update('mortgage', event.target.checked)} className="size-4 accent-foreground" />
            Возможна ипотека
          </label>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Название, район и цена — базовые поля. Характеристики и разрешения можно дополнить; активация выполняется отдельно.</p>
          <div className="flex gap-2">
            <Link href={editing ? `/objects/${listingId}` : '/objects'} className="inline-flex h-10 items-center rounded-full px-4 text-sm hover:bg-secondary">Отмена</Link>
            <button type="submit" className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
              {editing ? 'Сохранить изменения' : 'Сохранить черновик'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

const inputClass = 'h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>
}

function ExpiredFormState({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">Демо-объекты не сохраняются после перезагрузки. Вернитесь в каталог и выберите доступную запись.</p>
      <Link href="/objects" className="mx-auto rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Открыть каталог</Link>
    </div>
  )
}
