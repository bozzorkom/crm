import * as XLSX from 'xlsx'
import { currentUser } from '../data'
import { findListingDuplicates } from './domain'
import type { Currency, DealType, Listing, ListingDuplicate, ListingView, Property, PropertyKind } from './types'

export type ImportDecision = {
  action: 'create_new' | 'attach_existing' | 'create_separate' | 'skip'
  listingId?: string
}

export type ImportPreviewRow = {
  rowNumber: number
  disposition: 'ready' | 'error' | 'duplicate'
  errors: string[]
  property: Property
  listing: Listing
  candidates: ListingDuplicate[]
  fileDuplicateRows: number[]
}

export type ImportBatch = {
  id: string
  records: Array<{
    property: Property
    listing: Listing
    propertyAction: 'create' | 'existing'
    action: 'create' | 'keep_duplicate' | 'skip'
  }>
}

const headerAliases: Record<string, string[]> = {
  title: ['название', 'названиеобъекта', 'объект', 'наименование', 'title', 'name', 'property'],
  kind: ['тип', 'типобъекта', 'недвижимость', 'kind', 'propertytype', 'type'],
  city: ['город', 'city'],
  district: ['район', 'district'],
  landmark: ['ориентир', 'метро', 'landmark', 'near'],
  rooms: ['комнат', 'комнаты', 'количествокомнат', 'rooms', 'bedrooms'],
  size: ['площадь', 'площадьм2', 'area', 'sqm', 'size'],
  floor: ['этаж', 'floor'],
  floorsTotal: ['этажность', 'всегоэтажей', 'floors', 'floorstotal'],
  deal: ['сделка', 'типсделки', 'deal', 'dealtype'],
  price: ['цена', 'стоимость', 'price', 'amount'],
  currency: ['валюта', 'currency'],
  priceUnit: ['период', 'единицацены', 'priceunit', 'period'],
  mortgage: ['ипотека', 'mortgage'],
  agent: ['агент', 'ответственный', 'agent'],
  source: ['источник', 'source'],
}

function normalizeHeader(value: unknown) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ru').replace(/[^a-zа-яё0-9]/giu, '')
}

function detectDelimiter(text: string): ',' | ';' {
  let commas = 0
  let semicolons = 0
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') index += 1
      else quoted = !quoted
    } else if (!quoted && (character === '\n' || character === '\r')) break
    else if (!quoted && character === ',') commas += 1
    else if (!quoted && character === ';') semicolons += 1
  }
  return semicolons > commas ? ';' : ','
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let afterQuoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
        afterQuoted = true
      } else {
        field += character
      }
      continue
    }

    if (afterQuoted) {
      if (character === ' ' || character === '\t') continue
      if (character === delimiter) {
        row.push(field.trim())
        field = ''
        afterQuoted = false
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && text[index + 1] === '\n') index += 1
        row.push(field.trim())
        if (row.some((cell) => cell !== '')) rows.push(row)
        row = []
        field = ''
        afterQuoted = false
      } else {
        throw new Error('Некорректный формат CSV: после закрывающей кавычки ожидался разделитель или конец строки.')
      }
      continue
    }

    if (character === '"') {
      if (field.trim()) throw new Error('Некорректный формат CSV: кавычка внутри незакрытого значения.')
      field = ''
      quoted = true
    } else if (character === delimiter) {
      row.push(field.trim())
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field.trim())
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (quoted) throw new Error('Некорректный формат CSV: не закрыта кавычка.')
  row.push(field.trim())
  if (row.some((cell) => cell !== '')) rows.push(row)
  return rows
}

export async function parseSpreadsheet(file: File): Promise<string[][]> {
  const extension = file.name.toLocaleLowerCase('ru').split('.').pop()
  try {
    if (extension === 'csv') return parseCsv(await file.text())
    if (extension !== 'xlsx') throw new Error('Поддерживаются только файлы CSV и XLSX.')
    const data = await file.arrayBuffer()
    const signature = new Uint8Array(data, 0, Math.min(4, data.byteLength))
    if (signature.length < 4 || signature[0] !== 0x50 || signature[1] !== 0x4b) {
      throw new Error('Не удалось прочитать XLSX: файл не похож на книгу Excel.')
    }
    const workbook = XLSX.read(data, { type: 'array', cellDates: false })
    const firstSheet = workbook.SheetNames[0]
    if (!firstSheet) throw new Error('В книге нет листов для импорта.')
    return XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[firstSheet], { header: 1, raw: false, defval: '' })
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((cell) => cell !== ''))
  } catch (error) {
    if (error instanceof Error && /Поддерживаются|нет листов/.test(error.message)) throw error
    throw new Error('Не удалось прочитать файл. Проверьте, что CSV/XLSX не повреждён и сохранён в поддерживаемом формате.')
  }
}

function parseKind(value: string): PropertyKind | undefined {
  const normalized = normalizeHeader(value)
  if (/квартир|апартамент|apartment|flat/.test(normalized)) return 'apartment'
  if (/дом|house|cottage/.test(normalized)) return 'house'
  if (/коммерч|commercial|офис|магазин/.test(normalized)) return 'commercial'
  if (/участок|земл|land|plot/.test(normalized)) return 'land'
  return undefined
}

function parseDeal(value: string): DealType | undefined {
  const normalized = normalizeHeader(value)
  if (/аренд|снять|rent|ijara/.test(normalized)) return 'rent'
  if (/продаж|куп|покуп|sale|sell/.test(normalized)) return 'sale'
  return undefined
}

function parseCurrency(value: string): Currency | undefined {
  const normalized = normalizeHeader(value)
  if (normalized === 'usd' || normalized === 'доллар' || normalized === 'доллары' || normalized === 'долл' || normalized === 'уе' || value.includes('$')) return 'USD'
  if (normalized === 'uzs' || normalized === 'сум' || normalized === 'сумы' || normalized === 'som' || normalized === 'soum') return 'UZS'
  return undefined
}

function parseNumeric(value: string, allowDecimal = false, kind: 'price' | 'area' | 'plain' = 'plain'): number | undefined {
  let raw = value.trim()
  if (kind === 'price') {
    raw = raw
      .replace(/^(?:USD|UZS|\$)\s*/iu, '')
      .replace(/\s*(?:USD|UZS|доллар\w*|долл\.?|у\.е\.|сум\w*|сўм|so'?m|soum|\$)\s*$/iu, '')
  } else if (kind === 'area') {
    raw = raw.replace(/\s*(?:м(?:²|2)|кв\.?\s*м|sqm|m2)\s*$/iu, '')
  }
  if (!raw || !/^[+-]?\d[\d\s\u00a0.,]*$/.test(raw)) return undefined

  const compact = raw.replace(/[\s\u00a0]/g, '')
  if (!compact || !/^[+-]?\d[\d.,]*$/.test(compact)) return undefined
  const sign = compact.startsWith('-') ? '-' : ''
  const unsigned = compact.replace(/^[+-]/, '')
  const validGroupedInteger = (part: string, separator: string) => {
    const escaped = separator === '.' ? '\\.' : separator
    return new RegExp(`^\\d{1,3}(?:${escaped}\\d{3})+$`).test(part)
  }

  if (!allowDecimal) {
    if (/[\s\u00a0]/.test(raw) && !/^[+-]?\d{1,3}(?:[\s\u00a0]\d{3})+$/.test(raw)) return undefined
    const isPlainInteger = /^\d+$/.test(unsigned)
    const isCommaGrouped = validGroupedInteger(unsigned, ',')
    const isDotGrouped = validGroupedInteger(unsigned, '.')
    if (!isPlainInteger && !isCommaGrouped && !isDotGrouped) return undefined
    const parsed = Number(`${sign}${unsigned.replace(/[.,]/g, '')}`)
    return Number.isSafeInteger(parsed) ? parsed : undefined
  }

  if (/\s/.test(raw) && !/^[+-]?\d{1,3}(?:[\s\u00a0]\d{3})+(?:[.,]\d+)?$/.test(raw)) return undefined
  const commaAt = unsigned.lastIndexOf(',')
  const dotAt = unsigned.lastIndexOf('.')
  const decimalAt = Math.max(commaAt, dotAt)
  if (decimalAt < 0) return Number(`${sign}${unsigned}`)

  const separator = unsigned[decimalAt]
  const integerPart = unsigned.slice(0, decimalAt)
  const fractionPart = unsigned.slice(decimalAt + 1)
  const hasBothSeparators = unsigned.includes(',') && unsigned.includes('.')
  if (!fractionPart || !/^\d+$/.test(fractionPart)) return undefined

  if (!hasBothSeparators && unsigned.slice(0, decimalAt).includes(separator)) {
    if (!validGroupedInteger(unsigned, separator)) return undefined
    const grouped = Number(`${sign}${unsigned.replace(/[.,]/g, '')}`)
    return Number.isFinite(grouped) ? grouped : undefined
  }
  if (!hasBothSeparators && fractionPart.length === 3 && /^\d{1,3}$/.test(integerPart)) {
    const grouped = Number(`${sign}${integerPart}${fractionPart}`)
    return Number.isFinite(grouped) ? grouped : undefined
  }

  const otherSeparator = separator === ',' ? '.' : ','
  const validInteger = /^\d+$/.test(integerPart) || validGroupedInteger(integerPart, otherSeparator)
  if (!validInteger) return undefined
  const normalizedInteger = integerPart.replace(/[.,]/g, '')
  const parsed = Number(`${sign}${normalizedInteger}.${fractionPart}`)
  return Number.isFinite(parsed) ? parsed : undefined
}

function cell(row: string[], indexes: Map<string, number>, key: string) {
  const index = indexes.get(key)
  return index === undefined ? '' : (row[index] ?? '').trim()
}

function parseBoolean(value: string) {
  return /^(да|yes|true|1|ипотека)$/i.test(value.trim())
}

export function previewImport(rows: string[][], catalog: ListingView[]): ImportPreviewRow[] {
  const [header, ...data] = rows
  if (!header?.length) return []
  const normalized = header.map(normalizeHeader)
  const indexes = new Map<string, number>()
  for (const [key, aliases] of Object.entries(headerAliases)) {
    const index = normalized.findIndex((value) => aliases.some((alias) => normalizeHeader(alias) === value))
    if (index >= 0) indexes.set(key, index)
  }
  if (!indexes.has('title')) throw new Error('В файле не найден столбец с названием объекта.')

  const previews: ImportPreviewRow[] = []
  const seenViews: ListingView[] = []
  for (const [offset, row] of data.entries()) {
    if (!row.some((value) => value.trim())) continue
    const rowNumber = offset + 2
    const errors: string[] = []
    const rawTitle = cell(row, indexes, 'title')
    const kind = parseKind(cell(row, indexes, 'kind'))
    const district = cell(row, indexes, 'district')
    const deal = parseDeal(cell(row, indexes, 'deal'))
    const priceRaw = cell(row, indexes, 'price')
    const price = parseNumeric(priceRaw, false, 'price')
    const currencyRaw = cell(row, indexes, 'currency')
    const currency = parseCurrency(currencyRaw)
    const roomsRaw = cell(row, indexes, 'rooms')
    const rooms = parseNumeric(roomsRaw)
    const areaRaw = cell(row, indexes, 'size')
    const area = parseNumeric(areaRaw, true, 'area')
    const floorRaw = cell(row, indexes, 'floor')
    const floor = parseNumeric(floorRaw)
    const floorsTotalRaw = cell(row, indexes, 'floorsTotal')
    const floorsTotal = parseNumeric(floorsTotalRaw)

    if (!rawTitle) errors.push('Не указано название объекта')
    if (!kind) errors.push('Не распознан тип объекта')
    if (!district) errors.push('Не указан район')
    if (!deal) errors.push('Не распознан тип сделки')
    if (!priceRaw || price === undefined || price <= 0) errors.push('Цена должна быть положительным числом')
    if (!currency) errors.push(currencyRaw ? 'Поддерживаются только USD и UZS' : 'Не указана валюта')
    if (roomsRaw && (rooms === undefined || rooms <= 0)) errors.push('Количество комнат должно быть положительным целым числом')
    if (areaRaw && (area === undefined || area <= 0)) errors.push('Площадь должна быть положительным числом')
    if (floorRaw && floor === undefined) errors.push('Этаж должен быть целым числом')
    if (floor !== undefined && floor < 0) errors.push('Этаж не может быть отрицательным числом')
    if (floorsTotalRaw && (floorsTotal === undefined || floorsTotal <= 0)) errors.push('Этажность должна быть положительным числом')
    if (floor !== undefined && floorsTotal !== undefined && floor > floorsTotal) errors.push('Этаж не может быть выше общей этажности')

    const property: Property = {
      id: `preview-property-${rowNumber}`,
      kind: kind ?? 'apartment',
      title: rawTitle || `Строка ${rowNumber}`,
      city: cell(row, indexes, 'city') || 'Ташкент',
      district,
      landmark: cell(row, indexes, 'landmark') || undefined,
      rooms,
      area,
      floor,
      floorsTotal,
      features: [],
    }
    const isRent = deal === 'rent'
    const explicitUnit = normalizeHeader(cell(row, indexes, 'priceUnit'))
    const monthlyUnit = /месяц|месяч|month|мес/.test(explicitUnit)
    const totalUnit = /итого|разов|total|общая|общаясумма|целиком|единоврем|полнаяцена/.test(explicitUnit)
    if (explicitUnit && !monthlyUnit && !totalUnit) errors.push('Не распознана единица цены')
    const listing: Listing = {
      id: `preview-listing-${rowNumber}`,
      propertyId: property.id,
      deal: deal ?? 'sale',
      price: price ?? 0,
      currency: currency ?? 'USD',
      priceUnit: monthlyUnit ? 'month' : totalUnit ? 'total' : isRent ? 'month' : 'total',
      mortgage: parseBoolean(cell(row, indexes, 'mortgage')),
      agent: cell(row, indexes, 'agent') || 'Не назначен',
      source: { type: 'import', label: cell(row, indexes, 'source') || 'Локальный импорт' },
      visibility: 'team',
      clientShareAllowed: false,
      status: 'draft',
      priceHistory: [],
      events: [],
    }
    const candidates = errors.length ? [] : findListingDuplicates({ property, listing }, [...catalog, ...seenViews])
    const fileDuplicateRows = candidates.flatMap((candidate) => {
      const match = candidate.listingId.match(/^preview-listing-(\d+)$/)
      return match ? [Number(match[1])] : []
    })
    const preview: ImportPreviewRow = {
      rowNumber,
      disposition: errors.length ? 'error' : candidates.length ? 'duplicate' : 'ready',
      errors,
      property,
      listing,
      candidates,
      fileDuplicateRows,
    }
    previews.push(preview)
    if (!errors.length) seenViews.push({ property, listing })
  }
  return previews
}

export function buildImportBatch(
  previews: ImportPreviewRow[],
  batchId: string,
  catalog: ListingView[],
  decisions: Record<number, ImportDecision>,
): { batch: ImportBatch; unresolvedRows: number[] } {
  const records: ImportBatch['records'] = []
  const unresolvedRows: number[] = []
  const importedPropertiesByListingId = new Map<string, Property>()

  for (const preview of previews) {
    if (preview.disposition === 'error') continue
    const decision = preview.disposition === 'duplicate' ? decisions[preview.rowNumber] : { action: 'create_new' as const }
    if (!decision) {
      unresolvedRows.push(preview.rowNumber)
      continue
    }
    const selectedCandidate = decision.listingId
      ? preview.candidates.find((candidate) => candidate.listingId === decision.listingId)
      : undefined
    if (decision.action === 'attach_existing' && !selectedCandidate) {
      unresolvedRows.push(preview.rowNumber)
      continue
    }

    const existingProperty = selectedCandidate
      ? catalog.find((view) => view.listing.id === selectedCandidate.listingId)?.property
        ?? importedPropertiesByListingId.get(selectedCandidate.listingId)
      : undefined
    if (decision.action === 'attach_existing' && !existingProperty) {
      unresolvedRows.push(preview.rowNumber)
      continue
    }

    const propertyAction = existingProperty ? 'existing' : 'create'
    const propertyId = existingProperty?.id ?? `import-${batchId}-property-${preview.rowNumber}`
    const at = new Date().toISOString()
    const property = existingProperty ?? { ...preview.property, id: propertyId, importBatchId: batchId }
    const listing: Listing = {
      ...preview.listing,
      id: `import-${batchId}-listing-${preview.rowNumber}`,
      propertyId,
      status: 'draft',
      importBatchId: batchId,
      priceHistory: [{ id: `import-${batchId}-price-${preview.rowNumber}`, amount: preview.listing.price, currency: preview.listing.currency, priceUnit: preview.listing.priceUnit, at, author: currentUser.name, note: 'Исходные условия локального импорта' }],
      events: [],
    }
    const action = decision.action === 'skip' ? 'skip' : decision.action === 'create_separate' ? 'keep_duplicate' : 'create'
    records.push({
      property,
      listing,
      propertyAction,
      action,
    })
    if (action !== 'skip') importedPropertiesByListingId.set(preview.listing.id, property)
  }

  return { batch: { id: batchId, records }, unresolvedRows }
}
