import { districts, type Need } from './data'

const districtAliases: Record<string, string[]> = {
  Чиланзар: ['чиланзар', 'chilonzor', 'chilanzar'],
  Юнусабад: ['юнусабад', 'yunusobod', 'yunusabad'],
  'Мирзо-Улугбек': ['мирзо-улугбек', 'мирзо улугбек', 'улугбек', 'mirzo-ulugbek', 'mirzo ulugbek'],
  Яккасарай: ['яккасарай', 'yakkasaroy'],
  Мирабад: ['мирабад', 'mirobod', 'mirabad'],
  Сергели: ['сергели', 'sergeli'],
  Шайхантахур: ['шайхантахур', 'shayxontohur'],
  Яшнабад: ['яшнабад', 'yashnobod'],
}

const wordRooms: Record<string, number> = {
  однушк: 1,
  двушк: 2,
  трешк: 3,
  трёшк: 3,
  четырешк: 4,
}

export type Confidence = 'high' | 'low'

export type ExtractedField = {
  key: 'deal' | 'rooms' | 'districts' | 'budget' | 'mortgage' | 'moveIn'
  label: string
  value: string
  confidence: Confidence
}

export type Extraction = {
  need: Need
  fields: ExtractedField[]
  missing: string[]
}

function parseBudget(text: string): { value?: number; currency: Need['budgetCurrency']; confident: boolean } {
  const normalized = text.replace(/\u00a0/g, ' ').toLowerCase()
  const hasUzs = /\b(?:uzs|sum|soum|so['’‘ʻʼ]?m)\b|сум|сўм/u.test(normalized)
  const hasUsd = /\$|\busd\b|доллар\w*|долл\.?|у\.е\./u.test(normalized)
  const hasUnsupportedCurrency = /€|\beur\b|₽|рубл\w*/u.test(normalized)
  const currency: Need['budgetCurrency'] = hasUnsupportedCurrency || (hasUzs && hasUsd)
    ? 'unknown'
    : hasUzs
      ? 'UZS'
      : 'USD'
  const kMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:k|к|тыс\.?)(?=\s|$|[.,;!?/])/iu)
  if (kMatch) return { value: Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000), currency, confident: true }
  const dollar = normalized.match(/\$\s*([\d\s]{3,})|([\d\s]{3,})\s*(?:\$|долл|usd|у\.е)/)
  if (dollar) {
    const raw = (dollar[1] ?? dollar[2]).replace(/\s/g, '')
    return { value: parseInt(raw, 10), currency, confident: true }
  }
  const plain = normalized.match(/до\s*([\d\s]{3,})/)
  if (plain) return { value: parseInt(plain[1].replace(/\s/g, ''), 10), currency, confident: hasUzs || hasUsd }
  return { currency, confident: false }
}

export function extractNeed(text: string): Extraction {
  const lower = text.toLowerCase()
  const fields: ExtractedField[] = []
  const missing: string[] = []

  const isRent = /аренд|снять|сним|ijara|в месяц|\/мес/.test(lower)
  const deal = isRent ? 'rent' : 'sale'
  fields.push({
    key: 'deal',
    label: 'Сделка',
    value: isRent ? 'Аренда' : 'Покупка',
    confidence: /аренд|снять|купить|покупк|ипотек|ijara/.test(lower) ? 'high' : 'low',
  })

  let rooms: number | undefined
  const explicitRoomsMatch = lower.match(/(?<!\d)(\d)\s*(?:-|х|x)?\s*(?:комн|xona)/u)
  const shorthandRoomsMatch = lower.match(/(?<!\d)(\d)\s*к(?=[\s,.]|$)/u)
  const shorthandPrefix = shorthandRoomsMatch?.index === undefined ? '' : lower.slice(0, shorthandRoomsMatch.index)
  // Cyrillic "к" can mean rooms or thousands; an explicit budget cue takes precedence.
  const shorthandHasBudgetCue =
    /(?:\$|usd|долл|у\.е\.)\s*$/iu.test(shorthandPrefix) ||
    /(?:^|[\s,;])(?:до|от|бюджет(?:\s+до)?|максимум|не\s+более)\s*[:=]?\s*(?:\$\s*)?$/iu.test(shorthandPrefix)
  const roomsMatch = explicitRoomsMatch ?? (shorthandHasBudgetCue ? null : shorthandRoomsMatch)
  if (roomsMatch) rooms = parseInt(roomsMatch[1], 10)
  else {
    const word = Object.keys(wordRooms).find((w) => lower.includes(w))
    if (word) rooms = wordRooms[word]
  }
  if (rooms) fields.push({ key: 'rooms', label: 'Комнаты', value: String(rooms), confidence: 'high' })
  else missing.push('Количество комнат')

  const foundDistricts = districts.filter((d) => districtAliases[d]?.some((alias) => lower.includes(alias)))
  if (foundDistricts.length)
    fields.push({ key: 'districts', label: 'Районы', value: foundDistricts.join(', '), confidence: 'high' })
  else missing.push('Район')

  const budgetText = roomsMatch ? lower.replace(roomsMatch[0], ' ') : text
  const budget = parseBudget(budgetText)
  if (budget.value)
    fields.push({
      key: 'budget',
      label: 'Бюджет до',
      value: `${budget.currency === 'USD' ? '$' : ''}${new Intl.NumberFormat('ru-RU').format(budget.value)}${budget.currency === 'UZS' ? ' сум' : budget.currency === 'unknown' ? ' · валюта не распознана' : ''}${isRent ? '/мес' : ''}`,
      confidence: budget.confident ? 'high' : 'low',
    })
  else missing.push('Бюджет')

  const mortgage = /ипотек|ipoteka/.test(lower)
  if (mortgage) fields.push({ key: 'mortgage', label: 'Оплата', value: 'Ипотека', confidence: 'high' })

  const moveMatch = lower.match(/(?:в течение|за|через)\s+(\d+\s*)?(недел\w*|месяц\w*|дн\w*)/)
  let moveIn: string | undefined
  if (moveMatch) {
    moveIn = `${moveMatch[1]?.trim() ?? '1'} ${moveMatch[2].startsWith('недел') ? 'нед.' : moveMatch[2].startsWith('дн') ? 'дн.' : 'мес.'}`
    fields.push({ key: 'moveIn', label: 'Срок', value: moveIn, confidence: 'low' })
  }

  return {
    need: { deal, rooms, districts: foundDistricts, budgetMax: budget.value, budgetCurrency: budget.value ? budget.currency : undefined, mortgage, moveIn },
    fields,
    missing,
  }
}

export function needToSearchParams(need: Need) {
  const params = new URLSearchParams()
  params.set('deal', need.deal)
  if (need.rooms) params.set('rooms', String(need.rooms))
  if (need.districts.length) params.set('districts', need.districts.join(','))
  if (need.budgetMax) params.set('budget', String(need.budgetMax))
  if (need.budgetCurrency && need.budgetCurrency !== 'USD') params.set('currency', need.budgetCurrency)
  if (need.mortgage) params.set('mortgage', '1')
  return params.toString()
}

export function needFromSearchParams(params: Record<string, string | string[] | undefined>): Need | null {
  const get = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }
  if (!get('deal')) return null
  const currency = get('currency')
  return {
    deal: get('deal') === 'rent' ? 'rent' : 'sale',
    rooms: get('rooms') ? Number(get('rooms')) : undefined,
    districts: get('districts')?.split(',').filter(Boolean) ?? [],
    budgetMax: get('budget') ? Number(get('budget')) : undefined,
    budgetCurrency: currency === 'UZS' ? 'UZS' : currency === 'unknown' ? 'unknown' : 'USD',
    mortgage: get('mortgage') === '1',
  }
}
