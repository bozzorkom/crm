'use client'

import Link from 'next/link'
import { useState, type ChangeEvent } from 'react'
import { AlertCircle, ArrowLeft, Check, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shell/page-header'
import { useObjectWorkspace } from '@/components/objects/object-workspace'
import { buildImportBatch, parseSpreadsheet, previewImport, type ImportDecision, type ImportPreviewRow } from '@/lib/objects/import'
import { formatListingPrice } from '@/lib/format'

const decisionOptions = [
  { value: 'create_separate', label: 'Создать отдельный объект' },
  { value: 'skip', label: 'Пропустить эту строку' },
]

export function ImportWizard() {
  const { listingViews, applyImportBatch, undoImportBatch } = useObjectWorkspace()
  const [previews, setPreviews] = useState<ImportPreviewRow[] | null>(null)
  const [decisions, setDecisions] = useState<Record<number, ImportDecision>>({})
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [appliedBatchId, setAppliedBatchId] = useState('')
  const [appliedCount, setAppliedCount] = useState(0)
  const [busy, setBusy] = useState(false)

  async function onSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    setNotice('')
    setPreviews(null)
    setDecisions({})
    setFileName(file.name)
    try {
      const rows = await parseSpreadsheet(file)
      const parsed = previewImport(rows, listingViews)
      if (!parsed.length) throw new Error('В файле нет строк с данными для предпросмотра.')
      setPreviews(parsed)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось обработать файл.')
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  function setRowDecision(rowNumber: number, value: string) {
    if (!value) {
      setDecisions((current) => {
        const next = { ...current }
        delete next[rowNumber]
        return next
      })
      return
    }
    if (value.startsWith('attach:')) {
      setDecisions((current) => ({ ...current, [rowNumber]: { action: 'attach_existing', listingId: value.slice('attach:'.length) } }))
    } else {
      setDecisions((current) => ({ ...current, [rowNumber]: { action: value as ImportDecision['action'] } }))
    }
  }

  function applyImport() {
    if (!previews) return
    const batchId = `import-${crypto.randomUUID()}`
    const { batch, unresolvedRows } = buildImportBatch(previews, batchId, listingViews, decisions)
    if (unresolvedRows.length) {
      setError(`Для строк ${unresolvedRows.join(', ')} выберите решение по возможному дублю.`)
      return
    }
    const eligibleCount = batch.records.filter((record) => record.action !== 'skip').length
    if (!eligibleCount) {
      setError('Нет строк, выбранных для импорта. Каталог не изменён.')
      return
    }
    const count = applyImportBatch(batch)
    setAppliedBatchId(batchId)
    setAppliedCount(count)
    setError('')
    setNotice(`Добавлено черновиков: ${count}. Данные остались в памяти этой вкладки.`)
  }

  function undoImport() {
    if (!appliedBatchId || !window.confirm('Отменить этот импорт? Только добавленные им объявления будут удалены из текущей демо-сессии.')) return
    const undone = undoImportBatch(appliedBatchId)
    if (undone) {
      setNotice(`Импорт отменён: удалено ${appliedCount} добавленных объявлений.`)
      setAppliedBatchId('')
      setAppliedCount(0)
      setPreviews(null)
    } else {
      setError('Импорт уже нельзя отменить: в текущей сессии его записи не найдены.')
    }
  }

  const readyCount = previews?.filter((row) => row.disposition === 'ready').length ?? 0
  const duplicateCount = previews?.filter((row) => row.disposition === 'duplicate').length ?? 0
  const errorCount = previews?.filter((row) => row.disposition === 'error').length ?? 0

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-8 md:px-8 md:py-10">
      <Link href="/objects" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> К объектам
      </Link>
      <PageHeader title="Импорт объектов" description="Проверьте файл и каждую строку до добавления в демо-каталог." />

      <section className="rounded-3xl border bg-secondary/20 p-5 md:p-6" aria-labelledby="local-import-title">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background"><FileSpreadsheet className="size-5" aria-hidden="true" /></div>
          <div>
            <h2 id="local-import-title" className="text-sm font-semibold">Файл обрабатывается только в браузере</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Он не загружается на сервер и не сохраняется. Используйте синтетические данные: контактные колонки будут проигнорированы, а изменения исчезнут после перезагрузки.</p>
          </div>
        </div>
        <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-background px-5 py-5 text-center transition-colors hover:border-foreground/40 hover:bg-secondary/30">
          <Upload className="size-5" aria-hidden="true" />
          <span className="text-sm font-medium">{busy ? 'Читаем файл локально…' : fileName || 'Выберите CSV или XLSX'}</span>
          <span className="text-xs text-muted-foreground">Первая строка должна содержать заголовки. Читается первый лист XLSX.</span>
          <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={onSelectFile} disabled={busy} />
        </label>
      </section>

      {error ? <div role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"><AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />{error}</div> : null}
      {notice ? <div role="status" className="flex items-center gap-2 rounded-2xl border bg-secondary/30 px-4 py-3 text-sm"><Check className="size-4 shrink-0" aria-hidden="true" />{notice}</div> : null}

      {appliedBatchId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
          <Link href="/objects" className="text-sm font-medium underline underline-offset-4">Открыть каталог объектов</Link>
          <button type="button" onClick={undoImport} className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm hover:bg-secondary"><RotateCcw className="size-4" aria-hidden="true" /> Отменить импорт</button>
        </div>
      ) : null}

      {previews ? (
        <section className="flex flex-col gap-4" aria-labelledby="preview-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="preview-title" className="text-lg font-semibold">Предпросмотр</h2>
              <p className="mt-1 text-sm text-muted-foreground">{previews.length} строк · готово: {readyCount} · возможные дубли: {duplicateCount} · ошибки: {errorCount}</p>
            </div>
            {!appliedBatchId ? <button type="button" onClick={applyImport} disabled={!readyCount && !duplicateCount} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"><Check className="size-4" aria-hidden="true" /> Подтвердить импорт</button> : null}
          </div>
          <div className="grid gap-3">
            {previews.map((row) => <PreviewCard key={row.rowNumber} row={row} decision={decisions[row.rowNumber]} onDecision={(value) => setRowDecision(row.rowNumber, value)} disabled={Boolean(appliedBatchId)} />)}
          </div>
          {errorCount > 0 ? <p className="text-xs text-muted-foreground">Строки с ошибками пропущены. Исправьте исходный файл и загрузите его повторно.</p> : null}
        </section>
      ) : null}
    </main>
  )
}

function PreviewCard({ row, decision, onDecision, disabled }: { row: ImportPreviewRow; decision?: ImportDecision; onDecision: (value: string) => void; disabled: boolean }) {
  const isError = row.disposition === 'error'
  const duplicate = row.disposition === 'duplicate'
  const selectedValue = decision ? decision.action === 'attach_existing' ? `attach:${decision.listingId}` : decision.action : ''
  return (
    <article className="rounded-2xl border p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Строка {row.rowNumber} · {row.listing.deal === 'sale' ? 'Продажа' : 'Аренда'}</p>
          <h3 className="mt-1 truncate text-sm font-semibold">{row.property.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{row.property.district || 'Район не указан'}{row.property.rooms ? ` · ${row.property.rooms} комн.` : ''}{row.property.area ? ` · ${row.property.area} м²` : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{isError ? '—' : formatListingPrice(row.listing.price, row.listing.currency, row.listing.priceUnit)}</p>
          <span className={isError ? 'mt-1 inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] text-destructive' : duplicate ? 'mt-1 inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-800' : 'mt-1 inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px]'}>
            {isError ? 'Нужна правка' : duplicate ? 'Проверьте совпадение' : 'Будет черновиком'}
          </span>
        </div>
      </div>

      {isError ? <ul className="mt-3 list-inside list-disc text-xs leading-5 text-destructive">{row.errors.map((message) => <li key={message}>{message}</li>)}</ul> : null}
      {duplicate ? (
        <div className="mt-4 space-y-3 rounded-xl bg-secondary/40 p-3">
          <p className="text-xs leading-5 text-muted-foreground">Похожая карточка не объединяется автоматически. Сравните условия и явно выберите действие. Точное совпадение касается и физического объекта, и условий предложения.</p>
          <div className="grid gap-2">
            {row.candidates.map((candidate) => (
              <div key={candidate.listingId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 text-xs">
                {candidate.listingId.startsWith('preview-listing-') ? (
                  <span className="font-medium">Строка {candidate.listingId.replace('preview-listing-', '')} этого файла</span>
                ) : (
                  <Link href={`/objects/${candidate.listingId}`} className="font-medium underline underline-offset-2">Открыть карточку {candidate.listingId.replace('listing-', '')}</Link>
                )}
                <span className="text-muted-foreground">{candidate.reasons.join(' · ')}</span>
              </div>
            ))}
          </div>
          <label className="block text-xs font-medium">
            Решение по строке
            <select value={selectedValue} onChange={(event) => onDecision(event.target.value)} disabled={disabled} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
              <option value="">Выберите действие…</option>
              {row.candidates.map((candidate) => {
                const fileRow = candidate.listingId.match(/^preview-listing-(\d+)$/)?.[1]
                return <option key={candidate.listingId} value={`attach:${candidate.listingId}`}>{fileRow ? `Добавить отдельное объявление к строке ${fileRow} этого файла` : `Добавить отдельное объявление к найденному объекту · ${candidate.propertyId}`}</option>
              })}
              {decisionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      ) : null}
    </article>
  )
}
