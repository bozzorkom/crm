'use client'

import { useState } from 'react'
import { currentUser } from '@/lib/data'
import type { Listing } from '@/lib/objects/types'
import type { VerificationInput } from '@/lib/objects/workspace-state'

const resultOptions: { value: VerificationInput['result']; label: string }[] = [
  { value: 'available_same_price', label: 'Доступен, цена прежняя' },
  { value: 'available_price_changed', label: 'Доступен, цена изменилась' },
  { value: 'temporarily_unavailable', label: 'Временно недоступен' },
  { value: 'reserved', label: 'Забронирован' },
  { value: 'closed', label: 'Продан или сдан' },
  { value: 'withdrawn', label: 'Снят с предложения' },
]

const methods: { value: VerificationInput['method']; label: string }[] = [
  { value: 'phone', label: 'Телефонный звонок' },
  { value: 'message', label: 'Сообщение' },
  { value: 'in_person', label: 'Лично' },
  { value: 'agent_report', label: 'Отчёт агента' },
  { value: 'source_update', label: 'Обновление источника' },
]

export function VerificationForm({
  listing,
  onCancel,
  onConfirm,
}: {
  listing: Listing
  onCancel: () => void
  onConfirm: (input: VerificationInput) => void
}) {
  const [result, setResult] = useState<VerificationInput['result']>('available_same_price')
  const [method, setMethod] = useState<VerificationInput['method']>('phone')
  const [price, setPrice] = useState(String(listing.price))
  const [comment, setComment] = useState('')
  const changedPrice = result === 'available_price_changed'
  const parsedPrice = Number(price)
  const priceError = changedPrice && (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice === listing.price)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (priceError) return
    onConfirm({
      result,
      method,
      price: changedPrice ? parsedPrice : undefined,
      comment: comment.trim() || undefined,
    })
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border bg-secondary/30 p-4 md:p-5"
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
      aria-labelledby="verification-title"
    >
      <div className="flex flex-col gap-1">
        <h2 id="verification-title" className="text-base font-semibold">Проверка актуальности</h2>
        <p className="text-sm text-muted-foreground">Изменения появятся в карточке только после подтверждения.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Результат проверки</span>
          <select
            value={result}
            onChange={(event) => setResult(event.target.value as VerificationInput['result'])}
            className="h-10 rounded-xl border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {resultOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Способ подтверждения</span>
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as VerificationInput['method'])}
            className="h-10 rounded-xl border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {methods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {changedPrice ? (
        <label className="flex max-w-sm flex-col gap-1.5 text-sm">
          <span className="font-medium">Новая цена · {listing.currency}{listing.priceUnit === 'month' ? ' / месяц' : ''}</span>
          <input
            type="number"
            min="1"
            step="any"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            aria-invalid={priceError}
            aria-describedby={priceError ? 'verification-price-error' : undefined}
            className="h-10 rounded-xl border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {priceError ? <span id="verification-price-error" className="text-xs text-destructive">Укажите положительную цену, отличную от текущей.</span> : null}
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Комментарий <span className="font-normal text-muted-foreground">· необязательно</span></span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={2}
          placeholder="Короткая заметка о подтверждении"
          className="resize-y rounded-xl border bg-background px-3 py-2 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="text-xs text-muted-foreground">Событие будет записано от имени {currentUser.name}.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="h-9 rounded-full px-4 text-sm hover:bg-secondary">Отмена</button>
          <button type="submit" disabled={priceError} className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">Подтвердить проверку</button>
        </div>
      </div>
    </form>
  )
}
