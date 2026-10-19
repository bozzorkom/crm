'use client'

import { useId } from 'react'
import { workspaceRoles } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useDemoRole } from './demo-role-provider'

export function DemoRoleSelect({ variant = 'sidebar' }: { variant?: 'sidebar' | 'compact' }) {
  const id = useId()
  const { role, setRole } = useDemoRole()

  return (
    <div className={variant === 'compact' ? 'flex items-center gap-1.5' : 'mt-1 flex flex-col gap-1'}>
      <label htmlFor={id} className={variant === 'compact' ? 'text-[10px] text-muted-foreground' : 'text-[10px] text-muted-foreground'}>
        {variant === 'compact' ? 'Демо' : 'Роль в демо'}
      </label>
      <select
        id={id}
        value={role}
        onChange={(event) => setRole(event.target.value as typeof role)}
        title="Переключение предназначено только для просмотра прототипа"
        aria-describedby={`${id}-hint`}
        className={cn(
          'cursor-pointer bg-transparent text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
          variant === 'compact'
            ? 'w-[88px] max-w-[88px] rounded-md border px-1.5 py-1.5'
            : 'w-full rounded-md border px-2 py-1.5',
        )}
      >
        {workspaceRoles.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span id={`${id}-hint`} className="sr-only">
        Это переключение показывает варианты интерфейса и не заменяет производственную проверку прав доступа.
      </span>
    </div>
  )
}
