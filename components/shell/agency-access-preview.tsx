'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { useDemoRole } from '@/components/shell/demo-role-provider'
import { buttonVariants } from '@/components/ui/button'
import { canViewAgencyPages } from '@/lib/roles'

export function AgencyAccessPreview({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const { role, isRoleReady, setRole } = useDemoRole()

  if (!isRoleReady) {
    return <div aria-busy="true" aria-label="Загрузка режима просмотра" className="min-h-40" />
  }

  if (canViewAgencyPages(role)) return children

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <PageHeader title={title} description={description} />
      <section className="flex flex-col items-start gap-4 rounded-2xl border p-5" aria-labelledby="agency-access-title">
        <div>
          <h2 id="agency-access-title" className="font-semibold">Этот экран предназначен для руководителя</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Вы переключили демо на роль агента. Переключатель показывает только варианты интерфейса: в рабочем продукте доступ к записям необходимо проверять на сервере.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setRole('manager')} className={buttonVariants()}>
            Посмотреть как руководитель
          </button>
          <Link href="/" className={buttonVariants({ variant: 'secondary' })}>
            Вернуться в «Сегодня»
          </Link>
        </div>
      </section>
    </div>
  )
}
