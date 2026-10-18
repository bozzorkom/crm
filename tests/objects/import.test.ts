import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { listings, properties } from '../../lib/objects/fixtures'
import type { ListingView } from '../../lib/objects/types'
import { buildImportBatch, parseCsv, parseSpreadsheet, previewImport } from '../../lib/objects/import'

const catalog: ListingView[] = listings.map((listing) => ({
  listing,
  property: properties.find((property) => property.id === listing.propertyId)!,
}))

const header = ['Название', 'Тип', 'Район', 'Комнат', 'Площадь', 'Сделка', 'Цена', 'Валюта']

describe('local objects import', () => {
  it('parses BOM, semicolon delimiters, escaped quotes, and quoted newlines', () => {
    expect(parseCsv('\uFEFFНазвание;Район;Комментарий\r\n"ЖК; Chilonzor";Чиланзар;"Дом ""А""\nрядом с парком"')).toEqual([
      ['Название', 'Район', 'Комментарий'],
      ['ЖК; Chilonzor', 'Чиланзар', 'Дом "А"\nрядом с парком'],
    ])
  })

  it('reads the first worksheet from a local XLSX file', async () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([header, ['Тестовый дом', 'Квартира', 'Чиланзар', '2', '64', 'Продажа', '64000', 'USD']]), 'Objects')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['must not be used']]), 'Ignored')
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([bytes], 'objects.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    await expect(parseSpreadsheet(file)).resolves.toEqual([
      header,
      ['Тестовый дом', 'Квартира', 'Чиланзар', '2', '64', 'Продажа', '64000', 'USD'],
    ])
  })

  it('normalizes CSV rows, skips empty rows, and keeps contact columns out of the imported model', () => {
    const rows = [
      [...header, 'Телефон собственника'],
      ['Новая квартира', 'Квартира', 'Сергели', '2', '58', 'Продажа', '58000', 'USD', '+998 90 000 00 00'],
      ['', '', '', '', '', '', '', '', ''],
    ]
    const [preview] = previewImport(rows, catalog)

    expect(preview).toMatchObject({ rowNumber: 2, disposition: 'ready', property: { title: 'Новая квартира', district: 'Сергели' }, listing: { price: 58000, currency: 'USD', status: 'draft' } })
    expect(preview.property).not.toHaveProperty('phone')
    expect(preview.listing).not.toHaveProperty('phone')
  })

  it('reports malformed price, currency, and missing required fields without changing the catalogue', () => {
    const before = structuredClone(catalog)
    const preview = previewImport([
      header,
      ['Повреждённая строка', 'Квартира', '', '3', '72', 'Продажа', '-5', 'EUR'],
    ], catalog)

    expect(preview[0]).toMatchObject({ disposition: 'error' })
    expect(preview[0].errors).toEqual(expect.arrayContaining(['Не указан район', 'Цена должна быть положительным числом', 'Поддерживаются только USD и UZS']))
    expect(catalog).toEqual(before)
  })

  it('rejects numeric noise and unsupported explicit price units instead of silently importing them', () => {
    const preview = previewImport([
      [...header, 'Единица цены'],
      ['Повреждённая цена', 'Квартира', 'Сергели', '2', '58', 'Продажа', '12abc34', 'USD', 'итого'],
      ['Неверная единица', 'Квартира', 'Сергели', '2', '58', 'Аренда', '600', 'USD', 'неделя'],
    ], catalog)

    expect(preview[0]).toMatchObject({ disposition: 'error', errors: expect.arrayContaining(['Цена должна быть положительным числом']) })
    expect(preview[1]).toMatchObject({ disposition: 'error', errors: expect.arrayContaining(['Не распознана единица цены']) })
  })

  it('reports malformed and out-of-range optional numeric property fields', () => {
    const preview = previewImport([
      [...header, 'Этаж', 'Этажность'],
      ['Некорректные характеристики', 'Квартира', 'Сергели', '2abc', '-58', 'Продажа', '58000', 'USD', '-1', '0'],
    ], catalog)[0]

    expect(preview).toMatchObject({ disposition: 'error' })
    expect(preview.errors).toEqual(expect.arrayContaining([
      'Количество комнат должно быть положительным целым числом',
      'Площадь должна быть положительным числом',
      'Этаж не может быть отрицательным числом',
      'Этажность должна быть положительным числом',
    ]))
  })

  it('distinguishes the same physical property with a changed offer from an exact listing duplicate', () => {
    const changedOffer = previewImport([
      header,
      ['3-комн., ЖК Chilonzor City', 'Квартира', 'Чиланзар', '3', '82', 'Продажа', '79000', 'USD'],
    ], catalog)[0]
    const exactOffer = previewImport([
      header,
      ['3-комн., ЖК Chilonzor City', 'Квартира', 'Чиланзар', '3', '82', 'Продажа', '82000', 'USD'],
    ], catalog)[0]

    expect(changedOffer.disposition).toBe('duplicate')
    expect(changedOffer.candidates).toEqual([expect.objectContaining({ propertyId: 'p1', listingId: 'listing-p1', kinds: ['same_property'] })])
    expect(exactOffer.candidates).toEqual([expect.objectContaining({ propertyId: 'p1', listingId: 'listing-p1', kinds: ['same_property', 'same_listing'] })])
  })

  it('requires an explicit decision for duplicate rows and builds only the confirmed rows', () => {
    const previews = previewImport([
      header,
      ['3-комн., ЖК Chilonzor City', 'Квартира', 'Чиланзар', '3', '82', 'Продажа', '79000', 'USD'],
      ['Новая квартира', 'Квартира', 'Сергели', '2', '58', 'Продажа', '58000', 'USD'],
    ], catalog)

    const unresolved = buildImportBatch(previews, 'batch-1', catalog, {})
    expect(unresolved.unresolvedRows).toEqual([2])
    expect(unresolved.batch.records).toHaveLength(1)

    const decided = buildImportBatch(previews, 'batch-2', catalog, {
      2: { action: 'attach_existing', listingId: 'listing-p1' },
    })
    expect(decided.unresolvedRows).toEqual([])
    expect(decided.batch.records).toHaveLength(2)
    expect(decided.batch.records[0]).toMatchObject({ property: { id: 'p1' }, propertyAction: 'existing', action: 'create', listing: { propertyId: 'p1', status: 'draft' } })
  })

  it('allows an explicitly confirmed separate offer or skipping an exact duplicate', () => {
    const [preview] = previewImport([
      header,
      ['3-комн., ЖК Chilonzor City', 'Квартира', 'Чиланзар', '3', '82', 'Продажа', '82000', 'USD'],
    ], catalog)

    const separate = buildImportBatch([preview], 'batch-separate', catalog, { 2: { action: 'create_separate' } })
    expect(separate.batch.records[0]).toMatchObject({ propertyAction: 'create', action: 'keep_duplicate' })
    const skipped = buildImportBatch([preview], 'batch-skip', catalog, { 2: { action: 'skip', listingId: 'listing-p1' } })
    expect(skipped.batch.records[0].action).toBe('skip')
  })

  it('detects duplicate rows within the same file and can attach an explicit second offer to the first row’s property', () => {
    const previews = previewImport([
      header,
      ['Повтор в файле', 'Квартира', 'Сергели', '2', '58', 'Продажа', '58000', 'USD'],
      ['Повтор в файле', 'Квартира', 'Сергели', '2', '58', 'Продажа', '58000', 'USD'],
    ], catalog)

    expect(previews[0].disposition).toBe('ready')
    expect(previews[1]).toMatchObject({ disposition: 'duplicate', fileDuplicateRows: [2] })
    const result = buildImportBatch(previews, 'within-file', catalog, {
      3: { action: 'attach_existing', listingId: 'preview-listing-2' },
    })
    expect(result.unresolvedRows).toEqual([])
    expect(result.batch.records[1]).toMatchObject({
      property: { id: result.batch.records[0].property.id },
      propertyAction: 'existing',
      listing: { propertyId: result.batch.records[0].property.id },
    })
  })

  it('fails clearly for an unreadable workbook and an unterminated quoted CSV cell', async () => {
    const unreadable = new File(['not a workbook'], 'broken.xlsx')
    await expect(parseSpreadsheet(unreadable)).rejects.toThrow(/прочитать|не удалось/i)
    expect(() => parseCsv('Название;Район\n"Не закрытая;Чиланзар')).toThrow(/кавычк|формат/i)
    expect(() => parseCsv('Название;Район\n"Дом"x;Чиланзар')).toThrow(/после закрывающей кавычки|формат/i)
  })
})
