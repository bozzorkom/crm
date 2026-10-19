'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Minus, Plus, Send, TriangleAlert } from 'lucide-react'
import { PropertyCard } from '@/components/kalit/property-card'
import { ActivationProofView } from '@/components/activation/activation-proof-view'
import { buildActivationProof, prepareActivationSelection } from '@/lib/activation'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import { cn } from '@/lib/utils'
import { districts, type Need } from '@/lib/data'
import { formatNeedBudget } from '@/lib/format'
import { filterSelectedMatchIds, matchListings, type ListingMatchResult } from '@/lib/objects/matching'

export function MatchView({ initialNeed, leadId, activation = false }: { initialNeed: Need; leadId?: string; activation?: boolean }) {
  const [need, setNeed] = useState<Need>(initialNeed)
  const [selected, setSelected] = useState<string[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState(leadId ?? '')
  const [preparedMatches, setPreparedMatches] = useState<ListingMatchResult[] | null>(null)
  const prepared = preparedMatches !== null
  const { listingViews, appendListingEvents } = useObjectWorkspace()
  const { leads, updateLead } = useLeadWorkspace()
  const { exact, near } = matchListings(need, listingViews)
  const visibleSelected = filterSelectedMatchIds(selected, { exact, near })
  const targetLead = leads.find((lead) => lead.id === selectedLeadId)

  function resetCriteria() {
    setPreparedMatches(null)
    setSelected([])
  }

  function toggleDistrict(district: string) {
    resetCriteria()
    setNeed((current) => ({
      ...current,
      districts: current.districts.includes(district) ? current.districts.filter((item) => item !== district) : [...current.districts, district],
    }))
  }

  function toggleSelected(id: string) {
    setPreparedMatches(null)
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function prepareSelection() {
    if (!targetLead) return
    const result = prepareActivationSelection(targetLead, listingViews.map((view) => view.listing), selected, { exact, near })
    if (!result) return
    updateLead(result.lead)
    appendListingEvents(result.listingEvents)
    setPreparedMatches(result.selectedMatches)
  }

  const budgetStep = need.budgetCurrency === 'UZS'
    ? need.deal === 'rent' ? 500_000 : 5_000_000
    : need.deal === 'rent' ? 50 : 5000
  const selectedCount = visibleSelected.length

  if (activation && preparedMatches && targetLead) {
    const proof = buildActivationProof(targetLead, preparedMatches)
    if (proof) return <ActivationProofView proof={proof} onBack={() => setPreparedMatches(null)} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-3xl border p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={need.deal} onChange={(deal) => { resetCriteria(); setNeed((current) => ({ ...current, deal, budgetMax: deal === 'rent' ? 600 : 85000, budgetCurrency: 'USD' })) }} options={[{ value: 'sale', label: 'Покупка' }, { value: 'rent', label: 'Аренда' }]} />
          <Stepper label="Комнаты" value={need.rooms ? String(need.rooms) : 'Любые'} onDec={() => { resetCriteria(); setNeed((current) => ({ ...current, rooms: current.rooms && current.rooms > 1 ? current.rooms - 1 : undefined })) }} onInc={() => { resetCriteria(); setNeed((current) => ({ ...current, rooms: Math.min((current.rooms ?? 0) + 1, 5) })) }} />
          <Stepper label="До" value={need.budgetMax ? formatNeedBudget(need.budgetMax, need.budgetCurrency, need.deal) : 'Любой'} onDec={() => { resetCriteria(); setNeed((current) => ({ ...current, budgetMax: Math.max((current.budgetMax ?? budgetStep * 2) - budgetStep, budgetStep) })) }} onInc={() => { resetCriteria(); setNeed((current) => ({ ...current, budgetMax: (current.budgetMax ?? 0) + budgetStep })) }} />
          <button type="button" aria-pressed={need.mortgage} onClick={() => { resetCriteria(); setNeed((current) => ({ ...current, mortgage: !current.mortgage })) }} className={cn('inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors', need.mortgage ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
            {need.mortgage ? <Check className="size-3.5" aria-hidden="true" /> : null}Ипотека
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none" role="group" aria-label="Районы">
          {districts.map((district) => {
            const active = need.districts.includes(district)
            return <button key={district} type="button" aria-pressed={active} onClick={() => toggleDistrict(district)} className={cn('h-8 shrink-0 rounded-full px-3 text-[13px] transition-colors', active ? 'bg-secondary font-medium text-foreground ring-1 ring-foreground/80' : 'bg-secondary/60 text-muted-foreground hover:text-foreground')}>{district}</button>
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-secondary/20 p-4">
        {leadId && targetLead ? (
          <p className="text-sm">Подбор для <span className="font-medium">{targetLead.name}</span></p>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:max-w-md">
            Для какого клиента подготовить подборку?
            <select value={selectedLeadId} onChange={(event) => { setSelectedLeadId(event.target.value); resetCriteria() }} className="h-10 rounded-xl border bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
              <option value="">Выберите demo-лида…</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.owner}</option>)}
            </select>
          </label>
        )}
        <p className="mt-2 text-xs leading-5 text-muted-foreground">В подбор попадают только активные объявления с актуальной проверкой и разрешением на показ. Здесь ничего не отправляется клиенту.</p>
      </div>

      <ResultGroup title="Точно подходят" description="Совпадают все обязательные параметры" results={exact} selected={visibleSelected} onToggle={toggleSelected} empty="Точных совпадений нет — проверьте, что в каталоге есть свежие активные предложения с разрешением на показ." />
      <ResultGroup title="Почти подходят" description="Расхождения показаны отдельно" results={near} selected={visibleSelected} onToggle={toggleSelected} empty="Нет близких вариантов." />

      {visibleSelected.length > 0 ? (
        <div className="sticky bottom-24 z-20 mx-auto flex w-full max-w-xl flex-wrap items-center gap-3 rounded-3xl border bg-background/90 p-2 pl-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl md:bottom-6">
          <span className="min-w-24 flex-1 text-sm">{prepared ? 'Подборка подготовлена' : `Выбрано: ${selectedCount}`}</span>
          {prepared ? <span role="status" className="text-xs text-muted-foreground">Записано в историю. Не отправлено клиенту.</span> : null}
          <button type="button" onClick={prepareSelection} disabled={prepared || !targetLead || selectedCount === 0} title={!targetLead ? 'Выберите клиента' : undefined} className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {prepared ? <Check className="size-4" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}{prepared ? 'Готово' : 'Подготовить подборку'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ResultGroup({ title, description, results, selected, onToggle, empty }: { title: string; description: string; results: ListingMatchResult[]; selected: string[]; onToggle: (id: string) => void; empty: string }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2"><h2 className="text-base font-semibold">{title}</h2><span className="text-sm tabular-nums text-muted-foreground">{results.length}</span><p className="ml-auto hidden text-sm text-muted-foreground sm:block">{description}</p></div>
      {results.length === 0 ? <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result, index) => {
            const id = result.view.listing.id
            const isSelected = selected.includes(id)
            return <PropertyCard key={id} property={result.view.property} listing={result.view.listing} priority={index === 0} top={<span className="rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium tabular-nums backdrop-blur">{result.score}% совпадение</span>} footer={<div className="flex flex-col gap-3"><ul className="flex flex-wrap gap-1.5">{result.matches.map((match) => <li key={match} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px]"><Check className="size-3" aria-hidden="true" />{match}</li>)}{[...result.mismatches, ...result.warnings].map((message) => <li key={message} className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-[oklch(0.5_0.12_70)]"><TriangleAlert className="size-3" aria-hidden="true" />{message}</li>)}</ul><Link href={`/objects/${id}`} className="text-xs text-muted-foreground underline underline-offset-2">Открыть объявление</Link><button type="button" aria-pressed={isSelected} onClick={() => onToggle(id)} className={cn('inline-flex h-9 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors', isSelected ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent')}>{isSelected ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}{isSelected ? 'В подборке' : 'Добавить в подборку'}</button></div>} />
          })}
        </div>
      )}
    </section>
  )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[] }) {
  return <div role="radiogroup" className="flex h-9 rounded-full bg-secondary p-1">{options.map((option) => <button key={option.value} type="button" role="radio" aria-checked={value === option.value} onClick={() => onChange(option.value)} className={cn('rounded-full px-3.5 text-sm font-medium transition-all', value === option.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{option.label}</button>)}</div>
}

function Stepper({ label, value, onDec, onInc }: { label: string; value: string; onDec: () => void; onInc: () => void }) {
  return <div className="flex h-9 items-center rounded-full border"><button type="button" onClick={onDec} aria-label={`Уменьшить: ${label}`} className="flex size-9 items-center justify-center rounded-full hover:bg-accent"><Minus className="size-3.5" /></button><span className="min-w-20 px-1 text-center text-sm tabular-nums"><span className="text-muted-foreground">{label} </span><span className="font-medium">{value}</span></span><button type="button" onClick={onInc} aria-label={`Увеличить: ${label}`} className="flex size-9 items-center justify-center rounded-full hover:bg-accent"><Plus className="size-3.5" /></button></div>
}
