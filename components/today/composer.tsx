'use client'

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUp, Check, CircleAlert, Paperclip, RotateCcw, Sparkles, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { leadSources, type LeadSource } from '@/lib/data'
import { extractNeed, needToSearchParams, type Extraction } from '@/lib/match'
import { matchListings } from '@/lib/objects/matching'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import { useLeadWorkspace } from '@/components/leads/lead-workspace'

const suggestions = [
  'Семья, 3 комнаты, Чиланзар или Юнусабад, до $85 000, ипотека',
  'Аренда двушки в Мирзо-Улугбеке до $600 в месяц',
  'Однушка в Мирабаде до 55k, новостройка',
]

type Turn = { text: string; extraction: Extraction }

export function Composer() {
  const [value, setValue] = useState('')
  const [turn, setTurn] = useState<Turn | null>(null)
  const [leadCreated, setLeadCreated] = useState(false)
  const { addLead } = useLeadWorkspace()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function createLead(contact: { name: string; phone?: string; source: LeadSource }) {
    if (!turn) return
    const lead = addLead({ ...contact, request: turn.text, need: turn.extraction.need })
    setLeadCreated(true)
    router.push(`/leads?id=${encodeURIComponent(lead.id)}`)
  }

  function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setTurn({ text: trimmed, extraction: extractNeed(trimmed) })
    setLeadCreated(false)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = ''
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    submit(value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    submit(value)
  }

  function autoresize(element: HTMLTextAreaElement) {
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {turn ? (
        <ExtractionResult
          turn={turn}
          leadCreated={leadCreated}
          onCreateLead={createLead}
          onReset={() => {
            setTurn(null)
            textareaRef.current?.focus()
          }}
        />
      ) : null}

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border bg-background p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] transition-shadow focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_32px_-12px_rgba(0,0,0,0.2)]"
      >
        <label htmlFor="composer" className="sr-only">
          Опишите запрос клиента
        </label>
        <textarea
          id="composer"
          ref={textareaRef}
          rows={2}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            autoresize(event.target)
          }}
          onKeyDown={onKeyDown}
          placeholder="Вставьте сообщение клиента или опишите запрос…"
          className="block w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Прикрепить скриншот переписки"
            >
              <Paperclip className="size-4" />
            </button>
            <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
              <Sparkles className="size-3" aria-hidden="true" />
              Черновик из сообщения
            </span>
          </div>
          <button
            type="submit"
            disabled={!value.trim()}
            aria-label="Разобрать запрос"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-20"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {!turn ? (
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Примеры запросов">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => submit(suggestion)}
                className="rounded-full border bg-background px-3.5 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ExtractionResult({
  turn,
  leadCreated,
  onCreateLead,
  onReset,
}: {
  turn: Turn
  leadCreated: boolean
  onCreateLead: (contact: { name: string; phone?: string; source: LeadSource }) => void
  onReset: () => void
}) {
  const { extraction } = turn
  const { listingViews } = useObjectWorkspace()
  const { exact, near } = matchListings(extraction.need, listingViews)
  const query = needToSearchParams(extraction.need)
  const [showContactForm, setShowContactForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<LeadSource | ''>('')
  const [formError, setFormError] = useState('')

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = name.trim()
    if (!normalizedName) {
      setFormError('Укажите имя клиента.')
      return
    }
    if (!source) {
      setFormError('Выберите источник обращения.')
      return
    }
    onCreateLead({ name: normalizedName, phone: phone.trim() || undefined, source })
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="ml-auto max-w-[85%] rounded-3xl bg-secondary px-4 py-2.5 text-[15px] leading-relaxed">
        {turn.text}
      </div>

      <div className="flex gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-[15px] leading-relaxed">
            Сверьте предложенные поля с исходным сообщением. Пунктиром отмечены значения с низкой уверенностью.
          </p>

          <div className="rounded-2xl border bg-background">
            <dl className="flex flex-wrap gap-x-6 gap-y-3 border-b p-4">
              {extraction.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  <dd
                    className={cn(
                      'w-fit text-sm font-medium',
                      field.confidence === 'low' && 'underline decoration-muted-foreground decoration-dashed underline-offset-4',
                    )}
                  >
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              {extraction.missing.length ? (
                <p className="flex items-center gap-1.5 text-[oklch(0.5_0.12_70)]">
                  <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                  Уточните: {extraction.missing.join(', ').toLowerCase()}
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  Достаточно данных для подбора
                </p>
              )}
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{exact.length}</span> точных ·{' '}
                <span className="font-medium text-foreground">{near.length}</span> почти подходят
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/match?${query}`}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Подобрать объекты
            </Link>
            {!showContactForm ? (
              <button
                type="button"
                onClick={() => setShowContactForm(true)}
                disabled={leadCreated}
                className="inline-flex h-9 items-center gap-2 rounded-full border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent disabled:text-muted-foreground disabled:hover:bg-background"
              >
                {leadCreated ? <Check className="size-4" aria-hidden="true" /> : <UserPlus className="size-4" aria-hidden="true" />}
                {leadCreated ? 'Лид создан и назначен вам' : 'Создать лид'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Заново
            </button>
          </div>

          {showContactForm ? (
            <form onSubmit={submitContact} className="rounded-2xl border bg-secondary/40 p-4">
              <div className="mb-4 flex flex-col gap-1">
                <h3 className="text-sm font-semibold">Контакт и источник</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Потребность сохранится в карточке как черновик вместе с исходным сообщением.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label htmlFor="lead-name" className="flex flex-col gap-1.5 text-xs font-medium">
                  Имя клиента
                  <input
                    id="lead-name"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setFormError('')
                    }}
                    placeholder="Например, Шахзод Турсунов"
                    className="h-10 rounded-xl border bg-background px-3 text-sm font-normal outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
                <label htmlFor="lead-phone" className="flex flex-col gap-1.5 text-xs font-medium">
                  <span>
                    Телефон <span className="font-normal text-muted-foreground">если есть</span>
                  </span>
                  <input
                    id="lead-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="h-10 rounded-xl border bg-background px-3 text-sm font-normal outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
                <label htmlFor="lead-source" className="flex flex-col gap-1.5 text-xs font-medium sm:col-span-2">
                  Источник обращения
                  <select
                    id="lead-source"
                    name="source"
                    required
                    value={source}
                    onChange={(event) => {
                      setSource(event.target.value as LeadSource | '')
                      setFormError('')
                    }}
                    className="h-10 rounded-xl border bg-background px-3 text-sm font-normal outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="" disabled>
                      Выберите источник
                    </option>
                    {leadSources.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {formError ? (
                <p id="lead-form-error" role="alert" className="mt-3 text-sm text-destructive">
                  {formError}
                </p>
              ) : null}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Демо-режим: запись будет доступна только до перезагрузки страницы.
              </p>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false)
                    setFormError('')
                  }}
                  className="h-10 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  Добавить и открыть
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
