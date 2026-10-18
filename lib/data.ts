import type { DealType } from './objects/types'
import type { Currency } from './objects/types'

export type { DealType } from './objects/types'
export type LeadSource = 'Telegram' | 'Instagram' | 'OLX' | 'Звонок' | 'Рекомендация' | 'Сайт'
export const leadSources: LeadSource[] = ['Telegram', 'Instagram', 'OLX', 'Звонок', 'Рекомендация', 'Сайт']
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'showing' | 'lost'

export type Need = {
  deal: DealType
  rooms?: number
  districts: string[]
  budgetMax?: number
  budgetCurrency?: Currency | 'unknown'
  mortgage?: boolean
  moveIn?: string
}

export type TimelineEvent = {
  id: string
  kind: 'message' | 'call' | 'note' | 'system' | 'showing'
  text: string
  at: string
  author?: string
}

export type Lead = {
  id: string
  name: string
  phone?: string
  source: LeadSource
  minutesAgo: number
  slaMinutes: number
  status: LeadStatus
  owner: string
  request: string
  need: Need
  nextStep?: { text: string; due: string; overdue?: boolean }
  timeline: TimelineEvent[]
  sessionOnly?: boolean
}

export type PropertyStatus = 'available' | 'reserved' | 'stale'

export type Property = {
  id: string
  title: string
  district: string
  landmark: string
  rooms: number
  area: number
  floor: number
  floorsTotal: number
  price: number
  deal: DealType
  image: string
  status: PropertyStatus
  verifiedDaysAgo: number
  agent: string
  mortgage: boolean
  renovation: 'Евроремонт' | 'Хороший' | 'Требует ремонта' | 'Коробка'
}

export type DealStage = 'qualification' | 'selection' | 'showing' | 'negotiation' | 'approval' | 'closing'

export type Deal = {
  id: string
  client: string
  propertyId: string
  stage: DealStage
  amount: number
  commission: number
  agent: string
  partner?: string
  daysInStage: number
  next: string
}

export type Showing = {
  id: string
  time: string
  client: string
  propertyId: string
  listingId: string
  confirmed: boolean
}

export const currentUser = {
  name: 'Дилноза Каримова',
  firstName: 'Дилноза',
  role: 'Руководитель группы',
  agency: 'Uy Group',
  initials: 'ДК',
}

export const team = ['Дилноза К.', 'Азиз Р.', 'Камила Ю.', 'Тимур Х.', 'Нодира С.']

export const districts = [
  'Чиланзар',
  'Юнусабад',
  'Мирзо-Улугбек',
  'Яккасарай',
  'Мирабад',
  'Сергели',
  'Шайхантахур',
  'Яшнабад',
]

export const leads: Lead[] = [
  {
    id: 'l1',
    name: 'Шахзод Турсунов',
    phone: '+998 90 123 45 67',
    source: 'Telegram',
    minutesAgo: 4,
    slaMinutes: 15,
    status: 'new',
    owner: 'Дилноза К.',
    request:
      'Здравствуйте! Ищем 3-комнатную квартиру для семьи, Чиланзар или Юнусабад, до $85 000. Желательно под ипотеку, въехать хотим в течение месяца.',
    need: { deal: 'sale', rooms: 3, districts: ['Чиланзар', 'Юнусабад'], budgetMax: 85000, mortgage: true, moveIn: '1 месяц' },
    timeline: [
      { id: 't1', kind: 'message', text: 'Здравствуйте! Ищем 3-комнатную квартиру для семьи, Чиланзар или Юнусабад, до $85 000…', at: '14:21', author: 'Шахзод' },
      { id: 't2', kind: 'system', text: 'Лид создан из Telegram-бота агентства, назначен: Дилноза К.', at: '14:21' },
    ],
  },
  {
    id: 'l2',
    name: 'Мадина Алиева',
    phone: '+998 93 555 12 09',
    source: 'Instagram',
    minutesAgo: 22,
    slaMinutes: 15,
    status: 'new',
    owner: 'Азиз Р.',
    request: 'Нужна аренда 2-комнатной квартиры в Мирзо-Улугбеке, бюджет до $600 в месяц, с мебелью.',
    need: { deal: 'rent', rooms: 2, districts: ['Мирзо-Улугбек'], budgetMax: 600 },
    timeline: [
      { id: 't1', kind: 'message', text: 'Нужна аренда 2-комнатной квартиры в Мирзо-Улугбеке, бюджет до $600…', at: '14:03', author: 'Мадина' },
      { id: 't2', kind: 'system', text: 'SLA первого ответа превышен на 7 минут', at: '14:18' },
    ],
  },
  {
    id: 'l3',
    name: 'Бобур Рахимов',
    phone: '+998 97 777 30 30',
    source: 'Звонок',
    minutesAgo: 95,
    slaMinutes: 15,
    status: 'contacted',
    owner: 'Дилноза К.',
    request: 'Продаёт 2-комнатную в Яккасарае, хочет оценку и эксклюзив на 2 месяца.',
    need: { deal: 'sale', rooms: 2, districts: ['Яккасарай'] },
    nextStep: { text: 'Выезд на оценку объекта', due: 'Сегодня, 17:00' },
    timeline: [
      { id: 't1', kind: 'call', text: 'Входящий звонок · 6 мин 12 сек. Собственник готов к эксклюзиву, если цена будет обоснована.', at: '12:50', author: 'Дилноза К.' },
      { id: 't2', kind: 'note', text: 'Подготовить 3 сопоставимых объекта по Яккасараю.', at: '12:58', author: 'Дилноза К.' },
    ],
  },
  {
    id: 'l4',
    name: 'Елена Ким',
    phone: '+998 91 404 22 11',
    source: 'OLX',
    minutesAgo: 1440,
    slaMinutes: 15,
    status: 'qualified',
    owner: 'Камила Ю.',
    request: 'Однокомнатная квартира в Мирабаде до $55 000, новостройка.',
    need: { deal: 'sale', rooms: 1, districts: ['Мирабад'], budgetMax: 55000 },
    nextStep: { text: 'Отправить подборку из 4 объектов', due: 'Вчера, 18:00', overdue: true },
    timeline: [
      { id: 't1', kind: 'message', text: 'Добрый день, объявление ещё актуально?', at: 'Вчера', author: 'Елена' },
      { id: 't2', kind: 'call', text: 'Квалификация: бюджет подтверждён, наличные.', at: 'Вчера', author: 'Камила Ю.' },
    ],
  },
  {
    id: 'l5',
    name: 'Жасур Холматов',
    phone: '+998 99 120 88 01',
    source: 'Рекомендация',
    minutesAgo: 2880,
    slaMinutes: 15,
    status: 'showing',
    owner: 'Тимур Х.',
    request: '4 комнаты, Юнусабад, до $140 000, рядом со школой.',
    need: { deal: 'sale', rooms: 4, districts: ['Юнусабад'], budgetMax: 140000 },
    nextStep: { text: 'Показ · Юнусабад, 11 квартал', due: 'Сегодня, 16:30' },
    timeline: [
      { id: 't1', kind: 'showing', text: 'Показ назначен на сегодня, 16:30', at: 'Пн', author: 'Тимур Х.' },
    ],
  },
  {
    id: 'l6',
    name: 'Гульнара Юсупова',
    phone: '+998 94 300 70 70',
    source: 'Сайт',
    minutesAgo: 4320,
    slaMinutes: 15,
    status: 'contacted',
    owner: 'Нодира С.',
    request: 'Аренда 1-комнатной в Чиланзаре до $400.',
    need: { deal: 'rent', rooms: 1, districts: ['Чиланзар'], budgetMax: 400 },
    timeline: [
      { id: 't1', kind: 'call', text: 'Не дозвонились, отправлено сообщение.', at: 'Сб', author: 'Нодира С.' },
    ],
  },
]

export const properties: Property[] = [
  {
    id: 'p1',
    title: '3-комн., ЖК Chilonzor City',
    district: 'Чиланзар',
    landmark: 'м. Новза',
    rooms: 3,
    area: 82,
    floor: 6,
    floorsTotal: 12,
    price: 82000,
    deal: 'sale',
    image: '/objects/1.png',
    status: 'available',
    verifiedDaysAgo: 2,
    agent: 'Дилноза К.',
    mortgage: true,
    renovation: 'Евроремонт',
  },
  {
    id: 'p2',
    title: '3-комн., 4 квартал',
    district: 'Юнусабад',
    landmark: 'ТЦ Mega Planet',
    rooms: 3,
    area: 76,
    floor: 3,
    floorsTotal: 9,
    price: 84500,
    deal: 'sale',
    image: '/objects/2.png',
    status: 'available',
    verifiedDaysAgo: 5,
    agent: 'Тимур Х.',
    mortgage: true,
    renovation: 'Хороший',
  },
  {
    id: 'p3',
    title: '3-комн., 9 квартал',
    district: 'Чиланзар',
    landmark: 'Чорсу 15 мин',
    rooms: 3,
    area: 70,
    floor: 4,
    floorsTotal: 4,
    price: 78000,
    deal: 'sale',
    image: '/objects/5.png',
    status: 'stale',
    verifiedDaysAgo: 34,
    agent: 'Азиз Р.',
    mortgage: false,
    renovation: 'Требует ремонта',
  },
  {
    id: 'p4',
    title: '3-комн., ЖК Yunusobod Park',
    district: 'Юнусабад',
    landmark: 'м. Шахристан',
    rooms: 3,
    area: 91,
    floor: 10,
    floorsTotal: 16,
    price: 92000,
    deal: 'sale',
    image: '/objects/6.png',
    status: 'available',
    verifiedDaysAgo: 1,
    agent: 'Камила Ю.',
    mortgage: true,
    renovation: 'Евроремонт',
  },
  {
    id: 'p5',
    title: '2-комн., Буюк Ипак Йули',
    district: 'Мирзо-Улугбек',
    landmark: 'м. Буюк Ипак Йули',
    rooms: 2,
    area: 58,
    floor: 5,
    floorsTotal: 9,
    price: 550,
    deal: 'rent',
    image: '/objects/4.png',
    status: 'available',
    verifiedDaysAgo: 3,
    agent: 'Азиз Р.',
    mortgage: false,
    renovation: 'Хороший',
  },
  {
    id: 'p6',
    title: '1-комн., ЖК Mirabad Avenue',
    district: 'Мирабад',
    landmark: 'Ташкент Сити 10 мин',
    rooms: 1,
    area: 44,
    floor: 8,
    floorsTotal: 14,
    price: 54000,
    deal: 'sale',
    image: '/objects/3.png',
    status: 'reserved',
    verifiedDaysAgo: 4,
    agent: 'Камила Ю.',
    mortgage: true,
    renovation: 'Коробка',
  },
  {
    id: 'p7',
    title: '2-комн., Кушбеги',
    district: 'Яккасарай',
    landmark: 'Парк Бабура',
    rooms: 2,
    area: 63,
    floor: 2,
    floorsTotal: 5,
    price: 71000,
    deal: 'sale',
    image: '/objects/1.png',
    status: 'available',
    verifiedDaysAgo: 9,
    agent: 'Дилноза К.',
    mortgage: true,
    renovation: 'Хороший',
  },
  {
    id: 'p8',
    title: '3-комн., Минор',
    district: 'Юнусабад',
    landmark: 'м. Минор',
    rooms: 3,
    area: 74,
    floor: 1,
    floorsTotal: 9,
    price: 79000,
    deal: 'sale',
    image: '/objects/2.png',
    status: 'available',
    verifiedDaysAgo: 18,
    agent: 'Нодира С.',
    mortgage: false,
    renovation: 'Хороший',
  },
]

export const deals: Deal[] = [
  { id: 'd1', client: 'Елена Ким', propertyId: 'p6', stage: 'selection', amount: 54000, commission: 1080, agent: 'Камила Ю.', daysInStage: 2, next: 'Отправить подборку' },
  { id: 'd2', client: 'Жасур Холматов', propertyId: 'p4', stage: 'showing', amount: 92000, commission: 1840, agent: 'Тимур Х.', daysInStage: 1, next: 'Показ сегодня, 16:30' },
  { id: 'd3', client: 'Ирода Саидова', propertyId: 'p2', stage: 'negotiation', amount: 84500, commission: 1690, agent: 'Тимур Х.', partner: 'Real Invest', daysInStage: 4, next: 'Ответ продавца по цене' },
  { id: 'd4', client: 'Фаррух Назаров', propertyId: 'p7', stage: 'approval', amount: 71000, commission: 1420, agent: 'Дилноза К.', daysInStage: 6, next: 'Одобрение ипотеки' },
  { id: 'd5', client: 'Мадина Алиева', propertyId: 'p5', stage: 'qualification', amount: 550, commission: 275, agent: 'Азиз Р.', daysInStage: 0, next: 'Первый звонок' },
  { id: 'd6', client: 'Отабек Мирзаев', propertyId: 'p1', stage: 'closing', amount: 82000, commission: 1640, agent: 'Дилноза К.', daysInStage: 2, next: 'Регистрация сделки' },
  { id: 'd7', client: 'Сардор Ахмедов', propertyId: 'p8', stage: 'negotiation', amount: 79000, commission: 1580, agent: 'Нодира С.', daysInStage: 9, next: 'Повторный показ' },
]

export const dealStages: { id: DealStage; label: string }[] = [
  { id: 'qualification', label: 'Квалификация' },
  { id: 'selection', label: 'Подбор' },
  { id: 'showing', label: 'Показ' },
  { id: 'negotiation', label: 'Переговоры' },
  { id: 'approval', label: 'Согласование' },
  { id: 'closing', label: 'Закрытие' },
]

export const showingsToday: Showing[] = [
  { id: 's1', time: '11:00', client: 'Ирода Саидова', propertyId: 'p2', listingId: 'listing-p2', confirmed: true },
  { id: 's2', time: '16:30', client: 'Жасур Холматов', propertyId: 'p4', listingId: 'listing-p4', confirmed: true },
  { id: 's3', time: '18:15', client: 'Сардор Ахмедов', propertyId: 'p8', listingId: 'listing-p8', confirmed: false },
]

export type ShowingOutcome = 'interested' | 'price' | 'district' | 'condition' | 'mismatch' | 'reschedule' | 'other'

export type CalendarShowing = {
  id: string
  day: number
  start: string
  duration: number
  client: string
  phone: string
  propertyId: string
  listingId: string
  agent: string
  confirmed: boolean
  result?: { outcome: ShowingOutcome; note?: string }
}

export const week = {
  label: '12 – 18 октября',
  todayIndex: 4,
  days: [
    { short: 'Пн', date: 12 },
    { short: 'Вт', date: 13 },
    { short: 'Ср', date: 14 },
    { short: 'Чт', date: 15 },
    { short: 'Пт', date: 16 },
    { short: 'Сб', date: 17 },
    { short: 'Вс', date: 18 },
  ],
}

export const showingOutcomes: { id: ShowingOutcome; label: string; positive?: boolean }[] = [
  { id: 'interested', label: 'Интересно', positive: true },
  { id: 'price', label: 'Отказ: цена' },
  { id: 'district', label: 'Отказ: район' },
  { id: 'condition', label: 'Отказ: состояние' },
  { id: 'mismatch', label: 'Не соответствует описанию' },
  { id: 'reschedule', label: 'Перенос' },
  { id: 'other', label: 'Другое' },
]

export const calendarShowings: CalendarShowing[] = [
  { id: 'c1', day: 1, start: '12:00', duration: 45, client: 'Сардор Ахмедов', phone: '+998 90 711 20 20', propertyId: 'p8', listingId: 'listing-p8', agent: 'Нодира С.', confirmed: true, result: { outcome: 'interested', note: 'Просит повторный показ с супругой' } },
  { id: 'c2', day: 2, start: '15:30', duration: 45, client: 'Ирода Саидова', phone: '+998 93 210 44 10', propertyId: 'p3', listingId: 'listing-p3', agent: 'Азиз Р.', confirmed: true, result: { outcome: 'condition', note: 'Нужен ремонт, не готовы вкладываться' } },
  { id: 'c3', day: 3, start: '10:00', duration: 60, client: 'Фаррух Назаров', phone: '+998 97 101 01 01', propertyId: 'p7', listingId: 'listing-p7', agent: 'Дилноза К.', confirmed: true, result: { outcome: 'interested' } },
  { id: 'c4', day: 3, start: '17:00', duration: 45, client: 'Елена Ким', phone: '+998 91 404 22 11', propertyId: 'p6', listingId: 'listing-p6', agent: 'Камила Ю.', confirmed: true },
  { id: 'c5', day: 4, start: '11:00', duration: 45, client: 'Ирода Саидова', phone: '+998 93 210 44 10', propertyId: 'p2', listingId: 'listing-p2', agent: 'Тимур Х.', confirmed: true },
  { id: 'c6', day: 4, start: '16:30', duration: 60, client: 'Жасур Холматов', phone: '+998 99 120 88 01', propertyId: 'p4', listingId: 'listing-p4', agent: 'Тимур Х.', confirmed: true },
  { id: 'c7', day: 4, start: '18:15', duration: 45, client: 'Сардор Ахмедов', phone: '+998 90 711 20 20', propertyId: 'p8', listingId: 'listing-p8', agent: 'Нодира С.', confirmed: false },
  { id: 'c8', day: 5, start: '11:00', duration: 60, client: 'Шахзод Турсунов', phone: '+998 90 123 45 67', propertyId: 'p1', listingId: 'listing-p1', agent: 'Дилноза К.', confirmed: false },
  { id: 'c9', day: 5, start: '11:30', duration: 45, client: 'Шахзод Турсунов', phone: '+998 90 123 45 67', propertyId: 'p2', listingId: 'listing-p2', agent: 'Дилноза К.', confirmed: false },
  { id: 'c10', day: 5, start: '15:00', duration: 45, client: 'Мадина Алиева', phone: '+998 93 555 12 09', propertyId: 'p5', listingId: 'listing-p5', agent: 'Азиз Р.', confirmed: true },
]

export type TeamRole = 'Собственник' | 'Руководитель' | 'Агент' | 'Оператор'

export type TeamMember = {
  name: string
  role: TeamRole
  activeLeads: number
  slaRate: number
  showingResultRate: number
  deals: number
  commission: number
  onDuty: boolean
}

export const teamMembers: TeamMember[] = [
  { name: 'Дилноза Каримова', role: 'Руководитель', activeLeads: 9, slaRate: 94, showingResultRate: 100, deals: 2, commission: 3060, onDuty: true },
  { name: 'Тимур Хасанов', role: 'Агент', activeLeads: 7, slaRate: 88, showingResultRate: 75, deals: 2, commission: 3530, onDuty: true },
  { name: 'Камила Юлдашева', role: 'Агент', activeLeads: 6, slaRate: 91, showingResultRate: 50, deals: 1, commission: 1080, onDuty: true },
  { name: 'Азиз Рашидов', role: 'Агент', activeLeads: 8, slaRate: 62, showingResultRate: 100, deals: 1, commission: 275, onDuty: true },
  { name: 'Нодира Султанова', role: 'Агент', activeLeads: 5, slaRate: 80, showingResultRate: 50, deals: 1, commission: 1580, onDuty: false },
  { name: 'Севара Мирзаева', role: 'Оператор', activeLeads: 0, slaRate: 97, showingResultRate: 0, deals: 0, commission: 0, onDuty: true },
]

export type CommissionStatus = 'expected' | 'pending' | 'approved' | 'paid'

export type Commission = {
  id: string
  dealId: string
  client: string
  propertyId: string
  kind: 'percent' | 'fixed'
  rate?: number
  base: number
  total: number
  agent: string
  agentShare: number
  partner?: { name: string; share: number }
  status: CommissionStatus
  payDate?: string
}

export const commissions: Commission[] = [
  { id: 'k1', dealId: 'd6', client: 'Отабек Мирзаев', propertyId: 'p1', kind: 'percent', rate: 2, base: 82000, total: 1640, agent: 'Дилноза К.', agentShare: 40, status: 'pending' },
  { id: 'k2', dealId: 'd3', client: 'Ирода Саидова', propertyId: 'p2', kind: 'percent', rate: 2, base: 84500, total: 1690, agent: 'Тимур Х.', agentShare: 40, partner: { name: 'Real Invest', share: 50 }, status: 'expected' },
  { id: 'k3', dealId: 'd4', client: 'Фаррух Назаров', propertyId: 'p7', kind: 'percent', rate: 2, base: 71000, total: 1420, agent: 'Дилноза К.', agentShare: 40, status: 'expected' },
  { id: 'k4', dealId: 'd5', client: 'Мадина Алиева', propertyId: 'p5', kind: 'fixed', base: 550, total: 275, agent: 'Азиз Р.', agentShare: 50, status: 'expected' },
  { id: 'k5', dealId: 'd0', client: 'Лола Каримова', propertyId: 'p4', kind: 'percent', rate: 2, base: 96000, total: 1920, agent: 'Камила Ю.', agentShare: 40, status: 'approved', payDate: '20 окт' },
  { id: 'k6', dealId: 'd00', client: 'Рустам Исаев', propertyId: 'p7', kind: 'fixed', base: 650, total: 325, agent: 'Нодира С.', agentShare: 50, status: 'paid', payDate: '9 окт' },
]

export const partners = [
  { name: 'Real Invest', deals: 1, split: '50/50', access: 'Только карточка объекта, без контактов собственника', since: 'сен 2026' },
  { name: 'Tashkent Homes', deals: 0, split: '40/60', access: 'Приглашение отправлено', since: 'ожидает' },
]

export function getProperty(id: string) {
  return properties.find((p) => p.id === id)
}

export function getLead(id: string) {
  return leads.find((l) => l.id === id)
}
