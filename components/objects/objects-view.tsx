'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowDownUp, Plus, Search, SlidersHorizontal, Upload, X } from 'lucide-react'
import { PageHeader } from '@/components/shell/page-header'
import { PropertyCard } from '@/components/kalit/property-card'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import { cn } from '@/lib/utils'
import { districts, team } from '@/lib/data'
import { filterListingViews, isListingNeedsReview, type ListingFilters } from '@/lib/objects/filters'
import type { Currency, ListingStatus, PropertyKind } from '@/lib/objects/types'

const initialFilters: ListingFilters = {
  query: '',
  kind: 'all',
  deal: 'all',
  status: 'all',
  rooms: 'all',
  district: 'all',
  agent: 'all',
  currency: 'all',
  freshness: 'all',
  sort: 'updated_desc',
}

const quickStatuses: { id: ListingFilters['status']; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'needs_review', label: 'Нужна проверка' },
  { id: 'drafts', label: 'Черновики' },
  { id: 'unavailable', label: 'Недоступны / закрыты' },
  { id: 'archived', label: 'Архив' },
]

const kindLabels: Record<PropertyKind, string> = {
  apartment: 'Квартира',
  house: 'Дом',
  commercial: 'Коммерческая',
  land: 'Участок',
}

export function ObjectsView() {
  const { listingViews } = useObjectWorkspace()
  const [filters, setFilters] = useState<ListingFilters>(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [rangeCurrency, setRangeCurrency] = useState<Currency>('USD')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const visible = filterListingViews(listingViews, filters)
  const countFor = (status: ListingFilters['status']) => filterListingViews(listingViews, { ...initialFilters, status }).length
  const activeCount = countFor('active')
  const needsCheckCount = countFor('needs_review')
  const draftCount = countFor('drafts')
  const unavailableCount = countFor('unavailable')
  const archivedCount = countFor('archived')
  const totalActiveFilters = [
    filters.kind !== 'all',
    filters.rooms !== 'all',
    filters.district !== 'all',
    filters.agent !== 'all',
    filters.currency !== 'all',
    filters.freshness !== 'all',
    filters.status !== 'all',
    filters.deal !== 'all',
    Boolean(filters.priceRange),
  ].filter(Boolean).length

  function clearFilters() {
    setFilters(initialFilters)
    setMinPrice('')
    setMaxPrice('')
    setRangeCurrency('USD')
  }

  function changeRange(min: string, max: string, currency = rangeCurrency) {
    setMinPrice(min)
    setMaxPrice(max)
    const parsedMin = min.trim() ? Number(min) : undefined
    const parsedMax = max.trim() ? Number(max) : undefined
    setFilters((current) => ({
      ...current,
      priceRange:
        parsedMin !== undefined || parsedMax !== undefined
          ? { currency, min: Number.isFinite(parsedMin) ? parsedMin : undefined, max: Number.isFinite(parsedMax) ? parsedMax : undefined }
          : undefined,
    }))
  }

  const statusCounts: Record<string, number> = {
    all: listingViews.length,
    active: activeCount,
    needs_review: needsCheckCount,
    drafts: draftCount,
    unavailable: unavailableCount,
    archived: archivedCount,
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        title="Объекты"
        description={`${listingViews.length} объявлений · ${activeCount} активных · ${needsCheckCount} требуют проверки`}
        actions={
          <>
            <Link href="/objects/import" className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-secondary">
              <Upload className="size-4" aria-hidden="true" /> Импорт
            </Link>
            <Link href="/objects/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85">
              <Plus className="size-4" aria-hidden="true" /> Добавить объект
            </Link>
          </>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border bg-secondary/30 px-4 py-3">
        <span className="mt-1 size-2 shrink-0 rounded-full bg-foreground" aria-hidden="true" />
        <p className="text-xs leading-5 text-muted-foreground">Демо: изменения и импорт доступны только в этой вкладке и сбрасываются после перезагрузки. Используйте синтетические данные.</p>
      </div>

      <div className="border-b">
        <div role="tablist" aria-label="Состояние объявлений" className="flex gap-5 overflow-x-auto scrollbar-none">
          {quickStatuses.map((status) => {
            const selected = filters.status === status.id
            return (
              <button
                key={status.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilters((current) => ({ ...current, status: status.id }))}
                className={cn('relative flex shrink-0 items-center gap-2 py-3 text-sm transition-colors', selected ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {status.label}
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums">{statusCounts[status.id]}</span>
                {selected ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" /> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Поиск по объектам и объявлениям</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Название, район, ID или агент…"
              className="h-11 w-full rounded-full border bg-background pr-4 pl-10 text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Тип сделки" className="flex h-10 rounded-full bg-secondary p-1">
              {([['all', 'Все сделки'], ['sale', 'Продажа'], ['rent', 'Аренда']] as const).map(([deal, label]) => (
                <button key={deal} type="button" aria-pressed={filters.deal === deal} onClick={() => setFilters((current) => ({ ...current, deal }))} className={cn('rounded-full px-3 text-xs font-medium transition-colors', filters.deal === deal ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)} className={cn('inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors', filtersOpen || totalActiveFilters ? 'border-foreground/30 bg-secondary' : 'hover:bg-secondary')}>
              <SlidersHorizontal className="size-4" aria-hidden="true" /> Фильтры
              {totalActiveFilters ? <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{totalActiveFilters}</span> : null}
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <section className="grid gap-3 rounded-2xl border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Фильтры каталога">
            <FilterField label="Тип недвижимости">
              <select value={filters.kind} onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value as ListingFilters['kind'] }))} className={selectClass}>
                <option value="all">Все типы</option>{Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </FilterField>
            <FilterField label="Комнат">
              <select value={filters.rooms} onChange={(event) => setFilters((current) => ({ ...current, rooms: event.target.value === 'all' ? 'all' : Number(event.target.value) }))} className={selectClass}>
                <option value="all">Любое число</option>{[1, 2, 3, 4, 5].map((rooms) => <option key={rooms} value={rooms}>{rooms}+ комнат</option>)}
              </select>
            </FilterField>
            <FilterField label="Район">
              <select value={filters.district} onChange={(event) => setFilters((current) => ({ ...current, district: event.target.value }))} className={selectClass}>
                <option value="all">Все районы</option>{districts.map((district) => <option key={district}>{district}</option>)}
              </select>
            </FilterField>
            <FilterField label="Ответственный">
              <select value={filters.agent} onChange={(event) => setFilters((current) => ({ ...current, agent: event.target.value }))} className={selectClass}>
                <option value="all">Вся команда</option>{team.map((agent) => <option key={agent}>{agent}</option>)}
              </select>
            </FilterField>
            <FilterField label="Валюта объявлений">
              <select value={filters.currency} onChange={(event) => setFilters((current) => ({ ...current, currency: event.target.value as ListingFilters['currency'] }))} className={selectClass}>
                <option value="all">Любая валюта</option><option value="USD">USD</option><option value="UZS">UZS</option>
              </select>
            </FilterField>
            <FilterField label="Цена от / до">
              <div className="flex gap-2">
                <input type="number" min="0" value={minPrice} onChange={(event) => changeRange(event.target.value, maxPrice)} placeholder="От" aria-label="Цена от" className={selectClass} />
                <input type="number" min="0" value={maxPrice} onChange={(event) => changeRange(minPrice, event.target.value)} placeholder="До" aria-label="Цена до" className={selectClass} />
              </div>
            </FilterField>
            <FilterField label="Валюта диапазона">
              <select value={rangeCurrency} onChange={(event) => { const currency = event.target.value as Currency; setRangeCurrency(currency); if (minPrice || maxPrice) changeRange(minPrice, maxPrice, currency) }} className={selectClass}>
                <option value="USD">USD</option><option value="UZS">UZS</option>
              </select>
            </FilterField>
            <FilterField label="Актуальность">
              <select value={filters.freshness} onChange={(event) => setFilters((current) => ({ ...current, freshness: event.target.value as ListingFilters['freshness'] }))} className={selectClass}>
                <option value="all">Любая</option><option value="fresh">Недавно проверено</option><option value="needs_review">Нужна проверка</option>
              </select>
            </FilterField>
            <FilterField label="Сортировка">
              <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as ListingFilters['sort'] }))} className={selectClass}>
                <option value="updated_desc">Сначала недавно обновлённые</option><option value="verified_desc">Сначала недавно проверенные</option><option value="price_asc">Цена по возрастанию</option><option value="price_desc">Цена по убыванию</option>
              </select>
            </FilterField>
            <div className="flex items-end justify-between gap-3 lg:col-span-4">
              <p className="text-xs text-muted-foreground">{filters.priceRange ? `Диапазон сравнивается только в ${filters.priceRange.currency}.` : 'Для диапазона цены выберите валюту и укажите одну из границ.'}</p>
              <button type="button" onClick={clearFilters} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="size-3.5" aria-hidden="true" /> Сбросить</button>
            </div>
          </section>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">Показано <span className="font-medium text-foreground">{visible.length}</span> из {listingViews.length}</p>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ArrowDownUp className="size-3.5" aria-hidden="true" />{sortLabel(filters.sort)}</span>
      </div>

      {visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((view, index) => {
            const needsCheck = isListingNeedsReview(view)
            return (
              <PropertyCard
                key={view.listing.id}
                property={view.property}
                listing={view.listing}
                priority={index === 0}
                top={<span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur">{kindLabels[view.property.kind]} · {view.listing.deal === 'sale' ? 'Продажа' : 'Аренда'}</span>}
                footer={
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{view.listing.agent}</span><span className="shrink-0 font-mono text-[10px]">ID {view.listing.id.replace(/^listing-/, '').slice(0, 8)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/objects/${view.listing.id}`} className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground">Открыть объявление</Link>
                      {needsCheck ? <Link href={`/objects/${view.listing.id}?verify=1`} className="inline-flex h-9 items-center justify-center rounded-full border px-3 text-xs font-medium hover:bg-secondary" aria-label="Проверить актуальность">Проверить</Link> : null}
                    </div>
                  </div>
                }
              />
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed px-5 py-16 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary"><Search className="size-5 text-muted-foreground" aria-hidden="true" /></div>
          <h2 className="text-base font-semibold">Подходящих объявлений нет</h2>
          <p className="max-w-md text-sm text-muted-foreground">Измените запрос или сбросьте фильтры — каталог обновится по выбранным условиям.</p>
          <button type="button" onClick={clearFilters} className="h-9 rounded-full border px-4 text-sm font-medium hover:bg-secondary">Сбросить фильтры</button>
        </div>
      )}
    </div>
  )
}

const selectClass = 'h-10 min-w-0 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">{label}{children}</label>
}

function sortLabel(sort: ListingFilters['sort']) {
  if (sort === 'price_asc') return 'Цена ↑ · по валютным группам'
  if (sort === 'price_desc') return 'Цена ↓ · по валютным группам'
  if (sort === 'verified_desc') return 'Свежесть проверки'
  return 'Недавние изменения'
}
