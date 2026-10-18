'use client'

import { useLeadWorkspace } from '@/components/leads/lead-workspace'

export function TodayGreeting({ firstName }: { firstName: string }) {
  const { leads } = useLeadWorkspace()
  const waiting = leads.filter((lead) => lead.status === 'new').length
  const plural = new Intl.PluralRules('ru').select(waiting)
  const noun = plural === 'one' ? 'обращение' : plural === 'few' ? 'обращения' : 'обращений'
  const verb = plural === 'one' ? 'ждёт' : 'ждут'

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">Добрый день, {firstName}</h1>
      <p className="text-muted-foreground text-pretty">
        {waiting} {noun} {verb} ответа. Вставьте запрос клиента, чтобы собрать черновик карточки и посмотреть подходящие объекты.
      </p>
    </div>
  )
}
